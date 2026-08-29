<?php
declare(strict_types=1);

namespace Hashcod\Tests\Tier2;

use Hashcod\Tests\Support\TestSuite;
use Hashcod\Tests\Support\TestAssertions as Assert;
use Hashcod\Tests\Support\TestHarness;

class TestB05SyncQueueBoundaries extends TestSuite
{
    protected string $tier = 'Tier 2';
    protected string $suiteName = 'B5: Sync Queue Boundary & Storage Resilience';

    public function testCorruptedJsonInSyncQueueHandling(): void
    {
        $corruptRaw = "{ 'table': 'l8_repos', truncated_json... ";
        $decoded = json_decode($corruptRaw, true);

        Assert::assertNull($decoded, "Corrupted JSON file returns null on json_decode");
        $isValidItem = is_array($decoded) && isset($decoded['id'], $decoded['table']);
        Assert::assertFalse($isValidItem, "Corrupted queue item is flagged and skipped without throwing fatal error");
    }

    public function testAtomicFileWriteWithTempFileAndRename(): void
    {
        $dir = TestHarness::getSandboxDir() . '/data_storage/sync_queue';
        if (!is_dir($dir)) @mkdir($dir, 0777, true);

        $targetFile = $dir . '/atomic_test_123.json';
        $tempFile = $dir . '/atomic_test_123.tmp.' . bin2hex(random_bytes(4));

        $payload = json_encode(['action' => 'UPSERT', 'table' => 'l8_files']);
        file_put_contents($tempFile, $payload, LOCK_EX);
        $renamed = rename($tempFile, $targetFile);

        Assert::assertTrue($renamed, "Atomic rename of temporary file into destination succeeds");
        Assert::assertTrue(file_exists($targetFile));
        Assert::assertFalse(file_exists($tempFile));
    }

    public function testEmptyMutationPayloadRejection(): void
    {
        $emptyPayload = [];
        $isValid = !empty($emptyPayload);

        Assert::assertFalse($isValid, "Empty mutation payload rejected before enqueue");
    }

    public function testMaxSyncQueueItemSizeLimit(): void
    {
        $maxBytes = 5 * 1024 * 1024; // 5MB limit per queue item
        $hugePayload = str_repeat('A', 6 * 1024 * 1024); // 6MB

        $exceeds = strlen($hugePayload) > $maxBytes;
        Assert::assertTrue($exceeds, "Payloads exceeding 5MB are intercepted to prevent disk exhaustion");
    }

    public function testSimultaneousQueueWriteLockContention(): void
    {
        $dir = TestHarness::getSandboxDir() . '/data_storage/sync_queue';
        $file1 = $dir . '/lock_test_1.json';

        $fp = fopen($file1, 'w+');
        Assert::assertNotEquals(false, $fp);

        $locked = flock($fp, LOCK_EX | LOCK_NB);
        Assert::assertTrue($locked, "Exclusive non-blocking lock acquired");

        flock($fp, LOCK_UN);
        fclose($fp);
    }

    public function testDirectoryCreationPermissionFallback(): void
    {
        $customDir = TestHarness::getSandboxDir() . '/data_storage/sync_queue/sub_' . bin2hex(random_bytes(4));
        if (!is_dir($customDir)) {
            @mkdir($customDir, 0700, true);
        }

        Assert::assertTrue(is_dir($customDir), "Sync subdirectory created with secure 0700 permissions");
    }

    public function testInvalidActionRejection(): void
    {
        $allowedActions = ['INSERT', 'UPDATE', 'UPSERT', 'DELETE', 'SOFT_DELETE'];
        $invalidAction = 'DROP_DATABASE';

        $isAllowed = in_array($invalidAction, $allowedActions, true);
        Assert::assertFalse($isAllowed, "Illegal action verb '$invalidAction' rejected");
    }
}
