<?php
// Stable same-origin bridge for the original access-gate runtime.
// The public loader may evolve independently, but this endpoint always serves
// the real gate implementation directly from disk so visualization add-ons
// cannot intercept or recursively reload it.
header('Content-Type: application/javascript; charset=utf-8');
header('Cache-Control: no-store, max-age=0, must-revalidate');
header('X-Content-Type-Options: nosniff');
header('Pragma: no-cache');

$path=__DIR__.'/components/mldsa-access-gate.js';
if(!is_readable($path)){
    http_response_code(503);
    echo "console.error('Hashcod access gate core unavailable');";
    exit;
}

readfile($path);
