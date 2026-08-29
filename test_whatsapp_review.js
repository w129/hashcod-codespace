/**
 * Comprehensive Verification Test for WhatsApp PQC Message Generator & Checkout Voucher
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const indexPath = path.join(__dirname, 'index.php');
const content = fs.readFileSync(indexPath, 'utf-8');

console.log('1. Checking CSS Definitions in index.php...');
assert(content.includes('.auth-checkout-box'), 'Missing .auth-checkout-box CSS');
assert(content.includes('.auth-voucher-terminal-bar'), 'Missing .auth-voucher-terminal-bar CSS');
assert(content.includes('.auth-btn-whatsapp'), 'Missing .auth-btn-whatsapp CSS');
assert(content.includes('.auth-btn-capture'), 'Missing .auth-btn-capture CSS');
assert(content.includes('.auth-btn-copy-msg'), 'Missing .auth-btn-copy-msg CSS');
console.log('   ✓ CSS styles defined.');

console.log('2. Checking HTML DOM Elements in index.php...');
assert(content.includes('id="authCheckoutBox"'), 'Missing id="authCheckoutBox"');
assert(content.includes('id="authVoucherIdDisplay"'), 'Missing id="authVoucherIdDisplay"');
assert(content.includes('id="authWhatsappBtn"'), 'Missing id="authWhatsappBtn"');
assert(content.includes('id="authCaptureCheckoutBtn"'), 'Missing id="authCaptureCheckoutBtn"');
assert(content.includes('id="authCopyWhatsappBtn"'), 'Missing id="authCopyWhatsappBtn"');
assert(content.includes('id="authCheckoutCheckbox"'), 'Missing id="authCheckoutCheckbox"');
console.log('   ✓ HTML DOM elements present.');

console.log('3. Extracting JavaScript functions and verifying logic...');
// Mock environment
global.window = global;
global.document = {
    getElementById: (id) => ({
        id,
        textContent: '',
        value: '',
        innerHTML: '',
        style: {},
        classList: { toggle: () => {}, add: () => {}, remove: () => {} },
        closest: () => ({ style: {} })
    }),
    createElement: (tag) => ({
        tag,
        style: {},
        setAttribute: () => {},
        appendChild: () => {},
        removeChild: () => {},
        select: () => {},
        focus: () => {},
        getContext: () => ({
            createLinearGradient: () => ({ addColorStop: () => {} }),
            fillRect: () => {},
            strokeRect: () => {},
            fillText: () => {},
            beginPath: () => {},
            moveTo: () => {},
            lineTo: () => {},
            stroke: () => {},
            fill: () => {},
            roundRect: () => {}
        }),
        toDataURL: () => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    }),
    body: {
        appendChild: () => {},
        removeChild: () => {}
    },
    execCommand: (cmd) => true
};
global.navigator = {
    clipboard: {
        writeText: async (t) => true
    }
};
global.crypto = {
    getRandomValues: (arr) => {
        for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 256);
        return arr;
    }
};

// Evaluate the JS functions from index.php
const fnMatch = content.match(/\/\* ===== HIGH-TECH WHATSAPP MESSAGE GENERATOR & PQC VOUCHER ENGINE ===== \*\/([\s\S]*?)\/\* ===== CHECKOUT SCREENSHOT & VOUCHER GENERATOR ===== \*\//);
assert(fnMatch, 'Could not extract WhatsApp generator JS section');
eval(fnMatch[1]);

assert(typeof window.getCheckoutVoucherSession === 'function', 'getCheckoutVoucherSession not defined');
assert(typeof window.buildWhatsAppMessageText === 'function', 'buildWhatsAppMessageText not defined');
assert(typeof window.getWhatsAppCheckoutUrl === 'function', 'getWhatsAppCheckoutUrl not defined');
assert(typeof window.openWhatsAppCheckout === 'function', 'openWhatsAppCheckout not defined');
assert(typeof window.copyWhatsAppMessage === 'function', 'copyWhatsAppMessage not defined');
assert(typeof window.updateCheckoutVoucherUI === 'function', 'updateCheckoutVoucherUI not defined');

const session = window.getCheckoutVoucherSession(true);
console.log('   Generated Voucher Session ID:', session.voucherId);
assert(session.voucherId.startsWith('HASHCOD-L8-'), 'Voucher ID should start with HASHCOD-L8-');
assert(session.priceUsd === '60.27', 'Price USD must be 60.27');
assert(session.issuer === 'DIKTATCART', 'Issuer must be DIKTATCART');
assert(session.rnc === '40209369293', 'RNC must be 40209369293');
assert(session.onapi === '#336973', 'ONAPI must be #336973');
assert(session.registroMercantil === '#3323LV-PF', 'RM must be #3323LV-PF');

const msg = window.buildWhatsAppMessageText(session);
console.log('\n--- Generated WhatsApp Message Preview ---');
console.log(msg);
console.log('------------------------------------------\n');

console.log('4. Verifying Markdown & Message Content...');
assert(msg.includes('*HASHCOD CODESPACE® — COMPROBANTE DE CHECKOUT*'), 'Missing bold title');
assert(msg.includes('_Certificación Determinista de IA & Alojamiento Post-Cuántico (PQC)_'), 'Missing italic subtitle');
assert(msg.includes('╔══════════════════════════════════╗'), 'Missing ASCII top header');
assert(msg.includes('║  HASHCOD CODESPACE® · CHECKOUT   ║'), 'Missing ASCII title line');
assert(msg.includes('║   POST-QUANTUM VOUCHER & GATE    ║'), 'Missing ASCII subtitle line');
assert(msg.includes('╚══════════════════════════════════╝'), 'Missing ASCII bottom header');
assert(msg.includes('*┌── [ 💳 DETALLES DE LA TRANSACCIÓN ]*'), 'Missing details header');
assert(msg.includes('*│* *Identificador:* `' + session.voucherId + '`'), 'Missing voucher ID in details');
assert(msg.includes('US$ 60.27'), 'Missing US$ 60.27');
assert(msg.includes('~US$ 90.00~'), 'Missing strike price');
assert(msg.includes('DIKTATCART'), 'Missing DIKTATCART');
assert(msg.includes('40209369293'), 'Missing RNC');
assert(msg.includes('#336973'), 'Missing ONAPI #336973');
assert(msg.includes('#3323LV-PF'), 'Missing RM #3323LV-PF');
assert(msg.includes('> 💬 *Mensaje del Cliente:*'), 'Missing customer quote');

// Verify clean JSON extraction
const jsonMatch = msg.match(/```\n([\s\S]*?)\n```/g);
assert(jsonMatch && jsonMatch.length >= 2, 'Should have at least 2 code blocks (ASCII header and JSON payload)');
const rawJson = jsonMatch[1].replace(/```/g, '').trim();
const parsedJson = JSON.parse(rawJson);
assert.strictEqual(parsedJson.protocol, 'HASHCOD-L8-PQC-V1');
assert.strictEqual(parsedJson.voucher_id, session.voucherId);
assert.strictEqual(parsedJson.price_usd, 60.27);
assert.strictEqual(parsedJson.currency, 'USD');
assert.strictEqual(parsedJson.issuer, 'DIKTATCART');
assert.strictEqual(parsedJson.rnc, '40209369293');
assert.strictEqual(parsedJson.onapi, '336973');
assert.strictEqual(parsedJson.registro_mercantil, '3323LV-PF');
console.log('   ✓ JSON payload parsed and validated successfully.');

console.log('5. Verifying URL Generation and URL-Encoding...');
const url = window.getWhatsAppCheckoutUrl(session);
console.log('   URL:', url.substring(0, 80) + '...');
assert(url.startsWith('https://wa.me/18294721257?text='), 'URL must start with https://wa.me/18294721257?text=');
const decodedText = decodeURIComponent(url.replace('https://wa.me/18294721257?text=', ''));
assert.strictEqual(decodedText, msg, 'Decoded URL text must exactly match generated message');
console.log('   ✓ Full encodeURIComponent & decodeURIComponent roundtrip integrity validated.');

console.log('6. Verifying Clipboard copy fallback...');
let copyRan = false;
window.copyWhatsAppMessage().then(() => {
    console.log('   ✓ Clipboard copy execution completed.');
    console.log('\nALL VERIFICATIONS PASSED SUCCESSFULLY! ✓\n');
});
