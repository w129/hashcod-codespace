<?php
/**
 * RETIRED 2026-09-14
 *
 * Hashcod Codespace no longer supports assigning HTTP/HTTPS links to the 4x4
 * Toolbox circles. This compatibility endpoint intentionally fails closed so
 * older cached clients cannot create, update, delete, unlock, or read circle
 * links after the feature has been removed from the product.
 */

if (!headers_sent()) {
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store, no-cache, must-revalidate');
    header('X-Content-Type-Options: nosniff');
}

http_response_code(410);
echo json_encode([
    'ok' => false,
    'error' => 'toolbox_circle_links_retired',
    'message' => 'La asignación de enlaces a los círculos de Toolbox fue retirada de Hashcod Codespace.',
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
exit;
