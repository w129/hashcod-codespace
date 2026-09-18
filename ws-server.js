/**
 * ============================================================================
 * HASHCOD CODESPACE · HARDENED WEBSOCKET SERVER
 * Realtime bridge for Terminal, Gateway and Notepad.
 * ============================================================================
 */

'use strict';

const http = require('http');
const { WebSocketServer, WebSocket } = require('ws');
const crypto = require('crypto');

const PORT = parseInt(process.env.WS_PORT || process.env.PORT || '8080', 10);
const HOST = (process.env.WS_HOST || '127.0.0.1').trim();
const SECRET_KEY = (process.env.WS_SECRET || '').trim();
const ALLOW_REMOTE = /^(1|true|yes|on)$/i.test(process.env.WS_ALLOW_REMOTE || '');
const ALLOWED_ORIGINS = new Set(
    (process.env.WS_ALLOWED_ORIGINS || '')
        .split(',')
        .map(v => v.trim().replace(/\/$/, ''))
        .filter(Boolean)
);

const MAX_HTTP_BODY = 64 * 1024;
const MAX_WS_PAYLOAD = 128 * 1024;
const MAX_MESSAGES_PER_WINDOW = 120;
const MESSAGE_WINDOW_MS = 10_000;
const ALLOWED_CHANNELS = new Set(['global', 'terminal', 'gateway', 'notepad', 'system']);

function isLoopbackHost(host) {
    return host === '127.0.0.1' || host === 'localhost' || host === '::1';
}

const LOOPBACK_ONLY = isLoopbackHost(HOST);

if (!LOOPBACK_ONLY && !ALLOW_REMOTE) {
    throw new Error('Refusing remote WebSocket bind. Set WS_ALLOW_REMOTE=1 explicitly.');
}
if (!LOOPBACK_ONLY && SECRET_KEY.length < 32) {
    throw new Error('Remote WebSocket mode requires WS_SECRET with at least 32 characters.');
}
if (!LOOPBACK_ONLY && ALLOWED_ORIGINS.size === 0) {
    throw new Error('Remote WebSocket mode requires WS_ALLOWED_ORIGINS.');
}

function safeEqual(a, b) {
    const left = Buffer.from(String(a || ''));
    const right = Buffer.from(String(b || ''));
    if (left.length === 0 || left.length !== right.length) return false;
    return crypto.timingSafeEqual(left, right);
}

function requestUrl(req) {
    return new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
}

function requestSecret(req, url = requestUrl(req)) {
    const direct = String(req.headers['x-ws-secret'] || '').trim();
    if (direct) return direct;

    const auth = String(req.headers.authorization || '').trim();
    if (/^Bearer\s+/i.test(auth)) return auth.replace(/^Bearer\s+/i, '').trim();

    return String(url.searchParams.get('token') || '').trim();
}

function secretValid(req, url = requestUrl(req)) {
    return SECRET_KEY.length >= 32 && safeEqual(requestSecret(req, url), SECRET_KEY);
}

function originAllowed(req) {
    const raw = String(req.headers.origin || '').trim();
    if (!raw) {
        // Non-browser clients are acceptable only on loopback. Remote clients
        // must authenticate with the secret and still use an explicit origin
        // when operating from browsers.
        return LOOPBACK_ONLY;
    }

    let parsed;
    try {
        parsed = new URL(raw);
    } catch (_) {
        return false;
    }

    const normalized = raw.replace(/\/$/, '');
    if (LOOPBACK_ONLY) {
        return ['localhost', '127.0.0.1', '::1'].includes(parsed.hostname);
    }
    return ALLOWED_ORIGINS.has(normalized);
}

function websocketAuthorized(req, url) {
    if (!originAllowed(req)) return false;
    if (LOOPBACK_ONLY) return true;
    return secretValid(req, url);
}

function applyCors(req, res) {
    const origin = String(req.headers.origin || '').trim().replace(/\/$/, '');
    let allowed = false;

    if (origin) {
        try {
            const parsed = new URL(origin);
            allowed = LOOPBACK_ONLY
                ? ['localhost', '127.0.0.1', '::1'].includes(parsed.hostname)
                : ALLOWED_ORIGINS.has(origin);
        } catch (_) {
            allowed = false;
        }
    }

    if (allowed) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Vary', 'Origin');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-WS-Secret');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'no-store');
}

function readJsonBody(req, callback) {
    let body = '';
    let bytes = 0;
    let finished = false;

    const fail = (status, error) => {
        if (finished) return;
        finished = true;
        callback({ status, error });
    };

    req.on('data', chunk => {
        if (finished) return;
        bytes += chunk.length;
        if (bytes > MAX_HTTP_BODY) {
            fail(413, 'Payload too large');
            req.destroy();
            return;
        }
        body += chunk.toString('utf8');
    });

    req.on('end', () => {
        if (finished) return;
        try {
            const data = JSON.parse(body || '{}');
            finished = true;
            callback(null, data && typeof data === 'object' ? data : {});
        } catch (_) {
            fail(400, 'Invalid JSON');
        }
    });
}

function safeString(value, max = 256) {
    return String(value == null ? '' : value).replace(/[\u0000-\u001f\u007f]/g, '').slice(0, max);
}

function allowedChannel(value, fallback = 'global') {
    const channel = safeString(value || fallback, 32);
    return ALLOWED_CHANNELS.has(channel) ? channel : null;
}

const clients = new Map();

function getChannelStats() {
    const counts = {};
    for (const client of clients.values()) {
        for (const ch of client.channels) counts[ch] = (counts[ch] || 0) + 1;
    }
    return counts;
}

function getChannelCount(channel) {
    let count = 0;
    for (const client of clients.values()) {
        if (channel === 'global' || client.channels.has(channel)) count++;
    }
    return count;
}

function broadcast(channel, event, payload, senderWs = null) {
    if (!ALLOWED_CHANNELS.has(channel)) return 0;

    const message = JSON.stringify({
        type: 'event',
        channel,
        event: safeString(event || 'message', 64),
        payload: payload && typeof payload === 'object' ? payload : {},
        timestamp: Date.now()
    });

    let delivered = 0;
    for (const [id, client] of clients) {
        if (client.ws === senderWs || client.ws.readyState !== WebSocket.OPEN) continue;
        if (channel !== 'global' && !client.channels.has(channel)) continue;
        try {
            client.ws.send(message);
            delivered++;
        } catch (e) {
            console.error(`[WS SEND ERROR] ${id}: ${e.message}`);
        }
    }
    return delivered;
}

const server = http.createServer((req, res) => {
    applyCors(req, res);

    if (req.method === 'OPTIONS') {
        if (!originAllowed(req)) {
            res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
            return res.end(JSON.stringify({ ok: false, error: 'Origin not allowed' }));
        }
        res.writeHead(204);
        return res.end();
    }

    const url = requestUrl(req);

    if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/health')) {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({
            ok: true,
            server: 'Hashcod Codespace WebSocket Server',
            version: '2.1.0',
            timestamp: new Date().toISOString()
        }));
    }

    if (req.method === 'GET' && url.pathname === '/stats') {
        if (!secretValid(req, url)) {
            res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8' });
            return res.end(JSON.stringify({ ok: false, error: 'Authentication required' }));
        }
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({
            ok: true,
            uptime: Math.floor(process.uptime()),
            connectedClients: clients.size,
            channels: getChannelStats()
        }));
    }

    if (req.method === 'POST' && url.pathname === '/api/broadcast') {
        // The HTTP→WS bridge is privileged even on loopback. No secret means
        // the bridge is disabled rather than silently becoming public.
        if (!secretValid(req, url)) {
            const status = SECRET_KEY.length >= 32 ? 401 : 503;
            res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
            return res.end(JSON.stringify({
                ok: false,
                error: status === 503 ? 'Broadcast bridge disabled' : 'Authentication required'
            }));
        }

        return readJsonBody(req, (err, data) => {
            if (err) {
                res.writeHead(err.status, { 'Content-Type': 'application/json; charset=utf-8' });
                return res.end(JSON.stringify({ ok: false, error: err.error }));
            }

            const channel = allowedChannel(data.channel);
            if (!channel) {
                res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
                return res.end(JSON.stringify({ ok: false, error: 'Invalid channel' }));
            }

            const event = safeString(data.event || 'message', 64);
            const payload = data.payload && typeof data.payload === 'object'
                ? data.payload
                : (data.data && typeof data.data === 'object' ? data.data : {});

            const deliveredTo = broadcast(channel, event, payload, null);
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            return res.end(JSON.stringify({ ok: true, deliveredTo }));
        });
    }

    res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ ok: false, error: 'Endpoint not found' }));
});

const wss = new WebSocketServer({
    noServer: true,
    maxPayload: MAX_WS_PAYLOAD,
    perMessageDeflate: false
});

server.on('upgrade', (req, socket, head) => {
    const url = requestUrl(req);
    if (!websocketAuthorized(req, url)) {
        socket.write('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n');
        socket.destroy();
        return;
    }

    wss.handleUpgrade(req, socket, head, ws => {
        wss.emit('connection', ws, req);
    });
});

wss.on('connection', (ws, req) => {
    const clientId = 'c_' + crypto.randomBytes(12).toString('hex');
    const ip = req.socket.remoteAddress || 'loopback';
    const clientInfo = {
        ws,
        id: clientId,
        ip,
        channels: new Set(['global', 'terminal', 'gateway', 'notepad']),
        connectedAt: Date.now(),
        isAlive: true,
        windowStartedAt: Date.now(),
        windowMessageCount: 0
    };

    clients.set(clientId, clientInfo);

    ws.send(JSON.stringify({
        type: 'welcome',
        clientId,
        server: 'Hashcod Codespace WS v2.1',
        timestamp: Date.now(),
        channels: Array.from(clientInfo.channels)
    }));

    broadcast('system', 'client_connected', { clientId, total: clients.size }, ws);

    ws.on('pong', () => {
        clientInfo.isAlive = true;
    });

    ws.on('message', raw => {
        const now = Date.now();
        if (now - clientInfo.windowStartedAt >= MESSAGE_WINDOW_MS) {
            clientInfo.windowStartedAt = now;
            clientInfo.windowMessageCount = 0;
        }
        clientInfo.windowMessageCount++;
        if (clientInfo.windowMessageCount > MAX_MESSAGES_PER_WINDOW) {
            ws.close(1008, 'Rate limit exceeded');
            return;
        }

        try {
            const data = JSON.parse(raw.toString());
            if (!data || typeof data !== 'object') return;
            const action = safeString(data.action || data.type, 32);

            switch (action) {
                case 'ping':
                    ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
                    break;

                case 'subscribe': {
                    const channel = allowedChannel(data.channel, '');
                    if (!channel) {
                        ws.send(JSON.stringify({ type: 'error', error: 'Invalid channel' }));
                        break;
                    }
                    clientInfo.channels.add(channel);
                    ws.send(JSON.stringify({ type: 'subscribed', channel }));
                    break;
                }

                case 'unsubscribe': {
                    const channel = allowedChannel(data.channel, '');
                    if (!channel) break;
                    clientInfo.channels.delete(channel);
                    ws.send(JSON.stringify({ type: 'unsubscribed', channel }));
                    break;
                }

                case 'broadcast':
                case 'publish': {
                    const channel = allowedChannel(data.channel);
                    if (!channel) break;
                    broadcast(
                        channel,
                        safeString(data.event || 'message', 64),
                        data.payload && typeof data.payload === 'object' ? data.payload : {},
                        ws
                    );
                    break;
                }

                case 'terminal_command':
                    broadcast('terminal', 'command_run', {
                        command: safeString(data.command, 4096),
                        user: safeString(data.user || 'tabby', 64),
                        cwd: safeString(data.cwd || '~/workspace', 512),
                        from: clientId
                    }, ws);
                    break;

                case 'gateway_transfer':
                    broadcast('gateway', 'new_transfer', {
                        code: safeString(data.code, 256),
                        label: safeString(data.label, 256),
                        from: clientId
                    }, ws);
                    break;

                case 'gateway_claimed':
                    broadcast('gateway', 'transfer_claimed', {
                        code: safeString(data.code, 256),
                        from: clientId
                    }, ws);
                    break;

                default:
                    ws.send(JSON.stringify({ type: 'error', error: 'Unsupported action' }));
                    break;
            }
        } catch (_) {
            ws.send(JSON.stringify({ type: 'error', error: 'Invalid message' }));
        }
    });

    ws.on('close', () => {
        clients.delete(clientId);
        broadcast('system', 'client_disconnected', { clientId, total: clients.size });
    });

    ws.on('error', err => {
        console.error(`[WS CLIENT ERROR] ${clientId}: ${err.message}`);
    });
});

const pingInterval = setInterval(() => {
    for (const [id, client] of clients) {
        if (!client.isAlive) {
            client.ws.terminate();
            clients.delete(id);
            continue;
        }
        client.isAlive = false;
        try {
            client.ws.ping();
        } catch (_) {
            clients.delete(id);
        }
    }
}, 25_000);

wss.on('close', () => clearInterval(pingInterval));

server.listen(PORT, HOST, () => {
    console.log(`Hashcod Codespace WS listening on ${HOST}:${PORT} (${LOOPBACK_ONLY ? 'loopback-only' : 'remote-authenticated'})`);
});
