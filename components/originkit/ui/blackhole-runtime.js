/**
 * Black Hole runtime — Originkit-style accretion disk
 * Flattened elliptical spiral of short particle strokes (white / red / ember).
 */
(function (global) {
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
  function lerp(a, b, t) { return a + (b - a) * t; }

  function createBlackHole(canvas, opts) {
    const cfg = Object.assign({
      showCenter: true,
      centre: { radius: 7, x: 50, y: 52 },
      background: '#000000',
      outerRadius: 96,
      particleCount: 4200,
      particleSize: 1.15,
      trail: 78,
      tilt: 72,
      tiltSideway: 14,
      orbitSpeed: 3.2,
      pullSpeed: 0.12,
      armCount: 10,
      colors: ['#ffffff', '#f4f4f4', '#ff2d2d', '#ff3b30', '#ff5a3c', '#d8d8d8', '#9a9a9a', '#ff453a']
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
      if (rNorm < 0.22) return (i % 4 === 0) ? '#ff2d2d' : '#ffffff';
      if (rNorm < 0.5) {
        const mid = ['#ffffff', '#ff3b30', '#ff2d2d', '#eaeaea', '#ff5a3c', '#cfcfcf'];
        return mid[i % mid.length];
      }
      const outer = ['#ffffff', '#d0d0d0', '#ff453a', '#9a9a9a', '#f0f0f0', '#b0b0b0'];
      return outer[i % outer.length];
    }

    function seed() {
      particles = [];
      const n = cfg.particleCount;
      const arms = Math.max(4, cfg.armCount | 0);
      // extra concentric rings → dashed spiral arcs like the reference
      const rings = 48;
      for (let i = 0; i < n; i++) {
        const ring = i % rings;
        const rNorm = Math.pow((ring + Math.random() * 0.7) / rings, 0.78);
        const arm = i % arms;
        const armOffset = (arm / arms) * Math.PI * 2;
        const spiral = rNorm * 6.4;
        // along-arc index for dashed look
        const dash = (Math.floor(i / arms) % 17) / 17;
        particles.push({
          baseAngle: armOffset + spiral + dash * 0.42 + (Math.random() - 0.5) * 0.12,
          radius: 0.1 + rNorm * 0.9,
          speed: 0.5 + Math.random() * 0.75 + (1 - rNorm) * 0.35,
          size: 0.4 + Math.random() * 0.75,
          color: pickColor(i, rNorm),
          jitter: (Math.random() - 0.5) * 0.04,
          phase: Math.random() * Math.PI * 2,
          stroke: 0.5 + Math.random() * 0.85,
          len: 0.7 + Math.random() * 1.4
        });
      }
    }

    function project(x, y, z, tiltX, tiltZ) {
      const cosX = Math.cos(tiltX), sinX = Math.sin(tiltX);
      const y1 = y * cosX - z * sinX;
      const z1 = y * sinX + z * cosX;
      const cosZ = Math.cos(tiltZ), sinZ = Math.sin(tiltZ);
      return {
        x: x * cosZ - y1 * sinZ,
        y: x * sinZ + y1 * cosZ,
        z: z1
      };
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
      const orbit = cfg.orbitSpeed * 0.52;
      const trailLen = clamp(cfg.trail / 100, 0.1, 0.95);

      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = cfg.background;
      ctx.fillRect(0, 0, w, h);

      const drawn = [];

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const angSpeed = orbit * p.speed * (0.28 + Math.pow(1.4 - p.radius, 2));
        const angle = p.baseAngle + elapsed * angSpeed + p.jitter;

        let r = p.radius - cfg.pullSpeed * 0.00028 * (0.35 + (1 - p.radius));
        r += Math.sin(elapsed * 0.55 + p.phase) * 0.003;
        if (r < 0.08) {
          r = 0.78 + Math.random() * 0.22;
          p.baseAngle = Math.random() * Math.PI * 2;
          p.color = pickColor(i, r);
        }
        p.radius = r;

        const rr = r * maxR;
        const x = Math.cos(angle) * rr;
        const y = Math.sin(angle) * rr;
        const well = Math.pow(1 - clamp((r - 0.08) / 0.5, 0, 1), 2.2) * rr * 0.22;
        const z = Math.sin(angle * 2.5 + p.phase) * rr * 0.012 - well;

        const pr = project(x, y, z, tiltX, tiltZ);

        // short arc segment behind the particle (dashed spiral strokes)
        const back = trailLen * p.len * (0.035 + (1.15 - r) * 0.05);
        const a0 = angle - back;
        const x0 = Math.cos(a0) * rr;
        const y0 = Math.sin(a0) * rr;
        const z0 = Math.sin(a0 * 2.5 + p.phase) * rr * 0.012 - well;
        const pr0 = project(x0, y0, z0, tiltX, tiltZ);

        const sx = cx + pr.x;
        const sy = cy + pr.y;
        const depth = pr.z / maxR;
        const scale = 1.1 - depth * 0.38;
        const alpha = clamp(0.16 + (1 - r) * 0.78 + (0.18 - depth * 0.22), 0.07, 0.98);

        drawn.push({
          sx, sy,
          sx0: cx + pr0.x,
          sy0: cy + pr0.y,
          depth, alpha, scale,
          size: cfg.particleSize * p.size * scale,
          color: p.color,
          stroke: p.stroke
        });
      }

      drawn.sort((a, b) => a.depth - b.depth);

      const discA = Math.abs(Math.cos(tiltX));
      const rx = maxR * 1.02;
      const ry = maxR * lerp(0.16, 0.7, discA);
      const plane = ctx.createRadialGradient(cx, cy, coreR * 0.2, cx, cy, rx);
      plane.addColorStop(0, 'rgba(255,255,255,0.05)');
      plane.addColorStop(0.4, 'rgba(255,30,30,0.03)');
      plane.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = plane;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, tiltZ, 0, Math.PI * 2);
      ctx.fill();

      ctx.lineCap = 'round';
      for (let i = 0; i < drawn.length; i++) {
        const d = drawn[i];
        ctx.strokeStyle = d.color;
        ctx.globalAlpha = d.alpha;
        ctx.lineWidth = Math.max(0.4, d.size * d.stroke);
        ctx.beginPath();
        ctx.moveTo(d.sx0, d.sy0);
        ctx.lineTo(d.sx, d.sy);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      if (cfg.showCenter) {
        // soft sink — dense particle core already covers most of it
        const horizon = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR * 1.6);
        horizon.addColorStop(0, '#000000');
        horizon.addColorStop(0.5, 'rgba(0,0,0,0.92)');
        horizon.addColorStop(0.85, 'rgba(0,0,0,0.45)');
        horizon.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.beginPath();
        ctx.fillStyle = horizon;
        ctx.ellipse(cx, cy, coreR * 1.35, coreR * lerp(0.32, 1.05, discA), tiltZ, 0, Math.PI * 2);
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
