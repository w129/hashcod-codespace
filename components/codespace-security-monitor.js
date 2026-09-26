/**
 * HASHCOD CODESPACE · SAFE SECURITY MONITOR SHIM
 *
 * Mantiene disponible el monitor seguro para auditorías internas sin pintar
 * badges visuales dentro de la plataforma. No intercepta la entrada ni elimina
 * el formulario restaurado de registro.
 */
(function (window, document) {
  'use strict';

  var internalIconObserver = null;

  function removeLegacyBadge() {
    var badge = document.getElementById('hashcodSafeSecurityBadge');
    if (badge && badge.parentNode) badge.parentNode.removeChild(badge);
  }

  function removeRetiredRegistrationAddons() {
    [
      'hashcodDirectRegistration',
      'hashcodHeroUIColorPicker',
      'hcCodeModal'
    ].forEach(function (id) {
      var node = document.getElementById(id);
      if (node && node.parentNode) node.parentNode.removeChild(node);
    });

    document.querySelectorAll('.hc-reg-card,.hc-heroui-colorpicker').forEach(function (node) {
      if (node && node.parentNode) node.parentNode.removeChild(node);
    });
  }

  function hideInternalEntryIcon() {
    var selectors = [
      '#hashcodAuthUtilityDock .crypto-card-direct-launcher-btn',
      '#hashcodAuthUtilityDock #cryptoCardValidationLauncherBtn',
      '#hashcodAuthUtilityDock .crypto-card-launcher-btn:not(#d5LauncherBtn)'
    ];

    document.querySelectorAll(selectors.join(',')).forEach(function (node) {
      node.hidden = true;
      node.setAttribute('aria-hidden', 'true');
      node.setAttribute('tabindex', '-1');
      node.style.setProperty('display', 'none', 'important');
      node.style.setProperty('visibility', 'hidden', 'important');
      node.style.setProperty('pointer-events', 'none', 'important');
      node.dataset.hashcodRemovedInternalEntryIcon = 'true';
    });
  }

  function observeInternalEntryIconRemoval() {
    if (internalIconObserver || !document.documentElement) return;
    internalIconObserver = new MutationObserver(function () {
      hideInternalEntryIcon();
      removeRetiredRegistrationAddons();
    });
    internalIconObserver.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'hidden']
    });
  }

  function installDockIconIntegrationStyle() {
    if (document.getElementById('hashcodDockIconIntegrationRescue')) return;
    var style = document.createElement('style');
    style.id = 'hashcodDockIconIntegrationRescue';
    style.textContent = [
      '#hashcodAuthUtilityDock.hashcod-auth-utility-dock{display:inline-flex!important;align-items:center!important;justify-content:flex-end!important;gap:8px!important;height:54px!important;min-height:54px!important;padding:5px!important;border:1px solid rgba(17,17,17,.10)!important;border-radius:16px!important;background:rgba(255,255,255,.86)!important;box-shadow:0 18px 42px rgba(0,0,0,.08)!important;backdrop-filter:blur(10px)!important;-webkit-backdrop-filter:blur(10px)!important;overflow:hidden!important;}',
      '#hashcodAuthUtilityDock .crypto-card-direct-launcher-btn,#hashcodAuthUtilityDock #cryptoCardValidationLauncherBtn,#hashcodAuthUtilityDock .crypto-card-launcher-btn:not(#d5LauncherBtn),#hashcodAuthUtilityDock [data-hashcod-removed-internal-entry-icon="true"]{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important;width:0!important;min-width:0!important;max-width:0!important;height:0!important;min-height:0!important;max-height:0!important;margin:0!important;padding:0!important;border:0!important;overflow:hidden!important;}',
      '#hashcodAuthUtilityDock #d5LauncherBtn,#hashcodAuthUtilityDock .hashcod-auth-utility-button:not(.crypto-card-direct-launcher-btn):not(.crypto-card-launcher-btn){position:relative!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;flex:0 0 42px!important;width:42px!important;min-width:42px!important;max-width:42px!important;height:42px!important;min-height:42px!important;max-height:42px!important;margin:0!important;padding:0!important;border:1px solid rgba(17,17,17,.16)!important;border-radius:12px!important;background:rgba(255,255,255,.72)!important;color:#111!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.82),0 5px 14px rgba(0,0,0,.055)!important;overflow:hidden!important;}',
      '#hashcodAuthUtilityDock svg,#hashcodAuthUtilityDock img,#hashcodAuthUtilityDock canvas,#hashcodAuthUtilityDock .hashcod-auth-utility-button svg,#hashcodAuthUtilityDock .hashcod-auth-utility-button img,#hashcodAuthUtilityDock .hashcod-auth-utility-button canvas{display:block!important;width:24px!important;height:24px!important;min-width:24px!important;min-height:24px!important;max-width:24px!important;max-height:24px!important;margin:0!important;object-fit:contain!important;object-position:center!important;fill:currentColor!important;color:currentColor!important;stroke:currentColor!important;transform:none!important;}',
      '#hashcodAuthUtilityDock #d5LauncherBtn>*,#hashcodAuthUtilityDock .hashcod-auth-utility-button:not(.crypto-card-direct-launcher-btn):not(.crypto-card-launcher-btn)>*{max-width:24px!important;max-height:24px!important;overflow:hidden!important;flex:0 0 auto!important;}',
      '#hashcodAuthUtilityDock button:hover,#hashcodAuthUtilityDock button:focus-visible,#hashcodAuthUtilityDock a:hover,#hashcodAuthUtilityDock a:focus-visible{background:#111!important;color:#fff!important;border-color:#111!important;outline:none!important;transform:translateY(-1px)!important;}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function bootVisualCleanup() {
    removeLegacyBadge();
    removeRetiredRegistrationAddons();
    hideInternalEntryIcon();
    installDockIconIntegrationStyle();
    observeInternalEntryIconRemoval();
  }

  window.HashcodSecurityMonitor = {
    version: 'safe-shim-2026-09-25-registration-restored',
    status: 'hardened',
    runFullAudit: function () {
      console.info('[Hashcod Security] Safe monitor active. Registration flow is controlled by platform-registration-form.js.');
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
