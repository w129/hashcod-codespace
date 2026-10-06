const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../..');
const facade = fs.readFileSync(path.join(root, 'hashcod-shared-cloud.php'), 'utf8');
const router = fs.readFileSync(path.join(root, 'router.php'), 'utf8');
const state = fs.readFileSync(path.join(root, 'components/universal-cloud-persistence.js'), 'utf8');
const fast = fs.readFileSync(path.join(root, 'components/file-vault-fast-upload-v5.js'), 'utf8');
const explorer = fs.readFileSync(path.join(root, 'file-vault-totp-build/entry.jsx'), 'utf8');
const html = fs.readFileSync(path.join(root, 'mldsa-access.php'), 'utf8');
const edge = fs.readFileSync(path.join(root, 'supabase/functions/hashcod-shared-cloud/index.ts'), 'utf8');
const files = fs.readFileSync(path.join(root, 'supabase/functions/hashcod-shared-cloud/files.ts'), 'utf8');
const migration = fs.readFileSync(path.join(root, 'supabase/migrations/20261006141143_shared_workspace_cloud.sql'), 'utf8');
const core = fs.readFileSync(path.join(root, 'supabase/functions/hashcod-shared-cloud/core.ts'), 'utf8');
const visibleExplorer = fs.readFileSync(path.join(root, 'center-empty-state-build/entry.jsx'), 'utf8');

for (const route of ['/api/hashcod-shared-files', '/api/hashcod-shared-upload', '/api/hashcod-shared-state', '/api/hashcod-shared-text-editor']) {
  assert(router.includes(route), `router must expose ${route}`);
}
assert(facade.includes('HASHCOD_SHARED_CLOUD_URL'), 'shared facade must allow a configured Edge URL');
assert(facade.includes('hashcodSharedCloudHandle'), 'shared facade handler missing');
assert(facade.includes('application/octet-stream'), 'shared facade must preserve binary downloads');
assert(facade.includes('hashcod:text-editor:draft:v1'), 'shared text editor key missing');
assert(state.includes("'/api/hashcod-shared-state'"), 'workspace state must use shared endpoint');
assert(fast.includes("'/api/hashcod-shared-upload'"), 'File Vault upload must use shared endpoint');
assert(explorer.includes('hashcod-shared-files'), 'File Vault explorer must use shared endpoint');
assert(visibleExplorer.includes('"/api/hashcod-shared-files"'), 'visible Files tree must read the shared index');
assert(html.includes('data-hashcod-shared-workspace="1"'), 'entry HTML must advertise shared mode');
assert(edge.includes("action === 'state'"), 'Edge function state action missing');
assert(edge.includes("action.startsWith('files.')"), 'Edge function file actions missing');
assert(files.includes('equal(row.code_hash'), 'download/delete must verify uploader code server-side');
assert(files.includes("status = 'deleted'"), 'delete must persist a tombstone');
assert(core.includes('MAX_FILE_BYTES = 52428800'), 'bucket limit must fit the project Storage limit');
assert(core.includes('file_size_limit: MAX_FILE_BYTES'), 'bucket creation must use the supported limit');
assert(files.includes('size > MAX_FILE_BYTES'), 'prepare must reject oversized files before transfer');
assert(migration.includes('create schema if not exists hashcod_shared'), 'shared schema migration missing');
assert(migration.includes('enable row level security'), 'shared tables must keep RLS enabled');

console.log('Shared workspace cross-device contract OK');
