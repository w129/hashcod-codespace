import React, { useEffect, useState } from 'react';
import { activationMessage, parseOrderMessage } from './checkout-data';
import TokenizationTool from './TokenizationTool';
import { PaymentsIcon, RequestsIcon } from './ProIcons';

export default function SubscriptionAdmin() {
  const [open, setOpen] = useState(false), [authorized, setAuthorized] = useState(false);
  const [key, setKey] = useState(''), [reference, setReference] = useState(''), [plan, setPlan] = useState('monthly');
  const [confirmed, setConfirmed] = useState(false), [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  const [result, setResult] = useState(null);
  const [requestsOpen, setRequestsOpen] = useState(false);
  const [pasted, setPasted] = useState(''), [copied, setCopied] = useState(false), [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!result) return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [result]);
  function readOrder(text) {
    setPasted(text);
    const order = parseOrderMessage(text);
    if (order.reference) setReference(order.reference);
    if (order.plan) setPlan(order.plan);
  }
  async function copyCode() {
    try { await navigator.clipboard.writeText(result.code); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { setMessage('No se pudo copiar; selecciona el código manualmente.'); }
  }
  const secondsLeft = result ? Math.max(0, result.expiresAt - Math.floor(now / 1000)) : 0;
  const detected = parseOrderMessage(pasted);
  async function submit(event) {
    event.preventDefault(); if (busy) return;
    setBusy(true); setMessage(''); setResult(null);
    try {
      const response = await fetch('/api/platform-subscription', { method: 'POST', credentials: 'same-origin', cache: 'no-store',
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(authorized
          ? { action: 'issue', reference: reference.trim(), plan, confirmedPayment: confirmed }
          : { action: 'auth', key }) });
      const data = await response.json();
      if (!response.ok || !data.ok) { if (response.status === 403 && authorized) setAuthorized(false); throw new Error(data.error || 'No se pudo completar la operación.'); }
      if (!authorized) { setAuthorized(true); setKey(''); }
      else { setResult(data); setConfirmed(false); }
    } catch (e) { setMessage(e.message); }
    finally { setKey(''); setBusy(false); }
  }
  return <div className="hco-admin"><button type="button" className="hco-reopen" onClick={() => { setOpen(!open); setKey(''); setResult(null); setMessage(''); }}><PaymentsIcon />Administrar pagos</button>
    <button type="button" className="hco-reopen" onClick={() => setRequestsOpen(true)}><RequestsIcon />Área privada de solicitudes</button>
    {requestsOpen && <TokenizationTool initialView="auth" files={[]} loading={false} onRefresh={() => {}} onClose={() => setRequestsOpen(false)} />}
    {open && <form onSubmit={submit} className="hco-admin-form">
      <strong>Confirmación administrativa del pago</strong>
      {!authorized ? <><label htmlFor="hco-admin-key">Clave del área privada de solicitudes</label><input id="hco-admin-key" type="password" autoComplete="off" maxLength={8192} value={key} onChange={e => setKey(e.target.value)} required /></> : <>
        <label htmlFor="hco-admin-paste">Pega aquí el pedido del cliente (WhatsApp)</label><textarea id="hco-admin-paste" rows={4} maxLength={4000} autoComplete="off" value={pasted} onChange={e => readOrder(e.target.value)} placeholder="Hola, quiero suscribirme a Hashcod Pro…" />
        {pasted && <p role="status" className="hco-admin-detected">{detected.reference ? `Referencia detectada: ${detected.reference.slice(0, 8)}…${detected.reference.slice(-4)}${detected.plan ? ` · Plan ${detected.plan === 'yearly' ? 'anual' : 'mensual'}` : ''}` : 'No se encontró la referencia en el mensaje; escríbela abajo.'}</p>}
        <label htmlFor="hco-admin-ref">Referencia recibida por WhatsApp</label><input id="hco-admin-ref" autoComplete="off" maxLength={36} value={reference} onChange={e => setReference(e.target.value)} required />
        <label htmlFor="hco-admin-plan">Plan pagado</label><select id="hco-admin-plan" value={plan} onChange={e => setPlan(e.target.value)}><option value="monthly">Mensual · US$20</option><option value="yearly">Anual · US$192</option></select>
        <label><input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} />He comprobado que este pago fue recibido.</label>
      </>}
      <button type="submit" disabled={busy || (authorized && !confirmed)}>{busy ? 'Verificando…' : authorized ? 'Emitir código de activación' : 'Validar acceso administrativo'}</button>
      {message && <p role="alert">{message}</p>}
      {result && <div role="status" className="hco-admin-result"><strong>Código: {result.code}</strong><p>Referencia: {result.reference}</p><p>Plan: {result.plan === 'yearly' ? 'Anual' : 'Mensual'}. {secondsLeft > 0 ? `Caduca en ${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, '0')}.` : 'Caducó: emite un código nuevo.'} Entrégalo al cliente por WhatsApp; solo funciona en su sesión.</p>
        <div className="hco-admin-actions"><button type="button" onClick={copyCode} disabled={secondsLeft === 0}>{copied ? 'Copiado' : 'Copiar código'}</button>
          <a href={secondsLeft > 0 ? `https://wa.me/?text=${encodeURIComponent(activationMessage(result.code))}` : undefined} aria-disabled={secondsLeft === 0} target="_blank" rel="noopener noreferrer">Enviar por WhatsApp</a></div></div>}
    </form>}
  </div>;
}
