'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useMyRequests } from './my-requests';
import './request-flowchart.css';

/* ─────────────────────────────────────────────────────────
 * REQUEST FLOWCHART — the process of the visitor's tokenization
 * requests on a dotted editor canvas: a Trigger card (request
 * sent), an If/Else card (which request, what state) and the
 * outcome card. Cards drag anywhere; the connectors follow. The
 * request chip opens a real dropdown. Data comes from the server.
 * ───────────────────────────────────────────────────────── */

const BLACK = '#141413';
const AMBER = '#f09a2f';
const mix = (hue: string, pct: number, base = 'var(--hfc-surface)') => `color-mix(in srgb, ${hue} ${pct}%, ${base})`;

const PAD_Y = 24;
const ROW_GAP = 64;
const PILL_OFFSET = 30;

export type StepNode = {
  id: string;
  row: number;
  x: number;
  w: number;
  kind?: { label: string; hue: string };
  hue?: string;
  title?: string;
  caption?: string;
  condition?: boolean;
};

export type RequestRow = {
  id: string;
  name: string;
  status: 'pending' | 'in_progress' | 'delayed' | 'awaiting_payment' | 'completed';
  createdAt: string | null;
  updatedAt?: string | null;
  certificateId: string | null;
};

const STATUS = {
  pending: { label: 'Pendiente', hue: '#64748b', outcome: 'En cola de revisión', caption: 'Tu solicitud espera a que un asesor la revise.' },
  in_progress: { label: 'En curso', hue: '#3b82f6', outcome: 'En proceso', caption: 'Un asesor está tokenizando tu archivo.' },
  delayed: { label: 'Retrasada', hue: AMBER, outcome: 'Con retraso', caption: 'Tardará más de lo previsto; el asesor te contactará.' },
  awaiting_payment: { label: 'Falta de pago', hue: '#e5484d', outcome: 'Pago pendiente', caption: 'Falta confirmar el pago para continuar.' },
  completed: { label: 'Completada', hue: '#16a34a', outcome: 'Tokenizada', caption: 'Completada. El sello PSOT se está emitiendo.' },
} as const;

const EST_H: Record<string, number> = { trigger: 92, cond: 134, outcome: 92, empty: 92 };

function formatDate(value: string | null | undefined) {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString('es-DO', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
}

/* ── the steps are derived from the request being inspected ── */
export function buildSteps(request: RequestRow | undefined, notice: string): StepNode[] {
  if (!request) {
    return [{ id: 'empty', row: 0, x: 0.5, w: 320, kind: { label: 'Solicitud', hue: BLACK }, hue: BLACK, title: 'Aún no tienes solicitudes', caption: notice }];
  }
  const state = STATUS[request.status] ?? STATUS.pending;
  const certified = request.status === 'completed' && !!request.certificateId;
  return [
    { id: 'trigger', row: 0, x: 0.5, w: 300, kind: { label: 'Solicitud', hue: BLACK }, hue: BLACK, title: 'Solicitud enviada', caption: [request.name, formatDate(request.createdAt)].filter(Boolean).join(' · ') },
    { id: 'cond', row: 1, x: 0.5, w: 356, kind: { label: 'If / Else', hue: AMBER }, condition: true },
    {
      id: 'outcome', row: 2, x: 0.5, w: 320, kind: { label: 'Resultado', hue: state.hue }, hue: state.hue,
      title: certified ? 'Tokenizada y sellada (PSOT)' : state.outcome,
      caption: certified ? `Sello PSOT ${request.certificateId!.slice(0, 8)}` : state.caption,
    },
  ];
}

/* ── icons ── */
function FileIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
    </svg>
  );
}
function Chevron() {
  return <svg className="hfc-chevron" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>;
}
function Handle() {
  return (
    <svg className="hfc-handle" width="10" height="16" viewBox="0 0 10 16" aria-hidden="true">
      {[3, 8, 13].flatMap(y => [<circle key={`l${y}`} cx="3" cy={y} r="1.1" fill="currentColor" />, <circle key={`r${y}`} cx="7.5" cy={y} r="1.1" fill="currentColor" />])}
    </svg>
  );
}
function CheckIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5" /></svg>;
}

/* ── dropdown menu ── */
type MenuItem = { id: string; name: string; tag?: string };

function Menu({ items, value, onPick }: { items: MenuItem[]; value: string; onPick: (id: string) => void }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [shift, setShift] = useState(0);

  /* keep the menu inside the canvas whatever the chip's position or the screen width */
  useLayoutEffect(() => {
    const menu = menuRef.current;
    const canvas = menu?.closest('.hfc-canvas');
    if (!menu || !canvas) return;
    const m = menu.getBoundingClientRect(), c = canvas.getBoundingClientRect();
    const over = m.right - (c.right - 8), under = c.left + 8 - m.left;
    setShift(over > 0 ? -Math.min(over, Math.max(0, m.left - c.left - 8)) : under > 0 ? under : 0);
  }, []);
  const rowRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [box, setBox] = useState<{ top: number; height: number } | null>(null);
  const valueIndex = items.findIndex(item => item.id === value);

  useLayoutEffect(() => {
    const row = rowRefs.current[hovered ?? valueIndex];
    if (row) setBox({ top: row.offsetTop, height: row.offsetHeight });
  }, [hovered, valueIndex]);

  return (
    <div ref={menuRef} className="hfc-menu" role="listbox" style={{ left: shift }} onMouseLeave={() => setHovered(null)}>
      <span aria-hidden className="hfc-menu-hover" style={{ top: box?.top ?? 0, height: box?.height ?? 0, opacity: box && hovered !== null ? 1 : 0 }} />
      {items.map((item, i) => (
        <button key={item.id} type="button" role="option" aria-selected={item.id === value} ref={el => { rowRefs.current[i] = el; }}
          onMouseEnter={() => setHovered(i)} onClick={() => onPick(item.id)} className="hfc-menu-row">
          <span className="hfc-menu-name">{item.name}</span>
          {item.tag && <span className="hfc-menu-tag">{item.tag}</span>}
          <span className="hfc-menu-check" style={{ visibility: item.id === value ? 'visible' : 'hidden' }}><CheckIcon /></span>
        </button>
      ))}
    </div>
  );
}

function SourceChip({ label }: { label: string }) {
  return <span data-ui className="hfc-source"><FileIcon size={12} />{label}</span>;
}

function StaticChip({ label, hue }: { label: string; hue: string }) {
  return <span data-ui className="hfc-static"><span className="hfc-dot" style={{ background: hue }} />{label}</span>;
}

function ChipSelect({ items, value, label, onPickRequest }: { items: MenuItem[]; value: string; label: string; onPickRequest?: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => { if (!ref.current?.contains(event.target as Node)) setOpen(false); };
    const esc = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', esc); };
  }, [open]);

  return (
    <span data-ui ref={ref} className="hfc-select">
      <button type="button" aria-haspopup="listbox" aria-expanded={open} disabled={items.length < 2} onClick={() => setOpen(current => !current)} className={`hfc-chip${open ? ' is-open' : ''}`}>
        <span className="hfc-chip-label">{label}</span>
        {items.length > 1 && <Chevron />}
      </button>
      {open && <Menu items={items} value={value} onPick={id => { onPickRequest?.(id); setOpen(false); }} />}
    </span>
  );
}

function ConditionBody({ requests, selected, onSelect }: { requests: RequestRow[]; selected: RequestRow; onSelect: (id: string) => void }) {
  const state = STATUS[selected.status] ?? STATUS.pending;
  const items = requests.map(row => ({ id: row.id, name: row.name || 'Archivo', tag: (STATUS[row.status] ?? STATUS.pending).label }));
  const certified = !!selected.certificateId;
  return (
    <div className="hfc-condition">
      <div className="hfc-line">
        <Handle />
        <span className="hfc-word hfc-word--lead">Si</span>
        <SourceChip label="solicitud" />
        <ChipSelect items={items} value={selected.id} label={selected.name || 'Archivo'} onPickRequest={onSelect} />
        <span className="hfc-word">está</span>
        <StaticChip label={state.label} hue={state.hue} />
      </div>
      <div className="hfc-line hfc-line--wrap">
        <Handle />
        <span className="hfc-word hfc-word--lead">y</span>
        <SourceChip label="sello PSOT" />
        <span className="hfc-word">está</span>
        <StaticChip label={certified ? 'Emitido' : 'En espera'} hue={certified ? '#16a34a' : '#94a3b8'} />
      </div>
    </div>
  );
}

function StepBody({ node }: { node: StepNode }) {
  return (
    <div className="hfc-step">
      <span className="hfc-step-icon" style={{ background: mix(node.hue!, 12), color: node.hue, boxShadow: `0 0 0 1px ${mix(node.hue!, 20)}` }}><FileIcon /></span>
      <span className="hfc-step-text">
        <span className="hfc-step-title">{node.title}</span>
        <span className="hfc-step-caption">{node.caption}</span>
      </span>
    </div>
  );
}

/* ── the canvas ── */
export function FlowCanvas({ steps, requests, selected, onSelect }: { steps: StepNode[]; requests: RequestRow[]; selected?: RequestRow; onSelect: (id: string) => void }) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef(new Map<string, HTMLElement>());
  const [width, setWidth] = useState(0);
  const [heights, setHeights] = useState<Record<string, number>>(EST_H);
  const [active, setActive] = useState<string | null>(null);
  const [offsets, setOffsets] = useState<Record<string, { dx: number; dy: number }>>({});
  const drag = useRef<{ id: string; startX: number; startY: number; baseDx: number; baseDy: number; moved: boolean } | null>(null);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const measure = () => {
      setWidth(canvas.clientWidth);
      setHeights(prev => {
        const next = { ...prev };
        let changed = false;
        nodeRefs.current.forEach((el, id) => {
          const h = el.offsetHeight;
          if (h && Math.abs(h - (next[id] ?? 0)) > 0.5) { next[id] = h; changed = true; }
        });
        return changed ? next : prev;
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(canvas);
    nodeRefs.current.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [steps.length]);

  const rows = [...new Set(steps.map(n => n.row))].sort((a, b) => a - b);
  const rowH = rows.map(r => Math.max(...steps.filter(n => n.row === r).map(n => heights[n.id] ?? 90)));
  const rowY: number[] = [];
  rows.forEach((_, i) => { rowY[i] = i === 0 ? PAD_Y : rowY[i - 1] + rowH[i - 1] + ROW_GAP; });
  const canvasH = rowY[rows.length - 1] + rowH[rows.length - 1] + PAD_Y;
  const cw = width || 480;

  const place = (n: StepNode) => {
    const w = Math.min(n.w, cw * 0.92);
    const off = offsets[n.id];
    return { w, cx: n.x * cw + (off?.dx ?? 0), top: rowY[rows.indexOf(n.row)] + (off?.dy ?? 0) };
  };
  const anchors = (n: StepNode) => {
    const { cx, top } = place(n);
    return { top: { x: cx, y: top + (n.kind ? PILL_OFFSET : 0) }, bottom: { x: cx, y: top + (heights[n.id] ?? 90) } };
  };
  const edges = steps.slice(1).map((n, i) => ({ from: steps[i].id, to: n.id }));
  const bezier = (edge: { from: string; to: string }) => {
    const from = anchors(steps.find(n => n.id === edge.from)!).bottom;
    const to = anchors(steps.find(n => n.id === edge.to)!).top;
    const k = Math.min(Math.max(Math.abs(to.y - from.y) * 0.55, 24), 84);
    return `M ${from.x} ${from.y} C ${from.x} ${from.y + k}, ${to.x} ${to.y - k}, ${to.x} ${to.y}`;
  };

  const onPointerDown = (node: StepNode) => (event: React.PointerEvent<HTMLDivElement>) => {
    if ((event.target as Element).closest('[data-ui]')) return;
    const off = offsets[node.id];
    drag.current = { id: node.id, startX: event.clientX, startY: event.clientY, baseDx: off?.dx ?? 0, baseDy: off?.dy ?? 0, moved: false };
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  };
  const onPointerMove = (node: StepNode) => (event: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== node.id) return;
    const dx = d.baseDx + event.clientX - d.startX;
    const dy = d.baseDy + event.clientY - d.startY;
    if (!d.moved && Math.hypot(dx - d.baseDx, dy - d.baseDy) < 3) return;
    d.moved = true;
    const { w } = place(node);
    const h = heights[node.id] ?? 90;
    const baseCx = node.x * cw;
    const baseTop = rowY[rows.indexOf(node.row)];
    const cx = Math.min(Math.max(baseCx + dx, w / 2 + 8), cw - w / 2 - 8);
    const top = Math.min(Math.max(baseTop + dy, 8), canvasH - h - 8);
    setOffsets(current => ({ ...current, [node.id]: { dx: cx - baseCx, dy: top - baseTop } }));
  };
  const onPointerUp = (node: StepNode) => () => {
    const d = drag.current;
    if (d?.id === node.id) { if (d.moved) setTimeout(() => { drag.current = null; }, 0); else drag.current = null; }
  };
  const wasDragged = () => drag.current?.moved === true;
  const lit = (edge: { from: string; to: string }) => active === edge.from || active === edge.to || edge.to === 'outcome';

  return (
    <div ref={canvasRef} className="hfc-canvas" style={{ height: canvasH }}>
      <svg width={cw} height={canvasH} className="hfc-edges" aria-hidden="true">
        {edges.map(edge => (
          <path key={`${edge.from}-${edge.to}`} d={bezier(edge)} fill="none" stroke={lit(edge) ? 'var(--hfc-accent)' : 'var(--hfc-line-strong)'} strokeWidth="1.25" className="hfc-edge" />
        ))}
      </svg>
      {steps.map(node => {
        const { w, cx, top } = place(node);
        const isActive = active === node.id;
        return (
          <div key={node.id} ref={el => { if (el) nodeRefs.current.set(node.id, el); else nodeRefs.current.delete(node.id); }}
            onPointerDown={onPointerDown(node)} onPointerMove={onPointerMove(node)} onPointerUp={onPointerUp(node)}
            className="hfc-node" style={{ left: cx, top, width: w, zIndex: drag.current?.id === node.id ? 2 : 1 }}>
            {node.kind && <span className="hfc-pill" style={{ background: mix(node.kind.hue, 14, 'var(--hfc-page)'), color: mix(node.kind.hue, 80, 'var(--hfc-ink)') }}>{node.kind.label}</span>}
            {node.condition && selected ? (
              <div className="hfc-card hfc-card--condition"><ConditionBody requests={requests} selected={selected} onSelect={onSelect} /></div>
            ) : (
              <button type="button" aria-pressed={isActive} className={`hfc-card hfc-card--step${isActive ? ' is-active' : ''}`}
                onClick={() => { if (wasDragged()) return; setActive(isActive ? null : node.id); }}>
                <StepBody node={node} />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function RequestFlowchart() {
  const { status, requests, quota } = useMyRequests();
  const [pickedId, setPickedId] = useState<string | null>(null);
  const rows = requests as RequestRow[];
  const selected = rows.find(row => row.id === pickedId) ?? rows[0];
  const notice = status === 'locked' ? 'Activa tu sesión de la plataforma para ver tus solicitudes.'
    : status === 'error' ? 'No se pudo cargar tus solicitudes. Reintentando…'
    : status === 'loading' ? 'Cargando tus solicitudes…'
    : 'Envía un archivo desde Tokenización y aquí verás su proceso.';
  const steps = buildSteps(selected, notice);
  const summary = selected ? `Solicitud ${selected.name}: ${(STATUS[selected.status] ?? STATUS.pending).label}${selected.certificateId ? ', sellada con PSOT' : ''}.` : notice;

  return (
    <section className="hfc" aria-labelledby="hfc-title">
      <header className="hfc-head">
        <h2 id="hfc-title">Proceso de tus solicitudes</h2>
        {quota && <span className="hfc-quota" aria-label={`${quota.used} de ${quota.limit} solicitudes este mes`}>{quota.used}/{quota.limit} este mes</span>}
      </header>
      <FlowCanvas steps={steps} requests={rows} selected={selected} onSelect={setPickedId} />
      <p className="hfc-summary" role="status">{summary}</p>
    </section>
  );
}
