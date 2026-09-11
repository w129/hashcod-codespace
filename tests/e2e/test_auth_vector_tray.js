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
assert(source.includes("top:calc(50% + max(4.75vw,8.444444vh))"), 'tray must occupy the requested middle artwork area');
assert(source.includes('background:linear-gradient(180deg,#fff'), 'tray must remain white/monochrome');
assert(source.includes("window.HashcodVectorTray = Object.freeze"), 'future tool registration API is missing');
assert(source.includes('registerTool: registerVectorTrayTool'), 'future icon-button registration API is missing');
assert(source.includes('removeTool: removeVectorTrayTool'), 'future tool removal API is missing');
assert(source.includes('clear: clearVectorTray'), 'future tool reset API is missing');
assert(source.includes('@media (max-width:1099px),(max-height:719px)'), 'tray must hide before overlapping compact login layouts');
assert(!source.includes('fetch('), 'visual tray must not introduce network behavior');
assert(!source.includes('window.location'), 'visual tray must not introduce navigation behavior');

console.log('auth vector tray contract: OK');
