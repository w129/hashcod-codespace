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
    const PROXY_ID = 'hashcodEfrTrayClickProxy';
    const STORAGE_KEY = 'hashcod_efr_editor_draft_v1';
    const NAME_STORAGE_KEY = 'hashcod_efr_editor_name_v1';
    const MODAL_Z_INDEX = '2147483647';

    const EDITOR_ICON = [
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" aria-hidden="true" focusable="false" style="display:block;width:72%;height:72%;max-width:38px;max-height:38px">',
            '<rect x="8" y="9" width="48" height="46" rx="8" fill="#fff" stroke="#111" stroke-width="3"/>',
            '<path d="M25 23L16 32l9 9M39 23l9 9-9 9" fill="none" stroke="#111" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>',
            '<path d="M35 18L29 46" fill="none" stroke="#111" stroke-width="3" stroke-linecap="round"/>',
        '</svg>'
    ].join('');

    let importInput = null;
    let lastFocused = null;
    let repairTimer = null;

    function byId(id) { return document.getElementById(id); }

    function sanitizeName(value) {
        const cleaned = String(value || '')
            .replace(/[\\/:*?"<>|\u0000-\u001f]/g, '-')
            .replace(/\s+/g, ' ')
            .trim();
        return (cleaned || 'untitled').replace(/\.efr$/i, '');
    }

    function getEditor() { return byId(TEXTAREA_ID); }

    function updateStatus(message) {
        const editor = getEditor();
        const status = byId(STATUS_ID);
        if (!status || !editor) return;
        if (message) {
            status.textContent = message;
            return;
        }
        const text = editor.value;
        const lines = text === '' ? 1 : text.split('\n').length;
        status.textContent = lines + ' lines · ' + text.length + ' chars · RAW mode';
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
        const editor = event.currentTarget;
        if (event.key !== 'Tab') return;
        event.preventDefault();
        const start = editor.selectionStart;
        const end = editor.selectionEnd;
        const value = editor.value;
        if (event.shiftKey) {
            const lineStart = value.lastIndexOf('\n', Math.max(0, start - 1)) + 1;
            const prefix = value.slice(lineStart, lineStart + 4);
            const remove = prefix.startsWith('\t') ? 1 : Math.min((prefix.match(/^ +/) || [''])[0].length, 4);
            if (remove > 0) {
                editor.setRangeText('', lineStart, lineStart + remove, 'preserve');
                editor.selectionStart = Math.max(lineStart, start - remove);
                editor.selectionEnd = Math.max(editor.selectionStart, end - remove);
            }
            saveDraft();
            return;
        }
        editor.setRangeText('    ', start, end, 'end');
        saveDraft();
    }

    function downloadEfr() {
        const editor = getEditor();
        const name = byId(NAME_ID);
        if (!editor || !name) return false;
        const filename = sanitizeName(name.value) + '.efr';
        name.value = sanitizeName(name.value);
        const blob = new Blob([editor.value], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = filename;
        anchor.style.display = 'none';
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        window.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
        saveDraft();
        updateStatus('Downloaded ' + filename + ' · RAW text preserved');
        return true;
    }

    function ensureImportInput() {
        if (importInput && importInput.isConnected) return importInput;
        importInput = document.createElement('input');
        importInput.type = 'file';
        importInput.accept = '.efr,text/*,*/*';
        importInput.hidden = true;
        importInput.id = 'hashcodEfrImportInput';
        document.body.appendChild(importInput);
        importInput.addEventListener('change', async function () {
            const file = importInput.files && importInput.files[0];
            if (!file) return;
            try {
                const text = await file.text();
                const editor = getEditor();
                const name = byId(NAME_ID);
                if (!editor || !name) return;
                editor.value = text;
                name.value = sanitizeName(file.name.replace(/\.[^.]+$/, ''));
                saveDraft();
                updateStatus('Loaded ' + file.name + ' · no validation applied');
                editor.focus();
            } catch (_) {
                updateStatus('Could not read that file as text.');
            } finally {
                importInput.value = '';
            }
        });
        return importInput;
    }

    function newDocument() {
        const editor = getEditor();
        const name = byId(NAME_ID);
        if (!editor || !name) return;
        editor.value = '';
        name.value = 'untitled';
        saveDraft();
        updateStatus('New RAW document');
        editor.focus();
    }

    function ensureModal() {
        let modal = byId(MODAL_ID);
        if (modal) return modal;

        modal = document.createElement('div');
        modal.id = MODAL_ID;
        modal.hidden = true;
        modal.setAttribute('aria-hidden', 'true');
        modal.innerHTML = [
            '<section id="' + WINDOW_ID + '" role="dialog" aria-modal="true" aria-labelledby="hashcodEfrEditorTitle">',
                '<header class="hashcod-efr-editor-header">',
                    '<div>',
                        '<p class="hashcod-efr-editor-kicker">HASHCOD / EFR</p>',
                        '<h2 id="hashcodEfrEditorTitle">Universal Code Editor</h2>',
                        '<p class="hashcod-efr-editor-subtitle">Write any code as raw text. No parser, compiler or linter will reject it.</p>',
                    '</div>',
                    '<button type="button" id="hashcodEfrEditorClose" class="hashcod-efr-icon-button" aria-label="Close editor">×</button>',
                '</header>',
                '<div class="hashcod-efr-toolbar">',
                    '<label class="hashcod-efr-name-wrap"><span>FILE</span><input id="' + NAME_ID + '" value="untitled" autocomplete="off" spellcheck="false"><b>.efr</b></label>',
                    '<div class="hashcod-efr-actions">',
                        '<button type="button" id="hashcodEfrNew">New</button>',
                        '<button type="button" id="hashcodEfrOpen">Open</button>',
                        '<button type="button" id="hashcodEfrDownload" class="is-primary">Download .efr</button>',
                    '</div>',
                '</div>',
                '<div class="hashcod-efr-editor-body">',
                    '<textarea id="' + TEXTAREA_ID + '" aria-label="Universal raw code editor" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" wrap="off" placeholder="// Write any code here...\n// Any language, syntax or notation is accepted as raw text."></textarea>',
                '</div>',
                '<footer class="hashcod-efr-editor-footer">',
                    '<span id="' + STATUS_ID + '">1 line · 0 chars · RAW mode</span>',
                    '<span>Ctrl/Cmd + S → .efr</span>',
                '</footer>',
            '</section>'
        ].join('');
        document.body.appendChild(modal);

        const editor = getEditor();
        const name = byId(NAME_ID);
        const close = byId('hashcodEfrEditorClose');
        const open = byId('hashcodEfrOpen');
        const fresh = byId('hashcodEfrNew');
        const download = byId('hashcodEfrDownload');

        editor.addEventListener('keydown', insertTab);
        editor.addEventListener('input', saveDraft);
        name.addEventListener('input', saveDraft);
        close.addEventListener('click', closeEditor);
        open.addEventListener('click', function () { ensureImportInput().click(); });
        fresh.addEventListener('click', newDocument);
        download.addEventListener('click', downloadEfr);
        modal.addEventListener('click', function (event) {
            if (event.target === modal) closeEditor();
        });

        loadDraft();
        return modal;
    }

    function modalIsOpen() {
        const modal = byId(MODAL_ID);
        return Boolean(modal && !modal.hidden && modal.getAttribute('aria-hidden') !== 'true');
    }

    function getTrayButton() {
        return document.querySelector('#hashcodVectorTray [data-vector-tray-slot="' + TRAY_SLOT + '"]');
    }

    function repairTrayButton() {
        const button = getTrayButton();
        if (!button) return null;
        button.disabled = false;
        button.removeAttribute('disabled');
        button.setAttribute('aria-disabled', 'false');
        button.setAttribute('aria-label', 'Open EFR Code Editor');
        button.setAttribute('title', 'EFR Code Editor');
        button.dataset.toolId = TOOL_ID;
        button.style.setProperty('pointer-events', 'auto', 'important');
        button.style.setProperty('cursor', 'pointer', 'important');
        return button;
    }

    function ensureClickProxy() {
        let proxy = byId(PROXY_ID);
        if (proxy) return proxy;
        proxy = document.createElement('button');
        proxy.type = 'button';
        proxy.id = PROXY_ID;
        proxy.setAttribute('aria-label', 'Open EFR Code Editor');
        proxy.setAttribute('title', 'EFR Code Editor');
        proxy.tabIndex = -1;
        proxy.style.cssText = [
            'position:fixed',
            'display:none',
            'margin:0',
            'padding:0',
            'border:0',
            'background:transparent',
            'opacity:0.001',
            'cursor:pointer',
            'pointer-events:auto',
            'z-index:2147483647',
            '-webkit-tap-highlight-color:transparent'
        ].join(';');
        proxy.addEventListener('pointerdown', function (event) {
            event.preventDefault();
            event.stopPropagation();
            openEditor();
        }, true);
        proxy.addEventListener('click', function (event) {
            event.preventDefault();
            event.stopPropagation();
            openEditor();
        }, true);
        document.body.appendChild(proxy);
        return proxy;
    }

    function syncClickProxy() {
        const proxy = ensureClickProxy();
        const button = repairTrayButton();
        if (!button || modalIsOpen()) {
            proxy.style.display = 'none';
            return false;
        }
        const rect = button.getBoundingClientRect();
        if (!rect.width || !rect.height || rect.bottom < 0 || rect.right < 0 || rect.top > window.innerHeight || rect.left > window.innerWidth) {
            proxy.style.display = 'none';
            return false;
        }
        proxy.style.left = Math.round(rect.left) + 'px';
        proxy.style.top = Math.round(rect.top) + 'px';
        proxy.style.width = Math.round(rect.width) + 'px';
        proxy.style.height = Math.round(rect.height) + 'px';
        proxy.style.borderRadius = window.getComputedStyle(button).borderRadius || '12px';
        proxy.style.display = 'block';
        return true;
    }

    function openEditor() {
        const modal = ensureModal();
        lastFocused = document.activeElement;
        const proxy = byId(PROXY_ID);
        if (proxy) proxy.style.display = 'none';
        modal.hidden = false;
        modal.removeAttribute('hidden');
        modal.setAttribute('aria-hidden', 'false');
        modal.style.setProperty('display', 'grid', 'important');
        modal.style.setProperty('z-index', MODAL_Z_INDEX, 'important');
        modal.style.setProperty('pointer-events', 'auto', 'important');
        modal.style.setProperty('visibility', 'visible', 'important');
        modal.style.setProperty('opacity', '1', 'important');
        document.documentElement.classList.add('hashcod-efr-editor-open');
        const tray = document.getElementById('hashcodVectorTray');
        if (tray) tray.style.setProperty('pointer-events', 'none', 'important');
        const editor = getEditor();
        window.requestAnimationFrame(function () {
            if (editor) editor.focus({ preventScroll: true });
        });
        return true;
    }

    function closeEditor() {
        const modal = byId(MODAL_ID);
        if (!modal) return;
        saveDraft();
        modal.hidden = true;
        modal.setAttribute('hidden', '');
        modal.setAttribute('aria-hidden', 'true');
        modal.style.removeProperty('display');
        modal.style.removeProperty('visibility');
        modal.style.removeProperty('opacity');
        document.documentElement.classList.remove('hashcod-efr-editor-open');
        const tray = document.getElementById('hashcodVectorTray');
        if (tray) tray.style.removeProperty('pointer-events');
        window.requestAnimationFrame(syncClickProxy);
        if (lastFocused && typeof lastFocused.focus === 'function') {
            try { lastFocused.focus({ preventScroll: true }); } catch (_) {}
        }
    }

    function registerTrayTool() {
        if (!window.HashcodVectorTray || typeof window.HashcodVectorTray.registerTool !== 'function') return false;
        window.HashcodVectorTray.registerTool({
            slot: TRAY_SLOT,
            id: TOOL_ID,
            label: 'EFR Code Editor',
            iconSvg: EDITOR_ICON,
            onClick: openEditor
        });
        const button = repairTrayButton();
        syncClickProxy();
        return Boolean(button);
    }

    function bindTrayClickRescue() {
        if (document.documentElement.dataset.hashcodEfrTrayClickBound === 'true') return;
        document.documentElement.dataset.hashcodEfrTrayClickBound = 'true';
        document.addEventListener('pointerdown', function (event) {
            const target = event.target;
            if (!target || typeof target.closest !== 'function') return;
            const button = target.closest('#hashcodVectorTray [data-vector-tray-slot="' + TRAY_SLOT + '"]');
            if (!button) return;
            repairTrayButton();
            event.preventDefault();
            event.stopPropagation();
            openEditor();
        }, true);
        document.addEventListener('click', function (event) {
            const target = event.target;
            if (!target || typeof target.closest !== 'function') return;
            const button = target.closest('#hashcodVectorTray [data-vector-tray-slot="' + TRAY_SLOT + '"]');
            if (!button) return;
            const toolId = button.getAttribute('data-tool-id');
            if (toolId && toolId !== TOOL_ID) return;
            openEditor();
        }, true);
    }

    function bindGlobalShortcuts() {
        if (document.documentElement.dataset.hashcodEfrShortcutsBound === 'true') return;
        document.documentElement.dataset.hashcodEfrShortcutsBound = 'true';
        document.addEventListener('keydown', function (event) {
            const modal = byId(MODAL_ID);
            if (!modal || modal.hidden) return;
            if (event.key === 'Escape') {
                event.preventDefault();
                closeEditor();
                return;
            }
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
                event.preventDefault();
                downloadEfr();
            }
        });
    }

    function init() {
        ensureModal();
        ensureImportInput();
        ensureClickProxy();
        bindTrayClickRescue();
        bindGlobalShortcuts();
        [0, 80, 220, 500, 1000, 1800, 3200, 5000, 8000].forEach(function (delay) {
            window.setTimeout(registerTrayTool, delay);
        });
        const observer = new MutationObserver(function () {
            const slot = getTrayButton();
            if (!slot || !slot.querySelector('svg')) registerTrayTool();
            repairTrayButton();
            syncClickProxy();
        });
        observer.observe(document.documentElement, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['disabled', 'data-tool-id', 'style', 'class']
        });
        window.addEventListener('resize', syncClickProxy, { passive: true });
        window.addEventListener('scroll', syncClickProxy, { passive: true, capture: true });
        repairTimer = window.setInterval(function () {
            repairTrayButton();
            syncClickProxy();
        }, 350);
    }

    window.HashcodEfrCodeEditor = Object.freeze({
        open: openEditor,
        close: closeEditor,
        download: downloadEfr,
        newDocument: newDocument,
        repair: function () {
            repairTrayButton();
            return syncClickProxy();
        }
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();
