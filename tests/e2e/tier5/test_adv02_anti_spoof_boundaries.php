<?php
declare(strict_types=1);

namespace Hashcod\Tests\Tier5;

use Hashcod\Tests\Support\TestSuite;
use Hashcod\Tests\Support\TestAssertions as Assert;
use Hashcod\Tests\Support\TestHarness;

class TestAdv02AntiSpoofBoundaries extends TestSuite
{
    protected string $tier = 'Tier 5';
    protected string $suiteName = 'ADV2: Adversarial IP Spoofing Resilience & CIDR Proxy Validation';

    public function setUp(): void
    {
        if (file_exists(__DIR__ . '/../../../security.php')) {
            require_once __DIR__ . '/../../../security.php';
        }
    }

    public function testUntrustedDirectRemoteAddrIgnoresXForwardedFor(): void
    {
        // Attacker connecting directly from untrusted public IP
        $attackerSocketIp = '198.51.100.99';
        $forgedClientIp = '1.1.1.1';

        TestHarness::simulateRequest('GET', '/api/test', [
            'X-Forwarded-For' => $forgedClientIp,
            'CF-Connecting-IP' => $forgedClientIp,
            'X-Real-IP' => $forgedClientIp
        ], null, ['REMOTE_ADDR' => $attackerSocketIp]);

        $resolved = securityClientIp();
        Assert::assertEquals($attackerSocketIp, $resolved, "Forged IP headers from untrusted socket must be ignored; resolve to direct REMOTE_ADDR");
    }

    public function testTrustedCloudflareProxyPermitsHeaderResolution(): void
    {
        // Connection coming from valid Cloudflare edge CIDR (e.g. 172.64.0.1 in 172.64.0.0/13)
        $cfProxyIp = '172.64.10.5';
        $realClientIp = '203.0.113.88';

        TestHarness::simulateRequest('GET', '/api/test', [
            'CF-Connecting-IP' => $realClientIp,
            'X-Forwarded-For' => $realClientIp . ', ' . $cfProxyIp
        ], null, ['REMOTE_ADDR' => $cfProxyIp]);

        $resolved = securityClientIp();
        Assert::assertEquals($realClientIp, $resolved, "Trusted Cloudflare proxy must allow extraction of real client IP");
    }

    public function testTrustedLocalPrivateSubnetPermitsHeaderResolution(): void
    {
        // Connection coming from internal Docker / reverse proxy subnet (10.0.0.2 in 10.0.0.0/8)
        $dockerProxyIp = '10.0.1.50';
        $realClientIp = '198.51.100.40';

        TestHarness::simulateRequest('GET', '/api/test', [
            'X-Forwarded-For' => $realClientIp
        ], null, ['REMOTE_ADDR' => $dockerProxyIp]);

        $resolved = securityClientIp();
        Assert::assertEquals($realClientIp, $resolved, "Internal reverse proxy in 10.0.0.0/8 must allow extraction of client IP");
    }

    public function testCidrMatchingAccuracyIpv4AndIpv6(): void
    {
        // IPv4 tests
        Assert::assertTrue(securityIpInCidr('173.245.48.50', '173.245.48.0/20'), "Cloudflare IPv4 CIDR match");
        Assert::assertFalse(securityIpInCidr('173.245.64.1', '173.245.48.0/20'), "Outside Cloudflare IPv4 CIDR");

        // IPv6 tests
        Assert::assertTrue(securityIpInCidr('2400:cb00:2048:1::c629:d7a2', '2400:cb00::/32'), "Cloudflare IPv6 CIDR match");
        Assert::assertFalse(securityIpInCidr('2001:db8::1', '2400:cb00::/32'), "Outside Cloudflare IPv6 CIDR");
    }

    public function testHeaderInjectionAndNullByteSafety(): void
    {
        $maliciousHeaders = [
            "1.2.3.4\r\nInjected-Header: evil",
            "1.2.3.4\0evil",
            "1.2.3.4; shutdown --now",
            "not_an_ip"
        ];

        foreach ($maliciousHeaders as $bad) {
            TestHarness::simulateRequest('GET', '/api/test', [
                'X-Forwarded-For' => $bad
            ], null, ['REMOTE_ADDR' => '127.0.0.1']);

            $resolved = securityClientIp();
            Assert::assertTrue(
                filter_var($resolved, FILTER_VALIDATE_IP) !== false,
                "Resolved IP must always be a valid sanitized IP without injection payload"
            );
        }
    }
}
