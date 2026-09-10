const fs = require('fs');
const path = require('path');
const assert = require('assert');

const repoDir = path.resolve(__dirname, '../..');
const js = fs.readFileSync(path.join(repoDir, 'components/platform-entry-hold.js'), 'utf8');
const css = fs.readFileSync(path.join(repoDir, 'components/platform-entry-hold.css'), 'utf8');

assert(js.includes('const READY_DELAY_MS = 3600;'), 'entry sequence must remain visible before continuation is enabled');
assert(js.includes('await waitForContinue(overlay);'), 'login must wait for an explicit user click');
assert(js.includes("id=\"hashcodHoldContinue\" disabled"), 'continue button must begin disabled');
assert(js.includes("continueButton.disabled = false;"), 'continue button must be enabled after verification sequence');
assert(js.includes("CONTINUAR AL LOGIN"), 'manual continuation label missing');
assert(js.includes('current.__hashcodMotionOriginal || current'), 'manual gate must preserve the original platform entry function');
assert(js.includes('await original.apply(context, args);'), 'manual gate must delegate to the original entry function');
assert(css.includes('#hashcodEntryHold.is-ready .hashcod-hold-continue'), 'ready-state button styling missing');
assert(css.includes('@media (prefers-reduced-motion: reduce)'), 'reduced-motion support missing');

const allowedHex = new Set([
    '#f7f7f5', '#111111', '#ffffff', '#d4d4d0', '#6b6b6b', '#555555', '#9a9a96'
]);
const colors = css.match(/#[0-9a-fA-F]{6}\b/g) || [];
colors.forEach(color => {
    assert(allowedHex.has(color.toLowerCase()), 'non-monochrome color introduced: ' + color);
});

console.log('platform entry manual hold contract: OK');
