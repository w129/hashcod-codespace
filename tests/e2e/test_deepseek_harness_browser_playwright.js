'use strict';

const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const target = process.env.DSH_TEST_URL || 'http://127.0.0.1:8099/laragon-local-entry.php';

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
    assert(response, 'browser did not receive the local Hashcod page');
    assert.equal(response.status(), 200, 'local Hashcod UI must return HTTP 200');

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
      window.HashcodDeepSeekHarness &&
      typeof window.HashcodDeepSeekHarness.diagnostics === 'function'
    ), { timeout: 15000 });

    await page.evaluate(() => window.HashcodVectorTray.mount());

    const slotSelector = '#hashcodVectorTray [data-vector-tray-slot="5"]';
    await page.waitForSelector(slotSelector, { state: 'visible', timeout: 10000 });

    const slot = await page.$eval(slotSelector, (button) => {
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

    assert.equal(slot.disabled, false, 'sixth tray cube must be enabled');
    assert.equal(slot.toolId, 'deepseek-harness', 'sixth tray cube must own the DeepSeek Harness tool id');
    assert.match(slot.label || '', /DeepSeek Harness/i, 'sixth tray cube must expose the DeepSeek Harness label');
    assert(slot.width > 0 && slot.height > 0, 'sixth tray cube must have a physical click target');

    await page.mouse.click(slot.x, slot.y);

    await page.waitForFunction(() => {
      const modal = document.getElementById('hashcodDeepSeekHarnessModal');
      if (!modal) return false;
      const style = getComputedStyle(modal);
      return Boolean(modal.open) && !modal.hidden && style.display !== 'none';
    }, { timeout: 10000 });

    await page.evaluate(() => {
      localStorage.setItem('hashcod_dsh_port_v1', '3087');
      window.__HASHCOD_DSH_READY__ = true;
      window.__HASHCOD_DSH_ERROR__ = '';
      window.dispatchEvent(new CustomEvent('hashcod:dsh-status', { detail: { ready: true, error: '' } }));
    });

    const diagnostics = await page.evaluate(() => window.HashcodDeepSeekHarness.diagnostics());
    assert.equal(diagnostics.ready, true);
    assert.equal(diagnostics.toolId, 'deepseek-harness');
    assert.equal(diagnostics.slot, 5);
    assert.equal(diagnostics.buttonFound, true);
    assert.equal(diagnostics.buttonToolId, 'deepseek-harness');
    assert.equal(diagnostics.modalOpen, true);
    assert.equal(diagnostics.host, '127.0.0.1');
    assert.equal(diagnostics.hostLocked, true);
    assert.equal(diagnostics.runtimeUrl, 'http://127.0.0.1:3080');
    assert.equal(diagnostics.managedByDesktop, true);
    assert.equal(diagnostics.managedPort, 3080);
    assert.equal(diagnostics.profile, 'HASHCOD-DSH-1');

    const portInput = await page.$eval('#hashcodDeepSeekHarnessPort', (input) => ({
      value: input.value,
      disabled: input.disabled
    }));
    assert.equal(portInput.value, '3080', 'desktop-managed runtime must override stale browser port 3087');
    assert.equal(portInput.disabled, true, 'desktop-managed runtime port must not be editable');

    await page.waitForSelector('#hashcodDeepSeekHarnessCommand', { state: 'visible' });
    const command = await page.textContent('#hashcodDeepSeekHarnessCommand');
    assert.match(command || '', /node local-app\/deepseek-harness-launcher\.mjs --port 3080/);

    await page.click('#hashcodDeepSeekHarnessClose');
    await page.waitForFunction(() => {
      const modal = document.getElementById('hashcodDeepSeekHarnessModal');
      return modal && (!modal.open || modal.hidden);
    }, { timeout: 5000 });

    console.log('PASS: physical sixth-cube click keeps the desktop-managed DeepSeek Harness on 127.0.0.1:3080 even with stale port state.');
  } finally {
    await browser.close();
  }
}

Promise.race([
  run(),
  new Promise((_, reject) => setTimeout(() => reject(new Error('DeepSeek Harness browser verification exceeded 35 seconds')), 35000))
]).then(() => process.exit(0)).catch((error) => {
  console.error(error && error.stack || error);
  process.exit(1);
});