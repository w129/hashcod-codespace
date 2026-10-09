<?php
declare(strict_types=1);
require_once __DIR__ . '/platform-period-lib.php';
platformPeriodGuard(true);

require_once __DIR__ . '/supabase.php';
require_once __DIR__ . '/security.php';
require_once __DIR__ . '/hashcod-workspace-access.php';

const HCWS_APP_ID = 'hashcod-universal-workspace';
const HCWS_MAX_BODY_BYTES = 2097152;
const HCWS_MAX_VALUE_BYTES = 524288;
const HCWS_MAX_ENTRIES = 256;

function hcwsJson(array $payload, int $status = 200): void {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store, max-age=0, must-revalidate');
    header('Pragma: no-cache');
    header('X-Content-Type-Options: nosniff');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function hcwsRequireAccess(): string {
    if (!hashcodWorkspaceAccessAuthorized()) {
        hcwsJson(['ok' => false, 'error' => 'Workspace authorization required.'], 401);
    }
    $key = hashcodWorkspaceKey();
    if ($key === '') hcwsJson(['ok' => false, 'error' => 'Workspace unavailable.'], 401);
    return $key;
}

function hcwsStateId(string $workspace): string {
    return 'workspace_' . substr(hash('sha256', HCWS_APP_ID . '|' . $workspace), 0, 40);
}

function hcwsSensitiveKey(string $key): bool {
    $k = strtolower($key);
    if ($k === '' || strlen($k) > 180) return true;
    if (str_starts_with($k, '__hashcod_cloud_')) return true;
    return (bool)preg_match(
        '/(?:^|[_:\-.])(auth|token|secret|password|passwd|private|credential|dilithium|webauthn|csrf|nonce|challenge|turnstile|session|jwt|oauth|supabase|api[_-]?key|access[_-]?code)(?:$|[_:\-.])/i',
        $k
    );
}

function hcwsNormalizeEntry(string $key, $raw): ?array {
    if (hcwsSensitiveKey($key) || !is_array($raw)) return null;
    $updatedAt = (int)($raw['updatedAt'] ?? 0);
    if ($updatedAt < 1) return null;
    $deleted = !empty($raw['deleted']);
    $value = $deleted ? '' : (string)($raw['value'] ?? '');
    if (strlen($value) > HCWS_MAX_VALUE_BYTES) return null;
    return [
        'value' => $value,
        'updatedAt' => $updatedAt,
        'deleted' => $deleted,
    ];
}

function hcwsRows($body): array {
    if (!is_array($body) || $body === []) return [];
    if (array_keys($body) === range(0, count($body) - 1)) return $body;
    return isset($body['id']) ? [$body] : [];
}

function hcwsLoad(string $workspace): array {
    $id = hcwsStateId($workspace);
    $query = 'select=state,updated_at&id=eq.' . rawurlencode($id) . '&account_key=eq.' . rawurlencode($workspace) . '&limit=1';
    $res = supabaseDbSelect('l8_app_states', $query);
    if (empty($res['ok'])) {
        return ['ok' => false, 'entries' => [], 'revision' => 0, 'error' => (string)($res['error'] ?? 'cloud_unavailable')];
    }
    $rows = hcwsRows($res['body'] ?? []);
    if (!$rows) return ['ok' => true, 'entries' => [], 'revision' => 0, 'updated_at' => null];
    $state = $rows[0]['state'] ?? [];
    if (is_string($state)) $state = json_decode($state, true);
    if (!is_array($state)) $state = [];
    $entries = [];
    foreach (($state['entries'] ?? []) as $key => $entry) {
        if (!is_string($key)) continue;
        $normalized = hcwsNormalizeEntry($key, $entry);
        if ($normalized) $entries[$key] = $normalized;
        if (count($entries) >= HCWS_MAX_ENTRIES) break;
    }
    return [
        'ok' => true,
        'entries' => $entries,
        'revision' => max(0, (int)($state['revision'] ?? 0)),
        'updated_at' => (string)($state['updated_at'] ?? $rows[0]['updated_at'] ?? ''),
    ];
}

function hcwsSave(string $workspace, array $entries, int $revision): bool {
    $updatedAt = gmdate('c');
    $row = [[
        'id' => hcwsStateId($workspace),
        'account_key' => $workspace,
        'app_id' => HCWS_APP_ID,
        'state' => [
            'version' => 1,
            'revision' => $revision,
            'entries' => $entries,
            'updated_at' => $updatedAt,
        ],
        'updated_at' => $updatedAt,
    ]];
    $saved = supabaseDbUpsert('l8_app_states', $row, 'id');
    return !empty($saved['ok']);
}

$workspace = hcwsRequireAccess();
$method = strtoupper((string)($_SERVER['REQUEST_METHOD'] ?? 'GET'));

if ($method === 'GET') {
    $current = hcwsLoad($workspace);
    if (empty($current['ok'])) hcwsJson(['ok' => false, 'error' => 'Cloud workspace unavailable.'], 503);
    hcwsJson([
        'ok' => true,
        'revision' => (int)$current['revision'],
        'entries' => $current['entries'],
        'updated_at' => $current['updated_at'] ?? null,
    ]);
}

if ($method !== 'POST') {
    header('Allow: GET, POST');
    hcwsJson(['ok' => false, 'error' => 'Method not allowed.'], 405);
}

$site = strtolower(trim((string)($_SERVER['HTTP_SEC_FETCH_SITE'] ?? '')));
if ($site !== '' && !in_array($site, ['same-origin', 'same-site'], true)) {
    hcwsJson(['ok' => false, 'error' => 'Request not allowed.'], 403);
}
if (strcasecmp((string)($_SERVER['HTTP_X_REQUESTED_WITH'] ?? ''), 'XMLHttpRequest') !== 0) {
    hcwsJson(['ok' => false, 'error' => 'Request not allowed.'], 403);
}
if (function_exists('securityRateAllowSliding')) {
    $rate = securityRateAllowSliding('hashcod_workspace_state', 90, 60);
    if (empty($rate['allowed'])) {
        hcwsJson(['ok' => false, 'error' => 'Too many saves.', 'retry_after' => (int)($rate['retry_after'] ?? 10)], 429);
    }
}

$raw = (string)file_get_contents('php://input', false, null, 0, HCWS_MAX_BODY_BYTES + 1);
if (strlen($raw) > HCWS_MAX_BODY_BYTES) hcwsJson(['ok' => false, 'error' => 'Workspace snapshot too large.'], 413);
$body = json_decode($raw, true);
if (!is_array($body)) hcwsJson(['ok' => false, 'error' => 'Invalid JSON.'], 400);
$incoming = $body['entries'] ?? [];
if (!is_array($incoming)) hcwsJson(['ok' => false, 'error' => 'Invalid entries.'], 400);

$current = hcwsLoad($workspace);
if (empty($current['ok'])) hcwsJson(['ok' => false, 'error' => 'Cloud workspace unavailable.'], 503);
$merged = is_array($current['entries'] ?? null) ? $current['entries'] : [];

foreach ($incoming as $key => $entry) {
    if (!is_string($key)) continue;
    $normalized = hcwsNormalizeEntry($key, $entry);
    if (!$normalized) continue;
    $existingTs = isset($merged[$key]) && is_array($merged[$key]) ? (int)($merged[$key]['updatedAt'] ?? 0) : 0;
    if ((int)$normalized['updatedAt'] >= $existingTs) $merged[$key] = $normalized;
    if (count($merged) > HCWS_MAX_ENTRIES) break;
}

// Keep tombstones so a deletion propagates to other devices, but prune very old ones.
$cutoff = (int)round(microtime(true) * 1000) - 30 * 24 * 60 * 60 * 1000;
foreach ($merged as $key => $entry) {
    if (!empty($entry['deleted']) && (int)($entry['updatedAt'] ?? 0) < $cutoff) unset($merged[$key]);
}

$revision = max((int)($current['revision'] ?? 0) + 1, (int)($body['revision'] ?? 0), 1);
if (!hcwsSave($workspace, $merged, $revision)) {
    hcwsJson(['ok' => false, 'error' => 'Cloud workspace save failed.'], 503);
}

hcwsJson(['ok' => true, 'revision' => $revision, 'entries' => $merged]);
