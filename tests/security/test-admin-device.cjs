const assert = require('node:assert/strict');
const fs = require('node:fs');

const client = fs.readFileSync(__dirname + '/../../components/admin-device.js', 'utf8');
const rescue = fs.readFileSync(__dirname + '/../../components/admin-codekey-picker-rescue.js', 'utf8');
const server = fs.readFileSync(__dirname + '/../../admin-device.php', 'utf8');
const html = fs.readFileSync(__dirname + '/../../l8-html.php', 'utf8');

const filename = 'OnIPFeJKssih4mbNLCYXnct6a1L_q84po-KVfKPZInHYbhNJ8OR2n3M2zFJ2zZeK9bqkcmilS1li-3DrTsaUIg.ipynb';
const codekey = 'CODEKEY1:8ccbe307c4199695282e0de07a7a474537d99edf915e71bba5f4f88c6ecff94d';
const jupyter = 'JUPYTER1:d185f92f42837d6a3dbea6dc3bf2a26a348e2df7aa8cdadeb9acf3b2a88c9c56';
const combined = 'HASHCOD1:d02c7f85eccb0e8eb63f26bda3bc82fb86a6f6e80b98c2b35ff982e07c215b5b';

assert(client.includes(filename), 'client must require the registered .ipynb filename');
assert(client.includes('function codeKeyFilenameAllowed(name)'), 'client must safely accept browser duplicate filename suffixes');
assert(client.includes('new AbortController()'), 'administrative request timeout missing');
assert(client.includes("throwOnError = options.throwOnError === true"), 'admin require must support error propagation for protected tools');
assert(client.includes("CodeKey verificada. Acceso administrativo habilitado."), 'successful CodeKey verification status missing');
assert(client.includes("replace(/\\s*\\(\\d+\\)(?=\\.ipynb$)/i, '')"), 'client duplicate suffix normalization missing');
assert(client.includes("fileInput.accept = '.ipynb,application/json'"), 'client must only prompt for notebook/json files');
assert(client.includes('input.click();'), 'CodeKey chooser must be opened by the browser file input');
assert(client.includes("request('verify', {filename: file.name, notebook})"), 'notebook must be verified by the server');
assert(client.includes('Increase the HVV'), 'new CodeKey button label missing');
assert(client.includes('viewBox="0,0,256,256"'), 'requested CodeKey icon missing');
assert(!client.includes('navigator.credentials.get'), 'Windows Hello/WebAuthn client flow must be retired');

const authenticateStart = client.indexOf('async function authenticate');
const pickerPosition = client.indexOf('const file = await pickNotebook();', authenticateStart);
const statusPosition = client.indexOf("const status = await request('status');", authenticateStart);
assert(authenticateStart >= 0 && pickerPosition > authenticateStart, 'authenticate() must invoke the CodeKey picker');
assert(statusPosition > pickerPosition, 'file picker must open before any status network request so browser user activation is preserved');

assert(rescue.includes('const PICKER_SETTLE_DELAY_MS = 700;'), 'picker rescue must wait for the native dialog FileList to settle');
assert(rescue.includes("input.addEventListener('cancel', onCancel)"), 'picker rescue must handle native picker cancellation');
assert(rescue.includes("window.addEventListener('focus', onWindowFocus, true)"), 'picker rescue must detect return from the native chooser');
assert(rescue.includes("input.addEventListener('change', onChange)"), 'picker rescue must capture the selected file from change');
assert(rescue.includes("if (typeof input.showPicker === 'function') input.showPicker();"), 'picker rescue should prefer the browser-native showPicker API');
assert(rescue.includes('finish(currentFile(input));'), 'cancel/focus must re-check FileList instead of immediately treating the selection as empty');
assert(!rescue.includes("input.addEventListener('cancel', () => finish(null)"), 'cancel must never immediately discard a valid selected file');
assert(html.includes('admin-codekey-picker-rescue.js?v=20260919-perf1'), 'hosted HTML must cache-bust and load the CodeKey picker rescue');

assert(rescue.includes("const EFT_TRAY_SELECTOR = '#hashcodVectorTray [data-vector-tray-slot=\"4\"]'"), 'EFT CodeKey gate must target the fifth tray cube');
assert(rescue.includes("const EFT_GATE_ID = 'hashcodEftCodeKeyGate'"), 'EFT CodeKey gate overlay missing');
assert(rescue.includes("document.documentElement.dataset.adminAuthenticated === 'true'"), 'EFT gate must use the authoritative CodeKey admin session state');
assert(rescue.includes('return codeKeyUnlocked() ? nativeRect() : zeroRect();'), 'locked EFT cube must be invisible to the legacy coordinate rescue');
assert(rescue.includes("hotzone.style.setProperty('display', 'none', 'important')"), 'legacy EFT hotzone must be disabled while CodeKey is locked');
assert(rescue.includes('unlockPending = pickNotebook().then'), 'locked EFT click must open the CodeKey picker immediately from user activation');
assert(rescue.includes('const admin = await ensureAdminEngine();'), 'EFT gate must load/wait for the CodeKey engine after file selection');
assert(rescue.includes('const verified = await admin.verifyNotebook(file);'), 'selected CodeKey must be verified through the server-backed admin engine');
assert(rescue.includes('closeEftIfLocked();'), 'EFT must close when the CodeKey session is not active');
assert(rescue.includes("window.addEventListener('hashcod:admin-auth'"), 'EFT gate must react immediately to CodeKey session changes');
assert(rescue.includes('window.HashcodEftCodeKeyGate = Object.freeze'), 'EFT CodeKey gate diagnostics API missing');
assert(rescue.includes("api.download = function ()"), 'programmatic EFT download must also be guarded');
assert(rescue.includes('EFT sigue bloqueado. La CodeKey no fue verificada.'), 'locked-state feedback missing');
assert(rescue.includes("const ADMIN_DEVICE_SRC = componentBase + 'admin-device.js"), 'EFT gate must be able to load the CodeKey engine independently');

assert(server.includes("const ADMIN_DEVICE_NETWORK = '38.196.115.0/24'"), 'IP network restriction must remain');
assert(server.includes(`const ADMIN_CODEKEY_FILENAME = '${filename}'`), 'registered filename must be server-side');
assert(server.includes('function adminCodeKeyFilenameAllowed(string $filename): bool'), 'server duplicate CodeKey filename verifier missing');
assert(server.includes(`const ADMIN_CODEKEY_FINGERPRINT = '${codekey}'`), 'CODEKEY1 verifier missing');
assert(server.includes(`const ADMIN_JUPYTER_FINGERPRINT = '${jupyter}'`), 'JUPYTER1 verifier missing');
assert(server.includes(`const ADMIN_COMBINED_FINGERPRINT = '${combined}'`), 'HASHCOD1 verifier missing');
assert(server.includes("json_decode($rawNotebook, true, 64, JSON_THROW_ON_ERROR)"), 'server must parse notebook JSON instead of executing it');
assert(server.includes("count($keyCells) !== 1"), 'server must require exactly one marked CodeKey cell');
assert(server.includes("hash('sha256', $normalized)"), 'server must recompute CODEKEY1');
assert(server.includes("hash('sha256', adminCanonicalJson($canonical))"), 'server must recompute JUPYTER1');
assert(server.includes("ADMIN_CODEKEY_SCHEME . '|' . $codekey . '|' . $jupyter"), 'server must recompute combined fingerprint');
assert(server.includes("'admin_until'] = time() + 600"), 'verified CodeKey session must expire after ten minutes');
assert(server.includes("function adminIssueTicket(string $ip, int $ttl = 600): string"), 'stateless CodeKey ticket issuer missing');
assert(server.includes("function adminTicketValid(string $ticket, string $ip): bool"), 'stateless CodeKey ticket verifier missing');
assert(server.includes("__Host-hashcod_admin_ticket"), 'hosted CodeKey authorization must use an HttpOnly __Host ticket');
assert(server.includes("hashcod|admin-codekey-ticket|v1"), 'admin ticket must use a domain-separated signing key');
assert(server.includes("session_write_close()"), 'verified CodeKey session must flush before the immediate table read');
assert(server.includes("adminSetTicketCookie($ticket, 600)"), 'verified CodeKey must issue the stateless authorization ticket');
assert(server.includes("adminSetTicketCookie('', 0)"), 'logout must revoke the CodeKey authorization ticket');
assert(server.includes("'authMode'=>$desktop ? 'desktop-loopback-bridge' : 'codekey-jupyter'"), 'hosted auth mode must report CodeKey Jupyter');

console.log('PASS: CodeKey verifies CODEKEY1 + JUPYTER1 + HASHCOD1 and exclusively gates the EFT editor until the active admin session is unlocked.');
