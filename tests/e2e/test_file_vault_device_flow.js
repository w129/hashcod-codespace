const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { webcrypto } = require('node:crypto');
const { JSDOM } = require('jsdom');
const { indexedDB } = require('fake-indexeddb');
const root = path.resolve(__dirname, '../..');
const pause = () => new Promise(resolve => setTimeout(resolve, 20));
async function until(check) { for (let i = 0; i < 250; i++) { if (await check()) return; await pause(); } throw new Error('Device vault did not reach expected state'); }
async function scenario(origin) {
  const dom = new JSDOM('<body><div id="d5FileVault"><div id="d5FileVaultDropzone"><input id="d5FileVaultInput" type="file"></div><div class="hfv-list-head"><button>Refresh</button></div><div id="d5FileVaultList"></div></div></body>', { url: origin, runScripts: 'dangerously', pretendToBeVisual: true });
  const w = dom.window, requests = [], saved = [];
  try {
    Object.defineProperty(w, 'crypto', { value: webcrypto });
    w.TextEncoder = TextEncoder; w.Blob = Blob; w.File = File; w.indexedDB = indexedDB;
    w.matchMedia = () => ({ matches: true, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
    w.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
    w.fetch = async (url) => { requests.push(url); return new Response(JSON.stringify({ ok: false, error: 'Cloud storage is unavailable.' }), { status: 503 }); };
    w.URL.createObjectURL = blob => { saved.push(blob); return 'blob:verified'; };
    w.URL.revokeObjectURL = () => {};
    w.HTMLAnchorElement.prototype.click = function () {};
    w.eval(fs.readFileSync(path.join(root, 'components/file-vault-totp.bundle.js'), 'utf8'));
    await until(() => w.HashcodFileVaultTotp);
    w.eval(fs.readFileSync(path.join(root, 'components/file-vault-fast-upload-v5.js'), 'utf8'));
    const file = new File(['pdf bytes from the user'], 'document.pdf', { type: 'application/pdf' });
    const input = w.document.getElementById('d5FileVaultInput');
    Object.defineProperty(input, 'files', { value: [file] });
    let meta;
    w.addEventListener('hashcod:file-vault-saved', event => { meta = event.detail.file; });
    input.dispatchEvent(new w.Event('change', { bubbles: true }));
    async function enter(code) {
      await until(() => w.document.querySelector('#hfvTotpCode'));
      const field = w.document.querySelector('#hfvTotpCode');
      Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype, 'value').set.call(field, code);
      field.dispatchEvent(new w.Event('input', { bubbles: true }));
      await pause();
      w.document.querySelector('form.hfv-totp-dialog').dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true }));
    }
    await until(() => w.document.querySelector('.hfv-value-toggle'));
    w.document.querySelector('.hfv-value-toggle').click();
    await until(() => w.document.querySelector('#hfvUsdValue'));
    const priceField = w.document.querySelector('#hfvUsdValue');
    Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype, 'value').set.call(priceField, '12.50');
    priceField.dispatchEvent(new w.Event('input', { bubbles: true }));
    await pause();
    Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype, 'value').set.call(priceField, '12.501');
    priceField.dispatchEvent(new w.Event('input', { bubbles: true }));
    await pause();
    await enter('MiCodigo-Verde! 2026');
    await until(() => w.document.querySelector('.hfv-totp-error')?.textContent.includes('USD'));
    assert.equal(meta, undefined, 'invalid amount must stop before saving');
    Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype, 'value').set.call(priceField, '12.50');
    priceField.dispatchEvent(new w.Event('input', { bubbles: true }));
    await pause();
    await enter('MiCodigo-Verde! 2026');
    await until(() => meta);
    assert.equal(meta.cloud, false);
    assert.equal(meta.priceUsdCents, 1250, 'capture upload must preserve chosen USD value');
    assert.equal(meta.accessProtection, 'local-code');
    assert.match(w.document.querySelector('.hfv-fast-layer small').textContent, /Saved on this device/);
    const row = w.document.createElement('article');
    row.className = 'hfv-file-row'; row.dataset.hfvFileId = meta.id; row.dataset.hfvAccessProtection = meta.accessProtection; row.dataset.hfvCloud = 'false';
    row.innerHTML = '<div class="hfv-file-copy"><strong>document.pdf</strong></div><div class="hfv-file-actions"><button title="Download">Download</button><button title="Delete">Delete</button></div>';
    w.document.getElementById('d5FileVaultList').appendChild(row);
    await until(() => !w.document.querySelector('form.hfv-totp-dialog'));
    row.querySelector('[title="Download"]').click();
    await enter('wrong');
    await until(() => w.document.querySelector('.hfv-totp-error')?.textContent.includes('exact code'));
    assert.equal(saved.length, 0, 'wrong code must not release any bytes');
    await enter('MiCodigo-Verde! 2026');
    await until(() => saved.length === 1);
    assert.equal(await saved[0].text(), await file.text());
    await until(() => !w.document.querySelector('form.hfv-totp-dialog'));
    row.querySelector('[title="Delete"]').click();
    await enter('wrong');
    await until(() => w.document.querySelector('.hfv-totp-error')?.textContent.includes('exact code'));
    await enter('MiCodigo-Verde! 2026');
    await until(() => new Promise(resolve => {
      const open = indexedDB.open('hashcod_file_vault_v1', 1);
      open.onsuccess = () => {
        const db = open.result, tx = db.transaction('files', 'readonly');
        const get = tx.objectStore('files').get(meta.id);
        tx.oncomplete = () => { db.close(); resolve(!get.result); };
      };
    }));
    await pause();
    assert(!requests.some(url => /action=(download|delete)/.test(url)), 'device actions must not depend on unavailable cloud');
    console.log('Real Animate UI device flow on ' + origin + ': encrypted save, verified download and deletion OK');
  } finally { w.close(); }
}
(async () => {
  for (const origin of ['https://hashcodcodespace.dev', 'http://127.0.0.1:8000']) await scenario(origin);
})().catch(error => { console.error(error); process.exitCode = 1; });
