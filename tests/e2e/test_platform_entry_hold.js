const fs = require('fs');
const path = require('path');
const assert = require('assert');

const repoDir = path.resolve(__dirname, '../..');
const js = fs.readFileSync(path.join(repoDir, 'components/platform-entry-hold.js'), 'utf8');
const css = fs.readFileSync(path.join(repoDir, 'components/platform-entry-hold.css'), 'utf8');

assert(js.includes('const READY_DELAY_MS = 3600;'), 'entry sequence must remain visible before continuation is enabled');
assert(js.includes('await waitForContinue(overlay);'), 'login must wait for an explicit user click');
assert(js.includes("root.dataset.hashcodFinalEntryScreen = 'true'"), 'third-screen state marker missing');
assert(js.includes("new CustomEvent('hashcod:final-entry-screen'"), 'third-screen reveal event missing');
assert(js.includes('if (reachedFinalScreen) revealFinalEntryScreen();'), 'sign reveal must occur only after the second screen completes');
assert(js.includes('id="hashcodHoldContinue" disabled'), 'continue button must begin disabled');
assert(js.includes('continueButton.disabled = false;'), 'continue button must be enabled after verification delay');
assert(js.includes('CONTINUAR AL LOGIN'), 'manual continuation label missing');
assert(js.includes('current.__hashcodMotionOriginal || current'), 'manual gate must preserve the original platform entry function');
assert(js.includes('await original.apply(context, args);'), 'manual gate must delegate to the original entry function');

// Scene contract: only grid + dispersed vectors + right-side CTA. No central status block/card.
assert(!js.includes('hashcod-hold-frame'), 'central card/window must remain removed');
assert(!js.includes('hashcod-hold-center'), 'central access status must remain removed');
assert(!js.includes('hashcodHoldStatus'), 'ACCESS GRANTED status block must remain removed');
assert(!js.includes('hashcodHoldProgress'), 'central progress line must remain removed');
assert(!js.includes('hashcodHoldPhaseLine'), 'central phase label must remain removed');
assert(!js.includes('hashcod-hold-topline'), 'top diagnostic header must remain removed');
assert(!js.includes('hashcod-hold-help'), 'helper text must remain removed');
assert(js.includes('hashcod-hold-side-field'), 'floating vector field missing');
assert(js.includes('hashcod-hold-cta-wrap'), 'entry CTA wrapper missing');
assert(js.includes('const SCATTER = ['), 'distributed icon layout missing');
assert((js.match(/pos: '/g) || []).length >= 18, 'expected at least 18 dispersed vector placements');

// Contract fragments from the supplied SVG set.
[
    '<rect width="12" height="2" x="10" y="4"',
    'M 5 5 L 5 6 L 3 6',
    'M 15 4 L 15 7 L 17 7',
    'M 4 5 L 4 24 L 6 24',
    'M 5 5 L 5 27 L 21 27',
    'M 8 3 L 8 21 L 2 21'
].forEach(fragment => {
    assert(js.includes(fragment), 'missing supplied vector: ' + fragment);
});

assert(css.includes('#hashcodEntryHold.is-ready .hashcod-hold-continue'), 'ready-state button styling missing');
assert(css.includes('.hashcod-hold-pos-18'), 'full scattered placement map missing');
assert(css.includes('right: clamp(30px, 4.5vw, 72px);'), 'entry CTA must be anchored on the right');
assert(!css.includes('.hashcod-hold-center'), 'central status CSS must remain removed');
assert(css.includes('@media (prefers-reduced-motion: reduce)'), 'reduced-motion support missing');

const allowedHex = new Set([
    '#f7f7f5', '#111111', '#ffffff'
]);
const colors = css.match(/#[0-9a-fA-F]{6}\b/g) || [];
colors.forEach(color => {
    assert(allowedHex.has(color.toLowerCase()), 'non-monochrome color introduced: ' + color);
});

console.log('platform entry vectors-only contract: OK');
