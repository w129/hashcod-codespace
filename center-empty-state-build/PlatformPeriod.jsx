import React, { useCallback, useEffect, useRef, useState } from 'react';
import RecommendationCard from './RecommendationCard';
import EntryCheckout from './EntryCheckout';
import { PlansIcon } from './ProIcons';
import SubscriptionAdmin from './SubscriptionAdmin';
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
      const timeout = setTimeout(() => controller.current?.abort(), 35000);
      let response;
      try { response = await fetch('/api/platform-period', { method: body ? 'POST' : 'GET', credentials: 'same-origin', cache: 'no-store',
        signal: controller.current.signal, headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined }); } finally { clearTimeout(timeout); }
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || 'No se pudo conectar con la plataforma. Intenta de nuevo.');
      if (mounted.current) {
        current.current = data; clock.current = { now: data.serverNow, at: performance.now() };
        setPeriod(data); if (body) setError('');
        window.dispatchEvent(new CustomEvent('hashcod:subscription', { detail: data.subscription || { tier: 'free' } }));
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

  useEffect(() => {
    const reopen = () => setOpen(true);
    window.addEventListener('hashcod:pro-required', reopen);
    return () => window.removeEventListener('hashcod:pro-required', reopen);
  }, []);

  async function verify(code) {
    if (entering.current) return;
    entering.current = true; setBusy(true);
    try {
      const data = await request({ entry: 'pro', code });
      if (data.subscription?.tier !== 'pro') throw new Error('No se pudo activar Hashcod Pro.');
      entered.current = true; setOpen(false);
    } finally { entering.current = false; if (mounted.current) setBusy(false); }
  }

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
    <button type="button" className="hco-reopen" onClick={() => { setError(''); setOpen(true); }}><PlansIcon />Ver planes de Hashcod Pro</button>
    <p className="hco-free-note">{period.subscription?.tier === 'pro' ? `Hashcod Pro activo · 25 solicitudes al mes · hasta ${new Date(period.subscription.expiresAt * 1000).toLocaleDateString()}` : 'Modo gratuito · Los beneficios Pro están bloqueados hasta validar tu código.'}</p>
    {!open && period.state === 'active' && <SubscriptionAdmin />}
    {error && !open && <p className="hpa-error" role="alert">{error}</p>}
    {open && <EntryCheckout onEnter={enter} onVerify={verify} reference={period.reference || ''} busy={busy} error={error} />}
  </>;
}
