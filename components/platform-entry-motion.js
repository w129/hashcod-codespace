(function () {
    'use strict';

    if (window.__hashcodPlatformEntryMotionLoaded) return;
    window.__hashcodPlatformEntryMotionLoaded = true;

    const INTRO_SESSION_KEY = 'hashcod_platform_intro_seen_v1';
    const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let entryTransitionPromise = null;

    const iconPaths = [
        'M 12 3 L 12 5 L 20 5 L 20 3 L 12 3 z M 20 5 L 20 7 L 25 7 L 25 20 L 27 20 L 27 5 L 20 5 z M 25 20 L 23 20 L 23 24 L 25 24 L 25 20 z M 23 24 L 20 24 L 20 26 L 23 26 L 23 24 z M 20 26 L 17 26 L 17 28 L 20 28 L 20 26 z M 17 28 L 15 28 L 15 30 L 17 30 L 17 28 z M 15 28 L 15 26 L 12 26 L 12 28 L 15 28 z M 12 26 L 12 24 L 9 24 L 9 26 L 12 26 z M 9 24 L 9 20 L 7 20 L 7 24 L 9 24 z M 7 20 L 7 7 L 12 7 L 12 5 L 5 5 L 5 20 L 7 20 z M 13 10 L 13 12 L 17 12 L 17 14 L 19 14 L 19 18 L 21 18 L 21 12 L 19 12 L 19 10 L 13 10 z M 19 18 L 15 18 L 15 16 L 13 16 L 13 12 L 11 12 L 11 18 L 13 18 L 13 20 L 19 20 L 19 18 z M 15 16 L 17 16 L 17 14 L 15 14 L 15 16 z',
        'M 12 3 L 12 5 L 20 5 L 20 3 L 12 3 z M 20 5 L 20 7 L 25 7 L 25 20 L 27 20 L 27 5 L 20 5 z M 25 20 L 23 20 L 23 24 L 25 24 L 25 20 z M 23 24 L 20 24 L 20 26 L 23 26 L 23 24 z M 20 26 L 17 26 L 17 28 L 20 28 L 20 26 z M 17 28 L 15 28 L 15 30 L 17 30 L 17 28 z M 15 28 L 15 26 L 12 26 L 12 28 L 15 28 z M 12 26 L 12 24 L 9 24 L 9 26 L 12 26 z M 9 24 L 9 20 L 7 20 L 7 24 L 9 24 z M 7 20 L 7 7 L 12 7 L 12 5 L 5 5 L 5 20 L 7 20 z M 15 7 L 15 9 L 17 9 L 17 7 L 15 7 z M 17 9 L 17 11 L 19 11 L 19 9 L 17 9 z M 19 11 L 19 15 L 17 15 L 17 17 L 19 17 L 19 19 L 21 19 L 21 17 L 23 17 L 23 15 L 21 15 L 21 11 L 19 11 z M 11 11 L 11 13 L 9 13 L 9 15 L 11 15 L 11 19 L 13 19 L 13 15 L 15 15 L 15 13 L 13 13 L 13 11 L 11 11 z M 13 19 L 13 21 L 15 21 L 15 19 L 13 19 z M 15 21 L 15 23 L 17 23 L 17 21 L 15 21 z',
        'M 4 6 L 4 27 L 28 27 L 28 6 L 4 6 z M 6 10 L 26 10 L 26 25 L 6 25 L 6 10 z M 13 13 L 13 15 L 17 15 L 17 17 L 19 17 L 19 21 L 21 21 L 21 15 L 19 15 L 19 13 L 13 13 z M 19 21 L 15 21 L 15 19 L 13 19 L 13 15 L 11 15 L 11 21 L 13 21 L 13 23 L 19 23 L 19 21 z M 15 19 L 17 19 L 17 17 L 15 17 L 15 19 z',
        'M 5 5 L 5 27 L 27 27 L 27 5 L 5 5 z M 7 7 L 11 7 L 11 9 L 13 9 L 13 7 L 15 7 L 15 9 L 17 9 L 17 7 L 19 7 L 19 9 L 21 9 L 21 7 L 25 7 L 25 9 L 23 9 L 23 11 L 25 11 L 25 13 L 23 13 L 23 15 L 25 15 L 25 17 L 23 17 L 23 19 L 25 19 L 25 21 L 23 21 L 23 23 L 25 23 L 25 25 L 21 25 L 21 23 L 19 23 L 19 25 L 17 25 L 17 23 L 15 23 L 15 25 L 13 25 L 13 23 L 11 23 L 11 25 L 7 25 L 7 23 L 9 23 L 9 21 L 7 21 L 7 19 L 9 19 L 9 17 L 7 17 L 7 15 L 9 15 L 9 13 L 7 13 L 7 11 L 9 11 L 9 9 L 7 9 L 7 7 z M 13 11 L 13 15 L 11 15 L 11 21 L 21 21 L 21 15 L 19 15 L 19 11 L 13 11 z M 15 13 L 17 13 L 17 15 L 15 15 L 15 13 z',
        'M 3 5 L 3 27 L 29 27 L 29 7 L 12 7 L 12 5 L 3 5 z M 5 7 L 10 7 L 10 9 L 11 9 L 19 9 L 19 11 L 21 11 L 21 9 L 27 9 L 27 25 L 5 25 L 5 7 z M 21 11 L 21 13 L 23 13 L 23 11 L 21 11 z M 21 13 L 19 13 L 19 15 L 21 15 L 21 13 z M 21 15 L 21 17 L 19 17 L 19 15 L 17 15 L 17 21 L 23 21 L 23 15 L 21 15 z M 19 13 L 19 11 L 17 11 L 17 13 L 19 13 z'
    ];

    const stepLabels = ['SECURE ID', 'VECTOR CORE', 'SESSION', 'CRYPTO MODULE', 'WORKSPACE'];

    function sleep(ms) {
        return new Promise(function (resolve) { window.setTimeout(resolve, ms); });
    }

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

    function sessionHasSeenIntro() {
        try {
            return window.sessionStorage.getItem(INTRO_SESSION_KEY) === '1';
        } catch (error) {
            return false;
        }
    }

    function markIntroSeen() {
        try {
            window.sessionStorage.setItem(INTRO_SESSION_KEY, '1');
        } catch (error) {
            // sessionStorage is optional; animation still works without persistence.
        }
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
                        return [
                            '<div class="hashcod-motion-step" style="--step-index:', index, '">',
                                '<div class="hashcod-motion-step-icon">', iconSvg(path, index), '</div>',
                                '<span>', stepLabels[index], '</span>',
                            '</div>'
                        ].join('');
                    }).join(''),
                '</div>',
            '</div>'
        ].join('');
        return intro;
    }

    async function playIntro(bootOverlay) {
        if (reducedMotion || sessionHasSeenIntro() || !bootOverlay) return;

        markIntroSeen();
        const intro = buildIntro();
        bootOverlay.classList.add('hashcod-intro-running');
        bootOverlay.appendChild(intro);

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

        await sleep(1650);
        intro.classList.add('is-complete');
        bootOverlay.classList.remove('hashcod-intro-running');
        bootOverlay.classList.add('hashcod-intro-revealed');

        await sleep(360);
        intro.remove();
        window.setTimeout(function () {
            bootOverlay.classList.remove('hashcod-intro-revealed');
        }, 500);
    }

    function buildEntryTransition() {
        const transition = document.createElement('div');
        transition.id = 'hashcodEntryTransition';
        transition.setAttribute('aria-hidden', 'true');
        transition.innerHTML = [
            '<div class="hashcod-entry-panel hashcod-entry-panel-left"></div>',
            '<div class="hashcod-entry-panel hashcod-entry-panel-right"></div>',
            '<div class="hashcod-entry-center">',
                '<div class="hashcod-entry-symbol">', iconSvg(iconPaths[3], 3), '</div>',
                '<div class="hashcod-entry-label">ACCESS GRANTED</div>',
                '<div class="hashcod-entry-line"></div>',
                '<div class="hashcod-entry-meta">SECURE SESSION / HASHCOD</div>',
            '</div>'
        ].join('');
        return transition;
    }

    function pulseDestination() {
        const authOverlay = document.getElementById('authOverlay');
        if (!authOverlay) return;

        const tryAnimate = function () {
            const visible = !authOverlay.classList.contains('hidden') && window.getComputedStyle(authOverlay).display !== 'none';
            if (!visible) return false;

            authOverlay.classList.remove('hashcod-auth-arrival');
            void authOverlay.offsetWidth;
            authOverlay.classList.add('hashcod-auth-arrival');
            window.setTimeout(function () {
                authOverlay.classList.remove('hashcod-auth-arrival');
            }, 720);
            return true;
        };

        if (tryAnimate()) return;

        let attempts = 0;
        const timer = window.setInterval(function () {
            attempts += 1;
            if (tryAnimate() || attempts >= 10) window.clearInterval(timer);
        }, 70);
    }

    function setButtonState(button, text, className) {
        if (!button) return;
        button.textContent = text;
        button.classList.remove('hashcod-enter-verifying', 'hashcod-enter-granted');
        if (className) button.classList.add(className);
    }

    async function runReducedEntryTransition(button, invokeOriginal) {
        const originalText = button ? button.textContent : '';
        const transition = buildEntryTransition();
        transition.classList.add('is-covering');
        transition.style.setProperty('display', 'grid', 'important');
        transition.querySelectorAll('.hashcod-entry-panel').forEach(function (panel) {
            panel.style.setProperty('transform', 'translateX(0)', 'important');
            panel.style.setProperty('transition', 'none', 'important');
        });
        const center = transition.querySelector('.hashcod-entry-center');
        if (center) {
            center.style.setProperty('opacity', '1', 'important');
            center.style.setProperty('transform', 'none', 'important');
            center.style.setProperty('transition', 'none', 'important');
        }
        document.body.appendChild(transition);

        if (button) {
            button.disabled = true;
            button.dataset.hashcodMotionBusy = 'true';
            setButtonState(button, 'ACCESS GRANTED', 'hashcod-enter-granted');
        }

        try {
            await sleep(260);
            const result = await invokeOriginal();
            pulseDestination();
            await sleep(180);
            return result;
        } finally {
            transition.remove();
            if (button) {
                button.disabled = false;
                button.textContent = originalText;
                button.classList.remove('hashcod-enter-verifying', 'hashcod-enter-granted');
                delete button.dataset.hashcodMotionBusy;
            }
        }
    }

    async function runEntryTransition(button, invokeOriginal) {
        const originalText = button ? button.textContent : '';
        const transition = buildEntryTransition();
        document.body.appendChild(transition);

        if (button) {
            button.disabled = true;
            button.dataset.hashcodMotionBusy = 'true';
        }

        try {
            setButtonState(button, 'VERIFYING', 'hashcod-enter-verifying');
            await sleep(220);

            setButtonState(button, 'ACCESS GRANTED', 'hashcod-enter-granted');
            transition.classList.add('is-covering');
            await sleep(520);

            const result = await invokeOriginal();
            pulseDestination();

            await sleep(140);
            transition.classList.add('is-revealing');
            await sleep(640);
            return result;
        } catch (error) {
            console.error('[Hashcod entry motion] Platform entry failed:', error);
            transition.classList.add('is-revealing');
            await sleep(280);
            throw error;
        } finally {
            transition.remove();
            if (button) {
                button.disabled = false;
                button.textContent = originalText;
                button.classList.remove('hashcod-enter-verifying', 'hashcod-enter-granted');
                delete button.dataset.hashcodMotionBusy;
            }
        }
    }

    function installEnterPlatformWrapper() {
        const current = window.l8EnterPlatform;
        if (typeof current !== 'function') return false;
        if (current.__hashcodMotionWrapped === true) return true;

        const original = current;
        const wrapped = function () {
            const context = this;
            const args = arguments;

            if (entryTransitionPromise) return entryTransitionPromise;

            const button = document.getElementById('bootCliEnter');
            const invokeOriginal = function () {
                return original.apply(context, args);
            };

            entryTransitionPromise = (reducedMotion
                ? runReducedEntryTransition(button, invokeOriginal)
                : runEntryTransition(button, invokeOriginal)
            ).finally(function () {
                entryTransitionPromise = null;
            });

            return entryTransitionPromise;
        };

        Object.defineProperty(wrapped, '__hashcodMotionWrapped', { value: true });
        Object.defineProperty(wrapped, '__hashcodMotionOriginal', { value: original });
        window.l8EnterPlatform = wrapped;
        return true;
    }

    function init() {
        const bootOverlay = document.getElementById('bootCliOverlay');
        const enterButton = document.getElementById('bootCliEnter');
        const wrapped = installEnterPlatformWrapper();

        if (bootOverlay) playIntro(bootOverlay);
        if (enterButton && wrapped) enterButton.dataset.hashcodMotionReady = 'true';

        return Boolean(bootOverlay && enterButton && wrapped);
    }

    if (!init()) {
        const observer = new MutationObserver(function () {
            if (init()) observer.disconnect();
        });
        observer.observe(document.documentElement, { childList: true, subtree: true });
        window.setTimeout(function () { observer.disconnect(); }, 15000);
    }
})();