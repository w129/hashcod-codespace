import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api.js';
import 'monaco-editor/esm/vs/basic-languages/php/php.contribution.js';
import './node_modules/monaco-editor/min/vs/editor/editor.main.css';
import './entry.css';

const API = '/api/code-access';
const VERSION = '20261004-mesh-bind1';
const SCHEMA = 'OCG.MSH.v10.119-ibAKA-QJ73o-NrdXI';
const FIELD_NAMES = ['TYPE', 'PAYLOAD', 'SALT', 'NONCE', 'ISSUED', 'USE', 'CHECK'];

function resolveMonacoWorkerUrl() {
  const script = Array.from(document.scripts).find((node) =>
    String(node.src || '').includes('code-access.bundle.js')
  );
  if (script?.src) {
    return script.src.replace(/code-access\.bundle\.js(?:\?.*)?$/, 'monaco-editor.worker.js?v=' + VERSION);
  }
  return '/components/monaco-editor.worker.js?v=' + VERSION;
}

self.MonacoEnvironment = {
  getWorker() {
    return new Worker(resolveMonacoWorkerUrl(), {
      name: 'hashcod-monaco-editor',
    });
  },
};

const ACCESS_SOURCE = `<?php

// OCG Mesh Node access
// Click the vector mesh icon inside this editor to open the credential window.

return [
  'schema' => 'OCG.MSH.v10.119-ibAKA-QJ73o-NrdXI',
  'mode' => 'MESH-NODE-BINDING',
  'action' => 'OPEN_VECTOR_MESH_ICON',
];
`;

const PROTOCOL_SOURCE = `<?php

// FIRST-USE BINDING
//
// 1. Open the vector mesh icon.
// 2. Fill TYPE, PAYLOAD, SALT, NONCE, ISSUED, USE and CHECK.
// 3. The first accepted set is bound to this browser.
// 4. After a reload, only that exact same set can unlock the platform.
//
// The server stores a sealed digest, not the field values.

return [
  'schema' => 'OCG.MSH.v10.119-ibAKA-QJ73o-NrdXI',
  'binding' => 'FIRST-USE',
  'persistence' => 'HTTPONLY-SIGNED-COOKIE',
];
`;

function MeshNodeIcon({ size = 24 }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M12,2C6.486,2,2,6.486,2,12c0,0.532,0.054,1.05,0.134,1.56c2.88-0.676,7.328,0.815,7.328,0.815 c6.032-3.567,9.263-0.79,9.263-0.79c-6.176-0.574-8.928,3.758-8.928,3.758c-2.156-1.921-6.006-2.267-7.331-2.329 C3.748,19.059,7.537,22,12,22c5.514,0,10-4.486,10-10S17.514,2,12,2z M13.915,10.043c-1.771-2.13-5.386-1.652-5.386-1.652 c2.609-1.843,5.362-0.072,5.362-0.072c2.801-1.843,6.176,0.215,6.176,0.215C15.662,7.505,13.915,10.043,13.915,10.043z" />
    </svg>
  );
}

function MonacoCodeEditor({ value, ariaLabel }) {
  const hostRef = useRef(null);
  const editorRef = useRef(null);

  useEffect(() => {
    if (!hostRef.current || editorRef.current) return undefined;

    monaco.editor.defineTheme('hashcod-mesh-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: 'E5E5E5' },
        { token: 'string', foreground: 'C7F9CC' },
        { token: 'comment', foreground: '737373', fontStyle: 'italic' },
        { token: 'delimiter', foreground: 'A3A3A3' },
      ],
      colors: {
        'editor.background': '#0A0A0A',
        'editor.foreground': '#F5F5F5',
        'editorLineNumber.foreground': '#525252',
        'editorLineNumber.activeForeground': '#D4D4D4',
        'editorCursor.foreground': '#FFFFFF',
        'editor.selectionBackground': '#333333',
        'editor.inactiveSelectionBackground': '#262626',
        'editor.lineHighlightBackground': '#111111',
        'editorIndentGuide.background1': '#262626',
        'editorIndentGuide.activeBackground1': '#525252',
      },
    });

    const editor = monaco.editor.create(hostRef.current, {
      value,
      language: 'php',
      theme: 'hashcod-mesh-dark',
      readOnly: true,
      automaticLayout: true,
      minimap: { enabled: false },
      lineNumbers: 'on',
      lineNumbersMinChars: 3,
      glyphMargin: false,
      folding: false,
      renderLineHighlight: 'line',
      scrollBeyondLastLine: false,
      wordWrap: 'off',
      roundedSelection: false,
      overviewRulerLanes: 0,
      hideCursorInOverviewRuler: true,
      fontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace',
      fontSize: 13,
      lineHeight: 21,
      tabSize: 2,
      padding: { top: 16, bottom: 16 },
      contextmenu: false,
      links: false,
      occurrencesHighlight: 'off',
      selectionHighlight: false,
      quickSuggestions: false,
      parameterHints: { enabled: false },
      ariaLabel,
    });
    editorRef.current = editor;

    return () => {
      editor.dispose();
      editorRef.current = null;
    };
  }, []);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    if (editor.getValue() !== value) editor.setValue(value);
  }, [value]);

  return <div ref={hostRef} className="code-access-monaco" />;
}

function emptyFields() {
  return Object.fromEntries(FIELD_NAMES.map((name) => [name, '']));
}

function MeshCredentialWindow({
  open,
  bound,
  fields,
  setFields,
  busy,
  error,
  onClose,
  onSubmit,
}) {
  if (!open) return null;

  return (
    <div className="mesh-dialog-backdrop" role="presentation">
      <section
        id="d5MeshCredentialWindow"
        className="mesh-tk-window"
        role="dialog"
        aria-modal="true"
        aria-labelledby="d5MeshCredentialTitle"
      >
        <header className="mesh-tk-titlebar">
          <span className="mesh-tk-title-icon"><MeshNodeIcon size={18} /></span>
          <strong id="d5MeshCredentialTitle">OCG Mesh Node Credential</strong>
          <button type="button" aria-label="Close credential window" onClick={onClose}>×</button>
        </header>

        <div className="mesh-tk-body">
          <div className="mesh-schema-row">
            <span>SCHEMA</span>
            <code>{SCHEMA}</code>
          </div>

          <p className="mesh-tk-hint">
            {bound
              ? 'This browser is already bound. Enter the exact same values used during the first enrollment.'
              : 'First enrollment: any non-empty values are accepted once, then this browser is permanently bound to that exact set.'}
          </p>

          <div className="mesh-tk-fields">
            {FIELD_NAMES.map((name) => (
              <label key={name}>
                <span>{name}=</span>
                <input
                  id={'d5MeshField' + name}
                  name={name}
                  value={fields[name]}
                  autoComplete="off"
                  spellCheck="false"
                  onChange={(event) => {
                    const value = event.target.value;
                    setFields((current) => ({ ...current, [name]: value }));
                  }}
                />
              </label>
            ))}
          </div>

          {error ? <p className="mesh-tk-error" role="alert">{error}</p> : null}
        </div>

        <footer className="mesh-tk-actions">
          <button type="button" onClick={onClose} disabled={busy}>Cancel</button>
          <button
            id="d5MeshCredentialSubmit"
            className="mesh-tk-primary"
            type="button"
            onClick={onSubmit}
            disabled={busy}
          >
            {busy ? 'Checking…' : bound ? 'Verify & unlock' : 'Bind & unlock'}
          </button>
        </footer>
      </section>
    </div>
  );
}

function CodeAccessGate({ required, initiallyAuthorized }) {
  const [authorized, setAuthorized] = useState(initiallyAuthorized || !required);
  const [activeTab, setActiveTab] = useState('Access.php');
  const [bound, setBound] = useState(false);
  const [busy, setBusy] = useState(required && !initiallyAuthorized);
  const [status, setStatus] = useState('Preparing OCG mesh binding…');
  const [statusKind, setStatusKind] = useState('idle');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogError, setDialogError] = useState('');
  const [fields, setFields] = useState(() => emptyFields());

  const editorValue = activeTab === 'Access.php' ? ACCESS_SOURCE : PROTOCOL_SOURCE;

  const loadBindingState = useCallback(async () => {
    if (!required) return;
    setBusy(true);
    setStatusKind('idle');
    try {
      const response = await fetch(API, {
        method: 'GET',
        credentials: 'same-origin',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Unable to read mesh binding state.');
      }
      const isBound = Boolean(data.bound);
      setBound(isBound);
      setStatus(
        isBound
          ? 'This browser already has an OCG mesh binding. Click the vector icon and enter the original values.'
          : 'Click the vector mesh icon inside the editor to create the first binding.'
      );
      setStatusKind('ready');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to initialize OCG mesh access.');
      setStatusKind('error');
    } finally {
      setBusy(false);
    }
  }, [required]);

  useEffect(() => {
    if (required && !initiallyAuthorized) loadBindingState();
  }, [required, initiallyAuthorized, loadBindingState]);

  const openCredential = useCallback(() => {
    setDialogError('');
    setFields(emptyFields());
    setDialogOpen(true);
  }, []);

  const submitCredential = useCallback(async () => {
    if (busy) return;

    const missing = FIELD_NAMES.find((name) => !String(fields[name] || '').trim());
    if (missing) {
      setDialogError('Fill every field before continuing. Missing: ' + missing);
      return;
    }

    setBusy(true);
    setDialogError('');
    setStatus('Checking OCG mesh credential…');
    setStatusKind('idle');

    try {
      const response = await fetch(API, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-Hashcod-Mesh': '1',
        },
        body: JSON.stringify({ fields }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok || !data.authorized) {
        const message = data.error || 'Mesh credential rejected.';
        setDialogError(message);
        setStatus(message);
        setStatusKind('error');
        return;
      }

      setBound(true);
      setStatus(
        data.enrolled
          ? 'Mesh credential bound. Opening Hashcod Codespace…'
          : 'Mesh credential matched. Opening Hashcod Codespace…'
      );
      setStatusKind('success');
      document.body.dataset.hashcodCodeAccessAuthorized = '1';
      window.HashcodCodeAccess = Object.freeze({
        mounted: true,
        authorized: true,
        protocol: SCHEMA,
        editor: 'Monaco',
        mode: 'mesh-first-use-binding',
        bound: true,
        version: VERSION,
      });
      window.dispatchEvent(new CustomEvent('hashcod:code-access-granted'));
      setDialogOpen(false);
      window.setTimeout(() => setAuthorized(true), 260);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Mesh credential rejected.';
      setDialogError(message);
      setStatus(message);
      setStatusKind('error');
    } finally {
      setBusy(false);
    }
  }, [busy, fields]);

  if (!required || authorized) return null;

  return (
    <div className="code-access-overlay" role="presentation">
      <section
        id="d5CodeAccessGate"
        className="code-access-window"
        role="dialog"
        aria-modal="true"
        aria-labelledby="d5CodeAccessTitle"
        data-editor="monaco"
        data-protocol={SCHEMA}
        data-bound={bound ? 'true' : 'false'}
      >
        <header className="code-access-header">
          <div className="code-access-heading">
            <span className="code-access-mark" aria-hidden="true">HC</span>
            <div>
              <p>HASHCOD CODESPACE · SECURE ENTRY</p>
              <h1 id="d5CodeAccessTitle">Mesh access binding</h1>
            </div>
          </div>
          <span className="code-access-security-pill">OCG MESH · FIRST-USE BINDING</span>
        </header>

        <p className="code-access-description">
          Click the vector mesh icon inside the editor. The first credential set is bound to this browser; later reloads require the exact same values.
        </p>

        <div className="code-tabs-shell">
          <div className="code-tabs-toolbar">
            <div className="code-tabs-list" role="tablist" aria-label="Access code tabs">
              {['Access.php', 'Protocol'].map((tab) => (
                <button
                  key={tab}
                  id={tab === 'Access.php' ? 'd5CodeAccessTab' : undefined}
                  className="code-tabs-trigger"
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab}
                  data-active={activeTab === tab ? 'true' : 'false'}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="code-tabs-tools">
              <span>PHP</span>
              <span className="mesh-binding-state" data-bound={bound ? 'true' : 'false'}>
                {bound ? 'BOUND' : 'UNBOUND'}
              </span>
            </div>
          </div>

          <div className="mesh-editor-stage">
            <MonacoCodeEditor
              value={editorValue}
              ariaLabel={activeTab === 'Access.php' ? 'OCG mesh access editor' : 'OCG mesh binding protocol'}
            />
            <button
              id="d5MeshNodeIcon"
              className="mesh-editor-icon"
              type="button"
              aria-label="Open OCG mesh credential window"
              title="Open OCG Mesh Node Credential"
              data-vector-icon="ocg-mesh-node"
              onClick={openCredential}
            >
              <MeshNodeIcon size={32} />
            </button>
          </div>
        </div>

        <div className="code-access-meta mesh-meta">
          <span><b>SCHEMA</b><code>{SCHEMA}</code></span>
          <span><b>MODE</b><code>MESH-NODE</code></span>
          <span><b>BINDING</b><code>{bound ? 'BOUND' : 'FIRST ENROLLMENT'}</code></span>
        </div>

        <footer className="code-access-footer">
          <p id="d5CodeAccessStatus" className="code-access-status" data-kind={statusKind} role="status" aria-live="polite">
            <i aria-hidden="true" />
            <span>{status}</span>
          </p>
          <button
            id="d5OpenMeshCredential"
            className="code-access-validate"
            type="button"
            onClick={openCredential}
            disabled={busy}
          >
            Open mesh credential
          </button>
        </footer>

        <MeshCredentialWindow
          open={dialogOpen}
          bound={bound}
          fields={fields}
          setFields={setFields}
          busy={busy}
          error={dialogError}
          onClose={() => !busy && setDialogOpen(false)}
          onSubmit={submitCredential}
        />
      </section>
    </div>
  );
}

function mountCodeAccess() {
  const node = document.getElementById('d5CodeAccessMount');
  if (!node || node.dataset.reactMounted === 'true') return Boolean(node);

  const required = node.dataset.required === '1';
  const initiallyAuthorized = node.dataset.authorized === '1';

  const root = createRoot(node);
  root.render(<CodeAccessGate required={required} initiallyAuthorized={initiallyAuthorized} />);
  node.dataset.reactMounted = 'true';

  window.HashcodCodeAccess = Object.freeze({
    mounted: true,
    authorized: initiallyAuthorized || !required,
    protocol: SCHEMA,
    editor: 'Monaco',
    mode: 'mesh-first-use-binding',
    bound: false,
    version: VERSION,
  });
  return true;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountCodeAccess, { once: true });
} else {
  mountCodeAccess();
}
