/* Hashcod registration · HeroUI DateField bridge
   The platform does not currently bundle React/@heroui/react, so this bridge
   applies HeroUI DateField anatomy/classes to the existing form while preserving
   the original +18 validation field (#hcAge). */
(function (window, document) {
  'use strict';

  var VERSION = '20260925-heroui-datefield1';
  if (window.__hashcodHeroUIDateFieldBridge === VERSION) return;
  window.__hashcodHeroUIDateFieldBridge = VERSION;

  function byId(id) {
    return document.getElementById(id);
  }

  function pad(number) {
    return String(number).padStart(2, '0');
  }

  function maxAdultBirthDate() {
    var now = new Date();
    var adult = new Date(now.getFullYear() - 18, now.getMonth(), now.getDate());
    return adult.getFullYear() + '-' + pad(adult.getMonth() + 1) + '-' + pad(adult.getDate());
  }

  function calculateAge(value) {
    if (!value) return null;
    var parts = String(value).split('-').map(Number);
    if (parts.length !== 3 || parts.some(function (part) { return !Number.isFinite(part); })) return null;

    var birth = new Date(parts[0], parts[1] - 1, parts[2]);
    if (Number.isNaN(birth.getTime())) return null;

    var now = new Date();
    var age = now.getFullYear() - birth.getFullYear();
    var monthDiff = now.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) age -= 1;
    return age;
  }

  function calendarIcon() {
    return [
      '<span class="hc-heroui-datefield-icon" aria-hidden="true">',
        '<svg viewBox="0 0 24 24" focusable="false">',
          '<path d="M7 3v3M17 3v3M4.75 8.25h14.5M6.5 5.25h11A2.75 2.75 0 0 1 20.25 8v9.5a2.75 2.75 0 0 1-2.75 2.75h-11A2.75 2.75 0 0 1 3.75 17.5V8A2.75 2.75 0 0 1 6.5 5.25Z"/>',
          '<path d="M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01"/>',
        '</svg>',
      '</span>'
    ].join('');
  }

  function emitNativeEvents(input) {
    try { input.dispatchEvent(new Event('input', { bubbles: true })); } catch (_) {}
    try { input.dispatchEvent(new Event('change', { bubbles: true })); } catch (_) {}
  }

  function syncOriginalAge(dateInput, ageInput, root, errorSlot, descriptionSlot, pill, hint) {
    var age = calculateAge(dateInput.value);
    var hasDate = age !== null;
    var adult = hasDate && age >= 18;
    var future = hasDate && age < 0;

    if (!hasDate) {
      ageInput.value = '';
      root.dataset.validAge = 'false';
      root.dataset.invalid = 'false';
      root.setAttribute('aria-invalid', 'false');
      pill.textContent = '+18';
      descriptionSlot.textContent = 'Selecciona tu fecha de nacimiento. El sistema calcula si tienes 18 años o más.';
      errorSlot.textContent = 'Debes seleccionar una fecha válida.';
      if (hint) {
        hint.textContent = 'Selecciona tu fecha de nacimiento. Debes tener 18 años o más.';
        hint.classList.remove('is-error');
      }
      emitNativeEvents(ageInput);
      return;
    }

    ageInput.value = String(Math.max(0, age));
    pill.textContent = age + ' años';
    root.dataset.validAge = adult ? 'true' : 'false';
    root.dataset.invalid = adult ? 'false' : 'true';
    root.setAttribute('aria-invalid', adult ? 'false' : 'true');

    if (adult) {
      descriptionSlot.textContent = 'Edad calculada: ' + age + ' años. Requisito +18 confirmado.';
      errorSlot.textContent = '';
      if (hint) {
        hint.textContent = 'Edad calculada: ' + age + ' años. Requisito +18 confirmado.';
        hint.classList.remove('is-error');
      }
    } else {
      var message = future ? 'La fecha no puede estar en el futuro.' : 'Debes tener 18 años o más para continuar.';
      errorSlot.textContent = message;
      if (hint) {
        hint.textContent = message;
        hint.classList.add('is-error');
      }
    }

    emitNativeEvents(ageInput);
  }

  function decorateAgeField() {
    var form = byId('hcRegForm');
    var ageInput = byId('hcAge');
    if (!form || !ageInput) return false;

    var field = ageInput.closest('.hc-reg-field');
    if (!field) return false;
    if (field.dataset.herouiDateFieldReady === VERSION) return true;

    var label = field.querySelector('label');
    var hint = byId('hcAgeHint');

    field.dataset.herouiDateFieldReady = VERSION;
    field.classList.add('hc-heroui-datefield-card');

    if (label) label.textContent = 'Fecha de nacimiento';

    ageInput.type = 'hidden';
    ageInput.required = false;
    ageInput.tabIndex = -1;
    ageInput.setAttribute('aria-hidden', 'true');

    var existing = byId('hcBirthDate');
    if (existing) existing.remove();

    var root = document.createElement('div');
    root.id = 'hcHeroUIDateField';
    root.className = 'hc-heroui-datefield date-field';
    root.dataset.required = 'true';
    root.dataset.invalid = 'false';
    root.dataset.validAge = 'false';
    root.setAttribute('aria-invalid', 'false');

    root.innerHTML = [
      '<span data-slot="label">Fecha de nacimiento</span>',
      '<div data-slot="input-wrapper" class="hc-heroui-datefield-group">',
        calendarIcon(),
        '<input id="hcBirthDate" class="hc-heroui-datefield-native" type="date" autocomplete="bday" required aria-label="Fecha de nacimiento" max="' + maxAdultBirthDate() + '">',
        '<span id="hcAgePill" class="hc-heroui-age-pill">+18</span>',
      '</div>',
      '<span data-slot="description">Selecciona tu fecha de nacimiento. El sistema calcula si tienes 18 años o más.</span>',
      '<span data-slot="error-message">Debes tener 18 años o más para continuar.</span>'
    ].join('');

    field.insertBefore(root, hint || ageInput.nextSibling);

    var dateInput = byId('hcBirthDate');
    var errorSlot = root.querySelector('[data-slot="error-message"]');
    var descriptionSlot = root.querySelector('[data-slot="description"]');
    var pill = byId('hcAgePill');

    if (!dateInput || !errorSlot || !descriptionSlot || !pill) return true;

    ['focus', 'blur'].forEach(function (type) {
      dateInput.addEventListener(type, function () {
        root.dataset.focusWithin = type === 'focus' ? 'true' : 'false';
      });
    });

    ['input', 'change'].forEach(function (type) {
      dateInput.addEventListener(type, function () {
        syncOriginalAge(dateInput, ageInput, root, errorSlot, descriptionSlot, pill, hint);
      });
    });

    form.addEventListener('submit', function () {
      syncOriginalAge(dateInput, ageInput, root, errorSlot, descriptionSlot, pill, hint);
    }, true);

    syncOriginalAge(dateInput, ageInput, root, errorSlot, descriptionSlot, pill, hint);
    return true;
  }

  function boot() {
    if (decorateAgeField()) return;

    var tries = 0;
    var timer = window.setInterval(function () {
      tries += 1;
      if (decorateAgeField() || tries > 60) window.clearInterval(timer);
    }, 250);

    var observer = new MutationObserver(function () {
      decorateAgeField();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    window.setTimeout(function () { observer.disconnect(); }, 20000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }

  window.addEventListener('hashcod:entry-gate-ready', boot);
  window.addEventListener('hashcod:final-entry-screen', boot);
})(window, document);
