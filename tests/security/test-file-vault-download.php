<?php
declare(strict_types=1);

// Exercise the real row-to-uploader-key authorization logic, isolating only
// cryptographic transport and HTTP exits so failures can be asserted in CLI.
$source = file_get_contents(dirname(__DIR__, 2) . '/hashcod-file-vault.php');
$wanted = ['hfvMetaArray', 'hfvTotpProtected', 'hfvTotpSecretFromRow', 'hfvTotpRateLimit', 'hfvRequireTotp'];
$tokens = token_get_all($source);
for ($i = 0; $i < count($tokens); $i++) {
    if (!is_array($tokens[$i]) || $tokens[$i][0] !== T_FUNCTION) continue;
    $name = $i + 1;
    while (is_array($tokens[$name]) && $tokens[$name][0] === T_WHITESPACE) $name++;
    if (!is_array($tokens[$name]) || !in_array($tokens[$name][1], $wanted, true)) continue;
    $code = '';
    $depth = 0;
    $started = false;
    for (; $i < count($tokens); $i++) {
        $token = $tokens[$i];
        $code .= is_array($token) ? $token[1] : $token;
        if ($token === '{') { $depth++; $started = true; }
        if ($token === '}') $depth--;
        if ($started && $depth === 0) break;
    }
    eval($code);
}

$uploaderKeys = ['sealed-a' => bin2hex(random_bytes(20)), 'sealed-b' => bin2hex(random_bytes(20))];
$expectedCodes = [$uploaderKeys['sealed-a'] => '111111', $uploaderKeys['sealed-b'] => '222222'];
$rateAllowed = true;
function hfvTotpOpenSecret(string $cipher): string { return $GLOBALS['uploaderKeys'][$cipher] ?? ''; }
function hfvTotpValidateCode(string $secret, string $code): bool { return ($GLOBALS['expectedCodes'][$secret] ?? '') === $code; }
function securityRateAllowSliding($bucket, $limit, $period): array { return ['allowed' => $GLOBALS['rateAllowed']]; }
function hfvJson(int $status, array $payload): void { throw new RuntimeException($payload['error'] ?? 'HTTP response', $status); }
function downloadCheck(bool $condition, string $message): void { if (!$condition) throw new RuntimeException($message); }
function expectDownloadStatus(array $row, string $code, int $status): void {
    try { hfvRequireTotp($row, $code, true); }
    catch (RuntimeException $error) { downloadCheck($error->getCode() === $status, 'Wrong authorization status'); return; }
    throw new RuntimeException('Unverified download was allowed');
}

$rowA = ['id' => 'fv_uploader_a', 'meta' => ['totp_protected' => true, 'totp_secret_cipher' => 'sealed-a']];
$rowB = ['id' => 'fv_uploader_b', 'meta' => ['totp_protected' => true, 'totp_secret_cipher' => 'sealed-b']];
hfvRequireTotp($rowA, '111111', true);
hfvRequireTotp($rowB, '222222', true);
expectDownloadStatus($rowA, '222222', 401);
expectDownloadStatus($rowB, '111111', 401);
expectDownloadStatus($rowA, '', 401);
expectDownloadStatus($rowA, '000000', 401);
expectDownloadStatus(['id' => 'fv_legacy_file', 'meta' => []], '111111', 409);
$rowA['meta']['totp_secret_cipher'] = 'corrupted';
expectDownloadStatus($rowA, '111111', 401);
$rateAllowed = false;
expectDownloadStatus($rowB, '222222', 429);

downloadCheck(str_contains($source, "hfvRequireTotp(\$row, (string)(\$body['code'] ?? ''), true)"), 'POST downloads must require stored uploader protection');
$getHandler = substr($source, strpos($source, "if (\$_SERVER['REQUEST_METHOD'] === 'GET' && \$action === 'download')"));
$getHandler = substr($getHandler, 0, strpos($getHandler, "if (\$_SERVER['REQUEST_METHOD'] === 'POST'"));
downloadCheck(!str_contains($getHandler, 'hfvStreamRow(') && str_contains($getHandler, 'hfvJson(405'), 'GET downloads must never release file bytes');
echo "File Vault download authorization uses each uploader key and rejects legacy, wrong, missing and rate-limited codes\n";
