(function () {
    'use strict';

    if (window.__hashcodVectorLinkBoardLoaded) return;
    window.__hashcodVectorLinkBoardLoaded = true;

    const TOTAL_SLOTS = 200;
    const DB_NAME = 'hashcod_link_board_v1';
    const DB_VERSION = 1;
    const STORE_NAME = 'links';
    const TOOL_ID = 'grid-module';
    const SLOT = 2;
    const TRAY_ICON_SRC = '/components/vector-tray-icon-third.svg?v=20260911-1';
    const SYNC_ENDPOINT = '/hashcod-sync.php';
    const CLOUD_REFRESH_MS = 5000;
    const state = {
        editSlot: null,
        unlockSlot: null,
        cloudSlots: new Map(),
        cloudReady: false,
        syncing: false
    };

    function componentBase() {
        const current = document.currentScript;
        const src = current && current.src ? current.src : '';
        return src && src.lastIndexOf('/') >= 0 ? src.slice(0, src.lastIndexOf('/') + 1) : '/components/';
    }

    function ensureAdminEngine() {
        if (window.HashcodAdmin && typeof window.HashcodAdmin.require === 'function') return Promise.resolve(true);
        const existing = document.querySelector('script[data-vector-link-board-admin]') || Array.from(document.scripts).find(function (node) {
            return /\/components\/admin-device\.js(?:\?|$)/.test(node.src || '');
        });
        if (!existing) {
            const script = document.createElement('script');
            script.src = componentBase() + 'admin-device.js?v=20260911-1';
            script.defer = true;
            script.dataset.vectorLinkBoardAdmin = 'true';
            document.head.appendChild(script);
        }
        return new Promise(function (resolve) {
            const started = Date.now();
            const timer = window.setInterval(function () {
                if (window.HashcodAdmin && typeof window.HashcodAdmin.require === 'function') {
                    window.clearInterval(timer);
                    resolve(true);
                    return;
                }
                if (Date.now() - started > 10000) {
                    window.clearInterval(timer);
                    resolve(false);
                }
            }, 80);
        });
    }

    function isAdminVerified() {
        return document.documentElement.dataset.adminAuthenticated === 'true';
    }

    async function verifyHello(force) {
        const ready = await ensureAdminEngine();
        if (!ready) throw new Error('No se pudo cargar Windows Hello. Recarga la plataforma e inténtalo de nuevo.');
        const verified = await window.HashcodAdmin.require({ force: force === true });
        return verified === true;
    }

    function openDb() {
        return new Promise(function (resolve, reject) {
            if (!window.indexedDB) {
                reject(new Error('Este navegador no soporta el almacenamiento local requerido.'));
                return;
            }
            const request = window.indexedDB.open(DB_NAME, DB_VERSION);
            request.onupgradeneeded = function () {
                const db = request.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: 'slot' });
                }
            };
            request.onsuccess = function () { resolve(request.result); };
            request.onerror = function () { reject(request.error || new Error('No se pudo abrir la tablilla de enlaces.')); };
        });
    }

    async function getAllRecords() {
        const db = await openDb();
        try {
            return await new Promise(function (resolve, reject) {
                const tx = db.transaction(STORE_NAME, 'readonly');
                const req = tx.objectStore(STORE_NAME).getAll();
                req.onsuccess = function () { resolve(Array.isArray(req.result) ? req.result : []); };
                req.onerror = function () { reject(req.error || new Error('No se pudieron leer los enlaces.')); };
            });
        } finally {
            db.close();
        }
    }

    async function getRecord(slot) {
        const db = await openDb();
        try {
            return await new Promise(function (resolve, reject) {
                const tx = db.transaction(STORE_NAME, 'readonly');
                const req = tx.objectStore(STORE_NAME).get(Number(slot));
                req.onsuccess = function () { resolve(req.result || null); };
                req.onerror = function () { reject(req.error || new Error('No se pudo leer el enlace.')); };
            });
        } finally {
            db.close();
        }
    }

    async function putRecord(record) {
        const db = await openDb();
        try {
            await new Promise(function (resolve, reject) {
                const tx = db.transaction(STORE_NAME, 'readwrite');
                tx.objectStore(STORE_NAME).put(record);
                tx.oncomplete = function () {
                    resolve();
                    window.dispatchEvent(new CustomEvent('hashcod:local-save'));
                };
                tx.onerror = function () { reject(tx.error || new Error('No se pudo guardar el enlace.')); };
                tx.onabort = function () { reject(tx.error || new Error('No se pudo guardar el enlace.')); };
            });
        } finally {
            db.close();
        }
    }

    async function cloudRequest(action, options) {
        const opts = Object.assign({
            method: 'GET',
            credentials: 'same-origin',
            cache: 'no-store',
            headers: {}
        }, options || {});
        opts.headers = Object.assign({ 'X-Requested-With': 'XMLHttpRequest' }, opts.headers || {});
        const response = await fetch(SYNC_ENDPOINT + '?action=' + encodeURIComponent(action) + '&_=' + Date.now(), opts);
        let body = null;
        try { body = await response.json(); } catch (_) { body = null; }
        if (!response.ok || !body || body.ok !== true) {
            const error = new Error((body && body.error) || ('Sincronización HTTP ' + response.status));
            error.status = response.status;
            error.code = body && body.code ? body.code : 'cloud_sync_error';
            throw error;
        }
        return body;
    }

    function normalizeCloudSlot(row) {
        if (!row || typeof row !== 'object') return null;
        const slot = Number(row.slot);
        if (!Number.isInteger(slot) || slot < 0 || slot >= TOTAL_SLOTS) return null;
        const createdAt = Math.max(1, Number(row.createdAt || row.created_at_ms || 1));
        const updatedAt = Math.max(createdAt, Number(row.updatedAt || row.updated_at_ms || createdAt));
        return { slot: slot, createdAt: createdAt, updatedAt: updatedAt, cloud: true };
    }

    async function pullCloudSlots() {
        if (state.syncing) return state.cloudSlots;
        state.syncing = true;
        try {
            const body = await cloudRequest('links.pull');
            const next = new Map();
            (body.links || []).forEach(function (row) {
                const item = normalizeCloudSlot(row);
                if (item) next.set(item.slot, item);
            });
            state.cloudSlots = next;
            state.cloudReady = true;
            return next;
        } finally {
            state.syncing = false;
        }
    }

    async function pushCloudRecord(record) {
        const body = await cloudRequest('links.push', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ links: [record] })
        });
        const next = new Map();
        (body.links || []).forEach(function (row) {
            const item = normalizeCloudSlot(row);
            if (item) next.set(item.slot, item);
        });
        if (next.size) state.cloudSlots = next;
        else state.cloudSlots.set(Number(record.slot), normalizeCloudSlot(record));
        state.cloudReady = true;
        return body;
    }

    async function openCloudLink(slot, code) {
        const body = await cloudRequest('links.open', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ slot: Number(slot), code: String(code) })
        });
        return String(body.url || '');
    }

    function bytesToHex(buffer) {
        return Array.from(new Uint8Array(buffer)).map(function (value) {
            return value.toString(16).padStart(2, '0');
        }).join('');
    }

    async function hashCode(value) {
        if (!window.crypto || !window.crypto.subtle) throw new Error('El navegador no puede proteger el code.');
        const data = new TextEncoder().encode(String(value));
        return bytesToHex(await window.crypto.subtle.digest('SHA-256', data));
    }

    function normalizeUrl(value) {
        let parsed;
        try {
            parsed = new URL(String(value || '').trim());
        } catch (_) {
            throw new Error('Introduce un enlace completo y válido.');
        }
        if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
            throw new Error('Solo se permiten enlaces HTTP o HTTPS.');
        }
        return parsed.href;
    }

    function slotLabel(slot) {
        return String(Number(slot) + 1).padStart(3, '0');
    }

    function outerCircleSvg(slot) {
        const gradient = 'hashcod-link-ring-' + slot;
        const shine = 'hashcod-link-ring-shine-' + slot;
        return [
            '<svg viewBox="0 0 256 256" aria-hidden="true" focusable="false">',
                '<defs>',
                    '<linearGradient x1="32" y1="7.383" x2="32" y2="57.062" gradientUnits="userSpaceOnUse" id="' + gradient + '">',
                        '<stop offset="0" stop-color="#000000"></stop>',
                        '<stop offset="1" stop-color="#494949"></stop>',
                    '</linearGradient>',
                    '<linearGradient x1="42.5" y1="10.064" x2="42.5" y2="27.875" gradientUnits="userSpaceOnUse" id="' + shine + '">',
                        '<stop offset="0" stop-color="#636363"></stop>',
                        '<stop offset="1" stop-color="#b4b4b4"></stop>',
                    '</linearGradient>',
                '</defs>',
                '<g fill="none" fill-rule="nonzero" stroke="none" stroke-width="1" stroke-linecap="butt" stroke-linejoin="miter" stroke-miterlimit="10">',
                    '<g transform="scale(4,4)">',
                        '<path d="M32,58c-14.3,0 -26,-11.7 -26,-26c0,-14.3 11.7,-26 26,-26c14.3,0 26,11.7 26,26c0,14.3 -11.7,26 -26,26zM32,8c-13.2,0 -24,10.8 -24,24c0,13.2 10.8,24 24,24c13.2,0 24,-10.8 24,-24c0,-13.2 -10.8,-24 -24,-24z" fill="url(#' + gradient + ')"></path>',
                        '<path d="M53,32h-2c0,-10.5 -8.5,-19 -19,-19v-2c11.6,0 21,9.4 21,21z" fill="url(#' + shine + ')"></path>',
                    '</g>',
                '</g>',
            '</svg>'
        ].join('');
    }

    function plusIconSvg(slot) {
        const gradient = 'hashcod-link-plus-' + slot;
        return [
            '<svg viewBox="0 0 256 256" aria-hidden="true" focusable="false">',
                '<defs>',
                    '<linearGradient x1="39.105" y1="8.895" x2="8.895" y2="39.105" gradientUnits="userSpaceOnUse" id="' + gradient + '">',
                        '<stop offset="0.014" stop-color="#ffffff"></stop>',
                        '<stop offset="0.208" stop-color="#fffcfc"></stop>',
                        '<stop offset="0.532" stop-color="#f2f1f1"></stop>',
                        '<stop offset="1" stop-color="#ffffff"></stop>',
                    '</linearGradient>',
                '</defs>',
                '<g transform="scale(5.33333,5.33333)">',
                    '<path d="M36.15,40.5h-24.3c-2.13,0 -3.85,-1.78 -3.85,-3.97v-25.06c0,-2.19 1.72,-3.97 3.85,-3.97h24.3c2.13,0 3.85,1.78 3.85,3.97v25.06c0,2.19 -1.72,3.97 -3.85,3.97z" fill="url(#' + gradient + ')"></path>',
                    '<path d="M26.32,40.5h-14.82c-2.21,0 -4,-1.79 -4,-4v-25c0,-2.21 1.79,-4 4,-4h1.63" fill="none" stroke="#000000" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></path>',
                    '<path d="M20.36,7.5h16.14c2.21,0 4,1.79 4,4v25c0,2.21 -1.79,4 -4,4h-2.44" fill="none" stroke="#000000" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></path>',
                    '<path d="M24,15.5v17M32.5,24h-17" fill="none" stroke="#000000" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></path>',
                '</g>',
            '</svg>'
        ].join('');
    }

    function githubIconSvg(slot) {
        const gradient = 'hashcod-link-github-' + slot;
        return [
            '<svg viewBox="0 0 256 256" aria-hidden="true" focusable="false">',
                '<defs>',
                    '<linearGradient x1="37.087" y1="10.967" x2="10.76" y2="37.294" gradientUnits="userSpaceOnUse" id="' + gradient + '">',
                        '<stop offset="0" stop-color="#ffffff"></stop>',
                        '<stop offset="0.362" stop-color="#fbfbfb"></stop>',
                        '<stop offset="1" stop-color="#ffffff"></stop>',
                    '</linearGradient>',
                '</defs>',
                '<g transform="scale(5.33333,5.33333)">',
                    '<circle cx="23.924" cy="24.13" r="18.615" fill="url(#' + gradient + ')"></circle>',
                    '<path d="M35.054,38.836c-3.084,2.301 -6.91,3.664 -11.054,3.664c-10.217,0 -18.5,-8.283 -18.5,-18.5c0,-2.917 0.675,-5.676 1.878,-8.13M13.869,8.518c2.91,-1.908 6.391,-3.018 10.131,-3.018c10.217,0 18.5,8.283 18.5,18.5c0,2.941 -0.686,5.721 -1.907,8.19" fill="none" stroke="#000000" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></path>',
                    '<path d="M34,23c0,-1.574 -0.576,-3.038 -1.558,-4.275c0.442,-1.368 0.93,-3.771 -0.242,-5.648c-2.251,0 -3.73,1.545 -4.436,2.514c-1.162,-0.378 -2.431,-0.591 -3.764,-0.591c-1.333,0 -2.602,0.213 -3.764,0.591c-0.706,-0.969 -2.184,-2.514 -4.436,-2.514c-1.328,2.126 -0.526,4.45 -0.073,5.43c-1.089,1.281 -1.727,2.827 -1.727,4.493c0,3.78 3.281,6.94 7.686,7.776c-1.309,0.673 -2.287,1.896 -2.587,3.38h-1.315c-1.297,0 -1.801,-0.526 -2.502,-1.415c-0.692,-0.889 -1.437,-1.488 -2.331,-1.736c-0.482,-0.051 -0.806,0.316 -0.386,0.641c1.419,0.966 1.516,2.548 2.085,3.583c0.518,0.932 1.579,1.771 2.779,1.771h1.571v5.942h10v-7.806c0,-1.908 -1.098,-3.544 -2.686,-4.36c4.405,-0.836 7.686,-3.996 7.686,-7.776z" fill="#000000"></path>',
                '</g>',
            '</svg>'
        ].join('');
    }

    function boardMarkup() {
        return [
            '<section class="hashcod-link-board-shell" role="dialog" aria-modal="true" aria-labelledby="hashcodLinkBoardTitle">',
                '<header class="hashcod-link-board-header">',
                    '<div class="hashcod-link-board-heading">',
                        '<span class="hashcod-link-board-index">03</span>',
                        '<div>',
                            '<h2 id="hashcodLinkBoardTitle">Tablilla de enlaces</h2>',
                            '<p>200 slots / PostgreSQL shared board</p>',
                        '</div>',
                    '</div>',
                    '<div class="hashcod-link-board-header-actions">',
                        '<span class="hashcod-link-board-counter" id="hashcodLinkBoardCounter">0 / 200</span>',
                        '<button type="button" class="hashcod-link-board-close" id="hashcodLinkBoardClose" aria-label="Cerrar">×</button>',
                    '</div>',
                '</header>',
                '<div class="hashcod-link-board-toolbar">',
                    '<div class="hashcod-link-board-status" id="hashcodLinkBoardStatus" role="status" aria-live="polite">Sincronizando los círculos con PostgreSQL…</div>',
                    '<span class="hashcod-link-board-legend"><i></i> enlace sincronizado</span>',
                '</div>',
                '<div class="hashcod-link-board-stage">',
                    '<div class="hashcod-link-board-tablet">',
                        '<div class="hashcod-link-board-grid" id="hashcodLinkBoardGrid" aria-label="200 espacios de enlaces"></div>',
                    '</div>',
                '</div>',
            '</section>',
            '<div class="hashcod-link-board-dialog" id="hashcodLinkBoardEditor" aria-hidden="true">',
                '<div class="hashcod-link-board-card" role="dialog" aria-modal="true" aria-labelledby="hashcodLinkBoardEditorTitle">',
                    '<span class="hashcod-link-board-card-mark">HELLO VERIFIED</span>',
                    '<h3 id="hashcodLinkBoardEditorTitle">Asignar enlace</h3>',
                    '<p id="hashcodLinkBoardEditorSlot">Slot 001</p>',
                    '<label><span>ENLACE HTTP / HTTPS</span><input type="url" id="hashcodLinkBoardUrl" autocomplete="off" placeholder="https://..."></label>',
                    '<label><span>CODE PREDETERMINADO</span><input type="password" id="hashcodLinkBoardCode" autocomplete="new-password" placeholder="Mínimo 6 caracteres"></label>',
                    '<label><span>CONFIRMAR CODE</span><input type="password" id="hashcodLinkBoardCodeConfirm" autocomplete="new-password" placeholder="Repite el code"></label>',
                    '<div class="hashcod-link-board-error" id="hashcodLinkBoardEditorError" role="alert"></div>',
                    '<div class="hashcod-link-board-card-actions">',
                        '<button type="button" id="hashcodLinkBoardEditorCancel">Cancelar</button>',
                        '<button type="button" id="hashcodLinkBoardEditorSave" data-primary="true">Guardar y sincronizar</button>',
                    '</div>',
                '</div>',
            '</div>',
            '<div class="hashcod-link-board-dialog" id="hashcodLinkBoardUnlock" aria-hidden="true">',
                '<div class="hashcod-link-board-card" role="dialog" aria-modal="true" aria-labelledby="hashcodLinkBoardUnlockTitle">',
                    '<span class="hashcod-link-board-card-mark">PROTECTED LINK</span>',
                    '<h3 id="hashcodLinkBoardUnlockTitle">Abrir enlace</h3>',
                    '<p id="hashcodLinkBoardUnlockSlot">Slot 001</p>',
                    '<label><span>CODE</span><input type="password" id="hashcodLinkBoardUnlockCode" autocomplete="off" placeholder="Code asignado al guardar"></label>',
                    '<div class="hashcod-link-board-error" id="hashcodLinkBoardUnlockError" role="alert"></div>',
                    '<div class="hashcod-link-board-card-actions">',
                        '<button type="button" id="hashcodLinkBoardUnlockCancel">Cancelar</button>',
                        '<button type="button" id="hashcodLinkBoardUnlockOpen" data-primary="true">Ir al enlace</button>',
                    '</div>',
                '</div>',
            '</div>'
        ].join('');
    }

    function ensureOverlay() {
        let overlay = document.getElementById('hashcodLinkBoardOverlay');
        if (overlay) return overlay;
        overlay = document.createElement('div');
        overlay.id = 'hashcodLinkBoardOverlay';
        overlay.setAttribute('aria-hidden', 'true');
        overlay.innerHTML = boardMarkup();
        document.body.appendChild(overlay);
        bindUi(overlay);
        return overlay;
    }

    function setStatus(message, isError) {
        const node = document.getElementById('hashcodLinkBoardStatus');
        if (!node) return;
        node.textContent = message;
        node.classList.toggle('is-error', isError === true);
    }

    async function renderGrid() {
        const grid = document.getElementById('hashcodLinkBoardGrid');
        if (!grid) return;
        try {
            const records = await getAllRecords();
            const localBySlot = new Map(records.map(function (record) { return [Number(record.slot), record]; }));
            const occupied = new Set(Array.from(localBySlot.keys()).concat(Array.from(state.cloudSlots.keys())));
            grid.innerHTML = Array.from({ length: TOTAL_SLOTS }, function (_, slot) {
                const saved = occupied.has(slot);
                return [
                    '<button type="button" class="hashcod-link-cell', saved ? ' is-saved' : '', '" data-link-slot="', slot, '" aria-label="', saved ? 'Enlace guardado ' : 'Espacio libre ', slotLabel(slot), '">',
                        '<span class="hashcod-link-orb">',
                            '<span class="hashcod-link-ring">', outerCircleSvg(slot), '</span>',
                            '<span class="hashcod-link-symbol">', saved ? githubIconSvg(slot) : plusIconSvg(slot), '</span>',
                        '</span>',
                        '<span class="hashcod-link-cell-number">', slotLabel(slot), '</span>',
                    '</button>'
                ].join('');
            }).join('');
            const counter = document.getElementById('hashcodLinkBoardCounter');
            if (counter) counter.textContent = occupied.size + ' / ' + TOTAL_SLOTS;
        } catch (error) {
            setStatus(error.message || 'No se pudo cargar la tablilla.', true);
        }
    }

    async function syncCloudSlots(options) {
        const opts = options || {};
        try {
            await pullCloudSlots();
            await renderGrid();
            if (!opts.silent) setStatus('PostgreSQL sincronizado. Los enlaces guardados aquí aparecen en los demás dispositivos.');
            return true;
        } catch (error) {
            await renderGrid();
            if (!opts.silent) setStatus('No se pudo leer PostgreSQL. Se muestra el cache local: ' + (error.message || 'error de sincronización'), true);
            return false;
        }
    }

    function openEditor(slot) {
        state.editSlot = Number(slot);
        const dialog = document.getElementById('hashcodLinkBoardEditor');
        document.getElementById('hashcodLinkBoardEditorSlot').textContent = 'Slot ' + slotLabel(slot);
        document.getElementById('hashcodLinkBoardUrl').value = '';
        document.getElementById('hashcodLinkBoardCode').value = '';
        document.getElementById('hashcodLinkBoardCodeConfirm').value = '';
        document.getElementById('hashcodLinkBoardEditorError').textContent = '';
        dialog.classList.add('is-open');
        dialog.setAttribute('aria-hidden', 'false');
        window.setTimeout(function () { document.getElementById('hashcodLinkBoardUrl').focus(); }, 30);
    }

    function closeEditor() {
        state.editSlot = null;
        const dialog = document.getElementById('hashcodLinkBoardEditor');
        if (!dialog) return;
        dialog.classList.remove('is-open');
        dialog.setAttribute('aria-hidden', 'true');
    }

    function openUnlock(slot) {
        state.unlockSlot = Number(slot);
        const dialog = document.getElementById('hashcodLinkBoardUnlock');
        document.getElementById('hashcodLinkBoardUnlockSlot').textContent = 'Slot ' + slotLabel(slot);
        document.getElementById('hashcodLinkBoardUnlockCode').value = '';
        document.getElementById('hashcodLinkBoardUnlockError').textContent = '';
        dialog.classList.add('is-open');
        dialog.setAttribute('aria-hidden', 'false');
        window.setTimeout(function () { document.getElementById('hashcodLinkBoardUnlockCode').focus(); }, 30);
    }

    function closeUnlock() {
        state.unlockSlot = null;
        const dialog = document.getElementById('hashcodLinkBoardUnlock');
        if (!dialog) return;
        dialog.classList.remove('is-open');
        dialog.setAttribute('aria-hidden', 'true');
    }

    async function handleCell(slot) {
        const localRecord = await getRecord(slot);
        if (localRecord || state.cloudSlots.has(Number(slot))) {
            openUnlock(slot);
            return;
        }
        setStatus('Confirma Windows Hello para asignar el enlace al slot ' + slotLabel(slot) + '…');
        try {
            const verified = await verifyHello(true);
            if (!verified) {
                setStatus('Windows Hello no validó el acceso. El enlace no fue habilitado.', true);
                return;
            }
            setStatus('Windows Hello verificado. Define el enlace y su code para el slot ' + slotLabel(slot) + '.');
            openEditor(slot);
        } catch (error) {
            setStatus(error.message || 'No se pudo completar Windows Hello.', true);
        }
    }

    async function saveEditor() {
        const slot = state.editSlot;
        if (!Number.isInteger(slot)) return;
        const errorNode = document.getElementById('hashcodLinkBoardEditorError');
        const button = document.getElementById('hashcodLinkBoardEditorSave');
        errorNode.textContent = '';
        button.disabled = true;
        try {
            if (!isAdminVerified()) {
                const verified = await verifyHello(true);
                if (!verified) throw new Error('Windows Hello debe permanecer verificado para guardar.');
            }
            const url = normalizeUrl(document.getElementById('hashcodLinkBoardUrl').value);
            const code = document.getElementById('hashcodLinkBoardCode').value;
            const confirm = document.getElementById('hashcodLinkBoardCodeConfirm').value;
            if (code.length < 6) throw new Error('El code debe tener al menos 6 caracteres.');
            if (code !== confirm) throw new Error('Los codes no coinciden.');
            const now = Date.now();
            const record = {
                slot: slot,
                url: url,
                codeHash: await hashCode(code),
                createdAt: now,
                updatedAt: now
            };
            await putRecord(record);
            setStatus('Guardado local. Confirmando el enlace en PostgreSQL…');
            try {
                await pushCloudRecord(record);
            } catch (cloudError) {
                await renderGrid();
                throw new Error('El enlace quedó guardado en esta computadora, pero PostgreSQL no confirmó la sincronización: ' + (cloudError.message || 'error de servidor'));
            }
            closeEditor();
            await renderGrid();
            setStatus('Enlace guardado y sincronizado en PostgreSQL. Ya puede verse desde otro dispositivo.');
        } catch (error) {
            errorNode.textContent = error.message || 'No se pudo guardar el enlace.';
        } finally {
            button.disabled = false;
        }
    }

    async function unlockLink() {
        const slot = state.unlockSlot;
        if (!Number.isInteger(slot)) return;
        const errorNode = document.getElementById('hashcodLinkBoardUnlockError');
        const button = document.getElementById('hashcodLinkBoardUnlockOpen');
        errorNode.textContent = '';
        button.disabled = true;
        try {
            const code = document.getElementById('hashcodLinkBoardUnlockCode').value;
            if (!code) throw new Error('Introduce el code asignado a este enlace.');

            let destination = '';
            let cloudError = null;
            try {
                destination = normalizeUrl(await openCloudLink(slot, code));
            } catch (error) {
                cloudError = error;
            }

            if (!destination) {
                const localRecord = await getRecord(slot);
                if (!localRecord) throw cloudError || new Error('Este enlace ya no está disponible.');
                if (cloudError && cloudError.status === 403) throw cloudError;
                const suppliedHash = await hashCode(code);
                if (suppliedHash !== localRecord.codeHash) throw new Error('Code incorrecto.');
                destination = normalizeUrl(localRecord.url);
            }

            closeUnlock();
            setStatus('Code correcto. Abriendo el enlace del slot ' + slotLabel(slot) + '…');
            const opened = window.open(destination, '_blank', 'noopener,noreferrer');
            if (!opened) window.location.assign(destination);
        } catch (error) {
            errorNode.textContent = error.message || 'No se pudo abrir el enlace.';
        } finally {
            button.disabled = false;
        }
    }

    function bindUi(overlay) {
        overlay.querySelector('#hashcodLinkBoardClose').addEventListener('click', closeBoard);
        overlay.querySelector('#hashcodLinkBoardGrid').addEventListener('click', function (event) {
            const button = event.target.closest('[data-link-slot]');
            if (!button) return;
            handleCell(Number(button.dataset.linkSlot));
        });
        overlay.querySelector('#hashcodLinkBoardEditorCancel').addEventListener('click', closeEditor);
        overlay.querySelector('#hashcodLinkBoardEditorSave').addEventListener('click', saveEditor);
        overlay.querySelector('#hashcodLinkBoardUnlockCancel').addEventListener('click', closeUnlock);
        overlay.querySelector('#hashcodLinkBoardUnlockOpen').addEventListener('click', unlockLink);
        overlay.querySelector('#hashcodLinkBoardEditor').addEventListener('click', function (event) {
            if (event.target === event.currentTarget) closeEditor();
        });
        overlay.querySelector('#hashcodLinkBoardUnlock').addEventListener('click', function (event) {
            if (event.target === event.currentTarget) closeUnlock();
        });
    }

    async function openBoard() {
        const overlay = ensureOverlay();
        overlay.classList.add('is-open');
        overlay.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        setStatus('Sincronizando los círculos con PostgreSQL…');
        await syncCloudSlots();
    }

    function closeBoard() {
        closeEditor();
        closeUnlock();
        const overlay = document.getElementById('hashcodLinkBoardOverlay');
        if (!overlay) return;
        overlay.classList.remove('is-open');
        overlay.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    function registerTrayTool() {
        if (!window.HashcodVectorTray || typeof window.HashcodVectorTray.registerTool !== 'function') return false;
        window.HashcodVectorTray.registerTool({
            slot: SLOT,
            id: TOOL_ID,
            label: 'Tablilla de enlaces',
            iconSvg: '<img src="' + TRAY_ICON_SRC + '" alt="" aria-hidden="true" style="display:block;width:72%;height:72%;max-width:34px;max-height:34px;object-fit:contain">',
            onClick: openBoard
        });
        return true;
    }

    function waitForTray() {
        if (registerTrayTool()) return;
        let attempts = 0;
        const timer = window.setInterval(function () {
            attempts += 1;
            if (registerTrayTool() || attempts > 120) window.clearInterval(timer);
        }, 100);
    }

    window.addEventListener('keydown', function (event) {
        if (event.key !== 'Escape') return;
        const editor = document.getElementById('hashcodLinkBoardEditor');
        const unlock = document.getElementById('hashcodLinkBoardUnlock');
        if (editor && editor.classList.contains('is-open')) {
            closeEditor();
            return;
        }
        if (unlock && unlock.classList.contains('is-open')) {
            closeUnlock();
            return;
        }
        closeBoard();
    });

    window.addEventListener('focus', function () {
        const overlay = document.getElementById('hashcodLinkBoardOverlay');
        if (overlay && overlay.classList.contains('is-open')) syncCloudSlots({ silent: true });
    });

    document.addEventListener('visibilitychange', function () {
        const overlay = document.getElementById('hashcodLinkBoardOverlay');
        if (document.visibilityState === 'visible' && overlay && overlay.classList.contains('is-open')) {
            syncCloudSlots({ silent: true });
        }
    });

    window.setInterval(function () {
        const overlay = document.getElementById('hashcodLinkBoardOverlay');
        if (overlay && overlay.classList.contains('is-open')) syncCloudSlots({ silent: true });
    }, CLOUD_REFRESH_MS);

    window.HashcodLinkBoard = Object.freeze({
        open: openBoard,
        close: closeBoard,
        sync: syncCloudSlots,
        slots: TOTAL_SLOTS
    });

    waitForTray();
})();