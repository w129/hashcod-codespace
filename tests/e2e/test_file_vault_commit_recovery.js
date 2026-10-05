const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoDir = path.resolve(__dirname, '../..');
const recovery = fs.readFileSync(path.join(repoDir, 'components/file-vault-commit-recovery.js'), 'utf8');
const loader = fs.readFileSync(path.join(repoDir, 'components/mldsa-access-gate-loader.js'), 'utf8');

assert(recovery.includes("var VERSION='20261005-file-vault-commit-recovery1'"), 'recovery runtime version missing');
assert(recovery.includes("hashcod:hfv:pending-cloud-commits:v1"), 'pending commit persistence key missing');
assert(recovery.includes('RETRY_DELAYS=[0,650,1600,3200,6500]'), 'commit retry backoff missing');
assert(recovery.includes("action=complete"), 'fast-upload completion interception missing');
assert(recovery.includes('remember(ticket)'), 'upload ticket must be persisted before completion');
assert(recovery.includes('forget(ticket)'), 'successful/non-retryable tickets must be cleared');
assert(recovery.includes('completeWithRetry'), 'completion retry routine missing');
assert(recovery.includes('setInterval(recoverPending,15000)'), 'background pending-commit recovery missing');
assert(recovery.includes("window.addEventListener('online',recoverPending)"), 'online recovery hook missing');
assert(recovery.includes("window.addEventListener('focus',recoverPending)"), 'focus recovery hook missing');
assert(recovery.includes("hashcod:file-vault-cloud-committed"), 'cloud-commit event missing');
assert(recovery.includes("#d5FileVault .hfv-list-head button"), 'File Vault refresh trigger missing');

assert(loader.includes("file-vault-commit-recovery.js?v=20261005-file-vault-commit-recovery1"), 'loader does not include commit recovery');
assert(loader.indexOf('recovery.addEventListener') < loader.indexOf('document.head.appendChild(recovery)'), 'recovery load handler must be attached before insertion');
assert(loader.includes('appendFileVaultFast'), 'fast transport continuation missing');

console.log('File Vault commit recovery contract OK');
