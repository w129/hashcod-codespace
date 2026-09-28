<?php
declare(strict_types=1);

if (!function_exists('secretGet')) {
    require_once __DIR__ . '/secrets.php';
}

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, max-age=0');
header('Pragma: no-cache');

function hashcodCouponJson(array $payload, int $status = 200): void {
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function hashcodCouponSigningKey(): string {
    foreach (['L8_AUTH_PEPPER', 'L8_VAULT_MASTER_KEY', 'SUPABASE_SECRET_KEY'] as $name) {
        $raw = trim((string) secretGet($name, ''));
        if ($raw !== '') {
            return hash_hmac('sha256', 'hashcod|coupon-validation|v1', $raw, true);
        }
    }
    return '';
}

function hashcodCouponRandomToken(int $length = 8): string {
    $alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    $out = '';
    $max = strlen($alphabet) - 1;
    for ($i = 0; $i < $length; $i++) {
        $out .= $alphabet[random_int(0, $max)];
    }
    return $out;
}

function hashcodCouponSignature(string $expiryToken, string $nonce, string $key): string {
    $payload = 'HC20|' . $expiryToken . '|' . $nonce;
    return strtoupper(substr(hash_hmac('sha256', $payload, $key), 0, 12));
}

function hashcodCouponGenerate(string $key): array {
    $expiresAt = time() + (30 * 86400);
    $expiryToken = strtoupper(base_convert((string) $expiresAt, 10, 36));
    $nonce = hashcodCouponRandomToken(8);
    $signature = hashcodCouponSignature($expiryToken, $nonce, $key);
    $code = 'HC20-' . $expiryToken . '-' . $nonce . '-' . $signature;

    return [
        'code' => $code,
        'campaign' => 'HASHCOD20',
        'discount_percent' => 20,
        'expires_at' => gmdate('c', $expiresAt),
        'expires_ts' => $expiresAt,
    ];
}

function hashcodCouponValidate(string $rawCode, string $key): array {
    $code = strtoupper(trim($rawCode));
    if (!preg_match('/^HC20-([0-9A-Z]{6,8})-([A-Z2-9]{8})-([A-F0-9]{12})$/', $code, $m)) {
        return ['valid' => false, 'reason' => 'invalid_format'];
    }

    $expiryToken = $m[1];
    $nonce = $m[2];
    $provided = $m[3];
    $expiresAt = (int) base_convert(strtolower($expiryToken), 36, 10);

    if ($expiresAt <= 0) {
        return ['valid' => false, 'reason' => 'invalid_expiry'];
    }

    $expected = hashcodCouponSignature($expiryToken, $nonce, $key);
    if (!hash_equals($expected, $provided)) {
        return ['valid' => false, 'reason' => 'invalid_signature'];
    }

    if ($expiresAt < time()) {
        return [
            'valid' => false,
            'reason' => 'expired',
            'expires_at' => gmdate('c', $expiresAt),
        ];
    }

    return [
        'valid' => true,
        'reason' => 'valid',
        'code' => $code,
        'campaign' => 'HASHCOD20',
        'discount_percent' => 20,
        'expires_at' => gmdate('c', $expiresAt),
    ];
}

$key = hashcodCouponSigningKey();
if ($key === '') {
    hashcodCouponJson([
        'ok' => false,
        'error' => 'Coupon validation service is not configured.',
        'code' => 'coupon_signing_key_unavailable',
    ], 503);
}

if (session_status() !== PHP_SESSION_ACTIVE) {
    @session_start([
        'use_strict_mode' => 1,
        'cookie_httponly' => 1,
        'cookie_samesite' => 'Lax',
    ]);
}

$method = strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET'));
$action = trim((string) ($_GET['action'] ?? ''));

if ($method === 'GET' && ($action === '' || $action === 'issue')) {
    $existing = $_SESSION['hashcod_coupon_v1'] ?? null;
    if (is_array($existing) && !empty($existing['code'])) {
        $check = hashcodCouponValidate((string) $existing['code'], $key);
        if (!empty($check['valid'])) {
            hashcodCouponJson([
                'ok' => true,
                'coupon' => $check,
                'reused' => true,
            ]);
        }
    }

    $coupon = hashcodCouponGenerate($key);
    $_SESSION['hashcod_coupon_v1'] = [
        'code' => $coupon['code'],
        'issued_at' => time(),
        'expires_ts' => $coupon['expires_ts'],
    ];

    unset($coupon['expires_ts']);
    hashcodCouponJson([
        'ok' => true,
        'coupon' => array_merge(['valid' => true], $coupon),
        'reused' => false,
    ]);
}

if ($method === 'POST') {
    $raw = file_get_contents('php://input');
    $body = json_decode(is_string($raw) ? $raw : '', true);
    if (!is_array($body)) {
        hashcodCouponJson(['ok' => false, 'error' => 'Invalid JSON body.', 'code' => 'invalid_json'], 400);
    }

    $postAction = trim((string) ($body['action'] ?? 'validate'));
    if ($postAction !== 'validate') {
        hashcodCouponJson(['ok' => false, 'error' => 'Unsupported coupon action.', 'code' => 'unsupported_action'], 400);
    }

    $code = (string) ($body['code'] ?? '');
    $result = hashcodCouponValidate($code, $key);
    hashcodCouponJson([
        'ok' => true,
        'coupon' => $result,
    ], !empty($result['valid']) ? 200 : 422);
}

header('Allow: GET, POST');
hashcodCouponJson(['ok' => false, 'error' => 'Method not allowed.', 'code' => 'method_not_allowed'], 405);
