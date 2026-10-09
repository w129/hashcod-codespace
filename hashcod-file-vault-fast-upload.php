<?php
declare(strict_types=1);
require_once __DIR__ . '/platform-period-lib.php';
platformPeriodGuard(true);

/**
 * File Vault direct-transfer accelerator.
 *
 * Architecture:
 *   Browser -> Supabase Storage signed upload URL -> this endpoint finalizes metadata.
 *
 * This intentionally keeps Postgres/Supabase as the database and object store.
 * The transfer model follows S3/AWS operational patterns (direct object transfer,
 * idempotent retry, exponential backoff on the client) while using Supabase's
 * S3-compatible Storage service.
 *
 * Operational inspiration requested by the project:
 *   https://github.com/swoodford/aws (Apache-2.0)
 */

require_once __DIR__ . '/supabase.php';
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/security.php';
require_once __DIR__ . '/hashcod-workspace-access.php';
require_once __DIR__ . '/hashcod-file-vault-access-code.php';
require_once __DIR__ . '/hashcod-file-vault-value.php';

// The router admits only this deliberate JSON controller before the generic
// PHP-path deny rule. Keep IP/threat checks and rate limits on the API itself.
securityBootstrap('api');

const HFVU_MAX_UPLOAD_BYTES = 99614720; // 95 MiB
const HFVU_TOTP_HELPER = PHP_OS_FAMILY === 'Windows'
    ? __DIR__ . '/tools/file-vault-totp/hashcod-file-vault-totp.exe'
    : '/usr/local/bin/hashcod-file-vault-totp';
const HFVU_TICKET_TTL = 1800;

function hfvuJson(int $status, array $payload): void {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function hfvuB64uEncode(string $raw): string {
    return rtrim(strtr(base64_encode($raw), '+/', '-_'), '=');
}

function hfvuB64uDecode(string $raw): string {
    $raw = strtr(trim($raw), '-_', '+/');
    $pad = strlen($raw) % 4;
    if ($pad) $raw .= str_repeat('=', 4 - $pad);
    $decoded = base64_decode($raw, true);
    return is_string($decoded) ? $decoded : '';
}

function hfvuSecret(): string {
    if (function_exists('mldsaAccessSecret')) return mldsaAccessSecret();
    if (function_exists('authPepper')) return authPepper();
    return hash('sha256', __FILE__ . PHP_VERSION);
}

function hfvuAccount(): string {
    $digest = hash_hmac('sha256', 'hashcod-file-vault-global-v3', hfvuSecret());
    return 'hfv_' . substr($digest, 0, 48);
}

function hfvuSafeId(string $id): string {
    $id = trim($id);
    if (!preg_match('/^fv_[A-Za-z0-9_-]{8,64}$/D', $id)) {
        hfvuJson(400, ['ok' => false, 'error' => 'Invalid file id.']);
    }
    return $id;
}

function hfvuOriginalName(string $name): string {
    $name = str_replace(["\0", "\r", "\n"], '', $name);
    $name = trim(basename(str_replace('\\', '/', $name)));
    if ($name === '') $name = 'file';
    if (function_exists('mb_substr')) return mb_substr($name, 0, 220, 'UTF-8');
    return substr($name, 0, 220);
}

function hfvuMime(string $mime): string {
    $mime = trim((string)preg_replace('/[\r\n]+/', '', $mime));
    if ($mime === '' || strlen($mime) > 160 || !preg_match('~^[A-Za-z0-9][A-Za-z0-9!#$&^_.+\-]*/[A-Za-z0-9][A-Za-z0-9!#$&^_.+\-]*$~D', $mime)) {
        return 'application/octet-stream';
    }
    return $mime;
}

function hfvuObjectPath(string $account, string $id, string $name): string {
    $ext = strtolower((string)pathinfo($name, PATHINFO_EXTENSION));
    $ext = preg_replace('/[^a-z0-9]/', '', $ext) ?? '';
    $ext = substr($ext, 0, 16);
    return 'files/vault/' . $account . '/' . $id . ($ext !== '' ? '.' . $ext : '');
}

function hfvuEncodeObjectPath(string $path): string {
    $parts = array_values(array_filter(explode('/', ltrim(str_replace('\\', '/', $path), '/')), static fn($v) => $v !== ''));
    return implode('/', array_map('rawurlencode', $parts));
}

function hfvuNormalizeTotpSecret(string $secret): string {
    $secret = strtoupper((string)preg_replace('/[\s-]+/', '', trim($secret)));
    $secret = rtrim($secret, '=');
    if (!preg_match('/^[A-Z2-7]{16,128}$/D', $secret)) return '';
    return $secret;
}

function hfvuValidateTotp(string $secret, string $code): bool {
    if ($secret === '' || !preg_match('/^\d{6}$/D', trim($code))) return false;
    if (!is_executable(HFVU_TOTP_HELPER)) return false;

    $proc = @proc_open(
        [HFVU_TOTP_HELPER, 'validate'],
        [0 => ['pipe', 'r'], 1 => ['pipe', 'w'], 2 => ['pipe', 'w']],
        $pipes,
        __DIR__
    );
    if (!is_resource($proc)) return false;

    $input = json_encode(['secret' => $secret, 'code' => trim($code)], JSON_UNESCAPED_SLASHES);
    fwrite($pipes[0], is_string($input) ? $input : '{}');
    fclose($pipes[0]);
    $stdout = (string)stream_get_contents($pipes[1]);
    $stderr = (string)stream_get_contents($pipes[2]);
    fclose($pipes[1]);
    fclose($pipes[2]);
    $status = proc_close($proc);
    if ($status !== 0 || $stderr !== '') return false;

    $payload = json_decode(trim($stdout), true);
    return is_array($payload) && !empty($payload['ok']) && !empty($payload['valid']);
}

function hfvuRequireSetupTotp(string $secret, string $code): void {
    if (!is_executable(HFVU_TOTP_HELPER) || !function_exists('proc_open')) {
        hfvuJson(503, ['ok' => false, 'code' => 'totp_unavailable', 'error' => 'TOTP verification is unavailable. Try again shortly.']);
    }
    if ($secret === '' || !hfvuValidateTotp($secret, $code)) {
        hfvuJson(401, ['ok' => false, 'code' => 'invalid_totp', 'error' => 'Use the current 6-digit code for this exact setup key. Check automatic time in your authenticator.']);
    }
}

function hfvuCryptoKey(): string {
    return hash('sha256', 'hashcod-file-vault-totp-v1|' . hfvuSecret(), true);
}

function hfvuSealTotp(string $secret): string {
    if (!function_exists('openssl_encrypt')) return '';
    $iv = random_bytes(12);
    $tag = '';
    $cipher = openssl_encrypt(
        $secret,
        'aes-256-gcm',
        hfvuCryptoKey(),
        OPENSSL_RAW_DATA,
        $iv,
        $tag,
        'hashcod-file-vault-totp-v1',
        16
    );
    if (!is_string($cipher) || strlen($tag) !== 16) return '';
    return hfvuB64uEncode($iv . $tag . $cipher);
}

function hfvuTicketKey(): string {
    return hash('sha256', 'hashcod-file-vault-direct-upload-ticket-v1|' . hfvuSecret(), true);
}

function hfvuMakeTicket(array $payload): string {
    $json = json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    if (!is_string($json)) return '';
    $encoded = hfvuB64uEncode($json);
    $mac = hash_hmac('sha256', $encoded, hfvuTicketKey(), true);
    return $encoded . '.' . hfvuB64uEncode($mac);
}

function hfvuOpenTicket(string $ticket): ?array {
    $parts = explode('.', trim($ticket), 2);
    if (count($parts) !== 2) return null;
    [$encoded, $sig] = $parts;
    $mac = hfvuB64uDecode($sig);
    $expected = hash_hmac('sha256', $encoded, hfvuTicketKey(), true);
    if ($mac === '' || !hash_equals($expected, $mac)) return null;
    $json = hfvuB64uDecode($encoded);
    $payload = json_decode($json, true);
    if (!is_array($payload)) return null;
    if (($payload['kind'] ?? '') !== 'hfv-direct-upload-v1') return null;
    if ((int)($payload['exp'] ?? 0) < time()) return null;
    return $payload;
}

function hfvuReadJson(): array {
    $raw = (string)file_get_contents('php://input');
    if ($raw === '' || strlen($raw) > 65536) return [];
    $body = json_decode($raw, true);
    return is_array($body) ? $body : [];
}

function hfvuSameOrigin(): bool {
    if (strcasecmp((string)($_SERVER['HTTP_X_REQUESTED_WITH'] ?? ''), 'XMLHttpRequest') !== 0) return false;
    $site = strtolower(trim((string)($_SERVER['HTTP_SEC_FETCH_SITE'] ?? '')));
    if ($site === 'cross-site') return false;
    $origin = trim((string)($_SERVER['HTTP_ORIGIN'] ?? ''));
    if ($origin === '') return true;
    $parts = parse_url($origin);
    if (!is_array($parts) || !in_array(strtolower((string)($parts['scheme'] ?? '')), ['http', 'https'], true)) return false;
    $host = strtolower((string)($parts['host'] ?? ''));
    $port = isset($parts['port']) ? ':' . (int)$parts['port'] : '';
    $scheme = securityIsHttps() ? 'https' : 'http';
    return strtolower((string)$parts['scheme']) === $scheme
        && $host !== '' && hash_equals(strtolower(trim((string)($_SERVER['HTTP_HOST'] ?? ''))), $host . $port);
}

function hfvuDirectStorageOrigin(string $supabaseUrl): string {
    $parts = parse_url($supabaseUrl);
    if (!is_array($parts) || empty($parts['host'])) return rtrim($supabaseUrl, '/');
    $scheme = strtolower((string)($parts['scheme'] ?? 'https')) === 'http' ? 'http' : 'https';
    $host = (string)$parts['host'];
    if (preg_match('/^([a-z0-9-]+)\.supabase\.co$/i', $host, $m)) {
        return $scheme . '://' . $m[1] . '.storage.supabase.co';
    }
    return rtrim($supabaseUrl, '/');
}

function hfvuCreateSignedUploadUrl(string $object): array {
    $cfg = supabaseConfig();
    if (empty($cfg['configured']) || empty($cfg['secret_key'])) {
        return ['ok' => false, 'error' => 'Cloud direct upload is unavailable.'];
    }
    $bucket = function_exists('supabaseStorageBucket') ? supabaseStorageBucket() : (string)($cfg['bucket'] ?? 'l8-storage');
    $route = 'storage/v1/object/upload/sign/' . rawurlencode($bucket) . '/' . hfvuEncodeObjectPath($object);
    $res = supabaseRequest($route, [
        'method' => 'POST',
        'use_secret' => true,
        'headers' => ['x-upsert: true'],
        'body' => (object)[],
        'timeout' => 10,
    ]);
    if (empty($res['ok']) || !is_array($res['body'] ?? null)) {
        return ['ok' => false, 'error' => (string)($res['error'] ?? 'Could not prepare direct upload.')];
    }

    $url = (string)($res['body']['url'] ?? $res['body']['signedURL'] ?? '');
    if ($url === '') return ['ok' => false, 'error' => 'Storage did not return an upload URL.'];

    if (!preg_match('#^https?://#i', $url)) {
        $url = rtrim((string)$cfg['url'], '/') . '/storage/v1' . (str_starts_with($url, '/') ? $url : '/' . $url);
    }

    $baseOrigin = rtrim((string)$cfg['url'], '/');
    $directOrigin = hfvuDirectStorageOrigin($baseOrigin);
    if ($directOrigin !== $baseOrigin && str_starts_with($url, $baseOrigin . '/')) {
        $url = $directOrigin . substr($url, strlen($baseOrigin));
    }

    return ['ok' => true, 'url' => $url, 'bucket' => $bucket];
}

function hfvuFinalizeRecord(array $ticket, string $sha256 = ''): array {
    $account = hfvuAccount();
    if (!hash_equals((string)($ticket['account'] ?? ''), $account)) {
        return ['ok' => false, 'error' => 'Upload ticket account mismatch.'];
    }
    $id = hfvuSafeId((string)($ticket['id'] ?? ''));
    $name = hfvuOriginalName((string)($ticket['name'] ?? 'file'));
    $mime = hfvuMime((string)($ticket['mime'] ?? 'application/octet-stream'));
    $size = max(0, (int)($ticket['size'] ?? 0));
    $object = (string)($ticket['object'] ?? '');
    $sealed = (string)($ticket['totp'] ?? '');
    $codeHash = (string)($ticket['access_code_hash'] ?? '');
    $fixedCode = ($ticket['protection'] ?? '') === 'access-code';
    if ($object === '' || ($fixedCode ? $codeHash === '' : $sealed === '') || $size > HFVU_MAX_UPLOAD_BYTES) {
        return ['ok' => false, 'error' => 'Upload ticket is incomplete.'];
    }
    if (!preg_match('/^[a-f0-9]{64}$/D', strtolower($sha256))) $sha256 = '';

    $uploadedAt = gmdate('c');
    $record = supabaseSyncFileRecord([
        'id' => $id,
        'filename' => $name,
        'mime_type' => $mime,
        'size_bytes' => $size,
        'hash' => $sha256,
        'storage_path' => $object,
        'supabase_object' => $object,
        'upload_date' => $uploadedAt,
        'meta' => [
            'vault' => 'hashcod-file-vault',
            'original_name' => $name,
            'sha256' => $sha256,
            ...($fixedCode ? [
                'access_protection' => 'access-code',
                'access_code_hash' => $codeHash,
            ] : [
                // Accept already-signed TOTP tickets until their original expiry.
                'totp_protected' => true,
                'totp_secret_cipher' => $sealed,
                'totp_backend' => 'github.com/pquerna/otp/totp',
                'totp_algorithm' => 'SHA1',
                'totp_digits' => 6,
                'totp_period' => 30,
            ]),
            'upload_transport' => 'direct-signed-storage',
            'upload_strategy' => 'aws-style-direct-object-transfer',
            'upload_version' => 1,
            'price_usd_cents' => hfvUsdCents($ticket['priceUsdCents'] ?? null),
        ],
    ], $account);

    if (empty($record['ok']) || empty($record['db']['ok'])) {
        return ['ok' => false, 'error' => 'The file could not be indexed in the cloud vault.'];
    }

    if (function_exists('supabaseLogActivity')) {
        @supabaseLogActivity('FILE_VAULT_UPLOAD_FAST', $name, [
            'id' => $id,
            'size' => $size,
            'transport' => 'direct-signed-storage',
            'totp' => true,
        ], $account);
    }

    return [
        'ok' => true,
        'file' => [
            'id' => $id,
            'name' => $name,
            'type' => $mime,
            'size' => $size,
            'uploadedAt' => $uploadedAt,
            'cloud' => true,
            'totpProtected' => true,
            'accessProtection' => $fixedCode ? 'access-code' : 'totp',
            'transport' => 'direct',
            'priceUsdCents' => hfvUsdCents($ticket['priceUsdCents'] ?? null),
        ],
    ];
}

if (function_exists('securityRateAllowSliding')) {
    $rate = securityRateAllowSliding('hashcod_file_vault_fast_upload', 60, 60);
    if (empty($rate['allowed'])) {
        hfvuJson(429, ['ok' => false, 'error' => 'Too many upload requests. Try again shortly.']);
    }
}

if (strtoupper((string)($_SERVER['REQUEST_METHOD'] ?? 'GET')) !== 'POST') {
    header('Allow: POST');
    hfvuJson(405, ['ok' => false, 'error' => 'Method not allowed.']);
}

if (!hfvuSameOrigin()) {
    hfvuJson(403, ['ok' => false, 'error' => 'Upload requests must come from this platform.']);
}

$body = hfvuReadJson();
$action = strtolower(trim((string)($_GET['action'] ?? $body['action'] ?? '')));

// Verify inside the setup dialog before releasing the file to its upload path.
// This endpoint never creates a signed URL, writes metadata or transfers bytes.
if ($action === 'verify-totp') {
    if (function_exists('securityRateAllowSliding')) {
        $rate = securityRateAllowSliding('hashcod_file_vault_setup_totp', 8, 60);
        if (empty($rate['allowed'])) hfvuJson(429, ['ok' => false, 'error' => 'Too many verification attempts. Try again shortly.']);
    }
    hfvuRequireSetupTotp(hfvuNormalizeTotpSecret((string)($body['totp_secret'] ?? '')), trim((string)($body['totp_code'] ?? '')));
    hfvuJson(200, ['ok' => true]);
}

if ($action === 'prepare') {
    $id = hfvuSafeId((string)($body['id'] ?? ''));
    $name = hfvuOriginalName((string)($body['name'] ?? 'file'));
    $mime = hfvuMime((string)($body['type'] ?? 'application/octet-stream'));
    try { $priceUsdCents = hfvUsdCents($body['priceUsdCents'] ?? null); }
    catch (InvalidArgumentException $error) { hfvuJson(400, ['ok' => false, 'error' => $error->getMessage()]); }
    $size = (int)($body['size'] ?? -1);
    if ($size < 0 || $size > HFVU_MAX_UPLOAD_BYTES) {
        hfvuJson(413, ['ok' => false, 'error' => 'Cloud files must be 95 MB or smaller.']);
    }

    $accessCode = (string)($body['access_code'] ?? '');
    if (!hfvAccessCodeInputValid($accessCode)) hfvuJson(400, ['ok' => false, 'error' => 'Choose a file code with 1 to 128 characters.']);
    $codeHash = hfvAccessCodeHash($accessCode, $id, hfvuSecret());

    $account = hfvuAccount();
    $object = hfvuObjectPath($account, $id, $name);
    $signed = hfvuCreateSignedUploadUrl($object);
    if (empty($signed['ok'])) {
        hfvuJson(503, [
            'ok' => false,
            'fallback' => true,
            'code' => 'cloud_upload_unavailable',
            'error' => 'Cloud storage is unavailable. The file can be saved with code protection on this device.',
        ]);
    }

    $ticket = hfvuMakeTicket([
        'kind' => 'hfv-direct-upload-v1',
        'id' => $id,
        'account' => $account,
        'name' => $name,
        'mime' => $mime,
        'size' => $size,
        'priceUsdCents' => $priceUsdCents,
        'object' => $object,
        'protection' => 'access-code',
        'access_code_hash' => $codeHash,
        'iat' => time(),
        'exp' => time() + HFVU_TICKET_TTL,
    ]);

    if ($ticket === '') hfvuJson(500, ['ok' => false, 'error' => 'Could not prepare upload ticket.']);

    hfvuJson(200, [
        'ok' => true,
        'mode' => 'direct-signed-storage',
        'strategy' => 'aws-style-direct-object-transfer',
        'uploadUrl' => (string)$signed['url'],
        'ticket' => $ticket,
        'retry' => ['maxAttempts' => 3, 'baseDelayMs' => 400],
    ]);
}

if ($action === 'complete') {
    $ticket = hfvuOpenTicket((string)($body['ticket'] ?? ''));
    if ($ticket === null) hfvuJson(401, ['ok' => false, 'error' => 'Upload ticket is invalid or expired.']);

    $result = hfvuFinalizeRecord($ticket, strtolower(trim((string)($body['sha256'] ?? ''))));
    if (empty($result['ok'])) {
        hfvuJson(502, ['ok' => false, 'error' => (string)($result['error'] ?? 'Could not finalize cloud upload.')]);
    }
    hfvuJson(201, $result);
}

hfvuJson(400, ['ok' => false, 'error' => 'Unsupported fast-upload action.']);
