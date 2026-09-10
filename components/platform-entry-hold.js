(function () {
    'use strict';

    if (window.__hashcodPlatformEntryHoldLoaded) return;
    window.__hashcodPlatformEntryHoldLoaded = true;

    const READY_DELAY_MS = 3600;
    let holdPromise = null;

    // Existing Hashcod vectors plus the six additional vectors supplied for the entry scene.
    // Store complete SVG bodies so rect/polygon geometry is preserved exactly where applicable.
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
        { icon: 6, pos: '14', tone: 'soft' }
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
            '<div class="hashcod-hold-topline">',
                '<span>HASHCOD / SECURE ENTRY</span>',
                '<span id="hashcodHoldCounter">01 / 04</span>',
            '</div>',
            '<div class="hashcod-hold-side-field" aria-hidden="true">',
                SCATTER.map(iconMarkup).join(''),
            '</div>',
            '<div class="hashcod-hold-center">',
                '<div class="hashcod-hold-status" id="hashcodHoldStatus" role="status" aria-live="polite">VERIFYING ACCESS</div>',
                '<div class="hashcod-hold-progress" aria-hidden="true"><span id="hashcodHoldProgress"></span></div>',
                '<div class="hashcod-hold-phase-line" id="hashcodHoldPhaseLine">IDENTITY / SESSION / CRYPTO / WORKSPACE</div>',
            '</div>',
            '<div class="hashcod-hold-cta-wrap">',
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
        const continueButton = overlay.querySelector('#hashcodHoldContinue');
        const help = overlay.querySelector('#hashcodHoldHelp');
        const phaseLine = overlay.querySelector('#hashcodHoldPhaseLine');

        const phases = [
            { at: 0, text: 'VERIFYING ACCESS', counter: '01 / 04', width: '24%', phase: 'IDENTITY' },
            { at: 900, text: 'VALIDATING SECURE SESSION', counter: '02 / 04', width: '49%', phase: 'SESSION' },
            { at: 1800, text: 'CHECKING CRYPTO MODULES', counter: '03 / 04', width: '74%', phase: 'CRYPTO' },
            { at: 2700, text: 'PREPARING HASHCOD WORKSPACE', counter: '04 / 04', width: '100%', phase: 'WORKSPACE' }
        ];

        phases.forEach(function (phase) {
            window.setTimeout(function () {
                if (!overlay.isConnected) return;
                status.textContent = phase.text;
                counter.textContent = phase.counter;
                progress.style.width = phase.width;
                phaseLine.textContent = phase.phase + ' / HASHCOD';
            }, phase.at);
        });

        await sleep(READY_DELAY_MS);
        if (!overlay.isConnected) return;

        overlay.classList.add('is-ready');
        status.textContent = 'ACCESS GRANTED';
        phaseLine.textContent = 'SECURE SESSION READY';
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
            await prepareOverlay(overlay);
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

        // Bypass the earlier auto-advancing motion wrapper. This manual gate is authoritative.
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
