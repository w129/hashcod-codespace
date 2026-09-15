(function () {
    'use strict';

    if (window.__hashcodPercentFeatureTrayLoaded) return;
    window.__hashcodPercentFeatureTrayLoaded = true;

    const TOOL_ID = 'percent-feature';
    const TRAY_SLOT = 3;
    const MODAL_ID = 'hashcodPercentFeatureModal';
    const WINDOW_ID = 'hashcodPercentFeatureWindow';
    const CONTENT_ID = 'hashcodPercentFeatureContent';
    const CLOSE_ID = 'hashcodPercentFeatureClose';

    // Percent/starburst tool icon in the platform tray. Keep the original
    // geometry, but use Hashcod black instead of the former red accent.
    const PERCENT_ICON = [
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" aria-hidden="true" focusable="false" style="display:block;width:78%;height:78%;max-width:39px;max-height:39px;overflow:visible">',
            '<polygon fill="#000" points="113,65 101.545,76.136 105.904,91.508 90.405,95.406 86.507,110.905 71.136,106.545 60,118 48.864,106.545 33.492,110.904 29.594,95.405 14.095,91.507 18.455,76.136 7,65 18.455,53.864 14.096,38.492 29.595,34.594 33.493,19.095 48.864,23.455 60,12 71.136,23.455 86.508,19.096 90.406,34.595 105.905,38.493 101.545,53.864" opacity=".28"></polygon>',
            '<polygon fill="#0b0b0b" points="113,60 101.545,71.136 105.904,86.508 90.405,90.406 86.507,105.905 71.136,101.545 60,113 48.864,101.545 33.492,105.904 29.594,90.405 14.095,86.507 18.455,71.136 7,60 18.455,48.864 14.096,33.492 29.595,29.594 33.493,14.095 48.864,18.455 60,7 71.136,18.455 86.508,14.096 90.406,29.595 105.905,33.493 101.545,48.864"></polygon>',
            '<path fill="#000" d="M44.746,39c6.986,0,12.372,5.13,12.372,12.63c0,7.37-5.386,12.563-12.372,12.563s-12.5-5.13-12.5-12.563C32.246,44.13,37.76,39,44.746,39z M50.45,51.63c0-4.165-2.884-6.409-5.705-6.409c-2.884,0-5.77,2.244-5.77,6.409c0,4.04,2.821,6.409,5.77,6.409C47.567,58.04,50.45,55.67,50.45,51.63z M71.859,40.153h7.821L48.206,87.909h-7.818L71.859,40.153z M75.385,63.744c6.986,0,12.37,5.125,12.37,12.625c0,7.437-5.384,12.63-12.37,12.63s-12.5-5.193-12.5-12.63C62.885,68.87,68.399,63.744,75.385,63.744z M75.385,82.784c2.821,0,5.705-2.312,5.705-6.414c0-4.165-2.884-6.341-5.705-6.341c-2.884,0-5.77,2.176-5.77,6.341C69.615,80.472,72.436,82.784,75.385,82.784z" opacity=".30"></path>',
            '<path fill="#fff" d="M44.746,35c6.986,0,12.372,5.13,12.372,12.63c0,7.37-5.386,12.563-12.372,12.563s-12.5-5.13-12.5-12.563C32.246,40.13,37.76,35,44.746,35z M50.45,47.63c0-4.165-2.884-6.409-5.705-6.409c-2.884,0-5.77,2.244-5.77,6.409c0,4.04,2.821,6.409,5.77,6.409C47.567,54.04,50.45,51.67,50.45,47.63z M71.859,36.153h7.821L48.206,83.909h-7.818L71.859,36.153z M75.385,59.744c6.986,0,12.37,5.125,12.37,12.625c0,7.437-5.384,12.63-12.37,12.63s-12.5-5.193-12.5-12.63C62.885,64.87,68.399,59.744,75.385,59.744z M75.385,78.784c2.821,0,5.705-2.312,5.705-6.414c0-4.165-2.884-6.341-5.705-6.341c-2.884,0-5.77,2.176-5.77,6.341C69.615,80.472,72.436,78.784,75.385,78.784z"></path>',
        '</svg>'
    ].join('');

    const OFFER_MARKUP =
        '<div class="hashcod-percent-offer" aria-label="All services at: 10US$">' +
            '<span class="hashcod-percent-offer-label">All services at:</span>' +
            '<strong class="hashcod-percent-offer-price">10US$</strong>' +
        '</div>';

    function removeLegacyFloatingButton() {
        const legacy = document.getElementById('hashcodPercentFeatureButton');
        if (legacy && legacy.parentNode) legacy.parentNode.removeChild(legacy);
    }

    function renderOffer() {
        const content = document.getElementById(CONTENT_ID);
        if (!content) return;
        content.innerHTML = OFFER_MARKUP;
    }

    function ensureModal() {
        let modal = document.getElementById(MODAL_ID);
        if (!modal) {
            modal = document.createElement('div');
            modal.id = MODAL_ID;
            modal.hidden = true;
            modal.setAttribute('aria-hidden', 'true');
            modal.innerHTML =
                '<div id="' + WINDOW_ID + '" role="dialog" aria-modal="true" aria-label="All services at: 10US$">' +
                    '<button id="' + CLOSE_ID + '" type="button" aria-label="Cerrar">×</button>' +
                    '<div id="' + CONTENT_ID + '" data-hashcod-percent-content="true">' + OFFER_MARKUP + '</div>' +
                '</div>';
            document.body.appendChild(modal);
        }
        renderOffer();
        return modal;
    }

    function openModal() {
        const modal = ensureModal();
        const close = document.getElementById(CLOSE_ID);
        renderOffer();
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
        if (!modal) return;
        modal.hidden = true;
        modal.setAttribute('aria-hidden', 'true');
        document.documentElement.classList.remove('hashcod-percent-window-open');
        const trayButton = document.querySelector('#hashcodVectorTray [data-vector-tray-slot="' + TRAY_SLOT + '"]');
        if (trayButton && typeof trayButton.focus === 'function') trayButton.focus({ preventScroll: true });
    }

    function bindModal() {
        const modal = ensureModal();
        if (modal.dataset.hashcodPercentBound !== 'true') {
            modal.dataset.hashcodPercentBound = 'true';
            modal.addEventListener('click', function (event) {
                if (event.target === modal) closeModal();
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
                const current = document.getElementById(MODAL_ID);
                if (event.key === 'Escape' && current && !current.hidden) closeModal();
            });
        }
    }

    function registerTrayTool() {
        removeLegacyFloatingButton();
        if (!window.HashcodVectorTray || typeof window.HashcodVectorTray.registerTool !== 'function') return false;

        window.HashcodVectorTray.registerTool({
            slot: TRAY_SLOT,
            id: TOOL_ID,
            label: 'Función porcentual',
            iconSvg: PERCENT_ICON,
            onClick: openModal
        });

        const slotButton = document.querySelector('#hashcodVectorTray [data-vector-tray-slot="' + TRAY_SLOT + '"]');
        if (slotButton) {
            slotButton.disabled = false;
            slotButton.removeAttribute('disabled');
            slotButton.setAttribute('aria-label', 'Abrir función porcentual');
            slotButton.setAttribute('title', 'Función porcentual');
            slotButton.style.setProperty('pointer-events', 'auto', 'important');
        }
        return Boolean(slotButton);
    }

    function scheduleRegistration() {
        const delays = [0, 80, 200, 450, 900, 1600, 2800, 4500, 7000];
        delays.forEach(function (delay) {
            window.setTimeout(registerTrayTool, delay);
        });
    }

    function init() {
        removeLegacyFloatingButton();
        bindModal();
        scheduleRegistration();

        const observer = new MutationObserver(function () {
            if (!document.querySelector('#hashcodVectorTray [data-vector-tray-slot="' + TRAY_SLOT + '"] svg')) {
                registerTrayTool();
            }
        });
        observer.observe(document.documentElement, { childList: true, subtree: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();
