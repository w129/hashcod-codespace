<?php
/**
 * Cliente mínimo Supabase (REST) para la plataforma l8.
 * Keys nuevas: sb_publishable_... / sb_secret_... van en header apikey.
 */

function loadEnvFile($path = null) {
    $path = $path ?: (__DIR__ . '/.env');
    if (!file_exists($path) || !is_readable($path)) {
        return;
    }
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || $line[0] === '#') continue;
        if (strpos($line, '=') === false) continue;
        list($key, $value) = explode('=', $line, 2);
        $key = trim($key);
        $value = trim($value);
        if ($value !== '' && (($value[0] === '"' && substr($value, -1) === '"') || ($value[0] === "'" && substr($value, -1) === "'"))) {
            $value = substr($value, 1, -1);
        }
        if ($key !== '' && getenv($key) === false) {
            putenv("$key=$value");
            $_ENV[$key] = $value;
        }
    }
}

function supabaseConfig() {
    loadEnvFile();
    $url = rtrim(getenv('SUPABASE_URL') ?: ($_ENV['SUPABASE_URL'] ?? ''), '/');
    $publishable = getenv('SUPABASE_PUBLISHABLE_KEY') ?: ($_ENV['SUPABASE_PUBLISHABLE_KEY'] ?? '');
    $secret = getenv('SUPABASE_SECRET_KEY') ?: ($_ENV['SUPABASE_SECRET_KEY'] ?? '');
    // Compatibilidad con nombres legacy
    if ($publishable === '') {
        $publishable = getenv('SUPABASE_ANON_KEY') ?: ($_ENV['SUPABASE_ANON_KEY'] ?? '');
    }
    if ($secret === '') {
        $secret = getenv('SUPABASE_SERVICE_ROLE_KEY') ?: ($_ENV['SUPABASE_SERVICE_ROLE_KEY'] ?? '');
    }
    return [
        'url' => $url,
        'publishable_key' => $publishable,
        'secret_key' => $secret,
        'configured' => ($url !== '' && ($publishable !== '' || $secret !== ''))
    ];
}

function supabaseRequest($path, $options = []) {
    $cfg = supabaseConfig();
    if (!$cfg['configured']) {
        return [
            'ok' => false,
            'status' => 0,
            'error' => 'Supabase no configurado. Define SUPABASE_URL y SUPABASE_PUBLISHABLE_KEY / SUPABASE_SECRET_KEY',
            'body' => null
        ];
    }

    $useSecret = !empty($options['use_secret']);
    $apiKey = $useSecret ? ($cfg['secret_key'] ?: $cfg['publishable_key']) : ($cfg['publishable_key'] ?: $cfg['secret_key']);
    if ($apiKey === '') {
        return ['ok' => false, 'status' => 0, 'error' => 'Falta API key de Supabase', 'body' => null];
    }

    $method = strtoupper($options['method'] ?? 'GET');
    $url = $cfg['url'] . '/' . ltrim($path, '/');
    $headers = [
        'apikey: ' . $apiKey,
        'Content-Type: application/json',
        'Accept: application/json'
    ];
    // Solo Bearer si es JWT legacy; las sb_* van solo en apikey
    if (strpos($apiKey, 'sb_') !== 0) {
        $headers[] = 'Authorization: Bearer ' . $apiKey;
    }
    if (!empty($options['headers']) && is_array($options['headers'])) {
        foreach ($options['headers'] as $h) {
            $headers[] = $h;
        }
    }

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_TIMEOUT, 20);
    if (isset($options['body'])) {
        $payload = is_string($options['body']) ? $options['body'] : json_encode($options['body']);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
    }
    $raw = curl_exec($ch);
    $errno = curl_errno($ch);
    $err = curl_error($ch);
    $status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($errno) {
        return ['ok' => false, 'status' => 0, 'error' => $err ?: 'Error cURL', 'body' => null];
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
        'error' => ($status >= 200 && $status < 300) ? null : (is_array($decoded) ? ($decoded['message'] ?? $decoded['error'] ?? $raw) : $raw),
        'body' => $decoded
    ];
}

function supabaseHealthCheck() {
    $cfg = supabaseConfig();
    if (!$cfg['configured']) {
        return [
            'type' => 'SUPABASE_STATUS',
            'ok' => false,
            'connected' => false,
            'url' => $cfg['url'],
            'has_publishable' => $cfg['publishable_key'] !== '',
            'has_secret' => $cfg['secret_key'] !== '',
            'error' => 'Variables de entorno no configuradas',
            'auth_health' => null
        ];
    }

    $res = supabaseRequest('auth/v1/health', ['use_secret' => false]);
    return [
        'type' => 'SUPABASE_STATUS',
        'ok' => !empty($res['ok']),
        'connected' => !empty($res['ok']),
        'url' => $cfg['url'],
        'has_publishable' => $cfg['publishable_key'] !== '',
        'has_secret' => $cfg['secret_key'] !== '',
        'http_status' => $res['status'],
        'error' => $res['error'],
        'auth_health' => $res['body'],
        'message' => !empty($res['ok'])
            ? 'Supabase conectado correctamente'
            : ('Fallo de conexión: ' . ($res['error'] ?: 'HTTP ' . $res['status']))
    ];
}
