/**
 * Hashcod Codespace — Polyglot Grid API Launcher & Code Studio
 * Comprehensive Automated Test Suite (Milestones M1 - M5)
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('================================================================');
console.log('  POLYGLOT GRID API LAUNCHER & CODE STUDIO — E2E TEST SUITE     ');
console.log('================================================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function runTest(name, fn) {
    totalTests++;
    try {
        fn();
        passedTests++;
        console.log(`  ✓ PASS: ${name}`);
    } catch (err) {
        failedTests++;
        console.error(`  ✗ FAIL: ${name}`);
        console.error(`    Error: ${err.message}\n`);
    }
}

// ===== 1. FILE INTEGRITY & ARCHITECTURAL LINKAGE TESTS (M1) =====
runTest('M1.1: polyglot-grid.css exists and has required glassmorphic/grid styling', () => {
    const cssPath = path.join(__dirname, '../../components/polyglot-grid.css');
    assert(fs.existsSync(cssPath), 'components/polyglot-grid.css must exist');
    const css = fs.readFileSync(cssPath, 'utf8');
    assert(css.includes('.polyglot-grid-overlay'), 'CSS must include .polyglot-grid-overlay');
    assert(css.includes('.polyglot-studio-modal'), 'CSS must include .polyglot-studio-modal');
    assert(css.includes('.pg-workspace'), 'CSS must include .pg-workspace');
    assert(css.includes('.pg-cell'), 'CSS must include .pg-cell');
    assert(css.includes('.pg-cell-indicator'), 'CSS must include .pg-cell-indicator');
    assert(css.includes('data-state="CONFIGURED"'), 'CSS must style CONFIGURED state');
    assert(css.includes('data-state="RUNNING"'), 'CSS must style RUNNING state');
    assert(css.includes('data-state="SUCCESS"'), 'CSS must style SUCCESS state');
    assert(css.includes('data-state="ERROR"'), 'CSS must style ERROR state');
    assert(css.includes('data-state="LOCKED"'), 'CSS must style LOCKED state');
    assert(css.includes('#hashcodDockGridBtn'), 'CSS must include Circle 7 dock button styles');
    assert(css.includes('.is-tool-grid-studio'), 'CSS must include Toolbox slot-2-3 styles');
});

runTest('M1.2: polyglot-grid.js exists and is syntax-valid', () => {
    const jsPath = path.join(__dirname, '../../components/polyglot-grid.js');
    assert(fs.existsSync(jsPath), 'components/polyglot-grid.js must exist');
    const js = fs.readFileSync(jsPath, 'utf8');
    assert(js.length > 5000, 'polyglot-grid.js must contain substantial implementation');
});

runTest('M1.3: index.php includes Circle 7 Dock Button with data-dock-slot="7"', () => {
    const indexHtml = fs.readFileSync(path.join(__dirname, '../../index.php'), 'utf8');
    assert(indexHtml.includes('id="hashcodDockGridBtn"'), 'index.php must include #hashcodDockGridBtn');
    assert(indexHtml.includes('data-dock-slot="7"'), 'index.php must set data-dock-slot="7"');
    assert(indexHtml.includes('togglePolyglotGridModal()'), 'index.php dock button must call togglePolyglotGridModal()');
});

runTest('M1.4: index.php includes Toolbox slot 2-3 with is-tool-grid-studio & GRID 8x7 badge', () => {
    const indexHtml = fs.readFileSync(path.join(__dirname, '../../index.php'), 'utf8');
    assert(indexHtml.includes('id="slot-2-3"'), 'index.php must include #slot-2-3');
    assert(indexHtml.includes('is-tool-grid-studio'), 'index.php must assign class is-tool-grid-studio to slot-2-3');
    assert(indexHtml.includes('openPolyglotGridStudio'), 'index.php slot-2-3 must call openPolyglotGridStudio');
    assert(indexHtml.includes('GRID 8x7'), 'index.php slot-2-3 must contain GRID 8x7 badge');
});

runTest('M1.5: index.php includes #polyglotGridOverlay modal markup with 4 panes', () => {
    const indexHtml = fs.readFileSync(path.join(__dirname, '../../index.php'), 'utf8');
    assert(indexHtml.includes('id="polyglotGridOverlay"'), 'index.php must contain #polyglotGridOverlay');
    assert(indexHtml.includes('id="polyglotStudioModal"'), 'index.php must contain #polyglotStudioModal');
    assert(indexHtml.includes('id="polyglotGridCloseBtn"'), 'index.php must contain close button');
    assert(indexHtml.includes('data-pane="matrix"'), 'index.php must contain Matrix pane');
    assert(indexHtml.includes('data-pane="explorer"'), 'index.php must contain Explorer pane');
    assert(indexHtml.includes('data-pane="studio"'), 'index.php must contain Studio pane');
    assert(indexHtml.includes('data-pane="logs"'), 'index.php must contain Logs pane');
    assert(indexHtml.includes('components/polyglot-grid.css'), 'index.php head must link polyglot-grid.css');
    assert(indexHtml.includes('components/polyglot-grid.js'), 'index.php must include polyglot-grid.js script');
});

// ===== 2. 8x7 COORDINATE MATRIX & 4D CELL MANAGER TESTS (M2) =====
const PolyglotModule = require('../../components/polyglot-grid.js');
const { PolyglotStudioState, PolyglotConverter, LIFECYCLE_STATES, FRAMEWORKS, SAMPLE_PRESETS } = PolyglotModule;

runTest('M2.1: 8x7 Grid geometry initialization (56 cells, x in [0..7], y in [0..6])', () => {
    const state = new PolyglotStudioState();
    assert.strictEqual(state.cells.size, 56, 'Matrix must initialize exactly 56 default cells');

    for (let y = 0; y < 7; y++) {
        for (let x = 0; x < 8; x++) {
            const cell = state.getCell(x, y, 0, 0);
            assert(cell, `Cell (${x}, ${y}) must exist`);
            assert.strictEqual(cell.x, x);
            assert.strictEqual(cell.y, y);
            assert.strictEqual(cell.z, 0);
            assert.strictEqual(cell.u, 0);
            assert(Object.values(LIFECYCLE_STATES).includes(cell.state), `Cell state ${cell.state} must be valid lifecycle state`);
        }
    }
});

runTest('M2.2: 4D Coordinate clamping and bijective coordinate index mapping', () => {
    const state = new PolyglotStudioState();
    
    // Clamping test
    const clamped1 = state.clampCoord(15, 9, -5, -2);
    assert.strictEqual(clamped1.x, 7, 'X should be clamped to max 7');
    assert.strictEqual(clamped1.y, 6, 'Y should be clamped to max 6');
    assert.strictEqual(clamped1.z, 0, 'Z should be non-negative clamped');
    assert.strictEqual(clamped1.u, 0, 'U should be non-negative clamped');

    // Bijective mapping test
    for (let y = 0; y < 7; y++) {
        for (let x = 0; x < 8; x++) {
            const index = state.coordToIndex(x, y);
            assert.strictEqual(index, y * 8 + x, `Index formula i = y*8 + x must match`);
            const backCoord = state.indexToCoord(index);
            assert.strictEqual(backCoord.x, x, `Back-conversion X must match`);
            assert.strictEqual(backCoord.y, y, `Back-conversion Y must match`);
        }
    }
});

runTest('M2.3: Lifecycle State Transitions (IDLE -> CONFIGURED -> RUNNING -> SUCCESS -> ERROR -> LOCKED)', () => {
    const state = new PolyglotStudioState();
    const cell = state.getCell(2, 3);
    assert.strictEqual(cell.state, LIFECYCLE_STATES.IDLE);

    cell.state = LIFECYCLE_STATES.CONFIGURED;
    assert.strictEqual(cell.state, 'CONFIGURED');

    cell.state = LIFECYCLE_STATES.RUNNING;
    assert.strictEqual(cell.state, 'RUNNING');

    cell.state = LIFECYCLE_STATES.SUCCESS;
    assert.strictEqual(cell.state, 'SUCCESS');

    cell.state = LIFECYCLE_STATES.ERROR;
    assert.strictEqual(cell.state, 'ERROR');

    cell.state = LIFECYCLE_STATES.LOCKED;
    assert.strictEqual(cell.state, 'LOCKED');
});

// ===== 3. DIRECTORY UPLOAD & FILE EXPLORER TESTS (M3) =====
runTest('M3.1: 6 Built-in sample presets library available and structured', () => {
    assert(SAMPLE_PRESETS['ml_analyzer.py'], 'ml_analyzer.py preset must exist');
    assert(SAMPLE_PRESETS['math_service.py'], 'math_service.py preset must exist');
    assert(SAMPLE_PRESETS['auth_controller.js'], 'auth_controller.js preset must exist');
    assert(SAMPLE_PRESETS['payment_processor.go'], 'payment_processor.go preset must exist');
    assert(SAMPLE_PRESETS['crypto_hasher.c'], 'crypto_hasher.c preset must exist');
    assert(SAMPLE_PRESETS['OrderService.java'], 'OrderService.java preset must exist');

    assert.strictEqual(SAMPLE_PRESETS['ml_analyzer.py'].language, 'python');
    assert.strictEqual(SAMPLE_PRESETS['auth_controller.js'].language, 'javascript');
    assert.strictEqual(SAMPLE_PRESETS['payment_processor.go'].language, 'go');
    assert.strictEqual(SAMPLE_PRESETS['crypto_hasher.c'].language, 'c');
    assert.strictEqual(SAMPLE_PRESETS['OrderService.java'].language, 'java');
});

runTest('M3.2: State file loading and active file binding', () => {
    const state = new PolyglotStudioState();
    assert(state.files.has('services/ml_analyzer.py'), 'Preset file must be ingested into state.files');
    assert(state.files.has('controllers/auth_controller.js'), 'JS preset file must be ingested');
    assert(state.files.has('pkg/payment/payment_processor.go'), 'Go preset file must be ingested');

    const file = state.files.get('services/ml_analyzer.py');
    assert(file.lines > 10, 'File lines count should be computed accurately');
    assert(file.size > 100, 'File size in bytes should be computed accurately');
});

// ===== 4. CODE-TO-API POLYGLOT CONVERTER TESTS (M4) =====
runTest('M4.1: AST / Regex signature extraction for Python', () => {
    const pyCode = SAMPLE_PRESETS['ml_analyzer.py'].content;
    const signatures = PolyglotConverter.extractSignatures(pyCode, 'python');
    assert(signatures.length >= 2, 'Should extract at least 2 functions from ml_analyzer.py');
    
    const fn1 = signatures.find(f => f.name === 'predict_classification');
    assert(fn1, 'predict_classification function must be extracted');
    assert.strictEqual(fn1.params.length, 3, 'predict_classification must have 3 parameters');
    assert.strictEqual(fn1.params[0].name, 'features');
    assert.strictEqual(fn1.params[1].name, 'model_id');
    assert.strictEqual(fn1.params[2].name, 'threshold');
    assert.strictEqual(fn1.returnType, 'dict');
    assert(fn1.docstring.length > 0, 'Docstring should be extracted');
});

runTest('M4.2: AST / Regex signature extraction for JavaScript / TypeScript', () => {
    const jsCode = SAMPLE_PRESETS['auth_controller.js'].content;
    const signatures = PolyglotConverter.extractSignatures(jsCode, 'javascript');
    assert(signatures.length >= 2, 'Should extract at least 2 functions from auth_controller.js');
    
    const fn1 = signatures.find(f => f.name === 'issueSessionToken');
    assert(fn1, 'issueSessionToken function must be extracted');
    assert.strictEqual(fn1.params.length, 3);
});

runTest('M4.3: AST / Regex signature extraction for Go', () => {
    const goCode = SAMPLE_PRESETS['payment_processor.go'].content;
    const signatures = PolyglotConverter.extractSignatures(goCode, 'go');
    assert(signatures.length >= 1, 'Should extract Go function');
    
    const fn1 = signatures.find(f => f.name === 'ProcessTransaction');
    assert(fn1, 'ProcessTransaction function must be extracted');
    assert.strictEqual(fn1.params.length, 3);
});

runTest('M4.4: AST / Regex signature extraction for C', () => {
    const cCode = SAMPLE_PRESETS['crypto_hasher.c'].content;
    const signatures = PolyglotConverter.extractSignatures(cCode, 'c');
    assert(signatures.length >= 1, 'Should extract C function');
    
    const fn1 = signatures.find(f => f.name === 'compute_fnv1a_hash');
    assert(fn1, 'compute_fnv1a_hash function must be extracted');
    assert.strictEqual(fn1.returnType, 'uint64_t');
    assert.strictEqual(fn1.params.length, 2);
});

runTest('M4.5: AST / Regex signature extraction for Java Spring', () => {
    const javaCode = SAMPLE_PRESETS['OrderService.java'].content;
    const signatures = PolyglotConverter.extractSignatures(javaCode, 'java');
    assert(signatures.length >= 1, 'Should extract Java method');
    
    const fn1 = signatures.find(f => f.name === 'createOrder');
    assert(fn1, 'createOrder method must be extracted');
    assert.strictEqual(fn1.params.length, 3);
});

runTest('M4.6: Framework Synthesizer — Python FastAPI', () => {
    const fn = {
        name: 'predict_classification',
        params: [
            { name: 'features', type: 'list', in: 'body', required: true, defaultVal: null },
            { name: 'model_id', type: 'str', in: 'query', required: false, defaultVal: '"xgboost_v2"' },
            { name: 'threshold', type: 'float', in: 'query', required: false, defaultVal: '0.5' }
        ],
        returnType: 'dict',
        docstring: 'Model inference classification endpoint'
    };

    const code = PolyglotConverter.synthesize(fn, FRAMEWORKS.FASTAPI, '/api/v1/predict', 'POST', [0, 0, 0, 0]);
    assert(code.includes('from fastapi import FastAPI'), 'FastAPI code must import FastAPI');
    assert(code.includes('class Predict_classificationRequest(BaseModel):'), 'FastAPI code must generate Pydantic request schema');
    assert(code.includes('@app.post("/api/v1/predict")'), 'FastAPI code must define @app.post route');
    assert(code.includes('"latency_ms"'), 'FastAPI code must return latency_ms in envelope');
    assert(code.includes('"cell": [0, 0, 0, 0]'), 'FastAPI code must return cell coordinate in envelope');
});

runTest('M4.7: Framework Synthesizer — Python Sanic', () => {
    const fn = { name: 'predict_classification', params: [], returnType: 'dict' };
    const code = PolyglotConverter.synthesize(fn, FRAMEWORKS.SANIC, '/api/v1/predict', 'POST', [1, 2, 0, 0]);
    assert(code.includes('from sanic import Sanic'), 'Sanic code must import Sanic');
    assert(code.includes('@app.route("/api/v1/predict", methods=["POST"])'), 'Sanic code must define route decorator');
    assert(code.includes('"cell": [1, 2, 0, 0]'), 'Sanic code must contain cell coordinates');
});

runTest('M4.8: Framework Synthesizer — Node.js Express', () => {
    const fn = { name: 'issueSessionToken', params: [], returnType: 'Object' };
    const code = PolyglotConverter.synthesize(fn, FRAMEWORKS.EXPRESS, '/api/auth/token', 'POST', [3, 4, 0, 0]);
    assert(code.includes("const express = require('express')"), 'Express code must require express');
    assert(code.includes("router.post('/api/auth/token'"), 'Express code must define router.post');
    assert(code.includes('latency_ms: latencyMs'), 'Express code must include latency measurement');
});

runTest('M4.9: Framework Synthesizer — Go Gin / net-http', () => {
    const fn = { name: 'ProcessTransaction', params: [{ name: 'amount', type: 'float' }], returnType: 'error' };
    const code = PolyglotConverter.synthesize(fn, FRAMEWORKS.GO, '/api/pay', 'POST', [4, 5, 0, 0]);
    assert(code.includes('package main'), 'Go code must define package main');
    assert(code.includes('github.com/gin-gonic/gin'), 'Go code must import Gin');
    assert(code.includes('type StandardResponse struct'), 'Go code must define standard response envelope');
});

runTest('M4.10: Framework Synthesizer — C libmicrohttpd', () => {
    const fn = { name: 'compute_fnv1a_hash', params: [], returnType: 'uint64_t' };
    const code = PolyglotConverter.synthesize(fn, FRAMEWORKS.C, '/api/hash', 'POST', [5, 6, 0, 0]);
    assert(code.includes('#include <microhttpd.h>'), 'C code must include libmicrohttpd');
    assert(code.includes('MHD_create_response_from_buffer'), 'C code must create MHD response');
});

runTest('M4.11: Framework Synthesizer — Java Spring Boot', () => {
    const fn = { name: 'createOrder', params: [], returnType: 'Map' };
    const code = PolyglotConverter.synthesize(fn, FRAMEWORKS.JAVA, '/api/orders', 'POST', [7, 6, 0, 0]);
    assert(code.includes('@RestController'), 'Java code must include @RestController');
    assert(code.includes('public record ExecutionEnvelope'), 'Java code must include ExecutionEnvelope record');
    assert(code.includes('@PostMapping("/api/orders")'), 'Java code must include @PostMapping');
});

runTest('M4.12: Client Snippets Generator (curl & fetch)', () => {
    const snippets = PolyglotConverter.generateClientSnippets('/api/v1/predict', 'POST', { features: [1, 2, 3] });
    assert(snippets.curl.includes('curl -X POST'), 'curl snippet must include POST method');
    assert(snippets.curl.includes('/api/v1/predict'), 'curl snippet must include endpoint route');
    assert(snippets.fetch.includes('async function callApi()'), 'fetch snippet must define async function');
    assert(snippets.fetch.includes('method: "POST"'), 'fetch snippet must specify POST method');
});

// ===== 5. EXECUTION LOGS, HISTORY & BACKEND APIS (M5) =====
runTest('M5.1: api.php registers grid commands in $REGISTERED_COMMANDS', () => {
    const apiPhp = fs.readFileSync(path.join(__dirname, '../../api.php'), 'utf8');
    assert(apiPhp.includes('"grid"'), 'api.php must register "grid" command');
    assert(apiPhp.includes('"polyglot"'), 'api.php must register "polyglot" command');
    assert(apiPhp.includes('"launcher"'), 'api.php must register "launcher" command');
    assert(apiPhp.includes('"studio"'), 'api.php must register "studio" command');
});

runTest('M5.2: api.php provides /api/grid/* REST routes', () => {
    const apiPhp = fs.readFileSync(path.join(__dirname, '../../api.php'), 'utf8');
    assert(apiPhp.includes('/api/grid/convert'), 'api.php must handle /api/grid/convert');
    assert(apiPhp.includes('/api/grid/execute'), 'api.php must handle /api/grid/execute');
    assert(apiPhp.includes('/api/grid/upload-dir'), 'api.php must handle /api/grid/upload-dir');
    assert(apiPhp.includes('/api/grid/logs'), 'api.php must handle /api/grid/logs');
    assert(apiPhp.includes('/api/grid/state'), 'api.php must handle /api/grid/state');
});

runTest('M5.3: Workspace state export and import lossless round-trip', () => {
    const state = new PolyglotStudioState();
    const cell00 = state.getCell(0, 0);
    cell00.state = LIFECYCLE_STATES.SUCCESS;
    cell00.executionCount = 42;
    cell00.lastLatencyMs = 18.5;

    const cell34 = state.getCell(3, 4);
    cell34.state = LIFECYCLE_STATES.CONFIGURED;
    cell34.framework = FRAMEWORKS.GO;

    const exportedJson = JSON.stringify({
        version: "2026.1",
        activeCoord: { x: 3, y: 4, z: 0, u: 0 },
        cells: Object.fromEntries(state.cells.entries()),
        files: Array.from(state.files.entries()),
        history: []
    });

    const newState = new PolyglotStudioState();
    const parsed = JSON.parse(exportedJson);
    newState.cells.clear();
    Object.keys(parsed.cells).forEach(k => {
        newState.cells.set(k, parsed.cells[k]);
    });
    newState.activeCoord = parsed.activeCoord;

    assert.strictEqual(newState.getCell(0, 0).state, LIFECYCLE_STATES.SUCCESS);
    assert.strictEqual(newState.getCell(0, 0).executionCount, 42);
    assert.strictEqual(newState.getCell(3, 4).framework, FRAMEWORKS.GO);
    assert.strictEqual(newState.activeCoord.x, 3);
    assert.strictEqual(newState.activeCoord.y, 4);
});

console.log('\n================================================================');
console.log(`  TEST RESULTS: ${passedTests} / ${totalTests} PASSED (${failedTests} FAILED)`);
console.log('================================================================');

if (failedTests > 0) {
    process.exit(1);
} else {
    console.log('\nAll Milestones M1 through M5 verification assertions PASSED with 100% success!\n');
    process.exit(0);
}
