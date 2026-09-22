/**
 * HASHCOD CODESPACE · SAFE SECURITY MONITOR SHIM
 *
 * Reemplaza el antiguo monitor demostrativo que contenía ejemplos de tokens,
 * eval() y comandos peligrosos. Este archivo solo muestra estado visual y no
 * ejecuta código recibido del usuario ni contiene credenciales de ejemplo.
 */
(function (window, document) {
  'use strict';

  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once: true });
    } else {
      fn();
    }
  }

  function injectBadge() {
    if (document.getElementById('hashcodSafeSecurityBadge')) return;
    const badge = document.createElement('button');
    badge.id = 'hashcodSafeSecurityBadge';
    badge.type = 'button';
    badge.textContent = 'Security: hardened';
    badge.setAttribute('aria-label', 'Hashcod security status');
    badge.style.cssText = [
      'position:fixed',
      'right:14px',
      'top:14px',
      'z-index:9999',
      'border:1px solid #111',
      'background:#fff',
      'color:#111',
      'border-radius:10px',
      'padding:8px 12px',
      'font:600 12px/1.2 system-ui,-apple-system,Segoe UI,sans-serif',
      'box-shadow:0 6px 18px rgba(0,0,0,.12)',
      'cursor:default'
    ].join(';');
    document.documentElement.appendChild(badge);
  }

  window.HashcodSecurityMonitor = {
    version: 'safe-shim-2026-09-21',
    status: 'hardened',
    runFullAudit: function () {
      console.info('[Hashcod Security] Safe monitor active. No client-side command execution is enabled.');
      return { ok: true, status: 'safe-monitor-active' };
    }
  };

  ready(injectBadge);
})(window, document);
