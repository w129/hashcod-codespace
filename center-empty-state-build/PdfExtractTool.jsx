import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, useReducedMotion } from 'motion/react';
import { Checkbox } from './animate-ui/checkbox-radix';
import { Progress } from './animate-ui/progress-radix';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from './animate-ui/accordion-radix';
import { PdfPreview } from './FilePreview';
import './tokenization.css';
import './pdf-extract.css';

// Analyze a PDF with OpenDataLoader PDF (server side) and publish a chosen output to Files.
const MAX_BYTES = 25 * 1024 * 1024;
const PREVIEW_CHARS = 20000;
const FORMATS = [
  { id: 'pdf', label: 'Vista visual', ext: 'pdf', mime: 'application/pdf', binary: true }, // annotated PDF, as in OpenDataLoader's own viewer
  { id: 'markdown', label: 'Markdown', ext: 'md', mime: 'text/markdown' },
  { id: 'json', label: 'JSON', ext: 'json', mime: 'application/json' },
  { id: 'html', label: 'HTML', ext: 'html', mime: 'text/html' },
  { id: 'text', label: 'Texto', ext: 'txt', mime: 'text/plain' },
];

export function PdfExtractIcon() {
  return <svg viewBox="0 0 50 50" aria-hidden="true" focusable="false" fill="currentColor" stroke="none"><path d="M 14 10 C 12.128906 10 8.585938 12.070313 2.3125 21.925781 C 1.996094 22.421875 1.929688 23.023438 2.097656 23.574219 C 2.035156 23.707031 2 23.851563 2 24 L 2 39 C 2 40.070313 2.863281 41 3.957031 41 L 19.992188 41 C 21.109375 41 22.125 40.332031 22.605469 39.324219 C 22.617188 39.300781 22.628906 39.277344 22.636719 39.25 L 24.523438 34.324219 C 24.648438 34.066406 24.8125 34 25 34 C 25.1875 34 25.351563 34.066406 25.476563 34.324219 L 27.363281 39.25 C 27.371094 39.277344 27.382813 39.300781 27.394531 39.324219 C 27.875 40.332031 28.890625 41 30.007813 41 L 46.042969 41 C 47.136719 41 48 40.070313 48 39 L 48 24 C 48 23.855469 47.96875 23.714844 47.90625 23.582031 C 48.0625 23.074219 48.015625 22.519531 47.753906 22.042969 C 44.757813 16.550781 40.460938 10 37 10 C 32 10 32 15.269531 32 17 C 32 17.027344 32 17.054688 32 17.082031 C 32.066406 18.65625 33.1875 21 36 21 C 36.496094 21 36.972656 20.851563 37.386719 20.578125 C 37.585938 21.382813 37.773438 22.203125 37.949219 23 L 28.828125 23 C 28.007813 23 27.441406 23.355469 26.941406 23.605469 C 26.445313 23.855469 26.007813 24 25.953125 24 L 24.042969 24 C 23.992188 24 23.554688 23.855469 23.058594 23.605469 C 22.558594 23.355469 21.992188 23 21.171875 23 L 12.121094 23 C 12.441406 22.0625 12.777344 21.097656 13.125 20.171875 C 13.5625 20.6875 14.164063 21 15 21 C 17.8125 21 18.933594 18.65625 19 17.082031 C 19 17.054688 19 17.027344 19 17 C 19 15.269531 19 10 14 10 Z M 14 12 C 17 12 17 15.082031 17 17 C 17 17 16.917969 19 15 19 C 14 19 14 15.582031 14 14 C 13.003906 14 10 23 10 23 L 4 23 C 4 23 11 12 14 12 Z M 37 12 C 40 12 46 23 46 23 L 40 23 C 40 23 38.082031 14 37 14 C 37 15.582031 37.082031 19 36 19 C 34.082031 19 34 17 34 17 C 34 15.082031 34 12 37 12 Z M 4 25 L 21.171875 25 C 21.226563 25 21.660156 25.144531 22.160156 25.394531 C 22.660156 25.644531 23.226563 26 24.042969 26 L 25.953125 26 C 26.773438 26 27.339844 25.644531 27.839844 25.394531 C 28.335938 25.144531 28.773438 25 28.828125 25 L 46 25 L 46 39 L 30.007813 39 C 29.679688 39 29.371094 38.808594 29.203125 38.464844 L 27.316406 33.535156 C 27.308594 33.511719 27.296875 33.484375 27.285156 33.460938 C 26.839844 32.53125 25.910156 32 25 32 C 24.089844 32 23.160156 32.53125 22.714844 33.460938 C 22.703125 33.484375 22.691406 33.511719 22.683594 33.535156 L 20.796875 38.464844 C 20.628906 38.808594 20.320313 39 19.992188 39 L 4 39 Z M 6.976563 27.03125 C 6.421875 27.03125 5.96875 27.464844 5.96875 28 L 5.96875 36.011719 C 5.96875 36.515625 6.476563 37.011719 7 37.011719 L 18 37.011719 C 18.503906 37.011719 18.839844 36.386719 19.03125 36.011719 C 19.960938 33.976563 20.230469 31.71875 21.21875 28.296875 C 21.414063 27.707031 21.261719 27.03125 19.988281 27.03125 Z M 29.972656 27.03125 C 28.699219 27.03125 28.550781 27.707031 28.746094 28.296875 C 29.734375 31.71875 29.996094 33.976563 30.925781 36.011719 C 31.121094 36.386719 31.457031 37.011719 31.964844 37.011719 L 42.964844 37.011719 C 43.484375 37.011719 43.996094 36.515625 43.996094 36.011719 L 43.996094 28 C 43.996094 27.464844 43.539063 27.03125 42.984375 27.03125 Z M 7.96875 29.03125 L 18.9375 29.03125 C 18.722656 29.859375 18.542969 30.609375 18.378906 31.300781 C 18.023438 32.785156 17.738281 33.972656 17.292969 35.011719 L 7.96875 35.011719 Z M 31.023438 29.03125 L 41.996094 29.03125 L 41.996094 35.011719 L 32.671875 35.011719 C 32.222656 33.972656 31.941406 32.785156 31.585938 31.300781 C 31.421875 30.609375 31.242188 29.859375 31.023438 29.03125 Z" /></svg>;
}

function PublishIcon() {
  return <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false" fill="currentColor" stroke="none"><path d="M 8 0 C 3.582 0 0 3.582 0 8 C 0 12.418 3.582 16 8 16 C 12.418 16 16 12.418 16 8 C 16 3.582 12.418 0 8 0 z M 8 3 C 10.761 3 13 5.239 13 8 C 13 10.761 10.761 13 8 13 C 5.239 13 3 10.761 3 8 C 3 5.239 5.239 3 8 3 z M 8 6 A 2 2 0 0 0 8 10 A 2 2 0 0 0 8 6 z" /></svg>;
}

const size = n => (n < 1048576 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1048576).toFixed(1)} MB`);

// Binary outputs (annotated PDF) arrive base64; text outputs arrive as strings.
const toBytes = base64 => Uint8Array.from(atob(base64), ch => ch.charCodeAt(0));
const payload = (format, out) => (format.binary ? toBytes(out.content) : out.content);

const ERRORS = { 413: 'El PDF es demasiado grande (máximo 25 MB).', 429: 'Espera unos segundos antes de analizar otro PDF.' };

export default function PdfExtractTool({ onPublish, onClose }) {
  const [file, setFile] = useState(null);
  const [picked, setPicked] = useState(() => new Set(['pdf', 'markdown', 'json']));
  const [sanitize, setSanitize] = useState(false);
  const [pages, setPages] = useState('');
  const [phase, setPhase] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [result, setResult] = useState(null);
  const [open, setOpen] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const dialog = useRef(null), xhr = useRef(null), creep = useRef(0), alive = useRef(true);
  const reduce = useReducedMotion();
  const running = phase === 'running';

  useEffect(() => () => { alive.current = false; clearInterval(creep.current); xhr.current?.abort(); }, []);
  useEffect(() => { dialog.current?.querySelector('[data-autofocus]')?.focus(); }, []);
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, []);

  const choose = candidate => {
    if (!candidate) return;
    setNotice(''); setError('');
    if (!/\.pdf$/i.test(candidate.name) && candidate.type !== 'application/pdf') { setError('Selecciona un archivo PDF.'); return; }
    if (candidate.size > MAX_BYTES) { setError(ERRORS[413]); return; }
    setFile(candidate); setResult(null); setPhase('idle');
  };

  const toggleFormat = id => setPicked(current => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  function analyze() {
    if (!file || running || !picked.size) return;
    setError(''); setNotice(''); setResult(null); setProgress(0); setPhase('running');
    const form = new FormData();
    form.append('file', file, file.name);
    form.append('formats', FORMATS.filter(f => picked.has(f.id)).map(f => f.id).join(','));
    form.append('sanitize', sanitize ? '1' : '0');
    if (pages.trim()) form.append('pages', pages.trim());
    const request = new XMLHttpRequest();
    xhr.current = request;
    request.open('POST', '/api/pdf-extract', true);
    request.withCredentials = true;
    request.setRequestHeader('Accept', 'application/json');
    request.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    request.timeout = 90000;
    request.upload.onprogress = event => {
      if (event.lengthComputable && alive.current) setProgress(Math.min(60, (event.loaded / event.total) * 60));
    };
    // The server answers once at the end, so the bar creeps toward 90% while it analyzes.
    request.upload.onload = () => { creep.current = setInterval(() => setProgress(p => Math.min(90, p + 3)), 400); };
    const fail = message => {
      clearInterval(creep.current);
      if (!alive.current) return;
      setPhase('idle'); setProgress(0); setError(message);
    };
    request.onerror = () => fail('No se pudo contactar con el servidor.');
    request.ontimeout = () => fail('El análisis tardó demasiado. Intenta con menos páginas.');
    request.onload = () => {
      let data = {};
      try { data = JSON.parse(request.responseText || '{}'); } catch { data = {}; }
      if (request.status < 200 || request.status >= 300 || !data.ok) {
        fail(data.error || ERRORS[request.status] || 'No se pudo analizar este PDF.');
        return;
      }
      clearInterval(creep.current);
      if (!alive.current) return;
      setProgress(100); setResult(data); setPhase('done');
      setOpen(FORMATS.find(f => data.files?.[f.id])?.id || '');
    };
    request.send(form);
  }

  const pdfBlob = useMemo(() => (result?.files?.pdf ? new Blob([toBytes(result.files.pdf.content)], { type: 'application/pdf' }) : null), [result]);
  const current = FORMATS.find(f => f.id === open);
  const base = file ? file.name.replace(/\.pdf$/i, '') || 'documento' : 'documento';

  async function publish() {
    if (!current || !result?.files?.[current.id] || publishing) return;
    const name = `${base}.${current.ext}`;
    setPublishing(true); setNotice(''); setError('');
    try {
      const stored = await onPublish(new File([payload(current, result.files[current.id])], name, { type: current.mime }));
      if (!alive.current) return;
      if (stored) setNotice(`Publicado en Files: ${name}`);
      else setError('No se publicó el archivo. Revisa el aviso de Files e inténtalo de nuevo.');
    } finally { if (alive.current) setPublishing(false); }
  }

  function download(format) {
    const url = URL.createObjectURL(new Blob([payload(format, result.files[format.id])], { type: format.mime }));
    const link = document.createElement('a');
    link.href = url; link.download = `${base}.${format.ext}`;
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return createPortal(<div className="htk-backdrop" onMouseDown={event => { if (event.target === event.currentTarget && !running) onClose(); }}>
    <motion.section ref={dialog} id="d5PdfExtractTool" className="htk-shell hpx" role="dialog" aria-modal="true" aria-labelledby="hpx-title"
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10, scale: .985 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: reduce ? 0 : .2 }}
      onKeyDown={event => { if (event.key === 'Escape' && !running) { event.preventDefault(); onClose(); } }}>
      <header className="htk-header">
        <div className="htk-title-group"><span className="htk-mark"><PdfExtractIcon /></span>
          <div><span className="htk-eyebrow">Hashcod · OpenDataLoader PDF</span><h2 id="hpx-title">Analizar PDF</h2></div></div>
        <div className="hpx-corner">
          <button type="button" className="hpx-publish" aria-label="Publicar en Files" title={current && result ? `Publicar ${current.label} en Files` : 'Analiza un PDF y abre un formato para publicarlo'}
            disabled={!result || !current || publishing || running} onClick={publish}><PublishIcon /></button>
          <button className="htk-icon-button" type="button" aria-label="Cerrar" disabled={running} onClick={onClose}>×</button>
        </div>
      </header>
      {error && <p className="htk-error" role="alert">{error}</p>}
      {notice && <p className="htk-notice" role="status">{notice}</p>}
      <div className="hpx-body">
        <label className={`hpx-drop${dragging ? ' hpx-drop--over' : ''}`} data-autofocus tabIndex={0}
          onDragOver={event => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)}
          onDrop={event => { event.preventDefault(); setDragging(false); if (!running) choose(event.dataTransfer.files?.[0]); }}>
          <input type="file" accept="application/pdf,.pdf" disabled={running} onChange={event => { choose(event.target.files?.[0]); event.target.value = ''; }} />
          {file ? <span><strong>{file.name}</strong><small>{size(file.size)} · toca para cambiar</small></span>
            : <span><strong>Elige o arrastra un PDF</strong><small>Hasta 25 MB. Se analiza y no se guarda.</small></span>}
        </label>
        <fieldset className="hpx-formats" disabled={running}>
          <legend>Formatos de salida</legend>
          {FORMATS.map(f => <label key={f.id} className="hpx-check">
            <Checkbox checked={picked.has(f.id)} onCheckedChange={() => toggleFormat(f.id)} aria-label={f.label} /><span>{f.label}</span></label>)}
        </fieldset>
        <div className="hpx-options">
          <label className="hpx-check"><Checkbox checked={sanitize} onCheckedChange={value => setSanitize(value === true)} disabled={running} aria-label="Ocultar datos sensibles" />
            <span>Ocultar correos, teléfonos y tarjetas</span></label>
          <label className="hpx-pages">Páginas<input type="text" inputMode="numeric" maxLength={60} placeholder="Todas (ej. 1,3,5-7)" disabled={running} value={pages} onChange={event => setPages(event.target.value)} /></label>
        </div>
        {(running || phase === 'done') && <div className="hpx-progress"><Progress value={progress} aria-label="Avance del análisis" />
          <small>{running ? (progress < 60 ? 'Subiendo el PDF…' : 'Extrayendo datos…') : `Listo${result?.pages ? ` · ${result.pages} páginas` : ''}`}</small></div>}
        {result && <Accordion type="single" collapsible value={open} onValueChange={setOpen} className="hpx-results">
          {FORMATS.filter(f => result.files[f.id]).map(f => {
            const out = result.files[f.id];
            return <AccordionItem key={f.id} value={f.id}>
              <AccordionTrigger showArrow>{f.label}<span className="hpx-meta">{size(out.bytes)}</span></AccordionTrigger>
              <AccordionContent keepRendered={false}>
                {out.truncated && <p className="hpx-warn">Resultado recortado a {size(out.content.length)}; descarga o publica solo lo mostrado.</p>}
                {f.binary
                  ? <div className="hpx-visual"><PdfPreview blob={pdfBlob} /></div>
                  : <pre className="hpx-preview" tabIndex={0}>{out.content.slice(0, PREVIEW_CHARS)}{out.content.length > PREVIEW_CHARS ? '\n…' : ''}</pre>}
                <button type="button" className="htk-button" onClick={() => download(f)}>Descargar .{f.ext}</button>
              </AccordionContent>
            </AccordionItem>;
          })}
        </Accordion>}
      </div>
      <footer className="htk-footer">
        <span className="htk-muted">{result ? 'Abre un formato y pulsa el botón ◉ de la esquina para publicarlo en Files.' : 'Extrae texto, tablas y estructura, y muestra el PDF con cada elemento detectado marcado.'}</span>
        <button type="button" className="htk-button htk-button--primary" disabled={!file || running || !picked.size} onClick={analyze}>{running ? 'Analizando…' : 'Analizar'}</button>
      </footer>
    </motion.section>
  </div>, document.body);
}
