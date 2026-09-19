const fs = require('fs');
const path = require('path');
const assert = require('assert');

const repoDir = path.resolve(__dirname, '../..');
const js = fs.readFileSync(path.join(repoDir, 'components/auth-vector-layout-fix.js'), 'utf8');
const css = fs.readFileSync(path.join(repoDir, 'components/auth-vector-layout-fix.css'), 'utf8');
const dockCss = fs.readFileSync(path.join(repoDir, 'components/auth-utility-outside.css'), 'utf8');
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
assert(js.includes("crypto-card-validation.js?v=20260910-4"), 'crypto-card functional engine must remain loadable');
assert(js.includes("dilithium-one-time-key.js?v=20260910-4"), 'Dilithium functional engine must remain loadable');
assert(js.includes("admin-device.js?v=20260918-codekey4"), 'Windows Hello admin engine must remain loadable');
assert(js.includes("button.disabled = false"), 'direct validated-card launcher must remain enabled before Windows Hello');
assert(js.includes("normalizeFieldDecorations"), 'duplicate label-icon normalization missing');
assert(js.includes("['PQC AUTH', 'BETA']"), 'header badge normalization missing');

// Regression: utility buttons must be DOM children of the login card, not document.body.
assert(js.includes("const card = wrapper.querySelector('.auth-card') || wrapper"), 'utility dock must resolve the login card');
assert(js.includes('card.appendChild(dock)'), 'utility dock must be inserted inside the login card');
assert(!js.includes('document.body.appendChild(dock)'), 'utility dock must not be mounted outside the login window');
assert(js.includes("dock.dataset.side = 'inside'"), 'utility dock must declare inside placement');
assert(js.includes("dock.style.removeProperty('left')"), 'stale external left coordinate must be cleared');
assert(js.includes("dock.style.removeProperty('top')"), 'stale external top coordinate must be cleared');
assert(!js.includes('event.stopImmediatePropagation()'), 'fallback handler must not suppress native launcher handlers');
assert(js.includes("auth-utility-outside.css?v=20260910-5"), 'inside-dock stylesheet v5 must be loaded');
assert(!js.includes('.submit('), 'layout hotfix must not submit auth forms');
assert(!js.includes('fetch('), 'layout hotfix must not replace authentication/network behavior');

assert(css.includes('.hashcod-auth-mode-plate'), 'misplaced mode plate must be visually suppressed');
assert(css.includes('.hashcod-auth-system-line'), 'misplaced system strip must be visually suppressed');
assert(css.includes('.hashcod-auth-label-icon-redundant'), 'redundant field-label icons must be hidden');
assert(css.includes('#groqAuthChatLauncher.hashcod-auth-chat-tab-fixed'), 'chat tab alignment styles missing');
assert(css.includes('.hashcod-auth-header-badge'), 'compact PQC/BETA badge style missing');
assert(css.includes('::-webkit-scrollbar-button'), 'native scrollbar arrow correction missing');

assert(dockCss.includes('#authWrapper #hashcodAuthUtilityDock.hashcod-auth-utility-dock'), 'inside utility dock selector missing');
assert(dockCss.includes('position: absolute'), 'utility dock must be positioned relative to the login card');
assert(dockCss.includes('flex-direction: row'), 'inside utility dock must lay buttons out horizontally');
assert(!dockCss.includes('position: fixed'), 'utility dock must not be fixed outside the login card');
assert(dockCss.includes('.crypto-card-direct-launcher-btn'), 'public validated-card entry styling missing');
assert(dockCss.includes('visibility: visible'), 'validated-card entry must remain visible without Windows Hello');
assert(dockCss.includes('#cryptoCardValidationLauncherBtn'), 'crypto-card launcher styling missing');
assert(dockCss.includes('#d5LauncherBtn'), 'Dilithium launcher styling missing');
assert(dockCss.includes('html:not([data-admin-authenticated="true"])'), 'admin-only launcher visibility gate must remain');

// Regression: the real logo is .auth-brand-icon, a sibling of .auth-title-wrap.
// Moving .auth-title-wrap > :first-child moves the H1 and separates it from the icon.
assert(dockCss.includes('.auth-header-brand'), 'brand row alignment selector missing');
assert(dockCss.includes('.auth-brand-icon'), 'brand icon alignment selector missing');
assert(dockCss.includes('align-items: center !important;'), 'brand row must vertically center its children');
assert(dockCss.includes('top: auto !important;'), 'title/icon positional offsets must be reset');
assert(!dockCss.includes('top: -21px !important;'), 'title must never be pulled away from the brand icon');

assert(dilithium.includes('window.openDilithiumOneTimeKeyTool = openTool;'), 'Dilithium opener must be exposed for relocated launcher');
assert(loader.includes('auth-vector-layout-fix.css?v=20260910-5'), 'base layout fix stylesheet v5 is not loaded');
assert(loader.includes('auth-vector-layout-fix.js?v=20260910-5'), 'base layout fix script v5 is not loaded');
assert(loader.includes('crypto-card-validation.js?v=20260910-4'), 'auth loader must preload the crypto-card functional engine');

console.log('auth vector layout fix contract: OK');
