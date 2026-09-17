'use strict';

const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const target = process.env.GEV_TEST_URL || 'http://127.0.0.1:8099/laragon-local-entry.php';

function epoch() {
  return new Date().toISOString().replace(/Z$/, '');
}

function mockCelestrakPayload() {
  return [{
    OBJECT_NAME: 'ISS (ZARYA)',
    OBJECT_ID: '1998-067A',
    EPOCH: epoch(),
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

function mockStarlinkPayload() {
  return [
    {
      OBJECT_NAME: 'STARLINK-1008', OBJECT_ID: '2019-074B', EPOCH: epoch(), NORAD_CAT_ID: 44714,
      MEAN_MOTION: 15.65, ECCENTRICITY: 0.00022, INCLINATION: 53.15, RA_OF_ASC_NODE: 120.2,
      ARG_OF_PERICENTER: 88.1, MEAN_ANOMALY: 271.9, BSTAR: 0.00021
    },
    {
      OBJECT_NAME: 'STARLINK-1012', OBJECT_ID: '2019-074F', EPOCH: epoch(), NORAD_CAT_ID: 44718,
      MEAN_MOTION: 15.64, ECCENTRICITY: 0.00037, INCLINATION: 53.15, RA_OF_ASC_NODE: 210.4,
      ARG_OF_PERICENTER: 42.4, MEAN_ANOMALY: 317.5, BSTAR: 0.00018
    },
    {
      OBJECT_NAME: 'STARLINK-1017', OBJECT_ID: '2019-074L', EPOCH: epoch(), NORAD_CAT_ID: 44723,
      MEAN_MOTION: 15.39, ECCENTRICITY: 0.00030, INCLINATION: 53.05, RA_OF_ASC_NODE: 301.6,
      ARG_OF_PERICENTER: 121.8, MEAN_ANOMALY: 238.2, BSTAR: 0.00015
    }
  ];
}

function mockSpaceXMetadata() {
  return {
    docs: [{
      version: 'v1.0',
      launch: 'mock-launch-id',
      spaceTrack: {
        NORAD_CAT_ID: 44714,
        OBJECT_NAME: 'STARLINK-1008',
        LAUNCH_DATE: '2019-11-11',
        SITE: 'AFETR'
      }
    }],
    totalDocs: 1,
    limit: 1,
    page: 1,
    totalPages: 1
  };
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.addInitScript(() => { window.__hashcodAllowLegacyAuthDiagnostics = true; });
  try {
    await page.route('**/*', async (route) => {
      const url = new URL(route.request().url());
      if (url.hostname === '127.0.0.1' || url.hostname === 'localhost') {
        await route.continue();
        return;
      }
      if (url.hostname === 'celestrak.org') {
        const isStarlink = String(url.searchParams.get('GROUP') || '').toUpperCase() === 'STARLINK';
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(isStarlink ? mockStarlinkPayload() : mockCelestrakPayload())
        });
        return;
      }
      if (url.hostname === 'api.spacexdata.com') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockSpaceXMetadata())
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
      typeof window.HashcodSatelliteOrbits.diagnostics === 'function' &&
      window.HashcodStarlinkLayer &&
      typeof window.HashcodStarlinkLayer.diagnostics === 'function'
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
    await page.waitForSelector('#hashcodStarlinkOpen', { state: 'visible', timeout: 10000 });

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
      return orbit.selectedPosition && Number.isFinite(orbit.selectedPosition.lat) && Number.isFinite(orbit.selectedPosition.lon);
    }, { timeout: 10000 });
    const orbitDiagnostics = await page.evaluate(() => window.HashcodSatelliteOrbits.diagnostics());
    assert.equal(orbitDiagnostics.selectedId, '25544');
    assert.equal(orbitDiagnostics.operationalGrade, false);
    await page.click('#hashcodOrbitClose');

    await page.click('#hashcodStarlinkOpen');
    await page.waitForSelector('#hashcodStarlinkOverlay', { state: 'visible', timeout: 10000 });
    await page.waitForFunction(() => {
      const starlink = window.HashcodStarlinkLayer.diagnostics();
      return starlink.ready && starlink.satelliteCount === 3 && starlink.positionedCount === 3;
    }, { timeout: 10000 });
    await page.waitForSelector('[data-starlink-id="44714"]', { state: 'visible', timeout: 10000 });
    await page.click('[data-starlink-id="44714"]');
    await page.waitForFunction(() => {
      const starlink = window.HashcodStarlinkLayer.diagnostics();
      return starlink.selectedId === '44714' && starlink.selectedPosition &&
        Number.isFinite(starlink.selectedPosition.lat) &&
        Number.isFinite(starlink.selectedPosition.lon) &&
        Number.isFinite(starlink.selectedPosition.altitude);
    }, { timeout: 10000 });

    const starlinkDiagnostics = await page.evaluate(() => window.HashcodStarlinkLayer.diagnostics());
    assert.equal(starlinkDiagnostics.satelliteCount, 3);
    assert.equal(starlinkDiagnostics.positionedCount, 3);
    assert.equal(starlinkDiagnostics.selectedId, '44714');
    assert.equal(starlinkDiagnostics.metadataApiCurrent, false);
    assert.equal(starlinkDiagnostics.inPlatform, true);
    assert.equal(starlinkDiagnostics.externalWindowRequired, false);
    assert.equal(starlinkDiagnostics.maxConstellationObjects, 15000);
    assert(starlinkDiagnostics.selectedPosition.lat >= -90 && starlinkDiagnostics.selectedPosition.lat <= 90);
    assert(starlinkDiagnostics.selectedPosition.lon >= -180 && starlinkDiagnostics.selectedPosition.lon <= 180);
    assert(starlinkDiagnostics.selectedPosition.altitude > 100 && starlinkDiagnostics.selectedPosition.altitude < 2000);

    await page.waitForFunction(() => /SpaceX archive/.test(document.getElementById('hashcodStarlinkDetails').textContent || ''), { timeout: 10000 });
    const starlinkDetails = await page.textContent('#hashcodStarlinkDetails');
    assert.match(starlinkDetails || '', /NORAD 44714/);
    assert.match(starlinkDetails || '', /LATITUDE/);
    assert.match(starlinkDetails || '', /LONGITUDE/);
    assert.match(starlinkDetails || '', /SpaceX archive/);
    assert.equal(page.context().pages().length, pagesBefore, 'Starlink constellation tracker must remain in the same Hashcod window');

    await page.click('#hashcodStarlinkFocusGlobe');
    await page.click('#hashcodStarlinkClose');
    await page.click('[data-gev-style="nvg"]');
    await page.click('#hashcodGevReset');
    await page.click('#hashcodGevClose');
    await page.waitForFunction(() => {
      const modal = document.getElementById('hashcodGodsEyeView');
      return modal && (!modal.open || modal.hidden);
    }, { timeout: 5000 });

    console.log('PASS: God\'s Eye View tracks Orbitron objects and a SpaceX/Starlink constellation layer without opening another tab.');
  } finally {
    await browser.close();
  }
}

Promise.race([
  run(),
  new Promise((_, reject) => setTimeout(() => reject(new Error('Gods Eye View browser verification exceeded 55 seconds')), 55000))
]).then(() => process.exit(0)).catch((error) => {
  console.error(error && error.stack || error);
  process.exit(1);
});
