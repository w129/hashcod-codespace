<?php
/**
 * Endurecimiento de superficie de ataque — l8 codespace.
 * Rate limit, IP limiting, CORS, headers, path deny, input sanity, auth gates.
 */

if (!function_exists('envValue')) {
    require_once __DIR__ . '/supabase.php';
}
if (!function_exists('secretGet')) {
    require_once __DIR__ . '/secrets.php';
}
require_once __DIR__ . '/cache.php';
if (!function_exists('cfTurnstileConfig')) {
    require_once __DIR__ . '/cloudflare-turnstile.php';
}
if (!function_exists('threatIntelCheckIp')) {
    require_once __DIR__ . '/threat-intel.php';
}
if (!function_exists('circuitBreakerGetStatus')) {
    require_once __DIR__ . '/circuit-breaker.php';
}
if (!function_exists('resilientProxyFetch')) {
    require_once __DIR__ . '/resilient-proxy.php';
}
if (!function_exists('vulnerabilityAuditManifest')) {
    require_once __DIR__ . '/vulnerability-auditor.php';
}

/** Headers de seguridad + ocultar fingerprint de PHP. */
function securityCspNonce(): string {
    static $nonce = null;
    if ($nonce === null) {
        $nonce = rtrim(strtr(base64_encode(random_bytes(18)), '+/', '-_'), '=');
    }
    return $nonce;
}

function securityApplyHeaders() {
    static $done = false;
    if ($done) return;
    $done = true;

    @ini_set('expose_php', '0');
    @ini_set('display_errors', '0');
    @ini_set('display_startup_errors', '0');
    @ini_set('log_errors', '1');
    header_remove('X-Powered-By');

    if (!headers_sent()) {
        header('X-Content-Type-Options: nosniff');
        header('X-Frame-Options: DENY');
        header('Referrer-Policy: strict-origin-when-cross-origin');
        header('Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()');
        header('Cross-Origin-Opener-Policy: same-origin');
        header('Cross-Origin-Resource-Policy: same-origin');
        header('X-DNS-Prefetch-Control: off');
        header('X-Permitted-Cross-Domain-Policies: none');
        $https = securityIsHttps();
        if ($https) {
            header('Strict-Transport-Security: max-age=31536000; includeSubDomains; preload');
        }
        header(
            "Content-Security-Policy: default-src 'self'; " .
            "base-uri 'self'; " .
            "frame-ancestors 'none'; " .
            "object-src 'none'; " .
            "form-action 'self'; " .
            "img-src 'self' data: blob: https:; " .
            "font-src 'self' data: https://fonts.gstatic.com; " .
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " .
            "script-src 'self' 'nonce-" . securityCspNonce() . "' https://challenges.cloudflare.com; " .
            "connect-src 'self' https: wss: https://challenges.cloudflare.com; " .
            "frame-src 'self' https://challenges.cloudflare.com; " .
            "worker-src 'self' blob:; " .
            "media-src 'self' blob:;"
        );
        header('Server: l8');
    }
}

function securityIsHttps() {
    return (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && strtolower((string)$_SERVER['HTTP_X_FORWARDED_PROTO']) === 'https')
        || (isset($_SERVER['SERVER_PORT']) && (int)$_SERVER['SERVER_PORT'] === 443);
}

/**
 * CORS bien configurado:
 * - Por defecto same-origin (sin ACAO *).
 * - Allowlist exacta vía L8_CORS_ORIGINS.
 * - Preflight refleja solo orígenes permitidos + headers necesarios.
 */
function securityApplyCors() {
    $originsRaw = function_exists('secretGet')
        ? secretGet('L8_CORS_ORIGINS', '')
        : (function_exists('envValue') ? envValue('L8_CORS_ORIGINS', '') : '');
    $allow = [];
    if ($originsRaw !== '') {
        foreach (explode(',', $originsRaw) as $o) {
            $o = trim($o);
            if ($o !== '' && preg_match('#^https?://[a-z0-9.-]+(:\d+)?$#i', $o)) {
                $allow[] = rtrim($o, '/');
            }
        }
    }
    $reqOrigin = isset($_SERVER['HTTP_ORIGIN']) ? rtrim((string)$_SERVER['HTTP_ORIGIN'], '/') : '';
    $matched = ($allow !== [] && $reqOrigin !== '' && in_array($reqOrigin, $allow, true));

    if ($matched) {
        header('Access-Control-Allow-Origin: ' . $reqOrigin);
        header('Vary: Origin');
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Expose-Headers: Retry-After, X-L8-Request-Id');
    }
    // Sin allowlist / sin match: no emitir ACAO (navegador = same-origin).
    header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Authorization, Content-Type, X-L8-Tokens-Guest, X-Requested-With, X-L8-CSRF, X-L8-Admin');
    header('Access-Control-Max-Age: 600');
}

/**
 * Comprueba si una dirección IP pertenece a un bloque CIDR (IPv4 o IPv6).
 */
function securityIpInCidr(string $ip, string $cidr): bool {
    $ip = trim($ip);
    $cidr = trim($cidr);
    if (strpos($cidr, '/') === false) {
        return $ip === $cidr;
    }
    list($subnet, $bits) = explode('/', $cidr, 2);
    $bits = (int)$bits;

    // IPv4
    if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4) && filter_var($subnet, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
        if ($bits < 0 || $bits > 32) return false;
        $ipLong = ip2long($ip);
        $subnetLong = ip2long($subnet);
        if ($ipLong === false || $subnetLong === false) return false;
        $mask = $bits === 0 ? 0 : (~((1 << (32 - $bits)) - 1));
        return ($ipLong & $mask) === ($subnetLong & $mask);
    }

    // IPv6
    if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6) && filter_var($subnet, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6)) {
        if ($bits < 0 || $bits > 128) return false;
        $ipBin = inet_pton($ip);
        $subnetBin = inet_pton($subnet);
        if ($ipBin === false || $subnetBin === false) return false;
        $bytes = (int)($bits / 8);
        $remainderBits = $bits % 8;
        if ($bytes > 0) {
            if (substr($ipBin, 0, $bytes) !== substr($subnetBin, 0, $bytes)) {
                return false;
            }
        }
        if ($remainderBits > 0) {
            $mask = 0xFF << (8 - $remainderBits);
            $ipByte = ord($ipBin[$bytes]);
            $subnetByte = ord($subnetBin[$bytes]);
            if (($ipByte & $mask) !== ($subnetByte & $mask)) {
                return false;
            }
        }
        return true;
    }

    return false;
}

function securityIsTrustedProxy(string $ip): bool {
    static $trustedCidrs = [
        '127.0.0.0/8',
        '10.0.0.0/8',
        '172.16.0.0/12',
        '192.168.0.0/16',
        '169.254.0.0/16',
        '::1/128',
        'fc00::/7',
        'fe80::/10',
        '173.245.48.0/20',
        '103.21.244.0/22',
        '103.22.200.0/22',
        '103.31.4.0/22',
        '141.101.64.0/18',
        '108.162.192.0/18',
        '190.93.240.0/20',
        '188.114.96.0/20',
        '197.234.240.0/22',
        '198.41.128.0/17',
        '162.158.0.0/15',
        '104.16.0.0/13',
        '104.24.0.0/14',
        '172.64.0.0/13',
        '131.0.72.0/22',
        '2400:cb00::/32',
        '2606:4700::/32',
        '2803:f800::/32',
        '2405:b500::/32',
        '2405:8100::/32',
        '2a06:98c0::/29',
        '2c0f:f248::/32'
    ];

    foreach ($trustedCidrs as $cidr) {
        if (securityIpInCidr($ip, $cidr)) {
            return true;
        }
    }
    return false;
}

/**
 * IP del cliente con validación estricta de proxy confiable (anti-spoofing).
 */
function securityClientIp() {
    $remoteAddr = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
    $remoteAddr = trim((string)$remoteAddr);

    $trust = strtolower((string) (
        function_exists('secretGet') ? secretGet('L8_TRUST_PROXY', '1') : '1'
    ));
    $trustConfigured = !in_array($trust, ['0', 'false', 'no', 'off'], true);

    $candidates = [];
    if ($trustConfigured && securityIsTrustedProxy($remoteAddr)) {
        if (!empty($_SERVER['HTTP_CF_CONNECTING_IP'])) {
            $candidates[] = $_SERVER['HTTP_CF_CONNECTING_IP'];
        }
        if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
            $parts = explode(',', (string)$_SERVER['HTTP_X_FORWARDED_FOR']);
            if (!empty($parts[0])) $candidates[] = trim($parts[0]);
        }
        if (!empty($_SERVER['HTTP_X_REAL_IP'])) {
            $candidates[] = $_SERVER['HTTP_X_REAL_IP'];
        }
    }
    if ($remoteAddr !== '') {
        $candidates[] = $remoteAddr;
    }

    foreach ($candidates as $ip) {
        $ip = trim((string)$ip);
        if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
            return $ip;
        }
        if (filter_var($ip, FILTER_VALIDATE_IP)) {
            return $ip;
        }
    }
    return '127.0.0.1';
}

function securityIsScannerUa($ua) {
    $ua = strtolower((string)$ua);
    if ($ua === '') return false;
    $needles = [
        'sqlmap', 'nikto', 'nmap', 'masscan', 'zgrab', 'dirbuster', 'gobuster',
        'wfuzz', 'ffuf', 'acunetix', 'nessus', 'openvas', 'burpsuite', 'burp ',
        'w3af', 'havij', 'appscan', 'qualys', 'whatweb', 'wpscan', 'nuclei',
        'httpx', 'jaeles', 'feroxbuster', 'dirsearch',
        'libwww-perl', 'scrapy',
        'scanner', 'vulnerability', 'security.scanner', 'pentest'
    ];
    foreach ($needles as $n) {
        if (strpos($ua, $n) !== false) return true;
    }
    return false;
}

function securityRateDir() {
    $dir = __DIR__ . '/data_storage/security';
    if (!is_dir($dir)) @mkdir($dir, 0700, true);
    @chmod($dir, 0700);
    return $dir;
}

/**
 * Partición de disco de 2 niveles para rate limit y bans (data_storage/security/shards/ab/cd/...).
 */
function securityShardPath(string $prefix, string $safeKey): string {
    $hash = hash('sha256', $prefix . '_' . $safeKey);
    $d1 = substr($hash, 0, 2);
    $d2 = substr($hash, 2, 2);
    $dir = securityRateDir() . '/shards/' . $d1 . '/' . $d2;
    if (!is_dir($dir)) {
        @mkdir($dir, 0700, true);
    }
    return $dir . '/' . $prefix . '_' . substr($hash, 4, 28) . '.json';
}

/**
 * Recolector de basura para purgar archivos temporales de rate limit y bans expirados.
 */
function securityRateGc($force = false) {
    static $lastGc = 0;
    $now = time();
    if (!$force && ($now - $lastGc) < 300 && mt_rand(1, 50) !== 1) {
        return;
    }
    $lastGc = $now;
    $dir = securityRateDir();
    if (!is_dir($dir)) return;

    $files = @scandir($dir);
    if (!is_array($files)) return;

    foreach ($files as $file) {
        if ($file === '.' || $file === '..' || strpos($file, '.') === 0) continue;
        $filePath = $dir . '/' . $file;
        if (!is_file($filePath)) continue;

        if (strpos($file, 'rl_') === 0 && ($now - (int)@filemtime($filePath)) > 600) {
            @unlink($filePath);
            continue;
        }

        if (strpos($file, 'ban_') === 0) {
            $raw = @file_get_contents($filePath);
            $decoded = json_decode((string)$raw, true);
            if (is_array($decoded) && isset($decoded['until']) && (int)$decoded['until'] < $now) {
                @unlink($filePath);
            }
        }
    }
}

/**
 * Redactor automático de secretos y credenciales para logs y trazas de error.
 */
function securityRedactSecrets($text) {
    if (!is_string($text) || $text === '') return $text;

    $patterns = [
        '/(ghp|gho|ghu|ghs|ghr)_[a-zA-Z0-9]{30,}/' => '$1_****************************',
        '/github_pat_[a-zA-Z0-9_]{50,}/' => 'github_pat_****************************',
        '/sb_secret_[a-zA-Z0-9]{20,}/' => 'sb_secret_********************',
        '/sb_publishable_[a-zA-Z0-9]{20,}/' => 'sb_publishable_****************',
        '/eyJ[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]{20,}/' => 'eyJ***[REDACTED_JWT]***',
    ];

    $knownSecrets = [
        getenv('SUPABASE_SECRET_KEY'),
        getenv('GITHUB_TOKEN'),
        getenv('L8_DILITHIUM5_REGISTER_KEY'),
        getenv('L8_AUTH_PEPPER'),
        getenv('L8_VAULT_MASTER_KEY')
    ];

    foreach ($knownSecrets as $sec) {
        if (is_string($sec) && strlen(trim($sec)) >= 8) {
            $text = str_replace(trim($sec), '[REDACTED_SECRET]', $text);
        }
    }

    foreach ($patterns as $pattern => $replacement) {
        $text = preg_replace($pattern, $replacement, $text);
    }

    return $text;
}

/**
 * Rate limit atómico con algoritmo Sliding Window (Interpolación de ventanas previa y actual).
 *
 * @param string $bucket Nombre del bucket
 * @param int $limit Número máximo de peticiones permitidas en la ventana
 * @param int $windowSec Duración de la ventana en segundos
 * @param string|null $ip IP a validar (opcional)
 * @return array{allowed: bool, count: float, remaining: int, retry_after: int, challenge_required: bool}
 */
function securityRateAllowSliding(string $bucket, int $limit, int $windowSec, ?string $ip = null): array {
    $ip = $ip !== null ? $ip : securityClientIp();
    $safeBucket = preg_replace('/[^a-zA-Z0-9_-]/', '', (string)$bucket);
    $safeIp = preg_replace('/[^a-zA-Z0-9:._-]/', '_', $ip);

    // 1. Si la petición incluye un token de clearance válido de Turnstile, elevar límite (5x)
    $clearanceHdr = $_SERVER['HTTP_X_CF_CLEARANCE_TOKEN'] ?? ($_COOKIE['cf_clearance'] ?? '');
    if ($clearanceHdr !== '' && function_exists('cfValidateClearanceToken')) {
        if (cfValidateClearanceToken($clearanceHdr, $ip)) {
            $limit = (int)($limit * 5);
        }
    }

    $now = time();
    $windowDuration = max(1, (int)$windowSec);
    $currentWindow = (int)(floor($now / $windowDuration) * $windowDuration);
    $previousWindow = $currentWindow - $windowDuration;
    $timeElapsed = $now - $currentWindow;
    $previousWeight = max(0.0, min(1.0, 1.0 - ($timeElapsed / $windowDuration)));

    $currKey = "rl:{$safeBucket}:{$safeIp}:{$currentWindow}";
    $prevKey = "rl:{$safeBucket}:{$safeIp}:{$previousWindow}";

    // Operación atómica en memoria (APCu / Sharded)
    $currCount = 1;
    if (function_exists('l8CacheInc')) {
        $currCount = l8CacheInc($currKey, 1, $windowDuration * 2);
        $prevCount = (int)(l8CacheGet($prevKey) ?? 0);
    } else {
        $prevCount = 0;
    }

    $calculatedRate = (float)$currCount + ((float)$prevCount * $previousWeight);

    // Fallback particionado en disco de 2 niveles (sin LOCK_EX bloqueante)
    $shardPath = securityShardPath('rl_' . $safeBucket, $safeIp);
    $state = [
        'bucket' => $safeBucket,
        'ip' => $ip,
        'curr_window' => $currentWindow,
        'curr_count' => $currCount,
        'rate' => $calculatedRate,
        'updated_at' => $now
    ];
    $tmp = $shardPath . '.' . bin2hex(random_bytes(4)) . '.tmp';
    if (@file_put_contents($tmp, json_encode($state)) !== false) {
        @rename($tmp, $shardPath);
    }

    if ($calculatedRate > (float)$limit) {
        $retryAfter = max(1, (int)ceil($windowDuration - $timeElapsed));
        $challengeRequired = ($calculatedRate <= (float)($limit * 2.5));
        return [
            'allowed' => false,
            'count' => $calculatedRate,
            'remaining' => 0,
            'retry_after' => $retryAfter,
            'challenge_required' => $challengeRequired
        ];
    }

    $remaining = max(0, $limit - (int)ceil($calculatedRate));
    return [
        'allowed' => true,
        'count' => $calculatedRate,
        'remaining' => $remaining,
        'retry_after' => 0,
        'challenge_required' => false
    ];
}

/**
 * Compatibilidad con firmas anteriores de rate limiting: delega a sliding window.
 */
function securityRateAllow($bucket, $limit, $windowSec) {
    $res = securityRateAllowSliding((string)$bucket, (int)$limit, (int)$windowSec);
    return $res['allowed'];
}

function securityRateChallengeJson(int $retryAfter = 15, string $bucket = 'api') {
    http_response_code(429);
    header('Content-Type: application/json; charset=utf-8');
    header('Retry-After: ' . (int)$retryAfter);
    header('X-L8-Challenge: turnstile');

    $siteKey = function_exists('cfTurnstileGetSiteKey') ? cfTurnstileGetSiteKey() : (function_exists('secretGet') ? secretGet('CF_TURNSTILE_SITE_KEY', '') : '');
    echo json_encode([
        'ok' => false,
        'error' => 'Rate limit exceeded - Cloudflare Turnstile verification required',
        'code' => 'turnstile_challenge_required',
        'challenge_required' => true,
        'site_key' => $siteKey,
        'retry_after' => (int)$retryAfter,
        'bucket' => $bucket
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

/** Ban temporal por IP (tras fallos de auth / abuso). */
function securityIpBanPath($ip) {
    $safe = substr(hash('sha256', (string)$ip), 0, 24);
    return securityRateDir() . '/ban_' . $safe . '.json';
}

function securityIpIsBanned($ip = null) {
    $ip = $ip !== null ? $ip : securityClientIp();
    $path = securityIpBanPath($ip);
    if (!is_readable($path)) return false;
    $data = json_decode((string)@file_get_contents($path), true);
    if (!is_array($data)) return false;
    $until = (int)($data['until'] ?? 0);
    if ($until < time()) {
        @unlink($path);
        return false;
    }
    return true;
}

function securityIpBan($seconds = 900, $reason = 'abuse', $ip = null) {
    $ip = $ip !== null ? $ip : securityClientIp();
    $payload = [
        'until' => time() + max(60, (int)$seconds),
        'reason' => substr((string)$reason, 0, 80),
        'at' => date('c'),
    ];
    @file_put_contents(securityIpBanPath($ip), json_encode($payload), LOCK_EX);
}

function securityIpStrike($bucket = 'auth_fail', $limit = 12, $windowSec = 600, $banSec = 1800) {
    if (!securityRateAllow('strike_' . $bucket, $limit, $windowSec)) {
        securityIpBan($banSec, $bucket);
        return false;
    }
    return true;
}

function securityRateDenyJson($retryAfter = 60) {
    http_response_code(429);
    header('Content-Type: application/json; charset=utf-8');
    header('Retry-After: ' . (int)$retryAfter);
    echo json_encode([
        'ok' => false,
        'error' => 'Too many requests',
        'code' => 'rate_limited'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

function securityIpBannedJson() {
    http_response_code(403);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode([
        'ok' => false,
        'error' => 'Forbidden',
        'code' => 'ip_banned'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

function securityNotFoundQuiet() {
    http_response_code(404);
    header('Content-Type: text/plain; charset=utf-8');
    header('Cache-Control: no-store');
    echo 'Not Found';
    exit;
}

function securityNotFoundJson() {
    http_response_code(404);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode(['ok' => false, 'error' => 'Not found'], JSON_UNESCAPED_UNICODE);
    exit;
}

function securityUnauthorizedJson($msg = 'Authentication required') {
    http_response_code(401);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    header('WWW-Authenticate: Bearer realm="l8"');
    echo json_encode([
        'ok' => false,
        'error' => $msg,
        'code' => 'unauthorized'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

function securityForbiddenJson($msg = 'Forbidden') {
    http_response_code(403);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode([
        'ok' => false,
        'error' => $msg,
        'code' => 'forbidden'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

function securityBadRequestJson($msg = 'Invalid input', $code = 'bad_request') {
    http_response_code(400);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'ok' => false,
        'error' => $msg,
        'code' => $code
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

/** Rutas/archivos que nunca deben servirse (recon / dump). */
function securityIsDeniedPath($uri) {
    $uri = '/' . ltrim((string)$uri, '/');
    $uriLower = strtolower($uri);
    $deniedExact = [
        '/.env', '/.env.local', '/.env.example', '/.env.production',
        '/composer.json', '/composer.lock', '/package.json', '/package-lock.json',
        '/dockerfile', '/docker-entrypoint.sh', '/render.yaml', '/readme.md', '/security.md',
        '/server.js', '/router.php', '/api.php', '/security.php', '/supabase.php', '/secrets.php',
        '/l8-html.php', '/streamlit.php', '/libreoffice.php', '/auth.php', '/tokens.php', '/hashcod-keys.php', '/ai-chat.php',
        '/opencrypt-gen.php', '/.gitignore', '/.dockerignore', '/.cursor',
        '/caddyfile', '/requirements-streamlit.txt', '/dockerfile',
        '/phpinfo.php', '/info.php', '/test.php', '/debug.php'
    ];
    if (in_array($uriLower, $deniedExact, true)) return true;

    $deniedPrefixes = [
        '/.git/', '/.git', '/.svn/', '/.hg/', '/.idea/', '/.vscode/',
        '/data_storage/', '/uploads/', '/supabase/', '/vendor/',
        '/node_modules/', '/.cursor/', '/etc/secrets/', '/secrets/'
    ];
    foreach ($deniedPrefixes as $p) {
        if ($uriLower === rtrim($p, '/') || strpos($uriLower, $p) === 0) return true;
    }

    if (preg_match('/\.(env|sql|sqlite|sqlite3|bak|old|swp|dist|ini|yml|yaml|toml|lock|log|sh|bash|zsh|phar|phtml|enc)$/i', $uriLower)) {
        return true;
    }
    if (preg_match('/\.php$/i', $uriLower)) {
        return true;
    }
    if (strpos($uri, '..') !== false || strpos($uri, '\\') !== false) {
        return true;
    }
    return false;
}

function securityIsAllowedStatic($uri) {
    $uri = '/' . ltrim((string)$uri, '/');
    if ($uri === '/' || $uri === '') return false;
    if (!preg_match('/\.(svg|png|jpe?g|gif|webp|ico|css|js|mjs|wasm|woff2?|ttf|map)$/i', $uri)) {
        return false;
    }
    $lower = strtolower($uri);
    foreach (['/data_storage/', '/uploads/', '/.git/', '/supabase/', '/vendor/', '/node_modules/'] as $bad) {
        if (strpos($lower, $bad) === 0) return false;
    }
    return true;
}

function securityIsProbePath($uri) {
    $uri = strtolower('/' . ltrim((string)$uri, '/'));
    $probes = [
        '/wp-admin', '/wp-login.php', '/wordpress', '/xmlrpc.php',
        '/phpmyadmin', '/pma', '/adminer', '/admin', '/administrator',
        '/.aws', '/server-status', '/server-info', '/actuator',
        '/cgi-bin', '/shell',
        '/manager/html', '/solr', '/jenkins', '/console',
        '/.DS_Store', '/backup', '/bak', '/old', '/tmp', '/temp',
        '/config.json', '/web.config', '/crossdomain.xml'
    ];
    foreach ($probes as $p) {
        if ($uri === $p || strpos($uri, $p . '/') === 0) return true;
    }
    return false;
}

/* ===== Input sanity / server-side validation ===== */

function securitySanitizeString($value, $maxLen = 500) {
    $value = trim((string)$value);
    $value = str_replace("\0", '', $value);
    if (strlen($value) > $maxLen) {
        $value = substr($value, 0, $maxLen);
    }
    return $value;
}

function securitySanitizeFilename($name) {
    $name = basename(str_replace(["\0", '\\'], '', (string)$name));
    $name = preg_replace('/[^\w.\- ()\[\]]+/u', '_', $name);
    $name = trim((string)$name, '. ');
    if ($name === '' || $name === '.' || $name === '..') {
        $name = 'file.bin';
    }
    return substr($name, 0, 180);
}

function securityValidateRepoSlug($repo) {
    $repo = trim((string)$repo);
    if ($repo === '') return ['ok' => false, 'error' => 'Repo vacío'];
    // URL git genérica (LibreOffice anongit, etc.)
    if (preg_match('#^(https?|git)://[^\s]+#i', $repo)) {
        return ['ok' => true, 'slug' => $repo];
    }
    // owner/name or URL github
    if (preg_match('#^https?://(www\.)?github\.com/([A-Za-z0-9_.-]+)/([A-Za-z0-9_.-]+?)(?:\.git)?/?$#i', $repo, $m)) {
        return ['ok' => true, 'slug' => $m[2] . '/' . $m[3]];
    }
    if (preg_match('#^git@github\.com:([A-Za-z0-9_.-]+)/([A-Za-z0-9_.-]+?)(?:\.git)?$#i', $repo, $m)) {
        return ['ok' => true, 'slug' => $m[1] . '/' . $m[2]];
    }
    if (preg_match('#^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$#', $repo)) {
        return ['ok' => true, 'slug' => $repo];
    }
    if (strcasecmp($repo, 'libreoffice') === 0) {
        return ['ok' => true, 'slug' => 'https://anongit.freedesktop.org/git/libreoffice/core.git'];
    }
    return ['ok' => false, 'error' => 'Formato de repo inválido'];
}

/**
 * Lee JSON del body con tope de bytes (anti DoS).
 * @return array{ok:bool,data?:array,error?:string}
 */
function securityReadJsonBody($maxBytes = 262144) {
    $maxBytes = max(1024, (int)$maxBytes);
    $len = isset($_SERVER['CONTENT_LENGTH']) ? (int)$_SERVER['CONTENT_LENGTH'] : 0;
    if ($len > $maxBytes) {
        return ['ok' => false, 'error' => 'Payload demasiado grande', 'code' => 'payload_too_large'];
    }
    $raw = file_get_contents('php://input', false, null, 0, $maxBytes + 1);
    if ($raw === false) {
        return ['ok' => false, 'error' => 'No se pudo leer el body', 'code' => 'bad_body'];
    }
    if (strlen($raw) > $maxBytes) {
        return ['ok' => false, 'error' => 'Payload demasiado grande', 'code' => 'payload_too_large'];
    }
    if (trim($raw) === '') {
        return ['ok' => true, 'data' => []];
    }
    $data = json_decode($raw, true);
    if (!is_array($data)) {
        return ['ok' => false, 'error' => 'JSON inválido', 'code' => 'invalid_json'];
    }
    return ['ok' => true, 'data' => $data];
}

function securityUploadMimeAllowed($mime, $filename = '', $sampleBytes = '') {
    $mime = strtolower(trim((string)$mime));
    $ext = strtolower(pathinfo((string)$filename, PATHINFO_EXTENSION));
    $blockedExt = ['php', 'phtml', 'phar', 'cgi', 'exe', 'bat', 'cmd', 'sh', 'bash', 'ps1', 'dll', 'so', 'vbs', 'com', 'scr', 'msi', 'jsp', 'asp', 'aspx'];
    if (in_array($ext, $blockedExt, true)) {
        return false;
    }
    $blockedMime = [
        'application/x-php', 'application/x-httpd-php', 'text/x-php',
        'application/x-executable', 'application/x-msdownload', 'application/x-sharedlib',
        'application/x-dosexec', 'application/x-shellscript', 'text/x-shellscript'
    ];
    if (in_array($mime, $blockedMime, true)) {
        return false;
    }
    // Real magic byte inspection if sample bytes provided
    if ($sampleBytes !== '') {
        $header = substr((string)$sampleBytes, 0, 16);
        // ELF binary: \x7fELF
        if (strpos($header, "\x7fELF") === 0) return false;
        // Windows PE executable: MZ
        if (strpos($header, "MZ") === 0) return false;
        // PHP script tag: <?php or <?=
        if (stripos($header, '<?php') !== false || stripos($header, '<?=') !== false) return false;
        // Shell script shebang: #!/
        if (strpos($header, '#!') === 0) return false;
    }
    return true;
}

/* ===== Auth gates (sesión de cuenta ≠ guest) ===== */

function securityAuthMutationsRequired() {
    $v = strtolower((string) (
        function_exists('secretGet') ? secretGet('L8_REQUIRE_AUTH_MUTATIONS', '1') : '1'
    ));
    return !in_array($v, ['0', 'false', 'no', 'off'], true);
}

/**
 * Exige sesión de cuenta autenticada (Bearer / cookie HttpOnly).
 * No acepta solo guest token.
 * @return array authValidateSession result
 */
function securityRequireAccountSession() {
    if (!function_exists('authValidateSession')) {
        require_once __DIR__ . '/auth.php';
    }
    $token = '';
    if (function_exists('authSessionTokenFromRequest')) {
        $token = authSessionTokenFromRequest();
    } elseif (function_exists('authBearerTokenFromRequest')) {
        $token = authBearerTokenFromRequest();
    }
    $sess = authValidateSession($token);
    if (empty($sess['ok']) || empty($sess['authenticated'])) {
        securityUnauthorizedJson('Se requiere sesión de cuenta');
    }
    // Separación: cookie-auth exige marcador CSRF / X-Requested-With
    $usedCookie = function_exists('authSessionUsedCookie') ? authSessionUsedCookie() : false;
    $hasBearer = function_exists('authSessionUsedBearer') ? authSessionUsedBearer() : true;
    if ($usedCookie && !$hasBearer) {
        $xrw = $_SERVER['HTTP_X_REQUESTED_WITH'] ?? '';
        $csrf = $_SERVER['HTTP_X_L8_CSRF'] ?? '';
        if (strcasecmp((string)$xrw, 'XMLHttpRequest') !== 0 && trim((string)$csrf) === '') {
            securityForbiddenJson('CSRF check failed');
        }
    }
    return $sess;
}

/**
 * Exige cuenta para mutaciones sensibles.
 */
function securityRequireMutationAuthIfEnabled() {
    return securityRequireAccountSession();
}

/**
 * Interceptor global de apagado (Shutdown Handler).
 * Captura errores fatales de PHP (OOM, parse error, timeouts) y responde con JSON limpio sin caer en 502.
 */
function securityGlobalShutdownHandler() {
    $error = error_get_last();
    if ($error !== null && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR, E_USER_ERROR], true)) {
        while (ob_get_level()) {
            @ob_end_clean();
        }

        $isCbOpen = function_exists('supabaseCircuitIsOpen') ? supabaseCircuitIsOpen() : false;
        $status = $isCbOpen ? 503 : 500;
        http_response_code($status);
        if (!headers_sent()) {
            header('Content-Type: application/json; charset=utf-8');
            header('Cache-Control: no-store');
            header('X-L8-Crash-Guard: active');
        }

        $msg = 'Internal server execution error';
        if (function_exists('securityRedactSecrets')) {
            $msg = securityRedactSecrets($error['message'] ?? $msg);
        }

        echo json_encode([
            'ok' => false,
            'error' => 'Internal server execution error',
            'code' => 'fatal_error',
            'status' => $status,
            'request_id' => bin2hex(random_bytes(8))
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
}

/**
 * Manejador global de excepciones no capturadas.
 */
function securityGlobalExceptionHandler(Throwable $e) {
    while (ob_get_level()) {
        @ob_end_clean();
    }

    http_response_code(500);
    if (!headers_sent()) {
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: no-store');
        header('X-L8-Crash-Guard: active');
    }

    $msg = $e->getMessage();
    if (function_exists('securityRedactSecrets')) {
        $msg = securityRedactSecrets($msg);
    }
    // Keep detailed diagnostics server-side. Never expose exception text, file paths,
    // provider responses, SQL details or secret-adjacent context to remote clients.
    error_log('[hashcod] unhandled exception: ' . ($msg ?: get_class($e)));

    echo json_encode([
        'ok' => false,
        'error' => 'Internal server error',
        'code' => 'server_exception',
        'status' => 500,
        'request_id' => bin2hex(random_bytes(8))
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Manejador global de errores estándar de PHP.
 */
function securityGlobalErrorHandler($errno, $errstr, $errfile, $errline) {
    if (!(error_reporting() & $errno)) {
        return false;
    }
    if (in_array($errno, [E_USER_ERROR, E_RECOVERABLE_ERROR], true)) {
        throw new ErrorException($errstr, 0, $errno, $errfile, $errline);
    }
    return false;
}

/**
 * Comprueba si queda suficiente margen de memoria disponible antes de ejecutar operaciones pesadas.
 */
function securityCheckMemoryGuard(int $minFreeBytes = 16777216): bool {
    $memLimit = ini_get('memory_limit');
    if ($memLimit === '-1' || $memLimit === false) return true;

    $val = trim((string)$memLimit);
    $last = strtolower($val[strlen($val) - 1]);
    $bytes = (int)$val;
    switch ($last) {
        case 'g': $bytes *= 1024;
        case 'm': $bytes *= 1024;
        case 'k': $bytes *= 1024;
    }

    $used = memory_get_usage(true);
    return ($used + $minFreeBytes) <= $bytes;
}

/**
 * Bootstrap de seguridad para cada request HTTP.
 * $mode: 'web' | 'api'
 */
function securityBootstrap($mode = 'web') {
    // 1. Asignar límites estrictos de proceso (15s timeout, 128M memoria base)
    @set_time_limit(15);
    @ini_set('memory_limit', '128M');

    // 2. Registrar Error Boundaries universales para cero caídas no controladas
    static $handlersRegistered = false;
    if (!$handlersRegistered) {
        $handlersRegistered = true;
        @register_shutdown_function('securityGlobalShutdownHandler');
        @set_exception_handler('securityGlobalExceptionHandler');
        @set_error_handler('securityGlobalErrorHandler', E_ALL & ~E_NOTICE & ~E_DEPRECATED & ~E_USER_DEPRECATED);
    }

    securityApplyHeaders();
    securityApplyCors();

    if (!headers_sent()) {
        header('X-L8-Request-Id: ' . bin2hex(random_bytes(8)));
    }

    $clientIp = securityClientIp();
    $uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
    $uri = is_string($uri) ? $uri : '/';
    $isAdminDeviceApi = strpos($uri, '/api/admin-device/') === 0;

    // 0. Intercepción pasiva de trampas Honeypot (decepción inmediata)
    if (function_exists('threatIntelIsHoneypot') && threatIntelIsHoneypot($uri)) {
        if (function_exists('threatIntelHoneypotTrigger')) {
            threatIntelHoneypotTrigger($uri, $clientIp);
        }
        if (function_exists('threatIntelServeHoneypotDecoy')) {
            threatIntelServeHoneypotDecoy($uri, $clientIp);
        }
    }

    if (securityIpIsBanned($clientIp)) {
        if ($mode === 'api') securityIpBannedJson();
        securityNotFoundQuiet();
    }

    // 1. Verificación en tiempo real de Inteligencia de Amenazas y Reputación de IP
    if (function_exists('threatIntelCheckIp')) {
        $threat = threatIntelCheckIp($clientIp);
        $threatStatus = $threat['status'] ?? 'ALLOW';
        if ($threatStatus === 'BLOCK') {
            if ($mode === 'api') {
                http_response_code(403);
                header('Content-Type: application/json; charset=utf-8');
                header('Cache-Control: no-store');
                echo json_encode([
                    'ok' => false,
                    'error' => 'Access denied: High threat reputation score detected',
                    'code' => 'ip_reputation_blocked',
                    'threat_score' => $threat['score'] ?? 100,
                    'source' => $threat['source'] ?? 'threat_intel'
                ], JSON_UNESCAPED_UNICODE);
                exit;
            }
            securityNotFoundQuiet();
        } elseif ($threatStatus === 'CHALLENGE' && !$isAdminDeviceApi) {
            // Windows Hello is itself the interactive challenge for admin-device routes.
            // Do not interpose Turnstile there; hard BLOCK decisions still apply above.
            $resChallenge = securityRateAllowSliding('threat_challenge', 10, 60, $clientIp);
            if (!$resChallenge['allowed']) {
                securityRateChallengeJson($resChallenge['retry_after'] ?: 30, 'threat_reputation');
            }
        }
    }

    $ua = $_SERVER['HTTP_USER_AGENT'] ?? '';
    if (securityIsScannerUa($ua)) {
        $res = securityRateAllowSliding('scanner_ua', 15, 60);
        if (!$res['allowed']) {
            securityIpBan(3600, 'scanner');
            if ($mode === 'api') securityRateDenyJson(120);
            securityNotFoundQuiet();
        }
        if ($mode === 'web' && $uri !== '/' && strpos($uri, '/api/') !== 0) {
            if (!securityIsAllowedStatic($uri) && $uri !== '/favicon.ico') {
                if (securityIsProbePath($uri) || securityIsDeniedPath($uri)) {
                    securityNotFoundQuiet();
                }
            }
        }
    }

    if (securityIsDeniedPath($uri)) {
        if ($mode === 'api') securityNotFoundJson();
        securityNotFoundQuiet();
    }

    if (securityIsProbePath($uri) && strpos($uri, '/api/') !== 0) {
        securityNotFoundQuiet();
    }

    // Windows Hello / WebAuthn uses isolated buckets so normal platform API traffic
    // cannot consume its allowance or force an unrelated Cloudflare Turnstile prompt.
    if ($isAdminDeviceApi) {
        $adminRoute = substr($uri, strlen('/api/admin-device/'));
        $adminLimit = 30;
        $adminBucket = 'other';

        if ($adminRoute === 'status') {
            $adminLimit = 180;
            $adminBucket = 'status';
        } elseif ($adminRoute === 'challenge') {
            $adminLimit = 20;
            $adminBucket = 'challenge';
        } elseif ($adminRoute === 'verify') {
            $adminLimit = 20;
            $adminBucket = 'verify';
        } elseif ($adminRoute === 'authorize') {
            $adminLimit = 60;
            $adminBucket = 'authorize';
        } elseif ($adminRoute === 'logout') {
            $adminLimit = 30;
            $adminBucket = 'logout';
        }

        $resAdmin = securityRateAllowSliding('admin_device_' . $adminBucket, $adminLimit, 60, $clientIp);
        if (!$resAdmin['allowed']) {
            // Deliberately no Turnstile here: Windows Hello is the authoritative
            // interactive verification mechanism for these endpoints.
            securityRateDenyJson($resAdmin['retry_after']);
        }
        return;
    }

    // Rate limit adaptativo para API con desafío Turnstile
    if ($mode === 'api' || strpos($uri, '/api/') === 0) {
        $resGlobal = securityRateAllowSliding('api_global', 120, 60);
        if (!$resGlobal['allowed']) {
            if (!empty($resGlobal['challenge_required'])) {
                securityRateChallengeJson($resGlobal['retry_after'], 'api_global');
            }
            securityRateDenyJson($resGlobal['retry_after']);
        }

        $resBurst = securityRateAllowSliding('api_ip_burst', 40, 10);
        if (!$resBurst['allowed']) {
            if (!empty($resBurst['challenge_required'])) {
                securityRateChallengeJson($resBurst['retry_after'], 'api_ip_burst');
            }
            securityRateDenyJson($resBurst['retry_after']);
        }
    }
}

/** Comprueba admin secret opcional para diagnósticos. */
function securityAdminAuthorized() {
    $secret = function_exists('secretGet')
        ? secretGet('L8_ADMIN_DIAG_SECRET', '')
        : (function_exists('envValue') ? envValue('L8_ADMIN_DIAG_SECRET', '') : '');
    if ($secret === '') return false;
    $hdr = $_SERVER['HTTP_X_L8_ADMIN'] ?? '';
    $q = $_GET['admin'] ?? '';
    return hash_equals($secret, (string)$hdr) || hash_equals($secret, (string)$q);
}
