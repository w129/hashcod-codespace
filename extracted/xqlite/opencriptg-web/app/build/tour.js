(function () {
const {
  useState,
  useEffect,
  useLayoutEffect,
  useRef
} = React;
const TOUR_KEY = 'opencriptG_tour_seen_v4_enterprise';
const PlatformPillList = () => React.createElement("div", {
  className: "tour-pill-list"
}, React.createElement("span", null, "Generador criptografico"), React.createElement("span", null, "Tokenizacion local"), React.createElement("span", null, "Vault"), React.createElement("span", null, "QR Vault"), React.createElement("span", null, "Certificados"), React.createElement("span", null, "Format Forge"), React.createElement("span", null, "OSDG-rest"), React.createElement("span", null, "OCG Units"));
const PlanTourGrid = () => React.createElement("div", {
  className: "tour-plan-grid"
}, React.createElement("div", null, React.createElement("b", null, "ENTERPRISE"), React.createElement("span", null, "100,000 por lote"), React.createElement("span", null, "catalogo completo"), React.createElement("span", null, "todas las tools"), React.createElement("span", null, "sin bloqueo por planes")), React.createElement("div", null, React.createElement("b", null, "VAULT"), React.createElement("span", null, "50,000 registros"), React.createElement("span", null, "exportacion completa"), React.createElement("span", null, "QR + pack"), React.createElement("span", null, "flujo continuo")), React.createElement("div", null, React.createElement("b", null, "SECURITY"), React.createElement("span", null, "login real"), React.createElement("span", null, "roles"), React.createElement("span", null, "auditoria"), React.createElement("span", null, "CSRF")), React.createElement("div", null, React.createElement("b", null, "LABS"), React.createElement("span", null, "BASEMAT"), React.createElement("span", null, "HNS/HOS/HCP"), React.createElement("span", null, "Format Forge"), React.createElement("span", null, "Phone OS")));
const TOUR_STEPS = [{
  id: 'welcome',
  selector: null,
  title: 'TOUR Hashcod',
  body: React.createElement(React.Fragment, null, React.createElement("p", null, "Este tour explica como funciona Hashcod en modo Enterprise: generacion de codes, tokenizacion local, vault, QR, certificados, formatos nuevos, herramientas visuales y laboratorios avanzados."), React.createElement("p", null, "La plataforma entra siempre con el catalogo completo y las funciones productivas disponibles desde el inicio."), React.createElement(PlatformPillList, null), React.createElement("div", {
    className: "tour-meta"
  }, React.createElement("span", null, "Hashcod"), React.createElement("span", null, "\xB7"), React.createElement("span", null, "GUIA INTERACTIVA"), React.createElement("span", null, "\xB7"), React.createElement("span", null, "ENTERPRISE")))
}, {
  id: 'brand',
  selector: '.tb-brand',
  place: 'bottom-start',
  title: 'IDENTIDAD DE LA PLATAFORMA',
  body: React.createElement(React.Fragment, null, React.createElement("p", null, "Hashcod es una suite local para crear, organizar, exportar, transportar y documentar codes criptograficos."), React.createElement("p", null, "No es solo un generador: es un entorno operativo con catalogo, vault, QR, certificados, formatos propietarios y herramientas internas."))
}, {
  id: 'enterprise-mode',
  selector: '.tb-enterprise',
  place: 'bottom-end',
  title: 'ENTERPRISE SIEMPRE ACTIVO',
  body: React.createElement(React.Fragment, null, React.createElement("p", null, "Enterprise abre el sistema completo: ", React.createElement("b", null, "100,000 codes por lote"), ", catalogo completo, vault de 50,000, todas las herramientas y menor ruido de similaridad."), React.createElement("p", null, "Es el modo de alta escala: menos friccion, mas volumen, mas control y mejor flujo para operaciones grandes."), React.createElement(PlanTourGrid, null))
}, {
  id: 'top-tools',
  selector: '.tb-nav',
  place: 'bottom',
  title: 'BARRA SUPERIOR DE HERRAMIENTAS',
  body: React.createElement(React.Fragment, null, React.createElement("p", null, "La barra superior es deslizante. Usa rueda o trackpad para ver todas las herramientas."), React.createElement("p", null, React.createElement("b", null, "Clic normal"), " abre una herramienta. ", React.createElement("b", null, "Clic derecho"), " abre opciones adicionales cuando existan."))
}, {
  id: 'classic-menus',
  selector: '.tb-nav',
  place: 'bottom-start',
  title: 'MENUS CLASICOS',
  body: React.createElement(React.Fragment, null, React.createElement("p", null, React.createElement("b", null, "Archivo"), " maneja sesiones. Las sesiones, exportaciones y herramientas avanzadas quedan disponibles en modo Enterprise."), React.createElement("p", null, React.createElement("b", null, "Generar"), " crea codes. ", React.createElement("b", null, "Exportar"), " descarga resultados. Generar y exportar funcionan como parte del flujo real de produccion."))
}, {
  id: 'tools',
  selector: '.tb-nav',
  place: 'bottom-end',
  title: 'HERRAMIENTAS PRINCIPALES',
  body: React.createElement(React.Fragment, null, React.createElement("p", null, "Desde aqui entras a Base de datos, QR Vault, Text Lab, Disco Lab, P-Andora, Desk, OSDG-rest, Markdown, Sequence-A, Certificados, Ivory DID, Format Forge y OCG Units."), React.createElement("p", null, "Todas las herramientas fuertes quedan disponibles: QR Vault, Certificados, Format Forge, BASEMAT, HNS, HOS y HCP."))
}, {
  id: 'breadcrumb',
  selector: '.bcr',
  place: 'bottom',
  title: 'ESTADO DEL CODE ACTUAL',
  body: React.createElement(React.Fragment, null, React.createElement("p", null, "Esta barra muestra categoria, code seleccionado, valores generados, unicos y tiempo de sesion."))
}, {
  id: 'sidebar-search',
  selector: '.sb-search-row',
  place: 'right',
  title: 'BUSQUEDA DE CODES',
  body: React.createElement(React.Fragment, null, React.createElement("p", null, "Busca por nombre, estandar, familia, identificador o uso: AES, SHA, UUID, BIP, HKDF, Ascon, Kuznyechik, NEO, token, vault y mas."), React.createElement("p", null, "El catalogo completo queda visible para buscar por nombre, estandar, familia, identificador o uso."))
}, {
  id: 'catalog',
  selector: '.sb',
  place: 'right',
  title: 'CATALOGO DE CODES',
  body: React.createElement(React.Fragment, null, React.createElement("p", null, "La columna izquierda contiene las primitivas/codes organizadas por familias: claves, hashes, tokens, contrasenas, identificadores, post-cuanticos y NEO codes."), React.createElement("p", null, "Enterprise deja ver todo el catalogo y todas sus familias criptograficas."))
}, {
  id: 'config',
  selector: '.cfg',
  place: 'bottom',
  title: 'CONFIGURACION ANTES DE GENERAR',
  body: React.createElement(React.Fragment, null, React.createElement("p", null, "Ajusta longitud, cantidad, prefijo y caracteres. La UI se adapta a lo que permite el code seleccionado."), React.createElement("p", null, "El numero maximo queda preparado para lotes reales de hasta 100,000 codes."))
}, {
  id: 'actions',
  selector: '.cfg-acts',
  place: 'bottom-end',
  title: 'GENERAR, COPIAR Y DESCARGAR',
  body: React.createElement(React.Fragment, null, React.createElement("p", null, React.createElement("b", null, "Generar"), " crea el code. ", React.createElement("b", null, "Copiar"), " guarda el resultado. ", React.createElement("b", null, "Descargar"), " exporta."), React.createElement("p", null, "Copiar y descargar generan material limpio, operativo y listo para documentar."), React.createElement("p", {
    className: "tour-tip"
  }, React.createElement("kbd", null, "Ctrl/\u2318 + Enter"), " genera \xB7 ", React.createElement("kbd", null, "Ctrl/\u2318 + B"), " lote grande \xB7 ", React.createElement("kbd", null, "Ctrl/\u2318 + Shift + S"), " exporta."))
}, {
  id: 'output',
  selector: '.out',
  place: 'top',
  title: 'SALIDA DE CODES GENERADOS',
  body: React.createElement(React.Fragment, null, React.createElement("p", null, "Cada code aparece con numero, valor, longitud, similaridad y botones de accion."), React.createElement("p", null, "La salida se mantiene limpia: cada code muestra el valor, sus acciones de descarga y sus metadatos tecnicos sin bloques narrativos extra."))
}, {
  id: 'similarity',
  selector: '.out',
  place: 'top',
  title: 'FLECHAS DE SIMILARIDAD',
  body: React.createElement(React.Fragment, null, React.createElement("p", null, "Las flechas muestran cuando un code se parece a otro del lote. Puedes hacer clic para saltar al code relacionado."), React.createElement("p", null, "La similaridad se mantiene como senal tecnica para comparar codes sin ruido comercial."))
}, {
  id: 'row-actions',
  selector: '.out',
  place: 'top',
  title: 'ICONOS DE CADA CODE',
  body: React.createElement(React.Fragment, null, React.createElement("p", null, "Las filas tienen acciones: copiar, QR PNG, captura PNG, ticket, LOG, JSON, TXT, Markdown y eliminar."), React.createElement("p", null, "Todas estas salidas quedan activas como herramientas reales de produccion."))
}, {
  id: 'right-panel',
  selector: '.rp',
  place: 'left',
  title: 'PANEL TECNICO DERECHO',
  body: React.createElement(React.Fragment, null, React.createElement("p", null, "El panel derecho explica estandar, entropia, motor, espacio de busqueda, mejor uso, postura de seguridad y escenarios recomendados."), React.createElement("p", null, "Esto ayuda a elegir el code correcto para archivos, tokens, backends, bases de datos, QR, certificados o tokenizacion."))
}, {
  id: 'database',
  selector: '.tb-nav',
  place: 'bottom',
  title: 'BASE DE DATOS Y VAULT',
  body: React.createElement(React.Fragment, null, React.createElement("p", null, "La base de datos guarda codes copiados. Desde ahi puedes buscar, exportar, reutilizar en QR Vault, certificados, Sequence-A, Ivory DID y OCG Units."), React.createElement("p", null, "El vault queda amplio para flujo continuo y reutilizacion entre herramientas."))
}, {
  id: 'qr-vault',
  selector: '.tb-nav',
  place: 'bottom',
  title: 'QR VAULT',
  body: React.createElement(React.Fragment, null, React.createElement("p", null, "QR Vault crea paquetes QR con codes guardados. Sirve para transportar, presentar o verificar codes."), React.createElement("p", null, "QR Vault queda disponible para paquetes y transporte de codes."))
}, {
  id: 'format-forge',
  selector: '.tb-nav',
  place: 'bottom',
  title: 'FORMAT FORGE',
  body: React.createElement(React.Fragment, null, React.createElement("p", null, "Format Forge permite crear formatos nuevos y convertir archivos a paquetes propietarios OCG."), React.createElement("p", null, "Esta funcion queda activa como parte del sistema de tokenizacion y conversion de archivos."))
}, {
  id: 'certificates',
  selector: '.tb-nav',
  place: 'bottom',
  title: 'CERTIFICADOS',
  body: React.createElement(React.Fragment, null, React.createElement("p", null, "Certificados crea documentos formales para codes: titular, ID, hash, QR, fecha, estado y notas internas."), React.createElement("p", null, "Enterprise convierte un code en material documentado y presentable."))
}, {
  id: 'osdg',
  selector: '.tb-nav',
  place: 'bottom',
  title: 'OSDG-REST Y ARCHIVOS',
  body: React.createElement(React.Fragment, null, React.createElement("p", null, "OSDG-rest cifra y desbloquea archivos usando key visible y nonce. Es una herramienta para documentos, paquetes y archivos sensibles."))
}, {
  id: 'units',
  selector: '.tb-nav',
  place: 'bottom',
  title: 'OCG UNITS',
  body: React.createElement(React.Fragment, null, React.createElement("p", null, "OCG Units crea unidades internas o code coins privados dentro de OCG. No son moneda publica; funcionan como creditos/licencias internas del ecosistema."))
}, {
  id: 'workflow',
  selector: null,
  title: 'FLUJO RECOMENDADO',
  body: React.createElement(React.Fragment, null, React.createElement("p", null, "Flujo simple: elige code, configura parametros, genera, revisa el panel tecnico, copia al vault, crea QR o certificado, exporta LOG/JSON y documenta."), React.createElement("p", null, "En modo Enterprise el flujo queda completo desde el inicio."), React.createElement(PlanTourGrid, null))
}, {
  id: 'security',
  selector: null,
  title: 'SEGURIDAD Y RESPONSABILIDAD',
  body: React.createElement(React.Fragment, null, React.createElement("p", null, "OCG genera material sensible. No compartas keys privadas, nonces, seeds, tokens o logs reales sin autorizacion."), React.createElement("p", null, "Para produccion: valida permisos, leyes aplicables, auditoria, control de acceso y almacenamiento seguro."))
}, {
  id: 'finish',
  selector: null,
  title: 'LISTO PARA USAR',
  body: React.createElement(React.Fragment, null, React.createElement("p", null, "Ya conoces la plataforma: catalogo, generacion, salida, similaridad, vault, QR, certificados, formatos, ENTERPRISE y limites."), React.createElement("p", {
    className: "tour-tip"
  }, "Repite este tour desde ", React.createElement("b", null, "TOUR"), " en la barra inferior o desde ", React.createElement("b", null, "VER -> Repetir tour"), "."))
}];
function useTargetRect(selector, tick) {
  const [rect, setRect] = useState(null);
  useLayoutEffect(() => {
    if (!selector) {
      setRect(null);
      return;
    }
    const measure = () => {
      const el = document.querySelector(selector);
      if (!el) {
        setRect(null);
        return;
      }
      const r = el.getBoundingClientRect();
      setRect({
        top: r.top,
        left: r.left,
        width: r.width,
        height: r.height
      });
    };
    measure();
    const id = requestAnimationFrame(measure);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [selector, tick]);
  return rect;
}
function placeCard(rect, place, cardW, cardH) {
  const PAD = 14;
  const vw = window.innerWidth,
    vh = window.innerHeight;
  if (!rect) return {
    top: vh / 2 - cardH / 2,
    left: vw / 2 - cardW / 2,
    centered: true
  };
  let top = 0,
    left = 0;
  switch (place) {
    case 'bottom':
      top = rect.top + rect.height + PAD;
      left = rect.left + rect.width / 2 - cardW / 2;
      break;
    case 'bottom-start':
      top = rect.top + rect.height + PAD;
      left = rect.left;
      break;
    case 'bottom-end':
      top = rect.top + rect.height + PAD;
      left = rect.left + rect.width - cardW;
      break;
    case 'top':
      top = rect.top - cardH - PAD;
      left = rect.left + rect.width / 2 - cardW / 2;
      break;
    case 'left':
      top = rect.top + rect.height / 2 - cardH / 2;
      left = rect.left - cardW - PAD;
      break;
    case 'right':
      top = rect.top + rect.height / 2 - cardH / 2;
      left = rect.left + rect.width + PAD;
      break;
    default:
      top = rect.top + rect.height + PAD;
      left = rect.left;
  }
  left = Math.max(PAD, Math.min(left, vw - cardW - PAD));
  top = Math.max(PAD, Math.min(top, vh - cardH - PAD));
  return {
    top,
    left,
    centered: false
  };
}
const TourCard = ({
  step,
  idx,
  total,
  onPrev,
  onNext,
  onSkip,
  rect,
  onJump
}) => {
  const cardRef = useRef(null);
  const [pos, setPos] = useState({
    top: 0,
    left: 0,
    centered: true
  });
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
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [rect, step.place, step.id]);
  return React.createElement("div", {
    ref: cardRef,
    className: `tour-card ${pos.centered ? 'centered' : ''}`,
    style: {
      top: pos.top,
      left: pos.left
    },
    role: "dialog",
    "aria-label": step.title
  }, React.createElement("div", {
    className: "tour-card-tb"
  }, React.createElement("span", {
    className: "tour-card-tb-dot"
  }), React.createElement("span", {
    className: "tour-card-tb-dot"
  }), React.createElement("span", {
    className: "tour-card-tb-dot"
  }), React.createElement("span", {
    className: "tour-card-tb-t"
  }, "OCG tour avanzado"), React.createElement("span", {
    className: "tour-card-tb-spacer"
  }), React.createElement("span", {
    className: "tour-card-tb-st"
  }, String(idx + 1).padStart(2, '0'), " / ", String(total).padStart(2, '0'))), React.createElement("div", {
    className: "tour-card-body"
  }, React.createElement("h3", {
    className: "tour-card-title"
  }, step.title), React.createElement("div", {
    className: "tour-card-prose"
  }, step.body)), React.createElement("div", {
    className: "tour-card-progress"
  }, Array.from({
    length: total
  }).map((_, i) => React.createElement("button", {
    key: i,
    className: `tour-dot ${i === idx ? 'on' : ''} ${i < idx ? 'past' : ''}`,
    onClick: () => onJump(i),
    "aria-label": `Ir al paso ${i + 1}`
  }))), React.createElement("div", {
    className: "tour-card-acts"
  }, React.createElement("button", {
    className: "tour-btn tour-btn-link",
    onClick: onSkip
  }, "Saltar tour"), React.createElement("span", {
    className: "tour-card-acts-spacer"
  }), React.createElement("button", {
    className: "tour-btn",
    onClick: onPrev,
    disabled: idx === 0
  }, "Atras"), React.createElement("button", {
    className: "tour-btn tour-btn-pri",
    onClick: onNext
  }, idx === total - 1 ? 'Finalizar' : 'Seguir')));
};
const AppTour = ({
  active,
  onClose
}) => {
  const [idx, setIdx] = useState(0);
  const [tick, setTick] = useState(0);
  const step = TOUR_STEPS[idx];
  useEffect(() => {
    if (!active) return;
    const t1 = setTimeout(() => setTick(t => t + 1), 60);
    const t2 = setTimeout(() => setTick(t => t + 1), 280);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [active, idx]);
  const rect = useTargetRect(step?.selector, tick);
  const finish = () => {
    try {
      localStorage.setItem(TOUR_KEY, '1');
    } catch (e) {}
    onClose();
  };
  const next = () => {
    if (idx >= TOUR_STEPS.length - 1) finish();else setIdx(i => i + 1);
  };
  const prev = () => setIdx(i => Math.max(0, i - 1));
  useEffect(() => {
    if (!active) return;
    const onKey = e => {
      if (e.key === 'Escape') {
        e.preventDefault();
        finish();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        e.preventDefault();
        next();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prev();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [active, idx]);
  if (!active) return null;
  const PAD = 6;
  const r = rect ? {
    top: rect.top - PAD,
    left: rect.left - PAD,
    width: rect.width + PAD * 2,
    height: rect.height + PAD * 2
  } : null;
  return React.createElement("div", {
    className: "tour-root",
    "aria-live": "polite"
  }, !r ? React.createElement("div", {
    className: "tour-scrim full"
  }) : React.createElement(React.Fragment, null, React.createElement("div", {
    className: "tour-scrim",
    style: {
      top: 0,
      left: 0,
      right: 0,
      height: r.top
    }
  }), React.createElement("div", {
    className: "tour-scrim",
    style: {
      top: r.top + r.height,
      left: 0,
      right: 0,
      bottom: 0
    }
  }), React.createElement("div", {
    className: "tour-scrim",
    style: {
      top: r.top,
      left: 0,
      width: r.left,
      height: r.height
    }
  }), React.createElement("div", {
    className: "tour-scrim",
    style: {
      top: r.top,
      left: r.left + r.width,
      right: 0,
      height: r.height
    }
  }), React.createElement("div", {
    className: "tour-spot",
    style: {
      top: r.top,
      left: r.left,
      width: r.width,
      height: r.height
    }
  }, React.createElement("span", {
    className: "tour-spot-c tl"
  }), React.createElement("span", {
    className: "tour-spot-c tr"
  }), React.createElement("span", {
    className: "tour-spot-c bl"
  }), React.createElement("span", {
    className: "tour-spot-c br"
  }))), React.createElement(TourCard, {
    step: step,
    idx: idx,
    total: TOUR_STEPS.length,
    onPrev: prev,
    onNext: next,
    onSkip: finish,
    rect: rect,
    onJump: setIdx
  }));
};
function hasSeenTour() {
  try {
    return localStorage.getItem(TOUR_KEY) === '1';
  } catch (e) {
    return false;
  }
}
function resetTourSeen() {
  try {
    localStorage.removeItem(TOUR_KEY);
  } catch (e) {}
}
window.AppTour = AppTour;
window.hasSeenTour = hasSeenTour;
window.resetTourSeen = resetTourSeen;
})();
