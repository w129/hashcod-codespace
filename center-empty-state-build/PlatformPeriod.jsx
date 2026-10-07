import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import RecommendationCard from './RecommendationCard';
import './platform-period.css';

export default function PlatformPeriod() {
  const [period, setPeriod] = useState(() => {
    const initial = document.body.dataset;
    if (initial.hashcodPeriodExpired === '1') return { state: 'expired' };
    if (initial.hashcodPeriodExpiresAt) return { state: 'active', days: Number(initial.hashcodPeriodDays), expiresAt: Number(initial.hashcodPeriodExpiresAt), serverNow: Number(initial.hashcodPeriodNow) };
    return { state: 'loading' };
  });
  const [error, setError] = useState(''), [busy, setBusy] = useState(false), [days, setDays] = useState(10), [code, setCode] = useState('');
  const queue = useRef(Promise.resolve()), mounted = useRef(true), controller = useRef(null);
  const clock = useRef({ now: period.serverNow || 0, at: performance.now() }), input = useRef(null), dialog = useRef(null);
  const expired = period.state === 'expired';

  // Serialize status/accept requests so an older response cannot replace the
  // newly renewed cookie or state when another tab becomes visible.
  const request = useCallback(body => {
    const task = queue.current.then(async () => {
      if (!mounted.current) return;
      controller.current = new AbortController();
      const response = await fetch('/api/platform-period', { method: body ? 'POST' : 'GET', credentials: 'same-origin', cache: 'no-store',
        signal: controller.current.signal, headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || 'No se pudo verificar el plazo.');
      if (mounted.current) {
        clock.current = { now: data.serverNow, at: performance.now() };
        setPeriod(data); setError('');
      }
      return data;
    });
    // Failure is still returned to the caller; keep the queue usable for retry.
    queue.current = task.catch(() => {});
    return task;
  }, []);
  useEffect(() => {
    let alive = true; mounted.current = true;
    const refresh = () => request().catch(() => { if (alive) setError('No se pudo comprobar el plazo. Intenta de nuevo.'); });
    refresh();
    const poll = setInterval(refresh, 60000);
    const visible = () => { if (!document.hidden) refresh(); };
    document.addEventListener('visibilitychange', visible);
    return () => { alive = false; mounted.current = false; controller.current?.abort(); clearInterval(poll); document.removeEventListener('visibilitychange', visible); };
  }, [request]);
  useEffect(() => {
    if (period.state !== 'active') return;
    const tick = () => {
      const now = clock.current.now + (performance.now() - clock.current.at) / 1000;
      if (now >= period.expiresAt) setPeriod(current => ({ ...current, state: 'expired' }));
    };
    const timer = setInterval(tick, 1000); tick();
    return () => clearInterval(timer);
  }, [period.state, period.expiresAt]);
  useEffect(() => {
    if (!expired) return;
    document.body.classList.add('hpa-locked');
    const targets = Array.from(document.querySelectorAll('body > main, body > footer'));
    const previous = targets.map(n => n.inert);
    targets.forEach(n => { n.inert = true; });
    const oldFocus = document.activeElement;
    input.current?.focus();
    return () => { document.body.classList.remove('hpa-locked'); targets.forEach((n, i) => { n.inert = previous[i]; }); oldFocus?.focus?.(); };
  }, [expired]);

  async function renew(event) {
    event.preventDefault(); setBusy(true); setError('');
    try { await request({ days, code }); setCode(''); }
    catch (reason) { setError(reason.message); }
    finally { setBusy(false); }
  }
  return <>
    <RecommendationCard onAccept={option => request({ days: option.days })} activeDays={period.state === 'active' ? period.days : null}
      locked={period.state !== 'choose'} labels={{ accepted: 'Activo' }} />
    {period.state === 'active' && <p className="hpa-period-status" role="status">Acceso hasta {new Date(period.expiresAt * 1000).toLocaleString('es-DO')}</p>}
    {error && !expired && <p className="hpa-error" role="alert">{error} <button type="button" onClick={() => request().catch(reason => setError(reason.message))}>Reintentar</button></p>}
    {expired && createPortal(<div id="hpaGatePortal" className="hpa-backdrop">
      <section ref={dialog} className="hpa-dialog" role="dialog" aria-modal="true" aria-labelledby="hpa-title" aria-describedby="hpa-description"
        onKeyDown={event => {
          if (event.key !== 'Tab') return;
          const nodes = Array.from(dialog.current.querySelectorAll('input,select,button')).filter(n => !n.disabled);
          if (event.shiftKey && document.activeElement === nodes[0]) { event.preventDefault(); nodes.at(-1)?.focus(); }
          else if (!event.shiftKey && document.activeElement === nodes.at(-1)) { event.preventDefault(); nodes[0]?.focus(); }
        }}>
        <div className="hpa-dialog-head"><span className="hpa-expired-pill">Plazo finalizado</span><h2 id="hpa-title">Vuelve a la plataforma</h2>
          <p id="hpa-description">Tu tiempo de acceso ha terminado. Introduce la clave de renovación y elige tu nuevo plazo.</p></div>
        <form onSubmit={renew}>
          <label htmlFor="hpa-code">Clave de renovación</label>
          <input ref={input} id="hpa-code" type="password" autoComplete="current-password" value={code} onChange={event => setCode(event.target.value)} maxLength={256} required disabled={busy} />
          <label htmlFor="hpa-days">Nuevo plazo</label>
          <select id="hpa-days" value={days} onChange={event => setDays(Number(event.target.value))} disabled={busy}>
            {[10, 20, 30, 60].map(value => <option key={value} value={value}>{value} days</option>)}
          </select>
          {error && <p className="hpa-error" role="alert">{error}</p>}
          <div className="hpa-dialog-footer"><span className="hpa-period-note">Acceso protegido</span><button type="submit" className="hrc-button hrc-button--accent" disabled={busy}>{busy ? 'Verificando…' : 'Renovar acceso'}</button></div>
        </form>
      </section>
    </div>, document.body)}
  </>;
}
