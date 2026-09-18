'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = parseInt(process.env.LEGACY_NODE_PORT || '8000', 10);
const HOST = process.env.LEGACY_NODE_HOST || '127.0.0.1';
const PUBLIC_DIR = path.resolve(__dirname);
const MAX_BODY = 64 * 1024;
const ALLOWED_STATIC_EXT = new Set(['.html', '.css', '.js', '.mjs', '.json', '.png', '.jpg', '.jpeg', '.svg', '.ico', '.webp', '.gif', '.woff', '.woff2', '.ttf']);
const DENIED_PREFIXES = ['.git/', '.github/', 'data_storage/', 'uploads/', 'node_modules/', 'supabase/', 'local-app/'];

if (!['127.0.0.1', 'localhost', '::1'].includes(HOST)) {
    throw new Error('Legacy Node server is local-only. Use the PHP/Caddy production server for remote access.');
}

const BROWSER_NAMES = ['chrome', 'brave', 'msedge', 'firefox', 'camoufox', 'opera', 'vivaldi', 'arc'];

const REGISTERED_COMMANDS = {
    'mane_list?': 'Muestra la lista de comandos creados y su funcionalidad',
    'crl': 'Deja la celda de ejecución (=) totalmente vacía',
    'status': 'Consulta el estado del servidor y motores detectados',
    'browsers': 'Muestra los procesos reales de navegadores en ejecución',
    'ping': 'Comprueba la conectividad y latencia con el servidor'
};

let currentBrowserState = {
    ok: true,
    enabled: true,
    running: true,
    engine: 'scanning...',
    browserConnected: true,
    browserRunning: true,
    activeBrowsers: {}
};
let lastExecutionResult = null;
const clients = new Set();
let isScanning = false;

function isAllowedLocalOrigin(req) {
    const origin = String(req.headers.origin || '').trim();
    if (!origin) return true;
    try {
        const hostname = new URL(origin).hostname;
        return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
    } catch (_) {
        return false;
    }
}

function applyCors(req, res) {
    const origin = String(req.headers.origin || '').trim();
    if (origin && isAllowedLocalOrigin(req)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Vary', 'Origin');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With');
    res.setHeader('X-Content-Type-Options', 'nosniff');
}

function scanRealBrowsers() {
    if (isScanning) return;
    isScanning = true;
    exec('tasklist /FO CSV /NH', { timeout: 3000 }, (error, stdout) => {
        isScanning = false;
        if (error || !stdout) return;

        const browserStats = {};
        for (const name of BROWSER_NAMES) {
            browserStats[name] = { running: false, processCount: 0, pids: [], totalMemoryKB: 0 };
        }

        for (const line of stdout.split(/\r?\n/)) {
            if (!line) continue;
            const match = line.match(/^"([^"]+)","(\d+)","[^"]*","[^"]*","([^"]+)"/);
            if (!match) continue;

            const exeName = match[1].toLowerCase();
            const pid = parseInt(match[2], 10);
            const memKB = parseInt(match[3].replace(/[^\d]/g, ''), 10) || 0;
            for (const bName of BROWSER_NAMES) {
                if (!exeName.includes(bName)) continue;
                browserStats[bName].running = true;
                browserStats[bName].processCount++;
                browserStats[bName].pids.push(pid);
                browserStats[bName].totalMemoryKB += memKB;
            }
        }

        let mainEngine = 'none';
        let maxCount = 0;
        const activeBrowsers = {};
        for (const [name, info] of Object.entries(browserStats)) {
            if (!info.running) continue;
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

        const running = mainEngine !== 'none';
        currentBrowserState = {
            ok: running,
            enabled: true,
            running,
            engine: mainEngine,
            browserConnected: running,
            browserRunning: running,
            activeBrowsers
        };
        broadcastState();
    });
}

setInterval(scanRealBrowsers, 1500);
scanRealBrowsers();

function broadcastState() {
    const data = `data: ${JSON.stringify({ execution: lastExecutionResult, browserState: currentBrowserState })}\n\n`;
    for (const client of clients) client.write(data);
}

function processCommand(cmdString) {
    const rawCmd = String(cmdString || '').trim().slice(0, 128);
    const lowerCmd = rawCmd.toLowerCase();
    const timestamp = new Date().toISOString();
    const known = Object.keys(REGISTERED_COMMANDS);
    const valid = known.includes(lowerCmd) || ['crl?', 'mane_list', 'help', '?'].includes(lowerCmd);

    if (!valid) {
        lastExecutionResult = { ok: false, isError: true, command: rawCmd, timestamp, error: 'Your command does not exist....' };
        broadcastState();
        return lastExecutionResult;
    }

    let output = {};
    if (lowerCmd === 'crl' || lowerCmd === 'crl?') {
        output = { type: 'EMPTY_CELL' };
    } else if (['mane_list?', 'mane_list', 'help', '?'].includes(lowerCmd)) {
        output = { type: 'COMMAND_VERTICAL_LIST', rows: Object.entries(REGISTERED_COMMANDS).map(([command, description]) => ({ command, description })) };
    } else if (lowerCmd === 'status' || lowerCmd === 'browsers') {
        output = currentBrowserState;
    } else if (lowerCmd === 'ping') {
        output = { pong: true, time: timestamp };
    }

    lastExecutionResult = { ok: true, isError: false, timestamp, lastCommand: rawCmd, output };
    broadcastState();
    return lastExecutionResult;
}

function safeStaticPath(requestUrl) {
    let pathname;
    try {
        pathname = decodeURIComponent(new URL(requestUrl || '/', 'http://localhost').pathname);
    } catch (_) {
        return null;
    }
    if (pathname.includes('\0') || pathname.includes('\\') || pathname.split('/').includes('..')) return null;

    const rel = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
    const lower = rel.toLowerCase();
    if (DENIED_PREFIXES.some(prefix => lower.startsWith(prefix))) return null;

    const ext = path.extname(rel).toLowerCase();
    if (!ALLOWED_STATIC_EXT.has(ext)) return null;

    const resolved = path.resolve(PUBLIC_DIR, rel);
    const rootPrefix = PUBLIC_DIR.endsWith(path.sep) ? PUBLIC_DIR : PUBLIC_DIR + path.sep;
    if (resolved !== path.join(PUBLIC_DIR, 'index.html') && !resolved.startsWith(rootPrefix)) return null;
    return resolved;
}

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.mjs': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml; charset=utf-8',
    '.ico': 'image/x-icon',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf'
};

const server = http.createServer((req, res) => {
    applyCors(req, res);
    if (!isAllowedLocalOrigin(req)) {
        res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({ ok: false, error: 'Origin not allowed' }));
    }

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        return res.end();
    }

    const pathname = (() => {
        try { return new URL(req.url || '/', 'http://localhost').pathname; }
        catch (_) { return '/'; }
    })();

    if (pathname === '/api/stream') {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-store',
            'Connection': 'keep-alive'
        });
        res.write(`data: ${JSON.stringify({ execution: lastExecutionResult, browserState: currentBrowserState })}\n\n`);
        clients.add(res);
        req.on('close', () => clients.delete(res));
        return;
    }

    if (req.method === 'POST' && (pathname === '/api/command' || pathname === '/cmd')) {
        let body = '';
        let size = 0;
        req.on('data', chunk => {
            size += chunk.length;
            if (size > MAX_BODY) {
                res.writeHead(413, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ ok: false, error: 'Payload too large' }));
                req.destroy();
                return;
            }
            body += chunk.toString('utf8');
        });
        req.on('end', () => {
            if (size > MAX_BODY) return;
            try {
                const parsed = JSON.parse(body || '{}');
                const result = processCommand(parsed.command || '');
                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify(result));
            } catch (_) {
                res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ ok: false, error: 'Invalid request' }));
            }
        });
        return;
    }

    if (pathname === '/json' || pathname === '/api/status' || req.headers.accept?.includes('application/json')) {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
        return res.end(JSON.stringify({ execution: lastExecutionResult, browserState: currentBrowserState }));
    }

    const filePath = safeStaticPath(req.url);
    if (!filePath) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end('Not Found');
    }

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            return res.end('Not Found');
        }
        const type = MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' });
        res.end(data);
    });
});

server.listen(PORT, HOST, () => {
    console.log(`l8 codespace legacy Node server listening on http://${HOST}:${PORT} (local-only)`);
});
