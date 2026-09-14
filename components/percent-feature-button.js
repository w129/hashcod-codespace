(function () {
    'use strict';

    const BUTTON_ID = 'hashcodPercentFeatureButton';
    const MODAL_ID = 'hashcodPercentFeatureModal';
    const WINDOW_ID = 'hashcodPercentFeatureWindow';
    const CONTENT_ID = 'hashcodPercentFeatureContent';
    const CLOSE_ID = 'hashcodPercentFeatureClose';

    function asset(path) {
        const base = document.querySelector('base[href]');
        const baseHref = base ? base.getAttribute('href') : '/';
        try {
            return new URL(path, new URL(baseHref, window.location.href)).toString();
        } catch (_) {
            return path;
        }
    }

    function createUi() {
        let button = document.getElementById(BUTTON_ID);
        if (!button) {
            button = document.createElement('button');
            button.id = BUTTON_ID;
            button.type = 'button';
            button.setAttribute('aria-label', 'Abrir ventana de función');
            button.setAttribute('aria-haspopup', 'dialog');
            button.setAttribute('data-anchor', 'auth-vector-tray');
            button.innerHTML = '<img alt="" aria-hidden="true" src="' + asset('components/percent-feature-button.svg?v=20260913-2') + '">';
            document.body.appendChild(button);
        }

        let modal = document.getElementById(MODAL_ID);
        if (!modal) {
            modal = document.createElement('div');
            modal.id = MODAL_ID;
            modal.hidden = true;
            modal.setAttribute('aria-hidden', 'true');
            modal.innerHTML =
                '<div id="' + WINDOW_ID + '" role="dialog" aria-modal="true" aria-label="Ventana de función">' +
                    '<button id="' + CLOSE_ID + '" type="button" aria-label="Cerrar">×</button>' +
                    '<div id="' + CONTENT_ID + '" data-hashcod-percent-content="true"></div>' +
                '</div>';
            document.body.appendChild(modal);
        }

        return { button, modal };
    }

    function isElementVisible(el) {
        if (!el) return false;
        const rect = el.getBoundingClientRect();
        if (rect.width < 1 || rect.height < 1) return false;
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false;
        return rect.bottom > 0 && rect.top < window.innerHeight && rect.right > 0 && rect.left < window.innerWidth;
    }

    function getAuthAnchor() {
        const overlay = document.getElementById('authOverlay');
        const tray = document.getElementById('hashcodVectorTray');
        if (!overlay || !tray) return null;
        if (overlay.classList.contains('hidden') || !isElementVisible(overlay) || !isElementVisible(tray)) return null;
        return { overlay, tray };
    }

    function positionButton() {
        const button = document.getElementById(BUTTON_ID);
        if (!button) return;

        const anchor = getAuthAnchor();
        if (!anchor) {
            button.classList.remove('is-visible');
            return;
        }

        const trayRect = anchor.tray.getBoundingClientRect();
        const buttonSize = window.innerWidth <= 700
            ? 84
            : Math.max(92, Math.min(116, window.innerWidth * .068));
        const sidePad = 18;
        const gap = window.innerWidth <= 700 ? 14 : 22;

        const rawX = trayRect.left + trayRect.width / 2;
        const x = Math.max(buttonSize / 2 + sidePad, Math.min(window.innerWidth - buttonSize / 2 - sidePad, rawX));
        const rawY = trayRect.top - buttonSize / 2 - gap;
        const y = Math.max(buttonSize / 2 + sidePad, Math.min(window.innerHeight - buttonSize / 2 - sidePad, rawY));

        button.style.left = x + 'px';
        button.style.top = y + 'px';
        button.classList.add('is-visible');
    }

    function openModal() {
        const modal = document.getElementById(MODAL_ID);
        const close = document.getElementById(CLOSE_ID);
        if (!modal) return;
        modal.hidden = false;
        modal.setAttribute('aria-hidden', 'false');
        document.documentElement.classList.add('hashcod-percent-window-open');
        window.dispatchEvent(new CustomEvent('hashcod:percent-feature-open', {
            detail: { content: document.getElementById(CONTENT_ID) }
        }));
        requestAnimationFrame(function () {
            if (close) close.focus();
        });
    }

    function closeModal() {
        const modal = document.getElementById(MODAL_ID);
        const button = document.getElementById(BUTTON_ID);
        if (!modal) return;
        modal.hidden = true;
        modal.setAttribute('aria-hidden', 'true');
        document.documentElement.classList.remove('hashcod-percent-window-open');
        if (button && button.classList.contains('is-visible')) button.focus({ preventScroll: true });
    }

    function bindUi() {
        const ui = createUi();
        ui.button.addEventListener('click', openModal);
        ui.modal.addEventListener('click', function (event) {
            if (event.target === ui.modal) closeModal();
        });
        const close = document.getElementById(CLOSE_ID);
        if (close) close.addEventListener('click', closeModal);
        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape' && !ui.modal.hidden) closeModal();
        });
    }

    function init() {
        if (document.getElementById(BUTTON_ID)) return;
        bindUi();
        positionButton();

        let frame = 0;
        const schedule = function () {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(positionButton);
        };

        window.addEventListener('resize', schedule, { passive: true });
        window.addEventListener('scroll', schedule, { passive: true });

        const observer = new MutationObserver(schedule);
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class', 'style', 'hidden']
        });

        if ('ResizeObserver' in window) {
            const resizeObserver = new ResizeObserver(schedule);
            resizeObserver.observe(document.body);
        }

        window.setTimeout(schedule, 200);
        window.setTimeout(schedule, 700);
        window.setTimeout(schedule, 1500);
        window.setTimeout(schedule, 3000);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();
