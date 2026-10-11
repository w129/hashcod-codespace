import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, useReducedMotion } from 'motion/react';
import { Checkbox } from './animate-ui/checkbox-radix';
import { Progress } from './animate-ui/progress-radix';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from './animate-ui/accordion-radix';
import { PdfPreview } from './FilePreview';
import SealIcon from './SealIcon';
import { merkleRoot, sha512File } from './seal-hash';
import './tokenization.css';
import './pdf-extract.css';
import './seal-tool.css';

// Constancia de integridad de activos de IA: the operator fills the form, the browser hashes the asset locally
// (the file is never uploaded) and the server signs, time-stamps (RFC 3161), registers and renders the PDF + .cod.
// Opening the tool needs an authorized signature (pasted or from a .txt file), checked server side.
const API = '/api/constancia';
const HOLDER_TYPES = { persona_fisica: 'Persona física', persona_juridica: 'Persona jurídica' };
const EMPTY = { holderType: 'persona_fisica', holderName: '', taxId: '', holderDid: '', assetName: '', assetType: 'model', version: '', description: '', aiUse: 'none', visibility: 'public', license: '', declaration: false };
const FIELD_ERRORS = {
  holderName: 'Indica el nombre o la razón social.', assetName: 'Indica el nombre del activo.', version: 'Indica la versión.', declaration: 'Debes aceptar la declaración de autoría.',
  asset: 'Selecciona el archivo del activo.', taxId: 'Cédula/RNC no válido.', holderDid: 'DID no válido (did:web:… o did:key:…).', assetType: 'Tipo no válido.', aiUse: 'Elige el uso de IA.',
};
const GENERATED = ['Número de constancia', 'Hash del activo o raíz Merkle', 'ID de la credencial (urn:uuid)', 'Hora oficial de la TSA (RFC 3161) y hora AST', 'DID del emisor e ID de la llave', 'Firma Ed25519 (eddsa-jcs-2022)', 'Token RFC 3161', 'Huella de la constancia',
  'URL de verificación y QR', 'Semilla del sello visual', 'Versión de la plantilla'];

const size = n => (n < 1048576 ? `${(n / 1024).toFixed(1)} KB` : n < 1073741824 ? `${(n / 1048576).toFixed(1)} MB` : `${(n / 1073741824).toFixed(2)} GB`);
const MISSING = {
  gate: 'las firmas autorizadas (HASHCOD_SEAL_ACCESS_SIGNATURE_SHA256)', issuer: 'la llave del emisor (HASHCOD_SEAL_ED25519_SEED_B64)', tsa: 'la autoridad de sello de tiempo (HASHCOD_TSA_URL)',
  storage: 'las extensiones PHP pdo_sqlite y zip', crypto: 'la extensión PHP sodium', openssl: 'el comando openssl (sello de tiempo RFC 3161)', render: 'Python con reportlab, pypdf y Pillow (generación del PDF)',
};

async function api(path, options) {
  const response = await fetch(API + path, { credentials: 'same-origin', ...options, headers: { ...(options?.json ? { 'Content-Type': 'application/json' } : {}), ...options?.headers }, body: options?.json ? JSON.stringify(options.json) : options?.body });
  const data = await response.json().catch(() => ({}));
  return { status: response.status, data };
}

function Field({ label, error, children, hint, wide }) {
  return <label className={`hst-field${wide ? ' hst-field--wide' : ''}`}><span>{label}</span>{children}{hint && <small>{hint}</small>}{error && <em role="alert">{error}</em>}</label>;
}

export default function SealTool({ onClose }) {
  const [info, setInfo] = useState(null);
  const [unlocked, setUnlocked] = useState(false);
  const [signature, setSignature] = useState('');
  const [tab, setTab] = useState('issue');
  const [form, setForm] = useState(EMPTY);
  const [files, setFiles] = useState([]);              // [{ name, path, size, sha512 }]
  const [hashing, setHashing] = useState(null);        // { done, total } while hashing
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [pdf, setPdf] = useState(null);
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState('');
  const [dragging, setDragging] = useState(false);
  const dialog = useRef(null), alive = useRef(true);
  const reduce = useReducedMotion();

  useEffect(() => () => { alive.current = false; }, []);
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, []);
  useEffect(() => { dialog.current?.querySelector('[data-autofocus]')?.focus(); }, [unlocked, info]);
  useEffect(() => {
    api('/status').then(({ data }) => { if (alive.current && data.ok) { setInfo(data); setUnlocked(!!data.unlocked); } else if (alive.current) setError('No se pudo consultar el estado de la herramienta.'); });
  }, []);

  const missing = info ? Object.entries(info.configured).filter(([, ok]) => !ok).map(([key]) => MISSING[key]) : [];
  const set = (key, value) => { setForm(current => ({ ...current, [key]: value })); setErrors(current => ({ ...current, [key]: undefined })); };
  const root = useMemo(() => (files.length > 1 ? merkleRoot(files.map(f => ({ path: f.path, sha512: f.sha512 }))) : files[0]?.sha512 || ''), [files]);

  const unlock = async text => {
    setBusy(true); setError('');
    const { status, data } = await api('/unlock', { method: 'POST', json: { signature: text } });
    if (!alive.current) return;
    setBusy(false);
    if (data.ok) { setUnlocked(true); setSignature(''); return; }
    setError(status === 429 ? 'Demasiados intentos. Espera unos minutos.' : status === 503 ? 'La herramienta no tiene firmas autorizadas configuradas.' : 'La firma no es válida.');
  };
  const readSignatureFile = async file => {
    if (!file) return;
    if (file.size > 40000) { setError('El archivo de firma es demasiado grande.'); return; }
    unlock(await file.text());
  };

  const addFiles = useCallback(async list => {
    const picked = [...list];
    if (!picked.length) return;
    setError(''); setErrors(current => ({ ...current, asset: undefined }));
    const total = picked.reduce((sum, f) => sum + f.size, 0);
    let done = 0;
    setHashing({ done: 0, total });
    try {
      const added = [];
      for (const file of picked) {
        let base = done;
        const sha = await sha512File(file, bytes => alive.current && setHashing({ done: base + bytes, total }));
        done += file.size;
        added.push({ name: file.name, path: file.webkitRelativePath || file.name, size: file.size, sha512: sha });
      }
      if (alive.current) setFiles(current => {
        const merged = new Map(current.map(f => [f.path, f]));
        added.forEach(f => merged.set(f.path, f));
        return [...merged.values()];
      });
    } catch { if (alive.current) setError('No se pudo leer uno de los archivos.'); }
    if (alive.current) setHashing(null);
  }, []);

  const submit = async event => {
    event.preventDefault();
    const local = {};
    if (form.holderName.trim().length < 2) local.holderName = FIELD_ERRORS.holderName;
    if (!form.assetName.trim()) local.assetName = FIELD_ERRORS.assetName;
    if (!form.version.trim()) local.version = FIELD_ERRORS.version;
    if (!form.declaration) local.declaration = FIELD_ERRORS.declaration;
    if (!files.length) local.asset = FIELD_ERRORS.asset;
    setErrors(local);
    if (Object.keys(local).length) return;
    setBusy(true); setError(''); setResult(null);
    const payload = { ...form, ...(files.length > 1 ? { manifest: files.map(f => ({ path: f.path, sha512: f.sha512 })) } : { digest: files[0].sha512 }) };
    const { status, data } = await api('/seal', { method: 'POST', json: payload });
    if (!alive.current) return;
    setBusy(false);
    if (data.ok) { setResult(data); loadPdf(data.number); return; }
    if (status === 401) { setUnlocked(false); setError('La sesión de firma expiró. Introduce la firma otra vez.'); return; }
    if (data.fields) setErrors(Object.fromEntries(Object.keys(data.fields).map(key => [key, FIELD_ERRORS[key] || 'Revisa este campo.'])));
    setError(data.error || 'No se pudo emitir la constancia.');
  };

  async function loadPdf(number) {
    setPdf(null);
    try {
      const response = await fetch(`${API}/file/${number}.pdf?inline=1`, { credentials: 'same-origin' });
      if (response.ok && alive.current) setPdf(await response.blob());
    } catch { /* the download buttons still work */ }
  }
  const download = number => ext => {
    const link = document.createElement('a');
    link.href = `${API}/file/${number}.${ext}`; link.download = '';
    document.body.appendChild(link); link.click(); link.remove();
  };
  const reset = () => { setResult(null); setPdf(null); setForm(EMPTY); setFiles([]); setErrors({}); setError(''); };

  const loadList = useCallback(async (retries = 2) => {
    const { status, data } = await api('/list');
    if (!alive.current) return;
    if (status === 401) { setUnlocked(false); return; }
    if (status === 429 && retries > 0) { setTimeout(() => alive.current && loadList(retries - 1), 6000); return; } // platform rate limit: try again shortly
    if (data.ok) setItems(data.items);
  }, []);
  useEffect(() => { if (unlocked && tab === 'list') loadList(); }, [unlocked, tab, loadList]);
  const revoke = async number => {
    const reason = window.prompt(`Motivo de la revocación de ${number}:`);
    if (!reason) return;
    const { status, data } = await api('/revoke', { method: 'POST', json: { number, reason } });
    if (!data.ok) setError(status === 429 ? 'Demasiadas solicitudes seguidas. Espera unos segundos e inténtalo de nuevo.' : data.error || 'No se pudo revocar.');
    else setError('');
    loadList();
  };

  const stop = hashing || busy;
  useEffect(() => {
    const onKey = event => { if (event.key === 'Escape' && !stop) onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [stop, onClose]);
  return createPortal(<div className="htk-backdrop" onMouseDown={event => { if (event.target === event.currentTarget && !stop) onClose(); }}>
    <motion.section ref={dialog} id="d5SealTool" className="htk-shell htk-shell--wide hpx hst" role="dialog" aria-modal="true" aria-labelledby="hst-title"
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10, scale: .985 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: reduce ? 0 : .2 }}
      >
      <header className="htk-header">
        <div className="htk-title-group"><span className="htk-mark"><SealIcon /></span>
          <div><span className="htk-eyebrow">Hashcod · PSOT</span><h2 id="hst-title">Constancia de integridad de activos</h2></div></div>
        <button className="htk-icon-button" type="button" aria-label="Cerrar" disabled={stop} onClick={onClose}>×</button>
      </header>
      {error && <p className="htk-error" role="alert">{error}</p>}

      {!info && !error && <p className="htk-muted hst-pad" role="status">Cargando…</p>}

      {info && !unlocked && <div className="hst-body hst-gate">
        <h3>Introduce tu firma</h3>
        <p className="htk-muted">Para entrar en esta herramienta pega tu firma o súbela en un archivo de texto. Se comprueba en el servidor y no se guarda.</p>
        {missing.length > 0 && <p className="htk-notice" role="status">Falta configurar en el servidor: {missing.join('; ')}.</p>}
        <textarea data-autofocus className="hst-signature" rows={5} spellCheck={false} autoComplete="off" placeholder="Pega aquí la firma (base64)" aria-label="Firma"
          value={signature} onChange={event => setSignature(event.target.value)} />
        <div className="hst-actions">
          <label className="htk-button hst-file">Subir archivo .txt<input type="file" accept=".txt,text/plain" disabled={busy} onChange={event => { readSignatureFile(event.target.files?.[0]); event.target.value = ''; }} /></label>
          <button type="button" className="htk-button htk-button--primary" disabled={busy || signature.trim().length < 64} onClick={() => unlock(signature)}>{busy ? 'Comprobando…' : 'Entrar'}</button>
        </div>
      </div>}

      {info && unlocked && <>
        <div className="hst-tabs" role="tablist" aria-label="Constancias">
          <button type="button" role="tab" aria-selected={tab === 'issue'} onClick={() => setTab('issue')}>Emitir constancia</button>
          <button type="button" role="tab" aria-selected={tab === 'list'} onClick={() => setTab('list')}>Emitidas</button>
        </div>

        {tab === 'issue' && !result && <form className="hst-body" onSubmit={submit} noValidate>
          {missing.length > 0 && <p className="htk-notice" role="status">El servidor aún no puede emitir: falta {missing.join('; ')}.</p>}
          <fieldset className="hst-grid" disabled={busy || !!hashing}>
            <legend>Titular</legend>
            <Field label="Tipo de titular"><select value={form.holderType} onChange={e => set('holderType', e.target.value)}>{Object.entries(HOLDER_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
            <Field label="Nombre o razón social *" error={errors.holderName}><input data-autofocus maxLength={200} value={form.holderName} onChange={e => set('holderName', e.target.value)} /></Field>
            <Field label="Cédula / RNC" error={errors.taxId} hint="Se guarda cifrada en la base de datos. No se imprime en la constancia."><input maxLength={20} inputMode="numeric" autoComplete="off" value={form.taxId} onChange={e => set('taxId', e.target.value)} /></Field>
            <Field label="DID del titular (opcional)" error={errors.holderDid} hint="did:web para empresas, did:key para personas."><input maxLength={200} placeholder="did:web:empresa.do" value={form.holderDid} onChange={e => set('holderDid', e.target.value)} /></Field>
          </fieldset>
          <fieldset className="hst-grid" disabled={busy || !!hashing}>
            <legend>Activo</legend>
            <Field label="Nombre del activo *" error={errors.assetName}><input maxLength={200} value={form.assetName} onChange={e => set('assetName', e.target.value)} /></Field>
            <Field label="Tipo de activo"><select value={form.assetType} onChange={e => set('assetType', e.target.value)}>{Object.entries(info.assetTypes).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
            <Field label="Versión *" error={errors.version}><input maxLength={60} value={form.version} onChange={e => set('version', e.target.value)} /></Field>
            <Field label="Licencia (opcional)"><input maxLength={80} value={form.license} onChange={e => set('license', e.target.value)} /></Field>
            <Field label="Descripción breve (opcional, va en el anexo)" wide><textarea rows={2} maxLength={500} value={form.description} onChange={e => set('description', e.target.value)} /></Field>
          </fieldset>
          <fieldset className="hst-grid" disabled={busy || !!hashing}>
            <legend>Archivo(s) del activo</legend>
            <div className={`hst-drop hst-field--wide${dragging ? ' hst-drop--over' : ''}`} tabIndex={0}
              onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)}
              onDrop={e => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}>
              <label><input type="file" multiple onChange={e => { addFiles(e.target.files); e.target.value = ''; }} />
                <strong>Elige o arrastra el/los archivo(s)</strong>
                <small>El hash se calcula aquí, en tu navegador: el archivo nunca se sube al servidor. Varios archivos forman un árbol Merkle.</small></label>
            </div>
            {hashing && <div className="hst-field--wide"><Progress value={Math.round(hashing.done * 100 / Math.max(1, hashing.total))} aria-label="Calculando hash" /><small>Calculando SHA-512… {size(hashing.done)} de {size(hashing.total)}</small></div>}
            {errors.asset && <em className="hst-field--wide" role="alert">{errors.asset}</em>}
            {files.length > 0 && <ul className="hst-files hst-field--wide">
              {files.map(f => <li key={f.path}><span>{f.path}</span><small>{size(f.size)}</small><code>{f.sha512.slice(0, 20)}…</code>
                <button type="button" aria-label={`Quitar ${f.path}`} onClick={() => setFiles(current => current.filter(x => x.path !== f.path))}>×</button></li>)}
            </ul>}
            {root && <p className="hst-root hst-field--wide"><b>{files.length > 1 ? 'Raíz Merkle (SHA-512)' : 'Hash del activo (SHA-512)'}</b><code>{root}</code></p>}
          </fieldset>
          <fieldset className="hst-grid" disabled={busy || !!hashing}>
            <legend>Declaración</legend>
            <Field label="Uso de IA en la creación"><select value={form.aiUse} onChange={e => set('aiUse', e.target.value)}>{Object.entries(info.aiUse).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
            <Field label="Visibilidad en la página de verificación"><select value={form.visibility} onChange={e => set('visibility', e.target.value)}><option value="public">Pública</option><option value="private">Privada</option></select></Field>
            <label className="hst-check hst-field--wide"><Checkbox checked={form.declaration} onCheckedChange={value => set('declaration', value === true)} aria-label="Declaración de autoría" />
              <span><b>Declaración de autoría *</b><br />{info.declaration}</span></label>
            {errors.declaration && <em className="hst-field--wide" role="alert">{errors.declaration}</em>}
          </fieldset>
          <Accordion type="single" collapsible value={open} onValueChange={setOpen} className="hpx-results">
            <AccordionItem value="generated">
              <AccordionTrigger showArrow>Lo que genera la herramienta (no editable)</AccordionTrigger>
              <AccordionContent keepRendered={false}><ul className="hst-generated">{GENERATED.map(item => <li key={item}>{item}</li>)}</ul>
                <p className="htk-muted">Emisor: {info.issuerDid}#{info.keyId} · plantilla {info.template}</p></AccordionContent>
            </AccordionItem>
          </Accordion>
          <div className="hst-actions"><button type="submit" className="htk-button htk-button--primary" disabled={busy || !!hashing}>{busy ? 'Firmando y sellando…' : 'Emitir constancia'}</button></div>
        </form>}

        {tab === 'issue' && result && <div className="hst-body">
          <p className="htk-notice" role="status">Constancia <b>{result.number}</b> emitida y marcada como vigente.</p>
          <dl className="hst-result">
            <dt>Sello temporal (UTC)</dt><dd>{result.genTimeUtc}</dd><dt>Hora AST</dt><dd>{result.genTimeAst}</dd>
            <dt>{result.merkleRoot ? 'Raíz Merkle' : 'Hash del activo'}</dt><dd className="hst-mono">{result.digest}</dd>
            <dt>Huella de la constancia</dt><dd className="hst-mono">{result.fingerprint}</dd>
            <dt>Verificación</dt><dd><a href={result.verifyUrl.replace(/^https:\/\/[^/]+/, '')} target="_blank" rel="noreferrer">{result.verifyUrl}</a></dd>
          </dl>
          <div className="hst-actions"><button type="button" className="htk-button htk-button--primary" onClick={() => download(result.number)('pdf')}>Descargar PDF</button>
            <button type="button" className="htk-button" onClick={() => download(result.number)('cod')}>Descargar .cod</button>
            <button type="button" className="htk-button" onClick={reset}>Nueva constancia</button></div>
          <div className="hst-sheet">{pdf ? <PdfPreview blob={pdf} /> : <p className="htk-muted" role="status">Preparando la vista previa…</p>}</div>
        </div>}

        {tab === 'list' && <div className="hst-body">
          {items.length === 0 ? <p className="htk-muted" role="status">Aún no hay constancias emitidas.</p> : <ul className="hst-list">
            {items.map(item => <li key={item.number}>
              <div><b>{item.number}</b> <span className={`hst-badge hst-badge--${item.status}`}>{item.status}</span><br />{item.asset_name} · v{item.version} · {item.holder_name}<br /><small>{item.tsa_gen_time} · {item.visibility === 'public' ? 'pública' : 'privada'}</small></div>
              <div className="hst-actions"><button type="button" className="htk-button" onClick={() => download(item.number)('pdf')}>PDF</button>
                <button type="button" className="htk-button" onClick={() => download(item.number)('cod')}>.cod</button>
                {item.status === 'vigente' && <button type="button" className="htk-button" onClick={() => revoke(item.number)}>Revocar</button>}</div>
            </li>)}
          </ul>}
        </div>}
      </>}
      <footer className="htk-footer"><span className="htk-muted">Credencial W3C firmada (Ed25519) con sello de tiempo RFC 3161. Verificable en línea y con <code>hcod verify</code>.</span></footer>
    </motion.section>
  </div>, document.body);
}
