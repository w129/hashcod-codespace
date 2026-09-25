/* Hashcod registration · HeroUI segmented DateField bridge
   The platform does not currently bundle React/@heroui/react, so this bridge
   applies HeroUI DateField anatomy/classes to the existing form while preserving
   the original +18 validation field (#hcAge). */
(function (window, document) {
  'use strict';

  var VERSION = '20260925-heroui-datefield2-segmented';
  if (window.__hashcodHeroUIDateFieldBridge === VERSION) return;
  window.__hashcodHeroUIDateFieldBridge = VERSION;

  function byId(id) { return document.getElementById(id); }
  function pad(number) { return String(number).padStart(2, '0'); }
  function digits(value) { return String(value || '').replace(/\D+/g, ''); }

  function maxAdultBirthDate() {
    var now = new Date();
    return new Date(now.getFullYear() - 18, now.getMonth(), now.getDate());
  }

  function calculateAgeFromParts(day, month, year) {
    var d = Number(day);
    var m = Number(month);
    var y = Number(year);
    if (!Number.isFinite(d) || !Number.isFinite(m) || !Number.isFinite(y)) return null;
    if (String(year).length !== 4 || m < 1 || m > 12 || d < 1 || d > 31) return null;

    var birth = new Date(y, m - 1, d);
    if (Number.isNaN(birth.getTime())) return null;
    if (birth.getFullYear() !== y || birth.getMonth() !== m - 1 || birth.getDate() !== d) return null;

    var now = new Date();
    var age = now.getFullYear() - birth.getFullYear();
    var monthDiff = now.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) age -= 1;
    return { age: age, birth: birth, iso: y + '-' + pad(m) + '-' + pad(d) };
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

  function setRootState(root, state) {
    root.dataset.invalid = state.invalid ? 'true' : 'false';
    root.dataset.validAge = state.validAge ? 'true' : 'false';
    root.setAttribute('aria-invalid', state.invalid ? 'true' : 'false');
  }

  function syncOriginalAge(parts, ageInput, root, errorSlot, descriptionSlot, pill, hint, hiddenDate) {
    var day = byId('hcBirthDay');
    var month = byId('hcBirthMonth');
    var year = byId('hcBirthYear');
    if (!day || !month || !year) return;

    var hasAny = day.value || month.value || year.value;
    var result = calculateAgeFromParts(day.value, month.value, year.value);

    if (!hasAny) {
      ageInput.value = '';
      if (hiddenDate) hiddenDate.value = '';
      pill.textContent = '+18';
      descriptionSlot.textContent = 'Introduce tu fecha en formato DD / MM / AAAA. El sistema calcula si tienes 18 años o más.';
      errorSlot.textContent = 'Debes seleccionar una fecha válida.';
      setRootState(root, { invalid: false, validAge: false });
      if (hint) {
        hint.textContent = 'Introduce tu fecha de nacimiento. Debes tener 18 años o más.';
        hint.classList.remove('is-error');
      }
      emitNativeEvents(ageInput);
      return;
    }

    if (!result) {
      ageInput.value = '';
      if (hiddenDate) hiddenDate.value = '';
      pill.textContent = '+18';
      errorSlot.textContent = 'Fecha incompleta o inválida. Usa DD / MM / AAAA.';
      setRootState(root, { invalid: true, validAge: false });
      if (hint) {
        hint.textContent = 'Fecha incompleta o inválida. Usa DD / MM / AAAA.';
        hint.classList.add('is-error');
      }
      emitNativeEvents(ageInput);
      return;
    }

    var adult = result.age >= 18;
    var future = result.birth > new Date();
    ageInput.value = String(Math.max(0, result.age));
    if (hiddenDate) hiddenDate.value = result.iso;
    pill.textContent = adult ? result.age + ' años' : result.age + ' años';
    setRootState(root, { invalid: !adult || future, validAge: adult && !future });

    if (adult && !future) {
      descriptionSlot.textContent = 'Edad calculada: ' + result.age + ' años. Requisito +18 confirmado.';
      errorSlot.textContent = '';
      if (hint) {
        hint.textContent = 'Edad calculada: ' + result.age + ' años. Requisito +18 confirmado.';
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

  function bindSegmentBehavior(input, nextInput) {
    input.addEventListener('input', function () {
      input.value = digits(input.value).slice(0, Number(input.getAttribute('maxlength') || 2));
      if (nextInput && input.value.length >= Number(input.getAttribute('maxlength') || 2)) nextInput.focus();
    });

    input.addEventListener('keydown', function (event) {
      if (event.key === 'Backspace' && input.selectionStart === 0 && input.selectionEnd === 0) {
        var previous = input.dataset.previousId ? byId(input.dataset.previousId) : null;
        if (previous) previous.focus();
      }
    });
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

    var existing = byId('hcHeroUIDateField');
    if (existing) existing.remove();
    var oldBirthDate = byId('hcBirthDate');
    if (oldBirthDate) oldBirthDate.remove();

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
        '<div class="hc-heroui-segment-row" role="group" aria-label="Fecha de nacimiento">',
          '<input id="hcBirthDay" class="hc-heroui-date-segment day" inputmode="numeric" autocomplete="bday-day" maxlength="2" placeholder="DD" aria-label="Día">',
          '<span class="hc-heroui-date-separator">/</span>',
          '<input id="hcBirthMonth" class="hc-heroui-date-segment month" inputmode="numeric" autocomplete="bday-month" maxlength="2" placeholder="MM" aria-label="Mes" data-previous-id="hcBirthDay">',
          '<span class="hc-heroui-date-separator">/</span>',
          '<input id="hcBirthYear" class="hc-heroui-date-segment year" inputmode="numeric" autocomplete="bday-year" maxlength="4" placeholder="AAAA" aria-label="Año" data-previous-id="hcBirthMonth">',
        '</div>',
        '<span id="hcAgePill" class="hc-heroui-age-pill">+18</span>',
      '</div>',
      '<input id="hcBirthDate" type="hidden" autocomplete="bday">',
      '<span data-slot="description">Introduce tu fecha en formato DD / MM / AAAA. El sistema calcula si tienes 18 años o más.</span>',
      '<span data-slot="error-message">Debes tener 18 años o más para continuar.</span>'
    ].join('');

    field.insertBefore(root, hint || ageInput.nextSibling);

    var day = byId('hcBirthDay');
    var month = byId('hcBirthMonth');
    var year = byId('hcBirthYear');
    var hiddenDate = byId('hcBirthDate');
    var errorSlot = root.querySelector('[data-slot="error-message"]');
    var descriptionSlot = root.querySelector('[data-slot="description"]');
    var pill = byId('hcAgePill');

    if (!day || !month || !year || !errorSlot || !descriptionSlot || !pill) return true;

    bindSegmentBehavior(day, month);
    bindSegmentBehavior(month, year);
    bindSegmentBehavior(year, null);

    [day, month, year].forEach(function (input) {
      input.addEventListener('focus', function () { root.dataset.focusWithin = 'true'; });
      input.addEventListener('blur', function () {
        window.setTimeout(function () {
          var active = document.activeElement;
          root.dataset.focusWithin = root.contains(active) ? 'true' : 'false';
        }, 0);
      });
      input.addEventListener('input', function () {
        syncOriginalAge([day, month, year], ageInput, root, errorSlot, descriptionSlot, pill, hint, hiddenDate);
      });
      input.addEventListener('change', function () {
        syncOriginalAge([day, month, year], ageInput, root, errorSlot, descriptionSlot, pill, hint, hiddenDate);
      });
    });

    form.addEventListener('submit', function () {
      syncOriginalAge([day, month, year], ageInput, root, errorSlot, descriptionSlot, pill, hint, hiddenDate);
    }, true);

    syncOriginalAge([day, month, year], ageInput, root, errorSlot, descriptionSlot, pill, hint, hiddenDate);
    return true;
  }

  function boot() {
    if (decorateAgeField()) return;

    var tries = 0;
    var timer = window.setInterval(function () {
      tries += 1;
      if (decorateAgeField() || tries > 60) window.clearInterval(timer);
    }, 250);

    var observer = new MutationObserver(function () { decorateAgeField(); });
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
