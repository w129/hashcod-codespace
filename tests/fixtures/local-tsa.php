<?php
/** Test-only RFC 3161 time-stamp authority backed by `openssl ts -reply`. Usage: php -S 127.0.0.1:PORT tests/fixtures/local-tsa.php (env TSA_DIR). */
$dir = getenv('TSA_DIR');
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST' || !$dir) { http_response_code(405); exit; }
$q = tempnam($dir, 'q'); $r = tempnam($dir, 'r');
file_put_contents($q, file_get_contents('php://input'));
exec('openssl ts -reply -queryfile ' . escapeshellarg($q) . ' -config ' . escapeshellarg($dir . '/tsa.cnf') . ' -out ' . escapeshellarg($r) . ' 2>&1', $o, $code);
header('Content-Type: application/timestamp-reply');
echo $code === 0 ? file_get_contents($r) : '';
@unlink($q); @unlink($r);
