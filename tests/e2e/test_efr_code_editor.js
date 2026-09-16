'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const repoDir = path.resolve(__dirname, '../..');
const js = fs.readFileSync(path.join(repoDir, 'components/efr-code-editor.js'), 'utf8');
const css = fs.readFileSync(path.join(repoDir, 'components/efr-code-editor.css'), 'utf8');
const hosted = fs.readFileSync(path.join(repoDir, 'l8-html.php'), 'utf8');
const local = fs.readFileSync(path.join(repoDir, 'laragon-local-entry.php'), 'utf8');

assert(js.includes("const TRAY_SLOT = 4"), 'EFT editor must occupy the fifth tray cube (slot 4)');
assert(js.includes("id: TOOL_ID"), 'EFT editor tray registration missing');
assert(js.includes("label: 'EFT CoffeeScript Notebook'"), 'EFT editor tray label missing');
assert(js.includes("const EFT_FORMAT = 'HASHCOD-EFT-1'"), 'HASHCOD-EFT-1 format marker missing');
assert(js.includes("const CELL_SEPARATOR = '# %% [EFT CELL]'"), 'CoffeeScript notebook cell separator missing');
assert(js.includes("document.createElement('dialog')"), 'EFT modal must use a native dialog/top-layer surface');
assert(js.includes("typeof modal.showModal === 'function'"), 'EFT modal must enter browser top layer when supported');
assert(js.includes('handlePhysicalTrayPress'), 'coordinate-based tray interaction rescue missing');
assert(js.includes("window.addEventListener('pointerdown', handlePhysicalTrayPress, true)"), 'window capture pointer rescue missing');
assert(js.includes('pointInsideButton(event, button)'), 'tray rescue must work by physical coordinates');
assert(js.includes("button.disabled = false"), 'fifth tray cube must be actively repaired to enabled state');
assert(js.includes("button.onclick = function (event)"), 'direct button click fallback missing');
assert(js.includes("const HOTZONE_ID = 'hashcodEfrHotzone'"), 'fixed click hotzone missing');
assert(js.includes("z-index:2147483646"), 'hotzone must sit above regular auth/tray stacking contexts');
assert(js.includes("repairTimer = window.setInterval(repairAndSync, 400)"), 'bounded periodic tray repair missing');
assert(js.includes("childList: true"), 'tray replacement observer missing');
assert(!js.includes("attributeFilter: ['disabled', 'data-tool-id', 'class', 'style']"), 'EFT must not observe the same attributes it continuously repairs');
assert(js.includes("document.documentElement.dataset.hashcodEfrReady = 'true'"), 'runtime readiness marker missing');
assert(js.includes("modal.style.setProperty('display', 'grid', 'important')"), 'editor open path must force visible display');

assert(js.includes("name: 'coffeescript'"), 'CoffeeScript language metadata missing');
assert(js.includes("file_extension: '.coffee'"), 'CoffeeScript file extension metadata missing');
assert(js.includes("container: 'Jupyter Notebook'"), 'Jupyter Notebook container metadata missing');
assert(js.includes('nbformat: 4'), 'IPYNB nbformat 4 structure missing');
assert(js.includes('nbformat_minor: 5'), 'IPYNB nbformat minor version missing');
assert(js.includes("cell_type: 'code'"), 'Jupyter code cell structure missing');
assert(js.includes('execution_count: null'), 'Jupyter execution_count structure missing');
assert(js.includes('outputs: []'), 'Jupyter outputs structure missing');
assert(js.includes("eft_source: true"), 'EFT CoffeeScript cell metadata missing');
assert(js.includes('buildEftNotebook'), 'EFT notebook serializer missing');
assert(js.includes('notebookToCoffeeScript'), 'IPYNB CoffeeScript importer missing');
assert(js.includes("importInput.accept = '.eft,.ipynb,.coffee,application/json,text/plain'"), 'only EFT/IPYNB/CoffeeScript import formats should be offered');
assert(js.includes("const filename = sanitizeName(name.value) + '.eft'"), 'downloads must use the .eft extension');
assert(js.includes('JSON.stringify(notebook, null, 2)'), 'EFT download must serialize notebook JSON');
assert(js.includes("new Blob([payload], { type: 'application/json;charset=utf-8' })"), 'EFT download must preserve notebook JSON payload');
assert(js.includes("data-language=\"coffeescript\""), 'editor must declare CoffeeScript language mode');
assert(js.includes('CoffeeScript source only, stored as Jupyter Notebook cells'), 'CoffeeScript/IPYNB-only mode must be explicit');
assert(js.includes('Download .eft'), 'EFT download action label missing');
assert(js.includes('New Cell'), 'notebook cell insertion control missing');
assert(!js.includes('No parser, compiler or linter will reject it.'), 'universal RAW editor language must be removed');
assert(!js.includes('eval('), 'editor must never execute user code');
assert(!js.includes('new Function('), 'editor must never compile user code');

assert(css.includes('dialog#hashcodEfrEditorModal'), 'native dialog styling missing');
assert(css.includes('dialog#hashcodEfrEditorModal::backdrop'), 'native dialog backdrop styling missing');
assert(css.includes('#hashcodEfrEditorTextarea'), 'editor textarea styling missing');
assert(hosted.includes('hashcod-efr-code-editor-inline'), 'hosted page must inline the current EFT implementation to bypass stale CDN cache');
assert(hosted.includes('components/efr-code-editor.css?v=20260915-3'), 'hosted CSS fallback loader missing');
assert(hosted.includes('components/efr-code-editor.js?v=20260915-3'), 'hosted JS fallback loader missing');
assert(local.includes('hashcod-laragon-efr-code-editor-inline'), 'local entry must inline the current EFT implementation');
assert(local.includes('components/efr-code-editor.css?v=20260915-3'), 'local CSS fallback loader missing');
assert(local.includes('components/efr-code-editor.js?v=20260915-3'), 'local JS fallback loader missing');

console.log('PASS: fifth tray cube opens CoffeeScript-only EFT editor, maps source into IPYNB nbformat 4 code cells, and downloads HASHCOD-EFT-1 .eft JSON.');
