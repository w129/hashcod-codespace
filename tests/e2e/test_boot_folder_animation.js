'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = path.resolve(__dirname, '../..');
const js = fs.readFileSync(path.join(root, 'components/boot-folder-animation.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'components/boot-folder-animation.css'), 'utf8');
const html = fs.readFileSync(path.join(root, 'l8-html.php'), 'utf8');

assert(js.includes("document.getElementById('bootCliOverlay')"), 'folder animation must mount in the real boot overlay');
assert(js.includes("window.sessionStorage.setItem(INTRO_SESSION_KEY, '1')"), 'folder must suppress the obsolete full-screen intro');
assert(js.includes('M0 25C0 11.1929 11.1929 0 25 0H136.084'), 'supplied folder flap geometry must be preserved');
assert(js.includes("root.addEventListener('mouseenter'"), 'hover interaction must be wired');
assert(js.includes("root.addEventListener('click'"), 'click toggle must be wired');
assert(js.includes("event.key === 'Enter' || event.key === ' '"), 'keyboard interaction must be wired');
assert(js.includes("event.key === 'Escape'"), 'escape must close the folder');
assert(js.includes('window.addEventListener(\'resize\''), 'folder must rescale with the viewport');
assert(js.includes('setOpen(true)'), 'automatic preview must demonstrate the open state');

assert(css.includes('translate(40px,-10px) rotate(10deg)'), 'card 1 idle transform must match supplied motion');
assert(css.includes('translate(40px,-30px) rotate(14deg)'), 'card 1 hover transform must match supplied motion');
assert(css.includes('translate(70px,-160px) rotate(18deg)'), 'card 1 open transform must match supplied motion');
assert(css.includes('translate(0,-180px) rotate(-3deg)'), 'card 2 open transform must match supplied motion');
assert(css.includes('translate(-65px,-170px) rotate(-14deg)'), 'card 3 open transform must match supplied motion');
assert(css.includes('rotateX(-15deg)'), 'folder flap idle angle must match supplied motion');
assert(css.includes('rotateX(-45deg)'), 'folder flap hover angle must match supplied motion');
assert(css.includes('rotateX(-55deg)'), 'folder flap open angle must match supplied motion');
assert(css.includes('left: 34%'), 'desktop alignment must reserve space for existing Hashcod branding');
assert(css.includes('@media (max-width: 900px)'), 'responsive placement must be present');

assert(html.includes("file_get_contents($folderCssPath)"), 'folder CSS must be inlined into the production HTML');
assert(html.includes("file_get_contents($folderJsPath)"), 'folder JS must be inlined into the production HTML');
assert(html.includes('hashcod-boot-folder-animation-critical'), 'critical folder CSS tag must be emitted');
assert(html.includes('hashcod-boot-folder-animation-inline'), 'folder script tag must be emitted');
assert(!html.includes('boot-intro-force.js'), 'obsolete forced intro must no longer be loaded');

console.log('boot folder animation contract: OK');
