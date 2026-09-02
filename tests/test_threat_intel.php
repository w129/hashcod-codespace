<?php
/**
 * Test Suite for Threat Intelligence & Bot Defense Subsystem (Milestone 1)
 */

require_once __DIR__ . '/../security.php';
require_once __DIR__ . '/../threat-intel.php';

$testsPassed = 0;
$testsFailed = 0;

function assertTest(bool $condition, string $title, string $details = '') {
    global $testsPassed, $testsFailed;
    if ($condition) {
        $testsPassed++;
        echo "  [PASS] {$title}\n";
    } else {
        $testsFailed++;
        echo "  [FAIL] {$title} — {$details}\n";
    }
}

echo "=== Milestone 1: Threat Intel & Bot Defense Test Suite ===\n\n";

// 1. Private / Loopback IP detection
echo "--- Testing Private / Loopback IP Whitelist ---\n";
assertTest(threatIntelIsPrivateIp('127.0.0.1') === true, '127.0.0.1 is private');
assertTest(threatIntelIsPrivateIp('::1') === true, '::1 is private');
assertTest(threatIntelIsPrivateIp('10.0.0.1') === true, '10.0.0.1 is private');
assertTest(threatIntelIsPrivateIp('192.168.1.100') === true, '192.168.1.100 is private');
assertTest(threatIntelIsPrivateIp('172.16.0.5') === true, '172.16.0.5 is private');
assertTest(threatIntelIsPrivateIp('100.64.0.1') === true, '100.64.0.1 (CGNAT) is private');
assertTest(threatIntelIsPrivateIp('8.8.8.8') === false, '8.8.8.8 is public');
assertTest(threatIntelIsPrivateIp('1.1.1.1') === false, '1.1.1.1 is public');

// 2. Loopback threat check
echo "\n--- Testing IP Reputation on Local/Private IPs ---\n";
$localRep = threatIntelCheckIp('127.0.0.1');
assertTest($localRep['status'] === 'ALLOW', '127.0.0.1 status is ALLOW', json_encode($localRep));
assertTest($localRep['score'] === 0, '127.0.0.1 threat score is 0');
assertTest($localRep['source'] === 'local_whitelist', '127.0.0.1 source is local_whitelist');

// 3. Local Heuristic Scanners
echo "\n--- Testing Local Heuristic Scanner Detection ---\n";
$scannerHeuristic = threatIntelLocalHeuristicScore('203.0.113.50', 'sqlmap/1.5.2#stable (http://sqlmap.org)');
assertTest($scannerHeuristic['score'] >= 85, 'sqlmap UA gets threat score >= 85');
assertTest($scannerHeuristic['status'] === 'BLOCK', 'sqlmap UA gets status BLOCK');

$niktoHeuristic = threatIntelLocalHeuristicScore('203.0.113.51', 'Mozilla/5.0 (compatible; Nikto/2.1.6)');
assertTest($niktoHeuristic['score'] >= 85, 'Nikto UA gets threat score >= 85');
assertTest($niktoHeuristic['status'] === 'BLOCK', 'Nikto UA gets status BLOCK');

// 4. Multi-tier Caching
echo "\n--- Testing Multi-tier Caching (APCu/Mem + Partitioned Disk) ---\n";
$testIp = '198.51.100.42';
$dummyRecord = [
    'status' => 'CHALLENGE',
    'score' => 65,
    'source' => 'test_suite',
    'ip' => $testIp,
    'details' => ['test' => true]
];
$cachedOk = threatIntelSetCachedReputation($testIp, $dummyRecord, 3600);
assertTest($cachedOk === true, 'threatIntelSetCachedReputation wrote shard successfully');

$shardPath = threatIntelShardPath($testIp);
assertTest(file_exists($shardPath), '2-tier shard file exists on disk: ' . $shardPath);

$retrieved = threatIntelGetCachedReputation($testIp);
assertTest($retrieved !== null && $retrieved['score'] === 65, 'threatIntelGetCachedReputation retrieved score 65');
assertTest(!empty($retrieved['cached']), 'Retrieved record is marked as cached');

$checkWithCache = threatIntelCheckIp($testIp);
assertTest($checkWithCache['score'] === 65, 'threatIntelCheckIp uses cached score');
assertTest($checkWithCache['status'] === 'CHALLENGE', 'threatIntelCheckIp returns cached CHALLENGE');
assertTest($checkWithCache['cached'] === true, 'threatIntelCheckIp marked as cached');

// 5. Honeypot Deception Traps
echo "\n--- Testing Honeypot Deception Traps ---\n";
assertTest(threatIntelIsHoneypot('/api/honeypot/actuator') === true, '/api/honeypot/actuator is a honeypot');
assertTest(threatIntelIsHoneypot('/.env') === true, '/.env is a honeypot');
assertTest(threatIntelIsHoneypot('/.env.production') === true, '/.env.production is a honeypot');
assertTest(threatIntelIsHoneypot('/api/admin/debug') === true, '/api/admin/debug is a honeypot');
assertTest(threatIntelIsHoneypot('/.aws/credentials') === true, '/.aws/credentials is a honeypot');
assertTest(threatIntelIsHoneypot('/api/command') === false, '/api/command is not a honeypot');
assertTest(threatIntelIsHoneypot('/api/grid/convert') === false, '/api/grid/convert is not a honeypot');

$honeypotIp = '203.0.113.99';
threatIntelHoneypotTrigger('/api/honeypot/actuator', $honeypotIp);
$postTrapRep = threatIntelCheckIp($honeypotIp);
assertTest($postTrapRep['status'] === 'BLOCK', 'Offending honeypot IP is blocked');
assertTest($postTrapRep['score'] === 100, 'Offending honeypot IP gets score 100');
assertTest($postTrapRep['source'] === 'honeypot_trap' || $postTrapRep['source'] === 'local_banlist', 'Source indicates honeypot or ban');

// 6. Telemetry & Stats
echo "\n--- Testing Telemetry & Reporting ---\n";
threatIntelRecordTelemetry([
    'event' => 'TEST_EVENT',
    'ip' => '198.51.100.77',
    'score' => 20,
    'status' => 'ALLOW',
    'source' => 'test'
]);

$telemetry = threatIntelGetTelemetry();
assertTest(!empty($telemetry['ok']), 'threatIntelGetTelemetry returned ok');
assertTest(isset($telemetry['stats']['total_checks']), 'Telemetry contains total_checks');
assertTest(isset($telemetry['providers']['abuseipdb']), 'Telemetry lists AbuseIPDB');
assertTest(isset($telemetry['providers']['ipqualityscore']), 'Telemetry lists IPQS');
assertTest(isset($telemetry['providers']['stopforumspam']), 'Telemetry lists StopForumSpam');
assertTest(isset($telemetry['providers']['local_heuristics']), 'Telemetry lists local_heuristics');
assertTest(count($telemetry['recent_events']) > 0, 'Telemetry contains recent events');

echo "\n============================================\n";
echo "Results: {$testsPassed} passed, {$testsFailed} failed.\n";
if ($testsFailed === 0) {
    echo "ALL THREAT INTEL & BOT DEFENSE TESTS PASSED!\n";
    exit(0);
} else {
    echo "TEST FAILURES DETECTED!\n";
    exit(1);
}
