(function () {
  'use strict';

  const VERSION = '20260922-direct7-stable-open';
  if (window.__hashcodEntryRegistrationForceLoaded === VERSION) return;
  window.__hashcodEntryRegistrationForceLoaded = VERSION;

  const MAX_CODE_FILE_BYTES = 30 * 1024 * 1024;
  const CODE_FILE_EXTENSIONS = /\.(?:zip|tar|gz|txt|md|json|js|jsx|ts|tsx|html?|css|php|py|java|go|rs|cs|c|cc|cpp|h|hpp|sql|xml|ya?ml|toml|sh|coffee)$/i;
  const WHATSAPP_NUMBER = '18294721257';
  let selectedCodeFile = null;
  let temporaryTimer = 0;

  function markGateReady() {
    window.__hashcodPlatformEntryHoldReady = true;
    document.documentElement.dataset.hashcodEntryGateReady = 'true';
    try {
      window.dispatchEvent(new CustomEvent('hashcod:entry-gate-ready', {
        detail: { source: 'entry-registration-force', version: VERSION }
      }));
    } catch (_) {}
  }

  function byId(id) { return document.getElementById(id); }
  function digits(value) { return String(value || '').replace(/\D+/g, ''); }
  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function formatCedula(value) {
    const raw = digits(value).slice(0, 11);
    if (raw.length <= 3) return raw;
    if (raw.length <= 10) return raw.slice(0, 3) + '-' + raw.slice(3);
    return raw.slice(0, 3) + '-' + raw.slice(3, 10) + '-' + raw.slice(10);
  }
  function validCedula(value) { return /^\d{3}-\d{7}-\d$/.test(String(value || '')); }
  function validPhone(value) { return /^\+?[0-9][0-9\s().-]{6,24}$/.test(String(value || '').trim()); }
  function validName(value) {
    const text = String(value || '').trim();
    return text.length >= 4 && text.length <= 120 && /^\S+\s+\S+/u.test(text);
  }

  function installStyles() {
    if (byId('hashcodDirectRegistrationStyles')) return;
    const style = document.createElement('style');
    style.id = 'hashcodDirectRegistrationStyles';
    style.textContent = `
      .hashcod-direct-registration-open #bootCliOverlay,
      .hashcod-direct-registration-open #hashcodEntryHold,
      .hashcod-direct-registration-open #hashcodEntryForceButton,
      .hashcod-direct-registration-open #hashcodHoldContinue{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important;}
      #hashcodEntryForceButton{position:fixed!important;left:50%!important;bottom:max(74px,calc(env(safe-area-inset-bottom,0px) + 42px))!important;transform:translateX(-50%)!important;z-index:2147483640!important;display:inline-flex!important;visibility:visible!important;opacity:1!important;align-items:center!important;justify-content:center!important;gap:10px!important;min-width:240px!important;min-height:50px!important;padding:0 20px!important;border:1px solid #111!important;border-radius:10px!important;background:#111!important;color:#fff!important;font:800 11px/1 "IBM Plex Mono",Consolas,monospace!important;letter-spacing:.06em!important;text-transform:uppercase!important;box-shadow:0 14px 34px rgba(0,0,0,.18)!important;cursor:pointer!important;pointer-events:auto!important;}
      #hashcodDirectRegistration{position:fixed!important;inset:0!important;z-index:2147483645!important;display:flex!important;align-items:center!important;justify-content:center!important;background:#f6f6f3!important;background-image:linear-gradient(rgba(20,20,20,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(20,20,20,.045) 1px,transparent 1px)!important;background-size:38px 38px!important;color:#111!important;font-family:"IBM Plex Mono",Consolas,monospace!important;pointer-events:auto!important;padding:18px!important;}
      #hashcodDirectRegistration *{box-sizing:border-box;}
      .hashcod-direct-card{width:min(1060px,calc(100vw - 32px));max-height:calc(100vh - 32px);overflow:auto;background:#fff;border:1px solid #bdbdb8;border-radius:14px;box-shadow:0 24px 70px rgba(0,0,0,.18);padding:28px;}
      .hashcod-registration-head{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;margin-bottom:22px;border-bottom:1px solid #e3e3de;padding-bottom:18px;}
      .hashcod-registration-kicker{margin:0 0 8px;color:#70706b;font-size:11px;letter-spacing:.18em;font-weight:900;}
      .hashcod-registration-title{margin:0;font-size:clamp(30px,4vw,54px);line-height:.95;letter-spacing:-.07em;font-weight:950;}
      .hashcod-registration-subtitle{max-width:720px;margin:10px 0 0;color:#555;line-height:1.55;font-size:14px;}
      .hashcod-registration-badge{border:1px solid #111;border-radius:999px;padding:9px 12px;font-size:11px;font-weight:900;background:#111;color:#fff;white-space:nowrap;}
      .hashcod-registration-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
      .hashcod-registration-field{display:grid;gap:8px;}
      .hashcod-registration-field.is-wide,.hashcod-registration-progress,.hashcod-registration-consent{grid-column:1/-1;}
      .hashcod-registration-field label{font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:.08em;color:#3d3d38;}
      .hashcod-registration-field input{height:48px;border:1px solid #bdbdb8;border-radius:10px;padding:0 14px;font:700 15px/1 "IBM Plex Mono",Consolas,monospace;color:#111;background:#fbfbf9;outline:none;}
      .hashcod-registration-field input:focus{border-color:#111;box-shadow:0 0 0 3px rgba(0,0,0,.08);}
      .hashcod-registration-field input.is-invalid{border-color:#b3261e;background:#fff8f7;}
      .hashcod-registration-hint{min-height:16px;font-size:11px;color:#6a6a64;}
      .hashcod-registration-hint.is-error{color:#b3261e;font-weight:800;}
      .hashcod-registration-platform-upload{display:grid;grid-template-columns:1fr 54px;gap:10px;align-items:center;}
      #hashcodDirectCodeButton{height:48px;border:1px solid #111;border-radius:10px;background:#fff;color:#111;display:grid;place-items:center;cursor:pointer;font-weight:900;}
      #hashcodDirectCodeButton.is-selected{background:#111;color:#fff;}
      .hashcod-registration-progress{border:1px solid #d8d8d3;background:#fafaf8;border-radius:12px;padding:14px;}
      .hashcod-registration-progress-head{display:flex;align-items:center;justify-content:space-between;font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:.06em;}
      .hashcod-registration-progress-track{height:10px;background:#ecece7;border-radius:999px;overflow:hidden;margin-top:10px;}
      .hashcod-registration-progress-indicator{display:block;height:100%;width:0%;background:#111;border-radius:999px;transition:width .2s ease;}
      .hashcod-registration-progress-hint{display:block;margin-top:9px;color:#676761;font-size:12px;}
      .hashcod-registration-consent{display:grid;grid-template-columns:22px 1fr;gap:10px;align-items:start;border:1px solid #d8d8d3;background:#fafaf8;border-radius:12px;padding:14px;font-size:13px;line-height:1.45;}
      .hashcod-registration-consent input{margin-top:2px;accent-color:#111;}
      .hashcod-registration-consent a{color:#111;font-weight:900;text-decoration:underline;}
      .hashcod-registration-actions{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:18px;}
      .hashcod-registration-actions button{height:46px;border-radius:10px;border:1px solid #111;padding:0 16px;font:900 11px/1 "IBM Plex Mono",Consolas,monospace;letter-spacing:.06em;text-transform:uppercase;cursor:pointer;}
      #hashcodDirectSubmit{background:#111;color:#fff;min-width:245px;}
      #hashcodDirectSubmit:disabled,#hashcodDirectWhatsapp:disabled{opacity:.45;cursor:not-allowed;}
      #hashcodDirectWhatsapp,#hashcodDirectTemporary,#hashcodDirectBack{background:#fff;color:#111;}
      .hashcod-registration-validity-note{display:flex;align-items:center;gap:8px;min-height:38px;padding:0 12px;border:1px solid #d8d8d3;border-radius:10px;background:#fafaf8;font-size:12px;font-weight:800;}
      .hashcod-registration-faq{grid-column:1/-1;margin-top:20px;border:1px solid #d8d8d3;border-radius:12px;overflow:hidden;background:#fbfbf9;}
      .hashcod-registration-faq-item+ .hashcod-registration-faq-item{border-top:1px solid #e5e5df;}
      .hashcod-registration-faq-trigger{width:100%;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:15px;background:transparent;border:0;font:900 13px/1 "IBM Plex Mono",Consolas,monospace;cursor:pointer;text-align:left;}
      .hashcod-registration-faq-panel{display:none;padding:0 15px 15px;color:#555;font-size:13px;line-height:1.5;}
      .hashcod-registration-faq-item.is-open .hashcod-registration-faq-panel{display:block;}
      .hashcod-registration-price-list{display:grid;gap:10px;}
      .hashcod-registration-price-list div{display:flex;justify-content:space-between;gap:16px;border-bottom:1px solid #e3e3de;padding-bottom:9px;}
      .hashcod-registration-price-list div:last-child{border-bottom:0;padding-bottom:0;}
      .hashcod-registration-status{min-height:22px;margin:14px 0 0;font-size:13px;font-weight:800;color:#555;}
      #hashcodDirectCodeReceipt,#hashcodDirectTemporaryDialog{position:fixed;inset:0;z-index:2147483646;display:none;place-items:center;background:rgba(246,246,243,.92);padding:18px;}
      #hashcodDirectCodeReceipt.is-open,#hashcodDirectTemporaryDialog.is-open{display:grid;}
      .hashcod-modal-card{width:min(640px,calc(100vw - 36px));background:#fff;border:1px solid #bdbdb8;border-radius:14px;padding:24px;box-shadow:0 24px 70px rgba(0,0,0,.18);}
      .hashcod-modal-card code{display:block;word-break:break-all;background:#111;color:#fff;border-radius:10px;padding:14px;margin:14px 0;font-size:13px;}
      .hashcod-modal-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:14px;}
      .hashcod-modal-actions button{height:44px;border-radius:10px;border:1px solid #111;padding:0 14px;font:900 11px/1 "IBM Plex Mono",Consolas,monospace;text-transform:uppercase;}
      .hashcod-temporary-row{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:14px 0;}
      .hashcod-temporary-row input,.hashcod-temporary-row select{height:44px;border:1px solid #bdbdb8;border-radius:10px;padding:0 12px;font:800 13px/1 "IBM Plex Mono",Consolas,monospace;background:#fbfbf9;}
      @media(max-width:720px){.hashcod-direct-card{padding:18px}.hashcod-registration-grid{grid-template-columns:1fr}.hashcod-registration-head{display:grid}.hashcod-registration-title{font-size:34px}.hashcod-registration-platform-upload{grid-template-columns:1fr 48px}.hashcod-registration-price-list div{display:grid;gap:4px}.hashcod-registration-actions button,#hashcodDirectSubmit{width:100%;}.hashcod-registration-validity-note{width:100%;}.hashcod-temporary-row{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }

  function removeNode(id) {
    const node = byId(id);
    if (node && node.parentNode) node.parentNode.removeChild(node);
  }

  function faqItem(id, title, body) {
    return `<div class="hashcod-registration-faq-item"><button type="button" class="hashcod-registration-faq-trigger" aria-expanded="false" aria-controls="${id}"><span>${title}</span><span aria-hidden="true">⌄</span></button><div id="${id}" class="hashcod-registration-faq-panel" aria-hidden="true">${body}</div></div>`;
  }

  function formMarkup() {
    return `
      <div class="hashcod-direct-card" role="dialog" aria-modal="true" aria-label="Registro Hashcod Codespace">
        <header class="hashcod-registration-head">
          <div>
            <p class="hashcod-registration-kicker">HASHCOD / REGISTRO / +18</p>
            <h1 class="hashcod-registration-title">Registro de plataforma</h1>
            <p class="hashcod-registration-subtitle">Completa los datos solicitados para registrar tu plataforma. Todos los campos son obligatorios.</p>
          </div>
          <span class="hashcod-registration-badge">18+ ONLY</span>
        </header>
        <form id="hashcodDirectRegistrationForm" novalidate autocomplete="off" data-no-autosave data-hashcod-autosave="off">
          <div class="hashcod-registration-grid">
            <div class="hashcod-registration-field is-wide"><label for="hashcodDirectFullName">Nombre con apellidos</label><input id="hashcodDirectFullName" name="full_name" maxlength="120" autocomplete="name" required placeholder="Nombre y apellidos"><span class="hashcod-registration-hint" data-hint="full_name">Escribe al menos nombre y apellido.</span></div>
            <div class="hashcod-registration-field"><label for="hashcodDirectAge">Edad</label><input id="hashcodDirectAge" name="age" type="number" min="18" max="120" inputmode="numeric" required placeholder="18"><span class="hashcod-registration-hint" data-hint="age">Debes tener 18 años o más.</span></div>
            <div class="hashcod-registration-field"><label for="hashcodDirectCedula">Cédula con guiones</label><input id="hashcodDirectCedula" name="cedula" inputmode="numeric" maxlength="13" required placeholder="000-0000000-0"><span class="hashcod-registration-hint" data-hint="cedula">Formato: 000-0000000-0.</span></div>
            <div class="hashcod-registration-field is-wide"><label for="hashcodDirectPlatform">Nombre de su plataforma</label><div class="hashcod-registration-platform-upload"><input id="hashcodDirectPlatform" name="platform_name" maxlength="120" required placeholder="Nombre de la plataforma"><input id="hashcodDirectCodeFile" name="code_file" type="file" hidden accept=".zip,.tar,.gz,.txt,.md,.json,.js,.jsx,.ts,.tsx,.html,.htm,.css,.php,.py,.java,.go,.rs,.cs,.c,.cc,.cpp,.h,.hpp,.sql,.xml,.yaml,.yml,.toml,.sh,.coffee"><button id="hashcodDirectCodeButton" type="button" aria-label="Subir código de la plataforma" title="Subir código de la plataforma">+</button></div><span class="hashcod-registration-hint" data-hint="platform_name"></span><span class="hashcod-registration-hint" data-hint="code_file">Sube la explicación del code de tu plataforma. Máximo 30 MB.</span></div>
            <div class="hashcod-registration-field"><label for="hashcodDirectEmail">Correo electrónico</label><input id="hashcodDirectEmail" name="email" type="email" autocomplete="email" required><span class="hashcod-registration-hint" data-hint="email"></span></div>
            <div class="hashcod-registration-field"><label for="hashcodDirectPhone">Número de teléfono</label><input id="hashcodDirectPhone" name="phone" type="tel" maxlength="25" autocomplete="tel" required placeholder="+1 809 000 0000"><span class="hashcod-registration-hint" data-hint="phone"></span></div>
            <div id="hashcodDirectProgress" class="hashcod-registration-progress" role="progressbar" aria-label="Progreso del formulario" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><div class="hashcod-registration-progress-head"><span>Progreso del formulario</span><span id="hashcodDirectProgressValue">0%</span></div><div class="hashcod-registration-progress-track" aria-hidden="true"><span id="hashcodDirectProgressIndicator" class="hashcod-registration-progress-indicator"></span></div><span id="hashcodDirectProgressHint" class="hashcod-registration-progress-hint">Completa todos los campos para habilitar la aceptación.</span></div>
            <label class="hashcod-registration-consent" for="hashcodDirectConsent"><input id="hashcodDirectConsent" name="consent" type="checkbox" required><span>Confirmo que tengo 18 años o más. He leído y acepto contractualmente el <a href="privacy" target="_blank" rel="noopener">Documento Contractual y de Privacidad</a>.</span></label>
          </div>
          <div class="hashcod-registration-actions">
            <button id="hashcodDirectTemporary" type="button" title="Acceso temporal">Acceso temporal</button>
            <button id="hashcodDirectSubmit" type="submit" disabled>Entrar a Hashcod Codespace</button>
            <button id="hashcodDirectWhatsapp" type="button" disabled>WhatsApp</button>
            <button id="hashcodDirectBack" type="button">Volver</button>
            <div class="hashcod-registration-validity-note"><span>Haciendo que tu proyecto hecho por IA tenga validez legal</span></div>
          </div>
          <div class="hashcod-registration-faq" data-hashcod-accordion>
            ${faqItem('hashcodFaqPanelTrustDirect', '¿Cómo sé que esto no es una estafa?', 'Ve a donde dice <strong>Documento Contractual y de Privacidad</strong>.')}
            ${faqItem('hashcodFaqPanelPriceDirect', '¿Cuánto cobran?', '<div class="hashcod-registration-price-list"><div><span>Por someter a solicitud</span><strong>RD$567</strong></div><div><span>Por revisar tu code o lo que sea que hagas con IA</span><strong>RD$2,000</strong></div><div><span>Por alojar tu plataforma en nuestro codespace post-cuántico</span><strong>RD$6,900</strong></div><div><span>Por la Certificación</span><strong>RD$10,000</strong></div><div><span>Aquilar en la primera plaza</span><strong>US$ 78</strong></div></div>')}
            ${faqItem('hashcodFaqPanelReadyDirect', '¿Cuándo estará lista la Plataforma?', 'Lo avisaremos por nuestras redes sociales (<strong>hashcod.app</strong>).')}
          </div>
          <p id="hashcodDirectStatus" class="hashcod-registration-status" role="status" aria-live="polite"></p>
        </form>
      </div>`;
  }

  function values() {
    return {
      fullName: byId('hashcodDirectFullName'),
      age: byId('hashcodDirectAge'),
      cedula: byId('hashcodDirectCedula'),
      platform: byId('hashcodDirectPlatform'),
      file: byId('hashcodDirectCodeFile'),
      email: byId('hashcodDirectEmail'),
      phone: byId('hashcodDirectPhone'),
      consent: byId('hashcodDirectConsent')
    };
  }

  function setHint(name, message, isError) {
    const hint = document.querySelector('#hashcodDirectRegistration [data-hint="' + name + '"]');
    if (!hint) return;
    hint.textContent = message || '';
    hint.classList.toggle('is-error', Boolean(isError));
  }

  function validate() {
    const f = values();
    const age = Number(f.age && f.age.value);
    const checks = {
      fullName: Boolean(f.fullName && validName(f.fullName.value)),
      age: Number.isInteger(age) && age >= 18 && age <= 120,
      cedula: Boolean(f.cedula && validCedula(f.cedula.value)),
      platform: Boolean(f.platform && f.platform.value.trim().length >= 2 && f.platform.value.trim().length <= 120),
      file: Boolean(selectedCodeFile),
      email: Boolean(f.email && f.email.value && f.email.checkValidity()),
      phone: Boolean(f.phone && validPhone(f.phone.value)),
      consent: Boolean(f.consent && f.consent.checked)
    };
    const keys = Object.keys(checks);
    const done = keys.filter((key) => checks[key]).length;
    const percent = Math.round((done / keys.length) * 100);
    const progress = byId('hashcodDirectProgress');
    const indicator = byId('hashcodDirectProgressIndicator');
    const value = byId('hashcodDirectProgressValue');
    const hint = byId('hashcodDirectProgressHint');
    const submit = byId('hashcodDirectSubmit');
    const whatsapp = byId('hashcodDirectWhatsapp');
    if (progress) progress.setAttribute('aria-valuenow', String(percent));
    if (indicator) indicator.style.width = percent + '%';
    if (value) value.textContent = percent + '%';
    if (hint) hint.textContent = percent === 100 ? 'Formulario listo. Ya puedes continuar.' : 'Completa todos los campos para habilitar la aceptación.';
    if (submit) submit.disabled = percent !== 100;
    if (whatsapp) whatsapp.disabled = percent !== 100;

    if (f.fullName) f.fullName.classList.toggle('is-invalid', f.fullName.value.length > 0 && !checks.fullName);
    if (f.age) f.age.classList.toggle('is-invalid', f.age.value.length > 0 && !checks.age);
    if (f.cedula) f.cedula.classList.toggle('is-invalid', f.cedula.value.length > 0 && !checks.cedula);
    if (f.platform) f.platform.classList.toggle('is-invalid', f.platform.value.length > 0 && !checks.platform);
    if (f.email) f.email.classList.toggle('is-invalid', f.email.value.length > 0 && !checks.email);
    if (f.phone) f.phone.classList.toggle('is-invalid', f.phone.value.length > 0 && !checks.phone);

    setHint('full_name', checks.fullName ? 'Nombre válido.' : 'Escribe al menos nombre y apellido.', !checks.fullName && f.fullName && f.fullName.value.length > 0);
    setHint('age', checks.age ? 'Edad confirmada.' : 'Debes tener 18 años o más.', !checks.age && f.age && f.age.value.length > 0);
    setHint('cedula', checks.cedula ? 'Cédula con formato válido.' : 'Formato requerido: 000-0000000-0.', !checks.cedula && f.cedula && f.cedula.value.length > 0);
    setHint('platform_name', checks.platform ? 'Nombre de plataforma válido.' : 'Escribe el nombre de la plataforma.', !checks.platform && f.platform && f.platform.value.length > 0);
    setHint('code_file', selectedCodeFile ? 'Archivo seleccionado: ' + selectedCodeFile.name : 'Sube la explicación del code de tu plataforma. Máximo 30 MB.', !selectedCodeFile);
    setHint('email', checks.email ? 'Correo válido.' : 'Escribe un correo electrónico válido.', !checks.email && f.email && f.email.value.length > 0);
    setHint('phone', checks.phone ? 'Teléfono válido.' : 'Escribe un número de teléfono válido.', !checks.phone && f.phone && f.phone.value.length > 0);
    return percent === 100;
  }

  function finishEntry() {
    document.body.classList.remove('hashcod-direct-registration-open', 'auth-locked', 'boot-locked');
    document.documentElement.dataset.hashcodPlatformEntered = 'true';
    document.documentElement.removeAttribute('data-hashcod-direct-registration');
    ['hashcodDirectRegistration', 'hashcodDirectCodeReceipt', 'hashcodDirectTemporaryDialog', 'bootCliOverlay', 'hashcodEntryHold'].forEach(removeNode);
    try { window.dispatchEvent(new CustomEvent('hashcod:platform-entered', { detail: { source: 'entry-registration-force', version: VERSION } })); } catch (_) {}
  }

  function generateCode() {
    const bytes = new Uint8Array(12);
    try { crypto.getRandomValues(bytes); } catch (_) { for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256); }
    return 'HSC-REG-' + Array.from(bytes).map((b) => b.toString(16).padStart(2, '0').toUpperCase()).join('').replace(/(.{4})/g, '$1-').replace(/-$/, '');
  }

  function whatsappMessage() {
    const f = values();
    return [
      'Solicitud Hashcod Codespace',
      'Nombre: ' + (f.fullName ? f.fullName.value.trim() : ''),
      'Edad: ' + (f.age ? f.age.value.trim() : ''),
      'Cédula: ' + (f.cedula ? f.cedula.value.trim() : ''),
      'Plataforma: ' + (f.platform ? f.platform.value.trim() : ''),
      'Correo: ' + (f.email ? f.email.value.trim() : ''),
      'Teléfono: ' + (f.phone ? f.phone.value.trim() : ''),
      'Archivo: ' + (selectedCodeFile ? selectedCodeFile.name : 'no seleccionado')
    ].join('\n');
  }

  function bindForm() {
    const form = byId('hashcodDirectRegistrationForm');
    const status = byId('hashcodDirectStatus');
    const codeButton = byId('hashcodDirectCodeButton');
    const codeFile = byId('hashcodDirectCodeFile');
    const whatsapp = byId('hashcodDirectWhatsapp');
    const temporary = byId('hashcodDirectTemporary');
    const back = byId('hashcodDirectBack');
    const f = values();

    Object.keys(f).forEach((key) => {
      const input = f[key];
      if (!input) return;
      input.addEventListener('input', () => {
        if (key === 'cedula') input.value = formatCedula(input.value);
        validate();
      });
      input.addEventListener('change', validate);
    });

    if (codeButton && codeFile) {
      codeButton.addEventListener('click', () => codeFile.click());
      codeFile.addEventListener('change', () => {
        const file = codeFile.files && codeFile.files[0] ? codeFile.files[0] : null;
        if (!file) { selectedCodeFile = null; codeButton.classList.remove('is-selected'); validate(); return; }
        if (file.size > MAX_CODE_FILE_BYTES) {
          selectedCodeFile = null; codeFile.value = '';
          if (status) status.textContent = 'El archivo supera el máximo de 30 MB.';
          validate(); return;
        }
        if (!CODE_FILE_EXTENSIONS.test(file.name)) {
          selectedCodeFile = null; codeFile.value = '';
          if (status) status.textContent = 'Tipo de archivo no permitido para el code.';
          validate(); return;
        }
        selectedCodeFile = file;
        codeButton.classList.add('is-selected');
        if (status) status.textContent = 'Archivo de code seleccionado.';
        validate();
      });
    }

    document.querySelectorAll('#hashcodDirectRegistration .hashcod-registration-faq-trigger').forEach((button) => {
      button.addEventListener('click', () => {
        const item = button.closest('.hashcod-registration-faq-item');
        if (!item) return;
        const open = item.classList.toggle('is-open');
        button.setAttribute('aria-expanded', open ? 'true' : 'false');
        const panel = byId(button.getAttribute('aria-controls'));
        if (panel) panel.setAttribute('aria-hidden', open ? 'false' : 'true');
      });
    });

    if (form) {
      form.addEventListener('submit', (event) => {
        event.preventDefault(); event.stopPropagation();
        if (!validate()) {
          if (status) status.textContent = 'Completa correctamente todos los campos y acepta el documento contractual.';
          return;
        }
        const code = generateCode();
        removeNode('hashcodDirectCodeReceipt');
        document.body.insertAdjacentHTML('beforeend', `<div id="hashcodDirectCodeReceipt" class="is-open"><section class="hashcod-modal-card" role="dialog" aria-modal="true"><div class="hashcod-registration-kicker">HASHCOD · REGISTRATION CODE</div><h2>Guarda tu código criptográfico</h2><p>Este código identifica este registro. Se muestra en claro solamente en esta confirmación.</p><code id="hashcodDirectPrivateCode">${escapeHtml(code)}</code><div class="hashcod-modal-actions"><button id="hashcodDirectCopyCode" type="button">Copiar código</button><button id="hashcodDirectContinueAfterCode" type="button">Continuar a Hashcod</button></div><span id="hashcodDirectCodeCopyStatus" class="hashcod-registration-status" role="status"></span></section></div>`);
        const copy = byId('hashcodDirectCopyCode');
        const cont = byId('hashcodDirectContinueAfterCode');
        const copyStatus = byId('hashcodDirectCodeCopyStatus');
        if (copy) copy.addEventListener('click', () => {
          if (!navigator.clipboard) { if (copyStatus) copyStatus.textContent = 'Copia manualmente el código.'; return; }
          navigator.clipboard.writeText(code).then(() => { if (copyStatus) copyStatus.textContent = 'Código copiado.'; }).catch(() => { if (copyStatus) copyStatus.textContent = 'Copia manualmente el código.'; });
        });
        if (cont) cont.addEventListener('click', finishEntry);
      }, true);
    }

    if (whatsapp) whatsapp.addEventListener('click', () => {
      if (!validate()) return;
      window.open('https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(whatsappMessage()), '_blank', 'noopener');
    });
    if (temporary) temporary.addEventListener('click', openTemporaryAccess);
    if (back) back.addEventListener('click', () => {
      document.body.classList.remove('hashcod-direct-registration-open');
      document.documentElement.removeAttribute('data-hashcod-direct-registration');
      selectedCodeFile = null;
      ['hashcodDirectRegistration', 'hashcodDirectCodeReceipt', 'hashcodDirectTemporaryDialog'].forEach(removeNode);
      ensureEntryButton();
    });
    validate();
  }

  function openTemporaryAccess() {
    removeNode('hashcodDirectTemporaryDialog');
    document.body.insertAdjacentHTML('beforeend', `<div id="hashcodDirectTemporaryDialog" class="is-open"><div class="hashcod-modal-card"><div class="hashcod-registration-kicker">HASHCOD · ACCESO TEMPORAL</div><h2>¿Cuánto tiempo quieres permanecer?</h2><p>Este acceso omite el formulario de registro. Cuando el tiempo termine, Codespace volverá al inicio.</p><div class="hashcod-temporary-row"><input id="hashcodTemporaryAccessDuration" type="number" min="1" step="1" value="30"><select id="hashcodTemporaryAccessUnit"><option value="minutes">minutos</option><option value="hours">horas</option></select></div><span id="hashcodTemporaryAccessStatus" class="hashcod-registration-status" role="status"></span><div class="hashcod-modal-actions"><button id="hashcodTemporaryAccessCancel" type="button">Cancelar</button><button id="hashcodTemporaryAccessConfirm" type="button">Entrar temporalmente</button></div></div></div>`);
    const cancel = byId('hashcodTemporaryAccessCancel');
    const confirm = byId('hashcodTemporaryAccessConfirm');
    if (cancel) cancel.addEventListener('click', () => removeNode('hashcodDirectTemporaryDialog'));
    if (confirm) confirm.addEventListener('click', () => {
      const amount = Math.max(1, Number(byId('hashcodTemporaryAccessDuration') && byId('hashcodTemporaryAccessDuration').value) || 30);
      const unit = byId('hashcodTemporaryAccessUnit') && byId('hashcodTemporaryAccessUnit').value === 'hours' ? 'hours' : 'minutes';
      const ms = Math.min(unit === 'hours' ? amount * 60 * 60 * 1000 : amount * 60 * 1000, 24 * 60 * 60 * 1000);
      if (temporaryTimer) clearTimeout(temporaryTimer);
      temporaryTimer = setTimeout(() => window.location.reload(), ms);
      finishEntry();
    });
  }

  function openDirectRegistration() {
    markGateReady();
    installStyles();
    selectedCodeFile = null;
    document.body.classList.add('hashcod-direct-registration-open');
    document.documentElement.dataset.hashcodDirectRegistration = 'true';
    document.documentElement.removeAttribute('data-hashcod-final-entry-screen');
    removeNode('hashcodDirectRegistration');
    const overlay = document.createElement('section');
    overlay.id = 'hashcodDirectRegistration';
    overlay.setAttribute('aria-label', 'Registro Hashcod Codespace');
    overlay.innerHTML = '<div class="hashcod-direct-card"><p class="hashcod-registration-kicker">HASHCOD / REGISTRO</p><h1 class="hashcod-registration-title">Cargando registro…</h1><p class="hashcod-registration-subtitle">Preparando formulario seguro.</p></div>';
    document.body.appendChild(overlay);
    setTimeout(() => {
      try {
        overlay.innerHTML = formMarkup();
        bindForm();
        const firstInput = byId('hashcodDirectFullName');
        if (firstInput) setTimeout(() => { try { firstInput.focus(); } catch (_) {} }, 50);
      } catch (error) {
        console.error('[Hashcod] direct form render failed', error);
        overlay.innerHTML = '<div class="hashcod-direct-card"><p class="hashcod-registration-kicker">HASHCOD / ERROR</p><h1 class="hashcod-registration-title">No se pudo abrir el formulario.</h1><p class="hashcod-registration-subtitle">Recarga la página o vuelve a intentar.</p><div class="hashcod-registration-actions"><button type="button" id="hashcodDirectBack">Volver</button></div></div>';
        const back = byId('hashcodDirectBack');
        if (back) back.addEventListener('click', () => { removeNode('hashcodDirectRegistration'); document.body.classList.remove('hashcod-direct-registration-open'); });
      }
    }, 0);
  }

  function ensureEntryButton() {
    markGateReady(); installStyles();
    if (byId('hashcodDirectRegistration')) return;
    const bootButton = byId('bootCliEnter');
    if (bootButton) {
      bootButton.disabled = false;
      bootButton.removeAttribute('aria-busy');
      bootButton.dataset.hashcodDirectEntryReady = 'true';
      bootButton.title = 'Abrir registro directo de Hashcod';
      return;
    }
    if (!byId('hashcodEntryForceButton') && document.body) {
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
    event.preventDefault(); event.stopPropagation();
    if (typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    button.textContent = 'ABRIENDO REGISTRO';
    requestAnimationFrame(() => {
      try { openDirectRegistration(); }
      catch (error) {
        console.error('[Hashcod] direct registration failed', error);
        button.disabled = false;
        button.removeAttribute('aria-busy');
        button.textContent = 'ENTER PLATFORM';
      }
    });
  }

  function boot() {
    markGateReady(); ensureEntryButton();
    document.addEventListener('click', handleClick, true);
    [80, 250, 700, 1500, 3000, 6000].forEach((delay) => setTimeout(() => { markGateReady(); ensureEntryButton(); }, delay));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();