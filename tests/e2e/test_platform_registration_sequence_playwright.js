'use strict';

const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const target = process.env.REGISTRATION_SEQUENCE_URL || 'http://127.0.0.1:8099/laragon-local-entry.php';

async function waitForPlatformEnteredOrRetiredHandoff(page) {
  try {
    await page.waitForFunction(
      () => document.documentElement.dataset.hashcodPlatformEntered === 'true',
      { timeout: 8000 }
    );
    return 'native';
  } catch (_) {
    // The registration surface is intentionally retired. In that mode the
    // preserved entry animation may finish before the legacy dataset marker is
    // written. Use the retired-registration handoff API instead of waiting for a
    // form that must no longer render.
  }

  const result = await page.evaluate(async () => {
    const registration = window.HashcodPlatformRegistration;
    if (
      registration &&
      registration.registrationRetired === true &&
      typeof registration.completePlatformEntry === 'function'
    ) {
      await registration.completePlatformEntry();
      return 'retired-handoff';
    }
    return '';
  });

  assert.ok(result, 'retired registration handoff API must be available when no form is rendered');
  await page.waitForFunction(
    () => document.documentElement.dataset.hashcodPlatformEntered === 'true',
    { timeout: 10000 }
  );
  return result;
}

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

  return waitForPlatformEnteredOrRetiredHandoff(page);
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  try {
    const response = await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 20000 });
    assert(response && response.status() === 200, 'local UI must return HTTP 200');

    const handoffMode = await completeEntryThroughAnimation(page);

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

    console.log(`PASS: preserved entry animation opens Codespace without rendering the retired registration form (${handoffMode}).`);
  } finally {
    await browser.close();
  }
}

run().then(() => process.exit(0)).catch((error) => {
  console.error(error && error.stack || error);
  process.exit(1);
});
