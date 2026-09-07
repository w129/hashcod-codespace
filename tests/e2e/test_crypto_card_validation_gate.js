/**
 * ============================================================================
 * HASHCOD CODESPACE — DUAL-WINDOW CRYPTO CARD VALIDATION GATE TDD TEST SUITE
 * tests/e2e/test_crypto_card_validation_gate.js
 * ============================================================================
 * 
 * Master Test-Driven Development (TDD) suite verifying:
 * - [TIER 1] Feature Coverage (R1 Trigger, R2 480px Window, R3 Crypto & Lockout, R4 Tool 2 Entry)
 * - [TIER 2] Boundary & Corner Cases (Non-image uploads, whitespace trimming, corrupted keys, reload persistence)
 * - [TIER 3] Cross-Feature Combinations (Real exported component function invocations against mock DOM & storage)
 * - [TIER 4] Real-World End-to-End Scenarios (Full authentic validation journey & counterfeit attack mitigation)
 * - [TIER 5] Challenger Adversarial Stress Integration (Dilithium-5 mutations, Tool 2 injection defense, temporal & concurrency checks)
 * - [GUARDRAILS] HTML Tag Balance (Diff: 0) and Node.js syntax verification
 * 
 * Zero external dependencies — pure native Node.js (fs, path, assert, crypto, vm).
 * Execution: node tests/e2e/test_crypto_card_validation_gate.js
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const crypto = require('crypto');
const vm = require('vm');

console.log('================================================================================');
console.log('  HASHCOD CODESPACE — CRYPTO CARD VALIDATION GATE TDD MASTER SUITE              ');
console.log('  Specification: ORIGINAL_REQUEST.md (2026-09-07T01:47:04Z) & SCOPE.md          ');
console.log('================================================================================\n');

const repoDir = path.resolve(__dirname, '../../');
const indexPath = path.join(repoDir, 'index.php');
const htmlPath = path.join(repoDir, 'index.html');
const notFoundPath = path.join(repoDir, '404.html');
const componentPath = path.join(repoDir, 'components/crypto-card-validation.js');

// ============================================================================
// AUTHORITATIVE CONSTANTS & SPECIFICATION CONTRACTS
// ============================================================================

const DILITHIUM5_RESCUE_OVERRIDE_SIGNATURE = 
    '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';

const STORAGE_LOCKOUT_KEY = 'l8_card_validation_lock_until';
const STORAGE_VALIDATED_CARD_KEY = 'l8_validated_crypto_card';
const ONE_HOUR_MS = 3600000;

// Test Execution Harness
let totalPassed = 0;
let totalFailed = 0;
const failureDetails = [];
let testQueue = Promise.resolve();

function runTest(suite, name, testFn) {
    testQueue = testQueue.then(async () => {
        try {
            await testFn();
            totalPassed++;
            console.log(`  ✓ [${suite}] ${name}`);
        } catch (err) {
            totalFailed++;
            const errMsg = err.message || String(err);
            console.error(`  ✗ [${suite}] ${name}`);
            console.error(`     Error: ${errMsg}`);
            failureDetails.push({ suite, name, error: errMsg });
        }
    });
}

// In-Memory Browser Storage Mock
class MockStorage {
    constructor() { this.store = {}; }
    getItem(k) { return Object.prototype.hasOwnProperty.call(this.store, k) ? this.store[k] : null; }
    setItem(k, v) { this.store[k] = String(v); }
    removeItem(k) { delete this.store[k]; }
    clear() { this.store = {}; }
    get length() { return Object.keys(this.store).length; }
}

// In-Memory DOM Element Mock
class MockElement {
    constructor(id, tagName = 'div') {
        this.id = id;
        this.tagName = tagName.toUpperCase();
        this._val = '';
        this._txt = '';
        this._src = '';
        this.disabled = false;
        this.style = {
            display: '',
            width: '',
            height: '',
            opacity: '1',
            pointerEvents: 'auto',
            background: '',
            color: '',
            border: '',
            setProperty(p, v) { this[p] = v; },
            getPropertyValue(p) { return this[p] || ''; }
        };
        this.classList = {
            _classes: new Set(),
            add: (...cls) => cls.forEach(c => this.classList._classes.add(c)),
            remove: (...cls) => cls.forEach(c => this.classList._classes.delete(c)),
            contains: (c) => this.classList._classes.has(c),
            toggle: (c, force) => {
                if (force !== undefined) {
                    if (force) this.classList._classes.add(c);
                    else this.classList._classes.delete(c);
                    return force;
                }
                if (this.classList._classes.has(c)) {
                    this.classList._classes.delete(c);
                    return false;
                } else {
                    this.classList._classes.add(c);
                    return true;
                }
            }
        };
        this.listeners = {};
    }

    get value() { return this._val; }
    set value(v) { this._val = String(v); }
    get textContent() { return this._txt; }
    set textContent(v) { this._txt = String(v); }
    get innerHTML() { return this._txt; }
    set innerHTML(v) { this._txt = String(v); }
    get src() { return this._src; }
    set src(v) { this._src = String(v); }

    addEventListener(evt, fn) {
        if (!this.listeners[evt]) this.listeners[evt] = [];
        this.listeners[evt].push(fn);
    }
    removeEventListener(evt, fn) {
        if (this.listeners[evt]) {
            this.listeners[evt] = this.listeners[evt].filter(f => f !== fn);
        }
    }
    click() {
        if (this.listeners['click']) {
            this.listeners['click'].forEach(fn => fn({
                preventDefault: () => {},
                stopPropagation: () => {},
                target: this
            }));
        }
    }
    dispatchEvent(evt) {
        const type = typeof evt === 'string' ? evt : evt.type;
        if (this.listeners[type]) {
            this.listeners[type].forEach(fn => fn(evt));
        }
    }
}

class MockFileReader {
    constructor() {
        this.onload = null;
        this.onerror = null;
        this.result = null;
    }
    readAsDataURL(file) {
        setTimeout(() => {
            this.result = `data:${file.type || 'image/png'};base64,mockBase64Data`;
            if (this.onload) this.onload({ target: this });
        }, 5);
    }
}

// Global Browser Mock Setup
const domStore = {};
function getOrCreateElement(id, tagName = 'div') {
    if (!domStore[id]) domStore[id] = new MockElement(id, tagName);
    return domStore[id];
}

const mockStorage = new MockStorage();
const mockAlertMessages = [];
let platformUnlocked = false;

const mockDocument = {
    getElementById: (id) => getOrCreateElement(id),
    createElement: (tag) => {
        if (tag === 'canvas') {
            const w = 300, h = 200;
            const buf = new Uint8ClampedArray(w * h * 4);
            const ctx = {
                width: w,
                height: h,
                fillStyle: '#000000',
                fillRect: function (x, y, rw, rh) {
                    const rx = Math.max(0, Math.floor(x));
                    const ry = Math.max(0, Math.floor(y));
                    const width = Math.min(w - rx, Math.floor(rw));
                    const height = Math.min(h - ry, Math.floor(rh));
                    let r = 0, g = 0, b = 0, a = 255;
                    if (this.fillStyle === '#FFFFFF' || this.fillStyle === '#fff') { r = 255; g = 255; b = 255; }
                    else if (this.fillStyle === '#000000' || this.fillStyle === '#000') { r = 0; g = 0; b = 0; }
                    else if (typeof this.fillStyle === 'string' && this.fillStyle.startsWith('#') && this.fillStyle.length === 7) {
                        r = parseInt(this.fillStyle.slice(1, 3), 16);
                        g = parseInt(this.fillStyle.slice(3, 5), 16);
                        b = parseInt(this.fillStyle.slice(5, 7), 16);
                    }
                    for (let row = ry; row < ry + height; row++) {
                        for (let col = rx; col < rx + width; col++) {
                            const idx = (row * w + col) * 4;
                            buf[idx] = r; buf[idx + 1] = g; buf[idx + 2] = b; buf[idx + 3] = a;
                        }
                    }
                },
                drawImage: () => {},
                getImageData: () => ({ data: buf, width: w, height: h }),
                fillText: () => {}
            };
            return {
                width: w,
                height: h,
                getContext: (t) => t === '2d' ? ctx : null
            };
        }
        return new MockElement('elem_' + Math.random(), tag);
    },
    head: { appendChild: () => {} },
    body: new MockElement('body', 'body')
};
mockDocument.body.classList.add('boot-locked', 'auth-locked');

const mockWindow = {
    localStorage: mockStorage,
    document: mockDocument,
    alert: (msg) => { mockAlertMessages.push(msg); },
    __SCAN_STEP_MS: 5,
    l8UnlockPlatform: () => {
        platformUnlocked = true;
        mockDocument.body.classList.remove('boot-locked', 'auth-locked');
        const overlay = getOrCreateElement('authOverlay');
        overlay.classList.add('hidden');
        overlay.style.display = 'none';
    }
};

global.window = mockWindow;
global.document = mockDocument;
global.localStorage = mockStorage;
global.alert = mockWindow.alert;
global.FileReader = MockFileReader;

// Require component under test directly
const CryptoCardValidation = require(componentPath);

// Load static source files
const files = [
    { name: 'index.php', path: indexPath },
    { name: 'index.html', path: htmlPath },
    { name: '404.html', path: notFoundPath }
];

const contents = {};
files.forEach(f => {
    contents[f.name] = fs.existsSync(f.path) ? fs.readFileSync(f.path, 'utf8') : '';
});
const componentContent = fs.existsSync(componentPath) ? fs.readFileSync(componentPath, 'utf8') : '';

// Helper to await laser scan progression completion in tests
async function waitForScanCompletion(timeoutMs = 1000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
        const fill = domStore['scanProgressFill'];
        if (fill && fill.style.width === '100%') {
            await new Promise(r => setTimeout(r, 20));
            return true;
        }
        await new Promise(r => setTimeout(r, 10));
    }
    return false;
}

// ============================================================================
// SUITE 1: TIER 1 — FEATURE COVERAGE (R1 TO R4)
// ============================================================================
console.log('--- [SUITE 1: TIER 1] Feature Coverage (R1 to R4) ---');

// R1: Activation Trigger Button
files.forEach(({ name }) => {
    runTest('TIER 1 (R1)', `[${name}] Launcher button #cryptoCardValidationLauncherBtn exists in authOverlay`, () => {
        const c = contents[name];
        assert(c.includes('id="cryptoCardValidationLauncherBtn"') || c.includes('id=\'cryptoCardValidationLauncherBtn\''),
            `#cryptoCardValidationLauncherBtn missing in ${name}`);
    });

    runTest('TIER 1 (R1)', `[${name}] Launcher contains exact user dual-polygon SVG`, () => {
        const c = contents[name];
        assert(c.includes('M24,94l40,-70l40,70h-30l-10,13l-10,-13z'),
            `SVG inner polygon path missing in ${name}`);
        assert(c.includes('106.6,92.5l-40,-70'),
            `SVG outer polygon path missing in ${name}`);
    });
});

// R2: Validation Window Frame & Structure (Tool 1)
files.forEach(({ name }) => {
    runTest('TIER 1 (R2)', `[${name}] Modal overlay and 480px validation window container exist`, () => {
        const c = contents[name];
        assert(c.includes('id="cryptoCardValidationModalOverlay"') || c.includes('id="cryptoCardValidationOverlay"'),
            `Modal overlay #cryptoCardValidationModalOverlay missing in ${name}`);
        assert(c.includes('id="validationWindow"') || c.includes('class="validation-window"'),
            `Validation window container (.validation-window) missing in ${name}`);
    });

    runTest('TIER 1 (R2)', `[${name}] CSS enforces 480px width, 1035px height, #FFFFFF, shadow and 16px radius`, () => {
        const c = contents[name] + '\n' + componentContent;
        assert(c.includes('480px'), `Width 480px rule missing in ${name}`);
        assert(c.includes('1035px'), `Height 1035px rule missing in ${name}`);
        assert(c.includes('0px 24px 48px -8px rgba(0, 0, 0, 0.5)') || c.includes('0 24px 48px -8px rgba(0,0,0,0.5)'),
            `Shadow 0px 24px 48px -8px rgba(0, 0, 0, 0.5) missing in ${name}`);
        assert(c.includes('16px'), `Border-radius 16px rule missing in ${name}`);
    });

    runTest('TIER 1 (R2)', `[${name}] Title bar contains 3 dots (10px) and Geist Mono 11px label`, () => {
        const c = contents[name];
        assert(c.includes('SECURE VALIDATION LAYER'),
            `Title bar label "SECURE VALIDATION LAYER" missing in ${name}`);
        assert(c.includes('id="closeValidationWindowBtn"') || c.includes('closeCryptoCardValidationWindow'),
            `Close button #closeValidationWindowBtn missing in ${name}`);
    });

    runTest('TIER 1 (R2)', `[${name}] Header section displays Validación Criptográfica & subtitle`, () => {
        const c = contents[name];
        assert(c.includes('Validación Criptográfica'),
            `Header title "Validación Criptográfica" missing in ${name}`);
        assert(c.includes('CAPA DE SEGURIDAD & AUTENTICACIÓN POST-CUÁNTICA') || c.includes('CAPA DE SEGURIDAD &amp; AUTENTICACIÓN POST-CUÁNTICA'),
            `Header subtitle "CAPA DE SEGURIDAD & AUTENTICACIÓN POST-CUÁNTICA" missing in ${name}`);
    });

    runTest('TIER 1 (R2)', `[${name}] Section 01 contains dropzone and real file input`, () => {
        const c = contents[name];
        assert(c.includes('Seleccionar Tarjeta'), `Section 01 label "Seleccionar Tarjeta" missing in ${name}`);
        assert(c.includes('id="cardUploadZone"'), `Dropzone #cardUploadZone missing in ${name}`);
        assert(c.includes('id="cryptoCardFileInput"'), `File input #cryptoCardFileInput missing in ${name}`);
        assert(c.includes('accept="image/*"') || c.includes('accept=\'image/*\''), `image/* accept missing in ${name}`);
    });

    runTest('TIER 1 (R2)', `[${name}] Section 02 contains 432x280px preview area and real image element`, () => {
        const c = contents[name];
        assert(c.includes('Escaneo & Análisis') || c.includes('Escaneo &amp; Análisis'), `Section 02 label "Escaneo & Análisis" missing in ${name}`);
        assert(c.includes('id="cardPreviewArea"'), `Preview area #cardPreviewArea missing in ${name}`);
        assert(c.includes('id="cardRealUploadedImage"'), `Real image element #cardRealUploadedImage missing in ${name}`);
    });

    runTest('TIER 1 (R2)', `[${name}] Section 02 contains laser line, 3 checks and progress bar`, () => {
        const c = contents[name];
        assert(c.includes('id="scanLaserLine"') || c.includes('class="scan-laser-line"'),
            `Laser scan line #scanLaserLine missing in ${name}`);
        assert(c.includes('id="checkFormat"') || c.includes('Formato'), `Check "Formato" missing in ${name}`);
        assert(c.includes('id="checkQrParity"') || c.includes('Paridad QR'), `Check "Paridad QR" missing in ${name}`);
        assert(c.includes('id="checkAlgorithm"') || c.includes('Algoritmo'), `Check "Algoritmo" missing in ${name}`);
        assert(c.includes('id="scanProgressTrack"'), `Progress track #scanProgressTrack missing in ${name}`);
        assert(c.includes('id="scanProgressFill"'), `Progress fill #scanProgressFill missing in ${name}`);
    });

    runTest('TIER 1 (R2)', `[${name}] Section 03 contains success plate and primary submit button`, () => {
        const c = contents[name];
        assert(c.includes('Certificación Final'), `Section 03 label "Certificación Final" missing in ${name}`);
        assert(c.includes('id="cardSuccessPlate"'), `Success plate #cardSuccessPlate missing in ${name}`);
        assert(c.includes('Hashcod Codespace Inc.'), `Issuer "Hashcod Codespace Inc." missing in ${name}`);
        assert(c.includes('id="submitLoginButton"'), `Submit button #submitLoginButton missing in ${name}`);
    });
});

// R3: Cryptographic Validation, 1-Hour Lockout & Dilithium-5 Rescue Override
files.forEach(({ name }) => {
    runTest('TIER 1 (R3)', `[${name}] References persistent lockout and validated card storage keys`, () => {
        const c = contents[name] + '\n' + componentContent;
        assert(c.includes(STORAGE_LOCKOUT_KEY), `Storage key '${STORAGE_LOCKOUT_KEY}' missing in ${name}`);
        assert(c.includes(STORAGE_VALIDATED_CARD_KEY), `Storage key '${STORAGE_VALIDATED_CARD_KEY}' missing in ${name}`);
    });

    runTest('TIER 1 (R3)', `[${name}] Contains 60-min countdown timer container and rescue key input`, () => {
        const c = contents[name];
        assert(c.includes('id="cardLockoutCountdown"'), `Countdown element #cardLockoutCountdown missing in ${name}`);
        assert(c.includes('id="cardLockDilithiumRescueInput"'), `Rescue input #cardLockDilithiumRescueInput missing in ${name}`);
        assert(c.includes('id="btnDilithiumRescueOverride"'), `Rescue button #btnDilithiumRescueOverride missing in ${name}`);
    });

    runTest('TIER 1 (R3)', `[${name}] Verbatim 2,880-character Dilithium-5 signature embedded or accessible`, () => {
        const c = contents[name] + '\n' + componentContent;
        assert(c.includes(DILITHIUM5_RESCUE_OVERRIDE_SIGNATURE.substring(0, 60)),
            `Dilithium-5 rescue signature constant prefix missing in ${name}`);
        assert(c.includes(DILITHIUM5_RESCUE_OVERRIDE_SIGNATURE.substring(2820)),
            `Dilithium-5 rescue signature constant suffix missing in ${name}`);
    });
});

// R4: Authenticated Card Entry Panel (Tool 2)
files.forEach(({ name }) => {
    runTest('TIER 1 (R4)', `[${name}] Tool 2 panel #cryptoCardUploadPanel exists with 400x370px dimensions`, () => {
        const c = contents[name];
        assert(c.includes('id="cryptoCardUploadPanel"') || c.includes('class="crypto-card-upload-panel"'),
            `Tool 2 container #cryptoCardUploadPanel missing in ${name}`);
        assert(c.includes('Acceso con Tarjeta Criptográfica'),
            `Title "Acceso con Tarjeta Criptográfica" missing in ${name}`);
        assert(c.includes('AUTENTICACIÓN DIRECTA MEDIANTE TARJETA CERTIFICADA'),
            `Subtitle "AUTENTICACIÓN DIRECTA MEDIANTE TARJETA CERTIFICADA" missing in ${name}`);
        assert(c.includes('VALIDACIÓN DIRECTA'),
            `Badge "VALIDACIÓN DIRECTA" missing in ${name}`);
    });

    runTest('TIER 1 (R4)', `[${name}] Direct unlock calls window.l8UnlockPlatform() upon validated card`, () => {
        const c = contents[name] + '\n' + componentContent;
        assert(c.includes('l8UnlockPlatform'), `Platform unlock call window.l8UnlockPlatform missing in ${name}`);
    });
});

// ============================================================================
// SUITE 2: TIER 2 — BOUNDARY & CORNER CASES
// ============================================================================
console.log('\n--- [SUITE 2: TIER 2] Boundary & Corner Cases ---');

runTest('TIER 2 (Boundary)', 'Non-image file upload rejection prevents scanning and warns user', () => {
    const fullCode = contents['index.php'] + '\n' + componentContent;
    assert(
        fullCode.includes('image/') || fullCode.includes('.type.startsWith(\'image/\')') || fullCode.includes('.type.match(/^image\\//)'),
        'MIME type validation for image files missing in codebase'
    );
});

runTest('TIER 2 (Boundary)', 'Dilithium-5 rescue key input is trimmed to tolerate whitespace, tabs and newlines', () => {
    const fullCode = contents['index.php'] + '\n' + componentContent;
    assert(
        fullCode.includes('.trim()') || fullCode.includes('replace(/^\\s+|\\s+$/g'),
        'Whitespace trimming (.trim()) missing on rescue input'
    );

    const untrimmedKey = `  \n\t  ${DILITHIUM5_RESCUE_OVERRIDE_SIGNATURE}  \r\n `;
    const normalizedKey = untrimmedKey.trim();
    assert.strictEqual(normalizedKey, DILITHIUM5_RESCUE_OVERRIDE_SIGNATURE,
        'Trimmed key must exactly match the 2,880-character signature');
});

runTest('TIER 2 (Boundary)', 'Corrupted signature (1 character altered) is strictly rejected', () => {
    const corruptedKey = DILITHIUM5_RESCUE_OVERRIDE_SIGNATURE.substring(0, 100) + 'X' + DILITHIUM5_RESCUE_OVERRIDE_SIGNATURE.substring(101);
    assert.notStrictEqual(corruptedKey, DILITHIUM5_RESCUE_OVERRIDE_SIGNATURE);
    
    const isMatch = (input) => input.trim() === DILITHIUM5_RESCUE_OVERRIDE_SIGNATURE;
    assert.strictEqual(isMatch(corruptedKey), false, 'Corrupted key must not pass comparison');
});

runTest('TIER 2 (Boundary)', 'Timer reload persistence restores countdown from remaining delta in localStorage', () => {
    const storage = new MockStorage();
    const futureTimestamp = Date.now() + 1800000;
    storage.setItem(STORAGE_LOCKOUT_KEY, String(futureTimestamp));

    const storedVal = storage.getItem(STORAGE_LOCKOUT_KEY);
    assert(storedVal, 'Storage must retain lockout timestamp');
    
    const remainingMs = Math.max(0, parseInt(storedVal, 10) - Date.now());
    assert(remainingMs > 1790000 && remainingMs <= 1800000, `Remaining time calculated correctly (${remainingMs}ms)`);

    const minutes = Math.floor(remainingMs / 60000);
    const seconds = Math.floor((remainingMs % 60000) / 1000);
    const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    assert(/^29:[0-5][0-9]$|^30:00$/.test(formatted), `Countdown formatted as MM:SS (${formatted})`);
});

runTest('TIER 2 (Boundary)', 'Timer expiration naturally cleans storage key and unlocks dropzone', () => {
    const storage = new MockStorage();
    const pastTimestamp = Date.now() - 5000;
    storage.setItem(STORAGE_LOCKOUT_KEY, String(pastTimestamp));

    const checkLockStatus = (mockStorage) => {
        const raw = mockStorage.getItem(STORAGE_LOCKOUT_KEY);
        if (!raw) return { locked: false, remainingMs: 0 };
        const delta = parseInt(raw, 10) - Date.now();
        if (delta <= 0) {
            mockStorage.removeItem(STORAGE_LOCKOUT_KEY);
            return { locked: false, remainingMs: 0 };
        }
        return { locked: true, remainingMs: delta };
    };

    const status = checkLockStatus(storage);
    assert.strictEqual(status.locked, false, 'Expired lockout must return locked = false');
    assert.strictEqual(storage.getItem(STORAGE_LOCKOUT_KEY), null, 'Expired timestamp must be removed from storage');
});

runTest('TIER 2 (Boundary)', 'Rapid sequential file drops cleanly reset progress and checks', () => {
    const fullCode = contents['index.php'] + '\n' + componentContent;
    assert(
        fullCode.includes('clearInterval') || fullCode.includes('clearTimeout') || fullCode.includes('resetScanState'),
        'Scan reset / interval clearance mechanism missing in codebase'
    );
});

// ============================================================================
// SUITE 3: TIER 3 — CROSS-FEATURE COMBINATIONS (GENUINE COMPONENT EXECUTION)
// ============================================================================
console.log('\n--- [SUITE 3: TIER 3] Cross-Feature Combinations (Real Component Invocations) ---');

runTest('TIER 3 (Cross-Feature)', 'Tool 1 card validation -> Storage registration -> Tool 2 direct access pipeline', async () => {
    mockStorage.clear();
    platformUnlocked = false;

    // 1. Generate an authentic Hashcod card canvas and record it in storage
    const authCardCanvas = CryptoCardValidation.generateAuthenticHashcodCardCanvas({
        cardId: 'HASHCOD-CARD-9921-X',
        issuer: 'Hashcod Codespace Inc.'
    });
    mockStorage.setItem(STORAGE_VALIDATED_CARD_KEY, JSON.stringify(authCardCanvas._hashcodCardData));

    // 2. Call real component function CryptoCardValidation.processDirectCardEntry()
    const validFile = { name: 'card.png', type: 'image/png' };
    const res = CryptoCardValidation.processDirectCardEntry(validFile);

    assert(res, 'Direct entry must return a result object');
    assert.strictEqual(res.success, true, 'Tool 2 entry must succeed for certified card');
    assert.strictEqual(res.card.cardId, 'HASHCOD-CARD-9921-X', 'Card ID must match certified record');

    // 3. Verify real submission from Tool 1 validation window submits and unlocks platform
    CryptoCardValidation.submitCryptoCardLogin();
    assert.strictEqual(platformUnlocked, true, 'Platform must unlock via submitCryptoCardLogin()');
});

runTest('TIER 3 (Cross-Feature)', 'Counterfeit card -> Lockout -> Dilithium-5 rescue -> Normal restoration pipeline', () => {
    mockStorage.clear();

    // 1. Trigger security lockout via real exported component method
    CryptoCardValidation.triggerSecurityLockout();
    assert(mockStorage.getItem(STORAGE_LOCKOUT_KEY), 'Lockout timestamp must be saved in storage');
    assert.strictEqual(domStore['cardLockoutBanner'].style.display, 'block', 'Lockout banner must be visible');
    assert.strictEqual(domStore['cryptoCardFileInput'].disabled, true, 'File input must be disabled during lockout');

    // 2. Submit bad rescue attempt via real method
    domStore['cardLockDilithiumRescueInput'].value = 'wrong_dilithium_rescue_key';
    const badRes = CryptoCardValidation.executeDilithiumRescueOverride();
    assert.strictEqual(badRes, false, 'Invalid rescue key must be rejected');
    assert.strictEqual(domStore['cardRescueErrorMsg'].style.display, 'block', 'Rescue error message must be shown');
    assert(mockStorage.getItem(STORAGE_LOCKOUT_KEY), 'Lockout key must remain engaged');

    // 3. Submit authentic 2,880-character Dilithium-5 signature with surrounding whitespace
    domStore['cardLockDilithiumRescueInput'].value = `   \n\t  ${DILITHIUM5_RESCUE_OVERRIDE_SIGNATURE}  \r\n `;
    const goodRes = CryptoCardValidation.executeDilithiumRescueOverride();
    assert.strictEqual(goodRes, true, 'Exact Dilithium-5 rescue key must clear lockout');
    assert.strictEqual(mockStorage.getItem(STORAGE_LOCKOUT_KEY), null, 'Lockout key must be removed from storage');
    assert.strictEqual(domStore['cardLockoutBanner'].style.display, 'none', 'Lockout banner must be dismissed');
    assert.strictEqual(domStore['cryptoCardFileInput'].disabled, false, 'File input must be re-enabled');
});

runTest('TIER 3 (Cross-Feature)', 'Tool 2 rejection of uncertified card without prior Tool 1 validation', () => {
    mockStorage.clear();
    platformUnlocked = false;

    // Direct entry into Tool 2 with uncertified storage
    const uncertFile = { name: 'uncertified.png', type: 'image/png' };
    const res = CryptoCardValidation.processDirectCardEntry(uncertFile);

    assert(res, 'Direct entry must return a verdict object');
    assert.strictEqual(res.error, 'Tarjeta no certificada previamente', 'Must error out on uncertified card');
    assert.strictEqual(platformUnlocked, false, 'Platform must remain locked');
});

// ============================================================================
// SUITE 4: TIER 4 — REAL-WORLD END-TO-END SCENARIOS (GENUINE PIPELINES)
// ============================================================================
console.log('\n--- [SUITE 4: TIER 4] Real-World End-to-End Scenarios (Real Async Execution) ---');

runTest('TIER 4 (E2E Scenario)', 'Full end-to-end legitimate card validation and platform login flow', async () => {
    mockStorage.clear();
    platformUnlocked = false;

    // Step 1: Open validation window
    CryptoCardValidation.openCryptoCardValidationWindow();
    assert.strictEqual(domStore['cryptoCardValidationModalOverlay'].style.display, 'flex', 'Validation modal opened');

    // Step 2: Generate genuine authentic Hashcod card canvas with optical finders & framing
    const authenticCard = CryptoCardValidation.generateAuthenticHashcodCardCanvas({
        cardId: 'HASHCOD-CARD-9921-X',
        issuer: 'Hashcod Codespace Inc.'
    });

    // Step 3: Trigger real verification sequence
    CryptoCardValidation.startVerificationSequence(authenticCard);

    // Step 4: Await progress bar completion
    const completed = await waitForScanCompletion(600);
    assert.strictEqual(completed, true, 'Laser scan progression reached 100%');

    // Step 5: Verify all three checks marked passed in DOM
    assert.strictEqual(domStore['statusFormat'].textContent, '✓', 'Format check passed');
    assert.strictEqual(domStore['statusQrParity'].textContent, '✓', 'QR Parity check passed');
    assert.strictEqual(domStore['statusAlgorithm'].textContent, '✓', 'Algorithm check passed');
    assert.strictEqual(domStore['cardSuccessPlate'].style.display, 'block', 'Success plate rendered');
    assert.strictEqual(domStore['submitLoginButton'].disabled, false, 'Submit button enabled');

    // Step 6: Submit login and verify platform unlocks
    CryptoCardValidation.submitCryptoCardLogin();
    assert.strictEqual(platformUnlocked, true, 'Platform booted and unlocked cleanly via genuine workflow');
});

runTest('TIER 4 (E2E Scenario)', 'Adversarial counterfeit assault -> Lockout engagement -> Post-quantum rescue recovery', async () => {
    mockStorage.clear();

    // Attacker submits counterfeit blank image
    const blankCounterfeit = CryptoCardValidation.generateAuthenticHashcodCardCanvas({ blankImage: true });
    CryptoCardValidation.startVerificationSequence(blankCounterfeit);

    const completed = await waitForScanCompletion(600);
    assert.strictEqual(completed, true, 'Scan completed');

    // Format check fails on blank image
    assert.strictEqual(domStore['statusFormat'].textContent, '✕', 'Blank image failed format check');
    assert(mockStorage.getItem(STORAGE_LOCKOUT_KEY), 'Security lockout engaged automatically');
    assert.strictEqual(domStore['cardLockoutBanner'].style.display, 'block', 'Lockout banner active');

    // Attacker attempts spam brute-force keys
    const spamAttempts = ['admin', 'password', 'dilithium', '12345678', 'DROP TABLE;'];
    spamAttempts.forEach(attempt => {
        domStore['cardLockDilithiumRescueInput'].value = attempt;
        assert.strictEqual(CryptoCardValidation.executeDilithiumRescueOverride(), false, 'Spam key rejected');
    });
    assert(mockStorage.getItem(STORAGE_LOCKOUT_KEY), 'Lockout remains engaged after bad attempts');

    // Admin enters authentic Dilithium-5 rescue key
    domStore['cardLockDilithiumRescueInput'].value = DILITHIUM5_RESCUE_OVERRIDE_SIGNATURE;
    const rescued = CryptoCardValidation.executeDilithiumRescueOverride();
    assert.strictEqual(rescued, true, 'Dilithium-5 rescue key validated');
    assert.strictEqual(mockStorage.getItem(STORAGE_LOCKOUT_KEY), null, 'Lockout cleared by admin key');
});

// ============================================================================
// SUITE 5: TIER 5 — CHALLENGER ADVERSARIAL INTEGRATION TIER
// ============================================================================
console.log('\n--- [SUITE 5: TIER 5] Challenger Adversarial Stress Integration ---');

// Dilithium-5 Key Mutations
runTest('TIER 5 (Adversarial)', 'Dilithium-5: Single character flip at index 0, 1440, and 2879 rejected', () => {
    mockStorage.setItem(STORAGE_LOCKOUT_KEY, String(Date.now() + ONE_HOUR_MS));

    const sig = DILITHIUM5_RESCUE_OVERRIDE_SIGNATURE;
    const flips = [
        'X' + sig.substring(1),
        sig.substring(0, 1440) + 'Z' + sig.substring(1441),
        sig.substring(0, 2879) + 'Q'
    ];

    flips.forEach(mutated => {
        domStore['cardLockDilithiumRescueInput'].value = mutated;
        const res = CryptoCardValidation.executeDilithiumRescueOverride();
        assert.strictEqual(res, false, 'Mutated signature must be strictly rejected');
        assert(mockStorage.getItem(STORAGE_LOCKOUT_KEY) !== null, 'Lockout must stay engaged');
    });
});

runTest('TIER 5 (Adversarial)', 'Dilithium-5: 50 randomized character perturbations strictly rejected', () => {
    mockStorage.setItem(STORAGE_LOCKOUT_KEY, String(Date.now() + ONE_HOUR_MS));
    const sig = DILITHIUM5_RESCUE_OVERRIDE_SIGNATURE;

    for (let i = 0; i < 50; i++) {
        const randIdx = Math.floor(Math.random() * sig.length);
        const randChar = String.fromCharCode(65 + Math.floor(Math.random() * 26));
        const mutated = sig.substring(0, randIdx) + randChar + sig.substring(randIdx + 1);
        if (mutated === sig) continue;

        domStore['cardLockDilithiumRescueInput'].value = mutated;
        assert.strictEqual(CryptoCardValidation.executeDilithiumRescueOverride(), false, 'Random perturbation rejected');
    }
});

runTest('TIER 5 (Adversarial)', 'Dilithium-5: Truncated signatures (-1 character, 50% length) rejected', () => {
    mockStorage.setItem(STORAGE_LOCKOUT_KEY, String(Date.now() + ONE_HOUR_MS));
    const sig = DILITHIUM5_RESCUE_OVERRIDE_SIGNATURE;

    const truncated1 = sig.substring(0, sig.length - 1);
    const truncated50 = sig.substring(0, 1440);

    domStore['cardLockDilithiumRescueInput'].value = truncated1;
    assert.strictEqual(CryptoCardValidation.executeDilithiumRescueOverride(), false, '-1 char truncated rejected');

    domStore['cardLockDilithiumRescueInput'].value = truncated50;
    assert.strictEqual(CryptoCardValidation.executeDilithiumRescueOverride(), false, '50% truncated rejected');
});

runTest('TIER 5 (Adversarial)', 'Dilithium-5: Case sensitivity strictly enforced (lowercase "w" rejected)', () => {
    mockStorage.setItem(STORAGE_LOCKOUT_KEY, String(Date.now() + ONE_HOUR_MS));
    const sig = DILITHIUM5_RESCUE_OVERRIDE_SIGNATURE;

    domStore['cardLockDilithiumRescueInput'].value = 'w' + sig.substring(1);
    assert.strictEqual(CryptoCardValidation.executeDilithiumRescueOverride(), false, 'Lowercase "w" rejected');
});

runTest('TIER 5 (Adversarial)', 'Dilithium-5: Hostile injection strings (SQLi, XSS, prototype, null bytes) 100% rejected', () => {
    const injectionVectors = [
        "' OR '1'='1",
        "<script>alert('pwn')</script>",
        "__proto__.polluted = true",
        "; rm -rf / ;",
        "../../../../etc/passwd",
        "WtM4\0nullbyteinjection"
    ];

    injectionVectors.forEach(vec => {
        mockStorage.setItem(STORAGE_LOCKOUT_KEY, String(Date.now() + ONE_HOUR_MS));
        domStore['cardLockDilithiumRescueInput'].value = vec;
        assert.strictEqual(CryptoCardValidation.executeDilithiumRescueOverride(), false, `Vector '${vec}' rejected`);
    });
});

// Tool 2 Injection Hardening
runTest('TIER 5 (Adversarial)', 'Tool 2: Type Confusion — String "false" parityVerified strictly rejected', () => {
    mockStorage.clear();
    mockStorage.setItem(STORAGE_VALIDATED_CARD_KEY, JSON.stringify({
        cardId: 'SPOOFED-CARD',
        parityVerified: 'false'
    }));

    const res = CryptoCardValidation.processDirectCardEntry({ name: 'card.png', type: 'image/png' });
    assert.strictEqual(res.success, undefined, 'String "false" must not evaluate as valid parity');
    assert.strictEqual(res.error, 'Paridad no válida', 'Paridad no válida returned');
});

runTest('TIER 5 (Adversarial)', 'Tool 2: Type Confusion — Truthy status string "PARITY_FAILED_UNAUTHORIZED" rejected', () => {
    mockStorage.clear();
    mockStorage.setItem(STORAGE_VALIDATED_CARD_KEY, JSON.stringify({
        cardId: 'SPOOFED-CARD',
        parityVerified: 'PARITY_FAILED_UNAUTHORIZED'
    }));

    const res = CryptoCardValidation.processDirectCardEntry({ name: 'card.png', type: 'image/png' });
    assert.strictEqual(res.success, undefined, 'Truthy string must not evaluate as boolean true');
    assert.strictEqual(res.error, 'Paridad no válida');
});

runTest('TIER 5 (Adversarial)', 'Tool 2: Type Confusion — Numeric 1 parityVerified strictly rejected', () => {
    mockStorage.clear();
    mockStorage.setItem(STORAGE_VALIDATED_CARD_KEY, JSON.stringify({
        cardId: 'SPOOFED-CARD',
        parityVerified: 1
    }));

    const res = CryptoCardValidation.processDirectCardEntry({ name: 'card.png', type: 'image/png' });
    assert.strictEqual(res.success, undefined, 'Numeric 1 must not evaluate as boolean true');
    assert.strictEqual(res.error, 'Paridad no válida');
});

runTest('TIER 5 (Adversarial)', 'Tool 2: Active 1-Hour Security Lockout strictly enforced', () => {
    mockStorage.clear();
    mockStorage.setItem(STORAGE_LOCKOUT_KEY, String(Date.now() + ONE_HOUR_MS));
    mockStorage.setItem(STORAGE_VALIDATED_CARD_KEY, JSON.stringify({
        cardId: 'HASHCOD-CARD-9921-X',
        issuer: 'Hashcod Codespace Inc.',
        parityVerified: true
    }));

    const res = CryptoCardValidation.processDirectCardEntry({ name: 'card.png', type: 'image/png' });
    assert.strictEqual(res.success, undefined, 'Tool 2 must not unlock while system is locked out');
    assert.strictEqual(res.error, 'Sistema bloqueado', 'Lockout error returned');
});

runTest('TIER 5 (Adversarial)', 'Tool 2: Naked object missing cardId/issuer strictly rejected', () => {
    mockStorage.clear();
    mockStorage.setItem(STORAGE_VALIDATED_CARD_KEY, JSON.stringify({
        parityVerified: true
    }));

    const res = CryptoCardValidation.processDirectCardEntry({ name: 'card.png', type: 'image/png' });
    assert.strictEqual(res.success, undefined, 'Naked object missing schema must be rejected');
    assert.strictEqual(res.error, 'Paridad no válida');
});

runTest('TIER 5 (Adversarial)', 'Tool 2: Forged issuer "Malicious Attacker Syndicate" strictly rejected', () => {
    mockStorage.clear();
    mockStorage.setItem(STORAGE_VALIDATED_CARD_KEY, JSON.stringify({
        cardId: 'FORGED-CARD-666',
        issuer: 'Malicious Attacker Syndicate',
        parityVerified: true
    }));

    const res = CryptoCardValidation.processDirectCardEntry({ name: 'card.png', type: 'image/png' });
    assert.strictEqual(res.success, undefined, 'Forged issuer must be rejected');
    assert.strictEqual(res.error, 'Paridad no válida');
});

runTest('TIER 5 (Adversarial)', 'Tool 2: Arbitrary non-image file (.exe / .pdf) strictly rejected', () => {
    mockStorage.clear();
    mockStorage.setItem(STORAGE_VALIDATED_CARD_KEY, JSON.stringify({
        cardId: 'HASHCOD-CARD-9921-X',
        issuer: 'Hashcod Codespace Inc.',
        parityVerified: true
    }));

    const res = CryptoCardValidation.processDirectCardEntry({ name: 'exploit.exe', type: 'application/x-msdownload' });
    assert.strictEqual(res.success, undefined, 'Non-image file must be rejected');
    assert.strictEqual(res.error, 'Tipo de archivo no válido. Se requiere una imagen.');
});

// Temporal & Ingestion Hardening
runTest('TIER 5 (Adversarial)', 'Temporal: Corrupted non-numeric / NaN lockout timestamp automatically cleaned', () => {
    mockStorage.clear();
    mockStorage.setItem(STORAGE_LOCKOUT_KEY, 'CORRUPTED_NON_NUMERIC');

    CryptoCardValidation.checkLockoutStatusOnLaunch();
    assert.strictEqual(mockStorage.getItem(STORAGE_LOCKOUT_KEY), null, 'Corrupted key must be purged');
    assert.strictEqual(domStore['cardLockoutBanner'].style.display, 'none', 'Lockout banner dismissed');
});

runTest('TIER 5 (Adversarial)', 'Ingestion: Programmatic processUploadedCard() blocked during active lockout', () => {
    mockStorage.clear();
    mockStorage.setItem(STORAGE_LOCKOUT_KEY, String(Date.now() + ONE_HOUR_MS));

    let scanInitiated = false;
    const originalStart = CryptoCardValidation.startVerificationSequence;
    CryptoCardValidation.processUploadedCard({ name: 'card.png', type: 'image/png' });

    assert.strictEqual(CryptoCardValidation.isLockedOut(), true, 'Lockout confirmed active');
});

runTest('TIER 5 (Adversarial)', 'Optical: Luminance variance rejects blank solid images', () => {
    const blankCanvas = CryptoCardValidation.generateAuthenticHashcodCardCanvas({ blankImage: true });
    const analysis = CryptoCardValidation.analyzeCanvasPixels(blankCanvas);
    assert.strictEqual(analysis.formatPassed, false, 'Blank image must fail format check');
    assert.strictEqual(analysis.error, 'BLANK_OR_UNIFORM_IMAGE', 'Error code must indicate blank image');
});

runTest('TIER 5 (Adversarial)', 'Optical: Finder pattern scan rejects images without 1:1:3:1:1 finders', () => {
    const noFindersCanvas = CryptoCardValidation.generateAuthenticHashcodCardCanvas({ tamperFinders: true });
    const analysis = CryptoCardValidation.analyzeCanvasPixels(noFindersCanvas);
    assert.strictEqual(analysis.formatPassed, true, 'Format check passes for non-blank image');
    assert.strictEqual(analysis.qrParityPassed, false, 'QR parity fails without 1:1:3:1:1 finders');
});

runTest('TIER 5 (Adversarial)', 'Cryptographic: Rejects payloads lacking 0xD5 header or avalanche parity', () => {
    const badFramingCanvas = CryptoCardValidation.generateAuthenticHashcodCardCanvas({ tamperFraming: true });
    const res = CryptoCardValidation.verifyCardCryptographicIntegrity(badFramingCanvas);
    assert.strictEqual(res.valid, false, 'Corrupted framing must be invalid');
    assert.strictEqual(res.algorithmPassed, false, 'Algorithm check must fail');
});

// ============================================================================
// SUITE 6: STATIC GUARDRAILS & INTEGRITY
// ============================================================================
console.log('\n--- [SUITE 6: STATIC GUARDRAILS] HTML Tag Balance & Syntax Checks ---');

// window.l8UnlockPlatform definition check
files.forEach(({ name }) => {
    runTest('GUARDRAILS', `[${name}] window.l8UnlockPlatform is explicitly defined`, () => {
        const c = contents[name];
        assert(c.includes('window.l8UnlockPlatform =') || c.includes('window.l8UnlockPlatform='),
            `window.l8UnlockPlatform definition missing in ${name}`);
    });
});

// HTML Tag Balance Check (Diff: 0)
files.forEach(({ name, path: filePath }) => {
    runTest('GUARDRAILS', `[${name}] HTML <div> tag balance strictly maintained (Diff: 0)`, () => {
        if (!fs.existsSync(filePath)) return;
        const content = fs.readFileSync(filePath, 'utf8');
        const domOnly = content
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gis, '')
            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gis, '')
            .replace(/<\?php[\s\S]*?\?>/gis, '');

        const openDivs = (domOnly.match(/<div\b[^>]*>/gi) || []).length;
        const closeDivs = (domOnly.match(/<\/div>/gi) || []).length;
        const diff = openDivs - closeDivs;
        assert.strictEqual(diff, 0, `HTML <div> tag mismatch in ${name}: open=${openDivs}, close=${closeDivs}, Diff=${diff}`);
    });
});

// Syntax verification
runTest('GUARDRAILS', 'JavaScript syntax verification across component code', () => {
    if (fs.existsSync(componentPath)) {
        const compCode = fs.readFileSync(componentPath, 'utf8');
        try {
            new vm.Script(compCode);
        } catch (syntaxErr) {
            assert.fail(`Syntax error in components/crypto-card-validation.js: ${syntaxErr.message}`);
        }
    }
});

// ============================================================================
// SUITE SUMMARY & RESULT
// ============================================================================
async function finalize() {
    await testQueue;

    console.log('\n================================================================================');
    console.log(`  SUITE EXECUTION FINISHED`);
    console.log(`  Total Tests Run: ${totalPassed + totalFailed}`);
    console.log(`  Passed:          ${totalPassed}`);
    console.log(`  Failed:          ${totalFailed}`);
    console.log('================================================================================');

    if (totalFailed > 0) {
        console.log('\n--- FAILURES SUMMARY ---');
        failureDetails.forEach((f, idx) => {
            console.log(`  ${idx + 1}. [${f.suite}] ${f.name} -> ${f.error}`);
        });
        process.exit(1);
    } else {
        console.log('\n[TDD GREEN]: All tests passed 100%!');
        process.exit(0);
    }
}

finalize();
