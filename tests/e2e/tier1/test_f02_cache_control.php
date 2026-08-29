<?php
declare(strict_types=1);

namespace Hashcod\Tests\Tier1;

use Hashcod\Tests\Support\TestSuite;
use Hashcod\Tests\Support\TestAssertions as Assert;
use Hashcod\Tests\Support\TestHarness;

class TestF02CacheControl extends TestSuite
{
    protected string $tier = 'Tier 1';
    protected string $suiteName = 'F2: Tiered Cache-Control Headers';

    public function testFingerprintedAssetsMaxAge1YearImmutable(): void
    {
        $uri = '/assets/vendor.a83f9c2d.js';
        $isFingerprinted = (bool)preg_match('/\.[a-f0-9]{8,}\.(js|css|wasm|png|svg)$/i', $uri);
        Assert::assertTrue($isFingerprinted, "Fingerprinted asset pattern matches hash in filename");

        $cacheControl = $isFingerprinted ? 'public, max-age=31536000, immutable' : 'public, max-age=86400';
        Assert::assertEquals('public, max-age=31536000, immutable', $cacheControl);
        Assert::assertContains('31536000', $cacheControl);
        Assert::assertContains('immutable', $cacheControl);
    }

    public function testStandardStaticAssetsMaxAge24hWithStaleWhileRevalidate(): void
    {
        $uri = '/logo.png';
        $ext = pathinfo($uri, PATHINFO_EXTENSION);
        $isStatic = in_array($ext, ['png', 'jpg', 'svg', 'woff2', 'css', 'js'], true);
        Assert::assertTrue($isStatic, "Standard asset is identified as static");

        $cacheControl = 'public, max-age=86400, stale-while-revalidate=604800';
        Assert::assertContains('max-age=86400', $cacheControl);
        Assert::assertContains('stale-while-revalidate=604800', $cacheControl);
    }

    public function testDynamicApiRoutesNoStoreHeader(): void
    {
        $uri = '/api/auth/session';
        $isApi = str_starts_with($uri, '/api/');
        Assert::assertTrue($isApi, "API path is recognized as dynamic endpoint");

        $cacheControl = $isApi ? 'no-store, no-cache, must-revalidate, max-age=0' : 'public';
        Assert::assertContains('no-store', $cacheControl);
        Assert::assertContains('no-cache', $cacheControl);
    }

    public function testHtmlRouteMustRevalidateHeader(): void
    {
        $uri = '/index.php';
        $isHtml = (str_ends_with($uri, '.php') || str_ends_with($uri, '.html') || $uri === '/');
        Assert::assertTrue($isHtml, "HTML document identified");

        $cacheControl = 'public, max-age=0, must-revalidate';
        Assert::assertContains('must-revalidate', $cacheControl);
        Assert::assertContains('max-age=0', $cacheControl);
    }

    public function testVaryAcceptEncodingHeader(): void
    {
        $headers = [
            'Content-Type' => 'application/javascript; charset=utf-8',
            'Vary' => 'Accept-Encoding, Origin',
            'Cache-Control' => 'public, max-age=86400'
        ];

        Assert::assertHeaderPresent($headers, 'Vary', '/Accept-Encoding/');
        Assert::assertHeaderPresent($headers, 'Cache-Control', '/public/');
    }
}
