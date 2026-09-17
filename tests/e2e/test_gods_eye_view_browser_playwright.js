'use strict';

const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const target = process.env.GEV_TEST_URL || 'http://127.0.0.1:8099/laragon-local-entry.php';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  try {
    await page.route('**/*', async (route) => {
      const url = new URL(route.request().url());
      if (url.hostname === '127.0.0.1' || url.hostname === 'localhost') await route.continue();
      else await route.abort();
    });

    const response = await page.goto(target, { waitUntil: 'commit', timeout: 10000 });
    assert(response && response.status() === 200, 'local Hashcod UI must return HTTP 200');
    await page.waitForSelector('#authOverlay', { state: 'attached', timeout: 15000 });
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
      window.HashcodGodsEyeView &&
      typeof window.HashcodGodsEyeView.diagnostics === 'function'
    ), { timeout: 15000 });

    await page.evaluate(() => window.HashcodVectorTray.mount());
    const slotSelector = '#hashcodVectorTray [data-vector-tray-slot="5"]';
    await page.waitForSelector(slotSelector, { state: 'visible', timeout: 10000 });

    const slot = await page.$eval(slotSelector, (button) => ({
      disabled: Boolean(button.disabled),
      toolId: button.getAttribute('data-tool-id'),
      label: button.getAttribute('aria-label')
    }));
    assert.equal(slot.disabled, false);
    assert.equal(slot.toolId, 'gods-eye-view');
    assert.match(slot.label || '', /God's Eye View/i);

    const pagesBefore = page.context().pages().length;
    await page.click(slotSelector);
    await page.waitForFunction(() => {
      const modal = document.getElementById('hashcodGodsEyeView');
      return Boolean(modal && modal.open && !modal.hidden);
    }, { timeout: 10000 });
    await page.waitForSelector('#hashcodGodsEyeCanvas', { state: 'visible', timeout: 10000 });
    await page.waitForSelector('#hashcodGevSearchInput', { state: 'visible', timeout: 10000 });

    const diagnostics = await page.evaluate(() => window.HashcodGodsEyeView.diagnostics());
    assert.equal(diagnostics.ready, true);
    assert.equal(diagnostics.toolId, 'gods-eye-view');
    assert.equal(diagnostics.slot, 5);
    assert.equal(diagnostics.profile, 'HASHCOD-GEV-1');
    assert.equal(diagnostics.modalOpen, true);
    assert.equal(diagnostics.canvasFound, true);
    assert.equal(diagnostics.buttonToolId, 'gods-eye-view');
    assert.equal(diagnostics.inPlatform, true);
    assert.equal(diagnostics.externalWindowRequired, false);
    assert.equal(page.context().pages().length, pagesBefore, 'opening GEV must not create an external browser tab');

    const box = await page.locator('#hashcodGodsEyeCanvas').boundingBox();
    assert(box && box.width > 300 && box.height > 300, 'GEV canvas must occupy a real viewport');

    await page.click('[data-gev-style="nvg"]');
    await page.click('#hashcodGevReset');
    await page.click('#hashcodGevClose');
    await page.waitForFunction(() => {
      const modal = document.getElementById('hashcodGodsEyeView');
      return modal && (!modal.open || modal.hidden);
    }, { timeout: 5000 });

    console.log('PASS: sixth cube opens God\'s Eye View inside the Hashcod window with no external tab.');
  } finally {
    await browser.close();
  }
}

Promise.race([
  run(),
  new Promise((_, reject) => setTimeout(() => reject(new Error('Gods Eye View browser verification exceeded 35 seconds')), 35000))
]).then(() => process.exit(0)).catch((error) => {
  console.error(error && error.stack || error);
  process.exit(1);
});
