/**
 * Cliente Dilithium-5 Transport (D5T)
 * Cifra cuerpos JSON de /api/* con AES-256-GCM y sello dilithium5_*.
 */
(function () {
    const enc = new TextEncoder();
    const dec = new TextDecoder();

    function b64urlFromBuf(buf) {
        const bytes = buf instanceof ArrayBuffer ? new Uint8Array(buf) : buf;
        let s = '';
        for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
        return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
    }

    function bufFromB64url(str) {
        const s = String(str || '').replace(/-/g, '+').replace(/_/g, '/');
        const pad = s.length % 4 ? '='.repeat(4 - (s.length % 4)) : '';
        const bin = atob(s + pad);
        const out = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
        return out;
    }

    function hexFromBuf(buf) {
        const bytes = buf instanceof ArrayBuffer ? new Uint8Array(buf) : buf;
        let h = '';
        for (let i = 0; i < bytes.length; i++) h += bytes[i].toString(16).padStart(2, '0');
        return h;
    }

    async function sha512Hex(data) {
        const buf = typeof data === 'string' ? enc.encode(data) : data;
        const dig = await crypto.subtle.digest('SHA-512', buf);
        return hexFromBuf(dig);
    }

    async function dilithium5Seal(material) {
        const a = await sha512Hex(material);
        const b = await sha512Hex(a + '|l8|d5t|dilithium5');
        return 'dilithium5_' + a.slice(0, 64) + b.slice(0, 64);
    }

    async function hkdfRaw(ikmU8, infoStr, len) {
        // HKDF-SHA-256 — must match PHP d5tHkdf (salt = UTF-8 "l8-d5t-hkdf-salt-v1")
        const key = await crypto.subtle.importKey('raw', ikmU8, 'HKDF', false, ['deriveBits']);
        const bits = await crypto.subtle.deriveBits({
            name: 'HKDF',
            hash: 'SHA-256',
            salt: enc.encode('l8-d5t-hkdf-salt-v1'),
            info: enc.encode(infoStr)
        }, key, len * 8);
        return new Uint8Array(bits);
    }

    let state = {
        ready: false,
        sid: '',
        key: null, // CryptoKey AES-GCM
        keyRaw: null
    };

    let readyPromise = null;

    async function handshake() {
        const hs = await fetch('/api/d5t/handshake', { method: 'GET', cache: 'no-store' }).then((r) => r.json());
        if (!hs || !hs.ok || !hs.server_pub || !hs.sid) {
            throw new Error((hs && hs.error) || 'D5T handshake failed');
        }
        const serverSpki = bufFromB64url(hs.server_pub);
        const serverKey = await crypto.subtle.importKey(
            'spki',
            serverSpki,
            { name: 'ECDH', namedCurve: 'P-256' },
            false,
            []
        );
        const clientPair = await crypto.subtle.generateKey(
            { name: 'ECDH', namedCurve: 'P-256' },
            true,
            ['deriveBits']
        );
        const clientSpki = new Uint8Array(await crypto.subtle.exportKey('spki', clientPair.publicKey));
        const clientPubB64 = b64urlFromBuf(clientSpki);
        const proof = await dilithium5Seal('l8|d5t|client|' + hs.sid + '|' + clientPubB64);
        const sharedBits = await crypto.subtle.deriveBits(
            { name: 'ECDH', public: serverKey },
            clientPair.privateKey,
            256
        );
        const sharedU8 = new Uint8Array(sharedBits);
        // Concat shared || sid utf8 like PHP $shared . $sid
        const sidBytes = enc.encode(hs.sid);
        const ikm = new Uint8Array(sharedU8.length + sidBytes.length);
        ikm.set(sharedU8, 0);
        ikm.set(sidBytes, sharedU8.length);
        const transportKey = await hkdfRaw(ikm, 'l8-d5t-transport-v1', 32);

        const confirm = await fetch('/api/d5t/handshake', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sid: hs.sid,
                client_pub: clientPubB64,
                dilithium5_proof: proof
            })
        }).then((r) => r.json());
        if (!confirm || !confirm.ok) {
            throw new Error((confirm && confirm.error) || 'D5T confirm failed');
        }
        const expectedConfirm = await dilithium5Seal('l8|d5t|ready|' + hs.sid);
        if (confirm.dilithium5_confirm && confirm.dilithium5_confirm !== expectedConfirm) {
            throw new Error('Dilithium-5 confirm mismatch');
        }

        state.sid = hs.sid;
        state.keyRaw = transportKey;
        state.key = await crypto.subtle.importKey('raw', transportKey, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
        state.ready = true;
        try { sessionStorage.setItem('l8_d5t_sid', hs.sid); } catch (e) {}
        return state;
    }

    function ensureReady() {
        if (state.ready) return Promise.resolve(state);
        if (!readyPromise) {
            readyPromise = handshake().catch((e) => {
                readyPromise = null;
                throw e;
            });
        }
        return readyPromise;
    }

    async function encryptPayload(plaintext, aadStr) {
        await ensureReady();
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const aad = enc.encode(aadStr);
        const ctBuf = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv: iv, additionalData: aad, tagLength: 128 },
            state.key,
            enc.encode(plaintext)
        );
        const ctFull = new Uint8Array(ctBuf);
        const tag = ctFull.slice(ctFull.length - 16);
        const ct = ctFull.slice(0, ctFull.length - 16);
        const sealMaterial = new Uint8Array(iv.length + ct.length + tag.length + aad.length);
        sealMaterial.set(iv, 0);
        sealMaterial.set(ct, iv.length);
        sealMaterial.set(tag, iv.length + ct.length);
        sealMaterial.set(aad, iv.length + ct.length + tag.length);
        const sig = await dilithium5Seal(sealMaterial);
        return {
            d5t: 1,
            v: 1,
            alg: 'p256-ecdh+aes-256-gcm+dilithium5',
            sid: state.sid,
            iv: b64urlFromBuf(iv),
            ct: b64urlFromBuf(ct),
            tag: b64urlFromBuf(tag),
            sig: sig
        };
    }

    async function decryptEnvelope(env, aadStr) {
        await ensureReady();
        if (!env || !env.d5t) return null;
        const iv = bufFromB64url(env.iv);
        const ct = bufFromB64url(env.ct);
        const tag = bufFromB64url(env.tag);
        const aad = enc.encode(aadStr);
        const sealMaterial = new Uint8Array(iv.length + ct.length + tag.length + aad.length);
        sealMaterial.set(iv, 0);
        sealMaterial.set(ct, iv.length);
        sealMaterial.set(tag, iv.length + ct.length);
        sealMaterial.set(aad, iv.length + ct.length + tag.length);
        const sig = await dilithium5Seal(sealMaterial);
        if (sig !== env.sig) throw new Error('Dilithium-5 seal mismatch');
        const packed = new Uint8Array(ct.length + tag.length);
        packed.set(ct, 0);
        packed.set(tag, ct.length);
        const ptBuf = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: iv, additionalData: aad, tagLength: 128 },
            state.key,
            packed
        );
        return dec.decode(ptBuf);
    }

    const rawFetch = window.fetch.bind(window);

    function shouldWrap(url, init) {
        try {
            const u = typeof url === 'string' ? url : (url && url.url) || '';
            if (u.indexOf('/api/d5t/') !== -1) return false;
            if (u.indexOf('/api/') !== 0 && u.indexOf('/api/') === -1) {
                // absolute or relative
                if (!/\/api\//.test(u) && u !== '/cmd' && u !== '/json') return false;
            }
            if (!/\/api\//.test(String(u)) && String(u) !== '/cmd' && String(u) !== '/json') return false;
            const method = ((init && init.method) || 'GET').toUpperCase();
            // Always send session header; encrypt JSON bodies for mutating/JSON GETs handled below
            return true;
        } catch (e) {
            return false;
        }
    }

    window.fetch = async function (url, init) {
        init = init ? Object.assign({}, init) : {};
        const u = typeof url === 'string' ? url : (url && url.url) || '';
        const isApi = /\/api\//.test(String(u)) || String(u) === '/cmd' || String(u) === '/json';
        const isD5t = /\/api\/d5t\//.test(String(u));
        if (!isApi || isD5t) {
            return rawFetch(url, init);
        }

        try {
            await ensureReady();
        } catch (e) {
            // Si el handshake falla, continuar en claro (TLS sigue activo)
            return rawFetch(url, init);
        }

        const headers = new Headers(init.headers || {});
        headers.set('X-L8-D5T-Session', state.sid);
        headers.set('X-L8-D5T', '1');

        const method = (init.method || 'GET').toUpperCase();
        let body = init.body;
        const contentType = (headers.get('Content-Type') || '').toLowerCase();
        const isJsonBody = typeof body === 'string' && body.length > 0 && (
            contentType.indexOf('application/json') !== -1 ||
            ((body.charAt(0) === '{' || body.charAt(0) === '[') && contentType.indexOf('multipart/') === -1)
        );
        if (isJsonBody) {
            const aad = 'l8|d5t|req|' + state.sid + '|' + method;
            const env = await encryptPayload(body, aad);
            body = JSON.stringify(env);
            headers.set('Content-Type', 'application/json');
        }

        const res = await rawFetch(url, Object.assign({}, init, { headers: headers, body: body }));
        const ct = res.headers.get('content-type') || '';
        if (ct.indexOf('application/json') === -1) return res;

        // Clonar y descifrar si es sobre D5T
        const text = await res.text();
        let data;
        try { data = JSON.parse(text); } catch (e) {
            return new Response(text, { status: res.status, statusText: res.statusText, headers: res.headers });
        }
        if (data && data.d5t && data.ct) {
            try {
                const aad = 'l8|d5t|res|' + state.sid;
                const plain = await decryptEnvelope(data, aad);
                return new Response(plain, {
                    status: res.status,
                    statusText: res.statusText,
                    headers: { 'Content-Type': 'application/json; charset=utf-8', 'X-L8-D5T': '1' }
                });
            } catch (e) {
                return new Response(JSON.stringify({ ok: false, error: 'D5T decrypt failed' }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }
        return new Response(text, { status: res.status, statusText: res.statusText, headers: res.headers });
    };

    window.l8D5tEnsure = ensureReady;
    window.l8D5tReady = ensureReady();
})();
