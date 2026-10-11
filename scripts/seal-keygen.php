<?php
/**
 * Generates an Ed25519 issuer key for the constancia tool. Run it on the machine that will hold the key.
 *
 *   php scripts/seal-keygen.php [key-id]
 *
 * Prints the secret seed (set it as HASHCOD_SEAL_ED25519_SEED_B64 in Railway; never commit it) and the public
 * multikey that did.json will publish. The secret appears only on this terminal: copy it, then clear the screen.
 */
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
putenv('HASHCOD_SEAL_ED25519_SEED_B64=' . ($seed64 = base64_encode($seed = random_bytes(SODIUM_CRYPTO_SIGN_SEEDBYTES))));
require __DIR__ . '/../constancia-lib.php';
$keyId = $argv[1] ?? 'key-' . gmdate('Y') . '-01';
if (!preg_match('/^[A-Za-z0-9._-]{3,60}$/', $keyId)) { fwrite(STDERR, "Invalid key id\n"); exit(1); }
$public = constanciaMultikey(sodium_crypto_sign_publickey(sodium_crypto_sign_seed_keypair($seed)));
echo "HASHCOD_SEAL_KEY_ID=$keyId\n";
echo "HASHCOD_SEAL_ED25519_SEED_B64=$seed64   <-- SECRET: Railway variable only\n\n";
echo "Public key (did.json verificationMethod): $public\n";
echo "When this key is later rotated out, keep its public entry in config/seal-did-keys.json so old constancias still verify:\n";
echo json_encode([['id' => $keyId, 'publicKeyMultibase' => $public, 'active' => false]], JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT) . "\n";
sodium_memzero($seed);
