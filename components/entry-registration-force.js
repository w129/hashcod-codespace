(function () {
  'use strict';

  var VERSION = '20260926-restored-direct-gate1';
  if (window.__hashcodEntryRegistrationForceLoaded === VERSION) return;
  window.__hashcodEntryRegistrationForceLoaded = VERSION;

  var scriptSrc = document.currentScript && document.currentScript.src ? document.currentScript.src : '';
  var componentBase = scriptSrc && scriptSrc.lastIndexOf('/') >= 0
    ? scriptSrc.slice(0, scriptSrc.lastIndexOf('/') + 1)
    : '/components/';
  var registrationVersion = VERSION;
  var openingPromise = null;

  function byId(id) { return document.getElementById(id); }
  function sleep(ms) { return new Promise(function (resolve) { window.setTimeout(resolve, ms); }); }

  function loadStyleOnce(id, href, dataName) {
    if (byId(id) || document.querySelector('link[href*="' + href.split('?')[0] + '"]')) return;
    var link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = href;
    if (dataName) link.dataset[dataName] = 'true';
    document.head.appendChild(link);
  }

  function loadScriptOnce(selector, src, dataName) {
    if (document.querySelector(selector)) return;
    var script = document.createElement('script');
    script.src = src;
    script.defer = true;
    if (dataName) script.dataset[dataName] = 'true';
    document.head.appendChild(script);
  }

  function removeStaleRegistrationUi() {
    [
      'hashcodDirectRegistration',
      'hashcodHeroUIColorPicker',
      'hashcodTemporaryAccessDialog',
      'hcCodeModal',
      'hashcodEntryHold'
    ].forEach(function (id) {
      var node = byId(id);
      if (node && node.parentNode) node.parentNode.removeChild(node);
    });

    document.querySelectorAll('.hc-reg-card,.hc-heroui-colorpicker,.hashcod-entry-hold-card').forEach(function (node) {
      if (node && node.parentNode) node.parentNode.removeChild(node);
    });

    document.documentElement.removeAttribute('data-hashcod-direct-registration');
    document.body.classList.remove('hashcod-direct-registration-open', 'boot-locked', 'auth-locked');
  }

  function ensureRegistrationAssets() {
    loadStyleOnce(
      'platformRegistrationStylesheet',
      componentBase + 'platform-registration-form.css?v=' + registrationVersion,
      'hashcodPlatformRegistrationStyle'
    );

    if (!window.HashcodPlatformRegistration) {
      loadScriptOnce(
        'script[data-hashcod-platform-registration],script[src*="platform-registration-form.js"]',
        componentBase + 'platform-registration-form.js?v=' + registrationVersion,
        'hashcodPlatformRegistration'
      );
    }
  }

  async function waitForRegistrationApi() {
    ensureRegistrationAssets();
    for (var attempt = 0; attempt < 120; attempt += 1) {
      var api = window.HashcodPlatformRegistration;
      if (
        api &&
        api.registrationRestored === true &&
        typeof api.mount === 'function' &&
        typeof api.waitForSuccessfulSubmission === 'function' &&
        typeof api.completePlatformEntry === 'function'
      ) {
        return api;
      }
      if (attempt === 20 || attempt === 60) ensureRegistrationAssets();
      await sleep(50);
    }
    throw new Error('Hashcod restored registration API did not load.');
  }

  function setButtonLoading(button, loading) {
    if (!button) return;
    if (!button.dataset.hashcodOriginalText) button.dataset.hashcodOriginalText = button.textContent || 'Enter platform ↵';
    button.disabled = !!loading;
    button.textContent = loading ? 'ABRIENDO REGISTRO' : button.dataset.hashcodOriginalText;
  }

  async function openRestoredRegistration(button) {
    if (openingPromise) return openingPromise;

    openingPromise = (async function () {
      try {
        setButtonLoading(button, true);
        removeStaleRegistrationUi();
        document.documentElement.removeAttribute('data-hashcod-platform-entered');
        document.documentElement.dataset.hashcodFinalEntryScreen = 'true';

        var api = await waitForRegistrationApi();
        var root = api.mount();
        if (!root || !byId('hashcodRegistrationForm')) {
          throw new Error('Hashcod restored registration form was not mounted.');
        }

        setButtonLoading(button, false);
        var result = await api.waitForSuccessfulSubmission();
        await sleep(120);
        await api.completePlatformEntry(
          result && result.temporaryAccess === true
            ? { source: 'temporary-access', temporaryAccess: true, expiresAt: Number(result.expiresAt || 0) }
            : undefined
        );
        return true;
      } catch (error) {
        console.error('[Hashcod direct registration gate] failed:', error);
        setButtonLoading(button, false);
        window.alert('No se pudo abrir el registro. Recarga la página e inténtalo otra vez.');
        return false;
      } finally {
        openingPromise = null;
      }
    })();

    return openingPromise;
  }

  function markGateReady() {
    window.__hashcodPlatformEntryHoldReady = true;
    document.documentElement.dataset.hashcodEntryGateReady = 'true';
    try {
      window.dispatchEvent(new CustomEvent('hashcod:entry-gate-ready', {
        detail: {
          source: 'entry-registration-force',
          version: VERSION,
          mode: 'direct-restored',
          registration: 'restored',
          preservesEntryAnimations: true
        }
      }));
    } catch (_) {}
  }

  function installButtonGate() {
    var buttons = Array.prototype.slice.call(document.querySelectorAll('#bootCliEnter,#hashcodEntryForceButton'));
    if (!buttons.length) return false;

    buttons.forEach(function (button) {
      if (button.dataset.hashcodRestoredDirectGate === VERSION) return;
      button.dataset.hashcodRestoredDirectGate = VERSION;
      button.addEventListener('click', function (event) {
        if (document.documentElement.dataset.hashcodPlatformEntered === 'true') return;
        event.preventDefault();
        event.stopPropagation();
        if (typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
        openRestoredRegistration(button);
      }, true);
    });

    markGateReady();
    return true;
  }

  function boot() {
    removeStaleRegistrationUi();
    ensureRegistrationAssets();

    if (!installButtonGate()) {
      var observer = new MutationObserver(function () {
        if (installButtonGate()) observer.disconnect();
      });
      observer.observe(document.documentElement, { childList: true, subtree: true });
      var timer = window.setInterval(function () {
        if (installButtonGate()) {
          window.clearInterval(timer);
          observer.disconnect();
        }
      }, 150);
      window.setTimeout(function () {
        window.clearInterval(timer);
        try { observer.disconnect(); } catch (_) {}
      }, 12000);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }

  window.HashcodDirectRegistration = {
    version: VERSION,
    mode: 'direct-restored',
    registrationRestored: true,
    registrationRetired: false,
    preservesEntryAnimations: true,
    cleanup: removeStaleRegistrationUi,
    open: function () {
      return openRestoredRegistration(byId('bootCliEnter') || byId('hashcodEntryForceButton'));
    }
  };
})();
