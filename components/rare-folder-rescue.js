(function () {
  'use strict';

  if (window.__hashcodRareFolderRescueLoaded) return;
  window.__hashcodRareFolderRescueLoaded = true;

  const BASE = (function () {
    const current = document.currentScript;
    const src = current && current.src ? current.src : '';
    return src && src.lastIndexOf('/') >= 0 ? src.slice(0, src.lastIndexOf('/') + 1) : '/components/';
  })();

  let fallbackRequested = false;

  function visibleRareFolder() {
    const host = document.getElementById('hashcodRareFolderHost');
    if (!host) return false;
    const folder = host.querySelector('[data-slot="folder"]');
    if (!folder) return false;
    const rect = folder.getBoundingClientRect();
    return rect.width > 40 && rect.height > 40;
  }

  function removeFallbackWhenRareFolderReturns() {
    if (!visibleRareFolder()) return false;
    const fallback = document.getElementById('hashcodBootFolderAnimation');
    if (fallback) fallback.remove();
    return true;
  }

  function loadFallback() {
    if (fallbackRequested || visibleRareFolder()) return;
    fallbackRequested = true;

    if (!document.getElementById('hashcodBootFolderAnimationStyles')) {
      const style = document.createElement('link');
      style.id = 'hashcodBootFolderAnimationStyles';
      style.rel = 'stylesheet';
      style.href = BASE + 'boot-folder-animation.css?v=20260917-rescue1';
      document.head.appendChild(style);
    }

    if (!document.querySelector('script[data-hashcod-boot-folder-rescue]')) {
      const script = document.createElement('script');
      script.src = BASE + 'boot-folder-animation.js?v=20260917-rescue1';
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
  }

  function verify() {
    if (removeFallbackWhenRareFolderReturns()) return;
    loadFallback();
    positionFallback();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      window.setTimeout(verify, 900);
      window.setTimeout(verify, 1800);
      window.setTimeout(verify, 3200);
    }, { once: true });
  } else {
    window.setTimeout(verify, 900);
    window.setTimeout(verify, 1800);
    window.setTimeout(verify, 3200);
  }

  window.addEventListener('resize', positionFallback, { passive: true });
})();
