(function () {
  'use strict';

  var VERSION = '20260926-nofreeze-gate1';
  if (window.__hashcodEntryRegistrationForceLoaded === VERSION) return;
  window.__hashcodEntryRegistrationForceLoaded = VERSION;

  var scriptSrc = document.currentScript && document.currentScript.src ? document.currentScript.src : '';
  var componentBase = scriptSrc && scriptSrc.lastIndexOf('/') >= 0
    ? scriptSrc.slice(0, scriptSrc.lastIndexOf('/') + 1)
    : '/components/';
  var openingPromise = null;

  function byId(id) { return document.getElementById(id); }
  function sleep(ms) { return new Promise(function (resolve) { window.setTimeout(resolve, ms); }); }
  function removeNode(node) { if (node && node.parentNode) node.parentNode.removeChild(node); }

  function loadStyleOnce(id, href, dataName) {
    if (byId(id) || document.querySelector('link[href*="' + href.split('?')[0] + '"]')) return;
    var link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = href;
    if (dataName) link.dataset[dataName] = 'true';
    document.head.appendChild(link);
  }

  function removeOldRegistrationScripts() {
    document.querySelectorAll('script[data-hashcod-platform-registration],script[src*="platform-registration-form.js"]').forEach(removeNode);
  }

  function loadRegistrationScript(forceReload) {
    return new Promise(function (resolve, reject) {
      var currentApi = window.HashcodPlatformRegistration;
      var validApi = currentApi &&
        currentApi.registrationRestored === true &&
        typeof currentApi.mount === 'function' &&
        typeof currentApi.waitForSuccessfulSubmission === 'function' &&
        typeof currentApi.completePlatformEntry === 'function';

      if (validApi && !forceReload) {
        resolve(currentApi);
        return;
      }

      if (forceReload || (currentApi && currentApi.registrationRestored !== true)) {
        try { delete window.HashcodPlatformRegistration; } catch (_) { window.HashcodPlatformRegistration = null; }
        removeOldRegistrationScripts();
      }

      loadStyleOnce(
        'platformRegistrationStylesheet',
        componentBase + 'platform-registration-form.css?v=' + VERSION,
        'hashcodPlatformRegistrationStyle'
      );

      var existing = document.querySelector('script[data-hashcod-platform-registration],script[src*="platform-registration-form.js"]');
      if (existing && !forceReload) {
        resolve(window.HashcodPlatformRegistration || null);
        return;
      }

      var script = document.createElement('script');
      script.src = componentBase + 'platform-registration-form.js?v=' + VERSION;
      script.async = false;
      script.dataset.hashcodPlatformRegistration = 'true';
      script.onload = function () { resolve(window.HashcodPlatformRegistration || null); };
      script.onerror = function () { reject(new Error('No se pudo cargar platform-registration-form.js')); };
      document.head.appendChild(script);
    });
  }

  async function waitForRegistrationApi() {
    for (var attempt = 0; attempt < 100; attempt += 1) {
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

      if (attempt === 0) await loadRegistrationScript(false);
      if (attempt === 20 || attempt === 55) await loadRegistrationScript(true);
      await sleep(50);
    }
    throw new Error('Hashcod restored registration API did not load.');
  }

  function clearStaleUi() {
    [
      'hashcodDirectRegistration',
      'hashcodHeroUIColorPicker',
      'hashcodTemporaryAccessDialog',
      'hcCodeModal',
      'hashcodEntryHold'
    ].forEach(function (id) { removeNode(byId(id)); });

    document.querySelectorAll('.hc-reg-card,.hc-heroui-colorpicker,.hashcod-entry-hold-card').forEach(removeNode);
    document.documentElement.removeAttribute('data-hashcod-direct-registration');
    document.body.classList.remove('hashcod-direct-registration-open', 'boot-locked', 'auth-locked');
  }

  function setButtonBusy(button, busy) {
    if (!button) return;
    if (!button.dataset.hashcodOriginalText) button.dataset.hashcodOriginalText = button.textContent || 'Enter platform ↵';
    button.setAttribute('aria-busy', busy ? 'true' : 'false');
    button.textContent = busy ? 'ABRIENDO REGISTRO...' : button.dataset.hashcodOriginalText;
    button.disabled = false;
  }

  function showSoftError(message) {
    console.error('[Hashcod restored registration gate]', message);
    try {
      var status = byId('hashcodEntryGateStatus') || document.createElement('div');
      status.id = 'hashcodEntryGateStatus';
      status.textContent = 'No se pudo abrir el registro. Recarga la página e inténtalo otra vez.';
      status.style.cssText = 'position:fixed;right:24px;bottom:92px;z-index:2147483647;background:#111;color:#fff;border:1px solid rgba(255,255,255,.18);border-radius:14px;padding:12px 14px;font:700 13px system-ui;box-shadow:0 18px 50px rgba(0,0,0,.25)';
      document.body.appendChild(status);
      window.setTimeout(function () { removeNode(status); }, 5000);
    } catch (_) {}
  }

  async function openRestoredRegistration(button) {
    if (openingPromise) return openingPromise;

    openingPromise = (async function () {
      try {
        setButtonBusy(button, true);
        clearStaleUi();
        document.documentElement.removeAttribute('data-hashcod-platform-entered');
        document.documentElement.dataset.hashcodFinalEntryScreen = 'true';

        var api = await waitForRegistrationApi();
        var root = api.mount();

        if (!root || !byId('hashcodRegistrationForm')) {
          throw new Error('Hashcod restored registration form was not mounted.');
        }

        setButtonBusy(button, false);

        var result = await api.waitForSuccessfulSubmission();
        await sleep(120);
        await api.completePlatformEntry(
          result && result.temporaryAccess === true
            ? { source: 'temporary-access', temporaryAccess: true, expiresAt: Number(result.expiresAt || 0) }
            : undefined
        );
        return true;
      } catch (error) {
        setButtonBusy(button, false);
        showSoftError(error && error.message ? error.message : error);
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
          mode: 'single-restored-gate',
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
      button.disabled = false;
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
    clearStaleUi();
    loadRegistrationScript(false).catch(function () {});
    if (!installButtonGate()) {
      var observer = new MutationObserver(function () {
        if (installButtonGate()) observer.disconnect();
      });
      observer.observe(document.documentElement, { childList: true, subtree: true });
      var timer = window.setInterval(function () {
        if (installButtonGate()) {
          window.clearInterval(timer);
          try { observer.disconnect(); } catch (_) {}
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
    mode: 'single-restored-gate',
    registrationRestored: true,
    registrationRetired: false,
    preservesEntryAnimations: true,
    cleanup: clearStaleUi,
    open: function () {
      return openRestoredRegistration(byId('bootCliEnter') || byId('hashcodEntryForceButton'));
    }
  };
})();
