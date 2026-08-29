<?php
declare(strict_types=1);

namespace Hashcod\Tests\Tier5;

use Hashcod\Tests\Support\TestSuite;
use Hashcod\Tests\Support\TestAssertions as Assert;
use Hashcod\Tests\Support\TestHarness;

class TestAdv03ShutdownSecretRedaction extends TestSuite
{
    protected string $tier = 'Tier 5';
    protected string $suiteName = 'ADV3: Adversarial Universal Shutdown & Zero-Secret-Leak Error Boundaries';

    public function setUp(): void
    {
        if (file_exists(__DIR__ . '/../../../security.php')) {
            require_once __DIR__ . '/../../../security.php';
        }
    }

    public function testComprehensiveSecretPatternRedaction(): void
    {
        $testPayload = implode("\n", [
            'GitHub Token: ghp_abcdefghijklmnopqrstuvwxyz1234567890',
            'GitHub Fine-grained PAT: github_pat_11ABCD123456789012345678901234567890123456789012345678901234567890',
            'Supabase Secret: sb_secret_abcdef1234567890abcdef12',
            'Supabase Publishable: sb_publishable_abcdef1234567890abcdef12',
            'JWT Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgN_p_9s_example_jwt_token_signature'
        ]);

        $redacted = securityRedactSecrets($testPayload);

        Assert::assertNotContains('ghp_abcdefghijklmnopqrstuvwxyz1234567890', $redacted, "GitHub token must be scrubbed");
        Assert::assertNotContains('github_pat_11ABCD12345678901234567890', $redacted, "GitHub PAT must be scrubbed");
        Assert::assertNotContains('sb_secret_abcdef1234567890abcdef12', $redacted, "Supabase secret must be scrubbed");
        Assert::assertNotContains('sb_publishable_abcdef1234567890abcdef12', $redacted, "Supabase publishable key must be scrubbed");
        Assert::assertNotContains('dozjgN_p_9s_example_jwt_token_signature', $redacted, "JWT token signature must be scrubbed");
    }

    public function testMemoryGuardUnderSimulatedPressure(): void
    {
        // Test memory guard function directly
        $hasSufficientMemory = securityCheckMemoryGuard(1024 * 1024); // 1MB free required
        Assert::assertTrue($hasSufficientMemory, "Normal operations must pass memory guard");

        // Simulate unrealistic huge requirement (e.g. 50GB)
        $hasExcessiveMemory = securityCheckMemoryGuard(50 * 1024 * 1024 * 1024);
        Assert::assertFalse($hasExcessiveMemory, "Excessive memory allocation requirement must trigger memory guard rejection");
    }

    public function testCleanJsonStructureOnServiceException(): void
    {
        $fakeException = new \RuntimeException("Database query failed with secret key sb_secret_live_key_98765432101234");
        
        $msg = $fakeException->getMessage();
        $cleanedMsg = securityRedactSecrets($msg);

        Assert::assertNotContains('sb_secret_live_key_98765432101234', $cleanedMsg, "Exception message must have secrets redacted");

        $errorResponse = [
            'ok' => false,
            'error' => $cleanedMsg,
            'code' => 'server_exception',
            'status' => 500,
            'request_id' => bin2hex(random_bytes(8))
        ];

        $json = json_encode($errorResponse, JSON_UNESCAPED_UNICODE);
        Assert::assertNotEquals(false, $json, "Error response must encode cleanly to JSON");

        $decoded = json_decode((string)$json, true);
        Assert::assertFalse($decoded['ok']);
        Assert::assertEquals('server_exception', $decoded['code']);
        Assert::assertNotContains('sb_secret_live_key_98765432101234', $decoded['error']);
    }
}
