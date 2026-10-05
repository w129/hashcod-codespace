<?php
declare(strict_types=1);

require_once __DIR__ . '/mldsa-access.php';
if (!function_exists('authSessionTokenFromRequest') || !function_exists('authValidateSession')) {
    @require_once __DIR__ . '/auth.php';
}

/**
 * Legacy numeric-series workspace identity.
 * Kept only so already-authorized devices can continue seeing their existing
 * cloud workspace after the entry gate is removed.
 */
function hashcodWorkspaceNumericData(): ?array {
    $token = (string)($_COOKIE['l8_numeric_series_access_v1'] ?? '');
    if ($token === '') return null;

    $data = mldsaOpen($token);
    if (!is_array($data)) return null;
    if (($data['kind'] ?? '') !== 'numeric-series-access-v1') return null;
    if ((int)($data['exp'] ?? 0) < time()) return null;
    if (!hash_equals((string)($data['ua'] ?? ''), mldsaUa())) return null;
    if (!hash_equals((string)($data['host'] ?? ''), mldsaHost())) return null;

    $proof = strtolower((string)($data['proof'] ?? ''));
    if (!preg_match('/^[a-f0-9]{64}$/D', $proof)) return null;
    return $data;
}

/**
 * Resolve a normal authenticated account without forcing login or emitting a
 * response. Entry to the platform itself remains open; cloud-private modules
 * can still use the account as their stable cross-device identity.
 */
function hashcodWorkspaceAccountId(): string {
    if (!function_exists('authSessionTokenFromRequest') || !function_exists('authValidateSession')) return '';

    $token = (string)authSessionTokenFromRequest();
    if ($token === '') return '';

    $session = authValidateSession($token);
    if (!is_array($session) || empty($session['ok']) || empty($session['authenticated'])) return '';

    $account = (string)($session['account_id'] ?? $session['user_id'] ?? '');
    $account = preg_replace('/[^a-zA-Z0-9_-]/', '', $account) ?? '';
    return substr($account, 0, 96);
}

function hashcodWorkspaceAccessAuthorized(): bool {
    return hashcodWorkspaceNumericData() !== null || hashcodWorkspaceAccountId() !== '';
}

function hashcodWorkspaceProof(): string {
    $numeric = hashcodWorkspaceNumericData();
    if (is_array($numeric)) {
        return strtolower((string)($numeric['proof'] ?? ''));
    }

    $account = hashcodWorkspaceAccountId();
    if ($account === '') return '';
    return hash_hmac('sha256', 'hashcod-account-workspace-v1|' . $account, mldsaAccessSecret());
}

function hashcodWorkspaceKey(): string {
    $proof = hashcodWorkspaceProof();
    if ($proof === '') return '';

    // HMAC keeps both the legacy series fingerprint and account identifier out
    // of database/storage identifiers.
    $digest = hash_hmac('sha256', 'hashcod-workspace-v2|' . $proof, mldsaAccessSecret());
    return 'hcw_' . substr($digest, 0, 48);
}
