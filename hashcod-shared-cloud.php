<?php
declare(strict_types=1);

/*
 * Same-origin facade for the public shared workspace. The browser never sees
 * database or storage credentials; this endpoint only forwards bounded,
 * user-facing actions to the Supabase Edge Function.
 */
require_once __DIR__ . '/security.php';

const HCS_MAX_BODY = 2097152;
const HCS_EDGE_DEFAULT = 'https://azzzmfwoqcbvsfjvmqyz.supabase.co/functions/v1/hashcod-shared-cloud';

function hcsJson(array $payload, int $status = 200): void {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store, max-age=0, must-revalidate');
    header('X-Content-Type-Options: nosniff');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function hcsEdgeUrl(): string {
    $value = getenv('HASHCOD_SHARED_CLOUD_URL');
    $value = is_string($value) && trim($value) !== '' ? trim($value) : HCS_EDGE_DEFAULT;
    return rtrim($value, '/');
}

function hcsBody(): array {
    $length = (int)($_SERVER['CONTENT_LENGTH'] ?? 0);
    if ($length > HCS_MAX_BODY) hcsJson(['ok' => false, 'error' => 'Request too large.'], 413);
    $raw = (string)file_get_contents('php://input', false, null, 0, HCS_MAX_BODY + 1);
    if (strlen($raw) > HCS_MAX_BODY) hcsJson(['ok' => false, 'error' => 'Request too large.'], 413);
    if (trim($raw) === '') return [];
    $data = json_decode($raw, true);
    if (!is_array($data)) hcsJson(['ok' => false, 'error' => 'Invalid JSON.'], 400);
    return $data;
}

function hcsAction(string $route, string $method, array $body, array $query): array {
    if ($method !== 'GET' && $method !== 'POST') hcsJson(['ok' => false, 'error' => 'Method not allowed.'], 405);
    if ($route === '/api/hashcod-shared-state') return ['state', $method === 'POST' ? $body : null];
    if ($route === '/api/hashcod-shared-text-editor') {
        $key = 'hashcod:text-editor:draft:v1';
        if ($method === 'GET') return ['state', null, $key];
        $content = (string)($body['content'] ?? '');
        if (strlen($content) > 524288) hcsJson(['ok' => false, 'error' => 'Text is too large.'], 413);
        $now = (int)round(microtime(true) * 1000);
        return ['state', ['entries' => [$key => ['value' => $content, 'updatedAt' => $now, 'deleted' => false]]], $key];
    }
    $action = strtolower(trim((string)($query['action'] ?? 'list')));
    $allowed = ['list', 'prepare', 'complete', 'download', 'delete'];
    if (!in_array($action, $allowed, true)) hcsJson(['ok' => false, 'error' => 'Unsupported action.'], 400);
    if ($method === 'GET' && $action !== 'list') hcsJson(['ok' => false, 'error' => 'Method not allowed.'], 405);
    if ($method !== 'GET' && $method !== 'POST') hcsJson(['ok' => false, 'error' => 'Method not allowed.'], 405);
    return ['files.' . $action, $method === 'POST' ? $body : null];
}

function hcsCall(string $action, ?array $body): array {
    if (!function_exists('curl_init')) hcsJson(['ok' => false, 'error' => 'Shared cloud is unavailable.'], 503);
    $url = hcsEdgeUrl() . '?action=' . rawurlencode($action);
    $method = $body === null ? 'GET' : 'POST';
    $ch = curl_init($url);
    if ($ch === false) hcsJson(['ok' => false, 'error' => 'Shared cloud is unavailable.'], 503);
    $options = [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_CONNECTTIMEOUT => 8,
        CURLOPT_TIMEOUT => 70,
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_HTTPHEADER => ['Accept: application/json, application/octet-stream', 'X-Client-Route: hashcod-shared-cloud'],
    ];
    if ($body !== null) {
        $encoded = json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if (!is_string($encoded)) hcsJson(['ok' => false, 'error' => 'Invalid request.'], 400);
        $options[CURLOPT_POSTFIELDS] = $encoded;
        $options[CURLOPT_HTTPHEADER][] = 'Content-Type: application/json';
    }
    curl_setopt_array($ch, $options);
    $raw = curl_exec($ch);
    $status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $type = (string)curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
    $error = curl_error($ch);
    curl_close($ch);
    if ($raw === false || $status < 200 || $status >= 600) {
        hcsJson(['ok' => false, 'error' => $error !== '' ? 'Shared cloud is temporarily unavailable.' : 'Shared cloud is unavailable.'], 503);
    }
    return ['status' => $status, 'type' => $type, 'raw' => (string)$raw];
}

function hcsForwardResponse(array $response, bool $fileDownload = false): void {
    $type = strtolower((string)$response['type']);
    $status = (int)$response['status'];
    $raw = (string)$response['raw'];
    // A protected JSON/text file is still a file: never decode or reserialize
    // successful downloads, even when its bytes look like an API response.
    if (!$fileDownload || $status < 200 || $status >= 300) {
        $decoded = json_decode($raw, true);
        if (!is_array($decoded)) hcsJson(['ok' => false, 'error' => 'Invalid cloud response.'], 503);
        hcsJson($decoded, $status);
    }
    http_response_code($status);
    header('Content-Type: ' . ($type !== '' ? $type : 'application/octet-stream'));
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    header('Content-Length: ' . strlen($raw));
    echo $raw;
    exit;
}

function hcsTextResponse(array $response, string $key): void {
    $decoded = json_decode((string)$response['raw'], true);
    if (!is_array($decoded) || empty($decoded['ok'])) hcsForwardResponse($response);
    $entry = is_array($decoded['entries'][$key] ?? null) ? $decoded['entries'][$key] : [];
    $updated = (int)($entry['updatedAt'] ?? 0);
    hcsJson([
        'ok' => true,
        'content' => !empty($entry['deleted']) ? '' : (string)($entry['value'] ?? ''),
        'updated_at' => $updated > 0 ? gmdate('c', (int)floor($updated / 1000)) : null,
        'saved' => 'cloud',
        'cloud_available' => true,
    ], 200);
}

function hashcodSharedCloudHandle(): void {
    require_once __DIR__ . '/platform-period-lib.php';
    platformPeriodGuard();
    securityBootstrap('api');
    $route = (string)($_SERVER['HASHCOD_SHARED_ROUTE'] ?? '/api/hashcod-shared-files');
    $method = strtoupper((string)($_SERVER['REQUEST_METHOD'] ?? 'GET'));
    if ($method === 'POST') {
        $site = strtolower(trim((string)($_SERVER['HTTP_SEC_FETCH_SITE'] ?? '')));
        if ($site === 'cross-site' || strcasecmp((string)($_SERVER['HTTP_X_REQUESTED_WITH'] ?? ''), 'XMLHttpRequest') !== 0) {
            hcsJson(['ok' => false, 'error' => 'Same-origin request required.'], 403);
        }
        $origin = trim((string)($_SERVER['HTTP_ORIGIN'] ?? ''));
        if ($origin !== '') {
            $parts = parse_url($origin);
            $host = strtolower((string)($parts['host'] ?? ''));
            $port = isset($parts['port']) ? ':' . (int)$parts['port'] : '';
            if (!is_array($parts) || strtolower((string)($parts['scheme'] ?? '')) !== (securityIsHttps() ? 'https' : 'http')
                || $host === '' || !hash_equals(strtolower((string)($_SERVER['HTTP_HOST'] ?? '')), $host . $port)) {
                hcsJson(['ok' => false, 'error' => 'Same-origin request required.'], 403);
            }
        }
    }
    $query = $_GET;
    $body = $method === 'POST' ? hcsBody() : [];
    [$action, $forwardBody, $textKey] = array_pad(hcsAction($route, $method, $body, $query), 3, null);
    if ($method === 'POST' && function_exists('securityRateAllowSliding')) {
        $rate = securityRateAllowSliding('hashcod_shared_cloud', 120, 60);
        if (empty($rate['allowed'])) hcsJson(['ok' => false, 'error' => 'Too many requests.'], 429);
    }
    $response = hcsCall((string)$action, is_array($forwardBody) ? $forwardBody : null);
    if ($textKey !== null) hcsTextResponse($response, $textKey);
    hcsForwardResponse($response, $action === 'files.download');
}

if (!defined('HCS_LIBRARY_ONLY')) hashcodSharedCloudHandle();
