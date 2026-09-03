<?php
/**
 * Auth gate l8 codespace — registro / login.
 *
 * La clave Dilithium-5 mensual de registro SOLO vive en entorno:
 *   L8_DILITHIUM5_REGISTER_KEY
 * Nunca se escribe en el repo ni se expone por API.
 */

require_once __DIR__ . '/supabase.php';
require_once __DIR__ . '/cache.php';
require_once __DIR__ . '/quantum-entropy.php';
require_once __DIR__ . '/atomic-time.php';
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
    // Remover espacios no rompibles (nbsp), espacios de ancho cero y comillas comunes de teclados móviles
    $key = preg_replace('/^[\s\x{00a0}\x{200b}\"\']+|[\s\x{00a0}\x{200b}\"\']+$/u', '', $key);
    return trim($key);
}

function authMasterPepper() {
    $masterSig = defined('DILITHIUM5_ADMIN_SIGNATURE_EXACT') ? DILITHIUM5_ADMIN_SIGNATURE_EXACT : '';
    if ($masterSig === '') {
        $masterSig = 'HASHCOD_PQC_MASTER_PEPPER_V1_2026_STABLE_SUPABASE_PERSISTENCE';
    }
    return hash('sha256', 'l8_auth_master_pepper_pqc_' . $masterSig);
}

function authPepper() {
    static $cached = null;
    if (is_string($cached) && $cached !== '') {
        return $cached;
    }

    // 1) Env o Bóveda si existe
    $pepper = function_exists('secretGet') ? secretGet('L8_AUTH_PEPPER', '') : (function_exists('envValue') ? envValue('L8_AUTH_PEPPER', '') : '');
    if ($pepper !== '') {
        $cached = $pepper;
        return $cached;
    }

    // 2) Supabase Storage (pepper original con el que se crearon las cuentas previas)
    if (function_exists('supabaseConfig') && function_exists('supabaseStorageDownload')) {
        $cfg = supabaseConfig();
        if (!empty($cfg['configured'])) {
            $remote = @supabaseStorageDownload('meta/auth_pepper');
            if (!empty($remote['ok']) && is_string($remote['data'])) {
                $fromRemote = trim($remote['data']);
                if ($fromRemote !== '') {
                    $cached = $fromRemote;
                    return $cached;
                }
            }
        }
    }

    // 3) Pepper Maestro Permanente Post-Cuántico
    $cached = authMasterPepper();
    return $cached;
}

function authGetAllCandidatePeppers() {
    if (function_exists('l8CacheGet')) {
        $cached = l8CacheGet('auth_candidate_peppers');
        if (is_array($cached) && !empty($cached)) {
            return $cached;
        }
    }

    $peppers = [];

    // Master permanente
    $peppers[] = authMasterPepper();

    // Variable de entorno
    $envPep = function_exists('secretGet') ? secretGet('L8_AUTH_PEPPER', '') : (function_exists('envValue') ? envValue('L8_AUTH_PEPPER', '') : '');
    if ($envPep !== '') $peppers[] = $envPep;

    // Supabase Storage meta/auth_pepper (con cache estática)
    static $cachedRemotePepper = null;
    if ($cachedRemotePepper === null) {
        $cachedRemotePepper = '';
        if (function_exists('supabaseConfig') && function_exists('supabaseStorageDownload')) {
            $cfg = supabaseConfig();
            if (!empty($cfg['configured'])) {
                $remote = @supabaseStorageDownload('meta/auth_pepper');
                if (!empty($remote['ok']) && is_string($remote['data'])) {
                    $cachedRemotePepper = trim($remote['data']);
                }
            }
        }
    }
    if ($cachedRemotePepper !== '') {
        $peppers[] = $cachedRemotePepper;
    }

    // Determinista DILITHIUM5_ADMIN_SIGNATURE
    $sig = function_exists('secretGet') ? secretGet('DILITHIUM5_ADMIN_SIGNATURE', '') : (function_exists('envValue') ? envValue('DILITHIUM5_ADMIN_SIGNATURE', '') : '');
    if ($sig !== '') {
        $peppers[] = hash('sha256', 'l8_auth_pepper_deterministic_' . $sig);
    }
    if (defined('DILITHIUM5_ADMIN_SIGNATURE_EXACT')) {
        $peppers[] = hash('sha256', 'l8_auth_pepper_deterministic_' . DILITHIUM5_ADMIN_SIGNATURE_EXACT);
    }

    // Fallbacks históricos
    $peppers[] = 'l8_codespace_default_pepper';
    $peppers[] = '';

    $resolved = array_values(array_unique(array_filter($peppers, function ($p) { return is_string($p); })));
    if (function_exists('l8CacheSet')) {
        l8CacheSet('auth_candidate_peppers', $resolved, 600);
    }
    return $resolved;
}

function authHashKey($plaintext) {
    return hash_hmac('sha256', (string)$plaintext, authPepper());
}

/**
 * Hashes password using Argon2id with high-cost parameters and pre-hashed HMAC pepper.
 */
function authHashPassword($plaintext) {
    $str = (string)$plaintext;
    $pepper = authPepper();
    $prehashed = hash_hmac('sha256', $str, $pepper);
    if (defined('PASSWORD_ARGON2ID')) {
        return password_hash($prehashed, PASSWORD_ARGON2ID, [
            'memory_cost' => 65536,
            'time_cost' => 4,
            'threads' => 1
        ]);
    }
    if (defined('PASSWORD_ARGON2I')) {
        return password_hash($prehashed, PASSWORD_ARGON2I, [
            'memory_cost' => 65536,
            'time_cost' => 4,
            'threads' => 1
        ]);
    }
    return password_hash($prehashed, PASSWORD_DEFAULT, ['cost' => 12]);
}

/**
 * Verifies password against stored hash (supporting Argon2id and legacy hashes).
 */
function authVerifyPassword($plaintext, $storedHash) {
    $str = (string)$plaintext;
    $stored = (string)$storedHash;
    if ($str === '' || $stored === '') {
        return false;
    }
    if (strpos($stored, '$') === 0) {
        $peppers = authGetAllCandidatePeppers();
        foreach ($peppers as $p) {
            $prehashed = hash_hmac('sha256', $str, $p);
            if (password_verify($prehashed, $stored)) {
                return true;
            }
        }
        if (password_verify($str, $stored)) {
            return true;
        }
    }
    $candidates = authHashCandidates($str);
    foreach ($candidates as $cand) {
        if (authTimingSafeEqual($cand, $stored)) {
            return true;
        }
    }
    return false;
}

function authNeedsRehash($storedHash) {
    $stored = (string)$storedHash;
    if (strpos($stored, '$') !== 0) {
        return true;
    }
    if (defined('PASSWORD_ARGON2ID')) {
        return password_needs_rehash($stored, PASSWORD_ARGON2ID, [
            'memory_cost' => 65536,
            'time_cost' => 4,
            'threads' => 1
        ]);
    }
    return password_needs_rehash($stored, PASSWORD_DEFAULT);
}

/** Devuelve todos los hashes posibles para soportar cuentas creadas con cualquier versión de pepper */
function authHashCandidates($plaintext) {
    $str = (string)$plaintext;
    $hashes = [];
    $peppers = authGetAllCandidatePeppers();
    foreach ($peppers as $p) {
        $hashes[] = hash_hmac('sha256', $str, $p);
    }
    $hashes[] = hash('sha256', $str);
    $hashes[] = hash('sha512', $str);
    return array_values(array_unique(array_filter($hashes)));
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
    $key = '';
    if (function_exists('secretGet')) {
        $key = trim((string) secretGet('L8_DILITHIUM5_REGISTER_KEY', ''));
        if ($key === '') {
            $key = trim((string) secretGet('DILITHIUM5_ADMIN_SIGNATURE', ''));
        }
    }
    if ($key === '') {
        $key = trim((string) envValue('L8_DILITHIUM5_REGISTER_KEY', ''));
    }
    if ($key === '') {
        $key = trim((string) envValue('DILITHIUM5_ADMIN_SIGNATURE', ''));
    }
    return $key;
}

function authDilithiumConfigured() {
    return authDilithiumRegisterKey() !== '';
}

function authActiveDilithiumEpochPath() {
    return authStorageDir() . '/active_dilithium5_epoch.json';
}

function authSetActiveDilithiumKey($key, $epoch = null) {
    $cleanKey = trim((string)$key);
    if ($cleanKey === '') return false;
    $record = [
        'active_key_hash' => hash('sha256', $cleanKey),
        'active_key_exact' => $cleanKey,
        'epoch' => $epoch ?: microtime(true),
        'timestamp' => time(),
        'revoked_previous' => true
    ];
    $path = authActiveDilithiumEpochPath();
    @file_put_contents($path, json_encode($record, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES), LOCK_EX);
    return true;
}

function authGetActiveDilithiumRecord() {
    $path = authActiveDilithiumEpochPath();
    if (!file_exists($path)) return null;
    $raw = @file_get_contents($path);
    if (!$raw) return null;
    $data = json_decode($raw, true);
    return is_array($data) ? $data : null;
}

function authVerifyDilithium($provided) {
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

    // =========================================================================
    // REGLA INVIOLABLE: Unicidad y Revocación de Claves Dilithium-5
    // Cuando se genera una clave Dilithium-5 en el generador, ESA es la ÚNICA
    // que se debe usar para crear las credenciales y NO puede validarse alguna anterior.
    // =========================================================================
    $activeRecord = authGetActiveDilithiumRecord();
    if ($activeRecord && !empty($activeRecord['active_key_exact'])) {
        $activeKey = trim((string)$activeRecord['active_key_exact']);
        if (!authTimingSafeEqual($provided, $activeKey)) {
            return [
                'ok' => false,
                'error' => 'La clave Dilithium-5 proporcionada ha sido revocada, ha expirado o es anterior. Solo se permite validar y registrar credenciales con la última clave generada ahora en la plataforma.'
            ];
        }
        return ['ok' => true];
    }

    // Si aún no se ha generado una clave dinámica, verificar contra la clave de entorno
    $expected = authDilithiumRegisterKey();
    if ($expected !== '') {
        if (strpos($expected, 'DILITHIUM5_ADMIN_SIGNATURE=') === 0) {
            $expected = substr($expected, strlen('DILITHIUM5_ADMIN_SIGNATURE='));
        } elseif (strpos($expected, 'L8_DILITHIUM5_REGISTER_KEY=') === 0) {
            $expected = substr($expected, strlen('L8_DILITHIUM5_REGISTER_KEY='));
        }
        if (authTimingSafeEqual($provided, $expected)) {
            return ['ok' => true];
        }
    }

    return [
        'ok' => false,
        'error' => 'Dilithium-5 inválida o revocada. Debes generar una nueva clave activa en el generador Dilithium-5.'
    ];
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

/** Fusiona store A con B (B gana en conflictos de usuario/hash, preservando hashes no vacíos). */
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
        $mergedUser = ($newTs >= $prevTs) ? array_replace($prev, $user) : array_replace($user, $prev);

        // Preservar hashes criptográficos si uno de los lados venía en blanco
        foreach (['aes256_hash', 'identity_hash', 'recovery_hash'] as $hField) {
            if (empty($mergedUser[$hField])) {
                if (!empty($prev[$hField])) $mergedUser[$hField] = $prev[$hField];
                elseif (!empty($user[$hField])) $mergedUser[$hField] = $user[$hField];
            }
        }
        if (empty($mergedUser['backup_codes']) && !empty($prev['backup_codes'])) {
            $mergedUser['backup_codes'] = $prev['backup_codes'];
        } elseif (!empty($prev['backup_codes']) && !empty($user['backup_codes']) && is_array($prev['backup_codes']) && is_array($user['backup_codes'])) {
            $mergedUser['backup_codes'] = array_replace($prev['backup_codes'], $user['backup_codes']);
        }
        $out['users'][$id] = $mergedUser;
    }

    // Reconstruir índices criptográficos limpiamente para purgar hashes revocados
    $out['key_hashes'] = [];
    $out['recovery_hashes'] = [];
    foreach ($out['users'] as $uid => $u) {
        if (!empty($u['aes256_hash'])) {
            $out['key_hashes'][$u['aes256_hash']] = $uid;
        }
        if (!empty($u['identity_hash'])) {
            $out['key_hashes'][$u['identity_hash']] = $uid;
        }
        if (!empty($u['recovery_hash'])) {
            $out['recovery_hashes'][$u['recovery_hash']] = [
                'user_id' => $uid,
                'type' => 'recovery_key'
            ];
        }
        $bCodes = $u['backup_codes'] ?? [];
        if (is_string($bCodes)) $bCodes = json_decode($bCodes, true) ?: [];
        if (is_array($bCodes)) {
            foreach ($bCodes as $codeHash => $bMeta) {
                $out['recovery_hashes'][(string)$codeHash] = [
                    'user_id' => $uid,
                    'type' => 'backup_code'
                ];
            }
        }
    }

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
        if (!empty($row['recovery_hash'])) {
            $store['recovery_hashes'][$row['recovery_hash']] = [
                'user_id' => $id,
                'type' => 'recovery_key'
            ];
        }
        foreach ($backup as $codeHash => $meta) {
            $store['recovery_hashes'][(string)$codeHash] = [
                'user_id' => $id,
                'type' => 'backup_code'
            ];
        }
    }
    foreach ($identities as $row) {
        if (!is_array($row) || empty($row['hash']) || empty($row['account_id'])) continue;
        $hash = (string)$row['hash'];
        $accountId = (string)$row['account_id'];
        $kind = (string)($row['kind'] ?? '');

        if (!isset($store['users'][$accountId])) {
            $store['users'][$accountId] = [
                'id' => $accountId,
                'created_at' => $row['updated_at'] ?? date('c'),
                'recovered_at' => null,
                'updated_at' => $row['updated_at'] ?? date('c'),
                'aes256_hash' => ($kind === 'aes256') ? $hash : '',
                'identity_hash' => ($kind === 'identity') ? $hash : '',
                'recovery_hash' => ($kind === 'recovery_key') ? $hash : '',
                'backup_codes' => []
            ];
        } else {
            if ($kind === 'aes256' && empty($store['users'][$accountId]['aes256_hash'])) {
                $store['users'][$accountId]['aes256_hash'] = $hash;
            } elseif ($kind === 'identity' && empty($store['users'][$accountId]['identity_hash'])) {
                $store['users'][$accountId]['identity_hash'] = $hash;
            } elseif ($kind === 'recovery_key' && empty($store['users'][$accountId]['recovery_hash'])) {
                $store['users'][$accountId]['recovery_hash'] = $hash;
            }
        }

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
    $accountsRes = supabaseDbSelect('l8_auth_accounts', 'select=*&limit=5000');
    if (empty($accountsRes['ok'])) {
        return ['ok' => false, 'error' => $accountsRes['error'] ?? 'sin tabla l8_auth_accounts', 'store' => null];
    }
    $identRes = supabaseDbSelect('l8_auth_identities', 'select=*&limit=10000');
    $accounts = is_array($accountsRes['body'] ?? null) ? $accountsRes['body'] : [];
    $identities = (!empty($identRes['ok']) && is_array($identRes['body'] ?? null)) ? $identRes['body'] : [];
    return [
        'ok' => true,
        'store' => authStoreFromDbRows($accounts, $identities),
        'accounts' => count($accounts),
        'identities' => count($identities)
    ];
}

function authPushStoreToSupabaseDb(array $store, $targetAccountId = null) {
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

    // Identificar cuentas a sincronizar
    $accountsToProcess = [];
    if ($targetAccountId !== null && isset($store['users'][$targetAccountId])) {
        $accountsToProcess[$targetAccountId] = $store['users'][$targetAccountId];
    } else {
        $accountsToProcess = $store['users'];
    }

    foreach ($accountsToProcess as $id => $user) {
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

        // Limpia identidades previas de esta cuenta vía Hard Delete HTTP
        if ($targetAccountId !== null) {
            if (function_exists('supabaseDbHardDelete')) {
                @supabaseDbHardDelete('l8_auth_identities', 'account_id=eq.' . rawurlencode($accountId));
            } elseif (function_exists('supabaseDbDelete')) {
                @supabaseDbDelete('l8_auth_identities', 'account_id=eq.' . rawurlencode($accountId));
            }
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

function authSaveStore(array $store, $targetAccountId = null) {
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

    $db = authPushStoreToSupabaseDb($store, $targetAccountId);

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
    // 32 bytes → hex (representación AES-256) con entropía híbrida cuántica
    if (function_exists('quantumGenerateSecureNonce')) {
        return strtoupper(quantumGenerateSecureNonce(32));
    }
    return strtoupper(bin2hex(random_bytes(32)));
}

function authGenerateIdentityKey() {
    // Identificador de plataforma distinto a Dilithium-5 y a AES-256
    // Formato: L8ID-<base64url 48 bytes>
    $raw = function_exists('quantumHarvestEntropy') ? quantumHarvestEntropy(48) : random_bytes(48);
    $b64 = rtrim(strtr(base64_encode($raw), '+/', '-_'), '=');
    return 'L8ID-' . $b64;
}

function authGenerateRecoveryKey() {
    // Clave maestra de recuperación (offline). Formato: L8REC-<base64url 40 bytes>
    $raw = function_exists('quantumHarvestEntropy') ? quantumHarvestEntropy(40) : random_bytes(40);
    $b64 = rtrim(strtr(base64_encode($raw), '+/', '-_'), '=');
    return 'L8REC-' . $b64;
}

function authGenerateBackupCodes($count = 8) {
    $codes = [];
    for ($i = 0; $i < $count; $i++) {
        // Grupos legibles: XXXX-XXXX-XXXX
        $hex = strtoupper(function_exists('quantumGenerateSecureNonce') ? quantumGenerateSecureNonce(6) : bin2hex(random_bytes(6)));
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
    $hex = function_exists('quantumGenerateSecureNonce') ? quantumGenerateSecureNonce(8) : bin2hex(random_bytes(8));
    return 'acct_' . $hex;
}

function authCreateSession(array &$store, $userId) {
    $token = function_exists('quantumGenerateSecureNonce') ? quantumGenerateSecureNonce(32) : bin2hex(random_bytes(32));
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
        'created_time' => $now,
        'last_activity' => $now,
        'idle_timeout' => 7200, // 2 horas de inactividad
        'expires_at' => $now + (60 * 60 * 24), // 24 horas de vida absoluta
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
        || true
    );
    return setcookie(authSessionCookieName(), $token, [
        'expires' => time() + (60 * 60 * 24),
        'path' => '/',
        'secure' => $secure,
        'httponly' => true,
        'samesite' => 'Strict',
    ]);
}

function authClearSessionCookie() {
    if (headers_sent()) return false;
    $secure = function_exists('securityIsHttps') ? securityIsHttps() : true;
    return setcookie(authSessionCookieName(), '', [
        'expires' => time() - 3600,
        'path' => '/',
        'secure' => $secure,
        'httponly' => true,
        'samesite' => 'Strict',
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
    $saved = authSaveStore($store, $userId);
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
    $candidates = authHashCandidates($material);
    $entry = null;
    $matchedRecoveryHash = null;
    
    foreach ($candidates as $h) {
        if (!empty($store['recovery_hashes'][$h])) {
            $entry = $store['recovery_hashes'][$h];
            $matchedRecoveryHash = $h;
            break;
        }
        // Buscar directamente en users por si recovery_hashes no estaba mapeado
        foreach ($store['users'] as $uid => $u) {
            if (($u['recovery_hash'] ?? '') === $h) {
                $entry = ['user_id' => $uid, 'type' => 'recovery_key'];
                $matchedRecoveryHash = $h;
                break 2;
            }
            if (!empty($u['backup_codes'][$h])) {
                $entry = ['user_id' => $uid, 'type' => 'backup_code'];
                $matchedRecoveryHash = $h;
                break 2;
            }
        }
    }

    // Fallback directo a Postgres por candidatos de hash de recuperación
    if ((!is_array($entry) || empty($entry['user_id'])) && function_exists('supabaseDbSelect') && function_exists('supabaseConfig') && !empty(supabaseConfig()['configured'])) {
        foreach ($candidates as $h) {
            $q = 'select=*&hash=eq.' . rawurlencode($h) . '&limit=1';
            $hit = supabaseDbSelect('l8_auth_identities', $q);
            if (!empty($hit['ok']) && is_array($hit['body']) && !empty($hit['body'][0]['account_id'])) {
                $row = $hit['body'][0];
                $entry = [
                    'user_id' => $row['account_id'],
                    'type' => $row['kind'] ?? 'recovery_key'
                ];
                $matchedRecoveryHash = $h;
                $acc = supabaseDbSelect('l8_auth_accounts', 'select=*&id=eq.' . rawurlencode($row['account_id']) . '&limit=1');
                if (!empty($acc['ok']) && is_array($acc['body'][0] ?? null)) {
                    $dbStore = authStoreFromDbRows([$acc['body'][0]], [$row]);
                    $store = authMergeStores($store, $dbStore);
                }
                break;
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
        $codeMeta = $user['backup_codes'][$matchedRecoveryHash] ?? ($user['backup_codes'][$material] ?? null);
        if (is_array($codeMeta) && !empty($codeMeta['used'])) {
            return ['ok' => false, 'error' => 'Este código de respaldo ya fue usado'];
        }
    } elseif ($type === 'recovery_key') {
        $userRecHash = $user['recovery_hash'] ?? '';
        $matched = false;
        foreach ($candidates as $cand) {
            if (authTimingSafeEqual($userRecHash, $cand)) {
                $matched = true;
                break;
            }
        }
        if (!$matched && !empty($userRecHash)) {
            return ['ok' => false, 'error' => 'Clave de recuperación inválida'];
        }
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
    $saved = authSaveStore($store, $userId);
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
    $field1 = authCleanKey($aes256);
    $field2 = authCleanKey($identity);

    // If both empty
    if ($field1 === '' && $field2 === '') {
        return ['ok' => false, 'error' => 'Falta ingresar la Clave AES-256 y la Clave identificador (L8ID).'];
    }

    // Check if recovery key or backup code was entered into either field
    $isRec1 = (stripos($field1, 'L8REC-') === 0 || preg_match('/^[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/i', $field1));
    $isRec2 = (stripos($field2, 'L8REC-') === 0 || preg_match('/^[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/i', $field2));
    if ($isRec1 && $field2 === '') {
        return authRecover($field1);
    }
    if ($isRec2 && $field1 === '') {
        return authRecover($field2);
    }
    if ($isRec1 && !$isRec2) {
        return authRecover($field1);
    }
    if ($isRec2 && !$isRec1) {
        return authRecover($field2);
    }

    if ($field1 === '') {
        return ['ok' => false, 'error' => 'Falta la Clave AES-256 (campo 1).'];
    }
    if ($field2 === '') {
        return ['ok' => false, 'error' => 'Falta la Clave identificador L8ID (campo 2).'];
    }
    if (authTimingSafeEqual($field1, $field2)) {
        return ['ok' => false, 'error' => 'Ambas casillas contienen la misma clave. Debes ingresar tu Clave AES-256 en la primera y tu L8ID en la segunda.'];
    }

    // Auto-detect and swap inverted fields seamlessly
    if (
        (stripos($field1, 'L8ID-') === 0 && stripos($field2, 'L8ID-') !== 0) ||
        (stripos($field1, 'acct_') === 0 && preg_match('/^[a-f0-9]{64}$/i', $field2)) ||
        (!preg_match('/^[a-f0-9]{64}$/i', $field1) && preg_match('/^[a-f0-9]{64}$/i', $field2))
    ) {
        $temp = $field1;
        $field1 = $field2;
        $field2 = $temp;
    }

    $aes256 = $field1;
    $identity = $field2;

    // Identidades desde Supabase (sobrevive redeploy de Render)
    $store = authLoadStore(true);
    $totalUsers = count($store['users'] ?? []);

    $aesCandidates = authHashCandidates($aes256);
    $idCandidates = authHashCandidates($identity);

    // Case: Logging in with AES-256 + Account ID (acct_...)
    if (stripos($identity, 'acct_') === 0 || isset($store['users'][$identity])) {
        $targetUserId = (string)$identity;
        $user = $store['users'][$targetUserId] ?? null;

        // Try direct Supabase DB pull if not in store
        if (!is_array($user) && function_exists('supabaseDbSelect') && function_exists('supabaseConfig') && !empty(supabaseConfig()['configured'])) {
            $dbAcc = supabaseDbSelect('l8_auth_accounts', 'select=*&id=eq.' . rawurlencode($targetUserId) . '&limit=1');
            if (!empty($dbAcc['ok']) && is_array($dbAcc['body'][0] ?? null)) {
                $userRow = $dbAcc['body'][0];
                $user = [
                    'id' => $targetUserId,
                    'created_at' => $userRow['created_at'] ?? null,
                    'aes256_hash' => $userRow['aes256_hash'] ?? '',
                    'identity_hash' => $userRow['identity_hash'] ?? '',
                    'recovery_hash' => $userRow['recovery_hash'] ?? '',
                    'backup_codes' => is_string($userRow['backup_codes'] ?? null) ? (json_decode($userRow['backup_codes'], true) ?: []) : ($userRow['backup_codes'] ?? [])
                ];
                $store['users'][$targetUserId] = $user;
            }
        }

        if (is_array($user)) {
            $userAesHash = $user['aes256_hash'] ?? '';
            $aesOk = in_array($userAesHash, $aesCandidates, true);
            if (!$aesOk) {
                foreach ($aesCandidates as $h) {
                    if (isset($store['key_hashes'][$h]) && $store['key_hashes'][$h] === $targetUserId) {
                        $aesOk = true;
                        break;
                    }
                }
            }
            if ($aesOk) {
                $masterPepper = authMasterPepper();
                $masterAesHash = hash_hmac('sha256', $aes256, $masterPepper);
                if ($userAesHash !== $masterAesHash) {
                    if ($userAesHash && isset($store['key_hashes'][$userAesHash])) unset($store['key_hashes'][$userAesHash]);
                    $store['users'][$targetUserId]['aes256_hash'] = $masterAesHash;
                    $store['key_hashes'][$masterAesHash] = $targetUserId;
                    $store['users'][$targetUserId]['updated_at'] = date('c');
                }
                $token = authCreateSession($store, $targetUserId);
                authSaveStore($store, $targetUserId);
                if (function_exists('supabaseLogActivity')) {
                    @supabaseLogActivity('AUTH_LOGIN_ACCT_ID', $targetUserId, ['account_id' => $targetUserId], $targetUserId);
                }
                return [
                    'ok' => true,
                    'account_id' => $targetUserId,
                    'session_token' => $token,
                    'resolved_via' => 'account_id_plus_aes'
                ];
            } else {
                return [
                    'ok' => false,
                    'error' => 'La cuenta ' . $targetUserId . ' fue localizada en Supabase, pero la clave AES-256 ingresada no es válida para esta cuenta. Verifica los 64 caracteres de tu clave AES-256.'
                ];
            }
        }
    }

    // Standard AES + L8ID matching
    $userFromAes = null;
    $matchedAesHash = null;
    foreach ($aesCandidates as $h) {
        if (!empty($store['key_hashes'][$h])) {
            $userFromAes = $store['key_hashes'][$h];
            $matchedAesHash = $h;
            break;
        }
        foreach ($store['users'] as $uid => $u) {
            if (($u['aes256_hash'] ?? '') === $h) {
                $userFromAes = $uid;
                $matchedAesHash = $h;
                break 2;
            }
        }
    }

    // Direct DB lookup for AES if not in store
    if (!$userFromAes && function_exists('supabaseDbSelect') && function_exists('supabaseConfig') && !empty(supabaseConfig()['configured'])) {
        foreach ($aesCandidates as $h) {
            $hit = supabaseDbSelect('l8_auth_identities', 'select=*&hash=eq.' . rawurlencode($h) . '&kind=eq.aes256&limit=1');
            if (!empty($hit['ok']) && !empty($hit['body'][0]['account_id'])) {
                $userFromAes = $hit['body'][0]['account_id'];
                $matchedAesHash = $h;
                break;
            }
        }
    }

    $userFromId = null;
    $matchedIdHash = null;
    foreach ($idCandidates as $h) {
        if (!empty($store['key_hashes'][$h])) {
            $userFromId = $store['key_hashes'][$h];
            $matchedIdHash = $h;
            break;
        }
        foreach ($store['users'] as $uid => $u) {
            if (($u['identity_hash'] ?? '') === $h) {
                $userFromId = $uid;
                $matchedIdHash = $h;
                break 2;
            }
        }
    }

    // Direct DB lookup for Identity if not in store
    if (!$userFromId && function_exists('supabaseDbSelect') && function_exists('supabaseConfig') && !empty(supabaseConfig()['configured'])) {
        foreach ($idCandidates as $h) {
            $hit = supabaseDbSelect('l8_auth_identities', 'select=*&hash=eq.' . rawurlencode($h) . '&kind=eq.identity&limit=1');
            if (!empty($hit['ok']) && !empty($hit['body'][0]['account_id'])) {
                $userFromId = $hit['body'][0]['account_id'];
                $matchedIdHash = $h;
                break;
            }
        }
    }

    if (!$userFromAes && !$userFromId) {
        if ($totalUsers === 0) {
            return [
                'ok' => false,
                'error' => 'No hay cuentas registradas en la base de datos (0 cuentas). Si aún no has creado tu cuenta permanente, ve a la pestaña "Registrarse" primero.'
            ];
        }
        return [
            'ok' => false,
            'error' => 'Ninguna de las dos claves coincide con las cuentas registradas en Supabase (Cuentas activas: ' . $totalUsers . '). Si creaste tu cuenta antes del último reinicio, regístrate nuevamente en "Registrarse" o recupera con tu kit L8REC.'
        ];
    }
    if (!$userFromAes) {
        return [
            'ok' => false,
            'error' => 'La clave AES-256 no coincide con ninguna cuenta en Supabase. La clave identificador (L8ID) sí es válida para la cuenta ' . $userFromId . '; verifica tu clave AES-256.'
        ];
    }
    if (!$userFromId) {
        // If AES matches a valid account, check if identity is a recovery key or backup code for that account
        $userObj = $store['users'][$userFromAes] ?? null;
        if (is_array($userObj)) {
            $userRecHash = $userObj['recovery_hash'] ?? '';
            $recOk = in_array($userRecHash, $idCandidates, true);
            if ($recOk) {
                $userFromId = $userFromAes;
            }
        }
        if (!$userFromId) {
            return [
                'ok' => false,
                'error' => 'La clave identificador (L8ID) no coincide con ninguna cuenta. La clave AES-256 sí es válida para la cuenta ' . $userFromAes . '; verifica tu clave L8ID-...'
            ];
        }
    }
    if ($userFromAes !== $userFromId) {
        return [
            'ok' => false,
            'error' => 'Conflicto de claves: La clave AES-256 pertenece a una cuenta distinta que la clave identificador ingresada. Debes usar las 2 claves del mismo kit.'
        ];
    }

    $user = $store['users'][$userFromAes] ?? null;
    if (!is_array($user)) {
        if (function_exists('supabaseDbSelect') && function_exists('supabaseConfig') && !empty(supabaseConfig()['configured'])) {
            $dbAcc = supabaseDbSelect('l8_auth_accounts', 'select=*&id=eq.' . rawurlencode($userFromAes) . '&limit=1');
            if (!empty($dbAcc['ok']) && is_array($dbAcc['body'][0] ?? null)) {
                $user = [
                    'id' => $userFromAes,
                    'created_at' => $dbAcc['body'][0]['created_at'] ?? null,
                    'aes256_hash' => $dbAcc['body'][0]['aes256_hash'] ?? '',
                    'identity_hash' => $dbAcc['body'][0]['identity_hash'] ?? '',
                    'recovery_hash' => $dbAcc['body'][0]['recovery_hash'] ?? '',
                    'backup_codes' => is_string($dbAcc['body'][0]['backup_codes'] ?? null) ? (json_decode($dbAcc['body'][0]['backup_codes'], true) ?: []) : ($dbAcc['body'][0]['backup_codes'] ?? [])
                ];
                $store['users'][$userFromAes] = $user;
            }
        }
        if (!is_array($user)) {
            return ['ok' => false, 'error' => 'Cuenta registrada pero no localizada en el almacén de usuarios.'];
        }
    }

    $userAesHash = $user['aes256_hash'] ?? '';
    $userIdHash = $user['identity_hash'] ?? '';

    // Validar que las credenciales coincidan con los hashes activos de la cuenta
    $aesMatchesActive = in_array($userAesHash, $aesCandidates, true);
    $idMatchesActive = in_array($userIdHash, $idCandidates, true);

    if (!$aesMatchesActive || !$idMatchesActive) {
        return [
            'ok' => false,
            'error' => 'Las claves ingresadas no coinciden con las credenciales activas de la cuenta. Si recuperaste tu cuenta recientemente, utiliza el nuevo kit emitido.'
        ];
    }

    // Auto-migración al pepper maestro permanente si la cuenta usaba un hash antiguo
    $masterPepper = authMasterPepper();
    $masterAesHash = hash_hmac('sha256', $aes256, $masterPepper);
    $masterIdHash = hash_hmac('sha256', $identity, $masterPepper);

    if ($userAesHash !== $masterAesHash || $userIdHash !== $masterIdHash) {
        if ($userAesHash && isset($store['key_hashes'][$userAesHash])) unset($store['key_hashes'][$userAesHash]);
        if ($userIdHash && isset($store['key_hashes'][$userIdHash])) unset($store['key_hashes'][$userIdHash]);
        
        $store['users'][$user['id']]['aes256_hash'] = $masterAesHash;
        $store['users'][$user['id']]['identity_hash'] = $masterIdHash;
        $store['key_hashes'][$masterAesHash] = $user['id'];
        $store['key_hashes'][$masterIdHash] = $user['id'];
        $store['users'][$user['id']]['updated_at'] = date('c');
    }

    $token = authCreateSession($store, $user['id']);
    $saved = authSaveStore($store, $user['id']);
    if (empty($saved['ok'])) {
        return $saved;
    }

    if (function_exists('supabaseLogActivity')) {
        @supabaseLogActivity('AUTH_LOGIN', $user['id'], ['account_id' => $user['id']], $user['id']);
    }

    return [
        'ok' => true,
        'account_id' => $user['id'],
        'session_token' => $token,
        'persisted' => $saved['persisted'] ?? null
    ];
}

/**
 * Diagnóstico y validador de claves / cuentas seguro.
 * Comprueba existencia en Supabase DB y Storage sin exponer secretos.
 */
function authValidateKey($key, $type = 'auto') {
    $raw = trim((string)$key);
    if ($raw === '') {
        return [
            'ok' => false,
            'exists' => false,
            'error' => 'Por favor introduce una clave o identificador de cuenta para comprobar.'
        ];
    }

    $clean = authCleanKey($raw);
    $store = authLoadStore(true);

    $detectedType = 'unknown';
    $accountId = null;
    $source = 'not_found';

    if (stripos($clean, 'acct_') === 0 || isset($store['users'][$clean])) {
        $detectedType = 'account_id';
        if (isset($store['users'][$clean])) {
            $accountId = $clean;
            $source = 'local_store';
        }
    } elseif (stripos($clean, 'L8REC-') === 0) {
        $detectedType = 'recovery_key';
    } elseif (stripos($clean, 'L8ID-') === 0) {
        $detectedType = 'identity';
    } elseif (preg_match('/^[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/i', $clean)) {
        $detectedType = 'backup_code';
    } elseif (preg_match('/^[a-f0-9]{64}$/i', $clean)) {
        $detectedType = 'aes256';
    } else {
        $detectedType = 'generic_key';
    }

    $candidates = authHashCandidates($clean);
    if (!$accountId) {
        foreach ($candidates as $h) {
            if (!empty($store['key_hashes'][$h])) {
                $accountId = $store['key_hashes'][$h];
                $source = 'store_key_hashes';
                break;
            }
            if (!empty($store['recovery_hashes'][$h]['user_id'])) {
                $accountId = $store['recovery_hashes'][$h]['user_id'];
                if ($detectedType === 'unknown' || $detectedType === 'generic_key') {
                    $detectedType = $store['recovery_hashes'][$h]['type'] ?? 'recovery_key';
                }
                $source = 'store_recovery_hashes';
                break;
            }
            foreach ($store['users'] as $uid => $u) {
                if (($u['aes256_hash'] ?? '') === $h) {
                    $accountId = $uid;
                    $detectedType = 'aes256';
                    $source = 'store_users_aes';
                    break 2;
                }
                if (($u['identity_hash'] ?? '') === $h) {
                    $accountId = $uid;
                    $detectedType = 'identity';
                    $source = 'store_users_id';
                    break 2;
                }
                if (($u['recovery_hash'] ?? '') === $h) {
                    $accountId = $uid;
                    $detectedType = 'recovery_key';
                    $source = 'store_users_rec';
                    break 2;
                }
                if (!empty($u['backup_codes'][$h])) {
                    $accountId = $uid;
                    $detectedType = 'backup_code';
                    $source = 'store_users_backup';
                    break 2;
                }
            }
        }
    }

    // Direct Supabase PostgREST query if not resolved
    if (function_exists('supabaseDbSelect') && function_exists('supabaseConfig') && !empty(supabaseConfig()['configured'])) {
        if (!$accountId) {
            if ($detectedType === 'account_id') {
                $dbAcc = supabaseDbSelect('l8_auth_accounts', 'select=*&id=eq.' . rawurlencode($clean) . '&limit=1');
                if (!empty($dbAcc['ok']) && !empty($dbAcc['body'][0]['id'])) {
                    $accountId = $dbAcc['body'][0]['id'];
                    $source = 'supabase_db_accounts';
                    $bCodes = $dbAcc['body'][0]['backup_codes'] ?? [];
                    if (is_string($bCodes)) $bCodes = json_decode($bCodes, true) ?: [];
                    if (!is_array($bCodes)) $bCodes = [];
                    $store['users'][$accountId] = [
                        'id' => $accountId,
                        'created_at' => $dbAcc['body'][0]['created_at'] ?? null,
                        'updated_at' => $dbAcc['body'][0]['updated_at'] ?? null,
                        'recovered_at' => $dbAcc['body'][0]['recovered_at'] ?? null,
                        'aes256_hash' => $dbAcc['body'][0]['aes256_hash'] ?? '',
                        'identity_hash' => $dbAcc['body'][0]['identity_hash'] ?? '',
                        'recovery_hash' => $dbAcc['body'][0]['recovery_hash'] ?? '',
                        'backup_codes' => $bCodes
                    ];
                }
            }

            if (!$accountId) {
                foreach ($candidates as $h) {
                    $dbId = supabaseDbSelect('l8_auth_identities', 'select=*&hash=eq.' . rawurlencode($h) . '&limit=1');
                    if (!empty($dbId['ok']) && !empty($dbId['body'][0]['account_id'])) {
                        $row = $dbId['body'][0];
                        $accountId = $row['account_id'];
                        $source = 'supabase_db_identities';
                        if ($detectedType === 'unknown' || $detectedType === 'generic_key') {
                            $detectedType = $row['kind'] ?? 'identity';
                        }
                        $dbAcc = supabaseDbSelect('l8_auth_accounts', 'select=*&id=eq.' . rawurlencode($accountId) . '&limit=1');
                        if (!empty($dbAcc['ok']) && !empty($dbAcc['body'][0]['id'])) {
                            $bCodes = $dbAcc['body'][0]['backup_codes'] ?? [];
                            if (is_string($bCodes)) $bCodes = json_decode($bCodes, true) ?: [];
                            if (!is_array($bCodes)) $bCodes = [];
                            $store['users'][$accountId] = [
                                'id' => $accountId,
                                'created_at' => $dbAcc['body'][0]['created_at'] ?? null,
                                'updated_at' => $dbAcc['body'][0]['updated_at'] ?? null,
                                'recovered_at' => $dbAcc['body'][0]['recovered_at'] ?? null,
                                'aes256_hash' => $dbAcc['body'][0]['aes256_hash'] ?? '',
                                'identity_hash' => $dbAcc['body'][0]['identity_hash'] ?? '',
                                'recovery_hash' => $dbAcc['body'][0]['recovery_hash'] ?? '',
                                'backup_codes' => $bCodes
                            ];
                        } else {
                            $store['users'][$accountId] = [
                                'id' => $accountId,
                                'created_at' => $row['updated_at'] ?? null,
                                'updated_at' => $row['updated_at'] ?? null,
                                'recovered_at' => null,
                                'aes256_hash' => ($row['kind'] === 'aes256') ? $row['hash'] : '',
                                'identity_hash' => ($row['kind'] === 'identity') ? $row['hash'] : '',
                                'recovery_hash' => ($row['kind'] === 'recovery_key') ? $row['hash'] : '',
                                'backup_codes' => []
                            ];
                        }
                        break;
                    }
                }
            }
        }
    }

    if (!$accountId || empty($store['users'][$accountId])) {
        return [
            'ok' => true,
            'exists' => false,
            'key_type' => $detectedType,
            'account_id' => null,
            'status' => 'not_found',
            'message' => 'La clave o identificador no existe en la base de datos de Supabase ni en el almacenamiento.'
        ];
    }

    $user = $store['users'][$accountId];
    $backupCount = 0;
    $bCodes = $user['backup_codes'] ?? [];
    if (is_string($bCodes)) $bCodes = json_decode($bCodes, true) ?: [];
    if (is_array($bCodes)) {
        $backupCount = count($bCodes);
    }

    return [
        'ok' => true,
        'exists' => true,
        'key_type' => $detectedType,
        'account_id' => $accountId,
        'status' => 'active',
        'source' => $source,
        'account_preview' => [
            'id' => $accountId,
            'created_at' => $user['created_at'] ?? null,
            'updated_at' => $user['updated_at'] ?? null,
            'recovered_at' => $user['recovered_at'] ?? null,
            'has_aes256' => !empty($user['aes256_hash']),
            'has_identity' => !empty($user['identity_hash']),
            'has_recovery' => !empty($user['recovery_hash']),
            'backup_codes_count' => $backupCount,
            'persistence' => [
                'supabase_db' => !empty($store['_meta']['db_pulled']) || strpos($source, 'supabase') !== false,
                'supabase_storage' => !empty($store['_meta']['storage_hydrated'])
            ]
        ],
        'message' => 'Cuenta localizada y validada con éxito en Supabase.'
    ];
}

/**
 * Obtiene la vista previa segura de una cuenta por ID o Clave.
 */
function authAccountPreview($accountIdOrKey) {
    return authValidateKey($accountIdOrKey, 'auto');
}

function authValidateSession($token) {
    $token = trim((string)$token);
    if ($token === '' || strlen($token) < 16) {
        return ['ok' => false, 'authenticated' => false, 'error' => 'Sin sesión'];
    }

    $tokenHash = authHashKey($token);

    // 1. Fast Path Negativo (Token inválido reciente en caché de 30s)
    if (function_exists('l8CacheGet')) {
        $isBad = l8CacheGet('auth_bad_sess_' . $tokenHash);
        if ($isBad === true) {
            return ['ok' => false, 'authenticated' => false, 'error' => 'Sesión inválida'];
        }

        // 2. Fast Path Positivo (Sesión válida activa en APCu / Memoria - 0 DB roundtrips)
        $cachedSess = l8CacheGet('auth_sess_' . $tokenHash);
        if (is_array($cachedSess) && !empty($cachedSess['account_id'])) {
            $now = time();
            $lastAct = (int)($cachedSess['last_activity'] ?? $now);
            $idleLimit = (int)($cachedSess['idle_timeout'] ?? 7200);
            $exp = (int)($cachedSess['expires_at'] ?? 0);
            if (($now - $lastAct) <= $idleLimit && ($exp === 0 || $exp > $now)) {
                $cachedSess['last_activity'] = $now;
                if (function_exists('l8CacheSet')) {
                    l8CacheSet('auth_sess_' . $tokenHash, $cachedSess, 300);
                }
                return [
                    'ok' => true,
                    'authenticated' => true,
                    'account_id' => $cachedSess['account_id'],
                    'cached' => true
                ];
            }
            l8CacheDel('auth_sess_' . $tokenHash);
        }
    }

    // 3. Fallback: Carga local rápida sin obligar pull remoto bloqueante
    $store = authLoadStore(false);
    $sess = $store['sessions'][$tokenHash] ?? null;

    if (!is_array($sess)) {
        if (function_exists('l8CacheSet')) {
            l8CacheSet('auth_bad_sess_' . $tokenHash, true, 30);
        }
        return ['ok' => false, 'authenticated' => false, 'error' => 'Sesión inválida'];
    }

    $now = time();
    $lastActivity = (int)($sess['last_activity'] ?? strtotime($sess['created_at'] ?? ''));
    $idleLimit = (int)($sess['idle_timeout'] ?? 7200);

    // Check 2-hour idle timeout
    if ($lastActivity > 0 && ($now - $lastActivity) > $idleLimit) {
        unset($store['sessions'][$tokenHash]);
        authSaveStore($store);
        if (function_exists('l8CacheSet')) {
            l8CacheSet('auth_bad_sess_' . $tokenHash, true, 30);
        }
        return ['ok' => false, 'authenticated' => false, 'error' => 'Sesión expirada por inactividad'];
    }

    // Check absolute expiration (24h)
    $exp = (int)($sess['expires_at'] ?? 0);
    if ($exp !== 0 && $exp < $now) {
        unset($store['sessions'][$tokenHash]);
        authSaveStore($store);
        if (function_exists('l8CacheSet')) {
            l8CacheSet('auth_bad_sess_' . $tokenHash, true, 30);
        }
        return ['ok' => false, 'authenticated' => false, 'error' => 'Sesión expirada'];
    }

    $userId = $sess['user_id'] ?? '';
    if ($userId === '' || !isset($store['users'][$userId])) {
        if (function_exists('l8CacheSet')) {
            l8CacheSet('auth_bad_sess_' . $tokenHash, true, 30);
        }
        return ['ok' => false, 'authenticated' => false, 'error' => 'Cuenta inválida'];
    }

    // Refresh sliding activity timestamp
    $store['sessions'][$tokenHash]['last_activity'] = $now;

    // Guardar en caché positiva con TTL acotado
    if (function_exists('l8CacheSet')) {
        $ttl = ($exp > $now) ? min(300, $exp - $now) : 300;
        l8CacheSet('auth_sess_' . $tokenHash, [
            'account_id' => $userId,
            'last_activity' => $now,
            'idle_timeout' => $idleLimit,
            'expires_at' => $exp
        ], max(30, $ttl));
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

    $tokenHash = authHashKey($token);

    if (function_exists('l8CacheDel')) {
        l8CacheDel('auth_sess_' . $tokenHash);
        l8CacheDel('auth_bad_sess_' . $tokenHash);
    }

    $store = authLoadStore(false);
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

function authDeleteAccount($target = '') {
    $store = authLoadStore();
    $target = trim((string)$target);
    $targetAccountId = null;

    // 1. Check from active session or bearer token
    $token = authBearerTokenFromRequest();
    if ($token !== '') {
        $sessRes = authValidateSession($token);
        if (!empty($sessRes['ok'])) {
            $targetAccountId = $sessRes['account_id'] ?? ($sessRes['user_id'] ?? null);
        }
    }

    // 2. If target provided, search by account_id, identity_key or aes key
    if ($target !== '') {
        if (isset($store['accounts'][$target])) {
            $targetAccountId = $target;
        } elseif (isset($store['users'][$target])) {
            $targetAccountId = $target;
        } else {
            $hash = authHashSecret($target);
            if (isset($store['key_hashes'][$hash])) {
                $targetAccountId = $store['key_hashes'][$hash];
            }
        }
    }

    // 3. Fallback to most recent account in local store
    if ($targetAccountId === null && !empty($store['accounts'])) {
        $keys = array_keys($store['accounts']);
        $targetAccountId = end($keys);
    }

    if ($targetAccountId !== null) {
        authRevokeUserLoginKeys($store, $targetAccountId);
        authInvalidateUserSessions($store, $targetAccountId);
        unset($store['users'][$targetAccountId]);
        unset($store['accounts'][$targetAccountId]);
        $store['audit_log'][] = [
            'type' => 'account_deleted_permanent',
            'account_id' => $targetAccountId,
            'timestamp' => date('c'),
            'ip' => $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1'
        ];
        authSaveStore($store);

        if (function_exists('supabaseDbHardDelete')) {
            @supabaseDbHardDelete('l8_auth_identities', 'account_id=eq.' . rawurlencode($targetAccountId));
            @supabaseDbHardDelete('l8_auth_accounts', 'id=eq.' . rawurlencode($targetAccountId));
        } elseif (function_exists('supabaseDbDelete')) {
            @supabaseDbDelete('l8_auth_identities', 'account_id=eq.' . rawurlencode($targetAccountId));
            @supabaseDbDelete('l8_auth_accounts', 'id=eq.' . rawurlencode($targetAccountId));
        }

        return ['ok' => true, 'message' => 'Cuenta eliminada permanentemente.', 'account_id' => $targetAccountId];
    }

    return ['ok' => true, 'message' => 'Cuenta eliminada permanentemente.'];
}

function authListAccounts() {
    $store = authLoadStore();
    $list = [];
    $seen = [];

    // Collect from store['accounts']
    if (!empty($store['accounts']) && is_array($store['accounts'])) {
        foreach ($store['accounts'] as $accId => $data) {
            $seen[$accId] = true;
            $isSuspended = !empty($data['is_suspended']);
            $list[] = [
                'account_id' => $accId,
                'created_at' => $data['created_at'] ?? ($data['registered_at'] ?? date('c')),
                'is_suspended' => $isSuspended,
                'status' => $isSuspended ? 'Suspendida' : 'Activa',
                'identities_count' => isset($data['identities']) ? count($data['identities']) : 1
            ];
        }
    }

    // Collect from store['users'] if not already in list
    if (!empty($store['users']) && is_array($store['users'])) {
        foreach ($store['users'] as $userId => $data) {
            if (isset($seen[$userId])) {
                continue;
            }
            $isSuspended = !empty($data['is_suspended']);
            $list[] = [
                'account_id' => $userId,
                'created_at' => $data['created_at'] ?? date('c'),
                'is_suspended' => $isSuspended,
                'status' => $isSuspended ? 'Suspendida' : 'Activa',
                'identities_count' => 1
            ];
        }
    }

    // Fallback demonstration accounts if store is completely empty
    if (empty($list)) {
        $activeAcct = $store['active_account'] ?? 'acct_pqc_master_001';
        $list[] = [
            'account_id' => $activeAcct,
            'created_at' => date('c'),
            'is_suspended' => false,
            'status' => 'Activa',
            'identities_count' => 1
        ];
    }

    return ['ok' => true, 'accounts' => $list, 'total' => count($list)];
}

function authSuspendAccount($accountId, $reason = '') {
    $store = authLoadStore();
    $accountId = trim((string)$accountId);
    if ($accountId === '') {
        return ['ok' => false, 'error' => 'Identificador de cuenta requerido'];
    }

    $found = false;
    if (isset($store['accounts'][$accountId])) {
        $store['accounts'][$accountId]['is_suspended'] = true;
        $store['accounts'][$accountId]['suspended_at'] = date('c');
        $store['accounts'][$accountId]['suspend_reason'] = $reason;
        $found = true;
    }
    if (isset($store['users'][$accountId])) {
        $store['users'][$accountId]['is_suspended'] = true;
        $store['users'][$accountId]['suspended_at'] = date('c');
        $store['users'][$accountId]['suspend_reason'] = $reason;
        $found = true;
    }

    if (!$found) {
        $store['accounts'][$accountId] = [
            'id' => $accountId,
            'is_suspended' => true,
            'suspended_at' => date('c'),
            'suspend_reason' => $reason
        ];
    }

    // Invalidate active sessions immediately
    authInvalidateUserSessions($store, $accountId);

    $store['audit_log'][] = [
        'type' => 'account_suspended',
        'account_id' => $accountId,
        'timestamp' => date('c'),
        'ip' => $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1'
    ];
    authSaveStore($store);

    return ['ok' => true, 'account_id' => $accountId, 'is_suspended' => true, 'message' => 'Cuenta suspendida correctamente'];
}

function authReactivateAccount($accountId) {
    $store = authLoadStore();
    $accountId = trim((string)$accountId);
    if ($accountId === '') {
        return ['ok' => false, 'error' => 'Identificador de cuenta requerido'];
    }

    if (isset($store['accounts'][$accountId])) {
        $store['accounts'][$accountId]['is_suspended'] = false;
        $store['accounts'][$accountId]['reactivated_at'] = date('c');
    }
    if (isset($store['users'][$accountId])) {
        $store['users'][$accountId]['is_suspended'] = false;
        $store['users'][$accountId]['reactivated_at'] = date('c');
    }

    $store['audit_log'][] = [
        'type' => 'account_reactivated',
        'account_id' => $accountId,
        'timestamp' => date('c'),
        'ip' => $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1'
    ];
    authSaveStore($store);

    return ['ok' => true, 'account_id' => $accountId, 'is_suspended' => false, 'message' => 'Cuenta reactivada exitosamente'];
}

function authHandleApi($uri) {
    $uri = (string)$uri;
    $path = (string)(parse_url($uri, PHP_URL_PATH) ?: $uri);
    if (strpos($path, '/api/auth') !== 0) {
        return false;
    }

    if (!function_exists('securityRateAllow')) {
        require_once __DIR__ . '/security.php';
    }

    header('Content-Type: application/json; charset=utf-8');
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

    if ($path === '/api/auth/status' && $method === 'GET') {
        echo json_encode(authStatusPublic(), JSON_UNESCAPED_UNICODE);
        return true;
    }

    if ($path === '/api/auth/session' && $method === 'GET') {
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

    if ($path === '/api/auth/register' && $method === 'POST') {
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
                $errCodes = $cfRes['error_codes'] ?? [];
                $errExplanation = 'Verificación de seguridad Cloudflare no superada.';
                if (in_array('timeout-or-duplicate', $errCodes, true)) {
                    $errExplanation = 'El token de Cloudflare expiró (más de 5 min) o ya fue utilizado en una petición anterior. La casilla se ha reiniciado; márcala de nuevo.';
                } elseif (in_array('invalid-input-response', $errCodes, true)) {
                    $errExplanation = 'El token de verificación de Cloudflare no es válido. Por favor, marca la casilla nuevamente.';
                } elseif (in_array('missing-input-response', $errCodes, true)) {
                    $errExplanation = 'Falta completar el desafío de Cloudflare. Por favor, marca la casilla.';
                } elseif (!empty($errCodes)) {
                    $errExplanation = 'Cloudflare rechazó la verificación (código: ' . implode(', ', $errCodes) . '). Por favor, vuelve a marcar la casilla.';
                }
                echo json_encode(['ok' => false, 'error' => $errExplanation, 'cf_errors' => $errCodes], JSON_UNESCAPED_UNICODE);
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

    if ($path === '/api/auth/login' && $method === 'POST') {
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
                $errCodes = $cfRes['error_codes'] ?? [];
                $errExplanation = 'Verificación de seguridad Cloudflare no superada.';
                if (in_array('timeout-or-duplicate', $errCodes, true)) {
                    $errExplanation = 'El token de Cloudflare expiró (más de 5 min) o ya fue utilizado en una petición anterior. La casilla se ha reiniciado; márcala de nuevo.';
                } elseif (in_array('invalid-input-response', $errCodes, true)) {
                    $errExplanation = 'El token de verificación de Cloudflare no es válido. Por favor, marca la casilla nuevamente.';
                } elseif (in_array('missing-input-response', $errCodes, true)) {
                    $errExplanation = 'Falta completar el desafío de Cloudflare. Por favor, marca la casilla.';
                } elseif (!empty($errCodes)) {
                    $errExplanation = 'Cloudflare rechazó la verificación (código: ' . implode(', ', $errCodes) . '). Por favor, vuelve a marcar la casilla.';
                }
                echo json_encode(['ok' => false, 'error' => $errExplanation, 'cf_errors' => $errCodes], JSON_UNESCAPED_UNICODE);
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

    if ($path === '/api/auth/logout' && $method === 'POST') {
        $token = authBearerTokenFromRequest();
        $res = authLogout($token);
        authClearSessionCookie();
        echo json_encode($res, JSON_UNESCAPED_UNICODE);
        return true;
    }

    if ($path === '/api/auth/list-accounts' && ($method === 'GET' || $method === 'POST')) {
        $res = authListAccounts();
        echo json_encode($res, JSON_UNESCAPED_UNICODE);
        return true;
    }

    if ($path === '/api/auth/suspend-account' && $method === 'POST') {
        $body = function_exists('securityReadJsonBody') ? securityReadJsonBody(65536) : ['ok' => true, 'data' => json_decode((string)file_get_contents('php://input'), true) ?? []];
        $data = !empty($body['data']) ? $body['data'] : $_POST;
        $target = $data['account_id'] ?? ($data['id'] ?? '');
        $reason = $data['reason'] ?? 'Suspensión administrativa por política de seguridad';
        $res = authSuspendAccount($target, $reason);
        echo json_encode($res, JSON_UNESCAPED_UNICODE);
        return true;
    }

    if ($path === '/api/auth/reactivate-account' && $method === 'POST') {
        $body = function_exists('securityReadJsonBody') ? securityReadJsonBody(65536) : ['ok' => true, 'data' => json_decode((string)file_get_contents('php://input'), true) ?? []];
        $data = !empty($body['data']) ? $body['data'] : $_POST;
        $target = $data['account_id'] ?? ($data['id'] ?? '');
        $res = authReactivateAccount($target);
        echo json_encode($res, JSON_UNESCAPED_UNICODE);
        return true;
    }


    if ($path === '/api/auth/recover' && $method === 'POST') {
        if (!securityRateAllow('auth_recover', 15, 600)) {
            securityRateDenyJson(600);
        }
        $body = function_exists('securityReadJsonBody') ? securityReadJsonBody(65536) : ['ok' => true, 'data' => json_decode((string)file_get_contents('php://input'), true) ?? []];
        if (empty($body['ok']) && empty($_POST)) {
            http_response_code(400);
            echo json_encode(['ok' => false, 'error' => $body['error'] ?? 'Bad request'], JSON_UNESCAPED_UNICODE);
            return true;
        }
        $input = !empty($body['data']) ? $body['data'] : $_POST;
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
                $errCodes = $cfRes['error_codes'] ?? [];
                $errExplanation = 'Verificación de seguridad Cloudflare no superada.';
                if (in_array('timeout-or-duplicate', $errCodes, true)) {
                    $errExplanation = 'El token de Cloudflare expiró (más de 5 min) o ya fue utilizado en una petición anterior. La casilla se ha reiniciado; márcala de nuevo.';
                } elseif (in_array('invalid-input-response', $errCodes, true)) {
                    $errExplanation = 'El token de verificación de Cloudflare no es válido. Por favor, marca la casilla nuevamente.';
                } elseif (in_array('missing-input-response', $errCodes, true)) {
                    $errExplanation = 'Falta completar el desafío de Cloudflare. Por favor, marca la casilla.';
                } elseif (!empty($errCodes)) {
                    $errExplanation = 'Cloudflare rechazó la verificación (código: ' . implode(', ', $errCodes) . '). Por favor, vuelve a marcar la casilla.';
                }
                echo json_encode(['ok' => false, 'error' => $errExplanation, 'cf_errors' => $errCodes], JSON_UNESCAPED_UNICODE);
                return true;
            }
        }
        $material = $input['recovery'] ?? ($input['recovery_key'] ?? ($input['backup_code'] ?? ($input['code'] ?? '')));
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

    if (($path === '/api/auth/validate-key' || $path === '/api/auth/check-key') && ($method === 'POST' || $method === 'GET')) {
        if (!securityRateAllow('auth_validate_key', 60, 60)) {
            securityRateDenyJson(60);
        }
        $key = '';
        $type = 'auto';
        if ($method === 'POST') {
            $body = function_exists('securityReadJsonBody') ? securityReadJsonBody(65536) : ['ok' => true, 'data' => json_decode((string)file_get_contents('php://input'), true) ?? []];
            $data = !empty($body['data']) ? $body['data'] : $_POST;
            $key = $data['key'] ?? ($data['aes256'] ?? ($data['identity'] ?? ($data['account_id'] ?? ($data['recovery'] ?? ''))));
            $type = $data['type'] ?? 'auto';
        } else {
            $key = $_GET['key'] ?? ($_GET['aes256'] ?? ($_GET['identity'] ?? ($_GET['account_id'] ?? ($_GET['recovery'] ?? ''))));
            $type = $_GET['type'] ?? 'auto';
        }
        $res = authValidateKey($key, $type);
        echo json_encode($res, JSON_UNESCAPED_UNICODE);
        return true;
    }

    if ($path === '/api/auth/preview' && ($method === 'POST' || $method === 'GET')) {
        if (!securityRateAllow('auth_preview', 60, 60)) {
            securityRateDenyJson(60);
        }
        $target = '';
        if ($method === 'POST') {
            $body = function_exists('securityReadJsonBody') ? securityReadJsonBody(65536) : ['ok' => true, 'data' => json_decode((string)file_get_contents('php://input'), true) ?? []];
            $data = !empty($body['data']) ? $body['data'] : $_POST;
            $target = $data['account_id'] ?? ($data['key'] ?? ($data['id'] ?? ''));
        } else {
            $target = $_GET['account_id'] ?? ($_GET['key'] ?? ($_GET['id'] ?? ''));
        }
        $res = authAccountPreview($target);
        echo json_encode($res, JSON_UNESCAPED_UNICODE);
        return true;
    }

    
    if (($path === '/api/auth/delete-account' || $path === '/api/auth/delete') && $method === 'POST') {
        $body = function_exists('securityReadJsonBody') ? securityReadJsonBody(65536) : ['ok' => true, 'data' => json_decode((string)file_get_contents('php://input'), true) ?? []];
        $data = !empty($body['data']) ? $body['data'] : $_POST;
        $target = $data['account_id'] ?? ($data['key'] ?? '');
        $res = authDeleteAccount($target);
        authClearSessionCookie();
        echo json_encode($res, JSON_UNESCAPED_UNICODE);
        return true;
    }

    if ($path === '/api/auth/list-accounts' && ($method === 'GET' || $method === 'POST')) {
        $res = authListAccounts();
        echo json_encode($res, JSON_UNESCAPED_UNICODE);
        return true;
    }

    if ($path === '/api/auth/suspend-account' && $method === 'POST') {
        $body = function_exists('securityReadJsonBody') ? securityReadJsonBody(65536) : ['ok' => true, 'data' => json_decode((string)file_get_contents('php://input'), true) ?? []];
        $data = !empty($body['data']) ? $body['data'] : $_POST;
        $target = $data['account_id'] ?? ($data['id'] ?? '');
        $reason = $data['reason'] ?? 'Suspensión administrativa por política de seguridad';
        $res = authSuspendAccount($target, $reason);
        echo json_encode($res, JSON_UNESCAPED_UNICODE);
        return true;
    }

    if ($path === '/api/auth/reactivate-account' && $method === 'POST') {
        $body = function_exists('securityReadJsonBody') ? securityReadJsonBody(65536) : ['ok' => true, 'data' => json_decode((string)file_get_contents('php://input'), true) ?? []];
        $data = !empty($body['data']) ? $body['data'] : $_POST;
        $target = $data['account_id'] ?? ($data['id'] ?? '');
        $res = authReactivateAccount($target);
        echo json_encode($res, JSON_UNESCAPED_UNICODE);
        return true;
    }


    http_response_code(404);
    echo json_encode(['ok' => false, 'error' => 'Not found'], JSON_UNESCAPED_UNICODE);
    return true;
}
