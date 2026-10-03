'use strict';

const fs=require('node:fs');
const assert=require('node:assert/strict');

const js=fs.readFileSync('components/platform-branched-menu.js','utf8');
const css=fs.readFileSync('components/platform-branched-menu.css','utf8');
const html=fs.readFileSync('l8-html.php','utf8');
const local=fs.readFileSync('laragon-local-entry.php','utf8');

assert(html.includes('components/platform-branched-menu.css?v=20261003-branched2'),'BranchedMenu stylesheet must load on main platform');
assert(html.includes('components/platform-branched-menu.js?v=20261003-branched2'),'BranchedMenu runtime must load on main platform');
assert(local.includes('components/platform-branched-menu.css?v=20261003-branched2'),'BranchedMenu stylesheet must load in Laragon/local');
assert(local.includes('components/platform-branched-menu.js?v=20261003-branched2'),'BranchedMenu runtime must load in Laragon/local');

assert(js.includes("label:'Getting started'"),'Getting started group missing');
assert(js.includes("value:'install',label:'Installation',icon:'download04'"),'Installation item/icon missing');
assert(js.includes("value:'quick',label:'Quick start',icon:'rocket01'"),'Quick start item/icon missing');
assert(js.includes("value:'config',label:'Configuration',icon:'settings02'"),'Configuration item/icon missing');
assert(js.includes("label:'Components'"),'Components group missing');
assert(js.includes("value:'buttons',label:'Buttons'"),'Buttons item missing');
assert(js.includes("value:'overlays',label:'Overlays'"),'Overlays item missing');

assert(js.includes('var DEFAULT_OPEN=[0]'),'defaultOpen must be [0]');
assert(js.includes("var DEFAULT_ACTIVE='quick'"),'defaultActive must be quick');
assert(js.includes("color:'#f5f5f5'"),'menu color contract missing');
assert(js.includes("accentColor:'#f5f5f5'"),'accent color contract missing');
assert(js.includes("lineColor:'#3f3f46'"),'line color contract missing');
assert(js.includes('width:240'),'width=240 contract missing');
assert(js.includes('rowHeight:36'),'rowHeight=36 contract missing');
assert(js.includes('indent:40'),'indent=40 contract missing');
assert(js.includes('trunk:14'),'trunk=14 contract missing');
assert(js.includes('radius:10'),'radius=10 contract missing');
assert(js.includes('lineWidth:1.5'),'lineWidth=1.5 contract missing');
assert(js.includes('fontSize:14'),'fontSize=14 contract missing');
assert(js.includes('drawDuration:400'),'drawDuration=400 contract missing');
assert(js.includes('foldDuration:300'),'foldDuration=300 contract missing');

assert(css.includes('--bm-width:240px'),'CSS width must be 240px');
assert(css.includes('--bm-row:36px'),'CSS row height must be 36px');
assert(css.includes('--bm-indent:40px'),'CSS indent must be 40px');
assert(css.includes('--bm-trunk:14px'),'CSS trunk must be 14px');
assert(css.includes('--bm-radius:10px'),'CSS radius must be 10px');
assert(css.includes('--bm-line-width:1.5px'),'CSS line width must be 1.5px');
assert(css.includes('--bm-font:14px'),'CSS font size must be 14px');
assert(css.includes('--bm-draw:400ms'),'CSS drawDuration must be 400ms');
assert(css.includes('--bm-fold:300ms'),'CSS foldDuration must be 300ms');
assert(css.includes('z-index:2147482700'),'BranchedMenu must render above platform surfaces');
assert(css.includes('left:48px'),'desktop menu must stay in left blank area');
assert(css.includes('top:112px'),'desktop menu vertical placement missing');
assert(css.includes('@media(max-width:900px)'),'responsive BranchedMenu rule missing');
assert(css.includes('@media(max-width:640px)'),'mobile BranchedMenu rule missing');

assert(js.includes("window.dispatchEvent(new CustomEvent('hashcod:branched-menu-select'"),'selection event missing');
assert(js.includes("window.dispatchEvent(new CustomEvent('hashcod:branched-menu-toggle'"),'toggle event missing');
assert(js.includes("history.replaceState"),'default navigate behavior missing');
assert(js.includes("data-hashcod-branched-menu-visible"),'visible-state marker missing');
assert(js.includes("MutationObserver"),'platform-entry visibility observer missing');
assert(js.includes('window.HashcodBranchedMenu={'),'public BranchedMenu API missing');

assert(js.includes('M16.9504 12.1817'),'Download04Icon path missing');
assert(js.includes('M6.21875 11.618'),'Rocket01Icon path missing');
assert(js.includes('M15.5 12C15.5 13.933'),'Settings02Icon path missing');

console.log('✓ Platform BranchedMenu static contract verified');
