<?php
// index.php - Servidor Native PHP + React TypeScript l8
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Servidor de Ejecución y Comandos</title>
    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            background-color: #ffffff;
            color: #000000;
            font-family: monospace, 'Courier New', Courier, Consolas;
            font-size: 13px;
            -webkit-font-smoothing: antialiased;
        }

        .top-bar {
            background-color: #e5e5e5;
            border-bottom: 1px solid #d0d0d0;
            padding: 4px 8px;
            font-size: 13px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            color: #222222;
            user-select: none;
            position: sticky;
            top: 0;
            z-index: 10;
        }

        .left-controls {
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .checkbox-label {
            display: flex;
            align-items: center;
            gap: 6px;
            cursor: pointer;
        }

        .checkbox-label input {
            cursor: pointer;
        }

        .icon-globe {
            height: 20px;
            width: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            padding-right: 4px;
        }

        .icon-globe svg {
            height: 18px;
            width: 18px;
            max-width: 18px;
            max-height: 18px;
            fill: #000000;
            display: block;
        }

        .main-container {
            padding: 12px;
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        /* Estilo de los bloques (=) y (>) adaptados al diseño */
        .block-row {
            display: flex;
            align-items: stretch;
            background-color: #e0e0e0;
            border: 1px solid #cccccc;
            border-radius: 2px;
            min-height: 38px;
        }

        .block-symbol {
            width: 38px;
            min-width: 38px;
            background-color: #d0d0d0;
            border-right: 1px solid #bbbbbb;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 18px;
            color: #000000;
            user-select: none;
        }

        .block-body {
            flex: 1;
            padding: 8px 12px;
            background-color: #f6f6f6;
            display: flex;
            align-items: center;
            word-break: break-all;
            white-space: pre-wrap;
            line-height: 1.4;
            font-family: monospace, 'Courier New', Courier;
        }

        /* Bloque (=) de ejecuciones */
        .block-execution .block-body {
            background-color: #ffffff;
            min-height: 80px;
            max-height: 500px;
            overflow-y: auto;
            align-items: flex-start;
        }

        /* Bloque (>) de introducción de comandos */
        .block-input-container {
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
        }

        .cmd-input {
            flex: 1;
            border: none;
            outline: none;
            background: transparent;
            font-family: monospace, 'Courier New', Courier;
            font-size: 13px;
            color: #000000;
            padding: 2px 0;
        }

        .cmd-input::placeholder {
            color: #888888;
        }

        .cell-action-icon {
            width: 22px;
            height: 22px;
            min-width: 22px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            opacity: 0.85;
            transition: opacity 0.2s ease, transform 0.15s ease;
        }

        .cell-action-icon:hover {
            opacity: 1;
            transform: scale(1.08);
        }

        .cell-action-icon svg {
            width: 22px;
            height: 22px;
            display: block;
        }

        /* Filas verticales para el comando mane_list? */
        .vertical-cmd-table {
            display: flex;
            flex-direction: column;
            gap: 4px;
            width: 100%;
        }

        .vertical-cmd-row {
            display: flex;
            align-items: center;
            font-family: monospace, 'Courier New', Courier;
            font-size: 13px;
            line-height: 1.5;
        }

        .vertical-cmd-name {
            color: #0451a5;
            font-weight: bold;
            min-width: 130px;
        }

        .vertical-cmd-sep {
            color: #777777;
            margin: 0 8px;
        }

        .vertical-cmd-desc {
            color: #111111;
        }

        .json-key { color: #0451a5; }
        .json-string { color: #a31515; }
        .json-number { color: #098658; }
        .json-boolean { color: #0000ff; }
        .json-null { color: #0000ff; }

        .clickable-symbol {
            cursor: pointer;
            transition: background-color 0.2s ease;
        }

        .clickable-symbol:hover {
            background-color: #bbbbbb;
        }

        /* Ventana desplegable de funciones debajo de (>) */
        .function-drawer-wrapper {
            display: flex;
            flex-direction: column;
            width: 100%;
        }

        .function-drawer {
            display: none;
            background-color: #ffffff;
            border: 1px solid #cccccc;
            border-top: none;
            padding: 16px 20px;
            box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06);
            margin-top: -1px;
            animation: fadeInDrawer 0.25s ease-out;
        }

        .function-drawer.open {
            display: block;
        }

        @keyframes fadeInDrawer {
            from { opacity: 0; transform: translateY(-4px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .function-drawer-header {
            font-family: monospace, 'Courier New', Courier;
            font-size: 14px;
            font-weight: bold;
            color: #000000;
            margin-bottom: 14px;
            letter-spacing: 0.2px;
        }

        .function-drawer-inner {
            background-color: #000000;
            padding: 14px;
            border-radius: 3px;
        }

        .function-editor {
            width: 100%;
            height: 140px;
            background-color: #000000;
            color: #ffffff;
            border: none;
            outline: none;
            resize: vertical;
            font-family: monospace, 'Courier New', Courier, Consolas;
            font-size: 13px;
            line-height: 1.5;
            caret-color: #ffffff;
        }

        .function-editor::placeholder {
            color: #666666;
        }

        /* NUEVA ESTRUCTURA DE 3 PANELES (key window | Vector graphic | Equations window) */
        .virtual-keyboard-white {
            display: none;
            margin-top: 16px;
            background-color: #ffffff;
            border: 1px solid #d8d8d8;
            border-radius: 6px;
            padding: 16px;
            user-select: none;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
            animation: fadeInDrawer 0.25s ease-out;
        }

        .virtual-keyboard-white.active {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .vk-top-bar-indicators {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-bottom: 8px;
            border-bottom: 1px solid #ececec;
        }

        .vk-brand {
            font-family: monospace, 'Courier New', Courier;
            font-size: 11px;
            font-weight: bold;
            color: #888888;
            letter-spacing: 1px;
        }

        .vk-leds {
            display: flex;
            gap: 16px;
        }

        .vk-led {
            display: flex;
            align-items: center;
            gap: 6px;
            font-family: monospace, 'Courier New', Courier;
            font-size: 10px;
            color: #666666;
        }

        .led-dot {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background-color: #cccccc;
            display: inline-block;
        }

        .led-dot.active {
            background-color: #34c759;
            box-shadow: 0 0 6px #34c759;
        }

        /* Contenedor de 3 Paneles */
        .vk-3panel-container {
            display: grid;
            grid-template-columns: 1fr 1.1fr 1fr;
            gap: 12px;
            align-items: stretch;
            width: 100%;
        }

        .vk-panel {
            background-color: #ffffff;
            border: 2px solid #000000;
            padding: 12px;
            display: flex;
            flex-direction: column;
            min-height: 240px;
        }

        .vk-panel-header, .vector-graphic-title {
            font-family: monospace, 'Courier New', Courier;
            font-size: 15px;
            color: #000000;
            text-align: center;
            margin-bottom: 12px;
            letter-spacing: 0.5px;
        }

        .key-window-panel {
            justify-content: flex-start;
        }

        .key-window-grid {
            display: flex;
            flex-direction: column;
            gap: 6px;
            width: 100%;
            height: 100%;
        }

        .vk-row {
            display: flex;
            gap: 5px;
            width: 100%;
        }

        .vk-key {
            background: linear-gradient(180deg, #ffffff 0%, #f4f4f7 100%);
            color: #222222;
            border: 1px solid #d0d0d5;
            border-bottom: 2px solid #b8b8c0;
            border-radius: 4px;
            font-family: monospace, 'Courier New', Courier;
            font-size: 12px;
            font-weight: 600;
            height: 38px;
            flex: 1;
            padding: 2px 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            cursor: pointer;
            transition: all 0.1s ease;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }

        .vk-key:hover {
            background: linear-gradient(180deg, #ffffff 0%, #e9e9f0 100%);
            border-color: #a8a8b3;
            transform: translateY(-1px);
        }

        .vk-key:active {
            background: #e0e0e8;
            border-bottom-width: 1px;
            transform: translateY(1px);
            box-shadow: none;
        }

        .key-f {
            background: linear-gradient(180deg, #ff4d4d 0%, #d90000 100%);
            color: #ffffff;
            border: 1px solid #b30000;
            border-bottom: 2px solid #800000;
            font-weight: bold;
        }

        .key-enter {
            background: linear-gradient(180deg, #e6f0ff 0%, #cce0ff 100%);
            border-color: #99c2ff;
            color: #0052cc;
        }

        .key-num-zero {
            flex: 2;
        }

        /* Panel Central Vector Graphic con Doble Marco Rectangular */
        .vector-graphic-panel {
            padding: 0;
            border: none;
            background: transparent;
        }

        .vector-outer-frame {
            border: 2px solid #000000;
            padding: 4px;
            background-color: #ffffff;
            height: 100%;
            display: flex;
            flex-direction: column;
        }

        .vector-inner-frame {
            border: 1px solid #000000;
            height: 100%;
            padding: 12px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-start;
            position: relative;
        }

        .vector-canvas {
            width: 100%;
            height: 100%;
            min-height: 160px;
            border: 1px dashed #d0d0d0;
            border-radius: 4px;
            background-color: #fafafa;
        }

        /* Panel Derecho Equations Window */
        .equations-window-panel {
            justify-content: flex-start;
        }

        .equations-editor-container {
            width: 100%;
            height: 100%;
            display: flex;
        }

        .equations-editor {
            width: 100%;
            height: 100%;
            min-height: 160px;
            background-color: #ffffff;
            color: #000000;
            border: 1px solid #cccccc;
            border-radius: 3px;
            outline: none;
            padding: 10px;
            resize: vertical;
            font-family: monospace, 'Courier New', Courier, Consolas;
            font-size: 12px;
            line-height: 1.5;
        }

        body.raw-mode .block-execution .block-body {
            white-space: normal;
        }
    </style>
</head>
<body>
    <div class="top-bar">
        <div class="left-controls">
            <label class="checkbox-label">
                <input type="checkbox" id="formatToggle" checked onchange="toggleFormat()">
                <span>Dar formato al texto</span>
            </label>
        </div>
        <div class="icon-globe">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
                <path d="M64,1C29.3,1,1,29.3,1,64c0,8.2,1.6,16.2,4.6,23.8c0.3,0.8,1,1.4,1.7,1.7c6.8,3.1,12.4,4.7,16.7,4.7c3.2,0,5.8-0.9,7.8-2.6 c3.5-3,3.3-7,3.2-11.3c-0.1-3.8-0.3-8.2,1.7-13.5c2.4-6.4,6.1-9.6,9.7-12.8c3.5-3.1,7.2-6.3,8.2-11.8c1.6-8.6-3.7-18.1-16.4-29 C46.1,9.2,54.8,7,64,7c23.4,0,43.6,14.2,52.3,34.4c-5.3-1-13.1-1.8-18.1,1.8c-2.7,1.9-4.2,4.8-4.5,8.5c-0.1,1.2,0.2,2.8,0.6,5.2 c1.1,6,2.8,16.1-2.2,22.7c-2.2,2.9-8.3,7.1-24.6,10.5c-0.8,0.2-1.3,0.3-1.5,0.3c-11.1,3.2-24,25.6-25.4,28.9c0,0,0,0,0,0 c-0.2,0.5-0.2,1-0.1,1.6c0.2,1,0.9,1.9,1.9,2.3c6.9,2.5,14.2,3.8,21.6,3.8c34.7,0,63-28.3,63-63S98.7,1,64,1z"></path>
            </svg>
        </div>
    </div>

    <div class="main-container">
        <!-- Bloque (=) de ejecuciones -->
        <div class="block-row block-execution">
            <div class="block-symbol">=</div>
            <div class="block-body" id="executionContent"></div>
        </div>

        <!-- Bloque (>) de introducción de comandos y su ventana desplegable -->
        <div class="function-drawer-wrapper">
            <div class="block-row block-prompt">
                <div class="block-symbol clickable-symbol" id="symbolPrompt" onclick="toggleFunctionDrawer()" title="Haz clic en (>) para abrir/cerrar la ventana de funciones">
                    &gt;
                </div>
                <div class="block-body block-input-container">
                    <input type="text" id="cmdInput" class="cmd-input" placeholder="Escribe un comando aquí y presiona Enter..." autocomplete="off" onkeydown="handleCommandKey(event)">
                    <!-- Icono derecho (Insignia circular con documento) que activa/desactiva el teclado de escritorio -->
                    <div class="cell-action-icon" title="Activar/Desactivar Teclado y Entorno Gráfico" onclick="toggleVirtualKeyboard()">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="40" fill="#000000" />
                            <circle cx="82" cy="18" r="4.5" fill="#000000" />
                            <circle cx="88" cy="28" r="2.5" fill="#000000" />
                            <circle cx="78" cy="38" r="2" fill="#ffffff" />
                            <circle cx="79" cy="74" r="2.5" fill="#000000" />
                            <circle cx="28" cy="54" r="3" fill="#000000" />
                            <circle cx="34" cy="80" r="2.5" fill="#000000" />
                            <rect x="36" y="24" width="28" height="34" rx="3" fill="#ffffff" />
                            <path d="M 36 50 L 36 58 C 36 61 41 61 44 61 L 58 61 C 55 56 46 55 42 50 Z" fill="#ffffff" />
                            <line x1="41" y1="30" x2="57" y2="30" stroke="#000000" stroke-width="2.5" stroke-linecap="round" />
                            <line x1="41" y1="36" x2="60" y2="36" stroke="#000000" stroke-width="2.5" stroke-linecap="round" />
                            <line x1="41" y1="42" x2="55" y2="42" stroke="#000000" stroke-width="2.5" stroke-linecap="round" />
                            <line x1="41" y1="48" x2="60" y2="48" stroke="#000000" stroke-width="2.5" stroke-linecap="round" />
                        </svg>
                    </div>
                </div>
            </div>

            <!-- Ventana desplegable de funciones debajo de (>) -->
            <div class="function-drawer" id="functionDrawer">
                <div class="function-drawer-header">
                    &gt;/ function to execute
                </div>
                <div class="function-drawer-inner">
                    <textarea id="functionEditor" class="function-editor" placeholder="// Escribe las funciones aquí..." spellcheck="false" onkeydown="handleEditorKeyDown(event)"></textarea>
                </div>

                <!-- NUEVA ESTRUCTURA DE 3 SECCIONES (key window | Vector graphic | Equations window) -->
                <div class="virtual-keyboard-white" id="virtualKeyboard">
                    <div class="vk-top-bar-indicators">
                        <span class="vk-brand">NATIVE GRAPHIC & EQUATIONS WORKSPACE</span>
                        <div class="vk-leds">
                            <span class="vk-led"><i class="led-dot active"></i> Key Window</span>
                            <span class="vk-led"><i class="led-dot active"></i> Vector Graphic</span>
                            <span class="vk-led"><i class="led-dot active"></i> Equations Window</span>
                        </div>
                    </div>

                    <div class="vk-3panel-container">
                        <!-- Panel 1: key window (Izquierda) -->
                        <div class="vk-panel key-window-panel">
                            <div class="vk-panel-header">key window</div>
                            <div class="key-window-grid">
                                <div class="vk-row">
                                    <div class="vk-key" onclick="pressVirtualKey('7')">7</div>
                                    <div class="vk-key" onclick="pressVirtualKey('8')">8</div>
                                    <div class="vk-key" onclick="pressVirtualKey('9')">9</div>
                                    <div class="vk-key key-f" onclick="pressVirtualKey('+')">+</div>
                                </div>
                                <div class="vk-row">
                                    <div class="vk-key" onclick="pressVirtualKey('4')">4</div>
                                    <div class="vk-key" onclick="pressVirtualKey('5')">5</div>
                                    <div class="vk-key" onclick="pressVirtualKey('6')">6</div>
                                    <div class="vk-key key-f" onclick="pressVirtualKey('-')">-</div>
                                </div>
                                <div class="vk-row">
                                    <div class="vk-key" onclick="pressVirtualKey('1')">1</div>
                                    <div class="vk-key" onclick="pressVirtualKey('2')">2</div>
                                    <div class="vk-key" onclick="pressVirtualKey('3')">3</div>
                                    <div class="vk-key key-f" onclick="pressVirtualKey('*')">*</div>
                                </div>
                                <div class="vk-row">
                                    <div class="vk-key key-num-zero" onclick="pressVirtualKey('0')">0</div>
                                    <div class="vk-key" onclick="pressVirtualKey('.')">.</div>
                                    <div class="vk-key key-enter" onclick="pressVirtualKey('ENTER')">↵</div>
                                </div>
                            </div>
                        </div>

                        <!-- Panel 2: Vector graphic (Centro con doble marco rectangular) -->
                        <div class="vk-panel vector-graphic-panel">
                            <div class="vector-outer-frame">
                                <div class="vector-inner-frame">
                                    <div class="vector-graphic-title">Vector graphic</div>
                                    <svg class="vector-canvas" viewBox="0 0 300 200">
                                        <line x1="20" y1="180" x2="280" y2="180" stroke="#cccccc" stroke-width="1.5" />
                                        <line x1="20" y1="20" x2="20" y2="180" stroke="#cccccc" stroke-width="1.5" />
                                        <path d="M 20 160 Q 80 20, 150 100 T 280 40" fill="none" stroke="#0451a5" stroke-width="2.5" />
                                        <circle cx="150" cy="100" r="4" fill="#ff0000" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <!-- Panel 3: Equations window (Derecha) -->
                        <div class="vk-panel equations-window-panel">
                            <div class="vk-panel-header">Equations window</div>
                            <div class="equations-editor-container">
                                <textarea id="equationsEditor" class="equations-editor" placeholder="// Ecuaciones y fórmulas matemáticas..." spellcheck="false"></textarea>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        let latestExecutionData = null;
        let hasExecutedCommand = false;
        const executionContainer = document.getElementById('executionContent');
        const formatToggle = document.getElementById('formatToggle');
        const cmdInput = document.getElementById('cmdInput');

        function syntaxHighlight(json) {
            if (typeof json !== 'string') {
                json = JSON.stringify(json, undefined, formatToggle.checked ? 2 : undefined);
            }
            if (!formatToggle.checked) {
                return json;
            }
            json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
                let cls = 'json-number';
                if (/^"/.test(match)) {
                    if (/:$/.test(match)) {
                        cls = 'json-key';
                    } else {
                        cls = 'json-string';
                    }
                } else if (/true|false/.test(match)) {
                    cls = 'json-boolean';
                } else if (/null/.test(match)) {
                    cls = 'json-null';
                }
                return '<span class="' + cls + '">' + match + '</span>';
            });
        }

        function render() {
            if (!hasExecutedCommand || !latestExecutionData) {
                executionContainer.textContent = '';
                return;
            }

            // Si el comando no existe o devuelve error, presentar en color rojo
            if (latestExecutionData.isError || latestExecutionData.error) {
                const errorMsg = latestExecutionData.error || "Your command does not exist....";
                executionContainer.innerHTML = '<span style="color: #ff0000; font-weight: 600;">' + errorMsg + '</span>';
                return;
            }

            const dataToDisplay = latestExecutionData.output !== undefined ? latestExecutionData.output : latestExecutionData;

            // Si dataToDisplay es nulo, indefinido, o un estado del sistema sin ejecución activa
            if (!dataToDisplay || dataToDisplay.type === "EMPTY_CELL" || (dataToDisplay.execution === null && dataToDisplay.browserState)) {
                executionContainer.textContent = '';
                return;
            }

            // Renderizar filas verticales para el comando mane_list?
            if (dataToDisplay && dataToDisplay.type === "COMMAND_VERTICAL_LIST" && Array.isArray(dataToDisplay.rows)) {
                const htmlRows = dataToDisplay.rows.map(r => 
                    `<div class="vertical-cmd-row">` +
                        `<span class="vertical-cmd-name">${r.command}</span>` +
                        `<span class="vertical-cmd-sep">-</span>` +
                        `<span class="vertical-cmd-desc">${r.description}</span>` +
                    `</div>`
                ).join('');
                executionContainer.innerHTML = `<div class="vertical-cmd-table">${htmlRows}</div>`;
                return;
            }

            if (formatToggle.checked) {
                document.body.classList.remove('raw-mode');
                executionContainer.innerHTML = syntaxHighlight(dataToDisplay);
            } else {
                document.body.classList.add('raw-mode');
                executionContainer.textContent = JSON.stringify(dataToDisplay);
            }
        }

        function toggleFormat() {
            render();
        }

        async function submitCommand(cmd) {
            if (!cmd) return;
            try {
                hasExecutedCommand = true;
                const res = await fetch('/api/command', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ command: cmd })
                });
                const result = await res.json();
                latestExecutionData = result;
                render();
            } catch (e) {
                console.error("Error al enviar comando:", e);
            }
        }

        let activeInputTarget = document.getElementById('cmdInput');

        document.addEventListener('DOMContentLoaded', () => {
            const inputCmd = document.getElementById('cmdInput');
            const editorFunc = document.getElementById('functionEditor');
            const editorEq = document.getElementById('equationsEditor');

            if (inputCmd) {
                inputCmd.addEventListener('focus', () => { activeInputTarget = inputCmd; });
                inputCmd.addEventListener('click', () => { activeInputTarget = inputCmd; });
            }
            if (editorFunc) {
                editorFunc.addEventListener('focus', () => { activeInputTarget = editorFunc; });
                editorFunc.addEventListener('click', () => { activeInputTarget = editorFunc; });
            }
            if (editorEq) {
                editorEq.addEventListener('focus', () => { activeInputTarget = editorEq; });
                editorEq.addEventListener('click', () => { activeInputTarget = editorEq; });
            }
        });

        function toggleVirtualKeyboard() {
            const drawer = document.getElementById('functionDrawer');
            const vk = document.getElementById('virtualKeyboard');
            
            if (!drawer.classList.contains('open')) {
                drawer.classList.add('open');
            }
            
            vk.classList.toggle('active');
            if (vk.classList.contains('active')) {
                if (!activeInputTarget) activeInputTarget = document.getElementById('cmdInput');
                activeInputTarget.focus();
            }
        }

        function pressVirtualKey(keyVal) {
            // Garantizar que la celda (=) NO sea editable
            if (!activeInputTarget || activeInputTarget.id === 'executionContent') {
                activeInputTarget = document.getElementById('cmdInput');
            }
            activeInputTarget.focus();

            const start = activeInputTarget.selectionStart || 0;
            const end = activeInputTarget.selectionEnd || 0;
            const val = activeInputTarget.value || '';

            if (keyVal === 'BACKSPACE') {
                if (start === end && start > 0) {
                    activeInputTarget.value = val.substring(0, start - 1) + val.substring(end);
                    activeInputTarget.selectionStart = activeInputTarget.selectionEnd = start - 1;
                } else if (start !== end) {
                    activeInputTarget.value = val.substring(0, start) + val.substring(end);
                    activeInputTarget.selectionStart = activeInputTarget.selectionEnd = start;
                }
            } else if (keyVal === 'ENTER') {
                if (activeInputTarget.id === 'cmdInput') {
                    triggerCommandSubmit();
                } else {
                    activeInputTarget.value = val.substring(0, start) + "\n" + val.substring(end);
                    activeInputTarget.selectionStart = activeInputTarget.selectionEnd = start + 1;
                }
            } else {
                activeInputTarget.value = val.substring(0, start) + keyVal + val.substring(end);
                activeInputTarget.selectionStart = activeInputTarget.selectionEnd = start + keyVal.length;
            }
        }

        function toggleFunctionDrawer() {
            const drawer = document.getElementById('functionDrawer');
            drawer.classList.toggle('open');
            if (drawer.classList.contains('open')) {
                const funcEdit = document.getElementById('functionEditor');
                funcEdit.focus();
                activeInputTarget = funcEdit;
            }
        }

        function handleEditorKeyDown(event) {
            if (event.key === 'Tab') {
                event.preventDefault();
                const editor = event.target;
                const start = editor.selectionStart;
                const end = editor.selectionEnd;
                editor.value = editor.value.substring(0, start) + "    " + editor.value.substring(end);
                editor.selectionStart = editor.selectionEnd = start + 4;
            }
        }

        function triggerCommandSubmit() {
            const command = cmdInput.value.trim();
            if (command) {
                submitCommand(command);
                cmdInput.value = '';
            }
        }

        function handleCommandKey(event) {
            if (event.key === 'Enter') {
                triggerCommandSubmit();
            }
        }

        function connectSSE() {
            const eventSource = new EventSource('/api/stream');

            eventSource.onmessage = function(event) {
                try {
                    const payload = JSON.parse(event.data);
                    if (hasExecutedCommand && payload.execution) {
                        latestExecutionData = payload.execution;
                        render();
                    }
                } catch (e) {
                    console.error("Error SSE:", e);
                }
            };

            eventSource.onerror = function() {
                eventSource.close();
                setTimeout(connectSSE, 2000);
            };
        }

        connectSSE();
    </script>
</body>
</html>
