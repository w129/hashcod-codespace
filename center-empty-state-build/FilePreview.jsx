import { FileValueBadge } from "./FileValue.jsx";
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, useReducedMotion } from 'motion/react';
import { XIcon, DownloadIcon, Trash2Icon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';

let engineRequest;
export function pdfEngine() {
  if (window.HashcodFileVaultPdf) return Promise.resolve(window.HashcodFileVaultPdf);
  if (engineRequest) return engineRequest;
  engineRequest = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    const timer = window.setTimeout(() => finish(new Error('PDF viewer unavailable.')), 20000);
    function finish(error) {
      window.clearTimeout(timer);
      if (error || !window.HashcodFileVaultPdf) { script.remove(); engineRequest = null; reject(error || new Error('PDF viewer unavailable.')); }
      else resolve(window.HashcodFileVaultPdf);
    }
    script.src = '/components/file-vault-pdf.bundle.js?v=20261010-upsert-polyfill1';
    script.onload = () => finish();
    script.onerror = () => finish(new Error('PDF viewer unavailable.'));
    document.head.appendChild(script);
  });
  return engineRequest;
}

export function PdfPreview({ blob }) {
  const [pdf, setPdf] = useState(null);
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const canvas = useRef(null);
  useEffect(() => {
    let stopped = false, task;
    (async () => {
      const engine = await pdfEngine();
      const bytes = new Uint8Array(await blob.arrayBuffer());
      if (stopped) return;
      task = engine.load(bytes);
      const document = await task.promise;
      if (!stopped) setPdf(document);
    })().catch(() => { if (!stopped) { setError('Could not render this PDF. You can download it with your file code.'); setBusy(false); } });
    return () => { stopped = true; task?.destroy()?.catch?.(() => {}); };
  }, [blob]);
  useEffect(() => {
    if (!pdf) return;
    let stopped = false, render;
    setBusy(true);
    (async () => {
      const source = await pdf.getPage(page);
      if (stopped) return;
      const natural = source.getViewport({ scale: 1 });
      const viewport = source.getViewport({ scale: Math.min(1.5, 900 / natural.width) });
      const density = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(8000000 / (viewport.width * viewport.height)), 16000 / Math.max(viewport.width, viewport.height));
      const element = canvas.current;
      element.width = Math.max(1, Math.floor(viewport.width * density));
      element.height = Math.max(1, Math.floor(viewport.height * density));
      render = source.render({ canvas: element, canvasContext: element.getContext('2d'), viewport,
        transform: [density, 0, 0, density, 0, 0] });
      await render.promise;
      if (!stopped) setBusy(false);
    })().catch(() => { if (!stopped) { setError('Could not render this page. You can download the original file.'); setBusy(false); } });
    return () => { stopped = true; render?.cancel(); };
  }, [pdf, page]);
  return <div className="hfv-pdf-viewer">
    <div className="hfv-pdf-toolbar">
      <button type="button" aria-label="Previous page" disabled={!pdf || page <= 1 || busy} onClick={() => setPage(value => value - 1)}><ChevronLeftIcon /></button>
      <span>{pdf ? `Page ${page} of ${pdf.numPages}` : 'Loading PDF…'}</span>
      <button type="button" aria-label="Next page" disabled={!pdf || page >= pdf.numPages || busy} onClick={() => setPage(value => value + 1)}><ChevronRightIcon /></button>
    </div>
    {error ? <p role="status">{error}</p> : <><canvas ref={canvas} aria-label={'PDF page ' + page} />{busy && <span className="hfv-preview-loading" role="status">Loading page…</span>}</>}
  </div>;
}

function previewKind(file) {
  const ext = String(file.name || '').split('.').pop().toLowerCase();
  if (ext === 'pdf' || file.type === 'application/pdf') return 'pdf';
  if (/^(png|jpe?g|gif|webp|avif|bmp|ico)$/.test(ext)) return 'image';
  if (/^(mp4|webm|mov|m4v|ogv)$/.test(ext)) return 'video';
  if (/^(mp3|wav|ogg|m4a|flac|aac|opus)$/.test(ext)) return 'audio';
  if (String(file.type || '').startsWith('text/') || /^(txt|md|csv|json|yaml|yml|xml|html?|svg|css|js|jsx|ts|tsx|py|java|c|cpp|h|cs|go|rs|php|sh|sql|log|ini|toml)$/.test(ext)) return 'text';
  return 'other';
}

export default function FilePreview({ file, blob, onClose, onDownload, onDelete }) {
  const kind = previewKind(file);
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [failed, setFailed] = useState(false);
  const dialog = useRef(null);
  const reduce = useReducedMotion();
  useEffect(() => {
    let active = true, objectUrl;
    if (kind === 'text') blob.slice(0, 2 * 1024 * 1024).text().then(value => { if (active) setText(value); }).catch(() => { if (active) setFailed(true); });
    else if (['image', 'video', 'audio'].includes(kind)) { objectUrl = URL.createObjectURL(blob); setUrl(objectUrl); }
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [blob, kind]);
  useEffect(() => {
    const previous = document.activeElement;
    dialog.current?.focus();
    const onKey = event => {
      if (document.querySelector('form.hfv-totp-dialog')) return;
      if (event.key === 'Escape') { event.preventDefault(); event.stopImmediatePropagation(); onClose(); }
      if (event.key === 'Tab') {
        const items = Array.from(dialog.current?.querySelectorAll('button:not([disabled]), [controls]') || []);
        const first = items[0], last = items.at(-1);
        if (first && (!dialog.current?.contains(document.activeElement) || (!event.shiftKey && document.activeElement === last) || (event.shiftKey && document.activeElement === first))) {
          event.preventDefault(); (event.shiftKey ? last : first).focus();
        }
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => { document.removeEventListener('keydown', onKey, true); if (previous?.isConnected) previous.focus?.(); };
  }, [onClose]);
  return createPortal(
    <div className="hfv-preview-backdrop" onMouseDown={event => { if (event.currentTarget === event.target) onClose(); }}>
      <motion.section id="d5FilePreview" ref={dialog} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="hfvPreviewTitle"
        className="hfv-preview" data-preview-kind={kind} initial={reduce ? false : { opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}>
        <header><div><h2 id="hfvPreviewTitle" title={file.name}>{file.name}</h2><small>{file.cloud ? 'Cloud' : 'Device'} · {(blob.size / 1024).toFixed(1)} KB</small><FileValueBadge cents={file.priceUsdCents} /></div>
          <div className="hfv-preview-actions">
            <button type="button" aria-label="Download file" title="Download" onClick={() => void onDownload(file)}><DownloadIcon /></button>
            <button type="button" aria-label="Delete file" title="Delete" onClick={() => void onDelete(file)}><Trash2Icon /></button>
            <button type="button" aria-label="Close preview" title="Close" data-hfv-preview-close onClick={onClose}><XIcon /></button>
          </div>
        </header>
        <div className="hfv-preview-content">
          {failed || kind === 'other' ? <div className="hfv-preview-unavailable"><p>This file format has no browser preview.</p><small>You can download the original with its file code.</small></div> :
            kind === 'pdf' ? <PdfPreview blob={blob} /> :
            kind === 'text' ? <><pre>{text}</pre>{blob.size > 2 * 1024 * 1024 && <p>Showing the first 2 MB. Download the file to see all its content.</p>}</> :
            kind === 'image' ? (url && <img src={url} alt={file.name} onError={() => setFailed(true)} />) :
            kind === 'video' ? (url && <video src={url} controls preload="metadata" onError={() => setFailed(true)} />) :
            (url && <audio src={url} controls preload="metadata" onError={() => setFailed(true)} />)}
        </div>
      </motion.section>
    </div>, document.body);
}
