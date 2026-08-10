<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ChromeOS play · l8 codespace</title>
    <link rel="icon" href="/favicon.svg?v=3" type="image/svg+xml">
    <link href="https://fonts.googleapis.com/css2?family=SF+Mono:wght@400;500&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg: #202124;
            --panel: #292a2d;
            --term: #000000;
            --fg: #f5f5f7;
            --muted: #86868b;
            --accent: #8ab4f8;
            --ok: #81c995;
            --err: #f28b82;
            --border: #3c4043;
            --menubar: rgba(41, 42, 45, 0.94);
        }
        * { box-sizing: border-box; }
        html, body {
            margin: 0;
            height: 100%;
            background: var(--bg);
            color: var(--fg);
            font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }
        .shell {
            display: flex;
            flex-direction: column;
            height: 100%;
            min-height: 100vh;
            background:
                radial-gradient(ellipse 90% 60% at 50% 0%, rgba(138, 180, 248, 0.14), transparent 55%),
                linear-gradient(180deg, #2b2c2f 0%, #202124 45%, #17181a 100%);
        }
        .menubar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            padding: 8px 14px;
            background: var(--menubar);
            border-bottom: 1px solid var(--border);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
        }
        .brand {
            display: flex;
            align-items: center;
            gap: 10px;
            min-width: 0;
        }
        .brand svg { width: 18px; height: 18px; fill: var(--fg); flex: 0 0 auto; }
        .brand h1 {
            margin: 0;
            font-size: 14px;
            font-weight: 600;
            white-space: nowrap;
        }
        .brand span {
            color: var(--muted);
            font-size: 12px;
        }
        .nav {
            display: flex;
            gap: 4px;
        }
        .nav button {
            border: none;
            background: transparent;
            color: var(--muted);
            font: inherit;
            font-size: 12px;
            font-weight: 500;
            padding: 6px 12px;
            border-radius: 999px;
            cursor: pointer;
        }
        .nav button.active {
            background: rgba(255, 255, 255, 0.1);
            color: var(--fg);
        }
        .meta {
            font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
            font-size: 11px;
            color: var(--muted);
            text-align: right;
        }
        .stage {
            flex: 1;
            min-height: 0;
            display: none;
            flex-direction: column;
        }
        .stage.visible { display: flex; }

        .term-wrap {
            flex: 1;
            min-height: 0;
            display: flex;
            flex-direction: column;
            margin: 12px;
            border: 1px solid var(--border);
            border-radius: 12px;
            overflow: hidden;
            background: var(--term);
            box-shadow: 0 18px 50px rgba(0, 0, 0, 0.35);
        }
        #termOut {
            flex: 1;
            overflow: auto;
            padding: 14px 16px 8px;
            font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
            font-size: 13px;
            line-height: 1.45;
            white-space: pre-wrap;
            word-break: break-word;
        }
        #termOut .prompt { color: var(--ok); }
        #termOut .path { color: var(--accent); }
        #termOut .err { color: var(--err); }
        #termOut .info { color: var(--muted); }
        #termOut .cmd { color: #fff; }
        .input-row {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 10px 16px 14px;
            border-top: 1px solid rgba(255,255,255,0.06);
            font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        }
        .input-row .ps1 { color: var(--ok); white-space: nowrap; }
        .input-row .ps1 .path { color: var(--accent); }
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

        .license-wrap {
            flex: 1;
            min-height: 0;
            overflow: auto;
            padding: 20px 18px 28px;
        }
        .license-card {
            max-width: 820px;
            margin: 0 auto;
            background: rgba(28, 28, 30, 0.92);
            border: 1px solid var(--border);
            border-radius: 14px;
            padding: 22px 22px 18px;
            box-shadow: 0 18px 50px rgba(0, 0, 0, 0.28);
        }
        .license-card h2 {
            margin: 0 0 6px;
            font-size: 20px;
            font-weight: 600;
        }
        .license-card .sub {
            margin: 0 0 16px;
            color: var(--muted);
            font-size: 13px;
            line-height: 1.45;
        }
        .license-meta {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-bottom: 14px;
        }
        .pill {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 5px 10px;
            border-radius: 999px;
            background: rgba(138, 180, 248, 0.14);
            color: #aecbfa;
            font-size: 11px;
            font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        }
        #licenseBody {
            margin: 0;
            padding: 14px;
            border-radius: 10px;
            background: #0a0a0b;
            border: 1px solid var(--border);
            color: #d2d2d7;
            font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
            font-size: 12px;
            line-height: 1.55;
            white-space: pre-wrap;
            word-break: break-word;
        }
        .license-actions {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 14px;
        }
        .license-actions a, .license-actions button {
            appearance: none;
            border: 1px solid var(--border);
            background: #2c2c2e;
            color: var(--fg);
            text-decoration: none;
            font: inherit;
            font-size: 12px;
            padding: 8px 12px;
            border-radius: 8px;
            cursor: pointer;
        }
        .license-actions a:hover, .license-actions button:hover {
            background: #3a3a3c;
        }
    </style>
</head>
<body>
    <div class="shell">
        <div class="menubar">
            <div class="brand">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="1.6"/>
                    <circle cx="12" cy="12" r="4.2" fill="currentColor"/>
                    <path d="M12 2v4.2M12 17.8V22M2 12h4.2M17.8 12H22" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
                </svg>
                <div>
                    <h1>ChromeOS play</h1>
                    <span>dockur/chromeos · l8 codespace</span>
                </div>
            </div>
            <div class="nav" role="tablist">
                <button type="button" class="active" data-stage="system" id="tabSystem">System</button>
                <button type="button" data-stage="license" id="tabLicense">License</button>
            </div>
            <div class="meta" id="metaInfo">booting…</div>
        </div>

        <div class="stage visible" id="stageSystem">
            <div class="term-wrap">
                <div id="termOut"></div>
                <form class="input-row" id="termForm" autocomplete="off">
                    <div class="ps1" id="ps1"><span class="user">chromeos@l8</span>:<span class="path">~</span>$</div>
                    <input id="termIn" type="text" spellcheck="false" autofocus aria-label="ChromeOS command">
                </form>
            </div>
        </div>

        <div class="stage" id="stageLicense">
            <div class="license-wrap">
                <div class="license-card">
                    <h2>License</h2>
                    <p class="sub">Licencia del sistema operativo desplegado desde <code>https://github.com/dockur/chromeos</code> (archivo <code>license.md</code> del recurso).</p>
                    <div class="license-meta">
                        <span class="pill" id="licenseSpdx">MIT</span>
                        <span class="pill" id="licenseSource">source: license.md</span>
                    </div>
                    <pre id="licenseBody">Cargando licencia…</pre>
                    <div class="license-actions">
                        <a href="https://github.com/dockur/chromeos/blob/master/license.md" target="_blank" rel="noopener noreferrer">Ver en GitHub</a>
                        <button type="button" id="btnReloadLicense">Recargar licencia</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <script>
        (function () {
            const out = document.getElementById('termOut');
            const form = document.getElementById('termForm');
            const input = document.getElementById('termIn');
            const ps1 = document.getElementById('ps1');
            const meta = document.getElementById('metaInfo');
            const licenseBody = document.getElementById('licenseBody');
            const licenseSpdx = document.getElementById('licenseSpdx');
            const licenseSource = document.getElementById('licenseSource');
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
                ps1.innerHTML = '<span class="user">chromeos@l8</span>:<span class="path">' + escapeHtml(cwd) + '</span>$';
            }

            function escapeHtml(s) {
                return String(s)
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;');
            }

            function showStage(name) {
                document.querySelectorAll('.stage').forEach((el) => el.classList.remove('visible'));
                document.querySelectorAll('.nav button').forEach((btn) => {
                    btn.classList.toggle('active', btn.getAttribute('data-stage') === name);
                });
                const stage = document.getElementById(name === 'license' ? 'stageLicense' : 'stageSystem');
                if (stage) stage.classList.add('visible');
                if (name === 'system') input.focus();
            }

            document.querySelectorAll('.nav button').forEach((btn) => {
                btn.addEventListener('click', () => showStage(btn.getAttribute('data-stage')));
            });
            document.getElementById('btnReloadLicense').addEventListener('click', () => loadLicense());

            async function loadLicense() {
                licenseBody.textContent = 'Cargando licencia…';
                try {
                    const res = await fetch('/api/chromeos/license');
                    const data = await res.json();
                    if (!data.ok) throw new Error(data.error || 'license unavailable');
                    licenseSpdx.textContent = data.spdx || 'MIT';
                    licenseSource.textContent = 'source: ' + (data.source || 'license.md');
                    licenseBody.textContent = data.text || '(empty)';
                } catch (e) {
                    licenseBody.textContent = 'Error: ' + (e.message || String(e));
                }
            }

            async function boot() {
                append('<div class="boot-line">ChromeOS play · l8 codespace</div>');
                append('<div class="boot-line">Loading resources from github.com/dockur/chromeos …</div>');
                try {
                    const res = await fetch('/api/chromeos/session', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: '{}'
                    });
                    const data = await res.json();
                    if (!data.ok) {
                        append('<div class="err">boot error: ' + escapeHtml(data.error || 'unknown') + '</div>');
                        meta.textContent = 'offline';
                        return;
                    }
                    setPrompt(data.cwd_display || '~');
                    meta.textContent = (data.distro || 'ChromeOS') + ' · ' + (data.resource || 'dockur/chromeos');
                    if (data.message) append('<div class="info">' + escapeHtml(data.message) + '</div>');
                    if (data.compose_ready) {
                        append('<div class="info">compose.yml listo en el recurso. Web viewer tipico: puerto 8006 · VNC 5900.</div>');
                    }
                    if (data.license && data.license.spdx) {
                        append('<div class="info">License: ' + escapeHtml(data.license.spdx) + ' (ver pestaña License)</div>');
                    }
                    append('<div class="info">Type <span class="cmd">help</span> for commands. <span class="cmd">license</span> opens the License panel.</div><br>');
                    await loadLicense();
                } catch (e) {
                    append('<div class="err">boot failed: ' + escapeHtml(e.message || String(e)) + '</div>');
                }
                input.focus();
            }

            async function runCommand(cmd) {
                if (!cmd || busy) return;
                if (cmd === 'license' || cmd === 'licence') {
                    append('<div><span class="prompt">chromeos@l8</span>:<span class="path">' + escapeHtml(cwd) + '</span>$ <span class="cmd">' + escapeHtml(cmd) + '</span></div>');
                    showStage('license');
                    await loadLicense();
                    return;
                }
                busy = true;
                append('<div><span class="prompt">chromeos@l8</span>:<span class="path">' + escapeHtml(cwd) + '</span>$ <span class="cmd">' + escapeHtml(cmd) + '</span></div>');
                try {
                    const res = await fetch('/api/chromeos/exec', {
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
