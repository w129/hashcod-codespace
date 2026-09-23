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

  window.HashcodSecurityMonitor = {
    version: 'safe-shim-2026-09-22-no-badge',
    status: 'hardened',
    runFullAudit: function () {
      console.info('[Hashcod Security] Safe monitor active. No client-side command execution is enabled.');
      removeLegacyBadge();
      return { ok: true, status: 'safe-monitor-active' };
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', removeLegacyBadge, { once: true });
  } else {
    removeLegacyBadge();
  }
})(window, document);
