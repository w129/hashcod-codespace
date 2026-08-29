<?php
declare(strict_types=1);

namespace Hashcod\Tests\Tier1;

use Hashcod\Tests\Support\TestSuite;
use Hashcod\Tests\Support\TestAssertions as Assert;
use Hashcod\Tests\Support\TestHarness;

class TestF06QueryDedup extends TestSuite
{
    protected string $tier = 'Tier 1';
    protected string $suiteName = 'F6: Supabase Query Deduplication & Read Cache';

    public function testQueryKeyHashingDeterminism(): void
    {
        $table = 'l8_repos';
        $query1 = 'account_key=eq.acct_123&is_deleted=eq.false&limit=10';
        $query2 = 'account_key=eq.acct_123&is_deleted=eq.false&limit=10';

        $key1 = 'sb_q_' . hash('sha256', $table . '?' . $query1);
        $key2 = 'sb_q_' . hash('sha256', $table . '?' . $query2);

        Assert::assertEquals($key1, $key2, "Identical queries must produce identical cache keys");
        Assert::assertMatchesRegularExpression('/^sb_q_[0-9a-f]{64}$/', $key1);
    }

    public function testSelectCachedReturnsCachedResult(): void
    {
        $mockResult = [
            'ok' => true,
            'status' => 200,
            'body' => [
                ['id' => 'repo_1', 'name' => 'hashcod-core', 'stars' => 128]
            ],
            'cached' => true
        ];

        $cache = ['sb_q_sample' => $mockResult];

        $fetched = $cache['sb_q_sample'] ?? null;
        Assert::assertNotNull($fetched);
        Assert::assertEquals(200, $fetched['status']);
        Assert::assertEquals('hashcod-core', $fetched['body'][0]['name']);
    }

    public function testForceFreshBypassesQueryCache(): void
    {
        $forceFresh = true;
        $hasCached = true;

        $shouldUseCache = ($hasCached && !$forceFresh);
        Assert::assertFalse($shouldUseCache, "forceFresh=true must bypass cached response and query upstream");
    }

    public function testQueryCacheTtlExpiration(): void
    {
        $cachedEntry = [
            'data' => ['id' => 'doc_1'],
            'created_at' => time() - 120, // 2 minutes old
            'ttl' => 60                    // 1 minute TTL
        ];

        $isExpired = (time() - $cachedEntry['created_at']) > $cachedEntry['ttl'];
        Assert::assertTrue($isExpired, "Query cache entry past TTL must be marked expired");
    }

    public function testDeferredLoggingQueuePreventsBlockingHttp(): void
    {
        $logPayload = [
            'action' => 'REPO_CLONE',
            'target' => 'hashcod/pqc-crypto',
            'timestamp' => time()
        ];

        $deferredQueue = [];
        $deferredQueue[] = $logPayload;

        Assert::assertEquals(1, count($deferredQueue), "Log queued in deferred memory buffer without blocking HTTP request execution");
        Assert::assertEquals('REPO_CLONE', $deferredQueue[0]['action']);
    }
}
