'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = path.resolve(__dirname, '../..');
const force = fs.readFileSync(path.join(root, 'components/boot-intro-force.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'l8-html.php'), 'utf8');
const css = fs.readFileSync(path.join(root, 'components/platform-entry-motion.css'), 'utf8');

assert(force.includes("document.getElementById('bootCliOverlay')"), 'forced intro must target the real boot overlay');
assert(force.includes("intro.style.setProperty('display', 'grid', 'important')"), 'forced intro must remain visible even if reduced-motion CSS hides the normal intro');
assert(force.includes('hashcodBootIntro'), 'forced intro must build the original Hashcod boot intro');
assert(force.includes('INITIALIZING SECURE WORKSPACE'), 'forced intro must keep the original startup sequence');
assert(force.includes("window.sessionStorage.setItem(INTRO_SESSION_KEY, '1')"), 'forced intro must suppress a duplicate intro from the deferred motion module');
assert(html.includes("file_get_contents($motionCssPath)"), 'critical boot motion CSS must be inlined by the PHP response');
assert(html.includes("file_get_contents($bootForcePath)"), 'forced boot JS must be inlined by the PHP response');
assert(html.includes('hashcod-platform-entry-motion-critical'), 'critical boot CSS style tag must be present');
assert(html.includes('hashcod-boot-intro-force-inline'), 'forced boot JS tag must be present');
assert(css.includes('#hashcodBootIntro'), 'the original boot intro visual system must remain available');

console.log('forced boot intro regression: OK');
