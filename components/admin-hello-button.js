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
            link.href = componentBase + 'platform-entry-hold.css?v=20260918-2';
            document.head.appendChild(link);
        }

        if (!document.getElementById('platformEntrySloganStylesheet')) {
            const link = document.createElement('link');
            link.id = 'platformEntrySloganStylesheet';
            link.rel = 'stylesheet';
            link.href = componentBase + 'platform-entry-slogan.css?v=20260910-1';
            document.head.appendChild(link);
        }

        if (
            !document.getElementById('platformRegistrationStylesheet') &&
            !document.querySelector('link[data-hashcod-platform-registration-style]')
        ) {
            const link = document.createElement('link');
            link.id = 'platformRegistrationStylesheet';
            link.rel = 'stylesheet';
            link.href = componentBase + 'platform-registration-form.css?v=20260919-30';
            link.dataset.hashcodPlatformRegistrationStyle = 'true';
            document.head.appendChild(link);
        }

        if (!document.querySelector('script[data-platform-entry-slogan]')) {
            const sloganScript = document.createElement('script');
            sloganScript.src = componentBase + 'platform-entry-slogan.js?v=20260911-2';
            sloganScript.defer = true;
            sloganScript.dataset.platformEntrySlogan = 'true';
            document.head.appendChild(sloganScript);
        }

        function loadRegistrationScript() {
            if (
                window.HashcodPlatformRegistration ||
                document.querySelector('script[data-hashcod-platform-registration]')
            ) return;
            const registrationScript = document.createElement('script');
            registrationScript.src = componentBase + 'platform-registration-form.js?v=20260919-42';
            registrationScript.defer = true;
            registrationScript.dataset.hashcodPlatformRegistration = 'true';
            document.head.appendChild(registrationScript);
        }

        function loadHoldScript() {
            // Screen 2 is not allowed to exist without its required Screen 3.
            loadRegistrationScript();
            if (document.querySelector('script[data-platform-entry-hold]')) return;
            const holdScript = document.createElement('script');
            holdScript.src = componentBase + 'platform-entry-hold.js?v=20260918-37';
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
    // The vault reuses the platform's existing Windows Hello session and keeps
    // the landing artwork lightweight until the user opens the module.
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
        script.src = componentBase + 'cloud-device-sync.js?v=20260919-perf1';
        script.defer = true;
        script.dataset.hashcodCloudSync = 'true';
        document.head.appendChild(script);
    })();

    const overlay = document.getElementById('authOverlay');
    const wrapper = document.getElementById('authWrapper');
    if (!overlay || !wrapper) return;

    const panel = document.createElement('div');
    panel.className = 'admin-hello-access';
    panel.innerHTML = '<button type="button" id="adminHelloButton" aria-describedby="adminHelloStatus" title="Verificar esta laptop con Windows Hello"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" aria-hidden="true"><path fill="currentColor" d="M 10 3 L 10 5 L 18 5 L 18 3 L 10 3 z M 18 5 L 18 23 L 20 23 L 20 5 L 18 5 z M 18 23 L 14 23 L 14 25 L 18 25 L 18 23 z M 14 23 L 14 10 L 12 10 L 12 23 L 14 23 z M 10 5 L 8 5 L 8 27 L 10 27 L 10 5 z M 10 27 L 10 29 L 22 29 L 22 27 L 10 27 z M 22 27 L 24 27 L 24 23 L 25 23 L 25 15 L 26 15 L 26 11 L 24 11 L 24 15 L 23 15 L 23 23 L 22 23 L 22 27 z"></path></svg><span>Windows Hello</span></button><p id="adminHelloStatus" role="status" aria-live="polite">Verifica esta laptop para administrar.</p>';
    wrapper.appendChild(panel);

    const button = panel.querySelector('button');
    const label = button.querySelector('span');
    const status = panel.querySelector('[role="status"]');

    function renderAuthState(authenticated) {
        const verified = authenticated === true;
        button.classList.toggle('is-verified', verified);
        button.dataset.verified = verified ? 'true' : 'false';
        button.title = verified ? 'Windows Hello verificado. Pulsa para verificar de nuevo.' : 'Verificar esta laptop con Windows Hello';
        label.textContent = verified ? 'Windows Hello verificado' : 'Windows Hello';
        if (!button.disabled) {
            status.textContent = verified
                ? 'Administración habilitada. Las herramientas protegidas están activas.'
                : 'Verifica esta laptop para administrar.';
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

    position();
    renderAuthState(document.documentElement.dataset.adminAuthenticated === 'true');
    window.addEventListener('resize', position);
    window.addEventListener('hashcod:admin-auth', function (event) {
        renderAuthState(Boolean(event.detail && event.detail.authenticated));
    });
    new MutationObserver(position).observe(document.body, {attributes: true, attributeFilter: ['class']});

    button.addEventListener('click', async function () {
        button.disabled = true;
        button.setAttribute('aria-busy', 'true');
        status.textContent = 'Confirma Windows Hello en esta laptop…';
        try {
            if (!window.HashcodAdmin) throw new Error('No se pudo cargar la verificación. Recarga la página.');
            const verified = await window.HashcodAdmin.require({force: true});
            renderAuthState(verified);
            status.textContent = verified
                ? 'Laptop verificada. Las herramientas protegidas están activas durante 10 minutos.'
                : 'No se validó el acceso. Pulsa para reintentar.';
        } catch (error) {
            renderAuthState(false);
            status.textContent = error.message || 'No se pudo verificar. Inténtalo de nuevo.';
        } finally {
            button.disabled = false;
            button.removeAttribute('aria-busy');
        }
    });
})();