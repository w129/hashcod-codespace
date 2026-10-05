const fs = require('fs');
const path = require('path');
const assert = require('assert');

const repoDir = path.resolve(__dirname, '../..');
const php = fs.readFileSync(path.join(repoDir, 'hashcod-file-vault-fast-upload.php'), 'utf8');
const fast = fs.readFileSync(path.join(repoDir, 'components/file-vault-fast-upload-v4.js'), 'utf8');
const loader = fs.readFileSync(path.join(repoDir, 'components/mldsa-access-gate-loader.js'), 'utf8');

assert(php.includes("storage/v1/object/upload/sign/"), 'signed direct upload route missing');
assert(php.includes(".storage.supabase.co"), 'direct Supabase storage hostname optimization missing');
assert(php.includes("aws-style-direct-object-transfer"), 'AWS/S3-style transfer strategy marker missing');
assert(php.includes("github.com/swoodford/aws"), 'requested AWS upstream attribution missing');
assert(php.includes("supabaseSyncFileRecord"), 'same l8_files database finalization missing');
assert(php.includes("totp_secret_cipher"), 'TOTP protection metadata must be preserved');
assert(php.includes("HFVU_TICKET_TTL"), 'signed finalization ticket missing');

assert(fast.includes("20261005-file-vault-fast4-route2"), 'fast4 upload runtime version missing');
assert(fast.includes("?action=prepare"), 'prepare phase missing');
assert(fast.includes("?action=complete"), 'complete phase missing');
assert(fast.includes("xhr.open('PUT',url,true)"), 'direct object PUT transport missing');
assert(fast.includes("TUS_THRESHOLD=6*1024*1024"), '6 MB resumable threshold missing');
assert(fast.includes("TUS_CHUNK_SIZE=6*1024*1024"), 'required 6 MB TUS chunk size missing');
assert(fast.includes("/storage/v1/upload/resumable"), 'Supabase TUS endpoint missing');
assert(fast.includes("'Tus-Resumable':'1.0.0'"), 'TUS protocol header missing');
assert(fast.includes("'x-signature':token"), 'signed TUS token header missing');
assert(fast.includes("method:'PATCH'"), 'TUS chunk PATCH transport missing');
assert(fast.includes("method:'HEAD'"), 'TUS resume offset probe missing');
assert(fast.includes("Upload-Offset"), 'TUS offset tracking missing');
assert(fast.includes("localStorage.setItem(key,url)"), 'TUS resumable URL persistence missing');
assert(fast.includes("RETRY_DELAYS=[0,450,1200,2400,4200]"), 'retry/backoff schedule missing');
assert(fast.includes("window.addEventListener('change',captureFilesEvent,true)"), 'window capture must block legacy React upload first');
assert(fast.includes("document.addEventListener('change',captureFilesEvent,true)"), 'document capture fallback missing');
assert(fast.includes("event.stopImmediatePropagation()"), 'legacy React upload path must be bypassed');
assert(fast.includes("requestSetup(file.name"), 'TOTP must run before direct transfer');
assert(fast.includes("Resumable path unavailable · switching to direct cloud"), 'large-file direct fallback missing');
assert(fast.includes("localBlocking:false"), 'IndexedDB must not block cloud transfer');
assert(fast.includes("legacyPhpFallback:false"), 'slow PHP file fallback must stay disabled');
assert(!fast.includes("error.fallback"), 'fast4 must not silently return to the slow PHP upload');
assert(fast.includes("direct-signed-storage+tus-resumable"), 'hybrid direct/resumable transport marker missing');

const fastIndex = loader.indexOf('file-vault-fast-upload-v4.js?v=20261005-file-vault-fast4-route2');
const totpIndex = loader.indexOf('file-vault-totp.bundle.js?v=20261005-file-vault-totp2');
assert(fastIndex >= 0, 'fast4 upload runtime is not loaded');
assert(totpIndex >= 0, 'TOTP runtime is not loaded');
assert(fastIndex < totpIndex, 'fast4 upload runtime must be declared before TOTP runtime');
assert(loader.includes("fast.addEventListener('load',appendFileVaultTotp"), 'TOTP must wait for fast4 upload patch');

console.log('File Vault fast4 direct + resumable upload contract OK');
