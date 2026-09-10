const fs = require('fs');
const path = require('path');
const assert = require('assert');

const repoDir = path.resolve(__dirname, '../..');
const js = fs.readFileSync(path.join(repoDir, 'components/dilithium-one-time-key.js'), 'utf8');
const css = fs.readFileSync(path.join(repoDir, 'components/dilithium-one-time-key.css'), 'utf8');
const auth = fs.readFileSync(path.join(repoDir, 'auth.php'), 'utf8');
const adminDevice = fs.readFileSync(path.join(repoDir, 'components/admin-device.js'), 'utf8');
const daemonState = fs.readFileSync(path.join(repoDir, 'daemon/service/state.go'), 'utf8');

assert(js.includes('const ROTATION_MS = 2 * 60 * 1000;'), 'candidate key must rotate every two minutes');
assert(js.includes('window.crypto.getRandomValues'), 'must use Web Crypto CSPRNG');
assert(!js.includes('Math.random('), 'must not use Math.random for registration keys');
assert(js.includes("return 'DILITHIUM5-REG-' + base64Url(bytes);"), 'registration key format missing');
assert(js.includes('api/auth/dilithium-active-key'), 'copied key must be activated server-side');
assert(js.includes('COPIAR Y ACTIVAR'), 'copy-and-activate action missing');
assert(js.includes("const STORAGE_ACTIVE_KEY = 'l8_active_dilithium5_key';"), 'current active-key storage sync missing');
assert(js.includes("const STORAGE_LEGACY_GATE_KEY = 'l8_active_d5_gate_passcode';"), 'legacy active-key storage sync missing');
assert(js.includes('window.ACTIVE_DILITHIUM5_GENERATED_KEY = cleanKey;'), 'in-memory active key must be synchronized');
assert(js.includes('syncClientActiveKey(key, data.epoch || activationEpoch);'), 'server-confirmed key must become authoritative client-side');
assert(js.includes('event.stopImmediatePropagation();'), 'legacy launcher behavior must be replaced');
assert(js.includes("document.getElementById('dilithiumGeneratorModal')"), 'legacy generator must be suppressed');
assert(css.includes('#d5LauncherBtn'), 'launcher black redesign missing');
assert(css.includes('background: #111111 !important;'), 'launcher must use black base');
assert(css.includes('.d5-otk-panel'), 'new black tool panel missing');
assert(css.includes('animation: d5OtkSecond 120s linear forwards;'), 'rotation progress must match the two-minute interval');
assert(auth.includes('authMarkDilithiumKeyConsumed($dilithium5);'), 'successful registration must consume the used key');
assert(auth.includes('authIsDilithiumKeyConsumed($provided)'), 'consumed keys must be rejected');
assert(adminDevice.includes('dilithium-one-time-key.js?v=20260910-2'), 'admin loader must load synchronized tool version');
assert(adminDevice.includes('dilithium-one-time-key.css?v=20260910-2'), 'admin loader must load synchronized styles version');
assert(daemonState.includes('func (sm *DilithiumStateManager) refreshFromDisk()'), 'daemon must refresh PHP-written active key state');
assert(daemonState.includes('sm.refreshFromDisk()'), 'daemon verification must consume refreshed active key state');

console.log('dilithium one-time registration key contract: OK');
