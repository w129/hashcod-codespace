/* Hashcod platform entry hold · retired passive bridge.
   The intermediate hold/registration screen is removed. This file is kept only
   so existing loader paths do not fail. It must not wrap l8EnterPlatform, set
   intervals, stop clicks, or open registration. */
(function (window, document) {
  'use strict';

  var VERSION = '20260926-hold-retired-passive-nofreeze1';
  if (window.__hashcodPlatformEntryHoldLoadedVersion === VERSION) return;

  window.__hashcodPlatformEntryHoldLoaded = true;
  window.__hashcodPlatformEntryHoldLoadedVersion = VERSION;
  window.__hashcodPlatformEntryHoldReady = true;

  document.documentElement.dataset.hashcodEntryGateReady = 'true';
  document.documentElement.dataset.hashcodRegistrationRetired = 'true';
  document.documentElement.dataset.hashcodFinalEntryScreen = 'false';

  try {
    window.dispatchEvent(new CustomEvent('hashcod:entry-gate-ready', {
      detail: {
        source: 'platform-entry-hold',
        version: VERSION,
        mode: 'retired-passive',
        interceptsClick: false,
        wrapsEntry: false
      }
    }));
  } catch (_) {}
})(window, document);
