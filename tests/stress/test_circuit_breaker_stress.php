<?php
declare(strict_types=1);

/**
 * Empirical Benchmark 4: Supabase 3-State Circuit Breaker Stress Test
 *
 * Requirements Tested:
 * 1. 100% remote outage simulation.
 * 2. State transitions: CLOSED -> (3 failures) -> OPEN.
 * 3. Fast-fail latency measurement in OPEN state (< 0.1ms, target < 0.01ms).
 * 4. Cooldown expiration transition to HALF_OPEN.
 * 5. Canary probe failure handling (re-trips to OPEN with 60s cooldown).
 * 6. Canary probe success handling (recovers to CLOSED with 0 failures).
 */

namespace Hashcod\Stress;

require_once __DIR__ . '/../../supabase.php';
require_once __DIR__ . '/../../cache.php';

class CircuitBreakerStressBenchmark
{
    public static function run(): array
    {
        echo "=== [4/4] SUPABASE 3-STATE CIRCUIT BREAKER & OUTAGE BENCHMARK ===\n";

        // 1. Reset state
        supabaseCircuitReset();
        $cb = supabaseCircuitBreaker();
        $initPass = ($cb['state'] === 'CLOSED' && $cb['failures'] === 0);
        echo sprintf("  - Initial Circuit State        : %s (Failures: %d) -> %s\n", $cb['state'], $cb['failures'], $initPass ? "OK" : "FAIL");

        // 2. Failure accumulation & Tripping after 3 failures
        supabaseCircuitRecordFailure('cURL connection refused (remote outage)');
        $cb1 = supabaseCircuitBreaker();
        $f1Pass = ($cb1['state'] === 'CLOSED' && $cb1['failures'] === 1);

        supabaseCircuitRecordFailure('HTTP 503 Service Unavailable');
        $cb2 = supabaseCircuitBreaker();
        $f2Pass = ($cb2['state'] === 'CLOSED' && $cb2['failures'] === 2);

        supabaseCircuitRecordFailure('Connection timeout after 2000ms');
        $cb3 = supabaseCircuitBreaker();
        $tripPass = ($cb3['state'] === 'OPEN' && $cb3['failures'] === 3 && supabaseCircuitIsOpen());

        echo sprintf("  - 1st Outage Failure           : State=%s, Failures=%d -> %s\n", $cb1['state'], $cb1['failures'], $f1Pass ? "OK" : "FAIL");
        echo sprintf("  - 2nd Outage Failure           : State=%s, Failures=%d -> %s\n", $cb2['state'], $cb2['failures'], $f2Pass ? "OK" : "FAIL");
        echo sprintf("  - 3rd Outage Failure (TRIP)    : State=%s, Failures=%d -> %s\n", $cb3['state'], $cb3['failures'], $tripPass ? "TRIPPED TO OPEN [OK]" : "FAIL");

        // 3. Fast-Fail Latency Microbenchmark in OPEN state (1,000 calls)
        $fastFailCalls = 1000;
        $t0 = hrtime(true);
        $fastFailBlocked = 0;
        for ($i = 0; $i < $fastFailCalls; $i++) {
            $req = supabaseRequest('rest/v1/l8_auth_accounts');
            if (!empty($req['fallback']) && ($req['status'] ?? 0) === 503) {
                $fastFailBlocked++;
            }
        }
        $t1 = hrtime(true);

        $fastFailNanos = $t1 - $t0;
        $fastFailMs = $fastFailNanos / 1e6;
        $avgFastFailUs = ($fastFailNanos / $fastFailCalls) / 1000;
        $avgFastFailMs = $avgFastFailUs / 1000;
        $fastFailCompliance = ($avgFastFailMs < 0.1);

        echo sprintf("  - Fast-Fail 1,000 Outage Calls : %d/1000 rejected in %.2f ms\n", $fastFailBlocked, $fastFailMs);
        echo sprintf("  - Average Fast-Fail Latency    : %.4f ms (%.2f µs per call)\n", $avgFastFailMs, $avgFastFailUs);
        echo sprintf("  - Fast-Fail < 0.1ms Target     : %s\n", $fastFailCompliance ? "PASS [SUPER FAST]" : "FAIL [SLOW]");

        // 4. Cooldown Expiration & HALF-OPEN Transition
        // Simulate 35s passing since last failure
        $simulatedCb = supabaseCircuitBreaker();
        $simulatedCb['last_failure'] = time() - 35;
        $simulatedCb['cooldown'] = 30;
        l8CacheSet('sb_circuit_breaker', $simulatedCb, 120);

        $halfOpenCb = supabaseCircuitBreaker();
        $halfOpenPass = ($halfOpenCb['state'] === 'HALF_OPEN');
        echo sprintf("  - Cooldown Expiry Transition   : State transitioned to %s -> %s\n", $halfOpenCb['state'], $halfOpenPass ? "PASS [HALF-OPEN]" : "FAIL");

        // 5. Canary Probe Failure in HALF-OPEN (immediate re-trip with 60s cooldown)
        supabaseCircuitRecordFailure('Canary probe HTTP 500');
        $reopenedCb = supabaseCircuitBreaker();
        $reopenPass = ($reopenedCb['state'] === 'OPEN' && ($reopenedCb['cooldown'] ?? 0) === 60);
        echo sprintf("  - Canary Probe Failure         : Immediate re-trip to %s (Cooldown: %ds) -> %s\n",
            $reopenedCb['state'], $reopenedCb['cooldown'] ?? 0, $reopenPass ? "PASS [Re-tripped to OPEN]" : "FAIL");

        // 6. Canary Probe Success in HALF-OPEN (full recovery to CLOSED)
        // Re-enter HALF-OPEN
        $reopenedCb['last_failure'] = time() - 65;
        l8CacheSet('sb_circuit_breaker', $reopenedCb, 120);
        $halfOpenCb2 = supabaseCircuitBreaker();

        supabaseCircuitRecordSuccess();
        $recoveredCb = supabaseCircuitBreaker();
        $recoveryPass = ($recoveredCb['state'] === 'CLOSED' && $recoveredCb['failures'] === 0);
        echo sprintf("  - Canary Probe Success         : Restored state to %s (Failures: %d) -> %s\n\n",
            $recoveredCb['state'], $recoveredCb['failures'], $recoveryPass ? "PASS [FULLY RECOVERED]" : "FAIL");

        $allPassed = $initPass && $f1Pass && $f2Pass && $tripPass && $fastFailCompliance && $halfOpenPass && $reopenPass && $recoveryPass;

        return [
            'benchmark' => 'supabase_circuit_breaker',
            'trip_after_3_failures' => $tripPass,
            'fast_fail_blocked_count' => $fastFailBlocked,
            'avg_fast_fail_ms' => $avgFastFailMs,
            'fast_fail_sub_0_1ms' => $fastFailCompliance,
            'half_open_transition' => $halfOpenPass,
            'canary_failure_reopen' => $reopenPass,
            'canary_success_recovery' => $recoveryPass,
            'pass' => $allPassed
        ];
    }
}

if (php_sapi_name() === 'cli' && isset($argv[0]) && realpath($argv[0]) === __FILE__) {
    CircuitBreakerStressBenchmark::run();
}
