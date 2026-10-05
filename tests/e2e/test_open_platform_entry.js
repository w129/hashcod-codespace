const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoDir = path.resolve(__dirname, '../..');
const loader = fs.readFileSync(path.join(repoDir, 'components/mldsa-access-gate-loader.js'), 'utf8');
const workspaceAccess = fs.readFileSync(path.join(repoDir, 'hashcod-workspace-access.php'), 'utf8');

assert(loader.includes("var VERSION='20261005-open-entry6'"), 'open-entry runtime version missing');
assert(loader.includes("mode:'open-entry'"), 'platform must identify direct open-entry mode');
assert(loader.includes('required:false'), 'entry lock must be disabled');
assert(loader.includes("dataset.hashcodEntryLock='disabled'"), 'DOM must expose disabled entry lock state');
assert(loader.includes('openPlatform()'), 'direct platform bootstrap missing');
assert(loader.includes("loadUniversalPersistence();"), 'open entry must keep cloud persistence bootstrap');
assert(loader.includes("loadWorkspaceMedia();"), 'open entry must keep workspace media bootstrap');
assert(loader.includes("loadFileVaultTotp();"), 'open entry must load File Vault TOTP runtime');
assert(loader.includes("file-vault-commit-recovery.js?v=20261005-file-vault-commit-recovery1"), 'open entry must load File Vault commit recovery');
assert(loader.includes("file-vault-fast-upload-v5.js?v=20261005-file-vault-fast5"), 'open entry must load fast5 File Vault transport');
assert(loader.indexOf('FILE_VAULT_RECOVERY') < loader.indexOf('FILE_VAULT_TOTP'), 'commit recovery must be declared before TOTP');
assert(loader.indexOf('FILE_VAULT_TOTP') < loader.indexOf('FILE_VAULT_FAST'), 'TOTP must be declared before fast transport');
assert(loader.includes("hashcod:code-access-granted"), 'compatibility event for platform modules missing');

assert(!loader.includes("var API='/api/code-access'"), 'entry loader must not call the code-access API');
assert(!loader.includes('function buildGate()'), 'numeric access gate builder must be removed');
assert(!loader.includes('numeric-series-window'), 'numeric access modal markup must be removed');
assert(!loader.includes('d5NumericSeriesValidate'), 'numeric validation button must be removed');
assert(!loader.includes('fetch(API'), 'entry must not wait for validation before opening');

assert(workspaceAccess.includes('hashcodWorkspaceAccountId()'), 'workspace must support normal account identity after gate removal');
assert(workspaceAccess.includes('authSessionTokenFromRequest()'), 'workspace account session lookup missing');
assert(workspaceAccess.includes('authValidateSession($token)'), 'workspace must validate account sessions server-side');
assert(workspaceAccess.includes('hashcodWorkspaceNumericData()'), 'legacy authorized devices must retain compatibility');
assert(!workspaceAccess.includes("return 'global'"), 'workspace must not fall back to a public global identifier');

console.log('Direct platform entry contract OK');
