(function () {
    'use strict';

    if (window.__hashcodBootBrandCreditRelocateLoaded) return;
    window.__hashcodBootBrandCreditRelocateLoaded = true;

    function visibleRect(element) {
        if (!element || typeof element.getBoundingClientRect !== 'function') return null;
        const rect = element.getBoundingClientRect();
        if (!rect || rect.width <= 0 || rect.height <= 0) return null;
        return rect;
    }

    function alignCredit(brand, credit) {
        const brandRect = visibleRect(brand);
        if (!brandRect) return;

        const childRects = Array.prototype.slice.call(brand.children)
            .filter(function (child) { return child !== credit; })
            .map(visibleRect)
            .filter(Boolean);

        if (!childRects.length) {
            credit.style.removeProperty('--hashcod-credit-center-x');
            return;
        }

        const left = Math.min.apply(null, childRects.map(function (rect) { return rect.left; }));
        const right = Math.max.apply(null, childRects.map(function (rect) { return rect.right; }));
        const center = ((left + right) / 2) - brandRect.left;
        credit.style.setProperty('--hashcod-credit-center-x', center.toFixed(2) + 'px');
    }

    function relocate() {
        const brand = document.querySelector('.boot-brand');
        const credit = document.querySelector('.boot-brand-logos');
        if (!brand || !credit) return false;

        if (credit.parentElement !== brand) {
            brand.appendChild(credit);
        }

        credit.classList.add('hashcod-credit-under-brand');
        window.requestAnimationFrame(function () {
            alignCredit(brand, credit);
        });
        return true;
    }

    function scheduleRelocate() {
        window.requestAnimationFrame(relocate);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', scheduleRelocate, { once: true });
    } else {
        scheduleRelocate();
    }

    const observer = new MutationObserver(scheduleRelocate);
    observer.observe(document.documentElement, { childList: true, subtree: true });
    window.addEventListener('resize', scheduleRelocate, { passive: true });
})();
