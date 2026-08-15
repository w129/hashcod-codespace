<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LibreOffice · l8 codespace</title>
    <link rel="icon" href="/libreoffice-dock.svg?v=1" type="image/svg+xml">
    <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg: #0f1419;
            --panel: #18202a;
            --fg: #e8eef4;
            --muted: #8b9aab;
            --accent: #18a303;
            --accent-2: #00a3e0;
            --border: #2a3644;
            --ok: #3dd68c;
            --err: #f07178;
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
            min-height: 100%;
            display: flex;
            flex-direction: column;
            background:
                radial-gradient(ellipse 80% 50% at 12% 0%, rgba(24, 163, 3, 0.18), transparent 55%),
                radial-gradient(ellipse 60% 40% at 90% 10%, rgba(0, 163, 224, 0.12), transparent 50%),
                linear-gradient(180deg, #121820 0%, #0f1419 100%);
        }
        .titlebar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            padding: 12px 18px;
            border-bottom: 1px solid var(--border);
            background: rgba(24, 32, 42, 0.92);
            backdrop-filter: blur(12px);
        }
        .brand {
            display: flex;
            align-items: center;
            gap: 12px;
            min-width: 0;
        }
        .brand img {
            width: 28px;
            height: 28px;
            display: block;
            filter: brightness(0) invert(1);
        }
        .brand h1 {
            margin: 0;
            font-size: 16px;
            font-weight: 700;
            letter-spacing: -0.02em;
        }
        .brand p {
            margin: 2px 0 0;
            font-size: 12px;
            color: var(--muted);
        }
        .actions {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        }
        .btn {
            appearance: none;
            border: 1px solid var(--border);
            background: var(--panel);
            color: var(--fg);
            font: inherit;
            font-size: 13px;
            font-weight: 600;
            padding: 9px 14px;
            border-radius: 10px;
            cursor: pointer;
        }
        .btn.primary {
            background: linear-gradient(135deg, #18a303, #128a02);
            border-color: transparent;
            color: #fff;
            box-shadow: 0 8px 18px -8px rgba(24, 163, 3, 0.55);
        }
        .btn:disabled { opacity: 0.55; cursor: default; }
        .body {
            flex: 1;
            padding: 20px 18px 28px;
            display: grid;
            gap: 16px;
            max-width: 1100px;
            width: 100%;
            margin: 0 auto;
        }
        .card {
            background: rgba(24, 32, 42, 0.9);
            border: 1px solid var(--border);
            border-radius: 14px;
            padding: 16px 18px;
        }
        .card h2 {
            margin: 0 0 10px;
            font-size: 14px;
            font-weight: 700;
            color: #cfe7d4;
        }
        .badges {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-bottom: 12px;
        }
        .badge {
            display: inline-flex;
            align-items: center;
            height: 26px;
            padding: 0 10px;
            border-radius: 999px;
            font-size: 11px;
            font-weight: 700;
            border: 1px solid var(--border);
            background: #121820;
            color: var(--muted);
        }
        .badge.on {
            background: rgba(24, 163, 3, 0.16);
            border-color: rgba(24, 163, 3, 0.45);
            color: #8dff7a;
        }
        .badge.off {
            background: rgba(240, 113, 120, 0.12);
            border-color: rgba(240, 113, 120, 0.35);
            color: #ffb4b8;
        }
        .meta {
            font-family: 'IBM Plex Mono', ui-monospace, monospace;
            font-size: 12px;
            line-height: 1.55;
            color: var(--muted);
            word-break: break-all;
        }
        .meta strong { color: var(--fg); font-weight: 600; }
        .tree {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
            gap: 8px;
            margin-top: 10px;
        }
        .tree span {
            font-family: 'IBM Plex Mono', ui-monospace, monospace;
            font-size: 11px;
            padding: 8px 10px;
            border-radius: 8px;
            background: #0f1419;
            border: 1px solid var(--border);
            color: #c5d2de;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .msg {
            margin: 0;
            font-size: 13px;
            color: var(--muted);
            min-height: 1.2em;
        }
        .msg.ok { color: var(--ok); }
        .msg.err { color: var(--err); }
        .log {
            margin-top: 10px;
            max-height: 220px;
            overflow: auto;
            font-family: 'IBM Plex Mono', ui-monospace, monospace;
            font-size: 11px;
            line-height: 1.45;
            white-space: pre-wrap;
            background: #0a0e13;
            border: 1px solid var(--border);
            border-radius: 10px;
            padding: 10px 12px;
            color: #9fb0c0;
        }
    </style>
</head>
<body>
    <div class="shell">
        <header class="titlebar">
            <div class="brand">
                <img src="/libreoffice-dock.svg?v=1" alt="">
                <div>
                    <h1>LibreOffice</h1>
                    <p>Core en la plataforma servidor · MPL-2.0</p>
                </div>
            </div>
            <div class="actions">
                <button type="button" class="btn" id="btnRefresh">Actualizar</button>
                <button type="button" class="btn primary" id="btnDeploy">Desplegar / asegurar clone</button>
            </div>
        </header>
        <main class="body">
            <section class="card">
                <h2>Estado en el servidor</h2>
                <div class="badges" id="badges"></div>
                <div class="meta" id="meta">Cargando…</div>
                <p class="msg" id="msg">Pulsa Desplegar para clonar o verificar LibreOffice core.</p>
                <div class="log" id="log" hidden></div>
            </section>
            <section class="card">
                <h2>Árbol superior del código</h2>
                <div class="tree" id="tree"></div>
            </section>
        </main>
    </div>
    <script>
    (function () {
        const badges = document.getElementById('badges');
        const meta = document.getElementById('meta');
        const msg = document.getElementById('msg');
        const tree = document.getElementById('tree');
        const log = document.getElementById('log');
        const btnRefresh = document.getElementById('btnRefresh');
        const btnDeploy = document.getElementById('btnDeploy');

        function setMsg(text, kind) {
            msg.textContent = text || '';
            msg.className = 'msg' + (kind ? ' ' + kind : '');
        }

        function fmtBytes(n) {
            n = Number(n || 0);
            if (n < 1024) return n + ' B';
            if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
            if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + ' MB';
            return (n / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
        }

        function render(st) {
            const cloned = !!(st && st.cloned);
            badges.innerHTML =
                '<span class="badge ' + (cloned ? 'on' : 'off') + '">' + (cloned ? 'Desplegado' : 'No clonado') + '</span>' +
                '<span class="badge">MPL-2.0</span>' +
                (st && st.branch ? '<span class="badge">' + st.branch + '</span>' : '') +
                (st && st.files != null ? '<span class="badge">' + Number(st.files).toLocaleString('es-ES') + ' archivos</span>' : '');

            meta.innerHTML =
                '<div><strong>Ruta</strong> · ' + (st.path || '—') + '</div>' +
                '<div><strong>Commit</strong> · ' + (st.last_commit || '—') + '</div>' +
                '<div><strong>Tamaño</strong> · ' + (st.bytes != null ? fmtBytes(st.bytes) : '—') + '</div>' +
                '<div><strong>FreeDesktop</strong> · ' + (st.remote_url || '—') + '</div>' +
                '<div><strong>Mirror</strong> · ' + (st.mirror_url || '—') + '</div>';

            const tops = (st && Array.isArray(st.top_level)) ? st.top_level : [];
            tree.innerHTML = tops.length
                ? tops.map(function (n) { return '<span title="' + n + '">' + n + '</span>'; }).join('')
                : '<span style="grid-column:1/-1;opacity:.7">Sin árbol aún. Despliega el clone.</span>';
        }

        async function api(path, opts) {
            const res = await fetch(path, Object.assign({
                headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' }
            }, opts || {}));
            try { return await res.json(); } catch (e) { return { ok: false, error: 'Respuesta inválida' }; }
        }

        async function refresh() {
            setMsg('Consultando estado…');
            const st = await api('/api/libreoffice/status');
            render(st);
            setMsg(st && st.cloned ? 'LibreOffice core listo en el servidor.' : 'Aún no hay clone. Pulsa Desplegar.', st && st.cloned ? 'ok' : null);
        }

        async function deploy() {
            btnDeploy.disabled = true;
            setMsg('Desplegando LibreOffice core en el servidor (puede tardar)…');
            log.hidden = false;
            log.textContent = 'ensure…\n';
            try {
                const st = await api('/api/libreoffice/ensure', { method: 'POST', body: '{}' });
                render(st);
                if (st && st.ensure && st.ensure.raw_output) {
                    log.textContent = String(st.ensure.raw_output).slice(-4000);
                } else {
                    log.textContent = JSON.stringify(st, null, 2).slice(0, 4000);
                }
                setMsg(st && st.ok ? (st.message || 'Listo.') : (st.error || 'Falló el despliegue'), st && st.ok ? 'ok' : 'err');
            } catch (e) {
                setMsg('Error de red al desplegar', 'err');
            } finally {
                btnDeploy.disabled = false;
            }
        }

        btnRefresh.addEventListener('click', refresh);
        btnDeploy.addEventListener('click', deploy);
        refresh();
    })();
    </script>
</body>
</html>
