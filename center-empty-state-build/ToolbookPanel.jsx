import React, { useState } from 'react';
import { BookOpen, ShieldCheck, Wrench, GitBranch, Cpu, ScanSearch, LayoutGrid, Lock, FileCode, QrCode, Settings2, Terminal, Sigma } from 'lucide-react';
import './toolbook-panel.css';

// Page S1TB of the Toolbook design: a 4x4 matrix of circular slots with an inner ring.
const SLOTS = [
  { id: '1-1', title: 'Blog de Publicaciones', hint: 'Vista Excel', Icon: BookOpen },
  { id: '1-2', title: 'Panel de Administrador', hint: 'Firma Dilithium-5', Icon: ShieldCheck },
  { id: '1-3', title: 'Herramienta 3', hint: 'Herramienta', Icon: Wrench },
  { id: '1-4', title: 'GitHub Repositories', hint: 'Catálogo', Icon: GitBranch },
  { id: '2-1', title: 'NVIDIA Dynamo', hint: 'LLM Inference Stack (Rust)', Icon: Cpu },
  { id: '2-2', title: 'Strix AI', hint: 'Security & IP Vulnerability Auditor', Icon: ScanSearch },
  { id: '2-3', title: 'Krumbs', hint: '8x7 API Launcher & Code Studio', Icon: LayoutGrid },
  { id: '2-4', title: 'Git Repository Vault', hint: 'On-Demand Engine', Icon: Lock },
  { id: '3-1', title: 'TypeScript Engine', hint: 'On-Demand Studio', Icon: FileCode },
  { id: '3-2', title: 'Vector Vision', hint: 'JAB/QR Matrix Studio', Icon: QrCode },
  { id: '3-3', title: 'Rust Systems Engine', hint: 'On-Demand Studio', Icon: Settings2 },
  { id: '3-4', title: 'Python Runtime', hint: 'On-Demand Studio', Icon: Terminal },
  { id: '4-1', title: 'GNU Octave', hint: 'Numerical Engine', Icon: Sigma },
  { id: '4-2', title: 'Espacio libre', hint: '', Icon: null },
  { id: '4-3', title: 'Espacio libre', hint: '', Icon: null },
  { id: '4-4', title: 'Espacio libre', hint: '', Icon: null },
];

// Decorative nodes/crosses of the abstract background (percent coordinates).
const NODES = [[8, 6], [26, 12], [52, 5], [78, 9], [92, 18], [6, 40], [36, 33], [64, 46], [90, 38], [14, 72], [31, 80], [58, 92], [84, 87], [95, 68], [47, 62]];

function Bracket({ corner }) {
  return <span className={`htb-bracket htb-bracket--${corner}`} aria-hidden="true" />;
}

export default function ToolbookPanel({ pro = false }) {
  const [selected, setSelected] = useState('');
  const current = SLOTS.find(slot => slot.id === selected);

  function open(slot) {
    if (!slot.Icon) return;
    if (!pro) { window.dispatchEvent(new CustomEvent('hashcod:pro-required')); return; }
    setSelected(slot.id);
    window.dispatchEvent(new CustomEvent('hashcod:toolbook-select', { detail: { slot: slot.id, title: slot.title } }));
  }

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
          {SLOTS.map(slot => (
            <li key={slot.id}>
              {slot.Icon
                ? <button type="button" className="htb-slot is-filled" aria-pressed={selected === slot.id} aria-label={`${slot.title}${slot.hint ? ` · ${slot.hint}` : ''}`} title={`${slot.title}${slot.hint ? ` · ${slot.hint}` : ''}`} onClick={() => open(slot)}>
                  <span className="htb-ring"><slot.Icon size={24} strokeWidth={1.6} aria-hidden="true" /></span>
                </button>
                : <span className="htb-slot" aria-hidden="true" />}
            </li>
          ))}
        </ul>
      </div>
      <p className="htb-caption" role="status">{current ? <><strong>{current.title}</strong>{current.hint ? ` · ${current.hint}` : ''}</> : pro ? 'Elige una herramienta de tu Toolbook.' : 'La Toolbook es un beneficio de Hashcod Pro.'}</p>
    </section>
  );
}
