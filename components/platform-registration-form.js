(function () {
    'use strict';

    const VERSION = '20260925-registration-retired';
    if (window.__hashcodPlatformRegistrationLoaded === VERSION) return;
    window.__hashcodPlatformRegistrationLoaded = VERSION;

    const REMOVED_IDS = [
        'hashcodPlatformRegistration',
        'hashcodDirectRegistration',
        'hashcodHeroUIColorPicker',
        'hashcodTemporaryAccessDialog',
        'hcCodeModal'
    ];

    function removeRegistrationUi() {
        REMOVED_IDS.forEach(function (id) {
            const node = document.getElementById(id);
            if (node && node.parentNode) node.parentNode.removeChild(node);
        });
        document.querySelectorAll(
            '.hashcod-registration-shell,.hashcod-registration-card,.hashcod-registration-form,.hc-reg-card,.hc-heroui-colorpicker'
        ).forEach(function (node) {
            if (node && node.parentNode) node.parentNode.removeChild(node);
        });
    }

    async function completePlatformEntry() {
        removeRegistrationUi();
        document.documentElement.dataset.hashcodPlatformEntered = 'true';
        document.documentElement.removeAttribute('data-hashcod-final-entry-screen');
        document.documentElement.removeAttribute('data-hashcod-direct-registration');
        document.body.classList.remove('hashcod-direct-registration-open', 'auth-locked', 'boot-locked');
        try {
            window.dispatchEvent(new CustomEvent('hashcod:platform-entered', {
                detail: { source: 'platform-registration-form', version: VERSION, registration: 'retired' }
            }));
        } catch (_) {}
        return true;
    }

    async function waitForSuccessfulSubmission() {
        return completePlatformEntry();
    }

    function mount() {
        return completePlatformEntry();
    }

    window.HashcodPlatformRegistration = {
        version: VERSION,
        registrationRetired: true,
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
                entered: document.documentElement.dataset.hashcodPlatformEntered === 'true'
            };
        }
    };

    removeRegistrationUi();
    try {
        window.dispatchEvent(new CustomEvent('hashcod:registration-retired', {
            detail: { source: 'platform-registration-form', version: VERSION }
        }));
    } catch (_) {}
})();
