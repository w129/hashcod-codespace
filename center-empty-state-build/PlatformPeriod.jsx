import React, { useCallback, useEffect, useRef, useState } from 'react';
import RecommendationCard from './RecommendationCard';
import EntryCheckout from './EntryCheckout';
import './platform-period.css';

export default function PlatformPeriod() {
  const initial = document.body.dataset;
  const [period, setPeriod] = useState(() => initial.hashcodPeriodExpiresAt && initial.hashcodPeriodExpired !== '1'
    ? { state: 'active', days: Number(initial.hashcodPeriodDays), expiresAt: Number(initial.hashcodPeriodExpiresAt), serverNow: Number(initial.hashcodPeriodNow) }
    : { state: 'loading' });
  const [open, setOpen] = useState(() => !initial.hashcodPeriodExpiresAt || initial.hashcodPeriodExpired === '1');
  const [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const queue = useRef(Promise.resolve()), mounted = useRef(true), controller = useRef(null), entering = useRef(false);
  const current = useRef(period), entered = useRef(period.state === 'active');
  const clock = useRef({ now: period.serverNow || 0, at: performance.now() });

  const request = useCallback(body => {
    const task = queue.current.then(async () => {
      if (!mounted.current) return;
      controller.current = new AbortController();
      const response = await fetch('/api/platform-period', { method: body ? 'POST' : 'GET', credentials: 'same-origin', cache: 'no-store',
        signal: controller.current.signal, headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error('No se pudo conectar con la plataforma. Intenta de nuevo.');
      if (mounted.current) {
        current.current = data; clock.current = { now: data.serverNow, at: performance.now() };
        setPeriod(data); setError('');
        if (data.state === 'active') {
          delete document.body.dataset.hashcodPeriodRequired;
          if (body) window.dispatchEvent(new CustomEvent('hashcod:platform-period-granted'));
        }
      }
      return data;
    });
    queue.current = task.catch(() => {});
    return task;
  }, []);

  useEffect(() => {
    mounted.current = true;
    const refresh = async () => {
      try {
        const data = await request();
        // Free entry keeps the same signed browser identity. The technical
        // session refresh never promotes a user to a paid subscription.
        if (entered.current && data?.state !== 'active') await request({ entry: 'free' });
        else if (!entered.current && data?.state === 'active') { entered.current = true; setOpen(false); }
      } catch (_) { if (mounted.current) setError('No se pudo conectar con la plataforma. Intenta de nuevo.'); }
    };
    refresh();
    const poll = setInterval(refresh, 60000);
    const visible = () => { if (!document.hidden) refresh(); };
    document.addEventListener('visibilitychange', visible);
    return () => { mounted.current = false; controller.current?.abort(); clearInterval(poll); document.removeEventListener('visibilitychange', visible); };
  }, [request]);

  async function enter() {
    if (entering.current) return;
    entering.current = true; setBusy(true); setError('');
    try {
      const now = clock.current.now + (performance.now() - clock.current.at) / 1000;
      if (current.current.state !== 'active' || current.current.expiresAt <= now) {
        const data = await request({ entry: 'free' });
        if (data?.state !== 'active') throw new Error('No se pudo iniciar la sesión gratuita. Intenta de nuevo.');
      }
      if (mounted.current) { entered.current = true; setOpen(false); }
    } catch (_) { if (mounted.current) setError('No se pudo iniciar la sesión gratuita. Comprueba tu conexión e intenta de nuevo.'); }
    finally { entering.current = false; if (mounted.current) setBusy(false); }
  }

  return <>
    <RecommendationCard activeDays={period.state === 'active' ? period.days : null} locked labels={{ accepted: 'Activo' }} />
    <button type="button" className="hco-reopen" onClick={() => { setError(''); setOpen(true); }}>Ver planes de Hashcod Pro</button>
    {error && !open && <p className="hpa-error" role="alert">{error}</p>}
    {open && <EntryCheckout onEnter={enter} busy={busy} error={error} />}
  </>;
}
