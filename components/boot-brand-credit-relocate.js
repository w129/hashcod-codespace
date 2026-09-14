(function () {
    'use strict';

    if (window.__hashcodBootBrandCreditRelocateLoaded) return;
    window.__hashcodBootBrandCreditRelocateLoaded = true;

    const CREDIT_ICON_VERSION = '20260914-5';
    const CREDIT_ICON_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true" focusable="false">'
        + '<circle cx="4" cy="7" r="1"/><circle cx="13" cy="7" r="1"/><circle cx="16" cy="7" r="1"/><circle cx="16" cy="4" r="1"/><circle cx="19" cy="7" r="1"/><circle cx="28" cy="7" r="1"/>'
        + '<circle cx="4" cy="10" r="1"/><circle cx="1" cy="10" r="1"/><circle cx="7" cy="10" r="1"/><circle cx="16" cy="10" r="1"/><circle cx="25" cy="10" r="1"/><circle cx="28" cy="10" r="1"/><circle cx="31" cy="10" r="1"/>'
        + '<circle cx="4" cy="13" r="1"/><circle cx="13" cy="13" r="1"/><circle cx="16" cy="13" r="1"/><circle cx="19" cy="13" r="1"/><circle cx="28" cy="13" r="1"/>'
        + '<circle cx="4" cy="16" r="1"/><circle cx="7" cy="16" r="1"/><circle cx="13" cy="16" r="1"/><circle cx="16" cy="16" r="1"/><circle cx="19" cy="16" r="1"/><circle cx="25" cy="16" r="1"/><circle cx="28" cy="16" r="1"/>'
        + '<circle cx="4" cy="19" r="1"/><circle cx="7" cy="19" r="1"/><circle cx="10" cy="19" r="1"/><circle cx="13" cy="19" r="1"/><circle cx="16" cy="19" r="1"/><circle cx="19" cy="19" r="1"/><circle cx="22" cy="19" r="1"/><circle cx="25" cy="19" r="1"/><circle cx="28" cy="19" r="1"/>'
        + '<circle cx="4" cy="22" r="1"/><circle cx="7" cy="22" r="1"/><circle cx="10" cy="22" r="1"/><circle cx="13" cy="22" r="1"/><circle cx="16" cy="22" r="1"/><circle cx="19" cy="22" r="1"/><circle cx="22" cy="22" r="1"/><circle cx="25" cy="22" r="1"/><circle cx="28" cy="22" r="1"/>'
        + '<circle cx="4" cy="28" r="1"/><circle cx="7" cy="28" r="1"/><circle cx="10" cy="28" r="1"/><circle cx="13" cy="28" r="1"/><circle cx="16" cy="28" r="1"/><circle cx="19" cy="28" r="1"/><circle cx="22" cy="28" r="1"/><circle cx="25" cy="28" r="1"/><circle cx="28" cy="28" r="1"/>'
        + '</svg>';

    function publicAsset(path) {
        const baseEl = document.querySelector('base[href]');
        const baseHref = baseEl ? baseEl.getAttribute('href') : '/';
        try {
            return new URL(path, new URL(baseHref, window.location.href)).toString();
        } catch (_) {
            return path;
        }
    }

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

    function ensureCreditIcon(credit) {
        if (!credit) return;

        const legacyGithub = credit.querySelector('.boot-github-logo');
        if (legacyGithub) {
            legacyGithub.style.setProperty('display', 'none', 'important');
            legacyGithub.style.setProperty('visibility', 'hidden', 'important');
            legacyGithub.setAttribute('aria-hidden', 'true');
        }

        let icon = credit.querySelector('.hashcod-credit-crown-icon');
        if (icon && icon.tagName === 'IMG') {
            const replacement = document.createElement('span');
            replacement.className = 'hashcod-credit-crown-icon';
            replacement.setAttribute('aria-hidden', 'true');
            icon.replaceWith(replacement);
            icon = replacement;
        }

        if (!icon) {
            icon = document.createElement('span');
            icon.className = 'hashcod-credit-crown-icon';
            icon.setAttribute('aria-hidden', 'true');
            const textMark = credit.querySelector('.boot-hashcod-logo');
            if (textMark) {
                credit.insertBefore(icon, textMark);
            } else {
                credit.insertBefore(icon, credit.firstChild);
            }
        }

        if (icon.getAttribute('data-icon-version') !== CREDIT_ICON_VERSION) {
            icon.innerHTML = CREDIT_ICON_SVG;
            icon.setAttribute('data-icon-version', CREDIT_ICON_VERSION);
        }

        icon.style.setProperty('display', 'inline-flex', 'important');
        icon.style.setProperty('visibility', 'visible', 'important');
        icon.style.setProperty('width', '24px', 'important');
        icon.style.setProperty('height', '24px', 'important');
        icon.style.setProperty('min-width', '24px', 'important');
        icon.style.setProperty('color', '#7f7f7f', 'important');
        icon.style.setProperty('opacity', '1', 'important');
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
        ensureCreditIcon(credit);
        forceBelowLayout(brand, credit);

        window.requestAnimationFrame(function () {
            ensureCreditIcon(credit);
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
