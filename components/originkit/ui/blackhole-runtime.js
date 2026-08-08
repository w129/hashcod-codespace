/**
 * Black Hole runtime — Originkit-style accretion disk
 * Flattened elliptical spiral of short particle strokes (white / red / ember)
 * matching the classic Originkit Black Hole look.
 */
(function (global) {
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
  function lerp(a, b, t) { return a + (b - a) * t; }

  function createBlackHole(canvas, opts) {
    const cfg = Object.assign({
      showCenter: true,
      centre: { radius: 10, x: 50, y: 52 },
      background: '#000000',
      outerRadius: 92,
      particleCount: 2800,
      particleSize: 1.35,
      trail: 70,
      tilt: 68,
      tiltSideway: 18,
      orbitSpeed: 3.6,
      pullSpeed: 0.22,
      armCount: 7,
      colors: ['#ffffff', '#f5f5f5', '#ff3b30', '#ff2d55', '#ff6b4a', '#c8c8c8', '#8a8a8a', '#ff453a']
    }, opts || {});

    const ctx = canvas.getContext('2d', { alpha: false });
    let particles = [];
    let raf = 0;
    let running = true;
    let w = 0, h = 0, dpr = 1;
    let t0 = performance.now();

    function resize() {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = Math.max(1, Math.floor(rect.width));
      h = Math.max(1, Math.floor(rect.height));
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function pickColor(i, rNorm) {
      // denser core leans white; mid-disk reds; outer gray/white
      if (rNorm < 0.28) {
        return i % 3 === 0 ? '#ff3b30' : '#ffffff';
      }
      if (rNorm < 0.55) {
        return cfg.colors[i % cfg.colors.length];
      }
      const outer = ['#ffffff', '#d0d0d0', '#ff453a', '#9a9a9a', '#ffffff'];
      return outer[i % outer.length];
    }

    function seed() {
      particles = [];
      const n = cfg.particleCount;
      const arms = Math.max(3, cfg.armCount | 0);
      for (let i = 0; i < n; i++) {
        // bias density toward center (matches reference)
        const rNorm = Math.pow(Math.random(), 0.42);
        const arm = i % arms;
        const armOffset = (arm / arms) * Math.PI * 2;
        // spiral winding: angle tied to radius
        const spiral = rNorm * 5.8;
        particles.push({
          arm: arm,
          baseAngle: armOffset + spiral + (Math.random() - 0.5) * 0.55,
          radius: 0.12 + rNorm * 0.88,
          speed: 0.55 + Math.random() * 0.85,
          size: 0.45 + Math.random() * 0.9,
          color: pickColor(i, rNorm),
          jitter: (Math.random() - 0.5) * 0.08,
          phase: Math.random() * Math.PI * 2,
          stroke: 0.55 + Math.random() * 0.9
        });
      }
    }

    function project(x, y, z, tiltX, tiltZ) {
      const cosX = Math.cos(tiltX), sinX = Math.sin(tiltX);
      const y1 = y * cosX - z * sinX;
      const z1 = y * sinX + z * cosX;
      const cosZ = Math.cos(tiltZ), sinZ = Math.sin(tiltZ);
      const x2 = x * cosZ - y1 * sinZ;
      const y2 = x * sinZ + y1 * cosZ;
      return { x: x2, y: y2, z: z1 };
    }

    function frame(now) {
      if (!running) return;
      const elapsed = (now - t0) / 1000;
      const cx = (cfg.centre.x / 100) * w;
      const cy = (cfg.centre.y / 100) * h;
      const maxR = (Math.min(w, h) * 0.5) * (cfg.outerRadius / 100);
      const coreR = (Math.min(w, h) * 0.5) * (cfg.centre.radius / 100);
      const tiltX = (cfg.tilt * Math.PI) / 180;
      const tiltZ = (cfg.tiltSideway * Math.PI) / 180;
      const orbit = cfg.orbitSpeed * 0.55;
      const trailLen = clamp(cfg.trail / 100, 0.08, 0.95);

      // hard black — short motion streaks via stroke length, not screen fade mush
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = cfg.background;
      ctx.fillRect(0, 0, w, h);

      const drawn = [];

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        // Kepler-ish: faster near center
        const angSpeed = orbit * p.speed * (0.35 + (1.35 - p.radius) * (1.35 - p.radius));
        const angle = p.baseAngle + elapsed * angSpeed + p.jitter;

        // gentle inward drift (respawn at rim)
        let r = p.radius - cfg.pullSpeed * 0.00035 * (0.4 + (1 - p.radius));
        // subtle breathing so arms stay lively
        r += Math.sin(elapsed * 0.7 + p.phase) * 0.004;
        if (r < 0.1) {
          r = 0.82 + Math.random() * 0.18;
          p.baseAngle = Math.random() * Math.PI * 2;
          p.color = pickColor(i, r);
        }
        p.radius = r;

        const rr = r * maxR;
        const x = Math.cos(angle) * rr;
        const y = Math.sin(angle) * rr;
        // thin disk — tiny vertical thickness + inward well near core
        const well = Math.pow(1 - clamp((r - 0.12) / 0.55, 0, 1), 2) * rr * 0.18;
        const z = Math.sin(angle * 3 + p.phase) * rr * 0.015 - well;
        const pr = project(x, y, z, tiltX, tiltZ);

        // previous point along orbit for short dashed stroke
        const back = trailLen * (0.04 + (1.1 - r) * 0.06);
        const a0 = angle - back * angSpeed * 0.35;
        const x0 = Math.cos(a0) * rr;
        const y0 = Math.sin(a0) * rr;
        const z0 = Math.sin(a0 * 3 + p.phase) * rr * 0.015 - well;
        const pr0 = project(x0, y0, z0, tiltX, tiltZ);

        const sx = cx + pr.x;
        const sy = cy + pr.y;
        const sx0 = cx + pr0.x;
        const sy0 = cy + pr0.y;
        const depth = pr.z / maxR;
        const scale = 1.12 - depth * 0.4;
        // brighter / denser toward center; far side slightly dimmer
        const alpha = clamp(0.18 + (1 - r) * 0.7 + (0.2 - depth * 0.25), 0.08, 0.95);

        drawn.push({
          sx, sy, sx0, sy0, depth, alpha, scale,
          size: cfg.particleSize * p.size * scale,
          color: p.color,
          stroke: p.stroke
        });
      }

      drawn.sort((a, b) => a.depth - b.depth);

      // faint disk plane (no purple/cream glow — matches reference)
      const discA = Math.abs(Math.cos(tiltX));
      const rx = maxR * 1.02;
      const ry = maxR * lerp(0.18, 0.72, discA);
      const plane = ctx.createRadialGradient(cx, cy, coreR * 0.4, cx, cy, rx);
      plane.addColorStop(0, 'rgba(255,255,255,0.06)');
      plane.addColorStop(0.45, 'rgba(255,40,40,0.035)');
      plane.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = plane;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, tiltZ, 0, Math.PI * 2);
      ctx.fill();

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      for (let i = 0; i < drawn.length; i++) {
        const d = drawn[i];
        ctx.strokeStyle = d.color;
        ctx.globalAlpha = d.alpha;
        ctx.lineWidth = Math.max(0.45, d.size * d.stroke);
        ctx.beginPath();
        ctx.moveTo(d.sx0, d.sy0);
        ctx.lineTo(d.sx, d.sy);
        ctx.stroke();

        // bright tip
        ctx.globalAlpha = d.alpha * 0.9;
        ctx.fillStyle = d.color;
        ctx.beginPath();
        ctx.arc(d.sx, d.sy, Math.max(0.35, d.size * 0.45), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      if (cfg.showCenter) {
        // dark event horizon well (no colored photon ring — reference is pure sink)
        const horizon = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR * 1.35);
        horizon.addColorStop(0, '#000000');
        horizon.addColorStop(0.55, '#000000');
        horizon.addColorStop(0.82, 'rgba(0,0,0,0.85)');
        horizon.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.beginPath();
        ctx.fillStyle = horizon;
        ctx.ellipse(cx, cy, coreR * 1.15, coreR * lerp(0.35, 1, discA), tiltZ, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(frame);
    }

    function start() {
      resize();
      seed();
      running = true;
      t0 = performance.now();
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(frame);
    }

    function stop() {
      running = false;
      cancelAnimationFrame(raf);
    }

    window.addEventListener('resize', resize);

    start();
    return { start, stop, resize, config: cfg };
  }

  global.OriginkitBlackHole = { create: createBlackHole };
})(window);
