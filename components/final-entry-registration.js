(function () {
  'use strict';

  if (window.__hashcodFinalEntryRegistrationLoaded) return;
  window.__hashcodFinalEntryRegistrationLoaded = true;

  const ROOT_ID = 'hashcodFinalEntryRegistration';
  const MODAL_ID = 'hashcodAccessRecordsModal';
  const ADMIN_SCRIPT_ID = 'hashcodAccessRecordsAdminEngine';
  const DB_ICON = `<svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="100" height="100" viewBox="0 0 50 50" aria-hidden="true">
<path d="M 28.992188 8 C 23.873188 8 19.388844 10.76825 17.214844 15.15625 C 16.078844 14.40325 14.747469 14 13.355469 14 C 9.7104688 14 6.6083281 17.027891 6.3613281 20.712891 C 2.6863281 22.110891 -1.1842379e-15 26.103078 0 30.330078 C 0 35.661078 4.3379219 40 9.6699219 40 L 30 40 L 30 38 L 9.6699219 38 C 5.4399219 38 2 34.559078 2 30.330078 C 2 26.755078 4.4719531 23.271437 7.6269531 22.398438 L 8.3886719 22.189453 L 8.3476562 21.183594 C 8.3476562 18.372594 10.641422 15.998047 13.357422 15.998047 C 14.694422 15.998047 15.952391 16.520703 16.900391 17.470703 L 18.005859 18.574219 L 18.546875 17.109375 C 20.145875 12.789375 24.246141 9.9980469 28.994141 9.9980469 C 35.062141 9.9990469 40 15.00275 40 21.21875 C 40 21.68575 39.999219 22.466906 39.949219 22.878906 L 39.8125 24 L 40.941406 24 L 41.027344 23.996094 C 43.228344 24.005094 45.223719 25.114969 46.511719 26.792969 C 47.740719 27.195969 48.753594 27.731281 49.558594 28.363281 C 48.478594 25.028281 45.510141 22.466688 41.994141 22.054688 C 42.000141 21.740687 42 21.425391 42 21.150391 C 42 13.899391 36.164187 8 28.992188 8 z M 41 28 C 38.446754 28 36.307206 28.456516 34.716797 29.283203 C 33.126388 30.10989 32 31.421546 32 33 L 32 37 L 32 41 L 32 45 C 32 46.578454 33.126388 47.89011 34.716797 48.716797 C 36.307206 49.543484 38.446754 50 41 50 C 43.553246 50 45.692794 49.543484 47.283203 48.716797 C 48.873612 47.89011 50 46.578454 50 45 L 50 41 L 50 37 L 50 33 C 50 31.421546 48.873612 30.10989 47.283203 29.283203 C 45.692794 28.456516 43.553246 28 41 28 z M 41 30 C 43.307754 30 45.166987 30.437781 46.361328 31.058594 C 47.555669 31.679407 48 32.368454 48 33 C 48 33.631546 47.555669 34.320593 46.361328 34.941406 C 45.166987 35.562219 43.307754 36 41 36 C 38.692246 36 36.833013 35.562219 35.638672 34.941406 C 34.444331 34.320593 34 33.631546 34 33 C 34 32.368454 34.444331 31.679407 35.638672 31.058594 C 36.833013 30.437781 38.692246 30 41 30 z M 34 36.283203 C 34.226833 36.438365 34.463816 36.585299 34.716797 36.716797 C 36.307206 37.543484 38.446754 38 41 38 C 43.553246 38 45.692794 37.543484 47.283203 36.716797 C 47.536184 36.585299 47.773167 36.438365 48 36.283203 L 48 37 C 48 37.631546 47.555669 38.320593 46.361328 38.941406 C 45.166987 39.562219 43.307754 40 41 40 C 38.692246 40 36.833013 39.562219 35.638672 38.941406 C 34.444331 38.320593 34 37.631546 34 37 L 34 36.283203 z M 34 40.283203 C 34.226833 40.438365 34.463816 40.585299 34.716797 40.716797 C 36.307206 41.543484 38.446754 42 41 42 C 43.553246 42 45.692794 41.543484 47.283203 40.716797 C 47.536184 40.585299 47.773167 40.438365 48 40.283203 L 48 41 C 48 41.631546 47.555669 42.320593 46.361328 42.941406 C 45.166987 43.562219 43.307754 44 41 44 C 38.692246 44 36.833013 43.562219 35.638672 42.941406 C 34.444331 42.320593 34 41.631546 34 41 L 34 40.283203 z M 34 44.283203 C 34.226833 44.438365 34.463816 44.585299 34.716797 44.716797 C 36.307206 45.543484 38.446754 46 41 46 C 43.553246 46 45.692794 45.543484 47.283203 44.716797 C 47.536184 44.585299 47.773167 44.438365 48 44.283203 L 48 45 C 48 45.631546 47.555669 46.320593 46.361328 46.941406 C 45.166987 47.562219 43.307754 48 41 48 C 38.692246 48 36.833013 47.562219 35.638672 46.941406 C 34.444331 46.320593 34 45 L 34 44.283203 z"></path>
</svg>`;

  function publicUrl(path) {
    try { return new URL(path, document.baseURI).toString(); }
    catch (_) { return '/' + String(path).replace(/^\/+/, ''); }
  }

  function endpoint(action) {
    return publicUrl('api/access-intake/' + action);
  }

  function removeRetiredNotice() {
    const old = document.getElementById('hashcodPlatformImprovementSign');
    if (old) old.remove();
  }

  function fieldMarkup(name, label, attrs, wide) {
    return [
      '<div class="hashcod-entry-field', wide ? ' hashcod-entry-field--wide' : '', '">',
      '<label for="hashcodEntry_', name, '">', label, '</label>',
      '<input id="hashcodEntry_', name, '" name="', name, '" ', attrs, '>',
      '<p class="hashcod-entry-field-error" data-error-for="', name, '"></p>',
      '</div>'
    ].join('');
  }

  function buildRoot() {
    let root = document.getElementById(ROOT_ID);
    if (root) return root;

    root = document.createElement('section');
    root.id = ROOT_ID;
    root.setAttribute('aria-label', 'Formulario de registro de acceso');
    root.innerHTML = [
      '<div class="hashcod-entry-registration-card">',
        '<header class="hashcod-entry-registration-head">',
          '<div>',
            '<p class="hashcod-entry-registration-kicker">HASHCOD / ACCESS / REGISTRATION</p>',
            '<h1 class="hashcod-entry-registration-title">Registro de acceso</h1>',
            '<p class="hashcod-entry-registration-copy">Completa tus datos para registrar tu solicitud. Este acceso está disponible únicamente para personas de 18 años o más.</p>',
          '</div>',
          '<span class="hashcod-entry-registration-badge">18+ REQUIRED</span>',
        '</header>',
        '<form id="hashcodEntryRegistrationForm" class="hashcod-entry-registration-form" data-no-autosave data-hashcod-autosave="off" novalidate>',
          fieldMarkup('full_name', 'Nombre con apellidos', 'type="text" autocomplete="name" maxlength="160" placeholder="Nombre y apellidos" required', true),
          fieldMarkup('age', 'Edad', 'type="number" inputmode="numeric" min="18" max="120" step="1" placeholder="18+" required', false),
          fieldMarkup('cedula', 'Cédula con guiones', 'type="text" inputmode="numeric" autocomplete="off" maxlength="13" placeholder="000-0000000-0" required', false),
          fieldMarkup('platform_name', 'Nombre de su plataforma', 'type="text" autocomplete="organization" maxlength="120" placeholder="Nombre de la plataforma" required', true),
          fieldMarkup('email', 'Correo electrónico', 'type="email" autocomplete="email" maxlength="254" placeholder="correo@ejemplo.com" required', false),
          fieldMarkup('phone', 'Número de teléfono', 'type="tel" autocomplete="tel" maxlength="32" placeholder="+1 809 000 0000" required', false),
          '<p class="hashcod-entry-registration-note">Los datos se envían al servidor de Hashcod. La cédula, el correo y el teléfono se cifran antes de guardarse; la tabla completa solo puede abrirse con autorización administrativa.</p>',
          '<div class="hashcod-entry-registration-actions">',
            '<button type="submit" id="hashcodEntryRegistrationSubmit">Enviar</button>',
            '<button type="button" id="hashcodEntryRegistrationRecords" aria-label="Abrir tabla de registros" title="Abrir tabla de registros">', DB_ICON, '</button>',
          '</div>',
          '<p id="hashcodEntryRegistrationStatus" class="hashcod-entry-registration-status" role="status" aria-live="polite"></p>',
        '</form>',
      '</div>'
    ].join('');

    document.body.appendChild(root);
    bindForm(root);
    return root;
  }

  function buildRecordsModal() {
    let modal = document.getElementById(MODAL_ID);
    if (modal) return modal;

    modal = document.createElement('div');
    modal.id = MODAL_ID;
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Tabla de registros enviados');
    modal.innerHTML = [
      '<section class="hashcod-access-records-shell">',
        '<header class="hashcod-access-records-head">',
          '<div><h2>Registros enviados</h2><p>Vista administrativa · datos descifrados solo para esta sesión autorizada</p></div>',
          '<button type="button" class="hashcod-access-records-close" aria-label="Cerrar">×</button>',
        '</header>',
        '<div class="hashcod-access-records-table-wrap" id="hashcodAccessRecordsContent">',
          '<div class="hashcod-access-records-empty">Verificando acceso…</div>',
        '</div>',
      '</section>'
    ].join('');

    modal.querySelector('.hashcod-access-records-close').addEventListener('click', closeRecordsModal);
    modal.addEventListener('click', function (event) {
      if (event.target === modal) closeRecordsModal();
    });
    document.body.appendChild(modal);
    return modal;
  }

  function closeRecordsModal() {
    const modal = document.getElementById(MODAL_ID);
    if (modal) modal.classList.remove('is-open');
  }

  function setStatus(root, message, tone) {
    const el = root.querySelector('#hashcodEntryRegistrationStatus');
    if (!el) return;
    el.textContent = message || '';
    if (tone) el.dataset.tone = tone;
    else delete el.dataset.tone;
  }

  function clearErrors(root) {
    root.querySelectorAll('.hashcod-entry-field input').forEach(function (input) {
      input.classList.remove('is-invalid');
      input.removeAttribute('aria-invalid');
    });
    root.querySelectorAll('.hashcod-entry-field-error').forEach(function (node) {
      node.textContent = '';
      node.classList.remove('is-visible');
    });
  }

  function setFieldError(root, name, message) {
    const input = root.querySelector('[name="' + name + '"]');
    const error = root.querySelector('[data-error-for="' + name + '"]');
    if (input) {
      input.classList.add('is-invalid');
      input.setAttribute('aria-invalid', 'true');
    }
    if (error) {
      error.textContent = message;
      error.classList.add('is-visible');
    }
  }

  function formatCedula(value) {
    const digits = String(value || '').replace(/\D+/g, '').slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 10) return digits.slice(0, 3) + '-' + digits.slice(3);
    return digits.slice(0, 3) + '-' + digits.slice(3, 10) + '-' + digits.slice(10, 11);
  }

  function collect(form) {
    return {
      full_name: form.elements.full_name.value.trim(),
      age: Number(form.elements.age.value),
      cedula: form.elements.cedula.value.trim(),
      platform_name: form.elements.platform_name.value.trim(),
      email: form.elements.email.value.trim(),
      phone: form.elements.phone.value.trim()
    };
  }

  function validate(data) {
    const errors = {};
    const words = data.full_name.split(/\s+/).filter(Boolean);
    if (data.full_name.length < 5 || words.length < 2) errors.full_name = 'Escribe tu nombre con apellidos.';
    if (!Number.isInteger(data.age) || data.age < 18 || data.age > 120) errors.age = 'Debes indicar una edad de 18 años o más.';
    if (!/^\d{3}-\d{7}-\d$/.test(data.cedula)) errors.cedula = 'Usa el formato 000-0000000-0.';
    if (data.platform_name.length < 2) errors.platform_name = 'Escribe el nombre de tu plataforma.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = 'Escribe un correo electrónico válido.';
    const phoneDigits = data.phone.replace(/\D+/g, '');
    if (phoneDigits.length < 7 || phoneDigits.length > 15) errors.phone = 'Escribe un número de teléfono válido.';
    return errors;
  }

  async function submitForm(root, form) {
    clearErrors(root);
    const payload = collect(form);
    const errors = validate(payload);
    const names = Object.keys(errors);
    if (names.length) {
      names.forEach(function (name) { setFieldError(root, name, errors[name]); });
      setStatus(root, 'Revisa los campos marcados.', 'error');
      const first = form.elements[names[0]];
      if (first && typeof first.focus === 'function') first.focus();
      return;
    }

    const button = root.querySelector('#hashcodEntryRegistrationSubmit');
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    setStatus(root, 'Guardando de forma segura…');

    try {
      const response = await fetch(endpoint('submit'), {
        method: 'POST',
        credentials: 'same-origin',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json().catch(function () { return {}; });
      if (!response.ok || data.ok !== true) {
        if (data.fields && typeof data.fields === 'object') {
          Object.keys(data.fields).forEach(function (name) {
            setFieldError(root, name, String(data.fields[name] || 'Dato inválido.'));
          });
        }
        throw new Error(data.error || 'No se pudo guardar el registro.');
      }

      form.reset();
      setStatus(root, data.message || 'Información enviada y guardada correctamente.', 'success');
      if (navigator.vibrate) navigator.vibrate(18);
    } catch (error) {
      setStatus(root, error && error.message ? error.message : 'No se pudo enviar el formulario.', 'error');
    } finally {
      button.disabled = false;
      button.removeAttribute('aria-busy');
    }
  }

  function ensureAdminEngine() {
    if (window.HashcodAdmin && typeof window.HashcodAdmin.require === 'function') return Promise.resolve(true);

    let script = document.getElementById(ADMIN_SCRIPT_ID);
    if (!script) {
      script = document.createElement('script');
      script.id = ADMIN_SCRIPT_ID;
      script.src = publicUrl('components/admin-device.js?v=20260917-access1');
      script.defer = true;
      document.head.appendChild(script);
    }

    return new Promise(function (resolve) {
      let attempts = 0;
      const timer = window.setInterval(function () {
        attempts += 1;
        if (window.HashcodAdmin && typeof window.HashcodAdmin.require === 'function') {
          window.clearInterval(timer);
          resolve(true);
        } else if (attempts >= 80) {
          window.clearInterval(timer);
          resolve(false);
        }
      }, 75);
    });
  }

  function cell(value) {
    const td = document.createElement('td');
    td.textContent = value == null ? '' : String(value);
    return td;
  }

  function renderRecords(records) {
    const modal = buildRecordsModal();
    const content = modal.querySelector('#hashcodAccessRecordsContent');
    content.textContent = '';

    if (!Array.isArray(records) || records.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'hashcod-access-records-empty';
      empty.textContent = 'Todavía no hay registros enviados.';
      content.appendChild(empty);
      return;
    }

    const table = document.createElement('table');
    table.className = 'hashcod-access-records-table';
    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');
    ['Fecha', 'Nombre con apellidos', 'Edad', 'Cédula', 'Plataforma', 'Correo', 'Teléfono'].forEach(function (label) {
      const th = document.createElement('th');
      th.textContent = label;
      headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    records.forEach(function (row) {
      const tr = document.createElement('tr');
      const date = row.submitted_at ? new Date(row.submitted_at) : null;
      tr.appendChild(cell(date && !Number.isNaN(date.getTime()) ? date.toLocaleString() : row.submitted_at));
      tr.appendChild(cell(row.full_name));
      tr.appendChild(cell(row.age));
      tr.appendChild(cell(row.cedula));
      tr.appendChild(cell(row.platform_name));
      tr.appendChild(cell(row.email));
      tr.appendChild(cell(row.phone));
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    content.appendChild(table);
  }

  async function openRecords(root, button) {
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    setStatus(root, 'Verificando autorización administrativa…');

    try {
      const ready = await ensureAdminEngine();
      if (!ready) throw new Error('No se pudo cargar el control administrativo.');

      const verified = await window.HashcodAdmin.require({ force: true });
      if (verified !== true) throw new Error('Acceso administrativo no autorizado.');

      const modal = buildRecordsModal();
      modal.classList.add('is-open');
      modal.querySelector('#hashcodAccessRecordsContent').innerHTML = '<div class="hashcod-access-records-empty">Cargando registros protegidos…</div>';

      const response = await fetch(endpoint('list'), {
        method: 'GET',
        credentials: 'same-origin',
        cache: 'no-store',
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
      });
      const data = await response.json().catch(function () { return {}; });
      if (!response.ok || data.ok !== true) {
        throw new Error(data.error || 'No se pudo abrir la tabla.');
      }

      renderRecords(data.records || []);
      setStatus(root, 'Tabla administrativa abierta.', 'success');
      if (navigator.vibrate) navigator.vibrate(12);
    } catch (error) {
      closeRecordsModal();
      setStatus(root, error && error.message ? error.message : 'No se pudo abrir la tabla.', 'error');
    } finally {
      button.disabled = false;
      button.removeAttribute('aria-busy');
    }
  }

  function bindForm(root) {
    const form = root.querySelector('#hashcodEntryRegistrationForm');
    const cedula = form.elements.cedula;
    const recordsButton = root.querySelector('#hashcodEntryRegistrationRecords');

    cedula.addEventListener('input', function () {
      const pos = cedula.selectionStart;
      cedula.value = formatCedula(cedula.value);
      if (typeof cedula.setSelectionRange === 'function') {
        const next = Math.min(cedula.value.length, pos == null ? cedula.value.length : pos + 1);
        try { cedula.setSelectionRange(next, next); } catch (_) {}
      }
    });

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      submitForm(root, form);
    });

    recordsButton.addEventListener('click', function () {
      openRecords(root, recordsButton);
    });
  }

  function syncFinalScreen() {
    removeRetiredNotice();
    buildRoot();
  }

  function init() {
    removeRetiredNotice();
    buildRoot();
    buildRecordsModal();
    syncFinalScreen();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }

  window.addEventListener('hashcod:final-entry-screen', syncFinalScreen);
  window.addEventListener('hashcod:platform-entered', closeRecordsModal);

  window.HashcodFinalEntryRegistration = Object.freeze({
    mount: buildRoot,
    openRecords: function () {
      const root = buildRoot();
      const button = root.querySelector('#hashcodEntryRegistrationRecords');
      return openRecords(root, button);
    }
  });
})();
