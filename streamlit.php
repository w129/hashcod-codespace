<?php
/**
 * Streamlit dock tools — run Python Streamlit apps behind /st/{slot}/
 */

function streamlitRootDir() {
    $dir = __DIR__ . '/data_storage/streamlit';
    if (!is_dir($dir)) @mkdir($dir, 0700, true);
    return $dir;
}

function streamlitAppsDir() {
    $dir = streamlitRootDir() . '/apps';
    if (!is_dir($dir)) @mkdir($dir, 0700, true);
    return $dir;
}

function streamlitRuntimeDir() {
    $dir = streamlitRootDir() . '/runtime';
    if (!is_dir($dir)) @mkdir($dir, 0700, true);
    return $dir;
}

function streamlitSlotCount() {
    return 8;
}

function streamlitNormalizeSlot($slot) {
    $n = (int) $slot;
    if ($n < 1 || $n > streamlitSlotCount()) return 0;
    return $n;
}

function streamlitPortForSlot($slot) {
    $slot = streamlitNormalizeSlot($slot);
    return $slot ? (8500 + $slot) : 0;
}

function streamlitBasePathForSlot($slot) {
    $slot = streamlitNormalizeSlot($slot);
    return $slot ? ('st/' . $slot) : '';
}

function streamlitPublicUrlForSlot($slot) {
    $slot = streamlitNormalizeSlot($slot);
    return $slot ? ('/st/' . $slot . '/') : '';
}

function streamlitPythonBin() {
    $candidates = [
        '/opt/l8-py/bin/python',
        '/opt/l8-py/bin/python3',
        trim((string) @shell_exec('command -v python3 2>/dev/null')),
        trim((string) @shell_exec('command -v python 2>/dev/null')),
    ];
    foreach ($candidates as $bin) {
        if ($bin !== '' && is_executable($bin)) return $bin;
    }
    return '';
}

function streamlitBin() {
    $candidates = [
        '/opt/l8-py/bin/streamlit',
        trim((string) @shell_exec('command -v streamlit 2>/dev/null')),
    ];
    foreach ($candidates as $bin) {
        if ($bin !== '' && is_executable($bin)) return $bin;
    }
    return '';
}

function streamlitAvailable() {
    $py = streamlitPythonBin();
    if ($py === '') {
        return ['ok' => false, 'python' => false, 'streamlit' => false, 'error' => 'Python no está instalado en este servidor'];
    }
    $cmd = escapeshellarg($py) . ' -c ' . escapeshellarg('import streamlit') . ' 2>/dev/null';
    @exec($cmd, $out, $code);
    if ((int) $code !== 0) {
        return [
            'ok' => false,
            'python' => true,
            'streamlit' => false,
            'error' => 'Streamlit no está instalado. Se incluye en la imagen Docker de l8 (Render).'
        ];
    }
    return [
        'ok' => true,
        'python' => true,
        'streamlit' => true,
        'python_bin' => $py,
        'streamlit_bin' => streamlitBin(),
        'version' => streamlitVersion($py),
    ];
}

function streamlitVersion($py = '') {
    $py = $py !== '' ? $py : streamlitPythonBin();
    if ($py === '') return null;
    $cmd = escapeshellarg($py) . ' -c ' . escapeshellarg('import streamlit as s; print(getattr(s, "__version__", ""))');
    $out = [];
    @exec($cmd . ' 2>/dev/null', $out);
    $v = isset($out[0]) ? trim($out[0]) : '';
    return $v !== '' ? $v : null;
}

function streamlitSlotDir($slot) {
    $slot = streamlitNormalizeSlot($slot);
    if (!$slot) return '';
    $dir = streamlitAppsDir() . '/slot' . $slot;
    if (!is_dir($dir)) @mkdir($dir, 0700, true);
    return $dir;
}

function streamlitAppPath($slot) {
    $dir = streamlitSlotDir($slot);
    return $dir === '' ? '' : ($dir . '/app.py');
}

function streamlitMetaPath($slot) {
    $dir = streamlitSlotDir($slot);
    return $dir === '' ? '' : ($dir . '/meta.json');
}

function streamlitRuntimePath($slot) {
    $slot = streamlitNormalizeSlot($slot);
    return $slot ? (streamlitRuntimeDir() . '/slot' . $slot . '.json') : '';
}

function streamlitLogPath($slot) {
    $dir = streamlitSlotDir($slot);
    return $dir === '' ? '' : ($dir . '/streamlit.log');
}

function streamlitReadMeta($slot) {
    $path = streamlitMetaPath($slot);
    if ($path === '' || !is_readable($path)) return null;
    $data = json_decode((string) @file_get_contents($path), true);
    return is_array($data) ? $data : null;
}

function streamlitWriteMeta($slot, $meta) {
    $path = streamlitMetaPath($slot);
    if ($path === '') return false;
    $prev = streamlitReadMeta($slot) ?: [];
    $payload = [
        'slot' => streamlitNormalizeSlot($slot),
        'title' => (string) ($meta['title'] ?? ($prev['title'] ?? ('Streamlit ' . $slot))),
        'template' => (string) ($meta['template'] ?? ($prev['template'] ?? '')),
        'updated_at' => date('c'),
        'bytes' => (int) ($meta['bytes'] ?? ($prev['bytes'] ?? 0)),
    ];
    return @file_put_contents($path, json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT), LOCK_EX) !== false;
}

function streamlitReadRuntime($slot) {
    $path = streamlitRuntimePath($slot);
    if ($path === '' || !is_readable($path)) return null;
    $data = json_decode((string) @file_get_contents($path), true);
    return is_array($data) ? $data : null;
}

function streamlitWriteRuntime($slot, $runtime) {
    $path = streamlitRuntimePath($slot);
    if ($path === '') return false;
    return @file_put_contents($path, json_encode($runtime, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT), LOCK_EX) !== false;
}

function streamlitClearRuntime($slot) {
    $path = streamlitRuntimePath($slot);
    if ($path !== '' && is_file($path)) @unlink($path);
}

function streamlitPidAlive($pid) {
    $pid = (int) $pid;
    if ($pid <= 1) return false;
    if (function_exists('posix_kill')) {
        return @posix_kill($pid, 0);
    }
    $out = [];
    $code = 1;
    @exec('kill -0 ' . $pid . ' 2>/dev/null', $out, $code);
    return ((int) $code) === 0;
}

function streamlitIsRunning($slot) {
    $rt = streamlitReadRuntime($slot);
    if (!$rt || empty($rt['pid'])) return false;
    if (!streamlitPidAlive($rt['pid'])) {
        streamlitClearRuntime($slot);
        return false;
    }
    return true;
}

function streamlitTemplates() {
    $base = __DIR__ . '/streamlit_tools';
    $defs = [
        [
            'id' => 'demo_hello',
            'title' => 'Demo calculadora',
            'blurb' => 'Inputs + resultado — ideal para probar el dock.',
            'file' => 'demo_hello.py',
        ],
        [
            'id' => 'demo_charts',
            'title' => 'Demo charts',
            'blurb' => 'Pandas/Numpy con line/area chart.',
            'file' => 'demo_charts.py',
        ],
        [
            'id' => 'demo_notes',
            'title' => 'Demo notas',
            'blurb' => 'Formulario de notas rápidas.',
            'file' => 'demo_notes.py',
        ],
    ];
    $out = [];
    foreach ($defs as $d) {
        $path = $base . '/' . $d['file'];
        $code = is_readable($path) ? (string) file_get_contents($path) : '';
        $out[] = [
            'id' => $d['id'],
            'title' => $d['title'],
            'blurb' => $d['blurb'],
            'bytes' => strlen($code),
            'code' => $code,
        ];
    }
    return $out;
}

function streamlitTemplateById($id) {
    $id = preg_replace('/[^a-z0-9_\-]/i', '', (string) $id);
    foreach (streamlitTemplates() as $t) {
        if ($t['id'] === $id) return $t;
    }
    return null;
}

function streamlitDemoCode() {
    $t = streamlitTemplateById('demo_hello');
    if ($t && $t['code'] !== '') return $t['code'];
    return "import streamlit as st\nst.title('l8 Streamlit')\nst.write('Demo')\n";
}

function streamlitEnsureSeeded() {
    $slot = 1;
    $app = streamlitAppPath($slot);
    if ($app === '') return;
    if (is_readable($app) && filesize($app) > 0) {
        streamlitEnsureConfig($slot);
        return;
    }
    $code = streamlitDemoCode();
    @file_put_contents($app, $code, LOCK_EX);
    streamlitWriteMeta($slot, [
        'title' => 'Demo calculadora',
        'template' => 'demo_hello',
        'bytes' => strlen($code),
    ]);
    streamlitEnsureConfig($slot);
}

function streamlitEnsureConfig($slot) {
    $dir = streamlitSlotDir($slot);
    if ($dir === '') return false;
    $cfgDir = $dir . '/.streamlit';
    if (!is_dir($cfgDir)) @mkdir($cfgDir, 0700, true);
    $cfg = $cfgDir . '/config.toml';
    $toml = <<<TOML
[server]
headless = true
enableCORS = false
enableXsrfProtection = false
address = "127.0.0.1"
fileWatcherType = "none"

[browser]
gatherUsageStats = false

[theme]
primaryColor = "#0b3d2e"
backgroundColor = "#FFFFFF"
secondaryBackgroundColor = "#F3F4F6"
textColor = "#111111"
font = "sans serif"
TOML;
    return @file_put_contents($cfg, $toml, LOCK_EX) !== false;
}

function streamlitValidateCode($code) {
    $code = (string) $code;
    if (trim($code) === '') {
        return ['ok' => false, 'error' => 'El código está vacío'];
    }
    if (strlen($code) > 400000) {
        return ['ok' => false, 'error' => 'Código demasiado grande (máx. ~400KB)'];
    }
    $blocked = [
        '/\bos\.system\s*\(/i',
        '/\bsubprocess\./i',
        '/\bpty\./i',
        '/\bctypes\./i',
        '/\bshutil\.rmtree\s*\(/i',
        '/\beval\s*\(/i',
        '/\bexec\s*\(/i',
        '/\b__import__\s*\(/i',
        '/\bsocket\.socket\s*\(/i',
        '/\bpickle\.loads?\s*\(/i',
    ];
    foreach ($blocked as $re) {
        if (preg_match($re, $code)) {
            return ['ok' => false, 'error' => 'Código bloqueado por política de seguridad (sistema / ejecución dinámica)'];
        }
    }
    if (stripos($code, 'streamlit') === false) {
        return ['ok' => true, 'warning' => 'No se detectó import de streamlit; la app puede fallar al arrancar'];
    }
    return ['ok' => true];
}

function streamlitSaveTool($slot, $title, $code, $template = '') {
    $slot = streamlitNormalizeSlot($slot);
    if (!$slot) return ['ok' => false, 'error' => 'Slot inválido (1–8)'];
    $check = streamlitValidateCode($code);
    if (empty($check['ok'])) return $check;

    $app = streamlitAppPath($slot);
    if ($app === '') return ['ok' => false, 'error' => 'No se pudo crear el directorio del slot'];
    if (@file_put_contents($app, $code, LOCK_EX) === false) {
        return ['ok' => false, 'error' => 'No se pudo guardar app.py'];
    }
    streamlitEnsureConfig($slot);
    streamlitWriteMeta($slot, [
        'title' => trim((string) $title) !== '' ? trim((string) $title) : ('Streamlit ' . $slot),
        'template' => (string) $template,
        'bytes' => strlen($code),
    ]);

    $wasRunning = streamlitIsRunning($slot);
    if ($wasRunning) {
        streamlitStop($slot);
        $start = streamlitStart($slot);
        return [
            'ok' => !empty($start['ok']),
            'slot' => $slot,
            'saved' => true,
            'restarted' => true,
            'url' => streamlitPublicUrlForSlot($slot),
            'warning' => $check['warning'] ?? null,
            'error' => $start['error'] ?? null,
            'runtime' => $start['runtime'] ?? null,
        ];
    }

    return [
        'ok' => true,
        'slot' => $slot,
        'saved' => true,
        'url' => streamlitPublicUrlForSlot($slot),
        'warning' => $check['warning'] ?? null,
        'meta' => streamlitReadMeta($slot),
    ];
}

function streamlitLoadTool($slot) {
    $slot = streamlitNormalizeSlot($slot);
    if (!$slot) return ['ok' => false, 'error' => 'Slot inválido'];
    $app = streamlitAppPath($slot);
    $code = (is_readable($app) ? (string) file_get_contents($app) : '');
    $meta = streamlitReadMeta($slot) ?: [];
    return [
        'ok' => true,
        'slot' => $slot,
        'title' => $meta['title'] ?? ('Streamlit ' . $slot),
        'template' => $meta['template'] ?? '',
        'code' => $code,
        'has_code' => trim($code) !== '',
        'running' => streamlitIsRunning($slot),
        'url' => streamlitPublicUrlForSlot($slot),
        'port' => streamlitPortForSlot($slot),
        'meta' => $meta,
        'runtime' => streamlitReadRuntime($slot),
        'log_tail' => streamlitLogTail($slot, 1200),
    ];
}

function streamlitLogTail($slot, $max = 1500) {
    $path = streamlitLogPath($slot);
    if ($path === '' || !is_readable($path)) return '';
    $raw = (string) @file_get_contents($path);
    if ($raw === '') return '';
    return substr($raw, -1 * max(200, (int) $max));
}

function streamlitListTools() {
    streamlitEnsureSeeded();
    $items = [];
    for ($i = 1; $i <= streamlitSlotCount(); $i++) {
        $app = streamlitAppPath($i);
        $has = is_readable($app) && filesize($app) > 0;
        $meta = streamlitReadMeta($i) ?: [];
        $items[] = [
            'slot' => $i,
            'title' => $meta['title'] ?? ('Streamlit ' . $i),
            'template' => $meta['template'] ?? '',
            'has_code' => $has,
            'running' => streamlitIsRunning($i),
            'url' => streamlitPublicUrlForSlot($i),
            'updated_at' => $meta['updated_at'] ?? null,
            'bytes' => $meta['bytes'] ?? ($has ? filesize($app) : 0),
        ];
    }
    return $items;
}

function streamlitWaitPort($port, $timeoutSec = 25) {
    $port = (int) $port;
    $deadline = microtime(true) + max(3, (int) $timeoutSec);
    while (microtime(true) < $deadline) {
        $fp = @fsockopen('127.0.0.1', $port, $errno, $errstr, 0.35);
        if (is_resource($fp)) {
            fclose($fp);
            return true;
        }
        usleep(250000);
    }
    return false;
}

function streamlitStart($slot) {
    $slot = streamlitNormalizeSlot($slot);
    if (!$slot) return ['ok' => false, 'error' => 'Slot inválido'];

    $avail = streamlitAvailable();
    if (empty($avail['ok'])) {
        return ['ok' => false, 'error' => $avail['error'] ?? 'Streamlit no disponible'];
    }

    $app = streamlitAppPath($slot);
    if (!is_readable($app) || filesize($app) <= 0) {
        return ['ok' => false, 'error' => 'No hay código en este slot. Guarda una app Streamlit primero.'];
    }

    streamlitEnsureConfig($slot);

    if (streamlitIsRunning($slot)) {
        return [
            'ok' => true,
            'already' => true,
            'slot' => $slot,
            'url' => streamlitPublicUrlForSlot($slot),
            'runtime' => streamlitReadRuntime($slot),
        ];
    }

    $port = streamlitPortForSlot($slot);
    $base = streamlitBasePathForSlot($slot);
    $py = $avail['python_bin'];
    $log = streamlitLogPath($slot);
    $work = streamlitSlotDir($slot);

    // setsid: grupo de proceso fácil de matar
    $cmd = 'cd ' . escapeshellarg($work)
        . ' && setsid '
        . escapeshellarg($py)
        . ' -m streamlit run ' . escapeshellarg($app)
        . ' --server.address=127.0.0.1'
        . ' --server.port=' . (int) $port
        . ' --server.headless=true'
        . ' --server.enableCORS=false'
        . ' --server.enableXsrfProtection=false'
        . ' --server.baseUrlPath=' . escapeshellarg($base)
        . ' --browser.gatherUsageStats=false'
        . ' > ' . escapeshellarg($log) . ' 2>&1 & echo $!';

    $pidOut = [];
    $code = 1;
    @exec($cmd, $pidOut, $code);
    $pid = isset($pidOut[0]) ? (int) trim($pidOut[0]) : 0;
    if ($pid <= 1) {
        return [
            'ok' => false,
            'error' => 'No se pudo iniciar Streamlit',
            'log_tail' => streamlitLogTail($slot),
        ];
    }

    $ready = streamlitWaitPort($port, 30);
    $runtime = [
        'pid' => $pid,
        'port' => $port,
        'base' => $base,
        'url' => streamlitPublicUrlForSlot($slot),
        'started_at' => date('c'),
        'ready' => $ready,
    ];
    streamlitWriteRuntime($slot, $runtime);

    if (!$ready) {
        streamlitStop($slot);
        return [
            'ok' => false,
            'error' => 'Streamlit no respondió a tiempo en el puerto ' . $port,
            'log_tail' => streamlitLogTail($slot, 2500),
        ];
    }

    return [
        'ok' => true,
        'slot' => $slot,
        'url' => streamlitPublicUrlForSlot($slot),
        'runtime' => $runtime,
    ];
}

function streamlitStop($slot) {
    $slot = streamlitNormalizeSlot($slot);
    if (!$slot) return ['ok' => false, 'error' => 'Slot inválido'];
    $rt = streamlitReadRuntime($slot);
    $pid = $rt && !empty($rt['pid']) ? (int) $rt['pid'] : 0;
    if ($pid > 1) {
        // Intentar matar grupo de sesión (setsid)
        if (function_exists('posix_kill')) {
            @posix_kill(-$pid, 15);
            @posix_kill($pid, 15);
            usleep(250000);
            if (streamlitPidAlive($pid)) {
                @posix_kill(-$pid, 9);
                @posix_kill($pid, 9);
            }
        } else {
            @exec('kill -TERM -' . $pid . ' 2>/dev/null');
            @exec('kill -TERM ' . $pid . ' 2>/dev/null');
            usleep(250000);
            @exec('kill -KILL -' . $pid . ' 2>/dev/null');
            @exec('kill -KILL ' . $pid . ' 2>/dev/null');
        }
    }
    $port = streamlitPortForSlot($slot);
    if ($port) {
        @exec('fuser -k ' . (int) $port . '/tcp >/dev/null 2>&1');
    }
    streamlitClearRuntime($slot);
    return ['ok' => true, 'slot' => $slot, 'stopped' => true];
}

function streamlitClearTool($slot) {
    $slot = streamlitNormalizeSlot($slot);
    if (!$slot) return ['ok' => false, 'error' => 'Slot inválido'];
    streamlitStop($slot);
    $app = streamlitAppPath($slot);
    $meta = streamlitMetaPath($slot);
    if ($app && is_file($app)) @unlink($app);
    if ($meta && is_file($meta)) @unlink($meta);
    if ($slot === 1) {
        streamlitEnsureSeeded();
    }
    return ['ok' => true, 'slot' => $slot, 'cleared' => true, 'tool' => streamlitLoadTool($slot)];
}

function streamlitStatusPayload() {
    streamlitEnsureSeeded();
    $avail = streamlitAvailable();
    $templates = streamlitTemplates();
    // Don't ship full code in status list — trim for bandwidth
    $tplLite = array_map(function ($t) {
        return [
            'id' => $t['id'],
            'title' => $t['title'],
            'blurb' => $t['blurb'],
            'bytes' => $t['bytes'],
        ];
    }, $templates);
    return [
        'ok' => true,
        'available' => !empty($avail['ok']),
        'python' => !empty($avail['python']),
        'streamlit' => !empty($avail['streamlit']),
        'version' => $avail['version'] ?? null,
        'error' => $avail['error'] ?? null,
        'tools' => streamlitListTools(),
        'templates' => $tplLite,
    ];
}
