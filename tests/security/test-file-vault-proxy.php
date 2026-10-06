<?php
declare(strict_types=1);
foreach (['security.php' => ['securityIsHttps', 'securityIpInCidr', 'securityIsTrustedProxy', 'securityClientIp', 'securityIpBanPath', 'securityIpIsBanned', 'securityIpBan'], 'hashcod-file-vault-fast-upload.php' => ['hfvuSameOrigin'], 'hashcod-file-vault.php' => ['hfvRequireSameOriginAction']] as $file => $wanted) {
    $tokens = token_get_all(file_get_contents(dirname(__DIR__, 2) . '/' . $file));
    for ($i = 0; $i < count($tokens); $i++) {
        if (!is_array($tokens[$i]) || $tokens[$i][0] !== T_FUNCTION) continue;
        $name = $i + 1;
        while (is_array($tokens[$name]) && $tokens[$name][0] === T_WHITESPACE) $name++;
        if (!is_array($tokens[$name]) || !in_array($tokens[$name][1], $wanted, true)) continue;
        $code = ''; $depth = 0; $started = false;
        for (; $i < count($tokens); $i++) {
            $token = $tokens[$i]; $code .= is_array($token) ? $token[1] : $token;
            if ($token === '{') { $depth++; $started = true; }
            if ($token === '}') $depth--;
            if ($started && $depth === 0) break;
        }
        eval($code);
    }
}
function hfvJson(int $status, array $body): void { throw new RuntimeException($body['error'], $status); }
function proxyCheck(bool $condition, string $message): void { if (!$condition) throw new RuntimeException($message); }
function actionAllowed(): bool { try { hfvRequireSameOriginAction(); return true; } catch (RuntimeException $error) { proxyCheck($error->getCode() === 403, 'Wrong origin status'); return false; } }
$base = ['REMOTE_ADDR' => '127.0.0.1', 'HTTP_HOST' => 'hashcodcodespace.dev', 'HTTPS' => 'off', 'SERVER_PORT' => 8001, 'HTTP_X_FORWARDED_PROTO' => 'http', 'HTTP_X_L8_RAILWAY_PROTO' => 'https', 'HTTP_ORIGIN' => 'https://hashcodcodespace.dev', 'HTTP_X_REQUESTED_WITH' => 'XMLHttpRequest', 'HTTP_SEC_FETCH_SITE' => 'same-origin'];
putenv('RAILWAY_ENVIRONMENT_ID=proxy-fixture');
$_SERVER = $base;
proxyCheck(securityIsHttps(), 'Railway HTTPS must survive the internal HTTP hop');
proxyCheck(hfvuSameOrigin() && actionAllowed(), 'Uploader/download/delete origin rejected behind Railway');
$_SERVER = array_merge($base, ['HTTP_X_L8_RAILWAY_REAL_IP' => '198.51.100.10', 'HTTP_X_FORWARDED_FOR' => '198.51.100.99']);
proxyCheck(securityClientIp() === '198.51.100.10', 'Railway edge IP must be used instead of forwarding chains');
$_SERVER = array_merge($base, ['REMOTE_ADDR' => '203.0.113.7', 'HTTP_X_L8_RAILWAY_REAL_IP' => '198.51.100.10']);
proxyCheck(securityClientIp() === '203.0.113.7', 'Private IP metadata must be ignored from a public remote');
$_SERVER = array_merge($base, ['HTTP_X_L8_RAILWAY_REAL_IP' => '198.51.100.10, 198.51.100.99']);
proxyCheck(securityClientIp() === '127.0.0.1', 'Malformed private IP header must not authorize a visitor');
$_SERVER = array_merge($base, ['REMOTE_ADDR' => '::1']);
proxyCheck(securityIsHttps() && hfvuSameOrigin() && actionAllowed(), 'IPv6 loopback must preserve Railway HTTPS');
foreach (['', 'http', 'https, http', 'https://hashcodcodespace.dev'] as $protocol) {
    $_SERVER = array_merge($base, ['HTTP_X_L8_RAILWAY_PROTO' => $protocol]);
    proxyCheck(!securityIsHttps() && !hfvuSameOrigin() && !actionAllowed(), 'Invalid edge protocol must not authorize HTTPS');
}
foreach ([['HTTP_ORIGIN' => 'https://unrelated.invalid'], ['HTTP_ORIGIN' => 'http://hashcodcodespace.dev'], ['HTTP_SEC_FETCH_SITE' => 'cross-site'], ['HTTP_X_REQUESTED_WITH' => '']] as $overrides) {
    $_SERVER = array_merge($base, $overrides);
    proxyCheck(!hfvuSameOrigin() && !actionAllowed(), 'A different origin must remain blocked');
}
foreach (['203.0.113.7', '10.0.0.7'] as $remote) {
    $_SERVER = array_merge($base, ['REMOTE_ADDR' => $remote]);
    proxyCheck(!securityIsHttps() && !hfvuSameOrigin() && !actionAllowed(), 'Private hop metadata must be ignored outside loopback');
}
$_SERVER = $base;
putenv('RAILWAY_ENVIRONMENT_ID');
proxyCheck(!securityIsHttps(), 'Railway metadata must be ignored outside Railway');
$_SERVER['HTTP_X_L8_RAILWAY_REAL_IP'] = '198.51.100.10';
proxyCheck(securityClientIp() === '127.0.0.1', 'Railway private IP metadata must be ignored outside Railway');
$_SERVER = ['REMOTE_ADDR' => '127.0.0.1', 'HTTP_HOST' => '127.0.0.1:8000', 'HTTP_ORIGIN' => 'http://127.0.0.1:8000', 'HTTP_X_REQUESTED_WITH' => 'XMLHttpRequest', 'HTTPS' => 'off'];
proxyCheck(!securityIsHttps() && hfvuSameOrigin() && actionAllowed(), 'Desktop HTTP loopback must still work');
$_SERVER = array_merge($base, ['HTTPS' => 'on']);
proxyCheck(securityIsHttps() && hfvuSameOrigin(), 'Direct TLS must still work');
$_SERVER = array_merge($base, ['HTTP_X_FORWARDED_PROTO' => 'https']);
proxyCheck(securityIsHttps() && hfvuSameOrigin(), 'Existing forwarded HTTPS must still work');
echo "File Vault Railway HTTPS origins accepted; cross-origin, spoofed private headers and desktop behavior covered\n";
