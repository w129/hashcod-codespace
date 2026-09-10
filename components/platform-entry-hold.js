(function () {
    'use strict';

    if (window.__hashcodPlatformEntryHoldLoaded) return;
    window.__hashcodPlatformEntryHoldLoaded = true;

    const READY_DELAY_MS = 3600;
    let holdPromise = null;

    const ICON_PATHS = [
        'M 12 3 L 12 5 L 20 5 L 20 3 L 12 3 z M 20 5 L 20 7 L 25 7 L 25 20 L 27 20 L 27 5 L 20 5 z M 25 20 L 23 20 L 23 24 L 25 24 L 25 20 z M 23 24 L 20 24 L 20 26 L 23 26 L 23 24 z M 20 26 L 17 26 L 17 28 L 20 28 L 20 26 z M 17 28 L 15 28 L 15 30 L 17 30 L 17 28 z M 15 28 L 15 26 L 12 26 L 12 28 L 15 28 z M 12 26 L 12 24 L 9 24 L 9 26 L 12 26 z M 9 24 L 9 20 L 7 20 L 7 24 L 9 24 z M 7 20 L 7 7 L 12 7 L 12 5 L 5 5 L 5 20 L 7 20 z M 13 10 L 13 12 L 17 12 L 17 14 L 19 14 L 19 18 L 21 18 L 21 12 L 19 12 L 19 10 L 13 10 z M 19 18 L 15 18 L 15 16 L 13 16 L 13 12 L 11 12 L 11 18 L 13 18 L 13 20 L 19 20 L 19 18 z M 15 16 L 17 16 L 17 14 L 15 14 L 15 16 z',
        'M 12 3 L 12 5 L 20 5 L 20 3 L 12 3 z M 20 5 L 20 7 L 25 7 L 25 20 L 27 20 L 27 5 L 20 5 z M 25 20 L 23 20 L 23 24 L 25 24 L 25 20 z M 23 24 L 20 24 L 20 26 L 23 26 L 23 24 z M 20 26 L 17 26 L 17 28 L 20 28 L 20 26 z M 17 28 L 15 28 L 15 30 L 17 30 L 17 28 z M 15 28 L 15 26 L 12 26 L 12 28 L 15 28 z M 12 26 L 12 24 L 9 24 L 9 26 L 12 26 z M 9 24 L 9 20 L 7 20 L 7 24 L 9 24 z M 7 20 L 7 7 L 12 7 L 12 5 L 5 5 L 5 20 L 7 20 z M 15 7 L 15 9 L 17 9 L 17 7 L 15 7 z M 17 9 L 17 11 L 19 11 L 19 9 L 17 9 z M 19 11 L 19 15 L 17 15 L 17 17 L 19 17 L 19 19 L 21 19 L 21 17 L 23 17 L 23 15 L 21 15 L 21 11 L 19 11 z M 11 11 L 11 13 L 9 13 L 9 15 L 11 15 L 11 19 L 13 19 L 13 15 L 15 15 L 15 13 L 13 13 L 13 11 L 11 11 z M 13 19 L 13 21 L 15 21 L 15 19 L 13 19 z M 15 21 L 15 23 L 17 23 L 17 21 L 15 21 z',
        'M 4 6 L 4 27 L 28 27 L 28 6 L 4 6 z M 6 10 L 26 10 L 26 25 L 6 25 L 6 10 z M 13 13 L 13 15 L 17 15 L 17 17 L 19 17 L 19 21 L 21 21 L 21 15 L 19 15 L 19 13 L 13 13 z M 19 21 L 15 21 L 15 19 L 13 19 L 13 15 L 11 15 L 11 21 L 13 21 L 13 23 L 19 23 L 19 21 z M 15 19 L 17 19 L 17 17 L 15 17 L 15 19 z',
        'M 5 5 L 5 27 L 27 27 L 27 5 L 5 5 z M 7 7 L 11 7 L 11 9 L 13 9 L 13 7 L 15 7 L 15 9 L 17 9 L 17 7 L 19 7 L 19 9 L 21 9 L 21 7 L 25 7 L 25 9 L 23 9 L 23 11 L 25 11 L 25 13 L 23 13 L 23 15 L 25 15 L 25 17 L 23 17 L 23 19 L 25 19 L 25 21 L 23 21 L 23 23 L 25 23 L 25 25 L 21 25 L 21 23 L 19 23 L 19 25 L 17 25 L 17 23 L 15 23 L 15 25 L 13 25 L 13 23 L 11 23 L 11 25 L 7 25 L 7 23 L 9 23 L 9 21 L 7 21 L 7 19 L 9 19 L 9 17 L 7 17 L 7 15 L 9 15 L 9 13 L 7 13 L 7 11 L 9 11 L 9 9 L 7 9 L 7 7 z M 13 11 L 13 15 L 11 15 L 11 21 L 21 21 L 21 15 L 19 15 L 19 11 L 13 11 z M 15 13 L 17 13 L 17 15 L 15 15 L 15 13 z',
        'M 3 5 L 3 27 L 29 27 L 29 7 L 12 7 L 12 5 L 3 5 z M 5 7 L 10 7 L 10 9 L 11 9 L 19 9 L 19 11 L 21 11 L 21 9 L 27 9 L 27 25 L 5 25 L 5 7 z M 21 11 L 21 13 L 23 13 L 23 11 L 21 11 z M 21 13 L 19 13 L 19 15 L 21 15 L 21 13 z M 21 15 L 21 17 L 19 17 L 19 15 L 17 15 L 17 21 L 23 21 L 23 15 L 21 15 z M 19 13 L 19 11 L 17 11 L 17 13 L 19 13 z'
    ];

    const ACCESS_ICON_PATH = ICON_PATHS[3];
    const SIDE_ICON_LAYOUT = [
        { side: 'left', pos: 'upper', icon: 0, tone: 'strong' },
        { side: 'left', pos: 'middle', icon: 2, tone: 'soft' },
        { side: 'left', pos: 'lower', icon: 4, tone: 'mid' },
        { side: 'left', pos: 'near', icon: 1, tone: 'soft' },
        { side: 'right', pos: 'upper', icon: 1, tone: 'mid' },
        { side: 'right', pos: 'middle', icon: 3, tone: 'strong' },
        { side: 'right', pos: 'lower', icon: 4, tone: 'soft' },
        { side: 'right', pos: 'near', icon: 2, tone: 'mid' }
    ];

    function sleep(ms) {
        return new Promise(function (resolve) { window.setTimeout(resolve, ms); });
    }

    function sideIconMarkup(item, index) {
        const path = ICON_PATHS[item.icon];
        return [
            '<span class="hashcod-hold-side-icon hashcod-hold-side-', item.side,
            ' hashcod-hold-side-', item.pos,
            ' hashcod-hold-side-', item.tone,
            '" style="--side-index:', index, '" aria-hidden="true">',
                '<svg viewBox="0 0 32 32"><path d="', path, '"></path></svg>',
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
                SIDE_ICON_LAYOUT.map(sideIconMarkup).join(''),
            '</div>',
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
