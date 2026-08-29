<?php
declare(strict_types=1);

namespace Hashcod\Tests\Tier5;

use Hashcod\Tests\Support\TestSuite;
use Hashcod\Tests\Support\TestAssertions as Assert;
use Hashcod\Tests\Support\TestHarness;

class TestAdv04SyncQueueLossless extends TestSuite
{
    protected string $tier = 'Tier 5';
    protected string $suiteName = 'ADV4: Adversarial Local Fallback & Lossless Sync Queue Mutation Hardening';

    public function setUp(): void
    {
        if (file_exists(__DIR__ . '/../../../supabase.php')) {
            require_once __DIR__ . '/../../../supabase.php';
        }
        if (file_exists(__DIR__ . '/../../../cache.php')) {
            require_once __DIR__ . '/../../../cache.php';
        }
    }

    public function testCircuitBreakerLifecycleTripAndReset(): void
    {
        supabaseCircuitReset();
        $cb = supabaseCircuitBreaker();
        Assert::assertEquals('CLOSED', $cb['state'], "Circuit breaker must initialize to CLOSED");

        // Record 3 consecutive failures
        supabaseCircuitRecordFailure("timeout_1");
        supabaseCircuitRecordFailure("timeout_2");
        supabaseCircuitRecordFailure("timeout_3");

        $cbTripped = supabaseCircuitBreaker();
        Assert::assertEquals('OPEN', $cbTripped['state'], "Circuit breaker must trip to OPEN after 3 failures");
        Assert::assertTrue(supabaseCircuitIsOpen(), "supabaseCircuitIsOpen() must return true when OPEN");

        // Reset
        supabaseCircuitReset();
        Assert::assertFalse(supabaseCircuitIsOpen(), "Circuit must be CLOSED after reset");
    }

    public function testLosslessMutationQueueingUnderOutage(): void
    {
        $queueDir = __DIR__ . '/../../../data_storage/sync_queue';
        if (!is_dir($queueDir)) {
            @mkdir($queueDir, 0700, true);
        }

        $testPayload = [
            'document_id' => 'doc_adv_test_' . bin2hex(random_bytes(4)),
            'title' => 'Quantum Resistant Contract PQC',
            'content' => 'Verified offline resilience buffer'
        ];

        $queued = supabaseQueueSyncMutation('l8_documents', 'UPSERT', $testPayload);
        Assert::assertTrue($queued, "Mutation must successfully queue to local disk");

        // Verify file exists in queueDir
        $files = glob($queueDir . '/mut_*.json');
        Assert::assertGreaterThanOrEqual(1, count($files), "At least one mutation file must exist in sync queue");

        // Read and verify integrity of the latest queued mutation
        $latestFile = end($files);
        $content = json_decode((string)file_get_contents($latestFile), true);
        Assert::assertEquals('l8_documents', $content['table']);
        Assert::assertEquals('UPSERT', $content['action']);
        Assert::assertEquals($testPayload['document_id'], $content['payload']['document_id']);
    }

    public function testDeferredActivityAndCommandLoggingZeroBlock(): void
    {
        $actRes = supabaseLogActivity('adv_test_action', 'target_resource', ['foo' => 'bar'], 'test_account');
        Assert::assertTrue(!empty($actRes['ok']), "Activity log must succeed");
        Assert::assertTrue(!empty($actRes['deferred']), "Activity log must be deferred and non-blocking");

        $cmdRes = supabaseLogCommand('git status', 0, 'On branch main', 15, ['session' => 'adv_sess'], 'test_account');
        Assert::assertTrue(!empty($cmdRes['ok']), "Command log must succeed");
        Assert::assertTrue(!empty($cmdRes['deferred']), "Command log must be deferred and non-blocking");
    }
}
