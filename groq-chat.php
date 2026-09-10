<?php
declare(strict_types=1);

/**
 * Hashcod Codespace · Groq chat endpoint.
 *
 * The Groq API key is read only from the server environment / secret store.
 * Never expose provider credentials to the browser.
 */

if (!function_exists('securityRateAllowSliding')) {
    require_once __DIR__ . '/security.php';
}
if (!function_exists('secretGet')) {
    @require_once __DIR__ . '/secrets.php';
}

function groqChatJson(int $status, array $payload): never {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store, private');
    header('Pragma: no-cache');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function groqChatSecret(string $name, string $default = ''): string {
    $value = '';
    if (function_exists('secretGet')) {
        $value = trim((string)secretGet($name, ''));
    }
    if ($value === '') {
        $env = getenv($name);
        if ($env !== false) $value = trim((string)$env);
    }
    return $value !== '' ? $value : $default;
}

function groqChatClip(string $value, int $limit): string {
    $value = trim($value);
    if (function_exists('mb_substr')) return mb_substr($value, 0, $limit, 'UTF-8');
    return substr($value, 0, $limit);
}

/**
 * Same-origin validation that survives Render/Cloudflare reverse proxies.
 * Sec-Fetch-Site is a browser-controlled forbidden header, so an explicit
 * same-origin value is authoritative for our browser fetch. When unavailable,
 * validate Origin against the public forwarded host / request host.
 */
function groqChatSameOrigin(): bool {
    $site = strtolower(trim((string)($_SERVER['HTTP_SEC_FETCH_SITE'] ?? '')));
    if ($site === 'cross-site' || $site === 'same-site') {
        return false;
    }
    if ($site === 'same-origin' || $site === 'none') {
        return true;
    }

    $origin = rtrim(trim((string)($_SERVER['HTTP_ORIGIN'] ?? '')), '/');
    if ($origin === '') {
        // Non-browser clients do not get a free pass: require an XHR marker.
        return strcasecmp(trim((string)($_SERVER['HTTP_X_REQUESTED_WITH'] ?? '')), 'XMLHttpRequest') === 0;
    }

    $originParts = parse_url($origin);
    if (!is_array($originParts) || empty($originParts['host'])) return false;
    $originScheme = strtolower((string)($originParts['scheme'] ?? ''));
    $originHost = strtolower((string)$originParts['host']);
    $originPort = isset($originParts['port']) ? (int)$originParts['port'] : null;

    $forwardedProto = trim((string)($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? ''));
    if (strpos($forwardedProto, ',') !== false) {
        $forwardedProto = trim(explode(',', $forwardedProto, 2)[0]);
    }
    $scheme = strtolower($forwardedProto);
    if ($scheme !== 'http' && $scheme !== 'https') {
        $scheme = function_exists('securityIsHttps') && securityIsHttps() ? 'https' : 'http';
    }

    $hostCandidates = [];
    foreach ([
        $_SERVER['HTTP_X_FORWARDED_HOST'] ?? '',
        $_SERVER['HTTP_HOST'] ?? '',
        $_SERVER['SERVER_NAME'] ?? ''
    ] as $rawHost) {
        $rawHost = trim((string)$rawHost);
        if ($rawHost === '') continue;
        if (strpos($rawHost, ',') !== false) {
            $rawHost = trim(explode(',', $rawHost, 2)[0]);
        }
        $parts = parse_url('//' . $rawHost);
        if (!is_array($parts) || empty($parts['host'])) continue;
        $hostCandidates[] = [
            'host' => strtolower((string)$parts['host']),
            'port' => isset($parts['port']) ? (int)$parts['port'] : null
        ];
    }

    foreach ($hostCandidates as $candidate) {
        if (!hash_equals($candidate['host'], $originHost)) continue;
        $candidatePort = $candidate['port'];
        $normalizedOriginPort = $originPort ?? ($originScheme === 'https' ? 443 : ($originScheme === 'http' ? 80 : null));
        $normalizedCandidatePort = $candidatePort ?? ($scheme === 'https' ? 443 : 80);
        if ($normalizedOriginPort !== $normalizedCandidatePort) continue;
        if ($originScheme !== '' && $originScheme !== $scheme) continue;
        return true;
    }

    return false;
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    header('Allow: POST');
    groqChatJson(405, ['ok' => false, 'error' => 'Método no permitido']);
}

if (!groqChatSameOrigin()) {
    groqChatJson(403, ['ok' => false, 'error' => 'Origen no autorizado']);
}

$clientIp = function_exists('securityClientIp') ? securityClientIp() : '127.0.0.1';
if (function_exists('securityRateAllowSliding')) {
    $rate = securityRateAllowSliding('groq_auth_chat', 20, 60, $clientIp);
    if (empty($rate['allowed'])) {
        $retry = max(1, (int)($rate['retry_after'] ?? 30));
        header('Retry-After: ' . $retry);
        groqChatJson(429, [
            'ok' => false,
            'error' => 'Demasiados mensajes. Espera unos segundos antes de continuar.',
            'retry_after' => $retry
        ]);
    }
}

if (function_exists('securityReadJsonBody')) {
    $read = securityReadJsonBody(32768);
    if (empty($read['ok'])) {
        groqChatJson(400, ['ok' => false, 'error' => $read['error'] ?? 'Solicitud inválida']);
    }
    $input = is_array($read['data'] ?? null) ? $read['data'] : [];
} else {
    $raw = file_get_contents('php://input', false, null, 0, 32769);
    if ($raw === false || strlen($raw) > 32768) {
        groqChatJson(400, ['ok' => false, 'error' => 'Solicitud demasiado grande']);
    }
    $input = json_decode($raw, true);
    if (!is_array($input)) groqChatJson(400, ['ok' => false, 'error' => 'JSON inválido']);
}

$key = groqChatSecret('GROQ_API_KEY');
if ($key === '') {
    groqChatJson(503, [
        'ok' => false,
        'error' => 'El chat de Groq todavía no está configurado en el servidor.'
    ]);
}

$model = groqChatSecret('GROQ_CHAT_MODEL', 'llama-3.3-70b-versatile');
$incoming = $input['messages'] ?? [];
if (!is_array($incoming)) $incoming = [];

$messages = [[
    'role' => 'system',
    'content' => 'You are Hashcod AI, the concise assistant integrated into Hashcod Codespace. Answer in the same language as the user. Help with programming, software engineering, technical concepts, and platform questions. Be clear and practical. Never claim to have executed an action unless the conversation explicitly confirms it.'
]];

$totalChars = 0;
$hasUser = false;
foreach (array_slice($incoming, -14) as $row) {
    if (!is_array($row)) continue;
    $role = strtolower(trim((string)($row['role'] ?? '')));
    if ($role !== 'user' && $role !== 'assistant') continue;
    $content = groqChatClip((string)($row['content'] ?? ''), 6000);
    if ($content === '') continue;

    $remaining = 18000 - $totalChars;
    if ($remaining <= 0) break;
    $content = groqChatClip($content, $remaining);
    $totalChars += function_exists('mb_strlen') ? mb_strlen($content, 'UTF-8') : strlen($content);
    $messages[] = ['role' => $role, 'content' => $content];
    if ($role === 'user') $hasUser = true;
}

if (!$hasUser) {
    $single = groqChatClip((string)($input['message'] ?? $input['prompt'] ?? ''), 6000);
    if ($single !== '') {
        $messages[] = ['role' => 'user', 'content' => $single];
        $hasUser = true;
    }
}

if (!$hasUser) {
    groqChatJson(400, ['ok' => false, 'error' => 'Escribe un mensaje para la IA.']);
}

$payload = json_encode([
    'model' => $model,
    'messages' => $messages,
    'temperature' => 0.35,
    'max_completion_tokens' => 1200,
    'stream' => false
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

if ($payload === false) {
    groqChatJson(400, ['ok' => false, 'error' => 'No se pudo preparar el mensaje.']);
}

$ch = curl_init('https://api.groq.com/openai/v1/chat/completions');
if ($ch === false) {
    groqChatJson(503, ['ok' => false, 'error' => 'El servicio de IA no está disponible en este momento.']);
}

curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CONNECTTIMEOUT => 10,
    CURLOPT_TIMEOUT => 45,
    CURLOPT_HTTPHEADER => [
        'Accept: application/json',
        'Content-Type: application/json',
        'Authorization: Bearer ' . $key,
        'User-Agent: Hashcod-Codespace/1.0'
    ],
    CURLOPT_POSTFIELDS => $payload,
    CURLOPT_SSL_VERIFYPEER => true,
    CURLOPT_SSL_VERIFYHOST => 2
]);

$rawResponse = curl_exec($ch);
$status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($rawResponse === false) {
    groqChatJson(502, [
        'ok' => false,
        'error' => 'No se pudo conectar con Groq. Inténtalo de nuevo.'
    ]);
}

$data = json_decode((string)$rawResponse, true);
if ($status < 200 || $status >= 300 || !is_array($data)) {
    $message = 'Groq no pudo responder en este momento.';
    if ($status === 429) $message = 'Groq alcanzó temporalmente su límite de solicitudes. Inténtalo en unos segundos.';
    if ($status === 401 || $status === 403) $message = 'La credencial de Groq configurada en el servidor no es válida.';
    groqChatJson($status === 429 ? 429 : 502, [
        'ok' => false,
        'error' => $message,
        'provider_status' => $status
    ]);
}

$content = trim((string)($data['choices'][0]['message']['content'] ?? ''));
if ($content === '') {
    groqChatJson(502, ['ok' => false, 'error' => 'Groq devolvió una respuesta vacía.']);
}

groqChatJson(200, [
    'ok' => true,
    'content' => $content,
    'model' => (string)($data['model'] ?? $model)
]);
