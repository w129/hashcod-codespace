'use strict';

const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const target = process.env.REGISTRATION_SEQUENCE_URL || 'http://127.0.0.1:8099/laragon-local-entry.php';

async function completeEntryThroughAnimation(page) {
  await page.waitForFunction(() => document.documentElement.dataset.hashcodEntryGateReady === 'true', { timeout: 20000 });

  const initialButton = page.locator('#bootCliEnter, #hashcodEntryForceButton').first();
  await initialButton.waitFor({ state: 'visible', timeout: 20000 });
  await initialButton.click({ timeout: 20000 });

  const alreadyEntered = await page.evaluate(() => document.documentElement.dataset.hashcodPlatformEntered === 'true');
  if (!alreadyEntered) {
    const continueButton = page.locator('#hashcodHoldContinue').first();
    await continueButton.waitFor({ state: 'visible', timeout: 20000 });
    await continueButton.click({ timeout: 20000 });
  }

  await page.waitForFunction(() => document.documentElement.dataset.hashcodPlatformEntered === 'true', { timeout: 30000 });
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  try {
    const response = await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 20000 });
    assert(response && response.status() === 200, 'local UI must return HTTP 200');

    await completeEntryThroughAnimation(page);

    const state = await page.evaluate(() => ({
      entered: document.documentElement.dataset.hashcodPlatformEntered || '',
      direct: document.documentElement.dataset.hashcodDirectRegistration || '',
      final: document.documentElement.dataset.hashcodFinalEntryScreen || '',
      directRegistration: Boolean(document.getElementById('hashcodDirectRegistration')),
      platformRegistration: Boolean(document.getElementById('hashcodPlatformRegistration')),
      colorPicker: Boolean(document.getElementById('hashcodHeroUIColorPicker')),
      fields: document.querySelectorAll('#hcName,#hcAge,#hcCedula,#hcPlatform,#hcEmail,#hcPhone,#hashcodRegAge,#hashcodRegCedula').length
    }));

    assert.equal(state.entered, 'true', 'entry button must proceed to Codespace after the preserved entry animation');
    assert.equal(state.direct, '', 'direct registration marker must be cleared after entry');
    assert.equal(state.final, '', 'final registration screen marker must be cleared after entry');
    assert.equal(state.directRegistration, false, 'direct registration background overlay must be removed after entry');
    assert.equal(state.platformRegistration, false, 'legacy platform registration form must not exist');
    assert.equal(state.colorPicker, false, 'registration ColorPicker must not exist after retiring the form');
    assert.equal(state.fields, 0, 'registration fields must not be present');

    console.log('PASS: preserved entry animation opens Codespace without rendering the retired registration form.');
  } finally {
    await browser.close();
  }
}

run().then(() => process.exit(0)).catch((error) => {
  console.error(error && error.stack || error);
  process.exit(1);
});
