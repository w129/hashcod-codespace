(function () {
  'use strict';

  const HOLD_RUNTIME_VERSION = '20260926-passive-restored-gate1';
  if (window.__hashcodPlatformEntryHoldLoadedVersion === HOLD_RUNTIME_VERSION) return;

  window.__hashcodPlatformEntryHoldLoaded = true;
  window.__hashcodPlatformEntryHoldLoadedVersion = HOLD_RUNTIME_VERSION;

  function markGateReady() {
    window.__hashcodPlatformEntryHoldReady = true;
    document.documentElement.dataset.hashcodEntryGateReady = 'true';
    try {
      window.dispatchEvent(new CustomEvent('hashcod:entry-gate-ready', {
        detail: {
          source: 'platform-entry-hold',
          version: HOLD_RUNTIME_VERSION,
          mode: 'passive',
          registration: 'delegated-to-entry-registration-force'
        }
      }));
    } catch (_) {}
  }

  function installLegacyDelegate() {
    const current = window.l8EnterPlatform;
    if (typeof current !== 'function') return false;
    if (current.__hashcodPassiveHoldWrapped === true) return true;

    const original = current.__hashcodHoldOriginal || current.__hashcodMotionOriginal || current;
    const wrapped = function () {
      if (
        window.HashcodDirectRegistration &&
        window.HashcodDirectRegistration.registrationRestored === true &&
        typeof window.HashcodDirectRegistration.open === 'function' &&
        document.documentElement.dataset.hashcodPlatformEntered !== 'true'
      ) {
        return window.HashcodDirectRegistration.open();
      }
      return original.apply(this, arguments);
    };

    Object.defineProperty(wrapped, '__hashcodPassiveHoldWrapped', { value: true });
    Object.defineProperty(wrapped, '__hashcodHoldOriginal', { value: original });
    window.l8EnterPlatform = wrapped;
    return true;
  }

  function install() {
    markGateReady();
    installLegacyDelegate();
    return true;
  }

  install();

  const timer = window.setInterval(function () {
    if (installLegacyDelegate()) {
      window.clearInterval(timer);
    }
  }, 250);

  window.setTimeout(function () {
    window.clearInterval(timer);
  }, 12000);
})();
