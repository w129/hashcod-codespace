'use strict';

const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const target = process.env.TEMPORARY_ACCESS_URL
  || process.env.REGISTRATION_SEQUENCE_URL
  || 'http://127.0.0.1:8099/laragon-local-entry.php';

async function openRegistration(page) {
  await page.waitForFunction(() => document.documentElement.dataset.hashcodEntryGateReady === 'true', { timeout: 20000 });
  await page.locator('#bootCliEnter, #hashcodEntryForceButton').first().click({ timeout: 20000 });
  await page.locator('#hashcodHoldContinue').first().waitFor({ state: 'visible', timeout: 20000 });
  await page.locator('#hashcodHoldContinue').first().click({ timeout: 20000 });
  await page.locator('#hashcodPlatformRegistration #hashcodRegistrationForm').waitFor({ state: 'visible', timeout: 30000 });
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  try {
    const response = await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 20000 });
    assert(response && response.status() === 200, 'local UI must return HTTP 200');

    await openRegistration(page);
    await page.click('#hashcodTemporaryAccessButton');

    const state = await page.evaluate(() => ({
      entered: document.documentElement.dataset.hashcodPlatformEntered || '',
      form: Boolean(document.getElementById('hashcodRegistrationForm')),
      root: Boolean(document.getElementById('hashcodPlatformRegistration')),
      status: document.getElementById('hashcodRegistrationStatus')?.textContent || '',
      temporaryDialog: Boolean(document.getElementById('hashcodTemporaryAccessDialog'))
    }));

    assert.equal(state.entered, '', 'temporary button must not bypass the restored form');
    assert.equal(state.form, true, 'registration form must remain visible');
    assert.equal(state.root, true, 'registration root must remain mounted');
    assert.match(state.status, /Completa el registro/i, 'temporary button must explain that registration is required');
    assert.equal(state.temporaryDialog, false, 'temporary access dialog must not render over the restored form');

    console.log('PASS: temporary access does not bypass or freeze the restored registration form.');
  } finally {
    await browser.close();
  }
}

run().then(() => process.exit(0)).catch((error) => {
  console.error(error && error.stack || error);
  process.exit(1);
});
