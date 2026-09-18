<?php
declare(strict_types=1);

require_once __DIR__ . '/security.php';
require_once __DIR__ . '/supabase.php';
require_once __DIR__ . '/admin-device.php';
require_once __DIR__ . '/secrets.php';

const HASHCOD_PLATFORM_REGISTRATION_TABLE = 'hashcod_platform_registrations';

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
        $status = (int)($res['status'] ?? 0);
        $error = strtolower((string)($res['error'] ?? ''));
        if ($status === 404 || str_contains($error, 'relation')) {
            hprJson(503, ['ok'=>false, 'error'=>'La tabla de registros todavía no está inicializada.']);
        }
        hprJson(502, ['ok'=>false, 'error'=>'No se pudo guardar el registro en este momento.']);
    }

    $saved = is_array($res['body'] ?? null) && !empty($res['body'][0]) ? $res['body'][0] : [];
    hprJson(201, ['ok'=>true, 'id'=>$saved['id'] ?? null]);
}

if ($method === 'GET' && (string)($_GET['view'] ?? '') === 'admin') {
    adminRequire();
    $cfg = supabaseConfig();
    if (empty($cfg['configured']) || empty($cfg['secret_key'])) {
        hprJson(503, ['ok'=>false, 'error'=>'El almacenamiento seguro todavía no está disponible.']);
    }
    $res = supabaseDbSelect(
        HASHCOD_PLATFORM_REGISTRATION_TABLE,
        'select=id,full_name_enc,age,cedula_enc,platform_name,email_enc,phone_enc,created_at&order=created_at.desc&limit=500'
    );
    if (empty($res['ok'])) hprJson(502, ['ok'=>false, 'error'=>'No se pudo cargar la tabla de registros.']);

    $storedRows = is_array($res['body'] ?? null) ? $res['body'] : [];
    $rows = [];
    foreach ($storedRows as $stored) {
        if (!is_array($stored)) continue;
        $rows[] = [
            'id'=>$stored['id'] ?? null,
            'full_name'=>secretsDecrypt((string)($stored['full_name_enc'] ?? '')),
            'age'=>(int)($stored['age'] ?? 0),
            'cedula'=>secretsDecrypt((string)($stored['cedula_enc'] ?? '')),
            'platform_name'=>(string)($stored['platform_name'] ?? ''),
            'email'=>secretsDecrypt((string)($stored['email_enc'] ?? '')),
            'phone'=>secretsDecrypt((string)($stored['phone_enc'] ?? '')),
            'created_at'=>(string)($stored['created_at'] ?? ''),
        ];
    }
    hprJson(200, ['ok'=>true, 'rows'=>$rows, 'count'=>count($rows)]);
}

header('Allow: GET, POST');
hprJson(405, ['ok'=>false, 'error'=>'Método no permitido.']);
