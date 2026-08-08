/**
 * Black Hole runtime (Originkit-compatible canvas renderer)
 * Mirrors the Originkit "Black Hole" component:
 * 3D depth-sorted accretion disk, event horizon, trails, tilt, gravity inflow.
 */
(function (global) {
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }

  function createBlackHole(canvas, opts) {
    const cfg = Object.assign({
      showCenter: true,
      centre: { radius: 18, x: 50, y: 50 },
      background: '#000000',
      outerRadius: 70,
      particleCount: 1000,
      particleSize: 2.2,
      trail: 50,
      tilt: 20,
      tiltSideway: 160,
      orbitSpeed: 4,
      pullSpeed: 0.35,
      colors: ['#ffffff', '#ffd6a5', '#ffadad', '#a0c4ff', '#bdb2ff', '#fdffb6', '#caffbf']
    }, opts || {});

    const ctx = canvas.getContext('2d', { alpha: true });
    let particles = [];
    let raf = 0;
    let running = true;
    let w = 0, h = 0, dpr = 1;

    function resize() {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = Math.max(1, Math.floor(rect.width));
      h = Math.max(1, Math.floor(rect.height));
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function seed() {
      particles = [];
      const n = cfg.particleCount;
      for (let i = 0; i < n; i++) {
        const rNorm = Math.pow(Math.random(), 0.55);
        particles.push({
          angle: Math.random() * Math.PI * 2,
          radius: 0.18 + rNorm * 0.82,
          speed: (0.35 + Math.random() * 0.9) * (Math.random() < 0.5 ? 1 : -1),
          size: 0.5 + Math.random(),
          color: cfg.colors[i % cfg.colors.length],
          phase: Math.random() * Math.PI * 2,
          trail: []
        });
      }
    }

    function project(x, y, z, tiltX, tiltZ) {
      // rotate around X then Z
      const cosX = Math.cos(tiltX), sinX = Math.sin(tiltX);
      const y1 = y * cosX - z * sinX;
      const z1 = y * sinX + z * cosX;
      const cosZ = Math.cos(tiltZ), sinZ = Math.sin(tiltZ);
      const x2 = x * cosZ - y1 * sinZ;
      const y2 = x * sinZ + y1 * cosZ;
      return { x: x2, y: y2, z: z1 };
    }

    function frame(t) {
      if (!running) return;
      const cx = (cfg.centre.x / 100) * w;
      const cy = (cfg.centre.y / 100) * h;
      const maxR = (Math.min(w, h) * 0.5) * (cfg.outerRadius / 100);
      const coreR = (Math.min(w, h) * 0.5) * (cfg.centre.radius / 100);
      const tiltX = (cfg.tilt * Math.PI) / 180;
      const tiltZ = (cfg.tiltSideway * Math.PI) / 180;
      const orbit = cfg.orbitSpeed * 0.012;
      const pull = cfg.pullSpeed * 0.0015;
      const trailLen = Math.max(1, Math.floor(cfg.trail / 6));

      // fade trails via translucent clear
      ctx.fillStyle = cfg.background;
      ctx.globalAlpha = 0.22;
      ctx.fillRect(0, 0, w, h);
      ctx.globalAlpha = 1;

      const drawn = [];

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.angle += p.speed * orbit * (0.35 + (1.2 - p.radius));
        p.radius -= pull * (0.2 + (1 - p.radius));
        if (p.radius < 0.08) {
          p.radius = 0.85 + Math.random() * 0.2;
          p.angle = Math.random() * Math.PI * 2;
          p.trail = [];
        }

        const rr = p.radius * maxR;
        const x = Math.cos(p.angle) * rr;
        const y = Math.sin(p.angle) * rr;
        const z = Math.sin(p.angle * 2 + p.phase) * rr * 0.12;
        const pr = project(x, y, z, tiltX, tiltZ);
        const sx = cx + pr.x;
        const sy = cy + pr.y;
        const depth = (pr.z / maxR); // -1..1-ish
        const scale = 1.15 - depth * 0.45;
        const alpha = clamp(0.25 + (1 - p.radius) * 0.55 + (0.35 - depth * 0.2), 0.15, 1);

        p.trail.push({ x: sx, y: sy, a: alpha, s: scale });
        if (p.trail.length > trailLen) p.trail.shift();

        drawn.push({ p, sx, sy, depth, scale, alpha, size: cfg.particleSize * p.size * scale });
      }

      // depth sort (far → near)
      drawn.sort((a, b) => a.depth - b.depth);

      // soft accretion glow
      const glow = ctx.createRadialGradient(cx, cy, coreR * 0.2, cx, cy, maxR * 1.05);
      glow.addColorStop(0, 'rgba(255,220,180,0.16)');
      glow.addColorStop(0.35, 'rgba(120,90,255,0.08)');
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.ellipse(cx, cy, maxR * 1.05, maxR * (0.35 + Math.abs(Math.cos(tiltX)) * 0.55), tiltZ, 0, Math.PI * 2);
      ctx.fill();

      for (let i = 0; i < drawn.length; i++) {
        const d = drawn[i];
        // trails
        const tr = d.p.trail;
        for (let k = 0; k < tr.length; k++) {
          const pt = tr[k];
          const ta = (k / tr.length) * d.alpha * 0.55;
          ctx.beginPath();
          ctx.fillStyle = d.p.color;
          ctx.globalAlpha = ta;
          ctx.arc(pt.x, pt.y, Math.max(0.4, d.size * 0.35 * (k / tr.length)), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = d.alpha;
        ctx.beginPath();
        ctx.fillStyle = d.p.color;
        ctx.arc(d.sx, d.sy, d.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      if (cfg.showCenter) {
        // event horizon
        const horizon = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
        horizon.addColorStop(0, '#000000');
        horizon.addColorStop(0.72, '#050505');
        horizon.addColorStop(0.9, 'rgba(255,180,120,0.55)');
        horizon.addColorStop(1, 'rgba(255,220,180,0)');
        ctx.beginPath();
        ctx.fillStyle = horizon;
        ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
        ctx.fill();

        // photon ring
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255,210,160,0.55)';
        ctx.lineWidth = Math.max(1, coreR * 0.06);
        ctx.arc(cx, cy, coreR * 0.98, 0, Math.PI * 2);
        ctx.stroke();
      }

      raf = requestAnimationFrame(frame);
    }

    function start() {
      resize();
      seed();
      running = true;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(frame);
    }

    function stop() {
      running = false;
      cancelAnimationFrame(raf);
    }

    window.addEventListener('resize', () => {
      resize();
    });

    start();
    return { start, stop, resize, config: cfg };
  }

  global.OriginkitBlackHole = { create: createBlackHole };
})(window);
