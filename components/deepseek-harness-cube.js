(function () {
  'use strict';

  if (window.__hashcodDeepSeekHarnessCubeLoaded) return;
  window.__hashcodDeepSeekHarnessCubeLoaded = true;

  const TOOL_ID = 'deepseek-harness';
  const TRAY_SLOT = 5;
  const MODAL_ID = 'hashcodDeepSeekHarnessModal';
  const STATUS_ID = 'hashcodDeepSeekHarnessStatus';
  const PORT_KEY = 'hashcod_dsh_port_v1';
  const DEFAULT_PORT = 3080;
  const LOCAL_HOST = '127.0.0.1';
  const UPSTREAM = 'https://github.com/wangbo178/Agi-deepseek-harnees';
  const state = { status: 'idle', lastCheckedAt: null, lastError: '' };

  const ICON = [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" aria-hidden="true" focusable="false" style="display:block;width:78%;height:78%;max-width:39px;max-height:39px">',
      '<circle cx="60" cy="60" r="36" fill="none" stroke="#111" stroke-width="8"/>',
      '<circle cx="60" cy="24" r="8" fill="#111"/>',
      '<circle cx="91" cy="78" r="8" fill="#111"/>',
      '<circle cx="29" cy="78" r="8" fill="#111"/>',
      '<path d="M60 32v18M84 73l-16-9M36 73l16-9" stroke="#111" stroke-width="6" stroke-linecap="round"/>',
      '<rect x="47" y="49" width="26" height="24" rx="6" fill="#111"/>',
      '<text x="60" y="65" text-anchor="middle" font-family="monospace" font-size="10" font-weight="700" fill="#fff">DSH</text>',
    '</svg>'
  ].join('');

  function readPort() {
    try {
      const raw = Number(localStorage.getItem(PORT_KEY));
      if (Number.isInteger(raw) && raw >= 1024 && raw <= 65535) return raw;
    } catch (_) {}
    return DEFAULT_PORT;
  }

  function writePort(value) {
    const port = Number(value);
    if (!Number.isInteger(port) || port < 1024 || port > 65535) return DEFAULT_PORT;
    try { localStorage.setItem(PORT_KEY, String(port)); } catch (_) {}
    return port;
  }

  function runtimeUrl() {
    return 'http://' + LOCAL_HOST + ':' + readPort();
  }

  function launchCommand() {
    return 'node local-app/deepseek-harness-launcher.mjs --port ' + readPort();
  }

  function statusCopy() {
    if (state.status === 'online') return ['ONLINE', 'DeepSeek Harness respondió en el runtime local.'];
    if (state.status === 'offline') return ['OFFLINE', 'No se detectó DeepSeek Harness en este puerto.'];
    if (state.status === 'browser-limited') return ['LOCAL', 'Este origen no puede verificar HTTP local de forma fiable. Abre el runtime directamente.'];
    if (state.status === 'checking') return ['CHECKING', 'Comprobando el runtime local…'];
    return ['LOCAL ONLY', 'El runtime DSH permanece limitado a 127.0.0.1.'];
  }

  function renderStatus() {
    const badge = document.getElementById(STATUS_ID);
    const detail = document.getElementById('hashcodDeepSeekHarnessStatusDetail');
    const url = document.getElementById('hashcodDeepSeekHarnessRuntimeUrl');
    const port = document.getElementById('hashcodDeepSeekHarnessPort');
    const pair = statusCopy();
    if (badge) {
      badge.textContent = pair[0];
      badge.dataset.status = state.status;
    }
    if (detail) detail.textContent = pair[1];
    if (url) url.textContent = runtimeUrl();
    if (port && document.activeElement !== port) port.value = String(readPort());
  }

  function ensureModal() {
    let modal = document.getElementById(MODAL_ID);
    if (modal) return modal;

    modal = document.createElement('dialog');
    modal.id = MODAL_ID;
    modal.className = 'hashcod-dsh-dialog';
    modal.setAttribute('aria-labelledby', 'hashcodDeepSeekHarnessTitle');
    modal.innerHTML = [
      '<div class="hashcod-dsh-shell">',
        '<header class="hashcod-dsh-topbar">',
          '<div>',
            '<div class="hashcod-dsh-kicker">HASHCOD / DSH / LOCAL</div>',
            '<h2 id="hashcodDeepSeekHarnessTitle">DeepSeek Harness</h2>',
            '<p>Agent harness local basado en plugins, sesiones y herramientas.</p>',
          '</div>',
          '<div class="hashcod-dsh-top-actions">',
            '<span id="' + STATUS_ID + '" class="hashcod-dsh-status" data-status="idle">LOCAL ONLY</span>',
            '<button id="hashcodDeepSeekHarnessClose" type="button" class="hashcod-dsh-icon-btn" aria-label="Cerrar">×</button>',
          '</div>',
        '</header>',
        '<div class="hashcod-dsh-body">',
          '<section class="hashcod-dsh-runtime-card">',
            '<div class="hashcod-dsh-runtime-head">',
              '<div>',
                '<span class="hashcod-dsh-eyebrow">RUNTIME</span>',
                '<strong id="hashcodDeepSeekHarnessRuntimeUrl">' + runtimeUrl() + '</strong>',
              '</div>',
              '<label class="hashcod-dsh-port">PORT <input id="hashcodDeepSeekHarnessPort" type="number" min="1024" max="65535" step="1" value="' + readPort() + '"></label>',
            '</div>',
            '<p id="hashcodDeepSeekHarnessStatusDetail">El runtime DSH permanece limitado a 127.0.0.1.</p>',
            '<div class="hashcod-dsh-actions">',
              '<button id="hashcodDeepSeekHarnessCheck" type="button">Check runtime</button>',
              '<button id="hashcodDeepSeekHarnessOpen" type="button" class="primary">Open Harness</button>',
              '<button id="hashcodDeepSeekHarnessCopy" type="button">Copy launch command</button>',
            '</div>',
          '</section>',
          '<section class="hashcod-dsh-grid" aria-label="DeepSeek Harness architecture">',
            '<article><span>01</span><h3>Profiles + plugins</h3><p>El runtime se compone por perfiles y plugins reemplazables, siguiendo la arquitectura Cordis.</p></article>',
            '<article><span>02</span><h3>Session log</h3><p>Los turnos, mensajes, herramientas y resultados se conservan como eventos durables de sesión.</p></article>',
            '<article><span>03</span><h3>Tool pipeline</h3><p>Las herramientas pasan por registro, aprobación y ejecución antes de devolver resultados al agente.</p></article>',
            '<article><span>04</span><h3>Local workspace</h3><p>El workspace se mantiene en tu equipo. Hashcod no publica este runtime en Render.</p></article>',
          '</section>',
          '<section class="hashcod-dsh-command">',
            '<span>LAUNCH</span>',
            '<code id="hashcodDeepSeekHarnessCommand">' + launchCommand() + '</code>',
          '</section>',
        '</div>',
        '<footer class="hashcod-dsh-footer">',
          '<span>Integration profile: HASHCOD-DSH-1</span>',
          '<a href="' + UPSTREAM + '" target="_blank" rel="noopener noreferrer">Upstream · MIT</a>',
        '</footer>',
      '</div>'
    ].join('');
    document.body.appendChild(modal);

    modal.addEventListener('cancel', function (event) {
      event.preventDefault();
      closeModal();
    });
    document.getElementById('hashcodDeepSeekHarnessClose').addEventListener('click', closeModal);
    document.getElementById('hashcodDeepSeekHarnessCheck').addEventListener('click', checkRuntime);
    document.getElementById('hashcodDeepSeekHarnessOpen').addEventListener('click', openRuntime);
    document.getElementById('hashcodDeepSeekHarnessCopy').addEventListener('click', copyLaunchCommand);
    document.getElementById('hashcodDeepSeekHarnessPort').addEventListener('change', function (event) {
      writePort(event.target.value);
      document.getElementById('hashcodDeepSeekHarnessCommand').textContent = launchCommand();
      state.status = 'idle';
      renderStatus();
    });

    renderStatus();
    return modal;
  }

  function openModal() {
    const modal = ensureModal();
    modal.hidden = false;
    modal.setAttribute('aria-hidden', 'false');
    if (typeof modal.showModal === 'function' && !modal.open) modal.showModal();
    else modal.setAttribute('open', '');
    renderStatus();
    window.dispatchEvent(new CustomEvent('hashcod:deepseek-harness-open'));
  }

  function closeModal() {
    const modal = document.getElementById(MODAL_ID);
    if (!modal) return;
    if (typeof modal.close === 'function' && modal.open) modal.close();
    else modal.removeAttribute('open');
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
    const button = document.querySelector('#hashcodVectorTray [data-vector-tray-slot="' + TRAY_SLOT + '"]');
    if (button && typeof button.focus === 'function') button.focus({ preventScroll: true });
  }

  async function checkRuntime() {
    const protocol = String(location.protocol || '').toLowerCase();
    if (protocol === 'https:') {
      state.status = 'browser-limited';
      state.lastCheckedAt = Date.now();
      state.lastError = 'https-to-http-local-probe-blocked';
      renderStatus();
      return false;
    }

    state.status = 'checking';
    state.lastError = '';
    renderStatus();
    const controller = typeof AbortController === 'function' ? new AbortController() : null;
    const timeout = setTimeout(function () { if (controller) controller.abort(); }, 1800);
    try {
      await fetch(runtimeUrl() + '/', {
        method: 'GET',
        mode: 'no-cors',
        cache: 'no-store',
        credentials: 'omit',
        signal: controller ? controller.signal : undefined
      });
      state.status = 'online';
      state.lastCheckedAt = Date.now();
      return true;
    } catch (error) {
      state.status = 'offline';
      state.lastCheckedAt = Date.now();
      state.lastError = String(error && error.message ? error.message : error || 'unavailable');
      return false;
    } finally {
      clearTimeout(timeout);
      renderStatus();
    }
  }

  function openRuntime() {
    const popup = window.open(runtimeUrl(), '_blank', 'noopener,noreferrer');
    if (popup) popup.opener = null;
  }

  async function copyLaunchCommand() {
    const command = launchCommand();
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) await navigator.clipboard.writeText(command);
      else {
        const textarea = document.createElement('textarea');
        textarea.value = command;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        textarea.remove();
      }
      const button = document.getElementById('hashcodDeepSeekHarnessCopy');
      if (button) {
        const previous = button.textContent;
        button.textContent = 'Copied';
        setTimeout(function () { button.textContent = previous; }, 1200);
      }
    } catch (_) {}
  }

  function registerTool() {
    const api = window.HashcodVectorTray;
    if (!api || typeof api.registerTool !== 'function') return false;
    api.registerTool({
      slot: TRAY_SLOT,
      id: TOOL_ID,
      label: 'DeepSeek Harness',
      iconSvg: ICON,
      onClick: openModal
    });
    return true;
  }

  function boot() {
    ensureModal();
    if (registerTool()) return;
    let attempts = 0;
    const timer = setInterval(function () {
      attempts += 1;
      if (registerTool() || attempts >= 80) clearInterval(timer);
    }, 125);
  }

  window.HashcodDeepSeekHarness = Object.freeze({
    open: openModal,
    close: closeModal,
    check: checkRuntime,
    runtimeUrl: runtimeUrl,
    launchCommand: launchCommand,
    diagnostics: function () {
      const button = document.querySelector('#hashcodVectorTray [data-vector-tray-slot="' + TRAY_SLOT + '"]');
      const modal = document.getElementById(MODAL_ID);
      return {
        ready: true,
        toolId: TOOL_ID,
        slot: TRAY_SLOT,
        buttonFound: Boolean(button),
        buttonToolId: button ? button.getAttribute('data-tool-id') : null,
        modalOpen: Boolean(modal && modal.open && !modal.hidden),
        status: state.status,
        lastCheckedAt: state.lastCheckedAt,
        lastError: state.lastError,
        runtimeUrl: runtimeUrl(),
        host: LOCAL_HOST,
        hostLocked: LOCAL_HOST === '127.0.0.1',
        upstream: UPSTREAM,
        profile: 'HASHCOD-DSH-1'
      };
    }
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
