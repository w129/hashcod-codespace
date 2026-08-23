<?php
// gateway.php - Canjear código único y descargar carpeta (l8 codespace)
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <title>Hashcod codespace · Gateway</title>
    <link rel="icon" href="/favicon.svg?v=3" type="image/svg+xml">
    <meta name="application-name" content="Hashcod codespace">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-title" content="Hashcod codespace">
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
        @keyframes gatewayCrescentOrbit {
            0% { transform: rotate(0deg) scale(1); }
            25% { transform: rotate(14deg) translateY(-1px) scale(1.05); }
            50% { transform: rotate(0deg) scale(1); }
            75% { transform: rotate(-14deg) translateY(1px) scale(0.96); }
            100% { transform: rotate(0deg) scale(1); }
        }
        .brand svg {
            width: 38px;
            height: 38px;
            display: block;
            flex-shrink: 0;
            animation: gatewayCrescentOrbit 6s ease-in-out infinite;
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
        input[type="text"] {
            width: 100%;
            border: 1px solid #d5d1c7;
            border-radius: 10px;
            padding: 14px 14px;
            font: inherit;
            font-size: 22px;
            font-weight: 700;
            letter-spacing: 0.14em;
            text-transform: uppercase;
            text-align: center;
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
            transition: background 0.15s ease, transform 0.1s ease;
        }
        .btn-primary { background: var(--accent); color: #fff; }
        .btn-primary:hover:not(:disabled) { background: #222; }
        .btn-primary:active:not(:disabled) { transform: scale(0.97); }
        .btn-primary:disabled { opacity: 0.55; cursor: wait; }
        .btn-secondary { background: #eceae4; color: #111; }
        .btn-secondary:hover { background: #dfdcd4; }
        .status {
            margin-top: 14px;
            font-size: 12px;
            color: var(--muted);
            min-height: 18px;
        }
        .status.live { color: #137333; font-weight: 600; }
        .status.err { color: #c5221f; font-weight: 600; }
        .result {
            display: none;
            margin-top: 16px;
            background: var(--card);
            border: 1px solid var(--line);
            border-radius: 12px;
            padding: 14px;
            gap: 12px;
            align-items: flex-start;
            animation: rise 0.35s ease;
        }
        .result.visible { display: flex; }
        .result img, .result svg {
            width: 36px;
            height: 36px;
            flex-shrink: 0;
        }
        .result h3 {
            font-size: 13px;
            font-weight: 700;
            margin-bottom: 4px;
        }
        .result p {
            font-size: 12px;
            color: var(--muted);
            line-height: 1.4;
            margin-bottom: 10px;
        }
        .result a {
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
        .hint {
            margin-top: 14px;
            font-size: 11px;
            color: var(--muted);
            line-height: 1.45;
        }
        @keyframes rise {
            from { opacity: 0; transform: scale(0.96) translateY(8px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
        }
    </style>
</head>
<body>
    <div class="shell">
        <div class="brand">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30" width="38" height="38" aria-hidden="true">
                <path fill="currentColor" d="M 15 3 C 8.3845336 3 3 8.3845336 3 15 C 3 21.615466 8.3845336 27 15 27 C 17.554923 27 19.9167 26.181425 21.853516 24.818359 A 1.0002806 1.0002806 0 0 0 20.703125 23.181641 C 19.081941 24.322575 17.129077 25 15 25 C 9.4654664 25 5 20.534534 5 15 C 5 9.4654664 9.4654664 5 15 5 C 17.129077 5 19.081941 5.6774247 20.703125 6.8183594 A 1.0002809 1.0002809 0 0 0 21.853516 5.1816406 C 19.9167 3.8185753 17.554923 3 15 3 z"></path>
            </svg>
            <div>
                <h1>Hashcod codespace</h1>
                <p>Gateway · l8 codespace · ingresa el código y descarga el paquete</p>
            </div>
        </div>

        <div class="panel">
            <label for="codeInput">Código de transferencia</label>
            <input id="codeInput" type="text" inputmode="text" autocomplete="off" spellcheck="false" maxlength="9" placeholder="JSLA-SAKA">
            <div class="actions">
                <button type="button" class="btn-primary" id="claimBtn">Obtener paquete</button>
                <button type="button" class="btn-secondary" id="clearBtn">Limpiar</button>
            </div>
            <div class="status" id="statusText">Pega un código tipo JSLA-SAKA generado en la plataforma.</div>
            <p class="hint">El código es único. Puede traer un repo, el bloc de notas, la terminal u otro contenido enviado desde la plataforma.</p>
        </div>

        <div class="result" id="resultCard">
            <svg id="resultIcon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30" width="36" height="36" aria-hidden="true" style="margin-top:2px;">
                <path fill="currentColor" d="M 15 3 C 8.3845336 3 3 8.3845336 3 15 C 3 21.615466 8.3845336 27 15 27 C 17.554923 27 19.9167 26.181425 21.853516 24.818359 A 1.0002806 1.0002806 0 0 0 20.703125 23.181641 C 19.081941 24.322575 17.129077 25 15 25 C 9.4654664 25 5 20.534534 5 15 C 5 9.4654664 9.4654664 5 15 5 C 17.129077 5 19.081941 5.6774247 20.703125 6.8183594 A 1.0002809 1.0002809 0 0 0 21.853516 5.1816406 C 19.9167 3.8185753 17.554923 3 15 3 z"></path>
            </svg>
            <div>
                <h3 id="resultTitle">Hashcod codespace</h3>
                <p id="resultBody"></p>
                <a id="resultDownload" href="#" download>Descargar paquete (.zip)</a>
            </div>
        </div>
    </div>

    <script>
        const PLATFORM = 'Hashcod codespace · l8 codespace';
        const ICON = '/favicon.svg?v=3';
        const codeInput = document.getElementById('codeInput');
        const statusText = document.getElementById('statusText');
        const claimBtn = document.getElementById('claimBtn');
        const resultCard = document.getElementById('resultCard');
        const resultTitle = document.getElementById('resultTitle');
        const resultBody = document.getElementById('resultBody');
        const resultDownload = document.getElementById('resultDownload');
        const resultIcon = document.getElementById('resultIcon');

        function setStatus(msg, cls) {
            statusText.textContent = msg;
            statusText.className = 'status' + (cls ? ' ' + cls : '');
        }

        function formatCodeInput(value) {
            const letters = String(value || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 8);
            if (letters.length <= 4) return letters;
            return letters.slice(0, 4) + '-' + letters.slice(4);
        }

        codeInput.addEventListener('input', () => {
            const start = codeInput.selectionStart;
            const before = codeInput.value;
            codeInput.value = formatCodeInput(codeInput.value);
            // crude caret restore
            if (document.activeElement === codeInput) {
                const delta = codeInput.value.length - before.length;
                const pos = Math.max(0, (start || 0) + delta);
                try { codeInput.setSelectionRange(pos, pos); } catch (e) {}
            }
        });

        async function claimCode() {
            const code = formatCodeInput(codeInput.value);
            if (!/^[A-Z]{4}-[A-Z]{4}$/.test(code)) {
                setStatus('El código debe verse así: JSLA-SAKA', 'err');
                resultCard.classList.remove('visible');
                return;
            }
            claimBtn.disabled = true;
            setStatus('Buscando transferencia…');
            resultCard.classList.remove('visible');
            try {
                const res = await fetch('/api/gateway/claim', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ code })
                });
                const data = await res.json();
                if (!data.ok) {
                    setStatus(data.error || 'Código no válido.', 'err');
                    claimBtn.disabled = false;
                    return;
                }
                const t = data.transfer || {};
                const platformName = (data.platform && data.platform.name) || t.platform || PLATFORM;
                const icon = (data.platform && data.platform.icon) || t.platform_icon || ICON;
                resultIcon.src = icon;
                resultTitle.textContent = platformName;
                resultBody.textContent = (data.message || '') +
                    (t.size_formatted ? (' · ' + t.size_formatted) : '');
                resultDownload.href = data.download_url || t.download_url || ('/api/gateway/download/' + encodeURIComponent(code));
                resultDownload.setAttribute('download', (t.repo_name || 'paquete') + '.zip');
                resultCard.classList.add('visible');
                setStatus('Código válido. Ya puedes descargar el paquete.', 'live');

                if ('Notification' in window && Notification.permission === 'granted') {
                    try {
                        new Notification(platformName, {
                            body: 'Paquete listo: ' + (t.user_repo || t.repo_name || code),
                            icon: icon,
                            tag: code
                        });
                    } catch (e) {}
                }
            } catch (e) {
                setStatus('Error de conexión con el gateway.', 'err');
            }
            claimBtn.disabled = false;
        }

        document.getElementById('claimBtn').addEventListener('click', claimCode);
        document.getElementById('clearBtn').addEventListener('click', () => {
            codeInput.value = '';
            resultCard.classList.remove('visible');
            setStatus('Pega un código tipo JSLA-SAKA generado en la plataforma.');
            codeInput.focus();
        });
        codeInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') claimCode();
        });

        // Prefill from ?code=
        const params = new URLSearchParams(location.search);
        if (params.get('code')) {
            codeInput.value = formatCodeInput(params.get('code'));
            claimCode();
        } else {
            codeInput.focus();
        }

        if ('Notification' in window && Notification.permission === 'default') {
            // optional soft ask; no force
        }
    </script>
</body>
</html>
