<?php
/**
 * Hashcod cross-device sync.
 * Persists browser-only tool state in Supabase Postgres + Storage so the same
 * authenticated account sees the same data on laptop and phone.
 */

declare(strict_types=1);

@ini_set('display_errors', '0');
@ini_set('expose_php', '0');
@set_time_limit(20);

require_once __DIR__ . '/supabase.php';
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/security.php';

securityBootstrap('api');

function hcsJson(array $payload, int $status = 200): void {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function hcsAccount(): array {
    $sess = securityRequireAccountSession();
    $accountId = (string)($sess['account_id'] ?? $sess['user_id'] ?? '');
    $accountId = preg_replace('/[^a-zA-Z0-9_-]/', '', $accountId);
    if ($accountId === '') {
        hcsJson(['ok' => false, 'error' => 'Cuenta no disponible', 'code' => 'account_missing'], 401);
    }
    $accountKey = strpos($accountId, 'acct_') === 0 ? $accountId : ('acct_' . $accountId);
    return ['account_id' => $accountId, 'account_key' => $accountKey];
}

function hcsReadJson(): array {
    $raw = file_get_contents('php://input');
    if (!is_string($raw) || trim($raw) === '') return [];
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

function hcsRows($body): array {
    if (!is_array($body)) return [];
    if ($body === []) return [];
    if (array_keys($body) === range(0, count($body) - 1)) return $body;
    return isset($body['id']) ? [$body] : [];
}

function hcsLinkStateId(string $accountKey): string {
    return 'hcs_link_' . substr(hash('sha256', $accountKey), 0, 40);
}

function hcsNormalizeLink($row): ?array {
    if (!is_array($row)) return null;
    $slot = filter_var($row['slot'] ?? null, FILTER_VALIDATE_INT);
    if ($slot === false || $slot < 0 || $slot > 199) return null;

    $url = trim((string)($row['url'] ?? ''));
    if ($url === '' || strlen($url) > 4096) return null;
    $parts = @parse_url($url);
    $scheme = strtolower((string)($parts['scheme'] ?? ''));
    if (!in_array($scheme, ['http', 'https'], true)) return null;

    $codeHash = strtolower(trim((string)($row['codeHash'] ?? $row['code_hash'] ?? '')));
    if (!preg_match('/^[a-f0-9]{64}$/', $codeHash)) return null;

    $createdAt = (int)($row['createdAt'] ?? $row['created_at'] ?? round(microtime(true) * 1000));
    $updatedAt = (int)($row['updatedAt'] ?? $row['updated_at'] ?? $createdAt);
    if ($createdAt <= 0) $createdAt = (int)round(microtime(true) * 1000);
    if ($updatedAt < $createdAt) $updatedAt = $createdAt;

    return [
        'slot' => $slot,
        'url' => $url,
        'codeHash' => $codeHash,
        'createdAt' => $createdAt,
        'updatedAt' => $updatedAt,
    ];
}

function hcsLoadLinks(string $accountKey): array {
    $id = hcsLinkStateId($accountKey);
    $query = 'select=id,account_key,app_id,state,updated_at'
        . '&id=eq.' . rawurlencode($id)
        . '&account_key=eq.' . rawurlencode($accountKey)
        . '&limit=1';
    $res = supabaseDbSelect('l8_app_states', $query);
    if (empty($res['ok'])) {
        return ['ok' => false, 'error' => $res['error'] ?? 'No se pudo leer Postgres', 'links' => []];
    }
    $rows = hcsRows($res['body'] ?? []);
    if (!$rows) return ['ok' => true, 'links' => []];
    $state = $rows[0]['state'] ?? [];
    if (is_string($state)) {
        $decoded = json_decode($state, true);
        $state = is_array($decoded) ? $decoded : [];
    }
    $links = [];
    foreach (($state['links'] ?? []) as $row) {
        $n = hcsNormalizeLink($row);
        if ($n) $links[$n['slot']] = $n;
    }
    ksort($links);
    return ['ok' => true, 'links' => array_values($links)];
}

function hcsSaveLinks(string $accountKey, array $incoming): array {
    $current = hcsLoadLinks($accountKey);
    if (empty($current['ok'])) return $current;
    $merged = [];
    foreach (($current['links'] ?? []) as $row) {
        $n = hcsNormalizeLink($row);
        if ($n) $merged[$n['slot']] = $n;
    }
    foreach ($incoming as $row) {
        $n = hcsNormalizeLink($row);
        if (!$n) continue;
        $prev = $merged[$n['slot']] ?? null;
        if (!$prev || (int)$n['updatedAt'] >= (int)($prev['updatedAt'] ?? $prev['createdAt'] ?? 0)) {
            $merged[$n['slot']] = $n;
        }
    }
    ksort($merged);
    $now = gmdate('c');
    $row = [
        'id' => hcsLinkStateId($accountKey),
        'account_key' => $accountKey,
        'app_id' => 'hashcod_link_board_v1',
        'state' => [
            'version' => 2,
            'links' => array_values($merged),
            'synced_at' => $now,
        ],
        'updated_at' => $now,
    ];
    $res = supabaseDbUpsert('l8_app_states', [$row], 'id');
    return [
        'ok' => !empty($res['ok']),
        'error' => $res['error'] ?? null,
        'links' => array_values($merged),
    ];
}

function hcsImageDbId(string $accountKey, string $clientId): string {
    return 'hcs_img_' . substr(hash('sha256', $accountKey), 0, 16) . '_' . $clientId;
}

function hcsSafeClientId(string $id): string {
    $id = preg_replace('/[^a-zA-Z0-9_-]/', '', $id);
    return substr($id, 0, 96);
}

function hcsImageObject(string $accountKey, string $clientId): string {
    $acct = substr(hash('sha256', $accountKey), 0, 24);
    return 'hashcod_sync/gallery/' . $acct . '/' . $clientId . '.png';
}

function hcsListImages(string $accountKey): array {
    $query = 'select=id,filename,mime_type,size_bytes,hash,storage_path,supabase_object,meta,upload_date'
        . '&account_key=eq.' . rawurlencode($accountKey)
        . '&is_deleted=eq.false'
        . '&order=upload_date.desc'
        . '&limit=1000';
    $res = supabaseDbSelect('l8_files', $query);
    if (empty($res['ok'])) {
        return ['ok' => false, 'error' => $res['error'] ?? 'No se pudo leer la galería en Postgres', 'images' => []];
    }

    $images = [];
    foreach (hcsRows($res['body'] ?? []) as $row) {
        $meta = $row['meta'] ?? [];
        if (is_string($meta)) {
            $decoded = json_decode($meta, true);
            $meta = is_array($decoded) ? $decoded : [];
        }
        if (($meta['tool'] ?? '') !== 'collection_gallery') continue;
        $clientId = hcsSafeClientId((string)($meta['client_id'] ?? ''));
        if ($clientId === '') continue;
        $codeHash = strtolower((string)($meta['code_hash'] ?? ''));
        if (!preg_match('/^[a-f0-9]{64}$/', $codeHash)) continue;
        $images[] = [
            'id' => $clientId,
            'name' => (string)($row['filename'] ?? 'image.png'),
            'type' => 'image/png',
            'size' => (int)($row['size_bytes'] ?? 0),
            'createdAt' => (int)($meta['created_at'] ?? 0),
            'updatedAt' => (int)($meta['updated_at'] ?? $meta['created_at'] ?? 0),
            'codeHash' => $codeHash,
            'sha256' => (string)($row['hash'] ?? ''),
        ];
    }
    return ['ok' => true, 'images' => $images];
}

function hcsUploadImage(string $accountKey): array {
    $clientId = hcsSafeClientId((string)($_POST['id'] ?? ''));
    $codeHash = strtolower(trim((string)($_POST['code_hash'] ?? '')));
    $createdAt = (int)($_POST['created_at'] ?? round(microtime(true) * 1000));
    $updatedAt = (int)($_POST['updated_at'] ?? $createdAt);
    if ($clientId === '') return ['ok' => false, 'error' => 'ID de imagen inválido'];
    if (!preg_match('/^[a-f0-9]{64}$/', $codeHash)) return ['ok' => false, 'error' => 'Hash de code inválido'];
    if (!isset($_FILES['file']) || !is_array($_FILES['file'])) return ['ok' => false, 'error' => 'Falta el PNG'];

    $file = $_FILES['file'];
    $tmp = (string)($file['tmp_name'] ?? '');
    $size = (int)($file['size'] ?? 0);
    $name = basename((string)($file['name'] ?? 'image.png'));
    if (!is_uploaded_file($tmp) || $size < 1 || $size > 15 * 1024 * 1024) {
        return ['ok' => false, 'error' => 'PNG inválido o demasiado grande'];
    }
    $head = @file_get_contents($tmp, false, null, 0, 8);
    if ($head !== "\x89PNG\r\n\x1a\n") return ['ok' => false, 'error' => 'Firma PNG inválida'];

    $object = hcsImageObject($accountKey, $clientId);
    $upload = supabaseStorageUpload($object, $tmp, 'image/png', true);
    if (empty($upload['ok'])) {
        return ['ok' => false, 'error' => $upload['error'] ?? 'No se pudo subir el PNG a Supabase Storage'];
    }

    $now = gmdate('c');
    $row = [
        'id' => hcsImageDbId($accountKey, $clientId),
        'account_key' => $accountKey,
        'filename' => substr($name !== '' ? $name : 'image.png', 0, 255),
        'mime_type' => 'image/png',
        'size_bytes' => $size,
        'hash' => hash_file('sha256', $tmp),
        'storage_path' => $object,
        'supabase_object' => $object,
        'meta' => [
            'tool' => 'collection_gallery',
            'client_id' => $clientId,
            'code_hash' => $codeHash,
            'created_at' => $createdAt,
            'updated_at' => max($updatedAt, $createdAt),
            'synced_at' => $now,
        ],
        'is_deleted' => false,
        'upload_date' => $now,
    ];
    $db = supabaseDbUpsert('l8_files', [$row], 'id');
    if (empty($db['ok'])) {
        return ['ok' => false, 'error' => $db['error'] ?? 'No se pudo registrar el PNG en Postgres'];
    }
    return ['ok' => true, 'image' => [
        'id' => $clientId,
        'name' => $row['filename'],
        'type' => 'image/png',
        'size' => $size,
        'createdAt' => $createdAt,
        'updatedAt' => max($updatedAt, $createdAt),
        'codeHash' => $codeHash,
        'sha256' => $row['hash'],
    ]];
}

function hcsStreamImage(string $accountKey, string $clientId): void {
    $clientId = hcsSafeClientId($clientId);
    if ($clientId === '') {
        http_response_code(400);
        exit;
    }
    $id = hcsImageDbId($accountKey, $clientId);
    $query = 'select=id,storage_path,supabase_object,mime_type,size_bytes,meta'
        . '&id=eq.' . rawurlencode($id)
        . '&account_key=eq.' . rawurlencode($accountKey)
        . '&is_deleted=eq.false&limit=1';
    $res = supabaseDbSelect('l8_files', $query);
    $rows = !empty($res['ok']) ? hcsRows($res['body'] ?? []) : [];
    if (!$rows) {
        http_response_code(404);
        exit;
    }
    $object = (string)($rows[0]['supabase_object'] ?? $rows[0]['storage_path'] ?? '');
    if ($object === '') {
        http_response_code(404);
        exit;
    }
    $download = supabaseStorageDownload($object);
    if (empty($download['ok']) || !is_string($download['data'] ?? null)) {
        http_response_code(502);
        exit;
    }
    header('Content-Type: image/png');
    header('Content-Length: ' . strlen($download['data']));
    header('Cache-Control: private, max-age=60');
    header('X-Content-Type-Options: nosniff');
    echo $download['data'];
    exit;
}

$account = hcsAccount();
$accountKey = $account['account_key'];
$action = (string)($_GET['action'] ?? 'status');
$method = strtoupper((string)($_SERVER['REQUEST_METHOD'] ?? 'GET'));

if ($action === 'status' && $method === 'GET') {
    $cfg = supabaseConfig();
    $health = function_exists('supabaseHealthCheck') ? supabaseHealthCheck() : [];
    hcsJson([
        'ok' => true,
        'account_key' => $accountKey,
        'supabase_configured' => !empty($cfg['configured']),
        'postgres' => !empty(supabaseDbSelect('l8_app_states', 'select=id&limit=1')['ok'])
            && !empty(supabaseDbSelect('l8_files', 'select=id&limit=1')['ok']),
        'storage' => !empty($health['storage_ready']) && empty($health['degraded']),
    ]);
}

if ($action === 'links.pull' && $method === 'GET') {
    $res = hcsLoadLinks($accountKey);
    hcsJson($res, !empty($res['ok']) ? 200 : 502);
}

if ($action === 'links.push' && $method === 'POST') {
    $body = hcsReadJson();
    $links = isset($body['links']) && is_array($body['links']) ? $body['links'] : [];
    $res = hcsSaveLinks($accountKey, $links);
    hcsJson($res, !empty($res['ok']) ? 200 : 502);
}

if ($action === 'images.list' && $method === 'GET') {
    $res = hcsListImages($accountKey);
    hcsJson($res, !empty($res['ok']) ? 200 : 502);
}

if ($action === 'images.upload' && $method === 'POST') {
    $res = hcsUploadImage($accountKey);
    hcsJson($res, !empty($res['ok']) ? 200 : 422);
}

if ($action === 'images.get' && $method === 'GET') {
    hcsStreamImage($accountKey, (string)($_GET['id'] ?? ''));
}

hcsJson(['ok' => false, 'error' => 'Ruta de sincronización no encontrada'], 404);
