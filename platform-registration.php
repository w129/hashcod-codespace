<?php
declare(strict_types=1);

require_once __DIR__ . '/security.php';
require_once __DIR__ . '/supabase.php';
require_once __DIR__ . '/admin-device.php';
require_once __DIR__ . '/secrets.php';

const HASHCOD_PLATFORM_REGISTRATION_TABLE = 'hashcod_platform_registrations';
const HASHCOD_PLATFORM_REGISTRATION_FALLBACK_TABLE = 'l8_durable_objects';
const HASHCOD_PLATFORM_REGISTRATION_FALLBACK_ACCOUNT = 'system_platform_registrations';
const HASHCOD_PLATFORM_REGISTRATION_FALLBACK_NAMESPACE = 'platform_registration';

function hprJson(int $status, array $body): never {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store, private');
    header('X-Content-Type-Options: nosniff');
    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function hprSameOrigin(): bool {
    if (function_exists('hashcodDesktopBridgeValid') && hashcodDesktopBridgeValid()) return true;
    $site = strtolower(trim((string)($_SERVER['HTTP_SEC_FETCH_SITE'] ?? '')));
    if ($site === 'cross-site' || $site === 'same-site') return false;
    if ($site === 'same-origin' || $site === 'none') return true;
    $origin = trim((string)($_SERVER['HTTP_ORIGIN'] ?? ''));
    if ($origin === '') return true;
    $host = trim((string)($_SERVER['HTTP_HOST'] ?? ''));
    if ($host === '') return false;
    $parts = parse_url($origin);
    $originHost = strtolower((string)($parts['host'] ?? ''));
    $originPort = isset($parts['port']) ? ':' . (int)$parts['port'] : '';
    return strtolower($host) === $originHost . $originPort;
}

function hprCleanText(mixed $value, int $max): string {
    $text = trim((string)$value);
    $text = preg_replace('/[\x00-\x1F\x7F]/u', '', $text) ?? '';
    return function_exists('mb_substr') ? mb_substr($text, 0, $max, 'UTF-8') : substr($text, 0, $max);
}

function hprReadBody(): array {
    if (function_exists('securityReadJsonBody')) {
        $read = securityReadJsonBody(16384);
        if (empty($read['ok'])) hprJson(400, ['ok'=>false, 'error'=>$read['error'] ?? 'Solicitud inválida']);
        return is_array($read['data'] ?? null) ? $read['data'] : [];
    }
    $data = json_decode((string)file_get_contents('php://input'), true);
    return is_array($data) ? $data : [];
}

function hprMissingDedicatedTable(array $res): bool {
    if (!empty($res['ok'])) return false;
    $status = (int)($res['status'] ?? 0);
    $haystack = strtolower((string)json_encode([
        $res['error'] ?? '',
        $res['body'] ?? null,
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    return $status === 404
        || str_contains($haystack, 'pgrst205')
        || str_contains($haystack, 'could not find the table')
        || (str_contains($haystack, 'relation') && str_contains($haystack, 'does not exist'));
}

function hprFallbackStore(array $encryptedRow): array {
    $id = 'platform_reg_' . gmdate('YmdHis') . '_' . bin2hex(random_bytes(8));
    $now = gmdate('c');
    return supabaseDbUpsert(HASHCOD_PLATFORM_REGISTRATION_FALLBACK_TABLE, [[
        'id'=>$id,
        'account_key'=>HASHCOD_PLATFORM_REGISTRATION_FALLBACK_ACCOUNT,
        'namespace'=>HASHCOD_PLATFORM_REGISTRATION_FALLBACK_NAMESPACE,
        'name'=>'platform_registration',
        'storage_data'=>['registration'=>$encryptedRow],
        'version'=>1,
        'is_deleted'=>false,
        'created_at'=>$now,
        'updated_at'=>$now,
    ]], 'id');
}

function hprFallbackRows(): array {
    $query = 'select=id,storage_data,created_at'
        . '&account_key=eq.' . rawurlencode(HASHCOD_PLATFORM_REGISTRATION_FALLBACK_ACCOUNT)
        . '&namespace=eq.' . rawurlencode(HASHCOD_PLATFORM_REGISTRATION_FALLBACK_NAMESPACE)
        . '&is_deleted=eq.false&order=created_at.desc&limit=500';
    return supabaseDbSelect(HASHCOD_PLATFORM_REGISTRATION_FALLBACK_TABLE, $query);
}

function hprDecryptRow(array $stored, bool $fallback = false): array {
    $data = $stored;
    if ($fallback) {
        $storage = $stored['storage_data'] ?? [];
        if (is_string($storage)) {
            $decoded = json_decode($storage, true);
            $storage = is_array($decoded) ? $decoded : [];
        }
        $data = is_array($storage['registration'] ?? null) ? $storage['registration'] : [];
    }
    return [
        'id'=>$stored['id'] ?? ($data['id'] ?? null),
        'full_name'=>secretsDecrypt((string)($data['full_name_enc'] ?? '')),
        'age'=>(int)($data['age'] ?? 0),
        'cedula'=>secretsDecrypt((string)($data['cedula_enc'] ?? '')),
        'platform_name'=>(string)($data['platform_name'] ?? ''),
        'email'=>secretsDecrypt((string)($data['email_enc'] ?? '')),
        'phone'=>secretsDecrypt((string)($data['phone_enc'] ?? '')),
        'created_at'=>(string)($stored['created_at'] ?? ($data['created_at'] ?? '')),
        'storage_backend'=>$fallback ? 'protected-fallback' : 'dedicated',
    ];
}

function hprValidate(array $input): array {
    $fullName = hprCleanText($input['full_name'] ?? '', 120);
    $age = filter_var($input['age'] ?? null, FILTER_VALIDATE_INT, ['options'=>['min_range'=>18, 'max_range'=>120]]);
    $cedula = hprCleanText($input['cedula'] ?? '', 13);
    $platformName = hprCleanText($input['platform_name'] ?? '', 120);
    $email = hprCleanText($input['email'] ?? '', 254);
    $phone = hprCleanText($input['phone'] ?? '', 32);
    $consent = ($input['consent'] ?? false) === true;

    if (strlen($fullName) < 4 || !preg_match('/^\S+\s+\S+/u', $fullName)) hprJson(422, ['ok'=>false, 'error'=>'Introduce nombre y apellidos.']);
    if ($age === false) hprJson(422, ['ok'=>false, 'error'=>'Debes tener 18 años o más para registrarte.']);
    if (!preg_match('/^\d{3}-\d{7}-\d$/', $cedula)) hprJson(422, ['ok'=>false, 'error'=>'La cédula debe usar el formato 000-0000000-0.']);
    if (strlen($platformName) < 2) hprJson(422, ['ok'=>false, 'error'=>'Introduce el nombre de tu plataforma.']);
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) hprJson(422, ['ok'=>false, 'error'=>'Introduce un correo electrónico válido.']);
    if (!preg_match('/^\+?[0-9][0-9\s().-]{6,24}$/', $phone)) hprJson(422, ['ok'=>false, 'error'=>'Introduce un número de teléfono válido.']);
    if (!$consent) hprJson(422, ['ok'=>false, 'error'=>'Debes confirmar que tienes 18 años o más y aceptar el tratamiento de los datos.']);

    return [
        'full_name'=>$fullName, 'age'=>(int)$age, 'cedula'=>$cedula,
        'platform_name'=>$platformName, 'email'=>strtolower($email), 'phone'=>$phone,
    ];
}

$method = strtoupper((string)($_SERVER['REQUEST_METHOD'] ?? 'GET'));

if ($method === 'POST') {
    if (!hprSameOrigin()) hprJson(403, ['ok'=>false, 'error'=>'Origen no autorizado.']);
    if (strcasecmp((string)($_SERVER['HTTP_X_REQUESTED_WITH'] ?? ''), 'XMLHttpRequest') !== 0) {
        hprJson(403, ['ok'=>false, 'error'=>'Solicitud no autorizada.']);
    }

    if (function_exists('securityRateAllowSliding')) {
        $clientIp = function_exists('securityClientIp') ? securityClientIp() : (string)($_SERVER['REMOTE_ADDR'] ?? '127.0.0.1');
        $rate = securityRateAllowSliding('platform_registration_submit', 8, 600, $clientIp);
        if (empty($rate['allowed'])) {
            header('Retry-After: ' . max(1, (int)($rate['retry_after'] ?? 60)));
            hprJson(429, ['ok'=>false, 'error'=>'Demasiados intentos. Inténtalo de nuevo más tarde.']);
        }
    }

    $validated = hprValidate(hprReadBody());
    $row = [
        'full_name_enc'=>secretsEncrypt($validated['full_name']),
        'age'=>$validated['age'],
        'cedula_enc'=>secretsEncrypt($validated['cedula']),
        'platform_name'=>$validated['platform_name'],
        'email_enc'=>secretsEncrypt($validated['email']),
        'phone_enc'=>secretsEncrypt($validated['phone']),
    ];
    foreach (['full_name_enc','cedula_enc','email_enc','phone_enc'] as $encryptedField) {
        if (!is_string($row[$encryptedField]) || !str_starts_with($row[$encryptedField], 'l8e1:')) {
            hprJson(503, ['ok'=>false, 'error'=>'No se pudo proteger el registro antes de almacenarlo.']);
        }
    }

    $cfg = supabaseConfig();
    if (empty($cfg['configured']) || empty($cfg['secret_key'])) {
        hprJson(503, ['ok'=>false, 'error'=>'El almacenamiento seguro todavía no está disponible.']);
    }

    $res = supabaseDbRequest(HASHCOD_PLATFORM_REGISTRATION_TABLE, [
        'method'=>'POST', 'use_secret'=>true,
        'headers'=>['Prefer: return=representation'],
        'body'=>[$row], 'timeout'=>8,
    ]);

    if (empty($res['ok'])) {
        if (!hprMissingDedicatedTable($res)) {
            hprJson(502, ['ok'=>false, 'error'=>'No se pudo guardar el registro en este momento.']);
        }

        // The dedicated migration may not have reached this deployment yet.
        // Fall back to the already-protected durable-object table so submissions
        // remain durable and service-role-only instead of being lost.
        $fallback = hprFallbackStore($row);
        if (empty($fallback['ok'])) {
            hprJson(502, ['ok'=>false, 'error'=>'No se pudo guardar el registro en el almacenamiento seguro.']);
        }
        hprJson(201, ['ok'=>true, 'id'=>null, 'storage'=>'protected-fallback']);
    }

    $saved = is_array($res['body'] ?? null) && !empty($res['body'][0]) ? $res['body'][0] : [];
    hprJson(201, ['ok'=>true, 'id'=>$saved['id'] ?? null, 'storage'=>'dedicated']);
}

if ($method === 'GET' && (string)($_GET['view'] ?? '') === 'admin') {
    adminRequire();
    $cfg = supabaseConfig();
    if (empty($cfg['configured']) || empty($cfg['secret_key'])) {
        hprJson(503, ['ok'=>false, 'error'=>'El almacenamiento seguro todavía no está disponible.']);
    }
    $dedicated = supabaseDbSelect(
        HASHCOD_PLATFORM_REGISTRATION_TABLE,
        'select=id,full_name_enc,age,cedula_enc,platform_name,email_enc,phone_enc,created_at&order=created_at.desc&limit=500'
    );
    $fallback = hprFallbackRows();

    if (empty($dedicated['ok']) && !hprMissingDedicatedTable($dedicated) && empty($fallback['ok'])) {
        hprJson(502, ['ok'=>false, 'error'=>'No se pudo cargar la tabla de registros.']);
    }

    $rows = [];
    if (!empty($dedicated['ok']) && is_array($dedicated['body'] ?? null)) {
        foreach ($dedicated['body'] as $stored) {
            if (is_array($stored)) $rows[] = hprDecryptRow($stored, false);
        }
    }
    if (!empty($fallback['ok']) && is_array($fallback['body'] ?? null)) {
        foreach ($fallback['body'] as $stored) {
            if (is_array($stored)) $rows[] = hprDecryptRow($stored, true);
        }
    }

    usort($rows, static function (array $a, array $b): int {
        return strcmp((string)($b['created_at'] ?? ''), (string)($a['created_at'] ?? ''));
    });
    if (count($rows) > 500) $rows = array_slice($rows, 0, 500);

    hprJson(200, ['ok'=>true, 'rows'=>$rows, 'count'=>count($rows)]);
}

header('Allow: GET, POST');
hprJson(405, ['ok'=>false, 'error'=>'Método no permitido.']);
