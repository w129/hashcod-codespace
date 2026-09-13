<?php
// router.php — front controller PHP (HTML nativo, no Vite/React SPA)
require_once __DIR__ . '/security.php';
require_once __DIR__ . '/l8-html.php';

// hashcod-sync.php is a deliberate public controller. The generic security layer
// denies direct *.php paths, so normalize only this exact controller to an
// extensionless API URI before the security bootstrap runs. This keeps every
// other PHP file hidden while allowing the cross-device PostgreSQL endpoint.
$bootstrapRequestUri = (string)($_SERVER['REQUEST_URI'] ?? '/');
$bootstrapRawPath = parse_url($bootstrapRequestUri, PHP_URL_PATH);
$bootstrapRawPath = is_string($bootstrapRawPath) ? $bootstrapRawPath : '/';
$bootstrapSyncPath = preg_replace('#^/(?:l8|l8-codespace)(?=/|$)#i', '', $bootstrapRawPath);
if ($bootstrapSyncPath === '/hashcod-sync.php') {
    $bootstrapQuery = parse_url($bootstrapRequestUri, PHP_URL_QUERY);
    $_SERVER['REQUEST_URI'] = '/api/hashcod-sync'
        . (is_string($bootstrapQuery) && $bootstrapQuery !== '' ? '?' . $bootstrapQuery : '');
    require __DIR__ . '/hashcod-sync.php';
    exit;
}

securityBootstrap('web');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$rawUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$rawUri = is_string($rawUri) ? $rawUri : '/';
$uri = preg_replace('#^/(?:l8|l8-codespace)(?=/|$)#i', '', $rawUri);
if ($uri === '' || $uri === false) $uri = '/';

require_once __DIR__ . '/admin-device.php';
adminDeviceApi($uri);
if (adminProtectedPath($uri)) adminRequire();

// Raíz / app principal — HTML completo en view-source (index.php)
if ($uri === '/' || $uri === '/index.php' || $uri === '/index.html' || $uri === '/404.html') {
    l8_require_html_page('index.php', true);
}

// Páginas HTML enrutadas (nunca servir el .php crudo por allowlist)
$routedPages = [
    '/admin-device-setup' => 'admin-device-setup.php',
    '/admin-device-setup.php' => 'admin-device-setup.php',
    '/gateway' => 'gateway.php',
    '/gateway.php' => 'gateway.php',
    '/ubuntu' => 'ubuntu-cli.php',
    '/ubuntu-cli' => 'ubuntu-cli.php',
    '/ubuntu-cli.php' => 'ubuntu-cli.php',
    '/claude' => 'claude-cli.php',
    '/claude-cli' => 'claude-cli.php',
    '/claude-code' => 'claude-cli.php',
    '/claude-cli.php' => 'claude-cli.php',
    '/zylon' => 'zylon-cli.php',
    '/zylon-cli' => 'zylon-cli.php',
    '/private-gpt' => 'zylon-cli.php',
    '/zylon-cli.php' => 'zylon-cli.php',
    '/prs-code' => 'prs-code.php',
    '/prs_code' => 'prs-code.php',
    '/prs' => 'prs-code.php',
    '/prs-code.php' => 'prs-code.php',
    '/macos' => 'macos-cli.php',
    '/macos-cli' => 'macos-cli.php',
    '/macos_inside' => 'macos-cli.php',
    '/macOS_inside' => 'macos-cli.php',
    '/macos-cli.php' => 'macos-cli.php',
    '/chromeos' => 'chromeos-cli.php',
    '/chromeos-cli' => 'chromeos-cli.php',
    '/chromeos_play' => 'chromeos-cli.php',
    '/chromeOS_play' => 'chromeos-cli.php',
    '/chromeos-cli.php' => 'chromeos-cli.php',
    '/libreoffice' => 'libreoffice-cli.php',
    '/libreoffice-cli' => 'libreoffice-cli.php',
    '/libreoffice-cli.php' => 'libreoffice-cli.php',
    '/tiptap' => 'tiptap-editor.php',
    '/tiptap-editor' => 'tiptap-editor.php',
    '/tiptap-editor.php' => 'tiptap-editor.php',
    '/word' => 'tiptap-editor.php',
    '/documento' => 'tiptap-editor.php',
    '/openclaw' => 'openclaw-ui.php',
    '/openclaw.php' => 'openclaw-ui.php',
    '/openclaw-ui' => 'openclaw-ui.php',
    '/claw' => 'openclaw-ui.php',
    '/claw-ui' => 'openclaw-ui.php',
    '/privacy' => 'privacy.php',
    '/privacy.php' => 'privacy.php',
    '/politica' => 'privacy.php',
    '/politica-de-privacidad' => 'privacy.php',
];
if (isset($routedPages[$uri])) {
    $page = $routedPages[$uri];
    if (!is_file(__DIR__ . '/' . $page)) {
        // Página declarada pero ausente: volver al HTML principal (sin 404 vacío)
        l8_require_html_page('index.php', true);
    }
    l8_require_html_page($page, true);
}

// Chat IA de la pantalla de acceso. Se enruta antes del backend general para
// mantener la integración Groq aislada y la credencial únicamente en servidor.
if ($uri === '/api/groq-chat') {
    require __DIR__ . '/groq-chat.php';
    exit;
}

// Sync endpoint. /hashcod-sync.php is normalized before bootstrap above;
// /api/hashcod-sync is also accepted as the canonical extensionless route.
if ($uri === '/hashcod-sync.php' || $uri === '/api/hashcod-sync') {
    require __DIR__ . '/hashcod-sync.php';
    exit;
}

// API
if (strpos($uri, '/api/') === 0 || $uri === '/cmd' || $uri === '/json') {
    require __DIR__ . '/api.php';
    exit;
}

// Google Search Console — HTML file verification (raíz pública)
if (preg_match('#^/google[a-z0-9]+\.html$#i', $uri)) {
    $verifyPath = __DIR__ . '/' . basename($uri);
    if (is_file($verifyPath)) {
        header('Content-Type: text/html; charset=utf-8');
        header('Cache-Control: public, max-age=300');
        header('X-Robots-Tag: noindex');
        readfile($verifyPath);
        exit;
    }
}

// SEO: robots.txt + sitemap.xml (raíz pública; no pasan por allowlist de assets)
// En Docker/Caddy también se sirven estáticos; esto cubre PHP built-in / fallback.
if ($uri === '/robots.txt' || $uri === '/sitemap.xml') {
    $isRobots = ($uri === '/robots.txt');
    $path = __DIR__ . ($isRobots ? '/robots.txt' : '/sitemap.xml');
    if (is_file($path)) {
        // Cabeceras mínimas: GSC falla a menudo con CORP/ETag/304/gzip raro
        foreach ([
            'Cross-Origin-Resource-Policy',
            'Cross-Origin-Opener-Policy',
            'Content-Security-Policy',
            'X-Frame-Options',
            'ETag',
            'Last-Modified',
            'X-Robots-Tag',
        ] as $h) {
            header_remove($h);
        }
        header('Content-Type: ' . ($isRobots ? 'text/plain; charset=utf-8' : 'text/xml; charset=utf-8'));
        header('Cache-Control: no-store, max-age=0, must-revalidate');
        header('X-Content-Type-Options: nosniff');
        readfile($path);
        exit;
    }
}

// Denegado / probes
if (securityIsDeniedPath($uri) || securityIsProbePath($uri)) {
    securityNotFoundQuiet();
}

// Solo assets allowlist
$filePath = realpath(__DIR__ . $uri);
$rootReal = realpath(__DIR__);
if (
    $filePath !== false
    && $rootReal !== false
    && strpos($filePath, $rootReal) === 0
    && is_file($filePath)
    && securityIsAllowedStatic($uri)
) {
    l8_serve_static_asset($filePath, $uri);
}

/**
 * Sirve un asset estático con ETag determinista, validación 304 Not Modified,
 * Cache-Control jerárquico (1 año immutable vs 86400s stale-while-revalidate),
 * y streaming eficiente con zero-copy / buffer limpio.
 */
function l8_serve_static_asset(string $filePath, string $uri): void {
    $mtime = (int)@filemtime($filePath);
    $size = (int)@filesize($filePath);
    $ext = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));

    $mimes = [
        'js' => 'application/javascript; charset=utf-8',
        'mjs' => 'application/javascript; charset=utf-8',
        'css' => 'text/css; charset=utf-8',
        'wasm' => 'application/wasm',
        'svg' => 'image/svg+xml; charset=utf-8',
        'png' => 'image/png',
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'gif' => 'image/gif',
        'webp' => 'image/webp',
        'ico' => 'image/x-icon',
        'woff' => 'font/woff',
        'woff2' => 'font/woff2',
        'ttf' => 'font/ttf',
        'map' => 'application/json; charset=utf-8',
        'json' => 'application/json; charset=utf-8',
        'webmanifest' => 'application/manifest+json; charset=utf-8',
        'xml' => 'text/xml; charset=utf-8',
        'txt' => 'text/plain; charset=utf-8',
    ];

    $mime = $mimes[$ext] ?? 'application/octet-stream';
    $etag = 'W/"' . dechex($mtime) . '-' . dechex($size) . '"';
    $lastModified = gmdate('D, d M Y H:i:s', $mtime) . ' GMT';

    // Determinar si es un asset versionado / inmutable
    $queryString = $_SERVER['QUERY_STRING'] ?? '';
    $hasVersionQuery = (bool)preg_match('/(?:^|&)(?:v|ver|hash|t|id)=[a-zA-Z0-9_.-]+/i', $queryString);
    $hasHashedFilename = (bool)preg_match('/-[a-zA-Z0-9_-]{6,}\.(?:js|css|wasm|svg|png|woff2?)$/i', basename($filePath));

    $isImmutable = $hasVersionQuery || $hasHashedFilename;
    $cacheControl = $isImmutable
        ? 'public, max-age=31536000, immutable'
        : 'public, max-age=86400, stale-while-revalidate=604800';

    // Validación condicional HTTP (If-None-Match / If-Modified-Since)
    $ifNoneMatch = isset($_SERVER['HTTP_IF_NONE_MATCH']) ? trim($_SERVER['HTTP_IF_NONE_MATCH']) : '';
    $ifModifiedSince = isset($_SERVER['HTTP_IF_MODIFIED_SINCE']) ? trim($_SERVER['HTTP_IF_MODIFIED_SINCE']) : '';

    $matchEtag = false;
    if ($ifNoneMatch !== '') {
        $etags = array_map('trim', explode(',', $ifNoneMatch));
        foreach ($etags as $clientEtag) {
            $cClean = trim($clientEtag, '"');
            $sClean = trim($etag, '"');
            $sWeakClean = ltrim($sClean, 'W/');
            $cWeakClean = ltrim($cClean, 'W/');
            if ($clientEtag === '*' || $clientEtag === $etag || $cClean === $sClean || $cWeakClean === $sWeakClean) {
                $matchEtag = true;
                break;
            }
        }
    }

    $matchTime = false;
    if ($ifModifiedSince !== '') {
        $sinceTime = strtotime($ifModifiedSince);
        if ($sinceTime !== false && $mtime <= $sinceTime) {
            $matchTime = true;
        }
    }

    if ($matchEtag || ($ifNoneMatch === '' && $matchTime)) {
        http_response_code(304);
        header('ETag: ' . $etag);
        header('Last-Modified: ' . $lastModified);
        header('Cache-Control: ' . $cacheControl);
        header('Vary: Accept-Encoding');
        while (ob_get_level()) {
            ob_end_clean();
        }
        exit;
    }

    // Cabeceras de respuesta completa 200
    http_response_code(200);
    header('Content-Type: ' . $mime);
    header('Content-Length: ' . $size);
    header('Last-Modified: ' . $lastModified);
    header('ETag: ' . $etag);
    header('Cache-Control: ' . $cacheControl);
    header('Vary: Accept-Encoding');
    header('X-Content-Type-Options: nosniff');

    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'HEAD') {
        while (ob_get_level()) {
            ob_end_clean();
        }
        exit;
    }

    while (ob_get_level()) {
        ob_end_clean();
    }

    readfile($filePath);
    exit;
}

// Soft-landing: rutas desconocidas → HTML nativo de la plataforma (view-source completo).
// No es un fallback estilo Vite/React SPA: es la página PHP principal.
l8_require_html_page('index.php', true);
