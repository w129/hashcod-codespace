<?php
declare(strict_types=1);
define('HCS_LIBRARY_ONLY', true);
require_once __DIR__ . '/hashcod-shared-cloud.php';
require_once __DIR__ . '/platform-period-lib.php';

// Read-only view of the visitor's own tokenization requests (status flow). Identity comes only from the
// signed period cookie; nothing in the query string or body is forwarded.
if (strtoupper((string)($_SERVER['REQUEST_METHOD'] ?? 'GET')) !== 'GET') hcsJson(['ok' => false, 'error' => 'Method not allowed.'], 405);
if (isset($_SERVER['HTTP_ORIGIN']) && !mldsaOriginAllowed()) hcsJson(['ok' => false, 'error' => 'Same-origin request required.'], 403);
if (($_SERVER['HTTP_SEC_FETCH_SITE'] ?? '') === 'cross-site') hcsJson(['ok' => false, 'error' => 'Same-origin request required.'], 403);
securityBootstrap('api');
platformPeriodGuard();
$response = hcsCall('tokenization.mine', ['token' => (string)(platformPeriodData()['token'] ?? '')]);
$data = json_decode($response['raw'], true);
if (!is_array($data) || !is_bool($data['ok'] ?? null)) hcsJson(['ok' => false, 'error' => 'No se pudo consultar tus solicitudes.'], 503);
if (!$data['ok']) hcsJson(['ok' => false, 'error' => 'No se pudo consultar tus solicitudes.'], in_array($response['status'], [403, 429], true) ? $response['status'] : 503);
$states = ['pending', 'in_progress', 'delayed', 'awaiting_payment', 'completed'];
$requests = [];
foreach (is_array($data['requests'] ?? null) ? array_slice($data['requests'], 0, 25) : [] as $row) {
    if (!is_array($row) || !is_string($row['id'] ?? null) || !preg_match('/^[a-f0-9-]{36}$/D', $row['id'])) continue;
    $requests[] = [
        'id' => $row['id'],
        'name' => mb_substr((string)($row['name'] ?? ''), 0, 255),
        'status' => in_array($row['status'] ?? '', $states, true) ? $row['status'] : 'pending',
        'createdAt' => is_string($row['createdAt'] ?? null) ? $row['createdAt'] : null,
        'updatedAt' => is_string($row['updatedAt'] ?? null) ? $row['updatedAt'] : null,
        'certificateId' => is_string($row['certificateId'] ?? null) && preg_match('/^[a-f0-9-]{36}$/D', $row['certificateId']) ? $row['certificateId'] : null,
    ];
}
$quota = is_array($data['quota'] ?? null) ? $data['quota'] : [];
hcsJson(['ok' => true, 'quota' => ['used' => max(0, (int)($quota['used'] ?? 0)), 'limit' => 25], 'requests' => $requests]);
