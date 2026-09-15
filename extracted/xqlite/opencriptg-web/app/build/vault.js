(function () {
const {
  useState,
  useRef,
  useEffect
} = React;
const ACCESS_PROFILE_KEY = 'opencriptG_access_profile_v2';
const ACCESS_LOG_FORMAT = 'OPENCRIPTG-ENTERPRISE-ACCESS-LOG';
const ACCESS_LOG_VERSION = 2;
const ACCESS_KDF_ITERATIONS = 450000;
const SIPHASH_GATE_CODE = '5f202c27a52e8211';
const txt = new TextEncoder();
function bytesToHex(bytes) {
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}
function hexToBytes(hex) {
  const clean = String(hex || '').replace(/[^0-9a-f]/gi, '');
  if (!clean || clean.length % 2) throw new Error('Invalid hex key.');
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  return out;
}
function randHex(bytes) {
  return bytesToHex(crypto.getRandomValues(new Uint8Array(bytes))).toUpperCase();
}
async function sha256Hex(value) {
  const buf = await crypto.subtle.digest('SHA-256', txt.encode(String(value)));
  return bytesToHex(new Uint8Array(buf));
}
async function hmacHex(hexKey, value) {
  const key = await crypto.subtle.importKey('raw', hexToBytes(hexKey), {
    name: 'HMAC',
    hash: 'SHA-256'
  }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, txt.encode(String(value)));
  return bytesToHex(new Uint8Array(sig));
}
function timingSafeStr(a, b) {
  if (window.OCGSecurity?.timingSafeEqualStr) return window.OCGSecurity.timingSafeEqualStr(String(a), String(b));
  const A = txt.encode(String(a));
  const B = txt.encode(String(b));
  const len = Math.max(A.length, B.length);
  let diff = A.length ^ B.length;
  for (let i = 0; i < len; i++) diff |= (A[i] || 0) ^ (B[i] || 0);
  return diff === 0;
}
const SipHashGate = ({
  onUnlock
}) => {
  const [value, setValue] = useState('');
  const [status, setStatus] = useState('');
  const [fails, setFails] = useState(0);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const inputRef = useRef(null);
  useEffect(() => {
    inputRef.current?.focus();
    const id = setInterval(() => setCooldownUntil(prev => prev && prev <= Date.now() ? 0 : prev), 500);
    return () => clearInterval(id);
  }, []);
  const remaining = Math.max(0, cooldownUntil - Date.now());
  const locked = remaining > 0;
  const normalized = String(value || '').replace(/[^0-9a-f]/gi, '').toLowerCase().slice(0, 16);
  const submit = event => {
    event?.preventDefault?.();
    if (locked) return;
    if (timingSafeStr(normalized, SIPHASH_GATE_CODE)) {
      sessionStorage.setItem('ocg_v12_siphash_gate', '1');
      setStatus('Access verified. Opening Hashcod v12...');
      setTimeout(() => onUnlock && onUnlock(), 180);
      return;
    }
    const nextFails = fails + 1;
    setFails(nextFails);
    setValue('');
    setStatus('Access code rejected. Check the private key and try again.');
    if (nextFails >= 3) {
      setCooldownUntil(Date.now() + Math.min(30000, 4000 * (nextFails - 2)));
    }
  };
  return React.createElement("main", {
    className: "siphash-gate"
  }, React.createElement("section", {
    className: "siphash-card"
  }, React.createElement("div", {
    className: "siphash-brand"
  }, React.createElement("div", {
    className: "siphash-mark"
  }, React.createElement("img", {
    src: "app/hashcod-platform-icon.svg?v=hashcod-classic-1",
    alt: ""
  })), React.createElement("div", null, React.createElement("p", null, "Hashcod v12"), React.createElement("h1", null, "Private Access"), React.createElement("small", null, "Enterprise cryptographic workspace"))), React.createElement("form", {
    onSubmit: submit,
    className: "siphash-form"
  }, React.createElement("label", null, React.createElement("span", null, "SECURE ACCESS KEY"), React.createElement("input", {
    ref: inputRef,
    type: "password",
    inputMode: "text",
    value: value,
    onChange: e => setValue(e.target.value),
    placeholder: "Enter private access key",
    autoComplete: "new-password",
    spellCheck: "false",
    disabled: locked
  })), React.createElement("button", {
    type: "submit",
    disabled: locked || normalized.length !== 16
  }, locked ? `WAIT ${Math.ceil(remaining / 1000)}S` : 'UNLOCK V12')), React.createElement("div", {
    className: "siphash-meta"
  }, React.createElement("div", null, React.createElement("span", null, "Protection"), React.createElement("b", null, "SipHash-2-4 gate")), React.createElement("div", null, React.createElement("span", null, "Access scope"), React.createElement("b", null, "Private v12 session")), React.createElement("div", null, React.createElement("span", null, "Workspace"), React.createElement("b", null, "Hashcod cryptographic lab"))), React.createElement("p", {
    className: `siphash-status ${status ? 'is-visible' : ''}`
  }, status || 'Enter your private access key to continue into Hashcod v12.')));
};
async function deriveVerifier(log, salt) {
  const keyMaterial = [ACCESS_LOG_FORMAT, log.keys?.aes256, log.keys?.sm4, log.keys?.serpent, log.issueId, salt].join('|');
  const base = await crypto.subtle.importKey('raw', txt.encode(keyMaterial), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({
    name: 'PBKDF2',
    salt: txt.encode(salt),
    iterations: ACCESS_KDF_ITERATIONS,
    hash: 'SHA-512'
  }, base, 256);
  return bytesToHex(new Uint8Array(bits));
}
function canonicalPayload(log) {
  return [log.format, log.version, log.issueId, log.createdAt, log.expiresAt, log.keys?.aes256, log.keys?.sm4, log.keys?.serpent].join('|');
}
function validateKeyShape(log) {
  if (!log || log.format !== ACCESS_LOG_FORMAT || log.version !== ACCESS_LOG_VERSION) throw new Error('This is not a valid Hashcod access log.');
  if (!/^[0-9A-F]{64}$/.test(log.keys?.aes256 || '')) throw new Error('AES-256 key is missing or invalid.');
  if (!/^[0-9A-F]{32}$/.test(log.keys?.sm4 || '')) throw new Error('SM4 key is missing or invalid.');
  if (!/^[0-9A-F]{64}$/.test(log.keys?.serpent || '')) throw new Error('Serpent key is missing or invalid.');
  if (!log.signature || !/^[0-9a-f]{64}$/i.test(log.signature)) throw new Error('Log signature is missing.');
  if (Date.now() > Date.parse(log.expiresAt)) throw new Error('This access-key log has expired.');
}
async function validateLog(log) {
  validateKeyShape(log);
  const expected = await hmacHex(log.keys.aes256, canonicalPayload(log));
  if (!timingSafeStr(expected, log.signature)) throw new Error('Access-key log signature does not match.');
  return true;
}
async function readAccessLogFile(file) {
  if (!file) throw new Error('Upload the access-key log file.');
  const raw = await file.text();
  const jsonStart = raw.indexOf('{');
  const body = jsonStart >= 0 ? raw.slice(jsonStart) : raw;
  const log = JSON.parse(body);
  await validateLog(log);
  return log;
}
function saveFile(name, text) {
  const blob = new Blob([text], {
    type: 'application/json;charset=utf-8'
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function readProfile() {
  try {
    return JSON.parse(localStorage.getItem(ACCESS_PROFILE_KEY) || 'null');
  } catch {
    return null;
  }
}
function writeProfile(profile) {
  localStorage.setItem(ACCESS_PROFILE_KEY, JSON.stringify(profile));
}
function AccessKeyRow({
  label,
  value,
  bits
}) {
  return React.createElement("div", {
    className: "access-keyrow"
  }, React.createElement("div", null, React.createElement("span", null, label), React.createElement("em", null, bits)), React.createElement("code", null, value || 'pending'));
}
const VaultLock = ({
  onUnlock
}) => {
  const [mode, setMode] = useState(() => readProfile() ? 'signin' : 'issue');
  const [profile, setProfile] = useState(() => readProfile());
  const [issuedLog, setIssuedLog] = useState(null);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const fileRef = useRef(null);
  useEffect(() => {
    const id = setInterval(() => {
      const ms = window.OCGSecurity?.lockRemainingMs?.() || 0;
      setCooldown(ms);
    }, 500);
    return () => clearInterval(id);
  }, []);
  const hasProfile = !!profile;
  const lockLabel = cooldown ? window.OCGSecurity?.fmtTime?.(cooldown) || `${Math.ceil(cooldown / 1000)}s` : '';
  const generateLog = async () => {
    setBusy(true);
    setStatus('');
    try {
      const createdAt = new Date().toISOString();
      const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString();
      const log = {
        format: ACCESS_LOG_FORMAT,
        version: ACCESS_LOG_VERSION,
        issueId: 'ocg-access-' + randHex(10),
        createdAt,
        expiresAt,
        requiredAction: 'Upload this file in Register, then use it to Sign In.',
        warning: 'Keep this log private. Anyone with this file can access this local Hashcod vault.',
        keys: {
          aes256: randHex(32),
          sm4: randHex(16),
          serpent: randHex(32)
        }
      };
      log.fingerprint = await sha256Hex(canonicalPayload(log));
      log.signature = await hmacHex(log.keys.aes256, canonicalPayload(log));
      setIssuedLog(log);
      setStatus('Download the access-key log file');
      window.OCGSecurity?.audit?.('access.log.issued', {
        format: log.format
      }, 'warn');
    } catch (err) {
      setStatus(err.message || 'Could not generate the access log.');
    } finally {
      setBusy(false);
    }
  };
  const downloadLog = () => {
    if (!issuedLog) return;
    const text = JSON.stringify(issuedLog, null, 2);
    saveFile(`Hashcod-access-log-${issuedLog.issueId}.json`, text);
    setStatus('Access-key log downloaded. Upload it in Register to activate the vault.');
  };
  const registerFromLog = async () => {
    if (busy || cooldown) return;
    setBusy(true);
    setStatus('');
    try {
      const log = await readAccessLogFile(fileRef.current?.files?.[0]);
      const salt = randHex(24);
      const verifier = await deriveVerifier(log, salt);
      const publicFp = await sha256Hex(log.fingerprint + '|' + log.issueId);
      const next = {
        format: 'OPENCRIPTG-ACCESS-PROFILE',
        version: 2,
        createdAt: new Date().toISOString(),
        issueId: log.issueId,
        expiresAt: log.expiresAt,
        salt,
        kdf: `PBKDF2-SHA512:${ACCESS_KDF_ITERATIONS}`,
        verifier,
        publicFp
      };
      writeProfile(next);
      setProfile(next);
      setMode('signin');
      setStatus('Registration complete. Sign in with the same access-key log.');
      window.OCGSecurity?.recordSuccess?.('access-register');
    } catch (err) {
      window.OCGSecurity?.recordFail?.('access-register', 'invalid-log');
      setStatus(err.message || 'Registration failed.');
    } finally {
      setBusy(false);
    }
  };
  const signInFromLog = async () => {
    if (busy || cooldown) return;
    setBusy(true);
    setStatus('');
    try {
      const current = readProfile();
      if (!current) throw new Error('No registered access profile. Generate and register a log first.');
      const log = await readAccessLogFile(fileRef.current?.files?.[0]);
      const verifier = await deriveVerifier(log, current.salt);
      const publicFp = await sha256Hex(log.fingerprint + '|' + log.issueId);
      if (!timingSafeStr(verifier, current.verifier) || !timingSafeStr(publicFp, current.publicFp)) {
        throw new Error('Access-key log does not match this vault.');
      }
      window.OCGSecurity?.recordSuccess?.('access-signin');
      onUnlock();
    } catch (err) {
      window.OCGSecurity?.recordFail?.('access-signin', 'invalid-log');
      setStatus(err.message || 'Sign in failed.');
    } finally {
      setBusy(false);
    }
  };
  const resetLocalProfile = () => {
    if (!confirm('Reset local access profile? You will need to register a valid log again.')) return;
    localStorage.removeItem(ACCESS_PROFILE_KEY);
    setProfile(null);
    setMode('issue');
    setIssuedLog(null);
    setStatus('Local access profile reset.');
    window.OCGSecurity?.audit?.('access.profile.reset', {}, 'warn');
  };
  const fileInput = React.createElement("label", {
    className: "access-upload"
  }, React.createElement("span", null, "Access-key log"), React.createElement("input", {
    ref: fileRef,
    type: "file",
    accept: ".json,.log,application/json,text/plain"
  }));
  return React.createElement("main", {
    className: "access-gate"
  }, React.createElement("section", {
    className: "access-shell"
  }, React.createElement("header", {
    className: "access-head"
  }, React.createElement("div", {
    className: "access-brand"
  }, React.createElement("img", {
    src: "app/hashcod-platform-icon.svg?v=hashcod-classic-1",
    alt: ""
  }), React.createElement("div", null, React.createElement("p", null, "Hashcod enterprise access"), React.createElement("h1", null, mode === 'issue' ? 'Inicio de sesion seguro' : mode === 'register' ? 'Registro con log' : 'Inicio de sesion'))), React.createElement("span", {
    className: `access-state ${hasProfile ? 'is-ready' : ''}`
  }, hasProfile ? 'profile armed' : 'new vault')), React.createElement("nav", {
    className: "access-tabs",
    "aria-label": "access modes"
  }, React.createElement("button", {
    className: mode === 'issue' ? 'is-active' : '',
    onClick: () => setMode('issue')
  }, "Generar claves"), React.createElement("button", {
    className: mode === 'register' ? 'is-active' : '',
    onClick: () => setMode('register')
  }, "Registro"), React.createElement("button", {
    className: mode === 'signin' ? 'is-active' : '',
    onClick: () => setMode('signin')
  }, "Inicio de sesion")), mode === 'issue' && React.createElement("div", {
    className: "access-grid"
  }, React.createElement("section", {
    className: "access-panel"
  }, React.createElement("h2", null, "Emitir llaves de acceso"), React.createElement("p", {
    className: "access-copy"
  }, "Genera AES-256, SM4 y Serpent con CSPRNG del navegador. Despues descarga el log y usalo para registrar la plataforma."), React.createElement("div", {
    className: "access-actions"
  }, React.createElement("button", {
    className: "access-primary",
    onClick: generateLog,
    disabled: busy
  }, busy ? 'Generando...' : 'Generar claves de acceso'), React.createElement("button", {
    className: "access-secondary",
    onClick: downloadLog,
    disabled: !issuedLog
  }, "Descargar en Log")), issuedLog && React.createElement("div", {
    className: "access-alert"
  }, "Download the access-key log file")), React.createElement("section", {
    className: "access-panel access-keys"
  }, React.createElement(AccessKeyRow, {
    label: "AES-256 Key",
    bits: "256-bit",
    value: issuedLog?.keys?.aes256
  }), React.createElement(AccessKeyRow, {
    label: "SM4 Key",
    bits: "128-bit",
    value: issuedLog?.keys?.sm4
  }), React.createElement(AccessKeyRow, {
    label: "Serpent Key",
    bits: "256-bit",
    value: issuedLog?.keys?.serpent
  }))), mode === 'register' && React.createElement("section", {
    className: "access-panel"
  }, React.createElement("h2", null, "Registrar plataforma"), React.createElement("p", {
    className: "access-copy"
  }, "Sube el log descargado. La plataforma valida la firma interna y guarda solo verificadores derivados, no las claves en claro."), fileInput, React.createElement("div", {
    className: "access-actions"
  }, React.createElement("button", {
    className: "access-primary",
    onClick: registerFromLog,
    disabled: busy || cooldown
  }, busy ? 'Verificando...' : 'Registrar con Log'))), mode === 'signin' && React.createElement("section", {
    className: "access-panel"
  }, React.createElement("h2", null, "Acceso privado"), React.createElement("p", {
    className: "access-copy"
  }, "Para entrar, sube el mismo log de claves usado en el registro. Los intentos fallidos activan cooldown progresivo."), fileInput, React.createElement("div", {
    className: "access-actions"
  }, React.createElement("button", {
    className: "access-primary",
    onClick: signInFromLog,
    disabled: busy || cooldown || !hasProfile
  }, busy ? 'Verificando...' : 'Entrar'), React.createElement("button", {
    className: "access-secondary",
    onClick: resetLocalProfile
  }, "Reset perfil local"))), React.createElement("footer", {
    className: "access-foot"
  }, React.createElement("span", null, cooldown ? `Bloqueo temporal: ${lockLabel}` : status || 'WebCrypto, HMAC-SHA256, PBKDF2-SHA512, timing-safe compare.'))));
};
window.VaultLock = VaultLock;
window.SipHashGate = SipHashGate;
})();
