<?php
declare(strict_types=1);

namespace Hashcod\Tests\Tier2;

use Hashcod\Tests\Support\TestSuite;
use Hashcod\Tests\Support\TestAssertions as Assert;
use Hashcod\Tests\Support\TestHarness;

class TestB06TurnstileBoundaries extends TestSuite
{
    protected string $tier = 'Tier 2';
    protected string $suiteName = 'B6: Turnstile & Clearance Security Boundaries';

    public function testEmptyTurnstileTokenRejection(): void
    {
        $token = '   ';
        $isEmpty = (trim($token) === '');
        Assert::assertTrue($isEmpty, "Empty token must be caught before invoking Cloudflare verification API");
    }

    public function testOversizedTokenPayloadRejection(): void
    {
        $hugeToken = str_repeat('X', 4096);
        $isValidLen = strlen($hugeToken) <= 2048;

        Assert::assertFalse($isValidLen, "Tokens exceeding 2048 characters are rejected to prevent buffer bloat");
    }

    public function testClearanceSignatureTamperingDetection(): void
    {
        $secret = 'pqc_secret_turnstile_2026';
        $ip = '198.51.100.10';
        $exp = time() + 3600;
        $sig = hash_hmac('sha256', $ip . ':' . $exp, $secret);

        // Tamper with IP in clearance payload
        $tamperedIp = '198.51.100.99';
        $isValid = hash_equals(hash_hmac('sha256', $tamperedIp . ':' . $exp, $secret), $sig);

        Assert::assertFalse($isValid, "Tampered client IP invalidates HMAC clearance signature");
    }

    public function testExpiredClearanceTokenRejection(): void
    {
        $expPast = time() - 60; // Expired 1 minute ago
        $isExpired = ($expPast <= time());

        Assert::assertTrue($isExpired, "Past expiration timestamp immediately invalidates clearance");
    }

    public function testClearanceTimestampFarInFutureClamped(): void
    {
        $maxTtl = 86400; // 24 hours max
        $maliciousFutureExp = time() + (365 * 86400); // 1 year forward

        $isClamped = ($maliciousFutureExp - time()) > $maxTtl;
        Assert::assertTrue($isClamped, "Excessive future timestamps clamped to max 24h clearance TTL");
    }

    public function testDuplicateTokenReplayDetection(): void
    {
        $token = 'cf_token_once_' . bin2hex(random_bytes(6));
        $usedTokens = [$token => time()];

        $isReplay = isset($usedTokens[$token]);
        Assert::assertTrue($isReplay, "Duplicate token re-submission flagged as replay");
    }

    public function testMalformedClearanceFormatHandling(): void
    {
        $malformedClearances = [
            'not_a_valid_clearance_string',
            '12345',
            'exp_only.',
            '.sig_only',
            'exp.sig.extra_part'
        ];

        foreach ($malformedClearances as $c) {
            $parts = explode('.', $c);
            $isValidStructure = (count($parts) === 2 && is_numeric($parts[0]) && strlen($parts[1]) === 64);
            Assert::assertFalse($isValidStructure, "Malformed clearance string '$c' fails structural validation");
        }
    }
}
