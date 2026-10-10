/* Wire Terrain (Originkit) — WebGL wireframe flight over a mountain valley, ported 1:1 from the React component
   to plain JS (shaders, constants, camera and pointer steering are unchanged; props = the preset below).
   Used as the live background of the welcome (platform-intro.js). Only differences from the original: the canvas
   fills the overlay instead of having a 1200x800 minimum size, pointer position uses client coordinates so it also
   works over the logo/button, and with prefers-reduced-motion a single still frame is drawn. */
(function () {
  'use strict';
  var DEPTH = 60, HALF_X = 64, BACK = 10, FOG_NEAR = 14, FOG_FAR = 46, FLIGHT_RATE = 4, EYE_HEIGHT = 1.7, RIDGE = 4.2, VALLEY = 3;
  var FOV = (58 * Math.PI) / 180, SUN_ELEV = 0.02, SUN_RADIUS = 0.22, BASE_PITCH = (6.5 * Math.PI) / 180;
  var STEER_YAW = (11 * Math.PI) / 180, STEER_LIFT = 0.8, DPR_CAP = 2, DEG = Math.PI / 180;
  var P = { background: '#000000', lineColor: '#FFFFFF', accent: '#000000', density: 120, speed: 100, relief: 100, sunSize: 100, cameraHeight: 94, hover: 200 };

  function hex(s) { return [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16), 1]; }

  var TERRAIN_VERT = [
    'precision highp float;', 'attribute vec3 aP;', 'uniform float uCamZ;', 'uniform vec3 uCam;', 'uniform vec3 uR0;', 'uniform vec3 uR1;', 'uniform vec3 uR2;',
    'uniform vec4 uProj;', 'uniform float uAmp;', 'uniform vec2 uNudge;', 'varying float vFog;', 'varying float vDist;',
    'float hash(vec2 c) { return fract(sin(dot(c, vec2(127.1, 311.7))) * 43758.5453); }',
    'float vnoise(vec2 p, float period) {',
    '  vec2 i = floor(p); vec2 f = p - i; vec2 u = f * f * (3.0 - 2.0 * f);',
    '  float z0 = mod(i.y, period); float z1 = mod(i.y + 1.0, period);',
    '  float a = hash(vec2(i.x, z0)); float b = hash(vec2(i.x + 1.0, z0)); float c = hash(vec2(i.x, z1)); float d = hash(vec2(i.x + 1.0, z1));',
    '  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);', '}',
    'float height(float x, float z) {',
    '  float n = vnoise(vec2(x, z) / 6.0, ' + (DEPTH / 6).toFixed(1) + ') * 0.6',
    '          + vnoise(vec2(x, z) / 3.0, ' + (DEPTH / 3).toFixed(1) + ') * 0.27',
    '          + vnoise(vec2(x, z) / 1.5, ' + (DEPTH / 1.5).toFixed(1) + ') * 0.13;',
    '  float ax = abs(x);',
    '  float side = smoothstep(' + VALLEY.toFixed(1) + ', ' + (VALLEY + 13).toFixed(1) + ', ax);',
    '  return uAmp * (side * (pow(n, 1.6) * 2.1 + 0.55 * ax / ' + HALF_X.toFixed(1) + ') + 0.1 * (n - 0.5));', '}',
    'void main() {',
    '  float relA = mod(aP.y - uCamZ + ' + BACK.toFixed(1) + ', ' + DEPTH.toFixed(1) + ') - ' + BACK.toFixed(1) + ';',
    '  float zr = relA + aP.z;', '  float h = height(aP.x, uCamZ + zr);', '  vec3 q = vec3(aP.x - uCam.x, h - uCam.y, zr);',
    '  vec3 v = vec3(dot(uR0, q), dot(uR1, q), dot(uR2, q));', '  float dist = length(vec2(q.x * 0.55, zr));', '  vDist = dist;',
    '  vFog = 1.0 - smoothstep(' + FOG_NEAR.toFixed(1) + ', ' + FOG_FAR.toFixed(1) + ', dist);',
    '  gl_Position = vec4(v.x * uProj.x, v.y * uProj.y, uProj.z * v.z + uProj.w, v.z);', '  gl_Position.xy += uNudge * v.z;', '}'
  ].join('\n');

  var TERRAIN_FRAG = [
    'precision highp float;', 'uniform vec4 uColor;', 'uniform float uSolid;', 'varying float vFog;', 'varying float vDist;',
    'void main() {',
    '  float fillFog = 1.0 - smoothstep(' + (FOG_FAR - 5).toFixed(1) + ', ' + FOG_FAR.toFixed(1) + ', vDist);',
    '  float a = uColor.a * mix(vFog, fillFog, uSolid);', '  gl_FragColor = vec4(uColor.rgb, a);', '}'
  ].join('\n');

  var SKY_VERT = 'attribute vec3 aP;\nvoid main() { gl_Position = vec4(aP.xy, 0.0, 1.0); }';

  var SKY_FRAG = [
    'precision highp float;', 'uniform vec2 uRes;', 'uniform vec3 uUp;', 'uniform vec2 uFocal;', 'uniform vec3 uSun;', 'uniform float uBandT;', 'uniform vec3 uBg;', 'uniform vec4 uAccent;',
    'void main() {',
    '  vec2 p = gl_FragCoord.xy;', '  vec2 ndc = p / uRes * 2.0 - 1.0;', '  vec3 ray = vec3(ndc.x / uFocal.x, ndc.y / uFocal.y, 1.0);',
    '  float worldY = dot(uUp, ray) / length(ray);', '  float pxPerRad = uRes.y * 0.5 * uFocal.y;', '  float above = clamp(worldY * pxPerRad + 0.5, 0.0, 1.0);',
    '  vec3 col = uBg;', '  float R = max(uSun.z, 1.0);', '  vec2 dv = p - uSun.xy;', '  float d = length(dv);',
    '  float halo = exp(-max(d - R, 0.0) / (R * 0.9)) * 0.16;',
    '  col = mix(col, uAccent.rgb, halo * uAccent.a * (0.35 + 0.65 * above));',
    '  float disc = clamp(R - d + 0.5, 0.0, 1.0);', '  float yy = (uSun.y - p.y) / R;', '  float period = max(R * 0.11, 3.0);',
    '  float s = fract((uSun.y - p.y) / period + uBandT) * period;', '  float cut = clamp((yy + 0.3) * 0.5, 0.0, 0.8) * period;',
    '  float band = yy > -0.3 ? clamp(s - cut + 0.5, 0.0, 1.0) : 1.0;',
    '  vec3 sunTop = mix(uAccent.rgb, vec3(1.0, 0.93, 0.78), 0.32);',
    '  vec3 sunCol = mix(sunTop, uAccent.rgb * 0.9, clamp(yy * 0.5 + 0.5, 0.0, 1.0));',
    '  col = mix(col, sunCol, disc * band * uAccent.a);', '  gl_FragColor = vec4(col, 1.0);', '}'
  ].join('\n');

  function compile(gl, type, src) {
    var sh = gl.createShader(type);
    if (!sh) return null;
    gl.shaderSource(sh, src); gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) { gl.deleteShader(sh); return null; }
    return sh;
  }
  function link(gl, vs, fs) {
    var v = compile(gl, gl.VERTEX_SHADER, vs), f = compile(gl, gl.FRAGMENT_SHADER, fs);
    if (!v || !f) return null;
    var prog = gl.createProgram();
    if (!prog) return null;
    gl.attachShader(prog, v); gl.attachShader(prog, f);
    gl.bindAttribLocation(prog, 0, 'aP');
    gl.linkProgram(prog);
    return gl.getProgramParameter(prog, gl.LINK_STATUS) ? prog : null;
  }
  function buildLattice(rows) {
    var s = DEPTH / rows, nx = Math.max(2, 2 * Math.round(HALF_X / s));
    var tris = new Float32Array(nx * rows * 18), lines = new Float32Array(nx * rows * 12), t = 0, l = 0;
    for (var j = 0; j < rows; j++) {
      var z0 = j * s;
      for (var i = 0; i < nx; i++) {
        var x0 = -HALF_X + (i + 0.5) * s, x1 = x0 + s;
        tris.set([x0, z0, 0, x1, z0, 0, x1, z0, s, x0, z0, 0, x1, z0, s, x0, z0, s], t); t += 18;
        lines.set([x0, z0, 0, x1, z0, 0, x0, z0, 0, x0, z0, s], l); l += 12;
      }
    }
    return { tris: tris, lines: lines };
  }

  /* start({ root, canvas }) → { stop() } ; returns null when WebGL is unavailable (the black overlay stays). */
  function start(options) {
    var root = options.root, canvas = options.canvas;
    var gl = canvas.getContext('webgl', { antialias: true, alpha: false, depth: true });
    if (!gl) return null;
    var terrain = link(gl, TERRAIN_VERT, TERRAIN_FRAG), sky = link(gl, SKY_VERT, SKY_FRAG);
    if (!terrain || !sky) return null;
    var U = function (p, n) { return gl.getUniformLocation(p, n); };
    var tu = { camZ: U(terrain, 'uCamZ'), cam: U(terrain, 'uCam'), r0: U(terrain, 'uR0'), r1: U(terrain, 'uR1'), r2: U(terrain, 'uR2'), proj: U(terrain, 'uProj'), amp: U(terrain, 'uAmp'), nudge: U(terrain, 'uNudge'), color: U(terrain, 'uColor'), solid: U(terrain, 'uSolid') };
    var su = { res: U(sky, 'uRes'), up: U(sky, 'uUp'), focal: U(sky, 'uFocal'), sun: U(sky, 'uSun'), bandT: U(sky, 'uBandT'), bg: U(sky, 'uBg'), accent: U(sky, 'uAccent') };

    var quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), gl.STATIC_DRAW);
    var triBuf = gl.createBuffer(), lineBuf = gl.createBuffer(), triCount = 0, lineCount = 0, latticeRows = -1;
    gl.enableVertexAttribArray(0);
    gl.depthFunc(gl.LEQUAL);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    var W = 0, H = 0, dpr = 1;
    function resize() {
      dpr = Math.min(DPR_CAP, window.devicePixelRatio || 1);
      W = root.offsetWidth || 1200; H = root.offsetHeight || 800;
      var bw = Math.max(1, Math.round(W * dpr)), bh = Math.max(1, Math.round(H * dpr));
      if (canvas.width !== bw || canvas.height !== bh) { canvas.width = bw; canvas.height = bh; }
    }
    resize();
    var ro = window.ResizeObserver ? new ResizeObserver(resize) : null;
    if (ro) ro.observe(root); else window.addEventListener('resize', resize);

    var pointer = { nx: 0, ny: 0, active: false, presence: 0 };
    var cam = { yaw: 0, roll: 0, lift: 0, init: false };
    var camZ = 0, tIdle = 0, raf = 0, last = -1, stopped = false;
    var still = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
    var bg = hex(P.background), line = hex(P.lineColor), acc = hex(P.accent);
    var rows = Math.max(10, Math.min(120, Math.round(P.density)));
    var relief = P.relief / 100, sunSize = P.sunSize / 100, eye = Math.max(0.1, P.cameraHeight / 100) * EYE_HEIGHT, hover = Math.max(0, P.hover) / 100, rate = Math.max(0, P.speed) / 50;

    function frame(now) {
      if (stopped) return;
      if (rows !== latticeRows) {
        latticeRows = rows;
        var lat = buildLattice(rows);
        gl.bindBuffer(gl.ARRAY_BUFFER, triBuf); gl.bufferData(gl.ARRAY_BUFFER, lat.tris, gl.STATIC_DRAW); triCount = lat.tris.length / 3;
        gl.bindBuffer(gl.ARRAY_BUFFER, lineBuf); gl.bufferData(gl.ARRAY_BUFFER, lat.lines, gl.STATIC_DRAW); lineCount = lat.lines.length / 3;
      }
      var dt = last < 0 ? 0 : Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      if (!still) { camZ = (camZ + dt * rate * FLIGHT_RATE) % DEPTH; tIdle += dt * rate; }

      var pe = 1 - Math.exp(-dt * 3);
      pointer.presence += ((pointer.active ? 1 : 0) - pointer.presence) * pe;
      if (!pointer.active && pointer.presence < 0.002) pointer.presence = 0;
      var k = pointer.presence * Math.min(1, hover);
      var idleYaw = (Math.sin(tIdle * 0.21) * 3 + Math.sin(tIdle * 0.13 + 2) * 1.5) * DEG;
      var idleRoll = Math.sin(tIdle * 0.17 + 1) * 1.8 * DEG;
      var idleLift = Math.sin(tIdle * 0.11) * 0.12;
      var yawT = idleYaw * (1 - k) + pointer.nx * STEER_YAW * hover * k;
      var liftT = idleLift * (1 - k) + -pointer.ny * STEER_LIFT * hover * k;
      var rollT = idleRoll * (1 - k) - yawT * 0.55 * k;
      if (!cam.init) { cam.yaw = yawT; cam.roll = rollT; cam.lift = liftT; cam.init = true; }
      var ce = 1 - Math.exp(-dt * 2.5);
      cam.yaw += (yawT - cam.yaw) * ce; cam.roll += (rollT - cam.roll) * ce; cam.lift += (liftT - cam.lift) * ce;

      var camY = Math.max(0.35, eye * (1 + cam.lift));
      var pitch = BASE_PITCH + (camY / EYE_HEIGHT - 1) * 2.2 * DEG;
      var cy = Math.cos(cam.yaw), sy = Math.sin(cam.yaw), cp = Math.cos(pitch), sp = Math.sin(pitch), cr = Math.cos(cam.roll), sr = Math.sin(cam.roll);
      var a0 = [cy, 0, -sy], a1 = [sp * sy, cp, sp * cy], a2 = [cp * sy, -sp, cp * cy];
      var r0 = [cr * a0[0] - sr * a1[0], cr * a0[1] - sr * a1[1], cr * a0[2] - sr * a1[2]];
      var r1 = [sr * a0[0] + cr * a1[0], sr * a0[1] + cr * a1[1], sr * a0[2] + cr * a1[2]];
      var r2 = a2;

      var aspect = W / Math.max(1, H), fy = 1 / Math.tan(FOV / 2), fx = fy / aspect, near = 0.05, far = 200;
      var A = (far + near) / (far - near), B = (-2 * far * near) / (far - near);
      var sd = [0, SUN_ELEV, 1];
      var sv = [r0[0] * sd[0] + r0[1] * sd[1] + r0[2] * sd[2], r1[0] * sd[0] + r1[1] * sd[1] + r1[2] * sd[2], r2[0] * sd[0] + r2[1] * sd[1] + r2[2] * sd[2]];
      var svz = Math.max(1e-3, sv[2]), bw = canvas.width, bh = canvas.height;
      var sunX = ((sv[0] / svz) * fx * 0.5 + 0.5) * bw, sunY = ((sv[1] / svz) * fy * 0.5 + 0.5) * bh;

      gl.viewport(0, 0, bw, bh);
      gl.clearColor(bg[0] / 255, bg[1] / 255, bg[2] / 255, 1);
      gl.depthMask(true);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      gl.disable(gl.DEPTH_TEST); gl.disable(gl.BLEND);
      gl.useProgram(sky);
      gl.bindBuffer(gl.ARRAY_BUFFER, quad);
      gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
      gl.uniform2f(su.res, bw, bh);
      gl.uniform3f(su.up, r0[1], r1[1], r2[1]);
      gl.uniform2f(su.focal, fx, fy);
      gl.uniform3f(su.sun, sunX, sunY, SUN_RADIUS * sunSize * bh);
      gl.uniform1f(su.bandT, tIdle * 0.12);
      gl.uniform3f(su.bg, bg[0] / 255, bg[1] / 255, bg[2] / 255);
      gl.uniform4f(su.accent, acc[0] / 255, acc[1] / 255, acc[2] / 255, sunSize > 0 ? acc[3] : 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      gl.useProgram(terrain);
      gl.uniform1f(tu.camZ, camZ);
      gl.uniform3f(tu.cam, 0, camY, 0);
      gl.uniform3f(tu.r0, r0[0], r0[1], r0[2]);
      gl.uniform3f(tu.r1, r1[0], r1[1], r1[2]);
      gl.uniform3f(tu.r2, r2[0], r2[1], r2[2]);
      gl.uniform4f(tu.proj, fx, fy, A, B);
      gl.uniform1f(tu.amp, RIDGE * relief);
      gl.enable(gl.DEPTH_TEST); gl.enable(gl.BLEND);

      gl.depthMask(true);
      gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(1, 1);
      gl.uniform2f(tu.nudge, 0, 0);
      gl.uniform1f(tu.solid, 1);
      gl.uniform4f(tu.color, bg[0] / 255, bg[1] / 255, bg[2] / 255, 1);
      gl.bindBuffer(gl.ARRAY_BUFFER, triBuf);
      gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.TRIANGLES, 0, triCount);
      gl.disable(gl.POLYGON_OFFSET_FILL);

      gl.depthMask(false);
      gl.uniform1f(tu.solid, 0);
      gl.uniform4f(tu.color, line[0] / 255, line[1] / 255, line[2] / 255, line[3]);
      gl.bindBuffer(gl.ARRAY_BUFFER, lineBuf);
      gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.LINES, 0, lineCount);
      if (dpr > 1.25) { gl.uniform2f(tu.nudge, 2 / bw, 2 / bh); gl.drawArrays(gl.LINES, 0, lineCount); }
      gl.depthMask(true);

      window.HashcodPlatformIntroTerrain.frames += 1;
      if (!still) raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    function onMove(e) {
      var b = root.getBoundingClientRect(), w = b.width || 1, h = b.height || 1;
      pointer.nx = Math.max(-1, Math.min(1, ((e.clientX - b.left) / w) * 2 - 1));
      pointer.ny = Math.max(-1, Math.min(1, ((e.clientY - b.top) / h) * 2 - 1));
      pointer.active = true;
    }
    function onLeave() { pointer.active = false; }
    root.addEventListener('pointermove', onMove);
    root.addEventListener('pointerleave', onLeave);

    return {
      stop: function () {
        stopped = true; cancelAnimationFrame(raf);
        if (ro) ro.disconnect(); else window.removeEventListener('resize', resize);
        root.removeEventListener('pointermove', onMove); root.removeEventListener('pointerleave', onLeave);
      }
    };
  }

  window.HashcodPlatformIntroTerrain = { start: start, frames: 0 };
})();
