'use strict';
// Constancia tool in the real platform page: signature gate (pasted and .txt), local hashing, sealing, PDF preview, list and revoke.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { spawn, execFileSync } = require('node:child_process');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path'), crypto = require('node:crypto');
const root = path.resolve(__dirname, '../..');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cst-ui-'));
const tsaDir = path.join(tmp, 'tsa'); fs.mkdirSync(tsaDir);
const sh = cmd => execFileSync('bash', ['-c', cmd], { stdio: 'pipe' });
sh(`cd ${tsaDir} && openssl req -x509 -newkey rsa:2048 -nodes -keyout ca.key -out cacert.pem -subj '/CN=Test CA' -days 2 2>/dev/null && openssl req -newkey rsa:2048 -nodes -keyout tsa.key -out tsa.csr -subj '/CN=Test TSA' 2>/dev/null && printf 'extendedKeyUsage=critical,timeStamping\\n' > ext.cnf && openssl x509 -req -in tsa.csr -CA cacert.pem -CAkey ca.key -CAcreateserial -out tsa.crt -days 2 -extfile ext.cnf 2>/dev/null && echo 01 > tsaserial`);
fs.writeFileSync(path.join(tsaDir, 'tsa.cnf'), `[ tsa ]\ndefault_tsa = t\n[ t ]\ndir = ${tsaDir}\nserial = $dir/tsaserial\ncrypto_device = builtin\nsigner_cert = $dir/tsa.crt\ncerts = $dir/cacert.pem\nsigner_key = $dir/tsa.key\nsigner_digest = sha256\ndefault_policy = 1.2.3.4.1\ndigests = sha256, sha512\naccuracy = secs:1\nordering = yes\ntsa_name = yes\ness_cert_id_alg = sha256\n`);
const tsaPort = 31000 + Math.floor(Math.random() * 4000), appPort = 36000 + Math.floor(Math.random() * 4000);
const signature = crypto.randomBytes(2420).toString('base64');
const env = { ...process.env, TSA_DIR: tsaDir, HASHCOD_SEAL_DB: path.join(tmp, 'db.sqlite'), HASHCOD_SEAL_ED25519_SEED_B64: crypto.randomBytes(32).toString('base64'),
  HASHCOD_TSA_URL: `http://127.0.0.1:${tsaPort}/`, HASHCOD_TSA2_URL: 'off', HASHCOD_SEAL_ACCESS_SIGNATURE_SHA256: crypto.createHash('sha256').update(Buffer.from(signature, 'base64')).digest('hex'), HASHCOD_TSA_CA_FILE: path.join(tsaDir, 'cacert.pem') };
const tsa = spawn('php', ['-S', `127.0.0.1:${tsaPort}`, path.join(root, 'tests/fixtures/local-tsa.php')], { env, stdio: 'ignore' });
const app = spawn('php', ['-S', `127.0.0.1:${appPort}`, 'router.php'], { env, cwd: root, stdio: 'ignore' });
const target = `http://127.0.0.1:${appPort}/`;
const sealCookie = o => execFileSync('php', ['-r', "require 'mldsa-access.php'; echo mldsaSeal(json_decode($argv[1],true));", JSON.stringify(o)], { cwd: root, encoding: 'utf8' }).trim();

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const exp = Math.floor(Date.now() / 1000) + 86400, host = `127.0.0.1:${appPort}`;
    await page.context().addCookies([
      { name: 'hashcod_platform_period_v1', value: sealCookie({ kind: 'platform-period-v1', host, state: 'active', subscription: { tier: 'pro', expiresAt: exp + 800000 }, days: 10, expiresAt: exp, proExpiresAt: exp, token: 't' }), url: target, httpOnly: true, sameSite: 'Strict' },
      { name: 'hashcod_policy_consent_v1', value: sealCookie({ kind: 'policy-consent-v1', host, version: '2026.09.18-2', receipt: '0b9c1f3e-1a2b-4c3d-8e4f-5a6b7c8d9e0f', acceptedAt: Math.floor(Date.now() / 1000) }), url: target, httpOnly: true, sameSite: 'Strict' }]);
    await page.route('**/api/platform-period', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, state: 'active', subscription: { tier: 'pro', expiresAt: exp + 800000 }, days: 10, expiresAt: exp, serverNow: Math.floor(Date.now() / 1000) }) }));
    await page.route('**/api/hashcod-shared-*', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, files: [], state: {}, text: '', updatedAt: 0 }) }));
    for (let i = 0; i < 60; i++) { try { if ((await fetch(target + 'robots.txt')).ok) break; } catch {} await new Promise(r => setTimeout(r, 150)); }

    await page.goto(target, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#d5SealTrigger', { timeout: 20000 });
    const pos = await page.evaluate(() => { const f = document.getElementById('d5FormsTrigger').getBoundingClientRect(), s = document.getElementById('d5SealTrigger').getBoundingClientRect(); return { sameRow: Math.abs(f.top - s.top) < 2, right: s.left >= f.right }; });
    assert(pos.sameRow && pos.right, 'the seal button sits right beside the forms button');
    await page.click('#d5SealTrigger');
    await page.waitForSelector('#d5SealTool');
    // gate: wrong signature
    await page.fill('.hst-signature', crypto.randomBytes(2420).toString('base64'));
    await page.click('button:has-text("Entrar")');
    await page.waitForSelector('.htk-error');
    // gate: right signature uploaded as a .txt file
    // (the platform's burst limiter may answer 429 right after the page load; retry like a person would)
    for (let attempt = 0; attempt < 4 && !(await page.locator('form.hst-body').count()); attempt++) {
      if (attempt) await page.waitForTimeout(6000);
      await page.setInputFiles('.hst-file input', { name: 'firma.txt', mimeType: 'text/plain', buffer: Buffer.from(signature.replace(/(.{76})/g, '$1\n')) });
      await page.locator('form.hst-body').waitFor({ timeout: 4000 }).catch(() => {});
    }
    await page.waitForSelector('form.hst-body');
    assert.equal(await page.locator('.htk-error').count(), 0, 'error clears after entering');
    // required fields are validated
    await page.click('button[type=submit]');
    await page.waitForTimeout(300); const flagged = await page.locator('.hst-body em').allTextContents(); assert(flagged.length >= 4, 'missing required fields are flagged: ' + JSON.stringify(flagged));
    // fill + two files (Merkle)
    await page.fill('input[maxlength="200"] >> nth=0', 'Acme SRL');
    await page.fill('input[maxlength="20"]', '1-31-12345-6');
    await page.locator('.hst-field:has-text("Nombre del activo") input').fill('Modelo X');
    await page.locator('.hst-field:has-text("Versión") input').fill('1.0.0');
    await page.setInputFiles('.hst-drop input', [{ name: 'a.bin', mimeType: 'application/octet-stream', buffer: Buffer.from('aaa') }, { name: 'b.bin', mimeType: 'application/octet-stream', buffer: Buffer.alloc(300000, 7) }]);
    await page.waitForSelector('.hst-root:has-text("Raíz Merkle")');
    assert.equal(await page.locator('.hst-files li').count(), 2, 'both files listed with their hashes');
    const shown = await page.locator('.hst-root code').textContent();
    assert(/^[0-9a-f]{128}$/.test(shown), 'a SHA-512 Merkle root is shown');
    await page.click('.hst-check [data-slot=checkbox]');
    await page.click('button[type=submit]');
    await page.waitForSelector('.hst-result', { timeout: 60000 });
    const number = await page.locator('.htk-notice b').textContent();
    assert(/^HC-\d{4}-000001$/.test(number), 'the first constancia is HC-YYYY-000001');
    assert.equal(await page.locator('.hst-result dd.hst-mono').first().textContent(), shown, 'the server root equals the one computed in the browser');
    await page.waitForSelector('.hst-sheet canvas', { timeout: 30000 });
    await page.waitForFunction(() => { const c = document.querySelector('.hst-sheet canvas'); return c && c.width > 400 && !document.querySelector('.hst-sheet .hfv-preview-loading'); }, null, { timeout: 30000 }); await page.screenshot({ path: process.env.SEAL_SHOT || os.tmpdir() + '/seal-ui.png' });
    const [dl] = await Promise.all([page.waitForEvent('download'), page.click('button:has-text("Descargar PDF")')]);
    assert(/^HC-\d{4}-000001\.pdf$/.test(dl.suggestedFilename()), 'PDF download');
    const [dlCod] = await Promise.all([page.waitForEvent('download'), page.click('button:has-text("Descargar .cod")')]);
    assert(/\.cod$/.test(dlCod.suggestedFilename()), '.cod download');
    // list + revoke
    await page.click('[role=tab]:has-text("Emitidas")');
    await page.waitForSelector('.hst-list li');
    page.on('dialog', d => d.accept('prueba e2e'));
    // The platform's own burst limiter (40 requests / 10 s per IP) can answer 429 right after the issuing flow; retry like a person would.
    for (let attempt = 0; attempt < 4 && !(await page.locator('.hst-badge--revocada').count()); attempt++) {
      if (attempt) await page.waitForTimeout(6000);
      if (await page.locator('.hst-list button:has-text("Revocar")').count()) await page.click('.hst-list button:has-text("Revocar")');
      await page.locator('.hst-badge--revocada').waitFor({ timeout: 4000 }).catch(() => {});
    }
    await page.waitForSelector('.hst-badge--revocada', { timeout: 5000 });
    // public page of what was just issued (no cookies)
    const verify = await (await fetch(target + 'verify/' + number)).text();
    assert(verify.includes('REVOCADA'), 'the public page shows the revocation');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#d5SealTool').count(), 0, 'Escape closes the tool');
    console.log('Seal tool: OK');
  } catch (e) { console.error(e); process.exitCode = 1; }
  finally { await browser.close(); tsa.kill(); app.kill(); fs.rmSync(tmp, { recursive: true, force: true }); }
})();
