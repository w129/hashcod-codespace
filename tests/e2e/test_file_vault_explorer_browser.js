const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '../..');

function samplePdf() {
  const stream = 'BT /F1 24 Tf 72 700 Td (Hashcod protected preview) Tj ET';
  const objects = ['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>', `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`];
  let data = '%PDF-1.4\n', offsets = [0];
  objects.forEach((value, index) => { offsets.push(Buffer.byteLength(data)); data += `${index + 1} 0 obj\n${value}\nendobj\n`; });
  const xref = Buffer.byteLength(data);
  data += 'xref\n0 6\n0000000000 65535 f \n' + offsets.slice(1).map(offset => `${String(offset).padStart(10, '0')} 00000 n \n`).join('');
  return data + `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
}

async function main() {
  const server = http.createServer((request, response) => {
    const pathname = new URL(request.url, 'http://localhost').pathname;
    if (pathname === '/') {
      response.setHeader('Content-Type', 'text/html');
      // Same protection boundaries as production, including no document frames.
      response.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; media-src 'self' blob:; worker-src 'self' blob:; object-src 'none'; frame-src 'self'; connect-src 'self'");
      response.end('<html><head><link rel="stylesheet" href="/components/center-empty-state.bundle.css"><link rel="stylesheet" href="/components/file-vault-totp.css"></head><body data-hashcod-entry-intro="1" style="margin:0;background:#f7f7f7"><div class="entry-empty-state-stage"><div class="entry-empty-state-mount" id="d5CenterEmptyStateMount"></div></div><script src="/components/file-vault-totp.bundle.js"></script><script src="/components/center-empty-state.bundle.js"></script></body></html>');
      return;
    }
    if (pathname === '/api/hashcod-file-vault') {
      response.writeHead(503, { 'Content-Type': 'application/json' }); response.end('{"ok":false,"error":"Cloud unavailable"}'); return;
    }
    const absolute = path.resolve(root, '.' + pathname);
    if (!pathname.startsWith('/components/') || !absolute.startsWith(root + path.sep) || !fs.existsSync(absolute) || fs.statSync(absolute).isDirectory()) { response.writeHead(404); response.end(); return; }
    response.setHeader('Content-Type', pathname.endsWith('.css') ? 'text/css' : pathname.endsWith('.js') ? 'text/javascript' : pathname.endsWith('.wasm') ? 'application/wasm' : 'application/octet-stream');
    fs.createReadStream(absolute).pipe(response);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage(), errors = [];
    page.on('pageerror', error => errors.push(error));
    const base = 'http://127.0.0.1:' + server.address().port;
    await page.goto(base);
    await page.waitForFunction(() => window.HashcodFileVaultTotp);
    await page.evaluate(async pdf => {
      for (const [id, name, type, data] of [
        ['fv_browser_pdf_12345', 'report.pdf', 'application/pdf', pdf],
        ['fv_browser_html_12345', 'example.html', 'text/html', '<script>window.PWNED=true</script>'],
        ['fv_browser_text_12345', 'notes.txt', 'text/plain', 'Protected notes'],
      ]) await window.HashcodFileVaultTotp.saveLocal(new File([data], name, { type }), id, 'same-file-code', 1250);
      window.dispatchEvent(new CustomEvent('hashcod:file-vault-saved'));
    }, samplePdf());
    await page.locator('[data-hfv-preview-id="fv_browser_pdf_12345"]').waitFor({ state: 'visible' });
    await page.reload();
    await page.locator('[data-hfv-preview-id="fv_browser_pdf_12345"]').waitFor({ state: 'visible' });
    await page.waitForFunction(() => {
      const folder = document.querySelector('#d5FilesExplorer [data-slot="folder-content"]');
      const rows = Array.from(document.querySelectorAll('#d5FilesExplorer [data-hfv-preview-id]'));
      return folder && rows.length === 3 && folder.getBoundingClientRect().height >= rows.reduce((total, row) => total + row.getBoundingClientRect().height, 0) - 1 && getComputedStyle(folder).opacity === '1';
    });
    assert.match(await page.locator('[data-hfv-preview-id="fv_browser_pdf_12345"] .hfv-file-value').textContent(), /\$12.50 USD/);
    assert.equal(await page.locator('[data-hfv-preview-id]').count(), 3, 'reload must restore every stored file');
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('hashcod:file-vault-transfer', { detail: { id: 'fv_browser_pending', pending: true } })));
    await page.locator('#d5FilesExplorer .hfv-loading-state').waitFor();
    for (const viewport of [{ width: 1440, height: 900 }, { width: 320, height: 700 }, { width: 390, height: 844 }, { width: 700, height: 500 }]) {
      await page.setViewportSize(viewport);
      const tree = await page.locator('#d5FilesExplorer').boundingBox();
      const actions = await page.locator('.hashcod-empty-state-actions-row').boundingBox();
      assert(tree.y >= actions.y + actions.height, 'Files must appear below icons');
      assert(tree.x >= 0 && tree.x + tree.width <= viewport.width + 1 && tree.y + tree.height <= viewport.height + 1, 'Files must remain visible without viewport overflow: ' + JSON.stringify({ viewport, tree }));
      assert(tree.width <= 500 && tree.height <= 350);
      const styles = await page.locator('#d5FilesExplorer').evaluate(node => ({ radius: getComputedStyle(node).borderRadius, border: getComputedStyle(node).borderTopWidth }));
      assert.equal(styles.radius, '16px'); assert.equal(styles.border, '1px');
      const loader = await page.locator('.hfv-explorer-loading').boundingBox();
      assert(Math.abs(tree.x + tree.width - loader.x - loader.width - 16) < 2, 'loader must stay in the Files right corner');
      assert(loader.y >= tree.y && loader.y + loader.height <= tree.y + 44, 'loader must stay in the Files header');
      assert(loader.x >= tree.x && loader.x + loader.width <= tree.x + tree.width, 'loader must fit small screens');
    }
    assert.equal(await page.locator('.hfv-loading-pixel').count(), 9);
    assert.equal(await page.locator('.hfv-loading-pixel').first().evaluate(node => getComputedStyle(node).width), '4px');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    assert.equal(await page.locator('.hfv-loading-pixel').first().evaluate(node => getComputedStyle(node).animationName), 'none');
    const elapsed = await page.locator('.hfv-loading-elapsed').textContent();
    await page.waitForFunction(value => document.querySelector('.hfv-loading-elapsed')?.textContent !== value, elapsed);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('hashcod:file-vault-transfer', { detail: { id: 'fv_browser_pending', pending: false } })));
    await page.locator('.hfv-loading-state').waitFor({ state: 'detached' });
    await page.setViewportSize({ width: 1440, height: 900 });
    const card = page.locator('#d5RecommendationCard');
    for (const viewport of [{ width: 320, height: 700 }, { width: 1440, height: 900 }]) {
      await page.setViewportSize(viewport);
      const tree = await page.locator('#d5FilesExplorer').boundingBox();
      const closed = await card.boundingBox();
      assert(closed.y >= tree.y + tree.height, 'recommendation must sit below Files');
      assert(closed.x >= 0 && closed.x + closed.width <= viewport.width + 1 && closed.width <= 380);
      await card.getByRole('button', { name: 'Alternatives', exact: true }).click();
      await card.locator('[data-option="review"]').click();
      await card.getByRole('button', { name: 'Configure', exact: true }).click();
      assert.equal(await card.getAttribute('data-accepted'), 'true');
      await card.locator('[data-option="none"]').click();
      assert.equal(await card.getAttribute('data-accepted'), 'false');
      await card.getByRole('button', { name: 'Accept full restock', exact: true }).click();
      await card.locator('[data-option="high"]').click();
      await card.getByRole('button', { name: 'Accept', exact: true }).click();
      await card.getByRole('button', { name: 'Accepted', exact: true }).waitFor();
      await card.locator('.hrc-drawer').evaluate(async node => {
        await Promise.all(node.getAnimations().map(animation => animation.finished.catch(() => {})));
      });
      const expanded = await card.boundingBox();
      assert(expanded.x >= 0 && expanded.x + expanded.width <= viewport.width + 1);
      assert.equal(await card.evaluate(node => node.scrollWidth <= node.clientWidth), true, 'drawer must not overflow horizontally');
      if (process.env.HFV_SCREENSHOT_DIR) {
        fs.mkdirSync(process.env.HFV_SCREENSHOT_DIR, { recursive: true });
        await page.screenshot({ path: path.join(process.env.HFV_SCREENSHOT_DIR, 'recommendation-' + viewport.width + '.png'), fullPage: true });
      }
      await card.getByRole('button', { name: 'Alternatives', exact: true }).click();
      assert.equal(await card.locator('.hrc-drawer').getAttribute('aria-hidden'), 'true');
      // Reset to a different option before repeating the acceptance flow.
      await card.getByRole('button', { name: 'Alternatives', exact: true }).click();
      await card.locator('[data-option="none"]').click();
      await card.getByRole('button', { name: 'Alternatives', exact: true }).click();
    }
    await page.setViewportSize({ width: 1440, height: 900 });
    if (process.env.HFV_SCREENSHOT_DIR) {
      fs.mkdirSync(process.env.HFV_SCREENSHOT_DIR, { recursive: true });
      await page.screenshot({ path: path.join(process.env.HFV_SCREENSHOT_DIR, 'files-explorer.png') });
    }
    for (const viewport of [{ width: 320, height: 700 }, { width: 1440, height: 900 }]) {
      await page.setViewportSize(viewport);
      await page.evaluate(() => { void window.HashcodFileVaultTotp.requestSetup('priced-document.pdf'); });
      await page.locator('.hfv-value-toggle').click();
      await page.locator('#hfvUsdValue').fill('12.50');
      const dialog = await page.locator('.hfv-totp-dialog').boundingBox();
      assert(dialog.x >= 0 && dialog.x + dialog.width <= viewport.width + 1 && dialog.y >= 0 && dialog.y + dialog.height <= viewport.height + 1, 'USD setup must fit phone and desktop: ' + JSON.stringify({ viewport, dialog }));
      if (process.env.HFV_SCREENSHOT_DIR) await page.screenshot({ path: path.join(process.env.HFV_SCREENSHOT_DIR, 'file-value-' + viewport.width + '.png') });
      await page.getByRole('button', { name: 'Cancel', exact: true }).click();
      await page.locator('.hfv-totp-dialog').waitFor({ state: 'detached' });
    }
    await page.locator('[data-hfv-preview-id="fv_browser_pdf_12345"]').click();
    await page.locator('#hfvTotpCode').fill('wrong');
    await page.getByRole('button', { name: 'Verify & open' }).click();
    await page.locator('.hfv-totp-error').filter({ hasText: 'exact code' }).waitFor();
    assert.equal(await page.locator('#d5FilePreview').count(), 0);
    await page.locator('#hfvTotpCode').fill('same-file-code');
    await page.getByRole('button', { name: 'Verify & open' }).click();
    await page.waitForFunction(() => {
      const canvas = document.querySelector('#d5FilePreview canvas');
      return canvas?.width > 100 && !document.querySelector('.hfv-preview-loading');
    });
    assert.equal(await page.locator('#d5FilePreview iframe').count(), 0, 'PDF must render as canvas without weakening frame policy');
    const hasInk = await page.locator('#d5FilePreview canvas').evaluate(canvas => {
      const pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
      for (let i = 0; i < pixels.length; i += 4) if (pixels[i + 3] > 0 && pixels[i] < 200 && pixels[i + 1] < 200 && pixels[i + 2] < 200) return true;
      return false;
    });
    assert(hasInk, 'actual PDF.js worker must render document content');
    if (process.env.HFV_SCREENSHOT_DIR) await page.screenshot({ path: path.join(process.env.HFV_SCREENSHOT_DIR, 'protected-pdf-preview.png') });
    await page.getByRole('button', { name: 'Download file' }).click();
    await page.locator('#hfvTotpCode').waitFor();
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    await page.locator('form.hfv-totp-dialog').waitFor({ state: 'detached' });
    assert.equal(await page.locator('#d5FilePreview').count(), 1, 'cancelled download keeps authorized preview open');
    await page.getByRole('button', { name: 'Delete file' }).click();
    await page.locator('#hfvTotpCode').fill('same-file-code');
    await page.getByRole('button', { name: 'Verify & delete' }).click();
    await page.locator('#d5FilePreview').waitFor({ state: 'detached' });
    assert.equal(await page.locator('[data-hfv-preview-id="fv_browser_pdf_12345"]').count(), 0);
    await page.locator('[data-hfv-preview-id="fv_browser_html_12345"]').click();
    await page.locator('#hfvTotpCode').fill('same-file-code');
    await page.getByRole('button', { name: 'Verify & open' }).click();
    await page.locator('#d5FilePreview pre').filter({ hasText: 'window.PWNED' }).waitFor();
    assert.equal(await page.evaluate(() => window.PWNED), undefined);
    assert.equal(errors.length, 0, errors.map(String).join('\n'));
    console.log('Chromium: official Files geometry at desktop/mobile/short sizes, real encrypted PDF rendering, repeat code checks, deletion, reload and inert HTML OK');
  } finally { await browser?.close(); await new Promise(resolve => server.close(resolve)); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
