/* Hashcod entry gate · passive no-registration bridge.
   The registration flow is retired. This script must not intercept the Enter
   platform click, disable the button, or stop propagation. It only removes stale
   registration DOM/API leftovers so the original platform entry can run normally. */
(function (window, document) {
  'use strict';

  var VERSION = '20260926-passive-no-form-nofreeze1';
  if (window.__hashcodEntryRegistrationForceLoaded === VERSION) return;
  window.__hashcodEntryRegistrationForceLoaded = VERSION;

  function removeNode(node) {
    if (node && node.parentNode) node.parentNode.removeChild(node);
  }

  function cleanupRegistrationDom() {
    [
      'hashcodPlatformRegistration',
      'hashcodDirectRegistration',
      'hashcodRegistrationCodeReceipt',
      'hashcodHeroUIColorPicker',
      'hcHeroUIDateField',
      'hcBirthDate',
      'hcBirthDay',
      'hcBirthMonth',
      'hcBirthYear',
      'hcAgePill'
    ].forEach(function (id) {
      removeNode(document.getElementById(id));
    });

    document.querySelectorAll(
      '.hashcod-registration-shell,' +
      '.hashcod-registration-overlay,' +
      '.hc-reg-card,' +
      '.hc-pixel-bg,' +
      '.hc-heroui-datefield,' +
      '.hc-heroui-colorpicker'
    ).forEach(removeNode);

    document.documentElement.dataset.hashcodRegistrationRetired = 'true';
    document.documentElement.dataset.hashcodEntryGateReady = 'true';
    document.documentElement.dataset.hashcodFinalEntryScreen = 'false';
    document.documentElement.style.removeProperty('--hashcod-colorpicker-selected');
  }

  function retireRegistrationApis() {
    var retiredApi = {
      version: VERSION,
      retired: true,
      directNoForm: true,
      cleanup: cleanupRegistrationDom,
      open: function () {
        cleanupRegistrationDom();
        return Promise.resolve({ retired: true, skipped: true });
      },
      waitForSubmission: function () {
        return Promise.resolve({ retired: true, skipped: true });
      }
    };

    window.HashcodPlatformRegistration = retiredApi;
    window.HashcodDirectRegistration = retiredApi;
    window.HashcodEntryRegistrationForce = retiredApi;
  }

  function boot() {
    cleanupRegistrationDom();
    retireRegistrationApis();
    try {
      window.dispatchEvent(new CustomEvent('hashcod:entry-gate-ready', {
        detail: {
          source: 'entry-registration-force',
          version: VERSION,
          mode: 'passive-no-form',
          interceptsClick: false
        }
      }));
    } catch (_) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})(window, document);
