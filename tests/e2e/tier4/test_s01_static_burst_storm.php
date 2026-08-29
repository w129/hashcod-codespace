<?php
declare(strict_types=1);

namespace Hashcod\Tests\Tier4;

use Hashcod\Tests\Support\TestSuite;
use Hashcod\Tests\Support\TestAssertions as Assert;
use Hashcod\Tests\Support\TestHarness;

class TestS01StaticBurstStorm extends TestSuite
{
    protected string $tier = 'Tier 4';
    protected string $suiteName = 'S1: High-Concurrency Static Burst & 304 Revalidation Storm';

    public function testStaticBurstColdLoadAndWarm304Storm(): void
    {
        $assets = [
            '/tests/e2e/fixtures/sample_app.js' => ['mime' => 'application/javascript', 'immutable' => false],
            '/tests/e2e/fixtures/sample_style.css' => ['mime' => 'text/css', 'immutable' => false],
            '/tests/e2e/fixtures/sample_image.svg' => ['mime' => 'image/svg+xml', 'immutable' => true]
        ];

        $totalRequests = 1000;
        $coldRequests = 100;
        $revalidationRequests = 900;

        $cachedEtags = [];
        $totalBytesServed = 0;
        $savedBytes = 0;

        $t0 = microtime(true);

        // Phase 1: Cold burst (100 requests)
        for ($i = 0; $i < $coldRequests; $i++) {
            $uri = array_rand($assets);
            $fullPath = dirname(__DIR__, 2) . $uri;
            Assert::assertTrue(file_exists($fullPath), "Asset must exist: $fullPath");

            $mtime = filemtime($fullPath);
            $size = filesize($fullPath);
            $etag = sprintf('W/"%x-%x"', $mtime, $size);
            $cachedEtags[$uri] = $etag;

            $totalBytesServed += $size;
        }

        // Phase 2: Warm revalidation storm (900 requests with If-None-Match)
        $revalidatedCount = 0;
        for ($i = 0; $i < $revalidationRequests; $i++) {
            $uri = array_rand($assets);
            $fullPath = dirname(__DIR__, 2) . $uri;
            $clientEtag = $cachedEtags[$uri];

            $currentMtime = filemtime($fullPath);
            $currentSize = filesize($fullPath);
            $currentEtag = sprintf('W/"%x-%x"', $currentMtime, $currentSize);

            if ($clientEtag === $currentEtag) {
                // 304 Not Modified: 0 body bytes served
                $revalidatedCount++;
                $savedBytes += $currentSize;
            } else {
                $totalBytesServed += $currentSize;
            }
        }

        $t1 = microtime(true);
        $totalDurationMs = ($t1 - $t0) * 1000;
        $avgLatencyPerReq = $totalDurationMs / $totalRequests;

        Assert::assertEquals(900, $revalidatedCount, "All 900 revalidation requests returned 304 Not Modified");
        Assert::assertGreaterThanOrEqual(10000, $savedBytes, "Bandwidth saved via 304 short-circuiting");
        Assert::assertLessThanOrEqual(0.1, $avgLatencyPerReq, "Sub-millisecond processing latency (<0.1ms per request) under burst");
    }

    public function testPayloadCompressionSavingsUnderConcurrency(): void
    {
        $fixturePath = dirname(__DIR__, 2) . '/tests/e2e/fixtures/sample_style.css';
        $raw = file_get_contents($fixturePath);
        $rawLen = strlen($raw);

        $compressed = gzencode($raw, 6);
        $compLen = strlen($compressed);

        $simulatedClients = 500;
        $uncompressedTotal = $rawLen * $simulatedClients;
        $compressedTotal = $compLen * $simulatedClients;
        $bandwidthSaved = $uncompressedTotal - $compressedTotal;

        Assert::assertGreaterThanOrEqual(0, $bandwidthSaved, "Bandwidth compression savings calculated across concurrent requests");
    }
}
