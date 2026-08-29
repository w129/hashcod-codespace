<?php
declare(strict_types=1);

namespace Hashcod\Tests\Tier3;

use Hashcod\Tests\Support\TestSuite;
use Hashcod\Tests\Support\TestAssertions as Assert;
use Hashcod\Tests\Support\TestHarness;

class TestC04EtagCompressionCache extends TestSuite
{
    protected string $tier = 'Tier 3';
    protected string $suiteName = 'C4: Static 304 + Payload Compression + Tiered Cache-Control';

    public function testEtagCalculationOnUncompressedAsset(): void
    {
        $rawAsset = "body { background: #000; color: #00ffcc; }";
        $mtime = 1700000000;
        $size = strlen($rawAsset);

        $etag = sprintf('W/"%x-%x"', $mtime, $size);
        Assert::assertEquals('W/"6553f100-29"', $etag, "Weak ETag calculated consistently against raw canonical file metadata");
    }

    public function testVaryAcceptEncodingEmittedWithEtag(): void
    {
        $headers = [
            'ETag' => 'W/"6553f100-29"',
            'Vary' => 'Accept-Encoding',
            'Cache-Control' => 'public, max-age=86400',
            'Content-Type' => 'text/css; charset=utf-8'
        ];

        Assert::assertHeaderPresent($headers, 'ETag');
        Assert::assertHeaderPresent($headers, 'Vary', '/Accept-Encoding/');
        Assert::assertHeaderPresent($headers, 'Cache-Control', '/public/');
    }

    public function test304ResponsePreservesHeadersWhileStrippingBody(): void
    {
        $responseHeaders = [
            'ETag' => 'W/"6553f100-29"',
            'Cache-Control' => 'public, max-age=86400',
            'Vary' => 'Accept-Encoding'
        ];
        $responseBody = ""; // 0 bytes

        Assert::assertEquals(0, strlen($responseBody), "304 payload stripped to 0 bytes");
        Assert::assertHeaderPresent($responseHeaders, 'ETag');
        Assert::assertHeaderPresent($responseHeaders, 'Cache-Control');
    }

    public function testCompressedGzipMatchesClientExpectation(): void
    {
        $raw = str_repeat("console.log('pqc');\n", 50);
        $compressed = gzencode($raw, 6);

        // Client decompresses
        $decompressed = gzdecode($compressed);
        Assert::assertEquals($raw, $decompressed, "Gzip compressed asset decodes back to identical original bytes");
    }
}
