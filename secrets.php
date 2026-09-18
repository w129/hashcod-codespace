<?php
/**
 * Bóveda de secretos — l8 codespace
 *
 * Orden de resolución (nunca hardcodear Supabase/API keys en el código):
 *   1) Variables de entorno / putenv
 *   2) Secret Files de Render: /etc/secrets/<KEY>
 *   3) Bóveda local cifrada: data_storage/security/vault.enc
 *
 * La clave maestra de la bóveda: L8_VAULT_MASTER_KEY (env o /etc/secrets).
 * Si falta, se genera una vez en data_storage/security/.vault_master (chmod 0600).
 */

if (!function_exists('envValue')) {
    require_once __DIR__ . '/supabase.php';
}

function secretsVaultDir() {
    $dir = __DIR__ . '/data_storage/security';
    if (!is_dir($dir)) {
        @mkdir($dir, 0700, true);
    }
    @chmod($dir, 0700);
    return $dir;
}

/** Clave maestra 32 bytes (binario) para AES-256-GCM de la bóveda. */
function secretsVaultMasterKey() {
    static $key = null;
    if (is_string($key) && strlen($key) === 32) {
        return $key;
    }

    $fromEnv = '';
    if (function_exists('envValue')) {
        $fromEnv = (string) envValue('L8_VAULT_MASTER_KEY', '');
    }
    if ($fromEnv === '') {
        $g = @getenv('L8_VAULT_MASTER_KEY');
        if (is_string($g) && $g !== '') $fromEnv = $g;
    }
    foreach (['/etc/secrets/L8_VAULT_MASTER_KEY', '/etc/secrets/l8_vault_master_key'] as $p) {
        if ($fromEnv === '' && is_readable($p)) {
            $fromEnv = trim((string) @file_get_contents($p));
        }
    }

    if ($fromEnv !== '') {
        // Acepta hex (64) o raw/base64; deriva siempre a 32 bytes.
        if (preg_match('/^[a-f0-9]{64}$/i', $fromEnv)) {
            $key = hex2bin($fromEnv);
        } else {
            $decoded = base64_decode($fromEnv, true);
            if (is_string($decoded) && strlen($decoded) === 32) {
                $key = $decoded;
            } else {
                $key = hash('sha256', $fromEnv, true);
            }
        }
        return $key;
    }

    $file = secretsVaultDir() . '/.vault_master';
    if (is_readable($file)) {
        $raw = (string) @file_get_contents($file);
        if (strlen($raw) === 32) {
            $key = $raw;
            return $key;
        }
        if (preg_match('/^[a-f0-9]{64}$/i', trim($raw))) {
            $key = hex2bin(trim($raw));
            return $key;
        }
    }

    $generated = random_bytes(32);
    @file_put_contents($file, bin2hex($generated), LOCK_EX);
    @chmod($file, 0600);
    $key = $generated;
    return $key;
}

function secretsVaultPath() {
    return secretsVaultDir() . '/vault.enc';
}

function secretsVaultDecryptBlob($blob) {
    $blob = (string) $blob;
    if ($blob === '' || strpos($blob, 'l8v1:') !== 0) {
        return null;
    }
    $parts = explode(':', $blob, 4);
    if (count($parts) !== 4) return null;
    $iv = base64_decode($parts[1], true);
    $tag = base64_decode($parts[2], true);
    $ct = base64_decode($parts[3], true);
    if ($iv === false || $tag === false || $ct === false) return null;
    if (!function_exists('openssl_decrypt')) return null;
    $pt = openssl_decrypt($ct, 'aes-256-gcm', secretsVaultMasterKey(), OPENSSL_RAW_DATA, $iv, $tag);
    if ($pt === false) return null;
    $data = json_decode($pt, true);
    return is_array($data) ? $data : null;
}

function secretsVaultEncryptMap(array $map) {
    if (!function_exists('openssl_encrypt')) {
        return '';
    }
    $iv = random_bytes(12);
    $tag = '';
    $pt = json_encode($map, JSON_UNESCAPED_UNICODE);
    $ct = openssl_encrypt($pt, 'aes-256-gcm', secretsVaultMasterKey(), OPENSSL_RAW_DATA, $iv, $tag);
    if ($ct === false) return '';
    return 'l8v1:' . base64_encode($iv) . ':' . base64_encode($tag) . ':' . base64_encode($ct);
}

function secretsVaultLoad() {
    static $cache = null;
    if (is_array($cache)) return $cache;
    $path = secretsVaultPath();
    if (!is_readable($path)) {
        $cache = [];
        return $cache;
    }
    $raw = (string) @file_get_contents($path);
    $decoded = secretsVaultDecryptBlob($raw);
    $cache = is_array($decoded) ? $decoded : [];
    return $cache;
}

function secretsVaultSave(array $map) {
    $blob = secretsVaultEncryptMap($map);
    if ($blob === '') return false;
    $ok = @file_put_contents(secretsVaultPath(), $blob, LOCK_EX) !== false;
    if ($ok) @chmod(secretsVaultPath(), 0600);
    // invalidate static via reload next call — force by not using stale: re-read always after save
    return $ok;
}

/**
 * Obtiene un secreto por nombre. Nunca registra el valor.
 */
function secretGet($name, $default = '') {
    $name = preg_replace('/[^A-Z0-9_]/i', '', (string) $name);
    if ($name === '') return $default;

    // 1–2) env + /etc/secrets (vía envValue)
    if (function_exists('envValue')) {
        $v = envValue($name, '');
        if ($v !== '') return $v;
    }

    // 3) bóveda cifrada
    $vault = secretsVaultLoad();
    if (isset($vault[$name]) && is_string($vault[$name]) && $vault[$name] !== '') {
        return $vault[$name];
    }
    return $default;
}

/**
 * Guarda/actualiza un secreto SOLO en la bóveda local cifrada (no en .env).
 * Útil para semillas generadas en runtime (unlock seed, etc.).
 */
function secretPutVault($name, $value) {
    $name = preg_replace('/[^A-Z0-9_]/i', '', (string) $name);
    if ($name === '') return false;
    $vault = secretsVaultLoad();
    $vault[$name] = (string) $value;
    $vault['_updated_at'] = date('c');
    return secretsVaultSave($vault);
}

/**
 * Asegura un secreto: si no existe en env/bóveda, genera y persiste en bóveda.
 */
function secretEnsure($name, $generator) {
    $existing = secretGet($name, '');
    if ($existing !== '') return $existing;
    $value = is_callable($generator) ? (string) $generator() : (string) $generator;
    if ($value === '') return '';
    secretPutVault($name, $value);
    return $value;
}

/**
 * Cifrado genérico AES-256-GCM con clave derivada de L8_DATA_ENCRYPTION_KEY o vault master.
 * Formato: l8e1:<b64iv>:<b64tag>:<b64ct>
 */
function secretsDataKey() {
    static $k = null;
    if (is_string($k) && strlen($k) === 32) return $k;
    $raw = secretGet('L8_DATA_ENCRYPTION_KEY', '');
    if ($raw !== '') {
        if (preg_match('/^[a-f0-9]{64}$/i', $raw)) {
            $k = hex2bin($raw);
        } else {
            $k = hash('sha256', $raw, true);
        }
        return $k;
    }
    // Deriva de vault master + label (separación lógica)
    $k = hash_hmac('sha256', 'l8|data-at-rest|v1', secretsVaultMasterKey(), true);
    return $k;
}

function secretsEncrypt($plaintext, $key = null) {
    $plaintext = (string) $plaintext;
    if ($plaintext === '') return '';
    $encKey = $key ? (strlen($key) === 32 ? $key : hash('sha256', (string)$key, true)) : secretsDataKey();
    if (!function_exists('openssl_encrypt')) {
        return 'l8e0:' . base64_encode($plaintext); // fallback marcado (sin GCM)
    }
    $iv = random_bytes(12);
    $tag = '';
    $ct = openssl_encrypt($plaintext, 'aes-256-gcm', $encKey, OPENSSL_RAW_DATA, $iv, $tag);
    if ($ct === false) return '';
    return 'l8e1:' . base64_encode($iv) . ':' . base64_encode($tag) . ':' . base64_encode($ct);
}

function secretsDecrypt($blob, $key = null) {
    $blob = (string) $blob;
    if ($blob === '') return '';
    if (strpos($blob, 'l8e0:') === 0) {
        $d = base64_decode(substr($blob, 5), true);
        return $d === false ? '' : $d;
    }
    if (strpos($blob, 'l8e1:') !== 0) {
        // plaintext legacy (migración)
        return $blob;
    }
    $parts = explode(':', $blob, 4);
    if (count($parts) !== 4) return '';
    $iv = base64_decode($parts[1], true);
    $tag = base64_decode($parts[2], true);
    $ct = base64_decode($parts[3], true);
    if ($iv === false || $tag === false || $ct === false) return '';
    $encKey = $key ? (strlen($key) === 32 ? $key : hash('sha256', (string)$key, true)) : secretsDataKey();
    $pt = openssl_decrypt($ct, 'aes-256-gcm', $encKey, OPENSSL_RAW_DATA, $iv, $tag);
    return $pt === false ? '' : $pt;
}

/** Nombres de secretos de plataforma (para docs / probes sin valor). */
function secretsKnownNames() {
    return [
        'SUPABASE_URL',
        'SUPABASE_PUBLISHABLE_KEY',
        'SUPABASE_SECRET_KEY',
        'SUPABASE_ANON_KEY',
        'SUPABASE_SERVICE_ROLE_KEY',
        'L8_AUTH_PEPPER',
        'L8_DILITHIUM5_REGISTER_KEY',
        'DILITHIUM5_ADMIN_SIGNATURE',
        'L8_TOKENS_UNLOCK_SEED',
        'L8_VAULT_MASTER_KEY',
        'L8_DATA_ENCRYPTION_KEY',
        'L8_ADMIN_DIAG_SECRET',
        'L8_CORS_ORIGINS',
        'L8_TRUST_PROXY',
        'L8_REQUIRE_AUTH_MUTATIONS',
        'OPENCLAW_WEBHOOK_SECRET',
        'WS_SECRET',
    ];
}
