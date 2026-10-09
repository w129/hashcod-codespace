'use strict';
// Toolbook progress: the Animate UI Progress below the Toolbook follows the slots that tools fill.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '../..');

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1000, height: 900 } }), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/api/**', route => route.fulfill({ json: { ok: true, state: 'active', days: 10, expiresAt: 9999999999, serverNow: 1, subscription: { tier: 'free' } } }));
    await page.route('**/page.html', route => route.fulfill({ contentType: 'text/html', body: '<!doctype html><meta charset="utf-8"><body data-hashcod-entry-intro="1" data-hashcod-policy-consent="1"><main><div id="d5CenterEmptyStateMount"></div></main><link rel="stylesheet" href="/c.css"><script src="/c.js"></script>' }));
    await page.route('**/c.css', route => route.fulfill({ contentType: 'text/css', body: fs.readFileSync(path.join(root, 'components/center-empty-state.bundle.css')) }));
    await page.route('**/c.js', route => route.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(path.join(root, 'components/center-empty-state.bundle.js')) }));
    await page.goto('http://toolbook.test/page.html');
    const bar = page.getByRole('progressbar', { name: 'Avance de la Toolbook' });
    await bar.waitFor({ state: 'attached' });
    assert.equal(await bar.getAttribute('aria-valuenow'), '0', 'an empty Toolbook starts at 0 %');
    assert.equal(await page.locator('.htb-slot[data-filled="true"]').count(), 0);
    await page.evaluate(() => window.HashcodToolbook.setFilled(['1-1', '1-2', '2-1', '2-2', 'nope']));
    await page.waitForFunction(() => document.querySelector('[role=progressbar]').getAttribute('aria-valuenow') === '25');
    assert.equal(await page.locator('.htb-slot[data-filled="true"]').count(), 4, 'unknown slot ids are ignored');
    await page.waitForTimeout(1200);
    const fill = await page.locator('[data-slot=progress]').evaluate(track => { const t = track.getBoundingClientRect(), i = track.firstElementChild.getBoundingClientRect(); return (i.right - t.left) / t.width; });
    assert(Math.abs(fill - .25) < .03, 'the indicator must fill to a quarter of the track, got ' + fill);
    await page.evaluate(() => window.HashcodToolbook.setFilled(window.HashcodToolbook.slots));
    await page.waitForFunction(() => document.querySelector('[role=progressbar]').getAttribute('aria-valuenow') === '100');
    assert.match(await page.locator('.htb-caption').textContent(), /16\/16 · 100 %/);
    await page.evaluate(() => window.HashcodToolbook.setFilled([]));
    await page.waitForFunction(() => document.querySelector('[role=progressbar]').getAttribute('aria-valuenow') === '0');
    assert.deepEqual(errors, []);
    console.log('Toolbook progress follows filled slots: 0 %, 25 %, 100 % and back to 0 % OK');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
