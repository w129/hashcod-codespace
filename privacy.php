<?php
/**
 * Hashcod Codespace — Declaración Oficial de Política de Privacidad, Modelo Operativo y Certificación Determinista
 * Versión 2026.8 · Criptografía Post-Cuántica (NIST PQC) y Zero-Knowledge
 */
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Política de Privacidad y Certificación Determinista · Hashcod Codespace</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500;600&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-page: #090b10;
            --card-bg: #ffffff;
            --border-color: #e2e8f0;
            --primary: #0f172a;
            --accent: #2563eb;
            --text-dark: #0f172a;
            --text-muted: #64748b;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            background: var(--bg-page);
            color: #334155;
            font-family: 'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            min-height: 100vh;
            padding: 30px 16px;
            display: flex;
            justify-content: center;
            align-items: flex-start;
            line-height: 1.65;
        }

        .privacy-container {
            width: min(920px, 100%);
            background: var(--card-bg);
            border-radius: 16px;
            box-shadow: 0 25px 60px rgba(0, 0, 0, 0.45);
            overflow: hidden;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .privacy-header {
            background: #f8fafc;
            padding: 26px 32px;
            border-bottom: 1px solid var(--border-color);
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            flex-wrap: wrap;
        }

        .badge-pqc {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: #eff6ff;
            color: #1d4ed8;
            border: 1px solid #bfdbfe;
            font-size: 11.5px;
            font-weight: 600;
            padding: 4px 10px;
            border-radius: 20px;
        }

        .badge-pqc svg {
            width: 13px;
            height: 13px;
            fill: currentColor;
        }

        .privacy-title {
            font-size: 20px;
            font-weight: 700;
            color: var(--text-dark);
            margin-top: 6px;
        }

        .privacy-tabs {
            display: flex;
            background: #f1f5f9;
            padding: 6px 12px;
            border-bottom: 1px solid var(--border-color);
            gap: 6px;
            overflow-x: auto;
        }

        .tab-btn {
            background: transparent;
            border: none;
            padding: 9px 15px;
            border-radius: 8px;
            font-size: 12.5px;
            font-weight: 600;
            color: #64748b;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 7px;
            transition: all 0.15s ease;
            white-space: nowrap;
            font-family: inherit;
        }

        .tab-btn:hover {
            color: var(--text-dark);
            background: rgba(255, 255, 255, 0.7);
        }

        .tab-btn.active {
            background: #ffffff;
            color: var(--text-dark);
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .tab-btn svg {
            width: 15px;
            height: 15px;
            fill: currentColor;
        }

        .privacy-content {
            padding: 30px 34px;
            font-size: 13.5px;
        }

        .tab-pane {
            display: none;
            animation: fadeIn 0.2s ease-out;
        }

        .tab-pane.active {
            display: block;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(4px); }
            to { opacity: 1; transform: translateY(0); }
        }

        h3 {
            font-size: 15px;
            font-weight: 700;
            color: var(--text-dark);
            margin: 20px 0 10px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        h3:first-child {
            margin-top: 0;
        }

        p {
            margin-bottom: 14px;
        }

        ul {
            margin: 0 0 16px 22px;
        }

        li {
            margin-bottom: 7px;
        }

        .vector-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
            gap: 14px;
            margin: 16px 0;
        }

        .vector-card {
            background: #f8fafc;
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 14px 16px;
            display: flex;
            flex-direction: column;
            gap: 6px;
            transition: transform 0.15s, border-color 0.15s;
        }

        .vector-card:hover {
            transform: translateY(-2px);
            border-color: #cbd5e1;
            box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }

        .vector-card-head {
            display: flex;
            align-items: center;
            gap: 8px;
            font-weight: 700;
            font-size: 13px;
            color: var(--text-dark);
        }

        .vector-card-head svg {
            width: 18px;
            height: 18px;
            fill: #0ea5e9;
            flex-shrink: 0;
        }

        .vector-card-desc {
            font-size: 12px;
            color: var(--text-muted);
            line-height: 1.5;
        }

        .highlight-box {
            background: #f0fdf4;
            border-left: 4px solid #16a34a;
            color: #14532d;
            padding: 14px 18px;
            margin-bottom: 20px;
            border-radius: 6px;
            font-size: 12.5px;
        }

        .evidence-img {
            width: 100%;
            border-radius: 10px;
            border: 1px solid var(--border-color);
            margin-top: 12px;
            cursor: pointer;
            transition: opacity 0.15s;
        }

        .evidence-img:hover {
            opacity: 0.95;
        }

        .privacy-footer {
            background: #f8fafc;
            padding: 18px 32px;
            border-top: 1px solid var(--border-color);
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 16px;
            flex-wrap: wrap;
        }

        .btn-back {
            background: var(--primary);
            color: #ffffff;
            text-decoration: none;
            padding: 9px 18px;
            border-radius: 8px;
            font-size: 12.5px;
            font-weight: 600;
            display: inline-flex;
            align-items: center;
            gap: 6px;
        }

        .btn-back:hover {
            background: #1e293b;
        }
    </style>
</head>
<body>

<div class="privacy-container">
    <!-- Header -->
    <div class="privacy-header">
        <div>
            <span class="badge-pqc">
                <svg viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/></svg>
                Post-Quantum Cryptography (NIST ML-DSA-87) · Zero-Knowledge
            </span>
            <h1 class="privacy-title">Política de Privacidad y Modelo Operativo · Hashcod Codespace</h1>
        </div>
        <a href="/" class="btn-back">
            <svg style="width:14px;height:14px;fill:currentColor;" viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
            Volver al Codespace
        </a>
    </div>

    <!-- Tabs Navigation -->
    <div class="privacy-tabs">
        <button type="button" class="tab-btn active" onclick="switchTab('tab-scope')" id="btn-tab-scope">
            <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
            1. Alcance & Cero Telemetría
        </button>
        <button type="button" class="tab-btn" onclick="switchTab('tab-openclaw')" id="btn-tab-openclaw">
            <svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 15h-2v-6h2zm0-8h-2V7h2z"/></svg>
            2. OpenClaw 🦞 & Agentes
        </button>
        <button type="button" class="tab-btn" onclick="switchTab('tab-crypto')" id="btn-tab-crypto">
            <svg viewBox="0 0 24 24"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>
            3. Criptografía PQC & Strix
        </button>
        <button type="button" class="tab-btn" onclick="switchTab('tab-storage')" id="btn-tab-storage">
            <svg viewBox="0 0 24 24"><path d="M2 20h20v-4H2v4zm2-3h2v2H4v-2zM2 4v4h20V4H2zm4 3H4V5h2v2zm-4 7h20v-4H2v4zm2-3h2v2H4v-2z"/></svg>
            4. SODA Storage & Docs
        </button>
        <button type="button" class="tab-btn" onclick="switchTab('tab-license')" id="btn-tab-license">
            <svg viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
            5. Licenciamiento FOSS
        </button>
        <button type="button" class="tab-btn" onclick="switchTab('tab-evidence')" id="btn-tab-evidence">
            <svg viewBox="0 0 24 24"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
            6. Evidencias & Auditoría
        </button>
    </div>

    <!-- Content -->
    <div class="privacy-content">
        
        <!-- PANE 1: ALCANCE & CERO TELEMETRÍA -->
        <div class="tab-pane active" id="pane-tab-scope">
            <div class="highlight-box">
                <div style="font-weight:700; margin-bottom:4px; display:flex; align-items:center; gap:6px;">
                    <svg style="width:16px;height:16px;fill:#16a34a;" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                    Declaración de Soberanía de Datos y Cero Telemetría (Own-Your-Data)
                </div>
                <p style="margin:0;">
                    <strong>Hashcod Codespace</strong> está diseñado para garantizar la privacidad absoluta del desarrollador. No implementamos rastreadores de publicidad, no comercializamos telemetría de usuario y todos los archivos y repositorios se almacenan y ejecutan de manera aislada en tu carpeta de trabajo local <code>~/workspace</code>.
                </p>
            </div>

            <h3>🏛️ Arquitectura Operativa y Servicios Activos</h3>
            <p>La plataforma integra de forma real y funcional los siguientes módulos de cómputo y desarrollo:</p>
            <div class="vector-grid">
                <div class="vector-card">
                    <div class="vector-card-head">
                        <svg viewBox="0 0 24 24"><path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/></svg>
                        Motores Nativos Multi-Lenguaje
                    </div>
                    <div class="vector-card-desc">
                        Micro-core ultra rápido en <strong>C99</strong>, orquestador concurrente en <strong>Go</strong> (Goroutines pool), stack de inferencia LLM en <strong>Rust</strong> (NVIDIA Dynamo) y backend dinámico <strong>PHP 8.1 / Python 3.12</strong>.
                    </div>
                </div>

                <div class="vector-card">
                    <div class="vector-card-head">
                        <svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
                        Workspace Central & POSIX Shell
                    </div>
                    <div class="vector-card-desc">
                        Terminal Bash interactiva con soporte POSIX completo, comandos integrados de clonación y guardado de repositorios Git, y lanzadores de escritorios virtuales.
                    </div>
                </div>

                <div class="vector-card">
                    <div class="vector-card-head">
                        <svg viewBox="0 0 24 24"><path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9z"/></svg>
                        Dual-Catalyst 4-ENV Tunnel
                    </div>
                    <div class="vector-card-desc">
                        Canales de comunicación aislados <code>/a</code> (macho: 1 vía ENV_1 ➜ ENV_3) y <code>/b</code> (hembra: 2 vías reactivas ENV_2 ⟷ ENV_4) para flujos de datos sin colisiones.
                    </div>
                </div>

                <div class="vector-card">
                    <div class="vector-card-head">
                        <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm4.59-12.42L10 14.17l-2.59-2.58L6 13l4 4 8-8z"/></svg>
                        Certificación Determinista de IA
                    </div>
                    <div class="vector-card-desc">
                        Software de verificación que audita entradas, salidas y modelos empleados, emitiendo certificados criptográficos inmutables respaldados por firmas NIST PQC.
                    </div>
                </div>
            </div>
        </div>

        <!-- PANE 2: OPENCLAW & AGENTES -->
        <div class="tab-pane" id="pane-tab-openclaw">
            <div class="highlight-box" style="background:#fff7ed; border-left-color:#ea580c; color:#9a3412;">
                <div style="font-weight:700; margin-bottom:4px; display:flex; align-items:center; gap:6px;">
                    <span style="font-size:16px;">🦞</span> OpenClaw Multi-Channel AI Gateway & Autonomous Agents
                </div>
                <p style="margin:0;">
                    La plataforma integra el ecosistema <strong>OpenClaw 2026.8.1</strong> para orquestar agentes autónomos multi-canal sobre el workspace central.
                </p>
            </div>

            <h3>🦞 Tratamiento de Datos en el Gateway OpenClaw</h3>
            <ul>
                <li><strong>Puerto RPC y Gateway Local (18789):</strong> El daemon opera en un puerto local aislado (<code>127.0.0.1:18789</code>) comunicándose vía WebSocket y HTTP RPC seguro con el Codespace.</li>
                <li><strong>Zero-Data Retention en Canales de Mensajería:</strong> Los mensajes procesados a través de WhatsApp, Telegram, Discord, Slack o Webhooks son utilizados exclusivamente para ejecutar la tarea solicitada y devolver la respuesta al operador, sin retención secundaria en servidores externos.</li>
                <li><strong>50+ Habilidades Autónomas Aisladas (Skills):</strong> Las habilidades activas (<code>coding-agent</code>, <code>diagram-maker</code>, <code>github</code>, <code>gh-issues</code>, <code>gemini</code>, <code>active-memory</code>) operan dentro de los límites estrictos del directorio <code>workspace/</code>.</li>
                <li><strong>Custodia de API Keys de Modelos:</strong> Las credenciales para Claude 3.7 Sonnet, OpenAI o Gemini se leen directamente desde la bóveda criptográfica local y nunca se comparten con terceros.</li>
            </ul>
        </div>

        <!-- PANE 3: CRIPTOGRAFÍA PQC & STRIX -->
        <div class="tab-pane" id="pane-tab-crypto">
            <div class="highlight-box" style="background:#f8fafc; border-left-color:#6366f1; color:#1e1b4b;">
                <div style="font-weight:700; margin-bottom:4px; display:flex; align-items:center; gap:6px;">
                    <svg style="width:16px;height:16px;fill:#6366f1;" viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>
                    Seguridad Post-Cuántica (NIST PQC) y Auditoría Strix AI
                </div>
                <p style="margin:0;">
                    Implementación nativa de los algoritmos estandarizados por el NIST para resistencia frente a computación cuántica.
                </p>
            </div>

            <h3>🔐 Bóveda Criptográfica y Firmas Digitales</h3>
            <ul>
                <li><strong>CRYSTALS-Dilithium Nivel 5 (ML-DSA-87):</strong> Empleado para la autenticación criptográfica del panel de administración y verificación de integridad de código.</li>
                <li><strong>SPHINCS+ (SLH-DSA-SHAKE-256s):</strong> Sellos criptográficos sin estado para certificación inmutable de activos.</li>
                <li><strong>Bóveda AES-256-GCM:</strong> Cifrado simétrico autenticado para proteger credenciales y claves de cuenta en <code>data_storage/hashcod_keys</code>.</li>
                <li><strong>Strix Security Scanner:</strong> Auditor autónomo en Python (<code>strix_scanner.py</code>) que evalúa en tiempo real puertos abiertos, directivas de seguridad CSP, HSTS y cabeceras OWASP contra vulnerabilidades de red.</li>
            </ul>
        </div>

        <!-- PANE 4: SODA STORAGE & DOCS -->
        <div class="tab-pane" id="pane-tab-storage">
            <div class="highlight-box" style="background:#f0fdfa; border-left-color:#0d9488; color:#134e4a;">
                <div style="font-weight:700; margin-bottom:4px; display:flex; align-items:center; gap:6px;">
                    <svg style="width:16px;height:16px;fill:#0d9488;" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/></svg>
                    SODA Storage Controller & Suites de Documentos Locales
                </div>
                <p style="margin:0;">
                    Almacenamiento unificado de datos y edición ofimática local sin dependencia de nubes cerradas.
                </p>
            </div>

            <h3>💾 Almacenamiento y Edición de Documentos</h3>
            <ul>
                <li><strong>SODA Storage Pools & Fileshares:</strong> Controlador en Python (<code>storage_controller.py</code>) para aprovisionamiento dinámico de volúmenes NVMe y carpetas compartidas NFS/POSIX.</li>
                <li><strong>TipTap Editor (Word-like):</strong> Editor nativo enriquecido para documentos técnicos montado localmente en <code>/tiptap</code>.</li>
                <li><strong>LibreOffice Server Workspace:</strong> Suite ofimática completa ejecutada en el servidor sin transferir archivos a nubes de terceros.</li>
                <li><strong>Persistencia Supabase Cloud:</strong> Tablas relacionales PostgreSQL sincronizadas con cifrado en reposo para metadatos de sesión y kits de recuperación L8REC.</li>
            </ul>
        </div>

        <!-- PANE 5: LICENCIAMIENTO FOSS -->
        <div class="tab-pane" id="pane-tab-license">
            <div class="highlight-box" style="background:#f8fafc; border-left-color:#475569; color:#0f172a;">
                <div style="font-weight:700; margin-bottom:4px; display:flex; align-items:center; gap:6px;">
                    <svg style="width:16px;height:16px;fill:#475569;" viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
                    Declaración Oficial de Licencias Open Source & Propiedad
                </div>
                <p style="margin:0;">
                    Transparencia en el uso de componentes de código abierto y deslinde de licencias.
                </p>
            </div>

            <h3>⚖️ Desglose de Licencias</h3>
            <ul>
                <li><strong>GNU Bash (GNU GPLv3):</strong> La herramienta de terminal GNU Bash integrada para la interpretación y ejecución de comandos es software libre distribuido bajo los términos de la <strong>GNU General Public License v3</strong>. Dicha licencia aplica exclusivamente al ejecutable y código del motor Bash.</li>
                <li><strong>OpenClaw (Licencia MIT):</strong> El framework de gateway y agente OpenClaw es software de código abierto bajo licencia MIT.</li>
                <li><strong>Propiedad Intelectual de Hashcod:</strong> Todo el núcleo orquestador, la arquitectura Dual-Catalyst 4-ENV, las firmas post-cuánticas Dilithium-5, el panel Warp y la interfaz gráfica completa son propiedad exclusiva de <strong>Hashcod Codespace</strong>.</li>
            </ul>
        </div>

        <!-- PANE 6: EVIDENCIAS & AUDITORÍA -->
        <div class="tab-pane" id="pane-tab-evidence">
            <h3>📸 Evidencia de Análisis y Software de Certificación</h3>
            <p>Muestra real del software de análisis de datos y telemetría de interacción con IA utilizado para respaldar las certificaciones deterministas emitidas por la plataforma:</p>
            
            <div style="background:#f8fafc; border:1px solid var(--border-color); border-radius:12px; padding:16px; margin-top:14px;">
                <img src="gus-mav-analysis-sample.png" alt="Software de prueba de uso de IA a través de chat local por API Rest (GUS MAV)" class="evidence-img" onclick="window.open('gus-mav-analysis-sample.png', '_blank')" title="Haz clic para ver la captura en tamaño completo">
                <div style="margin-top:12px; font-size:12.5px; color:#475569; line-height:1.5;">
                    <strong>Figura 1: Software de prueba de uso de IA a través de chat local por API Rest (GUS MAV v1.1.1).</strong>
                    <p style="margin:6px 0 0;">
                        Registro de canales de <em>Inputs</em>, <em>Outputs</em>, repeticiones y modelos empleados en tiempo real para respaldar de forma determinista la certificación de proyectos creados con IA.
                    </p>
                </div>
            </div>

            <div style="background:#f8fafc; border:1px solid var(--border-color); border-radius:12px; padding:16px; margin-top:20px;">
                <div style="font-size:14px; font-weight:700; color:#0f172a; margin-bottom:10px; display:flex; align-items:center; gap:8px;">
                    <svg style="width:18px;height:18px;fill:#16a34a;" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.699c.971.53 1.879.814 2.795.815 3.179 0 5.767-2.587 5.768-5.766.001-3.18-2.585-5.767-5.767-5.801zm3.376 8.163c-.144.405-.837.774-1.17.824-.312.045-.694.072-2.025-.48-1.583-.657-2.589-2.28-2.667-2.384-.078-.104-.633-.842-.633-1.608 0-.765.401-1.141.543-1.295.144-.155.312-.194.417-.194.104 0 .208.001.299.006.096.004.224-.036.35.267.13.312.443 1.077.482 1.156.039.078.065.169.013.273-.052.104-.078.169-.156.26-.078.091-.163.203-.234.273-.078.078-.16.163-.069.318.091.156.403.666.865 1.077.595.53 1.097.694 1.253.772.156.078.247.065.338-.039.091-.104.39-.455.494-.611.104-.156.208-.13.351-.078.143.052.91.429 1.066.507.156.078.26.117.299.182.039.065.039.377-.105.782z"/></svg>
                    <span>Como debe de verse el whatsapp</span>
                </div>
                <img src="whatsapp-checkout-preview.png" alt="Como debe de verse el whatsapp - diktatcart" class="evidence-img" onclick="window.open('whatsapp-checkout-preview.png', '_blank')" title="Haz clic para ver la captura en tamaño completo" style="max-width:640px; display:block; margin:0 auto; box-shadow:0 2px 8px rgba(0,0,0,0.06);">
                <div style="margin-top:12px; font-size:12.5px; color:#475569; line-height:1.5;">
                    <strong>Figura 2: Interfaz oficial de solicitud y checkout vía WhatsApp (diktatcart: 829-472-1257).</strong>
                    <p style="margin:6px 0 0;">
                        Muestra c&oacute;mo debe de verse la pantalla de WhatsApp al iniciar la solicitud de suscripci&oacute;n mensual de <strong>US$ 60.27</strong> para Hashcod Codespace y obtener la clave de acceso Dilithium-5 tras la confirmaci&oacute;n del dep&oacute;sito o transferencia bancaria.
                    </p>
                </div>
            </div>
        </div>

    </div>


        <!-- PANE 7: VALIDACIÓN GUBERNAMENTAL & LEGAL (REPÚBLICA DOMINICANA) -->
        <div class="tab-pane" id="pane-tab-gov">
            <div class="highlight-box" style="background:#f0f9ff; border-left-color:#0284c7; color:#0369a1;">
                <div style="font-weight:700; margin-bottom:4px; display:flex; align-items:center; gap:6px;">
                    <span style="font-size:18px;">🇩🇴</span>
                    Certificación, Registro de Marca y Validación Oficial del Gobierno Dominicano
                </div>
                <p style="margin:0;">
                    <strong>Hashcod Codespace</strong> y su plataforma de certificación determinista de software e Inteligencia Artificial operan bajo pleno amparo y registro legal ante las instituciones gubernamentales de la <strong>República Dominicana</strong>: <strong>ONAPI</strong> (Oficina Nacional de la Propiedad Industrial), <strong>DGII</strong> (Dirección General de Impuestos Internos) y el <strong>Registro Mercantil</strong> de la Cámara de Comercio.
                </p>
            </div>

            <h3>🏛️ Títulos y Certificados Oficiales del Estado Dominicano</h3>
            <p style="font-size:13.5px; color:#475569; margin-bottom:16px;">
                A continuación se presentan los registros públicos y resoluciones emitidas por los ministerios competentes:
            </p>

            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(320px, 1fr)); gap:20px; margin-top:14px;">
                
                <!-- 1. ONAPI Certificado Marca -->
                <div style="background:#ffffff; border:1px solid var(--border-color); border-radius:12px; padding:16px; box-shadow:0 2px 6px rgba(0,0,0,0.04);">
                    <div style="font-size:13px; font-weight:700; color:#0f172a; margin-bottom:10px; display:flex; align-items:center; gap:6px;">
                        <span style="background:#e0f2fe; color:#0369a1; padding:3px 8px; border-radius:4px; font-size:11px; font-weight:700;">ONAPI</span>
                        Certificado de Marca Mixta "Hashcod"
                    </div>
                    <img src="gob-onapi-marca-hashcod.png" alt="Certificado ONAPI de Registro de Marca Mixta Hashcod" class="evidence-img" onclick="window.open('gob-onapi-marca-hashcod.png', '_blank')" title="Clic para ampliar documento" style="max-height:480px; object-fit:contain; width:100%;">
                    <div style="margin-top:12px; font-size:12px; color:#475569; line-height:1.5;">
                        <strong>Registro Oficial Núm. 336973 (Clase 42 Internacional)</strong><br>
                        <strong>Vigencia:</strong> 18/08/2026 – 18/08/2036 (10 años renovables)<br>
                        <strong>Servicios Autorizados:</strong> Software como Servicio (SaaS), Desarrollo de Software, Criptografía aplicada a software, Protección de datos digitales, Certificación determinista de IA y Almacenamiento seguro.
                    </div>
                </div>

                <!-- 2. ONAPI Oficio de Envío -->
                <div style="background:#ffffff; border:1px solid var(--border-color); border-radius:12px; padding:16px; box-shadow:0 2px 6px rgba(0,0,0,0.04);">
                    <div style="font-size:13px; font-weight:700; color:#0f172a; margin-bottom:10px; display:flex; align-items:center; gap:6px;">
                        <span style="background:#e0f2fe; color:#0369a1; padding:3px 8px; border-radius:4px; font-size:11px; font-weight:700;">ONAPI</span>
                        Oficio de Concesión y Registro
                    </div>
                    <img src="gob-onapi-cert-envio.png" alt="Envío de Certificación de Registro de Marca ONAPI" class="evidence-img" onclick="window.open('gob-onapi-cert-envio.png', '_blank')" title="Clic para ampliar documento" style="max-height:480px; object-fit:contain; width:100%;">
                    <div style="margin-top:12px; font-size:12px; color:#475569; line-height:1.5;">
                        <strong>Solicitud Núm.: 2026-35462</strong><br>
                        <strong>Titular:</strong> Emil Enmanuel Pieter Mora<br>
                        <strong>Entidad:</strong> Ministerio de Industria, Comercio y Mipymes (MICM) / Dirección de Signos Distintivos (Lic. Michelle Marie Guzmán Soñé).
                    </div>
                </div>

                <!-- 3. DGII Certificación RNC -->
                <div style="background:#ffffff; border:1px solid var(--border-color); border-radius:12px; padding:16px; box-shadow:0 2px 6px rgba(0,0,0,0.04);">
                    <div style="font-size:13px; font-weight:700; color:#0f172a; margin-bottom:10px; display:flex; align-items:center; gap:6px;">
                        <span style="background:#dcfce7; color:#15803d; padding:3px 8px; border-radius:4px; font-size:11px; font-weight:700;">DGII</span>
                        Certificación de Registro Tributario
                    </div>
                    <img src="gob-dgii-rnc-certificacion.png" alt="Certificación DGII RNC Activo" class="evidence-img" onclick="window.open('gob-dgii-rnc-certificacion.png', '_blank')" title="Clic para ampliar documento" style="max-height:480px; object-fit:contain; width:100%;">
                    <div style="margin-top:12px; font-size:12px; color:#475569; line-height:1.5;">
                        <strong>RNC No.: 40209369293 (Certificado C0426011487298)</strong><br>
                        <strong>Condición:</strong> Contribuyente Activo Ordinario<br>
                        <strong>Actividad Económica:</strong> Diseño y Desarrollo de Software.<br>
                        <strong>Ministerio:</strong> Hacienda y Economía / DGII República Dominicana.
                    </div>
                </div>

                <!-- 4. Cámara de Comercio Registro Mercantil (3 Páginas Completas) -->
                <div style="background:#ffffff; border:1px solid var(--border-color); border-radius:12px; padding:18px; box-shadow:0 2px 6px rgba(0,0,0,0.04); grid-column: 1 / -1;">
                    <div style="font-size:14px; font-weight:700; color:#0f172a; margin-bottom:12px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px;">
                        <div style="display:flex; align-items:center; gap:8px;">
                            <span style="background:#fef3c7; color:#b45309; padding:4px 10px; border-radius:4px; font-size:11.5px; font-weight:700;">REGISTRO MERCANTIL</span>
                            <span>Cámara de Comercio y Producción de La Vega (RM No. 3323LV-PF · DIKTATCART)</span>
                        </div>
                        <span style="font-size:12px; color:#64748b;">Conforme a la Ley No. 3-02 y Ley No. 126-02 sobre Firma Digital</span>
                    </div>

                    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:16px; margin-bottom:14px;">
                        <div>
                            <div style="font-size:12px; font-weight:600; color:#334155; margin-bottom:6px;">Página 1: Titularidad & RNC</div>
                            <img src="gob-camara-comercio-registro-mercantil-p1.png" alt="Registro Mercantil Página 1" class="evidence-img" onclick="window.open('gob-camara-comercio-registro-mercantil-p1.png', '_blank')" title="Clic para ampliar Página 1" style="width:100%; border-radius:8px; border:1px solid #cbd5e1; cursor:pointer; box-shadow:0 2px 6px rgba(0,0,0,0.06);">
                        </div>
                        <div>
                            <div style="font-size:12px; font-weight:600; color:#334155; margin-bottom:6px;">Página 2: Objeto, IA & Criptografía</div>
                            <img src="gob-camara-comercio-registro-mercantil-p2.png" alt="Registro Mercantil Página 2" class="evidence-img" onclick="window.open('gob-camara-comercio-registro-mercantil-p2.png', '_blank')" title="Clic para ampliar Página 2" style="width:100%; border-radius:8px; border:1px solid #cbd5e1; cursor:pointer; box-shadow:0 2px 6px rgba(0,0,0,0.06);">
                        </div>
                        <div>
                            <div style="font-size:12px; font-weight:600; color:#334155; margin-bottom:6px;">Página 3: Firma Digital & Registrador</div>
                            <img src="gob-camara-comercio-registro-mercantil-p3.png" alt="Registro Mercantil Página 3" class="evidence-img" onclick="window.open('gob-camara-comercio-registro-mercantil-p3.png', '_blank')" title="Clic para ampliar Página 3" style="width:100%; border-radius:8px; border:1px solid #cbd5e1; cursor:pointer; box-shadow:0 2px 6px rgba(0,0,0,0.06);">
                        </div>
                    </div>

                    <div style="font-size:12.5px; color:#475569; line-height:1.55; background:#f8fafc; padding:12px 14px; border-radius:8px; border:1px solid #e2e8f0;">
                        <strong>Nombre Comercial / Establecimiento:</strong> DIKTATCART (Reg. No. 925063)<br>
                        <strong>Titular:</strong> Emil Enmanuel Pieter Mora · <strong>RNC:</strong> 402-0936929-3 · <strong>WhatsApp Oficial:</strong> (829) 472-1257<br>
                        <strong>Actividad Registrada:</strong> Diseño y desarrollo de software, soluciones digitales, Inteligencia Artificial, automatización y herramientas criptográficas para usuarios y desarrolladores.<br>
                        <strong>Validación Oficial:</strong> Código electrónico <code>87CD8008-AC9C-481B-8C8B-1D63D2246AD1</code> verificable en <code>www.camaralavega.org.do</code>.
                    </div>
                </div>

            </div>
        </div>

    <!-- Footer -->
    <div class="privacy-footer">
        <div style="font-size:12px; color:var(--text-muted); display:flex; align-items:center; gap:6px;">
            <svg style="width:14px;height:14px;fill:#10b981;" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
            <span>Vigencia 2026.8 · Cumplimiento NIST PQC & Zero-Knowledge</span>
        </div>
        <a href="/" class="btn-back">
            Entendido y Aceptar Política
        </a>
    </div>
</div>

<script>
    function switchTab(tabId) {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
        
        const btn = document.getElementById('btn-' + tabId);
        const pane = document.getElementById('pane-' + tabId);
        if (btn) btn.classList.add('active');
        if (pane) pane.classList.add('active');
    }
</script>

</body>
</html>
