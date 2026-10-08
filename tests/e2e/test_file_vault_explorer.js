const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { webcrypto } = require('node:crypto');
const { JSDOM } = require('jsdom');
const { IDBFactory } = require('fake-indexeddb');
const root = path.resolve(__dirname, '../..');
const pause = () => new Promise(resolve => setTimeout(resolve, 20));
async function until(check) { for (let i = 0; i < 300; i++) { if (await check()) return; await pause(); } throw new Error('Files explorer did not reach expected state'); }
async function scenario(origin, shared = false) {
  const dom = new JSDOM('<body data-hashcod-entry-intro="1"><div id="d5CenterEmptyStateMount"></div></body>', { url: origin, runScripts: 'dangerously', pretendToBeVisual: true });
  const w = dom.window, released = [], revoked = [], requests = [], errors = [], pdfData = [];
  if (shared) w.document.body.dataset.hashcodSharedWorkspace = '1';
  const expectedEndpoint = shared ? '/api/hashcod-shared-files' : '/api/hashcod-file-vault';
  let refreshFromPoll;
  const nativeInterval = w.setInterval.bind(w);
  w.setInterval = (callback, delay, ...args) => {
    if (shared && delay === 15000) refreshFromPoll = callback;
    return nativeInterval(callback, delay, ...args);
  };
  w.addEventListener('error', event => errors.push(event.error));
  Object.defineProperty(w, 'crypto', { value: webcrypto });
  w.TextEncoder = TextEncoder; w.Blob = Blob; w.File = File; w.indexedDB = new IDBFactory();
  w.matchMedia = () => ({ matches: true, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
  w.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
  w.scrollTo = () => {};
  w.URL.createObjectURL = blob => { released.push(blob); return 'blob:preview-' + released.length; };
  w.URL.revokeObjectURL = url => revoked.push(url);
  w.HTMLAnchorElement.prototype.click = function () {};
  w.HTMLCanvasElement.prototype.getContext = () => ({});
  w.HashcodFileVaultPdf = { load: data => { pdfData.push(data); return { promise: Promise.resolve({ numPages: 2, getPage: async () => ({ getViewport: () => ({ width: 300, height: 400 }), render: () => ({ promise: Promise.resolve(), cancel() {} }) }) }), destroy: async () => {} }; } };
  const cloud = { id: 'fv_cloud_preview_12345', name: 'report.pdf', type: 'application/pdf', size: 20, cloud: true, accessProtection: 'access-code', priceUsdCents: 1250 };
  let cloudRows = [cloud];
  let periodDays = null;
  w.fetch = async (url, options = {}) => {
    if (url === '/api/platform-period') {
      if (options.body) { const body = JSON.parse(options.body); periodDays = body.entry === 'free' ? 10 : body.days; }
      const days = periodDays;
      return new Response(JSON.stringify({ ok: true, state: days ? 'active' : 'choose', days, expiresAt: days ? Math.floor(Date.now()/1000) + days*86400 : null, serverNow: Math.floor(Date.now()/1000) }));
    }
    requests.push({ url, options });
    assert(String(url).startsWith(expectedEndpoint + '?'), 'visible list and protected actions must use the same workspace');
    if (String(url).includes('action=list')) return new Response(JSON.stringify({ ok: true, files: cloudRows }));
    assert(String(url).includes('action=download'), 'unexpected cloud action');
    assert.equal(options.method, 'POST');
    const body = JSON.parse(options.body);
    assert.equal(body.id, cloud.id);
    if (body.code !== 'cloud-code') return new Response(JSON.stringify({ error: 'Use the exact code chosen by the uploader.' }), { status: 401 });
    return new Response(new Blob(['%PDF-1.7\nprotected pdf bytes'], { type: 'application/pdf' }));
  };
  const evaluate = name => w.eval(fs.readFileSync(path.join(root, 'components', name), 'utf8'));
  try {
    evaluate('file-vault-totp.bundle.js');
    await until(() => w.HashcodFileVaultTotp);
    assert.equal(typeof w.HashcodFileVaultTotp.preview, 'function', 'preview must authorize before exposing bytes');
    const meta = await w.HashcodFileVaultTotp.saveLocal(new File(['<script>window.PWNED=true</script>'], 'example.html', { type: 'text/html' }), 'fv_local_preview_12345', 'my-code');
    evaluate('center-empty-state.bundle.js');
    await until(() => w.document.querySelectorAll('#d5FilesExplorer [data-hfv-preview-id]').length === 2);
    assert.match(w.document.querySelector(`[data-hfv-preview-id="${cloud.id}"]`).textContent, /\$12.50 USD/);
    assert(!w.document.querySelector(`[data-hfv-preview-id="${meta.id}"] .hfv-file-value`), 'older unpriced files must not be shown as free');
    w.document.querySelector('#d5FileVaultTrigger').click();
    await until(() => w.document.querySelector('#d5FileVaultList'));
    assert.match(w.document.querySelector(`[data-hfv-file-id="${cloud.id}"] .hfv-file-value`).textContent, /\$12.50 USD/);
    w.document.querySelector('[aria-label="Close storage"]').click();
    await until(() => !w.document.getElementById('d5FileVault'));
    assert(!w.document.getElementById('d5FileVault'), 'files must be visible before opening upload vault');
    assert.equal(w.document.querySelector('#d5FilesExplorer').getAttribute('data-animate-ui-files'), 'radix');
    assert(w.document.querySelector('#d5CenterEmptyStateAction').compareDocumentPosition(w.document.querySelector('#d5FilesExplorer')) & w.Node.DOCUMENT_POSITION_FOLLOWING);
    const card = w.document.querySelector('#d5RecommendationCard');
    assert(card, 'recommendation must be present below Files even before opening the vault');
    assert(w.document.querySelector('#d5FilesExplorer').compareDocumentPosition(card) & w.Node.DOCUMENT_POSITION_FOLLOWING);
    await until(() => !card.querySelector('.hrc-button--secondary').disabled);
    assert.equal(card.dataset.selected, '10');
    assert.match(card.querySelector('.hrc-title').textContent, /¿Cuántos días vas a durar en la plataforma\?/);
    assert.equal(card.querySelector('.hrc-entity-chip').textContent, 'plataforma');
    assert(card.querySelector('.hrc-drawer').hasAttribute('inert'));
    const free = [...w.document.querySelectorAll('button')].find(n => n.textContent === 'Entrar Gratis');
    free.click(); await until(() => !w.document.querySelector('#hashcodEntryCheckout'));
    await until(() => card.dataset.accepted === 'true');
    card.querySelector('.hrc-button--secondary').click();
    await until(() => !card.querySelector('.hrc-drawer').hasAttribute('inert'));
    for (const days of [20, 30, 60]) {
      assert(card.querySelector(`[data-option="${days}"]`).disabled, 'Free technical session cannot be changed through alternatives');
    }
    card.querySelector('.hrc-button--secondary').click();
    await until(() => card.querySelector('.hrc-drawer').hasAttribute('inert'));
    assert.match(card.querySelector('[role="status"]').textContent, /Activo: 10 days/);
    assert(card.querySelector('[data-recommendation-accept]').disabled);
    assert.equal(released.length, 0, 'recommendations must not unlock files');
    if (shared) {
      assert.equal(typeof refreshFromPoll, 'function', 'shared tree must poll other-device changes');
      const otherDeviceFile = { ...cloud, id: 'fv_other_device_12345', name: 'other-device.pdf', priceUsdCents: 9900 };
      cloudRows = [cloud, otherDeviceFile];
      refreshFromPoll();
      await until(() => w.document.querySelector(`[data-hfv-preview-id="${otherDeviceFile.id}"]`));
      assert.equal(card.dataset.selected, '10', 'file polling must preserve the selected recommendation');
      assert.match(w.document.querySelector(`[data-hfv-preview-id="${otherDeviceFile.id}"]`).textContent, /\$99.00 USD/);
      assert.equal(pdfData.length, 0, 'sync must not expose file contents without a code');
      cloudRows = [cloud];
      refreshFromPoll();
      await until(() => !w.document.querySelector(`[data-hfv-preview-id="${otherDeviceFile.id}"]`));
    }
    async function enter(code) {
      await until(() => w.document.querySelector('#hfvTotpCode'));
      const field = w.document.querySelector('#hfvTotpCode');
      Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype, 'value').set.call(field, code);
      field.dispatchEvent(new w.Event('input', { bubbles: true }));
      await pause();
      w.document.querySelector('form.hfv-totp-dialog').dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true }));
    }
    w.document.querySelector(`[data-hfv-preview-id="${meta.id}"]`).click();
    await enter('wrong');
    await until(() => w.document.querySelector('.hfv-totp-error')?.textContent.includes('exact code'));
    assert.equal(released.length, 0);
    assert(!w.document.getElementById('d5FilePreview'), 'wrong code must not open preview');
    await enter('my-code');
    await until(() => w.document.querySelector('#d5FilePreview pre')?.textContent.includes('window.PWNED'));
    assert.equal(w.document.querySelector('#d5FilePreview pre').textContent, '<script>window.PWNED=true</script>');
    assert.equal(w.PWNED, undefined, 'uploaded HTML must be inert text');
    w.document.querySelector('[data-hfv-preview-close]').click();
    await until(() => !w.document.getElementById('d5FilePreview'));
    w.document.querySelector(`[data-hfv-preview-id="${cloud.id}"]`).click();
    await enter('wrong');
    await until(() => w.document.querySelector('.hfv-totp-error')?.textContent.includes('exact code'));
    assert.equal(pdfData.length, 0, 'PDF renderer must not receive bytes before authorization');
    await enter('cloud-code');
    await until(() => pdfData.length === 1 && w.document.querySelector('#d5FilePreview canvas'));
    assert.equal(new TextDecoder().decode(pdfData[0]), '%PDF-1.7\nprotected pdf bytes');
    w.document.querySelector('[data-hfv-preview-close]').click();
    await until(() => !w.document.getElementById('d5FilePreview'));
    // Every opening asks again; cancelling does not reuse the previous unlock.
    w.document.querySelector(`[data-hfv-preview-id="${meta.id}"]`).click();
    await until(() => w.document.querySelector('#hfvTotpCode'));
    w.document.querySelector('.hfv-totp-secondary').click();
    await pause();
    assert(!w.document.getElementById('d5FilePreview'));
    const added = await w.HashcodFileVaultTotp.saveLocal(new File(['image bytes'], 'photo.png', { type: 'image/png' }), 'fv_live_preview_12345', 'image-code');
    w.dispatchEvent(new w.CustomEvent('hashcod:file-vault-saved', { detail: { file: added } }));
    await until(() => w.document.querySelector(`[data-hfv-preview-id="${added.id}"]`));
    w.document.querySelector(`[data-hfv-preview-id="${added.id}"]`).click();
    await enter('image-code');
    await until(() => w.document.querySelector('#d5FilePreview img'));
    assert.equal(released.length, 1);
    w.document.querySelector('[data-hfv-preview-close]').click();
    await until(() => revoked.length === 1);
    assert.equal(errors.length, 0, errors.map(String).join('\n'));
    console.log('Official Files explorer on ' + origin + ': live list, exact-code preview, cloud POST, inert HTML, repeated verification and cleanup OK');
  } finally { await pause(); w.close(); }
}
(async () => {
  for (const origin of ['https://hashcodcodespace.dev', 'http://127.0.0.1:8000']) {
    for (const shared of [false, true]) await scenario(origin, shared);
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
