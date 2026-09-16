'use strict';

const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const target = process.env.EFR_TEST_URL || 'http://127.0.0.1:8099/laragon-local-entry.php';

async function readDownload(download) {
  const stream = await download.createReadStream();
  let text = '';
  for await (const chunk of stream) text += chunk.toString('utf8');
  return text;
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });

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
      window.HashcodEfrCodeEditor &&
      typeof window.HashcodEfrCodeEditor.repair === 'function'
    ), { timeout: 15000 });

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
    assert.equal(slotState.toolId, 'efr-code-editor', 'fifth tray cube must keep stable internal tool id');
    assert.match(slotState.label || '', /EFT CoffeeScript Notebook/i, 'fifth tray cube must expose EFT CoffeeScript label');
    assert(slotState.width > 0 && slotState.height > 0, 'fifth tray cube must have a clickable box');

    await page.mouse.click(slotState.x, slotState.y);

    await page.waitForFunction(() => {
      const modal = document.getElementById('hashcodEfrEditorModal');
      if (!modal) return false;
      const style = getComputedStyle(modal);
      return Boolean(modal.open) && !modal.hidden && modal.getAttribute('aria-hidden') === 'false' && style.display !== 'none';
    }, { timeout: 10000 });

    const runtime = await page.evaluate(() => window.HashcodEfrCodeEditor.diagnostics());
    assert.equal(runtime.ready, true, 'EFT runtime must be ready');
    assert.equal(runtime.buttonFound, true, 'EFT runtime must find the fifth cube');
    assert.equal(runtime.buttonDisabled, false, 'EFT runtime must report the fifth cube enabled');
    assert.equal(runtime.toolId, 'efr-code-editor', 'EFT runtime must own slot 4');
    assert.equal(runtime.modalOpen, true, 'EFT editor must be open after physical click');
    assert.equal(runtime.format, 'HASHCOD-EFT-1', 'runtime must report HASHCOD-EFT-1');
    assert.equal(runtime.language, 'coffeescript', 'runtime must report CoffeeScript');
    assert.equal(runtime.container, 'ipynb', 'runtime must report IPYNB container');

    const coffee = [
      'square = (x) -> x * x',
      'console.log square 5',
      '',
      '# %% [EFT CELL]',
      '',
      'greet = (name) -> "Hello #{name}"'
    ].join('\n');

    await page.fill('#hashcodEfrEditorTextarea', coffee);
    await page.fill('#hashcodEfrEditorFilename', 'browser-verified');

    const downloadPromise = page.waitForEvent('download', { timeout: 10000 });
    await page.click('#hashcodEfrDownload');
    const download = await downloadPromise;
    assert.equal(download.suggestedFilename(), 'browser-verified.eft', 'download must use .eft');

    const payload = await readDownload(download);
    const eft = JSON.parse(payload);
    assert.equal(eft.eft_format, 'HASHCOD-EFT-1');
    assert.equal(eft.nbformat, 4);
    assert.equal(eft.nbformat_minor, 5);
    assert.equal(eft.metadata.language_info.name, 'coffeescript');
    assert.equal(eft.metadata.hashcod.container, 'Jupyter Notebook');
    assert.equal(eft.cells.length, 2, 'cell separator must become two Jupyter code cells');
    assert.equal(eft.cells[0].cell_type, 'code');
    assert.equal(eft.cells[0].metadata.language, 'coffeescript');
    assert.equal(eft.cells[0].outputs.length, 0);
    assert.match(eft.cells[0].source.join(''), /square = \(x\) -> x \* x/);
    assert.match(eft.cells[1].source.join(''), /greet = \(name\) ->/);

    console.log('PASS: physical Chromium click opens EFT and downloads CoffeeScript source as HASHCOD-EFT-1/IPYNB nbformat 4 JSON.');
  } finally {
    await browser.close();
  }
}

Promise.race([
  run(),
  new Promise((_, reject) => setTimeout(() => reject(new Error('EFT browser verification exceeded 45 seconds')), 45000))
]).then(() => process.exit(0)).catch((error) => {
  console.error(error && error.stack || error);
  process.exit(1);
});
