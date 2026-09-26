(function () {
  'use strict';

  const HOLD_RUNTIME_VERSION = '20260926-registration-restored-fast1';
  if (window.__hashcodPlatformEntryHoldLoadedVersion === HOLD_RUNTIME_VERSION) return;
  window.__hashcodPlatformEntryHoldLoaded = true;
  window.__hashcodPlatformEntryHoldLoadedVersion = HOLD_RUNTIME_VERSION;

  const SCRIPT_SRC = document.currentScript && document.currentScript.src ? document.currentScript.src : '';
  const COMPONENT_BASE = SCRIPT_SRC && SCRIPT_SRC.lastIndexOf('/') >= 0
    ? SCRIPT_SRC.slice(0, SCRIPT_SRC.lastIndexOf('/') + 1)
    : '/components/';
  const REGISTRATION_VERSION = '20260926-registration-restored-fast1';
  let openingPromise = null;

  function sleep(ms) {
    return new Promise(function (resolve) { window.setTimeout(resolve, ms); });
  }

  function loadCssOnce(id, href, datasetName) {
    if (document.getElementById(id) || document.querySelector('link[href*="' + href.split('?')[0] + '"]')) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = href;
    if (datasetName) link.dataset[datasetName] = 'true';
    document.head.appendChild(link);
  }

  function loadScriptOnce(selector, src, datasetName) {
    if (document.querySelector(selector)) return;
    const script = document.createElement('script');
    script.src = src;
    script.defer = true;
    if (datasetName) script.dataset[datasetName] = 'true';
    document.head.appendChild(script);
  }

  function ensureRegistrationAssets() {
    loadCssOnce(
      'platformRegistrationStylesheet',
      COMPONENT_BASE + 'platform-registration-form.css?v=' + REGISTRATION_VERSION,
      'hashcodPlatformRegistrationStyle'
    );

    if (!window.HashcodPlatformRegistration) {
      loadScriptOnce(
        'script[data-hashcod-platform-registration],script[src*="platform-registration-form.js"]',
        COMPONENT_BASE + 'platform-registration-form.js?v=' + REGISTRATION_VERSION,
        'hashcodPlatformRegistration'
      );
    }
  }

  async function waitForRegistrationApi() {
    ensureRegistrationAssets();
    for (let attempt = 0; attempt < 160; attempt += 1) {
      const registration = window.HashcodPlatformRegistration;
      if (
        registration &&
        registration.registrationRestored === true &&
        typeof registration.mount === 'function' &&
        typeof registration.waitForSuccessfulSubmission === 'function' &&
        typeof registration.completePlatformEntry === 'function'
      ) {
        return registration;
      }
      if (attempt === 30 || attempt === 80) ensureRegistrationAssets();
      await sleep(50);
    }
    throw new Error('No se pudo cargar el formulario restaurado de Hashcod.');
  }

  function clearFrozenEntryLayers() {
    const hold = document.getElementById('hashcodEntryHold');
    if (hold && hold.parentNode) hold.parentNode.removeChild(hold);
    document.documentElement.removeAttribute('data-hashcod-direct-registration');
    document.body.classList.remove('hashcod-direct-registration-open', 'boot-locked', 'auth-locked');
  }

  async function openRegistration(original, context, args) {
    if (openingPromise) return openingPromise;

    openingPromise = (async function () {
      const enterButton = document.getElementById('bootCliEnter');
      const originalText = enterButton ? enterButton.textContent : '';
      if (enterButton) {
        enterButton.disabled = true;
        enterButton.textContent = 'ABRIENDO REGISTRO';
      }

      try {
        clearFrozenEntryLayers();
        document.documentElement.removeAttribute('data-hashcod-platform-entered');
        document.documentElement.dataset.hashcodFinalEntryScreen = 'true';

        const registration = await waitForRegistrationApi();
        const root = registration.mount();
        if (!root || !document.getElementById('hashcodRegistrationForm')) {
          throw new Error('El formulario restaurado no se montó correctamente.');
        }

        if (enterButton) {
          enterButton.disabled = false;
          enterButton.textContent = originalText || 'Enter platform ↵';
        }

        const result = await registration.waitForSuccessfulSubmission();
        await sleep(120);
        await registration.completePlatformEntry(
          result && result.temporaryAccess === true
            ? {
                source: 'temporary-access',
                temporaryAccess: true,
                expiresAt: Number(result.expiresAt || 0)
              }
            : undefined
        );
        return true;
      } catch (error) {
        console.error('[Hashcod entry hold] restored registration failed:', error);
        if (enterButton) {
          enterButton.disabled = false;
          enterButton.textContent = originalText || 'Enter platform ↵';
        }
        window.alert('No se pudo abrir el registro. Recarga la página e inténtalo otra vez.');
        return false;
      } finally {
        openingPromise = null;
      }
    })();

    return openingPromise;
  }

  function markGateReady() {
    const wasReady = window.__hashcodPlatformEntryHoldReady === true;
    window.__hashcodPlatformEntryHoldReady = true;
    document.documentElement.dataset.hashcodEntryGateReady = 'true';
    if (!wasReady) {
      try {
        window.dispatchEvent(new CustomEvent('hashcod:entry-gate-ready', {
          detail: { source: 'platform-entry-hold', version: HOLD_RUNTIME_VERSION, registration: 'restored' }
        }));
      } catch (_) {}
    }
  }

  function installDirectButtonGate() {
    const button = document.getElementById('bootCliEnter');
    if (!button) return false;
    if (button.dataset.hashcodEntryGateVersion === HOLD_RUNTIME_VERSION) {
      markGateReady();
      return true;
    }

    button.dataset.hashcodEntryGateVersion = HOLD_RUNTIME_VERSION;
    button.addEventListener('click', function (event) {
      if (document.documentElement.dataset.hashcodPlatformEntered === 'true') return;
      event.preventDefault();
      event.stopPropagation();
      if (typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
      openRegistration(function () { return true; }, window, []);
    }, true);

    markGateReady();
    return true;
  }

  function installLegacyWrapper() {
    const current = window.l8EnterPlatform;
    if (typeof current !== 'function') return false;
    if (current.__hashcodHoldWrapped === true && current.__hashcodHoldVersion === HOLD_RUNTIME_VERSION) return true;
    const original = current.__hashcodHoldOriginal || current.__hashcodMotionOriginal || current;
    const wrapped = function () {
      return openRegistration(original, this, arguments);
    };
    Object.defineProperty(wrapped, '__hashcodHoldWrapped', { value: true });
    Object.defineProperty(wrapped, '__hashcodHoldVersion', { value: HOLD_RUNTIME_VERSION });
    Object.defineProperty(wrapped, '__hashcodHoldOriginal', { value: original });
    window.l8EnterPlatform = wrapped;
    return true;
  }

  function install() {
    const directReady = installDirectButtonGate();
    installLegacyWrapper();
    return directReady;
  }

  if (!install()) {
    const observer = new MutationObserver(function () {
      if (install()) observer.disconnect();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    const timer = window.setInterval(function () {
      if (install()) {
        window.clearInterval(timer);
        observer.disconnect();
      }
    }, 250);
  }
})();