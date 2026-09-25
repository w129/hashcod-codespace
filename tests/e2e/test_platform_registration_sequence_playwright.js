'use strict';

const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const target = process.env.REGISTRATION_SEQUENCE_URL || 'http://127.0.0.1:8099/laragon-local-entry.php';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  try {
    const response = await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 15000 });
    assert(response && response.status() === 200, 'local UI must return HTTP 200');

    await page.waitForFunction(() => document.documentElement.dataset.hashcodEntryGateReady === 'true', { timeout: 15000 });

    const buttonSelector = '#hashcodHoldContinue, #hashcodEntryForceButton, #bootCliEnter';
    await page.waitForSelector(buttonSelector, { state: 'attached', timeout: 15000 });
    await page.click(buttonSelector, { timeout: 15000 });

    await page.waitForFunction(() => document.documentElement.dataset.hashcodPlatformEntered === 'true', { timeout: 10000 });

    const state = await page.evaluate(() => ({
      entered: document.documentElement.dataset.hashcodPlatformEntered || '',
      direct: document.documentElement.dataset.hashcodDirectRegistration || '',
      final: document.documentElement.dataset.hashcodFinalEntryScreen || '',
      directRegistration: Boolean(document.getElementById('hashcodDirectRegistration')),
      platformRegistration: Boolean(document.getElementById('hashcodPlatformRegistration')),
      colorPicker: Boolean(document.getElementById('hashcodHeroUIColorPicker')),
      fields: document.querySelectorAll('#hcName,#hcAge,#hcCedula,#hcPlatform,#hcEmail,#hcPhone,#hashcodRegAge,#hashcodRegCedula').length
    }));

    assert.equal(state.entered, 'true', 'entry button must proceed directly to Codespace');
    assert.equal(state.direct, '', 'direct registration marker must be cleared after entry');
    assert.equal(state.final, '', 'final registration screen marker must be cleared after entry');
    assert.equal(state.directRegistration, false, 'direct registration background overlay must be removed after entry');
    assert.equal(state.platformRegistration, false, 'legacy platform registration form must not exist');
    assert.equal(state.colorPicker, false, 'registration ColorPicker must not exist after retiring the form');
    assert.equal(state.fields, 0, 'registration fields must not be present');

    console.log('PASS: entry skips the retired registration form and opens Codespace directly.');
  } finally {
    await browser.close();
  }
}

run().then(() => process.exit(0)).catch((error) => {
  console.error(error && error.stack || error);
  process.exit(1);
});
