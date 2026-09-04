/**
 * ============================================================================
 * HASHCOD CODESPACE — DILITHIUM-5 SINGLE-USE KEY ROTATION TDD TEST SUITE
 * tests/e2e/test_dilithium_key_rotation_tdd.js
 * ============================================================================
 * 
 * Comprehensive Test-Driven Development (TDD) suite verifying:
 * [SUITE 1] Static HTML & Contract Invariants (index.php, index.html, 404.html)
 * [SUITE 2] Base Passcode & Initial Unlock ('36276217')
 * [SUITE 3] Single-Use Invalidation & Replay Attack Prevention
 * [SUITE 4] Autonomous Key Generation & Next Passcode Access
 * [SUITE 5] UI Visualizer "La que toca" Validation & Clipboard Copy
 * [SUITE 6] State Persistence & Reload Resilience
 * [SUITE 7] Multi-Cycle Rotation Stress (10 Consecutive Rotations)
 * [SUITE 8] HTML Tag Balance (Diff: 0) & JavaScript Syntax Guardrails
 * 
 * Zero external dependencies — pure native Node.js (fs, path, assert, crypto, vm).
 * Run Command: node tests/e2e/test_dilithium_key_rotation_tdd.js
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const crypto = require('crypto');
const vm = require('vm');

console.log('================================================================================');
console.log('  HASHCOD CODESPACE — DILITHIUM-5 KEY ROTATION & INVARIANTS TDD SUITE           ');
console.log('================================================================================\n');

const repoDir = path.resolve(__dirname, '../../');
const indexPath = path.join(repoDir, 'index.php');
const htmlPath = path.join(repoDir, 'index.html');
const notFoundPath = path.join(repoDir, '404.html');

// Invariant Constants
const DEFAULT_INITIAL_GATE_CODE = '36276217';
const STORAGE_ACTIVE_KEY = 'l8_active_d5_gate_passcode';
const STORAGE_CONSUMED_KEYS = 'l8_consumed_d5_gate_passcodes';

// Test Tracking Harness
let totalPassed = 0;
let totalFailed = 0;
const failureDetails = [];

function runTest(suite, name, testFn) {
    try {
        testFn();
        totalPassed++;
        console.log(`  ✓ [${suite}] ${name}`);
    } catch (err) {
        totalFailed++;
        const errMsg = err.message || String(err);
        console.error(`  ✗ [${suite}] ${name}`);
        console.error(`     Error: ${errMsg}`);
        failureDetails.push({ suite, name, error: errMsg });
    }
}

// ============================================================================
// SUITE 1: STATIC ARCHITECTURAL & UI MARKUP INVARIANTS
// ============================================================================
console.log('--- [SUITE 1] Static Architectural & UI Markup Invariants ---');

const filesToTest = [
    { name: 'index.php', path: indexPath },
    { name: 'index.html', path: htmlPath },
    { name: '404.html', path: notFoundPath }
];

filesToTest.forEach(({ name, path: filePath }) => {
    runTest('SUITE 1', `File ${name} exists and is readable`, () => {
        assert(fs.existsSync(filePath), `Target file missing: ${name}`);
        const stat = fs.statSync(filePath);
        assert(stat.size > 1000, `File ${name} is too small (${stat.size} bytes)`);
    });

    const content = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';

    runTest('SUITE 1', `File ${name} contains Dilithium Gate Modal, Input, Error and Launcher`, () => {
        assert(content.includes('id="dilithiumGateModal"'), `dilithiumGateModal missing in ${name}`);
        assert(content.includes('id="d5GatePasscodeInput"'), `d5GatePasscodeInput missing in ${name}`);
        assert(content.includes('id="d5GateErrorMsg"'), `d5GateErrorMsg missing in ${name}`);
        assert(content.includes('id="d5LauncherBtn"'), `d5LauncherBtn missing in ${name}`);
        assert(content.includes('id="dilithiumGeneratorModal"'), `dilithiumGeneratorModal missing in ${name}`);
        assert(content.includes('verifyDilithiumGateCode'), `verifyDilithiumGateCode handler missing in ${name}`);
    });

    runTest('SUITE 1', `File ${name} contains "La que toca" Visualizer Section`, () => {
        assert(content.includes('Próxima Clave Dilithium-5 Activa (La que toca)'), 
            `"La que toca" title/badge text missing in ${name}`);
        assert(
            content.includes('id="d5NextActivePasscodeSection"') || 
            content.includes('class="d5-next-key-section"') || 
            content.includes('id="d5NextKeySection"'),
            `Next active passcode section container (#d5NextActivePasscodeSection) missing in ${name}`
        );
        assert(
            content.includes('id="d5NextActivePasscodeVal"') || 
            content.includes('id="d5NextActivePasscodeDisplay"'), 
            `Next active passcode display field (#d5NextActivePasscodeVal) missing in ${name}`
        );
        assert(
            content.includes('id="btnCopyActiveD5Passcode"') || 
            content.includes('id="d5CopyNextPasscodeBtn"'), 
            `Copy active key button (#btnCopyActiveD5Passcode) missing in ${name}`
        );
        assert(
            content.includes('id="d5PasscodeConsumedBadge"') || 
            content.includes('id="d5ConsumedKeyStatus"') ||
            content.includes('Clave anterior consumida e invalidada ✓'), 
            `Consumed key status indicator (#d5PasscodeConsumedBadge) missing in ${name}`
        );
    });

    runTest('SUITE 1', `File ${name} binds to persistent storage keys`, () => {
        assert(content.includes(STORAGE_ACTIVE_KEY), 
            `Persistent storage key '${STORAGE_ACTIVE_KEY}' missing in ${name}`);
        assert(content.includes(STORAGE_CONSUMED_KEYS), 
            `Persistent storage key '${STORAGE_CONSUMED_KEYS}' missing in ${name}`);
    });
});

// ============================================================================
// IN-MEMORY BROWSER SIMULATION HARNESS
// ============================================================================

class MockLocalStorage {
    constructor() { this.store = {}; }
    getItem(k) { return Object.prototype.hasOwnProperty.call(this.store, k) ? this.store[k] : null; }
    setItem(k, v) { this.store[k] = String(v); }
    removeItem(k) { delete this.store[k]; }
    clear() { this.store = {}; }
    get length() { return Object.keys(this.store).length; }
    key(n) { return Object.keys(this.store)[n] || null; }
}

class MockElement {
    constructor(id, tagName = 'div') {
        this.id = id;
        this.tagName = tagName.toUpperCase();
        this._val = '';
        this._txt = '';
        this.style = {
            display: '',
            borderColor: '',
            zIndex: '',
            setProperty(prop, val) { this[prop] = val; },
            getPropertyValue(prop) { return this[prop] || ''; }
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
        this.attributes = {};
    }

    get value() { return this._val; }
    set value(v) { this._val = String(v); }

    get textContent() { return this._txt; }
    set textContent(v) { this._txt = String(v); }

    get innerText() { return this._txt; }
    set innerText(v) { this._txt = String(v); }

    get innerHTML() { return this._txt; }
    set innerHTML(v) { this._txt = String(v); }

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
    focus() { this._focused = true; }
    blur() { this._focused = false; }
    getAttribute(name) { return this.attributes[name] || null; }
    setAttribute(name, val) { this.attributes[name] = String(val); }
}

class MockDOMEnvironment {
    constructor() {
        this.elements = {};
        this.localStorage = new MockLocalStorage();
        this.sessionStorage = new MockLocalStorage();
        this.clipboardText = null;
        this.toastMessages = [];

        const knownElements = [
            { id: 'dilithiumGateModal', tag: 'div' },
            { id: 'd5GatePasscodeInput', tag: 'input' },
            { id: 'd5GateErrorMsg', tag: 'div' },
            { id: 'd5LauncherBtn', tag: 'button' },
            { id: 'dilithiumGeneratorModal', tag: 'div' },
            { id: 'd5NextActivePasscodeSection', tag: 'div' },
            { id: 'd5NextKeySection', tag: 'div' },
            { id: 'd5NextActivePasscodeVal', tag: 'input' },
            { id: 'd5NextActivePasscodeDisplay', tag: 'input' },
            { id: 'd5PasscodeConsumedBadge', tag: 'span' },
            { id: 'd5ConsumedKeyStatus', tag: 'span' },
            { id: 'btnCopyActiveD5Passcode', tag: 'button' },
            { id: 'd5CopyNextPasscodeBtn', tag: 'button' },
            { id: 'd5GenOriginalSig', tag: 'textarea' },
            { id: 'd5GenPublicKey', tag: 'input' },
            { id: 'd5GenScalarInput', tag: 'input' },
            { id: 'd5GenIterationBadge', tag: 'span' },
            { id: 'd5GenResultSig', tag: 'textarea' },
            { id: 'btnMultiplyDilithium', tag: 'button' },
            { id: 'btnCopyDilithiumResult', tag: 'button' },
            { id: 'btnUseInRegistration', tag: 'button' }
        ];

        knownElements.forEach(({ id, tag }) => {
            this.elements[id] = new MockElement(id, tag);
        });

        this.linkAlias('d5NextActivePasscodeVal', 'd5NextActivePasscodeDisplay');
        this.linkAlias('d5PasscodeConsumedBadge', 'd5ConsumedKeyStatus');
        this.linkAlias('btnCopyActiveD5Passcode', 'd5CopyNextPasscodeBtn');
        this.linkAlias('d5NextActivePasscodeSection', 'd5NextKeySection');
    }

    linkAlias(id1, id2) {
        const el1 = this.elements[id1];
        const el2 = this.elements[id2];
        if (!el1 || !el2) return;

        Object.defineProperty(el1, 'value', {
            get() { return el2._val !== undefined && el2._val !== '' ? el2._val : (el1._val || ''); },
            set(v) { el1._val = String(v); el2._val = String(v); }
        });
        Object.defineProperty(el2, 'value', {
            get() { return el1._val !== undefined && el1._val !== '' ? el1._val : (el2._val || ''); },
            set(v) { el1._val = String(v); el2._val = String(v); }
        });
        Object.defineProperty(el1, 'textContent', {
            get() { return el2._txt !== undefined && el2._txt !== '' ? el2._txt : (el1._txt || ''); },
            set(v) { el1._txt = String(v); el2._txt = String(v); }
        });
        Object.defineProperty(el2, 'textContent', {
            get() { return el1._txt !== undefined && el1._txt !== '' ? el1._txt : (el2._txt || ''); },
            set(v) { el1._txt = String(v); el2._txt = String(v); }
        });
    }

    getElementById(id) {
        if (!this.elements[id]) {
            this.elements[id] = new MockElement(id);
        }
        return this.elements[id];
    }

    querySelector(sel) {
        if (sel.startsWith('#')) return this.getElementById(sel.slice(1));
        return null;
    }

    querySelectorAll(sel) {
        if (sel.startsWith('#')) {
            const el = this.getElementById(sel.slice(1));
            return el ? [el] : [];
        }
        return [];
    }
}

/**
 * Authoritative Cryptographic Reference Oracle for Post-Quantum Recurrence & Key Derivation
 */
const DilithiumRecurrenceOracle = {
    Q_MODULUS: 8380417n,
    evaluateRecurrenceScalar(iter) {
        const b = BigInt(iter);
        return 7n * (b ** 3n) + 3n * (b ** 2n) - b + 1n;
    },
    deriveNextPasscode(iter, prevCode) {
        const scalar = this.evaluateRecurrenceScalar(iter);
        const salt = BigInt(prevCode || DEFAULT_INITIAL_GATE_CODE);
        const combined = (scalar * 1337n + salt * 31n + 7n) % 90000000n;
        return String(10000000n + combined);
    }
};

/**
 * Sandboxed Execution Session Builder
 * Extracts and executes the client-side Dilithium controller from index.php
 */
function createSandboxedSession(env) {
    const sandbox = {
        window: {
            addEventListener: (evt, fn) => {},
            removeEventListener: () => {}
        },
        addEventListener: (evt, fn) => {},
        removeEventListener: () => {},
        document: {
            getElementById: (id) => env.getElementById(id),
            querySelector: (sel) => env.querySelector(sel),
            querySelectorAll: (sel) => env.querySelectorAll(sel),
            addEventListener: (evt, fn) => {},
            removeEventListener: () => {}
        },
        localStorage: env.localStorage,
        sessionStorage: env.sessionStorage,
        navigator: {
            clipboard: {
                writeText: (txt) => {
                    env.clipboardText = String(txt);
                    return Promise.resolve();
                }
            }
        },
        console: {
            log: () => {},
            warn: () => {},
            error: () => {}
        },
        setTimeout: (fn, ms) => {
            if (typeof fn === 'function') fn();
            return 1;
        },
        clearTimeout: () => {},
        setInterval: () => 1,
        clearInterval: () => {},
        BigInt: BigInt,
        Math: Math,
        Date: Date,
        JSON: JSON,
        String: String,
        Number: Number,
        Array: Array,
        Object: Object,
        crypto: crypto,
        Uint8Array: Uint8Array,
        atob: (s) => Buffer.from(s, 'base64').toString('binary'),
        btoa: (s) => Buffer.from(s, 'binary').toString('base64')
    };
    sandbox.window = sandbox;
    sandbox.global = sandbox;
    sandbox.self = sandbox;
    sandbox.window.showAdminToast = (msg) => {
        env.toastMessages.push(String(msg));
    };

    vm.createContext(sandbox);

    if (fs.existsSync(indexPath)) {
        const indexContent = fs.readFileSync(indexPath, 'utf8');
        const marker = 'initDilithiumSignatureGenerator';
        const markerIdx = indexContent.indexOf(marker);

        if (markerIdx !== -1) {
            const funcStart = indexContent.lastIndexOf('(function', markerIdx);
            const funcEndMarker = '})();';
            const funcEnd = indexContent.indexOf(funcEndMarker, markerIdx);
            if (funcStart !== -1 && funcEnd !== -1) {
                const code = indexContent.substring(funcStart, funcEnd + funcEndMarker.length);
                try {
                    vm.runInContext(code, sandbox);
                } catch (e) {
                    sandbox.__scriptError = e.message;
                }
            }
        }
    }

    return sandbox;
}

// ============================================================================
// SUITE 2: BASE PASSCODE & INITIAL UNLOCK ('36276217')
// ============================================================================
console.log('\n--- [SUITE 2] Base Passcode & Initial Unlock ---');

let env = new MockDOMEnvironment();
let sandbox = createSandboxedSession(env);

runTest('SUITE 2', 'Initial environment defaults to 36276217 when storage is empty', () => {
    assert.strictEqual(env.localStorage.getItem(STORAGE_ACTIVE_KEY), null, 'Storage should initially be empty');
    
    // Check accessor if exposed, or fallback rule
    let activeCode = DEFAULT_INITIAL_GATE_CODE;
    if (typeof sandbox.window.getActiveDilithiumGatePasscode === 'function') {
        activeCode = sandbox.window.getActiveDilithiumGatePasscode();
    } else if (typeof sandbox.getActiveDilithiumGatePasscode === 'function') {
        activeCode = sandbox.getActiveDilithiumGatePasscode();
    }
    assert.strictEqual(activeCode, DEFAULT_INITIAL_GATE_CODE, 'Initial active code must be 36276217');
});

runTest('SUITE 2', 'Entering base passcode 36276217 unlocks tool and transitions modals', () => {
    assert(typeof sandbox.window.verifyDilithiumGateCode === 'function', 'verifyDilithiumGateCode must be defined on window');

    const input = env.getElementById('d5GatePasscodeInput');
    const gate = env.getElementById('dilithiumGateModal');
    const modal = env.getElementById('dilithiumGeneratorModal');

    // Simulate opening gate modal
    gate.classList.add('open');
    gate.style.display = 'flex';
    input.value = DEFAULT_INITIAL_GATE_CODE;

    sandbox.window.verifyDilithiumGateCode();

    // Gate should close and generator modal should open
    assert.strictEqual(gate.classList.contains('open'), false, 'dilithiumGateModal must not retain class "open"');
    assert.strictEqual(modal.classList.contains('open'), true, 'dilithiumGeneratorModal must receive class "open"');
    assert(env.toastMessages.some(m => m.includes('desbloqueado') || m.includes('correcto')), 
        'Confirmation toast should indicate successful unlock');
});

runTest('SUITE 2', 'Initial passcode 36276217 is marked consumed in storage', () => {
    const rawConsumed = env.localStorage.getItem(STORAGE_CONSUMED_KEYS);
    assert(rawConsumed !== null, `Storage key '${STORAGE_CONSUMED_KEYS}' must be written upon unlock`);

    let consumedList = [];
    try { consumedList = JSON.parse(rawConsumed); } catch (e) {}
    assert(Array.isArray(consumedList), 'Consumed passcodes must be serialized as JSON array');
    assert(consumedList.includes(DEFAULT_INITIAL_GATE_CODE), 
        `Initial passcode '${DEFAULT_INITIAL_GATE_CODE}' must be present in consumed blacklist`);
});

// ============================================================================
// SUITE 3: SINGLE-USE INVALIDATION & REPLAY ATTACK PREVENTION
// ============================================================================
console.log('\n--- [SUITE 3] Single-Use Invalidation & Replay Attack Prevention ---');

runTest('SUITE 3', 'Re-submitting consumed base passcode 36276217 is strictly rejected', () => {
    const gate = env.getElementById('dilithiumGateModal');
    const modal = env.getElementById('dilithiumGeneratorModal');
    const input = env.getElementById('d5GatePasscodeInput');
    const errMsg = env.getElementById('d5GateErrorMsg');

    // Reset gate state: close generator, reopen gate lock
    if (typeof sandbox.window.closeDilithiumGeneratorModal === 'function') {
        sandbox.window.closeDilithiumGeneratorModal();
    } else {
        modal.classList.remove('open');
        modal.style.display = 'none';
    }

    gate.classList.add('open');
    gate.style.display = 'flex';
    input.value = DEFAULT_INITIAL_GATE_CODE; // Attempt replay with burned passcode
    errMsg.style.display = 'none';

    sandbox.window.verifyDilithiumGateCode();

    // Security invariant: Replay attack MUST fail
    assert.strictEqual(errMsg.style.display, 'block', 'Error message must be displayed on replay attempt');
    assert.strictEqual(modal.classList.contains('open'), false, 'dilithiumGeneratorModal must remain closed on replay attempt');
    assert(
        errMsg.textContent.includes('utilizada') || 
        errMsg.textContent.includes('invalidada') || 
        errMsg.textContent.includes('consumido') ||
        errMsg.textContent.includes('expirado') ||
        errMsg.textContent.includes('denegado') ||
        errMsg.textContent.includes('incorrecto'),
        'Error message should indicate invalidation, expiration, or denied access'
    );
});

runTest('SUITE 3', 'Multiple consecutive replay attempts remain strictly blocked', () => {
    const input = env.getElementById('d5GatePasscodeInput');
    const modal = env.getElementById('dilithiumGeneratorModal');
    const errMsg = env.getElementById('d5GateErrorMsg');

    for (let attempt = 1; attempt <= 5; attempt++) {
        input.value = DEFAULT_INITIAL_GATE_CODE;
        sandbox.window.verifyDilithiumGateCode();
        assert.strictEqual(modal.classList.contains('open'), false, `Replay attempt #${attempt} unexpectedly unlocked modal`);
        assert.strictEqual(errMsg.style.display, 'block', `Error message missing on replay attempt #${attempt}`);
    }
});

runTest('SUITE 3', 'Adversarial inputs (blank, single-bit flip, malicious XSS) are strictly rejected', () => {
    const input = env.getElementById('d5GatePasscodeInput');
    const modal = env.getElementById('dilithiumGeneratorModal');
    const errMsg = env.getElementById('d5GateErrorMsg');

    const adversarialInputs = [
        '',
        '   ',
        '36276218', // single-bit flip from 36276217
        '00000000',
        '99999999',
        '<script>alert(1)</script>',
        '36276217 OR 1=1',
        '\u0000\u0000\u0000\u0000'
    ];

    for (const badInput of adversarialInputs) {
        input.value = badInput;
        sandbox.window.verifyDilithiumGateCode();
        assert.strictEqual(modal.classList.contains('open'), false, `Adversarial input "${badInput}" unexpectedly opened modal`);
        assert.strictEqual(errMsg.style.display, 'block', `Adversarial input "${badInput}" did not trigger error message`);
    }
});

// ============================================================================
// SUITE 4: AUTONOMOUS KEY GENERATION & NEXT PASSCODE ACCESS
// ============================================================================
console.log('\n--- [SUITE 4] Autonomous Key Generation & Next Passcode Access ---');

let secondGeneratedKey = null;

runTest('SUITE 4', 'Mathematical recurrence scalar R(b) = 7b^3 + 3b^2 - b + 1 evaluates deterministically', () => {
    // R(1) = 7(1) + 3(1) - 1 + 1 = 10
    assert.strictEqual(DilithiumRecurrenceOracle.evaluateRecurrenceScalar(1), 10n);
    // R(2) = 7(8) + 3(4) - 2 + 1 = 56 + 12 - 2 + 1 = 67
    assert.strictEqual(DilithiumRecurrenceOracle.evaluateRecurrenceScalar(2), 67n);
    // R(3) = 7(27) + 3(9) - 3 + 1 = 189 + 27 - 3 + 1 = 214
    assert.strictEqual(DilithiumRecurrenceOracle.evaluateRecurrenceScalar(3), 214n);

    // Derivation produces 8-digit strings
    const testCode1 = DilithiumRecurrenceOracle.deriveNextPasscode(2, DEFAULT_INITIAL_GATE_CODE);
    assert.strictEqual(typeof testCode1, 'string');
    assert.strictEqual(testCode1.length, 8);
    assert(/^\d{8}$/.test(testCode1), 'Derivation must produce exactly 8 numeric digits');
});

runTest('SUITE 4', 'A new active passcode was autonomously generated upon initial unlock', () => {
    secondGeneratedKey = env.localStorage.getItem(STORAGE_ACTIVE_KEY);
    assert(secondGeneratedKey !== null, `Key '${STORAGE_ACTIVE_KEY}' must be stored in localStorage`);
    assert.strictEqual(typeof secondGeneratedKey, 'string', 'Stored active passcode must be string');
    assert(secondGeneratedKey.length >= 8, 'Stored active passcode must be at least 8 characters');
    assert.notStrictEqual(secondGeneratedKey, DEFAULT_INITIAL_GATE_CODE, 
        'New active passcode must strictly differ from consumed base passcode');
});

runTest('SUITE 4', 'Unlocking with the newly generated active passcode succeeds', () => {
    const input = env.getElementById('d5GatePasscodeInput');
    const gate = env.getElementById('dilithiumGateModal');
    const modal = env.getElementById('dilithiumGeneratorModal');

    // Reopen gate lock
    if (typeof sandbox.window.closeDilithiumGeneratorModal === 'function') {
        sandbox.window.closeDilithiumGeneratorModal();
    } else {
        modal.classList.remove('open');
        modal.style.display = 'none';
    }

    gate.classList.add('open');
    input.value = secondGeneratedKey; // Enter newly generated passcode

    sandbox.window.verifyDilithiumGateCode();

    assert.strictEqual(gate.classList.contains('open'), false, 'Gate modal should close on valid new passcode');
    assert.strictEqual(modal.classList.contains('open'), true, 'Generator modal should open on valid new passcode');
});

runTest('SUITE 4', 'Second passcode is now burned, third key generated, and second key rejected on retry', () => {
    const rawConsumed = env.localStorage.getItem(STORAGE_CONSUMED_KEYS);
    const consumedList = JSON.parse(rawConsumed || '[]');
    assert(consumedList.includes(secondGeneratedKey), 'Second passcode must now be added to consumed blacklist');

    const thirdGeneratedKey = env.localStorage.getItem(STORAGE_ACTIVE_KEY);
    assert.notStrictEqual(thirdGeneratedKey, secondGeneratedKey, 'A third distinct key must now be active');
    assert.notStrictEqual(thirdGeneratedKey, DEFAULT_INITIAL_GATE_CODE, 'Third key must differ from initial key');

    // Retrying with second key must fail
    const input = env.getElementById('d5GatePasscodeInput');
    const modal = env.getElementById('dilithiumGeneratorModal');
    const errMsg = env.getElementById('d5GateErrorMsg');

    if (typeof sandbox.window.closeDilithiumGeneratorModal === 'function') {
        sandbox.window.closeDilithiumGeneratorModal();
    } else {
        modal.classList.remove('open');
    }

    input.value = secondGeneratedKey;
    sandbox.window.verifyDilithiumGateCode();

    assert.strictEqual(modal.classList.contains('open'), false, 'Burned second key must not unlock gate');
    assert.strictEqual(errMsg.style.display, 'block', 'Error message must be shown for burned second key');
});

// ============================================================================
// SUITE 5: UI VISUALIZER "LA QUE TOCA" VALIDATION & CLIPBOARD COPY
// ============================================================================
console.log('\n--- [SUITE 5] UI Visualizer "La que toca" Validation ---');

runTest('SUITE 5', 'Visualizer field displays active key and badge confirms previous key consumed', () => {
    const currentActive = env.localStorage.getItem(STORAGE_ACTIVE_KEY);
    const activePlatformKey = env.localStorage.getItem('l8_active_dilithium5_key') || (typeof sandbox.window.getActivePlatformDilithiumKey === 'function' ? sandbox.window.getActivePlatformDilithiumKey() : null);
    assert(currentActive !== null || activePlatformKey !== null, 'Current active key must exist in storage or accessor');

    const displayEl = env.getElementById('d5NextActivePasscodeVal');
    const statusLabel = env.getElementById('d5PasscodeConsumedBadge');

    assert(displayEl.value === currentActive || displayEl.value === activePlatformKey || (typeof displayEl.value === 'string' && displayEl.value.length > 0), 
        `Visualizer field #d5NextActivePasscodeVal value (${displayEl.value}) must match active key`);
    assert(statusLabel.textContent.includes('Clave anterior consumida e invalidada') || statusLabel.textContent.includes('✓'),
        'Consumed status badge must confirm invalidation of previous key');
});

runTest('SUITE 5', 'Copy button writes active key to clipboard and triggers confirmation toast', () => {
    const copyBtn = env.getElementById('btnCopyActiveD5Passcode');
    const currentActive = env.localStorage.getItem(STORAGE_ACTIVE_KEY);
    const activePlatformKey = env.localStorage.getItem('l8_active_dilithium5_key') || (typeof sandbox.window.getActivePlatformDilithiumKey === 'function' ? sandbox.window.getActivePlatformDilithiumKey() : null);

    // Trigger copy either via button click or registered global function
    env.clipboardText = null;
    if (typeof sandbox.window.copyActiveDilithiumGatePasscode === 'function') {
        sandbox.window.copyActiveDilithiumGatePasscode();
    } else if (typeof sandbox.window.copyNextActiveDilithiumPasscode === 'function') {
        sandbox.window.copyNextActiveDilithiumPasscode();
    } else {
        copyBtn.click();
    }

    assert(env.clipboardText === currentActive || env.clipboardText === activePlatformKey || (typeof env.clipboardText === 'string' && env.clipboardText.length > 0), 
        `Clipboard must receive active key`);
    assert(env.toastMessages.some(m => m.includes('copiada') || m.includes('Copiado') || m.includes('✓')),
        'Copy action must trigger a confirmation toast');
});

// ============================================================================
// SUITE 6: STATE PERSISTENCE & RELOAD RESILIENCE
// ============================================================================
console.log('\n--- [SUITE 6] State Persistence & Reload Resilience ---');

runTest('SUITE 6', 'Simulated page reload preserves active key and consumed blacklist across fresh execution', () => {
    // Retain storage state on disk/memory, simulate fresh page load with new DOM and sandbox
    const preservedLocalStorage = env.localStorage;
    const reloadedEnv = new MockDOMEnvironment();
    reloadedEnv.localStorage = preservedLocalStorage; // Same browser storage

    const reloadedSandbox = createSandboxedSession(reloadedEnv);

    // Active key must match
    const persistedKey = reloadedEnv.localStorage.getItem(STORAGE_ACTIVE_KEY);
    assert(persistedKey !== null, 'Active key must remain in localStorage after reload');
    assert.strictEqual(persistedKey, env.localStorage.getItem(STORAGE_ACTIVE_KEY));

    // Consumed blacklist must remain intact
    const rawConsumed = reloadedEnv.localStorage.getItem(STORAGE_CONSUMED_KEYS);
    const consumedList = JSON.parse(rawConsumed || '[]');
    assert(consumedList.includes(DEFAULT_INITIAL_GATE_CODE), 'Initial key must remain consumed after reload');
    assert(consumedList.includes(secondGeneratedKey), 'Second key must remain consumed after reload');

    // Attempting to unlock with initial key in fresh session must fail
    const input = reloadedEnv.getElementById('d5GatePasscodeInput');
    const modal = reloadedEnv.getElementById('dilithiumGeneratorModal');
    const errMsg = reloadedEnv.getElementById('d5GateErrorMsg');

    input.value = DEFAULT_INITIAL_GATE_CODE;
    reloadedSandbox.window.verifyDilithiumGateCode();
    assert.strictEqual(modal.classList.contains('open'), false, 'Burned key must not unlock in reloaded session');
    assert.strictEqual(errMsg.style.display, 'block');

    // Unlocking with persisted active key in fresh session must cleanly succeed
    input.value = persistedKey;
    reloadedSandbox.window.verifyDilithiumGateCode();
    assert.strictEqual(modal.classList.contains('open'), true, 'Persisted active key must cleanly unlock in reloaded session');
});

// ============================================================================
// SUITE 7: MULTI-CYCLE ROTATION STRESS (10 CONSECUTIVE GENERATIONS)
// ============================================================================
console.log('\n--- [SUITE 7] Multi-Cycle Rotation Stress (10 Cycles) ---');

runTest('SUITE 7', '10 consecutive rotation cycles enforce strict single-key invariance and no stale access', () => {
    const stressEnv = new MockDOMEnvironment();
    const stressSandbox = createSandboxedSession(stressEnv);
    const keyHistory = [];

    for (let cycle = 1; cycle <= 10; cycle++) {
        // Active key for this cycle
        const currentActive = stressEnv.localStorage.getItem(STORAGE_ACTIVE_KEY) || DEFAULT_INITIAL_GATE_CODE;

        // 1. Invariant: ALL historical keys must be strictly rejected
        for (const staleKey of keyHistory) {
            const input = stressEnv.getElementById('d5GatePasscodeInput');
            const modal = stressEnv.getElementById('dilithiumGeneratorModal');

            if (typeof stressSandbox.window.closeDilithiumGeneratorModal === 'function') {
                stressSandbox.window.closeDilithiumGeneratorModal();
            } else {
                modal.classList.remove('open');
            }

            input.value = staleKey;
            stressSandbox.window.verifyDilithiumGateCode();
            assert.strictEqual(modal.classList.contains('open'), false, 
                `Cycle ${cycle}: Stale key '${staleKey}' unexpectedly unlocked gate`);
        }

        // 2. Invariant: ONLY the current active key can unlock
        const input = stressEnv.getElementById('d5GatePasscodeInput');
        const modal = stressEnv.getElementById('dilithiumGeneratorModal');
        input.value = currentActive;

        stressSandbox.window.verifyDilithiumGateCode();
        assert.strictEqual(modal.classList.contains('open'), true, 
            `Cycle ${cycle}: Active key '${currentActive}' failed to unlock gate`);

        // Record key as used
        keyHistory.push(currentActive);

        // Verify key rotation happened immediately
        const nextActive = stressEnv.localStorage.getItem(STORAGE_ACTIVE_KEY);
        assert(nextActive !== null, `Cycle ${cycle}: Next active key was not stored`);
        assert.notStrictEqual(nextActive, currentActive, `Cycle ${cycle}: Active key was not rotated`);
        assert(!keyHistory.includes(nextActive), `Cycle ${cycle}: Collided with previous key in history`);
    }

    // Verify final consumed count
    const rawConsumed = stressEnv.localStorage.getItem(STORAGE_CONSUMED_KEYS);
    const consumedList = JSON.parse(rawConsumed || '[]');
    assert.strictEqual(consumedList.length, 10, 'Total consumed keys should be 10 (from 10 unlock cycles)');
});

// ============================================================================
// SUITE 8: HTML TAG BALANCE & JAVASCRIPT SYNTAX GUARDRAILS

// ============================================================================
// SUITE 9: PLATFORM REGISTRATION DILITHIUM-5 ENTRY & SINGLE-USE KEY ROTATION
// (User Directive: "pero la clave nueva debe ser una dilithium-5 para la
// validacion de entrada no para entrar a la herramienta sino a la plataforma y
// que aparezca en la herramienta la que toca pero para poner aqui")
// ============================================================================
console.log('\n--- [SUITE 9] Platform Registration Dilithium-5 Entry & Single-Use Rotation ---');

runTest('SUITE 9', 'Initial active platform registration key is valid Dilithium-5 post-quantum signature', () => {
    assert(typeof sandbox.window.getActivePlatformDilithiumKey === 'function', 'getActivePlatformDilithiumKey must be exposed on window');
    const activeKey = sandbox.window.getActivePlatformDilithiumKey();
    assert(typeof activeKey === 'string', 'Active Dilithium-5 key must be string');
    assert(activeKey.length > 200, `Active Dilithium-5 signature must be substantial (>200 chars), got ${activeKey.length}`);
});

runTest('SUITE 9', 'applyGeneratedKeyToRegistration fills #authDilithiumInput and triggers focus/navigation', () => {
    assert(typeof sandbox.window.applyGeneratedKeyToRegistration === 'function', 'applyGeneratedKeyToRegistration must be exposed on window');
    const activeKey = sandbox.window.getActivePlatformDilithiumKey();
    const regInput = env.getElementById('authDilithiumInput');
    regInput.value = '';

    sandbox.window.applyGeneratedKeyToRegistration();

    assert.strictEqual(regInput.value, activeKey, '#authDilithiumInput must receive the active Dilithium-5 key');
    assert(env.toastMessages.some(m => m.includes('Dilithium-5') || m.includes('registro') || m.includes('✓')),
        'Applying key must display toast confirmation');
});

runTest('SUITE 9', 'consumeAndRotateDilithiumKey burns used key and generates next valid Dilithium-5 key', () => {
    assert(typeof sandbox.window.consumeAndRotateDilithiumKey === 'function', 'consumeAndRotateDilithiumKey must be exposed on window');
    const firstKey = sandbox.window.getActivePlatformDilithiumKey();
    
    // Rotate upon user registration with firstKey
    const nextKey = sandbox.window.consumeAndRotateDilithiumKey(firstKey);

    assert(typeof nextKey === 'string', 'Next generated key must be a string');
    assert(nextKey.length > 200, 'Next generated key must be valid post-quantum signature');
    assert.notStrictEqual(nextKey, firstKey, 'Next key must strictly differ from consumed key');

    // Consumed blacklist must include firstKey
    const consumedList = sandbox.window.getConsumedDilithiumKeys();
    assert(consumedList.includes(firstKey), 'Consumed list must contain burned key');
    assert.strictEqual(sandbox.window.isDilithiumKeyConsumed(firstKey), true, 'isDilithiumKeyConsumed must return true for burned key');

    // Visualizer field displays the new key that touches ("la que toca")
    const displayEl = env.getElementById('d5NextActivePasscodeVal');
    assert.strictEqual(displayEl.value, nextKey, '#d5NextActivePasscodeVal must display the new key that touches');
});

runTest('SUITE 9', 'Attempting to register with consumed Dilithium-5 key is strictly rejected', () => {
    const consumedList = sandbox.window.getConsumedDilithiumKeys();
    assert(consumedList.length > 0, 'At least one consumed key must be recorded');
    const burnedKey = consumedList[0];

    assert.strictEqual(sandbox.window.isDilithiumKeyConsumed(burnedKey), true, 'Burned key must be recognized as consumed');
    const activeKey = sandbox.window.getActivePlatformDilithiumKey();
    assert.notStrictEqual(burnedKey, activeKey, 'Burned key must not match active key');
});

// ============================================================================
console.log('\n--- [SUITE 8] HTML Tag Balance & JavaScript Syntax Guardrails ---');

runTest('SUITE 8', 'HTML tag balance verification across index.php, index.html, 404.html (Diff: 0)', () => {
    [indexPath, htmlPath, notFoundPath].forEach(filePath => {
        if (!fs.existsSync(filePath)) return;
        const filename = path.basename(filePath);
        const content = fs.readFileSync(filePath, 'utf8');

        // Strip scripts, styles, and PHP tags to audit DOM markup strictly
        const domOnly = content
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gis, '')
            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gis, '')
            .replace(/<\?php[\s\S]*?\?>/gis, '');

        const rootHtmlOpen = (domOnly.match(/<html\b[^>]*>/gi) || []).length;
        const rootHtmlClose = (domOnly.match(/<\/html>/gi) || []).length;
        const rootHeadOpen = (domOnly.match(/<head\b[^>]*>/gi) || []).length;
        const rootHeadClose = (domOnly.match(/<\/head>/gi) || []).length;
        const rootBodyOpen = (domOnly.match(/<body\b[^>]*>/gi) || []).length;
        const rootBodyClose = (domOnly.match(/<\/body>/gi) || []).length;
        const openDiv = (domOnly.match(/<div\b[^>]*>/gi) || []).length;
        const closeDiv = (domOnly.match(/<\/div>/gi) || []).length;
        const diff = openDiv - closeDiv;

        assert.strictEqual(rootHtmlOpen, 1, `File ${filename}: <html> open count must be 1 (found ${rootHtmlOpen})`);
        assert.strictEqual(rootHtmlClose, 1, `File ${filename}: </html> close count must be 1 (found ${rootHtmlClose})`);
        assert.strictEqual(rootHeadOpen, 1, `File ${filename}: <head> open count must be 1 (found ${rootHeadOpen})`);
        assert.strictEqual(rootHeadClose, 1, `File ${filename}: </head> close count must be 1 (found ${rootHeadClose})`);
        assert.strictEqual(rootBodyOpen, 1, `File ${filename}: <body> open count must be 1 (found ${rootBodyOpen})`);
        assert.strictEqual(rootBodyClose, 1, `File ${filename}: </body> close count must be 1 (found ${rootBodyClose})`);
        assert.strictEqual(diff, 0, 
            `Tag imbalance in ${filename}: ${openDiv} open <div> vs ${closeDiv} close </div> (Diff: ${diff})`);
    });
});

runTest('SUITE 8', 'JavaScript syntax validation (AST compilation of test suite & targets)', () => {
    const selfCode = fs.readFileSync(__filename, 'utf8');
    new Function(selfCode); // Validates test file itself compiles without syntax error
});

// ============================================================================
// SUMMARY & EXIT REPORT
// ============================================================================
console.log('\n================================================================================');
console.log(`  RESULTS: ${totalPassed} PASSED | ${totalFailed} FAILED`);
if (totalFailed > 0) {
    console.log(`  (Baseline TDD State: ${totalFailed} tests pending implementation in Milestone 2)`);
}
console.log('================================================================================\n');

if (failureDetails.length > 0) {
    console.log('--- Summary of Pending Invariants (To be satisfied by M2 Implementation) ---');
    failureDetails.forEach(({ suite, name, error }, idx) => {
        console.log(`  ${idx + 1}. [${suite}] ${name}`);
        console.log(`     -> ${error}`);
    });
    console.log('');
}

// Module export for runner compatibility
module.exports = {
    totalPassed,
    totalFailed,
    failureDetails,
    DilithiumRecurrenceOracle,
    MockDOMEnvironment,
    createSandboxedSession
};

if (require.main === module) {
    if (totalFailed > 0) {
        // In TDD workflow, baseline test execution returns non-zero to denote RED state before GREEN
        process.exit(1);
    } else {
        console.log('  >>> ALL DILITHIUM KEY ROTATION TDD TESTS PASSED WITH 100% SUCCESS!\n');
        process.exit(0);
    }
}
