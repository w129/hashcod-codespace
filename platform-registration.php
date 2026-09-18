<?php
declare(strict_types=1);

require_once __DIR__ . '/security.php';
require_once __DIR__ . '/supabase.php';
require_once __DIR__ . '/admin-device.php';
require_once __DIR__ . '/secrets.php';

const HASHCOD_PLATFORM_REGISTRATION_TABLE = 'hashcod_platform_registrations';
const HASHCOD_PLATFORM_CODE_MAX_BYTES = 10485760;
const HASHCOD_PLATFORM_CODE_EXTENSIONS = [
    'zip','tar','gz','txt','md','json','js','jsx','ts','tsx','html','htm','css',
    'php','py','java','go','rs','cs','c','cc','cpp','h','hpp','sql','xml','yaml',
    'yml','toml','sh','coffee'
];

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
    $contentType = strtolower((string)($_SERVER['CONTENT_TYPE'] ?? ''));
    if (str_starts_with($contentType, 'multipart/form-data')) {
        return is_array($_POST) ? $_POST : [];
    }
    if (function_exists('securityReadJsonBody')) {
        $read = securityReadJsonBody(16384);
        if (empty($read['ok'])) hprJson(400, ['ok'=>false, 'error'=>$read['error'] ?? 'Solicitud inválida']);
        return is_array($read['data'] ?? null) ? $read['data'] : [];
    }
    $data = json_decode((string)file_get_contents('php://input'), true);
    return is_array($data) ? $data : [];
}

function hprReadCodeUpload(): array {
    $file = $_FILES['code_file'] ?? null;
    if (!is_array($file)) {
        hprJson(422, ['ok'=>false, 'error'=>'Debes subir el código de tu plataforma.']);
    }

    $error = (int)($file['error'] ?? UPLOAD_ERR_NO_FILE);
    if ($error !== UPLOAD_ERR_OK) {
        $message = $error === UPLOAD_ERR_INI_SIZE || $error === UPLOAD_ERR_FORM_SIZE
            ? 'El código supera el tamaño máximo permitido.'
            : 'No se pudo recibir el archivo de código.';
        hprJson(422, ['ok'=>false, 'error'=>$message]);
    }

    $tmp = (string)($file['tmp_name'] ?? '');
    $originalName = hprCleanText(basename((string)($file['name'] ?? '')), 255);
    if ($tmp === '' || !is_file($tmp) || $originalName === '') {
        hprJson(422, ['ok'=>false, 'error'=>'El archivo de código recibido no es válido.']);
    }

    $size = (int)@filesize($tmp);
    if ($size <= 0 || $size > HASHCOD_PLATFORM_CODE_MAX_BYTES) {
        hprJson(422, ['ok'=>false, 'error'=>'El código debe pesar entre 1 byte y 10 MB.']);
    }

    $extension = strtolower((string)pathinfo($originalName, PATHINFO_EXTENSION));
    if ($extension === '' || !in_array($extension, HASHCOD_PLATFORM_CODE_EXTENSIONS, true)) {
        hprJson(422, ['ok'=>false, 'error'=>'El formato del archivo de código no está permitido.']);
    }

    $mime = 'application/octet-stream';
    if (function_exists('finfo_open')) {
        $finfo = @finfo_open(FILEINFO_MIME_TYPE);
        if ($finfo) {
            $detected = @finfo_file($finfo, $tmp);
            if (is_string($detected) && $detected !== '') $mime = substr($detected, 0, 120);
            @finfo_close($finfo);
        }
    }

    $sha256 = (string)@hash_file('sha256', $tmp);
    if (!preg_match('/^[a-f0-9]{64}$/', $sha256)) {
        hprJson(422, ['ok'=>false, 'error'=>'No se pudo verificar la integridad del código.']);
    }

    $objectPath = 'platform-registrations/code/' . gmdate('Y/m') . '/'
        . bin2hex(random_bytes(16)) . '.' . $extension;

    return [
        'tmp_path'=>$tmp,
        'filename'=>$originalName,
        'mime_type'=>$mime,
        'size_bytes'=>$size,
        'sha256'=>$sha256,
        'storage_path'=>$objectPath,
    ];
}

function hprDeleteStorageObject(string $objectPath): void {
    if ($objectPath === '') return;
    $bucket = function_exists('supabaseStorageBucket') ? supabaseStorageBucket() : '';
    if ($bucket === '') return;
    @supabaseRequest(
        'storage/v1/object/' . rawurlencode($bucket) . '/' . ltrim(str_replace('\\', '/', $objectPath), '/'),
        ['method'=>'DELETE', 'use_secret'=>true, 'content_type'=>'', 'timeout'=>12]
    );
}

function hprValidate(array $input): array {
    $fullName = hprCleanText($input['full_name'] ?? '', 120);
    $age = filter_var($input['age'] ?? null, FILTER_VALIDATE_INT, ['options'=>['min_range'=>18, 'max_range'=>120]]);
    $cedula = hprCleanText($input['cedula'] ?? '', 13);
    $platformName = hprCleanText($input['platform_name'] ?? '', 120);
    $email = hprCleanText($input['email'] ?? '', 254);
    $phone = hprCleanText($input['phone'] ?? '', 32);
    $consentRaw = $input['consent'] ?? false;
    $consent = $consentRaw === true
        || in_array(strtolower(trim((string)$consentRaw)), ['1','true','on','yes'], true);

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

if ($method === 'GET' && (string)($_GET['status'] ?? '') === '1') {
    $cfg = supabaseConfig();
    $storageConfigured = !empty($cfg['configured']) && !empty($cfg['secret_key']);
    $tableReady = false;

    if ($storageConfigured) {
        $probe = supabaseDbSelect(HASHCOD_PLATFORM_REGISTRATION_TABLE, 'select=id,code_storage_path&limit=1');
        $tableReady = !empty($probe['ok']);
    }

    hprJson($tableReady ? 200 : 503, [
        'ok'=>$tableReady,
        'storage_configured'=>$storageConfigured,
        'table_ready'=>$tableReady,
    ]);
}

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
    $codeUpload = hprReadCodeUpload();

    $cfg = supabaseConfig();
    if (empty($cfg['configured']) || empty($cfg['secret_key'])) {
        hprJson(503, ['ok'=>false, 'error'=>'El almacenamiento seguro todavía no está disponible.']);
    }

    $uploadedCode = supabaseStorageUpload(
        $codeUpload['storage_path'],
        $codeUpload['tmp_path'],
        $codeUpload['mime_type'],
        true
    );
    if (empty($uploadedCode['ok'])) {
        hprJson(502, ['ok'=>false, 'error'=>'No se pudo subir el código de la plataforma en este momento.']);
    }

    $row = [
        'full_name_enc'=>secretsEncrypt($validated['full_name']),
        'age'=>$validated['age'],
        'cedula_enc'=>secretsEncrypt($validated['cedula']),
        'platform_name'=>$validated['platform_name'],
        'code_filename'=>$codeUpload['filename'],
        'code_mime_type'=>$codeUpload['mime_type'],
        'code_size_bytes'=>$codeUpload['size_bytes'],
        'code_sha256'=>$codeUpload['sha256'],
        'code_storage_path'=>$codeUpload['storage_path'],
        'email_enc'=>secretsEncrypt($validated['email']),
        'phone_enc'=>secretsEncrypt($validated['phone']),
    ];
    foreach (['full_name_enc','cedula_enc','email_enc','phone_enc'] as $encryptedField) {
        if (!is_string($row[$encryptedField]) || !str_starts_with($row[$encryptedField], 'l8e1:')) {
            hprJson(503, ['ok'=>false, 'error'=>'No se pudo proteger el registro antes de almacenarlo.']);
        }
    }

    $res = supabaseDbRequest(HASHCOD_PLATFORM_REGISTRATION_TABLE, [
        'method'=>'POST', 'use_secret'=>true,
        'headers'=>['Prefer: return=representation'],
        'body'=>[$row], 'timeout'=>8,
    ]);

    if (empty($res['ok'])) {
        hprDeleteStorageObject($codeUpload['storage_path']);
        $status = (int)($res['status'] ?? 0);
        $error = strtolower((string)($res['error'] ?? ''));
        if ($status === 404 || str_contains($error, 'relation')) {
            hprJson(503, ['ok'=>false, 'error'=>'La tabla de registros todavía no está inicializada.']);
        }
        if (str_contains($error, 'code_storage_path') || str_contains($error, 'code_filename')) {
            hprJson(503, ['ok'=>false, 'error'=>'La migración para guardar el código de la plataforma todavía no está aplicada.']);
        }
        hprJson(502, ['ok'=>false, 'error'=>'No se pudo guardar el registro en este momento.']);
    }

    $saved = is_array($res['body'] ?? null) && !empty($res['body'][0]) ? $res['body'][0] : [];
    hprJson(201, [
        'ok'=>true,
        'id'=>$saved['id'] ?? null,
        'code_uploaded'=>true,
        'code_filename'=>$codeUpload['filename'],
        'code_sha256'=>$codeUpload['sha256'],
    ]);
}

if ($method === 'GET' && (string)($_GET['view'] ?? '') === 'admin') {
    adminRequire();
    $cfg = supabaseConfig();
    if (empty($cfg['configured']) || empty($cfg['secret_key'])) {
        hprJson(503, ['ok'=>false, 'error'=>'El almacenamiento seguro todavía no está disponible.']);
    }
    $res = supabaseDbSelect(
        HASHCOD_PLATFORM_REGISTRATION_TABLE,
        'select=id,full_name_enc,age,cedula_enc,platform_name,code_filename,code_mime_type,code_size_bytes,code_sha256,code_storage_path,email_enc,phone_enc,created_at&order=created_at.desc&limit=500'
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
            'code_filename'=>(string)($stored['code_filename'] ?? ''),
            'code_mime_type'=>(string)($stored['code_mime_type'] ?? ''),
            'code_size_bytes'=>(int)($stored['code_size_bytes'] ?? 0),
            'code_sha256'=>(string)($stored['code_sha256'] ?? ''),
            'code_uploaded'=>((string)($stored['code_storage_path'] ?? '')) !== '',
            'email'=>secretsDecrypt((string)($stored['email_enc'] ?? '')),
            'phone'=>secretsDecrypt((string)($stored['phone_enc'] ?? '')),
            'created_at'=>(string)($stored['created_at'] ?? ''),
        ];
    }
    hprJson(200, ['ok'=>true, 'rows'=>$rows, 'count'=>count($rows)]);
}

header('Allow: GET, POST');
hprJson(405, ['ok'=>false, 'error'=>'Método no permitido.']);
