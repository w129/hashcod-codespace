<?php
/**
 * Chat IA del bloc de notas (en plataforma).
 *
 * Modelos (etiquetas originales):
 *  - GPT 5.6        → OpenAI
 *  - Gemini 3.6     → Google Gemini
 *  - Claude Fable 5 → Anthropic Claude
 *  - Manus          → Manus Open API
 *
 * Auth: OAuth2 (Authorization Code + state CSRF) con secretos solo en servidor.
 * Fallback seguro: pegar access token / API key vía POST (nunca se reexpone).
 * La respuesta se fuerza a contenido puro (sin saludo ni cortesía).
 */

require_once __DIR__ . '/supabase.php';
if (!function_exists('authValidateSession')) {
    @require_once __DIR__ . '/auth.php';
}

function aiChatSystemPrompt() {
    return 'You are a content transcription engine for a notepad. '
        . 'Output ONLY the requested content. '
        . 'No greetings, no courtesy, no preamble, no closing remarks, no apologies, no meta commentary. '
        . 'Do not say you are an AI. Do not wrap the whole answer in markdown fences unless the user explicitly asks for a code block. '
        . 'Write in the same language as the user request.';
}

function aiChatProviders() {
    return [
        'gpt-5.6' => [
            'id' => 'gpt-5.6',
            'label' => 'GPT 5.6',
            'vendor' => 'openai',
            'api_model' => envValue('OPENAI_CHAT_MODEL', 'gpt-4o'),
        ],
        'gemini-3.6' => [
            'id' => 'gemini-3.6',
            'label' => 'Gemini 3.6',
            'vendor' => 'google',
            'api_model' => envValue('GEMINI_CHAT_MODEL', 'gemini-2.0-flash'),
        ],
        'claude-fable-5' => [
            'id' => 'claude-fable-5',
            'label' => 'Claude Fable 5',
            'vendor' => 'anthropic',
            'api_model' => envValue('ANTHROPIC_CHAT_MODEL', 'claude-sonnet-4-20250514'),
        ],
        'manus' => [
            'id' => 'manus',
            'label' => 'Manus',
            'vendor' => 'manus',
            'api_model' => envValue('MANUS_AGENT_PROFILE', 'manus-1.6'),
        ],
    ];
}

function aiChatStorageDir() {
    $dir = __DIR__ . '/data_storage/ai_chat';
    if (!is_dir($dir)) @mkdir($dir, 0777, true);
    $sessions = $dir . '/sessions';
    if (!is_dir($sessions)) @mkdir($sessions, 0777, true);
    $oauth = $dir . '/oauth_state';
    if (!is_dir($oauth)) @mkdir($oauth, 0777, true);
    return $dir;
}

function aiChatAccountKey() {
    $token = '';
    if (function_exists('authBearerTokenFromRequest')) {
        $token = (string)authBearerTokenFromRequest();
    }
    if ($token === '' && !empty($_SERVER['HTTP_AUTHORIZATION']) && preg_match('/Bearer\s+(\S+)/i', $_SERVER['HTTP_AUTHORIZATION'], $m)) {
        $token = $m[1];
    }
    if ($token !== '' && function_exists('authValidateSession')) {
        $sess = authValidateSession($token);
        if (!empty($sess['ok']) && !empty($sess['account_id'])) {
            return 'acct_' . preg_replace('/[^a-zA-Z0-9_-]/', '', (string)$sess['account_id']);
        }
        if (!empty($sess['ok']) && !empty($sess['user_id'])) {
            return 'acct_' . preg_replace('/[^a-zA-Z0-9_-]/', '', (string)$sess['user_id']);
        }
    }
    $guest = '';
    if (!empty($_SERVER['HTTP_X_L8_TOKENS_GUEST'])) {
        $guest = preg_replace('/[^a-zA-Z0-9_-]/', '', (string)$_SERVER['HTTP_X_L8_TOKENS_GUEST']);
    }
    if ($guest === '' && !empty($_COOKIE['l8_tokens_guest'])) {
        $guest = preg_replace('/[^a-zA-Z0-9_-]/', '', (string)$_COOKIE['l8_tokens_guest']);
    }
    if ($guest !== '' && strlen($guest) >= 8) {
        return $guest;
    }
    if (function_exists('tokensEnsureGuestId')) {
        return tokensEnsureGuestId();
    }
    $id = 'guest_' . bin2hex(random_bytes(8));
    @setcookie('l8_tokens_guest', $id, [
        'expires' => time() + 86400 * 400,
        'path' => '/',
        'secure' => (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || true,
        'httponly' => true,
        'samesite' => 'Strict'
    ]);
    return $id;
}

function aiChatSessionPath($accountKey = null) {
    $key = preg_replace('/[^a-zA-Z0-9_-]/', '', (string)($accountKey ?: aiChatAccountKey()));
    return aiChatStorageDir() . '/sessions/' . $key . '.json';
}

function aiChatLoadSession($accountKey = null) {
    $path = aiChatSessionPath($accountKey);
    if (!is_readable($path)) {
        return ['version' => 1, 'providers' => [], 'updated_at' => date('c')];
    }
    $data = json_decode((string)@file_get_contents($path), true);
    if (!is_array($data)) {
        return ['version' => 1, 'providers' => [], 'updated_at' => date('c')];
    }
    if (!isset($data['providers']) || !is_array($data['providers'])) {
        $data['providers'] = [];
    }
    return $data;
}

function aiChatSaveSession(array $session, $accountKey = null) {
    $session['version'] = 1;
    $session['updated_at'] = date('c');
    $path = aiChatSessionPath($accountKey);
    @file_put_contents($path, json_encode($session, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    // Mirror opcional a Supabase Storage
    if (function_exists('supabaseConfig') && function_exists('supabaseStorageUploadJson')) {
        $cfg = supabaseConfig();
        if (!empty($cfg['configured'])) {
            $key = preg_replace('/[^a-zA-Z0-9_-]/', '', (string)($accountKey ?: aiChatAccountKey()));
            @supabaseStorageUploadJson('meta/ai_chat_' . $key . '.json', $session);
        }
    }
    return true;
}

function aiChatPublicBaseUrl() {
    $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https');
    $scheme = $https ? 'https' : 'http';
    $host = $_SERVER['HTTP_X_FORWARDED_HOST'] ?? $_SERVER['HTTP_HOST'] ?? 'localhost';
    return $scheme . '://' . $host;
}

function aiChatRedirectUri() {
    $custom = trim((string)envValue('AI_CHAT_OAUTH_REDIRECT_URI', ''));
    if ($custom !== '') return $custom;
    return rtrim(aiChatPublicBaseUrl(), '/') . '/api/ai/oauth/callback';
}

function aiChatStripCourtesy($text) {
    $text = trim((string)$text);
    // Quita fences envolventes accidentales
    if (preg_match('/^```[a-zA-Z0-9_-]*\n([\s\S]*?)\n```$/', $text, $m)) {
        $text = trim($m[1]);
    }
    $lines = preg_split("/\r\n|\n|\r/", $text);
    $greet = '/^(hola|hello|hi|hey|buenas|good\s+(morning|afternoon|evening)|sure[,!]?|of course|claro[,!]?|por supuesto|aquí tienes|here (is|you go)|i(\'m| am) (happy|glad)|como (ia|asistente)|as an ai)\b/i';
    while ($lines && trim($lines[0]) === '') array_shift($lines);
    if ($lines && preg_match($greet, trim($lines[0]))) {
        array_shift($lines);
        while ($lines && trim($lines[0]) === '') array_shift($lines);
    }
    $closers = '/^(espero (que )?te (sirva|ayude)|let me know|si necesitas|¿(te|necesitas)|happy to help|cualquier cosa)\b/i';
    while ($lines && preg_match($closers, trim($lines[count($lines) - 1]))) {
        array_pop($lines);
        while ($lines && trim($lines[count($lines) - 1]) === '') array_pop($lines);
    }
    return trim(implode("\n", $lines));
}

function aiChatHttpJson($method, $url, array $headers = [], $body = null, $timeout = 90) {
    $ch = curl_init($url);
    $hdrs = array_merge(['Accept: application/json'], $headers);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, strtoupper($method));
    curl_setopt($ch, CURLOPT_HTTPHEADER, $hdrs);
    curl_setopt($ch, CURLOPT_TIMEOUT, $timeout);
    if ($body !== null) {
        $payload = is_string($body) ? $body : json_encode($body);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
        $hasCt = false;
        foreach ($hdrs as $h) {
            if (stripos($h, 'Content-Type:') === 0) { $hasCt = true; break; }
        }
        if (!$hasCt) {
            $hdrs[] = 'Content-Type: application/json';
            curl_setopt($ch, CURLOPT_HTTPHEADER, $hdrs);
        }
    }
    $raw = curl_exec($ch);
    $errno = curl_errno($ch);
    $err = curl_error($ch);
    $status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if ($errno) {
        return ['ok' => false, 'status' => 0, 'error' => $err ?: 'curl error', 'body' => null, 'raw' => null];
    }
    $decoded = null;
    if ($raw !== false && $raw !== '') {
        $decoded = json_decode($raw, true);
        if ($decoded === null && json_last_error() !== JSON_ERROR_NONE) {
            $decoded = $raw;
        }
    }
    return [
        'ok' => $status >= 200 && $status < 300,
        'status' => $status,
        'error' => ($status >= 200 && $status < 300) ? null : ('HTTP ' . $status),
        'body' => $decoded,
        'raw' => $raw
    ];
}

function aiChatProviderConfigured($vendor) {
    if ($vendor === 'openai') {
        return envValue('OPENAI_CLIENT_ID', '') !== '' || envValue('OPENAI_API_KEY', '') !== '';
    }
    if ($vendor === 'google') {
        return envValue('GOOGLE_CLIENT_ID', '') !== '' || envValue('GEMINI_API_KEY', '') !== '' || envValue('GOOGLE_API_KEY', '') !== '';
    }
    if ($vendor === 'anthropic') {
        return envValue('ANTHROPIC_CLIENT_ID', '') !== ''
            || envValue('ANTHROPIC_API_KEY', '') !== ''
            || envValue('CLAUDE_CODE_OAUTH_TOKEN', '') !== '';
    }
    if ($vendor === 'manus') {
        return envValue('MANUS_CLIENT_ID', '') !== '' || envValue('MANUS_API_KEY', '') !== '';
    }
    return false;
}

function aiChatOauthReady($vendor) {
    if ($vendor === 'openai') {
        return envValue('OPENAI_CLIENT_ID', '') !== '' && envValue('OPENAI_CLIENT_SECRET', '') !== '';
    }
    if ($vendor === 'google') {
        return envValue('GOOGLE_CLIENT_ID', '') !== '' && envValue('GOOGLE_CLIENT_SECRET', '') !== '';
    }
    if ($vendor === 'anthropic') {
        return envValue('ANTHROPIC_CLIENT_ID', '') !== '' && envValue('ANTHROPIC_CLIENT_SECRET', '') !== '';
    }
    if ($vendor === 'manus') {
        return envValue('MANUS_CLIENT_ID', '') !== '' && envValue('MANUS_CLIENT_SECRET', '') !== '';
    }
    return false;
}

function aiChatGetProviderAuth($session, $providerId) {
    $providers = $session['providers'] ?? [];
    $row = is_array($providers[$providerId] ?? null) ? $providers[$providerId] : [];
    // Env fallbacks (server-wide) if user has not logged in yet
    $meta = aiChatProviders()[$providerId] ?? null;
    if (!$meta) return $row;
    $vendor = $meta['vendor'];
    if (empty($row['access_token']) && empty($row['api_key'])) {
        if ($vendor === 'openai' && envValue('OPENAI_API_KEY', '') !== '') {
            $row['api_key'] = envValue('OPENAI_API_KEY');
            $row['auth_method'] = 'env_api_key';
        } else if ($vendor === 'google') {
            $key = envValue('GEMINI_API_KEY', '') ?: envValue('GOOGLE_API_KEY', '');
            if ($key !== '') {
                $row['api_key'] = $key;
                $row['auth_method'] = 'env_api_key';
            }
        } else if ($vendor === 'anthropic') {
            if (envValue('CLAUDE_CODE_OAUTH_TOKEN', '') !== '') {
                $row['access_token'] = envValue('CLAUDE_CODE_OAUTH_TOKEN');
                $row['auth_method'] = 'env_oauth';
            } else if (envValue('ANTHROPIC_API_KEY', '') !== '') {
                $row['api_key'] = envValue('ANTHROPIC_API_KEY');
                $row['auth_method'] = 'env_api_key';
            }
        } else if ($vendor === 'manus' && envValue('MANUS_API_KEY', '') !== '') {
            $row['api_key'] = envValue('MANUS_API_KEY');
            $row['auth_method'] = 'env_api_key';
        }
    }
    return $row;
}

function aiChatIsAuthed($session, $providerId) {
    $auth = aiChatGetProviderAuth($session, $providerId);
    return (!empty($auth['access_token']) || !empty($auth['api_key']));
}

function aiChatStatus() {
    $session = aiChatLoadSession();
    $out = [];
    foreach (aiChatProviders() as $id => $meta) {
        $auth = aiChatGetProviderAuth($session, $id);
        $out[] = [
            'id' => $id,
            'label' => $meta['label'],
            'vendor' => $meta['vendor'],
            'connected' => aiChatIsAuthed($session, $id),
            'auth_method' => $auth['auth_method'] ?? null,
            'oauth_ready' => aiChatOauthReady($meta['vendor']),
            'configured' => aiChatProviderConfigured($meta['vendor']),
            'expires_at' => $auth['expires_at'] ?? null
        ];
    }
    return [
        'ok' => true,
        'account_key' => aiChatAccountKey(),
        'redirect_uri' => aiChatRedirectUri(),
        'providers' => $out,
        'system' => 'content-only'
    ];
}

function aiChatSaveStateFile($state, $payload) {
    $path = aiChatStorageDir() . '/oauth_state/' . preg_replace('/[^a-zA-Z0-9_-]/', '', $state) . '.json';
    @file_put_contents($path, json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

function aiChatLoadStateFile($state) {
    $path = aiChatStorageDir() . '/oauth_state/' . preg_replace('/[^a-zA-Z0-9_-]/', '', $state) . '.json';
    if (!is_readable($path)) return null;
    $data = json_decode((string)@file_get_contents($path), true);
    @unlink($path);
    return is_array($data) ? $data : null;
}

function aiChatStartOauth($providerId) {
    $meta = aiChatProviders()[$providerId] ?? null;
    if (!$meta) {
        return ['ok' => false, 'error' => 'Modelo desconocido'];
    }
    $vendor = $meta['vendor'];
    if (!aiChatOauthReady($vendor)) {
        return [
            'ok' => false,
            'error' => 'OAuth no configurado para ' . $meta['label'] . '. Define CLIENT_ID/CLIENT_SECRET en el servidor, o inicia sesión pegando el token.',
            'code' => 'oauth_not_configured',
            'allow_token_login' => true
        ];
    }

    $state = bin2hex(random_bytes(16));
    $redirect = aiChatRedirectUri();
    aiChatSaveStateFile($state, [
        'provider' => $providerId,
        'vendor' => $vendor,
        'account_key' => aiChatAccountKey(),
        'created_at' => time(),
        'redirect_uri' => $redirect
    ]);

    if ($vendor === 'openai') {
        $url = 'https://auth.openai.com/oauth/authorize?' . http_build_query([
            'response_type' => 'code',
            'client_id' => envValue('OPENAI_CLIENT_ID'),
            'redirect_uri' => $redirect,
            'scope' => envValue('OPENAI_OAUTH_SCOPE', 'openid profile email api.responses.write'),
            'state' => $state
        ]);
    } else if ($vendor === 'google') {
        $url = 'https://accounts.google.com/o/oauth2/v2/auth?' . http_build_query([
            'response_type' => 'code',
            'client_id' => envValue('GOOGLE_CLIENT_ID'),
            'redirect_uri' => $redirect,
            'scope' => envValue('GOOGLE_OAUTH_SCOPE', 'https://www.googleapis.com/auth/generative-language.retriever https://www.googleapis.com/auth/cloud-platform'),
            'access_type' => 'offline',
            'prompt' => 'consent',
            'state' => $state
        ]);
    } else if ($vendor === 'anthropic') {
        $authBase = rtrim(envValue('ANTHROPIC_OAUTH_AUTHORIZE_URL', 'https://console.anthropic.com/oauth/authorize'), '?');
        $url = $authBase . '?' . http_build_query([
            'response_type' => 'code',
            'client_id' => envValue('ANTHROPIC_CLIENT_ID'),
            'redirect_uri' => $redirect,
            'scope' => envValue('ANTHROPIC_OAUTH_SCOPE', 'org:create_api_key user:profile user:inference'),
            'state' => $state
        ]);
    } else if ($vendor === 'manus') {
        $url = 'https://manus.im/openapi/oauth?' . http_build_query([
            'client_id' => envValue('MANUS_CLIENT_ID'),
            'redirect_uri' => $redirect,
            'state' => $state
        ]);
    } else {
        return ['ok' => false, 'error' => 'Vendor OAuth no soportado'];
    }

    return ['ok' => true, 'authorize_url' => $url, 'state' => $state, 'provider' => $providerId];
}

function aiChatExchangeOauthCode($vendor, $code, $redirectUri) {
    if ($vendor === 'openai') {
        return aiChatHttpJson('POST', 'https://auth.openai.com/oauth/token', [
            'Content-Type: application/x-www-form-urlencoded'
        ], http_build_query([
            'grant_type' => 'authorization_code',
            'code' => $code,
            'redirect_uri' => $redirectUri,
            'client_id' => envValue('OPENAI_CLIENT_ID'),
            'client_secret' => envValue('OPENAI_CLIENT_SECRET')
        ]));
    }
    if ($vendor === 'google') {
        return aiChatHttpJson('POST', 'https://oauth2.googleapis.com/token', [
            'Content-Type: application/x-www-form-urlencoded'
        ], http_build_query([
            'grant_type' => 'authorization_code',
            'code' => $code,
            'redirect_uri' => $redirectUri,
            'client_id' => envValue('GOOGLE_CLIENT_ID'),
            'client_secret' => envValue('GOOGLE_CLIENT_SECRET')
        ]));
    }
    if ($vendor === 'anthropic') {
        $tokenUrl = envValue('ANTHROPIC_OAUTH_TOKEN_URL', 'https://console.anthropic.com/v1/oauth/token');
        return aiChatHttpJson('POST', $tokenUrl, [
            'Content-Type: application/json'
        ], [
            'grant_type' => 'authorization_code',
            'code' => $code,
            'redirect_uri' => $redirectUri,
            'client_id' => envValue('ANTHROPIC_CLIENT_ID'),
            'client_secret' => envValue('ANTHROPIC_CLIENT_SECRET')
        ]);
    }
    if ($vendor === 'manus') {
        return aiChatHttpJson('POST', 'https://api.manus.ai/oauth/token', [
            'Content-Type: application/json'
        ], [
            'grant_type' => 'authorization_code',
            'code' => $code,
            'redirect_uri' => $redirectUri,
            'client_id' => envValue('MANUS_CLIENT_ID'),
            'client_secret' => envValue('MANUS_CLIENT_SECRET')
        ]);
    }
    return ['ok' => false, 'error' => 'vendor desconocido', 'body' => null];
}

function aiChatHandleOauthCallback() {
    $state = (string)($_GET['state'] ?? '');
    $code = (string)($_GET['code'] ?? '');
    $err = (string)($_GET['error'] ?? '');
    $saved = $state !== '' ? aiChatLoadStateFile($state) : null;
    if ($err !== '') {
        return aiChatOauthResultPage(false, 'OAuth cancelado: ' . $err);
    }
    if (!$saved || $code === '') {
        return aiChatOauthResultPage(false, 'Estado OAuth inválido o expirado. Vuelve a iniciar sesión.');
    }
    if ((time() - (int)($saved['created_at'] ?? 0)) > 600) {
        return aiChatOauthResultPage(false, 'El intento OAuth expiró. Inténtalo de nuevo.');
    }
    $vendor = $saved['vendor'];
    $providerId = $saved['provider'];
    $accountKey = $saved['account_key'];
    $redirect = $saved['redirect_uri'] ?? aiChatRedirectUri();
    $ex = aiChatExchangeOauthCode($vendor, $code, $redirect);
    if (empty($ex['ok']) || !is_array($ex['body'])) {
        $msg = is_array($ex['body']) ? ($ex['body']['error_description'] ?? $ex['body']['error'] ?? $ex['error']) : ($ex['error'] ?? 'fallo token');
        return aiChatOauthResultPage(false, 'No se pudo completar OAuth: ' . $msg);
    }
    $body = $ex['body'];
    $session = aiChatLoadSession($accountKey);
    $session['providers'][$providerId] = [
        'access_token' => (string)($body['access_token'] ?? ''),
        'refresh_token' => (string)($body['refresh_token'] ?? ''),
        'token_type' => (string)($body['token_type'] ?? 'Bearer'),
        'scope' => (string)($body['scope'] ?? ''),
        'expires_at' => !empty($body['expires_in']) ? date('c', time() + (int)$body['expires_in']) : null,
        'auth_method' => 'oauth',
        'updated_at' => date('c')
    ];
    if ($session['providers'][$providerId]['access_token'] === '' && !empty($body['api_key'])) {
        // algunos flujos Anthropic devuelven api_key
        $session['providers'][$providerId]['api_key'] = (string)$body['api_key'];
        $session['providers'][$providerId]['auth_method'] = 'oauth_api_key';
    }
    aiChatSaveSession($session, $accountKey);
    $label = aiChatProviders()[$providerId]['label'] ?? $providerId;
    return aiChatOauthResultPage(true, $label . ' conectado. Ya puedes cerrar esta ventana.');
}

function aiChatOauthResultPage($ok, $message) {
    $safe = htmlspecialchars((string)$message, ENT_QUOTES, 'UTF-8');
    $title = $ok ? 'Sesión IA conectada' : 'Error OAuth IA';
    $color = $ok ? '#137333' : '#c5221f';
    header('Content-Type: text/html; charset=utf-8');
    echo '<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><title>' . $title . '</title>'
        . '<style>body{font-family:IBM Plex Mono,ui-monospace,monospace;background:#f6f6f6;color:#111;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}'
        . '.box{background:#fff;border:1px solid #ccc;padding:24px;max-width:480px;line-height:1.45}h1{font-size:16px;margin:0 0 10px;color:' . $color . '}p{font-size:13px;margin:0}</style></head><body>'
        . '<div class="box"><h1>' . $title . '</h1><p>' . $safe . '</p></div>'
        . '<script>try{if(window.opener){window.opener.postMessage({type:"l8-ai-oauth",ok:' . ($ok ? 'true' : 'false') . '},"*");}setTimeout(function(){window.close();},1200);}catch(e){}</script>'
        . '</body></html>';
    return true;
}

function aiChatLoginWithToken($providerId, $token, $kind = 'access_token') {
    $meta = aiChatProviders()[$providerId] ?? null;
    if (!$meta) return ['ok' => false, 'error' => 'Modelo desconocido'];
    $token = trim((string)$token);
    if ($token === '' || strlen($token) < 8) {
        return ['ok' => false, 'error' => 'Token inválido'];
    }
    $session = aiChatLoadSession();
    $row = [
        'auth_method' => $kind === 'api_key' ? 'token_api_key' : 'token_oauth',
        'updated_at' => date('c')
    ];
    if ($kind === 'api_key') {
        $row['api_key'] = $token;
        $row['access_token'] = '';
    } else {
        $row['access_token'] = $token;
        $row['api_key'] = '';
    }
    $session['providers'][$providerId] = array_merge($session['providers'][$providerId] ?? [], $row);
    aiChatSaveSession($session);
    return ['ok' => true, 'provider' => $providerId, 'label' => $meta['label'], 'connected' => true];
}

function aiChatLogout($providerId = null) {
    $session = aiChatLoadSession();
    if ($providerId) {
        unset($session['providers'][$providerId]);
    } else {
        $session['providers'] = [];
    }
    aiChatSaveSession($session);
    return ['ok' => true];
}

function aiChatComplete($providerId, $prompt, $noteContext = '') {
    $meta = aiChatProviders()[$providerId] ?? null;
    if (!$meta) return ['ok' => false, 'error' => 'Modelo desconocido'];
    $prompt = trim((string)$prompt);
    if ($prompt === '') return ['ok' => false, 'error' => 'Escribe una petición'];
    if (mb_strlen($prompt) > 12000) {
        return ['ok' => false, 'error' => 'La petición es demasiado larga'];
    }

    $session = aiChatLoadSession();
    if (!aiChatIsAuthed($session, $providerId)) {
        return [
            'ok' => false,
            'error' => 'Inicia sesión OAuth con ' . $meta['label'] . ' antes de generar.',
            'code' => 'not_authenticated',
            'provider' => $providerId
        ];
    }

    $auth = aiChatGetProviderAuth($session, $providerId);
    $userContent = $prompt;
    if (trim((string)$noteContext) !== '') {
        $userContent = "Contexto de la nota (selección/alrededor):\n" . mb_substr(trim($noteContext), 0, 4000)
            . "\n\nPetición:\n" . $prompt;
    }

    $vendor = $meta['vendor'];
    if ($vendor === 'openai') {
        $res = aiChatCompleteOpenAI($meta, $auth, $userContent);
    } else if ($vendor === 'google') {
        $res = aiChatCompleteGemini($meta, $auth, $userContent);
    } else if ($vendor === 'anthropic') {
        $res = aiChatCompleteClaude($meta, $auth, $userContent);
    } else if ($vendor === 'manus') {
        $res = aiChatCompleteManus($meta, $auth, $userContent);
    } else {
        $res = ['ok' => false, 'error' => 'Vendor no soportado'];
    }

    if (!empty($res['ok'])) {
        $res['content'] = aiChatStripCourtesy($res['content'] ?? '');
        $res['provider'] = $providerId;
        $res['label'] = $meta['label'];
    }
    return $res;
}

function aiChatCompleteOpenAI(array $meta, array $auth, $userContent) {
    $headers = ['Content-Type: application/json'];
    if (!empty($auth['access_token'])) {
        $headers[] = 'Authorization: Bearer ' . $auth['access_token'];
    } else if (!empty($auth['api_key'])) {
        $headers[] = 'Authorization: Bearer ' . $auth['api_key'];
    }
    $res = aiChatHttpJson('POST', 'https://api.openai.com/v1/chat/completions', $headers, [
        'model' => $meta['api_model'],
        'temperature' => 0.2,
        'messages' => [
            ['role' => 'system', 'content' => aiChatSystemPrompt()],
            ['role' => 'user', 'content' => $userContent]
        ]
    ]);
    if (empty($res['ok'])) {
        $err = is_array($res['body']) ? ($res['body']['error']['message'] ?? $res['error']) : $res['error'];
        return ['ok' => false, 'error' => 'OpenAI: ' . $err, 'status' => $res['status']];
    }
    $content = $res['body']['choices'][0]['message']['content'] ?? '';
    return ['ok' => true, 'content' => (string)$content];
}

function aiChatCompleteGemini(array $meta, array $auth, $userContent) {
    $model = rawurlencode($meta['api_model']);
    $key = $auth['api_key'] ?? '';
    $url = 'https://generativelanguage.googleapis.com/v1beta/models/' . $model . ':generateContent';
    $headers = ['Content-Type: application/json'];
    if (!empty($auth['access_token'])) {
        $headers[] = 'Authorization: Bearer ' . $auth['access_token'];
    } else if ($key !== '') {
        $url .= '?key=' . rawurlencode($key);
    } else {
        return ['ok' => false, 'error' => 'Gemini sin credenciales'];
    }
    $res = aiChatHttpJson('POST', $url, $headers, [
        'system_instruction' => ['parts' => [['text' => aiChatSystemPrompt()]]],
        'contents' => [
            ['role' => 'user', 'parts' => [['text' => $userContent]]]
        ],
        'generationConfig' => ['temperature' => 0.2]
    ]);
    if (empty($res['ok'])) {
        $err = is_array($res['body']) ? ($res['body']['error']['message'] ?? $res['error']) : $res['error'];
        return ['ok' => false, 'error' => 'Gemini: ' . $err, 'status' => $res['status']];
    }
    $parts = $res['body']['candidates'][0]['content']['parts'] ?? [];
    $text = '';
    foreach ($parts as $p) {
        if (isset($p['text'])) $text .= $p['text'];
    }
    return ['ok' => true, 'content' => $text];
}

function aiChatCompleteClaude(array $meta, array $auth, $userContent) {
    $headers = [
        'Content-Type: application/json',
        'anthropic-version: 2023-06-01'
    ];
    if (!empty($auth['api_key'])) {
        $headers[] = 'x-api-key: ' . $auth['api_key'];
    } else if (!empty($auth['access_token'])) {
        $headers[] = 'Authorization: Bearer ' . $auth['access_token'];
        // Claude Code / Anthropic OAuth a veces requiere beta header
        $headers[] = 'anthropic-beta: oauth-2024-06-01';
    } else {
        return ['ok' => false, 'error' => 'Claude sin credenciales'];
    }
    $res = aiChatHttpJson('POST', 'https://api.anthropic.com/v1/messages', $headers, [
        'model' => $meta['api_model'],
        'max_tokens' => 4096,
        'temperature' => 0.2,
        'system' => aiChatSystemPrompt(),
        'messages' => [
            ['role' => 'user', 'content' => $userContent]
        ]
    ]);
    if (empty($res['ok'])) {
        $err = is_array($res['body']) ? ($res['body']['error']['message'] ?? $res['error']) : $res['error'];
        return ['ok' => false, 'error' => 'Claude: ' . $err, 'status' => $res['status']];
    }
    $text = '';
    foreach (($res['body']['content'] ?? []) as $block) {
        if (($block['type'] ?? '') === 'text') $text .= $block['text'] ?? '';
    }
    return ['ok' => true, 'content' => $text];
}

function aiChatCompleteManus(array $meta, array $auth, $userContent) {
    $headers = ['Content-Type: application/json'];
    if (!empty($auth['access_token'])) {
        $headers[] = 'Authorization: Bearer ' . $auth['access_token'];
    } else if (!empty($auth['api_key'])) {
        $headers[] = 'x-manus-api-key: ' . $auth['api_key'];
    } else {
        return ['ok' => false, 'error' => 'Manus sin credenciales'];
    }

    $prompt = aiChatSystemPrompt() . "\n\n" . $userContent;
    $create = aiChatHttpJson('POST', 'https://api.manus.ai/v2/task.create', $headers, [
        'agent_profile' => $meta['api_model'],
        'interactive_mode' => false,
        'hide_in_task_list' => true,
        'title' => 'l8 notepad',
        'structured_output_schema' => [
            'type' => 'object',
            'additionalProperties' => false,
            'required' => ['content'],
            'properties' => [
                'content' => [
                    'type' => 'string',
                    'description' => 'Only the requested notepad content, no greetings'
                ]
            ]
        ],
        'message' => [
            'content' => [
                ['type' => 'text', 'text' => $prompt]
            ]
        ]
    ], 120);

    if (empty($create['ok']) || empty($create['body']['task_id'])) {
        $err = is_array($create['body']) ? ($create['body']['error']['message'] ?? $create['error']) : $create['error'];
        return ['ok' => false, 'error' => 'Manus create: ' . $err, 'status' => $create['status'] ?? 0];
    }
    $taskId = (string)$create['body']['task_id'];

    // Poll mensajes / detalle
    $content = '';
    for ($i = 0; $i < 24; $i++) {
        usleep(900000);
        $detail = aiChatHttpJson('POST', 'https://api.manus.ai/v2/task.detail', $headers, [
            'task_id' => $taskId
        ], 60);
        $body = is_array($detail['body']) ? $detail['body'] : [];
        if (!empty($body['structured_output']['content'])) {
            $content = (string)$body['structured_output']['content'];
            break;
        }
        if (!empty($body['output']['content'])) {
            $content = is_string($body['output']['content']) ? $body['output']['content'] : json_encode($body['output']['content']);
            break;
        }
        $status = strtolower((string)($body['status'] ?? $body['task_status'] ?? ''));
        if (in_array($status, ['failed', 'error', 'cancelled'], true)) {
            return ['ok' => false, 'error' => 'Manus task ' . $status];
        }

        $msgs = aiChatHttpJson('POST', 'https://api.manus.ai/v2/task.listMessages', $headers, [
            'task_id' => $taskId
        ], 60);
        if (!empty($msgs['ok']) && is_array($msgs['body'])) {
            $list = $msgs['body']['messages'] ?? $msgs['body']['data'] ?? $msgs['body'];
            if (is_array($list)) {
                for ($j = count($list) - 1; $j >= 0; $j--) {
                    $m = $list[$j];
                    if (!is_array($m)) continue;
                    $role = strtolower((string)($m['role'] ?? $m['author'] ?? ''));
                    if ($role === 'user' || $role === 'human') continue;
                    if (!empty($m['content']) && is_string($m['content'])) {
                        $content = $m['content'];
                        break 2;
                    }
                    if (!empty($m['content']) && is_array($m['content'])) {
                        foreach ($m['content'] as $part) {
                            if (is_array($part) && ($part['type'] ?? '') === 'text') {
                                $content .= $part['text'] ?? '';
                            } else if (is_string($part)) {
                                $content .= $part;
                            }
                        }
                        if (trim($content) !== '') break 2;
                    }
                }
            }
        }
        if (in_array($status, ['completed', 'done', 'success', 'finished'], true) && trim($content) !== '') {
            break;
        }
    }

    if (trim($content) === '') {
        return [
            'ok' => false,
            'error' => 'Manus no devolvió contenido a tiempo. Revisa la tarea en Manus.',
            'task_id' => $taskId,
            'task_url' => $create['body']['task_url'] ?? null
        ];
    }
    return ['ok' => true, 'content' => $content, 'task_id' => $taskId];
}

/**
 * Maneja /api/ai/* — retorna true si respondió.
 */
function aiChatHandleApi($uri) {
    if (strpos($uri, '/api/ai') !== 0) {
        return false;
    }

    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

    if ($uri === '/api/ai/oauth/callback' && $method === 'GET') {
        aiChatHandleOauthCallback();
        return true;
    }

    header('Content-Type: application/json; charset=utf-8');

    if (($uri === '/api/ai' || $uri === '/api/ai/status' || $uri === '/api/ai/providers') && $method === 'GET') {
        echo json_encode(aiChatStatus(), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        return true;
    }

    if ($uri === '/api/ai/oauth/start' && ($method === 'GET' || $method === 'POST')) {
        $provider = $_GET['provider'] ?? '';
        if ($method === 'POST') {
            $raw = json_decode((string)file_get_contents('php://input'), true) ?: [];
            $provider = $raw['provider'] ?? $provider;
        }
        $res = aiChatStartOauth($provider);
        if (empty($res['ok'])) http_response_code(400);
        echo json_encode($res, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        return true;
    }

    if ($uri === '/api/ai/login' && $method === 'POST') {
        $raw = json_decode((string)file_get_contents('php://input'), true) ?: [];
        $res = aiChatLoginWithToken(
            $raw['provider'] ?? '',
            $raw['token'] ?? $raw['access_token'] ?? $raw['api_key'] ?? '',
            !empty($raw['api_key']) || (($raw['kind'] ?? '') === 'api_key') ? 'api_key' : 'access_token'
        );
        if (empty($res['ok'])) http_response_code(400);
        echo json_encode($res, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        return true;
    }

    if ($uri === '/api/ai/logout' && $method === 'POST') {
        $raw = json_decode((string)file_get_contents('php://input'), true) ?: [];
        echo json_encode(aiChatLogout($raw['provider'] ?? null), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        return true;
    }

    if (($uri === '/api/ai/chat' || $uri === '/api/ai/complete') && $method === 'POST') {
        $raw = json_decode((string)file_get_contents('php://input'), true) ?: [];
        $res = aiChatComplete(
            $raw['provider'] ?? $raw['model'] ?? '',
            $raw['prompt'] ?? $raw['message'] ?? $raw['text'] ?? '',
            $raw['context'] ?? $raw['selection'] ?? ''
        );
        if (empty($res['ok'])) {
            http_response_code(!empty($res['code']) && $res['code'] === 'not_authenticated' ? 401 : 400);
        }
        echo json_encode($res, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        return true;
    }

    http_response_code(404);
    echo json_encode(['ok' => false, 'error' => 'Unknown AI endpoint'], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    return true;
}
