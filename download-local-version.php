<?php
$path = __DIR__ . '/local-app/Hashcod-Codespace-Local-Installer.bat';

if (!is_file($path)) {
    http_response_code(404);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Hashcod Codespace local installer is not available.';
    exit;
}

$filename = 'Hashcod-Codespace-Local-Installer.bat';
$size = filesize($path);

header('Content-Type: application/octet-stream');
header('Content-Disposition: attachment; filename="' . $filename . '"');
header('Content-Length: ' . $size);
header('Cache-Control: no-store, no-cache, must-revalidate');
header('Pragma: no-cache');
header('X-Content-Type-Options: nosniff');

readfile($path);
exit;
