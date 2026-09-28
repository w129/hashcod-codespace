<?php
declare(strict_types=1);

require_once __DIR__ . '/secrets.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate');
header('Pragma: no-cache');
header('X-Content-Type-Options: nosniff');

function entryProductJson(int $status, array $payload): never {
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function entryProductSameOrigin(): bool {
    $host = strtolower(trim((string)($_SERVER['HTTP_HOST'] ?? '')));
    $origin = trim((string)($_SERVER['HTTP_ORIGIN'] ?? ''));
    if ($origin === '') {
        $site = strtolower(trim((string)($_SERVER['HTTP_SEC_FETCH_SITE'] ?? '')));
        return $site === '' || in_array($site, ['same-origin', 'same-site', 'none'], true);
    }
    $parts = @parse_url($origin);
    if (!is_array($parts)) return false;
    $originHost = strtolower(trim((string)($parts['host'] ?? '')));
    $originPort = isset($parts['port']) ? ':' . (int)$parts['port'] : '';
    return $originHost !== '' && ($originHost . $originPort) === $host;
}

function entryProductRateFile(): string {
    $ip = trim((string)($_SERVER['REMOTE_ADDR'] ?? 'unknown'));
    $ua = trim((string)($_SERVER['HTTP_USER_AGENT'] ?? 'unknown'));
    $key = hash('sha256', $ip . '|' . $ua);
    $dir = sys_get_temp_dir() . '/hashcod-entry-product-2fa';
    if (!is_dir($dir)) @mkdir($dir, 0700, true);
    return $dir . '/' . $key . '.json';
}

function entryProductRateState(): array {
    $file = entryProductRateFile();
    $now = time();
    $state = ['window' => $now, 'attempts' => 0];
    if (is_readable($file)) {
        $raw = json_decode((string)@file_get_contents($file), true);
        if (is_array($raw)) {
            $state['window'] = (int)($raw['window'] ?? $now);
            $state['attempts'] = (int)($raw['attempts'] ?? 0);
        }
    }
    if (($now - $state['window']) >= 300) {
        $state = ['window' => $now, 'attempts' => 0];
    }
    return $state;
}

function entryProductRateWrite(array $state): void {
    @file_put_contents(entryProductRateFile(), json_encode($state), LOCK_EX);
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    entryProductJson(405, ['ok' => false, 'error' => 'method_not_allowed']);
}
if (!entryProductSameOrigin()) {
    entryProductJson(403, ['ok' => false, 'error' => 'origin_mismatch']);
}

$state = entryProductRateState();
if ($state['attempts'] >= 6) {
    $retry = max(1, 300 - (time() - (int)$state['window']));
    header('Retry-After: ' . $retry);
    entryProductJson(429, ['ok' => false, 'error' => 'too_many_attempts', 'retry_after' => $retry]);
}

$raw = file_get_contents('php://input');
$body = json_decode(is_string($raw) ? $raw : '', true);
$code = is_array($body) ? preg_replace('/\D+/', '', (string)($body['code'] ?? '')) : '';
if (!is_string($code) || strlen($code) !== 6) {
    entryProductJson(400, ['ok' => false, 'error' => 'invalid_code_format']);
}

$expected = trim((string)secretGet('HASHCOD_ENTRY_PRODUCT_EDIT_CODE', '281930'));
if (!preg_match('/^\d{6}$/', $expected)) {
    entryProductJson(503, ['ok' => false, 'error' => 'editor_code_not_configured']);
}

if (!hash_equals($expected, $code)) {
    $state['attempts']++;
    entryProductRateWrite($state);
    entryProductJson(401, ['ok' => false, 'error' => 'invalid_code', 'attempts_remaining' => max(0, 6 - $state['attempts'])]);
}

@unlink(entryProductRateFile());
entryProductJson(200, ['ok' => true, 'verified' => true]);
