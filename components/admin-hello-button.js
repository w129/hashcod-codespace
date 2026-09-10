(function () {
    'use strict';

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

    // Load the visual enhancement for the certified cryptographic-card access tool.
    // The original validation logic remains untouched; this layer only adds classes,
    // accessibility metadata and Hashcod-aligned styling.
    (function loadCryptoCardThemeAssets() {
        const current = document.currentScript;
        const currentSrc = current && current.src ? current.src : '';
        const componentBase = currentSrc && currentSrc.lastIndexOf('/') >= 0
            ? currentSrc.slice(0, currentSrc.lastIndexOf('/') + 1)
            : '/components/';

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
            link.href = componentBase + 'platform-entry-hold.css?v=20260910-1';
            document.head.appendChild(link);
        }

        function loadHoldScript() {
            if (document.querySelector('script[data-platform-entry-hold]')) return;
            const holdScript = document.createElement('script');
            holdScript.src = componentBase + 'platform-entry-hold.js?v=20260910-1';
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

        // Fallback for cached/dynamically inserted scripts whose load event may
        // already have fired. The hold module safely waits for l8EnterPlatform.
        window.setTimeout(loadHoldScript, 600);
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