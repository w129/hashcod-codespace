<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LibreOffice · l8 codespace</title>
    <link rel="icon" href="/libreoffice-dock.svg?v=2" type="image/svg+xml">
    <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg: #0f1419;
            --panel: #18202a;
            --fg: #e8eef4;
            --muted: #8b9aab;
            --accent: #18a303;
            --border: #2a3644;
            --ok: #3dd68c;
            --err: #f07178;
        }
        * { box-sizing: border-box; }
        html, body { margin: 0; height: 100%; background: var(--bg); color: var(--fg); font-family: 'IBM Plex Sans', system-ui, sans-serif; }
        .shell {
            min-height: 100%;
            display: flex;
            flex-direction: column;
            background:
                radial-gradient(ellipse 80% 50% at 12% 0%, rgba(24,163,3,.18), transparent 55%),
                linear-gradient(180deg, #121820 0%, #0f1419 100%);
        }
        .titlebar {
            display: flex; align-items: center; justify-content: space-between; gap: 12px;
            padding: 12px 18px; border-bottom: 1px solid var(--border); background: rgba(24,32,42,.92);
        }
        .brand { display: flex; align-items: center; gap: 12px; min-width: 0; }
        .brand img { width: 28px; height: 28px; filter: brightness(0) invert(1); }
        .brand h1 { margin: 0; font-size: 16px; font-weight: 700; }
        .brand p { margin: 2px 0 0; font-size: 12px; color: var(--muted); }
        .actions { display: flex; flex-wrap: wrap; gap: 8px; }
        .btn {
            appearance: none; border: 1px solid var(--border); background: var(--panel); color: var(--fg);
            font: 600 13px/1.2 'IBM Plex Sans', system-ui, sans-serif; padding: 9px 14px; border-radius: 10px; cursor: pointer;
        }
        .btn.primary { background: linear-gradient(135deg,#18a303,#128a02); border-color: transparent; color: #fff; }
        .btn:disabled { opacity: .55; cursor: default; }
        .body { flex: 1; padding: 18px; display: grid; gap: 16px; max-width: 1180px; width: 100%; margin: 0 auto; }
        .card { background: rgba(24,32,42,.92); border: 1px solid var(--border); border-radius: 14px; padding: 16px 18px; }
        .card h2 { margin: 0 0 12px; font-size: 14px; font-weight: 700; color: #cfe7d4; }
        .badges { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
        .badge { font-size: 11px; font-weight: 600; padding: 4px 9px; border-radius: 999px; border: 1px solid var(--border); background: #1a2430; }
        .badge.on { border-color: var(--accent); color: var(--ok); }
        .badge.off { border-color: #8a3038; color: var(--err); }
        .msg { margin: 10px 0 0; font-size: 13px; color: var(--muted); }
        .msg.ok { color: var(--ok); } .msg.err { color: var(--err); }
        .tools {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            gap: 12px;
        }
        .tool {
            appearance: none; border: 1px solid var(--border); background: #121820; color: var(--fg);
            border-radius: 14px; padding: 16px 12px; cursor: pointer; text-align: left;
            display: flex; flex-direction: column; gap: 8px; min-height: 118px;
            transition: transform .15s ease, border-color .15s ease, background .15s ease;
        }
        .tool:hover { transform: translateY(-2px); border-color: #3d5166; background: #16202b; }
        .tool .swatch {
            width: 36px; height: 36px; border-radius: 10px; display: grid; place-items: center;
            font-weight: 800; color: #fff; font-size: 14px;
        }
        .tool strong { font-size: 14px; }
        .tool span { font-size: 12px; color: var(--muted); }
        .workspace { display: none; }
        .workspace.open { display: block; }
        .ws-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 12px; flex-wrap: wrap; }
        .ws-head h3 { margin: 0; font-size: 15px; }
        .editor {
            width: 100%; min-height: 320px; border: 1px solid var(--border); border-radius: 10px;
            background: #fff; color: #111; padding: 14px; outline: none; font: 15px/1.5 'IBM Plex Sans', system-ui, sans-serif;
        }
        .sheet { overflow: auto; border: 1px solid var(--border); border-radius: 10px; background: #fff; }
        .sheet table { border-collapse: collapse; width: 100%; min-width: 640px; color: #111; }
        .sheet th, .sheet td { border: 1px solid #d8dde3; padding: 0; }
        .sheet th { background: #eef2f6; font-size: 11px; padding: 6px; }
        .sheet input {
            width: 100%; border: 0; padding: 8px; font: 13px/1.2 'IBM Plex Mono', monospace; background: transparent; color: #111;
        }
        .slides { display: grid; gap: 10px; }
        .slide {
            border: 1px solid var(--border); border-radius: 10px; padding: 12px; background: #10161d;
        }
        .slide input, .slide textarea {
            width: 100%; border: 1px solid var(--border); border-radius: 8px; background: #0c1117; color: var(--fg);
            padding: 8px 10px; font: inherit; margin-top: 6px;
        }
        .slide textarea { min-height: 72px; resize: vertical; }
        #drawCanvas { width: 100%; max-width: 100%; height: 360px; border-radius: 10px; background: #fff; cursor: crosshair; touch-action: none; }
        .base-table { width: 100%; border-collapse: collapse; color: var(--fg); }
        .base-table th, .base-table td { border: 1px solid var(--border); padding: 8px; }
        .base-table input { width: 100%; border: 0; background: transparent; color: var(--fg); font: inherit; }
        .math-box, .chart-box { display: grid; gap: 10px; }
        .math-box textarea, .chart-box textarea {
            width: 100%; min-height: 100px; border-radius: 10px; border: 1px solid var(--border);
            background: #0c1117; color: var(--fg); padding: 10px; font: 14px/1.4 'IBM Plex Mono', monospace;
        }
        .math-preview, .chart-preview {
            border: 1px solid var(--border); border-radius: 10px; padding: 16px; background: #10161d; min-height: 80px;
        }
        .bars { display: flex; align-items: flex-end; gap: 10px; height: 180px; padding: 8px 4px 0; }
        .bars .bar-wrap { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px; height: 100%; justify-content: flex-end; }
        .bars .bar { width: 100%; max-width: 48px; border-radius: 6px 6px 0 0; background: linear-gradient(180deg,#3dd68c,#18a303); }
        .bars span { font-size: 11px; color: var(--muted); }
        .hidden { display: none !important; }
    </style>
</head>
<body>
<div class="shell">
    <header class="titlebar">
        <div class="brand">
            <img src="/libreoffice-dock.svg?v=2" alt="">
            <div>
                <h1>LibreOffice</h1>
                <p>Suite en la plataforma servidor · MPL-2.0</p>
            </div>
        </div>
        <div class="actions">
            <button type="button" class="btn" id="btnRefresh">Actualizar</button>
            <button type="button" class="btn primary" id="btnDeploy">Desplegar suite</button>
        </div>
    </header>
    <main class="body">
        <section class="card">
            <h2>Estado en el servidor</h2>
            <div class="badges" id="badges"></div>
            <p class="msg" id="msg">Preparando…</p>
        </section>
        <section class="card" id="toolsCard">
            <h2>Herramientas LibreOffice</h2>
            <div class="tools" id="tools"></div>
        </section>
        <section class="card workspace" id="workspace">
            <div class="ws-head">
                <h3 id="wsTitle">Herramienta</h3>
                <div class="actions">
                    <button type="button" class="btn" id="btnBack">← Suite</button>
                    <button type="button" class="btn primary" id="btnSave">Guardar</button>
                </div>
            </div>
            <div id="wsBody"></div>
            <p class="msg" id="wsMsg"></p>
        </section>
    </main>
</div>
<script>
(function () {
    const badges = document.getElementById('badges');
    const msg = document.getElementById('msg');
    const toolsEl = document.getElementById('tools');
    const toolsCard = document.getElementById('toolsCard');
    const workspace = document.getElementById('workspace');
    const wsTitle = document.getElementById('wsTitle');
    const wsBody = document.getElementById('wsBody');
    const wsMsg = document.getElementById('wsMsg');
    let activeTool = null;
    let docState = null;

    function setMsg(text, kind) {
        msg.textContent = text || '';
        msg.className = 'msg' + (kind ? ' ' + kind : '');
    }
    function setWsMsg(text, kind) {
        wsMsg.textContent = text || '';
        wsMsg.className = 'msg' + (kind ? ' ' + kind : '');
    }

    async function api(path, opts) {
        const res = await fetch(path, Object.assign({
            headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' }
        }, opts || {}));
        try { return await res.json(); } catch (e) { return { ok: false, error: 'Respuesta inválida' }; }
    }

    function renderTools(list) {
        const tools = Array.isArray(list) ? list : [];
        toolsEl.innerHTML = tools.map(function (t) {
            const letter = String(t.name || t.id || '?').charAt(0).toUpperCase();
            const color = t.color || '#18a303';
            return '<button type="button" class="tool" data-tool="' + t.id + '">' +
                '<div class="swatch" style="background:' + color + '">' + letter + '</div>' +
                '<strong>' + (t.name || t.id) + '</strong>' +
                '<span>' + (t.desc || t.label || '') + '</span>' +
                '</button>';
        }).join('');
        toolsEl.querySelectorAll('.tool').forEach(function (btn) {
            btn.addEventListener('click', function () { openTool(btn.getAttribute('data-tool')); });
        });
    }

    function renderStatus(st) {
        const ready = !!(st && (st.suite_ready || st.ready));
        badges.innerHTML =
            '<span class="badge ' + (ready ? 'on' : 'off') + '">' + (ready ? 'Suite desplegada' : 'Sin desplegar') + '</span>' +
            '<span class="badge">MPL-2.0</span>' +
            '<span class="badge">' + ((st && st.tools && st.tools.length) || 7) + ' herramientas</span>';
        renderTools((st && st.tools) || []);
        setMsg(st && st.message ? st.message : (ready ? 'Listo.' : 'Pulsa Desplegar suite.'), ready ? 'ok' : null);
    }

    async function refresh() {
        setMsg('Consultando estado…');
        const st = await api('/api/libreoffice/status');
        renderStatus(st);
        if (st && !st.suite_ready) {
            // Auto-desplegar sin pedir cuenta
            const dep = await api('/api/libreoffice/ensure', { method: 'POST', body: '{}' });
            renderStatus(dep);
        }
    }

    async function deploy() {
        const btn = document.getElementById('btnDeploy');
        btn.disabled = true;
        setMsg('Desplegando suite completa en el servidor…');
        try {
            const st = await api('/api/libreoffice/ensure', { method: 'POST', body: '{}' });
            renderStatus(st);
            setMsg(st && st.ok ? (st.message || 'Suite lista.') : (st.error || 'Falló'), st && st.ok ? 'ok' : 'err');
        } finally {
            btn.disabled = false;
        }
    }

    function colName(i) {
        let n = i, s = '';
        while (n >= 0) { s = String.fromCharCode(65 + (n % 26)) + s; n = Math.floor(n / 26) - 1; }
        return s;
    }

    function renderWriter(doc) {
        wsBody.innerHTML = '<div class="editor" id="writerEd" contenteditable="true"></div>';
        document.getElementById('writerEd').innerHTML = doc.html || '<p></p>';
    }
    function collectWriter() {
        return { tool: 'writer', html: document.getElementById('writerEd').innerHTML, title: docState.title || 'Documento Writer' };
    }

    function renderCalc(doc) {
        const rows = Number(doc.rows || 12);
        const cols = Number(doc.cols || 8);
        const cells = doc.cells || {};
        let html = '<div class="sheet"><table><thead><tr><th></th>';
        for (let c = 0; c < cols; c++) html += '<th>' + colName(c) + '</th>';
        html += '</tr></thead><tbody>';
        for (let r = 1; r <= rows; r++) {
            html += '<tr><th>' + r + '</th>';
            for (let c = 0; c < cols; c++) {
                const key = colName(c) + r;
                const val = cells[key] != null ? String(cells[key]) : '';
                html += '<td><input data-cell="' + key + '" value="' + val.replace(/"/g, '&quot;') + '"></td>';
            }
            html += '</tr>';
        }
        html += '</tbody></table></div>';
        wsBody.innerHTML = html;
    }
    function collectCalc() {
        const cells = {};
        wsBody.querySelectorAll('input[data-cell]').forEach(function (inp) {
            if (inp.value !== '') cells[inp.getAttribute('data-cell')] = inp.value;
        });
        return { tool: 'calc', title: docState.title || 'Hoja Calc', rows: docState.rows || 12, cols: docState.cols || 8, cells: cells };
    }

    function renderImpress(doc) {
        const slides = Array.isArray(doc.slides) ? doc.slides : [];
        wsBody.innerHTML = '<div class="slides" id="slides">' + slides.map(function (s, i) {
            return '<div class="slide" data-i="' + i + '">' +
                '<div style="font-size:12px;color:#8b9aab">Diapositiva ' + (i + 1) + '</div>' +
                '<input data-f="title" value="' + String(s.title || '').replace(/"/g, '&quot;') + '">' +
                '<textarea data-f="body">' + String(s.body || '').replace(/</g, '&lt;') + '</textarea>' +
                '</div>';
        }).join('') + '</div>' +
        '<div class="actions" style="margin-top:10px"><button type="button" class="btn" id="btnAddSlide">+ Diapositiva</button></div>';
        document.getElementById('btnAddSlide').onclick = function () {
            docState.slides = collectImpress().slides;
            docState.slides.push({ title: 'Nueva diapositiva', body: '' });
            renderImpress(docState);
        };
    }
    function collectImpress() {
        const slides = [];
        wsBody.querySelectorAll('.slide').forEach(function (el) {
            slides.push({
                title: (el.querySelector('[data-f="title"]') || {}).value || '',
                body: (el.querySelector('[data-f="body"]') || {}).value || ''
            });
        });
        return { tool: 'impress', title: docState.title || 'Presentación Impress', slides: slides };
    }

    function renderDraw(doc) {
        wsBody.innerHTML = '<canvas id="drawCanvas" width="800" height="500"></canvas>' +
            '<div class="actions" style="margin-top:10px"><button type="button" class="btn" id="btnClearDraw">Limpiar</button></div>';
        const canvas = document.getElementById('drawCanvas');
        const ctx = canvas.getContext('2d');
        ctx.strokeStyle = '#111';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        const strokes = Array.isArray(doc.strokes) ? doc.strokes : [];
        function redraw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            strokes.forEach(function (stroke) {
                if (!stroke || stroke.length < 2) return;
                ctx.beginPath();
                ctx.moveTo(stroke[0][0], stroke[0][1]);
                for (let i = 1; i < stroke.length; i++) ctx.lineTo(stroke[i][0], stroke[i][1]);
                ctx.stroke();
            });
        }
        redraw();
        let drawing = false, current = [];
        function pos(ev) {
            const r = canvas.getBoundingClientRect();
            const x = ((ev.clientX || (ev.touches && ev.touches[0].clientX)) - r.left) * (canvas.width / r.width);
            const y = ((ev.clientY || (ev.touches && ev.touches[0].clientY)) - r.top) * (canvas.height / r.height);
            return [x, y];
        }
        function start(ev) { drawing = true; current = [pos(ev)]; ev.preventDefault(); }
        function move(ev) {
            if (!drawing) return;
            current.push(pos(ev));
            redraw();
            ctx.beginPath();
            ctx.moveTo(current[0][0], current[0][1]);
            for (let i = 1; i < current.length; i++) ctx.lineTo(current[i][0], current[i][1]);
            ctx.stroke();
            ev.preventDefault();
        }
        function end() {
            if (!drawing) return;
            drawing = false;
            if (current.length > 1) strokes.push(current);
            current = [];
            docState.strokes = strokes;
        }
        canvas.addEventListener('mousedown', start);
        canvas.addEventListener('mousemove', move);
        window.addEventListener('mouseup', end);
        canvas.addEventListener('touchstart', start, { passive: false });
        canvas.addEventListener('touchmove', move, { passive: false });
        canvas.addEventListener('touchend', end);
        document.getElementById('btnClearDraw').onclick = function () {
            strokes.length = 0;
            docState.strokes = [];
            redraw();
        };
        docState.strokes = strokes;
    }
    function collectDraw() {
        return {
            tool: 'draw',
            title: docState.title || 'Dibujo Draw',
            width: 800,
            height: 500,
            strokes: docState.strokes || []
        };
    }

    function renderBase(doc) {
        const fields = doc.fields || ['id', 'nombre', 'nota'];
        const rows = Array.isArray(doc.rows) ? doc.rows : [];
        let html = '<table class="base-table"><thead><tr>';
        fields.forEach(function (f) { html += '<th>' + f + '</th>'; });
        html += '</tr></thead><tbody>';
        rows.forEach(function (row, ri) {
            html += '<tr>';
            fields.forEach(function (f, fi) {
                html += '<td><input data-r="' + ri + '" data-c="' + fi + '" value="' + String(row[fi] != null ? row[fi] : '').replace(/"/g, '&quot;') + '"></td>';
            });
            html += '</tr>';
        });
        html += '</tbody></table>';
        html += '<div class="actions" style="margin-top:10px"><button type="button" class="btn" id="btnAddRow">+ Fila</button></div>';
        wsBody.innerHTML = html;
        document.getElementById('btnAddRow').onclick = function () {
            docState = collectBase();
            docState.rows.push(fields.map(function () { return ''; }));
            renderBase(docState);
        };
    }
    function collectBase() {
        const fields = docState.fields || ['id', 'nombre', 'nota'];
        const map = {};
        wsBody.querySelectorAll('input[data-r]').forEach(function (inp) {
            const r = Number(inp.getAttribute('data-r'));
            const c = Number(inp.getAttribute('data-c'));
            if (!map[r]) map[r] = [];
            map[r][c] = inp.value;
        });
        const rows = Object.keys(map).sort(function (a, b) { return a - b; }).map(function (k) { return map[k]; });
        return { tool: 'base', title: docState.title || 'Base de datos', fields: fields, rows: rows };
    }

    function renderMath(doc) {
        wsBody.innerHTML = '<div class="math-box"><textarea id="mathFormula"></textarea><div class="math-preview" id="mathPreview"></div></div>';
        const ta = document.getElementById('mathFormula');
        ta.value = doc.formula || '';
        function sync() { document.getElementById('mathPreview').textContent = ta.value || '—'; }
        ta.addEventListener('input', sync); sync();
    }
    function collectMath() {
        return { tool: 'math', title: docState.title || 'Fórmula Math', formula: document.getElementById('mathFormula').value };
    }

    function renderChart(doc) {
        wsBody.innerHTML = '<div class="chart-box">' +
            '<label style="font-size:12px;color:#8b9aab">Etiquetas (coma)</label>' +
            '<textarea id="chartLabels"></textarea>' +
            '<label style="font-size:12px;color:#8b9aab">Valores (coma)</label>' +
            '<textarea id="chartValues"></textarea>' +
            '<div class="chart-preview"><div class="bars" id="chartBars"></div></div>' +
            '</div>';
        const lab = document.getElementById('chartLabels');
        const val = document.getElementById('chartValues');
        lab.value = (doc.labels || []).join(', ');
        val.value = (doc.values || []).join(', ');
        function sync() {
            const labels = lab.value.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
            const values = val.value.split(',').map(function (s) { return Number(s.trim()) || 0; });
            const max = Math.max.apply(null, values.concat([1]));
            const el = document.getElementById('chartBars');
            el.innerHTML = labels.map(function (l, i) {
                const h = Math.max(4, Math.round((values[i] || 0) / max * 150));
                return '<div class="bar-wrap"><div class="bar" style="height:' + h + 'px"></div><span>' + l + '</span></div>';
            }).join('');
        }
        lab.addEventListener('input', sync);
        val.addEventListener('input', sync);
        sync();
    }
    function collectChart() {
        return {
            tool: 'chart',
            title: docState.title || 'Gráfico Chart',
            labels: document.getElementById('chartLabels').value.split(',').map(function (s) { return s.trim(); }).filter(Boolean),
            values: document.getElementById('chartValues').value.split(',').map(function (s) { return Number(s.trim()) || 0; })
        };
    }

    const renderers = {
        writer: renderWriter, calc: renderCalc, impress: renderImpress, draw: renderDraw,
        base: renderBase, math: renderMath, chart: renderChart
    };
    const collectors = {
        writer: collectWriter, calc: collectCalc, impress: collectImpress, draw: collectDraw,
        base: collectBase, math: collectMath, chart: collectChart
    };

    async function openTool(id) {
        setWsMsg('Cargando ' + id + '…');
        const doc = await api('/api/libreoffice/doc?tool=' + encodeURIComponent(id));
        if (!doc || doc.ok === false) {
            setWsMsg((doc && doc.error) || 'No se pudo abrir', 'err');
            return;
        }
        activeTool = id;
        docState = doc;
        wsTitle.textContent = (doc.title || id) + ' · LibreOffice';
        toolsCard.classList.add('hidden');
        workspace.classList.add('open');
        (renderers[id] || function () { wsBody.textContent = 'Herramienta no disponible'; })(doc);
        setWsMsg('Listo para editar. Pulsa Guardar para persistir en el servidor.', 'ok');
    }

    async function saveTool() {
        if (!activeTool || !collectors[activeTool]) return;
        setWsMsg('Guardando…');
        const payload = collectors[activeTool]();
        const res = await api('/api/libreoffice/doc', { method: 'POST', body: JSON.stringify(payload) });
        setWsMsg(res && res.ok ? 'Guardado en el servidor.' : ((res && res.error) || 'No se pudo guardar'), res && res.ok ? 'ok' : 'err');
    }

    function backToSuite() {
        activeTool = null;
        workspace.classList.remove('open');
        toolsCard.classList.remove('hidden');
        wsBody.innerHTML = '';
        setWsMsg('');
    }

    document.getElementById('btnRefresh').addEventListener('click', refresh);
    document.getElementById('btnDeploy').addEventListener('click', deploy);
    document.getElementById('btnBack').addEventListener('click', backToSuite);
    document.getElementById('btnSave').addEventListener('click', saveTool);
    refresh().then(function () {
        try {
            const q = new URLSearchParams(location.search || '');
            const tool = q.get('tool');
            if (tool) openTool(tool);
        } catch (e) {}
    });
})();
</script>
</body>
</html>
