/* Hashcod Codespace · platform entry anti-freeze guard.
   When the legacy authentication UI is retired, Enter Platform must never wait
   on the retired /api/auth/session gate or hand off to hidden registration UI. */
(function (window, document) {
  'use strict';

  var VERSION = '20260926-direct-entry-nofreeze2';
  if (window.__hashcodPlatformEntryFreezeFixVersion === VERSION) return;
  window.__hashcodPlatformEntryFreezeFixVersion = VERSION;

  var entering = false;

  function legacyAuthIsRetired() {
    var root = document.documentElement;
    return window.__hashcodLegacyAuthRetired === true ||
      (root && root.dataset && root.dataset.hashcodLegacyAuthRetired === 'true');
  }

  function dispatch(name, detail) {
    try {
      window.dispatchEvent(new CustomEvent(name, { detail: detail || {} }));
    } catch (_) {}
  }

  function finishDirectEntry(source) {
    if (entering) return true;
    entering = true;

    var root = document.documentElement;
    var body = document.body;
    var overlay = document.getElementById('bootCliOverlay');
    var button = document.getElementById('bootCliEnter');
    var transition = document.getElementById('hashcodEntryTransition');

    if (button) {
      button.disabled = true;
      button.removeAttribute('aria-busy');
      button.dataset.hashcodEntryCompleted = 'true';
    }

    if (transition && transition.parentNode) {
      try { transition.parentNode.removeChild(transition); } catch (_) {}
    }

    if (overlay) {
      overlay.classList.add('hidden');
      overlay.hidden = true;
      overlay.setAttribute('aria-hidden', 'true');
      overlay.style.setProperty('display', 'none', 'important');
      overlay.style.setProperty('pointer-events', 'none', 'important');
    }

    if (body) {
      body.classList.remove('boot-locked', 'auth-locked');
      body.classList.add('hashcod-platform-entered');
      body.removeAttribute('data-auth-locked');
      body.removeAttribute('aria-busy');
    }

    if (root) {
      root.classList.remove('boot-locked', 'auth-locked');
      root.classList.add('hashcod-platform-entered');
      root.dataset.hashcodPlatformEntered = 'true';
      root.dataset.hashcodEntryGateReady = 'true';
      root.dataset.hashcodFinalEntryScreen = 'false';
    }

    try { sessionStorage.setItem('l8_boot_cli_done', '1'); } catch (_) {}

    // Keep the old unlock hook compatible, but run it only after the page has
    // already been made interactive so it can never hold the entry screen open.
    window.setTimeout(function () {
      try {
        if (typeof window.l8UnlockPlatform === 'function') window.l8UnlockPlatform();
      } catch (error) {
        console.warn('[Hashcod entry] Deferred unlock hook failed:', error);
      }
    }, 0);

    dispatch('hashcod:platform-entered', {
      source: source || 'platform-entry-freeze-fix',
      direct: true,
      legacyAuthRetired: true,
      version: VERSION
    });
    dispatch('hashcod:platform-entry-complete', {
      source: source || 'platform-entry-freeze-fix',
      direct: true,
      legacyAuthRetired: true,
      version: VERSION
    });

    return true;
  }

  function getEnterButton(target) {
    return target && typeof target.closest === 'function'
      ? target.closest('#bootCliEnter')
      : null;
  }

  document.addEventListener('click', function (event) {
    var button = getEnterButton(event.target);
    if (!button || !legacyAuthIsRetired()) return;

    event.preventDefault();
    event.stopPropagation();
    if (typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
    finishDirectEntry('click');
  }, true);

  window.addEventListener('keydown', function (event) {
    if (!legacyAuthIsRetired()) return;
    if (event.key !== 'Enter' && event.key !== 'Escape') return;

    var overlay = document.getElementById('bootCliOverlay');
    if (!overlay || overlay.classList.contains('hidden') || overlay.hidden) return;

    event.preventDefault();
    event.stopPropagation();
    if (typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
    finishDirectEntry('keyboard');
  }, true);

  window.HashcodPlatformEntryFreezeFix = Object.freeze({
    version: VERSION,
    enter: finishDirectEntry,
    active: legacyAuthIsRetired
  });
})(window, document);
