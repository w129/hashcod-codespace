(function () {
    'use strict';

    if (window.__hashcodPlatformEntrySloganLoaded) return;
    window.__hashcodPlatformEntrySloganLoaded = true;

    const VECTOR_TRAY_SLOTS = 6;
    const vectorTrayTools = new Map();

    // User-supplied vector icon for the first tray cube. It is intentionally
    // registered without behavior so its function can be wired later.
    const HASHCOD_CARD_MODULE_ICON = [
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" aria-hidden="true" focusable="false">',
            '<g fill="none" fill-rule="nonzero" stroke="none" stroke-width="1" stroke-linecap="butt" stroke-linejoin="miter" stroke-miterlimit="10" stroke-dasharray="" stroke-dashoffset="0" font-family="none" font-weight="none" font-size="none" text-anchor="none" style="mix-blend-mode:normal">',
                '<g transform="scale(2,2)">',
                    '<path d="M105.7,99h-83.4c-4.6,0 -8.3,-3.7 -8.3,-8.3v-53.4c0,-4.6 3.7,-8.3 8.3,-8.3h83.3c4.6,0 8.3,3.7 8.3,8.3v53.3c0.1,4.7 -3.6,8.4 -8.2,8.4z" fill="#ffffff"></path>',
                    '<path d="M101.5,71.3c-1.7,0 -3,-1.3 -3,-3c0,-2.3 -1.8,-4.1 -4.1,-4.1h-11.3c-1.7,0 -3,-1.3 -3,-3c0,-1.7 1.3,-3 3,-3h11.3c5.6,0 10.1,4.5 10.1,10.1c0,1.7 -1.3,3 -3,3zM76,71.3c-0.2,0 -0.4,0 -0.6,-0.1c-0.2,0 -0.4,-0.1 -0.6,-0.2c-0.2,-0.1 -0.3,-0.2 -0.5,-0.3c-0.2,-0.1 -0.3,-0.2 -0.5,-0.4c-0.6,-0.6 -0.9,-1.3 -0.9,-2.1c0,-0.8 0.3,-1.6 0.9,-2.1c0.1,-0.1 0.3,-0.3 0.5,-0.4c0.2,-0.1 0.3,-0.2 0.5,-0.3c0.2,-0.1 0.4,-0.1 0.6,-0.2c0.4,-0.1 0.8,-0.1 1.2,0c0.2,0 0.4,0.1 0.6,0.2c0.2,0.1 0.4,0.2 0.5,0.3c0.2,0.1 0.3,0.2 0.5,0.4c0.6,0.6 0.9,1.3 0.9,2.1c0,0.8 -0.3,1.6 -0.9,2.1c-0.6,0.7 -1.4,1 -2.2,1zM88.8,56.2c-5.6,0 -10.1,-4.5 -10.1,-10.1c0,-5.6 4.5,-10.1 10.1,-10.1c5.6,0 10.1,4.5 10.1,10.1c-0.1,5.5 -4.6,10.1 -10.1,10.1zM88.8,42c-2.3,0 -4.1,1.8 -4.1,4.1c0,2.3 1.8,4.1 4.1,4.1c2.3,0 4.1,-1.8 4.1,-4.1c0,-2.3 -1.9,-4.1 -4.1,-4.1z" fill="#474848"></path>',
                    '<path d="M105.7,102h-83.4c-6.2,0 -11.3,-5.1 -11.3,-11.3v-53.4c0,-6.2 5.1,-11.3 11.3,-11.3h83.3c6.2,0 11.3,5.1 11.3,11.3v53.3c0.1,6.3 -5,11.4 -11.2,11.4zM22.3,32c-2.9,0 -5.3,2.4 -5.3,5.3v53.3c0,2.9 2.4,5.3 5.3,5.3h83.3c2.9,0 5.3,-2.4 5.3,-5.3v-53.3c0,-2.9 -2.4,-5.3 -5.3,-5.3z" fill="#474848"></path>',
                    '<path d="M24,58h18v12h-18z" fill="#000000"></path>',
                    '<path d="M24,80h12v6h-12z" fill="#b5b6b8"></path>',
                    '<path d="M42,80h12v6h-12z" fill="#b5b6b8"></path>',
                    '<path d="M60,80h12v6h-12z" fill="#b5b6b8"></path>',
                    '<path d="M78,80h12v6h-12z" fill="#b5b6b8"></path>',
                '</g>',
            '</g>',
        '</svg>'
    ].join('');

    function mountSlogan() {
        const overlay = document.getElementById('hashcodEntryHold');
        if (!overlay || overlay.querySelector('.hashcod-hold-slogan')) return;

        const slogan = document.createElement('div');
        slogan.className = 'hashcod-hold-slogan';
        slogan.setAttribute('aria-label', 'One world, one epoca, one empire, on your computer');
        slogan.innerHTML = [
            '<span class="hashcod-hold-slogan-main">One world, one epoca, one empire</span>',
            '<span class="hashcod-hold-slogan-sub"><span aria-hidden="true">&gt;</span> on your computer</span>'
        ].join('');
        overlay.appendChild(slogan);
    }

    function ensureVectorTrayStyles() {
        if (document.getElementById('hashcodVectorTrayStyles')) return;

        const style = document.createElement('style');
        style.id = 'hashcodVectorTrayStyles';
        style.textContent = [
            '#hashcodVectorTray{',
                'position:absolute;',
                'left:calc(50% - max(26vw,46.222222vh));',
                'top:50%;',
                'width:max(21.5vw,38.222222vh);',
                'height:max(7.25vw,12.888889vh);',
                'transform:translate(-50%,-50%);',
                'z-index:10;',
                'font-family:"IBM Plex Mono","Geist Mono",ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;',
                'color:#111;',
                'pointer-events:auto;',
                'user-select:none;',
            '}',
            '#hashcodVectorTray .hashcod-vector-tray-shell{position:relative;width:100%;height:100%;filter:drop-shadow(0 10px 13px rgba(0,0,0,.08));}',
            '#hashcodVectorTray .hashcod-vector-tray-shadow{position:absolute;left:9%;right:9%;bottom:0;height:18%;border-radius:50%;background:rgba(0,0,0,.08);filter:blur(8px);transform:translateY(28%);z-index:0;}',
            '#hashcodVectorTray .hashcod-vector-tray-back{position:absolute;left:7%;right:7%;top:5%;height:28%;border:1px solid #bdbdb8;border-bottom-color:#8f8f8a;border-radius:14px 14px 7px 7px;background:linear-gradient(180deg,#ffffff 0%,#f4f4f1 100%);box-shadow:inset 0 1px 0 #fff,0 3px 8px rgba(0,0,0,.05);transform:perspective(420px) rotateX(-18deg);transform-origin:center bottom;z-index:1;}',
            '#hashcodVectorTray .hashcod-vector-tray-plane{position:absolute;left:3%;right:3%;top:18%;height:62%;clip-path:polygon(6% 0,94% 0,100% 100%,0 100%);background:linear-gradient(180deg,#fff 0%,#fbfbf9 62%,#f1f1ee 100%);border-top:1px solid #a9a9a4;box-shadow:inset 0 1px 0 #fff,inset 0 -9px 16px rgba(0,0,0,.035);z-index:2;}',
            '#hashcodVectorTray .hashcod-vector-tray-plane:before,#hashcodVectorTray .hashcod-vector-tray-plane:after{content:"";position:absolute;top:12%;bottom:8%;width:1px;background:linear-gradient(180deg,transparent,#d6d6d1 30%,#bdbdb7 72%,transparent);}',
            '#hashcodVectorTray .hashcod-vector-tray-plane:before{left:6%;}',
            '#hashcodVectorTray .hashcod-vector-tray-plane:after{right:6%;}',
            '#hashcodVectorTray .hashcod-vector-tray-front{position:absolute;left:3%;right:3%;bottom:5%;height:27%;clip-path:polygon(0 0,100% 0,94% 100%,6% 100%);background:linear-gradient(180deg,#f9f9f7 0%,#ecece8 58%,#e1e1dc 100%);border-bottom:1px solid #9f9f99;box-shadow:inset 0 1px 0 rgba(255,255,255,.95);z-index:3;}',
            '#hashcodVectorTray .hashcod-vector-tray-front:after{content:"VECTOR MODULE / 06";position:absolute;left:50%;bottom:12%;transform:translateX(-50%);font-size:max(.42vw,.75vh);font-weight:600;letter-spacing:.13em;white-space:nowrap;color:#777772;}',
            '#hashcodVectorTray .hashcod-vector-tray-slots{position:absolute;left:10%;right:10%;top:28%;display:grid;grid-template-columns:repeat(6,minmax(0,1fr));align-items:center;gap:max(.5vw,.888889vh);z-index:5;}',
            '#hashcodVectorTray .hashcod-vector-tray-slot{position:relative;display:grid;place-items:center;aspect-ratio:1;min-width:0;padding:0;border:1px solid #b8b8b3;border-radius:max(.52vw,.92vh);background:linear-gradient(145deg,#ffffff 0%,#f8f8f5 57%,#ecece8 100%);color:#111;box-shadow:inset 0 1px 0 #fff,inset 0 -2px 4px rgba(0,0,0,.06),0 4px 7px rgba(0,0,0,.07);transition:transform 150ms ease,box-shadow 150ms ease,background-color 150ms ease;overflow:hidden;}',
            '#hashcodVectorTray .hashcod-vector-tray-slot:not(:disabled){cursor:pointer;}',
            '#hashcodVectorTray .hashcod-vector-tray-slot:not(:disabled):hover{transform:translateY(-3px);background:#fff;box-shadow:inset 0 1px 0 #fff,0 8px 12px rgba(0,0,0,.11);}',
            '#hashcodVectorTray .hashcod-vector-tray-slot:not(:disabled):focus-visible{outline:2px solid #111;outline-offset:3px;}',
            '#hashcodVectorTray .hashcod-vector-tray-slot:disabled{opacity:1;cursor:default;}',
            '#hashcodVectorTray .hashcod-vector-tray-slot-placeholder{width:22%;aspect-ratio:1;border:1px solid #c7c7c2;border-radius:2px;background:#f1f1ee;box-shadow:inset 0 1px 2px rgba(0,0,0,.07);}',
            '#hashcodVectorTray .hashcod-vector-tray-slot svg{display:block;width:72%;height:72%;max-width:34px;max-height:34px;}',
            '#hashcodVectorTray .hashcod-vector-tray-slot[data-tool-id="card-module"]{background:linear-gradient(145deg,#fff 0%,#f9f9f6 65%,#eeeeea 100%);}',
            '#hashcodVectorTray.is-hidden{display:none!important;}',
            '@media (max-width:1099px),(max-height:719px){#hashcodVectorTray{display:none!important;}}',
            'body.mobile-mode #hashcodVectorTray{display:none!important;}',
            '@media (prefers-reduced-motion:reduce){#hashcodVectorTray .hashcod-vector-tray-slot{transition:none;}}'
        ].join('');
        document.head.appendChild(style);
    }

    function emptySlotMarkup() {
        return '<span class="hashcod-vector-tray-slot-placeholder" aria-hidden="true"></span>';
    }

    function buildVectorTray() {
        const tray = document.createElement('section');
        tray.id = 'hashcodVectorTray';
        tray.setAttribute('aria-label', 'Bandeja vectorial de módulos Hashcod');
        tray.innerHTML = [
            '<div class="hashcod-vector-tray-shell">',
                '<div class="hashcod-vector-tray-shadow" aria-hidden="true"></div>',
                '<div class="hashcod-vector-tray-back" aria-hidden="true"></div>',
                '<div class="hashcod-vector-tray-plane" aria-hidden="true"></div>',
                '<div class="hashcod-vector-tray-front" aria-hidden="true"></div>',
                '<div class="hashcod-vector-tray-slots">',
                    Array.from({ length: VECTOR_TRAY_SLOTS }, function (_, index) {
                        return '<button type="button" class="hashcod-vector-tray-slot is-empty" data-vector-tray-slot="' + index + '" aria-label="Espacio de herramienta ' + (index + 1) + '" disabled>' + emptySlotMarkup() + '</button>';
                    }).join(''),
                '</div>',
            '</div>'
        ].join('');
        return tray;
    }

    function positionVectorTray(tray) {
        const overlay = document.getElementById('authOverlay');
        const card = document.querySelector('#authWrapper .auth-card');
        if (!tray || !overlay || !card) return;

        const overlayRect = overlay.getBoundingClientRect();
        const cardRect = card.getBoundingClientRect();
        if (!overlayRect.height || !cardRect.height) return;

        const cardCenterY = cardRect.top - overlayRect.top + (cardRect.height / 2);
        const nextTop = Math.round(cardCenterY) + 'px';
        if (tray.style.top !== nextTop) tray.style.top = nextTop;
    }

    function renderVectorTraySlot(slot, tool, tray) {
        const mountedTray = tray || mountVectorTray();
        if (!mountedTray) return false;

        const button = mountedTray.querySelector('[data-vector-tray-slot="' + slot + '"]');
        if (!button) return false;

        button.onclick = null;
        button.removeAttribute('data-tool-id');
        button.classList.add('is-empty');
        button.disabled = true;
        button.setAttribute('aria-label', 'Espacio de herramienta ' + (slot + 1));
        button.removeAttribute('title');
        button.innerHTML = emptySlotMarkup();

        if (!tool) return true;

        button.classList.remove('is-empty');
        button.disabled = false;
        button.dataset.toolId = tool.id;
        button.setAttribute('aria-label', tool.label);
        button.title = tool.label;
        button.innerHTML = tool.iconSvg || emptySlotMarkup();
        if (typeof tool.onClick === 'function') {
            button.onclick = function (event) {
                tool.onClick(event, button);
            };
        }
        return true;
    }

    function mountVectorTray() {
        const overlay = document.getElementById('authOverlay');
        if (!overlay) return null;

        ensureVectorTrayStyles();
        let tray = document.getElementById('hashcodVectorTray');
        if (!tray) {
            tray = buildVectorTray();
            overlay.appendChild(tray);
        } else if (tray.parentElement !== overlay) {
            overlay.appendChild(tray);
        }

        positionVectorTray(tray);
        vectorTrayTools.forEach(function (tool, slot) {
            renderVectorTraySlot(slot, tool, tray);
        });
        return tray;
    }

    function resolveTraySlot(slot) {
        const index = Number(slot);
        if (!Number.isInteger(index) || index < 0 || index >= VECTOR_TRAY_SLOTS) {
            throw new RangeError('El slot de la bandeja debe estar entre 0 y ' + (VECTOR_TRAY_SLOTS - 1) + '.');
        }
        return index;
    }

    function registerVectorTrayTool(config) {
        if (!config || typeof config !== 'object') throw new TypeError('Se requiere una configuración de herramienta.');
        const slot = resolveTraySlot(config.slot);
        const id = String(config.id || ('tool-' + slot)).trim();
        const label = String(config.label || ('Herramienta ' + (slot + 1))).trim();
        const tool = {
            id: id,
            label: label,
            iconSvg: typeof config.iconSvg === 'string' ? config.iconSvg : '',
            onClick: typeof config.onClick === 'function' ? config.onClick : null
        };
        vectorTrayTools.set(slot, tool);
        const tray = mountVectorTray();
        renderVectorTraySlot(slot, tool, tray);
        return tool;
    }

    function removeVectorTrayTool(slotOrId) {
        let targetSlot = null;
        if (Number.isInteger(Number(slotOrId)) && String(slotOrId).trim() !== '') {
            const numeric = Number(slotOrId);
            if (numeric >= 0 && numeric < VECTOR_TRAY_SLOTS) targetSlot = numeric;
        }
        if (targetSlot === null) {
            vectorTrayTools.forEach(function (tool, slot) {
                if (targetSlot === null && tool.id === String(slotOrId)) targetSlot = slot;
            });
        }
        if (targetSlot === null) return false;
        vectorTrayTools.delete(targetSlot);
        renderVectorTraySlot(targetSlot, null, mountVectorTray());
        return true;
    }

    function clearVectorTray() {
        vectorTrayTools.clear();
        const tray = mountVectorTray();
        for (let slot = 0; slot < VECTOR_TRAY_SLOTS; slot += 1) {
            renderVectorTraySlot(slot, null, tray);
        }
    }

    function registerDefaultVectorTrayTools() {
        if (vectorTrayTools.has(0)) return;
        registerVectorTrayTool({
            slot: 0,
            id: 'card-module',
            label: 'Módulo de tarjeta — función pendiente',
            iconSvg: HASHCOD_CARD_MODULE_ICON
        });
    }

    window.HashcodVectorTray = Object.freeze({
        slots: VECTOR_TRAY_SLOTS,
        mount: mountVectorTray,
        registerTool: registerVectorTrayTool,
        removeTool: removeVectorTrayTool,
        clear: clearVectorTray
    });

    function mountAll() {
        mountSlogan();
        mountVectorTray();
        registerDefaultVectorTrayTools();
    }

    mountAll();

    // Observe only for the containers being recreated. Previously every DOM
    // mutation called mountAll(), which rendered the tray again with innerHTML;
    // that generated another childList mutation and created an endless microtask
    // loop that could freeze the landing screen.
    const observer = new MutationObserver(function () {
        const overlay = document.getElementById('authOverlay');
        const hold = document.getElementById('hashcodEntryHold');
        const trayMissing = Boolean(overlay && !document.getElementById('hashcodVectorTray'));
        const sloganMissing = Boolean(hold && !hold.querySelector('.hashcod-hold-slogan'));
        const firstSlotMissing = Boolean(
            overlay &&
            document.getElementById('hashcodVectorTray') &&
            !document.querySelector('#hashcodVectorTray [data-vector-tray-slot="0"]')
        );

        if (!trayMissing && !sloganMissing && !firstSlotMissing) return;
        mountAll();
    });

    observer.observe(document.documentElement, { childList: true, subtree: true });
    window.addEventListener('resize', function () {
        positionVectorTray(document.getElementById('hashcodVectorTray'));
    }, { passive: true });
})();
