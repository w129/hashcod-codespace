'use strict';

const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const target = process.env.TEMPORARY_ACCESS_URL
  || process.env.REGISTRATION_SEQUENCE_URL
  || 'http://127.0.0.1:8099/';

async function reachRegistrationScreen(page) {
  await page.waitForSelector('#bootCliEnter', { state: 'visible', timeout: 15000 });
  await page.waitForFunction(() => {
    const button = document.getElementById('bootCliEnter');
    return window.__hashcodPlatformEntryHoldReady === true
      && document.documentElement.dataset.hashcodEntryGateReady === 'true'
      && button
      && button.dataset.hashcodEntryGateVersion === '20260918-37';
  }, { timeout: 10000 });

  await page.click('#bootCliEnter');
  await page.waitForSelector('#hashcodHoldContinue', { state: 'visible', timeout: 10000 });
  await page.waitForFunction(() => {
    const button = document.getElementById('hashcodHoldContinue');
    return Boolean(button && button.disabled === false);
  }, { timeout: 8000 });

  await page.click('#hashcodHoldContinue');
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
  }, { timeout: 6000 });
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  page.on('console', msg => {
    if (msg.type() === 'error') console.error('[browser console]', msg.text());
  });
  page.on('pageerror', error => console.error('[pageerror]', error.message));

  try {
    const response = await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 20000 });
    assert(response && response.status() === 200, 'platform must load');

    await page.evaluate(() => {
      window.__temporaryEntryDetail = null;
      window.addEventListener('hashcod:platform-entered', event => {
        if (event.detail && event.detail.temporaryAccess === true) {
          window.__temporaryEntryDetail = event.detail;
        }
      });
    });

    await reachRegistrationScreen(page);

    const emptyState = await page.evaluate(() => ({
      fullName: document.getElementById('hashcodRegFullName')?.value || '',
      age: document.getElementById('hashcodRegAge')?.value || '',
      cedula: document.getElementById('hashcodRegCedula')?.value || '',
      platform: document.getElementById('hashcodRegPlatform')?.value || '',
      email: document.getElementById('hashcodRegEmail')?.value || '',
      phone: document.getElementById('hashcodRegPhone')?.value || '',
      submitDisabled: document.getElementById('hashcodRegistrationSubmit')?.getAttribute('aria-disabled'),
      whatsappDisabled: Boolean(document.getElementById('hashcodRegistrationWhatsappButton')?.disabled),
      temporaryVisible: getComputedStyle(document.getElementById('hashcodTemporaryAccessButton')).display !== 'none'
    }));

    assert.equal(emptyState.fullName, '');
    assert.equal(emptyState.age, '');
    assert.equal(emptyState.cedula, '');
    assert.equal(emptyState.platform, '');
    assert.equal(emptyState.email, '');
    assert.equal(emptyState.phone, '');
    assert.equal(emptyState.submitDisabled, 'true', 'normal entry must remain locked with an empty form');
    assert.equal(emptyState.whatsappDisabled, true, 'WhatsApp must remain locked with an empty form');
    assert.equal(emptyState.temporaryVisible, true, 'temporary access button must be visible beside entry');

    await page.click('#hashcodTemporaryAccessButton');
    await page.waitForSelector('#hashcodTemporaryAccessDialog[open]', { state: 'visible', timeout: 3000 });

    // More than 24 hours must be rejected.
    await page.fill('#hashcodTemporaryAccessDuration', '25');
    await page.selectOption('#hashcodTemporaryAccessUnit', 'hours');
    await page.click('#hashcodTemporaryAccessConfirm');
    await page.waitForFunction(() => {
      const node = document.getElementById('hashcodTemporaryAccessStatus');
      return Boolean(node && /24 horas/i.test(node.textContent || ''));
    }, { timeout: 2000 });
    assert.notEqual(await page.getAttribute('html', 'data-hashcod-platform-entered'), 'true',
      'invalid duration must not enter Codespace');

    // Accelerate only the temporary-access expiry timer so the test can prove
    // the automatic ejection without waiting a real minute.
    await page.evaluate(() => {
      const nativeSetTimeout = window.setTimeout.bind(window);
      window.setTimeout = function (callback, delay, ...args) {
        if (
          typeof callback === 'function'
          && callback.name === 'expireTemporaryAccess'
          && Number(delay) > 5000
        ) {
          return nativeSetTimeout(callback, 2500, ...args);
        }
        return nativeSetTimeout(callback, delay, ...args);
      };
    });

    // A valid duration enters without touching the registration fields.
    await page.fill('#hashcodTemporaryAccessDuration', '1');
    await page.selectOption('#hashcodTemporaryAccessUnit', 'minutes');
    await page.click('#hashcodTemporaryAccessConfirm');

    await page.waitForFunction(() => (
      document.documentElement.dataset.hashcodPlatformEntered === 'true'
      && document.documentElement.dataset.hashcodTemporaryAccess === 'true'
      && !document.getElementById('hashcodPlatformRegistration')
    ), { timeout: 5000 });

    const state = await page.evaluate(() => {
      const api = window.HashcodPlatformRegistration;
      const temp = api && typeof api.temporaryAccessState === 'function'
        ? api.temporaryAccessState()
        : null;
      const stored = Number(sessionStorage.getItem('hashcod_temporary_access_expires_v1') || 0);
      return {
        now: Date.now(),
        temp,
        stored,
        detail: window.__temporaryEntryDetail
      };
    });

    assert(state.temp && state.temp.active === true, 'temporary-access state must be active');
    assert(state.temp.expiresAt > state.now, 'temporary access must have a future expiry');
    assert(state.temp.remainingMs > 45000 && state.temp.remainingMs <= 60000,
      'one-minute access must arm approximately one minute of remaining time');
    assert.equal(state.stored, state.temp.expiresAt, 'sessionStorage expiry must match the active timer');
    assert(state.detail, 'platform-entered must describe the temporary entry');
    assert.equal(state.detail.source, 'temporary-access');
    assert.equal(state.detail.temporaryAccess, true);
    assert.equal(state.detail.temporaryAccessExpiresAt, state.temp.expiresAt);

    const navigation = page.waitForEvent('framenavigated', { timeout: 7000 });
    await navigation;
    await page.waitForSelector('#bootCliEnter', { state: 'visible', timeout: 10000 });

    const expiredState = await page.evaluate(() => ({
      temporaryFlag: document.documentElement.dataset.hashcodTemporaryAccess || '',
      entered: document.documentElement.dataset.hashcodPlatformEntered || '',
      stored: sessionStorage.getItem('hashcod_temporary_access_expires_v1')
    }));
    assert.equal(expiredState.temporaryFlag, '', 'temporary marker must be cleared after expiry');
    assert.notEqual(expiredState.entered, 'true', 'expired temporary user must be returned to the initial screen');
    assert.equal(expiredState.stored, null, 'temporary expiry must clear sessionStorage');

    console.log('PASS: temporary icon bypasses the form, enforces a 24-hour cap, enters through the normal gate, and automatically returns to the initial screen when time expires.');
  } finally {
    await browser.close();
  }
}

Promise.race([
  run(),
  new Promise((_, reject) => setTimeout(() => reject(new Error('temporary access browser test exceeded 90 seconds')), 90000))
]).catch(error => {
  console.error(error);
  process.exit(1);
});
