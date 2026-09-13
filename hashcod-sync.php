<?php
/**
 * Hashcod global cross-device sync.
 *
 * Link-board occupancy is readable from every device that loads the platform,
 * while link assignment remains protected by the registered Windows Hello
 * administrator session. URLs are never returned by the public pull endpoint:
 * they are released only after the matching per-link code is verified server-side.
 * Browser IndexedDB is an offline/cache layer, not the source of truth.
 */

declare(strict_types=1);

@ini_set('display_errors', '0');
@ini_set('expose_php', '0');
@set_time_limit(25);

require_once __DIR__ . '/supabase.php';
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/security.php';
require_once __DIR__ . '/admin-device.php';

securityBootstrap('api');

const HCS_SHARED_SCOPE = 'global';
const HCS_LINK_TABLE = 'hashcod_shared_links';
const HCS_IMAGE_TABLE = 'hashcod_shared_images';
const HCS_IMAGE_MAX_BYTES = 15728640;

function hcsJson(array $payload, int $status = 200): void {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    header('Pragma: no-cache');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function hcsSession(): array {
    $sess = securityRequireAccountSession();
    $accountId = (string)($sess['account_id'] ?? $sess['user_id'] ?? '');
    $accountId = preg_replace('/[^a-zA-Z0-9_-]/', '', $accountId);
    if ($accountId === '') {
        hcsJson(['ok' => false, 'error' => 'Cuenta no disponible', 'code' => 'account_missing'], 401);
    }
    return [
        'account_id' => $accountId,
        'actor' => substr($accountId, 0, 160),
        'scope' => HCS_SHARED_SCOPE,
    ];
}

function hcsRequireAjaxPost(): void {
    if (strtoupper((string)($_SERVER['REQUEST_METHOD'] ?? 'GET')) !== 'POST') {
        hcsJson(['ok' => false, 'error' => 'Método no permitido'], 405);
    }
    $xrw = (string)($_SERVER['HTTP_X_REQUESTED_WITH'] ?? '');
    if (strcasecmp($xrw, 'XMLHttpRequest') !== 0) {
        hcsJson(['ok' => false, 'error' => 'Solicitud no autorizada', 'code' => 'csrf_check_failed'], 403);
    }
}

function hcsReadJson(): array {
    $raw = file_get_contents('php://input', false, null, 0, 524289);
    if (!is_string($raw) || trim($raw) === '') return [];
    if (strlen($raw) > 524288) {
        hcsJson(['ok' => false, 'error' => 'Payload demasiado grande'], 413);
    }
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

function hcsRows($body): array {
    if (!is_array($body) || $body === []) return [];
    if (array_keys($body) === range(0, count($body) - 1)) return $body;
    return isset($body['id']) || isset($body['slot']) ? [$body] : [];
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

    $createdAt = (int)($row['createdAt'] ?? $row['created_at_ms'] ?? $row['created_at'] ?? round(microtime(true) * 1000));
    $updatedAt = (int)($row['updatedAt'] ?? $row['updated_at_ms'] ?? $row['updated_at'] ?? $createdAt);
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

/**
 * Public link-board projection. It intentionally exposes only occupied slots
 * and timestamps; destination URLs and code hashes stay on the server.
 */
function hcsLoadLinkSlots(): array {
    $res = supabaseDbSelect(HCS_LINK_TABLE, 'select=slot,created_at_ms,updated_at_ms&order=slot.asc&limit=200');
    if (empty($res['ok'])) {
        return ['ok' => false, 'error' => $res['error'] ?? 'No se pudo leer PostgreSQL', 'links' => []];
    }

    $links = [];
    foreach (hcsRows($res['body'] ?? []) as $row) {
        $slot = filter_var($row['slot'] ?? null, FILTER_VALIDATE_INT);
        if ($slot === false || $slot < 0 || $slot > 199) continue;
        $createdAt = max(1, (int)($row['created_at_ms'] ?? 1));
        $updatedAt = max($createdAt, (int)($row['updated_at_ms'] ?? $createdAt));
        $links[] = [
            'slot' => $slot,
            'createdAt' => $createdAt,
            'updatedAt' => $updatedAt,
            'cloud' => true,
        ];
    }
    return ['ok' => true, 'links' => $links, 'scope' => HCS_SHARED_SCOPE, 'shared' => true];
}

function hcsSaveLinks(array $incoming, string $actor): array {
    $normalized = [];
    foreach ($incoming as $row) {
        $n = hcsNormalizeLink($row);
        if ($n) $normalized[] = $n;
    }
    if (!$normalized) {
        return ['ok' => false, 'error' => 'No se recibió un enlace válido', 'links' => []];
    }

    $rpc = supabaseRequest('/rest/v1/rpc/hashcod_sync_upsert_links', [
        'method' => 'POST',
        'body' => [
            'p_links' => $normalized,
            'p_actor' => $actor,
        ],
        'headers' => ['Prefer: return=representation'],
        'timeout' => 8,
    ]);
    if (empty($rpc['ok'])) {
        return ['ok' => false, 'error' => $rpc['error'] ?? 'No se pudo guardar el enlace en PostgreSQL', 'links' => []];
    }

    hcsLogEvent('link', 'board', 'sync', ['count' => count($normalized)], $actor);
    return hcsLoadLinkSlots();
}

/** Verify a per-slot code without ever sending the stored hash to the browser. */
function hcsOpenLink(array $body): array {
    $slot = filter_var($body['slot'] ?? null, FILTER_VALIDATE_INT);
    $code = (string)($body['code'] ?? '');
    if ($slot === false || $slot < 0 || $slot > 199) {
        return ['ok' => false, 'error' => 'Slot inválido', 'status' => 400];
    }
    if (strlen($code) < 6 || strlen($code) > 256) {
        return ['ok' => false, 'error' => 'Code incorrecto.', 'status' => 403];
    }

    $rate = securityRateAllowSliding('hashcod_link_open', 30, 60);
    if (empty($rate['allowed'])) {
        return [
            'ok' => false,
            'error' => 'Demasiados intentos. Espera antes de volver a probar.',
            'status' => 429,
            'retry_after' => (int)($rate['retry_after'] ?? 30),
        ];
    }

    $query = 'select=slot,url,code_hash&slot=eq.' . rawurlencode((string)$slot) . '&limit=1';
    $res = supabaseDbSelect(HCS_LINK_TABLE, $query);
    $rows = !empty($res['ok']) ? hcsRows($res['body'] ?? []) : [];
    if (!$rows) {
        return ['ok' => false, 'error' => 'Este enlace ya no está disponible.', 'status' => 404];
    }

    $row = $rows[0];
    $storedHash = strtolower((string)($row['code_hash'] ?? ''));
    $suppliedHash = hash('sha256', $code);
    if (!preg_match('/^[a-f0-9]{64}$/', $storedHash) || !hash_equals($storedHash, $suppliedHash)) {
        return ['ok' => false, 'error' => 'Code incorrecto.', 'status' => 403];
    }

    $url = trim((string)($row['url'] ?? ''));
    $parts = @parse_url($url);
    $scheme = strtolower((string)($parts['scheme'] ?? ''));
    if ($url === '' || !in_array($scheme, ['http', 'https'], true)) {
        return ['ok' => false, 'error' => 'El enlace guardado no es válido.', 'status' => 422];
    }

    return ['ok' => true, 'url' => $url, 'slot' => $slot];
}

function hcsSafeClientId(string $id): string {
    $id = preg_replace('/[^a-zA-Z0-9_-]/', '', $id);
    return substr($id, 0, 96);
}

function hcsImageObject(string $clientId): string {
    return 'hashcod_sync/gallery/global/' . $clientId . '.png';
}

function hcsNormalizeImageMeta($row): ?array {
    if (!is_array($row)) return null;
    $id = hcsSafeClientId((string)($row['id'] ?? ''));
    if ($id === '') return null;
    $codeHash = strtolower(trim((string)($row['codeHash'] ?? $row['code_hash'] ?? '')));
    if (!preg_match('/^[a-f0-9]{64}$/', $codeHash)) return null;
    $sha256 = strtolower(trim((string)($row['sha256'] ?? '')));
    if ($sha256 !== '' && !preg_match('/^[a-f0-9]{64}$/', $sha256)) return null;
    $createdAt = (int)($row['createdAt'] ?? $row['created_at_ms'] ?? round(microtime(true) * 1000));
    $updatedAt = (int)($row['updatedAt'] ?? $row['updated_at_ms'] ?? $createdAt);
    if ($createdAt <= 0) $createdAt = (int)round(microtime(true) * 1000);
    if ($updatedAt < $createdAt) $updatedAt = $createdAt;
    return [
        'id' => $id,
        'name' => (string)($row['name'] ?? $row['filename'] ?? 'image.png'),
        'type' => 'image/png',
        'size' => (int)($row['size'] ?? $row['size_bytes'] ?? 0),
        'createdAt' => $createdAt,
        'updatedAt' => $updatedAt,
        'codeHash' => $codeHash,
        'sha256' => $sha256,
    ];
}

function hcsListImages(): array {
    $query = 'select=id,filename,mime_type,size_bytes,sha256,storage_path,code_hash,created_at_ms,updated_at_ms'
        . '&is_deleted=eq.false&order=updated_at_ms.desc&limit=1000';
    $res = supabaseDbSelect(HCS_IMAGE_TABLE, $query);
    if (empty($res['ok'])) {
        return ['ok' => false, 'error' => $res['error'] ?? 'No se pudo leer la galería en PostgreSQL', 'images' => []];
    }

    $images = [];
    foreach (hcsRows($res['body'] ?? []) as $row) {
        $meta = hcsNormalizeImageMeta($row);
        if ($meta) $images[] = $meta;
    }
    return ['ok' => true, 'images' => $images, 'scope' => HCS_SHARED_SCOPE];
}

function hcsUploadImage(string $actor): array {
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
    if (!is_uploaded_file($tmp) || $size < 1 || $size > HCS_IMAGE_MAX_BYTES) {
        return ['ok' => false, 'error' => 'PNG inválido o demasiado grande'];
    }
    $head = @file_get_contents($tmp, false, null, 0, 8);
    if ($head !== "\x89PNG\r\n\x1a\n") return ['ok' => false, 'error' => 'Firma PNG inválida'];

    $sha256 = hash_file('sha256', $tmp);
    $object = hcsImageObject($clientId);
    $upload = supabaseStorageUpload($object, $tmp, 'image/png', true);
    if (empty($upload['ok'])) {
        return ['ok' => false, 'error' => $upload['error'] ?? 'No se pudo subir el PNG a Supabase Storage'];
    }

    $row = [
        'id' => $clientId,
        'filename' => substr($name !== '' ? $name : 'image.png', 0, 255),
        'mime_type' => 'image/png',
        'size_bytes' => $size,
        'sha256' => $sha256,
        'storage_path' => $object,
        'code_hash' => $codeHash,
        'created_at_ms' => max(1, $createdAt),
        'updated_at_ms' => max($updatedAt, $createdAt, 1),
        'is_deleted' => false,
        'updated_by' => $actor,
        'updated_at' => gmdate('c'),
    ];

    $db = supabaseDbUpsert(HCS_IMAGE_TABLE, [$row], 'id');
    if (empty($db['ok'])) {
        return ['ok' => false, 'error' => $db['error'] ?? 'No se pudo registrar el PNG en PostgreSQL'];
    }

    hcsLogEvent('image', $clientId, 'upsert', ['size' => $size, 'sha256' => $sha256], $actor);
    return ['ok' => true, 'image' => hcsNormalizeImageMeta($row), 'scope' => HCS_SHARED_SCOPE];
}

function hcsStreamImage(string $clientId): void {
    $clientId = hcsSafeClientId($clientId);
    if ($clientId === '') {
        http_response_code(400);
        exit;
    }

    $query = 'select=id,storage_path,mime_type,size_bytes&id=eq.' . rawurlencode($clientId) . '&is_deleted=eq.false&limit=1';
    $res = supabaseDbSelect(HCS_IMAGE_TABLE, $query);
    $rows = !empty($res['ok']) ? hcsRows($res['body'] ?? []) : [];
    if (!$rows) {
        http_response_code(404);
        exit;
    }

    $object = (string)($rows[0]['storage_path'] ?? '');
    $download = $object !== '' ? supabaseStorageDownload($object) : ['ok' => false];
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

function hcsLogEvent(string $entityType, string $entityKey, string $action, array $payload, string $actor): void {
    $data = [[
        'entity_type' => $entityType,
        'entity_key' => substr($entityKey, 0, 180),
        'action' => $action,
        'payload' => array_merge($payload, ['actor' => $actor, 'scope' => HCS_SHARED_SCOPE]),
    ]];
    // Audit logging is best-effort and must never block the user's save.
    @supabaseRequest('/rest/v1/hashcod_sync_events', [
        'method' => 'POST',
        'body' => $data,
        'headers' => ['Prefer: return=minimal'],
        'timeout' => 3,
    ]);
}

$action = (string)($_GET['action'] ?? 'status');
$method = strtoupper((string)($_SERVER['REQUEST_METHOD'] ?? 'GET'));

if ($action === 'status' && $method === 'GET') {
    $cfg = supabaseConfig();
    $health = function_exists('supabaseHealthCheck') ? supabaseHealthCheck() : [];
    $linksReady = supabaseDbSelect(HCS_LINK_TABLE, 'select=slot&limit=1');
    $imagesReady = supabaseDbSelect(HCS_IMAGE_TABLE, 'select=id&limit=1');
    $projectRef = '';
    if (!empty($cfg['url']) && preg_match('#^https://([a-z0-9-]+)\.supabase\.co#i', (string)$cfg['url'], $m)) {
        $projectRef = (string)$m[1];
    }
    hcsJson([
        'ok' => true,
        'scope' => HCS_SHARED_SCOPE,
        'shared' => true,
        'supabase_configured' => !empty($cfg['configured']),
        'postgres' => !empty($linksReady['ok']) && !empty($imagesReady['ok']),
        'storage' => !empty($health['storage_ready']) && empty($health['degraded']),
        'project_ref' => $projectRef,
    ]);
}

// Safe public projection: every computer can see which circles are occupied.
if ($action === 'links.pull' && $method === 'GET') {
    $res = hcsLoadLinkSlots();
    hcsJson($res, !empty($res['ok']) ? 200 : 502);
}

// Only the registered laptop after positive Windows Hello may assign links.
if ($action === 'links.push' && $method === 'POST') {
    hcsRequireAjaxPost();
    adminRequire();
    $body = hcsReadJson();
    $links = isset($body['links']) && is_array($body['links']) ? $body['links'] : [];
    $res = hcsSaveLinks($links, 'admin-windows-hello');
    hcsJson($res, !empty($res['ok']) ? 200 : 502);
}

// Any platform device can open a shared slot only after supplying its code.
if ($action === 'links.open' && $method === 'POST') {
    hcsRequireAjaxPost();
    $res = hcsOpenLink(hcsReadJson());
    hcsJson($res, !empty($res['ok']) ? 200 : (int)($res['status'] ?? 403));
}

// Gallery sync is still tied to an authenticated account session.
if ($action === 'images.list' && $method === 'GET') {
    hcsSession();
    $res = hcsListImages();
    hcsJson($res, !empty($res['ok']) ? 200 : 502);
}

if ($action === 'images.upload' && $method === 'POST') {
    hcsRequireAjaxPost();
    $session = hcsSession();
    $res = hcsUploadImage($session['actor']);
    hcsJson($res, !empty($res['ok']) ? 200 : 502);
}

if ($action === 'images.get' && $method === 'GET') {
    hcsSession();
    hcsStreamImage((string)($_GET['id'] ?? ''));
}

hcsJson(['ok' => false, 'error' => 'Ruta de sincronización no encontrada'], 404);
