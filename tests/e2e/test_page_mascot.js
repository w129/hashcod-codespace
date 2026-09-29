const fs=require('fs'),assert=require('assert');

const js=fs.readFileSync('components/page-mascot-panda.js','utf8');
const css=fs.readFileSync('components/page-mascot-panda.css','utf8');
const router=fs.readFileSync('router.php','utf8');
const html=fs.readFileSync('l8-html.php','utf8');
const crypto=require('crypto');
const directions=fs.readFileSync('mascots/panda-directions.webp');
const reactions=fs.readFileSync('mascots/panda-reactions.webp');
const notices=fs.readFileSync('THIRD_PARTY_NOTICES.md','utf8');

function gitBlobSha(buffer){
  return crypto.createHash('sha1')
    .update(Buffer.from('blob '+buffer.length+'\0'))
    .update(buffer)
    .digest('hex');
}

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

assert(gitBlobSha(directions)==='6f3f42dcf066c2b1c01e85913d2ea8828215f474','directions WebP must match the exact uploaded/upstream page-mascot sprite');
assert(gitBlobSha(reactions)==='aaecccbcc7aaeb646aeb2a10145d31701ada5e9e','reactions WebP must match the exact uploaded/upstream page-mascot sprite');
assert(router.includes("'webp' => 'image/webp'"),'router must serve committed WebP sprites with image/webp MIME');
assert(router.includes("securityIsAllowedStatic($uri)"),'mascot sprites must use the normal static asset pipeline');

assert(html.includes('components/page-mascot-panda.css?v=20260929-panda1'),'mascot stylesheet injection missing');
assert(html.includes('components/page-mascot-panda.js?v=20260929-panda1'),'mascot runtime injection missing');
assert(notices.includes('## page-mascot')&&notices.includes('License: MIT'),'page-mascot attribution missing');

console.log('PASS: page-mascot panda integration contract verified');
