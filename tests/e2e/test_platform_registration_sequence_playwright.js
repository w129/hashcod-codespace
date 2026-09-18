'use strict';

const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const target = process.env.REGISTRATION_SEQUENCE_URL || 'http://127.0.0.1:8099/laragon-local-entry.php';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1852, height: 927 } });

  page.on('console', msg => {
    if (msg.type() === 'error') console.error('[browser console]', msg.text());
  });
  page.on('pageerror', error => console.error('[pageerror]', error.message));
  page.on('requestfailed', request => console.error('[requestfailed]', request.url(), request.failure()?.errorText || ''));

  // The sequence test is about the UI gate, not the external database. Return a
  // successful registration response so Chromium can prove the transition order.
  await page.route('**/api/platform-registration', async route => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, id: '00000000-0000-4000-8000-000000000001' })
      });
      return;
    }
    await route.continue();
  });

  try {
    const response = await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 20000 });
    assert(response && response.status() === 200, 'platform must load');

    await page.evaluate(() => {
      window.__registrationEntryEvents = 0;
      window.addEventListener('hashcod:platform-entered', () => {
        window.__registrationEntryEvents += 1;
      });
    });

    // Screen 1.
    await page.waitForSelector('#bootCliEnter', { state: 'visible', timeout: 15000 });
    await page.waitForFunction(() => {
      const button = document.getElementById('bootCliEnter');
      return window.__hashcodPlatformEntryHoldReady === true
        && document.documentElement.dataset.hashcodEntryGateReady === 'true'
        && button
        && button.dataset.hashcodEntryGateVersion === '20260918-10';
    }, { timeout: 10000 });
    assert.equal(await page.locator('#hashcodPlatformRegistration').count(), 0,
      'registration must not exist in the DOM on screen 1');
    assert.notEqual(await page.getAttribute('html', 'data-hashcod-platform-entered'), 'true',
      'platform must not be entered on screen 1');

    await page.click('#bootCliEnter');

    // Screen 2.
    await page.waitForSelector('#hashcodHoldContinue', { state: 'visible', timeout: 10000 });
    assert.equal(await page.locator('#hashcodPlatformRegistration').count(), 0,
      'registration must not exist in the DOM on screen 2');

    await page.waitForFunction(() => {
      const button = document.getElementById('hashcodHoldContinue');
      return Boolean(button && button.disabled === false);
    }, { timeout: 8000 });

    await page.click('#hashcodHoldContinue');

    // Screen 3.
    await page.waitForFunction(() => {
      const node = document.getElementById('hashcodPlatformRegistration');
      if (!node) return false;
      const style = getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      return document.documentElement.dataset.hashcodFinalEntryScreen === 'true'
        && style.display !== 'none'
        && style.visibility === 'visible'
        && Number(style.opacity) > 0.9
        && rect.width > 300
        && rect.height > 300;
    }, { timeout: 5000 });

    const state = await page.evaluate(() => {
      const root = document.getElementById('hashcodPlatformRegistration');
      const rect = root.getBoundingClientRect();
      const style = getComputedStyle(root);
      return {
        marker: document.documentElement.dataset.hashcodFinalEntryScreen || '',
        entered: document.documentElement.dataset.hashcodPlatformEntered || '',
        display: style.display,
        visibility: style.visibility,
        opacity: style.opacity,
        width: rect.width,
        height: rect.height,
        viewportWidth: innerWidth,
        viewportHeight: innerHeight,
        screen: root.dataset.hashcodScreen || '',
        fields: [
          'hashcodRegFullName',
          'hashcodRegAge',
          'hashcodRegCedula',
          'hashcodRegPlatform',
          'hashcodRegEmail',
          'hashcodRegPhone'
        ].filter(id => document.getElementById(id)).length,
        submit: Boolean(document.getElementById('hashcodRegistrationSubmit')),
        tableButton: Boolean(document.getElementById('hashcodRegistrationTableButton')),
        entryEvents: window.__registrationEntryEvents
      };
    });

    assert.equal(state.marker, 'true');
    assert.equal(state.entered, '', 'screen 3 must still block platform entry');
    assert.equal(state.entryEvents, 0, 'platform-entered must not fire before registration is saved');
    assert.equal(state.visibility, 'visible');
    assert(Number(state.opacity) > 0.9);
    assert(state.width >= state.viewportWidth * 0.98,
      'screen 3 registration must occupy the viewport width');
    assert(state.height >= state.viewportHeight * 0.98,
      'screen 3 registration must occupy the viewport height');
    assert.equal(state.screen, '3', 'registration root must be explicitly identified as screen 3');
    assert.equal(state.fields, 6, 'all six requested fields must be present');
    assert.equal(state.submit, true, 'submit button missing');
    assert.equal(state.tableButton, true, 'records icon button missing');

    // Under 18 must remain blocked.
    await page.evaluate(() => {
      const set = (id, value) => {
        const input = document.getElementById(id);
        if (!input) throw new Error('missing field ' + id);
        input.value = value;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      };
      set('hashcodRegFullName', 'Usuario De Prueba');
      set('hashcodRegAge', '17');
      set('hashcodRegCedula', '001-1234567-8');
      set('hashcodRegPlatform', 'Hashcod Test');
      set('hashcodRegEmail', 'test@example.com');
      set('hashcodRegPhone', '+1 809 555 0100');
      const consent = document.getElementById('hashcodRegConsent');
      consent.checked = true;
      consent.dispatchEvent(new Event('change', { bubbles: true }));
    });

    assert.equal(await page.locator('#hashcodRegistrationSubmit').isDisabled(), true,
      'under-18 registration must keep submit disabled');
    assert.notEqual(await page.getAttribute('html', 'data-hashcod-platform-entered'), 'true',
      'under-18 user must not enter');

    // Valid adult registration releases the gate only after the POST succeeds.
    await page.evaluate(() => {
      const age = document.getElementById('hashcodRegAge');
      age.value = '18';
      age.dispatchEvent(new Event('input', { bubbles: true }));
      age.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await page.waitForFunction(() => {
      const button = document.getElementById('hashcodRegistrationSubmit');
      return Boolean(button && button.disabled === false);
    }, { timeout: 3000 });

    await page.evaluate(() => {
      document.getElementById('hashcodRegistrationForm').requestSubmit();
    });

    await page.waitForFunction(() => (
      document.documentElement.dataset.hashcodPlatformEntered === 'true'
      && !document.getElementById('hashcodPlatformRegistration')
      && !document.documentElement.hasAttribute('data-hashcod-final-entry-screen')
      && window.__registrationEntryEvents === 1
    ), { timeout: 5000 });

    console.log('PASS: screen 3 blocks entry, rejects under-18, saves adult registration, then enters platform.');
  } finally {
    await browser.close();
  }
}

Promise.race([
  run(),
  new Promise((_, reject) => setTimeout(() => reject(new Error('registration sequence browser test exceeded 90 seconds')), 90000))
]).then(() => process.exit(0)).catch(error => {
  console.error(error && error.stack || error);
  process.exit(1);
});
