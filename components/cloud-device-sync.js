(function () {
    'use strict';

    if (window.__hashcodCloudDeviceSyncLoaded) return;
    window.__hashcodCloudDeviceSyncLoaded = true;

    const ENDPOINT = '/hashcod-sync.php';
    const LINK_DB = 'hashcod_link_board_v1';
    const LINK_STORE = 'links';
    const IMAGE_DB = 'hashcod_image_vault_v1';
    const IMAGE_STORE = 'images';
    const SYNC_INTERVAL_MS = 15000;
    let savePending = false;

    const state = {
        syncing: false,
        online: navigator.onLine !== false,
        authenticated: null,
        lastSyncAt: 0,
        lastError: '',
        linkCount: 0,
        imageCount: 0
    };

    function emit(detail) {
        window.dispatchEvent(new CustomEvent('hashcod:cloud-sync', {
            detail: Object.assign({}, state, detail || {})
        }));
    }

    function requestHeaders(extra) {
        return Object.assign({
            'X-Requested-With': 'XMLHttpRequest'
        }, extra || {});
    }

    async function jsonRequest(action, options) {
        const opts = Object.assign({
            method: 'GET',
            credentials: 'same-origin',
            cache: 'no-store'
        }, options || {});
        opts.headers = requestHeaders(opts.headers);
        const response = await fetch(ENDPOINT + '?action=' + encodeURIComponent(action), opts);
        let body = null;
        try { body = await response.json(); } catch (_) { body = null; }
        if (response.status === 401 || response.status === 403) {
            const error = new Error((body && body.error) || 'Inicia sesión para sincronizar tus dispositivos.');
            error.code = 'not_authenticated';
            throw error;
        }
        if (!response.ok || !body || body.ok !== true) {
            const error = new Error((body && body.error) || ('Sincronización HTTP ' + response.status));
            error.code = 'sync_error';
            throw error;
        }
        return body;
    }

    function openStore(dbName, storeName, keyPath, setup) {
        return new Promise(function (resolve, reject) {
            if (!window.indexedDB) {
                reject(new Error('IndexedDB no está disponible en este dispositivo.'));
                return;
            }
            const request = window.indexedDB.open(dbName, 1);
            request.onupgradeneeded = function () {
                const db = request.result;
                if (!db.objectStoreNames.contains(storeName)) {
                    const store = db.createObjectStore(storeName, { keyPath: keyPath });
                    if (typeof setup === 'function') setup(store);
                }
            };
            request.onsuccess = function () { resolve(request.result); };
            request.onerror = function () { reject(request.error || new Error('No se pudo abrir el almacenamiento local.')); };
        });
    }

    async function getAll(dbName, storeName, keyPath, setup) {
        const db = await openStore(dbName, storeName, keyPath, setup);
        try {
            return await new Promise(function (resolve, reject) {
                const tx = db.transaction(storeName, 'readonly');
                const req = tx.objectStore(storeName).getAll();
                req.onsuccess = function () { resolve(Array.isArray(req.result) ? req.result : []); };
                req.onerror = function () { reject(req.error || new Error('No se pudo leer el almacenamiento local.')); };
            });
        } finally {
            db.close();
        }
    }

    async function putMany(dbName, storeName, keyPath, rows, setup) {
        if (!rows || !rows.length) return;
        const db = await openStore(dbName, storeName, keyPath, setup);
        try {
            await new Promise(function (resolve, reject) {
                const tx = db.transaction(storeName, 'readwrite');
                const store = tx.objectStore(storeName);
                rows.forEach(function (row) { store.put(row); });
                tx.oncomplete = resolve;
                tx.onerror = function () { reject(tx.error || new Error('No se pudo actualizar el cache local.')); };
                tx.onabort = function () { reject(tx.error || new Error('La actualización local fue cancelada.')); };
            });
        } finally {
            db.close();
        }
    }

    function normalizeLink(row) {
        if (!row || typeof row !== 'object') return null;
        const slot = Number(row.slot);
        if (!Number.isInteger(slot) || slot < 0 || slot > 199) return null;
        const url = String(row.url || '').trim();
        const codeHash = String(row.codeHash || row.code_hash || '').trim().toLowerCase();
        if (!/^https?:\/\//i.test(url) || !/^[a-f0-9]{64}$/.test(codeHash)) return null;
        const createdAt = Math.max(1, Number(row.createdAt || row.created_at || Date.now()));
        const updatedAt = Math.max(createdAt, Number(row.updatedAt || row.updated_at || createdAt));
        return { slot: slot, url: url, codeHash: codeHash, createdAt: createdAt, updatedAt: updatedAt };
    }

    async function syncLinks() {
        const localRows = await getAll(LINK_DB, LINK_STORE, 'slot');
        const remote = await jsonRequest('links.pull');
        const merged = new Map();

        (remote.links || []).forEach(function (row) {
            const n = normalizeLink(row);
            if (n) merged.set(n.slot, n);
        });
        localRows.forEach(function (row) {
            const n = normalizeLink(row);
            if (!n) return;
            const prev = merged.get(n.slot);
            if (!prev || n.updatedAt >= prev.updatedAt) merged.set(n.slot, n);
        });

        const rows = Array.from(merged.values()).sort(function (a, b) { return a.slot - b.slot; });
        await putMany(LINK_DB, LINK_STORE, 'slot', rows);

        const pushed = await jsonRequest('links.push', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ links: rows })
        });
        const finalRows = (pushed.links || []).map(normalizeLink).filter(Boolean);
        await putMany(LINK_DB, LINK_STORE, 'slot', finalRows);
        state.linkCount = finalRows.length;

        const overlay = document.getElementById('hashcodLinkBoardOverlay');
        if (overlay && overlay.classList.contains('is-open') && window.HashcodLinkBoard && typeof window.HashcodLinkBoard.open === 'function') {
            window.HashcodLinkBoard.open().catch(function () {});
        }
    }

    function imageSetup(store) {
        try { store.createIndex('createdAt', 'createdAt', { unique: false }); } catch (_) {}
    }

    function normalizeImageMeta(row) {
        if (!row || typeof row !== 'object') return null;
        const id = String(row.id || '').trim();
        const codeHash = String(row.codeHash || row.code_hash || '').trim().toLowerCase();
        if (!id || !/^[a-f0-9]{64}$/.test(codeHash)) return null;
        const createdAt = Math.max(1, Number(row.createdAt || row.created_at || Date.now()));
        const updatedAt = Math.max(createdAt, Number(row.updatedAt || row.updated_at || createdAt));
        return {
            id: id,
            name: String(row.name || 'image.png'),
            type: 'image/png',
            size: Math.max(0, Number(row.size || 0)),
            createdAt: createdAt,
            updatedAt: updatedAt,
            codeHash: codeHash,
            sha256: String(row.sha256 || '')
        };
    }

    async function fetchRemoteImage(meta) {
        const response = await fetch(
            ENDPOINT + '?action=images.get&id=' + encodeURIComponent(meta.id),
            {
                method: 'GET',
                credentials: 'same-origin',
                cache: 'no-store',
                headers: requestHeaders()
            }
        );
        if (!response.ok) throw new Error('No se pudo descargar una imagen sincronizada.');
        const blob = await response.blob();
        if (!blob || blob.size < 1) throw new Error('La imagen sincronizada llegó vacía.');
        return Object.assign({}, meta, { blob: blob, size: blob.size, type: 'image/png' });
    }

    async function uploadLocalImage(row) {
        if (!row || !row.blob || typeof row.blob.size !== 'number') return null;
        const meta = normalizeImageMeta(row);
        if (!meta) return null;
        const data = new FormData();
        data.append('id', meta.id);
        data.append('code_hash', meta.codeHash);
        data.append('created_at', String(meta.createdAt));
        data.append('updated_at', String(meta.updatedAt));
        data.append('file', row.blob, meta.name || 'image.png');
        const response = await fetch(ENDPOINT + '?action=images.upload', {
            method: 'POST',
            credentials: 'same-origin',
            cache: 'no-store',
            headers: requestHeaders(),
            body: data
        });
        let body = null;
        try { body = await response.json(); } catch (_) { body = null; }
        if (response.status === 401 || response.status === 403) {
            const error = new Error((body && body.error) || 'Inicia sesión para sincronizar tus imágenes.');
            error.code = 'not_authenticated';
            throw error;
        }
        if (!response.ok || !body || body.ok !== true) {
            throw new Error((body && body.error) || 'No se pudo subir una imagen a Supabase.');
        }
        return body.image || meta;
    }

    async function syncImages() {
        const localRows = await getAll(IMAGE_DB, IMAGE_STORE, 'id', imageSetup);
        const remote = await jsonRequest('images.list');
        const localById = new Map();
        const remoteById = new Map();
        localRows.forEach(function (row) { if (row && row.id) localById.set(String(row.id), row); });
        (remote.images || []).forEach(function (row) {
            const meta = normalizeImageMeta(row);
            if (meta) remoteById.set(meta.id, meta);
        });

        const downloads = [];
        for (const [id, meta] of remoteById.entries()) {
            if (!localById.has(id)) {
                downloads.push(await fetchRemoteImage(meta));
            }
        }
        if (downloads.length) {
            await putMany(IMAGE_DB, IMAGE_STORE, 'id', downloads, imageSetup);
            downloads.forEach(function (row) { localById.set(row.id, row); });
        }

        for (const [id, row] of localById.entries()) {
            if (!remoteById.has(id)) {
                try {
                    const uploaded = await uploadLocalImage(row);
                    if (uploaded) remoteById.set(id, normalizeImageMeta(uploaded));
                } catch (error) {
                    throw error;
                }
            }
        }

        state.imageCount = Math.max(localById.size, remoteById.size);
        if (window.HashcodImageVault && typeof window.HashcodImageVault.refresh === 'function') {
            try { await window.HashcodImageVault.refresh(); } catch (_) {}
        }
    }

    async function syncAll(reason) {
        if (state.syncing || navigator.onLine === false) return false;
        state.syncing = true;
        state.online = true;
        state.lastError = '';
        emit({ phase: 'start', reason: reason || 'scheduled' });
        try {
            const status = await jsonRequest('status');
            state.authenticated = true;
            if (!status.supabase_configured) throw new Error('Supabase no está configurado en el servidor.');
            if (status.postgres === false) throw new Error('El guardado en la nube no está disponible. Tus datos locales se conservan.');
            const results = await Promise.allSettled([syncLinks(), syncImages()]);
            const failed = results.find(result => result.status === 'rejected');
            if (failed) throw failed.reason;
            state.lastSyncAt = Date.now();
            emit({ phase: 'complete', reason: reason || 'scheduled' });
            return true;
        } catch (error) {
            if (error && error.code === 'not_authenticated') state.authenticated = false;
            state.lastError = (error && error.message) ? error.message : 'No se pudo sincronizar.';
            emit({ phase: 'error', error: state.lastError, reason: reason || 'scheduled' });
            return false;
        } finally {
            state.syncing = false;
            if (savePending) {
                savePending = false;
                window.setTimeout(function () { syncAll('local-save'); }, 0);
            }
        }
    }

    window.addEventListener('hashcod:local-save', function () {
        if (state.syncing) savePending = true;
        else syncAll('local-save');
    });

    window.addEventListener('online', function () {
        state.online = true;
        syncAll('online');
    });
    window.addEventListener('offline', function () {
        state.online = false;
        emit({ phase: 'offline' });
    });
    window.addEventListener('focus', function () { syncAll('focus'); });
    document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'visible') syncAll('visible');
    });

    window.HashcodCloudSync = Object.freeze({
        syncNow: function () { return syncAll('manual'); },
        status: function () { return Object.assign({}, state); }
    });

    window.setTimeout(function () { syncAll('initial'); }, 1200);
    window.setInterval(function () { syncAll('scheduled'); }, SYNC_INTERVAL_MS);
})();
