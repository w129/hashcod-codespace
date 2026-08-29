/**
 * Exhaustive Adversarial Test Suite for WhatsApp PQC Message Generator & Checkout Engine
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const indexPath = path.join(__dirname, 'index.php');
const content = fs.readFileSync(indexPath, 'utf-8');

console.log('=== TEST 1: CSS Styles & Dark Vector Aesthetic ===');
assert(content.includes('.auth-checkout-box'), 'Missing .auth-checkout-box');
assert(content.includes('.auth-voucher-terminal-bar'), 'Missing .auth-voucher-terminal-bar');
assert(content.includes('.auth-btn-whatsapp'), 'Missing .auth-btn-whatsapp');
assert(content.includes('.auth-btn-capture'), 'Missing .auth-btn-capture');
assert(content.includes('.auth-btn-copy-msg'), 'Missing .auth-btn-copy-msg');
assert(content.includes('.auth-voucher-id-pill'), 'Missing .auth-voucher-id-pill');
console.log('✓ All CSS classes defined.');

console.log('\n=== TEST 2: HTML Structure & Link Attributes ===');
assert(content.includes('id="authCheckoutBox"'), 'Missing id="authCheckoutBox"');
assert(content.includes('id="authVoucherIdDisplay"'), 'Missing id="authVoucherIdDisplay"');
assert(content.includes('id="authWhatsappBtn"'), 'Missing id="authWhatsappBtn"');
assert(content.includes('id="authCaptureCheckoutBtn"'), 'Missing id="authCaptureCheckoutBtn"');
assert(content.includes('id="authCopyWhatsappBtn"'), 'Missing id="authCopyWhatsappBtn"');
assert(content.includes('id="authCheckoutCheckbox"'), 'Missing id="authCheckoutCheckbox"');
assert(content.includes('id="authInlineWhatsappLink"'), 'Missing id="authInlineWhatsappLink"');

// Ensure inline WhatsApp link opens in new tab so user does not lose session
const inlineLinkMatch = content.match(/<a[^>]*id="authInlineWhatsappLink"[^>]*>/);
assert(inlineLinkMatch, 'Could not find authInlineWhatsappLink tag');
assert(inlineLinkMatch[0].includes('target="_blank"'), 'authInlineWhatsappLink must have target="_blank"');
assert(inlineLinkMatch[0].includes('rel="noopener noreferrer"'), 'authInlineWhatsappLink must have rel="noopener noreferrer"');
console.log('✓ HTML DOM elements and security attributes verified.');

console.log('\n=== TEST 3: JavaScript Engine & Crypto Fallback ===');
const fnMatch = content.match(/\/\* ===== HIGH-TECH WHATSAPP MESSAGE GENERATOR & PQC VOUCHER ENGINE ===== \*\/([\s\S]*?)document\.getElementById\('authRegisterBtn'\)/);
assert(fnMatch, 'Could not extract WhatsApp & Checkout JS code block');

function createMockEnv(hasCrypto) {
    const state = {
        clipboardText: null,
        execCommandCalled: false,
        openedUrls: [],
        canvasCalls: [],
        toasts: [],
        messages: [],
        domElements: {}
    };

    function getOrCreateEl(id) {
        if (!state.domElements[id]) {
            state.domElements[id] = {
                id,
                textContent: '',
                value: '',
                innerHTML: id === 'authCopyWhatsappBtn' ? '<svg>icon</svg><span>Copiar Payload</span>' : '',
                style: {},
                classList: {
                    toggle: () => {},
                    add: () => {},
                    remove: () => {}
                },
                closest: () => ({ style: {} }),
                focus: () => { state.domElements[id]._focused = true; }
            };
        }
        return state.domElements[id];
    }

    const mockDoc = {
        getElementById: (id) => getOrCreateEl(id),
        createElement: (tag) => {
            if (tag === 'canvas') {
                return {
                    width: 0,
                    height: 0,
                    getContext: (type) => ({
                        createLinearGradient: () => ({ addColorStop: () => {} }),
                        fillRect: (x, y, w, h) => { state.canvasCalls.push({ op: 'fillRect', x, y, w, h }); },
                        strokeRect: () => {},
                        fillText: (txt, x, y) => { state.canvasCalls.push({ op: 'fillText', txt, x, y }); },
                        beginPath: () => { state.canvasCalls.push({ op: 'beginPath' }); },
                        moveTo: (x, y) => { state.canvasCalls.push({ op: 'moveTo', x, y }); },
                        lineTo: (x, y) => { state.canvasCalls.push({ op: 'lineTo', x, y }); },
                        stroke: () => { state.canvasCalls.push({ op: 'stroke' }); },
                        fill: () => { state.canvasCalls.push({ op: 'fill' }); },
                        roundRect: (x, y, w, h, r) => { state.canvasCalls.push({ op: 'roundRect', x, y, w, h, r }); }
                    }),
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
                select: () => {},
                focus: () => {},
                click: () => { state.canvasDownloaded = true; }
            };
        },
        body: {
            appendChild: () => {},
            removeChild: () => {}
        },
        execCommand: (cmd) => {
            state.execCommandCalled = true;
            return true;
        },
        querySelectorAll: () => [],
        addEventListener: () => {}
    };

    const mockWin = {
        document: mockDoc,
        open: (url, target, features) => {
            state.openedUrls.push({ url, target, features });
        },
        showAdminToast: (msg) => {
            state.toasts.push(msg);
        },
        crypto: hasCrypto ? {
            getRandomValues: (arr) => {
                for (let i = 0; i < arr.length; i++) arr[i] = (i + 1) * 37 % 256;
                return arr;
            }
        } : undefined,
        navigator: {
            clipboard: {
                writeText: async (t) => {
                    state.clipboardText = t;
                    return true;
                }
            }
        }
    };

    mockWin.window = mockWin;
    mockWin.setMsg = (msg, ok) => {
        state.messages.push({ msg, ok });
    };

    return { mockWin, mockDoc, state };
}

// Test with crypto available
{
    const { mockWin, state } = createMockEnv(true);
    const sandbox = new Function('window', 'document', 'navigator', 'crypto', 'setMsg', fnMatch[1]);
    sandbox(mockWin, mockWin.document, mockWin.navigator, mockWin.crypto, mockWin.setMsg);

    const session1 = mockWin.getCheckoutVoucherSession();
    assert(session1.voucherId.startsWith('HASHCOD-L8-'), 'Invalid voucher ID');
    assert.strictEqual(session1.priceUsd, '60.27');
    assert.strictEqual(session1.issuer, 'DIKTATCART');
    assert.strictEqual(session1.rnc, '40209369293');
    assert.strictEqual(session1.onapi, '#336973');
    assert.strictEqual(session1.registroMercantil, '#3323LV-PF');

    // Persistence test
    const session2 = mockWin.getCheckoutVoucherSession();
    assert.strictEqual(session1.voucherId, session2.voucherId, 'Session should persist without forceNew');

    // Force new test
    const session3 = mockWin.getCheckoutVoucherSession(true);
    assert(session3.voucherId.startsWith('HASHCOD-L8-'), 'Force new session voucher ID valid');
    console.log('✓ Session generation and persistence verified.');
}

// Test crypto fallback when window.crypto is undefined
{
    const { mockWin, state } = createMockEnv(false);
    const sandbox = new Function('window', 'document', 'navigator', 'crypto', 'setMsg', fnMatch[1]);
    sandbox(mockWin, mockWin.document, mockWin.navigator, undefined, mockWin.setMsg);

    const sessionFallback = mockWin.getCheckoutVoucherSession(true);
    assert(sessionFallback.voucherId.startsWith('HASHCOD-L8-'), 'Fallback voucher ID generated successfully');
    assert(sessionFallback.voucherId.length >= 13, 'Fallback voucher ID length valid');
    console.log('✓ Crypto fallback with Math.random() verified.');
}

console.log('\n=== TEST 4: Message Template, Markdown & ASCII Headers ===');
{
    const { mockWin } = createMockEnv(true);
    const sandbox = new Function('window', 'document', 'navigator', 'crypto', 'setMsg', fnMatch[1]);
    sandbox(mockWin, mockWin.document, mockWin.navigator, mockWin.crypto, mockWin.setMsg);

    const session = mockWin.getCheckoutVoucherSession();
    const msg = mockWin.buildWhatsAppMessageText(session);

    // Markdown elements
    assert(msg.includes('*HASHCOD CODESPACE® — COMPROBANTE DE CHECKOUT*'), 'Missing *bold* header');
    assert(msg.includes('_Certificación Determinista de IA & Alojamiento Post-Cuántico (PQC)_'), 'Missing _italic_ subtitle');
    assert(msg.includes('~US$ 90.00~'), 'Missing ~strikethrough~ original price');
    assert(msg.includes('> 🛡️'), 'Missing > blockquote');
    assert(msg.includes('> 💬'), 'Missing > blockquote on client message');

    // ASCII Vector Box Lines
    const asciiBoxMatch = msg.match(/```\n(╔[\s\S]*?╝)\n```/);
    assert(asciiBoxMatch, 'Missing ASCII vector box inside code fence');
    const boxLines = asciiBoxMatch[1].split('\n');
    assert.strictEqual(boxLines.length, 4, 'ASCII box must have 4 lines');
    boxLines.forEach((line, idx) => {
        assert.strictEqual(line.length, 36, 'ASCII box line ' + (idx + 1) + ' must be exactly 36 chars wide (found ' + line.length + ')');
    });

    // Details box drawing
    assert(msg.includes('*┌── [ 💳 DETALLES DE LA TRANSACCIÓN ]*'), 'Missing details ┌── header');
    assert(msg.includes('*│* *Identificador:* `' + session.voucherId + '`'), 'Missing details │ voucher ID');
    assert(msg.includes('*│* *Emisión (ISO):* `' + session.timestamp + '`'), 'Missing details │ timestamp');
    assert(msg.includes('*│* *Monto Mensual:* *US$ 60.27 / mes*'), 'Missing details │ price');
    assert(msg.includes('*└──*'), 'Missing details └── footer');

    // Official credentials
    assert(msg.includes('DIKTATCART'), 'Missing DIKTATCART');
    assert(msg.includes('40209369293'), 'Missing RNC 40209369293');
    assert(msg.includes('#336973'), 'Missing ONAPI #336973');
    assert(msg.includes('#3323LV-PF'), 'Missing RM #3323LV-PF');

    // JSON Payload
    const jsonMatches = msg.match(/```\n([\s\S]*?)\n```/g);
    assert(jsonMatches && jsonMatches.length >= 2, 'Must contain at least 2 code blocks');
    const jsonBlock = jsonMatches[1].replace(/```/g, '').trim();
    const parsed = JSON.parse(jsonBlock);
    assert.strictEqual(parsed.protocol, 'HASHCOD-L8-PQC-V1');
    assert.strictEqual(parsed.voucher_id, session.voucherId);
    assert.strictEqual(parsed.price_usd, 60.27);
    assert.strictEqual(parsed.currency, 'USD');
    assert.strictEqual(parsed.issuer, 'DIKTATCART');
    assert.strictEqual(parsed.rnc, '40209369293');
    assert.strictEqual(parsed.onapi, '336973');
    assert.strictEqual(parsed.registro_mercantil, '3323LV-PF');
    console.log('✓ Markdown styling, 36-col ASCII box, and JSON payload validated.');
}

console.log('\n=== TEST 5: URL Encoding & Deep-Linking Engine ===');
{
    const { mockWin, state } = createMockEnv(true);
    const sandbox = new Function('window', 'document', 'navigator', 'crypto', 'setMsg', fnMatch[1]);
    sandbox(mockWin, mockWin.document, mockWin.navigator, mockWin.crypto, mockWin.setMsg);

    const session = mockWin.getCheckoutVoucherSession();
    const msg = mockWin.buildWhatsAppMessageText(session);
    const url = mockWin.getWhatsAppCheckoutUrl(session);

    assert(url.startsWith('https://wa.me/18294721257?text='), 'Invalid URL prefix');
    const decoded = decodeURIComponent(url.replace('https://wa.me/18294721257?text=', ''));
    assert.strictEqual(decoded, msg, 'Decoded message must match generated message character for character');

    // Test anchor click navigation
    const anchorMock = { tagName: 'A', href: '', target: '', rel: '' };
    const eventMock = { currentTarget: anchorMock, preventDefault: () => {} };
    const result = mockWin.openWhatsAppCheckout(eventMock);
    assert.strictEqual(result, true, 'Anchor click must return true for native deep linking');
    assert.strictEqual(anchorMock.href, url, 'Anchor href must be set to WhatsApp URL');
    assert.strictEqual(anchorMock.target, '_blank', 'Anchor target must be _blank');
    assert.strictEqual(anchorMock.rel, 'noopener noreferrer', 'Anchor rel must be secure');

    // Test non-anchor click (fallback to window.open)
    mockWin.openWhatsAppCheckout({ preventDefault: () => {} });
    assert.strictEqual(state.openedUrls.length, 1, 'window.open should be called');
    assert.strictEqual(state.openedUrls[0].url, url);
    assert.strictEqual(state.openedUrls[0].target, '_blank');
    console.log('✓ URL encoding roundtrip and deep-link handlers validated.');
}

console.log('\n=== TEST 6: Clipboard Copy Engine & Rapid Double-Click Idempotency ===');
(async () => {
    const { mockWin, state } = createMockEnv(true);
    const sandbox = new Function('window', 'document', 'navigator', 'crypto', 'setMsg', fnMatch[1]);
    sandbox(mockWin, mockWin.document, mockWin.navigator, mockWin.crypto, mockWin.setMsg);

    const copyBtn = mockWin.document.getElementById('authCopyWhatsappBtn');
    const initialHtml = copyBtn.innerHTML;

    // First copy
    await mockWin.copyWhatsAppMessage();
    assert.strictEqual(state.clipboardText, mockWin.buildWhatsAppMessageText());
    assert(copyBtn.innerHTML.includes('¡Payload Copiado! ✓'), 'Button text should update to feedback state');
    assert.strictEqual(copyBtn._origHtml, initialHtml, 'Original HTML must be cached in _origHtml');

    // Immediate second copy (rapid double click before timer fires)
    await mockWin.copyWhatsAppMessage();
    assert.strictEqual(copyBtn._origHtml, initialHtml, 'Original HTML must NOT be overwritten by feedback state');

    // Verify clipboard fallback with document.execCommand when navigator.clipboard is unavailable
    mockWin.navigator.clipboard = undefined;
    state.execCommandCalled = false;
    await mockWin.copyWhatsAppMessage();
    assert.strictEqual(state.execCommandCalled, true, 'execCommand fallback must be triggered');
    console.log('✓ Clipboard engine, execCommand fallback, and double-click resilience validated.');

    console.log('\n=== TEST 7: Canvas Voucher Capture & Path Isolation ===');
    state.canvasCalls = [];
    mockWin.triggerCheckoutCapture();
    assert.strictEqual(state.canvasDownloaded, true, 'Canvas image download must be triggered');

    // Verify beginPath is called before every shape
    const beginPathIndices = [];
    state.canvasCalls.forEach((call, idx) => {
        if (call.op === 'beginPath') beginPathIndices.push(idx);
    });
    assert(beginPathIndices.length >= 6, 'Must call beginPath before grid, divider, and all 4 card panels');

    // Verify synchronized voucher checkbox auto-check
    const chk = mockWin.document.getElementById('authCheckoutCheckbox');
    assert.strictEqual(chk.checked, true, 'authCheckoutCheckbox should be auto-checked on voucher capture');
    console.log('✓ Canvas PNG generation, path isolation (beginPath), and checkbox synchronization validated.');

    console.log('\n========================================');
    console.log('ALL ADVERSARIAL VERIFICATION TESTS PASSED!');
    console.log('========================================\n');
})();
