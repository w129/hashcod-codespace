<?php
/**
 * Hashcod Public Chat — retired.
 *
 * The top-bar launcher and public-chat tool were intentionally removed.
 * Keep this endpoint as a fail-closed tombstone so stale clients cannot
 * continue reading or publishing messages through an old cached UI.
 */

if (!headers_sent()) {
    http_response_code(410);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store, no-cache, must-revalidate');
}

echo json_encode([
    'ok' => false,
    'retired' => true,
    'error' => 'Public Chat has been retired from Hashcod Codespace.'
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
exit;
