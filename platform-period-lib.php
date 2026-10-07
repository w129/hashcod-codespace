<?php
declare(strict_types=1);
require_once __DIR__ . '/mldsa-access.php';

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
function platformPeriodGuard(): void {
    if (!platformPeriodExpired()) return;
    http_response_code(403);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode(['ok' => false, 'code' => 'platform_period_expired', 'error' => 'Tu plazo ha terminado. Introduce la clave para renovar.']);
    exit;
}
