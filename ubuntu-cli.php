<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ubuntu CLI · l8 codespace</title>
    <link rel="icon" href="/favicon.svg?v=3" type="image/svg+xml">
    <link href="https://fonts.googleapis.com/css2?family=Ubuntu+Mono:wght@400;700&family=Ubuntu:wght@400;500;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg: #300a24;
            --panel: #2c001e;
            --term: #300a24;
            --fg: #eeeeec;
            --muted: #c4a000;
            --accent: #e95420;
            --green: #8ae234;
            --blue: #729fcf;
            --border: #5e2750;
        }
        * { box-sizing: border-box; }
        html, body {
            margin: 0;
            height: 100%;
            background: var(--bg);
            color: var(--fg);
            font-family: 'Ubuntu', system-ui, sans-serif;
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
        .brand svg { width: 22px; height: 22px; fill: var(--fg); flex: 0 0 auto; }
        .brand h1 {
            margin: 0;
            font-size: 15px;
            font-weight: 500;
            white-space: nowrap;
        }
        .brand span {
            color: #cfcfcf;
            font-size: 12px;
            opacity: 0.85;
        }
        .meta {
            font-family: 'Ubuntu Mono', monospace;
            font-size: 11px;
            color: #ddd;
            opacity: 0.8;
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
            font-family: 'Ubuntu Mono', monospace;
            font-size: 14px;
            line-height: 1.45;
            white-space: pre-wrap;
            word-break: break-word;
        }
        #termOut .prompt { color: var(--green); }
        #termOut .path { color: var(--blue); }
        #termOut .err { color: #ef2929; }
        #termOut .info { color: var(--muted); }
        #termOut .cmd { color: #fff; }
        .input-row {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 10px 16px 16px;
            border-top: 1px solid rgba(255,255,255,0.06);
            font-family: 'Ubuntu Mono', monospace;
        }
        .input-row .ps1 { color: var(--green); white-space: nowrap; }
        .input-row .ps1 .path { color: var(--blue); }
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
    </style>
</head>
<body>
    <div class="shell">
        <div class="titlebar">
            <div class="brand">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50" aria-hidden="true">
                    <path d="M 5 4 A 1.0001 1.0001 0 0 0 4 5 L 4 15 A 1.0001 1.0001 0 0 0 5 16 L 45 16 A 1.0001 1.0001 0 0 0 46 15 L 46 5 A 1.0001 1.0001 0 0 0 45 4 L 5 4 z M 6 6 L 44 6 L 44 14 L 6 14 L 6 6 z M 10 9 A 1 1 0 0 0 9 10 A 1 1 0 0 0 10 11 A 1 1 0 0 0 11 10 A 1 1 0 0 0 10 9 z M 14 9 A 1 1 0 0 0 13 10 A 1 1 0 0 0 14 11 A 1 1 0 0 0 15 10 A 1 1 0 0 0 14 9 z M 18 9 A 1 1 0 0 0 17 10 A 1 1 0 0 0 18 11 A 1 1 0 0 0 19 10 A 1 1 0 0 0 18 9 z M 4 19 L 4 45 A 1.0001 1.0001 0 0 0 5 46 L 45 46 A 1.0001 1.0001 0 0 0 46 45 L 46 19 L 44 19 L 44 44 L 6 44 L 6 19 L 4 19 z M 10 19 A 1.0001 1.0001 0 0 0 9 20 L 9 40 A 1.0001 1.0001 0 0 0 10 41 L 23 41 A 1.0001 1.0001 0 0 0 24 40 L 24 20 A 1.0001 1.0001 0 0 0 23 19 L 10 19 z M 27 19 L 27 21 L 41 21 L 41 19 L 27 19 z M 11 21 L 22 21 L 22 39 L 11 39 L 11 21 z M 27 24 L 27 26 L 41 26 L 41 24 L 27 24 z M 27 29 L 27 31 L 41 31 L 41 29 L 27 29 z M 27 34 L 27 36 L 41 36 L 41 34 L 27 34 z M 27 39 L 27 41 L 41 41 L 41 39 L 27 39 z"></path>
                </svg>
                <div>
                    <h1>Ubuntu CLI</h1>
                    <span>boxcutter/ubuntu · l8 codespace</span>
                </div>
            </div>
            <div class="meta" id="metaInfo">booting…</div>
        </div>
        <div class="term-wrap">
            <div id="termOut"></div>
            <form class="input-row" id="termForm" autocomplete="off">
                <div class="ps1" id="ps1"><span class="user">ubuntu@l8</span>:<span class="path">~</span>$</div>
                <input id="termIn" type="text" spellcheck="false" autofocus aria-label="Ubuntu command">
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
                ps1.innerHTML = '<span class="user">ubuntu@l8</span>:<span class="path">' + escapeHtml(cwd) + '</span>$';
            }

            function escapeHtml(s) {
                return String(s)
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;');
            }

            async function boot() {
                append('<div class="boot-line">Welcome to Ubuntu 22.04 LTS (l8 codespace shell)</div>');
                append('<div class="boot-line">Loading resources from github.com/boxcutter/ubuntu …</div>');
                try {
                    const res = await fetch('/api/ubuntu/session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
                    const data = await res.json();
                    if (!data.ok) {
                        append('<div class="err">boot error: ' + escapeHtml(data.error || 'unknown') + '</div>');
                        meta.textContent = 'offline';
                        return;
                    }
                    setPrompt(data.cwd_display || '~');
                    meta.textContent = (data.distro || 'Ubuntu') + ' · ' + (data.resource || 'boxcutter/ubuntu');
                    if (data.message) append('<div class="info">' + escapeHtml(data.message) + '</div>');
                    if (data.templates && data.templates.length) {
                        append('<div class="info">Available boxcutter templates: ' + escapeHtml(data.templates.slice(0, 12).join(', ')) + (data.templates.length > 12 ? '…' : '') + '</div>');
                    }
                    append('<div class="info">Type <span class="cmd">help</span> for Ubuntu CLI commands. Workdir is linked to boxcutter/ubuntu resources.</div><br>');
                } catch (e) {
                    append('<div class="err">boot failed: ' + escapeHtml(e.message || String(e)) + '</div>');
                }
                input.focus();
            }

            async function runCommand(cmd) {
                if (!cmd || busy) return;
                busy = true;
                append('<div><span class="prompt">ubuntu@l8</span>:<span class="path">' + escapeHtml(cwd) + '</span>$ <span class="cmd">' + escapeHtml(cmd) + '</span></div>');
                try {
                    const res = await fetch('/api/ubuntu/exec', {
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
