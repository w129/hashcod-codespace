(function () {
    'use strict';

    const BUTTON_ID = 'hashcodPercentFeatureButton';
    const MODAL_ID = 'hashcodPercentFeatureModal';
    const WINDOW_ID = 'hashcodPercentFeatureWindow';
    const CONTENT_ID = 'hashcodPercentFeatureContent';
    const CLOSE_ID = 'hashcodPercentFeatureClose';
    const ASSET_VERSION = '20260913-3';

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
            document.body.appendChild(button);
        }

        button.type = 'button';
        button.hidden = false;
        button.setAttribute('aria-label', 'Abrir ventana de función');
        button.setAttribute('aria-haspopup', 'dialog');
        button.setAttribute('data-anchor', 'auth-vector-tray');

        let icon = button.querySelector('img');
        if (!icon) {
            icon = document.createElement('img');
            icon.alt = '';
            icon.setAttribute('aria-hidden', 'true');
            button.replaceChildren(icon);
        }
        icon.src = asset('components/percent-feature-button.svg?v=' + ASSET_VERSION);

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
        if (!el || !el.isConnected) return false;
        const rect = el.getBoundingClientRect();
        if (rect.width < 1 || rect.height < 1) return false;
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false;
        return rect.bottom > 0 && rect.top < window.innerHeight && rect.right > 0 && rect.left < window.innerWidth;
    }

    function getVisibleAuthOverlay() {
        const overlays = Array.from(document.querySelectorAll('#authOverlay'));
        return overlays.find(function (overlay) {
            return !overlay.classList.contains('hidden') && isElementVisible(overlay);
        }) || null;
    }

    function getVisibleTray(overlay) {
        if (!overlay) return null;
        const localTray = overlay.querySelector('#hashcodVectorTray');
        if (localTray && isElementVisible(localTray)) return localTray;

        return Array.from(document.querySelectorAll('#hashcodVectorTray')).find(isElementVisible) || null;
    }

    function getAuthAnchor() {
        const overlay = getVisibleAuthOverlay();
        if (!overlay) return null;
        const tray = getVisibleTray(overlay);
        if (!tray) return null;
        return { overlay, tray };
    }

    function hideButton(button) {
        if (!button) return;
        button.classList.remove('is-visible');
        button.setAttribute('aria-hidden', 'true');
    }

    function positionButton() {
        const ui = createUi();
        const button = ui.button;
        const anchor = getAuthAnchor();

        if (!anchor) {
            hideButton(button);
            return;
        }

        const trayRect = anchor.tray.getBoundingClientRect();
        const buttonSize = window.innerWidth <= 700
            ? 84
            : Math.max(96, Math.min(118, window.innerWidth * .068));
        const sidePad = 18;
        const gap = window.innerWidth <= 700 ? 14 : 24;

        const rawX = trayRect.left + trayRect.width / 2;
        const x = Math.max(buttonSize / 2 + sidePad, Math.min(window.innerWidth - buttonSize / 2 - sidePad, rawX));
        const rawY = trayRect.top - buttonSize / 2 - gap;
        const y = Math.max(buttonSize / 2 + sidePad, Math.min(window.innerHeight - buttonSize / 2 - sidePad, rawY));

        button.style.left = x + 'px';
        button.style.top = y + 'px';
        button.style.zIndex = '2147483646';
        button.removeAttribute('aria-hidden');
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

        if (ui.button.dataset.hashcodPercentBound !== 'true') {
            ui.button.dataset.hashcodPercentBound = 'true';
            ui.button.addEventListener('click', openModal);
        }

        if (ui.modal.dataset.hashcodPercentBound !== 'true') {
            ui.modal.dataset.hashcodPercentBound = 'true';
            ui.modal.addEventListener('click', function (event) {
                if (event.target === ui.modal) closeModal();
            });
        }

        const close = document.getElementById(CLOSE_ID);
        if (close && close.dataset.hashcodPercentBound !== 'true') {
            close.dataset.hashcodPercentBound = 'true';
            close.addEventListener('click', closeModal);
        }

        if (document.documentElement.dataset.hashcodPercentEscapeBound !== 'true') {
            document.documentElement.dataset.hashcodPercentEscapeBound = 'true';
            document.addEventListener('keydown', function (event) {
                const modal = document.getElementById(MODAL_ID);
                if (event.key === 'Escape' && modal && !modal.hidden) closeModal();
            });
        }
    }

    function init() {
        bindUi();
        positionButton();

        let frame = 0;
        const schedule = function () {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(function () {
                bindUi();
                positionButton();
            });
        };

        if (document.documentElement.dataset.hashcodPercentObserversBound !== 'true') {
            document.documentElement.dataset.hashcodPercentObserversBound = 'true';
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
        }

        window.setTimeout(schedule, 100);
        window.setTimeout(schedule, 350);
        window.setTimeout(schedule, 800);
        window.setTimeout(schedule, 1600);
        window.setTimeout(schedule, 3000);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();
