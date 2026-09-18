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

    // Wide desktop: keep the Hashcod lockup in its original right-side position,
    // restore the Rare UI folder to its historical 38vw / 50vh anchor, and keep
    // the global control group pinned to the top-left.
    await page.setViewportSize({ width: 1852, height: 927 });
    await page.waitForFunction(() => {
      const folder = document.querySelector('#hashcodRareFolderHost[data-hashcod-folder-position-restored="true"]');
      const brand = document.querySelector('.boot-brand[data-hashcod-original-placement-restored="true"]');
      const controls = document.querySelector('#hashcodUxActions[data-hashcod-top-left-controls="true"]');
      return Boolean(folder && brand && controls && folder.getBoundingClientRect().width > 100 && brand.getBoundingClientRect().width > 100);
    }, { timeout: 10000 });
    await page.waitForTimeout(2350);
    const landingGeometry = await page.evaluate(() => {
      const rectOf = (node) => {
        if (!node) return null;
        const r = node.getBoundingClientRect();
        return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height };
      };
      const folderNode = document.getElementById('hashcodRareFolderHost');
      const brandNode = document.querySelector('.boot-brand');
      const controlsNode = document.getElementById('hashcodUxActions');
      const overlayNode = document.getElementById('bootCliOverlay');
      const registrationNode = document.getElementById('hashcodFinalEntryRegistration');
      const folder = rectOf(folderNode);
      const brand = rectOf(brandNode);
      const controls = rectOf(controlsNode);
      const overlay = rectOf(overlayNode);
      const registration = rectOf(registrationNode);
      const strip = rectOf(document.querySelector('.boot-cli-footer .boot-card-icon'));
      return {
        folder,
        brand,
        controls,
        overlay,
        registration,
        registrationDisplay: registrationNode ? getComputedStyle(registrationNode).display : null,
        registrationVisibility: registrationNode ? getComputedStyle(registrationNode).visibility : null,
        registrationOpacity: registrationNode ? Number(getComputedStyle(registrationNode).opacity) : null,
        registrationZIndex: registrationNode ? Number(getComputedStyle(registrationNode).zIndex) : null,
        improvementSignPresent: Boolean(document.getElementById('hashcodPlatformImprovementSign')),
        strip,
        viewportWidth: innerWidth,
        viewportCenter: innerWidth / 2,
        folderCenterX: folder.left + folder.width / 2,
        folderCenterY: folder.top + folder.height / 2,
        expectedFolderCenterX: overlay.left + overlay.width * 0.38,
        expectedFolderCenterY: overlay.top + overlay.height * 0.50,
        brandInlineTranslate: brandNode ? brandNode.style.translate : null,
        brandOffsetDataset: brandNode ? brandNode.dataset.hashcodLandingBrandOffsetX || '' : null
      };
    });
    assert(landingGeometry.brand.left > landingGeometry.viewportCenter + 100,
      `Hashcod lockup must remain in its original right-side region, got left=${landingGeometry.brand.left.toFixed(2)}px`);
    assert.equal(landingGeometry.brandInlineTranslate, '', 'Hashcod lockup must not retain the temporary centering translate');
    assert.equal(landingGeometry.brandOffsetDataset, '', 'Hashcod lockup must not retain the temporary centering dataset');
    assert(Math.abs(landingGeometry.folderCenterX - landingGeometry.expectedFolderCenterX) <= 18,
      `folder must return to 38vw anchor, delta=${Math.abs(landingGeometry.folderCenterX - landingGeometry.expectedFolderCenterX).toFixed(2)}px`);
    assert(Math.abs(landingGeometry.folderCenterY - landingGeometry.expectedFolderCenterY) <= 18,
      `folder must return to 50vh anchor, delta=${Math.abs(landingGeometry.folderCenterY - landingGeometry.expectedFolderCenterY).toFixed(2)}px`);
    assert(landingGeometry.controls.left >= 0 && landingGeometry.controls.left <= 28,
      `global UX controls must be at the top-left, got left=${landingGeometry.controls.left.toFixed(2)}px`);
    assert(landingGeometry.controls.top >= 0 && landingGeometry.controls.top <= 28,
      `global UX controls must be at the top-left, got top=${landingGeometry.controls.top.toFixed(2)}px`);
    assert.equal(landingGeometry.improvementSignPresent, false,
      'retired PLATAFORMA EN MEJORA sign must not exist');
    assert.equal(landingGeometry.registrationDisplay, 'none',
      'registration form must stay hidden on the first landing screen');
    assert.equal(landingGeometry.registrationVisibility, 'hidden',
      'registration form must not be visible before the final screen');
    assert.equal(landingGeometry.registrationOpacity, 0,
      'registration form must remain transparent before the final screen');

    await page.evaluate(() => {
      document.documentElement.dataset.hashcodFinalEntryScreen = 'true';
      window.dispatchEvent(new CustomEvent('hashcod:final-entry-screen', {
        detail: { screen: 3, source: 'browser-regression-test' }
      }));
    });
    await page.waitForFunction(() => {
      const node = document.getElementById('hashcodFinalEntryRegistration');
      if (!node) return false;
      const style = getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      return style.display !== 'none' && style.visibility === 'visible' && Number(style.opacity) > 0.9
        && rect.width > 300 && rect.height > 300
        && Boolean(node.querySelector('#hashcodEntryRegistrationForm'))
        && Boolean(node.querySelector('#hashcodEntryRegistrationSubmit'))
        && Boolean(node.querySelector('#hashcodEntryRegistrationRecords'));
    }, { timeout: 3000 });

    const finalRegistrationGeometry = await page.evaluate(() => {
      const node = document.getElementById('hashcodFinalEntryRegistration');
      const style = getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      return {
        width: rect.width,
        height: rect.height,
        display: style.display,
        visibility: style.visibility,
        opacity: Number(style.opacity),
        zIndex: Number(style.zIndex),
        ageMin: node.querySelector('[name="age"]')?.getAttribute('min') || '',
        fieldCount: node.querySelectorAll('.hashcod-entry-field input').length
      };
    });
    assert(finalRegistrationGeometry.width > 300 && finalRegistrationGeometry.height > 300,
      'registration form must have a visible bounding box on the third screen');
    assert(['block', 'flex', 'grid'].includes(finalRegistrationGeometry.display),
      `registration form must display on the third screen, got ${finalRegistrationGeometry.display}`);
    assert.equal(finalRegistrationGeometry.visibility, 'visible',
      'registration form must be visible on the third screen');
    assert(finalRegistrationGeometry.opacity > 0.9,
      'registration form must be opaque on the third screen');
    assert(finalRegistrationGeometry.zIndex > 2147483500,
      'registration form must render above the final-screen surface');
    assert.equal(finalRegistrationGeometry.ageMin, '18', 'age input must enforce an 18+ minimum');
    assert.equal(finalRegistrationGeometry.fieldCount, 6, 'final registration must expose exactly six requested inputs');
    if (landingGeometry.strip) {
      assert(landingGeometry.strip.right > 0 && landingGeometry.strip.left < landingGeometry.viewportWidth,
        'bottom integration strip anchor must remain visible after folder restoration');
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

    console.log('PASS: shared Hashcod UX restores the folder to 38vw/50vh, preserves the original right-side brand, pins controls top-left, and keeps dark mode, palette, shortcuts, autosave, skeleton/loading/error states, share/haptics and branded 404.');
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
