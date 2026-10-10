import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, useReducedMotion } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Checkbox } from './animate-ui/checkbox-radix';
import { Progress } from './animate-ui/progress-radix';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from './animate-ui/accordion-radix';
import { pdfEngine } from './FilePreview';
import NotebookIcon from './NotebookIcon';
import './tokenization.css';
import './pdf-extract.css';
import './notebook.css';

// Cuaderno de IA (Toolbook 1-1). Ideas adapted from Open Notebook (MIT): chat grounded on chosen sources
// with citations, one-click transformations, notes, and a user-chosen model. The API key is sent once to
// /api/notebook-ai/key, which keeps it sealed in an HttpOnly cookie; this component never stores or re-reads it.
const MAX_SOURCES = 8;
const MAX_SOURCE_CHARS = 60000;
const MAX_TOTAL_CHARS = 150000;
const PDF_PAGE_LIMIT = 80;
const TEXT_EXT = /^(txt|md|markdown|csv|tsv|json|xml|html?|log|ya?ml|ini|toml|js|ts|jsx|tsx|py|php|java|c|cpp|go|rs|sql|css)$/;

const PROVIDERS = {
  anthropic: { label: 'Anthropic', model: 'claude-sonnet-5-5', models: ['claude-sonnet-5-5', 'claude-haiku-5-5', 'claude-opus-5-5'], hint: 'sk-ant-…' },
  openai: { label: 'OpenAI', model: 'gpt-4o-mini', models: ['gpt-4o-mini', 'gpt-4o'], hint: 'sk-…' },
  openrouter: { label: 'OpenRouter (cientos de modelos)', model: 'openai/gpt-4o-mini', models: ['openai/gpt-4o-mini', 'anthropic/claude-sonnet-5-5', 'google/gemini-2.0-flash-001'], hint: 'sk-or-…' },
};
const TRANSFORMS = [
  { id: 'summary', label: 'Resumen' },
  { id: 'keypoints', label: 'Puntos clave' },
  { id: 'study', label: 'Guía de estudio' },
  { id: 'glossary', label: 'Glosario' },
];

const kb = n => (n < 1048576 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1048576).toFixed(1)} MB`);

async function pdfText(blob) {
  const engine = await pdfEngine();
  const task = engine.load(new Uint8Array(await blob.arrayBuffer()));
  try {
    const doc = await task.promise;
    let text = '';
    for (let n = 1; n <= Math.min(doc.numPages, PDF_PAGE_LIMIT) && text.length < MAX_SOURCE_CHARS; n += 1) {
      const content = await (await doc.getPage(n)).getTextContent();
      text += content.items.map(item => item.str).join(' ') + '\n\n';
    }
    return text;
  } finally { task.destroy?.().catch?.(() => {}); }
}

// Turns a verified file blob into plain text, or throws a user-facing reason.
async function extractText(file, blob) {
  const ext = String(file.name || '').split('.').pop().toLowerCase();
  let text;
  if (ext === 'pdf' || blob.type === 'application/pdf') text = await pdfText(blob);
  else if (TEXT_EXT.test(ext) || blob.type.startsWith('text/')) {
    text = await blob.text();
    if (/^html?$/.test(ext)) text = new DOMParser().parseFromString(text, 'text/html').body.textContent || '';
  } else throw new Error('Formato no compatible (usa PDF, texto, Markdown, CSV, JSON o HTML).');
  text = text.replace(/\n{3,}/g, '\n\n').trim();
  if (!text) throw new Error('No se encontró texto en este archivo (¿es un PDF escaneado?).');
  return { text: text.slice(0, MAX_SOURCE_CHARS), truncated: text.length > MAX_SOURCE_CHARS };
}

async function api(path, options = {}) {
  const response = await fetch('/api/notebook-ai/' + path, {
    credentials: 'same-origin', cache: 'no-store', ...options,
    headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest', ...(options.body ? { 'Content-Type': 'application/json' } : {}) },
  });
  let data = {};
  try { data = await response.json(); } catch { data = {}; }
  if (!response.ok || !data.ok) throw Object.assign(new Error(data.error || 'No se pudo completar la solicitud.'), { code: data.code, status: response.status });
  return data;
}

export default function NotebookTool({ files, loading, onRefresh, onPublish, onClose }) {
  const [status, setStatus] = useState(null);
  const [provider, setProvider] = useState('anthropic');
  const [model, setModel] = useState(PROVIDERS.anthropic.model);
  const [apiKey, setApiKey] = useState('');
  const [consent, setConsent] = useState(false);
  const [open, setOpen] = useState(['ai']);
  const [sources, setSources] = useState({});
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [now, setNow] = useState(() => Date.now());
  const dialog = useRef(null), alive = useRef(true), end = useRef(null);
  const reduce = useReducedMotion();

  useEffect(() => () => { alive.current = false; }, []);
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, []);
  useEffect(() => {
    api('status').then(data => {
      if (!alive.current) return;
      setStatus(data);
      if (data.configured) setOpen(['sources']);
    }).catch(() => { if (alive.current) setStatus({ configured: false }); });
    onRefresh?.();
  }, []);
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(timer); }, []);
  useEffect(() => { end.current?.scrollIntoView?.({ block: 'end' }); }, [messages, busy]);

  const ready = Object.entries(sources).filter(([, s]) => s.status === 'ready');
  const chars = ready.reduce((sum, [, s]) => sum + s.text.length, 0);
  const configured = Boolean(status?.configured);
  const minutes = status?.expiresAt ? Math.max(0, Math.round((status.expiresAt * 1000 - now) / 60000)) : 0;
  const canAsk = configured && ready.length > 0 && !busy;

  const pickProvider = next => { setProvider(next); setModel(PROVIDERS[next].model); };

  async function saveKey(event) {
    event.preventDefault();
    if (busy || !apiKey.trim() || !consent) return;
    const key = apiKey.trim();
    setApiKey(''); // the key leaves component state as soon as it is submitted
    setBusy(true); setError(''); setNotice('');
    try {
      const data = await api('key', { method: 'POST', body: JSON.stringify({ provider, model: model.trim(), apiKey: key, consent: true }) });
      if (!alive.current) return;
      setStatus({ ok: true, configured: true, provider: data.provider, model: data.model, expiresAt: data.expiresAt });
      setConsent(false); setOpen(['sources']); setNotice('Clave validada y guardada de forma segura por 30 minutos.');
    } catch (reason) { if (alive.current) setError(reason.message); }
    finally { if (alive.current) setBusy(false); }
  }

  async function forgetKey() {
    setBusy(true); setError(''); setNotice('');
    try {
      await api('key', { method: 'DELETE' });
      if (alive.current) { setStatus({ configured: false }); setOpen(['ai']); setNotice('Clave eliminada.'); }
    } catch (reason) { if (alive.current) setError(reason.message); }
    finally { if (alive.current) setBusy(false); }
  }

  async function toggleSource(file, checked) {
    if (!checked) { setSources(current => { const next = { ...current }; delete next[file.id]; return next; }); return; }
    if (Object.keys(sources).length >= MAX_SOURCES) { setError(`Máximo ${MAX_SOURCES} fuentes a la vez.`); return; }
    setError('');
    setSources(current => ({ ...current, [file.id]: { status: 'loading', text: '' } }));
    try {
      const vault = window.HashcodFileVaultTotp;
      if (!vault?.preview) throw new Error('La verificación de archivos no está lista. Recarga la página.');
      const blob = await vault.preview(file); // asks for the file code
      if (!blob) throw Object.assign(new Error(''), { cancelled: true });
      const result = await extractText(file, blob);
      if (alive.current) setSources(current => (current[file.id] ? { ...current, [file.id]: { status: 'ready', ...result } } : current));
    } catch (reason) {
      if (!alive.current) return;
      if (reason.cancelled) { setSources(current => { const next = { ...current }; delete next[file.id]; return next; }); return; }
      setSources(current => ({ ...current, [file.id]: { status: 'error', text: '', error: reason.message || 'No se pudo leer el archivo.' } }));
    }
  }

  async function ask(body, userLabel) {
    if (!canAsk) return;
    if (chars > MAX_TOTAL_CHARS) { setError('Hay demasiado texto seleccionado. Quita alguna fuente.'); return; }
    const payload = { ...body, sources: ready.map(([id, s]) => ({ title: files.find(f => String(f.id) === String(id))?.name || 'Fuente', text: s.text })),
      history: messages.slice(-8).map(m => ({ role: m.role, content: m.content })) };
    setBusy(true); setError(''); setNotice('');
    setMessages(current => [...current, { role: 'user', content: userLabel }]);
    try {
      const data = await api('chat', { method: 'POST', body: JSON.stringify(payload) });
      if (!alive.current) return;
      setMessages(current => [...current, { role: 'assistant', content: data.answer, sources: data.sources }]);
      setStatus(current => ({ ...current, expiresAt: data.expiresAt }));
    } catch (reason) {
      if (!alive.current) return;
      setError(reason.message);
      if (reason.code === 'no_key' || reason.code === 'key_rejected') { setStatus({ configured: false }); setOpen(['ai']); }
    } finally { if (alive.current) setBusy(false); }
  }

  function submit(event) {
    event.preventDefault();
    const text = input.trim();
    if (!text || !canAsk) return;
    setInput('');
    ask({ mode: 'chat', message: text }, text);
  }

  async function saveNote(message, index) {
    const stamp = new Date().toISOString().slice(0, 10);
    const stored = await onPublish(new File([message.content], `nota-cuaderno-${stamp}-${index + 1}.md`, { type: 'text/markdown' }));
    if (!alive.current) return;
    if (stored) setNotice('Nota guardada en Files.'); else setError('No se guardó la nota. Revisa el aviso de Files e inténtalo de nuevo.');
  }

  const used = Math.min(100, Math.round((chars / MAX_TOTAL_CHARS) * 100));

  return createPortal(<div className="htk-backdrop" onMouseDown={event => { if (event.target === event.currentTarget && !busy) onClose(); }}>
    <motion.section ref={dialog} id="d5NotebookTool" className="htk-shell hpx hnb" role="dialog" aria-modal="true" aria-labelledby="hnb-title"
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10, scale: .985 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: reduce ? 0 : .2 }}
      onKeyDown={event => { if (event.key === 'Escape' && !busy) { event.preventDefault(); onClose(); } }}>
      <header className="htk-header">
        <div className="htk-title-group"><span className="htk-mark"><NotebookIcon /></span>
          <div><span className="htk-eyebrow">Hashcod · Toolbook</span><h2 id="hnb-title">Cuaderno de IA</h2></div></div>
        <button className="htk-icon-button" type="button" aria-label="Cerrar" disabled={busy} onClick={onClose}>×</button>
      </header>
      {error && <p className="htk-error" role="alert">{error}</p>}
      {notice && <p className="htk-notice" role="status">{notice}</p>}
      <div className="hnb-body">
        <Accordion type="multiple" value={open} onValueChange={setOpen} className="hnb-panels">
          <AccordionItem value="ai">
            <AccordionTrigger showArrow>Modelo de IA<span className="hpx-meta">{configured ? `${PROVIDERS[status.provider]?.label.split(' ')[0] || status.provider} · ${status.model} · ${minutes} min` : 'Sin conectar'}</span></AccordionTrigger>
            <AccordionContent keepRendered={false}>
              <form className="hnb-form" onSubmit={saveKey} autoComplete="off">
                <label>Proveedor<select value={provider} disabled={busy} onChange={event => pickProvider(event.target.value)}>
                  {Object.entries(PROVIDERS).map(([id, p]) => <option key={id} value={id}>{p.label}</option>)}</select></label>
                <label>Modelo<input list="hnb-models" value={model} maxLength={100} disabled={busy} spellCheck={false} onChange={event => setModel(event.target.value)} />
                  <datalist id="hnb-models">{PROVIDERS[provider].models.map(m => <option key={m} value={m} />)}</datalist></label>
                <label>Clave de API<input type="password" autoComplete="off" spellCheck={false} maxLength={400} placeholder={PROVIDERS[provider].hint} value={apiKey} disabled={busy} onChange={event => setApiKey(event.target.value)} /></label>
                <label className="hpx-check hnb-consent"><Checkbox checked={consent} onCheckedChange={value => setConsent(value === true)} disabled={busy} aria-label="Consentimiento" />
                  <span>Autorizo enviar el texto de las fuentes que elija al proveedor seleccionado. La clave se cifra y se guarda 30 minutos en este navegador; no se muestra de nuevo. Las llamadas consumen mi cuota. <a href="/privacy#dpa-ia" target="_blank" rel="noopener noreferrer">Uso y privacidad</a>.</span></label>
                <div className="hnb-actions">
                  <button type="submit" className="htk-button htk-button--primary" disabled={busy || !apiKey.trim() || !consent || !model.trim()}>{busy ? 'Validando…' : 'Validar y guardar clave'}</button>
                  {configured && <button type="button" className="htk-button" disabled={busy} onClick={forgetKey}>Eliminar clave</button>}
                </div>
              </form>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="sources">
            <AccordionTrigger showArrow>Fuentes de Files<span className="hpx-meta">{ready.length}/{MAX_SOURCES} listas</span></AccordionTrigger>
            <AccordionContent keepRendered={false}>
              <ul className="hnb-sources">
                {files.map(file => {
                  const source = sources[file.id];
                  return <li key={file.id}><label className="hpx-check"><Checkbox checked={Boolean(source)} onCheckedChange={value => toggleSource(file, value === true)} disabled={busy || source?.status === 'loading'} aria-label={`Usar ${file.name}`} />
                    <span className="hnb-file"><strong title={file.name}>{file.name}</strong><small>{kb(file.size || 0)}{source?.status === 'loading' ? ' · leyendo…' : source?.status === 'ready' ? ` · ${source.text.length.toLocaleString('es-DO')} caracteres${source.truncated ? ' (recortado)' : ''}` : ''}{source?.status === 'error' ? ` · ${source.error}` : ''}</small></span></label></li>;
                })}
              </ul>
              {loading && <p className="htk-muted">Cargando archivos…</p>}
              {!loading && !files.length && <p className="htk-muted">Todavía no hay archivos. Sube uno desde Files para analizarlo.</p>}
              <div className="hnb-meter"><Progress value={used} aria-label="Contexto usado" /><small>Contexto: {used} % del límite</small></div>
              <p className="htk-muted">Al elegir un archivo se te pedirá su código; el texto se lee en tu navegador y solo se envía al modelo al preguntar.</p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        <div className="hnb-transforms" role="group" aria-label="Transformaciones">
          {TRANSFORMS.map(t => <button key={t.id} type="button" className="htk-button" disabled={!canAsk} onClick={() => ask({ mode: 'transform', transform: t.id }, t.label)}>{t.label}</button>)}
        </div>
        <div className="hnb-chat" role="log" aria-live="polite" aria-label="Conversación">
          {!messages.length && <p className="htk-muted hnb-empty">{configured ? (ready.length ? 'Pregunta algo sobre tus fuentes o usa una transformación.' : 'Elige al menos una fuente de Files.') : 'Conecta tu clave de API para empezar.'}</p>}
          {messages.map((message, index) => message.role === 'user'
            ? <div key={index} className="hnb-msg hnb-msg--user">{message.content}</div>
            : <div key={index} className="hnb-msg hnb-msg--ai">
              <div className="hnb-md"><ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown></div>
              <div className="hnb-msg-foot"><small>{message.sources.map((title, n) => `[${n + 1}] ${title}`).join(' · ')}</small>
                <button type="button" className="htk-button" disabled={busy} onClick={() => saveNote(message, index)}>Guardar nota en Files</button></div>
            </div>)}
          {busy && <div className="hnb-msg hnb-msg--ai hnb-thinking"><Progress value={60} aria-label="Pensando" /></div>}
          <span ref={end} />
        </div>
      </div>
      <form className="htk-footer hnb-ask" onSubmit={submit}>
        <textarea rows={2} maxLength={4000} placeholder={canAsk ? 'Pregunta sobre tus fuentes…' : 'Conecta la IA y elige fuentes para preguntar'} value={input} disabled={!canAsk}
          onChange={event => setInput(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); submit(event); } }} />
        <button type="submit" className="htk-button htk-button--primary" disabled={!canAsk || !input.trim()}>Enviar</button>
      </form>
    </motion.section>
  </div>, document.body);
}
