<?php
declare(strict_types=1);
require_once __DIR__ . '/mldsa-access.php';
require_once __DIR__ . '/policy-consent-lib.php';

function platformPeriodData(): ?array {
    $raw = (string)($_COOKIE['hashcod_platform_period_v1'] ?? '');
    if ($raw === '') return null;
    $data = mldsaOpen($raw);
    if (!is_array($data) || ($data['kind'] ?? '') !== 'platform-period-v1'
        || !hash_equals((string)($data['host'] ?? ''), mldsaHost())) return ['state' => 'expired'];
    return $data;
}
function platformPeriodExpired(): bool {
    $data = platformPeriodData();
    return is_array($data) && (($data['state'] ?? '') === 'expired'
        || (!empty($data['expiresAt']) && (int)$data['expiresAt'] <= time()));
}
function platformPeriodActive(): bool {
    $data = platformPeriodData();
    return is_array($data) && ($data['state'] ?? '') === 'active'
        && in_array($data['days'] ?? null, [10, 20, 30, 60], true)
        && is_int($data['expiresAt'] ?? null) && $data['expiresAt'] > time()
        && is_string($data['token'] ?? null) && $data['token'] !== '';
}
function platformProActive(): bool {
    $data = platformPeriodData();
    return platformPeriodActive() && is_int($data['proExpiresAt'] ?? null) && $data['proExpiresAt'] > time();
}
function platformPeriodGuard(bool $requirePro = false): void {
    // Nothing in the platform works until the Use and Privacy Policy is accepted.
    policyConsentGuard();
    if (platformPeriodActive() && (!$requirePro || platformProActive())) return;
    $expired = platformPeriodExpired();
    http_response_code(403);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    $proRequired = platformPeriodActive() && $requirePro;
    echo json_encode(['ok' => false, 'code' => $proRequired ? 'subscription_required' : ($expired ? 'platform_period_expired' : 'platform_period_required'), 'error' => $proRequired ? 'Esta función requiere Hashcod Pro. Valida el código de tu pago.' : 'Inicia la sesión desde Entrar Gratis. Si ya entraste, recarga la plataforma.']);
    exit;
}
