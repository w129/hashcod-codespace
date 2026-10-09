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
    for (const file of ['platform-period-lib.php', 'hashcod-file-vault-fast-upload.php', 'hashcod-file-vault-access-code.php', 'hashcod-file-vault-value.php']) fs.copyFileSync(path.join(root, file), path.join(fixture, file));
    fs.writeFileSync(path.join(fixture, 'mldsa-access.php'), `<?php
$_COOKIE['hashcod_platform_period_v1']='isolated-test-cookie';
function mldsaHost(){return $_SERVER['HTTP_HOST']??'fixture';}
function mldsaOpen($raw){return ['kind'=>'platform-period-v1','host'=>mldsaHost(),'token'=>'fixture-active-token','state'=>'active','days'=>10,'expiresAt'=>time()+864000,'proExpiresAt'=>isset($_GET['free'])?null:time()+86400];}
`);
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
    async function request(code, priceUsdCents = null, free = false) {
      const response = await fetch(url + (free ? '&free=1' : ''), { method: 'POST', headers: { Origin: `http://127.0.0.1:${port}`, 'X-Requested-With': 'XMLHttpRequest', 'Content-Type': 'application/json' }, body: JSON.stringify({ id: 'fv_access123', name: 'file.pdf', type: 'application/pdf', size: 1, access_code: code, priceUsdCents }) });
      return { status: response.status, body: await response.json() };
    }
    const free = await request('chosen-code', 1250, true);
    assert.equal(free.status, 403, 'Free sessions cannot upload files even with a valid file code');
    assert.equal(free.body.code, 'subscription_required');
    const invalid = await request('');
    assert.equal(invalid.status, 400);
    assert.match(invalid.body.error, /code/i);
    for (const cents of [-1, 1.5, 1000000000, 'NaN']) {
      const invalidValue = await request('chosen-code', cents);
      assert.equal(invalidValue.status, 400, 'invalid USD values must be rejected before provider calls');
    }
    const valid = await request('MiCodigo-Verde! 2026', 1250);
    assert.equal(valid.status, 503, 'Valid code should pass validation and reach the unavailable provider guard');
    assert.equal(valid.body.code, 'cloud_upload_unavailable');
    assert.equal(valid.body.fallback, true);
    assert.match(valid.body.error, /saved.*device/i);
    console.log('Fast upload accepts arbitrary chosen file codes before provider setup and rejects empty codes');
  } finally {
    if (server && server.exitCode === null) server.kill();
    fs.rmSync(fixture, { recursive: true, force: true });
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
