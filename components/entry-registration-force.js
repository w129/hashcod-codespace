(function () {
  'use strict';

  var VERSION = '20260922-direct8-minimal-stable';
  if (window.__hashcodEntryRegistrationForceLoaded === VERSION) return;
  window.__hashcodEntryRegistrationForceLoaded = VERSION;

  var MAX_FILE_BYTES = 30 * 1024 * 1024;
  var ALLOWED_FILE = /\.(zip|tar|gz|txt|md|json|js|jsx|ts|tsx|html?|css|php|py|java|go|rs|cs|c|cc|cpp|h|hpp|sql|xml|ya?ml|toml|sh|coffee)$/i;
  var WHATSAPP_NUMBER = '18294721257';
  var selectedFile = null;

  function byId(id) { return document.getElementById(id); }
  function text(value) { return String(value == null ? '' : value); }
  function digits(value) { return text(value).replace(/\D+/g, ''); }
  function escapeHtml(value) {
    return text(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function formatCedula(value) {
    var raw = digits(value).slice(0, 11);
    if (raw.length <= 3) return raw;
    if (raw.length <= 10) return raw.slice(0, 3) + '-' + raw.slice(3);
    return raw.slice(0, 3) + '-' + raw.slice(3, 10) + '-' + raw.slice(10);
  }
  function markGateReady() {
    window.__hashcodPlatformEntryHoldReady = true;
    document.documentElement.dataset.hashcodEntryGateReady = 'true';
    try { window.dispatchEvent(new CustomEvent('hashcod:entry-gate-ready', { detail: { source: 'entry-registration-force', version: VERSION } })); } catch (_) {}
  }
  function remove(id) {
    var node = byId(id);
    if (node && node.parentNode) node.parentNode.removeChild(node);
  }

  function installStyles() {
    if (byId('hashcodDirectStableStyles')) return;
    var css = document.createElement('style');
    css.id = 'hashcodDirectStableStyles';
    css.textContent = [
      'html.hashcod-direct-open,body.hashcod-direct-open{overflow:hidden!important;}',
      'body.hashcod-direct-open #bootCliOverlay,body.hashcod-direct-open #hashcodEntryHold,body.hashcod-direct-open #hashcodEntryForceButton,body.hashcod-direct-open #hashcodHoldContinue{display:none!important;visibility:hidden!important;pointer-events:none!important;}',
      '#hashcodDirectRegistration{position:fixed;inset:0;z-index:2147483645;background:#f6f6f3;background-image:linear-gradient(rgba(20,20,20,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(20,20,20,.045) 1px,transparent 1px);background-size:38px 38px;display:flex;align-items:center;justify-content:center;padding:18px;color:#111;font-family:"IBM Plex Mono",Consolas,monospace;}',
      '.hcd-card{width:min(1040px,calc(100vw - 32px));max-height:calc(100vh - 32px);overflow:auto;background:#fff;border:1px solid #bdbdb8;border-radius:16px;box-shadow:0 24px 70px rgba(0,0,0,.18);padding:28px;}',
      '.hcd-head{display:flex;justify-content:space-between;gap:18px;border-bottom:1px solid #e3e3de;padding-bottom:18px;margin-bottom:20px;}',
      '.hcd-kicker{margin:0 0 8px;color:#6b6b65;font-size:11px;letter-spacing:.18em;font-weight:900;}',
      '.hcd-title{margin:0;font-size:clamp(30px,4vw,52px);line-height:.95;letter-spacing:-.07em;font-weight:950;}',
      '.hcd-subtitle{margin:10px 0 0;color:#555;line-height:1.55;font-size:14px;max-width:720px;}',
      '.hcd-badge{align-self:flex-start;border:1px solid #111;border-radius:999px;background:#111;color:#fff;padding:9px 12px;font-size:11px;font-weight:900;white-space:nowrap;}',
      '.hcd-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;}',
      '.hcd-field{display:grid;gap:7px;}',
      '.hcd-field.wide,.hcd-progress,.hcd-consent,.hcd-faq{grid-column:1/-1;}',
      '.hcd-field label{font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:.08em;color:#3d3d38;}',
      '.hcd-field input{height:48px;border:1px solid #bdbdb8;border-radius:10px;padding:0 14px;background:#fbfbf9;color:#111;font:700 15px/1 "IBM Plex Mono",Consolas,monospace;outline:none;}',
      '.hcd-field input:focus{border-color:#111;box-shadow:0 0 0 3px rgba(0,0,0,.08);}',
      '.hcd-hint{min-height:16px;color:#6a6a64;font-size:11px;}',
      '.hcd-hint.err{color:#b3261e;font-weight:900;}',
      '.hcd-upload{display:grid;grid-template-columns:1fr 54px;gap:10px;}',
      '.hcd-upload button,.hcd-actions button,.hcd-code-actions button{height:46px;border:1px solid #111;border-radius:10px;background:#fff;color:#111;font:900 11px/1 "IBM Plex Mono",Consolas,monospace;letter-spacing:.06em;text-transform:uppercase;cursor:pointer;}',
      '.hcd-upload button.ok{background:#111;color:#fff;}',
      '.hcd-progress{border:1px solid #d8d8d3;border-radius:12px;background:#fafaf8;padding:14px;}',
      '.hcd-progress-top{display:flex;justify-content:space-between;font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:.06em;}',
      '.hcd-track{height:10px;background:#ecece7;border-radius:999px;overflow:hidden;margin-top:10px;}',
      '.hcd-bar{display:block;height:100%;width:0;background:#111;border-radius:999px;}',
      '.hcd-progress small{display:block;margin-top:8px;color:#676761;}',
      '.hcd-consent{display:grid;grid-template-columns:22px 1fr;gap:10px;border:1px solid #d8d8d3;border-radius:12px;background:#fafaf8;padding:14px;font-size:13px;line-height:1.45;}',
      '.hcd-consent a{color:#111;font-weight:900;text-decoration:underline;}',
      '.hcd-actions{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:18px;}',
      '.hcd-submit{background:#111!important;color:#fff!important;min-width:245px;}',
      '.hcd-submit:disabled,.hcd-whatsapp:disabled{opacity:.45;cursor:not-allowed;}',
      '.hcd-note{display:flex;align-items:center;min-height:38px;border:1px solid #d8d8d3;border-radius:10px;background:#fafaf8;padding:0 12px;font-size:12px;font-weight:800;}',
      '.hcd-faq{margin-top:20px;border:1px solid #d8d8d3;border-radius:12px;background:#fbfbf9;overflow:hidden;}',
      '.hcd-faq details+details{border-top:1px solid #e5e5df;}',
      '.hcd-faq summary{cursor:pointer;padding:15px;font-size:13px;font-weight:900;}',
      '.hcd-faq .inner{padding:0 15px 15px;color:#555;font-size:13px;line-height:1.5;}',
      '.hcd-price{display:grid;gap:10px;}',
      '.hcd-price div{display:flex;justify-content:space-between;gap:16px;border-bottom:1px solid #e3e3de;padding-bottom:9px;}',
      '.hcd-price div:last-child{border-bottom:0;padding-bottom:0;}',
      '.hcd-status{min-height:22px;margin:14px 0 0;color:#555;font-size:13px;font-weight:900;}',
      '#hashcodDirectReceipt{position:fixed;inset:0;z-index:2147483646;background:rgba(246,246,243,.94);display:flex;align-items:center;justify-content:center;padding:18px;}',
      '.hcd-code{width:min(620px,calc(100vw - 36px));background:#fff;border:1px solid #bdbdb8;border-radius:14px;padding:24px;box-shadow:0 24px 70px rgba(0,0,0,.18);font-family:"IBM Plex Mono",Consolas,monospace;}',
      '.hcd-code code{display:block;background:#111;color:#fff;border-radius:10px;padding:14px;margin:14px 0;word-break:break-all;}',
      '.hcd-code-actions{display:flex;gap:10px;flex-wrap:wrap;}',
      '@media(max-width:720px){.hcd-card{padding:18px}.hcd-head{display:grid}.hcd-grid{grid-template-columns:1fr}.hcd-upload{grid-template-columns:1fr 48px}.hcd-actions button,.hcd-submit{width:100%}.hcd-price div{display:grid;gap:4px}}'
    ].join('\n');
    document.head.appendChild(css);
  }

  function formHtml() {
    return [
      '<section id="hashcodDirectRegistration" aria-label="Registro Hashcod Codespace">',
      '<div class="hcd-card" role="dialog" aria-modal="true">',
      '<header class="hcd-head"><div><p class="hcd-kicker">HASHCOD / REGISTRO / +18</p><h1 class="hcd-title">Registro de plataforma</h1><p class="hcd-subtitle">Completa los datos solicitados para registrar tu plataforma. Todos los campos son obligatorios.</p></div><span class="hcd-badge">18+ ONLY</span></header>',
      '<form id="hcdForm" novalidate autocomplete="off">',
      '<div class="hcd-grid">',
      fieldHtml('Nombre con apellidos','hcdName','full_name','Nombre y apellidos','wide'),
      fieldHtml('Edad','hcdAge','age','18',''),
      fieldHtml('Cédula con guiones','hcdCedula','cedula','000-0000000-0',''),
      '<div class="hcd-field wide"><label for="hcdPlatform">Nombre de su plataforma</label><div class="hcd-upload"><input id="hcdPlatform" name="platform_name" maxlength="120" required placeholder="Nombre de la plataforma"><input id="hcdFile" type="file" hidden accept=".zip,.tar,.gz,.txt,.md,.json,.js,.jsx,.ts,.tsx,.html,.htm,.css,.php,.py,.java,.go,.rs,.cs,.c,.cc,.cpp,.h,.hpp,.sql,.xml,.yaml,.yml,.toml,.sh,.coffee"><button id="hcdFileBtn" type="button">Subir</button></div><span class="hcd-hint" data-hint="file">Sube la explicación del code de tu plataforma. Máximo 30 MB.</span></div>',
      fieldHtml('Correo electrónico','hcdEmail','email','',''),
      fieldHtml('Número de teléfono','hcdPhone','phone','+1 809 000 0000',''),
      '<div class="hcd-progress" id="hcdProgress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><div class="hcd-progress-top"><span>Progreso del formulario</span><span id="hcdPercent">0%</span></div><div class="hcd-track"><span class="hcd-bar" id="hcdBar"></span></div><small id="hcdProgressHint">Completa todos los campos para habilitar la aceptación.</small></div>',
      '<label class="hcd-consent"><input id="hcdConsent" type="checkbox" required><span>Confirmo que tengo 18 años o más. He leído y acepto contractualmente el <a href="privacy" target="_blank" rel="noopener">Documento Contractual y de Privacidad</a>.</span></label>',
      '</div>',
      '<div class="hcd-actions"><button id="hcdTemp" type="button">Acceso temporal</button><button class="hcd-submit" id="hcdSubmit" type="submit" disabled>Entrar a Hashcod Codespace</button><button class="hcd-whatsapp" id="hcdWhatsApp" type="button" disabled>WhatsApp</button><button id="hcdBack" type="button">Volver</button><div class="hcd-note">Haciendo que tu proyecto hecho por IA tenga validez legal</div></div>',
      '<div class="hcd-faq"><details><summary>¿Cómo sé que esto no es una estafa?</summary><div class="inner">Ve a donde dice <strong>Documento Contractual y de Privacidad</strong>.</div></details><details><summary>¿Cuánto cobran?</summary><div class="inner"><div class="hcd-price"><div><span>Por someter a solicitud</span><strong>RD$567</strong></div><div><span>Por revisar tu code o lo que sea que hagas con IA</span><strong>RD$2,000</strong></div><div><span>Por alojar tu plataforma en nuestro codespace post-cuántico</span><strong>RD$6,900</strong></div><div><span>Por la Certificación</span><strong>RD$10,000</strong></div><div><span>Aquilar en la primera plaza</span><strong>US$ 78</strong></div></div></div></details><details><summary>¿Cuándo estará lista la Plataforma?</summary><div class="inner">Lo avisaremos por nuestras redes sociales (<strong>hashcod.app</strong>).</div></details></div>',
      '<p class="hcd-status" id="hcdStatus" role="status" aria-live="polite"></p>',
      '</form></div></section>'
    ].join('');
  }

  function fieldHtml(label, id, name, placeholder, extraClass) {
    var type = name === 'email' ? 'email' : name === 'age' ? 'number' : name === 'phone' ? 'tel' : 'text';
    var attrs = name === 'age' ? ' min="18" max="120" inputmode="numeric"' : name === 'cedula' ? ' maxlength="13" inputmode="numeric"' : name === 'phone' ? ' maxlength="25"' : name === 'full_name' || name === 'platform_name' ? ' maxlength="120"' : '';
    return '<div class="hcd-field ' + (extraClass || '') + '"><label for="' + id + '">' + label + '</label><input id="' + id + '" name="' + name + '" type="' + type + '" required placeholder="' + placeholder + '"' + attrs + '><span class="hcd-hint" data-hint="' + name + '"></span></div>';
  }

  function values() {
    return { name: byId('hcdName'), age: byId('hcdAge'), cedula: byId('hcdCedula'), platform: byId('hcdPlatform'), email: byId('hcdEmail'), phone: byId('hcdPhone'), consent: byId('hcdConsent') };
  }

  function setHint(key, message, bad) {
    var el = document.querySelector('#hashcodDirectRegistration [data-hint="' + key + '"]');
    if (!el) return;
    el.textContent = message || '';
    el.classList.toggle('err', !!bad);
  }

  function validate() {
    var v = values();
    var ageNum = Number(v.age && v.age.value);
    var ok = {
      full_name: !!(v.name && fullNameValid(v.name.value)),
      age: Number.isInteger(ageNum) && ageNum >= 18 && ageNum <= 120,
      cedula: !!(v.cedula && /^\d{3}-\d{7}-\d$/.test(v.cedula.value)),
      platform_name: !!(v.platform && v.platform.value.trim().length >= 2),
      file: !!selectedFile,
      email: !!(v.email && v.email.value && v.email.checkValidity()),
      phone: !!(v.phone && validPhone(v.phone.value)),
      consent: !!(v.consent && v.consent.checked)
    };
    var keys = Object.keys(ok);
    var done = keys.filter(function (k) { return ok[k]; }).length;
    var percent = Math.round(done / keys.length * 100);
    var bar = byId('hcdBar'), percentEl = byId('hcdPercent'), progress = byId('hcdProgress'), hint = byId('hcdProgressHint'), submit = byId('hcdSubmit'), wa = byId('hcdWhatsApp');
    if (bar) bar.style.width = percent + '%';
    if (percentEl) percentEl.textContent = percent + '%';
    if (progress) progress.setAttribute('aria-valuenow', String(percent));
    if (hint) hint.textContent = percent === 100 ? 'Formulario listo. Ya puedes continuar.' : 'Completa todos los campos para habilitar la aceptación.';
    if (submit) submit.disabled = percent !== 100;
    if (wa) wa.disabled = percent !== 100;
    setHint('full_name', ok.full_name ? 'Nombre válido.' : 'Escribe al menos nombre y apellido.', !ok.full_name && v.name && v.name.value);
    setHint('age', ok.age ? 'Edad confirmada.' : 'Debes tener 18 años o más.', !ok.age && v.age && v.age.value);
    setHint('cedula', ok.cedula ? 'Cédula válida.' : 'Formato requerido: 000-0000000-0.', !ok.cedula && v.cedula && v.cedula.value);
    setHint('platform_name', ok.platform_name ? 'Nombre de plataforma válido.' : 'Escribe el nombre de la plataforma.', !ok.platform_name && v.platform && v.platform.value);
    setHint('file', selectedFile ? 'Archivo seleccionado: ' + selectedFile.name : 'Sube la explicación del code de tu plataforma. Máximo 30 MB.', !selectedFile);
    setHint('email', ok.email ? 'Correo válido.' : 'Escribe un correo electrónico válido.', !ok.email && v.email && v.email.value);
    setHint('phone', ok.phone ? 'Teléfono válido.' : 'Escribe un número de teléfono válido.', !ok.phone && v.phone && v.phone.value);
    return percent === 100;
  }

  function finishEntry() {
    document.documentElement.classList.remove('hashcod-direct-open');
    document.body.classList.remove('hashcod-direct-open', 'auth-locked', 'boot-locked');
    document.documentElement.dataset.hashcodPlatformEntered = 'true';
    remove('hashcodDirectRegistration');
    remove('hashcodDirectReceipt');
    remove('bootCliOverlay');
    remove('hashcodEntryHold');
    try { window.dispatchEvent(new CustomEvent('hashcod:platform-entered', { detail: { source: 'entry-registration-force', version: VERSION } })); } catch (_) {}
  }

  function makeCode() {
    var bytes = new Uint8Array(12);
    try { crypto.getRandomValues(bytes); } catch (_) { for (var i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256); }
    var hex = Array.prototype.map.call(bytes, function (b) { return b.toString(16).padStart(2, '0').toUpperCase(); }).join('');
    return 'HSC-REG-' + hex.replace(/(.{4})/g, '$1-').replace(/-$/, '');
  }

  function showReceipt() {
    var code = makeCode();
    remove('hashcodDirectReceipt');
    var receipt = document.createElement('section');
    receipt.id = 'hashcodDirectReceipt';
    receipt.innerHTML = '<div class="hcd-code"><p class="hcd-kicker">HASHCOD · REGISTRATION CODE</p><h2>Guarda tu código criptográfico</h2><p>Este código identifica este registro. Se muestra en claro solamente en esta confirmación.</p><code>' + escapeHtml(code) + '</code><div class="hcd-code-actions"><button id="hcdCopy" type="button">Copiar código</button><button id="hcdContinue" type="button">Continuar a Hashcod</button></div><p class="hcd-status" id="hcdCopyStatus"></p></div>';
    document.body.appendChild(receipt);
    byId('hcdContinue').addEventListener('click', finishEntry);
    byId('hcdCopy').addEventListener('click', function () {
      var status = byId('hcdCopyStatus');
      if (navigator.clipboard) navigator.clipboard.writeText(code).then(function () { if (status) status.textContent = 'Código copiado.'; }).catch(function () { if (status) status.textContent = 'Copia manualmente el código.'; });
      else if (status) status.textContent = 'Copia manualmente el código.';
    });
  }

  function bindForm() {
    var v = values();
    Object.keys(v).forEach(function (key) {
      var el = v[key];
      if (!el) return;
      el.addEventListener('input', function () { if (key === 'cedula') el.value = formatCedula(el.value); validate(); });
      el.addEventListener('change', validate);
    });
    var fileInput = byId('hcdFile'), fileBtn = byId('hcdFileBtn'), form = byId('hcdForm'), back = byId('hcdBack'), wa = byId('hcdWhatsApp'), temp = byId('hcdTemp');
    if (fileBtn && fileInput) fileBtn.addEventListener('click', function () { fileInput.click(); });
    if (fileInput && fileBtn) fileInput.addEventListener('change', function () {
      var file = fileInput.files && fileInput.files[0];
      var status = byId('hcdStatus');
      selectedFile = null;
      fileBtn.classList.remove('ok');
      if (file) {
        if (file.size > MAX_FILE_BYTES) { fileInput.value = ''; if (status) status.textContent = 'El archivo supera el máximo de 30 MB.'; }
        else if (!ALLOWED_FILE.test(file.name)) { fileInput.value = ''; if (status) status.textContent = 'Tipo de archivo no permitido.'; }
        else { selectedFile = file; fileBtn.classList.add('ok'); if (status) status.textContent = 'Archivo de code seleccionado.'; }
      }
      validate();
    });
    if (form) form.addEventListener('submit', function (event) { event.preventDefault(); event.stopPropagation(); if (validate()) showReceipt(); else { var st = byId('hcdStatus'); if (st) st.textContent = 'Completa correctamente todos los campos y acepta el documento contractual.'; } }, true);
    if (back) back.addEventListener('click', function () { document.body.classList.remove('hashcod-direct-open'); document.documentElement.classList.remove('hashcod-direct-open'); selectedFile = null; remove('hashcodDirectRegistration'); ensureEntryButton(); });
    if (wa) wa.addEventListener('click', function () {
      if (!validate()) return;
      var vv = values();
      var msg = ['Solicitud Hashcod Codespace', 'Nombre: ' + vv.name.value, 'Edad: ' + vv.age.value, 'Cédula: ' + vv.cedula.value, 'Plataforma: ' + vv.platform.value, 'Correo: ' + vv.email.value, 'Teléfono: ' + vv.phone.value, 'Archivo: ' + (selectedFile ? selectedFile.name : 'no seleccionado')].join('\n');
      window.open('https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(msg), '_blank', 'noopener');
    });
    if (temp) temp.addEventListener('click', finishEntry);
    validate();
  }

  function openRegistration() {
    markGateReady();
    installStyles();
    selectedFile = null;
    document.documentElement.classList.add('hashcod-direct-open');
    document.body.classList.add('hashcod-direct-open');
    remove('hashcodDirectRegistration');
    var host = document.createElement('div');
    host.id = 'hashcodDirectRegistration';
    host.innerHTML = '<div class="hcd-card"><p class="hcd-kicker">HASHCOD / REGISTRO</p><h2>Preparando registro…</h2><p class="hcd-status">Cargando formulario seguro.</p></div>';
    document.body.appendChild(host);
    window.setTimeout(function () {
      host.outerHTML = formHtml();
      bindForm();
      var first = byId('hcdName');
      if (first) first.focus();
    }, 30);
  }

  function ensureEntryButton() {
    markGateReady();
    installStyles();
    if (byId('hashcodDirectRegistration')) return;
    var bootButton = byId('bootCliEnter');
    if (bootButton) { bootButton.disabled = false; bootButton.removeAttribute('aria-busy'); bootButton.dataset.hashcodDirectEntryReady = 'true'; return; }
    if (!byId('hashcodEntryForceButton') && document.body) {
      var button = document.createElement('button');
      button.id = 'hashcodEntryForceButton';
      button.type = 'button';
      button.textContent = 'ENTER PLATFORM ↵';
      document.body.appendChild(button);
    }
  }

  function onEntryClick(event) {
    var target = event.target;
    var button = target && target.closest ? target.closest('#bootCliEnter,#hashcodEntryForceButton,#hashcodHoldContinue') : null;
    if (!button) return;
    markGateReady();
    event.preventDefault();
    event.stopPropagation();
    if (event.stopImmediatePropagation) event.stopImmediatePropagation();
    var original = button.textContent || 'ENTER PLATFORM';
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    button.textContent = 'ABRIENDO REGISTRO';
    window.setTimeout(function () {
      try { openRegistration(); }
      catch (error) {
        console.error('[Hashcod] registration open failed', error);
        button.disabled = false;
        button.removeAttribute('aria-busy');
        button.textContent = original;
        alert('No se pudo abrir el registro. Recarga la página y vuelve a intentarlo.');
      }
    }, 0);
  }

  function boot() {
    markGateReady();
    ensureEntryButton();
    document.addEventListener('click', onEntryClick, true);
    [100, 400, 1000, 2500].forEach(function (delay) { window.setTimeout(ensureEntryButton, delay); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
