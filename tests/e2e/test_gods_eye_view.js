'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const repoDir = path.resolve(__dirname, '../..');
const js = fs.readFileSync(path.join(repoDir, 'components/gods-eye-view.js'), 'utf8');
const css = fs.readFileSync(path.join(repoDir, 'components/gods-eye-view.css'), 'utf8');
const loader = fs.readFileSync(path.join(repoDir, 'components/gods-eye-view-loader.js'), 'utf8');
const sharedLoader = fs.readFileSync(path.join(repoDir, 'components/platform-entry-capability-footer-fix.js'), 'utf8');
const desktop = fs.readFileSync(path.join(repoDir, 'local-app/desktop/package.json'), 'utf8');
const bootstrap = fs.readFileSync(path.join(repoDir, 'local-app/desktop/bootstrap.js'), 'utf8');

assert(js.includes("const TOOL_ID = 'gods-eye-view'"), 'Gods Eye View tool id missing');
assert(js.includes('const TRAY_SLOT = 5'), 'Gods Eye View must occupy sixth tray cube');
assert(js.includes("label: 'God\\'s Eye View'"), 'Gods Eye View tray label missing');
assert(js.includes("const PROFILE = 'HASHCOD-GEV-1'"), 'GEV profile marker missing');
assert(js.includes('window.HashcodGodsEyeView'), 'public GEV integration API missing');
assert(js.includes('USGS_URL'), 'USGS live data source missing');
assert(js.includes('ISS_URL'), 'ISS live data source missing');
assert(js.includes('NOMINATIM_URL'), 'place search source missing');
assert(js.includes("inPlatform: true"), 'GEV must declare in-platform execution');
assert(js.includes("externalWindowRequired: false"), 'GEV must not require an external window');
assert(!js.includes('window.open('), 'GEV must not open an external browser window');
assert(!js.includes('<iframe'), 'GEV must not iframe an external application');
assert(!js.includes('127.0.0.1:3080'), 'GEV must not depend on the old DeepSeek localhost runtime');
assert(!js.toLowerCase().includes('deepseek'), 'GEV runtime must not retain DeepSeek references');

assert(css.includes('.hashcod-gev-dialog'), 'GEV full-screen dialog styling missing');
assert(css.includes('.hashcod-gev-stage canvas'), 'GEV canvas styling missing');
assert(css.includes('.hashcod-gev-panel'), 'GEV telemetry panel styling missing');
assert(loader.includes('gods-eye-view.css?v=20260917-1'), 'GEV loader must load styling');
assert(loader.includes('gods-eye-view.js?v=20260917-1'), 'GEV loader must load runtime');
assert(sharedLoader.includes('gods-eye-view-loader.js?v=20260917-1'), 'shared platform layer must load GEV');
assert(!sharedLoader.toLowerCase().includes('deepseek'), 'shared platform loader must no longer load DeepSeek');
assert(!desktop.includes('@deepseek-ai/dsh'), 'desktop package must remove DeepSeek dependency');
assert(!desktop.includes('test:harness'), 'desktop package must remove DeepSeek smoke script');
assert(!bootstrap.toLowerCase().includes('deepseek'), 'desktop bootstrap must remove DeepSeek supervisor');

console.log('PASS: God\'s Eye View replaces DeepSeek in slot 5 and runs inside Hashcod Codespace.');
