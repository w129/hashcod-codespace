<?php
declare(strict_types=1);

// Reuse authorization tests with independent uploader keys, then execute the
// real delete handler while replacing provider writes with recorded effects.
require __DIR__ . '/test-file-vault-download.php';
$tokens = token_get_all($source);
for ($i = 0; $i < count($tokens); $i++) {
    if (!is_array($tokens[$i]) || $tokens[$i][0] !== T_FUNCTION) continue;
    $name = $i + 1;
    while (is_array($tokens[$name]) && $tokens[$name][0] === T_WHITESPACE) $name++;
    if (!is_array($tokens[$name]) || $tokens[$name][1] !== 'hfvRequireSameOriginAction') continue;
    $code = ''; $depth = 0; $started = false;
    for (; $i < count($tokens); $i++) {
        $token = $tokens[$i];
        $code .= is_array($token) ? $token[1] : $token;
        if ($token === '{') { $depth++; $started = true; }
        if ($token === '}') $depth--;
        if ($started && $depth === 0) break;
    }
    eval($code);
    break;
}
function securityIsHttps(): bool { return ($_SERVER['HTTPS'] ?? '') === 'on'; }
function hfvReadJsonBody(): array { return $GLOBALS['requestBody']; }
function hfvSafeId(string $id): string { return $id; }
function hfvFindRow(array $accounts, string $id): ?array { return $GLOBALS['deleteRows'][$id] ?? null; }
function hfvDeleteStorageObject(string $object): bool { $GLOBALS['effects'][] = ['storage', $object]; return $GLOBALS['storageOk']; }
function supabaseDbDelete(string $table, string $query): array { $GLOBALS['effects'][] = ['index', $query]; return ['ok' => $GLOBALS['indexOk']]; }
function supabaseLogActivity(...$arguments): void { $GLOBALS['effects'][] = ['activity']; }

$deleteRows = [
    'fv_uploader_a' => ['id' => 'fv_uploader_a', 'account_key' => 'owner-a', 'supabase_object' => 'object-a', 'meta' => ['totp_protected' => true, 'totp_secret_cipher' => 'sealed-a']],
    'fv_uploader_b' => ['id' => 'fv_uploader_b', 'account_key' => 'owner-b', 'supabase_object' => 'object-b', 'meta' => ['totp_protected' => true, 'totp_secret_cipher' => 'sealed-b']],
    'fv_access_a' => ['id' => 'fv_access_a', 'account_key' => 'owner-a', 'supabase_object' => 'object-access', 'meta' => ['access_protection' => 'access-code', 'access_code_hash' => $accessHash]],
    'fv_legacy' => ['id' => 'fv_legacy', 'supabase_object' => 'legacy', 'meta' => []],
];
$deleteStart = strpos($source, "if (\$_SERVER['REQUEST_METHOD'] === 'POST' && \$action === 'delete')");
$handler = substr($source, $deleteStart, strrpos($source, 'hfvJson(405') - $deleteStart);
$baseServer = ['REQUEST_METHOD' => 'POST', 'HTTPS' => 'on', 'HTTP_HOST' => 'hashcodcodespace.dev', 'HTTP_ORIGIN' => 'https://hashcodcodespace.dev', 'HTTP_X_REQUESTED_WITH' => 'XMLHttpRequest'];
$storageOk = $indexOk = $rateAllowed = true;
function deleteRequest(array $body, int $status, array $server = []): array {
    global $handler, $baseServer, $requestBody, $effects;
    $effects = [];
    $requestBody = $body;
    $_SERVER = array_merge($baseServer, $server);
    $_POST = [];
    $action = 'delete'; $account = 'fallback'; $readAccounts = ['namespace'];
    try { eval($handler); }
    catch (RuntimeException $error) { downloadCheck($error->getCode() === $status, 'Unexpected deletion status: ' . $error->getCode()); return $effects; }
    throw new RuntimeException('Delete handler did not return a response');
}
foreach ([['id' => 'fv_uploader_b', 'code' => '111111', 'secret' => $uploaderKeys['sealed-a']], ['id' => 'fv_uploader_b'], ['id' => 'fv_legacy', 'code' => '222222'], ['id' => 'fv_unknown', 'code' => '222222']] as $body) {
    $status = $body['id'] === 'fv_legacy' ? 409 : ($body['id'] === 'fv_unknown' ? 404 : 401);
    downloadCheck(deleteRequest($body, $status) === [], 'Rejected TOTP must not delete cloud or index');
}
foreach ([['HTTP_X_REQUESTED_WITH' => ''], ['HTTP_ORIGIN' => 'https://unrelated.invalid'], ['HTTP_SEC_FETCH_SITE' => 'cross-site']] as $server) {
    downloadCheck(deleteRequest(['id' => 'fv_uploader_b', 'code' => '222222'], 403, $server) === [], 'Cross-origin deletion must not write');
}
$rateAllowed = false;
downloadCheck(deleteRequest(['id' => 'fv_uploader_b', 'code' => '222222'], 429) === [], 'Rate-limited deletion must not write');
$rateAllowed = true;
$valid = deleteRequest(['id' => 'fv_uploader_b', 'code' => '222222'], 200);
downloadCheck($valid[0] === ['storage', 'object-b'] && str_contains($valid[1][1], 'id=eq.fv_uploader_b&account_key=eq.owner-b'), 'Deletion must target the selected file and its owner');
$validAccess = deleteRequest(['id' => 'fv_access_a', 'code' => 'MiCodigo-Verde! 2026'], 200);
downloadCheck($validAccess[0] === ['storage', 'object-access'], 'Fixed file code must authorize deletion of its own file');
deleteRequest(['id' => 'fv_uploader_b', 'code' => '222222'], 200, ['HTTPS' => 'off', 'HTTP_HOST' => '127.0.0.1:8000', 'HTTP_ORIGIN' => 'http://127.0.0.1:8000']);
$storageOk = false;
downloadCheck(count(deleteRequest(['id' => 'fv_uploader_b', 'code' => '222222'], 502)) === 1, 'Storage failure must not remove index');
$storageOk = true; $indexOk = false;
downloadCheck(count(deleteRequest(['id' => 'fv_uploader_b', 'code' => '222222'], 502)) === 2, 'Index failure must not report success');
echo "Actual File Vault delete handler: uploader authorization precedes cloud/index writes; CSRF, legacy, rate and provider failures covered\n";
