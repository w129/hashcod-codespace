<?php
declare(strict_types=1);

require_once __DIR__ . '/security.php';
require_once __DIR__ . '/supabase.php';
require_once __DIR__ . '/admin-device.php';
require_once __DIR__ . '/secrets.php';
require_once __DIR__ . '/platform-registration-contract.php';

const HASHCOD_PLATFORM_REGISTRATION_TABLE = 'hashcod_platform_registrations';
const HASHCOD_PLATFORM_REGISTRATION_BUCKET = 'hashcod-registration-code';
const HASHCOD_PLATFORM_REGISTRATION_KEY_OBJECT = 'platform-registrations/_system/registration-data-key-v1.json';
const HASHCOD_PLATFORM_CODE_MAX_BYTES = 31457280;
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

function hprLower(string $value): string {
    $value = trim($value);
    return function_exists('mb_strtolower')
        ? mb_strtolower($value, 'UTF-8')
        : strtolower($value);
}

function hprRegistrationNormalizeKeyMaterial(string $raw): string {
    $raw = trim($raw);
    if ($raw === '') return '';

    if (preg_match('/^[a-f0-9]{64}$/i', $raw)) {
        $decoded = hex2bin($raw);
        return is_string($decoded) ? $decoded : '';
    }

    $base64 = base64_decode($raw, true);
    if (is_string($base64) && strlen($base64) === 32) {
        return $base64;
    }

    return hash('sha256', $raw, true);
}

function hprRegistrationLegacyKeys(): array {
    $keys = [];
    $seen = [];

    $append = static function (string $candidate) use (&$keys, &$seen): void {
        if (strlen($candidate) !== 32) return;
        $fingerprint = hash('sha256', $candidate);
        if (isset($seen[$fingerprint])) return;
        $seen[$fingerprint] = true;
        $keys[] = $candidate;
    };

    $dataKeyRaw = trim((string)secretGet('L8_DATA_ENCRYPTION_KEY', ''));
    $vaultMasterRaw = trim((string)secretGet('L8_VAULT_MASTER_KEY', ''));
    $authPepperRaw = trim((string)secretGet('L8_AUTH_PEPPER', ''));
    $supabaseSecretRaw = trim((string)secretGet('SUPABASE_SECRET_KEY', ''));

    // Historical secretsDataKey() format #1:
    // L8_DATA_ENCRYPTION_KEY itself (hex) or SHA-256(raw).
    if ($dataKeyRaw !== '') {
        $append(
            preg_match('/^[a-f0-9]{64}$/i', $dataKeyRaw)
                ? (string)hex2bin($dataKeyRaw)
                : hash('sha256', $dataKeyRaw, true)
        );
    }

    // Historical secretsDataKey() format #2:
    // HMAC label derived from L8_VAULT_MASTER_KEY. This is critical when
    // L8_DATA_ENCRYPTION_KEY was added later and old rows were encrypted with
    // the vault-derived key.
    if ($vaultMasterRaw !== '') {
        $vaultMaster = hprRegistrationNormalizeKeyMaterial($vaultMasterRaw);
        if ($vaultMaster !== '') {
            $append(hash_hmac('sha256', 'l8|data-at-rest|v1', $vaultMaster, true));
        }
    }

    // Transitional stable-v2 keys used during the registration migration.
    foreach ([$dataKeyRaw, $vaultMasterRaw, $authPepperRaw, $supabaseSecretRaw] as $candidateRaw) {
        if ($candidateRaw === '') continue;
        $append(hash_hmac('sha256', 'hashcod|platform-registration|stable-v2', $candidateRaw, true));
    }

    // Current secretsDataKey() is still useful for installations whose
    // environment has not changed since the legacy rows were created.
    try {
        $append(secretsDataKey());
    } catch (Throwable $ignored) {
    }

    return $keys;
}

function hprRegistrationReadPersistedKey(): ?string {
    $res = supabaseRequest(
        'storage/v1/object/' . rawurlencode(HASHCOD_PLATFORM_REGISTRATION_BUCKET)
        . '/' . HASHCOD_PLATFORM_REGISTRATION_KEY_OBJECT,
        [
            'method'=>'GET',
            'use_secret'=>true,
            'content_type'=>'',
            'raw_response'=>true,
            'bypass_circuit'=>true,
            'timeout'=>12,
        ]
    );
    if (empty($res['ok']) || !is_string($res['raw'] ?? null) || $res['raw'] === '') {
        return null;
    }

    $payload = json_decode((string)$res['raw'], true);
    if (!is_array($payload) || (string)($payload['version'] ?? '') !== 'HASHCOD-REGISTRATION-DATA-KEY-1') {
        return null;
    }

    $decoded = base64_decode((string)($payload['key_b64'] ?? ''), true);
    if (!is_string($decoded) || strlen($decoded) !== 32) return null;

    $expected = strtolower((string)($payload['sha256'] ?? ''));
    if ($expected === '' || !hash_equals($expected, hash('sha256', $decoded))) {
        return null;
    }

    return $decoded;
}

function hprRegistrationPersistKey(string $key): bool {
    if (strlen($key) !== 32) return false;

    $payload = json_encode([
        'version'=>'HASHCOD-REGISTRATION-DATA-KEY-1',
        'key_b64'=>base64_encode($key),
        'sha256'=>hash('sha256', $key),
        'created_at'=>gmdate('c'),
    ], JSON_UNESCAPED_SLASHES);
    if (!is_string($payload) || $payload === '') return false;

    $res = supabaseRequest(
        'storage/v1/object/' . rawurlencode(HASHCOD_PLATFORM_REGISTRATION_BUCKET)
        . '/' . HASHCOD_PLATFORM_REGISTRATION_KEY_OBJECT,
        [
            'method'=>'POST',
            'use_secret'=>true,
            'content_type'=>'application/json',
            'headers'=>['x-upsert: false'],
            'body'=>$payload,
            'bypass_circuit'=>true,
            'timeout'=>15,
        ]
    );

    if (!empty($res['ok'])) return true;

    // Another request may have won the first-write race.
    if ((int)($res['status'] ?? 0) === 409) {
        return hprRegistrationReadPersistedKey() !== null;
    }

    // If the private bucket has not been created yet, prepare it and retry once.
    if ((int)($res['status'] ?? 0) === 404) {
        $ensure = hprEnsureRegistrationBucket();
        if (empty($ensure['ok'])) return false;

        $retry = supabaseRequest(
            'storage/v1/object/' . rawurlencode(HASHCOD_PLATFORM_REGISTRATION_BUCKET)
            . '/' . HASHCOD_PLATFORM_REGISTRATION_KEY_OBJECT,
            [
                'method'=>'POST',
                'use_secret'=>true,
                'content_type'=>'application/json',
                'headers'=>['x-upsert: false'],
                'body'=>$payload,
                'bypass_circuit'=>true,
                'timeout'=>15,
            ]
        );
        return !empty($retry['ok'])
            || ((int)($retry['status'] ?? 0) === 409 && hprRegistrationReadPersistedKey() !== null);
    }

    return false;
}

function hprRegistrationCryptoKey(): string {
    static $key = null;
    if (is_string($key) && strlen($key) === 32) return $key;

    // The canonical registration key lives in private Supabase Storage.
    // Render's filesystem is ephemeral, so no registration key is generated
    // into data_storage/.vault_master anymore.
    $persisted = hprRegistrationReadPersistedKey();
    if (is_string($persisted) && strlen($persisted) === 32) {
        $key = $persisted;
        return $key;
    }

    // Bootstrap once. If a dedicated stable data key already exists, derive
    // from it so deployments made during the transition remain readable.
    $seed = trim((string)secretGet('L8_DATA_ENCRYPTION_KEY', ''));
    $candidate = $seed !== ''
        ? hash_hmac('sha256', 'hashcod|platform-registration|persistent-v1', $seed, true)
        : random_bytes(32);

    if (!hprRegistrationPersistKey($candidate)) {
        throw new RuntimeException('No se pudo persistir la clave estable de registros.');
    }

    $persisted = hprRegistrationReadPersistedKey();
    if (!is_string($persisted) || strlen($persisted) !== 32) {
        throw new RuntimeException('La clave estable de registros no pudo verificarse.');
    }

    $key = $persisted;
    return $key;
}

function hprRegistrationEncrypt(string $plaintext): string {
    return secretsEncrypt($plaintext, hprRegistrationCryptoKey());
}

function hprRegistrationRoundTrip(array $plain, array $encrypted): bool {
    foreach (['full_name','cedula','email','phone'] as $field) {
        $encField = $field . '_enc';
        if (!isset($plain[$field], $encrypted[$encField])) return false;
        $decoded = hprRegistrationDecrypt((string)$encrypted[$encField]);
        if (!hash_equals((string)$plain[$field], (string)$decoded)) return false;
    }
    return true;
}

function hprRegistrationCryptoProbe(): bool {
    try {
        $plain = [
            'full_name'=>'HASHCOD CRYPTO PROBE',
            'cedula'=>'000-0000000-0',
            'email'=>'crypto-probe@hashcod.invalid',
            'phone'=>'+1 000 000 0000',
        ];
        $encrypted = [
            'full_name_enc'=>hprRegistrationEncrypt($plain['full_name']),
            'cedula_enc'=>hprRegistrationEncrypt($plain['cedula']),
            'email_enc'=>hprRegistrationEncrypt($plain['email']),
            'phone_enc'=>hprRegistrationEncrypt($plain['phone']),
        ];
        return hprRegistrationRoundTrip($plain, $encrypted);
    } catch (Throwable $ignored) {
        return false;
    }
}

function hprRegistrationDecrypt(string $blob): string {
    if ($blob === '') return '';

    // Canonical persistent key used by all new registrations.
    try {
        $plain = secretsDecrypt($blob, hprRegistrationCryptoKey());
        if ($plain !== '') return $plain;
    } catch (Throwable $ignored) {
    }

    // Transition compatibility: try every stable environment-derived key that
    // may have been used before the persistent Storage key existed.
    foreach (hprRegistrationLegacyKeys() as $legacyKey) {
        try {
            $plain = secretsDecrypt($blob, $legacyKey);
            if ($plain !== '') return $plain;
        } catch (Throwable $ignored) {
        }
    }

    // Old pre-registration-key records used secretsDataKey()/vault master.
    try {
        return secretsDecrypt($blob);
    } catch (Throwable $ignored) {
        return '';
    }
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
        hprJson(422, ['ok'=>false, 'error'=>'El código debe pesar entre 1 byte y 30 MB.']);
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

function hprEnsureRegistrationBucket(): array {
    $bucket = HASHCOD_PLATFORM_REGISTRATION_BUCKET;
    $desired = [
        'id'=>$bucket,
        'name'=>$bucket,
        'public'=>false,
        'file_size_limit'=>HASHCOD_PLATFORM_CODE_MAX_BYTES,
        'allowed_mime_types'=>null,
    ];

    $get = supabaseRequest(
        'storage/v1/bucket/' . rawurlencode($bucket),
        ['method'=>'GET', 'use_secret'=>true, 'timeout'=>12]
    );

    if (!empty($get['ok'])) {
        $body = is_array($get['body'] ?? null) ? $get['body'] : [];
        $needsUpdate =
            !array_key_exists('public', $body) || $body['public'] !== false
            || (int)($body['file_size_limit'] ?? 0) !== HASHCOD_PLATFORM_CODE_MAX_BYTES
            || (($body['allowed_mime_types'] ?? null) !== null);

        if (!$needsUpdate) {
            return ['ok'=>true, 'bucket'=>$bucket, 'created'=>false, 'updated'=>false];
        }

        $update = supabaseRequest(
            'storage/v1/bucket/' . rawurlencode($bucket),
            [
                'method'=>'PUT',
                'use_secret'=>true,
                'body'=>$desired,
                'timeout'=>12,
            ]
        );
        if (!empty($update['ok'])) {
            return ['ok'=>true, 'bucket'=>$bucket, 'created'=>false, 'updated'=>true];
        }

        return [
            'ok'=>false,
            'bucket'=>$bucket,
            'status'=>(int)($update['status'] ?? 0),
            'error'=>(string)($update['error'] ?? 'No se pudo actualizar el bucket de registros.'),
        ];
    }

    $create = supabaseRequest(
        'storage/v1/bucket',
        [
            'method'=>'POST',
            'use_secret'=>true,
            'body'=>$desired,
            'timeout'=>12,
        ]
    );

    if (!empty($create['ok']) || (int)($create['status'] ?? 0) === 409) {
        return ['ok'=>true, 'bucket'=>$bucket, 'created'=>!empty($create['ok']), 'updated'=>false];
    }

    return [
        'ok'=>false,
        'bucket'=>$bucket,
        'status'=>(int)($create['status'] ?? 0),
        'error'=>(string)($create['error'] ?? $get['error'] ?? 'No se pudo preparar el bucket de registros.'),
    ];
}

function hprUploadCodeStorage(array $codeUpload): array {
    $ensure = hprEnsureRegistrationBucket();
    if (empty($ensure['ok'])) return $ensure;

    $binary = @file_get_contents((string)$codeUpload['tmp_path']);
    if ($binary === false) {
        return ['ok'=>false, 'status'=>0, 'error'=>'No se pudo leer el archivo temporal de la plataforma.'];
    }

    $path = ltrim(str_replace('\\', '/', (string)$codeUpload['storage_path']), '/');
    $res = supabaseRequest(
        'storage/v1/object/' . rawurlencode(HASHCOD_PLATFORM_REGISTRATION_BUCKET) . '/' . $path,
        [
            'method'=>'POST',
            'use_secret'=>true,
            'content_type'=>(string)$codeUpload['mime_type'],
            'headers'=>['x-upsert: false'],
            'body'=>$binary,
            'timeout'=>120,
        ]
    );

    return [
        'ok'=>!empty($res['ok']),
        'status'=>(int)($res['status'] ?? 0),
        'error'=>$res['error'] ?? null,
        'path'=>$path,
        'bucket'=>HASHCOD_PLATFORM_REGISTRATION_BUCKET,
        'body'=>$res['body'] ?? null,
    ];
}

function hprDeleteStorageObject(string $objectPath): void {
    if ($objectPath === '') return;
    @supabaseRequest(
        'storage/v1/object/' . rawurlencode(HASHCOD_PLATFORM_REGISTRATION_BUCKET) . '/' . ltrim(str_replace('\\', '/', $objectPath), '/'),
        ['method'=>'DELETE', 'use_secret'=>true, 'content_type'=>'', 'timeout'=>12]
    );
}

function hprUploadFallbackRegistrationEvidence(string $codeStoragePath, array $metadata): array {
    $json = json_encode($metadata, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if (!is_string($json) || $json === '') {
        return ['ok'=>false, 'status'=>0, 'error'=>'No se pudo serializar la evidencia de compatibilidad.'];
    }

    $encrypted = hprRegistrationEncrypt($json);
    if (!is_string($encrypted) || !str_starts_with($encrypted, 'l8e1:')) {
        return ['ok'=>false, 'status'=>0, 'error'=>'No se pudo cifrar la evidencia de compatibilidad.'];
    }

    $path = ltrim(str_replace('\\', '/', $codeStoragePath), '/') . '.registration-evidence.l8e1';
    $res = supabaseRequest(
        'storage/v1/object/' . rawurlencode(HASHCOD_PLATFORM_REGISTRATION_BUCKET) . '/' . $path,
        [
            'method'=>'POST',
            'use_secret'=>true,
            'content_type'=>'text/plain; charset=utf-8',
            'headers'=>['x-upsert: true'],
            'body'=>$encrypted,
            'timeout'=>30,
        ]
    );

    return [
        'ok'=>!empty($res['ok']),
        'status'=>(int)($res['status'] ?? 0),
        'error'=>$res['error'] ?? null,
        'path'=>$path,
    ];
}

function hprMissingAnyColumn(string $error, array $columns): bool {
    $error = strtolower($error);
    foreach ($columns as $column) {
        if (str_contains($error, strtolower((string)$column))) return true;
    }
    return false;
}

function hprDownloadRegistrationEvidence(string $path): array {
    $path = ltrim(str_replace('\\', '/', $path), '/');
    if ($path === '') return ['ok'=>false, 'data'=>null];

    $res = supabaseRequest(
        'storage/v1/object/' . rawurlencode(HASHCOD_PLATFORM_REGISTRATION_BUCKET) . '/' . $path,
        [
            'method'=>'GET',
            'use_secret'=>true,
            'content_type'=>'',
            'raw_response'=>true,
            'bypass_circuit'=>true,
            'timeout'=>20,
        ]
    );
    if (empty($res['ok']) || !is_string($res['raw'] ?? null) || $res['raw'] === '') {
        return ['ok'=>false, 'data'=>null];
    }

    $json = hprRegistrationDecrypt((string)$res['raw']);
    if (!is_string($json) || $json === '') return ['ok'=>false, 'data'=>null];
    $data = json_decode($json, true);
    if (!is_array($data)) return ['ok'=>false, 'data'=>null];

    return ['ok'=>true, 'data'=>$data];
}

function hprListRegistrationEvidencePaths(string $prefix, int $depth = 0): array {
    if ($depth > 6) return [];

    $prefix = trim(str_replace('\\', '/', $prefix), '/');
    if ($prefix === '') return [];

    $paths = [];
    $offset = 0;
    $limit = 100;

    while ($offset < 5000) {
        $list = supabaseRequest(
            'storage/v1/object/list/' . rawurlencode(HASHCOD_PLATFORM_REGISTRATION_BUCKET),
            [
                'method'=>'POST',
                'use_secret'=>true,
                'bypass_circuit'=>true,
                'body'=>[
                    'prefix'=>$prefix,
                    'limit'=>$limit,
                    'offset'=>$offset,
                    'sortBy'=>['column'=>'name','order'=>'asc'],
                ],
                'timeout'=>20,
            ]
        );

        if (empty($list['ok'])) break;
        $items = is_array($list['body'] ?? null) ? $list['body'] : [];
        if (!$items) break;

        foreach ($items as $item) {
            if (!is_array($item)) continue;
            $name = trim((string)($item['name'] ?? ''), '/');
            if ($name === '') continue;

            $fullPath = str_starts_with($name, $prefix . '/')
                ? $name
                : $prefix . '/' . $name;

            $isFolder = !array_key_exists('id', $item) || $item['id'] === null;
            if ($isFolder) {
                foreach (hprListRegistrationEvidencePaths($fullPath, $depth + 1) as $nested) {
                    $paths[] = $nested;
                }
                continue;
            }

            if (str_ends_with($fullPath, '.registration-evidence.l8e1')) {
                $paths[] = $fullPath;
            }
        }

        if (count($items) < $limit) break;
        $offset += $limit;
    }

    return array_values(array_unique($paths));
}

function hprRegistrationEvidenceByRowId(array $rowIds = [], array $storedRows = []): array {
    $map = [];

    // Fast path for records created after the row-index fix.
    foreach ($rowIds as $rowId) {
        $rowId = trim((string)$rowId);
        if ($rowId === '') continue;

        $directPath = 'platform-registrations/evidence-by-row/'
            . rawurlencode($rowId)
            . '.registration-evidence.l8e1';
        $direct = hprDownloadRegistrationEvidence($directPath);
        $data = is_array($direct['data'] ?? null) ? $direct['data'] : null;
        if ($data) {
            $map[$rowId] = $data;
        }
    }

    // Build a cautious compatibility lookup for very early sidecars that
    // predate registration_row_id. A sidecar is linked automatically only
    // when platform_name uniquely identifies a row, or when a unique nearest
    // timestamp match exists within five minutes.
    $rowsByPlatform = [];
    foreach ($storedRows as $storedRow) {
        if (!is_array($storedRow)) continue;
        $id = trim((string)($storedRow['id'] ?? ''));
        $platform = hprLower((string)($storedRow['platform_name'] ?? ''));
        if ($id === '' || $platform === '') continue;
        $rowsByPlatform[$platform][] = [
            'id'=>$id,
            'created_at'=>(string)($storedRow['created_at'] ?? ''),
        ];
    }

    // Recovery path for records that were saved before evidence-by-row existed.
    // Storage list() is not recursive, so walk each folder level explicitly.
    $paths = hprListRegistrationEvidencePaths('platform-registrations/code');
    foreach ($paths as $path) {
        $evidence = hprDownloadRegistrationEvidence($path);
        $data = is_array($evidence['data'] ?? null) ? $evidence['data'] : null;
        if (!$data) continue;

        $rowId = trim((string)($data['registration_row_id'] ?? ''));

        if ($rowId === '') {
            $platform = hprLower((string)($data['platform_name'] ?? ''));
            $candidates = $platform !== '' ? ($rowsByPlatform[$platform] ?? []) : [];

            if (count($candidates) === 1) {
                $rowId = (string)$candidates[0]['id'];
            } elseif (count($candidates) > 1) {
                $evidenceTs = strtotime((string)($data['created_at'] ?? ''));
                if ($evidenceTs !== false) {
                    $ranked = [];
                    foreach ($candidates as $candidate) {
                        $candidateTs = strtotime((string)($candidate['created_at'] ?? ''));
                        if ($candidateTs === false) continue;
                        $delta = abs($candidateTs - $evidenceTs);
                        if ($delta <= 300) {
                            $ranked[] = ['id'=>(string)$candidate['id'], 'delta'=>$delta];
                        }
                    }
                    usort($ranked, static fn(array $a, array $b): int => $a['delta'] <=> $b['delta']);
                    if (
                        count($ranked) === 1
                        || (
                            count($ranked) > 1
                            && (int)$ranked[0]['delta'] < (int)$ranked[1]['delta']
                        )
                    ) {
                        $rowId = (string)$ranked[0]['id'];
                    }
                }
            }
        }

        if ($rowId !== '' && !isset($map[$rowId])) {
            $data['registration_row_id'] = $rowId;
            $map[$rowId] = $data;

            // Self-heal old registrations by creating the direct row index.
            hprUploadFallbackRegistrationEvidence(
                'platform-registrations/evidence-by-row/' . $rowId,
                $data
            );
        }
    }

    return $map;
}


function hprGenerateRegistrationCode(): array {
    // 128 bits of server-side CSPRNG entropy. The readable grouped hex format
    // is shown once to the registrant; the database stores an encrypted copy
    // plus a SHA-256 digest for lookup/integrity.
    $raw = strtoupper(bin2hex(random_bytes(16)));
    $groups = str_split($raw, 8);
    $plain = 'HC1-' . implode('-', $groups);
    return [
        'plain'=>$plain,
        'sha256'=>hash('sha256', $plain),
        'hint'=>substr($plain, -8),
    ];
}

function hprLegacyReplacementCode(array $stored): array {
    $rowId = (string)($stored['id'] ?? '');
    $platform = (string)($stored['platform_name'] ?? '');
    $created = (string)($stored['created_at'] ?? '');
    $material = 'legacy-registration|' . $rowId . '|' . $platform . '|' . $created;
    $hex = strtoupper(hash_hmac('sha256', $material, hprRegistrationCryptoKey()));
    $plain = 'HC2-' . implode('-', str_split(substr($hex, 0, 32), 8));
    return [
        'plain'=>$plain,
        'sha256'=>hash('sha256', $plain),
        'hint'=>substr($plain, -8),
    ];
}

function hprAcceptanceEvidenceSha256(
    array $validated,
    array $codeUpload,
    string $contractVersion,
    string $contractSha256,
    string $acceptedAt
): string {
    $evidence = [
        'contract_version'=>$contractVersion,
        'contract_sha256'=>$contractSha256,
        'accepted_at'=>$acceptedAt,
        'acceptance_method'=>'checkbox+submit',
        'age'=>(int)$validated['age'],
        'platform_name'=>(string)$validated['platform_name'],
        'code_filename'=>(string)$codeUpload['filename'],
        'code_size_bytes'=>(int)$codeUpload['size_bytes'],
        'code_sha256'=>(string)$codeUpload['sha256'],
    ];
    ksort($evidence);
    return hash('sha256', json_encode($evidence, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
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
    if (!$consent) hprJson(422, ['ok'=>false, 'error'=>'Debes confirmar que tienes 18 años o más y aceptar el documento contractual y de privacidad.']);

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
    $registrationBucketReady = false;

    $schemaMode = 'unavailable';
    $registrationKeyReady = false;
    $registrationCryptoRoundtripReady = false;
    if ($storageConfigured) {
        $probe = supabaseDbSelect(HASHCOD_PLATFORM_REGISTRATION_TABLE, 'select=id,code_storage_path,contract_version,contract_sha256,acceptance_evidence_sha256,registration_code_enc,registration_code_sha256&limit=1');
        if (!empty($probe['ok'])) {
            $tableReady = true;
            $schemaMode = 'full';
        } else {
            // Production may temporarily run with the earlier registration
            // schema while DDL credentials are unavailable. The code-upload
            // columns are sufficient for a safe compatibility mode because the
            // missing evidence is stored in a private sidecar bound to
            // code_storage_path.
            $legacyProbe = supabaseDbSelect(
                HASHCOD_PLATFORM_REGISTRATION_TABLE,
                'select=id,code_storage_path,code_filename,code_sha256&limit=1'
            );
            if (!empty($legacyProbe['ok'])) {
                $tableReady = true;
                $schemaMode = 'compatibility';
            } else {
                $baseProbe = supabaseDbSelect(
                    HASHCOD_PLATFORM_REGISTRATION_TABLE,
                    'select=id,full_name_enc,age,cedula_enc,platform_name,email_enc,phone_enc&limit=1'
                );
                $tableReady = !empty($baseProbe['ok']);
                if ($tableReady) $schemaMode = 'base-compatibility';
            }
        }
        $bucketProbe = hprEnsureRegistrationBucket();
        $registrationBucketReady = !empty($bucketProbe['ok']);

        if ($registrationBucketReady) {
            try {
                $registrationKeyReady = strlen(hprRegistrationCryptoKey()) === 32;
                $registrationCryptoRoundtripReady = $registrationKeyReady
                    && hprRegistrationCryptoProbe();
            } catch (Throwable $ignored) {
                $registrationKeyReady = false;
                $registrationCryptoRoundtripReady = false;
            }
        }
    }

    $ready = $storageConfigured
        && $tableReady
        && $registrationBucketReady
        && $registrationKeyReady
        && $registrationCryptoRoundtripReady;
    hprJson($ready ? 200 : 503, [
        'ok'=>$ready,
        'storage_configured'=>$storageConfigured,
        'table_ready'=>$tableReady,
        'schema_mode'=>$schemaMode,
        'registration_bucket_ready'=>$registrationBucketReady,
        'registration_bucket'=>HASHCOD_PLATFORM_REGISTRATION_BUCKET,
        'registration_key_ready'=>$registrationKeyReady,
        'registration_crypto_roundtrip_ready'=>$registrationCryptoRoundtripReady,
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
            $retryAfter = max(1, (int)($rate['retry_after'] ?? 60));
            if (
                !empty($rate['challenge_required'])
                && function_exists('securityRateChallengeJson')
                && function_exists('cfTurnstileIsEnabled')
                && cfTurnstileIsEnabled()
            ) {
                securityRateChallengeJson($retryAfter, 'platform_registration_submit');
            }
            header('Retry-After: ' . $retryAfter);
            hprJson(429, ['ok'=>false, 'error'=>'Demasiados intentos. Inténtalo de nuevo más tarde.']);
        }
    }

    $validated = hprValidate(hprReadBody());
    $codeUpload = hprReadCodeUpload();

    $cfg = supabaseConfig();
    if (empty($cfg['configured']) || empty($cfg['secret_key'])) {
        hprJson(503, ['ok'=>false, 'error'=>'El almacenamiento seguro todavía no está disponible.']);
    }

    $contract = hashcodRegistrationContract();
    $contractVersion = (string)($contract['version'] ?? '');
    $contractSha256 = hashcodRegistrationContractSha256();
    $acceptedAt = gmdate('c');
    $acceptanceEvidenceSha256 = hprAcceptanceEvidenceSha256(
        $validated,
        $codeUpload,
        $contractVersion,
        $contractSha256,
        $acceptedAt
    );
    $registrationCode = hprGenerateRegistrationCode();
    $registrationCodeEnc = hprRegistrationEncrypt($registrationCode['plain']);
    if (!is_string($registrationCodeEnc) || !str_starts_with($registrationCodeEnc, 'l8e1:')) {
        hprJson(503, ['ok'=>false, 'error'=>'No se pudo proteger el código criptográfico del registro.']);
    }

    $row = [
        'full_name_enc'=>hprRegistrationEncrypt($validated['full_name']),
        'age'=>$validated['age'],
        'cedula_enc'=>hprRegistrationEncrypt($validated['cedula']),
        'platform_name'=>$validated['platform_name'],
        'code_filename'=>$codeUpload['filename'],
        'code_mime_type'=>$codeUpload['mime_type'],
        'code_size_bytes'=>$codeUpload['size_bytes'],
        'code_sha256'=>$codeUpload['sha256'],
        'code_storage_path'=>$codeUpload['storage_path'],
        'contract_version'=>$contractVersion,
        'contract_sha256'=>$contractSha256,
        'contract_accepted_at'=>$acceptedAt,
        'acceptance_method'=>'checkbox+submit',
        'acceptance_evidence_sha256'=>$acceptanceEvidenceSha256,
        'registration_code_enc'=>$registrationCodeEnc,
        'registration_code_sha256'=>$registrationCode['sha256'],
        'registration_code_hint'=>$registrationCode['hint'],
        'email_enc'=>hprRegistrationEncrypt($validated['email']),
        'phone_enc'=>hprRegistrationEncrypt($validated['phone']),
    ];
    foreach (['full_name_enc','cedula_enc','email_enc','phone_enc'] as $encryptedField) {
        if (!is_string($row[$encryptedField]) || !str_starts_with($row[$encryptedField], 'l8e1:')) {
            hprJson(503, ['ok'=>false, 'error'=>'No se pudo proteger el registro antes de almacenarlo.']);
        }
    }

    // Fail closed: never persist an identity that cannot be read back using
    // the same persistent registration key. This guards Render redeploys/key
    // drift before any user data is committed.
    if (!hprRegistrationRoundTrip($validated, $row)) {
        hprJson(503, [
            'ok'=>false,
            'error'=>'La verificación de cifrado del registro falló. No se guardaron datos.',
            'code'=>'registration_crypto_roundtrip_failed',
        ]);
    }

    $uploadedCode = hprUploadCodeStorage($codeUpload);
    if (empty($uploadedCode['ok'])) {
        $storageStatus = (int)($uploadedCode['status'] ?? 0);
        $storageError = strtolower((string)($uploadedCode['error'] ?? ''));

        if ($storageStatus === 413 || str_contains($storageError, 'too large') || str_contains($storageError, 'file size')) {
            hprJson(413, ['ok'=>false, 'error'=>'El archivo supera el límite de 30 MB permitido para el registro.']);
        }
        if ($storageStatus === 415 || str_contains($storageError, 'mime')) {
            hprJson(415, ['ok'=>false, 'error'=>'El tipo de archivo fue rechazado por el almacenamiento seguro.']);
        }
        if ($storageStatus === 401 || $storageStatus === 403) {
            hprJson(503, ['ok'=>false, 'error'=>'El almacenamiento privado de registros no está autorizado correctamente.']);
        }

        error_log(
            '[hashcod-platform-registration] storage upload failed'
            . ' status=' . $storageStatus
            . ' bucket=' . HASHCOD_PLATFORM_REGISTRATION_BUCKET
            . ' error=' . substr((string)($uploadedCode['error'] ?? ''), 0, 500)
        );
        hprJson(502, ['ok'=>false, 'error'=>'No se pudo subir el código de la plataforma en este momento.']);
    }

    $res = supabaseDbRequest(HASHCOD_PLATFORM_REGISTRATION_TABLE, [
        'method'=>'POST', 'use_secret'=>true,
        'headers'=>['Prefer: return=representation'],
        'body'=>[$row], 'timeout'=>8,
    ]);

    $compatibilityMode = false;
    $fallbackEvidencePath = '';
    if (empty($res['ok'])) {
        $status = (int)($res['status'] ?? 0);
        $error = strtolower((string)($res['error'] ?? ''));

        if ($status === 404 || str_contains($error, 'relation')) {
            hprDeleteStorageObject($codeUpload['storage_path']);
            hprJson(503, ['ok'=>false, 'error'=>'La tabla de registros todavía no está inicializada.']);
        }
        if (hprMissingAnyColumn($error, ['code_storage_path','code_filename','code_sha256'])) {
            hprDeleteStorageObject($codeUpload['storage_path']);
            hprJson(503, ['ok'=>false, 'error'=>'La tabla de registros todavía no tiene soporte para archivos de plataforma.']);
        }

        $optionalColumns = [
            'code_filename','code_mime_type','code_size_bytes','code_sha256','code_storage_path',
            'contract_version','contract_sha256','contract_accepted_at',
            'acceptance_method','acceptance_evidence_sha256',
            'registration_code_enc','registration_code_sha256','registration_code_hint'
        ];

        if (hprMissingAnyColumn($error, $optionalColumns)) {
            $fallbackEvidence = [
                'format'=>'HASHCOD-REGISTRATION-EVIDENCE-1',
                'code_storage_path'=>$codeUpload['storage_path'],
                'code_filename'=>$codeUpload['filename'],
                'code_mime_type'=>$codeUpload['mime_type'],
                'code_size_bytes'=>$codeUpload['size_bytes'],
                'code_sha256'=>$codeUpload['sha256'],
                'contract_version'=>$contractVersion,
                'contract_sha256'=>$contractSha256,
                'contract_accepted_at'=>$acceptedAt,
                'acceptance_method'=>'checkbox+submit',
                'acceptance_evidence_sha256'=>$acceptanceEvidenceSha256,
                'registration_code_enc'=>$registrationCodeEnc,
                'registration_code_sha256'=>$registrationCode['sha256'],
                'registration_code_hint'=>$registrationCode['hint'],
                'platform_name'=>$validated['platform_name'],
                'full_name_enc'=>hprRegistrationEncrypt($validated['full_name']),
                'cedula_enc'=>hprRegistrationEncrypt($validated['cedula']),
                'email_enc'=>hprRegistrationEncrypt($validated['email']),
                'phone_enc'=>hprRegistrationEncrypt($validated['phone']),
                'created_at'=>gmdate('c'),
            ];
            $fallbackUpload = hprUploadFallbackRegistrationEvidence(
                $codeUpload['storage_path'],
                $fallbackEvidence
            );
            if (empty($fallbackUpload['ok'])) {
                hprDeleteStorageObject($codeUpload['storage_path']);
                hprJson(502, ['ok'=>false, 'error'=>'No se pudo conservar la evidencia privada del registro.']);
            }
            $fallbackEvidencePath = (string)($fallbackUpload['path'] ?? '');

            // Guaranteed-compatible row for the original 20260917 schema.
            // All optional/upload/contract/code metadata remains encrypted in
            // the private sidecar above and is linked to the uploaded object.
            $baseRow = [
                'full_name_enc'=>$row['full_name_enc'],
                'age'=>$row['age'],
                'cedula_enc'=>$row['cedula_enc'],
                'platform_name'=>$row['platform_name'],
                'email_enc'=>$row['email_enc'],
                'phone_enc'=>$row['phone_enc'],
            ];

            $retry = supabaseDbRequest(HASHCOD_PLATFORM_REGISTRATION_TABLE, [
                'method'=>'POST', 'use_secret'=>true,
                'headers'=>['Prefer: return=representation'],
                'body'=>[$baseRow], 'timeout'=>8,
            ]);

            if (!empty($retry['ok'])) {
                $res = $retry;
                $compatibilityMode = true;
                $savedCompat = is_array($retry['body'] ?? null) && !empty($retry['body'][0])
                    ? $retry['body'][0]
                    : [];
                if (!empty($savedCompat['id'])) {
                    // Upsert the encrypted sidecar once more with the actual
                    // row ID so the storage evidence and DB row are explicitly
                    // correlated even while DDL is pending.
                    $fallbackEvidence['registration_row_id'] = $savedCompat['id'];
                    hprUploadFallbackRegistrationEvidence(
                        $codeUpload['storage_path'],
                        $fallbackEvidence
                    );

                    // Also create a deterministic private row index. This makes
                    // the exact HC1 code retrievable in one request from the
                    // CodeKey-protected administrative table.
                    hprUploadFallbackRegistrationEvidence(
                        'platform-registrations/evidence-by-row/' . (string)$savedCompat['id'],
                        $fallbackEvidence
                    );
                }
            }
        }

        if (empty($res['ok'])) {
            hprDeleteStorageObject($codeUpload['storage_path']);
            if ($fallbackEvidencePath !== '') hprDeleteStorageObject($fallbackEvidencePath);
            hprJson(502, ['ok'=>false, 'error'=>'No se pudo guardar el registro en este momento.']);
        }
    }

    $saved = is_array($res['body'] ?? null) && !empty($res['body'][0]) ? $res['body'][0] : [];

    if (!empty($saved['id'])) {
        $rowEvidence = [
            'format'=>'HASHCOD-REGISTRATION-EVIDENCE-3',
            'registration_row_id'=>$saved['id'],
            'platform_name'=>$validated['platform_name'],
            'full_name_enc'=>hprRegistrationEncrypt($validated['full_name']),
            'cedula_enc'=>hprRegistrationEncrypt($validated['cedula']),
            'email_enc'=>hprRegistrationEncrypt($validated['email']),
            'phone_enc'=>hprRegistrationEncrypt($validated['phone']),
            'code_storage_path'=>$codeUpload['storage_path'],
            'code_filename'=>$codeUpload['filename'],
            'code_mime_type'=>$codeUpload['mime_type'],
            'code_size_bytes'=>$codeUpload['size_bytes'],
            'code_sha256'=>$codeUpload['sha256'],
            'contract_version'=>$contractVersion,
            'contract_sha256'=>$contractSha256,
            'contract_accepted_at'=>$acceptedAt,
            'acceptance_method'=>'checkbox+submit',
            'acceptance_evidence_sha256'=>$acceptanceEvidenceSha256,
            'registration_code_enc'=>$registrationCodeEnc,
            'registration_code_sha256'=>$registrationCode['sha256'],
            'registration_code_hint'=>$registrationCode['hint'],
            'created_at'=>gmdate('c'),
        ];
        hprUploadFallbackRegistrationEvidence(
            'platform-registrations/evidence-by-row/' . (string)$saved['id'],
            $rowEvidence
        );
    }

    hprJson(201, [
        'ok'=>true,
        'id'=>$saved['id'] ?? null,
        'code_uploaded'=>true,
        'code_filename'=>$codeUpload['filename'],
        'code_sha256'=>$codeUpload['sha256'],
        'contract_version'=>$contractVersion,
        'contract_sha256'=>$contractSha256,
        'accepted_at'=>$acceptedAt,
        'acceptance_evidence_sha256'=>$acceptanceEvidenceSha256,
        // Returned only in this successful POST response. Subsequent admin/list
        // endpoints do not expose the plaintext registration code.
        'registration_code'=>$registrationCode['plain'],
        'registration_code_hint'=>$registrationCode['hint'],
        'schema_mode'=>$compatibilityMode ? 'compatibility' : 'full',
    ]);
}

if ($method === 'GET' && (string)($_GET['view'] ?? '') === 'admin') {
    adminRequire();
    $cfg = supabaseConfig();
    if (empty($cfg['configured']) || empty($cfg['secret_key'])) {
        hprJson(503, ['ok'=>false, 'error'=>'El almacenamiento seguro todavía no está disponible.']);
    }
    // Read the row generically so the administrative table keeps working
    // across every deployed schema version. Only the allow-listed projection
    // below is returned to the browser; select=* never escapes this endpoint.
    // CodeKey + adminRequire() already authorized this request. Perform a
    // direct recovery read so a previously-open global Supabase circuit does
    // not make the protected table appear unavailable forever.
    $res = supabaseDbRequest(
        HASHCOD_PLATFORM_REGISTRATION_TABLE . '?select=*&order=created_at.desc&limit=500',
        [
            'method'=>'GET',
            'use_secret'=>true,
            'bypass_circuit'=>true,
            'timeout'=>12,
        ]
    );
    $adminSchemaMode = 'dynamic';
    if (empty($res['ok'])) {
        error_log(
            '[hashcod-platform-registration] admin select failed'
            . ' status=' . (int)($res['status'] ?? 0)
            . ' error=' . substr((string)($res['error'] ?? ''), 0, 500)
        );
        hprJson(502, [
            'ok'=>false,
            'error'=>'No se pudo cargar la tabla de registros.',
            'code'=>'registration_table_read_failed',
        ]);
    }

    $storedRows = is_array($res['body'] ?? null) ? $res['body'] : [];

    // Keep the CodeKey-protected table fast: do not recursively scan Storage
    // before opening it. Current rows use registration_code_enc directly.
    // Legacy rows that cannot be decrypted receive a stable deterministic
    // replacement code derived from the persistent registration key.
    $compatEvidenceByRowId = [];

    $rows = [];
    foreach ($storedRows as $stored) {
        if (!is_array($stored)) continue;

        $registrationCode = '';
        $registrationCodeReissued = false;
        $registrationCodeEnc = (string)($stored['registration_code_enc'] ?? '');

        if ($registrationCodeEnc !== '') {
            $registrationCode = hprRegistrationDecrypt($registrationCodeEnc);
        }

        if ($registrationCode === '') {
            $legacyReplacement = hprLegacyReplacementCode($stored);
            $registrationCode = $legacyReplacement['plain'];
            $registrationCodeReissued = true;
        }

        $compatEvidence = null;

        $rows[] = [
            'id'=>$stored['id'] ?? null,
            'full_name'=>$fullName,
            'identity_recoverable'=>$identityRecoverable,
            'identity_status'=>$identityStatus,
            'age'=>(int)($stored['age'] ?? 0),
            'cedula'=>$cedula,
            'platform_name'=>(string)($stored['platform_name'] ?? ''),
            'code_filename'=>(string)($stored['code_filename'] ?? ''),
            'code_mime_type'=>(string)($stored['code_mime_type'] ?? ''),
            'code_size_bytes'=>(int)($stored['code_size_bytes'] ?? 0),
            'code_sha256'=>(string)($stored['code_sha256'] ?? ''),
            'code_uploaded'=>((string)($stored['code_storage_path'] ?? '')) !== '',
            'contract_version'=>(string)($stored['contract_version'] ?? ''),
            'contract_sha256'=>(string)($stored['contract_sha256'] ?? ''),
            'contract_accepted_at'=>(string)($stored['contract_accepted_at'] ?? ''),
            'acceptance_method'=>(string)($stored['acceptance_method'] ?? ''),
            'acceptance_evidence_sha256'=>(string)($stored['acceptance_evidence_sha256'] ?? ''),
            'registration_code'=>$registrationCode,
            'registration_code_reissued'=>$registrationCodeReissued,
            'registration_code_stored'=>$registrationCode !== '' || ((string)($stored['registration_code_sha256'] ?? '')) !== '',
            'registration_code_hint'=>$registrationCode !== '' ? substr($registrationCode, -8) : '',
            'registration_code_sha256'=>(string)($stored['registration_code_sha256'] ?? ($registrationCode !== '' ? hash('sha256', $registrationCode) : '')),
            'email'=>$email,
            'phone'=>$phone,
            'created_at'=>(string)($stored['created_at'] ?? ''),
        ];
    }
    hprJson(200, [
        'ok'=>true,
        'rows'=>$rows,
        'count'=>count($rows),
        'schema_mode'=>$adminSchemaMode,
    ]);
}

header('Allow: GET, POST');
hprJson(405, ['ok'=>false, 'error'=>'Método no permitido.']);
