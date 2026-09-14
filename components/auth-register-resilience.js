(function () {
    'use strict';

    if (window.__hashcodAuthRegisterResilienceLoaded) return;
    window.__hashcodAuthRegisterResilienceLoaded = true;

    const REGISTER_PATH = '/api/auth/register';
    const REQUEST_TIMEOUT_MS = 20000;
    const state = {
        requestInFlight: false,
        lastRequestStartedAt: 0
    };

    function setMessage(text, ok) {
        const message = document.getElementById('authMsg');
        if (!message) return;
        message.textContent = text || '';
        message.classList.toggle('ok', Boolean(ok));
        message.setAttribute('role', 'status');
        message.setAttribute('aria-live', 'polite');
    }

    function setBusy(button, busy) {
        if (!button) return;
        button.disabled = Boolean(busy);
        button.setAttribute('aria-busy', busy ? 'true' : 'false');
        if (!busy) button.removeAttribute('aria-busy');
    }

    function resetRegisterTurnstile() {
        try {
            if (window.turnstileTokens) window.turnstileTokens.register = '';
            const container = document.getElementById('cfTurnstileRegister');
            if (window.turnstile && typeof window.turnstile.reset === 'function') {
                try {
                    window.turnstile.reset(container || undefined);
                } catch (error) {
                    try { window.turnstile.reset(); } catch (ignored) {}
                }
            }
        } catch (error) {}
    }

    function getRegisterTurnstileToken() {
        const globalToken = window.turnstileTokens && typeof window.turnstileTokens.register === 'string'
            ? window.turnstileTokens.register.trim()
            : '';
        if (globalToken) return globalToken;

        const container = document.getElementById('cfTurnstileRegister');
        if (container) {
            const hidden = container.querySelector('input[name="cf-turnstile-response"], textarea[name="cf-turnstile-response"]');
            if (hidden && String(hidden.value || '').trim()) return String(hidden.value).trim();
        }
        return '';
    }

    function isRegisterRequest(input) {
        let url = '';
        if (typeof input === 'string') url = input;
        else if (input && typeof input.url === 'string') url = input.url;
        if (!url) return false;
        try {
            const parsed = new URL(url, window.location.href);
            return parsed.pathname === REGISTER_PATH;
        } catch (error) {
            return url.indexOf(REGISTER_PATH) !== -1;
        }
    }

    function installFetchTimeout() {
        if (window.__hashcodOriginalFetchForRegister) return;
        const originalFetch = window.fetch.bind(window);
        window.__hashcodOriginalFetchForRegister = originalFetch;

        window.fetch = function hashcodFetch(input, init) {
            if (!isRegisterRequest(input)) return originalFetch(input, init);

            const options = Object.assign({}, init || {});
            const controller = new AbortController();
            const upstreamSignal = options.signal;
            let upstreamAbortHandler = null;

            if (upstreamSignal) {
                if (upstreamSignal.aborted) controller.abort(upstreamSignal.reason);
                else {
                    upstreamAbortHandler = function () { controller.abort(upstreamSignal.reason); };
                    upstreamSignal.addEventListener('abort', upstreamAbortHandler, { once: true });
                }
            }

            options.signal = controller.signal;
            state.requestInFlight = true;
            state.lastRequestStartedAt = Date.now();
            window.dispatchEvent(new CustomEvent('hashcod:auth-register-request-start'));

            const timeoutId = window.setTimeout(function () {
                controller.abort(new DOMException('Tiempo de espera agotado', 'TimeoutError'));
            }, REQUEST_TIMEOUT_MS);

            return originalFetch(input, options).finally(function () {
                window.clearTimeout(timeoutId);
                state.requestInFlight = false;
                if (upstreamSignal && upstreamAbortHandler) {
                    upstreamSignal.removeEventListener('abort', upstreamAbortHandler);
                }
                window.dispatchEvent(new CustomEvent('hashcod:auth-register-request-end'));
            });
        };
    }

    function renderKeyKit(data) {
        if (!data || !data.keys) return;
        const aes = document.getElementById('authKeyAesOut');
        const identity = document.getElementById('authKeyIdOut');
        const recovery = document.getElementById('authKeyRecoveryOut');
        const backups = document.getElementById('authKeyBackupsOut');
        const box = document.getElementById('authKeysBox');

        if (aes) aes.textContent = data.keys.aes256 || '';
        if (identity) identity.textContent = data.keys.identity || '';
        if (recovery) recovery.textContent = data.keys.recovery || '';
        if (backups) {
            const values = Array.isArray(data.keys.backup_codes) ? data.keys.backup_codes : [];
            backups.textContent = values.join('\n');
        }
        if (box) {
            box.style.display = 'block';
            box.hidden = false;
        }
    }

    async function fallbackRegister(button) {
        if (state.requestInFlight) return;

        const privacy = document.getElementById('authPrivacyCheckbox');
        if (!privacy || !privacy.checked) {
            setMessage('Debes marcar la casilla para aceptar la Política de Privacidad antes de registrarte.');
            if (privacy) privacy.focus();
            return;
        }

        const dilithiumInput = document.getElementById('authDilithiumInput');
        const dilithium = dilithiumInput ? String(dilithiumInput.value || '').trim() : '';
        if (!dilithium) {
            setMessage('Introduce la Dilithium-5 de registro del mes.');
            if (dilithiumInput) dilithiumInput.focus();
            return;
        }

        const cfToken = getRegisterTurnstileToken();
        if (!cfToken) {
            setMessage('Cloudflare todavía no ha terminado la verificación. Espera la marca verde y vuelve a pulsar Crear cuenta.');
            return;
        }

        if (window.turnstileTokens) window.turnstileTokens.register = '';
        setBusy(button, true);
        setMessage('Creando cuenta…');

        try {
            const response = await window.fetch(REGISTER_PATH, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    dilithium5: dilithium,
                    cf_turnstile_response: cfToken,
                    privacy_accepted: true,
                    checkout_accepted: true
                })
            });

            const raw = await response.text();
            let data = null;
            try {
                data = raw ? JSON.parse(raw) : null;
            } catch (error) {
                throw new Error('El servidor respondió en un formato no válido.');
            }

            if (!response.ok || !data || !data.ok) {
                resetRegisterTurnstile();
                setMessage((data && data.error) || 'No se pudo crear la cuenta. Inténtalo de nuevo.');
                return;
            }

            renderKeyKit(data);
            if (typeof window.consumeAndRotateDilithiumKey === 'function') {
                try { window.consumeAndRotateDilithiumKey(dilithium); } catch (error) {}
            }
            setMessage(data.warning || 'Cuenta creada correctamente. Guarda tus credenciales antes de continuar.', true);
            window.dispatchEvent(new CustomEvent('hashcod:auth-register-success', { detail: data }));
        } catch (error) {
            resetRegisterTurnstile();
            const timedOut = error && (error.name === 'AbortError' || error.name === 'TimeoutError');
            setMessage(timedOut
                ? 'La creación de la cuenta tardó demasiado y se canceló para evitar que la pantalla quede congelada. Vuelve a intentarlo.'
                : 'No se pudo completar el registro. Revisa la conexión y vuelve a intentarlo.');
        } finally {
            setBusy(button, false);
        }
    }

    function bindRegisterWatchdog() {
        document.addEventListener('click', function (event) {
            const button = event.target && event.target.closest ? event.target.closest('#authRegisterBtn') : null;
            if (!button) return;

            const message = document.getElementById('authMsg');
            const previousMessage = message ? message.textContent : '';
            const beforeRequestStart = state.lastRequestStartedAt;

            window.setTimeout(function () {
                const requestStarted = state.requestInFlight || state.lastRequestStartedAt !== beforeRequestStart;
                const messageChanged = message && message.textContent !== previousMessage;
                if (requestStarted || button.disabled || messageChanged) return;
                fallbackRegister(button);
            }, 350);

            window.setTimeout(function () {
                if (!button.disabled || !state.requestInFlight) return;
                setBusy(button, false);
                setMessage('La solicitud sigue sin responder. Puedes volver a pulsar Crear cuenta; la pantalla ya no quedará bloqueada.');
            }, REQUEST_TIMEOUT_MS + 1500);
        }, true);
    }

    installFetchTimeout();
    bindRegisterWatchdog();
})();