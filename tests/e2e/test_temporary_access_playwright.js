'use strict';

const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const target = process.env.TEMPORARY_ACCESS_URL
  || process.env.REGISTRATION_SEQUENCE_URL
  || 'http://127.0.0.1:8099/';

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
      temporary: document.documentElement.dataset.hashcodTemporaryAccess || '',
      dialog: Boolean(document.getElementById('hashcodTemporaryAccessDialog')),
      registration: Boolean(document.getElementById('hashcodPlatformRegistration') || document.getElementById('hashcodDirectRegistration'))
    }));

    assert.equal(state.entered, 'true', 'entry must go to the platform after the preserved entry animation');
    assert.equal(state.temporary, '', 'temporary access flag is no longer needed after retiring the form');
    assert.equal(state.dialog, false, 'temporary access dialog must not exist after retiring the form');
    assert.equal(state.registration, false, 'registration surfaces must not exist');

    console.log('PASS: temporary access flow is retired; preserved entry animation opens Codespace directly.');
  } finally {
    await browser.close();
  }
}

run().then(() => process.exit(0)).catch((error) => {
  console.error(error && error.stack || error);
  process.exit(1);
});
