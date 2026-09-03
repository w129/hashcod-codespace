/**
 * ============================================================================
 * HASHCOD CODESPACE — gRPC & PROTOBUF STREAMING SPECIFICATION & HARNESS
 * ============================================================================
 * 
 * Provides opaque-box verification harnesses, Protobuf wire encoders/decoders,
 * gRPC-Web 5-byte framing codecs, Dilithium-5 invariant state machines,
 * and resilient fallback simulators.
 * 
 * Target Interface Contracts:
 * - proto/codespace_pqc.proto (SecurityTelemetryService, DilithiumService)
 * - gRPC-Web Gateway on Port 50052 (HTTP/1.1 & HTTP/2, 5-byte framing, CORS)
 * - Native Go gRPC Daemon on Port 50051
 * - SecurityTransportClient with 100% Uptime Fallback to PHP REST Endpoints
 * 
 * Zero external npm dependencies — pure native Node.js (fs, path, crypto, http, assert).
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const http = require('http');
const assert = require('assert');

// Verbatim Invariant Error Message (from auth.php lines 320-324 & SCOPE.md)
const DILITHIUM_REVOKED_ERROR = 'La clave Dilithium-5 proporcionada ha sido revocada, ha expirado o es anterior. Solo se permite validar y registrar credenciales con la última clave generada ahora en la plataforma.';
const DILITHIUM_MISSING_ERROR = 'Falta ingresar la clave Dilithium-5 de registro.';

// NIST FIPS 204 ML-DSA-87 / Dilithium-5 Base Constants
const D5_BASE_SIGNATURE = 'DILITHIUM5_SIG_V1_TklTVC1QUUMtTUwtRFNBLTg3OkRJTElUSElVTTU6TEVWRUw1OkFVVEhfUk9PVDoyMDI2LTA5LTAzVDAyOjAwOjAwWjpMQU5HRV9WRUNUT1JfODIzODk0NzI5NDgxNzg5MDoxMzM3' + 'A'.repeat(2400);
const D5_Q_MODULUS = 8380417n; // 2^23 - 2^13 + 1
const D5_GATE_CODE = '36276217';

// ============================================================================
// 1. PURE NODE.JS PROTOBUF WIRE ENCODER & DECODER
// ============================================================================

const WIRE_TYPE_VARINT = 0;
const WIRE_TYPE_FIXED64 = 1;
const WIRE_TYPE_LENGTH_DELIMITED = 2;
const WIRE_TYPE_FIXED32 = 5;

class ProtobufCodec {
    /**
     * Encodes a 64-bit unsigned integer into a Protobuf varint Buffer.
     */
    static encodeVarint(val) {
        let n = BigInt(val);
        if (n < 0n) {
            // Two's complement for 64-bit signed varint
            n = (1n << 64n) + n;
        }
        const bytes = [];
        while (n >= 0x80n) {
            bytes.push(Number((n & 0x7Fn) | 0x80n));
            n >>= 7n;
        }
        bytes.push(Number(n & 0x7Fn));
        return Buffer.from(bytes);
    }

    /**
     * Decodes a varint from a Buffer at a given offset.
     */
    static decodeVarint(buf, offset = 0) {
        let result = 0n;
        let shift = 0n;
        let bytesRead = 0;
        while (offset + bytesRead < buf.length) {
            const b = buf[offset + bytesRead];
            bytesRead++;
            result |= BigInt(b & 0x7F) << shift;
            shift += 7n;
            if ((b & 0x80) === 0) {
                break;
            }
            if (bytesRead > 10) {
                throw new Error('Malformed varint: exceeds 10 bytes');
            }
        }
        return { value: result, bytesRead };
    }

    /**
     * Encodes field tag: (fieldNumber << 3) | wireType
     */
    static encodeTag(fieldNumber, wireType) {
        return this.encodeVarint((BigInt(fieldNumber) << 3n) | BigInt(wireType));
    }

    /**
     * Decodes field tag from varint.
     */
    static decodeTag(tagInt) {
        const tag = BigInt(tagInt);
        return {
            fieldNumber: Number(tag >> 3n),
            wireType: Number(tag & 7n)
        };
    }

    static encodeString(fieldNumber, str) {
        const buf = Buffer.from(str || '', 'utf8');
        const tag = this.encodeTag(fieldNumber, WIRE_TYPE_LENGTH_DELIMITED);
        const len = this.encodeVarint(buf.length);
        return Buffer.concat([tag, len, buf]);
    }

    static encodeBytes(fieldNumber, buf) {
        const b = Buffer.isBuffer(buf) ? buf : Buffer.from(buf || '');
        const tag = this.encodeTag(fieldNumber, WIRE_TYPE_LENGTH_DELIMITED);
        const len = this.encodeVarint(b.length);
        return Buffer.concat([tag, len, b]);
    }

    static encodeInt64(fieldNumber, val) {
        const tag = this.encodeTag(fieldNumber, WIRE_TYPE_VARINT);
        const v = this.encodeVarint(val);
        return Buffer.concat([tag, v]);
    }

    static encodeBool(fieldNumber, val) {
        const tag = this.encodeTag(fieldNumber, WIRE_TYPE_VARINT);
        const v = this.encodeVarint(val ? 1 : 0);
        return Buffer.concat([tag, v]);
    }

    static encodeDouble(fieldNumber, val) {
        const tag = this.encodeTag(fieldNumber, WIRE_TYPE_FIXED64);
        const b = Buffer.alloc(8);
        b.writeDoubleLE(Number(val) || 0, 0);
        return Buffer.concat([tag, b]);
    }

    /**
     * Generic parser for raw Protobuf tag-wire payload into fields map.
     */
    static parseRawFields(buf) {
        const fields = {};
        let offset = 0;
        while (offset < buf.length) {
            const { value: tagVal, bytesRead: tagBytes } = this.decodeVarint(buf, offset);
            offset += tagBytes;
            const { fieldNumber, wireType } = this.decodeTag(tagVal);

            if (wireType === WIRE_TYPE_VARINT) {
                const { value: v, bytesRead: vBytes } = this.decodeVarint(buf, offset);
                offset += vBytes;
                fields[fieldNumber] = { wireType, value: v };
            } else if (wireType === WIRE_TYPE_FIXED64) {
                if (offset + 8 > buf.length) throw new Error('Truncated fixed64');
                const v = buf.readDoubleLE(offset);
                offset += 8;
                fields[fieldNumber] = { wireType, value: v };
            } else if (wireType === WIRE_TYPE_LENGTH_DELIMITED) {
                const { value: lenBig, bytesRead: lenBytes } = this.decodeVarint(buf, offset);
                offset += lenBytes;
                const len = Number(lenBig);
                if (offset + len > buf.length) throw new Error('Truncated length-delimited payload');
                const slice = buf.slice(offset, offset + len);
                offset += len;
                fields[fieldNumber] = { wireType, value: slice };
            } else if (wireType === WIRE_TYPE_FIXED32) {
                if (offset + 4 > buf.length) throw new Error('Truncated fixed32');
                const v = buf.readInt32LE(offset);
                offset += 4;
                fields[fieldNumber] = { wireType, value: v };
            } else {
                throw new Error(`Unsupported wire type: ${wireType} at field ${fieldNumber}`);
            }
        }
        return fields;
    }

    // --- Message Specific Encoders & Decoders ---

    /**
     * SecurityTelemetryChunk
     * 1: health_score (double)
     * 2: cves_scanned (int64)
     * 3: threats_blocked (int64)
     * 4: honeypot_hits (int64)
     * 5: entropy_pool_bytes (int64)
     * 6: quantum_status (string)
     * 7: atomic_time_status (string)
     * 8: circuit_breaker_state (string)
     * 9: timestamp (int64)
     */
    static encodeTelemetryChunk(c) {
        const parts = [];
        if (c.health_score !== undefined) parts.push(this.encodeDouble(1, c.health_score));
        if (c.cves_scanned !== undefined) parts.push(this.encodeInt64(2, c.cves_scanned));
        if (c.threats_blocked !== undefined) parts.push(this.encodeInt64(3, c.threats_blocked));
        if (c.honeypot_hits !== undefined) parts.push(this.encodeInt64(4, c.honeypot_hits));
        if (c.entropy_pool_bytes !== undefined) parts.push(this.encodeInt64(5, c.entropy_pool_bytes));
        if (c.quantum_status) parts.push(this.encodeString(6, c.quantum_status));
        if (c.atomic_time_status) parts.push(this.encodeString(7, c.atomic_time_status));
        if (c.circuit_breaker_state) parts.push(this.encodeString(8, c.circuit_breaker_state));
        if (c.timestamp !== undefined) parts.push(this.encodeInt64(9, c.timestamp));
        return Buffer.concat(parts);
    }

    static decodeTelemetryChunk(buf) {
        const raw = this.parseRawFields(buf);
        return {
            health_score: raw[1] ? Number(raw[1].value) : 100,
            cves_scanned: raw[2] ? Number(raw[2].value) : 0,
            threats_blocked: raw[3] ? Number(raw[3].value) : 0,
            honeypot_hits: raw[4] ? Number(raw[4].value) : 0,
            entropy_pool_bytes: raw[5] ? Number(raw[5].value) : 64,
            quantum_status: raw[6] ? raw[6].value.toString('utf8') : 'ACTIVE',
            atomic_time_status: raw[7] ? raw[7].value.toString('utf8') : 'SYNCED',
            circuit_breaker_state: raw[8] ? raw[8].value.toString('utf8') : 'CLOSED',
            timestamp: raw[9] ? Number(raw[9].value) : Date.now()
        };
    }

    /**
     * VerifyRequest
     * 1: key_or_signature (string)
     * 2: raw_signature (bytes)
     * 3: message (bytes)
     * 4: public_key (bytes)
     * 5: context (string)
     * 6: enforce_active_epoch (bool)
     */
    static encodeVerifyRequest(req) {
        const parts = [];
        if (req.key_or_signature) parts.push(this.encodeString(1, req.key_or_signature));
        if (req.raw_signature) parts.push(this.encodeBytes(2, req.raw_signature));
        if (req.message) parts.push(this.encodeBytes(3, req.message));
        if (req.public_key) parts.push(this.encodeBytes(4, req.public_key));
        if (req.context) parts.push(this.encodeString(5, req.context));
        if (req.enforce_active_epoch !== undefined) parts.push(this.encodeBool(6, req.enforce_active_epoch));
        return Buffer.concat(parts);
    }

    static decodeVerifyRequest(buf) {
        const raw = this.parseRawFields(buf);
        return {
            key_or_signature: raw[1] ? raw[1].value.toString('utf8') : '',
            raw_signature: raw[2] ? raw[2].value : Buffer.alloc(0),
            message: raw[3] ? raw[3].value : Buffer.alloc(0),
            public_key: raw[4] ? raw[4].value : Buffer.alloc(0),
            context: raw[5] ? raw[5].value.toString('utf8') : '',
            enforce_active_epoch: raw[6] ? Boolean(raw[6].value) : true
        };
    }

    /**
     * VerifyResponse
     * 1: valid (bool)
     * 2: verification_type (string)
     * 3: epoch (double)
     * 4: key_hash_sha256 (string)
     * 5: error_message (string)
     * 6: verified_at_unix_ms (int64)
     * 7: is_revoked (bool)
     */
    static encodeVerifyResponse(res) {
        const parts = [];
        if (res.valid !== undefined) parts.push(this.encodeBool(1, res.valid));
        if (res.verification_type) parts.push(this.encodeString(2, res.verification_type));
        if (res.epoch !== undefined) parts.push(this.encodeDouble(3, res.epoch));
        if (res.key_hash_sha256) parts.push(this.encodeString(4, res.key_hash_sha256));
        if (res.error_message) parts.push(this.encodeString(5, res.error_message));
        if (res.verified_at_unix_ms !== undefined) parts.push(this.encodeInt64(6, res.verified_at_unix_ms));
        if (res.is_revoked !== undefined) parts.push(this.encodeBool(7, res.is_revoked));
        return Buffer.concat(parts);
    }

    static decodeVerifyResponse(buf) {
        const raw = this.parseRawFields(buf);
        return {
            valid: raw[1] ? Boolean(raw[1].value) : false,
            verification_type: raw[2] ? raw[2].value.toString('utf8') : '',
            epoch: raw[3] ? Number(raw[3].value) : 0,
            key_hash_sha256: raw[4] ? raw[4].value.toString('utf8') : '',
            error_message: raw[5] ? raw[5].value.toString('utf8') : '',
            verified_at_unix_ms: raw[6] ? Number(raw[6].value) : 0,
            is_revoked: raw[7] ? Boolean(raw[7].value) : false
        };
    }

    /**
     * RegisterKeyRequest
     * 1: active_key (string)
     * 2: raw_key (bytes)
     * 3: epoch (double)
     * 4: timestamp (int64)
     * 5: operator_identity (string)
     */
    static encodeRegisterKeyRequest(req) {
        const parts = [];
        if (req.active_key) parts.push(this.encodeString(1, req.active_key));
        if (req.raw_key) parts.push(this.encodeBytes(2, req.raw_key));
        if (req.epoch !== undefined) parts.push(this.encodeDouble(3, req.epoch));
        if (req.timestamp !== undefined) parts.push(this.encodeInt64(4, req.timestamp));
        if (req.operator_identity) parts.push(this.encodeString(5, req.operator_identity));
        return Buffer.concat(parts);
    }

    static decodeRegisterKeyRequest(buf) {
        const raw = this.parseRawFields(buf);
        return {
            active_key: raw[1] ? raw[1].value.toString('utf8') : '',
            raw_key: raw[2] ? raw[2].value : Buffer.alloc(0),
            epoch: raw[3] ? Number(raw[3].value) : 0,
            timestamp: raw[4] ? Number(raw[4].value) : 0,
            operator_identity: raw[5] ? raw[5].value.toString('utf8') : ''
        };
    }

    /**
     * RegisterKeyResponse
     * 1: ok (bool)
     * 2: epoch (double)
     * 3: key_hash_sha256 (string)
     * 4: revoked_prior_keys_count (int64)
     * 5: status_message (string)
     */
    static encodeRegisterKeyResponse(res) {
        const parts = [];
        if (res.ok !== undefined) parts.push(this.encodeBool(1, res.ok));
        if (res.epoch !== undefined) parts.push(this.encodeDouble(2, res.epoch));
        if (res.key_hash_sha256) parts.push(this.encodeString(3, res.key_hash_sha256));
        if (res.revoked_prior_keys_count !== undefined) parts.push(this.encodeInt64(4, res.revoked_prior_keys_count));
        if (res.status_message) parts.push(this.encodeString(5, res.status_message));
        return Buffer.concat(parts);
    }

    static decodeRegisterKeyResponse(buf) {
        const raw = this.parseRawFields(buf);
        return {
            ok: raw[1] ? Boolean(raw[1].value) : false,
            epoch: raw[2] ? Number(raw[2].value) : 0,
            key_hash_sha256: raw[3] ? raw[3].value.toString('utf8') : '',
            revoked_prior_keys_count: raw[4] ? Number(raw[4].value) : 0,
            status_message: raw[5] ? raw[5].value.toString('utf8') : ''
        };
    }
}

// ============================================================================
// 2. gRPC-WEB 5-BYTE BINARY FRAMING CODEC
// ============================================================================

class GrpcWebFraming {
    static FRAME_FLAG_DATA = 0x00;
    static FRAME_FLAG_TRAILERS = 0x80;

    /**
     * Packs a payload into a standard 5-byte framed buffer:
     * [Flag: 1 byte][Length: 4 bytes big endian][Payload]
     */
    static packFrame(flag, payload) {
        const p = Buffer.isBuffer(payload) ? payload : Buffer.from(payload || '');
        const len = p.length;
        const header = Buffer.alloc(5);
        header[0] = flag;
        header.writeUInt32BE(len, 1);
        return Buffer.concat([header, p]);
    }

    static packDataFrame(payload) {
        return this.packFrame(this.FRAME_FLAG_DATA, payload);
    }

    static packTrailerFrame(trailersStr = 'grpc-status: 0\r\ngrpc-message: OK\r\n') {
        return this.packFrame(this.FRAME_FLAG_TRAILERS, Buffer.from(trailersStr, 'utf8'));
    }

    /**
     * Parses all complete 5-byte frames from a buffer.
     * Returns { frames: Array<{ flag, isTrailer, length, payload }>, remainder: Buffer }
     */
    static unpackFrames(buf) {
        const frames = [];
        let offset = 0;

        while (offset + 5 <= buf.length) {
            const flag = buf[offset];
            const length = buf.readUInt32BE(offset + 1);

            if (offset + 5 + length > buf.length) {
                // Incomplete frame; need more bytes
                break;
            }

            const payload = buf.slice(offset + 5, offset + 5 + length);
            frames.push({
                flag,
                isData: flag === this.FRAME_FLAG_DATA,
                isTrailer: flag === this.FRAME_FLAG_TRAILERS,
                length,
                payload
            });
            offset += 5 + length;
        }

        const remainder = buf.slice(offset);
        return { frames, remainder };
    }

    /**
     * Extracts status code and message from gRPC-Web trailer frame payload.
     */
    static parseTrailers(payload) {
        const str = payload.toString('utf8');
        let status = 0;
        let message = 'OK';
        for (const line of str.split('\r\n')) {
            const [k, v] = line.split(':');
            if (!k || !v) continue;
            const key = k.trim().toLowerCase();
            const val = v.trim();
            if (key === 'grpc-status') status = parseInt(val, 10);
            if (key === 'grpc-message') message = decodeURIComponent(val);
        }
        return { status, message, raw: str };
    }
}

// ============================================================================
// 3. DILITHIUM-5 STATE & INVARIANT ORACLE
// ============================================================================

class DilithiumInvariantOracle {
    constructor() {
        this.activeKeyExact = null;
        this.activeKeyHash = null;
        this.currentEpoch = null;
        this.revokedKeys = new Map(); // hash -> { key, epoch, revokedAt }
        this.registeredCount = 0;
    }

    static normalizeKey(key) {
        if (!key || typeof key !== 'string') return '';
        let clean = key.trim();
        if (clean.startsWith('DILITHIUM5_ADMIN_SIGNATURE=')) {
            clean = clean.slice('DILITHIUM5_ADMIN_SIGNATURE='.length);
        }
        if (clean.startsWith('L8_DILITHIUM5_REGISTER_KEY=')) {
            clean = clean.slice('L8_DILITHIUM5_REGISTER_KEY='.length);
        }
        return clean.trim();
    }

    static hashKey(key) {
        return crypto.createHash('sha256').update(key).digest('hex');
    }

    static timingSafeEqual(a, b) {
        if (!a || !b) return false;
        const bufA = Buffer.from(a, 'utf8');
        const bufB = Buffer.from(b, 'utf8');
        if (bufA.length !== bufB.length) return false;
        return crypto.timingSafeEqual(bufA, bufB);
    }

    registerKey(key, epoch = null, operator = 'admin') {
        const clean = DilithiumInvariantOracle.normalizeKey(key);
        if (!clean) {
            throw new Error(DILITHIUM_MISSING_ERROR);
        }

        const nowEpoch = epoch ? Number(epoch) : Date.now();
        const newHash = DilithiumInvariantOracle.hashKey(clean);

        // If an active key already existed, revoke it immediately
        if (this.activeKeyExact) {
            this.revokedKeys.set(this.activeKeyHash, {
                key: this.activeKeyExact,
                epoch: this.currentEpoch,
                revokedAt: Date.now()
            });
        }

        this.activeKeyExact = clean;
        this.activeKeyHash = newHash;
        this.currentEpoch = nowEpoch;
        this.registeredCount++;

        return {
            ok: true,
            epoch: nowEpoch,
            key_hash_sha256: newHash,
            revoked_prior_keys_count: this.revokedKeys.size,
            status_message: 'Key successfully activated; prior keys revoked.'
        };
    }

    verifySignature(providedKey) {
        const clean = DilithiumInvariantOracle.normalizeKey(providedKey);
        if (!clean) {
            return {
                valid: false,
                verification_type: '',
                epoch: 0,
                key_hash_sha256: '',
                error_message: DILITHIUM_MISSING_ERROR,
                verified_at_unix_ms: Date.now(),
                is_revoked: false
            };
        }

        const providedHash = DilithiumInvariantOracle.hashKey(clean);

        // Invariant Rule: If an active dynamic key exists, ONLY that exact key is valid
        if (this.activeKeyExact) {
            if (DilithiumInvariantOracle.timingSafeEqual(clean, this.activeKeyExact)) {
                return {
                    valid: true,
                    verification_type: 'dynamic_active_key',
                    epoch: this.currentEpoch,
                    key_hash_sha256: this.activeKeyHash,
                    error_message: '',
                    verified_at_unix_ms: Date.now(),
                    is_revoked: false
                };
            }

            // Key is different: either revoked prior key or unauthorized key
            const wasRevoked = this.revokedKeys.has(providedHash);
            return {
                valid: false,
                verification_type: wasRevoked ? 'revoked_key' : 'unauthorized_key',
                epoch: this.currentEpoch,
                key_hash_sha256: providedHash,
                error_message: DILITHIUM_REVOKED_ERROR,
                verified_at_unix_ms: Date.now(),
                is_revoked: true
            };
        }

        // Default environment master key fallback (if no dynamic key set yet)
        if (clean === D5_BASE_SIGNATURE) {
            return {
                valid: true,
                verification_type: 'env_master_key',
                epoch: 0,
                key_hash_sha256: providedHash,
                error_message: '',
                verified_at_unix_ms: Date.now(),
                is_revoked: false
            };
        }

        return {
            valid: false,
            verification_type: 'unauthorized_key',
            epoch: 0,
            key_hash_sha256: providedHash,
            error_message: 'Clave Dilithium-5 incorrecta o no autorizada para el registro.',
            verified_at_unix_ms: Date.now(),
            is_revoked: false
        };
    }

    /**
     * Simulates polynomial lattice multiplication over ring Z_q
     */
    static deriveMultipliedKey(baseKey, scalar) {
        const clean = this.normalizeKey(baseKey || D5_BASE_SIGNATURE);
        const b = BigInt(scalar);
        const recur = (7n * (b ** 3n) + 3n * (b ** 2n) - b + 1n) % D5_Q_MODULUS;
        const suffix = recur.toString(16).padStart(8, '0');
        const hash = crypto.createHash('sha256').update(clean + ':' + suffix).digest('hex');
        return `DILITHIUM5_SIG_V1_LATTICE_${hash.slice(0, 48)}_REC_${suffix}_` + 'B'.repeat(2400);
    }
}

// ============================================================================
// 4. MOCK / LOCAL gRPC-WEB GATEWAY SERVER HARNESS
// ============================================================================

class TestGrpcWebGatewayServer {
    constructor(port = 0) {
        this.port = port;
        this.actualPort = null;
        this.server = null;
        this.oracle = new DilithiumInvariantOracle();
        this.telemetryTickCount = 0;
        this.corsOrigin = '*';
        this.isStreamingActive = false;
    }

    start() {
        return new Promise((resolve, reject) => {
            this.server = http.createServer((req, res) => this.handleRequest(req, res));
            this.server.listen(this.port, '127.0.0.1', () => {
                this.actualPort = this.server.address().port;
                resolve(this.actualPort);
            });
            this.server.on('error', reject);
        });
    }

    stop() {
        return new Promise((resolve) => {
            if (this.server) {
                this.server.close(() => resolve());
            } else {
                resolve();
            }
        });
    }

    handleRequest(req, res) {
        // Handle CORS Preflight
        res.setHeader('Access-Control-Allow-Origin', this.corsOrigin);
        res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Grpc-Web, X-User-Agent, Authorization');
        res.setHeader('Access-Control-Expose-Headers', 'grpc-status, grpc-message, Content-Disposition');

        if (req.method === 'OPTIONS') {
            res.writeHead(204);
            res.end();
            return;
        }

        const url = req.url.split('?')[0];

        // Canary Health Check Endpoint
        if (url === '/health' && req.method === 'GET') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'UP', service: 'grpc-web-gateway', port: this.actualPort }));
            return;
        }

        // Method validation for RPCs
        if (req.method !== 'POST') {
            res.writeHead(405, { 'Content-Type': 'text/plain' });
            res.end('Method Not Allowed: RPC endpoints require POST');
            return;
        }

        // Accumulate request chunks
        const chunks = [];
        req.on('data', chunk => chunks.push(chunk));
        req.on('end', () => {
            const bodyBuf = Buffer.concat(chunks);
            this.handleRpc(url, req, res, bodyBuf);
        });
    }

    handleRpc(url, req, res, bodyBuf) {
        // Unpack incoming gRPC-Web frame (if framed)
        let payload = bodyBuf;
        if (bodyBuf.length >= 5 && bodyBuf[0] === 0x00) {
            const { frames } = GrpcWebFraming.unpackFrames(bodyBuf);
            if (frames.length > 0) payload = frames[0].payload;
        }

        res.setHeader('Content-Type', 'application/grpc-web+proto');
        res.setHeader('X-Grpc-Web', '1');

        if (url === '/hashcod.security.SecurityTelemetryService/StreamSecurityTelemetry' ||
            url.endsWith('/StreamSecurityTelemetry')) {
            // Streaming RPC: write 3 chunks + trailer
            res.writeHead(200);
            for (let i = 1; i <= 3; i++) {
                this.telemetryTickCount++;
                const chunk = ProtobufCodec.encodeTelemetryChunk({
                    health_score: 100,
                    cves_scanned: i * 5,
                    threats_blocked: i * 2,
                    honeypot_hits: 0,
                    entropy_pool_bytes: 64,
                    quantum_status: 'ACTIVE',
                    atomic_time_status: 'SYNCED',
                    circuit_breaker_state: 'CLOSED',
                    timestamp: Date.now()
                });
                res.write(GrpcWebFraming.packDataFrame(chunk));
            }
            res.write(GrpcWebFraming.packTrailerFrame('grpc-status: 0\r\ngrpc-message: OK\r\n'));
            res.end();
            return;
        }

        if (url === '/hashcod.pqc.v1.DilithiumService/VerifySignature' ||
            url.endsWith('/VerifySignature')) {
            const verifyReq = ProtobufCodec.decodeVerifyRequest(payload);
            const verifyRes = this.oracle.verifySignature(verifyReq.key_or_signature);
            const outBytes = ProtobufCodec.encodeVerifyResponse(verifyRes);

            res.writeHead(200);
            res.write(GrpcWebFraming.packDataFrame(outBytes));
            res.write(GrpcWebFraming.packTrailerFrame('grpc-status: 0\r\ngrpc-message: OK\r\n'));
            res.end();
            return;
        }

        if (url === '/hashcod.pqc.v1.DilithiumService/RegisterActiveKey' ||
            url.endsWith('/RegisterActiveKey')) {
            const regReq = ProtobufCodec.decodeRegisterKeyRequest(payload);
            let regRes;
            try {
                regRes = this.oracle.registerKey(regReq.active_key, regReq.epoch, regReq.operator_identity);
            } catch (err) {
                regRes = { ok: false, epoch: 0, key_hash_sha256: '', revoked_prior_keys_count: 0, status_message: err.message };
            }
            const outBytes = ProtobufCodec.encodeRegisterKeyResponse(regRes);

            res.writeHead(200);
            res.write(GrpcWebFraming.packDataFrame(outBytes));
            res.write(GrpcWebFraming.packTrailerFrame('grpc-status: 0\r\ngrpc-message: OK\r\n'));
            res.end();
            return;
        }

        // Unknown RPC route
        res.writeHead(404);
        res.write(GrpcWebFraming.packTrailerFrame('grpc-status: 12\r\ngrpc-message: Unimplemented\r\n'));
        res.end();
    }
}

// ============================================================================
// 5. SECURITY TRANSPORT CLIENT HARNESS (MIRRORS FRONTEND RESILIENT FALLBACK)
// ============================================================================

class SecurityTransportClientHarness {
    constructor(gatewayUrl = 'http://127.0.0.1:50052', restApiUrl = 'http://127.0.0.1:8000') {
        this.gatewayUrl = gatewayUrl;
        this.restApiUrl = restApiUrl;
        this.state = 'GRPC_ONLINE'; // 'GRPC_ONLINE' | 'REST_FALLBACK'
        this.canaryIntervalMs = 15000;
        this.canaryTimer = null;
        this.oracle = new DilithiumInvariantOracle();
        this.stats = {
            grpcCalls: 0,
            fallbackCalls: 0,
            tripsToFallback: 0,
            promotionsToGrpc: 0
        };
        // Simulated mock REST responses
        this.mockRestResponses = {
            threatTelemetry: {
                healthScore: 100,
                threatsBlocked: 42,
                honeypotHits: 3,
                quantumStatus: 'ACTIVE',
                atomicTimeStatus: 'SYNCED',
                circuitBreakerState: 'CLOSED'
            }
        };
    }

    tripToFallback(reason = 'daemon_offline') {
        if (this.state !== 'REST_FALLBACK') {
            this.state = 'REST_FALLBACK';
            this.stats.tripsToFallback++;
        }
    }

    promoteToGrpc() {
        if (this.canaryTimer) {
            clearInterval(this.canaryTimer);
            this.canaryTimer = null;
        }
        if (this.state !== 'GRPC_ONLINE') {
            this.state = 'GRPC_ONLINE';
            this.stats.promotionsToGrpc++;
        }
    }

    async verifyDilithiumSignature(signatureToken, forceGatewayFailure = false) {
        if (forceGatewayFailure) {
            this.tripToFallback('forced_gateway_failure');
        } else if (this.state === 'GRPC_ONLINE') {
            try {
                this.stats.grpcCalls++;
                const reqBuf = ProtobufCodec.encodeVerifyRequest({ key_or_signature: signatureToken });
                const framed = GrpcWebFraming.packDataFrame(reqBuf);

                const response = await this.performRpcCall('/hashcod.pqc.v1.DilithiumService/VerifySignature', framed);
                const { frames } = GrpcWebFraming.unpackFrames(response);
                if (frames.length > 0 && frames[0].isData) {
                    const decoded = ProtobufCodec.decodeVerifyResponse(frames[0].payload);
                    return { valid: decoded.valid, message: decoded.error_message, type: 'grpc' };
                }
            } catch (err) {
                this.tripToFallback(err.message);
            }
        }

        // Seamless REST Fallback
        this.stats.fallbackCalls++;
        const res = this.oracle.verifySignature(signatureToken);
        return {
            valid: res.valid,
            message: res.error_message,
            type: 'rest_fallback'
        };
    }

    async registerActiveKey(activeKey, epoch, forceGatewayFailure = false) {
        if (forceGatewayFailure) {
            this.tripToFallback('forced_gateway_failure');
        } else if (this.state === 'GRPC_ONLINE') {
            try {
                this.stats.grpcCalls++;
                const reqBuf = ProtobufCodec.encodeRegisterKeyRequest({ active_key: activeKey, epoch: epoch || Date.now() });
                const framed = GrpcWebFraming.packDataFrame(reqBuf);

                const response = await this.performRpcCall('/hashcod.pqc.v1.DilithiumService/RegisterActiveKey', framed);
                const { frames } = GrpcWebFraming.unpackFrames(response);
                if (frames.length > 0 && frames[0].isData) {
                    const decoded = ProtobufCodec.decodeRegisterKeyResponse(frames[0].payload);
                    return { ok: decoded.ok, epoch: decoded.epoch, hash: decoded.key_hash_sha256, type: 'grpc' };
                }
            } catch (err) {
                this.tripToFallback(err.message);
            }
        }

        // Seamless REST Fallback
        this.stats.fallbackCalls++;
        const reg = this.oracle.registerKey(activeKey, epoch);
        return {
            ok: reg.ok,
            epoch: reg.epoch,
            hash: reg.key_hash_sha256,
            type: 'rest_fallback'
        };
    }

    performRpcCall(rpcPath, framedBuffer) {
        return new Promise((resolve, reject) => {
            const parsed = new URL(this.gatewayUrl);
            const options = {
                hostname: parsed.hostname,
                port: parsed.port,
                path: rpcPath,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/grpc-web+proto',
                    'X-Grpc-Web': '1',
                    'Content-Length': framedBuffer.length
                },
                timeout: 500
            };

            const req = http.request(options, (res) => {
                const chunks = [];
                res.on('data', chunk => chunks.push(chunk));
                res.on('end', () => resolve(Buffer.concat(chunks)));
            });

            req.on('error', reject);
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Gateway RPC Timeout'));
            });

            req.write(framedBuffer);
            req.end();
        });
    }

    async probeCanaryHealth() {
        return new Promise((resolve) => {
            const parsed = new URL(this.gatewayUrl);
            const req = http.get({
                hostname: parsed.hostname,
                port: parsed.port,
                path: '/health',
                timeout: 500
            }, (res) => {
                if (res.statusCode === 200) {
                    this.promoteToGrpc();
                    resolve(true);
                } else {
                    resolve(false);
                }
            });
            req.on('error', () => resolve(false));
            req.on('timeout', () => {
                req.destroy();
                resolve(false);
            });
        });
    }
}

// ============================================================================
// 6. BENCHMARK HARNESS (PROTOBUF VS JSON)
// ============================================================================

class GrpcBenchmarkHarness {
    static runComparison(iterations = 1000) {
        const sampleTelemetry = {
            health_score: 98.5,
            cves_scanned: 1420,
            threats_blocked: 890,
            honeypot_hits: 15,
            entropy_pool_bytes: 64,
            quantum_status: 'ACTIVE_ANU_QRNG',
            atomic_time_status: 'SYNCED_CLOUDFLARE_NIST',
            circuit_breaker_state: 'CLOSED',
            timestamp: Date.now()
        };

        // 1. Protobuf Serialization
        const pbEncodeStart = process.hrtime.bigint();
        let pbEncodedLast = null;
        for (let i = 0; i < iterations; i++) {
            pbEncodedLast = ProtobufCodec.encodeTelemetryChunk(sampleTelemetry);
        }
        const pbEncodeEnd = process.hrtime.bigint();
        const pbEncodeNs = Number(pbEncodeEnd - pbEncodeStart);

        // 2. JSON Serialization
        const jsonEncodeStart = process.hrtime.bigint();
        let jsonEncodedLast = null;
        for (let i = 0; i < iterations; i++) {
            jsonEncodedLast = JSON.stringify(sampleTelemetry);
        }
        const jsonEncodeEnd = process.hrtime.bigint();
        const jsonEncodeNs = Number(jsonEncodeEnd - jsonEncodeStart);

        // 3. Protobuf Deserialization
        const pbDecodeStart = process.hrtime.bigint();
        for (let i = 0; i < iterations; i++) {
            ProtobufCodec.decodeTelemetryChunk(pbEncodedLast);
        }
        const pbDecodeEnd = process.hrtime.bigint();
        const pbDecodeNs = Number(pbDecodeEnd - pbDecodeStart);

        // 4. JSON Deserialization
        const jsonDecodeStart = process.hrtime.bigint();
        for (let i = 0; i < iterations; i++) {
            JSON.parse(jsonEncodedLast);
        }
        const jsonDecodeEnd = process.hrtime.bigint();
        const jsonDecodeNs = Number(jsonDecodeEnd - jsonDecodeStart);

        const pbWireBytes = pbEncodedLast.length;
        const jsonWireBytes = Buffer.byteLength(jsonEncodedLast, 'utf8');
        const sizeReductionPercent = (((jsonWireBytes - pbWireBytes) / jsonWireBytes) * 100).toFixed(1);

        return {
            iterations,
            pbWireBytes,
            jsonWireBytes,
            sizeReductionPercent,
            pbEncodeUs: (pbEncodeNs / 1e3 / iterations).toFixed(3),
            jsonEncodeUs: (jsonEncodeNs / 1e3 / iterations).toFixed(3),
            pbDecodeUs: (pbDecodeNs / 1e3 / iterations).toFixed(3),
            jsonDecodeUs: (jsonDecodeNs / 1e3 / iterations).toFixed(3),
            pbOpsPerSec: Math.round((iterations / (pbEncodeNs / 1e9))),
            jsonOpsPerSec: Math.round((iterations / (jsonEncodeNs / 1e9)))
        };
    }
}

// Export module definitions
module.exports = {
    DILITHIUM_REVOKED_ERROR,
    DILITHIUM_MISSING_ERROR,
    D5_BASE_SIGNATURE,
    D5_Q_MODULUS,
    D5_GATE_CODE,
    ProtobufCodec,
    GrpcWebFraming,
    DilithiumInvariantOracle,
    TestGrpcWebGatewayServer,
    SecurityTransportClientHarness,
    GrpcBenchmarkHarness
};
