<?php
// index.php - Aplicación Web PHP + React 18 + TypeScript
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Servidor PHP Native + React TypeScript l8</title>
    
    <!-- Cargar React 18, ReactDOM y Babel TypeScript Transpiler -->
    <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>

    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
            background-color: #ffffff;
            color: #000000;
            font-family: monospace, 'Courier New', Courier, sans-serif;
            font-size: 13px;
            padding: 16px;
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        .top-bar {
            width: 100%;
            max-width: 1100px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            margin-bottom: 24px;
        }

        .left-controls { display: flex; align-items: center; gap: 12px; }
        .checkbox-label { display: flex; align-items: center; gap: 8px; cursor: pointer; user-select: none; font-size: 13px; color: #000000; }
        .checkbox-label input[type="checkbox"] { width: 14px; height: 14px; cursor: pointer; }

        .icon-globe { width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; }
        .icon-globe svg { width: 100%; height: 100%; fill: #000000; }

        .main-container { width: 100%; max-width: 1100px; display: flex; flex-direction: column; gap: 16px; }

        .block-row { display: flex; border: 1px solid #cccccc; background-color: #ffffff; width: 100%; }
        .block-symbol { width: 44px; min-width: 44px; background-color: #e0e0e0; color: #000000; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold; border-right: 1px solid #cccccc; user-select: none; }
        .block-body { flex: 1; padding: 12px 14px; word-break: break-all; min-height: 44px; font-family: monospace, 'Courier New', Courier; line-height: 1.4; color: #000000; background-color: #ffffff; }

        .block-input-container { display: flex; align-items: center; gap: 8px; padding: 4px 10px; }
        .cmd-input { width: 100%; border: none; outline: none; background: transparent; font-family: monospace, 'Courier New', Courier; font-size: 13px; color: #000000; caret-color: #000000; }
        .cmd-input::placeholder { color: #888888; }

        .cell-action-icon { width: 24px; height: 24px; min-width: 24px; display: flex; align-items: center; justify-content: center; cursor: pointer; opacity: 0.9; transition: opacity 0.2s ease, transform 0.15s ease; }
        .cell-action-icon:hover { opacity: 1; transform: scale(1.08); }
        .cell-action-icon svg { width: 24px; height: 24px; display: block; }

        .clickable-symbol { cursor: pointer; transition: background-color 0.2s ease; }
        .clickable-symbol:hover { background-color: #bbbbbb; }

        .function-drawer-wrapper { display: flex; flex-direction: column; width: 100%; }
        .function-drawer { display: none; background-color: #ffffff; border: 1px solid #cccccc; border-top: none; padding: 16px 20px; box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06); margin-top: -1px; animation: fadeInDrawer 0.25s ease-out; }
        .function-drawer.open { display: block; }

        @keyframes fadeInDrawer { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }

        .function-drawer-header { font-family: monospace, 'Courier New', Courier; font-size: 14px; font-weight: bold; color: #000000; margin-bottom: 14px; }
        .function-drawer-inner { background-color: #000000; padding: 14px; border-radius: 3px; }
        .function-editor { width: 100%; height: 180px; background-color: #000000; color: #ffffff; border: none; outline: none; resize: vertical; font-family: monospace, 'Courier New', Courier, Consolas; font-size: 13px; line-height: 1.5; caret-color: #ffffff; }
        .function-editor::placeholder { color: #666666; }

        /* Filas verticales para el comando mane_list? */
        .vertical-cmd-table { display: flex; flex-direction: column; gap: 4px; width: 100%; }
        .vertical-cmd-row { display: flex; align-items: center; font-family: monospace, 'Courier New', Courier; font-size: 13px; line-height: 1.5; }
        .vertical-cmd-name { color: #0451a5; font-weight: bold; min-width: 130px; }
        .vertical-cmd-sep { color: #777777; margin: 0 8px; }
        .vertical-cmd-desc { color: #111111; }

        .json-key { color: #0451a5; } .json-string { color: #a31515; } .json-number { color: #098658; } .json-boolean { color: #0000ff; } .json-null { color: #0000ff; }

        /* Teclado Virtual Blanco Adaptado al Entorno */
        .virtual-keyboard-white { display: none; margin-top: 16px; background-color: #ffffff; border: 1px solid #d8d8d8; border-radius: 8px; padding: 16px; user-select: none; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08); animation: fadeInDrawer 0.25s ease-out; }
        .virtual-keyboard-white.active { display: flex; flex-direction: column; gap: 12px; }
        .vk-top-bar-indicators { display: flex; justify-content: space-between; align-items: center; padding-bottom: 8px; border-bottom: 1px solid #ececec; }
        .vk-brand { font-family: monospace, 'Courier New', Courier; font-size: 11px; font-weight: bold; color: #888888; letter-spacing: 1px; }
        .vk-leds { display: flex; gap: 16px; }
        .vk-led { display: flex; align-items: center; gap: 6px; font-family: monospace, 'Courier New', Courier; font-size: 10px; color: #666666; }
        .led-dot { width: 7px; height: 7px; border-radius: 50%; background-color: #cccccc; display: inline-block; }
        .led-dot.active { background-color: #34c759; box-shadow: 0 0 6px #34c759; }

        .vk-main-chassis { display: flex; gap: 14px; background-color: #f7f7f9; border: 1px solid #e0e0e5; border-radius: 6px; padding: 12px; overflow-x: auto; }
        .vk-block-main { display: flex; flex-direction: column; gap: 5px; flex: 3; }
        .vk-block-nav { display: flex; flex-direction: column; gap: 10px; min-width: 120px; }
        .vk-block-numpad { display: flex; flex-direction: column; gap: 5px; min-width: 160px; }
        .vk-row { display: flex; gap: 4px; }
        .vk-f-row { margin-bottom: 6px; }
        .vk-f-group { display: flex; gap: 4px; margin-right: 6px; }

        .vk-key { background: linear-gradient(180deg, #ffffff 0%, #f4f4f7 100%); color: #222222; border: 1px solid #d0d0d5; border-bottom: 2px solid #b8b8c0; border-radius: 4px; font-family: monospace, 'Courier New', Courier; font-size: 11px; font-weight: 600; height: 34px; min-width: 30px; flex: 1; padding: 2px 4px; display: flex; align-items: center; justify-content: center; text-align: center; cursor: pointer; transition: all 0.1s ease; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05); }
        .vk-key:hover { background: linear-gradient(180deg, #ffffff 0%, #e9e9f0 100%); border-color: #a8a8b3; transform: translateY(-1px); }
        .vk-key:active { background: #e0e0e8; border-bottom-width: 1px; transform: translateY(1px); box-shadow: none; }

        .key-f { background: linear-gradient(180deg, #ff4d4d 0%, #d90000 100%); color: #ffffff; border: 1px solid #b30000; border-bottom: 2px solid #800000; font-weight: bold; text-shadow: 0 1px 2px rgba(0,0,0,0.3); }
        .key-f:hover { background: linear-gradient(180deg, #ff6666 0%, #e60000 100%); }
        .key-esc { background: linear-gradient(180deg, #333333 0%, #1a1a1a 100%); color: #ffffff; border-color: #000000; font-weight: bold; }
        .key-backspace { flex: 1.8; } .key-tab { flex: 1.4; } .key-caps { flex: 1.7; } .key-enter { flex: 2; background: linear-gradient(180deg, #e6f0ff 0%, #cce0ff 100%); border-color: #99c2ff; color: #0052cc; }
        .key-shift { flex: 1.4; } .key-shift-r { flex: 2.2; } .key-spacebar { flex: 6; } .key-ctrl, .key-alt, .key-win { flex: 1.2; font-size: 10px; }

        .vk-nav-grid-6 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; }
        .vk-arrows { display: flex; flex-direction: column; align-items: center; gap: 4px; margin-top: auto; }
        .vk-numpad-body { display: flex; gap: 4px; }
        .vk-numpad-left { display: flex; flex-direction: column; gap: 4px; flex: 3; }
        .vk-numpad-right { display: flex; flex-direction: column; gap: 4px; flex: 1; }
        .key-plus { height: 72px; } .key-num-enter { height: 72px; background: linear-gradient(180deg, #e6f0ff 0%, #cce0ff 100%); border-color: #99c2ff; color: #0052cc; }
        .key-num-zero { flex: 2; }
        .vk-key.active-toggle { background: #34c759 !important; color: #ffffff !important; border-color: #248a3d !important; }
    </style>
</head>
<body>
    <div id="root"></div>

    <!-- Componentes React escritas en TypeScript -->
    <script type="text/babel" data-presets="react,typescript">
        const { useState, useEffect, useRef } = React;

        // Interfaces TypeScript
        interface ExecutionData {
            ok: boolean;
            isError?: boolean;
            error?: string;
            output?: any;
            command?: string;
            timestamp?: string;
        }

        interface CommandRow {
            command: string;
            description: string;
        }

        // Sintaxis resaltada para objetos JSON
        function syntaxHighlight(json: any, formatted: boolean): string {
            let str = typeof json !== 'string' ? JSON.stringify(json, undefined, formatted ? 2 : undefined) : json;
            if (!formatted) return str;
            str = str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            return str.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match: string) => {
                let cls = 'json-number';
                if (/^"/.test(match)) {
                    cls = /:$/.test(match) ? 'json-key' : 'json-string';
                } else if (/true|false/.test(match)) {
                    cls = 'json-boolean';
                } else if (/null/.test(match)) {
                    cls = 'json-null';
                }
                return `<span class="${cls}">${match}</span>`;
            });
        }

        // Componente Aplicación Principal React + TS
        const App: React.FC = () => {
            const [formatted, setFormatted] = useState<boolean>(true);
            const [latestData, setLatestData] = useState<ExecutionData | null>(null);
            const [hasExecuted, setHasExecuted] = useState<boolean>(false);
            const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
            const [isKbActive, setIsKbActive] = useState<boolean>(false);
            const [isCapsActive, setIsCapsActive] = useState<boolean>(false);
            const [cmdValue, setCmdValue] = useState<string>('');
            const [funcValue, setFuncValue] = useState<string>('');
            const [activeTarget, setActiveTarget] = useState<'cmd' | 'func'>('cmd');

            const cmdRef = useRef<HTMLInputElement>(null);
            const funcRef = useRef<HTMLTextAreaElement>(null);

            const submitCommand = async (commandToRun: string) => {
                if (!commandToRun.trim()) return;
                try {
                    setHasExecuted(true);
                    const res = await fetch('/api/command', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ command: commandToRun.trim() })
                    });
                    const result: ExecutionData = await res.json();
                    setLatestData(result);
                    setCmdValue('');
                } catch (err) {
                    console.error("Error enviando comando a PHP:", err);
                }
            };

            const toggleDrawer = () => {
                setIsDrawerOpen(!isDrawerOpen);
                if (!isDrawerOpen) {
                    setActiveTarget('func');
                    setTimeout(() => funcRef.current?.focus(), 100);
                }
            };

            const toggleKeyboard = () => {
                if (!isDrawerOpen) setIsDrawerOpen(true);
                setIsKbActive(!isKbActive);
            };

            const handleVirtualKey = (keyVal: string) => {
                let currentVal = activeTarget === 'cmd' ? cmdValue : funcValue;
                const targetRef = activeTarget === 'cmd' ? cmdRef.current : funcRef.current;

                const start = targetRef?.selectionStart || currentVal.length;
                const end = targetRef?.selectionEnd || currentVal.length;

                if (keyVal === 'BACKSPACE') {
                    if (start === end && start > 0) {
                        currentVal = currentVal.substring(0, start - 1) + currentVal.substring(end);
                    } else if (start !== end) {
                        currentVal = currentVal.substring(0, start) + currentVal.substring(end);
                    }
                } else if (keyVal === 'ENTER') {
                    if (activeTarget === 'cmd') {
                        submitCommand(cmdValue);
                        return;
                    } else {
                        currentVal = currentVal.substring(0, start) + "\n" + currentVal.substring(end);
                    }
                } else if (keyVal === 'TAB') {
                    currentVal = currentVal.substring(0, start) + "    " + currentVal.substring(end);
                } else if (keyVal === 'CAPS') {
                    setIsCapsActive(!isCapsActive);
                    return;
                } else if (keyVal === 'SPACE') {
                    currentVal = currentVal.substring(0, start) + " " + currentVal.substring(end);
                } else if (keyVal.startsWith('CMD:')) {
                    const cmd = keyVal.replace('CMD:', '');
                    setCmdValue(cmd);
                    submitCommand(cmd);
                    return;
                } else {
                    let char = keyVal;
                    if (isCapsActive && char.length === 1 && char.match(/[a-z]/i)) char = char.toUpperCase();
                    else if (!isCapsActive && char.length === 1 && char.match(/[A-Z]/i)) char = char.toLowerCase();
                    currentVal = currentVal.substring(0, start) + char + currentVal.substring(end);
                }

                if (activeTarget === 'cmd') setCmdValue(currentVal);
                else setFuncValue(currentVal);
            };

            // Renderizar contenido de la celda (=)
            const renderExecutionContent = () => {
                if (!hasExecuted || !latestData) return null;

                if (latestData.isError || latestData.error) {
                    const msg = latestData.error || "Your command does not exist....";
                    return <span style={{ color: '#ff0000', fontWeight: 600 }}>{msg}</span>;
                }

                const data = latestData.output !== undefined ? latestData.output : latestData;

                if (data && data.type === 'EMPTY_CELL') {
                    return null;
                }

                if (data && data.type === 'COMMAND_VERTICAL_LIST' && Array.isArray(data.rows)) {
                    return (
                        <div className="vertical-cmd-table">
                            {data.rows.map((r: CommandRow, idx: number) => (
                                <div key={idx} className="vertical-cmd-row">
                                    <span className="vertical-cmd-name">{r.command}</span>
                                    <span className="vertical-cmd-sep">-</span>
                                    <span className="vertical-cmd-desc">{r.description}</span>
                                </div>
                            ))}
                        </div>
                    );
                }

                const htmlStr = syntaxHighlight(data, formatted);
                return <div dangerouslySetInnerHTML={{ __html: htmlStr }} />;
            };

            return (
                <div style={{ width: '100%', maxWidth: '1100px' }}>
                    {/* Barra Superior */}
                    <div className="top-bar">
                        <div className="left-controls">
                            <label className="checkbox-label">
                                <input type="checkbox" checked={formatted} onChange={() => setFormatted(!formatted)} />
                                <span>Dar formato al texto</span>
                            </label>
                        </div>
                        <div className="icon-globe">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
                                <path d="M64,1C29.3,1,1,29.3,1,64c0,8.2,1.6,16.2,4.6,23.8c0.3,0.8,1,1.4,1.7,1.7c6.8,3.1,12.4,4.7,16.7,4.7c3.2,0,5.8-0.9,7.8-2.6 c3.5-3,3.3-7,3.2-11.3c-0.1-3.8-0.3-8.2,1.7-13.5c2.4-6.4,6.1-9.6,9.7-12.8c3.5-3.1,7.2-6.3,8.2-11.8c1.6-8.6-3.7-18.1-16.4-29 C46.1,9.2,54.8,7,64,7c23.4,0,43.6,14.2,52.3,34.4c-5.3-1-13.1-1.8-18.1,1.8c-2.7,1.9-4.2,4.8-4.5,8.5c-0.1,1.2,0.2,2.8,0.6,5.2 c1.1,6,2.8,16.1-2.2,22.7c-2.2,2.9-8.3,7.1-24.6,10.5c-0.8,0.2-1.3,0.3-1.5,0.3c-11.1,3.2-24,25.6-25.4,28.9c0,0,0,0,0,0 c-0.2,0.5-0.2,1-0.1,1.6c0.2,1,0.9,1.9,1.9,2.3c6.9,2.5,14.2,3.8,21.6,3.8c34.7,0,63-28.3,63-63S98.7,1,64,1z"></path>
                            </svg>
                        </div>
                    </div>

                    <div className="main-container">
                        {/* Celda (=) de Ejecuciones */}
                        <div className="block-row">
                            <div className="block-symbol">=</div>
                            <div className="block-body" id="executionContent">
                                {renderExecutionContent()}
                            </div>
                        </div>

                        {/* Celda (>) de Comandos y Ventana Desplegable */}
                        <div className="function-drawer-wrapper">
                            <div className="block-row">
                                <div className="block-symbol clickable-symbol" onClick={toggleDrawer} title="Haz clic en (>) para abrir/cerrar ventana de funciones">
                                    &gt;
                                </div>
                                <div className="block-body block-input-container">
                                    <input
                                        ref={cmdRef}
                                        type="text"
                                        className="cmd-input"
                                        placeholder="Escribe un comando aquí y presiona Enter..."
                                        value={cmdValue}
                                        onChange={(e) => setCmdValue(e.target.value)}
                                        onFocus={() => setActiveTarget('cmd')}
                                        onKeyDown={(e) => { if (e.key === 'Enter') submitCommand(cmdValue); }}
                                    />
                                    <div className="cell-action-icon" onClick={toggleKeyboard} title="Activar/Desactivar Teclado de Escritorio">
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
                                            <line x1="41" y1="30" x2="57" y2="30" stroke="#000000" strokeWidth="2.5" strokeLinecap="round" />
                                            <line x1="41" y1="36" x2="60" y2="36" stroke="#000000" strokeWidth="2.5" strokeLinecap="round" />
                                            <line x1="41" y1="42" x2="55" y2="42" stroke="#000000" strokeWidth="2.5" strokeLinecap="round" />
                                            <line x1="41" y1="48" x2="60" y2="48" stroke="#000000" strokeWidth="2.5" strokeLinecap="round" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Ventana Desplegable de Funciones */}
                            <div className={`function-drawer ${isDrawerOpen ? 'open' : ''}`}>
                                <div className="function-drawer-header">&gt;/ function to execute</div>
                                <div className="function-drawer-inner">
                                    <textarea
                                        ref={funcRef}
                                        className="function-editor"
                                        placeholder="// Escribe las funciones aquí..."
                                        value={funcValue}
                                        onChange={(e) => setFuncValue(e.target.value)}
                                        onFocus={() => setActiveTarget('func')}
                                    />
                                </div>

                                {/* Teclado Virtual Blanco Adaptado (React Component) */}
                                <div className={`virtual-keyboard-white ${isKbActive ? 'active' : ''}`}>
                                    <div className="vk-top-bar-indicators">
                                        <span className="vk-brand">NATIVE DESKTOP KEYBOARD (REACT + TS)</span>
                                        <div className="vk-leds">
                                            <span className="vk-led"><i className="led-dot"></i> Bloq Num</span>
                                            <span className="vk-led"><i className={`led-dot ${isCapsActive ? 'active' : ''}`}></i> Bloq Mayús</span>
                                            <span className="vk-led"><i className="led-dot"></i> Bloq Despl</span>
                                        </div>
                                    </div>

                                    <div className="vk-main-chassis">
                                        {/* Bloque 1: Alfanumérico con F1-F12 Rojas */}
                                        <div class="vk-block-main">
                                            <div className="vk-row vk-f-row">
                                                <div className="vk-key key-esc" onClick={() => handleVirtualKey('ESC')}>Esc</div>
                                                <div className="vk-f-group">
                                                    {['F1','F2','F3','F4'].map(f => <div key={f} className="vk-key key-f" onClick={() => handleVirtualKey(f)}>{f}</div>)}
                                                </div>
                                                <div className="vk-f-group">
                                                    {['F5','F6','F7','F8'].map(f => <div key={f} className="vk-key key-f" onClick={() => handleVirtualKey(f)}>{f}</div>)}
                                                </div>
                                                <div className="vk-f-group">
                                                    {['F9','F10','F11','F12'].map(f => <div key={f} className="vk-key key-f" onClick={() => handleVirtualKey(f)}>{f}</div>)}
                                                </div>
                                            </div>

                                            <div className="vk-row">
                                                <div className="vk-key" onClick={() => handleVirtualKey('`')}>º<br/>\</div>
                                                {['1','2','3','4','5','6','7','8','9','0','\'','¿'].map(k => <div key={k} className="vk-key" onClick={() => handleVirtualKey(k)}>{k}</div>)}
                                                <div className="vk-key key-backspace" onClick={() => handleVirtualKey('BACKSPACE')}>←</div>
                                            </div>

                                            <div className="vk-row">
                                                <div className="vk-key key-tab" onClick={() => handleVirtualKey('TAB')}>⇥ Tab</div>
                                                {['Q','W','E','R','T','Y','U','I','O','P','^','*'].map(k => <div key={k} className="vk-key" onClick={() => handleVirtualKey(k)}>{isCapsActive ? k : k.toLowerCase()}</div>)}
                                                <div className="vk-key key-enter" onClick={() => handleVirtualKey('ENTER')}>↵ Enter</div>
                                            </div>

                                            <div className="vk-row">
                                                <div className={`vk-key key-caps ${isCapsActive ? 'active-toggle' : ''}`} onClick={() => handleVirtualKey('CAPS')}>Bloq Mayús</div>
                                                {['A','S','D','F','G','H','J','K','L','Ñ','¨','Ç'].map(k => <div key={k} className="vk-key" onClick={() => handleVirtualKey(k)}>{isCapsActive ? k : k.toLowerCase()}</div>)}
                                            </div>

                                            <div className="vk-row">
                                                <div className="vk-key key-shift" onClick={() => handleVirtualKey('CAPS')}>⇧ Shift</div>
                                                {['<','Z','X','C','V','B','N','M',';',':','-'].map(k => <div key={k} className="vk-key" onClick={() => handleVirtualKey(k)}>{isCapsActive && k.length===1 ? k : k.toLowerCase()}</div>)}
                                                <div className="vk-key key-shift-r" onClick={() => handleVirtualKey('CAPS')}>⇧ Shift</div>
                                            </div>

                                            <div className="vk-row">
                                                <div className="vk-key key-ctrl" onClick={() => handleVirtualKey('CTRL')}>Control</div>
                                                <div className="vk-key key-win" onClick={() => handleVirtualKey('WIN')}>❖</div>
                                                <div className="vk-key key-alt" onClick={() => handleVirtualKey('ALT')}>Alt</div>
                                                <div className="vk-key key-spacebar" onClick={() => handleVirtualKey('SPACE')}></div>
                                                <div className="vk-key key-alt" onClick={() => handleVirtualKey('ALT')}>Alt Gr</div>
                                                <div class="vk-key key-ctrl" onClick={() => handleVirtualKey('CTRL')}>Control</div>
                                            </div>
                                        </div>

                                        {/* Bloque 2: Navegación y Flechas */}
                                        <div className="vk-block-nav">
                                            <div className="vk-row">
                                                {['Impr','Bloq','Pausa'].map(k => <div key={k} className="vk-key" onClick={() => handleVirtualKey(k)}>{k}</div>)}
                                            </div>
                                            <div className="vk-nav-grid-6">
                                                {['Insert','Inicio','Re Pág','Supr','Fin','Av Pág'].map(k => <div key={k} className="vk-key" onClick={() => handleVirtualKey(k)}>{k}</div>)}
                                            </div>
                                            <div className="vk-arrows">
                                                <div className="vk-row"><div className="vk-key" onClick={() => handleVirtualKey('UP')}>▲</div></div>
                                                <div className="vk-row">
                                                    <div className="vk-key" onClick={() => handleVirtualKey('LEFT')}>◄</div>
                                                    <div className="vk-key" onClick={() => handleVirtualKey('DOWN')}>▼</div>
                                                    <div className="vk-key" onClick={() => handleVirtualKey('RIGHT')}>►</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Bloque 3: Teclado Numérico */}
                                        <div className="vk-block-numpad">
                                            <div className="vk-row">
                                                {['Bloq Num','/','*','-'].map(k => <div key={k} className="vk-key" onClick={() => handleVirtualKey(k)}>{k}</div>)}
                                            </div>
                                            <div className="vk-numpad-body">
                                                <div className="vk-numpad-left">
                                                    <div className="vk-row">{['7','8','9'].map(k => <div key={k} className="vk-key" onClick={() => handleVirtualKey(k)}>{k}</div>)}</div>
                                                    <div className="vk-row">{['4','5','6'].map(k => <div key={k} className="vk-key" onClick={() => handleVirtualKey(k)}>{k}</div>)}</div>
                                                    <div className="vk-row">{['1','2','3'].map(k => <div key={k} className="vk-key" onClick={() => handleVirtualKey(k)}>{k}</div>)}</div>
                                                    <div className="vk-row">
                                                        <div className="vk-key key-num-zero" onClick={() => handleVirtualKey('0')}>0</div>
                                                        <div className="vk-key" onClick={() => handleVirtualKey('.')}>.</div>
                                                    </div>
                                                </div>
                                                <div className="vk-numpad-right">
                                                    <div className="vk-key key-plus" onClick={() => handleVirtualKey('+')}>+</div>
                                                    <div className="vk-key key-num-enter" onClick={() => handleVirtualKey('ENTER')}>Intro</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            );
        };

        ReactDOM.createRoot(document.getElementById('root')).render(<App />);
    </script>
</body>
</html>
