<?php
declare(strict_types=1);

function securityCspNonce(): string {
    return 'TEST_CSP_NONCE_123';
}

require_once dirname(__DIR__, 2) . '/l8-html.php';

function cspCheck(bool $condition, string $message): void {
    if (!$condition) {
        fwrite(STDERR, "FAIL: {$message}\n");
        exit(1);
    }
}

$input = <<<'HTML'
<!doctype html>
<html>
<head>
<script>
const snippet = "<script data-demo='x'>";
window.__nonceParserStillValid = true;
</script>
<script src="/components/example.js"></script>
<script nonce="KEEP_ME">window.__existingNonce = true;</script>
</head>
<body></body>
</html>
HTML;

$output = l8_apply_csp_nonce($input);

cspCheck(
    substr_count($output, 'nonce="TEST_CSP_NONCE_123"') === 2,
    'nonce must be added only to the two real script elements without an existing nonce'
);
cspCheck(
    str_contains($output, 'const snippet = "<script data-demo=\'x\'>";'),
    'script-like text inside JavaScript must remain byte-for-byte unchanged'
);
cspCheck(
    !str_contains($output, 'const snippet = "<script nonce='),
    'nonce injector must never mutate a script string literal'
);
cspCheck(
    str_contains($output, '<script nonce="KEEP_ME">'),
    'existing nonce must be preserved'
);
cspCheck(
    substr_count($output, 'nonce="KEEP_ME"') === 1,
    'existing nonce must not be duplicated'
);

echo "PASS: CSP nonce injection touches only real HTML script opening tags.\n";
