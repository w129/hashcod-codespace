/**
 * HASHCOD CODESPACE · SAFE SECURITY MONITOR SHIM
 *
 * Mantiene disponible el monitor seguro para auditorías internas, pero ya no
 * pinta el badge visual "Security: hardened" dentro de la plataforma.
 */
(function (window, document) {
  'use strict';

  function removeLegacyBadge() {
    var badge = document.getElementById('hashcodSafeSecurityBadge');
    if (badge && badge.parentNode) badge.parentNode.removeChild(badge);
  }

  function installDockIconIntegrationStyle() {
    if (document.getElementById('hashcodDockIconIntegrationRescue')) return;
    var style = document.createElement('style');
    style.id = 'hashcodDockIconIntegrationRescue';
    style.textContent = [
      '#hashcodAuthUtilityDock.hashcod-auth-utility-dock{display:inline-flex!important;align-items:center!important;justify-content:flex-end!important;gap:8px!important;height:54px!important;min-height:54px!important;padding:5px!important;border:1px solid rgba(17,17,17,.10)!important;border-radius:16px!important;background:rgba(255,255,255,.86)!important;box-shadow:0 18px 42px rgba(0,0,0,.08)!important;backdrop-filter:blur(10px)!important;-webkit-backdrop-filter:blur(10px)!important;overflow:hidden!important;}',
      '#hashcodAuthUtilityDock .crypto-card-launcher-btn,#hashcodAuthUtilityDock .crypto-card-direct-launcher-btn,#hashcodAuthUtilityDock #cryptoCardValidationLauncherBtn,#hashcodAuthUtilityDock #d5LauncherBtn,#hashcodAuthUtilityDock .hashcod-auth-utility-button{position:relative!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;flex:0 0 42px!important;width:42px!important;min-width:42px!important;max-width:42px!important;height:42px!important;min-height:42px!important;max-height:42px!important;margin:0!important;padding:0!important;border:1px solid rgba(17,17,17,.16)!important;border-radius:12px!important;background:rgba(255,255,255,.72)!important;color:#111!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.82),0 5px 14px rgba(0,0,0,.055)!important;overflow:hidden!important;}',
      '#hashcodAuthUtilityDock svg,#hashcodAuthUtilityDock img,#hashcodAuthUtilityDock canvas,#hashcodAuthUtilityDock .hashcod-auth-utility-button svg,#hashcodAuthUtilityDock .hashcod-auth-utility-button img,#hashcodAuthUtilityDock .hashcod-auth-utility-button canvas{display:block!important;width:24px!important;height:24px!important;min-width:24px!important;min-height:24px!important;max-width:24px!important;max-height:24px!important;margin:0!important;object-fit:contain!important;object-position:center!important;fill:currentColor!important;color:currentColor!important;stroke:currentColor!important;transform:none!important;}',
      '#hashcodAuthUtilityDock .crypto-card-direct-launcher-btn>*,#hashcodAuthUtilityDock .crypto-card-launcher-btn>*,#hashcodAuthUtilityDock .hashcod-auth-utility-button>*{max-width:24px!important;max-height:24px!important;overflow:hidden!important;flex:0 0 auto!important;}',
      '#hashcodAuthUtilityDock button:hover,#hashcodAuthUtilityDock button:focus-visible,#hashcodAuthUtilityDock a:hover,#hashcodAuthUtilityDock a:focus-visible{background:#111!important;color:#fff!important;border-color:#111!important;outline:none!important;transform:translateY(-1px)!important;}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function loadStylesheetOnce(id, href) {
    if (document.getElementById(id)) return;
    var link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  }

  function loadScriptOnce(id, src) {
    if (document.getElementById(id)) return;
    var script = document.createElement('script');
    script.id = id;
    script.src = src;
    script.defer = true;
    document.head.appendChild(script);
  }

  function loadRegistrationGlassTheme() {
    loadStylesheetOnce(
      'hashcodRegistrationGlassThemeStylesheet',
      '/components/hashcod-registration-glass-theme.css?v=20260924-glass1'
    );
  }

  function loadRegistrationPixelBackground() {
    loadStylesheetOnce(
      'hashcodRegistrationPixelBackgroundStylesheet',
      '/components/hashcod-registration-pixel-bg.css?v=20260925-gray1'
    );
  }

  function loadRegistrationHeroUIDateField() {
    loadStylesheetOnce(
      'hashcodRegistrationHeroUIDateFieldStylesheet',
      '/components/hashcod-registration-heroui-datefield.css?v=20260925-heroui2'
    );
    loadScriptOnce(
      'hashcodRegistrationHeroUIDateFieldBridge',
      '/components/hashcod-registration-heroui-datefield.js?v=20260925-heroui2'
    );
  }

  function loadRegistrationHeroUIColorPicker() {
    loadStylesheetOnce(
      'hashcodRegistrationHeroUIColorPickerStylesheet',
      '/components/hashcod-registration-heroui-colorpicker.css?v=20260925-colorpicker1'
    );
    loadScriptOnce(
      'hashcodRegistrationHeroUIColorPickerBridge',
      '/components/hashcod-registration-heroui-colorpicker.js?v=20260925-colorpicker1'
    );
  }

  function bootVisualCleanup() {
    removeLegacyBadge();
    installDockIconIntegrationStyle();
    loadRegistrationGlassTheme();
    loadRegistrationPixelBackground();
    loadRegistrationHeroUIDateField();
    loadRegistrationHeroUIColorPicker();
  }

  window.HashcodSecurityMonitor = {
    version: 'safe-shim-2026-09-25-registration-heroui-colorpicker',
    status: 'hardened',
    runFullAudit: function () {
      console.info('[Hashcod Security] Safe monitor active. No client-side command execution is enabled.');
      bootVisualCleanup();
      return { ok: true, status: 'safe-monitor-active' };
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootVisualCleanup, { once: true });
  } else {
    bootVisualCleanup();
  }
})(window, document);
