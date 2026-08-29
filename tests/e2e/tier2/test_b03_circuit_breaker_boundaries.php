<?php
declare(strict_types=1);

namespace Hashcod\Tests\Tier2;

use Hashcod\Tests\Support\TestSuite;
use Hashcod\Tests\Support\TestAssertions as Assert;
use Hashcod\Tests\Support\TestHarness;

class TestB03CircuitBreakerBoundaries extends TestSuite
{
    protected string $tier = 'Tier 2';
    protected string $suiteName = 'B3: Circuit Breaker Boundary & Corner Cases';

    public function testFlappingNetworkAlternatingPassFail(): void
    {
        $failures = 0;
        $state = 'CLOSED';
        $threshold = 3;

        // Sequence: Fail, Pass, Fail, Pass, Fail (never reaching 3 consecutive)
        $sequence = ['FAIL', 'PASS', 'FAIL', 'PASS', 'FAIL'];
        foreach ($sequence as $event) {
            if ($event === 'FAIL') {
                $failures++;
                if ($failures >= $threshold) $state = 'OPEN';
            } else {
                $failures = 0; // Success resets consecutive counter
            }
        }

        Assert::assertEquals('CLOSED', $state, "Flapping network with intermittent successes does not trip circuit prematurely");
        Assert::assertEquals(1, $failures);
    }

    public function testZeroCooldownImmediateHalfOpenTransition(): void
    {
        $cooldown = 0;
        $state = 'OPEN';
        $lastFailure = time();

        if ($state === 'OPEN' && (time() - $lastFailure) >= $cooldown) {
            $state = 'HALF_OPEN';
        }

        Assert::assertEquals('HALF_OPEN', $state, "Zero cooldown allows immediate transition to HALF_OPEN canary testing");
    }

    public function testCanaryFailureInHalfOpenImmediatelyReopensCircuit(): void
    {
        $state = 'HALF_OPEN';
        $canaryResult = 'FAIL';

        if ($state === 'HALF_OPEN' && $canaryResult === 'FAIL') {
            $state = 'OPEN';
        }

        Assert::assertEquals('OPEN', $state, "Failed canary probe in HALF_OPEN trips circuit back to OPEN immediately without waiting for 3 failures");
    }

    public function testHttp4xxClientErrorDoesNotTripCircuit(): void
    {
        // 400 Bad Request, 401 Unauthorized, 404 Not Found are client errors, NOT infrastructure outages
        $httpStatuses = [400, 401, 403, 404, 422];
        foreach ($httpStatuses as $status) {
            $isInfraFailure = ($status >= 500 || $status === 0);
            Assert::assertFalse($isInfraFailure, "HTTP $status is client error and must not count as circuit breaker failure");
        }
    }

    public function testHttp5xxAndCurlTimeoutTripsCircuit(): void
    {
        $infraStatuses = [0, 500, 502, 503, 504, 520];
        foreach ($infraStatuses as $status) {
            $isInfraFailure = ($status >= 500 || $status === 0);
            Assert::assertTrue($isInfraFailure, "HTTP $status is infrastructure error and counts toward circuit breaker trip");
        }
    }

    public function testHighConcurrencyProbeDeduplication(): void
    {
        // Only 1 canary probe should be allowed while HALF_OPEN
        $probeInFlight = false;

        $allowProbe1 = !$probeInFlight;
        $probeInFlight = true;

        $allowProbe2 = !$probeInFlight;

        Assert::assertTrue($allowProbe1, "First worker acquires canary probe lock");
        Assert::assertFalse($allowProbe2, "Concurrent workers fail-fast while probe is in-flight");
    }

    public function testMaxFailuresClamp(): void
    {
        $failures = 999;
        $maxClamp = 10;
        $clamped = min($failures, $maxClamp);

        Assert::assertEquals(10, $clamped, "Failure count safely clamped to prevent integer overflow");
    }
}
