import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api.js';
import 'monaco-editor/esm/vs/basic-languages/php/php.contribution.js';
import './node_modules/monaco-editor/min/vs/editor/editor.main.css';
import './entry.css';

const API = '/api/code-access';
const VERSION = '20261004-code-access1';

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

const PROTOCOL_SOURCE = `<?php

// HASHCOD-ACCESS/1
// This PHP-shaped document is parsed as literal data.
// The server NEVER executes eval(), include(), require(), shell commands,
// functions, variables, objects, or arbitrary PHP from this editor.

return [
  'protocol' => 'HASHCOD-ACCESS/1',
  'challenge' => 'ONE_TIME_SERVER_CHALLENGE',
  'signature' => 'ML_DSA_87_SIGNATURE_BASE64',
];
`;

function buildTemplate(challenge = 'LOADING_ONE_TIME_CHALLENGE') {
  return `<?php

return [
  'protocol' => 'HASHCOD-ACCESS/1',
  'challenge' => '${challenge}',
  'signature' => 'PASTE_ML_DSA_87_SIGNATURE_BASE64_HERE',
];
`;
}

function MonacoCodeEditor({ value, onChange, readOnly = false, ariaLabel }) {
  const hostRef = useRef(null);
  const editorRef = useRef(null);
  const changeSubscriptionRef = useRef(null);

  useEffect(() => {
    if (!hostRef.current || editorRef.current) return undefined;

    monaco.editor.defineTheme('hashcod-access-dark', {
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
      theme: 'hashcod-access-dark',
      readOnly,
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
      contextmenu: true,
      links: false,
      occurrencesHighlight: 'off',
      selectionHighlight: false,
      suggest: { showWords: false },
      quickSuggestions: false,
      parameterHints: { enabled: false },
      ariaLabel,
    });
    editorRef.current = editor;

    changeSubscriptionRef.current = editor.onDidChangeModelContent(() => {
      if (!readOnly && onChange) onChange(editor.getValue());
    });

    return () => {
      changeSubscriptionRef.current?.dispose();
      editor.dispose();
      editorRef.current = null;
    };
  }, []);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.updateOptions({ readOnly });
    if (editor.getValue() !== value) editor.setValue(value);
  }, [value, readOnly]);

  return <div ref={hostRef} className="code-access-monaco" />;
}

function CodeAccessGate({ required, initiallyAuthorized }) {
  const [authorized, setAuthorized] = useState(initiallyAuthorized || !required);
  const [activeTab, setActiveTab] = useState('Access.php');
  const [source, setSource] = useState(buildTemplate());
  const [challenge, setChallenge] = useState('');
  const [expiresAt, setExpiresAt] = useState(0);
  const [fingerprint, setFingerprint] = useState('');
  const [busy, setBusy] = useState(required && !initiallyAuthorized);
  const [status, setStatus] = useState('Preparing one-time challenge…');
  const [statusKind, setStatusKind] = useState('idle');

  const editorValue = activeTab === 'Access.php' ? source : PROTOCOL_SOURCE;
  const readOnly = activeTab !== 'Access.php';

  const loadChallenge = useCallback(async () => {
    if (!required) return;
    setBusy(true);
    setStatusKind('idle');
    setStatus('Generating a new signed-manifest challenge…');
    try {
      const response = await fetch(API, {
        method: 'GET',
        credentials: 'same-origin',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) throw new Error(data.error || 'Unable to create access challenge.');
      if (data.authorized) {
        setAuthorized(true);
        document.body.dataset.hashcodCodeAccessAuthorized = '1';
        return;
      }
      const nextChallenge = String(data.challenge || '');
      setChallenge(nextChallenge);
      setExpiresAt(Number(data.expires_at || 0));
      setFingerprint(String(data.public_key_fingerprint || ''));
      setSource(String(data.template || buildTemplate(nextChallenge)));
      setActiveTab('Access.php');
      setStatus('Paste the ML-DSA-87 signature into the signature field, then validate.');
      setStatusKind('ready');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to initialize secure access.');
      setStatusKind('error');
    } finally {
      setBusy(false);
    }
  }, [required]);

  useEffect(() => {
    if (required && !initiallyAuthorized) loadChallenge();
  }, [required, initiallyAuthorized, loadChallenge]);

  const validate = useCallback(async () => {
    if (busy || authorized) return;
    setBusy(true);
    setStatus('Validating signed access manifest…');
    setStatusKind('idle');
    try {
      const response = await fetch(API, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ source }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok || !data.authorized) {
        throw new Error(data.error || 'Access manifest rejected.');
      }
      setStatus('Access granted. Opening Hashcod Codespace…');
      setStatusKind('success');
      document.body.dataset.hashcodCodeAccessAuthorized = '1';
      window.HashcodCodeAccess = Object.freeze({
        mounted: true,
        authorized: true,
        protocol: 'HASHCOD-ACCESS/1',
        editor: 'Monaco',
        version: VERSION,
      });
      window.dispatchEvent(new CustomEvent('hashcod:code-access-granted'));
      setTimeout(() => setAuthorized(true), 260);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Access manifest rejected.');
      setStatusKind('error');
    } finally {
      setBusy(false);
    }
  }, [source, busy, authorized]);

  const copyChallenge = useCallback(async () => {
    if (!challenge) return;
    try {
      await navigator.clipboard.writeText(challenge);
      setStatus('Challenge copied.');
      setStatusKind('ready');
    } catch {
      setStatus('Could not copy the challenge automatically.');
      setStatusKind('error');
    }
  }, [challenge]);

  const timeLabel = useMemo(() => {
    if (!expiresAt) return '—';
    return Math.max(0, expiresAt - Math.floor(Date.now() / 1000)) + 's';
  }, [expiresAt, source, busy]);

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
        data-protocol="HASHCOD-ACCESS/1"
      >
        <header className="code-access-header">
          <div className="code-access-heading">
            <span className="code-access-mark" aria-hidden="true">HC</span>
            <div>
              <p>HASHCOD CODESPACE · SECURE ENTRY</p>
              <h1 id="d5CodeAccessTitle">Access manifest</h1>
            </div>
          </div>
          <span className="code-access-security-pill">ML-DSA-87 · FIPS 204</span>
        </header>

        <p className="code-access-description">
          Enter the signed PHP-shaped access code. It is parsed as data and is never executed by the server.
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
              <button type="button" onClick={copyChallenge} disabled={!challenge}>Copy challenge</button>
              <button type="button" onClick={loadChallenge} disabled={busy}>Refresh</button>
            </div>
          </div>

          <MonacoCodeEditor
            value={editorValue}
            onChange={activeTab === 'Access.php' ? setSource : undefined}
            readOnly={readOnly}
            ariaLabel={activeTab === 'Access.php' ? 'Hashcod access PHP manifest editor' : 'Hashcod access protocol example'}
          />
        </div>

        <div className="code-access-meta">
          <span><b>Challenge</b><code>{challenge ? challenge.slice(0, 25) + '…' : 'loading…'}</code></span>
          <span><b>Expires</b><code>{timeLabel}</code></span>
          <span><b>Fingerprint</b><code>{fingerprint ? fingerprint.slice(0, 14) + '…' : '—'}</code></span>
        </div>

        <footer className="code-access-footer">
          <p id="d5CodeAccessStatus" className="code-access-status" data-kind={statusKind} role="status" aria-live="polite">
            <i aria-hidden="true" />
            <span>{status}</span>
          </p>
          <button
            id="d5CodeAccessValidate"
            className="code-access-validate"
            type="button"
            onClick={validate}
            disabled={busy || activeTab !== 'Access.php'}
          >
            {busy ? 'Validating…' : 'Validate access code'}
          </button>
        </footer>
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
    protocol: 'HASHCOD-ACCESS/1',
    editor: 'Monaco',
    version: VERSION,
  });
  return true;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountCodeAccess, { once: true });
} else {
  mountCodeAccess();
}
