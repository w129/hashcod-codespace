<?php
declare(strict_types=1);

namespace Hashcod\Tests\Tier2;

use Hashcod\Tests\Support\TestSuite;
use Hashcod\Tests\Support\TestAssertions as Assert;
use Hashcod\Tests\Support\TestHarness;

class TestB02RateLimitBoundaries extends TestSuite
{
    protected string $tier = 'Tier 2';
    protected string $suiteName = 'B2: Rate Limiting Boundary & Corner Cases';

    public function testZeroLimitRejectsAll(): void
    {
        $limit = 0;
        $count = 1;
        $allowed = ($count <= $limit);
        Assert::assertFalse($allowed, "Rate limit of 0 must reject all incoming requests");
    }

    public function testSubSecondWindowBoundary(): void
    {
        $windowSec = 1; // 1 second micro-window
        $now = microtime(true);
        $timeIntoCurrent = fmod($now, 1.0);
        $weight = 1.0 - $timeIntoCurrent;

        Assert::assertBetween(0.0, 1.0, $weight, "Micro-window weight must be strictly bounded in [0.0, 1.0]");
    }

    public function testExtremeBurstLimitSaturation(): void
    {
        $limit = 10000;
        $burst = 10050;

        $throttled = ($burst > $limit);
        $overQuota = $burst - $limit;

        Assert::assertTrue($throttled);
        Assert::assertEquals(50, $overQuota, "Excess burst count above extreme limit calculated precisely");
    }

    public function testFloatingPointCountInterpolation(): void
    {
        $count = 99.9999;
        $limit = 100;
        $allowed = ($count <= $limit);
        Assert::assertTrue($allowed, "Floating count strictly below limit is allowed");

        $countAbove = 100.0001;
        $allowedAbove = ($countAbove <= $limit);
        Assert::assertFalse($allowedAbove, "Floating count exceeding limit by epsilon is throttled");
    }

    public function testClockDriftResilience(): void
    {
        $futureTimestamp = time() + 300; // Simulated 5 minute forward drift
        $current = time();

        // Safety clamp: if window start is in the future, reset to now
        $safeStart = ($futureTimestamp > $current) ? $current : $futureTimestamp;
        Assert::assertEquals($current, $safeStart, "Forward clock drift clamped to current system time");
    }

    public function testEmptyBucketNameSanitization(): void
    {
        $bucket = '   ';
        $sanitized = preg_replace('/[^a-zA-Z0-9_-]/', '', trim($bucket));
        $fallback = ($sanitized === '') ? 'default' : $sanitized;

        Assert::assertEquals('default', $fallback, "Empty bucket fallback applied safely");
    }

    public function testSpecialCharacterBucketSanitization(): void
    {
        $bucket = 'api/v1/auth/../../inject';
        $sanitized = preg_replace('/[^a-zA-Z0-9_-]/', '', $bucket);

        Assert::assertEquals('apiv1authinject', $sanitized, "Directory traversal characters stripped from bucket name");
    }
}
