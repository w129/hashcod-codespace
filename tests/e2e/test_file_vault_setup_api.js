'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const php = process.env.PHP_BIN || 'php';
const pause = () => new Promise(resolve => setTimeout(resolve, 20));
(async () => {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'hfv-access-'));
  let server;
  try {
    for (const file of ['hashcod-file-vault-fast-upload.php', 'hashcod-file-vault-access-code.php']) fs.copyFileSync(path.join(root, file), path.join(fixture, file));
    fs.writeFileSync(path.join(fixture, 'auth.php'), '<?php');
    fs.writeFileSync(path.join(fixture, 'hashcod-workspace-access.php'), '<?php');
    fs.writeFileSync(path.join(fixture, 'supabase.php'), `<?php
function supabaseConfig() { return ['configured' => false]; }
function supabaseRequest(...$args) { throw new RuntimeException('Provider must not be called for malformed code'); }
`);
    fs.writeFileSync(path.join(fixture, 'security.php'), `<?php
function securityBootstrap($mode) {}
function securityIsHttps() { return false; }
function securityRateAllowSliding($bucket, $limit, $period) { return ['allowed' => true]; }
`);
    const port = 19000 + Math.floor(Math.random() * 1000);
    const url = `http://127.0.0.1:${port}/hashcod-file-vault-fast-upload.php?action=prepare`;
    server = spawn(php, ['-S', `127.0.0.1:${port}`, '-t', fixture], { stdio: 'ignore' });
    let ready = false;
    for (let i = 0; i < 150; i++) { try { ready = (await fetch(url)).status === 405; } catch {} if (ready) break; await pause(); }
    assert(ready, 'PHP access-code test server did not start');
    async function request(code) {
      const response = await fetch(url, { method: 'POST', headers: { Origin: `http://127.0.0.1:${port}`, 'X-Requested-With': 'XMLHttpRequest', 'Content-Type': 'application/json' }, body: JSON.stringify({ id: 'fv_access123', name: 'file.pdf', type: 'application/pdf', size: 1, access_code: code }) });
      return { status: response.status, body: await response.json() };
    }
    const invalid = await request('');
    assert.equal(invalid.status, 400);
    assert.match(invalid.body.error, /code/i);
    const valid = await request('MiCodigo-Verde! 2026');
    assert.equal(valid.status, 503, 'Valid code should pass validation and reach the unavailable provider guard');
    assert.match(valid.body.error, /direct upload|configured/i);
    console.log('Fast upload accepts arbitrary chosen file codes before provider setup and rejects empty codes');
  } finally {
    if (server && server.exitCode === null) server.kill();
    fs.rmSync(fixture, { recursive: true, force: true });
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
