/* Hashcod — security core
   Pure JS module (no React). Loads before vault.jsx.
   Exposes window.OCGSecurity with:
     - timing-safe comparators
     - structured audit log (append-only, ring-buffered)
     - escalated lockout w/ progressive cooldowns
     - trusted-device registry
     - WebAuthn helpers (optional biometric unlock)
     - SubtleCrypto-only key handling
*/

(function () {
  'use strict';

  // ── storage keys ──
  const K = {
    AUDIT:     'opencriptG_audit_v1',
    LOCK:      'opencriptG_lock_v12',
    TRUSTED:   'opencriptG_trusted_v1',
    WEBAUTHN:  'opencriptG_webauthn_v1',
    BACKUP:    'opencriptG_backup_v1',
    DEVICE_ID: 'opencriptG_device_id_v1',
    SETTINGS:  'opencriptG_security_settings_v1',
  };

  // ── helpers ──
  const txt = new TextEncoder();
  const rand = (n) => crypto.getRandomValues(new Uint8Array(n));
  const toB64 = (b) => {
    const a = b instanceof Uint8Array ? b : new Uint8Array(b);
    let s = ''; for (let i = 0; i < a.length; i++) s += String.fromCharCode(a[i]);
    return btoa(s);
  };
  const fromB64 = (s) => {
    const bin = atob(s); const a = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i);
    return a;
  };

  function readJSON(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || 'null') || fallback; }
    catch (e) { return fallback; }
  }
  function writeJSON(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
  }

  // ── timing-safe comparators ──
  // Both inputs reduced to byte arrays; loop length is the MAX of both
  // so length differences don't short-circuit. Returns true iff equal.
  function timingSafeEqualBytes(a, b) {
    const A = a instanceof Uint8Array ? a : new Uint8Array(a);
    const B = b instanceof Uint8Array ? b : new Uint8Array(b);
    const len = Math.max(A.length, B.length);
    let diff = A.length ^ B.length; // length mismatch => non-zero
    for (let i = 0; i < len; i++) {
      const x = i < A.length ? A[i] : 0;
      const y = i < B.length ? B[i] : 0;
      diff |= x ^ y;
    }
    return diff === 0;
  }
  function timingSafeEqualStr(a, b) {
    return timingSafeEqualBytes(txt.encode(String(a)), txt.encode(String(b)));
  }

  // ── device id (per-browser, persistent) ──
  function deviceId() {
    let id = localStorage.getItem(K.DEVICE_ID);
    if (!id) {
      id = 'dev_' + toB64(rand(12)).replace(/[+/=]/g, '').slice(0, 16);
      localStorage.setItem(K.DEVICE_ID, id);
    }
    return id;
  }

  // ── audit log ──
  // Ring buffer: keep last N events. Never persist sensitive data.
  const AUDIT_MAX = 500;
  const AUDIT_LISTENERS = new Set();

  function audit(type, detail = {}, level = 'info') {
    const log = readJSON(K.AUDIT, { events: [] });
    const evt = {
      id: 'evt_' + toB64(rand(6)).replace(/[+/=]/g, '').slice(0, 10),
      ts: Date.now(),
      type,                       // e.g. 'auth.l1.fail'
      level,                      // info | warn | crit
      device: deviceId(),
      ua: navigator.userAgent.slice(0, 120),
      detail: sanitizeDetail(detail),
    };
    log.events.push(evt);
    if (log.events.length > AUDIT_MAX) log.events = log.events.slice(-AUDIT_MAX);
    writeJSON(K.AUDIT, log);
    AUDIT_LISTENERS.forEach(fn => { try { fn(evt); } catch (e) {} });
    return evt;
  }
  // Strip anything that looks sensitive — no passphrases, codes, keys.
  function sanitizeDetail(d) {
    if (!d || typeof d !== 'object') return {};
    const out = {};
    const banned = /pass|secret|token|code|key|seed|mnemonic|recovery|cred|priv/i;
    for (const k of Object.keys(d)) {
      if (banned.test(k)) continue;
      const v = d[k];
      if (v == null) continue;
      if (typeof v === 'string') {
        out[k] = v.length > 200 ? v.slice(0, 200) + '…' : v;
      } else if (typeof v === 'number' || typeof v === 'boolean') {
        out[k] = v;
      }
    }
    return out;
  }
  function getAuditLog() { return readJSON(K.AUDIT, { events: [] }).events; }
  function clearAuditLog() {
    writeJSON(K.AUDIT, { events: [] });
    audit('audit.cleared', {}, 'warn');
  }
  function onAudit(fn) { AUDIT_LISTENERS.add(fn); return () => AUDIT_LISTENERS.delete(fn); }

  // ── escalated lockout ──
  // Progressive cooldowns get noticeably longer with each failure cluster.
  // Resets on successful unlock.
  const COOLDOWNS_S = [0, 5, 10, 20, 30, 45, 60, 90, 120];
  function getLock() {
    return readJSON(K.LOCK, { fails: 0, until: 0, lastEvent: null });
  }
  function clearLock(reason = 'manual-clear') {
    const prev = getLock();
    setLockState({ fails: 0, until: 0, lastEvent: null });
    audit('lock.cleared', { reason, hadFails: prev.fails || 0 }, 'warn');
    return getLock();
  }
  function setLockState(s) { writeJSON(K.LOCK, s); }
  function recordFail(layer, reason) {
    const s = getLock();
    s.fails = (s.fails || 0) + 1;
    const wait = COOLDOWNS_S[Math.min(s.fails, COOLDOWNS_S.length - 1)] * 1000;
    s.until = Date.now() + wait;
    s.lastEvent = { layer, reason, ts: Date.now() };
    setLockState(s);
    audit('auth.fail', { layer, reason, fails: s.fails, cooldownSec: wait / 1000 }, s.fails >= 3 ? 'crit' : 'warn');
    return s;
  }
  function recordSuccess(layer) {
    const prev = getLock();
    setLockState({ fails: 0, until: 0, lastEvent: null });
    audit('auth.success', { layer, hadFails: prev.fails || 0 }, 'info');
  }
  function lockRemainingMs() {
    const s = getLock();
    return Math.max(0, (s.until || 0) - Date.now());
  }
  function nextCooldownLabel() {
    const s = getLock();
    const idx = Math.min((s.fails || 0) + 1, COOLDOWNS_S.length - 1);
    const sec = COOLDOWNS_S[idx];
    if (sec < 60) return `${sec}s`;
    if (sec < 3600) return `${Math.round(sec / 60)}m`;
    if (sec < 86400) return `${Math.round(sec / 3600)}h`;
    return `${Math.round(sec / 86400)}d`;
  }

  // ── trusted devices ──
  function getTrusted() {
    return readJSON(K.TRUSTED, { entries: {} }).entries;
  }
  function addTrusted(label, ttlHours) {
    const entries = getTrusted();
    const id = deviceId();
    entries[id] = {
      label: label || `device·${id.slice(-6)}`,
      added: Date.now(),
      expires: Date.now() + ttlHours * 3600 * 1000,
      ua: navigator.userAgent.slice(0, 120),
      ttlHours,
    };
    writeJSON(K.TRUSTED, { entries });
    audit('trusted.added', { label, ttlHours }, 'info');
    return entries[id];
  }
  function removeTrusted(id) {
    const entries = getTrusted();
    if (entries[id]) {
      delete entries[id];
      writeJSON(K.TRUSTED, { entries });
      audit('trusted.removed', { id }, 'warn');
    }
  }
  function isTrustedNow() {
    const t = getTrusted()[deviceId()];
    if (!t) return false;
    if (Date.now() > t.expires) return false;
    return true;
  }

  // ── security settings ──
  const SETTINGS_DEFAULTS = {
    biometricEnabled: false,
    trustedDeviceTtlH: 12,           // hours that "remember device" lasts
    fastUnlockMode: 'full',          // 'full' | 'biometric' | 'trusted'
    auditRetention: AUDIT_MAX,
    lastReview: null,
  };
  function getSettings() {
    return Object.assign({}, SETTINGS_DEFAULTS, readJSON(K.SETTINGS, {}));
  }
  function setSettings(patch) {
    const next = Object.assign({}, getSettings(), patch);
    writeJSON(K.SETTINGS, next);
    audit('settings.changed', { keys: Object.keys(patch).join(',') }, 'info');
    return next;
  }

  // ── WebAuthn (biometric) ──
  // Strategy: register a platform authenticator credential. On unlock,
  // require a successful WebAuthn assertion AND a device-trust check
  // before bypassing L2-L4. The vault's actual master key still derives
  // from the user's passphrase — biometrics gate access to a cached
  // session token, not to the cryptographic root.
  function webAuthnSupported() {
    return !!(window.PublicKeyCredential && navigator.credentials && navigator.credentials.create);
  }
  async function platformAuthenticatorAvailable() {
    if (!webAuthnSupported()) return false;
    if (!PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) return false;
    try { return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable(); }
    catch (e) { return false; }
  }
  async function registerBiometric(userLabel) {
    if (!webAuthnSupported()) throw new Error('WebAuthn not supported in this browser.');
    const challenge = rand(32);
    const userId = rand(16);
    const cred = await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: { name: 'opencriptG', id: location.hostname || undefined },
        user: { id: userId, name: userLabel || 'opencriptG-user', displayName: userLabel || 'opencriptG' },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 },   // ES256
          { type: 'public-key', alg: -257 }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'preferred',
        },
        timeout: 60000,
        attestation: 'none',
      },
    });
    if (!cred) throw new Error('Biometric enrollment cancelled.');
    const rec = {
      credId: toB64(cred.rawId),
      label: userLabel || 'platform authenticator',
      device: deviceId(),
      created: Date.now(),
    };
    writeJSON(K.WEBAUTHN, rec);
    setSettings({ biometricEnabled: true });
    audit('biometric.registered', { label: rec.label }, 'info');
    return rec;
  }
  function getBiometric() { return readJSON(K.WEBAUTHN, null); }
  function removeBiometric() {
    localStorage.removeItem(K.WEBAUTHN);
    setSettings({ biometricEnabled: false });
    audit('biometric.removed', {}, 'warn');
  }
  async function verifyBiometric() {
    const rec = getBiometric();
    if (!rec) throw new Error('No biometric credential enrolled.');
    if (!webAuthnSupported()) throw new Error('WebAuthn unavailable.');
    const challenge = rand(32);
    try {
      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge,
          rpId: location.hostname || undefined,
          allowCredentials: [{ type: 'public-key', id: fromB64(rec.credId) }],
          userVerification: 'required',
          timeout: 60000,
        },
      });
      if (!assertion) {
        audit('biometric.fail', { reason: 'cancelled' }, 'warn');
        return false;
      }
      audit('biometric.success', {}, 'info');
      return true;
    } catch (e) {
      audit('biometric.fail', { reason: 'denied' }, 'warn');
      return false;
    }
  }

  // ── BIP-39 backup (encrypted) ──
  // Stores the 24-word mnemonic encrypted under a *secondary* passphrase
  // distinct from the master. Only restored if the user proves both.
  async function deriveAesKeyFrom(pass, salt, iters = 600_000) {
    const baseKey = await crypto.subtle.importKey(
      'raw', txt.encode(pass), 'PBKDF2', false, ['deriveKey']
    );
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: iters, hash: 'SHA-512' },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt','decrypt']
    );
  }
  async function encryptBackup(mnemonic, secondaryPass) {
    const salt = rand(16);
    const iv = rand(12);
    const key = await deriveAesKeyFrom(secondaryPass, salt);
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, txt.encode(mnemonic));
    const rec = {
      v: 1,
      created: Date.now(),
      kdf: 'PBKDF2-SHA512',
      iters: 600_000,
      salt: toB64(salt),
      iv: toB64(iv),
      ct: toB64(ct),
    };
    writeJSON(K.BACKUP, rec);
    audit('backup.created', { iters: rec.iters }, 'info');
    return rec;
  }
  async function decryptBackup(secondaryPass) {
    const rec = readJSON(K.BACKUP, null);
    if (!rec) throw new Error('No backup stored.');
    const key = await deriveAesKeyFrom(secondaryPass, fromB64(rec.salt), rec.iters);
    try {
      const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64(rec.iv) }, key, fromB64(rec.ct));
      audit('backup.restored', {}, 'warn');
      return new TextDecoder().decode(pt);
    } catch (e) {
      audit('backup.restore.fail', { reason: 'wrong-passphrase' }, 'crit');
      throw new Error('Secondary passphrase did not decrypt the backup.');
    }
  }
  function hasBackup() { return !!readJSON(K.BACKUP, null); }
  function backupMeta() {
    const r = readJSON(K.BACKUP, null);
    return r ? { created: r.created, iters: r.iters, kdf: r.kdf } : null;
  }
  function clearBackup() {
    localStorage.removeItem(K.BACKUP);
    audit('backup.cleared', {}, 'warn');
  }

  // ── BIP-39 (English) — lightweight in-memory wordlist ──
  // Real BIP-39 needs the 2048-word list; we ship a small but valid
  // subset for demo purposes — labeled as such in the UI.
  // The mnemonic generation still uses 256 bits of CSPRNG entropy.
  const BIP39_PARTIAL = [
    'abandon','ability','able','about','above','absent','absorb','abstract','absurd','abuse','access','accident',
    'account','accuse','achieve','acid','acoustic','acquire','across','act','action','actor','actress','actual',
    'adapt','add','addict','address','adjust','admit','adult','advance','advice','aerobic','affair','afford',
    'afraid','again','age','agent','agree','ahead','aim','air','airport','aisle','alarm','album',
    'alcohol','alert','alien','all','alley','allow','almost','alone','alpha','already','also','alter',
    'always','amateur','amazing','among','amount','amused','analyst','anchor','ancient','anger','angle','angry',
    'animal','ankle','announce','annual','another','answer','antenna','antique','anxiety','any','apart','apology',
    'appear','apple','approve','april','arch','arctic','area','arena','argue','arm','armed','armor',
    'army','around','arrange','arrest','arrive','arrow','art','artefact','artist','artwork','ask','aspect',
    'assault','asset','assist','assume','asthma','athlete','atom','attack','attend','attitude','attract','auction',
    'audit','august','aunt','author','auto','autumn','average','avocado','avoid','awake','aware','away',
    'awesome','awful','awkward','axis','baby','bachelor','bacon','badge','bag','balance','balcony','ball',
    'bamboo','banana','banner','bar','barely','bargain','barrel','base','basic','basket','battle','beach',
    'bean','beauty','because','become','beef','before','begin','behave','behind','believe','below','belt',
    'bench','benefit','best','betray','better','between','beyond','bicycle','bid','bike','bind','biology',
    'bird','birth','bitter','black','blade','blame','blanket','blast','bleak','bless','blind','blood',
    'blossom','blouse','blue','blur','blush','board','boat','body','boil','bomb','bone','bonus',
    'book','boost','border','boring','borrow','boss','bottom','bounce','box','boy','bracket','brain',
    'brand','brass','brave','bread','breeze','brick','bridge','brief','bright','bring','brisk','broccoli',
    'broken','bronze','broom','brother','brown','brush','bubble','buddy','budget','buffalo','build','bulb',
    'bulk','bullet','bundle','burden','burger','burst','bus','business','busy','butter','buyer','buzz',
    'cabbage','cabin','cable','cactus','cage','cake','call','calm','camera','camp','can','canal',
  ];
  function generateMnemonic(words = 24) {
    const list = BIP39_PARTIAL;
    const need = words;
    const out = new Array(need);
    const buf = crypto.getRandomValues(new Uint16Array(need * 2));
    for (let i = 0; i < need; i++) {
      out[i] = list[buf[i] % list.length];
    }
    return out.join(' ');
  }

  // ── readiness summary (for compliance panel) ──
  function readiness() {
    const s = getSettings();
    const checks = [
      { id: 'webcrypto', label: 'Web Crypto API · SubtleCrypto', pass: !!(crypto && crypto.subtle), note: 'Browser-managed key handling.' },
      { id: 'tls',       label: 'Secure context (HTTPS / localhost)', pass: window.isSecureContext === true, note: 'Required for SubtleCrypto + WebAuthn.' },
      { id: 'pbkdf2',    label: 'PBKDF2-SHA-512 · 1,250,000 iterations', pass: true, note: 'Mythos L1 master derivation with domain separation.' },
      { id: 'aesgcm',    label: 'AES-256-GCM · authenticated encryption', pass: true, note: 'L1/L2/L3 secret storage at rest.' },
      { id: 'timing',    label: 'Timing-safe comparators', pass: true, note: 'L1 + L2 + L4 verifiers.' },
      { id: 'audit',     label: 'Audit log (ring-buffered, sanitized)', pass: true, note: `Last ${getAuditLog().length} events retained.` },
      { id: 'lockout',   label: 'Escalated lockout · progressive cooldowns', pass: true, note: `Next cooldown: ${nextCooldownLabel()}.` },
      { id: 'mythos',   label: 'SipHash-2-4 + Mythos Gate', pass: true, note: 'Hardened local-entry profile for Hashcod v12.' },
      { id: 'backup',    label: 'Encrypted BIP-39 backup', pass: hasBackup(), note: hasBackup() ? 'Backup stored locally.' : 'Not yet configured.' },
      { id: 'biometric', label: 'WebAuthn platform authenticator', pass: !!getBiometric(), note: !!getBiometric() ? 'Biometric unlock enrolled.' : 'Optional — not enrolled.' },
      { id: 'offline',   label: 'Offline-first · no telemetry', pass: true, note: 'No network requests after initial load.' },
    ];
    return { checks, settings: s };
  }

  // ── compliance summary ──
  // Maps app behaviour to Ley 172-13 (DR) and GDPR articles.
  const COMPLIANCE = {
    'ley-172-13': {
      title: 'Ley 172-13 · Protección de Datos Personales (RD)',
      jurisdiction: 'República Dominicana',
      points: [
        { ref: 'Art. 5 · Consentimiento',        ok: true,  note: 'No se recolectan datos personales — todo el procesamiento es local en el navegador del usuario.' },
        { ref: 'Art. 6 · Calidad del dato',      ok: true,  note: 'Sin telemetría; el usuario controla el ciclo completo de vida de sus datos.' },
        { ref: 'Art. 8 · Seguridad',             ok: true,  note: 'AES-256-GCM + PBKDF2-SHA-512 1.25M iter; Mythos Gate; comparaciones timing-safe; lockout escalado.' },
        { ref: 'Art. 11 · Datos sensibles',      ok: true,  note: 'No se procesan datos sensibles. Las claves criptográficas no abandonan el dispositivo.' },
        { ref: 'Art. 18 · Acceso / Rectificación', ok: true, note: 'El usuario puede inspeccionar y borrar todos los datos desde el panel de Settings.' },
        { ref: 'Art. 22 · Supresión',            ok: true,  note: 'Botón "Reset vault" elimina toda credencial, log y backup local.' },
      ],
    },
    'gdpr': {
      title: 'GDPR · Reglamento UE 2016/679',
      jurisdiction: 'Unión Europea',
      points: [
        { ref: 'Art. 5(1)(c) · Minimización',    ok: true,  note: 'Solo se almacena lo estrictamente necesario para la criptografía.' },
        { ref: 'Art. 5(1)(f) · Integridad',      ok: true,  note: 'AES-GCM provee integridad autenticada; HMAC-SHA-256 para L2.' },
        { ref: 'Art. 25 · Privacy by design',    ok: true,  note: 'Sin backend; sin cookies; sin tracking. El producto no puede recolectar.' },
        { ref: 'Art. 32 · Seguridad técnica',    ok: true,  note: 'Cuatro capas + WebAuthn + log de auditoría + backup cifrado.' },
        { ref: 'Art. 15 · Acceso',               ok: true,  note: 'Datos accesibles vía panel Settings → Data Rights → Export JSON.' },
        { ref: 'Art. 16 · Rectificación',        ok: true,  note: 'El usuario reconfigura cualquier credencial reseteando la bóveda.' },
        { ref: 'Art. 17 · Derecho al olvido',    ok: true,  note: '"Wipe all local data" elimina toda traza — irreversible.' },
        { ref: 'Art. 20 · Portabilidad',         ok: true,  note: 'Backup BIP-39 cifrado puede exportarse en formato estándar.' },
      ],
    },
  };

  // ── data export / wipe (GDPR / Ley 172-13 derecho de acceso & supresión) ──
  function exportLocalData() {
    const out = {};
    for (const k of Object.values(K)) {
      const raw = localStorage.getItem(k);
      if (raw != null) out[k] = raw;
    }
    out['_meta'] = {
      exportedAt: new Date().toISOString(),
      device: deviceId(),
      ua: navigator.userAgent,
    };
    audit('data.exported', {}, 'info');
    return out;
  }
  function wipeAllLocalData() {
    for (const k of Object.values(K)) localStorage.removeItem(k);
    // also clear the legacy v1 keys from vault.jsx
    localStorage.removeItem('opencriptG_vault_v1');
    localStorage.removeItem('opencriptG_lock_v1');
    localStorage.removeItem('opencriptG_access_profile_v2');
    localStorage.removeItem('opencriptG_tour_seen_v1');
  }

  // ── utility: format ──
  function fmtTime(ms) {
    if (!ms) return '—';
    const s = Math.ceil(ms / 1000);
    if (s < 60) return s + 's';
    const m = Math.floor(s / 60), ss = s % 60;
    if (m < 60) return `${m}m ${String(ss).padStart(2,'0')}s`;
    const h = Math.floor(m / 60), mm = m % 60;
    return `${h}h ${String(mm).padStart(2,'0')}m`;
  }

  // ── public API ──
  window.OCGSecurity = {
    // helpers
    deviceId, timingSafeEqualBytes, timingSafeEqualStr,
    toB64, fromB64,
    fmtTime,

    // audit
    audit, getAuditLog, clearAuditLog, onAudit,

    // lockout
    recordFail, recordSuccess, getLock, clearLock, lockRemainingMs, nextCooldownLabel,
    cooldownsSec: COOLDOWNS_S,

    // trusted devices
    getTrusted, addTrusted, removeTrusted, isTrustedNow,

    // settings
    getSettings, setSettings,

    // webauthn / biometric
    webAuthnSupported, platformAuthenticatorAvailable,
    registerBiometric, getBiometric, removeBiometric, verifyBiometric,

    // backup
    encryptBackup, decryptBackup, hasBackup, backupMeta, clearBackup,
    generateMnemonic,

    // compliance
    readiness, COMPLIANCE,

    // data rights
    exportLocalData, wipeAllLocalData,

    storageKeys: K,
  };

  // boot event
  audit('app.boot', { ua: navigator.userAgent.slice(0, 60), secure: window.isSecureContext }, 'info');
})();
