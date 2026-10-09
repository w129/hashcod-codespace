'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { execFileSync } = require('node:child_process');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '../..');

// Use canonical PHP markup and real styles/islands. Access-gate authorization is
// tested separately; this harness exercises the screen after entry is authorized.
const source = execFileSync(process.env.PHP_BIN || 'php', ['-r', "putenv('L8_CODE_ACCESS_REQUIRED=0'); require 'mldsa-access.php'; echo mldsaGateHtml('/', true);"], { cwd: root }).toString();
let styles = source.match(/<link rel="stylesheet"[^>]+>/g).join('');
if (process.env.HASHCOD_TEST_WITHOUT_MOBILE_LAYOUT) styles = styles.replace(/<link[^>]+first-screen-mobile[^>]+>/, '');
const mainMarkup = source.slice(source.indexOf('<main '), source.indexOf('</main>') + 7);
const footer = source.match(/<footer id="d5PreviewPolicyFooter"[\s\S]*?<\/footer>/)[0];
const scripts = ['ui-interaction-sounds.js', 'mldsa-access-gate.js', 'file-vault-totp.bundle.js', 'first-screen-branched-menu.bundle.js', 'center-empty-state.bundle.js', 'react-bits-rotating-text.js', 'page-mascot-panda.js'].map(name => `<script src="/components/${name}"></script>`).join('');
const html = `<html lang="es"><head><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,interactive-widget=resizes-content"><link rel="stylesheet" href="/components/file-vault-totp.css">${styles}</head><body data-hashcod-entry-intro="1" data-hashcod-policy-version="2026.09.18-2">${mainMarkup}${footer}${scripts}</body></html>`;
const privacyHtml = execFileSync(process.env.PHP_BIN || 'php', ['privacy.php'], { cwd: root }).toString();


async function withinViewport(page, selector) {
  const box = await page.locator(selector).boundingBox(), viewport = page.viewportSize();
  assert(box.x >= 0 && box.y >= 0 && box.x + box.width <= viewport.width + 1 && box.y + box.height <= viewport.height + 1, selector + ' must fit the viewport');
}


// Policy consent: until the checkbox is ticked nothing else on the platform works; ticking records the
// acceptance on the server (append-only evidence + signed cookie) and cannot be undone from the page.
(async () => {
  const server = http.createServer((req, res) => {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    if (pathname === '/') { res.setHeader('Content-Type', 'text/html'); res.end(html); return; }
    if (pathname === '/privacy') { res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.end(privacyHtml); return; }
    if (pathname === '/api/platform-period') { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ok:true, state:'active',subscription:{tier:'pro',expiresAt:Math.floor(Date.now()/1000)+864000}, days:10, expiresAt:Math.floor(Date.now()/1000)+864000, serverNow:Math.floor(Date.now()/1000)})); return; }
    if (pathname.startsWith('/api/')) { res.writeHead(503, { 'Content-Type': 'application/json' }); res.end('{"ok":false,"error":"Cloud unavailable"}'); return; }
    const file = path.resolve(root, '.' + pathname);
    if ((!/^\/(components|mascots)\//.test(pathname) && pathname !== '/hashcod_icon_exact.svg') || !file.startsWith(root + path.sep) || !/\.(js|css|svg|png|webp)$/.test(file) || !fs.existsSync(file)) { res.writeHead(404); res.end(); return; }
    const type = { '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png' }[path.extname(file)];
    res.setHeader('Content-Type', type); fs.createReadStream(file).pipe(res);
  });

  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const address = 'http://127.0.0.1:' + server.address().port;
    for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
      const page = await browser.newPage({ viewport }), errors = [], posts = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.route('**/api/policy-consent', route => { posts.push(route.request().postDataJSON()); route.fulfill({ json: { ok: true, accepted: true, version: '2026.09.18-2', acceptedAt: 1790000000 } }); });
      await page.goto(address);
      await page.waitForSelector('#hpc-consent');
      assert.equal(await page.locator('#d5PreviewPolicyFooter a').count(), 1, 'the policy must be linked once, inside the checkbox label');
      assert.equal(await page.locator('#d5PreviewPolicyFooter').evaluate(n => n.innerText.replace(/\s+/g, ' ').trim().startsWith('Acepto los términos de la Use and Privacy Policy')), true, 'only the checkbox row remains');
      assert.equal(await page.locator('main').evaluate(n => n.inert), true, 'the platform must be inert before acceptance');
      assert.equal(await page.getByRole('button', { name: 'Open Hatch' }).click({ timeout: 1500 }).then(() => false, () => true), true, 'nothing may be clicked before acceptance');
      await withinViewport(page, '#d5PreviewPolicyFooter');
      await page.locator('#hpc-consent').click();
      await page.waitForFunction(() => document.body.dataset.hashcodPolicyConsent === '1');
      assert.deepEqual(posts, [{ accept: true, version: '2026.09.18-2' }], 'acceptance must be sent once with the current policy version');
      assert.equal(await page.locator('main').evaluate(n => n.inert), false, 'the platform unlocks after acceptance');
      assert.equal(await page.locator('#hpc-consent').isDisabled(), true, 'acceptance cannot be withdrawn from the page');
      assert.equal(await page.locator('#hpc-consent').getAttribute('aria-checked'), 'true');
      assert.deepEqual(errors, []);
      await page.close();
      console.log(`Policy consent ${viewport.width}x${viewport.height}: locked until accepted, evidence posted once, one-way checkbox OK`);
    }
    // A server failure must fail closed: still locked, with a visible error.
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.route('**/api/policy-consent', route => route.fulfill({ status: 503, json: { ok: false, error: 'No se pudo guardar tu aceptación. Intenta de nuevo.' } }));
    await page.goto(address);
    await page.locator('#hpc-consent').click();
    await page.getByRole('alert').waitFor();
    assert.equal(await page.locator('main').evaluate(n => n.inert), true, 'a failed save must keep the platform locked');
    assert.equal(await page.locator('#hpc-consent').getAttribute('aria-checked'), 'false');
    console.log('Policy consent fails closed when the evidence cannot be stored');
  } finally { await browser?.close(); await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error); process.exit(1); });
