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
    const STORAGE_KEY = 'hashcod_efr_editor_draft_v1';
    const NAME_STORAGE_KEY = 'hashcod_efr_editor_name_v1';
    const TRAY_SELECTOR = '#hashcodVectorTray [data-vector-tray-slot="' + TRAY_SLOT + '"]';

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

    function byId(id) {
        return document.getElementById(id);
    }

    function getEditor() {
        return byId(TEXTAREA_ID);
    }

    function sanitizeName(value) {
        const cleaned = String(value || '')
            .replace(/[\\/:*?"<>|\u0000-\u001f]/g, '-')
            .replace(/\s+/g, ' ')
            .trim();
        return (cleaned || 'untitled').replace(/\.efr$/i, '');
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
        if (event.key !== 'Tab') return;
        event.preventDefault();
        const editor = event.currentTarget;
        const start = editor.selectionStart;
        const end = editor.selectionEnd;
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
        anchor.hidden = true;
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
        importInput.addEventListener('change', async function () {
            const file = importInput.files && importInput.files[0];
            if (!file) return;
            try {
                const editor = getEditor();
                const name = byId(NAME_ID);
                if (!editor || !name) return;
                editor.value = await file.text();
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
        updateStatus('New RAW document');
        editor.focus();
    }

    function ensureModal() {
        let modal = byId(MODAL_ID);
        if (modal) return modal;

        // Native <dialog> puts the editor in the browser top layer. This avoids
        // every z-index/stacking-context race with the login artwork, tray,
        // Rare UI folder, transitions, or future overlays.
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
        editor.addEventListener('keydown', insertTab);
        editor.addEventListener('input', saveDraft);
        name.addEventListener('input', saveDraft);
        byId('hashcodEfrEditorClose').addEventListener('click', closeEditor);
        byId('hashcodEfrOpen').addEventListener('click', function () { ensureImportInput().click(); });
        byId('hashcodEfrNew').addEventListener('click', newDocument);
        byId('hashcodEfrDownload').addEventListener('click', downloadEfr);
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
        return Boolean(modal && (modal.open || (!modal.hidden && modal.getAttribute('aria-hidden') !== 'true')));
    }

    function getTrayButton() {
        return document.querySelector(TRAY_SELECTOR);
    }

    function repairTrayButton() {
        const button = getTrayButton();
        if (!button) return null;

        button.disabled = false;
        button.removeAttribute('disabled');
        button.setAttribute('aria-disabled', 'false');
        button.classList.remove('is-empty');
        button.dataset.toolId = TOOL_ID;
        button.setAttribute('aria-label', 'EFR Code Editor');
        button.setAttribute('title', 'EFR Code Editor');
        button.style.setProperty('pointer-events', 'auto', 'important');
        button.style.setProperty('cursor', 'pointer', 'important');

        if (!button.querySelector('svg')) button.innerHTML = EDITOR_ICON;
        button.onclick = function (event) {
            if (event) {
                event.preventDefault();
                event.stopPropagation();
            }
            openEditor();
        };
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

    function openEditor() {
        const modal = ensureModal();
        lastFocused = document.activeElement;
        document.documentElement.dataset.hashcodEfrOpenPending = 'false';

        modal.hidden = false;
        modal.removeAttribute('hidden');
        modal.setAttribute('aria-hidden', 'false');
        modal.style.setProperty('display', 'grid', 'important');
        modal.style.setProperty('visibility', 'visible', 'important');
        modal.style.setProperty('opacity', '1', 'important');
        modal.style.setProperty('pointer-events', 'auto', 'important');

        try {
            if (typeof modal.showModal === 'function' && !modal.open) {
                modal.showModal();
            } else if (!modal.open) {
                modal.setAttribute('open', '');
            }
        } catch (_) {
            modal.setAttribute('open', '');
        }

        document.documentElement.classList.add('hashcod-efr-editor-open');
        document.documentElement.dataset.hashcodEfrModalVisible = 'true';
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

        if (lastFocused && typeof lastFocused.focus === 'function') {
            try { lastFocused.focus({ preventScroll: true }); } catch (_) {}
        }
    }

    function registerTrayTool() {
        if (!window.HashcodVectorTray || typeof window.HashcodVectorTray.registerTool !== 'function') {
            repairTrayButton();
            return false;
        }
        window.HashcodVectorTray.registerTool({
            slot: TRAY_SLOT,
            id: TOOL_ID,
            label: 'EFR Code Editor',
            iconSvg: EDITOR_ICON,
            onClick: openEditor
        });
        return Boolean(repairTrayButton());
    }

    function handlePhysicalTrayPress(event) {
        if (modalIsOpen()) return;
        const button = repairTrayButton();
        if (!button) return;

        // This rescue does not depend on the event target. If another overlay is
        // physically on top of the cube, the capture listener still receives the
        // pointer coordinates at window/document level and opens EFR when those
        // coordinates are inside the visible fifth cube.
        const hitsButton = eventTargetsButton(event, button) || pointInsideButton(event, button);
        if (!hitsButton) return;

        event.preventDefault();
        event.stopPropagation();
        openEditor();
    }

    function bindTrayInteractionRescue() {
        if (document.documentElement.dataset.hashcodEfrTrayInteractionBound === 'true') return;
        document.documentElement.dataset.hashcodEfrTrayInteractionBound = 'true';

        window.addEventListener('pointerdown', handlePhysicalTrayPress, true);
        window.addEventListener('mousedown', handlePhysicalTrayPress, true);
        document.addEventListener('click', handlePhysicalTrayPress, true);
    }

    function bindGlobalShortcuts() {
        if (document.documentElement.dataset.hashcodEfrShortcutsBound === 'true') return;
        document.documentElement.dataset.hashcodEfrShortcutsBound = 'true';
        document.addEventListener('keydown', function (event) {
            if (!modalIsOpen()) return;
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

    function diagnostics() {
        const button = getTrayButton();
        const modal = byId(MODAL_ID);
        return {
            ready: document.documentElement.dataset.hashcodEfrReady === 'true',
            buttonFound: Boolean(button),
            buttonDisabled: Boolean(button && button.disabled),
            toolId: button ? button.getAttribute('data-tool-id') : null,
            modalFound: Boolean(modal),
            modalOpen: modalIsOpen(),
            dialogTopLayerCapable: Boolean(modal && typeof modal.showModal === 'function')
        };
    }

    function init() {
        ensureModal();
        ensureImportInput();
        bindTrayInteractionRescue();
        bindGlobalShortcuts();

        [0, 50, 120, 250, 500, 1000, 1800, 3000, 5000, 8000].forEach(function (delay) {
            window.setTimeout(function () {
                registerTrayTool();
                repairTrayButton();
            }, delay);
        });

        const observer = new MutationObserver(function () {
            repairTrayButton();
            if (window.HashcodVectorTray && typeof window.HashcodVectorTray.registerTool === 'function') {
                const button = getTrayButton();
                if (!button || button.dataset.toolId !== TOOL_ID || button.disabled) registerTrayTool();
            }
        });
        observer.observe(document.documentElement, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['disabled', 'data-tool-id', 'class', 'style']
        });

        repairTimer = window.setInterval(function () {
            repairTrayButton();
        }, 750);

        document.documentElement.dataset.hashcodEfrReady = 'true';
        window.dispatchEvent(new CustomEvent('hashcod:efr-ready'));

        if (document.documentElement.dataset.hashcodEfrOpenPending === 'true') {
            openEditor();
        }
    }

    window.addEventListener('hashcod:efr-open-request', function () {
        document.documentElement.dataset.hashcodEfrOpenPending = 'true';
        openEditor();
    });

    window.HashcodEfrCodeEditor = Object.freeze({
        open: openEditor,
        close: closeEditor,
        download: downloadEfr,
        newDocument: newDocument,
        repair: repairTrayButton,
        diagnostics: diagnostics
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();
