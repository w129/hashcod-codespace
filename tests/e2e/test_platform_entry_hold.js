const fs = require('fs');
const path = require('path');
const assert = require('assert');

const repoDir = path.resolve(__dirname, '../..');
const js = fs.readFileSync(path.join(repoDir, 'components/platform-entry-hold.js'), 'utf8');
const css = fs.readFileSync(path.join(repoDir, 'components/platform-entry-hold.css'), 'utf8');

assert(js.includes('const READY_DELAY_MS = 3600;'), 'entry sequence must remain visible before continuation is enabled');
assert(js.includes('await waitForContinue(overlay);'), 'login must wait for an explicit user click');
assert(js.includes('id="hashcodHoldContinue" disabled'), 'continue button must begin disabled');
assert(js.includes('continueButton.disabled = false;'), 'continue button must be enabled after verification sequence');
assert(js.includes('CONTINUAR AL LOGIN'), 'manual continuation label missing');
assert(js.includes('current.__hashcodMotionOriginal || current'), 'manual gate must preserve the original platform entry function');
assert(js.includes('await original.apply(context, args);'), 'manual gate must delegate to the original entry function');

// Open composition: no central card/window; the scene is grid + floating vectors + status + CTA.
assert(!js.includes('hashcod-hold-frame'), 'central entry card/window must remain removed');
assert(js.includes('hashcod-hold-side-field'), 'floating vector field missing');
assert(js.includes('hashcod-hold-cta-wrap'), 'bottom entry CTA wrapper missing');
assert(js.includes('const SCATTER = ['), 'distributed icon layout missing');
assert((js.match(/pos: '/g) || []).length >= 14, 'expected at least 14 dispersed vector placements');

// Contract fragments from the newly supplied SVG set.
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
assert(css.includes('.hashcod-hold-pos-14'), 'full scattered placement map missing');
assert(css.includes('bottom: 34px;'), 'entry CTA must stay anchored near the original lower entry position');
assert(css.includes('@media (prefers-reduced-motion: reduce)'), 'reduced-motion support missing');

const allowedHex = new Set([
    '#f7f7f5', '#111111', '#ffffff', '#d4d4d0', '#6b6b6b', '#555555', '#9a9a96',
    '#666666', '#777777'
]);
const colors = css.match(/#[0-9a-fA-F]{6}\b/g) || [];
colors.forEach(color => {
    assert(allowedHex.has(color.toLowerCase()), 'non-monochrome color introduced: ' + color);
});

console.log('platform entry open-layout contract: OK');
