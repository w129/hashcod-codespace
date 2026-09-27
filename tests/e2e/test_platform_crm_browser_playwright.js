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

  // CRM must remain completely hidden after platform entry.
  const beforeOpen = await page.evaluate(() => {
    const host = document.getElementById('hashcodPlatformCrmModal');
    if (!host) return { exists: false };
    const style = getComputedStyle(host);
    return {
      exists: true,
      hidden: host.hidden,
      ariaHidden: host.getAttribute('aria-hidden'),
      display: style.display,
      visibility: style.visibility,
      pointerEvents: style.pointerEvents,
      crmOpen: host.dataset.crmOpen || ''
    };
  });
  assert(beforeOpen.exists, 'CRM host should be prepared at startup');
  assert.strictEqual(beforeOpen.hidden, true, 'CRM opened automatically at startup');
  assert.strictEqual(beforeOpen.ariaHidden, 'true', 'CRM startup aria-hidden state is wrong');
  assert.strictEqual(beforeOpen.display, 'none', 'CRM startup display must be none');
  assert.strictEqual(beforeOpen.crmOpen, 'false', 'CRM startup data state must be closed');

  // Synthetic clicks must not open it.
  await page.evaluate(() => {
    document.getElementById('hashcodPlatformCrmButton')?.click();
  });
  await page.waitForTimeout(150);
  const afterSynthetic = await page.$eval('#hashcodPlatformCrmModal', el => ({
    hidden: el.hidden,
    crmOpen: el.dataset.crmOpen || ''
  }));
  assert.strictEqual(afterSynthetic.hidden, true, 'synthetic click unexpectedly opened CRM');
  assert.strictEqual(afterSynthetic.crmOpen, 'false', 'synthetic click changed CRM open state');

  // A real browser click is trusted and is the only action that may open it.
  await page.click('#hashcodPlatformCrmButton', { timeout: 10000 });

  await page.waitForFunction(() => {
    const host = document.getElementById('hashcodPlatformCrmModal');
    return !!(
      host &&
      !host.hidden &&
      host.dataset.crmOpen === 'true' &&
      host.shadowRoot &&
      host.shadowRoot.querySelector('.window')
    );
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

  const closedState = await page.$eval('#hashcodPlatformCrmModal', el => ({
    hidden: el.hidden,
    ariaHidden: el.getAttribute('aria-hidden'),
    display: getComputedStyle(el).display,
    crmOpen: el.dataset.crmOpen || ''
  }));
  assert.strictEqual(closedState.hidden, true, 'CRM did not return to hidden state');
  assert.strictEqual(closedState.ariaHidden, 'true', 'CRM close aria-hidden state is wrong');
  assert.strictEqual(closedState.display, 'none', 'CRM remains visually mounted after close');
  assert.strictEqual(closedState.crmOpen, 'false', 'CRM close data state is wrong');

  console.log('✓ CRM stays hidden at startup, ignores synthetic clicks, opens only on real icon click, and remains functional');
  await browser.close();
})().catch(err => {
  console.error(err);
  process.exit(1);
});
