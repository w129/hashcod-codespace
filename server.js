const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = parseInt(process.env.LEGACY_PORT || '8000', 10);
const HOST = process.env.LEGACY_HOST || '127.0.0.1';
const PUBLIC_DIR = __dirname;
const LEGACY_TOKEN = String(process.env.LEGACY_SERVER_TOKEN || '').trim();
const LEGACY_ALLOWED_ORIGIN = String(process.env.LEGACY_ALLOWED_ORIGIN || '').trim().replace(/\/$/, '');

function legacyAuthorized(req) {
    if (HOST === '127.0.0.1' || HOST === '::1' || HOST === 'localhost') return true;
    if (LEGACY_TOKEN.length < 32) return false;
    const auth = String(req.headers.authorization || '');
    const supplied = auth.startsWith('Bearer ') ? auth.slice(7).trim() : String(req.headers['x-legacy-token'] || '').trim();
    return supplied.length === LEGACY_TOKEN.length &&
        require('crypto').timingSafeEqual(Buffer.from(supplied), Buffer.from(LEGACY_TOKEN));
}

const BROWSER_NAMES = ['chrome', 'brave', 'msedge', 'firefox', 'camoufox', 'opera', 'vivaldi', 'arc'];

// Catálogo oficial de comandos creados y su funcionalidad a la derecha
const REGISTERED_COMMANDS = {
    "mane_list?": "Muestra la lista de comandos creados y su funcionalidad",
    "crl": "Deja la celda de ejecución (=) totalmente vacía",
    "status": "Consulta el estado del servidor y motores detectados",
    "browsers": "Muestra los procesos reales de navegadores en ejecución",
    "ping": "Comprueba la conectividad y latencia con el servidor"
};

let currentBrowserState = {
    ok: true,
    enabled: true,
    running: true,
    engine: "scanning...",
    browserConnected: true,
    browserRunning: true,
    activeBrowsers: {}
};

let lastExecutionResult = null;

const clients = new Set();
let isScanning = false;

// Escanear procesos REALES de la computadora del usuario
function scanRealBrowsers() {
    if (isScanning) return;
    isScanning = true;

    exec('tasklist /FO CSV /NH', { timeout: 3000 }, (error, stdout) => {
        isScanning = false;
        if (error || !stdout) return;

        const lines = stdout.split(/\r?\n/);
        const browserStats = {};

        for (const name of BROWSER_NAMES) {
            browserStats[name] = { running: false, processCount: 0, pids: [], totalMemoryKB: 0 };
        }

        for (const line of lines) {
            if (!line) continue;
            const match = line.match(/^"([^"]+)","(\d+)","[^"]*","[^"]*","([^"]+)"/);
            if (match) {
                const exeName = match[1].toLowerCase();
                const pid = parseInt(match[2], 10);
                const memStr = match[3].replace(/[^\d]/g, '');
                const memKB = parseInt(memStr, 10) || 0;

                for (const bName of BROWSER_NAMES) {
                    if (exeName.includes(bName)) {
                        browserStats[bName].running = true;
                        browserStats[bName].processCount++;
                        browserStats[bName].pids.push(pid);
                        browserStats[bName].totalMemoryKB += memKB;
                    }
                }
            }
        }

        let mainEngine = "none";
        let maxCount = 0;
        const activeBrowsers = {};

        for (const [name, info] of Object.entries(browserStats)) {
            if (info.running) {
                activeBrowsers[name] = {
                    running: true,
                    processCount: info.processCount,
                    memoryMB: Math.round(info.totalMemoryKB / 1024),
                    pids: info.pids.slice(0, 5)
                };
                if (info.processCount > maxCount) {
                    maxCount = info.processCount;
                    mainEngine = name;
                }
            }
        }

        const isAnyRunning = mainEngine !== "none";

        currentBrowserState = {
            ok: isAnyRunning,
            enabled: true,
            running: isAnyRunning,
            engine: mainEngine,
            browserConnected: isAnyRunning,
            browserRunning: isAnyRunning,
            activeBrowsers: activeBrowsers
        };

        broadcastState();
    });
}

setInterval(scanRealBrowsers, 1500);
scanRealBrowsers();

function broadcastState() {
    const payload = {
        execution: lastExecutionResult,
        browserState: currentBrowserState
    };
    const data = `data: ${JSON.stringify(payload)}\n\n`;
    for (const client of clients) {
        client.write(data);
    }
}

// Procesar comandos de la celda (>)
function processCommand(cmdString) {
    const rawCmd = (cmdString || '').trim();
    const lowerCmd = rawCmd.toLowerCase();
    const timestamp = new Date().toISOString();

    const knownCmdKeys = Object.keys(REGISTERED_COMMANDS);
    const isValidCommand = knownCmdKeys.includes(lowerCmd) || lowerCmd === 'crl?' || lowerCmd === 'mane_list' || lowerCmd === 'help' || lowerCmd === '?';

    if (!isValidCommand) {
        lastExecutionResult = {
            ok: false,
            isError: true,
            command: rawCmd,
            timestamp: timestamp,
            error: "Your command does not exist...."
        };
        broadcastState();
        return lastExecutionResult;
    }

    let outputResult = {};

    // Comando crl / crl?: Dejar la celda (=) completamente vacía
    if (lowerCmd === 'crl' || lowerCmd === 'crl?') {
        outputResult = {
            type: "EMPTY_CELL"
        };
    }
    // Comando Maestro: mane_list? -> Retorna filas verticales con comando a la izquierda y funcionalidad a la derecha
    else if (lowerCmd === 'mane_list?' || lowerCmd === 'mane_list' || lowerCmd === 'help' || lowerCmd === '?') {
        const rows = Object.entries(REGISTERED_COMMANDS).map(([cmd, desc]) => {
            return { command: cmd, description: desc };
        });

        outputResult = {
            type: "COMMAND_VERTICAL_LIST",
            rows: rows
        };
    } else if (lowerCmd === 'status' || lowerCmd === 'browsers') {
        outputResult = currentBrowserState;
    } else if (lowerCmd === 'ping') {
        outputResult = { pong: true, time: timestamp };
    }

    lastExecutionResult = {
        ok: true,
        isError: false,
        timestamp: timestamp,
        lastCommand: rawCmd,
        output: outputResult
    };

    broadcastState();
    return lastExecutionResult;
}

const server = http.createServer((req, res) => {
    const origin = String(req.headers.origin || '').trim().replace(/\/$/, '');
    if (origin && LEGACY_ALLOWED_ORIGIN && origin === LEGACY_ALLOWED_ORIGIN) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Vary', 'Origin');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Legacy-Token');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        return res.end();
    }

    if (req.url === '/api/stream') {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        });

        const payload = {
            execution: lastExecutionResult,
            browserState: currentBrowserState
        };

        res.write(`data: ${JSON.stringify(payload)}\n\n`);
        clients.add(res);

        req.on('close', () => {
            clients.delete(res);
        });
        return;
    }

    if (req.method === 'POST' && (req.url === '/api/command' || req.url === '/cmd')) {
        if (!legacyAuthorized(req)) {
            res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
            return res.end(JSON.stringify({ ok: false, error: 'Unauthorized' }));
        }
        let body = '';
        let bodyTooLarge = false;
        req.on('data', chunk => {
            if (bodyTooLarge) return;
            body += chunk.toString();
            if (body.length > 65536) {
                bodyTooLarge = true;
                res.writeHead(413, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ ok: false, error: 'Payload too large' }));
            }
        });
        req.on('end', () => {
            if (bodyTooLarge) return;
            try {
                const parsed = JSON.parse(body || '{}');
                console.log(`[${new Date().toLocaleTimeString()}] ⌨️  Comando recibido: "${parsed.command}"`);
                const result = processCommand(parsed.command || '');
                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify(result, null, 2));
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ ok: false, isError: true, error: "Your command does not exist...." }));
            }
        });
        return;
    }

    if (req.url === '/json' || req.url === '/api/status' || req.headers.accept?.includes('application/json')) {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({
            execution: lastExecutionResult,
            browserState: currentBrowserState
        }, null, 2));
    }

    const requestPath = decodeURIComponent(String(req.url || '/').split('?')[0]);
    const relativePath = requestPath === '/' ? 'index.html' : requestPath.replace(/^\/+/, '');
    const filePath = path.resolve(PUBLIC_DIR, relativePath);
    const publicRoot = path.resolve(PUBLIC_DIR) + path.sep;
    if (!filePath.startsWith(publicRoot)) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end('Not found');
    }
    const ext = path.extname(filePath).toLowerCase();

    const MIME_TYPES = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'text/javascript',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.svg': 'image/svg+xml'
    };

    const contentType = MIME_TYPES[ext] || 'text/plain';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            // Soft-landing al HTML nativo (no JSON 404 / no shell Vite vacío)
            const fallback = path.join(PUBLIC_DIR, 'index.html');
            fs.readFile(fallback, (err2, html) => {
                if (err2) {
                    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                    res.end('<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><title>l8 codespace</title></head><body><h1>l8 codespace</h1><p>Plataforma HTML nativa. Arranca el servidor PHP: php -S localhost:8000 router.php</p></body></html>');
                    return;
                }
                res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'X-L8-Serve': 'node-html' });
                res.end(html, 'utf-8');
            });
        } else {
            res.writeHead(200, { 'Content-Type': contentType + '; charset=utf-8' });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, HOST, () => {
    console.log(`\n==================================================`);
    console.log(`l8 codespace — legado Node (preferir PHP router.php)`);
    console.log(`Puerto ${PORT} — HTML nativo, no Vite/React SPA`);
    console.log(`==================================================\n`);
});
