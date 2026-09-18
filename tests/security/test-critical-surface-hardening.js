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
const html = read('l8-html.php');
const docker = read('Dockerfile');
const openclaw = read('openclaw-bridge.php');
const proxy = read('resilient-proxy.php');
const secrets = read('secrets.php');
const keyRegistry = read('hashcod-keys.php');

assert(bash.includes("adminRequire();"), 'Bash API surface must require verified admin access');
assert(!bash.includes('$hasCsrf'), 'Headers must never bypass Bash authentication');
assert(api.includes('$hostExecutionPrefixes'), 'Host execution route families must be admin-gated');
assert(!api.includes('StrictHostKeyChecking=no'), 'API must not disable SSH host verification');

assert(!ws.includes('hashcod-codespace-secret-2026'), 'WebSocket server must not ship a default secret');
assert(ws.includes('verifyClient'), 'WebSocket handshake must authenticate clients');
assert(ws.includes('requestAuthorized(req)'), 'WebSocket HTTP bridge must authenticate requests');
assert(!ws.includes("Access-Control-Allow-Origin', '*'"), 'WebSocket CORS must not be wildcard');
assert(ws.includes("WS_HOST || '127.0.0.1'"), 'WebSocket server must bind loopback by default');

assert(legacy.includes("LEGACY_HOST || '127.0.0.1'"), 'Legacy server must bind loopback by default');
assert(!legacy.includes("Access-Control-Allow-Origin', '*'"), 'Legacy server CORS must not be wildcard');
assert(legacy.includes('filePath.startsWith(publicRoot)'), 'Legacy static serving must enforce root containment');

assert(!security.includes("'unsafe-eval'"), 'CSP must not allow unsafe-eval');
assert(!security.includes("script-src 'self' 'unsafe-inline'"), 'CSP scripts must not allow unsafe-inline');
assert(security.includes('securityCspNonce()'), 'CSP must use a per-request nonce');
assert(security.includes("script-src-attr 'unsafe-inline'"), 'Legacy inline handlers must be isolated from script-src while migration continues');
assert(!security.includes("$_GET['admin']"), 'Administrative secrets must not be accepted in query strings');
assert(html.includes('l8_apply_csp_nonce'), 'Native HTML pages must receive CSP nonces');
assert(security.includes("'error' => 'Internal server error'"), 'Unhandled exceptions must not expose raw details');
assert(router.includes('$rootReal . DIRECTORY_SEPARATOR'), 'Static router must use a separator-aware root boundary');

assert(docker.includes('StrictHostKeyChecking yes'), 'Docker SSH must verify GitHub host keys');
assert(!docker.includes('StrictHostKeyChecking no'), 'Docker SSH must never disable host verification');
assert(!/^\s*ssh-keyscan\b/m.test(docker), 'Docker build must not execute unauthenticated SSH host-key discovery');
assert(docker.includes('github.com ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIOMqqnkVzrm0SdG6UOoqKLsabgH5C9okWi0dh2l9GKJl'), 'GitHub Ed25519 host key must be pinned');

assert(openclaw.includes('openclawRequireAccount();'), 'OpenClaw user routes must require an account');
assert(openclaw.includes('adminRequire();'), 'OpenClaw configuration and daemon mutations must require admin');
assert(openclaw.includes("OPENCLAW_WEBHOOK_SECRET"), 'OpenClaw webhook must require a dedicated secret');
assert(openclaw.includes("securityRateAllowSliding('openclaw_webhook'"), 'OpenClaw webhook must be rate limited');
assert(openclaw.includes("strlen($message) > 12000"), 'OpenClaw webhook input must be bounded');

assert(proxy.includes('resilientProxyValidateUrl'), 'Outbound proxy must validate target URLs');
assert(proxy.includes('CURLOPT_SSL_VERIFYPEER, true'), 'Outbound proxy must verify TLS peers');
assert(proxy.includes('CURLOPT_SSL_VERIFYHOST, 2'), 'Outbound proxy must verify TLS hostnames');
assert(!proxy.includes('CURLOPT_SSL_VERIFYPEER, false'), 'Outbound proxy must never disable TLS peer verification');
assert(proxy.includes('CURLOPT_FOLLOWLOCATION, false'), 'Outbound proxy must not follow unvalidated redirects');
assert(proxy.includes("'follow_location' => 0"), 'Stream fallback must not follow redirects');

assert(secrets.includes("throw new RuntimeException('Encryption unavailable: OpenSSL is required')"), 'Encryption must fail closed without OpenSSL');
assert(!secrets.includes("return 'l8e0:' . base64_encode($plaintext)"), 'New secrets must never fall back to Base64');
assert(!keyRegistry.includes("? secretsEncrypt($value) : $value"), 'Key registry must never persist plaintext when encryption is unavailable');

console.log('critical surface hardening checks: OK');
