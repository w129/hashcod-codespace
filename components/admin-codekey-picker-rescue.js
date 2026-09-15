(function () {
    'use strict';

    if (window.__hashcodAdminCodeKeyPickerRescueLoaded) return;
    window.__hashcodAdminCodeKeyPickerRescueLoaded = true;

    const EXPECTED_FILENAME = 'OnIPFeJKssih4mbNLCYXnct6a1L_q84po-KVfKPZInHYbhNJ8OR2n3M2zFJ2zZeK9bqkcmilS1li-3DrTsaUIg.ipynb';
    const PICKER_SETTLE_DELAY_MS = 700;
    let activeInput = null;
    let patchedApi = null;

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
                // Chromium can report the dialog closing before FileList has
                // fully settled. Never treat cancel as an immediate rejection.
                settleAfterDialog();
            }

            function onWindowFocus() {
                // Returning focus from the native picker is a reliable fallback
                // on browsers that do not dispatch the input cancel event.
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

    if (!install()) {
        let attempts = 0;
        const timer = window.setInterval(function () {
            attempts += 1;
            if (install() || attempts >= 400) window.clearInterval(timer);
        }, 50);
    }

    window.addEventListener('hashcod:admin-auth', install);
})();
