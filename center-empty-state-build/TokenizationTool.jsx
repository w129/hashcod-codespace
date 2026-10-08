import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, useReducedMotion } from 'motion/react';
import { FileValueBadge } from './FileValue';
import LoadingState from './LoadingState';
import './tokenization.css';

export function TokenizationIcon() {
  return <svg className="htk-tool-icon" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor" stroke="none"><path d="M 12 1.1894531 L 11.341797 1.5976562 L 9.3476562 2.8339844 L 6.2324219 3.0625 L 5.0546875 5.953125 L 2.6679688 7.96875 L 3.4140625 11 L 2.6679688 14.03125 L 3.5 14.732422 L 0 18.232422 L 0 19.714844 L 3.2539062 20.746094 L 4.2851562 24 L 5.7675781 24 L 10.121094 19.646484 L 12 20.810547 L 13.878906 19.646484 L 18.232422 24 L 19.714844 24 L 20.746094 20.746094 L 24 19.714844 L 24 18.232422 L 20.5 14.732422 L 21.332031 14.03125 L 20.585938 11 L 21.332031 7.96875 L 18.945312 5.953125 L 17.767578 3.0625 L 14.652344 2.8339844 L 12 1.1894531 z M 12 4.1308594 L 13.857422 5.2832031 L 16.037109 5.4414062 L 16.863281 7.4667969 L 18.533203 8.8769531 L 18.009766 11 L 18.533203 13.123047 L 16.863281 14.533203 L 16.037109 16.558594 L 13.857422 16.716797 L 12 17.869141 L 10.142578 16.716797 L 7.9628906 16.558594 L 7.1367188 14.533203 L 5.4667969 13.123047 L 5.9902344 11 L 5.4667969 8.8769531 L 7.1367188 7.4667969 L 7.9628906 5.4414062 L 10.142578 5.2832031 L 12 4.1308594 z M 12 7 C 10.770834 7 9.6913304 7.5059445 9.0039062 8.2792969 C 8.3164822 9.0526493 8 10.034722 8 11 C 8 11.965278 8.3164822 12.947351 9.0039062 13.720703 C 9.6913304 14.494056 10.770834 15 12 15 C 13.229166 15 14.30867 14.494056 14.996094 13.720703 C 15.683518 12.947351 16 11.965278 16 11 C 16 10.034722 15.683518 9.0526493 14.996094 8.2792969 C 14.30867 7.5059445 13.229166 7 12 7 z M 12 9.5 C 12.604166 9.5 12.899664 9.6815555 13.128906 9.9394531 C 13.358148 10.197351 13.5 10.590278 13.5 11 C 13.5 11.409722 13.358148 11.802649 13.128906 12.060547 C 12.899664 12.318444 12.604166 12.5 12 12.5 C 11.395834 12.5 11.100336 12.318444 10.871094 12.060547 C 10.641852 11.802649 10.5 11.409722 10.5 11 C 10.5 10.590278 10.641852 10.197351 10.871094 9.9394531 C 11.100336 9.6815555 11.395834 9.5 12 9.5 z M 5.2480469 16.519531 L 6.2324219 18.9375 L 7.2226562 19.009766 L 5.7832031 20.449219 L 5.2460938 18.753906 L 3.5507812 18.216797 L 5.2480469 16.519531 z M 18.751953 16.519531 L 20.449219 18.216797 L 18.753906 18.753906 L 18.216797 20.449219 L 16.777344 19.009766 L 17.767578 18.9375 L 18.751953 16.519531 z" /></svg>;
}
function SendIcon() {
  return <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M 22 2 L 2 9.2714844 L 14.728516 22 L 22 2 z M 18.65625 5.34375 L 13.921875 18.365234 L 10.578125 15.021484 L 15.636719 8.3632812 L 8.9785156 13.421875 L 5.6347656 10.078125 L 18.65625 5.34375 z" /></svg>;
}
const REQUEST_STATES = { pending: 'Pendiente', in_progress: 'En curso', delayed: 'Retrasada', awaiting_payment: 'Falta de pago', completed: 'Completada', under_review: 'En revisión', certified: 'Certificada', rejected: 'Rechazada' };
function bytes(size) { return size < 1048576 ? `${(size / 1024).toFixed(1)} KB` : `${(size / 1048576).toFixed(1)} MB`; }

export default function TokenizationTool({ files, loading, onRefresh, onClose }) {
  const [view, setView] = useState('files'), [selected, setSelected] = useState(null);
  const [phone, setPhone] = useState(''), [email, setEmail] = useState(''), [code, setCode] = useState(''), [key, setKey] = useState('');
  const [rows, setRows] = useState([]), [offset, setOffset] = useState(0), [more, setMore] = useState(false), [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const [submitted, setSubmitted] = useState(new Set());
  const [revokeId,setRevokeId]=useState(''),[revokeReason,setRevokeReason]=useState('');
  const dialog = useRef(null), pending = useRef(false), controller = useRef(null), alive = useRef(true), expiry = useRef(null);
  const reduce = useReducedMotion();
  useEffect(() => () => { alive.current = false; controller.current?.abort(); clearTimeout(expiry.current); }, []);
  useLayoutEffect(() => {
    const previousFocus = document.activeElement;
    const targets = Array.from(document.querySelectorAll('body > main, body > footer'));
    const states = targets.map(n => n.inert), overflow = document.body.style.overflow;
    targets.forEach(n => { n.inert = true; }); document.body.style.overflow = 'hidden';
    return () => { targets.forEach((n, i) => { n.inert = document.body.classList.contains('hpa-locked') ? true : states[i]; }); document.body.style.overflow = overflow; previousFocus?.focus?.(); };
  }, []);
  useLayoutEffect(() => { (dialog.current?.querySelector('[data-autofocus]') || dialog.current?.querySelector('button'))?.focus(); }, [view]);
  const reset = () => { setError(''); setCode(''); setKey(''); };
  async function request(body) {
    controller.current = new AbortController();
    const timeout = setTimeout(() => controller.current?.abort(), 35000);
    try {
      const response = await fetch('/api/hashcod-tokenization', { method: 'POST', credentials: 'same-origin', cache: 'no-store', signal: controller.current.signal,
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' }, body: JSON.stringify(body) });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        if (['list', 'update'].includes(body.action) && response.status === 403 && alive.current) { setRows([]); setView('auth'); }
        throw new Error(data.error || 'No se pudo completar la operación.');
      }
      return data;
    } finally { clearTimeout(timeout); }
  }
  async function run(work) {
    if (pending.current) return;
    pending.current = true; setBusy(true); setError(''); setNotice('');
    try { await work(); } catch (reason) { if (alive.current) setError(reason.name === 'AbortError' ? 'La conexión tardó demasiado. Intenta de nuevo.' : reason.message); }
    finally { pending.current = false; if (alive.current) setBusy(false); }
  }
  async function page(next) {
    const data = await request({ action: 'list', offset: next });
    if (!alive.current) return;
    setRows(data.requests); setMore(data.hasMore); setOffset(next); setView('requests');
  }
  async function changeStatus(row, status) {
    if (status === row.status) return;
    await run(async () => {
      const data = await request({ action: 'update', id: row.id, status, expectedStatus: row.status || 'pending' });
      if (!alive.current) return;
      setRows(current => current.map(item => item.id === data.request.id ? { ...item, ...data.request } : item));
      setNotice(`Estado guardado: ${REQUEST_STATES[data.request.status]}.`);
    });
  }
  async function revokeCertificate(row) {
    await run(async()=>{
      const session=await fetch('/api/hashcod-review',{credentials:'same-origin',cache:'no-store'}).then(r=>r.json());
      if(!session.ok)throw new Error(session.error||'No se pudo verificar la sesión.');
      const response=await fetch('/api/hashcod-review',{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json','X-Requested-With':'XMLHttpRequest','X-Hashcod-Review-CSRF':session.csrf},body:JSON.stringify({action:'revoke',id:row.certificateId,reason:revokeReason})});
      const data=await response.json();if(!response.ok||!data.ok)throw new Error(data.error||'No se pudo revocar el certificado.');
      if(!alive.current)return;setRevokeId('');setRevokeReason('');setRows(current=>current.map(r=>r.id===row.id?{...r,certificateId:null}:r));setNotice('Certificado revocado.');
    });
  }
  const visible = rows.filter(row => [row.name, row.email, row.phone].some(value => value.toLowerCase().includes(search.toLowerCase())));
  return createPortal(<div className="htk-backdrop" onMouseDown={event => { if (event.target === event.currentTarget && !busy) onClose(); }}>
    <motion.section ref={dialog} id="d5TokenizationTool" className={`htk-shell ${view === 'requests' ? 'htk-shell--wide' : ''}`} role="dialog" aria-modal="true" aria-labelledby="htk-title"
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10, scale: .985 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: reduce ? 0 : .2 }}
      onKeyDown={event => {
        if (event.key === 'Escape') { event.preventDefault(); if (!busy) onClose(); }
        if (event.key !== 'Tab') return;
        const nodes = Array.from(dialog.current.querySelectorAll('button,input,select')).filter(n => !n.disabled);
        if (event.shiftKey && document.activeElement === nodes[0]) { event.preventDefault(); nodes.at(-1)?.focus(); }
        else if (!event.shiftKey && document.activeElement === nodes.at(-1)) { event.preventDefault(); nodes[0]?.focus(); }
      }}>
      <header className="htk-header"><div className="htk-title-group"><span className="htk-mark"><TokenizationIcon /></span><div><span className="htk-eyebrow">Hashcod · Tokenización</span>
        <h2 id="htk-title">{view === 'requests' ? 'Solicitudes' : view === 'auth' ? 'Área privada de solicitudes' : view === 'contact' ? 'Enviar solicitud' : 'Solicitar tokenización'}</h2></div></div>
        <button className="htk-icon-button" type="button" aria-label="Cerrar tokenización" disabled={busy} onClick={onClose}>×</button></header>
      {error && <p className="htk-error" role="alert">{error}</p>}
      {notice && ['files', 'requests'].includes(view) && <p className="htk-notice" role="status">{notice}</p>}
      {view === 'files' && <><div className="htk-card-bar"><span>Archivos disponibles</span><button type="button" className="htk-button" disabled={loading} onClick={onRefresh}>Actualizar</button></div>
        <div className="htk-scroll"><table className="htk-files-table"><thead><tr><th>Archivo</th><th>Estado</th><th><span className="htk-sr-only">Enviar</span></th></tr></thead>
          <tbody>{files.map(file => <tr key={file.id} data-htk-file-id={file.id} className={submitted.has(file.id) ? 'htk-sent-row' : ''}>
            <td><span className="htk-file-name" title={file.name}>{file.name}</span><span className="htk-muted">{bytes(file.size)} <FileValueBadge cents={file.priceUsdCents} /></span></td>
            <td><span className={`htk-pill ${file.cloud ? 'htk-pill--green' : ''}`}>{submitted.has(file.id) ? 'Enviada' : file.cloud ? 'Disponible' : 'Solo en este equipo'}</span></td>
            <td><button type="button" className="htk-send" aria-label={`Solicitar tokenización de ${file.name}`} title={file.cloud ? 'Enviar solicitud' : 'Espera a que el archivo se guarde en la nube'} disabled={!file.cloud || submitted.has(file.id)}
              onClick={() => { reset(); setSelected(file); setView('contact'); }}><SendIcon /></button></td>
          </tr>)}</tbody></table>
          {loading && <div className="htk-empty"><LoadingState label="Cargando archivos" /></div>}
          {!loading && !files.length && <p className="htk-empty">Todavía no hay archivos. Sube uno desde Files para comenzar.</p>}
        </div><footer className="htk-footer"><span className="htk-muted">{files.length} archivos · Las solicitudes quedan pendientes de revisión.</span>
          <button type="button" className="htk-button" onClick={() => { reset(); setNotice(''); setView('auth'); }}>Área de solicitudes ↗</button></footer></>}
      {view === 'contact' && <form onSubmit={event => { event.preventDefault(); run(async () => {
        const data = await request({ action: 'submit', id: selected.id, phone, email, code });
        if (!alive.current) return;
        setSubmitted(current => new Set([...current, selected.id])); setCode(''); setPhone(''); setEmail('');
        setNotice(`Solicitud guardada: ${selected.name}. Pendiente de revisión (${data.request.id.slice(0, 8)}).`); setView('files');
      }); }}>
        <div className="htk-form-body"><p className="htk-selected"><span className="htk-file-mark">↗</span><span>{selected.name}<small>{bytes(selected.size)}</small></span></p>
          <p className="htk-muted">Introduce tus datos de contacto y el código que se eligió al subir este archivo.</p>
          <label htmlFor="htk-phone">Número de teléfono</label><input data-autofocus id="htk-phone" type="tel" autoComplete="tel" placeholder="+1 809 555 1234" required maxLength={32} disabled={busy} value={phone} onChange={e => setPhone(e.target.value)} />
          <label htmlFor="htk-email">Correo electrónico</label><input id="htk-email" type="email" autoComplete="email" placeholder="tu@correo.com" required maxLength={254} disabled={busy} value={email} onChange={e => setEmail(e.target.value)} />
          <label htmlFor="htk-code">Código TOTP del archivo</label><input id="htk-code" type="password" autoComplete="off" required maxLength={128} disabled={busy} value={code} onChange={e => setCode(e.target.value)} />
          <p className="htk-muted">El teléfono y el correo se guardarán únicamente en el área privada de solicitudes.</p></div>
        <footer className="htk-footer"><button className="htk-button" type="button" disabled={busy} onClick={() => { reset(); setView('files'); }}>Volver</button>
          <button className="htk-button htk-button--accent" type="submit" disabled={busy}>{busy ? <LoadingState label="Enviando" /> : <><SendIcon /> Enviar solicitud</>}</button></footer>
      </form>}
      {view === 'auth' && <form onSubmit={event => { event.preventDefault(); run(async () => {
        const data = await request({ action: 'auth', key }); if (!alive.current) return; setKey('');
        clearTimeout(expiry.current); expiry.current = setTimeout(() => { setRows([]); setView('auth'); setError('Tu sesión privada terminó. Introduce la clave de nuevo.'); }, Math.max(0, data.expiresAt * 1000 - Date.now()));
        await page(0);
      }); }}><div className="htk-form-body"><span className="htk-pill">Acceso protegido</span><p className="htk-muted">Introduce la clave para consultar los archivos enviados y sus datos de contacto.</p>
          <label htmlFor="htk-admin-key">Clave del área de solicitudes</label><input data-autofocus id="htk-admin-key" type="password" autoComplete="off" maxLength={8192} required value={key} disabled={busy} onChange={event => setKey(event.target.value)} /></div>
          <footer className="htk-footer"><button className="htk-button" type="button" disabled={busy} onClick={() => { reset(); setView('files'); }}>Volver a archivos</button><button className="htk-button htk-button--primary" type="submit" disabled={busy}>{busy ? 'Verificando…' : 'Ver solicitudes'}</button></footer></form>}
      {view === 'requests' && <><div className="htk-card-bar"><input className="htk-search" aria-label="Buscar en esta página" placeholder="Buscar archivo, correo o teléfono…" value={search} onChange={e => setSearch(e.target.value)} />
        <button type="button" className="htk-button" disabled={busy} onClick={() => run(() => page(offset))}>Actualizar</button></div>
        <div className="htk-scroll htk-records-scroll"><table className="htk-records-table"><thead><tr>{['Archivo', 'Correo', 'Teléfono', 'Fecha', 'Estado'].map(label => <th key={label}>{label}</th>)}</tr></thead><tbody data-sound-silent>
          {visible.map((row, i) => <tr key={row.id} data-htk-request-id={row.id}><td data-label="Archivo"><span className="htk-record-name"><span className="htk-rownum">{offset + i + 1}</span><span className="htk-file-mark">{row.name.slice(0, 1).toUpperCase()}</span><span>{row.name}</span></span><small>{bytes(row.size)} · {row.mime}<FileValueBadge cents={row.priceUsdCents} />{!row.fileAvailable && ' · Archivo eliminado'}</small><small title={row.id}>ID: {row.id.slice(0, 8)}</small></td>
            <td data-label="Correo">{row.email}</td><td data-label="Teléfono">{row.phone}</td><td data-label="Fecha">{new Date(row.createdAt).toLocaleString('es-DO')}</td><td data-label="Estado"><select className={`htk-status-select htk-status-select--${row.status || 'pending'}`} aria-label={`Estado de solicitud ${row.id.slice(0, 8)}: ${row.name}`} disabled={busy} value={row.status || 'pending'} onChange={event => changeStatus(row, event.target.value)}>{Object.entries(REQUEST_STATES).map(([value, label]) => <option key={value} value={value} disabled={['under_review','certified','rejected'].includes(value)}>{label}</option>)}</select>{row.certificateId&&<a href={'/api/hashcod-review/verify?id='+encodeURIComponent(row.certificateId)} target="_blank" rel="noopener noreferrer">Ver certificado</a>}{row.certificateId&&<button type="button" disabled={busy} onClick={()=>{setRevokeId(row.id);setRevokeReason('');}}>Revocar certificado</button>}{revokeId===row.id&&row.certificateId&&<div><input aria-label="Motivo de revocación" value={revokeReason} maxLength={500} onChange={e=>setRevokeReason(e.target.value)}/><button type="button" disabled={busy||!revokeReason.trim()} onClick={()=>revokeCertificate(row)}>Guardar revocación</button></div>}</td></tr>)}
        </tbody></table>{!visible.length && <p className="htk-empty">{rows.length ? 'No hay coincidencias en esta página.' : 'Todavía no hay solicitudes.'}</p>}</div>
        <footer className="htk-footer"><span className="htk-muted">{rows.length} registros · página {offset / 50 + 1}</span><span className="htk-footer-actions"><button className="htk-button" type="button" disabled={busy || !offset} onClick={() => run(() => page(offset - 50))}>Anterior</button><button className="htk-button" type="button" disabled={busy || !more} onClick={() => run(() => page(offset + 50))}>Siguiente</button>
          <button className="htk-button" type="button" disabled={busy} onClick={() => run(async () => { await request({ action: 'logout' }); setRows([]); clearTimeout(expiry.current); setView('files'); })}>Cerrar sesión</button></span></footer></>}
    </motion.section>
  </div>, document.body);
}
