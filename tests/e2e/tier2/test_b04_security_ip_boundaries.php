<?php
declare(strict_types=1);

namespace Hashcod\Tests\Tier2;

use Hashcod\Tests\Support\TestSuite;
use Hashcod\Tests\Support\TestAssertions as Assert;
use Hashcod\Tests\Support\TestHarness;

class TestB04SecurityIpBoundaries extends TestSuite
{
    protected string $tier = 'Tier 2';
    protected string $suiteName = 'B4: IP Security Boundary & Header Injection Cases';

    public function testHeaderInjectionAttemptInIpHeaders(): void
    {
        $maliciousIps = [
            "1.2.3.4\r\nSet-Cookie: admin=1",
            "1.2.3.4\0<script>alert(1)</script>",
            "1.2.3.4; DROP TABLE users;--",
            "1.2.3.4\nHost: evil.com"
        ];

        foreach ($maliciousIps as $ip) {
            $filtered = filter_var($ip, FILTER_VALIDATE_IP);
            Assert::assertFalse($filtered, "Injected IP payload must fail FILTER_VALIDATE_IP");
        }
    }

    public function testMultiHopXForwardedForExtraction(): void
    {
        $header = ' 203.0.113.195, 70.41.3.18, 150.172.238.178 ';
        $parts = explode(',', $header);
        $clientCandidate = trim($parts[0]);

        Assert::assertEquals('203.0.113.195', $clientCandidate, "Client IP extracted from leftmost position in multi-hop chain");
        Assert::assertTrue((bool)filter_var($clientCandidate, FILTER_VALIDATE_IP));
    }

    public function testBoundaryIpv4Addresses(): void
    {
        $allZeros = '0.0.0.0';
        $broadcast = '255.255.255.255';

        $val1 = filter_var($allZeros, FILTER_VALIDATE_IP);
        $val2 = filter_var($broadcast, FILTER_VALIDATE_IP);

        Assert::assertNotEquals(false, $val1);
        Assert::assertNotEquals(false, $val2);
    }

    public function testIpv4MappedIpv6Address(): void
    {
        $v4Mapped = '::ffff:192.0.2.128';
        $isValid = (bool)filter_var($v4Mapped, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6);

        Assert::assertTrue($isValid, "IPv4-mapped IPv6 address correctly identified");
    }

    public function testMalformedOctets(): void
    {
        $invalidIps = [
            '256.1.1.1',
            '1.2.3.4.5',
            '1.2.3',
            'abcd.12.34.56',
            '1.2.3.-4'
        ];

        foreach ($invalidIps as $ip) {
            Assert::assertFalse((bool)filter_var($ip, FILTER_VALIDATE_IP), "Malformed IP '$ip' rejected");
        }
    }

    public function testWhitespaceAndNullByteSanitization(): void
    {
        $raw = "\t  203.0.113.50\0\n ";
        $cleaned = trim(str_replace("\0", '', $raw));

        Assert::assertEquals('203.0.113.50', $cleaned, "Whitespace and null-bytes stripped from IP");
        Assert::assertTrue((bool)filter_var($cleaned, FILTER_VALIDATE_IP));
    }

    public function testBogusHeaderFallbackToSafeDefault(): void
    {
        $bogusIp = 'invalid_ip_string';
        $ip = filter_var($bogusIp, FILTER_VALIDATE_IP) ?: '0.0.0.0';

        Assert::assertEquals('0.0.0.0', $ip, "Invalid IP string falls back to safe 0.0.0.0 default");
    }
}
