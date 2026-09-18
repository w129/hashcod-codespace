'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const repoDir = path.resolve(__dirname, '../..');
const client = fs.readFileSync(path.join(repoDir, 'components/final-entry-registration.js'), 'utf8');
const css = fs.readFileSync(path.join(repoDir, 'components/final-entry-registration.css'), 'utf8');
const backend = fs.readFileSync(path.join(repoDir, 'access-intake.php'), 'utf8');
const router = fs.readFileSync(path.join(repoDir, 'router.php'), 'utf8');
const migration = fs.readFileSync(path.join(repoDir, 'supabase/migrations/20260917_create_hashcod_access_requests.sql'), 'utf8');
const hosted = fs.readFileSync(path.join(repoDir, 'l8-html.php'), 'utf8');
const local = fs.readFileSync(path.join(repoDir, 'laragon-local-entry.php'), 'utf8');

[
  'full_name',
  'age',
  'cedula',
  'platform_name',
  'email',
  'phone'
].forEach((name) => {
  assert(client.includes(`fieldMarkup('${name}'`), `missing form field: ${name}`);
});

assert(client.includes('min="18"'), 'age input must expose the 18+ minimum');
assert(client.includes('data.age < 18'), 'client must reject users younger than 18');
assert(backend.includes('$age < 18'), 'server must reject users younger than 18');
assert(backend.includes("/^\\d{3}-\\d{7}-\\d$/"), 'server must require hyphenated Dominican cedula format');
assert(client.includes("/^\\d{3}-\\d{7}-\\d$/"), 'client must require hyphenated Dominican cedula format');

assert(client.includes('M 28.992188 8 C 23.873188 8'), 'requested database/cloud SVG icon is missing');
assert(client.includes("id=\"hashcodEntryRegistrationSubmit\""), 'send button missing');
assert(client.includes("id=\"hashcodEntryRegistrationRecords\""), 'records icon button missing');
assert(client.includes('data-no-autosave data-hashcod-autosave="off"'),
  'PII registration form must opt out of browser/local autosave');

assert(css.includes('html[data-hashcod-final-entry-screen="true"] #hashcodFinalEntryRegistration'),
  'form must reveal only on the third/final entry screen');
assert(css.includes('#hashcodFinalEntryRegistration'), 'registration root styles missing');

assert(client.includes("endpoint('submit')"), 'submit endpoint call missing');
assert(client.includes("endpoint('list')"), 'records endpoint call missing');
assert(client.includes("window.HashcodAdmin.require({ force: true })"),
  'records viewer must require the existing administrative CodeKey gate');
assert(backend.includes('adminRequire();'), 'records backend must enforce the server-side admin session');

assert(backend.includes("securityRateAllowSliding('hashcod_access_request_submit', 8, 3600)"),
  'public submission endpoint must be rate limited');
assert(backend.includes('secretsEncrypt($value)'), 'sensitive form data must be encrypted before storage');
assert(backend.includes('secretsDecrypt($value)'), 'admin viewer must decrypt sensitive fields server-side');
assert(!backend.includes('file_put_contents('), 'PII must not fall back to plaintext local files');
assert(backend.includes("'use_secret' => true"), 'database writes must stay server-side with the secret key');

assert(migration.includes('create table if not exists public.hashcod_access_requests'), 'Postgres table migration missing');
assert(migration.includes('alter table public.hashcod_access_requests enable row level security'), 'RLS must be enabled');
assert(migration.includes('revoke all on table public.hashcod_access_requests from public, anon, authenticated'), 'public table grants must be revoked');
assert(migration.includes('grant select, insert on table public.hashcod_access_requests to service_role'), 'service_role grant missing');
assert(migration.includes('check (age between 18 and 120)'), 'database must enforce 18+ age constraint');

assert(router.includes("'/api/access-intake/submit'"), 'submit route missing');
assert(router.includes("'/api/access-intake/list'"), 'records route missing');

assert(hosted.includes('components/final-entry-registration.css?v=20260917-1'), 'hosted form CSS missing');
assert(hosted.includes('components/final-entry-registration.js?v=20260917-1'), 'hosted form JS missing');
assert(local.includes('components/final-entry-registration.css?v=20260917-1'), 'local form CSS missing');
assert(local.includes('components/final-entry-registration.js?v=20260917-1'), 'local form JS missing');

assert(!hosted.includes('hashcodPlatformImprovementSign'), 'old improvement sign must be removed from hosted entry');
assert(!local.includes('hashcodPlatformImprovementSign'), 'old improvement sign must be removed from local entry');

console.log('PASS: final entry registration is 18+, server-validated, encrypted, Postgres-backed, and admin-table protected.');
