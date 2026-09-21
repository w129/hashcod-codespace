<?php
require_once __DIR__ . '/supabase.php';

const HASHCOD_PUBLIC_CHAT_TABLE = 'l8_activity_log';
const HASHCOD_PUBLIC_CHAT_ACTION = 'PUBLIC_CHAT_MESSAGE';
const HASHCOD_PUBLIC_CHAT_TARGET = 'global';

function hashcodPublicChatJson(array $payload, int $status = 200): void {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store, max-age=0, must-revalidate');
    header('Pragma: no-cache');
    header('X-Content-Type-Options: nosniff');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function hashcodPublicChatNow(): string {
    $now = new DateTimeImmutable('now', new DateTimeZone('UTC'));
    return $now->format('Y-m-d\TH:i:s.u\Z');
}

function hashcodPublicChatClean(string $value, int $max): string {
    $value = str_replace(["\0", "\r"], ['', ''], trim($value));
    $value = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $value) ?? '';
    if (function_exists('mb_substr')) return mb_substr($value, 0, $max, 'UTF-8');
    return substr($value, 0, $max);
}

function hashcodPublicChatValidIso(string $value): bool {
    if ($value === '' || strlen($value) > 40) return false;
    return (bool)preg_match('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?Z$/', $value);
}

function hashcodPublicChatPayload($raw): array {
    if (is_array($raw)) return $raw;
    if (is_string($raw) && $raw !== '') {
        $decoded = json_decode($raw, true);
        return is_array($decoded) ? $decoded : [];
    }
    return [];
}

function hashcodPublicChatNormalizeRows($body, bool $reverse = false): array {
    $rows = is_array($body) ? $body : [];
    $messages = [];
    foreach ($rows as $row) {
        if (!is_array($row)) continue;
        $payload = hashcodPublicChatPayload($row['payload'] ?? []);
        $text = hashcodPublicChatClean((string)($payload['text'] ?? ''), 2000);
        if ($text === '') continue;
        $messages[] = [
            'id' => (string)($row['id'] ?? ''),
            'name' => hashcodPublicChatClean((string)($payload['name'] ?? 'Invitado'), 40),
            'text' => $text,
            'visitor_id' => preg_replace('/[^a-zA-Z0-9_-]/', '', (string)($payload['visitor_id'] ?? '')) ?: '',
            'created_at' => (string)($row['created_at'] ?? ($payload['created_at'] ?? '')),
        ];
    }
    if ($reverse) $messages = array_reverse($messages);
    return $messages;
}

$method = strtoupper((string)($_SERVER['REQUEST_METHOD'] ?? 'GET'));
$clientIp = function_exists('securityClientIp') ? securityClientIp() : (string)($_SERVER['REMOTE_ADDR'] ?? '127.0.0.1');

if ($method === 'GET') {
    if (function_exists('securityRateAllowSliding')) {
        $rate = securityRateAllowSliding('public_chat_read', 180, 60, $clientIp);
        if (empty($rate['allowed'])) {
            header('Retry-After: ' . max(1, (int)($rate['retry_after'] ?? 10)));
            hashcodPublicChatJson(['ok' => false, 'error' => 'Demasiadas actualizaciones.'], 429);
        }
    }

    $limit = max(1, min(100, (int)($_GET['limit'] ?? 80)));
    $before = trim((string)($_GET['before'] ?? ''));
    $after = trim((string)($_GET['after'] ?? ''));

    $query = 'select=id,payload,created_at'
        . '&action=eq.' . rawurlencode(HASHCOD_PUBLIC_CHAT_ACTION)
        . '&target=eq.' . rawurlencode(HASHCOD_PUBLIC_CHAT_TARGET)
        . '&status=eq.published';

    $reverse = false;
    if ($before !== '' && hashcodPublicChatValidIso($before)) {
        $query .= '&created_at=lt.' . rawurlencode($before) . '&order=created_at.desc,id.desc';
        $reverse = true;
    } elseif ($after !== '' && hashcodPublicChatValidIso($after)) {
        $query .= '&created_at=gt.' . rawurlencode($after) . '&order=created_at.asc,id.asc';
    } else {
        $query .= '&order=created_at.desc,id.desc';
        $reverse = true;
    }
    $query .= '&limit=' . $limit;

    $res = supabaseDbSelect(HASHCOD_PUBLIC_CHAT_TABLE, $query);
    if (empty($res['ok'])) {
        hashcodPublicChatJson(['ok' => false, 'error' => 'El historial público no está disponible en este momento.'], 503);
    }

    $messages = hashcodPublicChatNormalizeRows($res['body'] ?? [], $reverse);
    hashcodPublicChatJson([
        'ok' => true,
        'messages' => $messages,
        'count' => count($messages),
        'has_more' => count($messages) >= $limit,
        'retention' => 'append_only'
    ]);
}

if ($method === 'POST') {
    if (function_exists('securityRateAllowSliding')) {
        $rate = securityRateAllowSliding('public_chat_write', 8, 60, $clientIp);
        if (empty($rate['allowed'])) {
            header('Retry-After: ' . max(1, (int)($rate['retry_after'] ?? 30)));
            hashcodPublicChatJson(['ok' => false, 'error' => 'Has enviado demasiados mensajes. Intenta de nuevo en un momento.'], 429);
        }
    }

    $raw = (string)file_get_contents('php://input');
    if (strlen($raw) > 16384) hashcodPublicChatJson(['ok' => false, 'error' => 'Solicitud demasiado grande.'], 413);

    $input = json_decode($raw, true);
    if (!is_array($input)) hashcodPublicChatJson(['ok' => false, 'error' => 'JSON inválido.'], 400);

    $name = hashcodPublicChatClean((string)($input['name'] ?? ''), 40);
    $text = hashcodPublicChatClean((string)($input['text'] ?? ''), 2000);
    $visitorId = preg_replace('/[^a-zA-Z0-9_-]/', '', (string)($input['visitor_id'] ?? ''));
    $visitorId = substr($visitorId ?: ('guest_' . substr(hash('sha256', $clientIp), 0, 12)), 0, 64);

    if ($name === '') $name = 'Invitado-' . strtoupper(substr(hash('sha256', $visitorId), 0, 4));
    if ($text === '') hashcodPublicChatJson(['ok' => false, 'error' => 'Escribe un mensaje antes de publicar.'], 422);

    $createdAt = hashcodPublicChatNow();
    $id = 'chat_' . str_replace(['-', ':', '.', 'T', 'Z'], '', $createdAt) . '_' . bin2hex(random_bytes(8));
    $payload = [
        'name' => $name,
        'text' => $text,
        'visitor_id' => $visitorId,
        'created_at' => $createdAt,
        'format' => 'plain_text_v1'
    ];
    $row = [
        'id' => $id,
        'account_key' => 'public_chat',
        'action' => HASHCOD_PUBLIC_CHAT_ACTION,
        'target' => HASHCOD_PUBLIC_CHAT_TARGET,
        'payload' => $payload,
        'ip_hash' => hash('sha256', $clientIp . (function_exists('authPepper') ? authPepper() : '')),
        'user_agent' => substr((string)($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 200),
        'status' => 'published',
        'created_at' => $createdAt
    ];

    $res = supabaseDbUpsert(HASHCOD_PUBLIC_CHAT_TABLE, [$row], 'id');
    if (empty($res['ok'])) {
        if (function_exists('supabaseQueueSyncMutation')) @supabaseQueueSyncMutation(HASHCOD_PUBLIC_CHAT_TABLE, 'upsert', $row);
        hashcodPublicChatJson(['ok' => false, 'error' => 'No se pudo confirmar el guardado permanente. El mensaje no se publicó.'], 503);
    }

    if (function_exists('supabaseStorageUploadJson')) {
        $month = substr($createdAt, 0, 7);
        @supabaseStorageUploadJson('public_chat/messages/' . $month . '/' . $id . '.json', $row);
    }

    hashcodPublicChatJson([
        'ok' => true,
        'message' => [
            'id' => $id,
            'name' => $name,
            'text' => $text,
            'visitor_id' => $visitorId,
            'created_at' => $createdAt
        ],
        'retention' => 'append_only'
    ], 201);
}

header('Allow: GET, POST');
hashcodPublicChatJson(['ok' => false, 'error' => 'Método no permitido.'], 405);
