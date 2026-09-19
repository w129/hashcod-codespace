'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const repoDir = path.resolve(__dirname, '../..');
const js = fs.readFileSync(path.join(repoDir, 'components/platform-registration-form.js'), 'utf8');
const hold = fs.readFileSync(path.join(repoDir, 'components/platform-entry-hold.js'), 'utf8');
const css = fs.readFileSync(path.join(repoDir, 'components/platform-registration-form.css'), 'utf8');
const api = fs.readFileSync(path.join(repoDir, 'platform-registration.php'), 'utf8');
const migration = fs.readFileSync(path.join(repoDir, 'supabase/migrations/20260917_create_hashcod_platform_registrations.sql'), 'utf8');
const codeMigration = fs.readFileSync(path.join(repoDir, 'supabase/migrations/20260918_add_platform_registration_code_upload.sql'), 'utf8');
const contractMigration = fs.readFileSync(path.join(repoDir, 'supabase/migrations/20260918_add_registration_contract_evidence.sql'), 'utf8');
const uniqueCodeMigration = fs.readFileSync(path.join(repoDir, 'supabase/migrations/20260918_add_registration_unique_code.sql'), 'utf8');
const contractPhp = fs.readFileSync(path.join(repoDir, 'platform-registration-contract.php'), 'utf8');
const privacy = fs.readFileSync(path.join(repoDir, 'privacy.php'), 'utf8');
const evidenceManifest = fs.readFileSync(path.join(repoDir, 'legal-evidence/registration-evidence-manifest.json'), 'utf8');
const schema = fs.readFileSync(path.join(repoDir, 'supabase/schema.sql'), 'utf8');
const hosted = fs.readFileSync(path.join(repoDir, 'l8-html.php'), 'utf8');
const local = fs.readFileSync(path.join(repoDir, 'laragon-local-entry.php'), 'utf8');
const router = fs.readFileSync(path.join(repoDir, 'router.php'), 'utf8');
const flipEntry = fs.readFileSync(path.join(repoDir, 'registration-flip-build/entry.tsx'), 'utf8');
const flipPrimitive = fs.readFileSync(path.join(repoDir, 'registration-flip-build/src/primitives/buttons/flip.tsx'), 'utf8');
const flipComponent = fs.readFileSync(path.join(repoDir, 'registration-flip-build/src/components/buttons/flip.tsx'), 'utf8');
const flipPackage = fs.readFileSync(path.join(repoDir, 'registration-flip-build/package.json'), 'utf8');
const notificationListSource = fs.readFileSync(path.join(repoDir, 'registration-flip-build/src/components/community/notification-list.tsx'), 'utf8');

// Final-screen only.
assert(css.includes('#hashcodPlatformRegistration'), 'registration root style missing');
assert(css.includes('display: none'), 'registration must be hidden before the third screen');
assert(css.includes('html[data-hashcod-final-entry-screen="true"] #hashcodPlatformRegistration'), 'third-screen reveal selector missing');
assert(css.includes('inset: 0'), 'third screen registration must fill the viewport instead of reusing the old panel zone');
assert(css.includes('width: 100vw'), 'third screen registration must own the full viewport width');
assert(css.includes('height: 100dvh'), 'third screen registration must own the full viewport height');
assert(!css.includes('left: 63vw'), 'registration must not reuse the previous right-side zone');
assert(!css.includes('top: 50vh'), 'registration must not be positioned as the previous floating panel');

// Required fields and 18+ rule.
for (const id of [
  'hashcodRegFullName',
  'hashcodRegAge',
  'hashcodRegCedula',
  'hashcodRegPlatform',
  'hashcodRegCodeFile',
  'hashcodRegCodeButton',
  'hashcodRegEmail',
  'hashcodRegPhone',
  'hashcodRegistrationSubmit',
  'hashcodRegistrationTableButton'
]) {
  assert(js.includes(id), 'missing registration UI id: ' + id);
}
assert(js.includes('type="number" min="18" max="120"'), 'client age field must be 18+');
assert(js.includes('/^\\d{3}-\\d{7}-\\d$/'), 'client cedula format validation missing');
assert(js.includes('000-0000000-0'), 'cedula hyphen format hint missing');
assert(js.includes('Number.isInteger(age) && age >= 18'), 'client 18+ validation missing');
assert(js.includes('DATABASE_ICON'), 'database icon button missing');
assert(js.includes('CODE_UPLOAD_ICON'), 'platform code upload icon missing');
assert(js.includes('hashcod-radix-checkbox'), 'Radix-like checkbox indicator missing');
assert(js.includes('hashcodRegistrationProgress'), 'registration progress bar missing');
assert(js.includes('hashcodRegistrationProgressIndicator'), 'progress indicator missing');
assert(js.includes('hashcodRegistrationProgressValue'), 'progress percentage label missing');
assert(js.includes("const steps = ['full_name', 'age', 'cedula', 'platform_name', 'code_file', 'email', 'phone']"), 'progress must track the seven pre-consent fields');
assert(js.includes('updateProgress(v);'), 'form validation must update progress');
assert(js.includes('consent.disabled = !complete'), 'consent checkbox must stay disabled until all pre-consent fields are complete');
assert(js.includes('if (!complete && consent.checked)'), 'consent must be revoked if a completed field becomes invalid');
assert(js.includes('Completa todos los campos y acepta el documento contractual antes de continuar.'), 'strict continuation error copy missing');
assert(css.includes('.hashcod-registration-progress-hint'), 'completion lock hint styling missing');
assert(js.includes('hashcod-registration-validity-note'), 'AI project validity note missing');
assert(js.includes('Haciendo que tu proyecto hecho por IA tenga validez legal'), 'AI project validity note copy missing');
assert(js.includes('M 9 5 L 9 7 L 23 7'), 'AI project validity icon path missing');
assert(css.includes('.hashcod-registration-validity-note'), 'AI project validity note styling missing');
assert(js.includes('data-hashcod-accordion'), 'registration FAQ accordion missing');
assert(js.includes('¿Cómo sé que esto no es una estafa?'), 'trust FAQ missing');
assert(js.includes('RD$567'), 'submission price missing');
assert(js.includes('RD$2,000'), 'code review price missing');
assert(js.includes('RD$6,900'), 'post-quantum hosting price missing');
assert(js.includes('RD$10,000'), 'certification price missing');
assert(js.includes('hashcod.app'), 'social availability answer missing');
assert(js.includes('setAccordionItem(trigger, open)'), 'single-open accordion logic missing');
assert(css.includes('.hashcod-registration-faq-panel'), 'FAQ panel styles missing');
assert(css.includes('grid-template-rows: 0fr'), 'FAQ collapsed animation state missing');
assert(css.includes('grid-template-rows: 1fr'), 'FAQ expanded animation state missing');



assert(css.includes('.hashcod-registration-progress-indicator'), 'progress indicator styling missing');
assert(css.includes('transition: transform .28s'), 'progress animation missing');
assert(css.includes('@keyframes hashcodRegistrationProgressSheen'), 'progress sheen animation missing');

assert(js.includes('hashcodPrivacyPreviewTrigger'), 'PreviewLinkCard-like privacy trigger missing');
assert(js.includes('hashcodPrivacyPreviewCard'), 'privacy preview card content missing');
assert(js.includes('ensurePrivacyPreviewLoaded'), 'lazy privacy preview loading missing');
assert(js.includes('placePrivacyPreview'), 'cursor-following privacy preview positioning missing');
assert(css.includes('.hashcod-preview-link-card-content.is-open'), 'privacy preview open state missing');
assert(css.includes('.hashcod-preview-link-card-snapshot'), 'privacy preview snapshot surface missing');
assert(js.includes("attachShadow({ mode: 'open' })"), 'privacy preview must render in isolated Shadow DOM');
assert(js.includes("parsed.querySelector('.privacy-container')"), 'privacy preview must reuse the real privacy page DOM');

assert(css.includes('.hashcod-radix-checkbox-input:checked + .hashcod-radix-checkbox'), 'checked checkbox state missing');
assert(css.includes('transform: scale(.55)'), 'checkbox entrance animation missing');
assert(css.includes(':indeterminate + .hashcod-radix-checkbox'), 'indeterminate checkbox state missing');

assert(js.includes('viewBox="0 0 32 32"'), 'requested platform code SVG viewBox missing');
assert(js.includes('M 10 4 L 10 6 L 20 6'), 'requested platform code SVG path missing');
assert(js.includes("button.classList.add('is-loaded')"), 'code icon must enter loaded state after a valid file is selected');
assert(js.includes("button.setAttribute('aria-pressed', 'true')"), 'loaded code icon accessibility state missing');
assert(css.includes('#hashcodRegCodeButton.is-loaded'), 'light-gray loaded icon style missing');
assert(css.includes('background: #e4e4e4'), 'loaded code icon must use a light gray background');
assert(js.includes('const MAX_CODE_FILE_BYTES = 30 * 1024 * 1024'), 'client code file limit missing');
assert(js.includes("body.append('code_file', selectedCodeFile"), 'selected code file must be sent with the form');
assert(js.includes('new FormData()'), 'registration submission must use multipart FormData');
assert(!js.includes("'Content-Type': 'application/json'"), 'multipart upload must not force an application/json content type');
assert(js.includes("target.closest('#hashcodHoldContinue')"), 'final-screen registration fallback must follow the second-screen continue action');
assert(js.includes("revealFinalRegistration('platform-registration-continue-fallback')"), 'registration fallback reveal marker missing');
assert(js.includes("revealFinalRegistration('platform-registration-hold-disconnected')"),
  'registration must recover when the second-screen overlay disappears');
assert(js.includes("if (document.documentElement.dataset.hashcodFinalEntryScreen !== 'true') return false;"),
  'registration root must not mount before screen 3');
assert(js.includes("root.dataset.hashcodScreen = '3'"),
  'registration root must identify itself as the third screen');
assert(js.includes('function mountIfThirdScreen()'),
  'registration bootstrap must defer mounting until the third-screen marker exists');
assert(js.includes('function hardRetireThirdScreen()'),
  'screen 3 must hard-retire the old visual document before mounting the form');
for (const selector of ['#authOverlay', '#authWrapper', '#bootCliOverlay', '#hashcodRareFolderHost']) {
  assert(js.includes("'" + selector + "'"), 'screen 3 retire selector missing: ' + selector);
}
assert(js.includes('node.remove()'), 'third-screen legacy surfaces must be removed, not only visually covered');
assert(!js.includes("        '#hashcodEntryHold',"), 'registration must not remove screen 2 before handoff verification');
assert(js.includes("observer.observe(target, { childList: true })"), 'recovery observer must avoid full-subtree DOM watching');
assert(!js.includes('checks >= 240'), 'registration recovery must not poll the DOM for 24 seconds');
assert(js.includes('function scheduleValidate()'), 'form validation must be frame-batched');
assert(css.includes('html[data-hashcod-final-entry-screen="true"] :is('),
  'CSS fallback must hard-hide retired screen-3 surfaces');
assert(css.includes('#bootCliOverlay'), 'CSS screen-3 kill switch must cover the boot document');
assert(js.includes('data-no-autosave data-hashcod-autosave="off"'),
  'registration PII form must explicitly disable Hashcod local autosave');
assert(js.includes('autocomplete="off"'),
  'registration PII form must disable browser form autocomplete at form level');
assert(js.includes('viewBox="0 0 50 50"'), 'requested database/cloud SVG viewBox missing');
assert(js.includes('M 28.992188 8'), 'requested database/cloud SVG path missing');
assert(js.includes('C 34.444331 46.320593 34 45.631546 34 45 L 34 44.283203 z'),
  'database/cloud SVG final cubic segment must be valid');
assert(!js.includes('C 34.444331 46.320593 34 45 L 34 44.283203 z'),
  'malformed database/cloud SVG segment must not return');

// Submission and protected records table.
assert(js.includes("method: 'POST'"), 'registration POST missing');
assert(api.includes("str_starts_with($contentType, 'multipart/form-data')"), 'backend multipart parser missing');
assert(api.includes("$_FILES['code_file']"), 'backend code-file intake missing');
assert(api.includes('HASHCOD_PLATFORM_CODE_MAX_BYTES = 31457280'), 'server code file limit missing');
assert(api.includes("const HASHCOD_PLATFORM_REGISTRATION_BUCKET = 'hashcod-registration-code'"), 'registration uploads must use a dedicated private bucket');
assert(api.includes('function hprEnsureRegistrationBucket()'), 'dedicated registration bucket bootstrap missing');
assert(api.includes("'file_size_limit'=>HASHCOD_PLATFORM_CODE_MAX_BYTES"), 'registration bucket must enforce the same 30 MB limit as the form');
assert(api.includes("'allowed_mime_types'=>null"), 'registration bucket must not inherit the old image-only MIME restriction');
assert(api.includes('function hprUploadCodeStorage(array $codeUpload)'), 'dedicated registration upload helper missing');
assert(api.includes('$uploadedCode = hprUploadCodeStorage($codeUpload);'), 'platform code must use the dedicated registration bucket');
assert(api.includes("'code_storage_path'=>$codeUpload['storage_path']"), 'registration row must persist the Storage object path');
assert(api.includes("'code_sha256'=>$codeUpload['sha256']"), 'registration row must persist a code integrity hash');
assert(api.includes("'code_uploaded'=>true"), 'successful response must confirm code upload');
assert(api.includes("require_once __DIR__ . '/platform-registration-contract.php'"), 'canonical contract helper must be loaded by registration API');
assert(api.includes("'contract_version'=>$contractVersion"), 'contract version must be stored with registration');
assert(api.includes("'contract_sha256'=>$contractSha256"), 'contract SHA-256 must be stored with registration');
assert(api.includes("'contract_accepted_at'=>$acceptedAt"), 'contract acceptance timestamp must be stored');
assert(api.includes("'acceptance_method'=>'checkbox+submit'"), 'acceptance method must identify checkbox plus submit');
assert(api.includes("'acceptance_evidence_sha256'=>$acceptanceEvidenceSha256"), 'acceptance evidence digest must be stored');
assert(api.includes('hprAcceptanceEvidenceSha256('), 'acceptance evidence hashing helper missing');
assert(api.includes('function hprGenerateRegistrationCode()'), 'unique registration code generator missing');
assert(api.includes('random_bytes(16)'), 'registration code must use server-side CSPRNG entropy');
assert(api.includes("'HC1-' . implode('-', $groups)"), 'registration code readable format missing');
assert(api.includes("secretsEncrypt($registrationCode['plain'])"), 'registration code must be encrypted before storage');
assert(api.includes("'registration_code_enc'=>$registrationCodeEnc"), 'encrypted registration code must be stored in the same registration row');
assert(api.includes("'registration_code_sha256'=>$registrationCode['sha256']"), 'registration code digest must be stored');
assert(api.includes("'registration_code_hint'=>$registrationCode['hint']"), 'registration code hint must be stored');
assert(api.includes("'registration_code'=>$registrationCode['plain']"), 'plaintext registration code must be returned only by the successful POST');
assert(api.includes("$registrationCode = hprRegistrationDecrypt($registrationCodeEnc);"), 'admin view must use stable/backward-compatible decryption for the registration code');
assert(api.includes("'registration_code'=>$registrationCode"), 'admin projection must return the exact registration code after CodeKey authorization');
assert(api.includes('function hprListRegistrationEvidencePaths(string $prefix, int $depth = 0): array'), 'recursive evidence walker missing');
assert(api.includes('hprListRegistrationEvidencePaths($fullPath, $depth + 1)'), 'recursive evidence walker must descend into nested folders');
assert(api.includes("'platform-registrations/evidence-by-row/' . (string)$savedCompat['id']"), 'row-index evidence write missing');
assert(api.includes('function hprLower(string $value): string'), 'portable lowercase helper missing');
assert(api.includes('function hprRegistrationCryptoKey(): string'), 'stable registration encryption key helper missing');
assert(api.includes("secretGet('L8_DATA_ENCRYPTION_KEY', '')"), 'stable registration encryption key must prefer L8_DATA_ENCRYPTION_KEY');
assert(api.includes("secretGet('SUPABASE_SECRET_KEY', '')"), 'registration encryption must have a persistent Render fallback');
assert(api.includes("registration_code_status'] = 'reissued_after_key_loss'"), 'legacy code reissue marker missing');
assert(api.includes("'registration_code_reissued'=>$registrationCodeReissued"), 'admin projection must expose reissue state');
assert(js.includes('row.registration_code_reissued'), 'protected table must label reissued registration codes');
assert(js.includes('REEMPLAZO'), 'reissued code label missing');

assert(api.includes('function hprRegistrationEvidenceByRowId(array $rowIds = [], array $storedRows = [])'), 'compatibility registrations must recover codes from private evidence sidecars');
assert(js.includes('row.registration_code ?'), 'protected table must render the exact registration code');
assert(js.includes('hashcod-registration-code-value'), 'exact registration code table styling hook missing');
assert(!js.includes('••••••••-'), 'protected table must no longer mask the registration code');
assert(css.includes('.hashcod-registration-code-value'), 'exact registration code table styling missing');
assert(api.includes("'registration_code_stored'=>"), 'admin projection must expose only stored-state metadata');
assert(js.includes('He leído y acepto contractualmente el'), 'checkbox copy must clearly express contractual acceptance');
assert(js.includes('Documento Contractual y de Privacidad'), 'contract document link copy missing');
assert(js.includes('function waitForSuccessfulSubmission()'), 'registration must expose a successful-submit gate');
assert(js.includes('hashcodRegistrationCodeReceipt'), 'private registration code receipt missing');
assert(js.includes('hashcodRegistrationTurnstile'), 'registration Turnstile block missing');
assert(js.includes("api/cloudflare/turnstile/config"), 'registration Turnstile config endpoint missing');
assert(js.includes("api/cloudflare/turnstile/verify"), 'registration Turnstile verify endpoint missing');
assert(js.includes("https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"), 'official Turnstile client script missing');
assert(js.includes("window.turnstile.render(widget"), 'explicit Turnstile rendering missing');
assert(js.includes("verifyTurnstileToken(token)"), 'Turnstile callback verification missing');
assert(js.includes("response.status === 429"), 'registration must intercept rate-limit challenges');
assert(js.includes("data.code === 'turnstile_challenge_required'"), 'Turnstile challenge response handling missing');
assert(js.includes('let pendingTurnstileSubmission = false'), 'pending Turnstile submission state missing');
assert(js.includes('status(\'\')'), 'Turnstile challenge must clear duplicate status copy');
assert(js.includes('if (shell) shell.hidden = true'), 'verified Turnstile block must hide automatically');
assert(js.includes('if (pendingTurnstileSubmission && complete && !turnstileAutoRetrying)'), 'verified Turnstile must detect a pending completed form');
assert(js.includes('form.requestSubmit()'), 'verified Turnstile must automatically resume pending registration');
assert(!js.includes('Completa la verificación de Cloudflare que aparece debajo y vuelve a enviar el registro.'), 'manual resend copy must be removed');
assert(js.includes("turnstileVerifiedUntil = Date.now() + (14 * 60 * 1000)"), 'clearance safety window missing');
assert(css.includes('.hashcod-registration-turnstile'), 'Turnstile registration styling missing');
assert(api.includes("securityRateChallengeJson($retryAfter, 'platform_registration_submit')"), 'registration backend must return Turnstile challenge metadata');
assert(js.includes('hashcodRegistrationPrivateCode'), 'private registration code display missing');
assert(js.includes('COPIAR CÓDIGO'), 'registration code copy action missing');
assert(js.includes('CONTINUAR A HASHCOD'), 'registration code acknowledgement action missing');
assert(js.includes('let registrationCodeAcknowledged = false'), 'registration code acknowledgement state missing');
assert(js.includes('registrationSaved && registrationCodeAcknowledged'), 'entry must stay blocked until code acknowledgement');
assert(js.includes("if (privateCode) privateCode.textContent = ''"), 'plaintext registration code must be cleared from the DOM on entry');
assert(css.includes('#hashcodRegistrationCodeReceipt'), 'registration code receipt styling missing');
assert(js.includes('registrationGateResolve({ ok: true, saved: true, codeAcknowledged: true })'), 'entry gate must release only after the registrant acknowledges the private code');
assert(js.includes('function completePlatformEntry()'), 'registration must own the final transition into the platform');
assert(js.includes("dataset.hashcodPlatformEntered = 'true'"), 'platform entry state marker missing');
assert(js.includes("new CustomEvent('hashcod:platform-entered'"), 'platform-entered event must fire only after registration completion');
assert(js.includes("'X-Requested-With': 'XMLHttpRequest'"), 'CSRF/same-origin marker missing');
assert(js.includes('await window.HashcodAdmin.require({ force: false })'), 'records table must reuse a valid CodeKey session or open the picker directly from the user click');
assert(js.includes("?view=admin"), 'admin records projection missing');
assert(js.includes("tableButton.dataset.adminEngineReady = 'loading'"), 'CodeKey verifier must preload before table click');
assert(js.includes("ensureAdminEngine().then(function (ready)"), 'CodeKey verifier preload promise missing');
assert(!js.includes("La tabla requiere la CodeKey administrativa."), 'obsolete CodeKey table error copy must be removed');
assert(js.includes('escapeHtml(row.cedula)'), 'stored PII must be escaped before table rendering');

assert(api.includes("FILTER_VALIDATE_INT"), 'server age validation missing');
assert(api.includes("'min_range'=>18"), 'server must reject under-18 submissions');
assert(api.includes("/^\\d{3}-\\d{7}-\\d$/"), 'server cedula validation missing');
assert(api.includes("FILTER_VALIDATE_EMAIL"), 'server email validation missing');
assert(api.includes("securityRateAllowSliding('platform_registration_submit'"), 'public submission rate limit missing');
assert(api.includes("strcasecmp((string)($_SERVER['HTTP_X_REQUESTED_WITH'] ?? ''), 'XMLHttpRequest')"), 'server AJAX/CSRF marker check missing');
assert(api.includes("empty($cfg['secret_key'])"), 'backend must require Supabase secret key');
assert(api.includes("require_once __DIR__ . '/secrets.php'"), 'backend encryption helper missing');
assert(api.includes("secretsEncrypt($validated['cedula'])"), 'cedula must be encrypted before database storage');
assert(api.includes("secretsEncrypt($validated['email'])"), 'email must be encrypted before database storage');
assert(api.includes("secretsEncrypt($validated['phone'])"), 'phone must be encrypted before database storage');
assert(api.includes("secretsDecrypt((string)($stored['cedula_enc']"), 'admin projection must decrypt cedula only after authorization');
assert(api.includes('adminRequire();'), 'stored records must be admin-only server-side');
assert(api.includes('HASHCOD_PLATFORM_REGISTRATION_TABLE'), 'backend table constant missing');
assert(api.includes("(string)($_GET['status'] ?? '') === '1'"), 'safe storage readiness probe missing');
assert(api.includes("'storage_configured'=>$storageConfigured"), 'readiness probe storage flag missing');
assert(api.includes("'table_ready'=>$tableReady"), 'readiness probe table flag missing');
assert(api.includes("'registration_bucket_ready'=>$registrationBucketReady"), 'registration bucket readiness flag missing');
assert(api.includes("'registration_bucket'=>HASHCOD_PLATFORM_REGISTRATION_BUCKET"), 'registration bucket readiness name missing');
assert(api.includes("HASHCOD-REGISTRATION-EVIDENCE-1"), 'registration compatibility sidecar missing');
assert(api.includes(".registration-evidence.l8e1"), 'registration compatibility evidence path missing');
assert(api.includes("$schemaMode = 'compatibility'"), 'registration readiness compatibility mode missing');
assert(api.includes("$compatibilityMode = true"), 'registration insert compatibility retry missing');
assert(api.includes("$adminSchemaMode = 'dynamic'"), 'registration admin table must use schema-independent mode');
assert(api.includes("'?select=*&order=created_at.desc&limit=500'"), 'registration admin table must query rows without hardcoded optional columns');
assert(api.includes("'bypass_circuit'=>true"), 'protected admin read must bypass an already-open Supabase circuit');
assert(api.includes("supabaseDbRequest("), 'protected admin table must use a direct recovery read');
assert(api.includes("'code'=>'registration_table_read_failed'"), 'registration admin table must expose a stable diagnostic code');
assert(api.includes("$schemaMode = 'base-compatibility'"), 'base registration schema compatibility mode missing');
assert(api.includes("'full_name_enc'=>$row['full_name_enc']"), 'base compatibility row must preserve encrypted name');
assert(api.includes("'age'=>$row['age']"), 'base compatibility row must preserve age');
assert(api.includes("'cedula_enc'=>$row['cedula_enc']"), 'base compatibility row must preserve encrypted cedula');
assert(api.includes("'platform_name'=>$row['platform_name']"), 'base compatibility row must preserve platform');
assert(api.includes("'email_enc'=>$row['email_enc']"), 'base compatibility row must preserve encrypted email');
assert(api.includes("'phone_enc'=>$row['phone_enc']"), 'base compatibility row must preserve encrypted phone');
assert(api.includes("$fallbackEvidence['registration_row_id'] = $savedCompat['id']"), 'sidecar must be correlated to the saved base row id');
assert(!api.includes('La migración de evidencia contractual todavía no está aplicada.'), 'old blocking contractual migration error must be removed');
assert(api.includes("select=id,code_storage_path,contract_version,contract_sha256,acceptance_evidence_sha256,registration_code_enc,registration_code_sha256&limit=1"),
  'readiness probe must verify upload, contract, and registration-code columns');
assert(!api.includes("'error'=>$probe"), 'readiness probe must not expose raw database errors');

// Database confidentiality.
for (const sql of [migration, schema]) {
  assert(sql.includes('hashcod_platform_registrations'), 'registration table missing from SQL');
  assert(sql.includes('age smallint not null check (age between 18 and 120)'), 'DB 18+ constraint missing');
  assert(sql.includes("full_name_enc text not null check (full_name_enc like 'l8e1:%')"), 'encrypted name column missing');
  assert(sql.includes("cedula_enc text not null check (cedula_enc like 'l8e1:%')"), 'encrypted cedula column missing');
  assert(sql.includes("email_enc text not null check (email_enc like 'l8e1:%')"), 'encrypted email column missing');
  assert(sql.includes("phone_enc text not null check (phone_enc like 'l8e1:%')"), 'encrypted phone column missing');
  assert(sql.includes('enable row level security'), 'registration RLS missing');
  assert(sql.includes('revoke all on table public.hashcod_platform_registrations from public, anon, authenticated'), 'direct PUBLIC/anon/authenticated access must be revoked');
  assert(sql.includes('create policy hashcod_platform_registrations_deny_direct'), 'explicit deny-direct RLS policy missing');
  assert(sql.includes('using (false)'), 'deny-direct RLS USING clause missing');
  assert(sql.includes('with check (false)'), 'deny-direct RLS WITH CHECK clause missing');
  assert(sql.includes('grant select, insert on table public.hashcod_platform_registrations to service_role'), 'backend service-role grant missing');
}

for (const sql of [codeMigration, schema]) {
  assert(sql.includes('code_filename'), 'code filename column missing');
  assert(sql.includes('code_mime_type'), 'code MIME column missing');
  assert(sql.includes('code_size_bytes'), 'code size column missing');
  assert(sql.includes('code_sha256'), 'code SHA-256 column missing');
  assert(sql.includes('code_storage_path'), 'private code Storage path column missing');
  assert(sql.includes('31457280'), '30 MB database code-size guard missing');
}

for (const sql of [contractMigration, schema]) {
  assert(sql.includes('contract_version'), 'contract version column missing');
  assert(sql.includes('contract_sha256'), 'contract SHA-256 column missing');
  assert(sql.includes('contract_accepted_at'), 'contract accepted-at column missing');
  assert(sql.includes('acceptance_method'), 'acceptance method column missing');
  assert(sql.includes('acceptance_evidence_sha256'), 'acceptance evidence SHA-256 column missing');
}

for (const sql of [uniqueCodeMigration, schema]) {
  assert(sql.includes('registration_code_enc'), 'registration code encrypted column missing');
  assert(sql.includes('registration_code_sha256'), 'registration code SHA-256 column missing');
  assert(sql.includes('registration_code_hint'), 'registration code hint column missing');
  assert(sql.includes('hashcod_platform_registrations_registration_code_sha256_uidx'), 'registration code uniqueness index missing');
}
assert(!schema.includes("code_sha256 ~ '^[a-f0-9]{64}\nalter table"), 'registration schema must not contain the prior corrupted code SHA constraint');

assert(contractPhp.includes("'version' => '2026.09.18-2'"), 'canonical contract version missing');
assert(contractPhp.includes('hashcodRegistrationContractSha256'), 'canonical contract SHA-256 helper missing');
assert(contractPhp.includes('El Usuario se compromete a suplir'), 'required user supply obligation missing');
assert(contractPhp.includes('Esta aceptación por checkbox no se presenta como una “firma digital certificada”'), 'digital-signature legal precision missing');
assert(contractPhp.includes('Registro Mercantil de Persona Física núm. 3323LV-PF'), 'mercantile registration evidence missing');
assert(contractPhp.includes('Nombre comercial DIKTATCART, Registro ONAPI núm. 925063'), 'DIKTATCART commercial-name evidence missing');
assert(contractPhp.includes('Marca mixta HASHCOD, Registro ONAPI núm. 336973'), 'HASHCOD trademark evidence missing');
assert(contractPhp.includes('RNC) núm. 402-0936929-3'), 'RNC evidence missing');
assert(evidenceManifest.includes('ec1077ab5fd6d81685f0976ab3451ef7f4fa5be230e8ffe94761365708ab3e31'), 'mercantile certificate SHA-256 missing');
assert(evidenceManifest.includes('696254deb3f1783f788d475c8b13b615ceb32440ce2b921ca946a030292464db'), 'HASHCOD trademark certificate SHA-256 missing');
assert(privacy.includes("require_once __DIR__ . '/platform-registration-contract.php'"), 'privacy page must render the canonical contract helper');
assert(contractPhp.includes('Documento de Aceptación Contractual, Privacidad y Evidencia de Registro'), 'contract document title missing');
assert(privacy.includes('SHA-256 canónico'), 'contract document must display canonical hash');
assert(privacy.includes('Declaración de aceptación'), 'contract acceptance declaration missing');

// Official Animate UI FlipButton integration.
assert(js.includes('hashcodRegistrationSubmitReactHost'), 'React host for official FlipButton missing');
assert(js.includes("hashcod:registration-submit-state"), 'registration state event for React flip missing');
assert(js.includes("data.animateUiFlip === 'official'"), 'official React flip state bridge missing');
assert(!js.includes('hashcod-flip-stage'), 'handcrafted flip stage must be removed');
assert(!css.includes('.hashcod-flip-stage'), 'handcrafted flip CSS must be removed');
assert(flipPrimitive.includes('whileHover="hover"'), 'official Animate UI FlipButton primitive missing whileHover state');
assert(flipPrimitive.includes("transition = { type: 'spring', stiffness: 280, damping: 20 }"), 'official Animate UI spring transition missing');
assert(flipPrimitive.includes('data-slot="flip-button-front"'), 'official Animate UI front slot missing');
assert(flipPrimitive.includes('data-slot="flip-button-back"'), 'official Animate UI back slot missing');
assert(flipComponent.includes('FlipButtonPrimitive'), 'official Animate UI component wrapper missing');
assert(flipEntry.includes("import { PlusIcon } from 'lucide-react'"), 'real lucide-react PlusIcon import missing');
assert(flipEntry.includes('<FlipButton'), 'official FlipButton React island missing');
assert(flipEntry.includes('<FlipButtonFront'), 'official FlipButtonFront usage missing');
assert(flipEntry.includes('<FlipButtonBack'), 'official FlipButtonBack usage missing');
assert(flipEntry.includes('data-animate-ui-flip="official"'), 'official flip marker missing');
assert(flipPackage.includes('"lucide-react": "^0.482.0"'), 'lucide-react dependency must match the Animate UI upstream range');
assert(hosted.includes('registration-flip.bundle.js'), 'hosted official flip bundle wiring missing');
assert(local.includes('registration-flip.bundle.js'), 'local official flip bundle wiring missing');
assert(js.includes('hashcodRegistrationNotificationListHost'), 'Animate UI NotificationList host missing');
assert(flipEntry.includes("import { NotificationList } from './src/components/community/notification-list'"), 'NotificationList React island import missing');
assert(flipEntry.includes('notificationRoot.render(<NotificationList />)'), 'NotificationList React mount missing');
assert(notificationListSource.includes('whileHover="expanded"'), 'official NotificationList hover expansion missing');
assert(notificationListSource.includes("stiffness: 300"), 'official NotificationList spring stiffness missing');
assert(notificationListSource.includes("damping: 26"), 'official NotificationList spring damping missing');
assert(notificationListSource.includes("title: 'Validation system'"), 'Validation system card missing');
assert(notificationListSource.includes("title: \"I wonder what's in the certificate.\""), 'certificate contents card missing');
assert(notificationListSource.includes("title: 'Notification process'"), 'Notification process card missing');
assert(notificationListSource.includes("title: 'Payment Model'"), 'Payment Model card missing');
assert(notificationListSource.includes('AnimatePresence'), 'click/tap detail animation missing');
assert(css.includes('.hashcod-notification-list'), 'NotificationList visual styling missing');
assert(css.includes('.hashcod-notification-card'), 'NotificationList card styling missing');

// Hosted/local wiring and retired sign removal.
assert(hosted.includes('platform-registration-form.css?v=20260918-25'), 'hosted registration CSS missing');
assert(hosted.includes('platform-registration-form.js?v=20260918-32'), 'hosted registration JS missing');
assert(local.includes('platform-registration-form.css?v=20260918-25'), 'local registration CSS missing');
assert(local.includes('platform-registration-form.js?v=20260918-32'), 'local registration JS missing');
assert(hosted.includes('hashcod-platform-registration-prehide'), 'hosted first-paint registration gate missing');
assert(local.includes('hashcod-platform-registration-prehide'), 'local first-paint registration gate missing');
assert(hosted.includes('hashcod-registration-gate-preboot'), 'hosted early-click fail-closed gate missing');
assert(local.includes('hashcod-registration-gate-preboot'), 'local early-click fail-closed gate missing');
assert(hosted.includes('stopImmediatePropagation'), 'hosted early-click gate must block legacy entry handlers');
assert(local.includes('stopImmediatePropagation'), 'local early-click gate must block legacy entry handlers');
assert(hold.includes("const HOLD_RUNTIME_VERSION = '20260918-32'"), 'hold runtime must be versioned');
assert(hold.includes('__hashcodPlatformEntryHoldLoadedVersion'), 'new hold runtime must supersede stale loaded flags');
assert(!hold.includes('if (window.__hashcodPlatformEntryHoldLoaded) return;'), 'stale hold runtime must not block the current registration gate');
assert(!hold.includes('attempts >= 80'), 'entry-gate installer must not give up before the legacy entry function exists');
assert(hold.includes('function installDirectButtonGate()'), 'entry button must have an authoritative direct gate');
assert(hold.includes("button.addEventListener('click'"), 'direct gate click interception missing');
assert(hold.includes("button.dataset.hashcodEntryGateVersion = HOLD_RUNTIME_VERSION"), 'button gate version marker missing');
assert(hold.includes('event.stopImmediatePropagation()'), 'direct gate must stop legacy click handlers before platform entry');



assert(hosted.includes('#hashcodPlatformRegistration{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important;}'),
  'hosted form must be forcibly hidden before screen 3');
assert(local.includes('#hashcodPlatformRegistration{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important;}'),
  'local form must be forcibly hidden before screen 3');
assert(hosted.includes('platform-entry-motion.js?v=20260918-1'), 'hosted entry motion must load directly');
assert(hosted.includes('platform-entry-hold.js?v=20260918-32'), 'hosted second screen must load directly');
assert(local.includes('platform-entry-motion.js?v=20260918-1'), 'local entry motion must load directly');
assert(local.includes('platform-entry-hold.js?v=20260918-32'), 'local second screen must load directly');
assert(!hosted.includes('hashcodPlatformImprovementSign'), 'temporary improvement sign still wired in hosted entry');
assert(!local.includes('hashcodPlatformImprovementSign'), 'temporary improvement sign still wired in local entry');
assert(router.includes("if ($uri === '/api/platform-registration')"), 'registration API route missing');

console.log('PASS: third-screen 18+ registration form, contractual acceptance evidence, protected admin table, and RLS-backed storage verified.');

assert(js.includes("cache: 'no-store'"), 'current privacy preview must bypass stale browser cache');
assert(js.includes("parsed.head.querySelectorAll('style, link[rel=\"stylesheet\"]')"), 'current contract/privacy preview styles must be fetched');
assert(js.includes("parsed.querySelector('.privacy-container')"), 'current contract/privacy document must be used by preview');
