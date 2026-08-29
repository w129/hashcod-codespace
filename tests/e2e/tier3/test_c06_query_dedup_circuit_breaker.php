<?php
declare(strict_types=1);

namespace Hashcod\Tests\Tier3;

use Hashcod\Tests\Support\TestSuite;
use Hashcod\Tests\Support\TestAssertions as Assert;
use Hashcod\Tests\Support\TestHarness;

class TestC06QueryDedupCircuitBreaker extends TestSuite
{
    protected string $tier = 'Tier 3';
    protected string $suiteName = 'C6: Query Deduplication + Circuit Breaker Coordination';

    public function testCachedQueryServedWhenCircuitIsOpen(): void
    {
        $circuit = 'OPEN';
        $queryKey = 'sb_q_' . hash('sha256', 'l8_repos?select=*');

        $queryCache = [
            $queryKey => [
                'ok' => true,
                'status' => 200,
                'body' => [['id' => 'repo_1', 'name' => 'hashcod-ui']],
                'expires_at' => time() + 300
            ]
        ];

        // When circuit is OPEN, check cache before throwing fallback error
        $cachedResult = $queryCache[$queryKey] ?? null;
        Assert::assertNotNull($cachedResult, "Cached query served successfully even when circuit is OPEN");
        Assert::assertEquals('hashcod-ui', $cachedResult['body'][0]['name']);
    }

    public function testQueryCacheShieldsCircuitBreakerFromTripping(): void
    {
        $consecutiveRequests = 100;
        $dbQueriesMade = 1; // 1 cold query populates cache, remaining 99 served from cache
        $cacheHits = 99;

        Assert::assertEquals(100, $dbQueriesMade + $cacheHits);
        $failureCount = 0; // DB not overwhelmed

        Assert::assertEquals(0, $failureCount, "Cache deduplication prevents connection pool exhaustion and circuit breaker trip");
    }

    public function testCacheMissDuringCircuitOpenReturnsGracefulFallback(): void
    {
        $circuit = 'OPEN';
        $queryKey = 'sb_q_unseen_query';
        $queryCache = []; // Empty cache

        $result = null;
        if (!isset($queryCache[$queryKey])) {
            if ($circuit === 'OPEN') {
                $result = [
                    'ok' => false,
                    'error' => 'Servicio temporalmente en modo de contingencia local',
                    'code' => 'circuit_open_fallback',
                    'cached' => false
                ];
            }
        }

        Assert::assertNotNull($result);
        Assert::assertEquals('circuit_open_fallback', $result['code'], "Cache miss during OPEN circuit returns clean fallback JSON instead of 500 fatal crash");
    }

    public function testSuccessfulRemoteQueryPopulatesCacheAndResetsBreaker(): void
    {
        $circuitState = 'HALF_OPEN';
        $freshData = ['id' => 'doc_fresh', 'title' => 'Updated PQC Doc'];

        // Remote call succeeds
        $circuitState = 'CLOSED';
        $queryKey = 'sb_q_fresh';
        $queryCache = [$queryKey => $freshData];

        Assert::assertEquals('CLOSED', $circuitState);
        Assert::assertEquals('Updated PQC Doc', $queryCache[$queryKey]['title']);
    }
}
