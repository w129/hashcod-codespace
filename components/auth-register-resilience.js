(function () {
    'use strict';

    if (window.__hashcodAuthRegisterResilienceLoaded) return;
    window.__hashcodAuthRegisterResilienceLoaded = true;

    const REGISTER_PATH = '/api/auth/register';
    const REQUEST_TIMEOUT_MS = 20000;
    const AUTH_TOKEN_KEY = 'l8_auth_token';
    const AUTH_ACCOUNT_KEY = 'l8_auth_account';
    const state = {
        requestInFlight: false,
        lastRequestStartedAt: 0,
        registeredSessionToken: '',
        registeredAccountId: '',
        registeredKeysText: ''
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

    function buildKeyKitText(data) {
        const keys = data && data.keys ? data.keys : {};
        const backups = Array.isArray(keys.backup_codes) ? keys.backup_codes : [];
        return [
            'AES-256:', keys.aes256 || '', '',
            'L8ID:', keys.identity || '', '',
            'L8REC (recuperación):', keys.recovery || '', '',
            'Códigos de respaldo:', backups.join('\n')
        ].join('\n');
    }

    function setOutputText(ids, value) {
        for (let i = 0; i < ids.length; i += 1) {
            const node = document.getElementById(ids[i]);
            if (node) {
                node.textContent = value || '';
                return node;
            }
        }
        return null;
    }

    function renderKeyKit(data) {
        if (!data || !data.keys) return;
        const values = Array.isArray(data.keys.backup_codes) ? data.keys.backup_codes : [];
        const box = document.getElementById('authKeysBox');

        setOutputText(['authKeyAesOut'], data.keys.aes256 || '');
        setOutputText(['authKeyIdOut'], data.keys.identity || '');
        setOutputText(['authKeyRecOut', 'authKeyRecoveryOut'], data.keys.recovery || '');
        setOutputText(['authKeyBackupOut', 'authKeyBackupsOut'], values.join('\n'));

        state.registeredSessionToken = String(data.session_token || '');
        state.registeredAccountId = String(data.account_id || '');
        state.registeredKeysText = buildKeyKitText(data);

        if (box) {
            box.style.display = 'block';
            box.hidden = false;
            box.dataset.hashcodRegisterReady = state.registeredSessionToken ? 'true' : 'false';
        }
    }

    async function writeClipboardWithFallback(text) {
        const value = String(text || '');
        if (!value) throw new Error('Kit vacío');

        if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
            try {
                await navigator.clipboard.writeText(value);
                return true;
            } catch (error) {
                // Continue to the DOM fallback. Some browsers deny Clipboard API
                // even though a user gesture is active.
            }
        }

        const textarea = document.createElement('textarea');
        textarea.value = value;
        textarea.setAttribute('readonly', '');
        textarea.setAttribute('aria-hidden', 'true');
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        textarea.style.top = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        textarea.setSelectionRange(0, textarea.value.length);

        let copied = false;
        try {
            copied = typeof document.execCommand === 'function' && document.execCommand('copy');
        } finally {
            textarea.remove();
        }
        if (!copied) throw new Error('El navegador bloqueó el portapapeles');
        return true;
    }

    async function copyRegisteredKit(button) {
        if (!state.registeredKeysText) return false;
        setBusy(button, true);
        try {
            await writeClipboardWithFallback(state.registeredKeysText);
            setMessage('Kit completo copiado al portapapeles ✓', true);
            return true;
        } catch (error) {
            setMessage('El navegador bloqueó la copia automática. Puedes seleccionar las claves visibles y copiarlas manualmente.');
            return false;
        } finally {
            setBusy(button, false);
        }
    }

    function enterRegisteredSession(button) {
        if (!state.registeredSessionToken) return false;
        setBusy(button, true);
        try {
            sessionStorage.setItem(AUTH_TOKEN_KEY, state.registeredSessionToken);
            if (state.registeredAccountId) {
                sessionStorage.setItem(AUTH_ACCOUNT_KEY, state.registeredAccountId);
            }
        } catch (error) {
            setBusy(button, false);
            setMessage('No se pudo guardar la sesión en este navegador. Habilita el almacenamiento del sitio y vuelve a intentarlo.');
            return false;
        }

        setMessage('Kit confirmado. Entrando a Hashcod Codespace…', true);
        const overlay = document.getElementById('authOverlay');
        if (overlay) overlay.classList.add('hidden');
        document.body.classList.remove('boot-locked');
        document.body.classList.remove('auth-locked');
        window.dispatchEvent(new CustomEvent('hashcod:auth-session-ready', {
            detail: { account_id: state.registeredAccountId }
        }));

        // Reload with the newly stored session so the whole platform initializes
        // through the same authenticated path used by a normal login.
        window.setTimeout(function () {
            window.location.reload();
        }, 120);
        return true;
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

    function bindKitActions() {
        document.addEventListener('click', function (event) {
            const target = event.target && event.target.closest ? event.target : null;
            if (!target) return;

            const copyButton = target.closest('#authCopyKeysBtn');
            if (copyButton && state.registeredKeysText) {
                event.preventDefault();
                event.stopImmediatePropagation();
                copyRegisteredKit(copyButton);
                return;
            }

            const enterButton = target.closest('#authEnterAfterRegisterBtn');
            if (enterButton && state.registeredSessionToken) {
                event.preventDefault();
                event.stopImmediatePropagation();
                enterRegisteredSession(enterButton);
            }
        }, true);
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
    bindKitActions();
    bindRegisterWatchdog();
})();
