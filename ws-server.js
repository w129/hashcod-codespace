/**
 * ============================================================================
 * HASHCOD CODESPACE · WEBSOCKET SERVER
 * Servidor WebSocket en tiempo real para Terminal Tabby, Gateway y Notepad
 * ============================================================================
 */

const http = require('http');
const { WebSocketServer, WebSocket } = require('ws');
const crypto = require('crypto');

const PORT = parseInt(process.env.WS_PORT || process.env.PORT || '8080', 10);
const HOST = process.env.WS_HOST || '0.0.0.0';
const SECRET_KEY = process.env.WS_SECRET || 'hashcod-codespace-secret-2026';

// Mapa de clientes conectados: clientId -> { ws, ip, channels, connectedAt }
const clients = new Map();

// Servidor HTTP base (para healthcheck, estadísticas y bridge HTTP -> WS desde PHP)
const server = http.createServer((req, res) => {
    // Cabeceras CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-WS-Secret');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

    // Endpoint de salud y estadísticas
    if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/health' || url.pathname === '/stats')) {
        const stats = {
            ok: true,
            server: 'Hashcod Codespace WebSocket Server',
            version: '2.0.0',
            uptime: Math.floor(process.uptime()),
            timestamp: new Date().toISOString(),
            connectedClients: clients.size,
            channels: getChannelStats()
        };
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(stats, null, 2));
        return;
    }

    // Endpoint Bridge HTTP POST para que PHP (api.php) emita eventos WebSocket directamente
    if (req.method === 'POST' && url.pathname === '/api/broadcast') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const data = JSON.parse(body || '{}');
                const channel = data.channel || 'global';
                const event = data.event || 'message';
                const payload = data.payload || data.data || {};

                broadcast(channel, event, payload, null);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ ok: true, deliveredTo: getChannelCount(channel) }));
            } catch (err) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ ok: false, error: err.message }));
            }
        });
        return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Endpoint no encontrado' }));
});

// Servidor WebSocket adjunto al servidor HTTP
const wss = new WebSocketServer({ server });

/**
 * Obtiene el conteo de clientes por canal
 */
function getChannelStats() {
    const counts = {};
    for (const client of clients.values()) {
        for (const ch of client.channels) {
            counts[ch] = (counts[ch] || 0) + 1;
        }
    }
    return counts;
}

function getChannelCount(channel) {
    let count = 0;
    for (const client of clients.values()) {
        if (channel === 'global' || client.channels.has(channel)) {
            count++;
        }
    }
    return count;
}

/**
 * Difunde un evento a un canal o a todos los clientes
 */
function broadcast(channel, event, payload, senderWs = null) {
    const message = JSON.stringify({
        type: 'event',
        channel: channel,
        event: event,
        payload: payload,
        timestamp: Date.now()
    });

    for (const [id, client] of clients) {
        if (client.ws === senderWs) continue; // no hacer eco al emisor si no es necesario
        if (client.ws.readyState !== WebSocket.OPEN) continue;

        if (channel === 'global' || client.channels.has(channel)) {
            try {
                client.ws.send(message);
            } catch (e) {
                console.error(`Error enviando mensaje a cliente ${id}:`, e.message);
            }
        }
    }
}

// Manejo de conexiones WebSocket entrantes
wss.on('connection', (ws, req) => {
    const clientId = 'c_' + crypto.randomBytes(6).toString('hex');
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

    const clientInfo = {
        ws: ws,
        id: clientId,
        ip: ip,
        channels: new Set(['global', 'terminal', 'gateway', 'notepad']),
        connectedAt: Date.now(),
        isAlive: true
    };

    clients.set(clientId, clientInfo);
    console.log(`[WS CONNECT] Cliente conectado: ${clientId} (${ip}) · Total: ${clients.size}`);

    // Enviar bienvenida y confirmación de ID
    ws.send(JSON.stringify({
        type: 'welcome',
        clientId: clientId,
        server: 'Hashcod Codespace WS v2.0',
        timestamp: Date.now(),
        channels: Array.from(clientInfo.channels)
    }));

    // Notificar presencia a los demás
    broadcast('system', 'client_connected', { clientId, total: clients.size }, ws);

    // Heartbeat ping-pong
    ws.on('pong', () => {
        clientInfo.isAlive = true;
    });

    // Procesar mensajes entrantes del cliente
    ws.on('message', (raw) => {
        try {
            const data = JSON.parse(raw.toString());
            const action = data.action || data.type;

            switch (action) {
                case 'ping':
                    ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
                    break;

                case 'subscribe':
                    if (data.channel) {
                        clientInfo.channels.add(data.channel);
                        ws.send(JSON.stringify({ type: 'subscribed', channel: data.channel }));
                    }
                    break;

                case 'unsubscribe':
                    if (data.channel) {
                        clientInfo.channels.delete(data.channel);
                        ws.send(JSON.stringify({ type: 'unsubscribed', channel: data.channel }));
                    }
                    break;

                case 'broadcast':
                case 'publish':
                    const channel = data.channel || 'global';
                    const event = data.event || 'message';
                    const payload = data.payload || data.data || {};
                    broadcast(channel, event, { ...payload, from: clientId }, ws);
                    break;

                case 'terminal_command':
                    // Retransmisión de comandos de terminal
                    broadcast('terminal', 'command_run', {
                        command: data.command,
                        user: data.user || 'tabby',
                        cwd: data.cwd || '~/workspace',
                        from: clientId
                    }, ws);
                    break;

                case 'gateway_transfer':
                    // Notificación de nuevo paquete generado en Gateway
                    broadcast('gateway', 'new_transfer', {
                        code: data.code,
                        label: data.label,
                        from: clientId
                    }, ws);
                    break;

                case 'gateway_claimed':
                    // Notificación de paquete reclamado / descargado
                    broadcast('gateway', 'transfer_claimed', {
                        code: data.code,
                        from: clientId
                    }, ws);
                    break;

                default:
                    // Mensaje genérico
                    if (data.channel && data.event) {
                        broadcast(data.channel, data.event, data.payload || {}, ws);
                    }
                    break;
            }
        } catch (err) {
            console.error('[WS ERROR] Error al procesar mensaje:', err.message);
        }
    });

    // Desconexión
    ws.on('close', () => {
        clients.delete(clientId);
        console.log(`[WS DISCONNECT] Cliente desconectado: ${clientId} · Restantes: ${clients.size}`);
        broadcast('system', 'client_disconnected', { clientId, total: clients.size });
    });

    ws.on('error', (err) => {
        console.error(`[WS CLIENT ERROR] ${clientId}:`, err.message);
    });
});

// Intervalo Heartbeat cada 25 segundos para limpiar conexiones muertas
const pingInterval = setInterval(() => {
    for (const [id, client] of clients) {
        if (!client.isAlive) {
            console.log(`[WS TIMEOUT] Terminando cliente inactivo: ${id}`);
            client.ws.terminate();
            clients.delete(id);
            continue;
        }
        client.isAlive = false;
        try {
            client.ws.ping();
        } catch (e) {
            clients.delete(id);
        }
    }
}, 25000);

wss.on('close', () => {
    clearInterval(pingInterval);
});

// Iniciar servidor
server.listen(PORT, HOST, () => {
    console.log(`
┌─────────────────────────────────────────────────────────────┐
│  ⚡ HASHCOD CODESPACE · WEBSOCKET SERVER INICIADO           │
│  · WebSocket: ws://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}                     │
│  · HTTP API:  http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}/health                 │
│  · Canales:   terminal, gateway, notepad, system, global    │
└─────────────────────────────────────────────────────────────┘
`);
});
