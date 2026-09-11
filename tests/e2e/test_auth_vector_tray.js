const fs = require('fs');
const path = require('path');
const assert = require('assert');

const repoDir = path.resolve(__dirname, '../..');
const source = fs.readFileSync(path.join(repoDir, 'components/platform-entry-slogan.js'), 'utf8');

assert(source.includes("const VECTOR_TRAY_SLOTS = 6"), 'vector tray must expose six future tool slots');
assert(source.includes("tray.id = 'hashcodVectorTray'"), 'vector tray root is missing');
assert(source.includes('hashcod-vector-tray-shell'), '3D tray shell is missing');
assert(source.includes('hashcod-vector-tray-back'), '3D tray rear face is missing');
assert(source.includes('hashcod-vector-tray-plane'), '3D tray top plane is missing');
assert(source.includes('hashcod-vector-tray-front'), '3D tray front face is missing');
assert(source.includes('hashcod-vector-tray-slots'), 'tool slot rail is missing');
assert(source.includes("left:calc(50% - max(26vw,46.222222vh))"), 'tray must remain aligned with the left auth artwork');
assert(source.includes("top:50%"), 'tray must keep a centered fallback position');
assert(source.includes('function positionVectorTray(tray)'), 'tray must expose card-relative positioning');
assert(source.includes("document.querySelector('#authWrapper .auth-card')"), 'tray must align against the real auth card');
assert(source.includes('const cardCenterY = cardRect.top - overlayRect.top + (cardRect.height / 2)'), 'tray must vertically center itself with the auth card');
assert(source.includes("window.addEventListener('resize'"), 'tray must recalculate alignment after viewport changes');
assert(source.includes('background:linear-gradient(180deg,#fff'), 'tray must remain white/monochrome');
assert(source.includes("window.HashcodVectorTray = Object.freeze"), 'future tool registration API is missing');
assert(source.includes('registerTool: registerVectorTrayTool'), 'future icon-button registration API is missing');
assert(source.includes('removeTool: removeVectorTrayTool'), 'future tool removal API is missing');
assert(source.includes('clear: clearVectorTray'), 'future tool reset API is missing');
assert(source.includes('@media (max-width:1099px),(max-height:719px)'), 'tray must hide before overlapping compact login layouts');

assert(source.includes('const HASHCOD_CARD_MODULE_ICON = ['), 'supplied first-slot card SVG is missing');
assert(source.includes('viewBox="0 0 256 256"'), 'first-slot card icon must preserve its supplied SVG coordinate system');
assert(source.includes("slot: 0"), 'supplied icon must be registered in the first tray cube');
assert(source.includes("id: 'card-module'"), 'first tray icon must have a stable module id');
assert(source.includes("iconSvg: HASHCOD_CARD_MODULE_ICON"), 'first tray cube must render the supplied card icon');
assert(source.includes('function registerDefaultVectorTrayTools()'), 'default first-slot registration is missing');
assert(source.includes('registerDefaultVectorTrayTools();'), 'first-slot icon must be mounted with the tray');
assert(source.includes('width:72%;height:72%;max-width:34px;max-height:34px;'), 'detailed supplied SVG must be sized for the tray cube');

assert(!source.includes('fetch('), 'visual tray must not introduce network behavior');
assert(!source.includes('window.location'), 'visual tray must not introduce navigation behavior');

console.log('auth vector tray contract: OK');
