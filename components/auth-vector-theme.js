(function () {
    'use strict';

    if (window.__hashcodAuthVectorThemeLoaded) return;
    window.__hashcodAuthVectorThemeLoaded = true;

    const ROLE_PATHS = Object.freeze({
        login: 'M27 27L21 27 21 25 25 25 25 21 27 21zM27 11L25 11 25 7 21 7 21 5 27 5zM7 11L5 11 5 5 11 5 11 7 7 7zM11 27L5 27 5 21 7 21 7 25 11 25zM10 19H12V21H10zM14 16H16V18H14zM16 10H18V16H16zM10 10H12V14H10zM20 10h2v4h-2zM20 19h2v2h-2zM12 21h8v2h-8z',
        register: 'M8 3L8 15 12 15 12 27 14 27 14 15 18 15 18 19 20 19 20 15 24 15 24 3 8 3zM18 19L16 19 16 21 18 21 18 19zM18 21L18 23 20 23 20 21 18 21zM18 23L16 23 16 25 18 25 18 23zM18 25L18 27 14 27 14 29 20 29 20 25 18 25zM10 5L22 5 22 13 10 13 10 5zM13 7L13 9 19 9 19 7 13 7z',
        recover: 'M7 4L7 6 25 6 25 4 7 4zM25 6L25 11 27 11 27 6 25 6zM25 11L7 11 7 13 25 13 25 11zM25 13L25 15 27 15 27 13 25 13zM7 13L5 13 5 19 7 19 7 13zM7 19L7 21 13 21 13 19 7 19zM7 21L5 21 5 26 7 26 7 21zM7 26L7 28 13 28 13 26 7 26zM7 11L7 6 5 6 5 11 7 11zM15 17L15 23 17 23 21 23 21 21 19 21 19 19 17 19 17 17 15 17zM19 19L25 19 25 17 19 17 19 19zM25 19L25 21 27 21 27 19 25 19zM27 21L27 27 29 27 29 21 27 21zM27 27L25 27 25 29 27 29 27 27zM25 29L19 29 19 31 25 31 25 29zM19 29L19 27 17 27 17 29 19 29zM17 27L17 25 15 25 15 27 17 27z',
        check: 'M10 4L10 6 22 6 22 4 10 4zM22 6L22 8 24 8 24 6 22 6zM24 8L24 10 26 10 26 8 24 8zM26 10L26 22 28 22 28 10 26 10zM26 22L24 22 24 24 26 24 26 22zM24 24L22 24 22 26 24 26 24 24zM22 26L10 26 10 28 22 28 22 26zM10 26L10 24 8 24 8 26 10 26zM8 24L8 22 6 22 6 24 8 24zM6 22L6 10 4 10 4 22 6 22zM6 10L8 10 8 8 6 8 6 10zM8 8L10 8 10 6 8 6 8 8zM19 11L19 15 21 15 21 11 19 11zM19 15L17 15 17 19 19 19 19 15zM17 19L14 19 14 21 17 21 17 19zM14 19L14 15 12 15 12 19 14 19z',
        aes: 'M8 3L8 15 12 15 12 27 14 27 14 15 18 15 18 19 20 19 20 15 24 15 24 3 8 3zM18 19L16 19 16 21 18 21 18 19zM18 21L18 23 20 23 20 21 18 21zM18 23L16 23 16 25 18 25 18 23zM18 25L18 27 14 27 14 29 20 29 20 25 18 25zM10 5L22 5 22 13 10 13 10 5zM13 7L13 9 19 9 19 7 13 7z',
        identity: 'M3 6L3 26 29 26 29 6 3 6zM5 8L27 8 27 24 5 24 5 8zM7 11L7 15 11 15 11 11 7 11zM17 11L17 13 25 13 25 11 17 11zM7 19L7 21 10 21 10 19 7 19zM12 19L12 21 15 21 15 19 12 19zM17 19L17 21 20 21 20 19 17 19zM22 19L22 21 25 21 25 19 22 19z',
        dilithium: 'M13 7L11 7 11 9 21 9 21 7 19 7 19 5 21 5 21 3 19 3 19 0 17 0 17 7 15 7 15 0 13 0 13 3 11 3 11 5 13 5zM19 25L21 25 21 23 11 23 11 25 13 25 13 27 11 27 11 29 13 29 13 32 15 32 15 25 17 25 17 32 19 32 19 29 21 29 21 27 19 27zM21 5H23V7H21zM21 25H23V27H21zM9 5H11V7H9zM7 7H9V9H7zM23 7H25V9H23zM7 23H9V25H7zM23 23H25V25H23zM9 25H11V27H9zM11 21L11 9 9 9 9 23 11 23zM21 11L21 23 23 23 23 9 21 9zM5 9H7V23H5zM25 9H27V23H25z',
        oneTime: 'M8 2L8 17 6 17 6 19 10 19 10 4 14 4 14 2 8 2zM14 4L14 6 16 6 16 4 14 4zM16 6L16 27 4 27 4 21 2 21 2 29 24 29 24 27 18 27 18 19 28 19 28 17 18 17 18 6 16 6zM28 19L28 25 30 25 30 19 28 19zM28 25L24 25 24 27 28 27 28 25zM4 21L6 21 6 19 4 19 4 21zM24 21L24 23 26 23 26 21 24 21zM6 23L6 25 8 25 8 23 6 23z',
        copy: 'M9 4L9 24 27 24 27 4 9 4zM11 6L25 6 25 22 11 22 11 6zM16 8L16 10 20 10 20 8 16 8zM20 10L20 13 22 13 22 10 20 10zM16 10L14 10 14 13 16 13 16 10zM5 9L5 28 22 28 22 26 7 26 7 9 5 9zM17 12L17 16 19 16 19 12 17 12zM14 15L14 18 16 18 16 15 14 15zM16 18L16 20 20 20 20 18 16 18zM20 18L22 18 22 15 20 15 20 18z',
        success: 'M17 10H20V12H17zM26 10H29V12H26zM20 8H26V10H20zM29 12H31V20H29zM15 12H17V20H15zM26 20H29V22H26zM17 20H20V22H17zM20 22H26V24H20zM3 10H6V12H3zM6 8H15V10H6zM1 12H3V20H1zM3 20H6V22H3zM6 22H15V24H6z',
        error: 'M10 4L10 6 22 6 22 4 10 4zM22 6L22 8 24 8 24 6 22 6zM24 8L24 10 26 10 26 8 24 8zM26 10L26 22 28 22 28 10 26 10zM26 22L24 22 24 24 26 24 26 22zM24 24L22 24 22 26 24 26 24 24zM22 26L10 26 10 28 22 28 22 26zM10 26L10 24 8 24 8 26 10 26zM8 24L8 22 6 22 6 24 8 24zM6 22L6 10 4 10 4 22 6 22zM6 10L8 10 8 8 6 8 6 10zM8 8L10 8 10 6 8 6 8 8zM11 11L11 13 13 13 13 11 11 11zM13 13L13 15 15 15 15 13 13 13zM15 15L15 17 17 17 17 15 15 15zM17 15L19 15 19 13 17 13 17 15zM19 13L21 13 21 11 19 11 19 13zM17 17L17 19 19 19 19 17 17 17zM19 19L19 21 21 21 21 19 19 19zM15 17L13 17 13 19 15 19 15 17zM13 19L11 19 11 21 13 21 13 19z',
        privacy: 'M7 20H9V24H7zM9 24H12V26H9zM12 26H15V28H12zM20 24H23V26H20zM17 26H20V28H17zM23 20H25V24H23zM15 28H17V30H15zM12 3H20V5H12zM7 20L5 20 5 5 12 5 12 7 7 7zM27 20L25 20 25 7 20 7 20 5 27 5zM14 9h4v4h-4zM20 22h-8v-7h8zm-6-2h4v-3h-4z',
        restore: 'M11.003906 3.0019531L11.003906 5.0019531 20.998047 5.0019531 20.998047 13 7 13 7 9 5 9 5 29 7 29 7 15 20.998047 15 20.998047 18 21 18 21 19 25 19 25 17 22.998047 17 22.998047 5 21.003906 5 21.003906 3.0019531zM25 19L25 21 27 21 27 19zM27 21L27 25 29 25 29 21zM27 25L25 25 25 27 27 27zM25 27L21 27 21 29 25 29zM21 27L21 25 19 25 19 27zM19 25L19 21 17 21 17 25zM19 21L21 21 21 19 19 19zM7 9L9 9 9 7 7 7zM9 7L11 7 11 5 9 5z',
        info: 'M10 4L10 6 22 6 22 4 10 4zM22 6L22 8 24 8 24 6 22 6zM24 8L24 10 26 10 26 8 24 8zM26 10L26 22 28 22 28 10 26 10zM26 22L24 22 24 24 26 24zM24 24L22 24 22 26 24 26zM22 26L10 26 10 28 22 28zM10 26L10 24 8 24 8 26zM8 24L8 22 6 22 6 24zM6 22L6 10 4 10 4 22zM6 10L8 10 8 8 6 8zM8 8L10 8 10 6 8 6zM15 10L15 12 17 12 17 10zM14 14L14 16 15 16 15 22 18 22 18 20 17 20 17 14z',
        visibility: 'M12 5L12 7 20 7 20 5 12 5zM20 7L20 9 24 9 24 7zM24 9L24 11 26 11 26 9zM26 11L26 13 28 13 28 11zM28 13L28 19 30 19 30 13zM28 19L26 19 26 21 28 21zM26 21L24 21 24 23 26 23zM24 23L20 23 20 25 24 25zM20 25L12 25 12 27 20 27zM12 25L12 23 8 23 8 25zM8 23L8 21 6 21 6 23zM6 21L6 19 4 19 4 21zM4 19L4 13 2 13 2 19zM4 13L6 13 6 11 4 11zM6 11L8 11 8 9 6 9zM8 9L12 9 12 7 8 7zM12 12L12 20 20 20 20 15 17 15 17 12 12 12z',
        help: 'M10 4L10 6 22 6 22 4 10 4zM22 6L22 8 24 8 24 6zM24 8L24 10 26 10 26 8zM26 10L26 22 28 22 28 10zM26 22L24 22 24 24 26 24zM24 24L22 24 22 26 24 26zM22 26L10 26 10 28 22 28zM10 26L10 24 8 24 8 26zM8 24L8 22 6 22 6 24zM6 22L6 10 4 10 4 22zM6 10L8 10 8 8 6 8zM8 8L10 8 10 6 8 6zM12 10L12 12 20 12 20 10zM20 12L20 20 22 20 22 12zM20 20L12 20 12 22 20 22zM12 20L12 12 10 12 10 20z',
        close: 'M5 5L5 27 27 27 27 5 5 5zM7 7L25 7 25 25 7 25 7 7zM11 11L11 13 13 13 13 11zM13 13L13 15 15 15 15 13zM15 15L15 17 17 17 17 15zM17 15L19 15 19 13 17 13 17 15zM19 13L21 13 21 11 19 11 19 13zM17 17L17 19 19 19 19 17zM19 19L19 21 21 21 21 19zM15 17L13 17 13 19 15 19zM13 19L11 19 11 21 13 21z',
        back: 'M11 4L11 5 6 5 6 28 26 28 26 5 21 5 21 4 11 4zM13 6L19 6 19 8 13 8zM8 7L11 7 11 10 21 10 21 7 24 7 24 26 8 26zM14.001953 13.001953L14.001953 14.998047 12.001953 14.998047 12.001953 17.009766 10 17.009766 10 19.009766 12.001953 19.009766 12.001953 20.998047 14.001953 20.998047 14.001953 23.001953 16.001953 23.001953 16.001953 19.009766 22 19.009766 22 17.009766 16.001953 17.009766 16.001953 13.001953z',
        continue: 'M15 0L15 15 17 15 17 0zM25 7L25 9 27 9 27 7zM25 9L23 9 23 11 25 11zM23 11L21 11 21 13 23 13zM21 13L19 13 19 15 21 15zM7 9L7 11 9 11 9 9zM9 11L9 13 11 13 11 11zM11 13L11 15 13 15 13 13zM3 17L3 19 13 19 13 17zM15 17L15 19 17 19 17 17zM19 17L19 19 27 19 27 17zM11 21L11 23 13 23 13 21zM11 23L9 23 9 25 11 25zM9 25L7 25 7 27 9 27zM7 27L5 27 5 29 7 29zM15 21L15 27 17 27 17 21zM19 21L19 23 21 23 21 21zM21 23L21 25 23 25 23 23zM23 25L23 27 25 27 25 25z',
        loading: 'M2 5L2 26 4 26 4 7 18 7 18 24 12 24 12 26 20 26 20 14 23 14 23 20 28 20 28 26 30 26 30 12 20 12 20 5 2 5zM25 14L28 14 28 18 25 18zM6 24L6 28 10 28 10 24zM22 24L22 28 26 28 26 24z',
        admin: 'M12 4L12 12 20 12 20 4 12 4zM11 16L11 18 14 18 14 20 15 20 15 26 7 26 7 20 5 20 5 28 27 28 27 20 25 20 25 26 17 26 17 20 18 20 18 18 21 18 21 16 11 16zM21 18L21 20 25 20 25 18zM7 20L11 20 11 18 7 18z'
    });

    const MODE_META = Object.freeze({
        login: { label: 'INICIAR SESIÓN', role: 'login', number: '01 / 04' },
        register: { label: 'REGISTRARSE', role: 'register', number: '02 / 04' },
        recover: { label: 'RECUPERAR', role: 'recover', number: '03 / 04' },
        check: { label: 'COMPROBAR', role: 'check', number: '04 / 04' }
    });

    const FIELD_RULES = [
        { rx: /aes[-\s]?256|clave aes/i, role: 'aes' },
        { rx: /l8id|identificador|id de cuenta/i, role: 'identity' },
        { rx: /dilithium|pqc|post[-\s]?cu[aá]nt/i, role: 'dilithium' },
        { rx: /recuper|recovery/i, role: 'restore' },
        { rx: /correo|email|e-mail/i, role: 'identity' },
        { rx: /clave|key|contrase/i, role: 'aes' }
    ];

    function svg(role, className) {
        const path = ROLE_PATHS[role] || ROLE_PATHS.info;
        return '<svg class="' + (className || 'hashcod-auth-svg') + '" viewBox="0 0 32 32" aria-hidden="true" focusable="false"><path d="' + path + '"></path></svg>';
    }

    function normalizeText(value) {
        return String(value || '').replace(/\s+/g, ' ').trim().toLowerCase();
    }

    function roleForTab(tab) {
        const text = normalizeText(tab.textContent);
        if (text.includes('registr')) return 'register';
        if (text.includes('recuper')) return 'recover';
        if (text.includes('compro')) return 'check';
        return 'login';
    }

    function roleForLabel(label) {
        const text = normalizeText(label.textContent);
        for (let i = 0; i < FIELD_RULES.length; i += 1) {
            if (FIELD_RULES[i].rx.test(text)) return FIELD_RULES[i].role;
        }
        return 'info';
    }

    function modeFromActiveTab(wrapper) {
        const active = wrapper.querySelector('.auth-tab.active, .auth-tab[aria-selected="true"]');
        return active ? roleForTab(active) : 'login';
    }

    function ensureBrand(wrapper) {
        const card = wrapper.querySelector('.auth-card') || wrapper;
        if (card.querySelector('.hashcod-auth-system-line')) return;
        const line = document.createElement('div');
        line.className = 'hashcod-auth-system-line';
        line.innerHTML = '<span class="hashcod-auth-system-brand"><img src="/favicon.svg" alt="" aria-hidden="true"><span>HASHCOD / SECURE ACCESS</span></span><span class="hashcod-auth-system-state"><i></i>PQC READY</span>';
        card.insertBefore(line, card.firstChild);
    }

    function enhanceTabs(wrapper) {
        wrapper.querySelectorAll('.auth-tab').forEach(function (tab) {
            const role = roleForTab(tab);
            tab.dataset.hashcodRole = role;
            if (!tab.querySelector('.hashcod-auth-tab-icon')) {
                tab.insertAdjacentHTML('afterbegin', '<span class="hashcod-auth-tab-icon">' + svg(role) + '</span>');
            }
        });
    }

    function associatedControl(wrapper, label) {
        const forId = label.getAttribute('for');
        if (forId) {
            try {
                const byId = wrapper.querySelector('#' + CSS.escape(forId));
                if (byId) return byId;
            } catch (error) {}
        }
        return label.querySelector('input, textarea, select') || label.parentElement && label.parentElement.querySelector('input, textarea, select');
    }

    function enhanceFields(wrapper) {
        wrapper.querySelectorAll('label').forEach(function (label) {
            if (label.dataset.hashcodEnhanced === 'true') return;
            const control = associatedControl(wrapper, label);
            if (!control || control.type === 'hidden' || control.type === 'checkbox' || control.type === 'radio') return;
            const role = roleForLabel(label);
            label.dataset.hashcodEnhanced = 'true';
            label.classList.add('hashcod-auth-label');
            label.insertAdjacentHTML('afterbegin', '<span class="hashcod-auth-label-icon">' + svg(role) + '</span>');

            const parent = control.parentElement;
            if (parent && !parent.classList.contains('hashcod-auth-input-shell')) {
                parent.classList.add('hashcod-auth-field-parent');
                const icon = document.createElement('span');
                icon.className = 'hashcod-auth-input-icon';
                icon.innerHTML = svg(role);
                parent.insertBefore(icon, control);
                control.classList.add('hashcod-auth-control');
            }
        });

        wrapper.querySelectorAll('input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]), textarea, select').forEach(function (control) {
            control.classList.add('hashcod-auth-control');
        });
    }

    function roleForAction(element) {
        const text = normalizeText(element.textContent + ' ' + (element.getAttribute('aria-label') || '') + ' ' + (element.getAttribute('title') || ''));
        if (/registr|crear cuenta/.test(text)) return 'register';
        if (/recuper|restaur/.test(text)) return 'restore';
        if (/compro|verific|valid/.test(text)) return 'check';
        if (/copiar/.test(text)) return 'copy';
        if (/cerrar|close/.test(text)) return 'close';
        if (/volver|atr[aá]s|back/.test(text)) return 'back';
        if (/admin|windows hello/.test(text)) return 'admin';
        if (/entrar|iniciar|continuar|acceder/.test(text)) return 'continue';
        return '';
    }

    function enhanceActions(wrapper) {
        wrapper.querySelectorAll('button, a').forEach(function (element) {
            if (element.dataset.hashcodActionEnhanced === 'true') return;
            if (element.closest('.cf-turnstile')) return;
            const role = roleForAction(element);
            if (!role) return;
            element.dataset.hashcodActionEnhanced = 'true';
            element.classList.add('hashcod-auth-action');
            if (!element.querySelector('svg, .hashcod-auth-action-icon')) {
                element.insertAdjacentHTML('afterbegin', '<span class="hashcod-auth-action-icon">' + svg(role) + '</span>');
            }
        });
    }

    function enhancePrivacy(wrapper) {
        wrapper.querySelectorAll('a[href*="privacy"], a[href*="politica"]').forEach(function (link) {
            link.classList.add('hashcod-auth-privacy-link');
            if (!link.querySelector('.hashcod-auth-privacy-icon')) {
                link.insertAdjacentHTML('afterbegin', '<span class="hashcod-auth-privacy-icon">' + svg('privacy') + '</span>');
            }
        });
    }

    function classifyMessage(node) {
        const text = normalizeText(node.textContent);
        const cls = normalizeText(node.className);
        if (!text || text.length > 600) return '';
        if (/error|incorrect|rechaz|revoc|fall|deneg|inv[aá]lid/.test(text + ' ' + cls)) return 'error';
        if (/correct|exitos|verificad|activad|concedid|success|lista para/.test(text + ' ' + cls)) return 'success';
        if (/cargando|verificando|procesando|espera/.test(text + ' ' + cls)) return 'loading';
        return '';
    }

    function enhanceMessages(wrapper) {
        wrapper.querySelectorAll('[role="alert"], [role="status"], .error, .success, .alert, .message, .auth-error, .auth-success').forEach(function (node) {
            if (node.dataset.hashcodMessageEnhanced === 'true') return;
            const state = classifyMessage(node);
            if (!state) return;
            node.dataset.hashcodMessageEnhanced = 'true';
            node.dataset.hashcodState = state;
            node.classList.add('hashcod-auth-message');
            if (!node.querySelector('.hashcod-auth-message-icon')) {
                node.insertAdjacentHTML('afterbegin', '<span class="hashcod-auth-message-icon">' + svg(state === 'loading' ? 'loading' : state) + '</span>');
            }
        });
    }

    function ensureModePlate(wrapper) {
        const tabs = wrapper.querySelector('.auth-tabs');
        if (!tabs) return;
        let plate = wrapper.querySelector('.hashcod-auth-mode-plate');
        if (!plate) {
            plate = document.createElement('div');
            plate.className = 'hashcod-auth-mode-plate';
            tabs.insertAdjacentElement('afterend', plate);
        }
        const mode = modeFromActiveTab(wrapper);
        const meta = MODE_META[mode] || MODE_META.login;
        plate.dataset.mode = mode;
        plate.innerHTML = '<span class="hashcod-auth-mode-icon">' + svg(meta.role) + '</span><span class="hashcod-auth-mode-copy"><small>AUTHENTICATION WINDOW</small><strong>' + meta.label + '</strong></span><span class="hashcod-auth-mode-number">' + meta.number + '</span>';
    }

    function enhance(wrapper) {
        wrapper.classList.add('hashcod-auth-enhanced');
        ensureBrand(wrapper);
        enhanceTabs(wrapper);
        ensureModePlate(wrapper);
        enhanceFields(wrapper);
        enhanceActions(wrapper);
        enhancePrivacy(wrapper);
        enhanceMessages(wrapper);
    }

    function install() {
        const wrapper = document.getElementById('authWrapper');
        if (!wrapper) return false;
        enhance(wrapper);

        wrapper.addEventListener('click', function (event) {
            if (event.target.closest('.auth-tab')) {
                window.setTimeout(function () { enhance(wrapper); }, 0);
            }
        });

        const observer = new MutationObserver(function () {
            window.requestAnimationFrame(function () { enhance(wrapper); });
        });
        observer.observe(wrapper, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'aria-selected', 'style'] });
        return true;
    }

    if (!install()) {
        const observer = new MutationObserver(function () {
            if (install()) observer.disconnect();
        });
        observer.observe(document.documentElement, { childList: true, subtree: true });
        window.setTimeout(function () { observer.disconnect(); }, 20000);
    }
})();
