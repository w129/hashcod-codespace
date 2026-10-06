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
const scripts = ['file-vault-totp.bundle.js', 'first-screen-branched-menu.bundle.js', 'center-empty-state.bundle.js', 'react-bits-rotating-text.js', 'page-mascot-panda.js', 'animate-ui-global-cursor.js'].map(name => `<script src="/components/${name}"></script>`).join('');
const html = `<html lang="es"><head><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,interactive-widget=resizes-content"><link rel="stylesheet" href="/components/file-vault-totp.css">${styles}</head><body data-hashcod-entry-intro="1">${mainMarkup}${footer}${scripts}</body></html>`;

async function layout(page, width) {
  const result = await page.evaluate(() => {
    const box = selector => { const r = document.querySelector(selector).getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top + scrollY, bottom: r.bottom + scrollY }; };
    return {
      calendar: box('#d5FirstScreenCalendar'), actions: box('.hashcod-empty-state-actions-row'), files: box('#d5FilesExplorer'), footer: box('#d5PreviewPolicyFooter'),
      stagePosition: getComputedStyle(document.querySelector('.entry-empty-state-stage')).position,
      footerPosition: getComputedStyle(document.querySelector('#d5PreviewPolicyFooter')).position,
      documentWidth: document.documentElement.scrollWidth,
      calendarTarget: document.querySelector('.v-calendar__day').getBoundingClientRect().height,
      buttons: ['#d5CalendarToday', '#d5CalendarPreviousMonth', '#d5CenterEmptyStateAction', '#d5FileVaultTrigger'].map(selector => document.querySelector(selector).getBoundingClientRect().height),
      cursorDisplay: document.getElementById('d5AnimateCursorLayer') ? getComputedStyle(document.getElementById('d5AnimateCursorLayer')).display : 'none',
    };
  });
  assert.equal(result.stagePosition, 'static', 'phone actions must participate in normal document flow');
  assert.equal(result.footerPosition, 'static', 'phone footer must not cover content');
  assert(result.actions.top >= result.calendar.bottom + 8, 'actions must follow the complete calendar without overlap');
  assert(result.files.top >= result.actions.bottom + 8, 'Files must follow the action buttons');
  assert(result.footer.top >= result.files.bottom + 8, 'privacy control must follow Files');
  assert(result.documentWidth <= width + 1, 'phone must not scroll horizontally');
  for (const item of [result.calendar, result.actions, result.files, result.footer]) assert(item.left >= 0 && item.right <= width + 1, 'every section must fit the phone width');
  assert(result.calendarTarget >= 43.9 && result.buttons.every(h => h >= 43.9), 'phone controls need touch-sized heights');
  assert.equal(result.cursorDisplay, 'none', 'decorative mouse cursor must not overlay the touch screen');
}

async function withinViewport(page, selector) {
  const box = await page.locator(selector).boundingBox(), viewport = page.viewportSize();
  assert(box.x >= 0 && box.y >= 0 && box.x + box.width <= viewport.width + 1 && box.y + box.height <= viewport.height + 1, selector + ' must fit the viewport');
}

async function run() {
  const server = http.createServer((req, res) => {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    if (pathname === '/') { res.setHeader('Content-Type', 'text/html'); res.end(html); return; }
    if (pathname.startsWith('/api/')) { res.writeHead(503, { 'Content-Type': 'application/json' }); res.end('{"ok":false,"error":"Cloud unavailable"}'); return; }
    const file = path.resolve(root, '.' + pathname);
    if (!/^\/(components|mascots)\//.test(pathname) || !file.startsWith(root + path.sep) || !/\.(js|css|svg|png|webp)$/.test(file) || !fs.existsSync(file)) { res.writeHead(404); res.end(); return; }
    const type = { '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png' }[path.extname(file)];
    res.setHeader('Content-Type', type); fs.createReadStream(file).pipe(res);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const address = 'http://127.0.0.1:' + server.address().port;
    for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 430, height: 932 }, { width: 844, height: 390 }]) {
      const context = await browser.newContext({ viewport, hasTouch: true, isMobile: true, deviceScaleFactor: 1 });
      const page = await context.newPage(), errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(address);
      await page.waitForSelector('#d5FilesExplorer');
      await page.waitForFunction(() => window.__hashcodAnimateCursorLoaded);
      await page.waitForFunction(() => document.querySelector('#d5FilesExplorer [data-slot="folder-content"]')?.getBoundingClientRect().height > 30);
      assert.deepEqual(await page.locator('.branched-menu__head').evaluateAll(nodes => nodes.map(n => n.getAttribute('aria-expanded'))), ['false', 'false'], 'phone navigation must start compact');
      await layout(page, viewport.width);
      await page.locator('.branched-menu__head').first().tap();
      await page.getByRole('button', { name: 'Configuration', exact: true }).waitFor({ state: 'visible' });
      const row = await page.getByRole('button', { name: 'Configuration', exact: true }).boundingBox();
      assert.equal(Math.round(row.height), 44, 'branch geometry and phone rows must share the same height');
      await layout(page, viewport.width);
      await page.locator('.branched-menu__head').first().tap();
      await page.waitForFunction(() => document.querySelector('.branched-menu__section')?.getAttribute('data-open') === null);
      await page.locator('#d5CalendarNextMonth').tap();
      await layout(page, viewport.width);
      await page.locator('#d5CalendarToday').tap();
      await page.evaluate(async () => {
        await window.HashcodFileVaultTotp.saveLocal(new File(['Mobile protected preview'], 'A very long uploaded filename '.repeat(6) + '.txt', { type: 'text/plain' }), 'fv_phone_preview_12345', 'phone-code');
        window.dispatchEvent(new CustomEvent('hashcod:file-vault-saved'));
      });
      await page.locator('[data-hfv-preview-id="fv_phone_preview_12345"]').waitFor({ state: 'visible' });
      await layout(page, viewport.width);
      await page.locator('#d5FilesExplorer').scrollIntoViewIfNeeded();
      if (process.env.HASHCOD_MOBILE_SCREENSHOT_DIR) {
        fs.mkdirSync(process.env.HASHCOD_MOBILE_SCREENSHOT_DIR, { recursive: true });
        await page.screenshot({ path: path.join(process.env.HASHCOD_MOBILE_SCREENSHOT_DIR, `phone-${viewport.width}x${viewport.height}.png`), fullPage: true });
      }
      await page.locator('[data-hfv-preview-id="fv_phone_preview_12345"]').tap();
      await page.locator('#hfvTotpCode').fill('wrong');
      await page.getByRole('button', { name: 'Verify & open' }).tap();
      await page.locator('.hfv-totp-error').filter({ hasText: 'exact code' }).waitFor();
      assert.equal(await page.locator('#d5FilePreview').count(), 0, 'phone preview remains protected');
      await withinViewport(page, '.hfv-totp-dialog');
      await page.locator('#hfvTotpCode').fill('phone-code');
      await page.getByRole('button', { name: 'Verify & open' }).tap();
      await page.locator('#d5FilePreview pre').filter({ hasText: 'Mobile protected preview' }).waitFor();
      await withinViewport(page, '#d5FilePreview');
      await page.getByRole('button', { name: 'Close preview', exact: true }).tap();
      await page.locator('#d5FilePreview').waitFor({ state: 'detached' });
      await layout(page, viewport.width);
      assert.deepEqual(errors, []);
      console.log(`Phone ${viewport.width}x${viewport.height}: flow, scrolling, touch targets, month navigation, long filenames and protected preview passed`);
      await context.close();
    }
    const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await desktop.goto(address);
    await desktop.waitForSelector('#d5FilesExplorer');
    assert.equal(await desktop.locator('.branched-menu__head').first().getAttribute('aria-expanded'), 'true');
    assert.equal(await desktop.locator('.branched-menu__item').first().evaluate(n => getComputedStyle(n).height), '36px');
    assert.equal(await desktop.locator('.entry-empty-state-stage').evaluate(n => getComputedStyle(n).position), 'absolute');
    assert.equal(await desktop.locator('#d5PreviewPolicyFooter').evaluate(n => getComputedStyle(n).position), 'fixed');
    console.log('Desktop retains its original menu, centered workspace and footer placement');
  } finally { await browser?.close(); await new Promise(resolve => server.close(resolve)); }
}
run().catch(error => { console.error(error); process.exitCode = 1; });
