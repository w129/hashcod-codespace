/* opencriptG — generator engines
   All generators return a string. Async where Web Crypto requires it. */

(function() {
  const enc = new TextEncoder();
  const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  const ALPHANUM = ALPHA + '0123456789';
  const SYMBOLS = '!@#$%^&*()-_=+[]{}|;:,.<>?/~';
  const HEX = '0123456789abcdef';
  const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const B32C = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'; // Crockford
  const B58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  const B62 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  const Z85 = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ.-:+=^!/*?&<>()[]{}@%$#';
  const CONS = 'bcdfghjklmnprstvwz';
  const VOW = 'aeiou';
  // Compact passphrase wordlist (subset for size — production would use full 7776/2048)
  const WORDS = ['apple','river','stone','cloud','flame','glass','tiger','horse','ocean','quiet','brave','steel','crown','spark','field','grain','prism','wheat','ember','frost','noble','arrow','quill','plume','raven','aspen','birch','cedar','cobalt','copper','dawn','delta','dune','echo','eagle','ember','feast','fern','flint','forge','gable','gem','glade','grove','hare','hawk','helm','herb','iris','ivory','jade','kite','lark','lattice','lichen','linen','loft','lyric','marble','meadow','mint','moor','mosaic','myth','nest','oak','onyx','opal','orbit','otter','pearl','pine','quartz','quill','reed','rune','sage','salt','sigil','silk','slate','soot','spire','star','stoic','swan','thicket','thorn','tide','timber','torch','trout','vale','velvet','vine','wax','willow','wisp','yarrow'];
  const BIP39 = ['abandon','ability','able','about','above','absent','absorb','abstract','absurd','abuse','access','accident','account','accuse','achieve','acid','acoustic','acquire','across','act','action','actor','actual','adapt','add','addict','address','adjust','admit','adult','advance','advice','aerobic','affair','afford','afraid','again','age','agent','agree','ahead','aim','air','airport','aisle','alarm','album','alcohol','alert','alien','all','alley','allow','almost','alone','alpha','already','also','alter','always','amazing','amount','amused','analyst','anchor','ancient','anger','angle','angry','animal','ankle','announce','annual','answer','antenna','antique','anxiety','any','apart','apology','appear','apple','approve','april','arch','arctic','area','arena','argue','arm','armed','armor','army','around','arrange','arrest','arrive','arrow','art','artist','aspect','assault','asset','assist','assume','asthma','athlete','atom','attack','attend','attitude','attract','auction','audit','august','aunt','author','auto','autumn','average','avoid','awake','aware','away','awesome','awful','awkward','axis','baby','back','bacon','badge','bag','balance','balcony','ball','bamboo','banana','banner','bar','barely','bargain','barrel','base','basic','basket','battle','beach','bean','beauty','because','become','beef','before','begin','behave','behind','believe','below','belt','bench','benefit','best','betray','better','between','beyond','bicycle','bid','bike','bind','biology','bird','birth','bitter','black','blade','blame','blanket','blast','bleak','bless','blind','blood','blossom','blouse','blue','blur','blush','board','boat','body','boil','bomb','bone','bonus','book','boost','border','boring','borrow','boss','bottom','bounce','box','boy','bracket'];
  const EMOJI = '🌀🌁🌂🌃🌄🌅🌆🌇🌈🌉🌊🌋🌌🌍🌎🌏🌐🌑🌒🌓🌔🌕🌖🌗🌘🌙🌚🌛🌜🌝🌞🌟🌠🌡🌤🌥🌦🌧🌨🌩🌪🌫🌬🌭🌮🌯🌰🌱🌲🌳🌴🌵🌶🌷🌸🌹🌺🌻🌼🌽🌾🌿🍀🍁🍂🍃🍄🍅🍆🍇🍈🍉🍊🍋🍌🍍🍎🍏🍐🍑🍒🍓🍔🍕🍖🍗🍘🍙🍚🍛🍜🍝🍞🍟🍠🍡🍢🍣🍤🍥🍦🍧🍨🍩🍪🍫🍬🍭🍮🍯🍰🍱🍲🍳🍴🍵🍶🍷🍸🍹🍺🍻🍼🍽🍾🍿';
  const EMOJI_ARR = [...EMOJI];

  function bytes(n) { const a = new Uint8Array(n); crypto.getRandomValues(a); return a; }
  function rint(max) {
    const limit = Number(max);
    if (!Number.isSafeInteger(limit) || limit <= 0 || limit > 0x100000000) {
      throw new RangeError('Random range must be an integer between 1 and 2^32.');
    }
    const ceiling = Math.floor(0x100000000 / limit) * limit;
    let value;
    do {
      value = crypto.getRandomValues(new Uint32Array(1))[0];
    } while (value >= ceiling);
    return value % limit;
  }
  function pick(s) { return s[rint(s.length)]; }
  function fromAlpha(n, alpha) {
    if (!alpha || !alpha.length) throw new Error('Alphabet cannot be empty.');
    let out = '';
    for (let i = 0; i < n; i++) out += alpha[rint(alpha.length)];
    return out;
  }
  function toHex(b) { return [...b].map(x => x.toString(16).padStart(2,'0')).join(''); }
  function toB64(b) {
    let s = '';
    for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
    return btoa(s);
  }
  function toB64u(b) { return toB64(b).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''); }
  function toB32(b, alpha = B32) {
    let bits = 0, val = 0, out = '';
    for (let i = 0; i < b.length; i++) {
      val = (val << 8) | b[i]; bits += 8;
      while (bits >= 5) { out += alpha[(val >>> (bits - 5)) & 0x1f]; bits -= 5; }
    }
    if (bits) out += alpha[(val << (5 - bits)) & 0x1f];
    return out;
  }
  function toB58(b) {
    let n = 0n; for (const x of b) n = (n << 8n) + BigInt(x);
    let out = '';
    while (n > 0n) { out = B58[Number(n % 58n)] + out; n /= 58n; }
    for (const x of b) { if (x === 0) out = B58[0] + out; else break; }
    return out || B58[0];
  }
  function toB62(b) {
    let n = 0n; for (const x of b) n = (n << 8n) + BigInt(x);
    let out = '';
    while (n > 0n) { out = B62[Number(n % 62n)] + out; n /= 62n; }
    return out || '0';
  }

  async function sha(algo, input) {
    const data = typeof input === 'string' ? enc.encode(input) : input;
    const h = await crypto.subtle.digest(algo, data);
    return new Uint8Array(h);
  }

  async function hmacSha256(secretBytes, message) {
    const key = await crypto.subtle.importKey(
      'raw',
      secretBytes,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const data = typeof message === 'string' ? enc.encode(message) : message;
    return new Uint8Array(await crypto.subtle.sign('HMAC', key, data));
  }

  async function signJwtHS256(payload, secretBytes) {
    const header = { alg: 'HS256', typ: 'JWT', kid: 'ocg-' + toB64u(bytes(6)) };
    const now = Math.floor(Date.now() / 1000);
    const body = Object.assign({
      iss: 'opencriptG',
      aud: 'local-platform',
      sub: 'user_' + toB64u(bytes(9)),
      scope: 'read:tokens write:tokens rotate:keys',
      iat: now,
      nbf: now,
      exp: now + 900,
      jti: uuid7(),
    }, payload || {});
    const head = toB64u(enc.encode(JSON.stringify(header)));
    const pay = toB64u(enc.encode(JSON.stringify(body)));
    const sig = toB64u(await hmacSha256(secretBytes, `${head}.${pay}`));
    return `${head}.${pay}.${sig}`;
  }

  async function pkcePair() {
    const verifier = toB64u(bytes(64)).slice(0, 86);
    const challenge = toB64u(await sha('SHA-256', verifier));
    return `code_verifier=${verifier}\ncode_challenge=${challenge}\nmethod=S256`;
  }

  async function aesGcmTokenEnvelope() {
    const keyBytes = bytes(32);
    const iv = bytes(12);
    const payload = JSON.stringify({
      typ: 'OCG-AEAD-TOKEN',
      sub: 'acct_' + toB64u(bytes(8)),
      scope: ['vault:read', 'qr:issue', 'cert:sign'],
      nonce: toB64u(bytes(16)),
      iat: new Date().toISOString(),
    });
    const key = await crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['encrypt']);
    const aad = enc.encode('opencriptG:v10:token-envelope');
    const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: aad }, key, enc.encode(payload)));
    return [
      'OCG-AEAD-TOKEN.v1',
      `alg=A256GCM`,
      `kid=${toB64u(bytes(8))}`,
      `key_b64u=${toB64u(keyBytes)}`,
      `iv_b64u=${toB64u(iv)}`,
      `aad=opencriptG:v10:token-envelope`,
      `ciphertext_b64u=${toB64u(ct)}`,
    ].join('\n');
  }

  async function tokenFingerprintPacket() {
    const token = 'ocg_live_' + toB64u(bytes(36));
    const salt = bytes(16);
    const hash = await sha('SHA-256', new Uint8Array([...salt, ...enc.encode(token)]));
    const preview = token.slice(0, 10) + '...' + token.slice(-8);
    return [
      'OCG-TOKEN-FINGERPRINT.v1',
      `token_preview=${preview}`,
      `salt=${toB64u(salt)}`,
      `sha256_salted=${toHex(hash)}`,
      `store_raw=false`,
    ].join('\n');
  }

  async function hmacSignedUrlToken() {
    const secret = bytes(32);
    const exp = Math.floor(Date.now() / 1000) + 1800;
    const path = `/download/${toB64u(bytes(10))}`;
    const qs = `exp=${exp}&scope=file:read&nonce=${toB64u(bytes(12))}`;
    const sig = toB64u(await hmacSha256(secret, `${path}?${qs}`));
    return [
      `https://local.opencriptg.test${path}?${qs}&sig=${sig}`,
      `hmac_secret_b64u=${toB64u(secret)}`,
      'alg=HMAC-SHA256',
    ].join('\n');
  }

  async function tokenizationPacket() {
    const raw = 'pan_' + fromAlpha(6, '0123456789') + '_asset_' + toB64u(bytes(10));
    const vaultKey = bytes(32);
    const lookupSalt = bytes(16);
    const token = 'tok_ocg_' + toB64u(bytes(24));
    const lookupHash = await hmacSha256(vaultKey, `${toB64u(lookupSalt)}:${raw}`);
    const proof = await hmacSha256(vaultKey, `${token}:${toHex(lookupHash)}:active`);
    return [
      'OCG-TOKENIZATION-PACKET.v1',
      `token=${token}`,
      `raw_preview=${raw.slice(0, 8)}...${raw.slice(-6)}`,
      `lookup_salt=${toB64u(lookupSalt)}`,
      `lookup_hmac_sha256=${toHex(lookupHash)}`,
      `proof_hmac_sha256=${toHex(proof)}`,
      `vault_key_b64u=${toB64u(vaultKey)}`,
      'detokenize_policy=key-required',
    ].join('\n');
  }

  // Lightweight FNV-1a / MurmurHash / CRC32 / xxHash for non-cryptographic hashes
  function fnv1a64(b) {
    let h = 0xcbf29ce484222325n; const P = 0x100000001b3n;
    for (const x of b) { h ^= BigInt(x); h = (h * P) & 0xffffffffffffffffn; }
    return h.toString(16).padStart(16,'0');
  }
  function crc32(b) {
    let c = 0xffffffff;
    for (const x of b) {
      c ^= x;
      for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
    }
    return ((c ^ 0xffffffff) >>> 0).toString(16).padStart(8,'0');
  }
  function murmur128(b) { // truncated demo — produces 32 hex chars
    return toHex(b.slice(0, 16));
  }
  function xxh64(b) { return fnv1a64(b).slice(0, 16); }

  // ── UUID variants ──
  function uuid4() {
    const b = bytes(16);
    b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80;
    const h = toHex(b);
    return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20,32)}`;
  }
  function uuid7() {
    const ts = BigInt(Date.now());
    const r = bytes(10);
    const tsHex = ts.toString(16).padStart(12,'0');
    const h = tsHex + toHex(r);
    let arr = h.split('');
    arr[12] = '7';
    arr[16] = ((parseInt(arr[16],16) & 0x3) | 0x8).toString(16);
    const j = arr.join('');
    return `${j.slice(0,8)}-${j.slice(8,12)}-${j.slice(12,16)}-${j.slice(16,20)}-${j.slice(20,32)}`;
  }
  function uuid1() {
    const ts = BigInt(Date.now()) * 10000n + 0x01b21dd213814000n;
    const tsHex = ts.toString(16).padStart(16,'0');
    const node = toHex(bytes(6));
    const clock = toHex(bytes(2));
    const tl = tsHex.slice(8,16), tm = tsHex.slice(4,8), th = '1' + tsHex.slice(1,4);
    return `${tl}-${tm}-${th}-${clock}-${node}`;
  }
  async function uuidNamespaced(algo, ns, name) {
    const buf = new Uint8Array(16 + name.length);
    const nsB = ns.replace(/-/g,'').match(/.{2}/g).map(x => parseInt(x,16));
    buf.set(nsB, 0); buf.set(enc.encode(name), 16);
    const h = await sha(algo, buf);
    h[6] = (h[6] & 0x0f) | (algo === 'SHA-1' ? 0x50 : 0x30);
    h[8] = (h[8] & 0x3f) | 0x80;
    const x = toHex(h.slice(0,16));
    return `${x.slice(0,8)}-${x.slice(8,12)}-${x.slice(12,16)}-${x.slice(16,20)}-${x.slice(20,32)}`;
  }

  function ulid() {
    const ts = Date.now();
    const enc32 = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
    let t = '';
    let n = ts;
    for (let i = 9; i >= 0; i--) { t = enc32[n % 32] + t; n = Math.floor(n / 32); }
    return t + fromAlpha(16, enc32);
  }
  function ksuid() {
    const ts = Math.floor(Date.now() / 1000) - 1400000000;
    const tb = new Uint8Array(4);
    tb[0] = (ts >>> 24) & 0xff; tb[1] = (ts >>> 16) & 0xff;
    tb[2] = (ts >>> 8) & 0xff;  tb[3] = ts & 0xff;
    const all = new Uint8Array(20);
    all.set(tb, 0); all.set(bytes(16), 4);
    return toB62(all).padStart(27, '0');
  }
  function snowflake() {
    const ts = BigInt(Date.now() - 1288834974657);
    const r = BigInt(rint(1024));
    const seq = BigInt(rint(4096));
    return ((ts << 22n) | (r << 12n) | seq).toString();
  }
  function objectId() {
    const ts = Math.floor(Date.now() / 1000);
    const tHex = ts.toString(16).padStart(8, '0');
    return tHex + toHex(bytes(8));
  }

  function license() {
    const block = () => fromAlpha(4, B62);
    return `${block()}-${block()}-${block()}-${block()}`;
  }
  function serial() {
    const block = () => fromAlpha(4, B62);
    return `${block()}-${block()}-${block()}`;
  }
  function pronounceable(n) {
    let out = '';
    for (let i = 0; i < n; i++) out += i % 2 === 0 ? pick(CONS) : pick(VOW);
    return out;
  }
  function passphrase(words = 6, list = WORDS, sep = '-') {
    return Array.from({length: words}, () => list[rint(list.length)]).join(sep);
  }
  function recoveryCodes() {
    return Array.from({length: 10}, () => {
      const a = fromAlpha(4, B62), b = fromAlpha(4, B62);
      return `${a}-${b}`;
    }).join('  ');
  }
  function pin(n) { return fromAlpha(n, '0123456789'); }
  function xkcdPwd() { return passphrase(4, WORDS, ' '); }

  function password(len, opts) {
    const groups = [];
    if (opts.upper) groups.push('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
    if (opts.lower) groups.push('abcdefghijklmnopqrstuvwxyz');
    if (opts.num)   groups.push('0123456789');
    if (opts.sym)   groups.push(SYMBOLS);
    if (!groups.length) groups.push(ALPHANUM);
    const size = Math.max(groups.length, Number(len) || 32);
    const alpha = groups.join('');
    const chars = groups.map(group => pick(group));
    while (chars.length < size) chars.push(pick(alpha));
    for (let i = chars.length - 1; i > 0; i--) {
      const j = rint(i + 1);
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    return chars.join('');
  }



  function advancedCodeTemplate(typeId) {
    const n = Number(String(typeId).replace('adv_code_', '')) || 1;
    const families = [
      ['QVK', 'QUANTUM-VAULT', 'lattice-ready vault material'],
      ['ZKP', 'ZERO-KNOWLEDGE', 'proof seed with verifier hint'],
      ['PQS', 'POST-QUANTUM', 'hybrid session capsule'],
      ['THR', 'THRESHOLD-SHARE', 'multi-party recovery fragment'],
      ['HRT', 'HARDWARE-ROOT', 'device-root binding token'],
      ['DID', 'IDENTITY-ANCHOR', 'decentralized identity anchor'],
      ['SEN', 'SECURE-ENCLAVE', 'TEE/enclave ticket'],
      ['API', 'HARDENED-API', 'rotating API capsule'],
      ['MSH', 'MESH-NODE', 'distributed node credential'],
      ['CRT', 'CERTIFICATE-SEAL', 'private code certificate seal'],
    ];
    const fam = families[(n - 1) % families.length];
    const payload = toB64u(bytes(48));
    const salt = toHex(bytes(16));
    const nonce = toHex(bytes(12));
    const issue = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
    const serial = `${String(n).padStart(3, '0')}-${fromAlpha(5, B62)}-${fromAlpha(5, B62)}-${fromAlpha(5, B62)}`;
    const checksum = crc32(enc.encode(`${fam[0]}:${payload}:${salt}:${nonce}:${issue}`)).toUpperCase();
    return `OCG.${fam[0]}.v10.${serial}\nTYPE=${fam[1]}\nPAYLOAD=${payload}\nSALT=${salt}\nNONCE=${nonce}\nISSUED=${issue}\nUSE=${fam[2]}\nCHECK=${checksum}`;
  }

  function cardStudioTemplate(typeId) {
    const n = Number(String(typeId).replace('card_tpl_', '')) || 1;
    const titles = [
      'Founder Access', 'Developer Pass', 'Cyber Vault', 'AI Agent', 'Cloud Console', 'API Credential', 'Launch Ticket', 'Beta Invite', 'Creator License', 'Research Badge',
      'Secure Note', 'Hardware Pass', 'Data Room', 'Crypto Pass', 'DevOps Key', 'Product Key', 'Service Token', 'Studio Pass', 'Client Card', 'Project Badge'
    ];
    const title = titles[(n - 1) % titles.length];
    const tier = ['BASIC','PLUS','PRO','ELITE','ULTRA','OMEGA','FOUNDER','BLACK','PLATINUM','TITAN'][rint(10)];
    const serial = `${String(n).padStart(3,'0')}-${fromAlpha(4, B62)}-${fromAlpha(4, B62)}-${fromAlpha(4, B62)}`;
    const chip = toHex(bytes(12)).toUpperCase();
    const uid = 'ocg_' + toB64u(bytes(18));
    const pin = fromAlpha(6, '0123456789');
    const exp = `20${28 + rint(8)}-${String(1+rint(12)).padStart(2,'0')}`;
    const palette = ['OBSIDIAN','JADE','SILVER','GOLD','ONYX','COBALT','AMBER','NEON','GRAPHITE','PEARL'][rint(10)];
    const scope = ['READ.WRITE','ADMIN','EXPORT','VAULT','SIGN','DEPLOY','AUDIT','TOKENIZE','ISSUE','VERIFY'][rint(10)];
    return `┌─ CARD STUDIO #${String(n).padStart(3,'0')} · ${title.toUpperCase()} ─────────────┐\n│ Tier    ${tier.padEnd(29)}│\n│ Serial  ${serial.padEnd(29)}│\n│ UID     ${uid.slice(0,29).padEnd(29)}│\n│ Chip    ${chip.padEnd(29)}│\n│ PIN     ${pin.padEnd(29)}│\n│ Exp     ${exp.padEnd(29)}│\n│ Style   ${palette.padEnd(29)}│\n│ Scope   ${scope.padEnd(29)}│\n└────────────────────────────────────────────┘`;
  }



  function extraAdvancedCodeTemplate(typeId) {
    const n = Number(String(typeId).replace('xadv_code_', '')) || 1;
    const families = [
      ['SEAL', 'AEAD-SEAL-MATRIX', 'authenticated encryption seal', 64],
      ['B3RT', 'BLAKE3-MERKLE-ROOT', 'tamper-evident integrity root', 56],
      ['NONX', 'EXTENDED-NONCE-CHAIN', 'nonce chain material', 48],
      ['ZTA', 'ZERO-TRUST-TICKET', 'short-lived access ticket', 52],
      ['DID', 'DID-VERIFICATION-ANCHOR', 'identity verification anchor', 50],
      ['VFRG', 'VAULT-RECOVERY-FRAGMENT', 'threshold vault recovery fragment', 64],
      ['HSMR', 'HSM-ROTATION-CAPSULE', 'hardware security rotation capsule', 52],
      ['PQK', 'POST-QUANTUM-KEM-SEED', 'hybrid post-quantum exchange seed', 64],
      ['DILS', 'DILITHIUM-SIGNATURE-STUB', 'post-quantum signature ticket', 64],
      ['SLAT', 'SECURE-SESSION-LATTICE', 'secure session lattice token', 52],
      ['MESH', 'MESH-NODE-CREDENTIAL', 'distributed mesh node credential', 48],
      ['APIX', 'HARDENED-API-CAPSULE', 'rotating API capsule', 56],
      ['BCK', 'BACKUP-CHAIN-KEY', 'backup-chain sealing material', 64],
      ['CERT', 'CERTIFICATE-CODE-SEAL', 'private certificate seal', 52],
      ['XTS', 'XTS-STORAGE-LOCK', 'storage lock material', 64],
      ['OPA', 'OPAQUE-AUTH-ENVELOPE', 'password-auth envelope material', 56],
      ['FIDO', 'FIDO-ATTESTATION-BINDER', 'device attestation binder', 48],
      ['AUD', 'AUDIT-TRAIL-CHECKPOINT', 'audit trail checkpoint', 52],
      ['QRX', 'QR-BUNDLE-INTEGRITY-CODE', 'QR bundle integrity code', 48],
      ['LIC', 'COMMERCIAL-LICENSE-TOKEN', 'private commercial license token', 48],
    ];
    const fam = families[(n - 1) % families.length];
    const payload = toB64u(bytes(fam[3]));
    const salt = toHex(bytes(18));
    const nonce = toHex(bytes(14));
    const route = toB32(bytes(10)).slice(0, 16);
    const issue = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
    const serial = `X${String(n).padStart(3, '0')}-${fromAlpha(6, B62)}-${fromAlpha(6, B62)}-${fromAlpha(6, B62)}`;
    const checksum = crc32(enc.encode(`${fam[0]}:${payload}:${salt}:${nonce}:${route}:${issue}`)).toUpperCase();
    return `OCG-X.${fam[0]}.v10.${serial}\nTYPE=${fam[1]}\nPAYLOAD=${payload}\nSALT=${salt}\nNONCE=${nonce}\nROUTE=${route}\nISSUED=${issue}\nUSE=${fam[2]}\nCHECK=${checksum}`;
  }

  async function neoCryptoCodeTemplate(typeId) {
    const n = Math.max(1, Math.min(200, Number(String(typeId).replace('neo_code_', '')) || 1));
    const families = [
      ['ARGON', 'ARGON2ID-VAULT-BINDER', 'password-hardening vault binder', 64, 'KDF'],
      ['KYB', 'ML-KEM-HYBRID-CAPSULE', 'post-quantum key encapsulation capsule', 72, 'PQK'],
      ['DIL', 'ML-DSA-SIGNING-TICKET', 'post-quantum signature ticket', 72, 'PQS'],
      ['A256', 'AES-GCM-AAD-SEAL', 'authenticated encryption envelope', 64, 'AEAD'],
      ['XCH', 'XCHACHA-NONCE-LADDER', 'extended nonce ladder', 68, 'NONCE'],
      ['OPA', 'OPAQUE-REGISTRATION-ENVELOPE', 'password-auth registration envelope', 66, 'PAKE'],
      ['FROST', 'THRESHOLD-SIGNING-SHARE', 'multi-party signing share', 70, 'MPC'],
      ['BBS', 'SELECTIVE-DISCLOSURE-CRED', 'privacy credential proof seed', 68, 'VC'],
      ['DPK', 'DPOP-PROOF-MATERIAL', 'sender-constrained proof material', 60, 'OAUTH'],
      ['MCR', 'MACAROON-CAVEAT-ROOT', 'delegated authorization root', 58, 'AUTHZ'],
      ['SIV', 'MISUSE-RESISTANT-SEAL', 'synthetic-IV encryption material', 74, 'SIV'],
      ['KMS', 'KMS-ROTATION-ATTESTATION', 'key lifecycle attestation record', 62, 'KMS'],
      ['TEE', 'ENCLAVE-QUOTE-BINDER', 'secure enclave quote binder', 64, 'TEE'],
      ['DID', 'DID-COMMITMENT-ANCHOR', 'decentralized identity commitment', 58, 'DID'],
      ['ZKP', 'ZERO-KNOWLEDGE-WITNESS-SEED', 'proof witness commitment seed', 76, 'ZK'],
      ['VRF', 'VERIFIABLE-RANDOM-SEED', 'verifiable randomness output seed', 64, 'VRF'],
      ['MERK', 'MERKLE-AUDIT-CHECKPOINT', 'tamper-evident audit checkpoint', 60, 'HASH'],
      ['HSM', 'HSM-SLOT-UNSEAL-TICKET', 'hardware slot unlock ticket', 66, 'HSM'],
      ['PASS', 'PASSKEY-DEVICE-BINDER', 'FIDO passkey device binder', 62, 'FIDO'],
      ['TOK', 'DETOKENIZATION-PROOF-PACKET', 'token vault proof packet', 70, 'TOK'],
    ];
    const profiles = [
      ['GENESIS', 'root issuance'],
      ['ROTATE', 'rotation phase'],
      ['RECOVER', 'recovery path'],
      ['AUDIT', 'audit trail'],
      ['ESCROW', 'escrow split'],
      ['OFFLINE', 'offline custody'],
      ['MOBILE', 'mobile authenticator'],
      ['SERVER', 'server sidecar'],
      ['CLIENT', 'client-bound proof'],
      ['COLD', 'cold-storage reserve'],
    ];
    const fam = families[(n - 1) % families.length];
    const prof = profiles[Math.floor((n - 1) / families.length) % profiles.length];
    const entropyBytes = fam[3] + Math.floor((n - 1) / 20);
    const seed = bytes(entropyBytes);
    const salt = bytes(24);
    const nonce = bytes(16);
    const route = toB32(bytes(12)).slice(0, 20);
    const issued = new Date().toISOString();
    const serial = `N${String(n).padStart(3, '0')}-${prof[0]}-${toB32(bytes(8)).slice(0, 13)}`;
    const binding = toHex(await hmacSha256(salt, `${fam[0]}:${prof[0]}:${toB64u(seed)}:${route}:${issued}`));
    const digest = toHex(await sha('SHA-512', enc.encode(`${serial}:${binding}:${toB64u(nonce)}`)));
    const check = crc32(enc.encode(`${serial}:${digest}:${fam[1]}:${prof[1]}`)).toUpperCase();
    return [
      `OCG-NEO.${fam[0]}.v11.${serial}`,
      `TYPE=${fam[1]}`,
      `PROFILE=${prof[0]} · ${prof[1]}`,
      `CLASS=${fam[4]}`,
      `PAYLOAD=${toB64u(seed)}`,
      `SALT=${toB64u(salt)}`,
      `NONCE=${toB64u(nonce)}`,
      `ROUTE=${route}`,
      `HMAC_SHA256=${binding}`,
      `SHA512=${digest}`,
      `ISSUED=${issued}`,
      `USE=${fam[2]}`,
      `CHECK=${check}`,
    ].join('\n');
  }

  // ── master switch ──
  async function apexCryptoCodeTemplate(typeId) {
    const n = Math.max(1, Math.min(300, Number(String(typeId).replace('apex_code_', '')) || 1));
    const families = [
      ['ZKST', 'ZK-STATE-TRANSITION-RECEIPT', 'zero-knowledge state transition receipt', 88, 'ZK'],
      ['FHE', 'FHE-CONTEXT-CAPSULE', 'fully homomorphic encryption context capsule', 82, 'FHE'],
      ['MPC', 'MPC-CEREMONY-TRANSCRIPT-SEAL', 'multi-party computation ceremony transcript seal', 84, 'MPC'],
      ['PQH', 'HYBRID-PQ-HANDSHAKE-TICKET', 'hybrid post-quantum handshake ticket', 88, 'PQH'],
      ['TSS', 'THRESHOLD-CUSTODY-SHARE', 'threshold custody share for distributed vaults', 82, 'TSS'],
      ['DIDR', 'DID-ROTATION-PROOF-ANCHOR', 'decentralized identity rotation proof anchor', 76, 'DID'],
      ['VCB', 'VC-BLIND-BINDER', 'blind credential binding material', 80, 'VC'],
      ['HSMX', 'HSM-EXPORT-CONTROL-TICKET', 'hardware export-control authorization ticket', 82, 'HSM'],
      ['KMSX', 'KMS-DUAL-CONTROL-ROTATION-CODE', 'dual-control key rotation code', 80, 'KMS'],
      ['OTK', 'ONE-TIME-KEY-WRAP-ENVELOPE', 'single-use key wrapping envelope', 76, 'OTK'],
      ['DPOPX', 'DPOP-BOUND-ACCESS-PACKET', 'sender-constrained delegated access packet', 76, 'DPoP'],
      ['SIVX', 'SYNTHETIC-IV-VAULT-SEAL', 'misuse-resistant vault seal', 86, 'SIV'],
      ['VRFX', 'VRF-COMMITTEE-DRAW-SEED', 'verifiable randomness committee draw seed', 80, 'VRF'],
      ['MERX', 'MERKLE-INCLUSION-WITNESS-CODE', 'inclusion witness for tamper-evident records', 76, 'MRK'],
      ['AUDX', 'IMMUTABLE-AUDIT-EVIDENCE-TOKEN', 'immutable audit evidence token', 80, 'AUDIT'],
      ['QRL', 'QUANTUM-READY-LICENSE-CLAIM', 'quantum-ready license claim packet', 82, 'LIC'],
      ['TEE2', 'TEE-REMOTE-ATTESTATION-BINDER', 'remote attestation binder for trusted execution', 80, 'TEE'],
      ['OPA2', 'OPAQUE-RECOVERY-ENVELOPE', 'password-auth recovery envelope', 80, 'OPAQUE'],
      ['PSI', 'PRIVATE-SET-INTERSECTION-SEED', 'private set intersection session seed', 76, 'PSI'],
      ['NTRU', 'NTRU-MIGRATION-CAPSULE', 'lattice migration capsule for legacy systems', 88, 'LAT'],
      ['BLSX', 'BLS-AGGREGATE-SIGNATURE-TICKET', 'aggregate signature coordination ticket', 82, 'BLS'],
      ['ROTX', 'SECRET-ROTATION-EVIDENCE-CHAIN', 'secret rotation evidence chain checkpoint', 80, 'ROT'],
      ['MASK', 'DATA-MASKING-POLICY-TOKEN', 'data masking policy token', 76, 'DLP'],
      ['VAUL', 'VAULT-RECONSTITUTION-PROOF', 'vault reconstitution proof packet', 86, 'VAULT'],
      ['ANCH', 'CROSS-DOMAIN-TRUST-ANCHOR', 'cross-domain trust anchor code', 80, 'ANCHOR'],
    ];
    const tiers = [
      ['PRIME', 'root-grade issuance'], ['QUORUM', 'multi-approver control'], ['ZERO', 'zero-trust workflow'],
      ['NOVA', 'new environment bootstrap'], ['AEGIS', 'high-assurance protection'], ['OBSIDIAN', 'offline custody'],
      ['VECTOR', 'service mesh route'], ['CIPHER', 'sealed data flow'], ['ATLAS', 'enterprise registry'],
      ['NEXUS', 'cross-system federation'], ['HELIX', 'rotation and recovery'], ['ORACLE', 'audit evidence'],
    ];
    const fam = families[(n - 1) % families.length];
    const tier = tiers[Math.floor((n - 1) / families.length) % tiers.length];
    const payload = bytes(fam[3] + Math.floor((n - 1) / 25));
    const salt = bytes(32);
    const nonce = bytes(24);
    const route = toB32(bytes(14)).slice(0, 24);
    const policy = `POL-${fam[0]}-${tier[0]}-${toB32(bytes(6)).slice(0, 10)}`;
    const issued = new Date().toISOString();
    const serial = `A${String(n).padStart(3, '0')}-${tier[0]}-${toB32(bytes(10)).slice(0, 16)}`;
    const payloadB64 = toB64u(payload);
    const saltB64 = toB64u(salt);
    const nonceB64 = toB64u(nonce);
    const hmac256 = toHex(await hmacSha256(salt, `${serial}:${fam[0]}:${tier[0]}:${payloadB64}:${route}:${policy}:${issued}`));
    const digest512 = toHex(await sha('SHA-512', enc.encode(`${hmac256}:${nonceB64}:${fam[1]}:${tier[1]}`)));
    const digest256 = toHex(await sha('SHA-256', enc.encode(`${serial}:${digest512}:${policy}`)));
    const check = crc32(enc.encode(`${serial}:${digest512}:${digest256}:${fam[1]}:${tier[0]}`)).toUpperCase();
    return [
      `OCG-APEX.${fam[0]}.v12.${serial}`,
      `TYPE=${fam[1]}`,
      `TIER=${tier[0]} - ${tier[1]}`,
      `CLASS=${fam[4]}`,
      `POLICY=${policy}`,
      `PAYLOAD=${payloadB64}`,
      `SALT=${saltB64}`,
      `NONCE=${nonceB64}`,
      `ROUTE=${route}`,
      `HMAC_SHA256=${hmac256}`,
      `SHA512=${digest512}`,
      `SHA256_BINDING=${digest256}`,
      `ISSUED=${issued}`,
      `USE=${fam[2]}`,
      `CHECK=${check}`,
    ].join('\n');
  }

  async function hashcodAdvanced10000Template(typeId) {
    const n = Math.max(1, Math.min(8282, Number(String(typeId).replace(/^hc(?:5000|10000)_code_/, '')) || 1));
    const profiles = [
      ['PQC-KEM', 'intercambio de claves post-cuantico', 'post-quantum key encapsulation', 92, 'PQK'],
      ['PQC-SIG', 'firma digital post-cuantica', 'post-quantum digital signature', 92, 'PQS'],
      ['HASH-SIG', 'firma basada en hash', 'hash-based signature', 86, 'HSIG'],
      ['HPKE', 'cifrado publico hibrido', 'hybrid public-key encryption', 82, 'HPKE'],
      ['ZK', 'prueba de conocimiento cero', 'zero-knowledge proof material', 78, 'ZK'],
      ['MPC', 'computacion multipartita segura', 'secure multi-party computation', 82, 'MPC'],
      ['FHE', 'cifrado homomorfico', 'fully homomorphic encryption context', 84, 'FHE'],
      ['THRESH', 'criptografia de umbral', 'threshold cryptography share', 82, 'TSS'],
      ['VDF', 'funcion de retardo verificable', 'verifiable delay function', 66, 'VDF'],
      ['VRF', 'funcion aleatoria verificable', 'verifiable random function', 78, 'VRF'],
      ['AEAD-LW', 'cifrado autenticado ligero', 'lightweight authenticated encryption', 66, 'AEAD'],
      ['XOF', 'funcion de salida extensible', 'extendable-output function', 72, 'XOF'],
      ['KDF', 'derivacion segura de claves', 'secure key derivation', 78, 'KDF'],
      ['MAC', 'autenticacion de mensajes', 'message authentication code', 72, 'MAC'],
      ['PAKE', 'intercambio seguro con contrasena', 'password-authenticated key exchange', 78, 'PAKE'],
      ['ACCUM', 'acumulador criptografico', 'cryptographic accumulator', 72, 'ACCUM'],
      ['IBE', 'cifrado basado en identidad', 'identity-based encryption', 78, 'IBE'],
      ['ABE', 'cifrado basado en atributos', 'attribute-based encryption', 82, 'ABE'],
      ['RING', 'firma de anillo', 'ring signature', 72, 'RING'],
      ['BLIND', 'firma ciega', 'blind signature', 72, 'BLIND'],
    ];
    const names = [
      'Cipher', 'Quanta', 'Atlas', 'Sigma', 'Obsidian', 'Eclipse', 'Helix', 'Falcon', 'Orion', 'Vertex',
      'Nimbus', 'Chronos', 'Aether', 'Delta', 'Argon', 'Monolith', 'Meridian', 'Zenith', 'Omega', 'Lattice',
      'Vortex', 'Titan', 'Krypton', 'Matrix', 'Radial', 'Prism', 'Nexus', 'Cobalt', 'Vega', 'Solstice',
      'Neon', 'Parallax', 'Axiom', 'Vector', 'Nova', 'Spectra', 'Zephyr', 'Aurora', 'Pulse', 'Kairo',
    ];
    const levels = ['256-bit', 'L3', 'L5', '192-bit', 'L1', '256-bit', 'L3', 'L5', '128-bit', '256-bit'];
    const versionFor = (value) => `v${1 + (value % 9)}.${(value * 3) % 10}`;
    const profile = profiles[(n - 1) % profiles.length];
    const pairIndex = ((n - 1) * 2) % names.length;
    const left = names[pairIndex];
    const right = names[(pairIndex + 1) % names.length];
    const level = levels[(n - 1) % levels.length];
    const version = versionFor(n);
    const codeName = `HC-${profile[0]}-${left}-${right}-${String(n).padStart(5, '0')}-${level}-${version}`;
    const payload = bytes(profile[3] + Math.floor((n - 1) / 500));
    const salt = bytes(32);
    const nonce = bytes(24);
    const route = `HCR-${profile[4]}-${toB32(bytes(12)).slice(0, 20)}`;
    const issued = new Date().toISOString();
    const payloadB64 = toB64u(payload);
    const saltB64 = toB64u(salt);
    const nonceB64 = toB64u(nonce);
    const policy = `HC10K-${String(n).padStart(5, '0')}-${profile[4]}-${level}`;
    const hmac256 = toHex(await hmacSha256(salt, `${codeName}:${payloadB64}:${nonceB64}:${route}:${issued}:${policy}`));
    const digest512 = toHex(await sha('SHA-512', enc.encode(`${hmac256}:${codeName}:${profile[2]}:${saltB64}`)));
    const binding256 = toHex(await sha('SHA-256', enc.encode(`${digest512}:${nonceB64}:${policy}:${version}`)));
    const check = crc32(enc.encode(`${codeName}:${digest512}:${binding256}:${route}`)).toUpperCase();
    return [
      `HASHCOD.${profile[4]}.v13.${codeName}`,
      `NAME=${codeName}`,
      `FAMILY=${profile[0]}`,
      `PURPOSE=${profile[1]}`,
      `CLASS=${profile[4]}`,
      `LEVEL=${level}`,
      `VERSION=${version}`,
      `POLICY=${policy}`,
      `PAYLOAD=${payloadB64}`,
      `SALT=${saltB64}`,
      `NONCE=${nonceB64}`,
      `ROUTE=${route}`,
      `HMAC_SHA256=${hmac256}`,
      `SHA512=${digest512}`,
      `SHA256_BINDING=${binding256}`,
      `ISSUED=${issued}`,
      `USE=${profile[2]}`,
      `CHECK=${check}`,
    ].join('\n');
  }

  function mobilePatternRoute() {
    const midpoint = {
      '1-3': 2, '3-1': 2,
      '1-7': 4, '7-1': 4,
      '3-9': 6, '9-3': 6,
      '7-9': 8, '9-7': 8,
      '1-9': 5, '9-1': 5,
      '3-7': 5, '7-3': 5,
      '2-8': 5, '8-2': 5,
      '4-6': 5, '6-4': 5,
    };
    for (let attempt = 0; attempt < 80; attempt++) {
      const route = [1 + rint(9)];
      const used = new Set(route);
      while (route.length < 9) {
        const current = route[route.length - 1];
        const candidates = [];
        for (let next = 1; next <= 9; next++) {
          if (used.has(next)) continue;
          const mid = midpoint[`${current}-${next}`];
          if (!mid || used.has(mid)) candidates.push(next);
        }
        if (!candidates.length) break;
        const next = candidates[rint(candidates.length)];
        route.push(next);
        used.add(next);
      }
      if (route.length === 9) return route;
    }
    return [1, 5, 9, 6, 3, 2, 4, 7, 8];
  }

  function mobilePatternMetrics(route) {
    const pos = {
      1: [0, 0], 2: [1, 0], 3: [2, 0],
      4: [0, 1], 5: [1, 1], 6: [2, 1],
      7: [0, 2], 8: [1, 2], 9: [2, 2],
    };
    let distance = 0;
    let turns = 0;
    let diagonals = 0;
    const vectors = [];
    for (let i = 1; i < route.length; i++) {
      const [ax, ay] = pos[route[i - 1]];
      const [bx, by] = pos[route[i]];
      const vx = bx - ax;
      const vy = by - ay;
      vectors.push([Math.sign(vx), Math.sign(vy)]);
      distance += Math.sqrt(vx * vx + vy * vy);
      if (Math.abs(vx) && Math.abs(vy)) diagonals++;
      if (i > 1) {
        const [px, py] = vectors[vectors.length - 2];
        const [cx, cy] = vectors[vectors.length - 1];
        if (px !== cx || py !== cy) turns++;
      }
    }
    return { distance, turns, diagonals };
  }

  function mobilePatternVisual(route) {
    const order = {};
    route.forEach((node, index) => { order[node] = String(index + 1).padStart(2, '0'); });
    const cell = (node) => `[${order[node] || '..'}:${node}]`;
    return [
      `${cell(1)}---${cell(2)}---${cell(3)}`,
      `  |  \\     |     /  |`,
      `${cell(4)}---${cell(5)}---${cell(6)}`,
      `  |  /     |     \\  |`,
      `${cell(7)}---${cell(8)}---${cell(9)}`,
      `PATH=${route.join(' -> ')}`,
    ].join('\n');
  }

  async function mobilePatternCodeTemplate(typeId) {
    const n = Math.max(1, Math.min(100, Number(String(typeId).replace('mobile_pattern_code_', '')) || 1));
    const families = [
      ['MPL', 'LATTICE-GESTURE-LOCK', 'full-grid mobile unlock credential'],
      ['MPX', 'CROSSLINE-VAULT-PATTERN', 'cross-axis vault unlock evidence'],
      ['MPD', 'DIAGONAL-MESH-PATTERN', 'diagonal-heavy gesture proof'],
      ['MPS', 'SPIRAL-NODE-PATTERN', 'spiral route phone credential'],
      ['MPM', 'MIRROR-TRAP-PATTERN', 'mirror-resistant route binder'],
      ['MPG', 'PULSE-GRID-PATTERN', 'timed grid pulse material'],
      ['MZT', 'ZERO-TRUST-TOUCHPATH', 'zero-trust device touchpath'],
      ['MRG', 'RECOVERY-GESTURE-SEAL', 'offline recovery gesture seal'],
      ['MPB', 'PASSLINE-PATTERN-BINDER', 'passline HMAC-bound route'],
      ['MNA', 'NODEFLOW-AUTH-PATTERN', 'multi-node authentication pattern'],
    ];
    const fam = families[(n - 1) % families.length];
    const route = mobilePatternRoute();
    const visual = mobilePatternVisual(route);
    const metrics = mobilePatternMetrics(route);
    const salt = bytes(32);
    const nonce = bytes(16);
    const gridKey = toB32(bytes(15)).slice(0, 24);
    const issued = new Date().toISOString();
    const routeText = route.join('-');
    const turns = String(metrics.turns).padStart(2, '0');
    const distance = metrics.distance.toFixed(4);
    const complexity = Math.round((metrics.distance * 100) + (metrics.turns * 37) + (metrics.diagonals * 29) + n);
    const serial = `HMP-${String(n).padStart(3, '0')}-${fam[0]}-${toB32(bytes(8)).slice(0, 13)}`;
    const routeDigest = toHex(await sha('SHA-256', enc.encode(`${serial}:${routeText}:${visual}:${gridKey}:${issued}`)));
    const binding = toHex(await hmacSha256(salt, `${serial}:${fam[1]}:${routeDigest}:${toB64u(nonce)}:${complexity}`));
    const sha512 = toHex(await sha('SHA-512', enc.encode(`${binding}:${routeText}:${distance}:${turns}:${fam[2]}`)));
    const check = crc32(enc.encode(`${serial}:${routeText}:${binding}:${sha512}`)).toUpperCase();
    return [
      `HASHCOD.MOBILE_PATTERN.v1.${serial}`,
      `TYPE=${fam[1]}`,
      `PURPOSE=${fam[2]}`,
      `GRID=3x3 Android-compatible unlock lattice`,
      `ROUTE=${routeText}`,
      `ROUTE_DIGEST_SHA256=${routeDigest}`,
      `HMAC_SHA256=${binding}`,
      `SHA512=${sha512}`,
      `SALT=${toB64u(salt)}`,
      `NONCE=${toB64u(nonce)}`,
      `GRID_KEY=${gridKey}`,
      `TURNS=${turns}`,
      `DIAGONALS=${metrics.diagonals}`,
      `DISTANCE=${distance}`,
      `COMPLEXITY=${complexity}`,
      `ISSUED=${issued}`,
      `CHECK=${check}`,
      `PATTERN_VIEW`,
      visual,
    ].join('\n');
  }

  async function generate(typeId, len, opts) {
    const o = opts || {};
    const L = len || 32;
    if (String(typeId).startsWith('adv_code_')) return advancedCodeTemplate(typeId);
    if (String(typeId).startsWith('xadv_code_')) return extraAdvancedCodeTemplate(typeId);
    if (String(typeId).startsWith('neo_code_')) return await neoCryptoCodeTemplate(typeId);
    if (String(typeId).startsWith('apex_code_')) return await apexCryptoCodeTemplate(typeId);
    if (String(typeId).startsWith('mobile_pattern_code_')) return await mobilePatternCodeTemplate(typeId);
    if (/^hc(?:5000|10000)_code_/.test(String(typeId))) return await hashcodAdvanced10000Template(typeId);
    if (String(typeId).startsWith('card_tpl_')) return cardStudioTemplate(typeId);
    switch (typeId) {
      // Symmetric
      case 'aes128':   return toB64(bytes(16));
      case 'aes192':   return toB64(bytes(24));
      case 'aes256':   return toB64(bytes(32));
      case 'aesgcm':   return `key=${toB64(bytes(32))}; iv=${toB64(bytes(12))}`;
      case 'chacha20': return toHex(bytes(32));
      case 'xchacha':  return `key=${toHex(bytes(32))}; nonce=${toHex(bytes(24))}`;
      case 'poly1305': return toHex(bytes(32));
      case 'salsa20':  return toHex(bytes(32));
      case 'des3':     return toHex(bytes(24));
      case 'blowfish': return toHex(bytes(56));
      case 'twofish':  return toHex(bytes(32));
      case 'camellia': return toHex(bytes(32));
      // Symmetric — extended
      case 'aria256':       return toHex(bytes(32));
      case 'seed128':       return toHex(bytes(16));
      case 'sm4':           return toHex(bytes(16));
      case 'sm4_gcm':       return `key=${toHex(bytes(16))}; iv=${toHex(bytes(12))}`;
      case 'kuznyechik':    return toHex(bytes(32));
      case 'magma':         return toHex(bytes(32));
      case 'idea':          return toHex(bytes(16));
      case 'rc6':           return toHex(bytes(32));
      case 'mars':          return toHex(bytes(32));
      case 'serpent':       return toHex(bytes(32));
      case 'cast128':       return toHex(bytes(16));
      case 'cast256':       return toHex(bytes(32));
      case 'rc4':           return toHex(bytes(16));
      case 'rc5':           return toHex(bytes(16));
      case 'tea':           return toHex(bytes(16));
      case 'xtea':          return toHex(bytes(16));
      case 'xxtea':         return toHex(bytes(16));
      case 'speck':         return toHex(bytes(16));
      case 'simon':         return toHex(bytes(16));
      case 'ascon':         return `key=${toHex(bytes(16))}; nonce=${toHex(bytes(16))}`;
      case 'aes_ctr':       return `key=${toB64(bytes(32))}; iv=${toB64(bytes(16))}`;
      case 'aes_cbc':       return `key=${toB64(bytes(32))}; iv=${toB64(bytes(16))}`;
      case 'aes_xts':       return toHex(bytes(64));
      case 'aes_ocb':       return `key=${toB64(bytes(32))}; nonce=${toB64(bytes(12))}`;
      case 'aes_eax':       return `key=${toB64(bytes(32))}; nonce=${toB64(bytes(16))}`;
      case 'aes_siv':       return toB64(bytes(64));
      case 'chacha_ietf':   return `key=${toHex(bytes(32))}; nonce=${toHex(bytes(12))}`;
      case 'chacha_poly':   return `key=${toHex(bytes(32))}; nonce=${toHex(bytes(12))}`;
      case 'xchacha_poly':  return `key=${toHex(bytes(32))}; nonce=${toHex(bytes(24))}`;
      case 'morus':         return `key=${toHex(bytes(32))}; nonce=${toHex(bytes(16))}`;
      case 'aegis128':      return `key=${toHex(bytes(16))}; nonce=${toHex(bytes(16))}`;
      case 'aegis256':      return `key=${toHex(bytes(32))}; nonce=${toHex(bytes(32))}`;
      case 'deoxys':        return `key=${toHex(bytes(32))}; nonce=${toHex(bytes(16))}`;
      case 'gift':          return toHex(bytes(16));
      case 'present':       return toHex(bytes(16));
      case 'prince':        return toHex(bytes(16));
      case 'lea':           return toHex(bytes(16));
      case 'sosemanuk':     return toHex(bytes(32));
      case 'rabbit':        return toHex(bytes(16));
      case 'hc256':         return toHex(bytes(32));
      case 'trivium':       return toHex(bytes(10));

      // Asymmetric
      case 'rsa1024':   return toHex(bytes(128));
      case 'rsa2048':   return toHex(bytes(256));
      case 'rsa4096':   return toHex(bytes(512));
      case 'ecdsap256': return toHex(bytes(32));
      case 'ecdsap384': return toHex(bytes(48));
      case 'ecdsap521': return toHex(bytes(66));
      case 'ed25519':   return toB64u(bytes(32));
      case 'ed448':     return toHex(bytes(57));
      case 'x25519':    return toB64u(bytes(32));
      case 'x448':      return toHex(bytes(56));
      case 'secp256k1': return toHex(bytes(32));
      case 'dsa2048':   return toHex(bytes(256));
      // Asymmetric — extended
      case 'dsa3072':       return toHex(bytes(384));
      case 'rsa3072':       return toHex(bytes(384));
      case 'rsa8192':       return toHex(bytes(1024));
      case 'elgamal':       return toHex(bytes(256));
      case 'paillier':      return toHex(bytes(256));
      case 'bls12_381':     return toHex(bytes(32));
      case 'bn254':         return toHex(bytes(32));
      case 'secp192k1':     return toHex(bytes(24));
      case 'secp224k1':     return toHex(bytes(28));
      case 'brainpoolP256': return toHex(bytes(32));
      case 'brainpoolP384': return toHex(bytes(48));
      case 'brainpoolP512': return toHex(bytes(64));
      case 'curve41417':    return toHex(bytes(52));
      case 'sm2':           return toHex(bytes(32));
      case 'gostecsig':     return toHex(bytes(32));
      case 'ntru':          return toHex(bytes(700));
      case 'mceliece348':   return toB64(bytes(2048)).slice(0, 256) + '…';
      case 'rsa_pss':       return toHex(bytes(256));
      case 'rsa_oaep':      return toHex(bytes(256));

      // Hashes — derived from random input so each call is unique
      case 'sha224':     return toHex((await sha('SHA-256', bytes(64))).slice(0, 28));
      case 'sha256':     return toHex(await sha('SHA-256', bytes(64)));
      case 'sha384':     return toHex(await sha('SHA-384', bytes(64)));
      case 'sha512':     return toHex(await sha('SHA-512', bytes(64)));
      case 'sha512_256': return toHex((await sha('SHA-512', bytes(64))).slice(0, 32));
      case 'sha3_256':   return toHex(await sha('SHA-256', bytes(64))); // Web Crypto has no SHA3 — labeled, derived from SHA-256
      case 'sha3_384':   return toHex(await sha('SHA-384', bytes(64)));
      case 'sha3_512':   return toHex(await sha('SHA-512', bytes(64)));
      case 'keccak256':  return '0x' + toHex(await sha('SHA-256', bytes(64)));
      case 'blake2b':    return toHex(await sha('SHA-512', bytes(64)));
      case 'blake2s':    return toHex(await sha('SHA-256', bytes(64)));
      case 'blake3':     return toHex(await sha('SHA-256', bytes(64)));
      case 'ripemd160':  return toHex((await sha('SHA-256', bytes(64))).slice(0, 20));
      case 'whirlpool':  return toHex(await sha('SHA-512', bytes(64)));
      case 'md5':        return toHex(bytes(16));
      case 'sha1':       return toHex(await sha('SHA-1', bytes(64)));
      case 'fnv1a':      return fnv1a64(bytes(32));
      case 'murmur3':    return murmur128(bytes(16));
      case 'xxh64':      return xxh64(bytes(32));
      case 'crc32':      return crc32(bytes(32));
      // Hashes — extended
      case 'crc16':       { let c=0xffff; const b=bytes(32); for(const x of b){ c^=x<<8; for(let k=0;k<8;k++) c=(c&0x8000)?((c<<1)^0x1021)&0xffff:(c<<1)&0xffff;} return c.toString(16).padStart(4,'0'); }
      case 'crc64':       return fnv1a64(bytes(32));
      case 'shake128':    return toHex((await sha('SHA-256', bytes(64))).slice(0, Math.max(8, Math.min(64, Math.ceil((L||32)/2)))));
      case 'shake256':    return toHex((await sha('SHA-512', bytes(64))).slice(0, Math.max(8, Math.min(64, Math.ceil((L||64)/2)))));
      case 'cshake128':   return toHex(await sha('SHA-256', bytes(64)));
      case 'cshake256':   return toHex(await sha('SHA-512', bytes(64)));
      case 'sm3':         return toHex(await sha('SHA-256', bytes(64)));
      case 'streebog256': return toHex(await sha('SHA-256', bytes(64)));
      case 'streebog512': return toHex(await sha('SHA-512', bytes(64)));
      case 'lsh256':      return toHex(await sha('SHA-256', bytes(64)));
      case 'jh256':       return toHex(await sha('SHA-256', bytes(64)));
      case 'skein256':    return toHex(await sha('SHA-256', bytes(64)));
      case 'skein512':    return toHex(await sha('SHA-512', bytes(64)));
      case 'groestl256':  return toHex(await sha('SHA-256', bytes(64)));
      case 'tiger':       return toHex(bytes(24));
      case 'gost94':      return toHex(await sha('SHA-256', bytes(64)));
      case 'haval':       return toHex(await sha('SHA-256', bytes(64)));
      case 'md4':         return toHex(bytes(16));
      case 'md2':         return toHex(bytes(16));
      case 'siphash':     return toHex(bytes(8));
      case 'highway':     return toHex(bytes(32));
      case 'metrohash':   return toHex(bytes(16));
      case 'cityhash':    return toHex(bytes(16));
      case 'farmhash':    return toHex(bytes(16));
      case 'spooky':      return toHex(bytes(16));
      case 'pearson':     return toHex(bytes(8));
      case 'adler32':     return toHex(bytes(4));
      case 'fletcher':    return toHex(bytes(8));
      case 'gear':        return toHex(bytes(8));
      case 'rabin':       return toHex(bytes(8));
      case 'buzhash':     return toHex(bytes(4));
      case 'imohash':     return toHex(bytes(16));
      case 't1ha':        return toHex(bytes(16));
      case 'wyhash':      return toHex(bytes(8));
      case 'komihash':    return toHex(bytes(8));

      // MACs & KDFs
      case 'hmacsha256': return toHex(bytes(32));
      case 'hmacsha512': return toHex(bytes(64));
      case 'hmacsha3':   return toHex(bytes(32));
      case 'kmac128':    return toHex(bytes(16));
      case 'kmac256':    return toHex(bytes(32));
      case 'gmac':       return toHex(bytes(16));
      case 'cmac':       return toHex(bytes(16));
      case 'pbkdf2':     return `$pbkdf2-sha256$i=100000$${toB64(bytes(16))}$${toB64(bytes(32))}`;
      case 'scrypt':     return `$scrypt$N=16384,r=8,p=1$${toB64(bytes(16))}$${toB64(bytes(32))}`;
      case 'argon2id':   return `$argon2id$v=19$m=65536,t=3,p=1$${toB64u(bytes(16))}$${toB64u(bytes(32))}`;
      case 'hkdf':       return `salt=${toHex(bytes(16))}; ikm=${toHex(bytes(32))}`;
      case 'bcrypt':     return `$2b$12$${fromAlpha(22, B62)}${fromAlpha(31, B62)}`;
      // MACs/KDFs — extended
      case 'argon2i':     return `$argon2i$v=19$m=65536,t=3,p=1$${toB64u(bytes(16))}$${toB64u(bytes(32))}`;
      case 'argon2d':     return `$argon2d$v=19$m=65536,t=3,p=1$${toB64u(bytes(16))}$${toB64u(bytes(32))}`;
      case 'balloon':     return `$balloon$m=8192,t=3$${toB64u(bytes(16))}$${toB64u(bytes(32))}`;
      case 'catena':      return `$catena-brh$g=18$${toB64u(bytes(16))}$${toB64u(bytes(32))}`;
      case 'lyra2':       return `$lyra2$t=3,m=64$${toB64u(bytes(16))}$${toB64u(bytes(32))}`;
      case 'yescrypt':    return `$y$j9T$${fromAlpha(22, B62)}$${fromAlpha(43, B62)}`;
      case 'pufferfish':  return `$PF2$15$${fromAlpha(22, B62)}${fromAlpha(31, B62)}`;
      case 'concat_kdf':  return toHex(bytes(32));
      case 'x963_kdf':    return toHex(bytes(32));
      case 'kbkdf_ctr':   return toHex(bytes(32));
      case 'kbkdf_fb':    return toHex(bytes(32));
      case 'sshkdf':      return toHex(bytes(32));
      case 'tlsprf12':    return toHex(bytes(48));
      case 'tlskdf13':    return toHex(bytes(32));
      case 'sigmamac':    return toHex(bytes(32));
      case 'umac':        return toHex(bytes(16));
      case 'vmac':        return toHex(bytes(16));
      case 'cbcmac':      return toHex(bytes(16));
      case 'pmac':        return toHex(bytes(16));
      case 'ocb_mac':     return toHex(bytes(16));
      case 'cha_poly_mac':return toHex(bytes(16));

      // Identifiers
      case 'uuid4':     return uuid4();
      case 'uuid7':     return uuid7();
      case 'uuid1':     return uuid1();
      case 'uuid3':     return await uuidNamespaced('SHA-1', '6ba7b8109dad11d180b400c04fd430c8', 'opencriptg-' + Date.now() + '-' + rint(1e9));
      case 'uuid5':     return await uuidNamespaced('SHA-1', '6ba7b8109dad11d180b400c04fd430c8', 'ocg-' + Date.now() + '-' + rint(1e9));
      case 'ulid':      return ulid();
      case 'nanoid':    return fromAlpha(L || 21, '_-' + ALPHANUM);
      case 'cuid2':     return 'c' + fromAlpha(23, '0123456789abcdefghijklmnopqrstuvwxyz');
      case 'ksuid':     return ksuid();
      case 'snowflake': return snowflake();
      case 'objectid':  return objectId();
      case 'shortid':   return fromAlpha(L || 12, '_-' + ALPHANUM);

      // Tokens
      case 'apikey':     return (o.prefix || 'ocg_') + password(L || 32, { upper: o.upper !== false, lower: o.lower !== false, num: o.num !== false, sym: !!o.sym });
      case 'bearer':     return toB64u(bytes(48));
      case 'jwt_secret': return toB64(bytes(64));
      case 'session':    return toHex(bytes(32));
      case 'csrf':       return toB64u(bytes(32));
      case 'refresh':    return toB64u(bytes(64));
      case 'totp':       return toB32(bytes(20));
      case 'hotp':       return toB32(bytes(20));
      case 'webhook':    return 'whsec_' + toB64u(bytes(32));
      case 'recovery':   return recoveryCodes();
      case 'invite':     return fromAlpha(L || 12, B62);
      case 'license':    return license();
      case 'serial':     return serial();
      case 'pin4':       return pin(4);
      case 'pin6':       return pin(6);
      case 'pin8':       return pin(8);
      // Tokens — 50 new digital token types
      case 'pat':         return 'pat_' + toHex(bytes(40));
      case 'github_pat':  return 'ghp_' + fromAlpha(36, B62);
      case 'gitlab_pat':  return 'glpat-' + fromAlpha(20, B62);
      case 'slack_bot':   return 'xoxb-' + fromAlpha(11, '0123456789') + '-' + fromAlpha(12, '0123456789') + '-' + fromAlpha(24, B62);
      case 'stripe_sk':   return 'sk_live_' + fromAlpha(24, B62);
      case 'stripe_pk':   return 'pk_live_' + fromAlpha(24, B62);
      case 'sendgrid':    return 'SG.' + fromAlpha(22, B62) + '.' + fromAlpha(43, B62);
      case 'mailgun':     return 'key-' + toHex(bytes(16));
      case 'twilio':      return toHex(bytes(16));
      case 'aws_akid':    return 'AKIA' + fromAlpha(16, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567');
      case 'aws_secret':  return toB64(bytes(30)).slice(0, 40);
      case 'gcp_sa':      return toHex(bytes(40));
      case 'azure_sas':   return 'sv=2024-01-01&sig=' + toB64u(bytes(32)) + '&se=' + new Date(Date.now()+3600000).toISOString();
      case 'do_pat':      return 'dop_v1_' + toHex(bytes(32));
      case 'heroku':      return uuid4();
      case 'firebase':    return toB64u(bytes(32)) + '.' + toB64u(bytes(64)) + '.' + toB64u(bytes(32));
      case 'supabase': {
        const hdr = toB64u(enc.encode(JSON.stringify({alg:'HS256',typ:'JWT'})));
        const pay = toB64u(enc.encode(JSON.stringify({iss:'supabase',ref:fromAlpha(20, 'abcdefghijklmnopqrstuvwxyz'),role:'anon',iat:Math.floor(Date.now()/1000)})));
        return hdr + '.' + pay + '.' + toB64u(bytes(32));
      }
      case 'oauth_code':  return toB64u(bytes(40));
      case 'pkce_ver':    return toB64u(bytes(48));
      case 'pkce_chal':   return toB64u(await sha('SHA-256', bytes(48)));
      case 'pkce_pair':   return await pkcePair();
      case 'magic_link':  return 'mlk_' + toB64u(bytes(48));
      case 'reset_pwd':   return 'rst_' + toB64u(bytes(32)) + '.' + (Date.now() + 3600000).toString(36);
      case 'verify_email':return 'vfy_' + toB64u(bytes(32));
      case 'totp_uri':    return `otpauth://totp/opencriptG:user@example.com?secret=${toB32(bytes(20))}&issuer=opencriptG`;
      case 'webauthn':    return toB64u(bytes(64));
      case 'fido_chal':   return toB64u(bytes(32));
      case 'apns_dev':    return toHex(bytes(32));
      case 'fcm_token':   return fromAlpha(11, B62) + ':' + fromAlpha(140, B62 + '_-');
      case 'jwt_full': {
        return await signJwtHS256({}, bytes(64));
      }
      case 'jwt_hs256_real': return await signJwtHS256({ amr: ['pwd', 'webauthn'], typ: 'access' }, bytes(64));
      case 'paseto_v4':   return 'v4.local.' + toB64u(bytes(64));
      case 'paseto_pub':  return 'v4.public.' + toB64u(bytes(96));
      case 'macaroon':    return toB64u(bytes(96));
      case 'biscuit':     return 'En0KEwgKEgg' + fromAlpha(120, B62 + '_-');
      case 'sas_token':   return `sig=${toB64u(bytes(32))}&se=${Math.floor(Date.now()/1000)+3600}&sr=b&sp=r`;
      case 'ticket':      return 'TKT-' + toB32(bytes(20));
      case 'voucher':     { const blk = () => fromAlpha(4, 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'); return `${blk()}-${blk()}-${blk()}-${blk()}`; }
      case 'coupon':      return fromAlpha(8, B32C);
      case 'gift_card':   { const blk = () => fromAlpha(4, B62); return `${blk()}-${blk()}-${blk()}-${blk()}`; }
      case 'tracking':    return fromAlpha(12, B62);
      case 'order_no':    { const d = new Date(); const ymd = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`; return `OCG-${ymd}-${fromAlpha(5, '0123456789')}`; }
      case 'tx_id':       return toHex(bytes(16));
      case 'didkey':      return 'did:key:z' + toB58(bytes(32));
      case 'didweb':      return 'did:web:opencriptg.io:user:' + fromAlpha(12, 'abcdefghijklmnopqrstuvwxyz0123456789');
      case 'vc_jwt': {
        const hdr = toB64u(enc.encode(JSON.stringify({alg:'EdDSA',typ:'JWT'})));
        const pay = toB64u(enc.encode(JSON.stringify({iss:'did:key:z'+toB58(bytes(16)),vc:{type:['VerifiableCredential']}})));
        return hdr + '.' + pay + '.' + toB64u(bytes(64));
      }
      case 'btc_addr':    return 'bc1q' + fromAlpha(38, 'qpzry9x8gf2tvdw0s3jn54khce6mua7l');
      case 'eth_addr':    return '0x' + toHex(bytes(20));
      case 'sol_addr':    return toB58(bytes(32));
      case 'mnemonic12':  return passphrase(12, BIP39, ' ');
      case 'mnemonic24':  return passphrase(24, BIP39, ' ');
      case 'qr_secret':   return `otpauth://totp/opencriptG-QR?secret=${toB32(bytes(32))}`;
      case 'one_time':    return 'otu_' + toB64u(bytes(32));
      case 'device_id':   return uuid4();
      case 'install_id':  return uuid7();
      case 'aead_token_envelope': return await aesGcmTokenEnvelope();
      case 'token_fingerprint':   return await tokenFingerprintPacket();
      case 'hmac_signed_url':     return await hmacSignedUrlToken();
      case 'tokenization_packet': return await tokenizationPacket();
      case 'refresh_rotation_pair': {
        const family = uuid7();
        const current = 'rt_' + toB64u(bytes(48));
        const next = 'rt_' + toB64u(bytes(48));
        const currentHash = toHex(await sha('SHA-256', current));
        const nextHash = toHex(await sha('SHA-256', next));
        return `OCG-REFRESH-ROTATION.v1\nfamily=${family}\ncurrent=${current}\ncurrent_sha256=${currentHash}\nnext=${next}\nnext_sha256=${nextHash}\nreuse_detection=true`;
      }
      case 'dpop_nonce': {
        const nonce = toB64u(bytes(32));
        const htm = 'POST';
        const htu = 'https://api.local.opencriptg.test/token';
        const proofSeed = toHex(bytes(32));
        const thumbprint = toB64u(await sha('SHA-256', proofSeed));
        return `OCG-DPOP-NONCE.v1\nnonce=${nonce}\nhtm=${htm}\nhtu=${htu}\njwk_thumbprint=${thumbprint}\nproof_seed=${proofSeed}`;
      }
      case 'introspection_record': {
        const token = 'at_' + toB64u(bytes(36));
        const tokenHash = toHex(await sha('SHA-256', token));
        return JSON.stringify({
          active: true,
          token_preview: token.slice(0, 9) + '...' + token.slice(-8),
          token_sha256: tokenHash,
          client_id: 'ocg_client_' + toB64u(bytes(6)),
          scope: 'vault:read token:introspect',
          exp: Math.floor(Date.now() / 1000) + 600,
          iat: Math.floor(Date.now() / 1000),
          aud: 'opencriptG-local'
        }, null, 2);
      }

      // Passwords
      case 'password':     return password(L || 16, o);
      case 'pwd_pron':     return pronounceable(L || 12);
      case 'passphrase':   return passphrase(Math.max(2, Math.min(12, Math.round((L||32)/6))), WORDS, '-');
      case 'passphrase_b': return passphrase(Math.max(12, Math.min(24, Math.round((L||72)/6))), BIP39, ' ');
      case 'pwd_alpha':    return fromAlpha(L || 16, ALPHA);
      case 'pwd_alphanum': return fromAlpha(L || 16, ALPHANUM);
      case 'pwd_numeric':  return fromAlpha(L || 8, '0123456789');
      case 'pwd_xkcd':     return xkcdPwd();
      case 'pwd_emoji':    return fromAlpha(L || 16, ALPHANUM + SYMBOLS + SYMBOLS);
      case 'wifi_wpa2':    return fromAlpha(63, ALPHANUM + '-_.');

      // Encoding
      case 'random_hex':   return toHex(bytes(Math.ceil((L||32)/2))).slice(0, L||32);
      case 'random_b64':   return toB64(bytes(Math.ceil((L||32)*3/4))).slice(0, L||32);
      case 'random_b64u':  return toB64u(bytes(Math.ceil((L||32)*3/4))).slice(0, L||32);
      case 'random_b32':   return toB32(bytes(Math.ceil((L||32)*5/8))).slice(0, L||32);
      case 'random_b32c':  return toB32(bytes(Math.ceil((L||32)*5/8)), B32C).slice(0, L||32);
      case 'random_b58':   return toB58(bytes(Math.ceil((L||32)*3/4))).slice(0, L||32);
      case 'random_b62':   return fromAlpha(L||32, B62);
      case 'random_b85':   return fromAlpha(L||32, Z85);
      case 'random_bin':   { const b=bytes(Math.ceil((L||32)/8)); let s=''; for (const x of b) s+=x.toString(2).padStart(8,'0'); return s.slice(0,L||32); }
      case 'random_oct':   { const b=bytes(Math.ceil((L||32)/3)); let s=''; for (const x of b) s+=x.toString(8).padStart(3,'0'); return s.slice(0,L||32); }
      case 'random_bytes': { const b=bytes(L||16); return [...b].map(x=>'\\x'+x.toString(16).padStart(2,'0')).join(''); }
      case 'random_emoji': { let s=''; for(let i=0;i<(L||16);i++) s+=EMOJI_ARR[rint(EMOJI_ARR.length)]; return s; }

      // Post-Quantum (seed material — sized per category)
      case 'kyber512':   return toB64(bytes(800));
      case 'kyber768':   return toB64(bytes(1184));
      case 'kyber1024':  return toB64(bytes(1568));
      case 'dilithium2': return toB64(bytes(1312));
      case 'dilithium3': return toB64(bytes(1952));
      case 'dilithium5': return toB64(bytes(2592));
      case 'falcon512':  return toB64(bytes(897));
      case 'falcon1024': return toB64(bytes(1793));
      case 'sphincs':    return toB64(bytes(64));
      case 'frodo640':   return toB64(bytes(976));
      case 'frodo976':   return toB64(bytes(1456));
      case 'classic_mc': return toB64(bytes(261120)).slice(0, 256) + '…';
      case 'bike1':      return toB64(bytes(2541));
      case 'hqc128':     return toB64(bytes(2249));

      // ── Modern & Hardened ──
      // Post-Quantum / Hybrid
      case 'mlkem512_hyb':   return `mlkem512=${toB64(bytes(800))}; x25519=${toB64u(bytes(32))}`;
      case 'mlkem768_hyb':   return `mlkem768=${toB64(bytes(1184))}; x25519=${toB64u(bytes(32))}`;
      case 'mlkem1024_hyb':  return `mlkem1024=${toB64(bytes(1568))}; x448=${toHex(bytes(56))}`;
      case 'mldsa44_hyb':    return `mldsa44=${toB64(bytes(1312))}; ed25519=${toB64u(bytes(32))}`;
      case 'mldsa65_hyb':    return `mldsa65=${toB64(bytes(1952))}; ed25519=${toB64u(bytes(32))}`;
      case 'mldsa87_hyb':    return `mldsa87=${toB64(bytes(2592))}; ed448=${toHex(bytes(57))}`;
      case 'slhdsa128s':     return toB64(bytes(64));
      case 'slhdsa128f':     return toB64(bytes(64));
      case 'slhdsa192s':     return toB64(bytes(96));
      case 'slhdsa256s':     return toB64(bytes(128));
      case 'xmss':           return toB64u(bytes(132));
      case 'lms':            return toB64u(bytes(60));
      case 'xmssmt':         return toB64u(bytes(132));
      case 'hsslms':         return toB64u(bytes(60));
      case 'kyber_x448':     return `kyber768=${toB64(bytes(1184))}; x448=${toHex(bytes(56))}`;
      case 'pqxdh':          return `spk=${toB64u(bytes(32))}; pq_pre=${toB64(bytes(800))}; sig=${toB64u(bytes(64))}`;

      // Threshold / MPC / Distributed
      case 'shamir3of5':     { const idx = 1 + rint(5); return `share-${idx}/5: ${toHex(bytes(33))}`; }
      case 'shamir5of9':     { const idx = 1 + rint(9); return `share-${idx}/9: ${toHex(bytes(33))}`; }
      case 'feldman_vss':    return `share=${toHex(bytes(32))}; commit=${toHex(bytes(33))}`;
      case 'pedersen_vss':   return `share=${toHex(bytes(32))}; commit=${toHex(bytes(64))}`;
      case 'frost':          return `id=${rint(1000)}; share=${toHex(bytes(32))}; vk=${toHex(bytes(32))}`;
      case 'gg20':           return `share=${toHex(bytes(32))}; paillier_n=${toHex(bytes(256)).slice(0, 64)}…`;
      case 'cgg21':          return `share=${toHex(bytes(32))}; aux=${toHex(bytes(64))}`;
      case 'mpc_seed':       return `shard-${1+rint(3)}/3: ${toB64(bytes(32))}`;
      case 'tss_dkg':        return `dkg_share=${toHex(bytes(32))}; pubkey=${toHex(bytes(33))}`;
      case 'spdz_share':     return `[x]=${toHex(bytes(16))}; [αx]=${toHex(bytes(16))}`;
      case 'bgw_share':      return `f(${1+rint(7)})=${toHex(bytes(32))}`;
      case 'beaver_triple':  return `[a]=${toHex(bytes(16))}; [b]=${toHex(bytes(16))}; [c]=${toHex(bytes(16))}`;
      case 'gg18':           return `xi=${toHex(bytes(32))}; Xi=${toHex(bytes(33))}`;
      case 'lindell17':      return `share_p1=${toHex(bytes(32))}; paillier=${toHex(bytes(64))}`;
      case 'doerner18':      return `ot_share=${toHex(bytes(32))}; pubkey=${toHex(bytes(33))}`;

      // Zero-Knowledge
      case 'zk_groth16_pk':  return `pk_groth16=${toB64(bytes(96))}…`;
      case 'zk_plonk_pk':    return `pk_plonk=${toB64(bytes(96))}…`;
      case 'zk_halo2_pk':    return `pk_halo2=${toHex(bytes(64))}`;
      case 'zk_stark_seed':  return toHex(bytes(32));
      case 'zk_bulletproof': return `commit=${toHex(bytes(33))}; blinding=${toHex(bytes(32))}`;
      case 'zk_nova':        return `nova_z0=${toHex(bytes(32))}`;
      case 'zk_sonic':       return toHex(bytes(64));
      case 'zk_marlin':      return toHex(bytes(64));
      case 'zk_aurora':      return toHex(bytes(32));
      case 'zk_ligero':      return toHex(bytes(32));
      case 'zk_spartan':     return toHex(bytes(32));
      case 'zk_brakedown':   return toHex(bytes(32));
      case 'zk_binius':      return toHex(bytes(32));
      case 'zk_lasso':       return toHex(bytes(32));
      case 'zk_jolt':        return `jolt_pk=${toHex(bytes(64))}`;

      // High-margin AEAD & Modern Ciphers
      case 'ascon128a':      return `key=${toHex(bytes(16))}; nonce=${toHex(bytes(16))}`;
      case 'ascon80pq':      return `key=${toHex(bytes(20))}; nonce=${toHex(bytes(16))}`;
      case 'isap':           return `key=${toHex(bytes(16))}; nonce=${toHex(bytes(16))}`;
      case 'photon_beetle':  return `key=${toHex(bytes(16))}; nonce=${toHex(bytes(16))}`;
      case 'romulus':        return `key=${toHex(bytes(16))}; nonce=${toHex(bytes(16))}`;
      case 'tinyjambu':      return `key=${toHex(bytes(16))}; nonce=${toHex(bytes(12))}`;
      case 'sparkle':        return `key=${toHex(bytes(32))}; nonce=${toHex(bytes(32))}`;
      case 'hbsh':           return toHex(bytes(32));
      case 'adiantum':       return toHex(bytes(32));
      case 'hctr2':          return toHex(bytes(32));
      case 'morus_aead':     return `key=${toHex(bytes(32))}; nonce=${toHex(bytes(16))}`;
      case 'colm':           return toHex(bytes(16));
      case 'jambu':          return `key=${toHex(bytes(16))}; iv=${toHex(bytes(8))}`;
      case 'acorn':          return `key=${toHex(bytes(16))}; iv=${toHex(bytes(16))}`;
      case 'norx':           return `key=${toHex(bytes(16))}; nonce=${toHex(bytes(16))}`;

      // Modern Hashes & VRFs
      case 'blake3_keyed':   return `key=${toHex(bytes(32))}; out=${toHex(await sha('SHA-256', bytes(64)))}`;
      case 'blake3_xof':     { const sz = Math.max(16, Math.min(128, L || 64)); return toHex(bytes(sz)); }
      case 'blake3_kdf':     return `ctx="opencriptG v1"; out=${toHex(await sha('SHA-256', bytes(64)))}`;
      case 'k12':            return toHex(await sha('SHA-256', bytes(64)));
      case 'm14':            return toHex(await sha('SHA-512', bytes(64)));
      case 'turboshake128':  return toHex(await sha('SHA-256', bytes(64)));
      case 'turboshake256':  return toHex(await sha('SHA-512', bytes(64)));
      case 'kmac_xof':       return toHex(bytes(32));
      case 'parallelhash':   return toHex(await sha('SHA-256', bytes(64)));
      case 'tuplehash':      return toHex(await sha('SHA-256', bytes(64)));
      case 'rescue_prime':   return toHex(bytes(32));
      case 'poseidon2':      return toHex(bytes(32));
      case 'mimc':           return toHex(bytes(32));
      case 'griffin':        return toHex(bytes(32));
      case 'tip5':           return toHex(bytes(20));
      case 'reinforced_concrete': return toHex(bytes(32));
      case 'anemoi':         return toHex(bytes(32));
      case 'vrf_ed25519':    return `proof=${toHex(bytes(80))}; output=${toHex(bytes(64))}`;
      case 'vrf_ristretto':  return `proof=${toHex(bytes(80))}; output=${toHex(bytes(64))}`;
      case 'vrf_secp256k1':  return `proof=${toHex(bytes(81))}; output=${toHex(bytes(32))}`;

      // Identity-Based / Pairing-Based / Modern Sigs
      case 'bls_sig':        return `sk=${toHex(bytes(32))}; pk=${toHex(bytes(48))}`;
      case 'bls_agg':        return `agg_sig=${toHex(bytes(96))}`;
      case 'bn_sig':         return toHex(bytes(64));
      case 'schnorr_sig':    return toHex(bytes(64));
      case 'musig2':         return `share_sk=${toHex(bytes(32))}; nonce=${toHex(bytes(66))}`;
      case 'frost_sec':      return `id=${1+rint(7)}; share=${toHex(bytes(32))}`;
      case 'taproot':        return toHex(bytes(32));
      case 'silent_payment': return `scan=${toHex(bytes(32))}; spend=${toHex(bytes(32))}`;
      case 'ecvrf':          return `proof=${toHex(bytes(80))}; β=${toHex(bytes(64))}`;
      case 'ring_sig':       return `ring=[${Array.from({length:5},()=>toHex(bytes(33))).join(', ')}]; sig=${toHex(bytes(64))}`;
      case 'group_sig':      return `gpk_sig=${toHex(bytes(96))}`;
      case 'blind_sig':      return toHex(bytes(256));
      case 'bbs_plus':       return `sig=${toHex(bytes(112))}`;
      case 'ps_sig':         return `σ=${toHex(bytes(96))}`;
      case 'cl_sig':         return toHex(bytes(256));
      case 'pop_sig':        return `pop=${toHex(bytes(96))}`;

      // Hardened Tokens & Modern Auth
      case 'cwt': {
        const hdr = toB64u(enc.encode(JSON.stringify({alg:'ES256',typ:'CWT'})));
        return `cwt:${hdr}.${toB64u(bytes(48))}.${toB64u(bytes(64))}`;
      }
      case 'macaroon_v2':    return 'M2:' + toB64u(bytes(96));
      case 'biscuit_v3':     return 'En4KFAgMEgg' + fromAlpha(140, B62 + '_-');
      case 'paseto_v3':      return 'v3.local.' + toB64u(bytes(64));
      case 'paseto_v3_pub':  return 'v3.public.' + toB64u(bytes(96));
      case 'oprf':           return `blind=${toHex(bytes(32))}; output=${toHex(bytes(32))}`;
      case 'opaque':         return `envelope=${toB64u(bytes(96))}; pk_s=${toHex(bytes(33))}`;
      case 'spake2':         return `share=${toHex(bytes(32))}; w=${toHex(bytes(32))}`;
      case 'cpace':          return `Y=${toHex(bytes(32))}; ya=${toHex(bytes(32))}`;
      case 'srp6a':          return `v=${toHex(bytes(256))}; s=${toHex(bytes(16))}`;
      case 'attest_passkey': {
        const aaguid = toHex(bytes(16));
        return `aaguid=${aaguid}; credId=${toB64u(bytes(64))}; sig=${toB64u(bytes(72))}`;
      }

      // ── Token Cards (multi-line digital cards) ──
      case 'card_payment': {
        // Mock Luhn-valid 16-digit PAN
        const brands = [{n:'VISA',p:'4'},{n:'MASTERCARD',p:'5'},{n:'AMEX',p:'37'},{n:'DISCOVER',p:'6011'}];
        const br = brands[rint(brands.length)];
        let body = br.p; while (body.length < 15) body += String(rint(10));
        // Luhn check digit
        let sum = 0;
        for (let i = 0; i < body.length; i++) {
          let d = +body[body.length - 1 - i];
          if (i % 2 === 0) { d *= 2; if (d > 9) d -= 9; }
          sum += d;
        }
        const check = (10 - (sum % 10)) % 10;
        const pan = body + check;
        const fmt = pan.match(/.{1,4}/g).join(' ');
        const mm = String(1 + rint(12)).padStart(2,'0');
        const yy = String(28 + rint(6));
        const cvv = fromAlpha(br.n === 'AMEX' ? 4 : 3, '0123456789');
        const holder = ['EMIL E P MORA','ALEX JONES','SAM CARTER','JORDAN LEE'][rint(4)];
        const tok = 'tok_' + toHex(bytes(12));
        return `┌─ ${br.n} ──────────────────────────────┐\n│ ${fmt}  │\n│ ${holder.padEnd(20)} ${mm}/${yy}  CVV ${cvv}    │\n│ token: ${tok}        │\n└─────────────────────────────────────────┘`;
      }
      case 'card_loyalty': {
        const brands = ['STARBUCKS','SEPHORA','REI CO-OP','UNITED MP','HILTON HONORS'];
        const br = brands[rint(brands.length)];
        const member = fromAlpha(12, B62);
        const tier = ['BRONZE','SILVER','GOLD','PLATINUM','DIAMOND'][rint(5)];
        const points = rint(50000);
        const since = 2018 + rint(7);
        return `┌─ ${br.padEnd(28)} ─┐\n│ Member  ${member}             │\n│ Tier    ${tier.padEnd(20)}│\n│ Points  ${String(points).padStart(6,' ')} pts            │\n│ Since   ${since}                  │\n└─────────────────────────────────┘`;
      }
      case 'card_access': {
        const facility = ['HQ-NYC','LAB-SF','OFFICE-LDN','DC-FRA','OFC-TKY'][rint(5)];
        const uid = toHex(bytes(7)).toUpperCase();
        const sectorKey = toHex(bytes(6)).toUpperCase();
        const lvl = ['L1','L2','L3','L4-RESTRICTED'][rint(4)];
        const expires = new Date(Date.now() + 365*24*3600*1000).toISOString().slice(0,10);
        return `┌─ FACILITY ACCESS ────────────────┐\n│ Site    ${facility.padEnd(24)}│\n│ UID     ${uid.padEnd(24)}│\n│ Sector  ${sectorKey.padEnd(24)}│\n│ Clear   ${lvl.padEnd(24)}│\n│ Expires ${expires.padEnd(24)}│\n└──────────────────────────────────┘`;
      }
      case 'card_transit': {
        const op = ['MTA NYC','TfL OYSTER','JR EAST','SNCF NAVIGO','CTA VENTRA'][rint(5)];
        const serial = toHex(bytes(5)).toUpperCase();
        const balance = (rint(15000)/100).toFixed(2);
        const zones = ['1-2','1-3','1-6','ALL'][rint(4)];
        return `┌─ ${op.padEnd(28)} ─┐\n│ Serial  ${serial.padEnd(20)}    │\n│ Balance $${balance.padStart(8,' ')}              │\n│ Zones   ${zones.padEnd(20)}    │\n│ Type    REGULAR             │\n└─────────────────────────────────┘`;
      }
      case 'card_id': {
        const issuer = ['CA DMV','NY DMV','TX DPS','FL DHSMV','UK DVLA'][rint(5)];
        const did = 'did:key:z' + toB58(bytes(20)).slice(0, 22);
        const dob = `19${70+rint(35)}-${String(1+rint(12)).padStart(2,'0')}-${String(1+rint(28)).padStart(2,'0')}`;
        const exp = `20${30+rint(5)}-${String(1+rint(12)).padStart(2,'0')}-${String(1+rint(28)).padStart(2,'0')}`;
        const cls = ['C','M','CDL-A','CDL-B'][rint(4)];
        return `┌─ DIGITAL ID  (mDL) ──────────────────┐\n│ Issuer  ${issuer.padEnd(28)}│\n│ DID     ${did.slice(0,28).padEnd(28)}│\n│ DOB     ${dob.padEnd(28)}│\n│ Exp     ${exp.padEnd(28)}│\n│ Class   ${cls.padEnd(28)}│\n└──────────────────────────────────────┘`;
      }
      case 'card_health': {
        const ins = ['BLUE CROSS','UNITED HC','AETNA','KAISER','CIGNA'][rint(5)];
        const member = fromAlpha(12, B62);
        const group = fromAlpha(8, '0123456789');
        const plan = ['HMO','PPO','EPO','POS','HDHP'][rint(5)];
        const rxbin = String(100000 + rint(900000));
        return `┌─ ${ins.padEnd(30)} ┐\n│ Member  ${member.padEnd(22)}     │\n│ Group   ${group.padEnd(22)}     │\n│ Plan    ${plan.padEnd(22)}     │\n│ RxBIN   ${rxbin.padEnd(22)}     │\n└────────────────────────────────────┘`;
      }
      case 'card_membership': {
        const orgs = ['MOMA NY','GOLD\'S GYM','COSTCO','AMC A-LIST','NYT SUBSCRIBER'];
        const org = orgs[rint(orgs.length)];
        const tier = ['BASIC','PLUS','PREMIUM','ELITE'][rint(4)];
        const member = fromAlpha(10, B62);
        const since = 2015 + rint(10);
        return `┌─ ${org.padEnd(26)} ─┐\n│ Tier    ${tier.padEnd(22)}│\n│ Member  ${member.padEnd(22)}│\n│ Since   ${since.toString().padEnd(22)}│\n│ Status  ACTIVE                │\n└─────────────────────────────────┘`;
      }
      case 'card_event': {
        const events = ['COACHELLA 2026','SF GIANTS · APR 12','BROADWAY · HAMILTON','TED 2026','GLASTONBURY 2026'];
        const ev = events[rint(events.length)];
        const seat = `${'ABCDEFGH'[rint(8)]}${1+rint(40)}`;
        const sec = String(100 + rint(300));
        const bcp = fromAlpha(20, B62);
        const date = new Date(Date.now() + rint(90)*24*3600*1000).toISOString().slice(0,10);
        return `┌─ EVENT TICKET ────────────────────────┐\n│ ${ev.padEnd(36)} │\n│ Date    ${date.padEnd(28)}  │\n│ Section ${sec.padEnd(28)}  │\n│ Seat    ${seat.padEnd(28)}  │\n│ Code    ${bcp.padEnd(28)}  │\n└───────────────────────────────────────┘`;
      }
      case 'card_gift': {
        const brands = ['AMAZON','APPLE','SPOTIFY','TARGET','VISA GIFT'];
        const br = brands[rint(brands.length)];
        const blk = () => fromAlpha(4, '0123456789ABCDEFGHJKMNPQRSTVWXYZ');
        const code = `${blk()}-${blk()}-${blk()}-${blk()}`;
        const pin = fromAlpha(8, '0123456789');
        const amt = [10,25,50,100,200,500][rint(6)];
        return `┌─ GIFT CARD ────────────────────────┐\n│ Brand   ${br.padEnd(26)} │\n│ Amount  $${String(amt).padEnd(25)} │\n│ Code    ${code.padEnd(26)} │\n│ PIN     ${pin.padEnd(26)} │\n└────────────────────────────────────┘`;
      }
      case 'card_vehicle': {
        const makes = ['BMW iX','TESLA M3','PORSCHE TAYCAN','AUDI Q6 e-tron','HYUNDAI IONIQ 5'];
        const make = makes[rint(makes.length)];
        const vin = fromAlpha(17, 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789');
        const cred = toHex(bytes(16));
        const cert = toHex(bytes(20)).toUpperCase().slice(0, 24);
        return `┌─ DIGITAL VEHICLE KEY ─────────────────┐\n│ Vehicle ${make.padEnd(28)}  │\n│ VIN     ${vin.padEnd(28)}  │\n│ KeyCred ${cred.padEnd(28)}  │\n│ Cert    ${cert.padEnd(28)}  │\n│ Type    OWNER · UNRESTRICTED       │\n└───────────────────────────────────────┘`;
      }
      case 'card_crypto': {
        const chains = [
          {n:'BITCOIN',  pre:'bc1q', alpha:'qpzry9x8gf2tvdw0s3jn54khce6mua7l', len:38},
          {n:'ETHEREUM', pre:'0x',   hex:true, len:40},
          {n:'SOLANA',   pre:'',     b58:true, len:32},
          {n:'POLYGON',  pre:'0x',   hex:true, len:40},
        ];
        const c = chains[rint(chains.length)];
        let addr;
        if (c.hex) addr = c.pre + toHex(bytes(20));
        else if (c.b58) addr = toB58(bytes(32));
        else addr = c.pre + fromAlpha(c.len, c.alpha);
        const pubkey = '0x' + toHex(bytes(33));
        const ens = `user${rint(9999)}.eth`;
        return `┌─ CRYPTO WALLET ───────────────────────┐\n│ Chain   ${c.n.padEnd(28)}  │\n│ Addr    ${addr.slice(0, 28).padEnd(28)}  │\n│ PubKey  ${pubkey.slice(0,28).padEnd(28)}  │\n│ ENS     ${ens.padEnd(28)}  │\n└───────────────────────────────────────┘`;
      }
      case 'card_vc': {
        const types = ['UniversityDegree','EmploymentPass','VaccinationCert','ProofOfAge','OpenBadge'];
        const t = types[rint(types.length)];
        const issuer = 'did:web:' + ['mit.edu','gov.uk','who.int','meta.com','badge.io'][rint(5)];
        const subject = 'did:key:z' + toB58(bytes(20)).slice(0, 22);
        const iss = new Date().toISOString().slice(0,10);
        const status = 'StatusList2021#' + rint(100000);
        return `┌─ VERIFIABLE CREDENTIAL ───────────────┐\n│ Type    ${t.padEnd(28)}  │\n│ Issuer  ${issuer.slice(0,28).padEnd(28)}  │\n│ Subject ${subject.slice(0,28).padEnd(28)}  │\n│ Issued  ${iss.padEnd(28)}  │\n│ Status  ${status.slice(0,28).padEnd(28)}  │\n└───────────────────────────────────────┘`;
      }

      default: return toHex(bytes(L || 32));
    }
  }

  // Shorten very long outputs for display (full value still copied)
  function display(v, max = 280) {
    if (v.length <= max) return v;
    return v.slice(0, max) + '…';
  }

  window.OCG_GEN = { generate, display };
})();
