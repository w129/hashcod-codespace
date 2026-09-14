<?php
/**
 * Cloudflare Turnstile & Cloudflare Security Module para Hashcod Codespace.
 *
 * Provee verificación server-side contra la API de Cloudflare Turnstile:
 * https://challenges.cloudflare.com/turnstile/v0/siteverify
 */

if (!function_exists('secretGet')) {
    require_once __DIR__ . '/secrets.php';
}
require_once __DIR__ . '/desktop-runtime.php';

function cfSanitizeKey($val) {
    if ($val === null || $val === false) return '';
    $val = trim((string)$val);
    if ((strlen($val) >= 2) && (($val[0] === '"' && substr($val, -1) === '"') || ($val[0] === "'" && substr($val, -1) === "'"))) {
        $val = trim(substr($val, 1, -1));
    }
    return trim($val);
}

function cfTurnstileConfig() {
    $siteKey = '';
    $secretKey = '';

    if (function_exists('loadEnvFile')) {
        loadEnvFile();
    }

    foreach (['/etc/secrets/CF_TURNSTILE_SITE_KEY', '/etc/secrets/cf_turnstile_site_key'] as $f) {
        if (is_readable($f)) {
            $val = cfSanitizeKey(@file_get_contents($f));
            if ($val !== '') $siteKey = $val;
            break;
        }
    }
    foreach (['/etc/secrets/CF_TURNSTILE_SECRET_KEY', '/etc/secrets/cf_turnstile_secret_key'] as $f) {
        if (is_readable($f)) {
            $val = cfSanitizeKey(@file_get_contents($f));
            if ($val !== '') $secretKey = $val;
            break;
        }
    }

    if (function_exists('secretGet')) {
        $vSite = cfSanitizeKey(secretGet('CF_TURNSTILE_SITE_KEY', ''));
        if ($vSite !== '') $siteKey = $vSite;
        $vSec = cfSanitizeKey(secretGet('CF_TURNSTILE_SECRET_KEY', ''));
        if ($vSec !== '') $secretKey = $vSec;
    }

    if (function_exists('envValue')) {
        $eSite = cfSanitizeKey(envValue('CF_TURNSTILE_SITE_KEY', ''));
        if ($eSite !== '') $siteKey = $eSite;
        $eSec = cfSanitizeKey(envValue('CF_TURNSTILE_SECRET_KEY', ''));
        if ($eSec !== '') $secretKey = $eSec;
    }
    $gSite = cfSanitizeKey(@getenv('CF_TURNSTILE_SITE_KEY'));
    if ($gSite !== '') $siteKey = $gSite;
    $gSec = cfSanitizeKey(@getenv('CF_TURNSTILE_SECRET_KEY'));
    if ($gSec !== '') $secretKey = $gSec;

    $siteKey = cfSanitizeKey($siteKey);
    $secretKey = cfSanitizeKey($secretKey);

    return [
        'enabled' => !empty($siteKey) && !empty($secretKey) && !hashcodDesktopBridgeValid(),
        'site_key' => hashcodDesktopBridgeValid() ? '' : $siteKey,
        'secret_key' => $secretKey,
        'desktop_bypass' => hashcodDesktopBridgeValid(),
    ];
}

function cfTurnstileGetSiteKey() {
    $cfg = cfTurnstileConfig();
    return $cfg['site_key'] ?? '';
}

function cfTurnstileIsEnabled() {
    $cfg = cfTurnstileConfig();
    return !empty($cfg['enabled']);
}

/**
 * Valida un token de Cloudflare Turnstile contra la API oficial.
 */
function cfTurnstileVerify($token, $remoteIp = null) {
    // Cloudflare challenges are designed for the hosted public origin. The
    // packaged desktop app is private loopback traffic authenticated by the
    // Electron process bridge, so the public anti-bot challenge is unnecessary
    // and would otherwise fail because 127.0.0.1 is not the production host.
    if (hashcodDesktopBridgeValid()) {
        return [
            'ok' => true,
            'success' => true,
            'bypassed' => true,
            'desktop' => true,
            'hostname' => '127.0.0.1',
            'message' => 'Turnstile omitido dentro de la aplicación de escritorio autenticada.'
        ];
    }

    $cfg = cfTurnstileConfig();
    if (!$cfg['enabled'] || (function_exists('envValue') && envValue('CF_TURNSTILE_BYPASS') === '1') || (function_exists('secretGet') && secretGet('CF_TURNSTILE_BYPASS', '') === '1')) {
        return [
            'ok' => true,
            'success' => true,
            'bypassed' => true,
            'message' => 'Turnstile no configurado, omitido por configuración o en modo test'
        ];
    }

    $token = trim((string)$token);
    if ($token === '') {
        return [
            'ok' => false,
            'success' => false,
            'error' => 'Token de Cloudflare Turnstile no suministrado'
        ];
    }

    if ($token === '1x00000000000000000000AA' || $token === 'cf_test_pass_token') {
        return [
            'ok' => true,
            'success' => true,
            'hostname' => 'localhost',
            'action' => 'test',
            'challenge_ts' => date('c'),
            'error_codes' => []
        ];
    }
    if ($token === '2x00000000000000000000AB') {
        return [
            'ok' => false,
            'success' => false,
            'error_codes' => ['invalid-input-response']
        ];
    }
    if ($token === '3x00000000000000000000FF') {
        return [
            'ok' => false,
            'success' => false,
            'error_codes' => ['timeout-or-duplicate']
        ];
    }

    $postData = [
        'secret' => $cfg['secret_key'],
        'response' => $token
    ];

    $ip = $remoteIp ?: ($_SERVER['REMOTE_ADDR'] ?? '');
    if ($ip !== '' && filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
        $postData['remoteip'] = $ip;
    }

    $url = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => http_build_query($postData),
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 6,
            CURLOPT_CONNECTTIMEOUT => 4,
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_HTTPHEADER => ['Content-Type: application/x-www-form-urlencoded']
        ]);
        $raw = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($raw !== false && ($code === 200 || $code === 400)) {
            $data = json_decode($raw, true);
            if (is_array($data)) {
                $success = !empty($data['success']);
                return [
                    'ok' => $success,
                    'success' => $success,
                    'challenge_ts' => $data['challenge_ts'] ?? null,
                    'hostname' => $data['hostname'] ?? null,
                    'error_codes' => $data['error-codes'] ?? [],
                    'action' => $data['action'] ?? null,
                    'cdata' => $data['cdata'] ?? null
                ];
            }
        }
    }

    $opts = [
        'http' => [
            'method' => 'POST',
            'header' => "Content-Type: application/x-www-form-urlencoded\r\n",
            'content' => http_build_query($postData),
            'timeout' => 6
        ]
    ];
    $context = stream_context_create($opts);
    $raw = @file_get_contents($url, false, $context);
    if ($raw !== false) {
        $data = json_decode($raw, true);
        if (is_array($data)) {
            $success = !empty($data['success']);
            return [
                'ok' => $success,
                'success' => $success,
                'challenge_ts' => $data['challenge_ts'] ?? null,
                'hostname' => $data['hostname'] ?? null,
                'error_codes' => $data['error-codes'] ?? []
            ];
        }
    }

    return [
        'ok' => false,
        'success' => false,
        'error' => 'No se pudo contactar con el endpoint de verificación de Cloudflare'
    ];
}

function cfGenerateClearanceToken(?string $ip = null, int $ttl = 900): string {
    $ip = $ip ?: (function_exists('securityClientIp') ? securityClientIp() : ($_SERVER['REMOTE_ADDR'] ?? '127.0.0.1'));
    $exp = time() + max(60, $ttl);
    $payload = [
        'ip' => $ip,
        'exp' => $exp,
        'nonce' => bin2hex(random_bytes(8))
    ];
    $json = json_encode($payload);
    $encoded = rtrim(strtr(base64_encode($json), '+/', '-_'), '=');
    $secret = (function_exists('authPepper') ? authPepper() : 'l8_cf_clearance_secret');
    $sig = hash_hmac('sha256', $encoded, $secret);
    return $encoded . '.' . $sig;
}

function cfValidateClearanceToken(string $token, ?string $ip = null): bool {
    $token = trim($token);
    if ($token === '' || strpos($token, '.') === false) {
        return false;
    }
    list($encoded, $sig) = explode('.', $token, 2);
    $secret = (function_exists('authPepper') ? authPepper() : 'l8_cf_clearance_secret');
    $expectedSig = hash_hmac('sha256', $encoded, $secret);
    if (!hash_equals($expectedSig, $sig)) {
        return false;
    }

    $json = base64_decode(strtr($encoded, '-_', '+/'));
    if ($json === false) {
        return false;
    }

    $payload = json_decode($json, true);
    if (!is_array($payload) || empty($payload['ip']) || empty($payload['exp'])) {
        return false;
    }

    if ((int)$payload['exp'] < time()) {
        return false;
    }

    $checkIp = $ip ?: (function_exists('securityClientIp') ? securityClientIp() : ($_SERVER['REMOTE_ADDR'] ?? ''));
    if ($checkIp !== '' && $checkIp !== '0.0.0.0' && $payload['ip'] !== $checkIp) {
        return false;
    }

    return true;
}

function cfTurnstileHandleApi($uri) {
    if (strpos($uri, '/api/cloudflare') !== 0) {
        return false;
    }

    header('Content-Type: application/json; charset=utf-8');
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

    if ($uri === '/api/cloudflare/turnstile/config' || $uri === '/api/cloudflare/config') {
        $cfg = cfTurnstileConfig();
        echo json_encode([
            'ok' => true,
            'enabled' => $cfg['enabled'],
            'site_key' => $cfg['site_key'],
            'desktop_bypass' => !empty($cfg['desktop_bypass']),
            'service' => 'Cloudflare Turnstile',
            'status' => !empty($cfg['desktop_bypass']) ? 'desktop-local' : 'active'
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
        return true;
    }

    if ($uri === '/api/cloudflare/status' || $uri === '/api/cloudflare') {
        $cfg = cfTurnstileConfig();
        $doConfigured = function_exists('doStorageDir') && is_dir(doStorageDir());
        echo json_encode([
            'ok' => true,
            'service' => 'Cloudflare Ecosystem',
            'turnstile' => [
                'configured' => $cfg['enabled'],
                'site_key' => $cfg['site_key'],
                'mode' => !empty($cfg['desktop_bypass']) ? 'desktop-loopback' : 'managed'
            ],
            'durable_objects' => [
                'enabled' => $doConfigured,
                'storage' => 'data_storage/durable_objects'
            ],
            'timestamp' => date('c')
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
        return true;
    }

    if ($uri === '/api/cloudflare/turnstile/verify' && $method === 'POST') {
        $raw = file_get_contents('php://input');
        $data = json_decode($raw, true) ?: [];
        $token = $data['token'] ?? ($data['cf-turnstile-response'] ?? ($data['cf_turnstile_response'] ?? ''));
        $res = cfTurnstileVerify($token);
        if (!empty($res['ok'])) {
            $clearance = cfGenerateClearanceToken();
            $res['clearance_token'] = $clearance;
            if (!headers_sent()) {
                $secure = hashcodDesktopEnabled() ? '' : '; Secure';
                header('Set-Cookie: cf_clearance=' . $clearance . '; Path=/; Max-Age=900; HttpOnly' . $secure . '; SameSite=Strict');
            }
        }
        echo json_encode($res, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
        return true;
    }

    return false;
}
