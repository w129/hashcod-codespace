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

// Reenviar peticiones API a api.php
if (strpos($uri, '/api/') === 0 || $uri === '/cmd' || $uri === '/json') {
    require __DIR__ . '/api.php';
    exit;
}

// Si se solicita un archivo estático físico existente (imágenes, logo, etc.)
$filePath = __DIR__ . $uri;
if (file_exists($filePath) && !is_dir($filePath)) {
    return false;
}

// Cargar por defecto index.php para cualquier otra ruta
require __DIR__ . '/index.php';
exit;
