<?php
// gateway.php - Canjear código único y descargar carpeta (l8 codespace)
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
        .brand img {
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
        }
        .btn-primary { background: var(--accent); color: #fff; }
        .btn-primary:disabled { opacity: 0.55; cursor: wait; }
        .btn-secondary { background: #eceae4; color: #111; }
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
        .result img {
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
                <p>Gateway · ingresa el código y descarga la carpeta</p>
            </div>
        </div>

        <div class="panel">
            <label for="codeInput">Código de transferencia</label>
            <input id="codeInput" type="text" inputmode="text" autocomplete="off" spellcheck="false" maxlength="9" placeholder="JSLA-SAKA">
            <div class="actions">
                <button type="button" class="btn-primary" id="claimBtn">Obtener carpeta</button>
                <button type="button" class="btn-secondary" id="clearBtn">Limpiar</button>
            </div>
            <div class="status" id="statusText">Pega un código tipo JSLA-SAKA generado en la plataforma.</div>
            <p class="hint">El código es único y no se reutiliza. Quien lo tenga puede descargar la carpeta del repositorio.</p>
        </div>

        <div class="result" id="resultCard">
            <img id="resultIcon" src="/favicon.svg?v=3" alt="l8 codespace">
            <div>
                <h3 id="resultTitle">l8 codespace</h3>
                <p id="resultBody"></p>
                <a id="resultDownload" href="#" download>Descargar carpeta (.zip)</a>
            </div>
        </div>
    </div>

    <script>
        const PLATFORM = 'l8 codespace';
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
                resultDownload.setAttribute('download', (t.repo_name || 'repo') + '.zip');
                resultCard.classList.add('visible');
                setStatus('Código válido. Ya puedes descargar la carpeta.', 'live');

                if ('Notification' in window && Notification.permission === 'granted') {
                    try {
                        new Notification(platformName, {
                            body: 'Carpeta lista: ' + (t.user_repo || t.repo_name || code),
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
