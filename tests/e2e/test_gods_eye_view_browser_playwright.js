'use strict';

const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const target = process.env.GEV_TEST_URL || 'http://127.0.0.1:8099/laragon-local-entry.php';

function mockCelestrakPayload() {
  return [{
    OBJECT_NAME: 'ISS (ZARYA)',
    OBJECT_ID: '1998-067A',
    EPOCH: new Date().toISOString().replace(/Z$/, ''),
    MEAN_MOTION: 15.49315858,
    ECCENTRICITY: 0.00045965,
    INCLINATION: 51.6332,
    RA_OF_ASC_NODE: 288.5889,
    ARG_OF_PERICENTER: 205.0015,
    MEAN_ANOMALY: 155.0751,
    EPHEMERIS_TYPE: 0,
    CLASSIFICATION_TYPE: 'U',
    NORAD_CAT_ID: 25544,
    ELEMENT_SET_NO: 999,
    REV_AT_EPOCH: 57211,
    BSTAR: 0.0001560528,
    MEAN_MOTION_DOT: 0.00008252,
    MEAN_MOTION_DDOT: 0
  }];
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  try {
    await page.route('**/*', async (route) => {
      const url = new URL(route.request().url());
      if (url.hostname === '127.0.0.1' || url.hostname === 'localhost') {
        await route.continue();
        return;
      }
      if (url.hostname === 'celestrak.org') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockCelestrakPayload())
        });
        return;
      }
      await route.abort();
    });

    const response = await page.goto(target, { waitUntil: 'commit', timeout: 10000 });
    assert(response && response.status() === 200, 'local Hashcod UI must return HTTP 200');
    await page.waitForSelector('#authOverlay', { state: 'attached', timeout: 15000 });
    await page.evaluate(() => {
      localStorage.clear();
      const overlay = document.getElementById('authOverlay');
      overlay.classList.remove('hidden');
      overlay.style.display = 'flex';
      overlay.style.visibility = 'visible';
      overlay.style.opacity = '1';
      document.body.classList.add('auth-locked');
      document.body.classList.remove('boot-locked');
    });

    await page.waitForFunction(() => (
      window.HashcodVectorTray &&
      typeof window.HashcodVectorTray.mount === 'function' &&
      window.HashcodGodsEyeView &&
      typeof window.HashcodGodsEyeView.diagnostics === 'function' &&
      window.HashcodSatelliteOrbits &&
      typeof window.HashcodSatelliteOrbits.diagnostics === 'function'
    ), { timeout: 15000 });

    await page.evaluate(() => window.HashcodVectorTray.mount());
    const slotSelector = '#hashcodVectorTray [data-vector-tray-slot="5"]';
    await page.waitForSelector(slotSelector, { state: 'visible', timeout: 10000 });

    const slot = await page.$eval(slotSelector, (button) => ({
      disabled: Boolean(button.disabled),
      toolId: button.getAttribute('data-tool-id'),
      label: button.getAttribute('aria-label')
    }));
    assert.equal(slot.disabled, false);
    assert.equal(slot.toolId, 'gods-eye-view');
    assert.match(slot.label || '', /God's Eye View/i);

    const pagesBefore = page.context().pages().length;
    await page.click(slotSelector);
    await page.waitForFunction(() => {
      const modal = document.getElementById('hashcodGodsEyeView');
      return Boolean(modal && modal.open && !modal.hidden);
    }, { timeout: 10000 });
    await page.waitForSelector('#hashcodGodsEyeCanvas', { state: 'visible', timeout: 10000 });
    await page.waitForSelector('#hashcodGevSearchInput', { state: 'visible', timeout: 10000 });
    await page.waitForSelector('#hashcodOrbitOpen', { state: 'visible', timeout: 10000 });

    const diagnostics = await page.evaluate(() => window.HashcodGodsEyeView.diagnostics());
    assert.equal(diagnostics.ready, true);
    assert.equal(diagnostics.toolId, 'gods-eye-view');
    assert.equal(diagnostics.slot, 5);
    assert.equal(diagnostics.profile, 'HASHCOD-GEV-1');
    assert.equal(diagnostics.modalOpen, true);
    assert.equal(diagnostics.canvasFound, true);
    assert.equal(diagnostics.buttonToolId, 'gods-eye-view');
    assert.equal(diagnostics.inPlatform, true);
    assert.equal(diagnostics.externalWindowRequired, false);
    assert.equal(page.context().pages().length, pagesBefore, 'opening GEV must not create an external browser tab');

    const box = await page.locator('#hashcodGodsEyeCanvas').boundingBox();
    assert(box && box.width > 300 && box.height > 300, 'GEV canvas must occupy a real viewport');

    await page.click('#hashcodOrbitOpen');
    await page.waitForSelector('#hashcodOrbitOverlay', { state: 'visible', timeout: 10000 });
    await page.waitForFunction(() => {
      const orbit = window.HashcodSatelliteOrbits.diagnostics();
      return orbit.ready && orbit.satelliteCount >= 1;
    }, { timeout: 10000 });
    await page.waitForSelector('[data-orbit-id="25544"]', { state: 'visible', timeout: 10000 });
    await page.click('[data-orbit-id="25544"]');

    await page.waitForFunction(() => {
      const orbit = window.HashcodSatelliteOrbits.diagnostics();
      return orbit.selectedPosition &&
        Number.isFinite(orbit.selectedPosition.lat) &&
        Number.isFinite(orbit.selectedPosition.lon) &&
        Number.isFinite(orbit.selectedPosition.altitude);
    }, { timeout: 10000 });

    const orbitDiagnostics = await page.evaluate(() => window.HashcodSatelliteOrbits.diagnostics());
    assert.equal(orbitDiagnostics.source, 'CelesTrak GP/OMM');
    assert.equal(orbitDiagnostics.group, 'stations');
    assert.equal(orbitDiagnostics.selectedId, '25544');
    assert.equal(orbitDiagnostics.propagation, 'Kepler-J2-display');
    assert.equal(orbitDiagnostics.operationalGrade, false);
    assert(orbitDiagnostics.selectedPosition.lat >= -90 && orbitDiagnostics.selectedPosition.lat <= 90, 'latitude must be geodetic');
    assert(orbitDiagnostics.selectedPosition.lon >= -180 && orbitDiagnostics.selectedPosition.lon <= 180, 'longitude must be normalized');
    assert(orbitDiagnostics.selectedPosition.altitude > 100 && orbitDiagnostics.selectedPosition.altitude < 1000, 'ISS-like altitude must be plausible');

    const orbitDetails = await page.textContent('#hashcodOrbitDetails');
    assert.match(orbitDetails || '', /NORAD 25544/);
    assert.match(orbitDetails || '', /LATITUDE/);
    assert.match(orbitDetails || '', /LONGITUDE/);
    assert.match(orbitDetails || '', /ALTITUDE/);
    assert.equal(page.context().pages().length, pagesBefore, 'Orbitron tracker must remain in the same Hashcod window');

    await page.click('#hashcodOrbitFocusGlobe');
    await page.click('#hashcodOrbitClose');
    await page.click('[data-gev-style="nvg"]');
    await page.click('#hashcodGevReset');
    await page.click('#hashcodGevClose');
    await page.waitForFunction(() => {
      const modal = document.getElementById('hashcodGodsEyeView');
      return modal && (!modal.open || modal.hidden);
    }, { timeout: 5000 });

    console.log('PASS: sixth cube opens God\'s Eye View and its Orbitron satellite tracker reports live-style coordinates without another tab.');
  } finally {
    await browser.close();
  }
}

Promise.race([
  run(),
  new Promise((_, reject) => setTimeout(() => reject(new Error('Gods Eye View browser verification exceeded 45 seconds')), 45000))
]).then(() => process.exit(0)).catch((error) => {
  console.error(error && error.stack || error);
  process.exit(1);
});
