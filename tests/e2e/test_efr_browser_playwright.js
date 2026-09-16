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
      typeof window.HashcodEfrCodeEditor.repair === 'function' &&
      window.HashcodEftNotebookModel &&
      window.HashcodEftCodeKeyGate &&
      typeof window.HashcodEftCodeKeyGate.sync === 'function'
    ), { timeout: 15000 });

    await page.evaluate(() => {
      window.HashcodVectorTray.mount();
      window.HashcodEfrCodeEditor.repair();
      document.documentElement.dataset.adminAuthenticated = 'false';
      window.dispatchEvent(new CustomEvent('hashcod:admin-auth', { detail: { authenticated: false } }));
      window.HashcodEftCodeKeyGate.sync();
    });

    const slotSelector = '#hashcodVectorTray [data-vector-tray-slot="4"]';
    await page.waitForSelector(slotSelector, { state: 'visible', timeout: 10000 });
    await page.waitForSelector('#hashcodEftCodeKeyGate', { state: 'visible', timeout: 10000 });

    let gateState = await page.evaluate(() => window.HashcodEftCodeKeyGate.diagnostics());
    assert.equal(gateState.unlocked, false, 'EFT must start locked without a CodeKey session');
    assert.equal(gateState.trayFound, true, 'CodeKey gate must find the fifth tray cube');
    assert.equal(gateState.trayLocked, true, 'fifth tray cube must be marked CodeKey locked');
    assert.equal(gateState.gateVisible, true, 'CodeKey gate must physically cover the EFT cube');
    assert.equal(gateState.modalOpen, false, 'EFT modal must remain closed while CodeKey is locked');

    const gateRect = await page.$eval('#hashcodEftCodeKeyGate', (gate) => {
      const rect = gate.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, width: rect.width, height: rect.height };
    });
    assert(gateRect.width > 0 && gateRect.height > 0, 'locked CodeKey gate must have a physical click target');

    const chooserPromise = page.waitForEvent('filechooser', { timeout: 10000 });
    await page.mouse.click(gateRect.x, gateRect.y);
    const chooser = await chooserPromise;
    await chooser.setFiles([]);
    await page.waitForTimeout(900);

    gateState = await page.evaluate(() => window.HashcodEftCodeKeyGate.diagnostics());
    assert.equal(gateState.unlocked, false, 'cancelling CodeKey selection must keep EFT locked');
    assert.equal(gateState.modalOpen, false, 'cancelling CodeKey selection must never open EFT');

    await page.evaluate(() => {
      document.documentElement.dataset.adminAuthenticated = 'true';
      window.dispatchEvent(new CustomEvent('hashcod:admin-auth', { detail: { authenticated: true } }));
      window.HashcodEftCodeKeyGate.sync();
    });
    await page.waitForFunction(() => {
      const state = window.HashcodEftCodeKeyGate.diagnostics();
      return state.unlocked && !state.gateVisible;
    }, { timeout: 5000 });

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

    assert.equal(slotState.disabled, false, 'fifth tray cube must be enabled after CodeKey unlock');
    assert.equal(slotState.toolId, 'efr-code-editor', 'fifth tray cube must keep stable internal tool id');
    assert.match(slotState.label || '', /EFT CoffeeScript Algorithm Notebook/i, 'fifth tray cube must expose EFT algorithm label');
    assert(slotState.width > 0 && slotState.height > 0, 'unlocked fifth tray cube must have a clickable box');

    await page.mouse.click(slotState.x, slotState.y);

    await page.waitForFunction(() => {
      const modal = document.getElementById('hashcodEfrEditorModal');
      if (!modal) return false;
      const style = getComputedStyle(modal);
      return Boolean(modal.open) && !modal.hidden && modal.getAttribute('aria-hidden') === 'false' && style.display !== 'none';
    }, { timeout: 10000 });

    let runtime = await page.evaluate(() => window.HashcodEfrCodeEditor.diagnostics());
    assert.equal(runtime.ready, true);
    assert.equal(runtime.buttonFound, true);
    assert.equal(runtime.buttonDisabled, false);
    assert.equal(runtime.toolId, 'efr-code-editor');
    assert.equal(runtime.modalOpen, true);
    assert.equal(runtime.format, 'HASHCOD-EFT-1');
    assert.equal(runtime.language, 'coffeescript');
    assert.equal(runtime.container, 'ipynb');
    assert.equal(runtime.algorithmProfile, 'THEALGORITHMS-JUPYTER-1');
    assert.equal(runtime.model.modelVersion, 3);
    assert.equal(runtime.model.nbformat, 4);
    assert.equal(runtime.model.nbformatMinor, 5);

    await page.click('#hashcodEfrNew');

    runtime = await page.evaluate(() => window.HashcodEfrCodeEditor.diagnostics());
    assert.equal(runtime.model.cellCount, 3, 'New Algorithm must create definition, implementation, and demo cells');
    assert.equal(runtime.model.algorithm.score, 4, 'algorithm template must satisfy all four structural requirements');
    assert.equal(runtime.model.algorithm.complete, true, 'algorithm template must be complete');

    const templateNotebook = await page.evaluate(() => window.HashcodEfrCodeEditor.model.toJSON());
    assert.equal(templateNotebook.metadata.hashcod.algorithm_profile, 'THEALGORITHMS-JUPYTER-1');
    assert.equal(templateNotebook.metadata.hashcod.algorithm_reference, 'https://github.com/TheAlgorithms/Jupyter');
    assert.deepEqual(templateNotebook.metadata.hashcod.algorithm_requirements, [
      'commented_source',
      'readable_naming',
      'math_explanation',
      'notebook_demo'
    ]);
    assert.equal(templateNotebook.cells.length, 3);
    assert.deepEqual(templateNotebook.cells.map((cell) => cell.metadata.algorithm_role), [
      'definition',
      'implementation',
      'demo'
    ]);
    templateNotebook.cells.forEach((cell) => {
      assert.match(cell.id, /^[A-Za-z0-9_-]{1,64}$/);
      assert.equal(cell.cell_type, 'code');
      assert.equal(cell.execution_count, null);
      assert.deepEqual(cell.outputs, []);
      assert.equal(cell.metadata.language, 'coffeescript');
      assert.equal(cell.metadata.eft_source, true);
      assert.equal(cell.metadata.trusted, false);
    });

    await page.fill('#hashcodEfrEditorFilename', 'algorithm-verified');
    const implementation = [
      '# ALGORITHM',
      '# Name: Double Value',
      '# Purpose: Double a numeric input.',
      '# Math: output = input * 2',
      '# Input: Number',
      '# Output: Number',
      '',
      '# %% [EFT CELL]',
      '',
      '# IMPLEMENTATION',
      '# Multiply the readable input value by two.',
      'doubleValue = (inputValue) ->',
      '  resultValue = inputValue * 2',
      '  resultValue',
      '',
      '# %% [EFT CELL]',
      '',
      '# DEMO',
      'exampleInput = 5',
      'exampleOutput = doubleValue exampleInput',
      'console.log exampleOutput'
    ].join('\n');
    await page.fill('#hashcodEfrEditorTextarea', implementation);
    await page.click('#hashcodEfrCheck');

    const report = await page.evaluate(() => window.HashcodEfrCodeEditor.checkAlgorithm());
    assert.equal(report.score, 4);
    assert.equal(report.complete, true);
    assert.deepEqual(report.missing, []);

    const downloadPromise = page.waitForEvent('download', { timeout: 10000 });
    await page.click('#hashcodEfrDownload');
    const download = await downloadPromise;
    assert.equal(download.suggestedFilename(), 'algorithm-verified.eft', 'download must use .eft');

    const payload = await readDownload(download);
    const eft = JSON.parse(payload);
    assert.equal(eft.eft_format, 'HASHCOD-EFT-1');
    assert.equal(eft.nbformat, 4);
    assert.equal(eft.nbformat_minor, 5);
    assert.equal(eft.metadata.language_info.name, 'coffeescript');
    assert.equal(eft.metadata.language_info.codemirror_mode, 'coffeescript');
    assert.equal(eft.metadata.hashcod.container, 'Jupyter Notebook');
    assert.equal(eft.metadata.hashcod.model_version, 3);
    assert.equal(eft.metadata.hashcod.execution_policy, 'disabled');
    assert.equal(eft.metadata.hashcod.algorithm_profile, 'THEALGORITHMS-JUPYTER-1');
    assert.equal(eft.metadata.hashcod.algorithm_validation.complete, true);
    assert.equal(eft.metadata.hashcod.algorithm_validation.score, 4);
    assert.equal(eft.cells.length, 3);
    assert.match(eft.cells[0].source.join(''), /# Math: output = input \* 2/);
    assert.match(eft.cells[1].source.join(''), /doubleValue = \(inputValue\) ->/);
    assert.match(eft.cells[2].source.join(''), /# DEMO/);

    runtime = await page.evaluate(() => window.HashcodEfrCodeEditor.diagnostics());
    assert.equal(runtime.model.dirty, false, 'successful download must mark the notebook clean');

    const normalized = await page.evaluate(() => {
      const Model = window.HashcodEftNotebookModel;
      const model = new Model();
      model.fromJSON({
        nbformat: 4,
        nbformat_minor: 4,
        metadata: { language_info: { name: 'coffeescript' } },
        cells: []
      }, { markClean: true });
      return model.toJSON();
    });
    assert.equal(normalized.nbformat_minor, 5, 'older nbformat 4.x notebooks must be normalized to minor 5');
    assert.equal(normalized.cells.length, 1, 'empty imported notebooks must still receive one code cell');
    assert.match(normalized.cells[0].id, /^[A-Za-z0-9_-]{1,64}$/);
    assert.equal(normalized.metadata.hashcod.algorithm_profile, 'THEALGORITHMS-JUPYTER-1');

    await page.evaluate(() => {
      document.documentElement.dataset.adminAuthenticated = 'false';
      window.dispatchEvent(new CustomEvent('hashcod:admin-auth', { detail: { authenticated: false } }));
      window.HashcodEftCodeKeyGate.sync();
    });
    await page.waitForFunction(() => {
      const gate = window.HashcodEftCodeKeyGate.diagnostics();
      return !gate.unlocked && gate.gateVisible && !gate.modalOpen;
    }, { timeout: 5000 });

    gateState = await page.evaluate(() => window.HashcodEftCodeKeyGate.diagnostics());
    assert.equal(gateState.unlocked, false, 'CodeKey expiration must relock EFT');
    assert.equal(gateState.modalOpen, false, 'CodeKey expiration must close an open EFT editor');
    assert.equal(gateState.gateVisible, true, 'CodeKey expiration must restore the physical gate');

    console.log('PASS: EFT is physically blocked until CodeKey unlock, runs the TheAlgorithms/Jupyter CoffeeScript/IPYNB flow only while authenticated, and relocks when the session expires.');
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
