(function () {
  'use strict';

  const VERSION = '20260922-direct3-isolated';
  if (window.__hashcodEntryRegistrationForceLoaded === VERSION) return;
  window.__hashcodEntryRegistrationForceLoaded = VERSION;

  function installStyles() {
    let style = document.getElementById('hashcodEntryRegistrationForceStyles');
    if (style) style.remove();
    style = document.createElement('style');
    style.id = 'hashcodEntryRegistrationForceStyles';
    style.textContent = [
      '#hashcodHoldContinue{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important;}',
      '#hashcodEntryForceButton{position:fixed!important;left:50%!important;bottom:max(74px,calc(env(safe-area-inset-bottom,0px) + 42px))!important;transform:translateX(-50%)!important;z-index:2147483646!important;display:inline-flex!important;visibility:visible!important;opacity:1!important;align-items:center!important;justify-content:center!important;gap:10px!important;min-width:248px!important;min-height:52px!important;padding:0 22px!important;border:1px solid #111!important;border-radius:10px!important;background:#111!important;color:#fff!important;font:900 11px/1 "IBM Plex Mono",Consolas,monospace!important;letter-spacing:.06em!important;text-transform:uppercase!important;box-shadow:0 14px 34px rgba(0,0,0,.18)!important;cursor:pointer!important;pointer-events:auto!important;}',
      '#hashcodEntryForceButton[aria-busy="true"]{opacity:.74!important;cursor:wait!important;}',
      'html[data-hashcod-direct-registration="true"] #hashcodEntryForceButton{display:none!important;visibility:hidden!important;pointer-events:none!important;}',
      '#hashcodDirectRegistration{position:fixed!important;inset:0!important;z-index:2147483645!important;display:grid!important;place-items:center!important;background:#f6f6f3!important;background-image:linear-gradient(rgba(20,20,20,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(20,20,20,.045) 1px,transparent 1px)!important;background-size:38px 38px!important;color:#111!important;font-family:"IBM Plex Mono",Consolas,monospace!important;pointer-events:auto!important;}',
      '#hashcodDirectRegistration *{box-sizing:border-box;}',
      '.hashcod-direct-card{width:min(760px,calc(100vw - 36px));max-height:calc(100vh - 36px);overflow:auto;background:#fff;border:1px solid #bdbdb8;border-radius:14px;box-shadow:0 24px 70px rgba(0,0,0,.18);padding:24px;}',
      '.hashcod-direct-card h2{margin:0 0 8px;font:900 24px/1.1 "IBM Plex Mono",Consolas,monospace;letter-spacing:-.04em;}',
      '.hashcod-direct-card p{margin:0 0 16px;color:#555;line-height:1.55;font-size:13px;}',
      '.hashcod-direct-prices{border:1px solid #d8d8d3;border-radius:10px;background:#fafaf8;padding:12px;margin:14px 0;display:grid;gap:8px;font-size:12px;}',
      '.hashcod-direct-prices div{display:flex;justify-content:space-between;gap:16px;border-bottom:1px solid #e8e8e2;padding-bottom:8px;}',
      '.hashcod-direct-prices div:last-child{border-bottom:0;padding-bottom:0;}',
      '.hashcod-direct-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:16px 0;}',
      '.hashcod-direct-field{display:grid;gap:6px;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:.05em;color:#333;}',
      '.hashcod-direct-field input{height:42px;border:1px solid #bdbdb8;border-radius:8px;padding:0 12px;font:600 14px/1 "IBM Plex Mono",Consolas,monospace;color:#111;background:#fbfbf9;}',
      '.hashcod-direct-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:16px;}',
      '.hashcod-direct-actions button{height:44px;border-radius:8px;border:1px solid #111;padding:0 16px;font:900 11px/1 "IBM Plex Mono",Consolas,monospace;letter-spacing:.05em;text-transform:uppercase;cursor:pointer;}',
      '.hashcod-direct-submit{background:#111;color:#fff;}',
      '.hashcod-direct-cancel{background:#fff;color:#111;}',
      '.hashcod-direct-status{min-height:20px;margin-top:10px;font-size:12px;color:#555;}',
      '@media(max-width:720px){.hashcod-direct-grid{grid-template-columns:1fr}.hashcod-direct-card{padding:18px}.hashcod-direct-prices div{display:grid;gap:4px}}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function entryScreenVisible() {
    if (document.documentElement.dataset.hashcodDirectRegistration === 'true') return false;
    if (document.documentElement.dataset.hashcodPlatformEntered === 'true') return false;
    return Boolean(
      document.getElementById('hashcodEntryHold') ||
      document.querySelector('.hashcod-hold-slogan') ||
      ((document.body && document.body.textContent || '').indexOf('One world, one epoca, one empire') >= 0)
    );
  }

  function removeEntryHold() {
    const hold = document.getElementById('hashcodEntryHold');
    if (hold && hold.parentNode) hold.parentNode.removeChild(hold);
    const button = document.getElementById('hashcodEntryForceButton');
    if (button && button.parentNode) button.parentNode.removeChild(button);
  }

  function createInput(name, label, attrs) {
    attrs = attrs || '';
    return '<label class="hashcod-direct-field">' + label + '<input name="' + name + '" ' + attrs + '></label>';
  }

  function openDirectRegistration() {
    installStyles();
    document.documentElement.dataset.hashcodDirectRegistration = 'true';
    document.documentElement.removeAttribute('data-hashcod-final-entry-screen');
    document.documentElement.removeAttribute('data-hashcod-platform-entered');

    let overlay = document.getElementById('hashcodDirectRegistration');
    if (!overlay) {
      overlay = document.createElement('section');
      overlay.id = 'hashcodDirectRegistration';
      document.body.appendChild(overlay);
    }

    overlay.innerHTML = [
      '<div class="hashcod-direct-card" role="dialog" aria-modal="true" aria-label="Registro Hashcod Codespace">',
        '<h2>Registro Hashcod Codespace</h2>',
        '<p>Formulario directo aislado. No usa el formulario oficial ni sus eventos, para evitar que el acceso se quede congelado.</p>',
        '<div class="hashcod-direct-prices" aria-label="Precios">',
          '<div><span>Por someter a solicitud</span><strong>RD$567</strong></div>',
          '<div><span>Por revisar tu code o lo que sea que hagas con IA</span><strong>RD$2,000</strong></div>',
          '<div><span>Por alojar tu plataforma en nuestro codespace post-cuántico</span><strong>RD$6,900</strong></div>',
          '<div><span>Por la Certificación</span><strong>RD$10,000</strong></div>',
          '<div><span>Aquilar en la primera plaza</span><strong>US$ 78</strong></div>',
        '</div>',
        '<div class="hashcod-direct-grid">',
          createInput('full_name', 'Nombre con apellidos', 'autocomplete="name"'),
          createInput('age', 'Edad', 'inputmode="numeric" placeholder="+18"'),
          createInput('cedula', 'Cédula con guiones', 'placeholder="000-0000000-0"'),
          createInput('platform_name', 'Nombre de su plataforma', ''),
          createInput('email', 'Correo electrónico', 'type="email" autocomplete="email"'),
          createInput('phone', 'Número de teléfono', 'autocomplete="tel"'),
        '</div>',
        '<div class="hashcod-direct-actions">',
          '<button type="button" class="hashcod-direct-submit" id="hashcodDirectEnter">Entrar a Hashcod Codespace</button>',
          '<button type="button" class="hashcod-direct-cancel" id="hashcodDirectBack">Volver</button>',
        '</div>',
        '<div class="hashcod-direct-status" id="hashcodDirectStatus" role="status" aria-live="polite"></div>',
      '</div>'
    ].join('');

    removeEntryHold();
    document.body.classList.remove('boot-locked');
    document.body.classList.add('auth-locked');

    const enter = document.getElementById('hashcodDirectEnter');
    const back = document.getElementById('hashcodDirectBack');
    const status = document.getElementById('hashcodDirectStatus');

    if (enter) {
      enter.addEventListener('click', function () {
        const fields = Array.from(overlay.querySelectorAll('input'));
        const values = {};
        fields.forEach(function (input) { values[input.name] = String(input.value || '').trim(); });
        const age = Number(String(values.age || '').replace(/[^0-9]/g, ''));
        const missing = ['full_name', 'age', 'cedula', 'platform_name', 'email', 'phone'].some(function (key) { return !values[key]; });
        if (missing) {
          if (status) status.textContent = 'Completa todos los campos para continuar.';
          return;
        }
        if (!Number.isFinite(age) || age < 18) {
          if (status) status.textContent = 'Debes indicar +18 para continuar.';
          return;
        }
        if (status) status.textContent = 'Registro confirmado. Abriendo Codespace…';
        window.setTimeout(function () {
          document.documentElement.dataset.hashcodPlatformEntered = 'true';
          document.documentElement.removeAttribute('data-hashcodDirectRegistration');
          document.documentElement.removeAttribute('data-hashcod-final-entry-screen');
          document.body.classList.remove('auth-locked', 'boot-locked');
          try { window.dispatchEvent(new CustomEvent('hashcod:platform-entered', { detail: { source: 'entry-registration-force-isolated' } })); } catch (_) {}
          if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
        }, 120);
      });
    }

    if (back) {
      back.addEventListener('click', function () {
        document.documentElement.removeAttribute('data-hashcodDirectRegistration');
        if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
        ensureButton();
      });
    }
  }

  function ensureButton() {
    installStyles();
    if (!entryScreenVisible()) return false;
    if (document.getElementById('hashcodEntryForceButton')) return true;
    const button = document.createElement('button');
    button.id = 'hashcodEntryForceButton';
    button.type = 'button';
    button.setAttribute('aria-label', 'Continuar al registro de plataforma de Hashcod');
    button.innerHTML = '<span>CONTINUAR AL REGISTRO</span><span aria-hidden="true">↵</span>';
    (document.body || document.documentElement).appendChild(button);
    return true;
  }

  function clickHandler(event) {
    const target = event.target;
    const button = target && typeof target.closest === 'function' ? target.closest('#hashcodEntryForceButton') : null;
    if (!button || !entryScreenVisible()) return;
    event.preventDefault();
    event.stopPropagation();
    if (typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
    button.setAttribute('aria-busy', 'true');
    button.innerHTML = '<span>ABRIENDO REGISTRO</span><span aria-hidden="true">↵</span>';
    openDirectRegistration();
  }

  function boot() {
    installStyles();
    ensureButton();
    document.addEventListener('click', clickHandler, true);
    [80, 250, 600, 1000, 1800, 3000, 5000, 8000].forEach(function (delay) { window.setTimeout(ensureButton, delay); });
    if (typeof MutationObserver === 'function') {
      const observer = new MutationObserver(function () { ensureButton(); });
      observer.observe(document.documentElement, { childList: true, subtree: true });
      window.addEventListener('hashcod:platform-entered', function () { observer.disconnect(); }, { once: true });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
