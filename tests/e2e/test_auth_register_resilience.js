const fs = require('fs');
const path = require('path');
const assert = require('assert');

const repoDir = path.resolve(__dirname, '../..');
const source = fs.readFileSync(path.join(repoDir, 'components/auth-register-resilience.js'), 'utf8');
const layout = fs.readFileSync(path.join(repoDir, 'components/auth-vector-layout-fix.js'), 'utf8');

assert(source.includes("const REGISTER_PATH = '/api/auth/register'"), 'register endpoint contract missing');
assert(source.includes('const REQUEST_TIMEOUT_MS = 20000'), 'registration timeout must stay bounded');
assert(source.includes('new AbortController()'), 'register requests must be abortable');
assert(source.includes("button.disabled = Boolean(busy)"), 'register button busy state must be controlled');
assert(source.includes("window.setTimeout(function ()"), 'registration watchdog missing');
assert(source.includes('fallbackRegister(button)'), 'inert click fallback missing');
assert(source.includes("cf_turnstile_response: cfToken"), 'Turnstile token must be preserved');
assert(source.includes("privacy_accepted: true"), 'privacy acceptance contract missing');
assert(source.includes("checkout_accepted: true"), 'checkout acceptance contract missing');
assert(source.includes("response.text()"), 'registration should parse server responses defensively');
assert(source.includes("setBusy(button, false)"), 'button must always be released after registration attempt');

// Registration-kit regression coverage. These are the real IDs in index.php.
assert(source.includes("['authKeyRecOut', 'authKeyRecoveryOut']"), 'recovery key must render into the live auth output');
assert(source.includes("['authKeyBackupOut', 'authKeyBackupsOut']"), 'backup codes must render into the live auth output');
assert(source.includes("registeredSessionToken: ''"), 'fallback registration must retain the returned session token');
assert(source.includes("registeredKeysText: ''"), 'fallback registration must retain a copyable key kit');
assert(source.includes("target.closest('#authCopyKeysBtn')"), 'copy-kit fallback action missing');
assert(source.includes("target.closest('#authEnterAfterRegisterBtn')"), 'enter-after-register fallback action missing');
assert(source.includes("navigator.clipboard.writeText(value)"), 'Clipboard API path missing');
assert(source.includes("document.execCommand('copy')"), 'clipboard fallback missing');
assert(source.includes("sessionStorage.setItem(AUTH_TOKEN_KEY, state.registeredSessionToken)"), 'registered session must be persisted before entering');
assert(source.includes("window.location.reload()"), 'platform must reinitialize using the newly stored authenticated session');
assert(layout.includes("auth-register-resilience.js?v=20260914-2"), 'auth layout must load the latest registration resilience runtime');

console.log('auth register resilience contract: OK');
