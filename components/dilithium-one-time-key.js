(function () {
    'use strict';

    if (window.__hashcodDilithiumOneTimeKeyLoaded) return;
    window.__hashcodDilithiumOneTimeKeyLoaded = true;

    const ROTATION_MS = 2 * 60 * 1000;
    const KEY_BYTES = 64;
    const MODAL_ID = 'd5OneTimeKeyModal';
    const STORAGE_ACTIVE_KEY = 'l8_active_dilithium5_key';
    const STORAGE_ACTIVE_EPOCH = 'l8_active_dilithium5_epoch';
    const STORAGE_LEGACY_GATE_KEY = 'l8_active_d5_gate_passcode';
    let candidateKey = '';
    let rotationTimer = null;
    let progressTimer = null;
    let mountedLauncher = null;

    function base64Url(bytes) {
        let binary = '';
        for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
        return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
    }

    function generateRegistrationKey() {
        if (!window.crypto || typeof window.crypto.getRandomValues !== 'function') {
            throw new Error('Este navegador no ofrece un generador criptográfico seguro.');
        }
        const bytes = new Uint8Array(KEY_BYTES);
        window.crypto.getRandomValues(bytes);
        return 'DILITHIUM5-REG-' + base64Url(bytes);
    }

    function fingerprint(key) {
        if (!key) return '---- ---- ---- ----';
        const body = key.replace(/^DILITHIUM5-REG-/, '');
        return [body.slice(0, 4), body.slice(4, 8), body.slice(-8, -4), body.slice(-4)].join(' ');
    }

    function getBasePath() {
        const raw = typeof window.L8_BASE_PATH === 'string' ? window.L8_BASE_PATH : '/';
        if (!raw) return '/';
        return raw.endsWith('/') ? raw : raw + '/';
    }

    function syncClientActiveKey(key, epoch) {
        const cleanKey = String(key || '').trim();
        if (!cleanKey) return;
        const cleanEpoch = Number(epoch) || Date.now();

        window.ACTIVE_DILITHIUM5_GENERATED_KEY = cleanKey;
        window.ACTIVE_DILITHIUM5_EPOCH = cleanEpoch;

        try {
            sessionStorage.setItem(STORAGE_ACTIVE_KEY, cleanKey);
            sessionStorage.setItem(STORAGE_ACTIVE_EPOCH, String(cleanEpoch));
            sessionStorage.setItem(STORAGE_LEGACY_GATE_KEY, cleanKey);
            localStorage.setItem(STORAGE_ACTIVE_KEY, cleanKey);
            localStorage.setItem(STORAGE_ACTIVE_EPOCH, String(cleanEpoch));
            localStorage.setItem(STORAGE_LEGACY_GATE_KEY, cleanKey);
        } catch (error) {}

        try {
            if (typeof window.getActivePlatformDilithiumKey === 'function' && !window.__hashcodActiveKeyGetterSynced) {
                const previousGetter = window.getActivePlatformDilithiumKey;
                window.getActivePlatformDilithiumKey = function () {
                    return window.ACTIVE_DILITHIUM5_GENERATED_KEY || previousGetter();
                };
                window.__hashcodActiveKeyGetterSynced = true;
            }
        } catch (error) {}
    }

    async function activateKeyOnServer(key, epoch) {
        const activationEpoch = Number(epoch) || Date.now();
        const response = await fetch(getBasePath() + 'api/auth/dilithium-active-key', {
            method: 'POST',
            credentials: 'same-origin',
            cache: 'no-store',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                active_key: key,
                epoch: activationEpoch,
                source: 'd5-one-time-key-tool'
            })
        });

        let data = {};
        try { data = await response.json(); } catch (error) {}

        if (!response.ok || !data.ok) {
            if (response.status === 401 || response.status === 403) {
                throw new Error('Vuelve a verificar Windows Hello para activar una clave.');
            }
            throw new Error(data.error || data.message || 'No se pudo activar la clave en el servidor.');
        }

        syncClientActiveKey(key, data.epoch || activationEpoch);
        return data;
    }

    function setStatus(modal, text, state) {
        const status = modal.querySelector('[data-d5-status]');
        if (!status) return;
        status.textContent = text;
        status.dataset.state = state || 'idle';
    }

    function renderCandidate(modal, key) {
        const value = modal.querySelector('[data-d5-key]');
        const fp = modal.querySelector('[data-d5-fingerprint]');
        if (value) value.textContent = key;
        if (fp) fp.textContent = fingerprint(key);
    }

    function resetProgress(modal) {
        const progress = modal.querySelector('[data-d5-progress]');
        if (!progress) return;
        progress.classList.remove('is-running');
        void progress.offsetWidth;
        progress.classList.add('is-running');
    }

    function rotateCandidate(modal, announce) {
        try {
            candidateKey = generateRegistrationKey();
            renderCandidate(modal, candidateKey);
            resetProgress(modal);
            if (announce) {
                setStatus(modal, 'NUEVA CANDIDATA LISTA · ROTACIÓN DE 2 MINUTOS', 'idle');
            }
        } catch (error) {
            candidateKey = '';
            renderCandidate(modal, 'GENERADOR NO DISPONIBLE');
            setStatus(modal, error.message || 'No fue posible generar una clave segura.', 'error');
        }
    }

    function stopRotation() {
        if (rotationTimer) window.clearInterval(rotationTimer);
        if (progressTimer) window.clearTimeout(progressTimer);
        rotationTimer = null;
        progressTimer = null;
    }

    function startRotation(modal) {
        stopRotation();
        rotateCandidate(modal, false);
        rotationTimer = window.setInterval(function () {
            if (!modal.isConnected || !modal.classList.contains('is-open')) return;
            rotateCandidate(modal, true);
        }, ROTATION_MS);
    }

    function closeModal(modal) {
        stopRotation();
        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');
        window.setTimeout(function () {
            if (modal.isConnected && !modal.classList.contains('is-open')) modal.remove();
        }, 220);
        if (mountedLauncher) mountedLauncher.focus();
    }

    function modalMarkup() {
        return [
            '<div class="d5-otk-backdrop" data-d5-close></div>',
            '<section class="d5-otk-panel" role="document">',
                '<header class="d5-otk-header">',
                    '<div class="d5-otk-title-wrap">',
                        '<span class="d5-otk-mark" aria-hidden="true">',
                            '<svg viewBox="0 0 32 32"><path d="M5 5h22v22H5V5zm2 2v18h18V7H7zm5 4h8v2h-8v-2zm-2 4h12v2H10v-2zm2 4h8v2h-8v-2z"/></svg>',
                        '</span>',
                        '<div>',
                            '<span class="d5-otk-kicker">HASHCOD / ONE-TIME ACCESS</span>',
                            '<h2>Clave Dilithium-5 de registro</h2>',
                        '</div>',
                    '</div>',
                    '<button type="button" class="d5-otk-close" data-d5-close aria-label="Cerrar">×</button>',
                '</header>',
                '<div class="d5-otk-body">',
                    '<p class="d5-otk-intro">Se genera una nueva clave candidata cada 2 minutos. <strong>Solo la clave que copies se activa</strong> para un único registro; al usarse queda consumida y no puede reutilizarse.</p>',
                    '<div class="d5-otk-key-card">',
                        '<div class="d5-otk-key-head">',
                            '<span>CLAVE CANDIDATA</span>',
                            '<span class="d5-otk-live"><i></i> 2 min</span>',
                        '</div>',
                        '<code class="d5-otk-key" data-d5-key>GENERANDO…</code>',
                        '<div class="d5-otk-progress"><span data-d5-progress></span></div>',
                        '<div class="d5-otk-fingerprint-row">',
                            '<span>FINGERPRINT</span>',
                            '<code data-d5-fingerprint>---- ---- ---- ----</code>',
                        '</div>',
                    '</div>',
                    '<div class="d5-otk-status" data-d5-status data-state="idle">LISTA PARA ACTIVAR</div>',
                    '<div class="d5-otk-actions">',
                        '<button type="button" class="d5-otk-copy" data-d5-copy>',
                            '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M10 4h16v18h-4v6H6V10h4V4zm2 2v4h10v10h2V6H12zm-4 6v14h12V12H8z"/></svg>',
                            '<span>COPIAR Y ACTIVAR</span>',
                        '</button>',
                    '</div>',
                    '<div class="d5-otk-rule">',
                        '<span>01</span><p>Copiar activa exactamente esa clave en el servidor y en la sesión del navegador.</p>',
                        '<span>02</span><p>El registro correcto consume la clave y bloquea cualquier reutilización.</p>',
                        '<span>03</span><p>La clave candidata visible cambia automáticamente cada 2 minutos.</p>',
                    '</div>',
                '</div>',
            '</section>'
        ].join('');
    }

    function buildModal() {
        const modal = document.createElement('div');
        modal.id = MODAL_ID;
        modal.className = 'd5-otk-modal';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-hidden', 'true');
        modal.setAttribute('aria-label', 'Generador de clave Dilithium-5 de registro de un solo uso');
        modal.innerHTML = modalMarkup();

        modal.querySelectorAll('[data-d5-close]').forEach(function (el) {
            el.addEventListener('click', function () { closeModal(modal); });
        });

        const copyButton = modal.querySelector('[data-d5-copy]');
        copyButton.addEventListener('click', async function () {
            if (!candidateKey || copyButton.disabled) return;
            const keyToActivate = candidateKey;
            const activationEpoch = Date.now();
            copyButton.disabled = true;
            copyButton.setAttribute('aria-busy', 'true');
            setStatus(modal, 'ACTIVANDO Y SINCRONIZANDO…', 'working');

            try {
                const activation = await activateKeyOnServer(keyToActivate, activationEpoch);
                syncClientActiveKey(keyToActivate, activation.epoch || activationEpoch);

                try {
                    await navigator.clipboard.writeText(keyToActivate);
                } catch (clipboardError) {
                    const range = document.createRange();
                    const keyNode = modal.querySelector('[data-d5-key]');
                    if (keyNode) {
                        range.selectNodeContents(keyNode);
                        const selection = window.getSelection();
                        selection.removeAllRanges();
                        selection.addRange(range);
                    }
                    throw new Error('La clave quedó activa y sincronizada. Selecciónala y cópiala manualmente.');
                }

                setStatus(modal, 'COPIADA · SINCRONIZADA · ACTIVA PARA 1 REGISTRO', 'success');
                window.dispatchEvent(new CustomEvent('hashcod:dilithium-key-activated', {
                    detail: {
                        fingerprint: fingerprint(keyToActivate),
                        epoch: activation.epoch || activationEpoch,
                        activeKeyHash: activation.active_key_hash || activation.hash || ''
                    }
                }));
            } catch (error) {
                setStatus(modal, error.message || 'No se pudo copiar y activar la clave.', 'error');
            } finally {
                copyButton.disabled = false;
                copyButton.removeAttribute('aria-busy');
            }
        });

        modal.addEventListener('keydown', function (event) {
            if (event.key === 'Escape') closeModal(modal);
        });

        return modal;
    }

    function openTool() {
        const legacyGate = document.getElementById('dilithiumGateModal');
        const legacyGenerator = document.getElementById('dilithiumGeneratorModal');
        if (legacyGate) { legacyGate.style.display = 'none'; legacyGate.classList.remove('open'); }
        if (legacyGenerator) { legacyGenerator.style.display = 'none'; legacyGenerator.classList.remove('open'); }

        let modal = document.getElementById(MODAL_ID);
        if (!modal) {
            modal = buildModal();
            document.body.appendChild(modal);
        }
        modal.setAttribute('aria-hidden', 'false');
        requestAnimationFrame(function () {
            modal.classList.add('is-open');
            startRotation(modal);
            const closeButton = modal.querySelector('.d5-otk-close');
            if (closeButton) closeButton.focus({ preventScroll: true });
        });
    }

    // Public opener used by the external vertical utility rail. The sensitive
    // server action inside the tool still requires the authenticated admin session.
    window.openDilithiumOneTimeKeyTool = openTool;

    function bindLauncher() {
        const launcher = document.getElementById('d5LauncherBtn');
        if (!launcher || launcher.dataset.d5OneTimeBound === 'true') return false;
        mountedLauncher = launcher;
        launcher.dataset.d5OneTimeBound = 'true';
        launcher.setAttribute('title', 'Generar clave Dilithium-5 de registro de un solo uso');
        launcher.setAttribute('aria-label', 'Abrir generador de claves Dilithium-5 de un solo uso');

        launcher.addEventListener('click', function (event) {
            event.preventDefault();
            event.stopImmediatePropagation();
            openTool();
        }, true);
        return true;
    }

    if (!bindLauncher()) {
        const observer = new MutationObserver(function () {
            if (bindLauncher()) observer.disconnect();
        });
        observer.observe(document.documentElement, { childList: true, subtree: true });
        window.setTimeout(function () { observer.disconnect(); }, 20000);
    }
})();