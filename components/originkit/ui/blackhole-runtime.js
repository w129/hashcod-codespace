/**
 * Black Hole runtime — readable black/gray spiral on white.
 */
(function (global) {
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
  function lerp(a, b, t) { return a + (b - a) * t; }

  function createBlackHole(canvas, opts) {
    const cfg = Object.assign({
      showCenter: true,
      centre: { radius: 8, x: 50, y: 52 },
      background: '#ffffff',
      outerRadius: 92,
      particleCount: 2600,
      particleSize: 1.85,
      trail: 82,
      tilt: 70,
      tiltSideway: 12,
      // Constant, calm spin — no inward pull / no speed ramp
      orbitSpeed: 0.85,
      pullSpeed: 0,
      armCount: 9,
      colors: ['#111111', '#1a1a1a', '#2e2e2e', '#3d3d3d', '#555555', '#6a6a6a', '#888888', '#222222']
    }, opts || {});

    const ctx = canvas.getContext('2d', { alpha: false });
    let particles = [];
    let raf = 0;
    let running = true;
    let w = 0, h = 0, dpr = 1;
    let lastNow = performance.now();

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
      if (rNorm < 0.22) return (i % 3 === 0) ? '#333333' : '#0a0a0a';
      if (rNorm < 0.55) {
        const mid = ['#111111', '#2a2a2a', '#444444', '#1c1c1c', '#3a3a3a'];
        return mid[i % mid.length];
      }
      const outer = ['#4a4a4a', '#666666', '#7a7a7a', '#555555', '#909090'];
      return outer[i % outer.length];
    }

    function seed() {
      particles = [];
      const n = cfg.particleCount;
      const arms = Math.max(4, cfg.armCount | 0);
      const rings = 42;
      for (let i = 0; i < n; i++) {
        const ring = i % rings;
        const rNorm = Math.pow((ring + Math.random() * 0.65) / rings, 0.8);
        const arm = i % arms;
        const armOffset = (arm / arms) * Math.PI * 2;
        const spiral = rNorm * 6.2;
        const dash = (Math.floor(i / arms) % 15) / 15;
        particles.push({
          angle: armOffset + spiral + dash * 0.4 + (Math.random() - 0.5) * 0.1,
          radius: 0.1 + rNorm * 0.9,
          // slight per-particle variation only — never grows over time
          speed: 0.9 + Math.random() * 0.25,
          size: 0.55 + Math.random() * 0.95,
          color: pickColor(i, rNorm),
          phase: Math.random() * Math.PI * 2,
          stroke: 0.7 + Math.random() * 0.9,
          len: 0.85 + Math.random() * 1.5
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
      const dt = Math.min(0.05, Math.max(0, (now - lastNow) / 1000));
      lastNow = now;
      const cx = (cfg.centre.x / 100) * w;
      const cy = (cfg.centre.y / 100) * h;
      const maxR = (Math.min(w, h) * 0.5) * (cfg.outerRadius / 100);
      const coreR = (Math.min(w, h) * 0.5) * (cfg.centre.radius / 100);
      const tiltX = (cfg.tilt * Math.PI) / 180;
      const tiltZ = (cfg.tiltSideway * Math.PI) / 180;
      // constant rad/s — no radius-based Kepler boost
      const orbit = cfg.orbitSpeed * 0.22;
      const trailLen = clamp(cfg.trail / 100, 0.12, 0.95);

      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = cfg.background;
      ctx.fillRect(0, 0, w, h);

      const drawn = [];

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        // fixed angular velocity for the whole life of the particle
        p.angle += orbit * p.speed * dt;
        const angle = p.angle;
        const r = p.radius;

        const rr = r * maxR;
        const x = Math.cos(angle) * rr;
        const y = Math.sin(angle) * rr;
        const well = Math.pow(1 - clamp((r - 0.08) / 0.5, 0, 1), 2.2) * rr * 0.2;
        const z = Math.sin(angle * 2.5 + p.phase) * rr * 0.01 - well;
        const pr = project(x, y, z, tiltX, tiltZ);

        const back = trailLen * p.len * (0.04 + (1.15 - r) * 0.055);
        const a0 = angle - back;
        const pr0 = project(
          Math.cos(a0) * rr,
          Math.sin(a0) * rr,
          Math.sin(a0 * 2.5 + p.phase) * rr * 0.01 - well,
          tiltX,
          tiltZ
        );

        const depth = pr.z / maxR;
        const scale = 1.12 - depth * 0.35;
        // higher alpha on white for readability
        const alpha = clamp(0.28 + (1 - r) * 0.65 + (0.15 - depth * 0.18), 0.18, 0.95);

        drawn.push({
          sx: cx + pr.x,
          sy: cy + pr.y,
          sx0: cx + pr0.x,
          sy0: cy + pr0.y,
          depth,
          alpha,
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
      plane.addColorStop(0, 'rgba(0,0,0,0.04)');
      plane.addColorStop(0.45, 'rgba(0,0,0,0.02)');
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
        ctx.lineWidth = Math.max(0.7, d.size * d.stroke);
        ctx.beginPath();
        ctx.moveTo(d.sx0, d.sy0);
        ctx.lineTo(d.sx, d.sy);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      if (cfg.showCenter) {
        const horizon = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR * 1.7);
        horizon.addColorStop(0, '#000000');
        horizon.addColorStop(0.45, '#111111');
        horizon.addColorStop(0.78, 'rgba(40,40,40,0.55)');
        horizon.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.beginPath();
        ctx.fillStyle = horizon;
        ctx.ellipse(cx, cy, coreR * 1.4, coreR * lerp(0.34, 1.05, discA), tiltZ, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(frame);
    }

    function start() {
      resize();
      seed();
      running = true;
      lastNow = performance.now();
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
