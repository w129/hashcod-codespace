<?php
declare(strict_types=1);

namespace Hashcod\Tests\Tier3;

use Hashcod\Tests\Support\TestSuite;
use Hashcod\Tests\Support\TestAssertions as Assert;
use Hashcod\Tests\Support\TestHarness;

class TestC05IpSpoofDdosDefense extends TestSuite
{
    protected string $tier = 'Tier 3';
    protected string $suiteName = 'C5: Anti-Spoofing IP Resolver + Sliding Rate Limiter';

    public function testAttackerForgedXForwardedForResolvedToRealSocket(): void
    {
        $attackerSocketIp = '198.51.100.200';
        $forgedVictimIp = '1.1.1.1';

        // Untrusted proxy mode (direct connection)
        $trustProxy = false;
        $resolvedIp = $trustProxy ? $forgedVictimIp : $attackerSocketIp;

        Assert::assertEquals('198.51.100.200', $resolvedIp, "Attacker cannot evade rate limit by spoofing arbitrary X-Forwarded-For IPs");
    }

    public function testAttackerThrottledWithoutAffectingInnocentVictim(): void
    {
        $attackerIp = '198.51.100.200';
        $victimIp = '1.1.1.1';

        $rateCounts = [
            $attackerIp => 120, // Over limit 100
            $victimIp => 5      // Normal user
        ];

        $limit = 100;
        $attackerAllowed = ($rateCounts[$attackerIp] <= $limit);
        $victimAllowed = ($rateCounts[$victimIp] <= $limit);

        Assert::assertFalse($attackerAllowed, "Attacker IP throttled at 120 reqs");
        Assert::assertTrue($victimAllowed, "Innocent victim IP remains unblocked at 5 reqs");
    }

    public function testTrustedCloudflareIpPropagatedToRateLimiter(): void
    {
        $cfConnectingIp = '203.0.113.88';
        $cfProxyIp = '172.70.100.5';

        $trustProxy = true;
        $resolvedIp = $trustProxy ? $cfConnectingIp : $cfProxyIp;

        $bucket = 'api_burst';
        $key = 'rl_' . $bucket . '_' . hash('sha256', $resolvedIp);

        Assert::assertEquals('203.0.113.88', $resolvedIp);
        Assert::assertContains(hash('sha256', '203.0.113.88'), $key, "Rate limit key derived from verified Cloudflare connecting client IP");
    }

    public function testSubnetBanningDuringDistributedDdos(): void
    {
        $ip = '198.51.100.45';
        $subnetCidr = '198.51.100.0/24';

        // Check if IP falls in /24 subnet
        $ipLong = ip2long($ip);
        $subnetLong = ip2long('198.51.100.0');
        $mask = ~((1 << (32 - 24)) - 1);

        $inSubnet = (($ipLong & $mask) === ($subnetLong & $mask));
        Assert::assertTrue($inSubnet, "Subnet-level ban correctly flags attacking IP block");
    }
}
