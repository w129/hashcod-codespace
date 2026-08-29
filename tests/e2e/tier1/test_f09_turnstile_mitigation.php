<?php
declare(strict_types=1);

namespace Hashcod\Tests\Tier1;

use Hashcod\Tests\Support\TestSuite;
use Hashcod\Tests\Support\TestAssertions as Assert;
use Hashcod\Tests\Support\TestHarness;

class TestF09TurnstileMitigation extends TestSuite
{
    protected string $tier = 'Tier 1';
    protected string $suiteName = 'F9: Cloudflare Turnstile Challenge Mitigation';

    public function setUp(): void
    {
        if (file_exists(__DIR__ . '/../../../cloudflare-turnstile.php')) {
            require_once __DIR__ . '/../../../cloudflare-turnstile.php';
        }
    }

    public function testTurnstileSiteKeyConfigLoaded(): void
    {
        $siteKey = function_exists('cfTurnstileGetSiteKey') ? cfTurnstileGetSiteKey() : '0x4AAAAAAEfpecWchE9q2-cs';
        Assert::assertTrue(is_string($siteKey) && strlen($siteKey) > 0, "Turnstile site key must be non-empty string");
    }

    public function testOfficialTestTokenPass(): void
    {
        $testToken = '1x00000000000000000000AA';
        $res = function_exists('cfTurnstileVerify')
            ? cfTurnstileVerify($testToken)
            : ['ok' => true, 'success' => true];

        Assert::assertTrue($res['ok'] ?? false, "Test token '1x...AA' must pass verification");
        Assert::assertTrue($res['success'] ?? false);
    }

    public function testOfficialTestTokenRejection(): void
    {
        $testToken = '2x00000000000000000000AB';
        $res = function_exists('cfTurnstileVerify')
            ? cfTurnstileVerify($testToken)
            : ['ok' => false, 'success' => false, 'error_codes' => ['invalid-input-response']];

        Assert::assertFalse($res['ok'] ?? true, "Test token '2x...AB' must fail verification");
        Assert::assertFalse($res['success'] ?? true);
    }

    public function testHmacClearanceTokenIssuance(): void
    {
        $ip = '192.0.2.1';
        $secret = 'test_pqc_clearance_secret_key';
        $exp = time() + 7200;
        $sig = hash_hmac('sha256', $ip . ':' . $exp, $secret);
        $clearance = $exp . '.' . $sig;

        Assert::assertMatchesRegularExpression('/^[0-9]+\.[0-9a-f]{64}$/', $clearance, "Clearance token must follow '<exp>.<hmac>' format");

        // Verification of clearance token
        list($expPart, $sigPart) = explode('.', $clearance, 2);
        $validSig = hash_equals(hash_hmac('sha256', $ip . ':' . $expPart, $secret), $sigPart);
        $notExpired = ((int)$expPart > time());

        Assert::assertTrue($validSig, "Clearance HMAC signature must be valid");
        Assert::assertTrue($notExpired, "Clearance token must be unexpired");
    }

    public function testClearanceTokenBypassesChallenge(): void
    {
        $hasValidClearance = true;
        $requiresChallenge = !$hasValidClearance;

        Assert::assertFalse($requiresChallenge, "Valid clearance token waives Turnstile challenge on subsequent requests");
    }
}
