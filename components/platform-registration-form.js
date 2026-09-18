(function () {
    'use strict';
    if (window.__hashcodPlatformRegistrationLoaded) return;
    window.__hashcodPlatformRegistrationLoaded = true;

    const ROOT_ID = 'hashcodPlatformRegistration';
    const API_PATH = 'api/platform-registration';
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
        '#hashcodEftCodeKeyGate',
        '#hashcodEfrHotzone',
        '#cryptoCardValidationLauncherBtn',
        '#d5LauncherBtn',
        '#hashcodUxActions',
        '[data-hashcod-auth-utility-dock]',
        '[data-hashcod-third-screen-legacy]'
    ];
    let registrationSaved = false;
    let registrationGatePromise = null;
    let registrationGateResolve = null;
    let fieldCache = null;
    const hintCache = Object.create(null);
    let validationFrame = 0;
    const DATABASE_ICON = '<svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="100" height="100" viewBox="0 0 50 50" aria-hidden="true"><path d="M 28.992188 8 C 23.873188 8 19.388844 10.76825 17.214844 15.15625 C 16.078844 14.40325 14.747469 14 13.355469 14 C 9.7104688 14 6.6083281 17.027891 6.3613281 20.712891 C 2.6863281 22.110891 -1.1842379e-15 26.103078 0 30.330078 C 0 35.661078 4.3379219 40 9.6699219 40 L 30 40 L 30 38 L 9.6699219 38 C 5.4399219 38 2 34.559078 2 30.330078 C 2 26.755078 4.4719531 23.271437 7.6269531 22.398438 L 8.3886719 22.189453 L 8.3476562 21.183594 C 8.3476562 18.372594 10.641422 15.998047 13.357422 15.998047 C 14.694422 15.998047 15.952391 16.520703 16.900391 17.470703 L 18.005859 18.574219 L 18.546875 17.109375 C 20.145875 12.789375 24.246141 9.9980469 28.994141 9.9980469 C 35.062141 9.9990469 40 15.00275 40 21.21875 C 40 21.68575 39.999219 22.466906 39.949219 22.878906 L 39.8125 24 L 40.941406 24 L 41.027344 23.996094 C 43.228344 24.005094 45.223719 25.114969 46.511719 26.792969 C 47.740719 27.195969 48.753594 27.731281 49.558594 28.363281 C 48.478594 25.028281 45.510141 22.466688 41.994141 22.054688 C 42.000141 21.740687 42 21.425391 42 21.150391 C 42 13.899391 36.164187 8 28.992188 8 z M 41 28 C 38.446754 28 36.307206 28.456516 34.716797 29.283203 C 33.126388 30.10989 32 31.421546 32 33 L 32 37 L 32 41 L 32 45 C 32 46.578454 33.126388 47.89011 34.716797 48.716797 C 36.307206 49.543484 38.446754 50 41 50 C 43.553246 50 45.692794 49.543484 47.283203 48.716797 C 48.873612 47.89011 50 46.578454 50 45 L 50 41 L 50 37 L 50 33 C 50 31.421546 48.873612 30.10989 47.283203 29.283203 C 45.692794 28.456516 43.553246 28 41 28 z M 41 30 C 43.307754 30 45.166987 30.437781 46.361328 31.058594 C 47.555669 31.679407 48 32.368454 48 33 C 48 33.631546 47.555669 34.320593 46.361328 34.941406 C 45.166987 35.562219 43.307754 36 41 36 C 38.692246 36 36.833013 35.562219 35.638672 34.941406 C 34.444331 34.320593 34 33.631546 34 33 C 34 32.368454 34.444331 31.679407 35.638672 31.058594 C 36.833013 30.437781 38.692246 30 41 30 z M 34 36.283203 C 34.226833 36.438365 34.463816 36.585299 34.716797 36.716797 C 36.307206 37.543484 38.446754 38 41 38 C 43.553246 38 45.692794 37.543484 47.283203 36.716797 C 47.536184 36.585299 47.773167 36.438365 48 36.283203 L 48 37 C 48 37.631546 47.555669 38.320593 46.361328 38.941406 C 45.166987 39.562219 43.307754 40 41 40 C 38.692246 40 36.833013 39.562219 35.638672 38.941406 C 34.444331 38.320593 34 37.631546 34 37 L 34 36.283203 z M 34 40.283203 C 34.226833 40.438365 34.463816 40.585299 34.716797 40.716797 C 36.307206 41.543484 38.446754 42 41 42 C 43.553246 42 45.692794 41.543484 47.283203 40.716797 C 47.536184 40.585299 47.773167 40.438365 48 40.283203 L 48 41 C 48 41.631546 47.555669 42.320593 46.361328 42.941406 C 45.166987 43.562219 43.307754 44 41 44 C 38.692246 44 36.833013 43.562219 35.638672 42.941406 C 34.444331 42.320593 34 41.631546 34 41 L 34 40.283203 z M 34 44.283203 C 34.226833 44.438365 34.463816 44.585299 34.716797 44.716797 C 36.307206 45.543484 38.446754 46 41 46 C 43.553246 46 45.692794 45.543484 47.283203 44.716797 C 47.536184 44.585299 47.773167 44.438365 48 44.283203 L 48 45 C 48 45.631546 47.555669 46.320593 46.361328 46.941406 C 45.166987 47.562219 43.307754 48 41 48 C 38.692246 48 36.833013 47.562219 35.638672 46.941406 C 34.444331 46.320593 34 45.631546 34 45 L 34 44.283203 z"></path></svg>';

    const CODE_UPLOAD_ICON = '<svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="100" height="100" viewBox="0 0 32 32" aria-hidden="true"><path d="M 10 4 L 10 6 L 20 6 L 20 4 L 10 4 z M 20 6 L 20 12 L 22 12 L 22 6 L 20 6 z M 22 12 L 22 14 L 25 14 L 25 20 L 27 20 L 27 18 L 30 18 L 30 16 L 27 16 L 27 12 L 22 12 z M 30 18 L 30 24 L 32 24 L 32 18 L 30 18 z M 30 24 L 20 24 L 20 26 L 30 26 L 30 24 z M 10 6 L 8 6 L 8 9 L 6 9 L 6 11 L 14 11 L 14 9 L 10 9 L 10 6 z M 6 11 L 4 11 L 4 14 L 2 14 L 2 16 L 6 16 L 6 11 z M 2 16 L 0 16 L 0 24 L 2 24 L 2 16 z M 2 24 L 2 26 L 10 26 L 10 24 L 2 24 z M 14 15 L 14 17 L 12 17 L 12 19 L 10 19 L 10 21 L 14 21 L 14 30 L 16 30 L 16 21 L 20 21 L 20 19 L 18 19 L 18 17 L 16 17 L 16 15 L 14 15 z"></path></svg>';
    const MAX_CODE_FILE_BYTES = 10 * 1024 * 1024;
    const CODE_FILE_EXTENSIONS = /\.(?:zip|tar|gz|txt|md|json|js|jsx|ts|tsx|html?|css|php|py|java|go|rs|cs|c|cc|cpp|h|hpp|sql|xml|ya?ml|toml|sh|coffee)$/i;
    let selectedCodeFile = null;

    function baseUrl() {
        const base = document.querySelector('base[href]');
        try { return new URL(base ? base.getAttribute('href') : './', window.location.href); }
        catch (_) { return new URL('./', window.location.href); }
    }
    function apiUrl() { return new URL(API_PATH, baseUrl()).toString(); }
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
        const tableOverlay = document.getElementById('hashcodRegistrationTableOverlay');
        const selector = FINAL_SCREEN_LEGACY_SELECTORS.join(',');

        // One selector pass is considerably cheaper than rescanning the complete
        // document once per legacy selector. This cleanup is intentionally
        // one-shot; legacy-auth-retirement owns any later compatibility mounts.
        document.querySelectorAll(selector).forEach(function (node) {
            if (!node || node === registrationRoot || node === tableOverlay) return;
            if (registrationRoot && registrationRoot.contains(node)) return;
            if (tableOverlay && tableOverlay.contains(node)) return;
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
                        <span class="hashcod-registration-hint hashcod-registration-code-hint" data-hint="code_file">Sube el código de tu plataforma. Máximo 10 MB.</span>
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
                    <label class="hashcod-registration-consent">
                        <input id="hashcodRegConsent" name="consent" type="checkbox" required>
                        <span>Confirmo que tengo 18 años o más y autorizo el almacenamiento de estos datos para gestionar este registro. Consulta la <a href="privacy" target="_blank" rel="noopener">Política de Privacidad</a>.</span>
                    </label>
                </div>
                <div class="hashcod-registration-actions">
                    <button id="hashcodRegistrationSubmit" type="submit" disabled>ENVIAR REGISTRO</button>
                    <button id="hashcodRegistrationTableButton" type="button" aria-label="Abrir tabla de registros" title="Tabla de registros">${DATABASE_ICON}</button>
                </div>
                <p id="hashcodRegistrationStatus" class="hashcod-registration-status" role="status" aria-live="polite"></p>
            </form>
        `;
    }

    function tableOverlayMarkup() {
        return `
            <div id="hashcodRegistrationTableOverlay" aria-hidden="true">
                <section class="hashcod-registration-table-shell" role="dialog" aria-modal="true" aria-labelledby="hashcodRegistrationTableTitle">
                    <header class="hashcod-registration-table-head">
                        <h2 id="hashcodRegistrationTableTitle">Registros de plataformas</h2>
                        <button type="button" class="hashcod-registration-table-close" aria-label="Cerrar tabla">×</button>
                    </header>
                    <div class="hashcod-registration-table-scroll">
                        <div class="hashcod-registration-empty">Verifica el acceso administrativo para cargar la tabla.</div>
                    </div>
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
        }
        if (!document.getElementById('hashcodRegistrationTableOverlay')) {
            document.body.insertAdjacentHTML('beforeend', tableOverlayMarkup());
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

    function validate() {
        const f = fields();
        if (!f.full_name) return false;
        const v = validity();
        Object.keys(v).forEach(function (name) {
            if (name === 'consent' || name === 'code_file') return;
            const input = f[name];
            if (input) input.setAttribute('aria-invalid', v[name] ? 'false' : 'true');
        });
        setHint('age', v.age || !f.age.value ? 'Debes tener 18 años o más.' : 'No se permite el registro a menores de 18 años.', Boolean(f.age.value && !v.age));
        setHint('cedula', 'Formato: 000-0000000-0.', Boolean(f.cedula.value && !v.cedula));
        setHint(
            'code_file',
            selectedCodeFile ? ('Código listo: ' + selectedCodeFile.name) : 'Sube el código de tu plataforma. Máximo 10 MB.',
            !v.code_file
        );
        const ok = Object.values(v).every(Boolean);
        const submit = document.getElementById('hashcodRegistrationSubmit');
        if (submit) submit.disabled = !ok;
        return ok;
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
            setHint('code_file', 'El archivo debe pesar entre 1 byte y 10 MB.', true);
            status('El código supera el límite permitido de 10 MB o está vacío.', 'error');
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

    function buildSubmissionBody() {
        const values = payload();
        const body = new FormData();
        Object.keys(values).forEach(function (key) {
            body.append(key, values[key] === true ? 'true' : String(values[key]));
        });
        if (selectedCodeFile) body.append('code_file', selectedCodeFile, selectedCodeFile.name);
        return body;
    }

    async function submitForm(event) {
        event.preventDefault();
        if (!validate()) {
            status('Revisa los campos. Para continuar debes tener 18 años o más.', 'error');
            return;
        }
        const button = document.getElementById('hashcodRegistrationSubmit');
        button.disabled = true;
        button.textContent = 'ENVIANDO…';
        status('Guardando registro…');
        try {
            const response = await fetch(apiUrl(), {
                method: 'POST',
                credentials: 'same-origin',
                cache: 'no-store',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: buildSubmissionBody()
            });
            const data = await response.json().catch(function () { return {}; });
            if (!response.ok || !data.ok) throw new Error(data.error || 'No se pudo guardar el registro.');
            registrationSaved = true;
            document.getElementById('hashcodRegistrationForm').reset();
            resetCodeUpload();
            document.querySelectorAll('#hashcodRegistrationForm input[aria-invalid]').forEach(function (input) {
                input.setAttribute('aria-invalid', 'false');
            });
            status('Registro enviado y guardado correctamente. Entrando a Hashcod Codespace…', 'success');
            window.dispatchEvent(new CustomEvent('hashcod:platform-registration-saved', {
                detail: { screen: 3, saved: true }
            }));
            if (registrationGateResolve) {
                registrationGateResolve({ ok: true, saved: true });
                registrationGateResolve = null;
            }
        } catch (error) {
            status(error && error.message ? error.message : 'No se pudo guardar el registro.', 'error');
        } finally {
            button.textContent = 'ENVIAR REGISTRO';
            validate();
        }
    }

    function ensureAdminEngine() {
        if (window.HashcodAdmin && typeof window.HashcodAdmin.require === 'function') return Promise.resolve(true);
        const existing = Array.from(document.scripts).find(function (node) {
            return /\/components\/admin-device\.js(?:\?|$)/.test(node.src || '');
        });
        if (!existing) {
            const script = document.createElement('script');
            script.src = new URL('components/admin-device.js?v=20260917-registration1', baseUrl()).toString();
            script.defer = true;
            script.dataset.hashcodRegistrationAdmin = 'true';
            document.head.appendChild(script);
        }
        return new Promise(function (resolve) {
            let attempts = 0;
            const timer = window.setInterval(function () {
                attempts += 1;
                if (window.HashcodAdmin && typeof window.HashcodAdmin.require === 'function') {
                    window.clearInterval(timer);
                    resolve(true);
                } else if (attempts >= 60) {
                    window.clearInterval(timer);
                    resolve(false);
                }
            }, 100);
        });
    }

    function formatDate(value) {
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? String(value || '') : date.toLocaleString();
    }

    function renderRows(rows) {
        const scroll = document.querySelector('#hashcodRegistrationTableOverlay .hashcod-registration-table-scroll');
        if (!scroll) return;
        if (!Array.isArray(rows) || !rows.length) {
            scroll.innerHTML = '<div class="hashcod-registration-empty">Todavía no hay registros.</div>';
            return;
        }
        scroll.innerHTML = `
            <table class="hashcod-registration-table">
                <thead><tr>
                    <th>ID</th><th>Nombre con apellidos</th><th>Edad</th><th>Cédula</th>
                    <th>Plataforma</th><th>Código</th><th>Correo electrónico</th><th>Teléfono</th><th>Fecha</th>
                </tr></thead>
                <tbody>${rows.map(function (row) {
                    return '<tr>' +
                        '<td>' + escapeHtml(row.id) + '</td>' +
                        '<td>' + escapeHtml(row.full_name) + '</td>' +
                        '<td>' + escapeHtml(row.age) + '</td>' +
                        '<td>' + escapeHtml(row.cedula) + '</td>' +
                        '<td>' + escapeHtml(row.platform_name) + '</td>' +
                        '<td>' + escapeHtml(row.code_filename || '') + (row.code_size_bytes ? ' (' + escapeHtml(Math.round(Number(row.code_size_bytes) / 1024)) + ' KB)' : '') + '</td>' +
                        '<td>' + escapeHtml(row.email) + '</td>' +
                        '<td>' + escapeHtml(row.phone) + '</td>' +
                        '<td>' + escapeHtml(formatDate(row.created_at)) + '</td>' +
                    '</tr>';
                }).join('')}</tbody>
            </table>
        `;
    }

    async function openTable() {
        const button = document.getElementById('hashcodRegistrationTableButton');
        if (button) button.disabled = true;
        status('Verificando acceso administrativo…');
        try {
            const ready = await ensureAdminEngine();
            if (!ready) throw new Error('No se pudo cargar la verificación administrativa.');
            const verified = await window.HashcodAdmin.require({ force: true });
            if (!verified) {
                status('La tabla requiere la CodeKey administrativa.', 'error');
                return;
            }
            const response = await fetch(apiUrl() + '?view=admin', {
                method: 'GET',
                credentials: 'same-origin',
                cache: 'no-store',
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            });
            const data = await response.json().catch(function () { return {}; });
            if (!response.ok || !data.ok) throw new Error(data.error || 'No se pudo cargar la tabla.');
            renderRows(data.rows || []);
            const overlay = document.getElementById('hashcodRegistrationTableOverlay');
            overlay.classList.add('is-open');
            overlay.setAttribute('aria-hidden', 'false');
            status('');
        } catch (error) {
            status(error && error.message ? error.message : 'No se pudo abrir la tabla.', 'error');
        } finally {
            if (button) button.disabled = false;
        }
    }

    let bound = false;
    function bind() {
        if (bound) return;
        const form = document.getElementById('hashcodRegistrationForm');
        const cedula = document.getElementById('hashcodRegCedula');
        const tableButton = document.getElementById('hashcodRegistrationTableButton');
        const codeButton = document.getElementById('hashcodRegCodeButton');
        const codeInput = document.getElementById('hashcodRegCodeFile');
        const overlay = document.getElementById('hashcodRegistrationTableOverlay');
        if (!form || !cedula || !tableButton || !codeButton || !codeInput || !overlay) return;
        bound = true;
        form.addEventListener('input', scheduleValidate);
        form.addEventListener('change', scheduleValidate);
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
        tableButton.addEventListener('click', openTable);
        overlay.querySelector('.hashcod-registration-table-close').addEventListener('click', function () {
            overlay.classList.remove('is-open');
            overlay.setAttribute('aria-hidden', 'true');
        });
        overlay.addEventListener('click', function (event) {
            if (event.target === overlay) {
                overlay.classList.remove('is-open');
                overlay.setAttribute('aria-hidden', 'true');
            }
        });
        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape' && overlay.classList.contains('is-open')) {
                overlay.classList.remove('is-open');
                overlay.setAttribute('aria-hidden', 'true');
            }
        });
    }

    function waitForSuccessfulSubmission() {
        if (registrationSaved) return Promise.resolve({ ok: true, saved: true });
        if (!registrationGatePromise) {
            registrationGatePromise = new Promise(function (resolve) {
                registrationGateResolve = resolve;
            });
        }
        return registrationGatePromise;
    }

    async function completePlatformEntry() {
        const root = document.getElementById(ROOT_ID);
        const tableOverlay = document.getElementById('hashcodRegistrationTableOverlay');
        if (tableOverlay) {
            tableOverlay.classList.remove('is-open');
            tableOverlay.setAttribute('aria-hidden', 'true');
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

        window.dispatchEvent(new CustomEvent('hashcod:platform-entered', {
            detail: { source: 'platform-registration', registrationSaved: true }
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

    window.HashcodPlatformRegistration = Object.freeze({
        waitForSuccessfulSubmission: waitForSuccessfulSubmission,
        completePlatformEntry: completePlatformEntry,
        isSaved: function () { return registrationSaved; },
        mount: mount
    });
})();