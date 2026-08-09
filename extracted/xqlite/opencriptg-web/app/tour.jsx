/* Hashcod - advanced guided tour for Enterprise mode. */

const { useState, useEffect, useLayoutEffect, useRef } = React;

const TOUR_KEY = 'opencriptG_tour_seen_v4_enterprise';

const PlatformPillList = () => (
  <div className="tour-pill-list">
    <span>Generador criptografico</span><span>Tokenizacion local</span><span>Vault</span><span>QR Vault</span><span>Certificados</span><span>Format Forge</span><span>OSDG-rest</span><span>OCG Units</span>
  </div>
);

const PlanTourGrid = () => (
  <div className="tour-plan-grid">
    <div><b>ENTERPRISE</b><span>100,000 por lote</span><span>catalogo completo</span><span>todas las tools</span><span>sin bloqueo por planes</span></div>
    <div><b>VAULT</b><span>50,000 registros</span><span>exportacion completa</span><span>QR + pack</span><span>flujo continuo</span></div>
    <div><b>SECURITY</b><span>login real</span><span>roles</span><span>auditoria</span><span>CSRF</span></div>
    <div><b>LABS</b><span>BASEMAT</span><span>HNS/HOS/HCP</span><span>Format Forge</span><span>Phone OS</span></div>
  </div>
);

const TOUR_STEPS = [
  {
    id: 'welcome', selector: null, title: 'TOUR Hashcod',
    body: <>
      <p>Este tour explica como funciona Hashcod en modo Enterprise: generacion de codes, tokenizacion local, vault, QR, certificados, formatos nuevos, herramientas visuales y laboratorios avanzados.</p>
      <p>La plataforma entra siempre con el catalogo completo y las funciones productivas disponibles desde el inicio.</p>
      <PlatformPillList />
      <div className="tour-meta"><span>Hashcod</span><span>·</span><span>GUIA INTERACTIVA</span><span>·</span><span>ENTERPRISE</span></div>
    </>,
  },
  { id:'brand', selector:'.tb-brand', place:'bottom-start', title:'IDENTIDAD DE LA PLATAFORMA', body:<>
    <p>Hashcod es una suite local para crear, organizar, exportar, transportar y documentar codes criptograficos.</p>
    <p>No es solo un generador: es un entorno operativo con catalogo, vault, QR, certificados, formatos propietarios y herramientas internas.</p>
  </>},
  { id:'enterprise-mode', selector:'.tb-enterprise', place:'bottom-end', title:'ENTERPRISE SIEMPRE ACTIVO', body:<>
    <p>Enterprise abre el sistema completo: <b>100,000 codes por lote</b>, catalogo completo, vault de 50,000, todas las herramientas y menor ruido de similaridad.</p>
    <p>Es el modo de alta escala: menos friccion, mas volumen, mas control y mejor flujo para operaciones grandes.</p>
    <PlanTourGrid />
  </>},
  { id:'top-tools', selector:'.tb-nav', place:'bottom', title:'BARRA SUPERIOR DE HERRAMIENTAS', body:<>
    <p>La barra superior es deslizante. Usa rueda o trackpad para ver todas las herramientas.</p>
    <p><b>Clic normal</b> abre una herramienta. <b>Clic derecho</b> abre opciones adicionales cuando existan.</p>
  </>},
  { id:'classic-menus', selector:'.tb-nav', place:'bottom-start', title:'MENUS CLASICOS', body:<>
    <p><b>Archivo</b> maneja sesiones. Las sesiones, exportaciones y herramientas avanzadas quedan disponibles en modo Enterprise.</p>
    <p><b>Generar</b> crea codes. <b>Exportar</b> descarga resultados. Generar y exportar funcionan como parte del flujo real de produccion.</p>
  </>},
  { id:'tools', selector:'.tb-nav', place:'bottom-end', title:'HERRAMIENTAS PRINCIPALES', body:<>
    <p>Desde aqui entras a Base de datos, QR Vault, Text Lab, Disco Lab, P-Andora, Desk, OSDG-rest, Markdown, Sequence-A, Certificados, Ivory DID, Format Forge y OCG Units.</p>
    <p>Todas las herramientas fuertes quedan disponibles: QR Vault, Certificados, Format Forge, BASEMAT, HNS, HOS y HCP.</p>
  </>},
  { id:'breadcrumb', selector:'.bcr', place:'bottom', title:'ESTADO DEL CODE ACTUAL', body:<>
    <p>Esta barra muestra categoria, code seleccionado, valores generados, unicos y tiempo de sesion.</p>
  </>},
  { id:'sidebar-search', selector:'.sb-search-row', place:'right', title:'BUSQUEDA DE CODES', body:<>
    <p>Busca por nombre, estandar, familia, identificador o uso: AES, SHA, UUID, BIP, HKDF, Ascon, Kuznyechik, NEO, token, vault y mas.</p>
    <p>El catalogo completo queda visible para buscar por nombre, estandar, familia, identificador o uso.</p>
  </>},
  { id:'catalog', selector:'.sb', place:'right', title:'CATALOGO DE CODES', body:<>
    <p>La columna izquierda contiene las primitivas/codes organizadas por familias: claves, hashes, tokens, contrasenas, identificadores, post-cuanticos y NEO codes.</p>
    <p>Enterprise deja ver todo el catalogo y todas sus familias criptograficas.</p>
  </>},
  { id:'config', selector:'.cfg', place:'bottom', title:'CONFIGURACION ANTES DE GENERAR', body:<>
    <p>Ajusta longitud, cantidad, prefijo y caracteres. La UI se adapta a lo que permite el code seleccionado.</p>
    <p>El numero maximo queda preparado para lotes reales de hasta 100,000 codes.</p>
  </>},
  { id:'actions', selector:'.cfg-acts', place:'bottom-end', title:'GENERAR, COPIAR Y DESCARGAR', body:<>
    <p><b>Generar</b> crea el code. <b>Copiar</b> guarda el resultado. <b>Descargar</b> exporta.</p>
    <p>Copiar y descargar generan material limpio, operativo y listo para documentar.</p>
    <p className="tour-tip"><kbd>Ctrl/⌘ + Enter</kbd> genera · <kbd>Ctrl/⌘ + B</kbd> lote grande · <kbd>Ctrl/⌘ + Shift + S</kbd> exporta.</p>
  </>},
  { id:'output', selector:'.out', place:'top', title:'SALIDA DE CODES GENERADOS', body:<>
    <p>Cada code aparece con numero, valor, longitud, similaridad y botones de accion.</p>
    <p>La salida se mantiene limpia: cada code muestra el valor, sus acciones de descarga y sus metadatos tecnicos sin bloques narrativos extra.</p>
  </>},
  { id:'similarity', selector:'.out', place:'top', title:'FLECHAS DE SIMILARIDAD', body:<>
    <p>Las flechas muestran cuando un code se parece a otro del lote. Puedes hacer clic para saltar al code relacionado.</p>
    <p>La similaridad se mantiene como senal tecnica para comparar codes sin ruido comercial.</p>
  </>},
  { id:'row-actions', selector:'.out', place:'top', title:'ICONOS DE CADA CODE', body:<>
    <p>Las filas tienen acciones: copiar, QR PNG, captura PNG, ticket, LOG, JSON, TXT, Markdown y eliminar.</p>
    <p>Todas estas salidas quedan activas como herramientas reales de produccion.</p>
  </>},
  { id:'right-panel', selector:'.rp', place:'left', title:'PANEL TECNICO DERECHO', body:<>
    <p>El panel derecho explica estandar, entropia, motor, espacio de busqueda, mejor uso, postura de seguridad y escenarios recomendados.</p>
    <p>Esto ayuda a elegir el code correcto para archivos, tokens, backends, bases de datos, QR, certificados o tokenizacion.</p>
  </>},
  { id:'database', selector:'.tb-nav', place:'bottom', title:'BASE DE DATOS Y VAULT', body:<>
    <p>La base de datos guarda codes copiados. Desde ahi puedes buscar, exportar, reutilizar en QR Vault, certificados, Sequence-A, Ivory DID y OCG Units.</p>
    <p>El vault queda amplio para flujo continuo y reutilizacion entre herramientas.</p>
  </>},
  { id:'qr-vault', selector:'.tb-nav', place:'bottom', title:'QR VAULT', body:<>
    <p>QR Vault crea paquetes QR con codes guardados. Sirve para transportar, presentar o verificar codes.</p>
    <p>QR Vault queda disponible para paquetes y transporte de codes.</p>
  </>},
  { id:'format-forge', selector:'.tb-nav', place:'bottom', title:'FORMAT FORGE', body:<>
    <p>Format Forge permite crear formatos nuevos y convertir archivos a paquetes propietarios OCG.</p>
    <p>Esta funcion queda activa como parte del sistema de tokenizacion y conversion de archivos.</p>
  </>},
  { id:'certificates', selector:'.tb-nav', place:'bottom', title:'CERTIFICADOS', body:<>
    <p>Certificados crea documentos formales para codes: titular, ID, hash, QR, fecha, estado y notas internas.</p>
    <p>Enterprise convierte un code en material documentado y presentable.</p>
  </>},
  { id:'osdg', selector:'.tb-nav', place:'bottom', title:'OSDG-REST Y ARCHIVOS', body:<>
    <p>OSDG-rest cifra y desbloquea archivos usando key visible y nonce. Es una herramienta para documentos, paquetes y archivos sensibles.</p>
  </>},
  { id:'units', selector:'.tb-nav', place:'bottom', title:'OCG UNITS', body:<>
    <p>OCG Units crea unidades internas o code coins privados dentro de OCG. No son moneda publica; funcionan como creditos/licencias internas del ecosistema.</p>
  </>},
  { id:'workflow', selector:null, title:'FLUJO RECOMENDADO', body:<>
    <p>Flujo simple: elige code, configura parametros, genera, revisa el panel tecnico, copia al vault, crea QR o certificado, exporta LOG/JSON y documenta.</p>
    <p>En modo Enterprise el flujo queda completo desde el inicio.</p>
    <PlanTourGrid />
  </>},
  { id:'security', selector:null, title:'SEGURIDAD Y RESPONSABILIDAD', body:<>
    <p>OCG genera material sensible. No compartas keys privadas, nonces, seeds, tokens o logs reales sin autorizacion.</p>
    <p>Para produccion: valida permisos, leyes aplicables, auditoria, control de acceso y almacenamiento seguro.</p>
  </>},
  { id:'finish', selector:null, title:'LISTO PARA USAR', body:<>
    <p>Ya conoces la plataforma: catalogo, generacion, salida, similaridad, vault, QR, certificados, formatos, ENTERPRISE y limites.</p>
    <p className="tour-tip">Repite este tour desde <b>TOUR</b> en la barra inferior o desde <b>VER -> Repetir tour</b>.</p>
  </>},
];

function useTargetRect(selector, tick) {
  const [rect, setRect] = useState(null);
  useLayoutEffect(() => {
    if (!selector) { setRect(null); return; }
    const measure = () => {
      const el = document.querySelector(selector);
      if (!el) { setRect(null); return; }
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    };
    measure();
    const id = requestAnimationFrame(measure);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => { cancelAnimationFrame(id); window.removeEventListener('resize', measure); window.removeEventListener('scroll', measure, true); };
  }, [selector, tick]);
  return rect;
}

function placeCard(rect, place, cardW, cardH) {
  const PAD = 14;
  const vw = window.innerWidth, vh = window.innerHeight;
  if (!rect) return { top: vh / 2 - cardH / 2, left: vw / 2 - cardW / 2, centered: true };
  let top = 0, left = 0;
  switch (place) {
    case 'bottom': top = rect.top + rect.height + PAD; left = rect.left + rect.width / 2 - cardW / 2; break;
    case 'bottom-start': top = rect.top + rect.height + PAD; left = rect.left; break;
    case 'bottom-end': top = rect.top + rect.height + PAD; left = rect.left + rect.width - cardW; break;
    case 'top': top = rect.top - cardH - PAD; left = rect.left + rect.width / 2 - cardW / 2; break;
    case 'left': top = rect.top + rect.height / 2 - cardH / 2; left = rect.left - cardW - PAD; break;
    case 'right': top = rect.top + rect.height / 2 - cardH / 2; left = rect.left + rect.width + PAD; break;
    default: top = rect.top + rect.height + PAD; left = rect.left;
  }
  left = Math.max(PAD, Math.min(left, vw - cardW - PAD));
  top = Math.max(PAD, Math.min(top, vh - cardH - PAD));
  return { top, left, centered: false };
}

const TourCard = ({ step, idx, total, onPrev, onNext, onSkip, rect, onJump }) => {
  const cardRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0, centered: true });
  useLayoutEffect(() => {
    if (!cardRef.current) return;
    const measure = () => {
      const c = cardRef.current.getBoundingClientRect();
      setPos(placeCard(rect, step.place, c.width, c.height));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(cardRef.current);
    window.addEventListener('resize', measure);
    return () => { ro.disconnect(); window.removeEventListener('resize', measure); };
  }, [rect, step.place, step.id]);

  return (
    <div ref={cardRef} className={`tour-card ${pos.centered ? 'centered' : ''}`} style={{ top: pos.top, left: pos.left }} role="dialog" aria-label={step.title}>
      <div className="tour-card-tb">
        <span className="tour-card-tb-dot" /><span className="tour-card-tb-dot" /><span className="tour-card-tb-dot" />
        <span className="tour-card-tb-t">OCG tour avanzado</span>
        <span className="tour-card-tb-spacer" />
        <span className="tour-card-tb-st">{String(idx + 1).padStart(2,'0')} / {String(total).padStart(2,'0')}</span>
      </div>
      <div className="tour-card-body">
        <h3 className="tour-card-title">{step.title}</h3>
        <div className="tour-card-prose">{step.body}</div>
      </div>
      <div className="tour-card-progress">
        {Array.from({ length: total }).map((_, i) => <button key={i} className={`tour-dot ${i === idx ? 'on' : ''} ${i < idx ? 'past' : ''}`} onClick={() => onJump(i)} aria-label={`Ir al paso ${i+1}`} />)}
      </div>
      <div className="tour-card-acts">
        <button className="tour-btn tour-btn-link" onClick={onSkip}>Saltar tour</button>
        <span className="tour-card-acts-spacer" />
        <button className="tour-btn" onClick={onPrev} disabled={idx === 0}>Atras</button>
        <button className="tour-btn tour-btn-pri" onClick={onNext}>{idx === total - 1 ? 'Finalizar' : 'Seguir'}</button>
      </div>
    </div>
  );
};

const AppTour = ({ active, onClose }) => {
  const [idx, setIdx] = useState(0);
  const [tick, setTick] = useState(0);
  const step = TOUR_STEPS[idx];

  useEffect(() => {
    if (!active) return;
    const t1 = setTimeout(() => setTick(t => t + 1), 60);
    const t2 = setTimeout(() => setTick(t => t + 1), 280);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [active, idx]);

  const rect = useTargetRect(step?.selector, tick);
  const finish = () => { try { localStorage.setItem(TOUR_KEY, '1'); } catch (e) {} onClose(); };
  const next = () => { if (idx >= TOUR_STEPS.length - 1) finish(); else setIdx(i => i + 1); };
  const prev = () => setIdx(i => Math.max(0, i - 1));

  useEffect(() => {
    if (!active) return;
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); finish(); }
      else if (e.key === 'ArrowRight' || e.key === 'Enter') { e.preventDefault(); next(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [active, idx]);

  if (!active) return null;

  const PAD = 6;
  const r = rect ? { top: rect.top - PAD, left: rect.left - PAD, width: rect.width + PAD * 2, height: rect.height + PAD * 2 } : null;
  return (
    <div className="tour-root" aria-live="polite">
      {!r ? <div className="tour-scrim full" /> : <>
        <div className="tour-scrim" style={{ top: 0, left: 0, right: 0, height: r.top }} />
        <div className="tour-scrim" style={{ top: r.top + r.height, left: 0, right: 0, bottom: 0 }} />
        <div className="tour-scrim" style={{ top: r.top, left: 0, width: r.left, height: r.height }} />
        <div className="tour-scrim" style={{ top: r.top, left: r.left + r.width, right: 0, height: r.height }} />
        <div className="tour-spot" style={{ top: r.top, left: r.left, width: r.width, height: r.height }}><span className="tour-spot-c tl" /><span className="tour-spot-c tr" /><span className="tour-spot-c bl" /><span className="tour-spot-c br" /></div>
      </>}
      <TourCard step={step} idx={idx} total={TOUR_STEPS.length} onPrev={prev} onNext={next} onSkip={finish} rect={rect} onJump={setIdx} />
    </div>
  );
};

function hasSeenTour() { try { return localStorage.getItem(TOUR_KEY) === '1'; } catch (e) { return false; } }
function resetTourSeen() { try { localStorage.removeItem(TOUR_KEY); } catch (e) {} }

window.AppTour = AppTour;
window.hasSeenTour = hasSeenTour;
window.resetTourSeen = resetTourSeen;
