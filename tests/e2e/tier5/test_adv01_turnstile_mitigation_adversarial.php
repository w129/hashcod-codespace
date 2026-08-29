<?php
declare(strict_types=1);

namespace Hashcod\Tests\Tier5;

use Hashcod\Tests\Support\TestSuite;
use Hashcod\Tests\Support\TestAssertions as Assert;
use Hashcod\Tests\Support\TestHarness;

class TestAdv01TurnstileMitigationAdversarial extends TestSuite
{
    protected string $tier = 'Tier 5';
    protected string $suiteName = 'ADV1: Adversarial Turnstile Challenge Escalation & Clearance HMAC';

    public function setUp(): void
    {
        if (file_exists(__DIR__ . '/../../../cloudflare-turnstile.php')) {
            require_once __DIR__ . '/../../../cloudflare-turnstile.php';
        }
        if (file_exists(__DIR__ . '/../../../security.php')) {
            require_once __DIR__ . '/../../../security.php';
        }
        if (file_exists(__DIR__ . '/../../../cache.php')) {
            require_once __DIR__ . '/../../../cache.php';
        }
    }

    public function testRealTurnstileClearanceGenerationAndValidation(): void
    {
        $ip = '203.0.113.195';
        $token = cfGenerateClearanceToken($ip, 900);

        Assert::assertTrue(is_string($token) && strpos($token, '.') !== false, "Clearance token must contain payload and HMAC signature");
        
        // Validate with matching IP
        $isValid = cfValidateClearanceToken($token, $ip);
        Assert::assertTrue($isValid, "Clearance token must validate for matching client IP");

        // Validate with mismatching/spoofed IP
        $isInvalidOtherIp = cfValidateClearanceToken($token, '198.51.100.50');
        Assert::assertFalse($isInvalidOtherIp, "Clearance token must be rejected when presented by a different IP");
    }

    public function testClearanceTamperingAttacks(): void
    {
        $ip = '203.0.113.195';
        $token = cfGenerateClearanceToken($ip, 900);
        list($payloadB64, $sig) = explode('.', $token, 2);

        // 1. Bit-flip attack on payload
        $tamperedPayload = substr($payloadB64, 0, -2) . 'AA';
        $tamperedToken = $tamperedPayload . '.' . $sig;
        Assert::assertFalse(cfValidateClearanceToken($tamperedToken, $ip), "Tampered base64 payload must fail HMAC verification");

        // 2. Bit-flip attack on signature
        $tamperedSig = substr($sig, 0, -2) . 'ff';
        $tamperedTokenSig = $payloadB64 . '.' . $tamperedSig;
        Assert::assertFalse(cfValidateClearanceToken($tamperedTokenSig, $ip), "Tampered signature must fail HMAC verification");

        // 3. Forged expiration in payload
        $forgedPayload = base64_encode(json_encode([
            'ip' => $ip,
            'exp' => time() + 999999,
            'nonce' => 'forged_nonce'
        ]));
        $forgedToken = rtrim(strtr($forgedPayload, '+/', '-_'), '=') . '.' . $sig;
        Assert::assertFalse(cfValidateClearanceToken($forgedToken, $ip), "Forged expiration without valid key must fail");
    }

    public function testClearanceElevatesRateLimitMultiplier(): void
    {
        $ip = '203.0.113.210';
        $bucket = 'adv_burst_' . bin2hex(random_bytes(4));
        $limit = 10;
        $window = 10;

        // Baseline without clearance: limit is 10
        $_SERVER['HTTP_X_CF_CLEARANCE_TOKEN'] = '';
        $_COOKIE['cf_clearance'] = '';

        for ($i = 1; $i <= $limit; $i++) {
            $res = securityRateAllowSliding($bucket, $limit, $window, $ip);
            Assert::assertTrue($res['allowed'], "Request $i within baseline limit must be allowed");
        }

        // 11th request exceeds limit
        $resOver = securityRateAllowSliding($bucket, $limit, $window, $ip);
        Assert::assertFalse($resOver['allowed'], "11th request must be rate limited");
        Assert::assertTrue($resOver['challenge_required'], "Initial breach requires Turnstile challenge");

        // Now client presents valid Turnstile clearance token
        $clearanceToken = cfGenerateClearanceToken($ip, 900);
        $_SERVER['HTTP_X_CF_CLEARANCE_TOKEN'] = $clearanceToken;

        // With clearance, limit is elevated 5x (50), so subsequent requests are unlocked
        $resWithClearance = securityRateAllowSliding($bucket, $limit, $window, $ip);
        Assert::assertTrue($resWithClearance['allowed'], "Valid Turnstile clearance token must unlock elevated rate limits");
    }

    public function testCloudflareOfficialTestTokens(): void
    {
        $passToken = '1x00000000000000000000AA';
        $failToken = '2x00000000000000000000AB';
        $timeoutToken = '3x00000000000000000000FF';

        $passRes = cfTurnstileVerify($passToken);
        Assert::assertTrue(!empty($passRes['ok']), "Official test pass token must succeed");

        $failRes = cfTurnstileVerify($failToken);
        Assert::assertFalse(!empty($failRes['ok']), "Official test fail token must be rejected");

        $timeoutRes = cfTurnstileVerify($timeoutToken);
        Assert::assertFalse(!empty($timeoutRes['ok']), "Official test timeout token must be rejected");
    }
}
