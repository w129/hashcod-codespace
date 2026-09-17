'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const repoDir = path.resolve(__dirname, '../..');
const js = fs.readFileSync(path.join(repoDir, 'components/hashcod-ux-system.js'), 'utf8');
const css = fs.readFileSync(path.join(repoDir, 'components/hashcod-ux-system.css'), 'utf8');
const loader = fs.readFileSync(path.join(repoDir, 'components/platform-entry-capability-footer-fix.js'), 'utf8');
const notFound = fs.readFileSync(path.join(repoDir, 'not-found.php'), 'utf8');
const router = fs.readFileSync(path.join(repoDir, 'router.php'), 'utf8');

assert(js.includes("const VERSION = 'HASHCOD-UX-1'"), 'UX system version marker missing');
assert(js.includes('data.hashcodTheme') || js.includes('dataset.hashcodTheme'), 'theme state must be attached to the document');
assert(js.includes("applyTheme('dark')"), 'dark theme command missing');
assert(js.includes("applyTheme('light')"), 'light theme command missing');
assert(js.includes("applyTheme('system')"), 'system theme command missing');
assert(js.includes('hashcod-theme-logo'), 'theme-aware logo conversion missing');
assert(js.includes('IntersectionObserver'), 'scroll reveal observer missing');
assert(js.includes("event.ctrlKey || event.metaKey"), 'command-palette keyboard shortcut missing');
assert(js.includes("key === 'k'"), 'Ctrl/Cmd+K command palette binding missing');
assert(js.includes("key === 't'"), 'theme shortcut missing');
assert(js.includes("key === 's'"), 'share/save keyboard shortcuts missing');
assert(js.includes('navigator.share'), 'Web Share API integration missing');
assert(js.includes('navigator.clipboard'), 'share clipboard fallback missing');
assert(js.includes('navigator.vibrate'), 'haptic feedback fallback missing');
assert(js.includes('hashcod-ux-skeleton'), 'skeleton loading API missing');
assert(js.includes('hashcod-ux-loading'), 'loading state helper missing');
assert(js.includes('hashcod-ux-error-state'), 'error state helper missing');
assert(js.includes('AUTOSAVE_PREFIX'), 'form autosave storage missing');
assert(js.includes('SENSITIVE_RE'), 'sensitive-field autosave exclusion missing');
assert(js.includes('window.HashcodUX'), 'public Hashcod UX API missing');
assert(js.includes('request: request'), 'request loading/error wrapper missing');
assert(!js.includes('localStorage.setItem(field.value'), 'raw sensitive values must not be stored without a keyed form policy');

assert(css.includes('html[data-hashcod-theme="dark"]'), 'dark-theme CSS missing');
assert(css.includes('.hashcod-theme-logo'), 'dark logo treatment missing');
assert(css.includes('.hashcod-ux-palette'), 'command palette styling missing');
assert(css.includes('.hashcod-ux-skeleton'), 'skeleton styling missing');
assert(css.includes('.hashcod-ux-reveal'), 'scroll reveal styling missing');
assert(css.includes('@media (prefers-reduced-motion: reduce)'), 'reduced-motion accessibility missing');

assert(/hashcod-ux-system\.css\?v=[A-Za-z0-9._-]+/.test(loader), 'shared platform loader must load versioned UX CSS');
assert(/hashcod-ux-system\.js\?v=[A-Za-z0-9._-]+/.test(loader), 'shared platform loader must load versioned UX runtime');
assert(js.includes('isBrowserExtensionError'), 'browser-extension error filter missing');
assert(js.includes('chrome|moz|safari-web|edge'), 'browser-extension URL schemes must be filtered');
assert(loader.includes('data-hashcod-ux-system') || loader.includes('dataset.hashcodUxSystem'), 'shared UX script marker missing');

assert(notFound.includes('HTTP 404 · NOT FOUND'), 'custom branded 404 page missing');
assert(notFound.includes('hashcod-ux-system.js'), '404 page must inherit Hashcod UX system');
assert(notFound.includes('http_response_code(404)'), '404 page must return real HTTP 404');
assert(router.includes("require __DIR__ . '/not-found.php'"), 'router must use branded 404 for unknown routes');

console.log('PASS: Hashcod shared UX system covers theme, dark logos, motion, command palette, shortcuts, skeletons, haptics, sharing, autosave, loading/error states and branded 404.');
