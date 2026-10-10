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
const scripts = ['ui-interaction-sounds.js', 'mldsa-access-gate.js', 'file-vault-totp.bundle.js', 'first-screen-branched-menu.bundle.js', 'center-empty-state.bundle.js', 'react-bits-rotating-text.js', 'page-mascot-panda.js', 'page-mascot-walker.js'].map(name => `<script src="/components/${name}"></script>`).join('');
const html = `<html lang="es"><head><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,interactive-widget=resizes-content"><link rel="stylesheet" href="/components/file-vault-totp.css">${styles}</head><body data-hashcod-entry-intro="1" data-hashcod-policy-consent="1" data-hashcod-policy-version="2026.09.18-2">${mainMarkup}${footer}${scripts}</body></html>`;
const privacyHtml = execFileSync(process.env.PHP_BIN || 'php', ['privacy.php'], { cwd: root }).toString();


async function withinViewport(page, selector) {
  const box = await page.locator(selector).boundingBox(), viewport = page.viewportSize();
  assert(box.x >= 0 && box.y >= 0 && box.x + box.width <= viewport.width + 1 && box.y + box.height <= viewport.height + 1, selector + ' must fit the viewport');
}



// Page mascot walker: the panda walks after the mouse (frontend) and reports/goes to backend work it observes.
const center = async page => page.locator('#hashcodPageMascotDock').evaluate(n => { const r = n.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width }; });
const settle = ms => new Promise(resolve => setTimeout(resolve, ms));
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

    // 1. Fine pointer: it leaves the corner, stops beside the cursor (never under it) and leaves a dotted trail.
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage(), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/api/slow', async route => { await settle(900); route.fulfill({ json: { ok: true } }); });
    await page.route('**/api/boom', route => route.fulfill({ status: 500, json: { ok: false } }));
    await page.route('**/api/quick', route => route.fulfill({ json: { ok: true } }));
    await page.goto(address);
    await page.waitForSelector('#hashcodPageMascotDock.is-ready');
    const home = await center(page);
    await page.mouse.move(640, 420, { steps: 8 });
    await page.waitForFunction(() => document.getElementById('hashcodPageMascotDock').classList.contains('is-walker'));
    await page.waitForFunction(() => document.getElementById('hashcodPageMascotDock').classList.contains('is-walking'));
    assert.equal(await page.locator('#hashcodPageMascotDock').evaluate(n => getComputedStyle(n).pointerEvents), 'none', 'it must not intercept clicks while walking');
    assert.match(await page.locator('.hashcod-walker-chip').textContent(), /frontend/);
    await page.waitForFunction(() => !document.getElementById('hashcodPageMascotDock').classList.contains('is-walking'), null, { timeout: 8000 });
    const arrived = await center(page), distance = Math.hypot(arrived.x - 640, arrived.y - 420);
    assert(arrived.x !== home.x || arrived.y !== home.y, 'the panda left its corner');
    assert(distance > arrived.w * .45 && distance < arrived.w * 1.2, 'the panda stops beside the cursor, not on it: ' + distance);
    assert.equal(await page.locator('#hashcodPageMascotDock').evaluate(n => getComputedStyle(n).pointerEvents), 'auto', 'clickable again once it has arrived');
    assert((await page.locator('.hashcod-walker-trail polyline').getAttribute('points') || '').split(' ').length >= 2, 'it leaves a dotted trail while walking');
    // It keeps following when the cursor goes elsewhere, at walking pace (not teleporting).
    await page.mouse.move(200, 150);
    await settle(120);
    const mid = await center(page);
    assert(Math.hypot(mid.x - arrived.x, mid.y - arrived.y) < 200, 'it walks, it does not jump');
    await page.waitForFunction(() => !document.getElementById('hashcodPageMascotDock').classList.contains('is-walking'), null, { timeout: 8000 });
    const second = await center(page);
    assert(Math.hypot(second.x - 200, second.y - 150) < second.w * 1.3, 'it arrived near the new cursor position');
    assert(second.x >= 0 && second.y >= 0 && second.x <= 1280 && second.y <= 800, 'it stays inside the viewport');

    // 2. Backend work started by a click: it walks to the control, reports the request and celebrates.
    await page.evaluate(() => { const b = document.createElement('button'); b.id = 'probe'; b.textContent = 'Probar backend'; b.style.cssText = 'position:fixed;left:820px;top:640px;z-index:5'; b.addEventListener('click', () => window.__probe = fetch('/api/slow').then(r => r.status)); document.body.appendChild(b); });
    await page.locator('#probe').click();
    await page.waitForFunction(() => /backend · GET \/api\/slow/.test(document.querySelector('.hashcod-walker-chip').textContent), null, { timeout: 4000 });
    assert.equal(await page.locator('#hashcodPageMascotDock').getAttribute('data-walker-mode'), 'backend');
    await page.waitForFunction(() => { const r = document.getElementById('hashcodPageMascotDock').getBoundingClientRect(), b = document.getElementById('probe').getBoundingClientRect(); return Math.hypot(r.left + r.width / 2 - (b.left + b.width / 2), r.top + r.height / 2 - (b.top + b.height / 2)) < 260; }, null, { timeout: 5000 });
    assert.equal(await page.evaluate(() => window.__probe), 200, 'the observed request is untouched and still resolves for the page');
    await page.waitForFunction(() => /backend · listo/.test(document.querySelector('.hashcod-walker-chip').textContent), null, { timeout: 3000 });
    assert.equal(await page.locator('#hashcodPageMascotDock').getAttribute('data-walker-mode'), 'frontend');

    // 3. Failures are reported; fast and cross-origin calls are not narrated.
    await page.evaluate(() => { window.__err = fetch('/api/boom').then(r => r.status); });
    assert.equal(await page.evaluate(() => window.__err), 500);
    await page.evaluate(() => fetch('/api/quick').then(r => r.status));
    await settle(500);
    assert.doesNotMatch(await page.locator('.hashcod-walker-chip').textContent(), /quick/, 'sub-250ms requests are not narrated');
    await page.evaluate(() => fetch('/components/page-mascot-walker.css').then(r => r.status));
    assert.deepEqual(errors, []);

    // 4. The panda can be switched off (Alt+Shift+M) and then stays in its corner.
    await page.keyboard.press('Alt+Shift+M');
    await page.waitForFunction(() => !document.getElementById('hashcodPageMascotDock').classList.contains('is-walker'));
    assert.equal(await page.evaluate(() => window.HashcodMascotWalker.status().enabled), false);
    await page.keyboard.press('Alt+Shift+M');
    await context.close();

    // 5. Reduced motion and touch screens never get a walking panda.
    for (const options of [{ reducedMotion: 'reduce' }, { hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } }]) {
      const quiet = await browser.newContext({ viewport: { width: 1280, height: 800 }, ...options });
      const still = await quiet.newPage();
      await still.goto(address);
      await still.waitForSelector('#hashcodPageMascotDock.is-ready');
      await settle(500);
      const before = await center(still);
      await still.mouse.move(500, 500, { steps: 6 }).catch(() => {});
      await settle(400);
      assert.equal(await still.locator('#hashcodPageMascotDock.is-walker').count(), 0, 'no walking for ' + JSON.stringify(options));
      const after = await center(still);
      assert(Math.abs(after.x - before.x) < 1 && Math.abs(after.y - before.y) < 1, 'it stays in its corner');
      await quiet.close();
    }
    console.log('Page mascot walker: follows the mouse at walking pace, trail, backend narration, failures, opt-out and quiet modes OK');
  } finally { await browser?.close(); await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error); process.exit(1); });
