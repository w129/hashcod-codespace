'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const repoDir = path.resolve(__dirname, '../..');
const js = fs.readFileSync(path.join(repoDir, 'components/deepseek-harness-cube.js'), 'utf8');
const css = fs.readFileSync(path.join(repoDir, 'components/deepseek-harness-cube.css'), 'utf8');
const launcher = fs.readFileSync(path.join(repoDir, 'local-app/deepseek-harness-launcher.mjs'), 'utf8');
const prod = fs.readFileSync(path.join(repoDir, 'l8-html.php'), 'utf8');
const local = fs.readFileSync(path.join(repoDir, 'laragon-local-entry.php'), 'utf8');

assert(js.includes("const TOOL_ID = 'deepseek-harness'"), 'DeepSeek Harness tool id missing');
assert(js.includes('const TRAY_SLOT = 5'), 'DeepSeek Harness must occupy the sixth tray cube (slot 5)');
assert(js.includes("label: 'DeepSeek Harness'"), 'DeepSeek Harness tray label missing');
assert(js.includes("const LOCAL_HOST = '127.0.0.1'"), 'DeepSeek Harness runtime must be bound to loopback');
assert(js.includes("profile: 'HASHCOD-DSH-1'"), 'Hashcod DSH integration profile marker missing');
assert(js.includes('window.HashcodDeepSeekHarness'), 'DeepSeek Harness public integration API missing');
assert(js.includes('mode: \'no-cors\''), 'local runtime probe must not require DSH CORS changes');
assert(!js.includes("LOCAL_HOST = '0.0.0.0'"), 'DeepSeek Harness UI must never default to a public bind address');

assert(css.includes('.hashcod-dsh-dialog'), 'DeepSeek Harness dialog styling missing');
assert(css.includes('.hashcod-dsh-grid'), 'DeepSeek Harness architecture grid styling missing');
assert(css.includes('::backdrop'), 'DeepSeek Harness native dialog backdrop missing');

assert(launcher.includes("const HOST = '127.0.0.1'"), 'launcher must force loopback host');
assert(launcher.includes("const PACKAGE = '@deepseek-ai/dsh'"), 'launcher must use the official DSH npm package');
assert(launcher.includes("'--no-open'"), 'launcher must suppress upstream automatic browser opening');
assert(launcher.includes("'--host', HOST"), 'launcher must explicitly pass the loopback host');
assert(launcher.includes('major >= 24 || (major === 22 && minor >= 19)'), 'launcher must enforce upstream Node engine support');
assert(!launcher.includes('shell: true'), 'launcher must not invoke DSH through a shell');

assert(prod.includes('components/deepseek-harness-cube.css'), 'production loader must include DSH CSS');
assert(prod.includes('components/deepseek-harness-cube.js'), 'production loader must include DSH JS');
assert(local.includes('components/deepseek-harness-cube.css'), 'Laragon loader must include DSH CSS');
assert(local.includes('components/deepseek-harness-cube.js'), 'Laragon loader must include DSH JS');

console.log('PASS: DeepSeek Harness owns the sixth tray cube, stays loopback-only, and has a native local launcher contract.');
