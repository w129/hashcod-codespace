const fs = require('fs');
const path = require('path');
const assert = require('assert');

const repoDir = path.resolve(__dirname, '../..');
const js = fs.readFileSync(path.join(repoDir, 'components/auth-vector-layout-fix.js'), 'utf8');
const css = fs.readFileSync(path.join(repoDir, 'components/auth-vector-layout-fix.css'), 'utf8');
const loader = fs.readFileSync(path.join(repoDir, 'components/admin-hello-button.js'), 'utf8');

assert(js.includes("document.getElementById('authWrapper')"), 'layout fix must scope itself to authWrapper');
assert(js.includes("document.getElementById('groqAuthChatLauncher')"), 'chat launcher normalization missing');
assert(js.includes("document.getElementById('authTabValidate')"), 'chat launcher must anchor after Comprobar');
assert(js.includes(".crypto-card-launcher-btn, .crypto-card-direct-launcher-btn"), 'crypto-card utility launchers must be normalized');
assert(js.includes("['PQC AUTH', 'BETA']"), 'header badge normalization missing');
assert(!js.includes('.remove();'), 'hotfix must not remove base-theme nodes and trigger mutation loops');
assert(!js.includes('fetch('), 'layout hotfix must not replace authentication/network behavior');
assert(!js.includes('.submit('), 'layout hotfix must not submit auth forms');

assert(css.includes('.hashcod-auth-mode-plate'), 'misplaced mode plate must be visually suppressed');
assert(css.includes('.hashcod-auth-system-line'), 'misplaced system strip must be visually suppressed');
assert(css.includes('.hashcod-auth-utility-dock'), 'utility dock styles missing');
assert(css.includes('#groqAuthChatLauncher.hashcod-auth-chat-tab-fixed'), 'chat tab alignment styles missing');
assert(css.includes('.hashcod-auth-header-badge'), 'compact PQC/BETA badge style missing');
assert(css.includes('::-webkit-scrollbar-button'), 'native scrollbar arrow correction missing');

assert(loader.includes('auth-vector-layout-fix.css?v=20260910-1'), 'layout fix stylesheet is not loaded');
assert(loader.includes('auth-vector-layout-fix.js?v=20260910-1'), 'layout fix script is not loaded');

console.log('auth vector layout fix contract: OK');
