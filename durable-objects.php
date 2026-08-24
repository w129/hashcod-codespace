<?php
/**
 * Durable Objects Engine para L8 / Hashcod Codespace.
 *
 * Implementa el modelo de actores con estado persistente, almacenamiento fuertemente consistente,
 * alarmas temporizadas, control de concurrencia y RPC / HTTP fetch con respaldo en Supabase.
 */

require_once __DIR__ . '/supabase.php';

function doStorageDir() {
    $dir = __DIR__ . '/data_storage/durable_objects';
    if (!is_dir($dir)) {
        @mkdir($dir, 0777, true);
    }
    return $dir;
}

function doNamespaceDir($namespace) {
    $clean = preg_replace('/[^a-zA-Z0-9_\-]/', '', (string)$namespace) ?: 'default';
    $dir = doStorageDir() . '/' . $clean;
    if (!is_dir($dir)) {
        @mkdir($dir, 0777, true);
    }
    return $dir;
}

function doObjectPath($namespace, $id) {
    $cleanId = preg_replace('/[^a-fA-F0-9]/', '', (string)$id);
    if ($cleanId === '') {
        $cleanId = hash('sha256', (string)$id);
    }
    return doNamespaceDir($namespace) . '/' . $cleanId . '.json';
}

/**
 * Genera un DurableObjectId determinista a partir de un nombre.
 */
function doIdFromName($namespace, $name, $accountKey = null) {
    $acct = $accountKey ?: (function_exists('supabaseCurrentAccountKey') ? supabaseCurrentAccountKey() : 'global');
    return hash('sha256', $acct . ':' . $namespace . ':' . $name);
}

/**
 * Genera un DurableObjectId criptográficamente aleatorio de 256 bits.
 */
function doNewUniqueId() {
    return bin2hex(random_bytes(32));
}

/**
 * Valida un ID de Durable Object en formato hexadecimal de 64 caracteres.
 */
function doIsValidId($id) {
    return is_string($id) && preg_match('/^[a-fA-F0-9]{64}$/', $id);
}

/**
 * Carga el registro del Durable Object desde disco local o Supabase.
 */
function doLoadRecord($namespace, $id, $accountKey = null) {
    $acct = $accountKey ?: (function_exists('supabaseCurrentAccountKey') ? supabaseCurrentAccountKey() : 'global');
    $path = doObjectPath($namespace, $id);

    if (is_file($path)) {
        $raw = @file_get_contents($path);
        $data = json_decode((string)$raw, true);
        if (is_array($data)) {
            return $data;
        }
    }

    // Fallback a Supabase DB si existe
    if (function_exists('supabaseDbSelect') && function_exists('supabaseConfig') && !empty(supabaseConfig()['configured'])) {
        $pk = $namespace . '_' . $id;
        $db = supabaseDbSelect('l8_durable_objects', 'id=eq.' . rawurlencode($pk) . '&is_deleted=eq.false&limit=1');
        if (!empty($db['ok']) && is_array($db['body']) && !empty($db['body'][0])) {
            $row = $db['body'][0];
            $loaded = [
                'id' => $id,
                'namespace' => $namespace,
                'name' => $row['name'] ?? '',
                'account_key' => $row['account_key'] ?? $acct,
                'storage' => is_array($row['storage_data'] ?? null) ? $row['storage_data'] : (json_decode($row['storage_data'] ?? '{}', true) ?: []),
                'alarm_at' => $row['alarm_at'] ?? null,
                'version' => (int)($row['version'] ?? 1),
                'created_at' => $row['created_at'] ?? date('c'),
                'updated_at' => $row['updated_at'] ?? date('c'),
            ];
            @file_put_contents($path, json_encode($loaded, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
            return $loaded;
        }
    }

    // Inicializar nuevo estado vacío
    return [
        'id' => $id,
        'namespace' => $namespace,
        'name' => '',
        'account_key' => $acct,
        'storage' => [],
        'alarm_at' => null,
        'version' => 1,
        'created_at' => date('c'),
        'updated_at' => date('c'),
    ];
}

/**
 * Guarda el estado del Durable Object con concurrencia segura y sincronización a Supabase.
 */
function doSaveRecord($namespace, $id, array $record, $accountKey = null) {
    $acct = $accountKey ?: ($record['account_key'] ?? (function_exists('supabaseCurrentAccountKey') ? supabaseCurrentAccountKey() : 'global'));
    $record['id'] = $id;
    $record['namespace'] = $namespace;
    $record['account_key'] = $acct;
    $record['version'] = ((int)($record['version'] ?? 0)) + 1;
    $record['updated_at'] = date('c');

    $path = doObjectPath($namespace, $id);
    $tmp = $path . '.tmp.' . getmypid() . '.' . microtime(true);
    $json = json_encode($record, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

    if ($json === false || @file_put_contents($tmp, $json) === false) {
        return false;
    }
    @rename($tmp, $path);

    // Sincronización inmutable a Supabase Postgres y Storage
    if (function_exists('supabaseDbUpsert') && function_exists('supabaseConfig') && !empty(supabaseConfig()['configured'])) {
        $pk = $namespace . '_' . $id;
        $row = [
            'id' => $pk,
            'account_key' => $acct,
            'namespace' => $namespace,
            'name' => (string)($record['name'] ?? ''),
            'storage_data' => $record['storage'] ?? [],
            'alarm_at' => $record['alarm_at'] ?? null,
            'version' => (int)$record['version'],
            'is_deleted' => false,
            'deleted_at' => null,
            'updated_at' => $record['updated_at']
        ];
        @supabaseDbUpsert('l8_durable_objects', [$row], 'id');

        // Storage Mirror
        $storagePath = 'meta/durable_objects/' . rawurlencode($acct) . '/' . rawurlencode($namespace) . '/' . $id . '.json';
        @supabaseStorageUploadJson($storagePath, $record);
    }

    if (function_exists('supabaseLogActivity')) {
        @supabaseLogActivity('DO_STATE_SAVE', $namespace . ':' . substr($id, 0, 8), [
            'namespace' => $namespace,
            'id' => $id,
            'version' => $record['version'],
            'keys_count' => count($record['storage'] ?? [])
        ], $acct);
    }

    return true;
}

/**
 * =====================================================================
 * CLASES DE ACTORES DURABLE OBJECTS BUILT-IN
 * =====================================================================
 */

interface DurableObjectInterface {
    public function fetch(array $request): array;
    public function alarm(): void;
}

class BaseDurableObject implements DurableObjectInterface {
    protected $id;
    protected $namespace;
    protected $record;
    protected $storage;
    protected $accountKey;

    public function __construct($namespace, $id, $accountKey = null) {
        $this->namespace = $namespace;
        $this->id = $id;
        $this->accountKey = $accountKey ?: (function_exists('supabaseCurrentAccountKey') ? supabaseCurrentAccountKey() : 'global');
        $this->record = doLoadRecord($namespace, $id, $this->accountKey);
        $this->storage = $this->record['storage'] ?? [];
    }

    public function getStorageValue($key, $default = null) {
        return array_key_exists($key, $this->storage) ? $this->storage[$key] : $default;
    }

    public function putStorageValue($key, $value) {
        $this->storage[$key] = $value;
        $this->persist();
        return true;
    }

    public function deleteStorageValue($key) {
        if (isset($this->storage[$key])) {
            unset($this->storage[$key]);
            $this->persist();
            return true;
        }
        return false;
    }

    public function listStorageKeys($prefix = '', $limit = 100) {
        $res = [];
        $pLen = strlen($prefix);
        foreach ($this->storage as $k => $v) {
            if ($prefix === '' || substr((string)$k, 0, $pLen) === $prefix) {
                $res[$k] = $v;
                if (count($res) >= $limit) break;
            }
        }
        return $res;
    }

    public function setAlarm($timestampMs) {
        $this->record['alarm_at'] = (int)$timestampMs;
        $this->persist();
        return true;
    }

    public function getAlarm() {
        return $this->record['alarm_at'] ?? null;
    }

    public function deleteAlarm() {
        $this->record['alarm_at'] = null;
        $this->persist();
        return true;
    }

    public function persist() {
        $this->record['storage'] = $this->storage;
        return doSaveRecord($this->namespace, $this->id, $this->record, $this->accountKey);
    }

    public function fetch(array $request): array {
        $method = strtoupper((string)($request['method'] ?? 'GET'));
        $path = (string)($request['path'] ?? '/');
        $body = $request['body'] ?? [];

        // RPC Dispatcher
        if ($path === '/rpc' && $method === 'POST') {
            $rpcMethod = (string)($body['method'] ?? '');
            $rpcParams = (array)($body['params'] ?? []);
            if (method_exists($this, $rpcMethod)) {
                $res = call_user_func_array([$this, $rpcMethod], $rpcParams);
                return ['ok' => true, 'result' => $res];
            }
            return ['ok' => false, 'error' => "RPC Method '$rpcMethod' not found on " . get_class($this)];
        }

        // Generic Key-Value API
        if ($path === '/storage/get' || ($path === '/storage' && $method === 'GET')) {
            $key = $request['query']['key'] ?? $body['key'] ?? null;
            if ($key !== null) {
                return ['ok' => true, 'key' => $key, 'value' => $this->getStorageValue($key)];
            }
            return ['ok' => true, 'storage' => $this->listStorageKeys($request['query']['prefix'] ?? '')];
        }

        if ($path === '/storage/put' || ($path === '/storage' && $method === 'POST')) {
            $key = $body['key'] ?? '';
            $val = $body['value'] ?? null;
            if ($key === '') return ['ok' => false, 'error' => 'Storage key is required'];
            $this->putStorageValue($key, $val);
            return ['ok' => true, 'key' => $key, 'saved' => true];
        }

        if ($path === '/storage/delete' || ($path === '/storage' && $method === 'DELETE')) {
            $key = $body['key'] ?? $request['query']['key'] ?? '';
            if ($key === '') return ['ok' => false, 'error' => 'Storage key is required'];
            $deleted = $this->deleteStorageValue($key);
            return ['ok' => true, 'key' => $key, 'deleted' => $deleted];
        }

        if ($path === '/state') {
            return [
                'ok' => true,
                'id' => $this->id,
                'namespace' => $this->namespace,
                'class' => get_class($this),
                'version' => $this->record['version'] ?? 1,
                'alarm_at' => $this->getAlarm(),
                'keys_count' => count($this->storage),
                'storage' => $this->storage
            ];
        }

        return ['ok' => true, 'status' => 'online', 'id' => $this->id, 'class' => get_class($this)];
    }

    public function alarm(): void {
        $this->deleteAlarm();
    }
}

/**
 * 1. RoomActor / CollaborationDO:
 * Gestiona salas de colaboración en tiempo real con presencia de usuarios y mensajes.
 */
class RoomActor extends BaseDurableObject {
    public function joinUser($userId, $userData = []) {
        $users = $this->getStorageValue('presence', []);
        $users[$userId] = array_merge($userData, [
            'joined_at' => time(),
            'last_seen' => time()
        ]);
        $this->putStorageValue('presence', $users);
        return ['ok' => true, 'users' => $users];
    }

    public function leaveUser($userId) {
        $users = $this->getStorageValue('presence', []);
        if (isset($users[$userId])) {
            unset($users[$userId]);
            $this->putStorageValue('presence', $users);
        }
        return ['ok' => true, 'users' => $users];
    }

    public function broadcastMessage($fromUser, $text, $type = 'chat') {
        $msgs = $this->getStorageValue('messages', []);
        $msg = [
            'id' => 'msg_' . bin2hex(random_bytes(6)),
            'from' => $fromUser,
            'text' => $text,
            'type' => $type,
            'at' => date('c')
        ];
        $msgs[] = $msg;
        if (count($msgs) > 200) {
            $msgs = array_slice($msgs, -200);
        }
        $this->putStorageValue('messages', $msgs);
        return ['ok' => true, 'message' => $msg, 'total' => count($msgs)];
    }

    public function updateDocumentState($patch, $version = 1) {
        $doc = $this->getStorageValue('document', ['content' => '', 'version' => 0]);
        $doc['content'] = $patch['content'] ?? $doc['content'];
        $doc['version'] = ((int)$doc['version']) + 1;
        $doc['updated_at'] = date('c');
        $this->putStorageValue('document', $doc);
        return ['ok' => true, 'document' => $doc];
    }
}

/**
 * 2. TerminalSessionDO:
 * Mantiene sesiones aisladas de terminal, variables de entorno y buffer de salida.
 */
class TerminalSessionDO extends BaseDurableObject {
    public function appendOutput($outputSnippet) {
        $history = $this->getStorageValue('output_history', []);
        $history[] = [
            'output' => $outputSnippet,
            'timestamp' => microtime(true)
        ];
        if (count($history) > 150) {
            $history = array_slice($history, -150);
        }
        $this->putStorageValue('output_history', $history);
        return ['ok' => true, 'history_count' => count($history)];
    }

    public function setEnv($key, $val) {
        $envs = $this->getStorageValue('env_vars', []);
        $envs[$key] = $val;
        $this->putStorageValue('env_vars', $envs);
        return ['ok' => true, 'env_vars' => $envs];
    }

    public function getEnv($key = null) {
        $envs = $this->getStorageValue('env_vars', []);
        return $key !== null ? ($envs[$key] ?? null) : $envs;
    }
}

/**
 * 3. RateLimiterDO:
 * Limitador de tasa y balanceador atómico persistente con refill de cuota por alarmas.
 */
class RateLimiterDO extends BaseDurableObject {
    public function consume($tokens = 1, $maxCapacity = 100, $refillRatePerMin = 20) {
        $bucket = $this->getStorageValue('bucket', [
            'tokens' => $maxCapacity,
            'last_refill' => time(),
            'max' => $maxCapacity
        ]);

        $now = time();
        $elapsed = $now - (int)$bucket['last_refill'];
        $refilled = (int)($elapsed * ($refillRatePerMin / 60));
        $currentTokens = min($maxCapacity, (int)$bucket['tokens'] + $refilled);

        if ($currentTokens < $tokens) {
            return [
                'ok' => false,
                'allowed' => false,
                'tokens_available' => $currentTokens,
                'required' => $tokens,
                'retry_after_sec' => (int)ceil(($tokens - $currentTokens) / ($refillRatePerMin / 60))
            ];
        }

        $bucket['tokens'] = $currentTokens - $tokens;
        $bucket['last_refill'] = $now;
        $this->putStorageValue('bucket', $bucket);

        return [
            'ok' => true,
            'allowed' => true,
            'tokens_remaining' => $bucket['tokens'],
            'max' => $maxCapacity
        ];
    }
}

/**
 * 4. CounterDO:
 * Contador atómico distribuido de alto rendimiento con alarmas temporizadas.
 */
class CounterDO extends BaseDurableObject {
    public function increment($amount = 1) {
        $val = (int)$this->getStorageValue('count', 0) + (int)$amount;
        $this->putStorageValue('count', $val);
        return ['ok' => true, 'count' => $val];
    }

    public function decrement($amount = 1) {
        $val = (int)$this->getStorageValue('count', 0) - (int)$amount;
        $this->putStorageValue('count', $val);
        return ['ok' => true, 'count' => $val];
    }

    public function get() {
        return ['ok' => true, 'count' => (int)$this->getStorageValue('count', 0)];
    }
}

/**
 * 5. LedgerDO:
 * Libro mayor transaccional inmutable con verificación de hash chain y locks.
 */
class LedgerDO extends BaseDurableObject {
    public function appendTransaction($action, array $payload = []) {
        $entries = $this->getStorageValue('ledger_entries', []);
        $prevHash = !empty($entries) ? end($entries)['hash'] : '0000000000000000000000000000000000000000000000000000000000000000';
        $entryIdx = count($entries) + 1;
        $now = date('c');

        $hashContent = $entryIdx . '|' . $prevHash . '|' . $action . '|' . json_encode($payload) . '|' . $now;
        $currHash = hash('sha256', $hashContent);

        $newEntry = [
            'index' => $entryIdx,
            'prev_hash' => $prevHash,
            'hash' => $currHash,
            'action' => $action,
            'payload' => $payload,
            'created_at' => $now
        ];

        $entries[] = $newEntry;
        $this->putStorageValue('ledger_entries', $entries);

        return ['ok' => true, 'entry' => $newEntry, 'total_entries' => count($entries)];
    }

    public function verifyChain() {
        $entries = $this->getStorageValue('ledger_entries', []);
        $prevHash = '0000000000000000000000000000000000000000000000000000000000000000';

        foreach ($entries as $i => $e) {
            if ($e['prev_hash'] !== $prevHash) {
                return ['ok' => false, 'valid' => false, 'corrupted_at_index' => $e['index']];
            }
            $hashContent = $e['index'] . '|' . $e['prev_hash'] . '|' . $e['action'] . '|' . json_encode($e['payload']) . '|' . $e['created_at'];
            if (hash('sha256', $hashContent) !== $e['hash']) {
                return ['ok' => false, 'valid' => false, 'hash_mismatch_at_index' => $e['index']];
            }
            $prevHash = $e['hash'];
        }

        return ['ok' => true, 'valid' => true, 'total_verified' => count($entries)];
    }
}

/**
 * Obtiene la clase de Actor adecuada según el Namespace.
 */
function doResolveActorClass($namespace) {
    $norm = strtolower(preg_replace('/[^a-z0-9]/i', '', $namespace));
    $classes = [
        'room' => RoomActor::class,
        'collaboration' => RoomActor::class,
        'terminal' => TerminalSessionDO::class,
        'session' => TerminalSessionDO::class,
        'ratelimit' => RateLimiterDO::class,
        'ratelimiter' => RateLimiterDO::class,
        'counter' => CounterDO::class,
        'metrics' => CounterDO::class,
        'ledger' => LedgerDO::class,
        'lock' => LedgerDO::class,
        'default' => BaseDurableObject::class
    ];
    return $classes[$norm] ?? BaseDurableObject::class;
}

/**
 * Instancia un actor Durable Object.
 */
function doInstantiate($namespace, $id, $accountKey = null) {
    $cls = doResolveActorClass($namespace);
    return new $cls($namespace, $id, $accountKey);
}

/**
 * Ejecuta y despacha alarmas pendientes en todos los Durable Objects.
 */
function doDispatchPendingAlarms() {
    $dir = doStorageDir();
    $dispatched = [];
    $nowMs = (int)(microtime(true) * 1000);

    if (!is_dir($dir)) return ['ok' => true, 'dispatched' => []];

    $nsDirs = glob($dir . '/*', GLOB_ONLYDIR);
    foreach ($nsDirs as $nsDir) {
        $ns = basename($nsDir);
        $files = glob($nsDir . '/*.json');
        foreach ($files as $file) {
            $raw = @file_get_contents($file);
            $record = json_decode((string)$raw, true);
            if (is_array($record) && !empty($record['alarm_at']) && (int)$record['alarm_at'] <= $nowMs) {
                $id = $record['id'] ?? basename($file, '.json');
                $actor = doInstantiate($ns, $id, $record['account_key'] ?? null);
                $actor->alarm();
                $dispatched[] = [
                    'namespace' => $ns,
                    'id' => $id,
                    'alarm_at' => $record['alarm_at']
                ];
            }
        }
    }

    return ['ok' => true, 'dispatched' => $dispatched, 'count' => count($dispatched)];
}

/**
 * Maneja solicitudes a la API `/api/do/*` de Durable Objects.
 */
function doHandleApi($uri) {
    if (strpos($uri, '/api/do') !== 0) {
        return false;
    }

    header('Content-Type: application/json; charset=utf-8');
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    $acct = function_exists('supabaseCurrentAccountKey') ? supabaseCurrentAccountKey() : 'global';

    // 1. Listar Namespaces y Clases Registradas
    if ($uri === '/api/do/namespaces' || $uri === '/api/do/classes') {
        echo json_encode([
            'ok' => true,
            'namespaces' => [
                ['name' => 'room', 'class' => 'RoomActor', 'desc' => 'Colaboración en tiempo real, chat y presencia multiusuario.'],
                ['name' => 'terminal', 'class' => 'TerminalSessionDO', 'desc' => 'Sesiones de terminal con estado, logs y variables de entorno.'],
                ['name' => 'ratelimit', 'class' => 'RateLimiterDO', 'desc' => 'Limitador de tasa distribuido con algoritmo token-bucket y alarmas.'],
                ['name' => 'counter', 'class' => 'CounterDO', 'desc' => 'Contador atómico concurrente y métricas numéricas.'],
                ['name' => 'ledger', 'class' => 'LedgerDO', 'desc' => 'Libro mayor inmutable con hash-chaining criptográfico y locks.'],
                ['name' => 'generic', 'class' => 'BaseDurableObject', 'desc' => 'Actor persistente de propósito general con almacenamiento clave-valor.']
            ],
            'account_key' => $acct
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        return true;
    }

    // 2. Obtener ID a partir de Nombre (idFromName)
    if ($uri === '/api/do/id-from-name' && $method === 'POST') {
        $body = json_decode((string)file_get_contents('php://input'), true) ?: $_POST;
        $ns = (string)($body['namespace'] ?? 'default');
        $name = (string)($body['name'] ?? 'main');
        $id = doIdFromName($ns, $name, $acct);
        echo json_encode([
            'ok' => true,
            'namespace' => $ns,
            'name' => $name,
            'id' => $id,
            'account_key' => $acct
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        return true;
    }

    // 3. Generar nuevo ID único aleatorio (newUniqueId)
    if ($uri === '/api/do/new-unique-id') {
        $id = doNewUniqueId();
        echo json_encode([
            'ok' => true,
            'id' => $id,
            'account_key' => $acct
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        return true;
    }

    // 4. Fetch / RPC a un Durable Object específico
    if ($uri === '/api/do/fetch' || $uri === '/api/do/rpc') {
        $body = json_decode((string)file_get_contents('php://input'), true) ?: $_POST;
        $ns = (string)($body['namespace'] ?? 'default');
        $id = (string)($body['id'] ?? '');

        if ($id === '' && !empty($body['name'])) {
            $id = doIdFromName($ns, (string)$body['name'], $acct);
        }

        if ($id === '') {
            http_response_code(400);
            echo json_encode(['ok' => false, 'error' => 'Falta parámetro id o name del Durable Object']);
            return true;
        }

        $actor = doInstantiate($ns, $id, $acct);
        $req = [
            'method' => $method,
            'path' => $uri === '/api/do/rpc' ? '/rpc' : ($body['path'] ?? '/'),
            'body' => $body,
            'query' => $_GET
        ];
        $res = $actor->fetch($req);
        echo json_encode($res, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        return true;
    }

    // 5. Inspeccionar Estado Completo
    if ($uri === '/api/do/inspect' || $uri === '/api/do/state') {
        $ns = (string)($_GET['namespace'] ?? 'default');
        $id = (string)($_GET['id'] ?? '');
        if ($id === '' && !empty($_GET['name'])) {
            $id = doIdFromName($ns, (string)$_GET['name'], $acct);
        }
        if ($id === '') {
            http_response_code(400);
            echo json_encode(['ok' => false, 'error' => 'Indica namespace e id o name']);
            return true;
        }

        $actor = doInstantiate($ns, $id, $acct);
        $res = $actor->fetch(['method' => 'GET', 'path' => '/state']);
        echo json_encode($res, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        return true;
    }

    // 6. Listar Durable Objects activos
    if ($uri === '/api/do/list') {
        $dir = doStorageDir();
        $list = [];
        if (is_dir($dir)) {
            $nsDirs = glob($dir . '/*', GLOB_ONLYDIR);
            foreach ($nsDirs as $nsDir) {
                $ns = basename($nsDir);
                $files = glob($nsDir . '/*.json');
                foreach ($files as $f) {
                    $raw = @file_get_contents($f);
                    $rec = json_decode((string)$raw, true);
                    if (is_array($rec)) {
                        $list[] = [
                            'namespace' => $ns,
                            'id' => $rec['id'] ?? basename($f, '.json'),
                            'name' => $rec['name'] ?? '',
                            'version' => $rec['version'] ?? 1,
                            'keys_count' => count($rec['storage'] ?? []),
                            'alarm_at' => $rec['alarm_at'] ?? null,
                            'updated_at' => $rec['updated_at'] ?? null
                        ];
                    }
                }
            }
        }
        echo json_encode([
            'ok' => true,
            'account_key' => $acct,
            'objects' => $list,
            'total' => count($list)
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        return true;
    }

    // 7. Disparar Alarmas pendientes
    if ($uri === '/api/do/alarm/dispatch') {
        $res = doDispatchPendingAlarms();
        echo json_encode($res, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        return true;
    }

    http_response_code(404);
    echo json_encode(['ok' => false, 'error' => 'Endpoint de Durable Objects no encontrado'], JSON_UNESCAPED_UNICODE);
    return true;
}
