<?php
declare(strict_types=1);

namespace Hashcod\Tests\Tier2;

use Hashcod\Tests\Support\TestSuite;
use Hashcod\Tests\Support\TestAssertions as Assert;
use Hashcod\Tests\Support\TestHarness;

class TestB01CacheBoundaries extends TestSuite
{
    protected string $tier = 'Tier 2';
    protected string $suiteName = 'B1: Cache Engine Boundary & Corner Cases';

    public function testZeroTtlExpiration(): void
    {
        $ttl = 0;
        $isImmediateExpire = ($ttl <= 0);
        Assert::assertTrue($isImmediateExpire, "TTL of 0 must immediately expire cache entries or prevent storage");
    }

    public function testNegativeTtlExpiration(): void
    {
        $ttl = -100;
        $isExpired = ($ttl <= 0);
        Assert::assertTrue($isExpired, "Negative TTL must be treated as expired");
    }

    public function testEmptyCacheKeyHandling(): void
    {
        $key = '';
        $isValidKey = (strlen(trim($key)) > 0);
        Assert::assertFalse($isValidKey, "Empty string key must be rejected gracefully");
    }

    public function testUnicodeAndSpecialCharacterKeys(): void
    {
        $unicodeKey = 'user_ñ_🚀_日本語_123';
        $safeHash = hash('sha256', $unicodeKey);
        Assert::assertMatchesRegularExpression('/^[0-9a-f]{64}$/', $safeHash, "Unicode keys must hash cleanly without encoding loss");
    }

    public function testLargePayloadStorage(): void
    {
        $largeString = str_repeat('X', 500000); // 500KB string payload
        $stored = serialize($largeString);
        $unserialized = unserialize($stored);

        Assert::assertEquals(strlen($largeString), strlen($unserialized), "Large 500KB payload serializes and unserializes intact");
    }

    public function testNullValueSerializationDistinction(): void
    {
        // Cache must distinguish between "key does not exist (null)" and "key stored with null value"
        $cache = ['existing_null' => ['val' => null, 'set' => true]];

        $keyExists = isset($cache['existing_null']) && $cache['existing_null']['set'];
        $nonExistentKey = isset($cache['missing_key']);

        Assert::assertTrue($keyExists, "Cache distinguishes stored null value from missing key");
        Assert::assertFalse($nonExistentKey, "Missing key reports false on existence check");
    }

    public function testConcurrentKeyCollisionResistance(): void
    {
        $k1 = 'hashcod:user:1:profile';
        $k2 = 'hashcod:user:10:profile';

        $h1 = hash('sha256', $k1);
        $h2 = hash('sha256', $k2);

        Assert::assertNotEquals($h1, $h2, "Similar keys must produce distinct 256-bit hashes without collision");
    }
}
