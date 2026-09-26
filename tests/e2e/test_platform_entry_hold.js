const fs = require('fs');
const path = require('path');
const assert = require('assert');

const repoDir = path.resolve(__dirname, '../..');
const js = fs.readFileSync(path.join(repoDir, 'components/platform-entry-hold.js'), 'utf8');

assert(js.includes("const HOLD_RUNTIME_VERSION = '20260926-registration-restored-fast1'"), 'entry hold must use the restored fast registration version');
assert(js.includes('openRegistration'), 'entry hold must open the restored registration form');
assert(js.includes('waitForRegistrationApi'), 'entry hold must wait for the restored registration API');
assert(js.includes('registration.registrationRestored === true'), 'entry hold must require restored registration API state');
assert(js.includes('registration.mount()'), 'entry hold must mount the registration form directly');
assert(js.includes('hashcodRegistrationForm'), 'entry hold must verify that the form was mounted');
assert(js.includes('registration.waitForSuccessfulSubmission()'), 'entry hold must wait for form submission before opening Codespace');
assert(js.includes('registration.completePlatformEntry('), 'entry hold must complete platform entry after submission');
assert(js.includes('clearFrozenEntryLayers'), 'entry hold must remove stale frozen overlays');
assert(js.includes('ABRIENDO REGISTRO'), 'entry button must provide visible opening feedback');
assert(js.includes('event.stopImmediatePropagation'), 'entry hold must stop legacy handlers from freezing the click');
assert(!js.includes('await waitForContinue(overlay);'), 'entry hold must not wait for the removed intermediate continue screen');
assert(!js.includes('hashcodHoldContinue'), 'entry hold must not depend on a removed continue button');
assert(!js.includes('REINTENTAR REGISTRO'), 'entry hold must not fall back to a frozen retry overlay');

console.log('platform entry restored-registration contract: OK');
