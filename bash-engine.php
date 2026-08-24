<?php
/**
 * Motor de Bash Engine para L8 / Hashcod Codespace.
 *
 * Conecta el frontend interactivo de la herramienta con el ejecutor POSIX / Bash 4.3,
 * gestiona sesiones de shell, variables de entorno, directorios de trabajo y streams.
 */

require_once __DIR__ . '/supabase.php';

function bashWorkspaceDir() {
    $ws = __DIR__ . '/workspace';
    if (!is_dir($ws)) {
        @mkdir($ws, 0777, true);
    }
    return $ws;
}

function bashSessionsDir() {
    $dir = __DIR__ . '/data_storage/bash_sessions';
    if (!is_dir($dir)) {
        @mkdir($dir, 0777, true);
    }
    return $dir;
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
    $workspace = $cwd && is_dir($cwd) ? $cwd : bashWorkspaceDir();
    $bashExe = bashDetectExecutable();
    $startTime = microtime(true);

    $env = array_merge($_ENV, [
        'HOME' => $workspace,
        'WORKSPACE' => $workspace,
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

    // 2. Estado del motor e información de Bash 4.3
    if ($uri === '/api/bash/status' || $uri === '/api/bash/info') {
        $srcDir = __DIR__ . '/engines/bash-src/bash-bash-4.3-testing';
        $hasSource = is_dir($srcDir);
        $fileCount = $hasSource ? count(glob($srcDir . '/*')) : 0;

        echo json_encode([
            'ok' => true,
            'engine' => 'GNU Bash 4.3-testing Environment',
            'detected_shell' => bashDetectExecutable(),
            'workspace' => bashWorkspaceDir(),
            'source_tree_installed' => $hasSource,
            'source_files_count' => $fileCount,
            'source_path' => $srcDir,
            'account_key' => $acct
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        return true;
    }

    // 3. Crear sesión interactiva
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
