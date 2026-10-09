const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const { IDBFactory } = require('fake-indexeddb');
const root = path.resolve(__dirname, '../..');
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
async function until(check) {
  for (let i = 0; i < 250; i++) { if (check()) return; await pause(20); }
  throw new Error('Files loading state did not settle');
}
async function scenario(origin) {
  const dom = new JSDOM('<body data-hashcod-shared-workspace="1"><div id="d5CenterEmptyStateMount"></div></body>', { url: origin, runScripts: 'dangerously', pretendToBeVisual: true });
  const w = dom.window, errors = [], timers = new Set();
  w.addEventListener('error', event => errors.push(event.error));
  w.indexedDB = new IDBFactory();
  w.matchMedia = () => ({ matches: true, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
  w.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
  w.scrollTo = () => {};
  const interval = w.setInterval.bind(w), clear = w.clearInterval.bind(w);
  w.setInterval = (callback, ms) => { const timer = interval(callback, ms); if (ms === 100) timers.add(timer); return timer; };
  w.clearInterval = timer => { timers.delete(timer); clear(timer); };
  let release;
  w.fetch = url => {
    if (url === '/api/platform-period') return Promise.resolve(Response.json({ok:true,state:'active',days:10,expiresAt:9999999999,serverNow:Math.floor(Date.now()/1000),subscription:{tier:'pro',expiresAt:9999999999}}));
    assert.equal(url, '/api/hashcod-shared-files?action=list');
    return new Promise(resolve => { release = resolve; });
  };
  const loader = () => w.document.querySelector('#d5FilesExplorer .hfv-loading-state');
  const complete = files => release(new Response(JSON.stringify({ ok: true, files })));
  const transfer = (id, pending) => w.dispatchEvent(new w.CustomEvent('hashcod:file-vault-transfer', { detail: { id, pending } }));
  try {
    w.eval(fs.readFileSync(path.join(root, 'components/center-empty-state.bundle.js'), 'utf8'));
    await until(() => loader() && release);
    assert.equal(loader().getAttribute('role'), 'status');
    assert.equal(loader().querySelectorAll('.hfv-loading-pixel').length, 9);
    assert.equal(loader().querySelector('.hfv-loading-label').textContent, 'Loading files');
    assert.equal(w.document.querySelector('#d5FilesExplorer').getAttribute('aria-busy'), 'true');
    await pause(220);
    assert(parseFloat(loader().querySelector('.hfv-loading-elapsed').textContent) > 0, 'timer must run even with reduced motion');
    const file = { id: 'fv_loading12345', name: 'pending.txt', cloud: true, accessProtection: 'access-code' };
    complete([file]);
    await until(() => !loader() && w.document.querySelector('[data-hfv-preview-id="fv_loading12345"]'));
    assert.equal(timers.size, 0, 'elapsed interval must be cleaned up when work ends');
    transfer('fv_upload_one', true); transfer('fv_upload_two', true);
    await until(() => loader());
    assert.equal(loader().querySelector('.hfv-loading-label').textContent, 'Uploading');
    assert(w.document.querySelector('[data-hfv-preview-id="fv_loading12345"]'), 'existing files must stay visible during uploads');
    transfer('fv_upload_one', false); await pause(30);
    assert(loader(), 'finishing one upload must not hide another pending upload');
    transfer('fv_upload_two', false);
    await until(() => !loader());
    assert.equal(timers.size, 0);
    release = null; w.dispatchEvent(new w.Event('focus'));
    await until(() => loader() && release);
    release(new Response('{"ok":false}', { status: 503 }));
    await until(() => !loader());
    assert(w.document.querySelector('[data-hfv-preview-id="fv_loading12345"]'), 'failed refresh must preserve existing files');
    assert.equal(timers.size, 0, 'failed refresh must stop the timer');
    assert.deepEqual(errors, []);
    console.log('Files Beautiful UI loader on ' + origin + ': deferred list, timer cleanup, concurrent transfers and failed refresh OK');
  } finally { w.close(); }
}
(async () => {
  for (const origin of ['https://hashcodcodespace.dev', 'http://127.0.0.1:8000']) await scenario(origin);
})().catch(error => { console.error(error); process.exitCode = 1; });
