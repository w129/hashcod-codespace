(function () {
    'use strict';

    if (window.__hashcodPlatformEntryHoldLoaded) return;
    window.__hashcodPlatformEntryHoldLoaded = true;

    const READY_DELAY_MS = 3600;
    let holdPromise = null;

    const ACCESS_ICON_PATH = 'M 5 5 L 5 27 L 27 27 L 27 5 L 5 5 z M 7 7 L 11 7 L 11 9 L 13 9 L 13 7 L 15 7 L 15 9 L 17 9 L 17 7 L 19 7 L 19 9 L 21 9 L 21 7 L 25 7 L 25 9 L 23 9 L 23 11 L 25 11 L 25 13 L 23 13 L 23 15 L 25 15 L 25 17 L 23 17 L 23 19 L 25 19 L 25 21 L 23 21 L 23 23 L 25 23 L 25 25 L 21 25 L 21 23 L 19 23 L 19 25 L 17 25 L 17 23 L 15 23 L 15 25 L 13 25 L 13 23 L 11 23 L 11 25 L 7 25 L 7 23 L 9 23 L 9 21 L 7 21 L 7 19 L 9 19 L 9 17 L 7 17 L 7 15 L 9 15 L 9 13 L 7 13 L 7 11 L 9 11 L 9 9 L 7 9 L 7 7 z M 13 11 L 13 15 L 11 15 L 11 21 L 21 21 L 21 15 L 19 15 L 19 11 L 13 11 z M 15 13 L 17 13 L 17 15 L 15 15 L 15 13 z';

    function sleep(ms) {
        return new Promise(function (resolve) { window.setTimeout(resolve, ms); });
    }

    function buildOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'hashcodEntryHold';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-label', 'Acceso a Hashcod Codespace');
        overlay.innerHTML = [
            '<div class="hashcod-hold-grid" aria-hidden="true"></div>',
            '<div class="hashcod-hold-frame">',
                '<div class="hashcod-hold-topline">',
                    '<span>HASHCOD / SECURE ENTRY</span>',
                    '<span id="hashcodHoldCounter">01 / 04</span>',
                '</div>',
                '<div class="hashcod-hold-icon" aria-hidden="true">',
                    '<svg viewBox="0 0 32 32"><path d="', ACCESS_ICON_PATH, '"></path></svg>',
                '</div>',
                '<div class="hashcod-hold-title">ACCESS SEQUENCE</div>',
                '<div class="hashcod-hold-status" id="hashcodHoldStatus" role="status" aria-live="polite">VERIFYING ACCESS</div>',
                '<div class="hashcod-hold-progress" aria-hidden="true"><span id="hashcodHoldProgress"></span></div>',
                '<div class="hashcod-hold-steps" aria-hidden="true">',
                    '<span class="is-active">IDENTITY</span>',
                    '<span>SESSION</span>',
                    '<span>CRYPTO</span>',
                    '<span>WORKSPACE</span>',
                '</div>',
                '<button type="button" class="hashcod-hold-continue" id="hashcodHoldContinue" disabled>',
                    '<span>VERIFYING</span><span aria-hidden="true">↵</span>',
                '</button>',
                '<div class="hashcod-hold-help" id="hashcodHoldHelp">La entrada continuará cuando finalice la verificación.</div>',
            '</div>'
        ].join('');
        return overlay;
    }

    async function prepareOverlay(overlay) {
        const status = overlay.querySelector('#hashcodHoldStatus');
        const counter = overlay.querySelector('#hashcodHoldCounter');
        const progress = overlay.querySelector('#hashcodHoldProgress');
        const steps = Array.from(overlay.querySelectorAll('.hashcod-hold-steps span'));
        const continueButton = overlay.querySelector('#hashcodHoldContinue');
        const help = overlay.querySelector('#hashcodHoldHelp');

        const phases = [
            { at: 0, text: 'VERIFYING ACCESS', counter: '01 / 04', width: '24%' },
            { at: 900, text: 'VALIDATING SECURE SESSION', counter: '02 / 04', width: '49%' },
            { at: 1800, text: 'CHECKING CRYPTO MODULES', counter: '03 / 04', width: '74%' },
            { at: 2700, text: 'PREPARING HASHCOD WORKSPACE', counter: '04 / 04', width: '100%' }
        ];

        phases.forEach(function (phase, index) {
            window.setTimeout(function () {
                if (!overlay.isConnected) return;
                status.textContent = phase.text;
                counter.textContent = phase.counter;
                progress.style.width = phase.width;
                steps.forEach(function (step, stepIndex) {
                    step.classList.toggle('is-active', stepIndex <= index);
                });
            }, phase.at);
        });

        await sleep(READY_DELAY_MS);
        if (!overlay.isConnected) return;

        overlay.classList.add('is-ready');
        status.textContent = 'ACCESS GRANTED';
        continueButton.disabled = false;
        continueButton.querySelector('span').textContent = 'CONTINUAR AL LOGIN';
        help.textContent = 'Pulsa el botón para continuar.';
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

    async function runHold(original, context, args) {
        const enterButton = document.getElementById('bootCliEnter');
        const enterOriginalText = enterButton ? enterButton.textContent : '';
        const overlay = buildOverlay();

        if (enterButton) {
            enterButton.disabled = true;
            enterButton.textContent = 'VERIFYING';
        }

        document.body.appendChild(overlay);
        requestAnimationFrame(function () {
            overlay.classList.add('is-visible');
        });

        try {
            await Promise.all([
                prepareOverlay(overlay),
                sleep(180)
            ]);

            await waitForContinue(overlay);
            await sleep(260);

            const result = await original.apply(context, args);
            overlay.classList.add('is-revealing');
            await sleep(620);
            return result;
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
        if (current.__hashcodHoldWrapped === true) return true;

        // platform-entry-motion exposes the original entry function. Bypass its
        // auto-advancing transition so this manual gate is the single authority.
        const original = current.__hashcodMotionOriginal || current;

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
        Object.defineProperty(wrapped, '__hashcodHoldOriginal', { value: original });
        window.l8EnterPlatform = wrapped;
        return true;
    }

    if (!install()) {
        let attempts = 0;
        const timer = window.setInterval(function () {
            attempts += 1;
            if (install() || attempts >= 80) window.clearInterval(timer);
        }, 50);
    }
})();
