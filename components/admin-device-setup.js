'use strict';
(() => {
    const rpId = 'hashcodcodespace.dev';
    const button = document.getElementById('enroll');
    const status = document.getElementById('status');
    const encode = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    button.addEventListener('click', async () => {
        button.disabled = true;
        status.textContent = 'Confirma en Windows Hello. No introduzcas tu PIN en esta página.';
        try {
            if (location.origin !== 'https://' + rpId || !window.PublicKeyCredential || !window.isSecureContext) {
                throw new Error('Abre esta página en Chrome o Edge desde la dirección oficial de la plataforma.');
            }
            if (!await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()) {
                throw new Error('No se detectó Windows Hello. Configura un PIN o huella de Windows en esta laptop y vuelve a intentarlo.');
            }
            const challenge = crypto.getRandomValues(new Uint8Array(32));
            const credential = await navigator.credentials.create({ publicKey: {
                rp: { id: rpId, name: 'Hashcod · Administración de esta laptop' },
                user: { id: crypto.getRandomValues(new Uint8Array(32)), name: 'administrador-laptop', displayName: 'Laptop de administración' },
                challenge,
                pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
                authenticatorSelection: { authenticatorAttachment: 'platform', residentKey: 'discouraged', userVerification: 'required' },
                attestation: 'none', timeout: 120000
            }});
            if (!credential || credential.authenticatorAttachment !== 'platform') throw new Error('Selecciona Windows Hello en este dispositivo.');
            const response = credential.response;
            if (!response.getPublicKey || !response.getAuthenticatorData) throw new Error('Actualiza Chrome o Edge para registrar la credencial.');
            const key = response.getPublicKey();
            const authData = new Uint8Array(response.getAuthenticatorData());
            if (!key || response.getPublicKeyAlgorithm() !== -7 || authData.length < 55) throw new Error('La credencial recibida no tiene el formato esperado.');
            const flags = authData[32];
            if ((flags & 5) !== 5 || !(flags & 64) || (flags & 24)) {
                throw new Error('Se requiere una credencial local del equipo, con verificación de usuario y sin sincronización en la nube. Selecciona Windows Hello.');
            }
            const client = JSON.parse(new TextDecoder().decode(response.clientDataJSON));
            if (client.type !== 'webauthn.create' || client.origin !== location.origin || client.challenge !== encode(challenge) || client.crossOrigin === true) {
                throw new Error('No se pudo comprobar el origen del registro.');
            }
            const expectedRp = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(rpId)));
            if (!expectedRp.every((v, i) => authData[i] === v)) throw new Error('La credencial pertenece a otro sitio.');
            const idLength = (authData[53] << 8) | authData[54];
            if (!idLength || encode(authData.slice(55, 55 + idLength)) !== encode(credential.rawId)) throw new Error('Identificador de credencial inconsistente.');
            const candidate = { version: 1, rpId, origin: location.origin, credentialId: encode(credential.rawId), publicKeySpki: encode(key), algorithm: 'ES256', backupEligible: false };
            // Export only public material. Activation requires an operator to pin
            // this exact key; registration on this page grants no server rights.
            document.getElementById('credential').value = JSON.stringify(candidate, null, 2);
            document.getElementById('result').hidden = false;
            status.textContent = 'Clave pública lista. Falta vincularla y comprobar el acceso en el servidor.';
        } catch (error) {
            status.textContent = error.name === 'NotAllowedError' ? 'Registro cancelado o agotado. Puedes volver a intentarlo.' : error.message;
        } finally { button.disabled = false; }
    });
    document.getElementById('copy').addEventListener('click', async () => {
        const field = document.getElementById('credential');
        try { await navigator.clipboard.writeText(field.value); status.textContent = 'Clave pública copiada. Pégala en esta conversación.'; }
        catch { field.focus(); field.select(); status.textContent = 'Selecciona y copia la clave pública para compartirla en esta conversación.'; }
    });
})();
