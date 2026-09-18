(function () {
    'use strict';

    if (window.__hashcodLegacyAuthRetirementLoaded) return;
    window.__hashcodLegacyAuthRetirementLoaded = true;

    // Browser diagnostics may explicitly opt into the retired UI so component
    // regression tests can keep exercising its old tool mount points.
    if (window.__hashcodAllowLegacyAuthDiagnostics === true) {
        const prehide = document.getElementById('hashcod-legacy-auth-prehide');
        if (prehide) prehide.remove();
        return;
    }

    window.__hashcodLegacyAuthRetired = true;

    const RETIRED_SELECTORS = [
        '#authOverlay',
        '#authWrapper',
        '#hashcodVectorTray',
        '#hashcodAuthUtilityDock',
        '#groqAuthChatPanel',
        '#groqAuthChatLauncher',
        '#hashcodEftCodeKeyGate',
        '#hashcodEfrHotzone',
        '#cryptoCardValidationLauncherBtn',
        '#d5LauncherBtn',
        '[data-hashcod-auth-utility-dock]'
    ];

    function hideNode(node) {
        if (!node) return;
        node.hidden = true;
        node.setAttribute('aria-hidden', 'true');
        node.setAttribute('data-hashcod-retired-auth-ui', 'true');
        node.style.setProperty('display', 'none', 'important');
        node.style.setProperty('visibility', 'hidden', 'important');
        node.style.setProperty('opacity', '0', 'important');
        node.style.setProperty('pointer-events', 'none', 'important');
    }

    function unlockPlatform() {
        const body = document.body;
        if (body) {
            body.classList.remove('auth-locked', 'boot-locked');
            body.removeAttribute('data-auth-locked');
            body.removeAttribute('aria-busy');
        }

        const root = document.documentElement;
        root.dataset.hashcodLegacyAuthRetired = 'true';
        root.classList.remove('auth-locked', 'boot-locked');
    }

    function retireLegacyAuthUi() {
        RETIRED_SELECTORS.forEach(function (selector) {
            document.querySelectorAll(selector).forEach(hideNode);
        });
        unlockPlatform();

        const prehide = document.getElementById('hashcod-legacy-auth-prehide');
        if (prehide) prehide.remove();

        window.dispatchEvent(new CustomEvent('hashcod:legacy-auth-retired'));
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', retireLegacyAuthUi, { once: true });
    } else {
        retireLegacyAuthUi();
    }

    window.addEventListener('load', retireLegacyAuthUi, { once: true });

    // On the third screen the old authentication document is not merely hidden:
    // it is removed so legacy CSS or delayed scripts cannot resurrect it.
    window.addEventListener('hashcod:final-entry-screen', function (event) {
        if (event.detail && Number(event.detail.screen) !== 3) return;
        RETIRED_SELECTORS.forEach(function (selector) {
            document.querySelectorAll(selector).forEach(function (node) {
                try { node.remove(); } catch (_) { hideNode(node); }
            });
        });
    });

    // Some legacy auth modules mount their DOM after parsing. Only watch for
    // newly inserted nodes; do not watch attributes so diagnostic tests and the
    // future replacement entry system can explicitly control their own UI.
    const retiredSelector = RETIRED_SELECTORS.join(',');

    const observer = new MutationObserver(function (mutations) {
        let needsRetire = false;
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes || []) {
                if (!node || node.nodeType !== 1) continue;
                if (
                    (typeof node.matches === 'function' && node.matches(retiredSelector)) ||
                    (typeof node.querySelector === 'function' && node.querySelector(retiredSelector))
                ) {
                    needsRetire = true;
                    break;
                }
            }
            if (needsRetire) break;
        }
        if (needsRetire) retireLegacyAuthUi();
    });

    observer.observe(document.documentElement, { childList: true, subtree: true });

    window.HashcodLegacyAuthRetirement = Object.freeze({
        retire: retireLegacyAuthUi,
        retired: true
    });
})();