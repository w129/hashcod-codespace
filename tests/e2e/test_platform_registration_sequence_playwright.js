'use strict';

const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const target = process.env.REGISTRATION_SEQUENCE_URL || 'http://127.0.0.1:8099/laragon-local-entry.php';

function birthDateForAge(age) {
  const now = new Date();
  const year = now.getFullYear() - age;
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function setValue(page, id, value) {
  await page.evaluate(({ id, value }) => {
    const input = document.getElementById(id);
    if (!input) throw new Error('missing field ' + id);
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }, { id, value });
}

async function setBirthDate(page, isoValue) {
  await page.evaluate(({ isoValue }) => {
    const [year, month, day] = String(isoValue).split('-');

    const native = document.getElementById('hcBirthDate');
    if (native) {
      native.value = isoValue;
      native.dispatchEvent(new Event('input', { bubbles: true }));
      native.dispatchEvent(new Event('change', { bubbles: true }));
      return;
    }

    const dayInput = document.getElementById('hcBirthDay') || document.querySelector('[data-hashcod-date-segment="day"]');
    const monthInput = document.getElementById('hcBirthMonth') || document.querySelector('[data-hashcod-date-segment="month"]');
    const yearInput = document.getElementById('hcBirthYear') || document.querySelector('[data-hashcod-date-segment="year"]');
    if (dayInput && monthInput && yearInput) {
      dayInput.value = day;
      monthInput.value = month;
      yearInput.value = year;
      [dayInput, monthInput, yearInput].forEach(input => {
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });
    }
  }, { isoValue });
}

async function setAge(page, age) {
  await setBirthDate(page, birthDateForAge(age));
  await setValue(page, 'hcAge', String(age));
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1852, height: 927 } });

  page.on('console', msg => {
    if (msg.type() === 'error') console.error('[browser console]', msg.text());
  });
  page.on('pageerror', error => console.error('[pageerror]', error.message));
  page.on('requestfailed', request => console.error('[requestfailed]', request.url(), request.failure()?.errorText || ''));

  try {
    const response = await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 20000 });
    assert(response && response.status() === 200, 'platform must load');

    await page.evaluate(() => {
      window.__registrationEntryEvents = 0;
      window.addEventListener('hashcod:platform-entered', () => {
        window.__registrationEntryEvents += 1;
      });
    });

    await page.waitForSelector('#bootCliEnter', { state: 'visible', timeout: 15000 });
    await page.waitForFunction(() => {
      const button = document.getElementById('bootCliEnter');
      return window.__hashcodPlatformEntryHoldReady === true
        && document.documentElement.dataset.hashcodEntryGateReady === 'true'
        && button;
    }, { timeout: 10000 });

    assert.equal(await page.locator('#hashcodDirectRegistration').count(), 0,
      'direct registration must not exist before the entry flow starts');
    assert.notEqual(await page.getAttribute('html', 'data-hashcod-platform-entered'), 'true',
      'platform must not be entered before registration');

    await page.click('#bootCliEnter');

    await page.waitForSelector('#hashcodHoldContinue', { state: 'visible', timeout: 10000 });
    await page.waitForFunction(() => {
      const button = document.getElementById('hashcodHoldContinue');
      return Boolean(button && button.disabled === false);
    }, { timeout: 8000 });

    await page.evaluate(() => {
      const button = document.getElementById('hashcodHoldContinue');
      if (!button) throw new Error('hashcodHoldContinue missing');
      button.click();
    });

    await page.waitForSelector('#hashcodDirectRegistration', { state: 'visible', timeout: 10000 });
    await page.waitForFunction(() => {
      const node = document.getElementById('hashcodDirectRegistration');
      if (!node) return false;
      const style = getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      return document.documentElement.dataset.hashcodDirectRegistration === 'true'
        && style.display !== 'none'
        && style.visibility !== 'hidden'
        && Number(style.opacity || 1) > 0.9
        && rect.width > 300
        && rect.height > 300;
    }, { timeout: 5000 });

    const state = await page.evaluate(() => {
      const root = document.getElementById('hashcodDirectRegistration');
      const rect = root.getBoundingClientRect();
      const style = getComputedStyle(root);
      return {
        marker: document.documentElement.dataset.hashcodDirectRegistration || '',
        entered: document.documentElement.dataset.hashcodPlatformEntered || '',
        display: style.display,
        visibility: style.visibility,
        opacity: style.opacity || '1',
        width: rect.width,
        height: rect.height,
        viewportWidth: innerWidth,
        viewportHeight: innerHeight,
        fields: [
          'hcName',
          'hcAge',
          'hcCedula',
          'hcPlatform',
          'hcFile',
          'hcEmail',
          'hcPhone'
        ].filter(id => document.getElementById(id)).length,
        submit: Boolean(document.getElementById('hcSubmit')),
        whatsappButton: Boolean(document.getElementById('hcWhatsapp')),
        codeButton: Boolean(document.getElementById('hcUpload')),
        colorPickerMounted: Boolean(document.getElementById('hashcodHeroUIColorPicker')),
        entryEvents: window.__registrationEntryEvents
      };
    });

    assert.equal(state.marker, 'true');
    assert.equal(state.entered, '', 'direct registration must still block platform entry');
    assert.equal(state.entryEvents, 0, 'platform-entered must not fire before registration is completed');
    assert.equal(state.visibility, 'visible');
    assert(Number(state.opacity) > 0.9);
    assert(state.width >= state.viewportWidth * 0.90,
      'direct registration must occupy most of the viewport width');
    assert(state.height >= state.viewportHeight * 0.90,
      'direct registration must occupy most of the viewport height');
    assert.equal(state.fields, 7, 'registration fields plus the code upload input must be present');
    assert.equal(state.submit, true, 'direct submit button missing');
    assert.equal(state.whatsappButton, true, 'direct WhatsApp button missing');
    assert.equal(state.codeButton, true, 'platform code upload icon button missing');

    await setValue(page, 'hcName', 'Usuario De Prueba');
    await setAge(page, 17);
    await setValue(page, 'hcCedula', '001-1234567-8');
    await setValue(page, 'hcPlatform', 'Hashcod Test');
    await setValue(page, 'hcEmail', 'test@example.com');
    await setValue(page, 'hcPhone', '+1 809 555 0100');

    await page.setInputFiles('#hcFile', {
      name: 'hashcod-test.zip',
      mimeType: 'application/zip',
      buffer: Buffer.from('PK\u0003\u0004hashcod-test-code')
    });

    await page.evaluate(() => {
      const consent = document.getElementById('hcConsent');
      if (!consent) throw new Error('direct registration consent missing');
      consent.checked = true;
      consent.dispatchEvent(new Event('input', { bubbles: true }));
      consent.dispatchEvent(new Event('change', { bubbles: true }));
    });

    await page.waitForFunction(() => {
      const submit = document.getElementById('hcSubmit');
      const whatsapp = document.getElementById('hcWhatsapp');
      const progress = document.getElementById('hcProgress');
      return Boolean(submit && submit.disabled === true && whatsapp && whatsapp.disabled === true && progress && Number(progress.getAttribute('aria-valuenow') || 0) < 100);
    }, { timeout: 3000 });

    assert.equal(await page.isDisabled('#hcSubmit'), true,
      'under-18 registration must keep submit disabled');
    assert.equal(await page.isDisabled('#hcWhatsapp'), true,
      'under-18 registration must keep WhatsApp disabled');
    assert.notEqual(await page.getAttribute('html', 'data-hashcod-platform-entered'), 'true',
      'under-18 user must not enter');

    await setAge(page, 18);

    await page.waitForFunction(() => {
      const submit = document.getElementById('hcSubmit');
      const whatsapp = document.getElementById('hcWhatsapp');
      const progress = document.getElementById('hcProgress');
      return Boolean(submit && submit.disabled === false && whatsapp && whatsapp.disabled === false && progress && progress.getAttribute('aria-valuenow') === '100');
    }, { timeout: 3000 });

    await page.evaluate(() => {
      window.__hashcodCapturedWhatsappUrl = '';
      window.open = function (url) {
        window.__hashcodCapturedWhatsappUrl = String(url || '');
        return {};
      };
    });

    await page.click('#hcWhatsapp');

    const capturedWhatsappUrl = await page.evaluate(() => window.__hashcodCapturedWhatsappUrl);
    assert(capturedWhatsappUrl.startsWith('https://wa.me/18294721257?text='),
      'WhatsApp button must open the official wa.me handoff');
    assert.notEqual(await page.getAttribute('html', 'data-hashcod-platform-entered'), 'true',
      'WhatsApp click alone must not enter Codespace');
    assert.equal(await page.evaluate(() => window.__registrationEntryEvents), 0,
      'platform-entered must not fire before the final continue click');

    const entryLabel = (await page.textContent('#hcSubmit')).replace(/\s+/g, ' ').trim().toUpperCase();
    assert(entryLabel.includes('ENTRAR A HASHCOD CODESPACE'),
      'main registration button must be labeled ENTRAR A HASHCOD CODESPACE');

    await page.click('#hcSubmit');
    await page.waitForSelector('#hcCodeModal', { state: 'visible', timeout: 5000 });

    const privateCode = (await page.textContent('#hcPrivateCode')).replace(/\s+/g, '').trim();
    assert.match(
      privateCode,
      /^HSC-REG-(?:[A-F0-9]{4}-){4}[A-F0-9]{4}$/,
      'registration modal must generate the local HSC registration code'
    );

    await page.click('#hcContinue');

    await page.waitForFunction(() => (
      document.documentElement.dataset.hashcodPlatformEntered === 'true'
      && !document.getElementById('hashcodDirectRegistration')
      && window.__registrationEntryEvents === 1
    ), { timeout: 5000 });

    console.log('PASS: direct registration blocks minors, sends the WhatsApp handoff, generates a code, and only then enters Codespace.');
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
