/* Brings the welcome illustration to life: pedestrians stroll, vehicles drive and stop at the crosswalks,
   and the fountain sparkles. The picture is rebuilt from a clean "plate" (assets/intro/life/plate.webp, the
   drawing with those figures painted out) plus cut-out sprites (atlas.webp); see scripts/build-intro-life.py.
   Everything starts exactly where it is in the original picture. Started by platform-intro.js, never when the
   visitor prefers reduced motion, and it leaves the static picture in place if anything fails to load. */
(function () {
  'use strict';

  var FRAME_MS = 1000 / 30;            // 30 fps keeps the pixel-art feel and spares batteries
  var CAR_SPEED = { 1: 54, '-1': 46 }; // image pixels per second, per driving direction
  var CROSS_CYCLE = 15, CROSS_GO = 10; // seconds: cars drive for CROSS_GO, then wait for pedestrians
  var STOP_GAP = 8, FOLLOW_GAP = 14;

  function load(url, type) {
    return fetch(url, { credentials: 'same-origin' }).then(function (r) {
      if (!r.ok) throw new Error(url);
      return type === 'json' ? r.json() : r.blob();
    });
  }
  function script(url) {
    return new Promise(function (ok, bad) {
      var el = document.createElement('script');
      el.src = url; el.onload = function () { ok(window.HashcodIntroLifeManifest); }; el.onerror = bad;
      document.head.appendChild(el);
    });
  }
  function image(url) {
    return load(url, 'blob').then(function (blob) {
      return createImageBitmap ? createImageBitmap(blob) : new Promise(function (ok, bad) {
        var i = new Image(); i.onload = function () { ok(i); }; i.onerror = bad; i.src = URL.createObjectURL(blob);
      });
    });
  }
  function rand(a, b) { return a + Math.random() * (b - a); }

  function start(options) {
    var stage = options.stage, still = options.img, base = options.base;
    var dir = base + 'assets/intro/life/', v = '?v=' + (options.version || '1');
    var stopped = false, raf = 0;
    var state = { ready: false, frames: 0, walkers: 0, vehicles: 0 };

    Promise.all([script(dir + 'life.js' + v), image(dir + 'plate.webp' + v), image(dir + 'atlas.webp' + v), image(dir + 'walkable.png' + v)])
      .then(function (assets) {
        if (stopped) return;
        run(assets[0], assets[1], assets[2], assets[3]);
      })
      .catch(function () { /* keep the still picture */ });

    function run(manifest, plate, atlas, walkImg) {
      var W = manifest.width, H = manifest.height, CELL = manifest.cell;
      var gw = Math.floor(W / CELL), gh = Math.floor(H / CELL);
      var gc = document.createElement('canvas'); gc.width = walkImg.width; gc.height = walkImg.height;
      var gx = gc.getContext('2d'); gx.drawImage(walkImg, 0, 0);
      var walk = gx.getImageData(0, 0, gc.width, gc.height).data;
      function open(x, y) {
        if (x < 0 || y < 0 || x >= W || y >= H) return false;
        return walk[(((y / CELL) | 0) * gw + ((x / CELL) | 0)) * 4] > 127;
      }

      var canvas = document.createElement('canvas');
      canvas.className = 'hpi-life';
      canvas.width = W; canvas.height = H;
      canvas.setAttribute('aria-hidden', 'true');
      var ctx = canvas.getContext('2d', { alpha: false });
      ctx.imageSmoothingEnabled = false;

      // ---- pedestrians
      var walkers = manifest.people.map(function (sp) {
        var w = { sp: sp, x: sp.x + sp.w / 2, y: sp.y + sp.h, dx: 0, dy: 0, speed: 0, mode: 'idle', timer: rand(0, 4), phase: rand(0, 1) };
        if (!open(w.x, w.y)) { // spawn on the nearest open ground
          for (var r = 4; r < 40 && !open(w.x, w.y); r += 4) {
            for (var a = 0; a < 8; a++) {
              var tx = sp.x + sp.w / 2 + Math.cos(a * Math.PI / 4) * r, ty = sp.y + sp.h + Math.sin(a * Math.PI / 4) * r;
              if (open(tx, ty)) { w.x = tx; w.y = ty; r = 99; break; }
            }
          }
        }
        w.x0 = w.x; w.y0 = w.y;
        return w;
      });
      var DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [0.7, 0.7], [-0.7, 0.7], [0.7, -0.7], [-0.7, -0.7]];
      function canStand(w, x, y) {
        var half = Math.max(2, w.sp.w / 3);
        return open(x, y) && open(x - half, y) && open(x + half, y);
      }
      function newHeading(w) {
        for (var tries = 0; tries < 12; tries++) {
          var d = DIRS[(Math.random() * (tries < 8 ? 4 : 8)) | 0];
          var ahead = 14 + w.sp.h * 0.3;
          if (canStand(w, w.x + d[0] * ahead, w.y + d[1] * ahead)) {
            w.dx = d[0]; w.dy = d[1];
            w.speed = w.sp.h * rand(0.42, 0.68); // taller (closer) figures cover more picture per second
            w.mode = 'walk'; w.timer = rand(2.5, 7);
            return;
          }
        }
        w.mode = 'idle'; w.timer = rand(0.8, 2);
      }
      function stepWalker(w, dt) {
        w.timer -= dt;
        if (w.mode === 'idle') { if (w.timer <= 0) newHeading(w); return; }
        var nx = w.x + w.dx * w.speed * dt, ny = w.y + w.dy * w.speed * dt;
        if (!canStand(w, nx, ny) || !canStand(w, nx + w.dx * 6, ny + w.dy * 6)) { w.mode = 'idle'; w.timer = rand(0.4, 1.8); return; }
        w.x = nx; w.y = ny;
        w.phase += (w.speed * dt) / Math.max(8, w.sp.h * 0.55); // one full step cycle per stride
        if (w.timer <= 0) { w.mode = 'idle'; w.timer = rand(0.5, 3); }
      }
      function drawWalker(w) {
        var sp = w.sp, left = Math.round(w.x - sp.w / 2), top = Math.round(w.y - sp.h);
        if (w.mode !== 'walk') { ctx.drawImage(atlas, sp.sx, sp.sy, sp.w, sp.h, left, top, sp.w, sp.h); return; }
        var cycle = w.phase % 1, bob = (cycle % 0.5) < 0.25 ? 0 : 1;      // the body dips on every step
        var legY = Math.round(sp.h * 0.6), half = Math.floor(sp.w / 2);
        var liftLeft = cycle < 0.5 ? 1 : 0, liftRight = cycle < 0.5 ? 0 : 1; // legs alternate
        ctx.drawImage(atlas, sp.sx, sp.sy, sp.w, legY, left, top + bob, sp.w, legY);
        ctx.drawImage(atlas, sp.sx, sp.sy + legY, half, sp.h - legY, left, top + legY - liftLeft, half, sp.h - legY);
        ctx.drawImage(atlas, sp.sx + half, sp.sy + legY, sp.w - half, sp.h - legY, left + half, top + legY - liftRight, sp.w - half, sp.h - legY);
      }

      // ---- vehicles
      var cars = manifest.vehicles.map(function (sp) {
        return { sp: sp, x: sp.x, speed: CAR_SPEED[sp.dir], v: CAR_SPEED[sp.dir], top: sp.lane - (sp.bottom - sp.y) };
      });
      var cross = manifest.crosswalks;
      function front(c) { return c.sp.dir > 0 ? c.x + c.sp.w : c.x; }
      function stepCars(dt, clock) {
        var red = (clock % CROSS_CYCLE) >= CROSS_GO;
        cars.forEach(function (c) {
          var want = c.speed, dirn = c.sp.dir, f = front(c);
          // wait at the crosswalk while pedestrians cross, unless already on it
          if (red) {
            cross.forEach(function (z) {
              var line = dirn > 0 ? z[0] - STOP_GAP : z[1] + STOP_GAP, dist = (line - f) * dirn;
              if (dist >= -1 && dist < 30) want = Math.min(want, Math.max(0, dist * 2));
            });
          }
          // keep a distance from the vehicle ahead in the same lane
          cars.forEach(function (o) {
            if (o === c || o.sp.dir !== dirn) return;
            var gap = dirn > 0 ? o.x - (c.x + c.sp.w) : c.x - (o.x + o.sp.w);
            if (gap >= -2 && gap < 60) want = Math.min(want, Math.max(0, (gap - FOLLOW_GAP) * 2.2));
          });
          c.v += (want - c.v) * Math.min(1, dt * 4);
          c.x += dirn * c.v * dt;
          if (dirn > 0 && c.x > W + 6) c.x = -c.sp.w - 6;
          if (dirn < 0 && c.x < -c.sp.w - 6) c.x = W + 6;
        });
      }

      // ---- sparkle on the fountain
      var sparks = [];
      function stepSparks(dt) {
        if (Math.random() < dt * 14) {
          var onJet = Math.random() < 0.55;
          sparks.push({ x: onJet ? rand(891, 905) : rand(760, 1040), y: onJet ? rand(512, 585) : rand(585, 650), life: rand(0.15, 0.4) });
        }
        sparks = sparks.filter(function (s) { s.life -= dt; return s.life > 0; });
      }

      function frame() {
        var order = walkers.slice().sort(function (a, b) { return a.y - b.y; });
        ctx.drawImage(plate, 0, 0);
        order.forEach(drawWalker);
        cars.forEach(function (c) { ctx.drawImage(atlas, c.sp.sx, c.sp.sy, c.sp.w, c.sp.h, Math.round(c.x), Math.round(c.top), c.sp.w, c.sp.h); });
        manifest.poles.forEach(function (p) { ctx.drawImage(atlas, p.sx, p.sy, p.w, p.h, p.x, p.y, p.w, p.h); });
        ctx.fillStyle = '#fff';
        sparks.forEach(function (s) { ctx.fillRect(Math.round(s.x), Math.round(s.y), 2, 2); });
      }

      // first frame is the original picture; then swap the still image for the living canvas
      frame();
      stage.insertBefore(canvas, still.nextSibling);
      still.style.visibility = 'hidden';
      state.ready = true; state.walkers = walkers.length; state.vehicles = cars.length;
      window.HashcodPlatformIntroLife.state = function () {
        return { ready: state.ready, frames: state.frames, walkers: walkers.length, walking: walkers.filter(function (w) { return w.mode === 'walk'; }).length,
          moved: walkers.filter(function (w) { return Math.abs(w.x - w.x0) + Math.abs(w.y - w.y0) > 6; }).length,
          drivers: cars.filter(function (c) { return Math.abs(c.x - c.sp.x) > 6; }).length };
      };

      var last = performance.now(), acc = 0, clock = 0;
      function tick(now) {
        if (stopped) return;
        raf = requestAnimationFrame(tick);
        var dt = Math.min(0.1, (now - last) / 1000);
        last = now; acc += dt * 1000;
        if (acc < FRAME_MS) return;
        var step = Math.min(acc, 100) / 1000; acc = 0; clock += step;
        walkers.forEach(function (w) { stepWalker(w, step); });
        stepCars(step, clock);
        stepSparks(step);
        frame();
        state.frames += 1;
      }
      raf = requestAnimationFrame(tick);
    }

    return {
      stop: function () {
        stopped = true; cancelAnimationFrame(raf);
      }
    };
  }

  window.HashcodPlatformIntroLife = { start: start, state: function () { return { ready: false }; } };
})();
