(function () {
  'use strict';

  if (window.__hashcodEfrCodeEditorLoaded) return;
  window.__hashcodEfrCodeEditorLoaded = true;

  /*
   * EFT notebook model:
   * - JupyterLab-informed model semantics (NotebookModel / nbformat 4.5).
   * - Algorithm-profile semantics adapted from TheAlgorithms/Jupyter contribution model:
   *   commented/readable source, mathematical explanation, and a notebook demo.
   * - CoffeeScript source only. No kernel execution, eval, or compilation.
   */

  const TOOL_ID = 'efr-code-editor';
  const TRAY_SLOT = 4;
  const MODAL_ID = 'hashcodEfrEditorModal';
  const TEXTAREA_ID = 'hashcodEfrEditorTextarea';
  const NAME_ID = 'hashcodEfrEditorFilename';
  const STATUS_ID = 'hashcodEfrEditorStatus';
  const HOTZONE_ID = 'hashcodEfrHotzone';
  const STYLE_ID = 'hashcodEfrCriticalTkinterStyle';
  const STORAGE_KEY = 'hashcod_eft_coffeescript_draft_v3';
  const LEGACY_STORAGE_KEYS = [
    'hashcod_eft_coffeescript_draft_v2',
    'hashcod_eft_coffeescript_draft_v1'
  ];
  const NAME_STORAGE_KEY = 'hashcod_eft_coffeescript_name_v1';

  const CELL_SEPARATOR = '# %% [EFT CELL]';
  const EFT_FORMAT = 'HASHCOD-EFT-1';
  const MODEL_VERSION = 3;
  const NBFORMAT_MAJOR = 4;
  const NBFORMAT_MINOR = 5;
  const ALGORITHM_PROFILE = 'THEALGORITHMS-JUPYTER-1';
  const ALGORITHM_REFERENCE = 'https://github.com/TheAlgorithms/Jupyter';
  const ALGORITHM_ROLES = ['definition', 'implementation', 'demo'];
  const TRAY_SELECTOR = '#hashcodVectorTray [data-vector-tray-slot="4"]';
  const CELL_SEPARATOR_RE = /^\s*# %% \[EFT CELL\]\s*$/m;

  const EDITOR_ICON = [
    '<svg data-hashcod-efr-icon="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" aria-hidden="true">',
    '<rect x="8" y="9" width="48" height="46" rx="8" fill="#fff" stroke="#111" stroke-width="3"/>',
    '<path d="M25 23L16 32l9 9M39 23l9 9-9 9" fill="none" stroke="#111" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>',
    '<path d="M35 18L29 46" fill="none" stroke="#111" stroke-width="3" stroke-linecap="round"/>',
    '</svg>'
  ].join('');

  const CRITICAL_CSS = [
    '#hashcodEfrEditorModal[hidden]{display:none!important}',
    'dialog#hashcodEfrEditorModal{position:fixed!important;inset:0!important;width:100vw!important;height:100vh!important;max-width:none!important;max-height:none!important;margin:0!important;border:0!important;padding:18px!important;box-sizing:border-box!important;z-index:2147483647!important;display:grid!important;place-items:center!important;background:rgba(238,238,234,.86)!important;font-family:"IBM Plex Mono",Consolas,monospace!important;color:#111!important}',
    'dialog#hashcodEfrEditorModal::backdrop{background:rgba(238,238,234,.82)!important}',
    '#hashcodEfrEditorWindow{width:min(1120px,95vw)!important;height:min(760px,92vh)!important;display:grid!important;grid-template-rows:auto auto minmax(0,1fr) auto!important;background:#d9d9d5!important;border:1px solid #6f6f6a!important;border-radius:8px!important;overflow:hidden!important;box-shadow:0 24px 70px rgba(0,0,0,.22)!important}',
    '.hashcod-efr-editor-header{display:flex!important;justify-content:space-between!important;gap:18px!important;padding:15px 16px!important;border-bottom:1px solid #8d8d88!important;background:#edede9!important}',
    '.hashcod-efr-editor-header h2,.hashcod-efr-editor-header p{margin:0!important}',
    '.hashcod-efr-editor-kicker{font-size:10px!important;letter-spacing:.14em!important;font-weight:700!important;color:#555!important;margin-bottom:4px!important}',
    '.hashcod-efr-editor-subtitle{font-size:11px!important;line-height:1.45!important;color:#555!important;margin-top:6px!important;max-width:760px!important}',
    '.hashcod-efr-toolbar{display:grid!important;grid-template-columns:minmax(340px,1fr) auto!important;gap:12px!important;align-items:center!important;padding:10px 12px!important;border-bottom:1px solid #8d8d88!important;background:#cfcfca!important}',
    '.hashcod-eft-file-stack{display:grid!important;gap:6px!important}',
    '.hashcod-efr-name-wrap{display:grid!important;grid-template-columns:auto minmax(120px,320px) auto!important;gap:8px!important;align-items:center!important}',
    '.hashcod-eft-modebar,.hashcod-efr-actions{display:flex!important;gap:7px!important;flex-wrap:wrap!important}',
    '.hashcod-eft-modebar span,.hashcod-efr-actions button,.hashcod-efr-name-wrap input,.hashcod-efr-icon-button{border:1px solid #6f6f6a!important;background:#f2f2ef!important;color:#111!important;border-radius:3px!important;padding:7px 9px!important;font:600 11px/1.1 inherit!important}',
    '.hashcod-eft-modebar span{padding:4px 7px!important;font-size:9px!important;letter-spacing:.04em!important}',
    '.hashcod-efr-actions button{cursor:pointer!important}',
    '.hashcod-efr-actions button.is-primary{background:#111!important;color:#fff!important}',
    '.hashcod-efr-actions button.is-algorithm{background:#e5e5df!important;border-style:dashed!important}',
    '.hashcod-efr-editor-body{min-height:0!important;padding:12px!important;background:#bdbdb8!important}',
    '#hashcodEfrEditorTextarea{width:100%!important;height:100%!important;min-height:320px!important;box-sizing:border-box!important;resize:none!important;border:1px solid #555!important;outline:0!important;padding:16px!important;background:#111!important;color:#f5f5f1!important;caret-color:#fff!important;font:400 13px/1.62 "IBM Plex Mono",Consolas,monospace!important;tab-size:2!important;white-space:pre!important;overflow:auto!important}',
    '.hashcod-efr-editor-footer{display:flex!important;justify-content:space-between!important;gap:12px!important;padding:8px 12px!important;border-top:1px solid #8d8d88!important;background:#d6d6d1!important;font-size:10px!important}',
    '@media(max-width:760px){dialog#hashcodEfrEditorModal{padding:8px!important}#hashcodEfrEditorWindow{width:100%!important;height:95vh!important}.hashcod-efr-toolbar{grid-template-columns:1fr!important}.hashcod-efr-actions{display:grid!important;grid-template-columns:repeat(2,1fr)!important}.hashcod-efr-editor-footer{flex-direction:column!important;gap:4px!important}}'
  ].join('');

  let importInput = null;
  let trayObserver = null;
  let repairTimer = null;
  let draftTimer = null;
  let lastFocused = null;
  let registeredTrayApi = null;
  let suppressEditorSync = false;

  const byId = (id) => document.getElementById(id);
  const getEditor = () => byId(TEXTAREA_ID);
  const getTrayButton = () => document.querySelector(TRAY_SELECTOR);

  function ensureStyles() {
    let style = byId(STYLE_ID);
    if (style) return style;
    style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = CRITICAL_CSS;
    (document.head || document.documentElement).appendChild(style);
    return style;
  }

  function sanitizeName(value) {
    const cleaned = String(value || '')
      .replace(/[\\/:*?"<>|\u0000-\u001f]/g, '-')
      .replace(/\s+/g, ' ')
      .trim();
    return (cleaned || 'untitled').replace(/\.(eft|efr|ipynb|coffee)$/i, '');
  }

  const normalizeNewlines = (value) => String(value || '').replace(/\r\n?/g, '\n');

  function clone(value) {
    if (typeof structuredClone === 'function') {
      try { return structuredClone(value); } catch (_) {}
    }
    return JSON.parse(JSON.stringify(value));
  }

  const isObj = (value) => !!value && typeof value === 'object' && !Array.isArray(value);
  const validId = (value) => typeof value === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(value);

  function cellId() {
    const bytes = new Uint8Array(8);
    if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(bytes);
    else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
    return 'c-' + Array.from(bytes, (x) => x.toString(16).padStart(2, '0')).join('');
  }

  function sourceText(source) {
    if (Array.isArray(source)) {
      if (!source.every((item) => typeof item === 'string')) {
        throw new Error('Notebook source arrays must contain only strings.');
      }
      return normalizeNewlines(source.join(''));
    }
    if (typeof source === 'string') return normalizeNewlines(source);
    if (source == null) return '';
    throw new Error('Notebook cell source must be text.');
  }

  function sourceLines(text) {
    const normalized = normalizeNewlines(text);
    if (!normalized) return [];
    const lines = normalized.split('\n');
    return lines.map((line, index) => index < lines.length - 1 ? line + '\n' : line);
  }

  function splitCells(text) {
    const cells = normalizeNewlines(text)
      .split(CELL_SEPARATOR_RE)
      .map((part) => part.replace(/^\n+|\n+$/g, ''));
    return cells.length ? cells : [''];
  }

  function declaresCoffee(notebook) {
    if (!isObj(notebook)) return false;
    const meta = isObj(notebook.metadata) ? notebook.metadata : {};
    const languageInfo = isObj(meta.language_info) ? meta.language_info : {};
    const kernel = isObj(meta.kernelspec) ? meta.kernelspec : {};
    const hashcod = isObj(meta.hashcod) ? meta.hashcod : {};

    if (String(languageInfo.name || '').toLowerCase() === 'coffeescript') return true;
    if (String(kernel.language || '').toLowerCase() === 'coffeescript') return true;
    if (String(kernel.name || '').toLowerCase().includes('coffee')) return true;
    if (String(hashcod.source_language || '').toLowerCase() === 'coffeescript') return true;

    return Array.isArray(notebook.cells) && notebook.cells.some((cell) => (
      cell &&
      cell.cell_type === 'code' &&
      String((isObj(cell.metadata) ? cell.metadata : {}).language || '').toLowerCase() === 'coffeescript'
    ));
  }

  function algorithmRole(index, existingRole) {
    if (ALGORITHM_ROLES.includes(existingRole)) return existingRole;
    return ALGORITHM_ROLES[index] || 'support';
  }

  function metadata(input, minor) {
    const result = isObj(input) ? clone(input) : {};
    const existingHashcod = isObj(result.hashcod) ? result.hashcod : {};

    result.kernelspec = {
      ...(isObj(result.kernelspec) ? result.kernelspec : {}),
      display_name: 'CoffeeScript',
      language: 'coffeescript',
      name: 'coffeescript'
    };

    result.language_info = {
      ...(isObj(result.language_info) ? result.language_info : {}),
      name: 'coffeescript',
      mimetype: 'text/coffeescript',
      file_extension: '.coffee',
      codemirror_mode: 'coffeescript'
    };

    result.hashcod = {
      ...existingHashcod,
      format: 'EFT',
      version: 1,
      model_version: MODEL_VERSION,
      source_language: 'CoffeeScript',
      container: 'Jupyter Notebook',
      cell_separator: CELL_SEPARATOR,
      execution_policy: 'disabled',
      jupyterlab_model_reference: 'packages/notebook/src/model.ts',
      source_nbformat_minor: Number.isInteger(minor) ? minor : NBFORMAT_MINOR,
      algorithm_profile: ALGORITHM_PROFILE,
      algorithm_reference: ALGORITHM_REFERENCE,
      algorithm_requirements: [
        'commented_source',
        'readable_naming',
        'math_explanation',
        'notebook_demo'
      ]
    };

    return result;
  }

  function codeCell(input, index) {
    const cell = input || {};
    const cellMeta = isObj(cell.metadata) ? clone(cell.metadata) : {};
    return {
      id: validId(cell.id) ? cell.id : cellId(),
      cell_type: 'code',
      execution_count: null,
      metadata: {
        ...cellMeta,
        language: 'coffeescript',
        eft_source: true,
        eft_cell_index: index,
        algorithm_role: algorithmRole(index, cellMeta.algorithm_role),
        trusted: false
      },
      outputs: [],
      source: sourceLines(sourceText(cell.source))
    };
  }

  function emptyNotebook() {
    return {
      eft_format: EFT_FORMAT,
      nbformat: NBFORMAT_MAJOR,
      nbformat_minor: NBFORMAT_MINOR,
      metadata: metadata({}, NBFORMAT_MINOR),
      cells: [codeCell({ source: '' }, 0)]
    };
  }

  function algorithmTemplateNotebook() {
    return {
      eft_format: EFT_FORMAT,
      nbformat: NBFORMAT_MAJOR,
      nbformat_minor: NBFORMAT_MINOR,
      metadata: metadata({
        hashcod: {
          algorithm_name: 'Untitled Algorithm',
          algorithm_profile: ALGORITHM_PROFILE
        }
      }, NBFORMAT_MINOR),
      cells: [
        codeCell({
          metadata: { algorithm_role: 'definition' },
          source: [
            '# ALGORITHM\n',
            '# Name: Untitled Algorithm\n',
            '# Purpose: Describe the problem this algorithm solves.\n',
            '# Math: Describe the formula, invariant, or mathematical idea.\n',
            '# Input: Describe the expected input.\n',
            '# Output: Describe the expected output.'
          ]
        }, 0),
        codeCell({
          metadata: { algorithm_role: 'implementation' },
          source: [
            '# IMPLEMENTATION\n',
            '# Use readable names and comment non-obvious steps.\n',
            'solveAlgorithm = (inputValue) ->\n',
            '  resultValue = inputValue\n',
            '  resultValue'
          ]
        }, 1),
        codeCell({
          metadata: { algorithm_role: 'demo' },
          source: [
            '# DEMO\n',
            'exampleInput = 5\n',
            'exampleOutput = solveAlgorithm exampleInput\n',
            'console.log exampleOutput'
          ]
        }, 2)
      ]
    };
  }

  function algorithmReport(notebook) {
    const cells = Array.isArray(notebook && notebook.cells) ? notebook.cells : [];
    const text = cells.map((cell) => sourceText(cell.source)).join('\n\n');
    const comments = /(^|\n)\s*#\s*\S+/m.test(text);
    const math = /(^|\n)\s*#\s*(Math|Formula|Equation)\s*:/im.test(text);
    const demo = cells.some((cell) => (
      /(^|\n)\s*#\s*DEMO\b/im.test(sourceText(cell.source)) ||
      (cell.metadata && cell.metadata.algorithm_role === 'demo' && sourceText(cell.source).trim().length > 0)
    ));
    const identifiers = Array.from(text.matchAll(/\b([A-Za-z_][A-Za-z0-9_]{2,})\s*=\s*/g)).map((match) => match[1]);
    const readableNaming = identifiers.some((name) => name.length >= 4 && !/^(tmp|foo|bar)$/i.test(name));
    const score = [comments, readableNaming, math, demo].filter(Boolean).length;
    const missing = [];
    if (!comments) missing.push('comments');
    if (!readableNaming) missing.push('readable naming');
    if (!math) missing.push('math explanation');
    if (!demo) missing.push('demo');
    return {
      profile: ALGORITHM_PROFILE,
      score,
      total: 4,
      complete: score === 4,
      comments,
      readable_naming: readableNaming,
      math_explanation: math,
      notebook_demo: demo,
      missing
    };
  }

  class EftNotebookModel {
    constructor() {
      this._listeners = new Set();
      this.deletedCells = [];
      this.revision = 0;
      this.dirty = false;
      this._notebook = emptyNotebook();
    }

    get cellCount() { return this._notebook.cells.length; }
    get cells() { return clone(this._notebook.cells); }

    onChange(listener) {
      if (typeof listener !== 'function') return () => {};
      this._listeners.add(listener);
      return () => this._listeners.delete(listener);
    }

    _emit(type) {
      this.revision += 1;
      this._listeners.forEach((listener) => {
        try { listener({ type, revision: this.revision, dirty: this.dirty }); } catch (_) {}
      });
    }

    _touch(type) {
      this.dirty = true;
      this._emit(type);
    }

    markClean() {
      if (this.dirty) {
        this.dirty = false;
        this._emit('clean');
      }
    }

    toJSON() {
      const notebook = clone(this._notebook);
      notebook.eft_format = EFT_FORMAT;
      notebook.nbformat = NBFORMAT_MAJOR;
      notebook.nbformat_minor = Math.max(Number(notebook.nbformat_minor) || 0, NBFORMAT_MINOR);
      notebook.metadata = metadata(
        notebook.metadata,
        notebook.metadata && notebook.metadata.hashcod && notebook.metadata.hashcod.source_nbformat_minor
      );
      if (!Array.isArray(notebook.cells) || !notebook.cells.length) {
        notebook.cells = [codeCell({ source: '' }, 0)];
      }
      notebook.cells = notebook.cells.map(codeCell);
      notebook.metadata.hashcod.algorithm_validation = algorithmReport(notebook);
      return notebook;
    }

    toString() { return JSON.stringify(this.toJSON()); }
    fromString(value, options) { this.fromJSON(JSON.parse(value), options); }

    fromJSON(value, options = {}) {
      if (!isObj(value)) throw new Error('Notebook JSON must be an object.');
      if (Number(value.nbformat) !== NBFORMAT_MAJOR) {
        throw new Error('Only Jupyter Notebook nbformat 4 is supported.');
      }
      if (!Array.isArray(value.cells)) throw new Error('Notebook cells are missing.');
      if (!declaresCoffee(value)) throw new Error('Notebook must declare CoffeeScript.');

      const minor = Number.isInteger(value.nbformat_minor) ? value.nbformat_minor : 0;
      const codeCells = value.cells.filter((cell) => cell && cell.cell_type === 'code');
      const nextCells = (codeCells.length ? codeCells : [{ source: '' }]).map(codeCell);
      const oldIds = new Set(this._notebook.cells.map((cell) => cell.id));
      const nextIds = new Set(nextCells.map((cell) => cell.id));

      oldIds.forEach((id) => {
        if (!nextIds.has(id)) this.deletedCells.push(id);
      });

      this._notebook = {
        eft_format: EFT_FORMAT,
        nbformat: NBFORMAT_MAJOR,
        nbformat_minor: Math.max(minor, NBFORMAT_MINOR),
        metadata: metadata(value.metadata, minor),
        cells: nextCells
      };
      this.dirty = options.markClean === false;
      this._emit('load');
    }

    replaceSources(sources, options = {}) {
      const normalized = Array.isArray(sources) && sources.length ? sources.map(normalizeNewlines) : [''];
      const previous = this._notebook.cells;
      if (
        previous.length === normalized.length &&
        previous.every((cell, index) => sourceText(cell.source) === normalized[index])
      ) return false;

      const next = normalized.map((source, index) => codeCell({
        ...previous[index],
        id: previous[index] && previous[index].id,
        source,
        metadata: previous[index] && previous[index].metadata
      }, index));

      if (next.length < previous.length) {
        previous.slice(next.length).forEach((cell) => {
          if (cell && cell.id) this.deletedCells.push(cell.id);
        });
      }

      this._notebook.cells = next;
      if (options.markDirty === false) this._emit('replaceSources');
      else this._touch('replaceSources');
      return true;
    }

    insertCell(index, source = '') {
      const target = Math.max(0, Math.min(Number(index) || 0, this._notebook.cells.length));
      this._notebook.cells.splice(target, 0, codeCell({ source }, target));
      this._notebook.cells = this._notebook.cells.map(codeCell);
      this._touch('insertCell');
      return target;
    }

    deleteCell(index) {
      if (!this._notebook.cells.length) this._notebook.cells = [codeCell({ source: '' }, 0)];
      const target = Math.max(0, Math.min(Number(index) || 0, this._notebook.cells.length - 1));
      if (this._notebook.cells.length === 1) {
        const id = this._notebook.cells[0].id;
        this._notebook.cells[0] = codeCell({ id, source: '' }, 0);
      } else {
        const removed = this._notebook.cells.splice(target, 1)[0];
        if (removed && removed.id) this.deletedCells.push(removed.id);
        this._notebook.cells = this._notebook.cells.map(codeCell);
      }
      this._touch('deleteCell');
      return Math.min(target, this._notebook.cells.length - 1);
    }

    moveCell(fromIndex, toIndex) {
      const count = this._notebook.cells.length;
      if (count < 2) return 0;
      const from = Math.max(0, Math.min(Number(fromIndex) || 0, count - 1));
      const to = Math.max(0, Math.min(Number(toIndex) || 0, count - 1));
      if (from === to) return to;
      const cell = this._notebook.cells.splice(from, 1)[0];
      this._notebook.cells.splice(to, 0, cell);
      this._notebook.cells = this._notebook.cells.map(codeCell);
      this._touch('moveCell');
      return to;
    }

    getCell(index) {
      const target = Math.max(0, Math.min(Number(index) || 0, this._notebook.cells.length - 1));
      return clone(this._notebook.cells[target]);
    }

    setCellSource(index, source) {
      const target = Math.max(0, Math.min(Number(index) || 0, this._notebook.cells.length - 1));
      const cell = this._notebook.cells[target];
      if (sourceText(cell.source) === normalizeNewlines(source)) return false;
      this._notebook.cells[target] = codeCell({ ...cell, source }, target);
      this._touch('setCellSource');
      return true;
    }

    diagnostics() {
      const notebook = this.toJSON();
      return {
        format: EFT_FORMAT,
        modelVersion: MODEL_VERSION,
        nbformat: NBFORMAT_MAJOR,
        nbformatMinor: NBFORMAT_MINOR,
        cellCount: this.cellCount,
        dirty: this.dirty,
        revision: this.revision,
        deletedCells: this.deletedCells.slice(),
        algorithm: algorithmReport(notebook)
      };
    }
  }

  const notebookModel = new EftNotebookModel();

  function editorText() {
    return notebookModel.cells
      .map((cell) => sourceText(cell.source).replace(/\s+$/g, ''))
      .join('\n\n' + CELL_SEPARATOR + '\n\n');
  }

  function activeCell(text, cursor) {
    return Math.max(
      0,
      Math.min(
        splitCells(String(text || '').slice(0, Math.max(0, Number(cursor) || 0))).length - 1,
        notebookModel.cellCount - 1
      )
    );
  }

  function cellOffset(index) {
    const cells = notebookModel.cells;
    let offset = 0;
    for (let i = 0; i < index && i < cells.length; i++) {
      offset += sourceText(cells[i].source).replace(/\s+$/g, '').length;
      offset += ('\n\n' + CELL_SEPARATOR + '\n\n').length;
    }
    return offset;
  }

  function syncEditor(markDirty = true) {
    const editor = getEditor();
    if (!editor || suppressEditorSync) return;
    notebookModel.replaceSources(splitCells(editor.value), { markDirty });
  }

  function renderModel(focusIndex) {
    const editor = getEditor();
    if (!editor) return;
    suppressEditorSync = true;
    editor.value = editorText();
    suppressEditorSync = false;
    if (Number.isInteger(focusIndex)) {
      const position = Math.min(editor.value.length, cellOffset(focusIndex));
      editor.setSelectionRange(position, position);
    }
    updateStatus();
  }

  function updateStatus(message) {
    const editor = getEditor();
    const status = byId(STATUS_ID);
    if (!editor || !status) return;
    if (message) {
      status.textContent = message;
      return;
    }
    const diagnostics = notebookModel.diagnostics();
    const lines = editor.value === '' ? 1 : editor.value.split('\n').length;
    status.textContent = [
      'CoffeeScript',
      'IPYNB ' + diagnostics.nbformat + '.' + diagnostics.nbformatMinor,
      diagnostics.cellCount + ' cell' + (diagnostics.cellCount === 1 ? '' : 's'),
      lines + ' lines',
      'Algorithm ' + diagnostics.algorithm.score + '/' + diagnostics.algorithm.total,
      diagnostics.dirty ? 'modified' : 'saved'
    ].join(' · ');
  }

  function saveDraftNow() {
    if (draftTimer) {
      clearTimeout(draftTimer);
      draftTimer = null;
    }
    const name = byId(NAME_ID);
    try {
      localStorage.setItem(STORAGE_KEY, notebookModel.toString());
      if (name) localStorage.setItem(NAME_STORAGE_KEY, sanitizeName(name.value));
    } catch (_) {}
  }

  function scheduleDraft() {
    if (draftTimer) clearTimeout(draftTimer);
    draftTimer = setTimeout(saveDraftNow, 180);
  }

  function loadDraft() {
    const name = byId(NAME_ID);
    let loaded = false;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        notebookModel.fromString(saved, { markClean: false });
        loaded = true;
      } else {
        for (const legacyKey of LEGACY_STORAGE_KEYS) {
          const legacy = localStorage.getItem(legacyKey);
          if (legacy === null) continue;
          try {
            const parsed = JSON.parse(legacy);
            if (parsed && parsed.nbformat) notebookModel.fromJSON(parsed, { markClean: false });
            else notebookModel.replaceSources(splitCells(legacy), { markDirty: true });
          } catch (_) {
            notebookModel.replaceSources(splitCells(legacy), { markDirty: true });
          }
          loaded = true;
          break;
        }
      }
      const savedName = localStorage.getItem(NAME_STORAGE_KEY);
      if (name && savedName) name.value = sanitizeName(savedName);
    } catch (_) {
      notebookModel.fromJSON(emptyNotebook(), { markClean: true });
    }
    renderModel();
    if (!loaded) notebookModel.markClean();
  }

  function editorInput() {
    syncEditor(true);
    scheduleDraft();
    updateStatus();
  }

  function insertTab(event) {
    if (event.key !== 'Tab') return;
    event.preventDefault();
    const editor = event.currentTarget;
    editor.setRangeText('  ', editor.selectionStart, editor.selectionEnd, 'end');
    editorInput();
  }

  function insertCell() {
    const editor = getEditor();
    if (!editor) return;
    syncEditor(true);
    const index = notebookModel.insertCell(activeCell(editor.value, editor.selectionStart) + 1, '');
    renderModel(index);
    saveDraftNow();
    editor.focus();
  }

  function deleteCell() {
    const editor = getEditor();
    if (!editor) return;
    syncEditor(true);
    const index = notebookModel.deleteCell(activeCell(editor.value, editor.selectionStart));
    renderModel(index);
    saveDraftNow();
    editor.focus();
  }

  function moveCell(delta) {
    const editor = getEditor();
    if (!editor) return;
    syncEditor(true);
    const active = activeCell(editor.value, editor.selectionStart);
    const target = Math.max(0, Math.min(active + delta, notebookModel.cellCount - 1));
    const index = notebookModel.moveCell(active, target);
    renderModel(index);
    saveDraftNow();
    editor.focus();
  }

  function applyAlgorithmTemplate() {
    notebookModel.fromJSON(algorithmTemplateNotebook(), { markClean: false });
    const name = byId(NAME_ID);
    if (name) name.value = 'untitled-algorithm';
    renderModel(0);
    saveDraftNow();
    updateStatus('Algorithm template ready · definition → implementation → demo');
    const editor = getEditor();
    if (editor) editor.focus();
  }

  function checkAlgorithm() {
    syncEditor(false);
    const report = algorithmReport(notebookModel.toJSON());
    if (report.complete) {
      updateStatus('Algorithm profile 4/4 · comments · readable naming · math · demo');
    } else {
      updateStatus('Algorithm profile ' + report.score + '/4 · missing: ' + report.missing.join(', '));
    }
    return report;
  }

  function buildEftNotebook() {
    syncEditor(false);
    return notebookModel.toJSON();
  }

  function notebookToCoffeeScript(notebook) {
    const model = new EftNotebookModel();
    model.fromJSON(notebook, { markClean: true });
    return model.cells
      .map((cell) => sourceText(cell.source).replace(/\s+$/g, ''))
      .join('\n\n' + CELL_SEPARATOR + '\n\n');
  }

  function downloadEft() {
    const name = byId(NAME_ID);
    if (!name) return false;
    syncEditor(true);
    const filename = sanitizeName(name.value) + '.eft';
    name.value = sanitizeName(name.value);
    const notebook = notebookModel.toJSON();
    const report = algorithmReport(notebook);
    notebook.metadata.hashcod.algorithm_validation = report;
    const blob = new Blob([JSON.stringify(notebook, null, 2) + '\n'], {
      type: 'application/json;charset=utf-8'
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.hidden = true;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notebookModel.markClean();
    saveDraftNow();
    updateStatus(
      'Downloaded ' + filename +
      ' · CoffeeScript + IPYNB 4.5 · Algorithm ' + report.score + '/' + report.total
    );
    return true;
  }

  function ensureImport() {
    if (importInput && importInput.isConnected) return importInput;
    importInput = document.createElement('input');
    importInput.type = 'file';
    importInput.accept = '.eft,.ipynb,.coffee,application/json,text/plain';
    importInput.hidden = true;
    importInput.id = 'hashcodEfrImportInput';
    importInput.addEventListener('change', async () => {
      const file = importInput.files && importInput.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        const lowerName = String(file.name || '').toLowerCase();
        if (lowerName.endsWith('.coffee')) {
          notebookModel.replaceSources([normalizeNewlines(text)], { markDirty: false });
          notebookModel.markClean();
        } else {
          const notebook = JSON.parse(text);
          if (lowerName.endsWith('.eft') && notebook.eft_format !== EFT_FORMAT) {
            throw new Error('Unsupported EFT format.');
          }
          notebookModel.fromJSON(notebook, { markClean: true });
        }
        const name = byId(NAME_ID);
        if (name) name.value = sanitizeName(file.name);
        renderModel(0);
        saveDraftNow();
        const report = algorithmReport(notebookModel.toJSON());
        updateStatus(
          'Loaded ' + file.name +
          ' · normalized to CoffeeScript/IPYNB 4.5 · Algorithm ' + report.score + '/4'
        );
        if (getEditor()) getEditor().focus();
      } catch (_) {
        updateStatus('Only CoffeeScript .coffee, CoffeeScript .ipynb, or HASHCOD-EFT-1 .eft files are accepted.');
      } finally {
        importInput.value = '';
      }
    });
    document.body.appendChild(importInput);
    return importInput;
  }

  function newDocument() {
    applyAlgorithmTemplate();
  }

  function ensureModal() {
    ensureStyles();
    let modal = byId(MODAL_ID);
    if (modal) return modal;

    modal = document.createElement('dialog');
    modal.id = MODAL_ID;
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
    modal.setAttribute('aria-labelledby', 'hashcodEfrEditorTitle');
    modal.innerHTML = [
      '<section id="hashcodEfrEditorWindow" role="document">',
        '<header class="hashcod-efr-editor-header">',
          '<div>',
            '<p class="hashcod-efr-editor-kicker">HASHCOD / EFT · ALGORITHM NOTEBOOK</p>',
            '<h2 id="hashcodEfrEditorTitle">EFT Code Editor</h2>',
            '<p class="hashcod-efr-editor-subtitle">CoffeeScript + Jupyter Notebook nbformat 4.5. Algorithm Profile follows the TheAlgorithms/Jupyter pattern: explain the idea/math, implement with readable commented code, then include a notebook demo. Code is never executed here.</p>',
          '</div>',
          '<button type="button" id="hashcodEfrEditorClose" class="hashcod-efr-icon-button" aria-label="Close editor">×</button>',
        '</header>',
        '<div class="hashcod-efr-toolbar">',
          '<div class="hashcod-eft-file-stack">',
            '<label class="hashcod-efr-name-wrap"><span>FILE</span><input id="' + NAME_ID + '" value="untitled-algorithm" autocomplete="off" spellcheck="false"><b>.eft</b></label>',
            '<div class="hashcod-eft-modebar">',
              '<span>COFFEESCRIPT</span>',
              '<span>IPYNB · NBFORMAT 4.5</span>',
              '<span>MODEL V3</span>',
              '<span>ALGORITHM PROFILE</span>',
              '<span>HASHCOD-EFT-1</span>',
            '</div>',
          '</div>',
          '<div class="hashcod-efr-actions">',
            '<button type="button" id="hashcodEfrNew" class="is-algorithm">New Algorithm</button>',
            '<button type="button" id="hashcodEfrCheck">Check Algorithm</button>',
            '<button type="button" id="hashcodEfrCell">New Cell</button>',
            '<button type="button" id="hashcodEfrCellUp">↑ Cell</button>',
            '<button type="button" id="hashcodEfrCellDown">↓ Cell</button>',
            '<button type="button" id="hashcodEfrCellDelete">Delete Cell</button>',
            '<button type="button" id="hashcodEfrOpen">Open</button>',
            '<button type="button" id="hashcodEfrDownload" class="is-primary">Download .eft</button>',
          '</div>',
        '</div>',
        '<div class="hashcod-efr-editor-body">',
          '<textarea id="' + TEXTAREA_ID + '" data-language="coffeescript" aria-label="CoffeeScript algorithm notebook editor" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" wrap="off" placeholder="# ALGORITHM\n# Math: ...\n\n# %% [EFT CELL]\n\n# IMPLEMENTATION\nsolveAlgorithm = (inputValue) -> inputValue\n\n# %% [EFT CELL]\n\n# DEMO"></textarea>',
        '</div>',
        '<footer class="hashcod-efr-editor-footer">',
          '<span id="' + STATUS_ID + '">CoffeeScript · IPYNB 4.5 · Algorithm profile</span>',
          '<span>Definition/Math → Implementation → Demo · Ctrl/Cmd + S → .eft</span>',
        '</footer>',
      '</section>'
    ].join('');
    document.body.appendChild(modal);

    const editor = getEditor();
    const name = byId(NAME_ID);
    editor.addEventListener('keydown', insertTab);
    editor.addEventListener('input', editorInput);
    name.addEventListener('input', scheduleDraft);
    byId('hashcodEfrEditorClose').addEventListener('click', closeEditor);
    byId('hashcodEfrOpen').addEventListener('click', () => ensureImport().click());
    byId('hashcodEfrNew').addEventListener('click', newDocument);
    byId('hashcodEfrCheck').addEventListener('click', checkAlgorithm);
    byId('hashcodEfrCell').addEventListener('click', insertCell);
    byId('hashcodEfrCellUp').addEventListener('click', () => moveCell(-1));
    byId('hashcodEfrCellDown').addEventListener('click', () => moveCell(1));
    byId('hashcodEfrCellDelete').addEventListener('click', deleteCell);
    byId('hashcodEfrDownload').addEventListener('click', downloadEft);

    modal.addEventListener('cancel', (event) => {
      event.preventDefault();
      closeEditor();
    });
    modal.addEventListener('click', (event) => {
      if (event.target === modal) closeEditor();
    });

    notebookModel.onChange(() => updateStatus());
    loadDraft();
    return modal;
  }

  function modalOpen() {
    const modal = byId(MODAL_ID);
    return !!(
      modal &&
      modal.open &&
      !modal.hidden &&
      modal.getAttribute('aria-hidden') === 'false'
    );
  }

  function openEditor() {
    const modal = ensureModal();
    lastFocused = document.activeElement;
    modal.hidden = false;
    modal.removeAttribute('hidden');
    modal.setAttribute('aria-hidden', 'false');
    modal.style.setProperty('display', 'grid', 'important');
    modal.style.setProperty('visibility', 'visible', 'important');
    modal.style.setProperty('opacity', '1', 'important');
    modal.style.setProperty('pointer-events', 'auto', 'important');
    try {
      if (typeof modal.showModal === 'function' && !modal.open) modal.showModal();
      else if (!modal.open) modal.setAttribute('open', '');
    } catch (_) {
      modal.setAttribute('open', '');
    }
    document.documentElement.classList.add('hashcod-efr-editor-open');
    const hotzone = byId(HOTZONE_ID);
    if (hotzone) hotzone.style.display = 'none';
    requestAnimationFrame(() => getEditor() && getEditor().focus({ preventScroll: true }));
    return true;
  }

  function closeEditor() {
    const modal = byId(MODAL_ID);
    if (!modal) return;
    syncEditor(true);
    saveDraftNow();
    try {
      if (typeof modal.close === 'function' && modal.open) modal.close();
      else modal.removeAttribute('open');
    } catch (_) {
      modal.removeAttribute('open');
    }
    modal.hidden = true;
    modal.setAttribute('hidden', '');
    modal.setAttribute('aria-hidden', 'true');
    modal.style.removeProperty('display');
    modal.style.removeProperty('visibility');
    modal.style.removeProperty('opacity');
    document.documentElement.classList.remove('hashcod-efr-editor-open');
    repairTrayButton();
    syncHotzone();
    if (lastFocused && lastFocused.focus) {
      try { lastFocused.focus({ preventScroll: true }); } catch (_) {}
    }
  }

  function repairTrayButton() {
    const button = getTrayButton();
    if (!button) return null;
    button.disabled = false;
    button.removeAttribute('disabled');
    button.setAttribute('aria-disabled', 'false');
    button.classList.remove('is-empty');
    button.dataset.toolId = TOOL_ID;
    button.setAttribute('aria-label', 'EFT CoffeeScript Algorithm Notebook');
    button.title = 'EFT CoffeeScript Algorithm Notebook';
    button.style.setProperty('pointer-events', 'auto', 'important');
    button.style.setProperty('cursor', 'pointer', 'important');
    button.style.setProperty('opacity', '1', 'important');
    if (!button.querySelector('[data-hashcod-efr-icon="true"]')) button.innerHTML = EDITOR_ICON;
    if (button.dataset.hashcodEfrBound !== 'true') {
      button.dataset.hashcodEfrBound = 'true';
      button.onclick = function (event) {
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }
        openEditor();
      };
    }
    return button;
  }

  function pointInsideButton(event, button) {
    if (!button || !event) return false;
    const x = Number(event.clientX);
    const y = Number(event.clientY);
    const rect = button.getBoundingClientRect();
    return (
      Number.isFinite(x) &&
      Number.isFinite(y) &&
      rect.width > 0 &&
      rect.height > 0 &&
      x >= rect.left &&
      x <= rect.right &&
      y >= rect.top &&
      y <= rect.bottom
    );
  }

  function handlePhysicalTrayPress(event) {
    if (modalOpen()) return;
    const button = getTrayButton();
    if (!button) return;
    const target = event.target;
    if (!(target && (target === button || button.contains(target))) && !pointInsideButton(event, button)) return;
    event.preventDefault();
    event.stopPropagation();
    openEditor();
  }

  function ensureHotzone() {
    let zone = byId(HOTZONE_ID);
    if (zone) return zone;
    zone = document.createElement('button');
    zone.type = 'button';
    zone.id = HOTZONE_ID;
    zone.setAttribute('aria-label', 'Open EFT CoffeeScript Algorithm Notebook');
    zone.style.cssText = 'position:fixed;display:none;z-index:2147483646;border:0;padding:0;margin:0;background:transparent;opacity:.001;pointer-events:auto;cursor:pointer;';
    zone.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      event.stopPropagation();
      openEditor();
    }, true);
    zone.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      openEditor();
    }, true);
    document.body.appendChild(zone);
    return zone;
  }

  function syncHotzone() {
    const zone = ensureHotzone();
    const button = getTrayButton();
    const overlay = document.getElementById('authOverlay');
    const visible = !overlay || (
      getComputedStyle(overlay).display !== 'none' &&
      getComputedStyle(overlay).visibility !== 'hidden'
    );
    if (!button || !visible || modalOpen()) {
      zone.style.display = 'none';
      return;
    }
    const rect = button.getBoundingClientRect();
    if (!rect.width || !rect.height) {
      zone.style.display = 'none';
      return;
    }
    zone.style.display = 'block';
    zone.style.left = rect.left + 'px';
    zone.style.top = rect.top + 'px';
    zone.style.width = rect.width + 'px';
    zone.style.height = rect.height + 'px';
  }

  function registerTray() {
    const api = window.HashcodVectorTray;
    if (!api || typeof api.registerTool !== 'function') return false;
    if (registeredTrayApi === api) return true;
    api.registerTool({
      slot: TRAY_SLOT,
      id: TOOL_ID,
      label: 'EFT CoffeeScript Notebook',
      iconSvg: EDITOR_ICON,
      onClick: openEditor
    });
    registeredTrayApi = api;
    return true;
  }

  function repairAndSync() {
    registerTray();
    repairTrayButton();
    syncHotzone();
  }

  function watchTray() {
    if (trayObserver) return;
    trayObserver = new MutationObserver((records) => {
      if (records.some((record) => record.type === 'childList')) requestAnimationFrame(repairAndSync);
    });
    trayObserver.observe(document.documentElement, { childList: true, subtree: true });
  }

  function bindKeys() {
    document.addEventListener('keydown', (event) => {
      if (!modalOpen()) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        closeEditor();
      } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        downloadEft();
      }
    });
  }

  function diagnostics() {
    const button = getTrayButton();
    const zone = byId(HOTZONE_ID);
    return {
      ready: document.documentElement.dataset.hashcodEfrReady === 'true',
      buttonFound: !!button,
      buttonDisabled: button ? !!button.disabled : null,
      toolId: button ? button.getAttribute('data-tool-id') : null,
      modalOpen: modalOpen(),
      hotzoneVisible: !!(zone && zone.style.display !== 'none'),
      format: EFT_FORMAT,
      language: 'coffeescript',
      container: 'ipynb',
      algorithmProfile: ALGORITHM_PROFILE,
      model: notebookModel.diagnostics()
    };
  }

  function boot() {
    ensureStyles();
    ensureModal();
    ensureImport();
    ensureHotzone();
    bindKeys();
    watchTray();
    window.addEventListener('pointerdown', handlePhysicalTrayPress, true);
    window.addEventListener('mousedown', handlePhysicalTrayPress, true);
    document.addEventListener('click', handlePhysicalTrayPress, true);
    window.addEventListener('resize', syncHotzone, { passive: true });
    window.addEventListener('scroll', syncHotzone, true);
    window.addEventListener('hashcod:platform-entered', repairAndSync);
    repairAndSync();
    repairTimer = window.setInterval(repairAndSync, 400);
    document.documentElement.dataset.hashcodEfrReady = 'true';
    window.dispatchEvent(new CustomEvent('hashcod:efr-ready'));
  }

  window.HashcodEfrCodeEditor = {
    open: openEditor,
    close: closeEditor,
    download: downloadEft,
    buildNotebook: buildEftNotebook,
    notebookToCoffeeScript,
    applyAlgorithmTemplate,
    checkAlgorithm,
    algorithmReport,
    model: notebookModel,
    repair() {
      repairAndSync();
      return !!getTrayButton();
    },
    diagnostics
  };

  window.HashcodEftNotebookModel = EftNotebookModel;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();