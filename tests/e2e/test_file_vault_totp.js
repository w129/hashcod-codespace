const assert = require('assert');
const fs = require('fs');

const backend = fs.readFileSync('hashcod-file-vault.php', 'utf8');
const ui = fs.readFileSync('file-vault-totp-build/entry.jsx', 'utf8');
const css = fs.readFileSync('components/file-vault-totp.css', 'utf8');
const loader = fs.readFileSync('components/mldsa-access-gate-loader.js', 'utf8');
const docker = fs.readFileSync('Dockerfile', 'utf8');
const goMod = fs.readFileSync('tools/file-vault-totp/go.mod', 'utf8');
const goMain = fs.readFileSync('tools/file-vault-totp/main.go', 'utf8');

// Cross-device File Vault namespace.
assert(backend.includes("hashcod-file-vault-global-v3"), 'new File Vault uploads must use a stable cross-device namespace');
assert(backend.includes('hfvLegacyAccount()'), 'legacy workspace files must remain readable during migration');
assert(backend.includes("'scope' => 'cross-device'"), 'list response must declare cross-device scope');

// TOTP backend contract.
assert(goMod.includes('github.com/pquerna/otp v1.5.0'), 'pquerna/otp dependency must be pinned');
assert(goMain.includes('github.com/pquerna/otp/totp'), 'Go helper must call pquerna/otp/totp directly');
assert(goMain.includes('totp.ValidateCustom'), 'Go helper must validate TOTP with pquerna/otp');
assert(goMain.includes('Period:    30'), 'TOTP period must be 30 seconds');
assert(goMain.includes('Digits:    otp.DigitsSix'), 'TOTP must use six digits');
assert(backend.includes("'/usr/local/bin/hashcod-file-vault-totp'") && backend.includes("'/tools/file-vault-totp/hashcod-file-vault-totp.exe'"), 'PHP must invoke the platform compiled TOTP helper');
assert(backend.includes("'aes-256-gcm'"), 'TOTP secrets must be encrypted at rest with AES-256-GCM');
assert(backend.includes('totp_secret_cipher'), 'encrypted TOTP metadata is missing');
assert(backend.includes("'totpProtected' => hfvTotpProtected($row)"), 'file list must expose only protection status');
assert(!backend.includes("'totpSecret' =>"), 'file list must never expose a TOTP secret');
assert(backend.includes("securityRateAllowSliding('hashcod_file_vault_totp_"), 'TOTP attempts must be rate limited');
assert(backend.includes("$_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'download'"), 'protected download must use POST');
assert(backend.includes('hfvRequireTotp($row'), 'download/delete must enforce TOTP');

// Animate UI / Motion dialog and File Vault interception.
assert(ui.includes('AnimatePresence') && ui.includes('motion'), 'TOTP window must use the Animate UI Motion pattern');
assert(ui.includes('data-animate-ui-dialog="file-vault-totp"'), 'Animate UI dialog marker missing');
assert(ui.includes('totp_secret') && ui.includes('totp_code'), 'upload interceptor must attach TOTP setup data');
assert(ui.includes('action=download') && ui.includes('method: "POST"'), 'protected downloads must be fetched after TOTP verification');
assert(ui.includes('action=delete'), 'protected deletion guard missing');
assert(ui.includes('generateSecret()'), 'TOTP setup key generator missing');
assert(css.includes('.hfv-totp-dialog'), 'TOTP dialog styles missing');
assert(css.includes('.hfv-totp-row-badge'), 'TOTP protection badge styles missing');
assert(css.includes('z-index:2147483647!important'), 'TOTP dialog must render above the File Vault modal');
assert(css.includes('.hfv-totp-dialog{position:relative;z-index:1'), 'TOTP dialog stacking context is missing');

// Production build and runtime loading.
assert(docker.includes('FROM golang:1.24-alpine AS file-vault-totp-builder'), 'Docker Go builder stage missing');
assert(docker.includes('/out/hashcod-file-vault-totp'), 'TOTP helper binary build missing');
assert(docker.includes('file-vault-totp-build'), 'Animate UI TOTP bundle build missing');
assert(loader.includes('file-vault-totp.bundle.js?v=20261006-file-vault-setup-verify2'), 'TOTP runtime bundle is not loaded');
assert(loader.includes('file-vault-totp.css?v=20261005-file-vault-download-totp5'), 'TOTP stacking-fix CSS is not loaded');

console.log('File Vault TOTP contract OK');
