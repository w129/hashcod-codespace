<?php
/**
 * Motor de Bash Engine para L8 / Hashcod Codespace.
 *
 * Conecta el frontend interactivo de la herramienta con el ejecutor POSIX / Bash 4.3,
 * gestiona sesiones de shell, variables de entorno, directorios de trabajo y streams.
 * Centraliza la carpeta de guardado y conexión con la API y endpoints dinámicos.
 */

require_once __DIR__ . '/supabase.php';

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
 * Ejecuta un comando en el motor de Bash.
 */
function bashExecCommand($cmd, $cwd = null, array $extraEnv = []) {
    $cfg = bashGetWorkspaceConfig();
    $workspace = $cwd && is_dir($cwd) ? str_replace('\\', '/', $cwd) : bashWorkspaceDir();
    $bashExe = bashDetectExecutable();
    $startTime = microtime(true);

    // Manejador interno de comandos especiales de workspace
    $trimmedCmd = trim((string)$cmd);
    if ($trimmedCmd === 'workspace' || $trimmedCmd === 'workspace info' || $trimmedCmd === 'workspace status') {
        $files = bashScanWorkspaceFiles($workspace, 1);
        $fileCount = count($files);
        $stdout = "=== HASHCOD CODESPACE CENTRAL WORKSPACE ===\n";
        $stdout .= "Central Directory : " . $cfg['workspace_path'] . "\n";
        $stdout .= "Display Alias     : " . $cfg['display_path'] . "\n";
        $stdout .= "API Connection    : " . $cfg['api_url'] . " (ONLINE)\n";
        $stdout .= "Status            : " . strtoupper($cfg['status']) . "\n";
        $stdout .= "Files in Root     : " . $fileCount . "\n";
        $stdout .= "Engine Execution  : " . basename($bashExe) . "\n";
        $stdout .= "============================================";
        return [
            'ok' => true,
            'exit_code' => 0,
            'stdout' => $stdout,
            'stderr' => '',
            'execution_time_ms' => 1,
            'cwd' => $workspace,
            'display_path' => $cfg['display_path'],
            'shell' => basename($bashExe)
        ];
    }

    if (preg_match('/^workspace\s+set\s+(.+)$/i', $trimmedCmd, $m)) {
        $newPath = trim($m[1]);
        $resolved = realpath($newPath) ?: $newPath;
        if (!is_dir($resolved)) {
            @mkdir($resolved, 0777, true);
        }
        $updated = bashSaveWorkspaceConfig([
            'workspace_path' => str_replace('\\', '/', $resolved),
            'display_path' => (strpos($resolved, __DIR__) === 0) ? '~/workspace' : basename($resolved)
        ]);
        return [
            'ok' => true,
            'exit_code' => 0,
            'stdout' => "Carpeta central actualizada y conectada a la API:\nPath: " . $updated['workspace_path'] . "\nAlias: " . $updated['display_path'],
            'stderr' => '',
            'execution_time_ms' => 2,
            'cwd' => $updated['workspace_path'],
            'display_path' => $updated['display_path'],
            'shell' => basename($bashExe)
        ];
    }

    if (preg_match('/^workspace\s+connect\s+(.+)$/i', $trimmedCmd, $m)) {
        $newApi = trim($m[1]);
        $updated = bashSaveWorkspaceConfig([
            'api_url' => $newApi,
            'status' => 'connected'
        ]);
        return [
            'ok' => true,
            'exit_code' => 0,
            'stdout' => "Carpeta central conectada exitosamente a la API:\nEndpoint: " . $updated['api_url'] . "\nStatus: CONNECTED",
            'stderr' => '',
            'execution_time_ms' => 2,
            'cwd' => $workspace,
            'display_path' => $cfg['display_path'],
            'shell' => basename($bashExe)
        ];
    }

    $env = array_merge($_ENV, [
        'HOME' => $workspace,
        'WORKSPACE' => $workspace,
        'CENTRAL_WORKSPACE' => $cfg['workspace_path'],
        'WORKSPACE_API' => $cfg['api_url'],
        'TERM' => 'xterm-256color',
        'BASH_VERSION' => '4.3-testing',
        'SHELL' => $bashExe,
        'LANG' => 'en_US.UTF-8'
    ], $extraEnv);

    $descriptors = [
        0 => ['pipe', 'r'],
        1 => ['pipe', 'w'],
        2 => ['pipe', 'w']
    ];

    if ($bashExe === 'powershell.exe') {
        $fullCmd = 'powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -Command ' . escapeshellarg($cmd);
    } else {
        $fullCmd = escapeshellarg($bashExe) . ' -lc ' . escapeshellarg($cmd);
    }

    $proc = @proc_open($fullCmd, $descriptors, $pipes, $workspace, $env);
    if (!is_resource($proc)) {
        return [
            'ok' => false,
            'exit_code' => -1,
            'stdout' => '',
            'stderr' => 'No se pudo iniciar el proceso de Bash en ' . $bashExe,
            'execution_time_ms' => 0
        ];
    }

    @fclose($pipes[0]);
    $stdout = stream_get_contents($pipes[1]);
    @fclose($pipes[1]);
    $stderr = stream_get_contents($pipes[2]);
    @fclose($pipes[2]);

    $exitCode = proc_close($proc);
    $durMs = (int)round((microtime(true) - $startTime) * 1000);

    return [
        'ok' => ($exitCode === 0),
        'exit_code' => $exitCode,
        'stdout' => (string)$stdout,
        'stderr' => (string)$stderr,
        'execution_time_ms' => $durMs,
        'cwd' => $workspace,
        'display_path' => $cfg['display_path'],
        'shell' => basename($bashExe)
    ];
}

/**
 * Maneja las solicitudes a `/api/bash/*`
 */
function bashHandleApi($uri) {
    if (strpos($uri, '/api/bash') !== 0) {
        return false;
    }

    header('Content-Type: application/json; charset=utf-8');
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    $acct = function_exists('supabaseCurrentAccountKey') ? supabaseCurrentAccountKey() : 'global';

    // 1. Ejecutar comando en Bash
    if ($uri === '/api/bash/exec' && $method === 'POST') {
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

    // 4. Listar archivos dentro de la Carpeta Central
    if ($uri === '/api/bash/workspace/files') {
        $sub = trim((string)($_GET['sub'] ?? ''));
        $base = bashWorkspaceDir();
        $target = $sub ? str_replace('\\', '/', $base . '/' . ltrim($sub, '/')) : $base;
        
        $files = bashScanWorkspaceFiles($target, 2);
        echo json_encode([
            'ok' => true,
            'workspace' => $base,
            'current_directory' => $target,
            'files' => $files
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        return true;
    }

    // 5. Guardar / Centralizar un archivo en la Carpeta Central
    if ($uri === '/api/bash/workspace/save-file' && $method === 'POST') {
        $body = json_decode((string)file_get_contents('php://input'), true) ?: $_POST;
        $relPath = trim((string)($body['file_path'] ?? $body['filename'] ?? ''));
        $content = (string)($body['content'] ?? '');

        if ($relPath === '') {
            echo json_encode(['ok' => false, 'error' => 'Ruta de archivo no especificada'], JSON_UNESCAPED_UNICODE);
            return true;
        }

        $base = bashWorkspaceDir();
        $fullPath = str_replace('\\', '/', $base . '/' . ltrim($relPath, '/'));
        $parent = dirname($fullPath);
        if (!is_dir($parent)) {
            @mkdir($parent, 0777, true);
        }

        $written = @file_put_contents($fullPath, $content);
        if ($written === false) {
            echo json_encode(['ok' => false, 'error' => 'No se pudo escribir el archivo en ' . $fullPath]);
            return true;
        }

        echo json_encode([
            'ok' => true,
            'message' => 'Archivo guardado y centralizado exitosamente',
            'file_path' => $fullPath,
            'relative_path' => $relPath,
            'bytes_written' => $written
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        return true;
    }

    // 6. Leer archivo desde la Carpeta Central
    if ($uri === '/api/bash/workspace/read-file' && ($method === 'POST' || $method === 'GET')) {
        $body = ($method === 'POST') ? (json_decode((string)file_get_contents('php://input'), true) ?: $_POST) : $_GET;
        $relPath = trim((string)($body['file_path'] ?? $body['filename'] ?? ''));

        if ($relPath === '') {
            echo json_encode(['ok' => false, 'error' => 'Ruta de archivo no especificada'], JSON_UNESCAPED_UNICODE);
            return true;
        }

        $base = bashWorkspaceDir();
        $fullPath = str_replace('\\', '/', $base . '/' . ltrim($relPath, '/'));

        if (!is_file($fullPath)) {
            http_response_code(404);
            echo json_encode(['ok' => false, 'error' => 'Archivo no encontrado: ' . $relPath]);
            return true;
        }

        $content = @file_get_contents($fullPath);
        echo json_encode([
            'ok' => true,
            'file_path' => $fullPath,
            'relative_path' => $relPath,
            'size' => filesize($fullPath),
            'content' => $content
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
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

    // 8. Crear sesión interactiva
    if ($uri === '/api/bash/session/create' && $method === 'POST') {
        $sessionId = 'bash_sess_' . bin2hex(random_bytes(8));
        $record = [
            'id' => $sessionId,
            'account_key' => $acct,
            'cwd' => bashWorkspaceDir(),
            'created_at' => date('c'),
            'history' => []
        ];
        @file_put_contents(bashSessionsDir() . '/' . $sessionId . '.json', json_encode($record, JSON_PRETTY_PRINT));

        echo json_encode([
            'ok' => true,
            'session_id' => $sessionId,
            'cwd' => $record['cwd']
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        return true;
    }

    http_response_code(404);
    echo json_encode(['ok' => false, 'error' => 'Endpoint Bash no encontrado']);
    return true;
}
