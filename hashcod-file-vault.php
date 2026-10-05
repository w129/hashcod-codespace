<?php
declare(strict_types=1);

require_once __DIR__ . '/supabase.php';
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/security.php';
require_once __DIR__ . '/hashcod-workspace-access.php';

const HFV_MAX_UPLOAD_BYTES = 99614720; // 95 MiB
const HFV_TOTP_HELPER = '/usr/local/bin/hashcod-file-vault-totp';
const HFV_TOTP_PERIOD = 30;
const HFV_TOTP_DIGITS = 6;

function hfvJson(int $status, array $payload): void {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/**
 * New File Vault uploads use one private server-derived namespace so the same
 * metadata is visible from every Hashcod Codespace device. Existing account /
 * legacy-workspace files remain readable on devices that can resolve that
 * older identity.
 */
function hfvAccount(): string {
    $digest = hash_hmac('sha256', 'hashcod-file-vault-global-v3', mldsaAccessSecret());
    return 'hfv_' . substr($digest, 0, 48);
}

function hfvLegacyAccount(): string {
    if (hashcodWorkspaceAccessAuthorized()) {
        $workspace = hashcodWorkspaceKey();
        if ($workspace !== '') return substr($workspace, 0, 96);
    }
    return '';
}

function hfvReadAccounts(): array {
    $rows = [hfvAccount()];
    $legacy = hfvLegacyAccount();
    if ($legacy !== '' && !in_array($legacy, $rows, true)) $rows[] = $legacy;
    return $rows;
}

function hfvRequireCloud(): void {
    $cfg = function_exists('supabaseConfig') ? supabaseConfig() : [];
    if (empty($cfg['configured'])) {
        hfvJson(503, ['ok' => false, 'error' => 'Cloud storage is not configured.']);
    }
}

function hfvSafeId(string $id): string {
    $id = trim($id);
    if (!preg_match('/^fv_[A-Za-z0-9_-]{8,64}$/', $id)) {
        hfvJson(400, ['ok' => false, 'error' => 'Invalid file id.']);
    }
    return $id;
}

function hfvDetectMime(string $tmp, string $fallback): string {
    $mime = '';
    if (class_exists('finfo')) {
        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $detected = @$finfo->file($tmp);
        if (is_string($detected)) $mime = trim($detected);
    }
    if ($mime === '') $mime = trim($fallback);
    if ($mime === '' || strlen($mime) > 160) $mime = 'application/octet-stream';
    return preg_replace('/[\r\n]+/', '', $mime) ?: 'application/octet-stream';
}

function hfvOriginalName(string $name): string {
    $name = str_replace(["\0", "\r", "\n"], '', $name);
    $name = trim(basename(str_replace('\\', '/', $name)));
    if ($name === '') $name = 'file';
    if (function_exists('mb_substr')) return mb_substr($name, 0, 220, 'UTF-8');
    return substr($name, 0, 220);
}

function hfvObjectPath(string $account, string $id, string $name): string {
    $ext = strtolower((string)pathinfo($name, PATHINFO_EXTENSION));
    $ext = preg_replace('/[^a-z0-9]/', '', $ext) ?? '';
    $ext = substr($ext, 0, 16);
    return 'files/vault/' . $account . '/' . $id . ($ext !== '' ? '.' . $ext : '');
}

function hfvMetaArray($meta): array {
    if (is_array($meta)) return $meta;
    if (is_string($meta) && trim($meta) !== '') {
        $decoded = json_decode($meta, true);
        if (is_array($decoded)) return $decoded;
    }
    return [];
}

function hfvB64uEncode(string $raw): string {
    return rtrim(strtr(base64_encode($raw), '+/', '-_'), '=');
}

function hfvB64uDecode(string $raw): string {
    $raw = strtr(trim($raw), '-_', '+/');
    $pad = strlen($raw) % 4;
    if ($pad) $raw .= str_repeat('=', 4 - $pad);
    $decoded = base64_decode($raw, true);
    return is_string($decoded) ? $decoded : '';
}

function hfvTotpCryptoKey(): string {
    return hash('sha256', 'hashcod-file-vault-totp-v1|' . mldsaAccessSecret(), true);
}

function hfvTotpSealSecret(string $secret): string {
    if (!function_exists('openssl_encrypt')) return '';
    $iv = random_bytes(12);
    $tag = '';
    $cipher = openssl_encrypt(
        $secret,
        'aes-256-gcm',
        hfvTotpCryptoKey(),
        OPENSSL_RAW_DATA,
        $iv,
        $tag,
        'hashcod-file-vault-totp-v1',
        16
    );
    if (!is_string($cipher) || strlen($tag) !== 16) return '';
    return hfvB64uEncode($iv . $tag . $cipher);
}

function hfvTotpOpenSecret(string $sealed): string {
    if (!function_exists('openssl_decrypt')) return '';
    $raw = hfvB64uDecode($sealed);
    if (strlen($raw) < 29) return '';
    $iv = substr($raw, 0, 12);
    $tag = substr($raw, 12, 16);
    $cipher = substr($raw, 28);
    $plain = openssl_decrypt(
        $cipher,
        'aes-256-gcm',
        hfvTotpCryptoKey(),
        OPENSSL_RAW_DATA,
        $iv,
        $tag,
        'hashcod-file-vault-totp-v1'
    );
    return is_string($plain) ? $plain : '';
}

function hfvTotpNormalizeSecret(string $secret): string {
    $secret = strtoupper((string)preg_replace('/[\s-]+/', '', trim($secret)));
    $secret = rtrim($secret, '=');
    if (!preg_match('/^[A-Z2-7]{16,128}$/D', $secret)) return '';
    return $secret;
}

function hfvTotpValidateCode(string $secret, string $code): bool {
    if ($secret === '' || !preg_match('/^\d{' . HFV_TOTP_DIGITS . '}$/D', $code)) return false;
    if (!is_executable(HFV_TOTP_HELPER)) return false;

    $proc = @proc_open(
        [HFV_TOTP_HELPER, 'validate'],
        [0 => ['pipe', 'r'], 1 => ['pipe', 'w'], 2 => ['pipe', 'w']],
        $pipes,
        __DIR__
    );
    if (!is_resource($proc)) return false;

    $input = json_encode(['secret' => $secret, 'code' => $code], JSON_UNESCAPED_SLASHES);
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

function hfvTotpProtected(array $row): bool {
    $meta = hfvMetaArray($row['meta'] ?? []);
    return !empty($meta['totp_protected']) && !empty($meta['totp_secret_cipher']);
}

function hfvTotpSecretFromRow(array $row): string {
    if (!hfvTotpProtected($row)) return '';
    $meta = hfvMetaArray($row['meta'] ?? []);
    return hfvTotpOpenSecret((string)($meta['totp_secret_cipher'] ?? ''));
}

function hfvTotpRateLimit(string $id): void {
    if (!function_exists('securityRateAllowSliding')) return;
    $rate = securityRateAllowSliding('hashcod_file_vault_totp_' . substr(hash('sha256', $id), 0, 24), 8, 60);
    if (empty($rate['allowed'])) {
        hfvJson(429, ['ok' => false, 'error' => 'Too many verification attempts. Try again shortly.']);
    }
}

function hfvRequireTotp(array $row, string $code): void {
    if (!hfvTotpProtected($row)) return;
    hfvTotpRateLimit((string)($row['id'] ?? 'file'));
    $secret = hfvTotpSecretFromRow($row);
    if ($secret === '' || !hfvTotpValidateCode($secret, trim($code))) {
        hfvJson(401, ['ok' => false, 'error' => 'The TOTP code is invalid or expired.']);
    }
}

function hfvListRowsForAccount(string $account): array {
    $query = 'select=id,account_key,filename,mime_type,size_bytes,hash,supabase_object,upload_date,meta'
        . '&account_key=eq.' . rawurlencode($account)
        . '&is_deleted=eq.false'
        . '&order=upload_date.desc';
    $result = supabaseDbSelect('l8_files', $query);
    if (empty($result['ok']) || !is_array($result['body'] ?? null)) return [];

    $rows = [];
    foreach ($result['body'] as $row) {
        if (!is_array($row)) continue;
        $id = (string)($row['id'] ?? '');
        if (!preg_match('/^fv_[A-Za-z0-9_-]{8,64}$/', $id)) continue;
        $meta = hfvMetaArray($row['meta'] ?? []);
        if (($meta['vault'] ?? 'hashcod-file-vault') !== 'hashcod-file-vault') continue;
        $rows[] = $row;
    }
    return $rows;
}

function hfvListRows(array $accounts): array {
    $map = [];
    foreach ($accounts as $account) {
        foreach (hfvListRowsForAccount($account) as $row) {
            $id = (string)($row['id'] ?? '');
            if ($id === '' || isset($map[$id])) continue;
            $map[$id] = [
                'id' => $id,
                'name' => (string)($row['filename'] ?? 'file'),
                'type' => (string)($row['mime_type'] ?? 'application/octet-stream'),
                'size' => (int)($row['size_bytes'] ?? 0),
                'uploadedAt' => (string)($row['upload_date'] ?? ''),
                'cloud' => true,
                'totpProtected' => hfvTotpProtected($row),
            ];
        }
    }
    $rows = array_values($map);
    usort($rows, static fn(array $a, array $b): int => strcmp((string)$b['uploadedAt'], (string)$a['uploadedAt']));
    return $rows;
}

function hfvFindRowForAccount(string $account, string $id): ?array {
    $query = 'select=id,account_key,filename,mime_type,size_bytes,hash,supabase_object,upload_date,meta'
        . '&id=eq.' . rawurlencode($id)
        . '&account_key=eq.' . rawurlencode($account)
        . '&is_deleted=eq.false'
        . '&limit=1';
    $result = supabaseDbSelect('l8_files', $query);
    if (empty($result['ok']) || !is_array($result['body'] ?? null) || empty($result['body'][0])) return null;
    return is_array($result['body'][0]) ? $result['body'][0] : null;
}

function hfvFindRow(array $accounts, string $id): ?array {
    foreach ($accounts as $account) {
        $row = hfvFindRowForAccount($account, $id);
        if ($row !== null) return $row;
    }
    return null;
}

function hfvDeleteStorageObject(string $object): bool {
    $object = ltrim(str_replace('\\', '/', $object), '/');
    if ($object === '') return true;
    $bucket = supabaseStorageBucket();
    $result = supabaseRequest('storage/v1/object/' . rawurlencode($bucket), [
        'method' => 'DELETE',
        'use_secret' => true,
        'content_type' => 'application/json',
        'body' => ['prefixes' => [$object]],
        'timeout' => 120,
    ]);
    return !empty($result['ok']) || (int)($result['status'] ?? 0) === 404;
}

function hfvReadJsonBody(): array {
    $raw = (string)file_get_contents('php://input');
    if ($raw === '') return [];
    $body = json_decode($raw, true);
    return is_array($body) ? $body : [];
}

function hfvStreamRow(array $row): void {
    $object = (string)($row['supabase_object'] ?? '');
    if ($object === '') hfvJson(404, ['ok' => false, 'error' => 'Stored object is missing.']);

    $download = supabaseStorageDownload($object);
    if (empty($download['ok']) || !is_string($download['data'] ?? null)) {
        hfvJson(502, ['ok' => false, 'error' => 'Could not restore the stored file.']);
    }

    $name = hfvOriginalName((string)($row['filename'] ?? 'file'));
    $fallback = preg_replace('/[^A-Za-z0-9._-]/', '_', $name) ?: 'file';
    $mime = preg_replace('/[\r\n]+/', '', (string)($row['mime_type'] ?? 'application/octet-stream')) ?: 'application/octet-stream';
    $data = $download['data'];

    http_response_code(200);
    header('Content-Type: ' . $mime);
    header('Content-Length: ' . strlen($data));
    header('Content-Disposition: attachment; filename="' . addcslashes($fallback, "\\\"") . '"; filename*=UTF-8\'\'' . rawurlencode($name));
    header('Cache-Control: private, no-store');
    header('X-Content-Type-Options: nosniff');
    echo $data;
    exit;
}

$action = strtolower(trim((string)($_GET['action'] ?? 'list')));
$account = hfvAccount();
$readAccounts = hfvReadAccounts();
hfvRequireCloud();

if ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'list') {
    hfvJson(200, [
        'ok' => true,
        'files' => hfvListRows($readAccounts),
        'scope' => 'cross-device',
        'totp' => ['period' => HFV_TOTP_PERIOD, 'digits' => HFV_TOTP_DIGITS],
    ]);
}

// Legacy unprotected files keep their old GET download behavior. TOTP files
// never accept a code in a URL/query string.
if ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'download') {
    $id = hfvSafeId((string)($_GET['id'] ?? ''));
    $row = hfvFindRow($readAccounts, $id);
    if ($row === null) hfvJson(404, ['ok' => false, 'error' => 'File not found.']);
    if (hfvTotpProtected($row)) {
        hfvJson(405, ['ok' => false, 'error' => 'TOTP-protected files require verified POST download.']);
    }
    hfvStreamRow($row);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'download') {
    $body = hfvReadJsonBody();
    $id = hfvSafeId((string)($body['id'] ?? ''));
    $row = hfvFindRow($readAccounts, $id);
    if ($row === null) hfvJson(404, ['ok' => false, 'error' => 'File not found.']);
    hfvRequireTotp($row, (string)($body['code'] ?? ''));
    hfvStreamRow($row);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'upload') {
    $id = hfvSafeId((string)($_POST['id'] ?? ''));
    $totpSecret = hfvTotpNormalizeSecret((string)($_POST['totp_secret'] ?? ''));
    $totpCode = trim((string)($_POST['totp_code'] ?? ''));
    if ($totpSecret === '') {
        hfvJson(400, ['ok' => false, 'error' => 'A valid TOTP setup key is required.']);
    }
    if (!hfvTotpValidateCode($totpSecret, $totpCode)) {
        hfvJson(400, ['ok' => false, 'error' => 'TOTP setup could not be verified.']);
    }
    $sealedSecret = hfvTotpSealSecret($totpSecret);
    if ($sealedSecret === '') {
        hfvJson(500, ['ok' => false, 'error' => 'TOTP protection could not be initialized.']);
    }

    if (!isset($_FILES['file']) || !is_array($_FILES['file'])) {
        hfvJson(400, ['ok' => false, 'error' => 'No file was received.']);
    }
    $upload = $_FILES['file'];
    $error = (int)($upload['error'] ?? UPLOAD_ERR_NO_FILE);
    if ($error !== UPLOAD_ERR_OK) {
        hfvJson(400, ['ok' => false, 'error' => 'The file upload was incomplete.']);
    }

    $tmp = (string)($upload['tmp_name'] ?? '');
    $size = (int)($upload['size'] ?? 0);
    if ($tmp === '' || !is_uploaded_file($tmp)) {
        hfvJson(400, ['ok' => false, 'error' => 'Invalid upload stream.']);
    }
    if ($size < 0 || $size > HFV_MAX_UPLOAD_BYTES) {
        hfvJson(413, ['ok' => false, 'error' => 'Cloud files must be 95 MB or smaller.']);
    }

    $name = hfvOriginalName((string)($upload['name'] ?? 'file'));
    $mime = hfvDetectMime($tmp, (string)($upload['type'] ?? 'application/octet-stream'));
    $object = hfvObjectPath($account, $id, $name);
    $sha256 = hash_file('sha256', $tmp) ?: '';

    $stored = supabaseStorageUpload($object, $tmp, $mime, true);
    if (empty($stored['ok'])) {
        hfvJson(502, ['ok' => false, 'error' => (string)($stored['error'] ?? 'Cloud storage rejected the file.')]);
    }

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
            'totp_protected' => true,
            'totp_secret_cipher' => $sealedSecret,
            'totp_backend' => 'github.com/pquerna/otp/totp',
            'totp_algorithm' => 'SHA1',
            'totp_digits' => HFV_TOTP_DIGITS,
            'totp_period' => HFV_TOTP_PERIOD,
        ],
    ], $account);

    if (empty($record['ok']) || empty($record['db']['ok'])) {
        hfvDeleteStorageObject($object);
        hfvJson(502, ['ok' => false, 'error' => 'The file could not be indexed in the cloud vault.']);
    }

    hfvJson(201, [
        'ok' => true,
        'file' => [
            'id' => $id,
            'name' => $name,
            'type' => $mime,
            'size' => $size,
            'uploadedAt' => $uploadedAt,
            'cloud' => true,
            'totpProtected' => true,
        ],
    ]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'delete') {
    $body = hfvReadJsonBody();
    if (!$body) $body = $_POST;
    $id = hfvSafeId((string)($body['id'] ?? ''));
    $row = hfvFindRow($readAccounts, $id);
    if ($row === null) hfvJson(404, ['ok' => false, 'error' => 'File not found.']);
    hfvRequireTotp($row, (string)($body['code'] ?? ''));

    $object = (string)($row['supabase_object'] ?? '');
    if ($object !== '' && !hfvDeleteStorageObject($object)) {
        hfvJson(502, ['ok' => false, 'error' => 'Could not remove the cloud object.']);
    }

    $rowAccount = (string)($row['account_key'] ?? $account);
    $deleted = supabaseDbDelete(
        'l8_files',
        'id=eq.' . rawurlencode($id) . '&account_key=eq.' . rawurlencode($rowAccount)
    );
    if (empty($deleted['ok'])) {
        hfvJson(502, ['ok' => false, 'error' => 'Could not update the file index.']);
    }

    supabaseLogActivity('FILE_VAULT_DELETE', (string)($row['filename'] ?? $id), ['id' => $id, 'totp' => hfvTotpProtected($row)], $rowAccount);
    hfvJson(200, ['ok' => true, 'id' => $id]);
}

hfvJson(405, ['ok' => false, 'error' => 'Unsupported file vault action.']);
