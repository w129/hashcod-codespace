<?php
declare(strict_types=1);

require_once __DIR__ . '/pqc-actions-lib.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate');
header('Pragma: no-cache');
header('X-Content-Type-Options: nosniff');

function pqaJson(int $status, array $payload): never {
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

if (!pqaSameOrigin()) {
    pqaJson(403, ['ok' => false, 'error' => 'origin_mismatch']);
}

$method = strtoupper((string)($_SERVER['REQUEST_METHOD'] ?? 'GET'));
if ($method === 'GET') {
    $session = pqaCurrentSession(true);
    if (!is_array($session)) pqaJson(503, ['ok' => false, 'error' => 'session_unavailable']);
    $state = pqaReadState($session);
    $action = strtolower(trim((string)($_GET['action'] ?? 'bootstrap')));
    $status = pqaPublicKeyStatus();

    if ($action === 'public-key') {
        pqaJson(200, [
            'ok' => true,
            'algorithm' => PQA_ALGORITHM,
            'standard' => 'NIST FIPS 204',
            'active' => !empty($status['active']),
            'public_key_b64' => pqaPublicKeyB64(),
            'key_fingerprint' => (string)($status['key_fingerprint'] ?? ''),
        ]);
    }

    pqaJson(200, [
        'ok' => true,
        'protocol' => 'HASHCOD-PQC-ACTION-V1',
        'algorithm' => PQA_ALGORITHM,
        'standard' => 'NIST FIPS 204',
        'pqc_active' => !empty($status['active']),
        'key_fingerprint' => (string)($status['key_fingerprint'] ?? ''),
        'session' => [
            'expires_at' => (int)($session['exp'] ?? 0),
            'next_seq' => (int)($state['last_seq'] ?? 0) + 1,
            'chain_head' => (string)($state['chain_head'] ?? ''),
        ],
        'enforcement' => pqaEnforcementEnabled(),
        'permit_ttl_seconds' => PQA_PERMIT_TTL,
    ]);
}

if ($method !== 'POST') {
    header('Allow: GET, POST');
    pqaJson(405, ['ok' => false, 'error' => 'method_not_allowed']);
}
if (strcasecmp((string)($_SERVER['HTTP_X_REQUESTED_WITH'] ?? ''), 'XMLHttpRequest') !== 0) {
    pqaJson(403, ['ok' => false, 'error' => 'xhr_required']);
}
$contentType = strtolower((string)($_SERVER['CONTENT_TYPE'] ?? ''));
if ($contentType !== '' && strpos($contentType, 'application/json') === false) {
    pqaJson(415, ['ok' => false, 'error' => 'json_required']);
}

$raw = file_get_contents('php://input');
if (!is_string($raw) || strlen($raw) > 16384) {
    pqaJson(413, ['ok' => false, 'error' => 'payload_too_large']);
}
$body = json_decode($raw, true);
if (!is_array($body)) pqaJson(400, ['ok' => false, 'error' => 'invalid_json']);

$session = pqaCurrentSession(true);
if (!is_array($session)) pqaJson(503, ['ok' => false, 'error' => 'session_unavailable']);

try {
    $result = pqaProcessAction($session, $body);
    if (empty($result['ok'])) {
        $status = ($result['error'] ?? '') === 'sequence_conflict' ? 409 : 400;
        pqaJson($status, $result);
    }
    pqaJson(200, $result);
} catch (InvalidArgumentException $e) {
    pqaJson(400, ['ok' => false, 'error' => $e->getMessage()]);
} catch (RuntimeException $e) {
    $code = $e->getMessage();
    $status = $code === 'pqc_action_rate_limited' ? 429 : 503;
    pqaJson($status, ['ok' => false, 'error' => $code]);
} catch (Throwable $e) {
    pqaJson(500, ['ok' => false, 'error' => 'pqc_action_internal_error']);
}
