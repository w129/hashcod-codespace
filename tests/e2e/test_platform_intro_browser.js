'use strict';

const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const {execFileSync}=require('node:child_process');
const path=require('node:path');

const target=process.env.HASHCOD_FIRST_SCREEN_URL||'http://127.0.0.1:8097/';

// Poll through the isolated automation world without unsafe-eval under CSP.
async function waitFor(page,predicate,arg,options){
  if(arg&&typeof arg==='object'&&'timeout' in arg){options=arg;arg=undefined;}
  const deadline=Date.now()+(options?.timeout||15000);
  while(Date.now()<deadline){if(await page.evaluate(predicate,arg))return;await page.waitForTimeout(50);}
  throw new Error('Timed out waiting for browser state: '+predicate.toString());
}


(async()=>{
  const browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  // Ordinary UI checks run after a legitimate local server-issued period.
  // Dedicated period/security suites test selection, renewal and forged cookies.
  const localUrl=new URL(target);
  if(['127.0.0.1','localhost'].includes(localUrl.hostname)){
    const expiry=Math.floor(Date.now()/1000)+86400;
    const payload={kind:'platform-period-v1',host:localUrl.host,state:'active',subscription:{tier:'pro',expiresAt:Math.floor(Date.now()/1000)+864000},days:10,expiresAt:expiry,proExpiresAt:expiry,token:'first-screen-test-period'};
    const cookie=execFileSync(process.env.PHP_BIN||'php',['-r',"require 'mldsa-access.php'; echo mldsaSeal(json_decode($argv[1],true));",JSON.stringify(payload)],{cwd:path.resolve(__dirname,'../..'),encoding:'utf8'}).trim();
    await page.context().addCookies([{name:'hashcod_platform_period_v1',value:cookie,url:localUrl.origin,httpOnly:true,sameSite:'Strict'}]);
    const consentPayload={kind:'policy-consent-v1',host:localUrl.host,version:'2026.09.18-2',receipt:'0b9c1f3e-1a2b-4c3d-8e4f-5a6b7c8d9e0f',acceptedAt:Math.floor(Date.now()/1000)};
    const consentCookie=execFileSync(process.env.PHP_BIN||'php',['-r',"require 'mldsa-access.php'; echo mldsaSeal(json_decode($argv[1],true));",JSON.stringify(consentPayload)],{cwd:path.resolve(__dirname,'../..'),encoding:'utf8'}).trim();
    await page.context().addCookies([{name:'hashcod_policy_consent_v1',value:consentCookie,url:localUrl.origin,httpOnly:true,sameSite:'Strict'}]);
    await page.route('**/api/platform-period',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,state:'active',subscription:{tier:'pro',expiresAt:Math.floor(Date.now()/1000)+864000},days:10,expiresAt:expiry,serverNow:Math.floor(Date.now()/1000)})}));
    await page.route('**/api/hashcod-shared-*',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,files:[],state:{},text:'',updatedAt:0})}));
  }
  const componentErrors = [];
  page.on('pageerror', error => componentErrors.push(error.message));
  const W = 1672, H = 941, BOX = { x: 1553, y: 704, w: 93, h: 93 }; // the button drawn in the picture
  const near = (a, b, tol, msg) => assert(Math.abs(a - b) <= tol, `${msg}: ${a} vs ${b}`);
  // Without ?intro=1 automated browsers skip the welcome, so every other suite keeps testing the platform.
  await page.goto(target, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#d5CenterEmptyStateAction', { timeout: 20000 });
  assert.equal(await page.locator('#hashcodPlatformIntro').count(), 0, 'webdriver sessions skip the welcome');
  for (const [vw, vh] of [[1440, 900], [1920, 1080], [2560, 1080], [390, 844], [1280, 400]]) {
    await page.setViewportSize({ width: vw, height: vh });
    await page.goto(target + '?intro=1', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#hashcodPlatformIntro .hpi-terrain', { state: 'attached' });
    await page.waitForTimeout(700); // entrance animation
    const m = await page.evaluate(() => {
      const r = el => { const b = document.querySelector(el).getBoundingClientRect(); return { l: b.left, t: b.top, w: b.width, h: b.height, r: b.right, b: b.bottom }; };
      return { vw: innerWidth, vh: innerHeight, root: r('#hashcodPlatformIntro'), img: r('.hpi-terrain'), btn: r('#hashcodPlatformIntroEnter'),
        z: getComputedStyle(document.querySelector('#hashcodPlatformIntro')).zIndex, over: getComputedStyle(document.documentElement).overflow,
        focused: document.activeElement && document.activeElement.id };
    });
    assert(m.root.w === vw && m.root.h === vh, `${vw}x${vh}: the welcome fills the screen`);
    assert(m.img.l <= 0.5 && m.img.t <= 0.5 && m.img.r >= vw - 0.5 && m.img.b >= vh - 0.5, `${vw}x${vh}: the animation fills the whole screen`);
    assert(m.btn.w >= 44 && Math.abs(m.btn.w - m.btn.h) < 1, `${vw}x${vh}: the button is a touch-sized square`);
    assert(m.btn.r <= vw + 0.5 && m.btn.b <= vh + 0.5 && m.btn.l >= 0 && m.btn.t >= 0, `${vw}x${vh}: the button is always fully visible`);
    assert(vw - m.btn.r < 40 && vh - m.btn.b < 40 && vw - m.btn.r >= 8 && vh - m.btn.b >= 8, `${vw}x${vh}: the button sits in the bottom-right corner`);
    const logo = await page.evaluate(() => { const i = document.querySelector('.hpi-logo'), b = i.getBoundingClientRect(); return { l: b.left, t: b.top, w: b.width, r: b.right, ok: i.complete && i.naturalWidth > 0 }; });
    assert(logo.ok && logo.l >= 0 && logo.t >= 0 && logo.l < 0.06 * vw + 16 && logo.t < 0.06 * vh + 40, `${vw}x${vh}: the logo sits at the top-left`);
    assert(logo.r <= vw, `${vw}x${vh}: the logo is fully visible`);
    assert.equal(m.focused, 'hashcodPlatformIntroEnter', 'the enter button takes focus');
    assert.equal(m.z, '2147483647'); assert.equal(m.over, 'hidden', 'the page behind does not scroll');
    assert.equal(await page.locator('#d5CenterEmptyStateAction').evaluate(el => el.closest('[inert]') !== null), true, 'the platform is inert behind the welcome');
  }
  // The logo is white on a transparent background (no plate): corners clear, ink white.
  await page.goto(target + '?intro=1', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.querySelector('.hpi-logo')?.complete);
  const logoPx = await page.evaluate(() => { const i = document.querySelector('.hpi-logo'), c = document.createElement('canvas'); c.width = i.naturalWidth; c.height = i.naturalHeight;
    const x = c.getContext('2d'); x.drawImage(i, 0, 0); const px = (a, b) => x.getImageData(a, b, 1, 1).data[3];
    let solid = 0, white = 0; const d = x.getImageData(0, 0, c.width, c.height).data; for (let k = 0; k < d.length; k += 4) if (d[k + 3] > 240) { solid += 1; if (d[k] > 250 && d[k + 1] > 250 && d[k + 2] > 250) white += 1; }
    return { corners: [px(0, 0), px(c.width - 1, 0), px(0, c.height - 1), px(c.width - 1, c.height - 1)], solid: solid / (d.length / 4), white: solid ? white / solid : 0 }; });
  assert.deepEqual(logoPx.corners, [0, 0, 0, 0], 'logo corners are transparent');
  assert(logoPx.solid > 0.05 && logoPx.solid < 0.5 && logoPx.white > 0.99, 'logo ink is opaque and white');
  // Button icon is white like the logo.
  assert.equal(await page.$eval('#hashcodPlatformIntroEnter', b => getComputedStyle(b).color), 'rgb(255, 255, 255)', 'button icon is white');
  // Wire Terrain runs: frames advance and white wireframe pixels are drawn on black.
  await page.goto(target + '?intro=1', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.HashcodPlatformIntroTerrain && window.HashcodPlatformIntroTerrain.frames > 20, null, { timeout: 20000 });
  const shot = await page.locator('.hpi-terrain').screenshot();
  assert(shot.length > 5000, 'the terrain draws visible wireframe lines');
  // Reduced motion draws one still frame and stops.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(target + '?intro=1', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.HashcodPlatformIntroTerrain && window.HashcodPlatformIntroTerrain.frames >= 1, null, { timeout: 20000 });
  await page.waitForTimeout(500);
  assert(await page.evaluate(() => window.HashcodPlatformIntroTerrain.frames) <= 2, 'reduced motion: the terrain stays still');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  // Pressing the button lifts the welcome and hands the page to the platform.
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(target + '?intro=1', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#hashcodPlatformIntroEnter');
  const done = page.evaluate(() => new Promise(resolve => window.addEventListener('hashcod:platform-intro-done', () => resolve(true), { once: true })));
  await page.click('#hashcodPlatformIntroEnter');
  assert.equal(await done, true, 'the intro announces that it is done');
  assert.equal(await page.locator('#hashcodPlatformIntro').count(), 0, 'the welcome is removed');
  assert.equal(await page.evaluate(() => document.documentElement.style.overflow + document.body.style.overflow), '', 'page scrolling is restored');
  assert.equal(await page.locator('#d5CenterEmptyStateAction').evaluate(el => el.closest('[inert]') !== null), false, 'the platform is interactive again');
  assert.deepEqual(componentErrors, []);
  console.log('Platform intro: OK');
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
