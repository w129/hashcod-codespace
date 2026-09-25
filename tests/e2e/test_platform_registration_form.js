'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const repoDir = path.resolve(__dirname, '../..');
const registrationJs = fs.readFileSync(path.join(repoDir, 'components/platform-registration-form.js'), 'utf8');
const directJs = fs.readFileSync(path.join(repoDir, 'components/entry-registration-force.js'), 'utf8');

assert(registrationJs.includes("const VERSION = '20260925-registration-retired'"), 'platform registration must be marked as retired');
assert(registrationJs.includes('registrationRetired: true'), 'retired registration API must expose registrationRetired');
assert(registrationJs.includes('completePlatformEntry'), 'retired registration API must still complete platform entry');
assert(registrationJs.includes('hashcodPlatformEntered'), 'retired registration must mark the platform as entered');
assert(!registrationJs.includes('hashcodRegistrationSubmitReactHost'), 'retired registration must not render the old submit host');
assert(!registrationJs.includes('HASHCOD CODESPACE® — SOLICITUD DE REGISTRO DE PLATAFORMA'), 'retired registration must not keep WhatsApp request copy');

assert(directJs.includes("var VERSION = '20260925-direct11-no-form'"), 'direct entry script must use the no-form version');
assert(directJs.includes('data-hashcod-registration-retired'), 'direct entry must expose the retired-registration background marker');
assert(!directJs.includes('Registro de plataforma'), 'direct entry must not render the registration title');
assert(!directJs.includes('hcName'), 'direct entry must not render registration fields');

console.log('PASS: platform registration form is retired; entry keeps only the background transition and proceeds directly to Codespace.');
