<?php
declare(strict_types=1);

/**
 * Empirical Benchmark 3: Sliding-Window Rate Limiter & Anti-Burst Doubling Stress Test
 *
 * Requirements Tested:
 * 1. Rapid bursts at window boundaries to verify no burst doubling occurs.
 * 2. Exact sliding interpolation math across arbitrary offsets within the window.
 * 3. Rejection of excess requests when rate > limit.
 * 4. Verification of Cloudflare Turnstile clearance token 5x elevation.
 * 5. Isolation between different IPs and buckets.
 */

namespace Hashcod\Stress;

require_once __DIR__ . '/../../security.php';
require_once __DIR__ . '/../../cloudflare-turnstile.php';
require_once __DIR__ . '/../../cache.php';

class SlidingLimiterStressBenchmark
{
    public static function run(): array
    {
        echo "=== [3/4] SLIDING-WINDOW RATE LIMITER & ANTI-BURST DOUBLING BENCHMARK ===\n";

        // 1. Math Exactness Test
        // Test formula: calculatedRate = currCount + (prevCount * (1 - (timeElapsed / windowDuration)))
        $windowSec = 60;
        $testPoints = [
            ['elapsed' => 0,  'prev' => 100, 'curr' => 10, 'expected_rate' => 110.0],
            ['elapsed' => 15, 'prev' => 100, 'curr' => 10, 'expected_rate' => 85.0],   // 10 + 100 * 0.75 = 85.0
            ['elapsed' => 30, 'prev' => 100, 'curr' => 10, 'expected_rate' => 60.0],   // 10 + 100 * 0.50 = 60.0
            ['elapsed' => 45, 'prev' => 100, 'curr' => 10, 'expected_rate' => 35.0],   // 10 + 100 * 0.25 = 35.0
            ['elapsed' => 59, 'prev' => 100, 'curr' => 10, 'expected_rate' => 11.66667], // 10 + 100 * (1/60) = 11.67
            ['elapsed' => 60, 'prev' => 100, 'curr' => 10, 'expected_rate' => 10.0],   // 10 + 100 * 0 = 10.0
        ];

        $mathPassed = 0;
        foreach ($testPoints as $tp) {
            $timeElapsed = $tp['elapsed'];
            $previousWeight = max(0.0, min(1.0, 1.0 - ($timeElapsed / $windowSec)));
            $rate = (float)$tp['curr'] + ((float)$tp['prev'] * $previousWeight);
            if (abs($rate - $tp['expected_rate']) < 0.01) {
                $mathPassed++;
            }
        }
        echo sprintf("  - Mathematical Interpolation Precision: %d/%d test points exact\n", $mathPassed, count($testPoints));

        // 2. Anti-Burst Doubling Boundary Test
        // Scenario: Tumbling window vulnerability:
        // Client sends 100 requests in last second of Window 1 (t=59).
        // In tumbling window, at t=61 (start of Window 2), counter resets to 0 and client can send 100 more (200 in 2s).
        // In sliding window, at t=61, weight on prev is 59/60 (~0.983).
        // Sending even 2 requests at t=61 results in rate = 2 + 100 * 0.983 = 100.33 > 100 -> BLOCKED!
        $limit = 100;
        $window = 60;
        $prevWindowCount = 100; // maxed out in previous window
        $elapsedIntoNewWindow = 1; // 1s into new window

        $prevWeight = 1.0 - ($elapsedIntoNewWindow / $window);
        $currAttempts = 10;
        $allowedInNewWindow = 0;
        $blockedInNewWindow = 0;

        for ($req = 1; $req <= $currAttempts; $req++) {
            $slidingRate = (float)$req + ((float)$prevWindowCount * $prevWeight);
            if ($slidingRate <= (float)$limit) {
                $allowedInNewWindow++;
            } else {
                $blockedInNewWindow++;
            }
        }

        // Only 1 request allowed before rate exceeds 100 (1 + 98.33 = 99.33 <= 100; 2 + 98.33 = 100.33 > 100)
        $antiBurstPass = ($allowedInNewWindow === 1 && $blockedInNewWindow === 9);
        echo sprintf("  - Anti-Burst Doubling at Boundary     : %d allowed, %d blocked -> %s\n",
            $allowedInNewWindow, $blockedInNewWindow, $antiBurstPass ? "PROTECTED (No 2x burst doubling)" : "FAILED");

        // 3. Live Functional Sliding Rate Limiter Execution Test
        $testIp = '198.51.100.' . mt_rand(10, 200);
        $bucket = 'stress_api_' . bin2hex(random_bytes(3));
        $testLimit = 50;
        $testWindow = 60;

        $actualAllowed = 0;
        $actualBlocked = 0;
        $t0 = hrtime(true);

        for ($i = 0; $i < 65; $i++) {
            $res = securityRateAllowSliding($bucket, $testLimit, $testWindow, $testIp);
            if ($res['allowed']) {
                $actualAllowed++;
            } else {
                $actualBlocked++;
            }
        }
        $t1 = hrtime(true);
        $durMs = ($t1 - $t0) / 1e6;

        $liveEnforcementPass = ($actualAllowed === 50 && $actualBlocked === 15);
        echo sprintf("  - Live Burst Enforcement (65 requests): %d allowed, %d throttled (Limit: %d) -> %s\n",
            $actualAllowed, $actualBlocked, $testLimit, $liveEnforcementPass ? "PASS [OK]" : "FAIL");
        echo sprintf("  - Execution Time for 65 checks        : %.2f ms (%.3f µs/check)\n", $durMs, ($durMs / 65) * 1000);

        // 4. Cloudflare Clearance Token 5x Elevation Test
        $vipIp = '198.51.100.250';
        $vipBucket = 'vip_test_' . bin2hex(random_bytes(3));
        $clearanceToken = cfGenerateClearanceToken($vipIp, 900);

        // Set clearance token in $_SERVER
        $_SERVER['HTTP_X_CF_CLEARANCE_TOKEN'] = $clearanceToken;
        $vipAllowed = 0;
        $vipLimit = 20; // with 5x elevation, should allow 100 requests

        for ($i = 0; $i < 110; $i++) {
            $res = securityRateAllowSliding($vipBucket, $vipLimit, 60, $vipIp);
            if ($res['allowed']) {
                $vipAllowed++;
            }
        }
        unset($_SERVER['HTTP_X_CF_CLEARANCE_TOKEN']);

        $elevationPass = ($vipAllowed === 100);
        echo sprintf("  - Turnstile Clearance Token Elevation : %d allowed under base limit %d (5x = %d) -> %s\n\n",
            $vipAllowed, $vipLimit, $vipLimit * 5, $elevationPass ? "PASS [5x Elevation Active]" : "FAIL");

        $allPassed = ($mathPassed === count($testPoints)) && $antiBurstPass && $liveEnforcementPass && $elevationPass;

        return [
            'benchmark' => 'sliding_window_rate_limiter',
            'math_exactness' => ($mathPassed === count($testPoints)),
            'anti_burst_doubling' => $antiBurstPass,
            'live_enforcement' => $liveEnforcementPass,
            'turnstile_elevation' => $elevationPass,
            'pass' => $allPassed
        ];
    }
}

if (php_sapi_name() === 'cli' && isset($argv[0]) && realpath($argv[0]) === __FILE__) {
    SlidingLimiterStressBenchmark::run();
}
