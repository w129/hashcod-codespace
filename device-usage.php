<?php
declare(strict_types=1);

require_once __DIR__ . '/secrets.php';
require_once __DIR__ . '/supabase.php';

const HDU_APP_ID = 'hashcod-device-usage-v1';
const HDU_COOKIE = 'hashcod_device_usage_v1';
const HDU_HSCU_LIMIT = 100.0;
const HDU_TOUCH_LIMIT = 1000;
const HDU_MAX_RECENT_EVENTS = 64;

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate');
header('Pragma: no-cache');
header('X-Content-Type-Options: nosniff');

function hduJson(int $status, array $payload): never {
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function hduB64u(string $raw): string {
    return rtrim(strtr(base64_encode($raw), '+/', '-_'), '=');
}

function hduB64ud(string $encoded): string {
    $pad = strlen($encoded) % 4;
    if ($pad) $encoded .= str_repeat('=', 4 - $pad);
    $raw = base64_decode(strtr($encoded, '-_', '+/'), true);
    return is_string($raw) ? $raw : '';
}

function hduSecret(): string {
    $configured = trim((string)secretGet('HASHCOD_DEVICE_USAGE_SECRET', ''));
    if ($configured !== '') return hash('sha256', $configured, true);
    if (function_exists('secretsDataKey')) {
        $base = secretsDataKey();
        if (is_string($base) && $base !== '') {
            return hash_hmac('sha256', 'hashcod|device-usage|v1', $base, true);
        }
    }
    $fallback = (string)secretGet('L8_AUTH_PEPPER', '');
    if ($fallback !== '') return hash('sha256', $fallback . '|hashcod-device-usage-v1', true);
    return hash('sha256', __FILE__ . '|hashcod-device-usage-fallback', true);
}

function hduIsHttps(): bool {
    $proto = strtolower(trim((string)($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '')));
    if ($proto !== '') return explode(',', $proto)[0] === 'https';
    return !empty($_SERVER['HTTPS']) && strtolower((string)$_SERVER['HTTPS']) !== 'off';
}

function hduSameOrigin(): bool {
    $origin = trim((string)($_SERVER['HTTP_ORIGIN'] ?? ''));
    $site = strtolower(trim((string)($_SERVER['HTTP_SEC_FETCH_SITE'] ?? '')));
    if ($origin === '') return in_array($site, ['', 'same-origin', 'same-site', 'none'], true);

    $parts = @parse_url($origin);
    if (!is_array($parts)) return false;
    $scheme = strtolower((string)($parts['scheme'] ?? ''));
    $host = strtolower((string)($parts['host'] ?? ''));
    $port = isset($parts['port']) ? ':' . (int)$parts['port'] : '';

    $requestHost = strtolower(trim((string)($_SERVER['HTTP_X_FORWARDED_HOST'] ?? $_SERVER['HTTP_HOST'] ?? '')));
    $requestHost = preg_replace('/\s*,.*$/', '', $requestHost) ?? $requestHost;
    $requestScheme = strtolower(trim((string)($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '')));
    $requestScheme = preg_replace('/\s*,.*$/', '', $requestScheme) ?? $requestScheme;
    if ($requestScheme === '') $requestScheme = hduIsHttps() ? 'https' : 'http';

    return $scheme !== '' && $host !== '' && hash_equals($requestScheme . '://' . $requestHost, $scheme . '://' . $host . $port);
}

function hduSealDeviceId(string $deviceId): string {
    $payload = hduB64u(json_encode(['d' => $deviceId, 'v' => 1], JSON_UNESCAPED_SLASHES));
    $sig = hduB64u(hash_hmac('sha256', $payload, hduSecret(), true));
    return $payload . '.' . $sig;
}

function hduOpenDeviceToken(string $token): ?string {
    $parts = explode('.', $token, 2);
    if (count($parts) !== 2) return null;
    [$payload, $sigEncoded] = $parts;
    $sig = hduB64ud($sigEncoded);
    $expected = hash_hmac('sha256', $payload, hduSecret(), true);
    if (strlen($sig) !== 32 || !hash_equals($expected, $sig)) return null;
    $raw = hduB64ud($payload);
    $data = json_decode($raw, true);
    if (!is_array($data)) return null;
    $deviceId = strtolower(trim((string)($data['d'] ?? '')));
    if (!preg_match('/^[a-f0-9]{32}$/', $deviceId)) return null;
    return $deviceId;
}

function hduSetDeviceCookie(string $deviceId): void {
    setcookie(HDU_COOKIE, hduSealDeviceId($deviceId), [
        'expires' => time() + (86400 * 400),
        'path' => '/',
        'secure' => hduIsHttps(),
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
}

function hduDeviceId(): string {
    $token = trim((string)($_COOKIE[HDU_COOKIE] ?? ''));
    if ($token !== '') {
        $resolved = hduOpenDeviceToken($token);
        if (is_string($resolved) && $resolved !== '') return $resolved;
    }
    $deviceId = bin2hex(random_bytes(16));
    hduSetDeviceCookie($deviceId);
    return $deviceId;
}

function hduMonth(): string {
    return gmdate('Y-m');
}

function hduNextResetIso(): string {
    $first = new DateTimeImmutable('first day of next month 00:00:00', new DateTimeZone('UTC'));
    return $first->format('Y-m-d\TH:i:s\Z');
}

function hduDeviceKey(string $deviceId): string {
    return 'device_' . substr(hash('sha256', $deviceId), 0, 40);
}

function hduStateId(string $deviceId): string {
    return 'device_usage_' . str_replace('-', '', hduMonth()) . '_' . substr(hash('sha256', $deviceId), 0, 32);
}

function hduDefaultState(): array {
    return [
        'month' => hduMonth(),
        'hscu_half_units' => 0,
        'touches' => 0,
        'last_enter_ms' => 0,
        'touch_window_start_ms' => 0,
        'touch_window_count' => 0,
        'recent_event_ids' => [],
        'updated_at_ms' => 0,
    ];
}

function hduNormalizeState(array $state): array {
    $out = hduDefaultState();
    if (($state['month'] ?? '') !== hduMonth()) return $out;

    $out['hscu_half_units'] = max(0, (int)($state['hscu_half_units'] ?? 0));
    $out['touches'] = max(0, (int)($state['touches'] ?? 0));
    $out['last_enter_ms'] = max(0, (int)($state['last_enter_ms'] ?? 0));
    $out['touch_window_start_ms'] = max(0, (int)($state['touch_window_start_ms'] ?? 0));
    $out['touch_window_count'] = max(0, (int)($state['touch_window_count'] ?? 0));
    $recent = $state['recent_event_ids'] ?? [];
    if (!is_array($recent)) $recent = [];
    $out['recent_event_ids'] = array_slice(array_values(array_filter(array_map('strval', $recent))), -HDU_MAX_RECENT_EVENTS);
    $out['updated_at_ms'] = max(0, (int)($state['updated_at_ms'] ?? 0));
    return $out;
}

function hduRows($body): array {
    if (!is_array($body) || $body === []) return [];
    if (array_keys($body) === range(0, count($body) - 1)) return $body;
    return isset($body['id']) ? [$body] : [];
}

function hduCloudLoad(string $deviceId): ?array {
    if (!function_exists('supabaseDbSelect') || !function_exists('supabaseConfig')) return null;
    $cfg = supabaseConfig();
    if (empty($cfg['configured'])) return null;
    $id = hduStateId($deviceId);
    $res = supabaseDbSelect('l8_app_states', 'select=state,updated_at&id=eq.' . rawurlencode($id) . '&limit=1');
    if (empty($res['ok'])) return null;
    $rows = hduRows($res['body'] ?? []);
    if (!$rows) return hduDefaultState();
    $state = $rows[0]['state'] ?? [];
    if (is_string($state)) $state = json_decode($state, true);
    return is_array($state) ? hduNormalizeState($state) : hduDefaultState();
}

function hduLocalDir(): string {
    $dir = __DIR__ . '/data_storage/device_usage';
    if (!is_dir($dir)) @mkdir($dir, 0700, true);
    @chmod($dir, 0700);
    return $dir;
}

function hduLocalPath(string $deviceId): string {
    return hduLocalDir() . '/' . substr(hash('sha256', hduMonth() . '|' . $deviceId), 0, 48) . '.json';
}

function hduLocalLoad(string $deviceId): ?array {
    $path = hduLocalPath($deviceId);
    if (!is_readable($path)) return null;
    $raw = @file_get_contents($path);
    $data = is_string($raw) ? json_decode($raw, true) : null;
    return is_array($data) ? hduNormalizeState($data) : null;
}

function hduLoadState(string $deviceId): array {
    $cloud = hduCloudLoad($deviceId);
    $local = hduLocalLoad($deviceId);
    if (is_array($cloud) && is_array($local)) {
        return ((int)($cloud['updated_at_ms'] ?? 0) >= (int)($local['updated_at_ms'] ?? 0)) ? $cloud : $local;
    }
    if (is_array($cloud)) return $cloud;
    if (is_array($local)) return $local;
    return hduDefaultState();
}

function hduLocalSave(string $deviceId, array $state): bool {
    $path = hduLocalPath($deviceId);
    $tmp = $path . '.' . bin2hex(random_bytes(6)) . '.tmp';
    $payload = json_encode($state, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
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

function hduCloudSave(string $deviceId, array $state): bool {
    if (!function_exists('supabaseDbUpsert') || !function_exists('supabaseConfig')) return false;
    $cfg = supabaseConfig();
    if (empty($cfg['configured'])) return false;
    $updated = gmdate('c');
    $row = [[
        'id' => hduStateId($deviceId),
        'account_key' => hduDeviceKey($deviceId),
        'app_id' => HDU_APP_ID,
        'state' => $state,
        'updated_at' => $updated,
    ]];
    $res = supabaseDbUpsert('l8_app_states', $row, 'id');
    return !empty($res['ok']);
}

function hduSaveState(string $deviceId, array $state): void {
    hduLocalSave($deviceId, $state);
    hduCloudSave($deviceId, $state);
}

function hduEventId(array $body): string {
    $id = trim((string)($body['event_id'] ?? ''));
    if ($id === '' || !preg_match('/^[a-zA-Z0-9._:-]{8,96}$/', $id)) return '';
    return $id;
}

function hduApplyEvent(array $state, string $action, string $eventId): array {
    $nowMs = (int)round(microtime(true) * 1000);
    $recent = $state['recent_event_ids'] ?? [];
    if ($eventId !== '' && in_array($eventId, $recent, true)) return $state;

    if ($action === 'enter') {
        // Suppress accidental duplicate startup requests, while preserving real
        // entries/reloads as separate usage events.
        $last = (int)($state['last_enter_ms'] ?? 0);
        if ($last === 0 || ($nowMs - $last) >= 750) {
            $state['hscu_half_units'] = max(0, (int)($state['hscu_half_units'] ?? 0)) + 1;
            $state['last_enter_ms'] = $nowMs;
        }
    } elseif ($action === 'touch') {
        $windowStart = (int)($state['touch_window_start_ms'] ?? 0);
        $windowCount = (int)($state['touch_window_count'] ?? 0);
        if ($windowStart === 0 || ($nowMs - $windowStart) >= 10000) {
            $windowStart = $nowMs;
            $windowCount = 0;
        }
        if ($windowCount >= 120) {
            hduJson(429, ['ok' => false, 'error' => 'touch_rate_limited']);
        }
        $state['touches'] = max(0, (int)($state['touches'] ?? 0)) + 1;
        $state['touch_window_start_ms'] = $windowStart;
        $state['touch_window_count'] = $windowCount + 1;
    }

    if ($eventId !== '') {
        $recent[] = $eventId;
        $state['recent_event_ids'] = array_slice(array_values(array_unique($recent)), -HDU_MAX_RECENT_EVENTS);
    }
    $state['updated_at_ms'] = $nowMs;
    return hduNormalizeState($state);
}

function hduPayload(array $state): array {
    $hscu = ((int)($state['hscu_half_units'] ?? 0)) / 2;
    $touches = (int)($state['touches'] ?? 0);
    return [
        'ok' => true,
        'month' => hduMonth(),
        'resets_on' => hduNextResetIso(),
        'hscus' => [
            'used' => $hscu,
            'limit' => HDU_HSCU_LIMIT,
            'percent' => min(100, round(($hscu / HDU_HSCU_LIMIT) * 100, 2)),
        ],
        'touches' => [
            'used' => $touches,
            'limit' => HDU_TOUCH_LIMIT,
            'percent' => min(100, round(($touches / HDU_TOUCH_LIMIT) * 100, 2)),
        ],
    ];
}

$method = strtoupper((string)($_SERVER['REQUEST_METHOD'] ?? 'GET'));
if (!in_array($method, ['GET', 'POST'], true)) {
    header('Allow: GET, POST');
    hduJson(405, ['ok' => false, 'error' => 'method_not_allowed']);
}
if (!hduSameOrigin()) hduJson(403, ['ok' => false, 'error' => 'origin_mismatch']);

$deviceId = hduDeviceId();
$state = hduLoadState($deviceId);

if ($method === 'POST') {
    if (strcasecmp((string)($_SERVER['HTTP_X_REQUESTED_WITH'] ?? ''), 'XMLHttpRequest') !== 0) {
        hduJson(403, ['ok' => false, 'error' => 'xhr_required']);
    }
    $raw = file_get_contents('php://input');
    $body = json_decode(is_string($raw) ? $raw : '', true);
    if (!is_array($body)) $body = [];
    $action = strtolower(trim((string)($body['action'] ?? '')));
    if (!in_array($action, ['enter', 'touch'], true)) {
        hduJson(400, ['ok' => false, 'error' => 'invalid_action']);
    }
    $eventId = hduEventId($body);
    $state = hduApplyEvent($state, $action, $eventId);
    hduSaveState($deviceId, $state);
}

hduJson(200, hduPayload($state));
