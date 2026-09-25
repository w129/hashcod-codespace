(function () {
    'use strict';

    const VERSION = '20260925-registration-retired-preserve-entry';
    if (window.__hashcodPlatformRegistrationLoaded === VERSION) return;
    window.__hashcodPlatformRegistrationLoaded = VERSION;

    const ROOT_ID = 'hashcodPlatformRegistration';
    const REMOVED_IDS = [
        'hashcodDirectRegistration',
        'hashcodHeroUIColorPicker',
        'hashcodTemporaryAccessDialog',
        'hcCodeModal'
    ];

    function removeRegistrationUi(options) {
        const keepHandoffRoot = options && options.keepHandoffRoot === true;
        REMOVED_IDS.forEach(function (id) {
            const node = document.getElementById(id);
            if (node && node.parentNode) node.parentNode.removeChild(node);
        });
        document.querySelectorAll(
            '.hashcod-registration-shell,.hashcod-registration-card,.hashcod-registration-form,.hc-reg-card,.hc-heroui-colorpicker'
        ).forEach(function (node) {
            if (node && node.parentNode) node.parentNode.removeChild(node);
        });
        if (!keepHandoffRoot) {
            const root = document.getElementById(ROOT_ID);
            if (root && root.parentNode) root.parentNode.removeChild(root);
        }
    }

    function mount() {
        removeRegistrationUi({ keepHandoffRoot: false });
        document.documentElement.dataset.hashcodFinalEntryScreen = 'true';

        let root = document.getElementById(ROOT_ID);
        if (!root) {
            root = document.createElement('section');
            root.id = ROOT_ID;
            root.dataset.hashcodScreen = '3';
            root.dataset.hashcodRegistrationRetired = 'true';
            root.setAttribute('aria-label', 'Entrada directa a Hashcod Codespace');
            root.style.cssText = [
                'position:fixed',
                'inset:0',
                'z-index:2147483644',
                'background:transparent',
                'pointer-events:none',
                'opacity:1'
            ].join(';');
            document.body.appendChild(root);
        } else {
            root.dataset.hashcodScreen = '3';
            root.dataset.hashcodRegistrationRetired = 'true';
        }

        return root;
    }

    function callOriginalEntry() {
        const current = window.l8EnterPlatform;
        const original = current && (
            current.__hashcodHoldOriginal ||
            current.__hashcodMotionOriginal ||
            current.__hashcodOriginal ||
            null
        );

        if (typeof original === 'function') {
            try {
                original.call(window);
                return true;
            } catch (error) {
                console.warn('[Hashcod registration retired] Original platform entry failed:', error);
            }
        }
        return false;
    }

    async function completePlatformEntry() {
        document.documentElement.dataset.hashcodPlatformEntered = 'true';
        document.documentElement.removeAttribute('data-hashcod-final-entry-screen');
        document.documentElement.removeAttribute('data-hashcod-direct-registration');
        document.body.classList.remove('hashcod-direct-registration-open', 'auth-locked', 'boot-locked');

        removeRegistrationUi({ keepHandoffRoot: false });
        callOriginalEntry();

        try {
            window.dispatchEvent(new CustomEvent('hashcod:platform-entered', {
                detail: {
                    source: 'platform-registration-form',
                    version: VERSION,
                    registration: 'retired',
                    preservesEntryAnimations: true
                }
            }));
        } catch (_) {}
        return true;
    }

    async function waitForSuccessfulSubmission() {
        return {
            ok: true,
            registrationRetired: true,
            directEntry: true
        };
    }

    window.HashcodPlatformRegistration = {
        version: VERSION,
        registrationRetired: true,
        preservesEntryAnimations: true,
        mount: mount,
        completePlatformEntry: completePlatformEntry,
        waitForSuccessfulSubmission: waitForSuccessfulSubmission,
        hasDispatchedWhatsapp: function () { return true; },
        isSaved: function () { return true; },
        diagnostics: function () {
            return {
                ok: true,
                version: VERSION,
                registrationRetired: true,
                preservesEntryAnimations: true,
                entered: document.documentElement.dataset.hashcodPlatformEntered === 'true'
            };
        }
    };

    removeRegistrationUi({ keepHandoffRoot: false });
    try {
        window.dispatchEvent(new CustomEvent('hashcod:registration-retired', {
            detail: {
                source: 'platform-registration-form',
                version: VERSION,
                preservesEntryAnimations: true
            }
        }));
    } catch (_) {}
})();