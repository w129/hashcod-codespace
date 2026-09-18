(function () {
    'use strict';

    const HOLD_RUNTIME_VERSION = '20260918-5';
    if (window.__hashcodPlatformEntryHoldLoadedVersion === HOLD_RUNTIME_VERSION) return;
    window.__hashcodPlatformEntryHoldLoaded = true;
    window.__hashcodPlatformEntryHoldLoadedVersion = HOLD_RUNTIME_VERSION;

    const READY_DELAY_MS = 3600;
    let holdPromise = null;

    // Existing Hashcod vectors plus the six additional vectors supplied for the entry scene.
    // Complete SVG bodies are preserved so rect/polygon geometry remains exact.
    const ICON_SVGS = [
        '<path d="M 12 3 L 12 5 L 20 5 L 20 3 L 12 3 z M 20 5 L 20 7 L 25 7 L 25 20 L 27 20 L 27 5 L 20 5 z M 25 20 L 23 20 L 23 24 L 25 24 L 25 20 z M 23 24 L 20 24 L 20 26 L 23 26 L 23 24 z M 20 26 L 17 26 L 17 28 L 20 28 L 20 26 z M 17 28 L 15 28 L 15 30 L 17 30 L 17 28 z M 15 28 L 15 26 L 12 26 L 12 28 L 15 28 z M 12 26 L 12 24 L 9 24 L 9 26 L 12 26 z M 9 24 L 9 20 L 7 20 L 7 24 L 9 24 z M 7 20 L 7 7 L 12 7 L 12 5 L 5 5 L 5 20 L 7 20 z M 13 10 L 13 12 L 17 12 L 17 14 L 19 14 L 19 18 L 21 18 L 21 12 L 19 12 L 19 10 L 13 10 z M 19 18 L 15 18 L 15 16 L 13 16 L 13 12 L 11 12 L 11 18 L 13 18 L 13 20 L 19 20 L 19 18 z M 15 16 L 17 16 L 17 14 L 15 14 L 15 16 z"></path>',
        '<path d="M 12 3 L 12 5 L 20 5 L 20 3 L 12 3 z M 20 5 L 20 7 L 25 7 L 25 20 L 27 20 L 27 5 L 20 5 z M 25 20 L 23 20 L 23 24 L 25 24 L 25 20 z M 23 24 L 20 24 L 20 26 L 23 26 L 23 24 z M 20 26 L 17 26 L 17 28 L 20 28 L 20 26 z M 17 28 L 15 28 L 15 30 L 17 30 L 17 28 z M 15 28 L 15 26 L 12 26 L 12 28 L 15 28 z M 12 26 L 12 24 L 9 24 L 9 26 L 12 26 z M 9 24 L 9 20 L 7 20 L 7 24 L 9 24 z M 7 20 L 7 7 L 12 7 L 12 5 L 5 5 L 5 20 L 7 20 z M 15 7 L 15 9 L 17 9 L 17 7 L 15 7 z M 17 9 L 17 11 L 19 11 L 19 9 L 17 9 z M 19 11 L 19 15 L 17 15 L 17 17 L 19 17 L 19 19 L 21 19 L 21 17 L 23 17 L 23 15 L 21 15 L 21 11 L 19 11 z M 11 11 L 11 13 L 9 13 L 9 15 L 11 15 L 11 19 L 13 19 L 13 15 L 15 15 L 15 13 L 13 13 L 13 11 L 11 11 z M 13 19 L 13 21 L 15 21 L 15 19 L 13 19 z M 15 21 L 15 23 L 17 23 L 17 21 L 15 21 z"></path>',
        '<path d="M 4 6 L 4 27 L 28 27 L 28 6 L 4 6 z M 6 10 L 26 10 L 26 25 L 6 25 L 6 10 z M 13 13 L 13 15 L 17 15 L 17 17 L 19 17 L 19 21 L 21 21 L 21 15 L 19 15 L 19 13 L 13 13 z M 19 21 L 15 21 L 15 19 L 13 19 L 13 15 L 11 15 L 11 21 L 13 21 L 13 23 L 19 23 L 19 21 z M 15 19 L 17 19 L 17 17 L 15 17 L 15 19 z"></path>',
        '<path d="M 5 5 L 5 27 L 27 27 L 27 5 L 5 5 z M 7 7 L 11 7 L 11 9 L 13 9 L 13 7 L 15 7 L 15 9 L 17 9 L 17 7 L 19 7 L 19 9 L 21 9 L 21 7 L 25 7 L 25 9 L 23 9 L 23 11 L 25 11 L 25 13 L 23 13 L 23 15 L 25 15 L 25 17 L 23 17 L 23 19 L 25 19 L 25 21 L 23 21 L 23 23 L 25 23 L 25 25 L 21 25 L 21 23 L 19 23 L 19 25 L 17 25 L 17 23 L 15 23 L 15 25 L 13 25 L 13 23 L 11 23 L 11 25 L 7 25 L 7 23 L 9 23 L 9 21 L 7 21 L 7 19 L 9 19 L 9 17 L 7 17 L 7 15 L 9 15 L 9 13 L 7 13 L 7 11 L 9 11 L 9 9 L 7 9 L 7 7 z M 13 11 L 13 15 L 11 15 L 11 21 L 21 21 L 21 15 L 19 15 L 19 11 L 13 11 z M 15 13 L 17 13 L 17 15 L 15 15 L 15 13 z"></path>',
        '<path d="M 3 5 L 3 27 L 29 27 L 29 7 L 12 7 L 12 5 L 3 5 z M 5 7 L 10 7 L 10 9 L 11 9 L 19 9 L 19 11 L 21 11 L 21 9 L 27 9 L 27 25 L 5 25 L 5 7 z M 21 11 L 21 13 L 23 13 L 23 11 L 21 11 z M 21 13 L 19 13 L 19 15 L 21 15 L 21 13 z M 21 15 L 21 17 L 19 17 L 19 15 L 17 15 L 17 21 L 23 21 L 23 15 L 21 15 z M 19 13 L 19 11 L 17 11 L 17 13 L 19 13 z"></path>',
        '<rect width="12" height="2" x="10" y="4"></rect><rect width="12" height="2" x="21" y="15" transform="rotate(90 27 16)"></rect><rect width="2" height="2" x="22" y="6" transform="rotate(-180 23 7)"></rect><rect width="2" height="2" x="24" y="8" transform="rotate(-180 25 9)"></rect><rect width="2" height="2" x="22" y="24" transform="rotate(-180 23 25)"></rect><rect width="2" height="2" x="24" y="22" transform="rotate(-180 25 23)"></rect><rect width="12" height="2" x="10" y="26" transform="rotate(-180 16 27)"></rect><rect width="12" height="2" x="-1" y="15" transform="rotate(-90 5 16)"></rect><rect width="2" height="2" x="8" y="24"></rect><rect width="2" height="2" x="6" y="22"></rect><rect width="2" height="2" x="8" y="6" transform="rotate(-90 9 7)"></rect><rect width="2" height="2" x="6" y="8" transform="rotate(-90 7 9)"></rect><rect width="3" height="2" x="8" y="15"></rect><rect width="2" height="2" x="11" y="13"></rect><rect width="4" height="2" x="13" y="11"></rect><polygon points="17,9 17,11 19,11 19,19 15,19 15,21 19,21 19,23 21,23 21,9"></polygon><polygon points="13,15 13,17 11,17 11,21 13,21 13,19 15,19 15,15"></polygon>',
        '<path d="M 5 5 L 5 6 L 3 6 L 3 8 L 5 8 L 5 7 L 7 7 L 7 5 L 5 5 z M 16 6 L 16 8 L 21 8 L 21 10 L 23 10 L 23 6 L 16 6 z M 21 10 L 19 10 L 19 14 L 14 14 L 14 16 L 24 16 L 24 14 L 21 14 L 21 10 z M 24 16 L 24 18 L 8 18 L 8 14 L 6 14 L 6 18 L 4 18 L 4 20 L 28 20 L 28 18 L 26 18 L 26 16 L 24 16 z M 28 20 L 28 24 L 30 24 L 30 20 L 28 20 z M 28 24 L 4 24 L 4 26 L 28 26 L 28 24 z M 4 24 L 4 20 L 2 20 L 2 24 L 4 24 z M 8 14 L 14 14 L 14 12 L 12 12 L 12 10 L 10 10 L 10 12 L 8 12 L 8 14 z M 12 10 L 16 10 L 16 8 L 12 8 L 12 10 z M 26 11 L 26 13 L 28 13 L 28 14 L 30 14 L 30 12 L 28 12 L 28 11 L 26 11 z"></path>',
        '<path d="M 15 4 L 15 7 L 17 7 L 17 4 L 15 4 z M 17 7 L 17 10 L 19 10 L 19 7 L 17 7 z M 19 10 L 19 13 L 21 13 L 21 10 L 19 10 z M 21 13 L 21 16 L 23 16 L 23 13 L 21 13 z M 23 13 L 25 13 L 25 8 L 23 8 L 23 13 z M 25 8 L 27 8 L 27 21 L 29 21 L 29 6 L 25 6 L 25 8 z M 27 21 L 13 21 L 13 23 L 25 23 L 25 25 L 7 25 L 7 23 L 10 23 L 10 21 L 5 21 L 5 27 L 27 27 L 27 21 z M 5 21 L 5 8 L 7 8 L 7 6 L 3 6 L 3 21 L 5 21 z M 7 8 L 7 13 L 9 13 L 9 8 L 7 8 z M 9 13 L 9 16 L 11 16 L 11 13 L 9 13 z M 11 13 L 13 13 L 13 10 L 11 10 L 11 13 z M 13 10 L 15 10 L 15 7 L 13 7 L 13 10 z"></path>',
        '<path d="M 4 5 L 4 24 L 6 24 L 6 7 L 20 7 L 20 19 L 10 19 L 10 21 L 22 21 L 22 5 L 4 5 z M 10 21 L 8 21 L 8 24 L 10 24 L 10 21 z M 8 24 L 6 24 L 6 26 L 8 26 L 8 24 z M 24 11 L 24 13 L 26 13 L 26 28 L 28 28 L 28 11 L 24 11 z M 26 28 L 24 28 L 24 30 L 26 30 L 26 28 z M 24 28 L 24 25 L 22 25 L 22 28 L 24 28 z M 22 25 L 22 23 L 14 23 L 14 25 L 22 25 z"></path>',
        '<path d="M 5 5 L 5 27 L 21 27 L 21 25 L 19 25 L 19 19 L 25 19 L 25 21 L 27 21 L 27 5 L 5 5 z M 25 21 L 23 21 L 23 23 L 25 23 L 25 21 z M 23 23 L 21 23 L 21 25 L 23 25 L 23 23 z M 7 7 L 25 7 L 25 17 L 17 17 L 17 25 L 7 25 L 7 7 z"></path>',
        '<path d="M 8 3 L 8 21 L 2 21 L 2 25 L 4 25 L 4 23 L 20 23 L 20 25 L 22 25 L 22 21 L 10 21 L 10 5 L 26 5 L 26 27 L 28 27 L 28 3 L 8 3 z M 26 27 L 24 27 L 24 25 L 22 25 L 22 27 L 6 27 L 6 29 L 26 29 L 26 27 z M 6 27 L 6 25 L 4 25 L 4 27 L 6 27 z"></path>'
    ];

    // Intentionally irregular placement: a visual field, not a grid of icons.
    const SCATTER = [
        { icon: 0, pos: '01', tone: 'strong' },
        { icon: 5, pos: '02', tone: 'soft' },
        { icon: 8, pos: '03', tone: 'mid' },
        { icon: 2, pos: '04', tone: 'soft' },
        { icon: 10, pos: '05', tone: 'strong' },
        { icon: 6, pos: '06', tone: 'mid' },
        { icon: 1, pos: '07', tone: 'soft' },
        { icon: 9, pos: '08', tone: 'strong' },
        { icon: 4, pos: '09', tone: 'mid' },
        { icon: 7, pos: '10', tone: 'soft' },
        { icon: 3, pos: '11', tone: 'mid' },
        { icon: 5, pos: '12', tone: 'soft' },
        { icon: 8, pos: '13', tone: 'strong' },
        { icon: 6, pos: '14', tone: 'soft' },
        { icon: 10, pos: '15', tone: 'mid' },
        { icon: 7, pos: '16', tone: 'soft' },
        { icon: 9, pos: '17', tone: 'mid' },
        { icon: 4, pos: '18', tone: 'soft' }
    ];

    function sleep(ms) {
        return new Promise(function (resolve) { window.setTimeout(resolve, ms); });
    }

    function iconMarkup(item, index) {
        return [
            '<span class="hashcod-hold-side-icon hashcod-hold-pos-', item.pos,
            ' hashcod-hold-side-', item.tone,
            '" style="--side-index:', index, '" aria-hidden="true">',
                '<svg viewBox="0 0 32 32">', ICON_SVGS[item.icon], '</svg>',
            '</span>'
        ].join('');
    }

    function buildOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'hashcodEntryHold';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-label', 'Acceso a Hashcod Codespace');
        overlay.innerHTML = [
            '<div class="hashcod-hold-grid" aria-hidden="true"></div>',
            '<div class="hashcod-hold-side-field" aria-hidden="true">',
                SCATTER.map(iconMarkup).join(''),
            '</div>',
            '<div class="hashcod-hold-cta-wrap">',
                '<button type="button" class="hashcod-hold-continue" id="hashcodHoldContinue" disabled aria-label="Continuar al login de Hashcod">',
                    '<span>VERIFYING</span><span aria-hidden="true">↵</span>',
                '</button>',
            '</div>'
        ].join('');
        return overlay;
    }

    async function prepareOverlay(overlay) {
        const continueButton = overlay.querySelector('#hashcodHoldContinue');
        await sleep(READY_DELAY_MS);
        if (!overlay.isConnected || !continueButton) return;

        overlay.classList.add('is-ready');
        continueButton.disabled = false;
        continueButton.querySelector('span').textContent = 'CONTINUAR AL LOGIN';
        window.setTimeout(function () {
            try { continueButton.focus({ preventScroll: true }); } catch (error) { continueButton.focus(); }
        }, 80);
    }

    function waitForContinue(overlay) {
        return new Promise(function (resolve) {
            const button = overlay.querySelector('#hashcodHoldContinue');
            button.addEventListener('click', function () {
                if (button.disabled) return;
                button.disabled = true;
                button.querySelector('span').textContent = 'ENTRANDO';
                overlay.classList.add('is-leaving');
                resolve();
            }, { once: true });
        });
    }

    function revealFinalEntryScreen() {
        const root = document.documentElement;
        root.dataset.hashcodFinalEntryScreen = 'true';
        window.dispatchEvent(new CustomEvent('hashcod:final-entry-screen', {
            detail: { screen: 3, source: 'platform-entry-hold' }
        }));
    }

    async function waitForRegistrationGate() {
        for (let attempt = 0; attempt < 120; attempt += 1) {
            const registration = window.HashcodPlatformRegistration;
            if (
                registration &&
                typeof registration.waitForSuccessfulSubmission === 'function' &&
                typeof registration.completePlatformEntry === 'function'
            ) {
                return registration;
            }
            await sleep(50);
        }
        throw new Error('No se pudo iniciar la tercera ventana de registro.');
    }

    async function runHold(original, context, args) {
        const enterButton = document.getElementById('bootCliEnter');
        const enterOriginalText = enterButton ? enterButton.textContent : '';
        const overlay = buildOverlay();

        if (enterButton) {
            enterButton.disabled = true;
            enterButton.textContent = 'VERIFYING';
        }

        document.documentElement.removeAttribute('data-hashcod-final-entry-screen');
        document.documentElement.removeAttribute('data-hashcod-platform-entered');
        document.body.appendChild(overlay);
        requestAnimationFrame(function () {
            overlay.classList.add('is-visible');
        });

        try {
            await prepareOverlay(overlay);
            await waitForContinue(overlay);
            await sleep(240);

            // Window 2 ends here. Do not execute the legacy platform-entry
            // function yet: Window 3 is an independent registration gate.
            overlay.classList.add('is-revealing');
            await sleep(420);
            overlay.remove();

            revealFinalEntryScreen();
            const registration = await waitForRegistrationGate();

            // The platform stays behind the opaque third screen until the POST
            // succeeds. Validation or storage errors never advance this promise.
            await registration.waitForSuccessfulSubmission();
            await sleep(360);

            registration.completePlatformEntry();
            return true;
        } finally {
            overlay.remove();
            if (enterButton) {
                enterButton.disabled = false;
                enterButton.textContent = enterOriginalText;
            }
        }
    }

    function install() {
        const current = window.l8EnterPlatform;
        if (typeof current !== 'function') return false;
        if (
            current.__hashcodHoldWrapped === true &&
            current.__hashcodHoldVersion === HOLD_RUNTIME_VERSION
        ) {
            window.__hashcodPlatformEntryHoldReady = true;
            document.documentElement.dataset.hashcodEntryGateReady = 'true';
            return true;
        }

        // A cached older hold wrapper may have installed first. Always unwrap it
        // and replace it with the current authoritative controller.
        const original = current.__hashcodHoldOriginal || current.__hashcodMotionOriginal || current;

        const wrapped = function () {
            const context = this;
            const args = arguments;
            if (holdPromise) return holdPromise;

            holdPromise = runHold(original, context, args).finally(function () {
                holdPromise = null;
            });
            return holdPromise;
        };

        Object.defineProperty(wrapped, '__hashcodHoldWrapped', { value: true });
        Object.defineProperty(wrapped, '__hashcodHoldVersion', { value: HOLD_RUNTIME_VERSION });
        Object.defineProperty(wrapped, '__hashcodHoldOriginal', { value: original });
        window.l8EnterPlatform = wrapped;
        window.__hashcodPlatformEntryHoldReady = true;
        document.documentElement.dataset.hashcodEntryGateReady = 'true';
        window.dispatchEvent(new CustomEvent('hashcod:entry-gate-ready', {
            detail: { source: 'platform-entry-hold', version: HOLD_RUNTIME_VERSION }
        }));
        return true;
    }

    if (!install()) {
        // Do not give up after a few seconds. The legacy entry function can be
        // defined late by the large startup document or by a cached loader.
        // The first-screen preboot guard remains fail-closed until install()
        // succeeds, so platform access cannot bypass Screen 3.
        const timer = window.setInterval(function () {
            if (install()) window.clearInterval(timer);
        }, 100);
    }
})();
