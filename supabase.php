<?php
/**
 * Cliente Supabase (REST + Storage) para la plataforma l8.
 * Keys nuevas: sb_publishable_... / sb_secret_... van en header apikey.
 */

function loadEnvFile($path = null) {
    $paths = $path ? [$path] : [
        __DIR__ . '/.env',
        '/etc/secrets/.env',
        '/etc/secrets/env',
        '/etc/secrets/.env.local',
        '/etc/secrets/dotenv',
    ];

    foreach ($paths as $filePath) {
        if (!file_exists($filePath) || !is_readable($filePath)) {
            continue;
        }
        $lines = @file($filePath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        if (!$lines) continue;
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
            if ($key !== '') {
                putenv("$key=$value");
                $_ENV[$key] = $value;
                $_SERVER[$key] = $value;
            }
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
    if (!function_exists('secretGet')) {
        require_once __DIR__ . '/secrets.php';
    }
    $url = rtrim(secretGet('SUPABASE_URL', envValue('SUPABASE_URL')), '/');
    $publishable = secretGet('SUPABASE_PUBLISHABLE_KEY', envValue('SUPABASE_PUBLISHABLE_KEY'));
    $secret = secretGet('SUPABASE_SECRET_KEY', envValue('SUPABASE_SECRET_KEY'));
    if ($publishable === '') {
        $publishable = secretGet('SUPABASE_ANON_KEY', envValue('SUPABASE_ANON_KEY'));
    }
    if ($secret === '') {
        $secret = secretGet('SUPABASE_SERVICE_ROLE_KEY', envValue('SUPABASE_SERVICE_ROLE_KEY'));
    }
    $bucket = secretGet('SUPABASE_STORAGE_BUCKET', envValue('SUPABASE_STORAGE_BUCKET', 'l8-storage'));
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
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 2);
    curl_setopt($ch, CURLOPT_TIMEOUT, isset($options['timeout']) ? (int)$options['timeout'] : 8);
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
    // Soft-delete de seguridad: en lugar de DELETE fisico, nunca se elimina nada.
    $q = $query !== '' ? ('?' . ltrim($query, '?')) : '';
    return supabaseDbRequest($table . $q, [
        'method' => 'PATCH',
        'use_secret' => true,
        'headers' => ['Prefer: return=minimal'],
        'body' => [
            'is_deleted' => true,
            'deleted_at' => gmdate('c')
        ]
    ]);
}

/**
 * Obtiene la cuenta activa para asociar toda la persistencia.
 */
function supabaseCurrentAccountKey() {
    static $resolved = null;
    if ($resolved !== null) return $resolved;

    // 1) Sesion de Auth autenticada
    if (function_exists('authSessionTokenFromRequest') && function_exists('authValidateSession')) {
        $tok = authSessionTokenFromRequest();
        if ($tok !== '') {
            $val = authValidateSession($tok);
            if (!empty($val['ok']) && !empty($val['account_id'])) {
                $resolved = (string)$val['account_id'];
                return $resolved;
            }
        }
    }

    // 2) Parametro explicito de request o header
    $candidates = [
        $_POST['account_key'] ?? '',
        $_GET['account_key'] ?? '',
        $_SERVER['HTTP_X_ACCOUNT_KEY'] ?? '',
        $_SERVER['HTTP_X_L8_ACCOUNT'] ?? ''
    ];
    foreach ($candidates as $c) {
        $c = trim((string)$c);
        if ($c !== '' && preg_match('/^[a-zA-Z0-9_-]{3,64}$/', $c)) {
            $resolved = $c;
            return $resolved;
        }
    }

    // 3) Identidad determinista anónima por IP + Pepper (sobrevive recargas)
    $ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
    $pepper = function_exists('authPepper') ? authPepper() : 'l8_pepper_fixed';
    $resolved = 'anon_' . substr(hash_hmac('sha256', $ip, $pepper), 0, 16);
    return $resolved;
}

/**
 * Registra cada accion en l8_activity_log y espejo en Storage (inmutable, nunca se elimina).
 */
function supabaseLogActivity($action, $target = '', array $payload = [], $accountKey = null, $status = 'ok') {
    $cfg = supabaseConfig();
    if (empty($cfg['configured'])) return ['ok' => false, 'error' => 'Supabase no configurado'];

    $acct = $accountKey ?: supabaseCurrentAccountKey();
    $id = 'act_' . bin2hex(random_bytes(8)) . '_' . time();
    $ipHash = hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? '') . (function_exists('authPepper') ? authPepper() : ''));
    $ua = substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 200);

    $row = [
        'id' => $id,
        'account_key' => $acct,
        'action' => (string)$action,
        'target' => substr((string)$target, 0, 255),
        'payload' => $payload,
        'ip_hash' => $ipHash,
        'user_agent' => $ua,
        'status' => (string)$status,
        'created_at' => gmdate('c')
    ];

    // DB Postgres
    $dbRes = supabaseDbUpsert('l8_activity_log', [$row], 'id');

    // Storage mirror por cuenta
    $path = 'meta/activity/' . rawurlencode($acct) . '/' . date('Y-m') . '.jsonl';
    $line = json_encode($row, JSON_UNESCAPED_UNICODE) . "\n";
    $exist = supabaseStorageDownload($path);
    $all = (!empty($exist['ok']) && is_string($exist['data'])) ? ($exist['data'] . $line) : $line;
    @supabaseStorageUpload($path, $all, 'text/plain', false);

    return ['ok' => true, 'id' => $id, 'db' => $dbRes];
}

/**
 * Registra cada comando ejecutado en l8_command_history (inmutable, nunca se elimina).
 */
function supabaseLogCommand($rawCmd, $exitCode = 0, $outputSnippet = '', $durationMs = 0, array $meta = [], $accountKey = null) {
    $cfg = supabaseConfig();
    if (empty($cfg['configured'])) return ['ok' => false, 'error' => 'Supabase no configurado'];

    $acct = $accountKey ?: supabaseCurrentAccountKey();
    $id = 'cmd_' . bin2hex(random_bytes(8)) . '_' . time();
    $parts = explode(' ', trim((string)$rawCmd));
    $norm = strtolower($parts[0] ?? '');

    $snip = is_string($outputSnippet) ? $outputSnippet : json_encode($outputSnippet, JSON_UNESCAPED_UNICODE);
    if (strlen($snip) > 1200) {
        $snip = substr($snip, 0, 1200) . '… [truncado]';
    }

    $row = [
        'id' => $id,
        'account_key' => $acct,
        'session_id' => (string)($meta['session_id'] ?? 'default'),
        'raw_command' => (string)$rawCmd,
        'normalized_command' => $norm,
        'exit_code' => (int)$exitCode,
        'output_snippet' => $snip,
        'duration_ms' => (int)$durationMs,
        'metadata' => $meta,
        'created_at' => gmdate('c')
    ];

    // DB Postgres
    $dbRes = supabaseDbUpsert('l8_command_history', [$row], 'id');

    // Storage mirror por cuenta
    $path = 'meta/commands/' . rawurlencode($acct) . '/' . date('Y-m') . '.jsonl';
    $line = json_encode($row, JSON_UNESCAPED_UNICODE) . "\n";
    $exist = supabaseStorageDownload($path);
    $all = (!empty($exist['ok']) && is_string($exist['data'])) ? ($exist['data'] . $line) : $line;
    @supabaseStorageUpload($path, $all, 'text/plain', false);

    return ['ok' => true, 'id' => $id, 'db' => $dbRes];
}

/**
 * Guarda documentos (TipTap / LibreOffice) con historial de versiones en DB y Storage.
 */
function supabaseSaveDocumentRecord($docId, $title, $docType, $content, array $meta = [], $accountKey = null) {
    $cfg = supabaseConfig();
    if (empty($cfg['configured'])) return ['ok' => false, 'error' => 'Supabase no configurado'];

    $acct = $accountKey ?: supabaseCurrentAccountKey();
    $normDocId = preg_replace('/[^a-zA-Z0-9_-]/', '', (string)$docId) ?: 'main';
    $pk = $acct . '_' . $docType . '_' . $normDocId;

    // Buscar version actual
    $prev = supabaseDbSelect('l8_documents', 'id=eq.' . rawurlencode($pk) . '&select=version');
    $curVer = 1;
    if (!empty($prev['ok']) && is_array($prev['body']) && !empty($prev['body'][0]['version'])) {
        $curVer = (int)$prev['body'][0]['version'] + 1;
    }

    $now = gmdate('c');
    $docRow = [
        'id' => $pk,
        'account_key' => $acct,
        'title' => substr((string)$title, 0, 150) ?: 'Documento',
        'doc_type' => (string)$docType,
        'content' => is_string($content) ? $content : json_encode($content, JSON_UNESCAPED_UNICODE),
        'meta' => $meta,
        'version' => $curVer,
        'is_deleted' => false,
        'deleted_at' => null,
        'updated_at' => $now
    ];

    $dbDoc = supabaseDbUpsert('l8_documents', [$docRow], 'id');

    // Historial inmutable
    $histId = 'dochist_' . $pk . '_v' . $curVer . '_' . time();
    $histRow = [
        'id' => $histId,
        'document_id' => $pk,
        'account_key' => $acct,
        'version' => $curVer,
        'content' => $docRow['content'],
        'meta' => $meta,
        'created_at' => $now
    ];
    @supabaseDbUpsert('l8_documents_history', [$histRow], 'id');

    // Storage mirror
    $storagePath = 'docs/' . rawurlencode($acct) . '/' . $docType . '/' . $normDocId . '.json';
    @supabaseStorageUploadJson($storagePath, $docRow);

    supabaseLogActivity('DOC_SAVE', $docType . ':' . $normDocId, [
        'title' => $title,
        'version' => $curVer,
        'bytes' => strlen($docRow['content'])
    ], $acct);

    return ['ok' => true, 'id' => $pk, 'version' => $curVer, 'db' => $dbDoc];
}

/**
 * Carga un documento desde Supabase DB o Storage.
 */
function supabaseLoadDocumentRecord($docId, $docType = 'tiptap', $accountKey = null) {
    $acct = $accountKey ?: supabaseCurrentAccountKey();
    $normDocId = preg_replace('/[^a-zA-Z0-9_-]/', '', (string)$docId) ?: 'main';
    $pk = $acct . '_' . $docType . '_' . $normDocId;

    $db = supabaseDbSelect('l8_documents', 'id=eq.' . rawurlencode($pk) . '&is_deleted=eq.false&limit=1');
    if (!empty($db['ok']) && is_array($db['body']) && !empty($db['body'][0])) {
        return ['ok' => true, 'doc' => $db['body'][0], 'source' => 'db'];
    }

    $storagePath = 'docs/' . rawurlencode($acct) . '/' . $docType . '/' . $normDocId . '.json';
    $st = supabaseStorageDownloadJson($storagePath);
    if (!empty($st['ok']) && is_array($st['data'])) {
        return ['ok' => true, 'doc' => $st['data'], 'source' => 'storage'];
    }

    return ['ok' => false, 'error' => 'Documento no encontrado'];
}

/**
 * Soft delete: marca is_deleted = true para nunca perder datos fisicos.
 */
function supabaseSoftDeleteRecord($table, $id, $accountKey = null) {
    $acct = $accountKey ?: supabaseCurrentAccountKey();
    $res = supabaseDbRequest($table . '?id=eq.' . rawurlencode($id), [
        'method' => 'PATCH',
        'use_secret' => true,
        'headers' => ['Prefer: return=minimal'],
        'body' => [
            'is_deleted' => true,
            'deleted_at' => gmdate('c')
        ]
    ]);
    supabaseLogActivity('SOFT_DELETE', $table . ':' . $id, ['table' => $table, 'id' => $id], $acct);
    return $res;
}

/**
 * Guarda sesión persistente por cuenta (pestañas Tabby, feeds, último comando).
 */
function supabaseSaveAccountSessionState(array $state, $accountKey = null) {
    $acct = $accountKey ?: supabaseCurrentAccountKey();
    $pk = 'sess_' . $acct;
    $now = gmdate('c');

    $row = [
        'id' => $pk,
        'account_key' => $acct,
        'state' => $state,
        'is_deleted' => false,
        'updated_at' => $now
    ];

    $db = supabaseDbUpsert('l8_account_sessions', [$row], 'id');
    @supabaseStorageUploadJson('meta/sessions/' . rawurlencode($acct) . '.json', $row);
    return ['ok' => true, 'account_key' => $acct, 'db' => $db];
}

/**
 * Carga sesión persistente por cuenta.
 */
function supabaseLoadAccountSessionState($accountKey = null) {
    $acct = $accountKey ?: supabaseCurrentAccountKey();
    $pk = 'sess_' . $acct;

    $db = supabaseDbSelect('l8_account_sessions', 'id=eq.' . rawurlencode($pk) . '&is_deleted=eq.false&limit=1');
    if (!empty($db['ok']) && is_array($db['body']) && !empty($db['body'][0]['state'])) {
        return ['ok' => true, 'state' => $db['body'][0]['state'], 'source' => 'db'];
    }

    $st = supabaseStorageDownloadJson('meta/sessions/' . rawurlencode($acct) . '.json');
    if (!empty($st['ok']) && is_array($st['data']) && !empty($st['data']['state'])) {
        return ['ok' => true, 'state' => $st['data']['state'], 'source' => 'storage'];
    }

    return ['ok' => false, 'error' => 'Sin sesión previa'];
}

/**
 * Sincroniza repositorio clonado o guardado por cuenta.
 */
function supabaseSyncRepositoryRecord(array $repo, $accountKey = null) {
    $acct = $accountKey ?: supabaseCurrentAccountKey();
    $userRepo = (string)($repo['user_repo'] ?? $repo['id'] ?? '');
    if ($userRepo === '') return ['ok' => false, 'error' => 'user_repo vacio'];

    $id = 'repo_' . hash('sha256', $acct . ':' . strtolower($userRepo));
    $row = [
        'id' => $id,
        'account_key' => $acct,
        'user_repo' => $userRepo,
        'name' => (string)($repo['name'] ?? $userRepo),
        'branch' => (string)($repo['branch'] ?? 'main'),
        'remote_url' => (string)($repo['remote_url'] ?? ''),
        'license' => (string)($repo['license'] ?? 'None'),
        'stars' => (int)($repo['stars'] ?? 0),
        'is_private' => !empty($repo['is_private']),
        'cloned' => !empty($repo['cloned']),
        'meta' => $repo['meta'] ?? $repo,
        'is_deleted' => false,
        'deleted_at' => null,
        'updated_at' => gmdate('c')
    ];

    $db = supabaseDbUpsert('l8_repos', [$row], 'id');
    supabaseLogActivity('REPO_SYNC', $userRepo, ['cloned' => $row['cloned'], 'branch' => $row['branch']], $acct);
    return ['ok' => true, 'id' => $id, 'db' => $db];
}

/**
 * Sincroniza archivo creado o subido por cuenta.
 */
function supabaseSyncFileRecord(array $file, $accountKey = null) {
    $acct = $accountKey ?: supabaseCurrentAccountKey();
    $fileId = (string)($file['id'] ?? '');
    if ($fileId === '') return ['ok' => false, 'error' => 'id de archivo vacio'];

    $row = [
        'id' => $fileId,
        'account_key' => $acct,
        'filename' => (string)($file['filename'] ?? $fileId),
        'mime_type' => (string)($file['mime_type'] ?? 'application/octet-stream'),
        'size_bytes' => (int)($file['size_bytes'] ?? $file['size'] ?? 0),
        'hash' => (string)($file['hash'] ?? ''),
        'storage_path' => (string)($file['storage_path'] ?? ''),
        'supabase_object' => (string)($file['supabase_object'] ?? ('files/' . $fileId)),
        'meta' => $file['meta'] ?? $file,
        'is_deleted' => false,
        'deleted_at' => null,
        'upload_date' => $file['upload_date'] ?? gmdate('c')
    ];

    $db = supabaseDbUpsert('l8_files', [$row], 'id');
    supabaseLogActivity('FILE_SYNC', $row['filename'], ['size' => $row['size_bytes'], 'mime' => $row['mime_type']], $acct);
    return ['ok' => true, 'id' => $fileId, 'db' => $db];
}

/**
 * Sincroniza transferencias y códigos de Gateway.
 */
function supabaseSyncGatewayTransfer($code, array $fileInfo, $accountKey = null) {
    $acct = $accountKey ?: supabaseCurrentAccountKey();
    $code = strtoupper(trim((string)$code));
    if ($code === '') return ['ok' => false, 'error' => 'Codigo gateway vacio'];

    $id = 'gw_' . hash('sha256', $code);
    $row = [
        'id' => $id,
        'account_key' => $acct,
        'code' => $code,
        'filename' => (string)($fileInfo['filename'] ?? ''),
        'mime_type' => (string)($fileInfo['mime_type'] ?? ''),
        'size_bytes' => (int)($fileInfo['size_bytes'] ?? 0),
        'storage_path' => (string)($fileInfo['storage_path'] ?? ''),
        'downloads_count' => (int)($fileInfo['downloads_count'] ?? 0),
        'meta' => $fileInfo,
        'is_deleted' => false,
        'deleted_at' => null,
        'updated_at' => gmdate('c')
    ];

    $db = supabaseDbUpsert('l8_gateway_transfers', [$row], 'id');
    supabaseLogActivity('GATEWAY_SYNC', $code, ['filename' => $row['filename'], 'size' => $row['size_bytes']], $acct);
    return ['ok' => true, 'id' => $id, 'db' => $db];
}

/**
 * Sincroniza códigos únicos OpenCryptG.
 */
function supabaseSyncOpencryptCode($code, array $meta = [], $accountKey = null) {
    $acct = $accountKey ?: supabaseCurrentAccountKey();
    $code = strtoupper(trim((string)$code));
    if ($code === '') return ['ok' => false, 'error' => 'Codigo OpenCrypt vacio'];

    $id = 'ocg_' . hash('sha256', $code);
    $row = [
        'id' => $id,
        'account_key' => $acct,
        'code' => $code,
        'meta' => $meta,
        'is_deleted' => false,
        'created_at' => gmdate('c')
    ];

    $db = supabaseDbUpsert('l8_opencrypt_ledger', [$row], 'id');
    supabaseLogActivity('OPENCRYPT_CODE_SYNC', $code, $meta, $acct);
    return ['ok' => true, 'id' => $id, 'db' => $db];
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

    // Tokens: merge inteligente (local ↔ Storage ↔ Postgres ledger). No sobrescribir a ciegas.
    if (function_exists('tokensEnsureHydrated')) {
        @tokensEnsureHydrated();
        $results['tokens_usage'] = ['ok' => true, 'merged' => true, 'source' => 'tokensEnsureHydrated'];
    } else {
        $results['tokens_usage'] = supabaseHydrateMetaFile(
            rtrim($storageDir, '/') . '/tokens/usage.json',
            'tokens_usage.json',
            false
        );
    }

    return ['ok' => true, 'results' => $results];
}

function supabaseHealthCheck() {
    $cfg = supabaseConfig();
    if (!$cfg['configured']) {
        return [
            'type' => 'SUPABASE_STATUS',
            'ok' => false,
            'connected' => false,
            'storage_ready' => false,
            'db_ready' => false
        ];
    }

    $res = supabaseRequest('auth/v1/health', ['use_secret' => false]);
    $bucket = supabaseEnsureBucket();
    $connected = !empty($res['ok']);
    $dbProbe = supabaseDbSelect('l8_repos', 'select=id&limit=1');
    $dbReady = !empty($dbProbe['ok']);
    return [
        'type' => 'SUPABASE_STATUS',
        'ok' => $connected,
        'connected' => $connected,
        'storage_ready' => !empty($bucket['ok']),
        'db_ready' => $dbReady
    ];
}
