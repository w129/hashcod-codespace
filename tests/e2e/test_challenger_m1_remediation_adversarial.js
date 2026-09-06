/**
 * ============================================================================
 * HASHCOD CODESPACE — ADVERSARIAL CHALLENGER TEST SUITE (ITERATION 2)
 * tests/e2e/test_challenger_m1_remediation_adversarial.js
 * ============================================================================
 * 
 * Adversarially challenges the remediated code in components/vector-vision.js:
 * 1. Verify complete absence of `_jabPayloadBytes` and test optical decoding on canvas images.
 * 2. Verify Dilithium-5 key sizes (5184-hex pk, 9792-hex sk) and signature verification with epoch parsing.
 * 3. Test verifyBidirectionalIntegrity with tampered tags (asserting counterfeit alerts).
 * 4. Optical sensor noise resilience and severe canvas corruption rejection.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const crypto = require('crypto');

console.log('================================================================================');
console.log('  HASHCOD CODESPACE — CHALLENGER M1 REMEDIATION ADVERSARIAL TEST HARNESS (IT2)  ');
console.log('================================================================================\n');

// ---------------------------------------------------------------------------
// 1. In-Memory Mock Canvas 2D Environment
// ---------------------------------------------------------------------------
function parseHexToRgb(hexStr) {
    if (!hexStr) return { r: 0, g: 0, b: 0 };
    hexStr = hexStr.trim();
    if (hexStr.startsWith('#')) {
        const hex = hexStr.slice(1);
        if (hex.length === 3) {
            return {
                r: parseInt(hex[0] + hex[0], 16),
                g: parseInt(hex[1] + hex[1], 16),
                b: parseInt(hex[2] + hex[2], 16)
            };
        } else if (hex.length === 6) {
            return {
                r: parseInt(hex.slice(0, 2), 16),
                g: parseInt(hex.slice(2, 4), 16),
                b: parseInt(hex.slice(4, 6), 16)
            };
        }
    }
    return { r: 0, g: 0, b: 0 };
}

class MockCanvasContext2D {
    constructor(canvas) {
        this.canvas = canvas;
        this.fillStyle = '#000000';
        this.strokeStyle = '#000000';
        this.lineWidth = 1;
        this._pixels = new Uint8ClampedArray(canvas.width * canvas.height * 4);
    }

    fillRect(x, y, w, h) {
        const rgb = parseHexToRgb(this.fillStyle);
        const startX = Math.max(0, Math.floor(x));
        const startY = Math.max(0, Math.floor(y));
        const endX = Math.min(this.canvas.width, Math.ceil(x + w));
        const endY = Math.min(this.canvas.height, Math.ceil(y + h));

        for (let py = startY; py < endY; py++) {
            for (let px = startX; px < endX; px++) {
                const idx = (py * this.canvas.width + px) * 4;
                this._pixels[idx] = rgb.r;
                this._pixels[idx + 1] = rgb.g;
                this._pixels[idx + 2] = rgb.b;
                this._pixels[idx + 3] = 255;
            }
        }
    }

    drawImage(src, x, y, w, h) {
        if (src && src.getContext) {
            const srcCtx = src.getContext('2d');
            if (srcCtx && srcCtx._pixels) {
                const minLen = Math.min(this._pixels.length, srcCtx._pixels.length);
                for (let i = 0; i < minLen; i++) {
                    this._pixels[i] = srcCtx._pixels[i];
                }
            }
        }
    }

    getImageData(x, y, w, h) {
        if (x === 0 && y === 0 && w === this.canvas.width && h === this.canvas.height) {
            return {
                data: new Uint8ClampedArray(this._pixels),
                width: w,
                height: h
            };
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
}

class MockCanvas {
    constructor(width = 240, height = 240) {
        this.width = width;
        this.height = height;
        this.dataset = {};
        this._ctx = new MockCanvasContext2D(this);
    }

    getContext(type) {
        if (type === '2d') return this._ctx;
        return null;
    }

    toDataURL(type = 'image/png') {
        return `data:${type};base64,mockImageData`;
    }
}

// Setup browser globals
if (typeof global.document === 'undefined') {
    const mockElements = {};
    global.document = {
        createElement: (tag) => {
            if (tag.toLowerCase() === 'canvas') return new MockCanvas(240, 240);
            return {
                tagName: tag.toUpperCase(),
                style: { setProperty: () => {}, display: '', color: '', background: '', border: '' },
                classList: { add: () => {}, remove: () => {}, contains: () => false },
                children: [],
                appendChild: function(c) { this.children.push(c); return c; },
                removeChild: function(c) { return c; },
                setAttribute: () => {},
                addEventListener: () => {}
            };
        },
        getElementById: (id) => {
            if (!mockElements[id]) {
                mockElements[id] = {
                    id: id,
                    style: { setProperty: () => {}, display: '', color: '', background: '', border: '' },
                    classList: { add: () => {}, remove: () => {}, contains: () => false },
                    children: [],
                    appendChild: function(c) { this.children.push(c); return c; },
                    removeChild: function(c) { return c; },
                    setAttribute: () => {},
                    addEventListener: () => {}
                };
            }
            return mockElements[id];
        },
        querySelector: () => null,
        querySelectorAll: () => [],
        addEventListener: () => {}
    };
}

if (typeof global.navigator === 'undefined') {
    global.navigator = {
        mediaDevices: {
            getUserMedia: async () => ({
                getTracks: () => [{ stop: () => {}, stopped: false }]
            })
        }
    };
}

// Load Vector Vision module
const vectorVisionPath = path.resolve(__dirname, '../../components/vector-vision.js');
const VectorVisionStudio = require(vectorVisionPath);
const CryptoEngine = VectorVisionStudio.CryptoEngine;
const MatrixEngine = VectorVisionStudio.MatrixEngine;
const ScannerEngine = VectorVisionStudio.ScannerEngine;

let passCount = 0;
let failCount = 0;
const results = [];

function assertTest(name, fn) {
    try {
        fn();
        passCount++;
        results.push({ name, status: 'PASS' });
        console.log(`  [PASS] ${name}`);
    } catch (e) {
        failCount++;
        results.push({ name, status: 'FAIL', error: e.message });
        console.error(`  [FAIL] ${name}: ${e.message}`);
    }
}

// Sample test vertices
const SAMPLE_VERTICES = [
    { x: 100, y: 150, index: 0 },
    { x: 140, y: 220, index: 1 },
    { x: 190, y: 280, index: 2 },
    { x: 260, y: 310, index: 3 },
    { x: 330, y: 290, index: 4 },
    { x: 380, y: 240, index: 5 },
    { x: 420, y: 180, index: 6 },
    { x: 470, y: 130, index: 7 }
];

console.log('\n--- SECTION 1: VERIFICATION OF COMPLETE ABSENCE OF _jabPayloadBytes & OPTICAL DECODING ---');

assertTest('1.1 Source code audit: Complete absence of _jabPayloadBytes in components/vector-vision.js', () => {
    const code = fs.readFileSync(vectorVisionPath, 'utf8');
    const matches = code.match(/_jabPayloadBytes/g);
    assert.strictEqual(matches, null, `Expected 0 matches for _jabPayloadBytes, found ${matches ? matches.length : 0}`);
});

assertTest('1.2 Optical rendering does not set _jabPayloadBytes property on canvas', () => {
    const signed = CryptoEngine.signVectorPath(SAMPLE_VERTICES, { seed: 'OPTICAL_TEST_SEED' });
    const canvas = new MockCanvas(240, 240);
    MatrixEngine.renderJabCodeWithCrypto(signed.signedPoints, canvas);

    assert.strictEqual(canvas._jabPayloadBytes, undefined, 'Canvas must not have _jabPayloadBytes property attached');
});

assertTest('1.3 Optical decoding losslessly reads pixels from canvas via ctx.getImageData', () => {
    const signed = CryptoEngine.signVectorPath(SAMPLE_VERTICES, { seed: 'OPTICAL_TEST_SEED' });
    const canvas = new MockCanvas(240, 240);
    MatrixEngine.renderJabCodeWithCrypto(signed.signedPoints, canvas);

    const decoded = MatrixEngine.decodeJabCodeWithCrypto(canvas);
    assert.strictEqual(decoded.validParity, true, 'Optical decoding must yield validParity: true');
    assert.strictEqual(decoded.points.length, SAMPLE_VERTICES.length, 'Decoded point count must match original count');
    for (let i = 0; i < SAMPLE_VERTICES.length; i++) {
        assert.strictEqual(decoded.points[i].index, i, `Point ${i} index must match`);
        assert.strictEqual(decoded.points[i].x, SAMPLE_VERTICES[i].x, `Point ${i} X coordinate must match`);
        assert.strictEqual(decoded.points[i].y, SAMPLE_VERTICES[i].y, `Point ${i} Y coordinate must match`);
        assert.strictEqual(decoded.points[i].tag, signed.signedPoints[i].tag, `Point ${i} tag must match`);
    }
});

assertTest('1.4 Optical decoding succeeds even when canvas._jabGrid and canvas.dataset are completely wiped', () => {
    const signed = CryptoEngine.signVectorPath(SAMPLE_VERTICES, { seed: 'OPTICAL_TEST_SEED' });
    const canvas = new MockCanvas(240, 240);
    MatrixEngine.renderJabCodeWithCrypto(signed.signedPoints, canvas);

    // Completely wipe metadata hints to force candidate grid optical probing
    delete canvas._jabGrid;
    canvas.dataset = {};

    const decoded = MatrixEngine.decodeJabCodeWithCrypto(canvas);
    assert.strictEqual(decoded.validParity, true, 'Optical decoding with wiped metadata must succeed via candidate grid probing');
    assert.strictEqual(decoded.points.length, SAMPLE_VERTICES.length, 'Decoded points must match');
});

assertTest('1.5 Optical noise resilience: Minor RGB noise within palette Voronoi cell decodes losslessly', () => {
    const signed = CryptoEngine.signVectorPath(SAMPLE_VERTICES, { seed: 'NOISE_SEED' });
    const canvas = new MockCanvas(240, 240);
    MatrixEngine.renderJabCodeWithCrypto(signed.signedPoints, canvas);

    // Inject optical sensor noise (+-8 RGB jitter) into pixels
    const ctx = canvas.getContext('2d');
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < imgData.data.length; i += 4) {
        // jitter R, G, B slightly
        imgData.data[i] = Math.max(0, Math.min(255, imgData.data[i] + (i % 7 - 3)));
        imgData.data[i + 1] = Math.max(0, Math.min(255, imgData.data[i + 1] + (i % 5 - 2)));
        imgData.data[i + 2] = Math.max(0, Math.min(255, imgData.data[i + 2] + (i % 9 - 4)));
    }
    // Write noisy pixels back
    ctx._pixels = imgData.data;

    const decoded = MatrixEngine.decodeJabCodeWithCrypto(canvas);
    assert.strictEqual(decoded.validParity, true, 'Noisy canvas must decode losslessly due to Euclidean color quantization');
    assert.strictEqual(decoded.points.length, SAMPLE_VERTICES.length);
});

assertTest('1.6 Optical corruption rejection: Destroyed canvas data triggers invalid parity error', () => {
    const signed = CryptoEngine.signVectorPath(SAMPLE_VERTICES, { seed: 'CORRUPT_SEED' });
    const canvas = new MockCanvas(240, 240);
    MatrixEngine.renderJabCodeWithCrypto(signed.signedPoints, canvas);

    // Paint a black block over data modules
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#000000';
    ctx.fillRect(40, 40, 100, 100);

    const decoded = MatrixEngine.decodeJabCodeWithCrypto(canvas);
    assert.strictEqual(decoded.validParity, false, 'Corrupted canvas must fail parity check');
});

console.log('\n--- SECTION 2: DILITHIUM-5 KEY SIZES (5184-HEX PK, 9792-HEX SK) & EPOCH PARSING ---');

assertTest('2.1 NIST FIPS 204 ML-DSA-87 / Dilithium-5 key sizes (5184 hex pk, 9792 hex sk)', () => {
    const keyPair = CryptoEngine.generateVectorDilithiumKey('TEST_ENTROPY_SEED_2026');
    assert(keyPair.pk, 'pk must exist');
    assert(keyPair.sk, 'sk must exist');
    assert.strictEqual(keyPair.pk.length, 5184, `Public key must be exactly 5184 hex characters (2592 bytes), got ${keyPair.pk.length}`);
    assert.strictEqual(keyPair.sk.length, 9792, `Secret key must be exactly 9792 hex characters (4896 bytes), got ${keyPair.sk.length}`);
    assert(/^[0-9a-fA-F]{5184}$/.test(keyPair.pk), 'pk must be valid hexadecimal string');
    assert(/^[0-9a-fA-F]{9792}$/.test(keyPair.sk), 'sk must be valid hexadecimal string');
});

assertTest('2.2 Distinct entropy seeds produce distinct 5184-hex pk and 9792-hex sk keys', () => {
    const k1 = CryptoEngine.generateVectorDilithiumKey('SEED_ALPHA_2026');
    const k2 = CryptoEngine.generateVectorDilithiumKey('SEED_BETA_2026');

    assert.notStrictEqual(k1.pk, k2.pk, 'Distinct seeds must yield distinct pk');
    assert.notStrictEqual(k1.sk, k2.sk, 'Distinct seeds must yield distinct sk');
    assert.strictEqual(k1.pk.length, 5184);
    assert.strictEqual(k2.pk.length, 5184);
});

assertTest('2.3 Epoch tokenized parsing in generateVectorDilithiumKey', () => {
    const kDefault = CryptoEngine.generateVectorDilithiumKey('STANDARD_SEED');
    assert(kDefault.epoch.startsWith('epoch-'), 'Default epoch must start with epoch-');

    const kCustom = CryptoEngine.generateVectorDilithiumKey('SEED_CUSTOM_epoch-2026-10-15-secure');
    assert.strictEqual(kCustom.epoch, 'epoch-2026-10-15-secure', 'Embedded epoch pattern must be parsed from seed');

    const kOpt = CryptoEngine.generateVectorDilithiumKey('SEED', { epoch: 'epoch-2026-12-31-exp' });
    assert.strictEqual(kOpt.epoch, 'epoch-2026-12-31-exp', 'Options epoch must take precedence');
});

assertTest('2.4 Structured epoch parsing and signature verification in verifyVectorSignature', () => {
    const signed = CryptoEngine.signVectorPath(SAMPLE_VERTICES, { seed: 'SIGN_SEED', epoch: 'epoch-2026-09-01' });
    assert(signed.rootSignature.startsWith('d5-sig-epoch-2026-09-01-'), `Signature format must contain epoch: ${signed.rootSignature}`);

    // Matching epoch
    const vMatch = CryptoEngine.verifyVectorSignature(signed.signedPoints, signed.rootSignature, { epoch: 'epoch-2026-09-01' });
    assert.strictEqual(vMatch.valid, true, 'Matching epoch must verify as valid');

    // Mismatched epoch
    const vMismatch = CryptoEngine.verifyVectorSignature(signed.signedPoints, signed.rootSignature, { epoch: 'epoch-2026-09-02' });
    assert.strictEqual(vMismatch.valid, false, 'Mismatched epoch must be rejected');
    assert(vMismatch.reason.includes('Epoch mismatch'), `Reason must specify epoch mismatch: ${vMismatch.reason}`);

    // Revoked / rotated epoch
    const vRevoked = CryptoEngine.verifyVectorSignature(signed.signedPoints, signed.rootSignature, { epoch: 'epoch-2026-09-01-revoked' });
    assert.strictEqual(vRevoked.valid, false, 'Revoked epoch must be rejected');
    assert(vRevoked.reason.includes('revoked') || vRevoked.reason.includes('expired'));
});

assertTest('2.5 Cryptographic digest tampering in root signature is detected and rejected', () => {
    const signed = CryptoEngine.signVectorPath(SAMPLE_VERTICES, { seed: 'DIGEST_SEED', epoch: 'epoch-2026-09-01' });
    // Tamper the digest part of d5-sig-epoch-2026-09-01-<digest>
    const parts = signed.rootSignature.split('-');
    const tamperedDigest = parts[parts.length - 1].replace(/[0-9a-f]/, (c) => c === '0' ? '1' : '0');
    parts[parts.length - 1] = tamperedDigest;
    const tamperedRootSig = parts.join('-');

    const vTampered = CryptoEngine.verifyVectorSignature(signed.signedPoints, tamperedRootSig, { epoch: 'epoch-2026-09-01' });
    assert.strictEqual(vTampered.valid, false, 'Tampered root signature digest must be rejected');
    assert(vTampered.reason.includes('Cryptographic signature digest verification failed'));
});

console.log('\n--- SECTION 3: verifyBidirectionalIntegrity WITH TAMPERED TAGS (COUNTERFEIT ALERTS) ---');

assertTest('3.1 Authentic baseline: verifyBidirectionalIntegrity validates intact drawing vs matrix points at 100%', () => {
    const signed = CryptoEngine.signVectorPath(SAMPLE_VERTICES, { seed: 'BIDIR_SEED', epoch: 'epoch-2026-09-01' });
    const payload = MatrixEngine.serializeOrderedPoints(signed.signedPoints, { rootSignature: signed.rootSignature });
    const matrixData = MatrixEngine.deserializeOrderedPoints(payload);

    const verdict = VectorVisionStudio.verifyBidirectionalIntegrity(signed.signedPoints, matrixData);
    assert.strictEqual(verdict.match, true, 'Authentic baseline must have match: true');
    assert.strictEqual(verdict.score, 100, 'Score must be 100');
    assert.strictEqual(verdict.status, 'VALIDADO AL 100% ✓', 'Status must be VALIDADO AL 100% ✓');
});

assertTest('3.2 Tampered tag in node 0: Triggers ALERTA DE FALSIFICACIÓN ✕ and pinpoints node 0', () => {
    const signed = CryptoEngine.signVectorPath(SAMPLE_VERTICES, { seed: 'BIDIR_SEED', epoch: 'epoch-2026-09-01' });
    const payload = MatrixEngine.serializeOrderedPoints(signed.signedPoints, { rootSignature: signed.rootSignature });
    const matrixData = MatrixEngine.deserializeOrderedPoints(payload);

    // Tamper drawing points node 0 tag
    const tamperedDrawing = JSON.parse(JSON.stringify(signed.signedPoints));
    const origTag = tamperedDrawing[0].tag;
    tamperedDrawing[0].tag = origTag.slice(0, 15) + (origTag[15] === '0' ? '1' : '0');

    const verdict = VectorVisionStudio.verifyBidirectionalIntegrity(tamperedDrawing, matrixData);
    assert.strictEqual(verdict.match, false, 'Tampered tag must yield match: false');
    assert.strictEqual(verdict.status, 'ALERTA DE FALSIFICACIÓN ✕', 'Status must be counterfeit alert');
    assert(verdict.details.includes('[0]'), `Details must pinpoint node index 0: ${verdict.details}`);
    assert(verdict.details.includes('Tag de coordenadas alterado'), `Details must state tag alteration: ${verdict.details}`);
});

assertTest('3.3 Tampered tag in intermediate node 5: Triggers counterfeit alert pinpointing node 5', () => {
    const signed = CryptoEngine.signVectorPath(SAMPLE_VERTICES, { seed: 'BIDIR_SEED', epoch: 'epoch-2026-09-01' });
    const payload = MatrixEngine.serializeOrderedPoints(signed.signedPoints, { rootSignature: signed.rootSignature });
    const matrixData = MatrixEngine.deserializeOrderedPoints(payload);

    // Tamper drawing points node 5 tag
    const tamperedDrawing = JSON.parse(JSON.stringify(signed.signedPoints));
    tamperedDrawing[5].tag = 'deadbeefcafebabe';

    const verdict = VectorVisionStudio.verifyBidirectionalIntegrity(tamperedDrawing, matrixData);
    assert.strictEqual(verdict.match, false);
    assert.strictEqual(verdict.status, 'ALERTA DE FALSIFICACIÓN ✕');
    assert(verdict.details.includes('[5]'), `Details must pinpoint node index 5: ${verdict.details}`);
});

assertTest('3.4 Tampered tag in matrixData (node 2): Triggers counterfeit alert pinpointing node 2', () => {
    const signed = CryptoEngine.signVectorPath(SAMPLE_VERTICES, { seed: 'BIDIR_SEED', epoch: 'epoch-2026-09-01' });
    const payload = MatrixEngine.serializeOrderedPoints(signed.signedPoints, { rootSignature: signed.rootSignature });
    const matrixData = MatrixEngine.deserializeOrderedPoints(payload);

    // Tamper matrixData points node 2 tag
    matrixData.points[2].tag = '1234567890abcdef';

    const verdict = VectorVisionStudio.verifyBidirectionalIntegrity(signed.signedPoints, matrixData);
    assert.strictEqual(verdict.match, false);
    assert.strictEqual(verdict.status, 'ALERTA DE FALSIFICACIÓN ✕');
    assert(verdict.details.includes('[2]'), `Details must pinpoint node index 2: ${verdict.details}`);
});

assertTest('3.5 Swapped tags between node 1 and node 2 (identical coordinates): Triggers counterfeit alert', () => {
    const signed = CryptoEngine.signVectorPath(SAMPLE_VERTICES, { seed: 'BIDIR_SEED', epoch: 'epoch-2026-09-01' });
    const payload = MatrixEngine.serializeOrderedPoints(signed.signedPoints, { rootSignature: signed.rootSignature });
    const matrixData = MatrixEngine.deserializeOrderedPoints(payload);

    // Swap tags between node 1 and 2 while leaving coordinates unchanged
    const tamperedDrawing = JSON.parse(JSON.stringify(signed.signedPoints));
    const tag1 = tamperedDrawing[1].tag;
    tamperedDrawing[1].tag = tamperedDrawing[2].tag;
    tamperedDrawing[2].tag = tag1;

    const verdict = VectorVisionStudio.verifyBidirectionalIntegrity(tamperedDrawing, matrixData);
    assert.strictEqual(verdict.match, false, 'Tag swap must fail verification');
    assert.strictEqual(verdict.status, 'ALERTA DE FALSIFICACIÓN ✕');
    assert(verdict.details.includes('[1]'), 'Must trigger on node 1');
});

assertTest('3.6 Tampered rootSignature in matrixData: Triggers counterfeit alert with Dilithium-5 failure reason', () => {
    const signed = CryptoEngine.signVectorPath(SAMPLE_VERTICES, { seed: 'BIDIR_SEED', epoch: 'epoch-2026-09-01' });
    const payload = MatrixEngine.serializeOrderedPoints(signed.signedPoints, { rootSignature: signed.rootSignature });
    const matrixData = MatrixEngine.deserializeOrderedPoints(payload);

    matrixData.rootSignature = 'd5-sig-epoch-2026-09-01-badbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadb';

    const verdict = VectorVisionStudio.verifyBidirectionalIntegrity(signed.signedPoints, matrixData);
    assert.strictEqual(verdict.match, false);
    assert.strictEqual(verdict.status, 'ALERTA DE FALSIFICACIÓN ✕');
    assert(verdict.details.includes('Firma raíz Dilithium-5 rechazada'), `Details must specify root signature failure: ${verdict.details}`);
});

assertTest('3.7 Parity word failure: matrixData.validParity === false triggers counterfeit alert immediately', () => {
    const signed = CryptoEngine.signVectorPath(SAMPLE_VERTICES, { seed: 'BIDIR_SEED', epoch: 'epoch-2026-09-01' });
    const matrixData = {
        validParity: false,
        points: signed.signedPoints
    };

    const verdict = VectorVisionStudio.verifyBidirectionalIntegrity(signed.signedPoints, matrixData);
    assert.strictEqual(verdict.match, false);
    assert.strictEqual(verdict.status, 'ALERTA DE FALSIFICACIÓN ✕');
    assert(verdict.details.includes('Paridad de matriz alterada'), `Details must mention parity alteration: ${verdict.details}`);
});

console.log('\n================================================================================');
console.log(`  CHALLENGER ADVERSARIAL TEST RESULTS: ${passCount} PASSED | ${failCount} FAILED`);
console.log('================================================================================\n');

if (failCount > 0) {
    process.exit(1);
} else {
    process.exit(0);
}
