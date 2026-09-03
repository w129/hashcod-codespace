/**
 * ============================================================================
 * HASHCOD CODESPACE — ADVERSARIAL STRESS TEST SUITE: NETWORK PARTITION,
 * PACKET FRAGMENTATION, ABRUPT CRASH & CANARY RECOVERY
 * ============================================================================
 * 
 * Target:
 * - tests/e2e/test_challenger_grpc_network_stress.js
 * 
 * Objectives:
 * 1. Empirically verify production components/grpc-client.js module loading integrity.
 * 2. Stress-test gRPC-Web 5-byte framing under extreme packet fragmentation:
 *    - 1-byte micro-fragments
 *    - Fragmented 5-byte headers (header split across TCP chunks)
 *    - 10,000 back-to-back frames with random packet boundaries
 * 3. Stress-test stream truncation (server EOF mid-header and mid-payload).
 * 4. Stress-test abrupt daemon crash mid-telemetry stream:
 *    - Live HTTP stream violently destroyed via socket.destroy()
 *    - Verify zero uncaught exceptions, clean fallback transition to REST_FALLBACK
 * 5. Stress-test canary health recovery:
 *    - Gateway resurrected on /health (HTTP 200)
 *    - Client promotes to GRPC_ONLINE
 *    - Telemetry continuation audit (detecting stream orphan bugs)
 * 6. High-throughput framing and fragmentation latency benchmark.
 * 
 * Run Command:
 * node tests/e2e/test_challenger_grpc_network_stress.js
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const assert = require('assert');
const crypto = require('crypto');

console.log('================================================================================');
console.log('  CHALLENGER 2: ADVERSARIAL STRESS HARNESS — NETWORK PARTITION & FALLBACK      ');
console.log('================================================================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const findings = [];

function runSyncTest(suite, name, fn) {
    totalTests++;
    const t0 = process.hrtime.bigint();
    try {
        fn();
        const t1 = process.hrtime.bigint();
        const ms = Number(t1 - t0) / 1e6;
        passedTests++;
        console.log(`  ✓ [${suite}] ${name} (${ms.toFixed(3)}ms)`);
        return true;
    } catch (err) {
        failedTests++;
        console.error(`  ✗ [${suite}] ${name}: ${err.message}`);
        findings.push({ suite, name, error: err.message, stack: err.stack });
        return false;
    }
}

async function runAsyncTest(suite, name, fn) {
    totalTests++;
    const t0 = process.hrtime.bigint();
    try {
        await fn();
        const t1 = process.hrtime.bigint();
        const ms = Number(t1 - t0) / 1e6;
        passedTests++;
        console.log(`  ✓ [${suite}] ${name} (${ms.toFixed(3)}ms)`);
        return true;
    } catch (err) {
        failedTests++;
        console.error(`  ✗ [${suite}] ${name}: ${err.message}`);
        findings.push({ suite, name, error: err.message, stack: err.stack });
        return false;
    }
}

// ============================================================================
// SUITE 1: PRODUCTION COMPONENT INTEGRITY AUDIT (components/grpc-client.js)
// ============================================================================
console.log('\n--- SUITE 1: Production Component Integrity Audit (components/grpc-client.js) ---');

const grpcClientPath = path.resolve(__dirname, '../../components/grpc-client.js');
let grpcClientRawCode = '';

runSyncTest('ComponentAudit', 'Source file components/grpc-client.js exists and is non-empty', () => {
    assert(fs.existsSync(grpcClientPath), `File not found at ${grpcClientPath}`);
    grpcClientRawCode = fs.readFileSync(grpcClientPath, 'utf8');
    assert(grpcClientRawCode.length > 5000, `Expected file to be >5KB, got ${grpcClientRawCode.length} bytes`);
});

runSyncTest('ComponentAudit', 'Audit for undeclared identifier encodeTelemetryChunk at export line 712', () => {
    // Check if encodeTelemetryChunk is exported
    const hasExport = grpcClientRawCode.includes('encodeTelemetryChunk,');
    // Check if encodeTelemetryChunk is defined
    const hasDefinition = /function\s+encodeTelemetryChunk\b/.test(grpcClientRawCode) ||
                          /const\s+encodeTelemetryChunk\b/.test(grpcClientRawCode) ||
                          /let\s+encodeTelemetryChunk\b/.test(grpcClientRawCode) ||
                          /var\s+encodeTelemetryChunk\b/.test(grpcClientRawCode);
    
    if (hasExport && !hasDefinition) {
        throw new Error('CRITICAL BUG DETECTED: encodeTelemetryChunk is listed in global.ProtobufCodec export at line 712 but is NEVER defined in components/grpc-client.js! Loading this file throws ReferenceError in strict mode.');
    }
});

runSyncTest('ComponentAudit', 'Attempt evaluation of components/grpc-client.js in isolated sandbox context', () => {
    const vm = require('vm');
    const sandbox = {
        window: {},
        document: {},
        console: console,
        TextEncoder: TextEncoder,
        TextDecoder: TextDecoder,
        Uint8Array: Uint8Array,
        DataView: DataView,
        BigInt: BigInt,
        Date: Date,
        Math: Math,
        parseInt: parseInt,
        decodeURIComponent: decodeURIComponent,
        module: { exports: {} },
        exports: {}
    };
    sandbox.global = sandbox.window;
    sandbox.globalThis = sandbox.window;

    let evalError = null;
    try {
        const script = new vm.Script(grpcClientRawCode, { filename: 'grpc-client.js' });
        const context = vm.createContext(sandbox);
        script.runInContext(context);
    } catch (e) {
        evalError = e;
    }

    if (evalError) {
        throw new Error(`CRITICAL EVAL ERROR in components/grpc-client.js: ${evalError.name}: ${evalError.message}`);
    }
    assert(sandbox.window.SecurityTransportClient, 'SecurityTransportClient was not exported to sandbox window');
});

// ============================================================================
// SUITE 2: 5-BYTE BINARY FRAMING & EXTREME PACKET FRAGMENTATION
// ============================================================================
console.log('\n--- SUITE 2: 5-Byte Binary Framing & Extreme Packet Fragmentation ---');

// Framing Implementation under test (reproducing the pure logic)
function packDataFrame(payload) {
    const p = payload instanceof Uint8Array ? payload : new Uint8Array(payload || 0);
    const len = p.length;
    const out = new Uint8Array(5 + len);
    out[0] = 0x00; // FrameFlagData
    out[1] = (len >>> 24) & 0xFF;
    out[2] = (len >>> 16) & 0xFF;
    out[3] = (len >>> 8) & 0xFF;
    out[4] = len & 0xFF;
    out.set(p, 5);
    return out;
}

function packTrailerFrame(str) {
    const p = new TextEncoder().encode(str || 'grpc-status: 0\r\ngrpc-message: OK\r\n');
    const len = p.length;
    const out = new Uint8Array(5 + len);
    out[0] = 0x80; // FrameFlagTrailers
    out[1] = (len >>> 24) & 0xFF;
    out[2] = (len >>> 16) & 0xFF;
    out[3] = (len >>> 8) & 0xFF;
    out[4] = len & 0xFF;
    out.set(p, 5);
    return out;
}

function unpackFrames(buf) {
    const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf || 0);
    const frames = [];
    let offset = 0;

    while (offset + 5 <= bytes.length) {
        const flag = bytes[offset];
        const length = (bytes[offset + 1] * 0x1000000) +
                       ((bytes[offset + 2] << 16) |
                        (bytes[offset + 3] << 8) |
                        bytes[offset + 4]);

        if (offset + 5 + length > bytes.length) break;

        const payload = bytes.subarray(offset + 5, offset + 5 + length);
        frames.push({
            flag,
            isData: flag === 0x00,
            isTrailer: flag === 0x80,
            length,
            payload
        });
        offset += 5 + length;
    }

    return { frames, remainder: bytes.subarray(offset) };
}

runSyncTest('FramingFragmentation', 'Single-byte streaming fragmentation across 1-byte chunks', () => {
    const samplePayload = new TextEncoder().encode('Hashcod-PQC-Telemetry-Payload-Fragment-Test-1234567890');
    const fullFrame = packDataFrame(samplePayload);

    let accumulated = new Uint8Array(0);
    const receivedFrames = [];

    // Deliver 1 byte at a time
    for (let i = 0; i < fullFrame.length; i++) {
        const chunk = fullFrame.subarray(i, i + 1);
        const next = new Uint8Array(accumulated.length + chunk.length);
        next.set(accumulated, 0);
        next.set(chunk, accumulated.length);
        accumulated = next;

        const { frames, remainder } = unpackFrames(accumulated);
        accumulated = remainder;
        for (const f of frames) receivedFrames.push(f);
    }

    assert.strictEqual(receivedFrames.length, 1, 'Expected exactly 1 frame recovered from 1-byte fragments');
    assert.strictEqual(accumulated.length, 0, 'Expected 0 remainder after stream finished');
    assert.deepStrictEqual(Array.from(receivedFrames[0].payload), Array.from(samplePayload));
});

runSyncTest('FramingFragmentation', 'Header fragmented across chunk boundaries (chunk 1: 3 bytes, chunk 2: 2 bytes + partial payload)', () => {
    const samplePayload = new Uint8Array([10, 20, 30, 40, 50, 60, 70, 80]);
    const fullFrame = packDataFrame(samplePayload); // 5 + 8 = 13 bytes total

    // Chunk 1: first 3 bytes of header
    const chunk1 = fullFrame.subarray(0, 3);
    const r1 = unpackFrames(chunk1);
    assert.strictEqual(r1.frames.length, 0, 'No frames should be decoded from 3 header bytes');
    assert.strictEqual(r1.remainder.length, 3);

    // Chunk 2: next 2 bytes of header + 4 bytes of payload (6 bytes)
    const chunk2 = fullFrame.subarray(3, 9);
    const acc2 = new Uint8Array(r1.remainder.length + chunk2.length);
    acc2.set(r1.remainder, 0);
    acc2.set(chunk2, r1.remainder.length);
    const r2 = unpackFrames(acc2);
    assert.strictEqual(r2.frames.length, 0, 'Frame incomplete (needs 4 more bytes of payload)');
    assert.strictEqual(r2.remainder.length, 9);

    // Chunk 3: remaining 4 bytes of payload
    const chunk3 = fullFrame.subarray(9);
    const acc3 = new Uint8Array(r2.remainder.length + chunk3.length);
    acc3.set(r2.remainder, 0);
    acc3.set(chunk3, r2.remainder.length);
    const r3 = unpackFrames(acc3);

    assert.strictEqual(r3.frames.length, 1, 'Frame should be fully recovered after chunk 3');
    assert.strictEqual(r3.remainder.length, 0);
    assert.deepStrictEqual(Array.from(r3.frames[0].payload), Array.from(samplePayload));
});

runSyncTest('FramingFragmentation', 'Multiplexed multi-frame stream with back-to-back data and trailer frames split across random MTU cuts', () => {
    const f1 = packDataFrame(new TextEncoder().encode('TELEMETRY_CHUNK_1'));
    const f2 = packDataFrame(new TextEncoder().encode('TELEMETRY_CHUNK_2_LONGER_PAYLOAD_STRING'));
    const f3 = packTrailerFrame('grpc-status: 0\r\ngrpc-message: OK\r\n');
    
    // Concatenate all 3 frames
    const combined = new Uint8Array(f1.length + f2.length + f3.length);
    combined.set(f1, 0);
    combined.set(f2, f1.length);
    combined.set(f3, f1.length + f2.length);

    // Split across unusual chunk sizes: [7, 13, 5, 2, 11, remainder]
    const cuts = [7, 13, 5, 2, 11];
    let offset = 0;
    let accumulated = new Uint8Array(0);
    const recovered = [];

    for (const cut of cuts) {
        if (offset >= combined.length) break;
        const chunk = combined.subarray(offset, Math.min(combined.length, offset + cut));
        offset += cut;

        const next = new Uint8Array(accumulated.length + chunk.length);
        next.set(accumulated, 0);
        next.set(chunk, accumulated.length);
        accumulated = next;

        const { frames, remainder } = unpackFrames(accumulated);
        accumulated = remainder;
        for (const f of frames) recovered.push(f);
    }
    // Append any final remaining bytes
    if (offset < combined.length) {
        const finalChunk = combined.subarray(offset);
        const next = new Uint8Array(accumulated.length + finalChunk.length);
        next.set(accumulated, 0);
        next.set(finalChunk, accumulated.length);
        const { frames, remainder } = unpackFrames(next);
        accumulated = remainder;
        for (const f of frames) recovered.push(f);
    }

    assert.strictEqual(recovered.length, 3, 'All 3 frames must be successfully decoded');
    assert.strictEqual(accumulated.length, 0, 'No remainder left behind');
    assert.strictEqual(recovered[0].isData, true);
    assert.strictEqual(recovered[1].isData, true);
    assert.strictEqual(recovered[2].isTrailer, true);
});

runSyncTest('FramingFragmentation', '10,000 frames under heavy random packet fragmentation stress (0% packet drop verification)', () => {
    const NUM_FRAMES = 10000;
    const allFrames = [];
    let totalPayloadBytes = 0;

    for (let i = 0; i < NUM_FRAMES; i++) {
        const payload = new Uint8Array([i & 0xFF, (i >> 8) & 0xFF, (i * 7) & 0xFF]);
        allFrames.push(packDataFrame(payload));
        totalPayloadBytes += payload.length;
    }

    // Combine all frames into single continuous buffer
    let totalLen = allFrames.reduce((sum, f) => sum + f.length, 0);
    const wireStream = new Uint8Array(totalLen);
    let wireOffset = 0;
    for (const f of allFrames) {
        wireStream.set(f, wireOffset);
        wireOffset += f.length;
    }

    // Stream with pseudo-random fragment sizes between 1 and 19 bytes
    let cursor = 0;
    let accumulated = new Uint8Array(0);
    let recoveredCount = 0;
    let rnd = 123456789;

    const tStart = process.hrtime.bigint();
    while (cursor < wireStream.length) {
        rnd = (rnd * 1103515245 + 12345) & 0x7FFFFFFF;
        const fragSize = 1 + (rnd % 19);
        const slice = wireStream.subarray(cursor, Math.min(wireStream.length, cursor + fragSize));
        cursor += slice.length;

        const next = new Uint8Array(accumulated.length + slice.length);
        next.set(accumulated, 0);
        next.set(slice, accumulated.length);
        accumulated = next;

        const { frames, remainder } = unpackFrames(accumulated);
        accumulated = remainder;
        recoveredCount += frames.length;
    }
    const tEnd = process.hrtime.bigint();
    const durationMs = Number(tEnd - tStart) / 1e6;
    const throughputKps = (NUM_FRAMES / (durationMs / 1000));

    assert.strictEqual(recoveredCount, NUM_FRAMES, `Expected ${NUM_FRAMES} frames, got ${recoveredCount}`);
    assert.strictEqual(accumulated.length, 0, `Expected 0 remainder, got ${accumulated.length}`);
    console.log(`    📊 Benchmark: Decoded ${NUM_FRAMES} fragmented frames in ${durationMs.toFixed(2)}ms (${throughputKps.toFixed(0)} frames/sec)`);
});

// ============================================================================
// SUITE 3: STREAM TRUNCATION & MALFORMED FRAMES
// ============================================================================
console.log('\n--- SUITE 3: Stream Truncation & Malformed Frames ---');

runSyncTest('StreamTruncation', 'Truncated header at EOF (only 4 bytes delivered, connection closed)', () => {
    const partialHeader = new Uint8Array([0x00, 0x00, 0x00, 0x00]);
    const { frames, remainder } = unpackFrames(partialHeader);
    assert.strictEqual(frames.length, 0, 'No frame decoded from 4 bytes');
    assert.strictEqual(remainder.length, 4, 'All 4 bytes held in remainder');
});

runSyncTest('StreamTruncation', 'Truncated payload at EOF (header says 50 bytes, but only 20 bytes received before EOF)', () => {
    const header = new Uint8Array([0x00, 0x00, 0x00, 0x00, 50]); // claims 50 bytes
    const partialBody = new Uint8Array(20);
    const combined = new Uint8Array(header.length + partialBody.length);
    combined.set(header, 0);
    combined.set(partialBody, 5);

    const { frames, remainder } = unpackFrames(combined);
    assert.strictEqual(frames.length, 0, 'Incomplete frame must not be emitted');
    assert.strictEqual(remainder.length, 25, 'Expected header (5) + partial (20) in remainder');
});

runSyncTest('StreamTruncation', 'Malformed frame with length claiming 4GB causes safe rejection without buffer overflow', () => {
    // 0x00 flag followed by 0x7FFFFFFF (2GB) length
    const hugeHeader = new Uint8Array([0x00, 0x7F, 0xFF, 0xFF, 0xFF]);
    const { frames, remainder } = unpackFrames(hugeHeader);
    assert.strictEqual(frames.length, 0, 'Oversized frame cannot decode');
    assert.strictEqual(remainder.length, 5, 'Remainder safely preserved');
});

// ============================================================================
// SUITE 4: ABRUPT DAEMON CRASH MID-STREAM & RESILIENT FALLBACK SIMULATION
// ============================================================================
console.log('\n--- SUITE 4: Abrupt Daemon Crash Mid-Stream & Resilient Fallback Simulation ---');

class MockTransportClient {
    constructor(gatewayUrl, restApiUrl) {
        this.gatewayUrl = gatewayUrl;
        this.restApiUrl = restApiUrl;
        this.state = 'GRPC_ONLINE';
        this.stats = {
            grpcCalls: 0,
            fallbackCalls: 0,
            tripsToFallback: 0,
            promotionsToGrpc: 0,
            telemetryChunksReceived: 0,
            restPollEventsReceived: 0
        };
        this.restPollTimer = null;
        this.activeListeners = [];
    }

    tripToFallback(reason) {
        if (this.state !== 'REST_FALLBACK') {
            this.state = 'REST_FALLBACK';
            this.stats.tripsToFallback++;
        }
    }

    promoteToGrpc() {
        if (this.state !== 'GRPC_ONLINE') {
            this.state = 'GRPC_ONLINE';
            this.stats.promotionsToGrpc++;
            if (this.restPollTimer) {
                clearTimeout(this.restPollTimer);
                this.restPollTimer = null;
            }
        }
    }
}

// Subtest: Spin up an ephemeral HTTP server on dynamic port, stream 2 frames, violently destroy socket
async function testAbruptDaemonCrash() {
    let serverSockets = [];
    let serverPort = 0;

    const crashServer = http.createServer((req, res) => {
        if (req.url.endsWith('/health')) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'HEALTHY' }));
            return;
        }

        if (req.url.includes('StreamSecurityTelemetry')) {
            res.writeHead(200, {
                'Content-Type': 'application/grpc-web+proto',
                'X-Grpc-Web': '1',
                'Transfer-Encoding': 'chunked'
            });

            // Write Chunk 1
            const c1 = packDataFrame(new TextEncoder().encode('CHUNK_1_LIVE_TELEMETRY'));
            res.write(c1);

            // Write Chunk 2
            const c2 = packDataFrame(new TextEncoder().encode('CHUNK_2_LIVE_TELEMETRY'));
            res.write(c2);

            // Violently destroy connection mid-stream after 30ms
            setTimeout(() => {
                for (const sock of serverSockets) {
                    sock.destroy(); // Sudden crash / SIGKILL / connection drop
                }
            }, 30);
        }
    });

    crashServer.on('connection', (sock) => {
        serverSockets.push(sock);
    });

    await new Promise(resolve => crashServer.listen(0, '127.0.0.1', () => {
        serverPort = crashServer.address().port;
        resolve();
    }));

    const client = new MockTransportClient(`http://127.0.0.1:${serverPort}`, 'http://127.0.0.1:8000');
    const receivedChunks = [];
    let caughtConnectionDrop = false;
    let errorObject = null;

    // Execute HTTP client request directly matching components/grpc-client.js streamGrpcWeb
    await new Promise((resolve) => {
        const req = http.request({
            hostname: '127.0.0.1',
            port: serverPort,
            path: '/hashcod.security.SecurityTelemetryService/StreamSecurityTelemetry',
            method: 'POST',
            headers: {
                'Content-Type': 'application/grpc-web+proto',
                'X-Grpc-Web': '1'
            }
        }, (res) => {
            let accumulated = new Uint8Array(0);

            res.on('data', (chunk) => {
                const next = new Uint8Array(accumulated.length + chunk.length);
                next.set(accumulated, 0);
                next.set(chunk, accumulated.length);
                accumulated = next;

                const { frames, remainder } = unpackFrames(accumulated);
                accumulated = remainder;
                for (const f of frames) {
                    if (f.isData) {
                        receivedChunks.push(new TextDecoder().decode(f.payload));
                        client.stats.telemetryChunksReceived++;
                    }
                }
            });

            res.on('error', (err) => {
                caughtConnectionDrop = true;
                errorObject = err;
                client.tripToFallback(err.message);
                resolve();
            });

            res.on('aborted', () => {
                caughtConnectionDrop = true;
                client.tripToFallback('stream aborted');
                resolve();
            });

            res.on('end', () => {
                // If stream ended abruptly without trailers
                if (accumulated.length > 0) {
                    caughtConnectionDrop = true;
                    client.tripToFallback('stream truncated');
                }
                resolve();
            });
        });

        req.on('error', (err) => {
            caughtConnectionDrop = true;
            errorObject = err;
            client.tripToFallback(err.message);
            resolve();
        });

        req.write(packDataFrame(new Uint8Array(0)));
        req.end();
    });

    crashServer.close();

    assert.strictEqual(receivedChunks.length, 2, `Expected 2 chunks before crash, received ${receivedChunks.length}`);
    assert.strictEqual(caughtConnectionDrop, true, 'Client must detect sudden connection drop');
    assert.strictEqual(client.state, 'REST_FALLBACK', 'Client must trip to REST_FALLBACK on connection destruction');
    assert.strictEqual(client.stats.tripsToFallback, 1, 'tripsToFallback stat counter must equal 1');
}

runAsyncTest('DaemonCrashFallback', 'Abrupt daemon death mid-telemetry stream trips cleanly to REST_FALLBACK without unhandled crash', async () => {
    await testAbruptDaemonCrash();
});

// ============================================================================
// SUITE 5: CANARY HEALTH RECOVERY & RE-PROMOTION LIFECYCLE
// ============================================================================
console.log('\n--- SUITE 5: Canary Health Recovery & Re-Promotion Lifecycle ---');

async function testCanaryRecoveryLifecycle() {
    let server = null;
    let isDaemonOnline = false;
    let canaryProbeCount = 0;

    // Start ephemeral server representing daemon
    server = http.createServer((req, res) => {
        if (req.url === '/health' && req.method === 'GET') {
            canaryProbeCount++;
            if (isDaemonOnline) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'HEALTHY', gateway: 'grpc-web' }));
            } else {
                res.writeHead(503, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'UNAVAILABLE' }));
            }
            return;
        }
        res.writeHead(404);
        res.end();
    });

    const port = await new Promise(resolve => {
        server.listen(0, '127.0.0.1', () => resolve(server.address().port));
    });

    const client = new MockTransportClient(`http://127.0.0.1:${port}`, 'http://127.0.0.1:8000');
    // Put client into REST_FALLBACK
    client.tripToFallback('daemon down');
    assert.strictEqual(client.state, 'REST_FALLBACK');

    // Probe 1: Daemon is still offline (HTTP 503)
    let probe1Success = false;
    await new Promise(resolve => {
        http.get(`http://127.0.0.1:${port}/health`, (res) => {
            if (res.statusCode === 200) {
                client.promoteToGrpc();
                probe1Success = true;
            }
            resolve();
        }).on('error', resolve);
    });

    assert.strictEqual(probe1Success, false, 'Probe 1 must not promote while daemon offline');
    assert.strictEqual(client.state, 'REST_FALLBACK', 'State must remain REST_FALLBACK');

    // Simulate Daemon Restart / Resurrection
    isDaemonOnline = true;

    // Probe 2: Daemon is now online (HTTP 200)
    let probe2Success = false;
    await new Promise(resolve => {
        http.get(`http://127.0.0.1:${port}/health`, (res) => {
            if (res.statusCode === 200) {
                client.promoteToGrpc();
                probe2Success = true;
            }
            resolve();
        }).on('error', resolve);
    });

    server.close();

    assert.strictEqual(probe2Success, true, 'Probe 2 must detect HTTP 200');
    assert.strictEqual(client.state, 'GRPC_ONLINE', 'Client must be re-promoted to GRPC_ONLINE');
    assert.strictEqual(client.stats.promotionsToGrpc, 1, 'promotionsToGrpc stat counter must equal 1');
}

runAsyncTest('CanaryRecovery', 'Canary health probe detects daemon resurrection (HTTP 200) and re-promotes to GRPC_ONLINE', async () => {
    await testCanaryRecoveryLifecycle();
});

// ============================================================================
// SUITE 6: ARCHITECTURAL GAP AUDIT: TELEMETRY RESUMPTION AFTER PROMOTION
// ============================================================================
console.log('\n--- SUITE 6: Architectural Gap Audit (Post-Promotion Telemetry Resumption) ---');

runSyncTest('ArchitecturalAudit', 'Inspect promoteToGrpc in components/grpc-client.js for automatic stream telemetry resumption', () => {
    // Audit lines around promoteToGrpc() in components/grpc-client.js
    const promoteIdx = grpcClientRawCode.indexOf('promoteToGrpc()');
    assert(promoteIdx !== -1, 'promoteToGrpc() method not found in grpc-client.js');
    const promoteSnippet = grpcClientRawCode.slice(promoteIdx, promoteIdx + 600);

    const restartsStream = promoteSnippet.includes('streamTelemetry') || promoteSnippet.includes('streamGrpcWeb');
    if (!restartsStream) {
        // Record as confirmed architectural finding: promoteToGrpc clears REST timer but does not restart gRPC stream
        findings.push({
            suite: 'ArchitecturalAudit',
            name: 'Telemetry Stream Orphan on Recovery',
            error: 'promoteToGrpc() clears this.restPollTimer but DOES NOT automatically re-invoke streamTelemetry() or re-attach the previous chunk subscriber. After canary recovery, telemetry stops updating unless UI manually re-invokes streamTelemetry().',
            severity: 'MEDIUM'
        });
        console.log('    ⚠️ ARCHITECTURAL FINDING: promoteToGrpc() clears REST poll timer but does not re-establish gRPC telemetry stream automatically.');
    }
});

// ============================================================================
// SUITE 7: LATENCY & MEMORY OVERHEAD EMPIRICAL BENCHMARK
// ============================================================================
console.log('\n--- SUITE 7: Latency & Memory Overhead Empirical Benchmark ---');

runSyncTest('Benchmark', '5,000 Iteration Framing & Fragmentation Benchmark', () => {
    const memBefore = process.memoryUsage().heapUsed;
    const ITERATIONS = 5000;
    const latencies = [];

    const dummyPayload = new Uint8Array(128);
    for (let i = 0; i < 128; i++) dummyPayload[i] = (i * 3) & 0xFF;

    for (let i = 0; i < ITERATIONS; i++) {
        const t0 = process.hrtime.bigint();
        const framed = packDataFrame(dummyPayload);
        // Split into 3 arbitrary fragments
        const frag1 = framed.subarray(0, 4); // 4 bytes of 5-byte header
        const frag2 = framed.subarray(4, 50);
        const frag3 = framed.subarray(50);

        // Accumulate and parse
        let acc = new Uint8Array(0);
        for (const frag of [frag1, frag2, frag3]) {
            const next = new Uint8Array(acc.length + frag.length);
            next.set(acc, 0);
            next.set(frag, acc.length);
            const { remainder } = unpackFrames(next);
            acc = remainder;
        }
        const t1 = process.hrtime.bigint();
        latencies.push(Number(t1 - t0) / 1000); // in microseconds
    }

    const memAfter = process.memoryUsage().heapUsed;
    const memDeltaKb = (memAfter - memBefore) / 1024;

    latencies.sort((a, b) => a - b);
    const minUs = latencies[0];
    const maxUs = latencies[latencies.length - 1];
    const avgUs = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    const p50Us = latencies[Math.floor(latencies.length * 0.50)];
    const p95Us = latencies[Math.floor(latencies.length * 0.95)];
    const p99Us = latencies[Math.floor(latencies.length * 0.99)];

    console.log(`    📊 Benchmark Results (${ITERATIONS} runs):`);
    console.log(`       - Min Latency:  ${minUs.toFixed(2)} µs`);
    console.log(`       - Avg Latency:  ${avgUs.toFixed(2)} µs`);
    console.log(`       - p50 Latency:  ${p50Us.toFixed(2)} µs`);
    console.log(`       - p95 Latency:  ${p95Us.toFixed(2)} µs`);
    console.log(`       - p99 Latency:  ${p99Us.toFixed(2)} µs`);
    console.log(`       - Max Latency:  ${maxUs.toFixed(2)} µs`);
    console.log(`       - Heap Delta:   ${memDeltaKb.toFixed(2)} KB`);

    assert(avgUs < 100, `Expected avg latency <100µs, got ${avgUs}µs`);
});

// ============================================================================
// SUMMARY & VERDICT
// ============================================================================
console.log('\n================================================================================');
console.log(`  TOTAL TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${failedTests}`);
console.log('================================================================================');

if (findings.length > 0) {
    console.log('\n🚨 EMPIRICAL FINDINGS & DEFECTS:');
    findings.forEach((f, i) => {
        console.log(`  ${i + 1}. [${f.suite}] ${f.name}`);
        console.log(`     Details: ${f.error}`);
    });
} else {
    console.log('\n✅ ALL ADVERSARIAL STRESS TESTS PASSED CLEANLY.');
}

module.exports = {
    totalTests,
    passedTests,
    failedTests,
    findings,
    packDataFrame,
    packTrailerFrame,
    unpackFrames
};
