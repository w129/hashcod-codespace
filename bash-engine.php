<?php
/**
 * Motor de Bash Engine para L8 / Hashcod Codespace.
 *
 * Conecta el frontend interactivo de la herramienta con el ejecutor POSIX / Bash 4.3,
 * gestiona sesiones de shell, variables de entorno, directorios de trabajo y streams.
 * Centraliza la carpeta de guardado y conexión con la API y endpoints dinámicos.
 * Integra el motor Dual-Catalyst 4-ENV en Python y el servicio Django.
 */

require_once __DIR__ . '/supabase.php';
require_once __DIR__ . '/openclaw-bridge.php';
require_once __DIR__ . '/admin-device.php';
require_once __DIR__ . '/execution-security.php';

function bashDataStorageDir() {
    $dir = __DIR__ . '/data_storage';
    if (!is_dir($dir)) {
        @mkdir($dir, 0777, true);
    }
    return $dir;
}

function bashWorkspaceConfigFile() {
    return bashDataStorageDir() . '/workspace_config.json';
}

function bashGetWorkspaceConfig() {
    $file = bashWorkspaceConfigFile();
    $defaultPath = str_replace('\\', '/', __DIR__ . '/workspace');
    $default = [
        'workspace_path' => $defaultPath,
        'display_path' => '~/workspace',
        'api_url' => '/api/bash/workspace',
        'connected_at' => date('c'),
        'status' => 'connected',
        'is_central' => true,
        'auto_sync' => true,
        'storage_mode' => 'centralized_api'
    ];

    if (is_file($file)) {
        $data = json_decode((string)file_get_contents($file), true);
        if (is_array($data)) {
            return array_merge($default, $data);
        }
    }
    return $default;
}

function bashSaveWorkspaceConfig(array $cfg) {
    $current = bashGetWorkspaceConfig();
    $merged = array_merge($current, $cfg, ['updated_at' => date('c')]);
    @file_put_contents(bashWorkspaceConfigFile(), json_encode($merged, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
    return $merged;
}

function bashWorkspaceDir() {
    $cfg = bashGetWorkspaceConfig();
    $ws = !empty($cfg['workspace_path']) ? $cfg['workspace_path'] : (__DIR__ . '/workspace');
    $ws = str_replace('\\', '/', $ws);
    if (!is_dir($ws)) {
        @mkdir($ws, 0777, true);
    }
    return $ws;
}

function bashSessionsDir() {
    $dir = bashDataStorageDir() . '/bash_sessions';
    if (!is_dir($dir)) {
        @mkdir($dir, 0777, true);
    }
    return $dir;
}

/**
 * Ejecuta comandos en el motor Python Catalyst
 */
/**
 * Asegura el registro instantáneo y directo en los logs de Catalyst
 */
function bashLogCatalystEntry($channel, $trigger, $extra = []) {
    $isMacho = strpos($channel, 'a') !== false;
    $logFile = __DIR__ . '/data_storage/catalyst_logs/' . ($isMacho ? 'catalyst_macho.log' : 'catalyst_hembra.log');
    $logDir = dirname($logFile);
    if (!is_dir($logDir)) {
        @mkdir($logDir, 0777, true);
    }

    $now = gmdate('Y-m-d H:i:s') . '.' . sprintf('%03d', (int)((microtime(true) - floor(microtime(true))) * 1000)) . ' UTC';
    $side = $isMacho ? 'MACHO' : 'HEMBRA';
    $flow = $isMacho ? 'ENV_1 -> ENV_3' : 'ENV_2 <-> ENV_4';
    $mode = $isMacho ? '1-WAY TRANSFER' : '2-WAY DUPLEX';
    $packet = substr(bin2hex(random_bytes(8)), 0, 16);
    $cycle = time() % 10000;

    $meta = array_merge([
        'key_1' => 'KEY-' . ($isMacho ? 'M1' : 'H2') . '-' . strtoupper(bin2hex(random_bytes(16))),
        'key_3' => 'KEY-' . ($isMacho ? 'M3' : 'H4') . '-' . strtoupper(bin2hex(random_bytes(16))),
        'packet' => $packet,
        'cycle' => $cycle
    ], $extra);

    $line = "[$now] [$side] [$mode] $flow | Trigger: $trigger | " . json_encode($meta, JSON_UNESCAPED_SLASHES) . "
";
    @file_put_contents($logFile, $line, FILE_APPEND | LOCK_EX);
    
    // Actualizar catalyst_state.json
    $stateFile = __DIR__ . '/data_storage/catalyst_state.json';
    if (is_file($stateFile)) {
        $state = json_decode(@file_get_contents($stateFile), true) ?: [];
        $state['updated_at'] = date('c');
        $state['last_operation'] = "$side Triggered ($channel) | Packet: $packet";
        @file_put_contents($stateFile, json_encode($state, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
    }

    return ['packet' => $packet, 'cycle' => $cycle, 'time' => $now];
}

function bashRunPythonCatalyst(array $args = []) {
    $pyScript = __DIR__ . '/engines/api-engine/catalyst_engine.py';
    if (!is_file($pyScript)) {
        return ['ok' => false, 'error' => 'catalyst_engine.py no encontrado'];
    }

    $escapedArgs = array_map('escapeshellarg', $args);
    $cmd = 'python ' . escapeshellarg($pyScript) . ' ' . implode(' ', $escapedArgs);
    $output = @shell_exec($cmd . ' 2>&1');
    
    if ($output) {
        $json = json_decode(trim($output), true);
        if (is_array($json)) {
            return $json;
        }
    }
    return ['ok' => true, 'raw' => $output];
}

/**
 * Escanea archivos en la carpeta centralizada
 */
function bashScanWorkspaceFiles($dir = null, $maxDepth = 2, $currentDepth = 0) {
    $dir = $dir ?: bashWorkspaceDir();
    if (!is_dir($dir)) return [];
    
    $results = [];
    $items = @scandir($dir);
    if (!$items) return [];

    foreach ($items as $item) {
        if ($item === '.' || $item === '..') continue;
        $fullPath = str_replace('\\', '/', $dir . '/' . $item);
        $isDir = is_dir($fullPath);
        $entry = [
            'name' => $item,
            'path' => $fullPath,
            'relative_path' => ltrim(str_replace(bashWorkspaceDir(), '', $fullPath), '/'),
            'is_dir' => $isDir,
            'size' => $isDir ? 0 : (@filesize($fullPath) ?: 0),
            'modified' => @filemtime($fullPath) ? date('c', @filemtime($fullPath)) : null
        ];

        if ($isDir && $currentDepth < $maxDepth) {
            $entry['children'] = bashScanWorkspaceFiles($fullPath, $maxDepth, $currentDepth + 1);
        }
        $results[] = $entry;
    }
    return $results;
}

/**
 * Detecta el binario de Bash disponible en el sistema.
 */
function bashDetectExecutable() {
    static $detected = null;
    if ($detected !== null) return $detected;

    // 1. Git Bash en Windows (Laragon / Program Files)
    $candidates = [
        'D:\\laragon\\bin\\git\\bin\\bash.exe',
        'C:\\Program Files\\Git\\bin\\bash.exe',
        'C:\\Program Files (x86)\\Git\\bin\\bash.exe',
        'C:\\laragon\\bin\\git\\bin\\bash.exe',
        'D:\\Git\\bin\\bash.exe',
        '/bin/bash',
        '/usr/bin/bash',
        'bash'
    ];

    foreach ($candidates as $c) {
        if (is_file($c) && is_executable($c)) {
            $detected = $c;
            return $detected;
        }
    }

    // 2. Comprobar en PATH
    if (stripos(PHP_OS, 'WIN') === 0) {
        $where = @shell_exec('where bash 2>NUL');
        if ($where) {
            $lines = explode("\n", trim($where));
            if (!empty($lines[0]) && is_file(trim($lines[0]))) {
                $detected = trim($lines[0]);
                return $detected;
            }
        }
        $detected = 'powershell.exe';
    } else {
        $detected = 'bash';
    }

    return $detected;
}

/**
 * Ejecuta un comando en el motor de Bash y cicla los catalizadores 4-ENV.
 */

/**
 * Ejecuta comandos de la plataforma (repos, clone, status, tokens, keys, etc.)
 * y formatea la salida directamente para la terminal Bash.
 */
/**
 * Ejecuta comandos de la plataforma (repos, clone, status, tokens, keys, etc.)
 * y formatea la salida directamente para la terminal Bash.
 */
function bashExecCommand($cmd, $cwd = null, array $extraEnv = []) {
    // Authorization is enforced even when /api/command calls this directly.
    return executionRunCommand((string)$cmd, $cwd, $extraEnv);
}

/**
 * Maneja las solicitudes a `/api/bash/*` y `/api/catalyst/*`
 */
function bashHandleApi($uri) {
    if (strpos($uri, '/api/bash') !== 0 && strpos($uri, '/api/catalyst') !== 0 && strpos($uri, '/api/storage') !== 0 && strpos($uri, '/api/django') !== 0) {
        return false;
    }

    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store, private');
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

    // Every Bash/Catalyst/Storage/Django endpoint exposes privileged host capabilities
    // or internal server state. Require the verified administrative boundary first.
    // In desktop mode adminRequire() accepts only the authenticated loopback bridge.
    adminRequire();

    $acct = function_exists('supabaseCurrentAccountKey') ? supabaseCurrentAccountKey() : 'global';

    // 1. Ejecutar comando en Bash
    if ($uri === '/api/bash/exec' && $method === 'POST') {
        // adminRequire() above is mandatory. Request headers such as X-Requested-With
        // and X-L8-CSRF are never treated as authentication credentials.
        $body = json_decode((string)file_get_contents('php://input'), true) ?: $_POST;
        $cmd = trim((string)($body['command'] ?? $body['cmd'] ?? ''));

        if ($cmd === '') {
            echo json_encode(['ok' => false, 'error' => 'Comando vacío'], JSON_UNESCAPED_UNICODE);
            return true;
        }

        $res = bashExecCommand($cmd, $body['cwd'] ?? null, $body['env'] ?? []);
        echo json_encode($res, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        return true;
    }

    // 2. Consulta de Estado y Conexión de la Carpeta Central (Workspace API)
    if ($uri === '/api/bash/workspace' || $uri === '/api/bash/workspace/status') {
        $cfg = bashGetWorkspaceConfig();
        $wsDir = bashWorkspaceDir();
        $files = bashScanWorkspaceFiles($wsDir, 1);
        $totalFiles = count($files);

        echo json_encode([
            'ok' => true,
            'workspace' => $wsDir,
            'display_path' => $cfg['display_path'] ?? '~/workspace',
            'api_url' => $cfg['api_url'] ?? '/api/bash/workspace',
            'status' => $cfg['status'] ?? 'connected',
            'is_connected' => true,
            'is_writable' => is_writable($wsDir),
            'files_count' => $totalFiles,
            'files' => $files,
            'detected_shell' => bashDetectExecutable(),
            'storage_mode' => 'centralized_api',
            'connected_at' => $cfg['connected_at'] ?? date('c'),
            'account_key' => $acct
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        return true;
    }

    // 3. Conectar / Establecer nueva dirección para la Carpeta Central
    if (($uri === '/api/bash/workspace/connect' || $uri === '/api/bash/workspace/set-path') && $method === 'POST') {
        $body = json_decode((string)file_get_contents('php://input'), true) ?: $_POST;
        $newPath = trim((string)($body['path'] ?? $body['workspace_path'] ?? ''));
        $newDisplay = trim((string)($body['display_path'] ?? ''));
        $newApiUrl = trim((string)($body['api_url'] ?? ''));

        $updates = [];
        if ($newPath !== '') {
            $resolved = realpath($newPath) ?: $newPath;
            if (!is_dir($resolved)) {
                @mkdir($resolved, 0777, true);
            }
            $updates['workspace_path'] = str_replace('\\', '/', $resolved);
            if ($newDisplay === '') {
                $updates['display_path'] = (strpos($resolved, __DIR__) === 0) ? '~/workspace' : basename($resolved);
            }
        }
        if ($newDisplay !== '') {
            $updates['display_path'] = $newDisplay;
        }
        if ($newApiUrl !== '') {
            $updates['api_url'] = $newApiUrl;
        }
        $updates['status'] = 'connected';

        $saved = bashSaveWorkspaceConfig($updates);

        echo json_encode([
            'ok' => true,
            'message' => 'Carpeta central conectada exitosamente a la API',
            'config' => $saved
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        return true;
    }

    // 4. Endpoints del Sistema Dual-Catalyst 4-ENV
    if ($uri === '/api/catalyst/status' || $uri === '/api/bash/catalyst/status') {
        $status = bashRunPythonCatalyst(['status']);
        echo json_encode($status, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        return true;
    }

    if ($uri === '/api/catalyst/logs' || $uri === '/api/bash/catalyst/logs') {
        $channel = $_GET['channel'] ?? 'all';
        $logs = bashRunPythonCatalyst(['logs', $channel]);
        echo json_encode($logs, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        return true;
    }

    if ($uri === '/api/catalyst/execute' && $method === 'POST') {
        if (function_exists('securityRequireAccountSession')) {
            securityRequireAccountSession();
        }
        $body = json_decode((string)file_get_contents('php://input'), true) ?: $_POST;
        $channel = $body['channel'] ?? '/a';
        $action = $body['action'] ?? 'activate';
        $param = $body['param'] ?? '';
        $res = bashRunPythonCatalyst([$channel, $action, $param]);
        echo json_encode($res, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        return true;
    }

    // 5. Estado y Control de Almacenamiento SODA / OpenSDS
    if ($uri === '/api/storage/pools') {
        $pyScript = __DIR__ . '/engines/api-engine/storage_controller.py';
        $output = @shell_exec('python ' . escapeshellarg($pyScript) . ' pools 2>&1');
        echo $output ?: json_encode(['ok' => true, 'pools' => []]);
        return true;
    }

    if ($uri === '/api/storage/fileshares') {
        $pyScript = __DIR__ . '/engines/api-engine/storage_controller.py';
        $output = @shell_exec('python ' . escapeshellarg($pyScript) . ' shares 2>&1');
        echo $output ?: json_encode(['ok' => true, 'fileshares' => []]);
        return true;
    }

    // 6. Django Status API
    if ($uri === '/api/django/status') {
        $managePy = __DIR__ . '/engines/api-engine/django_api/manage.py';
        $output = @shell_exec('python -c "import django; print(django.__version__)" 2>&1');
        $catState = bashRunPythonCatalyst(['status']);
        echo json_encode([
            'ok' => true,
            'django_version' => trim((string)$output) ?: '6.1',
            'framework' => 'Django REST & Storage Controller Engine',
            'catalyst_state' => $catState,
            'api_endpoints' => [
                '/api/catalyst/status',
                '/api/catalyst/logs',
                '/api/catalyst/execute',
                '/api/storage/pools',
                '/api/storage/fileshares'
            ]
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        return true;
    }

    // 7. Estado del motor e información de Bash 4.3
    if ($uri === '/api/bash/status' || $uri === '/api/bash/info') {
        $srcDir = __DIR__ . '/engines/bash-src/bash-bash-4.3-testing';
        $hasSource = is_dir($srcDir);
        $fileCount = $hasSource ? count(glob($srcDir . '/*')) : 0;
        $cfg = bashGetWorkspaceConfig();

        echo json_encode([
            'ok' => true,
            'engine' => 'GNU Bash 4.3-testing Environment',
            'detected_shell' => bashDetectExecutable(),
            'workspace' => bashWorkspaceDir(),
            'display_path' => $cfg['display_path'] ?? '~/workspace',
            'api_url' => $cfg['api_url'] ?? '/api/bash/workspace',
            'source_tree_installed' => $hasSource,
            'source_files_count' => $fileCount,
            'source_path' => $srcDir,
            'account_key' => $acct
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        return true;
    }

    http_response_code(404);
    echo json_encode(['ok' => false, 'error' => 'Endpoint no encontrado']);
    return true;
}
