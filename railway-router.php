<?php
/**
 * Railway public entry router.
 *
 * The full security router remains authoritative for APIs, admin routes,
 * downloads, unknown paths and all protected resources. The only exception here
 * is the public landing document, which must stay reachable even if a stale IP
 * reputation or ban record exists after migrating from Render to Railway.
 */

$rawUri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
$rawUri = is_string($rawUri) ? $rawUri : '/';
$uri = preg_replace('#^/(?:l8|l8-codespace)(?=/|$)#i', '', $rawUri);
if ($uri === '' || $uri === false) {
    $uri = '/';
}

$isRailway = trim((string)getenv('RAILWAY_ENVIRONMENT_ID')) !== '';
$isPublicLanding = in_array($uri, ['/', '/index.php', '/index.html'], true);

if ($isRailway && $isPublicLanding) {
    require_once __DIR__ . '/l8-html.php';
    l8_require_html_page('index.php', true);
}

require __DIR__ . '/router.php';
