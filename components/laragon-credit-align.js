(function () {
    'use strict';

    if (window.__hashcodLaragonCreditAlignLoaded) return;
    window.__hashcodLaragonCreditAlignLoaded = true;

    function alignCreditToBrandText() {
        const brand = document.querySelector('.boot-brand');
        const text = brand && brand.querySelector('.boot-brand-text');
        const credit = brand && brand.querySelector('.boot-brand-logos.hashcod-credit-under-brand');
        if (!brand || !text || !credit) return false;

        const brandRect = brand.getBoundingClientRect();
        const textRect = text.getBoundingClientRect();
        if (!brandRect.width || !textRect.width) return false;

        const layoutWidth = brand.offsetWidth || brandRect.width;
        let scaleX = brandRect.width / layoutWidth;
        if (!Number.isFinite(scaleX) || scaleX <= 0) scaleX = 1;

        // getBoundingClientRect() already includes the 1.42x welcome-screen scale.
        // Convert the visual offset back to local CSS coordinates so it is not
        // scaled a second time. This keeps the dotted crown + creator line
        // exactly aligned with the Hashcod/codespace text block in Laragon.
        const localLeft = (textRect.left - brandRect.left) / scaleX;
        const leftPx = Math.max(0, localLeft).toFixed(2) + 'px';

        credit.style.setProperty('--hashcod-credit-text-left', leftPx, 'important');
        credit.style.setProperty('left', leftPx, 'important');
        credit.style.setProperty('top', 'calc(100% + 10px)', 'important');
        credit.style.setProperty('right', 'auto', 'important');
        credit.style.setProperty('transform', 'none', 'important');
        credit.style.setProperty('justify-content', 'flex-start', 'important');
        credit.style.setProperty('align-items', 'center', 'important');
        credit.style.setProperty('gap', '7px', 'important');
        return true;
    }

    function settle() {
        let attempt = 0;
        const timer = window.setInterval(function () {
            alignCreditToBrandText();
            attempt += 1;
            if (attempt >= 18) window.clearInterval(timer);
        }, 120);
    }

    function schedule() {
        window.requestAnimationFrame(function () {
            window.requestAnimationFrame(alignCreditToBrandText);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            window.setTimeout(settle, 80);
        }, { once: true });
    } else {
        window.setTimeout(settle, 80);
    }

    window.addEventListener('load', function () {
        window.setTimeout(settle, 50);
    }, { once: true });
    window.addEventListener('resize', schedule, { passive: true });
})();
