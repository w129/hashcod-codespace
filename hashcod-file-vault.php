<?php
declare(strict_types=1);

require_once __DIR__ . '/supabase.php';
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/security.php';
require_once __DIR__ . '/hashcod-workspace-access.php';

const HFV_MAX_UPLOAD_BYTES = 99614720; // 95 MiB, leaves multipart headroom under the 100M PHP/Supabase limit.

function hfvJson(int $status, array $payload): void {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function hfvAccount(): string {
    // The numeric access series represents one shared private workspace, so
    // every authorized device sees the same File Vault namespace.
    if (hashcodWorkspaceAccessAuthorized()) {
        $workspace = hashcodWorkspaceKey();
        if ($workspace !== '') return substr($workspace, 0, 96);
    }

    // Backward-compatible fallback for installations that still use accounts.
    $session = securityRequireAccountSession();
    $account = (string)($session['account_id'] ?? $session['user_id'] ?? '');
    $account = preg_replace('/[^a-zA-Z0-9_-]/', '', $account) ?? '';
    if ($account === '') {
        hfvJson(401, ['ok' => false, 'error' => 'No authenticated workspace was resolved.']);
    }
    return substr($account, 0, 96);
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
    if (function_exists('mb_substr')) {
        return mb_substr($name, 0, 220, 'UTF-8');
    }
    return substr($name, 0, 220);
}

function hfvObjectPath(string $account, string $id, string $name): string {
    $ext = strtolower((string)pathinfo($name, PATHINFO_EXTENSION));
    $ext = preg_replace('/[^a-z0-9]/', '', $ext) ?? '';
    $ext = substr($ext, 0, 16);
    return 'files/vault/' . $account . '/' . $id . ($ext !== '' ? '.' . $ext : '');
}

function hfvListRows(string $account): array {
    $query = 'select=id,filename,mime_type,size_bytes,hash,supabase_object,upload_date'
        . '&account_key=eq.' . rawurlencode($account)
        . '&is_deleted=eq.false'
        . '&order=upload_date.desc';
    $result = supabaseDbSelect('l8_files', $query);
    if (empty($result['ok']) || !is_array($result['body'] ?? null)) {
        return [];
    }
    $rows = [];
    foreach ($result['body'] as $row) {
        if (!is_array($row)) continue;
        $id = (string)($row['id'] ?? '');
        if (!preg_match('/^fv_[A-Za-z0-9_-]{8,64}$/', $id)) continue;
        $rows[] = [
            'id' => $id,
            'name' => (string)($row['filename'] ?? 'file'),
            'type' => (string)($row['mime_type'] ?? 'application/octet-stream'),
            'size' => (int)($row['size_bytes'] ?? 0),
            'uploadedAt' => (string)($row['upload_date'] ?? ''),
            'cloud' => true,
        ];
    }
    return $rows;
}

function hfvFindRow(string $account, string $id): ?array {
    $query = 'select=id,filename,mime_type,size_bytes,hash,supabase_object,upload_date'
        . '&id=eq.' . rawurlencode($id)
        . '&account_key=eq.' . rawurlencode($account)
        . '&is_deleted=eq.false'
        . '&limit=1';
    $result = supabaseDbSelect('l8_files', $query);
    if (empty($result['ok']) || !is_array($result['body'] ?? null) || empty($result['body'][0])) {
        return null;
    }
    return $result['body'][0];
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

$action = strtolower(trim((string)($_GET['action'] ?? 'list')));
$account = hfvAccount();
hfvRequireCloud();

if ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'list') {
    hfvJson(200, ['ok' => true, 'files' => hfvListRows($account)]);
}

if ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'download') {
    $id = hfvSafeId((string)($_GET['id'] ?? ''));
    $row = hfvFindRow($account, $id);
    if ($row === null) hfvJson(404, ['ok' => false, 'error' => 'File not found.']);

    $object = (string)($row['supabase_object'] ?? '');
    if ($object === '') hfvJson(404, ['ok' => false, 'error' => 'Stored object is missing.']);

    $download = supabaseStorageDownload($object);
    if (empty($download['ok']) || !is_string($download['data'] ?? null)) {
        hfvJson(502, ['ok' => false, 'error' => 'Could not restore the stored file.']);
    }

    $name = hfvOriginalName((string)($row['filename'] ?? 'file'));
    $fallback = preg_replace('/[^A-Za-z0-9._-]/', '_', $name) ?: 'file';
    $mime = preg_replace('/[\r\n]+/', '', (string)($row['mime_type'] ?? 'application/octet-stream'))
        ?: 'application/octet-stream';
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

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'upload') {
    $id = hfvSafeId((string)($_POST['id'] ?? ''));

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
        hfvJson(413, ['ok' => false, 'error' => 'Cloud files must be 95 MB or smaller. Larger files can remain in the device cache.']);
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
        ],
    ], $account);

    if (empty($record['ok']) || empty($record['db']['ok'])) {
        hfvJson(502, ['ok' => false, 'error' => 'The file bytes were stored, but metadata could not be indexed.']);
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
        ],
    ]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'delete') {
    $body = json_decode((string)file_get_contents('php://input'), true);
    if (!is_array($body)) $body = $_POST;
    $id = hfvSafeId((string)($body['id'] ?? ''));
    $row = hfvFindRow($account, $id);
    if ($row === null) hfvJson(404, ['ok' => false, 'error' => 'File not found.']);

    $object = (string)($row['supabase_object'] ?? '');
    if ($object !== '' && !hfvDeleteStorageObject($object)) {
        hfvJson(502, ['ok' => false, 'error' => 'Could not remove the cloud object.']);
    }

    $deleted = supabaseDbDelete(
        'l8_files',
        'id=eq.' . rawurlencode($id) . '&account_key=eq.' . rawurlencode($account)
    );
    if (empty($deleted['ok'])) {
        hfvJson(502, ['ok' => false, 'error' => 'Could not update the file index.']);
    }

    supabaseLogActivity('FILE_VAULT_DELETE', (string)($row['filename'] ?? $id), ['id' => $id], $account);
    hfvJson(200, ['ok' => true, 'id' => $id]);
}

hfvJson(405, ['ok' => false, 'error' => 'Unsupported file vault action.']);
