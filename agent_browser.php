<?php
/**
 * Control de páginas de Google vía agent-browser (vercel-labs/agent-browser).
 * https://github.com/vercel-labs/agent-browser
 *
 * Solo permite dominios Google. Expone open / snapshot / click / fill / get / screenshot / close.
 */

function agentBrowserRootDir() {
    return __DIR__ . '/data_storage/agent_browser';
}

function agentBrowserShotsDir() {
    return agentBrowserRootDir() . '/shots';
}

function agentBrowserStateDir() {
    return agentBrowserRootDir() . '/state';
}

function agentBrowserSessionId() {
    return 'soro-google';
}

function agentBrowserAllowedDomains() {
    return implode(',', [
        'google.com',
        '*.google.com',
        '*.google',
        'gmail.com',
        '*.gmail.com',
        'youtube.com',
        '*.youtube.com',
        'youtu.be',
        'blogspot.com',
        '*.blogspot.com',
        'blogger.com',
        '*.blogger.com',
        '*.withgoogle.com',
        '*.googleusercontent.com',
        '*.ggpht.com',
        'gstatic.com',
        '*.gstatic.com',
        'googleapis.com',
        '*.googleapis.com',
        'chrome.com',
        '*.chrome.com',
    ]);
}

function agentBrowserEnsureDirs() {
    foreach ([agentBrowserRootDir(), agentBrowserShotsDir(), agentBrowserStateDir()] as $d) {
        if (!is_dir($d)) {
            @mkdir($d, 0775, true);
        }
    }
    return is_dir(agentBrowserRootDir());
}

function agentBrowserBin() {
    $candidates = [
        '/usr/local/bin/agent-browser',
        '/opt/agent-browser/node_modules/.bin/agent-browser',
        __DIR__ . '/node_modules/.bin/agent-browser',
        trim((string) @shell_exec('command -v agent-browser 2>/dev/null')),
    ];
    foreach ($candidates as $bin) {
        if ($bin !== '' && is_file($bin) && is_executable($bin)) {
            return $bin;
        }
        // npm shims may not be marked executable on some FS; still runnable via node
        if ($bin !== '' && is_file($bin)) {
            return $bin;
        }
    }
    return '';
}

function agentBrowserIsGoogleHost($host) {
    $host = strtolower(trim((string) $host));
    if ($host === '') return false;
    $host = preg_replace('/:\d+$/', '', $host);
    $suffixes = [
        'google.com',
        'google',
        'gmail.com',
        'youtube.com',
        'youtu.be',
        'blogspot.com',
        'blogger.com',
        'withgoogle.com',
        'googleusercontent.com',
        'ggpht.com',
        'gstatic.com',
        'googleapis.com',
        'chrome.com',
    ];
    foreach ($suffixes as $suf) {
        if ($host === $suf || substr($host, -1 * (strlen($suf) + 1)) === '.' . $suf) {
            return true;
        }
    }
    return false;
}

function agentBrowserNormalizeUrl($url) {
    $url = trim((string) $url);
    if ($url === '') {
        return ['ok' => false, 'error' => 'URL vacía'];
    }
    if (!preg_match('#^https?://#i', $url)) {
        $url = 'https://' . $url;
    }
    $parts = @parse_url($url);
    if (!is_array($parts) || empty($parts['host'])) {
        return ['ok' => false, 'error' => 'URL inválida'];
    }
    if (!agentBrowserIsGoogleHost($parts['host'])) {
        return ['ok' => false, 'error' => 'Solo se permiten páginas de Google (y propiedades relacionadas)'];
    }
    $scheme = strtolower((string) ($parts['scheme'] ?? 'https'));
    if (!in_array($scheme, ['http', 'https'], true)) {
        return ['ok' => false, 'error' => 'Esquema no permitido'];
    }
    $built = $scheme . '://' . $parts['host'];
    if (!empty($parts['port'])) $built .= ':' . $parts['port'];
    if (!empty($parts['path'])) $built .= $parts['path'];
    else $built .= '/';
    if (!empty($parts['query'])) $built .= '?' . $parts['query'];
    if (!empty($parts['fragment'])) $built .= '#' . $parts['fragment'];
    return ['ok' => true, 'url' => $built];
}

function agentBrowserRun(array $args, $timeoutSec = 90) {
    $bin = agentBrowserBin();
    if ($bin === '') {
        return [
            'ok' => false,
            'error' => 'agent-browser no está instalado. Usa Asegurar / instalar en el panel.',
            'code' => 'missing_bin',
        ];
    }
    agentBrowserEnsureDirs();
    $session = agentBrowserSessionId();
    $allowed = agentBrowserAllowedDomains();
    $prefix = [
        $bin,
        '--session', $session,
        '--allowed-domains', $allowed,
    ];
    $cmdParts = [];
    foreach (array_merge($prefix, $args) as $part) {
        $cmdParts[] = escapeshellarg((string) $part);
    }
    $cmd = 'HOME=' . escapeshellarg(agentBrowserRootDir())
        . ' AGENT_BROWSER_SESSION=' . escapeshellarg($session)
        . ' AGENT_BROWSER_ALLOWED_DOMAINS=' . escapeshellarg($allowed)
        . ' timeout ' . max(5, (int) $timeoutSec) . 's '
        . implode(' ', $cmdParts)
        . ' 2>&1';
    $out = [];
    $code = 1;
    @exec($cmd, $out, $code);
    $text = trim(implode("\n", $out));
    return [
        'ok' => ((int) $code === 0),
        'code' => (int) $code,
        'output' => $text,
        'error' => ((int) $code === 0) ? null : ($text !== '' ? $text : 'Falló agent-browser'),
        'cmd' => $args,
    ];
}

function agentBrowserStatusPayload() {
    $bin = agentBrowserBin();
    $chromeOk = false;
    $version = '';
    if ($bin !== '') {
        $v = agentBrowserRun(['--version'], 15);
        $version = trim((string) ($v['output'] ?? ''));
        $doc = agentBrowserRun(['doctor', '--json'], 45);
        $chromeOk = !empty($doc['ok']);
        if (!$chromeOk && is_string($doc['output'] ?? null) && stripos($doc['output'], 'chrome') !== false) {
            // doctor may report issues even if CLI works
            $chromeOk = false;
        }
    }
    return [
        'ok' => true,
        'available' => $bin !== '',
        'bin' => $bin !== '' ? $bin : null,
        'version' => $version !== '' ? $version : null,
        'chrome_ready' => $chromeOk,
        'session' => agentBrowserSessionId(),
        'allowed_domains' => agentBrowserAllowedDomains(),
        'resource' => 'https://github.com/vercel-labs/agent-browser',
        'presets' => [
            ['label' => 'Google', 'url' => 'https://www.google.com/'],
            ['label' => 'Gmail', 'url' => 'https://mail.google.com/'],
            ['label' => 'Drive', 'url' => 'https://drive.google.com/'],
            ['label' => 'Docs', 'url' => 'https://docs.google.com/'],
            ['label' => 'Maps', 'url' => 'https://maps.google.com/'],
            ['label' => 'Translate', 'url' => 'https://translate.google.com/'],
            ['label' => 'YouTube', 'url' => 'https://www.youtube.com/'],
            ['label' => 'Calendar', 'url' => 'https://calendar.google.com/'],
            ['label' => 'Meet', 'url' => 'https://meet.google.com/'],
            ['label' => 'Scholar', 'url' => 'https://scholar.google.com/'],
        ],
    ];
}

function agentBrowserEnsure() {
    agentBrowserEnsureDirs();
    $bin = agentBrowserBin();
    $installed = false;
    $logs = [];

    if ($bin === '') {
        // Prefer local install under /opt or project node_modules
        $target = '/opt/agent-browser';
        if (!is_dir($target)) {
            @mkdir($target, 0775, true);
        }
        $npm = trim((string) @shell_exec('command -v npm 2>/dev/null'));
        if ($npm === '') {
            return [
                'ok' => false,
                'error' => 'npm no está disponible para instalar agent-browser',
                'logs' => $logs,
            ];
        }
        $cmd = 'cd ' . escapeshellarg($target)
            . ' && npm install agent-browser@^0.34.0 --no-fund --no-audit 2>&1';
        $out = [];
        $code = 1;
        @exec($cmd, $out, $code);
        $logs[] = implode("\n", $out);
        $installed = ((int) $code === 0);
        $bin = agentBrowserBin();
    }

    if ($bin === '') {
        return [
            'ok' => false,
            'error' => 'No se pudo instalar agent-browser',
            'logs' => $logs,
            'installed' => $installed,
        ];
    }

    // Download Chrome for Testing + Linux deps when possible
    $install = [];
    $code = 1;
    @exec(
        'HOME=' . escapeshellarg(agentBrowserRootDir()) . ' '
        . escapeshellarg($bin) . ' install --with-deps 2>&1',
        $install,
        $code
    );
    $logs[] = implode("\n", $install);
    if ((int) $code !== 0) {
        $install2 = [];
        @exec(
            'HOME=' . escapeshellarg(agentBrowserRootDir()) . ' '
            . escapeshellarg($bin) . ' install 2>&1',
            $install2,
            $code
        );
        $logs[] = implode("\n", $install2);
    }

    $st = agentBrowserStatusPayload();
    $st['ensure'] = true;
    $st['installed_cli'] = $installed || ($bin !== '');
    $st['logs_tail'] = substr(implode("\n---\n", $logs), -4000);
    $st['ok'] = !empty($st['available']);
    if (!$st['ok']) {
        $st['error'] = 'agent-browser no quedó disponible tras ensure';
    }
    return $st;
}

function agentBrowserOpen($url) {
    $norm = agentBrowserNormalizeUrl($url);
    if (empty($norm['ok'])) return $norm;
    $res = agentBrowserRun(['open', $norm['url']], 120);
    if (!empty($res['ok'])) {
        $title = agentBrowserRun(['get', 'title'], 30);
        $cur = agentBrowserRun(['get', 'url'], 30);
        $res['url'] = $norm['url'];
        $res['title'] = $title['output'] ?? null;
        $res['current_url'] = $cur['output'] ?? null;
    }
    return $res;
}

function agentBrowserSnapshot($interactive = true) {
    $args = ['snapshot'];
    if ($interactive) $args[] = '-i';
    return agentBrowserRun($args, 60);
}

function agentBrowserClick($selector) {
    $selector = trim((string) $selector);
    if ($selector === '') return ['ok' => false, 'error' => 'Selector vacío'];
    if (!preg_match('/^(@[A-Za-z0-9_-]+|[#.\[\]a-zA-Z0-9_=\"\'\-\s>+~:()]+)$/', $selector)) {
        return ['ok' => false, 'error' => 'Selector no permitido'];
    }
    return agentBrowserRun(['click', $selector], 60);
}

function agentBrowserFill($selector, $text) {
    $selector = trim((string) $selector);
    $text = (string) $text;
    if ($selector === '') return ['ok' => false, 'error' => 'Selector vacío'];
    if (!preg_match('/^(@[A-Za-z0-9_-]+|[#.\[\]a-zA-Z0-9_=\"\'\-\s>+~:()]+)$/', $selector)) {
        return ['ok' => false, 'error' => 'Selector no permitido'];
    }
    if (strlen($text) > 8000) {
        return ['ok' => false, 'error' => 'Texto demasiado largo'];
    }
    return agentBrowserRun(['fill', $selector, $text], 60);
}

function agentBrowserPress($key) {
    $key = trim((string) $key);
    if ($key === '' || !preg_match('/^[A-Za-z0-9+_\-]+$/', $key)) {
        return ['ok' => false, 'error' => 'Tecla inválida'];
    }
    return agentBrowserRun(['press', $key], 30);
}

function agentBrowserGet($what, $selector = '') {
    $what = strtolower(trim((string) $what));
    if (!in_array($what, ['url', 'title', 'text', 'html', 'value'], true)) {
        return ['ok' => false, 'error' => 'get no soportado'];
    }
    $args = ['get', $what];
    if (in_array($what, ['text', 'html', 'value'], true)) {
        $selector = trim((string) $selector);
        if ($selector === '') return ['ok' => false, 'error' => 'Selector requerido'];
        $args[] = $selector;
    }
    return agentBrowserRun($args, 45);
}

function agentBrowserWait($ms = 1000) {
    $ms = max(100, min(30000, (int) $ms));
    return agentBrowserRun(['wait', (string) $ms], (int) ceil($ms / 1000) + 15);
}

function agentBrowserScreenshot() {
    agentBrowserEnsureDirs();
    $name = 'shot_' . date('Ymd_His') . '_' . substr(bin2hex(random_bytes(4)), 0, 8) . '.png';
    $path = agentBrowserShotsDir() . '/' . $name;
    $res = agentBrowserRun(['screenshot', $path], 90);
    if (empty($res['ok']) || !is_file($path)) {
        // Some versions write to a temp path printed in output
        if (!empty($res['output']) && preg_match('/(\/\S+\.png)/', $res['output'], $m) && is_file($m[1])) {
            @copy($m[1], $path);
        }
    }
    if (!is_file($path)) {
        $res['ok'] = false;
        $res['error'] = $res['error'] ?: 'No se generó el screenshot';
        return $res;
    }
    $raw = (string) @file_get_contents($path);
    $res['ok'] = true;
    $res['shot'] = $name;
    $res['shot_url'] = '/api/agent-browser/shot?name=' . rawurlencode($name);
    $res['image_base64'] = base64_encode($raw);
    $res['mime'] = 'image/png';
    // Keep response smaller for UI that uses shot_url
    if (strlen($res['image_base64']) > 900000) {
        unset($res['image_base64']);
    }
    return $res;
}

function agentBrowserClose() {
    return agentBrowserRun(['close'], 30);
}

function agentBrowserServeShot($name) {
    $name = basename((string) $name);
    if (!preg_match('/^shot_[A-Za-z0-9_]+\.png$/', $name)) {
        return null;
    }
    $path = agentBrowserShotsDir() . '/' . $name;
    if (!is_file($path)) return null;
    return $path;
}

function agentBrowserAction(array $data) {
    $action = strtolower(trim((string) ($data['action'] ?? '')));
    switch ($action) {
        case 'status':
            return agentBrowserStatusPayload();
        case 'ensure':
        case 'install':
            return agentBrowserEnsure();
        case 'open':
        case 'goto':
        case 'navigate':
            return agentBrowserOpen($data['url'] ?? '');
        case 'snapshot':
            return agentBrowserSnapshot(!isset($data['interactive']) || !empty($data['interactive']));
        case 'click':
            return agentBrowserClick($data['selector'] ?? ($data['ref'] ?? ''));
        case 'fill':
            return agentBrowserFill($data['selector'] ?? ($data['ref'] ?? ''), $data['text'] ?? '');
        case 'press':
            return agentBrowserPress($data['key'] ?? 'Enter');
        case 'get':
            return agentBrowserGet($data['what'] ?? 'url', $data['selector'] ?? '');
        case 'wait':
            return agentBrowserWait($data['ms'] ?? 1000);
        case 'screenshot':
        case 'shot':
            return agentBrowserScreenshot();
        case 'close':
        case 'quit':
            return agentBrowserClose();
        default:
            return ['ok' => false, 'error' => 'Acción no soportada: ' . $action];
    }
}
