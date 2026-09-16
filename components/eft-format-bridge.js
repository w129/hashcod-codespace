(function () {
    'use strict';

    if (window.__hashcodEftFormatBridgeLoaded) return;
    window.__hashcodEftFormatBridgeLoaded = true;

    const FORMAT_ID = 'HASHCOD-EFT-1';
    const FILE_EXTENSION = '.eft';
    const MODAL_ID = 'hashcodEfrEditorModal';
    const TEXTAREA_ID = 'hashcodEfrEditorTextarea';
    const NAME_ID = 'hashcodEfrEditorFilename';
    const STATUS_ID = 'hashcodEfrEditorStatus';
    const OPEN_ID = 'hashcodEfrOpen';
    const DOWNLOAD_ID = 'hashcodEfrDownload';
    const TRAY_SELECTOR = '#hashcodVectorTray [data-vector-tray-slot="4"]';

    let importInput = null;
    let observer = null;

    function byId(id) {
        return document.getElementById(id);
    }

    function sanitizeName(value) {
        const cleaned = String(value || '')
            .replace(/[\\/:*?"<>|\u0000-\u001f]/g, '-')
            .replace(/\s+/g, ' ')
            .trim();
        return (cleaned || 'untitled').replace(/\.(?:eft|efr|coffee|ipynb)$/i, '');
    }

    function sourceFromCell(cell) {
        if (!cell || cell.cell_type !== 'code') return '';
        if (Array.isArray(cell.source)) return cell.source.join('');
        return typeof cell.source === 'string' ? cell.source : '';
    }

    function createEftDocument(source) {
        return {
            eft_format: FORMAT_ID,
            nbformat: 4,
            nbformat_minor: 5,
            metadata: {
                language_info: {
                    name: 'coffeescript',
                    file_extension: '.coffee',
                    mimetype: 'text/coffeescript'
                },
                kernelspec: {
                    name: 'coffeescript',
                    display_name: 'CoffeeScript'
                },
                hashcod: {
                    format: 'EFT',
                    version: 1,
                    source_language: 'CoffeeScript',
                    container: 'Jupyter Notebook',
                    execution_policy: 'disabled'
                }
            },
            cells: [
                {
                    cell_type: 'code',
                    execution_count: null,
                    metadata: {
                        language: 'coffeescript',
                        eft_source: true
                    },
                    outputs: [],
                    source: String(source || '')
                }
            ]
        };
    }

    function updateStatus(message) {
        const editor = byId(TEXTAREA_ID);
        const status = byId(STATUS_ID);
        if (!editor || !status) return;
        if (message) {
            status.textContent = message;
            return;
        }
        const text = editor.value || '';
        const lines = text === '' ? 1 : text.split('\n').length;
        status.textContent = lines + ' lines · ' + text.length + ' chars · CoffeeScript × Jupyter · EFT';
    }

    function downloadEft() {
        const editor = byId(TEXTAREA_ID);
        const name = byId(NAME_ID);
        if (!editor || !name) return false;

        const cleanName = sanitizeName(name.value);
        name.value = cleanName;
        const filename = cleanName + FILE_EXTENSION;
        const payload = JSON.stringify(createEftDocument(editor.value), null, 2) + '\n';
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
        updateStatus('Downloaded ' + filename + ' · CoffeeScript source inside Jupyter-style EFT container');
        return true;
    }

    function parseImportedText(file, text) {
        const lower = String(file && file.name || '').toLowerCase();
        const looksNotebook = lower.endsWith('.eft') || lower.endsWith('.ipynb') || /^\s*\{/.test(text);

        if (!looksNotebook) return text;

        let parsed;
        try {
            parsed = JSON.parse(text);
        } catch (_) {
            if (lower.endsWith('.eft') || lower.endsWith('.ipynb')) {
                throw new Error('Notebook JSON is invalid.');
            }
            return text;
        }

        if (!parsed || !Array.isArray(parsed.cells)) {
            if (lower.endsWith('.eft') || lower.endsWith('.ipynb')) {
                throw new Error('Notebook cells are missing.');
            }
            return text;
        }

        const codeCells = parsed.cells
            .filter(function (cell) { return cell && cell.cell_type === 'code'; })
            .map(sourceFromCell);

        if (!codeCells.length) return '';
        return codeCells.join('\n\n');
    }

    function ensureImportInput() {
        if (importInput && importInput.isConnected) return importInput;
        importInput = document.createElement('input');
        importInput.type = 'file';
        importInput.accept = '.eft,.ipynb,.coffee,text/coffeescript,application/json,text/*';
        importInput.hidden = true;
        importInput.id = 'hashcodEftImportInput';
        importInput.addEventListener('change', async function () {
            const file = importInput.files && importInput.files[0];
            if (!file) return;
            try {
                const editor = byId(TEXTAREA_ID);
                const name = byId(NAME_ID);
                if (!editor || !name) return;
                const text = await file.text();
                editor.value = parseImportedText(file, text);
                name.value = sanitizeName(file.name);
                editor.dispatchEvent(new Event('input', { bubbles: true }));
                updateStatus('Loaded ' + file.name + ' into EFT workspace');
                editor.focus();
            } catch (error) {
                updateStatus(error && error.message ? error.message : 'Could not open that EFT/notebook file.');
            } finally {
                importInput.value = '';
            }
        });
        document.body.appendChild(importInput);
        return importInput;
    }

    function replaceActionButton(id, handler) {
        const current = byId(id);
        if (!current || current.dataset.hashcodEftBound === 'true') return current;
        const replacement = current.cloneNode(true);
        replacement.dataset.hashcodEftBound = 'true';
        current.replaceWith(replacement);
        replacement.addEventListener('click', function (event) {
            event.preventDefault();
            event.stopPropagation();
            handler();
        });
        return replacement;
    }

    function relabelUi() {
        const modal = byId(MODAL_ID);
        if (!modal) return;

        const kicker = modal.querySelector('.hashcod-efr-editor-kicker');
        const title = byId('hashcodEfrEditorTitle');
        const subtitle = modal.querySelector('.hashcod-efr-editor-subtitle');
        const ext = modal.querySelector('.hashcod-efr-name-wrap b');
        const editor = byId(TEXTAREA_ID);

        if (kicker) kicker.textContent = 'HASHCOD / EFT · COFFEESCRIPT × JUPYTER';
        if (title) title.textContent = 'EFT Hybrid Code Notebook';
        if (subtitle) subtitle.textContent = 'CoffeeScript source wrapped in a Jupyter Notebook-style container. Editing stays raw and is never executed.';
        if (ext) ext.textContent = '.eft';
        if (editor) {
            editor.setAttribute('aria-label', 'EFT CoffeeScript source editor');
            editor.placeholder = '# CoffeeScript source\n# Saved as HASHCOD-EFT-1 notebook JSON';
        }

        const download = replaceActionButton(DOWNLOAD_ID, downloadEft);
        if (download) download.textContent = 'Download .eft';
        const open = replaceActionButton(OPEN_ID, function () { ensureImportInput().click(); });
        if (open) open.textContent = 'Open EFT / IPYNB';

        const tray = document.querySelector(TRAY_SELECTOR);
        if (tray) {
            tray.setAttribute('aria-label', 'EFT Hybrid Code Notebook');
            tray.setAttribute('title', 'EFT Hybrid Code Notebook');
        }

        if (editor && editor.dataset.hashcodEftStatusBound !== 'true') {
            editor.dataset.hashcodEftStatusBound = 'true';
            editor.addEventListener('input', function () { updateStatus(); });
        }
        updateStatus();
    }

    function bindKeyboardOverride() {
        document.addEventListener('keydown', function (event) {
            const modal = byId(MODAL_ID);
            if (!modal || !modal.open) return;
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
                event.preventDefault();
                event.stopImmediatePropagation();
                downloadEft();
            }
        }, true);
    }

    function boot() {
        bindKeyboardOverride();
        ensureImportInput();
        relabelUi();
        observer = new MutationObserver(function () {
            window.requestAnimationFrame(relabelUi);
        });
        observer.observe(document.documentElement, { childList: true, subtree: true });
        window.addEventListener('hashcod:efr-ready', relabelUi);
        window.HashcodEftFormat = {
            id: FORMAT_ID,
            extension: FILE_EXTENSION,
            create: createEftDocument,
            download: downloadEft,
            openPicker: function () { ensureImportInput().click(); }
        };
        document.documentElement.dataset.hashcodEftReady = 'true';
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot, { once: true });
    } else {
        boot();
    }
})();
