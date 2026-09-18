const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = path.resolve(__dirname, '..', '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

const admin = read('admin-device.php');
const bash = read('bash-engine.php');
const ws = read('ws-server.js');
const security = read('security.php');
const dockerfile = read('Dockerfile');
const api = read('api.php');
const wsClient = read('components/codespace-ws.js');
const legacyServer = read('server.js');
const goCore = read('engines/go-core/main.go');
const daemonMain = read('daemon/main.go');
const grpcGateway = read('daemon/gateway/grpc_web.go');
const grpcEngine = read('daemon/pb/codespace_pqc_grpc.pb.go');

for (const prefix of ['/api/bash/', '/api/catalyst/', '/api/storage/', '/api/django/']) {
    assert(
        admin.includes(`'${prefix}'`),
        `adminProtectedPath must protect ${prefix}`
    );
}

const handlerStart = bash.indexOf('function bashHandleApi');
const adminGate = bash.indexOf('adminRequire();', handlerStart);
const execRoute = bash.indexOf("if ($uri === '/api/bash/exec'", handlerStart);
assert(handlerStart >= 0 && adminGate > handlerStart && execRoute > adminGate,
    'bashHandleApi must authorize before reaching /api/bash/exec');
assert(!bash.includes('$hasCsrf ='),
    'request headers must never bypass authentication for Bash execution');

assert(ws.includes("process.env.WS_HOST || '127.0.0.1'"),
    'WebSocket server must default to loopback');
assert(!ws.includes("'hashcod-codespace-secret-2026'"),
    'WebSocket server must not contain a default shared secret');
assert(ws.includes('WS_ALLOW_REMOTE'),
    'remote WebSocket exposure must be explicit');
assert(ws.includes('Remote WebSocket mode requires WS_SECRET with at least 32 characters.'),
    'remote WebSocket mode must require a strong secret');
assert(ws.includes('WS_ALLOWED_ORIGINS'),
    'remote WebSocket mode must require an origin allowlist');
assert(ws.includes("url.pathname === '/api/broadcast'"),
    'broadcast bridge route missing');
assert(ws.includes('if (!secretValid(req))'),
    'broadcast bridge must verify its secret');
assert(!ws.includes("setHeader('Access-Control-Allow-Origin', '*')"),
    'WebSocket HTTP API must not use wildcard CORS');
assert(ws.includes('maxPayload: MAX_WS_PAYLOAD'),
    'WebSocket messages must have a payload limit');
assert(!ws.includes("searchParams.get('token')"),
    'WebSocket server must not accept credentials from query strings');
assert(ws.includes("req.headers['sec-websocket-protocol']"),
    'WebSocket server must authenticate browser handshakes through subprotocol');
assert(ws.includes("'hashcod.auth.'"),
    'WebSocket auth subprotocol marker missing');
assert(!wsClient.includes("searchParams.set('token'"),
    'WebSocket client must not place credentials in URLs');
assert(wsClient.includes("new WebSocket(this.wsUrl, this.connectionProtocols())"),
    'WebSocket client must send authentication through protocols');

assert(legacyServer.includes("process.env.LEGACY_NODE_HOST || '127.0.0.1'"),
    'legacy Node server must default to loopback');
assert(!legacyServer.includes("Access-Control-Allow-Origin', '*'"),
    'legacy Node server must not use wildcard CORS');
assert(legacyServer.includes('function safeStaticPath('),
    'legacy Node server must constrain static file resolution');
assert(!legacyServer.includes('path.join(PUBLIC_DIR, req.url'),
    'legacy Node server must not map raw URLs directly to filesystem paths');

assert(goCore.includes('http.ListenAndServe(addr, nil)') && goCore.includes('"127.0.0.1:" + port'),
    'Go micro-engine must bind to loopback');
assert(!goCore.includes('Access-Control-Allow-Origin", "*"'),
    'Go micro-engine must not use wildcard CORS');

assert(daemonMain.includes('Addr:           "127.0.0.1:" + grpcPort'),
    'native gRPC daemon must bind to loopback');
assert(daemonMain.includes('Addr:           "127.0.0.1:" + gatewayPort'),
    'gRPC-Web daemon must bind to loopback');
assert(!grpcGateway.includes('Access-Control-Allow-Origin", "*"'),
    'gRPC-Web gateway must not use wildcard CORS');
assert(!grpcEngine.includes('Access-Control-Allow-Origin", "*"'),
    'native gRPC HTTP engine must not use wildcard CORS');

assert(!security.includes("'unsafe-eval'"),
    'CSP must not permit unsafe-eval');
assert(security.includes("'error' => 'Internal server error'"),
    'unhandled exceptions must return a generic error');
assert(!security.includes("'error' => $msg ?: 'Unhandled Exception'"),
    'unhandled exception messages must not be returned to clients');

assert(!dockerfile.includes('StrictHostKeyChecking no'),
    'Docker SSH config must verify host keys');
assert(dockerfile.includes('https://api.github.com/meta'),
    'Docker build must obtain GitHub SSH host keys over verified HTTPS');
assert(!api.includes('StrictHostKeyChecking=no'),
    'runtime GitHub SSH commands must verify host keys');
assert(api.includes('function githubKnownHostsFile()'),
    'runtime must maintain a verified GitHub known_hosts file');
assert(api.includes('CURLOPT_SSL_VERIFYPEER => true'),
    'GitHub metadata retrieval must verify TLS');
assert(api.includes('CURLOPT_SSL_VERIFYHOST => 2'),
    'GitHub metadata retrieval must verify hostname');

console.log('PASS: platform hardening regression checks');
