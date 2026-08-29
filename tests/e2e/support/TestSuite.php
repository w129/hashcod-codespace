<?php
declare(strict_types=1);

namespace Hashcod\Tests\Support;

abstract class TestSuite
{
    protected string $tier = 'Tier 1';
    protected string $suiteName = 'Base Suite';
    protected array $tests = [];
    protected array $results = [];

    public function getTier(): string
    {
        return $this->tier;
    }

    public function getSuiteName(): string
    {
        return $this->suiteName;
    }

    public function run(): array
    {
        TestReporter::suiteHeader($this->tier, $this->suiteName);
        TestHarness::setUpSandbox();

        $passed = 0;
        $failed = 0;
        $startSuite = microtime(true);

        $methods = get_class_methods($this);
        $testMethods = array_filter($methods, fn($m) => str_starts_with($m, 'test'));

        foreach ($testMethods as $method) {
            $name = ucwords(str_replace(['test_', 'test', '_'], ['', '', ' '], $method));
            $t0 = microtime(true);
            try {
                if (method_exists($this, 'setUp')) {
                    $this->setUp();
                }
                $this->$method();
                if (method_exists($this, 'tearDown')) {
                    $this->tearDown();
                }
                $t1 = microtime(true);
                $duration = ($t1 - $t0) * 1000;
                TestReporter::testResult($name, true, null, $duration);
                $passed++;
                $this->results[] = ['name' => $name, 'passed' => true, 'duration_ms' => $duration];
            } catch (\Throwable $e) {
                if (method_exists($this, 'tearDown')) {
                    try { $this->tearDown(); } catch (\Throwable $ignored) {}
                }
                $t1 = microtime(true);
                $duration = ($t1 - $t0) * 1000;
                $err = $e->getMessage() . " in " . basename($e->getFile()) . ":" . $e->getLine();
                TestReporter::testResult($name, false, $err, $duration);
                $failed++;
                $this->results[] = ['name' => $name, 'passed' => false, 'error' => $err, 'duration_ms' => $duration];
            }
        }

        TestHarness::tearDownSandbox();
        $totalSuiteTime = (microtime(true) - $startSuite) * 1000;

        return [
            'tier' => $this->tier,
            'name' => $this->suiteName,
            'total' => $passed + $failed,
            'passed' => $passed,
            'failed' => $failed,
            'duration_ms' => $totalSuiteTime,
            'results' => $this->results
        ];
    }
}
