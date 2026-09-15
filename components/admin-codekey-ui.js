(function () {
    'use strict';

    if (window.__hashcodAdminCodeKeyUiLoaded) return;
    window.__hashcodAdminCodeKeyUiLoaded = true;

    const ENGINE_ID = 'hashcodCodeKeyAdminEngineV1';
    const ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 256 256" aria-hidden="true" focusable="false"><g fill="none" fill-rule="nonzero" stroke="none" stroke-width="1" stroke-linecap="butt" stroke-linejoin="miter" stroke-miterlimit="10" stroke-dasharray="" stroke-dashoffset="0" font-family="none" font-weight="none" font-size="none" text-anchor="none" style="mix-blend-mode:normal"><g transform="scale(5.33333,5.33333)"><path d="M33.5,10c-7.456,0 -13.5,6.044 -13.5,13.5c0,7.456 6.044,13.5 13.5,13.5c7.456,0 13.5,-6.044 13.5,-13.5c0,-7.456 -6.044,-13.5 -13.5,-13.5zM33.5,30c-3.59,0 -6.5,-2.91 -6.5,-6.5c0,-3.59 2.91,-6.5 6.5,-6.5c3.59,0 6.5,2.91 6.5,6.5c0,3.59 -2.91,6.5 -6.5,6.5z" fill="#000000"></path><path d="M19.14,28.051v-0.003c-1.18,1.204 -2.822,1.952 -4.64,1.952c-3.59,0 -6.5,-2.91 -6.5,-6.5c0,-3.59 2.91,-6.5 6.5,-6.5c1.83,0 3.481,0.759 4.662,1.976l3.75,-6.024c-2.308,-1.843 -5.229,-2.952 -8.412,-2.952c-7.456,0 -13.5,6.044 -13.5,13.5c0,7.456 6.044,13.5 13.5,13.5c3.164,0 6.067,-1.097 8.369,-2.919z" fill="#000000"></path><path d="M8,23.5c0,-1.787 0.722,-3.405 1.889,-4.58l-4.855,-5.038c-2.488,2.448 -4.034,5.851 -4.034,9.618c0,3.749 1.53,7.14 3.998,9.586l4.934,-4.964c-1.192,-1.178 -1.932,-2.813 -1.932,-4.622z" fill="#262626"></path><path d="M38.13,18.941c1.155,1.173 1.87,2.782 1.87,4.559c0,3.59 -2.91,6.5 -6.5,6.5c-1.826,0 -3.474,-0.755 -4.655,-1.968l-4.999,4.895c2.452,2.51 5.868,4.073 9.654,4.073c7.456,0 13.5,-6.044 13.5,-13.5c0,-3.684 -1.479,-7.019 -3.871,-9.455z" fill="#262626"></path></g></g></svg>';
    const ICON_SMALL = ICON.replace('width="32" height="32"', 'width="22" height="22"');

    function componentBase() {
        const current = document.currentScript;
        const src = current && current.src ? current.src : '';
        return src && src.lastIndexOf('/') >= 0 ? src.slice(0, src.lastIndexOf('/') + 1) : '/components/';
    }

    const base = componentBase();

    function ensureCodeKeyEngine() {
        let script = document.getElementById(ENGINE_ID);
        if (script && script.dataset.loaded === 'true') return Promise.resolve(true);
        if (!script) {
            script = document.createElement('script');
            script.id = ENGINE_ID;
            script.src = base + 'admin-device.js?v=20260915-codekey1';
            script.defer = true;
            document.head.appendChild(script);
        }
        return new Promise(resolve => {
            if (script.dataset.loaded === 'true') { resolve(true); return; }
            script.addEventListener('load', function () {
                script.dataset.loaded = 'true';
                resolve(Boolean(window.HashcodAdmin && typeof window.HashcodAdmin.require === 'function'));
            }, { once: true });
            script.addEventListener('error', function () { resolve(false); }, { once: true });
        });
    }

    function renderState(button, authenticated) {
        const verified = authenticated === true;
        button.classList.toggle('is-verified', verified);
        button.dataset.verified = verified ? 'true' : 'false';
        button.title = verified ? 'CodeKey verificada. Pulsa para validar de nuevo.' : 'Cargar CodeKey Jupyter para administrar';
        if (button.id === 'topBarWindowsHelloBtn') {
            button.setAttribute('aria-label', verified ? 'CodeKey verificada. Pulsar para validar de nuevo.' : 'Increase the HVV · cargar CodeKey Jupyter');
            return;
        }
        const status = document.getElementById('adminHelloStatus');
        if (status && !button.disabled) {
            status.textContent = verified
                ? 'Administración habilitada. La CodeKey está activa durante 10 minutos.'
                : 'Carga la CodeKey Jupyter (.ipynb) para administrar.';
        }
    }

    function showTopbarMessage(message, kind) {
        if (window.CodespaceWS && typeof window.CodespaceWS.showToast === 'function') {
            window.CodespaceWS.showToast(message, kind || 'info');
            return;
        }
        const button = document.getElementById('topBarWindowsHelloBtn');
        if (button) button.title = message;
    }

    async function runVerification(button, status) {
        const ready = await ensureCodeKeyEngine();
        if (!ready) throw new Error('No se pudo cargar la verificación CodeKey. Recarga la página.');
        const verified = await window.HashcodAdmin.require({ force: true });
        renderState(button, verified === true);
        if (status) status.textContent = verified
            ? 'CodeKey verificada. Las herramientas protegidas están activas durante 10 minutos.'
            : 'No se validó el archivo. Pulsa para reintentar.';
        return verified;
    }

    function patchAdminButton() {
        const button = document.getElementById('adminHelloButton');
        if (!button) return false;

        const label = button.querySelector('span');
        const svg = button.querySelector('svg');
        if (svg) svg.outerHTML = ICON;
        else button.insertAdjacentHTML('afterbegin', ICON);
        if (label) label.textContent = 'Increase the HVV';
        else button.insertAdjacentHTML('beforeend', '<span>Increase the HVV</span>');
        button.setAttribute('aria-label', 'Increase the HVV · cargar CodeKey Jupyter');
        renderState(button, document.documentElement.dataset.adminAuthenticated === 'true');

        if (button.dataset.hashcodCodeKeyBound === 'true') return true;
        button.dataset.hashcodCodeKeyBound = 'true';

        button.addEventListener('click', async function (event) {
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            if (button.disabled) return;

            button.disabled = true;
            button.setAttribute('aria-busy', 'true');
            const status = document.getElementById('adminHelloStatus');
            if (status) status.textContent = 'Selecciona la CodeKey Jupyter autorizada…';

            try {
                await runVerification(button, status);
            } catch (error) {
                renderState(button, false);
                if (status) status.textContent = error && error.message ? error.message : 'No se pudo verificar la CodeKey.';
            } finally {
                button.disabled = false;
                button.removeAttribute('aria-busy');
            }
        }, true);
        return true;
    }

    function patchTopbarButton() {
        const button = document.getElementById('topBarWindowsHelloBtn');
        if (!button) return false;
        button.innerHTML = ICON_SMALL;
        renderState(button, document.documentElement.dataset.adminAuthenticated === 'true');
        if (button.dataset.hashcodCodeKeyBound === 'true') return true;
        button.dataset.hashcodCodeKeyBound = 'true';
        button.addEventListener('click', async function (event) {
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            if (button.disabled) return;
            button.disabled = true;
            button.setAttribute('aria-busy', 'true');
            showTopbarMessage('Selecciona la CodeKey Jupyter autorizada…', 'info');
            try {
                const verified = await runVerification(button, null);
                showTopbarMessage(verified ? 'CodeKey verificada. Administración habilitada.' : 'La CodeKey no pudo verificarse.', verified ? 'success' : 'error');
            } catch (error) {
                renderState(button, false);
                showTopbarMessage(error && error.message ? error.message : 'No se pudo verificar la CodeKey.', 'error');
            } finally {
                button.disabled = false;
                button.removeAttribute('aria-busy');
            }
        }, true);
        return true;
    }

    function patchAll() {
        patchAdminButton();
        patchTopbarButton();
    }

    window.addEventListener('hashcod:admin-auth', function (event) {
        const authenticated = Boolean(event.detail && event.detail.authenticated);
        const adminButton = document.getElementById('adminHelloButton');
        const topbarButton = document.getElementById('topBarWindowsHelloBtn');
        if (adminButton) renderState(adminButton, authenticated);
        if (topbarButton) renderState(topbarButton, authenticated);
    });

    patchAll();
    const observer = new MutationObserver(patchAll);
    observer.observe(document.documentElement, { childList: true, subtree: true });
    window.setTimeout(function () { observer.disconnect(); }, 60000);
})();
