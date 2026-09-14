<?php
$assetUrl = 'https://github.com/w129/hashcod-codespace/releases/download/desktop-latest/Hashcod-Codespace-Setup.exe';

// The local edition is now distributed as a real Windows desktop installer.
// Keep this endpoint stable so existing UI links do not need to know where the
// binary is published. GitHub Releases provides the final executable payload.
foreach ([
    'Content-Security-Policy',
    'Cross-Origin-Opener-Policy',
    'Cross-Origin-Resource-Policy',
    'X-Frame-Options',
    'ETag',
    'Last-Modified',
] as $headerName) {
    header_remove($headerName);
}

http_response_code(302);
header('Location: ' . $assetUrl);
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');
header('X-Content-Type-Options: nosniff');
header('Content-Disposition: attachment; filename="Hashcod-Codespace-Setup.exe"');
exit;
