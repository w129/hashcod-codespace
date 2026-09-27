const fs=require('fs'),assert=require('assert');
const gate=fs.readFileSync('mldsa-access.php','utf8');
const api=fs.readFileSync('mldsa-access-api.php','utf8');
const css=fs.readFileSync('components/mldsa-access-gate.css','utf8');
const js=fs.readFileSync('components/mldsa-access-gate.js','utf8');
const l8=fs.readFileSync('l8-html.php','utf8');
const router=fs.readFileSync('router.php','utf8');
const req=fs.readFileSync('requirements-streamlit.txt','utf8');
const pubRaw=fs.readFileSync('config/mldsa87-access-public.b64','utf8');
const pub=pubRaw.replace(/\s+/g,'');
function crc32(str){let table=crc32.t;if(!table){table=crc32.t=Array.from({length:256},(_,n)=>{let c=n;for(let k=0;k<8;k++)c=(c&1)?(0xedb88320^(c>>>1)):(c>>>1);return c>>>0;});}let crc=0xffffffff;for(let i=0;i<str.length;i++)crc=table[(crc^str.charCodeAt(i))&255]^(crc>>>8);return (crc^0xffffffff)>>>0;}

assert.strictEqual(pub.length,3456,'ML-DSA-87 public key Base64 length must be exact');
assert(/^[A-Za-z0-9+/]+$/.test(pub),'ML-DSA-87 public key contains invalid Base64 characters');
assert.strictEqual(crc32(pub).toString(16).padStart(8,'0'),'25eb08f5','production ML-DSA-87 public key checksum mismatch');
assert.strictEqual(Buffer.from(pub,'base64').length,2592,'ML-DSA-87 public key must decode to 2592 bytes');

assert(gate.includes("strlen($sig)!==4627"),'signature length guard missing');
assert(gate.includes("HC-MLDSA87-V2.P1."),'phase-1 challenge prefix missing');
assert(gate.includes("HC-MLDSA87-V2.P2."),'phase-2 challenge prefix missing');
assert(gate.includes("function mldsaConsumeJti"),'atomic anti-replay JTI consumption missing');
assert(gate.includes("fopen($path,'x')"),'anti-replay store must use exclusive create');
assert(gate.includes("function mldsaOriginAllowed"),'same-origin request binding missing');
assert(gate.includes("phase1_proof"),'phase-2 challenge must bind phase-1 proof');
assert(gate.includes("parent_jti"),'phase-2 challenge must bind parent challenge');
assert(gate.includes("L8_ACCESS_MLDSA87_PHASE1_TTL"),'phase-1 TTL configuration missing');
assert(gate.includes("L8_ACCESS_MLDSA87_PHASE2_TTL"),'phase-2 TTL configuration missing');
assert(gate.includes("min(7200"),'access session maximum TTL cap missing');
assert(gate.includes("httponly'=>true"),'HttpOnly cookie missing');
assert(gate.includes("samesite'=>'Strict"),'SameSite Strict missing');
assert(gate.includes("function mldsaAccessRequired(): bool"),'required gate function missing');
assert(!gate.includes("if (!mldsaAccessConfigured()) return false;"),'gate must fail closed');

assert(api.includes("protocol'=>'ML-DSA-87-2PHASE"),'two-phase protocol marker missing');
assert(api.includes("replay_detected"),'replay rejection missing');
assert(api.includes("origin_mismatch"),'origin mismatch rejection missing');
assert(api.includes("phase_mismatch"),'phase mismatch rejection missing');
assert(api.includes("mldsaConsumeJti"),'API must consume one-time JTI');
assert(api.includes("securityIpStrike('mldsa_access_fail',3"),'progressive failure strike threshold missing');
assert(api.includes("securityIpIsBanned"),'IP temporary ban check missing');

assert(js.includes("Paso 1 de 2"),'phase-1 UI missing');
assert(js.includes("Paso 2 de 2"),'phase-2 UI missing');
assert(js.includes("next_phase"),'frontend phase transition missing');
assert(js.includes("phase:phase"),'frontend must bind submitted signature to current phase');
assert(css.includes(".security-progress{"),'two-phase progress UI missing');

assert(l8.includes('mldsaShouldGateHtml'),'HTML gate missing');
assert(router.includes("'/api/mldsa-access'"),'access route missing');
assert(req.includes('pqcrypto==1.0.0'),'pqcrypto pin missing');
assert(css.includes('max-width:380px'),'SpectrumUI compact card missing');
assert(css.includes('border-radius:24px'),'SpectrumUI card radius missing');

console.log('✓ Hardened two-phase ML-DSA-87 access contract verified');
