(function () {
    'use strict';

    // RETIRED 2026-09-14
    // Hashcod Codespace no longer supports assigning HTTP/HTTPS links to
    // Toolbox circles. Keep this tiny compatibility asset so older HTML or
    // desktop payloads that still request the historical filename fail closed
    // instead of restoring the retired click interception logic.
    window.__hashcodToolboxCircleLinksRetired = true;
    window.__hashcodSecureToolboxLinksLoaded = true;

    function cleanupRetiredCircleLinks() {
        const root = document.getElementById('hashcodSecureToolboxRoot');
        if (root) root.remove();

        document.querySelectorAll('.tb-slot[data-slot]').forEach(function (slot) {
            slot.classList.remove('hashcod-secure-link-slot');
            slot.removeAttribute('data-hashcod-secure-link');
            slot.removeAttribute('data-hashcod-link-capable');
            const label = slot.querySelector(':scope > .hsl-slot-label');
            if (label) label.remove();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', cleanupRetiredCircleLinks, { once: true });
    } else {
        cleanupRetiredCircleLinks();
    }
})();
