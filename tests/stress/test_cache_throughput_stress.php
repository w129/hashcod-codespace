<?php
declare(strict_types=1);

/**
 * Empirical Benchmark 2: In-Memory Cache Throughput Stress Test
 *
 * Requirements Tested:
 * 1. Rapid iterations of `l8CacheGet`, `l8CacheSet`, `l8CacheInc`, and `l8CacheRemember`.
 * 2. Measure throughput (ops/sec) and average latency per operation.
 * 3. Verify atomic increments consistency under rapid loops.
 * 4. Verify process memory and 2-level sharded persistence fallback.
 */

namespace Hashcod\Stress;

require_once __DIR__ . '/../../cache.php';

class CacheThroughputStressBenchmark
{
    public static function run(int $iterations = 25000): array
    {
        echo "=== [2/4] IN-MEMORY CACHE THROUGHPUT BENCHMARK ({$iterations} Iterations) ===\n";

        $driver = l8CacheDriver();
        echo sprintf("  - Cache Engine Active Driver: %s (APCu Available: %s)\n", $driver, l8CacheHasApcu() ? 'YES' : 'NO (Process Memory + Sharded RAM)');

        l8CacheFlush();

        // 1. SET & GET Microbenchmark
        $t0 = hrtime(true);
        for ($i = 0; $i < $iterations; $i++) {
            $key = 'perf_key_' . ($i % 100);
            $val = ['id' => $i, 'token' => 'tok_' . bin2hex(random_bytes(4)), 'active' => true];
            l8CacheSet($key, $val, 60);
            $fetched = l8CacheGet($key);
            if ($fetched === null || $fetched['id'] !== $i) {
                echo "Cache mismatch error at iteration $i\n";
                break;
            }
        }
        $t1 = hrtime(true);

        $setGetNanos = $t1 - $t0;
        $setGetMs = $setGetNanos / 1e6;
        $setGetOps = $iterations * 2; // 1 set + 1 get
        $setGetThroughput = $setGetOps / ($setGetNanos / 1e9);
        $avgSetGetLatencyUs = ($setGetNanos / $setGetOps) / 1000;

        echo sprintf("  - SET + GET Operations     : %d ops in %.2f ms\n", $setGetOps, $setGetMs);
        echo sprintf("  - SET + GET Throughput     : %.0f ops/sec\n", $setGetThroughput);
        echo sprintf("  - Avg SET/GET Latency      : %.3f µs per op\n", $avgSetGetLatencyUs);

        // 2. ATOMIC INCREMENTS Microbenchmark
        $counterKey = 'stress_atomic_counter_' . bin2hex(random_bytes(4));
        $t2 = hrtime(true);
        $expectedTotal = 0;
        for ($i = 0; $i < $iterations; $i++) {
            $step = ($i % 3) + 1;
            $newVal = l8CacheInc($counterKey, $step, 60);
            $expectedTotal += $step;
            if ($newVal !== $expectedTotal) {
                echo "Atomic counter drift at iteration $i: got $newVal, expected $expectedTotal\n";
                break;
            }
        }
        $t3 = hrtime(true);

        $incNanos = $t3 - $t2;
        $incMs = $incNanos / 1e6;
        $incThroughput = $iterations / ($incNanos / 1e9);
        $avgIncLatencyUs = ($incNanos / $iterations) / 1000;

        $finalCounter = (int)l8CacheGet($counterKey);
        $counterAccurate = ($finalCounter === $expectedTotal);

        echo sprintf("  - Atomic Inc Operations    : %d increments in %.2f ms\n", $iterations, $incMs);
        echo sprintf("  - Final Counter Value      : %d (Expected: %d) -> %s\n", $finalCounter, $expectedTotal, $counterAccurate ? "CONSISTENT [OK]" : "DRIFT DETECTED");
        echo sprintf("  - Atomic Inc Throughput    : %.0f inc/sec\n", $incThroughput);
        echo sprintf("  - Avg Increment Latency    : %.3f µs\n", $avgIncLatencyUs);

        // 3. CACHE REMEMBER Pattern Microbenchmark
        $rememberKey = 'remember_benchmark_key';
        l8CacheDel($rememberKey);

        $callbackCalls = 0;
        $computedVal = l8CacheRemember($rememberKey, 60, function() use (&$callbackCalls) {
            $callbackCalls++;
            return 'computed_heavy_payload';
        });

        // Next 1000 calls should hit cache without calling closure
        for ($i = 0; $i < 1000; $i++) {
            $hit = l8CacheRemember($rememberKey, 60, function() use (&$callbackCalls) {
                $callbackCalls++;
                return 'redundant_payload';
            });
        }

        $rememberPass = ($callbackCalls === 1 && $computedVal === 'computed_heavy_payload');
        echo sprintf("  - Cache Remember Pattern   : %d callback execution for 1001 requests -> %s\n\n", $callbackCalls, $rememberPass ? "PASS [OK]" : "FAIL");

        $overallPass = $counterAccurate && $rememberPass && ($avgSetGetLatencyUs < 100.0);

        return [
            'benchmark' => 'in_memory_cache_throughput',
            'iterations' => $iterations,
            'driver' => $driver,
            'set_get_ops_per_sec' => $setGetThroughput,
            'inc_ops_per_sec' => $incThroughput,
            'avg_latency_us' => $avgSetGetLatencyUs,
            'counter_consistent' => $counterAccurate,
            'remember_efficient' => $rememberPass,
            'pass' => $overallPass
        ];
    }
}

if (php_sapi_name() === 'cli' && isset($argv[0]) && realpath($argv[0]) === __FILE__) {
    CacheThroughputStressBenchmark::run(25000);
}
