import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './entry.css';

const API = '/api/code-access';
const VERSION = '20261007-entry-fixes1';
const PROTOCOL = 'HASHCOD-NUMERIC-SERIES/1';

function CodeAccessGate({ required }) {
  const [checking, setChecking] = useState(required);
  const [authorized, setAuthorized] = useState(!required);
  const [series, setSeries] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const input = useRef(null);

  function applyServerState(data) {
    if (!data?.ok || typeof data.required !== 'boolean' || typeof data.authorized !== 'boolean') {
      throw new Error('No se pudo comprobar el acceso. Reintenta.');
    }
    // Never interpret the POST alone as a persisted binding. Read the cookie
    // back through GET and require the actual server protocol when enabled.
    const allowed = !data.required || (data.authorized === true && data.bound === true && data.protocol === PROTOCOL);
    window.HashcodCodeAccess = Object.freeze({ mounted: true, authorized: allowed,
      required: data.required, bound: data.required && allowed, protocol: data.protocol || null,
      mode: data.required ? 'server-verified-access' : 'open-entry', version: VERSION });
    document.body.dataset.hashcodCodeAccessRequired = data.required ? '1' : '0';
    document.body.dataset.hashcodCodeAccessAuthorized = allowed ? '1' : '0';
    const mount = document.getElementById('d5CodeAccessMount');
    if (mount) { mount.dataset.required = data.required ? '1' : '0'; mount.dataset.authorized = allowed ? '1' : '0'; }
    setAuthorized(allowed);
    if (allowed) window.dispatchEvent(new CustomEvent('hashcod:code-access-granted'));
    return allowed;
  }

  async function verifyState() {
    const response = await fetch(API, { credentials: 'same-origin', cache: 'no-store', headers: { Accept: 'application/json' } });
    const data = await response.json();
    if (!response.ok) throw new Error('No se pudo comprobar el acceso. Reintenta.');
    return applyServerState(data);
  }

  async function check() {
    setChecking(true); setError('');
    try { await verifyState(); }
    catch (e) { setError(e.message || 'No se pudo comprobar el acceso.'); }
    finally { setChecking(false); }
  }

  useEffect(() => { if (required) check(); }, []);
  useEffect(() => { if (!checking && !authorized) input.current?.focus(); }, [checking, authorized]);

  async function submit(event) {
    event.preventDefault(); if (busy) return;
    setBusy(true); setError('');
    try {
      const response = await fetch(API, { method: 'POST', credentials: 'same-origin', cache: 'no-store',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-Hashcod-Numeric-Series': '1' },
        body: JSON.stringify({ series }) });
      const data = await response.json();
      if (!response.ok || !data.ok || !data.authorized) throw new Error(data.error || 'No se pudo validar la credencial.');
      if (!await verifyState()) throw new Error('No se guardó la verificación. Permite las cookies y reintenta.');
      setSeries('');
    } catch (e) { setError(e.message || 'No se pudo validar la credencial.'); }
    finally { setBusy(false); }
  }

  if (authorized) return null;
  return <div className="code-access-overlay"><section id="d5CodeAccessGate" className="code-access-window" role="dialog" aria-modal="true" aria-labelledby="access-title">
    <span className="code-access-brand">HC · HASHCOD CODESPACE</span>
    <h1 id="access-title">Verifica tu acceso</h1>
    <p>Introduce la serie numérica de tu credencial. El servidor valida el acceso y guarda la verificación para este navegador.</p>
    {checking ? <p role="status">Comprobando tu acceso con el servidor…</p> : <form onSubmit={submit}>
      <label htmlFor="d5AccessSeries">Credencial de acceso</label>
      <label htmlFor="d5AccessFile">O carga tu credencial en un archivo de texto</label>
      <input id="d5AccessFile" type="file" accept=".txt,text/plain" disabled={busy} onChange={async e => {
        const file = e.target.files?.[0]; if (!file) return;
        if (file.size > 350000) { setError('El archivo supera el tamaño permitido.'); e.target.value = ''; return; }
        try { setSeries(await file.text()); setError(''); }
        catch { setError('No se pudo leer el archivo.'); }
      }} />
      <textarea ref={input} id="d5AccessSeries" value={series} onChange={e => setSeries(e.target.value)} maxLength={350000} autoComplete="off" spellCheck="false" required disabled={busy} />
      <button id="d5AccessSubmit" type="submit" disabled={busy}>{busy ? 'Validando…' : 'Validar acceso'}</button>
      <button type="button" className="code-access-retry" onClick={check} disabled={busy}>Comprobar acceso guardado</button>
    </form>}
    {error && <p role="alert">{error}</p>}
  </section></div>;
}

function mountCodeAccess() {
  const node = document.getElementById('d5CodeAccessMount');
  if (!node || node.dataset.reactMounted === 'true') return;
  const required = node.dataset.required === '1';
  window.HashcodCodeAccess = Object.freeze({ mounted: true, authorized: !required, required,
    bound: false, mode: required ? 'server-verified-access' : 'open-entry', version: VERSION });
  createRoot(node).render(<CodeAccessGate required={required} />);
  node.dataset.reactMounted = 'true';
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountCodeAccess, { once: true });
else mountCodeAccess();
