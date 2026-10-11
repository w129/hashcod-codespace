<?php
/**
 * Prints the SHA-256 that identifies a signature accepted by the constancia tool, so only the hash (never the
 * signature) is stored in the server configuration:
 *
 *   php scripts/seal-signature-hash.php < firma.txt          # or: pbpaste | php scripts/seal-signature-hash.php
 *
 * Put the printed value in HASHCOD_SEAL_ACCESS_SIGNATURE_SHA256 (several hashes separated by commas are allowed).
 */
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
require __DIR__ . '/../constancia-lib.php';
$raw = constanciaNormalizeSignature((string)stream_get_contents(STDIN));
if ($raw === null) { fwrite(STDERR, "Not a base64 signature.\n"); exit(1); }
echo hash('sha256', $raw) . "\n";
