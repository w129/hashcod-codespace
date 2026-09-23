(function () {
  'use strict';

  var VERSION = '20260922-direct9-immediate-form';
  if (window.__hashcodEntryRegistrationForceLoaded === VERSION) return;
  window.__hashcodEntryRegistrationForceLoaded = VERSION;

  var MAX_FILE_BYTES = 30 * 1024 * 1024;
  var ALLOWED_FILE = /\.(zip|tar|gz|txt|md|json|js|jsx|ts|tsx|html?|css|php|py|java|go|rs|cs|c|cc|cpp|h|hpp|sql|xml|ya?ml|toml|sh|coffee)$/i;
  var WHATSAPP_NUMBER = '18294721257';
  var selectedFile = null;

  function byId(id) { return document.getElementById(id); }
  function clean(value) { return String(value == null ? '' : value).trim(); }
  function digits(value) { return String(value || '').replace(/\D+/g, ''); }
  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
  function formatCedula(value) {
    var raw = digits(value).slice(0, 11);
    if (raw.length <= 3) return raw;
    if (raw.length <= 10) return raw.slice(0, 3) + '-' + raw.slice(3);
    return raw.slice(0, 3) + '-' + raw.slice(3, 10) + '-' + raw.slice(10);
  }
  function fullNameValid(value) { return /^\S+\s+\S+/u.test(clean(value)) && clean(value).length >= 4; }
  function cedulaValid(value) { return /^\d{3}-\d{7}-\d$/.test(clean(value)); }
  function phoneValid(value) { return /^\+?[0-9][0-9\s().-]{6,24}$/.test(clean(value)); }

  function markGateReady() {
    window.__hashcodPlatformEntryHoldReady = true;
    document.documentElement.dataset.hashcodEntryGateReady = 'true';
    try { window.dispatchEvent(new CustomEvent('hashcod:entry-gate-ready', { detail: { source: 'entry-registration-force', version: VERSION } })); } catch (_) {}
  }

  function installStyles() {
    if (byId('hashcodDirectRegistrationStyles')) return;
    var style = document.createElement('style');
    style.id = 'hashcodDirectRegistrationStyles';
    style.textContent = [
      '#hashcodDirectRegistration{position:fixed!important;inset:0!important;z-index:2147483645!important;overflow:auto!important;background:#f6f6f3!important;background-image:linear-gradient(rgba(20,20,20,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(20,20,20,.045) 1px,transparent 1px)!important;background-size:38px 38px!important;color:#111!important;font-family:"IBM Plex Mono",Consolas,monospace!important;padding:26px!important;}',
      '#hashcodDirectRegistration *{box-sizing:border-box}',
      '.hc-reg-card{width:min(1060px,calc(100vw - 24px));margin:0 auto;background:#fff;border:1px solid #bdbdb8;border-radius:14px;box-shadow:0 24px 70px rgba(0,0,0,.16);padding:26px}',
      '.hc-reg-head{display:flex;justify-content:space-between;gap:16px;border-bottom:1px solid #e5e5df;padding-bottom:18px;margin-bottom:18px}.hc-reg-kicker{margin:0 0 8px;color:#6b6b66;font:900 11px/1 monospace;letter-spacing:.18em}.hc-reg-title{margin:0;font-size:clamp(32px,5vw,58px);line-height:.9;letter-spacing:-.08em}.hc-reg-sub{margin:10px 0 0;color:#555;line-height:1.55}.hc-reg-badge{height:max-content;border:1px solid #111;background:#111;color:#fff;border-radius:999px;padding:9px 12px;font:900 11px/1 monospace;white-space:nowrap}',
      '.hc-reg-grid{display:grid;grid-template-columns:1fr 1fr;gap:15px}.hc-reg-field{display:grid;gap:7px}.hc-reg-wide,.hc-reg-progress,.hc-reg-consent,.hc-reg-faq,.hc-reg-status{grid-column:1/-1}.hc-reg-field label{font:900 11px/1 monospace;letter-spacing:.08em;text-transform:uppercase;color:#333}.hc-reg-field input{height:48px;border:1px solid #bdbdb8;border-radius:10px;background:#fbfbf9;padding:0 14px;font:700 15px/1 monospace;outline:none}.hc-reg-field input:focus{border-color:#111;box-shadow:0 0 0 3px rgba(0,0,0,.08)}.hc-reg-field input.is-bad{border-color:#b3261e;background:#fff8f7}.hc-reg-hint{min-height:16px;color:#666;font-size:11px}.hc-reg-hint.is-error{color:#b3261e;font-weight:900}',
      '.hc-upload-row{display:grid;grid-template-columns:1fr 56px;gap:10px}.hc-upload-btn{height:48px;border:1px solid #111;border-radius:10px;background:#fff;color:#111;font:900 18px/1 monospace;cursor:pointer}.hc-upload-btn.is-ok{background:#111;color:#fff}',
      '.hc-reg-progress{border:1px solid #d8d8d3;background:#fafaf8;border-radius:12px;padding:14px}.hc-progress-top{display:flex;justify-content:space-between;font:900 12px/1 monospace;letter-spacing:.06em;text-transform:uppercase}.hc-progress-track{height:10px;background:#ecece7;border-radius:999px;overflow:hidden;margin-top:10px}.hc-progress-bar{display:block;width:0%;height:100%;background:#111;border-radius:999px;transition:width .18s ease}.hc-progress-hint{display:block;margin-top:9px;color:#666;font-size:12px}',
      '.hc-reg-consent{display:grid;grid-template-columns:22px 1fr;gap:10px;border:1px solid #d8d8d3;border-radius:12px;background:#fafaf8;padding:14px;font-size:13px;line-height:1.5}.hc-reg-consent a{color:#111;font-weight:900;text-decoration:underline}',
      '.hc-reg-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:18px}.hc-reg-actions button{height:46px;border:1px solid #111;border-radius:10px;padding:0 16px;font:900 11px/1 monospace;letter-spacing:.06em;text-transform:uppercase;cursor:pointer}.hc-main-btn{background:#111;color:#fff;min-width:245px}.hc-main-btn:disabled,.hc-wa-btn:disabled{opacity:.45;cursor:not-allowed}.hc-side-btn{background:#fff;color:#111}',
      '.hc-note{display:flex;align-items:center;min-height:46px;padding:0 12px;border:1px solid #d8d8d3;border-radius:10px;background:#fafaf8;font-size:12px;font-weight:800}.hc-reg-status{min-height:22px;margin:12px 0 0;color:#555;font-weight:900}',
      '.hc-reg-faq{margin-top:18px;border:1px solid #d8d8d3;border-radius:12px;background:#fbfbf9;overflow:hidden}.hc-faq-item+.hc-faq-item{border-top:1px solid #e5e5df}.hc-faq-trigger{width:100%;display:flex;justify-content:space-between;padding:15px;border:0;background:transparent;font:900 13px/1 monospace;cursor:pointer;text-align:left}.hc-faq-panel{display:none;padding:0 15px 15px;color:#555;font-size:13px;line-height:1.5}.hc-faq-item.is-open .hc-faq-panel{display:block}.hc-price-list{display:grid;gap:10px}.hc-price-list div{display:flex;justify-content:space-between;border-bottom:1px solid #e3e3de;padding-bottom:9px;gap:14px}.hc-price-list div:last-child{border:0;padding-bottom:0}',
      '.hc-modal{position:fixed;inset:0;z-index:2147483647;display:grid;place-items:center;background:rgba(246,246,243,.94);padding:20px}.hc-modal-card{width:min(620px,calc(100vw - 30px));background:#fff;border:1px solid #bdbdb8;border-radius:14px;padding:22px;box-shadow:0 24px 70px rgba(0,0,0,.18)}.hc-modal-card code{display:block;background:#111;color:#fff;border-radius:10px;padding:14px;word-break:break-all;margin:12px 0}.hc-modal-card button{height:42px;border:1px solid #111;border-radius:10px;padding:0 14px;font:900 11px/1 monospace;text-transform:uppercase;margin-right:8px}',
      '.hashcod-direct-registration-open #bootCliOverlay,.hashcod-direct-registration-open #hashcodEntryHold,.hashcod-direct-registration-open #hashcodEntryForceButton,.hashcod-direct-registration-open #hashcodHoldContinue{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important}',
      '@media(max-width:720px){.hc-reg-card{padding:18px}.hc-reg-head{display:grid}.hc-reg-grid{grid-template-columns:1fr}.hc-upload-row{grid-template-columns:1fr 50px}.hc-reg-actions button,.hc-main-btn{width:100%}.hc-price-list div{display:grid;gap:4px}}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function formHtml() {
    return [
      '<section id="hashcodDirectRegistration" aria-label="Registro Hashcod Codespace">',
        '<div class="hc-reg-card">',
          '<header class="hc-reg-head"><div><p class="hc-reg-kicker">HASHCOD / REGISTRO / +18</p><h1 class="hc-reg-title">Registro de plataforma</h1><p class="hc-reg-sub">Completa los datos solicitados para registrar tu plataforma. Todos los campos son obligatorios.</p></div><span class="hc-reg-badge">18+ ONLY</span></header>',
          '<form id="hcRegForm" novalidate autocomplete="off">',
            '<div class="hc-reg-grid">',
              '<div class="hc-reg-field hc-reg-wide"><label>Nombre con apellidos</label><input id="hcName" required maxlength="120" autocomplete="name" placeholder="Nombre y apellidos"><span class="hc-reg-hint" id="hcNameHint">Escribe al menos nombre y apellido.</span></div>',
              '<div class="hc-reg-field"><label>Edad</label><input id="hcAge" type="number" min="18" max="120" inputmode="numeric" required placeholder="18"><span class="hc-reg-hint" id="hcAgeHint">Debes tener 18 años o más.</span></div>',
              '<div class="hc-reg-field"><label>Cédula con guiones</label><input id="hcCedula" inputmode="numeric" maxlength="13" required placeholder="000-0000000-0"><span class="hc-reg-hint" id="hcCedulaHint">Formato: 000-0000000-0.</span></div>',
              '<div class="hc-reg-field hc-reg-wide"><label>Nombre de su plataforma</label><div class="hc-upload-row"><input id="hcPlatform" required maxlength="120" placeholder="Nombre de la plataforma"><input id="hcFile" type="file" hidden accept=".zip,.tar,.gz,.txt,.md,.json,.js,.jsx,.ts,.tsx,.html,.htm,.css,.php,.py,.java,.go,.rs,.cs,.c,.cc,.cpp,.h,.hpp,.sql,.xml,.yaml,.yml,.toml,.sh,.coffee"><button id="hcUpload" class="hc-upload-btn" type="button" title="Subir código">↑</button></div><span class="hc-reg-hint" id="hcPlatformHint"></span><span class="hc-reg-hint" id="hcFileHint">Sube la explicación del code de tu plataforma. Máximo 30 MB.</span></div>',
              '<div class="hc-reg-field"><label>Correo electrónico</label><input id="hcEmail" type="email" required autocomplete="email"><span class="hc-reg-hint" id="hcEmailHint"></span></div>',
              '<div class="hc-reg-field"><label>Número de teléfono</label><input id="hcPhone" type="tel" maxlength="25" autocomplete="tel" required placeholder="+1 809 000 0000"><span class="hc-reg-hint" id="hcPhoneHint"></span></div>',
              '<div class="hc-reg-progress" id="hcProgress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><div class="hc-progress-top"><span>Progreso del formulario</span><span id="hcProgressValue">0%</span></div><div class="hc-progress-track"><span id="hcProgressBar" class="hc-progress-bar"></span></div><span id="hcProgressHint" class="hc-progress-hint">Completa todos los campos para habilitar la aceptación.</span></div>',
              '<label class="hc-reg-consent"><input id="hcConsent" type="checkbox" required><span>Confirmo que tengo 18 años o más. He leído y acepto contractualmente el <a href="privacy" target="_blank" rel="noopener">Documento Contractual y de Privacidad</a>.</span></label>',
            '</div>',
            '<div class="hc-reg-actions"><button id="hcTemporary" class="hc-side-btn" type="button">Acceso temporal</button><button id="hcSubmit" class="hc-main-btn" type="submit" disabled>Entrar a Hashcod Codespace</button><button id="hcWhatsapp" class="hc-wa-btn hc-side-btn" type="button" disabled>WhatsApp</button><button id="hcBack" class="hc-side-btn" type="button">Volver</button><span class="hc-note">Haciendo que tu proyecto hecho por IA tenga validez legal</span></div>',
            '<div class="hc-reg-faq">',
              faq('faq1','¿Cómo sé que esto no es una estafa?','Ve a donde dice <strong>Documento Contractual y de Privacidad</strong>.'),
              faq('faq2','¿Cuánto cobran?',pricesHtml()),
              faq('faq3','¿Cuándo estará lista la Plataforma?','Lo avisaremos por nuestras redes sociales (<strong>hashcod.app</strong>).'),
            '</div>',
            '<p id="hcStatus" class="hc-reg-status" role="status" aria-live="polite"></p>',
          '</form>',
        '</div>',
      '</section>'
    ].join('');
  }

  function faq(id, title, body) {
    return '<div class="hc-faq-item"><button type="button" class="hc-faq-trigger" aria-expanded="false" aria-controls="' + id + '"><span>' + title + '</span><span>⌄</span></button><div id="' + id + '" class="hc-faq-panel" aria-hidden="true">' + body + '</div></div>';
  }
  function pricesHtml() {
    return '<div class="hc-price-list"><div><span>Por someter a solicitud</span><strong>RD$567</strong></div><div><span>Por revisar tu code o lo que sea que hagas con IA</span><strong>RD$2,000</strong></div><div><span>Por alojar tu plataforma en nuestro codespace post-cuántico</span><strong>RD$6,900</strong></div><div><span>Por la Certificación</span><strong>RD$10,000</strong></div><div><span>Aquilar en la primera plaza</span><strong>US$ 78</strong></div></div>';
  }

  function openRegistration() {
    try {
      markGateReady();
      installStyles();
      selectedFile = null;
      document.body.classList.add('hashcod-direct-registration-open');
      document.documentElement.dataset.hashcodDirectRegistration = 'true';
      var old = byId('hashcodDirectRegistration');
      if (old) old.remove();
      document.body.insertAdjacentHTML('beforeend', formHtml());
      bindForm();
      var name = byId('hcName');
      if (name) setTimeout(function () { try { name.focus(); } catch (_) {} }, 30);
    } catch (error) {
      console.error('[Hashcod] registration open failed', error);
      alert('No se pudo abrir el registro. Recarga la página e inténtalo de nuevo.');
    }
  }

  function values() {
    return {
      name: byId('hcName'), age: byId('hcAge'), cedula: byId('hcCedula'), platform: byId('hcPlatform'),
      file: byId('hcFile'), email: byId('hcEmail'), phone: byId('hcPhone'), consent: byId('hcConsent')
    };
  }
  function hint(id, msg, bad) {
    var el = byId(id);
    if (!el) return;
    el.textContent = msg || '';
    el.classList.toggle('is-error', !!bad);
  }
  function validate() {
    var f = values();
    var age = Number(f.age && f.age.value);
    var ok = {
      name: !!(f.name && fullNameValid(f.name.value)),
      age: Number.isInteger(age) && age >= 18 && age <= 120,
      cedula: !!(f.cedula && cedulaValid(f.cedula.value)),
      platform: !!(f.platform && clean(f.platform.value).length >= 2),
      file: !!selectedFile,
      email: !!(f.email && f.email.value && f.email.checkValidity()),
      phone: !!(f.phone && phoneValid(f.phone.value)),
      consent: !!(f.consent && f.consent.checked)
    };
    var keys = Object.keys(ok);
    var done = keys.filter(function (k) { return ok[k]; }).length;
    var pct = Math.round(done / keys.length * 100);
    if (byId('hcProgress')) byId('hcProgress').setAttribute('aria-valuenow', String(pct));
    if (byId('hcProgressBar')) byId('hcProgressBar').style.width = pct + '%';
    if (byId('hcProgressValue')) byId('hcProgressValue').textContent = pct + '%';
    if (byId('hcProgressHint')) byId('hcProgressHint').textContent = pct === 100 ? 'Formulario listo. Ya puedes continuar.' : 'Completa todos los campos para habilitar la aceptación.';
    if (byId('hcSubmit')) byId('hcSubmit').disabled = pct !== 100;
    if (byId('hcWhatsapp')) byId('hcWhatsapp').disabled = pct !== 100;
    [['name','hcName','hcNameHint','Escribe al menos nombre y apellido.','Nombre válido.'],['age','hcAge','hcAgeHint','Debes tener 18 años o más.','Edad confirmada.'],['cedula','hcCedula','hcCedulaHint','Formato requerido: 000-0000000-0.','Cédula válida.'],['platform','hcPlatform','hcPlatformHint','Escribe el nombre de la plataforma.','Nombre de plataforma válido.'],['email','hcEmail','hcEmailHint','Escribe un correo electrónico válido.','Correo válido.'],['phone','hcPhone','hcPhoneHint','Escribe un número de teléfono válido.','Teléfono válido.']].forEach(function (r) {
      var input = byId(r[1]);
      var touched = input && input.value.length > 0;
      if (input) input.classList.toggle('is-bad', touched && !ok[r[0]]);
      hint(r[2], ok[r[0]] ? r[4] : r[3], touched && !ok[r[0]]);
    });
    hint('hcFileHint', selectedFile ? 'Archivo seleccionado: ' + selectedFile.name : 'Sube la explicación del code de tu plataforma. Máximo 30 MB.', !selectedFile);
    return pct === 100;
  }

  function makeCode() {
    var arr = new Uint8Array(10);
    try { crypto.getRandomValues(arr); } catch (_) { for (var i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random()*256); }
    return 'HSC-REG-' + Array.prototype.map.call(arr, function (b) { return b.toString(16).padStart(2,'0').toUpperCase(); }).join('').replace(/(.{4})/g,'$1-').replace(/-$/,'');
  }
  function enterPlatform() {
    document.body.classList.remove('hashcod-direct-registration-open','auth-locked','boot-locked');
    document.documentElement.dataset.hashcodPlatformEntered = 'true';
    document.documentElement.removeAttribute('data-hashcod-direct-registration');
    ['hashcodDirectRegistration','bootCliOverlay','hashcodEntryHold','hcCodeModal'].forEach(function (id) { var n = byId(id); if (n) n.remove(); });
    try { window.dispatchEvent(new CustomEvent('hashcod:platform-entered', { detail: { source: 'entry-registration-force', version: VERSION } })); } catch (_) {}
  }
  function showCode() {
    var code = makeCode();
    var old = byId('hcCodeModal'); if (old) old.remove();
    document.body.insertAdjacentHTML('beforeend','<div id="hcCodeModal" class="hc-modal"><div class="hc-modal-card"><p class="hc-reg-kicker">HASHCOD · REGISTRATION CODE</p><h2>Guarda tu código criptográfico</h2><p>Este código identifica este registro. Guárdalo para futuras comunicaciones.</p><code id="hcPrivateCode">'+escapeHtml(code)+'</code><button id="hcCopyCode" type="button">Copiar código</button><button id="hcContinue" type="button">Continuar a Hashcod</button><p id="hcCopyStatus" class="hc-reg-status"></p></div></div>');
    byId('hcCopyCode').onclick = function(){ if (navigator.clipboard) navigator.clipboard.writeText(code); byId('hcCopyStatus').textContent = 'Código copiado.'; };
    byId('hcContinue').onclick = enterPlatform;
  }

  function bindForm() {
    ['hcName','hcAge','hcCedula','hcPlatform','hcEmail','hcPhone','hcConsent'].forEach(function(id){
      var el = byId(id); if (!el) return;
      el.addEventListener('input', function(){ if (id === 'hcCedula') el.value = formatCedula(el.value); validate(); });
      el.addEventListener('change', validate);
    });
    byId('hcUpload').onclick = function(){ byId('hcFile').click(); };
    byId('hcFile').addEventListener('change', function(){
      var file = this.files && this.files[0];
      var status = byId('hcStatus');
      if (!file) { selectedFile = null; validate(); return; }
      if (file.size > MAX_FILE_BYTES) { this.value = ''; selectedFile = null; status.textContent = 'El archivo supera el máximo de 30 MB.'; validate(); return; }
      if (!ALLOWED_FILE.test(file.name)) { this.value = ''; selectedFile = null; status.textContent = 'Tipo de archivo no permitido.'; validate(); return; }
      selectedFile = file; byId('hcUpload').classList.add('is-ok'); status.textContent = 'Archivo de code seleccionado.'; validate();
    });
    byId('hcRegForm').addEventListener('submit', function(e){ e.preventDefault(); if (!validate()) { byId('hcStatus').textContent = 'Completa todos los campos, sube el code y acepta el documento contractual.'; return; } showCode(); });
    byId('hcWhatsapp').onclick = function(){ if (!validate()) return; var f = values(); var msg = ['Solicitud Hashcod Codespace','Nombre: '+clean(f.name.value),'Edad: '+clean(f.age.value),'Cédula: '+clean(f.cedula.value),'Plataforma: '+clean(f.platform.value),'Correo: '+clean(f.email.value),'Teléfono: '+clean(f.phone.value),'Archivo: '+(selectedFile ? selectedFile.name : '')].join('\n'); window.open('https://wa.me/'+WHATSAPP_NUMBER+'?text='+encodeURIComponent(msg),'_blank','noopener'); };
    byId('hcTemporary').onclick = enterPlatform;
    byId('hcBack').onclick = function(){ var n = byId('hashcodDirectRegistration'); if (n) n.remove(); document.body.classList.remove('hashcod-direct-registration-open'); ensureEntryButton(); };
    Array.prototype.forEach.call(document.querySelectorAll('#hashcodDirectRegistration .hc-faq-trigger'), function(btn){ btn.onclick = function(){ var item = btn.closest('.hc-faq-item'); var open = !item.classList.contains('is-open'); item.classList.toggle('is-open', open); btn.setAttribute('aria-expanded', open ? 'true' : 'false'); var panel = byId(btn.getAttribute('aria-controls')); if (panel) panel.setAttribute('aria-hidden', open ? 'false' : 'true'); }; });
    validate();
  }

  function ensureEntryButton() {
    markGateReady();
    var boot = byId('bootCliEnter');
    if (boot) { boot.disabled = false; boot.removeAttribute('aria-busy'); return; }
    if (!byId('hashcodEntryForceButton') && document.body) {
      var b = document.createElement('button');
      b.id = 'hashcodEntryForceButton'; b.type = 'button'; b.textContent = 'ENTER PLATFORM ↵';
      b.style.cssText = 'position:fixed;right:24px;bottom:24px;z-index:2147483640;height:50px;border:1px solid #111;border-radius:10px;background:#111;color:#fff;padding:0 22px;font:900 12px monospace;cursor:pointer;';
      document.body.appendChild(b);
    }
  }

  function onClick(e) {
    var t = e.target;
    var btn = t && t.closest ? t.closest('#bootCliEnter,#hashcodEntryForceButton,#hashcodHoldContinue') : null;
    if (!btn) return;
    e.preventDefault(); e.stopPropagation(); if (e.stopImmediatePropagation) e.stopImmediatePropagation();
    try { openRegistration(); }
    catch (err) { console.error('[Hashcod] immediate registration failed', err); if (btn) { btn.disabled = false; btn.removeAttribute('aria-busy'); btn.textContent = 'ENTER PLATFORM ↵'; } }
  }

  function boot() {
    markGateReady(); installStyles(); ensureEntryButton();
    document.addEventListener('click', onClick, true);
    [100, 500, 1200, 2500, 5000].forEach(function(ms){ setTimeout(function(){ markGateReady(); ensureEntryButton(); }, ms); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();
})();
