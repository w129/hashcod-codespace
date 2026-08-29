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
    <title>PRS Code · l8 codespace</title>
    <base href="<?php echo htmlspecialchars($L8_BASE, ENT_QUOTES, 'UTF-8'); ?>">
    <script>window.L8_BASE_PATH = <?php echo json_encode($L8_BASE, JSON_UNESCAPED_SLASHES); ?>;</script>
    <link rel="icon" href="assets/icons/prs-code-icon.svg" type="image/svg+xml">
    <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg: #0b0d10;
            --panel: #14181f;
            --fg: #f2f4f7;
            --muted: #9aa3b2;
            --accent: #3dd6c6;
            --border: #2a3140;
            --ok: #7ddea5;
            --err: #f07178;
            --editor: #0f1318;
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
            min-height: 100%;
            height: 100%;
        }

        /* Boot: icono + reload girando */
        .boot {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 28px;
            padding: 32px 20px;
            background:
                radial-gradient(ellipse 70% 45% at 50% 35%, rgba(61, 214, 198, 0.08), transparent 60%),
                var(--bg);
        }
        .boot.hidden { display: none; }
        .boot-icon {
            width: min(120px, 34vw);
            height: auto;
            filter: drop-shadow(0 8px 28px rgba(0, 0, 0, 0.45));
        }
        .boot-reload {
            width: 42px;
            height: 42px;
            color: var(--accent);
            animation: prs-spin 1.05s linear infinite;
        }
        @keyframes prs-spin {
            to { transform: rotate(360deg); }
        }
        .boot-title {
            margin: 0;
            font-size: 22px;
            font-weight: 600;
            letter-spacing: 0.02em;
        }
        .boot-sub {
            margin: 0;
            max-width: 420px;
            text-align: center;
            color: var(--muted);
            font-size: 13px;
            line-height: 1.5;
        }

        .ide { display: none; flex: 1; flex-direction: column; min-height: 0; }
        .ide.visible { display: flex; }

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
        .brand img { width: 28px; height: 28px; flex: 0 0 auto; }
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

        .advantage {
            padding: 10px 16px;
            border-bottom: 1px solid var(--border);
            background: rgba(61, 214, 198, 0.06);
            color: var(--muted);
            font-size: 12.5px;
            line-height: 1.45;
        }
        .advantage strong { color: var(--fg); font-weight: 600; }

        .toolbar {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 8px;
            padding: 10px 14px;
            border-bottom: 1px solid var(--border);
            background: #10141a;
        }
        .toolbar select,
        .toolbar input,
        .toolbar button {
            font-family: 'IBM Plex Mono', monospace;
            font-size: 12px;
            border-radius: 6px;
            border: 1px solid var(--border);
            background: var(--panel);
            color: var(--fg);
            padding: 7px 10px;
        }
        .toolbar button {
            cursor: pointer;
            background: #1b2430;
        }
        .toolbar button.primary {
            background: var(--accent);
            color: #06221f;
            border-color: transparent;
            font-weight: 600;
        }
        .toolbar button:hover { filter: brightness(1.08); }
        .toolbar .grow { flex: 1; min-width: 140px; }

        .workspace {
            flex: 1;
            min-height: 0;
            display: grid;
            grid-template-columns: 1fr 280px;
        }
        @media (max-width: 860px) {
            .workspace { grid-template-columns: 1fr; grid-template-rows: 1fr auto; }
        }

        .editor-wrap {
            display: flex;
            flex-direction: column;
            min-height: 0;
            border-right: 1px solid var(--border);
        }
        #codeEditor {
            flex: 1;
            min-height: 260px;
            width: 100%;
            resize: none;
            border: none;
            outline: none;
            padding: 16px;
            background: var(--editor);
            color: #e8edf5;
            font-family: 'IBM Plex Mono', monospace;
            font-size: 13.5px;
            line-height: 1.55;
            caret-color: var(--accent);
        }
        #codeEditor::placeholder { color: #5d6675; }

        .side {
            display: flex;
            flex-direction: column;
            min-height: 0;
            background: var(--panel);
        }
        .side h2 {
            margin: 0;
            padding: 12px 14px;
            font-size: 12px;
            letter-spacing: 0.06em;
            text-transform: uppercase;
            color: var(--muted);
            border-bottom: 1px solid var(--border);
        }
        #shareOut, #lintOut {
            padding: 12px 14px;
            font-family: 'IBM Plex Mono', monospace;
            font-size: 12px;
            line-height: 1.5;
            color: var(--muted);
            white-space: pre-wrap;
            word-break: break-word;
        }
        #shareOut .ok { color: var(--ok); }
        #shareOut .err { color: var(--err); }
        #shareCode {
            display: block;
            margin-top: 8px;
            font-size: 18px;
            font-weight: 600;
            color: var(--accent);
            letter-spacing: 0.08em;
        }
        .hint {
            padding: 0 14px 14px;
            color: var(--muted);
            font-size: 12px;
            line-height: 1.45;
        }
    </style>
</head>
<body>
    <div class="shell">
        <div class="boot" id="bootScreen" aria-live="polite">
            <img class="boot-icon" src="/assets/icons/prs-code-icon.svg" width="120" height="120" alt="PRS Code">
            <svg class="boot-reload" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
                <path d="M12 6V3L8 7l4 4V8c2.76 0 5 2.24 5 5a5 5 0 0 1-8.9 3.1l-1.46 1.46A7 7 0 0 0 19 13c0-3.87-3.13-7-7-7zm-5 5a5 5 0 0 1 8.9-3.1l1.46-1.46A7 7 0 0 0 5 13c0 3.87 3.13 7 7 7v3l4-4-4-4v3c-2.76 0-5-2.24-5-5z"/>
            </svg>
            <p class="boot-title">PRS Code</p>
            <p class="boot-sub">Conectando el IDE de paste code en el cluster… tu laptop actúa solo como pantalla fluida.</p>
        </div>

        <div class="ide" id="ideScreen">
            <div class="titlebar">
                <div class="brand">
                    <img src="/assets/icons/prs-code-icon.svg" alt="" width="28" height="28">
                    <div>
                        <h1>PRS Code</h1>
                        <span>Paste · share by selection · thin client</span>
                    </div>
                </div>
                <div class="meta" id="metaInfo">online</div>
            </div>

            <div class="advantage">
                <strong>Ventaja thin client:</strong>
                el backend del IDE (compilador, indexador, linters) corre en un cluster de servidores virtuales ultrarrápidos en la nube, mientras que tu laptop solo actúa como una pantalla fluida, eliminando el consumo de batería y calentamiento.
            </div>

            <div class="toolbar">
                <select id="langSelect" aria-label="Lenguaje">
                    <option value="javascript">JavaScript</option>
                    <option value="typescript">TypeScript</option>
                    <option value="python">Python</option>
                    <option value="php">PHP</option>
                    <option value="html">HTML</option>
                    <option value="css">CSS</option>
                    <option value="json">JSON</option>
                    <option value="markdown">Markdown</option>
                    <option value="text">Plain text</option>
                </select>
                <button type="button" class="primary" id="btnShareSelection">Compartir selección</button>
                <button type="button" id="btnShareAll">Compartir todo</button>
                <button type="button" id="btnAnalyze">Analizar en cluster</button>
                <input class="grow" id="loadCodeInput" type="text" placeholder="Código PRS-…" spellcheck="false" autocomplete="off">
                <button type="button" id="btnLoad">Abrir</button>
            </div>

            <div class="workspace">
                <div class="editor-wrap">
                    <textarea id="codeEditor" spellcheck="false" placeholder="// Pega código aquí. Selecciona un fragmento y pulsa «Compartir selección»."></textarea>
                </div>
                <aside class="side">
                    <h2>Compartir</h2>
                    <div id="shareOut">Selecciona texto en el editor para generar un enlace de compartición.</div>
                    <p class="hint">La compartición es por selección: solo viaja al cluster el fragmento elegido, no toda la sesión local.</p>
                    <h2>Cluster / lint</h2>
                    <div id="lintOut">Esperando análisis en el servidor…</div>
                </aside>
            </div>
        </div>
    </div>

    <script>
        (function () {
            const boot = document.getElementById('bootScreen');
            const ide = document.getElementById('ideScreen');
            const meta = document.getElementById('metaInfo');
            const editor = document.getElementById('codeEditor');
            const langSelect = document.getElementById('langSelect');
            const shareOut = document.getElementById('shareOut');
            const lintOut = document.getElementById('lintOut');
            const loadInput = document.getElementById('loadCodeInput');

            const params = new URLSearchParams(location.search);
            const initialCode = (params.get('code') || '').trim();

            function escapeHtml(s) {
                return String(s)
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;');
            }

            function getSelectionText() {
                const start = editor.selectionStart;
                const end = editor.selectionEnd;
                if (typeof start === 'number' && typeof end === 'number' && end > start) {
                    return {
                        text: editor.value.slice(start, end),
                        start,
                        end,
                        full: false
                    };
                }
                return null;
            }

            function l8ApiUrl(path) {
                const base = window.L8_BASE_PATH || (document.querySelector('base')?.getAttribute('href')) || '';
                const cleanPath = path.startsWith('/') ? path.slice(1) : path;
                const cleanBase = base.endsWith('/') ? base : (base ? base + '/' : '');
                return cleanBase + cleanPath;
            }

            async function bootSession() {
                const started = Date.now();
                try {
                    const res = await fetch(l8ApiUrl('api/prs/session'), {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: '{}'
                    });
                    const data = await res.json();
                    if (!data.ok) throw new Error(data.error || 'boot failed');
                    meta.textContent = (data.cluster || 'prs-cluster') + ' · thin-client';
                    lintOut.textContent = data.message || 'Cluster listo. Compilador, indexador y linters en la nube.';
                } catch (e) {
                    meta.textContent = 'degraded';
                    lintOut.innerHTML = '<span class="err">Boot parcial: ' + escapeHtml(e.message || String(e)) + '</span>';
                }
                // Mantener el icono + reload visible un momento al inicio
                const wait = Math.max(0, 1100 - (Date.now() - started));
                await new Promise((r) => setTimeout(r, wait));
                boot.classList.add('hidden');
                ide.classList.add('visible');
                editor.focus();
                if (initialCode) {
                    loadInput.value = initialCode;
                    loadPaste(initialCode);
                }
            }

            async function sharePaste(text, selectionOnly) {
                if (!text || !String(text).trim()) {
                    shareOut.innerHTML = '<span class="err">No hay texto para compartir. Selecciona un fragmento en el editor.</span>';
                    return;
                }
                shareOut.textContent = 'Publicando selección en el cluster…';
                try {
                    const res = await fetch(l8ApiUrl('api/prs/share'), {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            code: text,
                            language: langSelect.value,
                            selection_only: !!selectionOnly,
                            title: selectionOnly ? 'selection' : 'full'
                        })
                    });
                    const data = await res.json();
                    if (!data.ok) throw new Error(data.error || 'share failed');
                    const url = location.origin + '/prs-code?code=' + encodeURIComponent(data.share_code);
                    shareOut.innerHTML =
                        '<span class="ok">Compartido' + (selectionOnly ? ' (selección)' : '') + '</span>\n' +
                        '<span id="shareCode">' + escapeHtml(data.share_code) + '</span>\n' +
                        '<a href="' + escapeHtml(url) + '" style="color:#9ed9ff;word-break:break-all;">' + escapeHtml(url) + '</a>';
                    try { await navigator.clipboard.writeText(url); } catch (_) {}
                } catch (e) {
                    shareOut.innerHTML = '<span class="err">' + escapeHtml(e.message || String(e)) + '</span>';
                }
            }

            async function loadPaste(code) {
                const c = String(code || '').trim();
                if (!c) return;
                shareOut.textContent = 'Cargando ' + c + '…';
                try {
                    const res = await fetch(l8ApiUrl('api/prs/paste/' + encodeURIComponent(c)));
                    const data = await res.json();
                    if (!data.ok) throw new Error(data.error || 'not found');
                    editor.value = data.content || '';
                    if (data.language) langSelect.value = data.language;
                    shareOut.innerHTML = '<span class="ok">Paste cargado:</span> ' + escapeHtml(data.share_code) +
                        (data.selection_only ? ' (selección)' : '');
                    analyze();
                } catch (e) {
                    shareOut.innerHTML = '<span class="err">' + escapeHtml(e.message || String(e)) + '</span>';
                }
            }

            async function analyze() {
                lintOut.textContent = 'Analizando en cluster…';
                try {
                    const res = await fetch(l8ApiUrl('api/prs/analyze'), {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            code: editor.value,
                            language: langSelect.value
                        })
                    });
                    const data = await res.json();
                    if (!data.ok) throw new Error(data.error || 'analyze failed');
                    const notes = (data.notes || []).map((n) => '• ' + n).join('\n');
                    lintOut.textContent =
                        'Lenguaje: ' + (data.language || langSelect.value) + '\n' +
                        'Líneas: ' + (data.lines || 0) + ' · Bytes: ' + (data.bytes || 0) + '\n' +
                        'Motor: ' + (data.engine || 'prs-cluster') + '\n' +
                        (notes || '• Sin avisos');
                } catch (e) {
                    lintOut.textContent = 'Error de análisis: ' + (e.message || String(e));
                }
            }

            document.getElementById('btnShareSelection').addEventListener('click', () => {
                const sel = getSelectionText();
                if (!sel) {
                    shareOut.innerHTML = '<span class="err">Selecciona un fragmento en el editor primero.</span>';
                    return;
                }
                sharePaste(sel.text, true);
            });
            document.getElementById('btnShareAll').addEventListener('click', () => {
                sharePaste(editor.value, false);
            });
            document.getElementById('btnAnalyze').addEventListener('click', analyze);
            document.getElementById('btnLoad').addEventListener('click', () => loadPaste(loadInput.value));
            loadInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    loadPaste(loadInput.value);
                }
            });

            bootSession();
        })();
    </script>
</body>
</html>
