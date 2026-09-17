(function () {
    'use strict';

    if (window.__hashcodTemporaryImprovementSignLoaded) return;
    window.__hashcodTemporaryImprovementSignLoaded = true;

    const SIGN_ID = 'hashcodPlatformImprovementSign';
    const ASSET_PATH = 'assets/plataforma-en-mejora.svg?v=20260917-1';

    function publicBase() {
        const base = document.querySelector('base[href]');
        if (base) {
            try { return new URL(base.getAttribute('href'), window.location.href); } catch (error) {}
        }
        return new URL('./', window.location.href);
    }

    function assetUrl() {
        return new URL(ASSET_PATH, publicBase()).toString();
    }

    function mount() {
        let host = document.getElementById(SIGN_ID);
        if (!host) {
            host = document.createElement('div');
            host.id = SIGN_ID;
            host.setAttribute('data-hashcod-temporary-improvement-sign', 'true');
            host.setAttribute('aria-label', 'Plataforma en mejora');
            host.setAttribute('role', 'img');

            const image = document.createElement('img');
            image.alt = 'Plataforma en mejora';
            image.decoding = 'async';
            image.fetchPriority = 'high';
            image.src = assetUrl();
            host.appendChild(image);

            document.body.appendChild(host);
        }

        host.hidden = false;
        host.style.removeProperty('display');
        host.setAttribute('aria-hidden', 'false');
        return host;
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', mount, { once: true });
    } else {
        mount();
    }

    window.addEventListener('load', mount, { once: true });

    window.HashcodTemporaryImprovementSign = Object.freeze({
        mount,
        id: SIGN_ID,
        persistentUntilExplicitRemoval: true
    });
})();