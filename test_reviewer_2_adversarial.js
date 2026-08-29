/**
 * Comprehensive Reviewer_2 Adversarial & Deep Verification Test Suite
 * Tests all requirements (R1, R2, R3) and acceptance criteria:
 * - Terms & Privacy Confirmation Message (R1)
 * - Dark Terminal PQC Card & Canvas Voucher Capture (R2)
 * - Interactive Clipboard, Deep Links & Checkbox Synchronization (R3)
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('================================================================');
console.log('REVIEWER_2 ADVERSARIAL & COMPREHENSIVE VERIFICATION SUITE');
console.log('================================================================\n');

const indexPath = path.join(__dirname, 'index.php');
assert(fs.existsSync(indexPath), 'index.php must exist');
const content = fs.readFileSync(indexPath, 'utf8');

// 1. Static HTML & CSS Checks
console.log('[Test 1] Static Code & Dark Terminal PQC Aesthetic Verification...');
const requiredClasses = [
    '.auth-checkout-box',
    '.auth-checkout-box::before',
    '.auth-checkout-header',
    '.auth-checkout-badge',
    '.auth-checkout-badge-dot',
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

requiredClasses.forEach(cls => {
    assert(content.includes(cls), `CSS rule missing: ${cls}`);
});

const requiredIds = [
    'id="authCheckoutBox"',
    'id="authVoucherIdDisplay"',
    'id="authWhatsappBtn"',
    'id="authCaptureCheckoutBtn"',
    'id="authCopyWhatsappBtn"',
    'id="authCheckoutCheckbox"',
    'id="authInlineWhatsappLink"'
];

requiredIds.forEach(id => {
    assert(content.includes(id), `HTML element missing: ${id}`);
});

// Verify security attributes on all WhatsApp links
const waAnchorMatch = content.match(/<a[^>]*id="authWhatsappBtn"[^>]*>/);
assert(waAnchorMatch && waAnchorMatch[0].includes('target="_blank"'), 'authWhatsappBtn missing target="_blank"');
assert(waAnchorMatch && waAnchorMatch[0].includes('rel="noopener noreferrer"'), 'authWhatsappBtn missing rel="noopener noreferrer"');

const inlineWaMatch = content.match(/<a[^>]*id="authInlineWhatsappLink"[^>]*>/);
assert(inlineWaMatch && inlineWaMatch[0].includes('target="_blank"'), 'authInlineWhatsappLink missing target="_blank"');
assert(inlineWaMatch && inlineWaMatch[0].includes('rel="noopener noreferrer"'), 'authInlineWhatsappLink missing rel="noopener noreferrer"');

console.log('  ✓ Dark terminal CSS and secure HTML markup verified.');

// 2. Behavioral Testing Sandbox
console.log('\n[Test 2] Extracting and Initializing JavaScript Engine Sandbox...');
const jsMatch = content.match(/\/\* ===== HIGH-TECH WHATSAPP MESSAGE GENERATOR & PQC VOUCHER ENGINE ===== \*\/([\s\S]*?)document\.getElementById\('authRegisterBtn'\)/);
assert(jsMatch && jsMatch[1], 'Could not extract JS engine block from index.php');

function createSandbox(overrides = {}) {
    const state = {
        clipboardWritten: null,
        execCommandCalled: false,
        openedUrls: [],
        toasts: [],
        messages: [],
        canvasOps: [],
        downloadedFile: null,
        dom: {}
    };

    function getEl(id) {
        if (!state.dom[id]) {
            state.dom[id] = {
                id,
                textContent: '',
                value: '',
                checked: false,
                innerHTML: id === 'authCopyWhatsappBtn' ? '<svg></svg><span>Copiar Payload</span>' : '',
                style: {},
                classList: { add: () => {}, remove: () => {}, toggle: () => {} },
                focus: () => { state.dom[id]._focused = true; },
                closest: () => ({ style: {} })
            };
        }
        return state.dom[id];
    }

    // Pre-populate core elements
    ['authCheckoutBox', 'authVoucherIdDisplay', 'authWhatsappBtn', 'authCaptureCheckoutBtn', 'authCopyWhatsappBtn', 'authCheckoutCheckbox', 'authInlineWhatsappLink'].forEach(getEl);

    const mockCtx = {
        createLinearGradient: () => ({ addColorStop: () => {} }),
        fillRect: (x, y, w, h) => { state.canvasOps.push({ op: 'fillRect', x, y, w, h }); },
        strokeRect: () => {},
        rect: (x, y, w, h) => { state.canvasOps.push({ op: 'rect', x, y, w, h }); },
        fillText: (txt, x, y) => { state.canvasOps.push({ op: 'fillText', txt, x, y }); },
        beginPath: () => { state.canvasOps.push({ op: 'beginPath' }); },
        moveTo: (x, y) => { state.canvasOps.push({ op: 'moveTo', x, y }); },
        lineTo: (x, y) => { state.canvasOps.push({ op: 'lineTo', x, y }); },
        stroke: () => { state.canvasOps.push({ op: 'stroke' }); },
        fill: () => { state.canvasOps.push({ op: 'fill' }); }
    };
    if (overrides.hasRoundRect !== false) {
        mockCtx.roundRect = (x, y, w, h, r) => { state.canvasOps.push({ op: 'roundRect', x, y, w, h, r }); };
    }

    const mockDoc = {
        getElementById: (id) => getEl(id),
        createElement: (tag) => {
            if (tag === 'canvas') {
                return {
                    width: 0,
                    height: 0,
                    getContext: () => mockCtx,
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
                select: () => { state.selected = true; },
                setSelectionRange: (s, e) => { state.selectionRange = [s, e]; },
                click: function () {
                    state.downloadedFile = { filename: this.download, href: this.href };
                }
            };
        },
        createRange: () => ({
            selectNodeContents: () => { state.rangeSelected = true; }
        }),
        body: { appendChild: () => {}, removeChild: () => {} },
        execCommand: () => { state.execCommandCalled = true; return true; }
    };

    const mockWin = {
        document: mockDoc,
        open: (url, target, features) => { state.openedUrls.push({ url, target, features }); },
        showAdminToast: (m) => { state.toasts.push(m); },
        setMsg: (m, ok) => { state.messages.push({ m, ok }); },
        getSelection: () => ({
            removeAllRanges: () => {},
            addRange: () => { state.selAddRangeCalled = true; }
        }),
        crypto: overrides.hasCrypto !== false ? {
            getRandomValues: (arr) => {
                for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 256);
                return arr;
            }
        } : undefined,
        navigator: {
            userAgent: overrides.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            clipboard: overrides.hasNavClipboard !== false ? {
                writeText: async (t) => { state.clipboardWritten = t; return true; }
            } : undefined
        }
    };
    mockWin.window = mockWin;

    const run = new Function('window', 'document', 'navigator', 'crypto', 'setMsg', 'Intl', jsMatch[1]);
    run(mockWin, mockWin.document, mockWin.navigator, mockWin.crypto, mockWin.setMsg, overrides.intlObj);

    return { mockWin, state };
}

// 3. Message Content, Non-Payment Clarification & Dominican Republic Credentials Test
console.log('\n[Test 3] R1: Formal Terms & Privacy Confirmation Message & Audit Metadata...');
{
    const { mockWin } = createSandbox();
    const session = mockWin.getCheckoutVoucherSession(true);
    const msg = mockWin.buildWhatsAppMessageText(session);

    // Verify Title & Subtitle
    assert(msg.includes('*HASHCOD CODESPACE® — CONFIRMACIÓN DE ACEPTACIÓN DE TÉRMINOS Y POLÍTICA DE PRIVACIDAD*'), 'Title incorrect');
    assert(msg.includes('_Certificación Determinista de IA & Alojamiento Post-Cuántico (PQC)_'), 'Subtitle incorrect');

    // Verify ASCII Header
    assert(msg.includes('╔══════════════════════════════════╗'), 'ASCII Header top border');
    assert(msg.includes('║  HASHCOD CODESPACE® · AUDIT PQC  ║'), 'ASCII Header title');
    assert(msg.includes('║   PRIVACY & TERMS ACCEPTANCE     ║'), 'ASCII Header subtitle');
    assert(msg.includes('╚══════════════════════════════════╝'), 'ASCII Header bottom border');

    // Verify Non-Payment & Direct WhatsApp Coordination Clarification
    assert(msg.includes('Modalidad:* Coordinación y Liquidación Directa vía WhatsApp (No prepagado)'), 'Must clarify non-prepaid coordination');
    assert(msg.includes('Estado:* *ACEPTACIÓN CONFIRMADA · SOLICITUD DE COORDENADAS DE PAGO*'), 'Must state confirmation & coordinates request');
    assert(msg.includes('US$ 60.27 / mes'), 'Price US$ 60.27 missing');
    assert(msg.includes('~US$ 90.00~'), 'Strike regular price ~US$ 90.00~ missing');

    // Verify Dominican Republic Legal Identifiers
    assert(msg.includes('DIKTATCART'), 'Issuer DIKTATCART missing');
    assert(msg.includes('40209369293'), 'DGII RNC 40209369293 missing');
    assert(msg.includes('336973'), 'ONAPI 336973 missing');
    assert(msg.includes('3323LV-PF'), 'Mercantile Registry 3323LV-PF missing');

    // Verify Tabs 1 to 7
    for (let t = 1; t <= 7; t++) {
        assert(msg.includes(`Tab ${t}`), `Tab ${t} declaration missing`);
    }

    // Verify JSON Payload Structure
    const jsonBlocks = msg.match(/```\n([\s\S]*?)\n```/g);
    assert(jsonBlocks && jsonBlocks.length >= 2, 'Must have at least 2 code blocks');
    const payload = JSON.parse(jsonBlocks[1].replace(/```/g, '').trim());

    assert.strictEqual(payload.protocol, 'HASHCOD-L8-PQC-V1');
    assert.strictEqual(payload.document_type, 'CONFIRMACION_ACEPTACION_TERMINOS_Y_PRIVACIDAD');
    assert.strictEqual(payload.voucher_id, session.voucherId);
    assert.strictEqual(payload.settlement_status, 'PENDIENTE_COORDINACION_NO_PREPAGADO');
    assert.strictEqual(payload.price_usd, 60.27);
    assert.strictEqual(payload.currency, 'USD');
    assert.strictEqual(payload.issuer, 'DIKTATCART');
    assert.strictEqual(payload.rnc, '40209369293');
    assert.strictEqual(payload.onapi, '336973');
    assert.strictEqual(payload.registro_mercantil, '3323LV-PF');
    assert.strictEqual(payload.quantum_algorithm, 'ML-DSA-87 / Dilithium-5 (NIST FIPS 204)');
    assert.strictEqual(payload.audit_tabs_acceptance.tab_1_alcance_cero_telemetria, true);
    assert.strictEqual(payload.audit_tabs_acceptance.tab_2_openclaw_agentes_autonomos, true);
    assert.strictEqual(payload.audit_tabs_acceptance.tab_3_criptografia_pqc_strix_scanner, true);
    assert.strictEqual(payload.audit_tabs_acceptance.tab_4_soda_storage_documentos_locales, true);
    assert.strictEqual(payload.audit_tabs_acceptance.tab_5_licenciamiento_foss_bash_mit, true);
    assert.strictEqual(payload.audit_tabs_acceptance.tab_6_evidencias_software_gus_mav, true);
    assert.strictEqual(payload.audit_tabs_acceptance.tab_7_validacion_legal_dominicana.onapi_marca_336973, true);
    assert.strictEqual(payload.audit_tabs_acceptance.tab_7_validacion_legal_dominicana.dgii_rnc_40209369293, true);
    assert.strictEqual(payload.audit_tabs_acceptance.tab_7_validacion_legal_dominicana.camara_comercio_rm_3323lv_pf, true);
    assert.strictEqual(payload.user_acceptance.privacy_policy, true);
    assert.strictEqual(payload.user_acceptance.deterministic_ai_certification, true);
    assert.strictEqual(payload.user_acceptance.monthly_subscription_terms, true);
    assert.strictEqual(payload.status, 'SOLICITUD_PAGO_Y_EMISION_LLAVE_DILITHIUM5');

    console.log('  ✓ R1 Acceptance Confirmation message and audit JSON payload strictly validated.');
}

// 4. Canvas Voucher Capture & Fallbacks
console.log('\n[Test 4] R2: Dark Terminal Canvas PNG Certificate & Fallback Rendering...');
{
    // Modern canvas with roundRect
    const { mockWin: winModern, state: stateModern } = createSandbox({ hasRoundRect: true });
    winModern.triggerCheckoutCapture();
    assert(stateModern.downloadedFile, 'Voucher PNG download triggered');
    assert(stateModern.downloadedFile.filename.startsWith('Comprobante-Aceptacion-Terminos-HASHCOD-L8-'), 'Filename format valid');
    assert(stateModern.dom['authCheckoutCheckbox'].checked, 'Checkbox should be auto-checked on voucher capture');

    // Legacy canvas without roundRect
    const { mockWin: winLegacy, state: stateLegacy } = createSandbox({ hasRoundRect: false });
    winLegacy.triggerCheckoutCapture();
    assert(stateLegacy.downloadedFile, 'Voucher PNG download triggered on legacy canvas');
    assert(stateLegacy.canvasOps.some(o => o.op === 'rect'), 'Fallback rect called on legacy canvas');
    assert(stateLegacy.dom['authCheckoutCheckbox'].checked, 'Checkbox should be auto-checked on legacy canvas capture');

    console.log('  ✓ R2 Canvas PNG Voucher generation verified for modern and legacy browsers.');
}

// 5. Interactive Actions & Checkbox Synchronization
console.log('\n[Test 5] R3: Interactive Deep-Links, Clipboard & Checkbox Synchronization...');
(async () => {
    const { mockWin, state } = createSandbox();
    const session = mockWin.getCheckoutVoucherSession(true);

    // Initial checkbox state is unchecked
    assert.strictEqual(state.dom['authCheckoutCheckbox'].checked, false);

    // Action A: Open WhatsApp via anchor click
    const anchorEl = { tagName: 'A', href: '', target: '', rel: '' };
    const clickEvt = { currentTarget: anchorEl, preventDefault: () => {} };
    const ret = mockWin.openWhatsAppCheckout(clickEvt);
    assert.strictEqual(ret, true, 'openWhatsAppCheckout on anchor must return true');
    assert(anchorEl.href.startsWith('https://wa.me/18294721257?text='), 'Anchor href updated');
    assert.strictEqual(state.dom['authCheckoutCheckbox'].checked, true, 'Checkbox must be auto-checked on WhatsApp open');

    // Action B: Open WhatsApp with target instead of currentTarget
    state.dom['authCheckoutCheckbox'].checked = false;
    const buttonTarget = { tagName: 'BUTTON', closest: (sel) => sel === 'a' ? anchorEl : null };
    const clickEvtTarget = { target: buttonTarget, preventDefault: () => {} };
    mockWin.openWhatsAppCheckout(clickEvtTarget);
    assert.strictEqual(state.dom['authCheckoutCheckbox'].checked, true, 'Checkbox must be auto-checked on target element click');

    // Action C: Copy Message (Modern Clipboard)
    state.dom['authCheckoutCheckbox'].checked = false;
    await mockWin.copyWhatsAppMessage();
    assert.strictEqual(state.dom['authCheckoutCheckbox'].checked, true, 'Checkbox must be auto-checked on Copy Payload');
    assert.strictEqual(state.clipboardWritten, mockWin.buildWhatsAppMessageText(session));

    // Action D: Copy Message (iOS Safari Fallback)
    const { mockWin: winIOS, state: stateIOS } = createSandbox({
        hasNavClipboard: false,
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15'
    });
    await winIOS.copyWhatsAppMessage();
    assert.strictEqual(stateIOS.execCommandCalled, true, 'execCommand called on iOS');
    assert.strictEqual(stateIOS.rangeSelected, true, 'Range selected on iOS');
    assert.strictEqual(stateIOS.selAddRangeCalled, true, 'Selection range added on iOS');
    assert.strictEqual(stateIOS.dom['authCheckoutCheckbox'].checked, true, 'Checkbox auto-checked on iOS fallback');

    // URI Encoding Lossless Check
    const url = mockWin.getWhatsAppCheckoutUrl(session);
    const decoded = decodeURIComponent(url.replace('https://wa.me/18294721257?text=', ''));
    assert.strictEqual(decoded, mockWin.buildWhatsAppMessageText(session), 'URI encoding must be 100% lossless');

    console.log('  ✓ R3 Interactive deep-links, clipboard fallbacks, and checkbox synchronization validated.');

    console.log('\n================================================================');
    console.log('ALL REVIEWER_2 ADVERSARIAL TESTS PASSED WITHOUT DEFECTS! ✓');
    console.log('================================================================\n');
})();
