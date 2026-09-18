const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = path.resolve(__dirname, '..', '..');
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');

const bash = read('bash-engine.php');
const api = read('api.php');
const ws = read('ws-server.js');
const legacy = read('server.js');
const security = read('security.php');
const router = read('router.php');
const docker = read('Dockerfile');

assert(bash.includes("adminRequire();"), 'Bash API surface must require verified admin access');
assert(!bash.includes('$hasCsrf'), 'Headers must never bypass Bash authentication');
assert(api.includes('$hostExecutionPrefixes'), 'Host execution route families must be admin-gated');
assert(!api.includes('StrictHostKeyChecking=no'), 'API must not disable SSH host verification');

assert(!ws.includes('hashcod-codespace-secret-2026'), 'WebSocket server must not ship a default secret');
assert(ws.includes('verifyClient'), 'WebSocket handshake must authenticate clients');
assert(ws.includes('requestAuthorized(req)'), 'WebSocket HTTP bridge must authenticate requests');
assert(!ws.includes("Access-Control-Allow-Origin', '*'"), 'WebSocket CORS must not be wildcard');

assert(legacy.includes("LEGACY_HOST || '127.0.0.1'"), 'Legacy server must bind loopback by default');
assert(!legacy.includes("Access-Control-Allow-Origin', '*'"), 'Legacy server CORS must not be wildcard');
assert(legacy.includes('filePath.startsWith(publicRoot)'), 'Legacy static serving must enforce root containment');

assert(!security.includes("'unsafe-eval'"), 'CSP must not allow unsafe-eval');
assert(security.includes("'error' => 'Internal server error'"), 'Unhandled exceptions must not expose raw details');
assert(router.includes('$rootReal . DIRECTORY_SEPARATOR'), 'Static router must use a separator-aware root boundary');

assert(docker.includes('StrictHostKeyChecking yes'), 'Docker SSH must verify GitHub host keys');
assert(!docker.includes('StrictHostKeyChecking no'), 'Docker SSH must never disable host verification');

console.log('critical surface hardening checks: OK');
