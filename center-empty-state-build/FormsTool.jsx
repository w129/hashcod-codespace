import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, useReducedMotion } from 'motion/react';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from './animate-ui/accordion-radix';
import { PdfPreview } from './FilePreview';
import FormsIcon from './FormsIcon';
import { FORM_CATEGORIES } from './forms-data';
import './tokenization.css';
import './pdf-extract.css';
import './forms-tool.css';

// Library of the Hashcod PSOT fillable forms: browse by category, preview the real PDF, download it.
// The PDFs are served by forms-library.php (Pro period required, like every /api route).
const url = (code, download) => `/api/forms-library/${code}${download ? '?download=1' : ''}`;
const norm = text => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const ALL = FORM_CATEGORIES.flatMap(category => category.forms.map(([code, title]) => ({ code, title, category: category.title })));

export default function FormsTool({ onClose }) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(ALL[0]);
  const [openCategory, setOpenCategory] = useState(FORM_CATEGORIES[0].id);
  const [blob, setBlob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const dialog = useRef(null);
  const reduce = useReducedMotion();

  useEffect(() => { dialog.current?.querySelector('[data-autofocus]')?.focus(); }, []);
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setBlob(null); setError(''); setLoading(true);
    fetch(url(selected.code), { credentials: 'same-origin', signal: controller.signal })
      .then(response => {
        if (!response.ok) throw new Error(String(response.status));
        return response.blob();
      })
      .then(file => { setBlob(file); setLoading(false); })
      .catch(failure => {
        if (failure.name === 'AbortError') return;
        setError(failure.message === '403' || failure.message === '402' ? 'Tu periodo Pro no está activo.' : 'No se pudo cargar el formulario.');
        setLoading(false);
      });
    return () => controller.abort();
  }, [selected]);

  const needle = norm(query.trim());
  const groups = useMemo(() => FORM_CATEGORIES
    .map(category => ({ ...category, forms: category.forms.filter(([code, title]) => !needle || norm(`${code} ${title}`).includes(needle)) }))
    .filter(category => category.forms.length), [needle]);

  // Same-origin attachment: the server names the file (e.g. A01_Verificacion_de_identidad_KYC.pdf).
  function download() {
    const link = document.createElement('a');
    link.href = url(selected.code, true); link.download = '';
    document.body.appendChild(link); link.click(); link.remove();
  }

  // While searching, every matching category is open so results are visible at once.
  const accordionProps = needle
    ? { type: 'multiple', value: groups.map(group => group.id) }
    : { type: 'single', collapsible: true, value: openCategory, onValueChange: setOpenCategory };

  return createPortal(<div className="htk-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <motion.section ref={dialog} id="d5FormsTool" className="htk-shell htk-shell--wide hpx hfm" role="dialog" aria-modal="true" aria-labelledby="hfm-title"
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10, scale: .985 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: reduce ? 0 : .2 }}
      onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); onClose(); } }}>
      <header className="htk-header">
        <div className="htk-title-group"><span className="htk-mark"><FormsIcon /></span>
          <div><span className="htk-eyebrow">Hashcod · PSOT</span><h2 id="hfm-title">Formularios</h2></div></div>
        <button className="htk-icon-button" type="button" aria-label="Cerrar" onClick={onClose}>×</button>
      </header>
      {error && <p className="htk-error" role="alert">{error}</p>}
      <div className="hfm-body">
        <nav className="hfm-list" aria-label="Formularios por categoría">
          <input className="hfm-search" type="search" data-autofocus maxLength={80} placeholder={`Buscar entre ${ALL.length} formularios`} aria-label="Buscar formulario"
            value={query} onChange={event => setQuery(event.target.value)} />
          {groups.length === 0 && <p className="htk-muted" role="status">Sin resultados.</p>}
          <Accordion className="hfm-accordion" {...accordionProps}>
            {groups.map(group => <AccordionItem key={group.id} value={group.id}>
              <AccordionTrigger showArrow>{group.title}<span className="hpx-meta">{group.forms.length}</span></AccordionTrigger>
              <AccordionContent keepRendered={false}>
                <ul className="hfm-forms" role="list">
                  {group.forms.map(([code, title]) => <li key={code}>
                    <button type="button" className="hfm-form" aria-current={selected.code === code ? 'true' : undefined}
                      onClick={() => setSelected({ code, title, category: group.title })}><b>{code}</b><span>{title}</span></button>
                  </li>)}
                </ul>
              </AccordionContent>
            </AccordionItem>)}
          </Accordion>
        </nav>
        <section className="hfm-view" aria-label={`Vista del formulario ${selected.code}`}>
          <div className="hfm-view-head">
            <div><span className="htk-eyebrow">{selected.category}</span><h3>{selected.code} · {selected.title}</h3></div>
            <button type="button" className="htk-button htk-button--primary" disabled={!!error && !blob} onClick={download}>Descargar PDF</button>
          </div>
          <div className="hfm-sheet">
            {loading && <p className="htk-muted" role="status">Cargando formulario…</p>}
            {blob && <PdfPreview key={selected.code} blob={blob} />}
          </div>
        </section>
      </div>
      <footer className="htk-footer"><span className="htk-muted">Formularios rellenables PSOT de Hashcod. Se ven aquí tal como son y se descargan en PDF.</span></footer>
    </motion.section>
  </div>, document.body);
}
