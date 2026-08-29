<?php
require_once __DIR__ . '/security.php';
require_once __DIR__ . '/l8-html.php';
securityBootstrap('web');
$L8_BASE = l8_public_base_path();
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Zylon · PrivateGPT · l8 codespace</title>
    <base href="<?php echo htmlspecialchars($L8_BASE, ENT_QUOTES, 'UTF-8'); ?>">
    <script>window.L8_BASE_PATH = <?php echo json_encode($L8_BASE, JSON_UNESCAPED_SLASHES); ?>;</script>
    <link rel="icon" href="favicon.svg?v=3" type="image/svg+xml">
    <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg: #0b0f19;
            --panel: #121826;
            --term: #0b0f19;
            --fg: #e8ecf4;
            --muted: #8b93a7;
            --accent: #9aa3b5;
            --ok: #7dcea0;
            --err: #ef6b6b;
            --border: #243044;
        }
        * { box-sizing: border-box; }
        html, body {
            margin: 0;
            height: 100%;
            background: var(--bg);
            color: var(--fg);
            font-family: 'IBM Plex Sans', system-ui, sans-serif;
        }
        .shell {
            display: flex;
            flex-direction: column;
            height: 100%;
            min-height: 100vh;
        }
        .titlebar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            padding: 10px 14px;
            background: var(--panel);
            border-bottom: 1px solid var(--border);
        }
        .brand {
            display: flex;
            align-items: center;
            gap: 10px;
            min-width: 0;
        }
        .brand img { width: 24px; height: 24px; flex: 0 0 auto; }
        .brand h1 {
            margin: 0;
            font-size: 15px;
            font-weight: 600;
            white-space: nowrap;
        }
        .brand span {
            color: var(--muted);
            font-size: 12px;
        }
        .meta {
            font-family: 'IBM Plex Mono', monospace;
            font-size: 11px;
            color: var(--muted);
            text-align: right;
        }
        .term-wrap {
            flex: 1;
            min-height: 0;
            display: flex;
            flex-direction: column;
            background: var(--term);
        }
        #termOut {
            flex: 1;
            overflow: auto;
            padding: 14px 16px 8px;
            font-family: 'IBM Plex Mono', monospace;
            font-size: 13px;
            line-height: 1.45;
            white-space: pre-wrap;
            word-break: break-word;
        }
        #termOut .prompt { color: #a8b3c7; }
        #termOut .path { color: #7f9cff; }
        #termOut .err { color: var(--err); }
        #termOut .info { color: var(--muted); }
        #termOut .cmd { color: #fff; }
        #termOut .ok { color: var(--ok); }
        .input-row {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 10px 16px 16px;
            border-top: 1px solid rgba(255,255,255,0.06);
            font-family: 'IBM Plex Mono', monospace;
        }
        .input-row .ps1 { color: #a8b3c7; white-space: nowrap; }
        .input-row .ps1 .path { color: #7f9cff; }
        #termIn {
            flex: 1;
            min-width: 0;
            background: transparent;
            border: none;
            outline: none;
            color: #fff;
            font: inherit;
            caret-color: var(--accent);
        }
        .boot-line { color: var(--muted); }
        .links {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
        }
        .links a {
            color: #c5cee0;
            font-size: 11px;
            text-decoration: none;
            border: 1px solid var(--border);
            border-radius: 999px;
            padding: 4px 10px;
        }
        .links a:hover { background: rgba(255,255,255,0.04); }
    </style>
</head>
<body>
    <div class="shell">
        <div class="titlebar">
            <div class="brand">
                <img src="/assets/icons/zylon-mark-gray.svg?v=1" alt="" width="24" height="24" aria-hidden="true">
                <div>
                    <h1>Zylon</h1>
                    <span>zylon-ai/private-gpt · l8 codespace</span>
                </div>
            </div>
            <div>
                <div class="meta" id="metaInfo">booting…</div>
                <div class="links" style="margin-top:6px;justify-content:flex-end;">
                    <a href="https://github.com/zylon-ai/private-gpt" target="_blank" rel="noopener noreferrer">GitHub</a>
                    <a href="https://docs.privategpt.dev/" target="_blank" rel="noopener noreferrer">Docs</a>
                    <a href="https://zylon.ai" target="_blank" rel="noopener noreferrer">Zylon</a>
                </div>
            </div>
        </div>
        <div class="term-wrap">
            <div id="termOut"></div>
            <form class="input-row" id="termForm" autocomplete="off">
                <div class="ps1" id="ps1"><span class="user">zylon@l8</span>:<span class="path">~</span>$</div>
                <input id="termIn" type="text" spellcheck="false" autofocus aria-label="Zylon command">
            </form>
        </div>
    </div>
    <script>
        (function () {
            const out = document.getElementById('termOut');
            const form = document.getElementById('termForm');
            const input = document.getElementById('termIn');
            const ps1 = document.getElementById('ps1');
            const meta = document.getElementById('metaInfo');
            let cwd = '~';
            let busy = false;
            const history = [];
            let histIdx = -1;

            function append(html) {
                out.insertAdjacentHTML('beforeend', html);
                out.scrollTop = out.scrollHeight;
            }
            function setPrompt(path) {
                cwd = path || cwd;
                ps1.innerHTML = '<span class="user">zylon@l8</span>:<span class="path">' + escapeHtml(cwd) + '</span>$';
            }
            function escapeHtml(s) {
                return String(s)
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;');
            }

            function l8ApiUrl(path) {
                const base = window.L8_BASE_PATH || (document.querySelector('base')?.getAttribute('href')) || '';
                const cleanPath = path.startsWith('/') ? path.slice(1) : path;
                const cleanBase = base.endsWith('/') ? base : (base ? base + '/' : '');
                return cleanBase + cleanPath;
            }

            async function boot() {
                append('<div class="boot-line">Welcome to Zylon / PrivateGPT (l8 codespace shell)</div>');
                append('<div class="boot-line">Loading resources from github.com/zylon-ai/private-gpt …</div>');
                try {
                    const res = await fetch(l8ApiUrl('api/zylon/session'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
                    const data = await res.json();
                    if (!data.ok) {
                        append('<div class="err">boot error: ' + escapeHtml(data.error || 'unknown') + '</div>');
                        meta.textContent = 'offline';
                        return;
                    }
                    setPrompt(data.cwd_display || '~');
                    meta.textContent = (data.product || 'Zylon') + ' · ' + (data.resource || 'private-gpt');
                    if (data.message) append('<div class="info">' + escapeHtml(data.message) + '</div>');
                    if (data.repo_ready) append('<div class="ok">private-gpt resources ready.</div>');
                    append('<div class="info">Type <span class="cmd">help</span> for Zylon CLI commands. Workdir links to zylon-ai/private-gpt.</div><br>');
                } catch (e) {
                    append('<div class="err">boot failed: ' + escapeHtml(e.message || String(e)) + '</div>');
                }
                input.focus();
            }

            async function runCommand(cmd) {
                if (!cmd || busy) return;
                busy = true;
                append('<div><span class="prompt">zylon@l8</span>:<span class="path">' + escapeHtml(cwd) + '</span>$ <span class="cmd">' + escapeHtml(cmd) + '</span></div>');
                try {
                    const res = await fetch(l8ApiUrl('api/zylon/exec'), {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ command: cmd, cwd: cwd })
                    });
                    const data = await res.json();
                    if (data.cwd_display) setPrompt(data.cwd_display);
                    if (data.stdout) append('<div>' + escapeHtml(data.stdout).replace(/\n/g, '<br>') + '</div>');
                    if (data.stderr) append('<div class="err">' + escapeHtml(data.stderr).replace(/\n/g, '<br>') + '</div>');
                    if (!data.ok && !data.stdout && !data.stderr) {
                        append('<div class="err">' + escapeHtml(data.error || 'command failed') + '</div>');
                    }
                } catch (e) {
                    append('<div class="err">' + escapeHtml(e.message || String(e)) + '</div>');
                } finally {
                    busy = false;
                    input.focus();
                }
            }

            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const cmd = input.value.trim();
                if (!cmd) return;
                history.push(cmd);
                histIdx = history.length;
                input.value = '';
                runCommand(cmd);
            });
            input.addEventListener('keydown', (e) => {
                if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    if (!history.length) return;
                    histIdx = Math.max(0, histIdx - 1);
                    input.value = history[histIdx] || '';
                } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    histIdx = Math.min(history.length, histIdx + 1);
                    input.value = histIdx >= history.length ? '' : (history[histIdx] || '');
                }
            });

            boot();
        })();
    </script>
</body>
</html>
