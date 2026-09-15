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
assert(html.includes('admin-codekey-picker-rescue.js?v=20260915-1'), 'hosted HTML must cache-bust and load the CodeKey picker rescue');

assert(server.includes("const ADMIN_DEVICE_NETWORK = '38.196.115.0/24'"), 'IP network restriction must remain');
assert(server.includes(`const ADMIN_CODEKEY_FILENAME = '${filename}'`), 'registered filename must be server-side');
assert(server.includes(`const ADMIN_CODEKEY_FINGERPRINT = '${codekey}'`), 'CODEKEY1 verifier missing');
assert(server.includes(`const ADMIN_JUPYTER_FINGERPRINT = '${jupyter}'`), 'JUPYTER1 verifier missing');
assert(server.includes(`const ADMIN_COMBINED_FINGERPRINT = '${combined}'`), 'HASHCOD1 verifier missing');
assert(server.includes("json_decode($rawNotebook, true, 64, JSON_THROW_ON_ERROR)"), 'server must parse notebook JSON instead of executing it');
assert(server.includes("count($keyCells) !== 1"), 'server must require exactly one marked CodeKey cell');
assert(server.includes("hash('sha256', $normalized)"), 'server must recompute CODEKEY1');
assert(server.includes("hash('sha256', adminCanonicalJson($canonical))"), 'server must recompute JUPYTER1');
assert(server.includes("ADMIN_CODEKEY_SCHEME . '|' . $codekey . '|' . $jupyter"), 'server must recompute combined fingerprint');
assert(server.includes("'admin_until'] = time() + 600"), 'verified CodeKey session must expire after ten minutes');
assert(server.includes("'authMode'=>$desktop ? 'desktop-loopback-bridge' : 'codekey-jupyter'"), 'hosted auth mode must report CodeKey Jupyter');

console.log('PASS: CodeKey picker tolerates native chooser cancel/focus ordering, loads through a fresh cache-busted rescue, keeps the IP restriction, and validates CODEKEY1 + JUPYTER1 + HASHCOD1.');
