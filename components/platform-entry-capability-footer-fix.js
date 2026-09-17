(function () {
    'use strict';

    if (window.__hashcodEntryCapabilityFooterFixLoaded) return;
    window.__hashcodEntryCapabilityFooterFixLoaded = true;

    (function loadDeepSeekHarnessCube() {
        const current = document.currentScript;
        const currentSrc = current && current.src ? current.src : '';
        const componentBase = currentSrc && currentSrc.lastIndexOf('/') >= 0
            ? currentSrc.slice(0, currentSrc.lastIndexOf('/') + 1)
            : '/components/';

        if (document.querySelector('script[data-hashcod-deepseek-harness-loader]')) return;
        const script = document.createElement('script');
        script.src = componentBase + 'deepseek-harness-loader.js?v=20260916-1';
        script.defer = true;
        script.dataset.hashcodDeepseekHarnessLoader = 'true';
        document.head.appendChild(script);
    })();

    const FOOTER_ID = 'hashcodEntryCapabilityFooter';

    function setImportant(element, property, value) {
        if (!element) return;
        element.style.setProperty(property, value, 'important');
    }

    function applyLayout() {
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
        setImportant(footer, 'color', '#1b1b1b');
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

    const observer = new MutationObserver(scheduleApply);
    observer.observe(document.documentElement, { childList: true, subtree: true });
    window.addEventListener('resize', scheduleApply, { passive: true });
})();