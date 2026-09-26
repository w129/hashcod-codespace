/* Hashcod entry gate · direct entry without registration form.
   The registration flow is retired; this bridge prevents stale form scripts from
   freezing the landing screen and makes Enter platform deterministic. */
(function (window, document) {
  'use strict';

  var VERSION = '20260926-direct-entry-no-form1';
  if (window.__hashcodEntryRegistrationForceLoaded === VERSION) return;
  window.__hashcodEntryRegistrationForceLoaded = VERSION;

  var busy = false;

  function byId(id) { return document.getElementById(id); }
  function removeNode(node) { if (node && node.parentNode) node.parentNode.removeChild(node); }

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

    document.documentElement.dataset.hashcodRegistrationRetired = 'true';
    document.documentElement.dataset.hashcodFinalEntryScreen = 'false';
    document.documentElement.style.removeProperty('--hashcod-colorpicker-selected');
  }

  function dispatch(name, detail) {
    try {
      window.dispatchEvent(new CustomEvent(name, { detail: detail || {} }));
    } catch (_) {}
  }

  function markEntered() {
    cleanupRegistrationDom();
    document.documentElement.dataset.hashcodPlatformEntered = 'true';
    document.documentElement.dataset.hashcodEntryGateReady = 'true';
    document.documentElement.classList.add('hashcod-platform-entered');
    if (document.body) document.body.classList.add('hashcod-platform-entered');
    dispatch('hashcod:platform-entry-complete', { retired: true, direct: true });
    dispatch('hashcod:registration-retired', { retired: true, direct: true });
  }

  function restoreButton(button) {
    if (!button) return;
    button.disabled = false;
    button.removeAttribute('aria-busy');
    if (button.dataset.hashcodOriginalText) {
      button.textContent = button.dataset.hashcodOriginalText;
    }
  }

  function findEntryButton() {
    return byId('bootCliEnter') || byId('hashcodEntryForceButton') || document.querySelector('[data-hashcod-entry-button], .boot-cli-enter, button[aria-label*="Enter"], button');
  }

  function enterDirectly(button) {
    if (busy) return;
    busy = true;

    if (button) {
      if (!button.dataset.hashcodOriginalText) button.dataset.hashcodOriginalText = button.textContent || 'Enter platform ↵';
      button.disabled = true;
      button.setAttribute('aria-busy', 'true');
      button.textContent = 'ENTRANDO...';
    }

    window.setTimeout(function () {
      try {
        if (window.HashcodPlatformRegistration && typeof window.HashcodPlatformRegistration.cleanup === 'function') {
          window.HashcodPlatformRegistration.cleanup();
        }
        markEntered();
      } catch (error) {
        console.error('[hashcod] direct entry failed', error);
        restoreButton(button);
      } finally {
        busy = false;
      }
    }, 0);
  }

  function installButtonGate() {
    var button = findEntryButton();
    if (!button) return false;
    if (button.dataset.hashcodDirectEntryNoForm === VERSION) return true;

    button.dataset.hashcodDirectEntryNoForm = VERSION;
    button.disabled = false;
    button.removeAttribute('aria-busy');

    button.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopPropagation();
      if (typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
      enterDirectly(button);
    }, true);

    document.documentElement.dataset.hashcodEntryGateReady = 'true';
    dispatch('hashcod:entry-gate-ready', { retired: true, direct: true });
    return true;
  }

  function boot() {
    cleanupRegistrationDom();
    if (installButtonGate()) return;

    var attempts = 0;
    var timer = window.setInterval(function () {
      attempts += 1;
      cleanupRegistrationDom();
      if (installButtonGate() || attempts > 80) {
        window.clearInterval(timer);
      }
    }, 100);
  }

  window.HashcodEntryRegistrationForce = {
    version: VERSION,
    directNoForm: true,
    installButtonGate: installButtonGate,
    enterDirectly: function () { enterDirectly(findEntryButton()); },
    cleanup: cleanupRegistrationDom
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})(window, document);
