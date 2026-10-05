const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoDir = path.resolve(__dirname, '../..');
const source = fs.readFileSync(path.join(repoDir, 'components/cloud-device-sync.js'), 'utf8');
const board = fs.readFileSync(path.join(repoDir, 'components/vector-link-board.js'), 'utf8');
const backend = fs.readFileSync(path.join(repoDir, 'hashcod-sync.php'), 'utf8');
const loader = fs.readFileSync(path.join(repoDir, 'components/admin-hello-button.js'), 'utf8');
const accessLoader = fs.readFileSync(path.join(repoDir, 'components/mldsa-access-gate-loader.js'), 'utf8');
const workspaceAccess = fs.readFileSync(path.join(repoDir, 'hashcod-workspace-access.php'), 'utf8');
const workspaceState = fs.readFileSync(path.join(repoDir, 'hashcod-workspace-state.php'), 'utf8');
const universal = fs.readFileSync(path.join(repoDir, 'components/universal-cloud-persistence.js'), 'utf8');
const fileVault = fs.readFileSync(path.join(repoDir, 'hashcod-file-vault.php'), 'utf8');
const workspaceBlob = fs.readFileSync(path.join(repoDir, 'hashcod-workspace-blob.php'), 'utf8');
const productImageCloud = fs.readFileSync(path.join(repoDir, 'components/product-image-cloud-sync.js'), 'utf8');
const workspaceImageBackend = fs.readFileSync(path.join(repoDir, 'hashcod-workspace-image-vault.php'), 'utf8');
const workspaceImageSync = fs.readFileSync(path.join(repoDir, 'components/workspace-image-vault-sync.js'), 'utf8');
const workspaceMedia = fs.readFileSync(path.join(repoDir, 'components/workspace-media-bootstrap.js'), 'utf8');

assert(source.includes("const ENDPOINT = '/hashcod-sync.php'"), 'cloud sync endpoint missing');
assert(source.includes("const LINK_DB = 'hashcod_link_board_v1'"), 'link-board cache namespace must remain documented');
assert(source.includes("const IMAGE_DB = 'hashcod_image_vault_v1'"), 'image-vault local cache must be synchronized');
assert(source.includes("credentials: 'same-origin'"), 'sync requests must keep same-origin credentials');
assert(source.includes("'X-Requested-With': 'XMLHttpRequest'"), 'sync POSTs must carry the CSRF marker');
assert(source.includes("jsonRequest('links.pull')"), 'background sync must observe shared link occupancy');
assert(source.includes("document.documentElement.dataset.adminAuthenticated === 'true'"), 'protected bootstrap must check the verified admin state');
assert(source.includes("jsonRequest('links.push'"), 'verified laptop bootstrap must migrate protected local links to PostgreSQL');
assert(source.includes("window.addEventListener('hashcod:admin-auth'"), 'positive Windows Hello must trigger protected local migration');
assert(source.includes("event.detail.authenticated !== true"), 'link bootstrap must never run for an unverified admin event');
assert(source.includes('!remoteSlots.has(row.slot)'), 'bootstrap must only upload laptop-only slots and never overwrite an existing cloud slot');
assert(source.includes("jsonRequest('images.list')"), 'gallery must pull cloud metadata');
assert(source.includes('action=images.upload'), 'gallery must push PNG files to cloud storage');
assert(source.includes('action=images.get'), 'gallery must download missing cloud PNG files');
assert(source.includes('SYNC_INTERVAL_MS = 15000'), 'background cloud sync must use the lower-overhead 15-second cadence');
assert(source.includes('MIN_AUTOMATIC_GAP_MS = 4000'), 'automatic sync bursts must be deduplicated');
assert(source.includes("document.visibilityState === 'hidden'"), 'automatic sync must pause in hidden tabs');
assert(source.includes('state.shared = status.shared === true'), 'client must track global shared mode');
assert(source.includes("window.addEventListener('focus'"), 'phone/laptop focus must trigger reconciliation');
assert(source.includes("window.HashcodCloudSync = Object.freeze"), 'manual cloud sync API missing');

assert(board.includes("cloudRequest('links.push'"), 'link board itself must perform Windows Hello protected writes');
assert(board.includes("cloudRequest('links.open'"), 'link board must verify remote codes server-side');
assert(board.includes("cloudRequest('links.pull'"), 'link board must pull shared occupancy on every device');

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
assert(backend.includes("securityRequireAccountSession()"), 'legacy image sync must retain authenticated account protection');
assert(backend.includes("supabaseDbUpsert(HCS_IMAGE_TABLE"), 'gallery metadata must persist in normalized PostgreSQL rows');
assert(backend.includes('supabaseStorageUpload('), 'PNG bytes must persist in Supabase Storage');
assert(backend.includes('supabaseStorageDownload('), 'PNG bytes must be restorable on another device');
assert(backend.includes("'code_hash' => $codeHash"), 'only the hashed gallery code should be synchronized');
assert(!backend.includes("'code' => $_POST"), 'plain gallery codes must never be written to cloud storage');
assert(backend.includes("'shared' => true"), 'sync status must identify the shared global mode');

assert(loader.includes("vector-classroom-board.js?v=20260913-2"), 'platform must load the fresh link-board parent module');
assert(loader.includes("cloud-device-sync.js?v=20260919-perf1"), 'platform loader must bust cache for the current cloud-device sync version');
assert(loader.includes('data-hashcod-cloud-sync'), 'cloud sync loader guard missing');

// Universal workspace identity: numeric access authenticates a stable cloud namespace
// without exposing the raw numeric series or broadening account/admin sessions.
assert(workspaceAccess.includes("l8_numeric_series_access_v1"), 'workspace must derive identity from the numeric-access cookie');
assert(workspaceAccess.includes("numeric-series-access-v1"), 'workspace must validate the numeric access cookie kind');
assert(workspaceAccess.includes('mldsaOpen('), 'workspace cookie must be cryptographically opened server-side');
assert(workspaceAccess.includes("hash_hmac('sha256'"), 'workspace identifier must be derived through HMAC');
assert(!workspaceAccess.includes('securityRequireAccountSession()'), 'workspace identity must not masquerade as a general account session');

// Universal localStorage persistence.
assert(workspaceState.includes("const HCWS_APP_ID = 'hashcod-universal-workspace'"), 'universal workspace app id missing');
assert(workspaceState.includes("supabaseDbSelect('l8_app_states'"), 'workspace state must restore from Supabase app state');
assert(workspaceState.includes("supabaseDbUpsert('l8_app_states'"), 'workspace state must persist to Supabase app state');
assert(workspaceState.includes("'deleted' => $deleted"), 'workspace deletion tombstones missing');
assert(workspaceState.includes('hcwsSensitiveKey'), 'server-side secret-key filtering missing');
assert(workspaceState.includes('HCWS_MAX_VALUE_BYTES'), 'per-value cloud size ceiling missing');
assert(universal.includes("var VERSION='20261004-universal-cloud2'"), 'universal persistence cache version changed unexpectedly');
assert(universal.includes("ENDPOINT='/hashcod-workspace-state.php'"), 'universal persistence endpoint missing');
assert(universal.includes('setInterval(markLocalChanges,2000)'), 'local persistent state must be observed continuously');
assert(universal.includes('setInterval(function(){if(document.visibilityState'), 'cross-device cloud pull loop missing');
assert(universal.includes("hashcod:cloud-state-restored"), 'cloud restore event missing');
assert(universal.includes('dilithium') && universal.includes('crypto') && universal.includes('certified'), 'cryptographic material must be excluded from universal sync');
assert(universal.includes('tombstone') || universal.includes("deleted:true"), 'universal deletion propagation missing');

// File Vault uses the same numeric workspace namespace on every device.
assert(fileVault.includes("require_once __DIR__ . '/hashcod-workspace-access.php'"), 'File Vault must load shared workspace identity');
assert(fileVault.includes('hashcodWorkspaceAccessAuthorized()'), 'File Vault must prefer shared workspace authorization');
assert(fileVault.includes('hashcodWorkspaceKey()'), 'File Vault must index cloud files under the shared workspace');
assert(fileVault.includes('supabaseStorageUpload('), 'File Vault bytes must remain in Supabase Storage');
assert(fileVault.includes("supabaseDbSelect('l8_files'"), 'File Vault must restore metadata from PostgreSQL');

// Product Card media is a real cloud blob, not a browser-only IndexedDB object.
assert(workspaceBlob.includes("'product-image'"), 'workspace blob allowlist must include Product Card image');
assert(workspaceBlob.includes('supabaseStorageUpload('), 'Product Card image must upload to Supabase Storage');
assert(workspaceBlob.includes('supabaseStorageDownload('), 'Product Card image must restore from Supabase Storage');
assert(productImageCloud.includes("DB_NAME = 'hashcod-entry-product-media-v1'") || productImageCloud.includes("DB_NAME='hashcod-entry-product-media-v1'"), 'Product Card cloud sync must reuse its IndexedDB namespace');
assert(productImageCloud.includes("ENDPOINT='/hashcod-workspace-blob.php?key=product-image'"), 'Product Card cloud endpoint missing');
assert(productImageCloud.includes("window.HashcodProductImageCloud"), 'Product Card manual cloud sync API missing');

// Image Vault also receives a workspace-scoped reconciler so numeric access works
// cross-device without turning the numeric gate into an admin/account session.
assert(workspaceImageBackend.includes("HCWIV_META_VAULT = 'hashcod-image-vault'"), 'workspace Image Vault marker missing');
assert(workspaceImageBackend.includes('supabaseStorageUpload('), 'workspace Image Vault upload missing');
assert(workspaceImageBackend.includes('supabaseStorageDownload('), 'workspace Image Vault restore missing');
assert(workspaceImageBackend.includes("supabaseDbSelect('l8_files'"), 'workspace Image Vault metadata restore missing');
assert(workspaceImageSync.includes("DB_NAME='hashcod_image_vault_v1'"), 'workspace Image Vault must reuse the local IndexedDB namespace');
assert(workspaceImageSync.includes("ENDPOINT='/hashcod-workspace-image-vault.php'"), 'workspace Image Vault endpoint missing');
assert(workspaceImageSync.includes('setInterval(sync,15000)'), 'workspace Image Vault reconciliation interval missing');
assert(workspaceImageSync.includes('codeHash'), 'workspace Image Vault must preserve save-code hashes');

assert(workspaceMedia.includes('product-image-cloud-sync.js?v=20261004-product-image-cloud1'), 'workspace media bootstrap must load Product Card sync');
assert(workspaceMedia.includes('workspace-image-vault-sync.js?v=20261004-image-vault-workspace1'), 'workspace media bootstrap must load Image Vault sync');
assert(accessLoader.includes("20261004-numeric-series5"), 'numeric gate cache version must include universal persistence');
assert(accessLoader.includes("universal-cloud-persistence.js?v=20261004-universal-cloud2"), 'access gate must load current universal persistence version');
assert(accessLoader.includes("workspace-media-bootstrap.js?v=20261004-workspace-media1"), 'access gate must load workspace media sync');

console.log('Cloud device sync contract OK');
