(function () {
    'use strict';

    if (window.__hashcodLocalDownloadLayoutFixLoaded) return;
    window.__hashcodLocalDownloadLayoutFixLoaded = true;

    function isVirtualPlatform() {
        const host = String(window.location.hostname || '').toLowerCase();
        if (!host) return false;
        if (host === 'localhost' || host === '127.0.0.1' || host === '::1') return false;
        if (host.endsWith('.test')) return false;
        return true;
    }

    function apply() {
        const brand = document.querySelector('.boot-brand');
        const credit = document.querySelector('.boot-brand-logos.hashcod-credit-under-brand, .boot-brand-logos');
        const row = document.querySelector('.hashcod-local-download-row');
        if (!brand || !credit || !row) return false;

        if (!isVirtualPlatform()) {
            row.remove();
            return true;
        }

        if (window.getComputedStyle(brand).position === 'static') {
            brand.style.setProperty('position', 'relative', 'important');
        }
        brand.style.setProperty('overflow', 'visible', 'important');

        let left = brand.style.getPropertyValue('--hashcod-credit-text-left');
        if (!left) {
            const brandRect = brand.getBoundingClientRect();
            const creditRect = credit.getBoundingClientRect();
            const scale = brand.offsetWidth > 0 ? (brandRect.width / brand.offsetWidth || 1) : 1;
            if (brandRect.width > 0 && creditRect.width > 0) {
                left = ((creditRect.left - brandRect.left) / scale).toFixed(2) + 'px';
                brand.style.setProperty('--hashcod-credit-text-left', left);
            } else {
                left = '50%';
            }
        }

        row.style.setProperty('position', 'absolute', 'important');
        row.style.setProperty('left', 'var(--hashcod-credit-text-left, ' + left + ')', 'important');
        row.style.setProperty('top', 'calc(100% + 36px)', 'important');
        row.style.setProperty('right', 'auto', 'important');
        row.style.setProperty('bottom', 'auto', 'important');
        row.style.setProperty('display', 'inline-flex', 'important');
        row.style.setProperty('visibility', 'visible', 'important');
        row.style.setProperty('opacity', '1', 'important');
        row.style.setProperty('align-items', 'center', 'important');
        row.style.setProperty('justify-content', 'flex-start', 'important');
        row.style.setProperty('gap', '6px', 'important');
        row.style.setProperty('width', 'max-content', 'important');
        row.style.setProperty('min-width', '0', 'important');
        row.style.setProperty('min-height', '20px', 'important');
        row.style.setProperty('margin', '0', 'important');
        row.style.setProperty('padding', '2px 3px 2px 0', 'important');
        row.style.setProperty('white-space', 'nowrap', 'important');
        row.style.setProperty('pointer-events', 'auto', 'important');
        row.style.setProperty('z-index', '9', 'important');
        row.style.setProperty('font-family', 'inherit', 'important');
        row.style.setProperty('text-decoration', 'none', 'important');
        row.style.setProperty('cursor', 'pointer', 'important');

        const icon = row.querySelector('.hashcod-local-download-icon');
        if (icon) {
            icon.style.setProperty('display', 'inline-flex', 'important');
            icon.style.setProperty('visibility', 'visible', 'important');
            icon.style.setProperty('align-items', 'center', 'important');
            icon.style.setProperty('justify-content', 'center', 'important');
            icon.style.setProperty('width', '18px', 'important');
            icon.style.setProperty('height', '18px', 'important');
            icon.style.setProperty('min-width', '18px', 'important');
            icon.style.setProperty('flex', '0 0 18px', 'important');
            icon.style.setProperty('color', '#4a4a4a', 'important');

            const svg = icon.querySelector('svg');
            if (svg) {
                svg.setAttribute('width', '15');
                svg.setAttribute('height', '15');
                svg.style.setProperty('display', 'block', 'important');
                svg.style.setProperty('width', '15px', 'important');
                svg.style.setProperty('height', '15px', 'important');
                svg.style.setProperty('fill', 'currentColor', 'important');
                svg.style.setProperty('overflow', 'visible', 'important');
            }
        }

        const text = row.querySelector('.hashcod-local-download-text');
        if (text) {
            text.style.setProperty('display', 'inline-block', 'important');
            text.style.setProperty('visibility', 'visible', 'important');
            text.style.setProperty('margin', '0', 'important');
            text.style.setProperty('padding', '0', 'important');
            text.style.setProperty('color', '#747474', 'important');
            text.style.setProperty('font-size', '9.5px', 'important');
            text.style.setProperty('font-weight', '400', 'important');
            text.style.setProperty('line-height', '1.1', 'important');
            text.style.setProperty('letter-spacing', '-0.01em', 'important');
            text.style.setProperty('white-space', 'nowrap', 'important');
        }

        row.setAttribute('data-hashcod-local-download-ready', 'true');
        return true;
    }

    function schedule() {
        requestAnimationFrame(apply);
        setTimeout(apply, 80);
        setTimeout(apply, 300);
        setTimeout(apply, 900);
        setTimeout(apply, 1800);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', schedule, { once: true });
    } else {
        schedule();
    }

    const observer = new MutationObserver(function () { apply(); });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    window.addEventListener('resize', schedule, { passive: true });
})();