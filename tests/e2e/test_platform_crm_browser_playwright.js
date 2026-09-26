const { chromium } = require('playwright');
const assert = require('assert');

(async () => {
  const url = process.env.CRM_TEST_URL || 'http://127.0.0.1:8099/laragon-local-entry.php';
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  const consoleErrors = [];
  page.on('pageerror', err => consoleErrors.push(String(err && err.message || err)));

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

  await page.evaluate(() => {
    if (window.HashcodInlineDirectEntry && typeof window.HashcodInlineDirectEntry.enter === 'function') {
      window.HashcodInlineDirectEntry.enter();
    }
  });

  await page.waitForSelector('#hashcodPlatformCrmButton', { state: 'visible', timeout: 15000 });

  const before = await page.$eval('#hashcodPlatformCrmButton', el => ({
    width: el.getBoundingClientRect().width,
    height: el.getBoundingClientRect().height,
    svg: !!el.querySelector('svg'),
    version: el.dataset.hashcodPlatformCrm || ''
  }));
  assert(before.width >= 29, 'CRM button collapsed horizontally');
  assert(before.height >= 29, 'CRM button collapsed vertically');
  assert(before.svg, 'CRM SVG icon missing');

  await page.click('#hashcodPlatformCrmButton', { timeout: 10000 });

  await page.waitForFunction(() => {
    const modal = document.getElementById('hashcodPlatformCrmModal');
    if (!modal) return false;
    const style = getComputedStyle(modal);
    const rect = modal.getBoundingClientRect();
    return !modal.hidden &&
      modal.classList.contains('is-open') &&
      style.display !== 'none' &&
      style.visibility === 'visible' &&
      Number(style.opacity) > 0 &&
      rect.width > 300 &&
      rect.height > 300;
  }, { timeout: 10000 });

  const result = await page.$eval('#hashcodPlatformCrmModal', el => {
    const style = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return {
      hidden: el.hidden,
      open: el.classList.contains('is-open'),
      display: style.display,
      visibility: style.visibility,
      opacity: style.opacity,
      width: rect.width,
      height: rect.height,
      title: el.querySelector('.hcrm-brand strong')?.textContent || ''
    };
  });

  assert.strictEqual(result.hidden, false, 'CRM modal remained hidden after click');
  assert.strictEqual(result.open, true, 'CRM modal did not enter is-open state');
  assert.notStrictEqual(result.display, 'none', 'CRM modal display remained none');
  assert.strictEqual(result.visibility, 'visible', 'CRM modal visibility is not visible');
  assert(Number(result.opacity) > 0, 'CRM modal opacity remained zero');
  assert(result.width > 300 && result.height > 300, 'CRM modal has no usable viewport');
  assert.strictEqual(result.title, 'Platform CRM', 'CRM window content did not render');

  await page.click('#hcrmClose');
  await page.waitForFunction(() => {
    const modal = document.getElementById('hashcodPlatformCrmModal');
    return modal && modal.hidden === true;
  }, { timeout: 5000 });

  if (consoleErrors.length) {
    console.log('Browser page errors observed:', consoleErrors);
  }

  console.log('✓ CRM topbar icon opens and closes the Platform CRM window in Chromium');
  await browser.close();
})().catch(err => {
  console.error(err);
  process.exit(1);
});
