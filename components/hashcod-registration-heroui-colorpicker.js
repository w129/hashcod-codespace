/* Hashcod registration · HeroUI ColorPicker bridge
   The repo is not React-bundled, so this bridge creates a HeroUI-inspired
   ColorPicker with ColorArea, ColorSlider, ColorSwatch, ColorField and
   ColorSwatchPicker behavior for the existing registration form. */
(function (window, document) {
  'use strict';

  var VERSION = '20260925-heroui-colorpicker1';
  var STORAGE_KEY = 'hashcod.registration.backgroundColor';
  var INTENSITY_KEY = 'hashcod.registration.backgroundIntensity';
  var DEFAULT_COLOR = '#f0f1ef';
  var DEFAULT_INTENSITY = 72;
  var PRESETS = ['#f0f1ef', '#f5f5f4', '#e9ecef', '#e8f0ff', '#f5eefc', '#fff3e8', '#eef7f1', '#edf3f8', '#f7eeee', '#111111', '#d7dee2', '#dfe4dc'];

  if (window.__hashcodHeroUIColorPickerBridge === VERSION) return;
  window.__hashcodHeroUIColorPickerBridge = VERSION;

  function byId(id) { return document.getElementById(id); }

  function normalizeHex(value) {
    var text = String(value || '').trim();
    if (!text) return '';
    if (text.charAt(0) !== '#') text = '#' + text;
    if (/^#[0-9a-fA-F]{3}$/.test(text)) {
      text = '#' + text.slice(1).split('').map(function (char) { return char + char; }).join('');
    }
    return /^#[0-9a-fA-F]{6}$/.test(text) ? text.toLowerCase() : '';
  }

  function hexToRgb(hex) {
    var safe = normalizeHex(hex) || DEFAULT_COLOR;
    var number = parseInt(safe.slice(1), 16);
    return {
      r: (number >> 16) & 255,
      g: (number >> 8) & 255,
      b: number & 255
    };
  }

  function rgbToHex(rgb) {
    function part(value) {
      return Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, '0');
    }
    return '#' + part(rgb.r) + part(rgb.g) + part(rgb.b);
  }

  function mixWithWhite(hex, amount) {
    var rgb = hexToRgb(hex);
    var white = 255;
    var ratio = Math.max(0, Math.min(100, Number(amount) || DEFAULT_INTENSITY)) / 100;
    return rgbToHex({
      r: white - (white - rgb.r) * ratio,
      g: white - (white - rgb.g) * ratio,
      b: white - (white - rgb.b) * ratio
    });
  }

  function overlayFromHex(hex, alpha) {
    var rgb = hexToRgb(hex);
    return 'rgba(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ', ' + alpha + ')';
  }

  function readableColor(hex) {
    var rgb = hexToRgb(hex);
    var luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
    return luminance > 0.62 ? '#111111' : '#ffffff';
  }

  function getSavedColor() {
    try {
      return normalizeHex(window.localStorage.getItem(STORAGE_KEY)) || DEFAULT_COLOR;
    } catch (_) {
      return DEFAULT_COLOR;
    }
  }

  function getSavedIntensity() {
    try {
      var value = Number(window.localStorage.getItem(INTENSITY_KEY));
      return Number.isFinite(value) ? Math.max(12, Math.min(100, value)) : DEFAULT_INTENSITY;
    } catch (_) {
      return DEFAULT_INTENSITY;
    }
  }

  function save(color, intensity) {
    try { window.localStorage.setItem(STORAGE_KEY, color); } catch (_) {}
    try { window.localStorage.setItem(INTENSITY_KEY, String(intensity)); } catch (_) {}
  }

  function applyColor(color, intensity) {
    var root = document.documentElement;
    var reg = byId('hashcodDirectRegistration');
    var mixed = mixWithWhite(color, intensity);
    var rgb = hexToRgb(mixed);
    var overlayAlpha = color === '#111111' ? 0.40 : 0.66;
    var softAlpha = color === '#111111' ? 0.60 : 0.50;

    root.style.setProperty('--hashcod-registration-bg', mixed);
    root.style.setProperty('--hashcod-registration-bg-rgb', rgb.r + ', ' + rgb.g + ', ' + rgb.b);
    root.style.setProperty('--hashcod-registration-bg-overlay', overlayFromHex(mixed, overlayAlpha));
    root.style.setProperty('--hashcod-registration-bg-overlay-soft', 'rgba(255, 255, 255, ' + softAlpha + ')');
    root.style.setProperty('--hashcod-registration-bg-text', readableColor(mixed));

    if (reg) {
      reg.style.setProperty('--hashcod-registration-bg', mixed);
      reg.style.setProperty('--hashcod-registration-bg-rgb', rgb.r + ', ' + rgb.g + ', ' + rgb.b);
      reg.style.setProperty('--hashcod-registration-bg-overlay', overlayFromHex(mixed, overlayAlpha));
      reg.style.setProperty('--hashcod-registration-bg-overlay-soft', 'rgba(255, 255, 255, ' + softAlpha + ')');
    }

    save(color, intensity);
    updatePickerState(color, intensity, mixed);
  }

  function colorIcon() {
    return [
      '<span aria-hidden="true" class="hc-colorpicker-current-swatch" data-slot="color-swatch"></span>'
    ].join('');
  }

  function pickerHtml(color, intensity) {
    return [
      '<aside id="hashcodHeroUIColorPicker" class="hc-heroui-colorpicker" aria-label="Selector de color de fondo">',
        '<div data-slot="base">',
          '<header class="hc-colorpicker-head">',
            '<div>',
              '<span class="hc-colorpicker-eyebrow">HeroUI / ColorPicker</span>',
              '<span data-slot="label">Fondo del formulario</span>',
            '</div>',
            colorIcon(),
          '</header>',
          '<p data-slot="description">Selecciona un color y el fondo cambia en vivo.</p>',
          '<div data-slot="color-area" class="hc-color-area" aria-label="ColorArea">',
            '<input id="hcHeroUIColorNative" class="hc-color-area-input" type="color" value="' + color + '" aria-label="Seleccionar color">',
            '<span class="hc-color-area-crosshair" aria-hidden="true"></span>',
          '</div>',
          '<div data-slot="color-slider" aria-label="ColorSlider">',
            '<span class="hc-colorpicker-mini-label">Intensidad</span>',
            '<input id="hcHeroUIColorIntensity" class="hc-color-slider-input" type="range" min="12" max="100" value="' + intensity + '">',
          '</div>',
          '<div data-slot="color-field" aria-label="ColorField">',
            '<span class="hc-color-field-preview" aria-hidden="true"></span>',
            '<input id="hcHeroUIColorField" class="hc-color-field-input" value="' + color + '" spellcheck="false" aria-label="Código hexadecimal">',
          '</div>',
          '<div data-slot="color-swatch-picker" aria-label="ColorSwatchPicker">',
            PRESETS.map(function (preset) {
              return '<button type="button" class="hc-color-swatch-btn" data-color="' + preset + '" aria-label="Color ' + preset + '" aria-pressed="false" style="background:' + preset + '"></button>';
            }).join(''),
          '</div>',
          '<button id="hcHeroUIColorReset" type="button" class="hc-colorpicker-reset">Restablecer gris</button>',
        '</div>',
      '</aside>'
    ].join('');
  }

  function updatePickerState(color, intensity, mixed) {
    var picker = byId('hashcodHeroUIColorPicker');
    if (!picker) return;

    var normalized = normalizeHex(color) || DEFAULT_COLOR;
    var area = byId('hcHeroUIColorNative');
    var field = byId('hcHeroUIColorField');
    var slider = byId('hcHeroUIColorIntensity');
    var swatch = picker.querySelector('[data-slot="color-swatch"]');
    var preview = picker.querySelector('.hc-color-field-preview');

    if (area && area.value !== normalized) area.value = normalized;
    if (field && field.value.toLowerCase() !== normalized) field.value = normalized;
    if (slider && Number(slider.value) !== Number(intensity)) slider.value = String(intensity);
    if (swatch) swatch.style.background = mixed || mixWithWhite(normalized, intensity);
    if (preview) preview.style.background = mixed || mixWithWhite(normalized, intensity);

    picker.querySelectorAll('.hc-color-swatch-btn').forEach(function (button) {
      button.setAttribute('aria-pressed', normalizeHex(button.dataset.color) === normalized ? 'true' : 'false');
    });
  }

  function bindPicker() {
    var picker = byId('hashcodHeroUIColorPicker');
    var area = byId('hcHeroUIColorNative');
    var field = byId('hcHeroUIColorField');
    var slider = byId('hcHeroUIColorIntensity');
    var reset = byId('hcHeroUIColorReset');
    if (!picker || !area || !field || !slider || !reset) return;

    function currentIntensity() {
      var value = Number(slider.value);
      return Number.isFinite(value) ? value : DEFAULT_INTENSITY;
    }

    function setColor(value, source) {
      var normalized = normalizeHex(value);
      if (!normalized) {
        if (source === 'field') field.setAttribute('aria-invalid', 'true');
        return;
      }
      field.setAttribute('aria-invalid', 'false');
      applyColor(normalized, currentIntensity());
    }

    area.addEventListener('input', function () { setColor(area.value, 'area'); });
    area.addEventListener('change', function () { setColor(area.value, 'area'); });
    slider.addEventListener('input', function () { setColor(area.value || field.value || DEFAULT_COLOR, 'slider'); });
    field.addEventListener('input', function () { setColor(field.value, 'field'); });
    field.addEventListener('blur', function () {
      var normalized = normalizeHex(field.value) || getSavedColor();
      applyColor(normalized, currentIntensity());
    });

    picker.querySelectorAll('.hc-color-swatch-btn').forEach(function (button) {
      button.addEventListener('click', function () {
        setColor(button.dataset.color, 'swatch');
      });
    });

    reset.addEventListener('click', function () {
      slider.value = String(DEFAULT_INTENSITY);
      applyColor(DEFAULT_COLOR, DEFAULT_INTENSITY);
    });
  }

  function mountPicker() {
    var host = byId('hashcodDirectRegistration');
    var card = host && host.querySelector('.hc-reg-card');
    if (!host || !card) return false;
    if (byId('hashcodHeroUIColorPicker')) return true;

    var color = getSavedColor();
    var intensity = getSavedIntensity();
    host.insertAdjacentHTML('afterbegin', pickerHtml(color, intensity));
    host.classList.add('hc-has-heroui-colorpicker');
    bindPicker();
    applyColor(color, intensity);
    return true;
  }

  function boot() {
    if (mountPicker()) return;

    var tries = 0;
    var timer = window.setInterval(function () {
      tries += 1;
      if (mountPicker() || tries > 80) window.clearInterval(timer);
    }, 250);

    var observer = new MutationObserver(function () { mountPicker(); });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    window.setTimeout(function () { observer.disconnect(); }, 22000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }

  window.addEventListener('hashcod:entry-gate-ready', boot);
  window.addEventListener('hashcod:final-entry-screen', boot);
})(window, document);
