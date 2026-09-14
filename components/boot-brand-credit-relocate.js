(function () {
    'use strict';

    if (window.__hashcodBootBrandCreditRelocateLoaded) return;
    window.__hashcodBootBrandCreditRelocateLoaded = true;

    function loadPercentFeatureAssets() {
        const version = '20260914-1';
        const baseEl = document.querySelector('base[href]');
        const baseHref = baseEl ? baseEl.getAttribute('href') : '/';
        let baseUrl = '/';
        try {
            baseUrl = new URL(baseHref, window.location.href).toString();
        } catch (_) {}

        let link = document.querySelector('link[data-hashcod-percent-feature-style]');
        if (!link) {
            link = document.createElement('link');
            link.rel = 'stylesheet';
            link.setAttribute('data-hashcod-percent-feature-style', 'true');
            document.head.appendChild(link);
        }
        link.href = new URL('components/percent-feature-button.css?v=' + version, baseUrl).toString();

        let percentScript = document.querySelector('script[data-hashcod-percent-feature]');
        if (!percentScript) {
            percentScript = document.createElement('script');
            percentScript.defer = true;
            percentScript.setAttribute('data-hashcod-percent-feature', 'true');
            percentScript.src = new URL('components/percent-feature-button.js?v=' + version, baseUrl).toString();
            document.head.appendChild(percentScript);
        }

        if (!document.querySelector('script[data-hashcod-auth-tabs-rescue]')) {
            const rescueScript = document.createElement('script');
            rescueScript.defer = true;
            rescueScript.src = new URL('components/auth-tabs-rescue.js?v=' + version, baseUrl).toString();
            rescueScript.setAttribute('data-hashcod-auth-tabs-rescue', 'true');
            document.head.appendChild(rescueScript);
        }
    }

    function visibleRect(element) {
        if (!element || typeof element.getBoundingClientRect !== 'function') return null;
        const rect = element.getBoundingClientRect();
        if (!rect || rect.width <= 0 || rect.height <= 0) return null;
        return rect;
    }

    function forceBelowLayout(brand, credit) {
        const brandPosition = window.getComputedStyle(brand).position;
        if (brandPosition === 'static') {
            brand.style.setProperty('position', 'relative', 'important');
        }
        brand.style.setProperty('overflow', 'visible', 'important');

        credit.style.setProperty('position', 'absolute', 'important');
        credit.style.setProperty('left', 'var(--hashcod-credit-text-left, 50%)', 'important');
        credit.style.setProperty('top', 'calc(100% + 10px)', 'important');
        credit.style.setProperty('right', 'auto', 'important');
        credit.style.setProperty('bottom', 'auto', 'important');
        credit.style.setProperty('transform', 'none', 'important');
        credit.style.setProperty('width', 'max-content', 'important');
        credit.style.setProperty('min-width', '0', 'important');
        credit.style.setProperty('height', 'auto', 'important');
        credit.style.setProperty('margin', '0', 'important');
        credit.style.setProperty('padding', '0', 'important');
        credit.style.setProperty('display', 'flex', 'important');
        credit.style.setProperty('align-items', 'center', 'important');
        credit.style.setProperty('justify-content', 'flex-start', 'important');
        credit.style.setProperty('white-space', 'nowrap', 'important');
        credit.style.setProperty('z-index', '8', 'important');
        credit.style.setProperty('pointer-events', 'none', 'important');
    }

    function alignCredit(brand, credit) {
        const brandRect = visibleRect(brand);
        if (!brandRect) return;

        const text = brand.querySelector('.boot-brand-text');
        const textRect = visibleRect(text);
        if (textRect) {
            const textLeft = textRect.left - brandRect.left;
            credit.style.setProperty('--hashcod-credit-text-left', textLeft.toFixed(2) + 'px');
            return;
        }

        const childRects = Array.prototype.slice.call(brand.children)
            .filter(function (child) { return child !== credit; })
            .map(visibleRect)
            .filter(Boolean);

        if (!childRects.length) {
            credit.style.removeProperty('--hashcod-credit-text-left');
            return;
        }

        const fallbackLeft = Math.max.apply(null, childRects.map(function (rect) { return rect.left; })) - brandRect.left;
        credit.style.setProperty('--hashcod-credit-text-left', fallbackLeft.toFixed(2) + 'px');
    }

    function relocate() {
        const brand = document.querySelector('.boot-brand');
        const credit = document.querySelector('.boot-brand-logos');
        if (!brand || !credit) return false;

        if (credit.parentElement !== brand) {
            brand.appendChild(credit);
        }

        credit.classList.add('hashcod-credit-under-brand');
        forceBelowLayout(brand, credit);

        window.requestAnimationFrame(function () {
            alignCredit(brand, credit);
            forceBelowLayout(brand, credit);
        });
        return true;
    }

    function scheduleRelocate() {
        window.requestAnimationFrame(relocate);
    }

    loadPercentFeatureAssets();

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', scheduleRelocate, { once: true });
    } else {
        scheduleRelocate();
    }

    const observer = new MutationObserver(scheduleRelocate);
    observer.observe(document.documentElement, { childList: true, subtree: true });
    window.addEventListener('resize', scheduleRelocate, { passive: true });
})();
