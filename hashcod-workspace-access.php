<?php
declare(strict_types=1);

require_once __DIR__ . '/mldsa-access.php';

/**
 * Shared cloud workspace identity derived from the already-authorized numeric
 * access cookie. The raw numeric series is never stored or returned here.
 */
function hashcodWorkspaceAccessAuthorized(): bool {
    if (!codeAccessRequired()) return true;

    $token = (string)($_COOKIE['l8_numeric_series_access_v1'] ?? '');
    if ($token === '') return false;

    $data = mldsaOpen($token);
    if (!is_array($data)) return false;
    if (($data['kind'] ?? '') !== 'numeric-series-access-v1') return false;
    if ((int)($data['exp'] ?? 0) < time()) return false;
    if (!hash_equals((string)($data['ua'] ?? ''), mldsaUa())) return false;
    if (!hash_equals((string)($data['host'] ?? ''), mldsaHost())) return false;

    $proof = strtolower((string)($data['proof'] ?? ''));
    return (bool)preg_match('/^[a-f0-9]{64}$/D', $proof);
}

function hashcodWorkspaceProof(): string {
    if (!hashcodWorkspaceAccessAuthorized()) return '';
    $data = mldsaOpen((string)($_COOKIE['l8_numeric_series_access_v1'] ?? ''));
    return is_array($data) ? strtolower((string)($data['proof'] ?? '')) : '';
}

function hashcodWorkspaceKey(): string {
    $proof = hashcodWorkspaceProof();
    if ($proof === '') return '';
    // HMAC keeps the series fingerprint itself out of database identifiers.
    $digest = hash_hmac('sha256', 'hashcod-workspace-v1|' . $proof, mldsaAccessSecret());
    return 'hcw_' . substr($digest, 0, 48);
}
