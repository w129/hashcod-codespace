(function () {
    'use strict';

    if (window.__hashcodAdminCodeKeyPickerRescueLoaded) return;
    window.__hashcodAdminCodeKeyPickerRescueLoaded = true;

    const EXPECTED_FILENAME = 'OnIPFeJKssih4mbNLCYXnct6a1L_q84po-KVfKPZInHYbhNJ8OR2n3M2zFJ2zZeK9bqkcmilS1li-3DrTsaUIg.ipynb';
    const PICKER_SETTLE_DELAY_MS = 700;
    const EFT_TRAY_SELECTOR = '#hashcodVectorTray [data-vector-tray-slot="4"]';
    const EFT_HOTZONE_ID = 'hashcodEfrHotzone';
    const EFT_GATE_ID = 'hashcodEftCodeKeyGate';
    const EFT_MODAL_ID = 'hashcodEfrEditorModal';
    const EFT_GATE_STYLE_ID = 'hashcodEftCodeKeyGateStyle';
    const EFT_SYNC_INTERVAL_MS = 160;

    let activeInput = null;
    let patchedApi = null;
    let gateTimer = 0;
    let unlockPending = null;
    let guardedEftApi = null;
    let originalEftOpen = null;
    let originalEftDownload = null;

    function currentFile(input) {
        return input && input.files && input.files.length > 0 ? input.files[0] : null;
    }

    function pickNotebook() {
        if (activeInput && activeInput.isConnected) activeInput.remove();

        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.ipynb,application/json';
        input.hidden = true;
        input.id = 'hashcodAdminCodeKeyRescueFile';
        activeInput = input;
        (document.body || document.documentElement).appendChild(input);

        return new Promise(function (resolve, reject) {
            let settled = false;
            let settleTimer = 0;

            function cleanup() {
                window.clearTimeout(settleTimer);
                input.removeEventListener('change', onChange);
                input.removeEventListener('cancel', onCancel);
                window.removeEventListener('focus', onWindowFocus, true);
                if (activeInput === input) activeInput = null;
                window.setTimeout(function () {
                    if (input.isConnected) input.remove();
                }, 0);
            }

            function finish(value) {
                if (settled) return;
                settled = true;
                cleanup();
                resolve(value);
            }

            function settleAfterDialog() {
                window.clearTimeout(settleTimer);
                settleTimer = window.setTimeout(function () {
                    finish(currentFile(input));
                }, PICKER_SETTLE_DELAY_MS);
            }

            function onChange() {
                const file = currentFile(input);
                if (file) {
                    finish(file);
                    return;
                }
                settleAfterDialog();
            }

            function onCancel() {
                settleAfterDialog();
            }

            function onWindowFocus() {
                settleAfterDialog();
            }

            input.addEventListener('change', onChange);
            input.addEventListener('cancel', onCancel);
            window.addEventListener('focus', onWindowFocus, true);

            try {
                if (typeof input.showPicker === 'function') input.showPicker();
                else input.click();
            } catch (error) {
                try {
                    input.click();
                } catch (fallbackError) {
                    cleanup();
                    reject(fallbackError || error);
                }
            }
        });
    }

    function setStatus(message) {
        const status = document.getElementById('adminHelloStatus');
        if (status) status.textContent = message;
    }

    function install() {
        const api = window.HashcodAdmin;
        if (!api || typeof api.verifyNotebook !== 'function' || typeof api.require !== 'function') return false;
        if (api === patchedApi || api.__hashcodPickerRescue === true) return true;

        const verifyNotebook = api.verifyNotebook.bind(api);
        const logout = typeof api.logout === 'function' ? api.logout.bind(api) : async function () {};

        const wrapped = Object.freeze({
            __hashcodPickerRescue: true,
            require: async function (options) {
                const force = Boolean(options && options.force === true);
                if (!force && document.documentElement.dataset.adminAuthenticated === 'true') return true;

                setStatus('Selecciona la CodeKey registrada…');
                const file = await pickNotebook();
                if (!file) {
                    setStatus('No se seleccionó una CodeKey.');
                    return false;
                }
                if (file.name !== EXPECTED_FILENAME) {
                    throw new Error('El nombre del archivo CodeKey no coincide con el registrado.');
                }

                setStatus('Verificando CODEKEY1 + JUPYTER1 + HASHCOD1…');
                return verifyNotebook(file);
            },
            verifyNotebook: verifyNotebook,
            logout: logout
        });

        window.HashcodAdmin = wrapped;
        patchedApi = wrapped;
        return true;
    }

    function codeKeyUnlocked() {
        return document.documentElement.dataset.adminAuthenticated === 'true';
    }

    function zeroRect() {
        return {x: 0, y: 0, top: 0, right: 0, bottom: 0, left: 0, width: 0, height: 0, toJSON: function () { return {}; }};
    }

    function patchTrayRect(button) {
        if (!button || button.__hashcodEftCodeKeyRectPatched === true) return;
        const nativeRect = button.getBoundingClientRect.bind(button);
        Object.defineProperty(button, '__hashcodEftCodeKeyNativeRect', {configurable: true, value: nativeRect});
        Object.defineProperty(button, '__hashcodEftCodeKeyRectPatched', {configurable: true, value: true});
        button.getBoundingClientRect = function () {
            return codeKeyUnlocked() ? nativeRect() : zeroRect();
        };
    }

    function realTrayRect(button) {
        if (!button) return zeroRect();
        if (typeof button.__hashcodEftCodeKeyNativeRect === 'function') return button.__hashcodEftCodeKeyNativeRect();
        return button.getBoundingClientRect();
    }

    function ensureGateStyle() {
        let style = document.getElementById(EFT_GATE_STYLE_ID);
        if (style) return style;
        style = document.createElement('style');
        style.id = EFT_GATE_STYLE_ID;
        style.textContent = [
            'html:not([data-admin-authenticated="true"]) #hashcodVectorTray [data-vector-tray-slot="4"]{opacity:.34!important;filter:grayscale(1)!important;cursor:not-allowed!important}',
            '#hashcodEftCodeKeyGate{position:fixed;display:none;z-index:2147483647;border:1px solid rgba(17,17,17,.55);border-radius:12px;background:rgba(245,245,242,.82);color:#111;padding:0;margin:0;cursor:pointer;align-items:center;justify-content:center;backdrop-filter:blur(2px);box-shadow:inset 0 0 0 1px rgba(255,255,255,.55)}',
            '#hashcodEftCodeKeyGate svg{width:22px;height:22px;display:block}',
            '#hashcodEftCodeKeyGate[aria-busy="true"]{cursor:progress;opacity:.75}'
        ].join('');
        (document.head || document.documentElement).appendChild(style);
        return style;
    }

    function ensureEftGate() {
        let gate = document.getElementById(EFT_GATE_ID);
        if (gate) return gate;
        gate = document.createElement('button');
        gate.type = 'button';
        gate.id = EFT_GATE_ID;
        gate.setAttribute('aria-label', 'Desbloquear EFT con CodeKey');
        gate.title = 'EFT bloqueado · verifica la CodeKey para abrir';
        gate.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M17 8h-1V6a4 4 0 0 0-8 0v2H7a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2Zm-7-2a2 2 0 0 1 4 0v2h-4V6Zm3 9.73V18h-2v-2.27a2 2 0 1 1 2 0Z"/></svg>';
        gate.addEventListener('pointerdown', function (event) {
            event.preventDefault();
            event.stopImmediatePropagation();
        }, true);
        gate.addEventListener('click', function (event) {
            event.preventDefault();
            event.stopImmediatePropagation();
            unlockEftAndOpen();
        }, true);
        (document.body || document.documentElement).appendChild(gate);
        return gate;
    }

    function closeEftIfLocked() {
        if (codeKeyUnlocked()) return;
        const modal = document.getElementById(EFT_MODAL_ID);
        const api = window.HashcodEfrCodeEditor;
        if (modal && (modal.open || !modal.hidden) && api && typeof api.close === 'function') {
            try { api.close(); } catch (_) {}
        }
    }

    function guardEftApi() {
        const api = window.HashcodEfrCodeEditor;
        if (!api || api === guardedEftApi || api.__hashcodCodeKeyGate === true) return Boolean(api);
        if (typeof api.open !== 'function' || typeof api.download !== 'function') return false;

        originalEftOpen = api.open.bind(api);
        originalEftDownload = api.download.bind(api);

        api.open = function () {
            if (!codeKeyUnlocked()) return unlockEftAndOpen();
            return originalEftOpen();
        };
        api.download = function () {
            if (!codeKeyUnlocked()) {
                closeEftIfLocked();
                setStatus('EFT bloqueado. Verifica la CodeKey para continuar.');
                return false;
            }
            return originalEftDownload();
        };
        try {
            Object.defineProperty(api, '__hashcodCodeKeyGate', {value: true, configurable: true});
        } catch (_) {
            api.__hashcodCodeKeyGate = true;
        }
        guardedEftApi = api;
        return true;
    }

    async function unlockEftAndOpen() {
        if (unlockPending) return unlockPending;
        if (codeKeyUnlocked()) {
            syncEftGate();
            if (originalEftOpen) return originalEftOpen();
            if (window.HashcodEfrCodeEditor && typeof window.HashcodEfrCodeEditor.open === 'function') return window.HashcodEfrCodeEditor.open();
            return false;
        }

        const gate = ensureEftGate();
        const admin = window.HashcodAdmin;
        if (!admin || typeof admin.require !== 'function') {
            setStatus('CodeKey aún no está disponible. Recarga la página e inténtalo de nuevo.');
            return false;
        }

        gate.setAttribute('aria-busy', 'true');
        setStatus('EFT bloqueado. Selecciona la CodeKey registrada para desbloquearlo…');
        unlockPending = Promise.resolve(admin.require({force: true})).then(function (verified) {
            if (!verified || !codeKeyUnlocked()) {
                setStatus('EFT sigue bloqueado. La CodeKey no fue verificada.');
                return false;
            }
            syncEftGate();
            setStatus('CodeKey verificada. EFT desbloqueado durante la sesión administrativa.');
            guardEftApi();
            if (originalEftOpen) return originalEftOpen();
            if (window.HashcodEfrCodeEditor && typeof window.HashcodEfrCodeEditor.open === 'function') return window.HashcodEfrCodeEditor.open();
            return true;
        }).catch(function (error) {
            setStatus(error && error.message ? error.message : 'No se pudo verificar la CodeKey.');
            return false;
        }).finally(function () {
            gate.removeAttribute('aria-busy');
            unlockPending = null;
            syncEftGate();
        });
        return unlockPending;
    }

    function syncEftGate() {
        ensureGateStyle();
        guardEftApi();
        const gate = ensureEftGate();
        const button = document.querySelector(EFT_TRAY_SELECTOR);
        const unlocked = codeKeyUnlocked();

        if (!button) {
            gate.style.display = 'none';
            closeEftIfLocked();
            return;
        }

        patchTrayRect(button);
        button.dataset.codekeyLocked = unlocked ? 'false' : 'true';
        button.setAttribute('aria-disabled', unlocked ? 'false' : 'true');

        if (unlocked) {
            gate.style.display = 'none';
            button.title = 'EFT CoffeeScript Notebook';
            return;
        }

        const hotzone = document.getElementById(EFT_HOTZONE_ID);
        if (hotzone) hotzone.style.setProperty('display', 'none', 'important');

        const rect = realTrayRect(button);
        if (!rect.width || !rect.height) {
            gate.style.display = 'none';
            closeEftIfLocked();
            return;
        }

        gate.style.display = 'flex';
        gate.style.left = rect.left + 'px';
        gate.style.top = rect.top + 'px';
        gate.style.width = rect.width + 'px';
        gate.style.height = rect.height + 'px';
        button.title = 'EFT bloqueado · verifica la CodeKey';
        closeEftIfLocked();
    }

    function gateDiagnostics() {
        const button = document.querySelector(EFT_TRAY_SELECTOR);
        const gate = document.getElementById(EFT_GATE_ID);
        const modal = document.getElementById(EFT_MODAL_ID);
        return {
            unlocked: codeKeyUnlocked(),
            trayFound: Boolean(button),
            trayLocked: Boolean(button && button.dataset.codekeyLocked === 'true'),
            gateVisible: Boolean(gate && gate.style.display !== 'none'),
            modalOpen: Boolean(modal && modal.open && !modal.hidden),
            adminApiReady: Boolean(window.HashcodAdmin && typeof window.HashcodAdmin.require === 'function'),
            eftApiReady: Boolean(window.HashcodEfrCodeEditor && typeof window.HashcodEfrCodeEditor.open === 'function')
        };
    }

    function bootEftGate() {
        ensureGateStyle();
        ensureEftGate();
        syncEftGate();
        if (!gateTimer) gateTimer = window.setInterval(syncEftGate, EFT_SYNC_INTERVAL_MS);
        window.addEventListener('resize', syncEftGate, {passive: true});
        window.addEventListener('scroll', syncEftGate, true);
        window.addEventListener('hashcod:platform-entered', syncEftGate);
        window.addEventListener('hashcod:efr-ready', syncEftGate);
    }

    if (!install()) {
        let attempts = 0;
        const timer = window.setInterval(function () {
            attempts += 1;
            if (install() || attempts >= 400) window.clearInterval(timer);
        }, 50);
    }

    window.addEventListener('hashcod:admin-auth', function (event) {
        install();
        const authenticated = Boolean(event.detail && event.detail.authenticated);
        if (!authenticated) closeEftIfLocked();
        window.requestAnimationFrame(syncEftGate);
    });

    window.HashcodEftCodeKeyGate = Object.freeze({
        isUnlocked: codeKeyUnlocked,
        sync: syncEftGate,
        unlock: unlockEftAndOpen,
        diagnostics: gateDiagnostics
    });

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootEftGate, {once: true});
    else bootEftGate();
})();
