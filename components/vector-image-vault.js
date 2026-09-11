(function () {
    'use strict';

    if (window.__hashcodVectorImageVaultLoaded) return;
    window.__hashcodVectorImageVaultLoaded = true;

    const DB_NAME = 'hashcod_image_vault_v1';
    const DB_VERSION = 1;
    const STORE_NAME = 'images';
    const MAX_FILE_BYTES = 15 * 1024 * 1024;
    const SLOT_ID = 'card-module';
    const toolState = {
        selectedFiles: [],
        previewUrls: [],
        downloadTargetId: null,
        mounted: false
    };

    const fallbackIcon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" aria-hidden="true"><g transform="scale(2,2)"><path d="M105.7,102h-83.4c-6.2,0-11.3-5.1-11.3-11.3V37.3C11,31.1,16.1,26,22.3,26h83.3c6.2,0,11.3,5.1,11.3,11.3v53.3c.1,6.3-5,11.4-11.2,11.4zM22.3,32c-2.9,0-5.3,2.4-5.3,5.3v53.3c0,2.9,2.4,5.3,5.3,5.3h83.3c2.9,0,5.3-2.4,5.3-5.3V37.3c0-2.9-2.4-5.3-5.3-5.3z" fill="#474848"/><path d="M24 58h18v12H24z" fill="#000"/><path d="M24 80h12v6H24zM42 80h12v6H42zM60 80h12v6H60zM78 80h12v6H78z" fill="#b5b6b8"/></g></svg>';

    function componentBase() {
        const current = document.currentScript;
        const src = current && current.src ? current.src : '';
        return src && src.lastIndexOf('/') >= 0 ? src.slice(0, src.lastIndexOf('/') + 1) : '/components/';
    }

    function ensureAdminEngine() {
        if (window.HashcodAdmin && typeof window.HashcodAdmin.require === 'function') return Promise.resolve(true);
        const existing = document.querySelector('script[data-vector-image-vault-admin]') || Array.from(document.scripts).find(function (node) {
            return /\/components\/admin-device\.js(?:\?|$)/.test(node.src || '');
        });
        if (!existing) {
            const script = document.createElement('script');
            script.src = componentBase() + 'admin-device.js?v=20260911-1';
            script.defer = true;
            script.dataset.vectorImageVaultAdmin = 'true';
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

    async function verifyHello() {
        const ready = await ensureAdminEngine();
        if (!ready) throw new Error('No se pudo cargar Windows Hello. Recarga la plataforma e inténtalo de nuevo.');
        const verified = await window.HashcodAdmin.require();
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
                    const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                    store.createIndex('createdAt', 'createdAt', { unique: false });
                }
            };
            request.onsuccess = function () { resolve(request.result); };
            request.onerror = function () { reject(request.error || new Error('No se pudo abrir la galería local.')); };
        });
    }

    async function withStore(mode, callback) {
        const db = await openDb();
        try {
            return await new Promise(function (resolve, reject) {
                const tx = db.transaction(STORE_NAME, mode);
                const store = tx.objectStore(STORE_NAME);
                let callbackResult;
                try {
                    callbackResult = callback(store, tx);
                } catch (error) {
                    reject(error);
                    return;
                }
                tx.oncomplete = function () { resolve(callbackResult); };
                tx.onerror = function () { reject(tx.error || new Error('No se pudo completar la operación.')); };
                tx.onabort = function () { reject(tx.error || new Error('La operación fue cancelada.')); };
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
                tx.oncomplete = resolve;
                tx.onerror = function () { reject(tx.error || new Error('No se pudo guardar la imagen.')); };
                tx.onabort = function () { reject(tx.error || new Error('No se pudo guardar la imagen.')); };
            });
        } finally {
            db.close();
        }
    }

    async function getRecord(id) {
        const db = await openDb();
        try {
            return await new Promise(function (resolve, reject) {
                const tx = db.transaction(STORE_NAME, 'readonly');
                const req = tx.objectStore(STORE_NAME).get(id);
                req.onsuccess = function () { resolve(req.result || null); };
                req.onerror = function () { reject(req.error || new Error('No se pudo leer la imagen.')); };
            });
        } finally {
            db.close();
        }
    }

    async function getAllRecords() {
        const db = await openDb();
        try {
            return await new Promise(function (resolve, reject) {
                const tx = db.transaction(STORE_NAME, 'readonly');
                const req = tx.objectStore(STORE_NAME).getAll();
                req.onsuccess = function () {
                    const records = Array.isArray(req.result) ? req.result : [];
                    records.sort(function (a, b) { return Number(b.createdAt || 0) - Number(a.createdAt || 0); });
                    resolve(records);
                };
                req.onerror = function () { reject(req.error || new Error('No se pudo leer la galería.')); };
            });
        } finally {
            db.close();
        }
    }

    function bytesToHex(buffer) {
        return Array.from(new Uint8Array(buffer)).map(function (value) {
            return value.toString(16).padStart(2, '0');
        }).join('');
    }

    async function hashCode(value) {
        if (!window.crypto || !window.crypto.subtle) throw new Error('El navegador no puede proteger el código de guardado.');
        const data = new TextEncoder().encode(String(value));
        return bytesToHex(await window.crypto.subtle.digest('SHA-256', data));
    }

    function createId() {
        if (window.crypto && typeof window.crypto.randomUUID === 'function') return window.crypto.randomUUID();
        const bytes = new Uint8Array(16);
        window.crypto.getRandomValues(bytes);
        return Array.from(bytes).map(function (value) { return value.toString(16).padStart(2, '0'); }).join('');
    }

    async function hasPngSignature(file) {
        const header = new Uint8Array(await file.slice(0, 8).arrayBuffer());
        const expected = [137, 80, 78, 71, 13, 10, 26, 10];
        return expected.every(function (value, index) { return header[index] === value; });
    }

    async function validateFiles(files) {
        const list = Array.from(files || []);
        if (!list.length) throw new Error('Selecciona al menos una imagen PNG.');
        for (const file of list) {
            if (!/\.png$/i.test(file.name || '') || file.type !== 'image/png') {
                throw new Error('Solo se permiten archivos PNG.');
            }
            if (file.size <= 0 || file.size > MAX_FILE_BYTES) {
                throw new Error('Cada PNG debe pesar entre 1 byte y 15 MB.');
            }
            if (!await hasPngSignature(file)) {
                throw new Error('Uno de los archivos no contiene una firma PNG válida.');
            }
        }
        return list;
    }

    function escapeHtml(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function formatBytes(bytes) {
        const value = Number(bytes || 0);
        if (value < 1024) return value + ' B';
        if (value < 1024 * 1024) return (value / 1024).toFixed(1) + ' KB';
        return (value / (1024 * 1024)).toFixed(1) + ' MB';
    }

    function formatDate(timestamp) {
        try {
            return new Intl.DateTimeFormat('es-DO', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(timestamp));
        } catch (_) {
            return new Date(timestamp).toLocaleString();
        }
    }

    function vaultMarkup() {
        return [
            '<div class="hashcod-image-vault" role="dialog" aria-modal="true" aria-labelledby="hashcodImageVaultTitle">',
                '<header class="hashcod-image-vault-header">',
                    '<div class="hashcod-image-vault-title-group">',
                        '<span class="hashcod-image-vault-mark" aria-hidden="true">', fallbackIcon, '</span>',
                        '<div>',
                            '<h2 id="hashcodImageVaultTitle">PNG Vault</h2>',
                            '<p class="hashcod-image-vault-kicker">Windows Hello / protected local gallery</p>',
                        '</div>',
                    '</div>',
                    '<button type="button" class="hashcod-image-vault-close" id="hashcodImageVaultClose" aria-label="Cerrar">×</button>',
                '</header>',
                '<div class="hashcod-image-vault-controlbar">',
                    '<div class="hashcod-image-vault-auth" id="hashcodImageVaultAuth">',
                        '<span class="hashcod-image-vault-auth-dot" aria-hidden="true"></span>',
                        '<div class="hashcod-image-vault-auth-copy">',
                            '<span class="hashcod-image-vault-auth-title">WINDOWS HELLO</span>',
                            '<span class="hashcod-image-vault-auth-status" id="hashcodImageVaultAuthStatus">Verificación requerida para guardar PNG.</span>',
                        '</div>',
                    '</div>',
                    '<button type="button" class="hashcod-image-vault-verify" id="hashcodImageVaultVerify">Verificar Windows Hello</button>',
                '</div>',
                '<div class="hashcod-image-vault-main">',
                    '<aside class="hashcod-image-vault-upload">',
                        '<p class="hashcod-image-vault-section-label">01 / Cargar PNG</p>',
                        '<label class="hashcod-image-vault-dropzone is-locked" id="hashcodImageVaultDropzone">',
                            '<input type="file" id="hashcodImageVaultFileInput" accept="image/png,.png" multiple disabled>',
                            '<span>',
                                '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M15 3h2v15h-2zM10 8h2v2h-2zM20 8h2v2h-2zM8 10h2v2H8zM22 10h2v2h-2zM6 12h2v12h16V12h2v14H6z"></path></svg>',
                                '<span class="hashcod-image-vault-drop-title">Seleccionar o soltar PNG</span>',
                                '<span class="hashcod-image-vault-drop-note">Primero verifica Windows Hello. Máximo 15 MB por imagen.</span>',
                            '</span>',
                        '</label>',
                        '<div class="hashcod-image-vault-selection" id="hashcodImageVaultSelection">Ningún archivo seleccionado.</div>',
                        '<label class="hashcod-image-vault-field">',
                            '<span>CODE DE GUARDADO</span>',
                            '<input type="password" id="hashcodImageVaultCode" autocomplete="new-password" placeholder="Mínimo 6 caracteres" disabled>',
                        '</label>',
                        '<label class="hashcod-image-vault-field">',
                            '<span>CONFIRMAR CODE</span>',
                            '<input type="password" id="hashcodImageVaultCodeConfirm" autocomplete="new-password" placeholder="Repite el code" disabled>',
                        '</label>',
                        '<button type="button" class="hashcod-image-vault-save" id="hashcodImageVaultSave" disabled>Guardar PNG en la bandeja</button>',
                        '<p class="hashcod-image-vault-message" id="hashcodImageVaultMessage" role="status" aria-live="polite"></p>',
                    '</aside>',
                    '<section class="hashcod-image-vault-gallery-pane">',
                        '<div class="hashcod-image-vault-gallery-head">',
                            '<p class="hashcod-image-vault-section-label">02 / Imágenes guardadas</p>',
                            '<span class="hashcod-image-vault-count" id="hashcodImageVaultCount">0 PNG</span>',
                        '</div>',
                        '<div class="hashcod-image-vault-gallery" id="hashcodImageVaultGallery"></div>',
                    '</section>',
                '</div>',
            '</div>',
            '<div class="hashcod-image-vault-code-dialog" id="hashcodImageVaultCodeDialog" aria-hidden="true">',
                '<div class="hashcod-image-vault-code-card" role="dialog" aria-modal="true" aria-labelledby="hashcodImageVaultCodeTitle">',
                    '<h3 id="hashcodImageVaultCodeTitle">Code de descarga</h3>',
                    '<p>Introduce el mismo code asignado al guardar esta imagen. El code distingue mayúsculas y minúsculas.</p>',
                    '<label class="hashcod-image-vault-field">',
                        '<span>CODE</span>',
                        '<input type="password" id="hashcodImageVaultDownloadCode" autocomplete="off" placeholder="Code de guardado">',
                    '</label>',
                    '<div class="hashcod-image-vault-code-actions">',
                        '<button type="button" id="hashcodImageVaultCancelDownload">Cancelar</button>',
                        '<button type="button" id="hashcodImageVaultConfirmDownload" data-primary="true">Descargar</button>',
                    '</div>',
                    '<div class="hashcod-image-vault-code-error" id="hashcodImageVaultCodeError" role="alert"></div>',
                '</div>',
            '</div>'
        ].join('');
    }

    function ensureOverlay() {
        let overlay = document.getElementById('hashcodImageVaultOverlay');
        if (overlay) return overlay;
        overlay = document.createElement('div');
        overlay.id = 'hashcodImageVaultOverlay';
        overlay.innerHTML = vaultMarkup();
        document.body.appendChild(overlay);
        bindUi(overlay);
        toolState.mounted = true;
        refreshAuthUi();
        renderGallery();
        return overlay;
    }

    function setMessage(text, error) {
        const node = document.getElementById('hashcodImageVaultMessage');
        if (!node) return;
        node.textContent = text || '';
        node.classList.toggle('is-error', error === true);
    }

    function refreshAuthUi() {
        const verified = isAdminVerified();
        const auth = document.getElementById('hashcodImageVaultAuth');
        const status = document.getElementById('hashcodImageVaultAuthStatus');
        const verify = document.getElementById('hashcodImageVaultVerify');
        const input = document.getElementById('hashcodImageVaultFileInput');
        const code = document.getElementById('hashcodImageVaultCode');
        const confirm = document.getElementById('hashcodImageVaultCodeConfirm');
        const save = document.getElementById('hashcodImageVaultSave');
        const zone = document.getElementById('hashcodImageVaultDropzone');
        if (auth) auth.classList.toggle('is-verified', verified);
        if (status) status.textContent = verified ? 'Verificado. Puedes guardar PNG mientras la sesión protegida siga activa.' : 'Verificación requerida para guardar PNG.';
        if (verify) verify.textContent = verified ? 'Windows Hello verificado' : 'Verificar Windows Hello';
        if (input) input.disabled = !verified;
        if (code) code.disabled = !verified;
        if (confirm) confirm.disabled = !verified;
        if (save) save.disabled = !verified;
        if (zone) zone.classList.toggle('is-locked', !verified);
    }

    function revokePreviewUrls() {
        toolState.previewUrls.forEach(function (url) { URL.revokeObjectURL(url); });
        toolState.previewUrls = [];
    }

    function clearSelection() {
        toolState.selectedFiles = [];
        const input = document.getElementById('hashcodImageVaultFileInput');
        if (input) input.value = '';
        const selection = document.getElementById('hashcodImageVaultSelection');
        if (selection) selection.textContent = 'Ningún archivo seleccionado.';
    }

    function setSelectedFiles(files) {
        toolState.selectedFiles = Array.from(files || []);
        const selection = document.getElementById('hashcodImageVaultSelection');
        if (!selection) return;
        if (!toolState.selectedFiles.length) {
            selection.textContent = 'Ningún archivo seleccionado.';
            return;
        }
        const total = toolState.selectedFiles.reduce(function (sum, file) { return sum + file.size; }, 0);
        selection.textContent = toolState.selectedFiles.length + ' PNG seleccionado(s) · ' + formatBytes(total);
    }

    async function renderGallery() {
        const gallery = document.getElementById('hashcodImageVaultGallery');
        const count = document.getElementById('hashcodImageVaultCount');
        if (!gallery) return;
        revokePreviewUrls();
        try {
            const records = await getAllRecords();
            if (count) count.textContent = records.length + (records.length === 1 ? ' PNG' : ' PNG');
            if (!records.length) {
                gallery.innerHTML = '<div class="hashcod-image-vault-empty">Todavía no hay imágenes guardadas.<br>Verifica Windows Hello, selecciona PNG y asigna un code.</div>';
                return;
            }
            gallery.innerHTML = records.map(function (record) {
                const url = URL.createObjectURL(record.blob);
                toolState.previewUrls.push(url);
                return [
                    '<article class="hashcod-image-vault-card">',
                        '<div class="hashcod-image-vault-thumb"><img src="', escapeHtml(url), '" alt="Vista previa de ', escapeHtml(record.name), '"></div>',
                        '<div class="hashcod-image-vault-card-body">',
                            '<p class="hashcod-image-vault-filename" title="', escapeHtml(record.name), '">', escapeHtml(record.name), '</p>',
                            '<p class="hashcod-image-vault-meta">', escapeHtml(formatBytes(record.size)), ' · ', escapeHtml(formatDate(record.createdAt)), '</p>',
                            '<button type="button" class="hashcod-image-vault-download" data-vault-download="', escapeHtml(record.id), '">Descargar con code</button>',
                        '</div>',
                    '</article>'
                ].join('');
            }).join('');
        } catch (error) {
            gallery.innerHTML = '<div class="hashcod-image-vault-empty">No se pudo cargar la galería local.</div>';
            if (count) count.textContent = '—';
            setMessage(error.message || 'No se pudo cargar la galería.', true);
        }
    }

    async function saveSelected() {
        setMessage('', false);
        if (!isAdminVerified()) {
            setMessage('Debes verificar Windows Hello antes de guardar imágenes.', true);
            refreshAuthUi();
            return;
        }
        const codeInput = document.getElementById('hashcodImageVaultCode');
        const confirmInput = document.getElementById('hashcodImageVaultCodeConfirm');
        const code = codeInput ? codeInput.value : '';
        const confirm = confirmInput ? confirmInput.value : '';
        if (code.length < 6) {
            setMessage('El code de guardado debe tener al menos 6 caracteres.', true);
            return;
        }
        if (code !== confirm) {
            setMessage('Los dos codes no coinciden.', true);
            return;
        }
        let files;
        try {
            files = await validateFiles(toolState.selectedFiles);
        } catch (error) {
            setMessage(error.message, true);
            return;
        }
        const saveButton = document.getElementById('hashcodImageVaultSave');
        if (saveButton) saveButton.disabled = true;
        try {
            const codeHash = await hashCode(code);
            for (const file of files) {
                await putRecord({
                    id: createId(),
                    name: file.name,
                    type: 'image/png',
                    size: file.size,
                    createdAt: Date.now(),
                    codeHash: codeHash,
                    blob: file
                });
            }
            if (codeInput) codeInput.value = '';
            if (confirmInput) confirmInput.value = '';
            clearSelection();
            setMessage(files.length + ' PNG guardado(s). El code será requerido para descargar.', false);
            await renderGallery();
        } catch (error) {
            setMessage(error.message || 'No se pudieron guardar las imágenes.', true);
        } finally {
            if (saveButton) saveButton.disabled = !isAdminVerified();
        }
    }

    function openDownloadDialog(id) {
        toolState.downloadTargetId = id;
        const dialog = document.getElementById('hashcodImageVaultCodeDialog');
        const input = document.getElementById('hashcodImageVaultDownloadCode');
        const error = document.getElementById('hashcodImageVaultCodeError');
        if (error) error.textContent = '';
        if (input) input.value = '';
        if (dialog) {
            dialog.classList.add('is-open');
            dialog.setAttribute('aria-hidden', 'false');
        }
        window.setTimeout(function () { if (input) input.focus(); }, 20);
    }

    function closeDownloadDialog() {
        toolState.downloadTargetId = null;
        const dialog = document.getElementById('hashcodImageVaultCodeDialog');
        if (dialog) {
            dialog.classList.remove('is-open');
            dialog.setAttribute('aria-hidden', 'true');
        }
    }

    async function confirmDownload() {
        const id = toolState.downloadTargetId;
        const input = document.getElementById('hashcodImageVaultDownloadCode');
        const errorNode = document.getElementById('hashcodImageVaultCodeError');
        if (!id || !input) return;
        const code = input.value;
        if (!code) {
            if (errorNode) errorNode.textContent = 'Introduce el code de guardado.';
            return;
        }
        try {
            const record = await getRecord(id);
            if (!record) throw new Error('La imagen ya no está disponible.');
            const suppliedHash = await hashCode(code);
            if (suppliedHash !== record.codeHash) {
                if (errorNode) errorNode.textContent = 'Code incorrecto.';
                return;
            }
            const url = URL.createObjectURL(record.blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = record.name || 'hashcod-image.png';
            link.rel = 'noopener';
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.setTimeout(function () { URL.revokeObjectURL(url); }, 1200);
            closeDownloadDialog();
        } catch (error) {
            if (errorNode) errorNode.textContent = error.message || 'No se pudo descargar la imagen.';
        }
    }

    function bindUi(overlay) {
        const close = overlay.querySelector('#hashcodImageVaultClose');
        const verify = overlay.querySelector('#hashcodImageVaultVerify');
        const input = overlay.querySelector('#hashcodImageVaultFileInput');
        const zone = overlay.querySelector('#hashcodImageVaultDropzone');
        const save = overlay.querySelector('#hashcodImageVaultSave');
        const gallery = overlay.querySelector('#hashcodImageVaultGallery');
        const cancelDownload = overlay.querySelector('#hashcodImageVaultCancelDownload');
        const confirmDownloadButton = overlay.querySelector('#hashcodImageVaultConfirmDownload');
        const downloadCode = overlay.querySelector('#hashcodImageVaultDownloadCode');

        close.addEventListener('click', closeVault);
        verify.addEventListener('click', async function () {
            verify.disabled = true;
            setMessage('Esperando confirmación de Windows Hello…', false);
            try {
                const ok = await verifyHello();
                refreshAuthUi();
                setMessage(ok ? 'Windows Hello verificado. La sesión protegida queda activa según la política de la plataforma.' : 'Windows Hello no fue verificado.', ok !== true);
            } catch (error) {
                refreshAuthUi();
                setMessage(error.message || 'No se pudo verificar Windows Hello.', true);
            } finally {
                verify.disabled = false;
            }
        });

        input.addEventListener('change', function () {
            setSelectedFiles(input.files);
            setMessage('', false);
        });

        ['dragenter', 'dragover'].forEach(function (type) {
            zone.addEventListener(type, function (event) {
                event.preventDefault();
                if (!isAdminVerified()) return;
                zone.classList.add('is-dragging');
            });
        });
        ['dragleave', 'drop'].forEach(function (type) {
            zone.addEventListener(type, function (event) {
                event.preventDefault();
                zone.classList.remove('is-dragging');
            });
        });
        zone.addEventListener('drop', function (event) {
            if (!isAdminVerified()) {
                setMessage('Verifica Windows Hello antes de cargar PNG.', true);
                return;
            }
            const files = Array.from(event.dataTransfer && event.dataTransfer.files ? event.dataTransfer.files : []);
            setSelectedFiles(files);
        });

        save.addEventListener('click', saveSelected);
        gallery.addEventListener('click', function (event) {
            const button = event.target.closest('[data-vault-download]');
            if (button) openDownloadDialog(button.dataset.vaultDownload);
        });
        cancelDownload.addEventListener('click', closeDownloadDialog);
        confirmDownloadButton.addEventListener('click', confirmDownload);
        downloadCode.addEventListener('keydown', function (event) {
            if (event.key === 'Enter') confirmDownload();
        });

        overlay.addEventListener('click', function (event) {
            if (event.target === overlay) closeVault();
        });
    }

    async function openVault() {
        const overlay = ensureOverlay();
        overlay.classList.add('is-open');
        document.body.style.overflow = 'hidden';
        refreshAuthUi();
        await renderGallery();
    }

    function closeVault() {
        const overlay = document.getElementById('hashcodImageVaultOverlay');
        if (overlay) overlay.classList.remove('is-open');
        closeDownloadDialog();
        document.body.style.overflow = '';
    }

    function findCurrentIcon() {
        const current = document.querySelector('#hashcodVectorTray [data-vector-tray-slot="0"] svg');
        return current ? current.outerHTML : fallbackIcon;
    }

    function registerTrayTool() {
        if (!window.HashcodVectorTray || typeof window.HashcodVectorTray.registerTool !== 'function') return false;
        window.HashcodVectorTray.registerTool({
            slot: 0,
            id: SLOT_ID,
            label: 'PNG Vault — imágenes protegidas por code',
            iconSvg: findCurrentIcon(),
            onClick: openVault
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

    window.addEventListener('hashcod:admin-auth', function () {
        if (toolState.mounted) refreshAuthUi();
    });
    window.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
            const dialog = document.getElementById('hashcodImageVaultCodeDialog');
            if (dialog && dialog.classList.contains('is-open')) closeDownloadDialog();
            else closeVault();
        }
    });

    window.HashcodImageVault = Object.freeze({
        open: openVault,
        close: closeVault,
        refresh: renderGallery
    });

    waitForTray();
})();
