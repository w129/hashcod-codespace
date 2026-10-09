<?php
declare(strict_types=1);
require_once __DIR__ . '/mldsa-access.php';

// Version of the Use and Privacy Policy shown at /privacy. Bump it to require a fresh acceptance.
const POLICY_CONSENT_VERSION = '2026.09.18-2';
const POLICY_CONSENT_COOKIE = 'hashcod_policy_consent_v1';
// Browsers cap cookie lifetime at 400 days; the durable proof is the append-only server record.
const POLICY_CONSENT_TTL = 34560000;

function policyConsentData(): ?array {
    $raw = (string)($_COOKIE[POLICY_CONSENT_COOKIE] ?? '');
    if ($raw === '') return null;
    $data = mldsaOpen($raw);
    if (!is_array($data) || ($data['kind'] ?? '') !== 'policy-consent-v1'
        || !hash_equals(mldsaHost(), (string)($data['host'] ?? ''))
        || ($data['version'] ?? '') !== POLICY_CONSENT_VERSION
        || !is_string($data['receipt'] ?? null) || !preg_match('/^[a-f0-9-]{36}$/D', $data['receipt'])
        || !is_int($data['acceptedAt'] ?? null)) return null;
    return $data;
}

function policyConsentValid(): bool {
    return policyConsentData() !== null;
}

function policyConsentGuard(): void {
    if (policyConsentValid()) return;
    http_response_code(403);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode(['ok' => false, 'code' => 'policy_consent_required', 'error' => 'Acepta la Use and Privacy Policy para continuar.'], JSON_UNESCAPED_UNICODE);
    exit;
}

// Salted hash of the client address: evidence of who accepted without storing the address itself.
function policyConsentClientHash(string $ip): string {
    return hash_hmac('sha256', 'policy-consent|' . $ip, mldsaAccessSecret());
}

function policyConsentIssueCookie(array $evidence): void {
    mldsaCookie(POLICY_CONSENT_COOKIE, mldsaSeal([
        'kind' => 'policy-consent-v1',
        'host' => mldsaHost(),
        'version' => POLICY_CONSENT_VERSION,
        'receipt' => $evidence['receipt'],
        'acceptedAt' => $evidence['acceptedAt'],
    ]), time() + POLICY_CONSENT_TTL);
}
