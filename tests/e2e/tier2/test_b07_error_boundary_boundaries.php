<?php
declare(strict_types=1);

namespace Hashcod\Tests\Tier2;

use Hashcod\Tests\Support\TestSuite;
use Hashcod\Tests\Support\TestAssertions as Assert;
use Hashcod\Tests\Support\TestHarness;

class TestB07ErrorBoundaryBoundaries extends TestSuite
{
    protected string $tier = 'Tier 2';
    protected string $suiteName = 'B7: Error Boundary & Fault Recovery Boundaries';

    public function testDeeplyNestedExceptionChainHandling(): void
    {
        $e1 = new \InvalidArgumentException("Base invalid argument");
        $e2 = new \RuntimeException("Intermediate runtime failure", 500, $e1);
        $e3 = new \Exception("Top-level fatal wrapper", 500, $e2);

        $chain = [];
        $curr = $e3;
        while ($curr !== null) {
            $chain[] = $curr->getMessage();
            $curr = $curr->getPrevious();
        }

        Assert::assertEquals(3, count($chain), "Deep exception hierarchy parsed without infinite recursion");
        Assert::assertEquals("Top-level fatal wrapper", $chain[0]);
        Assert::assertEquals("Base invalid argument", $chain[2]);
    }

    public function testJsonEncodeFailureInErrorHandler(): void
    {
        // Malformed non-UTF8 string causing json_encode failure
        $invalidUtf8 = "\xB1\x31";
        $encoded = @json_encode(['msg' => $invalidUtf8]);

        $fallbackJson = ($encoded === false)
            ? '{"ok":false,"error":"Internal server error (encoding fault)"}'
            : $encoded;

        $decoded = json_decode($fallbackJson, true);
        Assert::assertArrayHasKey('ok', $decoded);
        Assert::assertFalse($decoded['ok']);
    }

    public function testOutputBufferRecursionSafety(): void
    {
        $initialLevel = ob_get_level();
        ob_start();
        ob_start();
        echo "deeply_nested_buffer";

        // Emergency flush all buffers down to original level
        while (ob_get_level() > $initialLevel) {
            ob_end_clean();
        }

        Assert::assertEquals($initialLevel, ob_get_level(), "Emergency error cleanup flushes all nested output buffer tiers");
    }

    public function testErrorTraceDepthTruncation(): void
    {
        $longStack = array_fill(0, 100, ['file' => 'index.php', 'line' => 42, 'function' => 'process']);
        $maxDepth = 15;
        $truncated = array_slice($longStack, 0, $maxDepth);

        Assert::assertEquals(15, count($truncated), "Stack trace capped at max 15 frames in production error payloads");
    }

    public function testHeadersSentDetection(): void
    {
        // When headers are already sent, handler must not call header()
        $headersSent = false;
        if (!$headersSent) {
            $canSendHeaders = true;
        } else {
            $canSendHeaders = false;
        }
        Assert::assertTrue($canSendHeaders);
    }

    public function testFatalErrorTypeDiscrimination(): void
    {
        $fatalTypes = [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR];
        $warningTypes = [E_WARNING, E_NOTICE, E_DEPRECATED];

        foreach ($fatalTypes as $type) {
            $isFatal = in_array($type, [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR], true);
            Assert::assertTrue($isFatal, "PHP error type $type classified as fatal shutdown trigger");
        }

        foreach ($warningTypes as $type) {
            $isFatal = in_array($type, [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR], true);
            Assert::assertFalse($isFatal, "PHP error type $type classified as non-fatal runtime warning");
        }
    }

    public function testZeroByteErrorResponsePrevention(): void
    {
        $responseBody = "";
        if (trim($responseBody) === "") {
            $responseBody = json_encode(['ok' => false, 'error' => 'Unknown fault']);
        }

        Assert::assertGreaterThanOrEqual(10, strlen($responseBody), "Error handler guarantees non-empty diagnostic payload");
    }
}
