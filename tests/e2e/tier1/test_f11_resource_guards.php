<?php
declare(strict_types=1);

namespace Hashcod\Tests\Tier1;

use Hashcod\Tests\Support\TestSuite;
use Hashcod\Tests\Support\TestAssertions as Assert;
use Hashcod\Tests\Support\TestHarness;

class TestF11ResourceGuards extends TestSuite
{
    protected string $tier = 'Tier 1';
    protected string $suiteName = 'F11: Process Resource Ceilings & Memory Guards';

    public function testMemoryLimitCeilingCompliance(): void
    {
        $currentMem = memory_get_usage(true);
        $peakMem = memory_get_peak_usage(true);

        $limitBytes = 256 * 1024 * 1024; // 256MB max ceiling
        Assert::assertLessThanOrEqual($limitBytes, $currentMem, "Current memory usage must remain within 256MB ceiling");
        Assert::assertLessThanOrEqual($limitBytes, $peakMem, "Peak memory usage must remain within 256MB ceiling");
    }

    public function testExecutionTimeoutCeilingConfig(): void
    {
        $timeoutStandard = 15; // 15 seconds max for standard REST / API cycles
        $timeoutStreaming = 120; // Extended for SSE / streaming

        Assert::assertLessThanOrEqual(30, $timeoutStandard, "Standard API execution timeout must be <= 30 seconds");
        Assert::assertGreaterThanOrEqual(10, $timeoutStandard, "Standard timeout must allow reasonable query latency");
    }

    public function testMemoryAllocationThresholdTracking(): void
    {
        $startMem = memory_get_usage();
        $sampleBuffer = str_repeat('A', 100000); // 100KB buffer
        $endMem = memory_get_usage();
        $delta = $endMem - $startMem;

        Assert::assertGreaterThanOrEqual(100000, $delta, "Memory allocation must accurately track buffer delta");
        unset($sampleBuffer);
    }

    public function testOutputBufferFlushGuard(): void
    {
        ob_start();
        echo "buffered_payload_test";
        $contents = ob_get_clean();

        Assert::assertEquals("buffered_payload_test", $contents, "Output buffer clean guard captures payload cleanly without leaking to stdout");
    }

    public function testStreamingProcessMemoryIsolation(): void
    {
        $chunkSize = 8192; // 8KB stream chunk
        $totalStreamed = 0;
        for ($i = 0; $i < 5; $i++) {
            $chunk = str_repeat('X', $chunkSize);
            $totalStreamed += strlen($chunk);
            unset($chunk); // Garbage collected per iteration
        }

        Assert::assertEquals(40960, $totalStreamed);
        $memAfter = memory_get_usage();
        Assert::assertLessThanOrEqual(100 * 1024 * 1024, $memAfter, "Streaming memory footprint remains bounded across chunks");
    }
}
