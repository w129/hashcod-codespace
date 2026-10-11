'use strict';
// End-to-end over HTTP: gate, sealing, files, public verification page/API, did.json and the hcod CLI.
const assert = require('node:assert/strict');
const { spawn, execFileSync } = require('node:child_process');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path'), crypto = require('node:crypto');
const root = path.resolve(__dirname, '../..');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cst-http-'));
const tsaDir = path.join(tmp, 'tsa'); fs.mkdirSync(tsaDir);
const sh = cmd => execFileSync('bash', ['-c', cmd], { stdio: 'pipe' });
sh(`cd ${tsaDir} && openssl req -x509 -newkey rsa:2048 -nodes -keyout ca.key -out cacert.pem -subj '/CN=Test CA' -days 2 2>/dev/null && openssl req -newkey rsa:2048 -nodes -keyout tsa.key -out tsa.csr -subj '/CN=Test TSA' 2>/dev/null && printf 'extendedKeyUsage=critical,timeStamping\\n' > ext.cnf && openssl x509 -req -in tsa.csr -CA cacert.pem -CAkey ca.key -CAcreateserial -out tsa.crt -days 2 -extfile ext.cnf 2>/dev/null && echo 01 > tsaserial`);
fs.writeFileSync(path.join(tsaDir, 'tsa.cnf'), `[ tsa ]\ndefault_tsa = t\n[ t ]\ndir = ${tsaDir}\nserial = $dir/tsaserial\ncrypto_device = builtin\nsigner_cert = $dir/tsa.crt\ncerts = $dir/cacert.pem\nsigner_key = $dir/tsa.key\nsigner_digest = sha256\ndefault_policy = 1.2.3.4.1\ndigests = sha256, sha512\naccuracy = secs:1\nordering = yes\ntsa_name = yes\ness_cert_id_alg = sha256\n`);
const tsaPort = 21000 + Math.floor(Math.random() * 5000), appPort = 27000 + Math.floor(Math.random() * 5000);
const signature = crypto.randomBytes(2420).toString('base64');            // stand-in for an authorized signature
const sigHash = crypto.createHash('sha256').update(Buffer.from(signature, 'base64')).digest('hex');
const env = { ...process.env, TSA_DIR: tsaDir, HASHCOD_SEAL_DB: path.join(tmp, 'db.sqlite'), HASHCOD_SEAL_ED25519_SEED_B64: crypto.randomBytes(32).toString('base64'),
  HASHCOD_TSA_URL: `http://127.0.0.1:${tsaPort}/`, HASHCOD_TSA2_URL: 'off', HASHCOD_SEAL_ACCESS_SIGNATURE_SHA256: sigHash, HASHCOD_SEAL_DOMAIN: 'hashcodcodespace.dev', HASHCOD_TSA_CA_FILE: path.join(tsaDir, 'cacert.pem') };
const tsa = spawn('php', ['-S', `127.0.0.1:${tsaPort}`, path.join(root, 'tests/fixtures/local-tsa.php')], { env, stdio: 'ignore' });
const app = spawn('php', ['-S', `127.0.0.1:${appPort}`, 'router.php'], { env, cwd: root, stdio: 'ignore' });
const base = `http://127.0.0.1:${appPort}`;
const seal = o => execFileSync('php', ['-r', "require 'mldsa-access.php'; echo mldsaSeal(json_decode($argv[1],true));", JSON.stringify(o)], { cwd: root, encoding: 'utf8' }).trim();
const exp = Math.floor(Date.now() / 1000) + 86400;
const proCookie = seal({ kind: 'platform-period-v1', host: `127.0.0.1:${appPort}`, state: 'active', subscription: { tier: 'pro', expiresAt: exp + 800000 }, days: 10, expiresAt: exp, proExpiresAt: exp, token: 't' });
const consent = seal({ kind: 'policy-consent-v1', host: `127.0.0.1:${appPort}`, version: '2026.09.18-2', receipt: '0b9c1f3e-1a2b-4c3d-8e4f-5a6b7c8d9e0f', acceptedAt: Math.floor(Date.now() / 1000) });
let gate = '';
const call = async (p, opts = {}, withPro = true, withGate = true) => {
  const cookies = [withPro && `hashcod_platform_period_v1=${proCookie}; hashcod_policy_consent_v1=${consent}`, withGate && gate].filter(Boolean).join('; ');
  const r = await fetch(base + p, { redirect: 'manual', ...opts, headers: { ...(opts.json ? { 'Content-Type': 'application/json' } : {}), ...(cookies ? { Cookie: cookies } : {}), ...(opts.headers || {}) }, body: opts.json ? JSON.stringify(opts.json) : opts.body });
  return r;
};
const sleep = ms => new Promise(r => setTimeout(r, ms));
const form = { holderType: 'persona_juridica', holderName: 'Acme SRL', taxId: '1-31-12345-6', holderDid: 'did:web:acme.example', assetName: 'Modelo X', assetType: 'model', version: '1.0.0', description: 'Pruebas', aiUse: 'assisted', visibility: 'public', license: 'MIT', declaration: true, digest: crypto.createHash('sha512').update('asset').digest('hex') };

(async () => {
  try {
    for (let i = 0; i < 60; i++) { try { if ((await fetch(base + '/robots.txt')).ok) break; } catch {} await sleep(150); }
    // gate
    let r = await call('/api/constancia/status'); const st = await r.json();
    assert(st.ok && st.unlocked === false && st.configured.gate && st.configured.issuer && st.configured.tsa, 'status reports configuration, locked');
    r = await call('/api/constancia/seal', { method: 'POST', json: form }); assert.equal(r.status, 401, 'sealing is locked without the signature');
    r = await call('/api/constancia/unlock', { method: 'POST', json: { signature: crypto.randomBytes(2420).toString('base64') } }); assert.equal(r.status, 403, 'a wrong signature is refused');
    r = await call('/api/constancia/unlock', { method: 'POST', body: JSON.stringify({ signature }) }); assert.equal(r.status, 400, 'unlock needs a JSON content type (CSRF hardening)');
    r = await call('/api/constancia/unlock', { method: 'POST', json: { signature: `(${signature.slice(0, 100)}\n${signature.slice(100)})` } }); assert.equal(r.status, 200, 'the right signature (pasted with line breaks and parentheses) opens the tool');
    gate = r.headers.getSetCookie().map(c => c.split(';')[0]).find(c => c.startsWith('hashcod_seal_access_v1='));
    assert(gate, 'gate cookie issued');
    assert(r.headers.getSetCookie().some(c => /HttpOnly/i.test(c) && /SameSite=Strict/i.test(c)), 'gate cookie is HttpOnly + SameSite=Strict');
    // seal
    r = await call('/api/constancia/seal', { method: 'POST', json: { ...form, holderName: '' } }); assert.equal(r.status, 422, 'invalid fields are rejected');
    r = await call('/api/constancia/seal', { method: 'POST', json: form }); const sealed = await r.json();
    assert.equal(r.status, 201); assert(/^HC-\d{4}-000001$/.test(sealed.number) && sealed.pdfReady, 'first constancia sealed with its PDF');
    // files
    r = await call(`/api/constancia/file/${sealed.number}.pdf`); const pdf = Buffer.from(await r.arrayBuffer());
    assert(r.ok && pdf.subarray(0, 5).toString() === '%PDF-' && /application\/pdf/.test(r.headers.get('content-type')), 'PDF downloads');
    fs.writeFileSync(path.join(tmp, 'c.pdf'), pdf);
    assert(sh(`pdfdetach -list ${path.join(tmp, 'c.pdf')}`).toString().includes(sealed.number + '.cod'), 'the PDF carries the .cod');
    r = await call(`/api/constancia/file/${sealed.number}.cod`); const cod = Buffer.from(await r.arrayBuffer()); assert(r.ok && cod.length > 1000, '.cod downloads');
    r = await call('/api/constancia/list'); const list = await r.json(); assert(list.items.length === 1 && !JSON.stringify(list).includes('1-31-12345-6'), 'list never exposes the cédula/RNC');
    // public surfaces: no Pro period, no gate
    r = await call(`/api/constancia/public/${sealed.number}?h=${sealed.fingerprint.slice(0, 32)}`, {}, false, false); const pub = await r.json();
    assert(r.ok && pub.verify.ok && pub.chainVerified && pub.hMatches === true && pub.status === 'vigente' && pub.ledgerIntact, 'public JSON verifies everything without any session');
    r = await call(`/api/constancia/public/${sealed.number}?h=${'0'.repeat(32)}`, {}, false, false); assert.equal((await r.json()).hMatches, false, 'a wrong QR fingerprint is flagged');
    r = await call(`/verify/${sealed.number}?h=${'0'.repeat(32)}`, {}, false, false); const bad = await r.text();
    assert(r.ok && bad.includes('hashcodcodespace.dev') && bad.includes('NO coincide') && /default-src 'none'/.test(r.headers.get('content-security-policy')), 'verify page shows the domain and warns on a tampered QR, under a strict CSP');
    r = await call(`/verify/${sealed.number}?h=${sealed.fingerprint.slice(0, 32)}`, {}, false, false); const page = await r.text();
    assert(page.includes('vigente') && page.includes('Acme SRL') && page.includes('<svg') && page.includes('id="cv-drop"') && page.includes(`hcod verify ${sealed.number}`), 'verify page: state, holder, seal, drop zone and CLI hint');
    assert((await call('/verify/HC-2026-999999', {}, false, false)).status === 404, 'unknown constancia: 404');
    r = await call('/.well-known/did.json', {}, false, false); const did = await r.json();
    assert(r.ok && did.id === 'did:web:hashcodcodespace.dev' && did.assertionMethod.length === 1 && r.headers.get('access-control-allow-origin') === '*', 'did.json is public');
    assert((await call(`/api/constancia/file/${sealed.number}.pdf`, {}, false, false)).status !== 200, 'tool files are not public');
    // CLI
    fs.writeFileSync(path.join(tmp, 'asset.bin'), 'asset');
    const cli = execFileSync('php', ['bin/hcod', 'verify', sealed.number, '--base', base, '--ca', path.join(tsaDir, 'cacert.pem'), '--asset', path.join(tmp, 'asset.bin')], { cwd: root, encoding: 'utf8' });
    assert(cli.includes('all checks passed') && (cli.match(/ ✓ /g) || []).length === 5 && cli.includes('el archivo coincide'), 'hcod verify passes the five checks and the asset file');
    fs.writeFileSync(path.join(tmp, 'other.bin'), 'different');
    let failed = false; try { execFileSync('php', ['bin/hcod', 'verify', sealed.number, '--base', base, '--asset', path.join(tmp, 'other.bin')], { cwd: root, stdio: 'pipe' }); } catch (e) { failed = e.status === 1; }
    assert(failed, 'hcod verify exits 1 when the asset does not match');
    // revoke
    r = await call('/api/constancia/revoke', { method: 'POST', json: { number: sealed.number, reason: 'prueba' } }); assert(r.ok, 'revocation accepted');
    r = await call(`/api/constancia/public/${sealed.number}`, {}, false, false); const rev = await r.json(); assert(rev.status === 'revocada' && rev.ledgerIntact, 'public status turns revocada and the ledger stays intact');
    assert((await (await call(`/verify/${sealed.number}`, {}, false, false)).text()).includes('REVOCADA'), 'verify page says REVOCADA');
    // private visibility hides holder and asset
    r = await call('/api/constancia/seal', { method: 'POST', json: { ...form, visibility: 'private' } }); const priv = await r.json();
    const privPage = await (await call(`/verify/${priv.number}`, {}, false, false)).text();
    assert(!privPage.includes('Acme SRL') && !privPage.includes('Modelo X') && privPage.includes('Constancia privada'), 'private constancias hide holder and asset');
    assert((await call(`/api/constancia/public/${priv.number}.cod`, {}, false, false)).status === 403, 'private .cod is not public');
    // brute force protection
    for (let i = 0; i < 9; i++) await call('/api/constancia/unlock', { method: 'POST', json: { signature: crypto.randomBytes(2420).toString('base64') } });
    assert.equal((await call('/api/constancia/unlock', { method: 'POST', json: { signature } })).status, 429, 'unlock attempts are rate limited');
    console.log('Constancia HTTP: OK');
  } catch (e) { console.error(e); process.exitCode = 1; }
  finally { tsa.kill(); app.kill(); fs.rmSync(tmp, { recursive: true, force: true }); }
})();
