<?php
declare(strict_types=1);

/**
 * Hashcod liquid-glass text editor persistence.
 *
 * Interaction model adapted from tagspaces/editorText (MIT):
 * editable content, change tracking, load/save lifecycle and Ctrl+S semantics.
 * Hashcod provides its own PHP + Supabase persistence layer and UI.
 */
require_once __DIR__ . '/security.php';
require_once __DIR__ . '/supabase.php';

const HTE_APP_ID = 'hashcod-gate-text-editor';
const HTE_MAX_BYTES = 65536;

function hteJson(array $payload, int $status = 200): void {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    header('Pragma: no-cache');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function hteReadJson(): array {
    $raw = file_get_contents('php://input', false, null, 0, HTE_MAX_BYTES + 4097);
    if (!is_string($raw) || trim($raw) === '') return [];
    if (strlen($raw) > HTE_MAX_BYTES + 4096) {
        hteJson(['ok' => false, 'error' => 'El texto supera el límite permitido.'], 413);
    }
    $data = json_decode($raw, true);
    if (!is_array($data)) hteJson(['ok' => false, 'error' => 'JSON inválido.'], 400);
    return $data;
}

function hteClientId(string $clientId): string {
    $clientId = trim($clientId);
    return preg_match('/^[a-zA-Z0-9_-]{16,96}$/', $clientId) ? $clientId : '';
}

function hteSameOrigin(): bool {
    $origin = trim((string)($_SERVER['HTTP_ORIGIN'] ?? ''));
    $site = strtolower(trim((string)($_SERVER['HTTP_SEC_FETCH_SITE'] ?? '')));
    if ($origin === '') return in_array($site, ['', 'same-origin', 'same-site'], true);

    $parts = @parse_url($origin);
    if (!is_array($parts)) return false;
    $scheme = strtolower((string)($parts['scheme'] ?? ''));
    $host = strtolower((string)($parts['host'] ?? ''));
    $port = isset($parts['port']) ? ':' . (int)$parts['port'] : '';

    $requestHost = strtolower(trim((string)($_SERVER['HTTP_X_FORWARDED_HOST'] ?? $_SERVER['HTTP_HOST'] ?? '')));
    $requestHost = preg_replace('/\s*,.*$/', '', $requestHost) ?? $requestHost;
    $requestScheme = strtolower(trim((string)($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '')));
    $requestScheme = preg_replace('/\s*,.*$/', '', $requestScheme) ?? $requestScheme;
    if ($requestScheme === '') $requestScheme = securityIsHttps() ? 'https' : 'http';

    return $scheme !== '' && $host !== '' && hash_equals($requestScheme . '://' . $requestHost, $scheme . '://' . $host . $port);
}

function hteOwnerKey(string $clientId): string {
    $pepper = function_exists('authPepper')
        ? (string)authPepper()
        : (string)envValue('L8_AUTH_PEPPER', 'hashcod-text-editor-owner');
    return 'visitor_' . substr(hash_hmac('sha256', $clientId, $pepper), 0, 40);
}

function hteStateId(string $owner): string {
    return 'text_editor_' . substr(hash('sha256', HTE_APP_ID . '|' . $owner), 0, 40);
}

function hteRows($body): array {
    if (!is_array($body) || $body === []) return [];
    if (array_keys($body) === range(0, count($body) - 1)) return $body;
    return isset($body['id']) ? [$body] : [];
}

function hteCloudLoad(string $owner): array {
    $id = hteStateId($owner);
    $query = 'select=state,updated_at&id=eq.' . rawurlencode($id) . '&limit=1';
    $res = supabaseDbSelect('l8_app_states', $query);
    if (empty($res['ok'])) return ['ok' => false];

    $rows = hteRows($res['body'] ?? []);
    if (!$rows) return ['ok' => true, 'content' => '', 'updated_at' => null, 'source' => 'cloud'];

    $state = $rows[0]['state'] ?? [];
    if (is_string($state)) $state = json_decode($state, true);
    if (!is_array($state)) $state = [];

    return [
        'ok' => true,
        'content' => (string)($state['content'] ?? ''),
        'updated_at' => (string)($state['updated_at'] ?? $rows[0]['updated_at'] ?? ''),
        'source' => 'cloud',
    ];
}

function hteCloudSave(string $owner, string $content, string $updatedAt): bool {
    $row = [[
        'id' => hteStateId($owner),
        'account_key' => $owner,
        'app_id' => HTE_APP_ID,
        'state' => [
            'content' => $content,
            'updated_at' => $updatedAt,
            'editor' => 'tagspaces-editorText-adapted',
            'version' => 1,
        ],
        'updated_at' => $updatedAt,
    ]];

    $saved = supabaseDbUpsert('l8_app_states', $row, 'id');
    return !empty($saved['ok']);
}

function hteLocalPath(string $owner): string {
    $dir = __DIR__ . '/data_storage/text_editor';
    if (!is_dir($dir)) @mkdir($dir, 0700, true);
    @chmod($dir, 0700);
    return $dir . '/' . substr(hash('sha256', $owner), 0, 48) . '.json';
}

function hteLocalLoad(string $owner): array {
    $path = hteLocalPath($owner);
    if (!is_file($path) || !is_readable($path)) {
        return ['ok' => true, 'content' => '', 'updated_at' => null, 'source' => 'local'];
    }
    $raw = @file_get_contents($path);
    $data = is_string($raw) ? json_decode($raw, true) : null;
    if (!is_array($data)) return ['ok' => false];
    return [
        'ok' => true,
        'content' => (string)($data['content'] ?? ''),
        'updated_at' => (string)($data['updated_at'] ?? ''),
        'source' => 'local',
    ];
}

function hteLocalSave(string $owner, string $content, string $updatedAt): bool {
    $path = hteLocalPath($owner);
    $tmp = $path . '.' . bin2hex(random_bytes(6)) . '.tmp';
    $payload = json_encode([
        'content' => $content,
        'updated_at' => $updatedAt,
        'editor' => 'tagspaces-editorText-adapted',
        'version' => 1,
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if (!is_string($payload)) return false;

    $fp = @fopen($tmp, 'xb');
    if (!$fp) return false;
    $ok = false;
    if (@flock($fp, LOCK_EX)) {
        $ok = @fwrite($fp, $payload) !== false;
        @fflush($fp);
        @flock($fp, LOCK_UN);
    }
    @fclose($fp);
    if (!$ok) {
        @unlink($tmp);
        return false;
    }
    @chmod($tmp, 0600);
    if (!@rename($tmp, $path)) {
        @unlink($tmp);
        return false;
    }
    @chmod($path, 0600);
    return true;
}

function hteNewest(array $a, array $b): array {
    if (empty($a['ok'])) return $b;
    if (empty($b['ok'])) return $a;
    $ta = strtotime((string)($a['updated_at'] ?? '')) ?: 0;
    $tb = strtotime((string)($b['updated_at'] ?? '')) ?: 0;
    if ($tb > $ta) return $b;
    if ($ta > $tb) return $a;
    if ((string)($a['content'] ?? '') !== '') return $a;
    return $b;
}

$method = strtoupper((string)($_SERVER['REQUEST_METHOD'] ?? 'GET'));
if (!in_array($method, ['GET', 'POST'], true)) {
    header('Allow: GET, POST');
    hteJson(['ok' => false, 'error' => 'Método no permitido.'], 405);
}

if (!hteSameOrigin()) hteJson(['ok' => false, 'error' => 'Origen no autorizado.'], 403);

$body = [];
if ($method === 'POST') {
    if (strcasecmp((string)($_SERVER['HTTP_X_REQUESTED_WITH'] ?? ''), 'XMLHttpRequest') !== 0) {
        hteJson(['ok' => false, 'error' => 'Solicitud no autorizada.'], 403);
    }
    if (function_exists('securityRateAllowSliding')) {
        $rate = securityRateAllowSliding('hashcod_text_editor', 90, 60);
        if (empty($rate['allowed'])) {
            hteJson([
                'ok' => false,
                'error' => 'Demasiados guardados seguidos.',
                'retry_after' => (int)($rate['retry_after'] ?? 15),
            ], 429);
        }
    }
    $body = hteReadJson();
}

$clientId = hteClientId((string)($body['client_id'] ?? $_GET['client_id'] ?? ''));
if ($clientId === '') hteJson(['ok' => false, 'error' => 'Identificador de editor inválido.'], 400);
$owner = hteOwnerKey($clientId);

if ($method === 'GET') {
    $cloud = hteCloudLoad($owner);
    $local = hteLocalLoad($owner);
    $best = hteNewest($cloud, $local);
    hteJson([
        'ok' => true,
        'content' => (string)($best['content'] ?? ''),
        'updated_at' => $best['updated_at'] ?? null,
        'source' => (string)($best['source'] ?? 'empty'),
        'cloud_available' => !empty($cloud['ok']),
    ]);
}

$content = (string)($body['content'] ?? '');
$content = str_replace("\0", '', $content);
if (strlen($content) > HTE_MAX_BYTES) {
    hteJson(['ok' => false, 'error' => 'El texto supera 64 KB.'], 413);
}

$updatedAt = gmdate('c');
$localSaved = hteLocalSave($owner, $content, $updatedAt);
$cloudSaved = hteCloudSave($owner, $content, $updatedAt);

if (!$localSaved && !$cloudSaved) {
    hteJson(['ok' => false, 'error' => 'No se pudo guardar el texto.'], 503);
}

hteJson([
    'ok' => true,
    'updated_at' => $updatedAt,
    'saved' => $cloudSaved ? 'cloud' : 'local',
    'cloud_available' => $cloudSaved,
]);
