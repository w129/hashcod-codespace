'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const repoDir = path.resolve(__dirname, '../..');
const registrationJs = fs.readFileSync(path.join(repoDir, 'components/platform-registration-form.js'), 'utf8');
const directJs = fs.readFileSync(path.join(repoDir, 'components/entry-registration-force.js'), 'utf8');

assert(registrationJs.includes("const VERSION = '20260925-registration-retired-preserve-entry'"), 'platform registration must be marked as retired while preserving entry animations');
assert(registrationJs.includes('registrationRetired: true'), 'retired registration API must expose registrationRetired');
assert(registrationJs.includes('preservesEntryAnimations: true'), 'retired registration must preserve the original entry animations');
assert(registrationJs.includes('completePlatformEntry'), 'retired registration API must still complete platform entry');
assert(registrationJs.includes('callOriginalEntry'), 'retired registration must hand off to the original entry function');
assert(registrationJs.includes('hashcodPlatformEntered'), 'retired registration must mark the platform as entered');
assert(!registrationJs.includes('hashcodRegistrationSubmitReactHost'), 'retired registration must not render the old submit host');
assert(!registrationJs.includes('HASHCOD CODESPACE® — SOLICITUD DE REGISTRO DE PLATAFORMA'), 'retired registration must not keep WhatsApp request copy');

assert(directJs.includes("var VERSION = '20260925-direct12-preserve-animations'"), 'direct entry script must use the passive preserve-animations version');
assert(directJs.includes("mode: 'passive'"), 'direct entry script must be passive and not intercept the entry click');
assert(directJs.includes('registrationRetired: true'), 'direct entry must expose retired-registration state');
assert(directJs.includes('preservesEntryAnimations: true'), 'direct entry must preserve original entry animations');
assert(directJs.includes('Do not intercept #bootCliEnter'), 'direct entry must document that it does not intercept the entry button');
assert(!directJs.includes('Registro de plataforma'), 'direct entry must not render the registration title');
assert(!directJs.includes('hcName'), 'direct entry must not render registration fields');

console.log('PASS: platform registration is retired while original entry animations remain authoritative.');
