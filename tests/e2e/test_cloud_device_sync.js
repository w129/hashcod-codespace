const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoDir = path.resolve(__dirname, '../..');
const source = fs.readFileSync(path.join(repoDir, 'components/cloud-device-sync.js'), 'utf8');
const backend = fs.readFileSync(path.join(repoDir, 'hashcod-sync.php'), 'utf8');
const loader = fs.readFileSync(path.join(repoDir, 'components/admin-hello-button.js'), 'utf8');

assert(source.includes("const ENDPOINT = '/hashcod-sync.php'"), 'cloud sync endpoint missing');
assert(source.includes("const LINK_DB = 'hashcod_link_board_v1'"), 'link-board local cache must be synchronized');
assert(source.includes("const IMAGE_DB = 'hashcod_image_vault_v1'"), 'image-vault local cache must be synchronized');
assert(source.includes("credentials: 'same-origin'"), 'sync requests must use the authenticated account cookie');
assert(source.includes("'X-Requested-With': 'XMLHttpRequest'"), 'cookie sync requests must carry the CSRF marker');
assert(source.includes("jsonRequest('links.pull')"), 'link state must pull from Postgres');
assert(source.includes("jsonRequest('links.push'"), 'link state must push to Postgres');
assert(source.includes("jsonRequest('images.list')"), 'gallery must pull cloud metadata');
assert(source.includes("action=images.upload"), 'gallery must push PNG files to cloud storage');
assert(source.includes("action=images.get"), 'gallery must download missing cloud PNG files');
assert(source.includes('SYNC_INTERVAL_MS = 15000'), 'cross-device sync cadence missing');
assert(source.includes("window.addEventListener('focus'"), 'phone/laptop focus must trigger reconciliation');
assert(source.includes("window.HashcodCloudSync = Object.freeze"), 'manual cloud sync API missing');

assert(backend.includes("securityRequireAccountSession()"), 'sync backend must require a real authenticated account');
assert(backend.includes("supabaseDbUpsert('l8_app_states'"), 'link board must persist in Supabase Postgres');
assert(backend.includes("supabaseDbSelect('l8_app_states'"), 'link board must read from Supabase Postgres');
assert(backend.includes("supabaseDbUpsert('l8_files'"), 'gallery metadata must persist in Supabase Postgres');
assert(backend.includes('supabaseStorageUpload('), 'PNG bytes must persist in Supabase Storage');
assert(backend.includes('supabaseStorageDownload('), 'PNG bytes must be restorable on another device');
assert(backend.includes("'code_hash' => $codeHash"), 'only the hashed gallery code should be synchronized');
assert(!backend.includes("'code' => $_POST"), 'plain gallery codes must never be written to cloud storage');
assert(backend.includes("in_array($scheme, ['http', 'https'], true)"), 'synced links must remain HTTP/HTTPS only');

assert(loader.includes("cloud-device-sync.js?v=20260912-1"), 'platform loader must start cloud-device sync');
assert(loader.includes('data-hashcod-cloud-sync'), 'cloud sync loader guard missing');

console.log('Cloud device sync contract OK');
