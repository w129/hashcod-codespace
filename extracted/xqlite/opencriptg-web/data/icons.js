/* opencriptG — enhanced colorful icon system
   Deterministic vector icons for categories and every cryptographic code.
   All item icons are generated uniquely from the primitive id so each code
   gets a different colorful badge while preserving its semantic glyph. */

(function(){
  const GLYPHS = {
    brand:   `M8 2.1a5.9 5.9 0 1 1 0 11.8 5.9 5.9 0 0 1 0-11.8Zm0 1.7a4.2 4.2 0 1 0 0 8.4 4.2 4.2 0 0 0 0-8.4ZM3.15 3.4l11.25 7.25-1.15 1.45L2 4.85Zm-1.35 3 11.25 7.25-1.15 1.45L.65 7.85Z`,
    lock:    `M4 7V5a4 4 0 1 1 8 0v2h1v8H3V7Zm1.6 0h4.8V5a2.4 2.4 0 1 0-4.8 0Z`,
    split:   `M3 2h4v4H3Zm6 8h4v4H9ZM5 6v2h6v2h2V6Z`,
    hash:    `M5.6 1.5 5 5H2v1.6h2.7l-.6 3H1v1.6h2.8l-.6 3.4h1.6l.6-3.4h3l-.6 3.4h1.6l.6-3.4H13V10h-2.7l.6-3H14V5.4h-2.8l.6-3.4h-1.6l-.6 3.4h-3l.6-3.4Zm.4 5h3l-.6 3h-3Z`,
    shield:  `M8 1 2 3v5c0 3.3 2.4 6.3 6 7 3.6-.7 6-3.7 6-7V3Z`,
    kdf:     `M2 2h5v3H2Zm7 0h5v3H9Zm-7 5h5v3H2Zm7 0h5v3H9ZM2 12h5v3H2Zm7 0h5v3H9Z`,
    id:      `M1 3h14v10H1Zm2 2v6h4V5Zm6 0v1.4h4V5Zm0 2.6V9h4V7.6ZM9 10v1.4h3V10Z`,
    token:   `M10 1a4 4 0 0 0-3.9 3H1v2h2v2H1v2h5.1a4 4 0 1 0 3.9-9Zm0 5.4a1.4 1.4 0 1 1 0-2.8 1.4 1.4 0 0 1 0 2.8Z`,
    password:`M3 2h10v3H3Zm0 4h10v3H3Zm0 4h10v3H3Z`,
    binary:  `M2 2h5v6H2Zm7 0h5v3H9Zm0 5h5v7H9ZM2 9h5v5H2Zm2-5v2h1V4Zm6 0v1h2V4Z`,
    pq:      `M8 1 2 4v8l6 3 6-3V4Zm0 1.8 4.2 2.1L8 7 3.8 4.9Zm-4.5 3.3L7.3 8v5.2L3.5 11.3Zm9 0v5.2L8.7 13.2V8Z`,
    key:     `M11 1a4 4 0 0 0-3.9 3.1L1 10.2v3.8h3.8l.7-.7v-1.4h1.4v-1.4h1.4l.6-.6A4 4 0 1 0 11 1Zm.5 4.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z`,
    wave:    `M0 8a4 4 0 0 1 8 0 4 4 0 0 0 8 0v2a6 6 0 0 1-12 0 2 2 0 1 0-4 0Z`,
    curve:   `M2 14V2h2v6.5C5 6.5 7 4 10 4c2 0 4 1 4 3 0 3-3 5-7 5-2 0-3 1-3 2Z`,
    modern:  `M8 1 1 5v6l7 4 7-4V5Zm-3 5.5L8 5l3 1.5v3L8 11 5 9.5Zm3-1.6L6.7 6 8 6.6 9.3 6Z`,
    card:    `M1 3h14v3H1Zm0 4h14v6H1Zm2 4v1.5h4V11Zm6 0v1.5h4V11Z`
  };

  const BASE_KEYS = Object.keys(GLYPHS);

  function hashString(str='') {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function sanitizeId(str='g') {
    return String(str).replace(/[^a-zA-Z0-9_-]/g, '_');
  }

  function paletteFrom(seed='') {
    const h = hashString(seed);
    const hue = h % 360;
    const hue2 = (hue + 36 + (h % 70)) % 360;
    const hue3 = (hue + 180 + (h % 45)) % 360;
    return {
      a: `hsl(${hue} 88% 58%)`,
      b: `hsl(${hue2} 86% 52%)`,
      c: `hsl(${hue3} 85% 72%)`,
      deep: `hsl(${(hue + 12) % 360} 55% 18%)`
    };
  }

  function semanticKey(meta={}) {
    return meta.icon && GLYPHS[meta.icon] ? meta.icon : BASE_KEYS[(hashString(meta.id || meta.label || 'key') % BASE_KEYS.length)];
  }

  function accentShape(variant, colors) {
    switch (variant % 5) {
      case 0:
        return `<circle cx="12.8" cy="3.4" r="1.45" fill="${colors.c}" opacity=".95"/><circle cx="3.2" cy="12.8" r="1" fill="rgba(255,255,255,.46)"/>`;
      case 1:
        return `<path d="M2.1 12.8c2.2-2.1 4.9-3 8.2-2.9" fill="none" stroke="rgba(255,255,255,.36)" stroke-width="1.1" stroke-linecap="round"/><circle cx="12.4" cy="4" r="1.2" fill="${colors.c}"/>`;
      case 2:
        return `<rect x="10.8" y="2.4" width="3.1" height="3.1" rx="1" fill="${colors.c}" opacity=".9"/><rect x="2.5" y="10.8" width="2.4" height="2.4" rx=".8" fill="rgba(255,255,255,.38)"/>`;
      case 3:
        return `<path d="M12.9 2.2 14 4l-1.8 1.1-1.1-1.8Z" fill="${colors.c}" opacity=".92"/><path d="M3 10.6 4.6 12l-1.4 1.6-1.6-1.4Z" fill="rgba(255,255,255,.35)"/>`;
      default:
        return `<path d="M11.8 2.6h2.1v2.1h-2.1ZM2.4 11.4h3.2v1.2H2.4Z" fill="${colors.c}" opacity=".92"/><circle cx="4" cy="4" r=".9" fill="rgba(255,255,255,.4)"/>`;
    }
  }

  function renderPlainIcon(name='lock', s=16) {
    const path = GLYPHS[name] || GLYPHS.lock;
    return `<svg width="${s}" height="${s}" viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="${path}"/></svg>`;
  }

  function renderBrandIcon(s=20) {
    return `<img class="ocg-brand-icon" src="app/hashcod-platform-icon.svg?v=hashcod-classic-2" width="${s}" height="${s}" alt="" aria-hidden="true"/>`;
  }

  function renderCodeContainerIcon(s=16) {
    return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 7.7c0-.6-.4-1.2-.8-1.5l-6.3-3.9a1.72 1.72 0 0 0-1.7 0l-10.3 6c-.5.2-.9.8-.9 1.4v6.6c0 .5.4 1.2.8 1.5l6.3 3.9a1.72 1.72 0 0 0 1.7 0l10.3-6c.5-.3.9-1 .9-1.5Z"/><path d="M10 21.9V14L2.1 9.1"/><path d="m10 14 11.9-6.9"/><path d="M14 19.8v-8.1"/><path d="M18 17.5V9.4"/></svg>`;
  }

  function renderBadge(meta={}, s=18, category=false) {
    const idSeed = `${meta.id || meta.label || meta.icon || 'item'}:${meta.badge || ''}:${meta.icon || ''}:${category ? 'cat' : 'item'}`;
    const seed = hashString(idSeed);
    const colors = paletteFrom(idSeed);
    const glyph = GLYPHS[semanticKey(meta)] || GLYPHS.lock;
    const gid = `g_${sanitizeId(meta.id || meta.label || 'item')}_${s}_${category ? 'c' : 'i'}_${seed.toString(16)}`;
    const rx = [3.2, 4.4, 5.4, 6.2][seed % 4];
    const shapeVariant = (seed >>> 2) % 5;
    const haloOpacity = category ? '.22' : '.32';
    const outlineOpacity = category ? '.28' : '.38';
    const shadowOpacity = category ? '.18' : '.22';
    return `
      <svg width="${s}" height="${s}" viewBox="0 0 16 16" aria-hidden="true">
        <defs>
          <linearGradient id="${gid}" x1="1" y1="1" x2="15" y2="15" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="${colors.a}"/>
            <stop offset="58%" stop-color="${colors.b}"/>
            <stop offset="100%" stop-color="${colors.deep}"/>
          </linearGradient>
        </defs>
        <rect x="1" y="1" width="14" height="14" rx="${rx}" fill="url(#${gid})"/>
        <rect x="1.5" y="1.5" width="13" height="13" rx="${Math.max(2.6, rx - .6)}" fill="none" stroke="rgba(255,255,255,${outlineOpacity})"/>
        <path d="M2.2 2.1h8.1c-1.8 1-3.1 2.4-4.2 4.4-1.5 2.6-2.7 4.5-5.1 5.8V3.7c0-.7.5-1.3 1.2-1.6Z" fill="rgba(255,255,255,${haloOpacity})"/>
        ${accentShape(shapeVariant, colors)}
        <g transform="translate(3.15 3.15) scale(.61)">
          <path fill="#fff" d="${glyph}"/>
        </g>
        ${category ? '' : `<path d="M4 12.7c2.2-1.8 5.6-1.9 8.3-.2" fill="none" stroke="rgba(255,255,255,.18)" stroke-width=".95" stroke-linecap="round"/>`}
        <rect x="1" y="1" width="14" height="14" rx="${rx}" fill="none" stroke="rgba(0,0,0,${shadowOpacity})"/>
      </svg>`;
  }

  const api = {
    brand: (s=20) => renderBrandIcon(s),
    lock: (s=16) => renderPlainIcon('lock', s),
    split: (s=16) => renderPlainIcon('split', s),
    hash: (s=16) => renderPlainIcon('hash', s),
    shield: (s=16) => renderPlainIcon('shield', s),
    kdf: (s=16) => renderPlainIcon('kdf', s),
    id: (s=16) => renderPlainIcon('id', s),
    token: (s=16) => renderPlainIcon('token', s),
    password: (s=16) => renderPlainIcon('password', s),
    binary: (s=16) => renderPlainIcon('binary', s),
    pq: (s=16) => renderPlainIcon('pq', s),
    key: (s=16) => renderPlainIcon('key', s),
    wave: (s=16) => renderPlainIcon('wave', s),
    curve: (s=16) => renderPlainIcon('curve', s),
    modern: (s=16) => renderPlainIcon('modern', s),
    card: (s=16) => renderPlainIcon('card', s),
    code: (meta, s=18) => renderCodeContainerIcon(s),
    categoryBadge: (meta, s=16) => renderCodeContainerIcon(s),
  };

  window.OCG_ICONS = api;
})();
