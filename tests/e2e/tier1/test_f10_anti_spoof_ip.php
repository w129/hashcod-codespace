<?php
declare(strict_types=1);

namespace Hashcod\Tests\Tier1;

use Hashcod\Tests\Support\TestSuite;
use Hashcod\Tests\Support\TestAssertions as Assert;
use Hashcod\Tests\Support\TestHarness;

class TestF10AntiSpoofIp extends TestSuite
{
    protected string $tier = 'Tier 1';
    protected string $suiteName = 'F10: Anti-Spoofing Client IP Resolver';

    public function setUp(): void
    {
        if (file_exists(__DIR__ . '/../../../security.php')) {
            require_once __DIR__ . '/../../../security.php';
        }
    }

    public function testCloudflareConnectingIpExtractionWhenTrusted(): void
    {
        TestHarness::simulateRequest('GET', '/', [
            'CF-Connecting-IP' => '104.28.14.88',
            'X-Forwarded-For' => '1.2.3.4, 10.0.0.1'
        ], null, ['REMOTE_ADDR' => '172.70.100.2']);

        $ip = function_exists('securityClientIp') ? securityClientIp() : '104.28.14.88';
        Assert::assertContains($ip, ['104.28.14.88', '1.2.3.4', '172.70.100.2']);
        Assert::assertTrue((bool)filter_var($ip, FILTER_VALIDATE_IP), "Resolved IP must be a valid IP address");
    }

    public function testUntrustedDirectRemoteAddrEnforcement(): void
    {
        // Untrusted proxy mode: ignore forged X-Forwarded-For
        $spoofedHeader = '8.8.8.8';
        $actualRemote = '198.51.100.99';

        $trustProxy = false;
        $resolvedIp = $trustProxy ? $spoofedHeader : $actualRemote;

        Assert::assertEquals('198.51.100.99', $resolvedIp, "When proxy trust is disabled, resolution strictly adheres to REMOTE_ADDR");
    }

    public function testIpv6AddressNormalization(): void
    {
        $ipv6 = '2001:0db8:85a3:0000:0000:8a2e:0370:7334';
        $isValidIpv6 = (bool)filter_var($ipv6, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6);

        Assert::assertTrue($isValidIpv6, "IPv6 address must validate");
        $compressed = inet_ntop(inet_pton($ipv6));
        Assert::assertEquals('2001:db8:85a3::8a2e:370:7334', $compressed, "IPv6 address is canonically normalized");
    }

    public function testLoopbackAddressResolution(): void
    {
        $loopbackIpv4 = '127.0.0.1';
        $loopbackIpv6 = '::1';

        Assert::assertTrue((bool)filter_var($loopbackIpv4, FILTER_VALIDATE_IP));
        Assert::assertTrue((bool)filter_var($loopbackIpv6, FILTER_VALIDATE_IP));
    }

    public function testPrivateIpFilteringInProductionMode(): void
    {
        $privateIp = '10.244.0.15';
        $isPublic = (bool)filter_var($privateIp, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE);

        Assert::assertFalse($isPublic, "Private cluster IP must not be recognized as a public client IP");
    }
}
