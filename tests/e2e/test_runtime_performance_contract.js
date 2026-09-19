'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const repoDir = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(repoDir, file), 'utf8');

const efr = read('components/efr-code-editor.js');
const cloud = read('components/cloud-device-sync.js');
const ux = read('components/hashcod-ux-system.js');
const tabs = read('components/auth-tabs-rescue.js');
const brand = read('components/boot-brand-virtual-scale.js');
const topbar = read('components/topbar-windows-hello.js');
const slogan = read('components/platform-entry-slogan.js');
const footer = read('components/platform-entry-capability-footer.js');
const footerFix = read('components/platform-entry-capability-footer-fix.js');
const admin = read('components/admin-device.js');
const hosted = read('l8-html.php');
const local = read('laragon-local-entry.php');

assert(!efr.includes('setInterval(repairAndSync, 400)'), 'EFR must not poll layout every 400 ms');
assert(efr.includes('function scheduleRepair()'), 'EFR repair must be requestAnimationFrame batched');
assert(efr.includes("document.visibilityState === 'hidden'"), 'EFR must pause hidden-tab repair work');
assert(efr.includes('mutationTouchesTray'), 'EFR observer must filter unrelated mutations');
assert(!efr.includes("window.addEventListener('mousedown', handlePhysicalTrayPress, true)"), 'redundant EFR mouse capture listener must stay removed');
assert(!efr.includes("document.addEventListener('click', handlePhysicalTrayPress, true)"), 'redundant EFR click capture listener must stay removed');

assert(cloud.includes('SYNC_INTERVAL_MS = 15000'), 'background cloud cadence must remain reduced');
assert(cloud.includes('MIN_AUTOMATIC_GAP_MS = 4000'), 'automatic cloud sync bursts must be deduplicated');
assert(cloud.includes("document.visibilityState === 'hidden'"), 'cloud sync must pause automatic work in hidden tabs');
assert(cloud.includes("window.addEventListener('focus'"), 'cloud sync must remain responsive on focus');

assert(ux.includes('const pendingRoots = new Set()'), 'UX mutation work must be batched');
assert(ux.includes('requestIdleCallback'), 'UX mutation processing must use idle time when available');
assert(ux.includes('processed >= 24'), 'UX mutation batches must be bounded');

assert(tabs.includes('function stopAuthObserver()'), 'auth-tab observer must have a teardown path');
assert(tabs.includes("'hashcod:final-entry-screen'"), 'auth-tab observer must stop when registration starts');
assert(tabs.includes("'hashcod:platform-entered'"), 'auth-tab observer must stop after entry');

assert(brand.includes('let applyFrame = 0'), 'boot-brand layout work must be frame-batched');
assert(brand.includes('function stop()'), 'boot-brand observer must have teardown');
assert(brand.includes("'hashcod:final-entry-screen'"), 'boot-brand observer must stop after boot');

assert(topbar.includes("topbarObserver.observe(topBarRight, { childList: true })"), 'Windows Hello observer must be scoped to top bar');
assert(!topbar.includes("observe(document.documentElement, { childList: true, subtree: true })"), 'Windows Hello must not observe the entire document');

assert(slogan.includes('function stopObserver()'), 'entry tray observer must have teardown');
assert(slogan.includes('let resizeFrame = 0'), 'entry tray resize must be frame-throttled');
assert(slogan.includes("'hashcod:final-entry-screen'"), 'entry tray observer must stop at screen 3');

assert(footer.includes('if (mount()) observer.disconnect();'), 'capability footer observer must disconnect after mount');
assert(footer.includes('15000'), 'capability footer observer must have a bounded lifetime');

assert(footerFix.includes('let layoutFrame = 0'), 'entry layout recalculation must be frame-batched');
assert(footerFix.includes('function stopLayoutWatch()'), 'entry layout observer must have teardown');

assert(admin.includes('let codeKeyObserver = null'), 'admin observer must be lifecycle-managed');
assert(admin.includes('codeKeyObserver.observe(root'), 'admin observer must be scoped to its local root');
assert(admin.includes("'hashcod:final-entry-screen'"), 'admin boot observer must stop after entry handoff');

assert(hosted.includes("$rareFolderExternalTag = $rareFolderBundle === ''"), 'production must not parse Rare UI twice when the inline bundle exists');
assert(local.includes("$rareExternal = $rareBundle === ''"), 'local runtime must not parse Rare UI twice when the inline bundle exists');

for (const token of [
  'topbar-windows-hello.js?v=20260919-perf1',
  'platform-entry-capability-footer.js?v=20260919-perf1',
  'platform-entry-capability-footer-fix.js?v=20260919-perf1',
  'auth-tabs-rescue.js?v=20260919-perf1',
  'efr-code-editor.js?v=20260919-perf1'
]) {
  assert(hosted.includes(token), 'hosted cache-bust missing: ' + token);
}
for (const token of [
  'platform-entry-slogan.js?v=20260919-perf1',
  'topbar-windows-hello.js?v=20260919-perf1',
  'platform-entry-capability-footer.js?v=20260919-perf1',
  'platform-entry-capability-footer-fix.js?v=20260919-perf1',
  'auth-tabs-rescue.js?v=20260919-perf1',
  'efr-code-editor.js?v=20260919-perf1'
]) {
  assert(local.includes(token), 'local cache-bust missing: ' + token);
}

console.log('PASS: Hashcod runtime avoids frequent polling, pauses hidden work, batches DOM/layout work, and retires boot observers after entry.');
