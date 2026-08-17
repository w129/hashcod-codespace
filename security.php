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
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " .
            "connect-src 'self' https: wss:; " .
            "frame-src 'self'; " .
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
 * IP del cliente.
 * L8_TRUST_PROXY=1 (default en Render): CF-Connecting-IP o primer X-Forwarded-For.
 * L8_TRUST_PROXY=0: solo REMOTE_ADDR (anti-spoof en despliegues sin edge).
 */
function securityClientIp() {
    $trust = strtolower((string) (
        function_exists('secretGet') ? secretGet('L8_TRUST_PROXY', '1') : '1'
    ));
    $trustProxy = !in_array($trust, ['0', 'false', 'no', 'off'], true);

    $candidates = [];
    if ($trustProxy) {
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
    if (!empty($_SERVER['REMOTE_ADDR'])) {
        $candidates[] = $_SERVER['REMOTE_ADDR'];
    }

    foreach ($candidates as $ip) {
        $ip = trim((string)$ip);
        if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
            return $ip;
        }
        // Permitir privadas en local/dev
        if (filter_var($ip, FILTER_VALIDATE_IP)) {
            return $ip;
        }
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
    @chmod($dir, 0700);
    return $dir;
}

/**
 * Recolector de basura para purgar archivos temporales de rate limit y bans expirados.
 * Previene la saturación de I/O en disco (Render / containers).
 */
function securityRateGc($force = false) {
    static $lastGc = 0;
    $now = time();
    // Ejecutar con 2% de probabilidad o tras 300 segundos
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

        // Archivos de rate limit rl_*.json: borrar si tienen más de 10 minutos
        if (strpos($file, 'rl_') === 0 && ($now - (int)@filemtime($filePath)) > 600) {
            @unlink($filePath);
            continue;
        }

        // Archivos de baneo ban_*.json: borrar si el tiempo 'until' ya expiró
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
 * Enmascara tokens de GitHub, Supabase, JWT y claves maestras.
 */
function securityRedactSecrets($text) {
    if (!is_string($text) || $text === '') return $text;

    $patterns = [
        '/(ghp|gho|ghu|ghs|ghr)_[a-zA-Z0-9]{30,}/' => '$1_****************************',
        '/github_pat_[a-zA-Z0-9_]{50,}/' => 'github_pat_****************************',
        '/sb_secret_[a-zA-Z0-9]{20,}/' => 'sb_secret_********************',
        '/sb_publishable_[a-zA-Z0-9]{20,}/' => 'sb_publishable_****************',
        '/eyJ[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]{20,}/' => 'eyJ***[REDACTED_JWT]***',
        '/([a-f0-9]{64})/' => '$1' // Conservar hashes estándar pero permitir enmascarar si coincide con claves
    ];

    // Enmascarar claves de entorno conocidas si existen
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
        if ($pattern === '/([a-f0-9]{64})/') continue;
        $text = preg_replace($pattern, $replacement, $text);
    }

    return $text;
}

/**
 * Rate limit por bucket+IP. Retorna true si permitido.
 */
function securityRateAllow($bucket, $limit, $windowSec) {
    securityRateGc();
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
    @chmod($path, 0600);
    return ((int)$data['count'] <= (int)$limit);
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

function securityUploadMimeAllowed($mime, $filename = '') {
    $mime = strtolower(trim((string)$mime));
    $ext = strtolower(pathinfo((string)$filename, PATHINFO_EXTENSION));
    $blockedExt = ['php', 'phtml', 'phar', 'cgi', 'exe', 'bat', 'cmd', 'sh', 'bash', 'ps1', 'dll', 'so'];
    if (in_array($ext, $blockedExt, true)) {
        return false;
    }
    $blockedMime = [
        'application/x-php', 'application/x-httpd-php', 'text/x-php',
        'application/x-executable', 'application/x-msdownload',
    ];
    if (in_array($mime, $blockedMime, true)) {
        return false;
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
 * Si L8_REQUIRE_AUTH_MUTATIONS=1, exige cuenta para mutaciones sensibles.
 */
function securityRequireMutationAuthIfEnabled() {
    if (!securityAuthMutationsRequired()) {
        return null;
    }
    return securityRequireAccountSession();
}

/**
 * Bootstrap de seguridad para cada request HTTP.
 * $mode: 'web' | 'api'
 */
function securityBootstrap($mode = 'web') {
    securityApplyHeaders();
    securityApplyCors();

    if (!headers_sent()) {
        header('X-L8-Request-Id: ' . bin2hex(random_bytes(8)));
    }

    if (securityIpIsBanned()) {
        if ($mode === 'api') securityIpBannedJson();
        securityNotFoundQuiet();
    }

    $uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
    $uri = is_string($uri) ? $uri : '/';

    $ua = $_SERVER['HTTP_USER_AGENT'] ?? '';
    if (securityIsScannerUa($ua)) {
        if (!securityRateAllow('scanner_ua', 15, 60)) {
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

    // Rate limit global API + techo por IP
    if ($mode === 'api' || strpos($uri, '/api/') === 0) {
        if (!securityRateAllow('api_global', 120, 60)) {
            securityRateDenyJson(30);
        }
        if (!securityRateAllow('api_ip_burst', 40, 10)) {
            securityRateDenyJson(15);
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
