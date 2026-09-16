'use strict';

const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const target = process.env.EFR_TEST_URL || 'http://127.0.0.1:8099/';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const browserErrors = [];

  page.on('pageerror', (error) => browserErrors.push(String(error && error.stack || error)));
  page.on('console', (message) => {
    if (message.type() === 'error') browserErrors.push('console: ' + message.text());
  });

  try {
    await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 60000 });

    // The vector tray belongs to the authentication gate. The production page
    // intentionally starts that gate hidden until the boot/entry handoff. Put
    // the real page into the same auth-gate state shown to a user before testing
    // the tray; do not manufacture a fake tray or call the EFR open API.
    await page.waitForFunction(() => (
      document.getElementById('authOverlay') &&
      typeof window.l8ShowAuthGate === 'function'
    ), { timeout: 30000 });
    await page.evaluate(() => window.l8ShowAuthGate());

    await page.waitForFunction(() => (
      window.HashcodVectorTray &&
      typeof window.HashcodVectorTray.mount === 'function' &&
      window.HashcodEfrCodeEditor &&
      typeof window.HashcodEfrCodeEditor.diagnostics === 'function'
    ), { timeout: 30000 });

    // Mount is part of the platform's public tray API and is safe/idempotent.
    // Calling it here only removes boot timing from the test; the subsequent
    // interaction is a physical Chromium pointer click on the rendered cube.
    await page.evaluate(() => {
      window.HashcodVectorTray.mount();
      window.HashcodEfrCodeEditor.repair();
    });

    const slotSelector = '#hashcodVectorTray [data-vector-tray-slot="4"]';
    await page.waitForSelector(slotSelector, { state: 'visible', timeout: 30000 });

    const slotState = await page.$eval(slotSelector, (button) => ({
      disabled: Boolean(button.disabled),
      ariaDisabled: button.getAttribute('aria-disabled'),
      toolId: button.getAttribute('data-tool-id'),
      label: button.getAttribute('aria-label'),
      rect: button.getBoundingClientRect().toJSON()
    }));

    assert.equal(slotState.disabled, false, 'fifth tray cube must be enabled in the real browser');
    assert.equal(slotState.toolId, 'efr-code-editor', 'fifth tray cube must be owned by the EFR editor');
    assert.match(slotState.label || '', /EFR Code Editor/i, 'fifth tray cube must expose the EFR label');
    assert(slotState.rect.width > 0 && slotState.rect.height > 0, 'fifth tray cube must have a clickable box');

    // Real pointer interaction. Do not call window.HashcodEfrCodeEditor.open().
    // This catches interception, disabled-state, loader-order and stacking bugs.
    const centerX = slotState.rect.x + (slotState.rect.width / 2);
    const centerY = slotState.rect.y + (slotState.rect.height / 2);
    await page.mouse.click(centerX, centerY);

    await page.waitForFunction(() => {
      const modal = document.getElementById('hashcodEfrEditorModal');
      if (!modal || modal.hidden || modal.getAttribute('aria-hidden') === 'true') return false;
      const style = getComputedStyle(modal);
      return Boolean(modal.open) && style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity || '1') > 0;
    }, { timeout: 15000 });

    const runtime = await page.evaluate(() => window.HashcodEfrCodeEditor.diagnostics());
    assert.equal(runtime.ready, true, 'EFR runtime readiness marker must be true');
    assert.equal(runtime.buttonFound, true, 'EFR diagnostics must find the fifth cube');
    assert.equal(runtime.buttonDisabled, false, 'EFR diagnostics must report the fifth cube enabled');
    assert.equal(runtime.toolId, 'efr-code-editor', 'EFR diagnostics must report ownership of slot 4');
    assert.equal(runtime.modalOpen, true, 'EFR diagnostics must report the editor open');

    await page.waitForSelector('#hashcodEfrEditorTextarea', { state: 'visible', timeout: 10000 });
    await page.fill('#hashcodEfrEditorTextarea', 'function browserVerifiedEFR() {\n    return "works";\n}');
    await page.fill('#hashcodEfrEditorFilename', 'browser-verified');

    const downloadPromise = page.waitForEvent('download', { timeout: 15000 });
    await page.click('#hashcodEfrDownload');
    const download = await downloadPromise;
    assert.equal(download.suggestedFilename(), 'browser-verified.efr', 'browser download must preserve the .efr extension');

    const modalOpen = await page.$eval('#hashcodEfrEditorModal', (modal) => Boolean(modal.open) && !modal.hidden && modal.getAttribute('aria-hidden') === 'false');
    assert.equal(modalOpen, true, 'EFR modal must remain open after download');

    // Ignore unrelated third-party/network console errors; fail only on errors
    // that clearly originate from the EFR/tray integration itself.
    const relevantErrors = browserErrors.filter((message) => /efr|hashcodVectorTray|platform-entry-slogan/i.test(message));
    assert.deepEqual(relevantErrors, [], 'EFR/tray browser errors: ' + relevantErrors.join('\n'));

    console.log('PASS: real Chromium auth-gate click on the fifth tray cube opens the top-layer EFR editor and downloads browser-verified.efr.');
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error && error.stack || error);
  process.exit(1);
});
