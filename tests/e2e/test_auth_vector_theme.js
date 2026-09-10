const fs = require('fs');
const path = require('path');
const assert = require('assert');

const repoDir = path.resolve(__dirname, '../..');
const js = fs.readFileSync(path.join(repoDir, 'components/auth-vector-theme.js'), 'utf8');
const css = fs.readFileSync(path.join(repoDir, 'components/auth-vector-theme.css'), 'utf8');
const loader = fs.readFileSync(path.join(repoDir, 'components/admin-hello-button.js'), 'utf8');

assert(js.includes("document.getElementById('authWrapper')"), 'theme must attach only to the existing auth wrapper');
assert(js.includes("wrapper.classList.add('hashcod-auth-enhanced')"), 'auth wrapper enhancement class missing');
assert(js.includes("img src=\"/favicon.svg\""), 'platform vector mark must be reused');
assert(js.includes("login:"), 'login vector icon missing');
assert(js.includes("register:"), 'register vector icon missing');
assert(js.includes("recover:"), 'recover vector icon missing');
assert(js.includes("check:"), 'check vector icon missing');
assert(js.includes("aes:"), 'AES vector icon missing');
assert(js.includes("identity:"), 'L8ID vector icon missing');
assert(js.includes("dilithium:"), 'Dilithium vector icon missing');
assert(js.includes("privacy:"), 'privacy vector icon missing');
assert(js.includes("success:"), 'success state vector icon missing');
assert(js.includes("error:"), 'error state vector icon missing');
assert(js.includes("loading:"), 'loading state vector icon missing');
assert(js.includes("admin:"), 'admin vector icon missing');
assert(js.includes("if (plate.dataset.mode === mode && plate.childElementCount) return;"), 'mode plate must avoid mutation-observer render loops');
assert(js.includes("window.requestAnimationFrame"), 'DOM enhancement should be frame-debounced');
assert(!js.includes('.submit()'), 'visual layer must not submit auth forms itself');
assert(!js.includes("fetch('/api/auth"), 'visual layer must not replace auth API behavior');

assert(css.includes('#authWrapper.hashcod-auth-enhanced .auth-card'), 'auth card redesign missing');
assert(css.includes('grid-template-columns: repeat(4, minmax(0, 1fr));'), 'desktop four-tab layout missing');
assert(css.includes('grid-template-columns: repeat(2, minmax(0, 1fr));'), 'responsive two-column tab layout missing');
assert(css.includes('.hashcod-auth-mode-plate'), 'per-window vector mode plate missing');
assert(css.includes('.hashcod-auth-input-icon'), 'vector field integration missing');
assert(css.includes('.hashcod-auth-message'), 'status/error/success integration missing');
assert(css.includes('.hashcod-auth-privacy-link'), 'privacy integration missing');
assert(css.includes('@media (prefers-reduced-motion: reduce)'), 'reduced-motion handling missing');

assert(loader.includes('auth-vector-theme.css?v=20260910-1'), 'auth vector stylesheet is not loaded');
assert(loader.includes('auth-vector-theme.js?v=20260910-1'), 'auth vector script is not loaded');

console.log('auth vector theme contract: OK');
