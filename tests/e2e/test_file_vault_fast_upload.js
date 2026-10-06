const fs = require('fs');
const path = require('path');
const assert = require('assert');

const repoDir = path.resolve(__dirname, '../..');
const php = fs.readFileSync(path.join(repoDir, 'hashcod-file-vault-fast-upload.php'), 'utf8');
const fast = fs.readFileSync(path.join(repoDir, 'components/file-vault-fast-upload-v5.js'), 'utf8');
const loader = fs.readFileSync(path.join(repoDir, 'components/mldsa-access-gate-loader.js'), 'utf8');

assert(php.includes("storage/v1/object/upload/sign/"), 'signed direct upload route missing');
assert(php.includes(".storage.supabase.co"), 'direct Supabase storage hostname optimization missing');
assert(php.includes("aws-style-direct-object-transfer"), 'AWS/S3-style transfer strategy marker missing');
assert(php.includes("github.com/swoodford/aws"), 'requested AWS upstream attribution missing');
assert(php.includes("supabaseSyncFileRecord"), 'same l8_files database finalization missing');
assert(php.includes("totp_secret_cipher"), 'TOTP protection metadata must be preserved');
assert(php.includes("HFVU_TICKET_TTL"), 'signed finalization ticket missing');

assert(fast.includes("20261005-file-vault-fast5-route2"), 'fast5 upload runtime version missing');
assert(fast.includes("?action=prepare"), 'prepare phase missing');
assert(fast.includes("?action=complete"), 'complete phase missing');
assert(fast.includes("xhr.open('PUT',url,true)"), 'direct signed PUT transport missing');
assert(fast.includes("RETRY_DELAYS=[0,500,1400,3000]"), 'retry/backoff schedule missing');
assert(fast.includes("requestSetup(file.name"), 'TOTP must run before transfer');
assert(fast.includes("browser → Supabase Storage"), 'direct transfer phase marker missing');
assert(fast.includes("phpProxyBytes:false"), 'Railway/PHP must not proxy file bytes');
assert(fast.includes("legacyPhpFallback:false"), 'slow PHP byte fallback must stay disabled');
assert(fast.includes("supabase-signed-direct"), 'signed direct transport marker missing');
assert(!fast.includes("x-signature"), 'fast5 must not misuse signed-upload tokens as TUS credentials');
assert(!fast.includes("/storage/v1/upload/resumable"), 'fast5 must not use undocumented signed-token TUS path');

const totpIndex = loader.indexOf('file-vault-totp.bundle.js?v=20261006-file-vault-actions-totp1');
const fastIndex = loader.indexOf('file-vault-fast-upload-v5.js?v=20261005-file-vault-fast5-route2');
assert(totpIndex >= 0, 'TOTP runtime is not loaded');
assert(fastIndex >= 0, 'fast5 upload runtime is not loaded');
assert(totpIndex < fastIndex, 'TOTP runtime must be declared before fast5 transport');
assert(loader.includes("script.addEventListener('load',appendFileVaultFast"), 'fast5 must load after TOTP is ready');

console.log('File Vault fast5 signed-direct upload contract OK');
