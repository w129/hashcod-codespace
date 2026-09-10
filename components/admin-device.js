(function () {
    'use strict';

    // Replacement for the legacy Dilithium generator: black one-time registration
    // key tool. Loaded here because this module already owns the admin-only tools.
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
            link.href = componentBase + 'dilithium-one-time-key.css?v=20260910-1';
            document.head.appendChild(link);
        }
        if (!document.querySelector('script[data-dilithium-one-time-key]')) {
            const script = document.createElement('script');
            script.src = componentBase + 'dilithium-one-time-key.js?v=20260910-1';
            script.defer = true;
            script.dataset.dilithiumOneTimeKey = 'true';
            document.head.appendChild(script);
        }
    })();

    let pending = null;
    let pendingForced = false;
    let expiry = null;
    const base = '/api/admin-device/';
    const decode = value => Uint8Array.from(atob(value.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
    const encode = value => btoa(String.fromCharCode(...new Uint8Array(value))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    function setToolsState(authenticated) {
        const enabled = authenticated === true;
        document.documentElement.dataset.adminAuthenticated = enabled ? 'true' : 'false';
        if (typeof window.dispatchEvent === 'function' && typeof window.CustomEvent === 'function') {
            window.dispatchEvent(new window.CustomEvent('hashcod:admin-auth', {
                detail: {authenticated: enabled}
            }));
        }
    }

    async function request(route, body) {
        const response = await fetch(base + route, {
            method: body === undefined ? 'GET' : 'POST', credentials: 'same-origin', cache: 'no-store',
            headers: body === undefined ? {} : {'Content-Type': 'application/json'},
            body: body === undefined ? undefined : JSON.stringify(body)
        });
        const data = await response.json();
        if (!response.ok || !data.ok) throw new Error(data.error || 'No se pudo verificar el acceso administrativo.');
        return data;
    }

    function closeTools() {
        setToolsState(false);
        const verificationStatus = document.getElementById('adminHelloStatus');
        if (verificationStatus) verificationStatus.textContent = 'Verifica esta laptop para administrar.';
        ['cryptoCardValidationModalOverlay', 'dilithiumGeneratorModal', 'dilithiumGateModal', 'd5OneTimeKeyModal', 'adminDilithiumGateOverlay', 'adminGateOverlay'].forEach(id => {
            const el = document.getElementById(id);
            if (el) { el.style.display = 'none'; el.classList.remove('open', 'is-open'); }
        });
        if (typeof window.toggleAdminPanel === 'function') window.toggleAdminPanel(false);
        sessionStorage.removeItem('l8_admin_authenticated');
    }

    async function authenticate(force = false) {
        const status = await request('status');
        document.documentElement.dataset.adminIp = status.ipAllowed ? 'allowed' : 'denied';
        if (!status.ipAllowed) throw new Error('Administración disponible únicamente desde la red 38.196.115.0–38.196.115.255 y con Windows Hello de la laptop registrada.');
        if (status.authenticated && !force) {
            setToolsState(true);
            return true;
        }
        if (!window.PublicKeyCredential || !navigator.credentials) throw new Error('Abre esta plataforma en Chrome o Edge en la laptop registrada para usar Windows Hello.');
        const options = await request('challenge', {});
        const credential = await navigator.credentials.get({publicKey: {
            challenge: decode(options.challenge), rpId: options.rpId,
            allowCredentials: [{type: 'public-key', id: decode(options.credentialId), transports: ['internal']}],
            userVerification: 'required', timeout: 120000
        }});
        if (!credential) throw new Error('No se confirmó Windows Hello.');
        const result = await request('verify', {
            id: credential.id, type: credential.type,
            clientDataJSON: encode(credential.response.clientDataJSON),
            authenticatorData: encode(credential.response.authenticatorData),
            signature: encode(credential.response.signature)
        });
        setToolsState(true);
        clearTimeout(expiry);
        expiry = setTimeout(closeTools, result.expiresIn * 1000);
        return true;
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
                    alert(error.name === 'NotAllowedError' ? 'Windows Hello no se completó. Usa la laptop registrada y confirma con tu PIN o huella.' : error.message);
                    return false;
                }).finally(() => {
                    pending = null;
                    pendingForced = false;
                });
            }
            return pending;
        },
        logout: async function () { try { await request('logout', {}); } finally { closeTools(); } }
    });

    request('status').then(status => {
        document.documentElement.dataset.adminIp = status.ipAllowed ? 'allowed' : 'denied';
        if (status.ipAllowed && status.authenticated) setToolsState(true);
        else closeTools();
    }).catch(() => {
        document.documentElement.dataset.adminIp = 'denied';
        closeTools();
    });
})();
