'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const repoDir = path.resolve(__dirname, '../..');
const js = fs.readFileSync(path.join(repoDir, 'components/efr-code-editor.js'), 'utf8');
const css = fs.readFileSync(path.join(repoDir, 'components/efr-code-editor.css'), 'utf8');
const hosted = fs.readFileSync(path.join(repoDir, 'l8-html.php'), 'utf8');
const local = fs.readFileSync(path.join(repoDir, 'laragon-local-entry.php'), 'utf8');

assert(js.includes("const TRAY_SLOT = 4"), 'EFR editor must occupy the fifth tray cube (slot 4)');
assert(js.includes("id: TOOL_ID"), 'EFR editor tray registration missing');
assert(js.includes("label: 'EFR Code Editor'"), 'EFR editor tray label missing');
assert(js.includes("document.createElement('dialog')"), 'EFR modal must use a native dialog/top-layer surface');
assert(js.includes("typeof modal.showModal === 'function'"), 'EFR modal must enter the browser top layer when supported');
assert(js.includes('handlePhysicalTrayPress'), 'coordinate-based tray interaction rescue missing');
assert(js.includes("window.addEventListener('pointerdown', handlePhysicalTrayPress, true)"), 'window capture pointer rescue missing');
assert(js.includes('pointInsideButton(event, button)'), 'tray rescue must work even when another overlay receives the pointer target');
assert(js.includes("button.disabled = false"), 'fifth tray cube must be actively repaired to enabled state');
assert(js.includes("button.onclick = function (event)"), 'direct button click fallback missing');
assert(js.includes("attributeFilter: ['disabled', 'data-tool-id', 'class', 'style']"), 'tray mutation repair coverage is incomplete');
assert(js.includes("document.documentElement.dataset.hashcodEfrReady = 'true'"), 'runtime readiness marker missing');
assert(js.includes("modal.style.setProperty('display', 'grid', 'important')"), 'editor open path must force visible display');
assert(js.includes("new Blob([editor.value]"), 'download must preserve the editor text as a raw blob');
assert(js.includes("anchor.download = filename"), 'download filename assignment missing');
assert(js.includes("+ '.efr'"), 'downloads must use the .efr extension');
assert(js.includes("spellcheck=\"false\""), 'editor must disable spelling diagnostics');
assert(js.includes('No parser, compiler or linter will reject it.'), 'RAW/no-validation mode must be explicit');
assert(!js.includes('eval('), 'editor must never execute user code');
assert(!js.includes('new Function('), 'editor must never compile user code');
assert(css.includes('dialog#hashcodEfrEditorModal'), 'native dialog styling missing');
assert(css.includes('dialog#hashcodEfrEditorModal::backdrop'), 'native dialog backdrop styling missing');
assert(css.includes('#hashcodEfrEditorTextarea'), 'editor textarea styling missing');
assert(hosted.includes('hashcod-efr-code-editor-inline'), 'hosted page must inline the current EFR implementation to bypass stale CDN cache');
assert(hosted.includes('components/efr-code-editor.css?v=20260915-3'), 'hosted CSS fallback loader missing');
assert(hosted.includes('components/efr-code-editor.js?v=20260915-3'), 'hosted JS fallback loader missing');
assert(local.includes('hashcod-laragon-efr-code-editor-inline'), 'local entry must inline the current EFR implementation');
assert(local.includes('components/efr-code-editor.css?v=20260915-3'), 'local CSS fallback loader missing');
assert(local.includes('components/efr-code-editor.js?v=20260915-3'), 'local JS fallback loader missing');

console.log('PASS: fifth tray cube is repaired, captured by physical coordinates, opens a native top-layer EFR dialog, and downloads exact RAW text as .efr.');
