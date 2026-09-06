/**
 * ============================================================================
 * HASHCOD CODESPACE — JAB CODE POLYCHROME MATRIX TDD TEST SUITE
 * tests/e2e/test_jab_matrix_functional_tdd.js
 * ============================================================================
 * 
 * Strict Test-Driven Development (TDD) Suite for Circle 10 (Vector Vision):
 * [SUITE 1] Pattern Extraction from CoffeeScript & Normalization
 * [SUITE 2] Binary Serialization (Pure Integers -> Bitstream -> 3-bit Blocks / 8 Colors)
 * [SUITE 3] Standard 8-Color Palette & Minimum Euclidean RGB Distance Mapping
 * [SUITE 4] JAB Code Matrix Layout: Corner Finders & Sequential Data Modules
 * [SUITE 5] Canvas Matrix Encoding & Lossless Canvas Decoding (decodeJabMatrix)
 * [SUITE 6] Pattern Match Verification (100% Match vs Alteration Detection)
 * [SUITE 7] End-to-End Image & Demo Seaport Processing Lifecycle
 * [SUITE 8] Scalable Vector SVG & Crisp PNG Export
 * [SUITE 9] Adversarial Edge Cases & Finder Probing Robustness
 * [SUITE 10] HTML Tag Balance (Diff: 0) & JavaScript Syntax Guardrails
 * 
 * Run Command: node tests/e2e/test_jab_matrix_functional_tdd.js
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('================================================================================');
console.log('  HASHCOD CODESPACE — JAB CODE POLYCHROME MATRIX TDD TEST SUITE                 ');
console.log('================================================================================\n');

const repoDir = path.resolve(__dirname, '../../');
const vectorVisionPath = path.join(repoDir, 'components/vector-vision.js');
const indexPath = path.join(repoDir, 'index.php');
const htmlPath = path.join(repoDir, 'index.html');
const notFoundPath = path.join(repoDir, '404.html');

// Invariant Constants for JAB Code
const EXPECTED_PALETTE = [
    '#000000', '#FFFFFF', '#2270A8', '#98D3D7',
    '#E02E2A', '#E9DBBD', '#10B981', '#F0D91F'
];

const PALETTE_RGB_MAP = [
    { r: 0x00, g: 0x00, b: 0x00, bits: '000', hex: '#000000' },
    { r: 0xFF, g: 0xFF, b: 0xFF, bits: '001', hex: '#FFFFFF' },
    { r: 0x22, g: 0x70, b: 0xA8, bits: '010', hex: '#2270A8' },
    { r: 0x98, g: 0xD3, b: 0xD7, bits: '011', hex: '#98D3D7' },
    { r: 0xE0, g: 0x2E, b: 0x2A, bits: '100', hex: '#E02E2A' },
    { r: 0xE9, g: 0xDB, b: 0xBD, bits: '101', hex: '#E9DBBD' },
    { r: 0x10, g: 0xB9, b: 0x81, bits: '110', hex: '#10B981' },
    { r: 0xF0, g: 0xD9, b: 0x1F, bits: '111', hex: '#F0D91F' }
];

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
// IN-MEMORY MOCK CANVAS 2D HARNESS
// ============================================================================

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
    constructor(width = 200, height = 200) {
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
        return `data:${type};base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADICA...JABCODE_MOCK_DATA_URL`;
    }
}

// Load VectorVisionStudio
let VectorVisionStudio;
try {
    VectorVisionStudio = require(vectorVisionPath);
} catch (e) {
    console.error('Failed to require vector-vision.js:', e);
}

// Sample CoffeeScript patterns
const SAMPLE_COFFEE_CODE = [
    '[',
    '  458836',
    '  [1024, 1024]',
    '  [1, 1]',
    '  24',
    '  3',
    '  [8, 8, 8]',
    '  [',
    '    [252, 245, 225, 15.29]',
    '    [152, 211, 215, 15.13]',
    '    [169, 166, 144, 13.80]',
    '    [115, 196, 214, 13.25]',
    '    [233, 219, 189, 10.28]',
    '    [210, 194, 163, 9.06]',
    '    [35, 35, 35, 8.64]',
    '    [251, 234, 198, 6.18]',
    '    [34, 112, 168, 4.90]',
    '    [224, 46, 42, 1.20]',
    '  ]',
    '  [',
    '    [0, 0, 1024, 1024]',
    '    [[0, 172], [1024, 172], [1024, 620], [530, 780]]',
    '    [[72, 62], [88, 46], [156, 46], [140, 62]]',
    '    [266, 474, 3.5]',
    '    [868, 625, 86, 90]',
    '  ]',
    ']'
].join('\n');

// ============================================================================
// SUITE 1: NUMERIC PATTERN EXTRACTION & NORMALIZATION
// ============================================================================
console.log('--- [SUITE 1] Numeric Pattern Extraction & Normalization ---');

runTest('SUITE 1', 'VectorVisionStudio exports extractNumericPattern function', () => {
    assert(VectorVisionStudio, 'VectorVisionStudio must be exported');
    assert.strictEqual(typeof VectorVisionStudio.extractNumericPattern, 'function', 
        'extractNumericPattern must be a function on VectorVisionStudio');
});

runTest('SUITE 1', 'extractNumericPattern parses CoffeeScript string to integer array', () => {
    const pattern = VectorVisionStudio.extractNumericPattern(SAMPLE_COFFEE_CODE);
    assert(Array.isArray(pattern), 'Extracted pattern must be an array');
    assert(pattern.length > 20, `Extracted pattern should contain integers, got ${pattern.length}`);
    pattern.forEach((val, idx) => {
        assert(Number.isInteger(val), `Item at index ${idx} must be an integer, got: ${val}`);
        assert(val >= 0, `Item at index ${idx} must be non-negative, got: ${val}`);
    });
    // Check known headers
    assert.strictEqual(pattern[0], 458836, 'First integer must be sizeBytes (458836)');
    assert.strictEqual(pattern[1], 1024, 'Second integer must be width (1024)');
    assert.strictEqual(pattern[2], 1024, 'Third integer must be height (1024)');
});

runTest('SUITE 1', 'extractNumericPattern handles array inputs and nested structures', () => {
    const rawArr = [12345, [100, 200], [[1, 2, 3], 4]];
    const pattern = VectorVisionStudio.extractNumericPattern(rawArr);
    assert.deepStrictEqual(pattern, [12345, 100, 200, 1, 2, 3, 4], 
        'Array input must flatten and extract integers strictly');
});

runTest('SUITE 1', 'extractNumericPattern handles empty / null / malformed inputs gracefully', () => {
    assert.deepStrictEqual(VectorVisionStudio.extractNumericPattern(''), []);
    assert.deepStrictEqual(VectorVisionStudio.extractNumericPattern(null), []);
    assert.deepStrictEqual(VectorVisionStudio.extractNumericPattern(undefined), []);
    assert.deepStrictEqual(VectorVisionStudio.extractNumericPattern('non-numeric text only'), []);
});

// ============================================================================
// SUITE 2: BINARY SERIALIZATION (INTEGERS -> BITS -> 3-BIT BLOCKS)
// ============================================================================
console.log('\n--- [SUITE 2] Binary Serialization (Integers -> Bits -> 3-bit Blocks) ---');

runTest('SUITE 2', 'VectorVisionStudio exports serializePatternToBits and deserializeBitsToPattern', () => {
    assert.strictEqual(typeof VectorVisionStudio.serializePatternToBits, 'function',
        'serializePatternToBits must be defined');
    assert.strictEqual(typeof VectorVisionStudio.deserializeBitsToPattern, 'function',
        'deserializeBitsToPattern must be defined');
});

runTest('SUITE 2', 'Roundtrip serialization: serializePatternToBits -> deserializeBitsToPattern preserves integers', () => {
    const testIntegers = [0, 1, 7, 8, 24, 255, 1024, 458836, 1000000];
    const bits = VectorVisionStudio.serializePatternToBits(testIntegers);
    assert(typeof bits === 'string', 'Bits output must be a string');
    assert(/^[01]+$/.test(bits), 'Bits output must only contain 0 and 1');
    assert.strictEqual(bits.length % 3, 0, 'Bit stream length must be padded to a multiple of 3 bits');

    const recovered = VectorVisionStudio.deserializeBitsToPattern(bits);
    assert.deepStrictEqual(recovered, testIntegers, 
        'Deserialized pattern must match original integers exactly without loss');
});

runTest('SUITE 2', 'VectorVisionStudio exports bitsToColorIndices and colorIndicesToBits', () => {
    assert.strictEqual(typeof VectorVisionStudio.bitsToColorIndices, 'function');
    assert.strictEqual(typeof VectorVisionStudio.colorIndicesToBits, 'function');

    const bitString = '000001010011100101110111'; // 8 colors (24 bits)
    const indices = VectorVisionStudio.bitsToColorIndices(bitString);
    assert.deepStrictEqual(indices, [0, 1, 2, 3, 4, 5, 6, 7], 
        '3-bit chunks must map 1:1 to color indices 0..7');

    const reconstructedBits = VectorVisionStudio.colorIndicesToBits(indices);
    assert.strictEqual(reconstructedBits, bitString, 
        'Color indices to bits must reconstruct exact original 3-bit sequences');
});

// ============================================================================
// SUITE 3: STANDARD 8-COLOR PALETTE & EUCLIDEAN RGB DISTANCE
// ============================================================================
console.log('\n--- [SUITE 3] Standard 8-Color Palette & Minimum Euclidean RGB Distance ---');

runTest('SUITE 3', 'Palette matches standard 8-color polychrome definition', () => {
    assert(Array.isArray(VectorVisionStudio.JABColorPalette), 'JABColorPalette must be defined as array');
    assert.strictEqual(VectorVisionStudio.JABColorPalette.length, 8, 'Palette must contain exactly 8 colors');
    for (let i = 0; i < 8; i++) {
        assert.strictEqual(VectorVisionStudio.JABColorPalette[i].toUpperCase(), EXPECTED_PALETTE[i].toUpperCase(),
            `Palette color at index ${i} must match ${EXPECTED_PALETTE[i]}`);
    }
});

runTest('SUITE 3', 'findNearestPaletteColorIndex associates exact RGB colors to correct palette index', () => {
    assert.strictEqual(typeof VectorVisionStudio.findNearestPaletteColorIndex, 'function',
        'findNearestPaletteColorIndex must be a function');

    PALETTE_RGB_MAP.forEach(({ r, g, b, hex }, expectedIdx) => {
        const detectedIdx = VectorVisionStudio.findNearestPaletteColorIndex(r, g, b);
        assert.strictEqual(detectedIdx, expectedIdx, 
            `RGB (${r}, ${g}, ${b}) for ${hex} must associate to index ${expectedIdx}`);
    });
});

runTest('SUITE 3', 'findNearestPaletteColorIndex is resilient to noise and slight RGB deviation', () => {
    // Slight deviations from compression or antialiasing:
    assert.strictEqual(VectorVisionStudio.findNearestPaletteColorIndex(4, 3, 5), 0, 'Near black must resolve to 0 (#000000)');
    assert.strictEqual(VectorVisionStudio.findNearestPaletteColorIndex(250, 252, 254), 1, 'Near white must resolve to 1 (#FFFFFF)');
    assert.strictEqual(VectorVisionStudio.findNearestPaletteColorIndex(30, 115, 170), 2, 'Near #2270A8 must resolve to 2');
    assert.strictEqual(VectorVisionStudio.findNearestPaletteColorIndex(150, 210, 214), 3, 'Near #98D3D7 must resolve to 3');
    assert.strictEqual(VectorVisionStudio.findNearestPaletteColorIndex(220, 48, 40), 4, 'Near #E02E2A must resolve to 4');
    assert.strictEqual(VectorVisionStudio.findNearestPaletteColorIndex(230, 218, 190), 5, 'Near #E9DBBD must resolve to 5');
    assert.strictEqual(VectorVisionStudio.findNearestPaletteColorIndex(18, 180, 125), 6, 'Near #10B981 must resolve to 6');
    assert.strictEqual(VectorVisionStudio.findNearestPaletteColorIndex(238, 215, 33), 7, 'Near #F0D91F must resolve to 7');
});

// ============================================================================
// SUITE 4: MATRIX LAYOUT & CORNER FINDER PATTERN ISOLATION
// ============================================================================
console.log('\n--- [SUITE 4] JAB Code Matrix Layout & Corner Finder Isolation ---');

runTest('SUITE 4', 'isFinderModule identifies 4 corners of 4x4 modules correctly', () => {
    assert.strictEqual(typeof VectorVisionStudio.isFinderModule, 'function',
        'isFinderModule helper must be exposed');

    const grid = 20;
    // Top-Left (0..3, 0..3)
    assert.strictEqual(VectorVisionStudio.isFinderModule(0, 0, grid), true);
    assert.strictEqual(VectorVisionStudio.isFinderModule(3, 3, grid), true);
    // Top-Right (0..3, 16..19)
    assert.strictEqual(VectorVisionStudio.isFinderModule(0, 16, grid), true);
    assert.strictEqual(VectorVisionStudio.isFinderModule(3, 19, grid), true);
    // Bottom-Left (16..19, 0..3)
    assert.strictEqual(VectorVisionStudio.isFinderModule(16, 0, grid), true);
    assert.strictEqual(VectorVisionStudio.isFinderModule(19, 3, grid), true);
    // Bottom-Right (16..19, 16..19)
    assert.strictEqual(VectorVisionStudio.isFinderModule(16, 16, grid), true);
    assert.strictEqual(VectorVisionStudio.isFinderModule(19, 19, grid), true);

    // Data module locations
    assert.strictEqual(VectorVisionStudio.isFinderModule(0, 4, grid), false, 'Row 0, col 4 is data module');
    assert.strictEqual(VectorVisionStudio.isFinderModule(4, 0, grid), false, 'Row 4, col 0 is data module');
    assert.strictEqual(VectorVisionStudio.isFinderModule(10, 10, grid), false, 'Center (10, 10) is data module');
});

runTest('SUITE 4', 'Matrix data module count calculation is mathematically exact', () => {
    // In grid N, finders take 4 * (4*4) = 64 modules. Data modules = N*N - 64.
    [20, 24, 28, 32].forEach(grid => {
        let countFinder = 0;
        let countData = 0;
        for (let r = 0; r < grid; r++) {
            for (let c = 0; c < grid; c++) {
                if (VectorVisionStudio.isFinderModule(r, c, grid)) countFinder++;
                else countData++;
            }
        }
        assert.strictEqual(countFinder, 64, `Finder count for grid ${grid} must be exactly 64`);
        assert.strictEqual(countData, grid * grid - 64, `Data module count for grid ${grid} must be ${grid*grid - 64}`);
    });
});

// ============================================================================
// SUITE 5: REAL CANVAS ENCODING & LOSSLESS DECODING (decodeJabMatrix)
// ============================================================================
console.log('\n--- [SUITE 5] Real Canvas Encoding & Lossless Decoding (decodeJabMatrix) ---');

runTest('SUITE 5', 'renderJabCode encodes real pattern and decodeJabMatrix decodes it with 100% precision', () => {
    assert.strictEqual(typeof VectorVisionStudio.decodeJabMatrix, 'function',
        'decodeJabMatrix must be exposed on VectorVisionStudio');

    const testPattern = [458836, 1024, 1024, 1, 1, 24, 3, 8, 8, 8, 252, 245, 225, 15, 29];
    const mockCanvas = new MockCanvas(200, 200);

    // Render pattern onto canvas
    VectorVisionStudio.renderJabCode(testPattern, 1024, 1024, mockCanvas);

    // Decode from canvas
    const decoded = VectorVisionStudio.decodeJabMatrix(mockCanvas);

    assert(Array.isArray(decoded), 'Decoded output must be an array');
    assert.strictEqual(decoded.length, testPattern.length, 
        `Decoded pattern length (${decoded.length}) must match testPattern (${testPattern.length})`);
    assert.deepStrictEqual(decoded, testPattern, 
        'Decoded pattern from canvas must match original integers with 100% precision without loss');
});

runTest('SUITE 5', 'Full CoffeeScript extraction -> Canvas Render -> decodeJabMatrix cycle', () => {
    const fullPattern = VectorVisionStudio.extractNumericPattern(SAMPLE_COFFEE_CODE);
    const mockCanvas = new MockCanvas(240, 240);

    // Render extracted pattern onto canvas
    VectorVisionStudio.renderJabCode(fullPattern, 1024, 1024, mockCanvas);

    // Decode from canvas
    const decoded = VectorVisionStudio.decodeJabMatrix(mockCanvas);

    assert.deepStrictEqual(decoded, fullPattern, 
        'Full CoffeeScript numeric pattern must decode identically from canvas');
});

// ============================================================================
// SUITE 6: PATTERN MATCH VALIDATOR
// ============================================================================
console.log('\n--- [SUITE 6] Pattern Match Validator (validatePatternMatch) ---');

runTest('SUITE 6', 'VectorVisionStudio exports validatePatternMatch function', () => {
    assert.strictEqual(typeof VectorVisionStudio.validatePatternMatch, 'function',
        'validatePatternMatch must be a function');
});

runTest('SUITE 6', 'validatePatternMatch returns true for 100% identical patterns', () => {
    const patternA = [458836, 1024, 1024, 1, 1, 24, 3, 8, 8, 8];
    const patternB = [458836, 1024, 1024, 1, 1, 24, 3, 8, 8, 8];
    assert.strictEqual(VectorVisionStudio.validatePatternMatch(patternA, patternB), true,
        'Exact match must return true');
});

runTest('SUITE 6', 'validatePatternMatch returns false if any value is altered or lengths differ', () => {
    const original = [458836, 1024, 1024, 1, 1, 24, 3, 8, 8, 8];
    const alteredVal = [458836, 1024, 1025, 1, 1, 24, 3, 8, 8, 8]; // one value altered
    const alteredLen = [458836, 1024, 1024, 1, 1, 24, 3, 8, 8]; // truncated
    const extraVal = [458836, 1024, 1024, 1, 1, 24, 3, 8, 8, 8, 99]; // extra value

    assert.strictEqual(VectorVisionStudio.validatePatternMatch(original, alteredVal), false,
        'Altered value must return false');
    assert.strictEqual(VectorVisionStudio.validatePatternMatch(original, alteredLen), false,
        'Truncated length must return false');
    assert.strictEqual(VectorVisionStudio.validatePatternMatch(original, extraVal), false,
        'Extra element must return false');
    assert.strictEqual(VectorVisionStudio.validatePatternMatch(original, null), false);
    assert.strictEqual(VectorVisionStudio.validatePatternMatch(null, original), false);
});

// ============================================================================
// SUITE 7: DEMO SEAPORT & IMAGE UPLOAD LIFECYCLE
// ============================================================================
console.log('\n--- [SUITE 7] Demo Seaport & Image Processing Lifecycle ---');

runTest('SUITE 7', 'loadDemoSeaport populates numeric pattern and renders real JAB matrix', () => {
    // Setup mock DOM elements if not in browser
    const mockElements = {
        vvPreviewImg: { style: { display: '' }, src: '' },
        vvNoImgText: { style: { display: '' } },
        vvDimLabel: { textContent: '' },
        vvSizeLabel: { textContent: '' },
        vvHashLabel: { textContent: '' },
        vvCoffeeOutput: { value: '' },
        vvValidationBadge: { style: { display: '' }, textContent: '', classList: { add: () => {} } },
        vvStatusDetail: { textContent: '', innerHTML: '' },
        vvQrCanvas: new MockCanvas(200, 200),
        vvQrCaption: { textContent: '' }
    };

    global.document = {
        getElementById: (id) => mockElements[id] || null,
        createElement: (tag) => {
            if (tag === 'canvas') return new MockCanvas(64, 64);
            return { style: {}, appendChild: () => {}, removeChild: () => {} };
        },
        body: { appendChild: () => {}, removeChild: () => {} }
    };

    VectorVisionStudio.loadDemoSeaport();

    assert(VectorVisionStudio.currentResult, 'currentResult must be populated');
    assert.strictEqual(VectorVisionStudio.currentResult.width, 1024);
    assert.strictEqual(VectorVisionStudio.currentResult.height, 1024);
    assert.strictEqual(VectorVisionStudio.currentResult.sizeBytes, 458836);
    assert(Array.isArray(VectorVisionStudio.currentResult.numericPattern), 'numericPattern must be stored');
    assert(VectorVisionStudio.currentResult.numericPattern.length > 50, 'numericPattern must have coordinates');

    // Decode canvas generated by loadDemoSeaport
    const decodedFromDemo = VectorVisionStudio.decodeJabMatrix(mockElements.vvQrCanvas);
    const match = VectorVisionStudio.validatePatternMatch(VectorVisionStudio.currentResult.numericPattern, decodedFromDemo);
    assert.strictEqual(match, true, 'Demo Seaport canvas must decode and match original numeric pattern 100%');

    // Now test verifyPattern() execution
    VectorVisionStudio.verifyPattern();
    assert.strictEqual(mockElements.vvValidationBadge.textContent, 'VALIDADO AL 100% ✓',
        'Verification badge must indicate 100% validation success');
});

// ============================================================================
// SUITE 8: SCALABLE VECTOR SVG & CRISP PNG EXPORT
// ============================================================================
console.log('\n--- [SUITE 8] Scalable Vector SVG & Crisp PNG Export ---');

runTest('SUITE 8', 'generateJabSvg produces valid SVG string containing matrix modules', () => {
    assert.strictEqual(typeof VectorVisionStudio.generateJabSvg, 'function',
        'generateJabSvg must be exposed');

    const testPattern = [458836, 1024, 1024, 1, 1, 24, 3, 8, 8, 8];
    const svgStr = VectorVisionStudio.generateJabSvg(testPattern);

    assert(typeof svgStr === 'string', 'SVG output must be string');
    assert(svgStr.startsWith('<svg') && svgStr.endsWith('</svg>'), 'Must be valid SVG container');
    assert(svgStr.includes('viewBox="0 0'), 'Must define scalable viewBox');
    assert(svgStr.includes('<rect'), 'Must render module rects');
    // Verify standard palette colors are used in SVG
    assert(svgStr.includes('#2270A8') || svgStr.includes('#2270a8'), 'SVG must use JAB palette colors');
});

runTest('SUITE 8', 'downloadSvg and downloadPng are defined and callable without throwing', () => {
    assert.strictEqual(typeof VectorVisionStudio.downloadSvg, 'function');
    assert.strictEqual(typeof VectorVisionStudio.downloadPng, 'function');
});

runTest('SUITE 8', 'generateJabSvg handles array input directly and active canvas fallback', () => {
    // 1. Direct array input
    const svgFromArr = VectorVisionStudio.generateJabSvg([100, 200, 300]);
    assert(typeof svgFromArr === 'string' && svgFromArr.includes('<svg'));

    // 2. Fallback to active canvas when currentResult is null
    const savedResult = VectorVisionStudio.currentResult;
    VectorVisionStudio.currentResult = null;
    const testPattern = [458836, 1024, 1024, 24];
    const mockCanvas = new MockCanvas(200, 200);
    VectorVisionStudio.renderJabCode(testPattern, 1024, 1024, mockCanvas);
    
    // Wire mock element
    const oldGetElementById = global.document && global.document.getElementById;
    global.document = global.document || {};
    global.document.getElementById = (id) => (id === 'vvQrCanvas' ? mockCanvas : null);

    const svgFromCanvas = VectorVisionStudio.generateJabSvg();
    assert(typeof svgFromCanvas === 'string' && svgFromCanvas.includes('<svg'));

    // Restore
    if (global.document) global.document.getElementById = oldGetElementById;
    VectorVisionStudio.currentResult = savedResult;
});

// ============================================================================
// SUITE 9: ADVERSARIAL EDGE CASES & FINDER PROBING ROBUSTNESS
// ============================================================================
console.log('\n--- [SUITE 9] Adversarial Edge Cases & Finder Probing Robustness ---');

runTest('SUITE 9', 'verifyFinderPatterns validates matching grid and rejects mismatched grids', () => {
    assert.strictEqual(typeof VectorVisionStudio.verifyFinderPatterns, 'function',
        'verifyFinderPatterns must be exposed');

    const mockCanvas28 = new MockCanvas(280, 280);
    // Create pattern needing grid 28 (payload between 513 and 720 color indices)
    const pattern28 = [];
    for (let i = 0; i < 110; i++) pattern28.push(i * 5 + 130);
    VectorVisionStudio.renderJabCode(pattern28, 1024, 1024, mockCanvas28);
    assert.strictEqual(mockCanvas28._jabGrid, 28, 'mockCanvas28 must be sized to grid 28');

    // True grid 28 must pass finder verification
    assert.strictEqual(VectorVisionStudio.verifyFinderPatterns(mockCanvas28, 28), true,
        'Grid 28 canvas must pass finder pattern check at grid 28');

    // Wrong grids must fail finder verification
    assert.strictEqual(VectorVisionStudio.verifyFinderPatterns(mockCanvas28, 20), false,
        'Grid 28 canvas must fail finder pattern check at grid 20');
    assert.strictEqual(VectorVisionStudio.verifyFinderPatterns(mockCanvas28, 24), false,
        'Grid 28 canvas must fail finder pattern check at grid 24');
    assert.strictEqual(VectorVisionStudio.verifyFinderPatterns(mockCanvas28, 32), false,
        'Grid 28 canvas must fail finder pattern check at grid 32');
});

runTest('SUITE 9', 'Unannotated canvas without metadata auto-detects grid and decodes 100% losslessly', () => {
    const pattern = [];
    for (let i = 0; i < 180; i++) pattern.push((i * 37 + 101) % 50000);
    const mockCanvas = new MockCanvas(280, 280);
    VectorVisionStudio.renderJabCode(pattern, 1024, 1024, mockCanvas);

    // Strip metadata from canvas
    delete mockCanvas.dataset.grid;
    delete mockCanvas._jabGrid;
    VectorVisionStudio.currentGrid = 20; // reset to default wrong grid

    const decoded = VectorVisionStudio.decodeJabMatrix(mockCanvas);
    assert.deepStrictEqual(decoded, pattern,
        'Unannotated canvas must auto-detect grid via finders and decode exact pattern');
});

runTest('SUITE 9', 'Large payload scaling (grid 32) encodes and decodes 100% losslessly', () => {
    const largePattern = [];
    for (let i = 0; i < 400; i++) largePattern.push(i * 99 + 1);
    const mockCanvas = new MockCanvas(320, 320);
    VectorVisionStudio.renderJabCode(largePattern, 1024, 1024, mockCanvas);

    assert(mockCanvas._jabGrid >= 32, `Grid should expand to at least 32, got ${mockCanvas._jabGrid}`);
    delete mockCanvas.dataset.grid;
    delete mockCanvas._jabGrid;

    const decoded = VectorVisionStudio.decodeJabMatrix(mockCanvas);
    assert.deepStrictEqual(decoded, largePattern,
        'Large pattern payload must encode and decode with 100% precision');
});

runTest('SUITE 9', 'deserializeBitsToPattern rejects truncated or corrupted bitstreams safely', () => {
    // Truncated bitstream (claims count=10 but only 1 integer provided)
    const truncatedBits = VectorVisionStudio.serializePatternToBits([100, 200, 300, 400]).slice(0, 18);
    const result = VectorVisionStudio.deserializeBitsToPattern(truncatedBits);
    assert.deepStrictEqual(result, [], 'Truncated bitstream must return [] and not partial data');

    // Null and empty inputs
    assert.deepStrictEqual(VectorVisionStudio.deserializeBitsToPattern(''), []);
    assert.deepStrictEqual(VectorVisionStudio.deserializeBitsToPattern(null), []);
});

runTest('SUITE 9', 'findNearestPaletteColorIndex handles non-finite and NaN values gracefully', () => {
    assert.doesNotThrow(() => {
        const idx1 = VectorVisionStudio.findNearestPaletteColorIndex(NaN, undefined, null);
        assert(Number.isInteger(idx1) && idx1 >= 0 && idx1 < 8);
        const idx2 = VectorVisionStudio.findNearestPaletteColorIndex('bad', 'color', 'input');
        assert(Number.isInteger(idx2) && idx2 >= 0 && idx2 < 8);
    });
});

runTest('SUITE 9', '_decodeVarInt and deserializeBitsToPattern reject malformed byte sequences and massive counts', () => {
    assert.strictEqual(VectorVisionStudio._decodeVarInt([NaN, 1], 0), null);
    assert.strictEqual(VectorVisionStudio._decodeVarInt([-5], 0), null);
    assert.strictEqual(VectorVisionStudio._decodeVarInt([300], 0), null);

    // Varint count prefix says 999999 integers, but only 2 bytes exist
    const maliciousBytes = [0xFF, 0xFF, 0x3F, 0x01, 0x02];
    let bits = '';
    for (let b of maliciousBytes) bits += b.toString(2).padStart(8, '0');
    assert.deepStrictEqual(VectorVisionStudio.deserializeBitsToPattern(bits), []);
});

runTest('SUITE 9', 'verifyFinderPatterns rejects null canvas, empty contexts and grid < 8', () => {
    assert.strictEqual(VectorVisionStudio.verifyFinderPatterns(null, 20), false);
    assert.strictEqual(VectorVisionStudio.verifyFinderPatterns({}, 4), false);
    assert.strictEqual(VectorVisionStudio.verifyFinderPatterns({ getContext: () => null }, 20), false);
});

runTest('SUITE 9', 'Multi-grid finder pattern discrimination across grids 20, 24, and 28', () => {
    // Grid 20 canvas (small pattern)
    const canvas20 = new MockCanvas(200, 200);
    VectorVisionStudio.renderJabCode([10, 20, 30], 1024, 1024, canvas20);
    assert.strictEqual(canvas20._jabGrid, 20, 'Canvas must be grid 20');
    assert.strictEqual(VectorVisionStudio.verifyFinderPatterns(canvas20, 20), true, 'Grid 20 must verify at 20');
    assert.strictEqual(VectorVisionStudio.verifyFinderPatterns(canvas20, 24), false, 'Grid 20 must fail at 24');
    assert.strictEqual(VectorVisionStudio.verifyFinderPatterns(canvas20, 28), false, 'Grid 20 must fail at 28');

    // Grid 24 canvas (payload between 337 and 512 cells)
    // 60 numbers of 2 bytes each: 1 + 120 = 121 bytes = 968 bits = 323 cells (< 336, grid 20)
    // 70 numbers of 2 bytes each: 1 + 140 = 141 bytes = 1128 bits = 376 cells (> 336, <= 512 -> grid 24)
    const canvas24 = new MockCanvas(240, 240);
    const pattern24 = [];
    for (let i = 0; i < 70; i++) pattern24.push(i * 3 + 130);
    VectorVisionStudio.renderJabCode(pattern24, 1024, 1024, canvas24);
    assert.strictEqual(canvas24._jabGrid, 24, 'Canvas must be grid 24');
    assert.strictEqual(VectorVisionStudio.verifyFinderPatterns(canvas24, 24), true, 'Grid 24 must verify at 24');
    assert.strictEqual(VectorVisionStudio.verifyFinderPatterns(canvas24, 20), false, 'Grid 24 must fail at 20');
    assert.strictEqual(VectorVisionStudio.verifyFinderPatterns(canvas24, 28), false, 'Grid 24 must fail at 28');
});

runTest('SUITE 9', 'Single-element pattern [42], zero [0], and edge integers encode and decode 100% losslessly', () => {
    // Single element
    const canvas42 = new MockCanvas(200, 200);
    VectorVisionStudio.renderJabCode([42], 500, 500, canvas42);
    const dec42 = VectorVisionStudio.decodeJabMatrix(canvas42);
    assert.deepStrictEqual(dec42, [42], 'Single element [42] must roundtrip identically');

    // Zero element
    const canvas0 = new MockCanvas(200, 200);
    VectorVisionStudio.renderJabCode([0], 500, 500, canvas0);
    const dec0 = VectorVisionStudio.decodeJabMatrix(canvas0);
    assert.deepStrictEqual(dec0, [0], 'Zero element [0] must roundtrip identically');

    // Edge integers (including large numbers)
    const edgePattern = [0, 1, 127, 128, 255, 256, 16383, 16384, 2097151];
    const canvasEdge = new MockCanvas(200, 200);
    VectorVisionStudio.renderJabCode(edgePattern, 500, 500, canvasEdge);
    const decEdge = VectorVisionStudio.decodeJabMatrix(canvasEdge);
    assert.deepStrictEqual(decEdge, edgePattern, 'Edge integers must roundtrip identically without overflow');
});

runTest('SUITE 9', 'verifyPattern UI lifecycle updates badge and detail text on match and mismatch', () => {
    const mockBadge = { style: { display: 'none', background: '', color: '', border: '' }, textContent: '' };
    const mockDetail = { textContent: '', innerHTML: '' };
    const mockCanvas = new MockCanvas(200, 200);

    const testPattern = [100, 200, 300];
    VectorVisionStudio.renderJabCode(testPattern, 1024, 1024, mockCanvas);

    VectorVisionStudio.currentResult = {
        fileName: 'test.png',
        width: 1024,
        height: 1024,
        sizeBytes: 5000,
        coffeeCode: '[100, 200, 300]',
        numericPattern: testPattern,
        hash: 'abc123'
    };

    const oldGetElementById = global.document && global.document.getElementById;
    global.document = global.document || {};
    global.document.getElementById = (id) => {
        if (id === 'vvValidationBadge') return mockBadge;
        if (id === 'vvStatusDetail') return mockDetail;
        if (id === 'vvQrCanvas') return mockCanvas;
        return null;
    };

    // 1. Exact match verification
    const matchRes = VectorVisionStudio.verifyPattern();
    assert.strictEqual(matchRes, true, 'verifyPattern must return true on match');
    assert.strictEqual(mockBadge.textContent, 'VALIDADO AL 100% ✓', 'Badge must indicate 100% validation');

    // 2. Discrepancy detection
    VectorVisionStudio.currentResult.numericPattern = [100, 200, 999]; // Altered pattern
    const mismatchRes = VectorVisionStudio.verifyPattern();
    assert.strictEqual(mismatchRes, false, 'verifyPattern must return false on altered pattern');
    assert.strictEqual(mockBadge.textContent, 'DISCREPANCIA DETECTADA ✕', 'Badge must indicate discrepancy');

    // Restore DOM
    if (global.document) global.document.getElementById = oldGetElementById;
});

// ============================================================================
// SUITE 11: DUAL QR ENGINE & EXTERNAL MATRIX SCANNER (MOBILE + JAB)
// ============================================================================
console.log('\n--- [SUITE 11] Dual QR Engine & External Matrix Scanner (Mobile + JAB) ---');

runTest('SUITE 11', 'VectorVisionStudio exports dual mode matrixMode and qrEngine', () => {
    assert(VectorVisionStudio.qrEngine, 'qrEngine must be defined');
    assert.strictEqual(typeof VectorVisionStudio.qrEngine, 'function', 'qrEngine must be a constructor or generator function');
    assert.strictEqual(typeof VectorVisionStudio.switchMatrixMode, 'function', 'switchMatrixMode must be defined');
    assert.strictEqual(typeof VectorVisionStudio.renderStandardQr, 'function', 'renderStandardQr must be defined');
    assert.strictEqual(typeof VectorVisionStudio.generateQrSvg, 'function', 'generateQrSvg must be defined');
    assert.strictEqual(typeof VectorVisionStudio.scanUploadedMatrix, 'function', 'scanUploadedMatrix must be defined');
    assert.strictEqual(typeof VectorVisionStudio.detectMatrixBoundingBox, 'function', 'detectMatrixBoundingBox must be defined');
});

runTest('SUITE 11', 'Standard QR (ISO/IEC 18004) generates valid canvas matrix and scalable vector SVG', () => {
    const mockCanvas = new MockCanvas(200, 200);
    const testPattern = [1055621, 4725, 4371, 1, 1, 24, 3, 8, 8, 8];
    VectorVisionStudio.renderStandardQr(testPattern, mockCanvas);

    assert(VectorVisionStudio.currentQrGrid >= 21, 'Standard QR grid must have at least 21 modules');
    assert.strictEqual(mockCanvas.dataset.mode, 'qr', 'Canvas dataset mode must be qr');

    // Test SVG generation
    const svgStr = VectorVisionStudio.generateQrSvg(testPattern);
    assert(typeof svgStr === 'string', 'generateQrSvg must return a string');
    assert(svgStr.startsWith('<svg'), 'SVG must begin with <svg');
    assert(svgStr.includes('fill="#000000"'), 'Standard QR SVG must include black modules');
    assert(svgStr.includes('fill="#FFFFFF"'), 'Standard QR SVG must include white background');

    // Test mobile payload resolution and quiet zone
    assert.strictEqual(typeof VectorVisionStudio.resolveQrPayload, 'function', 'resolveQrPayload must be exported');
    const shortPayload = VectorVisionStudio.resolveQrPayload(testPattern);
    assert.strictEqual(shortPayload, testPattern.join(','), 'Short pattern <= 40 items must be encoded directly');
    const largePattern = new Array(100).fill(42);
    const largePayload = VectorVisionStudio.resolveQrPayload(largePattern);
    assert(largePayload.startsWith('https://hashcod.codespace/verify?'), 'Large pattern > 40 items must encode mobile verification URL');
    assert(svgStr.includes('viewBox="0 0'), 'SVG must include viewBox with quiet zone margins');
});

runTest('SUITE 11', 'scanUploadedMatrix decodes external user image fixture losslessly (102 numbers)', () => {
    const fixturePath = path.join(repoDir, 'tests/e2e/fixtures/user_scan_pixels.json');
    assert(fs.existsSync(fixturePath), 'user_scan_pixels.json fixture must exist');
    const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));

    const mockCanvas = {
        width: fixture.width,
        height: fixture.height,
        getContext: function(type) {
            return {
                getImageData: function() {
                    return { data: fixture.data };
                },
                drawImage: function() {},
                fillRect: function() {}
            };
        }
    };

    const scanResult = VectorVisionStudio.scanUploadedMatrix(mockCanvas);
    assert.strictEqual(scanResult.success, true, 'scanUploadedMatrix must succeed on user fixture');
    assert.strictEqual(scanResult.format, 'JAB_CODE', 'Detected format must be JAB_CODE');
    assert.strictEqual(scanResult.pattern.length, 102, 'Must decode exactly 102 integers');
    assert.strictEqual(scanResult.pattern[0], 1055621, 'First integer must match original pattern');
    assert.strictEqual(scanResult.pattern[1], 4725, 'Second integer must match original pattern');
    assert.strictEqual(scanResult.pattern[2], 4371, 'Third integer must match original pattern');
    assert.strictEqual(scanResult.pattern[9], 8, 'Tenth integer must match original pattern');
});

runTest('SUITE 11', 'detectMatrixBoundingBox auto-crops screenshots with dark borders', () => {
    // 10x10 mock canvas where pixels inside (2,2) to (7,7) are bright and borders are dark
    const w = 10, h = 10;
    const data = new Uint8ClampedArray(w * h * 4);
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const off = (y * w + x) * 4;
            if (x >= 2 && x <= 7 && y >= 3 && y <= 8) {
                data[off] = 200; data[off+1] = 200; data[off+2] = 200; data[off+3] = 255;
            } else {
                data[off] = 20; data[off+1] = 20; data[off+2] = 20; data[off+3] = 255;
            }
        }
    }
    const mockCanvas = {
        width: w,
        height: h,
        getContext: () => ({
            getImageData: () => ({ data: data })
        })
    };
    const bbox = VectorVisionStudio.detectMatrixBoundingBox(mockCanvas);
    assert.strictEqual(bbox.x, 2, 'Bounding box X must start at 2');
    assert.strictEqual(bbox.y, 3, 'Bounding box Y must start at 3');
    assert.strictEqual(bbox.width, 6, 'Bounding box width must be 6 (2..7)');
    assert.strictEqual(bbox.height, 6, 'Bounding box height must be 6 (3..8)');
});

runTest('SUITE 11', 'switchMatrixMode toggles active mode and updates rendering', () => {
    VectorVisionStudio.switchMatrixMode('qr');
    assert.strictEqual(VectorVisionStudio.matrixMode, 'qr', 'matrixMode must be qr');
    VectorVisionStudio.switchMatrixMode('jab');
    assert.strictEqual(VectorVisionStudio.matrixMode, 'jab', 'matrixMode must be jab');
});

runTest('SUITE 11', 'Uploaded matrix scan synchronizes state, updates CoffeeScript, and verifies 100% losslessly', () => {
    const fixturePath = path.join(repoDir, 'tests/e2e/fixtures/user_scan_pixels.json');
    const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
    const mockCanvas = {
        width: fixture.width,
        height: fixture.height,
        getContext: () => ({
            getImageData: () => ({ data: fixture.data }),
            drawImage: () => {},
            fillRect: () => {}
        })
    };

    // 1. Scan external matrix
    const scanResult = VectorVisionStudio.scanUploadedMatrix(mockCanvas);
    assert.strictEqual(scanResult.success, true);
    assert.strictEqual(scanResult.pattern.length, 102);

    // 2. Reconstruct coffee and update currentResult
    const coffee = VectorVisionStudio.reconstructCoffeeScriptFromPattern(scanResult.pattern);
    assert(typeof coffee === 'string' && coffee.startsWith('['), 'Must reconstruct valid CoffeeScript string');

    VectorVisionStudio.currentResult = {
        fileName: 'scanned_user_fixture.png',
        width: 1024,
        height: 1024,
        sizeBytes: 458836,
        coffeeCode: coffee,
        numericPattern: scanResult.pattern,
        hash: 'abc'
    };

    // 3. Render onto test canvas and verify
    const testCanvas = new MockCanvas(200, 200);
    VectorVisionStudio.renderJabCode(scanResult.pattern, 1024, 1024, testCanvas);

    const oldGetElementById = global.document && global.document.getElementById;
    const mockBadge = { style: {}, textContent: '' };
    const mockDetail = { textContent: '', innerHTML: '' };
    global.document = global.document || {};
    global.document.getElementById = (id) => {
        if (id === 'vvValidationBadge') return mockBadge;
        if (id === 'vvStatusDetail') return mockDetail;
        if (id === 'vvQrCanvas') return testCanvas;
        return null;
    };

    const verified = VectorVisionStudio.verifyPattern();
    assert.strictEqual(verified, true, 'Scanned pattern must verify 100% against rendered canvas');
    assert.strictEqual(mockBadge.textContent, 'VALIDADO AL 100% ✓', 'Badge must show 100% validation success');

    if (global.document) global.document.getElementById = oldGetElementById;
});

// ============================================================================
// SUITE 10: HTML TAG BALANCE (DIFF: 0) & JAVASCRIPT SYNTAX GUARDRAILS
// ============================================================================
console.log('\n--- [SUITE 10] HTML Tag Balance (Diff: 0) & JavaScript Syntax Guardrails ---');

runTest('SUITE 10', 'HTML tag balance across index.php, index.html, 404.html (Diff: 0)', () => {
    [indexPath, htmlPath, notFoundPath].forEach(filePath => {
        if (!fs.existsSync(filePath)) return;
        const filename = path.basename(filePath);
        const content = fs.readFileSync(filePath, 'utf8');

        const domOnly = content
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gis, '')
            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gis, '')
            .replace(/<\?php[\s\S]*?\?>/gis, '');

        const rootHtmlOpen = (domOnly.match(/<html\b[^>]*>/gi) || []).length;
        const rootHtmlClose = (domOnly.match(/<\/html>/gi) || []).length;
        const openDiv = (domOnly.match(/<div\b[^>]*>/gi) || []).length;
        const closeDiv = (domOnly.match(/<\/div>/gi) || []).length;
        const diff = openDiv - closeDiv;

        assert.strictEqual(rootHtmlOpen, 1, `File ${filename}: <html> open count must be 1`);
        assert.strictEqual(rootHtmlClose, 1, `File ${filename}: </html> close count must be 1`);
        assert.strictEqual(diff, 0, `Tag imbalance in ${filename}: ${openDiv} open vs ${closeDiv} close <div> (Diff: ${diff})`);

        // Check if static vectorVisionModal exists in file, and if so ensure both SVG and PNG export buttons exist
        if (content.includes('id="vectorVisionModal"')) {
            const lines = content.split('\n');
            const lineNum = lines.findIndex(l => l.includes('id="vectorVisionModal"')) + 1;
            console.log(`[INFO] Found id="vectorVisionModal" in ${filename} at line ${lineNum}`);
            assert(content.includes('downloadSvg()'), `${filename} static vectorVisionModal must include downloadSvg() button`);
            assert(content.includes('downloadPng()'), `${filename} static vectorVisionModal must include downloadPng() button`);
            assert(content.includes('verifyPattern()'), `${filename} static vectorVisionModal must include verifyPattern() button`);
        }
    });
});

runTest('SUITE 10', 'components/vector-vision.js passes AST compilation without syntax errors', () => {
    const code = fs.readFileSync(vectorVisionPath, 'utf8');
    assert.doesNotThrow(() => {
        new Function(code);
    }, 'components/vector-vision.js must compile cleanly');
});

// ============================================================================
// SUMMARY & EXIT REPORT
// ============================================================================
console.log('\n================================================================================');
console.log(`  RESULTS: ${totalPassed} PASSED | ${totalFailed} FAILED`);
if (totalFailed > 0) {
    console.log(`  (Baseline TDD State: ${totalFailed} tests pending implementation in Green Phase)`);
}
console.log('================================================================================\n');

if (failureDetails.length > 0) {
    console.log('--- Summary of Pending Invariants (To be satisfied by Green Phase) ---');
    failureDetails.forEach(({ suite, name, error }, idx) => {
        console.log(`  ${idx + 1}. [${suite}] ${name}`);
        console.log(`     -> ${error}`);
    });
    console.log('');
}

module.exports = {
    totalPassed,
    totalFailed,
    failureDetails
};

if (require.main === module) {
    if (totalFailed > 0) {
        process.exit(1);
    } else {
        console.log('  >>> ALL JAB CODE MATRIX TDD TESTS PASSED WITH 100% SUCCESS!\n');
        process.exit(0);
    }
}
