(function () {
    'use strict';

    if (window.__hashcodLinkBoardReconcileLoaded) return;
    window.__hashcodLinkBoardReconcileLoaded = true;

    const DB_NAME = 'hashcod_link_board_v1';
    const DB_VERSION = 1;
    const STORE_NAME = 'links';
    const ENDPOINT = '/hashcod-sync.php';
    const RETRY_MS = 5000;

    let running = false;
    let queued = false;
    let pendingCount = 0;

    function isAdminVerified() {
        return document.documentElement.dataset.adminAuthenticated === 'true';
    }

    function setBoardStatus(message, isError) {
        const node = document.getElementById('hashcodLinkBoardStatus');
        if (!node) return;
        node.textContent = message;
        node.classList.toggle('is-error', isError === true);
    }

    async function request(action, options) {
        const opts = Object.assign({
            method: 'GET',
            credentials: 'same-origin',
            cache: 'no-store',
            headers: {}
        }, options || {});
        opts.headers = Object.assign({ 'X-Requested-With': 'XMLHttpRequest' }, opts.headers || {});
        const response = await fetch(ENDPOINT + '?action=' + encodeURIComponent(action) + '&_=' + Date.now(), opts);
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

    function openDb() {
        return new Promise(function (resolve, reject) {
            if (!window.indexedDB) {
                resolve(null);
                return;
            }
            const req = window.indexedDB.open(DB_NAME, DB_VERSION);
            req.onupgradeneeded = function () {
                const db = req.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: 'slot' });
                }
            };
            req.onsuccess = function () { resolve(req.result); };
            req.onerror = function () { reject(req.error || new Error('No se pudo abrir el cache local de enlaces.')); };
        });
    }

    async function readLocalLinks() {
        const db = await openDb();
        if (!db) return [];
        try {
            return await new Promise(function (resolve, reject) {
                const tx = db.transaction(STORE_NAME, 'readonly');
                const req = tx.objectStore(STORE_NAME).getAll();
                req.onsuccess = function () { resolve(Array.isArray(req.result) ? req.result : []); };
                req.onerror = function () { reject(req.error || new Error('No se pudo leer el cache local de enlaces.')); };
            });
        } finally {
            db.close();
        }
    }

    function normalizeLocal(row) {
        if (!row || typeof row !== 'object') return null;
        const slot = Number(row.slot);
        if (!Number.isInteger(slot) || slot < 0 || slot > 199) return null;
        const url = String(row.url || '').trim();
        const codeHash = String(row.codeHash || row.code_hash || '').trim().toLowerCase();
        if (!/^https?:\/\//i.test(url) || !/^[a-f0-9]{64}$/.test(codeHash)) return null;
        const createdAt = Math.max(1, Number(row.createdAt || row.created_at_ms || Date.now()));
        const updatedAt = Math.max(createdAt, Number(row.updatedAt || row.updated_at_ms || createdAt));
        return { slot: slot, url: url, codeHash: codeHash, createdAt: createdAt, updatedAt: updatedAt };
    }

    async function refreshBoard(silent) {
        if (window.HashcodLinkBoard && typeof window.HashcodLinkBoard.sync === 'function') {
            await window.HashcodLinkBoard.sync({ silent: silent !== false });
        }
    }

    function showPendingStatus(count) {
        if (!count) return;
        if (isAdminVerified()) {
            setBoardStatus('PostgreSQL conectado. Publicando ' + count + ' enlace(s) que solo estaban guardados en este dispositivo…', false);
        } else {
            setBoardStatus('PostgreSQL conectado, pero ' + count + ' enlace(s) siguen solo en este dispositivo. Verifica Windows Hello aquí una vez para publicarlos en los demás dispositivos.', true);
        }
    }

    async function reconcile(reason) {
        if (running) {
            queued = true;
            return false;
        }
        running = true;
        try {
            const rows = (await readLocalLinks()).map(normalizeLocal).filter(Boolean);
            const remote = await request('links.pull');
            const remoteSlots = new Set((remote.links || []).map(function (row) { return Number(row.slot); }));
            const pending = rows.filter(function (row) { return !remoteSlots.has(row.slot); });
            pendingCount = pending.length;

            if (!pending.length) {
                await refreshBoard(true);
                return true;
            }

            showPendingStatus(pending.length);
            if (!isAdminVerified()) return false;

            await request('links.push', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ links: pending })
            });

            const verify = await request('links.pull');
            const verifiedSlots = new Set((verify.links || []).map(function (row) { return Number(row.slot); }));
            const missing = pending.filter(function (row) { return !verifiedSlots.has(row.slot); });
            if (missing.length) {
                pendingCount = missing.length;
                throw new Error('PostgreSQL no confirmó ' + missing.length + ' enlace(s) después de guardarlos.');
            }

            pendingCount = 0;
            await refreshBoard(false);
            setBoardStatus('PostgreSQL sincronizado. Los enlaces locales pendientes ya se publicaron y aparecerán en los demás dispositivos.', false);
            window.dispatchEvent(new CustomEvent('hashcod:cloud-reconciled', {
                detail: { links: pending.length, reason: reason || 'reconcile' }
            }));
            return true;
        } catch (error) {
            if (pendingCount > 0) {
                setBoardStatus('No se pudieron publicar todavía ' + pendingCount + ' enlace(s) locales: ' + (error.message || 'error de sincronización'), true);
            }
            return false;
        } finally {
            running = false;
            if (queued) {
                queued = false;
                window.setTimeout(function () { reconcile('queued'); }, 0);
            }
        }
    }

    function schedule(reason, delay) {
        window.setTimeout(function () { reconcile(reason); }, Math.max(0, delay || 0));
    }

    window.addEventListener('hashcod:admin-auth', function (event) {
        if (event && event.detail && event.detail.authenticated === true) schedule('admin-auth', 0);
    });
    window.addEventListener('hashcod:local-save', function () { schedule('local-save', 100); });
    window.addEventListener('focus', function () { schedule('focus', 100); });
    document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'visible') schedule('visible', 100);
    });

    const observer = new MutationObserver(function () {
        const overlay = document.getElementById('hashcodLinkBoardOverlay');
        if (overlay && overlay.classList.contains('is-open')) schedule('board-open', 100);
    });
    if (document.documentElement) observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });

    window.setInterval(function () {
        if (pendingCount > 0 || isAdminVerified()) reconcile('periodic');
    }, RETRY_MS);

    window.HashcodLinkBoardReconcile = Object.freeze({
        sync: function () { return reconcile('manual'); },
        pending: function () { return pendingCount; }
    });

    schedule('startup', 700);
})();
