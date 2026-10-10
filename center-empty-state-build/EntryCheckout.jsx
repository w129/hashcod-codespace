import React, { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CERTIFICATE_PRICE_DOP, checkoutOrder, FIRST_TOKENIZATION_PAYMENT, formatCedula, formatDop, formatUsd, PLAN_PRICES } from './checkout-data';
import CodecPreview from './CodecPreview';
import CheckoutFaq from './CheckoutFaq';
import HashcodLogo from './HashcodLogo';
import './entry-checkout.css';

function Brand() {
  return <div className="hco-brand"><HashcodLogo className="hco-brand-logo" /></div>;
}
function WhatsappIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 004.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0012.04 2zm0 18.15h-.01a8.2 8.2 0 01-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 01-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 012.41 5.83c0 4.54-3.7 8.23-8.23 8.23zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.78.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.16-.47-.28z" /></svg>;
}
function DominicanFlag() {
  return <svg width="24" height="16" viewBox="0 0 24 16" aria-hidden="true"><rect width="24" height="16" fill="#fff" /><rect width="10" height="6.5" fill="#002D62" /><rect x="14" width="10" height="6.5" fill="#CE1126" /><rect y="9.5" width="10" height="6.5" fill="#CE1126" /><rect x="14" y="9.5" width="10" height="6.5" fill="#002D62" /></svg>;
}

export default function EntryCheckout({ onEnter, onVerify, reference = '', busy = false, error = '' }) {
  const [yearly, setYearly] = useState(false), [rd, setRd] = useState(true);
  const [cedula, setCedula] = useState(''), [fiscal, setFiscal] = useState(false);
  const [otp, setOtp] = useState(''), [otpMessage, setOtpMessage] = useState('');
  const root = useRef(null), back = useRef(null), identity = useRef(null);
  const order = checkoutOrder({ yearly, rd, cedula, fiscal, reference });
  async function verify() {
    setOtpMessage('');
    try { await onVerify(otp); setOtp(''); }
    catch (e) { setOtpMessage(e.message); }
  }
  useLayoutEffect(() => {
    const oldFocus = document.activeElement;
    const targets = [...document.querySelectorAll('body > main, body > footer, .code-access-root')];
    const prior = targets.map(n => n.inert);
    targets.forEach(n => { n.inert = true; });
    document.body.classList.add('hco-open'); back.current?.focus();
    return () => {
      document.body.classList.remove('hco-open');
      targets.forEach((n, i) => { n.inert = prior[i]; });
      oldFocus?.focus?.();
    };
  }, []);
  const keyDown = event => {
    if (event.key === 'Escape') { event.preventDefault(); if (!busy) onEnter(); return; }
    if (event.key !== 'Tab') return;
    const nodes = [...root.current.querySelectorAll('button,input,a[href]')].filter(n => !n.disabled && n.offsetParent !== null);
    if (event.shiftKey && document.activeElement === nodes[0]) { event.preventDefault(); nodes.at(-1)?.focus(); }
    else if (!event.shiftKey && document.activeElement === nodes.at(-1)) { event.preventDefault(); nodes[0]?.focus(); }
  };
  return createPortal(<div id="hashcodEntryCheckout" className="hco-backdrop">
    <section ref={root} className="hco-checkout" role="dialog" aria-modal="true" aria-labelledby="hco-title" onKeyDown={keyDown}>
      <aside className="hco-summary" aria-label="Resumen de la suscripción">
        <div className="hco-header"><button ref={back} type="button" aria-label="Volver" className="hco-back" onClick={onEnter} disabled={busy}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
        </button><Brand /></div>
        <div className="hco-pricing"><span>Suscribirse a Hashcod Pro</span><div><strong>{formatUsd(yearly ? PLAN_PRICES.yearly : PLAN_PRICES.monthly)}</strong><span>{yearly ? 'por año' : 'por mes'}</span></div><p className="hco-first-payment">Primer pago para tokenizar: <b>{formatUsd(FIRST_TOKENIZATION_PAYMENT)}</b> <small>(pago único)</small></p><p className="hco-first-payment">Certificado PSOT (comprobante de registro): <b>{formatDop(CERTIFICATE_PRICE_DOP)}</b> <small>(por certificado)</small></p></div>
        <div className="hco-billing" role="group" aria-label="Facturación">
          <button type="button" aria-pressed={!yearly} onClick={() => setYearly(false)}>Mensual</button>
          <button type="button" aria-pressed={yearly} onClick={() => setYearly(true)}>Anual · −20%</button>
        </div>
        <div className="hco-totals"><div><span><strong>Hashcod Pro</strong><small>Acceso completo a la plataforma, IA y almacenamiento en la nube</small></span><span>{order.planAmount}</span></div>
          <div><span><strong>Primer pago para tokenizar</strong><small>Pago único. Incluye lo que tu caso requiera: verificación internacional (si aplica), asesoría y gastos legales</small></span><span>{order.firstAmount}</span></div>
          <div className="hco-totals-note"><span><strong>Certificado PSOT</strong><small>Comprobante de registro. Precio por certificado, en pesos dominicanos; no suma al total en dólares</small></span><span>{order.certificateAmount}</span></div>
          <div><strong>Total a pagar hoy</strong><strong>{order.amount}</strong></div></div>
        <div className="hco-benefits"><strong>Qué incluye</strong><ul><li>Acceso a la Toolbook</li><li>Permiso de IA y Prueba Sellada de Objeto y Tiempo (PSOT)</li><li>Uso de las Herramientas</li><li>+20 solicitudes /mes <small>(25 solicitudes al mes)</small></li></ul></div>
        <CodecPreview />
        <CheckoutFaq />
        <div className="hco-summary-footer"><span>Cancela cuando quieras</span><span aria-hidden="true">·</span><span>Confirmación directa por WhatsApp</span></div>
      </aside>
      <div className="hco-form"><div className="hco-form-inner">
        <h1 id="hco-title">Pagar por WhatsApp</h1>
        <div className="hco-field"><label htmlFor="hco-cedula">Número de cédula</label>
          <input ref={identity} id="hco-cedula" inputMode="numeric" autoComplete="off" maxLength={13} placeholder="000-0000000-0" value={cedula} aria-describedby="hco-cedula-hint" aria-invalid={rd && cedula.length > 0 && !order.valid} onChange={e => setCedula(formatCedula(e.target.value))} />
          <small id="hco-cedula-hint">{rd ? order.valid ? 'Formato completo: 11 dígitos. No verifica tu identidad.' : 'Requerida para facturar en RD: 11 dígitos.' : 'No se requiere para otro país; no se incluye en el mensaje.'}</small>
        </div>
        <div className="hco-field" role="group" aria-label="País de facturación"><span>País de facturación</span><div className="hco-choice">
          <button type="button" aria-pressed={rd} onClick={() => setRd(true)}><DominicanFlag />República Dominicana</button>
          <button type="button" aria-pressed={!rd} onClick={() => setRd(false)}>Otro país</button>
        </div></div>
        <ol className="hco-steps">{[
          'Pulsa el botón: se abre WhatsApp con tu pedido ya escrito (plan, período, país y total).',
          'Envía el mensaje. Un asesor de Hashcod te responde con las instrucciones de pago.',
          'Al confirmar tu pago, el asesor te envía un código. Valídalo aquí para activar tu suscripción.',
        ].map((text, i) => <li key={text}><span>{i + 1}</span><p>{text}</p></li>)}</ol>
        <a className="hco-pay" href={reference ? order.href : undefined} aria-disabled={!order.valid || !reference} target="_blank" rel="noopener noreferrer" onClick={e => { if (!order.valid || !reference) { e.preventDefault(); identity.current?.focus(); } }}><WhatsappIcon />Pagar {order.amount} por WhatsApp</a>
        <div className="hco-verification hco-field"><label htmlFor="hco-otp">Código de verificación del pago</label>
          <p>Después de pagar, el asesor te enviará por WhatsApp un código de 6 dígitos. Escríbelo aquí para activar tu suscripción. Caduca en 15 minutos y solo funciona en esta sesión.</p>
          <input id="hco-otp" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="······" value={otp} onChange={e => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setOtpMessage(''); }} />
          <button type="button" className="hco-verify" disabled={otp.length !== 6 || busy || !reference} onClick={verify}>{busy ? 'Verificando…' : 'Verificar pago'}</button>
          <span className="hco-otp-status" role="status">{otpMessage || (otp.length > 0 && otp.length < 6 ? `Faltan ${6 - otp.length} dígitos.` : '')}</span>
        </div>
        <div className="hco-field hco-fiscal" role="group" aria-label="Comprobante fiscal"><span>¿Quieres comprobante fiscal?</span><div className="hco-choice">
          <button type="button" aria-pressed={fiscal} onClick={() => setFiscal(true)}>Sí</button>
          <button type="button" aria-pressed={!fiscal} onClick={() => setFiscal(false)}>No</button>
        </div><small>{fiscal ? 'Se solicitará con tu pedido. El asesor te pedirá por WhatsApp los datos para emitirlo.' : 'Se emitirá solo el recibo de pago, sin comprobante fiscal.'}</small></div>
        <div className="hco-divider"><span />o<span /></div>
        <button type="button" className="hco-free" onClick={onEnter} disabled={busy}>{busy ? 'Entrando…' : 'Entrar Gratis'}</button>
        <p className="hco-free-note">El acceso gratuito permite explorar la presentación y los planes. Toolbook, herramientas, nube y PSOT requieren un código de pago válido.</p>
        {error && <p className="hco-error" role="alert">{error}</p>}
        <p className="hco-knowledge">¿No tienes dinero para pagar? ¡Paga con tu conocimiento en el área de software!</p>
        <p className="hco-privacy">La cédula se pide para la coordinación de facturación y solo se incluye en el mensaje de WhatsApp si seleccionas República Dominicana. No se guarda en la plataforma. No pedimos datos de tarjeta y nunca compartas contraseñas por WhatsApp.</p>
        <a className="hco-policy" href="/privacy" target="_blank" rel="noopener noreferrer">Use and Privacy Policy</a>
        <div className="hco-domain"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>hashcodcodespace.dev</div>
        <div className="hco-business"><span>RNC: <strong>402-0936929-3</strong></span><span>Registro Mercantil: <strong>3323LV-PF</strong></span></div>
      </div></div>
    </section>
  </div>, document.body);
}
