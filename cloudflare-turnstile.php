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

function cfSanitizeKey($val) {
    if ($val === null || $val === false) return '';
    $val = trim((string)$val);
    // Remover comillas accidentales de Render o .env
    if ((strlen($val) >= 2) && (($val[0] === '"' && substr($val, -1) === '"') || ($val[0] === "'" && substr($val, -1) === "'"))) {
        $val = trim(substr($val, 1, -1));
    }
    return trim($val);
}

function cfTurnstileConfig() {
    // 1. Claves maestras por defecto para Hashcod Codespace
    $siteKey = '0x4AAAAAAEfpecWchE9q2-cs';
    $secretKey = '0x4AAAAAAEfpefehY9pZh507cWEuXnDN04k';

    // 2. Cargar archivo .env si existe
    if (function_exists('loadEnvFile')) {
        loadEnvFile();
    }

    // 3. Secret Files de Render (/etc/secrets/<KEY>)
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

    // 4. Bóveda cifrada AES-256-GCM
    if (function_exists('secretGet')) {
        $vSite = cfSanitizeKey(secretGet('CF_TURNSTILE_SITE_KEY', ''));
        if ($vSite !== '') $siteKey = $vSite;
        $vSec = cfSanitizeKey(secretGet('CF_TURNSTILE_SECRET_KEY', ''));
        if ($vSec !== '') $secretKey = $vSec;
    }

    // 5. Variables de entorno (.env / getenv)
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
        'enabled' => !empty($siteKey) && !empty($secretKey),
        'site_key' => $siteKey,
        'secret_key' => $secretKey,
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
 *
 * @param string $token Token obtenido en el frontend (cf-turnstile-response)
 * @param string|null $remoteIp Dirección IP del cliente (opcional)
 * @return array Resultado con 'ok', 'success', 'error_codes', etc.
 */
function cfTurnstileVerify($token, $remoteIp = null) {
    $token = trim((string)$token);
    if ($token === '') {
        return [
            'ok' => false,
            'success' => false,
            'error' => 'Token de Cloudflare Turnstile no suministrado'
        ];
    }

    $cfg = cfTurnstileConfig();
    if (!$cfg['enabled']) {
        return [
            'ok' => true,
            'success' => true,
            'bypassed' => true,
            'message' => 'Turnstile no configurado o deshabilitado'
        ];
    }

    $postData = [
        'secret' => $cfg['secret_key'],
        'response' => $token
    ];

    // Solo enviar remoteip si es una IP pública válida (evita errores con proxies locales o Render)
    $ip = $remoteIp ?: ($_SERVER['REMOTE_ADDR'] ?? '');
    if ($ip !== '' && filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
        $postData['remoteip'] = $ip;
    }

    $url = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

    // 1) Intentar con cURL
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

    // 2) Fallback con file_get_contents + stream_context
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

/**
 * Dispatcher para endpoints de Cloudflare API / Turnstile
 */
function cfTurnstileHandleApi($uri) {
    if (strpos($uri, '/api/cloudflare') !== 0) {
        return false;
    }

    header('Content-Type: application/json; charset=utf-8');
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

    // 1. Configuración pública del widget (Site Key)
    if ($uri === '/api/cloudflare/turnstile/config' || $uri === '/api/cloudflare/config') {
        $cfg = cfTurnstileConfig();
        echo json_encode([
            'ok' => true,
            'enabled' => $cfg['enabled'],
            'site_key' => $cfg['site_key'],
            'service' => 'Cloudflare Turnstile',
            'status' => 'active'
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
        return true;
    }

    // 2. Estado general de Cloudflare (Turnstile + Durable Objects)
    if ($uri === '/api/cloudflare/status' || $uri === '/api/cloudflare') {
        $cfg = cfTurnstileConfig();
        $doConfigured = function_exists('doStorageDir') && is_dir(doStorageDir());
        echo json_encode([
            'ok' => true,
            'service' => 'Cloudflare Ecosystem',
            'turnstile' => [
                'configured' => $cfg['enabled'],
                'site_key' => $cfg['site_key'],
                'mode' => 'managed'
            ],
            'durable_objects' => [
                'enabled' => $doConfigured,
                'storage' => 'data_storage/durable_objects'
            ],
            'timestamp' => date('c')
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
        return true;
    }

    // 3. Verificación manual de token Turnstile
    if ($uri === '/api/cloudflare/turnstile/verify' && $method === 'POST') {
        $raw = file_get_contents('php://input');
        $data = json_decode($raw, true) ?: [];
        $token = $data['token'] ?? ($data['cf-turnstile-response'] ?? ($data['cf_turnstile_response'] ?? ''));
        $res = cfTurnstileVerify($token);
        echo json_encode($res, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
        return true;
    }

    return false;
}
