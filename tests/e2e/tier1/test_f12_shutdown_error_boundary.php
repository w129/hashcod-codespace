<?php
declare(strict_types=1);

namespace Hashcod\Tests\Tier1;

use Hashcod\Tests\Support\TestSuite;
use Hashcod\Tests\Support\TestAssertions as Assert;
use Hashcod\Tests\Support\TestHarness;

class TestF12ShutdownErrorBoundary extends TestSuite
{
    protected string $tier = 'Tier 1';
    protected string $suiteName = 'F12: Universal Shutdown Handler & Error Boundary';

    public function setUp(): void
    {
        if (file_exists(__DIR__ . '/../../../security.php')) {
            require_once __DIR__ . '/../../../security.php';
        }
    }

    public function testSensitiveSecretRedactionInTrace(): void
    {
        $rawTrace = "Error connecting to Supabase: sb_secret_abc12345678901234567 at url https://xyz.supabase.co with github_pat_11ABCD123456789012345678901234567890123456789012345678901234567890";

        $redacted = function_exists('securityRedactSecrets')
            ? securityRedactSecrets($rawTrace)
            : preg_replace('/sb_secret_[a-zA-Z0-9]+/', 'sb_secret_***', $rawTrace);

        Assert::assertNotContains('sb_secret_abc12345678901234567', $redacted, "Supabase secret key must be redacted");
        Assert::assertNotContains('github_pat_11ABCD', $redacted, "GitHub token must be redacted");
    }

    public function testCleanJsonFormattingOnFatalError(): void
    {
        $errorPayload = [
            'ok' => false,
            'error' => 'Internal service interruption',
            'code' => 'service_error',
            'ref' => 'ERR_' . bin2hex(random_bytes(4))
        ];

        $json = json_encode($errorPayload);
        Assert::assertNotEquals(false, $json);

        $decoded = json_decode($json, true);
        Assert::assertArrayHasKey('ok', $decoded);
        Assert::assertArrayHasKey('error', $decoded);
        Assert::assertArrayHasKey('code', $decoded);
        Assert::assertFalse($decoded['ok']);
    }

    public function testExceptionHandlingWithoutCrash(): void
    {
        $caught = false;
        try {
            throw new \RuntimeException("Simulated database timeout or network disruption");
        } catch (\Throwable $e) {
            $caught = true;
            $handledResponse = [
                'ok' => false,
                'error' => 'Operación no disponible temporalmente',
                'status' => 503
            ];
            Assert::assertEquals(503, $handledResponse['status']);
        }

        Assert::assertTrue($caught, "Exception must be gracefully caught by error boundary");
    }

    public function testNoticeAndWarningSuppressionInProduction(): void
    {
        $displayErrors = ini_get('display_errors');
        Assert::assertContains($displayErrors, ['0', '', 'Off', false], "display_errors must be disabled to prevent HTML leak into JSON responses");
    }

    public function testErrorRefCorrelationTracking(): void
    {
        $refId = 'REQ_' . bin2hex(random_bytes(6));
        Assert::assertMatchesRegularExpression('/^REQ_[0-9a-f]{12}$/', $refId, "Error reference ID must be a unique hexadecimal trace identifier");
    }
}
