(function () {
    'use strict';

    // Admin-only utilities remain loaded from the same place; only the
    // authorization ceremony changes from WebAuthn to the registered CodeKey notebook.
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

    const base = '/api/admin-device/';
    const expectedFilename = 'OnIPFeJKssih4mbNLCYXnct6a1L_q84po-KVfKPZInHYbhNJ8OR2n3M2zFJ2zZeK9bqkcmilS1li-3DrTsaUIg.ipynb';
    function codeKeyFilenameAllowed(name) {
        const value = String(name || '');
        if (value === expectedFilename) return true;
        return value.replace(/\s*\(\d+\)(?=\.ipynb$)/i, '') === expectedFilename;
    }
    const CODEKEY_ICON = '<svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="32" height="32" viewBox="0,0,256,256" aria-hidden="true"><g fill="none" fill-rule="nonzero" stroke="none" stroke-width="1" stroke-linecap="butt" stroke-linejoin="miter" stroke-miterlimit="10" stroke-dasharray="" stroke-dashoffset="0" font-family="none" font-weight="none" font-size="none" text-anchor="none" style="mix-blend-mode: normal"><g transform="scale(5.33333,5.33333)"><path d="M33.5,10c-7.456,0 -13.5,6.044 -13.5,13.5c0,7.456 6.044,13.5 13.5,13.5c7.456,0 13.5,-6.044 13.5,-13.5c0,-7.456 -6.044,-13.5 -13.5,-13.5zM33.5,30c-3.59,0 -6.5,-2.91 -6.5,-6.5c0,-3.59 2.91,-6.5 6.5,-6.5c3.59,0 6.5,2.91 6.5,6.5c0,3.59 -2.91,6.5 -6.5,6.5z" fill="#000000"></path><path d="M19.14,28.051v-0.003c-1.18,1.204 -2.822,1.952 -4.64,1.952c-3.59,0 -6.5,-2.91 -6.5,-6.5c0,-3.59 2.91,-6.5 6.5,-6.5c1.83,0 3.481,0.759 4.662,1.976l3.75,-6.024c-2.308,-1.843 -5.229,-2.952 -8.412,-2.952c-7.456,0 -13.5,6.044 -13.5,13.5c0,7.456 6.044,13.5 13.5,13.5c3.164,0 6.067,-1.097 8.369,-2.919z" fill="#000000"></path><path d="M8,23.5c0,-1.787 0.722,-3.405 1.889,-4.58l-4.855,-5.038c-2.488,2.448 -4.034,5.851 -4.034,9.618c0,3.749 1.53,7.14 3.998,9.586l4.934,-4.964c-1.192,-1.178 -1.932,-2.813 -1.932,-4.622z" fill="#262626"></path><path d="M38.13,18.941c1.155,1.173 1.87,2.782 1.87,4.559c0,3.59 -2.91,6.5 -6.5,6.5c-1.826,0 -3.474,-0.755 -4.655,-1.968l-4.999,4.895c2.452,2.51 5.868,4.073 9.654,4.073c7.456,0 13.5,-6.044 13.5,-13.5c0,-3.684 -1.479,-7.019 -3.871,-9.455z" fill="#262626"></path></g></g></svg>';

    let pending = null;
    let pendingForced = false;
    let expiry = null;
    let fileInput = null;

    function setToolsState(authenticated) {
        const enabled = authenticated === true;
        document.documentElement.dataset.adminAuthenticated = enabled ? 'true' : 'false';
        if (typeof window.dispatchEvent === 'function' && typeof window.CustomEvent === 'function') {
            window.dispatchEvent(new window.CustomEvent('hashcod:admin-auth', {detail: {authenticated: enabled}}));
        }
    }

    async function request(route, body) {
        const response = await fetch(base + route, {
            method: body === undefined ? 'GET' : 'POST',
            credentials: 'same-origin',
            cache: 'no-store',
            headers: body === undefined ? {} : {'Content-Type': 'application/json'},
            body: body === undefined ? undefined : JSON.stringify(body)
        });
        const data = await response.json();
        if (!response.ok || !data.ok) throw new Error(data.error || 'No se pudo verificar el acceso administrativo.');
        return data;
    }

    function statusElement() { return document.getElementById('adminHelloStatus'); }

    function setStatus(message) {
        const status = statusElement();
        if (status) status.textContent = message;
    }

    function closeTools() {
        setToolsState(false);
        setStatus('Carga la CodeKey .ipynb para administrar.');
        ['cryptoCardValidationModalOverlay', 'dilithiumGeneratorModal', 'dilithiumGateModal', 'd5OneTimeKeyModal', 'adminDilithiumGateOverlay', 'adminGateOverlay'].forEach(id => {
            const el = document.getElementById(id);
            if (el) { el.style.display = 'none'; el.classList.remove('open', 'is-open'); }
        });
        if (typeof window.toggleAdminPanel === 'function') window.toggleAdminPanel(false);
        sessionStorage.removeItem('l8_admin_authenticated');
    }

    function ensureFileInput() {
        if (fileInput && fileInput.isConnected) return fileInput;
        fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.ipynb,application/json';
        fileInput.hidden = true;
        fileInput.id = 'hashcodAdminCodeKeyFile';
        (document.body || document.documentElement).appendChild(fileInput);
        return fileInput;
    }

    function pickNotebook() {
        const input = ensureFileInput();
        input.value = '';
        return new Promise(resolve => {
            let settled = false;
            const finish = value => {
                if (settled) return;
                settled = true;
                resolve(value);
            };
            input.addEventListener('change', () => finish(input.files && input.files[0] ? input.files[0] : null), {once: true});
            input.addEventListener('cancel', () => finish(null), {once: true});
            input.click();
        });
    }

    async function verifyNotebook(file) {
        if (!file) throw new Error('Selecciona el archivo CodeKey para continuar.');
        if (!codeKeyFilenameAllowed(file.name)) throw new Error('El nombre del archivo CodeKey no coincide con el registrado.');
        if (file.size <= 0 || file.size > 131072) throw new Error('El archivo CodeKey tiene un tamaño no permitido.');
        const notebook = await file.text();
        const result = await request('verify', {filename: file.name, notebook});
        setToolsState(true);
        clearTimeout(expiry);
        if (result.expiresIn > 0) expiry = setTimeout(closeTools, result.expiresIn * 1000);
        return true;
    }

    async function authenticate(force = false) {
        if (document.documentElement.dataset.adminAuthenticated === 'true' && !force) {
            return true;
        }

        // The file chooser must be opened synchronously from the user's click.
        // Waiting on a network request first causes browsers to drop the user-activation
        // permission and the chooser may never appear.
        const file = await pickNotebook();
        if (!file) return false;

        const status = await request('status');
        document.documentElement.dataset.adminIp = status.ipAllowed ? 'allowed' : 'denied';
        if (!status.ipAllowed) throw new Error('Administración disponible únicamente desde la red 38.196.115.0–38.196.115.255 y con la CodeKey registrada.');
        if (status.authenticated && !force) {
            setToolsState(true);
            return true;
        }

        setStatus('Verificando CODEKEY1 + JUPYTER1 + HASHCOD1…');
        return verifyNotebook(file);
    }

    function renderButtonState(authenticated) {
        const button = document.getElementById('adminHelloButton');
        if (!button) return;
        const verified = authenticated === true;
        button.classList.toggle('is-verified', verified);
        button.dataset.verified = verified ? 'true' : 'false';
        button.title = verified ? 'CodeKey verificada. Pulsa para verificar otro archivo.' : 'Seleccionar CodeKey Jupyter para administrar';
        const label = button.querySelector('span');
        if (label) label.textContent = verified ? 'Increase the HVV · Verified' : 'Increase the HVV';
    }

    function installCodeKeyButton() {
        const original = document.getElementById('adminHelloButton');
        if (!original || original.dataset.codekeyBound === 'true') return;
        const button = original.cloneNode(false);
        button.id = 'adminHelloButton';
        button.dataset.codekeyBound = 'true';
        button.setAttribute('aria-describedby', 'adminHelloStatus');
        button.title = 'Seleccionar CodeKey Jupyter para administrar';
        button.innerHTML = CODEKEY_ICON + '<span>Increase the HVV</span>';
        original.replaceWith(button);
        setStatus('Carga la CodeKey .ipynb para administrar.');
        renderButtonState(document.documentElement.dataset.adminAuthenticated === 'true');
        button.addEventListener('click', async () => {
            button.disabled = true;
            button.setAttribute('aria-busy', 'true');
            setStatus('Selecciona la CodeKey registrada…');
            try {
                const verified = await window.HashcodAdmin.require({force: true});
                renderButtonState(verified);
                setStatus(verified
                    ? 'CodeKey verificada. Administración habilitada durante 10 minutos.'
                    : 'No se seleccionó una CodeKey.');
            } catch (error) {
                renderButtonState(false);
                setStatus(error.message || 'No se pudo verificar la CodeKey.');
            } finally {
                button.disabled = false;
                button.removeAttribute('aria-busy');
            }
        });
    }

    window.HashcodAdmin = Object.freeze({
        require: async function (options = {}) {
            const force = options.force === true;
            if (pending && force && !pendingForced) {
                await pending;
                return window.HashcodAdmin.require(options);
            }
            if (!pending) {
                pendingForced = force;
                pending = authenticate(force).catch(error => {
                    closeTools();
                    setStatus(error.message || 'No se pudo verificar la CodeKey.');
                    return false;
                }).finally(() => {
                    pending = null;
                    pendingForced = false;
                });
            }
            return pending;
        },
        verifyNotebook,
        logout: async function () { try { await request('logout', {}); } finally { closeTools(); renderButtonState(false); } }
    });

    installCodeKeyButton();
    if (typeof MutationObserver === 'function') {
        new MutationObserver(installCodeKeyButton).observe(document.documentElement, {childList: true, subtree: true});
    }
    window.addEventListener('hashcod:admin-auth', event => renderButtonState(Boolean(event.detail && event.detail.authenticated)));

    request('status').then(status => {
        document.documentElement.dataset.adminIp = status.ipAllowed ? 'allowed' : 'denied';
        if (status.ipAllowed && status.authenticated) setToolsState(true);
        else closeTools();
        installCodeKeyButton();
    }).catch(() => {
        document.documentElement.dataset.adminIp = 'denied';
        closeTools();
        installCodeKeyButton();
    });
})();
