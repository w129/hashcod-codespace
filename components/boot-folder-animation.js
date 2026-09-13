(function () {
    'use strict';

    if (window.__hashcodBootFolderAnimationLoaded) return;
    window.__hashcodBootFolderAnimationLoaded = true;

    const INTRO_SESSION_KEY = 'hashcod_platform_intro_seen_v1';
    const FLAP_PATH = 'M0 25C0 11.1929 11.1929 0 25 0H136.084C143.044 0 149.689 2.90139 154.42 8.00608L178.08 33.5343C182.811 38.639 189.456 41.5404 196.416 41.5404H296C309.807 41.5404 321 52.7333 321 66.5404V216C321 229.807 309.807 241 296 241H25C11.1929 241 0 229.807 0 216V25Z';

    const theme = {
        backFill: '#000000',
        flapFill: '#292929',
        flapFillOpacity: 0.25,
        flapStroke: '#979797',
        flapInsetColor: '0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.08 0',
        cardFill: '#F1F1F1',
        cardStroke: '#E0E0E0',
        cardLineFill: '#D4D4D4',
        cardInsetColor: '0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1 0'
    };

    function cardSvg(id) {
        const rows = [60.9939, 75.1122, 89.2306, 103.349, 117.467, 131.586, 145.704, 159.823, 173.941];
        const filterId = 'hbf_card_filter_' + id;
        const lines = rows.map(function (y, index) {
            const rightY = [60.9617,75.0801,89.1985,103.317,117.435,131.554,145.672,159.79,173.909][index];
            return [
                '<rect x="14.8253" y="', y, '" width="64.5183" height="5.88276" rx="2.94138" fill="', theme.cardLineFill, '"/>',
                '<rect x="84.4303" y="', rightY, '" width="64.5183" height="5.88276" rx="2.94138" fill="', theme.cardLineFill, '"/>'
            ].join('');
        }).join('');

        return [
            '<svg width="164" height="214" viewBox="0 0 164 214" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">',
                '<g filter="url(#', filterId, ')">',
                    '<rect width="163.078" height="213.262" rx="20" fill="', theme.cardFill, '"/>',
                '</g>',
                '<rect x="0.5" y="0.5" width="162.078" height="212.262" rx="19.5" stroke="', theme.cardStroke, '"/>',
                '<rect x="14.1193" y="31.2091" width="134.84" height="11.8892" rx="5.94459" fill="', theme.cardLineFill, '"/>',
                lines,
                '<defs>',
                    '<filter id="', filterId, '" x="0" y="0" width="166.078" height="218.262" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">',
                        '<feFlood flood-opacity="0" result="BackgroundImageFix"/>',
                        '<feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>',
                        '<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>',
                        '<feMorphology radius="2" operator="erode" in="SourceAlpha" result="effect1_innerShadow_', id, '"/>',
                        '<feOffset dx="3" dy="5"/>',
                        '<feGaussianBlur stdDeviation="3.05"/>',
                        '<feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>',
                        '<feColorMatrix type="matrix" values="', theme.cardInsetColor, '"/>',
                        '<feBlend mode="normal" in2="shape" result="effect1_innerShadow_', id, '"/>',
                    '</filter>',
                '</defs>',
            '</svg>'
        ].join('');
    }

    function flapSvg() {
        return [
            '<svg class="hbf-front-svg" width="321" height="241" viewBox="0 0 321 241" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">',
                '<g filter="url(#hbf_front_inner)">',
                    '<path d="', FLAP_PATH, '" fill="', theme.flapFill, '" fill-opacity="', theme.flapFillOpacity, '"/>',
                    '<path d="M25 0.5H136.084C142.905 0.5 149.417 3.3431 154.054 8.3457L177.713 33.874C182.539 39.0808 189.317 42.04 196.416 42.04H296C309.531 42.04 320.5 53.0092 320.5 66.54V216C320.5 229.531 309.531 240.5 296 240.5H25C11.469 240.5 0.5 229.531 0.5 216V25C0.5 11.469 11.469 0.5 25 0.5Z" stroke="', theme.flapStroke, '"/>',
                '</g>',
                '<defs>',
                    '<filter id="hbf_front_inner" x="-25.4" y="-25.4" width="371.8" height="291.8" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">',
                        '<feFlood flood-opacity="0" result="BackgroundImageFix"/>',
                        '<feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>',
                        '<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>',
                        '<feOffset/>',
                        '<feGaussianBlur stdDeviation="2.65"/>',
                        '<feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>',
                        '<feColorMatrix type="matrix" values="', theme.flapInsetColor, '"/>',
                        '<feBlend mode="normal" in2="shape" result="hbf_front_shadow"/>',
                    '</filter>',
                '</defs>',
            '</svg>'
        ].join('');
    }

    function buildFolder() {
        const root = document.createElement('div');
        root.id = 'hashcodBootFolderAnimation';
        root.setAttribute('data-slot', 'folder');
        root.setAttribute('role', 'button');
        root.setAttribute('tabindex', '0');
        root.setAttribute('aria-label', 'Carpeta interactiva Hashcod. Pulsa para abrir o cerrar.');
        root.setAttribute('aria-expanded', 'false');
        root.innerHTML = [
            '<div class="hbf-stage">',
                '<div class="hbf-back-wrap"><div class="hbf-back"></div></div>',
                '<div class="hbf-cards">',
                    '<div class="hbf-card hbf-card-1">', cardSvg(1), '</div>',
                    '<div class="hbf-card hbf-card-2">', cardSvg(2), '</div>',
                    '<div class="hbf-card hbf-card-3">', cardSvg(3), '</div>',
                '</div>',
                '<div class="hbf-front">',
                    '<div class="hbf-front-blur"></div>',
                    flapSvg(),
                '</div>',
            '</div>',
            '<div class="hbf-label">HASHCOD / WORKSPACE</div>'
        ].join('');
        return root;
    }

    function setScale(root) {
        if (!root) return;
        const vw = Math.max(320, window.innerWidth || 0);
        const vh = Math.max(480, window.innerHeight || 0);
        let scale = Math.min(0.88, vw / 1850, vh / 980);
        scale = Math.max(0.54, scale);
        if (vw < 900) scale = Math.min(scale, 0.66);
        if (vw < 620) scale = Math.min(scale, 0.56);
        root.style.setProperty('--hbf-scale', scale.toFixed(3));
    }

    function mount() {
        const overlay = document.getElementById('bootCliOverlay');
        if (!overlay) return false;
        if (document.getElementById('hashcodBootFolderAnimation')) return true;

        // This new folder animation replaces the old transient boot intro.
        // Mark the old intro as already seen before its deferred module runs.
        try { window.sessionStorage.setItem(INTRO_SESSION_KEY, '1'); } catch (error) {}

        const staleIntro = document.getElementById('hashcodBootIntro');
        if (staleIntro) staleIntro.remove();
        overlay.classList.remove('hashcod-intro-running', 'hashcod-intro-revealed');

        const root = buildFolder();
        overlay.appendChild(root);
        setScale(root);

        let userInteracted = false;
        let isOpen = false;

        function setHovered(value) {
            root.classList.toggle('is-hovered', Boolean(value));
        }

        function setOpen(value) {
            isOpen = Boolean(value);
            root.classList.toggle('is-open', isOpen);
            root.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        }

        root.addEventListener('mouseenter', function () {
            userInteracted = true;
            setHovered(true);
        });

        root.addEventListener('mouseleave', function () {
            userInteracted = true;
            setHovered(false);
            setOpen(false);
        });

        root.addEventListener('click', function (event) {
            event.preventDefault();
            event.stopPropagation();
            userInteracted = true;
            setHovered(true);
            setOpen(!isOpen);
        });

        root.addEventListener('keydown', function (event) {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                userInteracted = true;
                setHovered(true);
                setOpen(!isOpen);
            } else if (event.key === 'Escape') {
                userInteracted = true;
                setHovered(false);
                setOpen(false);
                root.blur();
            }
        });

        root.addEventListener('focus', function () {
            setHovered(true);
        });

        root.addEventListener('blur', function () {
            if (!isOpen) setHovered(false);
        });

        window.addEventListener('resize', function () { setScale(root); }, { passive: true });

        // Automatic one-time preview so the animation is visible immediately,
        // while preserving the supplied hover/click behavior afterwards.
        window.setTimeout(function () {
            if (userInteracted || !root.isConnected) return;
            root.classList.add('is-previewing');
            setHovered(true);
        }, 280);
        window.setTimeout(function () {
            if (userInteracted || !root.isConnected) return;
            setOpen(true);
        }, 760);
        window.setTimeout(function () {
            if (userInteracted || !root.isConnected) return;
            setOpen(false);
            setHovered(false);
            root.classList.remove('is-previewing');
        }, 2300);

        return true;
    }

    if (mount()) return;

    const observer = new MutationObserver(function () {
        if (mount()) observer.disconnect();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    window.setTimeout(function () { observer.disconnect(); }, 10000);
})();
