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

  async function debugState(label) {
    const state = await page.evaluate(() => ({
      title: document.title,
      href: location.href,
      readyState: document.readyState,
      authOverlay: Boolean(document.getElementById('authOverlay')),
      authGateFunction: typeof window.l8ShowAuthGate,
      trayApi: Boolean(window.HashcodVectorTray),
      efrApi: Boolean(window.HashcodEfrCodeEditor),
      trayNode: Boolean(document.getElementById('hashcodVectorTray')),
      bodyClass: document.body ? document.body.className : null,
      htmlLength: document.documentElement ? document.documentElement.outerHTML.length : 0
    }));
    console.log(label + ': ' + JSON.stringify(state));
    if (browserErrors.length) console.log('browser errors: ' + JSON.stringify(browserErrors));
    return state;
  }

  try {
    const response = await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 60000 });
    assert(response, 'browser did not receive a response');
    assert.equal(response.status(), 200, 'local EFR UI must return HTTP 200');

    // The EFR cube belongs to the real authentication overlay. For the browser
    // test we only unhide that existing DOM; we do not fabricate a tray or call
    // the editor open API. This avoids making the test depend on the timing of
    // the separate boot/auth controller while still exercising the real UI.
    await page.waitForSelector('#authOverlay', { state: 'attached', timeout: 30000 }).catch(async (error) => {
      await debugState('auth-overlay-timeout');
      throw error;
    });
    await page.evaluate(() => {
      const overlay = document.getElementById('authOverlay');
      if (!overlay) throw new Error('authOverlay missing');
      overlay.classList.remove('hidden');
      overlay.style.display = 'flex';
      overlay.style.visibility = 'visible';
      overlay.style.opacity = '1';
      document.body.classList.add('auth-locked');
      document.body.classList.remove('boot-locked');
    });

    await page.waitForFunction(() => (
      window.HashcodVectorTray &&
      typeof window.HashcodVectorTray.mount === 'function' &&
      window.HashcodEfrCodeEditor &&
      typeof window.HashcodEfrCodeEditor.diagnostics === 'function'
    ), { timeout: 30000 }).catch(async (error) => {
      await debugState('runtime-timeout');
      throw error;
    });

    // Mount is the platform's public tray API and is safe/idempotent. This only
    // removes boot-animation timing from the test. The editor itself is opened
    // below by a physical Chromium pointer click on the rendered fifth cube.
    await page.evaluate(() => {
      window.HashcodVectorTray.mount();
      window.HashcodEfrCodeEditor.repair();
    });

    const slotSelector = '#hashcodVectorTray [data-vector-tray-slot="4"]';
    await page.waitForSelector(slotSelector, { state: 'visible', timeout: 30000 }).catch(async (error) => {
      await debugState('slot-timeout');
      throw error;
    });

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
    }, { timeout: 15000 }).catch(async (error) => {
      await debugState('modal-timeout');
      throw error;
    });

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

    console.log('PASS: real Chromium click on the real fifth tray cube opens the top-layer EFR editor and downloads browser-verified.efr.');
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error && error.stack || error);
  process.exit(1);
});
