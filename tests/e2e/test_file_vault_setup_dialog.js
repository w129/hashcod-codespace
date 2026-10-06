'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const bundle = fs.readFileSync(path.resolve(__dirname, '../../components/file-vault-totp.bundle.js'), 'utf8');
const pause = () => new Promise(resolve => setTimeout(resolve, 20));
async function until(check) { for (let i = 0; i < 150; i++) { if (check()) return; await pause(); } throw new Error('File code dialog did not reach the expected state'); }
(async () => {
  const dom = new JSDOM('<!doctype html><body><button id="outside">Vault</button></body>', { url: 'https://hashcodcodespace.dev', runScripts: 'dangerously', pretendToBeVisual: true });
  const w = dom.window;
  try {
    w.TextEncoder = TextEncoder;
    w.matchMedia = () => ({ matches: true, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
    w.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
    let networkCalls = 0;
    w.fetch = () => { networkCalls++; return Promise.reject(new Error('setup must not call TOTP')); };
    w.eval(bundle);
    await until(() => w.HashcodFileVaultTotp);
    const result = w.HashcodFileVaultTotp.requestSetup('document.pdf');
    await until(() => w.document.querySelector('#hfvTotpCode'));
    const input = w.document.querySelector('#hfvTotpCode');
    const setValue = (value) => { Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype, 'value').set.call(input, value); input.dispatchEvent(new w.Event('input', { bubbles: true })); };
    setValue('MiCodigo-Verde! 2026');
    w.document.querySelector('form.hfv-totp-dialog').dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true }));
    const setup = await result;
    assert.equal(setup.code, 'MiCodigo-Verde! 2026');
    assert.equal(networkCalls, 0, 'Chosen file code must not call the TOTP verifier');
    await until(() => !w.document.querySelector('form.hfv-totp-dialog'));
    const cancelled = w.HashcodFileVaultTotp.requestSetup('cancelled.pdf');
    await until(() => w.document.querySelector('#hfvTotpCode'));
    w.document.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    assert.equal(await cancelled, null, 'Cancel must release the upload without a code');
    console.log('Rendered Animate UI file-code dialog: arbitrary code, no TOTP call and cancellation verified');
  } finally { w.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
