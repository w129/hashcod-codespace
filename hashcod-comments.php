<?php
/**
 * Hashcod saved comments backend.
 * Data model adapts the room/message pattern from aws-samples/appsync-chat-app-cdk
 * to Hashcod's existing PHP + Supabase/Postgres infrastructure.
 */
require_once __DIR__ . '/security.php';
require_once __DIR__ . '/supabase.php';

const HCC_TABLE = 'l8_chat_messages';
const HCC_ROOM = 'hashcod-gate-comments';
const HCC_LIMIT_MAX = 120;

function hccJson(array $payload, int $status = 200): void {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function hccRows($body): array {
    if (!is_array($body) || $body === []) return [];
    if (array_keys($body) === range(0, count($body) - 1)) return $body;
    return isset($body['id']) ? [$body] : [];
}

function hccReadJson(): array {
    $raw = file_get_contents('php://input', false, null, 0, 65537);
    if (!is_string($raw) || trim($raw) === '') return [];
    if (strlen($raw) > 65536) hccJson(['ok' => false, 'error' => 'Payload demasiado grande'], 413);
    $data = json_decode($raw, true);
    if (!is_array($data)) hccJson(['ok' => false, 'error' => 'JSON inválido'], 400);
    return $data;
}

function hccCleanClientId(string $clientId): string {
    $clientId = trim($clientId);
    if (!preg_match('/^[a-zA-Z0-9_-]{8,96}$/', $clientId)) return '';
    return $clientId;
}

function hccAuthenticatedAccount(): string {
    if (!function_exists('authSessionTokenFromRequest') || !function_exists('authValidateSession')) {
        @require_once __DIR__ . '/auth.php';
    }
    if (!function_exists('authSessionTokenFromRequest') || !function_exists('authValidateSession')) return '';
    $token = (string) authSessionTokenFromRequest();
    if ($token === '') return '';
    $session = authValidateSession($token);
    if (empty($session['ok']) || empty($session['authenticated'])) return '';
    $account = (string)($session['account_id'] ?? $session['user_id'] ?? '');
    return preg_replace('/[^a-zA-Z0-9_-]/', '', $account) ?: '';
}

function hccOwnerKey(string $clientId): string {
    $account = hccAuthenticatedAccount();
    if ($account !== '') return 'acct_' . substr($account, 0, 150);
    $pepper = function_exists('authPepper') ? (string)authPepper() : (string)envValue('L8_AUTH_PEPPER', 'hashcod-chat-owner');
    return 'visitor_' . substr(hash_hmac('sha256', $clientId, $pepper), 0, 32);
}

function hccStateFallbackId(): string {
    return 'shared_hashcod_chat_' . HCC_ROOM;
}

function hccStateFallbackLoad(): array {
    $id = hccStateFallbackId();
    $query = 'select=state&id=eq.' . rawurlencode($id) . '&limit=1';
    $res = supabaseDbSelect('l8_app_states', $query);
    if (empty($res['ok'])) return ['ok' => false, 'messages' => []];
    $rows = hccRows($res['body'] ?? []);
    if (!$rows) return ['ok' => true, 'messages' => []];
    $state = $rows[0]['state'] ?? [];
    if (is_string($state)) $state = json_decode($state, true);
    $messages = is_array($state) && is_array($state['messages'] ?? null) ? $state['messages'] : [];
    return ['ok' => true, 'messages' => $messages];
}

function hccStateFallbackSave(array $message): bool {
    $loaded = hccStateFallbackLoad();
    $messages = !empty($loaded['ok']) ? ($loaded['messages'] ?? []) : [];
    $byId = [];
    foreach ($messages as $row) {
        if (!is_array($row) || empty($row['id'])) continue;
        $byId[(string)$row['id']] = $row;
    }
    $byId[(string)$message['id']] = $message;
    $messages = array_values($byId);
    usort($messages, static function($a, $b) {
        return strcmp((string)($a['created_at'] ?? ''), (string)($b['created_at'] ?? ''));
    });
    if (count($messages) > HCC_LIMIT_MAX) $messages = array_slice($messages, -HCC_LIMIT_MAX);

    $row = [[
        'id' => hccStateFallbackId(),
        'account_key' => 'shared_hashcod_chat',
        'app_id' => HCC_ROOM,
        'state' => [
            'room_id' => HCC_ROOM,
            'messages' => $messages,
            'updated_at' => gmdate('c'),
        ],
        'updated_at' => gmdate('c'),
    ]];
    $saved = supabaseDbUpsert('l8_app_states', $row, 'id');
    return !empty($saved['ok']);
}

function hccLocalPath(): string {
    $dir = __DIR__ . '/data_storage/chat_messages';
    if (!is_dir($dir)) @mkdir($dir, 0700, true);
    return $dir . '/' . HCC_ROOM . '.jsonl';
}

function hccLocalAppend(array $row): bool {
    $path = hccLocalPath();
    $line = json_encode($row, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . "\n";
    $fp = @fopen($path, 'ab');
    if (!$fp) return false;
    $ok = false;
    if (@flock($fp, LOCK_EX)) {
        $ok = @fwrite($fp, $line) !== false;
        @fflush($fp);
        @flock($fp, LOCK_UN);
    }
    @fclose($fp);
    return $ok;
}

function hccLocalRows(int $limit): array {
    $path = hccLocalPath();
    if (!is_file($path) || !is_readable($path)) return [];
    $lines = @file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    if (!is_array($lines)) return [];
    $rows = [];
    foreach (array_slice($lines, -max($limit * 2, 40)) as $line) {
        $row = json_decode($line, true);
        if (!is_array($row) || ($row['room_id'] ?? '') !== HCC_ROOM || empty($row['id'])) continue;
        $rows[] = $row;
    }
    return $rows;
}

function hccNormalizeForClient(array $row, string $owner): array {
    return [
        'id' => (string)($row['id'] ?? ''),
        'room_id' => HCC_ROOM,
        'content' => (string)($row['content'] ?? ''),
        'created_at' => (string)($row['created_at'] ?? ''),
        'updated_at' => (string)($row['updated_at'] ?? $row['created_at'] ?? ''),
        'mine' => hash_equals($owner, (string)($row['owner_key'] ?? '')),
        'pending' => !empty($row['_deferred']),
    ];
}

function hccListMessages(string $owner, int $limit): array {
    $limit = max(1, min(HCC_LIMIT_MAX, $limit));
    $query = 'select=id,room_id,owner_key,content,created_at,updated_at'
        . '&room_id=eq.' . rawurlencode(HCC_ROOM)
        . '&order=created_at.asc&limit=' . $limit;
    $remote = supabaseDbSelect(HCC_TABLE, $query);
    $rows = !empty($remote['ok']) ? hccRows($remote['body'] ?? []) : [];

    // Until/if the dedicated message table migration is unavailable, use the
    // existing durable l8_app_states table as a cloud-backed room snapshot.
    $stateFallback = hccStateFallbackLoad();
    if (!empty($stateFallback['ok'])) {
        foreach (($stateFallback['messages'] ?? []) as $stateRow) {
            if (is_array($stateRow)) $rows[] = $stateRow;
        }
    }

    // Merge best-effort local fallback rows so a temporary Supabase outage never
    // makes an accepted comment disappear from this runtime.
    foreach (hccLocalRows($limit) as $local) $rows[] = $local;

    $byId = [];
    foreach ($rows as $row) {
        $id = (string)($row['id'] ?? '');
        if ($id === '') continue;
        $byId[$id] = $row;
    }
    $rows = array_values($byId);
    usort($rows, static function($a, $b) {
        return strcmp((string)($a['created_at'] ?? ''), (string)($b['created_at'] ?? ''));
    });
    if (count($rows) > $limit) $rows = array_slice($rows, -$limit);

    return [
        'ok' => true,
        'room_id' => HCC_ROOM,
        'messages' => array_map(static fn($row) => hccNormalizeForClient($row, $owner), $rows),
        'degraded' => empty($remote['ok']),
        'remote_error' => empty($remote['ok']) ? 'remote_unavailable' : null,
    ];
}

function hccCreateMessage(array $body, string $owner): array {
    $content = trim((string)($body['content'] ?? ''));
    $content = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $content) ?? '';
    if ($content === '') return ['ok' => false, 'status' => 422, 'error' => 'Escribe un comentario'];
    if (mb_strlen($content, 'UTF-8') > 1200) return ['ok' => false, 'status' => 422, 'error' => 'El comentario supera 1200 caracteres'];

    $nonce = trim((string)($body['client_nonce'] ?? ''));
    if (!preg_match('/^[a-zA-Z0-9_-]{8,96}$/', $nonce)) {
        $nonce = bin2hex(random_bytes(16));
    }

    if (function_exists('securityRateAllowSliding')) {
        $rate = securityRateAllowSliding('hashcod_saved_comments', 24, 60);
        if (empty($rate['allowed'])) {
            return [
                'ok' => false,
                'status' => 429,
                'error' => 'Demasiados comentarios seguidos. Intenta de nuevo en unos segundos.',
                'retry_after' => (int)($rate['retry_after'] ?? 30),
            ];
        }
    }

    $now = gmdate('c');
    $id = 'msg_' . substr(hash('sha256', HCC_ROOM . '|' . $owner . '|' . $nonce), 0, 36);
    $row = [
        'id' => $id,
        'room_id' => HCC_ROOM,
        'owner_key' => $owner,
        'content' => $content,
        'client_nonce' => $nonce,
        'metadata' => ['source' => 'access-gate-saved-chat', 'version' => 1],
        'created_at' => $now,
        'updated_at' => $now,
    ];

    $remote = supabaseDbUpsert(HCC_TABLE, [$row], 'id');
    if (!empty($remote['ok'])) {
        // Keep the shared state snapshot warm as a secondary durable copy.
        @hccStateFallbackSave($row);
        return ['ok' => true, 'message' => hccNormalizeForClient($row, $owner), 'deferred' => false];
    }

    // Cloud fallback that works with the schema already deployed in Hashcod.
    if (hccStateFallbackSave($row)) {
        return ['ok' => true, 'message' => hccNormalizeForClient($row, $owner), 'deferred' => false, 'fallback_store' => 'l8_app_states'];
    }

    // Last-resort retry path already used elsewhere in Hashcod: retain locally
    // and enqueue the exact row for Supabase synchronization.
    $row['_deferred'] = true;
    $localSaved = hccLocalAppend($row);
    if (function_exists('supabaseQueueSyncMutation')) {
        @supabaseQueueSyncMutation(HCC_TABLE, 'upsert', $row);
    }
    if ($localSaved) {
        return ['ok' => true, 'message' => hccNormalizeForClient($row, $owner), 'deferred' => true];
    }
    return ['ok' => false, 'status' => 503, 'error' => 'No se pudo guardar el comentario'];
}

$method = strtoupper((string)($_SERVER['REQUEST_METHOD'] ?? 'GET'));
$clientId = hccCleanClientId((string)($_GET['client_id'] ?? $_SERVER['HTTP_X_HASHCOD_CHAT_CLIENT'] ?? ''));
if ($method === 'POST') {
    if (strcasecmp((string)($_SERVER['HTTP_X_REQUESTED_WITH'] ?? ''), 'XMLHttpRequest') !== 0) {
        hccJson(['ok' => false, 'error' => 'Solicitud no autorizada'], 403);
    }
    $body = hccReadJson();
    $clientId = hccCleanClientId((string)($body['client_id'] ?? $clientId));
}
if ($clientId === '') hccJson(['ok' => false, 'error' => 'Identificador de cliente inválido'], 400);
$owner = hccOwnerKey($clientId);

if ($method === 'GET') {
    $limit = (int)($_GET['limit'] ?? 80);
    hccJson(hccListMessages($owner, $limit));
}
if ($method === 'POST') {
    $result = hccCreateMessage($body ?? [], $owner);
    hccJson($result, !empty($result['ok']) ? 200 : (int)($result['status'] ?? 500));
}
hccJson(['ok' => false, 'error' => 'Método no permitido'], 405);
