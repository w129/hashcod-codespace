'use strict';

const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const target = process.env.REGISTRATION_SEQUENCE_URL || 'http://127.0.0.1:8099/laragon-local-entry.php';

async function openRegistration(page) {
  await page.waitForFunction(() => document.documentElement.dataset.hashcodEntryGateReady === 'true', { timeout: 20000 });
  await page.locator('#bootCliEnter, #hashcodEntryForceButton').first().click({ timeout: 20000 });
  await page.locator('#hashcodHoldContinue').first().waitFor({ state: 'visible', timeout: 20000 });
  await page.locator('#hashcodHoldContinue').first().click({ timeout: 20000 });
  await page.locator('#hashcodPlatformRegistration #hashcodRegistrationForm').waitFor({ state: 'visible', timeout: 30000 });
}

async function completeRegistration(page) {
  const idNumber = ['000', '0000000', '0'].join('-');
  const mail = ['registro', 'example.com'].join('@');
  const phone = ['809', '000', '0000'].join('-');

  await page.fill('#hashcodRegFullName', ['Demo', 'Tester'].join(' '));
  await page.fill('#hashcodRegAge', ['01', '01', '2000'].join('/'));
  await page.fill('#hashcodRegCedula', idNumber);
  await page.fill('#hashcodRegPlatformName', 'Hashcod Codespace');
  await page.setInputFiles('#hashcodRegCodeFile', {
    name: 'platform.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('registration test file')
  });
  await page.fill('#hashcodRegEmail', mail);
  await page.fill('#hashcodRegPhone', phone);
  await page.check('#hashcodRegistrationConsent');
  await page.click('#hashcodRegistrationSubmit');
  await page.locator('#hashcodRegistrationCodeReceipt.is-open').waitFor({ state: 'visible', timeout: 20000 });
  const code = await page.textContent('#hashcodRegistrationPrivateCode');
  assert.ok(code && code.startsWith('HC-'), 'private registration code must be generated');
  await page.click('#hashcodRegistrationContinueAfterCode');
  await page.waitForFunction(() => document.documentElement.dataset.hashcodPlatformEntered === 'true', { timeout: 30000 });
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  try {
    const response = await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 20000 });
    assert(response && response.status() === 200, 'local UI must return HTTP 200');

    await openRegistration(page);

    const formState = await page.evaluate(() => ({
      restored: Boolean(window.HashcodPlatformRegistration && window.HashcodPlatformRegistration.registrationRestored === true),
      retired: Boolean(window.HashcodPlatformRegistration && window.HashcodPlatformRegistration.registrationRetired === true),
      form: Boolean(document.getElementById('hashcodRegistrationForm')),
      fields: document.querySelectorAll('#hashcodRegFullName,#hashcodRegAge,#hashcodRegCedula,#hashcodRegPlatformName,#hashcodRegCodeFile,#hashcodRegEmail,#hashcodRegPhone').length,
      pixelBackground: Boolean(document.querySelector('#hashcodPlatformRegistration .hc-pixel-bg'))
    }));

    assert.equal(formState.restored, true, 'registration API must be restored');
    assert.equal(formState.retired, false, 'registration API must not be retired');
    assert.equal(formState.form, true, 'registration form must be visible');
    assert.equal(formState.fields, 7, 'all registration fields must exist');
    assert.equal(formState.pixelBackground, true, 'represented pixel icons must exist in the background');

    await completeRegistration(page);

    const finalState = await page.evaluate(() => ({
      entered: document.documentElement.dataset.hashcodPlatformEntered || '',
      final: document.documentElement.dataset.hashcodFinalEntryScreen || '',
      form: Boolean(document.getElementById('hashcodPlatformRegistration'))
    }));

    assert.equal(finalState.entered, 'true', 'successful form submission must enter Codespace');
    assert.equal(finalState.final, '', 'final registration marker must be cleared after entry');
    assert.equal(finalState.form, false, 'registration form must be removed after entry');

    console.log('PASS: restored registration form validates, generates code, and opens Codespace.');
  } finally {
    await browser.close();
  }
}

run().then(() => process.exit(0)).catch((error) => {
  console.error(error && error.stack || error);
  process.exit(1);
});
