import React, { useEffect, useState } from 'react';
import { Progress } from './animate-ui/progress-radix';
import './toolbook-panel.css';

// Page S1TB of the Toolbook design: a 4x4 matrix of empty circular slots with an inner ring.
// The Toolbook starts empty and grows with the tools built for the project.
const SLOTS = Array.from({ length: 16 }, (_, i) => `${Math.floor(i / 4) + 1}-${(i % 4) + 1}`);

export const TOOLBOOK_EVENT = 'hashcod:toolbook-slots';

// Tools register the slots they occupy with `HashcodToolbook.setFilled(['1-1', ...])` (or by dispatching
// TOOLBOOK_EVENT with { filled }). Unknown ids are ignored; the progress bar below follows the result.
function validSlots(list) {
  return Array.isArray(list) ? SLOTS.filter(id => list.includes(id)) : [];
}

function useToolbookFilled() {
  const [filled, setFilled] = useState([]);
  useEffect(() => {
    const apply = event => setFilled(validSlots(event.detail?.filled));
    window.addEventListener(TOOLBOOK_EVENT, apply);
    window.HashcodToolbook = Object.freeze({
      slots: SLOTS,
      setFilled: list => window.dispatchEvent(new CustomEvent(TOOLBOOK_EVENT, { detail: { filled: list } })),
    });
    return () => window.removeEventListener(TOOLBOOK_EVENT, apply);
  }, []);
  return filled;
}

// Decorative nodes/crosses of the abstract background (percent coordinates).
const NODES = [[8, 6], [26, 12], [52, 5], [78, 9], [92, 18], [6, 40], [36, 33], [64, 46], [90, 38], [14, 72], [31, 80], [58, 92], [84, 87], [95, 68], [47, 62]];

function Bracket({ corner }) {
  return <span className={`htb-bracket htb-bracket--${corner}`} aria-hidden="true" />;
}

export default function ToolbookPanel() {
  const filled = useToolbookFilled();
  const percent = Math.round((filled.length / SLOTS.length) * 100);
  return (
    <section className="htb-panel" aria-labelledby="htb-title">
      <header className="htb-head">
        <h2 id="htb-title">Toolbook</h2>
        <span className="htb-chip" aria-label="Página S1TB">S1TB</span>
      </header>
      <div className="htb-board">
        <svg className="htb-bg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
          <g stroke="currentColor" strokeWidth=".25" fill="none" vectorEffect="non-scaling-stroke">
            <path d="M0 0 32 21M62 0 98 25M0 52 40 82M70 100 100 74M10 52 60 20" />
            {NODES.map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r=".9" />)}
            {NODES.slice(0, 8).map(([x, y]) => <path key={`c${x}-${y}`} d={`M${x + 2} ${y + 3}h2M${x + 3} ${y + 2}v2`} />)}
          </g>
        </svg>
        <Bracket corner="tl" /><Bracket corner="tr" /><Bracket corner="bl" /><Bracket corner="br" />
        <ul className="htb-grid" role="list">
          {SLOTS.map(id => <li key={id}><span className="htb-slot" data-slot={id} data-filled={filled.includes(id) ? 'true' : 'false'}><span className="htb-ring" /></span></li>)}
        </ul>
      </div>
      <Progress value={percent} className="w-full" aria-label="Avance de la Toolbook" />
      <p className="htb-caption" role="status">{filled.length === 0 ? 'Tu Toolbook está vacía y crece con las herramientas desarrolladas para tu proyecto.' : `Toolbook ${filled.length}/${SLOTS.length} · ${percent} %`}</p>
    </section>
  );
}
