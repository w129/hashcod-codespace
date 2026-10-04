import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api.js';
import 'monaco-editor/esm/vs/basic-languages/php/php.contribution.js';
import './node_modules/monaco-editor/min/vs/editor/editor.main.css';
import './entry.css';

const API = '/api/code-access';
const VERSION = '20261004-mesh-dialog1';
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
      viewBox="0 0 256 256"
      aria-hidden="true"
      focusable="false"
    >
      <g
        fill="#ffffff"
        fillRule="nonzero"
        stroke="none"
        strokeWidth="1"
        strokeLinecap="butt"
        strokeLinejoin="miter"
        strokeMiterlimit="10"
      >
        <g transform="scale(5.12,5.12)">
          <path d="M17.22656,46.58203c-0.12109,0 -0.24219,-0.01953 -0.35547,-0.0625c-8.89453,-3.36328 -14.87109,-12.01172 -14.87109,-21.51953c0,-12.68359 10.31641,-23 23,-23c12.68359,0 23,10.31641 23,23c0,9.50781 -5.97656,18.15625 -14.87109,21.51953c-0.24609,0.09375 -0.52344,0.08594 -0.76562,-0.02734c-0.24219,-0.10547 -0.42969,-0.30859 -0.52344,-0.55469l-4.94922,-13.10937c-0.19531,-0.51562 0.0625,-1.09375 0.58203,-1.28906c2.70703,-1.01953 4.52734,-3.64844 4.52734,-6.53906c0,-3.85937 -3.14062,-7 -7,-7c-3.85937,0 -7,3.14063 -7,7c0,2.89063 1.82031,5.51953 4.52734,6.53906c0.51953,0.19531 0.77734,0.77344 0.58203,1.28906l-4.94922,13.10547c-0.09375,0.25 -0.28125,0.44922 -0.52344,0.55859c-0.12891,0.0625 -0.26953,0.08984 -0.41016,0.08984z" />
        </g>
      </g>
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

  const completed = FIELD_NAMES.filter((name) => String(fields[name] || '').trim()).length;

  return (
    <div
      className="mesh-dialog-backdrop"
      role="presentation"
      data-animate-ui-dialog="mesh-credential"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <section
        id="d5MeshCredentialWindow"
        className="mesh-animate-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="d5MeshCredentialTitle"
      >
        <header className="mesh-animate-header">
          <div className="mesh-animate-heading">
            <span className="mesh-animate-logo" aria-hidden="true">
              <MeshNodeIcon size={26} />
            </span>
            <div>
              <span className="mesh-animate-eyebrow">OCG MESH ACCESS</span>
              <h2 id="d5MeshCredentialTitle">Mesh node credential</h2>
            </div>
          </div>

          <div className="mesh-animate-header-actions">
            <span className="mesh-animate-state" data-bound={bound ? 'true' : 'false'}>
              <i aria-hidden="true" />
              {bound ? 'Bound' : 'First enrollment'}
            </span>
            <button
              className="mesh-animate-close"
              type="button"
              aria-label="Close credential window"
              onClick={onClose}
              disabled={busy}
            >
              <svg viewBox="0 0 20 20" aria-hidden="true">
                <path d="M5.25 5.25 14.75 14.75M14.75 5.25 5.25 14.75" />
              </svg>
            </button>
          </div>
        </header>

        <div className="mesh-animate-body">
          <div className="mesh-animate-schema">
            <div>
              <span>Schema</span>
              <strong>OCG Mesh Node</strong>
            </div>
            <code>{SCHEMA}</code>
          </div>

          <div className="mesh-animate-callout" data-bound={bound ? 'true' : 'false'}>
            <span className="mesh-animate-callout-icon" aria-hidden="true">
              {bound ? '02' : '01'}
            </span>
            <div>
              <strong>{bound ? 'Verify the original binding' : 'Create this browser binding'}</strong>
              <p>
                {bound
                  ? 'Enter the exact same seven values used during the first enrollment. A different value will be rejected.'
                  : 'Enter any non-empty values once. After binding, this browser will only accept this exact set after reload.'}
              </p>
            </div>
          </div>

          <div className="mesh-animate-progress" aria-label={completed + ' of 7 fields completed'}>
            <span><b>{completed}</b>/7 fields</span>
            <div aria-hidden="true">
              <i style={{ '--mesh-progress': completed / FIELD_NAMES.length }} />
            </div>
          </div>

          <div className="mesh-animate-fields">
            {FIELD_NAMES.map((name, index) => (
              <label
                key={name}
                className="mesh-animate-field"
                style={{ '--mesh-field-index': index }}
              >
                <span>{name}</span>
                <input
                  id={'d5MeshField' + name}
                  name={name}
                  value={fields[name]}
                  autoComplete="off"
                  spellCheck="false"
                  placeholder={'Enter ' + name.toLowerCase()}
                  onChange={(event) => {
                    const value = event.target.value;
                    setFields((current) => ({ ...current, [name]: value }));
                  }}
                />
              </label>
            ))}
          </div>

          {error ? (
            <div className="mesh-animate-error" role="alert">
              <span aria-hidden="true">!</span>
              <p>{error}</p>
            </div>
          ) : null}
        </div>

        <footer className="mesh-animate-footer">
          <p>
            <span aria-hidden="true" />
            Stored as a sealed browser binding
          </p>
          <div>
            <button
              className="mesh-animate-button mesh-animate-button-ghost"
              type="button"
              onClick={onClose}
              disabled={busy}
            >
              Cancel
            </button>
            <button
              id="d5MeshCredentialSubmit"
              className="mesh-animate-button mesh-animate-button-primary"
              type="button"
              onClick={onSubmit}
              disabled={busy}
            >
              {busy ? (
                <>
                  <span className="mesh-animate-spinner" aria-hidden="true" />
                  Checking
                </>
              ) : bound ? 'Verify & unlock' : 'Bind & unlock'}
            </button>
          </div>
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
