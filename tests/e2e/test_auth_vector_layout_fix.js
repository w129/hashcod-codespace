const fs = require('fs');
const path = require('path');
const assert = require('assert');

const repoDir = path.resolve(__dirname, '../..');
const js = fs.readFileSync(path.join(repoDir, 'components/auth-vector-layout-fix.js'), 'utf8');
const css = fs.readFileSync(path.join(repoDir, 'components/auth-vector-layout-fix.css'), 'utf8');
const outsideCss = fs.readFileSync(path.join(repoDir, 'components/auth-utility-outside.css'), 'utf8');
const loader = fs.readFileSync(path.join(repoDir, 'components/admin-hello-button.js'), 'utf8');
const dilithium = fs.readFileSync(path.join(repoDir, 'components/dilithium-one-time-key.js'), 'utf8');

assert(js.includes("document.getElementById('authWrapper')"), 'layout fix must scope itself to authWrapper');
assert(js.includes("document.getElementById('groqAuthChatLauncher')"), 'chat launcher normalization missing');
assert(js.includes("document.getElementById('authTabValidate')"), 'chat launcher must anchor after Comprobar');
assert(js.includes("#cryptoCardValidationLauncherBtn"), 'crypto-card launcher ID must be normalized');
assert(js.includes("#d5LauncherBtn"), 'Dilithium launcher ID must be normalized');
assert(js.includes(".crypto-card-launcher-btn"), 'legacy crypto-card launcher class must remain supported');
assert(js.includes(".crypto-card-direct-launcher-btn"), 'legacy direct launcher class must remain supported');
assert(js.includes("openWhenAvailable('openCryptoCardUploadPanel'"), 'validated-card entry launcher must open its tool after relocation');
assert(js.includes("openWhenAvailable('openCryptoCardValidationWindow'"), 'validation launcher must open its tool after relocation');
assert(js.includes("openWhenAvailable('openDilithiumOneTimeKeyTool'"), 'Dilithium launcher must open its tool after relocation');
assert(js.includes("button.disabled = false"), 'direct validated-card launcher must remain enabled before Windows Hello');
assert(js.includes("normalizeFieldDecorations"), 'duplicate label-icon normalization missing');
assert(js.includes("['PQC AUTH', 'BETA']"), 'header badge normalization missing');
assert(js.includes("document.body.appendChild(dock)"), 'utility dock must live outside the login window');
assert(js.includes("dock.style.left"), 'utility dock must be positioned next to the login window');
assert(js.includes("dock.style.top"), 'utility dock must align vertically with the login window');
assert(js.includes("auth-utility-outside.css?v=20260910-2"), 'external rail stylesheet v2 must be loaded');
assert(!js.includes('.submit('), 'layout hotfix must not submit auth forms');
assert(!js.includes('fetch('), 'layout hotfix must not replace authentication/network behavior');

assert(css.includes('.hashcod-auth-mode-plate'), 'misplaced mode plate must be visually suppressed');
assert(css.includes('.hashcod-auth-system-line'), 'misplaced system strip must be visually suppressed');
assert(css.includes('.hashcod-auth-label-icon-redundant'), 'redundant field-label icons must be hidden');
assert(css.includes('#groqAuthChatLauncher.hashcod-auth-chat-tab-fixed'), 'chat tab alignment styles missing');
assert(css.includes('.hashcod-auth-header-badge'), 'compact PQC/BETA badge style missing');
assert(css.includes('::-webkit-scrollbar-button'), 'native scrollbar arrow correction missing');

assert(outsideCss.includes('#hashcodAuthUtilityDock.hashcod-auth-utility-dock'), 'external utility rail selector missing');
assert(outsideCss.includes('flex-direction: column'), 'external utility rail must remain vertical');
assert(outsideCss.includes('position: fixed'), 'external utility rail must remain outside the scrolling login card');
assert(outsideCss.includes('.crypto-card-direct-launcher-btn'), 'public validated-card entry styling missing');
assert(outsideCss.includes('visibility: visible'), 'validated-card entry must remain visible without Windows Hello');
assert(outsideCss.includes('#cryptoCardValidationLauncherBtn'), 'external crypto-card launcher styling missing');
assert(outsideCss.includes('#d5LauncherBtn'), 'external Dilithium launcher styling missing');

assert(dilithium.includes('window.openDilithiumOneTimeKeyTool = openTool;'), 'Dilithium opener must be exposed for relocated launcher');
assert(loader.includes('auth-vector-layout-fix.css?v=20260910-3'), 'base layout fix stylesheet v3 is not loaded');
assert(loader.includes('auth-vector-layout-fix.js?v=20260910-3'), 'base layout fix script v3 is not loaded');

console.log('auth vector layout fix contract: OK');
