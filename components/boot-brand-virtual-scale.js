(function () {
    'use strict';

    if (window.__hashcodBootBrandVirtualScaleLoaded) return;
    window.__hashcodBootBrandVirtualScaleLoaded = true;

    function isVirtualPlatform() {
        const host = String(window.location.hostname || '').toLowerCase();
        if (!host) return false;
        if (host === 'localhost' || host === '127.0.0.1' || host === '::1') return false;
        if (host.endsWith('.test')) return false;
        return true;
    }

    function desiredScale() {
        const width = window.innerWidth || document.documentElement.clientWidth || 1440;
        if (width >= 1200) return 1.95;
        if (width >= 960) return 1.75;
        if (width >= 760) return 1.50;
        return 1.16;
    }

    function apply() {
        if (!isVirtualPlatform()) return false;

        const brand = document.querySelector('.boot-brand');
        if (!brand) return false;

        const scale = desiredScale();
        brand.style.setProperty('scale', String(scale), 'important');
        brand.style.setProperty('transform-origin', 'center center', 'important');
        brand.style.setProperty('overflow', 'visible', 'important');
        brand.setAttribute('data-hashcod-virtual-lockup-scale', String(scale));

        // Recalculate the metadata left edge in the brand's unscaled coordinate
        // system. getBoundingClientRect() already includes CSS scale, so divide
        // by the effective scale to prevent a second horizontal scaling.
        const text = brand.querySelector('.boot-brand-text');
        const credit = brand.querySelector('.boot-brand-logos.hashcod-credit-under-brand');
        if (text && credit && brand.offsetWidth > 0) {
            const brandRect = brand.getBoundingClientRect();
            const textRect = text.getBoundingClientRect();
            const effectiveScale = brandRect.width / brand.offsetWidth || scale || 1;
            const localLeft = (textRect.left - brandRect.left) / effectiveScale;
            if (Number.isFinite(localLeft)) {
                const value = localLeft.toFixed(2) + 'px';
                brand.style.setProperty('--hashcod-credit-text-left', value);
                credit.style.setProperty('--hashcod-credit-text-left', value);
            }
        }

        return true;
    }

    let applyFrame = 0;
    let settleTimer = 0;

    function schedule() {
        if (!applyFrame) {
            applyFrame = requestAnimationFrame(function () {
                applyFrame = 0;
                apply();
            });
        }
        if (settleTimer) window.clearTimeout(settleTimer);
        settleTimer = window.setTimeout(function () {
            settleTimer = 0;
            apply();
        }, 180);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', schedule, { once: true });
    } else {
        schedule();
    }

    const observer = new MutationObserver(function (records) {
        const relevant = records.some(function (record) {
            return Array.from(record.addedNodes || []).some(function (node) {
                if (!node || node.nodeType !== 1) return false;
                if (node.matches && node.matches('.boot-brand, .boot-brand-text, .boot-brand-logos')) return true;
                return Boolean(node.querySelector && node.querySelector('.boot-brand, .boot-brand-text, .boot-brand-logos'));
            });
        });
        if (relevant) schedule();
    });
    observer.observe(document.body || document.documentElement, { childList: true, subtree: true });
    window.addEventListener('resize', schedule, { passive: true });

    function stop() {
        observer.disconnect();
        if (applyFrame) cancelAnimationFrame(applyFrame);
        if (settleTimer) window.clearTimeout(settleTimer);
        applyFrame = 0;
        settleTimer = 0;
    }
    window.addEventListener('hashcod:final-entry-screen', stop, { once: true });
    window.addEventListener('hashcod:platform-entered', stop, { once: true });
})();
