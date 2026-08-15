<?php
/**
 * Auth gate l8 codespace — registro / login.
 *
 * La clave Dilithium-5 mensual de registro SOLO vive en entorno:
 *   L8_DILITHIUM5_REGISTER_KEY
 * Nunca se escribe en el repo ni se expone por API.
 */

require_once __DIR__ . '/supabase.php';

function authStorageDir() {
    $dir = __DIR__ . '/data_storage/auth';
    if (!is_dir($dir)) {
        @mkdir($dir, 0777, true);
    }
    return $dir;
}

function authUsersPath() {
    return authStorageDir() . '/users.json';
}

function authPepper() {
    static $cached = null;
    if (is_string($cached) && $cached !== '') {
        return $cached;
    }

    // 1) Env / secret file (recomendado en Render)
    $pepper = envValue('L8_AUTH_PEPPER', '');
    if ($pepper !== '') {
        $cached = $pepper;
        return $cached;
    }

    $pepperFile = authStorageDir() . '/.pepper';

    // 2) Supabase Storage (sobrevive redeploy si no hay env)
    if (function_exists('supabaseConfig') && function_exists('supabaseStorageDownload')) {
        $cfg = supabaseConfig();
        if (!empty($cfg['configured'])) {
            $remote = @supabaseStorageDownload('meta/auth_pepper');
            if (!empty($remote['ok']) && is_string($remote['data'])) {
                $fromRemote = trim($remote['data']);
                if ($fromRemote !== '') {
                    @file_put_contents($pepperFile, $fromRemote);
                    @chmod($pepperFile, 0600);
                    $cached = $fromRemote;
                    return $cached;
                }
            }
        }
    }

    // 3) Local
    if (is_readable($pepperFile)) {
        $existing = trim((string)@file_get_contents($pepperFile));
        if ($existing !== '') {
            $cached = $existing;
            // intenta subir a Supabase para no perderlo en el próximo deploy
            if (function_exists('supabaseConfig') && function_exists('supabaseStorageUpload') && !empty(supabaseConfig()['configured'])) {
                @supabaseStorageUpload('meta/auth_pepper', $existing, 'text/plain', false);
            }
            return $cached;
        }
    }

    $generated = bin2hex(random_bytes(32));
    @file_put_contents($pepperFile, $generated);
    @chmod($pepperFile, 0600);
    if (function_exists('supabaseConfig') && function_exists('supabaseStorageUpload') && !empty(supabaseConfig()['configured'])) {
        @supabaseStorageUpload('meta/auth_pepper', $generated, 'text/plain', false);
    }
    $cached = $generated;
    return $cached;
}

function authHashKey($plaintext) {
    return hash_hmac('sha256', (string)$plaintext, authPepper());
}

function authTimingSafeEqual($a, $b) {
    $a = (string)$a;
    $b = (string)$b;
    if (function_exists('hash_equals')) {
        return hash_equals($a, $b);
    }
    if (strlen($a) !== strlen($b)) {
        return false;
    }
    $res = 0;
    for ($i = 0; $i < strlen($a); $i++) {
        $res |= ord($a[$i]) ^ ord($b[$i]);
    }
    return $res === 0;
}

function authDilithiumRegisterKey() {
    // Única fuente: entorno / secret file. Jamás hardcode.
    return envValue('L8_DILITHIUM5_REGISTER_KEY', '');
}

function authDilithiumConfigured() {
    return authDilithiumRegisterKey() !== '';
}

function authVerifyDilithium($provided) {
    $expected = authDilithiumRegisterKey();
    if ($expected === '') {
        return ['ok' => false, 'error' => 'Registro no disponible: falta L8_DILITHIUM5_REGISTER_KEY en el servidor'];
    }
    $provided = trim((string)$provided);
    if ($provided === '') {
        return ['ok' => false, 'error' => 'Introduce la Dilithium-5 de registro'];
    }
    if (!authTimingSafeEqual($provided, $expected)) {
        return ['ok' => false, 'error' => 'Dilithium-5 incorrecta'];
    }
    return ['ok' => true];
}

function authEmptyStore() {
    return [
        'version' => 1,
        'users' => [],
        'key_hashes' => [],
        'recovery_hashes' => [],
        'sessions' => []
    ];
}

function authNormalizeStore($data) {
    if (!is_array($data)) {
        return authEmptyStore();
    }
    $data['users'] = is_array($data['users'] ?? null) ? $data['users'] : [];
    $data['key_hashes'] = is_array($data['key_hashes'] ?? null) ? $data['key_hashes'] : [];
    $data['recovery_hashes'] = is_array($data['recovery_hashes'] ?? null) ? $data['recovery_hashes'] : [];
    $data['sessions'] = is_array($data['sessions'] ?? null) ? $data['sessions'] : [];
    return $data;
}

/** Fusiona store A con B (B gana en conflictos de usuario/hash). */
function authMergeStores(array $base, array $overlay) {
    $out = authNormalizeStore($base);
    $over = authNormalizeStore($overlay);
    foreach ($over['users'] as $id => $user) {
        if (!is_array($user)) continue;
        $prev = $out['users'][$id] ?? null;
        if (!is_array($prev)) {
            $out['users'][$id] = $user;
            continue;
        }
        // gana el más reciente por recovered_at / updated_at / created_at
        $prevTs = strtotime($prev['recovered_at'] ?? $prev['updated_at'] ?? $prev['created_at'] ?? '') ?: 0;
        $newTs = strtotime($user['recovered_at'] ?? $user['updated_at'] ?? $user['created_at'] ?? '') ?: 0;
        $out['users'][$id] = ($newTs >= $prevTs) ? array_replace($prev, $user) : array_replace($user, $prev);
    }
    $out['key_hashes'] = array_replace($out['key_hashes'], $over['key_hashes']);
    $out['recovery_hashes'] = array_replace($out['recovery_hashes'], $over['recovery_hashes']);
    // sesiones: conservar unión; no crítico para recuperación
    $out['sessions'] = array_replace($out['sessions'], $over['sessions']);
    return $out;
}

function authStoreFromDbRows(array $accounts, array $identities) {
    $store = authEmptyStore();
    foreach ($accounts as $row) {
        if (!is_array($row) || empty($row['id'])) continue;
        $id = (string)$row['id'];
        $backup = $row['backup_codes'] ?? [];
        if (is_string($backup)) {
            $backup = json_decode($backup, true) ?: [];
        }
        if (!is_array($backup)) $backup = [];
        $store['users'][$id] = [
            'id' => $id,
            'created_at' => $row['created_at'] ?? null,
            'recovered_at' => $row['recovered_at'] ?? null,
            'updated_at' => $row['updated_at'] ?? null,
            'aes256_hash' => $row['aes256_hash'] ?? '',
            'identity_hash' => $row['identity_hash'] ?? '',
            'recovery_hash' => $row['recovery_hash'] ?? '',
            'backup_codes' => $backup
        ];
        if (!empty($row['aes256_hash'])) {
            $store['key_hashes'][$row['aes256_hash']] = $id;
        }
        if (!empty($row['identity_hash'])) {
            $store['key_hashes'][$row['identity_hash']] = $id;
        }
    }
    foreach ($identities as $row) {
        if (!is_array($row) || empty($row['hash']) || empty($row['account_id'])) continue;
        $hash = (string)$row['hash'];
        $accountId = (string)$row['account_id'];
        $kind = (string)($row['kind'] ?? '');
        if ($kind === 'aes256' || $kind === 'identity') {
            $store['key_hashes'][$hash] = $accountId;
        } elseif ($kind === 'recovery_key' || $kind === 'backup_code') {
            $store['recovery_hashes'][$hash] = [
                'user_id' => $accountId,
                'type' => $kind
            ];
            if ($kind === 'backup_code' && isset($store['users'][$accountId])) {
                if (!isset($store['users'][$accountId]['backup_codes']) || !is_array($store['users'][$accountId]['backup_codes'])) {
                    $store['users'][$accountId]['backup_codes'] = [];
                }
                if (!isset($store['users'][$accountId]['backup_codes'][$hash])) {
                    $store['users'][$accountId]['backup_codes'][$hash] = [
                        'used' => !empty($row['used']),
                        'created_at' => $row['updated_at'] ?? date('c')
                    ];
                }
            }
        }
    }
    return $store;
}

function authPullStoreFromSupabaseDb() {
    if (!function_exists('supabaseDbSelect') || !function_exists('supabaseConfig')) {
        return ['ok' => false, 'error' => 'DB helper ausente', 'store' => null];
    }
    $cfg = supabaseConfig();
    if (empty($cfg['configured'])) {
        return ['ok' => false, 'error' => 'Supabase no configurado', 'store' => null];
    }
    $accountsRes = supabaseDbSelect('l8_auth_accounts', 'select=*');
    if (empty($accountsRes['ok'])) {
        return ['ok' => false, 'error' => $accountsRes['error'] ?? 'sin tabla l8_auth_accounts', 'store' => null];
    }
    $identRes = supabaseDbSelect('l8_auth_identities', 'select=*');
    $accounts = is_array($accountsRes['body'] ?? null) ? $accountsRes['body'] : [];
    $identities = (!empty($identRes['ok']) && is_array($identRes['body'] ?? null)) ? $identRes['body'] : [];
    return [
        'ok' => true,
        'store' => authStoreFromDbRows($accounts, $identities),
        'accounts' => count($accounts),
        'identities' => count($identities)
    ];
}

function authPushStoreToSupabaseDb(array $store) {
    if (!function_exists('supabaseDbUpsert') || !function_exists('supabaseConfig')) {
        return ['ok' => false, 'error' => 'DB helper ausente'];
    }
    $cfg = supabaseConfig();
    if (empty($cfg['configured'])) {
        return ['ok' => false, 'error' => 'Supabase no configurado'];
    }

    $store = authNormalizeStore($store);
    $accountRows = [];
    $identityRows = [];
    $now = date('c');

    foreach ($store['users'] as $id => $user) {
        if (!is_array($user)) continue;
        $accountId = (string)($user['id'] ?? $id);
        $backup = is_array($user['backup_codes'] ?? null) ? $user['backup_codes'] : [];
        $accountRows[] = [
            'id' => $accountId,
            'aes256_hash' => (string)($user['aes256_hash'] ?? ''),
            'identity_hash' => (string)($user['identity_hash'] ?? ''),
            'recovery_hash' => (string)($user['recovery_hash'] ?? ''),
            'backup_codes' => $backup,
            'created_at' => $user['created_at'] ?? $now,
            'recovered_at' => $user['recovered_at'] ?? null,
            'updated_at' => $now,
            'meta' => ['source' => 'l8-auth']
        ];

        if (!empty($user['aes256_hash'])) {
            $identityRows[] = [
                'hash' => $user['aes256_hash'],
                'account_id' => $accountId,
                'kind' => 'aes256',
                'used' => false,
                'updated_at' => $now
            ];
        }
        if (!empty($user['identity_hash'])) {
            $identityRows[] = [
                'hash' => $user['identity_hash'],
                'account_id' => $accountId,
                'kind' => 'identity',
                'used' => false,
                'updated_at' => $now
            ];
        }
        if (!empty($user['recovery_hash'])) {
            $identityRows[] = [
                'hash' => $user['recovery_hash'],
                'account_id' => $accountId,
                'kind' => 'recovery_key',
                'used' => false,
                'updated_at' => $now
            ];
        }
        foreach ($backup as $codeHash => $meta) {
            $identityRows[] = [
                'hash' => (string)$codeHash,
                'account_id' => $accountId,
                'kind' => 'backup_code',
                'used' => !empty($meta['used']),
                'updated_at' => $now
            ];
        }

        // Limpia identidades previas de esta cuenta y reescribe (evita hashes huérfanos tras rotate)
        if (function_exists('supabaseDbDelete')) {
            @supabaseDbDelete('l8_auth_identities', 'account_id=eq.' . rawurlencode($accountId));
        }
    }

    $accUpsert = ['ok' => true];
    $idUpsert = ['ok' => true];
    if ($accountRows) {
        $accUpsert = supabaseDbUpsert('l8_auth_accounts', $accountRows, 'id');
    }
    if ($identityRows) {
        $idUpsert = supabaseDbUpsert('l8_auth_identities', $identityRows, 'hash');
    }

    $ok = !empty($accUpsert['ok']) && !empty($idUpsert['ok']);
    return [
        'ok' => $ok,
        'accounts_upserted' => count($accountRows),
        'identities_upserted' => count($identityRows),
        'error' => $ok ? null : (($accUpsert['error'] ?? null) ?: ($idUpsert['error'] ?? 'DB upsert falló'))
    ];
}

function authLoadStore($forceRemote = true) {
    // Asegura pepper estable antes de hashear/comparar
    authPepper();

    $path = authUsersPath();
    $storageHydrated = false;
    if (function_exists('supabaseHydrateMetaFile')) {
        $hyd = @supabaseHydrateMetaFile($path, 'auth_users.json', $forceRemote);
        $storageHydrated = !empty($hyd['hydrated']);
    }

    $local = authEmptyStore();
    if (is_readable($path)) {
        $decoded = json_decode((string)@file_get_contents($path), true);
        $local = authNormalizeStore($decoded);
    }

    $dbPull = authPullStoreFromSupabaseDb();
    if (!empty($dbPull['ok']) && is_array($dbPull['store'] ?? null)) {
        $local = authMergeStores($local, $dbPull['store']);
        // Si DB tenía datos y local quedó enriquecido, persiste espejo local
        @file_put_contents(
            $path,
            json_encode($local, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
            LOCK_EX
        );
    }

    $local['_meta'] = [
        'storage_hydrated' => $storageHydrated,
        'db_pulled' => !empty($dbPull['ok']),
        'db_accounts' => $dbPull['accounts'] ?? 0,
        'db_identities' => $dbPull['identities'] ?? 0,
        'db_error' => $dbPull['error'] ?? null
    ];
    return $local;
}

function authSaveStore(array $store) {
    $path = authUsersPath();
    $meta = $store['_meta'] ?? null;
    unset($store['_meta']);
    $store = authNormalizeStore($store);
    $store['version'] = 1;
    $store['updated_at'] = date('c');

    $ok = @file_put_contents(
        $path,
        json_encode($store, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        LOCK_EX
    );
    if ($ok === false) {
        return ['ok' => false, 'error' => 'No se pudo guardar el registro de cuentas'];
    }

    $storage = ['ok' => false, 'error' => 'no intentado'];
    if (function_exists('supabaseSyncMetaFile')) {
        $storage = @supabaseSyncMetaFile($path, 'auth_users.json') ?: ['ok' => false, 'error' => 'sync falló'];
    }

    $db = authPushStoreToSupabaseDb($store);

    // pepper a Storage por si no hay env
    if (function_exists('supabaseConfig') && function_exists('supabaseStorageUpload') && !empty(supabaseConfig()['configured'])) {
        $pepperFile = authStorageDir() . '/.pepper';
        if (is_readable($pepperFile) && envValue('L8_AUTH_PEPPER', '') === '') {
            @supabaseStorageUpload('meta/auth_pepper', (string)@file_get_contents($pepperFile), 'text/plain', false);
        }
    }

    $persisted = [
        'local' => true,
        'storage' => !empty($storage['ok']),
        'db' => !empty($db['ok']),
        'storage_error' => $storage['error'] ?? null,
        'db_error' => $db['error'] ?? null,
        'db_accounts' => $db['accounts_upserted'] ?? 0,
        'db_identities' => $db['identities_upserted'] ?? 0
    ];

    // Éxito si al menos local + (storage o db). Si Supabase está caído, no bloqueamos registro.
    return [
        'ok' => true,
        'persisted' => $persisted
    ];
}

function authGenerateAes256Key() {
    // 32 bytes → hex (representación AES-256)
    return strtoupper(bin2hex(random_bytes(32)));
}

function authGenerateIdentityKey() {
    // Identificador de plataforma distinto a Dilithium-5 y a AES-256
    // Formato: L8ID-<base64url 48 bytes>
    $raw = random_bytes(48);
    $b64 = rtrim(strtr(base64_encode($raw), '+/', '-_'), '=');
    return 'L8ID-' . $b64;
}

function authGenerateRecoveryKey() {
    // Clave maestra de recuperación (offline). Formato: L8REC-<base64url 40 bytes>
    $raw = random_bytes(40);
    $b64 = rtrim(strtr(base64_encode($raw), '+/', '-_'), '=');
    return 'L8REC-' . $b64;
}

function authGenerateBackupCodes($count = 8) {
    $codes = [];
    for ($i = 0; $i < $count; $i++) {
        // Grupos legibles: XXXX-XXXX-XXXX
        $hex = strtoupper(bin2hex(random_bytes(6)));
        $codes[] = substr($hex, 0, 4) . '-' . substr($hex, 4, 4) . '-' . substr($hex, 8, 4);
    }
    return $codes;
}

function authBuildRecoveryKit(array &$store) {
    for ($attempt = 0; $attempt < 12; $attempt++) {
        $recovery = authGenerateRecoveryKey();
        $recoveryHash = authHashKey($recovery);
        if (isset($store['recovery_hashes'][$recoveryHash])) {
            continue;
        }
        $codes = authGenerateBackupCodes(8);
        $codeHashes = [];
        $collision = false;
        foreach ($codes as $code) {
            $h = authHashKey($code);
            if (isset($store['recovery_hashes'][$h]) || isset($codeHashes[$h])) {
                $collision = true;
                break;
            }
            $codeHashes[$h] = [
                'used' => false,
                'created_at' => date('c')
            ];
        }
        if ($collision) {
            continue;
        }
        return [
            'ok' => true,
            'recovery_key' => $recovery,
            'recovery_hash' => $recoveryHash,
            'backup_codes' => $codes,
            'backup_code_hashes' => $codeHashes
        ];
    }
    return ['ok' => false, 'error' => 'No se pudo generar kit de recuperación; reintenta'];
}

function authRevokeUserLoginKeys(array &$store, $userId) {
    $user = $store['users'][$userId] ?? null;
    if (!is_array($user)) {
        return;
    }
    $aesHash = $user['aes256_hash'] ?? '';
    $idHash = $user['identity_hash'] ?? '';
    if ($aesHash !== '' && isset($store['key_hashes'][$aesHash])) {
        unset($store['key_hashes'][$aesHash]);
    }
    if ($idHash !== '' && isset($store['key_hashes'][$idHash])) {
        unset($store['key_hashes'][$idHash]);
    }
}

function authInvalidateUserSessions(array &$store, $userId) {
    foreach ($store['sessions'] as $h => $sess) {
        if (is_array($sess) && ($sess['user_id'] ?? '') === $userId) {
            unset($store['sessions'][$h]);
        }
    }
}

function authGenerateUniqueKeyPair(array &$store) {
    for ($attempt = 0; $attempt < 12; $attempt++) {
        $aes = authGenerateAes256Key();
        $identity = authGenerateIdentityKey();
        if ($aes === $identity) {
            continue;
        }
        $aesHash = authHashKey($aes);
        $idHash = authHashKey($identity);
        if ($aesHash === $idHash) {
            continue;
        }
        if (isset($store['key_hashes'][$aesHash]) || isset($store['key_hashes'][$idHash])) {
            continue;
        }
        // También asegurar que no coincidan con la Dilithium-5 de registro
        $dil = authDilithiumRegisterKey();
        if ($dil !== '' && (authTimingSafeEqual($aes, $dil) || authTimingSafeEqual($identity, $dil))) {
            continue;
        }
        return [
            'ok' => true,
            'aes256' => $aes,
            'identity' => $identity,
            'aes256_hash' => $aesHash,
            'identity_hash' => $idHash
        ];
    }
    return ['ok' => false, 'error' => 'No se pudieron generar claves únicas; reintenta'];
}

function authNewAccountId() {
    return 'acct_' . bin2hex(random_bytes(8));
}

function authCreateSession(array &$store, $userId) {
    $token = bin2hex(random_bytes(32));
    $tokenHash = authHashKey($token);
    // limpia sesiones vencidas
    $now = time();
    foreach ($store['sessions'] as $h => $sess) {
        if (!is_array($sess) || (int)($sess['expires_at'] ?? 0) < $now) {
            unset($store['sessions'][$h]);
        }
    }
    $store['sessions'][$tokenHash] = [
        'user_id' => $userId,
        'created_at' => date('c'),
        'expires_at' => $now + (60 * 60 * 24 * 30) // 30 días
    ];
    return $token;
}

function authRegister($dilithium5) {
    $check = authVerifyDilithium($dilithium5);
    if (empty($check['ok'])) {
        return $check;
    }

    $store = authLoadStore();
    $pair = authGenerateUniqueKeyPair($store);
    if (empty($pair['ok'])) {
        return $pair;
    }
    $kit = authBuildRecoveryKit($store);
    if (empty($kit['ok'])) {
        return $kit;
    }

    $userId = authNewAccountId();
    while (isset($store['users'][$userId])) {
        $userId = authNewAccountId();
    }

    $store['users'][$userId] = [
        'id' => $userId,
        'created_at' => date('c'),
        'aes256_hash' => $pair['aes256_hash'],
        'identity_hash' => $pair['identity_hash'],
        'recovery_hash' => $kit['recovery_hash'],
        'backup_codes' => $kit['backup_code_hashes']
    ];
    $store['key_hashes'][$pair['aes256_hash']] = $userId;
    $store['key_hashes'][$pair['identity_hash']] = $userId;
    $store['recovery_hashes'][$kit['recovery_hash']] = [
        'user_id' => $userId,
        'type' => 'recovery_key'
    ];
    foreach ($kit['backup_code_hashes'] as $codeHash => $_meta) {
        $store['recovery_hashes'][$codeHash] = [
            'user_id' => $userId,
            'type' => 'backup_code'
        ];
    }

    $token = authCreateSession($store, $userId);
    $saved = authSaveStore($store);
    if (empty($saved['ok'])) {
        return $saved;
    }

    return [
        'ok' => true,
        'account_id' => $userId,
        'session_token' => $token,
        'keys' => [
            'aes256' => $pair['aes256'],
            'identity' => $pair['identity'],
            'recovery' => $kit['recovery_key'],
            'backup_codes' => $kit['backup_codes']
        ],
        'persisted' => $saved['persisted'] ?? null,
        'warning' => 'Guarda AES-256, L8ID y el kit de recuperación (L8REC + códigos). La identidad queda en Supabase para recuperar con L8REC/códigos.'
    ];
}

/**
 * Recupera acceso con L8REC-… o un código de respaldo XXXX-XXXX-XXXX.
 * Revoca las claves AES/L8ID anteriores y emite un juego nuevo + kit nuevo.
 */
function authRecover($recoveryMaterial) {
    $material = trim((string)$recoveryMaterial);
    if ($material === '') {
        return ['ok' => false, 'error' => 'Introduce tu clave L8REC o un código de respaldo'];
    }

    // Siempre hidrata identidades desde Supabase (Storage + DB) antes de buscar
    $store = authLoadStore(true);
    $hash = authHashKey($material);
    $entry = $store['recovery_hashes'][$hash] ?? null;

    // Fallback directo a Postgres por hash de recuperación
    if ((!is_array($entry) || empty($entry['user_id'])) && function_exists('supabaseDbSelect') && function_exists('supabaseConfig') && !empty(supabaseConfig()['configured'])) {
        $q = 'select=*&hash=eq.' . rawurlencode($hash) . '&limit=1';
        $hit = supabaseDbSelect('l8_auth_identities', $q);
        if (!empty($hit['ok']) && is_array($hit['body']) && !empty($hit['body'][0]['account_id'])) {
            $row = $hit['body'][0];
            $entry = [
                'user_id' => $row['account_id'],
                'type' => $row['kind'] ?? 'recovery_key'
            ];
            // Asegura usuario en store desde DB
            $acc = supabaseDbSelect('l8_auth_accounts', 'select=*&id=eq.' . rawurlencode($row['account_id']) . '&limit=1');
            if (!empty($acc['ok']) && is_array($acc['body'][0] ?? null)) {
                $dbStore = authStoreFromDbRows([$acc['body'][0]], [$row]);
                $store = authMergeStores($store, $dbStore);
            }
        }
    }

    if (!is_array($entry) || empty($entry['user_id'])) {
        return ['ok' => false, 'error' => 'Material de recuperación inválido'];
    }

    $userId = $entry['user_id'];
    $user = $store['users'][$userId] ?? null;
    if (!is_array($user)) {
        return ['ok' => false, 'error' => 'Cuenta no encontrada'];
    }

    $type = $entry['type'] ?? '';
    if ($type === 'backup_code') {
        $codeMeta = $user['backup_codes'][$hash] ?? null;
        if (!is_array($codeMeta) || !empty($codeMeta['used'])) {
            return ['ok' => false, 'error' => 'Este código de respaldo ya fue usado o no es válido'];
        }
    } elseif ($type === 'recovery_key') {
        if (!authTimingSafeEqual($user['recovery_hash'] ?? '', $hash)) {
            return ['ok' => false, 'error' => 'Clave de recuperación inválida'];
        }
    } else {
        return ['ok' => false, 'error' => 'Material de recuperación inválido'];
    }

    $pair = authGenerateUniqueKeyPair($store);
    if (empty($pair['ok'])) {
        return $pair;
    }
    $kit = authBuildRecoveryKit($store);
    if (empty($kit['ok'])) {
        return $kit;
    }

    // Revocar login anterior + índices de recuperación viejos
    authRevokeUserLoginKeys($store, $userId);
    authInvalidateUserSessions($store, $userId);

    $oldRecoveryHash = $user['recovery_hash'] ?? '';
    if ($oldRecoveryHash !== '') {
        unset($store['recovery_hashes'][$oldRecoveryHash]);
    }
    foreach (($user['backup_codes'] ?? []) as $oldCodeHash => $_m) {
        unset($store['recovery_hashes'][$oldCodeHash]);
    }

    $store['users'][$userId]['aes256_hash'] = $pair['aes256_hash'];
    $store['users'][$userId]['identity_hash'] = $pair['identity_hash'];
    $store['users'][$userId]['recovery_hash'] = $kit['recovery_hash'];
    $store['users'][$userId]['backup_codes'] = $kit['backup_code_hashes'];
    $store['users'][$userId]['recovered_at'] = date('c');

    $store['key_hashes'][$pair['aes256_hash']] = $userId;
    $store['key_hashes'][$pair['identity_hash']] = $userId;
    $store['recovery_hashes'][$kit['recovery_hash']] = [
        'user_id' => $userId,
        'type' => 'recovery_key'
    ];
    foreach ($kit['backup_code_hashes'] as $codeHash => $_meta) {
        $store['recovery_hashes'][$codeHash] = [
            'user_id' => $userId,
            'type' => 'backup_code'
        ];
    }

    $token = authCreateSession($store, $userId);
    $saved = authSaveStore($store);
    if (empty($saved['ok'])) {
        return $saved;
    }

    return [
        'ok' => true,
        'account_id' => $userId,
        'session_token' => $token,
        'rotated' => true,
        'keys' => [
            'aes256' => $pair['aes256'],
            'identity' => $pair['identity'],
            'recovery' => $kit['recovery_key'],
            'backup_codes' => $kit['backup_codes']
        ],
        'persisted' => $saved['persisted'] ?? null,
        'from_supabase' => !empty($store['_meta']['db_pulled']) || !empty($store['_meta']['storage_hydrated']),
        'warning' => 'Acceso recuperado desde identidades en Supabase. Las AES/L8ID anteriores ya no sirven. Guarda el nuevo kit.'
    ];
}

function authLogin($aes256, $identity) {
    $aes256 = trim((string)$aes256);
    $identity = trim((string)$identity);
    if ($aes256 === '' || $identity === '') {
        return ['ok' => false, 'error' => 'Debes introducir las 2 claves de acceso'];
    }
    if (authTimingSafeEqual($aes256, $identity)) {
        return ['ok' => false, 'error' => 'Las dos claves deben ser distintas'];
    }

    // Identidades desde Supabase (sobrevive redeploy de Render)
    $store = authLoadStore(true);
    $aesHash = authHashKey($aes256);
    $idHash = authHashKey($identity);

    $userFromAes = $store['key_hashes'][$aesHash] ?? null;
    $userFromId = $store['key_hashes'][$idHash] ?? null;

    if (!$userFromAes || !$userFromId || $userFromAes !== $userFromId) {
        return ['ok' => false, 'error' => 'Claves incorrectas. Acceso denegado.'];
    }

    $user = $store['users'][$userFromAes] ?? null;
    if (!is_array($user)) {
        return ['ok' => false, 'error' => 'Cuenta no encontrada'];
    }

    // Verificar que cada hash corresponde al campo correcto
    if (
        !authTimingSafeEqual($user['aes256_hash'] ?? '', $aesHash) ||
        !authTimingSafeEqual($user['identity_hash'] ?? '', $idHash)
    ) {
        return ['ok' => false, 'error' => 'Claves incorrectas. Acceso denegado.'];
    }

    $token = authCreateSession($store, $user['id']);
    $saved = authSaveStore($store);
    if (empty($saved['ok'])) {
        return $saved;
    }

    return [
        'ok' => true,
        'account_id' => $user['id'],
        'session_token' => $token
    ];
}

function authValidateSession($token) {
    $token = trim((string)$token);
    if ($token === '') {
        return ['ok' => false, 'authenticated' => false, 'error' => 'Sin sesión'];
    }
    $store = authLoadStore();
    $tokenHash = authHashKey($token);
    $sess = $store['sessions'][$tokenHash] ?? null;
    if (!is_array($sess)) {
        return ['ok' => false, 'authenticated' => false, 'error' => 'Sesión inválida'];
    }
    if ((int)($sess['expires_at'] ?? 0) < time()) {
        unset($store['sessions'][$tokenHash]);
        authSaveStore($store);
        return ['ok' => false, 'authenticated' => false, 'error' => 'Sesión expirada'];
    }
    $userId = $sess['user_id'] ?? '';
    if ($userId === '' || !isset($store['users'][$userId])) {
        return ['ok' => false, 'authenticated' => false, 'error' => 'Cuenta inválida'];
    }
    return [
        'ok' => true,
        'authenticated' => true,
        'account_id' => $userId
    ];
}

function authLogout($token) {
    $token = trim((string)$token);
    if ($token === '') {
        return ['ok' => true];
    }
    $store = authLoadStore();
    $tokenHash = authHashKey($token);
    unset($store['sessions'][$tokenHash]);
    authSaveStore($store);
    return ['ok' => true];
}

function authStatusPublic() {
    return [
        'ok' => true,
        'register_gate_configured' => authDilithiumConfigured()
    ];
}

function authBearerTokenFromRequest() {
    $hdr = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
    if (preg_match('/Bearer\s+(\S+)/i', $hdr, $m)) {
        return $m[1];
    }
    $input = json_decode((string)l8RequestBody(), true);
    if (is_array($input) && !empty($input['session_token'])) {
        return (string)$input['session_token'];
    }
    if (!empty($_GET['token'])) {
        return (string)$_GET['token'];
    }
    return '';
}

/**
 * Maneja rutas /api/auth/* — retorna true si respondió.
 */
function authHandleApi($uri) {
    $uri = (string)$uri;
    if (strpos($uri, '/api/auth') !== 0) {
        return false;
    }

    if (!function_exists('securityRateAllow')) {
        require_once __DIR__ . '/security.php';
    }

    header('Content-Type: application/json; charset=utf-8');
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

    if ($uri === '/api/auth/status' && $method === 'GET') {
        echo json_encode(authStatusPublic(), JSON_UNESCAPED_UNICODE);
        return true;
    }

    if ($uri === '/api/auth/session' && $method === 'GET') {
        if (!securityRateAllow('auth_session', 60, 60)) {
            securityRateDenyJson(30);
        }
        $token = authBearerTokenFromRequest();
        $res = authValidateSession($token);
        if (empty($res['ok'])) {
            http_response_code(401);
            echo json_encode(['ok' => false, 'authenticated' => false], JSON_UNESCAPED_UNICODE);
            return true;
        }
        echo json_encode([
            'ok' => true,
            'authenticated' => true,
            'account_id' => $res['account_id'] ?? ($res['user_id'] ?? null)
        ], JSON_UNESCAPED_UNICODE);
        return true;
    }

    if ($uri === '/api/auth/register' && $method === 'POST') {
        if (!securityRateAllow('auth_register', 5, 3600)) {
            securityRateDenyJson(3600);
        }
        $input = json_decode((string)l8RequestBody(), true) ?? [];
        $dil = $input['dilithium5'] ?? $input['dilithium_5'] ?? $input['d5'] ?? '';
        $res = authRegister($dil);
        if (empty($res['ok'])) {
            http_response_code(401);
            echo json_encode(['ok' => false, 'error' => 'Registration failed'], JSON_UNESCAPED_UNICODE);
            return true;
        }
        echo json_encode($res, JSON_UNESCAPED_UNICODE);
        return true;
    }

    if ($uri === '/api/auth/login' && $method === 'POST') {
        if (!securityRateAllow('auth_login', 8, 60)) {
            securityRateDenyJson(60);
        }
        $input = json_decode((string)l8RequestBody(), true) ?? [];
        $aes = $input['aes256'] ?? $input['aes_256'] ?? $input['key_aes'] ?? '';
        $identity = $input['identity'] ?? $input['identity_key'] ?? $input['key_identity'] ?? '';
        $res = authLogin($aes, $identity);
        if (empty($res['ok'])) {
            http_response_code(401);
            echo json_encode(['ok' => false, 'error' => 'Invalid credentials'], JSON_UNESCAPED_UNICODE);
            return true;
        }
        echo json_encode($res, JSON_UNESCAPED_UNICODE);
        return true;
    }

    if ($uri === '/api/auth/logout' && $method === 'POST') {
        $token = authBearerTokenFromRequest();
        echo json_encode(authLogout($token), JSON_UNESCAPED_UNICODE);
        return true;
    }

    if ($uri === '/api/auth/recover' && $method === 'POST') {
        if (!securityRateAllow('auth_recover', 5, 600)) {
            securityRateDenyJson(600);
        }
        $input = json_decode((string)l8RequestBody(), true) ?? [];
        $material = $input['recovery'] ?? $input['recovery_key'] ?? $input['backup_code'] ?? $input['code'] ?? '';
        $res = authRecover($material);
        if (empty($res['ok'])) {
            http_response_code(401);
            echo json_encode(['ok' => false, 'error' => 'Recovery failed'], JSON_UNESCAPED_UNICODE);
            return true;
        }
        echo json_encode($res, JSON_UNESCAPED_UNICODE);
        return true;
    }

    http_response_code(404);
    echo json_encode(['ok' => false, 'error' => 'Not found'], JSON_UNESCAPED_UNICODE);
    return true;
}
