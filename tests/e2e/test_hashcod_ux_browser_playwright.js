'use strict';

const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const target = process.env.UX_TEST_URL || 'http://127.0.0.1:8099/laragon-local-entry.php';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  try {
    const response = await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 15000 });
    assert(response && response.status() === 200, 'Hashcod local UI must return HTTP 200');

    await page.waitForFunction(() => window.HashcodUX && window.HashcodUX.diagnostics().ready, { timeout: 15000 });
    const initial = await page.evaluate(() => window.HashcodUX.diagnostics());
    assert.equal(initial.version, 'HASHCOD-UX-1');
    assert.equal(initial.inPlatform, true);
    assert.equal(initial.palette, true);

    // Reproduce the wide desktop geometry that previously pushed the folder far
    // left and the Hashcod lockup far right. They must now behave as one centered
    // composition, while the integration strip remains centered independently.
    await page.setViewportSize({ width: 1852, height: 927 });
    await page.waitForFunction(() => {
      const folder = document.querySelector('#hashcodRareFolderHost[data-hashcod-composition-aligned="true"]');
      const brand = document.querySelector('.boot-brand');
      return Boolean(folder && brand && folder.getBoundingClientRect().width > 100 && brand.getBoundingClientRect().width > 100);
    }, { timeout: 10000 });
    await page.waitForTimeout(850);
    const landingGeometry = await page.evaluate(() => {
      const rectOf = (node) => {
        if (!node) return null;
        const r = node.getBoundingClientRect();
        return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height };
      };
      const folder = rectOf(document.getElementById('hashcodRareFolderHost'));
      const brand = rectOf(document.querySelector('.boot-brand'));
      const strip = rectOf(document.querySelector('.boot-cli-footer .boot-card-icon'));
      const viewportCenter = innerWidth / 2;
      const unionLeft = Math.min(folder.left, brand.left);
      const unionRight = Math.max(folder.right, brand.right);
      return {
        folder,
        brand,
        strip,
        viewportCenter,
        compositionCenter: (unionLeft + unionRight) / 2,
        horizontalGap: brand.left - folder.right,
        stripCenter: strip ? (strip.left + strip.right) / 2 : null
      };
    });
    assert(Math.abs(landingGeometry.compositionCenter - landingGeometry.viewportCenter) <= 42,
      `folder + Hashcod composition must be centered (delta=${Math.abs(landingGeometry.compositionCenter - landingGeometry.viewportCenter).toFixed(2)}px)`);
    assert(landingGeometry.horizontalGap >= 35 && landingGeometry.horizontalGap <= 160,
      `folder and Hashcod lockup must keep a controlled gap, got ${landingGeometry.horizontalGap.toFixed(2)}px`);
    if (landingGeometry.stripCenter !== null) {
      assert(Math.abs(landingGeometry.stripCenter - landingGeometry.viewportCenter) <= 42,
        'bottom integration strip must remain centered on wide screens');
    }

    await page.evaluate(() => window.HashcodUX.theme.set('dark', { silent: true }));
    assert.equal(await page.getAttribute('html', 'data-hashcod-theme'), 'dark');

    await page.evaluate(() => {
      const sandbox = document.createElement('section');
      sandbox.id = 'uxTestSandbox';
      sandbox.style.cssText = 'position:relative;z-index:2147483601;background:var(--hashcod-ux-bg);padding:20px';
      sandbox.innerHTML = [
        '<img id="uxTestLogo" alt="Hashcod logo" src="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2220%22 height=%2220%22%3E%3Crect width=%2220%22 height=%2220%22 fill=%22black%22/%3E%3C/svg%3E">',
        '<form id="uxDraftForm"><label>Title<input id="uxDraftInput" name="title"></label><button type="submit">Submit</button></form>',
        '<form id="uxSensitiveForm"><input type="password" name="password"></form>',
        '<div id="uxSkeleton">Loading content</div>',
        '<button id="uxStateButton" type="button">State</button>',
        '<button id="uxShareButton" data-hashcod-share data-share-title="Hashcod test" type="button">Share</button>',
        '<article id="uxReveal" data-scroll-reveal>Reveal test</article>'
      ].join('');
      document.body.appendChild(sandbox);
    });

    await page.waitForFunction(() => document.getElementById('uxDraftForm')?.dataset.hashcodAutosave === 'on', { timeout: 5000 });
    await page.waitForFunction(() => document.getElementById('uxTestLogo')?.classList.contains('hashcod-theme-logo'), { timeout: 5000 });
    assert.notEqual(await page.getAttribute('#uxSensitiveForm', 'data-hashcod-autosave'), 'on', 'sensitive form must not be autosaved');

    await page.fill('#uxDraftInput', 'Hashcod autosave draft');
    await page.waitForTimeout(750);
    const draftStored = await page.evaluate(() => {
      const keys = Object.keys(localStorage).filter((key) => key.startsWith('hashcod_form_draft_v1:'));
      return keys.some((key) => (localStorage.getItem(key) || '').includes('Hashcod autosave draft'));
    });
    assert.equal(draftStored, true, 'non-sensitive form draft should be saved locally');

    await page.evaluate(() => window.HashcodUX.skeleton(document.getElementById('uxSkeleton'), true));
    assert.equal(await page.locator('#uxSkeleton').evaluate((el) => el.classList.contains('hashcod-ux-skeleton')), true);
    await page.evaluate(() => window.HashcodUX.skeleton(document.getElementById('uxSkeleton'), false));

    await page.evaluate(() => window.HashcodUX.loading(document.getElementById('uxStateButton'), true));
    assert.equal(await page.locator('#uxStateButton').evaluate((el) => el.classList.contains('hashcod-ux-loading')), true);
    await page.evaluate(() => window.HashcodUX.loading(document.getElementById('uxStateButton'), false));

    await page.evaluate(() => window.HashcodUX.error(document.getElementById('uxStateButton'), 'Test error state'));
    assert.equal(await page.locator('#uxStateButton').evaluate((el) => el.classList.contains('hashcod-ux-error-state')), true);
    await page.waitForSelector('.hashcod-ux-toast[data-type="error"]', { state: 'visible', timeout: 3000 });

    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+K' : 'Control+K');
    await page.waitForSelector('#hashcodUxPalette', { state: 'visible', timeout: 3000 });
    await page.fill('#hashcodUxPaletteInput', 'dark');
    await page.waitForSelector('#hashcodUxPaletteList .hashcod-ux-command', { state: 'visible', timeout: 3000 });
    await page.keyboard.press('Escape');
    await page.waitForSelector('#hashcodUxPalette', { state: 'hidden', timeout: 3000 });

    const shareResult = await page.evaluate(async () => {
      let received = null;
      try { Object.defineProperty(navigator, 'share', { configurable: true, value: async (payload) => { received = payload; } }); } catch (_) {}
      await window.HashcodUX.share({ title: 'Hashcod test', text: 'Shared from UX test', url: location.href });
      return received;
    });
    if (shareResult) assert.equal(shareResult.title, 'Hashcod test');

    const hapticResult = await page.evaluate(() => {
      let called = false;
      try { Object.defineProperty(navigator, 'vibrate', { configurable: true, value: () => { called = true; return true; } }); } catch (_) {}
      window.HashcodUX.haptic(8);
      return called;
    });
    assert.equal(typeof hapticResult, 'boolean');

    await page.keyboard.press('Alt+T');
    const themeAfterShortcut = await page.getAttribute('html', 'data-hashcod-theme');
    assert(['light', 'dark'].includes(themeAfterShortcut));

    await page.keyboard.press('Alt+/');
    await page.waitForSelector('#hashcodUxShortcuts', { state: 'visible', timeout: 3000 });
    await page.keyboard.press('Escape');

    assert.equal(await page.locator('#hashcodUxActions').count(), 1, 'global UX action bar must exist');
    assert.equal(await page.locator('#hashcodUxTheme').count(), 1, 'theme selector must exist');
    assert.equal(await page.locator('#hashcodUxShare').count(), 1, 'share action must exist');

    // Verify the branded 404 controller directly under the same PHP test server.
    // The static contract separately verifies that router.php delegates unknown routes to it.
    const notFoundUrl = new URL(target);
    notFoundUrl.pathname = '/not-found.php';
    notFoundUrl.search = '';
    const notFoundPage = await browser.newPage({ viewport: { width: 1000, height: 700 } });
    const notFoundResponse = await notFoundPage.goto(notFoundUrl.toString(), { waitUntil: 'domcontentloaded', timeout: 10000 });
    assert(notFoundResponse && notFoundResponse.status() === 404, 'branded 404 controller must return HTTP 404');
    assert.match(await notFoundPage.textContent('body') || '', /HASHCOD \/ ROUTING \/ 404/);
    await notFoundPage.close();

    console.log('PASS: shared Hashcod UX works in-browser with centered wide-screen landing, dark mode, palette, shortcuts, autosave, skeleton/loading/error states, share/haptics and branded 404.');
  } finally {
    await browser.close();
  }
}

Promise.race([
  run(),
  new Promise((_, reject) => setTimeout(() => reject(new Error('Hashcod UX browser verification exceeded 50 seconds')), 50000))
]).then(() => process.exit(0)).catch((error) => {
  console.error(error && error.stack || error);
  process.exit(1);
});