<?php
/**
 * TipTap Word-like document window.
 * Serves the built TipTap app (ueberdosis/tiptap).
 */
require_once __DIR__ . '/security.php';
securityBootstrap('web');

$buildIndex = __DIR__ . '/tiptap_editor/frontend/build/index.html';
if (!is_file($buildIndex)) {
    http_response_code(503);
    header('Content-Type: text/html; charset=utf-8');
    echo '<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>TipTap · l8</title></head><body>';
    echo '<p>TipTap no está compilado. Ejecuta <code>npm install && npm run build</code> en <code>tiptap_editor/frontend</code>.</p>';
    echo '</body></html>';
    exit;
}

$html = (string) file_get_contents($buildIndex);
// Ensure title/favicon for the window
if (strpos($html, '<title>') !== false) {
    $html = preg_replace(
        '#<title>.*?</title>#',
        '<title>TipTap · Documento · l8</title>',
        $html,
        1
    );
}
if (strpos($html, 'rel="icon"') === false) {
    $html = str_replace(
        '</head>',
        '<link rel="icon" href="/tiptap-dock.svg" type="image/svg+xml">' . "\n</head>",
        $html
    );
}

header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-store, max-age=0, must-revalidate');
echo $html;
