(function () {
    'use strict';

    if (window.__hashcodEntryCapabilityFooterFixLoaded) return;
    window.__hashcodEntryCapabilityFooterFixLoaded = true;

    const current = document.currentScript;
    const currentSrc = current && current.src ? current.src : '';
    const componentBase = currentSrc && currentSrc.lastIndexOf('/') >= 0
        ? currentSrc.slice(0, currentSrc.lastIndexOf('/') + 1)
        : '/components/';

    (function loadSeoSignals() {
        if (document.querySelector('script[data-hashcod-seo]')) return;
        const script = document.createElement('script');
        script.src = componentBase + 'hashcod-seo.js?v=20260917-1';
        script.defer = true;
        script.dataset.hashcodSeo = 'true';
        document.head.appendChild(script);
    })();

    (function loadRareFolderRescue() {
        if (document.querySelector('script[data-hashcod-rare-folder-rescue]')) return;
        const script = document.createElement('script');
        script.src = componentBase + 'rare-folder-rescue.js?v=20260917-rescue2';
        script.defer = true;
        script.dataset.hashcodRareFolderRescue = 'true';
        document.head.appendChild(script);
    })();

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
        script.src = componentBase + 'hashcod-ux-system.js?v=20260919-perf1';
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

    (function installRegistrationPaymentFixStyles() {
        if (document.getElementById('hashcodRegistrationPaymentFixStyles')) return;
        const style = document.createElement('style');
        style.id = 'hashcodRegistrationPaymentFixStyles';
        style.textContent = [
            '#hashcodPlatformRegistration,#hashcodPlatformRegistration *{box-sizing:border-box;}',
            '.hashcod-registration-faq-panel-inner{max-width:100%;}',
            '.hashcod-registration-price-list{width:100%;max-width:100%;}',
            '.hashcod-registration-price-list>div{width:100%;min-width:0;max-width:100%;box-sizing:border-box;}',
            '.hashcod-registration-price-list>div span{min-width:0;max-width:100%;overflow-wrap:anywhere;word-break:break-word;line-height:1.35;}',
            '.hashcod-registration-price-list>div strong{justify-self:end;text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums;}',
            '@media(max-width:620px){#hashcodPlatformRegistration{padding-left:max(14px,env(safe-area-inset-left));padding-right:max(14px,env(safe-area-inset-right));}.hashcod-registration-price-list>div{grid-template-columns:minmax(0,1fr) auto!important;gap:8px!important;align-items:center;padding:6px 0;}.hashcod-registration-price-list>div span{font-size:9.5px;}.hashcod-registration-price-list>div strong{font-size:10px;}.hashcod-registration-faq-trigger{gap:10px;padding-left:0;padding-right:0;}.hashcod-registration-faq-panel-inner{padding-left:0;padding-right:0;}.hashcod-registration-head{gap:12px;}.hashcod-registration-title{font-size:clamp(21px,7vw,28px);}}',
            '@media(max-width:390px){.hashcod-registration-price-list>div{grid-template-columns:1fr!important;gap:2px!important;align-items:start;}.hashcod-registration-price-list>div strong{justify-self:start;text-align:left;}}'
        ].join('\n');
        document.head.appendChild(style);
    })();

    (function patchRegistrationPriceList() {
        const rowKey = 'first-plaza-pass';
        const label = 'Aquilar en la primera plaza';
        const price = 'US$ 78';

        function apply() {
            const list = document.querySelector('.hashcod-registration-price-list');
            if (!list) return false;
            const existing = list.querySelector('[data-hashcod-price="' + rowKey + '"]');
            if (existing) {
                const name = existing.querySelector('span');
                const amount = existing.querySelector('strong');
                if (name) name.textContent = label;
                if (amount) amount.textContent = price;
                return true;
            }
            const row = document.createElement('div');
            row.dataset.hashcodPrice = rowKey;
            const name = document.createElement('span');
            name.textContent = label;
            const amount = document.createElement('strong');
            amount.textContent = price;
            row.appendChild(name);
            row.appendChild(amount);
            list.appendChild(row);
            return true;
        }

        function boot() {
            apply();
            if (typeof MutationObserver !== 'function') return;
            const root = document.body || document.documentElement;
            if (!root) return;
            const observer = new MutationObserver(function () { apply(); });
            observer.observe(root, { childList: true, subtree: true });
            window.setTimeout(function () {
                apply();
                observer.disconnect();
            }, 30000);
            window.addEventListener('hashcod:registration-form-mounted', apply);
            window.addEventListener('hashcod:final-entry-screen', apply);
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', boot, { once: true });
        } else {
            boot();
        }
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

    function restoreLandingFolderPosition() {
        const overlay = document.getElementById('bootCliOverlay');
        const brand = overlay && overlay.querySelector('.boot-brand');
        const folder = document.getElementById('hashcodRareFolderHost');
        const fallback = document.getElementById('hashcodBootFolderAnimation');

        // Keep the Hashcod lockup in its original boot-screen position.
        if (brand) {
            if (brand.dataset.hashcodLandingBrandOffsetX) {
                delete brand.dataset.hashcodLandingBrandOffsetX;
            }
            brand.style.removeProperty('translate');
            brand.setAttribute('data-hashcod-original-placement-restored', 'true');
        }

        if (!overlay) return false;
        if ((window.innerWidth || 0) < DESKTOP_LANDING_MIN_WIDTH) {
            if (folder) {
                folder.removeAttribute('data-hashcod-folder-position-restored');
                folder.removeAttribute('data-hashcod-brand-anchor-restored');
            }
            return false;
        }

        const overlayRect = overlay.getBoundingClientRect();
        if (!overlayRect.width || !overlayRect.height) return false;

        const desiredCenterX = overlayRect.left + (overlayRect.width * 0.38);
        const desiredCenterY = overlayRect.top + (overlayRect.height * 0.50);

        if (folder) {
            setImportant(folder, 'position', 'fixed');
            setImportant(folder, 'left', desiredCenterX.toFixed(2) + 'px');
            setImportant(folder, 'top', desiredCenterY.toFixed(2) + 'px');
            folder.removeAttribute('data-hashcod-brand-anchor-restored');
            folder.setAttribute('data-hashcod-folder-position-restored', 'true');
        }

        // The lightweight native fallback uses the exact same desktop anchor.
        // It is only present when the generated React/Motion bundle failed.
        if (fallback) {
            setImportant(fallback, 'position', 'fixed');
            setImportant(fallback, 'left', desiredCenterX.toFixed(2) + 'px');
            setImportant(fallback, 'top', desiredCenterY.toFixed(2) + 'px');
            setImportant(fallback, 'display', 'block');
            setImportant(fallback, 'visibility', 'visible');
            setImportant(fallback, 'opacity', '1');
            fallback.setAttribute('data-hashcod-folder-position-restored', 'true');
        }

        return Boolean(folder || fallback);
    }

    function applyLayout() {
        applyUxActionPlacement();
        restoreLandingFolderPosition();

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

    let layoutFrame = 0;
    function scheduleApply() {
        if (layoutFrame) return;
        layoutFrame = window.requestAnimationFrame(function () {
            layoutFrame = 0;
            applyLayout();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', scheduleApply, { once: true });
    } else {
        scheduleApply();
    }

    // Rare UI performs a few delayed placement passes while fonts/assets settle.
    // Re-apply after those passes so both primary and rescue folder anchors remain final.
    [60, 220, 850, 1650, 2200, 3200, 4600].forEach(function (delay) {
        window.setTimeout(scheduleApply, delay);
    });
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(scheduleApply).catch(function () {});
    }

    const observer = new MutationObserver(function (records) {
        const relevant = records.some(function (record) {
            return Array.from(record.addedNodes || []).some(function (node) {
                if (!node || node.nodeType !== 1) return false;
                if (
                    node.id === FOOTER_ID ||
                    node.id === 'hashcodEntryHold' ||
                    node.id === 'hashcodRareFolderHost' ||
                    node.id === 'hashcodBootFolderAnimation' ||
                    node.id === 'hashcodUxActions' ||
                    (node.matches && node.matches('.boot-brand'))
                ) return true;
                return Boolean(node.querySelector && node.querySelector(
                    '#' + FOOTER_ID + ', #hashcodEntryHold, #hashcodRareFolderHost, #hashcodBootFolderAnimation, #hashcodUxActions, .boot-brand'
                ));
            });
        });
        if (relevant) scheduleApply();
    });
    observer.observe(document.body || document.documentElement, { childList: true, subtree: true });
    window.addEventListener('resize', scheduleApply, { passive: true });

    function stopLayoutWatch() {
        observer.disconnect();
        if (layoutFrame) window.cancelAnimationFrame(layoutFrame);
        layoutFrame = 0;
    }
    window.addEventListener('hashcod:final-entry-screen', stopLayoutWatch, { once: true });
    window.addEventListener('hashcod:platform-entered', stopLayoutWatch, { once: true });
})();