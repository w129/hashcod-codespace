'use strict';

const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const target = process.env.TEMPORARY_ACCESS_URL
  || process.env.REGISTRATION_SEQUENCE_URL
  || 'http://127.0.0.1:8099/';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  try {
    const response = await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 15000 });
    assert(response && response.status() === 200, 'local UI must return HTTP 200');
    await page.waitForFunction(() => document.documentElement.dataset.hashcodEntryGateReady === 'true', { timeout: 15000 });

    await page.evaluate(() => {
      const button = document.querySelector('#bootCliEnter,#hashcodEntryForceButton,#hashcodHoldContinue');
      if (!button) throw new Error('entry button not found');
      button.click();
    });

    await page.waitForFunction(() => document.documentElement.dataset.hashcodPlatformEntered === 'true', { timeout: 10000 });

    const state = await page.evaluate(() => ({
      entered: document.documentElement.dataset.hashcodPlatformEntered || '',
      temporary: document.documentElement.dataset.hashcodTemporaryAccess || '',
      dialog: Boolean(document.getElementById('hashcodTemporaryAccessDialog')),
      registration: Boolean(document.getElementById('hashcodPlatformRegistration') || document.getElementById('hashcodDirectRegistration'))
    }));

    assert.equal(state.entered, 'true', 'entry must go directly to the platform');
    assert.equal(state.temporary, '', 'temporary access flag is no longer needed after retiring the form');
    assert.equal(state.dialog, false, 'temporary access dialog must not exist after retiring the form');
    assert.equal(state.registration, false, 'registration surfaces must not exist');

    console.log('PASS: temporary access flow is retired with the platform registration form; entry opens Codespace directly.');
  } finally {
    await browser.close();
  }
}

run().then(() => process.exit(0)).catch((error) => {
  console.error(error && error.stack || error);
  process.exit(1);
});
