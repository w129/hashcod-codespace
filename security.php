<?php
/**
 * Endurecimiento de superficie de ataque — l8 codespace.
 * Reduce fingerprinting, cierra rutas sensibles, limita fuerza bruta y probes.
 */

if (!function_exists('envValue')) {
    require_once __DIR__ . '/supabase.php';
}

/** Headers de seguridad + ocultar fingerprint de PHP. */
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
        header('Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()');
        header('Cross-Origin-Opener-Policy: same-origin');
        header('X-DNS-Prefetch-Control: off');
        // HSTS solo si la petición llegó por HTTPS (Render termina TLS)
        $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
            || (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https')
            || (isset($_SERVER['SERVER_PORT']) && (int)$_SERVER['SERVER_PORT'] === 443);
        if ($https) {
            header('Strict-Transport-Security: max-age=31536000; includeSubDomains');
        }
        // CSP: permite la UI actual (inline scripts) sin abrir framing externo
        header(
            "Content-Security-Policy: default-src 'self'; " .
            "base-uri 'self'; " .
            "frame-ancestors 'none'; " .
            "object-src 'none'; " .
            "form-action 'self'; " .
            "img-src 'self' data: blob: https:; " .
            "font-src 'self' data: https:; " .
            "style-src 'self' 'unsafe-inline' https:; " .
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; " .
            "connect-src 'self' https: wss:; " .
            "worker-src 'self' blob:; " .
            "media-src 'self' blob:;"
        );
        // No revelar software en Server si el runtime lo permite
        header('Server: l8');
    }
}

/** CORS restringido: same-origin por defecto; allowlist vía L8_CORS_ORIGINS. */
function securityApplyCors() {
    $originsRaw = function_exists('envValue') ? envValue('L8_CORS_ORIGINS', '') : '';
    $allow = [];
    if ($originsRaw !== '') {
        foreach (explode(',', $originsRaw) as $o) {
            $o = trim($o);
            if ($o !== '') $allow[] = rtrim($o, '/');
        }
    }
    $reqOrigin = isset($_SERVER['HTTP_ORIGIN']) ? rtrim((string)$_SERVER['HTTP_ORIGIN'], '/') : '';
    if ($allow !== [] && $reqOrigin !== '' && in_array($reqOrigin, $allow, true)) {
        header('Access-Control-Allow-Origin: ' . $reqOrigin);
        header('Vary: Origin');
        header('Access-Control-Allow-Credentials: true');
    }
    // Sin allowlist: no emitir Access-Control-Allow-Origin:* (misma origen basta)
    header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Authorization, Content-Type, X-L8-Tokens-Guest, X-Requested-With');
    header('Access-Control-Max-Age: 600');
}

function securityClientIp() {
    $candidates = [];
    if (!empty($_SERVER['HTTP_CF_CONNECTING_IP'])) $candidates[] = $_SERVER['HTTP_CF_CONNECTING_IP'];
    if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        $parts = explode(',', (string)$_SERVER['HTTP_X_FORWARDED_FOR']);
        if (!empty($parts[0])) $candidates[] = trim($parts[0]);
    }
    if (!empty($_SERVER['REMOTE_ADDR'])) $candidates[] = $_SERVER['REMOTE_ADDR'];
    foreach ($candidates as $ip) {
        $ip = trim((string)$ip);
        if (filter_var($ip, FILTER_VALIDATE_IP)) return $ip;
    }
    return '0.0.0.0';
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
    return $dir;
}

/**
 * Rate limit simple por bucket+IP. Retorna true si permitido.
 * $limit = máximos en $windowSec segundos.
 */
function securityRateAllow($bucket, $limit, $windowSec) {
    $ip = securityClientIp();
    $safeBucket = preg_replace('/[^a-zA-Z0-9_-]/', '', (string)$bucket);
    $safeIp = preg_replace('/[^a-zA-Z0-9:._-]/', '_', $ip);
    $path = securityRateDir() . '/rl_' . $safeBucket . '_' . substr(hash('sha256', $safeIp), 0, 24) . '.json';
    $now = time();
    $data = ['start' => $now, 'count' => 0];
    if (is_readable($path)) {
        $raw = @file_get_contents($path);
        $decoded = json_decode((string)$raw, true);
        if (is_array($decoded) && isset($decoded['start'], $decoded['count'])) {
            $data = $decoded;
        }
    }
    if (($now - (int)$data['start']) >= (int)$windowSec) {
        $data = ['start' => $now, 'count' => 0];
    }
    $data['count'] = (int)$data['count'] + 1;
    @file_put_contents($path, json_encode($data), LOCK_EX);
    return ((int)$data['count'] <= (int)$limit);
}

function securityRateDenyJson($retryAfter = 60) {
    http_response_code(429);
    header('Content-Type: application/json; charset=utf-8');
    header('Retry-After: ' . (int)$retryAfter);
    echo json_encode([
        'ok' => false,
        'error' => 'Too many requests'
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

/** Rutas/archivos que nunca deben servirse (recon / dump). */
function securityIsDeniedPath($uri) {
    $uri = '/' . ltrim((string)$uri, '/');
    $uriLower = strtolower($uri);
    $deniedExact = [
        '/.env', '/.env.local', '/.env.example', '/.env.production',
        '/composer.json', '/composer.lock', '/package.json', '/package-lock.json',
        '/dockerfile', '/docker-entrypoint.sh', '/render.yaml', '/readme.md',
        '/server.js', '/router.php', '/api.php', '/security.php', '/supabase.php',
        '/l8-html.php', '/streamlit.php', '/auth.php', '/tokens.php', '/hashcod-keys.php', '/ai-chat.php',
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

    // Extensiones peligrosas / fuente
    if (preg_match('/\.(env|sql|sqlite|sqlite3|bak|old|swp|dist|ini|yml|yaml|toml|lock|log|sh|bash|zsh|phar|phtml)$/i', $uriLower)) {
        return true;
    }
    // Cualquier .php crudo excepto páginas enrutadas (esas se manejan antes)
    if (preg_match('/\.php$/i', $uriLower)) {
        return true;
    }
    // Path traversal
    if (strpos($uri, '..') !== false || strpos($uri, '\\') !== false) {
        return true;
    }
    return false;
}

/** Assets públicos permitidos (allowlist). */
function securityIsAllowedStatic($uri) {
    $uri = '/' . ltrim((string)$uri, '/');
    if ($uri === '/' || $uri === '') return false;

    // Extensiones de asset
    if (!preg_match('/\.(svg|png|jpe?g|gif|webp|ico|css|js|mjs|wasm|woff2?|ttf|map)$/i', $uri)) {
        return false;
    }

    // Bloquear assets dentro de zonas sensibles
    $lower = strtolower($uri);
    foreach (['/data_storage/', '/uploads/', '/.git/', '/supabase/', '/vendor/', '/node_modules/'] as $bad) {
        if (strpos($lower, $bad) === 0) return false;
    }
    return true;
}

/** Probes típicos de escáneres (404 silencioso). */
function securityIsProbePath($uri) {
    $uri = strtolower('/' . ltrim((string)$uri, '/'));
    $probes = [
        '/wp-admin', '/wp-login.php', '/wordpress', '/xmlrpc.php',
        '/phpmyadmin', '/pma', '/adminer', '/admin', '/administrator',
        '/.aws', '/server-status', '/server-info', '/actuator',
        '/.well-known/security.txt', // handled separately if we want
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

/**
 * Bootstrap de seguridad para cada request HTTP.
 * $mode: 'web' | 'api'
 */
function securityBootstrap($mode = 'web') {
    securityApplyHeaders();
    securityApplyCors();

    $uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
    $uri = is_string($uri) ? $uri : '/';

    // Rate-limit global suave contra floods de probes
    $ua = $_SERVER['HTTP_USER_AGENT'] ?? '';
    if (securityIsScannerUa($ua)) {
        if (!securityRateAllow('scanner_ua', 20, 60)) {
            if ($mode === 'api') securityRateDenyJson(120);
            securityNotFoundQuiet();
        }
        // Escáneres: nunca revelar más que 404 en rutas no esenciales
        if ($mode === 'web' && $uri !== '/' && strpos($uri, '/api/') !== 0) {
            // permitir assets allowlist; denegar resto con 404 uniforme
            if (!securityIsAllowedStatic($uri) && $uri !== '/favicon.ico') {
                // leave routing to continue for SPA? Better 404 for probe paths
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

    // Rate limit genérico de API (anti-scan)
    if ($mode === 'api' || strpos($uri, '/api/') === 0) {
        if (!securityRateAllow('api_global', 180, 60)) {
            securityRateDenyJson(30);
        }
    }
}

/** Comprueba admin secret opcional para diagnósticos. */
function securityAdminAuthorized() {
    $secret = function_exists('envValue') ? envValue('L8_ADMIN_DIAG_SECRET', '') : '';
    if ($secret === '') return false;
    $hdr = $_SERVER['HTTP_X_L8_ADMIN'] ?? '';
    $q = $_GET['admin'] ?? '';
    return hash_equals($secret, (string)$hdr) || hash_equals($secret, (string)$q);
}
