<?php
declare(strict_types=1);

/**
 * Hashcod Codespace 100M+ Scale High-Concurrency Resilience E2E Test Runner
 *
 * Usage:
 *   php tests/e2e/runner.php [options]
 *
 * Options:
 *   --tier=<1|2|3|4>      Run only tests in the specified tier
 *   --suite=<name>        Run only test suites matching the specified name/pattern
 *   --no-color            Disable ANSI color formatting
 *   --help, -h            Show this help message
 */

namespace Hashcod\Tests;

require_once __DIR__ . '/support/TestAssertions.php';
require_once __DIR__ . '/support/TestHarness.php';
require_once __DIR__ . '/support/TestReporter.php';
require_once __DIR__ . '/support/TestSuite.php';

// Tier 1 Suites
require_once __DIR__ . '/tier1/test_f01_etag_304.php';
require_once __DIR__ . '/tier1/test_f02_cache_control.php';
require_once __DIR__ . '/tier1/test_f03_compression_offload.php';
require_once __DIR__ . '/tier1/test_f04_cache_engine.php';
require_once __DIR__ . '/tier1/test_f05_session_pepper_cache.php';
require_once __DIR__ . '/tier1/test_f06_query_dedup.php';
require_once __DIR__ . '/tier1/test_f07_fast_path.php';
require_once __DIR__ . '/tier1/test_f08_sliding_rate_limiter.php';
require_once __DIR__ . '/tier1/test_f09_turnstile_mitigation.php';
require_once __DIR__ . '/tier1/test_f10_anti_spoof_ip.php';
require_once __DIR__ . '/tier1/test_f11_resource_guards.php';
require_once __DIR__ . '/tier1/test_f12_shutdown_error_boundary.php';
require_once __DIR__ . '/tier1/test_f13_circuit_breaker.php';
require_once __DIR__ . '/tier1/test_f14_local_fallback_sync.php';
require_once __DIR__ . '/tier1/test_f15_quantum_entropy.php';
require_once __DIR__ . '/tier1/test_f16_atomic_time.php';

// Tier 2 Suites
require_once __DIR__ . '/tier2/test_b01_cache_boundaries.php';
require_once __DIR__ . '/tier2/test_b02_rate_limit_boundaries.php';
require_once __DIR__ . '/tier2/test_b03_circuit_breaker_boundaries.php';
require_once __DIR__ . '/tier2/test_b04_security_ip_boundaries.php';
require_once __DIR__ . '/tier2/test_b05_sync_queue_boundaries.php';
require_once __DIR__ . '/tier2/test_b06_turnstile_boundaries.php';
require_once __DIR__ . '/tier2/test_b07_error_boundary_boundaries.php';

// Tier 3 Suites
require_once __DIR__ . '/tier3/test_c01_ratelimit_session_cache.php';
require_once __DIR__ . '/tier3/test_c02_circuit_breaker_fallback_logging.php';
require_once __DIR__ . '/tier3/test_c03_turnstile_fastpath.php';
require_once __DIR__ . '/tier3/test_c04_etag_compression_cache.php';
require_once __DIR__ . '/tier3/test_c05_ip_spoof_ddos_defense.php';
require_once __DIR__ . '/tier3/test_c06_query_dedup_circuit_breaker.php';

// Tier 4 Suites
require_once __DIR__ . '/tier4/test_s01_static_burst_storm.php';
require_once __DIR__ . '/tier4/test_s02_auth_concurrency_cache.php';
require_once __DIR__ . '/tier4/test_s03_ddos_turnstile_mitigation.php';
require_once __DIR__ . '/tier4/test_s04_supabase_outage_circuit_fallback.php';
require_once __DIR__ . '/tier4/test_s05_massive_spike_partial_failure.php';

// Tier 5 Adversarial Suites
require_once __DIR__ . '/tier5/test_adv01_turnstile_mitigation_adversarial.php';
require_once __DIR__ . '/tier5/test_adv02_anti_spoof_boundaries.php';
require_once __DIR__ . '/tier5/test_adv03_shutdown_secret_redaction.php';
require_once __DIR__ . '/tier5/test_adv04_sync_queue_lossless.php';

use Hashcod\Tests\Support\TestReporter;

// Parse CLI Options
$options = getopt('h', ['tier:', 'suite:', 'no-color', 'help']);

if (isset($options['h']) || isset($options['help'])) {
    echo "Hashcod Codespace E2E Concurrency & Resilience Test Runner\n";
    echo "Usage: php tests/e2e/runner.php [--tier=1|2|3|4|5] [--suite=name] [--no-color]\n";
    exit(0);
}

if (isset($options['no-color'])) {
    TestReporter::setAnsi(false);
}

$tierFilter = $options['tier'] ?? null;
$suiteFilter = $options['suite'] ?? null;

TestReporter::banner(
    "Hashcod Codespace 100M+ Scale High-Concurrency & Resilience Test Suite",
    "PQC Dark Terminal Integrity | Tiers 1-5 Verification Engine"
);

$suiteClasses = [
    // Tier 1: Feature Coverage
    \Hashcod\Tests\Tier1\TestF01Etag304::class,
    \Hashcod\Tests\Tier1\TestF02CacheControl::class,
    \Hashcod\Tests\Tier1\TestF03CompressionOffload::class,
    \Hashcod\Tests\Tier1\TestF04CacheEngine::class,
    \Hashcod\Tests\Tier1\TestF05SessionPepperCache::class,
    \Hashcod\Tests\Tier1\TestF06QueryDedup::class,
    \Hashcod\Tests\Tier1\TestF07FastPath::class,
    \Hashcod\Tests\Tier1\TestF08SlidingRateLimiter::class,
    \Hashcod\Tests\Tier1\TestF09TurnstileMitigation::class,
    \Hashcod\Tests\Tier1\TestF10AntiSpoofIp::class,
    \Hashcod\Tests\Tier1\TestF11ResourceGuards::class,
    \Hashcod\Tests\Tier1\TestF12ShutdownErrorBoundary::class,
    \Hashcod\Tests\Tier1\TestF13CircuitBreaker::class,
    \Hashcod\Tests\Tier1\TestF14LocalFallbackSync::class,
    \Hashcod\Tests\Tier1\TestF15QuantumEntropy::class,
    \Hashcod\Tests\Tier1\TestF16AtomicTime::class,

    // Tier 2: Boundary & Corner Cases
    \Hashcod\Tests\Tier2\TestB01CacheBoundaries::class,
    \Hashcod\Tests\Tier2\TestB02RateLimitBoundaries::class,
    \Hashcod\Tests\Tier2\TestB03CircuitBreakerBoundaries::class,
    \Hashcod\Tests\Tier2\TestB04SecurityIpBoundaries::class,
    \Hashcod\Tests\Tier2\TestB05SyncQueueBoundaries::class,
    \Hashcod\Tests\Tier2\TestB06TurnstileBoundaries::class,
    \Hashcod\Tests\Tier2\TestB07ErrorBoundaryBoundaries::class,

    // Tier 3: Cross-Feature Combinations
    \Hashcod\Tests\Tier3\TestC01RatelimitSessionCache::class,
    \Hashcod\Tests\Tier3\TestC02CircuitBreakerFallbackLogging::class,
    \Hashcod\Tests\Tier3\TestC03TurnstileFastpath::class,
    \Hashcod\Tests\Tier3\TestC04EtagCompressionCache::class,
    \Hashcod\Tests\Tier3\TestC05IpSpoofDdosDefense::class,
    \Hashcod\Tests\Tier3\TestC06QueryDedupCircuitBreaker::class,

    // Tier 4: Real-World Workload Scenarios
    \Hashcod\Tests\Tier4\TestS01StaticBurstStorm::class,
    \Hashcod\Tests\Tier4\TestS02AuthConcurrencyCache::class,
    \Hashcod\Tests\Tier4\TestS03DdosTurnstileMitigation::class,
    \Hashcod\Tests\Tier4\TestS04SupabaseOutageCircuitFallback::class,
    \Hashcod\Tests\Tier4\TestS05MassiveSpikePartialFailure::class,

    // Tier 5: Adversarial Empirical Challenge Coverage
    \Hashcod\Tests\Tier5\TestAdv01TurnstileMitigationAdversarial::class,
    \Hashcod\Tests\Tier5\TestAdv02AntiSpoofBoundaries::class,
    \Hashcod\Tests\Tier5\TestAdv03ShutdownSecretRedaction::class,
    \Hashcod\Tests\Tier5\TestAdv04SyncQueueLossless::class,
];

$results = [];
$totalFailures = 0;

foreach ($suiteClasses as $className) {
    /** @var \Hashcod\Tests\Support\TestSuite $suite */
    $suite = new $className();

    if ($tierFilter !== null && stripos($suite->getTier(), "Tier " . $tierFilter) === false) {
        continue;
    }

    if ($suiteFilter !== null && stripos($suite->getSuiteName(), (string)$suiteFilter) === false) {
        continue;
    }

    $suiteResult = $suite->run();
    $results[] = $suiteResult;
    $totalFailures += $suiteResult['failed'];
}

TestReporter::renderSummary($results);

// Clean temporary sandboxes
\Hashcod\Tests\Support\TestHarness::cleanSandbox();

// Exit code: 0 on success, 1 on failure
exit($totalFailures === 0 ? 0 : 1);
