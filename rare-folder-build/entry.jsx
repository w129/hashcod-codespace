/*
 * Hashcod startup folder integration.
 * Folder geometry and motion states are based on Rare UI's MIT-licensed
 * folder-component (swamimalode07/rare-ui) installed by:
 * npx shadcn@latest add swamimalode07/rare-ui/folder-component
 */
import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { motion } from "motion/react";

const BASE_WIDTH = 321;
const BASE_HEIGHT = 270;
const INTRO_SESSION_KEY = "hashcod_platform_intro_seen_v1";
const DESKTOP_COMPOSITION_MIN_WIDTH = 1181;
const FLAP_PATH = "M0 25C0 11.1929 11.1929 0 25 0H136.084C143.044 0 149.689 2.90139 154.42 8.00608L178.08 33.5343C182.811 38.639 189.456 41.5404 196.416 41.5404H296C309.807 41.5404 321 52.7333 321 66.5404V216C321 229.807 309.807 241 296 241H25C11.1929 241 0 229.807 0 216V25Z";

const theme = {
  backFill: "#000000",
  backInsetShadow: "inset 0 0 6px 2px rgba(255,255,255,0.37)",
  flapFill: "#292929",
  flapFillOpacity: 0.25,
  flapStroke: "#979797",
  flapInsetColor: "0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.08 0",
  cardFill: "#F1F1F1",
  cardStroke: "#E0E0E0",
  cardLineFill: "#D4D4D4",
  cardInsetColor: "0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1 0",
};

const leftRows = [60.9939, 75.1122, 89.2306, 103.349, 117.467, 131.586, 145.704, 159.823, 173.941];
const rightRows = [60.9617, 75.0801, 89.1985, 103.317, 117.435, 131.554, 145.672, 159.79, 173.909];

function Card({ id }) {
  const filterId = `rare_hashcod_card_${id}`;
  return (
    <div data-slot="folder-card" style={{ width: 164, height: 214 }}>
      <svg width="164" height="214" viewBox="0 0 164 214" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: "block", overflow: "visible" }} aria-hidden="true">
        <g filter={`url(#${filterId})`}>
          <rect width="163.078" height="213.262" rx="20" fill={theme.cardFill} />
        </g>
        <rect x="0.5" y="0.5" width="162.078" height="212.262" rx="19.5" stroke={theme.cardStroke} />
        <rect x="14.1193" y="31.2091" width="134.84" height="11.8892" rx="5.94459" fill={theme.cardLineFill} />
        {leftRows.map((y, index) => (
          <React.Fragment key={index}>
            <rect width="64.5183" height="5.88276" rx="2.94138" transform={`matrix(1 -0.000409158 0.00201956 0.999998 14.8253 ${y})`} fill={theme.cardLineFill} />
            <rect width="64.5183" height="5.88276" rx="2.94138" transform={`matrix(1 -0.000461045 0.00179228 0.999998 84.4303 ${rightRows[index]})`} fill={theme.cardLineFill} />
          </React.Fragment>
        ))}
        <defs>
          <filter id={filterId} x="0" y="0" width="166.078" height="218.262" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
            <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
            <feMorphology radius="2" operator="erode" in="SourceAlpha" result={`effect1_innerShadow_${id}`} />
            <feOffset dx="3" dy="5" />
            <feGaussianBlur stdDeviation="3.05" />
            <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
            <feColorMatrix type="matrix" values={theme.cardInsetColor} />
            <feBlend mode="normal" in2="shape" result={`effect1_innerShadow_${id}`} />
          </filter>
        </defs>
      </svg>
    </div>
  );
}

function Folder({ scale }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const close = () => {
      setIsHovered(false);
      setIsOpen(false);
    };
    window.addEventListener("hashcod:platform-entered", close);
    return () => window.removeEventListener("hashcod:platform-entered", close);
  }, []);

  return (
    <div style={{ position: "relative", width: BASE_WIDTH * scale, height: BASE_HEIGHT * scale, display: "flex", alignItems: "center", justifyContent: "center", overflow: "visible", pointerEvents: "auto" }}>
      <div
        data-slot="folder"
        role="button"
        tabIndex={0}
        aria-label="Carpeta interactiva Hashcod"
        aria-expanded={isOpen}
        style={{ position: "relative", width: BASE_WIDTH * scale, height: BASE_HEIGHT * scale, cursor: "pointer", userSelect: "none", touchAction: "manipulation", WebkitTapHighlightColor: "transparent", outline: "none" }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => { setIsHovered(false); setIsOpen(false); }}
        onClick={(event) => { event.preventDefault(); event.stopPropagation(); setIsOpen((value) => !value); }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setIsOpen((value) => !value);
            setIsHovered(true);
          } else if (event.key === "Escape") {
            event.preventDefault();
            setIsOpen(false);
            setIsHovered(false);
          }
        }}
      >
        <div style={{ position: "absolute", top: "50%", left: "50%", width: BASE_WIDTH, height: BASE_HEIGHT, transform: `translate(-50%, -50%) scale(${scale})`, transformOrigin: "center", perspective: 800 * scale }}>
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}>
            <div style={{ width: BASE_WIDTH, height: BASE_HEIGHT, borderRadius: 25, backgroundColor: theme.backFill, boxShadow: theme.backInsetShadow }} />
          </div>

          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <motion.div style={{ position: "absolute" }} animate={{ y: isOpen ? -160 : isHovered ? -30 : -10, x: isOpen ? 70 : 40, rotate: isOpen ? 18 : isHovered ? 14 : 10 }} transition={{ type: "spring", stiffness: 120, damping: 13, delay: isOpen ? 0.1 : isHovered ? 0.12 : 0 }}>
              <Card id={1} />
            </motion.div>
            <motion.div style={{ position: "absolute" }} animate={{ y: isOpen ? -180 : isHovered ? -35 : -20, x: isOpen ? 0 : 3, rotate: isOpen ? -3 : isHovered ? -1 : 2 }} transition={{ type: "spring", stiffness: 120, damping: 13, delay: isOpen ? 0.05 : isHovered ? 0.06 : 0 }}>
              <Card id={2} />
            </motion.div>
            <motion.div style={{ position: "absolute" }} animate={{ y: isOpen ? -170 : isHovered ? -44 : -22, x: isOpen ? -65 : -40, rotate: isOpen ? -14 : isHovered ? -9 : -5 }} transition={{ type: "spring", stiffness: 120, damping: 13, delay: 0 }}>
              <Card id={3} />
            </motion.div>
          </div>

          <motion.div
            style={{ position: "absolute", top: "50%", left: "50%", marginTop: 16, width: 321, height: 241, transformOrigin: "bottom center", transformStyle: "preserve-3d" }}
            initial={false}
            animate={{ x: "-50%", y: "-50%", rotateX: isOpen ? -55 : isHovered ? -45 : -15 }}
            transition={{ type: "spring", stiffness: 120, damping: 14 }}
          >
            <div style={{ position: "absolute", inset: 0, backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", clipPath: `path('${FLAP_PATH}')`, WebkitClipPath: `path('${FLAP_PATH}')`, transform: "translateZ(0)", backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", willChange: "transform" }} />
            <svg style={{ position: "absolute", inset: 0, display: "block", overflow: "visible" }} width="321" height="241" viewBox="0 0 321 241" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <g filter="url(#rare_hashcod_flap_inner)">
                <path d={FLAP_PATH} fill={theme.flapFill} fillOpacity={theme.flapFillOpacity} />
                <path d="M25 0.5H136.084C142.905 0.5 149.417 3.3431 154.054 8.3457L177.713 33.874C182.539 39.0808 189.317 42.04 196.416 42.04H296C309.531 42.04 320.5 53.0092 320.5 66.54V216C320.5 229.531 309.531 240.5 296 240.5H25C11.469 240.5 0.5 229.531 0.5 216V25C0.5 11.469 11.469 0.5 25 0.5Z" stroke={theme.flapStroke} />
              </g>
              <defs>
                <filter id="rare_hashcod_flap_inner" x="-25.4" y="-25.4" width="371.8" height="291.8" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                  <feFlood floodOpacity="0" result="BackgroundImageFix" />
                  <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                  <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                  <feOffset />
                  <feGaussianBlur stdDeviation="2.65" />
                  <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
                  <feColorMatrix type="matrix" values={theme.flapInsetColor} />
                  <feBlend mode="normal" in2="shape" result="effect1_innerShadow_171_13" />
                </filter>
              </defs>
            </svg>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function visibleRect(node) {
  if (!node || typeof node.getBoundingClientRect !== 'function') return null;
  const rect = node.getBoundingClientRect();
  if (!rect || rect.width <= 0 || rect.height <= 0) return null;
  return rect;
}

function findBrandNode(overlay) {
  const directSelectors = [
    '[data-hashcod-brand]',
    '.boot-brand',
    '.boot-card-brand',
    '.boot-cli-brand',
    'img[alt*="hashcod" i]',
    '[aria-label*="hashcod" i]'
  ];
  for (const selector of directSelectors) {
    const node = overlay.querySelector(selector);
    const rect = visibleRect(node);
    if (rect && rect.width > 80 && rect.height > 24) return node;
  }

  let best = null;
  let bestArea = Infinity;
  overlay.querySelectorAll('div,section,header,main,span').forEach((node) => {
    const text = (node.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
    if (!text.includes('hashcod') || !text.includes('codespace')) return;
    const rect = visibleRect(node);
    if (!rect || rect.width < 130 || rect.height < 40 || rect.width > 720 || rect.height > 320) return;
    const area = rect.width * rect.height;
    if (area < bestArea) {
      best = node;
      bestArea = area;
    }
  });
  return best;
}

function findBrandRect(overlay) {
  return visibleRect(findBrandNode(overlay));
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function adjustHorizontalOffset(node, targetCenterX, dataKey) {
  if (!node) return;
  const rect = visibleRect(node);
  if (!rect) return;
  const currentCenter = rect.left + (rect.width / 2);
  const delta = targetCenterX - currentCenter;
  if (!Number.isFinite(delta) || Math.abs(delta) < 0.35) return;
  const currentOffset = Number(node.dataset[dataKey] || 0) || 0;
  const nextOffset = currentOffset + delta;
  node.dataset[dataKey] = String(nextOffset);
  node.style.setProperty('translate', `${nextOffset.toFixed(2)}px 0px`, 'important');
}

function clearHorizontalOffset(node, dataKey) {
  if (!node || !Object.prototype.hasOwnProperty.call(node.dataset, dataKey)) return;
  delete node.dataset[dataKey];
  node.style.removeProperty('translate');
}

function alignIntegrationStrip(overlayRect, enabled) {
  const stripAnchor = document.querySelector('.boot-cli-footer .boot-card-icon');
  if (!stripAnchor) return;
  if (!enabled) {
    clearHorizontalOffset(stripAnchor, 'hashcodLandingStripOffsetX');
    return;
  }
  adjustHorizontalOffset(stripAnchor, overlayRect.left + (overlayRect.width / 2), 'hashcodLandingStripOffsetX');
  stripAnchor.setAttribute('data-hashcod-composition-centered', 'true');
}

function computeScale(viewportWidth, viewportHeight) {
  if (viewportWidth <= 620) return 0.56;
  if (viewportWidth <= 900) return 0.64;
  if (viewportWidth <= 1180) return 0.72;
  return Math.min(0.9, Math.max(0.78, Math.min(viewportWidth / 1900, viewportHeight / 980)));
}

function mount() {
  const overlay = document.getElementById('bootCliOverlay');
  if (!overlay || document.getElementById('hashcodRareFolderHost')) return Boolean(overlay);

  try { sessionStorage.setItem(INTRO_SESSION_KEY, '1'); } catch (_) {}
  const oldNative = document.getElementById('hashcodBootFolderAnimation');
  if (oldNative) oldNative.remove();
  const oldIntro = document.getElementById('hashcodBootIntro');
  if (oldIntro) oldIntro.remove();
  overlay.classList.remove('hashcod-intro-running', 'hashcod-intro-revealed');

  const host = document.createElement('div');
  host.id = 'hashcodRareFolderHost';
  host.setAttribute('data-rare-ui-folder', 'true');
  Object.assign(host.style, {
    position: 'absolute',
    zIndex: '40',
    overflow: 'visible',
    pointerEvents: 'none',
    transform: 'translate(-50%, -50%)',
    contain: 'layout style',
  });
  overlay.appendChild(host);

  const reactRoot = createRoot(host);
  let currentScale = 0.82;
  let alignedBrand = null;
  let alignedStrip = null;

  const render = () => reactRoot.render(<Folder scale={currentScale} />);

  const place = () => {
    if (!host.isConnected) return;
    const overlayRect = overlay.getBoundingClientRect();
    currentScale = computeScale(overlayRect.width || window.innerWidth, overlayRect.height || window.innerHeight);
    const folderW = BASE_WIDTH * currentScale;
    const folderH = BASE_HEIGHT * currentScale;
    const desktopComposition = overlayRect.width >= DESKTOP_COMPOSITION_MIN_WIDTH;
    const brand = findBrandNode(overlay);
    const brandRect = visibleRect(brand);
    let x = overlayRect.width * 0.31;
    let y = overlayRect.height * 0.50;

    if (desktopComposition && brand && brandRect) {
      const hostRect = visibleRect(host);
      const folderVisualW = hostRect && hostRect.width > 40 ? hostRect.width : folderW * 1.20;
      const gap = clamp(overlayRect.width * 0.05, 76, 112);
      const totalWidth = folderVisualW + gap + brandRect.width;
      const groupLeft = (overlayRect.width - totalWidth) / 2;
      const targetBrandCenterLocal = groupLeft + folderVisualW + gap + (brandRect.width / 2);
      x = groupLeft + (folderVisualW / 2);
      y = (brandRect.top - overlayRect.top) + (brandRect.height / 2);

      host.style.setProperty('position', 'fixed', 'important');
      host.style.setProperty('left', `${(overlayRect.left + x).toFixed(2)}px`, 'important');
      host.style.setProperty('top', `${(overlayRect.top + y).toFixed(2)}px`, 'important');
      host.setAttribute('data-hashcod-composition-aligned', 'true');

      adjustHorizontalOffset(brand, overlayRect.left + targetBrandCenterLocal, 'hashcodLandingBrandOffsetX');
      alignedBrand = brand;
      alignIntegrationStrip(overlayRect, true);
      alignedStrip = document.querySelector('.boot-cli-footer .boot-card-icon');
    } else {
      if (alignedBrand) clearHorizontalOffset(alignedBrand, 'hashcodLandingBrandOffsetX');
      if (alignedStrip) clearHorizontalOffset(alignedStrip, 'hashcodLandingStripOffsetX');
      alignedBrand = null;
      alignedStrip = null;
      host.removeAttribute('data-hashcod-composition-aligned');
      host.style.removeProperty('position');
      host.style.removeProperty('left');
      host.style.removeProperty('top');

      if (brandRect) {
        const gap = Math.max(70, Math.min(145, overlayRect.width * 0.065));
        x = (brandRect.left - overlayRect.left) - gap - (folderW / 2);
        y = (brandRect.top - overlayRect.top) + (brandRect.height / 2);
      }
      if (overlayRect.width <= 900) {
        x = overlayRect.width * 0.50;
        y = overlayRect.height * 0.39;
      }
    }

    const minX = folderW / 2 + 24;
    const maxX = overlayRect.width - folderW / 2 - 24;
    const minY = folderH / 2 + 70;
    const maxY = overlayRect.height - folderH / 2 - 80;
    if (!desktopComposition) {
      host.style.left = `${Math.max(minX, Math.min(maxX, x))}px`;
      host.style.top = `${Math.max(minY, Math.min(maxY, y))}px`;
    }
    host.style.width = `${folderW}px`;
    host.style.height = `${folderH}px`;
    render();
  };

  place();
  let raf = 0;
  const schedulePlace = () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(place);
  };
  window.addEventListener('resize', schedulePlace, { passive: true });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(schedulePlace).catch(() => {});
  setTimeout(schedulePlace, 40);
  setTimeout(schedulePlace, 120);
  setTimeout(schedulePlace, 700);
  setTimeout(schedulePlace, 1500);

  window.addEventListener('hashcod:platform-entered', () => {
    if (alignedBrand) clearHorizontalOffset(alignedBrand, 'hashcodLandingBrandOffsetX');
    if (alignedStrip) clearHorizontalOffset(alignedStrip, 'hashcodLandingStripOffsetX');
    reactRoot.unmount();
    host.remove();
    window.removeEventListener('resize', schedulePlace);
  }, { once: true });

  return true;
}

if (!mount()) {
  let attempts = 0;
  const timer = setInterval(() => {
    attempts += 1;
    if (mount() || attempts >= 40) clearInterval(timer);
  }, 125);
}