<?php
/**
 * auditor_1 custom forensic integrity validation script
 */

require_once __DIR__ . '/secrets.php';
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/security.php';
require_once __DIR__ . '/cloudflare-turnstile.php';

$results = [];
function check($name, $condition, $details = '') {
    global $results;
    if ($condition) {
        $results[] = ['name' => $name, 'status' => 'PASS', 'details' => $details];
        echo "  ✓ PASS: $name\n";
    } else {
        $results[] = ['name' => $name, 'status' => 'FAIL', 'details' => $details];
        echo "  ✗ FAIL: $name ($details)\n";
    }
}

echo "========================================================\n";
echo "  AUDITOR_1 FORENSIC INTEGRITY CRYPTOGRAPHIC AUDIT SUITE\n";
echo "========================================================\n\n";

// 1. Password Hashing & Argon2id Pepper Verification
echo "[Check 1] Argon2id & HMAC Pepper Hashing...\n";
$pwd = 'Enterprise_SecPass_2026!#$';
$hash = authHashPassword($pwd);
check('Argon2id format prefix', strpos($hash, '$argon2id$') === 0, "Hash: " . substr($hash, 0, 30) . "...");
check('Password verification success', authVerifyPassword($pwd, $hash) === true);
check('Wrong password verification rejection', authVerifyPassword($pwd . '_wrong', $hash) === false);
check('Empty password rejection', authVerifyPassword('', $hash) === false);

// 2. AES-256-GCM Field Encryption & Decryption
echo "\n[Check 2] AES-256-GCM Authenticated Encryption...\n";
$secretPayload = 'sensitive_api_token_sk_live_99887766554433221100';
$enc = secretsEncrypt($secretPayload);
check('AES-256-GCM prefix (l8e1:)', strpos($enc, 'l8e1:') === 0, "Encrypted: " . substr($enc, 0, 30) . "...");
$dec = secretsDecrypt($enc);
check('Decrypted payload matches plaintext', $dec === $secretPayload);

// Custom key encryption
$customKey = random_bytes(32);
$encCustom = secretsEncrypt($secretPayload, $customKey);
$decCustom = secretsDecrypt($encCustom, $customKey);
check('Custom key encryption and decryption', $decCustom === $secretPayload);

// Tamper test: Corrupted ciphertext
$parts = explode(':', $enc);
if (count($parts) === 4) {
    $corruptedParts = $parts;
    $corruptedParts[3] = base64_encode(base64_decode($parts[3]) ^ "\xFF");
    $corruptedBlob = implode(':', $corruptedParts);
    $tamperDec = secretsDecrypt($corruptedBlob);
    check('Tampered ciphertext rejection (fails authenticated GCM tag check)', $tamperDec === '' || $tamperDec === null);
}

// Tamper test: Corrupted GCM tag
if (count($parts) === 4) {
    $corruptedParts = $parts;
    $corruptedParts[2] = base64_encode(base64_decode($parts[2]) ^ "\x01");
    $corruptedTagBlob = implode(':', $corruptedParts);
    $tamperTagDec = secretsDecrypt($corruptedTagBlob);
    check('Tampered auth tag rejection', $tamperTagDec === '' || $tamperTagDec === null);
}

// 3. Dilithium-5 Register Key Dynamic Resolution & Fail-Closed Behavior
echo "\n[Check 3] Dilithium-5 Fail-Closed Verification...\n";
$verifyNoKey = authVerifyDilithium('dummy_sig_attempt');
check('Fail-closed when no key configured', !empty($verifyNoKey['error']) && $verifyNoKey['ok'] === false);

// 4. Magic Byte File Upload Validator
echo "\n[Check 4] Magic-Byte & Executable Blacklist Inspection...\n";
check('Allow safe PNG upload', securityUploadMimeAllowed('image/png', 'photo.png', "\x89PNG\r\n\x1a\n") === true);
check('Block PHP extension upload', securityUploadMimeAllowed('image/jpeg', 'shell.php', "\xFF\xD8\xFF") === false);
check('Block executable extension .exe', securityUploadMimeAllowed('application/octet-stream', 'payload.exe', "MZ") === false);
check('Block ELF binary magic byte (\\x7fELF)', securityUploadMimeAllowed('application/octet-stream', 'innocent.dat', "\x7fELF\x02\x01\x01\x00") === false);
check('Block Windows PE magic byte (MZ)', securityUploadMimeAllowed('application/octet-stream', 'image.jpg', "MZ\x90\x00\x03\x00\x00\x00") === false);
check('Block PHP tag in sample bytes (<?php)', securityUploadMimeAllowed('text/plain', 'doc.txt', "<?php system(\$_GET['c']); ?>") === false);
check('Block Shebang shell script (#!/bin/sh)', securityUploadMimeAllowed('text/plain', 'script.txt', "#!/bin/bash\nrm -rf /") === false);

// 5. Cloudflare Turnstile Clearance Token Verification
echo "\n[Check 5] Cloudflare Turnstile HMAC Clearance Token...\n";
$testIp = '203.0.113.195';
$clearanceToken = cfGenerateClearanceToken($testIp, 300);
check('Clearance token format (dot separator)', strpos($clearanceToken, '.') !== false);
check('Valid clearance token passes validation', cfValidateClearanceToken($clearanceToken, $testIp) === true);
check('Wrong IP clearance token rejected', cfValidateClearanceToken($clearanceToken, '198.51.100.22') === false);

// Tampered clearance token
list($cEnc, $cSig) = explode('.', $clearanceToken);
$tamperedClearance = $cEnc . '.' . hash('sha256', 'forged_sig');
check('Forged clearance token rejected', cfValidateClearanceToken($tamperedClearance, $testIp) === false);

// 6. Sliding Rate Limiter
echo "\n[Check 6] Sliding Window Rate Limiting...\n";
$testBucket = 'test_auditor_bucket_' . bin2hex(random_bytes(4));
$r1 = securityRateAllowSliding($testBucket, 3, 10, '192.0.2.100');
check('Request 1 allowed', $r1['allowed'] === true && $r1['remaining'] >= 1);
$r2 = securityRateAllowSliding($testBucket, 3, 10, '192.0.2.100');
check('Request 2 allowed', $r2['allowed'] === true);
$r3 = securityRateAllowSliding($testBucket, 3, 10, '192.0.2.100');
check('Request 3 allowed', $r3['allowed'] === true);
$r4 = securityRateAllowSliding($testBucket, 3, 10, '192.0.2.100');
check('Request 4 rejected (limit exceeded)', $r4['allowed'] === false);

// 7. Secret Redaction Test
echo "\n[Check 7] Secret Redaction Filter...\n";
$sampleLog = "Error connecting with ghp_1234567890abcdefghijklmnopqrstuvwxyz and github_pat_11AAAAAAA_bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
$redacted = securityRedactSecrets($sampleLog);
check('GitHub PAT redacted', strpos($redacted, 'github_pat_****************************') !== false);
check('GitHub personal token redacted', strpos($redacted, 'ghp_****************************') !== false);

$allPassed = true;
foreach ($results as $r) {
    if ($r['status'] !== 'PASS') $allPassed = false;
}

echo "\n========================================================\n";
echo "  AUDIT RESULTS: " . count($results) . " CHECKS PERFORMED\n";
echo "  ALL CHECKS PASSED: " . ($allPassed ? "YES (100% VERIFIED)" : "NO (FAILURES FOUND)") . "\n";
echo "========================================================\n";

exit($allPassed ? 0 : 1);
