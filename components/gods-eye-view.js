(function () {
  'use strict';

  if (window.__hashcodGodsEyeViewLoaded) return;
  window.__hashcodGodsEyeViewLoaded = true;

  const TOOL_ID = 'gods-eye-view';
  const TRAY_SLOT = 5;
  const MODAL_ID = 'hashcodGodsEyeView';
  const CANVAS_ID = 'hashcodGodsEyeCanvas';
  const PROFILE = 'HASHCOD-GEV-1';
  const UPSTREAM = 'https://github.com/bilawalsidhu/gods-eye-view';
  const USGS_URL = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson';
  const ISS_URL = 'https://api.wheretheiss.at/v1/satellites/25544';
  const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
  const WORLD_ATLAS_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

  const ICON = [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" aria-hidden="true" focusable="false">',
      '<circle cx="48" cy="48" r="33" fill="none" stroke="currentColor" stroke-width="5"/>',
      '<path d="M15 48h66M48 15c12 12 18 23 18 33S60 69 48 81M48 15C36 27 30 38 30 48s6 21 18 33" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>',
      '<circle cx="63" cy="36" r="5" fill="currentColor"/>',
      '<path d="M63 28v-8M63 52v-8M55 36h-8M79 36h-8" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>',
    '</svg>'
  ].join('');

  const state = {
    open: false,
    yaw: -0.35,
    pitch: 0.18,
    zoom: 1,
    dragging: false,
    dragX: 0,
    dragY: 0,
    downX: 0,
    downY: 0,
    autoRotate: true,
    grid: true,
    earthquakesEnabled: true,
    issEnabled: true,
    style: 'normal',
    earthquakes: [],
    iss: null,
    selected: null,
    countries: [],
    worldStatus: 'loading',
    eqStatus: 'loading',
    issStatus: 'loading',
    searchStatus: '',
    animationId: 0,
    lastFrame: 0,
    dataTimer: 0,
    resizeObserver: null
  };

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function degToRad(value) {
    return Number(value) * Math.PI / 180;
  }

  function radToDeg(value) {
    return Number(value) * 180 / Math.PI;
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char];
    });
  }

  function rotateVector(vector) {
    const cy = Math.cos(state.yaw);
    const sy = Math.sin(state.yaw);
    const cp = Math.cos(state.pitch);
    const sp = Math.sin(state.pitch);

    const x1 = vector.x * cy + vector.z * sy;
    const z1 = -vector.x * sy + vector.z * cy;
    const y2 = vector.y * cp - z1 * sp;
    const z2 = vector.y * sp + z1 * cp;
    return { x: x1, y: y2, z: z2 };
  }

  function inverseRotateVector(vector) {
    const cp = Math.cos(-state.pitch);
    const sp = Math.sin(-state.pitch);
    const y1 = vector.y * cp - vector.z * sp;
    const z1 = vector.y * sp + vector.z * cp;
    const cy = Math.cos(-state.yaw);
    const sy = Math.sin(-state.yaw);
    const x2 = vector.x * cy + z1 * sy;
    const z2 = -vector.x * sy + z1 * cy;
    return { x: x2, y: y1, z: z2 };
  }

  function latLonVector(lat, lon) {
    const phi = degToRad(lat);
    const lambda = degToRad(lon);
    const cosPhi = Math.cos(phi);
    return {
      x: cosPhi * Math.sin(lambda),
      y: Math.sin(phi),
      z: cosPhi * Math.cos(lambda)
    };
  }

  function project(lat, lon, frame) {
    const rotated = rotateVector(latLonVector(lat, lon));
    return {
      x: frame.cx + rotated.x * frame.radius,
      y: frame.cy - rotated.y * frame.radius,
      z: rotated.z,
      visible: rotated.z >= -0.005
    };
  }

  function unproject(x, y, frame) {
    const nx = (x - frame.cx) / frame.radius;
    const ny = -(y - frame.cy) / frame.radius;
    const d2 = nx * nx + ny * ny;
    if (d2 > 1) return null;
    const vector = inverseRotateVector({ x: nx, y: ny, z: Math.sqrt(Math.max(0, 1 - d2)) });
    const lat = radToDeg(Math.asin(clamp(vector.y, -1, 1)));
    const lon = radToDeg(Math.atan2(vector.x, vector.z));
    return { lat: lat, lon: lon };
  }

  function canvasFrame(canvas) {
    const width = canvas.clientWidth || 1;
    const height = canvas.clientHeight || 1;
    return {
      width: width,
      height: height,
      cx: width / 2,
      cy: height / 2,
      radius: Math.min(width, height) * 0.39 * state.zoom
    };
  }

  function ensureCanvasSize(canvas) {
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const width = Math.max(1, Math.round(canvas.clientWidth * dpr));
    const height = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return ctx;
  }

  function palette() {
    if (state.style === 'nvg') return { bg: '#020a05', globe: '#03190b', edge: '#65ff8d', grid: 'rgba(101,255,141,.22)', land: '#0b3f1c', landEdge: '#65ff8d', text: '#9bffb5', eq: '#faff77', iss: '#ffffff', shade: 'rgba(0,0,0,.50)' };
    if (state.style === 'flir') return { bg: '#120505', globe: '#200909', edge: '#ffb167', grid: 'rgba(255,177,103,.20)', land: '#4d120d', landEdge: '#ff7d5a', text: '#ffd9ad', eq: '#fff06a', iss: '#ffffff', shade: 'rgba(34,0,0,.42)' };
    if (state.style === 'noir') return { bg: '#070707', globe: '#151515', edge: '#f0f0f0', grid: 'rgba(255,255,255,.14)', land: '#2a2a2a', landEdge: '#a7a7a7', text: '#ffffff', eq: '#ffffff', iss: '#cfcfcf', shade: 'rgba(0,0,0,.48)' };
    return { bg: '#07111f', globe: '#0a1e33', edge: '#7ec8ff', grid: 'rgba(126,200,255,.16)', land: '#173f4a', landEdge: '#69c4b5', text: '#eaf6ff', eq: '#ffb74d', iss: '#ffffff', shade: 'rgba(0,0,0,.46)' };
  }

  function drawBackground(ctx, frame, colors) {
    ctx.clearRect(0, 0, frame.width, frame.height);
    const gradient = ctx.createRadialGradient(frame.cx, frame.cy, 0, frame.cx, frame.cy, Math.max(frame.width, frame.height) * 0.75);
    gradient.addColorStop(0, colors.globe);
    gradient.addColorStop(0.55, colors.bg);
    gradient.addColorStop(1, '#000');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, frame.width, frame.height);

    for (let i = 0; i < 90; i += 1) {
      const seed = (i * 9301 + 49297) % 233280;
      const x = (seed / 233280) * frame.width;
      const y = (((seed * 17) % 233280) / 233280) * frame.height;
      const alpha = 0.14 + ((i % 7) * 0.025);
      ctx.fillStyle = 'rgba(255,255,255,' + alpha.toFixed(3) + ')';
      ctx.fillRect(x, y, i % 13 === 0 ? 1.4 : 0.8, i % 13 === 0 ? 1.4 : 0.8);
    }
  }

  function drawSphereBase(ctx, frame, colors) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(frame.cx, frame.cy, frame.radius, 0, Math.PI * 2);
    ctx.clip();

    const ocean = ctx.createRadialGradient(frame.cx - frame.radius * 0.32, frame.cy - frame.radius * 0.38, frame.radius * 0.08, frame.cx, frame.cy, frame.radius * 1.08);
    ocean.addColorStop(0, colors.edge);
    ocean.addColorStop(0.12, colors.globe);
    ocean.addColorStop(0.74, colors.globe);
    ocean.addColorStop(1, '#010306');
    ctx.fillStyle = ocean;
    ctx.fillRect(frame.cx - frame.radius, frame.cy - frame.radius, frame.radius * 2, frame.radius * 2);

    const night = ctx.createLinearGradient(frame.cx - frame.radius, frame.cy, frame.cx + frame.radius, frame.cy);
    night.addColorStop(0, colors.shade);
    night.addColorStop(0.4, 'rgba(0,0,0,.08)');
    night.addColorStop(1, 'rgba(255,255,255,.035)');
    ctx.fillStyle = night;
    ctx.fillRect(frame.cx - frame.radius, frame.cy - frame.radius, frame.radius * 2, frame.radius * 2);
    ctx.restore();

    ctx.strokeStyle = colors.edge;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(frame.cx, frame.cy, frame.radius, 0, Math.PI * 2);
    ctx.stroke();
  }

  function drawGeoPath(ctx, coords, frame) {
    let started = false;
    let previousVisible = false;
    for (let i = 0; i < coords.length; i += 1) {
      const point = coords[i];
      const projected = project(point[1], point[0], frame);
      if (!projected.visible) {
        previousVisible = false;
        continue;
      }
      if (!started || !previousVisible) {
        ctx.moveTo(projected.x, projected.y);
        started = true;
      } else {
        ctx.lineTo(projected.x, projected.y);
      }
      previousVisible = true;
    }
  }

  function drawCountries(ctx, frame, colors) {
    if (!state.countries.length) return;
    ctx.save();
    ctx.beginPath();
    ctx.arc(frame.cx, frame.cy, frame.radius, 0, Math.PI * 2);
    ctx.clip();
    ctx.lineWidth = Math.max(0.55, frame.radius / 540);
    ctx.strokeStyle = colors.landEdge;
    ctx.fillStyle = colors.land;

    for (const polygon of state.countries) {
      ctx.beginPath();
      for (const ring of polygon) drawGeoPath(ctx, ring, frame);
      ctx.fill('evenodd');
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawGrid(ctx, frame, colors) {
    if (!state.grid) return;
    ctx.save();
    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = 0.75;
    for (let lat = -60; lat <= 60; lat += 30) {
      ctx.beginPath();
      const coords = [];
      for (let lon = -180; lon <= 180; lon += 4) coords.push([lon, lat]);
      drawGeoPath(ctx, coords, frame);
      ctx.stroke();
    }
    for (let lon = -150; lon <= 180; lon += 30) {
      ctx.beginPath();
      const coords = [];
      for (let lat = -90; lat <= 90; lat += 3) coords.push([lon, lat]);
      drawGeoPath(ctx, coords, frame);
      ctx.stroke();
    }
    ctx.restore();
  }

  function markerSizeForMagnitude(magnitude) {
    const mag = Number(magnitude || 0);
    return clamp(2.5 + Math.max(0, mag) * 1.2, 3, 11);
  }

  function drawEarthquakes(ctx, frame, colors) {
    if (!state.earthquakesEnabled) return;
    const list = state.earthquakes.slice(0, 500);
    for (const quake of list) {
      const projected = project(quake.lat, quake.lon, frame);
      if (!projected.visible) continue;
      const size = markerSizeForMagnitude(quake.mag) * (0.72 + projected.z * 0.28);
      ctx.beginPath();
      ctx.arc(projected.x, projected.y, size, 0, Math.PI * 2);
      ctx.fillStyle = colors.eq;
      ctx.globalAlpha = 0.35 + projected.z * 0.55;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = colors.text;
      ctx.lineWidth = 0.6;
      ctx.stroke();
    }
  }

  function drawIss(ctx, frame, colors) {
    if (!state.issEnabled || !state.iss) return;
    const projected = project(state.iss.lat, state.iss.lon, frame);
    if (!projected.visible) return;
    ctx.save();
    ctx.translate(projected.x, projected.y);
    ctx.strokeStyle = colors.iss;
    ctx.fillStyle = colors.iss;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-11, 0); ctx.lineTo(11, 0);
    ctx.moveTo(0, -11); ctx.lineTo(0, 11);
    ctx.stroke();
    ctx.font = '600 10px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
    ctx.fillText('ISS', 12, -9);
    ctx.restore();
  }

  function drawSelected(ctx, frame, colors) {
    if (!state.selected) return;
    const projected = project(state.selected.lat, state.selected.lon, frame);
    if (!projected.visible) return;
    const pulse = 8 + (Math.sin(Date.now() / 260) + 1) * 3;
    ctx.beginPath();
    ctx.arc(projected.x, projected.y, pulse, 0, Math.PI * 2);
    ctx.strokeStyle = colors.text;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(projected.x, projected.y, 2.8, 0, Math.PI * 2);
    ctx.fillStyle = colors.text;
    ctx.fill();
  }

  function drawHud(ctx, frame, colors) {
    ctx.save();
    ctx.fillStyle = colors.text;
    ctx.globalAlpha = 0.86;
    ctx.font = '600 10px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
    ctx.fillText('HASHCOD / GEV / LIVE', 18, 24);
    ctx.fillText('UTC ' + new Date().toISOString().slice(11, 19), 18, 42);
    ctx.fillText('EQ ' + state.earthquakes.length + ' · ISS ' + (state.iss ? 'LOCK' : '—'), 18, 60);
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function render() {
    const canvas = document.getElementById(CANVAS_ID);
    if (!canvas || !state.open) return;
    const ctx = ensureCanvasSize(canvas);
    const frame = canvasFrame(canvas);
    const colors = palette();
    drawBackground(ctx, frame, colors);
    drawSphereBase(ctx, frame, colors);
    drawCountries(ctx, frame, colors);
    drawGrid(ctx, frame, colors);
    drawEarthquakes(ctx, frame, colors);
    drawIss(ctx, frame, colors);
    drawSelected(ctx, frame, colors);
    drawHud(ctx, frame, colors);
  }

  function animate(now) {
    if (!state.open) return;
    const delta = state.lastFrame ? Math.min(50, now - state.lastFrame) : 16;
    state.lastFrame = now;
    if (state.autoRotate && !state.dragging) state.yaw += delta * 0.000035;
    render();
    state.animationId = requestAnimationFrame(animate);
  }

  function stopAnimation() {
    if (state.animationId) cancelAnimationFrame(state.animationId);
    state.animationId = 0;
    state.lastFrame = 0;
  }

  function decodeArc(topology, arcIndex) {
    const reversed = arcIndex < 0;
    const index = reversed ? ~arcIndex : arcIndex;
    const arc = topology.arcs[index] || [];
    const transform = topology.transform || { scale: [1, 1], translate: [0, 0] };
    let x = 0;
    let y = 0;
    const coords = [];
    for (const point of arc) {
      x += point[0];
      y += point[1];
      coords.push([
        x * transform.scale[0] + transform.translate[0],
        y * transform.scale[1] + transform.translate[1]
      ]);
    }
    if (reversed) coords.reverse();
    return coords;
  }

  function stitchRing(topology, arcIndexes) {
    const ring = [];
    for (let i = 0; i < arcIndexes.length; i += 1) {
      const arc = decodeArc(topology, arcIndexes[i]);
      if (!arc.length) continue;
      if (ring.length && arc.length) arc.shift();
      ring.push.apply(ring, arc);
    }
    return ring;
  }

  function topologyToPolygons(topology) {
    const objects = topology && topology.objects ? Object.values(topology.objects) : [];
    const geometries = objects.flatMap(function (object) { return object && object.geometries ? object.geometries : []; });
    const polygons = [];
    for (const geometry of geometries) {
      if (!geometry || !geometry.arcs) continue;
      if (geometry.type === 'Polygon') {
        polygons.push(geometry.arcs.map(function (ring) { return stitchRing(topology, ring); }));
      } else if (geometry.type === 'MultiPolygon') {
        for (const polygon of geometry.arcs) {
          polygons.push(polygon.map(function (ring) { return stitchRing(topology, ring); }));
        }
      }
    }
    return polygons;
  }

  async function fetchJson(url, timeoutMs) {
    const controller = typeof AbortController === 'function' ? new AbortController() : null;
    const timeout = setTimeout(function () { if (controller) controller.abort(); }, timeoutMs || 9000);
    try {
      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors',
        cache: 'no-store',
        credentials: 'omit',
        signal: controller ? controller.signal : undefined,
        headers: { Accept: 'application/json' }
      });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      return await response.json();
    } finally {
      clearTimeout(timeout);
    }
  }

  async function loadWorld() {
    if (state.countries.length) return;
    state.worldStatus = 'loading';
    updateStatus();
    try {
      const topology = await fetchJson(WORLD_ATLAS_URL, 12000);
      state.countries = topologyToPolygons(topology);
      state.worldStatus = state.countries.length ? 'online' : 'limited';
    } catch (_) {
      state.worldStatus = 'limited';
    }
    updateStatus();
  }

  async function loadEarthquakes() {
    state.eqStatus = 'loading';
    updateStatus();
    try {
      const data = await fetchJson(USGS_URL, 9000);
      state.earthquakes = Array.isArray(data && data.features) ? data.features.map(function (feature) {
        const coordinates = feature && feature.geometry && Array.isArray(feature.geometry.coordinates) ? feature.geometry.coordinates : [];
        const props = feature && feature.properties ? feature.properties : {};
        return {
          id: feature.id || '',
          lon: Number(coordinates[0] || 0),
          lat: Number(coordinates[1] || 0),
          depth: Number(coordinates[2] || 0),
          mag: Number(props.mag || 0),
          place: String(props.place || 'Earthquake'),
          time: Number(props.time || 0)
        };
      }).filter(function (item) { return Number.isFinite(item.lat) && Number.isFinite(item.lon); }) : [];
      state.eqStatus = 'online';
    } catch (_) {
      state.eqStatus = 'offline';
    }
    updateStatus();
  }

  async function loadIss() {
    state.issStatus = 'loading';
    updateStatus();
    try {
      const data = await fetchJson(ISS_URL, 7000);
      const lat = Number(data && data.latitude);
      const lon = Number(data && data.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) throw new Error('invalid ISS payload');
      state.iss = { lat: lat, lon: lon, altitude: Number(data.altitude || 0), velocity: Number(data.velocity || 0), timestamp: Number(data.timestamp || 0) };
      state.issStatus = 'online';
    } catch (_) {
      state.issStatus = 'offline';
    }
    updateStatus();
  }

  async function refreshLiveData() {
    await Promise.allSettled([loadEarthquakes(), loadIss()]);
  }

  function overallStatus() {
    if (state.eqStatus === 'online' || state.issStatus === 'online') return 'LIVE';
    if (state.eqStatus === 'loading' || state.issStatus === 'loading' || state.worldStatus === 'loading') return 'SYNC';
    return 'LOCAL';
  }

  function updateStatus() {
    const badge = document.getElementById('hashcodGevStatus');
    const detail = document.getElementById('hashcodGevStatusDetail');
    if (badge) {
      badge.textContent = overallStatus();
      badge.dataset.status = overallStatus().toLowerCase();
    }
    if (detail) {
      const parts = [
        'World ' + state.worldStatus,
        'USGS ' + state.eqStatus,
        'ISS ' + state.issStatus
      ];
      detail.textContent = parts.join(' · ');
    }
    const quakeCount = document.getElementById('hashcodGevQuakeCount');
    if (quakeCount) quakeCount.textContent = String(state.earthquakes.length);
    const issMeta = document.getElementById('hashcodGevIssMeta');
    if (issMeta) {
      issMeta.textContent = state.iss ? (state.iss.altitude.toFixed(0) + ' km · ' + state.iss.velocity.toFixed(0) + ' km/h') : 'No data';
    }
  }

  function updateSelectionPanel() {
    const box = document.getElementById('hashcodGevSelection');
    if (!box) return;
    if (!state.selected) {
      box.innerHTML = '<span class="hashcod-gev-label">TARGET</span><strong>No target selected</strong><p>Click the visible globe or search a place.</p>';
      return;
    }
    box.innerHTML = [
      '<span class="hashcod-gev-label">TARGET</span>',
      '<strong>' + escapeHtml(state.selected.label || 'Selected coordinates') + '</strong>',
      '<p>' + state.selected.lat.toFixed(4) + '°, ' + state.selected.lon.toFixed(4) + '°</p>',
      state.selected.extra ? '<small>' + escapeHtml(state.selected.extra) + '</small>' : ''
    ].join('');
  }

  function focusLocation(lat, lon, label, extra) {
    const vector = latLonVector(lat, lon);
    state.yaw = -Math.atan2(vector.x, vector.z);
    const rotatedY = vector.y;
    state.pitch = clamp(Math.asin(clamp(rotatedY, -1, 1)), -1.35, 1.35);
    state.zoom = Math.max(state.zoom, 1.12);
    state.selected = { lat: Number(lat), lon: Number(lon), label: label || 'Selected coordinates', extra: extra || '' };
    state.autoRotate = false;
    syncControls();
    updateSelectionPanel();
    render();
  }

  async function searchLocation() {
    const input = document.getElementById('hashcodGevSearchInput');
    const results = document.getElementById('hashcodGevSearchResults');
    if (!input || !results) return;
    const query = String(input.value || '').trim();
    if (!query) return;
    results.innerHTML = '<div class="hashcod-gev-search-state">Searching…</div>';
    state.searchStatus = 'loading';
    try {
      const url = NOMINATIM_URL + '?format=jsonv2&limit=5&q=' + encodeURIComponent(query);
      const data = await fetchJson(url, 9000);
      const rows = Array.isArray(data) ? data : [];
      if (!rows.length) {
        results.innerHTML = '<div class="hashcod-gev-search-state">No matches.</div>';
        state.searchStatus = 'empty';
        return;
      }
      results.innerHTML = rows.map(function (item, index) {
        return '<button type="button" data-gev-result="' + index + '"><strong>' + escapeHtml(item.display_name || query) + '</strong><span>' + escapeHtml(item.type || item.category || 'place') + '</span></button>';
      }).join('');
      rows.forEach(function (item, index) {
        const button = results.querySelector('[data-gev-result="' + index + '"]');
        if (!button) return;
        button.addEventListener('click', function () {
          focusLocation(Number(item.lat), Number(item.lon), item.display_name || query, item.type || item.category || 'place');
          results.innerHTML = '';
        });
      });
      state.searchStatus = 'online';
    } catch (_) {
      results.innerHTML = '<div class="hashcod-gev-search-state">Search unavailable. Globe controls still work.</div>';
      state.searchStatus = 'offline';
    }
  }

  function setStyle(value) {
    state.style = value;
    syncControls();
    render();
  }

  function syncControls() {
    const auto = document.getElementById('hashcodGevAuto');
    const grid = document.getElementById('hashcodGevGrid');
    const eq = document.getElementById('hashcodGevEarthquakes');
    const iss = document.getElementById('hashcodGevIss');
    if (auto) auto.checked = state.autoRotate;
    if (grid) grid.checked = state.grid;
    if (eq) eq.checked = state.earthquakesEnabled;
    if (iss) iss.checked = state.issEnabled;
    document.querySelectorAll('[data-gev-style]').forEach(function (button) {
      button.classList.toggle('active', button.getAttribute('data-gev-style') === state.style);
    });
  }

  function resetView() {
    state.yaw = -0.35;
    state.pitch = 0.18;
    state.zoom = 1;
    state.autoRotate = true;
    state.selected = null;
    syncControls();
    updateSelectionPanel();
    render();
  }

  function canvasPointerDown(event) {
    state.dragging = true;
    state.dragX = event.clientX;
    state.dragY = event.clientY;
    state.downX = event.clientX;
    state.downY = event.clientY;
    state.autoRotate = false;
    syncControls();
    event.currentTarget.setPointerCapture && event.currentTarget.setPointerCapture(event.pointerId);
  }

  function canvasPointerMove(event) {
    if (!state.dragging) return;
    const dx = event.clientX - state.dragX;
    const dy = event.clientY - state.dragY;
    state.dragX = event.clientX;
    state.dragY = event.clientY;
    state.yaw += dx * 0.006;
    state.pitch = clamp(state.pitch + dy * 0.005, -1.35, 1.35);
  }

  function canvasPointerUp(event) {
    if (!state.dragging) return;
    state.dragging = false;
    const canvas = event.currentTarget;
    if (Math.abs(event.clientX - state.downX) < 4 && Math.abs(event.clientY - state.downY) < 4) {
      const rect = canvas.getBoundingClientRect();
      const point = unproject(event.clientX - rect.left, event.clientY - rect.top, canvasFrame(canvas));
      if (point) focusLocation(point.lat, point.lon, 'Selected coordinates', 'Manual globe target');
    }
  }

  function canvasWheel(event) {
    event.preventDefault();
    const direction = event.deltaY > 0 ? -0.08 : 0.08;
    state.zoom = clamp(state.zoom + direction, 0.72, 1.42);
  }

  function ensureModal() {
    let modal = document.getElementById(MODAL_ID);
    if (modal) return modal;

    modal = document.createElement('dialog');
    modal.id = MODAL_ID;
    modal.className = 'hashcod-gev-dialog';
    modal.setAttribute('aria-labelledby', 'hashcodGevTitle');
    modal.innerHTML = [
      '<div class="hashcod-gev-shell">',
        '<header class="hashcod-gev-topbar">',
          '<div class="hashcod-gev-brand">',
            '<span class="hashcod-gev-kicker">HASHCOD / GEV / INTERNAL</span>',
            '<div><h2 id="hashcodGevTitle">God\'s Eye View</h2><span id="hashcodGevStatus" class="hashcod-gev-status" data-status="sync">SYNC</span></div>',
            '<p>Public geospatial signals rendered inside Hashcod Codespace.</p>',
          '</div>',
          '<div class="hashcod-gev-top-actions">',
            '<button id="hashcodGevReset" type="button">Reset globe</button>',
            '<button id="hashcodGevClose" type="button" class="hashcod-gev-close" aria-label="Close God\'s Eye View">×</button>',
          '</div>',
        '</header>',
        '<main class="hashcod-gev-main">',
          '<section class="hashcod-gev-stage">',
            '<canvas id="' + CANVAS_ID + '" aria-label="Interactive globe"></canvas>',
            '<div class="hashcod-gev-stage-hint">DRAG ROTATE · WHEEL ZOOM · CLICK TARGET</div>',
            '<div class="hashcod-gev-search">',
              '<input id="hashcodGevSearchInput" type="search" placeholder="Search a city or place" autocomplete="off" spellcheck="false">',
              '<button id="hashcodGevSearchButton" type="button">Locate</button>',
              '<div id="hashcodGevSearchResults" class="hashcod-gev-search-results"></div>',
            '</div>',
          '</section>',
          '<aside class="hashcod-gev-panel">',
            '<section class="hashcod-gev-card hashcod-gev-telemetry">',
              '<span class="hashcod-gev-label">TELEMETRY</span>',
              '<strong id="hashcodGevStatusDetail">World loading · USGS loading · ISS loading</strong>',
              '<div class="hashcod-gev-stat-grid">',
                '<div><span>EARTHQUAKES / 24H</span><b id="hashcodGevQuakeCount">0</b></div>',
                '<div><span>ISS</span><b id="hashcodGevIssMeta">No data</b></div>',
              '</div>',
            '</section>',
            '<section class="hashcod-gev-card">',
              '<span class="hashcod-gev-label">LAYERS</span>',
              '<label><input id="hashcodGevEarthquakes" type="checkbox" checked><span>USGS earthquakes</span></label>',
              '<label><input id="hashcodGevIss" type="checkbox" checked><span>ISS position</span></label>',
              '<label><input id="hashcodGevGrid" type="checkbox" checked><span>Latitude / longitude grid</span></label>',
              '<label><input id="hashcodGevAuto" type="checkbox" checked><span>Auto rotate</span></label>',
            '</section>',
            '<section class="hashcod-gev-card">',
              '<span class="hashcod-gev-label">SENSOR STYLE</span>',
              '<div class="hashcod-gev-style-grid">',
                '<button type="button" data-gev-style="normal" class="active">Normal</button>',
                '<button type="button" data-gev-style="nvg">NVG</button>',
                '<button type="button" data-gev-style="flir">FLIR</button>',
                '<button type="button" data-gev-style="noir">Noir</button>',
              '</div>',
            '</section>',
            '<section id="hashcodGevSelection" class="hashcod-gev-card hashcod-gev-selection">',
              '<span class="hashcod-gev-label">TARGET</span><strong>No target selected</strong><p>Click the visible globe or search a place.</p>',
            '</section>',
            '<section class="hashcod-gev-card hashcod-gev-origin">',
              '<span class="hashcod-gev-label">OPEN SOURCE ORIGIN</span>',
              '<p>Hashcod adaptation inspired by Bilawal Sidhu\'s God\'s Eye View. MIT code principles; third-party restricted datasets are not bundled.</p>',
              '<small>Profile ' + PROFILE + ' · USGS · OpenStreetMap Nominatim · WhereTheISS · Natural Earth/world-atlas</small>',
            '</section>',
          '</aside>',
        '</main>',
      '</div>'
    ].join('');
    document.body.appendChild(modal);

    const canvas = document.getElementById(CANVAS_ID);
    document.getElementById('hashcodGevClose').addEventListener('click', closeModal);
    document.getElementById('hashcodGevReset').addEventListener('click', resetView);
    document.getElementById('hashcodGevSearchButton').addEventListener('click', searchLocation);
    document.getElementById('hashcodGevSearchInput').addEventListener('keydown', function (event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        searchLocation();
      }
    });
    document.getElementById('hashcodGevEarthquakes').addEventListener('change', function (event) { state.earthquakesEnabled = Boolean(event.target.checked); });
    document.getElementById('hashcodGevIss').addEventListener('change', function (event) { state.issEnabled = Boolean(event.target.checked); });
    document.getElementById('hashcodGevGrid').addEventListener('change', function (event) { state.grid = Boolean(event.target.checked); });
    document.getElementById('hashcodGevAuto').addEventListener('change', function (event) { state.autoRotate = Boolean(event.target.checked); });
    document.querySelectorAll('[data-gev-style]').forEach(function (button) {
      button.addEventListener('click', function () { setStyle(button.getAttribute('data-gev-style')); });
    });
    canvas.addEventListener('pointerdown', canvasPointerDown);
    canvas.addEventListener('pointermove', canvasPointerMove);
    canvas.addEventListener('pointerup', canvasPointerUp);
    canvas.addEventListener('pointercancel', function () { state.dragging = false; });
    canvas.addEventListener('wheel', canvasWheel, { passive: false });
    modal.addEventListener('cancel', function (event) { event.preventDefault(); closeModal(); });

    if (typeof ResizeObserver === 'function') {
      state.resizeObserver = new ResizeObserver(function () { render(); });
      state.resizeObserver.observe(canvas);
    }
    syncControls();
    updateStatus();
    return modal;
  }

  async function openModal() {
    const modal = ensureModal();
    modal.hidden = false;
    modal.setAttribute('aria-hidden', 'false');
    if (typeof modal.showModal === 'function' && !modal.open) modal.showModal();
    else modal.setAttribute('open', '');
    state.open = true;
    document.documentElement.classList.add('hashcod-gev-open');
    stopAnimation();
    state.animationId = requestAnimationFrame(animate);
    loadWorld();
    refreshLiveData();
    if (state.dataTimer) clearInterval(state.dataTimer);
    state.dataTimer = setInterval(refreshLiveData, 60000);
    window.dispatchEvent(new CustomEvent('hashcod:gods-eye-view-open'));
  }

  function closeModal() {
    const modal = document.getElementById(MODAL_ID);
    state.open = false;
    stopAnimation();
    if (state.dataTimer) clearInterval(state.dataTimer);
    state.dataTimer = 0;
    document.documentElement.classList.remove('hashcod-gev-open');
    if (!modal) return;
    if (typeof modal.close === 'function' && modal.open) modal.close();
    else modal.removeAttribute('open');
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
    const button = document.querySelector('#hashcodVectorTray [data-vector-tray-slot="' + TRAY_SLOT + '"]');
    if (button && typeof button.focus === 'function') button.focus({ preventScroll: true });
  }

  function registerTool() {
    const api = window.HashcodVectorTray;
    if (!api || typeof api.registerTool !== 'function') return false;
    api.registerTool({
      slot: TRAY_SLOT,
      id: TOOL_ID,
      label: 'God\'s Eye View',
      iconSvg: ICON,
      onClick: openModal
    });
    return true;
  }

  function boot() {
    ensureModal();
    if (registerTool()) return;
    let attempts = 0;
    const timer = setInterval(function () {
      attempts += 1;
      if (registerTool() || attempts >= 80) clearInterval(timer);
    }, 125);
  }

  window.HashcodGodsEyeView = Object.freeze({
    open: openModal,
    close: closeModal,
    refresh: refreshLiveData,
    focus: function (lat, lon, label) { focusLocation(Number(lat), Number(lon), label || 'Selected coordinates', 'API target'); },
    diagnostics: function () {
      const modal = document.getElementById(MODAL_ID);
      const button = document.querySelector('#hashcodVectorTray [data-vector-tray-slot="' + TRAY_SLOT + '"]');
      return {
        ready: true,
        toolId: TOOL_ID,
        slot: TRAY_SLOT,
        profile: PROFILE,
        modalOpen: Boolean(modal && modal.open && !modal.hidden),
        canvasFound: Boolean(document.getElementById(CANVAS_ID)),
        buttonToolId: button ? button.getAttribute('data-tool-id') : null,
        inPlatform: true,
        externalWindowRequired: false,
        earthquakes: state.earthquakes.length,
        issAvailable: Boolean(state.iss),
        worldStatus: state.worldStatus,
        upstream: UPSTREAM
      };
    }
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
