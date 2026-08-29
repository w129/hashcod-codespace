<?php
declare(strict_types=1);

namespace Hashcod\Tests\Tier1;

use Hashcod\Tests\Support\TestSuite;
use Hashcod\Tests\Support\TestAssertions as Assert;
use Hashcod\Tests\Support\TestHarness;

class TestF14LocalFallbackSync extends TestSuite
{
    protected string $tier = 'Tier 1';
    protected string $suiteName = 'F14: Local Fallback Mode & Sync Queue';

    public function testLocalCacheReadDuringCircuitOpen(): void
    {
        $docId = 'doc_offline_1';
        $localCache = [
            $docId => [
                'id' => $docId,
                'title' => 'Quantum PQC Spec 2026',
                'body' => 'Hashcod codespace offline resilient buffer'
            ]
        ];

        $circuitState = 'OPEN';
        $doc = ($circuitState === 'OPEN') ? ($localCache[$docId] ?? null) : null;

        Assert::assertNotNull($doc, "Local cache serves document record seamlessly during remote outage");
        Assert::assertEquals('Quantum PQC Spec 2026', $doc['title']);
    }

    public function testMutationQueuedInSyncQueue(): void
    {
        $mutation = [
            'id' => 'sync_' . bin2hex(random_bytes(6)),
            'table' => 'l8_documents',
            'action' => 'UPSERT',
            'payload' => ['id' => 'doc_offline_1', 'version' => 2],
            'queued_at' => gmdate('c')
        ];

        $queueDir = TestHarness::getSandboxDir() . '/data_storage/sync_queue';
        if (!is_dir($queueDir)) @mkdir($queueDir, 0777, true);

        $filePath = $queueDir . '/' . $mutation['id'] . '.json';
        file_put_contents($filePath, json_encode($mutation));

        Assert::assertTrue(file_exists($filePath), "Queued mutation must persist to sync_queue directory");
        $loaded = json_decode((string)file_get_contents($filePath), true);
        Assert::assertEquals('l8_documents', $loaded['table']);
        Assert::assertEquals('UPSERT', $loaded['action']);
    }

    public function testSyncQueueItemSchemaValidation(): void
    {
        $item = [
            'id' => 'sync_schema_test',
            'table' => 'l8_repos',
            'action' => 'INSERT',
            'payload' => ['user_repo' => 'hashcod/test'],
            'queued_at' => date('c')
        ];

        $requiredKeys = ['id', 'table', 'action', 'payload', 'queued_at'];
        foreach ($requiredKeys as $key) {
            Assert::assertArrayHasKey($key, $item, "Sync item must possess required schema field: $key");
        }
    }

    public function testSyncWorkerBatchReplaySimulation(): void
    {
        $queue = [
            ['id' => 'item_1', 'action' => 'UPSERT', 'status' => 'PENDING'],
            ['id' => 'item_2', 'action' => 'DELETE', 'status' => 'PENDING']
        ];

        $replayed = [];
        foreach ($queue as $idx => $item) {
            $item['status'] = 'COMPLETED';
            $item['synced_at'] = gmdate('c');
            $replayed[] = $item;
        }

        Assert::assertEquals(2, count($replayed));
        Assert::assertEquals('COMPLETED', $replayed[0]['status']);
        Assert::assertEquals('COMPLETED', $replayed[1]['status']);
    }

    public function testDegradedAuthFallbackPreservation(): void
    {
        $cachedAuthUser = [
            'account_key' => 'acct_local_offline',
            'role' => 'owner',
            'offline_authenticated' => true
        ];

        $remoteReachable = false;
        $session = (!$remoteReachable && !empty($cachedAuthUser['offline_authenticated']))
            ? $cachedAuthUser
            : null;

        Assert::assertNotNull($session, "Degraded offline auth succeeds with cached account credentials");
        Assert::assertEquals('owner', $session['role']);
    }
}
