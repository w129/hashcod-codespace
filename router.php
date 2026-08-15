<?php
// router.php — front controller PHP (HTML nativo, no Vite/React SPA)
require_once __DIR__ . '/security.php';
require_once __DIR__ . '/l8-html.php';
securityBootstrap('web');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri = is_string($uri) ? $uri : '/';

// Raíz / app principal — HTML completo en view-source (index.php)
if ($uri === '/' || $uri === '/index.php' || $uri === '/index.html') {
    l8_require_html_page('index.php', true);
}

// Páginas HTML enrutadas (nunca servir el .php crudo por allowlist)
$routedPages = [
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
];
if (isset($routedPages[$uri])) {
    $page = $routedPages[$uri];
    if (!is_file(__DIR__ . '/' . $page)) {
        // Página declarada pero ausente: volver al HTML principal (sin 404 vacío)
        l8_require_html_page('index.php', true);
    }
    l8_require_html_page($page, true);
}

// API
if (strpos($uri, '/api/') === 0 || $uri === '/cmd' || $uri === '/json') {
    require __DIR__ . '/api.php';
    exit;
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
    ];
    if (isset($mimes[$ext])) {
        header('Content-Type: ' . $mimes[$ext]);
        if (in_array($ext, ['png', 'jpg', 'jpeg', 'gif', 'webp', 'ico', 'svg', 'woff', 'woff2', 'ttf', 'wasm'], true)) {
            header('Cache-Control: public, max-age=86400');
        } else {
            header('Cache-Control: public, max-age=300');
        }
        readfile($filePath);
        exit;
    }
}

// Soft-landing: rutas desconocidas → HTML nativo de la plataforma (view-source completo).
// No es un fallback estilo Vite/React SPA: es la página PHP principal.
l8_require_html_page('index.php', true);
