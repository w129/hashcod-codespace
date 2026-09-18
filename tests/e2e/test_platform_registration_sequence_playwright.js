'use strict';

// Live storage readiness recheck: this file change intentionally retriggers the PR workflow.

const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const target = process.env.REGISTRATION_SEQUENCE_URL || 'http://127.0.0.1:8099/laragon-local-entry.php';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1852, height: 927 } });

  page.on('console', msg => {
    if (msg.type() === 'error') console.error('[browser console]', msg.text());
  });
  page.on('pageerror', error => console.error('[pageerror]', error.stack || error.message));
  page.on('requestfailed', request => console.error('[requestfailed]', request.url(), request.failure()?.errorText || ''));

  try {
    const response = await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 20000 });
    assert(response && response.status() === 200, 'platform must load');

    await page.waitForTimeout(1800);

    const diagnostic = await page.evaluate(() => {
      const scriptState = (selector) => {
        const node = document.querySelector(selector);
        return node ? { present: true, src: node.src || '', nonce: Boolean(node.nonce) } : { present: false };
      };
      return {
        readyState: document.readyState,
        registrationMounted: Boolean(document.getElementById('hashcodPlatformRegistration')),
        registrationLoadedFlag: Boolean(window.__hashcodPlatformRegistrationLoaded),
        finalScreen: document.documentElement.dataset.hashcodFinalEntryScreen || '',
        l8EnterPlatformType: typeof window.l8EnterPlatform,
        holdWrapped: Boolean(window.l8EnterPlatform && window.l8EnterPlatform.__hashcodHoldWrapped),
        motionWrapped: Boolean(window.l8EnterPlatform && window.l8EnterPlatform.__hashcodMotionWrapped),
        registrationScript: scriptState('script[data-hashcod-platform-registration]'),
        holdScript: scriptState('script[data-platform-entry-hold]'),
        motionScript: scriptState('script[data-platform-entry-motion]')
      };
    });
    console.error('[live-diagnostic]', JSON.stringify(diagnostic));

    const assetPaths = [
      'components/platform-registration-form.js?v=20260918-1',
      'components/platform-entry-hold.js?v=20260918-1',
      'components/platform-entry-motion.js?v=20260918-1'
    ];
    for (const asset of assetPaths) {
      const assetUrl = new URL(asset, target).toString();
      const assetResponse = await page.request.get(assetUrl);
      const source = await assetResponse.text();
      let syntax = 'ok';
      try { new Function(source); } catch (error) { syntax = String(error && error.message || error); }
      console.error('[asset-diagnostic]', JSON.stringify({
        asset,
        status: assetResponse.status(),
        contentType: assetResponse.headers()['content-type'] || '',
        bytes: source.length,
        syntax
      }));
    }

    await page.waitForSelector('#bootCliEnter', { state: 'visible', timeout: 15000 });
    await page.waitForFunction(() => {
      const node = document.getElementById('hashcodPlatformRegistration');
      if (!node) return false;
      const style = getComputedStyle(node);
      return style.display === 'none' && style.visibility === 'hidden';
    }, { timeout: 10000 });

    assert.equal(await page.locator('#hashcodPlatformRegistration').count(), 1,
      'registration component must already be mounted while hidden on screen 1');

    await page.click('#bootCliEnter');

    await page.waitForSelector('#hashcodHoldContinue', { state: 'visible', timeout: 10000 });
    assert.equal(await page.isVisible('#hashcodPlatformRegistration'), false,
      'registration must remain hidden on screen 2');

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
    }, { timeout: 5000 });

    const state = await page.evaluate(() => {
      const root = document.getElementById('hashcodPlatformRegistration');
      const rect = root.getBoundingClientRect();
      const style = getComputedStyle(root);
      return {
        marker: document.documentElement.dataset.hashcodFinalEntryScreen || '',
        display: style.display,
        visibility: style.visibility,
        opacity: style.opacity,
        width: rect.width,
        height: rect.height,
        fields: [
          'hashcodRegFullName',
          'hashcodRegAge',
          'hashcodRegCedula',
          'hashcodRegPlatform',
          'hashcodRegEmail',
          'hashcodRegPhone'
        ].filter(id => document.getElementById(id)).length,
        submit: Boolean(document.getElementById('hashcodRegistrationSubmit')),
        tableButton: Boolean(document.getElementById('hashcodRegistrationTableButton'))
      };
    });

    assert.equal(state.marker, 'true');
    assert.equal(state.visibility, 'visible');
    assert(Number(state.opacity) > 0.9);
    assert(state.width > 300 && state.height > 300);
    assert.equal(state.fields, 6, 'all six requested fields must be present');
    assert.equal(state.submit, true, 'submit button missing');
    assert.equal(state.tableButton, true, 'records icon button missing');

    console.log('PASS: real screen 1 -> screen 2 -> screen 3 flow displays the registration form.');
  } finally {
    await browser.close();
  }
}

Promise.race([
  run(),
  new Promise((_, reject) => setTimeout(() => reject(new Error('registration sequence browser test exceeded 45 seconds')), 45000))
]).then(() => process.exit(0)).catch(error => {
  console.error(error && error.stack || error);
  process.exit(1);
});
