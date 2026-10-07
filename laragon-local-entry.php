<?php
/**
 * Hashcod Codespace — local Laragon entry.
 *
 * Single-screen mode: local access mirrors production and serves only the
 * original first Hashcod Codespace presentation/access screen.
 */

function hashcodLaragonBasePath(): string {
    $script = str_replace('\\', '/', (string)($_SERVER['SCRIPT_NAME'] ?? ''));
    $dir = str_replace('\\', '/', dirname($script));
    $dir = trim($dir);
    if ($dir === '' || $dir === '.' || $dir === '/') {
        return '/';
    }

    $parts = array_values(array_filter(explode('/', trim($dir, '/')), static function ($part) {
        return $part !== '';
    }));
    if (!$parts) return '/';

    return '/' . implode('/', array_map('rawurlencode', $parts)) . '/';
}

require_once __DIR__ . '/security.php';
securityApplyHeaders();
require_once __DIR__ . '/mldsa-access.php';
require_once __DIR__ . '/l8-html.php';

header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate');
echo l8_apply_csp_nonce(mldsaGateHtml(hashcodLaragonBasePath(), true));
