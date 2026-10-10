/* Hashcod Vision: camera + Detectron2 detections (server side), log table and local video recording. */
(function () {
    'use strict';
    var FRAME_MS = 1200, MAX_W = 640, LOG_REFRESH_MS = 3000;
    var btn = null, ui = null, stream = null, recorder = null, chunks = [], detecting = false;
    var busy = false, timer = 0, lastLogAt = 0, recCount = 0;

    function el(tag, cls, text) {
        var n = document.createElement(tag);
        if (cls) n.className = cls;
        if (text != null) n.textContent = text;
        return n;
    }

    function headers() {
        var h = { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' };
        try {
            var tok = typeof window.l8GetAuthToken === 'function' ? window.l8GetAuthToken() : '';
            if (tok) h.Authorization = 'Bearer ' + tok;
        } catch (e) { /* no session token available */ }
        return h;
    }

    function api(path, opts) {
        return fetch('/api/vision/' + path, Object.assign({ headers: headers(), credentials: 'same-origin' }, opts || {}))
            .then(function (r) { return r.json().catch(function () { return { ok: false, error: 'Respuesta no válida' }; }); });
    }

    function say(text, isErr) {
        ui.msg.textContent = text || '';
        ui.msg.className = 'hashcod-vision-msg' + (isErr ? ' err' : '');
    }

    function build() {
        var overlay = el('div', 'hashcod-vision-overlay');
        overlay.setAttribute('aria-hidden', 'true');
        var card = el('div', 'hashcod-vision-card');
        card.setAttribute('role', 'dialog');
        card.setAttribute('aria-modal', 'true');
        card.setAttribute('aria-label', 'Visión');
        var top = el('div', 'hashcod-vision-top');
        top.appendChild(el('h2', 'hashcod-vision-title', 'Visión · cámara y detección'));
        var close = el('button', 'hashcod-vision-btn', 'Cerrar');
        close.type = 'button';
        top.appendChild(close);

        var stage = el('div', 'hashcod-vision-stage');
        var video = el('video');
        video.muted = true;
        video.playsInline = true;
        var canvas = el('canvas');
        stage.appendChild(video);
        stage.appendChild(canvas);

        var bar = el('div', 'hashcod-vision-bar');
        function mk(label, cls) { var b = el('button', 'hashcod-vision-btn ' + (cls || ''), label); b.type = 'button'; bar.appendChild(b); return b; }
        var camBtn = mk('Activar cámara', 'primary');
        var detBtn = mk('Detectar objetos');
        var recBtn = mk('Grabar video');
        detBtn.disabled = recBtn.disabled = true;

        var msg = el('p', 'hashcod-vision-msg');
        var recs = el('div', 'hashcod-vision-recs');

        var logHead = el('div', 'hashcod-vision-section', 'Registro (log)');
        var wrap = el('div', 'hashcod-vision-tablewrap');
        var table = el('table', 'hashcod-vision-table');
        var thead = el('thead'), hr = el('tr');
        ['Hora', 'Objetos vistos', 'Confianza máx.'].forEach(function (h) { hr.appendChild(el('th', '', h)); });
        thead.appendChild(hr);
        var tbody = el('tbody');
        table.appendChild(thead);
        table.appendChild(tbody);
        wrap.appendChild(table);
        var clearBtn = mk('Borrar registro');
        clearBtn.disabled = false;

        [top, stage, bar, msg, recs, logHead, wrap].forEach(function (n) { card.appendChild(n); });
        overlay.appendChild(card);
        document.body.appendChild(overlay);

        ui = { overlay: overlay, video: video, canvas: canvas, camBtn: camBtn, detBtn: detBtn, recBtn: recBtn,
               clearBtn: clearBtn, msg: msg, recs: recs, tbody: tbody };
        close.addEventListener('click', closePanel);
        overlay.addEventListener('mousedown', function (e) { if (e.target === overlay) closePanel(); });
        camBtn.addEventListener('click', function () { stream ? stopCamera() : startCamera(); });
        detBtn.addEventListener('click', toggleDetect);
        recBtn.addEventListener('click', function () { recorder ? stopRecording() : startRecording(); });
        clearBtn.addEventListener('click', function () {
            api('log', { method: 'DELETE' }).then(loadLog);
        });
        document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && overlay.classList.contains('open')) closePanel(); });
    }

    function startCamera() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            say('Este navegador no permite acceder a la cámara.', true);
            return;
        }
        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false }).then(function (s) {
            stream = s;
            ui.video.srcObject = s;
            ui.video.play();
            ui.camBtn.textContent = 'Apagar cámara';
            ui.detBtn.disabled = ui.recBtn.disabled = false;
            say('Cámara activa.');
        }).catch(function () {
            say('No se pudo acceder a la cámara. Revisa el permiso del navegador.', true);
        });
    }

    function stopCamera() {
        stopDetect();
        stopRecording();
        if (stream) stream.getTracks().forEach(function (t) { t.stop(); });
        stream = null;
        ui.video.srcObject = null;
        ui.camBtn.textContent = 'Activar cámara';
        ui.detBtn.disabled = ui.recBtn.disabled = true;
        clearBoxes();
    }

    function clearBoxes() {
        var c = ui.canvas;
        c.getContext('2d').clearRect(0, 0, c.width, c.height);
    }

    function drawBoxes(res) {
        var c = ui.canvas, v = ui.video;
        c.width = v.videoWidth || res.width;
        c.height = v.videoHeight || res.height;
        var ctx = c.getContext('2d'), sx = c.width / res.width, sy = c.height / res.height;
        ctx.clearRect(0, 0, c.width, c.height);
        ctx.lineWidth = Math.max(2, c.width / 320);
        ctx.font = Math.max(12, Math.round(c.width / 40)) + 'px system-ui, sans-serif';
        res.detections.forEach(function (d) {
            var x = d.box[0] * sx, y = d.box[1] * sy, w = d.box[2] * sx, h = d.box[3] * sy;
            var label = d.label + ' ' + Math.round(d.score * 100) + '%';
            ctx.strokeStyle = '#22c55e';
            ctx.strokeRect(x, y, w, h);
            var tw = ctx.measureText(label).width + 8, th = parseInt(ctx.font, 10) + 6;
            ctx.fillStyle = '#22c55e';
            ctx.fillRect(x, Math.max(0, y - th), tw, th);
            ctx.fillStyle = '#052e16';
            ctx.fillText(label, x + 4, Math.max(th - 5, y - 5));
        });
    }

    function grabFrame() {
        var v = ui.video;
        if (!v.videoWidth) return null;
        var scale = Math.min(1, MAX_W / v.videoWidth);
        var c = document.createElement('canvas');
        c.width = Math.round(v.videoWidth * scale);
        c.height = Math.round(v.videoHeight * scale);
        c.getContext('2d').drawImage(v, 0, 0, c.width, c.height);
        return c.toDataURL('image/jpeg', 0.7);
    }

    function tick() {
        if (!detecting || busy) return;
        var image = grabFrame();
        if (!image) return;
        busy = true;
        api('detect', { method: 'POST', body: JSON.stringify({ image: image }) }).then(function (res) {
            if (!detecting) return;
            if (!res.ok) {
                if (res.code === 'rate_limited') return;
                say(res.error || 'Error de detección', true);
                if (res.code === 'detector_not_configured') stopDetect();
                return;
            }
            drawBoxes(res);
            say(res.detections.length ? res.detections.length + ' objeto(s) detectado(s).' : 'Sin objetos detectados.');
            if (Date.now() - lastLogAt > LOG_REFRESH_MS) loadLog();
        }).catch(function () {
            say('No se pudo contactar con el servidor.', true);
        }).then(function () { busy = false; });
    }

    function toggleDetect() { detecting ? stopDetect() : startDetect(); }

    function startDetect() {
        detecting = true;
        ui.detBtn.textContent = 'Detener detección';
        timer = setInterval(tick, FRAME_MS);
        tick();
    }

    function stopDetect() {
        detecting = false;
        clearInterval(timer);
        if (ui) { ui.detBtn.textContent = 'Detectar objetos'; clearBoxes(); }
    }

    function startRecording() {
        if (!window.MediaRecorder || !stream) { say('Este navegador no permite grabar video.', true); return; }
        var type = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4'].filter(function (t) { return MediaRecorder.isTypeSupported(t); })[0];
        chunks = [];
        recorder = new MediaRecorder(stream, type ? { mimeType: type } : undefined);
        recorder.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
        recorder.onstop = function () {
            var mime = recorder.mimeType || 'video/webm';
            var blob = new Blob(chunks, { type: mime });
            recorder = null;
            ui.recBtn.textContent = 'Grabar video';
            if (!blob.size) return;
            var a = el('a', '', 'Descargar grabación ' + (++recCount));
            a.href = URL.createObjectURL(blob);
            a.download = 'hashcod-vision-' + new Date().toISOString().replace(/[:.]/g, '-') + (mime.indexOf('mp4') > -1 ? '.mp4' : '.webm');
            ui.recs.appendChild(a);
            say('Grabación lista; se guarda solo en tu dispositivo.');
        };
        recorder.start();
        ui.recBtn.textContent = 'Detener grabación';
        say('Grabando…');
    }

    function stopRecording() {
        if (recorder && recorder.state !== 'inactive') recorder.stop();
    }

    function loadLog() {
        lastLogAt = Date.now();
        return api('log').then(function (res) {
            if (!res.ok) return;
            ui.tbody.textContent = '';
            if (!res.entries.length) {
                var r = el('tr'), td = el('td', '', 'Aún no hay registros.');
                td.colSpan = 3;
                r.appendChild(td);
                ui.tbody.appendChild(r);
                return;
            }
            res.entries.slice(0, 200).forEach(function (e) {
                var r = el('tr');
                r.appendChild(el('td', '', new Date(e.ts * 1000).toLocaleTimeString()));
                r.appendChild(el('td', '', Object.keys(e.counts).map(function (k) { return k + ' ×' + e.counts[k]; }).join(', ')));
                r.appendChild(el('td', '', Math.round(Math.max.apply(null, Object.keys(e.best).map(function (k) { return e.best[k]; })) * 100) + '%'));
                ui.tbody.appendChild(r);
            });
        });
    }

    function openPanel() {
        if (!ui) build();
        ui.overlay.classList.add('open');
        ui.overlay.setAttribute('aria-hidden', 'false');
        btn.classList.add('is-active');
        loadLog();
        api('status').then(function (res) {
            if (res.ok && !res.detector) say('Detector no configurado: la cámara y la grabación funcionan, la detección no.', true);
            else if (!res.ok) say(res.error || 'Inicia sesión para usar Visión.', true);
        });
    }

    function closePanel() {
        stopCamera();
        ui.overlay.classList.remove('open');
        ui.overlay.setAttribute('aria-hidden', 'true');
        btn.classList.remove('is-active');
    }

    function init() {
        btn = document.getElementById('hashcodDockVisionBtn');
        if (btn) btn.addEventListener('click', function () { ui && ui.overlay.classList.contains('open') ? closePanel() : openPanel(); });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
