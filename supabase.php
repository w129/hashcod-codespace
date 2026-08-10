<?php
/**
 * Cliente Supabase (REST + Storage) para la plataforma l8.
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

function envSanitize($val) {
    if ($val === false || $val === null) return '';
    $val = trim((string)$val);
    if ($val === '') return '';
    // quita comillas envolventes accidentales del panel de Render
    if (
        (strlen($val) >= 2) &&
        (($val[0] === '"' && substr($val, -1) === '"') || ($val[0] === "'" && substr($val, -1) === "'"))
    ) {
        $val = trim(substr($val, 1, -1));
    }
    return $val;
}

function envValue($key, $default = '') {
    $candidates = [];

    // 1) entorno del proceso / contenedor
    $g = @getenv($key);
    if ($g !== false) $candidates[] = $g;
    // PHP 7.1+: también probar local_only
    if (function_exists('getenv')) {
        $gLocal = @getenv($key, true);
        if ($gLocal !== false) $candidates[] = $gLocal;
    }
    if (isset($_ENV[$key])) $candidates[] = $_ENV[$key];
    if (isset($_SERVER[$key])) $candidates[] = $_SERVER[$key];

    // 2) Secret Files de Render (/etc/secrets/<KEY>)
    foreach ([
        '/etc/secrets/' . $key,
        '/etc/secrets/' . strtolower($key),
        '/etc/secrets/' . strtoupper($key),
    ] as $secretPath) {
        if (is_readable($secretPath)) {
            $candidates[] = @file_get_contents($secretPath);
        }
    }

    foreach ($candidates as $raw) {
        $val = envSanitize($raw);
        if ($val !== '') return $val;
    }
    return $default;
}

/** Probe seguro: no expone secretos, solo si existen y su longitud/prefijo. */
function envProbeKeys(array $keys) {
    $out = [];
    foreach ($keys as $key) {
        $val = envValue($key, '');
        $out[$key] = [
            'set' => $val !== '',
            'length' => strlen($val),
            'prefix' => $val !== '' ? substr($val, 0, min(12, strlen($val))) : '',
            'sources' => [
                'getenv' => @getenv($key) !== false && envSanitize(@getenv($key)) !== '',
                'env' => isset($_ENV[$key]) && envSanitize($_ENV[$key]) !== '',
                'server' => isset($_SERVER[$key]) && envSanitize($_SERVER[$key]) !== '',
                'secret_file' => is_readable('/etc/secrets/' . $key)
            ]
        ];
    }

    // claves visibles en $_SERVER / $_ENV que parezcan relacionadas
    $related = [];
    foreach ([$_ENV, $_SERVER] as $bag) {
        if (!is_array($bag)) continue;
        foreach (array_keys($bag) as $k) {
            if (preg_match('/^(SUPABASE|GITHUB|GH)_/i', (string)$k)) {
                $related[$k] = true;
            }
        }
    }
    $out['_related_keys_seen'] = array_keys($related);
    return $out;
}

function supabaseConfig() {
    loadEnvFile();
    $url = rtrim(envValue('SUPABASE_URL'), '/');
    $publishable = envValue('SUPABASE_PUBLISHABLE_KEY');
    $secret = envValue('SUPABASE_SECRET_KEY');
    if ($publishable === '') {
        $publishable = envValue('SUPABASE_ANON_KEY');
    }
    if ($secret === '') {
        $secret = envValue('SUPABASE_SERVICE_ROLE_KEY');
    }
    $bucket = envValue('SUPABASE_STORAGE_BUCKET', 'l8-storage');
    return [
        'url' => $url,
        'publishable_key' => $publishable,
        'secret_key' => $secret,
        'bucket' => $bucket !== '' ? $bucket : 'l8-storage',
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
            'body' => null,
            'raw' => null
        ];
    }

    $useSecret = !array_key_exists('use_secret', $options) ? true : !empty($options['use_secret']);
    // Storage y escrituras usan secret por defecto; health puede forzar publishable
    if (isset($options['use_secret']) && $options['use_secret'] === false) {
        $useSecret = false;
    }
    $apiKey = $useSecret ? ($cfg['secret_key'] ?: $cfg['publishable_key']) : ($cfg['publishable_key'] ?: $cfg['secret_key']);
    if ($apiKey === '') {
        return ['ok' => false, 'status' => 0, 'error' => 'Falta API key de Supabase', 'body' => null, 'raw' => null];
    }

    $method = strtoupper($options['method'] ?? 'GET');
    $url = $cfg['url'] . '/' . ltrim($path, '/');
    $contentType = $options['content_type'] ?? 'application/json';
    $headers = [
        'apikey: ' . $apiKey,
        'Accept: application/json'
    ];
    if (!empty($contentType)) {
        $headers[] = 'Content-Type: ' . $contentType;
    }
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
    curl_setopt($ch, CURLOPT_TIMEOUT, isset($options['timeout']) ? (int)$options['timeout'] : 60);
    if (array_key_exists('body', $options)) {
        $payload = $options['body'];
        if ($contentType === 'application/json' && !is_string($payload)) {
            $payload = json_encode($payload);
        }
        curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
    }
    $raw = curl_exec($ch);
    $errno = curl_errno($ch);
    $err = curl_error($ch);
    $status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($errno) {
        return ['ok' => false, 'status' => 0, 'error' => $err ?: 'Error cURL', 'body' => null, 'raw' => null];
    }

    $decoded = null;
    if ($raw !== false && $raw !== '' && empty($options['raw_response'])) {
        $decoded = json_decode($raw, true);
        if ($decoded === null && json_last_error() !== JSON_ERROR_NONE) {
            $decoded = $raw;
        }
    }

    return [
        'ok' => $status >= 200 && $status < 300,
        'status' => $status,
        'error' => ($status >= 200 && $status < 300) ? null : (is_array($decoded) ? ($decoded['message'] ?? $decoded['error'] ?? $raw) : $raw),
        'body' => $decoded,
        'raw' => $raw
    ];
}

function supabaseStorageBucket() {
    $cfg = supabaseConfig();
    return $cfg['bucket'];
}

function supabaseEnsureBucket() {
    static $ensured = null;
    if ($ensured !== null) return $ensured;

    $bucket = supabaseStorageBucket();
    $get = supabaseRequest('storage/v1/bucket/' . rawurlencode($bucket), [
        'method' => 'GET',
        'use_secret' => true
    ]);
    if (!empty($get['ok'])) {
        $ensured = ['ok' => true, 'bucket' => $bucket, 'created' => false];
        return $ensured;
    }

    $create = supabaseRequest('storage/v1/bucket', [
        'method' => 'POST',
        'use_secret' => true,
        'body' => [
            'id' => $bucket,
            'name' => $bucket,
            'public' => false,
            'file_size_limit' => 104857600
        ]
    ]);
    $ensured = [
        'ok' => !empty($create['ok']) || ($create['status'] ?? 0) === 409,
        'bucket' => $bucket,
        'created' => !empty($create['ok']),
        'error' => $create['error'] ?? null
    ];
    return $ensured;
}

function supabaseStorageUpload($objectPath, $data, $contentType = 'application/octet-stream', $isFilePath = false) {
    $ensure = supabaseEnsureBucket();
    if (empty($ensure['ok'])) {
        return ['ok' => false, 'error' => 'No se pudo preparar bucket: ' . ($ensure['error'] ?? 'desconocido')];
    }

    $bucket = supabaseStorageBucket();
    $binary = $isFilePath ? @file_get_contents($data) : $data;
    if ($binary === false || $binary === null) {
        return ['ok' => false, 'error' => 'No se pudo leer el contenido a subir'];
    }

    $path = ltrim(str_replace('\\', '/', $objectPath), '/');
    $res = supabaseRequest('storage/v1/object/' . rawurlencode($bucket) . '/' . $path, [
        'method' => 'POST',
        'use_secret' => true,
        'content_type' => $contentType,
        'headers' => ['x-upsert: true'],
        'body' => $binary,
        'timeout' => 120
    ]);

    // Algunos proyectos esperan PUT para upsert
    if (empty($res['ok']) && in_array(($res['status'] ?? 0), [400, 409], true)) {
        $res = supabaseRequest('storage/v1/object/' . rawurlencode($bucket) . '/' . $path, [
            'method' => 'PUT',
            'use_secret' => true,
            'content_type' => $contentType,
            'headers' => ['x-upsert: true'],
            'body' => $binary,
            'timeout' => 120
        ]);
    }

    return [
        'ok' => !empty($res['ok']),
        'status' => $res['status'],
        'error' => $res['error'],
        'path' => $path,
        'bucket' => $bucket,
        'body' => $res['body']
    ];
}

function supabaseStorageDownload($objectPath) {
    $bucket = supabaseStorageBucket();
    $path = ltrim(str_replace('\\', '/', $objectPath), '/');
    $res = supabaseRequest('storage/v1/object/' . rawurlencode($bucket) . '/' . $path, [
        'method' => 'GET',
        'use_secret' => true,
        'content_type' => '',
        'raw_response' => true,
        'timeout' => 120
    ]);
    return [
        'ok' => !empty($res['ok']),
        'status' => $res['status'],
        'error' => $res['error'],
        'data' => $res['raw'],
        'path' => $path
    ];
}

function supabaseStorageUploadJson($objectPath, $data) {
    return supabaseStorageUpload($objectPath, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), 'application/json', false);
}

function supabaseStorageDownloadJson($objectPath) {
    $res = supabaseStorageDownload($objectPath);
    if (empty($res['ok']) || $res['data'] === null || $res['data'] === '') {
        return ['ok' => false, 'error' => $res['error'] ?? 'Vacío', 'data' => null];
    }
    $decoded = json_decode($res['data'], true);
    if ($decoded === null && json_last_error() !== JSON_ERROR_NONE) {
        return ['ok' => false, 'error' => 'JSON inválido en Storage', 'data' => null];
    }
    return ['ok' => true, 'data' => $decoded, 'error' => null];
}

/** Sube un archivo de la plataforma a Storage: files/{id}{ext} */
function supabaseStorePlatformFile($fileId, $localPath, $mimeType = 'application/octet-stream', $originalName = '') {
    if (!file_exists($localPath)) {
        return ['ok' => false, 'error' => 'Archivo local no existe'];
    }
    $ext = pathinfo($localPath, PATHINFO_EXTENSION);
    $objectPath = 'files/' . $fileId . ($ext ? ('.' . $ext) : '');
    $upload = supabaseStorageUpload($objectPath, $localPath, $mimeType ?: 'application/octet-stream', true);
    if (!empty($upload['ok']) && $originalName !== '') {
        // metadatos ligeros junto al archivo
        supabaseStorageUploadJson('files_meta/' . $fileId . '.json', [
            'id' => $fileId,
            'filename' => $originalName,
            'mime_type' => $mimeType,
            'storage_object' => $objectPath,
            'uploaded_at' => date('c')
        ]);
    }
    return $upload;
}

/** Sincroniza un índice JSON local hacia Supabase meta/ */
function supabaseSyncMetaFile($localPath, $metaName) {
    if (!file_exists($localPath)) {
        return ['ok' => false, 'error' => 'Meta local no existe'];
    }
    $raw = file_get_contents($localPath);
    if ($raw === false) {
        return ['ok' => false, 'error' => 'No se pudo leer meta local'];
    }
    return supabaseStorageUpload('meta/' . ltrim($metaName, '/'), $raw, 'application/json', false);
}

/**
 * Descarga meta de Supabase Storage.
 * Fuente de verdad = remoto (disco Render / seed del repo son efímeros).
 * $force=false aún prefiere remoto si existe; solo conserva local si remoto falla.
 */
function supabaseHydrateMetaFile($localPath, $metaName, $force = false) {
    $res = supabaseStorageDownload('meta/' . ltrim($metaName, '/'));
    if (empty($res['ok']) || $res['data'] === null || $res['data'] === '') {
        if (file_exists($localPath) && filesize($localPath) > 2) {
            return ['ok' => true, 'hydrated' => false, 'source' => 'local', 'error' => $res['error'] ?? 'sin meta remota'];
        }
        return ['ok' => false, 'hydrated' => false, 'error' => $res['error'] ?? 'sin meta remota'];
    }

    // Merge object maps: remoto gana en conflictos; se conservan claves solo-locales
    $remoteData = json_decode($res['data'], true);
    $localData = null;
    if (file_exists($localPath) && filesize($localPath) > 2) {
        $localData = json_decode((string)file_get_contents($localPath), true);
    }
    $outRaw = $res['data'];
    if (is_array($remoteData) && is_array($localData) && supabaseIsAssoc($remoteData) && supabaseIsAssoc($localData)) {
        if ($force) {
            $merged = $remoteData;
        } else {
            $merged = array_replace($localData, $remoteData);
        }
        $outRaw = json_encode($merged, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    }

    $dir = dirname($localPath);
    if (!file_exists($dir)) @mkdir($dir, 0777, true);
    file_put_contents($localPath, $outRaw);
    return ['ok' => true, 'hydrated' => true, 'source' => 'supabase'];
}

function supabaseIsAssoc($arr) {
    if (!is_array($arr) || $arr === []) return false;
    return array_keys($arr) !== range(0, count($arr) - 1);
}

/** Estado de sesión de la plataforma (comandos / inspector) en Storage */
function supabasePlatformStatePath() {
    return 'meta/platform_session.json';
}

function supabaseLoadPlatformState() {
    $cfg = supabaseConfig();
    if (empty($cfg['configured'])) {
        return ['ok' => false, 'error' => 'Supabase no configurado', 'state' => null];
    }
    $res = supabaseStorageDownloadJson(supabasePlatformStatePath());
    if (empty($res['ok'])) {
        return ['ok' => false, 'error' => $res['error'] ?? 'sin sesión', 'state' => null];
    }
    return ['ok' => true, 'state' => $res['data'], 'error' => null];
}

function supabaseSavePlatformState(array $state) {
    $cfg = supabaseConfig();
    if (empty($cfg['configured'])) {
        return ['ok' => false, 'error' => 'Supabase no configurado'];
    }
    $state['version'] = 1;
    $state['updated_at'] = date('c');
    return supabaseStorageUploadJson(supabasePlatformStatePath(), $state);
}

/**
 * PostgREST helpers (DB). Si las tablas no existen, fallan en silencio;
 * ver supabase/schema.sql para crearlas en el SQL Editor.
 */
function supabaseDbRequest($tablePath, $options = []) {
    $path = 'rest/v1/' . ltrim($tablePath, '/');
    $opts = $options;
    if (!isset($opts['headers'])) $opts['headers'] = [];
    $opts['headers'][] = 'Prefer: resolution=merge-duplicates,return=representation';
    if (empty($opts['method']) || strtoupper($opts['method']) === 'GET') {
        // no Prefer needed for GET
        $opts['headers'] = array_values(array_filter($opts['headers'], function ($h) {
            return stripos($h, 'Prefer:') !== 0;
        }));
    }
    return supabaseRequest($path, $opts);
}

function supabaseDbUpsert($table, array $rows, $onConflict = 'id') {
    if ($rows === []) return ['ok' => true, 'skipped' => true];
    return supabaseDbRequest($table . '?on_conflict=' . rawurlencode($onConflict), [
        'method' => 'POST',
        'use_secret' => true,
        'headers' => [
            'Prefer: resolution=merge-duplicates,return=minimal'
        ],
        'body' => array_values($rows)
    ]);
}

function supabaseDbSelect($table, $query = '') {
    $q = $query !== '' ? ('?' . ltrim($query, '?')) : '';
    return supabaseDbRequest($table . $q, [
        'method' => 'GET',
        'use_secret' => true
    ]);
}

function supabaseDbDelete($table, $query = '') {
    $q = $query !== '' ? ('?' . ltrim($query, '?')) : '';
    return supabaseDbRequest($table . $q, [
        'method' => 'DELETE',
        'use_secret' => true,
        'headers' => ['Prefer: return=minimal']
    ]);
}

/** Hidrata índices críticos desde Supabase (una vez por request PHP). */
function supabaseBootstrapPlatformData($storageDir) {
    static $done = false;
    if ($done) return ['ok' => true, 'skipped' => true];
    $done = true;

    $cfg = supabaseConfig();
    if (empty($cfg['configured'])) {
        return ['ok' => false, 'error' => 'Supabase no configurado'];
    }

    $results = [];
    $results['repos_index'] = supabaseHydrateMetaFile(
        rtrim($storageDir, '/') . '/repos_index.json',
        'repos_index.json',
        true
    );
    $results['global_database_index'] = supabaseHydrateMetaFile(
        rtrim($storageDir, '/') . '/global_database_index.json',
        'global_database_index.json',
        true
    );
    $results['gateway_codes'] = supabaseHydrateMetaFile(
        rtrim($storageDir, '/') . '/gateway/codes.json',
        'gateway_codes.json',
        true
    );
    $results['gateway_transfers'] = supabaseHydrateMetaFile(
        rtrim($storageDir, '/') . '/gateway/transfers.json',
        'gateway_transfers.json',
        true
    );
    $results['auth_users'] = supabaseHydrateMetaFile(
        rtrim($storageDir, '/') . '/auth/users.json',
        'auth_users.json',
        true
    );
    return ['ok' => true, 'results' => $results];
}

function supabaseHealthCheck() {
    $cfg = supabaseConfig();
    $probe = envProbeKeys([
        'SUPABASE_URL',
        'SUPABASE_PUBLISHABLE_KEY',
        'SUPABASE_SECRET_KEY',
        'SUPABASE_ANON_KEY',
        'SUPABASE_SERVICE_ROLE_KEY',
        'SUPABASE_STORAGE_BUCKET',
        'GITHUB_TOKEN',
        'GH_TOKEN'
    ]);

    if (!$cfg['configured']) {
        return [
            'type' => 'SUPABASE_STATUS',
            'ok' => false,
            'connected' => false,
            'url' => $cfg['url'],
            'has_publishable' => $cfg['publishable_key'] !== '',
            'has_secret' => $cfg['secret_key'] !== '',
            'storage_bucket' => $cfg['bucket'],
            'storage_ready' => false,
            'error' => 'Variables de entorno no configuradas (PHP no las ve en el contenedor). Revisa Render → Environment y haz Manual Deploy.',
            'env_probe' => $probe,
            'auth_health' => null
        ];
    }

    $res = supabaseRequest('auth/v1/health', ['use_secret' => false]);
    $bucket = supabaseEnsureBucket();
    $connected = !empty($res['ok']);
    $session = supabaseLoadPlatformState();
    $dbProbe = supabaseDbSelect('l8_repos', 'select=id&limit=1');
    $dbReady = !empty($dbProbe['ok']);
    return [
        'type' => 'SUPABASE_STATUS',
        'ok' => $connected,
        'connected' => $connected,
        'url' => $cfg['url'],
        'has_publishable' => $cfg['publishable_key'] !== '',
        'has_secret' => $cfg['secret_key'] !== '',
        'storage_bucket' => $cfg['bucket'],
        'storage_ready' => !empty($bucket['ok']),
        'db_ready' => $dbReady,
        'session_persisted' => !empty($session['ok']),
        'http_status' => $res['status'],
        'error' => $res['error'],
        'auth_health' => $res['body'],
        'env_probe' => $probe,
        'message' => $connected
            ? ('Supabase conectado · Storage: ' . $cfg['bucket'] . (!empty($bucket['ok']) ? ' listo' : ' no disponible')
                . ($dbReady ? ' · DB lista' : ' · DB opcional (ejecuta supabase/schema.sql)'))
            : ('Fallo de conexión: ' . ($res['error'] ?: 'HTTP ' . $res['status']))
    ];
}
