(function () {
  'use strict';

  if (window.__hashcodEntryRegistrationForceLoaded) return;
  window.__hashcodEntryRegistrationForceLoaded = true;

  const COMPONENT_BASE = (function () {
    const current = document.currentScript;
    const src = current && current.src ? current.src : '';
    return src && src.lastIndexOf('/') >= 0 ? src.slice(0, src.lastIndexOf('/') + 1) : '/components/';
  })();

  function ensureStyles() {
    if (document.getElementById('hashcodEntryRegistrationForceStyles')) return;
    const style = document.createElement('style');
    style.id = 'hashcodEntryRegistrationForceStyles';
    style.textContent = [
      '#hashcodEntryForceButton{position:fixed!important;left:50%!important;bottom:max(74px,calc(env(safe-area-inset-bottom,0px) + 42px))!important;transform:translateX(-50%)!important;z-index:2147483640!important;display:inline-flex!important;visibility:visible!important;opacity:1!important;align-items:center!important;justify-content:center!important;gap:10px!important;min-width:240px!important;min-height:50px!important;padding:0 20px!important;border:1px solid #111!important;border-radius:10px!important;background:#111!important;color:#fff!important;font:800 11px/1 "IBM Plex Mono",Consolas,monospace!important;letter-spacing:.06em!important;text-transform:uppercase!important;box-shadow:0 14px 34px rgba(0,0,0,.18)!important;cursor:pointer!important;pointer-events:auto!important;}',
      '#hashcodEntryForceButton:hover{transform:translateX(-50%) translateY(-1px)!important;box-shadow:0 18px 42px rgba(0,0,0,.22)!important;}',
      '#hashcodEntryForceButton:disabled{opacity:.64!important;cursor:wait!important;}',
      '#hashcodEntryHold .hashcod-hold-cta-wrap{position:fixed!important;left:50%!important;bottom:max(74px,calc(env(safe-area-inset-bottom,0px) + 42px))!important;transform:translateX(-50%)!important;z-index:2147483639!important;display:flex!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important;}',
      '#hashcodEntryHold #hashcodHoldContinue{display:inline-flex!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important;min-width:240px!important;min-height:50px!important;background:#111!important;color:#fff!important;border:1px solid #111!important;border-radius:10px!important;font:800 11px/1 "IBM Plex Mono",Consolas,monospace!important;letter-spacing:.06em!important;text-transform:uppercase!important;align-items:center!important;justify-content:center!important;gap:10px!important;}',
      'html[data-hashcod-final-entry-screen="true"] #hashcodEntryForceButton,html[data-hashcod-final-entry-screen="true"] #hashcodEntryHold .hashcod-hold-cta-wrap{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important;}',
      '@media(max-width:620px){#hashcodEntryForceButton,#hashcodEntryHold #hashcodHoldContinue{min-width:0!important;width:calc(100vw - 36px)!important;bottom:max(42px,calc(env(safe-area-inset-bottom,0px) + 22px))!important;}}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function isEntrySloganVisible() {
    if (document.documentElement.dataset.hashcodFinalEntryScreen === 'true') return false;
    if (document.getElementById('hashcodEntryHold')) return true;
    if (document.querySelector('.hashcod-hold-slogan')) return true;
    const text = document.body ? String(document.body.textContent || '') : '';
    return text.indexOf('One world, one epoca, one empire') >= 0;
  }

  function ensureRegistrationAssets() {
    if (!document.querySelector('link[data-hashcod-platform-registration-style],link[href*="platform-registration-form.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = COMPONENT_BASE + 'platform-registration-form.css?v=20260922-force1';
      link.dataset.hashcodPlatformRegistrationStyle = 'true';
      document.head.appendChild(link);
    }

    if (!window.HashcodPlatformRegistration && !document.querySelector('script[data-hashcod-platform-registration-force]')) {
      const script = document.createElement('script');
      script.src = COMPONENT_BASE + 'platform-registration-form.js?v=20260922-force1';
      script.defer = true;
      script.dataset.hashcodPlatformRegistrationForce = 'true';
      document.head.appendChild(script);
    }
  }

  function revealRegistration() {
    ensureStyles();
    ensureRegistrationAssets();
    document.documentElement.dataset.hashcodFinalEntryScreen = 'true';
    document.documentElement.removeAttribute('data-hashcod-platform-entered');

    try {
      window.dispatchEvent(new CustomEvent('hashcod:final-entry-screen', {
        detail: { screen: 3, source: 'entry-registration-force' }
      }));
    } catch (_) {}

    let tries = 0;
    const timer = window.setInterval(function () {
      tries += 1;
      const registration = window.HashcodPlatformRegistration;
      if (registration && typeof registration.mount === 'function') {
        try { registration.mount(); } catch (_) {}
        const hold = document.getElementById('hashcodEntryHold');
        const button = document.getElementById('hashcodEntryForceButton');
        if (button) button.remove();
        if (hold) {
          hold.classList.add('is-revealing');
          window.setTimeout(function () {
            if (hold && hold.parentNode) hold.parentNode.removeChild(hold);
          }, 180);
        }
        window.clearInterval(timer);
        return;
      }
      if (tries === 20 || tries === 60) ensureRegistrationAssets();
      if (tries > 100) {
        window.clearInterval(timer);
        const button = document.getElementById('hashcodEntryForceButton') || document.getElementById('hashcodHoldContinue');
        if (button) {
          button.disabled = false;
          button.innerHTML = '<span>REINTENTAR REGISTRO</span><span aria-hidden="true">↵</span>';
          document.documentElement.removeAttribute('data-hashcod-final-entry-screen');
        }
      }
    }, 50);
  }

  function ensureForceButton() {
    ensureStyles();
    if (!isEntrySloganVisible()) return false;

    const existing = document.getElementById('hashcodHoldContinue');
    if (existing) {
      existing.hidden = false;
      existing.removeAttribute('hidden');
      existing.disabled = false;
      if (!/continuar|registro|reintentar/i.test(existing.textContent || '')) {
        existing.innerHTML = '<span>CONTINUAR AL REGISTRO</span><span aria-hidden="true">↵</span>';
      }
      return true;
    }

    if (document.getElementById('hashcodEntryForceButton')) return true;
    const button = document.createElement('button');
    button.id = 'hashcodEntryForceButton';
    button.type = 'button';
    button.setAttribute('aria-label', 'Continuar al registro de plataforma de Hashcod');
    button.innerHTML = '<span>CONTINUAR AL REGISTRO</span><span aria-hidden="true">↵</span>';
    (document.body || document.documentElement).appendChild(button);
    return true;
  }

  function onClick(event) {
    const target = event.target;
    const button = target && typeof target.closest === 'function'
      ? target.closest('#hashcodEntryForceButton,#hashcodHoldContinue')
      : null;
    if (!button || !isEntrySloganVisible()) return;
    event.preventDefault();
    event.stopPropagation();
    if (typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
    button.disabled = true;
    button.innerHTML = '<span>ABRIENDO REGISTRO</span><span aria-hidden="true">↵</span>';
    revealRegistration();
  }

  function boot() {
    ensureForceButton();
    [80, 250, 600, 1100, 1800, 2600, 4200, 7000].forEach(function (delay) {
      window.setTimeout(ensureForceButton, delay);
    });
    document.addEventListener('click', onClick, true);
    if (typeof MutationObserver === 'function') {
      const observer = new MutationObserver(ensureForceButton);
      observer.observe(document.documentElement, { childList: true, subtree: true });
      window.addEventListener('hashcod:final-entry-screen', function () { observer.disconnect(); }, { once: true });
      window.addEventListener('hashcod:platform-entered', function () { observer.disconnect(); }, { once: true });
      window.setTimeout(function () { ensureForceButton(); }, 10000);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
