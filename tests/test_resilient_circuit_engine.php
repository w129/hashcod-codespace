<?php
declare(strict_types=1);

/**
 * tests/test_resilient_circuit_engine.php — Comprehensive Unit & Integration Test Suite
 * for Milestone 4 (Resilient Service Engine & Circuit Breaker)
 */

require_once __DIR__ . '/../circuit-breaker.php';
require_once __DIR__ . '/../resilient-proxy.php';

$totalTests = 0;
$passedTests = 0;
$failedTests = 0;

function it(string $description, callable $fn): void {
    global $totalTests, $passedTests, $failedTests;
    $totalTests++;
    try {
        $fn();
        echo "  [PASS] " . $description . "\n";
        $passedTests++;
    } catch (\Throwable $e) {
        echo "  [FAIL] " . $description . ": " . $e->getMessage() . "\n";
        $failedTests++;
    }
}

function expectEq($expected, $actual, string $message = ''): void {
    if ($expected !== $actual) {
        $msg = $message ?: "Expected " . var_export($expected, true) . ", got " . var_export($actual, true);
        throw new \Exception($msg);
    }
}

function expectTrue($actual, string $message = ''): void {
    if ($actual !== true) {
        $msg = $message ?: "Expected true, got " . var_export($actual, true);
        throw new \Exception($msg);
    }
}

function expectFalse($actual, string $message = ''): void {
    if ($actual !== false) {
        $msg = $message ?: "Expected false, got " . var_export($actual, true);
        throw new \Exception($msg);
    }
}

function expectNotNull($actual, string $message = ''): void {
    if ($actual === null) {
        $msg = $message ?: "Expected non-null value";
        throw new \Exception($msg);
    }
}

echo "\n=======================================================\n";
echo "=== Milestone 4: Circuit Breaker & Resilient Proxy ====\n";
echo "=======================================================\n\n";

// -----------------------------------------------------------------------------
// Suite 1: Circuit Breaker State Machine & Transitions
// -----------------------------------------------------------------------------
echo "[Suite 1: Circuit Breaker Core Functionality]\n";

it("Initial state is CLOSED with 0 failures", function() {
    $service = 'test_init_' . bin2hex(random_bytes(4));
    $status = circuitBreakerGetStatus($service);
    expectEq(CIRCUIT_STATE_CLOSED, $status['state']);
    expectEq(0, $status['failures']);
    expectTrue(circuitBreakerIsAvailable($service));
});

it("3 consecutive failures trip circuit to OPEN", function() {
    $service = 'test_trip_' . bin2hex(random_bytes(4));
    circuitBreakerRecordFailure($service, 'fail 1', 500);
    $s1 = circuitBreakerGetStatus($service);
    expectEq(CIRCUIT_STATE_CLOSED, $s1['state']);
    expectEq(1, $s1['failures']);

    circuitBreakerRecordFailure($service, 'fail 2', 502);
    $s2 = circuitBreakerGetStatus($service);
    expectEq(CIRCUIT_STATE_CLOSED, $s2['state']);
    expectEq(2, $s2['failures']);

    circuitBreakerRecordFailure($service, 'fail 3', 503);
    $s3 = circuitBreakerGetStatus($service);
    expectEq(CIRCUIT_STATE_OPEN, $s3['state']);
    expectEq(3, $s3['failures']);
    expectFalse(circuitBreakerIsAvailable($service));
});

it("HTTP 4xx client errors do NOT trip circuit", function() {
    $service = 'test_client_err_' . bin2hex(random_bytes(4));
    foreach ([400, 401, 403, 404, 422] as $status) {
        circuitBreakerRecordFailure($service, "client error $status", $status);
    }
    $state = circuitBreakerGetStatus($service);
    expectEq(CIRCUIT_STATE_CLOSED, $state['state']);
    expectEq(0, $state['failures']);
});

it("Intermittent success resets consecutive failure counter", function() {
    $service = 'test_flapping_' . bin2hex(random_bytes(4));
    circuitBreakerRecordFailure($service, 'err', 500);
    circuitBreakerRecordFailure($service, 'err', 500);
    expectEq(2, circuitBreakerGetStatus($service)['failures']);

    circuitBreakerRecordSuccess($service, 10.5);
    expectEq(0, circuitBreakerGetStatus($service)['failures']);
    expectEq(CIRCUIT_STATE_CLOSED, circuitBreakerGetStatus($service)['state']);
});

it("OPEN state fast-fails in < 0.1ms without executing remote callable", function() {
    $service = 'test_fastfail_' . bin2hex(random_bytes(4));
    circuitBreakerTrip($service, 30, 'force open');

    $remoteExecuted = 0;
    $fn = function() use (&$remoteExecuted) {
        $remoteExecuted++;
        return ['ok' => true];
    };

    $fallbackFn = function($ctx) {
        return ['ok' => false, 'circuit' => $ctx['circuit'], 'fallback' => true];
    };

    $t0 = microtime(true);
    $res = circuitBreakerExecute($service, $fn, $fallbackFn);
    $t1 = microtime(true);
    $durationMs = ($t1 - $t0) * 1000.0;

    expectEq(0, $remoteExecuted, "Remote function must NOT be executed when circuit is OPEN");
    expectTrue($res['fallback']);
    expectEq(CIRCUIT_STATE_OPEN, $res['circuit']);
    expectTrue($durationMs < 0.5, "Fast-fail execution must be sub-millisecond (got {$durationMs}ms)");
});

it("Cooldown expiration transitions circuit from OPEN to HALF_OPEN", function() {
    $service = 'test_cooldown_' . bin2hex(random_bytes(4));
    circuitBreakerConfigure($service, ['reset_timeout' => 0]); // 0s cooldown
    circuitBreakerTrip($service, 0, 'zero cooldown');

    $status = circuitBreakerGetStatus($service);
    expectEq(CIRCUIT_STATE_HALF_OPEN, $status['state']);
});

it("Successful probes in HALF_OPEN close the circuit", function() {
    $service = 'test_halfopen_close_' . bin2hex(random_bytes(4));
    circuitBreakerConfigure($service, ['reset_timeout' => 0, 'recovery_success_threshold' => 2]);
    circuitBreakerTrip($service, 0, 'trip');

    $s = circuitBreakerGetStatus($service);
    expectEq(CIRCUIT_STATE_HALF_OPEN, $s['state']);

    // Probe 1
    circuitBreakerRecordSuccess($service, 15.0);
    $s1 = circuitBreakerGetStatus($service);
    expectEq(CIRCUIT_STATE_HALF_OPEN, $s1['state']);
    expectEq(1, $s1['half_open_successes']);

    // Probe 2 (reaches threshold)
    circuitBreakerRecordSuccess($service, 12.0);
    $s2 = circuitBreakerGetStatus($service);
    expectEq(CIRCUIT_STATE_CLOSED, $s2['state']);
    expectEq(0, $s2['failures']);
});

it("Canary failure in HALF_OPEN trips circuit back to OPEN immediately", function() {
    $service = 'test_halfopen_fail_' . bin2hex(random_bytes(4));
    circuitBreakerConfigure($service, ['reset_timeout' => 0]);
    circuitBreakerTrip($service, 0, 'trip');

    expectEq(CIRCUIT_STATE_HALF_OPEN, circuitBreakerGetStatus($service)['state']);

    circuitBreakerRecordFailure($service, 'canary failed', 503);
    $status = circuitBreakerGetStatus($service);
    expectEq(CIRCUIT_STATE_OPEN, $status['state']);
});

it("DEGRADED state can be triggered and restored", function() {
    $service = 'test_degraded_' . bin2hex(random_bytes(4));
    circuitBreakerConfigure($service, [
        'degraded_latency_threshold_ms' => 500,
        'degraded_consecutive_slow' => 2
    ]);

    circuitBreakerRecordSuccess($service, 600.0);
    expectEq(CIRCUIT_STATE_CLOSED, circuitBreakerGetStatus($service)['state']);

    circuitBreakerRecordSuccess($service, 700.0);
    expectEq(CIRCUIT_STATE_DEGRADED, circuitBreakerGetStatus($service)['state']);

    // Recovery
    circuitBreakerRecordSuccess($service, 50.0);
    expectEq(CIRCUIT_STATE_CLOSED, circuitBreakerGetStatus($service)['state']);
});

it("Disk persistence survives state reload", function() {
    $service = 'test_persist_' . bin2hex(random_bytes(4));
    circuitBreakerRecordFailure($service, 'disk err 1', 500);
    circuitBreakerRecordFailure($service, 'disk err 2', 500);

    // Clear in-memory cache to force disk load
    unset($GLOBALS['__L8_CIRCUIT_BREAKER_STATE'][$service]);

    $reloaded = circuitBreakerGetStatus($service);
    expectEq(2, $reloaded['failures']);
    expectEq('disk err 2', $reloaded['last_error']);
});

// -----------------------------------------------------------------------------
// Suite 2: Resilient Proxy 4-Tier Caching & SWR
// -----------------------------------------------------------------------------
echo "\n[Suite 2: Resilient Proxy Multi-Tier Cache & SWR]\n";

it("L1, L2, L3 caching tiers store and return cached response", function() {
    $service = 'test_cache_svc_' . bin2hex(random_bytes(4));
    $key = hash('sha256', 'GET|https://api.hashcod.dev/test|');

    resilientProxyCacheSet($service, $key, [
        'data' => ['message' => 'tier_test_success'],
        'raw_body' => '{"message":"tier_test_success"}',
        'status' => 200,
        'headers' => ['content-type' => 'application/json']
    ], 300, 3600);

    // L1 hit
    $l1 = resilientProxyCacheGet($service, $key, false);
    expectNotNull($l1);
    expectEq('L1', $l1['tier']);
    expectEq('tier_test_success', $l1['entry']['data']['message']);

    // Clear L1 to test L3
    unset($GLOBALS['__L8_RESILIENT_PROXY_L1_CACHE'][$key]);
    $l3 = resilientProxyCacheGet($service, $key, false);
    expectNotNull($l3);
    expectTrue($l3['tier'] === 'L3' || $l3['tier'] === 'L2');
    expectEq('tier_test_success', $l3['entry']['data']['message']);
});

it("Stale-While-Revalidate (L4 SWR) serves stale cache when upstream is offline", function() {
    $service = 'test_swr_' . bin2hex(random_bytes(4));
    $url = 'https://api.offline-test.dev/data';
    $key = resilientProxyComputeKey($url, 'GET');

    // Store expired cache with valid SWR window
    $now = time();
    $entry = [
        'key' => $key,
        'service' => $service,
        'data' => ['stale_data' => 'swr_content'],
        'raw_body' => '{"stale_data":"swr_content"}',
        'status' => 200,
        'headers' => [],
        'created_at' => $now - 400,
        'fresh_until' => $now - 100, // Expired 100s ago
        'stale_until' => $now + 3600  // SWR valid for 1 hour
    ];
    $GLOBALS['__L8_RESILIENT_PROXY_L1_CACHE'][$key] = $entry;

    // Trip circuit to simulate upstream outage
    circuitBreakerTrip($service, 30, 'outage');

    $res = resilientProxyFetch($url, [
        'service' => $service,
        'ttl' => 300
    ]);

    expectTrue($res['ok']);
    expectTrue($res['from_cache']);
    expectTrue($res['is_stale']);
    expectEq('L4_SWR', $res['cache_tier']);
    expectEq('swr_content', $res['data']['stale_data']);
});

// -----------------------------------------------------------------------------
// Suite 3: Deterministic Offline Synthetic Fallbacks
// -----------------------------------------------------------------------------
echo "\n[Suite 3: Offline Synthetic Fallback Engine]\n";

it("OSV.dev synthetic fallback returns clean vulnerability schema", function() {
    $service = 'osv';
    circuitBreakerTrip($service, 30, 'osv down');

    $res = resilientProxyFetch('https://api.osv.dev/v1/querybatch', [
        'service' => 'osv',
        'method' => 'POST',
        'body' => ['queries' => []]
    ]);

    expectTrue($res['ok']);
    expectTrue($res['fallback']);
    expectTrue(is_array($res['data']['vulns']));
    expectEq(0, count($res['data']['vulns']));
});

it("NIST NVD synthetic fallback returns valid CVE schema", function() {
    $service = 'nvd';
    circuitBreakerTrip($service, 30, 'nvd down');

    $res = resilientProxyFetch('https://services.nvd.nist.gov/rest/json/cves/2.0?cveId=CVE-2026-9999', [
        'service' => 'nvd'
    ]);

    expectTrue($res['ok']);
    expectTrue($res['fallback']);
    expectEq('NVD_CVE', $res['data']['format']);
    expectEq(0, $res['data']['totalResults']);
    expectTrue(is_array($res['data']['vulnerabilities']));
});

it("ANU QRNG synthetic fallback generates secure random numbers", function() {
    $service = 'anu_qrng';
    circuitBreakerTrip($service, 30, 'anu down');

    $res = resilientProxyFetch('https://qrng.anu.edu.au/API/jsonI.php?length=32&type=uint8', [
        'service' => 'anu_qrng'
    ]);

    expectTrue($res['ok']);
    expectTrue($res['fallback']);
    expectTrue($res['data']['success']);
    expectEq(32, $res['data']['length']);
    expectEq(32, count($res['data']['data']));
});

it("NIST Beacon synthetic fallback produces valid 2.0 pulse", function() {
    $service = 'nist_beacon';
    circuitBreakerTrip($service, 30, 'nist down');

    $res = resilientProxyFetch('https://beacon.nist.gov/beacon/2.0/pulse/last', [
        'service' => 'nist_beacon'
    ]);

    expectTrue($res['ok']);
    expectTrue($res['fallback']);
    expectNotNull($res['data']['pulse']);
    expectEq('2.0', $res['data']['pulse']['version']);
    expectEq(128, strlen($res['data']['pulse']['outputValue'])); // 64 bytes hex
});

it("Cloudflare Trace synthetic fallback provides valid trace string", function() {
    $service = 'cloudflare_trace';
    circuitBreakerTrip($service, 30, 'cf down');

    $res = resilientProxyFetch('https://www.cloudflare.com/cdn-cgi/trace', [
        'service' => 'cloudflare_trace'
    ]);

    expectTrue($res['ok']);
    expectTrue($res['fallback']);
    expectTrue(str_contains((string)$res['data'], 'colo=EDGE'));
});

it("AbuseIPDB and IPQS synthetic fallbacks return clean reputation scores", function() {
    $resAbuse = resilientProxyFetch('https://api.abuseipdb.com/api/v2/check?ipAddress=8.8.8.8', [
        'service' => 'abuseipdb',
        'bypass_cache' => true
    ]);
    expectTrue($resAbuse['ok']);
    expectEq(0, $resAbuse['data']['data']['abuseConfidenceScore']);

    $resIpqs = resilientProxyFetch('https://ipqualityscore.com/api/json/ip/KEY/8.8.8.8', [
        'service' => 'ipqualityscore',
        'bypass_cache' => true
    ]);
    expectTrue($resIpqs['ok']);
    expectEq(0, $resIpqs['data']['fraud_score']);
});

it("Custom fallback generator registration works seamlessly", function() {
    $service = 'custom_payment_gw';
    resilientProxyRegisterFallback($service, function($url, $options) {
        return ['status' => 'queued_for_reconciliation', 'custom' => true];
    });

    circuitBreakerTrip($service, 30, 'gateway outage');

    $res = resilientProxyFetch('https://api.payment.local/charge', [
        'service' => $service,
        'method' => 'POST'
    ]);

    expectTrue($res['ok']);
    expectTrue($res['fallback']);
    expectEq('queued_for_reconciliation', $res['data']['status']);
    expectTrue($res['data']['custom']);
});

// -----------------------------------------------------------------------------
// Summary
// -----------------------------------------------------------------------------
echo "\n=======================================================\n";
echo "Test Execution Complete: $passedTests / $totalTests Passed ($failedTests Failed)\n";
echo "=======================================================\n";

if ($failedTests > 0) {
    exit(1);
}
