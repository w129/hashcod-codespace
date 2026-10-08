const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const wait = () => new Promise(r => setTimeout(r, 20));
async function until(check) { for (let i = 0; i < 200; i++) { if (check()) return; await wait(); } throw Error('Checkout UI timeout'); }
async function scenario(origin, offline = false, active = false) {
  const dom = new JSDOM('<body><main><div id="d5CenterEmptyStateMount"></div></main><footer></footer></body>', { url: origin, runScripts: 'dangerously', pretendToBeVisual: true });
  const w = dom.window; w.scrollTo = () => {}; w.matchMedia = () => ({ matches: true, addEventListener() {}, removeEventListener() {} });
  w.ResizeObserver = class { observe() {} disconnect() {} unobserve() {} };
  let refresh, failFree = !offline, server = { ok: true, state: 'choose', serverNow: 1000 }, calls = [];
  const nativeInterval = w.setInterval.bind(w);
  w.setInterval = (f, ms, ...args) => { if (ms === 60000) refresh = f; return nativeInterval(f, ms, ...args); };
  if (active) {
    Object.assign(w.document.body.dataset, { hashcodPeriodDays: '20', hashcodPeriodExpiresAt: '9999999999', hashcodPeriodNow: '1000' });
    server = { ok: true, state: 'active', days: 20, expiresAt: 9999999999, serverNow: 1000 };
  }
  w.fetch = async (url, options = {}) => {
    if (url !== '/api/platform-period') return new Response('{"ok":true,"files":[]}');
    if (offline) throw Error('Offline');
    const body = options.body && JSON.parse(options.body); calls.push(body);
    if (body) {
      assert.deepEqual(body, { entry: 'free' }, 'Checkout must not send prices, identity numbers, codes or durations');
      if (failFree) return new Response('{"ok":false,"error":"Server unavailable"}', { status: 503 });
      server = { ok: true, state: 'active', days: 10, expiresAt: 9999999999, serverNow: 1000 };
    }
    return new Response(JSON.stringify(server));
  };
  w.eval(fs.readFileSync(path.resolve(__dirname, '../../components/center-empty-state.bundle.js'), 'utf8'));
  try {
    await until(() => w.document.querySelector('#d5RecommendationCard'));
    const free = () => [...w.document.querySelectorAll('button')].find(n => n.textContent === 'Entrar Gratis');
    if (active) {
      await wait(); assert.equal(w.document.querySelector('#hashcodEntryCheckout'), null, 'Active session must resume without the checkout');
      w.document.querySelector('.hco-reopen').click(); await until(free); free().click();
      await until(() => !w.document.querySelector('#hashcodEntryCheckout'));
      assert.equal(calls.filter(Boolean).length, 0, 'A valid restored session must not be extended');
      console.log(`Checkout ${origin}: active/offline resume and reopen OK`); return;
    }
    await until(free);
    assert.equal(w.document.querySelector('#hpa-days'), null);
    assert.equal(w.document.querySelector('#hpa-code'), null);
    assert.equal(w.document.querySelector('main').inert, true);
    free().click(); await until(() => w.document.querySelector('.hco-error'));
    assert(w.document.querySelector('#hashcodEntryCheckout'), 'Failed free entry must not claim access');
    if (offline) { console.log('Checkout offline first entry: useful error and no fabricated session OK'); return; }
    failFree = false; free().click(); await until(() => !w.document.querySelector('#hashcodEntryCheckout'));
    assert.equal(w.document.querySelector('main').inert, undefined);
    assert.equal(w.document.querySelector('#d5RecommendationCard').dataset.accepted, 'true');
    server = { ...server, state: 'expired', expiresAt: 999 };
    refresh(); await until(() => calls.filter(Boolean).length === 3);
    await wait(); assert.equal(w.document.querySelector('#hashcodEntryCheckout'), null, 'Session expiry must refresh free access without the old key gate');
    assert.equal(w.localStorage.length, 0, 'Checkout must not persist personal input');
    console.log(`Checkout ${origin}: failure/retry, signed-session bootstrap and transparent renewal OK`);
  } finally { w.close(); }
}
(async () => {
  await scenario('https://hashcodcodespace.dev');
  await scenario('http://127.0.0.1:8000');
  await scenario('http://127.0.0.1:8000', true);
  await scenario('http://127.0.0.1:8000', true, true);
})().catch(e => { console.error(e); process.exitCode = 1; });
