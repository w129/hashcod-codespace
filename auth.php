<?php
/**
 * Auth gate l8 codespace — registro / login.
 *
 * La clave Dilithium-5 mensual de registro SOLO vive en entorno:
 *   L8_DILITHIUM5_REGISTER_KEY
 * Nunca se escribe en el repo ni se expone por API.
 */

require_once __DIR__ . '/supabase.php';
if (!function_exists('secretGet')) {
    require_once __DIR__ . '/secrets.php';
}
require_once __DIR__ . '/cloudflare-turnstile.php';

function authStorageDir() {
    $dir = __DIR__ . '/data_storage/auth';
    if (!is_dir($dir)) {
        @mkdir($dir, 0700, true);
    }
    @chmod($dir, 0700);
    return $dir;
}

function authUsersPath() {
    return authStorageDir() . '/users.json';
}

function authCleanKey($key) {
    if ($key === null || $key === false) return '';
    $key = trim((string)$key);
    // Remover espacios no rompibles (nbsp), espacios de ancho cero y comillas de móviles
    $key = preg_replace('/^[\s\x{00a0}\x{200b}\"\']+|[\s\x{00a0}\x{200b}\"\']+$/u', '', $key);
    return trim($key);
}

function authPepper() {
    static $cached = null;
    if (is_string($cached) && $cached !== '') {
        return $cached;
    }

    // 1) Variable de entorno o bóveda si está definida
    $pepper = function_exists('secretGet') ? secretGet('L8_AUTH_PEPPER', '') : envValue('L8_AUTH_PEPPER', '');
    if ($pepper !== '') {
        $cached = $pepper;
        return $cached;
    }

    // 2) Pepper permanente maestro post-cuántico (inmutable entre reinicios de Render)
    $masterSig = defined('DILITHIUM5_ADMIN_SIGNATURE_EXACT') ? DILITHIUM5_ADMIN_SIGNATURE_EXACT : '';
    if ($masterSig === '') {
        $masterSig = 'HASHCOD_PQC_MASTER_PEPPER_V1_2026_STABLE_SUPABASE_PERSISTENCE';
    }
    $cached = hash('sha256', 'l8_auth_master_pepper_pqc_' . $masterSig);
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

if (!defined('L8_DILITHIUM5_REGISTER_KEY_DEFAULT')) {
    define('L8_DILITHIUM5_REGISTER_KEY_DEFAULT', 'DILITHIUM5_SIG_V1_TklTVC1QUUMtTUwtRFNBLTg3OkRJTElUSElVTTU6TEVWRUw1OlJFR0lTVEVSX01PTlRITFk6MjAyNg==.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');
}

function authDilithiumRegisterKey() {
    $key = '';
    if (function_exists('secretGet')) {
        $key = trim((string) secretGet('L8_DILITHIUM5_REGISTER_KEY', ''));
    }
    if ($key === '') {
        $key = trim((string) envValue('L8_DILITHIUM5_REGISTER_KEY', ''));
    }
    if ($key === '') {
        $key = trim((string) L8_DILITHIUM5_REGISTER_KEY_DEFAULT);
    }
    return $key;
}

function authDilithiumConfigured() {
    return authDilithiumRegisterKey() !== '';
}

function authVerifyDilithium($provided) {
    $expected = authDilithiumRegisterKey();
    if ($expected === '') {
        return ['ok' => false, 'error' => 'Registro no disponible: falta configurar clave de registro en el servidor'];
    }
    $provided = trim((string)$provided);
    if ($provided === '') {
        return ['ok' => false, 'error' => 'Introduce la Dilithium-5 de registro'];
    }

    // Normalizar si viene con prefijo DILITHIUM5_ADMIN_SIGNATURE= o L8_DILITHIUM5_REGISTER_KEY=
    if (strpos($provided, 'DILITHIUM5_ADMIN_SIGNATURE=') === 0) {
        $provided = substr($provided, strlen('DILITHIUM5_ADMIN_SIGNATURE='));
    } elseif (strpos($provided, 'L8_DILITHIUM5_REGISTER_KEY=') === 0) {
        $provided = substr($provided, strlen('L8_DILITHIUM5_REGISTER_KEY='));
    }
    if (strpos($expected, 'DILITHIUM5_ADMIN_SIGNATURE=') === 0) {
        $expected = substr($expected, strlen('DILITHIUM5_ADMIN_SIGNATURE='));
    } elseif (strpos($expected, 'L8_DILITHIUM5_REGISTER_KEY=') === 0) {
        $expected = substr($expected, strlen('L8_DILITHIUM5_REGISTER_KEY='));
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
        'expires_at' => $now + (60 * 60 * 24 * 30), // 30 días
        'kind' => 'account', // separación: nunca guest
        'ip_hash' => substr(hash('sha256', function_exists('securityClientIp') ? securityClientIp() : ''), 0, 16),
    ];
    return $token;
}

/** Cookie HttpOnly de sesión de cuenta (separada del guest l8_tokens_guest). */
function authSessionCookieName() {
    return 'l8_auth_session';
}

function authIssueSessionCookie($token) {
    $token = trim((string)$token);
    if ($token === '' || headers_sent()) return false;
    $secure = function_exists('securityIsHttps') ? securityIsHttps() : (
        (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https')
    );
    return setcookie(authSessionCookieName(), $token, [
        'expires' => time() + (60 * 60 * 24 * 30),
        'path' => '/',
        'secure' => $secure,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
}

function authClearSessionCookie() {
    if (headers_sent()) return false;
    $secure = function_exists('securityIsHttps') ? securityIsHttps() : false;
    return setcookie(authSessionCookieName(), '', [
        'expires' => time() - 3600,
        'path' => '/',
        'secure' => $secure,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
}

/** Flags de origen de token para CSRF (cookie vs Bearer). */
function &authSessionRequestFlags() {
    static $flags = null;
    if (!is_array($flags)) {
        $flags = ['bearer' => false, 'cookie' => false, 'body' => false, 'query' => false];
    }
    return $flags;
}

function authSessionUsedBearer() {
    $f = authSessionRequestFlags();
    return !empty($f['bearer']);
}

function authSessionUsedCookie() {
    $f = authSessionRequestFlags();
    return !empty($f['cookie']);
}

/**
 * Token de sesión de cuenta: Bearer > cookie HttpOnly > query (legacy).
 * Guest cookie (l8_tokens_guest) NUNCA se usa aquí.
 * Nota: no lee php://input (solo se puede leer una vez); el body session_token
 * lo resuelven los handlers que ya parsean JSON.
 */
function authSessionTokenFromRequest() {
    $flags = &authSessionRequestFlags();
    $hdr = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
    if (preg_match('/Bearer\s+(\S+)/i', $hdr, $m)) {
        $flags['bearer'] = true;
        return $m[1];
    }
    $cookieName = authSessionCookieName();
    if (!empty($_COOKIE[$cookieName])) {
        $flags['cookie'] = true;
        return (string)$_COOKIE[$cookieName];
    }
    if (!empty($_GET['token'])) {
        $flags['query'] = true;
        return (string)$_GET['token'];
    }
    return '';
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

    if (function_exists('supabaseLogActivity')) {
        @supabaseLogActivity('AUTH_REGISTER', $userId, ['account_id' => $userId], $userId);
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
    $aes256 = authCleanKey($aes256);
    $identity = authCleanKey($identity);
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

    if (function_exists('supabaseLogActivity')) {
        @supabaseLogActivity('AUTH_LOGIN', $user['id'], ['account_id' => $user['id']], $user['id']);
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
    return authSessionTokenFromRequest();
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
        if (!securityRateAllow('auth_register', 20, 3600)) {
            securityRateDenyJson(3600);
        }
        $body = function_exists('securityReadJsonBody') ? securityReadJsonBody(65536) : ['ok' => true, 'data' => json_decode((string)file_get_contents('php://input'), true) ?? []];
        if (empty($body['ok'])) {
            http_response_code(400);
            echo json_encode(['ok' => false, 'error' => $body['error'] ?? 'Bad request'], JSON_UNESCAPED_UNICODE);
            return true;
        }
        $input = $body['data'] ?? [];
        $privacyAccepted = !empty($input['privacy_accepted']) || !empty($input['accept_privacy']) || !empty($input['privacy']);
        if (!$privacyAccepted) {
            http_response_code(400);
            echo json_encode(['ok' => false, 'error' => 'Debes marcar que aceptas la Política de Privacidad para registrarte.'], JSON_UNESCAPED_UNICODE);
            return true;
        }

        $checkoutAccepted = !empty($input['checkout_accepted']) || !empty($input['accept_checkout']);
        if (!$checkoutAccepted) {
            http_response_code(400);
            echo json_encode(['ok' => false, 'error' => 'Debes confirmar el checkout y términos de suscripción mensual (US$ 60.27) para registrarte.'], JSON_UNESCAPED_UNICODE);
            return true;
        }
        $cfToken = $input['cf_turnstile_response'] ?? ($input['cf-turnstile-response'] ?? ($input['turnstile_token'] ?? ''));
        if (function_exists('cfTurnstileIsEnabled') && cfTurnstileIsEnabled()) {
            if ($cfToken === '') {
                http_response_code(403);
                echo json_encode(['ok' => false, 'error' => 'Por favor, completa la casilla de verificación de Cloudflare Turnstile antes de continuar.'], JSON_UNESCAPED_UNICODE);
                return true;
            }
            $cfRes = cfTurnstileVerify($cfToken);
            if (empty($cfRes['ok'])) {
                http_response_code(403);
                $errDetail = !empty($cfRes['error_codes']) ? (' (' . implode(', ', $cfRes['error_codes']) . ')') : '';
                echo json_encode(['ok' => false, 'error' => 'Verificación de seguridad Cloudflare no superada' . $errDetail . '. Por favor, vuelve a marcar la casilla de Cloudflare.'], JSON_UNESCAPED_UNICODE);
                return true;
            }
        }
        $dil = $input['dilithium5'] ?? $input['dilithium_5'] ?? $input['d5'] ?? '';
        $res = authRegister($dil);
        if (empty($res['ok'])) {
            if (function_exists('securityIpStrike')) securityIpStrike('auth_register_fail', 12, 3600, 3600);
            http_response_code(401);
            echo json_encode(['ok' => false, 'error' => $res['error'] ?? 'Registration failed'], JSON_UNESCAPED_UNICODE);
            return true;
        }
        if (!empty($res['session_token'])) {
            authIssueSessionCookie($res['session_token']);
        }
        echo json_encode($res, JSON_UNESCAPED_UNICODE);
        return true;
    }

    if ($uri === '/api/auth/login' && $method === 'POST') {
        if (!securityRateAllow('auth_login', 15, 60)) {
            securityRateDenyJson(60);
        }
        $body = function_exists('securityReadJsonBody') ? securityReadJsonBody(65536) : ['ok' => true, 'data' => json_decode((string)file_get_contents('php://input'), true) ?? []];
        if (empty($body['ok'])) {
            http_response_code(400);
            echo json_encode(['ok' => false, 'error' => $body['error'] ?? 'Bad request'], JSON_UNESCAPED_UNICODE);
            return true;
        }
        $input = $body['data'] ?? [];
        $cfToken = $input['cf_turnstile_response'] ?? ($input['cf-turnstile-response'] ?? ($input['turnstile_token'] ?? ''));
        if (function_exists('cfTurnstileIsEnabled') && cfTurnstileIsEnabled()) {
            if ($cfToken === '') {
                http_response_code(403);
                echo json_encode(['ok' => false, 'error' => 'Por favor, completa la casilla de verificación de Cloudflare Turnstile antes de continuar.'], JSON_UNESCAPED_UNICODE);
                return true;
            }
            $cfRes = cfTurnstileVerify($cfToken);
            if (empty($cfRes['ok'])) {
                http_response_code(403);
                $errDetail = !empty($cfRes['error_codes']) ? (' (' . implode(', ', $cfRes['error_codes']) . ')') : '';
                echo json_encode(['ok' => false, 'error' => 'Verificación de seguridad Cloudflare no superada' . $errDetail . '. Por favor, vuelve a marcar la casilla de Cloudflare.'], JSON_UNESCAPED_UNICODE);
                return true;
            }
        }
        $aes = $input['aes256'] ?? $input['aes_256'] ?? $input['key_aes'] ?? '';
        $identity = $input['identity'] ?? $input['identity_key'] ?? $input['key_identity'] ?? '';
        $res = authLogin($aes, $identity);
        if (empty($res['ok'])) {
            if (function_exists('securityIpStrike')) securityIpStrike('auth_login_fail', 15, 600, 1800);
            http_response_code(401);
            echo json_encode(['ok' => false, 'error' => $res['error'] ?? 'Invalid credentials'], JSON_UNESCAPED_UNICODE);
            return true;
        }
        if (!empty($res['session_token'])) {
            authIssueSessionCookie($res['session_token']);
        }
        echo json_encode($res, JSON_UNESCAPED_UNICODE);
        return true;
    }

    if ($uri === '/api/auth/logout' && $method === 'POST') {
        $token = authBearerTokenFromRequest();
        $res = authLogout($token);
        authClearSessionCookie();
        echo json_encode($res, JSON_UNESCAPED_UNICODE);
        return true;
    }

    if ($uri === '/api/auth/recover' && $method === 'POST') {
        if (!securityRateAllow('auth_recover', 15, 600)) {
            securityRateDenyJson(600);
        }
        $body = function_exists('securityReadJsonBody') ? securityReadJsonBody(65536) : ['ok' => true, 'data' => json_decode((string)file_get_contents('php://input'), true) ?? []];
        if (empty($body['ok'])) {
            http_response_code(400);
            echo json_encode(['ok' => false, 'error' => $body['error'] ?? 'Bad request'], JSON_UNESCAPED_UNICODE);
            return true;
        }
        $input = $body['data'] ?? [];
        $cfToken = $input['cf_turnstile_response'] ?? ($input['cf-turnstile-response'] ?? ($input['turnstile_token'] ?? ''));
        if (function_exists('cfTurnstileIsEnabled') && cfTurnstileIsEnabled() && $cfToken !== '') {
            $cfRes = cfTurnstileVerify($cfToken);
            if (empty($cfRes['ok'])) {
                http_response_code(403);
                echo json_encode(['ok' => false, 'error' => 'Verificación de seguridad Cloudflare fallida. Por favor, completa el desafío.'], JSON_UNESCAPED_UNICODE);
                return true;
            }
        }
        $material = $input['recovery'] ?? $input['recovery_key'] ?? $input['backup_code'] ?? $input['code'] ?? '';
        $res = authRecover($material);
        if (empty($res['ok'])) {
            if (function_exists('securityIpStrike')) securityIpStrike('auth_recover_fail', 12, 600, 1800);
            http_response_code(401);
            echo json_encode(['ok' => false, 'error' => $res['error'] ?? 'Recovery failed'], JSON_UNESCAPED_UNICODE);
            return true;
        }
        if (!empty($res['session_token'])) {
            authIssueSessionCookie($res['session_token']);
        }
        echo json_encode($res, JSON_UNESCAPED_UNICODE);
        return true;
    }

    http_response_code(404);
    echo json_encode(['ok' => false, 'error' => 'Not found'], JSON_UNESCAPED_UNICODE);
    return true;
}
