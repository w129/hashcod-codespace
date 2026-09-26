const { chromium } = require('playwright');
const assert = require('assert');

(async () => {
  const url = process.env.CRM_TEST_URL || 'http://127.0.0.1:8099/laragon-local-entry.php';
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

  await page.evaluate(() => {
    if (window.HashcodInlineDirectEntry && typeof window.HashcodInlineDirectEntry.enter === 'function') {
      window.HashcodInlineDirectEntry.enter();
    }
  });

  await page.waitForSelector('#hashcodPlatformCrmButton', { state: 'visible', timeout: 15000 });

  const buttonBox = await page.$eval('#hashcodPlatformCrmButton', el => {
    const r = el.getBoundingClientRect();
    return { width: r.width, height: r.height, svg: !!el.querySelector('svg') };
  });
  assert(buttonBox.width >= 29 && buttonBox.height >= 29, 'CRM topbar button collapsed');
  assert(buttonBox.svg, 'CRM topbar SVG missing');

  await page.dispatchEvent('#hashcodPlatformCrmButton', 'pointerdown', {
    pointerType: 'mouse', button: 0, buttons: 1
  });

  await page.waitForFunction(() => {
    const host = document.getElementById('hashcodPlatformCrmModal');
    return !!(host && !host.hidden && host.shadowRoot && host.shadowRoot.querySelector('.window'));
  }, { timeout: 10000 });

  const visual = await page.evaluate(() => {
    const host = document.getElementById('hashcodPlatformCrmModal');
    const root = host.shadowRoot;
    const win = root.querySelector('.window').getBoundingClientRect();
    const icon = root.querySelector('.brand svg').getBoundingClientRect();
    return {
      title: root.querySelector('.title')?.textContent || '',
      width: win.width,
      height: win.height,
      iconWidth: icon.width,
      iconHeight: icon.height,
      columns: root.querySelectorAll('.column').length
    };
  });

  assert.strictEqual(visual.title, 'Platform CRM', 'CRM title missing');
  assert(visual.width > 800 && visual.height > 500, 'CRM window has unusable size');
  assert(visual.iconWidth <= 40 && visual.iconHeight <= 40, 'CRM brand SVG escaped its bounds');
  assert.strictEqual(visual.columns, 6, 'CRM pipeline must render 6 stages');

  // Functional test: add a platform manually.
  await page.evaluate(() => {
    const root = document.getElementById('hashcodPlatformCrmModal').shadowRoot;
    root.querySelector('[data-action="add"]').click();
  });

  await page.evaluate(() => {
    const root = document.getElementById('hashcodPlatformCrmModal').shadowRoot;
    root.querySelector('[data-new="name"]').value = 'Demo Platform';
    root.querySelector('[data-new="owner"]').value = 'Hashcod Team';
    root.querySelector('[data-new="contact"]').value = 'demo@example.test';
    root.querySelector('[data-action="confirm-add"]').click();
  });

  await page.waitForFunction(() => {
    const root = document.getElementById('hashcodPlatformCrmModal')?.shadowRoot;
    return !!root && Array.from(root.querySelectorAll('.card-title')).some(el => el.textContent === 'Demo Platform');
  }, { timeout: 5000 });

  // Edit the selected record and move it to Contactado.
  await page.evaluate(() => {
    const root = document.getElementById('hashcodPlatformCrmModal').shadowRoot;
    const stage = root.querySelector('[data-detail="stage"]');
    const next = root.querySelector('[data-detail="nextAction"]');
    stage.value = 'contactado';
    next.value = 'Agendar demo';
    root.querySelector('[data-action="save-detail"]').click();
  });

  const edited = await page.evaluate(() => {
    const api = window.HashcodPlatformCRM;
    return api.records().find(r => r.name === 'Demo Platform');
  });
  assert(edited, 'manual CRM record was not persisted');
  assert.strictEqual(edited.stage, 'contactado', 'CRM stage edit failed');
  assert.strictEqual(edited.nextAction, 'Agendar demo', 'CRM next action edit failed');

  // Ensure the old false-positive 64-slot issue is gone on a clean browser state.
  const total = await page.evaluate(() => window.HashcodPlatformCRM.records().length);
  assert(total < 64, 'CRM still auto-registers every Toolbox circle');

  await page.evaluate(() => {
    const root = document.getElementById('hashcodPlatformCrmModal').shadowRoot;
    root.querySelector('[data-action="close"]').click();
  });
  await page.waitForFunction(() => document.getElementById('hashcodPlatformCrmModal')?.hidden === true);

  console.log('✓ CRM button opens isolated UI; manual add/edit pipeline works; false 64-slot registration is gone');
  await browser.close();
})().catch(err => {
  console.error(err);
  process.exit(1);
});
