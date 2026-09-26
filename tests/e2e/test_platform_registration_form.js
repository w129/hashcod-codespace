'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const repoDir = path.resolve(__dirname, '../..');
const registrationJs = fs.readFileSync(path.join(repoDir, 'components/platform-registration-form.js'), 'utf8');
const monitorJs = fs.readFileSync(path.join(repoDir, 'components/codespace-security-monitor.js'), 'utf8');
const directJs = fs.readFileSync(path.join(repoDir, 'components/entry-registration-force.js'), 'utf8');

assert(registrationJs.includes("const VERSION = '20260925-registration-restored-stable2'"), 'platform registration must use the restored stable version');
assert(registrationJs.includes('registrationRestored: true'), 'registration API must expose registrationRestored');
assert(registrationJs.includes('registrationRetired: false'), 'registration API must no longer be retired');
assert(registrationJs.includes('mount: mount'), 'registration API must mount the form');
assert(registrationJs.includes('waitForSuccessfulSubmission'), 'registration API must wait for a real submission');
assert(registrationJs.includes('completePlatformEntry'), 'registration API must complete platform entry after submission');
assert(registrationJs.includes('hashcodRegFullName'), 'restored form must include full name field');
assert(registrationJs.includes('hashcodRegAge'), 'restored form must include age or birthdate field');
assert(registrationJs.includes('hashcodRegCedula'), 'restored form must include ID field');
assert(registrationJs.includes('hashcodRegPlatformName'), 'restored form must include platform field');
assert(registrationJs.includes('hashcodRegCodeFile'), 'restored form must include upload field');
assert(registrationJs.includes('hashcodRegistrationSubmit'), 'restored form must include submit button');
assert(registrationJs.includes('hc-pixel-bg'), 'restored form must include represented pixel icon background');

assert(!monitorJs.includes('installRetiredEntryBypass'), 'security monitor must not bypass the restored form');
assert(!monitorJs.includes('hashcodPlatformRegistration\','), 'security monitor must not remove the restored form root');
assert(monitorJs.includes('registration-restored'), 'security monitor must identify the restored registration state');

assert(directJs.includes("mode: 'passive'"), 'direct entry bridge must remain passive');
assert(directJs.includes('Do not intercept #bootCliEnter'), 'direct bridge must not intercept entry clicks');

console.log('PASS: platform registration form is restored and entry bypass is disabled.');
