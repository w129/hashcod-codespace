(function () {
    'use strict';

    const BUTTON_ID = 'hashcodPercentFeatureButton';
    const MODAL_ID = 'hashcodPercentFeatureModal';
    const WINDOW_ID = 'hashcodPercentFeatureWindow';
    const CONTENT_ID = 'hashcodPercentFeatureContent';
    const CLOSE_ID = 'hashcodPercentFeatureClose';
    const LABELS = ['index.ts', 'QuantumCore', 'verifyCode'];

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
            button.innerHTML = '<img alt="" aria-hidden="true" src="' + asset('components/percent-feature-button.svg?v=20260913-1') + '">';
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

    function findTextElement() {
        const body = document.body;
        if (!body) return null;
        const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT);
        let node;
        while ((node = walker.nextNode())) {
            const value = (node.nodeValue || '').trim();
            if (!value) continue;
            if (LABELS.some(label => value === label || value.includes(label))) {
                const parent = node.parentElement;
                if (parent && parent.offsetParent !== null) return parent;
            }
        }
        return null;
    }

    function findTarget() {
        const direct = document.querySelector(
            '[data-file="index.ts"], [data-filename="index.ts"], [aria-label*="index.ts" i], [title="index.ts"], .boot-cli-window'
        );
        const seed = direct || findTextElement();
        if (!seed) return null;

        let node = seed;
        let fallback = seed;
        for (let i = 0; node && node !== document.body && i < 10; i += 1, node = node.parentElement) {
            const rect = node.getBoundingClientRect();
            if (rect.width > 260 && rect.height > 130) {
                fallback = node;
                if (rect.width < window.innerWidth * .92 && rect.height < window.innerHeight * .88) {
                    return node;
                }
            }
        }
        return fallback;
    }

    function isElementVisible(el) {
        if (!el) return false;
        const rect = el.getBoundingClientRect();
        if (rect.width < 1 || rect.height < 1) return false;
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false;
        return rect.bottom > 0 && rect.top < window.innerHeight;
    }

    function positionButton() {
        const button = document.getElementById(BUTTON_ID);
        if (!button) return;
        const target = findTarget();

        if (!target || !isElementVisible(target)) {
            button.classList.remove('is-visible');
            return;
        }

        const rect = target.getBoundingClientRect();
        const buttonSize = Math.max(84, Math.min(116, window.innerWidth * .072));
        const x = Math.max(buttonSize / 2 + 18, Math.min(window.innerWidth - buttonSize / 2 - 18, rect.left + rect.width / 2));
        const neededAbove = buttonSize + 28;
        const y = rect.top >= neededAbove
            ? rect.top - (buttonSize / 2) - 20
            : Math.min(window.innerHeight - buttonSize / 2 - 20, rect.top + buttonSize / 2 + 22);

        button.style.left = x + 'px';
        button.style.top = Math.max(buttonSize / 2 + 18, y) + 'px';
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
        requestAnimationFrame(() => close && close.focus());
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
        const { button, modal } = createUi();
        button.addEventListener('click', openModal);
        modal.addEventListener('click', function (event) {
            if (event.target === modal) closeModal();
        });
        const close = document.getElementById(CLOSE_ID);
        if (close) close.addEventListener('click', closeModal);
        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape' && !modal.hidden) closeModal();
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
        observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style', 'hidden'] });

        if ('ResizeObserver' in window) {
            const resizeObserver = new ResizeObserver(schedule);
            resizeObserver.observe(document.body);
        }

        window.setTimeout(schedule, 250);
        window.setTimeout(schedule, 1000);
        window.setTimeout(schedule, 2500);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();
