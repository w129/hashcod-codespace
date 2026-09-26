(function (window, document) {
  'use strict';

  var VERSION = '20260926-platform-crm5';
  if (window.__hashcodPlatformCrmVersion === VERSION) return;
  window.__hashcodPlatformCrmVersion = VERSION;

  var BUTTON_ID = 'hashcodPlatformCrmButton';
  var HOST_ID = 'hashcodPlatformCrmModal';
  var STORAGE_KEY = 'hashcod_platform_crm_v2';
  var LEGACY_KEY = 'hashcod_platform_crm_v1';
  var DESKCOMM_URL_KEY = 'hashcod_deskcomm_crm_url_v1';

  var STAGES = [
    ['nuevo', 'Nuevo'],
    ['contactado', 'Contactado'],
    ['demo', 'Demo'],
    ['negociacion', 'Negociación'],
    ['ganado', 'Ganado'],
    ['pausado', 'Pausado']
  ];

  var ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><path fill="#22A0E0" d="M18.841,5.791c-0.751,0-1.471,0.153-2.101,0.455c-0.735-1.32-2.129-2.232-3.689-2.232c-1.201,0-2.296,0.517-3.046,1.323L9.989,5.321C9.119,4.212,7.8,3.5,6.269,3.5C3.72,3.5,1.62,5.594,1.62,8.204c0,0.655,0.135,1.292,0.39,1.868C0.811,10.786,0,12.106,0,13.625c0,2.276,1.801,4.098,4.005,4.098c0.285,0,0.554-0.014,0.825-0.075c0.6,1.67,2.191,2.853,4.05,2.853c1.786,0,3.315-1.091,3.974-2.655c0.495,0.228,1.05,0.379,1.65,0.379c1.425,0,2.655-0.789,3.3-1.973c0.33,0.06,0.675,0.105,1.02,0.105c2.865,0,5.176-2.367,5.176-5.282C24,8.159,21.691,5.791,18.841,5.791z"></path><path fill="#1E8BC3" d="M6.269,3.5C3.72,3.5,1.62,5.594,1.62,8.204c0,0.655,0.135,1.292,0.39,1.868C0.811,10.786,0,12.106,0,13.625l0,0c0,2.276,1.801,4.098,4.005,4.098c0.285,0,0.554-0.014,0.825-0.075c0.6,1.67,2.191,2.853,4.05,2.853c1.228,0,2.334-0.515,3.12-1.346V4.149c-0.779,0.203-1.47,0.625-1.994,1.188L9.989,5.321C9.119,4.212,7.8,3.5,6.269,3.5z"></path></svg>';

  var state = {
    records: {},
    selected: '',
    query: '',
    tab: 'pipeline',
    open: false,
    dragId: ''
  };

  function nowIso() { return new Date().toISOString(); }
  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) {
      return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[ch];
    });
  }
  function uid() {
    try {
      return 'manual-' + Array.from(crypto.getRandomValues(new Uint32Array(2))).map(function(n){return n.toString(36)}).join('');
    } catch (_) {
      return 'manual-' + Date.now().toString(36) + Math.random().toString(36).slice(2,8);
    }
  }
  function stageLabel(id) {
    var found = STAGES.find(function (s) { return s[0] === id; });
    return found ? found[1] : 'Nuevo';
  }
  function allRecords() {
    return Object.keys(state.records).map(function (key) { return state.records[key]; });
  }
  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        version: 2,
        records: state.records,
        updatedAt: nowIso()
      }));
    } catch (_) {}
  }
  function load() {
    try {
      var parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (parsed && parsed.records && typeof parsed.records === 'object') {
        state.records = parsed.records;
      }
    } catch (_) {}

    // Remove the bad auto-generated 64-slot dataset created by CRM v1.
    // Manual/user-edited records are never deleted.
    try {
      var legacy = JSON.parse(localStorage.getItem(LEGACY_KEY) || 'null');
      if (legacy && legacy.records) {
        Object.keys(legacy.records).forEach(function (key) {
          var r = legacy.records[key] || {};
          var defaultName = /^Plataforma\s*·?\s*Círculo\s*\d+$/i.test(String(r.name || '')) ||
            /^S\d+TB\s*-\s*Slot\s*\d+-\d+$/i.test(String(r.name || ''));
          var untouched = !r.owner && !r.contact && !r.nextAction && !r.value && !r.notes &&
            (!r.stage || r.stage === 'nuevo');
          if (!state.records[key] && !(defaultName && untouched)) {
            state.records[key] = r;
          }
        });
        localStorage.removeItem(LEGACY_KEY);
        save();
      }
    } catch (_) {}
  }

  function slotNumber(node, index) {
    var id = String(node.id || '');
    var m = id.match(/^slot-(\d+)-(\d+)$/);
    if (m) return (Number(m[1]) - 1) * 4 + Number(m[2]);
    var data = Number(node.getAttribute('data-slot'));
    return Number.isFinite(data) && data > 0 ? data : index + 1;
  }

  function isOccupiedSlot(node) {
    if (!node) return false;
    var explicit = [
      node.getAttribute('data-tool-id'),
      node.getAttribute('data-tool'),
      node.getAttribute('data-action'),
      node.getAttribute('data-hashcod-tool'),
      node.getAttribute('data-module')
    ].some(function (value) { return String(value || '').trim() !== ''; });
    if (explicit) return true;

    var classes = String(node.className || '');
    if (/\bis-tool-[^\s]+/.test(classes)) return true;
    if (/\b(is-occupied|has-tool|toolbox-tool-active)\b/.test(classes)) return true;

    // A non-placeholder icon/badge is a strong occupied signal.
    if (node.querySelector('[data-tool-id], [data-tool], .tb-slot-icon:not(:empty), .toolbox-tool-icon')) return true;
    return false;
  }

  function slotName(node, num) {
    var values = [
      node.getAttribute('data-tool-name'),
      node.getAttribute('data-label'),
      node.getAttribute('data-tool-id'),
      node.getAttribute('data-tool'),
      node.getAttribute('aria-label'),
      node.getAttribute('title')
    ];
    for (var i = 0; i < values.length; i++) {
      var v = String(values[i] || '').replace(/\s+/g,' ').trim();
      if (v && !/^slot\b/i.test(v) && v.length < 100) return v;
    }
    return 'Plataforma · Círculo ' + num;
  }

  function upsertDetected(id, name, slot, source) {
    if (!id) return;
    var existing = state.records[id];
    if (!existing) {
      state.records[id] = {
        id:id, name:name, slotNumber:slot, source:source || 'toolbox',
        stage:'nuevo', owner:'', contact:'', nextAction:'', value:'', notes:'',
        createdAt:nowIso(), updatedAt:nowIso()
      };
    } else {
      if (!existing.name || /^Plataforma · Círculo \d+$/.test(existing.name)) existing.name = name;
      existing.slotNumber = slot || existing.slotNumber || null;
      existing.source = source || existing.source || 'toolbox';
    }
  }

  function scanToolbox() {
    var nodes = Array.from(document.querySelectorAll('.tb-slot[id], .tb-slot[data-slot]'));
    var seen = new Set();

    nodes.forEach(function (node, index) {
      if (!isOccupiedSlot(node)) return;
      var num = slotNumber(node,index);
      var key = node.id || ('toolbox-slot-' + num);
      seen.add(key);
      upsertDetected(key, slotName(node,num), num, 'toolbox');
    });

    // Remove only untouched auto-detected records whose toolbox slot is no longer occupied.
    Object.keys(state.records).forEach(function (key) {
      var r = state.records[key];
      if (!r || r.source !== 'toolbox' || seen.has(key)) return;
      var untouched = !r.owner && !r.contact && !r.nextAction && !r.value && !r.notes &&
        (!r.stage || r.stage === 'nuevo');
      if (untouched) delete state.records[key];
    });

    save();
    return seen.size;
  }

  function pullCloudSlots() {
    return fetch('hashcod-sync.php?action=links.pull', {
      credentials:'same-origin',
      headers:{'Accept':'application/json'}
    }).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    }).then(function (data) {
      var links = Array.isArray(data.links) ? data.links : [];
      links.forEach(function (row) {
        var raw = Number(row.slot);
        if (!Number.isFinite(raw)) return;
        var num = raw + 1;
        upsertDetected('cloud-slot-' + raw, 'Plataforma · Círculo ' + num, num, 'cloud');
      });
      save();
      return links.length;
    }).catch(function () { return 0; });
  }

  var SHADOW_CSS = `
    :host{all:initial}
    *,*::before,*::after{box-sizing:border-box}
    .overlay{position:fixed;inset:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:22px;background:rgba(11,17,22,.52);backdrop-filter:blur(10px);font-family:Inter,ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#14202a}
    .window{width:min(1560px,calc(100vw - 44px));height:min(900px,calc(100dvh - 44px));min-height:560px;display:grid;grid-template-rows:70px 1fr;background:#f5f7f8;border:1px solid #ccd5da;border-radius:18px;overflow:hidden;box-shadow:0 35px 100px rgba(0,0,0,.3)}
    .header{display:grid;grid-template-columns:minmax(260px,1fr) auto minmax(320px,1fr);gap:16px;align-items:center;padding:0 18px;background:#fff;border-bottom:1px solid #dde4e8}
    .brand{display:flex;align-items:center;gap:11px;min-width:0}.brand svg{width:30px;height:30px;flex:0 0 30px}.brand-copy{min-width:0}.eyebrow{font:800 9px/1 ui-monospace,SFMono-Regular,Consolas,monospace;letter-spacing:.12em;color:#1E8BC3}.title{margin:4px 0 0;font-size:17px;font-weight:750}.subtitle{margin:2px 0 0;font:500 9px/1.25 ui-monospace,SFMono-Regular,Consolas,monospace;color:#79858c;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .tabs{display:flex;gap:4px;padding:4px;background:#eef2f4;border-radius:10px}.tab{border:0;background:transparent;padding:9px 12px;border-radius:7px;color:#657179;font:800 9px/1 ui-monospace,monospace;cursor:pointer}.tab.active{background:#fff;color:#101820;box-shadow:0 1px 5px rgba(0,0,0,.11)}
    .actions{display:flex;justify-content:flex-end;gap:7px}.btn{height:34px;border:1px solid #d2dbe0;border-radius:8px;background:#fff;color:#27343c;padding:0 11px;font:800 9px/1 ui-monospace,monospace;cursor:pointer}.btn:hover{border-color:#8bbfd7}.btn.primary{background:#101820;color:#fff;border-color:#101820}.btn.icon{width:34px;padding:0;font-size:18px}.body{min-height:0;display:flex;flex-direction:column}
    .metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;padding:14px 16px 0}.metric{background:#fff;border:1px solid #dce3e7;border-radius:12px;padding:12px 14px;display:grid;grid-template-columns:1fr auto;gap:3px 10px}.metric label{font:800 8px/1.2 ui-monospace,monospace;letter-spacing:.08em;color:#7c888f}.metric strong{grid-column:2;grid-row:1/3;font-size:26px;line-height:1}.metric small{font-size:10px;color:#95a0a6}
    .toolbar{display:flex;gap:8px;align-items:center;padding:10px 16px}.search{flex:1;height:38px;border:1px solid #d4dde1;border-radius:9px;background:#fff;padding:0 12px;outline:none;font-size:12px}.search:focus{border-color:#22A0E0;box-shadow:0 0 0 3px rgba(34,160,224,.12)}.status{font:800 8px/1 ui-monospace,monospace;color:#1E8BC3;letter-spacing:.05em}
    .workspace{display:grid;grid-template-columns:minmax(0,1fr) 330px;gap:12px;padding:0 16px 16px;min-height:0;flex:1}.board{min-width:0;min-height:0;display:grid;grid-template-columns:repeat(6,minmax(205px,1fr));gap:10px;overflow:auto;padding-bottom:4px}.column{background:#edf1f3;border:1px solid #d9e1e5;border-radius:12px;display:flex;flex-direction:column;min-height:0}.column.dragover{outline:2px solid #22A0E0;outline-offset:-2px}.col-head{height:42px;display:flex;align-items:center;justify-content:space-between;padding:0 11px;border-bottom:1px solid #d6dfe3}.col-head span{font:800 9px/1 ui-monospace,monospace;letter-spacing:.06em;text-transform:uppercase}.count{min-width:22px;height:22px;display:grid;place-items:center;border-radius:99px;background:#fff;border:1px solid #d7dfe3;font-size:10px}.cards{display:flex;flex-direction:column;gap:8px;padding:8px;overflow:auto;min-height:120px}.empty{text-align:center;padding:18px 8px;color:#9aa4aa;font:600 9px/1.4 ui-monospace,monospace}
    .card{border:1px solid #d8e0e4;border-radius:10px;background:#fff;padding:11px;text-align:left;cursor:pointer;box-shadow:0 1px 2px rgba(0,0,0,.025);transition:.15s}.card:hover{transform:translateY(-1px);border-color:#87c9e7;box-shadow:0 7px 18px rgba(32,112,148,.10)}.card.selected{border-color:#22A0E0;box-shadow:0 0 0 2px rgba(34,160,224,.12)}.kicker{font:800 8px/1 ui-monospace,monospace;color:#1E8BC3;letter-spacing:.08em}.card-title{margin:6px 0 8px;font-size:12px;font-weight:750;line-height:1.3}.card-meta{font-size:10px;color:#6f7b82;line-height:1.35}.card-next{margin-top:8px;padding-top:7px;border-top:1px solid #edf0f2;font-size:10px;color:#35434b;line-height:1.35}
    .detail{background:#fff;border:1px solid #dce3e7;border-radius:12px;padding:13px;overflow:auto;min-height:0}.detail-empty{height:100%;min-height:220px;display:grid;place-content:center;text-align:center;color:#7d8990;padding:24px}.detail-empty strong{color:#2a363d;font-size:14px}.detail-empty span{font-size:11px;line-height:1.5;margin-top:6px}.detail-head{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:11px;margin-bottom:12px;border-bottom:1px solid #edf0f2}.detail-head small{font:800 8px/1 ui-monospace,monospace;color:#1E8BC3;letter-spacing:.08em}.detail-head h3{margin:5px 0 0;font-size:15px}.field{display:flex;flex-direction:column;gap:5px;margin-bottom:9px}.field span{font:800 8px/1.2 ui-monospace,monospace;color:#69757c;text-transform:uppercase;letter-spacing:.04em}.field input,.field select,.field textarea{width:100%;border:1px solid #d6dfe3;border-radius:8px;background:#fff;color:#111;padding:9px 10px;font:500 11px/1.35 system-ui;outline:none}.field textarea{min-height:105px;resize:vertical}.field input:focus,.field select:focus,.field textarea:focus{border-color:#22A0E0;box-shadow:0 0 0 2px rgba(34,160,224,.11)}.detail-actions{display:grid;grid-template-columns:1fr auto;gap:7px;margin-top:12px}.save{height:38px;border:0;border-radius:8px;background:#101820;color:#fff;font:800 9px/1 ui-monospace,monospace;cursor:pointer}.delete{height:38px;border:1px solid #e1c9c9;border-radius:8px;background:#fff;color:#9b2c2c;padding:0 12px;font:800 9px/1 ui-monospace,monospace;cursor:pointer}
    .desk{display:flex;flex-direction:column;height:100%;min-height:0}.desk-toolbar{display:flex;gap:8px;align-items:center;padding:14px 16px;background:#fff;border-bottom:1px solid #dde4e8}.desk-toolbar input{flex:1;height:38px;border:1px solid #d5dee2;border-radius:8px;padding:0 11px;outline:none}.frame{flex:1;min-height:0;background:#fff}.frame iframe{width:100%;height:100%;border:0;display:block}.desk-empty{margin:auto;max-width:680px;padding:34px;background:#fff;border:1px solid #dbe3e7;border-radius:16px;text-align:center}.desk-empty h3{margin:0 0 8px}.desk-empty p{margin:0;color:#66737a;font-size:12px;line-height:1.6}
    .modal-form{display:none;position:absolute;inset:0;background:rgba(11,17,22,.45);align-items:center;justify-content:center;z-index:5}.modal-form.open{display:flex}.form-card{width:min(480px,calc(100% - 32px));background:#fff;border:1px solid #d5dde1;border-radius:14px;padding:18px;box-shadow:0 20px 60px rgba(0,0,0,.24)}.form-card h3{margin:0 0 14px}.form-row{display:flex;gap:8px}.form-row .field{flex:1}.form-actions{display:flex;justify-content:flex-end;gap:7px;margin-top:14px}
    @media(max-width:1050px){.window{width:calc(100vw - 20px);height:calc(100dvh - 20px)}.overlay{padding:10px}.header{grid-template-columns:1fr auto}.tabs{grid-column:1/-1;grid-row:2}.header{height:auto;min-height:96px;align-content:center}.actions .hide-small{display:none}.workspace{grid-template-columns:1fr}.detail{max-height:42vh}.metrics{grid-template-columns:repeat(2,1fr)}}
  `;

  function host() {
    var el = document.getElementById(HOST_ID);
    if (el) return el;
    el = document.createElement('div');
    el.id = HOST_ID;
    el.hidden = true;
    el.style.setProperty('position','fixed','important');
    el.style.setProperty('inset','0','important');
    el.style.setProperty('z-index','2147483647','important');
    el.attachShadow({mode:'open'});
    document.body.appendChild(el);
    buildShell(el.shadowRoot);
    return el;
  }
  function root() {
    var el = host();
    return el.shadowRoot;
  }

  function buildShell(shadow) {
    shadow.innerHTML = '<style>' + SHADOW_CSS + '</style>' +
      '<div class="overlay">' +
        '<section class="window" role="dialog" aria-modal="true" aria-label="Hashcod Platform CRM">' +
          '<header class="header">' +
            '<div class="brand">' + ICON + '<div class="brand-copy"><div class="eyebrow">HASHCOD / CRM</div><div class="title">Platform CRM</div><div class="subtitle">Toolbox synchronized · DeskcommCRM bridge</div></div></div>' +
            '<nav class="tabs"><button class="tab active" data-tab="pipeline">PLATAFORMAS</button><button class="tab" data-tab="deskcomm">DESKCOMMCRM</button></nav>' +
            '<div class="actions"><button class="btn primary" data-action="add">+ PLATAFORMA</button><button class="btn hide-small" data-action="sync">SINCRONIZAR</button><button class="btn hide-small" data-action="export">EXPORTAR</button><button class="btn icon" data-action="close">×</button></div>' +
          '</header>' +
          '<main class="body" data-view="pipeline">' +
            '<div class="metrics" data-role="metrics"></div>' +
            '<div class="toolbar"><input class="search" data-role="search" placeholder="Buscar plataforma, responsable, contacto o próxima acción…"><span class="status" data-role="status">TOOLBOX LISTA</span></div>' +
            '<div class="workspace"><div class="board" data-role="board"></div><aside class="detail" data-role="detail"></aside></div>' +
          '</main>' +
          '<main class="desk" data-view="deskcomm" hidden></main>' +
          '<div class="modal-form" data-role="new-form"><div class="form-card"><h3>Nueva plataforma</h3><div class="field"><span>Nombre</span><input data-new="name" placeholder="Nombre de la plataforma"></div><div class="form-row"><label class="field"><span>Contacto</span><input data-new="contact" placeholder="correo / teléfono"></label><label class="field"><span>Responsable</span><input data-new="owner" placeholder="equipo / persona"></label></div><div class="form-actions"><button class="btn" data-action="cancel-add">CANCELAR</button><button class="btn primary" data-action="confirm-add">CREAR</button></div></div></div>' +
        '</section>' +
      '</div>';

    shadow.addEventListener('click', onShadowClick);
    shadow.addEventListener('input', function (event) {
      if (event.target.matches('[data-role="search"]')) {
        state.query = event.target.value || '';
        renderBoard();
      }
    });
    shadow.addEventListener('change', function (event) {
      if (event.target.matches('[data-detail="stage"]')) updateSelectedFromDetail(false);
    });
    shadow.addEventListener('dragstart', function (event) {
      var card = event.target.closest('[data-record-id]');
      if (!card) return;
      state.dragId = card.getAttribute('data-record-id') || '';
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', state.dragId);
    });
    shadow.addEventListener('dragover', function (event) {
      var col = event.target.closest('[data-stage]');
      if (!col) return;
      event.preventDefault();
      col.classList.add('dragover');
    });
    shadow.addEventListener('dragleave', function (event) {
      var col = event.target.closest('[data-stage]');
      if (col) col.classList.remove('dragover');
    });
    shadow.addEventListener('drop', function (event) {
      var col = event.target.closest('[data-stage]');
      if (!col) return;
      event.preventDefault();
      col.classList.remove('dragover');
      var id = state.dragId || event.dataTransfer.getData('text/plain');
      var r = state.records[id];
      if (!r) return;
      r.stage = col.getAttribute('data-stage') || 'nuevo';
      r.updatedAt = nowIso();
      state.selected = id;
      save();
      render();
    });
  }

  function filtered() {
    var q = state.query.trim().toLowerCase();
    var list = allRecords().sort(function(a,b){
      return String(b.updatedAt || '').localeCompare(String(a.updatedAt || ''));
    });
    if (!q) return list;
    return list.filter(function (r) {
      return [r.name,r.owner,r.contact,r.nextAction,r.notes,stageLabel(r.stage)].join(' ').toLowerCase().includes(q);
    });
  }

  function renderMetrics() {
    var shadow = root(), el = shadow.querySelector('[data-role="metrics"]');
    var list = allRecords();
    var active = list.filter(function(r){return r.stage !== 'ganado' && r.stage !== 'pausado'}).length;
    var won = list.filter(function(r){return r.stage === 'ganado'}).length;
    var next = list.filter(function(r){return String(r.nextAction || '').trim()}).length;
    var items = [
      ['PLATAFORMAS',list.length,'registradas'],
      ['ACTIVAS',active,'en seguimiento'],
      ['GANADAS',won,'cerradas'],
      ['ACCIONES',next,'próximos pasos']
    ];
    el.innerHTML = items.map(function(x){return '<div class="metric"><label>'+x[0]+'</label><strong>'+x[1]+'</strong><small>'+x[2]+'</small></div>'}).join('');
  }

  function cardHtml(r) {
    return '<article class="card'+(state.selected===r.id?' selected':'')+'" draggable="true" data-record-id="'+esc(r.id)+'">' +
      '<div class="kicker">'+esc(r.slotNumber ? 'CÍRCULO '+r.slotNumber : 'PLATAFORMA MANUAL')+'</div>' +
      '<div class="card-title">'+esc(r.name)+'</div>' +
      '<div class="card-meta">'+esc(r.owner || 'Sin responsable')+'</div>' +
      '<div class="card-next">'+esc(r.nextAction || 'Sin próxima acción')+'</div>' +
    '</article>';
  }

  function renderBoard() {
    var shadow=root(), board=shadow.querySelector('[data-role="board"]'), list=filtered();
    board.innerHTML = STAGES.map(function(s){
      var rows=list.filter(function(r){return (r.stage || 'nuevo')===s[0]});
      return '<section class="column" data-stage="'+s[0]+'"><header class="col-head"><span>'+esc(s[1])+'</span><b class="count">'+rows.length+'</b></header><div class="cards">'+(rows.map(cardHtml).join('') || '<div class="empty">Sin plataformas</div>')+'</div></section>';
    }).join('');
  }

  function renderDetail() {
    var el=root().querySelector('[data-role="detail"]'), r=state.records[state.selected];
    if (!r) {
      el.innerHTML='<div class="detail-empty"><strong>Selecciona una plataforma</strong><span>Haz clic en una tarjeta para editar el contacto, responsable, valor y próxima acción.</span></div>';
      return;
    }
    el.innerHTML =
      '<div class="detail-head"><div><small>'+esc(r.slotNumber?'CÍRCULO '+r.slotNumber:'PLATAFORMA')+'</small><h3>'+esc(r.name)+'</h3></div></div>' +
      '<label class="field"><span>Nombre</span><input data-detail="name" value="'+esc(r.name)+'"></label>' +
      '<label class="field"><span>Etapa</span><select data-detail="stage">'+STAGES.map(function(s){return '<option value="'+s[0]+'"'+(r.stage===s[0]?' selected':'')+'>'+esc(s[1])+'</option>'}).join('')+'</select></label>' +
      '<label class="field"><span>Responsable</span><input data-detail="owner" value="'+esc(r.owner||'')+'" placeholder="Persona o equipo"></label>' +
      '<label class="field"><span>Contacto</span><input data-detail="contact" value="'+esc(r.contact||'')+'" placeholder="Correo, teléfono o canal"></label>' +
      '<label class="field"><span>Próxima acción</span><input data-detail="nextAction" value="'+esc(r.nextAction||'')+'" placeholder="Ej. demo, llamada, seguimiento"></label>' +
      '<label class="field"><span>Valor / oportunidad</span><input data-detail="value" value="'+esc(r.value||'')+'" placeholder="Ej. RD$ 25,000"></label>' +
      '<label class="field"><span>Notas</span><textarea data-detail="notes" placeholder="Contexto, necesidades, historial…">'+esc(r.notes||'')+'</textarea></label>' +
      '<div class="detail-actions"><button class="save" data-action="save-detail">GUARDAR CAMBIOS</button><button class="delete" data-action="delete-record">ELIMINAR</button></div>';
  }

  function updateSelectedFromDetail(doRender) {
    var r=state.records[state.selected]; if(!r) return;
    var shadow=root();
    ['name','stage','owner','contact','nextAction','value','notes'].forEach(function(k){
      var input=shadow.querySelector('[data-detail="'+k+'"]');
      if(input) r[k]=String(input.value||'').trim();
    });
    r.name=r.name||'Plataforma';
    r.stage=r.stage||'nuevo';
    r.updatedAt=nowIso();
    save();
    if(doRender!==false) render();
  }

  function currentDeskcommUrl() {
    var server=String(window.HASHCOD_DESKCOMM_CRM_URL||'').trim(), local='';
    try{local=String(localStorage.getItem(DESKCOMM_URL_KEY)||'').trim()}catch(_){}
    return local||server;
  }
  function safeUrl(value) {
    try {
      var u=new URL(String(value||'').trim(),location.href);
      return (u.protocol==='http:'||u.protocol==='https:')?u.href:'';
    } catch(_){return ''}
  }
  function renderDeskcomm() {
    var el=root().querySelector('[data-view="deskcomm"]'), url=currentDeskcommUrl();
    el.innerHTML='<div class="desk-toolbar"><input data-role="desk-url" type="url" placeholder="https://crm.tudominio.com" value="'+esc(url)+'"><button class="btn primary" data-action="connect-desk">CONECTAR</button>'+(url?'<button class="btn" data-action="open-desk">ABRIR APARTE</button>':'')+'</div>' +
      (url?'<div class="frame"><iframe src="'+esc(url)+'" title="DeskcommCRM" referrerpolicy="strict-origin-when-cross-origin"></iframe></div>':'<div class="desk-empty"><h3>DeskcommCRM listo para conectar</h3><p>El CRM interno de plataformas funciona sin servicios externos. Si despliegas DeskcommCRM por separado, pega aquí su URL y Hashcod intentará abrirlo dentro de esta misma ventana.</p></div>');
  }

  function render() {
    renderMetrics(); renderBoard(); renderDetail();
    if(state.tab==='deskcomm') renderDeskcomm();
  }

  function setTab(tab) {
    state.tab=tab==='deskcomm'?'deskcomm':'pipeline';
    var shadow=root();
    shadow.querySelectorAll('[data-tab]').forEach(function(btn){btn.classList.toggle('active',btn.getAttribute('data-tab')===state.tab)});
    shadow.querySelector('[data-view="pipeline"]').hidden=state.tab!=='pipeline';
    shadow.querySelector('[data-view="deskcomm"]').hidden=state.tab!=='deskcomm';
    if(state.tab==='deskcomm') renderDeskcomm();
  }

  function onShadowClick(event) {
    var action=event.target.closest('[data-action]');
    var card=event.target.closest('[data-record-id]');
    var tab=event.target.closest('[data-tab]');

    if(card && !action){
      state.selected=card.getAttribute('data-record-id')||'';
      renderBoard(); renderDetail(); return;
    }
    if(tab){setTab(tab.getAttribute('data-tab'));return}
    if(!action)return;

    var name=action.getAttribute('data-action');
    if(name==='close'){close();return}
    if(name==='sync'){
      var status=root().querySelector('[data-role="status"]'); status.textContent='SINCRONIZANDO…';
      var localCount=scanToolbox();
      pullCloudSlots().then(function(remote){status.textContent='SINCRONIZADO · '+localCount+' LOCAL / '+remote+' NUBE';render()});
      return;
    }
    if(name==='export'){
      var blob=new Blob([JSON.stringify({exportedAt:nowIso(),records:state.records},null,2)],{type:'application/json'});
      var url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='hashcod-platform-crm.json';a.click();setTimeout(function(){URL.revokeObjectURL(url)},1000);return;
    }
    if(name==='add'){root().querySelector('[data-role="new-form"]').classList.add('open');root().querySelector('[data-new="name"]').focus();return}
    if(name==='cancel-add'){root().querySelector('[data-role="new-form"]').classList.remove('open');return}
    if(name==='confirm-add'){
      var n=root().querySelector('[data-new="name"]'),owner=root().querySelector('[data-new="owner"]'),contact=root().querySelector('[data-new="contact"]');
      var value=String(n.value||'').trim();if(!value){n.focus();return}
      var id=uid();state.records[id]={id:id,name:value,slotNumber:null,source:'manual',stage:'nuevo',owner:String(owner.value||'').trim(),contact:String(contact.value||'').trim(),nextAction:'',value:'',notes:'',createdAt:nowIso(),updatedAt:nowIso()};
      state.selected=id;save();n.value='';owner.value='';contact.value='';root().querySelector('[data-role="new-form"]').classList.remove('open');setTab('pipeline');render();return;
    }
    if(name==='save-detail'){updateSelectedFromDetail(true);return}
    if(name==='delete-record'){
      var r=state.records[state.selected];if(!r)return;
      if(!window.confirm('¿Eliminar "'+r.name+'" del CRM?'))return;
      delete state.records[state.selected];state.selected='';save();render();return;
    }
    if(name==='connect-desk'){
      var input=root().querySelector('[data-role="desk-url"]'),url=safeUrl(input.value);
      if(!url){input.focus();return}try{localStorage.setItem(DESKCOMM_URL_KEY,url)}catch(_){}renderDeskcomm();return;
    }
    if(name==='open-desk'){var target=currentDeskcommUrl();if(target)window.open(target,'_blank','noopener,noreferrer');return}
  }

  function open() {
    load();
    scanToolbox();
    var el=host(); el.hidden=false; el.style.setProperty('display','block','important');
    state.open=true; setTab('pipeline'); render();
    pullCloudSlots().then(render);
    return true;
  }
  function close() {
    var el=document.getElementById(HOST_ID);if(el){el.hidden=true;el.style.setProperty('display','none','important')}
    state.open=false;
  }

  function findTopbar(){return document.querySelector('.top-bar-right')||document.querySelector('.top-bar [class*="right"]')||document.querySelector('.top-bar')}
  function mountButton(){
    var bar=findTopbar();if(!bar)return false;
    bar.classList.add('hashcod-platform-crm-host');
    var button=document.getElementById(BUTTON_ID);
    if(!button){button=document.createElement('button');var logout=bar.querySelector('#topBarLogoutBtn');logout?bar.insertBefore(button,logout):bar.prepend(button)}
    button.type='button';button.id=BUTTON_ID;button.className='hashcod-platform-crm-button';button.title='Abrir CRM de plataformas';button.setAttribute('aria-label','Abrir CRM de plataformas');button.innerHTML=ICON;
    return true;
  }

  function targetIsButton(event){
    var path=typeof event.composedPath==='function'?event.composedPath():[];
    if(path.some(function(n){return n&&n.id===BUTTON_ID}))return true;
    return !!(event.target&&event.target.closest&&event.target.closest('#'+BUTTON_ID));
  }

  window.addEventListener('pointerdown',function(event){
    if(!targetIsButton(event))return;
    event.preventDefault();event.stopPropagation();if(event.stopImmediatePropagation)event.stopImmediatePropagation();open();
  },true);
  document.addEventListener('keydown',function(event){if(event.key==='Escape'&&state.open)close()});

  function boot(){
    load();host();mountButton();
    var tries=0,timer=setInterval(function(){tries++;if(mountButton()||tries>120)clearInterval(timer)},125);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  window.addEventListener('hashcod:platform-entered',mountButton);

  window.openHashcodPlatformCRM=open;
  window.HashcodPlatformCRM=Object.freeze({version:VERSION,open:open,close:close,sync:function(){scanToolbox();return pullCloudSlots()},records:function(){return allRecords().map(function(r){return Object.assign({},r)})}});
})(window, document);
