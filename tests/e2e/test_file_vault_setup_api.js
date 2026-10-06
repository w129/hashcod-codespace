'use strict';
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const net = require('node:net');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');

// Real controller + native Go verifier, with isolated dependencies that forbid
// provider access. Public RFC 6238 test key; never use a real uploader's secret.
const root = path.resolve(__dirname, '../..');
const helper = process.env.HFVU_TEST_HELPER || '/usr/local/bin/hashcod-file-vault-totp';
const php = process.env.PHP_BIN || 'php';
const secret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';
const key = Buffer.from('12345678901234567890');
function codeAt(step, bytes = key) {
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(step));
  const digest = crypto.createHmac('sha1', bytes).update(counter).digest();
  const offset = digest[19] & 15;
  return String((digest.readUInt32BE(offset) & 0x7fffffff) % 1000000).padStart(6, '0');
}
const delay = () => new Promise(resolve => setTimeout(resolve, 20));
const quotePhp = value => "'" + value.replaceAll('\\', '/').replaceAll("'", "\\'") + "'";

(async () => {
  assert(fs.existsSync(helper), 'Test requires the real compiled TOTP helper');
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'hfv-setup-'));
  let server;
  try {
    const source = fs.readFileSync(path.join(root, 'hashcod-file-vault-fast-upload.php'), 'utf8');
    const controller = path.join(fixture, 'hashcod-file-vault-fast-upload.php');
    function configureHelper(filename) {
      fs.writeFileSync(controller, source.replace(/const HFVU_TOTP_HELPER =[\s\S]*?;/, 'const HFVU_TOTP_HELPER = ' + quotePhp(filename) + ';'));
    }
    configureHelper(helper);
    fs.writeFileSync(path.join(fixture, 'auth.php'), '<?php');
    fs.writeFileSync(path.join(fixture, 'hashcod-workspace-access.php'), '<?php');
    fs.writeFileSync(path.join(fixture, 'supabase.php'), `<?php
function supabaseRequest(...$args) { throw new RuntimeException('Setup must never contact storage'); }
`);
    fs.writeFileSync(path.join(fixture, 'security.php'), `<?php
function securityBootstrap($mode) { if ($mode !== 'api') throw new RuntimeException('API guard missing'); }
function securityIsHttps() { return false; }
function securityRateAllowSliding($bucket, $limit, $period) {
  if ($bucket === 'hashcod_file_vault_setup_totp' && ($limit !== 8 || $period !== 60)) throw new RuntimeException('Wrong setup rate budget');
  return ['allowed' => empty($_SERVER['HTTP_X_TEST_RATE_BLOCK']) && !($bucket === 'hashcod_file_vault_setup_totp' && !empty($_SERVER['HTTP_X_TEST_SETUP_RATE_BLOCK']))];
}
`);
    const listener = net.createServer();
    await new Promise(resolve => listener.listen(0, '127.0.0.1', resolve));
    const port = listener.address().port;
    await new Promise(resolve => listener.close(resolve));
    const origin = `http://127.0.0.1:${port}`;
    const url = origin + '/hashcod-file-vault-fast-upload.php?action=verify-totp';
    server = spawn(php, ['-d', 'opcache.enable_cli=0', '-S', `127.0.0.1:${port}`, '-t', fixture], { stdio: 'ignore' });
    let spawnError;
    server.on('error', error => { spawnError = error; });
    let ready = false;
    for (let i = 0; i < 150; i++) {
      if (spawnError) throw spawnError;
      try { ready = (await fetch(url)).status === 405; } catch {}
      if (ready) break;
      await delay();
    }
    assert(ready, 'PHP setup test server did not start');
    async function request(body, expected, headers = {}, endpoint = url, method = 'POST') {
      const response = await fetch(endpoint, {
        method, headers: { Origin: origin, 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest', ...headers },
        ...(method === 'POST' ? { body: JSON.stringify(body) } : {}),
      });
      assert.equal(response.status, expected);
      assert.equal(response.headers.get('cache-control'), 'no-store');
      const payload = await response.json();
      assert.equal(payload.ok, expected === 200);
      assert(!JSON.stringify(payload).includes(secret), 'Responses must not disclose the setup key');
      return payload;
    }
    const step = Math.floor(Date.now() / 30000);
    const valid = { totp_secret: secret, totp_code: codeAt(step) };
    for (const offset of [-1, 0, 1]) await request({ ...valid, totp_code: codeAt(step + offset) }, 200);
    await request({ ...valid, totp_secret: secret.toLowerCase().match(/.{1,4}/g).join(' ') }, 200);
    const accepted = new Set([-1, 0, 1].map(offset => codeAt(step + offset)));
    let wrong = 0;
    while (accepted.has(String(wrong).padStart(6, '0'))) wrong++;
    assert.equal((await request({ ...valid, totp_code: String(wrong).padStart(6, '0') }, 401)).code, 'invalid_totp');
    // Expired code and one generated from another key must not unlock setup.
    let old = step - 4;
    while (accepted.has(codeAt(old))) old--;
    await request({ ...valid, totp_code: codeAt(old) }, 401);
    let otherKey = Buffer.alloc(20);
    while (accepted.has(codeAt(step, otherKey))) otherKey = crypto.randomBytes(20);
    await request({ ...valid, totp_code: codeAt(step, otherKey) }, 401);
    for (const code of ['', '12345', '1234567', 'abcdef']) await request({ ...valid, totp_code: code }, 401);
    await request({ ...valid, totp_secret: 'invalid-key' }, 401);
    await request(valid, 403, { Origin: 'https://unrelated.invalid' });
    await request(valid, 403, { 'X-Requested-With': '' });
    await request(valid, 403, { 'Sec-Fetch-Site': 'cross-site' });
    await request(valid, 429, { 'X-Test-Rate-Block': '1' });
    await request(valid, 429, { 'X-Test-Setup-Rate-Block': '1' });
    await request(valid, 405, {}, url, 'GET');
    // Prepare must still verify independently if the browser is bypassed.
    await request({ ...valid, totp_code: String(wrong).padStart(6, '0'), id: 'fv_testsetup123', name: 'document.pdf', size: 12, type: 'application/pdf' }, 401, {}, url.replace('verify-totp', 'prepare'));
    configureHelper(path.join(fixture, 'missing-verifier'));
    assert.equal((await request(valid, 503)).code, 'totp_unavailable');
    console.log('Real PHP/Go TOTP setup: current, skew, wrong, expired, provider-free and security guards OK');
  } finally {
    if (server && server.exitCode === null) {
      const stopped = new Promise(resolve => server.once('exit', resolve));
      server.kill();
      await stopped;
    }
    fs.rmSync(fixture, { recursive: true, force: true });
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
