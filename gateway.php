<?php
// gateway.php - Receptor móvil del gateway l8 codespace
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <title>l8 codespace · Gateway</title>
    <link rel="icon" href="/favicon.svg?v=3" type="image/svg+xml">
    <meta name="application-name" content="l8 codespace">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-title" content="l8 codespace">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&display=swap');
        :root {
            --ink: #111111;
            --muted: #666666;
            --line: #e0dcd3;
            --bg: #f7f5f0;
            --card: #ffffff;
            --accent: #000000;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            min-height: 100vh;
            font-family: 'IBM Plex Mono', monospace;
            color: var(--ink);
            background:
                radial-gradient(1200px 500px at 10% -10%, #ebe6dc 0%, transparent 55%),
                radial-gradient(900px 420px at 100% 0%, #e4ebe6 0%, transparent 50%),
                var(--bg);
            padding: 24px 16px 40px;
        }
        .shell { max-width: 440px; margin: 0 auto; }
        .brand {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 22px;
        }
        .brand img, .brand svg {
            width: 40px;
            height: 40px;
            display: block;
        }
        .brand h1 {
            font-size: 18px;
            font-weight: 700;
            letter-spacing: -0.02em;
            line-height: 1.15;
        }
        .brand p {
            font-size: 11px;
            color: var(--muted);
            margin-top: 2px;
        }
        .panel {
            background: var(--card);
            border: 1px solid var(--line);
            border-radius: 14px;
            padding: 18px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.06);
        }
        label {
            display: block;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            color: var(--muted);
            margin-bottom: 8px;
        }
        input[type="tel"] {
            width: 100%;
            border: 1px solid #d5d1c7;
            border-radius: 10px;
            padding: 12px 14px;
            font: inherit;
            font-size: 16px;
            margin-bottom: 12px;
            background: #faf9f6;
        }
        .actions { display: flex; gap: 8px; flex-wrap: wrap; }
        button {
            border: none;
            border-radius: 8px;
            padding: 10px 14px;
            font: inherit;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
        }
        .btn-primary { background: var(--accent); color: #fff; }
        .btn-secondary { background: #eceae4; color: #111; }
        .status {
            margin-top: 14px;
            font-size: 12px;
            color: var(--muted);
            min-height: 18px;
        }
        .status.live { color: #137333; font-weight: 600; }
        .status.err { color: #c5221f; font-weight: 600; }
        .list { margin-top: 18px; display: flex; flex-direction: column; gap: 10px; }
        .card {
            background: var(--card);
            border: 1px solid var(--line);
            border-radius: 12px;
            padding: 14px;
            display: flex;
            gap: 12px;
            align-items: flex-start;
            animation: rise 0.35s ease;
        }
        .card img {
            width: 36px;
            height: 36px;
            flex-shrink: 0;
        }
        .card h3 {
            font-size: 13px;
            font-weight: 700;
            margin-bottom: 4px;
        }
        .card p {
            font-size: 12px;
            color: var(--muted);
            line-height: 1.4;
            margin-bottom: 10px;
        }
        .card a {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: #000;
            color: #fff;
            text-decoration: none;
            border-radius: 7px;
            padding: 8px 12px;
            font-size: 12px;
            font-weight: 600;
        }
        .empty {
            margin-top: 18px;
            font-size: 12px;
            color: var(--muted);
            text-align: center;
            padding: 18px 8px;
        }
        @keyframes rise {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
        }
    </style>
</head>
<body>
    <div class="shell">
        <div class="brand">
            <img src="/favicon.svg?v=3" alt="l8 codespace">
            <div>
                <h1>l8 codespace</h1>
                <p>Gateway · recibe carpetas en este teléfono</p>
            </div>
        </div>

        <div class="panel">
            <label for="phoneInput">Tu número</label>
            <input id="phoneInput" type="tel" inputmode="tel" placeholder="+573001234567" autocomplete="tel">
            <div class="actions">
                <button type="button" class="btn-primary" id="listenBtn">Activar gateway</button>
                <button type="button" class="btn-secondary" id="notifyBtn">Permitir notificaciones</button>
            </div>
            <div class="status" id="statusText">Ingresa tu número y espera el envío desde la plataforma.</div>
        </div>

        <div class="list" id="transferList"></div>
        <div class="empty" id="emptyState">Sin transferencias todavía.</div>
    </div>

    <script>
        const PLATFORM = 'l8 codespace';
        const ICON = '/favicon.svg?v=3';
        const phoneInput = document.getElementById('phoneInput');
        const statusText = document.getElementById('statusText');
        const transferList = document.getElementById('transferList');
        const emptyState = document.getElementById('emptyState');
        const seen = new Set();
        let pollTimer = null;
        let listeningPhone = '';

        const saved = localStorage.getItem('l8_gateway_phone') || '';
        if (saved) phoneInput.value = saved;

        function setStatus(msg, cls) {
            statusText.textContent = msg;
            statusText.className = 'status' + (cls ? ' ' + cls : '');
        }

        async function enableNotifications() {
            if (!('Notification' in window)) {
                setStatus('Este navegador no soporta notificaciones.', 'err');
                return false;
            }
            const perm = await Notification.requestPermission();
            if (perm !== 'granted') {
                setStatus('Notificaciones bloqueadas. Puedes seguir recibiendo en esta pantalla.', 'err');
                return false;
            }
            setStatus('Notificaciones activadas para l8 codespace.', 'live');
            return true;
        }

        function showBrowserNotification(item) {
            if (!('Notification' in window) || Notification.permission !== 'granted') return;
            try {
                const n = new Notification(item.notification_title || PLATFORM, {
                    body: item.notification_body || ('Te enviaron ' + (item.user_repo || item.repo_name)),
                    icon: item.notification_icon || ICON,
                    badge: item.notification_icon || ICON,
                    tag: item.id,
                    data: { url: item.download_url }
                });
                n.onclick = () => {
                    window.focus();
                    if (item.download_url) window.location.href = item.download_url;
                    n.close();
                };
            } catch (e) {}
        }

        function renderItem(item) {
            if (seen.has(item.id)) return;
            seen.add(item.id);
            emptyState.style.display = 'none';
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <img src="${item.notification_icon || ICON}" alt="${PLATFORM}">
                <div>
                    <h3>${item.notification_title || PLATFORM}</h3>
                    <p>${item.notification_body || ''}</p>
                    <a href="${item.download_url}" download>Descargar carpeta (.zip)</a>
                </div>
            `;
            transferList.prepend(card);
            showBrowserNotification(item);
        }

        async function registerAndPoll() {
            const phone = (phoneInput.value || '').trim();
            if (!phone) {
                setStatus('Escribe tu número de teléfono.', 'err');
                return;
            }
            localStorage.setItem('l8_gateway_phone', phone);
            listeningPhone = phone;
            try {
                const reg = await fetch('/api/gateway/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ phone, platform: PLATFORM, user_agent: navigator.userAgent })
                });
                const regJson = await reg.json();
                if (!regJson.ok) {
                    setStatus(regJson.error || 'No se pudo registrar el dispositivo.', 'err');
                    return;
                }
                setStatus('Gateway activo. Esperando envíos a ' + regJson.phone + '…', 'live');
                if (pollTimer) clearInterval(pollTimer);
                const tick = async () => {
                    try {
                        const res = await fetch('/api/gateway/poll?phone=' + encodeURIComponent(listeningPhone));
                        const data = await res.json();
                        if (!data.ok) return;
                        (data.transfers || []).forEach(renderItem);
                    } catch (e) {}
                };
                await tick();
                pollTimer = setInterval(tick, 2500);
            } catch (e) {
                setStatus('Error de conexión con el gateway.', 'err');
            }
        }

        document.getElementById('listenBtn').addEventListener('click', registerAndPoll);
        document.getElementById('notifyBtn').addEventListener('click', enableNotifications);
        phoneInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') registerAndPoll();
        });
    </script>
</body>
</html>
