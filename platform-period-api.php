<?php
declare(strict_types=1);
define('HCS_LIBRARY_ONLY', true);
require_once __DIR__ . '/hashcod-shared-cloud.php';
require_once __DIR__ . '/platform-period-lib.php';

$method = strtoupper((string)($_SERVER['REQUEST_METHOD'] ?? 'GET'));
if (!in_array($method, ['GET', 'POST'], true)) hcsJson(['ok' => false, 'error' => 'Method not allowed.'], 405);
if (($method === 'POST' || isset($_SERVER['HTTP_ORIGIN'])) && !mldsaOriginAllowed()) hcsJson(['ok' => false, 'error' => 'Same-origin request required.'], 403);
if (isset($_SERVER['HTTP_SEC_FETCH_SITE']) && $_SERVER['HTTP_SEC_FETCH_SITE'] === 'cross-site') hcsJson(['ok' => false, 'error' => 'Same-origin request required.'], 403);
if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0) > 2048) hcsJson(['ok' => false, 'error' => 'Request too large.'], 413);
securityBootstrap('api');
if ($method === 'POST') policyConsentGuard();
$stored = platformPeriodData();
$body = $method === 'POST' ? hcsBody() : [];
$freeEntry = $method === 'POST' && ($body['entry'] ?? null) === 'free';
$redeem = $method === 'POST' && ($body['entry'] ?? null) === 'pro';
// Identity is always taken from the signed HttpOnly cookie, never the body.
$forward = ['token' => is_array($stored) ? (string)($stored['token'] ?? '') : ''];
if ($redeem) {
    if (!$forward['token']) hcsJson(['ok' => false, 'error' => 'Espera a que se cargue tu referencia de pago.'], 409);
    if (!is_string($body['code'] ?? null) || !preg_match('/^[0-9]{6}$/D', $body['code'])) hcsJson(['ok' => false, 'error' => 'Introduce el código de 6 dígitos.'], 400);
    $redemption = hcsCall('subscription.redeem', ['token' => $forward['token'], 'code' => $body['code']]);
    $result = json_decode($redemption['raw'], true);
    if (!is_array($result) || empty($result['ok'])) hcsJson(['ok' => false, 'error' => $result['error'] ?? 'No se pudo validar el código.'], $redemption['status']);
}
if ($method === 'POST' && !$freeEntry && !$redeem) {
    if (!isset($body['days']) || !is_int($body['days']) || !in_array($body['days'], [10, 20, 30, 60], true)) hcsJson(['ok' => false, 'error' => 'Selecciona 10, 20, 30 o 60 días.'], 400);
    $forward['days'] = $body['days'];
    $forward['code'] = is_string($body['code'] ?? null) ? $body['code'] : '';
    if (strlen($forward['code']) > 256) hcsJson(['ok' => false, 'error' => 'Clave de renovación incorrecta.'], 400);
    if (!$forward['token']) hcsJson(['ok' => false, 'error' => 'Recarga la ventana antes de seleccionar el plazo.'], 409);
}
$response = hcsCall($method === 'GET' || $redeem ? 'period.status' : ($freeEntry ? 'period.free' : 'period.accept'), $forward);
$data = json_decode($response['raw'], true);
if (!is_array($data)) hcsJson(['ok' => false, 'error' => 'No se pudo verificar el plazo.'], 503);
if (empty($data['ok'])) hcsJson(['ok' => false, 'error' => $data['error'] ?? 'No se pudo verificar el plazo.'], $response['status']);
if (!in_array($data['state'] ?? '', ['choose', 'active', 'expired'], true) || !is_string($data['token'] ?? null) || !preg_match('/^[a-f0-9-]{36}\.[a-f0-9]{64}$/D', $data['token'])
    || !is_int($data['serverNow'] ?? null) || ($data['state'] !== 'choose' && (!in_array($data['days'] ?? null, [10, 20, 30, 60], true) || !is_int($data['expiresAt'] ?? null)))) hcsJson(['ok' => false, 'error' => 'No se pudo verificar el plazo.'], 503);
// A delayed 'choose' status must not overwrite an accepted cookie in another tab.
if ($method === 'POST' || !$forward['token'] || $data['state'] !== 'choose') mldsaCookie('hashcod_platform_period_v1', mldsaSeal([
    'kind' => 'platform-period-v1', 'host' => mldsaHost(), 'token' => $data['token'],
    'state' => $data['state'], 'days' => $data['days'], 'expiresAt' => $data['expiresAt'],
    'proExpiresAt' => ($data['subscription']['tier'] ?? '') === 'pro' && is_int($data['subscription']['expiresAt'] ?? null) ? $data['subscription']['expiresAt'] : 0
]), time() + 5 * 365 * 86400);
unset($data['token']);
hcsJson($data);
