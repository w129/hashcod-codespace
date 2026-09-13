(function () {
    'use strict';

    if (window.__hashcodBootIntroForceLoaded) return;
    window.__hashcodBootIntroForceLoaded = true;

    const INTRO_SESSION_KEY = 'hashcod_platform_intro_seen_v1';
    const iconPaths = [
        'M 12 3 L 12 5 L 20 5 L 20 3 L 12 3 z M 20 5 L 20 7 L 25 7 L 25 20 L 27 20 L 27 5 L 20 5 z M 25 20 L 23 20 L 23 24 L 25 24 L 25 20 z M 23 24 L 20 24 L 20 26 L 23 26 L 23 24 z M 20 26 L 17 26 L 17 28 L 20 28 L 20 26 z M 17 28 L 15 28 L 15 30 L 17 30 L 17 28 z M 15 28 L 15 26 L 12 26 L 12 28 L 15 28 z M 12 26 L 12 24 L 9 24 L 9 26 L 12 26 z M 9 24 L 9 20 L 7 20 L 7 24 L 9 24 z M 7 20 L 7 7 L 12 7 L 12 5 L 5 5 L 5 20 L 7 20 z M 13 10 L 13 12 L 17 12 L 17 14 L 19 14 L 19 18 L 21 18 L 21 12 L 19 12 L 19 10 L 13 10 z M 19 18 L 15 18 L 15 16 L 13 16 L 13 12 L 11 12 L 11 18 L 13 18 L 13 20 L 19 20 L 19 18 z M 15 16 L 17 16 L 17 14 L 15 14 L 15 16 z',
        'M 12 3 L 12 5 L 20 5 L 20 3 L 12 3 z M 20 5 L 20 7 L 25 7 L 25 20 L 27 20 L 27 5 L 20 5 z M 25 20 L 23 20 L 23 24 L 25 24 L 25 20 z M 23 24 L 20 24 L 20 26 L 23 26 L 23 24 z M 20 26 L 17 26 L 17 28 L 20 28 L 20 26 z M 17 28 L 15 28 L 15 30 L 17 30 L 17 28 z M 15 28 L 15 26 L 12 26 L 12 28 L 15 28 z M 12 26 L 12 24 L 9 24 L 9 26 L 12 26 z M 9 24 L 9 20 L 7 20 L 7 24 L 9 24 z M 7 20 L 7 7 L 12 7 L 12 5 L 5 5 L 5 20 L 7 20 z M 15 7 L 15 9 L 17 9 L 17 7 L 15 7 z M 17 9 L 17 11 L 19 11 L 19 9 L 17 9 z M 19 11 L 19 15 L 17 15 L 17 17 L 19 17 L 19 19 L 21 19 L 21 17 L 23 17 L 23 15 L 21 15 L 21 11 L 19 11 z M 11 11 L 11 13 L 9 13 L 9 15 L 11 15 L 11 19 L 13 19 L 13 15 L 15 15 L 15 13 L 13 13 L 13 11 L 11 11 z M 13 19 L 13 21 L 15 21 L 15 19 L 13 19 z M 15 21 L 15 23 L 17 23 L 17 21 L 15 21 z',
        'M 4 6 L 4 27 L 28 27 L 28 6 L 4 6 z M 6 10 L 26 10 L 26 25 L 6 25 L 6 10 z M 13 13 L 13 15 L 17 15 L 17 17 L 19 17 L 19 21 L 21 21 L 21 15 L 19 15 L 19 13 L 13 13 z M 19 21 L 15 21 L 15 19 L 13 19 L 13 15 L 11 15 L 11 21 L 13 21 L 13 23 L 19 23 L 19 21 z M 15 19 L 17 19 L 17 17 L 15 17 L 15 19 z',
        'M 5 5 L 5 27 L 27 27 L 27 5 L 5 5 z M 7 7 L 11 7 L 11 9 L 13 9 L 13 7 L 15 7 L 15 9 L 17 9 L 17 7 L 19 7 L 19 9 L 21 9 L 21 7 L 25 7 L 25 9 L 23 9 L 23 11 L 25 11 L 25 13 L 23 13 L 23 15 L 25 15 L 25 17 L 23 17 L 23 19 L 25 19 L 25 21 L 23 21 L 23 23 L 25 23 L 25 25 L 21 25 L 21 23 L 19 23 L 19 25 L 17 25 L 17 23 L 15 23 L 15 25 L 13 25 L 13 23 L 11 23 L 11 25 L 7 25 L 7 23 L 9 23 L 9 21 L 7 21 L 7 19 L 9 19 L 9 17 L 7 17 L 7 15 L 9 15 L 9 13 L 7 13 L 7 11 L 9 11 L 9 9 L 7 9 L 7 7 z M 13 11 L 13 15 L 11 15 L 11 21 L 21 21 L 21 15 L 19 15 L 19 11 L 13 11 z M 15 13 L 17 13 L 17 15 L 15 15 L 15 13 z',
        'M 3 5 L 3 27 L 29 27 L 29 7 L 12 7 L 12 5 L 3 5 z M 5 7 L 10 7 L 10 9 L 11 9 L 19 9 L 19 11 L 21 11 L 21 9 L 27 9 L 27 25 L 5 25 L 5 7 z M 21 11 L 21 13 L 23 13 L 23 11 L 21 11 z M 21 13 L 19 13 L 19 15 L 21 15 L 21 13 z M 21 15 L 21 17 L 19 17 L 19 15 L 17 15 L 17 21 L 23 21 L 23 15 L 21 15 z M 19 13 L 19 11 L 17 11 L 17 13 L 19 13 z'
    ];
    const stepLabels = ['SECURE ID', 'VECTOR CORE', 'SESSION', 'CRYPTO MODULE', 'WORKSPACE'];

    function iconSvg(path, index) {
        return '<svg viewBox="0 0 32 32" role="img" aria-label="' + stepLabels[index] + '"><path d="' + path + '"></path></svg>';
    }

    function logoSvg() {
        return [
            '<svg class="hashcod-motion-logo-svg" viewBox="0 0 500 500" role="img" aria-label="Hashcod">',
            '<path class="hashcod-motion-logo-frame" d="M 124 347 L 76 347 C 59.43 347 46 333.57 46 317 L 46 97 C 46 80.43 59.43 67 76 67 L 425 67 C 441.57 67 455 80.43 455 97 L 455 317 C 455 333.57 441.57 347 425 347 L 378 347" fill="none" stroke="currentColor" stroke-width="32" stroke-linecap="round" stroke-linejoin="round"></path>',
            '<path class="hashcod-motion-logo-triangle" d="M 242.5 278.5 C 246.2 272.1 255.8 272.1 259.5 278.5 L 373.5 450.2 C 377.5 456.9 372.7 460 365.0 460 L 137.0 460 C 129.3 460 124.5 456.9 128.5 450.2 Z" fill="currentColor"></path>',
            '</svg>'
        ].join('');
    }

    function buildIntro() {
        const intro = document.createElement('section');
        intro.id = 'hashcodBootIntro';
        intro.setAttribute('aria-label', 'Inicializando Hashcod Codespace');
        intro.innerHTML = [
            '<div class="hashcod-motion-corner hashcod-motion-corner-a">01 / BOOT</div>',
            '<div class="hashcod-motion-corner hashcod-motion-corner-b">HASHCOD CODESPACE</div>',
            '<div class="hashcod-motion-intro-core">',
                '<div class="hashcod-motion-logo">', logoSvg(), '</div>',
                '<div class="hashcod-motion-wordmark">HASHCOD</div>',
                '<div class="hashcod-motion-rule"></div>',
                '<div class="hashcod-motion-status" aria-live="polite">',
                    '<span class="hashcod-motion-status-square" aria-hidden="true"></span>',
                    '<span id="hashcodMotionStatusText">INITIALIZING SECURE WORKSPACE</span>',
                '</div>',
                '<div class="hashcod-motion-steps">',
                    iconPaths.map(function (path, index) {
                        return '<div class="hashcod-motion-step" style="--step-index:' + index + '"><div class="hashcod-motion-step-icon">' + iconSvg(path, index) + '</div><span>' + stepLabels[index] + '</span></div>';
                    }).join(''),
                '</div>',
            '</div>'
        ].join('');
        return intro;
    }

    function start() {
        const overlay = document.getElementById('bootCliOverlay');
        if (!overlay) return false;

        const stale = document.getElementById('hashcodBootIntro');
        if (stale) stale.remove();

        try { window.sessionStorage.setItem(INTRO_SESSION_KEY, '1'); } catch (error) {}

        const intro = buildIntro();
        intro.style.setProperty('display', 'grid', 'important');
        intro.style.setProperty('visibility', 'visible', 'important');
        intro.style.setProperty('opacity', '1', 'important');

        overlay.classList.remove('hashcod-intro-revealed');
        overlay.classList.add('hashcod-intro-running');
        overlay.appendChild(intro);

        const status = intro.querySelector('#hashcodMotionStatusText');
        const messages = [
            'INITIALIZING SECURE WORKSPACE',
            'VERIFYING LOCAL MODULES',
            'MOUNTING CRYPTO INTERFACE',
            'WORKSPACE READY'
        ];
        messages.forEach(function (message, index) {
            window.setTimeout(function () {
                if (status && intro.isConnected) status.textContent = message;
            }, 280 + index * 320);
        });

        window.setTimeout(function () {
            if (!intro.isConnected) return;
            intro.classList.add('is-complete');
            intro.style.removeProperty('visibility');
            intro.style.removeProperty('opacity');
            overlay.classList.remove('hashcod-intro-running');
            overlay.classList.add('hashcod-intro-revealed');
        }, 1650);

        window.setTimeout(function () {
            if (intro.isConnected) intro.remove();
        }, 2050);

        window.setTimeout(function () {
            overlay.classList.remove('hashcod-intro-revealed');
        }, 2550);

        return true;
    }

    if (start()) return;

    const observer = new MutationObserver(function () {
        if (start()) observer.disconnect();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    window.setTimeout(function () { observer.disconnect(); }, 10000);
})();