'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = path.resolve(__dirname, '../..');
const frontend = fs.readFileSync(path.join(root, 'components/toolbox-secure-links.js'), 'utf8');
const styles = fs.readFileSync(path.join(root, 'components/toolbox-secure-links.css'), 'utf8');
const rescue = fs.readFileSync(path.join(root, 'components/toolbox-secure-ui-rescue.js'), 'utf8');
const signatureCopy = fs.readFileSync(path.join(root, 'components/toolbox-signature-copy.js'), 'utf8');
const backend = fs.readFileSync(path.join(root, 'toolbox-secure.php'), 'utf8');
const html = fs.readFileSync(path.join(root, 'l8-html.php'), 'utf8');

function check(name, fn) {
    try {
        fn();
        console.log('✓ ' + name);
    } catch (error) {
        console.error('✗ ' + name + ': ' + error.message);
        process.exitCode = 1;
    }
}

check('Toolbox circle-link runtime is retired and does not intercept clicks', () => {
    assert(frontend.includes('__hashcodToolboxCircleLinksRetired'));
    assert(frontend.includes('__hashcodSecureToolboxLinksLoaded = true'));
    assert(!frontend.includes("document.addEventListener('click'"));
    assert(!frontend.includes('stopImmediatePropagation'));
    assert(!frontend.includes('handleSlot('));
    assert(!frontend.includes('openConfig('));
    assert(!frontend.includes('fetch('));
});

check('fresh HTML blocks stale cached circle-link runtimes before they initialize', () => {
    assert(rescue.includes('__hashcodSecureToolboxLinksLoaded = true'));
    assert(rescue.includes('__hashcodToolboxSignatureCopyLoaded = true'));
    assert(rescue.includes("document.getElementById('hashcodSecureToolboxRoot')"));
    assert(html.includes('$inlineRescueTag'));
    assert(html.indexOf('$inlineRescueTag') < html.indexOf('toolbox-secure-links.js'));
});

check('retirement cleanup removes link-only circle decoration', () => {
    assert(frontend.includes("classList.remove('hashcod-secure-link-slot')"));
    assert(frontend.includes("removeAttribute('data-hashcod-secure-link')"));
    assert(frontend.includes("removeAttribute('data-hashcod-link-capable')"));
    assert(rescue.includes("removeAttribute('data-hashcod-secure-link')"));
});

check('retired UI is force-hidden even if stale markup exists', () => {
    assert(styles.includes('#hashcodSecureToolboxRoot'));
    assert(styles.includes('.hsl-modal'));
    assert(styles.includes('.hsl-browser'));
    assert(styles.includes('display: none !important'));
    assert(styles.includes('pointer-events: none !important'));
});

check('signature helper is inert', () => {
    assert(signatureCopy.includes('__hashcodToolboxCircleLinksRetired'));
    assert(!signatureCopy.includes('MutationObserver'));
    assert(!signatureCopy.includes('addEventListener'));
});

check('server API fails closed and cannot save or unlock circle links', () => {
    assert(backend.includes('http_response_code(410)'));
    assert(backend.includes('toolbox_circle_links_retired'));
    assert(!backend.includes("if ($action === 'save')"));
    assert(!backend.includes("if ($action === 'unlock')"));
    assert(!backend.includes('password_hash'));
    assert(!backend.includes('password_verify'));
    assert(!backend.includes('supabaseRequest'));
});

if (process.exitCode) process.exit(process.exitCode);
console.log('Retired Toolbox circle-link regression suite passed.');
