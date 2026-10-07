<?php
declare(strict_types=1);

if (!function_exists('secretGet')) {
    require_once __DIR__ . '/secrets.php';
}

require_once __DIR__ . '/mldsa-access.php';
if (!function_exists('securityRateAllowSliding')) require_once __DIR__ . '/security.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, max-age=0');
header('Pragma: no-cache');

function hashcodCouponJson(array $payload, int $status = 200): void {
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function hashcodCouponSigningKey(): string {
    foreach (['L8_COUPON_SIGNING_KEY', 'L8_AUTH_PEPPER', 'L8_VAULT_MASTER_KEY', 'SUPABASE_SECRET_KEY', 'L8_ACCESS_GATE_COOKIE_SECRET'] as $name) {
        $raw = trim((string) secretGet($name, ''));
        if ($raw !== '') {
            return hash_hmac('sha256', 'hashcod|coupon-validation|v1', $raw, true);
        }
    }
    // Domain-separated derivation from the existing durable private vault key.
    $master = secretsVaultMasterKey();
    $stored = @file_get_contents(secretsVaultDir() . '/.vault_master');
    $bytes = is_string($stored) && preg_match('/^[a-f0-9]{64}$/iD', trim($stored)) ? hex2bin(trim($stored)) : $stored;
    if (!is_string($bytes) || !hash_equals($master, $bytes)) return '';
    return hash_hmac('sha256', 'hashcod|coupon-validation|v1', $master, true);
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

    if ($expiresAt <= time()) {
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

$site = strtolower((string)($_SERVER['HTTP_SEC_FETCH_SITE'] ?? ''));
if (($site !== '' && !in_array($site, ['same-origin', 'same-site'], true))
    || (isset($_SERVER['HTTP_ORIGIN']) && !mldsaOriginAllowed())) {
    hashcodCouponJson(['ok' => false, 'error' => 'Solicitud no permitida.', 'code' => 'origin_denied'], 403);
}
$rate = securityRateAllowSliding('hashcod_coupon_v1', 60, 60);
if (empty($rate['allowed'])) hashcodCouponJson(['ok' => false, 'error' => 'Espera un momento y reintenta.', 'code' => 'rate_limited'], 429);
$key = hashcodCouponSigningKey();
if ($key === '') {
    hashcodCouponJson([
        'ok' => false,
        'error' => 'No se pudo preparar el cupón.',
        'code' => 'coupon_signing_key_unavailable',
    ], 503);
}

if (session_status() !== PHP_SESSION_ACTIVE) {
    @session_start([
        'use_strict_mode' => 1,
        'cookie_httponly' => 1,
        'cookie_secure' => mldsaHttps() ? 1 : 0,
        'cookie_samesite' => 'Lax',
    ]);
}

if (session_status() !== PHP_SESSION_ACTIVE) hashcodCouponJson(['ok' => false, 'error' => 'No se pudo conservar el cupón. Reintenta.', 'code' => 'coupon_session_unavailable'], 503);

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
    if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0) > 2048) hashcodCouponJson(['ok' => false, 'code' => 'body_too_large'], 413);
    $raw = file_get_contents('php://input', false, null, 0, 2049);
    if (strlen((string)$raw) > 2048) hashcodCouponJson(['ok' => false, 'code' => 'body_too_large'], 413);
    $body = json_decode(is_string($raw) ? $raw : '', true);
    if (!is_array($body)) {
        hashcodCouponJson(['ok' => false, 'error' => 'Datos incorrectos.', 'code' => 'invalid_json'], 400);
    }

    $postAction = is_string($body['action'] ?? 'validate') ? trim($body['action'] ?? 'validate') : '';
    if ($postAction !== 'validate') {
        hashcodCouponJson(['ok' => false, 'error' => 'Acción no permitida.', 'code' => 'unsupported_action'], 400);
    }

    if (!is_string($body['code'] ?? null) || strlen($body['code']) > 100) hashcodCouponJson(['ok' => false, 'code' => 'invalid_code'], 400);
    $code = $body['code'];
    $result = hashcodCouponValidate($code, $key);
    hashcodCouponJson([
        'ok' => true,
        'coupon' => $result,
    ], !empty($result['valid']) ? 200 : 422);
}

header('Allow: GET, POST');
hashcodCouponJson(['ok' => false, 'error' => 'Método no permitido.', 'code' => 'method_not_allowed'], 405);
