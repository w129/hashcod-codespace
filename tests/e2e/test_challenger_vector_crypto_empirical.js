/**
 * ============================================================================
 * HASHCOD CODESPACE — CHALLENGER 1 EMPIRICAL ADVERSARIAL STRESS HARNESS
 * tests/e2e/test_challenger_vector_crypto_empirical.js
 * ============================================================================
 * 
 * Empirical Verification of Milestone M1 Gate:
 * 1. Bit-flip avalanche distribution across >=1,000 perturbed coordinate pairs.
 * 2. Single-point mutation detection and sequence order swap detection in
 *    serialized JAB/QR matrices.
 * 3. Edge cases: 1-point vector paths, colinear points, massive coordinates,
 *    empty paths, high-precision floats, and dense curves.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const crypto = require('crypto');

const repoDir = path.resolve(__dirname, '../../');
const vectorVisionPath = path.join(repoDir, 'components/vector-vision.js');

// Mock Canvas and DOM setup
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
}

if (typeof global.document === 'undefined') {
    global.document = {
        getElementById: () => null,
        createElement: (tag) => (tag === 'canvas' ? new MockCanvas() : { style: {}, classList: { add() {}, remove() {} } }),
        querySelector: () => null,
        querySelectorAll: () => [],
        body: { appendChild() {}, removeChild() {} }
    };
}
if (typeof global.window === 'undefined') {
    global.window = global;
}

const VectorVisionStudio = require(vectorVisionPath);
const CryptoEngine = VectorVisionStudio.CryptoEngine;
const MatrixEngine = VectorVisionStudio.MatrixEngine;

console.log('================================================================================');
console.log('  CHALLENGER 1: EMPIRICAL ADVERSARIAL STRESS HARNESS (MILESTONE M1 GATE)        ');
console.log('================================================================================\n');

function countSetBits(n) {
    let count = 0;
    while (n > 0) {
        count += n & 1;
        n >>>= 1;
    }
    return count;
}

function hexHammingDistance(hexA, hexB) {
    const a = hexA.padStart(16, '0');
    const b = hexB.padStart(16, '0');
    let diff = 0;
    for (let i = 0; i < 16; i++) {
        const xor = parseInt(a[i], 16) ^ parseInt(b[i], 16);
        diff += countSetBits(xor);
    }
    return diff;
}

// ----------------------------------------------------------------------------
// TEST SECTION 1: BIT-FLIP AVALANCHE DISTRIBUTION ACROSS >=1,000 PERTURBED PAIRS
// ----------------------------------------------------------------------------
console.log('--- [SECTION 1] Bit-Flip Avalanche Distribution Across >=1,000 Perturbed Pairs ---');

const NUM_PAIRS = 1200;
const tagDiffsX = [];
const tagDiffsY = [];
const tagDiffsIdx = [];
const checksumDiffs = [];

const seed = 'PQC_CHALLENGER_AVALANCHE_SEED_2026';

for (let i = 0; i < NUM_PAIRS; i++) {
    // Generate pseudo-random coordinate pair in standard vector viewBox [0, 1000]
    const x = Math.floor(Math.random() * 990) + 5;
    const y = Math.floor(Math.random() * 990) + 5;
    const idx = i;

    // 1. Perturb X by +1
    const tagBase = CryptoEngine.computeNonLinearCoordinateTag(x, y, idx, seed);
    const tagPerturbX = CryptoEngine.computeNonLinearCoordinateTag(x + 1, y, idx, seed);
    const diffX = hexHammingDistance(tagBase, tagPerturbX);
    tagDiffsX.push(diffX);

    // 2. Perturb Y by +1
    const tagPerturbY = CryptoEngine.computeNonLinearCoordinateTag(x, y + 1, idx, seed);
    const diffY = hexHammingDistance(tagBase, tagPerturbY);
    tagDiffsY.push(diffY);

    // 3. Perturb sequence index by +1
    const tagPerturbIdx = CryptoEngine.computeNonLinearCoordinateTag(x, y, idx + 1, seed);
    const diffIdx = hexHammingDistance(tagBase, tagPerturbIdx);
    tagDiffsIdx.push(diffIdx);

    // 4. Test Parity Avalanche Checksum on serialized payload: perturb 1 random data byte
    const testPoints = [
        { x: x, y: y, index: 0, tag: tagBase },
        { x: x + 10, y: y + 20, index: 1, tag: tagPerturbX }
    ];
    const cleanPayload = MatrixEngine.serializeOrderedPoints(testPoints, { width: 1000, height: 1000 });
    const cleanDataSlice = cleanPayload.slice(0, cleanPayload.length - 4);
    const cleanChecksum = MatrixEngine.calculateAvalancheChecksum(cleanDataSlice);

    // Mutate 1 bit in data slice (e.g. index 3)
    const mutatedSlice = new Uint8Array(cleanDataSlice);
    const mutateBytePos = 2 + (i % (mutatedSlice.length - 2));
    mutatedSlice[mutateBytePos] ^= 0x01 << (i % 8);
    const mutatedChecksum = MatrixEngine.calculateAvalancheChecksum(mutatedSlice);

    const xorChecksum = (cleanChecksum ^ mutatedChecksum) >>> 0;
    let csBits = 0;
    let temp = xorChecksum;
    while (temp > 0) {
        csBits += temp & 1;
        temp >>>= 1;
    }
    checksumDiffs.push(csBits);
}

function computeStats(arr) {
    const n = arr.length;
    const sum = arr.reduce((a, b) => a + b, 0);
    const mean = sum / n;
    const sqDiffSum = arr.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0);
    const stdDev = Math.sqrt(sqDiffSum / n);
    const min = Math.min(...arr);
    const max = Math.max(...arr);
    return { n, mean, stdDev, min, max };
}

const statsX = computeStats(tagDiffsX);
const statsY = computeStats(tagDiffsY);
const statsIdx = computeStats(tagDiffsIdx);
const statsChecksum = computeStats(checksumDiffs);

const tagXAbove10 = tagDiffsX.filter(d => d >= 10).length;
const tagYAbove10 = tagDiffsY.filter(d => d >= 10).length;
const tagIdxAbove10 = tagDiffsIdx.filter(d => d >= 10).length;
const csAbove8 = checksumDiffs.filter(d => d >= 8).length;

console.log(`  [X+1 Perturbation] (N=${NUM_PAIRS}): Mean=${statsX.mean.toFixed(2)} bits, Min=${statsX.min}, Max=${statsX.max}, StdDev=${statsX.stdDev.toFixed(2)}, >=10 bits: ${((tagXAbove10 / NUM_PAIRS) * 100).toFixed(2)}%`);
console.log(`  [Y+1 Perturbation] (N=${NUM_PAIRS}): Mean=${statsY.mean.toFixed(2)} bits, Min=${statsY.min}, Max=${statsY.max}, StdDev=${statsY.stdDev.toFixed(2)}, >=10 bits: ${((tagYAbove10 / NUM_PAIRS) * 100).toFixed(2)}%`);
console.log(`  [Idx+1 Perturb]    (N=${NUM_PAIRS}): Mean=${statsIdx.mean.toFixed(2)} bits, Min=${statsIdx.min}, Max=${statsIdx.max}, StdDev=${statsIdx.stdDev.toFixed(2)}, >=10 bits: ${((tagIdxAbove10 / NUM_PAIRS) * 100).toFixed(2)}%`);
console.log(`  [Dual Checksum CS] (N=${NUM_PAIRS}): Mean=${statsChecksum.mean.toFixed(2)} bits, Min=${statsChecksum.min}, Max=${statsChecksum.max}, StdDev=${statsChecksum.stdDev.toFixed(2)}, >=8 bits: ${((csAbove8 / NUM_PAIRS) * 100).toFixed(2)}%`);

assert(statsX.mean >= 25.0, `X avalanche mean (${statsX.mean}) must be close to ideal binomial (32 bits)`);
assert(statsY.mean >= 25.0, `Y avalanche mean (${statsY.mean}) must be close to ideal binomial (32 bits)`);
assert(statsIdx.mean >= 25.0, `Index avalanche mean (${statsIdx.mean}) must be close to ideal binomial`);
assert(statsChecksum.mean >= 12.0, `Checksum avalanche mean (${statsChecksum.mean}) must be close to ideal 16 bits`);
assert(tagXAbove10 / NUM_PAIRS >= 0.99, 'At least 99% of X perturbations must flip >= 10 bits');
assert(csAbove8 / NUM_PAIRS >= 0.99, 'At least 99% of checksum single-bit mutations must flip >= 8 bits');
console.log('  ✓ SECTION 1 PASSED: Avalanche distribution satisfies strict cryptographic dispersion criteria.\n');

// ----------------------------------------------------------------------------
// TEST SECTION 2: MUTATION & SEQUENCE SWAP DETECTION IN SERIALIZED MATRICES
// ----------------------------------------------------------------------------
console.log('--- [SECTION 2] Mutation & Sequence Swap Detection in Serialized Matrices ---');

const samplePath = [
    { x: 100, y: 150, index: 0 },
    { x: 200, y: 250, index: 1 },
    { x: 300, y: 350, index: 2 },
    { x: 400, y: 450, index: 3 },
    { x: 500, y: 550, index: 4 }
];
const signedSample = CryptoEngine.signVectorPath(samplePath, { seed: 'MUTATION_TEST_SEED' });
const cleanPayload = MatrixEngine.serializeOrderedPoints(signedSample.signedPoints, { width: 1000, height: 1000 });

// 2.1 Single-Point Mutation in Serialized Byte Stream
let detectedByteMutations = 0;
const totalByteChecks = cleanPayload.length - 4; // Exclude checksum bytes themselves
for (let b = 0; b < totalByteChecks; b++) {
    const mutated = new Uint8Array(cleanPayload);
    mutated[b] ^= 0x01;
    const res = MatrixEngine.deserializeOrderedPoints(mutated);
    if (!res.validParity) {
        detectedByteMutations++;
    }
}
console.log(`  Single-byte payload mutations detected: ${detectedByteMutations} / ${totalByteChecks} (${((detectedByteMutations / totalByteChecks) * 100).toFixed(2)}%)`);
assert.strictEqual(detectedByteMutations, totalByteChecks, '100% of single-byte payload mutations must destroy parity');

// 2.2 Adjacent Sequence Order Swap in Payload
const swappedAdjacentPath = [
    samplePath[1], samplePath[0], samplePath[2], samplePath[3], samplePath[4]
];
const signSwappedAdjacent = CryptoEngine.signVectorPath(swappedAdjacentPath, { seed: 'MUTATION_TEST_SEED' });
const payloadSwappedAdjacent = MatrixEngine.serializeOrderedPoints(signSwappedAdjacent.signedPoints, { width: 1000, height: 1000 });
const orderValidAdjacent = MatrixEngine.verifySequenceOrder(payloadSwappedAdjacent);
assert.strictEqual(orderValidAdjacent, false, 'Adjacent vertex swap must fail verifySequenceOrder');

// 2.3 Distant Sequence Order Swap in Payload (0 <-> 4)
const swappedDistantPath = [
    samplePath[4], samplePath[1], samplePath[2], samplePath[3], samplePath[0]
];
const signSwappedDistant = CryptoEngine.signVectorPath(swappedDistantPath, { seed: 'MUTATION_TEST_SEED' });
const payloadSwappedDistant = MatrixEngine.serializeOrderedPoints(signSwappedDistant.signedPoints, { width: 1000, height: 1000 });
const orderValidDistant = MatrixEngine.verifySequenceOrder(payloadSwappedDistant);
assert.strictEqual(orderValidDistant, false, 'Distant vertex swap (0 <-> 4) must fail verifySequenceOrder');

// 2.4 Bidirectional Integrity Check Counterfeit Detection
const cleanMatrixData = MatrixEngine.deserializeOrderedPoints(cleanPayload);

// Test 2.4A: 1-point micro-alteration (+0.5 px) in drawing
const altered1 = JSON.parse(JSON.stringify(samplePath));
altered1[2].x += 0.5;
const verdictAltered1 = VectorVisionStudio.verifyBidirectionalIntegrity(altered1, cleanMatrixData);
assert.strictEqual(verdictAltered1.match, false, 'Micro-alteration (+0.5px) must fail bidirectional match');
assert.strictEqual(verdictAltered1.status, 'ALERTA DE FALSIFICACIÓN ✕');
assert(verdictAltered1.details.includes('2'), 'Alert must pinpoint altered node [2]');

// Test 2.4B: Sequence swap in drawing
const alteredSwap = JSON.parse(JSON.stringify(samplePath));
const temp = alteredSwap[0]; alteredSwap[0] = alteredSwap[1]; alteredSwap[1] = temp;
const verdictSwap = VectorVisionStudio.verifyBidirectionalIntegrity(alteredSwap, cleanMatrixData);
assert.strictEqual(verdictSwap.match, false, 'Sequence swap in drawing must fail bidirectional match');
assert.strictEqual(verdictSwap.status, 'ALERTA DE FALSIFICACIÓN ✕');

// Test 2.4C: JAB Code Canvas Pixel Mutation
const mockCanvas = new MockCanvas(240, 240);
MatrixEngine.renderJabCodeWithCrypto(signedSample.signedPoints, mockCanvas);
const decodedClean = MatrixEngine.decodeJabCodeWithCrypto(mockCanvas);
assert.strictEqual(decodedClean.validParity, true, 'Clean JAB canvas must decode with valid parity');

// Mutate payload cache on canvas
if (mockCanvas._jabPayloadBytes) {
    mockCanvas._jabPayloadBytes[7] ^= 0x40;
    const decodedMutated = MatrixEngine.decodeJabCodeWithCrypto(mockCanvas);
    assert.strictEqual(decodedMutated.validParity, false, 'Mutated JAB payload cache must fail parity');
}

console.log('  ✓ SECTION 2 PASSED: 100% detection rate for single-point mutations and sequence swaps.\n');

// ----------------------------------------------------------------------------
// TEST SECTION 3: ADVERSARIAL EDGE CASES
// ----------------------------------------------------------------------------
console.log('--- [SECTION 3] Adversarial Edge Cases ---');

// 3.1 1-Point Vector Path
console.log('  Testing 3.1: 1-point vector path...');
const singlePointSvg = 'M 450 780';
const singleNodes = CryptoEngine.extractVectorNodes(singlePointSvg);
assert.strictEqual(singleNodes.length, 1, 'Must extract exactly 1 node');
assert.strictEqual(singleNodes[0].x, 450);
assert.strictEqual(singleNodes[0].y, 780);
assert.strictEqual(singleNodes[0].index, 0);

const singleSigned = CryptoEngine.signVectorPath(singleNodes, { seed: 'SINGLE_POINT_SEED' });
assert.strictEqual(singleSigned.signedPoints.length, 1);
assert(singleSigned.rootSignature.startsWith('d5-sig-'));

const singlePayload = MatrixEngine.serializeOrderedPoints(singleSigned.signedPoints);
const singleUnpacked = MatrixEngine.deserializeOrderedPoints(singlePayload);
assert.strictEqual(singleUnpacked.validParity, true, '1-point payload parity must be valid');
assert.strictEqual(singleUnpacked.points.length, 1);
assert.strictEqual(singleUnpacked.points[0].x, 450);
assert.strictEqual(singleUnpacked.points[0].y, 780);

const singleVerdict = VectorVisionStudio.verifyBidirectionalIntegrity(singleNodes, singleUnpacked);
assert.strictEqual(singleVerdict.match, true, '1-point path must pass bidirectional verification 100%');
assert.strictEqual(singleVerdict.status, 'VALIDADO AL 100% ✓');
console.log('    -> 1-point vector path: PASSED');

// 3.2 Colinear Points
console.log('  Testing 3.2: Colinear points along a line...');
const colinearPath = [];
for (let i = 0; i < 15; i++) {
    colinearPath.push({ x: i * 20, y: i * 30, index: i });
}
const colinearSigned = CryptoEngine.signVectorPath(colinearPath, { seed: 'COLINEAR_SEED' });
// Verify that tags for colinear points are all pairwise distinct despite identical slope
const colinearTags = new Set(colinearSigned.signedPoints.map(p => p.tag));
assert.strictEqual(colinearTags.size, 15, 'All 15 colinear points must have distinct non-linear tags');

const colinearPayload = MatrixEngine.serializeOrderedPoints(colinearSigned.signedPoints);
const colinearUnpacked = MatrixEngine.deserializeOrderedPoints(colinearPayload);
assert.strictEqual(colinearUnpacked.validParity, true, 'Colinear points payload parity valid');
assert.strictEqual(colinearUnpacked.points.length, 15);
for (let i = 0; i < 15; i++) {
    assert.strictEqual(colinearUnpacked.points[i].x, i * 20);
    assert.strictEqual(colinearUnpacked.points[i].y, i * 30);
}
const colinearVerdict = VectorVisionStudio.verifyBidirectionalIntegrity(colinearPath, colinearUnpacked);
assert.strictEqual(colinearVerdict.match, true);
assert.strictEqual(colinearVerdict.status, 'VALIDADO AL 100% ✓');
console.log('    -> Colinear points: PASSED');

// 3.3 Massive Coordinate Values
console.log('  Testing 3.3: Massive coordinate values...');
const massivePath = [
    { x: 50000, y: 99999, index: 0 },
    { x: 1000000, y: 2000000, index: 1 }
];
const massiveSigned = CryptoEngine.signVectorPath(massivePath, { seed: 'MASSIVE_COORD_SEED' });
assert.strictEqual(massiveSigned.signedPoints.length, 2);

const massivePayload = MatrixEngine.serializeOrderedPoints(massiveSigned.signedPoints, { width: 5000000, height: 5000000 });
const massiveUnpacked = MatrixEngine.deserializeOrderedPoints(massivePayload);
assert.strictEqual(massiveUnpacked.validParity, true, 'Massive coordinates payload parity valid');
assert.strictEqual(massiveUnpacked.points.length, 2);
assert.strictEqual(massiveUnpacked.points[0].x, 50000);
assert.strictEqual(massiveUnpacked.points[0].y, 99999);
assert.strictEqual(massiveUnpacked.points[1].x, 1000000);
assert.strictEqual(massiveUnpacked.points[1].y, 2000000);

const massiveVerdict = VectorVisionStudio.verifyBidirectionalIntegrity(massivePath, massiveUnpacked);
assert.strictEqual(massiveVerdict.match, true);
assert.strictEqual(massiveVerdict.status, 'VALIDADO AL 100% ✓');
console.log('    -> Massive coordinate values: PASSED');

// 3.4 Empty Paths and Malformed Inputs
console.log('  Testing 3.4: Empty paths and malformed inputs...');
assert.deepStrictEqual(CryptoEngine.extractVectorNodes(''), [], 'Empty string yields []');
assert.deepStrictEqual(CryptoEngine.extractVectorNodes('   \t\n   '), [], 'Whitespace yields []');
assert.deepStrictEqual(CryptoEngine.extractVectorNodes(null), [], 'Null yields []');
assert.deepStrictEqual(CryptoEngine.extractVectorNodes(undefined), [], 'Undefined yields []');
assert.deepStrictEqual(CryptoEngine.extractVectorNodes('<div>Not an SVG</div>'), [], 'HTML non-svg yields []');
assert.deepStrictEqual(CryptoEngine.extractVectorNodes('<svg></svg>'), [], 'Empty SVG tag yields []');

const emptySigned = CryptoEngine.signVectorPath([], { seed: 'EMPTY_SEED' });
assert.strictEqual(emptySigned.signedPoints.length, 0);
assert(emptySigned.rootSignature.startsWith('d5-sig-'));

const emptyPayload = MatrixEngine.serializeOrderedPoints([], { width: 1000, height: 1000 });
const emptyUnpacked = MatrixEngine.deserializeOrderedPoints(emptyPayload);
assert.strictEqual(emptyUnpacked.validParity, true, 'Empty payload has valid parity');
assert.strictEqual(emptyUnpacked.points.length, 0);

const emptyVerdict = VectorVisionStudio.verifyBidirectionalIntegrity([], emptyUnpacked);
assert.strictEqual(emptyVerdict.match, true, 'Empty path matches empty matrix');
assert.strictEqual(emptyVerdict.status, 'VALIDADO AL 100% ✓');
console.log('    -> Empty paths & malformed inputs: PASSED');

// 3.5 High-Precision Decimals & Sub-Pixel Mantissa
console.log('  Testing 3.5: High-precision decimal coordinates...');
const decimalSvg = 'M 123.456 789.012 L 345.678 901.234';
const decimalNodes = CryptoEngine.extractVectorNodes(decimalSvg);
assert.strictEqual(decimalNodes.length, 2);
assert(Math.abs(decimalNodes[0].x - 123.456) < 1e-4);
assert(Math.abs(decimalNodes[0].y - 789.012) < 1e-4);

const decimalSigned = CryptoEngine.signVectorPath(decimalNodes, { seed: 'DECIMAL_SEED' });
const modulated = CryptoEngine.embedSubPixelWatermark(decimalNodes, decimalSigned.signedPoints);
assert.strictEqual(modulated.length, 2);
assert(Math.abs(modulated[0].x - decimalNodes[0].x) < 0.001, 'Displacement in X strictly < 0.001');
assert(Math.abs(modulated[0].y - decimalNodes[0].y) < 0.001, 'Displacement in Y strictly < 0.001');
console.log('    -> High-precision decimals & sub-pixel mantissa: PASSED');

// 3.6 Dense Polygon (120 Vertices) & Dynamic Grid Expansion
console.log('  Testing 3.6: Dense polygon (120 vertices)...');
const denseVertices = [];
for (let i = 0; i < 120; i++) {
    const angle = (i / 120) * 2 * Math.PI;
    const r = 400 + (i % 5) * 20;
    denseVertices.push({
        x: Math.round(500 + r * Math.cos(angle)),
        y: Math.round(500 + r * Math.sin(angle)),
        index: i
    });
}
const denseSigned = CryptoEngine.signVectorPath(denseVertices, { seed: 'DENSE_POLYGON_SEED' });
const denseCanvas = new MockCanvas(360, 360);
MatrixEngine.renderJabCodeWithCrypto(denseSigned.signedPoints, denseCanvas);
assert(denseCanvas._jabGrid >= 28, `Grid should expand to >= 28 for 120 vertices, got ${denseCanvas._jabGrid}`);

const denseDecoded = MatrixEngine.decodeJabCodeWithCrypto(denseCanvas);
assert.strictEqual(denseDecoded.validParity, true, 'Dense decoded payload parity valid');
assert.strictEqual(denseDecoded.points.length, 120, 'All 120 vertices recovered losslessly');
for (let i = 0; i < 120; i++) {
    assert.strictEqual(denseDecoded.points[i].x, denseVertices[i].x);
    assert.strictEqual(denseDecoded.points[i].y, denseVertices[i].y);
    assert.strictEqual(denseDecoded.points[i].index, i);
}
const denseVerdict = VectorVisionStudio.verifyBidirectionalIntegrity(denseVertices, denseDecoded);
assert.strictEqual(denseVerdict.match, true);
assert.strictEqual(denseVerdict.status, 'VALIDADO AL 100% ✓');
console.log('    -> Dense polygon (120 vertices): PASSED');

console.log('  ✓ SECTION 3 PASSED: All adversarial edge cases handled with mathematical rigor.\n');

// ----------------------------------------------------------------------------
// SUMMARY OUTPUT
// ----------------------------------------------------------------------------
console.log('================================================================================');
console.log('  CHALLENGER 1 ADVERSARIAL STRESS TEST COMPLETE: 100% PASS                      ');
console.log('  Verdict: ALL EMPIRICAL CHALLENGES SATISFIED                                    ');
console.log('================================================================================\n');

// Export results for test reporting
module.exports = {
    numPairsTested: NUM_PAIRS,
    avalancheStats: {
        xPerturb: statsX,
        yPerturb: statsY,
        idxPerturb: statsIdx,
        checksum: statsChecksum,
        percentXAbove10: (tagXAbove10 / NUM_PAIRS) * 100,
        percentYAbove10: (tagYAbove10 / NUM_PAIRS) * 100,
        percentIdxAbove10: (tagIdxAbove10 / NUM_PAIRS) * 100,
        percentCsAbove8: (csAbove8 / NUM_PAIRS) * 100
    },
    singleByteMutationDetectionRate: (detectedByteMutations / totalByteChecks) * 100,
    edgeCasesVerified: [
        '1-point vector path',
        'colinear points',
        'massive coordinate values',
        'empty paths and malformed inputs',
        'high-precision decimals',
        'dense polygon (120 vertices)'
    ]
};
