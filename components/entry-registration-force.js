(function () {
  'use strict';

  if (window.__hashcodEntryRegistrationForceLoaded === '20260922-direct2') return;
  window.__hashcodEntryRegistrationForceLoaded = '20260922-direct2';

  function css() {
    if (document.getElementById('hashcodEntryRegistrationForceStyles')) return;
    const style = document.createElement('style');
    style.id = 'hashcodEntryRegistrationForceStyles';
    style.textContent = [
      '#hashcodEntryForceButton,#hashcodHoldContinue{position:fixed!important;left:50%!important;bottom:max(74px,calc(env(safe-area-inset-bottom,0px) + 42px))!important;transform:translateX(-50%)!important;z-index:2147483640!important;display:inline-flex!important;visibility:visible!important;opacity:1!important;align-items:center!important;justify-content:center!important;gap:10px!important;min-width:240px!important;min-height:50px!important;padding:0 20px!important;border:1px solid #111!important;border-radius:10px!important;background:#111!important;color:#fff!important;font:800 11px/1 "IBM Plex Mono",Consolas,monospace!important;letter-spacing:.06em!important;text-transform:uppercase!important;box-shadow:0 14px 34px rgba(0,0,0,.18)!important;cursor:pointer!important;pointer-events:auto!important;}',
      '#hashcodEntryForceButton:disabled,#hashcodHoldContinue:disabled{opacity:.72!important;cursor:wait!important;}',
      'html[data-hashcod-final-entry-screen="true"] #hashcodEntryForceButton,html[data-hashcod-final-entry-screen="true"] #hashcodHoldContinue{display:none!important;}',
      '#hashcodPlatformRegistration.hashcod-force-registration{position:fixed!important;inset:0!important;z-index:2147483639!important;display:grid!important;place-items:center!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important;background:#f6f6f3!important;background-image:linear-gradient(rgba(20,20,20,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(20,20,20,.045) 1px,transparent 1px)!important;background-size:38px 38px!important;color:#111!important;font-family:"IBM Plex Mono",Consolas,monospace!important;}',
      '.hashcod-force-registration-card{width:min(720px,calc(100vw - 36px));max-height:calc(100vh - 36px);overflow:auto;background:#fff;border:1px solid #bdbdb8;border-radius:14px;box-shadow:0 24px 70px rgba(0,0,0,.18);padding:24px;}',
      '.hashcod-force-registration-card h2{margin:0 0 8px;font:900 24px/1.1 "IBM Plex Mono",Consolas,monospace;letter-spacing:-.04em;}',
      '.hashcod-force-registration-card p{margin:0 0 16px;color:#555;line-height:1.55;font-size:13px;}',
      '.hashcod-force-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:16px 0;}',
      '.hashcod-force-field{display:grid;gap:6px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.05em;color:#333;}',
      '.hashcod-force-field input{height:42px;border:1px solid #bdbdb8;border-radius:8px;padding:0 12px;font:600 14px/1 "IBM Plex Mono",Consolas,monospace;color:#111;background:#fbfbf9;}',
      '.hashcod-force-prices{border:1px solid #d8d8d3;border-radius:10px;background:#fafaf8;padding:12px;margin:14px 0;display:grid;gap:8px;font-size:12px;}',
      '.hashcod-force-prices div{display:flex;justify-content:space-between;gap:16px;border-bottom:1px solid #e8e8e2;padding-bottom:8px;}',
      '.hashcod-force-prices div:last-child{border-bottom:0;padding-bottom:0;}',
      '.hashcod-force-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:16px;}',
      '.hashcod-force-actions button{height:44px;border-radius:8px;border:1px solid #111;padding:0 16px;font:900 11px/1 "IBM Plex Mono",Consolas,monospace;letter-spacing:.05em;text-transform:uppercase;cursor:pointer;}',
      '.hashcod-force-submit{background:#111;color:#fff;}',
      '.hashcod-force-back{background:#fff;color:#111;}',
      '.hashcod-force-status{min-height:20px;margin-top:10px;font-size:12px;color:#555;}',
      '@media(max-width:720px){.hashcod-force-grid{grid-template-columns:1fr}.hashcod-force-registration-card{padding:18px}.hashcod-force-prices div{display:grid;gap:4px}}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function sloganVisible() {
    if (document.documentElement.dataset.hashcodFinalEntryScreen === 'true') return false;
    return Boolean(
      document.getElementById('hashcodEntryHold') ||
      document.querySelector('.hashcod-hold-slogan') ||
      ((document.body && document.body.textContent || '').indexOf('One world, one epoca, one empire') >= 0)
    );
  }

  function removeHold() {
    const hold = document.getElementById('hashcodEntryHold');
    if (hold && hold.parentNode) hold.parentNode.removeChild(hold);
    const force = document.getElementById('hashcodEntryForceButton');
    if (force && force.parentNode) force.parentNode.removeChild(force);
    const continueButton = document.getElementById('hashcodHoldContinue');
    if (continueButton && continueButton.parentNode && continueButton.closest('#hashcodPlatformRegistration') === null) {
      continueButton.parentNode.removeChild(continueButton);
    }
  }

  function openFallbackRegistration() {
    css();
    document.documentElement.dataset.hashcodFinalEntryScreen = 'true';
    document.documentElement.removeAttribute('data-hashcod-platform-entered');
    removeHold();

    let overlay = document.getElementById('hashcodPlatformRegistration');
    if (!overlay) {
      overlay = document.createElement('section');
      overlay.id = 'hashcodPlatformRegistration';
      document.body.appendChild(overlay);
    }

    overlay.dataset.hashcodScreen = '3';
    overlay.className = 'hashcod-force-registration';
    overlay.innerHTML = [
      '<div class="hashcod-force-registration-card" role="dialog" aria-modal="true" aria-label="Registro Hashcod Codespace">',
        '<h2>Registro Hashcod Codespace</h2>',
        '<p>Completa estos datos para continuar. Esta pantalla de respaldo evita que el acceso se quede congelado si el módulo grande tarda en cargar.</p>',
        '<div class="hashcod-force-prices" aria-label="Precios">',
          '<div><span>Por someter a solicitud</span><strong>RD$567</strong></div>',
          '<div><span>Por revisar tu code o lo que sea que hagas con IA</span><strong>RD$2,000</strong></div>',
          '<div><span>Por alojar tu plataforma en nuestro codespace post-cuántico</span><strong>RD$6,900</strong></div>',
          '<div><span>Por la Certificación</span><strong>RD$10,000</strong></div>',
          '<div><span>Aquilar en la primera plaza</span><strong>US$ 78</strong></div>',
        '</div>',
        '<form id="hashcodForceRegistrationForm" novalidate>',
          '<div class="hashcod-force-grid">',
            '<label class="hashcod-force-field">Nombre con apellidos<input name="full_name" autocomplete="name" required></label>',
            '<label class="hashcod-force-field">Edad<input name="age" inputmode="numeric" placeholder="+18" required></label>',
            '<label class="hashcod-force-field">Cédula con guiones<input name="cedula" placeholder="000-0000000-0" required></label>',
            '<label class="hashcod-force-field">Nombre de su plataforma<input name="platform_name" required></label>',
            '<label class="hashcod-force-field">Correo electrónico<input name="email" type="email" autocomplete="email" required></label>',
            '<label class="hashcod-force-field">Número de teléfono<input name="phone" autocomplete="tel" required></label>',
          '</div>',
          '<div class="hashcod-force-actions">',
            '<button class="hashcod-force-submit" type="submit">Entrar a Hashcod Codespace</button>',
            '<button class="hashcod-force-back" type="button" id="hashcodForceRetryOfficial">Reintentar formulario oficial</button>',
          '</div>',
          '<div class="hashcod-force-status" id="hashcodForceRegistrationStatus" role="status" aria-live="polite"></div>',
        '</form>',
      '</div>'
    ].join('');

    try {
      window.dispatchEvent(new CustomEvent('hashcod:final-entry-screen', { detail: { screen: 3, source: 'entry-registration-force-direct' } }));
    } catch (_) {}

    const form = document.getElementById('hashcodForceRegistrationForm');
    const status = document.getElementById('hashcodForceRegistrationStatus');
    const official = document.getElementById('hashcodForceRetryOfficial');

    if (form) {
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        const data = new FormData(form);
        const ageRaw = String(data.get('age') || '').replace(/[^0-9]/g, '');
        const age = Number(ageRaw);
        const required = ['full_name', 'age', 'cedula', 'platform_name', 'email', 'phone'];
        const missing = required.some(function (key) { return !String(data.get(key) || '').trim(); });
        if (missing) {
          if (status) status.textContent = 'Completa todos los campos para continuar.';
          return;
        }
        if (!Number.isFinite(age) || age < 18) {
          if (status) status.textContent = 'Debes indicar +18 para continuar.';
          return;
        }
        if (status) status.textContent = 'Registro local confirmado. Abriendo Codespace…';
        window.setTimeout(function () {
          document.documentElement.dataset.hashcodPlatformEntered = 'true';
          document.documentElement.removeAttribute('data-hashcod-final-entry-screen');
          try { window.dispatchEvent(new CustomEvent('hashcod:platform-entered', { detail: { source: 'entry-registration-force-direct' } })); } catch (_) {}
          if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
          document.body.classList.remove('auth-locked', 'boot-locked');
        }, 220);
      });
    }

    if (official) {
      official.addEventListener('click', function () {
        if (status) status.textContent = 'Buscando formulario oficial…';
        const registration = window.HashcodPlatformRegistration;
        if (registration && typeof registration.mount === 'function') {
          overlay.className = '';
          overlay.innerHTML = '';
          try { registration.mount(); } catch (_) {}
          if (status) status.textContent = '';
        } else if (status) {
          status.textContent = 'El formulario oficial no está disponible todavía. Usa este registro de respaldo.';
        }
      });
    }
  }

  function ensureButton() {
    css();
    if (!sloganVisible()) return false;
    let button = document.getElementById('hashcodHoldContinue') || document.getElementById('hashcodEntryForceButton');
    if (!button) {
      button = document.createElement('button');
      button.id = 'hashcodEntryForceButton';
      button.type = 'button';
      (document.body || document.documentElement).appendChild(button);
    }
    button.disabled = false;
    button.hidden = false;
    button.removeAttribute('hidden');
    button.innerHTML = '<span>CONTINUAR AL REGISTRO</span><span aria-hidden="true">↵</span>';
    return true;
  }

  function clickHandler(event) {
    const target = event.target;
    const button = target && typeof target.closest === 'function' ? target.closest('#hashcodEntryForceButton,#hashcodHoldContinue') : null;
    if (!button || !sloganVisible()) return;
    event.preventDefault();
    event.stopPropagation();
    if (typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
    button.disabled = true;
    button.innerHTML = '<span>ABRIENDO REGISTRO</span><span aria-hidden="true">↵</span>';
    window.setTimeout(openFallbackRegistration, 40);
  }

  function boot() {
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
