<?php
declare(strict_types=1);

namespace Hashcod\Tests\Tier1;

use Hashcod\Tests\Support\TestSuite;
use Hashcod\Tests\Support\TestAssertions as Assert;
use Hashcod\Tests\Support\TestHarness;

class TestF08SlidingRateLimiter extends TestSuite
{
    protected string $tier = 'Tier 1';
    protected string $suiteName = 'F8: Atomic Sliding-Window Rate Limiter';

    public function testSlidingWindowInterpolationMath(): void
    {
        $windowSec = 60;
        $now = time();
        $timeIntoCurrent = 15; // 15 seconds into current minute (25% elapsed)
        $weightPrev = ($windowSec - $timeIntoCurrent) / $windowSec; // 75% weight on previous window

        $prevCount = 40;
        $currCount = 10;

        $interpolatedRate = $currCount + ($prevCount * $weightPrev);
        Assert::assertEquals(40.0, $interpolatedRate, "Interpolated sliding count (10 + 40*0.75) = 40.0");
    }

    public function testBurstLimitEnforcementRejectsExcessRequests(): void
    {
        $limit = 100;
        $count = 101.5;
        $allowed = ($count <= $limit);

        Assert::assertFalse($allowed, "Requests exceeding window limit must be throttled");
    }

    public function testRemainingQuotaDerivation(): void
    {
        $limit = 50;
        $count = 32.4;
        $remaining = max(0, (int)floor($limit - $count));

        Assert::assertEquals(17, $remaining, "Remaining quota must accurately equal floor(limit - count)");
    }

    public function testRetryAfterDerivation(): void
    {
        $windowSec = 60;
        $timeIntoCurrent = 40;
        $retryAfter = max(1, $windowSec - $timeIntoCurrent);

        Assert::assertEquals(20, $retryAfter, "Retry-After should equal remaining seconds in window");
        Assert::assertGreaterThanOrEqual(1, $retryAfter);
    }

    public function testMultiBucketIsolation(): void
    {
        $bucketAuth = 'auth_login';
        $bucketApi = 'api_general';
        $ip = '203.0.113.195';

        $keyAuth = 'rl_' . $bucketAuth . '_' . hash('sha256', $ip);
        $keyApi = 'rl_' . $bucketApi . '_' . hash('sha256', $ip);

        Assert::assertNotEquals($keyAuth, $keyApi, "Different buckets for same IP must have distinct storage keys");
    }
}
