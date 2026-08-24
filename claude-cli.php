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
    <title>Claude Code · l8 codespace</title>
    <base href="<?php echo htmlspecialchars($L8_BASE, ENT_QUOTES, 'UTF-8'); ?>">
    <script>window.L8_BASE_PATH = <?php echo json_encode($L8_BASE, JSON_UNESCAPED_SLASHES); ?>;</script>
    <link rel="icon" href="favicon.svg?v=3" type="image/svg+xml">
    <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg: #111111;
            --panel: #1a1a1a;
            --term: #0d0d0d;
            --fg: #ececec;
            --muted: #8a8a8a;
            --accent: #6b6b6b;
            --ok: #8ae234;
            --err: #ef5350;
            --border: #333;
            --input: #222;
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
        .brand img { width: 22px; height: 22px; flex: 0 0 auto; }
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
        .gate, .term-wrap {
            flex: 1;
            min-height: 0;
            display: none;
            flex-direction: column;
        }
        .gate.visible, .term-wrap.visible { display: flex; }
        .gate {
            align-items: center;
            justify-content: center;
            padding: 28px 16px;
            background:
                radial-gradient(ellipse 80% 50% at 50% 0%, rgba(120,120,120,0.12), transparent 55%),
                var(--bg);
        }
        .gate-card {
            width: min(480px, 100%);
            background: var(--panel);
            border: 1px solid var(--border);
            border-radius: 10px;
            padding: 28px 24px 22px;
        }
        .gate-card .mark {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 16px;
        }
        .gate-card .mark img { width: 36px; height: 36px; }
        .gate-card h2 {
            margin: 0 0 4px;
            font-size: 20px;
            font-weight: 600;
        }
        .gate-card p {
            margin: 0 0 18px;
            color: var(--muted);
            font-size: 13px;
            line-height: 1.5;
        }
        .steps {
            margin: 0 0 16px;
            padding-left: 18px;
            color: #cfcfcf;
            font-size: 13px;
            line-height: 1.55;
        }
        .gate-actions {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-bottom: 16px;
        }
        .btn {
            appearance: none;
            border: 1px solid #555;
            background: #2a2a2a;
            color: #fff;
            border-radius: 6px;
            padding: 9px 14px;
            font: 500 13px/1 'IBM Plex Sans', system-ui, sans-serif;
            cursor: pointer;
        }
        .btn:hover { background: #333; }
        .btn.primary {
            background: #3a3a3a;
            border-color: #777;
        }
        .btn:disabled { opacity: 0.5; cursor: wait; }
        label.field {
            display: block;
            margin-bottom: 12px;
            font-size: 12px;
            color: var(--muted);
        }
        label.field span { display: block; margin-bottom: 6px; }
        label.field input, label.field textarea {
            width: 100%;
            background: var(--input);
            border: 1px solid #444;
            border-radius: 6px;
            color: #fff;
            padding: 10px 12px;
            font: 12px/1.4 'IBM Plex Mono', monospace;
            outline: none;
        }
        label.field input:focus, label.field textarea:focus { border-color: #777; }
        .gate-msg {
            min-height: 18px;
            font-size: 12px;
            font-family: 'IBM Plex Mono', monospace;
            color: var(--muted);
            margin-top: 4px;
        }
        .gate-msg.err { color: var(--err); }
        .gate-msg.ok { color: var(--ok); }
        #termOut {
            flex: 1;
            overflow: auto;
            padding: 14px 16px 8px;
            font-family: 'IBM Plex Mono', monospace;
            font-size: 13px;
            line-height: 1.45;
            white-space: pre-wrap;
            word-break: break-word;
            background: var(--term);
        }
        #termOut .prompt { color: #bbb; }
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
            background: var(--term);
        }
        .input-row .ps1 { color: #bbb; white-space: nowrap; }
        #termIn {
            flex: 1;
            min-width: 0;
            background: transparent;
            border: none;
            outline: none;
            color: #fff;
            font: inherit;
            caret-color: #aaa;
        }
        .term-toolbar {
            display: flex;
            gap: 8px;
            padding: 8px 14px;
            border-bottom: 1px solid var(--border);
            background: #151515;
        }
        .term-toolbar .btn { padding: 6px 10px; font-size: 12px; }
        .boot-line { color: var(--muted); }
    </style>
</head>
<body>
    <div class="shell">
        <div class="titlebar">
            <div class="brand">
                <img src="/claude-mark-gray.svg" alt="" width="22" height="22" aria-hidden="true">
                <div>
                    <h1>Claude Code</h1>
                    <span>anthropics/claude-code-action · l8 codespace</span>
                </div>
            </div>
            <div class="meta" id="metaInfo">booting…</div>
        </div>

        <div class="gate visible" id="authGate">
            <div class="gate-card">
                <div class="mark">
                    <img src="/claude-mark-gray.svg" alt="" width="36" height="36">
                    <div>
                        <h2>Inicia sesión con Claude</h2>
                        <p style="margin:0;color:var(--muted);font-size:12px;">OAuth requerido antes de ejecutar Claude Code</p>
                    </div>
                </div>
                <p>Usa tu cuenta Claude (Pro / Max / Team / Enterprise) o una API key. El recurso de la ventana es <code>claude-code-action</code>.</p>
                <ol class="steps">
                    <li>Abre el login de Claude (OAuth) en una pestaña.</li>
                    <li>En tu máquina local, genera un token con <code>claude setup-token</code> (o pega un token OAuth / API key).</li>
                    <li>Pega el token abajo y conecta para abrir la CLI.</li>
                </ol>
                <div class="gate-actions">
                    <button type="button" class="btn primary" id="btnOpenOauth">Iniciar sesión OAuth</button>
                    <button type="button" class="btn" id="btnOpenDocs">Docs autenticación</button>
                </div>
                <label class="field">
                    <span>CLAUDE_CODE_OAUTH_TOKEN (recomendado)</span>
                    <input id="oauthToken" type="password" autocomplete="off" spellcheck="false" placeholder="pega el token OAuth de claude setup-token">
                </label>
                <label class="field">
                    <span>ANTHROPIC_API_KEY (alternativa)</span>
                    <input id="apiKey" type="password" autocomplete="off" spellcheck="false" placeholder="sk-ant-… (opcional si usas OAuth)">
                </label>
                <div class="gate-actions">
                    <button type="button" class="btn primary" id="btnConnect">Conectar y abrir Claude Code</button>
                </div>
                <div class="gate-msg" id="gateMsg"></div>
            </div>
        </div>

        <div class="term-wrap" id="termWrap">
            <div class="term-toolbar">
                <button type="button" class="btn" id="btnLogout">Cerrar sesión</button>
                <button type="button" class="btn" id="btnHelp">help</button>
            </div>
            <div id="termOut"></div>
            <form class="input-row" id="termForm" autocomplete="off">
                <div class="ps1" id="ps1">claude&gt;</div>
                <input id="termIn" type="text" spellcheck="false" autofocus aria-label="Claude Code prompt" disabled>
            </form>
        </div>
    </div>
    <script>
        (function () {
            const gate = document.getElementById('authGate');
            const termWrap = document.getElementById('termWrap');
            const out = document.getElementById('termOut');
            const form = document.getElementById('termForm');
            const input = document.getElementById('termIn');
            const meta = document.getElementById('metaInfo');
            const gateMsg = document.getElementById('gateMsg');
            let busy = false;
            let authenticated = false;
            const history = [];
            let histIdx = -1;

            function append(html) {
                out.insertAdjacentHTML('beforeend', html);
                out.scrollTop = out.scrollHeight;
            }
            function escapeHtml(s) {
                return String(s)
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;');
            }
            function setGateMsg(text, kind) {
                gateMsg.textContent = text || '';
                gateMsg.className = 'gate-msg' + (kind ? ' ' + kind : '');
            }
            function showTerminal() {
                gate.classList.remove('visible');
                termWrap.classList.add('visible');
                input.disabled = false;
                input.focus();
            }
            function showGate() {
                termWrap.classList.remove('visible');
                gate.classList.add('visible');
                input.disabled = true;
                authenticated = false;
            }

            function l8ApiUrl(path) {
                const base = window.L8_BASE_PATH || (document.querySelector('base')?.getAttribute('href')) || '';
                const cleanPath = path.startsWith('/') ? path.slice(1) : path;
                const cleanBase = base.endsWith('/') ? base : (base ? base + '/' : '');
                return cleanBase + cleanPath;
            }

            async function boot() {
                try {
                    const res = await fetch(l8ApiUrl('api/claude/session'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
                    const data = await res.json();
                    if (!data.ok) {
                        meta.textContent = 'offline';
                        setGateMsg(data.error || 'No se pudo iniciar sesión Claude', 'err');
                        return;
                    }
                    meta.textContent = (data.cli_version || 'claude') + ' · ' + (data.resource || 'claude-code-action');
                    if (data.authenticated) {
                        authenticated = true;
                        showTerminal();
                        append('<div class="boot-line">Claude Code · l8 codespace</div>');
                        append('<div class="boot-line">Resource: anthropics/claude-code-action</div>');
                        if (data.message) append('<div class="info">' + escapeHtml(data.message) + '</div>');
                        append('<div class="ok">Authenticated via ' + escapeHtml(data.auth_method || 'oauth') + '</div>');
                        append('<div class="info">Escribe un prompt o <span class="cmd">help</span>. Workdir: ' + escapeHtml(data.cwd_display || '~/workspace') + '</div><br>');
                    } else {
                        setGateMsg(data.message || 'Inicia sesión OAuth para continuar.', '');
                        meta.textContent = 'login required';
                    }
                } catch (e) {
                    meta.textContent = 'error';
                    setGateMsg(e.message || String(e), 'err');
                }
            }

            async function connectAuth() {
                const oauth = document.getElementById('oauthToken').value.trim();
                const apiKey = document.getElementById('apiKey').value.trim();
                if (!oauth && !apiKey) {
                    setGateMsg('Pega un CLAUDE_CODE_OAUTH_TOKEN o una ANTHROPIC_API_KEY.', 'err');
                    return;
                }
                const btn = document.getElementById('btnConnect');
                btn.disabled = true;
                setGateMsg('Conectando…', '');
                try {
                    const res = await fetch(l8ApiUrl('api/claude/auth'), {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ oauth_token: oauth, api_key: apiKey })
                    });
                    const data = await res.json();
                    if (!data.ok) {
                        setGateMsg(data.error || 'Auth falló', 'err');
                        return;
                    }
                    setGateMsg('Login successful', 'ok');
                    document.getElementById('oauthToken').value = '';
                    document.getElementById('apiKey').value = '';
                    await boot();
                } catch (e) {
                    setGateMsg(e.message || String(e), 'err');
                } finally {
                    btn.disabled = false;
                }
            }

            async function logout() {
                try {
                    await fetch(l8ApiUrl('api/claude/auth'), {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ logout: true })
                    });
                } catch (e) {}
                out.innerHTML = '';
                showGate();
                meta.textContent = 'logged out';
                setGateMsg('Sesión cerrada. Inicia sesión OAuth de nuevo.', '');
            }

            async function runPrompt(prompt) {
                if (!prompt || busy) return;
                busy = true;
                append('<div><span class="prompt">claude&gt;</span> <span class="cmd">' + escapeHtml(prompt) + '</span></div>');
                try {
                    const res = await fetch(l8ApiUrl('api/claude/exec'), {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ prompt: prompt })
                    });
                    const data = await res.json();
                    if (data.needs_auth) {
                        append('<div class="err">Sesión expirada — vuelve a iniciar OAuth.</div>');
                        showGate();
                        setGateMsg(data.error || 'Requiere autenticación', 'err');
                        return;
                    }
                    if (data.stdout) append('<div>' + escapeHtml(data.stdout).replace(/\n/g, '<br>') + '</div>');
                    if (data.stderr) append('<div class="err">' + escapeHtml(data.stderr).replace(/\n/g, '<br>') + '</div>');
                    if (!data.ok && !data.stdout && !data.stderr) {
                        append('<div class="err">' + escapeHtml(data.error || 'Claude Code falló') + '</div>');
                    }
                } catch (e) {
                    append('<div class="err">' + escapeHtml(e.message || String(e)) + '</div>');
                } finally {
                    busy = false;
                    input.focus();
                }
            }

            document.getElementById('btnOpenOauth').addEventListener('click', () => {
                window.open('https://claude.ai/login', 'claude-oauth', 'noopener,noreferrer,width=980,height=720');
            });
            document.getElementById('btnOpenDocs').addEventListener('click', () => {
                window.open('https://code.claude.com/docs/en/authentication', '_blank', 'noopener,noreferrer');
            });
            document.getElementById('btnConnect').addEventListener('click', connectAuth);
            document.getElementById('btnLogout').addEventListener('click', logout);
            document.getElementById('btnHelp').addEventListener('click', () => runPrompt('help'));

            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const prompt = input.value.trim();
                if (!prompt) return;
                history.push(prompt);
                histIdx = history.length;
                input.value = '';
                runPrompt(prompt);
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
