(function () {
  'use strict';

  if (window.__hashcodGodsEyeViewLoaderLoaded) return;
  window.__hashcodGodsEyeViewLoaderLoaded = true;

  const current = document.currentScript;
  const currentSrc = current && current.src ? current.src : '';
  const componentBase = currentSrc && currentSrc.lastIndexOf('/') >= 0
    ? currentSrc.slice(0, currentSrc.lastIndexOf('/') + 1)
    : '/components/';

  if (!document.getElementById('hashcodGodsEyeViewStylesheet')) {
    const link = document.createElement('link');
    link.id = 'hashcodGodsEyeViewStylesheet';
    link.rel = 'stylesheet';
    link.href = componentBase + 'gods-eye-view.css?v=20260917-1';
    document.head.appendChild(link);
  }

  if (!document.querySelector('script[data-hashcod-gods-eye-view]')) {
    const script = document.createElement('script');
    script.src = componentBase + 'gods-eye-view.js?v=20260917-1';
    script.defer = true;
    script.dataset.hashcodGodsEyeView = 'true';
    document.head.appendChild(script);
  }
})();
