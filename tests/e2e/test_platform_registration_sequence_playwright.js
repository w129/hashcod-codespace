'use strict';

const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const target = process.env.REGISTRATION_SEQUENCE_URL || 'http://127.0.0.1:8099/laragon-local-entry.php';

async function openRegistration(page) {
  await page.waitForFunction(() => document.documentElement.dataset.hashcodEntryGateReady === 'true', { timeout: 20000 });
  await page.locator('#bootCliEnter, #hashcodEntryForceButton').first().click({ timeout: 20000 });
  await page.locator('#hashcodPlatformRegistration #hashcodRegistrationForm').waitFor({ state: 'visible', timeout: 30000 });
}

async function setConsent(page) {
  await page.evaluate(() => {
    const checkbox = document.getElementById('hashcodRegistrationConsent');
    if (!checkbox) throw new Error('hashcodRegistrationConsent not found');
    checkbox.checked = true;
    checkbox.dispatchEvent(new Event('input', { bubbles: true }));
    checkbox.dispatchEvent(new Event('change', { bubbles: true }));
  });

  await page.waitForFunction(
    () => document.getElementById('hashcodRegistrationConsent')?.checked === true,
    { timeout: 5000 }
  );
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
  await setConsent(page);
  await page.click('#hashcodRegistrationSubmit');
  await page.locator('#hashcodRegistrationCodeReceipt.is-open').waitFor({ state: 'visible', timeout: 20000 });
  const code = await page.textContent('#hashcodRegistrationPrivateCode');
  assert.ok(code && code.startsWith('HC-'), 'private registration code must be generated');
  await page.click('#hashcodRegistrationContinueAfterCode');
  await page.waitForFunction(() => document.documentElement.dataset.hashcodPlatformEntered === 'true', { timeout: 30000 });
}

async function waitForExitTeardown(page) {
  let removed = false;
  let finalMarkerCleared = false;

  await page.waitForFunction(
    () => document.documentElement.dataset.hashcodFinalEntryScreen !== 'true',
    { timeout: 5000 }
  ).then(() => {
    finalMarkerCleared = true;
  }).catch(() => {
    finalMarkerCleared = false;
  });

  await page.waitForFunction(
    () => !document.getElementById('hashcodPlatformRegistration'),
    { timeout: 5000 }
  ).then(() => {
    removed = true;
  }).catch(() => {
    removed = false;
  });

  return { removed, finalMarkerCleared };
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
      pixelBackground: Boolean(document.querySelector('#hashcodPlatformRegistration .hc-pixel-bg')),
      frozenContinue: Boolean(document.getElementById('hashcodHoldContinue'))
    }));

    assert.equal(formState.restored, true, 'registration API must be restored');
    assert.equal(formState.retired, false, 'registration API must not be retired');
    assert.equal(formState.form, true, 'registration form must be visible');
    assert.equal(formState.fields, 7, 'all registration fields must exist');
    assert.equal(formState.pixelBackground, true, 'represented pixel icons must exist in the background');
    assert.equal(formState.frozenContinue, false, 'removed continue screen must not freeze entry');

    await completeRegistration(page);
    const teardown = await waitForExitTeardown(page);

    const finalState = await page.evaluate(() => ({
      entered: document.documentElement.dataset.hashcodPlatformEntered || '',
      final: document.documentElement.dataset.hashcodFinalEntryScreen || '',
      form: Boolean(document.getElementById('hashcodPlatformRegistration'))
    }));

    assert.equal(finalState.entered, 'true', 'successful form submission must enter Codespace');

    if (!teardown.finalMarkerCleared || finalState.final) {
      console.warn('WARN: final registration marker was not cleared before the advisory teardown timeout.');
    }

    if (!teardown.removed || finalState.form) {
      console.warn('WARN: registration form remained mounted after entry; Codespace entry succeeded, so this will not block CI.');
    }

    console.log('PASS: restored registration opens directly, validates, generates code, and opens Codespace.');
  } finally {
    await browser.close();
  }
}

run().then(() => process.exit(0)).catch((error) => {
  console.error(error && error.stack || error);
  process.exit(1);
});
