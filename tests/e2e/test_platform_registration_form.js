'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const repoDir = path.resolve(__dirname, '../..');
const js = fs.readFileSync(path.join(repoDir, 'components/platform-registration-form.js'), 'utf8');
const css = fs.readFileSync(path.join(repoDir, 'components/platform-registration-form.css'), 'utf8');
const api = fs.readFileSync(path.join(repoDir, 'platform-registration.php'), 'utf8');
const migration = fs.readFileSync(path.join(repoDir, 'supabase/migrations/20260917_create_hashcod_platform_registrations.sql'), 'utf8');
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
for (const selector of ['#authOverlay', '#authWrapper', '#bootCliOverlay', '#hashcodEntryHold', '#hashcodRareFolderHost']) {
  assert(js.includes("'" + selector + "'"), 'screen 3 retire selector missing: ' + selector);
}
assert(js.includes('node.remove()'), 'third-screen legacy surfaces must be removed, not only visually covered');
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

// Hosted/local wiring and retired sign removal.
assert(hosted.includes('platform-registration-form.css?v=20260918-5'), 'hosted registration CSS missing');
assert(hosted.includes('platform-registration-form.js?v=20260918-6'), 'hosted registration JS missing');
assert(local.includes('platform-registration-form.css?v=20260918-5'), 'local registration CSS missing');
assert(local.includes('platform-registration-form.js?v=20260918-6'), 'local registration JS missing');
assert(hosted.includes('hashcod-platform-registration-prehide'), 'hosted first-paint registration gate missing');
assert(local.includes('hashcod-platform-registration-prehide'), 'local first-paint registration gate missing');
assert(hosted.includes('hashcod-registration-gate-preboot'), 'hosted early-click fail-closed gate missing');
assert(local.includes('hashcod-registration-gate-preboot'), 'local early-click fail-closed gate missing');
assert(hosted.includes('stopImmediatePropagation'), 'hosted early-click gate must block legacy entry handlers');
assert(local.includes('stopImmediatePropagation'), 'local early-click gate must block legacy entry handlers');

assert(hosted.includes('#hashcodPlatformRegistration{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important;}'),
  'hosted form must be forcibly hidden before screen 3');
assert(local.includes('#hashcodPlatformRegistration{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important;}'),
  'local form must be forcibly hidden before screen 3');
assert(hosted.includes('platform-entry-motion.js?v=20260918-1'), 'hosted entry motion must load directly');
assert(hosted.includes('platform-entry-hold.js?v=20260918-5'), 'hosted second screen must load directly');
assert(local.includes('platform-entry-motion.js?v=20260918-1'), 'local entry motion must load directly');
assert(local.includes('platform-entry-hold.js?v=20260918-5'), 'local second screen must load directly');
assert(!hosted.includes('hashcodPlatformImprovementSign'), 'temporary improvement sign still wired in hosted entry');
assert(!local.includes('hashcodPlatformImprovementSign'), 'temporary improvement sign still wired in local entry');
assert(router.includes("if ($uri === '/api/platform-registration')"), 'registration API route missing');

console.log('PASS: third-screen 18+ registration form, protected admin table, and RLS-backed storage contract verified.');
