<?php
declare(strict_types=1);

putenv('L8_VAULT_MASTER_KEY=' . str_repeat('a', 64));

require dirname(__DIR__, 2) . '/resilient-proxy.php';
require dirname(__DIR__, 2) . '/secrets.php';

function checkBoundary(bool $ok, string $name): void {
    if (!$ok) {
        throw new RuntimeException('FAIL: ' . $name);
    }
    echo "[OK] $name\n";
}

checkBoundary(resilientProxyValidateUrl('https://api.osv.dev/v1/querybatch'), 'trusted HTTPS provider allowed');
checkBoundary(!resilientProxyValidateUrl('http://api.osv.dev/v1/querybatch'), 'plain HTTP rejected');
checkBoundary(!resilientProxyValidateUrl('https://localhost/admin'), 'localhost rejected');
checkBoundary(!resilientProxyValidateUrl('https://127.0.0.1/admin'), 'loopback IPv4 rejected');
checkBoundary(!resilientProxyValidateUrl('https://169.254.169.254/latest/meta-data'), 'link-local metadata endpoint rejected');
checkBoundary(!resilientProxyValidateUrl('https://1.1.1.1/'), 'public IP literal rejected');
checkBoundary(!resilientProxyValidateUrl('https://[::1]/admin'), 'loopback IPv6 rejected');
checkBoundary(!resilientProxyValidateUrl('https://user:pass@api.osv.dev/v1/querybatch'), 'URL credentials rejected');
checkBoundary(!resilientProxyValidateUrl('https://example.invalid/resource'), 'unknown provider rejected');

$encrypted = secretsEncrypt('security-regression-secret');
checkBoundary(str_starts_with($encrypted, 'l8e1:'), 'new secret uses AES-256-GCM envelope');
checkBoundary(secretsDecrypt($encrypted) === 'security-regression-secret', 'AES-256-GCM secret round trip');

echo "outbound and encryption security boundaries: OK\n";
