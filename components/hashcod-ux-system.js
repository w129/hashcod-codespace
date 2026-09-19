(function () {
  'use strict';

  if (window.__hashcodUxSystemLoaded) return;
  window.__hashcodUxSystemLoaded = true;

  const VERSION = 'HASHCOD-UX-1';
  const THEME_KEY = 'hashcod_ux_theme_v1';
  const AUTOSAVE_PREFIX = 'hashcod_form_draft_v1:';
  const SENSITIVE_RE = /(pass(word)?|secret|token|otp|pin|cvv|card|credit|private|seed|mnemonic|key|auth|session|cookie|ssn|cedula|cédula)/i;
  const REDUCED_MOTION = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const state = {
    themePreference: 'system',
    resolvedTheme: 'light',
    paletteOpen: false,
    commandIndex: 0,
    revealObserver: null,
    mutationObserver: null,
    autosaveTimers: new WeakMap(),
    autosaveBound: new WeakSet(),
    formsRestored: new WeakSet(),
    commands: [],
    dynamicCommands: [],
    lastErrorToast: 0,
    ready: false
  };

  function safeStorageGet(key) {
    try { return localStorage.getItem(key); } catch (_) { return null; }
  }

  function safeStorageSet(key, value) {
    try { localStorage.setItem(key, value); return true; } catch (_) { return false; }
  }

  function safeStorageRemove(key) {
    try { localStorage.removeItem(key); } catch (_) {}
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char];
    });
  }

  function currentBase() {
    const script = document.currentScript || document.querySelector('script[data-hashcod-ux-system]');
    const src = script && script.src ? script.src : '';
    if (src && src.lastIndexOf('/') >= 0) return src.slice(0, src.lastIndexOf('/') + 1);
    return '/components/';
  }

  function ensureStylesheet() {
    if (document.getElementById('hashcodUxSystemStyles')) return;
    const link = document.createElement('link');
    link.id = 'hashcodUxSystemStyles';
    link.rel = 'stylesheet';
    link.href = currentBase() + 'hashcod-ux-system.css?v=20260917-1';
    document.head.appendChild(link);
  }

  function resolveTheme(preference) {
    if (preference === 'dark' || preference === 'light') return preference;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function applyTheme(preference, options) {
    const pref = ['light', 'dark', 'system'].includes(preference) ? preference : 'system';
    const resolved = resolveTheme(pref);
    state.themePreference = pref;
    state.resolvedTheme = resolved;
    document.documentElement.dataset.hashcodTheme = resolved;
    document.documentElement.dataset.hashcodThemePreference = pref;
    document.documentElement.style.colorScheme = resolved;
    safeStorageSet(THEME_KEY, pref);
    annotateLogos(document);
    updateThemeButton();
    window.dispatchEvent(new CustomEvent('hashcod:theme-change', { detail: { preference: pref, resolved: resolved } }));
    if (!options || !options.silent) toast('Theme: ' + (pref === 'system' ? 'system → ' + resolved : pref), 'success', 1600);
    return resolved;
  }

  function cycleTheme() {
    if (state.themePreference === 'light') return applyTheme('dark');
    if (state.themePreference === 'dark') return applyTheme('system');
    return applyTheme('light');
  }

  function annotateLogos(root) {
    const scope = root && root.querySelectorAll ? root : document;
    const selectors = [
      'img[alt*="hashcod" i]', 'img[class*="logo" i]', 'img[id*="logo" i]',
      'svg[aria-label*="hashcod" i]', 'svg[class*="logo" i]', 'svg[id*="logo" i]',
      '[class*="brand" i] img', '[class*="brand" i] svg'
    ];
    scope.querySelectorAll(selectors.join(',')).forEach(function (node) {
      if (node.dataset && node.dataset.preserveColor === 'true') return;
      node.classList.add('hashcod-theme-logo');
    });
  }

  function haptic(pattern) {
    const vibration = Array.isArray(pattern) ? pattern : [Number(pattern) || 8];
    try {
      if (navigator.vibrate) return navigator.vibrate(vibration);
    } catch (_) {}
    try {
      if (window.HashcodDesktop && typeof window.HashcodDesktop.haptic === 'function') {
        window.HashcodDesktop.haptic(vibration[0] || 8);
        return true;
      }
    } catch (_) {}
    return false;
  }

  function toast(message, type, duration) {
    ensureUiRoots();
    const stack = document.getElementById('hashcodUxToastStack');
    if (!stack) return;
    const item = document.createElement('div');
    item.className = 'hashcod-ux-toast';
    item.dataset.type = type || 'info';
    item.setAttribute('role', type === 'error' ? 'alert' : 'status');
    item.textContent = String(message || '');
    stack.appendChild(item);
    const ttl = Math.max(900, Number(duration) || 2600);
    window.setTimeout(function () {
      item.style.opacity = '0';
      item.style.transform = 'translateY(6px)';
      window.setTimeout(function () { item.remove(); }, 180);
    }, ttl);
  }

  function setLoading(element, loading, label) {
    if (!element) return;
    const active = Boolean(loading);
    element.classList.toggle('hashcod-ux-loading', active);
    if (active) {
      if (!element.hasAttribute('data-hashcod-prev-disabled')) element.dataset.hashcodPrevDisabled = element.disabled ? '1' : '0';
      if ('disabled' in element) element.disabled = true;
      element.setAttribute('aria-busy', 'true');
      if (label) element.dataset.hashcodLoadingLabel = String(label);
    } else {
      element.classList.remove('hashcod-ux-error-state');
      element.removeAttribute('aria-busy');
      if ('disabled' in element && element.dataset.hashcodPrevDisabled !== undefined) {
        element.disabled = element.dataset.hashcodPrevDisabled === '1';
        delete element.dataset.hashcodPrevDisabled;
      }
      delete element.dataset.hashcodLoadingLabel;
    }
  }

  function setError(element, message) {
    if (element) {
      setLoading(element, false);
      element.classList.add('hashcod-ux-error-state');
      element.setAttribute('aria-invalid', 'true');
    }
    toast(message || 'Something went wrong.', 'error', 3600);
    haptic([18, 30, 18]);
  }

  function skeleton(element, active) {
    if (!element) return;
    element.classList.toggle('hashcod-ux-skeleton', active !== false);
    element.setAttribute('aria-busy', active === false ? 'false' : 'true');
    if (active === false) element.removeAttribute('aria-busy');
  }

  async function request(input, init, options) {
    const opts = options || {};
    const target = opts.target || null;
    if (target) setLoading(target, true, opts.loadingLabel);
    try {
      const response = await fetch(input, init);
      if (!response.ok) throw new Error(opts.errorMessage || ('Request failed · HTTP ' + response.status));
      if (target) setLoading(target, false);
      return response;
    } catch (error) {
      if (target) setError(target, error && error.message ? error.message : 'Request failed.');
      throw error;
    }
  }

  async function shareContent(payload) {
    const data = payload && typeof payload === 'object' ? payload : {};
    const shareData = {
      title: data.title || document.title || 'Hashcod Codespace',
      text: data.text || '',
      url: data.url || location.href
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        toast('Shared.', 'success', 1500);
        haptic(10);
        return true;
      }
      const text = [shareData.title, shareData.text, shareData.url].filter(Boolean).join('\n');
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        toast('Share link copied.', 'success', 1700);
        haptic(8);
        return true;
      }
    } catch (error) {
      if (error && error.name === 'AbortError') return false;
      toast('Could not share this content.', 'error');
      return false;
    }
    const temporary = document.createElement('textarea');
    temporary.value = shareData.url;
    temporary.setAttribute('readonly', '');
    temporary.style.position = 'fixed';
    temporary.style.opacity = '0';
    document.body.appendChild(temporary);
    temporary.select();
    try { document.execCommand('copy'); toast('Share link copied.', 'success', 1700); } catch (_) { toast('Copy the URL from the address bar.', 'error'); }
    temporary.remove();
    return true;
  }

  function isSensitiveForm(form) {
    if (!form || form.matches('[data-no-autosave],[data-hashcod-autosave="off"]')) return true;
    const fields = Array.from(form.elements || []);
    return fields.some(function (field) {
      const type = String(field.type || '').toLowerCase();
      const signature = [field.name, field.id, field.autocomplete, field.placeholder].filter(Boolean).join(' ');
      return type === 'password' || type === 'file' || SENSITIVE_RE.test(signature);
    });
  }

  function formStorageKey(form) {
    const identity = form.id || form.getAttribute('name') || form.getAttribute('action') || ('form-' + Array.from(document.forms).indexOf(form));
    return AUTOSAVE_PREFIX + location.pathname + ':' + identity;
  }

  function serializableFields(form) {
    return Array.from(form.elements || []).filter(function (field) {
      if (!field || field.disabled || !field.name && !field.id) return false;
      const type = String(field.type || '').toLowerCase();
      const signature = [field.name, field.id, field.autocomplete].filter(Boolean).join(' ');
      return !['password', 'file', 'submit', 'button', 'reset', 'image', 'hidden'].includes(type) && !SENSITIVE_RE.test(signature);
    });
  }

  function serializeForm(form) {
    const result = {};
    serializableFields(form).forEach(function (field) {
      const key = field.name || field.id;
      const type = String(field.type || '').toLowerCase();
      if (type === 'checkbox' || type === 'radio') result[key] = Boolean(field.checked);
      else result[key] = String(field.value == null ? '' : field.value).slice(0, 20000);
    });
    return result;
  }

  function restoreForm(form) {
    if (!form || state.formsRestored.has(form) || isSensitiveForm(form)) return;
    state.formsRestored.add(form);
    const raw = safeStorageGet(formStorageKey(form));
    if (!raw) return;
    let draft;
    try { draft = JSON.parse(raw); } catch (_) { return; }
    if (!draft || typeof draft.values !== 'object') return;
    serializableFields(form).forEach(function (field) {
      const key = field.name || field.id;
      if (!Object.prototype.hasOwnProperty.call(draft.values, key)) return;
      const type = String(field.type || '').toLowerCase();
      if (type === 'checkbox' || type === 'radio') field.checked = Boolean(draft.values[key]);
      else if (!field.value) field.value = String(draft.values[key] == null ? '' : draft.values[key]);
    });
    updateAutosaveBadge(form, 'saved', 'Draft restored');
    form.dispatchEvent(new CustomEvent('hashcod:form-restored', { detail: { savedAt: draft.savedAt || null } }));
  }

  function updateAutosaveBadge(form, status, label) {
    let badge = form.querySelector(':scope > .hashcod-ux-autosave-badge');
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'hashcod-ux-autosave-badge';
      badge.setAttribute('aria-live', 'polite');
      form.appendChild(badge);
    }
    badge.dataset.state = status;
    badge.textContent = label || (status === 'saving' ? 'Saving…' : 'Saved');
  }

  function saveForm(form, explicit) {
    if (!form || isSensitiveForm(form)) return false;
    const payload = { savedAt: new Date().toISOString(), values: serializeForm(form) };
    updateAutosaveBadge(form, 'saving', 'Saving…');
    const saved = safeStorageSet(formStorageKey(form), JSON.stringify(payload));
    updateAutosaveBadge(form, saved ? 'saved' : 'saving', saved ? 'Saved locally' : 'Storage unavailable');
    if (explicit && saved) toast('Form draft saved.', 'success', 1500);
    form.dispatchEvent(new CustomEvent('hashcod:form-saved', { detail: payload }));
    return saved;
  }

  function bindAutosave(form) {
    if (!form || state.autosaveBound.has(form) || isSensitiveForm(form)) return;
    state.autosaveBound.add(form);
    form.dataset.hashcodAutosave = form.dataset.hashcodAutosave || 'on';
    restoreForm(form);
    function schedule() {
      updateAutosaveBadge(form, 'saving', 'Saving…');
      const previous = state.autosaveTimers.get(form);
      if (previous) clearTimeout(previous);
      state.autosaveTimers.set(form, setTimeout(function () { saveForm(form, false); }, 500));
    }
    form.addEventListener('input', schedule, { passive: true });
    form.addEventListener('change', schedule, { passive: true });
    form.addEventListener('submit', function (event) {
      const submitter = event.submitter || form.querySelector('[type="submit"]');
      if (submitter) setLoading(submitter, true, 'Submitting');
      saveForm(form, false);
      window.setTimeout(function () { if (submitter) setLoading(submitter, false); }, 12000);
    });
    form.addEventListener('reset', function () {
      safeStorageRemove(formStorageKey(form));
      const badge = form.querySelector(':scope > .hashcod-ux-autosave-badge');
      if (badge) badge.remove();
    });
  }

  function bindForms(root) {
    const scope = root && root.querySelectorAll ? root : document;
    scope.querySelectorAll('form').forEach(bindAutosave);
  }

  function annotateSkeletons(root) {
    const scope = root && root.querySelectorAll ? root : document;
    scope.querySelectorAll('[data-hashcod-skeleton],[data-skeleton="true"],[aria-busy="true"][data-hashcod-auto-skeleton]').forEach(function (element) {
      skeleton(element, true);
    });
  }

  function setupRevealObserver() {
    if (REDUCED_MOTION || !('IntersectionObserver' in window)) return;
    state.revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('hashcod-ux-reveal-visible');
        state.revealObserver.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -7% 0px', threshold: 0.08 });
    annotateReveal(document);
  }

  function annotateReveal(root) {
    if (REDUCED_MOTION || !state.revealObserver) return;
    const scope = root && root.querySelectorAll ? root : document;
    const selectors = 'main section,main article,[data-scroll-reveal],[class*="feature" i]:not([data-no-scroll-reveal]),[class*="card" i]:not([data-no-scroll-reveal])';
    scope.querySelectorAll(selectors).forEach(function (element) {
      if (element.closest('#hashcodUxPalette,#hashcodUxShortcuts')) return;
      if (element.classList.contains('hashcod-ux-reveal')) return;
      const rect = element.getBoundingClientRect();
      if (rect.height < 24 || rect.width < 60) return;
      element.classList.add('hashcod-ux-reveal');
      state.revealObserver.observe(element);
    });
  }

  function updateThemeButton() {
    const button = document.getElementById('hashcodUxTheme');
    if (!button) return;
    button.textContent = state.resolvedTheme === 'dark' ? '☀' : '◐';
    button.title = 'Theme: ' + state.themePreference + ' · Alt+T';
    button.setAttribute('aria-label', 'Change theme. Current: ' + state.themePreference);
  }

  function ensureUiRoots() {
    if (!document.body) return;
    if (!document.getElementById('hashcodUxToastStack')) {
      const toastStack = document.createElement('div');
      toastStack.id = 'hashcodUxToastStack';
      toastStack.className = 'hashcod-ux-toast-stack';
      toastStack.setAttribute('aria-live', 'polite');
      document.body.appendChild(toastStack);
    }
    if (!document.getElementById('hashcodUxActions')) {
      const actions = document.createElement('div');
      actions.id = 'hashcodUxActions';
      actions.className = 'hashcod-ux-actions';
      actions.innerHTML = [
        '<button id="hashcodUxPaletteButton" class="hashcod-ux-action" type="button" title="Command palette · Ctrl/Cmd+K" aria-label="Open command palette">⌘</button>',
        '<button id="hashcodUxShare" class="hashcod-ux-action" type="button" title="Share · Alt+S" aria-label="Share this page">↗</button>',
        '<button id="hashcodUxTheme" class="hashcod-ux-action" type="button" aria-label="Change theme">◐</button>'
      ].join('');
      document.body.appendChild(actions);
      actions.querySelector('#hashcodUxPaletteButton').addEventListener('click', openPalette);
      actions.querySelector('#hashcodUxShare').addEventListener('click', function () { shareContent(); });
      actions.querySelector('#hashcodUxTheme').addEventListener('click', cycleTheme);
      updateThemeButton();
    }
    if (!document.getElementById('hashcodUxPalette')) buildPalette();
    if (!document.getElementById('hashcodUxShortcuts')) buildShortcuts();
  }

  function baseCommands() {
    return [
      { id: 'theme-dark', title: 'Theme · Dark', hint: 'Switch the platform to dark mode', keys: 'Alt+T', run: function () { applyTheme('dark'); } },
      { id: 'theme-light', title: 'Theme · Light', hint: 'Switch the platform to light mode', run: function () { applyTheme('light'); } },
      { id: 'theme-system', title: 'Theme · System', hint: 'Follow the operating-system theme', run: function () { applyTheme('system'); } },
      { id: 'share', title: 'Share current content', hint: 'Native share sheet or clipboard fallback', keys: 'Alt+S', run: function () { shareContent(); } },
      { id: 'save', title: 'Save active form draft', hint: 'Store non-sensitive fields locally', keys: 'Ctrl/⌘+Shift+S', run: function () {
        const active = document.activeElement && document.activeElement.closest ? document.activeElement.closest('form') : null;
        if (active && !isSensitiveForm(active)) saveForm(active, true);
        else toast('Focus a non-sensitive form first.', 'info');
      } },
      { id: 'top', title: 'Scroll to top', hint: 'Return to the beginning of this view', run: function () { window.scrollTo({ top: 0, behavior: REDUCED_MOTION ? 'auto' : 'smooth' }); } },
      { id: 'reload', title: 'Reload platform', hint: 'Refresh this Hashcod view', run: function () { location.reload(); } },
      { id: 'shortcuts', title: 'Keyboard shortcuts', hint: 'Show all global shortcuts', keys: 'Alt+/', run: showShortcuts },
      { id: 'home', title: 'Go to Hashcod home', hint: 'Open the platform root', run: function () { location.href = resolveHomeUrl(); } }
    ];
  }

  function resolveHomeUrl() {
    const base = document.querySelector('base[href]');
    return base ? base.href : '/';
  }

  function dynamicCommands() {
    const nodes = Array.from(document.querySelectorAll('button:not([disabled]),a[href],[role="button"]')).filter(function (node) {
      return !node.closest('#hashcodUxPalette,#hashcodUxActions,#hashcodUxShortcuts');
    }).slice(0, 180);
    const used = new Set();
    return nodes.map(function (node, index) {
      const title = String(node.getAttribute('aria-label') || node.getAttribute('title') || node.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 72);
      if (title.length < 2) return null;
      const key = title.toLowerCase();
      if (used.has(key)) return null;
      used.add(key);
      return {
        id: 'dynamic-' + index,
        title: title,
        hint: node.tagName === 'A' ? 'Navigate' : 'Platform action',
        run: function () { node.click(); }
      };
    }).filter(Boolean).slice(0, 80);
  }

  function filteredCommands(query) {
    const all = baseCommands().concat(dynamicCommands());
    const normalized = String(query || '').trim().toLowerCase();
    if (!normalized) return all.slice(0, 28);
    return all.filter(function (command) {
      return (command.title + ' ' + (command.hint || '')).toLowerCase().includes(normalized);
    }).slice(0, 40);
  }

  function renderPalette() {
    const input = document.getElementById('hashcodUxPaletteInput');
    const list = document.getElementById('hashcodUxPaletteList');
    if (!input || !list) return;
    const commands = filteredCommands(input.value);
    state.commands = commands;
    state.commandIndex = Math.min(state.commandIndex, Math.max(0, commands.length - 1));
    if (!commands.length) {
      list.innerHTML = '<div class="hashcod-ux-palette-empty">No command matches this search.</div>';
      return;
    }
    list.innerHTML = commands.map(function (command, index) {
      return '<button class="hashcod-ux-command" type="button" data-command-index="' + index + '" aria-selected="' + (index === state.commandIndex ? 'true' : 'false') + '"><span><strong>' + escapeHtml(command.title) + '</strong><small>' + escapeHtml(command.hint || '') + '</small></span><kbd>' + escapeHtml(command.keys || '') + '</kbd></button>';
    }).join('');
    list.querySelectorAll('[data-command-index]').forEach(function (button) {
      button.addEventListener('mouseenter', function () {
        state.commandIndex = Number(button.dataset.commandIndex) || 0;
        updatePaletteSelection();
      });
      button.addEventListener('click', function () { executeCommand(Number(button.dataset.commandIndex) || 0); });
    });
  }

  function updatePaletteSelection() {
    document.querySelectorAll('#hashcodUxPaletteList [data-command-index]').forEach(function (button) {
      button.setAttribute('aria-selected', String(Number(button.dataset.commandIndex) === state.commandIndex));
    });
    const active = document.querySelector('#hashcodUxPaletteList [data-command-index="' + state.commandIndex + '"]');
    if (active) active.scrollIntoView({ block: 'nearest' });
  }

  function executeCommand(index) {
    const command = state.commands[index];
    if (!command) return;
    closePalette();
    haptic(7);
    try { command.run(); } catch (error) { setError(null, error && error.message ? error.message : 'Command failed.'); }
  }

  function buildPalette() {
    const palette = document.createElement('div');
    palette.id = 'hashcodUxPalette';
    palette.className = 'hashcod-ux-palette';
    palette.hidden = true;
    palette.innerHTML = [
      '<div class="hashcod-ux-palette-shell" role="dialog" aria-modal="true" aria-label="Hashcod command palette">',
        '<div class="hashcod-ux-palette-head"><input id="hashcodUxPaletteInput" class="hashcod-ux-palette-input" type="search" placeholder="Search commands…" autocomplete="off" spellcheck="false"></div>',
        '<div id="hashcodUxPaletteList" class="hashcod-ux-palette-list"></div>',
        '<div class="hashcod-ux-palette-foot"><span>↑↓ navigate</span><span>Enter run</span><span>Esc close</span><span>Ctrl/⌘ K palette</span></div>',
      '</div>'
    ].join('');
    document.body.appendChild(palette);
    const input = palette.querySelector('#hashcodUxPaletteInput');
    input.addEventListener('input', function () { state.commandIndex = 0; renderPalette(); });
    input.addEventListener('keydown', function (event) {
      if (event.key === 'ArrowDown') { event.preventDefault(); state.commandIndex = Math.min(state.commands.length - 1, state.commandIndex + 1); updatePaletteSelection(); }
      if (event.key === 'ArrowUp') { event.preventDefault(); state.commandIndex = Math.max(0, state.commandIndex - 1); updatePaletteSelection(); }
      if (event.key === 'Enter') { event.preventDefault(); executeCommand(state.commandIndex); }
    });
    palette.addEventListener('mousedown', function (event) { if (event.target === palette) closePalette(); });
  }

  function openPalette() {
    ensureUiRoots();
    const palette = document.getElementById('hashcodUxPalette');
    const input = document.getElementById('hashcodUxPaletteInput');
    if (!palette || !input) return;
    palette.hidden = false;
    state.paletteOpen = true;
    state.commandIndex = 0;
    input.value = '';
    renderPalette();
    requestAnimationFrame(function () { input.focus(); });
    haptic(6);
  }

  function closePalette() {
    const palette = document.getElementById('hashcodUxPalette');
    if (palette) palette.hidden = true;
    state.paletteOpen = false;
  }

  function buildShortcuts() {
    const modal = document.createElement('div');
    modal.id = 'hashcodUxShortcuts';
    modal.className = 'hashcod-ux-shortcuts';
    modal.hidden = true;
    modal.innerHTML = [
      '<section class="hashcod-ux-shortcuts-card" role="dialog" aria-modal="true" aria-label="Keyboard shortcuts">',
        '<header><h2>Hashcod shortcuts</h2><button id="hashcodUxShortcutsClose" type="button" aria-label="Close">×</button></header>',
        '<div class="hashcod-ux-shortcut-row"><span>Command palette</span><kbd>Ctrl/⌘ + K</kbd></div>',
        '<div class="hashcod-ux-shortcut-row"><span>Change theme</span><kbd>Alt + T</kbd></div>',
        '<div class="hashcod-ux-shortcut-row"><span>Share current content</span><kbd>Alt + S</kbd></div>',
        '<div class="hashcod-ux-shortcut-row"><span>Save active form draft</span><kbd>Ctrl/⌘ + Shift + S</kbd></div>',
        '<div class="hashcod-ux-shortcut-row"><span>Shortcut help</span><kbd>Alt + /</kbd></div>',
        '<div class="hashcod-ux-shortcut-row"><span>Close overlay</span><kbd>Esc</kbd></div>',
      '</section>'
    ].join('');
    document.body.appendChild(modal);
    modal.querySelector('#hashcodUxShortcutsClose').addEventListener('click', hideShortcuts);
    modal.addEventListener('mousedown', function (event) { if (event.target === modal) hideShortcuts(); });
  }

  function showShortcuts() {
    ensureUiRoots();
    const modal = document.getElementById('hashcodUxShortcuts');
    if (modal) modal.hidden = false;
  }

  function hideShortcuts() {
    const modal = document.getElementById('hashcodUxShortcuts');
    if (modal) modal.hidden = true;
  }

  function keyboardHandler(event) {
    const key = String(event.key || '').toLowerCase();
    if ((event.ctrlKey || event.metaKey) && key === 'k') {
      event.preventDefault();
      if (state.paletteOpen) closePalette(); else openPalette();
      return;
    }
    if (event.altKey && key === 't') { event.preventDefault(); cycleTheme(); return; }
    if (event.altKey && key === 's') { event.preventDefault(); shareContent(); return; }
    if (event.altKey && key === '/') { event.preventDefault(); showShortcuts(); return; }
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && key === 's') {
      event.preventDefault();
      const active = document.activeElement && document.activeElement.closest ? document.activeElement.closest('form') : null;
      if (active && !isSensitiveForm(active)) saveForm(active, true); else toast('Focus a non-sensitive form first.', 'info');
      return;
    }
    if (event.key === 'Escape') { closePalette(); hideShortcuts(); }
  }

  function globalInteractionHandler(event) {
    const target = event.target && event.target.closest ? event.target.closest('button,a,[role="button"],input[type="checkbox"],input[type="radio"],[data-haptic]') : null;
    if (!target || target.closest('#hashcodUxActions') && event.type === 'pointerdown') return;
    if (event.type === 'pointerup') haptic(target.dataset && target.dataset.haptic ? Number(target.dataset.haptic) || 7 : 5);
  }

  function bindShareTriggers(root) {
    const scope = root && root.querySelectorAll ? root : document;
    scope.querySelectorAll('[data-hashcod-share]').forEach(function (button) {
      if (button.dataset.hashcodShareBound === '1') return;
      button.dataset.hashcodShareBound = '1';
      button.addEventListener('click', function () {
        shareContent({
          title: button.dataset.shareTitle || document.title,
          text: button.dataset.shareText || '',
          url: button.dataset.shareUrl || location.href
        });
      });
    });
  }

  function monitorDom() {
    const pendingRoots = new Set();
    let scheduled = false;

    function processRoot(node) {
      if (!node || node.nodeType !== 1 || !node.isConnected) return;
      annotateLogos(node);
      bindForms(node);
      bindShareTriggers(node);
      annotateSkeletons(node);
      annotateReveal(node);
      if (node.matches && node.matches('form')) bindAutosave(node);
    }

    function flushPending(deadline) {
      scheduled = false;
      let processed = 0;
      for (const node of Array.from(pendingRoots)) {
        pendingRoots.delete(node);
        processRoot(node);
        processed += 1;
        if (processed >= 24) break;
        if (deadline && typeof deadline.timeRemaining === 'function' && deadline.timeRemaining() < 2) break;
      }
      if (pendingRoots.size) scheduleFlush();
    }

    function scheduleFlush() {
      if (scheduled) return;
      scheduled = true;
      if (typeof window.requestIdleCallback === 'function') {
        window.requestIdleCallback(flushPending, { timeout: 120 });
      } else {
        window.setTimeout(function () { flushPending(null); }, 0);
      }
    }

    state.mutationObserver = new MutationObserver(function (records) {
      records.forEach(function (record) {
        record.addedNodes.forEach(function (node) {
          if (!node || node.nodeType !== 1) return;
          pendingRoots.add(node);
        });
      });
      if (pendingRoots.size && document.visibilityState !== 'hidden') scheduleFlush();
    });
    state.mutationObserver.observe(document.documentElement, { childList: true, subtree: true });

    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible' && pendingRoots.size) scheduleFlush();
    });
  }

  function isBrowserExtensionError(reason) {
    if (!reason) return false;
    const message = String(reason && reason.message ? reason.message : reason || '');
    const stack = String(reason && reason.stack ? reason.stack : '');
    const source = String(
      reason && (reason.fileName || reason.filename || reason.sourceURL || reason.source)
        ? (reason.fileName || reason.filename || reason.sourceURL || reason.source)
        : ''
    );
    const combined = [stack, source].join('\n');

    // Browser extensions execute inside the same page context and can reject
    // promises that Hashcod did not create. Never surface those as platform
    // failures. Keep first-party errors visible for real diagnostics.
    if (/(?:chrome|moz|safari-web|edge)-extension:\/\//i.test(combined)) return true;

    // Known extension regression currently seen in Chromium. Only suppress the
    // signature when there is no Hashcod/HTTP(S) application frame attached.
    if (
      /Cannot read properties of undefined \(reading ['"]M_ID['"]\)/.test(message)
      && !/https?:\/\//i.test(combined)
    ) {
      return true;
    }

    return false;
  }

  function handleGlobalErrors() {
    window.addEventListener('unhandledrejection', function (event) {
      const reason = event && event.reason;
      if (isBrowserExtensionError(reason)) return;

      const now = Date.now();
      if (now - state.lastErrorToast < 2500) return;
      state.lastErrorToast = now;
      const message = reason && reason.message ? reason.message : 'A background operation failed.';
      toast(message, 'error', 3800);
    });
  }

  function boot() {
    if (state.ready || !document.body) return;
    state.ready = true;
    ensureStylesheet();
    state.themePreference = safeStorageGet(THEME_KEY) || 'system';
    applyTheme(state.themePreference, { silent: true });
    ensureUiRoots();
    bindForms(document);
    bindShareTriggers(document);
    annotateLogos(document);
    annotateSkeletons(document);
    setupRevealObserver();
    monitorDom();
    handleGlobalErrors();
    document.addEventListener('keydown', keyboardHandler, true);
    document.addEventListener('pointerup', globalInteractionHandler, { passive: true, capture: true });
    window.addEventListener('pageshow', function () {
      document.querySelectorAll('.hashcod-ux-loading').forEach(function (element) { setLoading(element, false); });
    });
    if (window.matchMedia) {
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = function () { if (state.themePreference === 'system') applyTheme('system', { silent: true }); };
      if (media.addEventListener) media.addEventListener('change', listener);
      else if (media.addListener) media.addListener(listener);
    }
    window.dispatchEvent(new CustomEvent('hashcod:ux-ready', { detail: diagnostics() }));
  }

  function diagnostics() {
    return {
      version: VERSION,
      ready: state.ready,
      themePreference: state.themePreference,
      theme: state.resolvedTheme,
      palette: Boolean(document.getElementById('hashcodUxPalette')),
      autosaveForms: document.querySelectorAll('form[data-hashcod-autosave="on"]').length,
      shareSupported: Boolean(navigator.share || navigator.clipboard),
      hapticSupported: Boolean(navigator.vibrate || (window.HashcodDesktop && typeof window.HashcodDesktop.haptic === 'function')),
      reducedMotion: REDUCED_MOTION,
      inPlatform: true
    };
  }

  ensureStylesheet();
  window.HashcodUX = Object.freeze({
    version: VERSION,
    boot: boot,
    diagnostics: diagnostics,
    theme: Object.freeze({
      set: applyTheme,
      cycle: cycleTheme,
      get: function () { return { preference: state.themePreference, resolved: state.resolvedTheme }; }
    }),
    palette: Object.freeze({ open: openPalette, close: closePalette }),
    share: shareContent,
    haptic: haptic,
    toast: toast,
    loading: setLoading,
    error: setError,
    skeleton: skeleton,
    request: request,
    autosave: Object.freeze({ save: saveForm, restore: restoreForm, clear: function (form) { if (form) safeStorageRemove(formStorageKey(form)); } })
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
