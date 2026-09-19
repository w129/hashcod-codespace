'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const repoDir = path.resolve(__dirname, '../..');
const js = fs.readFileSync(path.join(repoDir, 'components/platform-registration-form.js'), 'utf8');
const css = fs.readFileSync(path.join(repoDir, 'components/platform-registration-form.css'), 'utf8');
const router = fs.readFileSync(path.join(repoDir, 'router.php'), 'utf8');
const schema = fs.readFileSync(path.join(repoDir, 'supabase/schema.sql'), 'utf8');
const hosted = fs.readFileSync(path.join(repoDir, 'l8-html.php'), 'utf8');
const local = fs.readFileSync(path.join(repoDir, 'laragon-local-entry.php'), 'utf8');
const cleanup = fs.readFileSync(path.join(repoDir, 'cleanup-platform-registration.php'), 'utf8');
const flipEntry = fs.readFileSync(path.join(repoDir, 'registration-flip-build/entry.tsx'), 'utf8');

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
  'hashcodRegistrationWhatsappButton'
]) {
  assert(js.includes(id), 'missing registration UI id: ' + id);
}

assert(js.includes('type="number" min="18" max="120"'), 'client age field must remain 18+');
assert(js.includes('/^\\d{3}-\\d{7}-\\d$/'), 'cedula validation missing');
assert(js.includes('000-0000000-0'), 'cedula format hint missing');
assert(js.includes('Number.isInteger(age) && age >= 18'), '18+ validation missing');
assert(js.includes('Object.values(v).every(Boolean)'), 'WhatsApp gating must require every form condition');
assert(js.includes('syncWhatsappState(ok)'), 'WhatsApp button must follow complete-form validity');
assert(js.includes('whatsappDispatchFingerprint === currentFingerprint'), 'entry must remain locked unless WhatsApp matches the current form');
assert(js.includes('syncSubmitState(whatsappMatchesForm, false)'), 'entry button must depend on the WhatsApp handoff');
assert(js.includes("Primero pulsa el botón de WhatsApp"), 'entry button must explain the WhatsApp prerequisite');
assert(js.includes('whatsappDispatched = true'), 'WhatsApp click must mark the handoff as completed');
assert(js.includes('whatsappDispatchFingerprint = fingerprint'), 'WhatsApp handoff must be bound to the exact form payload');
assert(js.includes('invalidateWhatsappDispatch()'), 'form edits must invalidate a previous WhatsApp handoff');
assert(js.includes('id="hashcodRegistrationWhatsappButton"'), 'WhatsApp action button missing');
assert(js.includes('aria-label="Entrar a Hashcod Codespace" disabled'), 'entry button label/gate missing');
assert(js.includes('ENTRAR A HASHCOD CODESPACE'), 'entry button visible label missing');
assert(flipEntry.includes("'ENTRAR A HASHCOD CODESPACE'"), 'React FlipButton entry label missing');
assert(flipEntry.includes("'ENTRANDO…'"), 'React FlipButton entering state missing');
assert(flipEntry.includes('aria-label="Entrar a Hashcod Codespace"'), 'React FlipButton aria label missing');
assert(js.includes('title="Enviar solicitud por WhatsApp" disabled'), 'WhatsApp button must start disabled');
assert(js.includes('viewBox="0 0 36 32"'), 'responsive WhatsApp SVG viewBox missing');
assert(js.includes('M 5 3 L 5 9 L 7 9 L 7 5'), 'requested replacement SVG path missing');
assert(!js.includes('width="100" height="100" viewBox="0 0 32 32" aria-hidden="true"><path d="M 5 3'), 'WhatsApp icon must not keep fixed 100x100 SVG dimensions');
assert(css.includes('width: 50px;'), 'desktop WhatsApp button size missing');
assert(css.includes('width: 22px;'), 'desktop WhatsApp icon size missing');
assert(css.includes('width: 46px;'), 'mobile WhatsApp button size missing');
assert(css.includes('width: 20px;'), 'mobile WhatsApp icon size missing');
assert(css.includes('#hashcodRegistrationWhatsappButton:not(:disabled):active'), 'WhatsApp active interaction state missing');

assert(js.includes("const WHATSAPP_NUMBER = '18294721257'"), 'official WhatsApp destination missing');
assert(js.includes('function generateRegistrationCode()'), 'local registration code generator missing');
assert(js.includes('window.crypto.getRandomValues(bytes)'), 'registration code must prefer CSPRNG');
assert(js.includes("return 'HC1-'"), 'HC1 registration-code format missing');
assert(js.includes('function ensureRegistrationCode()'), 'stable per-form registration code helper missing');
assert(js.includes('function buildRegistrationWhatsAppMessage(code)'), 'registration WhatsApp message builder missing');
for (const label of [
  '*Nombre con apellidos:*',
  '*Edad:*',
  '*Cédula:*',
  '*Nombre de la plataforma:*',
  '*Correo electrónico:*',
  '*Número de teléfono:*',
  '*Archivo de código:*',
  '*Tamaño del archivo:*',
  '*Código de solicitud:*',
  '*Documento contractual y de privacidad:* ACEPTADO'
]) {
  assert(js.includes(label), 'WhatsApp payload field missing: ' + label);
}
assert(js.includes("'https://wa.me/' + WHATSAPP_NUMBER + '?text='"), 'WhatsApp deep link pattern missing');
assert(js.includes('encodeURIComponent(buildRegistrationWhatsAppMessage(code))'), 'WhatsApp message must be URL encoded');
assert(js.includes("window.open(url, '_blank', 'noopener,noreferrer')"), 'WhatsApp must reuse external-window dispatch');
assert(js.includes('function sendRegistrationWhatsapp(event)'), 'WhatsApp action handler missing');
assert(js.includes("whatsappButton.addEventListener('click', sendRegistrationWhatsapp)"), 'WhatsApp button binding missing');

assert(js.includes("status('Acceso confirmado. Entrando a Hashcod Codespace…'"), 'entry confirmation status missing');
assert(js.includes("hashcod:registration-whatsapp-dispatched"), 'WhatsApp handoff event missing');
assert(js.includes("hashcod:platform-registration-approved"), 'entry approval event missing');
assert(!js.includes('hashcodRegistrationTableButton'), 'old database table button must be removed');
assert(!js.includes('hashcodRegistrationTableOverlay'), 'old database table overlay must be removed');
assert(!js.includes('window.HashcodAdmin'), 'registration flow must not use admin/CodeKey engine');
assert(!js.includes('CodeKey'), 'registration flow must not contain CodeKey copy');
assert(!js.includes('api/platform-registration'), 'registration form must not call the retired persistence API');

assert(css.includes('#hashcodRegistrationWhatsappButton'), 'WhatsApp action styling missing');
assert(css.includes('#hashcodRegistrationWhatsappButton:disabled'), 'disabled WhatsApp state styling missing');
assert(!css.includes('#hashcodRegistrationTableOverlay'), 'old table overlay CSS must be removed');
assert(!css.includes('.hashcod-registration-table-shell'), 'old table CSS must be removed');

assert(!router.includes("if ($uri === '/api/platform-registration')"), 'retired registration persistence route must be removed');
assert(!schema.includes('hashcod_platform_registrations'), 'Supabase schema must no longer recreate registration table');

assert(cleanup.includes("HASHCOD_LEGACY_REGISTRATION_TABLE = 'hashcod_platform_registrations'"), 'legacy row cleanup target missing');
assert(cleanup.includes("HASHCOD_LEGACY_REGISTRATION_BUCKET = 'hashcod-registration-code'"), 'legacy bucket cleanup target missing');
assert(cleanup.includes("/empty'"), 'Storage bucket must be emptied through the Storage API');
assert(cleanup.includes('supabaseDbHardDelete'), 'legacy registration rows must be purged');
assert(!cleanup.includes('delete from storage.objects'), 'Storage metadata must never be deleted directly with SQL');

assert(hosted.includes('platform-registration-form.js?v=20260919-42'), 'hosted registration JS cache version missing');
assert(local.includes('platform-registration-form.js?v=20260919-42'), 'local registration JS cache version missing');
assert(hosted.includes('platform-registration-form.css?v=20260919-30'), 'hosted registration CSS cache version missing');
assert(local.includes('platform-registration-form.css?v=20260919-30'), 'local registration CSS cache version missing');

console.log('PASS: registration is local-only; WhatsApp receives the data/code first, then and only then can the user enter Hashcod Codespace.');
