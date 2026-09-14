(function () {
    'use strict';

    if (window.__hashcodDuoPageTransitionLoaded) return;
    window.__hashcodDuoPageTransitionLoaded = true;

    /*
     * Web adaptation of the visual model used by Mac Duo by Makito
     * (Apache-2.0, Copyright 2026 Makito): a screen hinged at its bottom edge
     * recedes in perspective while blur and dimming increase non-linearly.
     * Source reference: https://github.com/sumimakito/Mac-Duo
     *
     * Mac Duo uses blurCurve=1.6, dimCurve=0.7, a bottom hinge and perspective
     * recession. Here those principles are translated to browser animation;
     * no macOS sensor, ScreenCaptureKit or Metal code is included.
     */

    const ARRIVAL_KEY = 'hashcod_duo_open_pending_v1';
    const reducedMotion = Boolean(
        window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
    const CLOSE_MS = reducedMotion ? 130 : 560;
    const OPEN_MS = reducedMotion ? 150 : 620;
    let busy = false;
    let activeAnimations = [];

    function sleep(ms) {
        return new Promise(function (resolve) { window.setTimeout(resolve, ms); });
    }

    function ensureLayers() {
        let shade = document.getElementById('hashcodDuoShade');
        if (!shade) {
            shade = document.createElement('div');
            shade.id = 'hashcodDuoShade';
            shade.setAttribute('aria-hidden', 'true');
            document.body.appendChild(shade);
        }

        let hinge = document.getElementById('hashcodDuoHinge');
        if (!hinge) {
            hinge = document.createElement('div');
            hinge.id = 'hashcodDuoHinge';
            hinge.setAttribute('aria-hidden', 'true');
            document.body.appendChild(hinge);
        }
        return { shade: shade, hinge: hinge };
    }

    function closeFrames() {
        if (reducedMotion) {
            return [
                { opacity: 1, filter: 'none' },
                { opacity: 0.08, filter: 'brightness(.55)' }
            ];
        }
        return [
            {
                offset: 0,
                transform: 'perspective(1400px) rotateX(0deg) translateY(0) scale(1)',
                filter: 'blur(0px) brightness(1)',
                opacity: 1
            },
            {
                offset: 0.34,
                transform: 'perspective(1400px) rotateX(10deg) translateY(.2vh) scale(.997)',
                filter: 'blur(1.4px) brightness(.91)',
                opacity: 1
            },
            {
                offset: 0.7,
                transform: 'perspective(1400px) rotateX(39deg) translateY(2.2vh) scale(.965)',
                filter: 'blur(7px) brightness(.72)',
                opacity: .985
            },
            {
                offset: 1,
                transform: 'perspective(1400px) rotateX(76deg) translateY(7vh) scale(.91)',
                filter: 'blur(18px) brightness(.52)',
                opacity: .08
            }
        ];
    }

    function openFrames() {
        const frames = closeFrames().slice().reverse().map(function (frame, index, list) {
            const copy = Object.assign({}, frame);
            copy.offset = list.length === 1 ? 1 : index / (list.length - 1);
            return copy;
        });
        return frames;
    }

    function animationDone(animation) {
        return animation.finished.catch(function () { return undefined; });
    }

    function cancelActiveAnimations() {
        activeAnimations.forEach(function (animation) {
            try { animation.cancel(); } catch (error) { /* no-op */ }
        });
        activeAnimations = [];
    }

    function beginState() {
        document.documentElement.classList.add('hashcod-duo-transitioning');
        document.documentElement.dataset.hashcodDuoBusy = 'true';
    }

    function endState() {
        cancelActiveAnimations();
        document.documentElement.classList.remove('hashcod-duo-transitioning');
        document.documentElement.classList.remove('hashcod-duo-arrival-pending');
        delete document.documentElement.dataset.hashcodDuoBusy;
        const shade = document.getElementById('hashcodDuoShade');
        const hinge = document.getElementById('hashcodDuoHinge');
        if (shade) shade.style.opacity = '';
        if (hinge) hinge.style.opacity = '';
    }

    async function playClose() {
        if (!document.body) return;
        beginState();
        const layers = ensureLayers();
        cancelActiveAnimations();

        const bodyAnimation = document.body.animate(closeFrames(), {
            duration: CLOSE_MS,
            easing: reducedMotion ? 'linear' : 'cubic-bezier(.22,.61,.24,1)',
            fill: 'forwards'
        });
        const shadeAnimation = layers.shade.animate(
            [{ opacity: 0 }, { opacity: reducedMotion ? .28 : .92 }],
            { duration: CLOSE_MS, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'forwards' }
        );
        const hingeAnimation = layers.hinge.animate(
            [{ opacity: 0 }, { opacity: reducedMotion ? 0 : .74 }],
            { duration: CLOSE_MS, easing: 'ease-out', fill: 'forwards' }
        );

        activeAnimations = [bodyAnimation, shadeAnimation, hingeAnimation];
        await Promise.all(activeAnimations.map(animationDone));
    }

    async function playOpen() {
        if (!document.body) {
            endState();
            return;
        }
        beginState();
        const layers = ensureLayers();

        const bodyAnimation = document.body.animate(openFrames(), {
            duration: OPEN_MS,
            easing: reducedMotion ? 'linear' : 'cubic-bezier(.16,.84,.28,1)',
            fill: 'forwards'
        });
        const shadeAnimation = layers.shade.animate(
            [{ opacity: reducedMotion ? .28 : .92 }, { opacity: 0 }],
            { duration: OPEN_MS, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'forwards' }
        );
        const hingeAnimation = layers.hinge.animate(
            [{ opacity: reducedMotion ? 0 : .74 }, { opacity: 0 }],
            { duration: OPEN_MS, easing: 'ease-out', fill: 'forwards' }
        );

        activeAnimations = [bodyAnimation, shadeAnimation, hingeAnimation];
        await Promise.all(activeAnimations.map(animationDone));
        endState();
    }

    async function run(task) {
        if (typeof task !== 'function') return undefined;
        if (busy) return task();
        busy = true;

        let result;
        let thrown;
        try {
            await playClose();
            try {
                result = task();
            } catch (error) {
                thrown = error;
            }

            /* Give synchronous DOM handoffs enough time to paint without
               forcing a long-running legacy promise to keep the screen black. */
            if (result && typeof result.then === 'function') {
                await Promise.race([
                    Promise.resolve(result).catch(function () { return undefined; }),
                    sleep(reducedMotion ? 20 : 170)
                ]);
            } else {
                await sleep(reducedMotion ? 10 : 70);
            }

            await playOpen();
            if (thrown) throw thrown;
            return await result;
        } finally {
            busy = false;
            if (document.documentElement.classList.contains('hashcod-duo-transitioning')) {
                endState();
            }
        }
    }

    async function navigate(url) {
        if (!url || busy) return;
        busy = true;
        try {
            await playClose();
            try { window.sessionStorage.setItem(ARRIVAL_KEY, '1'); } catch (error) { /* optional */ }
            window.location.assign(url);
        } catch (error) {
            busy = false;
            endState();
            throw error;
        }
    }

    function isEligibleAnchor(anchor, event) {
        if (!anchor || !anchor.href) return false;
        if (event.defaultPrevented || event.button !== 0) return false;
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
        if (anchor.hasAttribute('download')) return false;
        if (anchor.target && anchor.target.toLowerCase() !== '_self') return false;
        if (anchor.dataset.hashcodDuoSkip === 'true') return false;

        let target;
        try { target = new URL(anchor.href, window.location.href); } catch (error) { return false; }
        if (target.origin !== window.location.origin) return false;
        if (target.href === window.location.href) return false;
        if (target.pathname === window.location.pathname && target.search === window.location.search && target.hash) {
            return false;
        }
        return true;
    }

    document.addEventListener('click', function (event) {
        const anchor = event.target && event.target.closest ? event.target.closest('a[href]') : null;
        if (!isEligibleAnchor(anchor, event)) return;
        event.preventDefault();
        navigate(anchor.href).catch(function () {
            window.location.assign(anchor.href);
        });
    }, true);

    function installEnterPlatformWrapper() {
        const current = window.l8EnterPlatform;
        if (typeof current !== 'function') return false;
        if (current.__hashcodDuoWrapped) return true;

        /* Wait until the existing motion/hold wrappers have finished installing,
           so Duo becomes the outer visual layer without bypassing their logic. */
        if (!window.__hashcodPlatformEntryHoldLoaded && !current.__hashcodHoldWrapped) return false;

        const original = current;
        const wrapped = function () {
            const context = this;
            const args = arguments;
            const button = document.getElementById('bootCliEnter');
            if (button && button.dataset.hashcodDuoBusy === 'true') return undefined;
            if (button) button.dataset.hashcodDuoBusy = 'true';

            return run(function () {
                return original.apply(context, args);
            }).finally(function () {
                if (button) delete button.dataset.hashcodDuoBusy;
            });
        };

        Object.defineProperty(wrapped, '__hashcodDuoWrapped', { value: true });
        Object.defineProperty(wrapped, '__hashcodDuoOriginal', { value: original });
        window.l8EnterPlatform = wrapped;
        return true;
    }

    let installAttempts = 0;
    const installTimer = window.setInterval(function () {
        installAttempts += 1;
        if (installEnterPlatformWrapper() || installAttempts >= 60) {
            window.clearInterval(installTimer);
            if (installAttempts >= 60) {
                /* Fallback for deployments where the legacy hold layer is absent. */
                const current = window.l8EnterPlatform;
                if (typeof current === 'function' && !current.__hashcodDuoWrapped) {
                    const original = current;
                    const wrapped = function () {
                        const context = this;
                        const args = arguments;
                        return run(function () { return original.apply(context, args); });
                    };
                    Object.defineProperty(wrapped, '__hashcodDuoWrapped', { value: true });
                    Object.defineProperty(wrapped, '__hashcodDuoOriginal', { value: original });
                    window.l8EnterPlatform = wrapped;
                }
            }
        }
    }, 100);

    async function openPendingArrival() {
        let pending = false;
        try {
            pending = window.sessionStorage.getItem(ARRIVAL_KEY) === '1';
            if (pending) window.sessionStorage.removeItem(ARRIVAL_KEY);
        } catch (error) {
            pending = document.documentElement.classList.contains('hashcod-duo-arrival-pending');
        }
        if (!pending) {
            document.documentElement.classList.remove('hashcod-duo-arrival-pending');
            return;
        }
        await new Promise(function (resolve) {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', resolve, { once: true });
            } else {
                resolve();
            }
        });
        await playOpen();
    }

    window.HashcodDuoTransition = Object.freeze({
        run: run,
        close: playClose,
        open: playOpen,
        navigate: navigate
    });

    openPendingArrival().catch(function () {
        endState();
    });
})();
