'use strict';

const fs=require('node:fs');
const assert=require('node:assert/strict');

const gate=fs.readFileSync('mldsa-access.php','utf8');
const api=fs.readFileSync('mldsa-access-api.php','utf8');
const css=fs.readFileSync('components/mldsa-access-gate.css','utf8');
const js=fs.readFileSync('components/mldsa-access-gate.js','utf8');
const rotatingCss=fs.readFileSync('components/react-bits-rotating-text.css','utf8');
const rotatingJs=fs.readFileSync('components/react-bits-rotating-text.js','utf8');
const splashCss=fs.readFileSync('components/react-bits-splash-cursor.css','utf8');
const splashJs=fs.readFileSync('components/react-bits-splash-cursor.js','utf8');
const l8=fs.readFileSync('l8-html.php','utf8');
const router=fs.readFileSync('router.php','utf8');
const pub=fs.readFileSync('config/mldsa87-access-public.b64','utf8').replace(/\s+/g,'');

function crc32(str){
  let table=crc32.t;
  if(!table){
    table=crc32.t=Array.from({length:256},(_,n)=>{
      let c=n;
      for(let k=0;k<8;k++)c=(c&1)?(0xedb88320^(c>>>1)):(c>>>1);
      return c>>>0;
    });
  }
  let crc=0xffffffff;
  for(let i=0;i<str.length;i++)crc=table[(crc^str.charCodeAt(i))&255]^(crc>>>8);
  return (crc^0xffffffff)>>>0;
}

// Keep the existing ML-DSA security backend intact.
assert.strictEqual(pub.length,3456,'ML-DSA-87 public key Base64 length must be exact');
assert(/^[A-Za-z0-9+/]+$/.test(pub),'ML-DSA-87 public key contains invalid Base64 characters');
assert.strictEqual(crc32(pub).toString(16).padStart(8,'0'),'25eb08f5','production ML-DSA-87 public key checksum mismatch');
assert.strictEqual(Buffer.from(pub,'base64').length,2592,'ML-DSA-87 public key must decode to 2592 bytes');
assert(gate.includes("function mldsaConsumeJti"),'atomic anti-replay JTI consumption missing');
assert(gate.includes("function mldsaOriginAllowed"),'same-origin request binding missing');
assert(api.includes("protocol'=>'ML-DSA-87-2PHASE"),'two-phase protocol marker missing');
assert(api.includes("replay_detected"),'replay rejection missing');
assert(api.includes("origin_mismatch"),'origin mismatch rejection missing');
assert(api.includes("phase_mismatch"),'phase mismatch rejection missing');
assert(router.includes("'/api/mldsa-access'"),'ML-DSA API route missing');

// Root is permanently pinned to the first screen.
assert(l8.includes('Single-screen mode: the root route permanently renders only the'),'single-screen root contract missing');
assert(l8.includes("if ($file === 'index.php')"),'index first-screen branch missing');
assert(l8.includes("echo mldsaGateHtml(l8_public_base_path(), true);"),'first-screen renderer missing');
assert(!l8.includes('$entryPass = l8_entry_intro_consume();'),'one-shot platform entry pass must no longer be used');
assert(!l8.includes("$_GET['hashcod_enter']"),'hashcod_enter query must no longer unlock later screens');

// Preserve the requested first screen.
assert(gate.includes('data-entry-single-screen="true"'),'single-screen marker missing');
assert(gate.includes('data-entry-panel="1"'),'first panel missing');
assert(!gate.includes('data-entry-panel="2"'),'second entry panel must be removed');
assert(!gate.includes('data-entry-panel="3"'),'third entry panel must be removed');
assert(!gate.includes('data-entry-panel="4"'),'fourth entry panel must be removed');
assert(!gate.includes('id="d5EntryProductCard"'),'removed ProductCard screen must not remain in markup');
assert(!gate.includes('id="d5EntryUsageCard"'),'removed Usage screen must not remain in markup');
assert(!gate.includes('id="d5EntryFinish"'),'removed final-entry control must not remain in markup');

assert(gate.includes('Acceso a Hashcod Codespace'),'first-screen title missing');
assert(gate.includes('Esta ventana aparece primero antes de entrar a la plataforma.'),'original first-screen description changed');
assert(gate.includes('id="d5VerifyText">Entrar</span>'),'first-screen Entrar control missing');
assert(gate.includes('id="d5RotatingTextHero"'),'RotatingText first-screen host missing');
assert(gate.includes('<span class="entry-rotating-text-prefix">Creates like</span>'),'Creates like prefix missing');
assert(gate.includes('id="d5SplashCursorBackground"'),'SplashCursor first-screen host missing');
assert(gate.includes('data-color="#000000"'),'black SplashCursor configuration missing');
assert(gate.includes('id="d5EntryStatCard"'),'first-screen StatCard missing');
assert(css.includes('.entry-access-card{'),'first-screen card styling missing');
assert(rotatingCss.includes('background:#0a0a0a')&&rotatingCss.includes('color:#fff'),'RotatingText black treatment missing');
assert(rotatingJs.includes('window.HashcodRotatingText'),'RotatingText controller missing');
assert(splashCss.includes('.entry-splash-cursor{')&&splashCss.includes('pointer-events:none'),'SplashCursor background styling missing');
assert(splashJs.includes("window.addEventListener('mousemove', handleMouseMove)"),'SplashCursor pointer interaction missing');

// Frontend must remain on screen 1.
assert(js.includes('lockedToFirstScreen:true'),'first-screen click lock missing');
assert(js.includes('singleScreen:true'),'single-screen public state missing');
assert(!js.includes('entrySetLevel(2);'),'Entrar must not advance to level 2');
assert(!js.includes("url.searchParams.set('hashcod_enter','1')"),'frontend must not construct the retired platform transition');

console.log('✓ Hashcod root is permanently limited to the original first screen');
