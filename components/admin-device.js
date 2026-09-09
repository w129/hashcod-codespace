(function () {
    'use strict';
    let pending = null;
    let expiry = null;
    const base = '/api/admin-device/';
    const decode = value => Uint8Array.from(atob(value.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
    const encode = value => btoa(String.fromCharCode(...new Uint8Array(value))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
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
        const verificationStatus = document.getElementById('adminHelloStatus');
        if (verificationStatus) verificationStatus.textContent = 'Verifica esta laptop para administrar.';
        ['cryptoCardValidationModalOverlay', 'dilithiumGeneratorModal', 'dilithiumGateModal', 'adminDilithiumGateOverlay', 'adminGateOverlay'].forEach(id => {
            const el = document.getElementById(id);
            if (el) { el.style.display = 'none'; el.classList.remove('open'); }
        });
        if (typeof window.toggleAdminPanel === 'function') window.toggleAdminPanel(false);
        sessionStorage.removeItem('l8_admin_authenticated');
    }
    async function authenticate(force = false) {
        const status = await request('status');
        document.documentElement.dataset.adminIp = status.ipAllowed ? 'allowed' : 'denied';
        if (!status.ipAllowed) throw new Error('Administración disponible únicamente desde la red 38.196.115.0–38.196.115.255 y con Windows Hello de la laptop registrada.');
        if (status.authenticated && !force) return true;
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
        clearTimeout(expiry);
        expiry = setTimeout(closeTools, result.expiresIn * 1000);
        return true;
    }
    window.HashcodAdmin = Object.freeze({
        require: async function (options = {}) {
            if (!pending) pending = authenticate(options.force === true).catch(error => {
                closeTools();
                alert(error.name === 'NotAllowedError' ? 'Windows Hello no se completó. Usa la laptop registrada y confirma con tu PIN o huella.' : error.message);
                return false;
            }).finally(() => { pending = null; });
            return pending;
        },
        logout: async function () { try { await request('logout', {}); } finally { closeTools(); } }
    });
    request('status').then(status => {
        document.documentElement.dataset.adminIp = status.ipAllowed ? 'allowed' : 'denied';
        if (!status.authenticated) closeTools();
    }).catch(() => { document.documentElement.dataset.adminIp = 'denied'; closeTools(); });
})();
