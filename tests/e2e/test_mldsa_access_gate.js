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


assert(gate.includes('components/first-screen-branched-menu.bundle.css?v=20261003-textcard1'),'BranchedMenu CSS bundle must load');
assert(gate.includes('components/first-screen-branched-menu.bundle.js?v=20261003-textcard1'),'BranchedMenu JS bundle must load');
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
assert(entry.includes('const WorkspaceIcon = ('),'Workspace SVG icon component missing');
assert(entry.includes('viewBox="0 0 24 24"'),'Workspace SVG viewBox changed');
assert(entry.includes("{ value: 'workspace', label: 'Workspace', icon: WorkspaceIcon }"),'Workspace menu item missing');
assert(entry.includes('const TextCardIcon = ('),'Text Card SVG icon component missing');
assert(entry.includes('viewBox="0 0 64 64"'),'Text Card SVG viewBox changed');
assert(entry.includes("{ value: 'text-card', label: 'Text Card', icon: TextCardIcon }"),'Text Card menu item missing');
assert(gate.includes('id="d5WorkspaceModalBackdrop"'),'Workspace modal backdrop missing');
assert(gate.includes('id="d5TextEditorCard" class="liquid-text-editor" role="dialog" aria-modal="true" aria-hidden="true" aria-label="Workspace" hidden'),'Workspace editor must be natively hidden by default');
assert(gate.includes('id="d5WorkspaceClose"'),'Workspace close control missing');
assert(css.includes('.workspace-modal-backdrop{'),'Workspace modal backdrop CSS missing');
assert(css.includes('backdrop-filter:blur(28px)'),'Workspace backdrop must strongly blur the page');
assert(css.includes('body[data-hashcod-entry-intro="1"].workspace-modal-open #d5TextEditorCard'),'Workspace centered modal CSS missing');
assert(css.includes('body.workspace-modal-open > *:not(#d5WorkspaceModalBackdrop):not(#d5TextEditorCard)'),'Workspace must disable interaction with page content behind the veil');
assert(css.includes('background:rgba(255,255,255,.94)'),'Workspace veil must strongly hide background content');
assert(js.includes("if(detail.value==='workspace')"),'Workspace BranchedMenu action missing');
assert(js.includes('openWorkspaceModal();'),'Workspace action must open editor modal');
assert(js.includes('textEditorCard.hidden=false'),'Workspace open must remove native hidden');
assert(js.includes('textEditorCard.hidden=true'),'Workspace close must restore native hidden');
assert(js.includes("workspaceBackdrop.addEventListener('click',closeWorkspaceModal)"),'Workspace backdrop close behavior missing');
assert(gate.includes('id="d5TextCardBackdrop" class="text-card-modal-backdrop" hidden aria-hidden="true"'),'Text Card backdrop missing');
assert(gate.includes('id="d5BeamCardDemo" class="beam-card-demo" role="dialog" aria-modal="true" aria-hidden="true" aria-label="Text Card" hidden'),'Text Card six-card source must be natively hidden');
assert(gate.includes('id="d5TextCardClose"'),'Text Card close control missing');
assert(css.includes('body[data-hashcod-entry-intro="1"] #d5BeamCardDemo[hidden]'),'Text Card hidden guard missing');
assert(css.includes('.text-card-modal-backdrop{'),'Text Card backdrop CSS missing');
assert(css.includes('backdrop-filter:blur(28px)'),'Text Card must strongly blur the page');
assert(css.includes('body[data-hashcod-entry-intro="1"].text-card-modal-open #d5BeamCardDemo'),'Text Card centered modal CSS missing');
assert(js.includes("if(detail.value==='text-card')"),'Text Card menu action missing');
assert(js.includes('openTextCardModal();'),'Text Card menu action must open the six-card modal');
assert(js.includes('textCardDemo.hidden=false'),'Text Card open must remove native hidden');
assert(js.includes('textCardDemo.hidden=true'),'Text Card close must restore native hidden');
assert(js.includes("textCardBackdrop.addEventListener('click',closeTextCardModal)"),'Text Card backdrop close behavior missing');
assert(entry.includes('const FaqIcon = ('),'custom FAQ SVG component missing');
assert(entry.includes('const CardIcon = ('),'custom Card SVG component missing');
assert(entry.includes('viewBox="0 0 16 16"'),'custom Card SVG viewBox changed');
assert(entry.includes("{ value: 'card', label: 'Card', icon: CardIcon }"),'Card menu item missing');
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


// FAQ must escape the page layout and cover the entire viewport.
assert(gate.includes('components/mldsa-access-gate.css?v=20261003-textcard1'),'FAQ modal CSS cache-bust missing');
assert(gate.includes('components/mldsa-access-gate.js?v=20261003-textcard1'),'FAQ modal JS cache-bust missing');
assert(gate.includes('id="d5FaqModalBackdrop"'),'FAQ modal backdrop markup missing');
assert(gate.includes('id="d5FaqCard"'),'FAQ modal card markup missing');
assert(js.includes('function ensureFaqModalPortal()'),'FAQ body portal helper missing');
assert(js.includes('document.body.appendChild(faqBackdrop)'),'FAQ backdrop must move directly under body');
assert(js.includes('document.body.appendChild(faqCard)'),'FAQ card must move directly under body');
assert(css.includes('z-index:2147483646'),'FAQ backdrop must sit above all normal page UI');
assert(css.includes('z-index:2147483647'),'FAQ card must sit above the backdrop');
assert(css.includes('background:rgba(255,255,255,.88)'),'FAQ backdrop must heavily veil the page behind it');
assert(css.includes('backdrop-filter:blur(24px)'),'FAQ backdrop blur must be strong enough to hide background detail');
assert(css.includes('width:100vw')&&css.includes('height:100dvh'),'FAQ backdrop must cover the entire viewport');
assert(gate.includes('id="d5ToolDeck" class="tool-deck" data-card-source="true" hidden aria-hidden="true"'),'original card deck must be natively hidden and source-only');
assert(css.includes('body[data-hashcod-entry-intro="1"] #d5ToolDeck'),'first-screen source deck hide rule missing');
assert(css.includes('display:none!important'),'source card deck must stay visually hidden before Card is selected');
assert(gate.includes('id="d5CardModalShell" class="card-modal-shell" hidden'),'Card modal shell must be natively hidden before menu selection');
assert(js.includes("if(detail.value==='card')"),'Card menu action missing');
assert(js.includes('openCardModal();'),'Card menu action must open the modal');
assert(js.includes('cardModalShell.hidden=false'),'Card modal must remove hidden only when opening');
assert(js.includes('cardModalShell.hidden=true'),'Card modal must restore hidden when closing');


// Later screens remain retired.
assert(!gate.includes('data-entry-panel="2"'),'second entry panel must remain removed');
assert(!gate.includes('data-entry-panel="3"'),'third entry panel must remain removed');
assert(!gate.includes('data-entry-panel="4"'),'fourth entry panel must remain removed');
assert(!js.includes('entrySetLevel(2);'),'runtime must not advance to a retired screen');
assert(!js.includes("url.searchParams.set('hashcod_enter','1')"),'retired platform transition must stay removed');


assert(gate.includes('id="d5DocumentsHubBackdrop"'),'Documents hub backdrop missing');
assert(gate.includes('id="d5DocumentsHubShell"'),'Documents hub shell missing');
assert(gate.includes('id="d5DocumentsHubContent"'),'Documents hub content missing');
assert(css.includes('.documents-hub-backdrop{'),'Documents hub CSS missing');
assert(css.includes('backdrop-filter:blur(24px)'),'Documents hub blur missing');
assert(css.includes('body[data-hashcod-entry-intro="1"] #d5NumberTickerDemo'),'NumberTicker must be hidden until Documents opens');
assert(js.includes("if(detail.value==='documents')"),'Documents BranchedMenu selection handler missing');
assert(js.includes('function openDocumentsHub()'),'Documents open runtime missing');
assert(js.includes('function closeDocumentsHub()'),'Documents close runtime missing');
assert(js.includes("document.getElementById('d5ScratchCardDemo')"),'Documents must reuse the real ScratchCard');

console.log('✓ First screen uses FAQ, Card, Workspace, Text Card and Documents modal actions');
