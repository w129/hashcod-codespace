"use client";

import React, { useEffect, useState } from "react";
import "./loading-state.css";

// Beautiful UI LoadingState supplied by the user, adapted to scoped CSS.
const chevron = Array.from({ length: 9 }, (_, i) => {
  const r = Math.floor(i / 3), c = i % 3;
  return (c + Math.abs(r - 1)) * 90;
});
const ORBIT_ORDER = [0, 1, 2, 5, 8, 7, 6, 3];
const orbit = Array.from({ length: 9 }, (_, i) => {
  const k = ORBIT_ORDER.indexOf(i);
  return k === -1 ? null : k * 110;
});
const PATTERNS = {
  Drive: { delays: chevron, dur: 650, round: false },
  Dots: { delays: chevron, dur: 650, round: true },
  Orbit: { delays: orbit, dur: 950, round: false },
};

function LoaderGrid({ delays, dur, round }) {
  return (
    <span aria-hidden="true" className="hfv-loading-grid">
      {delays.map((delay, index) => (
        <span key={index} className="hfv-loading-pixel" style={{
          borderRadius: round ? "50%" : "1px",
          opacity: delay === null ? 0.07 : 0.15,
          animation: delay === null ? "none" : `hfv-pixel-on ${dur}ms ease-in-out ${delay}ms infinite`,
        }} />
      ))}
    </span>
  );
}

function useElapsed() {
  const [ds, setDs] = useState(0);
  useEffect(() => {
    const started = Date.now();
    const timer = setInterval(() => setDs(Math.floor((Date.now() - started) / 100)), 100);
    return () => clearInterval(timer);
  }, []);
  const total = ds / 10;
  return total < 60 ? `${total.toFixed(1)}s` : `${Math.floor(total / 60)}m ${(total % 60).toFixed(1)}s`;
}

export default function LoadingState({ label, variant = "Drive", videoSrc = "https://95dnc2a95qgwt9ff.public.blob.vercel-storage.com/subway-surfers-min.mp4" }) {
  const elapsed = useElapsed();
  const surfer = variant === "Surfer";
  const resolvedLabel = label ?? (surfer ? "Subway surfing" : "Churning");
  const [videoOk, setVideoOk] = useState(true);
  const pattern = PATTERNS[variant] ?? PATTERNS.Drive;
  return (
    <div role="status" aria-live="polite" aria-atomic="true" className="hfv-loading-state" data-variant={variant}>
      <div className="hfv-loading-line">
        <LoaderGrid {...pattern} />
        <span className="hfv-loading-label">{resolvedLabel}</span>
        <span className="hfv-loading-elapsed" aria-hidden="true">{elapsed}</span>
      </div>
      {surfer && <div className="hfv-loading-video-card">
        <div className="hfv-loading-video">
          {videoOk ? <video src={videoSrc} autoPlay muted loop playsInline onError={() => setVideoOk(false)} /> :
            <div className="hfv-loading-video-fallback"><LoaderGrid {...PATTERNS.Drive} /><span>Video unavailable</span></div>}
        </div>
      </div>}
    </div>
  );
}
