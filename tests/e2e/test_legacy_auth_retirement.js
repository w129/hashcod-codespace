'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const repoDir = path.resolve(__dirname, '../..');
const retirement = fs.readFileSync(path.join(repoDir, 'components/legacy-auth-retirement.js'), 'utf8');
const hosted = fs.readFileSync(path.join(repoDir, 'l8-html.php'), 'utf8');
const local = fs.readFileSync(path.join(repoDir, 'laragon-local-entry.php'), 'utf8');

assert(retirement.includes('window.__hashcodLegacyAuthRetired = true'), 'retirement flag missing');
assert(retirement.includes("'#authOverlay'"), 'legacy auth overlay selector missing');
assert(retirement.includes("'#authWrapper'"), 'legacy auth wrapper selector missing');
assert(retirement.includes("'#hashcodVectorTray'"), 'legacy auth vector tray selector missing');
assert(retirement.includes("body.classList.remove('auth-locked', 'boot-locked')"), 'platform lock removal missing');
assert(retirement.includes("node.hidden = true"), 'retired UI must be hidden');
assert(retirement.includes("node.setAttribute('aria-hidden', 'true')"), 'retired UI accessibility state missing');
assert(retirement.includes("node.style.setProperty('display', 'none', 'important')"),
  'retired auth display suppression must win against legacy !important CSS');
assert(retirement.includes("'hashcod:final-entry-screen'"),
  'screen 3 must remove retired auth DOM entirely');
assert(retirement.includes('MutationObserver'), 'late legacy auth mount guard missing');
assert(retirement.includes('node.matches(retiredSelector)'), 'observer must only react to retired UI nodes');

assert(hosted.includes('hashcod-legacy-auth-prehide'), 'hosted pre-paint auth suppression missing');
assert(hosted.includes('components/legacy-auth-retirement.js?v=20260918-2'), 'hosted retirement runtime missing');
assert(local.includes('hashcod-legacy-auth-prehide'), 'local pre-paint auth suppression missing');
assert(local.includes('components/legacy-auth-retirement.js?v=20260918-2'), 'local retirement runtime missing');

console.log('PASS: legacy authentication window is retired from hosted and local UI while platform locks are cleared.');
