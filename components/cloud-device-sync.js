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
    const MIN_AUTOMATIC_GAP_MS = 4000;
    let savePending = false;
    let lastAutomaticRequestAt = 0;

    const state = {
        syncing: false,
        online: navigator.onLine !== false,
        authenticated: null,
        shared: false,
        localOnly: false,
        scope: 'unknown',
        lastSyncAt: 0,
        lastError: '',
        linkCount: 0,
        imageCount: 0,
        linkBootstrapDone: false,
        migratedLinkCount: 0
    };

    function isDesktopMode() {
        return window.__HASHCOD_DESKTOP__ === true ||
            document.documentElement.dataset.hashcodDesktop === 'true';
    }

    function emit(detail) {
        window.dispatchEvent(new CustomEvent('hashcod:cloud-sync', {
            detail: Object.assign({}, state, detail || {})
        }));
    }

    function requestHeaders(extra) {
        return Object.assign({ 'X-Requested-With': 'XMLHttpRequest' }, extra || {});
    }

    async function jsonRequest(action, options) {
        const opts = Object.assign({ method: 'GET', credentials: 'same-origin', cache: 'no-store' }, options || {});
        opts.headers = requestHeaders(opts.headers);
        const response = await fetch(ENDPOINT + '?action=' + encodeURIComponent(action) + '&_=' + Date.now(), opts);
        let body = null;
        try { body = await response.json(); } catch (_) { body = null; }
        if (response.status === 401 || response.status === 403) {
            const error = new Error((body && body.error) || 'Inicia sesión para sincronizar esta sección.');
            error.code = 'not_authenticated';
            error.status = response.status;
            throw error;
        }
        if (!response.ok || !body || body.ok !== true) {
            const error = new Error((body && body.error) || ('Sincronización HTTP ' + response.status));
            error.code = 'sync_error';
            error.status = response.status;
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

    function isAdminVerified() {
        return document.documentElement.dataset.adminAuthenticated === 'true';
    }

    function normalizeLocalLink(row) {
        if (!row || typeof row !== 'object') return null;
        const slot = Number(row.slot);
        const url = String(row.url || '').trim();
        const codeHash = String(row.codeHash || '').trim().toLowerCase();
        const createdAt = Number(row.createdAt || 0);
        const updatedAt = Number(row.updatedAt || createdAt || 0);
        if (!Number.isInteger(slot) || slot < 0 || slot > 199) return null;
        if (!/^https?:\/\//i.test(url) || url.length > 4096) return null;
        if (!/^[a-f0-9]{64}$/.test(codeHash)) return null;
        if (!Number.isFinite(createdAt) || createdAt <= 0) return null;
        return {
            slot: slot,
            url: url,
            codeHash: codeHash,
            createdAt: createdAt,
            updatedAt: Math.max(createdAt, Number.isFinite(updatedAt) ? updatedAt : createdAt)
        };
    }

    async function bootstrapProtectedLinks(remoteRows) {
        if (state.linkBootstrapDone || !isAdminVerified()) return 0;
        const remoteSlots = new Set();
        (remoteRows || []).forEach(function (row) {
            const slot = Number(row && row.slot);
            if (Number.isInteger(slot) && slot >= 0 && slot <= 199) remoteSlots.add(slot);
        });
        const localRows = await getAll(LINK_DB, LINK_STORE, 'slot');
        const missing = localRows.map(normalizeLocalLink).filter(function (row) { return row && !remoteSlots.has(row.slot); });
        if (!missing.length) {
            state.linkBootstrapDone = true;
            return 0;
        }
        const pushed = await jsonRequest('links.push', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ links: missing })
        });
        state.linkBootstrapDone = true;
        state.migratedLinkCount += missing.length;
        state.linkCount = Array.isArray(pushed.links) ? pushed.links.length : Math.max(state.linkCount, remoteSlots.size + missing.length);
        emit({ phase: 'protected-links-migrated', migrated: missing.length });
        return missing.length;
    }

    async function syncLinks() {
        let remote = await jsonRequest('links.pull');
        state.linkCount = Array.isArray(remote.links) ? remote.links.length : 0;
        const migrated = await bootstrapProtectedLinks(remote.links || []);
        if (migrated > 0) {
            remote = await jsonRequest('links.pull');
            state.linkCount = Array.isArray(remote.links) ? remote.links.length : state.linkCount;
        }
        if (window.HashcodLinkBoard && typeof window.HashcodLinkBoard.sync === 'function') {
            await window.HashcodLinkBoard.sync({ silent: true });
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
        const response = await fetch(ENDPOINT + '?action=images.get&id=' + encodeURIComponent(meta.id), {
            method: 'GET', credentials: 'same-origin', cache: 'no-store', headers: requestHeaders()
        });
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
            method: 'POST', credentials: 'same-origin', cache: 'no-store', headers: requestHeaders(), body: data
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
            if (!localById.has(id)) downloads.push(await fetchRemoteImage(meta));
        }
        if (downloads.length) {
            await putMany(IMAGE_DB, IMAGE_STORE, 'id', downloads, imageSetup);
            downloads.forEach(function (row) { localById.set(row.id, row); });
        }
        for (const [id, row] of localById.entries()) {
            if (!remoteById.has(id)) {
                const uploaded = await uploadLocalImage(row);
                if (uploaded) remoteById.set(id, normalizeImageMeta(uploaded));
            }
        }
        state.imageCount = Math.max(localById.size, remoteById.size);
        if (window.HashcodImageVault && typeof window.HashcodImageVault.refresh === 'function') {
            try { await window.HashcodImageVault.refresh(); } catch (_) {}
        }
    }

    async function refreshLocalSurfaces() {
        if (window.HashcodImageVault && typeof window.HashcodImageVault.refresh === 'function') {
            try { await window.HashcodImageVault.refresh(); } catch (_) {}
        }
        const images = await getAll(IMAGE_DB, IMAGE_STORE, 'id', imageSetup).catch(function () { return []; });
        state.imageCount = images.length;
        const links = await getAll(LINK_DB, LINK_STORE, 'slot').catch(function () { return []; });
        state.linkCount = links.length;
    }

    async function enterDesktopLocalMode(reason, message) {
        state.localOnly = true;
        state.shared = false;
        state.scope = 'desktop-local';
        state.authenticated = true;
        state.lastError = '';
        await refreshLocalSurfaces();
        state.lastSyncAt = Date.now();
        emit({
            phase: 'local-only',
            reason: reason || 'desktop',
            message: message || 'Persistencia local activa. La sincronización cloud se reanudará cuando Supabase esté configurado.'
        });
        return true;
    }

    async function syncAll(reason) {
        const syncReason = syncReason;
        const automatic = !['manual', 'local-save', 'admin-verified', 'online'].includes(syncReason);
        if (state.syncing || navigator.onLine === false) return false;
        if (automatic && document.visibilityState === 'hidden') return false;

        const now = Date.now();
        if (automatic && now - lastAutomaticRequestAt < MIN_AUTOMATIC_GAP_MS) return false;
        if (automatic) lastAutomaticRequestAt = now;

        state.syncing = true;
        state.online = true;
        state.lastError = '';
        emit({ phase: 'start', reason: syncReason });
        try {
            const status = await jsonRequest('status');
            state.shared = status.shared === true;
            state.scope = String(status.scope || 'unknown');

            if (!status.supabase_configured || status.postgres === false) {
                if (isDesktopMode()) {
                    return await enterDesktopLocalMode(reason, !status.supabase_configured
                        ? 'Hashcod Desktop está usando almacenamiento local; Supabase no está configurado en esta instalación.'
                        : 'Hashcod Desktop conserva tus datos localmente mientras PostgreSQL no esté disponible.');
                }
                if (!status.supabase_configured) throw new Error('Supabase no está configurado en el servidor.');
                throw new Error('El guardado compartido en PostgreSQL no está disponible. Tus datos locales se conservan.');
            }

            state.localOnly = false;
            await syncLinks();
            try {
                await syncImages();
                state.authenticated = true;
            } catch (imageError) {
                if (imageError && imageError.code === 'not_authenticated') state.authenticated = false;
                else throw imageError;
            }

            state.lastSyncAt = Date.now();
            emit({ phase: 'complete', reason: syncReason });
            return true;
        } catch (error) {
            // The desktop edition must remain fully usable offline or before a
            // cloud backend is configured. Network/cloud failures never disable
            // local IndexedDB persistence.
            if (isDesktopMode()) {
                return await enterDesktopLocalMode(reason, (error && error.message) || 'Cloud temporalmente no disponible.');
            }
            state.lastError = (error && error.message) ? error.message : 'No se pudo sincronizar.';
            emit({ phase: 'error', error: state.lastError, reason: syncReason });
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
    window.addEventListener('hashcod:admin-auth', function (event) {
        if (!event.detail || event.detail.authenticated !== true) return;
        state.linkBootstrapDone = false;
        syncAll('admin-verified');
    });
    window.addEventListener('online', function () { state.online = true; syncAll('online'); });
    window.addEventListener('offline', function () {
        state.online = false;
        if (isDesktopMode()) {
            state.localOnly = true;
            state.scope = 'desktop-local';
            emit({ phase: 'local-only', reason: 'offline', message: 'Sin Internet: almacenamiento local activo.' });
        } else {
            emit({ phase: 'offline' });
        }
    });
    window.addEventListener('focus', function () { syncAll('focus'); });
    document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'visible') syncAll('visible');
    });

    window.HashcodCloudSync = Object.freeze({
        syncNow: function () { return syncAll('manual'); },
        status: function () { return Object.assign({}, state); }
    });

    window.setTimeout(function () { syncAll('initial'); }, 800);
    window.setInterval(function () { syncAll('scheduled'); }, SYNC_INTERVAL_MS);
})();
