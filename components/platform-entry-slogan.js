(function () {
    'use strict';

    if (window.__hashcodPlatformEntrySloganLoaded) return;
    window.__hashcodPlatformEntrySloganLoaded = true;

    function mountSlogan() {
        const overlay = document.getElementById('hashcodEntryHold');
        if (!overlay || overlay.querySelector('.hashcod-hold-slogan')) return;

        const slogan = document.createElement('div');
        slogan.className = 'hashcod-hold-slogan';
        slogan.setAttribute('aria-label', 'One world, one era, one empire, on your computer');
        slogan.innerHTML = [
            '<span class="hashcod-hold-slogan-main">One world, one era, one empire</span>',
            '<span class="hashcod-hold-slogan-sub"><span aria-hidden="true">&gt;</span> on your computer</span>'
        ].join('');
        overlay.appendChild(slogan);
    }

    mountSlogan();

    const observer = new MutationObserver(function () {
        mountSlogan();
    });

    observer.observe(document.documentElement, { childList: true, subtree: true });
})();
