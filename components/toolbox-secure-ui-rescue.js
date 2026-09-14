(function () {
  'use strict';

  // RETIRED 2026-09-14
  // This file is intentionally kept because l8-html.php inlines it before the
  // historical Secure Toolbox runtime. Setting the loaded flags here prevents
  // stale cached copies of toolbox-secure-links.js from installing their click
  // interception on the 4x4 Toolbox circles.
  window.__hashcodToolboxCircleLinksRetired = true;
  window.__hashcodSecureToolboxLinksLoaded = true;
  window.__hashcodToolboxSignatureCopyLoaded = true;
  window.__hashcodToolboxUiRescueLoaded = true;

  function cleanup() {
    var root = document.getElementById('hashcodSecureToolboxRoot');
    if (root && root.parentNode) root.parentNode.removeChild(root);

    document.querySelectorAll('.tb-slot[data-slot]').forEach(function (slot) {
      slot.classList.remove('hashcod-secure-link-slot');
      slot.removeAttribute('data-hashcod-secure-link');
      slot.removeAttribute('data-hashcod-link-capable');
      var label = slot.querySelector(':scope > .hsl-slot-label');
      if (label && label.parentNode) label.parentNode.removeChild(label);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', cleanup, { once: true });
  } else {
    cleanup();
  }
  window.addEventListener('hashcod:platform-entered', cleanup);
})();
