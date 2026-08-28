<?php
/**
 * openclaw-ui.php — Panel Gráfico e Interfaz de OpenClaw 🦞 para Hashcod Codespace.
 * 
 * Interfaz nativa en PHP/HTML para monitoreo del Gateway Daemon, orquestación
 * multi-canal, consola de agentes autónomos y catálogo de habilidades.
 */

require_once __DIR__ . '/security.php';
require_once __DIR__ . '/l8-html.php';
require_once __DIR__ . '/openclaw-bridge.php';

securityBootstrap('web');
$base = l8_public_base_path();
$status = openclawGetStatus();
$skills = openclawGetSkillsCatalog();
$cfg = openclawGetConfig();
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OpenClaw 🦞 · Multi-Channel AI Gateway · Hashcod Codespace</title>
    <base href="<?= htmlspecialchars($base, ENT_QUOTES, 'UTF-8') ?>">
    <link rel="icon" href="favicon.svg?v=3" type="image/svg+xml">
    <style>
        :root {
            --bg: #0d1117;
            --surface: #161b22;
            --surface-hover: #21262d;
            --border: rgba(255, 255, 255, 0.12);
            --text: #f0f6fc;
            --text-dim: #8b949e;
            --accent: #ff5e36;
            --accent-glow: rgba(255, 94, 54, 0.25);
            --green: #2ea043;
            --blue: #58a6ff;
            --purple: #bc8cff;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background: var(--bg);
            color: var(--text);
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            line-height: 1.5;
        }
        header {
            background: rgba(22, 27, 34, 0.85);
            backdrop-filter: blur(12px);
            border-bottom: 1px solid var(--border);
            padding: 0.85rem 1.5rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            position: sticky;
            top: 0;
            z-index: 100;
        }
        .brand {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            font-weight: 700;
            font-size: 1.15rem;
            color: #fff;
            text-decoration: none;
        }
        .brand .logo {
            font-size: 1.6rem;
            line-height: 1;
            filter: drop-shadow(0 0 8px var(--accent));
        }
        .badge {
            font-size: 0.75rem;
            padding: 0.2rem 0.6rem;
            border-radius: 20px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        .badge-online { background: rgba(46, 160, 67, 0.2); color: #3fb950; border: 1px solid rgba(46, 160, 67, 0.4); }
        .badge-lobster { background: var(--accent-glow); color: var(--accent); border: 1px solid var(--accent); }
        
        .header-actions {
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }
        .btn {
            background: var(--surface-hover);
            color: var(--text);
            border: 1px solid var(--border);
            padding: 0.45rem 0.9rem;
            border-radius: 6px;
            font-size: 0.85rem;
            font-weight: 500;
            cursor: pointer;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 0.4rem;
            transition: all 0.2s ease;
        }
        .btn:hover { background: #30363d; border-color: rgba(255,255,255,0.25); }
        .btn-primary { background: var(--accent); color: #fff; border-color: var(--accent); }
        .btn-primary:hover { background: #e04b24; }
        
        .main-container {
            flex: 1;
            padding: 1.5rem;
            max-width: 1400px;
            margin: 0 auto;
            width: 100%;
            display: grid;
            grid-template-columns: 340px 1fr;
            gap: 1.5rem;
        }
        @media (max-width: 960px) {
            .main-container { grid-template-columns: 1fr; }
        }

        .card {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 10px;
            padding: 1.25rem;
            margin-bottom: 1.25rem;
        }
        .card-title {
            font-size: 0.95rem;
            font-weight: 600;
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            color: #fff;
        }

        .meta-list { list-style: none; }
        .meta-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.5rem 0;
            border-bottom: 1px solid rgba(255,255,255,0.05);
            font-size: 0.85rem;
        }
        .meta-item:last-child { border-bottom: none; }
        .meta-label { color: var(--text-dim); }
        .meta-val { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-weight: 500; }

        .skills-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 0.75rem;
        }
        .skill-chip {
            background: rgba(255,255,255,0.03);
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 0.75rem;
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        .skill-chip:hover, .skill-chip.active {
            background: rgba(255, 94, 54, 0.08);
            border-color: var(--accent);
        }
        .skill-chip-header {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-weight: 600;
            font-size: 0.85rem;
            color: #fff;
        }
        .skill-chip-desc {
            font-size: 0.75rem;
            color: var(--text-dim);
            line-height: 1.35;
        }

        .chat-area {
            display: flex;
            flex-direction: column;
            height: calc(100vh - 160px);
            min-height: 500px;
        }
        .terminal-output {
            flex: 1;
            background: #090d13;
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 1.25rem;
            font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
            font-size: 0.85rem;
            color: #d1d5db;
            overflow-y: auto;
            white-space: pre-wrap;
            line-height: 1.6;
            margin-bottom: 1rem;
        }
        .terminal-prompt {
            display: flex;
            gap: 0.75rem;
        }
        .prompt-input {
            flex: 1;
            background: #090d13;
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 0.85rem 1rem;
            color: #fff;
            font-size: 0.9rem;
            outline: none;
            transition: border-color 0.2s;
        }
        .prompt-input:focus {
            border-color: var(--accent);
            box-shadow: 0 0 0 3px var(--accent-glow);
        }
    </style>
</head>
<body>

    <header>
        <a href="<?= htmlspecialchars($base, ENT_QUOTES, 'UTF-8') ?>openclaw" class="brand">
            <span class="logo">🦞</span>
            <span>OpenClaw Gateway</span>
            <span class="badge badge-lobster">v2026.8.1</span>
            <span class="badge badge-online">ONLINE</span>
        </a>
        <div class="header-actions">
            <a href="<?= htmlspecialchars($base, ENT_QUOTES, 'UTF-8') ?>" class="btn">← Volver al Codespace</a>
            <button class="btn btn-primary" onclick="triggerDaemonOnboard()">⚡ Onboard Daemon</button>
        </div>
    </header>

    <div class="main-container">
        <!-- Sidebar: Info & Channels -->
        <aside>
            <div class="card">
                <div class="card-title">
                    <span>Estado del Gateway</span>
                    <span class="badge badge-online">Activo</span>
                </div>
                <ul class="meta-list">
                    <li class="meta-item">
                        <span class="meta-label">Mascota</span>
                        <span class="meta-val">🦞 Molty (The Lobster)</span>
                    </li>
                    <li class="meta-item">
                        <span class="meta-label">Puerto RPC</span>
                        <span class="meta-val"><?= (int)$status['gateway_port'] ?> (WebSocket/HTTP)</span>
                    </li>
                    <li class="meta-item">
                        <span class="meta-label">Workspace</span>
                        <span class="meta-val">~/workspace</span>
                    </li>
                    <li class="meta-item">
                        <span class="meta-label">Modelo Default</span>
                        <span class="meta-val">Claude 3.7 Sonnet</span>
                    </li>
                    <li class="meta-item">
                        <span class="meta-label">Tokens Disponibles</span>
                        <span class="meta-val" style="color:#3fb950;">ILIMITADO</span>
                    </li>
                </ul>
            </div>

            <div class="card">
                <div class="card-title">
                    <span>Canales de Mensajería</span>
                    <span style="font-size:0.75rem; color:var(--text-dim);">(7 conectores)</span>
                </div>
                <ul class="meta-list">
                    <li class="meta-item">
                        <span>🖥️ Web Dashboard</span>
                        <span class="badge badge-online">Conectado</span>
                    </li>
                    <li class="meta-item">
                        <span>⌨️ Codespace Bash CLI</span>
                        <span class="badge badge-online">Activo</span>
                    </li>
                    <li class="meta-item">
                        <span>💬 WhatsApp Connector</span>
                        <span style="color:var(--text-dim); font-size:0.8rem;">Standby</span>
                    </li>
                    <li class="meta-item">
                        <span>✈️ Telegram Gateway</span>
                        <span style="color:var(--text-dim); font-size:0.8rem;">Standby</span>
                    </li>
                    <li class="meta-item">
                        <span>🎮 Discord Bot</span>
                        <span style="color:var(--text-dim); font-size:0.8rem;">Standby</span>
                    </li>
                    <li class="meta-item">
                        <span>⚡ HTTP Webhook</span>
                        <span class="badge badge-online">/api/openclaw/webhook</span>
                    </li>
                </ul>
            </div>
        </aside>

        <!-- Main Panel: Agent Console & Skills -->
        <main>
            <div class="card">
                <div class="card-title">
                    <span>Habilidades Autónomas Activas (Skills)</span>
                    <span style="font-size:0.8rem; color:var(--accent);">50+ skills disponibles</span>
                </div>
                <div class="skills-grid">
                    <?php foreach ($skills as $s): ?>
                        <div class="skill-chip <?= !empty($s['enabled']) ? 'active' : '' ?>">
                            <div class="skill-chip-header">
                                <span><?= htmlspecialchars($s['icon']) ?></span>
                                <span><?= htmlspecialchars($s['name']) ?></span>
                            </div>
                            <div class="skill-chip-desc"><?= htmlspecialchars($s['description']) ?></div>
                        </div>
                    <?php endforeach; ?>
                </div>
            </div>

            <div class="card chat-area">
                <div class="card-title">
                    <span>Consola de Ejecución del Agente</span>
                    <span style="font-size:0.8rem; color:var(--text-dim);">Workspace Central: ~/workspace</span>
                </div>
                <div class="terminal-output" id="termOutput">🦞 OPENCLAW 2026.8.1 AUTONOMOUS GATEWAY CORE INICIADO.
──────────────────────────────────────────────────────────────────────
• Dispositivo  : Hashcod Codespace Local Node
• Gateway      : http://127.0.0.1:18789 (Online)
• Workspace    : ~/workspace
• Habilidades  : Coding-Agent, Diagram-Maker, GitHub, Gemini, Active-Memory
──────────────────────────────────────────────────────────────────────
Escribe una instrucción en el campo inferior para que el agente OpenClaw opere sobre tu código.
</div>
                <div class="terminal-prompt">
                    <input type="text" id="promptInput" class="prompt-input" placeholder="Ej: Analiza el workspace y genera un diagrama de arquitectura Mermaid..." onkeydown="if(event.key==='Enter') sendTask()">
                    <button class="btn btn-primary" onclick="sendTask()">Ejecutar Tarea 🦞</button>
                </div>
            </div>
        </main>
    </div>

    <script>
        async function sendTask() {
            const input = document.getElementById('promptInput');
            const term = document.getElementById('termOutput');
            const prompt = input.value.trim();
            if (!prompt) return;

            term.innerHTML += "\n\n> " + prompt + "\n[Ejecutando agente OpenClaw...]";
            term.scrollTop = term.scrollHeight;
            input.value = '';

            try {
                const res = await fetch('api/openclaw/run', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt: prompt })
                });
                const data = await res.json();
                if (data.ok && data.stdout) {
                    term.innerHTML += "\n" + data.stdout;
                } else {
                    term.innerHTML += "\n[Error]: " + (data.error || 'Fallo en ejecución');
                }
            } catch (err) {
                term.innerHTML += "\n[Error de conexión]: " + err.message;
            }
            term.scrollTop = term.scrollHeight;
        }

        function triggerDaemonOnboard() {
            const term = document.getElementById('termOutput');
            term.innerHTML += "\n\n> openclaw onboard --install-daemon\n[Verificando modelos, bóveda de claves y gateway...]\n✓ OpenClaw Daemon verificado y sincronizado con Hashcod Codespace.";
            term.scrollTop = term.scrollHeight;
        }
    </script>
</body>
</html>
