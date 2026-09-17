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

    const DOWNLOAD_ICON_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30" aria-hidden="true" focusable="false">'
        + '<path d="M15 1C14.448 1 14 1.448 14 2v4h2V2c0-.552-.448-1-1-1zm1 5v12.585938l2.292969-2.292969c.391-.391 1.023062-.391 1.414062 0 .391.391.391 1.023062 0 1.414062l-4 4A.997.997 0 0 1 15 22a.997.997 0 0 1-.707031-.292969l-4-4c-.391-.391-.391-1.023062 0-1.414062.391-.391 1.023062-.391 1.414062 0L14 18.585938V6H6c-1.105 0-2 .895-2 2v17c0 1.105.895 2 2 2h18c1.105 0 2-.895 2-2V8c0-1.105-.895-2-2-2h-8z"/>'
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

    function isVirtualPlatform() {
        const host = String(window.location.hostname || '').toLowerCase();
        if (!host) return false;
        if (host === 'localhost' || host === '127.0.0.1' || host === '::1') return false;
        if (host.endsWith('.test')) return false;
        return true;
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

        // Rebuild this row as a deterministic creator credit. Older builds used
        // image assets inside .boot-brand-logos; when one of those assets was
        // hidden or stale it left only the dotted icon visible.
        let icon = credit.querySelector('.hashcod-credit-crown-icon');
        if (!icon) {
            icon = document.createElement('span');
            icon.className = 'hashcod-credit-crown-icon';
            icon.setAttribute('aria-hidden', 'true');
            credit.prepend(icon);
        }
        if (icon.getAttribute('data-icon-version') !== CREDIT_ICON_VERSION) {
            icon.innerHTML = CREDIT_ICON_SVG;
            icon.setAttribute('data-icon-version', CREDIT_ICON_VERSION);
        }

        let label = credit.querySelector('.hashcod-credit-text');
        if (!label) {
            label = document.createElement('span');
            label.className = 'hashcod-credit-text';
            credit.appendChild(label);
        }
        label.innerHTML = 'Created by <strong>diktatcart</strong>';

        credit.querySelectorAll('.boot-github-logo,.boot-hashcod-logo').forEach(function (legacy) {
            legacy.style.setProperty('display', 'none', 'important');
            legacy.style.setProperty('visibility', 'hidden', 'important');
            legacy.setAttribute('aria-hidden', 'true');
        });

        icon.style.setProperty('display', 'inline-flex', 'important');
        icon.style.setProperty('visibility', 'visible', 'important');
        icon.style.setProperty('width', '20px', 'important');
        icon.style.setProperty('height', '20px', 'important');
        icon.style.setProperty('min-width', '20px', 'important');
        icon.style.setProperty('color', '#6f6f6f', 'important');
        icon.style.setProperty('opacity', '1', 'important');
    }

    function ensureLocalDownloadRow(brand) {
        let row = brand.querySelector('.hashcod-local-download-row');

        if (!isVirtualPlatform()) {
            if (row) row.remove();
            return;
        }

        // The complete row is the link. This prevents the old state where the
        // label remained visible but the tiny icon/link disappeared.
        if (!row || row.tagName !== 'A') {
            const replacement = document.createElement('a');
            replacement.className = 'hashcod-local-download-row hashcod-local-download-button';
            replacement.setAttribute('data-hashcod-local-download', 'true');
            if (row) row.replaceWith(replacement);
            else brand.appendChild(replacement);
            row = replacement;
        }

        row.href = publicAsset('download-local-version');
        row.setAttribute('download', 'Hashcod-Codespace-Setup.exe');
        row.setAttribute('aria-label', 'Download the local version');
        row.setAttribute('title', 'Download the local version');
        row.setAttribute('data-hashcod-local-download-ready', 'true');

        let icon = row.querySelector('.hashcod-local-download-icon');
        if (!icon) {
            icon = document.createElement('span');
            icon.className = 'hashcod-local-download-icon';
            icon.setAttribute('aria-hidden', 'true');
            row.prepend(icon);
        }
        icon.innerHTML = DOWNLOAD_ICON_SVG;

        let text = row.querySelector('.hashcod-local-download-text');
        if (!text) {
            text = document.createElement('span');
            text.className = 'hashcod-local-download-text';
            row.appendChild(text);
        }
        text.textContent = 'Download the local version.';
    }

    function alignCredit(brand, credit) {
        const brandRect = visibleRect(brand);
        if (!brandRect) return;

        const text = brand.querySelector('.boot-brand-text');
        const textRect = visibleRect(text);
        if (textRect) {
            const textLeft = textRect.left - brandRect.left;
            credit.style.setProperty('--hashcod-credit-text-left', textLeft.toFixed(2) + 'px');
            brand.style.setProperty('--hashcod-credit-text-left', textLeft.toFixed(2) + 'px');
            return;
        }

        const childRects = Array.prototype.slice.call(brand.children)
            .filter(function (child) {
                return child !== credit && !child.classList.contains('hashcod-local-download-row');
            })
            .map(visibleRect)
            .filter(Boolean);

        if (!childRects.length) {
            credit.style.removeProperty('--hashcod-credit-text-left');
            brand.style.removeProperty('--hashcod-credit-text-left');
            return;
        }

        const fallbackLeft = Math.max.apply(null, childRects.map(function (rect) { return rect.left; })) - brandRect.left;
        const fallbackValue = fallbackLeft.toFixed(2) + 'px';
        credit.style.setProperty('--hashcod-credit-text-left', fallbackValue);
        brand.style.setProperty('--hashcod-credit-text-left', fallbackValue);
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
        ensureLocalDownloadRow(brand);

        window.requestAnimationFrame(function () {
            ensureCreditIcon(credit);
            alignCredit(brand, credit);
            forceBelowLayout(brand, credit);
            ensureLocalDownloadRow(brand);
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
