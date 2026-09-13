const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoDir = path.resolve(__dirname, '../..');
const source = fs.readFileSync(path.join(repoDir, 'components/cloud-device-sync.js'), 'utf8');
const board = fs.readFileSync(path.join(repoDir, 'components/vector-link-board.js'), 'utf8');
const backend = fs.readFileSync(path.join(repoDir, 'hashcod-sync.php'), 'utf8');
const loader = fs.readFileSync(path.join(repoDir, 'components/admin-hello-button.js'), 'utf8');

assert(source.includes("const ENDPOINT = '/hashcod-sync.php'"), 'cloud sync endpoint missing');
assert(source.includes("const LINK_DB = 'hashcod_link_board_v1'"), 'link-board cache namespace must remain documented');
assert(source.includes("const IMAGE_DB = 'hashcod_image_vault_v1'"), 'image-vault local cache must be synchronized');
assert(source.includes("credentials: 'same-origin'"), 'sync requests must keep same-origin credentials');
assert(source.includes("'X-Requested-With': 'XMLHttpRequest'"), 'sync POSTs must carry the CSRF marker');
assert(source.includes("jsonRequest('links.pull')"), 'background sync must observe shared link occupancy');
assert(!source.includes("jsonRequest('links.push'"), 'generic background sync must not push protected links without Windows Hello');
assert(source.includes("jsonRequest('images.list')"), 'gallery must pull cloud metadata');
assert(source.includes('action=images.upload'), 'gallery must push PNG files to cloud storage');
assert(source.includes('action=images.get'), 'gallery must download missing cloud PNG files');
assert(source.includes('SYNC_INTERVAL_MS = 5000'), 'shared cross-device sync must refresh every five seconds');
assert(source.includes('state.shared = status.shared === true'), 'client must track global shared mode');
assert(source.includes("window.addEventListener('focus'"), 'phone/laptop focus must trigger reconciliation');
assert(source.includes("window.HashcodCloudSync = Object.freeze"), 'manual cloud sync API missing');

assert(board.includes("cloudRequest('links.push'"), 'link board itself must perform Windows Hello protected writes');
assert(board.includes("cloudRequest('links.open'"), 'link board must verify remote codes server-side');
assert(board.includes("cloudRequest('links.pull')"), 'link board must pull shared occupancy on every device');

assert(backend.includes("require_once __DIR__ . '/admin-device.php'"), 'link writes must reuse the Windows Hello server session');
assert(backend.includes("const HCS_SHARED_SCOPE = 'global'"), 'all devices must converge on one shared scope');
assert(backend.includes("const HCS_LINK_TABLE = 'hashcod_shared_links'"), 'normalized shared link table missing');
assert(backend.includes("const HCS_IMAGE_TABLE = 'hashcod_shared_images'"), 'normalized shared image table missing');
assert(backend.includes("/rest/v1/rpc/hashcod_sync_upsert_links"), 'link writes must use the atomic Postgres RPC');
assert(backend.includes("function hcsLoadLinkSlots()"), 'safe shared occupancy projection missing');
assert(backend.includes("select=slot,created_at_ms,updated_at_ms"), 'public link pull must expose occupancy metadata only');
assert(!backend.includes("hcsJson(hcsLoadLinks()"), 'public link pull must not expose destination URLs or hashes');
assert(backend.includes("if ($action === 'links.push'"), 'protected link push route missing');
assert(backend.includes('adminRequire();'), 'link assignment must require the verified Windows Hello admin session');
assert(backend.includes("if ($action === 'links.open'"), 'server-side code verification route missing');
assert(backend.includes("hash('sha256', $code)"), 'server must hash the submitted link code');
assert(backend.includes('hash_equals($storedHash, $suppliedHash)'), 'server must compare link hashes in constant time');
assert(backend.includes("securityRateAllowSliding('hashcod_link_open'"), 'remote code attempts must be rate limited');
assert(backend.includes("in_array($scheme, ['http', 'https'], true)"), 'synced links must remain HTTP/HTTPS only');
assert(backend.includes("securityRequireAccountSession()"), 'image sync must retain authenticated account protection');
assert(backend.includes("supabaseDbUpsert(HCS_IMAGE_TABLE"), 'gallery metadata must persist in normalized PostgreSQL rows');
assert(backend.includes('supabaseStorageUpload('), 'PNG bytes must persist in Supabase Storage');
assert(backend.includes('supabaseStorageDownload('), 'PNG bytes must be restorable on another device');
assert(backend.includes("'code_hash' => $codeHash"), 'only the hashed gallery code should be synchronized');
assert(!backend.includes("'code' => $_POST"), 'plain gallery codes must never be written to cloud storage');
assert(backend.includes("'shared' => true"), 'sync status must identify the shared global mode');

assert(loader.includes("vector-classroom-board.js?v=20260913-2"), 'platform must load the fresh link-board parent module');
assert(loader.includes("cloud-device-sync.js?v=20260913-2"), 'platform loader must start the current cloud-device sync version');
assert(loader.includes('data-hashcod-cloud-sync'), 'cloud sync loader guard missing');

console.log('Cloud device sync contract OK');