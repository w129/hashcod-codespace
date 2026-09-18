<?php
declare(strict_types=1);

require_once __DIR__ . '/supabase.php';
require_once __DIR__ . '/secrets.php';
require_once __DIR__ . '/security.php';
require_once __DIR__ . '/admin-device.php';

const HASHCOD_ACCESS_REQUEST_TABLE = 'hashcod_access_requests';

function hairJson(array $payload, int $status = 200): void {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    header('Pragma: no-cache');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function hairReadJson(): array {
    $raw = file_get_contents('php://input', false, null, 0, 65537);
    if (!is_string($raw) || trim($raw) === '') return [];
    if (strlen($raw) > 65536) {
        hairJson(['ok' => false, 'error' => 'Solicitud demasiado grande.'], 413);
    }
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

function hairRequireAjaxPost(): void {
    if (strtoupper((string)($_SERVER['REQUEST_METHOD'] ?? 'GET')) !== 'POST') {
        hairJson(['ok' => false, 'error' => 'Método no permitido.'], 405);
    }
    $xrw = (string)($_SERVER['HTTP_X_REQUESTED_WITH'] ?? '');
    if (strcasecmp($xrw, 'XMLHttpRequest') !== 0) {
        hairJson(['ok' => false, 'error' => 'Solicitud no autorizada.'], 403);
    }
}

function hairTrim($value, int $max): string {
    $value = trim((string)$value);
    if (function_exists('mb_substr')) return mb_substr($value, 0, $max, 'UTF-8');
    return substr($value, 0, $max);
}

function hairNormalize(array $body): array {
    $fullName = preg_replace('/\s+/u', ' ', hairTrim($body['full_name'] ?? '', 160));
    $age = filter_var($body['age'] ?? null, FILTER_VALIDATE_INT);
    $cedula = hairTrim($body['cedula'] ?? '', 20);
    $platform = preg_replace('/\s+/u', ' ', hairTrim($body['platform_name'] ?? '', 120));
    $email = strtolower(hairTrim($body['email'] ?? '', 254));
    $phone = hairTrim($body['phone'] ?? '', 32);

    $errors = [];

    $nameParts = preg_split('/\s+/u', $fullName, -1, PREG_SPLIT_NO_EMPTY);
    if ($fullName === '' || strlen($fullName) < 5 || count($nameParts ?: []) < 2) {
        $errors['full_name'] = 'Escribe tu nombre con apellidos.';
    }

    if ($age === false || $age < 18 || $age > 120) {
        $errors['age'] = 'Debes tener 18 años o más para continuar.';
    }

    if (!preg_match('/^\d{3}-\d{7}-\d$/', $cedula)) {
        $errors['cedula'] = 'Usa el formato 000-0000000-0.';
    }

    if ($platform === '' || strlen($platform) < 2) {
        $errors['platform_name'] = 'Escribe el nombre de tu plataforma.';
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $errors['email'] = 'Escribe un correo electrónico válido.';
    }

    $phoneDigits = preg_replace('/\D+/', '', $phone);
    if (!is_string($phoneDigits) || strlen($phoneDigits) < 7 || strlen($phoneDigits) > 15) {
        $errors['phone'] = 'Escribe un número de teléfono válido.';
    }

    return [
        'valid' => $errors === [],
        'errors' => $errors,
        'data' => [
            'full_name' => $fullName,
            'age' => $age === false ? 0 : (int)$age,
            'cedula' => $cedula,
            'platform_name' => $platform,
            'email' => $email,
            'phone' => $phone,
        ],
    ];
}

function hairSeal(string $value): string {
    $sealed = secretsEncrypt($value);
    if (!is_string($sealed) || !str_starts_with($sealed, 'l8e1:')) {
        throw new RuntimeException('No se pudo cifrar la información sensible.');
    }
    return $sealed;
}

function hairOpen($value): string {
    if (!is_string($value) || $value === '') return '';
    try {
        $opened = secretsDecrypt($value);
        return is_string($opened) ? $opened : '';
    } catch (Throwable $e) {
        return '';
    }
}

function hairSubmit(): void {
    hairRequireAjaxPost();

    $rate = securityRateAllowSliding('hashcod_access_request_submit', 8, 3600);
    if (empty($rate['allowed'])) {
        hairJson([
            'ok' => false,
            'error' => 'Demasiados envíos desde este dispositivo. Intenta más tarde.',
            'retry_after' => (int)($rate['retry_after'] ?? 3600),
        ], 429);
    }

    $normalized = hairNormalize(hairReadJson());
    if (empty($normalized['valid'])) {
        hairJson([
            'ok' => false,
            'error' => 'Revisa los campos marcados.',
            'fields' => $normalized['errors'],
        ], 422);
    }

    $cfg = supabaseConfig();
    if (empty($cfg['configured']) || empty($cfg['secret_key'])) {
        hairJson([
            'ok' => false,
            'error' => 'El almacenamiento seguro no está disponible en este momento.',
            'code' => 'secure_storage_unavailable',
        ], 503);
    }

    $d = $normalized['data'];
    try {
        $row = [[
            'full_name_enc' => hairSeal($d['full_name']),
            'age' => $d['age'],
            'cedula_enc' => hairSeal($d['cedula']),
            'platform_name' => $d['platform_name'],
            'email_enc' => hairSeal($d['email']),
            'phone_enc' => hairSeal($d['phone']),
            'source' => 'final_entry_form',
        ]];
    } catch (Throwable $e) {
        hairJson(['ok' => false, 'error' => 'No se pudo proteger la información antes de guardarla.'], 500);
    }

    $res = supabaseRequest('/rest/v1/' . HASHCOD_ACCESS_REQUEST_TABLE, [
        'method' => 'POST',
        'use_secret' => true,
        'body' => $row,
        'headers' => ['Prefer: return=minimal'],
        'timeout' => 8,
    ]);

    if (empty($res['ok'])) {
        $status = (int)($res['status'] ?? 0);
        $missingTable = $status === 404 || str_contains(strtolower((string)($res['error'] ?? '')), 'relation');
        hairJson([
            'ok' => false,
            'error' => $missingTable
                ? 'La tabla segura de registros todavía no está disponible.'
                : 'No se pudo guardar el registro. Intenta de nuevo.',
            'code' => $missingTable ? 'table_not_ready' : 'database_write_failed',
        ], $missingTable ? 503 : 502);
    }

    hairJson([
        'ok' => true,
        'message' => 'Información enviada y guardada correctamente.',
    ], 201);
}

function hairList(): void {
    if (strtoupper((string)($_SERVER['REQUEST_METHOD'] ?? 'GET')) !== 'GET') {
        hairJson(['ok' => false, 'error' => 'Método no permitido.'], 405);
    }

    adminRequire();

    $res = supabaseDbSelect(
        HASHCOD_ACCESS_REQUEST_TABLE,
        'select=id,full_name_enc,age,cedula_enc,platform_name,email_enc,phone_enc,submitted_at'
        . '&order=submitted_at.desc&limit=500'
    );

    if (empty($res['ok'])) {
        hairJson([
            'ok' => false,
            'error' => 'No se pudieron cargar los registros protegidos.',
            'code' => 'database_read_failed',
        ], 502);
    }

    $rows = is_array($res['body'] ?? null) ? $res['body'] : [];
    $out = [];
    foreach ($rows as $row) {
        if (!is_array($row)) continue;
        $out[] = [
            'id' => (string)($row['id'] ?? ''),
            'full_name' => hairOpen($row['full_name_enc'] ?? ''),
            'age' => (int)($row['age'] ?? 0),
            'cedula' => hairOpen($row['cedula_enc'] ?? ''),
            'platform_name' => (string)($row['platform_name'] ?? ''),
            'email' => hairOpen($row['email_enc'] ?? ''),
            'phone' => hairOpen($row['phone_enc'] ?? ''),
            'submitted_at' => (string)($row['submitted_at'] ?? ''),
        ];
    }

    hairJson(['ok' => true, 'records' => $out]);
}

function hashcodAccessIntakeApi(string $path): void {
    if ($path === '/api/access-intake/submit') {
        hairSubmit();
    }
    if ($path === '/api/access-intake/list') {
        hairList();
    }
}
