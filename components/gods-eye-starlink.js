(function () {
  'use strict';

  if (window.__hashcodGodsEyeStarlinkLoaded) return;
  window.__hashcodGodsEyeStarlinkLoaded = true;

  const CELESTRAK_STARLINK_URL = 'https://celestrak.org/NORAD/elements/gp.php?GROUP=STARLINK&FORMAT=JSON';
  const SPACEX_STARLINK_QUERY_URL = 'https://api.spacexdata.com/v4/starlink/query';
  const ORBIT_CACHE_KEY = 'hashcod_gev_starlink_omm_v1';
  const ORBIT_CACHE_TTL_MS = 2 * 60 * 60 * 1000;
  const META_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
  const POSITION_REFRESH_MS = 5000;
  const POSITION_BATCH_SIZE = 350;
  const MAX_CONSTELLATION_OBJECTS = 15000;
  const MAX_LIST_ROWS = 120;
  const MU = 398600.4418;
  const EARTH_RADIUS_KM = 6378.137;
  const EARTH_FLATTENING = 1 / 298.257223563;
  const J2 = 1.08262668e-3;
  const TWO_PI = Math.PI * 2;

  const state = {
    mounted: false,
    open: false,
    satellites: [],
    positions: new Map(),
    screenPoints: [],
    selectedId: '',
    search: '',
    status: 'idle',
    source: 'none',
    fetchedAt: 0,
    updateTimer: 0,
    animationId: 0,
    lastRenderAt: 0,
    generation: 0,
    metadata: new Map(),
    metadataLoading: new Set(),
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

  function normalizeRadians(value) {
    let result = value % TWO_PI;
    if (result < 0) result += TWO_PI;
    return result;
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char];
    });
  }

  function parseEpoch(value) {
    const text = String(value || '').trim();
    if (!text) return null;
    const zoned = /(?:Z|[+-]\d\d:?\d\d)$/i.test(text) ? text : text + 'Z';
    const date = new Date(zoned);
    return Number.isFinite(date.getTime()) ? date : null;
  }

  function julianDate(date) {
    return date.getTime() / 86400000 + 2440587.5;
  }

  function gmstRadians(date) {
    const jd = julianDate(date);
    const t = (jd - 2451545.0) / 36525.0;
    const degrees = 280.46061837
      + 360.98564736629 * (jd - 2451545.0)
      + 0.000387933 * t * t
      - (t * t * t) / 38710000;
    return degToRad(((degrees % 360) + 360) % 360);
  }

  function solveEccentricAnomaly(meanAnomaly, eccentricity) {
    let e = eccentricity < 0.8 ? meanAnomaly : Math.PI;
    for (let i = 0; i < 10; i += 1) {
      const f = e - eccentricity * Math.sin(e) - meanAnomaly;
      const fp = 1 - eccentricity * Math.cos(e);
      const step = f / Math.max(1e-12, fp);
      e -= step;
      if (Math.abs(step) < 1e-10) break;
    }
    return e;
  }

  function ecefToGeodetic(x, y, z) {
    const a = EARTH_RADIUS_KM;
    const f = EARTH_FLATTENING;
    const e2 = f * (2 - f);
    const lon = Math.atan2(y, x);
    const p = Math.sqrt(x * x + y * y);
    let lat = Math.atan2(z, p * (1 - e2));
    let altitude = 0;
    for (let i = 0; i < 6; i += 1) {
      const sinLat = Math.sin(lat);
      const n = a / Math.sqrt(1 - e2 * sinLat * sinLat);
      altitude = p / Math.max(1e-9, Math.cos(lat)) - n;
      lat = Math.atan2(z, p * (1 - e2 * n / Math.max(1e-9, n + altitude)));
    }
    return {
      lat: radToDeg(lat),
      lon: ((radToDeg(lon) + 540) % 360) - 180,
      altitude: altitude
    };
  }

  function propagateSatellite(satellite, date) {
    if (!satellite || !satellite.epochDate) return null;
    const dt = (date.getTime() - satellite.epochDate.getTime()) / 1000;
    const eccentricity = clamp(satellite.eccentricity, 0, 0.99);
    const inclination = degToRad(satellite.inclination);
    const n0 = satellite.meanMotion * TWO_PI / 86400;
    if (!Number.isFinite(n0) || n0 <= 0) return null;

    const semiMajorAxis = Math.cbrt(MU / (n0 * n0));
    const p = semiMajorAxis * (1 - eccentricity * eccentricity);
    const j2Scale = Math.pow(EARTH_RADIUS_KM / Math.max(1, p), 2);
    const cosI = Math.cos(inclination);
    const raan = degToRad(satellite.raan) + (-1.5 * J2 * n0 * j2Scale * cosI) * dt;
    const argPericenter = degToRad(satellite.argPericenter)
      + (0.75 * J2 * n0 * j2Scale * (5 * cosI * cosI - 1)) * dt;
    const meanRate = n0
      + 0.75 * J2 * n0 * j2Scale * Math.sqrt(1 - eccentricity * eccentricity) * (3 * cosI * cosI - 1);
    const meanAnomaly = normalizeRadians(degToRad(satellite.meanAnomaly) + meanRate * dt);
    const eccentricAnomaly = solveEccentricAnomaly(meanAnomaly, eccentricity);
    const trueAnomaly = 2 * Math.atan2(
      Math.sqrt(1 + eccentricity) * Math.sin(eccentricAnomaly / 2),
      Math.sqrt(1 - eccentricity) * Math.cos(eccentricAnomaly / 2)
    );
    const radius = semiMajorAxis * (1 - eccentricity * Math.cos(eccentricAnomaly));
    const u = argPericenter + trueAnomaly;
    const cosO = Math.cos(raan);
    const sinO = Math.sin(raan);
    const cosU = Math.cos(u);
    const sinU = Math.sin(u);
    const cosInc = Math.cos(inclination);
    const sinInc = Math.sin(inclination);
    const xEci = radius * (cosO * cosU - sinO * sinU * cosInc);
    const yEci = radius * (sinO * cosU + cosO * sinU * cosInc);
    const zEci = radius * sinU * sinInc;
    const theta = gmstRadians(date);
    const cosTheta = Math.cos(theta);
    const sinTheta = Math.sin(theta);
    const xEcef = cosTheta * xEci + sinTheta * yEci;
    const yEcef = -sinTheta * xEci + cosTheta * yEci;
    const geo = ecefToGeodetic(xEcef, yEcef, zEci);
    const speed = Math.sqrt(Math.max(0, MU * (2 / radius - 1 / semiMajorAxis)));
    return {
      lat: geo.lat,
      lon: geo.lon,
      altitude: geo.altitude,
      speed: speed,
      periodMinutes: 1440 / satellite.meanMotion,
      at: date.getTime()
    };
  }

  function normalizeOmm(row) {
    if (!row || typeof row !== 'object') return null;
    const epochDate = parseEpoch(row.EPOCH);
    const satellite = {
      id: String(row.NORAD_CAT_ID == null ? '' : row.NORAD_CAT_ID).trim(),
      name: String(row.OBJECT_NAME || '').trim(),
      internationalDesignator: String(row.OBJECT_ID || '').trim(),
      epoch: String(row.EPOCH || '').trim(),
      epochDate: epochDate,
      meanMotion: Number(row.MEAN_MOTION),
      eccentricity: Number(row.ECCENTRICITY),
      inclination: Number(row.INCLINATION),
      raan: Number(row.RA_OF_ASC_NODE),
      argPericenter: Number(row.ARG_OF_PERICENTER),
      meanAnomaly: Number(row.MEAN_ANOMALY),
      bstar: Number(row.BSTAR || 0)
    };
    if (!satellite.id || !satellite.name || !epochDate) return null;
    if (!/^STARLINK/i.test(satellite.name)) return null;
    for (const key of ['meanMotion', 'eccentricity', 'inclination', 'raan', 'argPericenter', 'meanAnomaly']) {
      if (!Number.isFinite(satellite[key])) return null;
    }
    return satellite.meanMotion > 0 ? satellite : null;
  }

  function readOrbitCache() {
    try {
      const raw = localStorage.getItem(ORBIT_CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.rows) || !Number.isFinite(Number(parsed.ts))) return null;
      parsed.rows = parsed.rows.map(function (row) {
        if (row && row.epochDate && !(row.epochDate instanceof Date)) row.epochDate = new Date(row.epochDate);
        return row;
      }).filter(function (row) { return row && row.epochDate && Number.isFinite(row.epochDate.getTime()); });
      return parsed;
    } catch (_) {
      return null;
    }
  }

  function writeOrbitCache(rows) {
    const payload = {
      ts: Date.now(),
      rows: rows.map(function (row) {
        return Object.assign({}, row, { epochDate: row.epochDate.toISOString() });
      })
    };
    try { localStorage.setItem(ORBIT_CACHE_KEY, JSON.stringify(payload)); } catch (_) {}
    return payload.ts;
  }

  async function fetchStarlinkOrbitalData(force) {
    const cached = readOrbitCache();
    if (!force && cached && Date.now() - Number(cached.ts) < ORBIT_CACHE_TTL_MS && cached.rows.length) {
      return { rows: cached.rows, fetchedAt: Number(cached.ts), source: 'CelesTrak cache' };
    }
    try {
      const response = await fetch(CELESTRAK_STARLINK_URL, {
        method: 'GET',
        mode: 'cors',
        cache: 'no-store',
        credentials: 'omit',
        headers: { Accept: 'application/json' }
      });
      if (!response.ok) throw new Error('CelesTrak HTTP ' + response.status);
      const raw = await response.json();
      if (!Array.isArray(raw)) throw new Error('Invalid CelesTrak Starlink payload');
      const rows = raw.map(normalizeOmm).filter(Boolean).slice(0, MAX_CONSTELLATION_OBJECTS);
      if (!rows.length) throw new Error('CelesTrak returned no Starlink elements');
      const ts = writeOrbitCache(rows);
      return { rows: rows, fetchedAt: ts, source: 'CelesTrak live' };
    } catch (error) {
      if (cached && cached.rows.length) {
        return { rows: cached.rows, fetchedAt: Number(cached.ts), source: 'CelesTrak stale cache', warning: String(error && error.message ? error.message : error) };
      }
      throw error;
    }
  }

  async function fetchSpaceXMetadata(noradId) {
    const id = String(noradId || '');
    const existing = state.metadata.get(id);
    if (existing && Date.now() - existing.ts < META_CACHE_TTL_MS) return existing.data;
    if (state.metadataLoading.has(id)) return null;
    state.metadataLoading.add(id);
    try {
      const response = await fetch(SPACEX_STARLINK_QUERY_URL, {
        method: 'POST',
        mode: 'cors',
        cache: 'no-store',
        credentials: 'omit',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          query: { 'spaceTrack.NORAD_CAT_ID': Number(id) },
          options: { limit: 1, select: ['version', 'launch', 'spaceTrack'] }
        })
      });
      if (!response.ok) throw new Error('SpaceX API HTTP ' + response.status);
      const data = await response.json();
      const record = data && Array.isArray(data.docs) && data.docs.length ? data.docs[0] : null;
      state.metadata.set(id, { ts: Date.now(), data: record });
      return record;
    } catch (_) {
      state.metadata.set(id, { ts: Date.now(), data: null });
      return null;
    } finally {
      state.metadataLoading.delete(id);
    }
  }

  function selectedSatellite() {
    return state.satellites.find(function (satellite) { return satellite.id === state.selectedId; }) || null;
  }

  function setStatus(status, detail) {
    state.status = status;
    const badge = document.getElementById('hashcodStarlinkStatus');
    const summary = document.getElementById('hashcodStarlinkSummary');
    if (badge) {
      badge.textContent = String(status || '').toUpperCase();
      badge.dataset.status = status;
    }
    if (summary) summary.textContent = detail || '';
    const cardStatus = document.getElementById('hashcodStarlinkCardStatus');
    if (cardStatus) cardStatus.textContent = status === 'live' ? 'LIVE' : status.toUpperCase();
  }

  function formatAge(timestamp) {
    if (!Number.isFinite(timestamp) || timestamp <= 0) return '—';
    const minutes = Math.max(0, Math.round((Date.now() - timestamp) / 60000));
    if (minutes < 60) return minutes + ' min';
    return (minutes / 60).toFixed(1) + ' h';
  }

  function updateCounts() {
    const count = document.getElementById('hashcodStarlinkCount');
    if (count) count.textContent = String(state.satellites.length);
    const loaded = document.getElementById('hashcodStarlinkLoadedCount');
    if (loaded) loaded.textContent = String(state.positions.size);
  }

  function recomputePositions() {
    const generation = ++state.generation;
    const satellites = state.satellites.slice();
    const when = new Date();
    const next = new Map();
    let index = 0;

    function step() {
      if (generation !== state.generation) return;
      const end = Math.min(satellites.length, index + POSITION_BATCH_SIZE);
      for (; index < end; index += 1) {
        const satellite = satellites[index];
        const position = propagateSatellite(satellite, when);
        if (position && Number.isFinite(position.lat) && Number.isFinite(position.lon)) next.set(satellite.id, position);
      }
      if (index < satellites.length) {
        setTimeout(step, 0);
        return;
      }
      if (generation !== state.generation) return;
      state.positions = next;
      updateCounts();
      updateList();
      updateSelectedDetails();
      renderMap();
    }

    step();
  }

  function mapPoint(lat, lon, width, height) {
    return {
      x: ((Number(lon) + 180) / 360) * width,
      y: ((90 - Number(lat)) / 180) * height
    };
  }

  function fitCanvas(canvas) {
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const width = Math.max(1, Math.round(canvas.clientWidth || 1));
    const height = Math.max(1, Math.round(canvas.clientHeight || 1));
    const pixelWidth = Math.round(width * dpr);
    const pixelHeight = Math.round(height * dpr);
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx: ctx, width: width, height: height };
  }

  function drawMap() {
    const canvas = document.getElementById('hashcodStarlinkCanvas');
    if (!canvas || !state.open) return;
    const frame = fitCanvas(canvas);
    const ctx = frame.ctx;
    const width = frame.width;
    const height = frame.height;
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#061421');
    gradient.addColorStop(1, '#010509');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(126,200,255,.13)';
    ctx.lineWidth = 1;
    for (let lon = -180; lon <= 180; lon += 30) {
      const x = ((lon + 180) / 360) * width;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let lat = -60; lat <= 60; lat += 30) {
      const y = ((90 - lat) / 180) * height;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(126,200,255,.32)';
    ctx.beginPath(); ctx.moveTo(0, height / 2); ctx.lineTo(width, height / 2); ctx.stroke();

    state.screenPoints = [];
    const selected = state.selectedId;
    ctx.fillStyle = '#dff3ff';
    for (const satellite of state.satellites) {
      const position = state.positions.get(satellite.id);
      if (!position) continue;
      const point = mapPoint(position.lat, position.lon, width, height);
      if (satellite.id === selected) continue;
      state.screenPoints.push({ x: point.x, y: point.y, id: satellite.id });
      ctx.globalAlpha = 0.64;
      ctx.fillRect(point.x - 0.75, point.y - 0.75, 1.5, 1.5);
    }
    ctx.globalAlpha = 1;

    const active = selectedSatellite();
    const activePosition = active ? state.positions.get(active.id) || propagateSatellite(active, new Date()) : null;
    if (active && activePosition) {
      const point = mapPoint(activePosition.lat, activePosition.lon, width, height);
      state.screenPoints.push({ x: point.x, y: point.y, id: active.id });
      ctx.strokeStyle = '#ffd166';
      ctx.fillStyle = '#ffd166';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(point.x, point.y, 6, 0, TWO_PI); ctx.stroke();
      ctx.beginPath(); ctx.arc(point.x, point.y, 2.5, 0, TWO_PI); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = '600 10px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
      ctx.fillText(active.name.slice(0, 28), point.x + 9, point.y - 8);
    }

    ctx.fillStyle = 'rgba(231,246,255,.88)';
    ctx.font = '600 10px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
    ctx.fillText('HASHCOD / SPACEX / STARLINK CONSTELLATION', 12, 18);
    ctx.fillText('UTC ' + new Date().toISOString().slice(11, 19) + ' · ' + state.positions.size + '/' + state.satellites.length + ' VISIBLE', 12, 34);
  }

  function renderMap() {
    drawMap();
  }

  function updateList() {
    const list = document.getElementById('hashcodStarlinkList');
    if (!list) return;
    const query = state.search.toLowerCase();
    const rows = state.satellites.filter(function (satellite) {
      return !query
        || satellite.name.toLowerCase().includes(query)
        || satellite.id.includes(query)
        || satellite.internationalDesignator.toLowerCase().includes(query);
    }).slice(0, MAX_LIST_ROWS);
    if (!rows.length) {
      list.innerHTML = '<div class="hashcod-starlink-empty">No Starlink satellites match this filter.</div>';
      return;
    }
    list.innerHTML = rows.map(function (satellite) {
      const position = state.positions.get(satellite.id);
      const active = satellite.id === state.selectedId ? ' active' : '';
      return '<button type="button" class="hashcod-starlink-row' + active + '" data-starlink-id="' + escapeHtml(satellite.id) + '"><span><strong>' + escapeHtml(satellite.name) + '</strong><small>NORAD ' + escapeHtml(satellite.id) + ' · ' + escapeHtml(satellite.internationalDesignator || '—') + '</small></span><b>' + (position ? position.altitude.toFixed(0) + ' km' : '—') + '</b></button>';
    }).join('');
    list.querySelectorAll('[data-starlink-id]').forEach(function (button) {
      button.addEventListener('click', function () { selectSatellite(button.getAttribute('data-starlink-id')); });
    });
  }

  async function updateSelectedDetails() {
    const box = document.getElementById('hashcodStarlinkDetails');
    if (!box) return;
    const satellite = selectedSatellite();
    if (!satellite) {
      box.innerHTML = '<strong>Select a Starlink satellite</strong><span>Search by Starlink name or NORAD catalog number, or click a point on the map.</span>';
      return;
    }
    const position = state.positions.get(satellite.id) || propagateSatellite(satellite, new Date());
    if (!position) return;
    const metadataEntry = state.metadata.get(satellite.id);
    const metadata = metadataEntry ? metadataEntry.data : null;
    const spaceTrack = metadata && metadata.spaceTrack ? metadata.spaceTrack : null;
    const archiveLine = metadata
      ? '<small>SpaceX archive · version ' + escapeHtml(metadata.version || '—') + ' · launch ' + escapeHtml(metadata.launch || '—') + (spaceTrack && spaceTrack.LAUNCH_DATE ? ' · ' + escapeHtml(spaceTrack.LAUNCH_DATE) : '') + '</small>'
      : '<small>SpaceX archive metadata: ' + (state.metadataLoading.has(satellite.id) ? 'loading…' : 'not available for this current satellite') + '</small>';

    box.innerHTML = [
      '<div class="hashcod-starlink-detail-head"><div><span>NORAD ' + escapeHtml(satellite.id) + '</span><strong>' + escapeHtml(satellite.name) + '</strong></div><button id="hashcodStarlinkFocusGlobe" type="button">Focus globe</button></div>',
      '<div class="hashcod-starlink-coordinate-grid">',
        '<div><span>LATITUDE</span><b>' + position.lat.toFixed(5) + '°</b></div>',
        '<div><span>LONGITUDE</span><b>' + position.lon.toFixed(5) + '°</b></div>',
        '<div><span>ALTITUDE</span><b>' + position.altitude.toFixed(1) + ' km</b></div>',
        '<div><span>VELOCITY</span><b>' + position.speed.toFixed(3) + ' km/s</b></div>',
        '<div><span>PERIOD</span><b>' + position.periodMinutes.toFixed(2) + ' min</b></div>',
        '<div><span>INCLINATION</span><b>' + satellite.inclination.toFixed(3) + '°</b></div>',
      '</div>',
      '<p>Epoch ' + escapeHtml(satellite.epoch) + '</p>',
      archiveLine
    ].join('');

    const focus = document.getElementById('hashcodStarlinkFocusGlobe');
    if (focus) focus.addEventListener('click', function () {
      if (window.HashcodGodsEyeView && typeof window.HashcodGodsEyeView.focus === 'function') {
        window.HashcodGodsEyeView.focus(position.lat, position.lon, satellite.name + ' · NORAD ' + satellite.id);
      }
    });

    if (!metadataEntry && !state.metadataLoading.has(satellite.id)) {
      void fetchSpaceXMetadata(satellite.id).then(function () {
        if (state.selectedId === satellite.id) updateSelectedDetails();
      });
    }
  }

  function selectSatellite(id) {
    if (!id) return;
    state.selectedId = String(id);
    updateList();
    updateSelectedDetails();
    renderMap();
  }

  function handleMapClick(event) {
    const canvas = event.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    let nearest = null;
    let nearestDistance = 12;
    for (const point of state.screenPoints) {
      const distance = Math.hypot(point.x - x, point.y - y);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = point;
      }
    }
    if (nearest) selectSatellite(nearest.id);
  }

  async function loadConstellation(force) {
    setStatus('sync', 'Loading the complete public Starlink orbital set from CelesTrak…');
    try {
      const result = await fetchStarlinkOrbitalData(Boolean(force));
      state.satellites = result.rows.slice(0, MAX_CONSTELLATION_OBJECTS);
      state.fetchedAt = result.fetchedAt;
      state.source = result.source;
      if (state.selectedId && !state.satellites.some(function (satellite) { return satellite.id === state.selectedId; })) state.selectedId = '';
      updateCounts();
      recomputePositions();
      setStatus('live', state.satellites.length + ' Starlink objects · ' + result.source + ' · orbital data age ' + formatAge(result.fetchedAt));
    } catch (error) {
      state.satellites = [];
      state.positions = new Map();
      updateCounts();
      setStatus('offline', 'Starlink orbital source unavailable: ' + String(error && error.message ? error.message : error));
    }
  }

  function startUpdates() {
    if (state.updateTimer) clearInterval(state.updateTimer);
    state.updateTimer = setInterval(function () {
      if (state.open && state.satellites.length) recomputePositions();
    }, POSITION_REFRESH_MS);
  }

  function stopUpdates() {
    if (state.updateTimer) clearInterval(state.updateTimer);
    state.updateTimer = 0;
    state.generation += 1;
  }

  function animate(now) {
    if (!state.open) return;
    const diagnostics = window.HashcodGodsEyeView && window.HashcodGodsEyeView.diagnostics ? window.HashcodGodsEyeView.diagnostics() : null;
    if (diagnostics && !diagnostics.modalOpen) {
      closeOverlay();
      return;
    }
    if (now - state.lastRenderAt > 250) {
      state.lastRenderAt = now;
      renderMap();
    }
    state.animationId = requestAnimationFrame(animate);
  }

  function stopAnimation() {
    if (state.animationId) cancelAnimationFrame(state.animationId);
    state.animationId = 0;
  }

  function openOverlay() {
    const overlay = document.getElementById('hashcodStarlinkOverlay');
    if (!overlay) return;
    if (window.HashcodSatelliteOrbits && typeof window.HashcodSatelliteOrbits.close === 'function') window.HashcodSatelliteOrbits.close();
    overlay.hidden = false;
    state.open = true;
    stopAnimation();
    state.animationId = requestAnimationFrame(animate);
    startUpdates();
    if (!state.satellites.length) void loadConstellation(false);
    else recomputePositions();
  }

  function closeOverlay() {
    state.open = false;
    stopAnimation();
    stopUpdates();
    const overlay = document.getElementById('hashcodStarlinkOverlay');
    if (overlay) overlay.hidden = true;
  }

  function buildUi() {
    const modal = document.getElementById('hashcodGodsEyeView');
    if (!modal || document.getElementById('hashcodGevStarlinkCard')) return false;
    const panel = modal.querySelector('.hashcod-gev-panel');
    const stage = modal.querySelector('.hashcod-gev-stage');
    if (!panel || !stage) return false;

    const card = document.createElement('section');
    card.id = 'hashcodGevStarlinkCard';
    card.className = 'hashcod-gev-card hashcod-starlink-card';
    card.innerHTML = [
      '<div class="hashcod-starlink-card-head"><div><span class="hashcod-gev-label">SPACEX / STARLINK</span><strong>Constellation view</strong></div><span id="hashcodStarlinkCardStatus">IDLE</span></div>',
      '<p>Visualiza la constelación pública completa de Starlink y consulta sus coordenadas subsatelitales.</p>',
      '<div class="hashcod-starlink-card-stats"><span>SATELLITES <b id="hashcodStarlinkCount">0</b></span><span>POSITIONED <b id="hashcodStarlinkLoadedCount">0</b></span></div>',
      '<button id="hashcodStarlinkOpen" type="button" class="hashcod-starlink-open">Open SpaceX / Starlink</button>'
    ].join('');
    const origin = panel.querySelector('.hashcod-gev-origin');
    panel.insertBefore(card, origin || null);

    const overlay = document.createElement('section');
    overlay.id = 'hashcodStarlinkOverlay';
    overlay.className = 'hashcod-starlink-overlay';
    overlay.hidden = true;
    overlay.innerHTML = [
      '<div class="hashcod-starlink-shell">',
        '<header class="hashcod-starlink-topbar">',
          '<div><span class="hashcod-gev-label">HASHCOD / SPACEX / STARLINK</span><strong>Starlink constellation tracker</strong><small id="hashcodStarlinkSummary">Waiting for orbital data</small></div>',
          '<div class="hashcod-starlink-top-actions"><span id="hashcodStarlinkStatus" class="hashcod-starlink-status" data-status="idle">IDLE</span><button id="hashcodStarlinkClose" type="button" aria-label="Close Starlink tracker">×</button></div>',
        '</header>',
        '<div class="hashcod-starlink-controls">',
          '<label>SEARCH<input id="hashcodStarlinkSearch" type="search" placeholder="STARLINK-xxxx or NORAD ID" autocomplete="off" spellcheck="false"></label>',
          '<button id="hashcodStarlinkSync" type="button">Sync all Starlink</button>',
        '</div>',
        '<div class="hashcod-starlink-map-wrap"><canvas id="hashcodStarlinkCanvas" aria-label="Map of SpaceX Starlink satellites"></canvas></div>',
        '<div class="hashcod-starlink-bottom">',
          '<div id="hashcodStarlinkList" class="hashcod-starlink-list"><div class="hashcod-starlink-empty">Load the constellation to begin.</div></div>',
          '<div id="hashcodStarlinkDetails" class="hashcod-starlink-details"><strong>Select a Starlink satellite</strong><span>Search by name/NORAD or click a point on the map.</span></div>',
        '</div>',
        '<footer class="hashcod-starlink-foot">Current orbit: CelesTrak GP/OMM · 2 h cache · optional SpaceX Community API metadata is historical/maintenance-only · visual coordinates use Hashcod Kepler/J2 display propagation, not operational-grade SGP4.</footer>',
      '</div>'
    ].join('');
    stage.appendChild(overlay);

    document.getElementById('hashcodStarlinkOpen').addEventListener('click', openOverlay);
    document.getElementById('hashcodStarlinkClose').addEventListener('click', closeOverlay);
    document.getElementById('hashcodStarlinkSync').addEventListener('click', function () { void loadConstellation(true); });
    document.getElementById('hashcodStarlinkSearch').addEventListener('input', function (event) {
      state.search = String(event.target.value || '').trim();
      updateList();
    });
    document.getElementById('hashcodStarlinkCanvas').addEventListener('click', handleMapClick);

    if (typeof ResizeObserver === 'function') {
      state.resizeObserver = new ResizeObserver(renderMap);
      state.resizeObserver.observe(document.getElementById('hashcodStarlinkCanvas'));
    }

    state.mounted = true;
    return true;
  }

  function boot() {
    if (buildUi()) return;
    let attempts = 0;
    const timer = setInterval(function () {
      attempts += 1;
      if (buildUi() || attempts >= 120) clearInterval(timer);
    }, 150);
  }

  window.HashcodStarlinkLayer = Object.freeze({
    open: openOverlay,
    close: closeOverlay,
    sync: function () { return loadConstellation(true); },
    select: selectSatellite,
    propagate: function (id, when) {
      const satellite = state.satellites.find(function (item) { return item.id === String(id); });
      return satellite ? propagateSatellite(satellite, when instanceof Date ? when : new Date(when || Date.now())) : null;
    },
    diagnostics: function () {
      const selected = selectedSatellite();
      const position = selected ? state.positions.get(selected.id) || propagateSatellite(selected, new Date()) : null;
      return {
        ready: state.mounted,
        open: state.open,
        source: state.source || 'CelesTrak GP/OMM',
        orbitalApi: CELESTRAK_STARLINK_URL,
        metadataApi: SPACEX_STARLINK_QUERY_URL,
        metadataApiCurrent: false,
        satelliteCount: state.satellites.length,
        positionedCount: state.positions.size,
        selectedId: state.selectedId || null,
        selectedPosition: position ? { lat: position.lat, lon: position.lon, altitude: position.altitude } : null,
        positionRefreshMs: POSITION_REFRESH_MS,
        cacheTtlMs: ORBIT_CACHE_TTL_MS,
        maxConstellationObjects: MAX_CONSTELLATION_OBJECTS,
        propagation: 'Kepler-J2-display',
        operationalGrade: false,
        inPlatform: true,
        externalWindowRequired: false
      };
    }
  });

  window.addEventListener('hashcod:gods-eye-view-open', boot);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
