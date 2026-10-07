"use client";

import React, { useEffect, useId, useState } from 'react';
import './recommendation-card.css';

// Local equivalents of Beautiful UI's atoms, scoped to this card.
function Button({ variant = 'primary', className = '', ...props }) {
  return <button type="button" className={`hrc-button hrc-button--${variant} ${className}`} {...props} />;
}
function EntityChip({ name }) { return <span className="hrc-entity-chip">{name}</span>; }
function ValuePill({ tone, children }) {
  return <span className={`hrc-value-pill${tone ? ` hrc-value-pill--${tone}` : ''}`}>{children}</span>;
}

export const DEFAULT_LABELS = {
  title: <>¿Cuántos días vas a durar en la <EntityChip name="plataforma" />?</>,
  alternatives: 'Alternatives',
  otherOptions: 'Other options',
  accepted: 'Accepted',
};

export const DEFAULT_OPTIONS = [10, 20, 30, 60].map(days => ({
  key: String(days), days,
  body: <>Tiempo de permanencia: <ValuePill tone="green">{days} days</ValuePill></>,
  short: `${days} days`, signal: 3, tone: 'var(--hrc-green)',
  label: 'Tiempo de acceso', cta: 'Aceptar', ctaVariant: 'accent',
}));

function Meter({ signal, tone }) {
  return <span className="hrc-meter" aria-hidden="true">
    {[0, 1, 2].map(bar => <span key={bar} style={{ background: bar < signal ? tone : 'var(--hrc-line-strong)' }} />)}
  </span>;
}

export default function RecommendationCard({ options = DEFAULT_OPTIONS, labels, onAccept, activeDays, locked = false } = {}) {
  const t = { ...DEFAULT_LABELS, ...labels };
  const [selectedKey, setSelectedKey] = useState(null);
  const [open, setOpen] = useState(false);
  const [acceptedKey, setAcceptedKey] = useState(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { if (activeDays) { setSelectedKey(String(activeDays)); setAcceptedKey(String(activeDays)); setOpen(false); } }, [activeDays]);
  const id = useId();
  const active = options.find(option => option.key === selectedKey) ?? options[0];
  if (!active) return null;
  const others = options.filter(option => option.key !== active.key);
  const accepted = acceptedKey === active.key;

  return <section id="d5RecommendationCard" className="hrc-card" aria-labelledby={`${id}-title`} data-selected={active.key} data-accepted={accepted}>
    <div className="hrc-card-pad">
      <span id={`${id}-title`} className="hrc-title">{t.title}</span>
      <p key={active.key} className="hrc-body">{active.body}</p>
    </div>
    <div id={`${id}-options`} className="hrc-drawer" data-open={open} inert={!open} aria-hidden={!open}>
      <div className="hrc-drawer-clip">
        <div className="hrc-options">
          <p className="hrc-options-title">{t.otherOptions}</p>
          {others.map(option => <button key={option.key} type="button" className="hrc-option" data-option={option.key} disabled={locked || pending}
            onClick={() => { setSelectedKey(option.key); setAcceptedKey(null); }}>
            <Meter signal={option.signal} tone={option.tone} />
            <span className="hrc-option-short">{option.short}</span>
            <span className="hrc-option-label">{option.label}</span>
          </button>)}
        </div>
      </div>
    </div>
    <div className="hrc-footer">
      <span className="hrc-confidence"><Meter signal={active.signal} tone={active.tone} /><span>{active.label}</span></span>
      <span className="hrc-actions">
        <Button variant="secondary" aria-expanded={open} aria-controls={`${id}-options`} disabled={!others.length || pending}
          onClick={() => setOpen(current => !current)}>{t.alternatives}</Button>
        <Button variant={accepted ? 'success' : active.ctaVariant} data-recommendation-accept disabled={accepted || locked || pending}
          onClick={async () => {
            setPending(true); setError('');
            try { await onAccept?.(active); setAcceptedKey(active.key); setOpen(false); }
            catch (reason) { setError(reason?.message || 'No se pudo guardar el plazo.'); }
            finally { setPending(false); }
          }}>{pending ? 'Guardando…' : accepted ? t.accepted : active.cta}</Button>
      </span>
    </div>
    <span className="hrc-sr-only" role="status">{accepted ? `${t.accepted}: ${active.short}` : ''}</span>
    {error && <p className="hpa-error" role="alert">{error}</p>}
  </section>;
}
