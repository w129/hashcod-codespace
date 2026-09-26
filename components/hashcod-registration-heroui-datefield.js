/* Hashcod registration · legacy HeroUI DateField bridge retired.
   This file keeps the old bundle path alive but intentionally installs no
   MutationObserver, no interval, and no legacy form fields. */
(function (window, document) {
  'use strict';

  var VERSION = '20260926-datefield-retired-nofreeze1';
  if (window.__hashcodHeroUIDateFieldBridge === VERSION) return;

  window.__hashcodHeroUIDateFieldBridge = VERSION;
  window.__hashcodLegacyDateFieldRetired = true;

  function cleanup() {
    [
      'hcHeroUIDateField',
      'hcBirthDate',
      'hcBirthDay',
      'hcBirthMonth',
      'hcBirthYear',
      'hcAgePill'
    ].forEach(function (id) {
      var node = document.getElementById(id);
      if (node && node.parentNode) node.parentNode.removeChild(node);
    });

    document.querySelectorAll('.hc-heroui-datefield,.hc-heroui-datefield-card').forEach(function (node) {
      node.classList.remove('hc-heroui-datefield-card');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', cleanup, { once: true });
  } else {
    cleanup();
  }
})(window, document);
