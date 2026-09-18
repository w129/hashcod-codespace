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
assert(js.includes('viewBox="0 0 50 50"'), 'requested database/cloud SVG viewBox missing');
assert(js.includes('M 28.992188 8'), 'requested database/cloud SVG path missing');

// Submission and protected records table.
assert(js.includes("method: 'POST'"), 'registration POST missing');
assert(js.includes("'X-Requested-With': 'XMLHttpRequest'"), 'CSRF/same-origin marker missing');
assert(js.includes('await window.HashcodAdmin.require()'), 'records table must require admin CodeKey');
assert(js.includes("?view=admin"), 'admin records projection missing');
assert(js.includes('escapeHtml(row.cedula)'), 'stored PII must be escaped before table rendering');

assert(api.includes("FILTER_VALIDATE_INT"), 'server age validation missing');
assert(api.includes("'min_range'=>18"), 'server must reject under-18 submissions');
assert(api.includes("/^\\d{3}-\\d{7}-\\d$/"), 'server cedula validation missing');
assert(api.includes("FILTER_VALIDATE_EMAIL"), 'server email validation missing');
assert(api.includes("securityRateAllowSliding('platform_registration_submit'"), 'public submission rate limit missing');
assert(api.includes("strcasecmp((string)($_SERVER['HTTP_X_REQUESTED_WITH'] ?? ''), 'XMLHttpRequest')"), 'server AJAX/CSRF marker check missing');
assert(api.includes("empty($cfg['secret_key'])"), 'backend must require Supabase secret key');
assert(api.includes('adminRequire();'), 'stored records must be admin-only server-side');
assert(api.includes('HASHCOD_PLATFORM_REGISTRATION_TABLE'), 'backend table constant missing');

// Database confidentiality.
for (const sql of [migration, schema]) {
  assert(sql.includes('hashcod_platform_registrations'), 'registration table missing from SQL');
  assert(sql.includes('age smallint not null check (age between 18 and 120)'), 'DB 18+ constraint missing');
  assert(sql.includes('enable row level security'), 'registration RLS missing');
  assert(sql.includes('revoke all on table public.hashcod_platform_registrations from anon, authenticated'), 'direct anon/authenticated access must be revoked');
  assert(sql.includes('grant select, insert on table public.hashcod_platform_registrations to service_role'), 'backend service-role grant missing');
}

// Hosted/local wiring and retired sign removal.
assert(hosted.includes('platform-registration-form.css?v=20260917-1'), 'hosted registration CSS missing');
assert(hosted.includes('platform-registration-form.js?v=20260917-1'), 'hosted registration JS missing');
assert(local.includes('platform-registration-form.css?v=20260917-1'), 'local registration CSS missing');
assert(local.includes('platform-registration-form.js?v=20260917-1'), 'local registration JS missing');
assert(!hosted.includes('hashcodPlatformImprovementSign'), 'temporary improvement sign still wired in hosted entry');
assert(!local.includes('hashcodPlatformImprovementSign'), 'temporary improvement sign still wired in local entry');
assert(router.includes("if ($uri === '/api/platform-registration')"), 'registration API route missing');

console.log('PASS: third-screen 18+ registration form, protected admin table, and RLS-backed storage contract verified.');
