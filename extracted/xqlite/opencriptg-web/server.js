// Hashcod local server — no external npm packages required.
// Run: npm start
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const zlib = require('zlib');
let PgPool = null;
try { PgPool = require('pg').Pool; } catch {}

const PORT = Number(process.env.PORT || 2340);
const HOST = process.env.HOST || '0.0.0.0';
const ROOT = __dirname;
const DATA_DIR = process.env.HASHCOD_DATA_DIR || path.join(ROOT, 'runtime-data');
const HELP_REQUESTS_FILE = path.join(DATA_DIR, 'assist-requests.json');
const CLI_CONSOLE_FILE = path.join(DATA_DIR, 'cli-console.json');
const SMS_GATEWAY_FILE = path.join(DATA_DIR, 'sms-gateway.json');
const AUDIT_FILE = path.join(DATA_DIR, 'security-audit.jsonl');
const PLATFORM_GATE_AUDIT_FILE = path.join(DATA_DIR, 'platform-gate-audit.json');
const AUTH_DB_FILE = path.join(DATA_DIR, 'auth-db.enc');
const ACCESS_HISTORY_FILE = path.join(DATA_DIR, 'access-history.enc');
const CODE_WALLET_FILE = path.join(DATA_DIR, 'code-wallet.enc');
const BRAND_EVIDENCE_FILE = path.join(DATA_DIR, 'brand-evidence.enc');
const CODE_REGISTRY_FILE = path.join(DATA_DIR, 'code-registry.enc');
const DEVICE_SYNC_FILE = path.join(DATA_DIR, 'device-sync.json');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');
const RATE_WINDOW_MS = 60 * 1000;
const RATE_LIMITS = { GET: 240, POST: 45, PUT: 45, DELETE: 30 };
const rateBuckets = new Map();
const userBuckets = new Map();
const staticGzipCache = new Map();
const sessions = new Map();
const adminPanelSessions = new Map();
const securityKingSessions = new Map();
const platformGateSessions = new Map();
const platformGateChallenges = new Map();
const privateEntrySessions = new Map();
const oauthStates = new Map();
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const PRIVATE_MODE = String(process.env.HASHCOD_PRIVATE_MODE || (IS_PRODUCTION ? '1' : '0')).toLowerCase() !== '0';
const PRIVATE_ENTRY_KEY = String(process.env.HASHCOD_PRIVATE_ENTRY_KEY || '');
const LEGACY_PLATFORM_GATE = String(process.env.HASHCOD_LEGACY_PLATFORM_GATE || '0').toLowerCase() === '1';
const ADMIN_PANEL_KEY_HASH = process.env.HASHCOD_ADMIN_PANEL_KEY_HASH || 'a1e32e351eb2a186760c05f7d460b5382b8dcd6287105924d3cad140d8ce662a';
const SECURITY_KING_KEY_HASH = process.env.HASHCOD_SECURITY_KING_KEY_HASH || '3e251bc983f9b3bce195d72af9635093cafdba2f9df683c90eb07e6ade487717';
const SECURITY_KING_NONCE_HASH = process.env.HASHCOD_SECURITY_KING_NONCE_HASH || 'c12efaa40f0bfc44a601cd650c4c14d4fe8ab4107d91d7d948594622da0f731e';
const PLATFORM_GATE_TOKEN_HASH = process.env.HASHCOD_PLATFORM_GATE_TOKEN_HASH || '1d5529b450b29daeb44bf7a2df59c8aff349dff105a29d0661c70e372bfe98a7';
const PLATFORM_GATE_KEY_HASH = process.env.HASHCOD_PLATFORM_GATE_KEY_HASH || '0a8b089d57a477e2eb6393aa22592665b1d9406b22086ef147cbb1a2b446e82c';
const PLATFORM_GATE_RESOURCE_ID = 'HASHCOD-PLATFORM';
const PLATFORM_GATE_CREDENTIAL_ID = 'HSC-ACCESS-CAPABILITY';
const SMS_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || process.env.HASHCOD_SMS_ACCOUNT_SID || '';
const SMS_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || process.env.HASHCOD_SMS_AUTH_TOKEN || '';
const SMS_FROM_NUMBER = process.env.TWILIO_FROM_NUMBER || process.env.HASHCOD_SMS_FROM_NUMBER || '';
const SMS_PROVIDER = String(process.env.SMS_PROVIDER || (SMS_ACCOUNT_SID && SMS_AUTH_TOKEN && SMS_FROM_NUMBER ? 'twilio' : 'hashcod')).toLowerCase();
const SMS_GATEWAY_PAIRING_KEY_HASH = process.env.HASHCOD_GATEWAY_PAIRING_KEY_HASH || ADMIN_PANEL_KEY_HASH;
const DATABASE_URL = process.env.DATABASE_URL || process.env.HASHCOD_DATABASE_URL || '';
let pgPool = null;
let pgReady = false;

const OAUTH_PROVIDERS = {
  google: {
    id: 'google',
    label: 'Google',
    clientId: process.env.HASHCOD_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.HASHCOD_GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET || '',
    authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userInfoUrl: 'https://openidconnect.googleapis.com/v1/userinfo',
    scope: 'openid email profile',
  },
  microsoft: {
    id: 'microsoft',
    label: 'Microsoft',
    clientId: process.env.HASHCOD_MICROSOFT_CLIENT_ID || process.env.MICROSOFT_CLIENT_ID || '',
    clientSecret: process.env.HASHCOD_MICROSOFT_CLIENT_SECRET || process.env.MICROSOFT_CLIENT_SECRET || '',
    authorizeUrl: `https://login.microsoftonline.com/${process.env.HASHCOD_MICROSOFT_TENANT || 'common'}/oauth2/v2.0/authorize`,
    tokenUrl: `https://login.microsoftonline.com/${process.env.HASHCOD_MICROSOFT_TENANT || 'common'}/oauth2/v2.0/token`,
    userInfoUrl: 'https://graph.microsoft.com/oidc/userinfo',
    scope: 'openid email profile',
  },
  github: {
    id: 'github',
    label: 'GitHub',
    clientId: process.env.HASHCOD_GITHUB_CLIENT_ID || process.env.GITHUB_CLIENT_ID || '',
    clientSecret: process.env.HASHCOD_GITHUB_CLIENT_SECRET || process.env.GITHUB_CLIENT_SECRET || '',
    authorizeUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    userInfoUrl: 'https://api.github.com/user',
    emailUrl: 'https://api.github.com/user/emails',
    scope: 'read:user user:email',
  },
};

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.jsx': 'text/babel; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon'
};

const SECURITY_HEADERS = {
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Referrer-Policy': 'no-referrer',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=()',
  // Babel standalone needs unsafe-eval and inline scripts in this local build.
  // Keep external script/style origins explicit until the app is bundled.
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com https://cdnjs.cloudflare.com https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob:",
    "connect-src 'self'",
    "frame-src 'self' blob: data:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(process.env.NODE_ENV === 'production' ? ["upgrade-insecure-requests"] : [])
  ].join('; ')
};

function send(res, status, headers, body) {
  res.writeHead(status, Object.assign({}, SECURITY_HEADERS, headers || {}));
  res.end(body);
}

function sendStatic(req, res, filePath, ext, data, cacheControl) {
  const headers = {
    'Content-Type': MIME[ext] || 'application/octet-stream',
    'Cache-Control': cacheControl,
  };
  const compressible = new Set(['.html', '.css', '.js', '.jsx', '.json', '.svg']);
  if (!String(req.headers['accept-encoding'] || '').includes('gzip') || data.length < 1024 || !compressible.has(ext)) {
    send(res, 200, headers, data);
    return;
  }
  const cached = staticGzipCache.get(filePath);
  if (cached) {
    send(res, 200, { ...headers, 'Content-Encoding': 'gzip', Vary: 'Accept-Encoding' }, cached);
    return;
  }
  zlib.gzip(data, { level: zlib.constants.Z_BEST_SPEED }, (err, compressed) => {
    if (err) {
      send(res, 200, headers, data);
      return;
    }
    staticGzipCache.set(filePath, compressed);
    send(res, 200, { ...headers, 'Content-Encoding': 'gzip', Vary: 'Accept-Encoding' }, compressed);
  });
}

function clientIp(req) {
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return forwarded || req.socket.remoteAddress || 'unknown';
}

function rateLimit(req, res) {
  const key = `${clientIp(req)}:${req.method}`;
  const limit = RATE_LIMITS[req.method] || 120;
  const now = Date.now();
  const bucket = rateBuckets.get(key) || { start: now, count: 0 };
  if (now - bucket.start > RATE_WINDOW_MS) {
    bucket.start = now;
    bucket.count = 0;
  }
  bucket.count += 1;
  rateBuckets.set(key, bucket);
  if (bucket.count > limit) {
    send(res, 429, { 'Content-Type': MIME['.json'], 'Retry-After': '60' }, JSON.stringify({ ok: false, error: 'rate_limited' }));
    return false;
  }
  return true;
}

function authenticatedRateLimit(auth, req, res) {
  if (!auth?.user?.id || ['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return true;
  const key = `${auth.user.id}:${req.method}`;
  const now = Date.now();
  const bucket = userBuckets.get(key) || { start: now, count: 0 };
  if (now - bucket.start > RATE_WINDOW_MS) {
    bucket.start = now;
    bucket.count = 0;
  }
  bucket.count += 1;
  userBuckets.set(key, bucket);
  if (bucket.count > 90) {
    audit('rate.user_limited', { ip: clientIp(req), actor: auth.user.id, method: req.method });
    send(res, 429, { 'Content-Type': MIME['.json'], 'Retry-After': '60' }, JSON.stringify({ ok: false, error: 'user_rate_limited' }));
    return false;
  }
  return true;
}

function audit(event, data = {}) {
  try {
    ensureDataDir();
    const row = { at: new Date().toISOString(), event, ...data };
    fs.appendFileSync(AUDIT_FILE, `${JSON.stringify(row)}\n`);
    appendRenderAudit(row).catch(() => {});
  } catch {
    // Audit failures must not break the app.
  }
}

function ensureDataDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function dailyStamp() {
  return new Date().toISOString().slice(0, 10);
}

function backupFileIfExists(filePath, prefix, stamp) {
  if (!fs.existsSync(filePath)) return null;
  const target = path.join(BACKUP_DIR, `${stamp}-${prefix}-${path.basename(filePath)}`);
  if (!fs.existsSync(target)) fs.copyFileSync(filePath, target);
  return target;
}

function ensureAutomaticBackup(reason = 'write') {
  try {
    ensureDataDir();
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    const stamp = dailyStamp();
    const manifest = path.join(BACKUP_DIR, `${stamp}-manifest.json`);
    if (fs.existsSync(manifest)) return;
    const files = [
      backupFileIfExists(AUTH_DB_FILE, 'auth', stamp),
      backupFileIfExists(HELP_REQUESTS_FILE, 'assist', stamp),
      backupFileIfExists(CLI_CONSOLE_FILE, 'cli', stamp),
      backupFileIfExists(AUDIT_FILE, 'audit', stamp),
      backupFileIfExists(ACCESS_HISTORY_FILE, 'access-history', stamp),
      backupFileIfExists(CODE_WALLET_FILE, 'code-wallet', stamp),
      backupFileIfExists(BRAND_EVIDENCE_FILE, 'brand-evidence', stamp),
      backupFileIfExists(CODE_REGISTRY_FILE, 'code-registry', stamp),
    ].filter(Boolean).map(file => path.basename(file));
    fs.writeFileSync(manifest, JSON.stringify({ app: 'Hashcod', createdAt: new Date().toISOString(), reason, files }, null, 2));
    audit('backup.automatic', { reason, files: files.length });
  } catch {
    // Backups are best-effort and must not block critical writes.
  }
}

function readAuditRows(limit = 120) {
  try {
    if (!fs.existsSync(AUDIT_FILE)) return [];
    return fs.readFileSync(AUDIT_FILE, 'utf8')
      .split(/\r?\n/)
      .filter(Boolean)
      .slice(-Math.min(Math.max(Number(limit) || 120, 1), 500))
      .map(line => {
        try { return JSON.parse(line); } catch { return { raw: line }; }
      })
      .reverse();
  } catch {
    return [];
  }
}

async function readSecurityAuditRows(limit = 240) {
  const max = Math.min(Math.max(Number(limit) || 240, 1), 1000);
  const localRows = readAuditRows(max).slice().reverse();
  const remoteRows = await loadRenderAuditRows();
  const merged = [...remoteRows, ...localRows];
  const seen = new Set();
  const deduped = [];
  for (let i = merged.length - 1; i >= 0; i -= 1) {
    const row = merged[i] || {};
    const id = `${row.at || ''}|${row.event || ''}|${row.actor || row.userId || ''}|${row.requestId || ''}|${row.ip || ''}`;
    if (seen.has(id)) continue;
    seen.add(id);
    deduped.unshift(row);
  }
  return deduped.slice(-max).reverse();
}

function securityUserRows(db) {
  return (db.users || []).map(user => ({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    plan: user.plan || 'enterprise',
    status: user.status || 'ACTIVE',
    createdAt: user.createdAt,
    updatedAt: user.updatedAt || null,
    lastOAuthLoginAt: user.lastOAuthLoginAt || null,
    credential: {
      stored: !!user.passwordHash,
      algorithm: String(user.passwordHash || '').startsWith('scrypt:') ? 'scrypt' : 'legacy/protected',
      visiblePassword: false,
    },
  }));
}

function decorateAuditRows(rows, db) {
  const userMap = new Map((db.users || []).map(user => [user.id, user]));
  return rows.map(row => {
    const actorId = row.actor || row.userId || row.approvedUserId || '';
    const user = userMap.get(actorId);
    return {
      ...row,
      actorEmail: user?.email || (row.email ? safeText(row.email, 180) : ''),
      credentialPolicy: 'passwords never stored or returned in plain text',
    };
  });
}

function readJsonBody(req, maxBytes = 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > maxBytes) {
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function safeText(value, max = 500) {
  return String(value || '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);
}

function safeWalletPayload(value, max = 16000) {
  return String(value || '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').trim().slice(0, max);
}

function readDeviceSyncStore() {
  ensureDataDir();
  try {
    if (!fs.existsSync(DEVICE_SYNC_FILE)) return { nextSeq: 1, events: [] };
    const parsed = JSON.parse(fs.readFileSync(DEVICE_SYNC_FILE, 'utf8'));
    return {
      nextSeq: Math.max(1, Number(parsed.nextSeq || 1)),
      events: Array.isArray(parsed.events) ? parsed.events : [],
    };
  } catch {
    return { nextSeq: 1, events: [] };
  }
}

function writeDeviceSyncStore(store) {
  ensureDataDir();
  const events = Array.isArray(store.events) ? store.events.slice(-800) : [];
  const nextSeq = Math.max(Number(store.nextSeq || 1), events.reduce((max, event) => Math.max(max, Number(event.seq || 0) + 1), 1));
  fs.writeFileSync(DEVICE_SYNC_FILE, JSON.stringify({ nextSeq, events }, null, 2));
}

function sanitizeDeviceSyncEvent(body = {}) {
  const event = body.event && typeof body.event === 'object' ? body.event : body;
  const action = safeText(event.action || body.action, 40);
  const allowed = new Set(['clip:save', 'clip:delete', 'clip:clear', 'heartbeat']);
  if (!allowed.has(action)) return null;
  const clip = event.clip && typeof event.clip === 'object' ? event.clip : {};
  return {
    action,
    clipId: safeText(event.clipId || clip.id, 120),
    clip: action === 'clip:save' ? {
      id: safeText(clip.id, 120),
      text: safeWalletPayload(clip.text, 48000),
      source: safeText(clip.source, 120),
      hash: safeText(clip.hash, 96),
      size: Math.max(0, Number(clip.size || 0)),
      createdAt: safeText(clip.createdAt, 60) || new Date().toISOString(),
    } : null,
  };
}

async function handleDeviceSync(req, res) {
  if (req.method === 'OPTIONS') {
    send(res, 204, { 'Content-Type': MIME['.json'] }, '');
    return;
  }
  if (req.method === 'GET') {
    const url = new URL(req.url || '/api/device-sync', 'http://hashcod.local');
    const channel = safeText(url.searchParams.get('channel') || 'blind-spot', 80) || 'blind-spot';
    const since = Math.max(0, Number(url.searchParams.get('since') || 0));
    const deviceId = safeText(url.searchParams.get('deviceId') || '', 120);
    const store = readDeviceSyncStore();
    const events = store.events
      .filter((event) => event.channel === channel && Number(event.seq || 0) > since)
      .filter((event) => !deviceId || event.deviceId !== deviceId)
      .slice(-240);
    send(res, 200, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: true, channel, events, serverTime: new Date().toISOString() }));
    return;
  }
  if (req.method !== 'POST') {
    send(res, 405, { 'Content-Type': MIME['.json'], Allow: 'GET, POST, OPTIONS' }, JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }
  try {
    const body = await readJsonBody(req, 72 * 1024);
    const channel = safeText(body.channel || 'blind-spot', 80) || 'blind-spot';
    const deviceId = safeText(body.deviceId || 'unknown-device', 120) || 'unknown-device';
    const payload = sanitizeDeviceSyncEvent(body);
    if (!payload) {
      send(res, 400, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: 'invalid_sync_event' }));
      return;
    }
    if (payload.action === 'clip:save' && (!payload.clip?.id || !payload.clip?.text)) {
      send(res, 400, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: 'invalid_clip' }));
      return;
    }
    const store = readDeviceSyncStore();
    const event = {
      seq: store.nextSeq || 1,
      channel,
      deviceId,
      receivedAt: new Date().toISOString(),
      ...payload,
    };
    store.nextSeq = event.seq + 1;
    store.events.push(event);
    writeDeviceSyncStore(store);
    audit('device_sync.event', { ip: clientIp(req), channel, deviceId, action: event.action, seq: event.seq });
    send(res, 200, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: true, event }));
  } catch (err) {
    send(res, 400, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: 'device_sync_failed', detail: safeText(err.message, 160) }));
  }
}

function validEmail(email) {
  const value = safeText(email, 180).toLowerCase();
  return /^[^\s@]{1,80}@[^\s@.][^\s@]{1,120}\.[^\s@]{2,24}$/.test(value) && !/[<>"'`]/.test(value);
}

function validWhatsapp(value) {
  const phone = safeText(value, 60);
  return /^\+?[0-9][0-9\s().-]{6,24}$/.test(phone);
}

function normalizeSmsPhone(value) {
  const raw = safeText(value, 60).replace(/[^\d+]/g, '');
  if (/^\+\d{7,18}$/.test(raw)) return raw;
  if (/^\d{10}$/.test(raw)) return `+1${raw}`;
  if (/^1\d{10}$/.test(raw)) return `+${raw}`;
  if (/^\d{7,18}$/.test(raw)) return `+${raw}`;
  return '';
}

function postTwilioSms({ to, body }) {
  return new Promise((resolve, reject) => {
    const payload = new URLSearchParams({ To: to, From: SMS_FROM_NUMBER, Body: body }).toString();
    const req = https.request({
      hostname: 'api.twilio.com',
      path: `/2010-04-01/Accounts/${encodeURIComponent(SMS_ACCOUNT_SID)}/Messages.json`,
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${SMS_ACCOUNT_SID}:${SMS_AUTH_TOKEN}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(payload),
      },
      timeout: 15000,
    }, (twilioRes) => {
      let raw = '';
      twilioRes.setEncoding('utf8');
      twilioRes.on('data', chunk => { raw += chunk; });
      twilioRes.on('end', () => {
        let json = null;
        try { json = JSON.parse(raw || '{}'); } catch {}
        if (twilioRes.statusCode >= 200 && twilioRes.statusCode < 300) {
          resolve({ statusCode: twilioRes.statusCode, body: json || {}, raw });
          return;
        }
        const err = new Error(json?.message || `Twilio SMS failed (${twilioRes.statusCode})`);
        err.statusCode = twilioRes.statusCode;
        err.details = json || raw;
        reject(err);
      });
    });
    req.on('timeout', () => req.destroy(new Error('sms_provider_timeout')));
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function requestJson(urlString, { method = 'GET', headers = {}, body = '' } = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlString);
    const req = https.request({
      hostname: url.hostname,
      path: `${url.pathname}${url.search}`,
      method,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Hashcod-OIDC/1.0',
        ...headers,
        ...(body ? { 'Content-Length': Buffer.byteLength(body) } : {}),
      },
      timeout: 15000,
    }, (r) => {
      let raw = '';
      r.setEncoding('utf8');
      r.on('data', chunk => { raw += chunk; });
      r.on('end', () => {
        let json = null;
        try { json = JSON.parse(raw || '{}'); } catch {}
        if (r.statusCode >= 200 && r.statusCode < 300) {
          resolve(json || {});
          return;
        }
        const err = new Error(json?.error_description || json?.message || `oauth_http_${r.statusCode}`);
        err.statusCode = r.statusCode;
        err.details = json || raw;
        reject(err);
      });
    });
    req.on('timeout', () => req.destroy(new Error('oauth_timeout')));
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

function publicOAuthProviders(req) {
  const origin = requestOrigin(req);
  return Object.values(OAUTH_PROVIDERS).map(p => ({
    id: p.id,
    label: p.label,
    configured: !!(p.clientId && p.clientSecret),
    startUrl: `${origin}/api/auth/oauth/${p.id}/start`,
  }));
}

function requestOrigin(req) {
  const proto = String(req.headers['x-forwarded-proto'] || '').split(',')[0] || (process.env.NODE_ENV === 'production' ? 'https' : 'http');
  const host = req.headers['x-forwarded-host'] || req.headers.host || `localhost:${PORT}`;
  return `${proto}://${host}`;
}

function httpsJsonRequest({ hostname, path: requestPath, method = 'POST', headers = {}, body = {}, timeout = 30000 }) {
  const payload = typeof body === 'string' ? body : JSON.stringify(body || {});
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname,
      path: requestPath,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        ...headers,
      },
      timeout,
    }, (providerRes) => {
      let raw = '';
      providerRes.setEncoding('utf8');
      providerRes.on('data', chunk => { raw += chunk; });
      providerRes.on('end', () => {
        let json = null;
        try { json = JSON.parse(raw || '{}'); } catch {}
        if (providerRes.statusCode >= 200 && providerRes.statusCode < 300) {
          resolve({ statusCode: providerRes.statusCode, body: json || {}, raw });
          return;
        }
        const err = new Error(json?.error?.message || json?.message || `ai_provider_failed_${providerRes.statusCode}`);
        err.statusCode = providerRes.statusCode;
        err.details = json || raw;
        reject(err);
      });
    });
    req.on('timeout', () => req.destroy(new Error('ai_provider_timeout')));
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function aiProviderProfile(provider) {
  const key = String(provider || '').toLowerCase();
  if (key === 'claude' || key === 'anthropic') return { id: 'claude', hashModel: 'HSC-02910', defaultModel: 'claude-3-5-haiku-latest' };
  if (key === 'gpt' || key === 'openai') return { id: 'openai', hashModel: 'HSC-28193', defaultModel: 'gpt-4o-mini' };
  if (key === 'gemini' || key === 'google') return { id: 'gemini', hashModel: 'HSC-44201', defaultModel: 'gemini-1.5-flash' };
  return { id: 'other', hashModel: 'HSC00128', defaultModel: 'openai-compatible' };
}

function moderationReason(value = '') {
  const text = String(value || '');
  const lower = text.toLowerCase();
  if (/(https?:\/\/|www\.)/i.test(text) && !/hashcod|localhost|127\.0\.0\.1/i.test(text)) return 'external_link_blocked';
  if (/(<script|javascript:|onerror\s*=|onload\s*=|data:text\/html)/i.test(text)) return 'script_payload_blocked';
  if (/(drop\s+table|union\s+select|insert\s+into|delete\s+from|curl\s+.+\|\s*sh|powershell\s+-enc)/i.test(lower)) return 'dangerous_payload_blocked';
  if (/-----BEGIN [A-Z ]*PRIVATE KEY-----/.test(text)) return 'private_key_blocked';
  if (/\b(?:sk|ghp|github_pat|xox[baprs])_[A-Za-z0-9_=-]{16,}\b/.test(text)) return 'secret_token_blocked';
  return null;
}

function redactSecrets(value = '') {
  let text = String(value || '');
  text = text.replace(/-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g, '[REDACTED_PRIVATE_KEY]');
  text = text.replace(/\b(?:api[_-]?key|secret|token|password|passwd|bearer|authorization)\s*[:=]\s*["']?[A-Za-z0-9._~+/=-]{12,}["']?/gi, (m) => {
    const label = (m.split(/[:=]/)[0] || 'secret').trim();
    return `${label}=[REDACTED]`;
  });
  text = text.replace(/\b(?:sk|pk|ghp|github_pat|xox[baprs])_[A-Za-z0-9_=-]{16,}\b/g, '[REDACTED_TOKEN]');
  text = text.replace(/\b[A-Za-z0-9+/]{40,}={0,2}\b/g, '[REDACTED_LONG_SECRET]');
  return text;
}

function safePublicText(value, max = 500) {
  return safeText(redactSecrets(value), max);
}

function validatePublicPayload(fields) {
  for (const [name, value] of Object.entries(fields || {})) {
    const reason = moderationReason(value);
    if (reason) return { ok: false, field: name, reason };
  }
  return { ok: true };
}

function b64url(buf) {
  return Buffer.from(buf).toString('base64url');
}

function sha256Hex(value) {
  return crypto.createHash('sha256').update(String(value || '')).digest('hex');
}

function hmacSha256Hex(secret, value) {
  return crypto.createHmac('sha256', String(secret || '')).update(String(value || '')).digest('hex');
}

function timingSafeHexEqual(a, b) {
  const left = String(a || '');
  const right = String(b || '');
  if (!/^[a-f0-9]+$/i.test(left) || !/^[a-f0-9]+$/i.test(right) || left.length !== right.length) return false;
  return crypto.timingSafeEqual(Buffer.from(left, 'hex'), Buffer.from(right, 'hex'));
}

function canonicalizeSecurityValue(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalizeSecurityValue).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonicalizeSecurityValue(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value ?? null);
}

function authSecretKey() {
  const secret = process.env.HASHCOD_SECRET || 'hashcod-dev-secret-change-me-before-production';
  return crypto.createHash('sha256').update(secret).digest();
}

function encryptJson(data) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', authSecretKey(), iv);
  const plain = Buffer.from(JSON.stringify(data), 'utf8');
  const enc = Buffer.concat([cipher.update(plain), cipher.final()]);
  const tag = cipher.getAuthTag();
  return JSON.stringify({ v: 1, alg: 'AES-256-GCM', iv: b64url(iv), tag: b64url(tag), data: b64url(enc) }, null, 2);
}

function decryptJson(raw, fallback) {
  try {
    const box = JSON.parse(raw);
    if (!box || box.alg !== 'AES-256-GCM') return fallback;
    const decipher = crypto.createDecipheriv('aes-256-gcm', authSecretKey(), Buffer.from(box.iv, 'base64url'));
    decipher.setAuthTag(Buffer.from(box.tag, 'base64url'));
    const out = Buffer.concat([decipher.update(Buffer.from(box.data, 'base64url')), decipher.final()]);
    return JSON.parse(out.toString('utf8'));
  } catch {
    return fallback;
  }
}

const emptyAuthDb = () => ({ users: [], accessRequests: [], billingContracts: [], meta: {} });

function normalizeAuthDb(db) {
  return {
    users: Array.isArray(db?.users) ? db.users : [],
    accessRequests: Array.isArray(db?.accessRequests) ? db.accessRequests : [],
    billingContracts: Array.isArray(db?.billingContracts) ? db.billingContracts : [],
    meta: db?.meta && typeof db.meta === 'object' ? db.meta : {},
  };
}

async function initRenderDatabase() {
  if (!DATABASE_URL || !PgPool) return;
  pgPool = new PgPool({
    connectionString: DATABASE_URL,
    ssl: process.env.HASHCOD_PG_SSL === '0' ? false : { rejectUnauthorized: false },
  });
  await pgPool.query(`
    create table if not exists hashcod_kv (
      key text primary key,
      value jsonb not null,
      updated_at timestamptz not null default now()
    )
  `);
  pgReady = true;
  audit('db.render.ready', { provider: 'postgres' });
}

async function loadRenderAuthDb() {
  if (!pgReady || !pgPool) return null;
  const result = await pgPool.query('select value from hashcod_kv where key = $1 limit 1', ['auth-db']);
  if (!result.rows.length) return null;
  return normalizeAuthDb(result.rows[0].value);
}

async function saveRenderAuthDb(db) {
  if (!pgReady || !pgPool) return false;
  await pgPool.query(
    `insert into hashcod_kv(key, value, updated_at)
     values($1, $2::jsonb, now())
     on conflict(key) do update set value = excluded.value, updated_at = now()`,
    ['auth-db', JSON.stringify(normalizeAuthDb(db))]
  );
  return true;
}

async function loadRenderAuditRows() {
  if (!pgReady || !pgPool) return [];
  const result = await pgPool.query('select value from hashcod_kv where key = $1 limit 1', ['security-audit']);
  const rows = result.rows[0]?.value?.rows;
  return Array.isArray(rows) ? rows : [];
}

async function saveRenderAuditRows(rows) {
  if (!pgReady || !pgPool) return false;
  const cleanRows = Array.isArray(rows) ? rows.slice(-2000) : [];
  await pgPool.query(
    `insert into hashcod_kv(key, value, updated_at)
     values($1, $2::jsonb, now())
     on conflict(key) do update set value = excluded.value, updated_at = now()`,
    ['security-audit', JSON.stringify({ rows: cleanRows })]
  );
  return true;
}

async function loadRenderWalletDb() {
  if (!pgReady || !pgPool) return null;
  const result = await pgPool.query('select value from hashcod_kv where key = $1 limit 1', ['code-wallet']);
  const rows = result.rows[0]?.value?.rows;
  return Array.isArray(rows) ? rows : null;
}

async function saveRenderWalletDb(rows) {
  if (!pgReady || !pgPool) return false;
  await pgPool.query(
    `insert into hashcod_kv(key, value, updated_at)
     values($1, $2::jsonb, now())
     on conflict(key) do update set value = excluded.value, updated_at = now()`,
    ['code-wallet', JSON.stringify({ rows: (Array.isArray(rows) ? rows : []).slice(0, 5000) })]
  );
  return true;
}

async function loadRenderBrandEvidenceDb() {
  if (!pgReady || !pgPool) return null;
  const result = await pgPool.query('select value from hashcod_kv where key = $1 limit 1', ['brand-evidence']);
  const encrypted = result.rows[0]?.value?.encrypted;
  if (!encrypted) return null;
  const rows = decryptJson(encrypted, []);
  return Array.isArray(rows) ? rows : null;
}

async function saveRenderBrandEvidenceDb(rows) {
  if (!pgReady || !pgPool) return false;
  const cleanRows = (Array.isArray(rows) ? rows : []).slice(0, 1000);
  await pgPool.query(
    `insert into hashcod_kv(key, value, updated_at)
     values($1, $2::jsonb, now())
     on conflict(key) do update set value = excluded.value, updated_at = now()`,
    ['brand-evidence', JSON.stringify({ encrypted: encryptJson(cleanRows), count: cleanRows.length })]
  );
  return true;
}

async function loadRenderCodeRegistryDb() {
  if (!pgReady || !pgPool) return null;
  const result = await pgPool.query('select value from hashcod_kv where key = $1 limit 1', ['code-registry']);
  const encrypted = result.rows[0]?.value?.encrypted;
  if (!encrypted) return null;
  return decryptJson(encrypted, null);
}

async function saveRenderCodeRegistryDb(db) {
  if (!pgReady || !pgPool) return false;
  await pgPool.query(
    `insert into hashcod_kv(key, value, updated_at)
     values($1, $2::jsonb, now())
     on conflict(key) do update set value = excluded.value, updated_at = now()`,
    ['code-registry', JSON.stringify({ encrypted: encryptJson(db) })]
  );
  return true;
}

async function appendRenderAudit(row) {
  if (!pgReady || !pgPool || !row) return false;
  try {
    const rows = await loadRenderAuditRows();
    rows.push(row);
    await saveRenderAuditRows(rows);
    return true;
  } catch {
    return false;
  }
}

async function bootstrapAuthDbFromRender() {
  try {
    if (!pgReady) return;
    const remote = await loadRenderAuthDb();
    const local = readAuthDb();
    if (remote && (remote.users.length || remote.accessRequests.length)) {
      fs.writeFileSync(AUTH_DB_FILE, encryptJson(remote));
      audit('db.render.auth_loaded', { users: remote.users.length, requests: remote.accessRequests.length });
      return;
    }
    if (local.users.length || local.accessRequests.length) {
      await saveRenderAuthDb(local);
      audit('db.render.auth_seeded', { users: local.users.length, requests: local.accessRequests.length });
    }
  } catch (err) {
    audit('db.render.auth_bootstrap_failed', { error: safeText(err.message, 160) });
  }
}

function readAuthDb() {
  ensureDataDir();
  if (!fs.existsSync(AUTH_DB_FILE)) return emptyAuthDb();
  return normalizeAuthDb(decryptJson(fs.readFileSync(AUTH_DB_FILE, 'utf8'), emptyAuthDb()));
}

function writeAuthDb(db) {
  ensureDataDir();
  const clean = normalizeAuthDb(db);
  clean.meta = { ...(clean.meta || {}), storage: pgReady ? 'render-postgres+encrypted-file-cache' : 'encrypted-file', updatedAt: new Date().toISOString() };
  fs.writeFileSync(AUTH_DB_FILE, encryptJson(clean));
  ensureAutomaticBackup('auth-db-write');
  if (pgReady) {
    saveRenderAuthDb(clean).catch(err => audit('db.render.auth_write_failed', { error: safeText(err.message, 160) }));
  }
}

function readWalletCache() {
  ensureDataDir();
  if (!fs.existsSync(CODE_WALLET_FILE)) return [];
  const rows = decryptJson(fs.readFileSync(CODE_WALLET_FILE, 'utf8'), []);
  return Array.isArray(rows) ? rows : [];
}

function writeWalletCache(rows) {
  ensureDataDir();
  fs.writeFileSync(CODE_WALLET_FILE, encryptJson((Array.isArray(rows) ? rows : []).slice(0, 5000)));
  ensureAutomaticBackup('code-wallet-write');
}

async function readCodeWallet() {
  try {
    const remote = await loadRenderWalletDb();
    if (remote) {
      writeWalletCache(remote);
      return remote;
    }
  } catch (err) {
    audit('wallet.render_read_failed', { error: safeText(err.message, 160) });
  }
  return readWalletCache();
}

async function writeCodeWallet(rows) {
  const clean = (Array.isArray(rows) ? rows : []).slice(0, 5000);
  writeWalletCache(clean);
  if (pgReady) {
    try { await saveRenderWalletDb(clean); }
    catch (err) { audit('wallet.render_write_failed', { error: safeText(err.message, 160) }); }
  }
}

function readBrandEvidenceCache() {
  ensureDataDir();
  if (!fs.existsSync(BRAND_EVIDENCE_FILE)) return [];
  const rows = decryptJson(fs.readFileSync(BRAND_EVIDENCE_FILE, 'utf8'), []);
  return Array.isArray(rows) ? rows : [];
}

function writeBrandEvidenceCache(rows) {
  ensureDataDir();
  fs.writeFileSync(BRAND_EVIDENCE_FILE, encryptJson((Array.isArray(rows) ? rows : []).slice(0, 1000)));
  ensureAutomaticBackup('brand-evidence-write');
}

async function readBrandEvidence() {
  try {
    const remote = await loadRenderBrandEvidenceDb();
    if (remote) {
      writeBrandEvidenceCache(remote);
      return remote;
    }
  } catch (err) {
    audit('brand_evidence.render_read_failed', { error: safeText(err.message, 160) });
  }
  return readBrandEvidenceCache();
}

async function writeBrandEvidence(rows) {
  const clean = (Array.isArray(rows) ? rows : []).slice(0, 1000);
  writeBrandEvidenceCache(clean);
  if (pgReady) {
    try { await saveRenderBrandEvidenceDb(clean); }
    catch (err) { audit('brand_evidence.render_write_failed', { error: safeText(err.message, 160) }); }
  }
}

function emptyCodeRegistry() {
  return { rows: [], auditLogs: [], validations: [], meta: { sequence: 0, updatedAt: new Date().toISOString() } };
}

function normalizeCodeRegistry(db) {
  const clean = db && typeof db === 'object' ? db : emptyCodeRegistry();
  return {
    rows: Array.isArray(clean.rows) ? clean.rows.slice(0, 10000) : [],
    auditLogs: Array.isArray(clean.auditLogs) ? clean.auditLogs.slice(0, 3000) : [],
    validations: Array.isArray(clean.validations) ? clean.validations.slice(0, 3000) : [],
    meta: { sequence: Number(clean.meta?.sequence || 0), updatedAt: clean.meta?.updatedAt || new Date().toISOString() },
  };
}

function readCodeRegistryCache() {
  ensureDataDir();
  if (!fs.existsSync(CODE_REGISTRY_FILE)) return emptyCodeRegistry();
  return normalizeCodeRegistry(decryptJson(fs.readFileSync(CODE_REGISTRY_FILE, 'utf8'), emptyCodeRegistry()));
}

function writeCodeRegistryCache(db) {
  ensureDataDir();
  const clean = normalizeCodeRegistry(db);
  fs.writeFileSync(CODE_REGISTRY_FILE, encryptJson(clean));
  ensureAutomaticBackup('code-registry-write');
}

async function readCodeRegistry() {
  try {
    const remote = await loadRenderCodeRegistryDb();
    if (remote) {
      writeCodeRegistryCache(remote);
      return normalizeCodeRegistry(remote);
    }
  } catch (err) {
    audit('code_registry.render_read_failed', { error: safeText(err.message, 160) });
  }
  return readCodeRegistryCache();
}

async function writeCodeRegistry(db) {
  const clean = normalizeCodeRegistry(db);
  clean.meta.updatedAt = new Date().toISOString();
  writeCodeRegistryCache(clean);
  if (pgReady) {
    try { await saveRenderCodeRegistryDb(clean); }
    catch (err) { audit('code_registry.render_write_failed', { error: safeText(err.message, 160) }); }
  }
}

function publicAccessRequest(row) {
  const { desiredPasswordHash, ...publicRow } = row || {};
  return publicRow;
}

function publicBillingContract(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.userId,
    fullName: row.fullName,
    cedula: row.cedula,
    address: row.address,
    phone: row.phone,
    budget: row.budget,
    currency: row.currency,
    signature: row.signature,
    acceptedTerms: !!row.acceptedTerms,
    status: row.status || 'ACTIVE',
    createdAt: row.createdAt,
    updatedAt: row.updatedAt || null,
    fingerprint: row.fingerprint,
  };
}

function validateBillingContract(body) {
  const fullName = safeText(body.fullName, 120);
  const cedula = safeText(body.cedula, 40);
  const address = safeText(body.address, 240);
  const phone = safeText(body.phone, 60);
  const budget = Number(body.budget);
  const currency = ['DOP', 'USD', 'EUR'].includes(body.currency) ? body.currency : 'DOP';
  const signature = safeText(body.signature, 120);
  if (fullName.length < 3) return { ok: false, error: 'invalid_full_name' };
  if (!/^[A-Za-z0-9\s.-]{5,40}$/.test(cedula)) return { ok: false, error: 'invalid_cedula' };
  if (address.length < 8) return { ok: false, error: 'invalid_address' };
  if (!validWhatsapp(phone)) return { ok: false, error: 'invalid_phone' };
  if (!Number.isFinite(budget) || budget < 0 || budget > 100000000) return { ok: false, error: 'invalid_budget' };
  if (signature.length < 2) return { ok: false, error: 'invalid_signature' };
  if (!body.acceptedTerms) return { ok: false, error: 'terms_required' };
  return { ok: true, row: { fullName, cedula, address, phone, budget, currency, signature, acceptedTerms: true } };
}

function readAccessHistory() {
  ensureDataDir();
  if (!fs.existsSync(ACCESS_HISTORY_FILE)) return [];
  const rows = decryptJson(fs.readFileSync(ACCESS_HISTORY_FILE, 'utf8'), []);
  return Array.isArray(rows) ? rows : [];
}

function writeAccessHistory(rows) {
  ensureDataDir();
  fs.writeFileSync(ACCESS_HISTORY_FILE, encryptJson((Array.isArray(rows) ? rows : []).slice(0, 5000)));
  ensureAutomaticBackup('access-history-write');
}

function upsertAccessHistory(row, event = 'sync') {
  try {
    const publicRow = { ...publicAccessRequest(row), historyEvent: event, historySavedAt: new Date().toISOString() };
    const rows = readAccessHistory();
    const idx = rows.findIndex(item => item.id === publicRow.id || (item.email === publicRow.email && item.serial === publicRow.serial));
    if (idx >= 0) rows[idx] = { ...rows[idx], ...publicRow };
    else rows.unshift(publicRow);
    writeAccessHistory(rows);
  } catch {
    audit('access.history_write_failed', { requestId: row?.id, event });
  }
}

function mergedAccessRequests(db) {
  const merged = new Map();
  for (const row of readAccessHistory()) {
    const key = row.id || `${row.email}:${row.serial}`;
    if (key) merged.set(key, row);
  }
  for (const row of db.accessRequests || []) {
    const publicRow = publicAccessRequest(row);
    const key = publicRow.id || `${publicRow.email}:${publicRow.serial}`;
    if (key) merged.set(key, { ...(merged.get(key) || {}), ...publicRow });
  }
  return Array.from(merged.values()).sort((a, b) => String(b.createdAt || b.reviewedAt || '').localeCompare(String(a.createdAt || a.reviewedAt || '')));
}

function hashPassword(password) {
  const salt = crypto.randomBytes(18);
  const hash = crypto.scryptSync(String(password), salt, 32, { N: 16384, r: 8, p: 1 });
  return `scrypt$N16384r8p1$${b64url(salt)}$${b64url(hash)}`;
}

function makeRecoveryCode() {
  return `HC-REC-${b64url(crypto.randomBytes(18)).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 20)}`;
}

function makeBlowfishId() {
  return `BF-${b64url(crypto.randomBytes(12)).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 16)}`;
}

function makeAccessSerial() {
  return `HCQ-${Date.now().toString(36).toUpperCase()}-${b64url(crypto.randomBytes(6)).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8)}`;
}

function verifyPassword(password, stored) {
  const parts = String(stored || '').split('$');
  if (parts.length !== 4) return false;
  const salt = Buffer.from(parts[2], 'base64url');
  const expected = Buffer.from(parts[3], 'base64url');
  let actual = null;
  if (parts[0] === 'scrypt') {
    actual = crypto.scryptSync(String(password), salt, expected.length, { N: 16384, r: 8, p: 1 });
  } else if (parts[0] === 'pbkdf2-sha256') {
    const iter = Number(parts[1]);
    actual = crypto.pbkdf2Sync(String(password), salt, iter, expected.length, 'sha256');
  } else {
    return false;
  }
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

function strongPassword(password) {
  const p = String(password || '');
  return p.length >= 8;
}

function publicUser(user) {
  if (!user) return null;
  return { id: user.id, email: user.email, name: user.name, role: user.role, plan: user.plan || 'free', status: user.status || 'ACTIVE', createdAt: user.createdAt };
}

function parseCookies(req) {
  return Object.fromEntries(String(req.headers.cookie || '').split(';').map(v => v.trim()).filter(Boolean).map(v => {
    const idx = v.indexOf('=');
    return idx === -1 ? [v, ''] : [decodeURIComponent(v.slice(0, idx)), decodeURIComponent(v.slice(idx + 1))];
  }));
}

function cookieOptions(req, maxAge = 60 * 60 * 12) {
  const secure = process.env.NODE_ENV === 'production' || String(req.headers['x-forwarded-proto'] || '').includes('https');
  return `Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure ? '; Secure' : ''}`;
}

function makeSession(req, user) {
  const sid = b64url(crypto.randomBytes(32));
  const csrf = b64url(crypto.randomBytes(24));
  sessions.set(sid, {
    userId: user.id,
    csrf,
    createdAt: Date.now(),
    lastSeenAt: Date.now(),
    ip: clientIp(req),
    userAgent: safeText(req.headers['user-agent'], 180),
    expiresAt: Date.now() + 1000 * 60 * 60 * 12,
  });
  return { sid, csrf };
}

function makeAdminPanelSession() {
  const sid = b64url(crypto.randomBytes(32));
  const csrf = b64url(crypto.randomBytes(24));
  adminPanelSessions.set(sid, { csrf, expiresAt: Date.now() + 1000 * 60 * 60 * 4 });
  return { sid, csrf };
}

function makeSecurityKingSession() {
  const sid = b64url(crypto.randomBytes(32));
  securityKingSessions.set(sid, {
    createdAt: Date.now(),
    expiresAt: Date.now() + 1000 * 60 * 45,
  });
  return { sid };
}

function platformGateExpiryFromToken(token) {
  try {
    const params = new URLSearchParams(String(token || ''));
    const expires = Date.parse(params.get('se') || '');
    if (!Number.isFinite(expires)) return 0;
    return expires;
  } catch {
    return 0;
  }
}

function verifyPlatformGateToken(token, key) {
  const raw = String(token || '').trim();
  const rawKey = String(key || '').trim();
  const expected = String(PLATFORM_GATE_TOKEN_HASH || '').trim();
  const expectedKey = String(PLATFORM_GATE_KEY_HASH || '').trim();
  if (expected.length !== 64 || expectedKey.length !== 64 || !raw || !rawKey) return { ok: false, error: 'invalid_gate_credentials' };
  const hash = crypto.createHash('sha256').update(raw).digest('hex');
  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
  if (!crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(expected))) return { ok: false, error: 'invalid_gate_token' };
  if (!crypto.timingSafeEqual(Buffer.from(keyHash), Buffer.from(expectedKey))) return { ok: false, error: 'invalid_gate_key' };
  const expiresAt = platformGateExpiryFromToken(raw);
  if (!expiresAt || expiresAt <= Date.now()) return { ok: false, error: 'gate_token_expired' };
  return { ok: true, expiresAt, tokenHash: hash, keyHash };
}

function platformGatePayloadHash(tokenHash, keyHash, resourceId = PLATFORM_GATE_RESOURCE_ID, action = 'ACCESS') {
  return sha256Hex(canonicalizeSecurityValue({
    action,
    key_hash: keyHash,
    resource_id: resourceId,
    token_hash: tokenHash,
  }));
}

function appendPlatformGateAudit(event, data = {}) {
  try {
    ensureDataDir();
    let rows = [];
    if (fs.existsSync(PLATFORM_GATE_AUDIT_FILE)) {
      try {
        const parsed = JSON.parse(fs.readFileSync(PLATFORM_GATE_AUDIT_FILE, 'utf8'));
        rows = Array.isArray(parsed) ? parsed : [];
      } catch {
        rows = [];
      }
    }
    const previousEventHash = rows.length ? rows[rows.length - 1].event_hash : 'GENESIS';
    const row = {
      event_id: `HSC-AUD-${Date.now().toString(36).toUpperCase()}-${b64url(crypto.randomBytes(5)).toUpperCase()}`,
      at: new Date().toISOString(),
      event,
      resource_id: data.resource_id || PLATFORM_GATE_RESOURCE_ID,
      credential_fingerprint: data.credential_fingerprint || null,
      result: data.result || 'RECORDED',
      ip: data.ip || null,
      user_agent_hash: data.userAgent ? sha256Hex(data.userAgent) : null,
      details: data.details || {},
      previous_event_hash: previousEventHash,
    };
    row.event_hash = sha256Hex(canonicalizeSecurityValue(row));
    rows.push(row);
    fs.writeFileSync(PLATFORM_GATE_AUDIT_FILE, JSON.stringify(rows.slice(-1000), null, 2));
    audit(`platform_gate.capability.${event}`, { ip: data.ip, result: row.result, eventHash: row.event_hash });
    return row;
  } catch {
    return null;
  }
}

function cleanupPlatformGateChallenges() {
  const now = Date.now();
  for (const [id, row] of platformGateChallenges.entries()) {
    if (row.used || row.expiresAt < now) platformGateChallenges.delete(id);
  }
}

function makePlatformGateChallenge(req) {
  cleanupPlatformGateChallenges();
  const challengeId = `HSC-CHL-${Date.now().toString(36).toUpperCase()}-${b64url(crypto.randomBytes(8)).toUpperCase()}`;
  const challenge = b64url(crypto.randomBytes(32));
  const serverNonce = b64url(crypto.randomBytes(24));
  const expiresAt = Date.now() + 1000 * 60 * 2;
  platformGateChallenges.set(challengeId, {
    credentialId: PLATFORM_GATE_CREDENTIAL_ID,
    resourceId: PLATFORM_GATE_RESOURCE_ID,
    action: 'ACCESS',
    permission: 'READ',
    challengeHash: sha256Hex(challenge),
    nonceHash: sha256Hex(serverNonce),
    expiresAt,
    used: false,
    ip: clientIp(req),
  });
  appendPlatformGateAudit('challenge_issued', {
    ip: clientIp(req),
    userAgent: req.headers['user-agent'],
    result: 'CHALLENGE_READY',
    details: { challenge_id: challengeId, expires_at: new Date(expiresAt).toISOString() },
  });
  return {
    ok: true,
    version: 1,
    credential_id: PLATFORM_GATE_CREDENTIAL_ID,
    resource_id: PLATFORM_GATE_RESOURCE_ID,
    action: 'ACCESS',
    permission: 'READ',
    challenge_id: challengeId,
    challenge,
    server_nonce: serverNonce,
    expires_at: new Date(expiresAt).toISOString(),
  };
}

function verifyPlatformGateCapability(req, verified, operation, signature, rawKey) {
  if (!operation || typeof operation !== 'object' || !signature) return { ok: false, error: 'capability_required' };
  const allowedKeys = ['action', 'challenge', 'challenge_id', 'credential_id', 'expires_at', 'payload_hash', 'permission', 'resource_id', 'server_nonce', 'version'];
  const keys = Object.keys(operation).sort();
  if (keys.join('|') !== allowedKeys.sort().join('|')) return { ok: false, error: 'capability_schema_rejected' };
  if (operation.version !== 1) return { ok: false, error: 'capability_version_rejected' };
  if (operation.credential_id !== PLATFORM_GATE_CREDENTIAL_ID) return { ok: false, error: 'capability_credential_rejected' };
  if (operation.resource_id !== PLATFORM_GATE_RESOURCE_ID || operation.action !== 'ACCESS' || operation.permission !== 'READ') return { ok: false, error: 'capability_scope_rejected' };
  const row = platformGateChallenges.get(operation.challenge_id);
  if (!row || row.used) return { ok: false, error: 'capability_challenge_used' };
  if (row.expiresAt < Date.now() || Date.parse(operation.expires_at) < Date.now()) return { ok: false, error: 'capability_challenge_expired' };
  if (row.ip !== clientIp(req)) return { ok: false, error: 'capability_origin_changed' };
  if (row.challengeHash !== sha256Hex(operation.challenge) || row.nonceHash !== sha256Hex(operation.server_nonce)) return { ok: false, error: 'capability_nonce_rejected' };
  const expectedPayloadHash = platformGatePayloadHash(verified.tokenHash, verified.keyHash, operation.resource_id, operation.action);
  if (!timingSafeHexEqual(operation.payload_hash, expectedPayloadHash)) return { ok: false, error: 'capability_payload_rejected' };
  const canonical = canonicalizeSecurityValue(operation);
  const expectedSignature = hmacSha256Hex(rawKey, canonical);
  if (!timingSafeHexEqual(signature, expectedSignature)) return { ok: false, error: 'capability_signature_rejected' };
  row.used = true;
  const event = appendPlatformGateAudit('operation_verified', {
    ip: clientIp(req),
    userAgent: req.headers['user-agent'],
    result: 'ACCESS_GRANTED',
    credential_fingerprint: sha256Hex(verified.keyHash).slice(0, 32),
    details: { challenge_id: operation.challenge_id, payload_hash: operation.payload_hash.slice(0, 24) },
  });
  return { ok: true, eventHash: event?.event_hash || null };
}

function makePlatformGateSession(req, expiresAt) {
  const sid = b64url(crypto.randomBytes(32));
  platformGateSessions.set(sid, {
    createdAt: Date.now(),
    lastSeenAt: Date.now(),
    ip: clientIp(req),
    userAgent: safeText(req.headers['user-agent'], 180),
    expiresAt,
  });
  return { sid, expiresAt };
}

function makePrivateEntrySession(req) {
  const sid = b64url(crypto.randomBytes(32));
  privateEntrySessions.set(sid, {
    createdAt: Date.now(),
    lastSeenAt: Date.now(),
    ip: clientIp(req),
    userAgent: safeText(req.headers['user-agent'], 180),
    expiresAt: Date.now() + 1000 * 60 * 60 * 4,
  });
  return { sid };
}

function getPrivateEntrySession(req) {
  if (!PRIVATE_MODE) return { bypass: true };
  const sid = parseCookies(req).hashcod_private_entry;
  const session = sid && privateEntrySessions.get(sid);
  if (!session || session.expiresAt < Date.now()) {
    if (sid) privateEntrySessions.delete(sid);
    return null;
  }
  session.lastSeenAt = Date.now();
  return { sid, session };
}

function verifyPrivateEntryKey(key) {
  const received = crypto.createHash('sha256').update(String(key || '')).digest();
  const expected = crypto.createHash('sha256').update(PRIVATE_ENTRY_KEY).digest();
  return PRIVATE_ENTRY_KEY.length >= 24 && crypto.timingSafeEqual(received, expected);
}

function privateEntryPage(message = '') {
  const status = PRIVATE_ENTRY_KEY.length >= 24
    ? message
    : 'Private deployment is locked. Configure HASHCOD_PRIVATE_ENTRY_KEY in Render.';
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Hashcod | Private Entry</title>
  <style>
    :root{color-scheme:light;--ink:#111;--muted:#646464;--grid:#dedede;--paper:#fff;--bg:#f5f5f2}
    *{box-sizing:border-box}body{margin:0;background-color:var(--bg);background-image:linear-gradient(var(--grid) 1px,transparent 1px),linear-gradient(90deg,var(--grid) 1px,transparent 1px);background-size:32px 32px;font-family:Consolas,"Courier New",monospace;color:var(--ink)}
    main{min-height:100vh;display:grid;place-items:center;padding:24px}.panel{width:min(720px,100%);background:var(--paper);border:1px solid #cfcfcf;box-shadow:18px 18px 0 rgba(0,0,0,.08)}
    header{padding:28px 30px 20px;border-bottom:1px solid var(--grid)}.brand{font-size:12px;letter-spacing:4px;color:var(--muted)}h1{margin:10px 0 6px;font:700 44px/1 Arial,sans-serif}p{margin:0;color:var(--muted);font-size:14px;line-height:1.55}
    form{padding:24px 30px 30px}.label{display:block;margin-bottom:8px;font-size:11px;letter-spacing:3px;color:var(--muted)}input,button{width:100%;height:54px;border:1px solid #222;background:#fff;padding:0 14px;font:14px Consolas,monospace}button{margin-top:12px;background:#111;color:#fff;letter-spacing:3px;font-weight:700;cursor:pointer}.message{min-height:22px;margin-top:13px;color:#8f1d1d;font-size:12px}
  </style>
</head>
<body><main><section class="panel"><header><div class="brand">Hashcod PRIVATE NODE</div><h1>Restricted Entry</h1><p>The platform interface is withheld until the server validates an authorized private-entry key.</p></header><form id="entry"><label class="label" for="key">PRIVATE ENTRY KEY</label><input id="key" type="password" autocomplete="current-password" required><button type="submit">UNLOCK PRIVATE NODE</button><div class="message" id="message">${status}</div></form></section></main>
<script>
document.getElementById('entry').addEventListener('submit', async (event) => {
  event.preventDefault();
  const message = document.getElementById('message');
  message.textContent = 'Validating...';
  const response = await fetch('/api/private-entry/unlock', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key:document.getElementById('key').value})});
  const result = await response.json().catch(() => ({}));
  if (response.ok && result.ok) location.replace('/');
  else message.textContent = result.error === 'private_entry_not_configured' ? 'Private entry is not configured in Render.' : 'Access denied.';
});
</script></body></html>`;
}

function handlePrivateEntry(req, res) {
  const route = (req.url || '').split('?')[0];
  if (route === '/api/private-entry/status' && req.method === 'GET') {
    send(res, 200, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: true, privateMode: PRIVATE_MODE, unlocked: !!getPrivateEntrySession(req), configured: PRIVATE_ENTRY_KEY.length >= 24 }));
    return;
  }
  if (route === '/api/private-entry/unlock' && req.method === 'POST') {
    readJsonBody(req, 8 * 1024).then(body => {
      if (PRIVATE_ENTRY_KEY.length < 24) {
        audit('private_entry.not_configured', { ip: clientIp(req) });
        send(res, 503, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: 'private_entry_not_configured' }));
        return;
      }
      if (!verifyPrivateEntryKey(body.key)) {
        audit('private_entry.denied', { ip: clientIp(req) });
        send(res, 403, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: 'private_entry_denied' }));
        return;
      }
      const session = makePrivateEntrySession(req);
      const walletScope = parseCookies(req).hashcod_wallet_scope || b64url(crypto.randomBytes(32));
      audit('private_entry.unlocked', { ip: clientIp(req) });
      send(res, 200, {
        'Content-Type': MIME['.json'],
        'Set-Cookie': [
          `hashcod_private_entry=${encodeURIComponent(session.sid)}; ${cookieOptions(req, 60 * 60 * 4)}`,
          `hashcod_wallet_scope=${encodeURIComponent(walletScope)}; ${cookieOptions(req, 60 * 60 * 24 * 365)}`
        ]
      }, JSON.stringify({ ok: true }));
    }).catch(() => send(res, 400, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: 'invalid_json' })));
    return;
  }
  send(res, 404, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: 'not_found' }));
}

function getPlatformGateSession(req) {
  const sid = parseCookies(req).hashcod_platform_gate;
  const session = sid && platformGateSessions.get(sid);
  if (!session || session.expiresAt < Date.now()) {
    if (sid) platformGateSessions.delete(sid);
    return null;
  }
  session.lastSeenAt = Date.now();
  return { sid, session };
}

function getSecurityKingSession(req) {
  const sid = parseCookies(req).hashcod_security_king;
  const session = sid && securityKingSessions.get(sid);
  if (!session || session.expiresAt < Date.now()) {
    if (sid) securityKingSessions.delete(sid);
    return null;
  }
  session.lastSeenAt = Date.now();
  return { sid, session };
}

function verifySecurityKingPair(key, nonce) {
  const keyHash = crypto.createHash('sha256').update(String(key || '')).digest('hex');
  const nonceHash = crypto.createHash('sha256').update(String(nonce || '')).digest('hex');
  const expectedKey = String(SECURITY_KING_KEY_HASH || '').trim();
  const expectedNonce = String(SECURITY_KING_NONCE_HASH || '').trim();
  if (expectedKey.length !== 64 || expectedNonce.length !== 64) return false;
  return crypto.timingSafeEqual(Buffer.from(keyHash), Buffer.from(expectedKey))
    && crypto.timingSafeEqual(Buffer.from(nonceHash), Buffer.from(expectedNonce));
}

function getSession(req) {
  const sid = parseCookies(req).hashcod_session;
  const session = sid && sessions.get(sid);
  if (!session || session.expiresAt < Date.now()) {
    if (sid) sessions.delete(sid);
    return null;
  }
  const db = readAuthDb();
  const user = db.users.find(u => u.id === session.userId && u.status !== 'DISABLED');
  if (user) session.lastSeenAt = Date.now();
  return user ? { sid, session, user } : null;
}

function publicSessionRow(sid, session, currentSid) {
  return {
    id: sid.slice(0, 10),
    current: sid === currentSid,
    createdAt: new Date(session.createdAt || Date.now()).toISOString(),
    lastSeenAt: new Date(session.lastSeenAt || Date.now()).toISOString(),
    expiresAt: new Date(session.expiresAt || Date.now()).toISOString(),
    ip: session.ip || 'unknown',
    userAgent: session.userAgent || '',
  };
}

function hasAdminPanel(req) {
  const auth = getSession(req);
  return (!!auth?.session?.adminPanel && auth.user.role === 'admin') || !!getAdminPanelSession(req);
}

function getAdminPanelSession(req) {
  const sid = parseCookies(req).hashcod_admin_panel;
  const session = sid && adminPanelSessions.get(sid);
  if (!session || session.expiresAt < Date.now()) {
    if (sid) adminPanelSessions.delete(sid);
    return null;
  }
  return { sid, session };
}

function requireAdminPanel(req, res) {
  const auth = getSession(req);
  if (auth && auth.user.role === 'admin' && auth.session.adminPanel) return { ...auth, actorId: auth.user.id };
  const panel = getAdminPanelSession(req);
  if (panel) {
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      const csrf = String(req.headers['x-csrf-token'] || '');
      if (!csrf || csrf !== panel.session.csrf) {
        send(res, 403, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: 'csrf_required' }));
        return null;
      }
    }
    return { user: { id: 'admin_panel', role: 'admin', email: 'admin-panel@hashcod.local' }, session: panel.session, actorId: 'admin_panel', panelOnly: true };
  }
  send(res, 403, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: 'admin_panel_locked' }));
  return null;
}

function roleRank(role) {
  return { viewer: 1, editor: 2, admin: 3 }[role] || 0;
}

function requireAuth(req, res, minRole = 'viewer') {
  const auth = getSession(req);
  if (!auth) {
    send(res, 401, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: 'auth_required' }));
    return null;
  }
  if (roleRank(auth.user.role) < roleRank(minRole)) {
    send(res, 403, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: 'insufficient_role' }));
    return null;
  }
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    const csrf = String(req.headers['x-csrf-token'] || '');
    if (!csrf || csrf !== auth.session.csrf) {
      send(res, 403, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: 'csrf_required' }));
      return null;
    }
    if (!authenticatedRateLimit(auth, req, res)) return null;
  }
  return auth;
}

async function handleSecurityKing(req, res) {
  const route = (req.url || '').split('?')[0];
  if (route === '/api/security-king/unlock' && req.method === 'POST') {
    try {
      const body = await readJsonBody(req);
      if (!verifySecurityKingPair(body.key, body.nonce)) {
        audit('security_king.unlock_failed', { ip: clientIp(req) });
        send(res, 403, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: 'invalid_key_or_nonce' }));
        return;
      }
      const session = makeSecurityKingSession();
      audit('security_king.unlock', { ip: clientIp(req) });
      send(res, 200, { 'Content-Type': MIME['.json'], 'Set-Cookie': `hashcod_security_king=${encodeURIComponent(session.sid)}; ${cookieOptions(req, 60 * 45)}` }, JSON.stringify({ ok: true }));
    } catch {
      send(res, 400, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: 'invalid_json' }));
    }
    return;
  }

  const king = getSecurityKingSession(req);
  if (!king) {
    send(res, 403, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: 'security_king_locked' }));
    return;
  }

  if (route === '/api/security-king/logs' && req.method === 'GET') {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const db = readAuthDb();
    const auditRows = decorateAuditRows(await readSecurityAuditRows(url.searchParams.get('limit') || 300), db);
    const requests = mergedAccessRequests(db).map(publicAccessRequest);
    send(res, 200, { 'Content-Type': MIME['.json'] }, JSON.stringify({
      ok: true,
      storage: pgReady ? 'render-postgres+encrypted-file-cache' : 'encrypted-file-cache',
      users: securityUserRows(db),
      accessRequests: requests,
      audit: auditRows,
      policy: 'Hashcod does not reveal user passwords. It stores protected password hashes and audit evidence only.',
    }));
    return;
  }

  if (route === '/api/security-king/export' && req.method === 'GET') {
    const db = readAuthDb();
    const auditRows = decorateAuditRows(await readSecurityAuditRows(1000), db);
    const payload = {
      app: 'Hashcod',
      exportedAt: new Date().toISOString(),
      storage: pgReady ? 'render-postgres+encrypted-file-cache' : 'encrypted-file-cache',
      users: securityUserRows(db),
      accessRequests: mergedAccessRequests(db).map(publicAccessRequest),
      audit: auditRows,
      policy: 'Passwords are never exported in plain text.',
    };
    audit('security_king.export', { ip: clientIp(req), rows: auditRows.length });
    send(res, 200, { 'Content-Type': MIME['.json'], 'Content-Disposition': `attachment; filename="hashcod-security-king-${dailyStamp()}.json"` }, JSON.stringify(payload, null, 2));
    return;
  }

  send(res, 404, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: 'security_king_route_not_found' }));
}

async function handlePlatformGate(req, res) {
  const route = (req.url || '').split('?')[0];
  if (route === '/api/platform-gate/status' && req.method === 'GET') {
    if (!LEGACY_PLATFORM_GATE) {
      send(res, 200, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: true, unlocked: true, legacy: false, expiresAt: null }));
      return;
    }
    const gate = getPlatformGateSession(req);
    send(res, 200, { 'Content-Type': MIME['.json'] }, JSON.stringify({
      ok: true,
      unlocked: !!gate,
      expiresAt: gate ? new Date(gate.session.expiresAt).toISOString() : null,
    }));
    return;
  }

  if (route === '/api/platform-gate/challenge' && req.method === 'POST') {
    try {
      const body = await readJsonBody(req, 8 * 1024);
      if (body.resource_id && body.resource_id !== PLATFORM_GATE_RESOURCE_ID) {
        send(res, 403, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: 'capability_resource_rejected' }));
        return;
      }
      send(res, 200, { 'Content-Type': MIME['.json' ] }, JSON.stringify(makePlatformGateChallenge(req)));
    } catch {
      send(res, 400, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: 'invalid_json' }));
    }
    return;
  }

  if (route === '/api/platform-gate/unlock' && req.method === 'POST') {
    try {
      const body = await readJsonBody(req, 32 * 1024);
      const token = body.token || body.sas || body.signature || body.value || '';
      const key = body.key || body.accessKey || body.gateKey || '';
      const verified = verifyPlatformGateToken(token, key);
      if (!verified.ok) {
        audit('platform_gate.unlock_failed', { ip: clientIp(req), error: verified.error });
        appendPlatformGateAudit('operation_rejected', {
          ip: clientIp(req),
          userAgent: req.headers['user-agent'],
          result: 'CREDENTIAL_REJECTED',
          details: { error: verified.error },
        });
        send(res, 403, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: verified.error }));
        return;
      }
      const capability = verifyPlatformGateCapability(req, verified, body.operation, body.signature, key);
      if (!capability.ok) {
        audit('platform_gate.unlock_failed', { ip: clientIp(req), error: capability.error });
        appendPlatformGateAudit('operation_rejected', {
          ip: clientIp(req),
          userAgent: req.headers['user-agent'],
          result: 'CAPABILITY_REJECTED',
          credential_fingerprint: sha256Hex(verified.keyHash).slice(0, 32),
          details: { error: capability.error },
        });
        send(res, 403, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: capability.error }));
        return;
      }
      const session = makePlatformGateSession(req, verified.expiresAt);
      const maxAge = Math.max(1, Math.floor((verified.expiresAt - Date.now()) / 1000));
      audit('platform_gate.unlock', { ip: clientIp(req), expiresAt: new Date(verified.expiresAt).toISOString(), capability: true });
      send(res, 200, { 'Content-Type': MIME['.json'], 'Set-Cookie': `hashcod_platform_gate=${encodeURIComponent(session.sid)}; ${cookieOptions(req, maxAge)}` }, JSON.stringify({ ok: true, expiresAt: new Date(verified.expiresAt).toISOString(), capability: { mode: 'SIGNED_OPERATION_CHALLENGE', auditHash: capability.eventHash } }));
    } catch {
      send(res, 400, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: 'invalid_json' }));
    }
    return;
  }

  if (route === '/api/platform-gate/logout' && req.method === 'POST') {
    const sid = parseCookies(req).hashcod_platform_gate;
    if (sid) platformGateSessions.delete(sid);
    audit('platform_gate.logout', { ip: clientIp(req) });
    send(res, 200, { 'Content-Type': MIME['.json'], 'Set-Cookie': `hashcod_platform_gate=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0` }, JSON.stringify({ ok: true }));
    return;
  }

  send(res, 404, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: 'platform_gate_route_not_found' }));
}

async function handleBillingContract(req, res) {
  const route = (req.url || '').split('?')[0];
  const auth = requireAuth(req, res, 'viewer');
  if (!auth) return;
  const db = readAuthDb();

  if (route === '/api/billing-contract/me' && req.method === 'GET') {
    const contract = db.billingContracts.find(row => row.userId === auth.user.id && row.status !== 'VOID');
    send(res, 200, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: true, required: !contract, contract: publicBillingContract(contract) }));
    return;
  }

  if (route === '/api/billing-contract/me' && req.method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const validation = validateBillingContract(body);
      if (!validation.ok) {
        send(res, 400, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: validation.error }));
        return;
      }
      const now = new Date().toISOString();
      const existing = db.billingContracts.find(row => row.userId === auth.user.id && row.status !== 'VOID');
      const base = {
        ...(existing || {}),
        ...validation.row,
        id: existing?.id || `contract_${Date.now().toString(36)}_${b64url(crypto.randomBytes(8))}`,
        userId: auth.user.id,
        email: auth.user.email,
        status: 'ACTIVE',
        createdAt: existing?.createdAt || now,
        updatedAt: existing ? now : null,
        signedIp: clientIp(req),
        userAgent: safeText(req.headers['user-agent'], 180),
      };
      base.fingerprint = crypto.createHash('sha256').update(JSON.stringify({ userId: base.userId, email: base.email, fullName: base.fullName, cedula: base.cedula, address: base.address, phone: base.phone, budget: base.budget, currency: base.currency, signature: base.signature, createdAt: base.createdAt })).digest('hex');
      if (existing) Object.assign(existing, base);
      else db.billingContracts.unshift(base);
      writeAuthDb(db);
      audit('billing.contract_signed', { ip: clientIp(req), actor: auth.user.id, email: auth.user.email, contractId: base.id, budget: base.budget, currency: base.currency });
      send(res, 201, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: true, contract: publicBillingContract(base) }));
    } catch {
      send(res, 400, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: 'invalid_json' }));
    }
    return;
  }

  send(res, 404, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: 'billing_contract_route_not_found' }));
}

async function handleAuth(req, res) {
  const route = (req.url || '').split('?')[0];
  const db = readAuthDb();
  if (route === '/api/auth/me' && req.method === 'GET') {
    const auth = getSession(req);
    const panel = getAdminPanelSession(req);
    send(res, 200, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: true, setupRequired: db.users.length === 0, user: publicUser(auth?.user), csrf: auth?.session?.csrf || panel?.session?.csrf || null, adminPanel: hasAdminPanel(req), providers: publicOAuthProviders(req), auth: { passwordHash: 'scrypt', legacyPasswordHash: 'pbkdf2-sha256', sessionCookie: 'HttpOnly Secure SameSite=Lax', csrf: true, rateLimit: true, database: pgReady ? 'render-postgres' : 'encrypted-file-cache' } }));
    return;
  }
  if (route === '/api/auth/providers' && req.method === 'GET') {
    send(res, 200, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: true, providers: publicOAuthProviders(req) }));
    return;
  }
  const oauthStart = route.match(/^\/api\/auth\/oauth\/([a-z]+)\/start$/);
  if (oauthStart && req.method === 'GET') {
    const provider = OAUTH_PROVIDERS[oauthStart[1]];
    if (!provider || !provider.clientId || !provider.clientSecret) {
      send(res, 501, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: 'oauth_provider_not_configured' }));
      return;
    }
    const state = b64url(crypto.randomBytes(24));
    const nonce = b64url(crypto.randomBytes(18));
    const redirectUri = `${requestOrigin(req)}/api/auth/oauth/${provider.id}/callback`;
    oauthStates.set(state, { provider: provider.id, nonce, redirectUri, createdAt: Date.now() });
    const u = new URL(provider.authorizeUrl);
    u.searchParams.set('client_id', provider.clientId);
    u.searchParams.set('redirect_uri', redirectUri);
    u.searchParams.set('response_type', 'code');
    u.searchParams.set('scope', provider.scope);
    u.searchParams.set('state', state);
    if (provider.id !== 'github') u.searchParams.set('nonce', nonce);
    send(res, 302, { Location: u.toString(), 'Cache-Control': 'no-store' }, '');
    return;
  }
  const oauthCallback = route.match(/^\/api\/auth\/oauth\/([a-z]+)\/callback$/);
  if (oauthCallback && req.method === 'GET') {
    const provider = OAUTH_PROVIDERS[oauthCallback[1]];
    const url = new URL(req.url, requestOrigin(req));
    const code = url.searchParams.get('code') || '';
    const state = url.searchParams.get('state') || '';
    const stateRow = oauthStates.get(state);
    oauthStates.delete(state);
    if (!provider || !stateRow || stateRow.provider !== provider.id || !code) {
      audit('oauth.invalid_callback', { ip: clientIp(req), provider: oauthCallback[1] });
      send(res, 400, { 'Content-Type': 'text/html; charset=utf-8' }, '<h1>OAuth callback invalid</h1>');
      return;
    }
    try {
      const tokenBody = new URLSearchParams({
        client_id: provider.clientId,
        client_secret: provider.clientSecret,
        code,
        redirect_uri: stateRow.redirectUri,
        grant_type: 'authorization_code',
      }).toString();
      const token = await requestJson(provider.tokenUrl, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' }, body: tokenBody });
      const accessToken = token.access_token;
      if (!accessToken) throw new Error('missing_access_token');
      let profile = await requestJson(provider.userInfoUrl, { headers: { Authorization: `Bearer ${accessToken}` } });
      if (provider.id === 'github') {
        let email = profile.email;
        if (!email) {
          const emails = await requestJson(provider.emailUrl, { headers: { Authorization: `Bearer ${accessToken}` } });
          const primary = Array.isArray(emails) ? emails.find(e => e.primary && e.verified) || emails.find(e => e.verified) : null;
          email = primary?.email || '';
        }
        profile = { sub: String(profile.id || ''), email, name: profile.name || profile.login || email };
      }
      const sub = safeText(profile.sub || profile.id, 160);
      const email = safeText(profile.email, 180).toLowerCase();
      if (!sub || !validEmail(email)) throw new Error('invalid_profile');
      const freshDb = readAuthDb();
      let user = freshDb.users.find(u => u.oauth?.[provider.id]?.sub === sub) || freshDb.users.find(u => u.email === email);
      if (!user) {
        user = { id: `usr_${Date.now().toString(36)}`, email, name: safeText(profile.name, 80) || email, role: freshDb.users.length ? 'viewer' : 'admin', plan: 'enterprise', passwordHash: hashPassword(b64url(crypto.randomBytes(24))), recoveryHash: hashPassword(makeRecoveryCode()), oauth: {}, createdAt: new Date().toISOString(), status: 'ACTIVE' };
        freshDb.users.push(user);
      }
      user.oauth = { ...(user.oauth || {}), [provider.id]: { sub, email, linkedAt: new Date().toISOString() } };
      user.lastOAuthLoginAt = new Date().toISOString();
      writeAuthDb(freshDb);
      const session = makeSession(req, user);
      audit('oauth.login', { ip: clientIp(req), provider: provider.id, userId: user.id, email: user.email });
      send(res, 302, { Location: '/', 'Set-Cookie': `hashcod_session=${encodeURIComponent(session.sid)}; ${cookieOptions(req)}` }, '');
    } catch (err) {
      audit('oauth.login_failed', { ip: clientIp(req), provider: provider?.id, error: safeText(err.message, 120) });
      send(res, 500, { 'Content-Type': 'text/html; charset=utf-8' }, '<h1>OAuth login failed</h1><p>Revisa la configuracion del proveedor.</p>');
    }
    return;
  }
  if (route === '/api/admin/audit' && req.method === 'GET') {
    const auth = requireAdminPanel(req, res);
    if (!auth) return;
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const rows = readAuditRows(url.searchParams.get('limit') || 160);
    if (url.searchParams.get('download') === '1') {
      send(res, 200, { 'Content-Type': 'application/x-ndjson; charset=utf-8', 'Content-Disposition': `attachment; filename="hashcod-audit-${dailyStamp()}.jsonl"` }, rows.slice().reverse().map(row => JSON.stringify(row)).join('\n'));
      return;
    }
    send(res, 200, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: true, audit: rows }));
    return;
  }
  if (route === '/api/access/request' && req.method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const email = safeText(body.email, 180).toLowerCase();
      if (!validEmail(email) || !String(body.password || '').trim()) {
        send(res, 400, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: 'invalid_request' }));
        return;
      }
      if (db.users.some(u => u.email === email && u.status !== 'DISABLED')) {
        send(res, 409, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: 'already_has_access' }));
        return;
      }
      const existing = db.accessRequests.find(r => r.email === email && r.status === 'PENDING');
      if (existing) {
        upsertAccessHistory(existing, 'pending-check');
        send(res, 200, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: true, request: { email, blowfishId: existing.blowfishId, serial: existing.serial, status: existing.status } }));
        return;
      }
      const reqRow = {
        id: `req_${Date.now().toString(36)}_${b64url(crypto.randomBytes(8))}`,
        email,
        blowfishId: makeBlowfishId(),
        serial: makeAccessSerial(),
        desiredPasswordHash: hashPassword(body.password),
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      };
      db.accessRequests.unshift(reqRow);
      writeAuthDb(db);
      upsertAccessHistory(reqRow, 'created');
      audit('access.request', { ip: clientIp(req), requestId: reqRow.id, email });
      send(res, 201, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: true, request: { email, blowfishId: reqRow.blowfishId, serial: reqRow.serial, status: reqRow.status } }));
    } catch {
      send(res, 400, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: 'invalid_json' }));
    }
    return;
  }
  if (route === '/api/access/check' && req.method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const email = safeText(body.email, 180).toLowerCase();
      const serial = safeText(body.serial, 80).toUpperCase();
      const reqRow = db.accessRequests.find(r => r.email === email && r.serial === serial);
      if (!reqRow || !verifyPassword(body.password, reqRow.desiredPasswordHash)) {
        send(res, 404, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: 'request_not_found' }));
        return;
      }
      if (reqRow.status !== 'APPROVED') {
        send(res, 200, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: true, status: reqRow.status, blowfishId: reqRow.blowfishId, serial: reqRow.serial }));
        return;
      }
      const user = db.users.find(u => u.email === email && u.status !== 'DISABLED');
      if (!user) {
        send(res, 409, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: 'approved_user_missing' }));
        return;
      }
      const session = makeSession(req, user);
      audit('access.check_login', { ip: clientIp(req), userId: user.id, email: user.email, requestId: reqRow.id });
      send(res, 200, { 'Content-Type': MIME['.json'], 'Set-Cookie': `hashcod_session=${encodeURIComponent(session.sid)}; ${cookieOptions(req)}` }, JSON.stringify({ ok: true, status: reqRow.status, user: publicUser(user), csrf: session.csrf }));
    } catch {
      send(res, 400, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: 'invalid_json' }));
    }
    return;
  }
  if (route === '/api/access/requests' && req.method === 'GET') {
    const auth = requireAdminPanel(req, res);
    if (!auth) return;
    const requests = mergedAccessRequests(db);
    send(res, 200, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: true, requests }));
    return;
  }
  if (route === '/api/access/requests' && req.method === 'PUT') {
    const auth = requireAdminPanel(req, res);
    if (!auth) return;
    try {
      const body = await readJsonBody(req);
      const reqRow = db.accessRequests.find(r => r.id === safeText(body.id, 120));
      if (!reqRow) {
        send(res, 404, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: 'request_not_found' }));
        return;
      }
      const action = body.action === 'reject' ? 'reject' : 'approve';
      if (action === 'reject') {
        if (reqRow.status !== 'PENDING') {
          send(res, 409, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: 'request_already_reviewed' }));
          return;
        }
        reqRow.status = 'REJECTED';
        reqRow.reviewedAt = new Date().toISOString();
        reqRow.reviewedBy = auth.actorId;
        reqRow.decisionHistory = [...(Array.isArray(reqRow.decisionHistory) ? reqRow.decisionHistory : []), { action: 'reject', at: reqRow.reviewedAt, by: auth.actorId }];
        writeAuthDb(db);
        upsertAccessHistory(reqRow, 'rejected');
        audit('access.reject', { ip: clientIp(req), actor: auth.actorId, requestId: reqRow.id });
        send(res, 200, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: true, request: { ...reqRow, desiredPasswordHash: undefined } }));
        return;
      }
      if (reqRow.status !== 'PENDING') {
        send(res, 409, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: 'request_already_reviewed' }));
        return;
      }
      const role = ['viewer', 'editor', 'admin'].includes(body.role) ? body.role : 'viewer';
      const plan = ['free', 'starter', 'professional', 'enterprise'].includes(body.plan) ? body.plan : 'free';
      const recoveryCode = makeRecoveryCode();
      let user = db.users.find(u => u.email === reqRow.email);
      if (user) {
        user.role = role;
        user.plan = plan;
        user.status = 'ACTIVE';
        user.passwordHash = reqRow.desiredPasswordHash;
        user.recoveryHash = hashPassword(recoveryCode);
        user.updatedAt = new Date().toISOString();
      } else {
        user = { id: `usr_${Date.now().toString(36)}`, email: reqRow.email, name: `${reqRow.blowfishId}-${reqRow.serial}`, role, plan, passwordHash: reqRow.desiredPasswordHash, recoveryHash: hashPassword(recoveryCode), createdAt: new Date().toISOString(), status: 'ACTIVE' };
        db.users.push(user);
      }
      reqRow.status = 'APPROVED';
      reqRow.role = role;
      reqRow.plan = plan;
      reqRow.reviewedAt = new Date().toISOString();
      reqRow.reviewedBy = auth.actorId;
      reqRow.approvedUserId = user.id;
      reqRow.decisionHistory = [...(Array.isArray(reqRow.decisionHistory) ? reqRow.decisionHistory : []), { action: 'approve', at: reqRow.reviewedAt, by: auth.actorId, role, plan, userId: user.id }];
      writeAuthDb(db);
      upsertAccessHistory(reqRow, 'approved');
      audit('access.approve', { ip: clientIp(req), actor: auth.actorId, requestId: reqRow.id, userId: user.id, role, plan });
      send(res, 200, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: true, user: publicUser(user), recoveryCode }));
    } catch {
      send(res, 400, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: 'invalid_json' }));
    }
    return;
  }
  if (route === '/api/auth/register' && req.method === 'POST') {
    try {
      const body = await readJsonBody(req);
      if (db.users.length > 0) {
        send(res, 403, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: 'setup_completed' }));
        return;
      }
      const email = safeText(body.email, 180).toLowerCase();
      const name = safeText(body.name, 80) || 'Admin';
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || !strongPassword(body.password)) {
        send(res, 400, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: 'weak_registration' }));
        return;
      }
      const recoveryCode = makeRecoveryCode();
      const user = { id: `usr_${Date.now().toString(36)}`, email, name, role: 'admin', plan: 'enterprise', passwordHash: hashPassword(body.password), recoveryHash: hashPassword(recoveryCode), createdAt: new Date().toISOString(), status: 'ACTIVE' };
      writeAuthDb({ users: [user] });
      const session = makeSession(req, user);
      audit('auth.register_admin', { ip: clientIp(req), userId: user.id, email: user.email });
      send(res, 201, { 'Content-Type': MIME['.json'], 'Set-Cookie': `hashcod_session=${encodeURIComponent(session.sid)}; ${cookieOptions(req)}` }, JSON.stringify({ ok: true, user: publicUser(user), csrf: session.csrf, recoveryCode }));
    } catch {
      send(res, 400, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: 'invalid_json' }));
    }
    return;
  }
  if (route === '/api/auth/login' && req.method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const email = safeText(body.email, 180).toLowerCase();
      const user = db.users.find(u => u.email === email && u.status !== 'DISABLED');
      if (!user || !verifyPassword(body.password, user.passwordHash)) {
        audit('auth.login_failed', { ip: clientIp(req), email });
        send(res, 401, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: 'invalid_credentials' }));
        return;
      }
      const session = makeSession(req, user);
      audit('auth.login', { ip: clientIp(req), userId: user.id, email: user.email });
      send(res, 200, { 'Content-Type': MIME['.json'], 'Set-Cookie': `hashcod_session=${encodeURIComponent(session.sid)}; ${cookieOptions(req)}` }, JSON.stringify({ ok: true, user: publicUser(user), csrf: session.csrf }));
    } catch {
      send(res, 400, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: 'invalid_json' }));
    }
    return;
  }
  if (route === '/api/auth/logout' && req.method === 'POST') {
    const auth = getSession(req);
    if (auth) sessions.delete(auth.sid);
    const panel = getAdminPanelSession(req);
    if (panel) adminPanelSessions.delete(panel.sid);
    send(res, 200, { 'Content-Type': MIME['.json'], 'Set-Cookie': [`hashcod_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`, `hashcod_admin_panel=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`] }, JSON.stringify({ ok: true }));
    return;
  }
  if (route === '/api/auth/sessions' && req.method === 'GET') {
    const auth = requireAuth(req, res, 'viewer');
    if (!auth) return;
    const rows = Array.from(sessions.entries())
      .filter(([, session]) => session.userId === auth.user.id && session.expiresAt > Date.now())
      .map(([sid, session]) => publicSessionRow(sid, session, auth.sid))
      .sort((a, b) => String(b.lastSeenAt).localeCompare(String(a.lastSeenAt)));
    send(res, 200, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: true, sessions: rows }));
    return;
  }
  if (route === '/api/auth/logout-all' && req.method === 'POST') {
    const auth = requireAuth(req, res, 'viewer');
    if (!auth) return;
    for (const [sid, session] of sessions.entries()) {
      if (session.userId === auth.user.id) sessions.delete(sid);
    }
    audit('auth.logout_all', { ip: clientIp(req), userId: auth.user.id, email: auth.user.email });
    send(res, 200, { 'Content-Type': MIME['.json'], 'Set-Cookie': `hashcod_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0` }, JSON.stringify({ ok: true }));
    return;
  }
  if (route === '/api/admin/unlock' && req.method === 'POST') {
    const auth = getSession(req);
    try {
      const body = await readJsonBody(req);
      const keyHash = crypto.createHash('sha256').update(String(body.panelKey || '')).digest('hex');
      const expectedPanelHash = String(ADMIN_PANEL_KEY_HASH || '').trim();
      if (expectedPanelHash.length !== 64 || !crypto.timingSafeEqual(Buffer.from(keyHash), Buffer.from(expectedPanelHash))) {
        audit('admin.unlock_failed', { ip: clientIp(req), actor: auth?.user?.id || 'public' });
        send(res, 403, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: 'invalid_panel_key' }));
        return;
      }
      if (auth?.user?.role === 'admin') auth.session.adminPanel = true;
      const panel = makeAdminPanelSession();
      audit('admin.unlock', { ip: clientIp(req), actor: auth?.user?.id || 'admin_panel' });
      send(res, 200, { 'Content-Type': MIME['.json'], 'Set-Cookie': `hashcod_admin_panel=${encodeURIComponent(panel.sid)}; ${cookieOptions(req, 60 * 60 * 4)}` }, JSON.stringify({ ok: true, csrf: panel.csrf }));
    } catch {
      send(res, 400, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: 'invalid_json' }));
    }
    return;
  }
  if (route === '/api/auth/recover' && req.method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const email = safeText(body.email, 180).toLowerCase();
      const user = db.users.find(u => u.email === email && u.status !== 'DISABLED');
      if (!user || !user.recoveryHash || !verifyPassword(body.recoveryCode, user.recoveryHash) || !strongPassword(body.password)) {
        audit('auth.recover_failed', { ip: clientIp(req), email });
        send(res, 401, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: 'invalid_recovery' }));
        return;
      }
      const newRecoveryCode = makeRecoveryCode();
      user.passwordHash = hashPassword(body.password);
      user.recoveryHash = hashPassword(newRecoveryCode);
      user.updatedAt = new Date().toISOString();
      writeAuthDb(db);
      audit('auth.recover', { ip: clientIp(req), userId: user.id });
      send(res, 200, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: true, recoveryCode: newRecoveryCode }));
    } catch {
      send(res, 400, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: 'invalid_json' }));
    }
    return;
  }
  if (route === '/api/auth/users' && req.method === 'POST') {
    const auth = requireAdminPanel(req, res);
    if (!auth) return;
    try {
      const body = await readJsonBody(req);
      const email = safeText(body.email, 180).toLowerCase();
      const role = ['viewer', 'editor', 'admin'].includes(body.role) ? body.role : 'viewer';
      const plan = ['free', 'starter', 'professional', 'enterprise'].includes(body.plan) ? body.plan : 'free';
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || !strongPassword(body.password) || db.users.some(u => u.email === email)) {
        send(res, 400, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: 'invalid_user' }));
        return;
      }
      const recoveryCode = makeRecoveryCode();
      const user = { id: `usr_${Date.now().toString(36)}`, email, name: safeText(body.name, 80) || email, role, plan, passwordHash: hashPassword(body.password), recoveryHash: hashPassword(recoveryCode), createdAt: new Date().toISOString(), status: 'ACTIVE' };
      db.users.push(user);
      writeAuthDb(db);
      audit('auth.user_create', { ip: clientIp(req), actor: auth.actorId, userId: user.id, role });
      send(res, 201, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: true, user: publicUser(user), recoveryCode }));
    } catch {
      send(res, 400, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: 'invalid_json' }));
    }
    return;
  }
  if (route === '/api/auth/users' && req.method === 'GET') {
    const auth = requireAdminPanel(req, res);
    if (!auth) return;
    send(res, 200, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: true, users: db.users.map(publicUser) }));
    return;
  }
  if (route === '/api/auth/users' && req.method === 'PUT') {
    const auth = requireAdminPanel(req, res);
    if (!auth) return;
    try {
      const body = await readJsonBody(req);
      const user = db.users.find(u => u.id === safeText(body.id, 120));
      if (!user) {
        send(res, 404, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: 'user_not_found' }));
        return;
      }
      if (['viewer', 'editor', 'admin'].includes(body.role)) user.role = body.role;
      if (['free', 'starter', 'professional', 'enterprise'].includes(body.plan)) user.plan = body.plan;
      if (['ACTIVE', 'DISABLED'].includes(body.status)) user.status = body.status;
      user.updatedAt = new Date().toISOString();
      writeAuthDb(db);
      audit('auth.user_update', { ip: clientIp(req), actor: auth.actorId, userId: user.id, role: user.role, plan: user.plan, status: user.status });
      send(res, 200, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: true, user: publicUser(user) }));
    } catch {
      send(res, 400, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: 'invalid_json' }));
    }
    return;
  }
  send(res, 404, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: 'auth_route_not_found' }));
}

function readAssistRequests() {
  try {
    ensureDataDir();
    const raw = fs.existsSync(HELP_REQUESTS_FILE) ? fs.readFileSync(HELP_REQUESTS_FILE, 'utf8') : '[]';
    const rows = JSON.parse(raw);
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}

function writeAssistRequests(rows) {
  ensureDataDir();
  fs.writeFileSync(HELP_REQUESTS_FILE, JSON.stringify(rows.slice(0, 500), null, 2));
  ensureAutomaticBackup('assist-write');
}

function readCliConsole() {
  try {
    ensureDataDir();
    const raw = fs.existsSync(CLI_CONSOLE_FILE) ? fs.readFileSync(CLI_CONSOLE_FILE, 'utf8') : '[]';
    const rows = JSON.parse(raw);
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}

function writeCliConsole(rows) {
  ensureDataDir();
  fs.writeFileSync(CLI_CONSOLE_FILE, JSON.stringify(rows.slice(0, 1000), null, 2));
  ensureAutomaticBackup('cli-write');
}

function readSmsGatewayDb() {
  try {
    ensureDataDir();
    const raw = fs.existsSync(SMS_GATEWAY_FILE) ? fs.readFileSync(SMS_GATEWAY_FILE, 'utf8') : '{}';
    const db = JSON.parse(raw);
    return {
      devices: Array.isArray(db.devices) ? db.devices : [],
      messages: Array.isArray(db.messages) ? db.messages : [],
      phoneDevices: Array.isArray(db.phoneDevices) ? db.phoneDevices : [],
      notifications: Array.isArray(db.notifications) ? db.notifications : [],
    };
  } catch {
    return { devices: [], messages: [], phoneDevices: [], notifications: [] };
  }
}

function writeSmsGatewayDb(db) {
  ensureDataDir();
  fs.writeFileSync(SMS_GATEWAY_FILE, JSON.stringify({
    devices: (db.devices || []).slice(0, 50),
    messages: (db.messages || []).slice(0, 1000),
    phoneDevices: (db.phoneDevices || []).slice(0, 50),
    notifications: (db.notifications || []).slice(0, 1500),
  }, null, 2));
  ensureAutomaticBackup('sms-gateway-write');
}

const WALLET_VERSIONS = {
  'v1.2.5': 4,
  'v1.5-10': 16,
  'v2.2-5': 22,
  'v2.5-10': 30,
};

function walletMath(value) {
  const bytes = Buffer.from(String(value || ''), 'utf8');
  const size = Math.max(1, bytes.length);
  const integral = Array.from(bytes).reduce((sum, byte, index) => sum + ((index + 1) / size) * ((byte + 1) / 256), 0);
  const bracket = Array.from(bytes).reduce((sum, byte, index) => sum + ((byte % 17) + 1) * ((index % 7) + 1), 0);
  const phase = Number(((integral % 6.283185307).toFixed(6)));
  return { integral: Number(integral.toFixed(6)), bracket, phase, bytes: bytes.length };
}

function publicWalletRow(row) {
  const { userId, ip, sessionFingerprint, computerFingerprint, ...publicRow } = row || {};
  return publicRow;
}

function requireWalletAccess(req, res) {
  const authenticated = getSession(req);
  if (authenticated) return requireAuth(req, res, 'viewer');
  const privateEntry = getPrivateEntrySession(req);
  if (!privateEntry) {
    send(res, 403, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: 'private_entry_required' }));
    return null;
  }
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    const origin = String(req.headers.origin || '').trim();
    if (origin && origin !== requestOrigin(req)) {
      send(res, 403, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: 'wallet_origin_required' }));
      return null;
    }
  }
  const cookies = parseCookies(req);
  const sid = cookies.hashcod_wallet_scope || privateEntry.sid || cookies.hashcod_private_entry || `${clientIp(req)}|${safeText(req.headers['user-agent'], 180)}|local-wallet`;
  const userId = `wallet_private_${crypto.createHash('sha256').update(sid).digest('hex').slice(0, 24)}`;
  return { user: { id: userId, role: 'private-wallet' }, actorId: userId, privateSession: true };
}

async function handleCodeWallet(req, res) {
  const auth = requireWalletAccess(req, res);
  if (!auth) return;
  const route = (req.url || '').split('?')[0];
  if (route !== '/api/code-wallet') {
    send(res, 404, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: 'wallet_route_not_found' }));
    return;
  }
  const rows = await readCodeWallet();
  if (req.method === 'GET') {
    const mine = rows.filter(row => row.userId === auth.user.id).map(publicWalletRow);
    send(res, 200, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: true, rows: mine, storage: pgReady ? 'render-postgres+encrypted-cache' : 'encrypted-cache', network: { p2p: 'browser-webrtc-capable', udp: 'relay-required', tcpSync: 'https-api-active' } }));
    return;
  }
  if (req.method === 'POST') {
    try {
      const body = await readJsonBody(req, 256 * 1024);
      const payload = safeWalletPayload(body.payload, 16000);
      const kind = ['prompt', 'text', 'document', 'json', 'code'].includes(body.kind) ? body.kind : 'code';
      const version = WALLET_VERSIONS[body.version] ? body.version : 'v1.2.5';
      const name = safeText(body.name, 80) || `WALLET-${kind.toUpperCase()}-${String(Date.now()).slice(-8)}`;
      if (payload.length < 1) {
        send(res, 400, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: 'wallet_payload_required' }));
        return;
      }
      const digest = crypto.createHash('sha256').update(`${auth.user.id}|${name}|${payload}|${Date.now()}`).digest('hex');
      const metrics = walletMath(payload);
      const cookies = parseCookies(req);
      const sessionFingerprint = crypto.createHash('sha256').update(String(cookies.hashcod_session || cookies.hashcod_private_entry || cookies.hashcod_wallet_scope || '')).digest('hex').slice(0, 20);
      const computerFingerprint = crypto.createHash('sha256').update(`${safeText(req.headers['user-agent'], 180)}|${safeText(req.headers['accept-language'], 80)}|${clientIp(req)}`).digest('hex').slice(0, 20);
      const row = {
        id: `wallet_${digest.slice(0, 18)}`,
        userId: auth.user.id,
        name,
        fase: metrics.phase,
        interception: `INT-${digest.slice(18, 28).toUpperCase()}`,
        bar: Number(((metrics.integral + metrics.bracket) % 100).toFixed(2)),
        bset: `Bset (${((metrics.bracket % 9999) / 1000).toFixed(3)})`,
        udset: `Udset (${digest.slice(0, 3)}) -${((metrics.integral % 10) / 10).toFixed(2)}`,
        version,
        priceUsd: WALLET_VERSIONS[version],
        kind,
        payload,
        digest,
        metrics,
        network: { model: 'container-per-code', p2p: 'WebRTC capable', udp: 'relay required', tcpSync: 'HTTPS/TCP active' },
        ip: clientIp(req),
        sessionFingerprint,
        computerFingerprint,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      rows.unshift(row);
      await writeCodeWallet(rows);
      audit('wallet.container_created', { actor: auth.user.id, ip: clientIp(req), id: row.id, version, kind, digest: digest.slice(0, 18) });
      send(res, 201, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: true, row: publicWalletRow(row) }));
    } catch {
      send(res, 400, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: 'invalid_wallet_payload' }));
    }
    return;
  }
  if (req.method === 'DELETE') {
    const url = new URL(req.url, 'http://localhost');
    const id = safeText(url.searchParams.get('id'), 120);
    const next = rows.filter(row => !(row.id === id && row.userId === auth.user.id));
    await writeCodeWallet(next);
    audit('wallet.container_deleted', { actor: auth.user.id, ip: clientIp(req), id });
    send(res, 200, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: true, deleted: rows.length - next.length }));
    return;
  }
  send(res, 405, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: 'method_not_allowed' }));
}

function codeRegistryAudit(db, auth, eventType, codeId, description, metadata = {}) {
  const previousEventHash = db.auditLogs[0]?.eventHash || 'GENESIS';
  const createdAt = new Date().toISOString();
  const payload = JSON.stringify({ eventType, codeId, actor: auth.user.id, description, metadata, previousEventHash, createdAt });
  const row = { id: `audit_${crypto.randomBytes(8).toString('hex')}`, eventType, codeId, actor: auth.user.id, description, metadata, previousEventHash, eventHash: crypto.createHash('sha256').update(payload).digest('hex'), createdAt };
  db.auditLogs.unshift(row);
  db.auditLogs = db.auditLogs.slice(0, 3000);
  return row;
}

function publicCodeRegistryRow(row) {
  return {
    id: row.id, codeId: row.codeId, codeValue: row.codeValue, codeType: row.codeType,
    title: row.title, description: row.description, hashSha256: row.hashSha256,
    status: row.status, validationStatus: row.validationStatus, certificateActive: row.certificateActive,
    certificateId: row.certificateId, verificationUrl: row.verificationUrl,
    createdAt: row.createdAt, validationDate: row.validationDate, expirationDate: row.expirationDate,
    timeline: row.timeline,
  };
}

function registryValidationResult(row, inputValue) {
  if (!row) return { result: 'INVALID', message: 'Code not found in Hashcod.' };
  const calculatedHash = crypto.createHash('sha256').update(inputValue).digest('hex');
  if (calculatedHash !== row.hashSha256) return { result: 'ALTERED', message: 'The code exists, but its SHA-256 does not match.', calculatedHash };
  if (row.status === 'revoked') return { result: 'REVOKED', message: 'This code was revoked.', calculatedHash };
  if (row.status === 'rejected') return { result: 'REJECTED', message: 'This code was rejected.', calculatedHash };
  if (row.status === 'pending') return { result: 'PENDING', message: 'This code exists, but it is not validated yet.', calculatedHash };
  if (row.expirationDate && Date.parse(row.expirationDate) < Date.now()) return { result: 'EXPIRED', message: 'This code expired.', calculatedHash };
  if (!row.certificateActive) return { result: 'NO_CERTIFICATE', message: 'This code has no active technical certificate.', calculatedHash };
  return { result: 'VALID', message: 'Code exists, hash matches, status is active, and technical certificate is present.', calculatedHash };
}

async function handleCodeRegistry(req, res) {
  const auth = requireWalletAccess(req, res);
  if (!auth) return;
  const db = await readCodeRegistry();
  const mine = db.rows.filter(row => row.userId === auth.user.id);
  const url = new URL(req.url, 'http://localhost');
  if (req.method === 'GET') {
    const id = safeText(url.searchParams.get('id'), 120);
    const rows = id ? mine.filter(row => row.id === id || row.codeId === id) : mine;
    send(res, 200, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: true, rows: rows.map(publicCodeRegistryRow), auditCount: db.auditLogs.filter(row => row.actor === auth.user.id).length, validationCount: db.validations.filter(row => row.actor === auth.user.id).length, storage: pgReady ? 'render-postgres+encrypted-cache' : 'encrypted-cache' }));
    return;
  }
  if (req.method === 'POST') {
    try {
      const body = await readJsonBody(req, 4 * 1024 * 1024);
      const action = safeText(body.action, 40) || 'sync';
      if (action === 'validate') {
        const row = mine.find(item => item.id === body.id || item.codeId === body.id);
        const inputValue = safeWalletPayload(body.codeValue || row?.codeValue, 20000);
        const validation = registryValidationResult(row, inputValue);
        const validationRow = { id: `validation_${crypto.randomBytes(8).toString('hex')}`, actor: auth.user.id, codeId: row?.codeId || safeText(body.id, 120), result: validation.result, calculatedHash: validation.calculatedHash || '', originalHash: row?.hashSha256 || '', ip: clientIp(req), userAgent: safeText(req.headers['user-agent'], 180), createdAt: new Date().toISOString() };
        db.validations.unshift(validationRow);
        db.validations = db.validations.slice(0, 3000);
        codeRegistryAudit(db, auth, 'VALIDATE_CODE', validationRow.codeId, validation.message, { result: validation.result });
        await writeCodeRegistry(db);
        send(res, 200, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: true, validation: { ...validation, codeId: row?.codeId || '' } }));
        return;
      }
      const incoming = Array.isArray(body.rows) ? body.rows.slice(0, 2000) : [];
      let added = 0;
      let duplicates = 0;
      for (const source of incoming) {
        const codeValue = safeWalletPayload(source.value || source.codeValue, 20000);
        if (!codeValue) continue;
        const hashSha256 = crypto.createHash('sha256').update(codeValue).digest('hex');
        if (db.rows.some(row => row.userId === auth.user.id && row.hashSha256 === hashSha256)) {
          duplicates += 1;
          continue;
        }
        db.meta.sequence += 1;
        const year = new Date().getUTCFullYear();
        const codeId = `HCD-CODE-${year}-${String(db.meta.sequence).padStart(6, '0')}`;
        const createdAt = new Date().toISOString();
        const event = { at: createdAt, event: 'Code registered in Hashcod', hash: crypto.createHash('sha256').update(`${codeId}|${hashSha256}|${createdAt}`).digest('hex') };
        const row = {
          id: `registry_${hashSha256.slice(0, 18)}`, userId: auth.user.id, codeId, codeValue,
          codeType: safeText(source.type, 100) || 'hashcod-code', title: safeText(source.title, 140) || `Hashcod saved code ${db.meta.sequence}`,
          description: safeText(source.description, 500), hashSha256, status: 'pending', validationStatus: false,
          certificateActive: true, certificateId: `CERT-${hashSha256.slice(0, 14).toUpperCase()}`,
          verificationUrl: `/verify/${codeId}`, createdAt, validationDate: '', expirationDate: '', timeline: [event],
        };
        db.rows.unshift(row);
        codeRegistryAudit(db, auth, 'CREATE_CODE', codeId, 'Code registered in Hashcod', { hashSha256, codeType: row.codeType });
        added += 1;
      }
      db.rows = db.rows.slice(0, 10000);
      await writeCodeRegistry(db);
      audit('code_registry.synced', { actor: auth.user.id, ip: clientIp(req), added, duplicates, total: db.rows.length });
      send(res, 200, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: true, added, duplicates, rows: db.rows.filter(row => row.userId === auth.user.id).map(publicCodeRegistryRow) }));
    } catch (err) {
      send(res, 400, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: safeText(err.message, 100) || 'invalid_registry_payload' }));
    }
    return;
  }
  if (req.method === 'PUT') {
    try {
      const body = await readJsonBody(req, 64 * 1024);
      const allowed = ['pending', 'validated', 'rejected', 'revoked', 'expired'];
      const status = allowed.includes(body.status) ? body.status : '';
      const row = db.rows.find(item => item.userId === auth.user.id && (item.id === body.id || item.codeId === body.id));
      if (!row || !status) throw new Error('registry_status_update_invalid');
      const previousStatus = row.status;
      row.status = status;
      row.validationStatus = status === 'validated';
      row.validationDate = status === 'validated' ? new Date().toISOString() : row.validationDate;
      row.timeline.unshift({ at: new Date().toISOString(), event: `Status changed from ${previousStatus} to ${status}`, reason: safeText(body.reason, 240) });
      codeRegistryAudit(db, auth, 'CHANGE_STATUS', row.codeId, `Status changed from ${previousStatus} to ${status}`, { previousStatus, status, reason: safeText(body.reason, 240) });
      await writeCodeRegistry(db);
      send(res, 200, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: true, row: publicCodeRegistryRow(row) }));
    } catch (err) {
      send(res, 400, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: safeText(err.message, 100) || 'registry_status_update_failed' }));
    }
    return;
  }
  send(res, 405, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: 'method_not_allowed' }));
}

function requireBrandEvidenceAccess(req, res) {
  const authenticated = getSession(req);
  if (authenticated) return requireAuth(req, res, 'viewer');
  const privateEntry = getPrivateEntrySession(req);
  if (!privateEntry) {
    send(res, 403, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: 'private_entry_required' }));
    return null;
  }
  const cookies = parseCookies(req);
  const scope = cookies.hashcod_wallet_scope || privateEntry.sid || cookies.hashcod_private_entry || `${clientIp(req)}|${safeText(req.headers['user-agent'], 180)}`;
  const id = `evidence_private_${crypto.createHash('sha256').update(scope).digest('hex').slice(0, 24)}`;
  return { user: { id, email: '' }, actorId: id, privateSession: true };
}

function brandEvidenceEvent(previousHash, action, meta = {}) {
  const at = new Date().toISOString();
  const payload = JSON.stringify({ previousHash: previousHash || 'GENESIS', at, action, meta });
  return { at, action, meta, previousHash: previousHash || 'GENESIS', eventHash: crypto.createHash('sha256').update(payload).digest('hex') };
}

function publicBrandEvidence(row, includeFiles = false) {
  if (!row) return null;
  return {
    id: row.id, tokenId: row.tokenId, ownerName: row.ownerName,
    ownerDocument: row.ownerDocument ? `${row.ownerDocument.slice(0, 3)}***` : '',
    email: row.email, phone: row.phone, brandName: row.brandName,
    evidenceType: row.evidenceType, description: row.description, status: row.status,
    createdAt: row.createdAt, updatedAt: row.updatedAt, packageHash: row.packageHash,
    signature: row.signature, sourceCode: row.sourceCode, timeline: row.timeline,
    files: (row.files || []).map(file => ({
      id: file.id, name: file.name, mime: file.mime, size: file.size,
      sha256: file.sha256, uploadedAt: file.uploadedAt,
      ...(includeFiles ? { contentBase64: file.contentBase64 } : {}),
    })),
    legalNotice: row.legalNotice,
  };
}

async function handleBrandEvidence(req, res) {
  const auth = requireBrandEvidenceAccess(req, res);
  if (!auth) return;
  const url = new URL(req.url, 'http://localhost');
  const rows = await readBrandEvidence();
  const mine = rows.filter(row => row.userId === auth.user.id);
  if (req.method === 'GET') {
    const id = safeText(url.searchParams.get('id'), 120);
    const includeFiles = url.searchParams.get('download') === '1';
    if (id) {
      const row = mine.find(item => item.id === id || item.tokenId === id);
      if (!row) {
        send(res, 404, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: 'brand_evidence_not_found' }));
        return;
      }
      send(res, 200, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: true, row: publicBrandEvidence(row, includeFiles) }));
      return;
    }
    send(res, 200, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: true, rows: mine.map(row => publicBrandEvidence(row)), storage: pgReady ? 'render-postgres+encrypted-cache' : 'encrypted-cache' }));
    return;
  }
  if (req.method === 'POST') {
    try {
      const body = await readJsonBody(req, 18 * 1024 * 1024);
      const ownerName = safeText(body.ownerName, 140);
      const email = safeText(body.email, 180).toLowerCase();
      const brandName = safeText(body.brandName, 140);
      if (!ownerName || !validEmail(email) || !brandName) throw new Error('brand_evidence_required_fields');
      const allowedTypes = ['marca', 'logo', 'codigo', 'dominio', 'publicacion', 'factura', 'contrato', 'empaque', 'otro'];
      const evidenceType = allowedTypes.includes(body.evidenceType) ? body.evidenceType : 'marca';
      const uploaded = Array.isArray(body.files) ? body.files.slice(0, 8) : [];
      const files = uploaded.map((file, index) => {
        const contentBase64 = String(file.contentBase64 || '').replace(/\s/g, '');
        const bytes = Buffer.from(contentBase64, 'base64');
        if (!bytes.length || bytes.length > 1536 * 1024) throw new Error('invalid_evidence_file');
        return {
          id: `file_${crypto.randomBytes(8).toString('hex')}`,
          name: safeText(file.name, 180) || `evidence-${index + 1}.bin`,
          mime: safeText(file.mime, 100) || 'application/octet-stream',
          size: bytes.length, sha256: crypto.createHash('sha256').update(bytes).digest('hex'),
          contentBase64, uploadedAt: new Date().toISOString(),
        };
      });
      if (!files.length) throw new Error('brand_evidence_file_required');
      const createdAt = new Date().toISOString();
      const sourceCodeValue = safeWalletPayload(body.sourceCode?.value, 12000);
      const sourceCode = sourceCodeValue ? {
        id: safeText(body.sourceCode?.id, 120), type: safeText(body.sourceCode?.type, 100),
        value: sourceCodeValue, sha256: crypto.createHash('sha256').update(sourceCodeValue).digest('hex'),
      } : null;
      const packageHash = crypto.createHash('sha256').update(JSON.stringify({
        ownerName, email, brandName, evidenceType, createdAt,
        files: files.map(file => [file.name, file.sha256, file.size]), sourceCode: sourceCode?.sha256 || '',
      })).digest('hex');
      const tokenId = `HASHCOD-BRAND-HBE-${new Date().getUTCFullYear()}-${packageHash.slice(0, 12).toUpperCase()}`;
      const firstEvent = brandEvidenceEvent('', 'EXPEDIENT_CREATED', { tokenId, brandName, fileCount: files.length, packageHash });
      const signature = crypto.createHmac('sha256', authSecretKey()).update(`${tokenId}|${packageHash}|${firstEvent.eventHash}`).digest('hex');
      const row = {
        id: `brand_${packageHash.slice(0, 20)}`, userId: auth.user.id, tokenId, ownerName,
        ownerDocument: safeText(body.ownerDocument, 60), email, phone: safeText(body.phone, 60),
        brandName, evidenceType, description: safeText(body.description, 1000), status: 'EVIDENCE_PRESERVED',
        createdAt, updatedAt: createdAt, packageHash, signature, sourceCode, files, timeline: [firstEvent],
        legalNotice: 'Hashcod no sustituye el registro oficial de marcas ante ONAPI ni ofrece asesoria legal. Este expediente documenta evidencia digital de existencia, fecha, integridad y uso aportada por el usuario.',
      };
      rows.unshift(row);
      await writeBrandEvidence(rows);
      audit('brand_evidence.created', { actor: auth.user.id, ip: clientIp(req), id: row.id, tokenId, files: files.length, packageHash });
      send(res, 201, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: true, row: publicBrandEvidence(row) }));
    } catch (err) {
      send(res, 400, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: safeText(err.message, 100) || 'invalid_brand_evidence' }));
    }
    return;
  }
  if (req.method === 'DELETE') {
    const id = safeText(url.searchParams.get('id'), 120);
    const next = rows.filter(row => !(row.id === id && row.userId === auth.user.id));
    await writeBrandEvidence(next);
    audit('brand_evidence.deleted', { actor: auth.user.id, ip: clientIp(req), id, deleted: rows.length - next.length });
    send(res, 200, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: true, deleted: rows.length - next.length }));
    return;
  }
  send(res, 405, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: 'method_not_allowed' }));
}

function verifyGatewayDevice(db, deviceId, deviceSecret) {
  const device = db.devices.find(row => row.id === safeText(deviceId, 120) && row.status !== 'DISABLED');
  if (!device) return null;
  const secretHash = crypto.createHash('sha256').update(String(deviceSecret || '')).digest('hex');
  if (!crypto.timingSafeEqual(Buffer.from(secretHash), Buffer.from(device.secretHash))) return null;
  device.lastSeenAt = new Date().toISOString();
  device.status = 'ONLINE';
  return device;
}

function enqueueGatewaySms({ to, text, actor, format, codeType, codeIndex }) {
  const db = readSmsGatewayDb();
  const row = {
    id: `sms_${Date.now().toString(36)}_${b64url(crypto.randomBytes(6))}`,
    to,
    body: text,
    actor,
    format: safeText(format, 32),
    codeType: safeText(codeType, 120),
    codeIndex: safeText(codeIndex, 20),
    status: 'PENDING',
    attempts: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db.messages.unshift(row);
  writeSmsGatewayDb(db);
  return row;
}

function verifyPhoneDevice(db, deviceId, deviceSecret) {
  const device = db.phoneDevices.find(row => row.id === safeText(deviceId, 120) && row.status !== 'DISABLED');
  if (!device) return null;
  const secretHash = crypto.createHash('sha256').update(String(deviceSecret || '')).digest('hex');
  if (!crypto.timingSafeEqual(Buffer.from(secretHash), Buffer.from(device.secretHash))) return null;
  device.lastSeenAt = new Date().toISOString();
  device.status = 'ONLINE';
  return device;
}

function enqueuePhoneNotification({ title, body, actor, type, codeType, codeIndex, value }) {
  const db = readSmsGatewayDb();
  const row = {
    id: `note_${Date.now().toString(36)}_${b64url(crypto.randomBytes(6))}`,
    title: safeText(title, 140) || 'Hashcod notification',
    body: safeText(body, 900),
    actor: safeText(actor, 120),
    type: safeText(type, 40) || 'platform',
    codeType: safeText(codeType, 120),
    codeIndex: safeText(codeIndex, 20),
    value: safeText(value, 900),
    status: 'PENDING',
    createdAt: new Date().toISOString(),
    deliveredAt: null,
  };
  db.notifications.unshift(row);
  writeSmsGatewayDb(db);
  return row;
}

async function handleAssistRequests(req, res) {
  const auth = requireAuth(req, res, req.method === 'GET' ? 'viewer' : req.method === 'POST' ? 'editor' : 'admin');
  if (!auth) return;
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (req.method === 'GET') {
    send(res, 200, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: true, requests: readAssistRequests() }, null, 2));
    return;
  }
  if (req.method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const moderation = validatePublicPayload({ note: body.note, codePreview: body.codePreview, email: body.email, whatsapp: body.whatsapp });
      if (!moderation.ok) {
        audit('moderation.block', { ip: clientIp(req), actor: auth.user.id, route: 'assist', field: moderation.field, reason: moderation.reason });
        send(res, 400, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: moderation.reason, field: moderation.field }));
        return;
      }
      const row = {
        id: `assist_${Date.now().toString(36)}_${b64url(crypto.randomBytes(6))}`,
        email: safeText(body.email, 180),
        whatsapp: safeText(body.whatsapp, 60),
        note: safePublicText(body.note, 600),
        codeType: safeText(body.codeType, 120),
        primitive: safeText(body.primitive, 180),
        codeIndex: safeText(body.codeIndex, 20),
        codePreview: safePublicText(body.codePreview, 220),
        codeHash: safeText(body.codeHash, 80),
        createdAt: new Date().toISOString(),
        status: 'OPEN'
      };
      if (!validEmail(row.email) || !validWhatsapp(row.whatsapp)) {
        send(res, 400, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: 'email_and_whatsapp_required' }));
        return;
      }
      const rows = [row, ...readAssistRequests()].slice(0, 500);
      writeAssistRequests(rows);
      audit('assist.create', { ip: clientIp(req), actor: auth.user.id, id: row.id });
      send(res, 201, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: true, request: row }, null, 2));
    } catch {
      send(res, 400, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: 'invalid_json' }));
    }
    return;
  }
  if (req.method === 'DELETE') {
    const authPanel = requireAdminPanel(req, res);
    if (!authPanel) return;
    const id = safeText(url.searchParams.get('id'), 120);
    const before = readAssistRequests();
    const rows = before.filter(row => row.id !== id);
    writeAssistRequests(rows);
    audit('assist.delete', { ip: clientIp(req), actor: authPanel.actorId, id, deleted: before.length - rows.length });
    send(res, 200, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: true, deleted: before.length - rows.length }));
    return;
  }
  send(res, 405, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: 'method_not_allowed' }));
}

async function handleSmsSend(req, res) {
  const auth = requireAuth(req, res, 'viewer');
  if (!auth) return;
  if (req.method !== 'POST') {
    send(res, 405, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }
  try {
    const body = await readJsonBody(req);
    const to = normalizeSmsPhone(body.phone);
    const text = safeText(body.payload, 1400);
    if (!to || text.length < 1) {
      send(res, 400, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: 'invalid_sms_payload' }));
      return;
    }
    if (SMS_PROVIDER !== 'twilio') {
      const queued = enqueueGatewaySms({ to, text, actor: auth.user.id, format: body.format, codeType: body.codeType, codeIndex: body.codeIndex });
      audit('sms.gateway_queue', { ip: clientIp(req), actor: auth.user.id, id: queued.id, to: to.replace(/\d(?=\d{4})/g, '*'), format: queued.format });
      send(res, 202, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: true, provider: 'hashcod-gateway', queued: true, id: queued.id, to, status: queued.status }));
      return;
    }
    if (!SMS_ACCOUNT_SID || !SMS_AUTH_TOKEN || !SMS_FROM_NUMBER) {
      send(res, 503, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: 'sms_provider_not_configured', required: ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_FROM_NUMBER'] }));
      return;
    }
    const result = await postTwilioSms({ to, body: text });
    audit('sms.send', { ip: clientIp(req), actor: auth.user.id, to: to.replace(/\d(?=\d{4})/g, '*'), format: safeText(body.format, 32), sid: result.body?.sid || null });
    send(res, 200, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: true, to, sid: result.body?.sid || null, status: result.body?.status || 'sent' }));
  } catch (err) {
    audit('sms.send_failed', { ip: clientIp(req), actor: auth.user.id, reason: safeText(err.message, 160), statusCode: err.statusCode || null });
    send(res, err.statusCode && err.statusCode < 500 ? 400 : 502, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: 'sms_send_failed', detail: safeText(err.message, 220) }));
  }
}

async function handleSmsGateway(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const action = url.pathname.split('/').pop();
  if (req.method === 'GET' && action === 'status') {
    const auth = requireAuth(req, res, 'viewer');
    if (!auth) return;
    const db = readSmsGatewayDb();
    const messages = db.messages.slice(0, 120).map(row => ({ ...row, body: undefined }));
    const devices = db.devices.map(({ secretHash, ...device }) => device);
    send(res, 200, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: true, provider: SMS_PROVIDER, devices, messages }, null, 2));
    return;
  }
  if (req.method !== 'POST') {
    send(res, 405, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }
  try {
    const body = await readJsonBody(req);
    const db = readSmsGatewayDb();
    if (action === 'register') {
      const keyHash = crypto.createHash('sha256').update(String(body.pairingKey || '')).digest('hex');
      const expectedPairHash = String(SMS_GATEWAY_PAIRING_KEY_HASH || '').trim();
      if (expectedPairHash.length !== 64 || !crypto.timingSafeEqual(Buffer.from(keyHash), Buffer.from(expectedPairHash))) {
        audit('sms.gateway_pair_failed', { ip: clientIp(req) });
        send(res, 403, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: 'invalid_pairing_key' }));
        return;
      }
      const secret = b64url(crypto.randomBytes(32));
      const device = {
        id: `gw_${Date.now().toString(36)}_${b64url(crypto.randomBytes(5))}`,
        name: safeText(body.name, 80) || 'Hashcod Android Gateway',
        secretHash: crypto.createHash('sha256').update(secret).digest('hex'),
        status: 'ONLINE',
        createdAt: new Date().toISOString(),
        lastSeenAt: new Date().toISOString(),
        sent: 0,
        failed: 0,
      };
      db.devices.unshift(device);
      writeSmsGatewayDb(db);
      audit('sms.gateway_register', { ip: clientIp(req), deviceId: device.id });
      send(res, 201, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: true, deviceId: device.id, deviceSecret: secret, name: device.name }));
      return;
    }
    const device = verifyGatewayDevice(db, body.deviceId, body.deviceSecret);
    if (!device) {
      send(res, 403, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: 'invalid_gateway_device' }));
      return;
    }
    if (action === 'poll') {
      const job = db.messages.find(row => row.status === 'PENDING' || row.status === 'RETRY');
      if (job) {
        job.status = 'DISPATCHING';
        job.deviceId = device.id;
        job.attempts = Number(job.attempts || 0) + 1;
        job.updatedAt = new Date().toISOString();
      }
      writeSmsGatewayDb(db);
      send(res, 200, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: true, job: job ? { id: job.id, to: job.to, body: job.body, format: job.format, codeType: job.codeType, codeIndex: job.codeIndex } : null }));
      return;
    }
    if (action === 'report') {
      const id = safeText(body.messageId, 120);
      const status = ['SENT', 'FAILED', 'RETRY'].includes(body.status) ? body.status : 'SENT';
      const job = db.messages.find(row => row.id === id && row.deviceId === device.id);
      if (!job) {
        send(res, 404, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: 'message_not_found' }));
        return;
      }
      job.status = status;
      job.error = safeText(body.error, 180);
      job.completedAt = status === 'SENT' || status === 'FAILED' ? new Date().toISOString() : null;
      job.updatedAt = new Date().toISOString();
      if (status === 'SENT') device.sent = Number(device.sent || 0) + 1;
      if (status === 'FAILED') device.failed = Number(device.failed || 0) + 1;
      writeSmsGatewayDb(db);
      audit('sms.gateway_report', { ip: clientIp(req), deviceId: device.id, messageId: id, status });
      send(res, 200, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: true, message: { id: job.id, status: job.status } }));
      return;
    }
    send(res, 404, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: 'gateway_route_not_found' }));
  } catch {
    send(res, 400, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: 'invalid_json' }));
  }
}

async function handlePhoneOs(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const action = url.pathname.split('/').pop();
  if (req.method === 'GET' && action === 'status') {
    const auth = requireAuth(req, res, 'viewer');
    if (!auth) return;
    const db = readSmsGatewayDb();
    const phoneDevices = db.phoneDevices.map(({ secretHash, ...device }) => device);
    const notifications = db.notifications.slice(0, 120).map(row => ({ ...row, value: undefined }));
    send(res, 200, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: true, phoneDevices, notifications }, null, 2));
    return;
  }
  if (req.method !== 'POST') {
    send(res, 405, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }
  try {
    const body = await readJsonBody(req);
    const db = readSmsGatewayDb();
    if (action === 'register') {
      const keyHash = crypto.createHash('sha256').update(String(body.pairingKey || '')).digest('hex');
      const expectedPairHash = String(SMS_GATEWAY_PAIRING_KEY_HASH || '').trim();
      if (expectedPairHash.length !== 64 || !crypto.timingSafeEqual(Buffer.from(keyHash), Buffer.from(expectedPairHash))) {
        audit('phoneos.pair_failed', { ip: clientIp(req) });
        send(res, 403, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: 'invalid_pairing_key' }));
        return;
      }
      const secret = b64url(crypto.randomBytes(32));
      const device = {
        id: `phone_${Date.now().toString(36)}_${b64url(crypto.randomBytes(5))}`,
        name: safeText(body.name, 80) || 'Hashcod Phone OS',
        secretHash: crypto.createHash('sha256').update(secret).digest('hex'),
        status: 'ONLINE',
        createdAt: new Date().toISOString(),
        lastSeenAt: new Date().toISOString(),
        delivered: 0,
      };
      db.phoneDevices.unshift(device);
      writeSmsGatewayDb(db);
      audit('phoneos.register', { ip: clientIp(req), deviceId: device.id });
      send(res, 201, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: true, deviceId: device.id, deviceSecret: secret, name: device.name }));
      return;
    }
    if (action === 'send') {
      const auth = requireAuth(req, res, 'viewer');
      if (!auth) return;
      const note = enqueuePhoneNotification({
        title: body.title || 'Hashcod code saved',
        body: body.body || body.value || '',
        actor: auth.user.id,
        type: body.type || 'code',
        codeType: body.codeType,
        codeIndex: body.codeIndex,
        value: body.value,
      });
      audit('phoneos.queue', { ip: clientIp(req), actor: auth.user.id, id: note.id, type: note.type });
      send(res, 202, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: true, queued: true, id: note.id, status: note.status }));
      return;
    }
    const device = verifyPhoneDevice(db, body.deviceId, body.deviceSecret);
    if (!device) {
      send(res, 403, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: 'invalid_phone_device' }));
      return;
    }
    if (action === 'poll') {
      const notes = db.notifications.filter(row => row.status === 'PENDING').slice(0, 10);
      notes.forEach(row => {
        row.status = 'DELIVERING';
        row.deviceId = device.id;
        row.updatedAt = new Date().toISOString();
      });
      writeSmsGatewayDb(db);
      send(res, 200, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: true, notifications: notes.map(row => ({ id: row.id, title: row.title, body: row.body, type: row.type, codeType: row.codeType, codeIndex: row.codeIndex, value: row.value, createdAt: row.createdAt })) }));
      return;
    }
    if (action === 'ack') {
      const ids = Array.isArray(body.ids) ? body.ids.map(id => safeText(id, 120)) : [safeText(body.id, 120)];
      let count = 0;
      db.notifications.forEach(row => {
        if (ids.includes(row.id)) {
          row.status = 'DELIVERED';
          row.deviceId = device.id;
          row.deliveredAt = new Date().toISOString();
          row.updatedAt = row.deliveredAt;
          count += 1;
        }
      });
      device.delivered = Number(device.delivered || 0) + count;
      writeSmsGatewayDb(db);
      audit('phoneos.ack', { ip: clientIp(req), deviceId: device.id, count });
      send(res, 200, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: true, delivered: count }));
      return;
    }
    send(res, 404, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: 'phoneos_route_not_found' }));
  } catch {
    send(res, 400, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: 'invalid_json' }));
  }
}

async function handleCliConsole(req, res) {
  const auth = requireAuth(req, res, req.method === 'GET' ? 'viewer' : 'editor');
  if (!auth) return;
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const canEditCli = (row, ownerKey) => auth.user.role === 'admin' || row.ownerUserId === auth.user.id || (!!ownerKey && row.ownerKey === ownerKey) || row.permissions?.edit === 'all';
  const canHideCli = (row, ownerKey) => auth.user.role === 'admin' || row.ownerUserId === auth.user.id || (!!ownerKey && row.ownerKey === ownerKey) || row.permissions?.hide === 'all';
  const canViewCli = (row, ownerKey) => row.status === 'ACTIVE' || auth.user.role === 'admin' || row.ownerUserId === auth.user.id || (!!ownerKey && row.ownerKey === ownerKey);
  if (req.method === 'GET') {
    const ownerKey = safeText(url.searchParams.get('ownerKey'), 120);
    const rows = readCliConsole().filter(row => row.status !== 'PURGED' && canViewCli(row, ownerKey)).map(row => {
      const { ownerKey: storedOwnerKey, ...publicRow } = row;
      const isOwner = row.ownerUserId === auth.user.id || (!!ownerKey && storedOwnerKey === ownerKey);
      return { ...publicRow, isOwner, canEdit: canEditCli(row, ownerKey), canHide: canHideCli(row, ownerKey), canPurge: isOwner || auth.user.role === 'admin' };
    });
    send(res, 200, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: true, entries: rows }, null, 2));
    return;
  }
  if (req.method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const moderation = validatePublicPayload({ title: body.title, text: body.text, author: body.author });
      if (!moderation.ok) {
        audit('moderation.block', { ip: clientIp(req), actor: auth.user.id, route: 'cli', field: moderation.field, reason: moderation.reason });
        send(res, 400, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: moderation.reason, field: moderation.field }));
        return;
      }
      const text = safePublicText(body.text, 6000);
      const ownerKey = safeText(body.ownerKey, 120);
      if (!text || !ownerKey) {
        send(res, 400, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: 'text_and_owner_required' }));
        return;
      }
      const row = {
        id: `cli_${Date.now().toString(36)}_${b64url(crypto.randomBytes(6))}`,
        title: safePublicText(body.title, 120) || 'CLI note',
        text,
        ownerKey,
        ownerUserId: auth.user.id,
        author: safeText(body.author, 80) || 'anonymous',
        permissions: {
          view: 'all',
          edit: body.editPermission === 'owner' ? 'owner' : 'all',
          hide: body.hidePermission === 'all' ? 'all' : 'owner',
        },
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const rows = [row, ...readCliConsole()].slice(0, 1000);
      writeCliConsole(rows);
      audit('cli.create', { ip: clientIp(req), actor: auth.user.id, id: row.id });
      send(res, 201, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: true, entry: row }, null, 2));
    } catch {
      send(res, 400, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: 'invalid_json' }));
    }
    return;
  }
  if (req.method === 'PUT') {
    try {
      const body = await readJsonBody(req);
      const id = safeText(body.id, 120);
      const ownerKey = safeText(body.ownerKey, 120);
      const rows = readCliConsole();
      const now = new Date().toISOString();
      let updated = null;
      let denied = false;
      const next = rows.map(row => {
        if (row.id !== id) return row;
        if (!canEditCli(row, ownerKey)) {
          denied = true;
          return row;
        }
        const moderation = validatePublicPayload({ title: body.title, text: body.text, editor: body.editor });
        if (!moderation.ok) {
          denied = moderation.reason;
          return row;
        }
        updated = {
          ...row,
          title: safePublicText(body.title, 120) || row.title,
          text: safePublicText(body.text, 6000),
          editor: safeText(body.editor, 80) || 'anonymous',
          permissions: row.permissions || { view: 'all', edit: 'all', hide: 'owner' },
          status: row.status === 'HIDDEN' ? 'HIDDEN' : 'ACTIVE',
          updatedAt: now,
        };
        return updated;
      });
      if (denied) {
        const error = denied === true ? 'record_edit_forbidden' : denied;
        audit('cli.update_blocked', { ip: clientIp(req), actor: auth.user.id, id, error });
        send(res, 403, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error }));
        return;
      }
      writeCliConsole(next);
      if (updated) audit('cli.update', { ip: clientIp(req), actor: auth.user.id, id });
      send(res, updated ? 200 : 404, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: !!updated, entry: updated }));
    } catch {
      send(res, 400, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: 'invalid_json' }));
    }
    return;
  }
  if (req.method === 'DELETE') {
    const id = safeText(url.searchParams.get('id'), 120);
    const ownerKey = safeText(url.searchParams.get('ownerKey'), 120);
    const permanent = url.searchParams.get('permanent') === '1';
    const rows = readCliConsole();
    const target = rows.find(row => row.id === id);
    if (!target) {
      send(res, 404, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: 'not_found' }));
      return;
    }
    if (permanent) {
      if (auth.user.role !== 'admin' && target.ownerUserId !== auth.user.id && (!ownerKey || target.ownerKey !== ownerKey)) {
        send(res, 403, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: 'creator_only' }));
        return;
      }
      writeCliConsole(rows.filter(row => row.id !== id));
      audit('cli.purge', { ip: clientIp(req), actor: auth.user.id, id });
      send(res, 200, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: true, purged: 1 }));
      return;
    }
    const next = rows.map(row => row.id === id ? { ...row, status: 'HIDDEN', updatedAt: new Date().toISOString() } : row);
    if (!canHideCli(target, ownerKey)) {
      send(res, 403, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: 'record_hide_forbidden' }));
      return;
    }
    writeCliConsole(next);
    audit('cli.hide', { ip: clientIp(req), actor: auth.user.id, id });
    send(res, 200, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: true, hidden: 1 }));
    return;
  }
  send(res, 405, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: 'method_not_allowed' }));
}

async function handleCryptoAiChat(req, res) {
  const auth = requireAuth(req, res, 'viewer');
  if (!auth) return;
  if (req.method !== 'POST') {
    send(res, 405, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }
  try {
    const body = await readJsonBody(req);
    const provider = aiProviderProfile(body.provider);
    const apiKey = String(body.apiKey || '').trim();
    const customUrl = safeText(body.customUrl, 300);
    const actualModel = safeText(body.actualModel, 120) || provider.defaultModel;
    const messages = Array.isArray(body.messages) ? body.messages.slice(-12).map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: safeText(msg.content, 6000),
    })).filter(msg => msg.content) : [];
    const codeContext = safeText(body.codeContext, 3500);
    if (!apiKey || !messages.length) {
      send(res, 400, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: 'missing_api_key_or_messages' }));
      return;
    }
    const systemPrompt = [
      'You are Hashcod Crypto AI, a specialized assistant for cryptographic codes, tokenization payloads, key handling, encoding formats, QR/export formats, HNS/HOS/HCP flows, and security review.',
      'Give practical, safe, production-minded answers. Do not invent impossible cryptographic guarantees. Warn when a request would expose secrets or misuse keys.',
      `Internal Hashcod model name: ${provider.hashModel}.`,
      codeContext ? `Current Hashcod code context:\n${codeContext}` : '',
    ].filter(Boolean).join('\n\n');
    let answer = '';
    if (provider.id === 'openai') {
      const result = await httpsJsonRequest({
        hostname: 'api.openai.com',
        path: '/v1/chat/completions',
        headers: { Authorization: `Bearer ${apiKey}` },
        body: {
          model: actualModel,
          temperature: 0.25,
          messages: [{ role: 'system', content: systemPrompt }, ...messages],
        },
      });
      answer = result.body?.choices?.[0]?.message?.content || '';
    } else if (provider.id === 'claude') {
      const result = await httpsJsonRequest({
        hostname: 'api.anthropic.com',
        path: '/v1/messages',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: {
          model: actualModel,
          max_tokens: 1200,
          temperature: 0.25,
          system: systemPrompt,
          messages,
        },
      });
      answer = (result.body?.content || []).map(part => part.text || '').join('\n').trim();
    } else if (provider.id === 'gemini') {
      const result = await httpsJsonRequest({
        hostname: 'generativelanguage.googleapis.com',
        path: `/v1beta/models/${encodeURIComponent(actualModel)}:generateContent?key=${encodeURIComponent(apiKey)}`,
        body: {
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: messages.map(msg => ({ role: msg.role === 'assistant' ? 'model' : 'user', parts: [{ text: msg.content }] })),
          generationConfig: { temperature: 0.25, maxOutputTokens: 1200 },
        },
      });
      answer = (result.body?.candidates?.[0]?.content?.parts || []).map(part => part.text || '').join('\n').trim();
    } else {
      if (!/^https:\/\/[^/]+\/.+/i.test(customUrl)) {
        send(res, 400, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: 'custom_https_url_required' }));
        return;
      }
      const target = new URL(customUrl);
      const result = await httpsJsonRequest({
        hostname: target.hostname,
        path: `${target.pathname}${target.search}`,
        headers: { Authorization: `Bearer ${apiKey}` },
        body: {
          model: actualModel,
          temperature: 0.25,
          messages: [{ role: 'system', content: systemPrompt }, ...messages],
        },
      });
      answer = result.body?.choices?.[0]?.message?.content || result.body?.output_text || JSON.stringify(result.body, null, 2);
    }
    if (!answer) answer = 'Provider returned an empty response.';
    audit('crypto_ai.chat', { ip: clientIp(req), actor: auth.user.id, provider: provider.id, hashModel: provider.hashModel });
    send(res, 200, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: true, provider: provider.id, hashModel: provider.hashModel, actualModel, answer }));
  } catch (err) {
    audit('crypto_ai.error', { ip: clientIp(req), actor: auth.user?.id, error: safeText(err.message, 160) });
    send(res, err.statusCode === 401 ? 401 : 502, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: 'ai_provider_error', detail: safeText(err.message, 240) }));
  }
}

function splitTranslationChunks(text, max = 440) {
  const lines = String(text || '').split(/\r?\n/);
  const chunks = [];
  let current = '';
  for (const line of lines) {
    const next = current ? `${current}\n${line}` : line;
    if (Buffer.byteLength(next, 'utf8') > max && current) {
      chunks.push(current);
      current = line;
    } else {
      current = next;
    }
  }
  if (current) chunks.push(current);
  return chunks.flatMap(chunk => {
    if (Buffer.byteLength(chunk, 'utf8') <= max) return [chunk];
    const parts = [];
    for (let i = 0; i < chunk.length; i += max) parts.push(chunk.slice(i, i + max));
    return parts;
  });
}

async function translateChunkEsEn(chunk) {
  const apiUrl = process.env.HASHCOD_TRANSLATE_URL || '';
  if (apiUrl) {
    const target = new URL(apiUrl);
    const result = await httpsJsonRequest({
      hostname: target.hostname,
      path: `${target.pathname}${target.search}`,
      body: { q: chunk, source: 'es', target: 'en', format: 'text' },
      timeout: 18000,
    });
    return result.body?.translatedText || result.body?.translation || result.body?.text || '';
  }
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(chunk)}&langpair=es%7Cen`;
  const result = await requestJson(url, { headers: { 'User-Agent': 'Hashcod-Translator/1.0' } });
  return result?.responseData?.translatedText || '';
}

async function handleTranslateEsEn(req, res) {
  const auth = requireAuth(req, res, 'viewer');
  if (!auth) return;
  if (req.method !== 'POST') {
    send(res, 405, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: 'method_not_allowed' }));
    return;
  }
  try {
    const body = await readJsonBody(req, 64 * 1024);
    const text = String(body.text || '').slice(0, 12000);
    if (!text.trim()) {
      send(res, 400, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: 'empty_text' }));
      return;
    }
    const chunks = splitTranslationChunks(text);
    const translated = [];
    for (const chunk of chunks) {
      translated.push(await translateChunkEsEn(chunk));
    }
    const translatedText = translated.join('\n').trim();
    if (!translatedText) throw new Error('empty_translation');
    audit('translator.es_en', { ip: clientIp(req), actor: auth.user.id, chars: text.length, chunks: chunks.length, engine: process.env.HASHCOD_TRANSLATE_URL ? 'custom' : 'mymemory' });
    send(res, 200, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: true, translatedText, engine: process.env.HASHCOD_TRANSLATE_URL ? 'custom' : 'mymemory', chunks: chunks.length }));
  } catch (err) {
    audit('translator.error', { ip: clientIp(req), actor: auth.user?.id, error: safeText(err.message, 160) });
    send(res, 502, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: 'translation_provider_error', detail: safeText(err.message, 220) }));
  }
}

function enterpriseManifest() {
  const catalogPath = path.join(ROOT, 'data', 'catalog.js');
  const generatorPath = path.join(ROOT, 'data', 'generators.js');
  return JSON.stringify({
    app: 'Hashcod',
    profile: 'enterprise-production-baseline',
    servedAt: new Date().toISOString(),
    host: HOST,
    port: PORT,
    localOnly: HOST === '127.0.0.1' || HOST === 'localhost',
    controls: [
      'security headers',
      'no-store caching',
      'path traversal guard',
      'browser crypto self-tests',
      'catalog duplicate-id gate',
      'NEO 200 completeness gate',
      'per-record CLI permissions',
      'visible admin audit log',
      'server-side input moderation',
      'daily disk backups',
      'authenticated user rate limits',
      'production HTTPS redirect',
      'production CSP upgrade-insecure-requests'
    ],
    files: {
      catalogBytes: fs.existsSync(catalogPath) ? fs.statSync(catalogPath).size : 0,
      generatorsBytes: fs.existsSync(generatorPath) ? fs.statSync(generatorPath).size : 0
    }
  }, null, 2);
}

function safePath(urlPath) {
  let clean = '/';
  try {
    clean = decodeURIComponent(String(urlPath || '/').split('?')[0]).replace(/\\/g, '/');
  } catch {
    return null;
  }
  const target = clean === '/' ? 'index.html' : clean.replace(/^\/+/, '');
  const full = path.resolve(ROOT, target);
  const rel = path.relative(ROOT, full);
  if (rel.startsWith('..') || path.isAbsolute(rel)) return null;
  return full;
}

function enforceHttps(req, res) {
  if (process.env.NODE_ENV !== 'production') return false;
  const proto = String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim();
  if (!proto || proto === 'https') return false;
  const host = req.headers.host || '';
  send(res, 308, { Location: `https://${host}${req.url || '/'}` }, '');
  return true;
}

function isPublicStaticAsset(routePath = '') {
  const route = String(routePath || '').toLowerCase();
  return route.startsWith('/app/')
    || route.startsWith('/data/')
    || route.startsWith('/vendor/')
    || route.startsWith('/public-source/')
    || route === '/favicon.ico'
    || route === '/orders.html'
    || route === '/pedidos.html'
    || route === '/castor.html'
    || route === '/juego-castor.html'
    || route === '/blind-spot-shell.html'
    || route === '/blindspot.html'
    || route === '/blind-spot-sw.js'
    || route === '/phone-os-sw.js';
}

const server = http.createServer((req, res) => {
  if (enforceHttps(req, res)) return;
  if (!rateLimit(req, res)) return;
  const routePath = (req.url || '').split('?')[0];

  if (routePath.startsWith('/api/private-entry/')) {
    handlePrivateEntry(req, res);
    return;
  }

  if (routePath === '/api/device-sync') {
    handleDeviceSync(req, res).catch(err => {
      audit('device_sync.request_failed', { error: safeText(err.message, 160), ip: clientIp(req) });
      if (!res.headersSent) send(res, 500, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: 'device_sync_request_failed' }));
    });
    return;
  }

  if (routePath === '/private-entry') {
    send(res, 200, { 'Content-Type': MIME['.html'] }, privateEntryPage());
    return;
  }

  if (!getPrivateEntrySession(req) && !isPublicStaticAsset(routePath)) {
    if (routePath.startsWith('/api/')) {
      send(res, 403, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: 'private_entry_required' }));
      return;
    }
    send(res, 302, { Location: '/private-entry' }, '');
    return;
  }

  if (routePath.startsWith('/api/platform-gate/')) {
    handlePlatformGate(req, res);
    return;
  }

  if (LEGACY_PLATFORM_GATE && routePath.startsWith('/api/') && !getPlatformGateSession(req)) {
    send(res, 403, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: 'platform_gate_required' }));
    return;
  }

  if (routePath.startsWith('/api/auth/') || routePath.startsWith('/api/admin/') || routePath.startsWith('/api/access/')) {
    handleAuth(req, res);
    return;
  }

  if (routePath.startsWith('/api/security-king/')) {
    handleSecurityKing(req, res);
    return;
  }

  if (routePath.startsWith('/api/billing-contract/')) {
    handleBillingContract(req, res);
    return;
  }

  if (routePath === '/api/assist-requests') {
    handleAssistRequests(req, res);
    return;
  }

  if (routePath === '/api/code-wallet') {
    handleCodeWallet(req, res).catch(err => {
      audit('wallet.request_failed', { error: safeText(err.message, 160), ip: clientIp(req) });
      if (!res.headersSent) send(res, 500, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: 'wallet_request_failed' }));
    });
    return;
  }

  if (routePath === '/api/code-registry') {
    handleCodeRegistry(req, res).catch(err => {
      audit('code_registry.request_failed', { error: safeText(err.message, 160), ip: clientIp(req) });
      if (!res.headersSent) send(res, 500, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: 'code_registry_request_failed' }));
    });
    return;
  }

  if (routePath === '/api/brand-evidence') {
    handleBrandEvidence(req, res).catch(err => {
      audit('brand_evidence.request_failed', { error: safeText(err.message, 160), ip: clientIp(req) });
      if (!res.headersSent) send(res, 500, { 'Content-Type': MIME['.json'] }, JSON.stringify({ ok: false, error: 'brand_evidence_request_failed' }));
    });
    return;
  }

  if (routePath === '/api/sms/send') {
    handleSmsSend(req, res);
    return;
  }

  if (routePath.startsWith('/api/sms-gateway/')) {
    handleSmsGateway(req, res);
    return;
  }

  if (routePath.startsWith('/api/phone-os/')) {
    handlePhoneOs(req, res);
    return;
  }

  if (routePath === '/api/cli-console') {
    handleCliConsole(req, res);
    return;
  }

  if (routePath === '/api/crypto-ai/chat') {
    handleCryptoAiChat(req, res);
    return;
  }

  if (routePath === '/api/translate/es-en') {
    handleTranslateEsEn(req, res);
    return;
  }

  if (routePath === '/enterprise/manifest.json') {
    send(res, 200, { 'Content-Type': MIME['.json'] }, enterpriseManifest());
    return;
  }

  const filePath = safePath(req.url || '/');
  if (!filePath) {
    send(res, 403, { 'Content-Type': 'text/plain; charset=utf-8' }, 'Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      fs.readFile(path.join(ROOT, 'index.html'), (fallbackErr, fallback) => {
        if (fallbackErr) {
          send(res, 404, { 'Content-Type': 'text/plain; charset=utf-8' }, 'Not found');
          return;
        }
        sendStatic(req, res, path.join(ROOT, 'index.html'), '.html', fallback, 'no-cache');
      });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const cacheControl = ext === '.html'
      ? 'no-cache'
      : 'public, max-age=300, stale-while-revalidate=86400';
    sendStatic(req, res, filePath, ext, data, cacheControl);
  });
});

async function startServer() {
  server.listen(PORT, HOST, () => {
    console.log('----------------------------------------');
    console.log(' Hashcod servidor iniciado');
    console.log(` URL: http://${HOST}:${PORT}`);
    console.log(' Auth storage: encrypted file cache; Render PostgreSQL connecting in background');
    console.log(' Para cerrar: Ctrl + C');
    console.log('----------------------------------------');
  });

  try {
    await initRenderDatabase();
    await bootstrapAuthDbFromRender();
    console.log(' Hashcod Render PostgreSQL conectado');
  } catch (err) {
    audit('db.render.start_failed', { error: safeText(err.message, 160) });
    console.warn('[Hashcod] Render database unavailable, using encrypted file cache:', err.message);
  }
}

startServer();
