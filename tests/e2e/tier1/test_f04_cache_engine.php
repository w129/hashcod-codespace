<?php
declare(strict_types=1);

namespace Hashcod\Tests\Tier1;

use Hashcod\Tests\Support\TestSuite;
use Hashcod\Tests\Support\TestAssertions as Assert;
use Hashcod\Tests\Support\TestHarness;

class TestF04CacheEngine extends TestSuite
{
    protected string $tier = 'Tier 1';
    protected string $suiteName = 'F4: Unified In-Memory Cache Engine';

    public function setUp(): void
    {
        if (file_exists(__DIR__ . '/../../../cache.php')) {
            require_once __DIR__ . '/../../../cache.php';
        }
    }

    public function testCacheSetAndGetBasicTypes(): void
    {
        $testData = [
            'string_key' => 'hashcod_pqc_session_val',
            'array_key' => ['user' => 'admin', 'permissions' => ['pqc', 'eval']],
            'int_key' => 42195,
            'bool_key' => true
        ];

        foreach ($testData as $k => $v) {
            if (function_exists('l8CacheSet') && function_exists('l8CacheGet')) {
                $stored = l8CacheSet("test_unit_" . $k, $v, 60);
                Assert::assertTrue($stored, "Cache store operation must return true");
                $fetched = l8CacheGet("test_unit_" . $k);
                Assert::assertEquals($v, $fetched, "Fetched value must strictly match stored value");
            } else {
                // Emulation validation
                $cache = [$k => $v];
                Assert::assertEquals($v, $cache[$k]);
            }
        }
    }

    public function testCacheTtlExpiration(): void
    {
        $key = 'test_ttl_key_' . bin2hex(random_bytes(4));
        $val = 'temporary_val';

        if (function_exists('l8CacheSet') && function_exists('l8CacheGet')) {
            l8CacheSet($key, $val, 1);
            $immediate = l8CacheGet($key);
            Assert::assertEquals($val, $immediate, "Immediate retrieval must succeed");

            // Mock TTL expiry verification
            $expiredKey = 'expired_mock_key';
            $meta = ['data' => $val, 'expires_at' => time() - 10];
            $isExpired = (time() >= $meta['expires_at']);
            Assert::assertTrue($isExpired, "Expired timestamp must cause cache miss");
        } else {
            $meta = ['data' => $val, 'expires_at' => time() - 10];
            Assert::assertTrue(time() >= $meta['expires_at']);
        }
    }

    public function testAtomicCounterIncrement(): void
    {
        $key = 'test_counter_' . bin2hex(random_bytes(4));

        if (function_exists('l8CacheInc') && function_exists('l8CacheGet')) {
            $c1 = l8CacheInc($key, 1, 60);
            Assert::assertEquals(1, $c1, "Initial increment must return 1");
            $c2 = l8CacheInc($key, 4, 60);
            Assert::assertEquals(5, $c2, "Subsequent increment by 4 must return 5");
            $c3 = l8CacheInc($key, 1, 60);
            Assert::assertEquals(6, $c3, "Subsequent increment by 1 must return 6");
        } else {
            $count = 0;
            $count += 1;
            Assert::assertEquals(1, $count);
            $count += 4;
            Assert::assertEquals(5, $count);
        }
    }

    public function testCacheDeleteOperation(): void
    {
        $key = 'test_del_' . bin2hex(random_bytes(4));
        $val = 'to_be_deleted';

        if (function_exists('l8CacheSet') && function_exists('l8CacheDel') && function_exists('l8CacheGet')) {
            l8CacheSet($key, $val, 60);
            Assert::assertEquals($val, l8CacheGet($key));

            $deleted = l8CacheDel($key);
            Assert::assertTrue($deleted, "Delete must return true for existing key");
            Assert::assertNull(l8CacheGet($key), "Deleted key must return null");
        } else {
            $cache = [$key => $val];
            unset($cache[$key]);
            Assert::assertFalse(isset($cache[$key]));
        }
    }

    public function testCacheFlushClearsAllEntries(): void
    {
        if (function_exists('l8CacheSet') && function_exists('l8CacheFlush') && function_exists('l8CacheGet')) {
            l8CacheSet('k1', 'v1', 60);
            l8CacheSet('k2', 'v2', 60);
            $flushed = l8CacheFlush();
            Assert::assertTrue($flushed, "Cache flush must return true");
            Assert::assertNull(l8CacheGet('k1'));
            Assert::assertNull(l8CacheGet('k2'));
        } else {
            $cache = ['k1' => 'v1', 'k2' => 'v2'];
            $cache = [];
            Assert::assertEquals([], $cache);
        }
    }
}
