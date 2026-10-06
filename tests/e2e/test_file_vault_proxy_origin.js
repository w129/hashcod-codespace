/* Exercise the production Caddy configuration and the real PHP origin guards. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const net = require('node:net');
const { spawn } = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'hashcod-proxy-'));
const children = [];
let logs = '';

async function freePort() {
  const server = net.createServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  await new Promise(resolve => server.close(resolve));
  return port;
}
function launch(command, args, env) {
  const child = spawn(command, args, { cwd: root, env: { ...process.env, ...env }, stdio: ['ignore', 'pipe', 'pipe'] });
  children.push(child);
  child.stdout.on('data', data => { logs += data; });
  child.stderr.on('data', data => { logs += data; });
  child.on('error', error => { logs += error.message; });
  return child;
}
function request(port, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname: '127.0.0.1', port, path: '/proxy-origin-fixture', method: 'POST', headers }, response => {
      let body = '';
      response.on('data', data => { body += data; });
      response.on('end', () => resolve({ status: response.statusCode, body }));
    });
    req.setTimeout(2000, () => req.destroy(new Error('Proxy request timed out')));
    req.on('error', reject);
    req.end();
  });
}
async function ready(port) {
  for (let attempt = 0; attempt < 150; attempt++) {
    if (children.some(child => child.exitCode !== null)) throw new Error('Proxy fixture exited before startup');
    try { await request(port); return; } catch (_) { await new Promise(resolve => setTimeout(resolve, 100)); }
  }
  throw new Error('Proxy fixture did not start');
}

(async () => {
  const phpPort = await freePort();
  let proxyPort = await freePort();
  while (proxyPort === phpPort) proxyPort = await freePort();
  // Reuse the security test's actual function extraction and assertion helpers,
  // without executing its server-array scenarios. No provider or user data is used.
  const functions = fs.readFileSync(path.join(root, 'tests/security/test-file-vault-proxy.php'), 'utf8')
    .split('$base =')[0].replace('dirname(__DIR__, 2)', JSON.stringify(root));
  fs.writeFileSync(path.join(temporary, 'router.php'), functions + `
function securityRateDir() { return __DIR__; }
securityIpBan(60, 'proxy-fixture-shared-loopback', '127.0.0.1');
securityIpBan(60, 'proxy-fixture-abusive-visitor', '198.51.100.99');
$upload = hfvuSameOrigin();
$action = actionAllowed();
$ip = securityClientIp();
$banned = securityIpIsBanned($ip);
http_response_code($upload && $action && !$banned ? 200 : 403);
header('Content-Type: application/json');
echo json_encode(['https' => securityIsHttps(), 'upload' => $upload, 'action' => $action, 'ip' => $ip, 'banned' => $banned]);
`);
  const config = fs.readFileSync(path.join(root, 'Caddyfile'), 'utf8')
    .replaceAll('/var/www/html', temporary).replaceAll('127.0.0.1:8001', `127.0.0.1:${phpPort}`);
  const configPath = path.join(temporary, 'Caddyfile');
  fs.writeFileSync(configPath, config);
  launch(process.env.PHP_BIN || 'php', ['-S', `127.0.0.1:${phpPort}`, path.join(temporary, 'router.php')], { RAILWAY_ENVIRONMENT_ID: 'proxy-fixture' });
  await ready(phpPort);
  launch(process.env.CADDY_BIN || 'caddy', ['run', '--config', configPath, '--adapter', 'caddyfile'], { PORT: String(proxyPort) });
  await ready(proxyPort);
  const base = {
    Host: 'hashcodcodespace.dev', Origin: 'https://hashcodcodespace.dev',
    'X-Forwarded-Proto': 'https', 'X-Requested-With': 'XMLHttpRequest', 'Sec-Fetch-Site': 'same-origin', 'X-Real-IP': '198.51.100.10'
  };
  const valid = await request(proxyPort, base);
  assert.equal(valid.status, 200, valid.body);
  assert.deepEqual(JSON.parse(valid.body), { https: true, upload: true, action: true, ip: '198.51.100.10', banned: false });
  const spoofedIp = await request(proxyPort, { ...base, 'X-L8-Railway-Real-Ip': '198.51.100.99', 'X-Forwarded-For': '198.51.100.99', 'CF-Connecting-IP': '198.51.100.99' });
  assert.equal(spoofedIp.status, 200, spoofedIp.body);
  assert.equal(JSON.parse(spoofedIp.body).ip, '198.51.100.10', 'Railway edge IP must replace client-supplied private headers');
  const banned = await request(proxyPort, { ...base, 'X-Real-IP': '198.51.100.99', 'X-L8-Railway-Real-Ip': '198.51.100.10' });
  assert.equal(banned.status, 403, banned.body);
  assert.equal(JSON.parse(banned.body).banned, true, 'Real visitor bans must remain effective');
  const other = await request(proxyPort, { ...base, 'X-Real-IP': '198.51.100.11' });
  assert.equal(other.status, 200, other.body);
  assert.equal(JSON.parse(other.body).ip, '198.51.100.11', 'Visitors must have independent rate/ban identities');
  for (const override of [
    { Origin: 'https://unrelated.invalid' },
    { Origin: 'http://hashcodcodespace.dev' },
    { 'Sec-Fetch-Site': 'cross-site' },
    { 'X-Requested-With': '' },
    { 'X-Forwarded-Proto': 'http', 'X-L8-Railway-Proto': 'https' }
  ]) {
    const rejected = await request(proxyPort, { ...base, ...override });
    assert.equal(rejected.status, 403, JSON.stringify({ override, response: rejected }));
    assert.equal(JSON.parse(rejected.body).upload, false);
    assert.equal(JSON.parse(rejected.body).action, false);
  }
  // Forging the private header cannot downgrade a genuine HTTPS request either.
  assert.equal((await request(proxyPort, { ...base, 'X-L8-Railway-Proto': 'http' })).status, 200);
  const local = await request(proxyPort, {
    Host: `127.0.0.1:${proxyPort}`, Origin: `http://127.0.0.1:${proxyPort}`, 'X-Requested-With': 'XMLHttpRequest', 'X-Real-IP': '198.51.100.10'
  });
  assert.equal(local.status, 200, local.body);
  assert.deepEqual(JSON.parse(local.body), { https: false, upload: true, action: true, ip: '198.51.100.10', banned: false });
  console.log('Production Caddy → PHP: Railway HTTPS and visitor IP preserved; independent bans, spoof rejection, CSRF and HTTP origins verified');
})().catch(error => {
  console.error(error);
  console.error(logs.slice(-12000));
  process.exitCode = 1;
}).finally(async () => {
  await Promise.all(children.map(child => new Promise(resolve => {
    if (child.exitCode !== null || child.pid === undefined) return resolve();
    child.once('exit', resolve);
    child.kill('SIGTERM');
    const timeout = setTimeout(() => { child.kill('SIGKILL'); resolve(); }, 2000);
    timeout.unref();
  })));
  fs.rmSync(temporary, { recursive: true, force: true });
});
