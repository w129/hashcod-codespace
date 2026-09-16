'use strict';

const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const target = process.env.EFR_TEST_URL || 'http://127.0.0.1:8099/laragon-local-entry.php';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });

  try {
    // Keep the test deterministic: Hashcod's own local resources are allowed,
    // third-party/CDN requests are irrelevant to the tray/editor interaction.
    await page.route('**/*', async (route) => {
      const url = new URL(route.request().url());
      if (url.hostname === '127.0.0.1' || url.hostname === 'localhost') {
        await route.continue();
      } else {
        await route.abort();
      }
    });

    const response = await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 20000 });
    assert(response, 'browser did not receive the local Hashcod page');
    assert.equal(response.status(), 200, 'local Hashcod UI must return HTTP 200');

    await page.waitForSelector('#authOverlay', { state: 'attached', timeout: 10000 });
    await page.evaluate(() => {
      const overlay = document.getElementById('authOverlay');
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
      typeof window.HashcodEfrCodeEditor.repair === 'function'
    ), { timeout: 10000 });

    await page.evaluate(() => {
      window.HashcodVectorTray.mount();
      window.HashcodEfrCodeEditor.repair();
    });

    const slotSelector = '#hashcodVectorTray [data-vector-tray-slot="4"]';
    await page.waitForSelector(slotSelector, { state: 'visible', timeout: 10000 });

    const slotState = await page.$eval(slotSelector, (button) => {
      const rect = button.getBoundingClientRect();
      return {
        disabled: Boolean(button.disabled),
        toolId: button.getAttribute('data-tool-id'),
        label: button.getAttribute('aria-label'),
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
        width: rect.width,
        height: rect.height
      };
    });

    assert.equal(slotState.disabled, false, 'fifth tray cube must be enabled');
    assert.equal(slotState.toolId, 'efr-code-editor', 'fifth tray cube must belong to EFR');
    assert.match(slotState.label || '', /EFR Code Editor/i, 'fifth tray cube must expose the EFR label');
    assert(slotState.width > 0 && slotState.height > 0, 'fifth tray cube must have a clickable box');

    // Physical pointer interaction only: no direct call to the editor open API.
    await page.mouse.click(slotState.x, slotState.y);

    await page.waitForFunction(() => {
      const modal = document.getElementById('hashcodEfrEditorModal');
      if (!modal) return false;
      const style = getComputedStyle(modal);
      return Boolean(modal.open) && !modal.hidden && modal.getAttribute('aria-hidden') === 'false' && style.display !== 'none';
    }, { timeout: 10000 });

    const runtime = await page.evaluate(() => window.HashcodEfrCodeEditor.diagnostics());
    assert.equal(runtime.ready, true, 'EFR runtime must be ready');
    assert.equal(runtime.buttonFound, true, 'EFR runtime must find the fifth cube');
    assert.equal(runtime.buttonDisabled, false, 'EFR runtime must report the fifth cube enabled');
    assert.equal(runtime.toolId, 'efr-code-editor', 'EFR runtime must own slot 4');
    assert.equal(runtime.modalOpen, true, 'EFR editor must be open after physical click');

    await page.fill('#hashcodEfrEditorTextarea', 'function browserVerifiedEFR() {\n  return "works";\n}');
    await page.fill('#hashcodEfrEditorFilename', 'browser-verified');

    const downloadPromise = page.waitForEvent('download', { timeout: 10000 });
    await page.click('#hashcodEfrDownload');
    const download = await downloadPromise;
    assert.equal(download.suggestedFilename(), 'browser-verified.efr', 'download must use .efr');

    console.log('PASS: physical Chromium click on the fifth tray cube opens EFR and downloads browser-verified.efr.');
  } finally {
    await browser.close();
  }
}

Promise.race([
  run(),
  new Promise((_, reject) => setTimeout(() => reject(new Error('EFR browser verification exceeded 45 seconds')), 45000))
]).then(() => process.exit(0)).catch((error) => {
  console.error(error && error.stack || error);
  process.exit(1);
});
