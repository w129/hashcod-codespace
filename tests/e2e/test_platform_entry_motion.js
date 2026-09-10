const fs = require('fs');
const path = require('path');
const assert = require('assert');

const repoDir = path.resolve(__dirname, '../..');
const js = fs.readFileSync(path.join(repoDir, 'components/platform-entry-motion.js'), 'utf8');
const css = fs.readFileSync(path.join(repoDir, 'components/platform-entry-motion.css'), 'utf8');
const favicon = fs.readFileSync(path.join(repoDir, 'favicon.svg'), 'utf8');

assert(js.includes("document.getElementById('bootCliEnter')"), 'must target the existing Enter platform button');
assert(js.includes('function installEnterPlatformWrapper()'), 'must wrap the authoritative platform-entry function');
assert(js.includes('window.l8EnterPlatform = wrapped;'), 'must install the wrapper used by the inline Enter platform button');
assert(js.includes('return original.apply(context, args);'), 'wrapper must delegate to the original platform-entry function');
assert(js.includes('__hashcodMotionWrapped'), 'wrapper must be idempotent and avoid recursive installation');
assert(js.includes('runEntryTransition(button, invokeOriginal)'), 'normal entry must execute the visual handoff before the original function');
assert(js.includes('runReducedEntryTransition(button, invokeOriginal)'), 'reduced-motion users must still receive a non-moving access state before entry');
assert(js.includes("style.setProperty('display', 'grid', 'important')"), 'reduced-motion handoff must override the CSS display suppression without adding movement');
assert(js.includes('hashcod_platform_intro_seen_v1'), 'intro must be limited to once per session');
assert(js.includes('prefers-reduced-motion'), 'JavaScript must respect reduced motion');
assert(css.includes('@media (prefers-reduced-motion: reduce)'), 'CSS must respect reduced motion');
assert(css.includes('#hashcodEntryTransition'), 'entry handoff overlay must be styled');
assert(css.includes('#hashcodBootIntro'), 'boot intro must be styled');

['M 124 347 L 76 347', 'M 242.5 278.5'].forEach(fragment => {
    assert(favicon.includes(fragment), 'favicon source changed unexpectedly: ' + fragment);
    assert(js.includes(fragment), 'intro must reuse the Hashcod platform mark: ' + fragment);
});

['M 15 7 L 15 9', 'M 4 6 L 4 27', 'M 5 5 L 5 27', 'M 3 5 L 3 27'].forEach(fragment => {
    assert(js.includes(fragment), 'missing supplied vector icon path: ' + fragment);
});

const allowedHex = new Set([
    '#f7f7f5', '#111111', '#6b6b6b', '#000000',
    '#555555', '#d4d4d0', '#626262', '#ffffff'
]);
const colors = css.match(/#[0-9a-fA-F]{6}\b/g) || [];
colors.forEach(color => {
    assert(allowedHex.has(color.toLowerCase()), 'non-monochrome color introduced: ' + color);
});

console.log('platform entry motion contract: OK');
