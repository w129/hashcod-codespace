(function (window, document) {
  'use strict';

  var VERSION = '20260926-platform-crm2';
  if (window.__hashcodPlatformCrmVersion === VERSION) return;
  window.__hashcodPlatformCrmVersion = VERSION;

  var STORAGE_KEY = 'hashcod_platform_crm_v1';
  var DESKCOMM_URL_KEY = 'hashcod_deskcomm_crm_url_v1';
  var BUTTON_ID = 'hashcodPlatformCrmButton';
  var MODAL_ID = 'hashcodPlatformCrmModal';
  var STAGES = [
    { id: 'nuevo', label: 'Nuevo' },
    { id: 'contactado', label: 'Contactado' },
    { id: 'demo', label: 'Demo' },
    { id: 'negociacion', label: 'Negociación' },
    { id: 'ganado', label: 'Ganado' },
    { id: 'pausado', label: 'Pausado' }
  ];
  var ICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="#22A0E0" d="M18.841,5.791c-0.751,0-1.471,0.153-2.101,0.455c-0.735-1.32-2.129-2.232-3.689-2.232c-1.201,0-2.296,0.517-3.046,1.323L9.989,5.321C9.119,4.212,7.8,3.5,6.269,3.5C3.72,3.5,1.62,5.594,1.62,8.204c0,0.655,0.135,1.292,0.39,1.868C0.811,10.786,0,12.106,0,13.625c0,2.276,1.801,4.098,4.005,4.098c0.285,0,0.554-0.014,0.825-0.075c0.6,1.67,2.191,2.853,4.05,2.853c1.786,0,3.315-1.091,3.974-2.655c0.495,0.228,1.05,0.379,1.65,0.379c1.425,0,2.655-0.789,3.3-1.973c0.33,0.06,0.675,0.105,1.02,0.105c2.865,0,5.176-2.367,5.176-5.282C24,8.159,21.691,5.791,18.841,5.791z"></path><path fill="#1E8BC3" d="M6.269,3.5C3.72,3.5,1.62,5.594,1.62,8.204c0,0.655,0.135,1.292,0.39,1.868C0.811,10.786,0,12.106,0,13.625l0,0c0,2.276,1.801,4.098,4.005,4.098c0.285,0,0.554-0.014,0.825-0.075c0.6,1.67,2.191,2.853,4.05,2.853c1.228,0,2.334-0.515,3.12-1.346V4.149c-0.779,0.203-1.47,0.625-1.994,1.188L9.989,5.321C9.119,4.212,7.8,3.5,6.269,3.5z"></path></svg>';

  var state = {
    records: {},
    selected: '',
    query: '',
    tab: 'crm',
    modalOpen: false,
    remoteSlots: []
  };

  function nowIso() { return new Date().toISOString(); }

  function safeJsonParse(value, fallback) {
    try { return JSON.parse(value); } catch (_) { return fallback; }
  }

  function loadState() {
    var saved = null;
    try {
      saved = safeJsonParse(localStorage.getItem(STORAGE_KEY), null);
    } catch (_) {
      saved = null;
    }
    if (saved && saved.records && typeof saved.records === 'object') {
      state.records = saved.records;
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        version: 1,
        records: state.records,
        updatedAt: nowIso()
      }));
    } catch (_) {}
  }

  function normalizeSlotKey(slot) {
    var id = String(slot || '').trim();
    if (!id) return '';
    if (/^slot-\d+-\d+$/.test(id)) return id;
    if (/^\d+$/.test(id)) return 'slot-cloud-' + id;
    return id.replace(/[^a-z0-9_-]/gi, '-').slice(0, 80);
  }

  function labelFromSlot(node, fallback) {
    var candidates = [
      node && node.getAttribute && node.getAttribute('aria-label'),
      node && node.getAttribute && node.getAttribute('title'),
      node && node.dataset && (node.dataset.toolName || node.dataset.tool || node.dataset.label),
      node && node.querySelector && node.querySelector('.tb-slot-badge') && node.querySelector('.tb-slot-badge').textContent,
      node && node.textContent
    ];
    for (var i = 0; i < candidates.length; i++) {
      var text = String(candidates[i] || '').replace(/\s+/g, ' ').trim();
      if (text && text.length > 1 && text.length < 100) return text;
    }
    return fallback;
  }

  function slotNumberFromId(id) {
    var m = String(id || '').match(/^slot-(\d+)-(\d+)$/);
    if (!m) return null;
    return (Number(m[1]) - 1) * 4 + Number(m[2]);
  }

  function createRecord(id, name, source, slotNumber) {
    return {
      id: id,
      name: name || 'Plataforma',
      source: source || 'toolbox',
      slotNumber: slotNumber == null ? null : slotNumber,
      stage: 'nuevo',
      owner: '',
      contact: '',
      nextAction: '',
      value: '',
      notes: '',
      tags: [],
      createdAt: nowIso(),
      updatedAt: nowIso()
    };
  }

  function upsertDetectedPlatform(id, name, source, slotNumber) {
    if (!id) return;
    if (!state.records[id]) {
      state.records[id] = createRecord(id, name, source, slotNumber);
      return;
    }
    var record = state.records[id];
    record.name = name || record.name;
    record.source = source || record.source;
    if (slotNumber != null) record.slotNumber = slotNumber;
    record.updatedAt = record.updatedAt || nowIso();
  }

  function scanToolbox() {
    var nodes = Array.from(document.querySelectorAll('.tb-slot[id], .tb-slot[data-slot]'));
    nodes.forEach(function (node, index) {
      var rawId = node.id || node.getAttribute('data-slot') || String(index + 1);
      var id = normalizeSlotKey(rawId);
      var slotNumber = slotNumberFromId(node.id) || Number(node.getAttribute('data-slot')) || (index + 1);
      var fallback = 'Plataforma · Círculo ' + slotNumber;
      var name = labelFromSlot(node, fallback);

      var meaningful =
        node.children.length > 0 ||
        String(node.getAttribute('data-tool-id') || '').trim() !== '' ||
        String(node.getAttribute('data-tool') || '').trim() !== '' ||
        String(node.getAttribute('aria-label') || '').trim() !== '' ||
        String(node.getAttribute('title') || '').trim() !== '';

      if (meaningful) upsertDetectedPlatform(id, name, 'toolbox-dom', slotNumber);
    });

    state.remoteSlots.forEach(function (row) {
      var slot = Number(row.slot);
      if (!Number.isFinite(slot)) return;
      var id = normalizeSlotKey(String(slot));
      upsertDetectedPlatform(id, 'Plataforma · Círculo ' + (slot + 1), 'toolbox-cloud', slot + 1);
    });

    saveState();
  }

  function pullCloudSlots() {
    return fetch('hashcod-sync.php?action=links.pull', {
      credentials: 'same-origin',
      headers: { 'Accept': 'application/json' }
    }).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    }).then(function (data) {
      state.remoteSlots = Array.isArray(data.links) ? data.links : [];
      scanToolbox();
      return state.remoteSlots;
    }).catch(function () {
      state.remoteSlots = [];
      scanToolbox();
      return [];
    });
  }

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch];
    });
  }

  function stageLabel(id) {
    var found = STAGES.find(function (s) { return s.id === id; });
    return found ? found.label : id;
  }

  function recordsList() {
    return Object.keys(state.records).map(function (key) { return state.records[key]; });
  }

  function filteredRecords() {
    var q = state.query.trim().toLowerCase();
    var all = recordsList();
    if (!q) return all;
    return all.filter(function (r) {
      return [r.name, r.owner, r.contact, r.notes, r.nextAction, stageLabel(r.stage)]
        .join(' ').toLowerCase().indexOf(q) >= 0;
    });
  }

  function metric(label, value, sub) {
    return '<div class="hcrm-metric"><span>' + esc(label) + '</span><strong>' + esc(value) + '</strong><small>' + esc(sub || '') + '</small></div>';
  }

  function renderMetrics() {
    var host = document.getElementById('hashcodPlatformCrmMetrics');
    if (!host) return;
    var all = recordsList();
    var won = all.filter(function (r) { return r.stage === 'ganado'; }).length;
    var active = all.filter(function (r) { return r.stage !== 'ganado' && r.stage !== 'pausado'; }).length;
    var next = all.filter(function (r) { return String(r.nextAction || '').trim() !== ''; }).length;
    host.innerHTML =
      metric('PLATAFORMAS', all.length, 'sincronizadas con toolbox') +
      metric('ACTIVAS', active, 'en seguimiento') +
      metric('GANADAS', won, 'pipeline cerrado') +
      metric('ACCIONES', next, 'próximos pasos definidos');
  }

  function card(record) {
    var slot = record.slotNumber ? 'CÍRCULO ' + record.slotNumber : 'PLATAFORMA';
    return '<button type="button" class="hcrm-card" data-record-id="' + esc(record.id) + '">' +
      '<span class="hcrm-card-kicker">' + esc(slot) + '</span>' +
      '<strong>' + esc(record.name) + '</strong>' +
      '<span class="hcrm-card-meta">' + esc(record.owner || 'Sin responsable') + '</span>' +
      '<span class="hcrm-card-next">' + esc(record.nextAction || 'Sin próxima acción') + '</span>' +
      '</button>';
  }

  function renderBoard() {
    var host = document.getElementById('hashcodPlatformCrmBoard');
    if (!host) return;
    var all = filteredRecords();
    host.innerHTML = STAGES.map(function (stage) {
      var items = all.filter(function (r) { return r.stage === stage.id; });
      return '<section class="hcrm-column" data-stage="' + stage.id + '">' +
        '<header><span>' + esc(stage.label) + '</span><b>' + items.length + '</b></header>' +
        '<div class="hcrm-column-body">' + (items.map(card).join('') || '<div class="hcrm-empty">Sin plataformas</div>') + '</div>' +
        '</section>';
    }).join('');

    host.querySelectorAll('[data-record-id]').forEach(function (button) {
      button.addEventListener('click', function () {
        state.selected = button.getAttribute('data-record-id') || '';
        renderDetail();
      });
    });
  }

  function renderDetail() {
    var host = document.getElementById('hashcodPlatformCrmDetail');
    if (!host) return;
    var record = state.records[state.selected];
    if (!record) {
      host.innerHTML = '<div class="hcrm-detail-empty"><strong>Selecciona una plataforma</strong><span>Abre una tarjeta del pipeline para editar su información comercial.</span></div>';
      return;
    }

    host.innerHTML = '<div class="hcrm-detail-head"><div><span>PLATAFORMA</span><h3>' + esc(record.name) + '</h3></div><button type="button" id="hashcodPlatformCrmDelete">×</button></div>' +
      '<label>Nombre<input id="hcrmName" value="' + esc(record.name) + '"></label>' +
      '<label>Etapa<select id="hcrmStage">' + STAGES.map(function (s) {
        return '<option value="' + s.id + '"' + (record.stage === s.id ? ' selected' : '') + '>' + esc(s.label) + '</option>';
      }).join('') + '</select></label>' +
      '<label>Responsable<input id="hcrmOwner" value="' + esc(record.owner) + '" placeholder="Nombre o equipo"></label>' +
      '<label>Contacto<input id="hcrmContact" value="' + esc(record.contact) + '" placeholder="Correo, teléfono o canal"></label>' +
      '<label>Próxima acción<input id="hcrmNext" value="' + esc(record.nextAction) + '" placeholder="Ej. llamada, demo, revisión"></label>' +
      '<label>Valor / oportunidad<input id="hcrmValue" value="' + esc(record.value) + '" placeholder="Ej. RD$ 25,000"></label>' +
      '<label>Notas<textarea id="hcrmNotes" rows="6" placeholder="Contexto, necesidades, historial...">' + esc(record.notes) + '</textarea></label>' +
      '<div class="hcrm-detail-actions"><button type="button" id="hcrmSave">GUARDAR CAMBIOS</button></div>';

    document.getElementById('hcrmSave').addEventListener('click', function () {
      record.name = document.getElementById('hcrmName').value.trim() || record.name;
      record.stage = document.getElementById('hcrmStage').value;
      record.owner = document.getElementById('hcrmOwner').value.trim();
      record.contact = document.getElementById('hcrmContact').value.trim();
      record.nextAction = document.getElementById('hcrmNext').value.trim();
      record.value = document.getElementById('hcrmValue').value.trim();
      record.notes = document.getElementById('hcrmNotes').value.trim();
      record.updatedAt = nowIso();
      saveState();
      renderAll();
    });

    document.getElementById('hashcodPlatformCrmDelete').addEventListener('click', function () {
      if (!window.confirm('¿Quitar esta plataforma del CRM? El círculo de la toolbox no se eliminará.')) return;
      delete state.records[record.id];
      state.selected = '';
      saveState();
      renderAll();
    });
  }

  function currentDeskcommUrl() {
    var server = String(window.HASHCOD_DESKCOMM_CRM_URL || '').trim();
    var local = '';
    try { local = String(localStorage.getItem(DESKCOMM_URL_KEY) || '').trim(); } catch (_) {}
    return local || server;
  }

  function normalizeHttpUrl(value) {
    var text = String(value || '').trim();
    if (!text) return '';
    try {
      var parsed = new URL(text, window.location.href);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return '';
      return parsed.href;
    } catch (_) { return ''; }
  }

  function renderDeskcomm() {
    var host = document.getElementById('hashcodPlatformCrmDeskcomm');
    if (!host) return;
    var url = currentDeskcommUrl();

    host.innerHTML =
      '<div class="hcrm-deskcomm-toolbar">' +
        '<div><span>DESKCOMM CRM BRIDGE</span><strong>' + (url ? 'Instancia configurada' : 'Configura tu instancia') + '</strong></div>' +
        '<div class="hcrm-deskcomm-url"><input id="hcrmDeskcommUrl" type="url" placeholder="https://crm.tudominio.com" value="' + esc(url) + '"><button id="hcrmDeskcommConnect" type="button">CONECTAR</button></div>' +
        (url ? '<button id="hcrmDeskcommExternal" class="hcrm-secondary" type="button">ABRIR APARTE</button>' : '') +
      '</div>' +
      (url
        ? '<div class="hcrm-frame-wrap"><iframe id="hcrmDeskcommFrame" src="' + esc(url) + '" title="DeskcommCRM" referrerpolicy="strict-origin-when-cross-origin" allow="clipboard-read; clipboard-write"></iframe><div class="hcrm-frame-hint">Si el servidor Deskcomm bloquea la carga embebida, usa “ABRIR APARTE”.</div></div>'
        : '<div class="hcrm-deskcomm-empty"><strong>DeskcommCRM está preparado como integración externa.</strong><p>DeskcommCRM requiere su propio Next.js, Supabase, Auth y servicios de producción. Hashcod mantiene ese runtime aislado para no degradar la plataforma. Introduce arriba la URL de tu instancia Deskcomm ya desplegada.</p><small>La integración interna de plataformas sigue funcionando sin esta URL.</small></div>');

    document.getElementById('hcrmDeskcommConnect').addEventListener('click', function () {
      var input = document.getElementById('hcrmDeskcommUrl');
      var normalized = normalizeHttpUrl(input.value);
      if (!normalized) {
        input.setCustomValidity('Usa una URL http/https válida.');
        input.reportValidity();
        return;
      }
      input.setCustomValidity('');
      try { localStorage.setItem(DESKCOMM_URL_KEY, normalized); } catch (_) {}
      renderDeskcomm();
    });

    var external = document.getElementById('hcrmDeskcommExternal');
    if (external) {
      external.addEventListener('click', function () {
        var target = currentDeskcommUrl();
        if (target) window.open(target, '_blank', 'noopener,noreferrer');
      });
    }
  }

  function setTab(tab) {
    state.tab = tab === 'deskcomm' ? 'deskcomm' : 'crm';
    document.querySelectorAll('[data-hcrm-tab]').forEach(function (button) {
      button.classList.toggle('is-active', button.getAttribute('data-hcrm-tab') === state.tab);
    });
    var crm = document.getElementById('hashcodPlatformCrmInternal');
    var deskcomm = document.getElementById('hashcodPlatformCrmDeskcomm');
    if (crm) crm.hidden = state.tab !== 'crm';
    if (deskcomm) deskcomm.hidden = state.tab !== 'deskcomm';
    if (state.tab === 'deskcomm') renderDeskcomm();
  }

  function renderAll() {
    renderMetrics();
    renderBoard();
    renderDetail();
  }

  function exportCrm() {
    var blob = new Blob([JSON.stringify({
      exportedAt: nowIso(),
      records: state.records
    }, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'hashcod-platform-crm.json';
    a.click();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function buildModal() {
    var existing = document.getElementById(MODAL_ID);
    if (existing) return existing;

    var modal = document.createElement('section');
    modal.id = MODAL_ID;
    modal.className = 'hashcod-platform-crm-modal';
    modal.hidden = true;
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Hashcod Platform CRM');
    modal.innerHTML =
      '<div class="hcrm-window">' +
        '<header class="hcrm-top">' +
          '<div class="hcrm-brand">' + ICON + '<div><span>HASHCOD / CRM</span><strong>Platform CRM</strong><small>DeskcommCRM architecture bridge · toolbox synchronized</small></div></div>' +
          '<nav class="hcrm-tabs"><button data-hcrm-tab="crm" class="is-active">PLATAFORMAS</button><button data-hcrm-tab="deskcomm">DESKCOMMCRM</button></nav>' +
          '<div class="hcrm-top-actions"><button id="hcrmSync" type="button">SINCRONIZAR</button><button id="hcrmExport" type="button">EXPORTAR</button><button id="hcrmClose" type="button" aria-label="Cerrar CRM">×</button></div>' +
        '</header>' +
        '<div id="hashcodPlatformCrmInternal" class="hcrm-internal">' +
          '<section id="hashcodPlatformCrmMetrics" class="hcrm-metrics"></section>' +
          '<div class="hcrm-search-row"><input id="hcrmSearch" type="search" placeholder="Buscar plataforma, responsable, contacto o acción..."><span id="hcrmSyncState">TOOLBOX LOCAL</span></div>' +
          '<div class="hcrm-workspace"><main id="hashcodPlatformCrmBoard" class="hcrm-board"></main><aside id="hashcodPlatformCrmDetail" class="hcrm-detail"></aside></div>' +
        '</div>' +
        '<section id="hashcodPlatformCrmDeskcomm" class="hcrm-deskcomm" hidden></section>' +
      '</div>';

    document.body.appendChild(modal);

    modal.querySelector('#hcrmClose').addEventListener('click', close);
    modal.querySelector('#hcrmSync').addEventListener('click', function () {
      var indicator = modal.querySelector('#hcrmSyncState');
      if (indicator) indicator.textContent = 'SINCRONIZANDO...';
      pullCloudSlots().finally(function () {
        renderAll();
        if (indicator) indicator.textContent = 'TOOLBOX SINCRONIZADA';
      });
    });
    modal.querySelector('#hcrmExport').addEventListener('click', exportCrm);
    modal.querySelector('#hcrmSearch').addEventListener('input', function (event) {
      state.query = event.target.value || '';
      renderBoard();
    });

    modal.querySelectorAll('[data-hcrm-tab]').forEach(function (button) {
      button.addEventListener('click', function () { setTab(button.getAttribute('data-hcrm-tab')); });
    });

    modal.addEventListener('click', function (event) {
      if (event.target === modal) close();
    });

    return modal;
  }

  function open() {
    var modal = buildModal();

    // Make the window visible first. Data discovery/sync must never be able to
    // block the click or make the CRM look unresponsive.
    state.modalOpen = true;
    modal.hidden = false;
    modal.removeAttribute('hidden');
    modal.classList.add('is-open');
    document.documentElement.classList.add('hashcod-crm-open');

    try {
      loadState();
      scanToolbox();
      renderAll();
      setTab('crm');
    } catch (error) {
      console.error('[Hashcod Platform CRM] render failed:', error);
      var detail = document.getElementById('hashcodPlatformCrmDetail');
      if (detail) {
        detail.innerHTML = '<div class="hcrm-detail-empty"><strong>CRM abierto</strong><span>La interfaz está activa, pero una fuente de datos no pudo cargarse. Puedes cerrar y volver a sincronizar.</span></div>';
      }
    }

    try {
      pullCloudSlots().then(renderAll).catch(function () {});
    } catch (_) {}

    try {
      window.dispatchEvent(new CustomEvent('hashcod:platform-crm-opened', {
        detail: { source: 'topbar', version: VERSION }
      }));
    } catch (_) {}
  }

  function close() {
    var modal = document.getElementById(MODAL_ID);
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.hidden = true;
    modal.setAttribute('hidden', '');
    state.modalOpen = false;
    document.documentElement.classList.remove('hashcod-crm-open');
  }

  function findTopbarHost() {
    return document.querySelector('.top-bar-right') ||
      document.querySelector('.top-bar .top-bar-actions') ||
      document.querySelector('.top-bar [class*="right"]') ||
      document.querySelector('.top-bar');
  }

  function hydrateButton(button, bar) {
    if (!button || !bar) return false;

    bar.classList.add('hashcod-platform-crm-host');

    button.type = 'button';
    button.id = BUTTON_ID;
    button.className = 'hashcod-platform-crm-button';
    button.title = 'Abrir CRM de plataformas';
    button.setAttribute('aria-label', 'Abrir CRM de plataformas');
    button.setAttribute('aria-haspopup', 'dialog');
    button.setAttribute('aria-controls', MODAL_ID);
    button.dataset.hashcodPlatformCrm = VERSION;

    // Critical geometry is duplicated inline so an old/missing CSS asset cannot
    // collapse the button into the thin line reported in production.
    [
      ['display', 'inline-flex'],
      ['align-items', 'center'],
      ['justify-content', 'center'],
      ['flex', '0 0 32px'],
      ['width', '32px'],
      ['min-width', '32px'],
      ['max-width', '32px'],
      ['height', '32px'],
      ['min-height', '32px'],
      ['max-height', '32px'],
      ['padding', '0'],
      ['margin', '0 7px 0 0'],
      ['overflow', 'visible'],
      ['pointer-events', 'auto'],
      ['box-sizing', 'border-box']
    ].forEach(function (pair) {
      button.style.setProperty(pair[0], pair[1], 'important');
    });

    button.innerHTML = ICON;

    if (!button.__hashcodPlatformCrmBound) {
      button.__hashcodPlatformCrmBound = true;
      button.addEventListener('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        if (typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
        open();
      }, true);
    }

    return true;
  }

  function mountButton() {
    var bar = findTopbarHost();
    if (!bar) return false;

    var button = document.getElementById(BUTTON_ID);
    if (!button) {
      button = document.createElement('button');
      var logout = bar.querySelector('#topBarLogoutBtn');
      if (logout) bar.insertBefore(button, logout);
      else bar.prepend(button);
    } else if (button.parentNode !== bar) {
      var logoutExisting = bar.querySelector('#topBarLogoutBtn');
      if (logoutExisting) bar.insertBefore(button, logoutExisting);
      else bar.prepend(button);
    }

    hydrateButton(button, bar);
    return true;
  }

  var mountObserver = null;
  var mountScheduled = false;

  function scheduleMount() {
    if (mountScheduled) return;
    mountScheduled = true;
    var run = function () {
      mountScheduled = false;
      mountButton();
    };
    if (typeof window.requestAnimationFrame === 'function') window.requestAnimationFrame(run);
    else window.setTimeout(run, 0);
  }

  function observeTopbar() {
    if (mountObserver || typeof MutationObserver !== 'function' || !document.body) return;
    mountObserver = new MutationObserver(function () {
      if (!document.getElementById(BUTTON_ID) || !findTopbarHost()) scheduleMount();
    });
    mountObserver.observe(document.body, { childList: true, subtree: true });
    window.setTimeout(function () {
      if (!mountObserver) return;
      mountButton();
      mountObserver.disconnect();
      mountObserver = null;
    }, 60000);
  }

  function boot() {
    loadState();
    if (document.body) buildModal();
    mountButton();
    observeTopbar();

    var attempts = 0;
    var timer = window.setInterval(function () {
      attempts += 1;
      if (mountButton() || attempts > 160) window.clearInterval(timer);
    }, 125);
  }

  // Capture-phase delegation keeps the CRM operational even if a legacy topbar
  // script replaces direct button handlers after this module mounted.
  document.addEventListener('click', function (event) {
    var target = event.target && event.target.closest
      ? event.target.closest('#' + BUTTON_ID)
      : null;
    if (!target) return;
    event.preventDefault();
    event.stopPropagation();
    if (typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
    open();
  }, true);

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && state.modalOpen) close();
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }

  window.addEventListener('hashcod:platform-entered', function () {
    mountButton();
    observeTopbar();
  });

  window.openHashcodPlatformCRM = open;
  window.HashcodPlatformCRM = Object.freeze({
    version: VERSION,
    open: open,
    close: close,
    mount: mountButton,
    sync: pullCloudSlots,
    scan: scanToolbox,
    records: function () { return recordsList().map(function (r) { return Object.assign({}, r); }); },
    deskcommUrl: currentDeskcommUrl
  });
})(window, document);
