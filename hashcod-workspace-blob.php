<?php
declare(strict_types=1);
require_once __DIR__ . '/platform-period-lib.php';
platformPeriodGuard();

require_once __DIR__ . '/supabase.php';
require_once __DIR__ . '/security.php';
require_once __DIR__ . '/hashcod-workspace-access.php';

const HCWB_MAX_BYTES = 15728640; // 15 MiB, matches the existing image-vault ceiling.

function hcwbJson(array $payload, int $status = 200): void {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}
function hcwbWorkspace(): string {
    if (!hashcodWorkspaceAccessAuthorized()) hcwbJson(['ok' => false, 'error' => 'Workspace authorization required.'], 401);
    $key = hashcodWorkspaceKey();
    if ($key === '') hcwbJson(['ok' => false, 'error' => 'Workspace unavailable.'], 401);
    return $key;
}
function hcwbKey(string $key): string {
    $key = strtolower(trim($key));
    $allowed = ['product-image'];
    if (!in_array($key, $allowed, true)) hcwbJson(['ok' => false, 'error' => 'Unsupported workspace asset.'], 400);
    return $key;
}
function hcwbObject(string $workspace, string $key): string {
    return 'workspace-assets/' . rawurlencode($workspace) . '/' . $key;
}
function hcwbDelete(string $object): bool {
    $bucket = supabaseStorageBucket();
    $res = supabaseRequest('storage/v1/object/' . rawurlencode($bucket), [
        'method' => 'DELETE',
        'use_secret' => true,
        'content_type' => 'application/json',
        'body' => ['prefixes' => [$object]],
        'timeout' => 60,
    ]);
    return !empty($res['ok']) || (int)($res['status'] ?? 0) === 404;
}
function hcwbMime(string $tmp, string $fallback): string {
    $mime = '';
    if (class_exists('finfo')) {
        $f = new finfo(FILEINFO_MIME_TYPE);
        $m = @$f->file($tmp);
        if (is_string($m)) $mime = strtolower(trim($m));
    }
    if ($mime === '') $mime = strtolower(trim($fallback));
    return in_array($mime, ['image/png','image/jpeg','image/webp','image/gif'], true) ? $mime : '';
}

$workspace = hcwbWorkspace();
$key = hcwbKey((string)($_GET['key'] ?? $_POST['key'] ?? ''));
$object = hcwbObject($workspace, $key);
$method = strtoupper((string)($_SERVER['REQUEST_METHOD'] ?? 'GET'));

if ($method === 'GET') {
    $download = supabaseStorageDownload($object);
    if (empty($download['ok']) || !is_string($download['data'] ?? null)) {
        http_response_code(404);
        header('Cache-Control: no-store');
        exit;
    }
    $data = $download['data'];
    $hash = hash('sha256', $data);
    $mime = 'application/octet-stream';
    if (substr($data,0,8) === "\x89PNG\r\n\x1a\n") $mime = 'image/png';
    elseif (substr($data,0,3) === "\xFF\xD8\xFF") $mime = 'image/jpeg';
    elseif (substr($data,0,4) === 'RIFF' && substr($data,8,4) === 'WEBP') $mime = 'image/webp';
    elseif (substr($data,0,6) === 'GIF87a' || substr($data,0,6) === 'GIF89a') $mime = 'image/gif';
    header('Content-Type: ' . $mime);
    header('Content-Length: ' . strlen($data));
    header('Cache-Control: private, no-store');
    header('ETag: "' . $hash . '"');
    header('X-Content-SHA256: ' . $hash);
    header('X-Content-Type-Options: nosniff');
    echo $data;
    exit;
}

if ($method !== 'POST') {
    header('Allow: GET, POST');
    hcwbJson(['ok' => false, 'error' => 'Method not allowed.'], 405);
}
if (strcasecmp((string)($_SERVER['HTTP_X_REQUESTED_WITH'] ?? ''), 'XMLHttpRequest') !== 0) {
    hcwbJson(['ok' => false, 'error' => 'Request not allowed.'], 403);
}
$site = strtolower(trim((string)($_SERVER['HTTP_SEC_FETCH_SITE'] ?? '')));
if ($site !== '' && !in_array($site, ['same-origin','same-site'], true)) hcwbJson(['ok' => false, 'error' => 'Request not allowed.'], 403);

$action = strtolower(trim((string)($_GET['action'] ?? $_POST['action'] ?? 'upload')));
if ($action === 'delete') {
    if (!hcwbDelete($object)) hcwbJson(['ok' => false, 'error' => 'Could not remove workspace asset.'], 502);
    hcwbJson(['ok' => true, 'deleted' => true, 'key' => $key]);
}
if ($action !== 'upload') hcwbJson(['ok' => false, 'error' => 'Unsupported action.'], 400);
if (!isset($_FILES['file']) || !is_array($_FILES['file'])) hcwbJson(['ok' => false, 'error' => 'No file received.'], 400);
$file = $_FILES['file'];
if ((int)($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) hcwbJson(['ok' => false, 'error' => 'Upload incomplete.'], 400);
$tmp = (string)($file['tmp_name'] ?? '');
$size = (int)($file['size'] ?? 0);
if ($tmp === '' || !is_uploaded_file($tmp) || $size < 1 || $size > HCWB_MAX_BYTES) hcwbJson(['ok' => false, 'error' => 'Invalid workspace image.'], 413);
$mime = hcwbMime($tmp, (string)($file['type'] ?? ''));
if ($mime === '') hcwbJson(['ok' => false, 'error' => 'Unsupported image type.'], 415);
$hash = hash_file('sha256', $tmp) ?: '';
$stored = supabaseStorageUpload($object, $tmp, $mime, true);
if (empty($stored['ok'])) hcwbJson(['ok' => false, 'error' => 'Cloud storage rejected the workspace image.'], 502);
hcwbJson(['ok' => true, 'key' => $key, 'sha256' => $hash, 'size' => $size, 'type' => $mime]);
