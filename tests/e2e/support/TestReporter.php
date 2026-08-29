<?php
declare(strict_types=1);

namespace Hashcod\Tests\Support;

class TestReporter
{
    private static bool $useAnsi = true;

    public static function setAnsi(bool $enable): void
    {
        self::$useAnsi = $enable;
    }

    public static function color(string $text, string $colorCode): string
    {
        if (!self::$useAnsi) {
            return $text;
        }
        return "\033[" . $colorCode . "m" . $text . "\033[0m";
    }

    public static function green(string $text): string
    {
        return self::color($text, '32');
    }

    public static function red(string $text): string
    {
        return self::color($text, '31');
    }

    public static function yellow(string $text): string
    {
        return self::color($text, '33');
    }

    public static function cyan(string $text): string
    {
        return self::color($text, '36');
    }

    public static function bold(string $text): string
    {
        return self::color($text, '1');
    }

    public static function gray(string $text): string
    {
        return self::color($text, '90');
    }

    public static function banner(string $title, string $subtitle = ''): void
    {
        $line = str_repeat('=', 80);
        echo "\n" . self::cyan($line) . "\n";
        echo self::bold(self::cyan("  " . strtoupper($title))) . "\n";
        if ($subtitle !== '') {
            echo self::gray("  " . $subtitle) . "\n";
        }
        echo self::cyan($line) . "\n\n";
    }

    public static function suiteHeader(string $tier, string $suiteName): void
    {
        echo self::bold(self::yellow(sprintf("▶ [%s] %s", $tier, $suiteName))) . "\n";
    }

    public static function testResult(string $name, bool $passed, ?string $error = null, float $durationMs = 0.0): void
    {
        $status = $passed ? self::green("✔ PASS") : self::red("✖ FAIL");
        $timeStr = self::gray(sprintf("(%.2f ms)", $durationMs));
        echo sprintf("  %s  %-60s %s\n", $status, $name, $timeStr);
        if (!$passed && $error !== null) {
            echo self::red("      └─ ERROR: " . $error) . "\n";
        }
    }

    public static function renderSummary(array $results): void
    {
        $total = 0;
        $passed = 0;
        $failed = 0;
        $totalTimeMs = 0.0;

        foreach ($results as $suite) {
            $total += $suite['total'];
            $passed += $suite['passed'];
            $failed += $suite['failed'];
            $totalTimeMs += $suite['duration_ms'];
        }

        $line = str_repeat('-', 80);
        echo "\n" . self::cyan($line) . "\n";
        echo self::bold("TEST EXECUTION SUMMARY\n");
        echo self::cyan($line) . "\n";

        printf("%-10s | %-38s | %-8s | %-8s | %-10s\n", "Tier", "Suite", "Passed", "Failed", "Time");
        echo str_repeat('-', 80) . "\n";

        foreach ($results as $suite) {
            $statusColor = $suite['failed'] === 0 ? "\033[32m" : "\033[31m";
            printf(
                "%-10s | %-38s | %s%-8d\033[0m | %s%-8d\033[0m | %-10s\n",
                $suite['tier'],
                substr($suite['name'], 0, 38),
                "\033[32m",
                $suite['passed'],
                $suite['failed'] > 0 ? "\033[31m" : "\033[90m",
                $suite['failed'],
                sprintf("%.2f ms", $suite['duration_ms'])
            );
        }

        echo self::cyan($line) . "\n";
        $statusOverall = ($failed === 0)
            ? self::green(self::bold("OVERALL RESULT: ALL TESTS PASSED (100% SUCCESS)"))
            : self::red(self::bold(sprintf("OVERALL RESULT: %d TEST(S) FAILED", $failed)));

        echo sprintf(
            "%s\nTotal Tests: %d | Passed: %s | Failed: %s | Duration: %.2f ms | Peak RAM: %.2f MB\n\n",
            $statusOverall,
            $total,
            self::green((string)$passed),
            $failed > 0 ? self::red((string)$failed) : "0",
            $totalTimeMs,
            memory_get_peak_usage(true) / (1024 * 1024)
        );
    }
}
