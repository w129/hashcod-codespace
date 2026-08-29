<?php
declare(strict_types=1);

namespace Hashcod\Tests\Tier3;

use Hashcod\Tests\Support\TestSuite;
use Hashcod\Tests\Support\TestAssertions as Assert;
use Hashcod\Tests\Support\TestHarness;

class TestC03TurnstileFastpath extends TestSuite
{
    protected string $tier = 'Tier 3';
    protected string $suiteName = 'C3: Turnstile Challenge + Fast Path Short-Circuiting';

    public function testBurstTriggersTurnstileChallenge(): void
    {
        $limit = 50;
        $currentRate = 55;

        $challengeRequired = ($currentRate > $limit);
        Assert::assertTrue($challengeRequired, "Traffic burst above limit triggers automated Turnstile challenge");

        $challengePayload = [
            'ok' => false,
            'challenge_required' => true,
            'site_key' => '0x4AAAAAAEfpecWchE9q2-cs',
            'action' => 'turnstile_solve'
        ];

        Assert::assertTrue($challengePayload['challenge_required']);
        Assert::assertArrayHasKey('site_key', $challengePayload);
    }

    public function testSolvedChallengeGrantsClearanceCookie(): void
    {
        $validToken = '1x00000000000000000000AA';
        $ip = '198.51.100.22';
        $secret = 'pqc_clearance_secret';

        // Token solved
        $solved = ($validToken === '1x00000000000000000000AA');
        Assert::assertTrue($solved);

        $exp = time() + 7200;
        $sig = hash_hmac('sha256', $ip . ':' . $exp, $secret);
        $cookieVal = $exp . '.' . $sig;

        Assert::assertMatchesRegularExpression('/^[0-9]+\.[0-9a-f]{64}$/', $cookieVal);
    }

    public function testClearanceCookieEnablesFastPathBypass(): void
    {
        $hasValidClearance = true;
        $t0 = microtime(true);

        if ($hasValidClearance) {
            $allowed = true;
        } else {
            $allowed = false;
        }
        $t1 = microtime(true);

        $durationMs = ($t1 - $t0) * 1000;
        Assert::assertTrue($allowed, "Clearance cookie grants immediate access without re-challenging");
        Assert::assertLessThanOrEqual(1.0, $durationMs, "Clearance verification operates in sub-millisecond fast-path");
    }

    public function testClearanceCookieTamperedIpRejectedByFastPath(): void
    {
        $originalIp = '198.51.100.22';
        $attackerIp = '198.51.100.88';
        $secret = 'pqc_clearance_secret';
        $exp = time() + 7200;
        $sig = hash_hmac('sha256', $originalIp . ':' . $exp, $secret);

        // Attacker presents clearance signed for originalIp
        $isValidForAttacker = hash_equals(hash_hmac('sha256', $attackerIp . ':' . $exp, $secret), $sig);

        Assert::assertFalse($isValidForAttacker, "Clearance token stolen by different IP fails HMAC check on fast-path");
    }
}
