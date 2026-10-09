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
const html = `<html lang="es"><head><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,interactive-widget=resizes-content"><link rel="stylesheet" href="/components/file-vault-totp.css">${styles}</head><body data-hashcod-entry-intro="1">${mainMarkup}${footer}${scripts}</body></html>`;
const privacyHtml = execFileSync(process.env.PHP_BIN || 'php', ['privacy.php'], { cwd: root }).toString();

async function layout(page, width) {
  const result = await page.evaluate(width => {
    const box = selector => { const r = document.querySelector(selector).getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top + scrollY, bottom: r.bottom + scrollY }; };
    return {
      calendar: box('#d5FirstScreenCalendar'), actions: box('.hashcod-empty-state-actions-row'), files: box('#d5FilesExplorer'), recommendation: box('.hpa-panel'), footer: box('#d5PreviewPolicyFooter'),
      stagePosition: getComputedStyle(document.querySelector('.entry-empty-state-stage')).position,
      footerPosition: getComputedStyle(document.querySelector('#d5PreviewPolicyFooter')).position,
      documentWidth: document.documentElement.scrollWidth,
      overflow: Array.from(document.querySelectorAll('body *')).filter(n => {
        const r = n.getBoundingClientRect();
        return r.width > 0 && (r.right > width + 1 || r.left < -1);
      }).slice(0, 12).map(n => ({ id: n.id, class: n.className?.baseVal ?? n.className, left: n.getBoundingClientRect().left, right: n.getBoundingClientRect().right })),
      calendarTarget: document.querySelector('.v-calendar__day').getBoundingClientRect().height,
      buttons: ['#d5CalendarToday', '#d5CalendarPreviousMonth', '#d5CenterEmptyStateAction', '#d5FileVaultTrigger'].map(selector => document.querySelector(selector).getBoundingClientRect().height),
      cursorDisplay: document.getElementById('d5AnimateCursorLayer') ? getComputedStyle(document.getElementById('d5AnimateCursorLayer')).display : 'none',
    };
  }, width);
  assert.equal(result.stagePosition, 'static', 'phone actions must participate in normal document flow');
  assert.equal(result.footerPosition, 'static', 'phone footer must not cover content');
  assert(result.actions.top >= result.calendar.bottom + 8, 'actions must follow the complete calendar without overlap');
  assert(result.actions.top <= result.calendar.bottom + 120, 'hidden desktop wrappers must not leave a large gap: ' + JSON.stringify(result));
  assert(result.files.top >= result.actions.bottom + 8, 'Files must follow the action buttons');
  assert(result.recommendation.top >= result.files.bottom + 8, 'recommendation must follow Files');
  assert(result.footer.top >= result.recommendation.bottom + 8, 'privacy control must follow the recommendation: ' + JSON.stringify(result));
  assert(result.documentWidth <= width + 1, 'phone must not scroll horizontally: ' + JSON.stringify(result));
  for (const item of [result.calendar, result.actions, result.files, result.recommendation, result.footer]) assert(item.left >= 0 && item.right <= width + 1, 'every section must fit the phone width');
  assert(result.calendarTarget >= 43.9 && result.buttons.every(h => h >= 43.9), 'phone controls need touch-sized heights');
  assert.equal(result.cursorDisplay, 'none', 'decorative mouse cursor must not overlay the touch screen');
}

async function withinViewport(page, selector) {
  const box = await page.locator(selector).boundingBox(), viewport = page.viewportSize();
  assert(box.x >= 0 && box.y >= 0 && box.x + box.width <= viewport.width + 1 && box.y + box.height <= viewport.height + 1, selector + ' must fit the viewport');
}

async function noHorizontalScroll(page) {
  const width = await page.evaluate(() => ({ actual: document.documentElement.scrollWidth, available: document.documentElement.clientWidth }));
  assert(width.actual <= width.available + 1, 'page must fit its available width, including the vertical scrollbar gutter: ' + JSON.stringify(width));
  await page.evaluate(() => scrollTo(200, scrollY));
  assert.equal(await page.evaluate(() => scrollX), 0, 'the page must not move sideways');
}

async function checkBrandIcon(page) {
  await page.waitForFunction(() => {
    const icon = document.querySelector('.entry-rotating-text-brand-icon');
    return icon?.complete && icon.naturalWidth > 0;
  });
  const brand = await page.evaluate(() => {
    const icon = document.querySelector('.entry-rotating-text-brand-icon');
    const text = document.querySelector('.entry-rotating-text-prefix');
    const a = icon.getBoundingClientRect(), b = text.getBoundingClientRect();
    return { src: icon.getAttribute('src'), right: a.right, left: b.left, iconCenter: a.top + a.height / 2, textCenter: b.top + b.height / 2, width: a.width, height: a.height };
  });
  assert.equal(brand.src, '/hashcod_icon_exact.svg', 'hero must use the original repository icon');
  assert(brand.right < brand.left, 'brand icon must remain to the left of Crea con');
  assert(Math.abs(brand.iconCenter - brand.textCenter) < 1, 'icon must align vertically with the text');
  assert.equal(brand.width, brand.height, 'icon must preserve its square display box');
}

async function run() {
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
    for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 430, height: 932 }, { width: 844, height: 390 }]) {
      const context = await browser.newContext({ viewport, hasTouch: true, isMobile: true, deviceScaleFactor: 1 });
      const page = await context.newPage(), errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(address);
      await page.waitForSelector('#d5FilesExplorer');
      await checkBrandIcon(page);
      await page.waitForFunction(() => document.querySelector('#d5FilesExplorer [data-slot="folder-content"]')?.getBoundingClientRect().height > 30);
      assert.deepEqual(await page.locator('.branched-menu__head').evaluateAll(nodes => nodes.map(n => n.getAttribute('aria-expanded'))), ['false', 'false'], 'phone navigation must start compact');
      await layout(page, viewport.width);
      await noHorizontalScroll(page);
      await page.locator('.branched-menu__head').first().tap();
      await page.getByRole('button', { name: 'Configuración', exact: true }).waitFor({ state: 'visible' });
      const row = await page.getByRole('button', { name: 'Configuración', exact: true }).boundingBox();
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
      await page.waitForFunction(() => {
        const folder = document.querySelector('#d5FilesExplorer [data-slot="folder-content"]');
        const row = document.querySelector('[data-hfv-preview-id="fv_phone_preview_12345"]');
        return folder && row && folder.getBoundingClientRect().height >= row.getBoundingClientRect().height - 1;
      });
      await page.locator('#d5FilesExplorer').scrollIntoViewIfNeeded();
      if (process.env.HASHCOD_MOBILE_SCREENSHOT_DIR) {
        fs.mkdirSync(process.env.HASHCOD_MOBILE_SCREENSHOT_DIR, { recursive: true });
        await page.screenshot({ path: path.join(process.env.HASHCOD_MOBILE_SCREENSHOT_DIR, `phone-${viewport.width}x${viewport.height}.png`), fullPage: true });
      }
      await layout(page, viewport.width);
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
      await page.locator('#d5PreviewPolicyTrigger').scrollIntoViewIfNeeded();
      await page.locator('#d5PreviewPolicyTrigger').focus();
      await page.locator('#d5PreviewPolicyContent[data-open="true"]').waitFor({ state: 'visible' });
      const policy = await page.locator('#d5PreviewPolicyContent').boundingBox();
      assert(policy.x >= 0 && policy.x + policy.width <= viewport.width + 1, 'privacy preview must stay inside the phone width');
      await page.locator('#d5PreviewPolicyTrigger').evaluate(n => n.blur());
      await layout(page, viewport.width);
      const [policyResponse] = await Promise.all([
        page.waitForNavigation(), page.locator('#d5PreviewPolicyTrigger').tap(),
      ]);
      assert.equal(policyResponse.status(), 200, 'phone policy tap must open the full document');
      assert.equal(page.url(), address + '/privacy');
      await page.getByRole('heading', { name: 'Documento de Aceptación Contractual, Privacidad y Evidencia de Registro', exact: true }).waitFor();
      assert.equal(context.pages().length, 1, 'policy navigation must not depend on a popup');
      assert.deepEqual(errors, []);
      console.log(`Phone ${viewport.width}x${viewport.height}: flow, scrolling, touch targets, month navigation, long filenames and protected preview passed`);
      await context.close();
    }
    const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await desktop.goto(address);
    await desktop.waitForSelector('#d5FilesExplorer');
    await checkBrandIcon(desktop);
    await desktop.mouse.move(700, 450);
    assert.equal(await desktop.locator('#d5AnimateCursorLayer, #d5AnimateCursor, #d5AnimateCursorFollow').count(), 0, 'custom cursor and book must be absent');
    assert.equal(await desktop.evaluate(() => document.documentElement.classList.contains('hashcod-animate-cursor-active')), false);
    assert(!/none|url\(/.test(await desktop.locator('#d5CenterEmptyStateAction').evaluate(n => getComputedStyle(n).cursor)), 'desktop controls must use the native cursor');
    assert.equal(await desktop.locator('.branched-menu__head').first().getAttribute('aria-expanded'), 'true');
    assert.equal(await desktop.locator('.branched-menu__item').first().evaluate(n => getComputedStyle(n).height), '36px');
    assert.equal(await desktop.locator('.entry-empty-state-stage').evaluate(n => getComputedStyle(n).position), 'absolute');
    assert.equal(await desktop.locator('#d5PreviewPolicyFooter').evaluate(n => getComputedStyle(n).position), 'fixed');
    await desktop.locator('.hpa-panel').waitFor({ state: 'visible' });
    // Windows reserves space for its native scrollbar. A stable gutter exercises
    // that narrower layout width even in Chromium's headless/overlay environment.
    await desktop.addStyleTag({ content: 'html { scrollbar-gutter: stable; }' });
    await desktop.waitForFunction(() => getComputedStyle(document.querySelector('#d5FilesExplorer [data-slot="folder-content"]')).opacity === '1');
    assert(Math.abs(await desktop.locator('.entry-empty-state-stage').evaluate(n => parseFloat(getComputedStyle(n).top)) - 900 * .53) < 1, 'desktop must keep the original workspace level');
    const workspaceTop = () => desktop.locator('#d5FilesExplorer').evaluate(n => n.getBoundingClientRect().top + scrollY);
    const originalTop = await workspaceTop();
    await desktop.locator('.hashcod-workspace-recommendation').evaluate(n => { n.hidden = true; });
    assert(Math.abs(await workspaceTop() - originalTop) < 1, 'adding the card must not lift Files');
    await desktop.locator('.hashcod-workspace-recommendation').evaluate(n => { n.hidden = false; });
    for (const viewport of [{ width: 1440, height: 900 }, { width: 1440, height: 500 }]) {
      await desktop.setViewportSize(viewport);
      await desktop.evaluate(() => scrollTo(0, 0));
      await noHorizontalScroll(desktop);
      const before = await workspaceTop();
      const card = desktop.locator('.hpa-panel');
      assert(Math.abs(await workspaceTop() - before) < 1, 'the subscription panel must not move Files');
      await noHorizontalScroll(desktop);
      assert.equal(await desktop.locator('.entry-empty-state-stage').evaluate(n => getComputedStyle(n).overflowY), 'visible', 'scrolling must belong to the page, not a clipped workspace panel');
      if (viewport.height === 500) {
        assert(await desktop.evaluate(() => document.documentElement.scrollHeight > innerHeight), 'a short desktop must have a native page scrollbar');
        // The paid status and admin controls now follow the card; reveal the
        // card itself rather than scrolling past it to the end of the page.
        await card.evaluate(n => { const footer=document.getElementById('d5PreviewPolicyFooter'); scrollTo(0,scrollY+n.getBoundingClientRect().bottom-footer.getBoundingClientRect().top+16); });
        await desktop.waitForFunction(() => scrollY > 0);
        await noHorizontalScroll(desktop);
        const bottom = await card.boundingBox();
        const footer = await desktop.locator('#d5PreviewPolicyFooter').boundingBox();
        assert(bottom.y >= 0 && bottom.y + bottom.height <= footer.y - 8, 'scrolling must reveal the complete card above the fixed footer');
        if (process.env.HASHCOD_MOBILE_SCREENSHOT_DIR) await desktop.screenshot({ path: path.join(process.env.HASHCOD_MOBILE_SCREENSHOT_DIR, 'desktop-workspace-scrolled.png') });
      }
    }
    await desktop.setViewportSize({ width: 1440, height: 900 });
    await desktop.evaluate(() => scrollTo(0, 0));
    console.log('Desktop preserves the original Files level and reveals the complete recommendation using native page scrolling');
    const [desktopPolicy] = await Promise.all([
      desktop.waitForNavigation(), desktop.locator('#d5PreviewPolicyTrigger').click(),
    ]);
    assert.equal(desktopPolicy.status(), 200);
    await desktop.getByRole('heading', { name: 'Declaración de aceptación', exact: true }).waitFor();
    await desktop.getByRole('link', { name: '← Volver a Hashcod Codespace', exact: true }).click();
    await desktop.locator('#d5PreviewPolicyTrigger').waitFor({ state: 'visible' });
    console.log('Desktop retains its original menu, centered workspace and footer placement');
  } finally { await browser?.close(); await new Promise(resolve => server.close(resolve)); }
}
run().catch(error => { console.error(error); process.exitCode = 1; });
