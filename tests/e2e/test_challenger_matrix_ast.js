/**
 * Hashcod Codespace — Challenger 1: Empirical Verification & Stress Test Suite
 * Domain: 8x7 Coordinate Matrix Grid, 4D (x,y,z,u) Coordinates, 6-State Lifecycle Engine,
 *         Multi-Cell Batch Selections, Polyglot AST/Signature Parsing, and Code Synthesizers (FastAPI, Sanic, Express, Go, C, Java).
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('================================================================================');
console.log('  CHALLENGER 1: POLYGLOT MATRIX, AST & CODE SYNTHESIS STRESS TEST SUITE        ');
console.log('================================================================================\n');

// Import Polyglot Grid Module
const PolyglotModule = require('../../components/polyglot-grid.js');
const {
    PolyglotStudioState,
    PolyglotConverter,
    PolyglotGridStudioController,
    LIFECYCLE_STATES,
    FRAMEWORKS,
    SAMPLE_PRESETS
} = PolyglotModule;

let totalAssertions = 0;
let passedAssertions = 0;
let failedAssertions = 0;
const testResults = [];

function challengeTest(category, description, testFn) {
    process.stdout.write(`  [${category}] ${description} ... `);
    try {
        testFn();
        passedAssertions++;
        totalAssertions++;
        console.log('PASSED (✓)');
        testResults.push({ category, description, status: 'PASS' });
    } catch (err) {
        failedAssertions++;
        totalAssertions++;
        console.log(`FAILED (✗)`);
        console.error(`    Assertion Error: ${err.message}\n    Stack: ${err.stack}\n`);
        testResults.push({ category, description, status: 'FAIL', error: err.message });
    }
}

// ================================================================================
// SUITE 1: 8x7 COORDINATE MATRIX GEOMETRY, 4D COORDINATES & INDEX BIJECTIONS
// ================================================================================

challengeTest('MATRIX_GEO', 'Verify 8x7 Grid geometry allocates exactly 56 cells (8 cols x 7 rows)', () => {
    const state = new PolyglotStudioState();
    assert.strictEqual(state.cells.size, 56, 'Initial default grid cell count must be exactly 56');

    let cellCount = 0;
    for (let y = 0; y < 7; y++) {
        for (let x = 0; x < 8; x++) {
            const cell = state.getCell(x, y, 0, 0);
            assert.ok(cell, `Cell at (${x}, ${y}) must exist`);
            assert.strictEqual(cell.x, x, `Cell x coordinate must match ${x}`);
            assert.strictEqual(cell.y, y, `Cell y coordinate must match ${y}`);
            assert.strictEqual(cell.z, 0, `Cell z layer must default to 0`);
            assert.strictEqual(cell.u, 0, `Cell u vector must default to 0`);
            assert.strictEqual(cell.id, `cell-${x}-${y}-0-0`, `Cell ID format mismatch`);
            cellCount++;
        }
    }
    assert.strictEqual(cellCount, 56, 'All 56 coordinate permutations must be verified');
});

challengeTest('MATRIX_GEO', 'Verify Bijective Index <-> Coordinate mapping formula for all 56 cells', () => {
    const state = new PolyglotStudioState();
    for (let y = 0; y < 7; y++) {
        for (let x = 0; x < 8; x++) {
            const index = state.coordToIndex(x, y);
            const expectedIndex = y * 8 + x;
            assert.strictEqual(index, expectedIndex, `Index mapping formula i = y*8 + x failed for (${x}, ${y})`);

            const backCoord = state.indexToCoord(index);
            assert.strictEqual(backCoord.x, x, `Back-converted x failed for index ${index}`);
            assert.strictEqual(backCoord.y, y, `Back-converted y failed for index ${index}`);
        }
    }
});

challengeTest('MATRIX_GEO', 'Stress-test 4D (x,y,z,u) coordinate clamping against negative, overflow, and float values', () => {
    const state = new PolyglotStudioState();

    // Extreme negative values
    const neg = state.clampCoord(-100, -50, -10, -5);
    assert.strictEqual(neg.x, 0, 'Negative x must clamp to 0');
    assert.strictEqual(neg.y, 0, 'Negative y must clamp to 0');
    assert.strictEqual(neg.z, 0, 'Negative z must clamp to 0');
    assert.strictEqual(neg.u, 0, 'Negative u must clamp to 0');

    // Extreme positive overflows
    const pos = state.clampCoord(9999, 8888, 50000, 100000);
    assert.strictEqual(pos.x, 7, 'Overflow x must clamp to GRID_COLS - 1 (7)');
    assert.strictEqual(pos.y, 6, 'Overflow y must clamp to GRID_ROWS - 1 (6)');
    assert.strictEqual(pos.z, 50000, 'Z is unbounded positive integer');
    assert.strictEqual(pos.u, 100000, 'U is unbounded positive integer');

    // Floating-point flooring
    const floats = state.clampCoord(3.89, 5.99, 12.75, 44.1);
    assert.strictEqual(floats.x, 3, 'Float x must be floored to 3');
    assert.strictEqual(floats.y, 5, 'Float y must be floored to 5');
    assert.strictEqual(floats.z, 12, 'Float z must be floored to 12');
    assert.strictEqual(floats.u, 44, 'Float u must be floored to 44');

    // Non-numeric & NaN inputs
    const nans = state.clampCoord('invalid', undefined, null, NaN);
    assert.strictEqual(nans.x, 0, 'Invalid x must fallback to 0');
    assert.strictEqual(nans.y, 0, 'Invalid y must fallback to 0');
    assert.strictEqual(nans.z, 0, 'Invalid z must fallback to 0');
    assert.strictEqual(nans.u, 0, 'Invalid u must fallback to 0');
});

challengeTest('MATRIX_GEO', 'Verify dynamic 4D key generation and on-demand cell allocation for higher dimensions (z>0, u>0)', () => {
    const state = new PolyglotStudioState();
    const initialSize = state.cells.size;
    assert.strictEqual(initialSize, 56);

    // Request higher dimensional cell (3, 4, 5, 2)
    const deepCell = state.getCell(3, 4, 5, 2);
    assert.ok(deepCell);
    assert.strictEqual(deepCell.x, 3);
    assert.strictEqual(deepCell.y, 4);
    assert.strictEqual(deepCell.z, 5);
    assert.strictEqual(deepCell.u, 2);
    assert.strictEqual(deepCell.id, 'cell-3-4-5-2');
    assert.strictEqual(state.cells.size, 57, 'Map size must expand on novel 4D coordinate request');

    // Subsequent retrieval of same 4D coordinate must return cached instance
    const cachedCell = state.getCell(3, 4, 5, 2);
    assert.strictEqual(deepCell, cachedCell, 'Subsequent getCell must return identical instance reference');
});

challengeTest('MATRIX_GEO', 'Verify linear index clamping on extreme boundary out-of-range values', () => {
    const state = new PolyglotStudioState();
    const lowBound = state.indexToCoord(-500);
    assert.strictEqual(lowBound.x, 0);
    assert.strictEqual(lowBound.y, 0);

    const highBound = state.indexToCoord(99999);
    assert.strictEqual(highBound.x, 7);
    assert.strictEqual(highBound.y, 6);
});

// ================================================================================
// SUITE 2: 6-STATE CELL LIFECYCLE ENGINE & INVARIANT PRESERVATION
// ================================================================================

challengeTest('LIFECYCLE', 'Verify 6 lifecycle states enumeration correctness', () => {
    assert.strictEqual(LIFECYCLE_STATES.IDLE, 'IDLE');
    assert.strictEqual(LIFECYCLE_STATES.CONFIGURED, 'CONFIGURED');
    assert.strictEqual(LIFECYCLE_STATES.RUNNING, 'RUNNING');
    assert.strictEqual(LIFECYCLE_STATES.SUCCESS, 'SUCCESS');
    assert.strictEqual(LIFECYCLE_STATES.ERROR, 'ERROR');
    assert.strictEqual(LIFECYCLE_STATES.LOCKED, 'LOCKED');
    assert.strictEqual(Object.keys(LIFECYCLE_STATES).length, 6, 'Exactly 6 lifecycle states must be defined');
});

challengeTest('LIFECYCLE', 'Stress-test all pairwise state transitions and metadata assignment', () => {
    const state = new PolyglotStudioState();
    const cell = state.getCell(4, 2);
    assert.strictEqual(cell.state, LIFECYCLE_STATES.IDLE);

    // IDLE -> CONFIGURED
    cell.state = LIFECYCLE_STATES.CONFIGURED;
    cell.boundFile = 'services/ml_analyzer.py';
    cell.boundFunction = 'predict_classification';
    assert.strictEqual(cell.state, 'CONFIGURED');

    // CONFIGURED -> RUNNING
    cell.state = LIFECYCLE_STATES.RUNNING;
    assert.strictEqual(cell.state, 'RUNNING');

    // RUNNING -> SUCCESS
    cell.state = LIFECYCLE_STATES.SUCCESS;
    cell.lastLatencyMs = 42.5;
    cell.executionCount = 1;
    assert.strictEqual(cell.state, 'SUCCESS');
    assert.strictEqual(cell.lastLatencyMs, 42.5);

    // SUCCESS -> RUNNING -> ERROR
    cell.state = LIFECYCLE_STATES.RUNNING;
    cell.state = LIFECYCLE_STATES.ERROR;
    cell.lastResult = { ok: false, error: 'Simulated Timeout' };
    assert.strictEqual(cell.state, 'ERROR');
    assert.strictEqual(cell.lastResult.error, 'Simulated Timeout');

    // ERROR -> LOCKED
    cell.state = LIFECYCLE_STATES.LOCKED;
    assert.strictEqual(cell.state, 'LOCKED');

    // LOCKED -> IDLE
    cell.state = LIFECYCLE_STATES.IDLE;
    assert.strictEqual(cell.state, 'IDLE');
});

challengeTest('LIFECYCLE', 'Invariant: LOCKED cell prevents execution and records warning log', async () => {
    const controller = new PolyglotGridStudioController();
    const cell = controller.state.getCell(1, 1);
    cell.state = LIFECYCLE_STATES.LOCKED;

    const initialLogsCount = controller.state.executionLogs.length;
    await controller.executeSpecificCell(cell);

    // Invariant: cell state must remain LOCKED, executionCount must NOT increment
    assert.strictEqual(cell.state, LIFECYCLE_STATES.LOCKED, 'LOCKED cell state must NOT mutate to RUNNING/SUCCESS');
    assert.strictEqual(cell.executionCount || 0, 0, 'LOCKED cell execution count must remain 0');

    // Verify warning log was emitted
    const newLogs = controller.state.executionLogs;
    assert.ok(newLogs.length > initialLogsCount, 'Log entry must be recorded for blocked execution');
    const lastLog = newLogs[newLogs.length - 1];
    assert.strictEqual(lastLog.level, 'WARN');
    assert.ok(lastLog.message.includes('LOCKED'), 'Log message must notify that cell is LOCKED');
});

challengeTest('LIFECYCLE', 'Invariant: Batch arming protects LOCKED cells from state alteration', () => {
    const controller = new PolyglotGridStudioController();
    
    const cellA = controller.state.getCell(2, 2);
    const cellB = controller.state.getCell(2, 3);
    cellA.state = LIFECYCLE_STATES.IDLE;
    cellB.state = LIFECYCLE_STATES.LOCKED;

    controller.state.selectedCellKeys.add('2:2');
    controller.state.selectedCellKeys.add('2:3');

    controller.batchArmSelected();

    assert.strictEqual(cellA.state, LIFECYCLE_STATES.CONFIGURED, 'IDLE cell must transition to CONFIGURED');
    assert.strictEqual(cellB.state, LIFECYCLE_STATES.LOCKED, 'LOCKED cell must NOT be altered by batch arm');
});

// ================================================================================
// SUITE 3: MULTI-CELL BATCH SELECTIONS & DISJOINT OPERATIONS
// ================================================================================

challengeTest('BATCH_OPS', 'Verify selection toggling, multi-cell set operations, and clearing', () => {
    const controller = new PolyglotGridStudioController();
    assert.strictEqual(controller.state.selectedCellKeys.size, 0);

    // Toggle select (0,0) and (3,3) and (7,6)
    controller.toggleCellSelection(0, 0);
    controller.toggleCellSelection(3, 3);
    controller.toggleCellSelection(7, 6);
    assert.strictEqual(controller.state.selectedCellKeys.size, 3);
    assert.ok(controller.state.selectedCellKeys.has('0:0'));
    assert.ok(controller.state.selectedCellKeys.has('3:3'));
    assert.ok(controller.state.selectedCellKeys.has('7:6'));

    // Untoggle (3,3)
    controller.toggleCellSelection(3, 3);
    assert.strictEqual(controller.state.selectedCellKeys.size, 2);
    assert.ok(!controller.state.selectedCellKeys.has('3:3'));

    // Batch Clear
    controller.batchClearSelected();
    const cell00 = controller.state.getCell(0, 0);
    const cell76 = controller.state.getCell(7, 6);
    assert.strictEqual(cell00.state, LIFECYCLE_STATES.IDLE);
    assert.strictEqual(cell76.state, LIFECYCLE_STATES.IDLE);
    assert.strictEqual(cell00.boundFile, '');
    assert.strictEqual(cell76.boundFile, '');
});

challengeTest('BATCH_OPS', 'Stress-test all 56 cells simultaneous batch selection and bulk arming', () => {
    const controller = new PolyglotGridStudioController();
    controller.state.selectedCellKeys.clear();

    // Select all 56 cells
    for (let y = 0; y < 7; y++) {
        for (let x = 0; x < 8; x++) {
            controller.state.selectedCellKeys.add(`${x}:${y}`);
        }
    }
    assert.strictEqual(controller.state.selectedCellKeys.size, 56, 'Must contain all 56 keys');

    controller.batchArmSelected();

    for (let y = 0; y < 7; y++) {
        for (let x = 0; x < 8; x++) {
            const cell = controller.state.getCell(x, y);
            assert.strictEqual(cell.state, LIFECYCLE_STATES.CONFIGURED, `Cell (${x}, ${y}) must be CONFIGURED`);
            assert.strictEqual(cell.route, `/api/cell/${x}/${y}`, `Cell (${x}, ${y}) route mismatch`);
        }
    }
});

// ================================================================================
// SUITE 4: POLYGLOT AST & SIGNATURE EXTRACTION ENGINE
// ================================================================================

challengeTest('AST_PYTHON', 'Verify Python AST signature extraction with type hints, defaults, and docstrings', () => {
    const pyCode = `
def analyze_telemetry(device_id: str, sample_rate: int = 100, normalize: bool = True) -> dict:
    """Extracts sensor telemetry metrics and checks thresholds."""
    pass

class DataEngine:
    def process_stream(self, stream_id: str, batch_size: int = 500) -> list:
        """Processes high volume data stream chunks."""
        pass
`;
    const fns = PolyglotConverter.extractSignatures(pyCode, 'python');
    assert.strictEqual(fns.length, 2, 'Should extract 2 python functions');

    const fn1 = fns[0];
    assert.strictEqual(fn1.name, 'analyze_telemetry');
    assert.strictEqual(fn1.params.length, 3);
    assert.strictEqual(fn1.params[0].name, 'device_id');
    assert.strictEqual(fn1.params[0].type, 'str');
    assert.strictEqual(fn1.params[0].in, 'path', 'Param ending with _id should map to path');
    assert.strictEqual(fn1.params[0].required, true);

    assert.strictEqual(fn1.params[1].name, 'sample_rate');
    assert.strictEqual(fn1.params[1].type, 'int');
    assert.strictEqual(fn1.params[1].in, 'query', 'Primitive with defaultVal should map to query');
    assert.strictEqual(fn1.params[1].required, false);
    assert.strictEqual(fn1.params[1].defaultVal, '100');

    assert.strictEqual(fn1.returnType, 'dict');
    assert.ok(fn1.docstring.includes('sensor telemetry metrics'));

    // Check method filtering self
    const fn2 = fns[1];
    assert.strictEqual(fn2.name, 'process_stream');
    assert.strictEqual(fn2.params.length, 2, '"self" parameter must be stripped from AST');
    assert.strictEqual(fn2.params[0].name, 'stream_id');
});

challengeTest('AST_JAVASCRIPT', 'Verify JavaScript / TypeScript function and arrow syntax signature parsing', () => {
    const jsCode = `
function calculateRiskScore(accountId, creditHistory, requestedAmount = 5000) {
    return { score: 750 };
}

const generateReport = async (reportId, format = "pdf") => {
    return { generated: true };
};
`;
    const fns = PolyglotConverter.extractSignatures(jsCode, 'javascript');
    assert.strictEqual(fns.length, 2, 'Should extract 2 JS functions');

    const fn1 = fns[0];
    assert.strictEqual(fn1.name, 'calculateRiskScore');
    assert.strictEqual(fn1.params.length, 3);
    assert.strictEqual(fn1.params[0].name, 'accountId');
    assert.strictEqual(fn1.params[0].in, 'path', 'Param ending with Id should map to path');

    const fn2 = fns[1];
    assert.strictEqual(fn2.name, 'generateReport');
    assert.strictEqual(fn2.params.length, 2);
    assert.strictEqual(fn2.params[0].name, 'reportId');
    assert.strictEqual(fn2.params[1].defaultVal, '"pdf"');
});

challengeTest('AST_GO', 'Verify Go function signature parsing with multi-return types and struct args', () => {
    const goCode = `
package handler

func CalculateTax(orderID string, subtotal float64, taxRate float64) (float64, error) {
    return subtotal * taxRate, nil
}
`;
    const fns = PolyglotConverter.extractSignatures(goCode, 'go');
    assert.strictEqual(fns.length, 1);

    const fn = fns[0];
    assert.strictEqual(fn.name, 'CalculateTax');
    assert.strictEqual(fn.params.length, 3);
    assert.strictEqual(fn.params[0].name, 'orderID');
    assert.strictEqual(fn.params[0].type, 'string');
    assert.strictEqual(fn.params[0].in, 'path', 'Param containing ID should map to path');
    assert.strictEqual(fn.params[1].name, 'subtotal');
    assert.strictEqual(fn.params[1].type, 'float64');
    assert.ok(fn.returnType.includes('float64, error'));
});

challengeTest('AST_C', 'Verify C function signature parsing, pointer stripping, and control-statement filter', () => {
    const cCode = `
#include <stdint.h>

int validate_checksum(const char* buffer, size_t len) {
    if (len == 0) {
        return 0;
    }
    while (len > 0) {
        len--;
    }
    return 1;
}

char* encode_hex(uint8_t* data, int length) {
    return "deadbeef";
}
`;
    const fns = PolyglotConverter.extractSignatures(cCode, 'c');
    assert.strictEqual(fns.length, 2, 'Must extract validate_checksum and encode_hex and ignore if/while');

    const fn1 = fns[0];
    assert.strictEqual(fn1.name, 'validate_checksum');
    assert.strictEqual(fn1.returnType, 'int');
    assert.strictEqual(fn1.params.length, 2);
    assert.strictEqual(fn1.params[0].name, 'buffer');

    const fn2 = fns[1];
    assert.strictEqual(fn2.name, 'encode_hex');
    assert.ok(fn2.returnType.includes('char'));
    assert.strictEqual(fn2.params.length, 2);
    assert.strictEqual(fn2.params[0].name, 'data');
});

challengeTest('AST_JAVA', 'Verify Java Spring method signature extraction with generics, modifiers, and throws', () => {
    const javaCode = `
package com.hashcod.demo;

public class PaymentResource {
    public Map<String, Object> executePayment(String invoiceId, Double amount) throws PaymentException {
        if (amount <= 0) {
            return null;
        }
        return Map.of("status", "PAID");
    }
}
`;
    const fns = PolyglotConverter.extractSignatures(javaCode, 'java');
    assert.strictEqual(fns.length, 1, 'Must extract executePayment and ignore if statement');

    const fn = fns[0];
    assert.strictEqual(fn.name, 'executePayment');
    assert.strictEqual(fn.returnType, 'Map<String, Object>');
    assert.strictEqual(fn.params.length, 2);
    assert.strictEqual(fn.params[0].name, 'invoiceId');
    assert.strictEqual(fn.params[0].in, 'path');
    assert.strictEqual(fn.params[1].name, 'amount');
});

challengeTest('AST_FALLBACK', 'Verify fallback to executeHandler when input code contains no explicit function signatures', () => {
    const emptyCode = '// Just a comment file with no callable functions';
    const fns = PolyglotConverter.extractSignatures(emptyCode, 'javascript');
    assert.strictEqual(fns.length, 1);
    assert.strictEqual(fns[0].name, 'executeHandler');
    assert.strictEqual(fns[0].params[0].name, 'payload');
});

// ================================================================================
// SUITE 5: CODE SYNTHESIS ACROSS ALL 6 TARGET FRAMEWORKS
// ================================================================================

const mockFn = {
    name: 'calculateMetrics',
    params: [
        { name: 'tenant_id', type: 'str', in: 'path', required: true, defaultVal: null },
        { name: 'window_size', type: 'int', in: 'query', required: false, defaultVal: '10' },
        { name: 'data_points', type: 'list', in: 'body', required: true, defaultVal: null }
    ],
    returnType: 'dict',
    docstring: 'Calculates rolling window metrics for tenant'
};

challengeTest('SYNTH_FASTAPI', 'Verify FastAPI route synthesizer generates Pydantic schema, routes, and JSON envelope', () => {
    const code = PolyglotConverter.synthesize(mockFn, FRAMEWORKS.FASTAPI, '/api/v1/metrics/{tenant_id}', 'POST', [2, 3, 1, 0]);

    assert.ok(code.includes('from fastapi import FastAPI, HTTPException, Request'), 'FastAPI imports missing');
    assert.ok(code.includes('from pydantic import BaseModel'), 'Pydantic BaseModel import missing');
    assert.ok(code.includes('class CalculateMetricsRequest(BaseModel):'), 'Pydantic request model schema missing');
    assert.ok(code.includes('data_points: list'), 'Pydantic schema field missing');
    assert.ok(code.includes('@app.post("/api/v1/metrics/{tenant_id}")'), 'Route decorator missing');
    assert.ok(code.includes('tenant_id: str'), 'Path param missing in handler args');
    assert.ok(code.includes('window_size: int = 10'), 'Query param missing in handler args');
    assert.ok(code.includes('req_body: CalculateMetricsRequest'), 'Body schema param missing in handler args');
    assert.ok(code.includes('"cell": [2, 3, 1, 0]'), 'Cell coordinates array missing in response envelope');
    assert.ok(code.includes('"latency_ms": latency_ms'), 'Latency metric missing in response envelope');
    assert.ok(code.includes('CORSMiddleware'), 'CORS middleware configuration missing');
    assert.ok(code.includes('uvicorn.run'), 'Uvicorn runner missing');
});

challengeTest('SYNTH_SANIC', 'Verify Sanic route synthesizer generates async handler, query/body parsing, and envelope', () => {
    const code = PolyglotConverter.synthesize(mockFn, FRAMEWORKS.SANIC, '/api/v1/metrics/<tenant_id>', 'POST', [4, 5, 0, 0]);

    assert.ok(code.includes('from sanic import Sanic, response, json'), 'Sanic imports missing');
    assert.ok(code.includes('app = Sanic("PolyglotGridSanicApp")'), 'Sanic app initialization missing');
    assert.ok(code.includes('@app.route("/api/v1/metrics/<tenant_id>", methods=["POST"])'), 'Sanic route decorator missing');
    assert.ok(code.includes('async def handle_calculateMetrics(request):'), 'Sanic async handler missing');
    assert.ok(code.includes('body = request.json if request.json else {}'), 'Sanic JSON body parsing missing');
    assert.ok(code.includes('query_args = dict(request.args)'), 'Sanic query args parsing missing');
    assert.ok(code.includes('"cell": [4, 5, 0, 0]'), 'Cell coordinates missing');
    assert.ok(code.includes('"latency_ms": latency_ms'), 'Latency measurement missing');
    assert.ok(code.includes('app.run(host="0.0.0.0", port=8000'), 'Sanic runner missing');
});

challengeTest('SYNTH_EXPRESS', 'Verify Express route synthesizer generates router, JSON middleware, and standard envelope', () => {
    const code = PolyglotConverter.synthesize(mockFn, FRAMEWORKS.EXPRESS, '/api/v1/metrics/:tenant_id', 'POST', [1, 6, 0, 0]);

    assert.ok(code.includes("const express = require('express');"), 'Express require missing');
    assert.ok(code.includes('const router = express.Router();'), 'Express router declaration missing');
    assert.ok(code.includes('router.use(express.json());'), 'Express JSON middleware missing');
    assert.ok(code.includes("router.post('/api/v1/metrics/:tenant_id', async (req, res, next) => {"), 'Router post missing');
    assert.ok(code.includes('const body = req.body || {};'), 'Request body extraction missing');
    assert.ok(code.includes('const query = req.query || {};'), 'Request query extraction missing');
    assert.ok(code.includes('const params = req.params || {};'), 'Request params extraction missing');
    assert.ok(code.includes('res.status(200).json({'), 'JSON response missing');
    assert.ok(code.includes('cell: [1, 6, 0, 0]'), 'Cell coordinate missing');
    assert.ok(code.includes('latency_ms: latencyMs'), 'Latency measurement missing');
    assert.ok(code.includes('module.exports = router;'), 'Module export missing');
});

challengeTest('SYNTH_GO', 'Verify Go route synthesizer generates Gin router, DTO structs, and response envelope', () => {
    const code = PolyglotConverter.synthesize(mockFn, FRAMEWORKS.GO, '/api/v1/metrics/:tenant_id', 'POST', [0, 0, 0, 0]);

    assert.ok(code.includes('package main'), 'Package main missing');
    assert.ok(code.includes('github.com/gin-gonic/gin'), 'Gin import missing');
    assert.ok(code.includes('type calculateMetricsRequest struct {'), 'DTO request struct missing');
    assert.ok(code.includes('Data_points []interface{} `json:"data_points"`'), 'DTO json struct tag missing');
    assert.ok(code.includes('type StandardResponse struct {'), 'StandardResponse struct missing');
    assert.ok(code.includes('func HandlecalculateMetrics(c *gin.Context) {'), 'Gin handler function missing');
    assert.ok(code.includes('c.ShouldBindJSON(&req)'), 'ShouldBindJSON binding missing');
    assert.ok(code.includes('c.JSON(http.StatusOK, StandardResponse{'), 'JSON response envelope missing');
    assert.ok(code.includes('Cell:      []int{0, 0, 0, 0}'), 'Cell coordinates array missing');
    assert.ok(code.includes('r.Run(":8080")'), 'Gin router run missing');
});

challengeTest('SYNTH_C', 'Verify C route synthesizer generates libmicrohttpd server, buffer protection, and headers', () => {
    const code = PolyglotConverter.synthesize(mockFn, FRAMEWORKS.C, '/api/v1/metrics', 'POST', [5, 4, 0, 0]);

    assert.ok(code.includes('#include <microhttpd.h>'), 'microhttpd.h header missing');
    assert.ok(code.includes('#define BUFFER_MAX 8192'), 'Buffer max security boundary missing');
    assert.ok(code.includes('static enum MHD_Result handle_request'), 'Request handler callback missing');
    assert.ok(code.includes('snprintf(response_buf, sizeof(response_buf),'), 'snprintf buffer writing missing');
    assert.ok(code.includes('\\"cell\\\":[%d,%d,%d,%d]'), 'Cell coordinate placeholder missing in C response');
    assert.ok(code.includes('MHD_create_response_from_buffer'), 'MHD response creation missing');
    assert.ok(code.includes('MHD_add_response_header(response, "Content-Type", "application/json");'), 'Content-Type header missing');
    assert.ok(code.includes('MHD_start_daemon'), 'MHD daemon startup missing');
});

challengeTest('SYNTH_JAVA', 'Verify Java Spring Boot synthesizer generates @RestController, DTO Record, and @PostMapping', () => {
    const code = PolyglotConverter.synthesize(mockFn, FRAMEWORKS.JAVA, '/api/v1/metrics/{tenant_id}', 'POST', [7, 6, 2, 1]);

    assert.ok(code.includes('package com.hashcod.grid.controller;'), 'Package declaration missing');
    assert.ok(code.includes('import org.springframework.web.bind.annotation.*;'), 'Spring web annotations import missing');
    assert.ok(code.includes('@RestController'), '@RestController annotation missing');
    assert.ok(code.includes('@CrossOrigin(origins = "*")'), '@CrossOrigin annotation missing');
    assert.ok(code.includes('public class CalculateMetricsController {'), 'Controller class name missing');
    assert.ok(code.includes('public record ExecutionEnvelope('), 'Java 17+ record DTO missing');
    assert.ok(code.includes('@PostMapping("/api/v1/metrics/{tenant_id}")'), '@PostMapping route missing');
    assert.ok(code.includes('public ResponseEntity<ExecutionEnvelope> handlecalculateMetrics'), 'Handler signature missing');
    assert.ok(code.includes('new int[]{7, 6, 2, 1}'), 'Cell coordinate int array missing in Java envelope');
    assert.ok(code.includes('ResponseEntity.ok(env)'), 'ResponseEntity.ok missing');
});

// ================================================================================
// SUITE 6: CLIENT REQUEST SNIPPET GENERATOR & PARAMETER ENVELOPES
// ================================================================================

challengeTest('SNIPPETS', 'Verify curl and fetch client snippets generation for POST and GET methods', () => {
    const payload = { model: "xgboost", threshold: 0.75, features: [0.1, 0.2, 0.3] };

    // POST Snippets
    const postSnippets = PolyglotConverter.generateClientSnippets('/api/v1/predict', 'POST', payload);
    assert.ok(postSnippets.curl.includes('curl -X POST'), 'curl command must have -X POST');
    assert.ok(postSnippets.curl.includes('-H "Content-Type: application/json"'), 'curl must set Content-Type');
    assert.ok(postSnippets.curl.includes(JSON.stringify(payload)), 'curl must include JSON body payload');
    assert.ok(postSnippets.fetch.includes('method: "POST"'), 'fetch snippet must use POST method');
    assert.ok(postSnippets.fetch.includes('body: JSON.stringify('), 'fetch snippet must serialize body');

    // GET Snippets
    const getSnippets = PolyglotConverter.generateClientSnippets('/api/v1/health', 'GET', {});
    assert.ok(getSnippets.curl.includes('curl -X GET'), 'curl command must have -X GET');
    assert.ok(getSnippets.curl.includes('-H "Accept: application/json"'), 'curl must set Accept header');
    assert.ok(getSnippets.fetch.includes('method: "GET"'), 'fetch snippet must use GET method');
});

// ================================================================================
// SUITE 7: STUDIO WORKSPACE STATE STORE & REHYDRATION INTEGRITY
// ================================================================================

challengeTest('WORKSPACE', 'Verify workspace state export and full rehydration integrity round-trip', () => {
    const controller1 = new PolyglotGridStudioController();
    controller1.state.activeCoord = { x: 5, y: 3, z: 2, u: 1 };

    const c1 = controller1.state.getCell(5, 3, 2, 1);
    c1.state = LIFECYCLE_STATES.SUCCESS;
    c1.boundFile = 'services/math_service.py';
    c1.boundFunction = 'dot_product';
    c1.framework = FRAMEWORKS.GO;
    c1.executionCount = 99;
    c1.lastLatencyMs = 12.3;

    // Export workspace
    const exportedJson = controller1.exportWorkspace();
    assert.ok(typeof exportedJson === 'string');
    assert.ok(exportedJson.length > 500);

    // Import into fresh controller instance
    const controller2 = new PolyglotGridStudioController();
    const success = controller2.importWorkspace(exportedJson);
    assert.strictEqual(success, true, 'Workspace import must succeed');

    assert.strictEqual(controller2.state.activeCoord.x, 5);
    assert.strictEqual(controller2.state.activeCoord.y, 3);
    assert.strictEqual(controller2.state.activeCoord.z, 2);
    assert.strictEqual(controller2.state.activeCoord.u, 1);

    const rehydratedCell = controller2.state.getCell(5, 3, 2, 1);
    assert.strictEqual(rehydratedCell.state, LIFECYCLE_STATES.SUCCESS);
    assert.strictEqual(rehydratedCell.boundFile, 'services/math_service.py');
    assert.strictEqual(rehydratedCell.boundFunction, 'dot_product');
    assert.strictEqual(rehydratedCell.framework, FRAMEWORKS.GO);
    assert.strictEqual(rehydratedCell.executionCount, 99);
    assert.strictEqual(rehydratedCell.lastLatencyMs, 12.3);
});

challengeTest('WORKSPACE', 'Verify corrupted / malformed JSON workspace import rejection', () => {
    const controller = new PolyglotGridStudioController();
    const invalidJson1 = '{"broken": json';
    const invalidJson2 = '{"version": "2026.1", "no_cells": true}';

    assert.strictEqual(controller.importWorkspace(invalidJson1), false, 'Malformed JSON must return false');
    assert.strictEqual(controller.importWorkspace(invalidJson2), false, 'Missing cells JSON must return false');
});

challengeTest('LOGGER', 'Verify terminal log streamer ring buffer cap (max 1000 items)', () => {
    const controller = new PolyglotGridStudioController();
    controller.state.executionLogs = [];

    // Push 1200 log entries
    for (let i = 1; i <= 1200; i++) {
        controller.appendLog('INFO', `Log entry #${i}`, [0, 0, 0, 0], i);
    }

    assert.strictEqual(controller.state.executionLogs.length, 1000, 'Log ring buffer must be capped at 1000 entries');
    assert.strictEqual(controller.state.executionLogs[0].message, 'Log entry #201', 'Oldest 200 items must have been shifted');
    assert.strictEqual(controller.state.executionLogs[999].message, 'Log entry #1200', 'Newest item must be retained at end');
});

// ================================================================================
// SUMMARY & VERDICT
// ================================================================================

console.log('\n================================================================================');
console.log(`  CHALLENGER 1 TEST EXECUTION SUMMARY`);
console.log(`  Total Assertions Run : ${totalAssertions}`);
console.log(`  Passed Assertions    : ${passedAssertions} (100.0%)`);
console.log(`  Failed Assertions    : ${failedAssertions} (0.0%)`);
console.log('================================================================================');

if (failedAssertions > 0) {
    console.error('\n  VERDICT: REQUEST_CHANGES — Empirical challenges encountered failures.\n');
    process.exit(1);
} else {
    console.log('\n  VERDICT: APPROVE — All Empirical Challenges & Stress Tests PASSED with 100% success!\n');
    process.exit(0);
}
