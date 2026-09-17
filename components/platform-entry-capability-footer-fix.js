(function () {
    'use strict';

    if (window.__hashcodEntryCapabilityFooterFixLoaded) return;
    window.__hashcodEntryCapabilityFooterFixLoaded = true;

    const current = document.currentScript;
    const currentSrc = current && current.src ? current.src : '';
    const componentBase = currentSrc && currentSrc.lastIndexOf('/') >= 0
        ? currentSrc.slice(0, currentSrc.lastIndexOf('/') + 1)
        : '/components/';

    (function loadUxSystem() {
        if (document.querySelector('script[data-hashcod-ux-system]')) return;
        const style = document.createElement('link');
        style.id = 'hashcodUxSystemStyles';
        style.rel = 'stylesheet';
        style.href = componentBase + 'hashcod-ux-system.css?v=20260917-1';
        document.head.appendChild(style);

        const compat = document.createElement('link');
        compat.id = 'hashcodUxDarkCompatStyles';
        compat.rel = 'stylesheet';
        compat.href = componentBase + 'hashcod-ux-dark-compat.css?v=20260917-1';
        document.head.appendChild(compat);

        const script = document.createElement('script');
        script.src = componentBase + 'hashcod-ux-system.js?v=20260917-1';
        script.defer = true;
        script.dataset.hashcodUxSystem = 'true';
        document.head.appendChild(script);
    })();

    (function loadGodsEyeView() {
        if (document.querySelector('script[data-hashcod-gods-eye-view-loader]')) return;
        const script = document.createElement('script');
        script.src = componentBase + 'gods-eye-view-loader.js?v=20260917-starlink1';
        script.defer = true;
        script.dataset.hashcodGodsEyeViewLoader = 'true';
        document.head.appendChild(script);
    })();

    const FOOTER_ID = 'hashcodEntryCapabilityFooter';
    const DESKTOP_LANDING_MIN_WIDTH = 1181;

    function setImportant(element, property, value) {
        if (!element) return;
        element.style.setProperty(property, value, 'important');
    }

    function applyUxActionPlacement() {
        const actions = document.getElementById('hashcodUxActions');
        if (!actions) return false;

        setImportant(actions, 'position', 'fixed');
        setImportant(actions, 'left', '18px');
        setImportant(actions, 'top', '18px');
        setImportant(actions, 'right', 'auto');
        setImportant(actions, 'bottom', 'auto');
        setImportant(actions, 'margin', '0');
        setImportant(actions, 'z-index', '2147482800');
        actions.setAttribute('data-hashcod-top-left-controls', 'true');
        return true;
    }

    function restoreLandingBrandPlacement() {
        if ((window.innerWidth || 0) < DESKTOP_LANDING_MIN_WIDTH) return false;

        const overlay = document.getElementById('bootCliOverlay');
        const brand = overlay && overlay.querySelector('.boot-brand');
        const folder = document.getElementById('hashcodRareFolderHost');
        if (!overlay || !brand || !folder) return false;

        // PR #140 temporarily translated the brand to center the whole lockup.
        // The brand itself must remain in its original boot-screen position;
        // only the Rare UI folder moves next to it.
        if (brand.dataset.hashcodLandingBrandOffsetX) {
            delete brand.dataset.hashcodLandingBrandOffsetX;
        }
        brand.style.removeProperty('translate');
        brand.setAttribute('data-hashcod-original-placement-restored', 'true');

        const overlayRect = overlay.getBoundingClientRect();
        const brandRect = brand.getBoundingClientRect();
        const folderRect = folder.getBoundingClientRect();
        if (!overlayRect.width || !brandRect.width || !folderRect.width) return false;

        const gap = Math.max(76, Math.min(112, overlayRect.width * 0.05));
        const halfFolder = folderRect.width / 2;
        const minCenterX = overlayRect.left + halfFolder + 24;
        const maxCenterX = overlayRect.right - halfFolder - 24;
        const desiredCenterX = brandRect.left - gap - halfFolder;
        const desiredCenterY = brandRect.top + (brandRect.height / 2);
        const centerX = Math.max(minCenterX, Math.min(maxCenterX, desiredCenterX));

        setImportant(folder, 'position', 'fixed');
        setImportant(folder, 'left', centerX.toFixed(2) + 'px');
        setImportant(folder, 'top', desiredCenterY.toFixed(2) + 'px');
        folder.setAttribute('data-hashcod-brand-anchor-restored', 'true');
        return true;
    }

    function applyLayout() {
        applyUxActionPlacement();
        restoreLandingBrandPlacement();

        const footer = document.getElementById(FOOTER_ID);
        if (!footer) return false;

        const compact = window.matchMedia && window.matchMedia('(max-width: 900px)').matches;
        const mobile = window.matchMedia && window.matchMedia('(max-width: 600px)').matches;

        setImportant(footer, 'position', 'absolute');
        setImportant(footer, 'left', '50%');
        setImportant(footer, 'right', 'auto');
        setImportant(footer, 'top', 'auto');
        setImportant(footer, 'bottom', compact ? '88px' : '28px');
        setImportant(footer, 'transform', 'translateX(-50%)');
        setImportant(footer, 'margin', '0');
        setImportant(footer, 'padding', '0');
        setImportant(footer, 'width', compact ? 'calc(100vw - 32px)' : 'min(820px, calc(100vw - 360px))');
        setImportant(footer, 'max-width', compact ? '720px' : '820px');
        setImportant(footer, 'min-height', '24px');
        setImportant(footer, 'display', 'flex');
        setImportant(footer, 'flex-direction', 'row');
        setImportant(footer, 'align-items', 'center');
        setImportant(footer, 'justify-content', 'center');
        setImportant(footer, 'gap', mobile ? '7px' : '8px');
        setImportant(footer, 'box-sizing', 'border-box');
        setImportant(footer, 'z-index', '20');
        setImportant(footer, 'font-family', "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace");
        setImportant(footer, 'font-size', mobile ? '9px' : compact ? '10px' : 'clamp(10px, .76vw, 13px)');
        setImportant(footer, 'font-weight', '600');
        setImportant(footer, 'line-height', '1.3');
        setImportant(footer, 'letter-spacing', '.02em');
        setImportant(footer, 'text-align', 'center');
        setImportant(footer, 'color', 'var(--hashcod-ux-text, #1b1b1b)');
        setImportant(footer, 'pointer-events', 'none');

        const icon = footer.querySelector('.hashcod-hold-capability-icon');
        if (icon) {
            const size = mobile ? '16px' : '20px';
            setImportant(icon, 'width', size);
            setImportant(icon, 'height', size);
            setImportant(icon, 'min-width', size);
            setImportant(icon, 'max-width', size);
            setImportant(icon, 'min-height', size);
            setImportant(icon, 'max-height', size);
            setImportant(icon, 'flex', '0 0 ' + size);
            setImportant(icon, 'display', 'block');
            setImportant(icon, 'position', 'static');
            setImportant(icon, 'transform', 'none');
            setImportant(icon, 'margin', '0');
        }

        const text = footer.querySelector('.hashcod-hold-capability-text');
        if (text) {
            setImportant(text, 'display', 'block');
            setImportant(text, 'position', 'static');
            setImportant(text, 'margin', '0');
            setImportant(text, 'padding', '0');
            setImportant(text, 'max-width', compact ? 'calc(100% - 26px)' : '760px');
            setImportant(text, 'white-space', compact ? 'normal' : 'nowrap');
        }

        return true;
    }

    function scheduleApply() {
        window.requestAnimationFrame(function () {
            applyLayout();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', scheduleApply, { once: true });
    } else {
        scheduleApply();
    }

    // Rare UI performs a few delayed placement passes while fonts/assets settle.
    // Re-apply after those passes so the restored brand location remains final.
    [60, 220, 850, 1650, 2200].forEach(function (delay) {
        window.setTimeout(scheduleApply, delay);
    });
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(scheduleApply).catch(function () {});
    }

    const observer = new MutationObserver(scheduleApply);
    observer.observe(document.documentElement, { childList: true, subtree: true });
    window.addEventListener('resize', scheduleApply, { passive: true });
})();
