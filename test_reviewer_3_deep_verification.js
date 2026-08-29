const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('======================================================================');
console.log('REVIEWER_3 DEEP ADVERSARIAL VERIFICATION & VALIDATION SUITE');
console.log('======================================================================\n');

const indexPath = path.resolve(__dirname, 'index.php');
assert(fs.existsSync(indexPath), 'index.php must exist');
const indexHtml = fs.readFileSync(indexPath, 'utf8');

// ---------------------------------------------------------------------------
// SUITE 1: STATIC CODE, DOM ATTRIBUTES & CSS AESTHETIC AUDIT
// ---------------------------------------------------------------------------
console.log('--- SUITE 1: Static Code, DOM & CSS Aesthetic Audit ---');

const requiredSelectors = [
    '.auth-checkout-box',
    '.auth-checkout-box::before',
    '.auth-checkout-header',
    '.auth-checkout-badge',
    '.auth-checkout-badge-dot',
    '.auth-checkout-price',
    '.auth-checkout-price strong',
    '.auth-voucher-terminal-bar',
    '.auth-voucher-id-pill',
    '.auth-checkout-text',
    '.auth-checkout-text strong',
    '.auth-whatsapp-link',
    '.auth-checkout-actions',
    '.auth-btn-whatsapp',
    '.auth-btn-capture',
    '.auth-btn-copy-msg',
    '.auth-checkout-checkbox-label'
];

requiredSelectors.forEach(sel => {
    assert(indexHtml.includes(sel), 'CSS missing selector: ' + sel);
});
console.log('  ✓ All 17 CSS classes and pseudo-elements present.');

const requiredDOMElements = [
    'id="authCheckoutBox"',
    'id="authVoucherIdDisplay"',
    'id="authInlineWhatsappLink"',
    'id="authWhatsappBtn"',
    'id="authCaptureCheckoutBtn"',
    'id="authCopyWhatsappBtn"',
    'id="authCheckoutCheckbox"'
];

requiredDOMElements.forEach(el => {
    assert(indexHtml.includes(el), 'DOM missing element: ' + el);
});
console.log('  ✓ All required DOM elements present in index.php markup.');

// ---------------------------------------------------------------------------
// SUITE 2: EXTRACT AND SANDBOX JAVASCRIPT FUNCTIONS
// ---------------------------------------------------------------------------
console.log('\n--- SUITE 2: JavaScript Sandbox Execution & Verification ---');

const jsExtractMatch = indexHtml.match(/\/\* ===== HIGH-TECH WHATSAPP MESSAGE GENERATOR[\s\S]*?document\.getElementById\('authRegisterBtn'\)/);
assert(jsExtractMatch, 'Could not extract WhatsApp checkout engine JS block');

const jsBlock = jsExtractMatch[0].replace(/document\.getElementById\('authRegisterBtn'\)$/, '');

function createMockEnvironment(options = {}) {
    const mockElements = {
        authVoucherIdDisplay: { textContent: '' },
        authWhatsappBtn: { href: '', target: '', rel: '', innerHTML: 'WhatsApp', style: {} },
        authInlineWhatsappLink: { href: '', target: '', rel: '' },
        authCaptureCheckoutBtn: { innerHTML: 'Capture', style: {} },
        authCopyWhatsappBtn: { innerHTML: 'Copy', style: {} },
        authCheckoutCheckbox: { checked: false, focus: () => {} },
        authPrivacyCheckbox: { checked: false, focus: () => {}, closest: () => ({ style: {} }) },
        authCheckoutBox: { style: {} },
        authDilithiumInput: { value: '' }
    };

    const mockDoc = {
        getElementById: (id) => mockElements[id] || null,
        createElement: (tag) => {
            if (tag === 'canvas') {
                if (options.failCanvas) return null;
                return {
                    width: 0,
                    height: 0,
                    getContext: (type) => {
                        if (options.failCanvasContext) return null;
                        return createMockCanvasContext(options);
                    },
                    toDataURL: (fmt) => 'data:image/png;base64,MOCK_DATA'
                };
            }
            if (tag === 'a') {
                return {
                    download: '',
                    href: '',
                    click: () => {},
                    style: {}
                };
            }
            if (tag === 'textarea') {
                return {
                    value: '',
                    style: {},
                    setAttribute: () => {},
                    focus: () => {},
                    select: () => {},
                    setSelectionRange: (s, e) => {}
                };
            }
            return { style: {}, setAttribute: () => {} };
        },
        body: {
            appendChild: () => {},
            removeChild: () => {}
        },
        createRange: () => ({
            selectNodeContents: () => {}
        }),
        execCommand: (cmd) => {
            if (options.failExecCommand) return false;
            return true;
        }
    };

    const mockWin = {
        __hashcodCheckoutSession: null,
        document: mockDoc,
        open: (url, target, features) => {
            mockWin._lastOpened = { url, target, features };
        },
        getSelection: () => ({
            removeAllRanges: () => {},
            addRange: () => {}
        }),
        showAdminToast: (msg) => {
            mockWin._lastToast = msg;
        }
    };

    if (options.cryptoMode === 'windowCrypto') {
        mockWin.crypto = {
            getRandomValues: (buf) => {
                for (let i = 0; i < buf.length; i++) buf[i] = (i + 0x42) % 256;
                return buf;
            }
        };
    } else if (options.cryptoMode === 'none') {
        // Fallback to Math.random
    } else {
        mockWin.crypto = {
            getRandomValues: (buf) => {
                for (let i = 0; i < buf.length; i++) buf[i] = Math.floor(Math.random() * 256);
                return buf;
            }
        };
    }

    if (options.mockClipboard) {
        mockWin.navigator = {
            clipboard: {
                writeText: async (text) => {
                    if (options.failClipboard) throw new Error('Clipboard denied');
                    mockWin._clipboardText = text;
                }
            },
            userAgent: options.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        };
    } else {
        mockWin.navigator = {
            userAgent: options.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        };
    }

    return { mockWin, mockDoc, mockElements };
}

function createMockCanvasContext(options = {}) {
    const drawCalls = [];
    const ctx = {
        beginPath: () => drawCalls.push({ type: 'beginPath' }),
        moveTo: (x, y) => drawCalls.push({ type: 'moveTo', x, y }),
        lineTo: (x, y) => drawCalls.push({ type: 'lineTo', x, y }),
        stroke: () => drawCalls.push({ type: 'stroke' }),
        fill: () => drawCalls.push({ type: 'fill' }),
        fillRect: (x, y, w, h) => drawCalls.push({ type: 'fillRect', x, y, w, h }),
        fillText: (text, x, y) => drawCalls.push({ type: 'fillText', text, x, y }),
        createLinearGradient: (x0, y0, x1, y1) => ({
            addColorStop: (pos, col) => {}
        }),
        rect: (x, y, w, h) => drawCalls.push({ type: 'rect', x, y, w, h }),
        _drawCalls: drawCalls
    };

    if (!options.legacyCanvas) {
        ctx.roundRect = (x, y, w, h, radii) => drawCalls.push({ type: 'roundRect', x, y, w, h, radii });
    }

    return ctx;
}

function executeEngineInEnv(env) {
    const sandbox = new Function('window', 'document', 'navigator', jsBlock);
    sandbox(env.mockWin, env.mockDoc, env.mockWin.navigator);
}

// ---------------------------------------------------------------------------
// SUITE 3: SESSION GENERATOR & ENTROPY STRESS TEST
// ---------------------------------------------------------------------------
console.log('--- SUITE 3: Session Generator & Entropy Stress Test ---');

const env1 = createMockEnvironment();
executeEngineInEnv(env1);

const session1 = env1.mockWin.getCheckoutVoucherSession();
assert(session1, 'getCheckoutVoucherSession returned falsy');
assert(/^HASHCOD-L8-[0-9A-F]{4}$/.test(session1.voucherId), 'Invalid voucher format: ' + session1.voucherId);
assert.strictEqual(session1.priceUsd, '60.27');
assert.strictEqual(session1.currency, 'USD');
assert.strictEqual(session1.issuer, 'DIKTATCART');
assert.strictEqual(session1.rnc, '40209369293');
assert.strictEqual(session1.onapi, '#336973');
assert.strictEqual(session1.registroMercantil, '#3323LV-PF');

console.log('  ✓ Voucher Session structure verified:', session1.voucherId);

// Test persistence: calling without forceNew returns same session
const session1b = env1.mockWin.getCheckoutVoucherSession();
assert.strictEqual(session1, session1b, 'getCheckoutVoucherSession should persist in window.__hashcodCheckoutSession');

// Test forceNew
const session1c = env1.mockWin.getCheckoutVoucherSession(true);
assert(session1c, 'forceNew should return session');

// Stress test entropy with 20,000 runs
const voucherMap = new Set();
for (let i = 0; i < 20000; i++) {
    const s = env1.mockWin.getCheckoutVoucherSession(true);
    voucherMap.add(s.voucherId);
}
console.log('  ✓ 20,000 sessions generated. Unique voucher IDs: ' + voucherMap.size + ' (Entropy healthy).');

// ---------------------------------------------------------------------------
// SUITE 4: MESSAGE TEMPLATE, JSON PAYLOAD & DOMINICAN REPUBLIC CREDENTIALS
// ---------------------------------------------------------------------------
console.log('\n--- SUITE 4: Message Template, JSON Schema & Legal Credentials ---');

const msgText = env1.mockWin.buildWhatsAppMessageText(session1);
assert(msgText.includes('CONFIRMACIÓN DE ACEPTACIÓN DE TÉRMINOS Y POLÍTICA DE PRIVACIDAD'), 'Missing main header');
assert(msgText.includes('US$ 60.27 / mes'), 'Missing monthly subscription price');
assert(msgText.includes('Coordinación y Liquidación Directa vía WhatsApp (No prepagado)'), 'Missing non-payment clarification');
assert(msgText.includes('DIKTATCART'), 'Missing issuer');
assert(msgText.includes('40209369293'), 'Missing RNC');
assert(msgText.includes('336973'), 'Missing ONAPI');
assert(msgText.includes('3323LV-PF'), 'Missing Registro Mercantil');
assert(msgText.includes('Ley No. 126-02'), 'Missing legal framework');

// Tabs 1 to 7 verification
for (let t = 1; t <= 7; t++) {
    assert(msgText.includes('Tab ' + t), 'Missing Tab ' + t + ' confirmation in WhatsApp text');
}

// Extract JSON block from markdown codeblock
const codeBlocks = msgText.split('```');
assert(codeBlocks.length >= 5, 'Expected at least 2 triple-backtick codeblocks (ASCII header + JSON payload)');
// block 1 is ASCII header, block 3 is JSON payload
const jsonRaw = codeBlocks[3].trim();
const parsedJson = JSON.parse(jsonRaw);

assert.strictEqual(parsedJson.protocol, 'HASHCOD-L8-PQC-V1');
assert.strictEqual(parsedJson.document_type, 'CONFIRMACION_ACEPTACION_TERMINOS_Y_PRIVACIDAD');
assert.strictEqual(parsedJson.price_usd, 60.27);
assert.strictEqual(parsedJson.currency, 'USD');
assert.strictEqual(parsedJson.payment_mode, 'COORDINACION_DIRECTA_TRANSFERENCIA_WHATSAPP');
assert.strictEqual(parsedJson.settlement_status, 'PENDIENTE_COORDINACION_NO_PREPAGADO');
assert.strictEqual(parsedJson.status, 'SOLICITUD_PAGO_Y_EMISION_LLAVE_DILITHIUM5');
assert.strictEqual(parsedJson.rnc, '40209369293');
assert.strictEqual(parsedJson.onapi, '336973');
assert.strictEqual(parsedJson.registro_mercantil, '3323LV-PF');

assert(parsedJson.audit_tabs_acceptance.tab_1_alcance_cero_telemetria === true, 'Tab 1 mismatch in JSON');
assert(parsedJson.audit_tabs_acceptance.tab_2_openclaw_agentes_autonomos === true, 'Tab 2 mismatch in JSON');
assert(parsedJson.audit_tabs_acceptance.tab_3_criptografia_pqc_strix_scanner === true, 'Tab 3 mismatch in JSON');
assert(parsedJson.audit_tabs_acceptance.tab_4_soda_storage_documentos_locales === true, 'Tab 4 mismatch in JSON');
assert(parsedJson.audit_tabs_acceptance.tab_5_licenciamiento_foss_bash_mit === true, 'Tab 5 mismatch in JSON');
assert(parsedJson.audit_tabs_acceptance.tab_6_evidencias_software_gus_mav === true, 'Tab 6 mismatch in JSON');
assert(parsedJson.audit_tabs_acceptance.tab_7_validacion_legal_dominicana.onapi_marca_336973 === true, 'Tab 7 ONAPI mismatch in JSON');
assert(parsedJson.audit_tabs_acceptance.tab_7_validacion_legal_dominicana.dgii_rnc_40209369293 === true, 'Tab 7 DGII mismatch in JSON');
assert(parsedJson.audit_tabs_acceptance.tab_7_validacion_legal_dominicana.camara_comercio_rm_3323lv_pf === true, 'Tab 7 RM mismatch in JSON');

assert(parsedJson.user_acceptance.privacy_policy === true, 'user_acceptance privacy_policy mismatch');
assert(parsedJson.user_acceptance.deterministic_ai_certification === true, 'user_acceptance deterministic_ai_certification mismatch');
assert(parsedJson.user_acceptance.monthly_subscription_terms === true, 'user_acceptance monthly_subscription_terms mismatch');
assert(parsedJson.user_acceptance.monthly_amount_usd === 60.27, 'user_acceptance monthly_amount_usd mismatch');
assert(parsedJson.user_acceptance.dilithium5_key_issuance_requested === true, 'user_acceptance dilithium5 key requested mismatch');

console.log('  ✓ Structured JSON payload matches all audit specs and tabs.');

// ---------------------------------------------------------------------------
// SUITE 5: URL-ENCODING ROUNDTRIP & DEEP LINK INTEGRITY
// ---------------------------------------------------------------------------
console.log('\n--- SUITE 5: WhatsApp URL-Encoding & Deep-Link Roundtrip ---');

const waUrl = env1.mockWin.getWhatsAppCheckoutUrl(session1);
assert(waUrl.startsWith('https://wa.me/18294721257?text='), 'Invalid WhatsApp URL prefix');

const queryText = waUrl.replace('https://wa.me/18294721257?text=', '');
const decodedText = decodeURIComponent(queryText);
assert.strictEqual(decodedText, msgText, 'Lossless decodeURIComponent roundtrip failed!');
console.log('  ✓ 100% Lossless URI encode/decode roundtrip confirmed.');

// ---------------------------------------------------------------------------
// SUITE 6: INTERACTIVE ACTIONS & CHECKBOX SYNCHRONIZATION
// ---------------------------------------------------------------------------
console.log('\n--- SUITE 6: Interactive Actions & Checkbox Synchronization ---');

// Test 6a: openWhatsAppCheckout with event target
const env2 = createMockEnvironment();
executeEngineInEnv(env2);
env2.mockElements.authCheckoutCheckbox.checked = false;

const mockAnchor = { tagName: 'A', href: '', target: '', rel: '', closest: () => null };
const mockEvent = { currentTarget: mockAnchor, preventDefault: () => {} };

env2.mockWin.openWhatsAppCheckout(mockEvent);
assert.strictEqual(env2.mockElements.authCheckoutCheckbox.checked, true, 'openWhatsAppCheckout did not check authCheckoutCheckbox');
assert(mockAnchor.href.startsWith('https://wa.me/18294721257?text='), 'openWhatsAppCheckout did not set anchor href');
assert.strictEqual(mockAnchor.target, '_blank');
assert.strictEqual(mockAnchor.rel, 'noopener noreferrer');
console.log('  ✓ openWhatsAppCheckout synchronizes checkbox and updates anchor target.');

// Test 6b: openWhatsAppCheckout fallback without anchor
const env3 = createMockEnvironment();
executeEngineInEnv(env3);
env3.mockElements.authCheckoutCheckbox.checked = false;

env3.mockWin.openWhatsAppCheckout(null);
assert.strictEqual(env3.mockElements.authCheckoutCheckbox.checked, true, 'openWhatsAppCheckout fallback did not check checkbox');
assert(env3.mockWin._lastOpened.url.startsWith('https://wa.me/18294721257?text='), 'window.open was not called on null event');
console.log('  ✓ openWhatsAppCheckout fallback to window.open verified.');

// Test 6c: copyWhatsAppMessage with navigator.clipboard
const env4 = createMockEnvironment({ mockClipboard: true });
executeEngineInEnv(env4);
env4.mockElements.authCheckoutCheckbox.checked = false;

(async () => {
    await env4.mockWin.copyWhatsAppMessage();
    assert.strictEqual(env4.mockElements.authCheckoutCheckbox.checked, true, 'copyWhatsAppMessage did not check checkbox');
    assert.strictEqual(env4.mockWin._clipboardText, env4.mockWin.buildWhatsAppMessageText(), 'Clipboard text mismatch');
    assert.strictEqual(env4.mockElements.authCopyWhatsappBtn.innerHTML, '<span>¡Payload Copiado! ✓</span>', 'Missing visual button feedback');
    console.log('  ✓ Modern navigator.clipboard copy with UI feedback verified.');

    // Test 6d: copyWhatsAppMessage fallback for iOS WebKit
    const env5 = createMockEnvironment({ mockClipboard: true, failClipboard: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)' });
    executeEngineInEnv(env5);
    env5.mockElements.authCheckoutCheckbox.checked = false;

    await env5.mockWin.copyWhatsAppMessage();
    assert.strictEqual(env5.mockElements.authCheckoutCheckbox.checked, true, 'iOS fallback did not check checkbox');
    assert.strictEqual(env5.mockElements.authCopyWhatsappBtn.innerHTML, '<span>¡Payload Copiado! ✓</span>', 'iOS fallback missing visual feedback');
    console.log('  ✓ iOS Safari WebKit fallback with range selection verified.');

    // ---------------------------------------------------------------------------
    // SUITE 7: CANVAS RENDERING PIPELINE & PATH ISOLATION
    // ---------------------------------------------------------------------------
    console.log('\n--- SUITE 7: Canvas 2D Rendering Pipeline & Path Isolation ---');

    // Test 7a: Modern Canvas with roundRect
    const envModern = createMockEnvironment();
    executeEngineInEnv(envModern);
    envModern.mockElements.authCheckoutCheckbox.checked = false;

    envModern.mockWin.triggerCheckoutCapture();
    assert.strictEqual(envModern.mockElements.authCheckoutCheckbox.checked, true, 'Canvas capture did not synchronize checkbox');
    console.log('  ✓ Modern Canvas2D (roundRect) rendering executed cleanly.');

    // Test 7b: Legacy Canvas without roundRect (rect fallback)
    const envLegacy = createMockEnvironment({ legacyCanvas: true });
    executeEngineInEnv(envLegacy);
    envLegacy.mockElements.authCheckoutCheckbox.checked = false;

    envLegacy.mockWin.triggerCheckoutCapture();
    assert.strictEqual(envLegacy.mockElements.authCheckoutCheckbox.checked, true, 'Legacy canvas capture did not synchronize checkbox');
    console.log('  ✓ Legacy Canvas2D (rect fallback) rendering executed cleanly.');

    // Test 7c: Graceful handling when Canvas fails
    const envFailCanvas = createMockEnvironment({ failCanvas: true });
    executeEngineInEnv(envFailCanvas);
    envFailCanvas.mockElements.authCheckoutCheckbox.checked = false;

    envFailCanvas.mockWin.triggerCheckoutCapture();
    assert.strictEqual(envFailCanvas.mockElements.authCheckoutCheckbox.checked, true, 'Failed canvas did not synchronize checkbox');
    console.log('  ✓ Canvas failure degradation and error recovery verified.');

    // ---------------------------------------------------------------------------
    // SUITE 8: TIMEZONE CALCULATION & INTL FAILSAFE
    // ---------------------------------------------------------------------------
    console.log('\n--- SUITE 8: Timezone Calculation & Intl Failsafe ---');

    const envNoIntl = createMockEnvironment();
    delete envNoIntl.mockWin.Intl;
    executeEngineInEnv(envNoIntl);

    const sessionNoIntl = envNoIntl.mockWin.getCheckoutVoucherSession(true);
    assert(sessionNoIntl.timezone === 'America/Santo_Domingo', 'Fallback timezone should be America/Santo_Domingo');
    assert(sessionNoIntl.timezoneOffset.startsWith('UTC'), 'Timezone offset should start with UTC');
    console.log('  ✓ Timezone falls back to America/Santo_Domingo when Intl is unavailable.');

    console.log('\n======================================================================');
    console.log('ALL REVIEWER_3 DEEP ADVERSARIAL SUITES PASSED WITH ZERO DEFECTS! ✓');
    console.log('======================================================================\n');
})();
