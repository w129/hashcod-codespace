'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const bundle = fs.readFileSync(path.resolve(__dirname, '../../components/file-vault-totp.bundle.js'), 'utf8');
const pause = () => new Promise(resolve => setTimeout(resolve, 20));
async function until(check) {
  for (let i = 0; i < 150; i++) { if (check()) return; await pause(); }
  throw new Error('TOTP dialog did not reach the expected state');
}

(async () => {
  const dom = new JSDOM('<!doctype html><body><button id="outside">Vault</button></body>', { url: 'https://hashcodcodespace.dev', runScripts: 'dangerously', pretendToBeVisual: true });
  const w = dom.window;
  try {
    w.matchMedia = () => ({ matches: true, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
    w.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
    const requests = [];
    let respond;
    w.fetch = (url, options) => {
      requests.push({ url, ...options, body: JSON.parse(options.body) });
      return new Promise((resolve, reject) => { respond = { resolve, reject }; });
    };
    w.eval(bundle);
    await until(() => w.HashcodFileVaultTotp);
    let resolved = false;
    const result = w.HashcodFileVaultTotp.requestSetup('document.pdf').then(value => { resolved = true; return value; });
    await until(() => w.document.querySelector('#hfvTotpCode'));
    const secret = w.document.querySelector('#hfvTotpSecret').value;
    function enterCode(code) {
      const input = w.document.querySelector('#hfvTotpCode');
      Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype, 'value').set.call(input, code);
      input.dispatchEvent(new w.Event('input', { bubbles: true }));
    }
    function submit() { w.document.querySelector('form.hfv-totp-dialog').dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true })); }
    enterCode('111111'); await pause(); submit(); submit();
    await until(() => requests.length === 1 || resolved);
    assert.equal(resolved, false, 'Setup must remain open until server verification succeeds');
    assert.equal(requests.length, 1, 'Double submission must not verify twice');
    await until(() => w.document.querySelector('#hfvTotpSecret').disabled);
    assert(w.document.querySelector('#hfvTotpCode').disabled, 'Pending verification must lock the code');
    assert.equal(requests[0].body.totp_secret, secret);
    assert.equal(requests[0].body.totp_code, '111111');
    assert.equal(requests[0].method, 'POST');
    assert.equal(requests[0].headers['X-Requested-With'], 'XMLHttpRequest');
    assert(!requests[0].url.includes(secret), 'Secrets must never be placed in URLs');
    respond.resolve(new Response(JSON.stringify({ ok: false, code: 'invalid_totp', error: 'Use the current code from this setup key.' }), { status: 401 }));
    await until(() => w.document.querySelector('.hfv-totp-error').textContent.includes('Use the current code'));
    assert.equal(w.document.querySelector('#hfvTotpSecret').value, secret, 'Wrong code must preserve the key');
    assert.equal(resolved, false);
    enterCode('123456'); await pause(); submit();
    await until(() => requests.length === 2);
    respond.reject(new Error('Network unavailable'));
    await until(() => w.document.querySelector('.hfv-totp-error').textContent.includes('connection'));
    assert.equal(w.document.querySelector('#hfvTotpSecret').value, secret);
    assert.equal(resolved, false, 'Network failure must not release the upload');
    enterCode('123456'); await pause(); submit();
    await until(() => requests.length === 3);
    respond.resolve(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    const verified = await result;
    assert.equal(verified.secret, secret);
    assert.equal(verified.code, '123456');
    await until(() => !w.document.querySelector('form.hfv-totp-dialog'));
    // Cancel while a request is pending must ignore its late success.
    const cancelled = w.HashcodFileVaultTotp.requestSetup('cancelled.pdf');
    await until(() => w.document.querySelector('#hfvTotpCode'));
    enterCode('123456'); await pause(); submit();
    await until(() => requests.length === 4);
    w.document.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    assert.equal(await cancelled, null);
    respond.resolve(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    await until(() => !w.document.querySelector('form.hfv-totp-dialog'));
    console.log('Rendered Animate UI setup: server verification, same-key retry, network errors and cancellation verified');
  } finally { w.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
