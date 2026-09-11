(function () {
    'use strict';

    if (window.__hashcodVectorClassroomBoardLoaded) return;
    window.__hashcodVectorClassroomBoardLoaded = true;

    const TOOL_ID = 'store-module';
    const SLOT = 1;
    const BOARD_ICON_SRC = '/components/classroom-board-icon.svg?v=20260911-1';
    const BOARD_ICON_RIGHT_SRC = '/components/classroom-board-icon-right.svg?v=20260911-1';
    const BOARD_ICON_THIRD_SRC = '/components/classroom-board-icon-third.svg?v=20260911-1';

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
                            '<h2 id="hashcodClassroomBoardTitle">Pizarra</h2>',
                            '<p>Vector workspace / classroom board</p>',
                        '</div>',
                    '</div>',
                    '<button type="button" class="hashcod-classroom-board-close" id="hashcodClassroomBoardClose" aria-label="Cerrar">×</button>',
                '</header>',
                '<div class="hashcod-classroom-board-stage">',
                    '<div class="hashcod-classroom-board-frame" aria-label="Pizarra de trabajo">',
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
            label: 'Pizarra',
            iconSvg: findCurrentIcon(),
            onClick: openBoard
        });
        return true;
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

    waitForTray();
})();