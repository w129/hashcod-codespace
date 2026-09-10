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

const HASHCOD_GROQ_DEFAULT_MODEL = 'openai/gpt-oss-120b';

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
 * Groq retired llama-3.3-70b-versatile for Free/Developer usage on 2026-08-16.
 * Keep old Render configurations working by transparently migrating known
 * retired model IDs to their Groq-recommended replacements.
 */
function groqChatResolveModel(string $configured): array {
    $configured = trim($configured);
    if ($configured === '') $configured = HASHCOD_GROQ_DEFAULT_MODEL;

    $migrations = [
        'llama-3.3-70b-versatile' => 'openai/gpt-oss-120b',
        'llama-3.1-8b-instant' => 'openai/gpt-oss-20b',
    ];

    if (isset($migrations[$configured])) {
        return [
            'model' => $migrations[$configured],
            'configured_model' => $configured,
            'migrated' => true,
        ];
    }

    return [
        'model' => $configured,
        'configured_model' => $configured,
        'migrated' => false,
    ];
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

function groqChatRequest(string $key, string $model, array $messages): array {
    $payload = json_encode([
        'model' => $model,
        'messages' => $messages,
        'temperature' => 0.35,
        'max_completion_tokens' => 1200,
        'stream' => false
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

    if ($payload === false) {
        return ['ok' => false, 'status' => 0, 'error' => 'payload_encode_failed', 'data' => null];
    }

    $ch = curl_init('https://api.groq.com/openai/v1/chat/completions');
    if ($ch === false) {
        return ['ok' => false, 'status' => 0, 'error' => 'curl_init_failed', 'data' => null];
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
    $curlError = curl_error($ch);
    $status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($rawResponse === false) {
        return [
            'ok' => false,
            'status' => 0,
            'error' => $curlError !== '' ? $curlError : 'transport_error',
            'data' => null
        ];
    }

    $data = json_decode((string)$rawResponse, true);
    return [
        'ok' => $status >= 200 && $status < 300 && is_array($data),
        'status' => $status,
        'error' => null,
        'data' => is_array($data) ? $data : null
    ];
}

function groqChatLooksLikeModelError(array $result): bool {
    $status = (int)($result['status'] ?? 0);
    if ($status !== 400 && $status !== 404) return false;
    $data = is_array($result['data'] ?? null) ? $result['data'] : [];
    $error = is_array($data['error'] ?? null) ? $data['error'] : [];
    $code = strtolower((string)($error['code'] ?? ''));
    $message = strtolower((string)($error['message'] ?? ''));
    return strpos($code, 'model') !== false
        || strpos($message, 'model') !== false
        || strpos($message, 'decommission') !== false
        || strpos($message, 'deprecated') !== false;
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

$modelInfo = groqChatResolveModel(groqChatSecret('GROQ_CHAT_MODEL', HASHCOD_GROQ_DEFAULT_MODEL));
$model = (string)$modelInfo['model'];
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

$result = groqChatRequest($key, $model, $messages);

// If Render contains another retired/removed model, recover once using the
// current Groq production default instead of leaving the chat broken.
if (empty($result['ok']) && $model !== HASHCOD_GROQ_DEFAULT_MODEL && groqChatLooksLikeModelError($result)) {
    $model = HASHCOD_GROQ_DEFAULT_MODEL;
    $modelInfo['migrated'] = true;
    $result = groqChatRequest($key, $model, $messages);
}

if (empty($result['ok'])) {
    $status = (int)($result['status'] ?? 0);
    $data = is_array($result['data'] ?? null) ? $result['data'] : [];
    $providerError = is_array($data['error'] ?? null) ? $data['error'] : [];
    $providerCode = (string)($providerError['code'] ?? '');
    $providerMessage = trim((string)($providerError['message'] ?? ''));

    $message = 'Groq no pudo responder en este momento.';
    $httpStatus = 502;
    if ($status === 0) {
        $message = 'No se pudo conectar con Groq. Inténtalo de nuevo.';
    } elseif ($status === 429) {
        $message = 'Groq alcanzó temporalmente su límite de solicitudes. Inténtalo en unos segundos.';
        $httpStatus = 429;
    } elseif ($status === 401) {
        $message = 'La API key de Groq configurada en Render no es válida o fue revocada.';
    } elseif ($status === 403) {
        $message = 'Groq rechazó el acceso al modelo para este proyecto. Revisa los permisos del modelo en Groq.';
    } elseif ($status === 400 || $status === 404) {
        $message = 'Groq rechazó la solicitud o el modelo configurado no está disponible.';
    }

    // Return only provider diagnostics that are safe for the UI; never return
    // request headers, API keys, stack traces or the raw upstream body.
    $response = [
        'ok' => false,
        'error' => $message,
        'provider_status' => $status,
        'model' => $model,
    ];
    if ($providerCode !== '') $response['provider_code'] = $providerCode;
    if ($providerMessage !== '') $response['provider_message'] = groqChatClip($providerMessage, 280);
    groqChatJson($httpStatus, $response);
}

$data = is_array($result['data'] ?? null) ? $result['data'] : [];
$content = trim((string)($data['choices'][0]['message']['content'] ?? ''));
if ($content === '') {
    groqChatJson(502, ['ok' => false, 'error' => 'Groq devolvió una respuesta vacía.']);
}

groqChatJson(200, [
    'ok' => true,
    'content' => $content,
    'model' => (string)($data['model'] ?? $model),
    'model_migrated' => !empty($modelInfo['migrated'])
]);
