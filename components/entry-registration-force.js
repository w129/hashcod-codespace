(function () {
  'use strict';

  var VERSION = '20260925-direct11-no-form';
  if (window.__hashcodEntryRegistrationForceLoaded === VERSION) return;
  window.__hashcodEntryRegistrationForceLoaded = VERSION;

  function byId(id) { return document.getElementById(id); }

  function markGateReady() {
    window.__hashcodPlatformEntryHoldReady = true;
    document.documentElement.dataset.hashcodEntryGateReady = 'true';
    try {
      window.dispatchEvent(new CustomEvent('hashcod:entry-gate-ready', {
        detail: { source: 'entry-registration-force', version: VERSION, registration: 'retired' }
      }));
    } catch (_) {}
  }

  function installBackgroundOnlyStyle() {
    if (byId('hashcodDirectRegistrationStyles')) return;
    var style = document.createElement('style');
    style.id = 'hashcodDirectRegistrationStyles';
    style.textContent = [
      '#hashcodDirectRegistration{position:fixed!important;inset:0!important;z-index:2147483645!important;overflow:hidden!important;background-color:#f0f1ef!important;background-image:linear-gradient(rgba(240,241,239,.70),rgba(240,241,239,.70)),linear-gradient(rgba(255,255,255,.48),rgba(255,255,255,.48)),url("/assets/hashcod-registration-pixel-bg.svg?v=20260925-gray1")!important;background-size:cover,cover,cover!important;background-position:center!important;background-repeat:no-repeat!important;color:#111!important;pointer-events:none!important;}',
      '#hashcodDirectRegistration::after{content:"";position:absolute;inset:0;background:radial-gradient(circle at 50% 20%,rgba(255,255,255,.58),rgba(255,255,255,0) 46%),linear-gradient(180deg,rgba(255,255,255,.10),rgba(255,255,255,.40));}',
      'html[data-hashcod-direct-registration="true"] body{background:#f0f1ef!important;}',
      '.hashcod-direct-registration-open #bootCliOverlay,.hashcod-direct-registration-open #hashcodEntryHold,.hashcod-direct-registration-open #hashcodEntryForceButton,.hashcod-direct-registration-open #hashcodHoldContinue{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important}',
      '#hashcodPlatformRegistration,#hashcodHeroUIColorPicker,#hashcodDirectRegistration .hc-reg-card{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important;}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function removeRegistrationArtifacts() {
    [
      'hashcodPlatformRegistration',
      'hashcodHeroUIColorPicker',
      'hashcodTemporaryAccessDialog',
      'hcCodeModal'
    ].forEach(function (id) {
      var node = byId(id);
      if (node && node.parentNode) node.parentNode.removeChild(node);
    });
    document.querySelectorAll('.hashcod-registration-shell,.hashcod-registration-card,.hc-reg-card').forEach(function (node) {
      if (node && node.parentNode) node.parentNode.removeChild(node);
    });
  }

  function showBackgroundOnly() {
    installBackgroundOnlyStyle();
    removeRegistrationArtifacts();
    document.body.classList.add('hashcod-direct-registration-open');
    document.documentElement.dataset.hashcodDirectRegistration = 'true';
    var old = byId('hashcodDirectRegistration');
    if (old && old.parentNode) old.parentNode.removeChild(old);
    var section = document.createElement('section');
    section.id = 'hashcodDirectRegistration';
    section.setAttribute('aria-label', 'Fondo Hashcod Codespace');
    section.dataset.hashcodRegistrationRetired = 'true';
    document.body.appendChild(section);
  }

  function completeEntry() {
    removeRegistrationArtifacts();
    document.documentElement.dataset.hashcodPlatformEntered = 'true';
    document.documentElement.removeAttribute('data-hashcod-final-entry-screen');
    document.documentElement.removeAttribute('data-hashcod-direct-registration');
    document.body.classList.remove('hashcod-direct-registration-open', 'auth-locked', 'boot-locked');

    var bg = byId('hashcodDirectRegistration');
    if (bg && bg.parentNode) bg.parentNode.removeChild(bg);

    try {
      window.dispatchEvent(new CustomEvent('hashcod:platform-entered', {
        detail: { source: 'entry-registration-force', version: VERSION, registration: 'retired' }
      }));
    } catch (_) {}
  }

  function enterPlatform() {
    markGateReady();
    showBackgroundOnly();

    if (window.HashcodPlatformRegistration && typeof window.HashcodPlatformRegistration.completePlatformEntry === 'function') {
      Promise.resolve(window.HashcodPlatformRegistration.completePlatformEntry({ source: 'entry-registration-force', registration: 'retired' }))
        .catch(function () { completeEntry(); });
      return;
    }

    window.setTimeout(completeEntry, 180);
  }

  function onClick(event) {
    var target = event.target;
    var button = target && target.closest ? target.closest('#bootCliEnter,#hashcodEntryForceButton,#hashcodHoldContinue') : null;
    if (!button) return;
    if (document.documentElement.dataset.hashcodPlatformEntered === 'true') return;
    event.preventDefault();
    event.stopPropagation();
    if (event.stopImmediatePropagation) event.stopImmediatePropagation();
    try {
      button.disabled = true;
      button.setAttribute('aria-busy', 'true');
      if (button.textContent) button.textContent = 'ENTRANDO...';
    } catch (_) {}
    enterPlatform();
  }

  function boot() {
    markGateReady();
    installBackgroundOnlyStyle();
    removeRegistrationArtifacts();
    document.addEventListener('click', onClick, true);
    window.addEventListener('hashcod:final-entry-screen', function () { enterPlatform(); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }

  window.HashcodDirectRegistration = {
    version: VERSION,
    open: enterPlatform,
    enterPlatform: enterPlatform,
    registrationRetired: true
  };
})();
