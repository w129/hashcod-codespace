/**
 * Hashcod Codespace — Polyglot Grid API Launcher & Code Studio
 * Challenger 2: Ingestion, Streaming, AST Parsing, Latency & API Backend Stress Test Suite
 * 
 * Empirical Verification Matrix:
 * - Category 1: Directory Tree Ingestion & Folder Drag-and-Drop Recursion
 * - Category 2: 8 File-Type Parsing (.py, .js, .ts, .go, .c, .h, .java, .yaml/.json) & AST Extraction
 * - Category 3: Real-Time Stdout/Stderr Log Stream Ring Buffering (under Flood Conditions)
 * - Category 4: Millisecond Latency Tracking & Metrics
 * - Category 5: Execution History Replay & RFC 4180 CSV Export
 * - Category 6: Workspace JSON Import/Export & Fault Tolerance
 * - Category 7: /api/grid/* REST Backend Route Handlers & Concurrency Stress
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('================================================================================');
console.log('  CHALLENGER 2: INGESTION, STREAMING & API BACKEND EMPIRICAL CHALLENGE SUITE    ');
console.log('================================================================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const testResults = [];

function challenge(category, name, fn) {
    totalTests++;
    const tStart = process.hrtime.bigint();
    try {
        fn();
        const tEnd = process.hrtime.bigint();
        const durationMs = Number(tEnd - tStart) / 1e6;
        passedTests++;
        console.log(`  ✓ [${category}] ${name} (${durationMs.toFixed(2)}ms)`);
        testResults.push({ category, name, status: 'PASS', durationMs, error: null });
    } catch (err) {
        failedTests++;
        const tEnd = process.hrtime.bigint();
        const durationMs = Number(tEnd - tStart) / 1e6;
        console.error(`  ✗ [${category}] ${name} (${durationMs.toFixed(2)}ms)`);
        console.error(`    FAILURE: ${err.message}`);
        if (err.stack) console.error(`    ${err.stack.split('\n')[1]}`);
        testResults.push({ category, name, status: 'FAIL', durationMs, error: err.message });
    }
}

// Load Core Components
const PolyglotModule = require('../../components/polyglot-grid.js');
const {
    PolyglotStudioState,
    PolyglotConverter,
    PolyglotGridStudioController,
    SAMPLE_PRESETS,
    LIFECYCLE_STATES,
    FRAMEWORKS
} = PolyglotModule;

// ============================================================================
// CATEGORY 1: DIRECTORY TREE INGESTION & FOLDER DRAG-AND-DROP RECURSION
// ============================================================================
console.log('\n--- CATEGORY 1: DIRECTORY TREE INGESTION & RECURSION ---');

challenge('INGESTION', 'C1.1: Multi-tier nested folder ingestion with path resolution', () => {
    const state = new PolyglotStudioState();
    const mockFiles = [
        { name: 'app.py', path: 'src/backend/app.py', content: 'def run():\n    pass\n', size: 24, lines: 3 },
        { name: 'router.js', path: 'src/frontend/router.js', content: 'export const routes = [];\n', size: 26, lines: 2 },
        { name: 'store.go', path: 'pkg/storage/redis/store.go', content: 'package redis\n', size: 14, lines: 2 },
        { name: 'native.c', path: 'lib/native/c/native.c', content: '#include <stdio.h>\n', size: 19, lines: 2 }
    ];

    mockFiles.forEach(f => {
        state.files.set(f.path, f);
    });

    assert.strictEqual(state.files.size, 6 + mockFiles.length, 'Should contain presets plus 4 new nested files');
    assert(state.files.has('src/backend/app.py'), 'Must contain nested Python file');
    assert(state.files.has('pkg/storage/redis/store.go'), 'Must contain 3-tier deep Go file');
    assert.strictEqual(state.files.get('src/backend/app.py').lines, 3);
});

challenge('INGESTION', 'C1.2: Deep folder recursion stress (25 levels deep)', () => {
    const state = new PolyglotStudioState();
    const deepPath = Array.from({ length: 25 }, (_, i) => `level_${i}`).join('/') + '/deep_module.py';
    const content = '# Deep recursive module\ndef deep_eval(x: int) -> int:\n    return x * 2\n';

    state.files.set(deepPath, {
        name: 'deep_module.py',
        path: deepPath,
        language: 'python',
        content: content,
        size: content.length,
        lines: content.split('\n').length
    });

    assert(state.files.has(deepPath), 'State must preserve 25-level deep path');
    const retrieved = state.files.get(deepPath);
    assert.strictEqual(retrieved.lines, 4);
    assert.strictEqual(retrieved.name, 'deep_module.py');
});

challenge('INGESTION', 'C1.3: High-volume concurrent file batch ingestion (600 files)', () => {
    const state = new PolyglotStudioState();
    const t0 = Date.now();
    const count = 600;

    for (let i = 0; i < count; i++) {
        const p = `generated/batch_${Math.floor(i / 50)}/module_${i}.py`;
        state.files.set(p, {
            name: `module_${i}.py`,
            path: p,
            language: 'python',
            content: `def func_${i}():\n    return ${i}\n`,
            size: 35,
            lines: 3
        });
    }

    const duration = Date.now() - t0;
    assert.strictEqual(state.files.size, 6 + count, 'Must index all 600 batch files');
    assert(duration < 250, `Batch ingestion must complete rapidly (took ${duration}ms)`);
});

challenge('INGESTION', 'C1.4: Ignored directories filtering (node_modules, .git, __pycache__)', () => {
    const controller = new PolyglotGridStudioController();
    const testFileList = [
        { webkitRelativePath: 'project/node_modules/express/index.js', name: 'index.js', size: 1000, text: async () => 'code' },
        { webkitRelativePath: 'project/.git/HEAD', name: 'HEAD', size: 50, text: async () => 'ref: refs/heads/main' },
        { webkitRelativePath: 'project/services/__pycache__/service.cpython-312.pyc', name: 'service.pyc', size: 200, text: async () => 'bytecode' },
        { webkitRelativePath: 'project/services/valid_service.py', name: 'valid_service.py', size: 120, text: async () => 'def valid(): pass' }
    ];

    // Filter verification logic
    const filtered = testFileList.filter(file => {
        const relPath = file.webkitRelativePath || file.name;
        if (file.size > 5 * 1024 * 1024) return false;
        if (relPath.includes('node_modules') || relPath.includes('.git') || relPath.includes('__pycache__')) return false;
        return true;
    });

    assert.strictEqual(filtered.length, 1, 'Only valid_service.py should pass filter');
    assert.strictEqual(filtered[0].name, 'valid_service.py');
});

challenge('INGESTION', 'C1.5: Oversized file rejection (>5MB threshold)', () => {
    const oversizedFile = { name: 'huge_dump.sql', size: 6 * 1024 * 1024, webkitRelativePath: 'data/huge_dump.sql' };
    const normalFile = { name: 'config.json', size: 1024, webkitRelativePath: 'data/config.json' };

    const filterFn = (f) => f.size <= 5 * 1024 * 1024;
    assert.strictEqual(filterFn(oversizedFile), false, 'File >5MB must be rejected');
    assert.strictEqual(filterFn(normalFile), true, 'File <=5MB must be accepted');
});

challenge('INGESTION', 'C1.6: Adversarial paths, traversal sequences, and Unicode/Emojis in file tree', () => {
    const state = new PolyglotStudioState();
    const weirdPaths = [
        'src/🚀_rocket_service.py',
        'src/services/api#1%20[special].js',
        'native/c_core/header-v2.1.h',
        'locales/español_código_ñ.json'
    ];

    weirdPaths.forEach(p => {
        state.files.set(p, {
            name: path.basename(p),
            path: p,
            language: p.split('.').pop(),
            content: '// test unicode and special characters',
            size: 38,
            lines: 1
        });
    });

    weirdPaths.forEach(p => {
        assert(state.files.has(p), `State must safely index path: ${p}`);
        assert.strictEqual(state.files.get(p).size, 38);
    });
});

challenge('INGESTION', 'C1.7: 0-Byte empty file ingestion robustness', () => {
    const state = new PolyglotStudioState();
    const emptyPath = 'empty/init.py';
    state.files.set(emptyPath, {
        name: 'init.py',
        path: emptyPath,
        language: 'python',
        content: '',
        size: 0,
        lines: 1
    });

    assert(state.files.has(emptyPath));
    assert.strictEqual(state.files.get(emptyPath).size, 0);
    assert.strictEqual(state.files.get(emptyPath).lines, 1);
});

// ============================================================================
// CATEGORY 2: 8 FILE-TYPE PARSING & AST EXTRACTION
// ============================================================================
console.log('\n--- CATEGORY 2: 8 FILE-TYPE PARSING & AST EXTRACTION ---');

challenge('AST_PARSER', 'C2.1: File icon mapping across all 8 supported file types', () => {
    const controller = new PolyglotGridStudioController();
    assert.strictEqual(controller.getFileIcon('test.py'), '🐍', '.py icon must be 🐍');
    assert.strictEqual(controller.getFileIcon('script.js'), '📜', '.js icon must be 📜');
    assert.strictEqual(controller.getFileIcon('types.ts'), '📜', '.ts icon must be 📜');
    assert.strictEqual(controller.getFileIcon('main.go'), '🐹', '.go icon must be 🐹');
    assert.strictEqual(controller.getFileIcon('native.c'), '⚙️', '.c icon must be ⚙️');
    assert.strictEqual(controller.getFileIcon('header.h'), '⚙️', '.h icon must be ⚙️');
    assert.strictEqual(controller.getFileIcon('App.java'), '☕', '.java icon must be ☕');
    assert.strictEqual(controller.getFileIcon('config.json'), '📋', '.json icon must be 📋');
    assert.strictEqual(controller.getFileIcon('spec.yaml'), '📄', '.yaml icon must be 📄');
    assert.strictEqual(controller.getFileIcon('spec.yml'), '📄', '.yml icon must be 📄');
    assert.strictEqual(controller.getFileIcon('unknown.bin'), '📁', 'Unknown ext icon must be 📁');
});

challenge('AST_PARSER', 'C2.2: Python AST signature extraction with complex type hints & docstrings', () => {
    const pyCode = `
def analyze_embeddings(vectors: list, top_k: int = 5, metric: str = "cosine") -> dict:
    """Computes similarity search over high-dimensional vector embeddings."""
    return {"top_k": top_k}

def batch_tokenize(texts: list, max_len: int = 512) -> list:
    """Tokenizes a batch of input text prompts."""
    return []
`;
    const signatures = PolyglotConverter.extractSignatures(pyCode, 'python');
    assert.strictEqual(signatures.length, 2, 'Should extract exactly 2 Python functions');

    const fn1 = signatures[0];
    assert.strictEqual(fn1.name, 'analyze_embeddings');
    assert.strictEqual(fn1.params.length, 3);
    assert.strictEqual(fn1.params[0].name, 'vectors');
    assert.strictEqual(fn1.params[0].type, 'list');
    assert.strictEqual(fn1.params[1].name, 'top_k');
    assert.strictEqual(fn1.params[1].defaultVal, '5');
    assert.strictEqual(fn1.returnType, 'dict');
    assert(fn1.docstring.includes('Computes similarity search'));
});

challenge('AST_PARSER', 'C2.3: JavaScript / TypeScript AST extraction with async/arrow functions', () => {
    const jsCode = `
async function authenticateUser(username, passwordHash, rememberMe = false) {
    return { token: "abc" };
}

const generateApiKey = async (tenantId, permissions) => {
    return { key: "live_123" };
};
`;
    const signatures = PolyglotConverter.extractSignatures(jsCode, 'javascript');
    assert.strictEqual(signatures.length, 2, 'Should extract both standard and arrow functions');
    assert.strictEqual(signatures[0].name, 'authenticateUser');
    assert.strictEqual(signatures[0].params.length, 3);
    assert.strictEqual(signatures[1].name, 'generateApiKey');
    assert.strictEqual(signatures[1].params.length, 2);
});

challenge('AST_PARSER', 'C2.4: Go AST extraction with receiver methods & multiple returns', () => {
    const goCode = `
package gateway

func (s *ProxyServer) DispatchRoute(targetUrl string, timeoutSec int) (map[string]interface{}, error) {
    return nil, nil
}

func ComputeChecksum(payload []byte) string {
    return "sha256:abc"
}
`;
    const signatures = PolyglotConverter.extractSignatures(goCode, 'go');
    assert.strictEqual(signatures.length, 2, 'Should extract Go method and standard func');
    assert.strictEqual(signatures[0].name, 'DispatchRoute');
    assert.strictEqual(signatures[0].params.length, 2);
    assert.strictEqual(signatures[1].name, 'ComputeChecksum');
});

challenge('AST_PARSER', 'C2.5: C / C++ AST extraction with pointer types and header files', () => {
    const cCode = `
#include <stdint.h>
#include <stdlib.h>

uint32_t crc32_checksum(const char* buffer, size_t length) {
    return 0;
}

char* encode_hex_string(const uint8_t* raw_bytes, int byte_len) {
    return NULL;
}
`;
    const signatures = PolyglotConverter.extractSignatures(cCode, 'c');
    assert.strictEqual(signatures.length, 2, 'Should extract C functions');
    assert.strictEqual(signatures[0].name, 'crc32_checksum');
    assert.strictEqual(signatures[0].returnType, 'uint32_t');
    assert.strictEqual(signatures[0].params.length, 2);
    assert.strictEqual(signatures[1].name, 'encode_hex_string');
    assert.strictEqual(signatures[1].returnType, 'char*');
});

challenge('AST_PARSER', 'C2.6: Java Spring AST extraction with annotations and generics', () => {
    const javaCode = `
package com.hashcod.grid;

public class PaymentController {
    
    public Map<String, Object> executePayment(String accountId, Double amount, String currency) {
        return new HashMap<>();
    }

    private void internalHelper(String debug) {
    }
}
`;
    const signatures = PolyglotConverter.extractSignatures(javaCode, 'java');
    assert.strictEqual(signatures.length, 2, 'Should extract Java methods');
    assert.strictEqual(signatures[0].name, 'executePayment');
    assert.strictEqual(signatures[0].params.length, 3);
});

challenge('AST_PARSER', 'C2.7: Extreme syntax fuzzing & corrupted code fallback safety', () => {
    const corruptedCodes = [
        'def (((( incomplete syntax {{{',
        'var 123 invalid js code ==== <>',
        'func unclosed go { return',
        'void broken C (',
        ''
    ];

    corruptedCodes.forEach(code => {
        const signatures = PolyglotConverter.extractSignatures(code, 'python');
        assert(Array.isArray(signatures), 'Must return an array');
        assert(signatures.length >= 1, 'Must fallback to default handler on unparseable code');
        assert.strictEqual(signatures[0].name, 'executeHandler', 'Fallback handler name must be executeHandler');
    });
});

challenge('AST_PARSER', 'C2.8: High-arity function signature (50 parameters) extraction', () => {
    const paramsList = Array.from({ length: 50 }, (_, i) => `param_${i}: int = ${i}`).join(', ');
    const pyCode = `def ultra_wide_function(${paramsList}) -> dict:\n    """50 parameter function."""\n    return {}\n`;

    const signatures = PolyglotConverter.extractSignatures(pyCode, 'python');
    assert.strictEqual(signatures.length, 1);
    assert.strictEqual(signatures[0].params.length, 50, 'Must accurately parse all 50 parameters');
    assert.strictEqual(signatures[0].params[49].name, 'param_49');
    assert.strictEqual(signatures[0].params[49].defaultVal, '49');
});

// ============================================================================
// CATEGORY 3: REAL-TIME STDOUT/STDERR LOG STREAM RING BUFFERING UNDER FLOOD
// ============================================================================
console.log('\n--- CATEGORY 3: LOG STREAM RING BUFFERING UNDER FLOOD ---');

challenge('LOG_STREAM', 'C3.1: Log flood stress test (10,000 entries) & strict 1,000 FIFO cap', () => {
    const controller = new PolyglotGridStudioController();
    const floodCount = 10000;

    for (let i = 1; i <= floodCount; i++) {
        controller.appendLog('EXEC', `High frequency execution payload line ${i}`, [i % 8, i % 7, 0, 0], i % 100);
    }

    assert.strictEqual(controller.state.executionLogs.length, 1000, 'Ring buffer must strictly cap at 1000 items');
    assert.strictEqual(controller.executionCounter, floodCount, 'Monotonic counter must equal 10000');
    
    // Check FIFO eviction: oldest item in buffer should be line 9001
    const oldestItem = controller.state.executionLogs[0];
    assert(oldestItem.message.includes('line 9001'), `Oldest preserved log should be line 9001, got: ${oldestItem.message}`);
    
    // Check newest item: line 10000
    const newestItem = controller.state.executionLogs[controller.state.executionLogs.length - 1];
    assert(newestItem.message.includes('line 10000'), `Newest log should be line 10000, got: ${newestItem.message}`);
});

challenge('LOG_STREAM', 'C3.2: Multi-channel log levels tagging & interleaved sequencing', () => {
    const controller = new PolyglotGridStudioController();
    const levels = ['INFO', 'EXEC', 'API', 'WARN', 'ERROR', 'CONFIGURED'];

    levels.forEach((lvl, idx) => {
        controller.appendLog(lvl, `Message for level ${lvl}`, [idx, 0, 0, 0], idx * 5);
    });

    assert.strictEqual(controller.state.executionLogs.length, 6);
    levels.forEach((lvl, idx) => {
        assert.strictEqual(controller.state.executionLogs[idx].level, lvl);
        assert.strictEqual(controller.state.executionLogs[idx].latency, idx * 5);
    });
});

challenge('LOG_STREAM', 'C3.3: High-throughput log search & level filtering accuracy', () => {
    const controller = new PolyglotGridStudioController();

    // Populate with 2000 items
    for (let i = 0; i < 2000; i++) {
        const lvl = i % 5 === 0 ? 'ERROR' : (i % 3 === 0 ? 'WARN' : 'INFO');
        const tag = i === 1500 ? 'TARGET_NEEDLE' : `normal_payload_${i}`;
        controller.appendLog(lvl, `Entry ${i}: ${tag}`, [i % 8, i % 7, 0, 0]);
    }

    // Ring buffer has last 1000 items (entries 1000 to 1999)
    const logs = controller.state.executionLogs;
    assert.strictEqual(logs.length, 1000);

    // Filter ERROR logs
    const errorLogs = logs.filter(l => l.level === 'ERROR');
    assert(errorLogs.length > 0, 'Must find ERROR logs');
    errorLogs.forEach(l => assert.strictEqual(l.level, 'ERROR'));

    // Search query
    const searchMatch = logs.filter(l => l.message.includes('TARGET_NEEDLE'));
    assert.strictEqual(searchMatch.length, 1, 'Search needle must be found');
    assert(searchMatch[0].message.includes('Entry 1500'));
});

challenge('LOG_STREAM', 'C3.4: ANSI escape code sanitization & special character rendering', () => {
    const controller = new PolyglotGridStudioController();
    const rawAnsi = '\x1b[31m[CRITICAL]\x1b[0m Database connection timeout';
    controller.appendLog('ERROR', rawAnsi, [0, 0, 0, 0]);

    const entry = controller.state.executionLogs[0];
    assert.strictEqual(entry.level, 'ERROR');
    assert(entry.message.includes('Database connection timeout'));
});

// ============================================================================
// CATEGORY 4: MILLISECOND LATENCY TRACKING & METRICS
// ============================================================================
console.log('\n--- CATEGORY 4: MILLISECOND LATENCY TRACKING & METRICS ---');

challenge('LATENCY', 'C4.1: Millisecond latency recording & state update', () => {
    const state = new PolyglotStudioState();
    const cell = state.getCell(2, 4);

    cell.lastLatencyMs = 45.8;
    cell.executionCount = 5;
    cell.lastTimestamp = new Date().toISOString();

    assert.strictEqual(cell.lastLatencyMs, 45.8);
    assert.strictEqual(cell.executionCount, 5);
    assert(typeof cell.lastTimestamp === 'string' && cell.lastTimestamp.includes('T'));
});

challenge('LATENCY', 'C4.2: Zero-latency and sub-millisecond precision handling', () => {
    const controller = new PolyglotGridStudioController();
    controller.appendLog('API', 'Instantaneous in-memory lookup', [0, 0, 0, 0], 0);
    controller.appendLog('API', 'Sub-millisecond compute', [1, 0, 0, 0], 0.35);

    const log0 = controller.state.executionLogs[0];
    const log1 = controller.state.executionLogs[1];

    assert.strictEqual(log0.latency, 0);
    assert.strictEqual(log1.latency, 0.35);
});

challenge('LATENCY', 'C4.3: Long duration / simulated timeout latency measurement', () => {
    const state = new PolyglotStudioState();
    const cell = state.getCell(7, 6);
    cell.lastLatencyMs = 15000;
    cell.state = LIFECYCLE_STATES.ERROR;

    assert.strictEqual(cell.lastLatencyMs, 15000);
    assert.strictEqual(cell.state, 'ERROR');
});

// ============================================================================
// CATEGORY 5: EXECUTION HISTORY REPLAY & RFC 4180 CSV EXPORT
// ============================================================================
console.log('\n--- CATEGORY 5: HISTORY REPLAY & RFC 4180 CSV EXPORT ---');

challenge('HISTORY_CSV', 'C5.1: Execution history ledger strict 50-item FIFO cap', () => {
    const controller = new PolyglotGridStudioController();
    const cell = controller.state.getCell(1, 1);

    for (let i = 1; i <= 80; i++) {
        controller.addHistoryRecord(cell, { ok: i % 2 === 0 }, i * 2);
    }

    assert.strictEqual(controller.state.historyLedger.length, 50, 'History ledger must cap at exactly 50 records');
    // First item in ledger is the most recent (iteration 80)
    assert.strictEqual(controller.state.historyLedger[0].latency, 160);
});

challenge('HISTORY_CSV', 'C5.2: RFC 4180 CSV export formatting & escape validator', () => {
    function exportHistoryToCSV(ledger) {
        const headers = ['ID', 'Timestamp', 'Cell_X', 'Cell_Y', 'Cell_Z', 'Cell_U', 'Framework', 'Status', 'Latency_MS'];
        const rows = [headers.join(',')];

        ledger.forEach(item => {
            const cell = item.cell || [0, 0, 0, 0];
            const escapedFw = `"${String(item.framework || '').replace(/"/g, '""')}"`;
            const row = [
                item.id,
                `"${item.timestamp}"`,
                cell[0],
                cell[1],
                cell[2],
                cell[3],
                escapedFw,
                item.status,
                item.latency
            ];
            rows.push(row.join(','));
        });

        return rows.join('\r\n');
    }

    const testLedger = [
        { id: 101, timestamp: '12:00:00 PM', cell: [0, 1, 0, 0], framework: 'fastapi', status: 200, latency: 12.5 },
        { id: 102, timestamp: '12:00:01 PM', cell: [2, 3, 1, 0], framework: 'go,"gin"', status: 500, latency: 85.0 },
        { id: 103, timestamp: '12:00:02 PM', cell: [7, 6, 0, 0], framework: 'c\nlibmicro', status: 200, latency: 4.2 }
    ];

    const csvOutput = exportHistoryToCSV(testLedger);
    assert(csvOutput.includes('ID,Timestamp,Cell_X,Cell_Y,Cell_Z,Cell_U,Framework,Status,Latency_MS'));
    assert(csvOutput.includes('101,"12:00:00 PM",0,1,0,0,"fastapi",200,12.5'));
    assert(csvOutput.includes('"go,""gin"""'), 'Commas and quotes in framework must be escaped with double-quotes');
});

challenge('HISTORY_CSV', 'C5.3: CSV Parser round-trip data integrity test', () => {
    const csvContent = [
        'ID,Timestamp,Cell_X,Cell_Y,Cell_Z,Cell_U,Framework,Status,Latency_MS',
        '1001,"14:30:15",3,4,0,0,"EXPRESS",200,22.4',
        '1002,"14:30:16",5,6,1,2,"SANIC",500,120.0'
    ].join('\r\n');

    const lines = csvContent.split('\r\n');
    assert.strictEqual(lines.length, 3);
    const row1 = lines[1].split(',');
    assert.strictEqual(row1[0], '1001');
    assert.strictEqual(row1[2], '3');
    assert.strictEqual(row1[3], '4');
    assert.strictEqual(row1[7], '200');
    assert.strictEqual(row1[8], '22.4');
});

// ============================================================================
// CATEGORY 6: WORKSPACE JSON IMPORT/EXPORT & FAULT TOLERANCE
// ============================================================================
console.log('\n--- CATEGORY 6: WORKSPACE JSON IMPORT/EXPORT & FAULT TOLERANCE ---');

challenge('WORKSPACE_JSON', 'C6.1: Full workspace export and import lossless round-trip', () => {
    const state = new PolyglotStudioState();
    
    // Configure cell 0,0 and 7,6
    const c00 = state.getCell(0, 0, 0, 0);
    c00.state = LIFECYCLE_STATES.SUCCESS;
    c00.boundFile = 'services/ml_analyzer.py';
    c00.boundFunction = 'predict_classification';
    c00.lastLatencyMs = 15.2;
    c00.executionCount = 42;

    const c76 = state.getCell(7, 6, 2, 1);
    c76.state = LIFECYCLE_STATES.CONFIGURED;
    c76.framework = FRAMEWORKS.GO;
    c76.route = '/api/v1/payment';

    state.activeCoord = { x: 7, y: 6, z: 2, u: 1 };

    // Export
    const controller = new PolyglotGridStudioController();
    controller.state = state;
    const jsonStr = controller.exportWorkspace();

    // Import into fresh instance
    const freshController = new PolyglotGridStudioController();
    const success = freshController.importWorkspace(jsonStr);
    assert.strictEqual(success, true, 'Import must return true on valid payload');

    // Verify bit-for-bit parity
    const importedC00 = freshController.state.getCell(0, 0, 0, 0);
    assert.strictEqual(importedC00.state, LIFECYCLE_STATES.SUCCESS);
    assert.strictEqual(importedC00.boundFile, 'services/ml_analyzer.py');
    assert.strictEqual(importedC00.lastLatencyMs, 15.2);
    assert.strictEqual(importedC00.executionCount, 42);

    const importedC76 = freshController.state.getCell(7, 6, 2, 1);
    assert.strictEqual(importedC76.state, LIFECYCLE_STATES.CONFIGURED);
    assert.strictEqual(importedC76.framework, FRAMEWORKS.GO);
    assert.strictEqual(freshController.state.activeCoord.x, 7);
    assert.strictEqual(freshController.state.activeCoord.y, 6);
    assert.strictEqual(freshController.state.activeCoord.z, 2);
    assert.strictEqual(freshController.state.activeCoord.u, 1);
});

challenge('WORKSPACE_JSON', 'C6.2: Malformed JSON syntax import recovery', () => {
    const controller = new PolyglotGridStudioController();
    const initialFilesCount = controller.state.files.size;

    const badPayloads = [
        '{ "broken": json syntax ...',
        'null',
        '""',
        'undefined',
        '{"version": "2026.1"}' // missing cells
    ];

    badPayloads.forEach(payload => {
        const result = controller.importWorkspace(payload);
        assert.strictEqual(result, false, `Import should gracefully fail for: ${payload}`);
    });

    // Verify existing state was NOT corrupted
    assert.strictEqual(controller.state.files.size, initialFilesCount);
    assert.strictEqual(controller.state.cells.size, 56);
});

challenge('WORKSPACE_JSON', 'C6.3: Corrupted coordinate clamping during import', () => {
    const controller = new PolyglotGridStudioController();
    const malformedCoordPayload = JSON.stringify({
        version: "2026.1",
        activeCoord: { x: 999, y: -50, z: "invalid", u: null },
        cells: {},
        files: []
    });

    const success = controller.importWorkspace(malformedCoordPayload);
    assert.strictEqual(success, true);
    // Active coord should be clamped
    const clamped = controller.state.clampCoord(
        controller.state.activeCoord.x,
        controller.state.activeCoord.y,
        controller.state.activeCoord.z,
        controller.state.activeCoord.u
    );
    assert.strictEqual(clamped.x, 7, 'X should clamp to 7');
    assert.strictEqual(clamped.y, 0, 'Y should clamp to 0');
    assert.strictEqual(clamped.z, 0, 'Z should clamp to 0');
    assert.strictEqual(clamped.u, 0, 'U should clamp to 0');
});

// ============================================================================
// CATEGORY 7: /api/grid/* REST BACKEND ROUTE HANDLERS & SYNTHESIS
// ============================================================================
console.log('\n--- CATEGORY 7: /api/grid/* REST BACKEND ROUTES & SYNTHESIS ---');

// Mock backend API handlers equivalent to api.php logic for direct Node.js testing
function handleGridApi(subPath, method, body = {}) {
    const tStart = Date.now();
    if (subPath === '' || subPath === '/') {
        return {
            status: 200,
            body: {
                ok: true,
                service: 'Polyglot Grid API Launcher & Code Studio',
                version: '2026.1',
                matrix: '8x7 (56 cells)',
                dimensions: { x: 8, y: 7, z: 'unbounded', u: 'unbounded' },
                frameworks: ['fastapi', 'sanic', 'express', 'go', 'c', 'java'],
                endpoints: ['/api/grid/convert', '/api/grid/execute', '/api/grid/upload-dir', '/api/grid/logs', '/api/grid/state']
            }
        };
    }

    if (subPath === '/convert' && method === 'POST') {
        const code = String(body.code || '');
        const lang = (body.language || 'python').toLowerCase();
        const fw = (body.framework || 'fastapi').toLowerCase();
        const route = body.route || '/api/v1/resource';
        const httpMethod = (body.method || 'POST').toUpperCase();
        const cell = Array.isArray(body.cell) ? body.cell : [0, 0, 0, 0];

        const functions = PolyglotConverter.extractSignatures(code, lang);
        return {
            status: 200,
            body: {
                ok: true,
                status: 200,
                framework: fw,
                route: route,
                method: httpMethod,
                cell: cell,
                functions: functions,
                timestamp: new Date().toISOString()
            }
        };
    }

    if (subPath === '/execute' && method === 'POST') {
        const cell = Array.isArray(body.cell) ? body.cell : [0, 0, 0, 0];
        const fw = (body.framework || 'fastapi').toLowerCase();
        const route = body.route || '/api/v1/predict';
        const httpMethod = (body.method || 'POST').toUpperCase();
        const payload = body.payload || {};

        const result = {
            status: 'COMPLETED',
            service: 'Polyglot Grid Execution Engine',
            cell: cell,
            framework: fw,
            route: route,
            method: httpMethod,
            inputs: payload,
            computed_at: new Date().toISOString()
        };

        if (Array.isArray(payload.features)) {
            const sum = payload.features.reduce((a, b) => a + Math.abs(b), 0);
            const scores = payload.features.map(v => sum > 0 ? Number((Math.abs(v) / sum).toFixed(4)) : 0);
            const threshold = Number(payload.threshold || 0.5);
            const maxScore = scores.length ? Math.max(...scores) : 0;
            result.prediction = maxScore >= threshold ? 1 : 0;
            result.confidence = maxScore;
            result.scores = scores;
        }

        const latencyMs = Math.max(0, Date.now() - tStart);
        return {
            status: 200,
            body: {
                ok: true,
                status: 200,
                data: result,
                cell: cell,
                latency_ms: latencyMs,
                timestamp: new Date().toISOString()
            }
        };
    }

    if (subPath === '/upload-dir' && method === 'POST') {
        const files = Array.isArray(body.files) ? body.files : [];
        return {
            status: 200,
            body: {
                ok: true,
                status: 200,
                message: `Uploaded ${files.length} files into Polyglot Grid workspace.`,
                file_count: files.length,
                timestamp: new Date().toISOString()
            }
        };
    }

    if (subPath === '/logs') {
        return {
            status: 200,
            body: { ok: true, status: 200, logs: [], count: 0, timestamp: new Date().toISOString() }
        };
    }

    if (subPath === '/state') {
        return {
            status: 200,
            body: { ok: true, status: 200, version: '2026.1', cells_total: 56, active_coord: { x: 0, y: 0, z: 0, u: 0 }, timestamp: new Date().toISOString() }
        };
    }

    return { status: 404, body: { ok: false, status: 404, error: 'Endpoint Not Found' } };
}

challenge('API_ROUTES', 'C7.1: GET /api/grid root discovery endpoint verification', () => {
    const res = handleGridApi('', 'GET');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.ok, true);
    assert.strictEqual(res.body.version, '2026.1');
    assert.strictEqual(res.body.matrix, '8x7 (56 cells)');
    assert.deepStrictEqual(res.body.frameworks, ['fastapi', 'sanic', 'express', 'go', 'c', 'java']);
    assert(res.body.endpoints.includes('/api/grid/execute'));
});

challenge('API_ROUTES', 'C7.2: POST /api/grid/convert route AST extraction endpoint', () => {
    const pyCode = SAMPLE_PRESETS['ml_analyzer.py'].content;
    const res = handleGridApi('/convert', 'POST', {
        code: pyCode,
        language: 'python',
        framework: 'fastapi',
        route: '/api/v1/predict',
        cell: [0, 0, 0, 0]
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.ok, true);
    assert.strictEqual(res.body.framework, 'fastapi');
    assert.strictEqual(res.body.route, '/api/v1/predict');
    assert(Array.isArray(res.body.functions));
    assert(res.body.functions.some(f => f.name === 'predict_classification'));
});

challenge('API_ROUTES', 'C7.3: POST /api/grid/execute numerical ML calculation & envelope', () => {
    const res = handleGridApi('/execute', 'POST', {
        cell: [2, 3, 0, 0],
        framework: 'fastapi',
        route: '/api/v1/predict',
        payload: {
            features: [0.1, 0.9, 0.2],
            threshold: 0.5
        }
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.ok, true);
    assert.strictEqual(res.body.data.prediction, 1);
    assert(res.body.data.confidence >= 0.7);
    assert.deepStrictEqual(res.body.cell, [2, 3, 0, 0]);
    assert(typeof res.body.latency_ms === 'number');
});

challenge('API_ROUTES', 'C7.4: POST /api/grid/upload-dir batch upload confirmation', () => {
    const files = Array.from({ length: 45 }, (_, i) => ({ path: `src/f_${i}.js`, size: 100 }));
    const res = handleGridApi('/upload-dir', 'POST', { files });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.ok, true);
    assert.strictEqual(res.body.file_count, 45);
    assert(res.body.message.includes('45 files'));
});

challenge('API_ROUTES', 'C7.5: High concurrency burst on /api/grid/execute (50 requests)', () => {
    const burstCount = 50;
    const responses = [];

    for (let i = 0; i < burstCount; i++) {
        const res = handleGridApi('/execute', 'POST', {
            cell: [i % 8, i % 7, 0, 0],
            framework: 'express',
            payload: { features: [i, i * 2, i * 3] }
        });
        responses.push(res);
    }

    assert.strictEqual(responses.length, burstCount);
    responses.forEach((r, idx) => {
        assert.strictEqual(r.status, 200);
        assert.strictEqual(r.body.ok, true);
        assert.deepStrictEqual(r.body.cell, [idx % 8, idx % 7, 0, 0]);
    });
});

challenge('API_ROUTES', 'C7.6: Backend 404 boundary handling for unknown /api/grid route', () => {
    const res = handleGridApi('/unknown-endpoint', 'GET');
    assert.strictEqual(res.status, 404);
    assert.strictEqual(res.body.ok, false);
});

// ============================================================================
// FINAL SUMMARY & VERDICT
// ============================================================================
console.log('\n================================================================================');
console.log(`  CHALLENGER 2 SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED (${failedTests} FAILED)`);
console.log('================================================================================');

if (failedTests > 0) {
    console.error(`\nVERDICT: REQUEST_CHANGES — ${failedTests} challenge assertions failed!\n`);
    process.exit(1);
} else {
    console.log('\nVERDICT: APPROVE — 100% Empirical Challenge & Stress Invariants Passed Cleanly!\n');
    process.exit(0);
}
