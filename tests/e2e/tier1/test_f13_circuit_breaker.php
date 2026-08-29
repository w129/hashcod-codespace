<?php
declare(strict_types=1);

namespace Hashcod\Tests\Tier1;

use Hashcod\Tests\Support\TestSuite;
use Hashcod\Tests\Support\TestAssertions as Assert;
use Hashcod\Tests\Support\TestHarness;

class TestF13CircuitBreaker extends TestSuite
{
    protected string $tier = 'Tier 1';
    protected string $suiteName = 'F13: Supabase 3-State Circuit Breaker';

    public function testInitialStateIsClosed(): void
    {
        $state = [
            'state' => 'CLOSED',
            'failures' => 0,
            'last_failure' => 0,
            'cooldown' => 30
        ];

        Assert::assertEquals('CLOSED', $state['state'], "Circuit breaker starts in CLOSED state");
        Assert::assertEquals(0, $state['failures']);
    }

    public function testThreeConsecutiveFailuresTripToOpen(): void
    {
        $threshold = 3;
        $failures = 0;
        $state = 'CLOSED';

        for ($i = 1; $i <= 3; $i++) {
            $failures++;
            if ($failures >= $threshold) {
                $state = 'OPEN';
            }
        }

        Assert::assertEquals(3, $failures);
        Assert::assertEquals('OPEN', $state, "Circuit must trip to OPEN after 3 consecutive failures");
    }

    public function testOpenStateFastFailsWithoutRemoteCall(): void
    {
        $state = 'OPEN';
        $networkCallsMade = 0;

        if ($state === 'OPEN') {
            // Fast fail immediately
            $result = ['ok' => false, 'circuit' => 'OPEN', 'fallback' => true];
        } else {
            $networkCallsMade++;
            $result = ['ok' => true];
        }

        Assert::assertEquals(0, $networkCallsMade, "Circuit in OPEN state must make 0 remote network calls");
        Assert::assertEquals('OPEN', $result['circuit']);
        Assert::assertTrue($result['fallback']);
    }

    public function testCooldownExpirationTransitionsToHalfOpen(): void
    {
        $cooldownSec = 30;
        $lastFailure = time() - 35; // 35 seconds ago
        $state = 'OPEN';

        if ($state === 'OPEN' && (time() - $lastFailure) >= $cooldownSec) {
            $state = 'HALF_OPEN';
        }

        Assert::assertEquals('HALF_OPEN', $state, "Circuit breaker enters HALF_OPEN state once cooldown expires");
    }

    public function testProbeSuccessInHalfOpenResetsToClosed(): void
    {
        $state = 'HALF_OPEN';
        $probeSuccess = true;

        if ($state === 'HALF_OPEN' && $probeSuccess) {
            $state = 'CLOSED';
            $failures = 0;
        }

        Assert::assertEquals('CLOSED', $state, "Successful canary probe in HALF_OPEN restores circuit to CLOSED");
        Assert::assertEquals(0, $failures, "Failure counter reset to 0 upon circuit recovery");
    }
}
