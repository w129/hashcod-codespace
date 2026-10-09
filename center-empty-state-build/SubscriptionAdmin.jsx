import React, { useState } from 'react';

export default function SubscriptionAdmin() {
  const [open, setOpen] = useState(false), [authorized, setAuthorized] = useState(false);
  const [key, setKey] = useState(''), [reference, setReference] = useState(''), [plan, setPlan] = useState('monthly');
  const [confirmed, setConfirmed] = useState(false), [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  const [result, setResult] = useState(null);
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
  return <div className="hco-admin"><button type="button" className="hco-reopen" onClick={() => { setOpen(!open); setKey(''); setResult(null); setMessage(''); }}>Administrar pagos</button>
    {open && <form onSubmit={submit} className="hco-admin-form">
      <strong>Confirmación administrativa del pago</strong>
      {!authorized ? <><label htmlFor="hco-admin-key">Clave del área privada de solicitudes</label><input id="hco-admin-key" type="password" autoComplete="off" maxLength={8192} value={key} onChange={e => setKey(e.target.value)} required /></> : <>
        <label htmlFor="hco-admin-ref">Referencia recibida por WhatsApp</label><input id="hco-admin-ref" autoComplete="off" maxLength={36} value={reference} onChange={e => setReference(e.target.value)} required />
        <label htmlFor="hco-admin-plan">Plan pagado</label><select id="hco-admin-plan" value={plan} onChange={e => setPlan(e.target.value)}><option value="monthly">Mensual · US$20</option><option value="yearly">Anual · US$192</option></select>
        <label><input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} />He comprobado que este pago fue recibido.</label>
      </>}
      <button type="submit" disabled={busy || (authorized && !confirmed)}>{busy ? 'Verificando…' : authorized ? 'Emitir código de activación' : 'Validar acceso administrativo'}</button>
      {message && <p role="alert">{message}</p>}
      {result && <div role="status"><strong>Código: {result.code}</strong><p>Referencia: {result.reference}</p><p>Plan: {result.plan === 'yearly' ? 'Anual' : 'Mensual'}. Válido hasta {new Date(result.expiresAt * 1000).toLocaleTimeString()}. Entrégalo al cliente por WhatsApp; solo funciona en su sesión.</p></div>}
    </form>}
  </div>;
}
