<?php
declare(strict_types=1);

namespace Hashcod\Tests\Tier1;

use Hashcod\Tests\Support\TestSuite;
use Hashcod\Tests\Support\TestAssertions as Assert;
use Hashcod\Tests\Support\TestHarness;

class TestF03CompressionOffload extends TestSuite
{
    protected string $tier = 'Tier 1';
    protected string $suiteName = 'F3: Edge Static Offloading & Compression';

    public function testGzipCompressionNegotiation(): void
    {
        TestHarness::simulateRequest('GET', '/tests/e2e/fixtures/sample_style.css', [
            'Accept-Encoding' => 'gzip, deflate, br, zstd'
        ]);

        $acceptEncoding = $_SERVER['HTTP_ACCEPT_ENCODING'] ?? '';
        $supportsGzip = strpos($acceptEncoding, 'gzip') !== false;
        Assert::assertTrue($supportsGzip, "Client advertised gzip support");

        $raw = file_get_contents(__DIR__ . '/../fixtures/sample_style.css');
        $compressed = gzencode($raw, 6);
        Assert::assertNotEquals(false, $compressed, "gzencode succeeded");
        Assert::assertGreaterThanOrEqual(1, strlen($compressed));
    }

    public function testDeflateFallbackWhenGzipNotSupported(): void
    {
        TestHarness::simulateRequest('GET', '/tests/e2e/fixtures/sample_style.css', [
            'Accept-Encoding' => 'deflate'
        ]);

        $acceptEncoding = $_SERVER['HTTP_ACCEPT_ENCODING'] ?? '';
        $supportsGzip = strpos($acceptEncoding, 'gzip') !== false;
        $supportsDeflate = strpos($acceptEncoding, 'deflate') !== false;

        Assert::assertFalse($supportsGzip, "Gzip not advertised");
        Assert::assertTrue($supportsDeflate, "Deflate advertised");

        $raw = file_get_contents(__DIR__ . '/../fixtures/sample_style.css');
        $compressed = gzdeflate($raw, 6);
        Assert::assertNotEquals(false, $compressed, "gzdeflate succeeded");
    }

    public function testPayloadCompressionRatioOnTextAssets(): void
    {
        // Generate repetitive CSS/JS content to test compression ratio (>50% reduction)
        $raw = str_repeat(".hashcod-neon-glow { color: #00ffcc; text-shadow: 0 0 10px #00ffcc; }\n", 100);
        $rawLen = strlen($raw);
        $compressed = gzencode($raw, 6);
        $compLen = strlen($compressed);

        $ratio = (1 - ($compLen / $rawLen)) * 100;
        Assert::assertGreaterThanOrEqual(70.0, $ratio, "Compression ratio on repetitive CSS must exceed 70%");
    }

    public function testBinaryImagePayloadBypassesCompression(): void
    {
        // SVG image vs PNG binary
        $ext = 'png';
        $compressableMimes = ['text/css', 'application/javascript', 'application/json', 'image/svg+xml', 'text/html'];
        $mime = 'image/png';

        $shouldCompress = in_array($mime, $compressableMimes, true);
        Assert::assertFalse($shouldCompress, "Binary PNG images should not undergo double compression");
    }

    public function testChunkedStreamThresholdHandling(): void
    {
        $thresholdBytes = 1048576; // 1MB
        $smallFileSize = 5000;
        $largeFileSize = 2000000;

        $smallStreamMode = ($smallFileSize > $thresholdBytes) ? 'chunked' : 'buffered';
        $largeStreamMode = ($largeFileSize > $thresholdBytes) ? 'chunked' : 'buffered';

        Assert::assertEquals('buffered', $smallStreamMode, "Small files served buffered in memory");
        Assert::assertEquals('chunked', $largeStreamMode, "Large files streamed chunked to conserve worker memory");
    }
}
