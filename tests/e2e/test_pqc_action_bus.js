const fs=require('fs'),assert=require('assert');

const lib=fs.readFileSync('pqc-actions-lib.php','utf8');
const controller=fs.readFileSync('pqc-actions.php','utf8');
const runtime=fs.readFileSync('components/pqc-action-runtime.js','utf8');
const router=fs.readFileSync('router.php','utf8');
const gate=fs.readFileSync('mldsa-access.php','utf8');
const html=fs.readFileSync('l8-html.php','utf8');
const cryptoPy=fs.readFileSync('scripts/mldsa87_access.py','utf8');
const env=fs.readFileSync('.env.example','utf8');

new Function(runtime);

// ML-DSA-87 signing primitives.
assert(cryptoPy.includes('generate_keypair, sign, verify'),'ML-DSA key generation/sign/verify imports missing');
assert(cryptoPy.includes('def cmd_keygen_json'),'ML-DSA JSON key generation command missing');
assert(cryptoPy.includes('def cmd_sign_json'),'ML-DSA JSON signing command missing');
assert(cryptoPy.includes('"signature_bytes":len(sig)'),'ML-DSA signature size reporting missing');

assert(lib.includes("const PQA_ALGORITHM = 'ML-DSA-87'"),'PQC action algorithm missing');
assert(lib.includes("'NIST FIPS 204'"),'FIPS 204 standard marker missing');
assert(lib.includes("secretPutVault('HASHCOD_ACTION_MLDSA87_SECRET_KEY_B64'"),'ML-DSA secret key must be stored in encrypted vault');
assert(lib.includes("secretPutVault('HASHCOD_ACTION_MLDSA87_PUBLIC_KEY_B64'"),'ML-DSA public key vault storage missing');
assert(lib.includes("pqaRunCrypto('sign-json'"),'per-action ML-DSA signing missing');
assert(lib.includes("pqaRunCrypto('verify-json'"),'generated action signing key self-test missing');
assert(lib.includes("strlen($raw) === 4896"),'ML-DSA-87 secret key byte-length guard missing');
assert(lib.includes("strlen($raw) === 2592"),'ML-DSA-87 public key byte-length guard missing');
assert(lib.includes("strlen($raw) !== 4627"),'ML-DSA-87 signature byte-length guard missing');

// Session, replay, chain and permits.
assert(lib.includes("const PQA_SESSION_COOKIE = 'hashcod_pqc_action_v1'"),'PQC session cookie missing');
assert(lib.includes("'httponly' => true"),'PQC session cookie must be HttpOnly');
assert(lib.includes("'samesite' => 'Strict'"),'PQC session cookie must be SameSite Strict');
assert(lib.includes("bin2hex(random_bytes(24))"),'PQC session id must be cryptographically random');
assert(lib.includes("if ($seq !== $expectedSeq)"),'strict action sequence enforcement missing');
assert(lib.includes("in_array($eventId, $state['recent_event_ids'], true)"),'action replay detection missing');
assert(lib.includes("hash_hmac('sha512', $previous"),'tamper-evident chained event hash missing');
assert(lib.includes("'previous_hash' => $previous"),'previous chain hash missing from receipt');
assert(lib.includes("'event_hash' => $eventHash"),'event chain hash missing from receipt');
assert(lib.includes("'pqc_signed' => is_array($pqc)"),'permit must bind ML-DSA signing state');
assert(lib.includes('function pqaValidatePermitToken'),'permit validation helper missing');
assert(lib.includes('function pqaRequirePermitForMutation'),'strict mutation enforcement helper missing');

// Durable checkpoints.
assert(lib.includes("supabaseDbUpsert('l8_app_states'"),'durable PQC chain checkpoint missing');
assert(lib.includes("supabaseDbSelect('l8_app_states'"),'durable PQC chain restore missing');
assert(lib.includes("['platform.start', 'platform.enter', 'tool.enable', 'api.mutation']"),'critical event checkpoint list missing');
assert(lib.includes("($seq % 8) === 0"),'periodic durable chain checkpoint missing');
assert(lib.includes("pqaAuditPath()"),'local append-only audit log missing');

// Public controller.
assert(controller.includes("protocol' => 'HASHCOD-PQC-ACTION-V1'"),'PQC action bootstrap protocol missing');
assert(controller.includes("action === 'public-key'"),'PQC public key endpoint missing');
assert(controller.includes('pqaProcessAction($session, $body)'),'PQC action processing missing');
assert(controller.includes("'sequence_conflict' ? 409"),'PQC sequence resynchronization response missing');

// Browser-wide instrumentation.
assert(runtime.includes("document.addEventListener('click',onTrustedActivation,true)"),'trusted button activation capture missing');
assert(runtime.includes("event.isTrusted===false"),'synthetic activation rejection missing');
assert(runtime.includes('closest(\'button,[role="button"]'),'global button selector missing');
assert(runtime.includes("signEvent('tool.enable'"),'tool enable signing missing');
assert(runtime.includes("MutationObserver"),'tool enable mutation observer missing');
assert(runtime.includes("signEvent('platform.start'"),'platform start signing missing');
assert(runtime.includes("signEvent('platform.enter'"),'platform entry signing missing');
assert(runtime.includes("window.fetch=function(input,init)"),'same-origin fetch protection wrapper missing');
assert(runtime.includes("signEvent('api.mutation'"),'state-changing API authorization event missing');
assert(runtime.includes("headers.set('X-Hashcod-PQC-Permit'"),'PQC permit header injection missing');
assert(runtime.includes("if(state.enforcement)return Promise.reject(error)"),'strict-mode fail-closed behavior missing');
assert(runtime.includes('window.HashcodPQCActionBus'),'PQC action bus public diagnostics API missing');

// Routing and universal loading.
assert(router.includes("'/api/pqc-actions'"),'PQC action controller route missing');
const pqcRoute=router.indexOf("if ($bootstrapSyncPath === '/api/pqc-actions')");
const permitGuard=router.indexOf('pqaRequirePermitForMutation($bootstrapSyncPath)');
const webBootstrap=router.indexOf("securityBootstrap('web');");
assert(pqcRoute>=0&&pqcRoute<permitGuard&&permitGuard<webBootstrap,'PQC controller/permit guard ordering invalid');
assert(html.includes('components/pqc-action-runtime.js'),'PQC runtime missing from main platform');
assert(gate.includes('components/pqc-action-runtime.js'),'PQC runtime missing from entry wizard');

// Secrets / rollout.
assert(env.includes('HASHCOD_PQC_ACTION_ENFORCE=0'),'safe staged enforcement default missing');
assert(env.includes('HASHCOD_ACTION_MLDSA87_AUTO_GENERATE=1'),'automatic vault-backed ML-DSA key provisioning missing');
assert(!runtime.includes('SECRET_KEY')&&!runtime.includes('secret_key_b64'),'private ML-DSA key material must never appear in frontend runtime');

console.log('PASS: platform-wide ML-DSA-87 PQC action bus contract verified');
