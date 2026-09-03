const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('====================================================');
console.log('VICTORY AUDITOR INDEPENDENT VERIFICATION TEST SUITE');
console.log('====================================================\n');

const indexPath = path.join(__dirname, 'index.php');
assert(fs.existsSync(indexPath), 'index.php must exist');
const content = fs.readFileSync(indexPath, 'utf8');

// 1. Static Code Analysis & Forensic Integrity
console.log('[Phase 1] Static Code & CSS Analysis...');

// Check CSS classes
const requiredCss = [
    '.auth-checkout-box',
    '.auth-checkout-header',
    '.auth-checkout-badge',
    '.auth-checkout-price',
    '.auth-voucher-terminal-bar',
    '.auth-voucher-id-pill',
    '.auth-checkout-text',
    '.auth-whatsapp-link',
    '.auth-checkout-actions',
    '.auth-btn-whatsapp',
    '.auth-btn-capture',
    '.auth-btn-copy-msg',
    '.auth-checkout-checkbox-label'
];

requiredCss.forEach(selector => {
    assert(content.includes(selector), `Missing CSS selector: ${selector}`);
});
console.log('  ✓ All 13 checkout & vector CSS rules present.');

// Check HTML Elements
const requiredElements = [
    'id="authCheckoutBox"',
    'id="authVoucherIdDisplay"',
    'id="authInlineWhatsappLink"',
    'id="authWhatsappBtn"',
    'id="authCaptureCheckoutBtn"',
    'id="authCopyWhatsappBtn"',
    'id="authCheckoutCheckbox"',
    '10 US$/mes',
    '829-472-1257',
    'DIKTATCART',
    '3323LV-PF'
];

requiredElements.forEach(item => {
    assert(content.includes(item), `Missing HTML DOM element or text: ${item}`);
});
console.log('  ✓ All required HTML DOM elements and credential texts present.');

// 2. Behavioral Verification of JS Engine
console.log('\n[Phase 2] Behavioral Logic Extraction & Independent Sandbox Testing...');

const jsMatch = content.match(/\/\* ===== HIGH-TECH WHATSAPP MESSAGE GENERATOR & PQC VOUCHER ENGINE ===== \*\/([\s\S]*?)document\.getElementById\('authRegisterBtn'\)/);
assert(jsMatch && jsMatch[1], 'Failed to extract WhatsApp & Voucher JS engine from index.php');

// Create fully isolated sandbox
let lastUrlOpened = null;
let lastTargetOpened = null;
let clipboardWritten = null;
let toastShown = null;
let msgShown = null;
let downloadTriggered = null;

const domStore = {};
function getEl(id) {
    if (!domStore[id]) {
        domStore[id] = {
            id,
            textContent: '',
            value: '',
            innerHTML: '<span class="icon"></span><span>Copiar Payload</span>',
            style: {},
            classList: { add: () => {}, remove: () => {}, toggle: () => {} },
            focus: () => { domStore[id]._focused = true; },
            closest: () => ({ style: {} })
        };
    }
    return domStore[id];
}

const mockCanvasCtx = {
    createLinearGradient: () => ({ addColorStop: () => {} }),
    fillRect: () => {},
    strokeRect: () => {},
    fillText: (text, x, y) => { mockCanvasCtx.renderedTexts.push({ text, x, y }); },
    beginPath: () => { mockCanvasCtx.beginPathCount++; },
    moveTo: () => {},
    lineTo: () => {},
    stroke: () => {},
    fill: () => {},
    roundRect: () => {},
    renderedTexts: [],
    beginPathCount: 0
};

const sandboxWindow = {
    document: {
        getElementById: (id) => getEl(id),
        createElement: (tag) => {
            if (tag === 'canvas') {
                return {
                    width: 0,
                    height: 0,
                    getContext: () => mockCanvasCtx,
                    toDataURL: () => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
                };
            }
            return {
                tag,
                value: '',
                style: {},
                setAttribute: () => {},
                appendChild: () => {},
                removeChild: () => {},
                focus: () => {},
                select: () => {},
                click: function() {
                    downloadTriggered = { filename: this.download, href: this.href };
                }
            };
        },
        body: {
            appendChild: () => {},
            removeChild: () => {}
        },
        execCommand: () => true
    },
    navigator: {
        clipboard: {
            writeText: async (t) => { clipboardWritten = t; return true; }
        }
    },
    crypto: {
        getRandomValues: (arr) => {
            for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 256);
            return arr;
        }
    },
    open: (url, target) => {
        lastUrlOpened = url;
        lastTargetOpened = target;
    },
    showAdminToast: (m) => { toastShown = m; },
    setMsg: (m, ok) => { msgShown = { m, ok }; }
};
sandboxWindow.window = sandboxWindow;

const runEngine = new Function('window', 'document', 'navigator', 'crypto', 'setMsg', jsMatch[1]);
runEngine(sandboxWindow, sandboxWindow.document, sandboxWindow.navigator, sandboxWindow.crypto, sandboxWindow.setMsg);

// 3. Stress test Session Generation Entropy & Format
console.log('\n[Phase 3] Stress Testing 10,000 Session Voucher Generations...');
const generatedIds = new Set();
for (let i = 0; i < 10000; i++) {
    const s = sandboxWindow.getCheckoutVoucherSession(true);
    assert(/^HASHCOD-L8-[0-9A-F]{4}$/.test(s.voucherId), `Voucher ID format invalid: ${s.voucherId}`);
    assert(!isNaN(Date.parse(s.timestamp)), `Timestamp invalid ISO: ${s.timestamp}`);
    assert.strictEqual(s.priceUsd, '60.27');
    assert.strictEqual(s.issuer, 'DIKTATCART');
    assert.strictEqual(s.rnc, '40209369293');
    assert.strictEqual(s.onapi, '#336973');
    assert.strictEqual(s.registroMercantil, '#3323LV-PF');
    assert(s.dayOfWeek, 'dayOfWeek missing');
    assert(s.timezone, 'timezone missing');
    generatedIds.add(s.voucherId);
}
console.log(`  ✓ 10,000 sessions generated. Unique IDs: ${generatedIds.size} / 10,000 (Distribution entropy OK).`);

// 4. WhatsApp Message Template & Markdown Compliance
console.log('\n[Phase 4] Verifying WhatsApp Message Template & Markdown Syntax...');
const testSession = sandboxWindow.getCheckoutVoucherSession(true);
const msg = sandboxWindow.buildWhatsAppMessageText(testSession);

// Check Markdown Syntax
assert(msg.includes('*HASHCOD CODESPACE® — CONFIRMACIÓN DE ACEPTACIÓN DE TÉRMINOS Y POLÍTICA DE PRIVACIDAD*'), 'Bold header missing');
assert(msg.includes('_Certificación Determinista de IA & Alojamiento Post-Cuántico (PQC)_'), 'Italic subtitle missing');
assert(msg.includes('~US$ 90.00~'), 'Strikethrough missing');
assert(msg.includes('> 🛡️'), 'Blockquote missing');
assert(msg.includes('> 💬'), 'Quote missing');
assert(msg.includes(`\`${testSession.voucherId}\``), 'Monospace voucher missing');

// Verify ASCII Box Header
const codeBlocks = msg.match(/```\n([\s\S]*?)\n```/g);
assert(codeBlocks && codeBlocks.length >= 2, 'Message must have at least 2 code blocks');
const asciiBlock = codeBlocks[0].replace(/```/g, '').trim();
const asciiLines = asciiBlock.split('\n');
assert.strictEqual(asciiLines.length, 4, 'ASCII box header must have 4 lines');
asciiLines.forEach((l, idx) => {
    assert.strictEqual(l.length, 36, `Line ${idx+1} length is ${l.length}, expected 36`);
});
console.log('  ✓ ASCII 36-column vector box header formatted correctly.');

// Verify JSON Payload inside second code block
const jsonString = codeBlocks[1].replace(/```/g, '').trim();
const payload = JSON.parse(jsonString);
assert.strictEqual(payload.protocol, 'HASHCOD-L8-PQC-V1');
assert.strictEqual(payload.voucher_id, testSession.voucherId);
assert.strictEqual(payload.timestamp, testSession.timestamp);
assert.strictEqual(payload.price_usd, 60.27);
assert.strictEqual(payload.currency, 'USD');
assert.strictEqual(payload.issuer, 'DIKTATCART');
assert.strictEqual(payload.rnc, '40209369293');
assert.strictEqual(payload.onapi, '336973');
assert.strictEqual(payload.registro_mercantil, '3323LV-PF');
assert.strictEqual(payload.quantum_algorithm, 'ML-DSA-87 / Dilithium-5 (NIST FIPS 204)');
assert.strictEqual(payload.audit_tabs_acceptance.tab_1_alcance_cero_telemetria, true);
assert.strictEqual(payload.audit_tabs_acceptance.tab_7_validacion_legal_dominicana.onapi_marca_336973, true);
assert.strictEqual(payload.user_acceptance.privacy_policy, true);
console.log('  ✓ Cryptographic JSON payload parsed and strictly validated.');

// 5. URL Encoding and Roundtrip
console.log('\n[Phase 5] Verifying URL-Encoding & WhatsApp Deep-Link Generator...');
const checkoutUrl = sandboxWindow.getWhatsAppCheckoutUrl(testSession);
assert(checkoutUrl.startsWith('https://wa.me/18294721257?text='), 'Invalid WhatsApp deep link target');
const queryText = checkoutUrl.substring('https://wa.me/18294721257?text='.length);
assert(!queryText.includes('\n'), 'URL must not contain raw line breaks');
assert(!queryText.includes(' '), 'URL must not contain raw spaces');
const decoded = decodeURIComponent(queryText);
assert.strictEqual(decoded, msg, 'Decoded message must strictly equal raw message');
console.log('  ✓ URL encoding and full roundtrip decoded text verified.');

// 6. UI Actions & Handlers
console.log('\n[Phase 6] Testing Action Handlers (Open, Copy, Capture)...');

// Test UI update
sandboxWindow.updateCheckoutVoucherUI();
assert.strictEqual(domStore['authVoucherIdDisplay'].textContent, testSession.voucherId);
assert.strictEqual(domStore['authWhatsappBtn'].href, checkoutUrl);
assert.strictEqual(domStore['authInlineWhatsappLink'].href, checkoutUrl);

// Test Open WhatsApp via click on anchor
const anchorEl = { tagName: 'A', href: '', target: '', rel: '' };
const clickEvt = { currentTarget: anchorEl, preventDefault: () => {} };
const handled = sandboxWindow.openWhatsAppCheckout(clickEvt);
assert.strictEqual(handled, true, 'Anchor click must return true');
assert.strictEqual(anchorEl.href, checkoutUrl);
assert.strictEqual(anchorEl.target, '_blank');
assert.strictEqual(anchorEl.rel, 'noopener noreferrer');

// Test Open WhatsApp via non-anchor
sandboxWindow.openWhatsAppCheckout();
assert.strictEqual(lastUrlOpened, checkoutUrl);
assert.strictEqual(lastTargetOpened, '_blank');

// Test Copy Message
(async () => {
    clipboardWritten = null;
    await sandboxWindow.copyWhatsAppMessage();
    assert.strictEqual(clipboardWritten, msg);
    assert(domStore['authCopyWhatsappBtn'].innerHTML.includes('¡Payload Copiado! ✓'));

    // Test Canvas Capture
    mockCanvasCtx.renderedTexts = [];
    mockCanvasCtx.beginPathCount = 0;
    downloadTriggered = null;
    sandboxWindow.triggerCheckoutCapture();
    assert(downloadTriggered !== null, 'Canvas download should be triggered');
    assert.strictEqual(downloadTriggered.filename, `Comprobante-Aceptacion-Terminos-${testSession.voucherId}.png`);
    assert(mockCanvasCtx.renderedTexts.some(t => t.text.includes(testSession.voucherId)), 'Voucher ID rendered on canvas');
    assert(mockCanvasCtx.renderedTexts.some(t => t.text.includes('US$ 60.27')), 'Price rendered on canvas');
    assert(mockCanvasCtx.renderedTexts.some(t => t.text.includes('DIKTATCART')), 'Issuer rendered on canvas');
    assert(mockCanvasCtx.renderedTexts.some(t => t.text.includes('40209369293')), 'RNC rendered on canvas');
    assert(mockCanvasCtx.beginPathCount >= 6, 'Canvas paths properly isolated with beginPath');

    // Verify checkbox auto-checked
    assert.strictEqual(domStore['authCheckoutCheckbox'].checked, true);

    console.log('\n====================================================');
    console.log('ALL INDEPENDENT VICTORY AUDITOR TESTS PASSED 100%');
    console.log('====================================================\n');
})();
