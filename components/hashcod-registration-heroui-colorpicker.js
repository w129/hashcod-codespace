/* Hashcod registration · legacy HeroUI ColorPicker bridge retired.
   This keeps the old path alive while preventing legacy observers/timers from
   freezing the current registration entry flow. */
(function (window, document) {
  'use strict';

  var VERSION = '20260926-colorpicker-retired-nofreeze1';
  if (window.__hashcodHeroUIColorPickerBridge === VERSION) return;

  window.__hashcodHeroUIColorPickerBridge = VERSION;
  window.__hashcodLegacyColorPickerRetired = true;

  function cleanup() {
    var picker = document.getElementById('hashcodHeroUIColorPicker');
    if (picker && picker.parentNode) picker.parentNode.removeChild(picker);

    var oldRegistration = document.getElementById('hashcodDirectRegistration');
    if (oldRegistration) {
      oldRegistration.classList.remove('hc-has-heroui-colorpicker');
    }

    document.documentElement.style.removeProperty('--hashcod-colorpicker-selected');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', cleanup, { once: true });
  } else {
    cleanup();
  }
})(window, document);
