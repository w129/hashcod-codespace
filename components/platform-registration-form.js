(function () {
    'use strict';
    // WhatsApp-only registration flow: no persisted request table and no administrative gate.
    if (window.__hashcodPlatformRegistrationLoaded) return;
    window.__hashcodPlatformRegistrationLoaded = true;

    const ROOT_ID = 'hashcodPlatformRegistration';
    const FINAL_SCREEN_LEGACY_SELECTORS = [
        '#authOverlay',
        '#authWrapper',
        '#bootCliOverlay',
        '.boot-cli-overlay',
        '#hashcodRareFolderHost',
        '#hashcodBootFolderAnimation',
        '#hashcodVectorTray',
        '#hashcodAuthUtilityDock',
        '#groqAuthChatPanel',
        '#groqAuthChatLauncher',
        '#hashcodEfrHotzone',
        '#cryptoCardValidationLauncherBtn',
        '#d5LauncherBtn',
        '#hashcodUxActions',
        '[data-hashcod-auth-utility-dock]',
        '[data-hashcod-third-screen-legacy]'
    ];
    let whatsappDispatched = false;
    let whatsappDispatchFingerprint = '';
    let entryConfirmed = false;
    let registrationGatePromise = null;
    let registrationGateResolve = null;
    let fieldCache = null;
    const hintCache = Object.create(null);
    let validationFrame = 0;
    let temporaryAccessTimer = 0;
    let temporaryAccessExpiresAt = 0;
    let temporaryAccessGrant = null;
    const TEMPORARY_ACCESS_STORAGE_KEY = 'hashcod_temporary_access_expires_v1';
    const TEMPORARY_ACCESS_MAX_MS = 24 * 60 * 60 * 1000;
    const TEMPORARY_ACCESS_ICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" preserveAspectRatio="xMidYMid meet" focusable="false" aria-hidden="true"><path d="M 4 6 L 4 13 L 6 13 L 6 8 L 19 8 L 19 9 L 21 9 L 21 8 L 26 8 L 26 13 L 28 13 L 28 6 L 4 6 z M 26 13 L 24 13 L 24 19 L 26 19 L 26 13 z M 26 19 L 26 24 L 21 24 L 21 23 L 19 23 L 19 24 L 6 24 L 6 19 L 4 19 L 4 26 L 28 26 L 28 19 L 26 19 z M 6 19 L 8 19 L 8 13 L 6 13 L 6 19 z M 19 11 L 19 13 L 21 13 L 21 11 L 19 11 z M 19 15 L 19 17 L 21 17 L 21 15 L 19 15 z M 19 19 L 19 21 L 21 21 L 21 19 L 19 19 z"></path></svg>';
    const WHATSAPP_ICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 32" preserveAspectRatio="xMidYMid meet" focusable="false" aria-hidden="true"><path d="M 5 3 L 5 9 L 7 9 L 7 5 L 9 5 L 9 3 L 5 3 z M 9 5 L 9 7 L 13 7 L 13 5 L 9 5 z M 13 7 L 13 9 L 17 9 L 17 7 L 13 7 z M 17 9 L 17 11 L 21 11 L 21 9 L 17 9 z M 21 11 L 21 13 L 25 13 L 25 11 L 21 11 z M 25 13 L 25 15 L 29 15 L 29 13 L 25 13 z M 29 15 L 29 17 L 31 17 L 31 15 L 29 15 z M 29 17 L 25 17 L 25 19 L 29 19 L 29 17 z M 25 19 L 21 19 L 21 21 L 25 21 L 25 19 z M 21 21 L 17 21 L 17 23 L 21 23 L 21 21 z M 17 23 L 13 23 L 13 25 L 17 25 L 17 23 z M 13 25 L 9 25 L 9 27 L 13 27 L 13 25 z M 9 27 L 7 27 L 7 23 L 5 23 L 5 29 L 9 29 L 9 27 z M 7 23 L 9 23 L 9 19 L 7 19 L 7 23 z M 9 19 L 11 19 L 11 17 L 19 17 L 19 15 L 11 15 L 11 13 L 9 13 L 9 15 L 9 17 L 9 19 z M 9 13 L 9 9 L 7 9 L 7 13 L 9 13 z"></path></svg>';
    const WHATSAPP_NUMBER = '18294721257';
    let currentRegistrationCode = '';
    let currentRegistrationFingerprint = '';

    const CODE_UPLOAD_ICON = '<svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="100" height="100" viewBox="0 0 32 32" aria-hidden="true"><path d="M 10 4 L 10 6 L 20 6 L 20 4 L 10 4 z M 20 6 L 20 12 L 22 12 L 22 6 L 20 6 z M 22 12 L 22 14 L 25 14 L 25 20 L 27 20 L 27 18 L 30 18 L 30 16 L 27 16 L 27 12 L 22 12 z M 30 18 L 30 24 L 32 24 L 32 18 L 30 18 z M 30 24 L 20 24 L 20 26 L 30 26 L 30 24 z M 10 6 L 8 6 L 8 9 L 6 9 L 6 11 L 14 11 L 14 9 L 10 9 L 10 6 z M 6 11 L 4 11 L 4 14 L 2 14 L 2 16 L 6 16 L 6 11 z M 2 16 L 0 16 L 0 24 L 2 24 L 2 16 z M 2 24 L 2 26 L 10 26 L 10 24 L 2 24 z M 14 15 L 14 17 L 12 17 L 12 19 L 10 19 L 10 21 L 14 21 L 14 30 L 16 30 L 16 21 L 20 21 L 20 19 L 18 19 L 18 17 L 16 17 L 16 15 L 14 15 z"></path></svg>';
    const MAX_CODE_FILE_BYTES = 30 * 1024 * 1024;
    const CODE_FILE_EXTENSIONS = /\.(?:zip|tar|gz|txt|md|json|js|jsx|ts|tsx|html?|css|php|py|java|go|rs|cs|c|cc|cpp|h|hpp|sql|xml|ya?ml|toml|sh|coffee)$/i;
    let selectedCodeFile = null;
    let turnstileRequired = false;
    let turnstileVerified = false;
    let turnstileVerifiedUntil = 0;
    let turnstileWidgetId = null;
    let turnstileSiteKey = '';
    let turnstileScriptPromise = null;
    let pendingTurnstileSubmission = false;
    let turnstileAutoRetrying = false;

    function baseUrl() {
        const base = document.querySelector('base[href]');
        try { return new URL(base ? base.getAttribute('href') : './', window.location.href); }
        catch (_) { return new URL('./', window.location.href); }
    }
    function adminStatusUrl() { return new URL('api/admin-device/status', baseUrl()).toString(); }
    function turnstileConfigUrl() { return new URL('api/cloudflare/turnstile/config', baseUrl()).toString(); }
    function turnstileVerifyUrl() { return new URL('api/cloudflare/turnstile/verify', baseUrl()).toString(); }
    function escapeHtml(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }
    function digits(value) { return String(value || '').replace(/\D+/g, ''); }
    function formatCedula(value) {
        const raw = digits(value).slice(0, 11);
        if (raw.length <= 3) return raw;
        if (raw.length <= 10) return raw.slice(0, 3) + '-' + raw.slice(3);
        return raw.slice(0, 3) + '-' + raw.slice(3, 10) + '-' + raw.slice(10);
    }
    function validCedula(value) { return /^\d{3}-\d{7}-\d$/.test(String(value || '')); }
    function validPhone(value) { return /^\+?[0-9][0-9\s().-]{6,24}$/.test(String(value || '').trim()); }
    function fullNameValid(value) {
        const text = String(value || '').trim();
        return text.length >= 4 && text.length <= 120 && /^\S+\s+\S+/u.test(text);
    }

    function hardRetireThirdScreen() {
        if (!document.body || document.documentElement.dataset.hashcodFinalEntryScreen !== 'true') return false;

        const registrationRoot = document.getElementById(ROOT_ID);
        const selector = FINAL_SCREEN_LEGACY_SELECTORS.join(',');

        // One selector pass is considerably cheaper than rescanning the complete
        // document once per legacy selector. This cleanup is intentionally
        // one-shot; legacy-auth-retirement owns any later compatibility mounts.
        document.querySelectorAll(selector).forEach(function (node) {
            if (!node || node === registrationRoot) return;
            if (registrationRoot && registrationRoot.contains(node)) return;
            try { node.remove(); } catch (_) {
                node.hidden = true;
                node.setAttribute('aria-hidden', 'true');
                node.style.setProperty('display', 'none', 'important');
                node.style.setProperty('visibility', 'hidden', 'important');
                node.style.setProperty('opacity', '0', 'important');
                node.style.setProperty('pointer-events', 'none', 'important');
            }
        });

        document.body.classList.remove('auth-locked', 'boot-locked');
        document.body.removeAttribute('data-auth-locked');
        document.body.removeAttribute('aria-busy');
        document.documentElement.classList.remove('auth-locked', 'boot-locked');
        return true;
    }

    function revealFinalRegistration(source) {
        const root = document.documentElement;
        const alreadyFinal = root.dataset.hashcodFinalEntryScreen === 'true';
        root.dataset.hashcodFinalEntryScreen = 'true';
        if (!alreadyFinal) {
            window.dispatchEvent(new CustomEvent('hashcod:final-entry-screen', {
                detail: { screen: 3, source: source || 'platform-registration' }
            }));
        } else {
            mount();
        }
    }

    function armFinalScreenFallback() {
        document.addEventListener('click', function (event) {
            const target = event.target;
            const button = target && typeof target.closest === 'function'
                ? target.closest('#hashcodHoldContinue')
                : null;
            if (!button || button.disabled) return;

            // The hold overlay spends ~800 ms finishing its exit. If an older
            // cached hold script never publishes the third-screen marker, make
            // the registration component authoritative after that handoff.
            window.setTimeout(function () {
                revealFinalRegistration('platform-registration-continue-fallback');
            }, 900);
        }, true);
    }

    function armFinalScreenRecovery() {
        if (!document.body) {
            document.addEventListener('DOMContentLoaded', armFinalScreenRecovery, { once: true });
            return;
        }
        if (typeof MutationObserver !== 'function') return;

        const target = document.body;
        let sawHold = Boolean(document.getElementById('hashcodEntryHold'));
        const observer = new MutationObserver(function () {
            if (document.documentElement.dataset.hashcodFinalEntryScreen === 'true') {
                observer.disconnect();
                return;
            }

            const hold = document.getElementById('hashcodEntryHold');
            if (hold) {
                sawHold = true;
                return;
            }

            if (sawHold) {
                observer.disconnect();
                revealFinalRegistration('platform-registration-hold-disconnected');
            }
        });

        // The hold overlay is appended directly to body, so subtree observation
        // and a 100 ms polling loop are unnecessary.
        observer.observe(target, { childList: true });
        window.addEventListener('hashcod:final-entry-screen', function () {
            observer.disconnect();
        }, { once: true });
    }

    function formMarkup() {
        return `
            <header class="hashcod-registration-head">
                <div>
                    <p class="hashcod-registration-kicker">HASHCOD / REGISTRO / +18</p>
                    <h1 class="hashcod-registration-title">Registro de plataforma</h1>
                    <p class="hashcod-registration-subtitle">Completa los datos solicitados para registrar tu plataforma. Todos los campos son obligatorios.</p>
                </div>
                <span class="hashcod-registration-badge">18+ ONLY</span>
            </header>
            <form id="hashcodRegistrationForm" novalidate autocomplete="off" data-no-autosave data-hashcod-autosave="off">
                <div class="hashcod-registration-grid">
                    <div class="hashcod-registration-field is-wide">
                        <label for="hashcodRegFullName">Nombre con apellidos</label>
                        <input id="hashcodRegFullName" name="full_name" type="text" maxlength="120" autocomplete="name" required placeholder="Nombre y apellidos">
                        <span class="hashcod-registration-hint" data-hint="full_name">Escribe al menos nombre y apellido.</span>
                    </div>
                    <div class="hashcod-registration-field">
                        <label for="hashcodRegAge">Edad</label>
                        <input id="hashcodRegAge" name="age" type="number" min="18" max="120" inputmode="numeric" required placeholder="18">
                        <span class="hashcod-registration-hint" data-hint="age">Debes tener 18 años o más.</span>
                    </div>
                    <div class="hashcod-registration-field">
                        <label for="hashcodRegCedula">Cédula con guiones</label>
                        <input id="hashcodRegCedula" name="cedula" type="text" inputmode="numeric" maxlength="13" required placeholder="000-0000000-0">
                        <span class="hashcod-registration-hint" data-hint="cedula">Formato: 000-0000000-0.</span>
                    </div>
                    <div class="hashcod-registration-field is-wide">
                        <label for="hashcodRegPlatform">Nombre de su plataforma</label>
                        <div class="hashcod-registration-platform-upload">
                            <input id="hashcodRegPlatform" name="platform_name" type="text" maxlength="120" required placeholder="Nombre de la plataforma">
                            <input id="hashcodRegCodeFile" name="code_file" type="file" hidden accept=".zip,.tar,.gz,.txt,.md,.json,.js,.jsx,.ts,.tsx,.html,.htm,.css,.php,.py,.java,.go,.rs,.cs,.c,.cc,.cpp,.h,.hpp,.sql,.xml,.yaml,.yml,.toml,.sh,.coffee">
                            <button id="hashcodRegCodeButton" type="button" aria-label="Subir código de la plataforma" aria-pressed="false" title="Subir código de la plataforma">${CODE_UPLOAD_ICON}</button>
                        </div>
                        <span class="hashcod-registration-hint" data-hint="platform_name"></span>
                        <span class="hashcod-registration-hint hashcod-registration-code-hint" data-hint="code_file">Sube la explicación del code de tu plataforma. Maximo 30 MB</span>
                    </div>
                    <div class="hashcod-registration-field">
                        <label for="hashcodRegEmail">Correo electrónico</label>
                        <input id="hashcodRegEmail" name="email" type="email" maxlength="254" autocomplete="email" required placeholder="correo@ejemplo.com">
                        <span class="hashcod-registration-hint" data-hint="email"></span>
                    </div>
                    <div class="hashcod-registration-field">
                        <label for="hashcodRegPhone">Número de teléfono</label>
                        <input id="hashcodRegPhone" name="phone" type="tel" maxlength="25" autocomplete="tel" required placeholder="+1 809 000 0000">
                        <span class="hashcod-registration-hint" data-hint="phone"></span>
                    </div>
                    <div
                        id="hashcodRegistrationProgress"
                        class="hashcod-registration-progress"
                        role="progressbar"
                        aria-label="Progreso del formulario"
                        aria-valuemin="0"
                        aria-valuemax="100"
                        aria-valuenow="0"
                    >
                        <div class="hashcod-registration-progress-head">
                            <span>Progreso del formulario</span>
                            <span id="hashcodRegistrationProgressValue">0%</span>
                        </div>
                        <div class="hashcod-registration-progress-track" aria-hidden="true">
                            <span id="hashcodRegistrationProgressIndicator" class="hashcod-registration-progress-indicator"></span>
                        </div>
                        <span id="hashcodRegistrationProgressHint" class="hashcod-registration-progress-hint">
                            Completa todos los campos para habilitar la aceptación.
                        </span>
                    </div>
                    <label class="hashcod-registration-consent" for="hashcodRegConsent">
                        <input id="hashcodRegConsent" class="hashcod-radix-checkbox-input" name="consent" type="checkbox" required>
                        <span class="hashcod-radix-checkbox" aria-hidden="true">
                            <svg viewBox="0 0 16 16" focusable="false">
                                <path d="M3.25 8.15 6.45 11.2 12.8 4.9"></path>
                            </svg>
                        </span>
                        <span class="hashcod-registration-consent-text">
                            Confirmo que tengo 18 años o más. He leído y acepto contractualmente el
                            <span class="hashcod-preview-link-card">
                                <a
                                    id="hashcodPrivacyPreviewTrigger"
                                    class="hashcod-preview-link-card-trigger"
                                    href="privacy"
                                    target="_blank"
                                    rel="noopener"
                                    aria-describedby="hashcodPrivacyPreviewCard"
                                >Documento Contractual y de Privacidad</a>
                                <span
                                    id="hashcodPrivacyPreviewCard"
                                    class="hashcod-preview-link-card-content"
                                    aria-hidden="true"
                                    data-preview-src="privacy"
                                >
                                    <span class="hashcod-preview-link-card-browser">
                                        <span class="hashcod-preview-link-card-toolbar">
                                            <span class="hashcod-preview-link-card-dots" aria-hidden="true"><i></i><i></i><i></i></span>
                                            <span class="hashcod-preview-link-card-address">hashcod / contrato / privacidad</span>
                                        </span>
                                        <span class="hashcod-preview-link-card-viewport">
                                            <span
                                                class="hashcod-preview-link-card-snapshot"
                                                role="img"
                                                aria-label="Vista previa del Documento Contractual y de Privacidad"
                                            >
                                                <span class="hashcod-preview-link-card-loading">Cargando vista previa…</span>
                                            </span>
                                        </span>
                                    </span>
                                    <span class="hashcod-preview-link-card-meta">
                                        <strong>Documento Contractual y de Privacidad</strong>
                                        <span>Versión 2026.09.18-2 · abrir documento</span>
                                    </span>
                                </span>
                            </span>.
                        </span>
                    </label>
                </div>
                <div class="hashcod-registration-actions">
                    <button
                        id="hashcodTemporaryAccessButton"
                        type="button"
                        aria-label="Entrar temporalmente sin llenar el formulario"
                        title="Acceso temporal"
                    >${TEMPORARY_ACCESS_ICON}</button>
                    <div
                        id="hashcodRegistrationSubmitReactHost"
                        class="hashcod-registration-submit-react-host"
                        data-enabled="false"
                        data-submitting="false"
                    >
                        <button id="hashcodRegistrationSubmit" type="button" aria-label="Entrar a Hashcod Codespace" disabled>
                            ENTRAR A HASHCOD CODESPACE
                        </button>
                    </div>
                    <button id="hashcodRegistrationWhatsappButton" type="button" aria-label="Enviar solicitud por WhatsApp" title="Enviar solicitud por WhatsApp" disabled>${WHATSAPP_ICON}</button>
                    <div class="hashcod-registration-validity-note" aria-label="Validez del proyecto generado por inteligencia artificial">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true">
                            <path d="M 9 5 L 9 7 L 23 7 L 23 5 L 9 5 z M 23 7 L 23 10 L 25 10 L 25 7 L 23 7 z M 25 10 L 25 14 L 27 14 L 27 10 L 25 10 z M 27 14 L 27 17 L 5 17 L 5 14 L 3 14 L 3 27 L 29 27 L 29 14 L 27 14 z M 5 14 L 7 14 L 7 10 L 5 10 L 5 14 z M 7 10 L 9 10 L 9 7 L 7 7 L 7 10 z M 12 9 L 12 11 L 20 11 L 20 9 L 12 9 z M 20 11 L 20 13 L 22 13 L 22 11 L 20 11 z M 20 13 L 17 13 L 17 12 L 15 12 L 15 13 L 12 13 L 12 15 L 20 15 L 20 13 z M 12 13 L 12 11 L 10 11 L 10 13 L 12 13 z M 5 19 L 27 19 L 27 25 L 5 25 L 5 19 z M 23 21 L 23 23 L 25 23 L 25 21 L 23 21 z"></path>
                        </svg>
                        <span>Haciendo que tu proyecto hecho por IA tenga validez legal</span>
                    </div>
                    <div class="hashcod-registration-faq" data-hashcod-accordion>
                        <div class="hashcod-registration-faq-item">
                            <button
                                type="button"
                                class="hashcod-registration-faq-trigger"
                                aria-expanded="false"
                                aria-controls="hashcodFaqPanelTrust"
                            >
                                <span>¿Cómo sé que esto no es una estafa?</span>
                                <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 7.5 10 12.5 15 7.5"></path></svg>
                            </button>
                            <div id="hashcodFaqPanelTrust" class="hashcod-registration-faq-panel" aria-hidden="true">
                                <div class="hashcod-registration-faq-panel-inner">
                                    Ve a donde dice <strong>Documento Contractual y de Privacidad</strong>.
                                </div>
                            </div>
                        </div>

                        <div class="hashcod-registration-faq-item">
                            <button
                                type="button"
                                class="hashcod-registration-faq-trigger"
                                aria-expanded="false"
                                aria-controls="hashcodFaqPanelPrice"
                            >
                                <span>¿Cuánto cobran?</span>
                                <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 7.5 10 12.5 15 7.5"></path></svg>
                            </button>
                            <div id="hashcodFaqPanelPrice" class="hashcod-registration-faq-panel" aria-hidden="true">
                                <div class="hashcod-registration-faq-panel-inner">
                                    <div class="hashcod-registration-price-list">
                                        <div><span>Por someter a solicitud</span><strong>RD$567</strong></div>
                                        <div><span>Por revisar tu code o lo que sea que hagas con IA</span><strong>RD$2,000</strong></div>
                                        <div><span>Por alojar tu plataforma en nuestro codespace post-cuántico</span><strong>RD$6,900</strong></div>
                                        <div><span>Por la Certificación</span><strong>RD$10,000</strong></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="hashcod-registration-faq-item">
                            <button
                                type="button"
                                class="hashcod-registration-faq-trigger"
                                aria-expanded="false"
                                aria-controls="hashcodFaqPanelReady"
                            >
                                <span>¿Cuándo estará lista la Plataforma?</span>
                                <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 7.5 10 12.5 15 7.5"></path></svg>
                            </button>
                            <div id="hashcodFaqPanelReady" class="hashcod-registration-faq-panel" aria-hidden="true">
                                <div class="hashcod-registration-faq-panel-inner">
                                    Lo avisaremos por nuestras redes sociales (<strong>hashcod.app</strong>).
                                </div>
                            </div>
                        </div>
                    </div>
                    <div
                        id="hashcodRegistrationNotificationListHost"
                        class="hashcod-registration-notification-host"
                        aria-label="Información del proceso de validación y certificación"
                    ></div>
                </div>
                <p id="hashcodRegistrationStatus" class="hashcod-registration-status" role="status" aria-live="polite"></p>
            </form>
        `;
    }

    function temporaryAccessDialogMarkup() {
        return `
            <dialog id="hashcodTemporaryAccessDialog" aria-labelledby="hashcodTemporaryAccessTitle">
                <div class="hashcod-temporary-access-card">
                    <div class="hashcod-temporary-access-kicker">HASHCOD · ACCESO TEMPORAL</div>
                    <h2 id="hashcodTemporaryAccessTitle">¿Cuánto tiempo quieres permanecer?</h2>
                    <p>
                        Este acceso omite los demás datos del formulario, pero mantiene el requisito 18+.
                        Cuando el tiempo termine, Codespace cerrará esta sesión temporal y volverá al inicio.
                    </p>
                    <label class="hashcod-temporary-access-age" for="hashcodTemporaryAccessAge">
                        <span>Edad</span>
                        <input
                            id="hashcodTemporaryAccessAge"
                            type="number"
                            inputmode="numeric"
                            min="18"
                            max="120"
                            step="1"
                            placeholder="18"
                            aria-label="Edad para el acceso temporal"
                        >
                    </label>
                    <div class="hashcod-temporary-access-duration">
                        <input
                            id="hashcodTemporaryAccessDuration"
                            type="number"
                            inputmode="numeric"
                            min="1"
                            step="1"
                            value="30"
                            aria-label="Duración del acceso temporal"
                        >
                        <select id="hashcodTemporaryAccessUnit" aria-label="Unidad de tiempo">
                            <option value="minutes">minutos</option>
                            <option value="hours">horas</option>
                        </select>
                    </div>
                    <span class="hashcod-temporary-access-limit">Máximo: 24 horas.</span>
                    <span id="hashcodTemporaryAccessStatus" class="hashcod-temporary-access-status" role="status" aria-live="polite"></span>
                    <div class="hashcod-temporary-access-actions">
                        <button id="hashcodTemporaryAccessCancel" type="button">CANCELAR</button>
                        <button id="hashcodTemporaryAccessConfirm" type="button">ENTRAR TEMPORALMENTE</button>
                    </div>
                </div>
            </dialog>
        `;
    }

    function registrationCodeReceiptMarkup() {
        return `
            <div id="hashcodRegistrationCodeReceipt" aria-hidden="true">
                <section class="hashcod-registration-code-card" role="dialog" aria-modal="true" aria-labelledby="hashcodRegistrationCodeTitle">
                    <div class="hashcod-registration-code-kicker">HASHCOD · REGISTRATION CODE</div>
                    <h2 id="hashcodRegistrationCodeTitle">Guarda tu código criptográfico</h2>
                    <p>
                        Este código identifica este registro. Se muestra en claro solamente en esta confirmación.
                        Guárdalo para verificar futuras comunicaciones relacionadas con tu solicitud.
                    </p>
                    <code id="hashcodRegistrationPrivateCode" aria-label="Código criptográfico del registro"></code>
                    <div class="hashcod-registration-code-actions">
                        <button id="hashcodRegistrationCopyCode" type="button">COPIAR CÓDIGO</button>
                        <button id="hashcodRegistrationContinueAfterCode" type="button">CONTINUAR A HASHCOD</button>
                    </div>
                    <span id="hashcodRegistrationCodeCopyStatus" class="hashcod-registration-code-copy-status" role="status" aria-live="polite"></span>
                </section>
            </div>
        `;
    }

    function mount() {
        if (!document.body) return false;
        if (document.documentElement.dataset.hashcodFinalEntryScreen !== 'true') return false;

        let root = document.getElementById(ROOT_ID);
        if (!root) {
            // Screen 3 is a hard replacement, never an extension of the retired
            // login/boot document. Run the expensive cleanup only on first mount.
            hardRetireThirdScreen();
            root = document.createElement('section');
            root.id = ROOT_ID;
            root.dataset.hashcodScreen = '3';
            root.setAttribute('aria-label', 'Tercera pantalla: registro de plataforma');
            root.innerHTML = formMarkup();
            document.body.appendChild(root);
            window.dispatchEvent(new CustomEvent('hashcod:registration-form-mounted', {
                detail: { screen: 3 }
            }));
        }
        if (!document.getElementById('hashcodRegistrationCodeReceipt')) {
            document.body.insertAdjacentHTML('beforeend', registrationCodeReceiptMarkup());
        }
        if (!document.getElementById('hashcodTemporaryAccessDialog')) {
            document.body.insertAdjacentHTML('beforeend', temporaryAccessDialogMarkup());
        }
        bind();
        validate();
        return true;
    }

    function fields() {
        if (fieldCache && fieldCache.full_name && fieldCache.full_name.isConnected) {
            return fieldCache;
        }
        fieldCache = {
            full_name: document.getElementById('hashcodRegFullName'),
            age: document.getElementById('hashcodRegAge'),
            cedula: document.getElementById('hashcodRegCedula'),
            platform_name: document.getElementById('hashcodRegPlatform'),
            code_file: document.getElementById('hashcodRegCodeFile'),
            email: document.getElementById('hashcodRegEmail'),
            phone: document.getElementById('hashcodRegPhone'),
            consent: document.getElementById('hashcodRegConsent')
        };
        return fieldCache;
    }

    function setHint(name, message, isError) {
        let hint = hintCache[name];
        if (!hint || !hint.isConnected) {
            hint = document.querySelector('[data-hint="' + name + '"]');
            hintCache[name] = hint;
        }
        if (!hint) return;
        if (message !== undefined) hint.textContent = message;
        hint.classList.toggle('is-error', Boolean(isError));
    }

    function validity() {
        const f = fields();
        const age = Number(f.age && f.age.value);
        const emailOk = Boolean(f.email && f.email.value && f.email.checkValidity());
        return {
            full_name: Boolean(f.full_name && fullNameValid(f.full_name.value)),
            age: Number.isInteger(age) && age >= 18 && age <= 120,
            cedula: Boolean(f.cedula && validCedula(f.cedula.value)),
            platform_name: Boolean(f.platform_name && f.platform_name.value.trim().length >= 2 && f.platform_name.value.trim().length <= 120),
            code_file: Boolean(selectedCodeFile),
            email: emailOk,
            phone: Boolean(f.phone && validPhone(f.phone.value)),
            consent: Boolean(f.consent && f.consent.checked)
        };
    }

    function updateProgress(v) {
        const progress = document.getElementById('hashcodRegistrationProgress');
        const indicator = document.getElementById('hashcodRegistrationProgressIndicator');
        const value = document.getElementById('hashcodRegistrationProgressValue');
        const hint = document.getElementById('hashcodRegistrationProgressHint');
        const consent = document.getElementById('hashcodRegConsent');
        if (!progress || !indicator || !value) return 0;

        const steps = ['full_name', 'age', 'cedula', 'platform_name', 'code_file', 'email', 'phone'];
        const completed = steps.reduce(function (total, name) {
            return total + (v[name] ? 1 : 0);
        }, 0);
        const percent = Math.round((completed / steps.length) * 100);
        const complete = percent === 100;

        progress.setAttribute('aria-valuenow', String(percent));
        progress.dataset.progress = String(percent);
        progress.classList.toggle('is-complete', complete);
        value.textContent = percent + '%';
        indicator.style.transform = 'scaleX(' + (percent / 100) + ')';

        if (hint) {
            hint.textContent = complete
                ? 'Formulario completo. Ya puedes aceptar el documento contractual.'
                : 'Completa todos los campos para habilitar la aceptación.';
        }

        if (consent) {
            consent.disabled = !complete;
            if (!complete && consent.checked) {
                consent.checked = false;
                v.consent = false;
            }
        }

        return percent;
    }

    function validate() {
        const f = fields();
        if (!f.full_name) return false;
        const v = validity();
        updateProgress(v);
        Object.keys(v).forEach(function (name) {
            if (name === 'consent' || name === 'code_file') return;
            const input = f[name];
            if (input) input.setAttribute('aria-invalid', v[name] ? 'false' : 'true');
        });
        setHint('age', v.age || !f.age.value ? 'Debes tener 18 años o más.' : 'No se permite el registro a menores de 18 años.', Boolean(f.age.value && !v.age));
        setHint('cedula', 'Formato: 000-0000000-0.', Boolean(f.cedula.value && !v.cedula));
        setHint(
            'code_file',
            selectedCodeFile ? ('Código listo: ' + selectedCodeFile.name) : 'Sube la explicación del code de tu plataforma. Maximo 30 MB',
            !v.code_file
        );
        const ok = Object.values(v).every(Boolean);
        const currentFingerprint = ok ? registrationFingerprint() : '';
        const whatsappMatchesForm = Boolean(
            ok
            && whatsappDispatched
            && whatsappDispatchFingerprint
            && whatsappDispatchFingerprint === currentFingerprint
        );
        syncSubmitState(whatsappMatchesForm, false);
        syncWhatsappState(ok);
        return ok;
    }

    function syncSubmitState(enabled, submitting) {
        const host = document.getElementById('hashcodRegistrationSubmitReactHost');
        const submit = document.getElementById('hashcodRegistrationSubmit');
        const nextEnabled = Boolean(enabled) && !Boolean(submitting);

        if (host) {
            host.dataset.enabled = nextEnabled ? 'true' : 'false';
            host.dataset.submitting = submitting ? 'true' : 'false';
        }

        if (submit) {
            const official = submit.dataset.animateUiFlip === 'official';
            if (official) {
                submit.disabled = false;
                submit.type = nextEnabled ? 'submit' : 'button';
                submit.setAttribute('aria-disabled', nextEnabled ? 'false' : 'true');
            } else {
                submit.disabled = !nextEnabled;
                submit.type = nextEnabled ? 'submit' : 'button';
                submit.setAttribute('aria-disabled', nextEnabled ? 'false' : 'true');
            }
        }

        window.dispatchEvent(new CustomEvent('hashcod:registration-submit-state', {
            detail: {
                enabled: nextEnabled,
                submitting: Boolean(submitting)
            }
        }));
    }

    function syncWhatsappState(enabled) {
        const button = document.getElementById('hashcodRegistrationWhatsappButton');
        if (!button) return;
        button.disabled = !Boolean(enabled);
        button.setAttribute('aria-disabled', enabled ? 'false' : 'true');
    }

    function scheduleValidate() {
        if (validationFrame) return;
        validationFrame = window.requestAnimationFrame(function () {
            validationFrame = 0;
            validate();
        });
    }

    function payload() {
        const f = fields();
        return {
            full_name: f.full_name.value.trim(),
            age: Number(f.age.value),
            cedula: f.cedula.value.trim(),
            platform_name: f.platform_name.value.trim(),
            email: f.email.value.trim(),
            phone: f.phone.value.trim(),
            consent: f.consent.checked === true
        };
    }

    function status(message, kind) {
        const node = document.getElementById('hashcodRegistrationStatus');
        if (!node) return;
        node.textContent = message || '';
        node.classList.toggle('is-error', kind === 'error');
        node.classList.toggle('is-success', kind === 'success');
    }

    function resetCodeUpload() {
        selectedCodeFile = null;
        const input = document.getElementById('hashcodRegCodeFile');
        const button = document.getElementById('hashcodRegCodeButton');
        if (input) input.value = '';
        if (button) {
            button.classList.remove('is-loaded');
            button.setAttribute('aria-pressed', 'false');
            button.title = 'Subir código de la plataforma';
        }
    }

    function selectCodeFile(file) {
        const button = document.getElementById('hashcodRegCodeButton');
        if (!file) {
            resetCodeUpload();
            scheduleValidate();
            return;
        }
        if (!CODE_FILE_EXTENSIONS.test(file.name || '')) {
            resetCodeUpload();
            setHint('code_file', 'Formato no permitido. Usa código fuente o un archivo ZIP/TAR/GZ.', true);
            status('El archivo de código seleccionado no tiene un formato permitido.', 'error');
            return;
        }
        if (!Number.isFinite(file.size) || file.size <= 0 || file.size > MAX_CODE_FILE_BYTES) {
            resetCodeUpload();
            setHint('code_file', 'El archivo debe pesar entre 1 byte y 30 MB.', true);
            status('El código supera el límite permitido de 30 MB o está vacío.', 'error');
            return;
        }
        selectedCodeFile = file;
        if (button) {
            button.classList.add('is-loaded');
            button.setAttribute('aria-pressed', 'true');
            button.title = 'Código cargado: ' + file.name;
        }
        status('');
        scheduleValidate();
    }

    function setTurnstileUi(state, message) {
        const shell = document.getElementById('hashcodRegistrationTurnstile');
        const stateNode = document.getElementById('hashcodRegistrationTurnstileState');
        const hint = document.getElementById('hashcodRegistrationTurnstileHint');
        if (shell) {
            shell.hidden = !turnstileRequired;
            shell.dataset.state = state || 'idle';
        }
        if (stateNode) stateNode.textContent = state === 'verified' ? 'VERIFICADO' : (state === 'error' ? 'REINTENTAR' : 'VERIFICANDO');
        if (hint && message) hint.textContent = message;
    }

    function ensureTurnstileScript() {
        if (window.turnstile && typeof window.turnstile.render === 'function') return Promise.resolve(true);
        if (turnstileScriptPromise) return turnstileScriptPromise;

        turnstileScriptPromise = new Promise(function (resolve, reject) {
            const existing = document.getElementById('hashcodRegistrationTurnstileScript');
            if (existing) {
                let attempts = 0;
                const timer = window.setInterval(function () {
                    attempts += 1;
                    if (window.turnstile && typeof window.turnstile.render === 'function') {
                        window.clearInterval(timer);
                        resolve(true);
                    } else if (attempts >= 120) {
                        window.clearInterval(timer);
                        reject(new Error('Cloudflare Turnstile no pudo cargarse.'));
                    }
                }, 50);
                return;
            }

            const script = document.createElement('script');
            script.id = 'hashcodRegistrationTurnstileScript';
            script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
            script.async = true;
            script.defer = true;
            script.onload = function () { resolve(true); };
            script.onerror = function () { reject(new Error('Cloudflare Turnstile no pudo cargarse.')); };
            document.head.appendChild(script);
        });
        return turnstileScriptPromise;
    }

    async function verifyTurnstileToken(token) {
        turnstileVerified = false;
        turnstileVerifiedUntil = 0;
        setTurnstileUi('loading', 'Validando la verificación con Cloudflare…');
        validate();

        try {
            const response = await fetch(turnstileVerifyUrl(), {
                method: 'POST',
                credentials: 'same-origin',
                cache: 'no-store',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({ token: String(token || '') })
            });
            const data = await response.json().catch(function () { return {}; });
            if (!response.ok || !data.ok) {
                throw new Error(data.error || 'Cloudflare no pudo validar la verificación.');
            }

            turnstileVerified = true;
            // The backend clearance cookie lasts 900 seconds. Keep a small
            // safety margin so the browser never submits with an almost-expired clearance.
            turnstileVerifiedUntil = Date.now() + (14 * 60 * 1000);

            // Verification is complete: remove duplicate challenge copy and hide
            // the Cloudflare block. The form state remains verified until the
            // clearance safety window expires.
            setTurnstileUi('verified', '');
            const shell = document.getElementById('hashcodRegistrationTurnstile');
            if (shell) shell.hidden = true;
            status('');

            const complete = validate();
            if (pendingTurnstileSubmission && complete && !turnstileAutoRetrying) {
                pendingTurnstileSubmission = false;
                turnstileAutoRetrying = true;
                window.setTimeout(function () {
                    const form = document.getElementById('hashcodRegistrationForm');
                    try {
                        if (form) form.requestSubmit();
                    } finally {
                        turnstileAutoRetrying = false;
                    }
                }, 0);
            }
            return true;
        } catch (error) {
            turnstileVerified = false;
            turnstileVerifiedUntil = 0;
            setTurnstileUi('error', error && error.message ? error.message : 'Repite la verificación de Cloudflare.');
            validate();
            if (window.turnstile && turnstileWidgetId !== null) {
                try { window.turnstile.reset(turnstileWidgetId); } catch (_) {}
            }
            return false;
        }
    }

    async function renderRegistrationTurnstile(siteKey) {
        const shell = document.getElementById('hashcodRegistrationTurnstile');
        const widget = document.getElementById('hashcodRegistrationTurnstileWidget');
        if (!shell || !widget || !siteKey) return false;

        turnstileRequired = true;
        turnstileSiteKey = String(siteKey);
        shell.hidden = false;
        setTurnstileUi(turnstileVerified ? 'verified' : 'loading', turnstileVerified
            ? ''
            : 'Completa la verificación para continuar de forma segura.');
        if (turnstileVerified) shell.hidden = true;
        validate();

        await ensureTurnstileScript();
        if (!window.turnstile || typeof window.turnstile.render !== 'function') return false;

        if (turnstileWidgetId !== null) {
            try { window.turnstile.reset(turnstileWidgetId); } catch (_) {}
            return true;
        }

        turnstileWidgetId = window.turnstile.render(widget, {
            sitekey: turnstileSiteKey,
            theme: 'auto',
            size: 'normal',
            appearance: 'always',
            retry: 'auto',
            'retry-interval': 5000,
            'refresh-expired': 'auto',
            'refresh-timeout': 'auto',
            callback: function (token) {
                verifyTurnstileToken(token);
            },
            'expired-callback': function () {
                turnstileVerified = false;
                turnstileVerifiedUntil = 0;
                setTurnstileUi('error', 'La verificación expiró. Complétala nuevamente.');
                validate();
            },
            'timeout-callback': function () {
                turnstileVerified = false;
                turnstileVerifiedUntil = 0;
                setTurnstileUi('error', 'La verificación agotó el tiempo. Inténtalo nuevamente.');
                validate();
            },
            'error-callback': function (errorCode) {
                turnstileVerified = false;
                turnstileVerifiedUntil = 0;
                const code = String(errorCode == null ? '' : errorCode);
                const configurationError = /^(110|400)/.test(code);
                setTurnstileUi(
                    'error',
                    configurationError
                        ? ('La configuración de Cloudflare no coincide con este sitio'
                            + (code ? ' (código ' + code + ')' : '') + '.')
                        : ('Cloudflare no pudo completar la verificación y reintentará automáticamente'
                            + (code ? ' (código ' + code + ')' : '') + '.')
                );
                validate();
                // Keep Turnstile's built-in automatic retry behavior enabled.
                return false;
            }
        });
        return true;
    }

    async function ensureRegistrationTurnstile() {
        try {
            const response = await fetch(turnstileConfigUrl(), {
                method: 'GET',
                credentials: 'same-origin',
                cache: 'no-store',
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            });
            const data = await response.json().catch(function () { return {}; });

            if (!response.ok || !data.ok || data.desktop_bypass || !data.enabled || !data.site_key) {
                turnstileRequired = false;
                turnstileVerified = false;
                turnstileVerifiedUntil = 0;
                const shell = document.getElementById('hashcodRegistrationTurnstile');
                if (shell) shell.hidden = true;
                validate();
                return false;
            }

            return await renderRegistrationTurnstile(data.site_key);
        } catch (_) {
            // Do not dead-lock the form if the config endpoint is temporarily
            // unavailable. A server-side 429 will still force the challenge.
            turnstileRequired = false;
            const shell = document.getElementById('hashcodRegistrationTurnstile');
            if (shell) shell.hidden = true;
            validate();
            return false;
        }
    }

    async function requireTurnstileChallenge(data) {
        turnstileRequired = true;
        turnstileVerified = false;
        turnstileVerifiedUntil = 0;
        const siteKey = String((data && data.site_key) || turnstileSiteKey || '');
        setTurnstileUi('loading', 'Completa la verificación de Cloudflare.');
        if (siteKey) {
            try { await renderRegistrationTurnstile(siteKey); } catch (_) {}
        } else {
            try { await ensureRegistrationTurnstile(); } catch (_) {}
        }
        if (window.turnstile && turnstileWidgetId !== null) {
            try { window.turnstile.reset(turnstileWidgetId); } catch (_) {}
        }
        validate();
    }

    function registrationFingerprint() {
        const values = payload();
        return JSON.stringify({
            full_name: values.full_name,
            age: values.age,
            cedula: values.cedula,
            platform_name: values.platform_name,
            email: values.email,
            phone: values.phone,
            consent: values.consent === true,
            code_file: selectedCodeFile ? {
                name: selectedCodeFile.name,
                size: selectedCodeFile.size,
                type: selectedCodeFile.type || ''
            } : null
        });
    }

    function generateRegistrationCode() {
        const bytes = new Uint8Array(16);
        if (window.crypto && typeof window.crypto.getRandomValues === 'function') {
            window.crypto.getRandomValues(bytes);
        } else {
            for (let i = 0; i < bytes.length; i += 1) {
                bytes[i] = Math.floor(Math.random() * 256);
            }
        }
        const hex = Array.from(bytes, function (value) {
            return value.toString(16).padStart(2, '0').toUpperCase();
        }).join('');
        return 'HC1-' + hex.match(/.{1,8}/g).join('-');
    }

    function ensureRegistrationCode() {
        const fingerprint = registrationFingerprint();
        if (!currentRegistrationCode || currentRegistrationFingerprint !== fingerprint) {
            currentRegistrationCode = generateRegistrationCode();
            currentRegistrationFingerprint = fingerprint;
        }
        return currentRegistrationCode;
    }

    function formatFileSize(bytes) {
        const value = Number(bytes || 0);
        if (!Number.isFinite(value) || value <= 0) return '0 B';
        if (value < 1024) return value + ' B';
        if (value < 1024 * 1024) return (value / 1024).toFixed(1) + ' KB';
        return (value / (1024 * 1024)).toFixed(2) + ' MB';
    }

    function buildRegistrationWhatsAppMessage(code) {
        const values = payload();
        const file = selectedCodeFile;
        return [
            '*HASHCOD CODESPACE® — SOLICITUD DE REGISTRO DE PLATAFORMA*',
            '',
            '*Nombre con apellidos:* ' + values.full_name,
            '*Edad:* ' + values.age,
            '*Cédula:* ' + values.cedula,
            '*Nombre de la plataforma:* ' + values.platform_name,
            '*Correo electrónico:* ' + values.email,
            '*Número de teléfono:* ' + values.phone,
            '*Archivo de código:* ' + (file ? file.name : 'No seleccionado'),
            '*Tamaño del archivo:* ' + (file ? formatFileSize(file.size) : '0 B'),
            '*Código de solicitud:* ' + code,
            '*Documento contractual y de privacidad:* ACEPTADO',
            '',
            'Solicitud generada desde Hashcod Codespace.'
        ].join('\n');
    }

    function getRegistrationWhatsAppUrl(code) {
        return 'https://wa.me/' + WHATSAPP_NUMBER + '?text='
            + encodeURIComponent(buildRegistrationWhatsAppMessage(code));
    }

    function dispatchWhatsApp(code) {
        const url = getRegistrationWhatsAppUrl(code);
        const opened = window.open(url, '_blank', 'noopener,noreferrer');
        if (!opened) window.location.href = url;
        return url;
    }

    function setTemporaryAccessStatus(message, isError) {
        const node = document.getElementById('hashcodTemporaryAccessStatus');
        if (!node) return;
        node.textContent = message || '';
        node.classList.toggle('is-error', Boolean(isError));
    }

    function closeTemporaryAccessDialog() {
        const dialog = document.getElementById('hashcodTemporaryAccessDialog');
        if (!dialog) return;
        if (typeof dialog.close === 'function' && dialog.open) dialog.close();
        else dialog.removeAttribute('open');
        dialog.classList.remove('is-open');
    }

    function openTemporaryAccessDialog(event) {
        if (event) event.preventDefault();
        const dialog = document.getElementById('hashcodTemporaryAccessDialog');
        const age = document.getElementById('hashcodTemporaryAccessAge');
        const duration = document.getElementById('hashcodTemporaryAccessDuration');
        const unit = document.getElementById('hashcodTemporaryAccessUnit');
        if (!dialog || !age || !duration || !unit) return false;

        age.value = '';
        duration.value = '30';
        unit.value = 'minutes';
        setTemporaryAccessStatus('', false);
        if (typeof dialog.showModal === 'function') dialog.showModal();
        else {
            dialog.setAttribute('open', '');
            dialog.classList.add('is-open');
        }
        window.setTimeout(function () {
            try { age.focus({ preventScroll: true }); } catch (_) { age.focus(); }
        }, 0);
        return true;
    }

    function temporaryDurationMs() {
        const duration = document.getElementById('hashcodTemporaryAccessDuration');
        const unit = document.getElementById('hashcodTemporaryAccessUnit');
        const value = Number(duration && duration.value);
        if (!Number.isFinite(value) || value <= 0 || Math.floor(value) !== value) return 0;

        const multiplier = unit && unit.value === 'hours' ? 60 * 60 * 1000 : 60 * 1000;
        const milliseconds = value * multiplier;
        if (milliseconds > TEMPORARY_ACCESS_MAX_MS) return -1;
        return milliseconds;
    }

    function clearTemporaryAccessState() {
        if (temporaryAccessTimer) {
            window.clearTimeout(temporaryAccessTimer);
            temporaryAccessTimer = 0;
        }
        temporaryAccessExpiresAt = 0;
        temporaryAccessGrant = null;
        try { sessionStorage.removeItem(TEMPORARY_ACCESS_STORAGE_KEY); } catch (_) {}
        delete document.documentElement.dataset.hashcodTemporaryAccess;
        delete document.documentElement.dataset.hashcodTemporaryAccessExpires;
    }

    function expireTemporaryAccess() {
        clearTemporaryAccessState();
        window.dispatchEvent(new CustomEvent('hashcod:temporary-access-expired', {
            detail: { source: 'temporary-access' }
        }));

        const target = baseUrl().toString();
        try {
            window.location.replace(target);
        } catch (_) {
            window.location.href = target;
        }
    }

    function armTemporaryAccessExpiry(expiresAt) {
        const expiry = Number(expiresAt);
        if (!Number.isFinite(expiry) || expiry <= 0) return false;

        if (temporaryAccessTimer) window.clearTimeout(temporaryAccessTimer);
        temporaryAccessExpiresAt = expiry;

        const remaining = expiry - Date.now();
        if (remaining <= 0) {
            expireTemporaryAccess();
            return false;
        }

        temporaryAccessTimer = window.setTimeout(expireTemporaryAccess, remaining);
        return true;
    }

    async function startTemporaryAccess(event) {
        if (event) event.preventDefault();

        const ageInput = document.getElementById('hashcodTemporaryAccessAge');
        const age = Number(ageInput && ageInput.value);
        if (!Number.isInteger(age) || age < 18 || age > 120) {
            setTemporaryAccessStatus('El acceso temporal requiere tener 18 años o más.', true);
            return false;
        }

        const milliseconds = temporaryDurationMs();
        if (milliseconds === -1) {
            setTemporaryAccessStatus('El acceso temporal no puede superar 24 horas.', true);
            return false;
        }
        if (!milliseconds) {
            setTemporaryAccessStatus('Indica una duración válida mayor que cero.', true);
            return false;
        }

        const expiresAt = Date.now() + milliseconds;
        try { sessionStorage.setItem(TEMPORARY_ACCESS_STORAGE_KEY, String(expiresAt)); } catch (_) {}

        document.documentElement.dataset.hashcodTemporaryAccess = 'true';
        document.documentElement.dataset.hashcodTemporaryAccessExpires = String(expiresAt);
        armTemporaryAccessExpiry(expiresAt);
        closeTemporaryAccessDialog();

        temporaryAccessGrant = {
            ok: true,
            source: 'temporary-access',
            temporaryAccess: true,
            expiresAt: expiresAt,
            localOnly: true
        };

        if (registrationGateResolve) {
            registrationGateResolve(temporaryAccessGrant);
            registrationGateResolve = null;
        }

        // The normal entry hold owns the handoff. If that outer async flow is
        // delayed or replaced, finish the temporary entry deterministically.
        window.setTimeout(function ensureTemporaryEntryCompleted() {
            if (
                document.documentElement.dataset.hashcodPlatformEntered === 'true'
                || !temporaryAccessGrant
                || temporaryAccessGrant.temporaryAccess !== true
                || Number(temporaryAccessGrant.expiresAt || 0) <= Date.now()
            ) return;

            completePlatformEntry({
                source: 'temporary-access-fallback',
                temporaryAccess: true,
                expiresAt: Number(temporaryAccessGrant.expiresAt || 0)
            }).catch(function () {});
        }, 900);

        window.dispatchEvent(new CustomEvent('hashcod:temporary-access-approved', {
            detail: {
                source: 'temporary-access',
                temporaryAccess: true,
                expiresAt: expiresAt
            }
        }));
        return true;
    }

    function checkTemporaryAccessExpiry() {
        if (document.documentElement.dataset.hashcodTemporaryAccess !== 'true') return;
        if (!temporaryAccessExpiresAt) {
            try { temporaryAccessExpiresAt = Number(sessionStorage.getItem(TEMPORARY_ACCESS_STORAGE_KEY) || 0); } catch (_) {}
        }
        if (!temporaryAccessExpiresAt || Date.now() >= temporaryAccessExpiresAt) {
            expireTemporaryAccess();
            return;
        }
        armTemporaryAccessExpiry(temporaryAccessExpiresAt);
    }

    async function submitForm(event) {
        event.preventDefault();

        if (!validate()) {
            status('Completa todos los campos y acepta el documento contractual antes de continuar.', 'error');
            return;
        }

        const fingerprint = registrationFingerprint();
        if (
            !whatsappDispatched
            || !whatsappDispatchFingerprint
            || whatsappDispatchFingerprint !== fingerprint
        ) {
            syncSubmitState(false, false);
            status('Primero pulsa el botón de WhatsApp para preparar el mensaje con estos datos.', 'error');
            return;
        }

        entryConfirmed = true;
        syncSubmitState(false, true);
        status('Acceso confirmado. Entrando a Hashcod Codespace…', 'success');

        if (registrationGateResolve) {
            registrationGateResolve({
                ok: true,
                whatsappDispatched: true,
                entryConfirmed: true,
                localOnly: true
            });
            registrationGateResolve = null;
        }

        window.dispatchEvent(new CustomEvent('hashcod:platform-registration-approved', {
            detail: {
                screen: 3,
                whatsappDispatched: true,
                entryConfirmed: true,
                localOnly: true
            }
        }));
    }

    function sendRegistrationWhatsapp(event) {
        if (event) event.preventDefault();
        if (!validate()) {
            status('Completa todos los campos antes de enviar la solicitud por WhatsApp.', 'error');
            return false;
        }

        const code = ensureRegistrationCode();
        const fingerprint = registrationFingerprint();
        dispatchWhatsApp(code);

        whatsappDispatched = true;
        whatsappDispatchFingerprint = fingerprint;
        entryConfirmed = false;

        syncSubmitState(true, false);
        status(
            'Mensaje preparado en WhatsApp con tus datos y el código ' + code
            + '. Ya puedes entrar a Hashcod Codespace.',
            'success'
        );

        window.dispatchEvent(new CustomEvent('hashcod:registration-whatsapp-dispatched', {
            detail: {
                screen: 3,
                registrationCode: code,
                localOnly: true
            }
        }));
        return true;
    }

    function showRegistrationCodeReceipt(code) {
        const overlay = document.getElementById('hashcodRegistrationCodeReceipt');
        const codeNode = document.getElementById('hashcodRegistrationPrivateCode');
        const copyStatus = document.getElementById('hashcodRegistrationCodeCopyStatus');
        if (!overlay || !codeNode) return false;

        codeNode.textContent = String(code);
        if (copyStatus) copyStatus.textContent = '';
        overlay.classList.add('is-open');
        overlay.setAttribute('aria-hidden', 'false');

        const continueButton = document.getElementById('hashcodRegistrationContinueAfterCode');
        if (continueButton) window.setTimeout(function () { continueButton.focus(); }, 0);
        return true;
    }

    async function copyRegistrationCode() {
        const codeNode = document.getElementById('hashcodRegistrationPrivateCode');
        const copyStatus = document.getElementById('hashcodRegistrationCodeCopyStatus');
        const value = codeNode ? String(codeNode.textContent || '').trim() : '';
        if (!value) return false;

        try {
            if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
                await navigator.clipboard.writeText(value);
            } else {
                const area = document.createElement('textarea');
                area.value = value;
                area.setAttribute('readonly', '');
                area.style.position = 'fixed';
                area.style.opacity = '0';
                document.body.appendChild(area);
                area.select();
                document.execCommand('copy');
                area.remove();
            }
            if (copyStatus) copyStatus.textContent = 'Código copiado.';
            return true;
        } catch (_) {
            if (copyStatus) copyStatus.textContent = 'Selecciona el código y cópialo manualmente.';
            return false;
        }
    }

    function continueAfterRegistrationCode() {
        if (!whatsappDispatched) return false;
        entryConfirmed = true;
        const overlay = document.getElementById('hashcodRegistrationCodeReceipt');
        const codeNode = document.getElementById('hashcodRegistrationPrivateCode');
        if (overlay) {
            overlay.classList.remove('is-open');
            overlay.setAttribute('aria-hidden', 'true');
        }
        // Clear the plaintext from the DOM before entering the platform.
        if (codeNode) codeNode.textContent = '';
        if (registrationGateResolve) {
            registrationGateResolve({ ok: true, whatsappDispatched: true, entryConfirmed: true, localOnly: true });
            registrationGateResolve = null;
        }
        return true;
    }

    let bound = false;
    function bind() {
        if (bound) return;
        const form = document.getElementById('hashcodRegistrationForm');
        const cedula = document.getElementById('hashcodRegCedula');
        const temporaryAccessButton = document.getElementById('hashcodTemporaryAccessButton');
        const temporaryAccessDialog = document.getElementById('hashcodTemporaryAccessDialog');
        const temporaryAccessCancel = document.getElementById('hashcodTemporaryAccessCancel');
        const temporaryAccessConfirm = document.getElementById('hashcodTemporaryAccessConfirm');
        const whatsappButton = document.getElementById('hashcodRegistrationWhatsappButton');
        const codeButton = document.getElementById('hashcodRegCodeButton');
        const codeInput = document.getElementById('hashcodRegCodeFile');
        const privacyTrigger = document.getElementById('hashcodPrivacyPreviewTrigger');
        const privacyCard = document.getElementById('hashcodPrivacyPreviewCard');
        const copyRegistrationCodeButton = document.getElementById('hashcodRegistrationCopyCode');
        const continueAfterCodeButton = document.getElementById('hashcodRegistrationContinueAfterCode');
        const codeReceipt = document.getElementById('hashcodRegistrationCodeReceipt');
        if (!form || !cedula || !temporaryAccessButton || !temporaryAccessDialog || !temporaryAccessCancel || !temporaryAccessConfirm || !whatsappButton || !codeButton || !codeInput || !privacyTrigger || !privacyCard || !copyRegistrationCodeButton || !continueAfterCodeButton || !codeReceipt) return;
        bound = true;

        function invalidateWhatsappDispatch() {
            currentRegistrationFingerprint = '';
            whatsappDispatched = false;
            whatsappDispatchFingerprint = '';
            entryConfirmed = false;
            syncSubmitState(false, false);
        }

        form.addEventListener('input', function () {
            invalidateWhatsappDispatch();
            scheduleValidate();
        });
        form.addEventListener('change', function () {
            invalidateWhatsappDispatch();
            scheduleValidate();
        });
        form.addEventListener('submit', submitForm);
        cedula.addEventListener('input', function () {
            const next = formatCedula(cedula.value);
            if (cedula.value !== next) cedula.value = next;
            scheduleValidate();
        });
        codeButton.addEventListener('click', function () {
            codeInput.click();
        });
        codeInput.addEventListener('change', function () {
            selectCodeFile(codeInput.files && codeInput.files[0] ? codeInput.files[0] : null);
        });

        const accordion = form.querySelector('[data-hashcod-accordion]');
        if (accordion) {
            const triggers = Array.from(accordion.querySelectorAll('.hashcod-registration-faq-trigger'));

            function setAccordionItem(trigger, open) {
                const panelId = trigger.getAttribute('aria-controls');
                const panel = panelId ? document.getElementById(panelId) : null;
                const item = trigger.closest('.hashcod-registration-faq-item');
                trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
                if (panel) panel.setAttribute('aria-hidden', open ? 'false' : 'true');
                if (item) item.classList.toggle('is-open', open);
            }

            triggers.forEach(function (trigger) {
                trigger.addEventListener('click', function () {
                    const shouldOpen = trigger.getAttribute('aria-expanded') !== 'true';
                    triggers.forEach(function (otherTrigger) {
                        setAccordionItem(otherTrigger, otherTrigger === trigger && shouldOpen);
                    });
                });
            });
        }
        async function ensurePrivacyPreviewLoaded() {
            const snapshot = privacyCard.querySelector('.hashcod-preview-link-card-snapshot');
            if (!snapshot || snapshot.dataset.loaded === 'true' || snapshot.dataset.loading === 'true') return;

            snapshot.dataset.loading = 'true';
            const previewSrc = privacyCard.dataset.previewSrc || privacyTrigger.getAttribute('href') || 'privacy';

            try {
                const previewUrl = new URL(previewSrc, baseUrl());
                previewUrl.searchParams.set('hashcod_preview_current', '20260918-18');
                const response = await fetch(previewUrl.toString(), {
                    method: 'GET',
                    credentials: 'same-origin',
                    cache: 'no-store',
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                        'Cache-Control': 'no-cache'
                    }
                });
                if (!response.ok) throw new Error('preview unavailable');

                const html = await response.text();
                const parsed = new DOMParser().parseFromString(html, 'text/html');
                const source = parsed.querySelector('.privacy-container');
                if (!source) throw new Error('privacy preview root missing');

                const clone = source.cloneNode(true);
                clone.querySelectorAll('script, iframe, object, embed, form').forEach(function (node) {
                    node.remove();
                });
                clone.querySelectorAll('[onclick], [onload], [onerror], [onmouseover], [onmouseenter], [onmouseleave]').forEach(function (node) {
                    ['onclick','onload','onerror','onmouseover','onmouseenter','onmouseleave'].forEach(function (name) {
                        node.removeAttribute(name);
                    });
                });
                clone.querySelectorAll('a').forEach(function (link) {
                    link.removeAttribute('href');
                    link.removeAttribute('target');
                    link.removeAttribute('rel');
                });
                clone.querySelectorAll('button, input, select, textarea').forEach(function (control) {
                    control.setAttribute('tabindex', '-1');
                    control.setAttribute('disabled', 'disabled');
                });

                const shadow = snapshot.shadowRoot || snapshot.attachShadow({ mode: 'open' });
                const style = document.createElement('style');

                const stylesheetNodes = Array.from(parsed.head.querySelectorAll('style, link[rel="stylesheet"]'));
                const cssParts = [];
                for (const node of stylesheetNodes) {
                    if (node.tagName === 'STYLE') {
                        cssParts.push(node.textContent || '');
                        continue;
                    }

                    const href = node.getAttribute('href') || '';
                    if (!href) continue;

                    try {
                        const cssUrl = new URL(href, previewUrl);
                        if (cssUrl.origin !== window.location.origin) continue;
                        cssUrl.searchParams.set('hashcod_preview_current', '20260918-18');
                        const cssResponse = await fetch(cssUrl.toString(), {
                            credentials: 'same-origin',
                            cache: 'no-store',
                            headers: { 'Cache-Control': 'no-cache' }
                        });
                        if (cssResponse.ok) cssParts.push(await cssResponse.text());
                    } catch (_) {
                        // Keep the preview usable even if an optional stylesheet fails.
                    }
                }

                const sourceCss = cssParts.join('\n')
                    .replace(/body:has\(\.privacy-container\)/g, ':host')
                    .replace(/(^|[}\s])body\s*\{/g, '$1:host {')
                    .replace(/:root\s*\{/g, ':host {');

                style.textContent = sourceCss + '\n' + [
                    ':host {',
                    '  display:block;',
                    '  position:absolute;',
                    '  inset:0 auto auto 0;',
                    '  width:1200px;',
                    '  min-height:674px;',
                    '  overflow:hidden;',
                    '  pointer-events:none;',
                    '  transform:scale(.3);',
                    '  transform-origin:0 0;',
                    '  font-family:Geist,Arial,sans-serif;',
                    '  box-sizing:border-box;',
                    '}',
                    ':host *, :host *::before, :host *::after { box-sizing:border-box; }',
                    '.privacy-container { max-height:none !important; }',
                    '.privacy-content { min-height:520px !important; }',
                    '.btn-back { pointer-events:none !important; }'
                ].join('\n');

                shadow.replaceChildren(style, clone);
                snapshot.dataset.loaded = 'true';
            } catch (_) {
                const shadow = snapshot.shadowRoot || snapshot.attachShadow({ mode: 'open' });
                const style = document.createElement('style');
                style.textContent = [
                    ':host { display:block; position:absolute; inset:0; background:#f8fafc; color:#0f172a; font-family:Arial,sans-serif; }',
                    '.fallback { padding:28px; }',
                    '.badge { display:inline-block; padding:5px 9px; border-radius:14px; background:#eff6ff; color:#1d4ed8; font-size:11px; font-weight:700; }',
                    'strong { display:block; margin-top:14px; font-size:20px; }',
                    '.line { display:block; height:9px; margin-top:16px; background:#e2e8f0; border-radius:4px; }',
                    '.short { width:62%; }'
                ].join('\n');
                const fallback = document.createElement('span');
                fallback.className = 'fallback';
                fallback.innerHTML = [
                    '<span class="badge">PQC / PRIVACY</span>',
                    '<strong>Política de Privacidad y Modelo Operativo</strong>',
                    '<span>Hashcod Codespace</span>',
                    '<span class="line"></span>',
                    '<span class="line short"></span>'
                ].join('');
                shadow.replaceChildren(style, fallback);
                snapshot.dataset.loaded = 'fallback';
            } finally {
                delete snapshot.dataset.loading;
            }
        }

        function placePrivacyPreview(clientX, clientY) {
            const width = 360;
            const height = 286;
            const gap = 14;
            const pad = 12;
            let left = Number.isFinite(clientX) ? clientX + gap : privacyTrigger.getBoundingClientRect().left;
            let top = Number.isFinite(clientY) ? clientY - height - gap : privacyTrigger.getBoundingClientRect().top - height - gap;

            if (left + width > window.innerWidth - pad) left = window.innerWidth - width - pad;
            if (left < pad) left = pad;
            if (top < pad) {
                const rect = privacyTrigger.getBoundingClientRect();
                top = Math.min(window.innerHeight - height - pad, rect.bottom + gap);
            }

            privacyCard.style.left = Math.round(left) + 'px';
            privacyCard.style.top = Math.round(top) + 'px';
        }

        function openPrivacyPreview(event) {
            ensurePrivacyPreviewLoaded();
            placePrivacyPreview(event && event.clientX, event && event.clientY);
            privacyCard.classList.add('is-open');
            privacyCard.setAttribute('aria-hidden', 'false');
        }

        function closePrivacyPreview() {
            privacyCard.classList.remove('is-open');
            privacyCard.setAttribute('aria-hidden', 'true');
        }

        privacyTrigger.addEventListener('pointerenter', openPrivacyPreview);
        privacyTrigger.addEventListener('pointermove', function (event) {
            if (privacyCard.classList.contains('is-open')) placePrivacyPreview(event.clientX, event.clientY);
        });
        privacyTrigger.addEventListener('pointerleave', closePrivacyPreview);
        privacyTrigger.addEventListener('focus', openPrivacyPreview);
        privacyTrigger.addEventListener('blur', closePrivacyPreview);
        privacyTrigger.addEventListener('click', function (event) {
            event.stopPropagation();
        });

        temporaryAccessButton.addEventListener('click', openTemporaryAccessDialog);
        temporaryAccessCancel.addEventListener('click', closeTemporaryAccessDialog);
        temporaryAccessConfirm.addEventListener('click', startTemporaryAccess);
        temporaryAccessDialog.addEventListener('click', function (event) {
            if (event.target === temporaryAccessDialog) closeTemporaryAccessDialog();
        });
        whatsappButton.addEventListener('click', sendRegistrationWhatsapp);
        copyRegistrationCodeButton.addEventListener('click', copyRegistrationCode);
        continueAfterCodeButton.addEventListener('click', continueAfterRegistrationCode);
    }

    function waitForSuccessfulSubmission() {
        if (
            temporaryAccessGrant
            && temporaryAccessGrant.temporaryAccess === true
            && Number(temporaryAccessGrant.expiresAt || 0) > Date.now()
        ) {
            return Promise.resolve(temporaryAccessGrant);
        }
        if (whatsappDispatched && entryConfirmed) {
            return Promise.resolve({
                ok: true,
                whatsappDispatched: true,
                entryConfirmed: true,
                localOnly: true
            });
        }
        if (!registrationGatePromise) {
            registrationGatePromise = new Promise(function (resolve) {
                registrationGateResolve = resolve;
            });
        }
        return registrationGatePromise;
    }

    async function completePlatformEntry(options) {
        if (document.documentElement.dataset.hashcodPlatformEntered === 'true') return true;

        if (document.documentElement.dataset.hashcodPlatformEntryCompleting === 'true') {
            return new Promise(function (resolve) {
                window.addEventListener('hashcod:platform-entered', function () {
                    resolve(true);
                }, { once: true });
            });
        }

        document.documentElement.dataset.hashcodPlatformEntryCompleting = 'true';
        const entryOptions = options && typeof options === 'object' ? options : {};
        const temporaryAccess = entryOptions.temporaryAccess === true;
        const root = document.getElementById(ROOT_ID);
        const codeReceipt = document.getElementById('hashcodRegistrationCodeReceipt');
        const temporaryDialog = document.getElementById('hashcodTemporaryAccessDialog');
        const privateCode = document.getElementById('hashcodRegistrationPrivateCode');
        if (codeReceipt) {
            codeReceipt.classList.remove('is-open');
            codeReceipt.setAttribute('aria-hidden', 'true');
        }
        if (privateCode) privateCode.textContent = '';
        if (temporaryDialog) {
            if (typeof temporaryDialog.close === 'function' && temporaryDialog.open) {
                try { temporaryDialog.close(); } catch (_) {}
            }
            temporaryDialog.remove();
        }

        // Fade the registration layer instead of dropping a full-viewport node
        // in a single frame. The platform is already painted underneath.
        if (root) {
            root.classList.add('is-completing');
            await new Promise(function (resolve) {
                window.requestAnimationFrame(function () {
                    window.setTimeout(resolve, 170);
                });
            });
            root.remove();
        }

        fieldCache = null;
        selectedCodeFile = null;
        Object.keys(hintCache).forEach(function (key) { delete hintCache[key]; });
        if (validationFrame) {
            window.cancelAnimationFrame(validationFrame);
            validationFrame = 0;
        }

        document.documentElement.removeAttribute('data-hashcod-final-entry-screen');
        document.documentElement.dataset.hashcodPlatformEntered = 'true';
        document.documentElement.classList.remove('auth-locked', 'boot-locked');
        if (document.body) {
            document.body.classList.remove('auth-locked', 'boot-locked');
            document.body.removeAttribute('data-auth-locked');
            document.body.removeAttribute('aria-busy');
        }

        delete document.documentElement.dataset.hashcodPlatformEntryCompleting;

        window.dispatchEvent(new CustomEvent('hashcod:platform-entered', {
            detail: temporaryAccess ? {
                source: entryOptions.source || 'temporary-access',
                temporaryAccess: true,
                temporaryAccessExpiresAt: Number(entryOptions.expiresAt || temporaryAccessExpiresAt || 0),
                localOnly: true
            } : {
                source: entryOptions.source || 'platform-registration',
                whatsappDispatched: true,
                entryConfirmed: true,
                localOnly: true
            }
        }));
        return true;
    }

    armFinalScreenFallback();
    armFinalScreenRecovery();

    function mountIfThirdScreen() {
        if (document.documentElement.dataset.hashcodFinalEntryScreen === 'true') mount();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', mountIfThirdScreen, { once: true });
    } else {
        mountIfThirdScreen();
    }

    window.addEventListener('hashcod:final-entry-screen', function (event) {
        if (!event.detail || Number(event.detail.screen) === 3) {
            mount();
        }
    });

    document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'visible') checkTemporaryAccessExpiry();
    });
    window.addEventListener('pageshow', checkTemporaryAccessExpiry);

    window.HashcodPlatformRegistration = Object.freeze({
        waitForSuccessfulSubmission: waitForSuccessfulSubmission,
        completePlatformEntry: completePlatformEntry,
        isSaved: function () { return whatsappDispatched && entryConfirmed; },
        hasDispatchedWhatsapp: function () { return whatsappDispatched; },
        getRegistrationCode: function () { return currentRegistrationCode; },
        buildWhatsAppMessage: function () {
            return currentRegistrationCode ? buildRegistrationWhatsAppMessage(currentRegistrationCode) : '';
        },
        sendWhatsApp: sendRegistrationWhatsapp,
        openTemporaryAccess: openTemporaryAccessDialog,
        temporaryAccessState: function () {
            return {
                active: document.documentElement.dataset.hashcodTemporaryAccess === 'true',
                expiresAt: temporaryAccessExpiresAt,
                remainingMs: temporaryAccessExpiresAt ? Math.max(0, temporaryAccessExpiresAt - Date.now()) : 0
            };
        },
        mount: mount
    });
})();