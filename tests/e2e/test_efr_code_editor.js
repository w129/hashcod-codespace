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
assert(js.includes("new Blob([editor.value]"), 'download must preserve the editor text as a raw blob');
assert(js.includes("anchor.download = filename"), 'download filename assignment missing');
assert(js.includes("+ '.efr'"), 'downloads must use the .efr extension');
assert(js.includes("spellcheck=\"false\""), 'editor must disable spelling diagnostics');
assert(js.includes('No parser, compiler or linter will reject it.'), 'RAW/no-validation mode must be explicit');
assert(!js.includes('eval('), 'editor must never execute user code');
assert(!js.includes('new Function('), 'editor must never compile user code');
assert(css.includes('#hashcodEfrEditorTextarea'), 'editor textarea styling missing');
assert(hosted.includes('components/efr-code-editor.css?v=20260915-1'), 'hosted CSS loader missing');
assert(hosted.includes('components/efr-code-editor.js?v=20260915-1'), 'hosted JS loader missing');
assert(local.includes('components/efr-code-editor.css?v=20260915-1'), 'local CSS loader missing');
assert(local.includes('components/efr-code-editor.js?v=20260915-1'), 'local JS loader missing');

console.log('PASS: fifth tray cube opens a RAW universal code editor and downloads the exact text as .efr without executing or validating it.');
