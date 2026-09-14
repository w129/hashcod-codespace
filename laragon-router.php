<?php
/**
 * Router local para Laragon / PHP built-in server.
 * Mantiene las rutas del backend original pero sirve la pantalla principal desde
 * laragon-local-entry.php, que incluye la animación Rare UI usada en producción.
 */

function hashcodLaragonRouterBase(): string {
    $script = str_replace('\\', '/', (string)($_SERVER['SCRIPT_NAME'] ?? ''));
    $dir = str_replace('\\', '/', dirname($script));
    if ($dir === '' || $dir === '.' || $dir === '/') return '/';
    $parts = array_values(array_filter(explode('/', trim($dir, '/')), static function ($part) {
        return $part !== '';
    }));
    if (!$parts) return '/';
    return '/' . implode('/', array_map('rawurlencode', $parts)) . '/';
}

$base = hashcodLaragonRouterBase();
putenv('L8_PUBLIC_BASE=' . rtrim($base, '/'));
$_ENV['L8_PUBLIC_BASE'] = rtrim($base, '/');
$_SERVER['L8_PUBLIC_BASE'] = rtrim($base, '/');

$requestPath = parse_url((string)($_SERVER['REQUEST_URI'] ?? '/'), PHP_URL_PATH);
$requestPath = is_string($requestPath) ? rawurldecode($requestPath) : '/';
$baseDecoded = rawurldecode($base);
if ($baseDecoded !== '/' && strpos($requestPath, $baseDecoded) === 0) {
    $requestPath = '/' . ltrim(substr($requestPath, strlen($baseDecoded)), '/');
}
if ($requestPath === '') $requestPath = '/';

// PHP built-in server: devolver assets físicos sin pasar por el backend.
if (PHP_SAPI === 'cli-server') {
    $candidate = realpath(__DIR__ . $requestPath);
    $root = realpath(__DIR__);
    if ($candidate !== false && $root !== false && strpos($candidate, $root) === 0 && is_file($candidate)) {
        return false;
    }
}

if (in_array($requestPath, ['/', '/index.php', '/index.html', '/404.html'], true)) {
    require __DIR__ . '/laragon-local-entry.php';
    return;
}

require __DIR__ . '/router.php';
