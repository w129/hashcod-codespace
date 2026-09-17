'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const repoDir = path.resolve(__dirname, '../..');
const js = fs.readFileSync(path.join(repoDir, 'components/deepseek-harness-cube.js'), 'utf8');
const css = fs.readFileSync(path.join(repoDir, 'components/deepseek-harness-cube.css'), 'utf8');
const loader = fs.readFileSync(path.join(repoDir, 'components/deepseek-harness-loader.js'), 'utf8');
const launcher = fs.readFileSync(path.join(repoDir, 'local-app/deepseek-harness-launcher.mjs'), 'utf8');
const sharedLoader = fs.readFileSync(path.join(repoDir, 'components/platform-entry-capability-footer-fix.js'), 'utf8');

assert(js.includes("const TOOL_ID = 'deepseek-harness'"), 'DeepSeek Harness tool id missing');
assert(js.includes('const TRAY_SLOT = 5'), 'DeepSeek Harness must occupy the sixth tray cube (slot 5)');
assert(js.includes("label: 'DeepSeek Harness'"), 'DeepSeek Harness tray label missing');
assert(js.includes("const LOCAL_HOST = '127.0.0.1'"), 'DeepSeek Harness runtime must be bound to loopback');
assert(js.includes('const DESKTOP_PORT = 3080'), 'desktop-managed DeepSeek Harness must stay synchronized to port 3080');
assert(js.includes("const STATUS_ID = 'hashcodDeepSeekHarnessStatusBadge'"), 'DSH status badge must not collide with the desktop status dialog id');
assert(js.includes("window.addEventListener('hashcod:dsh-status'"), 'DSH cube must consume desktop runtime status events');
assert(js.includes('typeof window.__HASHCOD_DSH_READY__ === \'boolean\''), 'DSH cube must detect the desktop-managed runtime');
assert(js.includes('if (!online) return false;'), 'Open Harness must not open a dead localhost tab when the runtime probe fails');
assert(js.includes("profile: 'HASHCOD-DSH-1'"), 'Hashcod DSH integration profile marker missing');
assert(js.includes('window.HashcodDeepSeekHarness'), 'DeepSeek Harness public integration API missing');
assert(js.includes("mode: 'no-cors'"), 'local runtime probe must not require DSH CORS changes');
assert(!js.includes("LOCAL_HOST = '0.0.0.0'"), 'DeepSeek Harness UI must never default to a public bind address');
assert(!js.includes('eval('), 'DeepSeek Harness cube must not eval runtime content');
assert(!js.includes('new Function'), 'DeepSeek Harness cube must not construct executable code dynamically');

assert(css.includes('.hashcod-dsh-dialog'), 'DeepSeek Harness dialog styling missing');
assert(css.includes('.hashcod-dsh-grid'), 'DeepSeek Harness architecture grid styling missing');
assert(css.includes('::backdrop'), 'DeepSeek Harness native dialog backdrop missing');

assert(loader.includes('deepseek-harness-cube.css?v=20260917-2'), 'DSH loader must load current cube styling');
assert(loader.includes('deepseek-harness-cube.js?v=20260917-2'), 'DSH loader must load current cube runtime');
assert(loader.includes('data-hashcod-deepseek-harness-cube'), 'DSH loader idempotency marker missing');
assert(sharedLoader.includes('deepseek-harness-loader.js?v=20260917-2'), 'shared Render/Laragon layer must load the current DSH loader');
assert(sharedLoader.includes('data-hashcod-deepseek-harness-loader'), 'shared loader marker missing');

assert(launcher.includes("const HOST = '127.0.0.1'"), 'launcher must force loopback host');
assert(launcher.includes("const PACKAGE = '@deepseek-ai/dsh'"), 'launcher must use the official DSH npm package');
assert(launcher.includes("'--no-open'"), 'launcher must suppress upstream automatic browser opening');
assert(launcher.includes("'--host', HOST"), 'launcher must explicitly pass the loopback host');
assert(launcher.includes('major >= 24 || (major === 22 && minor >= 19)'), 'launcher must enforce upstream Node engine support');
assert(!launcher.includes('shell: true'), 'launcher must not invoke DSH through a shell');

console.log('PASS: DeepSeek Harness stays synchronized with the desktop runtime and never opens an offline localhost target.');