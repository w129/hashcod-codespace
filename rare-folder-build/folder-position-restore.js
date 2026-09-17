// Keep the Rare UI folder at the historical Hashcod desktop anchor.
// This file is injected into the generated folder bundle so the placement is
// applied from the same inline artifact in both hosted and local builds.
(function () {
  'use strict';

  const DESKTOP_MIN_WIDTH = 1181;
  let observedFolder = null;
  let observer = null;

  function apply() {
    if ((window.innerWidth || 0) < DESKTOP_MIN_WIDTH) return false;

    const overlay = document.getElementById('bootCliOverlay');
    const folder = document.getElementById('hashcodRareFolderHost');
    if (!overlay || !folder) return false;

    const rect = overlay.getBoundingClientRect();
    if (!rect.width || !rect.height) return false;

    const left = (rect.left + rect.width * 0.38).toFixed(2) + 'px';
    const top = (rect.top + rect.height * 0.50).toFixed(2) + 'px';

    if (folder.style.getPropertyValue('position') !== 'fixed' || folder.style.getPropertyPriority('position') !== 'important') {
      folder.style.setProperty('position', 'fixed', 'important');
    }
    if (folder.style.getPropertyValue('left') !== left || folder.style.getPropertyPriority('left') !== 'important') {
      folder.style.setProperty('left', left, 'important');
    }
    if (folder.style.getPropertyValue('top') !== top || folder.style.getPropertyPriority('top') !== 'important') {
      folder.style.setProperty('top', top, 'important');
    }

    folder.removeAttribute('data-hashcod-brand-anchor-restored');
    folder.setAttribute('data-hashcod-folder-position-restored', 'true');
    return true;
  }

  function watchFolder() {
    apply();
    const folder = document.getElementById('hashcodRareFolderHost');
    if (!folder || folder === observedFolder) return;

    if (observer) observer.disconnect();
    observedFolder = folder;
    observer = new MutationObserver(function () {
      apply();
    });
    observer.observe(folder, { attributes: true, attributeFilter: ['style'] });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', watchFolder, { once: true });
  } else {
    watchFolder();
  }

  [0, 90, 280, 920, 1750, 2400].forEach(function (delay) {
    window.setTimeout(watchFolder, delay);
  });
  window.addEventListener('resize', watchFolder, { passive: true });
  window.addEventListener('hashcod:platform-entered', function () {
    if (observer) observer.disconnect();
    observer = null;
    observedFolder = null;
  }, { once: true });
})();
