(function () {
    'use strict';

    if (window.__hashcodDilithiumOneTimeKeyLoaded) return;
    window.__hashcodDilithiumOneTimeKeyLoaded = true;

    const ROTATION_MS = 1000;
    const KEY_BYTES = 64;
    const MODAL_ID = 'd5OneTimeKeyModal';
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

    async function activateKeyOnServer(key) {
        const response = await fetch(getBasePath() + 'api/auth/dilithium-active-key', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                active_key: key,
                epoch: Date.now(),
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

    function rotateCandidate(modal) {
        try {
            candidateKey = generateRegistrationKey();
            renderCandidate(modal, candidateKey);
            resetProgress(modal);
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
        rotateCandidate(modal);
        rotationTimer = window.setInterval(function () {
            if (!modal.isConnected || !modal.classList.contains('is-open')) return;
            rotateCandidate(modal);
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
                    '<p class="d5-otk-intro">Se genera una nueva clave candidata cada segundo. <strong>Solo la clave que copies se activa</strong> para un único registro; al usarse queda consumida y no puede reutilizarse.</p>',
                    '<div class="d5-otk-key-card">',
                        '<div class="d5-otk-key-head">',
                            '<span>CLAVE CANDIDATA</span>',
                            '<span class="d5-otk-live"><i></i> 1 s</span>',
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
                        '<span>01</span><p>Copiar activa exactamente esa clave en el servidor.</p>',
                        '<span>02</span><p>El registro correcto consume la clave y bloquea cualquier reutilización.</p>',
                        '<span>03</span><p>La siguiente clave que copies pasa a ser la nueva clave válida.</p>',
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
            copyButton.disabled = true;
            copyButton.setAttribute('aria-busy', 'true');
            setStatus(modal, 'ACTIVANDO EN EL SERVIDOR…', 'working');

            try {
                await activateKeyOnServer(keyToActivate);

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
                    throw new Error('La clave quedó activa. Selecciónala y cópiala manualmente.');
                }

                setStatus(modal, 'COPIADA · ACTIVA PARA 1 REGISTRO', 'success');
                window.dispatchEvent(new CustomEvent('hashcod:dilithium-key-activated', {
                    detail: { fingerprint: fingerprint(keyToActivate), epoch: Date.now() }
                }));

                window.setTimeout(function () {
                    if (!modal.isConnected || !modal.classList.contains('is-open')) return;
                    rotateCandidate(modal);
                    setStatus(modal, 'NUEVA CANDIDATA LISTA · LA COPIADA SIGUE ACTIVA', 'idle');
                }, 420);
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
