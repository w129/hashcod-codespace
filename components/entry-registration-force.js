(function () {
  'use strict';

  const VERSION = '20260922-direct4-gate-bypass';
  if (window.__hashcodEntryRegistrationForceLoaded === VERSION) return;
  window.__hashcodEntryRegistrationForceLoaded = VERSION;

  function markGateReady() {
    window.__hashcodPlatformEntryHoldReady = true;
    document.documentElement.dataset.hashcodEntryGateReady = 'true';
    try {
      window.dispatchEvent(new CustomEvent('hashcod:entry-gate-ready', {
        detail: { source: 'entry-registration-force', version: VERSION }
      }));
    } catch (_) {}
  }

  function ensureStyles() {
    if (document.getElementById('hashcodDirectRegistrationStyles')) return;
    const style = document.createElement('style');
    style.id = 'hashcodDirectRegistrationStyles';
    style.textContent = [
      '.hashcod-direct-registration-open #bootCliOverlay,.hashcod-direct-registration-open #hashcodEntryHold,.hashcod-direct-registration-open #hashcodEntryForceButton,.hashcod-direct-registration-open #hashcodHoldContinue{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important;}',
      '#hashcodEntryForceButton{position:fixed!important;left:50%!important;bottom:max(74px,calc(env(safe-area-inset-bottom,0px) + 42px))!important;transform:translateX(-50%)!important;z-index:2147483640!important;display:inline-flex!important;visibility:visible!important;opacity:1!important;align-items:center!important;justify-content:center!important;gap:10px!important;min-width:240px!important;min-height:50px!important;padding:0 20px!important;border:1px solid #111!important;border-radius:10px!important;background:#111!important;color:#fff!important;font:800 11px/1 "IBM Plex Mono",Consolas,monospace!important;letter-spacing:.06em!important;text-transform:uppercase!important;box-shadow:0 14px 34px rgba(0,0,0,.18)!important;cursor:pointer!important;pointer-events:auto!important;}',
      '#hashcodDirectRegistration{position:fixed!important;inset:0!important;z-index:2147483645!important;display:grid!important;place-items:center!important;background:#f6f6f3!important;background-image:linear-gradient(rgba(20,20,20,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(20,20,20,.045) 1px,transparent 1px)!important;background-size:38px 38px!important;color:#111!important;font-family:"IBM Plex Mono",Consolas,monospace!important;pointer-events:auto!important;}',
      '.hashcod-direct-card{width:min(760px,calc(100vw - 36px));max-height:calc(100vh - 36px);overflow:auto;background:#fff;border:1px solid #bdbdb8;border-radius:14px;box-shadow:0 24px 70px rgba(0,0,0,.18);padding:24px;}',
      '.hashcod-direct-card h2{margin:0 0 8px;font:900 26px/1.08 "IBM Plex Mono",Consolas,monospace;letter-spacing:-.05em;}',
      '.hashcod-direct-card p{margin:0 0 16px;color:#555;line-height:1.55;font-size:13px;}',
      '.hashcod-direct-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:16px 0;}',
      '.hashcod-direct-field{display:grid;gap:6px;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:.05em;color:#333;}',
      '.hashcod-direct-field input{height:42px;border:1px solid #bdbdb8;border-radius:8px;padding:0 12px;font:600 14px/1 "IBM Plex Mono",Consolas,monospace;color:#111;background:#fbfbf9;outline:none;}',
      '.hashcod-direct-field input:focus{border-color:#111;box-shadow:0 0 0 3px rgba(0,0,0,.08);}',
      '.hashcod-direct-prices{border:1px solid #d8d8d3;border-radius:10px;background:#fafaf8;padding:12px;margin:14px 0;display:grid;gap:8px;font-size:12px;}',
      '.hashcod-direct-prices div{display:flex;justify-content:space-between;gap:16px;border-bottom:1px solid #e8e8e2;padding-bottom:8px;}',
      '.hashcod-direct-prices div:last-child{border-bottom:0;padding-bottom:0;}',
      '.hashcod-direct-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:16px;}',
      '.hashcod-direct-actions button{height:44px;border-radius:8px;border:1px solid #111;padding:0 16px;font:900 11px/1 "IBM Plex Mono",Consolas,monospace;letter-spacing:.05em;text-transform:uppercase;cursor:pointer;}',
      '.hashcod-direct-submit{background:#111;color:#fff;}',
      '.hashcod-direct-back{background:#fff;color:#111;}',
      '.hashcod-direct-status{min-height:20px;margin-top:10px;font-size:12px;color:#555;}',
      '@media(max-width:720px){.hashcod-direct-grid{grid-template-columns:1fr}.hashcod-direct-card{padding:18px}.hashcod-direct-prices div{display:grid;gap:4px}}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function removeNode(id) {
    const node = document.getElementById(id);
    if (node && node.parentNode) node.parentNode.removeChild(node);
  }

  function openDirectRegistration() {
    markGateReady();
    ensureStyles();
    document.body.classList.add('hashcod-direct-registration-open');
    document.documentElement.dataset.hashcodDirectRegistration = 'true';
    document.documentElement.removeAttribute('data-hashcod-final-entry-screen');

    removeNode('hashcodDirectRegistration');

    const overlay = document.createElement('section');
    overlay.id = 'hashcodDirectRegistration';
    overlay.setAttribute('aria-label', 'Registro Hashcod Codespace');
    overlay.innerHTML = [
      '<div class="hashcod-direct-card" role="dialog" aria-modal="true">',
        '<h2>Registro Hashcod Codespace</h2>',
        '<p>Formulario directo de respaldo. No depende del flujo anterior, por eso evita que el inicio se quede congelado.</p>',
        '<div class="hashcod-direct-prices" aria-label="Precios">',
          '<div><span>Por someter a solicitud</span><strong>RD$567</strong></div>',
          '<div><span>Por revisar tu code o lo que sea que hagas con IA</span><strong>RD$2,000</strong></div>',
          '<div><span>Por alojar tu plataforma en nuestro codespace post-cuántico</span><strong>RD$6,900</strong></div>',
          '<div><span>Por la Certificación</span><strong>RD$10,000</strong></div>',
          '<div><span>Aquilar en la primera plaza</span><strong>US$ 78</strong></div>',
        '</div>',
        '<form id="hashcodDirectRegistrationForm" novalidate>',
          '<div class="hashcod-direct-grid">',
            '<label class="hashcod-direct-field">Nombre con apellidos<input name="full_name" autocomplete="name" required></label>',
            '<label class="hashcod-direct-field">Edad<input name="age" inputmode="numeric" placeholder="+18" required></label>',
            '<label class="hashcod-direct-field">Cédula con guiones<input name="cedula" placeholder="000-0000000-0" required></label>',
            '<label class="hashcod-direct-field">Nombre de su plataforma<input name="platform_name" required></label>',
            '<label class="hashcod-direct-field">Correo electrónico<input name="email" type="email" autocomplete="email" required></label>',
            '<label class="hashcod-direct-field">Número de teléfono<input name="phone" autocomplete="tel" required></label>',
          '</div>',
          '<div class="hashcod-direct-actions">',
            '<button class="hashcod-direct-submit" type="submit">Entrar a Hashcod Codespace</button>',
            '<button class="hashcod-direct-back" type="button" id="hashcodDirectBack">Volver</button>',
          '</div>',
          '<div class="hashcod-direct-status" id="hashcodDirectRegistrationStatus" role="status" aria-live="polite"></div>',
        '</form>',
      '</div>'
    ].join('');
    document.body.appendChild(overlay);

    const firstInput = overlay.querySelector('input[name="full_name"]');
    if (firstInput) window.setTimeout(function () { try { firstInput.focus(); } catch (_) {} }, 80);

    const form = document.getElementById('hashcodDirectRegistrationForm');
    const status = document.getElementById('hashcodDirectRegistrationStatus');
    const back = document.getElementById('hashcodDirectBack');

    if (form) {
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        event.stopPropagation();
        const data = new FormData(form);
        const required = ['full_name', 'age', 'cedula', 'platform_name', 'email', 'phone'];
        const missing = required.some(function (key) { return !String(data.get(key) || '').trim(); });
        const age = Number(String(data.get('age') || '').replace(/[^0-9]/g, ''));
        if (missing) {
          if (status) status.textContent = 'Completa todos los campos para continuar.';
          return;
        }
        if (!Number.isFinite(age) || age < 18) {
          if (status) status.textContent = 'Debes indicar +18 para continuar.';
          return;
        }
        if (status) status.textContent = 'Registro local confirmado. Abriendo plataforma…';
        window.setTimeout(function () {
          document.body.classList.remove('hashcod-direct-registration-open', 'auth-locked', 'boot-locked');
          document.documentElement.dataset.hashcodPlatformEntered = 'true';
          document.documentElement.removeAttribute('data-hashcod-direct-registration');
          removeNode('hashcodDirectRegistration');
          removeNode('bootCliOverlay');
          removeNode('hashcodEntryHold');
          try {
            window.dispatchEvent(new CustomEvent('hashcod:platform-entered', { detail: { source: 'entry-registration-force', version: VERSION } }));
          } catch (_) {}
        }, 180);
      }, true);
    }

    if (back) {
      back.addEventListener('click', function () {
        document.body.classList.remove('hashcod-direct-registration-open');
        document.documentElement.removeAttribute('data-hashcod-direct-registration');
        removeNode('hashcodDirectRegistration');
        ensureEntryButton();
      });
    }
  }

  function ensureEntryButton() {
    markGateReady();
    ensureStyles();
    if (document.getElementById('hashcodDirectRegistration')) return;
    const bootButton = document.getElementById('bootCliEnter');
    if (bootButton) {
      bootButton.disabled = false;
      bootButton.removeAttribute('aria-busy');
      if (!bootButton.dataset.hashcodDirectEntryReady) {
        bootButton.dataset.hashcodDirectEntryReady = 'true';
        bootButton.title = 'Abrir registro directo de Hashcod';
      }
      return;
    }
    if (!document.getElementById('hashcodEntryForceButton') && document.body) {
      const button = document.createElement('button');
      button.id = 'hashcodEntryForceButton';
      button.type = 'button';
      button.innerHTML = '<span>ENTER PLATFORM</span><span aria-hidden="true">↵</span>';
      document.body.appendChild(button);
    }
  }

  function handleClick(event) {
    const target = event.target;
    const button = target && typeof target.closest === 'function'
      ? target.closest('#bootCliEnter,#hashcodEntryForceButton,#hashcodHoldContinue')
      : null;
    if (!button) return;
    markGateReady();
    event.preventDefault();
    event.stopPropagation();
    if (typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    const oldText = button.textContent;
    button.textContent = 'ABRIENDO REGISTRO';
    window.setTimeout(function () {
      try { openDirectRegistration(); }
      catch (error) {
        button.disabled = false;
        button.removeAttribute('aria-busy');
        button.textContent = oldText || 'ENTER PLATFORM';
        console.error('[Hashcod] direct registration failed', error);
      }
    }, 20);
  }

  function boot() {
    markGateReady();
    ensureEntryButton();
    document.addEventListener('click', handleClick, true);
    [50, 150, 350, 700, 1200, 2000, 3500, 6000, 9000].forEach(function (delay) {
      window.setTimeout(function () {
        markGateReady();
        ensureEntryButton();
      }, delay);
    });
    if (typeof MutationObserver === 'function') {
      const observer = new MutationObserver(function () {
        markGateReady();
        ensureEntryButton();
      });
      observer.observe(document.documentElement, { childList: true, subtree: true });
      window.addEventListener('hashcod:platform-entered', function () { observer.disconnect(); }, { once: true });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
