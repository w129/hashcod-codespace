(function () {
    'use strict';

    if (window.__hashcodEfrCodeEditorLoaded) return;
    window.__hashcodEfrCodeEditorLoaded = true;

    const TOOL_ID = 'efr-code-editor';
    const TRAY_SLOT = 4;
    const MODAL_ID = 'hashcodEfrEditorModal';
    const WINDOW_ID = 'hashcodEfrEditorWindow';
    const TEXTAREA_ID = 'hashcodEfrEditorTextarea';
    const NAME_ID = 'hashcodEfrEditorFilename';
    const STATUS_ID = 'hashcodEfrEditorStatus';
    const HOTZONE_ID = 'hashcodEfrHotzone';
    const CRITICAL_STYLE_ID = 'hashcodEfrCriticalTkinterStyle';
    const STORAGE_KEY = 'hashcod_eft_coffeescript_draft_v1';
    const NAME_STORAGE_KEY = 'hashcod_eft_coffeescript_name_v1';
    const CELL_SEPARATOR = '# %% [EFT CELL]';
    const EFT_FORMAT = 'HASHCOD-EFT-1';
    const TRAY_SELECTOR = '#hashcodVectorTray [data-vector-tray-slot="' + TRAY_SLOT + '"]';

    const EDITOR_ICON = [
        '<svg data-hashcod-efr-icon="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" aria-hidden="true" focusable="false" style="display:block;width:72%;height:72%;max-width:38px;max-height:38px">',
            '<rect x="8" y="9" width="48" height="46" rx="8" fill="#fff" stroke="#111" stroke-width="3"/>',
            '<path d="M25 23L16 32l9 9M39 23l9 9-9 9" fill="none" stroke="#111" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>',
            '<path d="M35 18L29 46" fill="none" stroke="#111" stroke-width="3" stroke-linecap="round"/>',
        '</svg>'
    ].join('');

    const TKINTER_CRITICAL_CSS = [
        '#hashcodEfrEditorModal[hidden]{display:none!important}',
        'dialog#hashcodEfrEditorModal{position:fixed!important;inset:0!important;width:100vw!important;height:100vh!important;max-width:none!important;max-height:none!important;margin:0!important;border:0!important;padding:18px!important;box-sizing:border-box!important;z-index:2147483647!important;display:grid!important;place-items:center!important;background:rgba(238,238,234,.86)!important;backdrop-filter:blur(10px)!important;font-family:"IBM Plex Mono","Geist Mono",ui-monospace,SFMono-Regular,Menlo,Consolas,monospace!important;color:#111!important}',
        'dialog#hashcodEfrEditorModal::backdrop{background:rgba(238,238,234,.82)!important;backdrop-filter:blur(8px)!important}',
        '#hashcodEfrEditorWindow{width:min(1060px,94vw)!important;height:min(720px,90vh)!important;display:grid!important;grid-template-rows:auto auto minmax(0,1fr) auto!important;background:#d9d9d5!important;border:1px solid #6f6f6a!important;border-radius:8px!important;box-shadow:0 24px 70px rgba(0,0,0,.20),inset 1px 1px 0 #fff!important;overflow:hidden!important}',
        '.hashcod-efr-editor-header{display:flex!important;align-items:flex-start!important;justify-content:space-between!important;gap:18px!important;padding:15px 16px 14px!important;border-bottom:1px solid #8d8d88!important;background:linear-gradient(180deg,#f4f4f1,#deded9)!important;box-shadow:inset 0 1px 0 #fff,inset 0 -1px 0 #bcbcb6!important}',
        '.hashcod-efr-editor-kicker{margin:0 0 4px!important;font-size:10px!important;letter-spacing:.15em!important;font-weight:700!important;color:#55554f!important}',
        '#hashcodEfrEditorTitle{margin:0!important;font-size:clamp(21px,2vw,28px)!important;line-height:1.05!important;font-weight:700!important;letter-spacing:-.025em!important}',
        '.hashcod-efr-editor-subtitle{margin:7px 0 0!important;max-width:720px!important;font-size:11px!important;line-height:1.5!important;color:#55554f!important}',
        '.hashcod-efr-icon-button{width:34px!important;height:30px!important;border:1px solid #777772!important;border-radius:3px!important;background:#e7e7e3!important;color:#111!important;font:400 18px/1 Arial,sans-serif!important;cursor:pointer!important;box-shadow:inset 1px 1px 0 #fff,inset -1px -1px 0 #a5a5a0!important}',
        '.hashcod-efr-toolbar{display:grid!important;grid-template-columns:minmax(360px,1fr) auto!important;align-items:center!important;gap:14px!important;padding:10px 12px!important;border-bottom:1px solid #8d8d88!important;background:#cfcfca!important;box-shadow:inset 0 1px 0 #efefec,inset 0 -1px 0 #b4b4ae!important}',
        '.hashcod-eft-file-stack{display:grid!important;gap:7px!important;min-width:0!important}',
        '.hashcod-efr-name-wrap{min-width:0!important;display:grid!important;grid-template-columns:auto minmax(120px,320px) auto!important;align-items:center!important;gap:8px!important;font-size:10px!important;color:#55554f!important}',
        '.hashcod-efr-name-wrap input{width:100%!important;box-sizing:border-box!important;border:1px solid #71716d!important;border-radius:2px!important;background:#fff!important;padding:7px 8px!important;outline:none!important;color:#111!important;font:500 12px/1.2 "IBM Plex Mono","Geist Mono",ui-monospace,SFMono-Regular,Menlo,Consolas,monospace!important;box-shadow:inset 1px 1px 0 #b7b7b2,inset -1px -1px 0 #f5f5f2!important}',
        '.hashcod-eft-modebar{display:flex!important;gap:6px!important;flex-wrap:wrap!important;align-items:center!important}',
        '.hashcod-eft-modebar span{display:inline-flex!important;align-items:center!important;min-height:20px!important;padding:2px 7px!important;border:1px solid #8a8a84!important;border-radius:2px!important;background:#e9e9e5!important;color:#33332f!important;font-size:9px!important;font-weight:700!important;letter-spacing:.06em!important}',
        '.hashcod-efr-actions{display:flex!important;gap:7px!important;flex-wrap:wrap!important;justify-content:flex-end!important}',
        '.hashcod-efr-actions button{min-height:32px!important;border:1px solid #6f6f6a!important;border-radius:3px!important;background:#e7e7e3!important;color:#111!important;padding:7px 11px!important;font:600 11px/1 "IBM Plex Mono","Geist Mono",ui-monospace,SFMono-Regular,Menlo,Consolas,monospace!important;cursor:pointer!important;box-shadow:inset 1px 1px 0 #fff,inset -1px -1px 0 #9f9f99!important}',
        '.hashcod-efr-actions button.is-primary{background:#111!important;color:#fff!important;border-color:#111!important}',
        '.hashcod-efr-editor-body{min-height:0!important;padding:12px!important;background:#bdbdb8!important;box-shadow:inset 0 1px 0 #ecece8!important}',
        '#hashcodEfrEditorTextarea{display:block!important;width:100%!important;height:100%!important;min-height:300px!important;box-sizing:border-box!important;resize:none!important;border:1px solid #5e5e5a!important;border-radius:2px!important;outline:0!important;padding:16px 18px!important;background:#111!important;color:#f5f5f1!important;caret-color:#fff!important;font:400 13px/1.62 "IBM Plex Mono","Geist Mono",ui-monospace,SFMono-Regular,Menlo,Consolas,monospace!important;tab-size:2!important;white-space:pre!important;overflow:auto!important;box-shadow:inset 2px 2px 0 #050505,inset -1px -1px 0 #2e2e2e!important}',
        '.hashcod-efr-editor-footer{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:14px!important;padding:8px 12px!important;border-top:1px solid #8d8d88!important;background:#d6d6d1!important;color:#4e4e49!important;font-size:10px!important;line-height:1.35!important;box-shadow:inset 0 1px 0 #efefec!important}',
        '@media(max-width:760px){dialog#hashcodEfrEditorModal{padding:8px!important}#hashcodEfrEditorWindow{width:100%!important;height:94vh!important}.hashcod-efr-toolbar{grid-template-columns:1fr!important}.hashcod-efr-name-wrap{grid-template-columns:auto minmax(0,1fr) auto!important}.hashcod-efr-actions{display:grid!important;grid-template-columns:1fr 1fr!important}.hashcod-efr-editor-body{padding:8px!important}.hashcod-efr-editor-footer{align-items:flex-start!important;flex-direction:column!important;gap:4px!important}}'
    ].join('');

    let importInput = null;
    let trayObserver = null;
    let repairTimer = null;
    let lastFocused = null;
    let registeredTrayApi = null;

    function byId(id) { return document.getElementById(id); }
    function getEditor() { return byId(TEXTAREA_ID); }
    function getTrayButton() { return document.querySelector(TRAY_SELECTOR); }

    function ensureCriticalStyles() {
        let style = byId(CRITICAL_STYLE_ID);
        if (style) return style;
        style = document.createElement('style');
        style.id = CRITICAL_STYLE_ID;
        style.setAttribute('data-hashcod-eft-style-version', '20260916-eft1');
        style.textContent = TKINTER_CRITICAL_CSS;
        (document.head || document.documentElement).appendChild(style);
        return style;
    }

    function sanitizeName(value) {
        const cleaned = String(value || '')
            .replace(/[\\/:*?"<>|\u0000-\u001f]/g, '-')
            .replace(/\s+/g, ' ')
            .trim();
        return (cleaned || 'untitled').replace(/\.(eft|efr|ipynb|coffee)$/i, '');
    }

    function splitCoffeeScriptCells(text) {
        const normalized = String(text || '').replace(/\r\n?/g, '\n');
        const pieces = normalized.split(new RegExp('^\\s*' + CELL_SEPARATOR.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*$', 'm'));
        return pieces.map(function (piece) { return piece.replace(/^\n+|\n+$/g, ''); });
    }

    function sourceLines(text) {
        const normalized = String(text || '').replace(/\r\n?/g, '\n');
        if (normalized === '') return [];
        const lines = normalized.split('\n');
        return lines.map(function (line, index) {
            return index < lines.length - 1 ? line + '\n' : line;
        });
    }

    function buildEftNotebook() {
        const editor = getEditor();
        const cells = splitCoffeeScriptCells(editor ? editor.value : '');
        return {
            eft_format: EFT_FORMAT,
            nbformat: 4,
            nbformat_minor: 5,
            metadata: {
                kernelspec: {
                    display_name: 'CoffeeScript',
                    language: 'coffeescript',
                    name: 'coffeescript'
                },
                language_info: {
                    name: 'coffeescript',
                    mimetype: 'text/coffeescript',
                    file_extension: '.coffee'
                },
                hashcod: {
                    format: 'EFT',
                    version: 1,
                    source_language: 'CoffeeScript',
                    container: 'Jupyter Notebook',
                    cell_separator: CELL_SEPARATOR
                }
            },
            cells: cells.map(function (cellSource, index) {
                return {
                    cell_type: 'code',
                    execution_count: null,
                    metadata: {
                        language: 'coffeescript',
                        eft_source: true,
                        eft_cell_index: index
                    },
                    outputs: [],
                    source: sourceLines(cellSource)
                };
            })
        };
    }

    function notebookSourceToText(source) {
        if (Array.isArray(source)) return source.join('');
        return typeof source === 'string' ? source : '';
    }

    function isCoffeeScriptNotebook(notebook) {
        if (!notebook || notebook.nbformat !== 4 || !Array.isArray(notebook.cells)) return false;
        const metadata = notebook.metadata || {};
        const languageInfo = metadata.language_info || {};
        const kernel = metadata.kernelspec || {};
        const hashcod = metadata.hashcod || {};
        if (String(languageInfo.name || '').toLowerCase() === 'coffeescript') return true;
        if (String(kernel.language || '').toLowerCase() === 'coffeescript') return true;
        if (String(hashcod.source_language || '').toLowerCase() === 'coffeescript') return true;
        return notebook.cells.some(function (cell) {
            return cell && cell.cell_type === 'code' && String((cell.metadata || {}).language || '').toLowerCase() === 'coffeescript';
        });
    }

    function notebookToCoffeeScript(notebook) {
        if (!isCoffeeScriptNotebook(notebook)) throw new Error('Notebook is not CoffeeScript/IPYNB compatible.');
        const codeCells = notebook.cells.filter(function (cell) { return cell && cell.cell_type === 'code'; });
        return codeCells.map(function (cell) { return notebookSourceToText(cell.source).replace(/\s+$/g, ''); }).join('\n\n' + CELL_SEPARATOR + '\n\n');
    }

    function updateStatus(message) {
        const editor = getEditor();
        const status = byId(STATUS_ID);
        if (!editor || !status) return;
        if (message) {
            status.textContent = message;
            return;
        }
        const text = editor.value;
        const lines = text === '' ? 1 : text.split('\n').length;
        const cells = splitCoffeeScriptCells(text).length;
        status.textContent = 'CoffeeScript · IPYNB structure · ' + cells + ' cell' + (cells === 1 ? '' : 's') + ' · ' + lines + ' lines';
    }

    function saveDraft() {
        const editor = getEditor();
        const name = byId(NAME_ID);
        if (!editor || !name) return;
        try {
            localStorage.setItem(STORAGE_KEY, editor.value);
            localStorage.setItem(NAME_STORAGE_KEY, sanitizeName(name.value));
        } catch (_) {}
        updateStatus();
    }

    function loadDraft() {
        const editor = getEditor();
        const name = byId(NAME_ID);
        if (!editor || !name) return;
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            const savedName = localStorage.getItem(NAME_STORAGE_KEY);
            if (saved !== null) editor.value = saved;
            if (savedName) name.value = savedName;
        } catch (_) {}
        updateStatus();
    }

    function insertTab(event) {
        if (event.key !== 'Tab') return;
        event.preventDefault();
        const editor = event.currentTarget;
        const start = editor.selectionStart;
        const end = editor.selectionEnd;
        editor.setRangeText('  ', start, end, 'end');
        saveDraft();
    }

    function insertCell() {
        const editor = getEditor();
        if (!editor) return;
        const start = editor.selectionStart;
        const before = editor.value.slice(0, start).replace(/\s*$/g, '');
        const after = editor.value.slice(start).replace(/^\s*/g, '');
        const insertion = (before ? '\n\n' : '') + CELL_SEPARATOR + '\n\n';
        editor.value = before + insertion + after;
        const next = before.length + insertion.length;
        editor.setSelectionRange(next, next);
        saveDraft();
        editor.focus();
    }

    function downloadEft() {
        const name = byId(NAME_ID);
        if (!name) return false;
        const filename = sanitizeName(name.value) + '.eft';
        name.value = sanitizeName(name.value);
        const notebook = buildEftNotebook();
        const payload = JSON.stringify(notebook, null, 2);
        const blob = new Blob([payload], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = filename;
        anchor.hidden = true;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        window.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
        saveDraft();
        updateStatus('Downloaded ' + filename + ' · CoffeeScript + IPYNB');
        return true;
    }

    function ensureImportInput() {
        if (importInput && importInput.isConnected) return importInput;
        importInput = document.createElement('input');
        importInput.type = 'file';
        importInput.accept = '.eft,.ipynb,.coffee,application/json,text/plain';
        importInput.hidden = true;
        importInput.id = 'hashcodEfrImportInput';
        importInput.addEventListener('change', async function () {
            const file = importInput.files && importInput.files[0];
            if (!file) return;
            try {
                const editor = getEditor();
                const name = byId(NAME_ID);
                if (!editor || !name) return;
                const text = await file.text();
                const lowerName = String(file.name || '').toLowerCase();
                if (lowerName.endsWith('.coffee')) {
                    editor.value = text.replace(/\r\n?/g, '\n');
                } else {
                    const notebook = JSON.parse(text);
                    if (lowerName.endsWith('.eft') && notebook.eft_format !== EFT_FORMAT) {
                        throw new Error('Unsupported EFT format.');
                    }
                    editor.value = notebookToCoffeeScript(notebook);
                }
                name.value = sanitizeName(file.name);
                saveDraft();
                updateStatus('Loaded ' + file.name + ' · CoffeeScript/IPYNB');
                editor.focus();
            } catch (_) {
                updateStatus('Only CoffeeScript .coffee, CoffeeScript .ipynb, or HASHCOD-EFT-1 .eft files are accepted.');
            } finally {
                importInput.value = '';
            }
        });
        document.body.appendChild(importInput);
        return importInput;
    }

    function newDocument() {
        const editor = getEditor();
        const name = byId(NAME_ID);
        if (!editor || !name) return;
        editor.value = '';
        name.value = 'untitled';
        saveDraft();
        updateStatus('New CoffeeScript/IPYNB document');
        editor.focus();
    }

    function ensureModal() {
        ensureCriticalStyles();
        let modal = byId(MODAL_ID);
        if (modal) return modal;

        modal = document.createElement('dialog');
        modal.id = MODAL_ID;
        modal.hidden = true;
        modal.setAttribute('aria-hidden', 'true');
        modal.setAttribute('aria-labelledby', 'hashcodEfrEditorTitle');
        modal.style.setProperty('position', 'fixed', 'important');
        modal.style.setProperty('inset', '0', 'important');
        modal.style.setProperty('width', '100vw', 'important');
        modal.style.setProperty('height', '100vh', 'important');
        modal.style.setProperty('max-width', 'none', 'important');
        modal.style.setProperty('max-height', 'none', 'important');
        modal.style.setProperty('margin', '0', 'important');
        modal.style.setProperty('border', '0', 'important');
        modal.style.setProperty('box-sizing', 'border-box', 'important');
        modal.style.setProperty('z-index', '2147483647', 'important');
        modal.innerHTML = [
            '<section id="' + WINDOW_ID + '" role="document">',
                '<header class="hashcod-efr-editor-header">',
                    '<div>',
                        '<p class="hashcod-efr-editor-kicker">HASHCOD / EFT · COFFEESCRIPT NOTEBOOK</p>',
                        '<h2 id="hashcodEfrEditorTitle">EFT Code Editor</h2>',
                        '<p class="hashcod-efr-editor-subtitle">CoffeeScript source only, stored as Jupyter Notebook cells (nbformat 4). The editor does not execute code.</p>',
                    '</div>',
                    '<button type="button" id="hashcodEfrEditorClose" class="hashcod-efr-icon-button" aria-label="Close editor">×</button>',
                '</header>',
                '<div class="hashcod-efr-toolbar">',
                    '<div class="hashcod-eft-file-stack">',
                        '<label class="hashcod-efr-name-wrap"><span>FILE</span><input id="' + NAME_ID + '" value="untitled" autocomplete="off" spellcheck="false"><b>.eft</b></label>',
                        '<div class="hashcod-eft-modebar"><span>COFFEESCRIPT</span><span>IPYNB · NBFORMAT 4</span><span>HASHCOD-EFT-1</span></div>',
                    '</div>',
                    '<div class="hashcod-efr-actions">',
                        '<button type="button" id="hashcodEfrNew">New</button>',
                        '<button type="button" id="hashcodEfrCell">New Cell</button>',
                        '<button type="button" id="hashcodEfrOpen">Open</button>',
                        '<button type="button" id="hashcodEfrDownload" class="is-primary">Download .eft</button>',
                    '</div>',
                '</div>',
                '<div class="hashcod-efr-editor-body">',
                    '<textarea id="' + TEXTAREA_ID + '" data-language="coffeescript" aria-label="CoffeeScript notebook editor" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" wrap="off" placeholder="# CoffeeScript\nsquare = (x) -> x * x\nconsole.log square 5\n\n# Add another notebook cell with the New Cell button"></textarea>',
                '</div>',
                '<footer class="hashcod-efr-editor-footer">',
                    '<span id="' + STATUS_ID + '">CoffeeScript · IPYNB structure · 1 cell</span>',
                    '<span>Ctrl/Cmd + S → .eft · ' + CELL_SEPARATOR + '</span>',
                '</footer>',
            '</section>'
        ].join('');
        document.body.appendChild(modal);

        const editor = getEditor();
        const name = byId(NAME_ID);
        editor.addEventListener('keydown', insertTab);
        editor.addEventListener('input', saveDraft);
        name.addEventListener('input', saveDraft);
        byId('hashcodEfrEditorClose').addEventListener('click', closeEditor);
        byId('hashcodEfrOpen').addEventListener('click', function () { ensureImportInput().click(); });
        byId('hashcodEfrNew').addEventListener('click', newDocument);
        byId('hashcodEfrCell').addEventListener('click', insertCell);
        byId('hashcodEfrDownload').addEventListener('click', downloadEft);
        modal.addEventListener('cancel', function (event) {
            event.preventDefault();
            closeEditor();
        });
        modal.addEventListener('click', function (event) {
            if (event.target === modal) closeEditor();
        });
        loadDraft();
        return modal;
    }

    function modalIsOpen() {
        const modal = byId(MODAL_ID);
        return Boolean(modal && modal.open && !modal.hidden && modal.getAttribute('aria-hidden') === 'false');
    }

    function openEditor() {
        const modal = ensureModal();
        lastFocused = document.activeElement;
        modal.hidden = false;
        modal.removeAttribute('hidden');
        modal.setAttribute('aria-hidden', 'false');
        modal.style.setProperty('display', 'grid', 'important');
        modal.style.setProperty('visibility', 'visible', 'important');
        modal.style.setProperty('opacity', '1', 'important');
        modal.style.setProperty('pointer-events', 'auto', 'important');
        try {
            if (typeof modal.showModal === 'function' && !modal.open) modal.showModal();
            else if (!modal.open) modal.setAttribute('open', '');
        } catch (_) {
            modal.setAttribute('open', '');
        }
        document.documentElement.classList.add('hashcod-efr-editor-open');
        document.documentElement.dataset.hashcodEfrModalVisible = 'true';
        const zone = byId(HOTZONE_ID);
        if (zone) zone.style.display = 'none';
        window.requestAnimationFrame(function () {
            const editor = getEditor();
            if (editor) editor.focus({ preventScroll: true });
        });
        return true;
    }

    function closeEditor() {
        const modal = byId(MODAL_ID);
        if (!modal) return;
        saveDraft();
        try {
            if (typeof modal.close === 'function' && modal.open) modal.close();
            else modal.removeAttribute('open');
        } catch (_) {
            modal.removeAttribute('open');
        }
        modal.hidden = true;
        modal.setAttribute('hidden', '');
        modal.setAttribute('aria-hidden', 'true');
        modal.style.removeProperty('display');
        modal.style.removeProperty('visibility');
        modal.style.removeProperty('opacity');
        document.documentElement.classList.remove('hashcod-efr-editor-open');
        document.documentElement.dataset.hashcodEfrModalVisible = 'false';
        repairTrayButton();
        syncHotzone();
        if (lastFocused && typeof lastFocused.focus === 'function') {
            try { lastFocused.focus({ preventScroll: true }); } catch (_) {}
        }
    }

    function repairTrayButton() {
        const button = getTrayButton();
        if (!button) return null;
        button.disabled = false;
        button.removeAttribute('disabled');
        button.setAttribute('aria-disabled', 'false');
        button.classList.remove('is-empty');
        button.dataset.toolId = TOOL_ID;
        button.setAttribute('aria-label', 'EFT CoffeeScript Notebook');
        button.setAttribute('title', 'EFT CoffeeScript Notebook');
        button.style.setProperty('pointer-events', 'auto', 'important');
        button.style.setProperty('cursor', 'pointer', 'important');
        button.style.setProperty('opacity', '1', 'important');
        if (!button.querySelector('[data-hashcod-efr-icon="true"]')) button.innerHTML = EDITOR_ICON;
        if (button.dataset.hashcodEfrBound !== 'true') {
            button.dataset.hashcodEfrBound = 'true';
            button.onclick = function (event) {
                if (event) {
                    event.preventDefault();
                    event.stopPropagation();
                }
                openEditor();
            };
        }
        return button;
    }

    function pointInsideButton(event, button) {
        if (!button || !event) return false;
        const x = Number(event.clientX);
        const y = Number(event.clientY);
        if (!Number.isFinite(x) || !Number.isFinite(y)) return false;
        const rect = button.getBoundingClientRect();
        if (!rect.width || !rect.height) return false;
        return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
    }

    function eventTargetsButton(event, button) {
        const target = event && event.target;
        return Boolean(target && button && (target === button || button.contains(target)));
    }

    function handlePhysicalTrayPress(event) {
        if (modalIsOpen()) return;
        const button = getTrayButton();
        if (!button) return;
        if (!eventTargetsButton(event, button) && !pointInsideButton(event, button)) return;
        event.preventDefault();
        event.stopPropagation();
        openEditor();
    }

    function ensureHotzone() {
        let zone = byId(HOTZONE_ID);
        if (zone) return zone;
        zone = document.createElement('button');
        zone.type = 'button';
        zone.id = HOTZONE_ID;
        zone.setAttribute('aria-label', 'Open EFT CoffeeScript Notebook');
        zone.title = 'EFT CoffeeScript Notebook';
        zone.style.cssText = 'position:fixed;display:none;z-index:2147483646;border:0;padding:0;margin:0;background:transparent;opacity:.001;pointer-events:auto;cursor:pointer;';
        zone.addEventListener('pointerdown', function (event) {
            event.preventDefault();
            event.stopPropagation();
            openEditor();
        }, true);
        zone.addEventListener('click', function (event) {
            event.preventDefault();
            event.stopPropagation();
            openEditor();
        }, true);
        document.body.appendChild(zone);
        return zone;
    }

    function syncHotzone() {
        const zone = ensureHotzone();
        const button = getTrayButton();
        const authOverlay = document.getElementById('authOverlay');
        const authVisible = !authOverlay || (getComputedStyle(authOverlay).display !== 'none' && getComputedStyle(authOverlay).visibility !== 'hidden');
        if (!button || !authVisible || modalIsOpen()) {
            zone.style.display = 'none';
            return;
        }
        const rect = button.getBoundingClientRect();
        if (!rect.width || !rect.height || rect.bottom < 0 || rect.right < 0 || rect.top > innerHeight || rect.left > innerWidth) {
            zone.style.display = 'none';
            return;
        }
        zone.style.display = 'block';
        zone.style.left = rect.left + 'px';
        zone.style.top = rect.top + 'px';
        zone.style.width = rect.width + 'px';
        zone.style.height = rect.height + 'px';
    }

    function registerTrayToolOnce() {
        const api = window.HashcodVectorTray;
        if (!api || typeof api.registerTool !== 'function') return false;
        if (registeredTrayApi === api) return true;
        api.registerTool({
            slot: TRAY_SLOT,
            id: TOOL_ID,
            label: 'EFT CoffeeScript Notebook',
            iconSvg: EDITOR_ICON,
            onClick: openEditor
        });
        registeredTrayApi = api;
        return true;
    }

    function repairAndSync() {
        registerTrayToolOnce();
        repairTrayButton();
        syncHotzone();
    }

    function watchTray() {
        if (trayObserver) return;
        trayObserver = new MutationObserver(function (records) {
            for (const record of records) {
                if (record.type === 'childList') {
                    window.requestAnimationFrame(repairAndSync);
                    break;
                }
            }
        });
        trayObserver.observe(document.documentElement, { childList: true, subtree: true });
    }

    function bindGlobalShortcuts() {
        document.addEventListener('keydown', function (event) {
            if (!modalIsOpen()) return;
            if (event.key === 'Escape') {
                event.preventDefault();
                closeEditor();
                return;
            }
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
                event.preventDefault();
                downloadEft();
            }
        });
    }

    function diagnostics() {
        const button = getTrayButton();
        const zone = byId(HOTZONE_ID);
        return {
            ready: document.documentElement.dataset.hashcodEfrReady === 'true',
            buttonFound: Boolean(button),
            buttonDisabled: button ? Boolean(button.disabled) : null,
            toolId: button ? button.getAttribute('data-tool-id') : null,
            modalOpen: modalIsOpen(),
            hotzoneVisible: Boolean(zone && zone.style.display !== 'none'),
            format: EFT_FORMAT,
            language: 'coffeescript',
            container: 'ipynb'
        };
    }

    function boot() {
        ensureCriticalStyles();
        ensureModal();
        ensureImportInput();
        ensureHotzone();
        bindGlobalShortcuts();
        watchTray();
        window.addEventListener('pointerdown', handlePhysicalTrayPress, true);
        window.addEventListener('mousedown', handlePhysicalTrayPress, true);
        document.addEventListener('click', handlePhysicalTrayPress, true);
        window.addEventListener('resize', syncHotzone, { passive: true });
        window.addEventListener('scroll', syncHotzone, true);
        window.addEventListener('hashcod:platform-entered', repairAndSync);
        repairAndSync();
        repairTimer = window.setInterval(repairAndSync, 400);
        document.documentElement.dataset.hashcodEfrReady = 'true';
        window.dispatchEvent(new CustomEvent('hashcod:efr-ready'));
    }

    window.HashcodEfrCodeEditor = {
        open: openEditor,
        close: closeEditor,
        download: downloadEft,
        buildNotebook: buildEftNotebook,
        repair: function () {
            repairAndSync();
            return Boolean(getTrayButton());
        },
        diagnostics: diagnostics
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot, { once: true });
    } else {
        boot();
    }
})();