<?php
declare(strict_types=1);

/**
 * Master Runner for High-Concurrency Stress & Adversarial Micro-Benchmarks
 *
 * Executes:
 * 1. Static Asset Delivery (10,000 requests, ETag, 304 response times < 1ms, header compliance)
 * 2. In-Memory Cache Throughput (25,000 iterations of Get/Set/Inc, memory + sharded RAM)
 * 3. Sliding-Window Rate Limiter (Boundary bursts, anti-burst doubling, exact math, Turnstile clearance 5x)
 * 4. Supabase Circuit Breaker (100% remote outage, CLOSED->OPEN after 3 failures, fast-fail < 0.1ms, HALF-OPEN recovery)
 */

namespace Hashcod\Stress;

require_once __DIR__ . '/test_static_asset_stress.php';
require_once __DIR__ . '/test_cache_throughput_stress.php';
require_once __DIR__ . '/test_sliding_limiter_stress.php';
require_once __DIR__ . '/test_circuit_breaker_stress.php';

echo "\n";
echo "╔═══════════════════════════════════════════════════════════════════════════╗\n";
echo "║ HASHCOD CODESPACE 100M+ SCALE CONCURRENCY & ADVERSARIAL STRESS HARNESS    ║\n";
echo "║ PQC Dark Terminal High-Concurrency Verification Engine                   ║\n";
echo "╚═══════════════════════════════════════════════════════════════════════════╝\n\n";

$tOverallStart = hrtime(true);

$res1 = StaticAssetStressBenchmark::run(10000);
$res2 = CacheThroughputStressBenchmark::run(25000);
$res3 = SlidingLimiterStressBenchmark::run();
$res4 = CircuitBreakerStressBenchmark::run();

$tOverallEnd = hrtime(true);
$overallMs = ($tOverallEnd - $tOverallStart) / 1e6;

$allPassed = $res1['pass'] && $res2['pass'] && $res3['pass'] && $res4['pass'];

echo "╔═══════════════════════════════════════════════════════════════════════════╗\n";
echo "║                       BENCHMARK & STRESS SUMMARY                          ║\n";
echo "╠═══════════════════════════════════════════════════════════════════════════╣\n";
echo sprintf("║ 1. Static Asset 304 Engine (10k reqs)  : %s (Avg: %.4f ms)      ║\n", $res1['pass'] ? "PASS [OK]" : "FAIL     ", $res1['avg_ms_per_req']);
echo sprintf("║ 2. In-Memory Cache Throughput (25k ops): %s (%.0f ops/s)       ║\n", $res2['pass'] ? "PASS [OK]" : "FAIL     ", $res2['set_get_ops_per_sec']);
echo sprintf("║ 3. Sliding-Window Limiter & Anti-Burst : %s (Exact Math + 5x)   ║\n", $res3['pass'] ? "PASS [OK]" : "FAIL     ");
echo sprintf("║ 4. Supabase Circuit Breaker & Outage   : %s (Fast-Fail: %.4f ms) ║\n", $res4['pass'] ? "PASS [OK]" : "FAIL     ", $res4['avg_fast_fail_ms']);
echo "╠═══════════════════════════════════════════════════════════════════════════╣\n";
echo sprintf("║ OVERALL EMPIRICAL VERDICT              : %s (Total: %.2f ms)      ║\n", $allPassed ? "APPROVE [100% PASS]" : "REJECT [FAILURES]", $overallMs);
echo "╚═══════════════════════════════════════════════════════════════════════════╝\n\n";

exit($allPassed ? 0 : 1);
