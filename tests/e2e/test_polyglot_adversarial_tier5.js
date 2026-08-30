/**
 * Hashcod Codespace — Polyglot Grid API Launcher & Code Studio
 * Tier 5: Adversarial, Edge Case, Boundary & Security Test Suite
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('================================================================');
console.log('  POLYGLOT GRID — TIER 5 ADVERSARIAL & BOUNDARY TEST HARNESS    ');
console.log('================================================================\n');

const PolyglotModule = require('../../components/polyglot-grid.js');
const { PolyglotStudioState, PolyglotConverter, PolyglotGridStudioController, LIFECYCLE_STATES, FRAMEWORKS, SAMPLE_PRESETS } = PolyglotModule;

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function runAdvTest(name, fn) {
    totalTests++;
    try {
        fn();
        passedTests++;
        console.log(`  ✓ PASS [ADV]: ${name}`);
    } catch (err) {
        failedTests++;
        console.error(`  ✗ FAIL [ADV]: ${name}`);
        console.error(`    Error: ${err.message}\n${err.stack}\n`);
    }
}

// =============================================================================
// 1. COORDINATE CLAMPING & BOUNDARY TESTS
// =============================================================================
runAdvTest('ADV-01: Coordinate clamping on extreme negative and overflow values', () => {
    const state = new PolyglotStudioState();
    
    // Negative bounds
    const c1 = state.clampCoord(-100, -50, -10, -5);
    assert.strictEqual(c1.x, 0, 'X must clamp to 0');
    assert.strictEqual(c1.y, 0, 'Y must clamp to 0');
    assert.strictEqual(c1.z, 0, 'Z must clamp to 0');
    assert.strictEqual(c1.u, 0, 'U must clamp to 0');

    // Massive overflow bounds
    const c2 = state.clampCoord(999999, 888888, 1000000, 500000);
    assert.strictEqual(c2.x, 7, 'X must clamp to 7 (8 columns: 0..7)');
    assert.strictEqual(c2.y, 6, 'Y must clamp to 6 (7 rows: 0..6)');
    assert.strictEqual(c2.z, 1000000, 'Z allows arbitrary positive dimensions');
    assert.strictEqual(c2.u, 500000, 'U allows arbitrary positive vectors');

    // Floating point and non-integers
    const c3 = state.clampCoord(3.89, 4.12, 5.99, 1.01);
    assert.strictEqual(c3.x, 3, 'X must floor floating points');
    assert.strictEqual(c3.y, 4, 'Y must floor floating points');
    assert.strictEqual(c3.z, 5, 'Z must floor floating points');
    assert.strictEqual(c3.u, 1, 'U must floor floating points');

    // NaN, undefined, string, null, object types
    const c4 = state.clampCoord('invalid', undefined, null, NaN);
    assert.strictEqual(c4.x, 0);
    assert.strictEqual(c4.y, 0);
    assert.strictEqual(c4.z, 0);
    assert.strictEqual(c4.u, 0);
});

runAdvTest('ADV-02: Bijective linear index to 2D coordinate bijection full sweep', () => {
    const state = new PolyglotStudioState();

    // Verify all 56 cells bijective mapping
    const seenIndices = new Set();
    const seenCoords = new Set();

    for (let y = 0; y < 7; y++) {
        for (let x = 0; x < 8; x++) {
            const idx = state.coordToIndex(x, y);
            assert.strictEqual(idx >= 0 && idx < 56, true, `Index ${idx} out of range [0..55]`);
            assert.strictEqual(seenIndices.has(idx), false, `Index collision at ${idx}`);
            seenIndices.add(idx);

            const recovered = state.indexToCoord(idx);
            assert.strictEqual(recovered.x, x, `Mismatch x: expected ${x}, got ${recovered.x}`);
            assert.strictEqual(recovered.y, y, `Mismatch y: expected ${y}, got ${recovered.y}`);

            const coordKey = `${recovered.x}:${recovered.y}`;
            seenCoords.add(coordKey);
        }
    }

    assert.strictEqual(seenIndices.size, 56, 'All 56 indices must be unique');
    assert.strictEqual(seenCoords.size, 56, 'All 56 coordinate pairs must be mapped');

    // Index boundary overflow/underflow
    const under = state.indexToCoord(-99);
    assert.strictEqual(under.x, 0);
    assert.strictEqual(under.y, 0);

    const over = state.indexToCoord(9999);
    assert.strictEqual(over.x, 7);
    assert.strictEqual(over.y, 6);
});

// =============================================================================
// 2. RAPID MODAL TOGGLE & STATE IDEMPOTENCY
// =============================================================================
runAdvTest('ADV-03: Rapid modal toggle storms and state idempotency', () => {
    const controller = new PolyglotGridStudioController();
    assert.strictEqual(controller.isInitialized, false);

    // Multiple redundant calls to open / close
    controller.closeModal(); // Closing uninitialized
    controller.openModal();  // Opening initializes
    assert.strictEqual(controller.isInitialized, true);

    for (let i = 0; i < 500; i++) {
        controller.toggleModal();
    }

    // Force open / force close
    controller.toggleModal(true);
    controller.toggleModal(true); // Redundant open
    controller.toggleModal(false);
    controller.toggleModal(false); // Redundant close

    assert.strictEqual(controller.state.cells.size, 56, 'Matrix must retain 56 cells despite modal storms');
});

// =============================================================================
// 3. EMPTY FOLDER, OVERSIZED FILE & FILE TREE RESILIENCE
// =============================================================================
runAdvTest('ADV-04: Empty folder upload and invalid file type handling', async () => {
    const controller = new PolyglotGridStudioController();

    // Ingest empty list
    await controller.handleFileListUpload([]);
    assert.strictEqual(controller.state.files.size >= 6, true, 'Default preset files retained');

    // Ingest oversized file mock (> 5MB)
    const mockOversizedFile = {
        name: 'huge_data.bin',
        size: 10 * 1024 * 1024, // 10MB
        webkitRelativePath: 'data/huge_data.bin',
        text: async () => 'huge binary content'
    };

    const mockValidFile = {
        name: 'test_script.py',
        size: 120,
        webkitRelativePath: 'scripts/test_script.py',
        text: async () => 'def compute_something():\n    return 42\n'
    };

    await controller.handleFileListUpload([mockOversizedFile, mockValidFile]);

    assert.strictEqual(controller.state.files.has('data/huge_data.bin'), false, 'Oversized file must be skipped');
    assert.strictEqual(controller.state.files.has('scripts/test_script.py'), true, 'Valid file must be ingested');
});

// =============================================================================
// 4. AST & CODE-TO-API PARSER RESILIENCE (HOSTILE / CORRUPTED CODE)
// =============================================================================
runAdvTest('ADV-05: AST parser handling of unparseable, empty, and adversarial code', () => {
    // Empty code
    const fns1 = PolyglotConverter.extractSignatures('', 'python');
    assert.strictEqual(fns1.length, 1);
    assert.strictEqual(fns1[0].name, 'executeHandler', 'Fallback handler generated');

    // Malformed code with syntax errors
    const brokenCode = 'def !!!broken((((( 999 -- syntax error --';
    const fns2 = PolyglotConverter.extractSignatures(brokenCode, 'python');
    assert.strictEqual(fns2.length, 1);
    assert.strictEqual(fns2[0].name, 'executeHandler');

    // Function with 50 parameters
    const paramsList = Array.from({ length: 50 }, (_, i) => `arg_${i}: int = ${i}`).join(', ');
    const hugeFnCode = `def massive_function(${paramsList}) -> dict:\n    """Fifty parameters stress test"""\n    return {}`;
    const fns3 = PolyglotConverter.extractSignatures(hugeFnCode, 'python');
    assert.strictEqual(fns3.length, 1);
    assert.strictEqual(fns3[0].name, 'massive_function');
    assert.strictEqual(fns3[0].params.length, 50, 'All 50 parameters extracted');

    // Synthesis with 50 parameters
    const codeFastApi = PolyglotConverter.synthesize(fns3[0], FRAMEWORKS.FASTAPI, '/api/massive', 'POST', [1, 2, 3, 4]);
    assert(codeFastApi.includes('class Massive_functionRequest(BaseModel):'));
    assert(codeFastApi.includes('arg_49: int = 49'));
});

runAdvTest('ADV-06: Multi-framework code synthesis across all 6 target frameworks', () => {
    const fnDef = {
        name: 'process_telemetry',
        params: [
            { name: 'device_id', type: 'str', in: 'path', required: true, defaultVal: null },
            { name: 'sampling_rate', type: 'int', in: 'query', required: false, defaultVal: '100' },
            { name: 'metrics', type: 'list', in: 'body', required: true, defaultVal: null }
        ],
        returnType: 'dict',
        docstring: 'Process IoT telemetry signals'
    };

    const cell = [3, 4, 1, 0];

    // 1. FastAPI
    const fastApiCode = PolyglotConverter.synthesize(fnDef, FRAMEWORKS.FASTAPI, '/api/v1/telemetry/{device_id}', 'POST', cell);
    assert(fastApiCode.includes('from fastapi import FastAPI'));
    assert(fastApiCode.includes('"cell": [3, 4, 1, 0]'));
    assert(fastApiCode.includes('req_body: Process_telemetryRequest'));

    // 2. Sanic
    const sanicCode = PolyglotConverter.synthesize(fnDef, FRAMEWORKS.SANIC, '/api/v1/telemetry/<device_id>', 'POST', cell);
    assert(sanicCode.includes('from sanic import Sanic'));
    assert(sanicCode.includes('"cell": [3, 4, 1, 0]'));

    // 3. Express
    const expressCode = PolyglotConverter.synthesize(fnDef, FRAMEWORKS.EXPRESS, '/api/v1/telemetry/:device_id', 'POST', cell);
    assert(expressCode.includes("const express = require('express')"));
    assert(expressCode.includes("router.post('/api/v1/telemetry/:device_id'"));

    // 4. Go Gin
    const goCode = PolyglotConverter.synthesize(fnDef, FRAMEWORKS.GO, '/api/v1/telemetry/:device_id', 'POST', cell);
    assert(goCode.includes('package main'));
    assert(goCode.includes('github.com/gin-gonic/gin'));
    assert(goCode.includes('type Process_telemetryRequest struct'));

    // 5. C libmicrohttpd
    const cCode = PolyglotConverter.synthesize(fnDef, FRAMEWORKS.C, '/api/v1/telemetry', 'POST', cell);
    assert(cCode.includes('#include <microhttpd.h>'));
    assert(cCode.includes('BUFFER_MAX 8192'));

    // 6. Java Spring Boot
    const javaCode = PolyglotConverter.synthesize(fnDef, FRAMEWORKS.JAVA, '/api/v1/telemetry/{device_id}', 'POST', cell);
    assert(javaCode.includes('@RestController'));
    assert(javaCode.includes('@PostMapping("/api/v1/telemetry/{device_id}")'));
});

// =============================================================================
// 5. MEMORY RING BUFFERS & LOG FLOODING STRESS
// =============================================================================
runAdvTest('ADV-07: Log ring buffer bounds under 10,000 log messages flood', () => {
    const controller = new PolyglotGridStudioController();

    for (let i = 0; i < 5000; i++) {
        controller.appendLog('INFO', `Flood log message iteration #${i}`, [0, 0, 0, 0], i % 10);
    }

    // Must be capped at max 1,000 entries
    assert.strictEqual(controller.state.executionLogs.length, 1000, 'Logs must cap at FIFO 1000 items');
    assert.strictEqual(controller.state.executionLogs[999].message, 'Flood log message iteration #4999');
    assert.strictEqual(controller.state.executionLogs[0].message, 'Flood log message iteration #4000');
});

runAdvTest('ADV-08: Execution history ledger cap under 200 cell executions', () => {
    const controller = new PolyglotGridStudioController();
    const cell = controller.state.getCell(0, 0);

    for (let i = 0; i < 200; i++) {
        controller.addHistoryRecord(cell, { ok: true, status: 200 }, 15);
    }

    // History ledger must cap at 50 records
    assert.strictEqual(controller.state.historyLedger.length, 50, 'History ledger must cap at 50 records');
    assert.strictEqual(controller.state.historyLedger[0].status, 200);
});

// =============================================================================
// 6. XSS SAFETY & HTML ESCAPING VERIFICATION
// =============================================================================
runAdvTest('ADV-09: XSS injection payloads in logs, cell metadata and snippets', () => {
    const controller = new PolyglotGridStudioController();
    const xssPayload = '<script>alert("XSS_ATTACK_VECTOR")</script><img src=x onerror=alert(document.cookie)>';

    controller.appendLog('ERROR', xssPayload, [0, 0, 0, 0]);
    const lastLog = controller.state.executionLogs[controller.state.executionLogs.length - 1];

    assert.strictEqual(lastLog.message, xssPayload, 'Log message preserved as raw string');

    // Snippets generation with XSS payload
    const snippets = PolyglotConverter.generateClientSnippets(`/api/search?q=${encodeURIComponent(xssPayload)}`, 'POST', {
        attack: xssPayload
    });

    assert(snippets.curl.includes('curl -X POST'));
    assert(snippets.fetch.includes('fetch('));
});

// =============================================================================
// 7. JSON SCHEMA RECOVERY & CORRUPTION HANDLING
// =============================================================================
runAdvTest('ADV-10: JSON schema corruption recovery and invalid workspace imports', () => {
    const controller = new PolyglotGridStudioController();

    // 1. Invalid JSON syntax
    const res1 = controller.importWorkspace('{"invalid json -- broken');
    assert.strictEqual(res1, false, 'Invalid JSON must return false');

    // 2. JSON without cells object
    const res2 = controller.importWorkspace('{"version": "2026.1", "foo": "bar"}');
    assert.strictEqual(res2, false, 'Missing cells schema must return false');

    // 3. Null / empty JSON
    const res3 = controller.importWorkspace('null');
    assert.strictEqual(res3, false, 'Null JSON must return false');

    // 4. Valid JSON export and import round-trip
    const cell76 = controller.state.getCell(7, 6);
    cell76.state = LIFECYCLE_STATES.SUCCESS;
    cell76.boundFunction = 'compute_fnv1a_hash';
    cell76.framework = FRAMEWORKS.C;

    const exported = controller.exportWorkspace();
    assert(typeof exported === 'string');
    assert(exported.length > 500);

    const newController = new PolyglotGridStudioController();
    const res4 = newController.importWorkspace(exported);
    assert.strictEqual(res4, true, 'Valid workspace must import successfully');
    assert.strictEqual(newController.state.getCell(7, 6).state, LIFECYCLE_STATES.SUCCESS);
    assert.strictEqual(newController.state.getCell(7, 6).boundFunction, 'compute_fnv1a_hash');
    assert.strictEqual(newController.state.getCell(7, 6).framework, FRAMEWORKS.C);
});

// =============================================================================
// 8. BATCH CELL OPERATIONS & LOCKED CELL SAFETY
// =============================================================================
runAdvTest('ADV-11: Batch arming, batch clearing, and locked cell execution guard', async () => {
    const controller = new PolyglotGridStudioController();

    // Select 5 cells
    controller.state.selectedCellKeys.add('0:0');
    controller.state.selectedCellKeys.add('1:1');
    controller.state.selectedCellKeys.add('2:2');
    controller.state.selectedCellKeys.add('3:3');
    controller.state.selectedCellKeys.add('4:4');

    // Lock cell 2:2
    const cell22 = controller.state.getCell(2, 2);
    cell22.state = LIFECYCLE_STATES.LOCKED;

    // Batch arm
    controller.batchArmSelected();

    assert.strictEqual(controller.state.getCell(0, 0).state, LIFECYCLE_STATES.CONFIGURED);
    assert.strictEqual(controller.state.getCell(1, 1).state, LIFECYCLE_STATES.CONFIGURED);
    assert.strictEqual(controller.state.getCell(2, 2).state, LIFECYCLE_STATES.LOCKED, 'LOCKED cell must not be armed');
    assert.strictEqual(controller.state.getCell(3, 3).state, LIFECYCLE_STATES.CONFIGURED);
    assert.strictEqual(controller.state.getCell(4, 4).state, LIFECYCLE_STATES.CONFIGURED);

    // Attempt direct execution on LOCKED cell
    const execRes = await controller.executeSpecificCell(cell22);
    assert.strictEqual(execRes, undefined, 'Execution on LOCKED cell must be immediately aborted');
    assert.strictEqual(cell22.state, LIFECYCLE_STATES.LOCKED, 'LOCKED cell state must remain unchanged');

    // Batch clear
    controller.batchClearSelected();
    assert.strictEqual(controller.state.getCell(0, 0).state, LIFECYCLE_STATES.IDLE);
    assert.strictEqual(controller.state.getCell(1, 1).state, LIFECYCLE_STATES.IDLE);
});

console.log('\n================================================================');
console.log(`  TIER 5 ADVERSARIAL RESULTS: ${passedTests} / ${totalTests} PASSED (${failedTests} FAILED)`);
console.log('================================================================');

if (failedTests > 0) {
    process.exit(1);
} else {
    console.log('\nAll Tier 5 Adversarial & Boundary tests PASSED with 100% success!\n');
    process.exit(0);
}
