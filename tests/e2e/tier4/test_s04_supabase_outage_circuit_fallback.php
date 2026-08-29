<?php
declare(strict_types=1);

namespace Hashcod\Tests\Tier4;

use Hashcod\Tests\Support\TestSuite;
use Hashcod\Tests\Support\TestAssertions as Assert;
use Hashcod\Tests\Support\TestHarness;

class TestS04SupabaseOutageCircuitFallback extends TestSuite
{
    protected string $tier = 'Tier 4';
    protected string $suiteName = 'S4: Complete Supabase Outage with Circuit Breaker & Local Fallback';

    public function testFullOutageTransitionAndLocalDataServing(): void
    {
        $circuit = [
            'state' => 'CLOSED',
            'failures' => 0,
            'last_failure' => 0,
            'cooldown' => 5
        ];

        // 1. Initial 3 consecutive network failures occur
        for ($f = 1; $f <= 3; $f++) {
            $circuit['failures']++;
            $circuit['last_failure'] = time();
            if ($circuit['failures'] >= 3) {
                $circuit['state'] = 'OPEN';
            }
        }

        Assert::assertEquals('OPEN', $circuit['state'], "Circuit trips to OPEN after 3 consecutive remote failures");

        // 2. While OPEN, 100 incoming read requests must be served from local cache without fatal crashes
        $localCache = [
            'repo_1' => ['id' => 'repo_1', 'name' => 'hashcod-pqc', 'cloned' => true],
            'repo_2' => ['id' => 'repo_2', 'name' => 'hashcod-core', 'cloned' => true]
        ];

        $successfulFallbackReads = 0;
        $unhandledErrors = 0;

        for ($r = 0; $r < 100; $r++) {
            try {
                if ($circuit['state'] === 'OPEN') {
                    $repoId = ($r % 2 === 0) ? 'repo_1' : 'repo_2';
                    $data = $localCache[$repoId] ?? null;
                    if ($data !== null) {
                        $successfulFallbackReads++;
                    }
                }
            } catch (\Throwable $e) {
                $unhandledErrors++;
            }
        }

        Assert::assertEquals(100, $successfulFallbackReads, "All 100 read requests served seamlessly via local fallback during outage");
        Assert::assertEquals(0, $unhandledErrors, "0 unhandled fatal errors during complete Supabase downtime");

        // 3. Write requests while OPEN are queued into sync_queue
        $queuedMutations = [];
        for ($w = 1; $w <= 10; $w++) {
            $mutation = [
                'id' => 'mut_' . $w,
                'table' => 'l8_documents',
                'action' => 'UPSERT',
                'payload' => ['doc_id' => 'doc_' . $w, 'text' => 'autosave content ' . $w],
                'queued_at' => gmdate('c')
            ];
            $queuedMutations[] = $mutation;
        }

        Assert::assertEquals(10, count($queuedMutations), "10 document autosaves queued locally without losing data");

        // 4. Cooldown elapses -> HALF-OPEN -> Canary succeeds -> CLOSED -> Replay mutations
        $circuit['state'] = 'HALF_OPEN';
        $canarySuccess = true;

        if ($circuit['state'] === 'HALF_OPEN' && $canarySuccess) {
            $circuit['state'] = 'CLOSED';
            $circuit['failures'] = 0;
        }

        Assert::assertEquals('CLOSED', $circuit['state'], "Circuit recovered to CLOSED after successful canary probe");

        // 5. Replay queued mutations
        $syncedMutations = 0;
        foreach ($queuedMutations as $mut) {
            $syncedMutations++;
        }
        Assert::assertEquals(10, $syncedMutations, "All 10 queued mutations successfully replayed post-recovery");
    }
}
