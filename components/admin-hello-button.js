(function () {
    'use strict';

    // Load the unified Hashcod authentication visual system. This is deliberately
    // presentation-only: existing IDs, forms, auth handlers and Turnstile remain intact.
    (function loadAuthVectorThemeAssets() {
        const current = document.currentScript;
        const currentSrc = current && current.src ? current.src : '';
        const componentBase = currentSrc && currentSrc.lastIndexOf('/') >= 0
            ? currentSrc.slice(0, currentSrc.lastIndexOf('/') + 1)
            : '/components/';

        if (!document.getElementById('authVectorThemeStylesheet')) {
            const link = document.createElement('link');
            link.id = 'authVectorThemeStylesheet';
            link.rel = 'stylesheet';
            link.href = componentBase + 'auth-vector-theme.css?v=20260910-2';
            document.head.appendChild(link);
        }

        if (!document.getElementById('authVectorIntegrationsStylesheet')) {
            const link = document.createElement('link');
            link.id = 'authVectorIntegrationsStylesheet';
            link.rel = 'stylesheet';
            link.href = componentBase + 'auth-vector-integrations.css?v=20260910-1';
            document.head.appendChild(link);
        }

        if (!document.getElementById('authVectorLayoutFixStylesheet')) {
            const link = document.createElement('link');
            link.id = 'authVectorLayoutFixStylesheet';
            link.rel = 'stylesheet';
            link.href = componentBase + 'auth-vector-layout-fix.css?v=20260910-5';
            document.head.appendChild(link);
        }

        if (!document.querySelector('script[data-auth-vector-theme]')) {
            const script = document.createElement('script');
            script.src = componentBase + 'auth-vector-theme.js?v=20260910-2';
            script.defer = true;
            script.dataset.authVectorTheme = 'true';
            document.head.appendChild(script);
        }

        if (!document.querySelector('script[data-auth-vector-layout-fix]')) {
            const script = document.createElement('script');
            script.src = componentBase + 'auth-vector-layout-fix.js?v=20260910-5';
            script.defer = true;
            script.dataset.authVectorLayoutFix = 'true';
            document.head.appendChild(script);
        }
    })();

    // Load the auth-screen Hashcod AI chat without exposing provider credentials in HTML.
    (function loadGroqAuthChatAssets() {
        const current = document.currentScript;
        const currentSrc = current && current.src ? current.src : '';
        const componentBase = currentSrc && currentSrc.lastIndexOf('/') >= 0
            ? currentSrc.slice(0, currentSrc.lastIndexOf('/') + 1)
            : '/components/';

        if (!document.getElementById('groqAuthChatStylesheet')) {
            const link = document.createElement('link');
            link.id = 'groqAuthChatStylesheet';
            link.rel = 'stylesheet';
            link.href = componentBase + 'groq-auth-chat.css?v=20260910-3';
            document.head.appendChild(link);
        }

        if (!document.querySelector('script[data-groq-auth-chat]')) {
            const script = document.createElement('script');
            script.src = componentBase + 'groq-auth-chat.js?v=20260910-3';
            script.defer = true;
            script.dataset.groqAuthChat = 'true';
            document.head.appendChild(script);
        }
    })();

    // Load both the functional engine and the visual enhancement for the
    // certified cryptographic-card tools. The engine exports the open* methods
    // consumed by the external utility rail.
    (function loadCryptoCardThemeAssets() {
        const current = document.currentScript;
        const currentSrc = current && current.src ? current.src : '';
        const componentBase = currentSrc && currentSrc.lastIndexOf('/') >= 0
            ? currentSrc.slice(0, currentSrc.lastIndexOf('/') + 1)
            : '/components/';

        if (!document.querySelector('script[src*="crypto-card-validation.js"]')) {
            const engine = document.createElement('script');
            engine.id = 'hashcodCryptoCardValidationEngine';
            engine.src = componentBase + 'crypto-card-validation.js?v=20260910-4';
            engine.defer = true;
            document.head.appendChild(engine);
        }

        if (!document.getElementById('cryptoCardValidationThemeStylesheet')) {
            const link = document.createElement('link');
            link.id = 'cryptoCardValidationThemeStylesheet';
            link.rel = 'stylesheet';
            link.href = componentBase + 'crypto-card-validation-theme.css?v=20260910-2';
            document.head.appendChild(link);
        }

        if (!document.querySelector('script[data-crypto-card-theme]')) {
            const script = document.createElement('script');
            script.src = componentBase + 'crypto-card-validation-theme.js?v=20260910-2';
            script.defer = true;
            script.dataset.cryptoCardTheme = 'true';
            document.head.appendChild(script);
        }
    })();

    // Load the monochrome Hashcod boot sequence and manual entry handoff.
    // The hold layer waits for a deliberate second click before the login is shown.
    (function loadPlatformEntryMotionAssets() {
        const current = document.currentScript;
        const currentSrc = current && current.src ? current.src : '';
        const componentBase = currentSrc && currentSrc.lastIndexOf('/') >= 0
            ? currentSrc.slice(0, currentSrc.lastIndexOf('/') + 1)
            : '/components/';

        if (!document.getElementById('platformEntryMotionStylesheet')) {
            const link = document.createElement('link');
            link.id = 'platformEntryMotionStylesheet';
            link.rel = 'stylesheet';
            link.href = componentBase + 'platform-entry-motion.css?v=20260910-2';
            document.head.appendChild(link);
        }

        if (!document.getElementById('platformEntryHoldStylesheet')) {
            const link = document.createElement('link');
            link.id = 'platformEntryHoldStylesheet';
            link.rel = 'stylesheet';
            link.href = componentBase + 'platform-entry-hold.css?v=20260910-4';
            document.head.appendChild(link);
        }

        if (!document.getElementById('platformEntrySloganStylesheet')) {
            const link = document.createElement('link');
            link.id = 'platformEntrySloganStylesheet';
            link.rel = 'stylesheet';
            link.href = componentBase + 'platform-entry-slogan.css?v=20260910-1';
            document.head.appendChild(link);
        }

        if (!document.querySelector('script[data-platform-entry-slogan]')) {
            const sloganScript = document.createElement('script');
            sloganScript.src = componentBase + 'platform-entry-slogan.js?v=20260911-2';
            sloganScript.defer = true;
            sloganScript.dataset.platformEntrySlogan = 'true';
            document.head.appendChild(sloganScript);
        }

        function loadHoldScript() {
            if (document.querySelector('script[data-platform-entry-hold]')) return;
            const holdScript = document.createElement('script');
            holdScript.src = componentBase + 'platform-entry-hold.js?v=20260910-4';
            holdScript.defer = true;
            holdScript.dataset.platformEntryHold = 'true';
            document.head.appendChild(holdScript);
        }

        const existingMotion = document.querySelector('script[data-platform-entry-motion]');
        if (!existingMotion) {
            const script = document.createElement('script');
            script.src = componentBase + 'platform-entry-motion.js?v=20260910-2';
            script.defer = true;
            script.dataset.platformEntryMotion = 'true';
            script.addEventListener('load', loadHoldScript, { once: true });
            document.head.appendChild(script);
        } else if (window.__hashcodPlatformEntryMotionLoaded) {
            loadHoldScript();
        } else {
            existingMotion.addEventListener('load', loadHoldScript, { once: true });
        }

        window.setTimeout(loadHoldScript, 600);
    })();

    // Load the PNG vault attached to the first cube in the 3D vector tray.
    (function loadVectorImageVaultAssets() {
        const current = document.currentScript;
        const currentSrc = current && current.src ? current.src : '';
        const componentBase = currentSrc && currentSrc.lastIndexOf('/') >= 0
            ? currentSrc.slice(0, currentSrc.lastIndexOf('/') + 1)
            : '/components/';

        if (!document.getElementById('vectorImageVaultStylesheet')) {
            const link = document.createElement('link');
            link.id = 'vectorImageVaultStylesheet';
            link.rel = 'stylesheet';
            link.href = componentBase + 'vector-image-vault.css?v=20260911-1';
            document.head.appendChild(link);
        }

        if (!document.querySelector('script[data-vector-image-vault]')) {
            const script = document.createElement('script');
            script.src = componentBase + 'vector-image-vault.js?v=20260912-1';
            script.defer = true;
            script.dataset.vectorImageVault = 'true';
            document.head.appendChild(script);
        }
    })();

    // Load the classroom-board workspace attached to the second cube.
    (function loadVectorClassroomBoardAssets() {
        const current = document.currentScript;
        const currentSrc = current && current.src ? current.src : '';
        const componentBase = currentSrc && currentSrc.lastIndexOf('/') >= 0
            ? currentSrc.slice(0, currentSrc.lastIndexOf('/') + 1)
            : '/components/';

        if (!document.getElementById('vectorClassroomBoardStylesheet')) {
            const link = document.createElement('link');
            link.id = 'vectorClassroomBoardStylesheet';
            link.rel = 'stylesheet';
            link.href = componentBase + 'vector-classroom-board.css?v=20260911-2';
            document.head.appendChild(link);
        }

        if (!document.querySelector('script[data-vector-classroom-board]')) {
            const script = document.createElement('script');
            script.src = componentBase + 'vector-classroom-board.js?v=20260913-2';
            script.defer = true;
            script.dataset.vectorClassroomBoard = 'true';
            document.head.appendChild(script);
        }
    })();

    // Global collaborative persistence for browser tools. IndexedDB is only the
    // offline cache; Supabase PostgreSQL + Storage is the shared source of truth.
    (function loadCloudDeviceSync() {
        const current = document.currentScript;
        const currentSrc = current && current.src ? current.src : '';
        const componentBase = currentSrc && currentSrc.lastIndexOf('/') >= 0
            ? currentSrc.slice(0, currentSrc.lastIndexOf('/') + 1)
            : '/components/';
        if (document.querySelector('script[data-hashcod-cloud-sync]')) return;
        const script = document.createElement('script');
        script.src = componentBase + 'cloud-device-sync.js?v=20260913-3';
        script.defer = true;
        script.dataset.hashcodCloudSync = 'true';
        document.head.appendChild(script);
    })();

    const overlay = document.getElementById('authOverlay');
    const wrapper = document.getElementById('authWrapper');
    if (!overlay || !wrapper) return;

    const current = document.currentScript;
    const currentSrc = current && current.src ? current.src : '';
    const componentBase = currentSrc && currentSrc.lastIndexOf('/') >= 0
        ? currentSrc.slice(0, currentSrc.lastIndexOf('/') + 1)
        : '/components/';

    const CODEKEY_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 256 256" aria-hidden="true" focusable="false"><g fill="none" fill-rule="nonzero" stroke="none" stroke-width="1" stroke-linecap="butt" stroke-linejoin="miter" stroke-miterlimit="10" stroke-dasharray="" stroke-dashoffset="0" font-family="none" font-weight="none" font-size="none" text-anchor="none" style="mix-blend-mode:normal"><g transform="scale(5.33333,5.33333)"><path d="M33.5,10c-7.456,0 -13.5,6.044 -13.5,13.5c0,7.456 6.044,13.5 13.5,13.5c7.456,0 13.5,-6.044 13.5,-13.5c0,-7.456 -6.044,-13.5 -13.5,-13.5zM33.5,30c-3.59,0 -6.5,-2.91 -6.5,-6.5c0,-3.59 2.91,-6.5 6.5,-6.5c3.59,0 6.5,2.91 6.5,6.5c0,3.59 -2.91,6.5 -6.5,6.5z" fill="#000000"></path><path d="M19.14,28.051v-0.003c-1.18,1.204 -2.822,1.952 -4.64,1.952c-3.59,0 -6.5,-2.91 -6.5,-6.5c0,-3.59 2.91,-6.5 6.5,-6.5c1.83,0 3.481,0.759 4.662,1.976l3.75,-6.024c-2.308,-1.843 -5.229,-2.952 -8.412,-2.952c-7.456,0 -13.5,6.044 -13.5,13.5c0,7.456 6.044,13.5 13.5,13.5c3.164,0 6.067,-1.097 8.369,-2.919z" fill="#000000"></path><path d="M8,23.5c0,-1.787 0.722,-3.405 1.889,-4.58l-4.855,-5.038c-2.488,2.448 -4.034,5.851 -4.034,9.618c0,3.749 1.53,7.14 3.998,9.586l4.934,-4.964c-1.192,-1.178 -1.932,-2.813 -1.932,-4.622z" fill="#262626"></path><path d="M38.13,18.941c1.155,1.173 1.87,2.782 1.87,4.559c0,3.59 -2.91,6.5 -6.5,6.5c-1.826,0 -3.474,-0.755 -4.655,-1.968l-4.999,4.895c2.452,2.51 5.868,4.073 9.654,4.073c7.456,0 13.5,-6.044 13.5,-13.5c0,-3.684 -1.479,-7.019 -3.871,-9.455z" fill="#262626"></path></g></g></svg>';

    const panel = document.createElement('div');
    panel.className = 'admin-hello-access';
    panel.innerHTML = '<button type="button" id="adminHelloButton" aria-describedby="adminHelloStatus" aria-label="Increase the HVV · cargar CodeKey Jupyter" title="Cargar CodeKey Jupyter para administrar">' + CODEKEY_ICON + '<span>Increase the HVV</span></button><p id="adminHelloStatus" role="status" aria-live="polite">Carga la CodeKey Jupyter (.ipynb) para administrar.</p>';
    wrapper.appendChild(panel);

    const button = panel.querySelector('button');
    const label = button.querySelector('span');
    const status = panel.querySelector('[role="status"]');

    function renderAuthState(authenticated) {
        const verified = authenticated === true;
        button.classList.toggle('is-verified', verified);
        button.dataset.verified = verified ? 'true' : 'false';
        button.title = verified ? 'CodeKey verificada. Pulsa para validar de nuevo.' : 'Cargar CodeKey Jupyter para administrar';
        label.textContent = 'Increase the HVV';
        if (!button.disabled) {
            status.textContent = verified
                ? 'Administración habilitada. La CodeKey está activa durante 10 minutos.'
                : 'Carga la CodeKey Jupyter (.ipynb) para administrar.';
        }
    }

    function position() {
        const scale = Math.max(window.innerWidth / 1600, window.innerHeight / 900);
        const fitsArtwork = window.innerHeight / 2 + 310 * scale + 110 <= window.innerHeight;
        const compact = window.innerWidth < 1100 || !fitsArtwork || document.body.classList.contains('mobile-mode');
        const parent = compact ? (wrapper.querySelector('.auth-card') || wrapper) : overlay;
        if (panel.parentElement !== parent) parent.appendChild(panel);
        panel.classList.toggle('is-compact', compact);
    }

    function ensureAdminEngine() {
        if (window.HashcodAdmin && typeof window.HashcodAdmin.require === 'function') return Promise.resolve(true);
        let script = document.getElementById('hashcodAdminDeviceEngine') || document.querySelector('script[src*="admin-device.js"]');
        if (!script) {
            script = document.createElement('script');
            script.id = 'hashcodAdminDeviceEngine';
            script.src = componentBase + 'admin-device.js?v=20260915-codekey1';
            script.defer = true;
            document.head.appendChild(script);
        }
        return new Promise(resolve => {
            let tries = 0;
            const timer = window.setInterval(function () {
                tries += 1;
                if (window.HashcodAdmin && typeof window.HashcodAdmin.require === 'function') {
                    window.clearInterval(timer);
                    resolve(true);
                } else if (tries >= 60) {
                    window.clearInterval(timer);
                    resolve(false);
                }
            }, 100);
        });
    }

    position();
    renderAuthState(document.documentElement.dataset.adminAuthenticated === 'true');
    window.addEventListener('resize', position);
    window.addEventListener('hashcod:admin-auth', function (event) {
        renderAuthState(Boolean(event.detail && event.detail.authenticated));
    });
    new MutationObserver(position).observe(document.body, { attributes: true, attributeFilter: ['class'] });

    button.addEventListener('click', async function () {
        button.disabled = true;
        button.setAttribute('aria-busy', 'true');
        status.textContent = 'Selecciona la CodeKey Jupyter autorizada…';
        try {
            const ready = await ensureAdminEngine();
            if (!ready) throw new Error('No se pudo cargar la verificación CodeKey. Recarga la página.');
            const verified = await window.HashcodAdmin.require({ force: true });
            renderAuthState(verified);
            status.textContent = verified
                ? 'CodeKey verificada. Las herramientas protegidas están activas durante 10 minutos.'
                : 'No se validó el archivo. Pulsa para reintentar.';
        } catch (error) {
            renderAuthState(false);
            status.textContent = error.message || 'No se pudo verificar la CodeKey. Inténtalo de nuevo.';
        } finally {
            button.disabled = false;
            button.removeAttribute('aria-busy');
        }
    });
})();
