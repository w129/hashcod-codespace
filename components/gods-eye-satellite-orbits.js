(function () {
  'use strict';

  if (window.__hashcodGodsEyeSatelliteOrbitsLoaded) return;
  window.__hashcodGodsEyeSatelliteOrbitsLoaded = true;

  const CELESTRAK_BASE = 'https://celestrak.org/NORAD/elements/gp.php';
  const WORLD_ATLAS_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';
  const CACHE_TTL_MS = 2 * 60 * 60 * 1000;
  const MAX_VISIBLE_SATELLITES = 500;
  const MU = 398600.4418;
  const EARTH_RADIUS_KM = 6378.137;
  const EARTH_FLATTENING = 1 / 298.257223563;
  const J2 = 1.08262668e-3;
  const TWO_PI = Math.PI * 2;

  const GROUPS = Object.freeze({
    stations: { label: 'Space stations', query: 'GROUP=STATIONS' },
    visual: { label: 'Bright / visual', query: 'GROUP=VISUAL' },
    weather: { label: 'Weather', query: 'GROUP=WEATHER' },
    gps: { label: 'GPS operational', query: 'GROUP=GPS-OPS' },
    galileo: { label: 'Galileo', query: 'GROUP=GALILEO' },
    beidou: { label: 'BeiDou', query: 'GROUP=BEIDOU' },
    geo: { label: 'Geosynchronous', query: 'GROUP=GEO' },
    science: { label: 'Science', query: 'GROUP=SCIENCE' },
    amateur: { label: 'Amateur radio', query: 'GROUP=AMATEUR' },
    oneweb: { label: 'OneWeb', query: 'GROUP=ONEWEB' }
  });

  const state = {
    mounted: false,
    open: false,
    group: 'stations',
    satellites: [],
    positions: new Map(),
    screenPoints: [],
    selectedId: '',
    search: '',
    status: 'idle',
    statusDetail: 'Waiting for orbital data',
    fetchedAt: 0,
    cacheMode: 'none',
    polygons: [],
    mapStatus: 'loading',
    animationId: 0,
    lastPositionUpdate: 0,
    lastRenderAt: 0,
    selectedTrack: [],
    trackComputedAt: 0,
    memoryCache: new Map(),
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
    let eccentricAnomaly = eccentricity < 0.8 ? meanAnomaly : Math.PI;
    for (let i = 0; i < 12; i += 1) {
      const f = eccentricAnomaly - eccentricity * Math.sin(eccentricAnomaly) - meanAnomaly;
      const fp = 1 - eccentricity * Math.cos(eccentricAnomaly);
      const step = f / Math.max(1e-12, fp);
      eccentricAnomaly -= step;
      if (Math.abs(step) < 1e-10) break;
    }
    return eccentricAnomaly;
  }

  function ecefToGeodetic(x, y, z) {
    const a = EARTH_RADIUS_KM;
    const f = EARTH_FLATTENING;
    const e2 = f * (2 - f);
    const lon = Math.atan2(y, x);
    const p = Math.sqrt(x * x + y * y);
    let lat = Math.atan2(z, p * (1 - e2));
    let altitude = 0;

    for (let i = 0; i < 7; i += 1) {
      const sinLat = Math.sin(lat);
      const n = a / Math.sqrt(1 - e2 * sinLat * sinLat);
      altitude = p / Math.max(1e-9, Math.cos(lat)) - n;
      const denominator = p * (1 - e2 * n / Math.max(1e-9, n + altitude));
      lat = Math.atan2(z, denominator);
    }

    return {
      lat: radToDeg(lat),
      lon: ((radToDeg(lon) + 540) % 360) - 180,
      altitude: altitude
    };
  }

  function propagateSatellite(satellite, date) {
    const epoch = satellite.epochDate;
    if (!epoch) return null;
    const dt = (date.getTime() - epoch.getTime()) / 1000;
    const eccentricity = clamp(satellite.eccentricity, 0, 0.99);
    const inclination = degToRad(satellite.inclination);
    const n0 = satellite.meanMotion * TWO_PI / 86400;
    if (!Number.isFinite(n0) || n0 <= 0) return null;

    const semiMajorAxis = Math.cbrt(MU / (n0 * n0));
    const p = semiMajorAxis * (1 - eccentricity * eccentricity);
    const j2Scale = Math.pow(EARTH_RADIUS_KM / Math.max(1, p), 2);
    const cosI = Math.cos(inclination);
    const raanRate = -1.5 * J2 * n0 * j2Scale * cosI;
    const argPericenterRate = 0.75 * J2 * n0 * j2Scale * (5 * cosI * cosI - 1);
    const meanCorrectionRate = 0.75 * J2 * n0 * j2Scale * Math.sqrt(1 - eccentricity * eccentricity) * (3 * cosI * cosI - 1);

    const raan = degToRad(satellite.raan) + raanRate * dt;
    const argPericenter = degToRad(satellite.argPericenter) + argPericenterRate * dt;
    const meanAnomaly = normalizeRadians(degToRad(satellite.meanAnomaly) + (n0 + meanCorrectionRate) * dt);
    const eccentricAnomaly = solveEccentricAnomaly(meanAnomaly, eccentricity);
    const trueAnomaly = 2 * Math.atan2(
      Math.sqrt(1 + eccentricity) * Math.sin(eccentricAnomaly / 2),
      Math.sqrt(1 - eccentricity) * Math.cos(eccentricAnomaly / 2)
    );
    const radius = semiMajorAxis * (1 - eccentricity * Math.cos(eccentricAnomaly));
    const argumentOfLatitude = argPericenter + trueAnomaly;

    const cosO = Math.cos(raan);
    const sinO = Math.sin(raan);
    const cosU = Math.cos(argumentOfLatitude);
    const sinU = Math.sin(argumentOfLatitude);
    const cosInclination = Math.cos(inclination);
    const sinInclination = Math.sin(inclination);

    const xEci = radius * (cosO * cosU - sinO * sinU * cosInclination);
    const yEci = radius * (sinO * cosU + cosO * sinU * cosInclination);
    const zEci = radius * (sinU * sinInclination);

    const theta = gmstRadians(date);
    const cosTheta = Math.cos(theta);
    const sinTheta = Math.sin(theta);
    const xEcef = cosTheta * xEci + sinTheta * yEci;
    const yEcef = -sinTheta * xEci + cosTheta * yEci;
    const zEcef = zEci;
    const geodetic = ecefToGeodetic(xEcef, yEcef, zEcef);
    const speed = Math.sqrt(Math.max(0, MU * (2 / radius - 1 / semiMajorAxis)));

    return {
      lat: geodetic.lat,
      lon: geodetic.lon,
      altitude: geodetic.altitude,
      speed: speed,
      radius: radius,
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
      objectType: String(row.OBJECT_TYPE || 'SATELLITE').trim(),
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
    for (const key of ['meanMotion', 'eccentricity', 'inclination', 'raan', 'argPericenter', 'meanAnomaly']) {
      if (!Number.isFinite(satellite[key])) return null;
    }
    if (satellite.meanMotion <= 0) return null;
    return satellite;
  }

  function cacheKey(query) {
    return 'hashcod_gev_celestrak_v2_' + encodeURIComponent(query.toUpperCase());
  }

  function readCache(query) {
    const key = cacheKey(query);
    if (state.memoryCache.has(key)) return state.memoryCache.get(key);
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.rows) || !Number.isFinite(Number(parsed.ts))) return null;
      state.memoryCache.set(key, parsed);
      return parsed;
    } catch (_) {
      return null;
    }
  }

  function writeCache(query, rows) {
    const payload = { ts: Date.now(), rows: rows };
    const key = cacheKey(query);
    state.memoryCache.set(key, payload);
    try {
      localStorage.setItem(key, JSON.stringify(payload));
    } catch (_) {}
    return payload;
  }

  async function fetchCelestrak(query) {
    const cached = readCache(query);
    const cacheAge = cached ? Date.now() - Number(cached.ts) : Infinity;
    if (cached && cacheAge < CACHE_TTL_MS) {
      return { rows: cached.rows, fetchedAt: Number(cached.ts), cacheMode: 'fresh-cache' };
    }

    const url = CELESTRAK_BASE + '?' + query + '&FORMAT=JSON';
    try {
      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors',
        cache: 'no-store',
        credentials: 'omit',
        headers: { Accept: 'application/json' }
      });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const rawRows = await response.json();
      if (!Array.isArray(rawRows)) throw new Error('Invalid orbital payload');
      const rows = rawRows.map(normalizeOmm).filter(Boolean);
      const stored = writeCache(query, rows);
      return { rows: stored.rows, fetchedAt: stored.ts, cacheMode: 'celestrak-live' };
    } catch (error) {
      if (cached && cached.rows.length) {
        return { rows: cached.rows, fetchedAt: Number(cached.ts), cacheMode: 'stale-cache', error: String(error && error.message ? error.message : error) };
      }
      throw error;
    }
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
      if (ring.length) arc.shift();
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
        for (const polygon of geometry.arcs) polygons.push(polygon.map(function (ring) { return stitchRing(topology, ring); }));
      }
    }
    return polygons;
  }

  async function loadMapGeometry() {
    if (state.polygons.length || state.mapStatus === 'online') return;
    state.mapStatus = 'loading';
    try {
      const response = await fetch(WORLD_ATLAS_URL, { mode: 'cors', cache: 'force-cache', credentials: 'omit' });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const topology = await response.json();
      state.polygons = topologyToPolygons(topology);
      state.mapStatus = state.polygons.length ? 'online' : 'limited';
    } catch (_) {
      state.mapStatus = 'limited';
    }
  }

  function setStatus(status, detail) {
    state.status = status;
    state.statusDetail = detail || '';
    const badge = document.getElementById('hashcodOrbitStatus');
    const summary = document.getElementById('hashcodOrbitSummary');
    if (badge) {
      badge.textContent = status.toUpperCase();
      badge.dataset.status = status;
    }
    if (summary) summary.textContent = state.statusDetail;
  }

  function selectedSatellite() {
    return state.satellites.find(function (satellite) { return satellite.id === state.selectedId; }) || null;
  }

  function updatePositions(force) {
    const nowMs = Date.now();
    if (!force && nowMs - state.lastPositionUpdate < 900) return;
    state.lastPositionUpdate = nowMs;
    const date = new Date(nowMs);
    const positions = new Map();
    for (const satellite of state.satellites.slice(0, MAX_VISIBLE_SATELLITES)) {
      const position = propagateSatellite(satellite, date);
      if (position && Number.isFinite(position.lat) && Number.isFinite(position.lon)) positions.set(satellite.id, position);
    }
    state.positions = positions;

    const selected = selectedSatellite();
    if (selected && nowMs - state.trackComputedAt >= 900) {
      state.trackComputedAt = nowMs;
      state.selectedTrack = computeGroundTrack(selected, date);
    }
    updateSelectedDetails();
  }

  function computeGroundTrack(satellite, date) {
    const current = propagateSatellite(satellite, date);
    if (!current) return [];
    const periodMs = clamp(current.periodMinutes, 80, 1500) * 60000;
    const start = date.getTime() - periodMs * 0.5;
    const points = [];
    const samples = 180;
    for (let i = 0; i <= samples; i += 1) {
      const sampleDate = new Date(start + periodMs * (i / samples));
      const position = propagateSatellite(satellite, sampleDate);
      if (position) points.push(position);
    }
    return points;
  }

  function formatCoordinate(value, positive, negative) {
    const number = Number(value);
    if (!Number.isFinite(number)) return '—';
    return Math.abs(number).toFixed(4) + '° ' + (number >= 0 ? positive : negative);
  }

  function formatAge(timestamp) {
    if (!Number.isFinite(timestamp) || timestamp <= 0) return '—';
    const minutes = Math.max(0, Math.round((Date.now() - timestamp) / 60000));
    if (minutes < 60) return minutes + ' min';
    return (minutes / 60).toFixed(1) + ' h';
  }

  function updateSelectedDetails() {
    const box = document.getElementById('hashcodOrbitDetails');
    if (!box) return;
    const satellite = selectedSatellite();
    if (!satellite) {
      box.innerHTML = '<strong>Select a satellite</strong><span>Click a marker or a row to inspect its current sub-satellite coordinates.</span>';
      return;
    }
    const position = state.positions.get(satellite.id) || propagateSatellite(satellite, new Date());
    if (!position) return;
    const epochAgeHours = Math.abs(Date.now() - satellite.epochDate.getTime()) / 3600000;
    box.innerHTML = [
      '<div class="hashcod-orbit-detail-head"><div><span>NORAD ' + escapeHtml(satellite.id) + '</span><strong>' + escapeHtml(satellite.name) + '</strong></div><button id="hashcodOrbitFocusGlobe" type="button">Focus globe</button></div>',
      '<div class="hashcod-orbit-coordinate-grid">',
        '<div><span>LATITUDE</span><b>' + formatCoordinate(position.lat, 'N', 'S') + '</b><small>' + position.lat.toFixed(5) + '°</small></div>',
        '<div><span>LONGITUDE</span><b>' + formatCoordinate(position.lon, 'E', 'W') + '</b><small>' + position.lon.toFixed(5) + '°</small></div>',
        '<div><span>ALTITUDE</span><b>' + position.altitude.toFixed(1) + ' km</b><small>WGS84 estimate</small></div>',
        '<div><span>VELOCITY</span><b>' + position.speed.toFixed(3) + ' km/s</b><small>' + (position.speed * 3600).toFixed(0) + ' km/h</small></div>',
        '<div><span>PERIOD</span><b>' + position.periodMinutes.toFixed(2) + ' min</b><small>' + satellite.meanMotion.toFixed(6) + ' rev/day</small></div>',
        '<div><span>INCLINATION</span><b>' + satellite.inclination.toFixed(3) + '°</b><small>Epoch age ' + epochAgeHours.toFixed(1) + ' h</small></div>',
      '</div>',
      '<p class="hashcod-orbit-epoch">Epoch ' + escapeHtml(satellite.epoch) + ' · ' + escapeHtml(satellite.internationalDesignator || satellite.objectType) + '</p>'
    ].join('');
    const focus = document.getElementById('hashcodOrbitFocusGlobe');
    if (focus) focus.addEventListener('click', function () {
      if (window.HashcodGodsEyeView && typeof window.HashcodGodsEyeView.focus === 'function') {
        window.HashcodGodsEyeView.focus(position.lat, position.lon, satellite.name + ' · NORAD ' + satellite.id);
      }
    });
  }

  function updateList() {
    const list = document.getElementById('hashcodOrbitList');
    const count = document.getElementById('hashcodOrbitCount');
    if (count) count.textContent = String(state.satellites.length);
    if (!list) return;
    const query = state.search.toLowerCase();
    const rows = state.satellites.filter(function (satellite) {
      return !query || satellite.name.toLowerCase().includes(query) || satellite.id.includes(query) || satellite.internationalDesignator.toLowerCase().includes(query);
    }).slice(0, 80);
    if (!rows.length) {
      list.innerHTML = '<div class="hashcod-orbit-empty">No satellites match this filter.</div>';
      return;
    }
    list.innerHTML = rows.map(function (satellite) {
      const position = state.positions.get(satellite.id);
      const selected = satellite.id === state.selectedId ? ' active' : '';
      return '<button type="button" class="hashcod-orbit-row' + selected + '" data-orbit-id="' + escapeHtml(satellite.id) + '"><span><strong>' + escapeHtml(satellite.name) + '</strong><small>NORAD ' + escapeHtml(satellite.id) + '</small></span><b>' + (position ? position.altitude.toFixed(0) + ' km' : '—') + '</b></button>';
    }).join('');
    list.querySelectorAll('[data-orbit-id]').forEach(function (button) {
      button.addEventListener('click', function () { selectSatellite(button.getAttribute('data-orbit-id')); });
    });
  }

  function selectSatellite(id) {
    if (!id) return;
    state.selectedId = String(id);
    state.trackComputedAt = 0;
    updatePositions(true);
    updateList();
    renderMap();
  }

  async function loadGroup(groupKey) {
    if (!GROUPS[groupKey]) groupKey = 'stations';
    state.group = groupKey;
    state.search = '';
    const searchInput = document.getElementById('hashcodOrbitSearch');
    if (searchInput) searchInput.value = '';
    setStatus('sync', 'Loading ' + GROUPS[groupKey].label + ' orbital elements…');
    try {
      const result = await fetchCelestrak(GROUPS[groupKey].query);
      state.satellites = result.rows.slice(0, MAX_VISIBLE_SATELLITES);
      state.fetchedAt = result.fetchedAt;
      state.cacheMode = result.cacheMode;
      if (state.selectedId && !state.satellites.some(function (satellite) { return satellite.id === state.selectedId; })) state.selectedId = '';
      updatePositions(true);
      updateList();
      setStatus('live', GROUPS[groupKey].label + ' · ' + state.satellites.length + ' objects · ' + result.cacheMode + ' · elements age ' + formatAge(result.fetchedAt));
    } catch (error) {
      state.satellites = [];
      state.positions = new Map();
      setStatus('offline', 'CelesTrak unavailable: ' + String(error && error.message ? error.message : error));
      updateList();
    }
  }

  async function remoteSearch() {
    const input = document.getElementById('hashcodOrbitSearch');
    if (!input) return;
    const query = String(input.value || '').trim();
    state.search = query;
    updateList();
    if (!query) return;
    const localMatch = state.satellites.some(function (satellite) {
      return satellite.id === query || satellite.name.toLowerCase().includes(query.toLowerCase());
    });
    if (localMatch) return;
    if (query.length < 3) return;

    const celestrakQuery = /^\d{1,9}$/.test(query)
      ? 'CATNR=' + encodeURIComponent(query)
      : 'NAME=' + encodeURIComponent(query.toUpperCase());
    setStatus('sync', 'Searching CelesTrak for ' + query + '…');
    try {
      const result = await fetchCelestrak(celestrakQuery);
      const merged = new Map(state.satellites.map(function (satellite) { return [satellite.id, satellite]; }));
      result.rows.slice(0, 100).forEach(function (satellite) { merged.set(satellite.id, satellite); });
      state.satellites = Array.from(merged.values()).slice(0, MAX_VISIBLE_SATELLITES);
      state.search = query;
      updatePositions(true);
      updateList();
      if (result.rows.length === 1) selectSatellite(result.rows[0].id);
      setStatus('live', 'Search returned ' + result.rows.length + ' objects · ' + result.cacheMode);
    } catch (error) {
      setStatus('offline', 'Satellite search unavailable: ' + String(error && error.message ? error.message : error));
    }
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

  function drawMapBackground(ctx, width, height) {
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#071421');
    gradient.addColorStop(1, '#02070c');
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
  }

  function drawLand(ctx, width, height) {
    if (!state.polygons.length) return;
    ctx.fillStyle = 'rgba(25,70,77,.50)';
    ctx.strokeStyle = 'rgba(105,196,181,.55)';
    ctx.lineWidth = 0.65;
    for (const polygon of state.polygons) {
      ctx.beginPath();
      for (const ring of polygon) {
        let previous = null;
        for (const coordinate of ring) {
          const point = mapPoint(coordinate[1], coordinate[0], width, height);
          if (!previous || Math.abs(point.x - previous.x) > width * 0.5) ctx.moveTo(point.x, point.y);
          else ctx.lineTo(point.x, point.y);
          previous = point;
        }
      }
      ctx.fill('evenodd');
      ctx.stroke();
    }
  }

  function drawGroundTrack(ctx, width, height) {
    if (!state.selectedTrack.length) return;
    ctx.save();
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 1.35;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    let previous = null;
    for (const position of state.selectedTrack) {
      const point = mapPoint(position.lat, position.lon, width, height);
      if (!previous || Math.abs(point.x - previous.x) > width * 0.48) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
      previous = point;
    }
    ctx.stroke();
    ctx.restore();
  }

  function drawSatellites(ctx, width, height) {
    state.screenPoints = [];
    const selected = state.selectedId;
    for (const satellite of state.satellites.slice(0, MAX_VISIBLE_SATELLITES)) {
      const position = state.positions.get(satellite.id);
      if (!position) continue;
      const point = mapPoint(position.lat, position.lon, width, height);
      const active = satellite.id === selected;
      state.screenPoints.push({ x: point.x, y: point.y, id: satellite.id });
      ctx.beginPath();
      ctx.arc(point.x, point.y, active ? 5.5 : 2.2, 0, TWO_PI);
      ctx.fillStyle = active ? '#ffd166' : '#dff3ff';
      ctx.globalAlpha = active ? 1 : 0.82;
      ctx.fill();
      ctx.globalAlpha = 1;
      if (active) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(point.x - 9, point.y); ctx.lineTo(point.x + 9, point.y);
        ctx.moveTo(point.x, point.y - 9); ctx.lineTo(point.x, point.y + 9);
        ctx.stroke();
        ctx.fillStyle = '#fff';
        ctx.font = '600 10px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
        ctx.fillText(satellite.name.slice(0, 26), point.x + 9, point.y - 8);
      }
    }
  }

  function drawMapHud(ctx, width, height) {
    ctx.fillStyle = 'rgba(231,246,255,.88)';
    ctx.font = '600 10px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
    ctx.fillText('HASHCOD / ORBITAL TRACKER / ' + GROUPS[state.group].label.toUpperCase(), 12, 18);
    ctx.fillText('UTC ' + new Date().toISOString().slice(11, 19) + ' · ' + state.satellites.length + ' OBJECTS', 12, 34);
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(231,246,255,.58)';
    ctx.fillText('GP/OMM · APPROX GROUND TRACK', width - 12, 18);
    ctx.textAlign = 'left';
  }

  function renderMap() {
    const canvas = document.getElementById('hashcodOrbitCanvas');
    if (!canvas || !state.open) return;
    const frame = fitCanvas(canvas);
    drawMapBackground(frame.ctx, frame.width, frame.height);
    drawLand(frame.ctx, frame.width, frame.height);
    drawGroundTrack(frame.ctx, frame.width, frame.height);
    drawSatellites(frame.ctx, frame.width, frame.height);
    drawMapHud(frame.ctx, frame.width, frame.height);
  }

  function animate(now) {
    if (!state.open) return;
    const gev = window.HashcodGodsEyeView && window.HashcodGodsEyeView.diagnostics ? window.HashcodGodsEyeView.diagnostics() : null;
    if (gev && !gev.modalOpen) {
      closeOverlay();
      return;
    }
    updatePositions(false);
    if (now - state.lastRenderAt > 100) {
      state.lastRenderAt = now;
      renderMap();
      if (now - state.lastPositionUpdate < 120) updateList();
    }
    state.animationId = requestAnimationFrame(animate);
  }

  function stopAnimation() {
    if (state.animationId) cancelAnimationFrame(state.animationId);
    state.animationId = 0;
  }

  function openOverlay() {
    const overlay = document.getElementById('hashcodOrbitOverlay');
    if (!overlay) return;
    overlay.hidden = false;
    state.open = true;
    stopAnimation();
    state.animationId = requestAnimationFrame(animate);
    loadMapGeometry().then(renderMap);
    if (!state.satellites.length) loadGroup(state.group);
    else updatePositions(true);
  }

  function closeOverlay() {
    state.open = false;
    stopAnimation();
    const overlay = document.getElementById('hashcodOrbitOverlay');
    if (overlay) overlay.hidden = true;
  }

  function handleMapClick(event) {
    const canvas = event.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    let nearest = null;
    let nearestDistance = 14;
    for (const point of state.screenPoints) {
      const distance = Math.hypot(point.x - x, point.y - y);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = point;
      }
    }
    if (nearest) selectSatellite(nearest.id);
  }

  function buildUi() {
    const modal = document.getElementById('hashcodGodsEyeView');
    if (!modal || document.getElementById('hashcodGevOrbitCard')) return false;
    const panel = modal.querySelector('.hashcod-gev-panel');
    const stage = modal.querySelector('.hashcod-gev-stage');
    if (!panel || !stage) return false;

    const card = document.createElement('section');
    card.id = 'hashcodGevOrbitCard';
    card.className = 'hashcod-gev-card hashcod-orbit-card';
    card.innerHTML = [
      '<div class="hashcod-orbit-card-head"><div><span class="hashcod-gev-label">ORBITRON / SATELLITES</span><strong>Live orbital map</strong></div><span id="hashcodOrbitCardStatus">GP/OMM</span></div>',
      '<p>Visualiza objetos orbitales públicos y consulta sus coordenadas subsatelitales.</p>',
      '<div class="hashcod-orbit-card-stats"><span>GROUP <b id="hashcodOrbitCardGroup">Stations</b></span><span>OBJECTS <b id="hashcodOrbitCount">0</b></span></div>',
      '<button id="hashcodOrbitOpen" type="button" class="hashcod-orbit-open">Open satellite tracker</button>'
    ].join('');
    const origin = panel.querySelector('.hashcod-gev-origin');
    panel.insertBefore(card, origin || null);

    const overlay = document.createElement('section');
    overlay.id = 'hashcodOrbitOverlay';
    overlay.className = 'hashcod-orbit-overlay';
    overlay.hidden = true;
    overlay.innerHTML = [
      '<div class="hashcod-orbit-shell">',
        '<header class="hashcod-orbit-topbar">',
          '<div><span class="hashcod-gev-label">HASHCOD / ORBITRON MODE</span><strong>Satellite orbital tracker</strong><small id="hashcodOrbitSummary">Waiting for orbital data</small></div>',
          '<div class="hashcod-orbit-top-actions"><span id="hashcodOrbitStatus" class="hashcod-orbit-status" data-status="idle">IDLE</span><button id="hashcodOrbitClose" type="button" aria-label="Close orbital tracker">×</button></div>',
        '</header>',
        '<div class="hashcod-orbit-controls">',
          '<label>GROUP<select id="hashcodOrbitGroup">' + Object.keys(GROUPS).map(function (key) { return '<option value="' + key + '">' + GROUPS[key].label + '</option>'; }).join('') + '</select></label>',
          '<label>SEARCH<input id="hashcodOrbitSearch" type="search" placeholder="Name or NORAD ID" autocomplete="off" spellcheck="false"></label>',
          '<button id="hashcodOrbitFind" type="button">Find</button>',
          '<button id="hashcodOrbitSync" type="button">Sync elements</button>',
        '</div>',
        '<div class="hashcod-orbit-map-wrap"><canvas id="hashcodOrbitCanvas" aria-label="Orbitron-style satellite map"></canvas></div>',
        '<div class="hashcod-orbit-bottom">',
          '<div id="hashcodOrbitList" class="hashcod-orbit-list"><div class="hashcod-orbit-empty">Load a group to begin.</div></div>',
          '<div id="hashcodOrbitDetails" class="hashcod-orbit-details"><strong>Select a satellite</strong><span>Click a marker or a row to inspect its current sub-satellite coordinates.</span></div>',
        '</div>',
        '<footer class="hashcod-orbit-foot">CelesTrak GP/OMM · cached 2 h · visual coordinates use a Kepler/J2 display propagator and are not operational-grade SGP4.</footer>',
      '</div>'
    ].join('');
    stage.appendChild(overlay);

    document.getElementById('hashcodOrbitOpen').addEventListener('click', openOverlay);
    document.getElementById('hashcodOrbitClose').addEventListener('click', closeOverlay);
    document.getElementById('hashcodOrbitGroup').addEventListener('change', function (event) {
      const value = String(event.target.value || 'stations');
      const cardGroup = document.getElementById('hashcodOrbitCardGroup');
      if (cardGroup) cardGroup.textContent = GROUPS[value] ? GROUPS[value].label : 'Stations';
      loadGroup(value);
    });
    document.getElementById('hashcodOrbitSearch').addEventListener('input', function (event) {
      state.search = String(event.target.value || '').trim();
      updateList();
    });
    document.getElementById('hashcodOrbitSearch').addEventListener('keydown', function (event) {
      if (event.key === 'Enter') { event.preventDefault(); remoteSearch(); }
    });
    document.getElementById('hashcodOrbitFind').addEventListener('click', remoteSearch);
    document.getElementById('hashcodOrbitSync').addEventListener('click', function () { loadGroup(state.group); });
    document.getElementById('hashcodOrbitCanvas').addEventListener('click', handleMapClick);

    if (typeof ResizeObserver === 'function') {
      state.resizeObserver = new ResizeObserver(function () { renderMap(); });
      state.resizeObserver.observe(document.getElementById('hashcodOrbitCanvas'));
    }

    state.mounted = true;
    loadGroup(state.group);
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

  window.HashcodSatelliteOrbits = Object.freeze({
    open: openOverlay,
    close: closeOverlay,
    loadGroup: loadGroup,
    select: selectSatellite,
    propagate: function (id, when) {
      const satellite = state.satellites.find(function (item) { return item.id === String(id); });
      return satellite ? propagateSatellite(satellite, when instanceof Date ? when : new Date(when || Date.now())) : null;
    },
    diagnostics: function () {
      const selected = selectedSatellite();
      const position = selected ? state.positions.get(selected.id) : null;
      return {
        ready: state.mounted,
        open: state.open,
        source: 'CelesTrak GP/OMM',
        cacheTtlMs: CACHE_TTL_MS,
        group: state.group,
        satelliteCount: state.satellites.length,
        selectedId: state.selectedId || null,
        selectedPosition: position ? { lat: position.lat, lon: position.lon, altitude: position.altitude } : null,
        propagation: 'Kepler-J2-display',
        operationalGrade: false
      };
    }
  });

  window.addEventListener('hashcod:gods-eye-view-open', boot);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
