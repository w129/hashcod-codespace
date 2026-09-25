(function () {
  'use strict';

  var VERSION = '20260925-direct12-preserve-animations';
  if (window.__hashcodEntryRegistrationForceLoaded === VERSION) return;
  window.__hashcodEntryRegistrationForceLoaded = VERSION;

  function byId(id) { return document.getElementById(id); }

  function removeStaleRegistrationUi() {
    [
      'hashcodDirectRegistration',
      'hashcodHeroUIColorPicker',
      'hashcodTemporaryAccessDialog',
      'hcCodeModal'
    ].forEach(function (id) {
      var node = byId(id);
      if (node && node.parentNode) node.parentNode.removeChild(node);
    });

    document.querySelectorAll('.hc-reg-card,.hc-heroui-colorpicker').forEach(function (node) {
      if (node && node.parentNode) node.parentNode.removeChild(node);
    });

    document.documentElement.removeAttribute('data-hashcod-direct-registration');
    document.body.classList.remove('hashcod-direct-registration-open');
  }

  function markGateReady() {
    window.__hashcodPlatformEntryHoldReady = true;
    document.documentElement.dataset.hashcodEntryGateReady = 'true';
    try {
      window.dispatchEvent(new CustomEvent('hashcod:entry-gate-ready', {
        detail: {
          source: 'entry-registration-force',
          version: VERSION,
          mode: 'passive',
          registration: 'retired',
          preservesEntryAnimations: true
        }
      }));
    } catch (_) {}
  }

  function boot() {
    removeStaleRegistrationUi();
    markGateReady();
    // Important: this bridge is intentionally passive now.
    // The real entry animation remains controlled by platform-entry-hold.js.
    // Do not intercept #bootCliEnter, #hashcodEntryForceButton or #hashcodHoldContinue here.
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }

  window.HashcodDirectRegistration = {
    version: VERSION,
    mode: 'passive',
    registrationRetired: true,
    preservesEntryAnimations: true,
    cleanup: removeStaleRegistrationUi
  };
})();