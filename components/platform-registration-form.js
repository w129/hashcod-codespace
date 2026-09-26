(function () {
  'use strict';

  const VERSION = '20260925-registration-restored-stable2';
  if (window.__hashcodPlatformRegistrationLoaded === VERSION) return;
  window.__hashcodPlatformRegistrationLoaded = VERSION;

  const ROOT_ID = 'hashcodPlatformRegistration';
  const MAX_FILE_BYTES = 30 * 1024 * 1024;
  let selectedFile = null;
  let resolved = false;
  let submittedPayload = null;
  let resolveSubmission = null;
  const submissionPromise = new Promise(function (resolve) { resolveSubmission = resolve; });

  function byId(id) { return document.getElementById(id); }
  function safe(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function emit(name, detail) { try { window.dispatchEvent(new CustomEvent(name, { detail: detail || {} })); } catch (_) {} }

  function ensureStyle() {
    if (byId('hashcodRegistrationRestoredStyle')) return;
    const style = document.createElement('style');
    style.id = 'hashcodRegistrationRestoredStyle';
    style.textContent = [
      '#hashcodPlatformRegistration{background:linear-gradient(rgba(0,0,0,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(0,0,0,.04) 1px,transparent 1px),#f2f3f1!important;background-size:32px 32px!important;}',
      '#hashcodPlatformRegistration .hc-pixel-bg{position:fixed;inset:0;z-index:-1;color:#8f9890;opacity:.20;pointer-events:none;overflow:hidden;}',
      '#hashcodPlatformRegistration .hc-pixel-bg svg{position:absolute;width:90px;height:90px;fill:currentColor;shape-rendering:crispEdges;image-rendering:pixelated;}',
      '#hashcodPlatformRegistration .hc-i1{left:4%;top:7%;}.hc-i2{right:7%;top:5%;}.hc-i3{left:7%;top:45%;}.hc-i4{right:8%;top:40%;}.hc-i5{left:13%;bottom:8%;}.hc-i6{right:13%;bottom:9%;}',
      '#hashcodPlatformRegistration>.hashcod-registration-head,#hashcodPlatformRegistration>#hashcodRegistrationForm{position:relative;z-index:1;width:min(100%,1180px)!important;background:rgba(255,255,255,.95);padding-left:clamp(18px,2.5vw,36px);padding-right:clamp(18px,2.5vw,36px);border-left:1px solid rgba(0,0,0,.08);border-right:1px solid rgba(0,0,0,.08);}',
      '#hashcodPlatformRegistration>.hashcod-registration-head{padding-top:26px;border-top:1px solid rgba(0,0,0,.10);border-radius:24px 24px 0 0;margin-bottom:0!important;}',
      '#hashcodPlatformRegistration>#hashcodRegistrationForm{padding-top:24px;padding-bottom:30px;border-bottom:1px solid rgba(0,0,0,.10);border-radius:0 0 24px 24px;box-shadow:0 22px 90px rgba(0,0,0,.10);}',
      '#hashcodPlatformRegistration .hashcod-registration-title{font-size:clamp(42px,7vw,86px)!important;letter-spacing:-.08em!important;}',
      '#hashcodPlatformRegistration .hashcod-registration-subtitle{font-family:Inter,system-ui,sans-serif;font-size:clamp(16px,1.8vw,24px)!important;max-width:760px!important;color:#343!important;}',
      '#hashcodPlatformRegistration .hashcod-registration-field{padding:16px;border:1px solid rgba(0,0,0,.10);border-radius:20px;background:rgba(255,255,255,.74);}',
      '#hashcodPlatformRegistration .hashcod-registration-field input{min-height:58px!important;border-radius:16px!important;font-size:16px!important;font-weight:700!important;}',
      '#hashcodPlatformRegistration #hashcodRegCodeButton{min-height:58px!important;border-radius:16px!important;}',
      '@media(max-width:860px){#hashcodPlatformRegistration{padding:16px!important;}#hashcodPlatformRegistration .hashcod-registration-grid{grid-template-columns:1fr!important;}#hashcodPlatformRegistration .hashcod-registration-title{font-size:44px!important;}.hashcod-registration-actions{grid-template-columns:48px 1fr 48px!important;}}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function icon(path, cls) {
    return '<svg class="' + cls + '" viewBox="0 0 32 32" aria-hidden="true"><path d="' + path + '"></path></svg>';
  }

  function bgIcons() {
    const a = 'M 4 6 L 4 11 L 4 27 L 28 27 L 28 9 L 28 6 L 12 6 L 12 8 L 10 8 L 10 6 L 8 6 L 8 8 L 6 8 L 6 6 L 4 6 z M 6 11 L 26 11 L 26 25 L 6 25 L 6 11 z M 16 13 L 16 18 L 18 18 L 18 13 L 16 13 z M 16 18 L 14 18 L 14 23 L 16 23 L 16 18 z M 10 15 L 10 17 L 12 17 L 12 15 L 10 15 z M 20 15 L 20 17 L 22 17 L 22 15 L 20 15 z';
    const b = 'M 6 4 L 6 28 L 26 28 L 26 10 L 24 10 L 24 8 L 22 8 L 22 10 L 20 10 L 20 8 L 22 8 L 22 6 L 20 6 L 20 4 L 6 4 z M 8 6 L 18 6 L 18 12 L 19 12 L 24 12 L 24 26 L 8 26 L 8 6 z M 15 15 L 15 25 L 17 25 L 17 15 L 15 15 z';
    const c = 'M 6 5 L 6 11 L 8 11 L 8 21 L 6 21 L 6 27 L 12 27 L 12 21 L 10 21 L 10 18 L 24 18 L 24 11 L 26 11 L 26 5 L 20 5 L 20 11 L 22 11 L 22 16 L 10 16 L 10 11 L 12 11 L 12 5 L 6 5 z';
    return '<div class="hc-pixel-bg">' + icon(a, 'hc-i1') + icon(b, 'hc-i2') + icon(c, 'hc-i3') + icon(a, 'hc-i4') + icon(b, 'hc-i5') + icon(c, 'hc-i6') + '</div>';
  }

  function uploadIcon() {
    return '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M 15 4 L 15 20 L 17 20 L 17 4 L 15 4 z M 17 4 L 17 8 L 19 8 L 19 10 L 21 10 L 21 12 L 23 12 L 23 14 L 25 14 L 25 16 L 27 16 L 27 18 L 29 18 L 29 16 L 27 16 L 27 14 L 25 14 L 25 12 L 23 12 L 23 10 L 21 10 L 21 8 L 19 8 L 19 6 L 17 6 L 17 4 z M 15 4 L 15 6 L 13 6 L 13 8 L 11 8 L 11 10 L 9 10 L 9 12 L 7 12 L 7 14 L 5 14 L 5 16 L 3 16 L 3 18 L 5 18 L 5 16 L 7 16 L 7 14 L 9 14 L 9 12 L 11 12 L 11 10 L 13 10 L 13 8 L 15 8 L 15 4 z M 7 23 L 7 28 L 25 28 L 25 23 L 23 23 L 23 26 L 9 26 L 9 23 L 7 23 z"></path></svg>';
  }

  function field(id, label, ph, hint, wide, attrs) {
    return '<div class="hashcod-registration-field' + (wide ? ' is-wide' : '') + '"><label for="' + id + '">' + label + '</label><input id="' + id + '" placeholder="' + ph + '" autocomplete="off" ' + (attrs || '') + '><div class="hashcod-registration-hint" data-hint-for="' + id + '">' + hint + '</div></div>';
  }

  function formHtml() {
    return bgIcons() +
      '<div class="hashcod-registration-head"><div><p class="hashcod-registration-kicker">HASHCOD / REGISTRO / +18</p><h1 class="hashcod-registration-title">Registro de plataforma</h1><p class="hashcod-registration-subtitle">Completa los datos solicitados para registrar tu plataforma. Todos los campos son obligatorios.</p></div><div class="hashcod-registration-badge">18+ ONLY</div></div>' +
      '<form id="hashcodRegistrationForm" novalidate><div class="hashcod-registration-grid">' +
      field('hashcodRegFullName', 'NOMBRE CON APELLIDOS', 'Nombre y apellidos', 'Escribe al menos nombre y apellido.', true) +
      field('hashcodRegAge', 'FECHA DE NACIMIENTO', 'dd/mm/aaaa', 'Debes tener 18 años o más.', false, 'inputmode="numeric"') +
      field('hashcodRegCedula', 'CÉDULA CON GUIONES', '000-0000000-0', 'Formato requerido: 000-0000000-0.', false, 'inputmode="numeric"') +
      '<div class="hashcod-registration-field is-wide"><label for="hashcodRegPlatformName">NOMBRE DE SU PLATAFORMA</label><div class="hashcod-registration-platform-upload"><input id="hashcodRegPlatformName" placeholder="Nombre de la plataforma" autocomplete="off"><button type="button" id="hashcodRegCodeButton" aria-label="Subir explicación o código">' + uploadIcon() + '</button></div><input type="file" id="hashcodRegCodeFile" hidden><div class="hashcod-registration-hint" data-hint-for="hashcodRegPlatformName">Escribe el nombre de la plataforma.</div><div class="hashcod-registration-hint hashcod-registration-code-hint is-error" data-hint-for="hashcodRegCodeFile">Sube la explicación del code de tu plataforma. Máximo 30 MB.</div></div>' +
      field('hashcodRegEmail', 'CORREO ELECTRÓNICO', 'correo@ejemplo.com', 'Usaremos este correo para confirmar el registro.', false, 'inputmode="email"') +
      field('hashcodRegPhone', 'NÚMERO DE TELÉFONO', '809-000-0000', 'Incluye un número activo para contacto.', false, 'inputmode="tel"') +
      '<div class="hashcod-registration-progress" data-progress="0"><div class="hashcod-registration-progress-head"><span>PROGRESO DEL REGISTRO</span><span id="hashcodRegistrationProgressValue">0%</span></div><div class="hashcod-registration-progress-track"><div class="hashcod-registration-progress-indicator" id="hashcodRegistrationProgressIndicator"></div></div><div class="hashcod-registration-progress-hint" id="hashcodRegistrationProgressHint">Completa los campos y sube el archivo para activar el envío.</div></div>' +
      '<label class="hashcod-registration-consent"><input type="checkbox" id="hashcodRegistrationConsent" class="hashcod-radix-checkbox-input"><span class="hashcod-radix-checkbox"><svg viewBox="0 0 24 24"><path d="M 20 6 L 9 17 L 4 12"></path></svg></span><span class="hashcod-registration-consent-text">Confirmo que tengo 18 años o más y que la información es correcta.</span></label>' +
      '<div class="hashcod-registration-actions"><button type="button" id="hashcodTemporaryAccessButton" title="Acceso temporal">⏱</button><div class="hashcod-registration-submit-react-host"><button type="submit" id="hashcodRegistrationSubmit"><span data-slot="flip-button-front">ENVIAR REGISTRO</span></button></div><button type="button" id="hashcodRegistrationWhatsappButton" title="WhatsApp" disabled>↗</button></div>' +
      '</div><p class="hashcod-registration-status" id="hashcodRegistrationStatus" role="status"></p></form>' +
      '<div id="hashcodRegistrationCodeReceipt"><div class="hashcod-registration-code-card"><div class="hashcod-registration-code-kicker">HASHCOD PRIVATE CODE</div><h2>Registro preparado</h2><p>Guarda este código para confirmar tu solicitud.</p><code id="hashcodRegistrationPrivateCode"></code><div class="hashcod-registration-code-actions"><button type="button" id="hashcodRegistrationCopyCode">COPIAR</button><button type="button" id="hashcodRegistrationContinueAfterCode">ENTRAR A HASHCOD CODESPACE</button></div><span class="hashcod-registration-code-copy-status" id="hashcodRegistrationCopyStatus"></span></div></div>';
  }

  function parseAdult(value) {
    const raw = String(value || '').trim();
    const match = raw.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
    if (!match) return /^\d{1,3}$/.test(raw) && Number(raw) >= 18;
    const d = Number(match[1]), m = Number(match[2]), y = Number(match[3]);
    const b = new Date(y, m - 1, d);
    if (b.getFullYear() !== y || b.getMonth() !== m - 1 || b.getDate() !== d) return false;
    const t = new Date();
    let age = t.getFullYear() - y;
    if (t.getMonth() < m - 1 || (t.getMonth() === m - 1 && t.getDate() < d)) age -= 1;
    return age >= 18 && age <= 120;
  }

  function hint(id, text, bad) {
    const h = document.querySelector('[data-hint-for="' + id + '"]');
    const i = byId(id);
    if (h) { h.textContent = text; h.classList.toggle('is-error', !!bad); }
    if (i) i.setAttribute('aria-invalid', bad ? 'true' : 'false');
  }

  function validFile(show) {
    if (!selectedFile) { if (show) hint('hashcodRegCodeFile', 'Sube la explicación del code de tu plataforma. Máximo 30 MB.', true); return false; }
    if (selectedFile.size > MAX_FILE_BYTES) { if (show) hint('hashcodRegCodeFile', 'El archivo supera 30 MB.', true); return false; }
    if (show) hint('hashcodRegCodeFile', 'Archivo cargado: ' + selectedFile.name, false);
    return true;
  }

  function validate(show) {
    let ok = true;
    const name = byId('hashcodRegFullName').value.trim();
    const cedula = byId('hashcodRegCedula').value.trim();
    const platform = byId('hashcodRegPlatformName').value.trim();
    const email = byId('hashcodRegEmail').value.trim();
    const phone = byId('hashcodRegPhone').value.trim();
    if (name.split(/\s+/).filter(Boolean).length < 2) { ok = false; if (show) hint('hashcodRegFullName', 'Escribe al menos nombre y apellido.', true); } else if (show) hint('hashcodRegFullName', 'Nombre listo.', false);
    if (!parseAdult(byId('hashcodRegAge').value)) { ok = false; if (show) hint('hashcodRegAge', 'Debes tener 18 años o más. Usa dd/mm/aaaa.', true); } else if (show) hint('hashcodRegAge', 'Edad verificada: +18.', false);
    if (!/^\d{3}-\d{7}-\d$/.test(cedula)) { ok = false; if (show) hint('hashcodRegCedula', 'Formato requerido: 000-0000000-0.', true); } else if (show) hint('hashcodRegCedula', 'Cédula válida.', false);
    if (platform.length < 2) { ok = false; if (show) hint('hashcodRegPlatformName', 'Escribe el nombre de la plataforma.', true); } else if (show) hint('hashcodRegPlatformName', 'Nombre listo.', false);
    if (!/^\S+@\S+\.\S+$/.test(email)) { ok = false; if (show) hint('hashcodRegEmail', 'Escribe un correo válido.', true); } else if (show) hint('hashcodRegEmail', 'Correo válido.', false);
    if (phone.replace(/\D/g, '').length < 10) { ok = false; if (show) hint('hashcodRegPhone', 'Escribe un teléfono válido.', true); } else if (show) hint('hashcodRegPhone', 'Teléfono válido.', false);
    if (!validFile(show)) ok = false;
    if (!byId('hashcodRegistrationConsent').checked) ok = false;
    return ok;
  }

  function progress() {
    const checks = [
      byId('hashcodRegFullName').value.trim().split(/\s+/).filter(Boolean).length >= 2,
      parseAdult(byId('hashcodRegAge').value), /^\d{3}-\d{7}-\d$/.test(byId('hashcodRegCedula').value.trim()),
      byId('hashcodRegPlatformName').value.trim().length >= 2, validFile(false), /^\S+@\S+\.\S+$/.test(byId('hashcodRegEmail').value.trim()),
      byId('hashcodRegPhone').value.replace(/\D/g, '').length >= 10, byId('hashcodRegistrationConsent').checked
    ];
    const pct = Math.round(checks.filter(Boolean).length / checks.length * 100);
    byId('hashcodRegistrationProgressValue').textContent = pct + '%';
    byId('hashcodRegistrationProgressIndicator').style.transform = 'scaleX(' + pct / 100 + ')';
  }

  function code() { return 'HC-' + new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14) + '-' + Math.random().toString(36).slice(2, 8).toUpperCase(); }
  function status(text, type) { const s = byId('hashcodRegistrationStatus'); if (!s) return; s.textContent = text || ''; s.classList.toggle('is-error', type === 'error'); s.classList.toggle('is-success', type === 'success'); }

  function bind() {
    const root = byId(ROOT_ID);
    root.querySelectorAll('input').forEach(function (input) { input.addEventListener('input', progress); input.addEventListener('change', progress); });
    byId('hashcodRegCodeButton').addEventListener('click', function () { byId('hashcodRegCodeFile').click(); });
    byId('hashcodRegCodeFile').addEventListener('change', function (event) { selectedFile = event.target.files && event.target.files[0] || null; byId('hashcodRegCodeButton').classList.toggle('is-loaded', !!selectedFile); validFile(true); progress(); });
    byId('hashcodTemporaryAccessButton').addEventListener('click', function () { status('Completa el registro para entrar a la plataforma.', 'error'); });
    byId('hashcodRegistrationCopyCode').addEventListener('click', async function () { const text = byId('hashcodRegistrationPrivateCode').textContent || ''; try { await navigator.clipboard.writeText(text); byId('hashcodRegistrationCopyStatus').textContent = 'Código copiado.'; } catch (_) { byId('hashcodRegistrationCopyStatus').textContent = 'Cópialo manualmente.'; } });
    byId('hashcodRegistrationContinueAfterCode').addEventListener('click', function () { if (resolved) return; resolved = true; byId('hashcodRegistrationCodeReceipt').classList.remove('is-open'); resolveSubmission({ ok: true, payload: submittedPayload }); });
    byId('hashcodRegistrationForm').addEventListener('submit', function (event) {
      event.preventDefault();
      if (!validate(true)) { status('Revisa los campos marcados antes de enviar.', 'error'); progress(); return; }
      const privateCode = code();
      submittedPayload = { fullName: byId('hashcodRegFullName').value.trim(), platformName: byId('hashcodRegPlatformName').value.trim(), privateCode: privateCode, createdAt: new Date().toISOString() };
      try { localStorage.setItem('hashcod_platform_registration_latest', JSON.stringify(submittedPayload)); } catch (_) {}
      byId('hashcodRegistrationPrivateCode').textContent = privateCode;
      byId('hashcodRegistrationCodeReceipt').classList.add('is-open');
      byId('hashcodRegistrationWhatsappButton').disabled = false;
      status('Registro preparado. Guarda el código y continúa.', 'success');
    });
    progress();
  }

  function removeDirectOnly() {
    ['hashcodDirectRegistration', 'hashcodHeroUIColorPicker', 'hcCodeModal'].forEach(function (id) { const n = byId(id); if (n && n.parentNode) n.parentNode.removeChild(n); });
  }

  function mount() {
    ensureStyle();
    removeDirectOnly();
    document.documentElement.dataset.hashcodFinalEntryScreen = 'true';
    document.documentElement.removeAttribute('data-hashcod-registration-retired');
    let root = byId(ROOT_ID);
    if (!root) {
      root = document.createElement('section');
      root.id = ROOT_ID;
      document.body.appendChild(root);
    }
    root.dataset.hashcodScreen = '3';
    root.dataset.hashcodRegistrationRestored = 'true';
    if (!byId('hashcodRegistrationForm')) { root.innerHTML = formHtml(); bind(); }
    return root;
  }

  function callOriginalEntry() {
    const current = window.l8EnterPlatform;
    const original = current && (current.__hashcodHoldOriginal || current.__hashcodMotionOriginal || current.__hashcodOriginal || null);
    if (typeof original === 'function') { try { original.call(window); return true; } catch (_) {} }
    return false;
  }

  async function completePlatformEntry() {
    document.documentElement.dataset.hashcodPlatformEntered = 'true';
    document.documentElement.removeAttribute('data-hashcod-final-entry-screen');
    document.documentElement.removeAttribute('data-hashcod-direct-registration');
    document.body.classList.remove('hashcod-direct-registration-open', 'auth-locked', 'boot-locked');
    const root = byId(ROOT_ID);
    if (root) { root.classList.add('is-completing'); window.setTimeout(function () { if (root.parentNode) root.parentNode.removeChild(root); }, 180); }
    callOriginalEntry();
    emit('hashcod:platform-entered', { source: 'platform-registration-form', version: VERSION, registration: 'restored' });
    return true;
  }

  window.HashcodPlatformRegistration = {
    version: VERSION,
    registrationRetired: false,
    registrationRestored: true,
    preservesEntryAnimations: true,
    mount: mount,
    completePlatformEntry: completePlatformEntry,
    waitForSuccessfulSubmission: function () { return submissionPromise; },
    hasDispatchedWhatsapp: function () { return !!submittedPayload; },
    isSaved: function () { return !!submittedPayload; },
    diagnostics: function () { return { ok: true, version: VERSION, registrationRestored: true, mounted: !!byId(ROOT_ID), submitted: !!submittedPayload }; }
  };

  emit('hashcod:registration-restored', { source: 'platform-registration-form', version: VERSION });
})();