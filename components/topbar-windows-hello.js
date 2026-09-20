(function () {
    'use strict';

    if (window.__hashcodTopbarWindowsHelloLoaded) return;
    window.__hashcodTopbarWindowsHelloLoaded = true;

    const BUTTON_ID = 'topBarWindowsHelloBtn';
    const STYLE_ID = 'topBarWindowsHelloStyle';
    const HELLO_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 32 32" aria-hidden="true" focusable="false"><path fill="currentColor" d="M 10 3 L 10 5 L 18 5 L 18 3 L 10 3 z M 18 5 L 18 23 L 20 23 L 20 5 L 18 5 z M 18 23 L 14 23 L 14 25 L 18 25 L 18 23 z M 14 23 L 14 10 L 12 10 L 12 23 L 14 23 z M 10 5 L 8 5 L 8 27 L 10 27 L 10 5 z M 10 27 L 10 29 L 22 29 L 22 27 L 10 27 z M 22 27 L 24 27 L 24 23 L 25 23 L 25 15 L 26 15 L 26 11 L 24 11 L 24 15 L 23 15 L 23 23 L 22 23 L 22 27 z"></path></svg>';
    let topbarObserver = null;

    function injectStyle() {
        if (document.getElementById(STYLE_ID)) return;
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
            #${BUTTON_ID} {
                width: 34px;
                height: 30px;
                min-width: 34px;
                padding: 0;
                display: inline-grid;
                place-items: center;
                flex: 0 0 34px;
                border: 1.5px solid #2BBFB3;
                border-radius: 7px;
                background: #fff;
                color: #01879A;
                box-shadow: 0 2px 6px rgba(43,191,179,.15);
                cursor: pointer;
                transition: background .16s ease, color .16s ease, border-color .16s ease, box-shadow .16s ease, transform .16s ease;
            }
            #${BUTTON_ID}:hover,
            #${BUTTON_ID}:focus-visible {
                background: #E9FAF8;
                border-color: #01879A;
                box-shadow: 0 4px 12px rgba(1,135,154,.22);
                transform: translateY(-1px);
                outline: none;
            }
            #${BUTTON_ID}.is-verified {
                background: #01879A;
                border-color: #01879A;
                color: #fff;
                box-shadow: 0 0 0 2px rgba(43,191,179,.18), 0 3px 10px rgba(1,135,154,.22);
            }
            #${BUTTON_ID}[aria-busy="true"] {
                opacity: .62;
                cursor: wait;
                transform: none;
            }
            #${BUTTON_ID} svg { display: block; }
            @media (max-width: 760px) {
                #${BUTTON_ID} { width: 32px; min-width: 32px; height: 28px; }
                #${BUTTON_ID} svg { width: 20px; height: 20px; }
            }
        `;
        document.head.appendChild(style);
    }

    function showMessage(message, kind) {
        if (window.CodespaceWS && typeof window.CodespaceWS.showToast === 'function') {
            window.CodespaceWS.showToast(message, kind || 'info');
            return;
        }
        const button = document.getElementById(BUTTON_ID);
        if (!button) return;
        button.title = message;
    }

    function render(button, authenticated) {
        const verified = authenticated === true;
        button.classList.toggle('is-verified', verified);
        button.dataset.verified = verified ? 'true' : 'false';
        button.setAttribute('aria-label', verified
            ? 'Windows Hello verificado. Pulsar para verificar de nuevo.'
            : 'Verificar con Windows Hello');
        button.title = verified
            ? 'Windows Hello verificado · pulsa para verificar de nuevo'
            : 'Verificar con Windows Hello';
    }

    async function verify(button) {
        if (button.disabled) return;
        button.disabled = true;
        button.setAttribute('aria-busy', 'true');
        showMessage('Confirma Windows Hello en este dispositivo…', 'info');
        try {
            if (!window.HashcodAdmin || typeof window.HashcodAdmin.require !== 'function') {
                throw new Error('La verificación de Windows Hello todavía no está disponible. Recarga la plataforma.');
            }
            const verified = await window.HashcodAdmin.require({ force: true });
            render(button, verified === true);
            if (verified) {
                showMessage('Windows Hello verificado. Administración habilitada.', 'success');
            } else {
                showMessage('Windows Hello no pudo verificarse.', 'error');
            }
        } catch (error) {
            render(button, false);
            showMessage(error && error.message ? error.message : 'No se pudo verificar Windows Hello.', 'error');
        } finally {
            button.disabled = false;
            button.removeAttribute('aria-busy');
        }
    }

    function mount() {
        // Visible Windows Hello control retired from the top bar. Authentication
        // remains available through HashcodAdmin/admin-device flows elsewhere.
        const button = document.getElementById(BUTTON_ID);
        if (button) button.remove();

        const style = document.getElementById(STYLE_ID);
        if (style) style.remove();

        return true;
    }

    window.addEventListener('hashcod:admin-auth', function (event) {
        const button = document.getElementById(BUTTON_ID);
        if (!button) return;
        render(button, Boolean(event.detail && event.detail.authenticated));
    });

    function boot() {
        if (mount()) return;
        let tries = 0;
        const timer = window.setInterval(function () {
            tries += 1;
            if (mount() || tries > 80) window.clearInterval(timer);
        }, 250);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot, { once: true });
    } else {
        boot();
    }

    window.addEventListener('hashcod:platform-entered', function () {
        if (!document.getElementById(BUTTON_ID)) mount();
    });
})();
