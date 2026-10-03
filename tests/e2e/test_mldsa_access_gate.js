'use strict';

const fs=require('node:fs');
const assert=require('node:assert/strict');

const gate=fs.readFileSync('mldsa-access.php','utf8');
const api=fs.readFileSync('mldsa-access-api.php','utf8');
const css=fs.readFileSync('components/mldsa-access-gate.css','utf8');
const js=fs.readFileSync('components/mldsa-access-gate.js','utf8');
const component=fs.readFileSync('first-screen-branched-menu-build/BranchedMenu.jsx','utf8');
const componentCss=fs.readFileSync('first-screen-branched-menu-build/BranchedMenu.css','utf8');
const entry=fs.readFileSync('first-screen-branched-menu-build/entry.jsx','utf8');
const pkg=JSON.parse(fs.readFileSync('first-screen-branched-menu-build/package.json','utf8'));
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

// Existing security backend remains intact.
assert.strictEqual(pub.length,3456,'ML-DSA-87 public key Base64 length must be exact');
assert.strictEqual(Buffer.from(pub,'base64').length,2592,'ML-DSA-87 public key must decode to 2592 bytes');
assert.strictEqual(crc32(pub).toString(16).padStart(8,'0'),'25eb08f5','production ML-DSA-87 public key checksum mismatch');
assert(gate.includes("function mldsaConsumeJti"),'atomic anti-replay JTI consumption missing');
assert(gate.includes("function mldsaOriginAllowed"),'same-origin request binding missing');
assert(api.includes("protocol'=>'ML-DSA-87-2PHASE"),'two-phase protocol marker missing');
assert(api.includes("replay_detected"),'replay rejection missing');
assert(router.includes("'/api/mldsa-access'"),'ML-DSA API route missing');

// Root stays on the first presentation.
assert(l8.includes('Single-screen mode: the root route permanently renders only the'),'single-screen root contract missing');
assert(l8.includes("echo mldsaGateHtml(l8_public_base_path(), true);"),'first-screen renderer missing');
assert(!l8.includes('$entryPass = l8_entry_intro_consume();'),'one-shot platform entry pass must no longer be used');

// The former white access window must be gone from first-screen markup.
assert(gate.includes('id="d5FirstBranchedMenuStage"'),'BranchedMenu stage missing');
assert(gate.includes('id="d5FirstBranchedMenuMount"'),'React BranchedMenu mount missing');
assert(gate.includes('data-react-bits-component="BranchedMenu"'),'React Bits component marker missing');
assert(!gate.includes('class="access-card entry-access-card"'),'former white access card must be removed');
assert(!gate.includes('id="d5VerifyText">Entrar</span>'),'former Entrar button must be removed');
assert(!gate.includes('id="d5EntryStatCard"'),'former Monthly revenue card must be removed');
assert(!gate.includes('Acceso a Hashcod Codespace</h1>'),'former window title must be removed from visible markup');
assert(!gate.includes('Esta ventana aparece primero antes de entrar a la plataforma.'),'former window description must be removed');
assert(!gate.includes('id="d5TiltCardDemo"'),'slot purchase TiltCard must be removed');
assert(!gate.includes('Current price to purchase a slot'),'slot purchase card title must be removed');
assert(!gate.includes('id="d5SavedChatDemo"'),'Saved Messages card must be removed');
assert(!gate.includes('Saved Messages</h3>'),'Saved Messages title must be removed');


assert(gate.includes('components/first-screen-branched-menu.bundle.css?v=20261003-faq1'),'BranchedMenu CSS bundle must load');
assert(gate.includes('components/first-screen-branched-menu.bundle.js?v=20261003-faq1'),'BranchedMenu JS bundle must load');
assert(css.includes('.entry-branched-menu-stage{'),'BranchedMenu host styling missing');
assert(css.includes('background:transparent'),'BranchedMenu host must not have the old black background');
assert(css.includes('color:#0a0a0a'),'BranchedMenu host text color must be black');
assert(css.includes('--bm-muted:#0a0a0a'),'idle BranchedMenu text must remain black');
assert(css.includes('border-radius:0'),'former rounded window chrome must not survive');
assert(css.includes('box-shadow:none'),'former window shadow must not survive');

// Exact supplied component/runtime contract.
assert(component.includes("import { HugeiconsIcon } from '@hugeicons/react'"),'Hugeicons renderer missing');
assert(component.includes("import './BranchedMenu.css'"),'component CSS import missing');
assert(component.includes('ResizeObserver'),'BranchedMenu marker resize behavior missing');
assert(component.includes('strokeDashoffset'),'BranchedMenu branch animation missing');
for(const selector of [
  '.branched-menu::before',
  '.branched-menu__marker[data-on]',
  '.branched-menu__section[data-open] .branched-menu__body',
  '.branched-menu__reach',
  '.branched-menu__item[data-active]'
]){
  assert(componentCss.includes(selector),`component CSS missing ${selector}`);
}
assert(componentCss.includes('fill: none'),'SVG branches must remain unfilled');
assert(componentCss.includes('stroke-width: var(--bm-line-w)'),'SVG stroke width binding missing');

for(const token of [
  "label: 'Getting started'",
  "{ value: 'faq', label: 'FAQ', icon: FaqIcon }",
  "{ value: 'quick', label: 'Quick start', icon: Rocket01Icon }",
  "{ value: 'config', label: 'Configuration', icon: Settings02Icon }",
  "label: 'Components'",
  "{ value: 'buttons', label: 'Buttons' }",
  "{ value: 'overlays', label: 'Overlays' }",
  'defaultOpen={[0]}',
  'defaultActive="quick"',
  'color="#0a0a0a"',
  'accentColor="#0a0a0a"',
  'lineColor="#0a0a0a"',
  'width={240}',
  'rowHeight={36}',
  'indent={40}',
  'trunk={14}',
  'radius={10}',
  'lineWidth={1.5}',
  'fontSize={14}',
  'drawDuration={400}',
  'foldDuration={300}'
]){
  assert(entry.includes(token),`requested BranchedMenu usage missing: ${token}`);
}
assert(entry.includes("document.getElementById('d5FirstBranchedMenuMount')"),'entry must mount into first-screen host');
assert(entry.includes("url.hash = value"),'onSelect navigate behavior missing');
assert(entry.includes('const FaqIcon = ('),'custom FAQ SVG component missing');
assert(entry.includes('viewBox="0 0 48 48"'),'custom FAQ SVG viewBox changed');
assert(entry.includes('width="16"')&&entry.includes('height="16"'),'custom FAQ SVG must be adapted to 16x16');
assert(entry.includes('fill="currentColor"'),'custom FAQ SVG must inherit menu ink');
assert(!entry.includes("label: 'Installation'"),'Installation label must be removed');
assert.equal(pkg.dependencies['@hugeicons/react'],'1.1.9','@hugeicons/react dependency changed');
assert.equal(pkg.dependencies['@hugeicons/core-free-icons'],'4.3.5','Hugeicons icon package changed');
assert.equal(pkg.dependencies.react,'19.2.4','React dependency changed');

// Existing first-screen effects remain intact.
assert(gate.includes('id="d5RotatingTextHero"'),'RotatingText host missing');
assert(gate.includes('id="d5SplashCursorBackground"'),'SplashCursor host missing');
assert(rotatingCss.includes('background:#0a0a0a')&&rotatingCss.includes('color:#fff'),'RotatingText black treatment missing');
assert(rotatingJs.includes('window.HashcodRotatingText'),'RotatingText controller missing');
assert(splashCss.includes('.entry-splash-cursor{')&&splashCss.includes('pointer-events:none'),'SplashCursor background styling missing');
assert(splashJs.includes("window.addEventListener('mousemove', handleMouseMove)"),'SplashCursor pointer interaction missing');

// Later screens remain retired.
assert(!gate.includes('data-entry-panel="2"'),'second entry panel must remain removed');
assert(!gate.includes('data-entry-panel="3"'),'third entry panel must remain removed');
assert(!gate.includes('data-entry-panel="4"'),'fourth entry panel must remain removed');
assert(!js.includes('entrySetLevel(2);'),'runtime must not advance to a retired screen');
assert(!js.includes("url.searchParams.set('hashcod_enter','1')"),'retired platform transition must stay removed');

console.log('✓ First screen uses the exact React Bits BranchedMenu instead of the white access window');
