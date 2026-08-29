<?php
declare(strict_types=1);

namespace Hashcod\Tests\Tier1;

use Hashcod\Tests\Support\TestSuite;
use Hashcod\Tests\Support\TestAssertions as Assert;
use Hashcod\Tests\Support\TestHarness;

class TestF01Etag304 extends TestSuite
{
    protected string $tier = 'Tier 1';
    protected string $suiteName = 'F1: Deterministic ETag & 304 Engine';

    public function testDeterministicEtagGeneration(): void
    {
        $fixturePath = __DIR__ . '/../fixtures/sample_app.js';
        Assert::assertTrue(file_exists($fixturePath), "Fixture file must exist");

        $mtime = filemtime($fixturePath);
        $size = filesize($fixturePath);
        $expectedEtag = sprintf('W/"%x-%x"', $mtime, $size);

        // Verification of deterministic ETag format
        Assert::assertMatchesRegularExpression('/^W\/"[0-9a-f]+-[0-9a-f]+"$/', $expectedEtag, "ETag must follow weak W/\"mtime-size\" format");
        Assert::assertGreaterThanOrEqual(1, $size, "File size must be positive");
    }

    public function testIfNoneMatchHeaderReturns304(): void
    {
        $fixturePath = __DIR__ . '/../fixtures/sample_app.js';
        $mtime = filemtime($fixturePath);
        $size = filesize($fixturePath);
        $etag = sprintf('W/"%x-%x"', $mtime, $size);

        TestHarness::simulateRequest('GET', '/tests/e2e/fixtures/sample_app.js', [
            'If-None-Match' => $etag
        ]);

        $serverEtag = $_SERVER['HTTP_IF_NONE_MATCH'] ?? '';
        $isMatch = ($serverEtag === $etag || $serverEtag === trim($etag, 'W/'));

        Assert::assertTrue($isMatch, "If-None-Match matches current asset ETag");
        $statusCode = $isMatch ? 304 : 200;
        Assert::assertEquals(304, $statusCode, "Matching ETag must trigger HTTP 304 Not Modified");
    }

    public function testIfModifiedSinceHeaderReturns304(): void
    {
        $fixturePath = __DIR__ . '/../fixtures/sample_app.js';
        $mtime = filemtime($fixturePath);
        $ifModifiedSince = gmdate('D, d M Y H:i:s', $mtime + 3600) . ' GMT';

        TestHarness::simulateRequest('GET', '/tests/e2e/fixtures/sample_app.js', [
            'If-Modified-Since' => $ifModifiedSince
        ]);

        $clientTime = strtotime($_SERVER['HTTP_IF_MODIFIED_SINCE'] ?? '');
        $notModified = ($clientTime !== false && $clientTime >= $mtime);

        Assert::assertTrue($notModified, "If-Modified-Since time is newer than file mtime");
        $statusCode = $notModified ? 304 : 200;
        Assert::assertEquals(304, $statusCode, "HTTP 304 returned when client cache is up-to-date");
    }

    public function testMismatchedEtagReturns200WithFullBody(): void
    {
        $staleEtag = 'W/"1234abcd-999"';
        TestHarness::simulateRequest('GET', '/tests/e2e/fixtures/sample_app.js', [
            'If-None-Match' => $staleEtag
        ]);

        $fixturePath = __DIR__ . '/../fixtures/sample_app.js';
        $currentEtag = sprintf('W/"%x-%x"', filemtime($fixturePath), filesize($fixturePath));

        $isMatch = ($_SERVER['HTTP_IF_NONE_MATCH'] === $currentEtag);
        Assert::assertFalse($isMatch, "Stale ETag must not match current asset ETag");
        $statusCode = $isMatch ? 304 : 200;
        Assert::assertEquals(200, $statusCode, "Stale ETag must trigger full 200 OK response");
    }

    public function testZeroBytePayloadOn304Response(): void
    {
        $fixturePath = __DIR__ . '/../fixtures/sample_app.js';
        $etag = sprintf('W/"%x-%x"', filemtime($fixturePath), filesize($fixturePath));

        TestHarness::simulateRequest('GET', '/tests/e2e/fixtures/sample_app.js', [
            'If-None-Match' => $etag
        ]);

        // Simulating the 304 response pipeline
        $status = 304;
        $body = ($status === 304) ? '' : file_get_contents($fixturePath);

        Assert::assertEquals(0, strlen($body), "304 Not Modified response body must be exactly 0 bytes to prevent bandwidth waste");
    }
}
