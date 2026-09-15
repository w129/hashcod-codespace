(function () {
    'use strict';

    (function loadDilithiumOneTimeKeyTool() {
        const current = document.currentScript;
        const currentSrc = current && current.src ? current.src : '';
        const componentBase = currentSrc && currentSrc.lastIndexOf('/') >= 0
            ? currentSrc.slice(0, currentSrc.lastIndexOf('/') + 1)
            : '/components/';

        if (!document.getElementById('dilithiumOneTimeKeyStylesheet')) {
            const link = document.createElement('link');
            link.id = 'dilithiumOneTimeKeyStylesheet';
            link.rel = 'stylesheet';
            link.href = componentBase + 'dilithium-one-time-key.css?v=20260910-2';
            document.head.appendChild(link);
        }
        if (!document.querySelector('script[data-dilithium-one-time-key]')) {
            const script = document.createElement('script');
            script.src = componentBase + 'dilithium-one-time-key.js?v=20260910-3';
            script.defer = true;
            script.dataset.dilithiumOneTimeKey = 'true';
            document.head.appendChild(script);
        }
    })();

    let pending = null;
    let pendingForced = false;
    let expiry = null;
    const base = '/api/admin-device/';
    const MAX_NOTEBOOK_BYTES = 256 * 1024;

    const CODEKEY_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 256 256" aria-hidden="true" focusable="false"><g fill="none" fill-rule="nonzero" stroke="none" stroke-width="1" stroke-linecap="butt" stroke-linejoin="miter" stroke-miterlimit="10" stroke-dasharray="" stroke-dashoffset="0" font-family="none" font-weight="none" font-size="none" text-anchor="none" style="mix-blend-mode:normal"><g transform="scale(5.33333,5.33333)"><path d="M33.5,10c-7.456,0 -13.5,6.044 -13.5,13.5c0,7.456 6.044,13.5 13.5,13.5c7.456,0 13.5,-6.044 13.5,-13.5c0,-7.456 -6.044,-13.5 -13.5,-13.5zM33.5,30c-3.59,0 -6.5,-2.91 -6.5,-6.5c0,-3.59 2.91,-6.5 6.5,-6.5c3.59,0 6.5,2.91 6.5,6.5c0,3.59 -2.91,6.5 -6.5,6.5z" fill="#000000"></path><path d="M19.14,28.051v-0.003c-1.18,1.204 -2.822,1.952 -4.64,1.952c-3.59,0 -6.5,-2.91 -6.5,-6.5c0,-3.59 2.91,-6.5 6.5,-6.5c1.83,0 3.481,0.759 4.662,1.976l3.75,-6.024c-2.308,-1.843 -5.229,-2.952 -8.412,-2.952c-7.456,0 -13.5,6.044 -13.5,13.5c0,7.456 6.044,13.5 13.5,13.5c3.164,0 6.067,-1.097 8.369,-2.919z" fill="#000000"></path><path d="M8,23.5c0,-1.787 0.722,-3.405 1.889,-4.58l-4.855,-5.038c-2.488,2.448 -4.034,5.851 -4.034,9.618c0,3.749 1.53,7.14 3.998,9.586l4.934,-4.964c-1.192,-1.178 -1.932,-2.813 -1.932,-4.622z" fill="#262626"></path><path d="M38.13,18.941c1.155,1.173 1.87,2.782 1.87,4.559c0,3.59 -2.91,6.5 -6.5,6.5c-1.826,0 -3.474,-0.755 -4.655,-1.968l-4.999,4.895c2.452,2.51 5.868,4.073 9.654,4.073c7.456,0 13.5,-6.044 13.5,-13.5c0,-3.684 -1.479,-7.019 -3.871,-9.455z" fill="#262626"></path></g></g></svg>';

    function setToolsState(authenticated) {
        const enabled = authenticated === true;
        document.documentElement.dataset.adminAuthenticated = enabled ? 'true' : 'false';
        if (typeof window.dispatchEvent === 'function' && typeof window.CustomEvent === 'function') {
            window.dispatchEvent(new window.CustomEvent('hashcod:admin-auth', {
                detail: { authenticated: enabled }
            }));
        }
    }

    async function request(route, body) {
        const response = await fetch(base + route, {
            method: body === undefined ? 'GET' : 'POST',
            credentials: 'same-origin',
            cache: 'no-store',
            headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
            body: body === undefined ? undefined : JSON.stringify(body)
        });
        const data = await response.json();
        if (!response.ok || !data.ok) throw new Error(data.error || 'No se pudo verificar el acceso administrativo.');
        return data;
    }

    function closeTools() {
        setToolsState(false);
        const verificationStatus = document.getElementById('adminHelloStatus');
        if (verificationStatus) verificationStatus.textContent = 'Carga la CodeKey Jupyter (.ipynb) para administrar.';
        ['cryptoCardValidationModalOverlay', 'dilithiumGeneratorModal', 'dilithiumGateModal', 'd5OneTimeKeyModal', 'adminDilithiumGateOverlay', 'adminGateOverlay'].forEach(id => {
            const el = document.getElementById(id);
            if (el) { el.style.display = 'none'; el.classList.remove('open', 'is-open'); }
        });
        if (typeof window.toggleAdminPanel === 'function') window.toggleAdminPanel(false);
        sessionStorage.removeItem('l8_admin_authenticated');
    }

    function updateLegacyHelloUi() {
        const button = document.getElementById('adminHelloButton');
        if (!button) return;
        const label = button.querySelector('span');
        const svg = button.querySelector('svg');
        if (svg) svg.outerHTML = CODEKEY_ICON;
        if (label) label.textContent = 'Increase the HVV';
        button.title = 'Cargar CodeKey Jupyter para administrar';
        button.setAttribute('aria-label', 'Increase the HVV · cargar CodeKey Jupyter');
        const status = document.getElementById('adminHelloStatus');
        if (status && document.documentElement.dataset.adminAuthenticated !== 'true') {
            status.textContent = 'Carga la CodeKey Jupyter (.ipynb) para administrar.';
        }
    }

    function pickCodeKeyFile() {
        return new Promise(resolve => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.ipynb,application/json,application/x-ipynb+json';
            input.hidden = true;
            input.setAttribute('aria-hidden', 'true');
            document.body.appendChild(input);

            let settled = false;
            function finish(file) {
                if (settled) return;
                settled = true;
                input.remove();
                resolve(file || null);
            }

            input.addEventListener('change', function () {
                finish(input.files && input.files[0] ? input.files[0] : null);
            }, { once: true });
            input.addEventListener('cancel', function () { finish(null); }, { once: true });

            const focusFallback = function () {
                window.setTimeout(function () {
                    if (!settled && (!input.files || input.files.length === 0)) finish(null);
                }, 400);
            };
            window.addEventListener('focus', focusFallback, { once: true });
            input.click();
        });
    }

    async function readNotebook(file) {
        if (!file) throw new Error('Selecciona tu archivo CodeKey .ipynb.');
        if (!/\.ipynb$/i.test(file.name || '')) throw new Error('La CodeKey debe ser un archivo .ipynb.');
        if (!Number.isFinite(file.size) || file.size <= 0 || file.size > MAX_NOTEBOOK_BYTES) {
            throw new Error('El archivo CodeKey no tiene un tamaño válido.');
        }
        const text = await file.text();
        let notebook;
        try {
            notebook = JSON.parse(text);
        } catch (error) {
            throw new Error('El archivo seleccionado no es un notebook Jupyter válido.');
        }
        if (!notebook || typeof notebook !== 'object' || Array.isArray(notebook)) {
            throw new Error('El archivo seleccionado no es un notebook Jupyter válido.');
        }
        return notebook;
    }

    async function authenticate(force = false, suppliedFile = null) {
        const status = await request('status');
        document.documentElement.dataset.adminIp = status.ipAllowed ? 'allowed' : 'denied';
        if (!status.ipAllowed) {
            throw new Error('Administración disponible únicamente desde la red 38.196.115.0–38.196.115.255 y con la CodeKey Jupyter autorizada.');
        }
        if (status.authenticated && !force) {
            setToolsState(true);
            return true;
        }

        const file = suppliedFile || await pickCodeKeyFile();
        if (!file) return false;
        const notebook = await readNotebook(file);
        const result = await request('verify', { filename: file.name, notebook });

        setToolsState(true);
        clearTimeout(expiry);
        if (result.expiresIn > 0) expiry = setTimeout(closeTools, result.expiresIn * 1000);
        return true;
    }

    window.HashcodAdmin = Object.freeze({
        require: async function (options = {}) {
            const force = options.force === true;
            const suppliedFile = options.file || null;
            if (pending && force && !pendingForced) {
                await pending;
                return window.HashcodAdmin.require(options);
            }
            if (!pending) {
                pendingForced = force;
                pending = authenticate(force, suppliedFile).catch(error => {
                    closeTools();
                    alert(error && error.message ? error.message : 'No se pudo verificar la CodeKey Jupyter.');
                    return false;
                }).finally(() => {
                    pending = null;
                    pendingForced = false;
                });
            }
            return pending;
        },
        logout: async function () {
            try { await request('logout', {}); } finally { closeTools(); }
        }
    });

    updateLegacyHelloUi();
    new MutationObserver(updateLegacyHelloUi).observe(document.documentElement, { childList: true, subtree: true });

    request('status').then(status => {
        document.documentElement.dataset.adminIp = status.ipAllowed ? 'allowed' : 'denied';
        if (status.ipAllowed && status.authenticated) setToolsState(true);
        else closeTools();
        updateLegacyHelloUi();
    }).catch(() => {
        document.documentElement.dataset.adminIp = 'denied';
        closeTools();
        updateLegacyHelloUi();
    });
})();
