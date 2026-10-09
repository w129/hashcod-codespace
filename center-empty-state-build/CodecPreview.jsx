import React, { useCallback, useEffect, useRef, useState } from 'react';

const FILE = 'churn.ts';
const CODE_LINES = [
  'export async function churnBatch() {',
  '  const flavor = await getFlavor("pistachio");',
  '  const base = await dairy.fetch({ flavor });',
  '  await freezer.store(base, { temp: "-16C" });',
  '  if (!base.approved) return null;',
  '  return base.gallons;',
  '}',
];

// Unified diff rows: old/new line numbers, kind, and pieces (`change` tints a word-level add/del).
const DIFF = [
  { old: 1, cur: 1, type: 'ctx', pieces: [{ text: 'export async function churnBatch() {' }] },
  { old: 2, cur: 2, type: 'ctx', pieces: [{ text: '  const flavor = await getFlavor("pistachio");' }] },
  { old: 3, cur: 3, type: 'ctx', pieces: [{ text: '  const base = await dairy.fetch({ flavor });' }] },
  { old: 4, cur: null, type: 'del', pieces: [{ text: '  await freezer.store(base, { temp: ' }, { text: '"-14C"', change: 'del' }, { text: ' });' }] },
  { old: null, cur: 4, type: 'add', pieces: [{ text: '  await freezer.store(base, { temp: ' }, { text: '"-16C"', change: 'add' }, { text: ' });' }] },
  { old: null, cur: 5, type: 'add', pieces: [{ text: '  if (!base.approved) return null;' }] },
  { old: 5, cur: 6, type: 'ctx', pieces: [{ text: '  return base.gallons;' }] },
  { old: 6, cur: 7, type: 'ctx', pieces: [{ text: '}' }] },
];

const KEYWORDS = new Set(['import', 'from', 'export', 'default', 'async', 'function', 'const', 'let', 'var', 'await', 'return', 'if', 'else', 'for', 'while', 'new', 'throw', 'try', 'catch', 'null', 'true', 'false', 'undefined']);
const TOKEN = /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`[^`]*`|\b\d+(?:\.\d+)?\b|\b(?:import|from|export|default|async|function|const|let|var|await|return|if|else|for|while|new|throw|try|catch|null|true|false|undefined)\b|[A-Za-z_$][\w$]*(?=\s*\())/g;

function highlight(text) {
  const nodes = [];
  let last = 0;
  let k = 0;
  for (const m of text.matchAll(TOKEN)) {
    const idx = m.index ?? 0;
    const t = m[0];
    if (idx > last) nodes.push(<span key={k++}>{text.slice(last, idx)}</span>);
    const cls = /^["'`]/.test(t) || /^\d/.test(t) ? 'hco-tk-lit' : KEYWORDS.has(t) ? 'hco-tk-kw' : 'hco-tk-fn';
    nodes.push(<span key={k++} className={cls}>{t}</span>);
    last = idx + t.length;
  }
  if (last < text.length) nodes.push(<span key={k++}>{text.slice(last)}</span>);
  return nodes;
}

function Pieces({ pieces }) {
  return pieces.map((p, i) => (p.change
    ? <span key={i} className={`hco-chg hco-chg-${p.change}`}>{highlight(p.text)}</span>
    : <span key={i}>{highlight(p.text)}</span>));
}

// Reveals `lines` char by char (the "AI writing" effect). Returns how many chars are visible.
function useTypewriter(total, runId, reduced) {
  const [shown, setShown] = useState(reduced ? total : 0);
  useEffect(() => {
    if (reduced) { setShown(total); return undefined; }
    setShown(0);
    let n = 0;
    const id = setInterval(() => {
      n += 2;
      setShown(Math.min(n, total));
      if (n >= total) clearInterval(id);
    }, 28);
    return () => clearInterval(id);
  }, [total, runId, reduced]);
  return shown;
}

async function writeClipboard(text) {
  try {
    if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(text); return true; }
  } catch { /* fall through to the legacy path */ }
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
  document.body.appendChild(area);
  area.select();
  let ok = false;
  try { ok = document.execCommand('copy'); } catch { ok = false; }
  area.remove();
  return ok;
}

export default function CodecPreview() {
  const reduced = typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const [view, setView] = useState('Code');
  const [copied, setCopied] = useState(false);
  const [runId, setRunId] = useState(0);
  const timer = useRef(0);
  const raw = CODE_LINES.join('\n');
  const shown = useTypewriter(raw.length, runId, reduced);
  const writing = shown < raw.length;
  const isDiff = view === 'Diff';
  const added = DIFF.filter(r => r.type === 'add').length;
  const removed = DIFF.filter(r => r.type === 'del').length;

  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = useCallback(async () => {
    if (!await writeClipboard(raw)) return;
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1500);
  }, [raw]);

  // Visible slice of each code line while the AI "types"; the caret sits on the line being written.
  let left = shown;
  let caretLine = -1;
  const typed = CODE_LINES.map((line, i) => {
    const part = line.slice(0, Math.max(0, left));
    if (writing && caretLine < 0 && left <= line.length) caretLine = i;
    left -= line.length + 1;
    return part;
  });

  return (
    <section className="hco-codec" aria-labelledby="hco-codec-title">
      <p className="hco-codec-quote">
        Imagina tu IA en esta plataforma, trabajando en este espacio. Y lo que es más: puedes ver su trabajo, y lo que crea queda tokenizado y certificado… ¿te imaginas?
      </p>
      <h2 id="hco-codec-title" className="hco-codec-title">Imagina ver tu IA escribiendo aquí</h2>
      <div className="hco-code">
        <div className="hco-code-head">
          <span className="hco-code-file">
            <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" /></svg>
            <span>{FILE}</span>
            {writing && <em className="hco-code-live" aria-live="polite">IA escribiendo…</em>}
          </span>
          <span className="hco-code-tabs" role="group" aria-label="Vista del código">
            <button type="button" aria-pressed={!isDiff} onClick={() => setView('Code')}>Code</button>
            <button type="button" aria-pressed={isDiff} onClick={() => setView('Diff')}>Diff</button>
          </span>
          {isDiff ? (
            <span className="hco-code-stat"><b className="hco-add">+{added}</b><b className="hco-del">-{removed}</b></span>
          ) : (
            <span className="hco-code-actions">
              <button type="button" aria-label="Repetir animación" title="Repetir" onClick={() => setRunId(n => n + 1)}>↻</button>
              <button type="button" aria-label="Copiar código" className={copied ? 'hco-ok' : ''} onClick={copy}>{copied ? 'Copiado' : 'Copiar'}</button>
            </span>
          )}
        </div>
        <div className="hco-code-body">
          {isDiff ? DIFF.map((r, i) => (
            <div key={i} className={`hco-row hco-row-${r.type}`}>
              <span className="hco-num">{(r.type === 'del' ? r.old : r.cur) ?? ''}</span>
              <code><Pieces pieces={r.pieces} /></code>
            </div>
          )) : CODE_LINES.map((line, i) => (
            <div key={i} className="hco-row">
              <span className="hco-num">{i + 1}</span>
              <code>{highlight(typed[i])}{i === caretLine && <i className="hco-caret" aria-hidden="true" />}</code>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
