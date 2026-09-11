(function () {
    'use strict';

    if (window.__hashcodVectorClassroomBoardLoaded) return;
    window.__hashcodVectorClassroomBoardLoaded = true;

    const TOOL_ID = 'store-module';
    const SLOT = 1;
    const BOARD_ICON_SRC = '/components/classroom-board-icon.svg?v=20260911-1';
    const BOARD_ICON_RIGHT_SRC = '/components/classroom-board-icon-right.svg?v=20260911-1';
    const BOARD_ICON_THIRD_SRC = '/components/classroom-board-icon-third.svg?v=20260911-1';
    const BOARD_ICON_FOURTH_SRC = '/components/classroom-board-icon-fourth.svg?v=20260911-1';
    const THIRD_TRAY_ICON_SRC = '/components/vector-tray-icon-third.svg?v=20260911-1';

    function ensureOverlay() {
        let overlay = document.getElementById('hashcodClassroomBoardOverlay');
        if (overlay) return overlay;

        overlay = document.createElement('div');
        overlay.id = 'hashcodClassroomBoardOverlay';
        overlay.setAttribute('aria-hidden', 'true');
        overlay.innerHTML = [
            '<section class="hashcod-classroom-board-shell" role="dialog" aria-modal="true" aria-labelledby="hashcodClassroomBoardTitle">',
                '<header class="hashcod-classroom-board-header">',
                    '<div class="hashcod-classroom-board-heading">',
                        '<span class="hashcod-classroom-board-index" aria-hidden="true">02</span>',
                        '<div>',
                            '<h2 id="hashcodClassroomBoardTitle">Mercado de precios</h2>',
                            '<p>Vector workspace / classroom board</p>',
                        '</div>',
                    '</div>',
                    '<button type="button" class="hashcod-classroom-board-close" id="hashcodClassroomBoardClose" aria-label="Cerrar">×</button>',
                '</header>',
                '<div class="hashcod-classroom-board-stage">',
                    '<div class="hashcod-classroom-board-frame" aria-label="Mercado de precios">',
                        '<div class="hashcod-classroom-board-surface">',
                            '<div class="hashcod-classroom-board-emblems" aria-hidden="true">',
                                '<div class="hashcod-classroom-board-emblem-item">',
                                    '<img class="hashcod-classroom-board-emblem" src="' + BOARD_ICON_SRC + '" alt="">',
                                    '<span class="hashcod-classroom-board-emblem-value">0.15 BTC</span>',
                                '</div>',
                                '<div class="hashcod-classroom-board-emblem-item">',
                                    '<img class="hashcod-classroom-board-emblem hashcod-classroom-board-emblem-right" src="' + BOARD_ICON_RIGHT_SRC + '" alt="">',
                                    '<span class="hashcod-classroom-board-emblem-value">0.015 BTC</span>',
                                '</div>',
                                '<div class="hashcod-classroom-board-emblem-item">',
                                    '<img class="hashcod-classroom-board-emblem hashcod-classroom-board-emblem-third" src="' + BOARD_ICON_THIRD_SRC + '" alt="">',
                                    '<span class="hashcod-classroom-board-emblem-value">0.22 BTC</span>',
                                '</div>',
                                '<div class="hashcod-classroom-board-emblem-item">',
                                    '<img class="hashcod-classroom-board-emblem hashcod-classroom-board-emblem-fourth" src="' + BOARD_ICON_FOURTH_SRC + '" alt="">',
                                    '<span class="hashcod-classroom-board-emblem-value">0.05 BTC</span>',
                                '</div>',
                            '</div>',
                        '</div>',
                        '<div class="hashcod-classroom-board-rail" aria-hidden="true"></div>',
                    '</div>',
                '</div>',
            '</section>'
        ].join('');

        document.body.appendChild(overlay);

        overlay.querySelector('#hashcodClassroomBoardClose').addEventListener('click', closeBoard);
        overlay.addEventListener('click', function (event) {
            if (event.target === overlay) closeBoard();
        });

        return overlay;
    }

    function openBoard() {
        const overlay = ensureOverlay();
        overlay.classList.add('is-open');
        overlay.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    function closeBoard() {
        const overlay = document.getElementById('hashcodClassroomBoardOverlay');
        if (!overlay) return;
        overlay.classList.remove('is-open');
        overlay.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    function findCurrentIcon() {
        const current = document.querySelector('#hashcodVectorTray [data-vector-tray-slot="1"] svg');
        return current ? current.outerHTML : '';
    }

    function registerTool() {
        if (!window.HashcodVectorTray || typeof window.HashcodVectorTray.registerTool !== 'function') return false;

        window.HashcodVectorTray.registerTool({
            slot: SLOT,
            id: TOOL_ID,
            label: 'Mercado de precios',
            iconSvg: findCurrentIcon(),
            onClick: openBoard
        });

        window.HashcodVectorTray.registerTool({
            slot: 2,
            id: 'grid-module',
            label: 'Módulo de cuadrícula — función pendiente',
            iconSvg: '<img src="' + THIRD_TRAY_ICON_SRC + '" alt="" aria-hidden="true" style="display:block;width:72%;height:72%;max-width:34px;max-height:34px;object-fit:contain">'
        });
        return true;
    }

    function loadLinkBoardAssets() {
        if (!document.getElementById('vectorLinkBoardStylesheet')) {
            const link = document.createElement('link');
            link.id = 'vectorLinkBoardStylesheet';
            link.rel = 'stylesheet';
            link.href = '/components/vector-link-board.css?v=20260911-1';
            document.head.appendChild(link);
        }
        if (!document.querySelector('script[data-vector-link-board]')) {
            const script = document.createElement('script');
            script.src = '/components/vector-link-board.js?v=20260911-1';
            script.defer = true;
            script.dataset.vectorLinkBoard = 'true';
            document.head.appendChild(script);
        }
    }

    function waitForTray() {
        if (registerTool()) return;
        let attempts = 0;
        const timer = window.setInterval(function () {
            attempts += 1;
            if (registerTool() || attempts > 120) window.clearInterval(timer);
        }, 100);
    }

    window.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') closeBoard();
    });

    window.HashcodClassroomBoard = Object.freeze({
        open: openBoard,
        close: closeBoard
    });

    loadLinkBoardAssets();
    waitForTray();
})();