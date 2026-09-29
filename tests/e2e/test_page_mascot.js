const fs=require('fs'),assert=require('assert');

const js=fs.readFileSync('components/page-mascot-panda.js','utf8');
const css=fs.readFileSync('components/page-mascot-panda.css','utf8');
const router=fs.readFileSync('router.php','utf8');
const html=fs.readFileSync('l8-html.php','utf8');
const assets=fs.readFileSync('mascot-assets.php','utf8');
const notices=fs.readFileSync('THIRD_PARTY_NOTICES.md','utf8');

new Function(js);

assert(js.includes("var DIRECTIONS=['up-left','up','up-right','left','center','right','down-left','down','down-right']"),'nine direction cells missing');
assert(js.includes("var REACTIONS=['blink','heart','sparkle','surprised','wink','bashful','sleepy','dizzy','delighted']"),'nine reaction cells missing');
assert(js.includes("window.matchMedia('(hover: hover) and (pointer: fine)')"),'fine-pointer tracking gate missing');
assert(js.includes('var HYSTERESIS=.12'),'direction hysteresis missing');
assert(js.includes('var DEAD_ZONE=70'),'cursor dead zone missing');
assert(js.includes('DIZZY_AFTER=4'),'four-boop dizzy behavior missing');
assert(js.includes("setReaction('dizzy')"),'dizzy reaction missing');
assert(js.includes("window.matchMedia('(prefers-reduced-motion: reduce)')"),'reduced motion protection missing');
assert(js.includes('hashcod:platform-entered'),'platform-entry visibility trigger missing');
assert(js.includes("root.classList.add('is-platform-visible')"),'platform visibility class missing');
assert(js.includes('/mascots/panda-directions.webp'),'panda directions URL missing');
assert(js.includes('/mascots/panda-reactions.webp'),'panda reactions URL missing');
assert(js.includes('window.HashcodPageMascot=Object.freeze'),'mascot diagnostics API missing');

assert(css.includes('#hashcodPageMascotDock.hashcod-page-mascot-dock{'),'fixed mascot dock styling missing');
assert(css.includes('position:fixed'),'mascot must stay in the viewport corner');
assert(css.includes('right:max('),'mascot right-corner placement missing');
assert(css.includes('.is-ready.is-platform-visible'),'mascot must remain hidden until ready + platform entered');
assert(css.includes('@media(max-width:720px)'),'mobile mascot sizing missing');

assert(router.includes("'/mascots/panda-directions.webp'")&&router.includes("'/mascots/panda-reactions.webp'"),'same-origin mascot asset routes missing');
assert(router.includes("require __DIR__ . '/mascot-assets.php'"),'mascot asset controller binding missing');

assert(assets.includes("'git_sha' => '6f3f42dcf066c2b1c01e85913d2ea8828215f474'"),'directions blob identity missing');
assert(assets.includes("'git_sha' => 'aaecccbcc7aaeb646aeb2a10145d31701ada5e9e'"),'reactions blob identity missing');
assert(assets.includes("header('Content-Type: image/webp')"),'webp response type missing');
assert(assets.includes("hash_equals($asset['git_sha'], $gitBlobSha($bytes))"),'download integrity validation missing');
assert(assets.includes('max-age=31536000, immutable'),'immutable sprite caching missing');

assert(html.includes('components/page-mascot-panda.css?v=20260929-panda1'),'mascot stylesheet injection missing');
assert(html.includes('components/page-mascot-panda.js?v=20260929-panda1'),'mascot runtime injection missing');
assert(notices.includes('## page-mascot')&&notices.includes('License: MIT'),'page-mascot attribution missing');

console.log('PASS: page-mascot panda integration contract verified');
