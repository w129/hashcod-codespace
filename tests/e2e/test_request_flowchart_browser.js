'use strict';
// Request flowchart: server data drives the steps, the dropdown switches requests, cards drag, layout adapts.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '../..');
const row = (id, name, status, certificateId = null) => ({ id, name, status, createdAt: '2026-10-09T10:00:00Z', updatedAt: '2026-10-09T12:00:00Z', certificateId });
const A = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', B = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', C = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
      const page = await browser.newPage({ viewport }), errors = [];
      let reply = { status: 200, body: { ok: true, quota: { used: 0, limit: 25 }, requests: [] } }, hits = 0;
      page.on('pageerror', error => errors.push(error.message));
      await page.route('**/api/platform-requests', route => { hits++; route.fulfill({ status: reply.status, json: reply.body }); });
      await page.route('**/api/**', route => route.request().url().includes('platform-requests') ? route.fallback() : route.fulfill({ json: { ok: true, state: 'active', days: 10, expiresAt: 9999999999, serverNow: 1, subscription: { tier: 'free' } } }));
      await page.route('**/page.html', route => route.fulfill({ contentType: 'text/html', body: '<!doctype html><meta charset="utf-8"><body data-hashcod-entry-intro="1" data-hashcod-policy-consent="1"><main><div id="d5CenterEmptyStateMount"></div></main><link rel="stylesheet" href="/c.css"><script src="/c.js"></script>' }));
      await page.route('**/c.css', route => route.fulfill({ contentType: 'text/css', body: fs.readFileSync(path.join(root, 'components/center-empty-state.bundle.css')) }));
      await page.route('**/c.js', route => route.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(path.join(root, 'components/center-empty-state.bundle.js')) }));
      await page.goto('http://flow.test/page.html');
      const flow = page.locator('.hfc');
      await flow.waitFor();

      // Empty: a single guiding card, no If/Else, no connector.
      await page.getByText('Aún no tienes solicitudes').waitFor();
      assert.equal(await page.locator('.hfc-edge').count(), 0);
      assert.equal(await page.locator('.hfc-card--condition').count(), 0);

      // Requests arrive: three steps joined by two connectors; the latest request is shown first.
      reply = { status: 200, body: { ok: true, quota: { used: 3, limit: 25 }, requests: [row(A, 'plan.pdf', 'pending'), row(B, 'informe.pdf', 'completed', C), row(C, 'acta.pdf', 'delayed')] } };
      await page.evaluate(() => window.dispatchEvent(new CustomEvent('hashcod:requests-changed')));
      await page.getByText('En cola de revisión').waitFor();
      assert.equal(await page.locator('.hfc-edge').count(), 2);
      assert.match(await page.locator('.hfc-quota').textContent(), /3\/25/);
      assert.match(await page.locator('.hfc-card--condition').textContent(), /Si\s*solicitud\s*plan\.pdf\s*está\s*Pendiente/);

      // Dropdown: real options with each request's state; picking one rebuilds the outcome.
      await page.locator('.hfc-chip').click();
      const options = await page.getByRole('option').allTextContents();
      assert.equal(options.length, 3);
      assert(options[1].includes('informe.pdf') && options[1].includes('Completada'));
      await page.getByRole('option', { name: /informe\.pdf/ }).click();
      await page.getByText('Tokenizada y certificada').waitFor();
      await page.getByText('Certificado cccccccc').waitFor();
      assert.match(await page.locator('.hfc-card--condition').textContent(), /Emitido/);
      await page.locator('.hfc-chip').click(); await page.keyboard.press('Escape');
      assert.equal(await page.getByRole('listbox').count(), 0, 'Escape closes the menu');

      // Adaptive: every card stays inside the canvas and the page never scrolls sideways.
      const fit = await page.evaluate(() => { const c = document.querySelector('.hfc-canvas').getBoundingClientRect(); return [...document.querySelectorAll('.hfc-node')].every(n => { const r = n.getBoundingClientRect(); return r.left >= c.left - 1 && r.right <= c.right + 1; }) && document.documentElement.scrollWidth <= innerWidth + 1; });
      assert.equal(fit, true, 'cards fit the canvas at ' + viewport.width);

      // Dragging moves the card and its connector follows.
      const outcome = page.locator('.hfc-node').nth(2), pathBefore = await page.locator('.hfc-edge').nth(1).getAttribute('d');
      const box = await outcome.boundingBox();
      await page.mouse.move(box.x + box.width / 2, box.y + box.height - 8);
      await page.mouse.down(); await page.mouse.move(box.x + box.width / 2 - 40, box.y + box.height - 8, { steps: 4 }); await page.mouse.up();
      assert.notEqual(await page.locator('.hfc-edge').nth(1).getAttribute('d'), pathBefore, 'the connector follows a dragged card');

      // Locked / error states are explained, never blank.
      reply = { status: 403, body: { ok: false, code: 'platform_period_required' } };
      await page.evaluate(() => window.dispatchEvent(new CustomEvent('hashcod:requests-changed')));
      await page.waitForFunction(() => document.querySelector('.hfc-summary')?.textContent.length > 0);
      assert(hits >= 3, 'refetched after each change event');
      assert.deepEqual(errors, []);
      await page.close();
      console.log(`Request flowchart ${viewport.width}x${viewport.height}: empty, server-driven steps, dropdown, drag, fit and states OK`);
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
