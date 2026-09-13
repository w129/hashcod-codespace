const fs = require('fs');
const path = require('path');
const assert = require('assert');

const repoDir = path.resolve(__dirname, '../..');
const source = fs.readFileSync(path.join(repoDir, 'components/vector-link-board.js'), 'utf8');
const css = fs.readFileSync(path.join(repoDir, 'components/vector-link-board.css'), 'utf8');
const classroom = fs.readFileSync(path.join(repoDir, 'components/vector-classroom-board.js'), 'utf8');
const trayIcon = fs.readFileSync(path.join(repoDir, 'components/vector-tray-icon-third.svg'), 'utf8');

assert(source.includes('const TOTAL_SLOTS = 200'), 'link board must expose exactly 200 circles');
assert(source.includes("const DB_NAME = 'hashcod_link_board_v1'"), 'link board IndexedDB namespace missing');
assert(source.includes("const STORE_NAME = 'links'"), 'link store missing');
assert(source.includes("const SLOT = 2"), 'link board must be attached to the third tray cube');
assert(source.includes("const SYNC_ENDPOINT = '/hashcod-sync.php'"), 'direct PostgreSQL sync endpoint missing');
assert(source.includes('CLOUD_REFRESH_MS = 5000'), 'open boards must refresh shared occupancy every five seconds');
assert(source.includes("id: TOOL_ID"), 'third tray tool identity registration missing');
assert(source.includes("label: 'Tablilla de enlaces'"), 'link board tray label missing');
assert(source.includes('onClick: openBoard'), 'third tray cube must open the link board');
assert(source.includes("window.HashcodAdmin.require({ force: force === true })"), 'Windows Hello verification path missing');
assert(source.includes('const verified = await verifyHello(true)'), 'empty slots must force positive Windows Hello verification');
assert(source.includes("document.documentElement.dataset.adminAuthenticated === 'true'"), 'verified Windows Hello state check missing');
assert(source.includes("window.crypto.subtle.digest('SHA-256'"), 'link codes must be stored locally as SHA-256 hashes');
assert(source.includes('codeHash: await hashCode(code)'), 'plaintext link code must not be persisted');
assert(!source.includes('code: code,'), 'plaintext link code must never be persisted in IndexedDB');
assert(source.includes("parsed.protocol !== 'https:' && parsed.protocol !== 'http:'"), 'only HTTP/HTTPS links should be accepted');
assert(source.includes('Array.from({ length: TOTAL_SLOTS }'), '200 ordered cells must be generated programmatically');
assert(source.includes('slotLabel(slot)'), 'cells must have deterministic ordered labels');
assert(source.includes('outerCircleSvg(slot)'), 'each slot must render the supplied outer circle');
assert(source.includes('plusIconSvg(slot)'), 'empty slots must render the supplied plus icon');
assert(source.includes('githubIconSvg(slot)'), 'saved slots must render the supplied GitHub icon');
assert(source.includes("saved ? githubIconSvg(slot) : plusIconSvg(slot)"), 'saved state must switch the inner icon');

assert(source.includes("cloudRequest('links.pull')"), 'each device must pull shared slot occupancy from PostgreSQL');
assert(source.includes("cloudRequest('links.push'"), 'Windows Hello saves must push directly to PostgreSQL');
assert(source.includes("cloudRequest('links.open'"), 'remote devices must verify a code on the server before receiving a URL');
assert(source.includes('state.cloudSlots = next'), 'shared PostgreSQL occupancy must be represented in the board');
assert(source.includes('Array.from(state.cloudSlots.keys())'), 'rendering must combine local cache and shared cloud slots');
assert(source.includes('await pushCloudRecord(record)'), 'save must wait for cloud confirmation');
assert(source.includes("setStatus('Enlace guardado y sincronizado en PostgreSQL."), 'successful save must report shared persistence');
assert(source.includes("window.HashcodLinkBoard = Object.freeze"), 'link board public API missing');
assert(source.includes('sync: syncCloudSlots'), 'link board must expose manual cross-device refresh');
assert(source.includes("window.addEventListener('focus'"), 'returning to a computer must refresh shared slots');
assert(source.includes("window.open(destination, '_blank', 'noopener,noreferrer')"), 'valid code must open the saved link');
assert(source.includes("if (!opened) window.location.assign(destination)"), 'blocked new tabs must still navigate to the verified link');

assert(source.includes('M32,58c-14.3,0 -26,-11.7 -26,-26'), 'supplied circle geometry missing');
assert(source.includes('M36.15,40.5h-24.3'), 'supplied empty-slot plus-card geometry missing');
assert(source.includes('M34,23c0,-1.574'), 'supplied saved-link GitHub geometry missing');

assert(css.includes('.hashcod-link-board-grid'), 'link board grid styles missing');
assert(css.includes('grid-template-columns: repeat(20'), 'desktop layout must order circles in twenty columns');
assert(css.includes('.hashcod-link-orb'), 'circular slot layout missing');
assert(css.includes('#e1e1e1'), 'board surface must match the platform grey');
assert(css.includes('.hashcod-link-board-tablet'), 'tablet frame style missing');
assert(css.includes('background: #ffffff'), 'tablet frame must preserve the requested white finish');
assert(css.includes('.hashcod-link-cell.is-saved'), 'saved-slot visual state missing');
assert(css.includes('@media (max-width: 560px)'), 'link board must adapt to compact screens');

assert(classroom.includes("vector-link-board.css?v=20260911-1"), 'link board stylesheet loader missing');
assert(classroom.includes("vector-link-board.js?v=20260913-2"), 'link board script loader must bust the stale local-only cache');
assert(classroom.includes('loadLinkBoardAssets();'), 'link board assets must be activated by the second-module loader');

assert(trayIcon.includes('viewBox="0 0 256 256"'), 'third tray icon must preserve its supplied viewBox');
assert(trayIcon.includes('color-4_gPS47EOOeWUd_gr4'), 'third tray icon gradients missing');

console.log('vector link board contract: OK');