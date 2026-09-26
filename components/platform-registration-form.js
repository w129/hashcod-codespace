/* Hashcod platform registration retired.
   The registration form and all of its visual fields are intentionally removed.
   This file keeps the legacy API path alive so older loaders do not block entry. */
(function (window, document) {
  'use strict';

  var VERSION = '20260926-registration-retired-direct-entry1';
  if (window.__hashcodPlatformRegistrationLoaded === VERSION) return;
  window.__hashcodPlatformRegistrationLoaded = VERSION;

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

    document.querySelectorAll('.hashcod-registration-shell,.hashcod-registration-overlay,.hc-reg-card,.hc-pixel-bg,.hc-heroui-datefield,.hc-heroui-colorpicker').forEach(removeNode);

    document.documentElement.dataset.hashcodFinalEntryScreen = 'false';
    document.documentElement.dataset.hashcodRegistrationRetired = 'true';
    document.documentElement.style.removeProperty('--hashcod-colorpicker-selected');
  }

  function dispatch(name, detail) {
    try {
      window.dispatchEvent(new CustomEvent(name, { detail: detail || {} }));
    } catch (_) {}
  }

  function completePlatformEntry() {
    cleanupRegistrationDom();
    document.documentElement.dataset.hashcodPlatformEntered = 'true';
    document.documentElement.dataset.hashcodEntryGateReady = 'true';
    document.documentElement.classList.add('hashcod-platform-entered');
    document.body.classList.add('hashcod-platform-entered');
    dispatch('hashcod:platform-entry-complete', { retired: true, direct: true });
    dispatch('hashcod:registration-retired', { retired: true, direct: true });
    return Promise.resolve({ ok: true, retired: true, direct: true });
  }

  window.HashcodPlatformRegistration = {
    version: VERSION,
    registrationRestored: false,
    registrationRetired: true,
    formRemoved: true,
    mount: completePlatformEntry,
    open: completePlatformEntry,
    start: completePlatformEntry,
    completePlatformEntry: completePlatformEntry,
    cleanup: cleanupRegistrationDom
  };

  cleanupRegistrationDom();
  document.documentElement.dataset.hashcodEntryGateReady = 'true';
})(window, document);
