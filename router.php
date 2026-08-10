<?php
// router.php - Enrutador PHP nativo robusto para servidor local y producción
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: *');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Si se solicita la raíz '/', '/index.php' o '/index.html', servir siempre la app principal
if ($uri === '/' || $uri === '/index.php' || $uri === '/index.html') {
    require __DIR__ . '/index.php';
    exit;
}

// Gateway receptor (teléfono / dispositivo)
if ($uri === '/gateway' || $uri === '/gateway.php') {
    require __DIR__ . '/gateway.php';
    exit;
}

// Ubuntu CLI externa (boxcutter/ubuntu)
if ($uri === '/ubuntu' || $uri === '/ubuntu-cli' || $uri === '/ubuntu-cli.php') {
    require __DIR__ . '/ubuntu-cli.php';
    exit;
}

// Claude Code externa (anthropics/claude-code-action + OAuth)
if ($uri === '/claude' || $uri === '/claude-cli' || $uri === '/claude-code' || $uri === '/claude-cli.php') {
    require __DIR__ . '/claude-cli.php';
    exit;
}

// Zylon / PrivateGPT externa (zylon-ai/private-gpt)
if ($uri === '/zylon' || $uri === '/zylon-cli' || $uri === '/private-gpt' || $uri === '/zylon-cli.php') {
    require __DIR__ . '/zylon-cli.php';
    exit;
}

// PRS Code — IDE paste/share externo (thin client)
if ($uri === '/prs-code' || $uri === '/prs_code' || $uri === '/prs' || $uri === '/prs-code.php') {
    require __DIR__ . '/prs-code.php';
    exit;
}

// macOS inside externa (dockur/macos)
if ($uri === '/macos' || $uri === '/macos-cli' || $uri === '/macos_inside' || $uri === '/macOS_inside' || $uri === '/macos-cli.php') {
    require __DIR__ . '/macos-cli.php';
    exit;
}

// ChromeOS play externa (dockur/chromeos)
if ($uri === '/chromeos' || $uri === '/chromeos-cli' || $uri === '/chromeos_play' || $uri === '/chromeOS_play' || $uri === '/chromeos-cli.php') {
    require __DIR__ . '/chromeos-cli.php';
    exit;
}

// Reenviar peticiones API a api.php
if (strpos($uri, '/api/') === 0 || $uri === '/cmd' || $uri === '/json') {
    require __DIR__ . '/api.php';
    exit;
}

// Si se solicita un archivo estático físico existente (imágenes, logo, components, etc.)
$filePath = __DIR__ . $uri;
if (file_exists($filePath) && !is_dir($filePath)) {
    // MIME básica para assets de la plataforma
    $ext = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
    if ($ext === 'js') {
        header('Content-Type: application/javascript; charset=utf-8');
        readfile($filePath);
        exit;
    }
    if ($ext === 'svg') {
        header('Content-Type: image/svg+xml; charset=utf-8');
        header('Cache-Control: public, max-age=3600');
        readfile($filePath);
        exit;
    }
    if ($ext === 'tsx' || $ext === 'jsx' || $ext === 'ts') {
        header('Content-Type: text/plain; charset=utf-8');
        readfile($filePath);
        exit;
    }
    return false;
}

// Cargar por defecto index.php para cualquier otra ruta
require __DIR__ . '/index.php';
exit;
