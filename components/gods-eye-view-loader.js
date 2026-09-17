(function () {
  'use strict';

  if (window.__hashcodGodsEyeViewLoaderLoaded) return;
  window.__hashcodGodsEyeViewLoaderLoaded = true;

  const current = document.currentScript;
  const currentSrc = current && current.src ? current.src : '';
  const componentBase = currentSrc && currentSrc.lastIndexOf('/') >= 0
    ? currentSrc.slice(0, currentSrc.lastIndexOf('/') + 1)
    : '/components/';

  function ensureStylesheet(id, file) {
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = componentBase + file;
    document.head.appendChild(link);
  }

  function loadOrbitTracker() {
    if (document.querySelector('script[data-hashcod-gods-eye-satellite-orbits]')) return;
    const orbit = document.createElement('script');
    orbit.src = componentBase + 'gods-eye-satellite-orbits.js?v=20260917-1';
    orbit.defer = true;
    orbit.dataset.hashcodGodsEyeSatelliteOrbits = 'true';
    document.head.appendChild(orbit);
  }

  ensureStylesheet('hashcodGodsEyeViewStylesheet', 'gods-eye-view.css?v=20260917-1');
  ensureStylesheet('hashcodGodsEyeSatelliteOrbitStylesheet', 'gods-eye-satellite-orbits.css?v=20260917-1');

  const existing = document.querySelector('script[data-hashcod-gods-eye-view]');
  if (!existing) {
    const script = document.createElement('script');
    script.src = componentBase + 'gods-eye-view.js?v=20260917-1';
    script.defer = true;
    script.dataset.hashcodGodsEyeView = 'true';
    script.addEventListener('load', loadOrbitTracker, { once: true });
    document.head.appendChild(script);
  } else if (window.HashcodGodsEyeView) {
    loadOrbitTracker();
  } else {
    existing.addEventListener('load', loadOrbitTracker, { once: true });
  }
})();
