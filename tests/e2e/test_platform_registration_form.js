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
const schema = fs.readFileSync(path.join(repoDir, 'supabase/schema.sql'), 'utf8');
const hosted = fs.readFileSync(path.join(repoDir, 'l8-html.php'), 'utf8');
const local = fs.readFileSync(path.join(repoDir, 'laragon-local-entry.php'), 'utf8');
const router = fs.readFileSync(path.join(repoDir, 'router.php'), 'utf8');

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
assert(js.includes('hashcodPrivacyPreviewTrigger'), 'PreviewLinkCard-like privacy trigger missing');
assert(js.includes('hashcodPrivacyPreviewCard'), 'privacy preview card content missing');
assert(js.includes('ensurePrivacyPreviewLoaded'), 'lazy privacy preview loading missing');
assert(js.includes('placePrivacyPreview'), 'cursor-following privacy preview positioning missing');
assert(css.includes('.hashcod-preview-link-card-content.is-open'), 'privacy preview open state missing');
assert(css.includes('.hashcod-preview-link-card-frame'), 'privacy preview image/frame surface missing');

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
assert(api.includes('supabaseStorageUpload('), 'platform code must be uploaded to private Supabase Storage');
assert(api.includes("'code_storage_path'=>$codeUpload['storage_path']"), 'registration row must persist the Storage object path');
assert(api.includes("'code_sha256'=>$codeUpload['sha256']"), 'registration row must persist a code integrity hash');
assert(api.includes("'code_uploaded'=>true"), 'successful response must confirm code upload');
assert(js.includes('function waitForSuccessfulSubmission()'), 'registration must expose a successful-submit gate');
assert(js.includes('registrationGateResolve({ ok: true, saved: true })'), 'successful database save must release the entry gate');
assert(js.includes('function completePlatformEntry()'), 'registration must own the final transition into the platform');
assert(js.includes("dataset.hashcodPlatformEntered = 'true'"), 'platform entry state marker missing');
assert(js.includes("new CustomEvent('hashcod:platform-entered'"), 'platform-entered event must fire only after registration completion');
assert(js.includes("'X-Requested-With': 'XMLHttpRequest'"), 'CSRF/same-origin marker missing');
assert(js.includes('await window.HashcodAdmin.require({ force: true })'), 'records table must force admin CodeKey verification when opened');
assert(js.includes("?view=admin"), 'admin records projection missing');
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
assert(api.includes("supabaseDbSelect(HASHCOD_PLATFORM_REGISTRATION_TABLE, 'select=id&limit=1')"),
  'readiness probe must query only the table identifier projection');
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

// Hosted/local wiring and retired sign removal.
assert(hosted.includes('platform-registration-form.css?v=20260918-12'), 'hosted registration CSS missing');
assert(hosted.includes('platform-registration-form.js?v=20260918-14'), 'hosted registration JS missing');
assert(local.includes('platform-registration-form.css?v=20260918-12'), 'local registration CSS missing');
assert(local.includes('platform-registration-form.js?v=20260918-14'), 'local registration JS missing');
assert(hosted.includes('hashcod-platform-registration-prehide'), 'hosted first-paint registration gate missing');
assert(local.includes('hashcod-platform-registration-prehide'), 'local first-paint registration gate missing');
assert(hosted.includes('hashcod-registration-gate-preboot'), 'hosted early-click fail-closed gate missing');
assert(local.includes('hashcod-registration-gate-preboot'), 'local early-click fail-closed gate missing');
assert(hosted.includes('stopImmediatePropagation'), 'hosted early-click gate must block legacy entry handlers');
assert(local.includes('stopImmediatePropagation'), 'local early-click gate must block legacy entry handlers');
assert(hold.includes("const HOLD_RUNTIME_VERSION = '20260918-14'"), 'hold runtime must be versioned');
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
assert(hosted.includes('platform-entry-hold.js?v=20260918-14'), 'hosted second screen must load directly');
assert(local.includes('platform-entry-motion.js?v=20260918-1'), 'local entry motion must load directly');
assert(local.includes('platform-entry-hold.js?v=20260918-14'), 'local second screen must load directly');
assert(!hosted.includes('hashcodPlatformImprovementSign'), 'temporary improvement sign still wired in hosted entry');
assert(!local.includes('hashcodPlatformImprovementSign'), 'temporary improvement sign still wired in local entry');
assert(router.includes("if ($uri === '/api/platform-registration')"), 'registration API route missing');

console.log('PASS: third-screen 18+ registration form, protected admin table, and RLS-backed storage contract verified.');
