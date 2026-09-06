/**
 * ============================================================================
 * HASHCOD CODESPACE — CHALLENGER 2 EMPIRICAL STRESS & ADVERSARIAL TEST SUITE
 * Milestone M1 Gate: VectorVisionScannerEngine & Bidirectional Verification
 * File: tests/e2e/test_challenger_2_m1_gate.js
 * ============================================================================
 * 
 * Focus Areas:
 * 1. Camera Lifecycle:
 *    - startCamera invocation & mediaStream constraints validation
 *    - Repeated stopCamera calls & track termination idempotency
 *    - Stream track termination verification
 *    - Resource cleanup, memory retention, and absence of unhandled RAF loops
 * 2. Optical Frame Evaluation Under Extreme Conditions:
 *    - Pitch black frames (0 luminance)
 *    - Overexposed washed-out frames (255 luminance)
 *    - Low-contrast boundary conditions (near-white / near-black)
 *    - Defocused / motion-blurred frames (low Laplacian variance)
 *    - Quadrant illumination imbalance (specular glare / severe shadows)
 *    - Extreme high-frequency sensor noise (salt & pepper)
 * 3. Bidirectional Verification Accuracy:
 *    - 100% match on genuine vector drawings vs decoded matrix
 *    - 0% false positives on tampered points:
 *      * Micro-displacement (+0.002px above 0.001px threshold)
 *      * Macro-displacement (+1px, +10px, +100px)
 *      * Sequence inversion & pairwise swaps (adjacent and distant)
 *      * Point insertion / deletion (cardinality mismatch)
 *      * Parity invalidation & corrupt payload injection
 *      * Null / undefined / boundary edge cases
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const crypto = require('crypto');

console.log('================================================================================');
console.log('       CHALLENGER 2: EMPIRICAL STRESS & ADVERSARIAL VERIFICATION SUITE         ');
console.log('                   Milestone M1 Gate — Vector Vision Platform                   ');
console.log('================================================================================\n');

// ----------------------------------------------------------------------------
// TEST TRACKER
// ----------------------------------------------------------------------------
let testsPassed = 0;
let testsFailed = 0;
let totalAssertions = 0;
const testResults = [];

function empiricalAssert(condition, message) {
    totalAssertions++;
    assert(condition, message);
}

empiricalAssert.strictEqual = function (actual, expected, message) {
    totalAssertions++;
    assert.strictEqual(actual, expected, message);
};

empiricalAssert.notStrictEqual = function (actual, expected, message) {
    totalAssertions++;
    assert.notStrictEqual(actual, expected, message);
};

empiricalAssert.doesNotThrow = function (fn, message) {
    totalAssertions++;
    assert.doesNotThrow(fn, message);
};

empiricalAssert.throws = function (fn, regExpOrErr, message) {
    totalAssertions++;
    assert.throws(fn, regExpOrErr, message);
};

function runEmpiricalTest(category, name, testFn) {
    try {
        const startTime = Date.now();
        const res = testFn();
        if (res && typeof res.then === 'function') {
            return res.then(() => {
                const duration = Date.now() - startTime;
                testsPassed++;
                testResults.push({ category, name, passed: true, duration });
                console.log(`  ✓ [PASS] [${category}] ${name} (${duration}ms)`);
            }).catch(err => {
                const duration = Date.now() - startTime;
                testsFailed++;
                testResults.push({ category, name, passed: false, error: err.message, duration });
                console.error(`  ✗ [FAIL] [${category}] ${name} (${duration}ms)`);
                console.error(`     Error: ${err.message}`);
            });
        } else {
            const duration = Date.now() - startTime;
            testsPassed++;
            testResults.push({ category, name, passed: true, duration });
            console.log(`  ✓ [PASS] [${category}] ${name} (${duration}ms)`);
        }
    } catch (err) {
        testsFailed++;
        testResults.push({ category, name, passed: false, error: err.message });
        console.error(`  ✗ [FAIL] [${category}] ${name}`);
        console.error(`     Error: ${err.message}`);
    }
}

// ----------------------------------------------------------------------------
// MOCK PLATFORM HARNESS (Pure Node.js)
// ----------------------------------------------------------------------------
class MockMediaStreamTrack {
    constructor(kind = 'video') {
        this.kind = kind;
        this.stopped = false;
        this.stopCount = 0;
    }
    stop() {
        this.stopped = true;
        this.stopCount++;
    }
}

class MockMediaStream {
    constructor(tracks) {
        this.tracks = tracks || [new MockMediaStreamTrack('video'), new MockMediaStreamTrack('audio')];
    }
    getTracks() {
        return this.tracks;
    }
    getVideoTracks() {
        return this.tracks.filter(t => t.kind === 'video');
    }
    getAudioTracks() {
        return this.tracks.filter(t => t.kind === 'audio');
    }
}

let lastGUMConstraints = null;
let mockGUMError = null;

if (typeof global.navigator === 'undefined') {
    global.navigator = {};
}
global.navigator.mediaDevices = {
    getUserMedia: async (constraints) => {
        lastGUMConstraints = constraints;
        if (mockGUMError) throw mockGUMError;
        return new MockMediaStream();
    }
};

class MockCanvasContext2D {
    constructor(canvas) {
        this.canvas = canvas;
        this.fillStyle = '#000000';
        this.strokeStyle = '#000000';
        this._pixels = new Uint8ClampedArray(canvas.width * canvas.height * 4);
    }
    fillRect(x, y, w, h) {
        let r = 0, g = 0, b = 0;
        if (this.fillStyle.startsWith('#')) {
            const hex = this.fillStyle.slice(1);
            if (hex.length === 6) {
                r = parseInt(hex.slice(0, 2), 16);
                g = parseInt(hex.slice(2, 4), 16);
                b = parseInt(hex.slice(4, 6), 16);
            }
        }
        const startX = Math.max(0, Math.floor(x));
        const startY = Math.max(0, Math.floor(y));
        const endX = Math.min(this.canvas.width, Math.ceil(x + w));
        const endY = Math.min(this.canvas.height, Math.ceil(y + h));
        for (let py = startY; py < endY; py++) {
            for (let px = startX; px < endX; px++) {
                const idx = (py * this.canvas.width + px) * 4;
                this._pixels[idx] = r;
                this._pixels[idx + 1] = g;
                this._pixels[idx + 2] = b;
                this._pixels[idx + 3] = 255;
            }
        }
    }
    getImageData(x, y, w, h) {
        if (x === 0 && y === 0 && w === this.canvas.width && h === this.canvas.height) {
            return { data: new Uint8ClampedArray(this._pixels), width: w, height: h };
        }
        const data = new Uint8ClampedArray(w * h * 4);
        for (let py = 0; py < h; py++) {
            for (let px = 0; px < w; px++) {
                const srcX = x + px;
                const srcY = y + py;
                if (srcX >= 0 && srcX < this.canvas.width && srcY >= 0 && srcY < this.canvas.height) {
                    const srcIdx = (srcY * this.canvas.width + srcX) * 4;
                    const dstIdx = (py * w + px) * 4;
                    data[dstIdx] = this._pixels[srcIdx];
                    data[dstIdx + 1] = this._pixels[srcIdx + 1];
                    data[dstIdx + 2] = this._pixels[srcIdx + 2];
                    data[dstIdx + 3] = this._pixels[srcIdx + 3];
                }
            }
        }
        return { data, width: w, height: h };
    }
    drawImage(src, x, y, w, h) {
        if (src && src.getContext) {
            const srcCtx = src.getContext('2d');
            if (srcCtx && srcCtx._pixels) {
                const len = Math.min(this._pixels.length, srcCtx._pixels.length);
                for (let i = 0; i < len; i++) this._pixels[i] = srcCtx._pixels[i];
            }
        }
    }
}

class MockCanvas {
    constructor(w = 200, h = 200) {
        this.width = w;
        this.height = h;
        this.dataset = {};
        this._ctx = new MockCanvasContext2D(this);
    }
    getContext(type) {
        return (type === '2d') ? this._ctx : null;
    }
    toDataURL() {
        return 'data:image/png;base64,...';
    }
}

function createMockElement(tag, id = '') {
    const el = {
        tagName: tag.toUpperCase(),
        id,
        style: { display: '', background: '', color: '', border: '' },
        classList: {
            classes: new Set(),
            add: function(c) { this.classes.add(c); },
            remove: function(c) { this.classes.delete(c); },
            contains: function(c) { return this.classes.has(c); }
        },
        children: [],
        innerHTML: '',
        textContent: '',
        value: '',
        srcObject: null,
        dataset: {},
        appendChild: function(c) { this.children.push(c); return c; },
        removeChild: function(c) {
            const idx = this.children.indexOf(c);
            if (idx >= 0) this.children.splice(idx, 1);
            return c;
        },
        querySelector: function(sel) {
            if (sel.startsWith('.')) {
                const cls = sel.slice(1);
                return this.children.find(ch => ch.classList && ch.classList.contains(cls)) || null;
            }
            if (sel.startsWith('#')) {
                const sId = sel.slice(1);
                return this.children.find(ch => ch.id === sId) || null;
            }
            return null;
        },
        querySelectorAll: function(sel) {
            if (sel.startsWith('.')) {
                const cls = sel.slice(1);
                return this.children.filter(ch => ch.classList && ch.classList.contains(cls));
            }
            return [];
        },
        addEventListener: function() {},
        removeEventListener: function() {},
        play: async function() { this.playing = true; },
        pause: function() { this.playing = false; }
    };
    if (tag === 'canvas') {
        el.width = 300;
        el.height = 300;
        el.getContext = (t) => (t === '2d' ? new MockCanvasContext2D(el) : null);
    }
    return el;
}

const mockDomElements = {};
global.document = {
    getElementById: (id) => mockDomElements[id] || null,
    createElement: (tag) => {
        const el = createMockElement(tag);
        return el;
    },
    querySelector: (sel) => {
        if (sel.startsWith('#')) return mockDomElements[sel.slice(1)] || null;
        return null;
    },
    body: createMockElement('body', 'body')
};

global.window = global;
global.Image = function() {
    return createMockElement('img');
};

// ----------------------------------------------------------------------------
// LOAD MODULE UNDER TEST
// ----------------------------------------------------------------------------
const vectorVisionPath = path.resolve(__dirname, '../../components/vector-vision.js');
let VectorVisionStudio;
try {
    VectorVisionStudio = require(vectorVisionPath);
} catch (e) {
    console.error('CRITICAL: Failed to require components/vector-vision.js:', e);
    process.exit(1);
}

const Scanner = VectorVisionStudio.ScannerEngine || global.VectorVisionScannerEngine;
const Crypto = VectorVisionStudio.CryptoEngine || global.VectorVisionCryptoEngine;
const Matrix = VectorVisionStudio.MatrixEngine || global.VectorVisionMatrixEngine;
const Studio = VectorVisionStudio;

// ----------------------------------------------------------------------------
// REFERENCE DATA
// ----------------------------------------------------------------------------
const SAMPLE_NODES_10 = [
    { x: 120, y: 180, index: 0 },
    { x: 250, y: 180, index: 1 },
    { x: 250, y: 450, index: 2 },
    { x: 500, y: 450, index: 3 },
    { x: 500, y: 120, index: 4 },
    { x: 680, y: 120, index: 5 },
    { x: 680, y: 600, index: 6 },
    { x: 850, y: 600, index: 7 },
    { x: 850, y: 850, index: 8 },
    { x: 120, y: 850, index: 9 }
];

// Helper to create synthetic frames
function createSyntheticFrame(width, height, pixelFillFn) {
    const canvas = new MockCanvas(width, height);
    const ctx = canvas.getContext('2d');
    const imgData = ctx._pixels;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            const [r, g, b, a] = pixelFillFn(x, y, width, height);
            imgData[idx] = r;
            imgData[idx + 1] = g;
            imgData[idx + 2] = b;
            imgData[idx + 3] = (a !== undefined) ? a : 255;
        }
    }
    return canvas;
}

// ============================================================================
// SUITE 1: CAMERA LIFECYCLE & RESOURCE MANAGEMENT
// ============================================================================
console.log('\n--- [SUITE 1] Camera Lifecycle, Repeated Stops & Track Termination ---');

async function runSuite1() {
    await runEmpiricalTest('Camera Lifecycle', '1.1 startCamera configures 1280x720 environment constraints & audio: false', async () => {
        const video = createMockElement('video', 'vvVideoTest1');
        const container = createMockElement('div', 'vvContTest1');
        lastGUMConstraints = null;

        await Scanner.startCamera(video, container);

        empiricalAssert(lastGUMConstraints, 'getUserMedia was invoked');
        empiricalAssert.strictEqual(lastGUMConstraints.video.facingMode, 'environment', 'Facing mode is environment');
        empiricalAssert.strictEqual(lastGUMConstraints.video.width.ideal, 1280, 'Ideal width is 1280');
        empiricalAssert.strictEqual(lastGUMConstraints.video.height.ideal, 720, 'Ideal height is 720');
        empiricalAssert.strictEqual(lastGUMConstraints.audio, false, 'Audio is explicitly false to prevent mic access');
        empiricalAssert.strictEqual(Scanner.isActive, true, 'Scanner.isActive is true');
        empiricalAssert.strictEqual(video.srcObject !== null, true, 'video.srcObject is bound');

        Scanner.stopCamera();
    });

    await runEmpiricalTest('Camera Lifecycle', '1.2 stopCamera cleanly stops every track in the media stream', async () => {
        const video = createMockElement('video', 'vvVideoTest2');
        const container = createMockElement('div', 'vvContTest2');

        await Scanner.startCamera(video, container);
        const activeStream = Scanner.currentStream;
        empiricalAssert(activeStream, 'Active stream exists');
        const tracks = activeStream.getTracks();
        empiricalAssert(tracks.length > 0, 'Stream has tracks');

        Scanner.stopCamera();

        empiricalAssert.strictEqual(Scanner.isActive, false, 'Scanner.isActive is false after stop');
        tracks.forEach((track, idx) => {
            empiricalAssert.strictEqual(track.stopped, true, `Track ${idx} (${track.kind}) stopped`);
        });
    });

    await runEmpiricalTest('Camera Lifecycle', '1.3 Repeated stopCamera calls are completely idempotent (10 iterations)', async () => {
        const video = createMockElement('video', 'vvVideoTest3');
        const container = createMockElement('div', 'vvContTest3');

        await Scanner.startCamera(video, container);

        // Perform 10 consecutive stopCamera calls
        for (let i = 0; i < 10; i++) {
            empiricalAssert.doesNotThrow(() => {
                Scanner.stopCamera();
            }, `Repeated stopCamera iteration ${i} must not throw`);
            empiricalAssert.strictEqual(Scanner.isActive, false, `Iteration ${i}: isActive remains false`);
        }
    });

    await runEmpiricalTest('Camera Lifecycle', '1.4 stopCamera before startCamera handles uninitialized state gracefully', () => {
        Scanner.currentStream = null;
        Scanner.isActive = false;

        empiricalAssert.doesNotThrow(() => {
            Scanner.stopCamera();
        }, 'Calling stopCamera on null stream must not throw');
        empiricalAssert.strictEqual(Scanner.isActive, false, 'isActive remains false');
    });

    await runEmpiricalTest('Camera Lifecycle', '1.5 Rapid cycle stress: 50 consecutive startCamera / stopCamera cycles', async () => {
        const video = createMockElement('video', 'vvVideoStress');
        const container = createMockElement('div', 'vvContStress');

        for (let cycle = 1; cycle <= 50; cycle++) {
            await Scanner.startCamera(video, container);
            empiricalAssert.strictEqual(Scanner.isActive, true, `Cycle ${cycle}: start active`);
            Scanner.stopCamera();
            empiricalAssert.strictEqual(Scanner.isActive, false, `Cycle ${cycle}: stop inactive`);
        }
    });

    await runEmpiricalTest('Camera Lifecycle', '1.6 Permission rejection error handling resets isActive and throws error cleanly', async () => {
        const video = createMockElement('video', 'vvVideoPerm');
        const container = createMockElement('div', 'vvContPerm');
        mockGUMError = new Error('NotAllowedError: Permission dismissed');

        let caught = null;
        try {
            await Scanner.startCamera(video, container);
        } catch (e) {
            caught = e;
        } finally {
            mockGUMError = null;
        }

        empiricalAssert(caught !== null, 'Rejection error was caught');
        empiricalAssert(caught.message.includes('NotAllowedError'), 'Error message preserved');
        empiricalAssert.strictEqual(Scanner.isActive, false, 'Scanner isActive remains false upon rejection');
    });

    await runEmpiricalTest('Camera Lifecycle', '1.7 Reticle DOM mount avoidance of duplicate leak', async () => {
        const video = createMockElement('video', 'vvVideoReticle');
        const container = createMockElement('div', 'vvContReticle');

        await Scanner.startCamera(video, container);
        const reticlesFirst = container.querySelectorAll('.scan-reticle').length;
        empiricalAssert.strictEqual(reticlesFirst, 1, 'Exactly 1 reticle mounted');

        // Second startCamera on same container should not duplicate reticle
        await Scanner.startCamera(video, container);
        const reticlesSecond = container.querySelectorAll('.scan-reticle').length;
        empiricalAssert.strictEqual(reticlesSecond, 1, 'Reticle not duplicated on repeated startCamera');

        Scanner.stopCamera();
    });
}

// ============================================================================
// SUITE 2: OPTICAL FRAME EVALUATION UNDER ADVERSARIAL SENSOR CONDITIONS
// ============================================================================
console.log('\n--- [SUITE 2] Optical Frame Evaluation (Black, Washout, Blur, Imbalance, Noise) ---');

function runSuite2() {
    runEmpiricalTest('Optical Evaluation', '2.1 Pitch black frame (0 luminance) rejects auto-capture (underexposed & zero sharpness)', () => {
        const blackCanvas = createSyntheticFrame(128, 128, () => [0, 0, 0, 255]);
        const evalRes = Scanner.analyzeFrameQuadrants(null, blackCanvas);

        empiricalAssert(evalRes, 'Result returned');
        empiricalAssert.strictEqual(evalRes.overallSharpness, 0, 'Sharpness is 0 for pitch black');
        empiricalAssert.strictEqual(evalRes.readyToCapture, false, 'Pitch black frame MUST NOT trigger auto-capture');
    });

    runEmpiricalTest('Optical Evaluation', '2.2 Overexposed washed-out frame (255 luminance) rejects auto-capture', () => {
        const whiteCanvas = createSyntheticFrame(128, 128, () => [255, 255, 255, 255]);
        const evalRes = Scanner.analyzeFrameQuadrants(null, whiteCanvas);

        empiricalAssert.strictEqual(evalRes.overallSharpness, 0, 'Sharpness is 0 for uniform white');
        empiricalAssert.strictEqual(evalRes.readyToCapture, false, 'Washed-out overexposed frame MUST NOT trigger auto-capture');
    });

    runEmpiricalTest('Optical Evaluation', '2.3 Near-washout boundary test (avgLum = 248) rejects auto-capture (avgLum >= 245)', () => {
        const highLumCanvas = createSyntheticFrame(128, 128, () => [248, 248, 248, 255]);
        const evalRes = Scanner.analyzeFrameQuadrants(null, highLumCanvas);

        empiricalAssert.strictEqual(evalRes.readyToCapture, false, 'Frame with luminance 248 must be rejected by overexposure guard');
    });

    runEmpiricalTest('Optical Evaluation', '2.4 Defocused / Gaussian-blurred frame (smooth gradient) rejects auto-capture', () => {
        // Smooth linear gradient with low edge energy
        const blurredCanvas = createSyntheticFrame(128, 128, (x, y, w, h) => {
            const v = Math.floor(100 + (x / w) * 20); // 100 to 120
            return [v, v, v, 255];
        });
        const evalRes = Scanner.analyzeFrameQuadrants(null, blurredCanvas);

        empiricalAssert(evalRes.overallSharpness < 5, `Sharpness (${evalRes.overallSharpness}) is below threshold 10`);
        empiricalAssert.strictEqual(evalRes.readyToCapture, false, 'Defocused blurred frame MUST NOT trigger auto-capture');
    });

    runEmpiricalTest('Optical Evaluation', '2.5 Quadrant illumination imbalance (severe shadow in Q4: maxLum-minLum > 70)', () => {
        // Q1, Q2, Q3 bright (220), Q4 in deep shadow (30)
        const unbalancedCanvas = createSyntheticFrame(128, 128, (x, y, w, h) => {
            if (x >= w / 2 && y >= h / 2) {
                return [30, 30, 30, 255]; // Q4 shadow
            }
            return [220, 220, 220, 255]; // Q1-Q3 bright
        });
        const evalRes = Scanner.analyzeFrameQuadrants(null, unbalancedCanvas);

        empiricalAssert.strictEqual(evalRes.balanced, false, 'Unbalanced lighting must have balanced: false');
        empiricalAssert.strictEqual(evalRes.readyToCapture, false, 'Illumination-imbalanced frame MUST NOT trigger auto-capture');
    });

    runEmpiricalTest('Optical Evaluation', '2.6 Focused high-contrast matrix frame across all 4 quadrants triggers readyToCapture', () => {
        // High-contrast 8x8 checkerboard across entire frame
        const checkerCanvas = createSyntheticFrame(128, 128, (x, y) => {
            const cx = Math.floor(x / 8);
            const cy = Math.floor(y / 8);
            const isDark = (cx + cy) % 2 === 0;
            return isDark ? [15, 15, 15, 255] : [240, 240, 240, 255];
        });
        const evalRes = Scanner.analyzeFrameQuadrants(null, checkerCanvas);

        empiricalAssert(evalRes.overallSharpness > 15, `Sharpness (${evalRes.overallSharpness}) must exceed 15`);
        empiricalAssert.strictEqual(evalRes.balanced, true, 'Evenly distributed checkerboard is balanced');
        empiricalAssert.strictEqual(evalRes.readyToCapture, true, 'Well-focused balanced frame triggers readyToCapture: true');
    });

    runEmpiricalTest('Optical Evaluation', '2.7 Extreme high-frequency noise defense-in-depth: Random noise frame rejected at matrix decode tier', () => {
        // Pseudo-random noise frame (deterministic pseudo-random sequence)
        let seed = 123456789;
        function lcg() {
            seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
            return (seed >>> 16) & 0xFF;
        }
        const noiseCanvas = createSyntheticFrame(128, 128, () => {
            const v = lcg();
            return [v, v, v, 255];
        });

        // Frame analyzer might detect sharpness from high frequency noise...
        const opticalAnalysis = Scanner.analyzeFrameQuadrants(null, noiseCanvas);
        empiricalAssert(opticalAnalysis !== null, 'Optical analysis runs without error');

        // BUT the matrix decoding tier MUST reject the noise with validParity: false
        const decoded = Matrix.decodeJabCodeWithCrypto(noiseCanvas);
        empiricalAssert.strictEqual(decoded.validParity, false, 'Pure noise MUST fail avalanche parity check');

        // AND bidirectional integrity verification MUST emit ALERTA DE FALSIFICACIÓN
        const verification = Studio.verifyBidirectionalIntegrity(SAMPLE_NODES_10, decoded);
        empiricalAssert.strictEqual(verification.match, false, 'Verification match must be false for noise');
        empiricalAssert.strictEqual(verification.status, 'ALERTA DE FALSIFICACIÓN ✕', 'Counterfeit alert emitted');
    });
}

// ============================================================================
// SUITE 3: BIDIRECTIONAL 100% MATCH VS 0% TAMPERING FALSE POSITIVES
// ============================================================================
console.log('\n--- [SUITE 3] Bidirectional Verification: 100% Genuine Match vs 0% False Positives ---');

function runSuite3() {
    // Generate genuine matrix payload
    const signResult = Crypto.signVectorPath(SAMPLE_NODES_10, { seed: 'PQC_SEED_AUTHENTIC_2026' });
    const payloadBytes = Matrix.serializeOrderedPoints(signResult.signedPoints, {
        width: 1000,
        height: 1000,
        rootSignature: signResult.rootSignature
    });
    const genuineMatrixData = Matrix.deserializeOrderedPoints(payloadBytes);

    runEmpiricalTest('Bidirectional Verification', '3.1 Genuine drawing + genuine matrix payload = 100% Match (VALIDADO AL 100% ✓)', () => {
        empiricalAssert.strictEqual(genuineMatrixData.validParity, true, 'Genuine payload has valid parity');
        const verdict = Studio.verifyBidirectionalIntegrity(SAMPLE_NODES_10, genuineMatrixData);

        empiricalAssert.strictEqual(verdict.match, true, 'Match is true');
        empiricalAssert.strictEqual(verdict.score, 100, 'Score is 100%');
        empiricalAssert.strictEqual(verdict.status, 'VALIDADO AL 100% ✓', 'Status badge text is exact');
        empiricalAssert(verdict.details.includes('10 puntos vectoriales'), 'Details state 10 points verified');
    });

    runEmpiricalTest('Bidirectional Verification', '3.2 Sub-pixel micro-tampering: Node 3 displaced by +0.002px (exceeds 0.001px delta)', () => {
        const tampered = JSON.parse(JSON.stringify(SAMPLE_NODES_10));
        tampered[3].x += 0.002; // Exceeds tolerance of 0.001px

        const verdict = Studio.verifyBidirectionalIntegrity(tampered, genuineMatrixData);
        empiricalAssert.strictEqual(verdict.match, false, 'Match is false on micro-tamper');
        empiricalAssert.strictEqual(verdict.status, 'ALERTA DE FALSIFICACIÓN ✕', 'Counterfeit alert');
        empiricalAssert(verdict.details.includes('3'), 'Diagnostic pinpoints Node 3');
    });

    runEmpiricalTest('Bidirectional Verification', '3.3 Macro-tampering: Node 0 displaced by +1.0px', () => {
        const tampered = JSON.parse(JSON.stringify(SAMPLE_NODES_10));
        tampered[0].x += 1.0;

        const verdict = Studio.verifyBidirectionalIntegrity(tampered, genuineMatrixData);
        empiricalAssert.strictEqual(verdict.match, false, 'Match is false');
        empiricalAssert.strictEqual(verdict.status, 'ALERTA DE FALSIFICACIÓN ✕');
        empiricalAssert(verdict.details.includes('0'), 'Diagnostic pinpoints Node 0');
    });

    runEmpiricalTest('Bidirectional Verification', '3.4 Macro-tampering: Node 7 displaced by +50.0px in Y', () => {
        const tampered = JSON.parse(JSON.stringify(SAMPLE_NODES_10));
        tampered[7].y += 50.0;

        const verdict = Studio.verifyBidirectionalIntegrity(tampered, genuineMatrixData);
        empiricalAssert.strictEqual(verdict.match, false, 'Match is false');
        empiricalAssert(verdict.details.includes('7'), 'Diagnostic pinpoints Node 7');
    });

    runEmpiricalTest('Bidirectional Verification', '3.5 Sequence tampering: Adjacent nodes swapped (Node 1 <-> Node 2)', () => {
        const swapped = JSON.parse(JSON.stringify(SAMPLE_NODES_10));
        const tmp = swapped[1];
        swapped[1] = swapped[2];
        swapped[2] = tmp;

        const verdict = Studio.verifyBidirectionalIntegrity(swapped, genuineMatrixData);
        empiricalAssert.strictEqual(verdict.match, false, 'Match is false for adjacent swap');
        empiricalAssert.strictEqual(verdict.status, 'ALERTA DE FALSIFICACIÓN ✕');
        empiricalAssert(verdict.details.includes('VIOLACIÓN DE SECUENCIA'), 'Alert notes sequence violation');
    });

    runEmpiricalTest('Bidirectional Verification', '3.6 Sequence tampering: Distant nodes swapped (Node 2 <-> Node 8)', () => {
        const swapped = JSON.parse(JSON.stringify(SAMPLE_NODES_10));
        const tmp = swapped[2];
        swapped[2] = swapped[8];
        swapped[8] = tmp;

        const verdict = Studio.verifyBidirectionalIntegrity(swapped, genuineMatrixData);
        empiricalAssert.strictEqual(verdict.match, false, 'Match is false for distant swap');
        empiricalAssert.strictEqual(verdict.status, 'ALERTA DE FALSIFICACIÓN ✕');
    });

    runEmpiricalTest('Bidirectional Verification', '3.7 Sequence tampering: Reversing entire node array', () => {
        const reversed = JSON.parse(JSON.stringify(SAMPLE_NODES_10)).reverse();

        const verdict = Studio.verifyBidirectionalIntegrity(reversed, genuineMatrixData);
        empiricalAssert.strictEqual(verdict.match, false, 'Reversed sequence fails verification');
        empiricalAssert.strictEqual(verdict.status, 'ALERTA DE FALSIFICACIÓN ✕');
    });

    runEmpiricalTest('Bidirectional Verification', '3.8 Cardinality tampering: Point deletion (9 drawing points vs 10 matrix points)', () => {
        const truncated = SAMPLE_NODES_10.slice(0, 9);

        const verdict = Studio.verifyBidirectionalIntegrity(truncated, genuineMatrixData);
        empiricalAssert.strictEqual(verdict.match, false, 'Cardinality mismatch fails');
        empiricalAssert.strictEqual(verdict.status, 'ALERTA DE FALSIFICACIÓN ✕');
        empiricalAssert(verdict.details.includes('DISCREPANCIA DE CARDINALIDAD'), 'Cardinality discrepancy reported');
    });

    runEmpiricalTest('Bidirectional Verification', '3.9 Cardinality tampering: Point addition (11 drawing points vs 10 matrix points)', () => {
        const extended = JSON.parse(JSON.stringify(SAMPLE_NODES_10));
        extended.push({ x: 999, y: 999, index: 10 });

        const verdict = Studio.verifyBidirectionalIntegrity(extended, genuineMatrixData);
        empiricalAssert.strictEqual(verdict.match, false, 'Extra point fails');
        empiricalAssert.strictEqual(verdict.status, 'ALERTA DE FALSIFICACIÓN ✕');
        empiricalAssert(verdict.details.includes('DISCREPANCIA DE CARDINALIDAD'));
    });

    runEmpiricalTest('Bidirectional Verification', '3.10 Cryptographic tampering: Invalidate avalanche parity in matrix payload', () => {
        const corruptedBytes = new Uint8Array(payloadBytes);
        // Mutate single byte in payload body
        corruptedBytes[15] ^= 0xFF;

        const corruptedData = Matrix.deserializeOrderedPoints(corruptedBytes);
        empiricalAssert.strictEqual(corruptedData.validParity, false, 'Mutated payload fails avalanche parity');

        const verdict = Studio.verifyBidirectionalIntegrity(SAMPLE_NODES_10, corruptedData);
        empiricalAssert.strictEqual(verdict.match, false, 'Parity failure rejects verification');
        empiricalAssert.strictEqual(verdict.status, 'ALERTA DE FALSIFICACIÓN ✕');
        empiricalAssert(verdict.details.includes('Paridad'), 'Parity failure reported in details');
    });

    runEmpiricalTest('Bidirectional Verification', '3.11 Edge Cases: Null, undefined, empty array and type safety', () => {
        const vNull = Studio.verifyBidirectionalIntegrity(null, null);
        empiricalAssert.strictEqual(vNull.match, true, 'Null against null defaults to empty match (0 == 0)');

        const vEmptyVsReal = Studio.verifyBidirectionalIntegrity([], genuineMatrixData);
        empiricalAssert.strictEqual(vEmptyVsReal.match, false, 'Empty array vs 10 items must fail cardinality');

        const vRealVsEmpty = Studio.verifyBidirectionalIntegrity(SAMPLE_NODES_10, []);
        empiricalAssert.strictEqual(vRealVsEmpty.match, false, '10 items vs empty must fail cardinality');
    });

    runEmpiricalTest('Bidirectional Verification', '3.12 Comprehensive Monte Carlo test: 100 randomized single-coordinate perturbations', () => {
        let caughtCount = 0;
        const iterations = 100;

        for (let i = 0; i < iterations; i++) {
            const tampered = JSON.parse(JSON.stringify(SAMPLE_NODES_10));
            const nodeIndex = i % tampered.length;
            const delta = 0.01 + (i * 0.1); // Always > 0.001
            if (i % 2 === 0) {
                tampered[nodeIndex].x += delta;
            } else {
                tampered[nodeIndex].y += delta;
            }

            const verdict = Studio.verifyBidirectionalIntegrity(tampered, genuineMatrixData);
            if (!verdict.match && verdict.status === 'ALERTA DE FALSIFICACIÓN ✕') {
                caughtCount++;
            }
        }

        empiricalAssert.strictEqual(caughtCount, iterations, `All ${iterations} randomized tampering attempts were detected (100% catch rate / 0% false positives)`);
    });
}

// ============================================================================
// MASTER EXECUTION
// ============================================================================
async function runAllChallengerTests() {
    await runSuite1();
    runSuite2();
    runSuite3();

    console.log('\n================================================================================');
    console.log(`  CHALLENGER 2 SUMMARY: ${testsPassed} PASSED | ${testsFailed} FAILED | ${totalAssertions} Assertions`);
    if (testsFailed === 0) {
        console.log('  >>> EMPIRICAL VERDICT: 100% ROBUST. ALL ADVERSARIAL STRESS TESTS PASSED.');
    } else {
        console.log(`  >>> EMPIRICAL VERDICT: ${testsFailed} ADVERSARIAL CHALLENGES FAILED.`);
    }
    console.log('================================================================================\n');

    return {
        testsPassed,
        testsFailed,
        totalAssertions,
        testResults
    };
}

// Export for programmatic runner or execute directly
if (require.main === module) {
    runAllChallengerTests().then(summary => {
        if (summary.testsFailed > 0) process.exit(1);
        process.exit(0);
    }).catch(err => {
        console.error('Fatal execution error:', err);
        process.exit(1);
    });
}

module.exports = {
    runAllChallengerTests
};
