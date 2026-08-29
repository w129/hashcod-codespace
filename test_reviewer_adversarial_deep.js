/**
 * Deep Adversarial Reviewer Verification Test Suite
 * Tests edge cases, timezones, URI encoding, canvas fallbacks, clipboard fallbacks, and audit metadata.
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('================================================================');
console.log('REVIEWER_1 DEEP ADVERSARIAL & EDGE CASE VERIFICATION TEST SUITE');
console.log('================================================================\n');

const indexPath = path.join(__dirname, 'index.php');
assert(fs.existsSync(indexPath), 'index.php must exist');
const content = fs.readFileSync(indexPath, 'utf8');

// Extract JS engine block
const jsMatch = content.match(/\/\* ===== HIGH-TECH WHATSAPP MESSAGE GENERATOR & PQC VOUCHER ENGINE ===== \*\/([\s\S]*?)document\.getElementById\('authRegisterBtn'\)/);
assert(jsMatch && jsMatch[1], 'Could not extract JS engine from index.php');

// Helper to construct sandbox
function setupSandbox(overrides = {}) {
    const state = {
        clipboardWritten: null,
        execCommandCalled: false,
        openedUrls: [],
        toasts: [],
        messages: [],
        canvasOps: [],
        dom: {}
    };

    function getEl(id) {
        if (!state.dom[id]) {
            state.dom[id] = {
                id,
                textContent: '',
                value: '',
                innerHTML: id === 'authCopyWhatsappBtn' ? '<svg></svg><span>Copiar Payload</span>' : '',
                style: {},
                classList: { add: () => {}, remove: () => {}, toggle: () => {} },
                focus: () => { state.dom[id]._focused = true; },
                closest: () => ({ style: {} })
            };
        }
        return state.dom[id];
    }

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
    if (overrides.hasRoundRect) {
        mockCtx.roundRect = (x, y, w, h, r) => { state.canvasOps.push({ op: 'roundRect', x, y, w, h, r }); };
    }

    const sandboxDoc = {
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
                    state.downloaded = { filename: this.download, href: this.href };
                }
            };
        },
        body: { appendChild: () => {}, removeChild: () => {} },
        execCommand: () => { state.execCommandCalled = true; return true; }
    };

    const sandboxWin = {
        document: sandboxDoc,
        open: (url, target, features) => { state.openedUrls.push({ url, target, features }); },
        showAdminToast: (m) => { state.toasts.push(m); },
        setMsg: (m, ok) => { state.messages.push({ m, ok }); },
        crypto: overrides.hasCrypto !== false ? {
            getRandomValues: (arr) => {
                for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 256);
                return arr;
            }
        } : undefined,
        navigator: overrides.hasNavClipboard !== false ? {
            clipboard: {
                writeText: async (t) => { state.clipboardWritten = t; return true; }
            }
        } : {}
    };
    sandboxWin.window = sandboxWin;

    const run = new Function('window', 'document', 'navigator', 'crypto', 'setMsg', 'Intl', jsMatch[1]);
    run(sandboxWin, sandboxWin.document, sandboxWin.navigator, sandboxWin.crypto, sandboxWin.setMsg, overrides.intlObj);

    return { sandboxWin, state };
}

// 1. Timezone Fallback Deep Tests
console.log('[Test 1] Timezone Fallback Deep Test (Intl undefined, null, erroring, custom)...');
{
    // Intl undefined
    const { sandboxWin: win1 } = setupSandbox({ intlObj: undefined });
    const s1 = win1.getCheckoutVoucherSession(true);
    assert.strictEqual(s1.timezone, 'America/Santo_Domingo', 'Timezone should fall back to America/Santo_Domingo when Intl is undefined');

    // Intl erroring
    const faultyIntl = {
        DateTimeFormat: () => { throw new Error('ICU disabled'); }
    };
    const { sandboxWin: win2 } = setupSandbox({ intlObj: faultyIntl });
    const s2 = win2.getCheckoutVoucherSession(true);
    assert.strictEqual(s2.timezone, 'America/Santo_Domingo', 'Timezone should fall back to America/Santo_Domingo when Intl throws');

    // Intl with resolved timezone
    const customIntl = {
        DateTimeFormat: () => ({ resolvedOptions: () => ({ timeZone: 'America/New_York' }) })
    };
    const { sandboxWin: win3 } = setupSandbox({ intlObj: customIntl });
    const s3 = win3.getCheckoutVoucherSession(true);
    assert.strictEqual(s3.timezone, 'America/New_York', 'Timezone should resolve to America/New_York when provided by Intl');
    console.log('  ✓ Timezone fallback logic passed all variations.');
}

// 2. Canvas Rendering with and without roundRect API
console.log('\n[Test 2] Canvas Rendering Fallback & Path Isolation Test...');
{
    // With roundRect
    const { sandboxWin: winWithRound, state: stateWithRound } = setupSandbox({ hasRoundRect: true });
    winWithRound.triggerCheckoutCapture();
    assert(stateWithRound.downloaded, 'PNG download triggered with roundRect');
    assert(stateWithRound.canvasOps.some(o => o.op === 'roundRect'), 'roundRect called when supported');

    // Without roundRect (older browsers / Android webviews)
    const { sandboxWin: winWithoutRound, state: stateWithoutRound } = setupSandbox({ hasRoundRect: false });
    winWithoutRound.triggerCheckoutCapture();
    assert(stateWithoutRound.downloaded, 'PNG download triggered without roundRect');
    assert(stateWithoutRound.canvasOps.some(o => o.op === 'rect'), 'rect subpath called as fallback to ensure stroke/fill work');
    console.log('  ✓ Canvas rendering works identically in both modern and legacy Canvas2D engines.');
}

// 3. Clipboard Engine iOS Safari Selection Range Verification
console.log('\n[Test 3] Clipboard Engine iOS Safari Fallback Test...');
(async () => {
    const { sandboxWin, state } = setupSandbox({ hasNavClipboard: false });
    await sandboxWin.copyWhatsAppMessage();
    assert.strictEqual(state.execCommandCalled, true, 'execCommand called');
    assert.strictEqual(state.selected, true, 'select called on textarea');
    assert(state.selectionRange && state.selectionRange[0] === 0 && state.selectionRange[1] > 0, 'setSelectionRange called for iOS Safari');
    console.log('  ✓ Clipboard fallback correctly activates iOS Safari text range selection.');

    // 4. Verification of Dominican Republic Legal Registry & Tab Declarations
    console.log('\n[Test 4] Legal Audit Metadata & Dominican Republic Registry Validation...');
    const session = sandboxWin.getCheckoutVoucherSession(true);
    const msg = sandboxWin.buildWhatsAppMessageText(session);

    assert(msg.includes('DIKTATCART'), 'Issuer DIKTATCART must be present');
    assert(msg.includes('40209369293'), 'DGII RNC 40209369293 must be present');
    assert(msg.includes('336973'), 'ONAPI 336973 must be present');
    assert(msg.includes('3323LV-PF'), 'Mercantile Registry 3323LV-PF must be present');
    assert(msg.includes('US$ 60.27'), 'Price US$ 60.27 must be present');
    assert(msg.includes('~US$ 90.00~'), 'Strike price ~US$ 90.00~ must be present');

    // Check all 7 tabs
    for (let t = 1; t <= 7; t++) {
        assert(msg.includes(`Tab ${t}`), `Tab ${t} declaration missing from WhatsApp message`);
    }

    const payload = JSON.parse(msg.match(/```\n([\s\S]*?)\n```/g)[1].replace(/```/g, '').trim());
    assert.strictEqual(payload.audit_tabs_acceptance.tab_1_alcance_cero_telemetria, true);
    assert.strictEqual(payload.audit_tabs_acceptance.tab_2_openclaw_agentes_autonomos, true);
    assert.strictEqual(payload.audit_tabs_acceptance.tab_3_criptografia_pqc_strix_scanner, true);
    assert.strictEqual(payload.audit_tabs_acceptance.tab_4_soda_storage_documentos_locales, true);
    assert.strictEqual(payload.audit_tabs_acceptance.tab_5_licenciamiento_foss_bash_mit, true);
    assert.strictEqual(payload.audit_tabs_acceptance.tab_6_evidencias_software_gus_mav, true);
    assert.strictEqual(payload.audit_tabs_acceptance.tab_7_validacion_legal_dominicana.onapi_marca_336973, true);
    assert.strictEqual(payload.audit_tabs_acceptance.tab_7_validacion_legal_dominicana.dgii_rnc_40209369293, true);
    assert.strictEqual(payload.audit_tabs_acceptance.tab_7_validacion_legal_dominicana.camara_comercio_rm_3323lv_pf, true);
    assert.strictEqual(payload.settlement_status, 'PENDIENTE_COORDINACION_NO_PREPAGADO');
    console.log('  ✓ All 7 tabs and Dominican Republic credentials rigorously validated.');

    // 5. Deep Link Roundtrip Encoding Integrity
    console.log('\n[Test 5] URI Encoding Roundtrip Integrity Test...');
    const url = sandboxWin.getWhatsAppCheckoutUrl(session);
    assert(url.startsWith('https://wa.me/18294721257?text='), 'Target URL prefix valid');
    const query = url.replace('https://wa.me/18294721257?text=', '');
    assert(!/[\s\n\r]/.test(query), 'URI query string must have zero raw whitespace');
    const roundtrip = decodeURIComponent(query);
    assert.strictEqual(roundtrip, msg, 'URI roundtrip must exactly match generated message');
    console.log('  ✓ WhatsApp URL encoding is 100% loss-free and characters preserved.');

    console.log('\n================================================================');
    console.log('ALL REVIEWER_1 DEEP ADVERSARIAL TESTS COMPLETED SUCCESSFULLY! ✓');
    console.log('================================================================\n');
})();
