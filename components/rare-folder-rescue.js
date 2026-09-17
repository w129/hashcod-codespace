(function () {
  'use strict';

  if (window.__hashcodRareFolderRescueLoaded) return;
  window.__hashcodRareFolderRescueLoaded = true;

  const current = document.currentScript;
  const currentSrc = current && current.src ? current.src : '';
  const componentBase = currentSrc && currentSrc.lastIndexOf('/') >= 0
    ? currentSrc.slice(0, currentSrc.lastIndexOf('/') + 1)
    : '/components/';

  let fallbackRequested = false;

  function rareFolderIsVisible() {
    const host = document.getElementById('hashcodRareFolderHost');
    if (!host) return false;
    const folder = host.querySelector('[data-slot="folder"]');
    if (!folder || typeof folder.getBoundingClientRect !== 'function') return false;
    const rect = folder.getBoundingClientRect();
    return rect.width > 40 && rect.height > 40;
  }

  function removeFallbackIfPrimaryReturned() {
    if (!rareFolderIsVisible()) return false;
    const fallback = document.getElementById('hashcodBootFolderAnimation');
    if (fallback) fallback.remove();
    return true;
  }

  function loadFallbackAssets() {
    if (fallbackRequested || rareFolderIsVisible()) return;
    fallbackRequested = true;

    if (!document.getElementById('hashcodBootFolderAnimationStyles')) {
      const style = document.createElement('link');
      style.id = 'hashcodBootFolderAnimationStyles';
      style.rel = 'stylesheet';
      style.href = componentBase + 'boot-folder-animation.css?v=20260917-rescue2';
      document.head.appendChild(style);
    }

    if (!document.querySelector('script[data-hashcod-boot-folder-rescue]')) {
      const script = document.createElement('script');
      script.src = componentBase + 'boot-folder-animation.js?v=20260917-rescue2';
      script.defer = true;
      script.dataset.hashcodBootFolderRescue = 'true';
      document.head.appendChild(script);
    }
  }

  function positionFallback() {
    const fallback = document.getElementById('hashcodBootFolderAnimation');
    if (!fallback) return;

    const width = window.innerWidth || 0;
    if (width >= 1181) {
      fallback.style.setProperty('left', '38vw', 'important');
      fallback.style.setProperty('top', '50vh', 'important');
    } else if (width >= 901) {
      fallback.style.setProperty('left', '35vw', 'important');
      fallback.style.setProperty('top', '48vh', 'important');
    }

    fallback.style.setProperty('display', 'block', 'important');
    fallback.style.setProperty('visibility', 'visible', 'important');
    fallback.style.setProperty('opacity', '1', 'important');
    fallback.setAttribute('data-hashcod-folder-rescue-active', 'true');
  }

  function verify() {
    if (removeFallbackIfPrimaryReturned()) return;
    loadFallbackAssets();
    positionFallback();
  }

  function begin() {
    // Give the generated React/Motion bundle time to mount. Only then use the
    // native fallback, so normal builds keep the original Rare UI animation.
    [900, 1600, 2800, 4500].forEach(function (delay) {
      window.setTimeout(verify, delay);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', begin, { once: true });
  } else {
    begin();
  }

  window.addEventListener('resize', positionFallback, { passive: true });
})();
