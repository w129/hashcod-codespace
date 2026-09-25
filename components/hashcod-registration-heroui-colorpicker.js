/* Hashcod registration · HeroUI ColorPicker bridge
   The repo is not React-bundled, so this bridge mirrors the official HeroUI
   ColorPicker anatomy inside the existing registration form without changing
   the form submission logic. */
(function (window, document) {
  'use strict';

  var VERSION = '20260925-heroui-colorpicker4-bottom';
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
    root.style.setProperty('--hashcod-colorpicker-selected', mixed);

    if (reg) {
      reg.style.setProperty('--hashcod-registration-bg', mixed);
      reg.style.setProperty('--hashcod-registration-bg-rgb', rgb.r + ', ' + rgb.g + ', ' + rgb.b);
      reg.style.setProperty('--hashcod-registration-bg-overlay', overlayFromHex(mixed, overlayAlpha));
      reg.style.setProperty('--hashcod-registration-bg-overlay-soft', 'rgba(255, 255, 255, ' + softAlpha + ')');
      reg.style.setProperty('--hashcod-colorpicker-selected', mixed);
    }

    save(color, intensity);
    updatePickerState(color, intensity, mixed);
  }

  function pickerHtml(color, intensity) {
    return [
      '<section id="hashcodHeroUIColorPicker" class="hc-heroui-colorpicker" aria-label="ColorPicker">',
        '<div data-slot="base">',
          '<button type="button" data-slot="trigger" aria-expanded="true" aria-controls="hashcodHeroUIColorPopover">',
            '<span aria-hidden="true" data-slot="color-swatch" class="hc-colorpicker-current-swatch"></span>',
            '<span data-slot="label">Pick a color</span>',
          '</button>',
          '<div id="hashcodHeroUIColorPopover" data-slot="popover">',
            '<div data-slot="color-area" aria-label="ColorArea">',
              '<input id="hcHeroUIColorNative" class="hc-color-area-input" type="color" value="' + color + '" aria-label="ColorArea value">',
              '<span data-slot="thumb" class="hc-color-area-crosshair" aria-hidden="true"></span>',
            '</div>',
            '<div data-slot="color-slider" aria-label="ColorSlider">',
              '<span data-slot="track">',
                '<input id="hcHeroUIColorIntensity" class="hc-color-slider-input" type="range" min="12" max="100" value="' + intensity + '" aria-label="ColorSlider intensity">',
                '<span data-slot="thumb" class="hc-color-slider-thumb" aria-hidden="true"></span>',
              '</span>',
            '</div>',
            '<div data-slot="color-field" aria-label="ColorField">',
              '<span class="hc-color-field-preview" aria-hidden="true"></span>',
              '<input id="hcHeroUIColorField" class="hc-color-field-input" value="' + color + '" spellcheck="false" aria-label="ColorField hex value">',
            '</div>',
            '<div data-slot="color-swatch-picker" aria-label="ColorSwatchPicker">',
              PRESETS.map(function (preset) {
                return '<button type="button" data-slot="color-swatch" class="hc-color-swatch-btn" data-color="' + preset + '" aria-label="ColorSwatch ' + preset + '" aria-pressed="false" style="background:' + preset + '"></button>';
              }).join(''),
            '</div>',
          '</div>',
        '</div>',
      '</section>'
    ].join('');
  }

  function updateSliderThumb(intensity) {
    var picker = byId('hashcodHeroUIColorPicker');
    if (!picker) return;
    var thumb = picker.querySelector('.hc-color-slider-thumb');
    if (thumb) thumb.style.left = String(Math.max(12, Math.min(100, Number(intensity) || DEFAULT_INTENSITY))) + '%';
  }

  function updatePickerState(color, intensity, mixed) {
    var picker = byId('hashcodHeroUIColorPicker');
    if (!picker) return;

    var normalized = normalizeHex(color) || DEFAULT_COLOR;
    var area = byId('hcHeroUIColorNative');
    var field = byId('hcHeroUIColorField');
    var slider = byId('hcHeroUIColorIntensity');
    var swatch = picker.querySelector('.hc-colorpicker-current-swatch');
    var preview = picker.querySelector('.hc-color-field-preview');
    var selected = mixed || mixWithWhite(normalized, intensity);

    if (area && area.value !== normalized) area.value = normalized;
    if (field && field.value.toLowerCase() !== normalized) field.value = normalized;
    if (slider && Number(slider.value) !== Number(intensity)) slider.value = String(intensity);
    if (swatch) swatch.style.background = selected;
    if (preview) preview.style.background = selected;
    picker.style.setProperty('--hashcod-colorpicker-selected', selected);
    updateSliderThumb(intensity);

    picker.querySelectorAll('.hc-color-swatch-btn').forEach(function (button) {
      button.setAttribute('aria-pressed', normalizeHex(button.dataset.color) === normalized ? 'true' : 'false');
    });
  }

  function bindPicker() {
    var picker = byId('hashcodHeroUIColorPicker');
    var area = byId('hcHeroUIColorNative');
    var field = byId('hcHeroUIColorField');
    var slider = byId('hcHeroUIColorIntensity');
    if (!picker || !area || !field || !slider) return;

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
  }

  function mountPicker() {
    var host = byId('hashcodDirectRegistration');
    var card = host && host.querySelector('.hc-reg-card');
    if (!host || !card) return false;

    var existing = byId('hashcodHeroUIColorPicker');
    if (existing && existing.parentNode !== card) {
      existing.parentNode.removeChild(existing);
      existing = null;
    }
    if (existing) return true;

    var color = getSavedColor();
    var intensity = getSavedIntensity();
    card.insertAdjacentHTML('beforeend', pickerHtml(color, intensity));
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
