<?php
declare(strict_types=1);
define('HCS_LIBRARY_ONLY', true);
require_once __DIR__ . '/hashcod-shared-cloud.php';
require_once __DIR__ . '/tokenization-lib.php';
platformPeriodGuard();
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') hcsJson(['ok' => false, 'error' => 'Method not allowed.'], 405);
if (!mldsaOriginAllowed() || ($_SERVER['HTTP_SEC_FETCH_SITE'] ?? '') === 'cross-site'
    || strcasecmp((string)($_SERVER['HTTP_X_REQUESTED_WITH'] ?? ''), 'XMLHttpRequest') !== 0) hcsJson(['ok' => false, 'error' => 'Same-origin request required.'], 403);
securityBootstrap('api');
if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0) > 16384) hcsJson(['ok' => false, 'error' => 'Request too large.'], 413);
$raw = file_get_contents('php://input', false, null, 0, 16385);
if (!is_string($raw) || strlen($raw) > 16384) hcsJson(['ok' => false, 'error' => 'Request too large.'], 413);
$body = json_decode($raw, true);
if (!is_array($body)) hcsJson(['ok' => false, 'error' => 'Invalid JSON.'], 400);
$action = $body['action'] ?? '';
if (!in_array($action, ['submit', 'auth', 'list', 'update', 'logout'], true)) hcsJson(['ok' => false, 'error' => 'Unsupported action.'], 400);
$rate = securityRateAllowSliding('tokenization_' . $action, $action === 'auth' ? 6 : 60, 60);
if (empty($rate['allowed'])) hcsJson(['ok' => false, 'error' => 'Demasiados intentos. Espera un minuto.'], 429);
if ($action === 'logout') {
    mldsaCookie('hashcod_tokenization_admin_v1', '', time() - 3600);
    hcsJson(['ok' => true]);
}
// Never accept platform identity or administrative tickets from browser JSON.
$forward = ['token' => (string)(platformPeriodData()['token'] ?? '')];
if ($action === 'submit') {
    platformPeriodGuard(true);
    foreach (['id', 'code', 'phone', 'email'] as $name) $forward[$name] = is_string($body[$name] ?? null) ? $body[$name] : '';
} elseif ($action === 'auth') {
    $forward['key'] = is_string($body['key'] ?? null) ? $body['key'] : '';
} else {
    $forward['adminTicket'] = tokenizationAdminTicket();
    if ($forward['adminTicket'] === '') hcsJson(['ok' => false, 'error' => 'Introduce la clave para ver las solicitudes.'], 403);
    if ($action === 'update') {
        foreach (['id', 'status', 'expectedStatus'] as $name) $forward[$name] = is_string($body[$name] ?? null) ? $body[$name] : '';
    } else {
        $forward['offset'] = is_int($body['offset'] ?? null) ? $body['offset'] : 0;
    }
}
$result = tokenizationWorker($action, $forward);
$data = $result['data'];
if ($action === 'auth' && !empty($data['ok'])) {
    if (!is_string($data['adminTicket'] ?? null) || strlen($data['adminTicket']) > 4096
        || !is_int($data['expiresAt'] ?? null) || $data['expiresAt'] <= time() || $data['expiresAt'] > time() + 1000) hcsJson(['ok' => false, 'error' => 'No se pudo verificar el acceso.'], 503);
    mldsaCookie('hashcod_tokenization_admin_v1', mldsaSeal(['kind' => 'tokenization-admin-v1', 'host' => mldsaHost(), 'ticket' => $data['adminTicket'], 'expiresAt' => $data['expiresAt']]), $data['expiresAt']);
}
unset($data['adminTicket']);
hcsJson($data, $result['status']);
