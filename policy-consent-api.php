<?php
declare(strict_types=1);
define('HCS_LIBRARY_ONLY', true);
require_once __DIR__ . '/hashcod-shared-cloud.php';
require_once __DIR__ . '/policy-consent-lib.php';

$method = strtoupper((string)($_SERVER['REQUEST_METHOD'] ?? 'GET'));
if (!in_array($method, ['GET', 'POST'], true)) hcsJson(['ok' => false, 'error' => 'Method not allowed.'], 405);
if (($method === 'POST' || isset($_SERVER['HTTP_ORIGIN'])) && !mldsaOriginAllowed()) hcsJson(['ok' => false, 'error' => 'Same-origin request required.'], 403);
if (isset($_SERVER['HTTP_SEC_FETCH_SITE']) && $_SERVER['HTTP_SEC_FETCH_SITE'] === 'cross-site') hcsJson(['ok' => false, 'error' => 'Same-origin request required.'], 403);
if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0) > 512) hcsJson(['ok' => false, 'error' => 'Request too large.'], 413);
securityBootstrap('api');

if ($method === 'GET') {
    $data = policyConsentData();
    hcsJson(['ok' => true, 'accepted' => $data !== null, 'version' => POLICY_CONSENT_VERSION, 'acceptedAt' => $data['acceptedAt'] ?? null]);
}

$body = hcsBody();
if (($body['accept'] ?? null) !== true || ($body['version'] ?? null) !== POLICY_CONSENT_VERSION) {
    hcsJson(['ok' => false, 'error' => 'Acepta la versión vigente de la Use and Privacy Policy.'], 400);
}
// A valid receipt is already on file for this browser: keep it, never append duplicates.
$existing = policyConsentData();
if ($existing !== null) hcsJson(['ok' => true, 'accepted' => true, 'version' => POLICY_CONSENT_VERSION, 'acceptedAt' => $existing['acceptedAt']]);

$response = hcsCall('policy.consent', [
    'version' => POLICY_CONSENT_VERSION,
    'client' => policyConsentClientHash((string)securityClientIp()),
    'agent' => mldsaUa(),
    'host' => mldsaHost(),
]);
$data = json_decode($response['raw'], true);
// Fail closed: without a stored receipt there is no evidence, so no cookie and no access.
if (!is_array($data) || empty($data['ok']) || !is_string($data['receipt'] ?? null) || !preg_match('/^[a-f0-9-]{36}$/D', $data['receipt']) || !is_int($data['acceptedAt'] ?? null)) {
    hcsJson(['ok' => false, 'error' => 'No se pudo guardar tu aceptación. Intenta de nuevo.'], $response['status'] >= 400 ? $response['status'] : 503);
}
policyConsentIssueCookie(['receipt' => $data['receipt'], 'acceptedAt' => $data['acceptedAt']]);
hcsJson(['ok' => true, 'accepted' => true, 'version' => POLICY_CONSENT_VERSION, 'acceptedAt' => $data['acceptedAt']]);
