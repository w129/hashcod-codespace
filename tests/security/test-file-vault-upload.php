<?php
declare(strict_types=1);

// Load the actual pure controller functions without invoking the HTTP handler.
$source = file_get_contents(dirname(__DIR__, 2) . '/hashcod-file-vault-fast-upload.php');
$wanted = ['hfvuMime', 'hfvuSameOrigin', 'hfvuB64uEncode', 'hfvuB64uDecode', 'hfvuSecret', 'hfvuTicketKey', 'hfvuMakeTicket', 'hfvuOpenTicket'];
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

$testSecret = random_bytes(32);
function mldsaAccessSecret(): string { return $GLOBALS['testSecret']; }
function securityIsHttps(): bool { return ($_SERVER['HTTPS'] ?? '') === 'on'; }
function checkUpload(bool $condition, string $message): void {
    if (!$condition) throw new RuntimeException($message);
}
set_error_handler(static function ($severity, $message) { throw new RuntimeException($message); });

foreach (['application/pdf', 'application/zip', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'image/png', 'application/octet-stream'] as $mime) {
    checkUpload(hfvuMime($mime) === $mime, 'Valid file MIME rejected: ' . $mime);
}
foreach (['', 'invalid', 'text/html; charset=utf-8', "application/pdf\r\nInjected: true"] as $mime) {
    checkUpload(hfvuMime($mime) === 'application/octet-stream', 'Invalid MIME must use safe fallback');
}

foreach (['hashcodcodespace.dev', '127.0.0.1:8000', 'localhost:8080'] as $host) {
    $scheme = $host === 'hashcodcodespace.dev' ? 'https' : 'http';
    $_SERVER = ['HTTP_HOST' => $host, 'HTTP_ORIGIN' => $scheme . '://' . $host, 'HTTP_X_REQUESTED_WITH' => 'XMLHttpRequest', 'HTTPS' => $scheme === 'https' ? 'on' : 'off'];
    checkUpload(hfvuSameOrigin(), 'Hosted/desktop origin must be accepted');
    $_SERVER['HTTP_ORIGIN'] = ($scheme === 'https' ? 'http' : 'https') . '://' . $host;
    checkUpload(!hfvuSameOrigin(), 'Different origin scheme must be rejected');
    $_SERVER['HTTP_ORIGIN'] = 'https://unrelated.invalid';
    checkUpload(!hfvuSameOrigin(), 'Cross-origin request must be rejected');
    unset($_SERVER['HTTP_ORIGIN']);
    checkUpload(hfvuSameOrigin(), 'Same-origin clients without Origin must be supported');
    $_SERVER['HTTP_SEC_FETCH_SITE'] = 'cross-site';
    checkUpload(!hfvuSameOrigin(), 'Cross-site request must be rejected');
    unset($_SERVER['HTTP_SEC_FETCH_SITE'], $_SERVER['HTTP_X_REQUESTED_WITH']);
    checkUpload(!hfvuSameOrigin(), 'Missing AJAX marker must be rejected');
}

$payload = ['kind' => 'hfv-direct-upload-v1', 'id' => 'fv_uploadtest123', 'exp' => time() + 60];
$ticket = hfvuMakeTicket($payload);
checkUpload(hfvuOpenTicket($ticket) === $payload, 'Valid signed completion ticket must survive round trip');
$parts = explode('.', $ticket);
$parts[0] = hfvuB64uEncode(json_encode(array_merge($payload, ['id' => 'fv_tampered123'])));
checkUpload(hfvuOpenTicket(implode('.', $parts)) === null, 'Tampered ticket must be rejected');
checkUpload(hfvuOpenTicket(hfvuMakeTicket(array_merge($payload, ['exp' => time() - 10]))) === null, 'Expired ticket must be rejected');
checkUpload(hfvuOpenTicket(hfvuMakeTicket(array_merge($payload, ['kind' => 'other']))) === null, 'Wrong ticket kind must be rejected');
echo "File Vault MIME, hosted/desktop origins and signed completion tickets OK\n";
