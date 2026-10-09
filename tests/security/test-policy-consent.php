<?php
// Policy-consent cookie: signed, host-bound, version-bound; tampering and stale versions are rejected.
require dirname(__DIR__, 2) . '/policy-consent-lib.php';
$count = 0;
function check($value, $name) { global $count; if (!$value) throw new RuntimeException('FAIL: ' . $name); $count++; }
$_SERVER['HTTP_HOST'] = 'hashcodcodespace.dev';
$receipt = '0b9c1f3e-1a2b-4c3d-8e4f-5a6b7c8d9e0f';
$seal = fn(array $over = []) => mldsaSeal(array_replace(['kind' => 'policy-consent-v1', 'host' => 'hashcodcodespace.dev', 'version' => POLICY_CONSENT_VERSION, 'receipt' => $receipt, 'acceptedAt' => 1790000000], $over));

unset($_COOKIE[POLICY_CONSENT_COOKIE]);
check(!policyConsentValid(), 'no cookie means no consent');
$_COOKIE[POLICY_CONSENT_COOKIE] = $seal();
check(policyConsentValid(), 'valid cookie accepted');
check(policyConsentData()['receipt'] === $receipt, 'receipt carried by the cookie');
$_COOKIE[POLICY_CONSENT_COOKIE] = $seal(['version' => '1999.01.01-1']);
check(!policyConsentValid(), 'stale policy version requires a new acceptance');
$_COOKIE[POLICY_CONSENT_COOKIE] = $seal(['host' => 'evil.example']);
check(!policyConsentValid(), 'cookie is bound to the host');
$_COOKIE[POLICY_CONSENT_COOKIE] = $seal(['kind' => 'platform-period-v1']);
check(!policyConsentValid(), 'other signed cookies cannot stand in for consent');
$_COOKIE[POLICY_CONSENT_COOKIE] = $seal(['receipt' => 'not-a-receipt']);
check(!policyConsentValid(), 'malformed receipt rejected');
$_COOKIE[POLICY_CONSENT_COOKIE] = substr($seal(), 0, -2) . 'xx';
check(!policyConsentValid(), 'tampered signature rejected');
$_COOKIE[POLICY_CONSENT_COOKIE] = 'garbage';
check(!policyConsentValid(), 'garbage rejected');

$hash = policyConsentClientHash('203.0.113.9');
check(preg_match('/^[a-f0-9]{64}$/D', $hash) === 1, 'client hash is hex');
check($hash === policyConsentClientHash('203.0.113.9') && $hash !== policyConsentClientHash('203.0.113.10'), 'client hash is stable and distinguishes clients');
check(strpos($hash, '203.0.113.9') === false, 'raw address is never embedded');

// The guard must run before every platform API and before the free/paid entry POST.
$lib = file_get_contents(dirname(__DIR__, 2) . '/platform-period-lib.php');
check(preg_match('/function platformPeriodGuard\(bool \$requirePro = false\): void \{\s*[^}]*policyConsentGuard\(\);/', $lib) === 1, 'platformPeriodGuard enforces consent first');
$api = file_get_contents(dirname(__DIR__, 2) . '/platform-period-api.php');
check(strpos($api, "if (\$method === 'POST') policyConsentGuard();") !== false, 'entry POST requires consent');
$route = file_get_contents(dirname(__DIR__, 2) . '/router.php');
check(strpos($route, "'/api/policy-consent'") !== false, 'consent route registered');
$sql = file_get_contents(dirname(__DIR__, 2) . '/supabase/migrations/20261009130000_policy_consent_evidence.sql');
check(strpos($sql, 'before update or delete') !== false && strpos($sql, 'before truncate') !== false, 'evidence table is append-only');
echo "policy consent: $count checks passed\n";
