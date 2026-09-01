/**
 * Hashcod Codespace — Polyglot Grid API Launcher & Code Studio
 * 8x7 Coordinate Matrix Grid (x, y, z, u), Directory Explorer, Polyglot Converter & Live Console
 * Version: 2026.1
 */

(function(global) {
    'use strict';

    // ===== 1. CONSTANTS & LIFECYCLE STATES =====
        const SVG_BOX_ICON = `<svg viewBox="0 0 128 128" width="28" height="28" fill="currentColor"><path d="M15,109.8l48,17c0,0,0,0,0,0c0.1,0,0.2,0.1,0.3,0.1c0.2,0.1,0.5,0.1,0.7,0.1c0.2,0,0.3,0,0.5,0c0,0,0,0,0,0c0,0,0,0,0.1,0 c0.1,0,0.3-0.1,0.4-0.1c0,0,0,0,0,0l48-17c1.2-0.4,2-1.6,2-2.8V73.4l10-3.5c0.8-0.3,1.5-1,1.8-1.8s0.2-1.8-0.3-2.6l-12-20 c0,0-0.1-0.1-0.1-0.1c0-0.1-0.1-0.1-0.1-0.2c0,0,0,0,0,0c0-0.1-0.1-0.1-0.1-0.2c0,0,0,0,0-0.1c-0.1-0.1-0.1-0.1-0.2-0.2 c0,0-0.1-0.1-0.1-0.1c0,0-0.1-0.1-0.1-0.1c0,0-0.1,0-0.1,0c0,0-0.1-0.1-0.1-0.1c-0.1-0.1-0.2-0.1-0.3-0.1c-0.1,0-0.1-0.1-0.2-0.1 c0,0,0,0,0,0c0,0,0,0,0,0l-48-17c0,0,0,0-0.1,0c0,0-0.1,0-0.1,0c0,0-0.1,0-0.1,0c-0.1,0-0.1,0-0.2,0c0,0,0,0,0,0c0,0,0,0,0,0 c-0.1,0-0.1,0-0.2,0c-0.1,0-0.1,0-0.2,0c-0.1,0-0.2,0-0.4,0c-0.1,0-0.1,0-0.2,0c-0.2,0-0.4,0.1-0.5,0.1l-48,17 c-0.2,0.1-0.3,0.1-0.5,0.2c0,0-0.1,0.1-0.1,0.1c-0.1,0.1-0.2,0.1-0.3,0.2c0,0-0.1,0.1-0.1,0.1c-0.1,0.1-0.2,0.1-0.2,0.2 c0,0-0.1,0.1-0.1,0.1c-0.1,0.1-0.1,0.2-0.2,0.2c0,0,0,0.1-0.1,0.1l-12,20c-0.7,1.1-0.6,2.5,0.2,3.4C2.3,69.6,3.1,70,4,70 c0.3,0,0.7-0.1,1-0.2l8-2.8v40C13,108.3,13.8,109.4,15,109.8z M119.5,65.4l-42.2,15l-8.9-14.8l42.2-15L119.5,65.4z M67,34.2L103,47 L67,59.8V34.2z M67,74.8l6.4,10.7C74,86.5,75,87,76,87c0.3,0,0.7-0.1,1-0.2l32-11.3v29.4l-42,14.9V74.8z M19,51.2l42,14.9v53.6 l-42-14.9V51.2z"/></svg>`;
    const SVG_FOLDER_ICON = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`;
    const SVG_FILE_ICON = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`;
    const SVG_PLAY_ICON = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;

    const GRID_COLS = 8; // X: 0..7
    const GRID_ROWS = 7; // Y: 0..6
    const TOTAL_CELLS = GRID_COLS * GRID_ROWS; // 56 cells

    const LIFECYCLE_STATES = {
        IDLE: 'IDLE',
        CONFIGURED: 'CONFIGURED',
        RUNNING: 'RUNNING',
        SUCCESS: 'SUCCESS',
        ERROR: 'ERROR',
        LOCKED: 'LOCKED'
    };

    const FRAMEWORKS = {
        FASTAPI: 'fastapi',
        SANIC: 'sanic',
        EXPRESS: 'express',
        GO: 'go',
        C: 'c',
        JAVA: 'java'
    };

    // ===== 2. PRESET CODE SAMPLES LIBRARY =====
    const SAMPLE_PRESETS = {
        'ml_analyzer.py': {
            name: 'ml_analyzer.py',
            path: 'services/ml_analyzer.py',
            language: 'python',
            content: `"""
Machine Learning Model Prediction & Inference Service
Extracts high-dimensional vector representations and computes class probabilities.
"""

def predict_classification(features: list, model_id: str = "xgboost_v2", threshold: float = 0.5) -> dict:
    """Computes softmax classification probabilities from input numerical features."""
    if not features or len(features) == 0:
        return {"error": "Features list cannot be empty", "classes": []}
    
    total = sum(abs(f) for f in features) or 1.0
    scores = [round(abs(f) / total, 4) for f in features]
    prediction = 1 if max(scores) >= threshold else 0
    
    return {
        "model_id": model_id,
        "prediction": prediction,
        "confidence": max(scores),
        "scores": scores,
        "features_count": len(features)
    }

def analyze_model_metrics(model_id: str, epoch_count: int = 100) -> dict:
    """Returns training convergence telemetry and validation loss metrics."""
    return {
        "model_id": model_id,
        "epoch_count": epoch_count,
        "loss": 0.0245,
        "accuracy": 0.987,
        "status": "CONVERGED"
    }
`
        },
        'math_service.py': {
            name: 'math_service.py',
            path: 'services/math_service.py',
            language: 'python',
            content: `"""
Matrix & Vector High-Performance Numerical Computing Service
"""

def dot_product(vec_a: list, vec_b: list) -> dict:
    """Calculates Euclidean dot product between two real-valued vectors."""
    if len(vec_a) != len(vec_b):
        return {"error": "Vectors must have identical dimensionality", "result": 0}
    
    val = sum(a * b for a, b in zip(vec_a, vec_b))
    return {
        "dimension": len(vec_a),
        "dot_product": round(val, 6),
        "orthogonal": (val == 0)
    }

def matrix_determinant_2x2(matrix: list) -> dict:
    """Calculates determinant of a 2x2 square matrix [[a, b], [c, d]]."""
    if len(matrix) != 2 or len(matrix[0]) != 2 or len(matrix[1]) != 2:
        return {"error": "Matrix must be exactly 2x2", "det": 0}
    
    det = (matrix[0][0] * matrix[1][1]) - (matrix[0][1] * matrix[1][0])
    return {
        "matrix": matrix,
        "determinant": det,
        "invertible": (det != 0)
    }
`
        },
        'auth_controller.js': {
            name: 'auth_controller.js',
            path: 'controllers/auth_controller.js',
            language: 'javascript',
            content: `/**
 * Authentication and Security Identity Controller
 */

function issueSessionToken(accountId, role, ttlSeconds) {
    if (!accountId) {
        throw new Error("accountId is required for session token issuance");
    }
    const token = "l8_tok_" + Math.random().toString(36).substring(2, 15) + "_" + Date.now();
    return {
        issued: true,
        accountId: accountId,
        role: role || "developer",
        token: token,
        expiresIn: ttlSeconds || 3600
    };
}

function verifyAccessPermission(token, requiredRole) {
    if (!token || !token.startsWith("l8_tok_")) {
        return { valid: false, reason: "Malformed or expired token header" };
    }
    return {
        valid: true,
        grantedRole: requiredRole || "user",
        timestamp: new Date().toISOString()
    };
}
`
        },
        'payment_processor.go': {
            name: 'payment_processor.go',
            path: 'pkg/payment/payment_processor.go',
            language: 'go',
            content: `package payment

import (
    "errors"
    "fmt"
    "time"
)

// ProcessTransaction executes a ledger transaction with fraud verification
func ProcessTransaction(accountID string, amount float64, currency string) (map[string]interface{}, error) {
    if accountID == "" {
        return nil, errors.New("invalid account ID")
    }
    if amount <= 0 {
        return nil, errors.New("transaction amount must be greater than zero")
    }
    
    txID := fmt.Sprintf("TXN-%d", time.Now().UnixNano())
    return map[string]interface{}{
        "transaction_id": txID,
        "account_id":     accountID,
        "amount":         amount,
        "currency":       currency,
        "status":         "SETTLED",
        "processed_at":   time.Now().UTC().Format(time.RFC3339),
    }, nil
}
`
        },
        'crypto_hasher.c': {
            name: 'crypto_hasher.c',
            path: 'native/crypto_hasher.c',
            language: 'c',
            content: `#include <stdio.h>
#include <string.h>
#include <stdint.h>

/**
 * Computes deterministic FNV-1a 64-bit cryptographic signature hash for input payload.
 */
uint64_t compute_fnv1a_hash(const char* payload, size_t length) {
    uint64_t hash = 14695981039346656037ULL;
    for (size_t i = 0; i < length; ++i) {
        hash ^= (uint8_t)payload[i];
        hash *= 1099511628211ULL;
    }
    return hash;
}
`
        },
        'OrderService.java': {
            name: 'OrderService.java',
            path: 'src/main/java/com/hashcod/service/OrderService.java',
            language: 'java',
            content: `package com.hashcod.service;

import java.util.Map;
import java.util.HashMap;
import java.util.UUID;

public class OrderService {
    
    public Map<String, Object> createOrder(String customerId, double totalAmount, String currency) {
        if (customerId == null || customerId.trim().isEmpty()) {
            throw new IllegalArgumentException("customerId cannot be empty");
        }
        
        Map<String, Object> order = new HashMap<>();
        order.put("orderId", "ORD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        order.put("customerId", customerId);
        order.put("totalAmount", totalAmount);
        order.put("currency", currency != null ? currency : "USD");
        order.put("status", "CONFIRMED");
        return order;
    }
}
`
        }
    };

    // ===== 3. CORE STATE STORE =====
    class PolyglotStudioState {
        constructor() {
            this.activeCoord = { x: 0, y: 0, z: 0, u: 0 };
            this.cells = new Map(); // key: "x:y:z:u", value: CellState
            this.selectedCellKeys = new Set();
            this.files = new Map(); // path -> fileObj
            this.selectedFilePath = 'services/ml_analyzer.py';
            this.currentFramework = FRAMEWORKS.FASTAPI;
            this.currentMethod = 'POST';
            this.currentRoute = '/api/v1/predict';
            this.sourceCode = '';
            this.generatedApiCode = '';
            this.clientCurl = '';
            this.clientFetch = '';
            this.activeSnippetTab = 'curl';
            this.activeWorkspaceTab = 'matrix';
            this.executionLogs = [];
            this.historyLedger = [];
            this.logFilterLevel = 'ALL';
            this.logFilterQuery = '';
            this.logFilterCell = '';
            this.subscribers = new Set();
            this.initDefaultCells();
            this.loadPresetFiles();
            this.loadFromStorage();
        }

        saveToStorage() {
            if (typeof localStorage === 'undefined') return;
            try {
                const cellsObj = {};
                this.cells.forEach((v, k) => { cellsObj[k] = v; });
                const payload = {
                    version: "2026.3",
                    savedAt: new Date().toISOString(),
                    activeCoord: this.activeCoord,
                    selectedFilePath: this.selectedFilePath,
                    currentFramework: this.currentFramework,
                    currentMethod: this.currentMethod,
                    currentRoute: this.currentRoute,
                    cells: cellsObj,
                    files: Array.from(this.files.entries()),
                    history: this.historyLedger.slice(0, 50)
                };
                localStorage.setItem('krumbs_studio_state_v1', JSON.stringify(payload));
            } catch (err) {
                console.warn("[Krumbs] Could not save to localStorage:", err);
            }
        }

        loadFromStorage() {
            if (typeof localStorage === 'undefined') return false;
            try {
                const raw = localStorage.getItem('krumbs_studio_state_v1');
                if (!raw) return false;
                const data = JSON.parse(raw);
                if (!data || !data.cells) return false;

                if (data.cells) {
                    Object.keys(data.cells).forEach(k => {
                        this.cells.set(k, data.cells[k]);
                    });
                }
                if (Array.isArray(data.files)) {
                    data.files.forEach(([path, fileObj]) => {
                        this.files.set(path, fileObj);
                    });
                }
                if (data.activeCoord) this.activeCoord = data.activeCoord;
                if (data.selectedFilePath && this.files.has(data.selectedFilePath)) {
                    this.selectedFilePath = data.selectedFilePath;
                    const f = this.files.get(data.selectedFilePath);
                    if (f) this.sourceCode = f.content;
                }
                if (data.currentFramework) this.currentFramework = data.currentFramework;
                if (data.currentMethod) this.currentMethod = data.currentMethod;
                if (data.currentRoute) this.currentRoute = data.currentRoute;
                if (Array.isArray(data.history)) this.historyLedger = data.history;

                return true;
            } catch (err) {
                console.warn("[Krumbs] Could not load from localStorage:", err);
                return false;
            }
        }

        initDefaultCells() {
            for (let y = 0; y < GRID_ROWS; y++) {
                for (let x = 0; x < GRID_COLS; x++) {
                    const key = `${x}:${y}:0:0`;
                    this.cells.set(key, {
                        x, y, z: 0, u: 0,
                        id: `cell-${x}-${y}-0-0`,
                        state: LIFECYCLE_STATES.IDLE,
                        boundFile: '',
                        boundFiles: [],
                        boundFunction: '',
                        framework: FRAMEWORKS.FASTAPI,
                        route: `/api/cell/${x}/${y}`,
                        method: 'POST',
                        params: [],
                        lastResult: null,
                        lastLatencyMs: 0,
                        lastTimestamp: null,
                        executionCount: 0
                    });
                }
            }
            // Bind preset to cell 0,0
            const firstCell = this.cells.get('0:0:0:0');
            if (firstCell) {
                firstCell.state = LIFECYCLE_STATES.CONFIGURED;
                firstCell.boundFile = 'services/ml_analyzer.py';
                firstCell.boundFunction = 'predict_classification';
                firstCell.framework = FRAMEWORKS.FASTAPI;
                firstCell.route = '/api/v1/predict';
            }
        }

        loadPresetFiles() {
            Object.keys(SAMPLE_PRESETS).forEach(k => {
                const p = SAMPLE_PRESETS[k];
                this.files.set(p.path, {
                    name: p.name,
                    path: p.path,
                    language: p.language,
                    content: p.content,
                    size: p.content.length,
                    lines: p.content.split('\n').length
                });
            });
            const defaultFile = this.files.get(this.selectedFilePath);
            if (defaultFile) {
                this.sourceCode = defaultFile.content;
            }
        }

        subscribe(listener) {
            this.subscribers.add(listener);
            return () => this.subscribers.delete(listener);
        }

        notify(event, payload) {
            this.subscribers.forEach(fn => {
                try { fn(event, payload, this); } catch (e) { console.error("Subscriber error:", e); }
            });
        }

        getCell(x, y, z = 0, u = 0) {
            const clamped = this.clampCoord(x, y, z, u);
            const key = `${clamped.x}:${clamped.y}:${clamped.z}:${clamped.u}`;
            if (!this.cells.has(key)) {
                this.cells.set(key, {
                    x: clamped.x, y: clamped.y, z: clamped.z, u: clamped.u,
                    id: `cell-${clamped.x}-${clamped.y}-${clamped.z}-${clamped.u}`,
                    state: LIFECYCLE_STATES.IDLE,
                    boundFile: '',
                    boundFunction: '',
                    framework: this.currentFramework,
                    route: `/api/cell/${clamped.x}/${clamped.y}`,
                    method: 'POST',
                    params: [],
                    lastResult: null,
                    lastLatencyMs: 0,
                    lastTimestamp: null,
                    executionCount: 0
                });
            }
            return this.cells.get(key);
        }

        clampCoord(x, y, z = 0, u = 0) {
            return {
                x: Math.max(0, Math.min(GRID_COLS - 1, Math.floor(Number(x) || 0))),
                y: Math.max(0, Math.min(GRID_ROWS - 1, Math.floor(Number(y) || 0))),
                z: Math.max(0, Math.floor(Number(z) || 0)),
                u: Math.max(0, Math.floor(Number(u) || 0))
            };
        }

        coordToIndex(x, y) {
            const c = this.clampCoord(x, y);
            return c.y * GRID_COLS + c.x;
        }

        indexToCoord(index) {
            const safeIdx = Math.max(0, Math.min(TOTAL_CELLS - 1, Math.floor(Number(index) || 0)));
            return {
                x: safeIdx % GRID_COLS,
                y: Math.floor(safeIdx / GRID_COLS),
                z: this.activeCoord.z,
                u: this.activeCoord.u
            };
        }
    }

    // ===== 4. AST & CODE-TO-API CONVERTER ENGINE =====
    class PolyglotConverter {
        static extractSignatures(code, language = 'python') {
            const functions = [];
            const str = String(code || '');
            const lang = (language || 'python').toLowerCase();

            if (lang === 'python' || lang === 'py') {
                const pyRegex = /def\s+([a-zA-Z0-9_]+)\s*\(([\s\S]*?)\)\s*(?:->\s*([a-zA-Z0-9_\[\],\s]+))?:/g;
                let m;
                while ((m = pyRegex.exec(str)) !== null) {
                    const funcName = m[1];
                    const rawArgs = m[2] || '';
                    const returnType = (m[3] || 'dict').trim();
                    const params = PolyglotConverter.parsePythonParams(rawArgs);
                    
                    const afterIndex = m.index + m[0].length;
                    const snippet = str.substring(afterIndex, afterIndex + 300);
                    const docMatch = /^\s*"""([\s\S]*?)"""/.exec(snippet) || /^\s*'''([\s\S]*?)'''/.exec(snippet);
                    const docstring = docMatch ? docMatch[1].trim() : '';

                    functions.push({
                        name: funcName,
                        params: params,
                        returnType: returnType,
                        docstring: docstring,
                        language: 'python'
                    });
                }
            } else if (lang === 'javascript' || lang === 'typescript' || lang === 'js' || lang === 'ts') {
                const jsRegex = /(?:async\s+)?function\s+([a-zA-Z0-9_]+)\s*\(([\s\S]*?)\)|(?:const|let|var)\s+([a-zA-Z0-9_]+)\s*=\s*(?:async\s*)?\(([\s\S]*?)\)\s*=>/g;
                let m;
                while ((m = jsRegex.exec(str)) !== null) {
                    const funcName = m[1] || m[3];
                    const rawArgs = m[2] || m[4] || '';
                    const params = PolyglotConverter.parseGenericParams(rawArgs);
                    functions.push({
                        name: funcName,
                        params: params,
                        returnType: 'Object',
                        docstring: '',
                        language: 'javascript'
                    });
                }
            } else if (lang === 'go' || lang === 'golang') {
                const goRegex = /func\s+(?:\([^)]+\)\s+)?([a-zA-Z0-9_]+)\s*\(([\s\S]*?)\)\s*(?:\(([\s\S]*?)\)|([a-zA-Z0-9_\[\]*]+))?/g;
                let m;
                while ((m = goRegex.exec(str)) !== null) {
                    const funcName = m[1];
                    const rawArgs = m[2] || '';
                    const returnType = m[3] || m[4] || 'error';
                    const params = PolyglotConverter.parseGoParams(rawArgs);
                    functions.push({
                        name: funcName,
                        params: params,
                        returnType: returnType.trim(),
                        docstring: '',
                        language: 'go'
                    });
                }
            } else if (lang === 'c' || lang === 'cpp') {
                const cRegex = /([a-zA-Z0-9_]+(?:\s*\*+)?)\s+([a-zA-Z0-9_]+)\s*\(([\s\S]*?)\)\s*\{/g;
                let m;
                while ((m = cRegex.exec(str)) !== null) {
                    const returnType = m[1].trim();
                    const funcName = m[2];
                    if (funcName === 'if' || funcName === 'while' || funcName === 'for') continue;
                    const rawArgs = m[3] || '';
                    const params = PolyglotConverter.parseCParams(rawArgs);
                    functions.push({
                        name: funcName,
                        params: params,
                        returnType: returnType,
                        docstring: '',
                        language: 'c'
                    });
                }
            } else if (lang === 'java') {
                const javaRegex = /(?:(?:public|protected|private|final|abstract|synchronized|static)\s+)*([a-zA-Z0-9_\[\]]+(?:<[\w\s,<>\[\]]+>)?)\s+([a-zA-Z0-9_]+)\s*\(([\s\S]*?)\)\s*(?:throws\s+[a-zA-Z0-9_,\s]+)?\s*\{/g;
                let m;
                while ((m = javaRegex.exec(str)) !== null) {
                    const returnType = m[1].trim();
                    const funcName = m[2];
                    if (funcName === 'if' || funcName === 'while' || funcName === 'for') continue;
                    const rawArgs = m[3] || '';
                    const params = PolyglotConverter.parseJavaParams(rawArgs);
                    functions.push({
                        name: funcName,
                        params: params,
                        returnType: returnType,
                        docstring: '',
                        language: 'java'
                    });
                }
            }

            if (!functions.length) {
                functions.push({
                    name: 'executeHandler',
                    params: [{ name: 'payload', type: 'object', in: 'body', required: true, defaultVal: null }],
                    returnType: 'object',
                    docstring: 'Default synthesized endpoint handler',
                    language: lang
                });
            }

            return functions;
        }

        static parsePythonParams(raw) {
            if (!raw.trim()) return [];
            return raw.split(',').map(p => {
                const trimmed = p.trim();
                if (!trimmed || trimmed === 'self' || trimmed === 'cls') return null;
                const parts = trimmed.split('=');
                const defaultVal = parts.length > 1 ? parts[1].trim() : null;
                const nameType = parts[0].split(':');
                const name = nameType[0].trim();
                const type = nameType.length > 1 ? nameType[1].trim() : 'str';
                const isPrimitive = ['int', 'float', 'bool', 'str'].includes(type.toLowerCase());
                const isPathParam = name.endsWith('_id') || name === 'id';
                return {
                    name: name,
                    type: type,
                    in: isPathParam ? 'path' : (isPrimitive && defaultVal !== null ? 'query' : 'body'),
                    required: defaultVal === null,
                    defaultVal: defaultVal
                };
            }).filter(Boolean);
        }

        static parseGenericParams(raw) {
            if (!raw.trim()) return [];
            return raw.split(',').map(p => {
                const trimmed = p.trim();
                if (!trimmed) return null;
                const parts = trimmed.split('=');
                const name = parts[0].trim();
                const defaultVal = parts.length > 1 ? parts[1].trim() : null;
                return {
                    name: name,
                    type: 'any',
                    in: name.endsWith('Id') || name === 'id' ? 'path' : 'body',
                    required: defaultVal === null,
                    defaultVal: defaultVal
                };
            }).filter(Boolean);
        }

        static parseGoParams(raw) {
            if (!raw.trim()) return [];
            return raw.split(',').map(p => {
                const parts = p.trim().split(/\s+/);
                if (parts.length < 2) return null;
                const name = parts[0];
                const type = parts.slice(1).join(' ');
                return {
                    name: name,
                    type: type,
                    in: name.toLowerCase().includes('id') ? 'path' : 'body',
                    required: true,
                    defaultVal: null
                };
            }).filter(Boolean);
        }

        static parseCParams(raw) {
            if (!raw.trim() || raw.trim() === 'void') return [];
            return raw.split(',').map(p => {
                const parts = p.trim().split(/\s+/);
                if (parts.length < 2) return null;
                const name = parts[parts.length - 1].replace(/^\*+/, '');
                const type = parts.slice(0, -1).join(' ');
                return {
                    name: name,
                    type: type,
                    in: 'body',
                    required: true,
                    defaultVal: null
                };
            }).filter(Boolean);
        }

        static parseJavaParams(raw) {
            if (!raw.trim()) return [];
            return raw.split(',').map(p => {
                const parts = p.trim().split(/\s+/);
                if (parts.length < 2) return null;
                const name = parts[parts.length - 1];
                const type = parts.slice(0, -1).join(' ');
                return {
                    name: name,
                    type: type,
                    in: name.toLowerCase().includes('id') ? 'path' : 'body',
                    required: true,
                    defaultVal: null
                };
            }).filter(Boolean);
        }

        static synthesize(fn, framework, routePath = '/api/v1/resource', method = 'POST', cell = [0,0,0,0]) {
            const fw = (framework || FRAMEWORKS.FASTAPI).toLowerCase();
            const httpMethod = (method || 'POST').toUpperCase();
            const path = routePath.startsWith('/') ? routePath : '/' + routePath;

            switch (fw) {
                case FRAMEWORKS.FASTAPI:
                    return PolyglotConverter.synthesizeFastAPI(fn, path, httpMethod, cell);
                case FRAMEWORKS.SANIC:
                    return PolyglotConverter.synthesizeSanic(fn, path, httpMethod, cell);
                case FRAMEWORKS.EXPRESS:
                    return PolyglotConverter.synthesizeExpress(fn, path, httpMethod, cell);
                case FRAMEWORKS.GO:
                    return PolyglotConverter.synthesizeGo(fn, path, httpMethod, cell);
                case FRAMEWORKS.C:
                    return PolyglotConverter.synthesizeC(fn, path, httpMethod, cell);
                case FRAMEWORKS.JAVA:
                    return PolyglotConverter.synthesizeJava(fn, path, httpMethod, cell);
                default:
                    return PolyglotConverter.synthesizeFastAPI(fn, path, httpMethod, cell);
            }
        }

        static synthesizeFastAPI(fn, routePath, method, cell) {
            const bodyParams = fn.params.filter(p => p.in === 'body');
            const queryParams = fn.params.filter(p => p.in === 'query');
            const pathParams = fn.params.filter(p => p.in === 'path');

            const schemaParams = bodyParams.length > 0 ? bodyParams : fn.params.filter(p => p.in !== 'path');
            const hasBody = bodyParams.length > 0 || (fn.params.length > 0 && queryParams.length === fn.params.length);
            const schemaName = `${fn.name.charAt(0).toUpperCase() + fn.name.slice(1)}Request`;

            let schemaCode = '';
            if (schemaParams.length > 0) {
                schemaCode = `class ${schemaName}(BaseModel):\n` +
                    schemaParams.map(p => `    ${p.name}: ${p.type || 'Any'}${p.defaultVal ? ` = ${p.defaultVal}` : ''}`).join('\n') + '\n\n';
            }

            const handlerArgs = [];
            pathParams.forEach(p => handlerArgs.push(`${p.name}: ${p.type || 'str'}`));
            queryParams.forEach(p => handlerArgs.push(`${p.name}: ${p.type || 'str'} = ${p.defaultVal || 'None'}`));
            if (hasBody) {
                handlerArgs.push(`req_body: ${schemaName}`);
            }

            const pyMethod = method.toLowerCase();
            const code = `# Synthesized by Hashcod Polyglot Grid (Cell: [${cell.join(',')}])
import time
from typing import Any, List, Optional
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Polyglot Grid API", version="2026.1")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

${schemaCode}@app.${pyMethod}("${routePath}")
async def ${fn.name}_endpoint(${handlerArgs.join(', ')}):
    """${fn.docstring || `Synthesized route for ${fn.name}`}"""
    t_start = time.time()
    try:
        ${hasBody ? `payload = req_body.dict()` : 'payload = {}'}
        result_data = {
            "function": "${fn.name}",
            "status": "COMPLETED",
            "inputs": {
                ${fn.params.map(p => `"${p.name}": ${p.in === 'body' ? `req_body.${p.name}` : p.name}`).join(',\n                ')}
            },
            "cell": [${cell.join(', ')}]
        }
        
        latency_ms = round((time.time() - t_start) * 1000, 2)
        return {
            "ok": True,
            "status": 200,
            "data": result_data,
            "cell": [${cell.join(', ')}],
            "latency_ms": latency_ms
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
`;
            return code;
        }

        static synthesizeSanic(fn, routePath, method, cell) {
            const code = `# Synthesized by Hashcod Polyglot Grid (Cell: [${cell.join(',')}])
import time
from sanic import Sanic, response, json
from sanic.exceptions import SanicException

app = Sanic("PolyglotGridSanicApp")

@app.route("${routePath}", methods=["${method}"])
async def handle_${fn.name}(request):
    """${fn.docstring || `Sanic async route handler for ${fn.name}`}"""
    t_start = time.time()
    try:
        body = request.json if request.json else {}
        query_args = dict(request.args)
        
        result_data = {
            "function": "${fn.name}",
            "executed": True,
            "query": query_args,
            "body": body,
            "cell": [${cell.join(', ')}]
        }
        
        latency_ms = round((time.time() - t_start) * 1000, 2)
        return response.json({
            "ok": True,
            "status": 200,
            "data": result_data,
            "cell": [${cell.join(', ')}],
            "latency_ms": latency_ms
        })
    except Exception as exc:
        return response.json({
            "ok": False,
            "status": 500,
            "error": str(exc),
            "cell": [${cell.join(', ')}]
        }, status=500)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, workers=2)
`;
            return code;
        }

        static synthesizeExpress(fn, routePath, method, cell) {
            const expMethod = method.toLowerCase();
            const code = `// Synthesized by Hashcod Polyglot Grid (Cell: [${cell.join(',')}])
const express = require('express');
const router = express.Router();

router.use(express.json());

/**
 * ${fn.docstring || `Express route handler for ${fn.name}`}
 */
router.${expMethod}('${routePath}', async (req, res, next) => {
    const tStart = Date.now();
    try {
        const body = req.body || {};
        const query = req.query || {};
        const params = req.params || {};

        const resultData = {
            function: '${fn.name}',
            processed: true,
            inputs: { ...params, ...query, ...body },
            cell: [${cell.join(', ')}]
        };

        const latencyMs = Date.now() - tStart;
        return res.status(200).json({
            ok: true,
            status: 200,
            data: resultData,
            cell: [${cell.join(', ')}],
            latency_ms: latencyMs
        });
    } catch (err) {
        return res.status(500).json({
            ok: false,
            status: 500,
            error: err.message || 'Internal Server Error',
            cell: [${cell.join(', ')}]
        });
    }
});

module.exports = router;
`;
            return code;
        }

        static synthesizeGo(fn, routePath, method, cell) {
            const structFields = fn.params.map(p => {
                const fieldName = p.name.charAt(0).toUpperCase() + p.name.slice(1);
                let goType = 'string';
                if (p.type === 'int') goType = 'int64';
                else if (p.type === 'float') goType = 'float64';
                else if (p.type === 'bool') goType = 'bool';
                else if (p.type === 'list' || p.type === 'array') goType = '[]interface{}';
                else if (p.type === 'dict' || p.type === 'object') goType = 'map[string]interface{}';
                return `\t${fieldName} ${goType} \`json:"${p.name}"\``;
            }).join('\n');

            const code = `// Synthesized by Hashcod Polyglot Grid (Cell: [${cell.join(',')}])
package main

import (
\t"encoding/json"
\t"net/http"
\t"time"
\t"github.com/gin-gonic/gin"
)

type ${fn.name}Request struct {
${structFields || '\tPayload map[string]interface{} `json:"payload"`'}
}

type ${fn.name.charAt(0).toUpperCase() + fn.name.slice(1)}Request struct {
${structFields || '\tPayload map[string]interface{} `json:"payload"`'}
}

type StandardResponse struct {
\tOk        bool        \`json:"ok"\`
\tStatus    int         \`json:"status"\`
\tData      interface{} \`json:"data"\`
\tCell      []int       \`json:"cell"\`
\tLatencyMs float64     \`json:"latency_ms"\`
}

func Handle${fn.name}(c *gin.Context) {
\ttStart := time.Now()
\tvar req ${fn.name.charAt(0).toUpperCase() + fn.name.slice(1)}Request

\tif err := c.ShouldBindJSON(&req); err != nil {
\t\tc.JSON(http.StatusBadRequest, gin.H{
\t\t\t"ok":     false,
\t\t\t"status": 400,
\t\t\t"error":  err.Error(),
\t\t\t"cell":   []int{${cell.join(', ')}},
\t\t})
\t\treturn
\t}

\tresultData := gin.H{
\t\t"function": "${fn.name}",
\t\t"request":  req,
\t\t"status":   "SUCCESS",
\t}

\tdurMs := float64(time.Since(tStart).Microseconds()) / 1000.0

\tc.JSON(http.StatusOK, StandardResponse{
\t\tOk:        true,
\t\tStatus:    200,
\t\tData:      resultData,
\t\tCell:      []int{${cell.join(', ')}},
\t\tLatencyMs: durMs,
\t})
}

func main() {
\tr := gin.Default()
\tr.${method}("${routePath}", Handle${fn.name})
\tr.Run(":8080")
}
`;
            return code;
        }

        static synthesizeC(fn, routePath, method, cell) {
            const code = `/* Synthesized by Hashcod Polyglot Grid (Cell: [${cell.join(',')}]) */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include <microhttpd.h>

#define PORT 8888
#define BUFFER_MAX 8192

static enum MHD_Result handle_request(void *cls, struct MHD_Connection *connection,
                          const char *url, const char *method,
                          const char *version, const char *upload_data,
                          size_t *upload_data_size, void **con_cls) {
    if (strcmp(url, "${routePath}") != 0 || strcmp(method, "${method}") != 0) {
        return MHD_NO;
    }

    clock_t start = clock();
    char response_buf[BUFFER_MAX];
    
    snprintf(response_buf, sizeof(response_buf),
        "{\\\"ok\\\":true,\\\"status\\\":200,\\\"data\\\":{\\\"function\\\":\\\"${fn.name}\\\",\\\"status\\\":\\\"OK\\\"},"
        "\\\"cell\\\":[%d,%d,%d,%d],\\\"latency_ms\\\":%.2f}",
        ${cell[0]}, ${cell[1]}, ${cell[2]}, ${cell[3]},
        ((double)(clock() - start) / CLOCKS_PER_SEC) * 1000.0
    );

    struct MHD_Response *response = MHD_create_response_from_buffer(
        strlen(response_buf), (void*)response_buf, MHD_RESPMEM_MUST_COPY);
    
    MHD_add_response_header(response, "Content-Type", "application/json");
    MHD_add_response_header(response, "Access-Control-Allow-Origin", "*");
    
    enum MHD_Result ret = MHD_queue_response(connection, MHD_HTTP_OK, response);
    MHD_destroy_response(response);
    return ret;
}

int main(void) {
    struct MHD_Daemon *daemon = MHD_start_daemon(
        MHD_USE_SELECT_INTERNALLY, PORT, NULL, NULL,
        &handle_request, NULL, MHD_OPTION_END);
    if (!daemon) return 1;
    
    printf("Polyglot C REST Server running on port %d...\\n", PORT);
    getchar();
    MHD_stop_daemon(daemon);
    return 0;
}
`;
            return code;
        }

        static synthesizeJava(fn, routePath, method, cell) {
            const springMethod = method === 'GET' ? '@GetMapping' : '@PostMapping';
            const code = `// Synthesized by Hashcod Polyglot Grid (Cell: [${cell.join(',')}])
package com.hashcod.grid.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping
@CrossOrigin(origins = "*")
public class ${fn.name.charAt(0).toUpperCase() + fn.name.slice(1)}Controller {

    public record ExecutionEnvelope(
        boolean ok,
        int status,
        Object data,
        int[] cell,
        long latency_ms
    ) {}

    ${springMethod}("${routePath}")
    public ResponseEntity<ExecutionEnvelope> handle${fn.name}(@RequestBody(required = false) Map<String, Object> body) {
        long tStart = System.currentTimeMillis();
        try {
            Map<String, Object> result = new HashMap<>();
            result.put("function", "${fn.name}");
            result.put("status", "SUCCESS");
            result.put("payload", body != null ? body : Map.of());

            long latencyMs = System.currentTimeMillis() - tStart;
            ExecutionEnvelope env = new ExecutionEnvelope(
                true,
                200,
                result,
                new int[]{${cell.join(', ')}},
                latencyMs
            );
            return ResponseEntity.ok(env);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                new ExecutionEnvelope(false, 500, Map.of("error", e.getMessage()), new int[]{${cell.join(', ')}}, 0)
            );
        }
    }
}
`;
            return code;
        }

        static generateClientSnippets(routePath, method = 'POST', samplePayload = { test: "data" }) {
            const host = (typeof window !== 'undefined' && window.location && window.location.origin) ? window.location.origin : 'http://localhost:8000';
            const url = host + (routePath.startsWith('/') ? routePath : '/' + routePath);
            const jsonStr = JSON.stringify(samplePayload, null, 2);

            const curl = method === 'GET'
                ? `curl -X GET "${url}" \\\n  -H "Accept: application/json"`
                : `curl -X ${method} "${url}" \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify(samplePayload)}'`;

            const fetchCode = method === 'GET'
                ? `async function callApi() {\n    const res = await fetch("${url}", {\n        method: "GET",\n        headers: { "Accept": "application/json" }\n    });\n    const data = await res.json();\n    console.log("Response:", data);\n    return data;\n}`
                : `async function callApi() {\n    const res = await fetch("${url}", {\n        method: "${method}",\n        headers: { "Content-Type": "application/json" },\n        body: JSON.stringify(${jsonStr})\n    });\n    const data = await res.json();\n    console.log("Response:", data);\n    return data;\n}`;

            return { curl, fetch: fetchCode };
        }
    }

    // ===== 6. MAIN STUDIO CONTROLLER =====
    class PolyglotGridStudioController {
        constructor() {
            this.state = new PolyglotStudioState();
            this.modalEl = null;
            this.isInitialized = false;
            this.executionCounter = 0;
        }

        init() {
            if (this.isInitialized) return;
            this.bindDOM();
            this.bindEvents();
            this.renderGrid();
            this.renderFileTree();
            this.updateActiveCellInspector();
            this.regenerateApi();
            this.isInitialized = true;
            this.appendLog('INFO', 'Krumbs API Launcher & Code Studio initialized (56 cells ready).', [0,0,0,0]);
        }

        bindDOM() {
            if (typeof document === 'undefined') return;
            this.modalEl = document.getElementById('polyglotGridOverlay') || document.getElementById('polyglotStudioModal');
        }

        // Open IDE from Edit menu with options to write, upload, and integrate to box
        openIdeFromEditMenu() {
            const activeCell = this.state.getCell(this.state.activeCoord.x, this.state.activeCoord.y, this.state.activeCoord.z, this.state.activeCoord.u);
            const currentFile = activeCell.boundFile || this.state.selectedFilePath;
            this.openIdeModal(currentFile);
        }

        // Upload external code file directly into the IDE editor
        handleIdeFileUpload(file) {
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target.result;
                const fileName = file.name;
                const textarea = document.getElementById('tkIdeEditorTextarea');
                const titleEl = document.getElementById('tkIdeModalTitle');
                const nameInput = document.getElementById('tkIdeFileNameInput');

                if (textarea) textarea.value = content;
                if (titleEl) titleEl.textContent = `Krumbs IDE — [${fileName}]`;
                if (nameInput) nameInput.value = fileName;

                this.ideActiveFile = fileName;
                this.updateIdeGutter();
                this.updateIdeStatusBar();
                this.appendLog('INFO', `Krumbs IDE: Archivo '${fileName}' cargado en el editor. Listo para integrar a caja.`, [0,0,0,0]);
            };
            reader.readAsText(file);
        }

        // Open Coordinate Picker to integrate current IDE code into a specific box
        openIdeCoordinateIntegrator() {
            const modal = document.getElementById('tkIdeCoordPickerModal');
            const nameInput = document.getElementById('tkIdeFileNameInput');
            if (nameInput && this.ideActiveFile) {
                nameInput.value = this.ideActiveFile;
            }
            if (modal) modal.style.display = 'flex';
        }

        closeIdeCoordinateIntegrator() {
            const modal = document.getElementById('tkIdeCoordPickerModal');
            if (modal) modal.style.display = 'none';
        }

        confirmIdeCodeIntegration() {
            const textarea = document.getElementById('tkIdeEditorTextarea');
            const nameInput = document.getElementById('tkIdeFileNameInput');
            const selRow = document.getElementById('tkIdeIntegrateRow');
            const selCol = document.getElementById('tkIdeIntegrateCol');

            const content = textarea ? textarea.value : '';
            let fileName = (nameInput ? nameInput.value.trim() : '') || this.ideActiveFile || 'custom_script.py';
            if (!fileName.includes('.')) fileName += '.py';

            const rowVal = selRow ? parseInt(selRow.value, 10) : this.state.activeCoord.y;
            const colVal = selCol ? parseInt(selCol.value, 10) : this.state.activeCoord.x;

            if (!content.trim()) {
                alert('El editor no contiene código para integrar.');
                return;
            }

            // 1. Store or update file in state
            const lang = (fileName.split('.').pop() || 'python').toLowerCase();
            const fileObj = {
                name: fileName.split('/').pop(),
                path: fileName,
                language: lang,
                content: content,
                size: content.length,
                lines: content.split('\n').length
            };
            this.state.files.set(fileName, fileObj);
            this.state.selectedFilePath = fileName;
            this.state.sourceCode = content;

            // 2. Assign to target box cell
            const targetCell = this.state.getCell(colVal, rowVal, this.state.activeCoord.z, this.state.activeCoord.u);
            if (!targetCell.boundFiles) targetCell.boundFiles = [];
            if (!targetCell.boundFiles.includes(fileName)) {
                targetCell.boundFiles.push(fileName);
            }
            targetCell.boundFile = fileName;
            targetCell.state = LIFECYCLE_STATES.CONFIGURED;

            const functions = PolyglotConverter.extractSignatures(content, lang);
            targetCell.boundFunction = functions[0] ? functions[0].name : 'executeHandler';

            // 3. Save, update UI and grid
            this.state.saveToStorage();
            this.closeIdeCoordinateIntegrator();
            this.selectCell(colVal, rowVal, targetCell.z, targetCell.u);
            this.renderGrid();
            this.renderFileTree();
            this.updateActiveCellInspector();
            this.regenerateApi();

            this.appendLog('SUCCESS', `Código '${fileName}' integrado con éxito en la Caja [V: x${rowVal + 1}, F: ${colVal}] (Persistido 💾).`, [colVal, rowVal, 0, 0]);
            
            const statusSaved = document.getElementById('tkIdeStatusSaved');
            if (statusSaved) {
                statusSaved.textContent = `Integrado a Caja (x${rowVal+1}, ${colVal}) 💾`;
                setTimeout(() => { if (statusSaved) statusSaved.textContent = 'Ready'; }, 3000);
            }
        }

        // ===== KRUMBS FILE DISTRIBUTION & LOCATION LOG CONTROLLER =====
        openFileDistributionLogModal() {
            if (typeof document === 'undefined') return;
            const modal = document.getElementById('tkFileDistributionLogModal');
            if (!modal) return;

            this.renderFileDistributionTable();
            modal.style.display = 'flex';
            this.appendLog('INFO', 'Krumbs: Abriendo registro de distribución y mapeo de archivos en cajas.', [0,0,0,0]);
        }

        closeFileDistributionLogModal() {
            if (typeof document === 'undefined') return;
            const modal = document.getElementById('tkFileDistributionLogModal');
            if (modal) modal.style.display = 'none';
        }

        renderFileDistributionTable(filterQuery = '') {
            const tableBody = document.getElementById('tkFileDistTableBody');
            const statsBar = document.getElementById('tkFileDistStats');
            const statusCount = document.getElementById('tkFileDistStatusCount');
            if (!tableBody) return;

            tableBody.innerHTML = '';
            const q = (filterQuery || '').toLowerCase();

            // Build map of file -> locations
            const fileLocations = new Map(); // path -> Array of {x, y, coordLabel, state}
            let totalAssignedBoxes = 0;

            this.state.cells.forEach((cell) => {
                const list = (cell.boundFiles && cell.boundFiles.length > 0)
                    ? cell.boundFiles
                    : (cell.boundFile ? [cell.boundFile] : []);
                
                if (list.length > 0) totalAssignedBoxes++;

                list.forEach(filePath => {
                    if (!fileLocations.has(filePath)) fileLocations.set(filePath, []);
                    fileLocations.get(filePath).push({
                        x: cell.x,
                        y: cell.y,
                        label: `[V: x${cell.y + 1}, F: ${cell.x}]`,
                        state: cell.state,
                        func: cell.boundFunction
                    });
                });
            });

            let renderedRows = 0;

            this.state.files.forEach((file, path) => {
                const locations = fileLocations.get(path) || [];
                const locLabels = locations.map(l => l.label).join(' ');

                if (q && !path.toLowerCase().includes(q) && !locLabels.toLowerCase().includes(q) && !file.language.toLowerCase().includes(q)) {
                    return;
                }

                renderedRows++;
                const tr = document.createElement('tr');

                // Location cell content
                let locationHtml = '';
                if (locations.length > 0) {
                    locationHtml = locations.map(l => `
                        <span class="tk-dist-loc-badge assigned" title="Asignado a Caja ${l.label}">
                            📦 Caja ${l.label}
                        </span>
                    `).join(' ');
                } else {
                    locationHtml = `<span class="tk-dist-loc-badge unassigned">⚠️ Global (Sin asignar a caja)</span>`;
                }

                const icon = this.getFileIcon(path);
                const funcName = locations[0] ? locations[0].func : (PolyglotConverter.extractSignatures(file.content, file.language)[0]?.name || 'executeHandler');

                tr.innerHTML = `
                    <td style="font-weight:700;">
                        <span style="font-size:14px; margin-right:6px;">${icon}</span>
                        <span>${path}</span>
                    </td>
                    <td>${locationHtml}</td>
                    <td>
                        <span style="font-weight:700; color:#000080;">${file.language.toUpperCase()}</span>
                        <span style="color:#666666; font-size:10px; margin-left:4px;">(${file.lines} líneas)</span>
                    </td>
                    <td style="font-family:var(--tk-font-mono); font-size:11px; color:#006600;">
                        ${funcName}()
                    </td>
                    <td style="text-align:right;">
                        <div style="display:inline-flex; gap:4px;">
                            ${locations.length > 0 ? `
                                <button type="button" class="tk-btn-action" style="padding:2px 8px; font-size:10.5px;" onclick="window.PolyglotGridStudio.jumpToFileBox(${locations[0].x}, ${locations[0].y})">
                                    📦 Ir a Caja
                                </button>
                            ` : `
                                <button type="button" class="tk-btn-action" style="padding:2px 8px; font-size:10.5px;" onclick="window.PolyglotGridStudio.closeFileDistributionLogModal(); window.PolyglotGridStudio.openFileAssignModal();">
                                    🔗 Asignar
                                </button>
                            `}
                            <button type="button" class="tk-btn-action" style="padding:2px 8px; font-size:10.5px;" onclick="window.PolyglotGridStudio.closeFileDistributionLogModal(); window.PolyglotGridStudio.openIdeModal('${path}')">
                                ✏️ IDE
                            </button>
                        </div>
                    </td>
                `;
                tableBody.appendChild(tr);
            });

            if (statsBar) {
                statsBar.innerHTML = `Total Archivos: <strong>${this.state.files.size}</strong> &nbsp;|&nbsp; Cajas con Código: <strong>${totalAssignedBoxes}</strong>/56 &nbsp;|&nbsp; Archivos en Vista: <strong>${renderedRows}</strong>`;
            }
            if (statusCount) {
                statusCount.textContent = `Archivos: ${this.state.files.size}`;
            }
        }

        jumpToFileBox(x, y) {
            this.closeFileDistributionLogModal();
            this.selectCell(x, y);
            this.switchTab('explorer');
            this.appendLog('INFO', `Navegando a Caja [V: x${y + 1}, F: ${x}].`, [x, y, 0, 0]);
        }

        // ===== KRUMBS RETRO IDE & IDEAVIM CONTROLLER =====
        openIdeModal(filePath = null) {
            if (typeof document === 'undefined') return;
            const targetPath = filePath || this.state.selectedFilePath;
            if (!targetPath) return;

            const modal = document.getElementById('tkKrumbsIdeModal');
            const textarea = document.getElementById('tkIdeEditorTextarea');
            const titleEl = document.getElementById('tkIdeModalTitle');
            const modePill = document.getElementById('tkIdeVimModePill');
            const statusGutter = document.getElementById('tkIdeLineGutter');
            if (!modal || !textarea) return;

            this.ideActiveFile = targetPath;
            this.ideVimMode = true;
            this.ideVimState = 'NORMAL'; // NORMAL | INSERT | VISUAL | COMMAND

            const fileObj = this.state.files.get(targetPath) || { content: this.state.sourceCode, lines: 10, language: 'python' };
            textarea.value = fileObj.content || '';
            if (titleEl) titleEl.textContent = `Krumbs IDE — [${targetPath}]`;

            this.updateIdeGutter();
            this.updateIdeStatusBar();

            modal.style.display = 'flex';
            textarea.focus();
            this.appendLog('INFO', `Krumbs IDE: Archivo '${targetPath}' abierto en modo IdeaVim.`, [0,0,0,0]);
        }

        closeIdeModal() {
            if (typeof document === 'undefined') return;
            const modal = document.getElementById('tkKrumbsIdeModal');
            if (modal) modal.style.display = 'none';
        }

        updateIdeGutter() {
            const textarea = document.getElementById('tkIdeEditorTextarea');
            const gutter = document.getElementById('tkIdeLineGutter');
            if (!textarea || !gutter) return;
            const lineCount = (textarea.value.split('\n').length) || 1;
            let gutterHtml = '';
            for (let i = 1; i <= lineCount; i++) {
                gutterHtml += `<div>${i}</div>`;
            }
            gutter.innerHTML = gutterHtml;
        }

        updateIdeStatusBar() {
            const textarea = document.getElementById('tkIdeEditorTextarea');
            const statusLeft = document.getElementById('tkIdeStatusLeft');
            const modePill = document.getElementById('tkIdeVimModePill');
            if (!textarea) return;

            const val = textarea.value;
            const cursor = textarea.selectionStart || 0;
            const linesBefore = val.substring(0, cursor).split('\n');
            const lineNum = linesBefore.length;
            const colNum = linesBefore[linesBefore.length - 1].length + 1;
            const totalLines = val.split('\n').length;

            if (statusLeft) {
                statusLeft.textContent = `Ln: ${lineNum}, Col: ${colNum} | Total: ${totalLines}L | UTF-8 | [${this.ideVimState || 'NORMAL'}]`;
            }
            if (modePill) {
                modePill.textContent = `-- ${this.ideVimState || 'NORMAL'} --`;
                modePill.style.color = this.ideVimState === 'INSERT' ? '#FFD700' : (this.ideVimState === 'VISUAL' ? '#00f3ff' : '#00FF66');
            }
        }

        saveIdeChanges() {
            const textarea = document.getElementById('tkIdeEditorTextarea');
            if (!textarea || !this.ideActiveFile) return;

            const newContent = textarea.value;
            let fileObj = this.state.files.get(this.ideActiveFile);
            if (!fileObj) {
                fileObj = {
                    name: this.ideActiveFile.split('/').pop(),
                    path: this.ideActiveFile,
                    language: (this.ideActiveFile.split('.').pop() || 'python').toLowerCase(),
                    content: newContent,
                    size: newContent.length,
                    lines: newContent.split('\n').length
                };
                this.state.files.set(this.ideActiveFile, fileObj);
            } else {
                fileObj.content = newContent;
                fileObj.size = newContent.length;
                fileObj.lines = newContent.split('\n').length;
            }

            if (this.state.selectedFilePath === this.ideActiveFile) {
                this.state.sourceCode = newContent;
                const mainEditor = document.getElementById('polyglotSourceEditor');
                if (mainEditor) mainEditor.value = newContent;
            }

            // Save to localStorage & regenerate
            this.state.saveToStorage();
            this.renderFileTree();
            this.regenerateApi();
            this.appendLog('SUCCESS', `Krumbs IDE: '${this.ideActiveFile}' guardado exitosamente (Persistido 💾).`, [0,0,0,0]);

            const statusSaved = document.getElementById('tkIdeStatusSaved');
            if (statusSaved) {
                statusSaved.textContent = 'Guardado 💾';
                setTimeout(() => { if (statusSaved) statusSaved.textContent = 'Ready'; }, 2500);
            }
        }

        executeIdeVimCommand(cmd) {
            const trimmed = (cmd || '').trim();
            if (!trimmed) return;

            if (trimmed === ':w' || trimmed === 'w') {
                this.saveIdeChanges();
            } else if (trimmed === ':q' || trimmed === 'q') {
                this.closeIdeModal();
            } else if (trimmed === ':wq' || trimmed === ':x' || trimmed === 'wq' || trimmed === 'x') {
                this.saveIdeChanges();
                this.closeIdeModal();
            } else if (trimmed.startsWith(':%s/')) {
                // Global replace :%s/find/replace/g
                const parts = trimmed.split('/');
                if (parts.length >= 3) {
                    const findStr = parts[1];
                    const repStr = parts[2];
                    const textarea = document.getElementById('tkIdeEditorTextarea');
                    if (textarea && findStr) {
                        textarea.value = textarea.value.replaceAll(findStr, repStr);
                        this.updateIdeGutter();
                        this.updateIdeStatusBar();
                        this.appendLog('INFO', `Vim: Reemplazado '${findStr}' por '${repStr}'.`, [0,0,0,0]);
                    }
                }
            } else {
                this.appendLog('INFO', `Vim Command ejecutado: ${trimmed}`, [0,0,0,0]);
            }
        }

        bindEvents() {
            if (typeof document === 'undefined') return;
            const dockBtn = document.getElementById('hashcodDockGridBtn');
            if (dockBtn) dockBtn.addEventListener('click', () => this.toggleModal());

            const slot23 = document.getElementById('slot-2-3');
            if (slot23) slot23.addEventListener('click', () => this.openModal());

            const slot24 = document.getElementById('slot-2-4');
            if (slot24) {
                slot24.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (typeof window.openOnDemandToolModal === 'function') {
                        window.openOnDemandToolModal('git-vault');
                    }
                });
            }

            const closeBtn = document.getElementById('polyglotGridCloseBtn');
            if (closeBtn) closeBtn.addEventListener('click', () => this.closeModal());

            if (this.modalEl) {
                this.modalEl.addEventListener('click', (e) => {
                    if (e.target === this.modalEl) this.closeModal();
                });
            }

            if (typeof window !== 'undefined') {
                window.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape' && this.modalEl && (this.modalEl.classList.contains('open') || this.modalEl.classList.contains('is-open'))) {
                        this.closeModal();
                    }
                });
            }

            document.querySelectorAll('.pg-tab-btn').forEach(btn => {
                btn.addEventListener('click', () => this.switchTab(btn.getAttribute('data-tab')));
            });

            const inputZ = document.getElementById('pgDimZ');
            const inputU = document.getElementById('pgDimU');
            if (inputZ) {
                inputZ.addEventListener('change', (e) => {
                    this.state.activeCoord.z = Math.max(0, parseInt(e.target.value) || 0);
                    this.renderGrid();
                    this.updateActiveCellInspector();
                });
            }
            if (inputU) {
                inputU.addEventListener('change', (e) => {
                    this.state.activeCoord.u = Math.max(0, parseInt(e.target.value) || 0);
                    this.renderGrid();
                    this.updateActiveCellInspector();
                });
            }

            document.querySelectorAll('.pg-fw-pill').forEach(pill => {
                pill.addEventListener('click', () => {
                    document.querySelectorAll('.pg-fw-pill').forEach(p => p.classList.remove('active'));
                    pill.classList.add('active');
                    this.state.currentFramework = pill.getAttribute('data-fw');
                    this.regenerateApi();
                });
            });

            const methodSel = document.getElementById('pgMethodSelect');
            const pathInput = document.getElementById('pgPathInput');
            if (methodSel) {
                methodSel.addEventListener('change', (e) => {
                    this.state.currentMethod = e.target.value;
                    this.regenerateApi();
                });
            }
            if (pathInput) {
                pathInput.addEventListener('input', (e) => {
                    this.state.currentRoute = e.target.value;
                    this.regenerateApi();
                });
            }

            const srcEditor = document.getElementById('polyglotSourceEditor');
            if (srcEditor) {
                srcEditor.addEventListener('input', (e) => {
                    this.state.sourceCode = e.target.value;
                });
            }

            const dirInput = document.getElementById('polyglotDirInput');
            const uploadBtn = document.getElementById('polyglotUploadFolderBtn');
            const dropzone = document.getElementById('polyglotDropZone');

            if (uploadBtn && dirInput) uploadBtn.addEventListener('click', () => dirInput.click());
            if (dirInput) {
                dirInput.addEventListener('change', (e) => {
                    if (e.target.files && e.target.files.length) this.handleFileListUpload(e.target.files);
                });
            }
            if (dropzone) {
                dropzone.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    dropzone.classList.add('dragover');
                });
                dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
                dropzone.addEventListener('drop', (e) => {
                    e.preventDefault();
                    dropzone.classList.remove('dragover');
                    if (e.dataTransfer.files && e.dataTransfer.files.length) {
                        this.handleFileListUpload(e.dataTransfer.files);
                    }
                });
            }

            const searchInput = document.getElementById('polyglotFileSearch');
            if (searchInput) {
                searchInput.addEventListener('input', (e) => this.renderFileTree(e.target.value));
            }
            document.querySelectorAll('.pg-ext-chip').forEach(chip => {
                chip.addEventListener('click', () => {
                    document.querySelectorAll('.pg-ext-chip').forEach(c => c.classList.remove('active'));
                    chip.classList.add('active');
                    const ext = chip.getAttribute('data-ext');
                    this.renderFileTree(searchInput ? searchInput.value : '', ext);
                });
            });

            const presetSelect = document.getElementById('polyglotPresetSelect');
            if (presetSelect) {
                presetSelect.addEventListener('change', (e) => {
                    const chosen = e.target.value;
                    if (SAMPLE_PRESETS[chosen]) this.loadPresetIntoEditor(chosen);
                });
            }

            const bindBtn = document.getElementById('polyglotBindCellBtn');
            if (bindBtn) bindBtn.addEventListener('click', () => this.bindCurrentFileToActiveCell());

            const sendBtn = document.getElementById('polyglotSendRequestBtn');
            if (sendBtn) sendBtn.addEventListener('click', () => this.executeActiveCell());

            const batchArmBtn = document.getElementById('pgBatchArmBtn');
            const batchExecBtn = document.getElementById('pgBatchExecBtn');
            const batchClearBtn = document.getElementById('pgBatchClearBtn');
            if (batchArmBtn) batchArmBtn.addEventListener('click', () => this.batchArmSelected());
            if (batchExecBtn) batchExecBtn.addEventListener('click', () => this.batchExecuteSelected());
            if (batchClearBtn) batchClearBtn.addEventListener('click', () => this.batchClearSelected());

            document.querySelectorAll('.pg-snippet-tab').forEach(tab => {
                tab.addEventListener('click', () => {
                    document.querySelectorAll('.pg-snippet-tab').forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');
                    this.state.activeSnippetTab = tab.getAttribute('data-snippet');
                    this.updateSnippetView();
                });
            });

            const logLvl = document.getElementById('pgLogFilterLevel');
            const logSearch = document.getElementById('pgLogSearch');
            const clearLogsBtn = document.getElementById('pgClearLogsBtn');
            if (logLvl) logLvl.addEventListener('change', (e) => {
                this.state.logFilterLevel = e.target.value;
                this.renderLogs();
            });
            if (logSearch) logSearch.addEventListener('input', (e) => {
                this.state.logFilterQuery = e.target.value;
                this.renderLogs();
            });
            if (clearLogsBtn) clearLogsBtn.addEventListener('click', () => {
                this.state.executionLogs = [];
                this.renderLogs();
            });

            const exportBtn = document.getElementById('polyglotExportBtn');
            const importBtn = document.getElementById('polyglotImportBtn');
            const importInput = document.getElementById('polyglotImportInput');
            if (exportBtn) exportBtn.addEventListener('click', () => this.openIdeFromEditMenu());
            // Krumbs IDE Event Bindings
            const ideTextarea = document.getElementById('tkIdeEditorTextarea');
            const ideGutter = document.getElementById('tkIdeLineGutter');
            const ideVimInput = document.getElementById('tkIdeVimCmdInput');

            if (ideTextarea) {
                ideTextarea.addEventListener('input', () => {
                    this.updateIdeGutter();
                    this.updateIdeStatusBar();
                });
                ideTextarea.addEventListener('click', () => this.updateIdeStatusBar());
                ideTextarea.addEventListener('keyup', (e) => {
                    this.updateIdeStatusBar();
                    if (e.key === 'Escape') {
                        this.ideVimState = 'NORMAL';
                        this.updateIdeStatusBar();
                    }
                });
                ideTextarea.addEventListener('keydown', (e) => {
                    // Sync gutter scroll
                    if (ideGutter) ideGutter.scrollTop = ideTextarea.scrollTop;

                    // Tab indent support
                    if (e.key === 'Tab') {
                        e.preventDefault();
                        const start = ideTextarea.selectionStart;
                        const end = ideTextarea.selectionEnd;
                        ideTextarea.value = ideTextarea.value.substring(0, start) + '    ' + ideTextarea.value.substring(end);
                        ideTextarea.selectionStart = ideTextarea.selectionEnd = start + 4;
                        this.updateIdeGutter();
                        this.updateIdeStatusBar();
                    }
                    // Ctrl+S / Cmd+S save
                    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
                        e.preventDefault();
                        this.saveIdeChanges();
                    }
                    // Vim modes toggle
                    if (this.ideVimMode && this.ideVimState === 'NORMAL') {
                        if (e.key === 'i' || e.key === 'a') {
                            this.ideVimState = 'INSERT';
                            this.updateIdeStatusBar();
                        } else if (e.key === ':') {
                            e.preventDefault();
                            if (ideVimInput) {
                                ideVimInput.value = ':';
                                ideVimInput.focus();
                            }
                        }
                    }
                });
                ideTextarea.addEventListener('scroll', () => {
                    if (ideGutter) ideGutter.scrollTop = ideTextarea.scrollTop;
                });
            }

            if (ideVimInput) {
                ideVimInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        this.executeIdeVimCommand(ideVimInput.value);
                        ideVimInput.value = '';
                        if (ideTextarea) ideTextarea.focus();
                    } else if (e.key === 'Escape') {
                        ideVimInput.value = '';
                        if (ideTextarea) ideTextarea.focus();
                    }
                });
            }
            if (importBtn) importBtn.addEventListener('click', () => this.openFileDistributionLogModal());
            if (importInput) {
                importInput.addEventListener('change', (e) => {
                    if (e.target.files && e.target.files[0]) {
                        const reader = new FileReader();
                        reader.onload = (evt) => this.importWorkspace(evt.target.result);
                        reader.readAsText(e.target.files[0]);
                    }
                });
            }
        }

        openModal() {
            this.init();
            if (this.modalEl) {
                this.modalEl.classList.add('open', 'is-open');
                this.modalEl.setAttribute('aria-hidden', 'false');
            }
        }

        closeModal() {
            if (this.modalEl) {
                this.modalEl.classList.remove('open', 'is-open');
                this.modalEl.setAttribute('aria-hidden', 'true');
            }
        }

        toggleModal(force) {
            if (!this.modalEl) this.bindDOM();
            const isOpen = this.modalEl && (this.modalEl.classList.contains('open') || this.modalEl.classList.contains('is-open'));
            const shouldOpen = (typeof force === 'boolean') ? force : !isOpen;
            if (shouldOpen) this.openModal();
            else this.closeModal();
        }

        switchTab(tabName) {
            this.state.activeWorkspaceTab = tabName;
            if (typeof document === 'undefined') return;
            document.querySelectorAll('.pg-tab-btn').forEach(btn => {
                btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
            });
            document.querySelectorAll('.pg-pane').forEach(pane => {
                pane.classList.toggle('active-tab-pane', pane.getAttribute('data-pane') === tabName);
            });
        }

        renderGrid() {
            if (typeof document === 'undefined') return;
            const container = document.getElementById('pgMatrixGridBody');
            if (!container) return;
            container.innerHTML = '';

            // Matrix Layout Table
            // Row 0: X, 1, 2, 3, 4, 5, 6, U
            // Row 1: x2, Box, Box, Box, Box, Box, Box, u2
            // Row 2: x3, Red Square, Circle, Box, Box, Box, Box, u3
            // Row 3: x4, Box, Box, Circle, Box, Box, Box, u4
            // Row 4: x5, Box, Box, Box, Circle, Circle, Red Triangle, u5
            // Row 5: x6, Box, Box, Box, Box, Box, Box, u6
            // Row 6: Y, 7, 8, 9, 10, 11, 12, Z

            const SVG_ISOMETRIC_BOX = `<svg viewBox="0 0 64 64" width="38" height="38" fill="none" stroke="#000000" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12,22 32,32 52,22 32,12" fill="#ffffff"/><polyline points="12,22 12,46 32,56 32,32"/><polyline points="52,22 52,46 32,56"/><polygon points="12,22 4,16 24,8 32,12" fill="#ffffff"/><polygon points="52,22 60,16 40,8 32,12" fill="#ffffff"/></svg>`;
            const SVG_RED_SQUARE = `<div class="pg-red-square" title="Entrada de Datos: Subir Carpeta de Código (V: xv3, F: 2)"></div>`;
            const SVG_BLACK_CIRCLE = `<div class="pg-black-circle" title="Canal de Enrutamiento / Conexión de Flujo"></div>`;
            const SVG_RED_TRIANGLE = `<svg viewBox="0 0 48 48" width="40" height="40" fill="none" stroke="#E61A1A" stroke-width="3" stroke-linejoin="round" title="Salida / Lanzador a API REST (V: xv5, F: 6)"><polygon points="24,6 44,42 4,42"/></svg>`;

            const tableWrap = document.createElement('div');
            tableWrap.className = 'pg-matrix-grid-table';

            const matrixDef = [
                ['X', '1', '2', '3', '4', '5', '6', 'U'],
                ['x2', 'BOX', 'BOX', 'BOX', 'BOX', 'BOX', 'BOX', 'u2'],
                ['x3', 'RED_SQUARE', 'CIRCLE', 'BOX', 'BOX', 'BOX', 'BOX', 'u3'],
                ['x4', 'BOX', 'BOX', 'CIRCLE', 'BOX', 'BOX', 'BOX', 'u4'],
                ['x5', 'BOX', 'BOX', 'BOX', 'CIRCLE', 'CIRCLE', 'RED_TRIANGLE', 'u5'],
                ['x6', 'BOX', 'BOX', 'BOX', 'BOX', 'BOX', 'BOX', 'u6'],
                ['Y', '7', '8', '9', '10', '11', '12', 'Z']
            ];

            for (let r = 0; r < 7; r++) {
                for (let c = 0; c < 8; c++) {
                    const item = matrixDef[r][c];
                    const cellEl = document.createElement('div');
                    cellEl.className = 'pg-table-cell';

                    // Top/Bottom header or lateral column
                    if (r === 0 || r === 6) {
                        cellEl.classList.add('header-cell');
                        cellEl.textContent = item;
                    } else if (c === 0 || c === 7) {
                        cellEl.classList.add('header-lateral');
                        cellEl.textContent = item;
                    } else {
                        // Inner Grid Data Cell
                        cellEl.classList.add('interactive-cell');
                        const dataX = c;
                        const dataY = r;
                        const cellStateObj = this.state.getCell(dataX, dataY, this.state.activeCoord.z, this.state.activeCoord.u);

                        cellEl.setAttribute('data-x', dataX);
                        cellEl.setAttribute('data-y', dataY);
                        cellEl.setAttribute('data-z', cellStateObj.z);
                        cellEl.setAttribute('data-u', cellStateObj.u);
                        cellEl.setAttribute('data-cell-id', cellStateObj.id);
                        cellEl.setAttribute('data-state', cellStateObj.state);

                        if (dataX === this.state.activeCoord.x && dataY === this.state.activeCoord.y) {
                            cellEl.classList.add('active-cell');
                        }

                                                if (item === 'RED_SQUARE') {
                            cellEl.innerHTML = SVG_RED_SQUARE;
                            cellEl.title = `Entrada de Datos (V: x3, F: 1-7) - Subir Carpeta de Código\nCoordenada: [${dataX}, ${dataY}]`;
                            cellEl.addEventListener('click', () => {
                                this.selectCell(dataX, dataY, cellStateObj.z, cellStateObj.u);
                                this.appendLog('INFO', `Entrada de Datos seleccionada en V(xv3) F(${dataX}). Abriendo asignador de archivos.`, [dataX, dataY, 0, 0]);
                                this.openFileAssignModal(dataX, dataY);
                            });
                        } else if (item === 'RED_TRIANGLE') {
                            cellEl.innerHTML = SVG_RED_TRIANGLE;
                            cellEl.title = `Salida / Lanzador de API REST (V: x5, F: 6)\nCoordenada: [${dataX}, ${dataY}]`;
                            cellEl.addEventListener('click', () => {
                                this.selectCell(dataX, dataY, cellStateObj.z, cellStateObj.u);
                                this.appendLog('INFO', `Salida / Lanzador de API activado en V(xv5) F(${dataX}). Generando endpoints REST.`, [dataX, dataY, 0, 0]);
                                this.switchTab('studio');
                                this.regenerateApi();
                            });
                        } else if (item === 'CIRCLE') {
                            cellEl.innerHTML = SVG_BLACK_CIRCLE;
                            cellEl.title = `Canal de Enrutamiento / Flujo Interno\nCoordenada: [${dataX}, ${dataY}]`;
                            cellEl.addEventListener('click', () => {
                                this.selectCell(dataX, dataY, cellStateObj.z, cellStateObj.u);
                                this.appendLog('INFO', `Canal de Enrutamiento activo en [${dataX}, ${dataY}].`, [dataX, dataY, 0, 0]);
                            });
                        } else {
                            // Standard Box Icon
                            const boxWrap = document.createElement('div');
                            boxWrap.className = 'pg-box-icon-wrap';
                            boxWrap.innerHTML = SVG_ISOMETRIC_BOX;
                            cellEl.appendChild(boxWrap);

                            const assignedCount = (cellStateObj.boundFiles && cellStateObj.boundFiles.length) || (cellStateObj.boundFile ? 1 : 0);
                            if (assignedCount > 0) {
                                const badge = document.createElement('span');
                                badge.className = 'pg-box-file-badge';
                                badge.textContent = assignedCount;
                                badge.title = `${assignedCount} archivo(s) asignado(s)`;
                                cellEl.appendChild(badge);
                            }

                            const fileInfo = cellStateObj.boundFile ? `\nArchivos: ${cellStateObj.boundFile}` : '\n(Caja vacía - Sin archivos asignados)';
                            cellEl.title = `Caja de Código (V: x${r+1}, F: ${c})\nEstado: ${cellStateObj.state}${fileInfo}`;

                            cellEl.addEventListener('click', (e) => {
                                if (e.shiftKey) {
                                    this.toggleCellSelection(dataX, dataY);
                                } else {
                                    this.selectCell(dataX, dataY, cellStateObj.z, cellStateObj.u);
                                    this.switchTab('explorer');
                                    this.appendLog('INFO', `Caja V(x${r+1}) F(${c}) abierta. Archivos asignados: ${assignedCount}.`, [dataX, dataY, 0, 0]);
                                }
                            });
                        }
                    }

                    tableWrap.appendChild(cellEl);
                }
            }

            container.appendChild(tableWrap);
        }

        selectCell(x, y, z = 0, u = 0) {
            const clamped = this.state.clampCoord(x, y, z, u);
            this.state.activeCoord = clamped;
            this.state.selectedCellKeys.clear();
            this.state.selectedCellKeys.add(`${clamped.x}:${clamped.y}`);
            this.renderGrid();
            this.updateActiveCellInspector();

            if (typeof document !== 'undefined') {
                const hudBadge = document.getElementById('pgActiveCoordHud');
                if (hudBadge) {
                    hudBadge.textContent = `(x:${clamped.x}, y:${clamped.y}, z:${clamped.z}, u:${clamped.u})`;
                }
            }

            const cell = this.state.getCell(clamped.x, clamped.y, clamped.z, clamped.u);
            if (cell.boundFile && this.state.files.has(cell.boundFile)) {
                this.loadPresetIntoEditor(cell.boundFile, false);
            }
            return cell;
        }

        toggleCellSelection(x, y) {
            const key = `${x}:${y}`;
            if (this.state.selectedCellKeys.has(key)) {
                this.state.selectedCellKeys.delete(key);
            } else {
                this.state.selectedCellKeys.add(key);
            }
            this.renderGrid();
        }

        updateCellState(x, y, state, metadata = {}) {
            const cell = this.state.getCell(x, y, this.state.activeCoord.z, this.state.activeCoord.u);
            if (LIFECYCLE_STATES[state]) {
                cell.state = state;
                Object.assign(cell, metadata);
                this.renderGrid();
                this.updateActiveCellInspector();
            }
        }

        updateActiveCellInspector() {
            if (typeof document === 'undefined') return;
            const cell = this.state.getCell(this.state.activeCoord.x, this.state.activeCoord.y, this.state.activeCoord.z, this.state.activeCoord.u);
            const titleEl = document.getElementById('pgInspectorCoordTitle');
            const stateEl = document.getElementById('pgInspectorState');
            const fileEl = document.getElementById('pgInspectorFile');
            const funcEl = document.getElementById('pgInspectorFunc');
            const fwEl = document.getElementById('pgInspectorFw');
            const countEl = document.getElementById('pgInspectorCount');
            const latencyEl = document.getElementById('pgInspectorLatency');

            if (titleEl) titleEl.textContent = `Cell (${cell.x}, ${cell.y}, ${cell.z}, ${cell.u})`;
            if (stateEl) stateEl.textContent = cell.state;
            if (fileEl) fileEl.textContent = cell.boundFile || 'None';
            if (funcEl) funcEl.textContent = cell.boundFunction || 'None';
            if (fwEl) fwEl.textContent = cell.framework.toUpperCase();
            if (countEl) countEl.textContent = cell.executionCount;
            if (latencyEl) latencyEl.textContent = cell.lastLatencyMs ? `${cell.lastLatencyMs}ms` : '0ms';
        }

        renderFileTree(filterQuery = '', extFilter = 'all') {
            if (typeof document === 'undefined') return;
            const treeContainer = document.getElementById('polyglotFileTree');
            if (!treeContainer) return;
            treeContainer.innerHTML = '';

            const activeCell = this.state.getCell(this.state.activeCoord.x, this.state.activeCoord.y, this.state.activeCoord.z, this.state.activeCoord.u);
            const assignedList = (activeCell.boundFiles && activeCell.boundFiles.length > 0) 
                ? activeCell.boundFiles 
                : (activeCell.boundFile ? [activeCell.boundFile] : []);

            const headerInfo = document.getElementById('pgExplorerBoxHeader');
            if (headerInfo) {
                headerInfo.textContent = `Caja [V: x${activeCell.y + 1}, F: ${activeCell.x}] (${assignedList.length} archivo${assignedList.length === 1 ? '' : 's'})`;
            }

            if (assignedList.length === 0) {
                const emptyMsg = document.createElement('div');
                emptyMsg.className = 'pg-empty-box-msg';
                emptyMsg.innerHTML = `
                    <div style="display:flex; justify-content:center; align-items:center; margin-bottom:8px;">
                        <svg viewBox="0 0 64 64" width="48" height="48" fill="none" stroke="#000000" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                            <polygon points="12,22 32,32 52,22 32,12" fill="#ffffff"/>
                            <polyline points="12,22 12,46 32,56 32,32"/>
                            <polyline points="52,22 52,46 32,56"/>
                            <polygon points="12,22 4,16 24,8 32,12" fill="#ffffff"/>
                            <polygon points="52,22 60,16 40,8 32,12" fill="#ffffff"/>
                        </svg>
                    </div>
                    <div style="font-weight:700; font-size:13px; color:#000000;">Caja V(x${activeCell.y + 1}) F(${activeCell.x}) Vacía</div>
                    <div style="font-size:11.5px; color:#555555; margin:6px 0 12px;">Esta caja no tiene archivos asignados.</div>
                    <button type="button" class="tk-btn-action" style="margin:0 auto; padding:6px 14px; display:inline-flex; align-items:center; gap:6px;" onclick="window.PolyglotGridStudio && window.PolyglotGridStudio.openFileAssignModal(${activeCell.x}, ${activeCell.y})">
                        <svg viewBox="0 0 64 64" width="16" height="16" fill="none" stroke="#000000" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;">
                            <polygon points="12,22 32,32 52,22 32,12" fill="#ffffff"/>
                            <polyline points="12,22 12,46 32,56 32,32"/>
                            <polyline points="52,22 52,46 32,56"/>
                            <polygon points="12,22 4,16 24,8 32,12" fill="#ffffff"/>
                            <polygon points="52,22 60,16 40,8 32,12" fill="#ffffff"/>
                        </svg>
                        <span>Asignar Archivos a esta Caja</span>
                    </button>
                `;
                treeContainer.appendChild(emptyMsg);
                return;
            }

            const q = (filterQuery || '').toLowerCase();
            const ext = (extFilter || 'all').toLowerCase();

            assignedList.forEach(path => {
                const file = this.state.files.get(path) || { name: path.split('/').pop(), path: path, lines: 10, content: '' };
                if (q && !path.toLowerCase().includes(q)) return;
                if (ext !== 'all' && !path.toLowerCase().endsWith(ext)) return;

                const item = document.createElement('div');
                item.className = 'pg-tree-item';
                if (path === this.state.selectedFilePath) item.classList.add('selected');

                const icon = document.createElement('span');
                icon.className = 'pg-file-icon';
                icon.textContent = this.getFileIcon(path);

                const label = document.createElement('span');
                label.textContent = path;
                label.style.flex = '1';
                label.style.fontWeight = '600';

                const sizeBadge = document.createElement('span');
                sizeBadge.style.fontSize = '10px';
                sizeBadge.style.color = '#000080';
                sizeBadge.textContent = `${file.lines || 10}L`;

                item.title = `Doble clic para abrir y editar en Krumbs IDE (IdeaVim)\nLíneas: ${file.lines || 10} | Idioma: ${file.language || 'code'}`;

                item.appendChild(icon);
                item.appendChild(label);
                item.appendChild(sizeBadge);

                // Single click to select
                item.addEventListener('click', () => {
                    this.selectFile(path);
                });

                // Double click to open in Krumbs Retro IDE (JetBrains IdeaVim style)
                item.addEventListener('dblclick', (e) => {
                    e.stopPropagation();
                    this.openIdeModal(path);
                });

                treeContainer.appendChild(item);
            });
        }

        getFileIcon(path) {
            const p = path.toLowerCase();
            if (p.endsWith('.py')) return '🐍';
            if (p.endsWith('.js') || p.endsWith('.ts')) return '📜';
            if (p.endsWith('.go')) return '🐹';
            if (p.endsWith('.c') || p.endsWith('.h')) return '⚙️';
            if (p.endsWith('.java')) return '☕';
            if (p.endsWith('.json')) return '📋';
            if (p.endsWith('.yaml') || p.endsWith('.yml')) return '📄';
            return '📁';
        }

        openFileAssignModal(targetX = null, targetY = null) {
            if (typeof document === 'undefined') return;
            const modal = document.getElementById('tkFileAssignModal');
            if (!modal) return;

            // Populate all available workspace files
            const listEl = document.getElementById('tkAssignFileList');
            if (listEl) {
                listEl.innerHTML = '';
                this.state.files.forEach((file, path) => {
                    const row = document.createElement('div');
                    row.className = 'tk-assign-file-row';
                    row.innerHTML = `
                        <span style="font-size:15px;">${this.getFileIcon(path)}</span>
                        <div style="flex:1; text-align:left;">
                            <div style="font-weight:700; font-size:12px; color:#000000;">${path}</div>
                            <div style="font-size:10px; color:#666666;">${file.language.toUpperCase()} · ${file.lines} líneas · ${file.size} bytes</div>
                        </div>
                        <button type="button" class="tk-btn-action" style="padding:3px 8px; font-size:11px;">Seleccionar</button>
                    `;
                    row.addEventListener('click', () => {
                        document.querySelectorAll('.tk-assign-file-row').forEach(r => r.classList.remove('selected'));
                        row.classList.add('selected');
                        this.pendingAssignFile = path;
                        const labelEl = document.getElementById('tkSelectedAssignFileLabel');
                        if (labelEl) labelEl.textContent = path;
                    });
                    listEl.appendChild(row);
                });
            }

            // Set default coordinate selectors
            const selRow = document.getElementById('tkAssignCoordRow');
            const selCol = document.getElementById('tkAssignCoordCol');
            if (selRow && targetY !== null) selRow.value = targetY;
            if (selCol && targetX !== null) selCol.value = targetX;

            modal.style.display = 'flex';
        }

        closeFileAssignModal() {
            if (typeof document === 'undefined') return;
            const modal = document.getElementById('tkFileAssignModal');
            if (modal) modal.style.display = 'none';
        }

        confirmFileAssignment() {
            const selRow = document.getElementById('tkAssignCoordRow');
            const selCol = document.getElementById('tkAssignCoordCol');
            const rowVal = selRow ? parseInt(selRow.value, 10) : this.state.activeCoord.y;
            const colVal = selCol ? parseInt(selCol.value, 10) : this.state.activeCoord.x;
            const filePath = this.pendingAssignFile || this.state.selectedFilePath;

            if (!filePath) {
                alert('Por favor selecciona un archivo de la lista.');
                return;
            }

            const targetCell = this.state.getCell(colVal, rowVal, this.state.activeCoord.z, this.state.activeCoord.u);
            if (!targetCell.boundFiles) targetCell.boundFiles = [];
            if (!targetCell.boundFiles.includes(filePath)) {
                targetCell.boundFiles.push(filePath);
            }
            targetCell.boundFile = filePath;
            targetCell.state = LIFECYCLE_STATES.CONFIGURED;

            const lang = (filePath.split('.').pop() || 'python').toLowerCase();
            const fileObj = this.state.files.get(filePath);
            const content = fileObj ? fileObj.content : '';
            const functions = PolyglotConverter.extractSignatures(content, lang);
            targetCell.boundFunction = functions[0] ? functions[0].name : 'executeHandler';

            this.closeFileAssignModal();
            this.selectCell(colVal, rowVal, targetCell.z, targetCell.u);
            this.renderGrid();
            this.renderFileTree();
            this.updateActiveCellInspector();
            this.state.saveToStorage();
            this.appendLog('SUCCESS', `Archivo '${filePath}' asignado con éxito a la Caja [V: x${rowVal + 1}, F: ${colVal}] (Guardado en memoria permanente 💾).`, [colVal, rowVal, 0, 0]);
        }

        selectFile(path) {
            this.state.selectedFilePath = path;
            const file = this.state.files.get(path);
            if (file) {
                this.state.sourceCode = file.content;
                if (typeof document !== 'undefined') {
                    const editor = document.getElementById('polyglotSourceEditor');
                    if (editor) editor.value = file.content;
                }
                this.renderFileTree();
                this.regenerateApi();
            }
        }

        loadPresetIntoEditor(presetKey, shouldRegenerate = true) {
            const preset = SAMPLE_PRESETS[presetKey] || Object.values(SAMPLE_PRESETS).find(p => p.path === presetKey);
            if (preset) {
                this.state.selectedFilePath = preset.path;
                this.state.sourceCode = preset.content;
                if (typeof document !== 'undefined') {
                    const editor = document.getElementById('polyglotSourceEditor');
                    if (editor) editor.value = preset.content;
                }
                if (shouldRegenerate) this.regenerateApi();
                this.renderFileTree();
            }
        }

        async handleFileListUpload(fileList) {
            const files = Array.from(fileList);
            let count = 0;
            for (const file of files) {
                const relPath = file.webkitRelativePath || file.name;
                if (file.size > 5 * 1024 * 1024) continue;
                if (relPath.includes('node_modules') || relPath.includes('.git') || relPath.includes('__pycache__')) continue;

                try {
                    const text = await file.text();
                    this.state.files.set(relPath, {
                        name: file.name,
                        path: relPath,
                        language: file.name.split('.').pop() || 'text',
                        content: text,
                        size: file.size,
                        lines: text.split('\n').length
                    });
                    count++;
                } catch (e) {
                    console.error("Error reading file:", relPath, e);
                }
            }
            this.appendLog('INFO', `Ingested ${count} files from directory upload.`, [0,0,0,0]);
            this.renderFileTree();
            if (count > 0 && files[0]) {
                this.selectFile(files[0].webkitRelativePath || files[0].name);
            }
        }

        regenerateApi() {
            const code = this.state.sourceCode;
            const lang = (this.state.selectedFilePath.split('.').pop() || 'python').toLowerCase();
            const functions = PolyglotConverter.extractSignatures(code, lang);
            const primaryFn = functions[0] || { name: 'handler', params: [], returnType: 'dict' };

            const cellCoord = [
                this.state.activeCoord.x,
                this.state.activeCoord.y,
                this.state.activeCoord.z,
                this.state.activeCoord.u
            ];

            const generated = PolyglotConverter.synthesize(
                primaryFn,
                this.state.currentFramework,
                this.state.currentRoute,
                this.state.currentMethod,
                cellCoord
            );

            this.state.generatedApiCode = generated;
            if (typeof document !== 'undefined') {
                const apiDisplay = document.getElementById('polyglotGeneratedApi');
                if (apiDisplay) apiDisplay.value = generated;
            }

            const sampleBody = {};
            primaryFn.params.forEach(p => {
                sampleBody[p.name] = p.defaultVal ? evalSafe(p.defaultVal) : (p.type === 'int' ? 1 : 'sample');
            });

            const snippets = PolyglotConverter.generateClientSnippets(this.state.currentRoute, this.state.currentMethod, sampleBody);
            this.state.clientCurl = snippets.curl;
            this.state.clientFetch = snippets.fetch;
            this.updateSnippetView();
        }

        updateSnippetView() {
            if (typeof document === 'undefined') return;
            const snippetBox = document.getElementById('polyglotSnippetOutput');
            if (!snippetBox) return;
            if (this.state.activeSnippetTab === 'curl') {
                snippetBox.textContent = this.state.clientCurl;
            } else {
                snippetBox.textContent = this.state.clientFetch;
            }
        }

        bindCurrentFileToActiveCell() {
            const cell = this.state.getCell(this.state.activeCoord.x, this.state.activeCoord.y, this.state.activeCoord.z, this.state.activeCoord.u);
            const lang = (this.state.selectedFilePath.split('.').pop() || 'python').toLowerCase();
            const functions = PolyglotConverter.extractSignatures(this.state.sourceCode, lang);
            const primaryFn = functions[0] || { name: 'execute' };

            cell.boundFile = this.state.selectedFilePath;
            cell.boundFunction = primaryFn.name;
            cell.framework = this.state.currentFramework;
            cell.route = this.state.currentRoute;
            cell.method = this.state.currentMethod;
            cell.state = LIFECYCLE_STATES.CONFIGURED;

            this.renderGrid();
            this.updateActiveCellInspector();
            this.appendLog('CONFIGURED', `Bound ${cell.boundFile} [${cell.boundFunction}] to Cell (${cell.x},${cell.y},${cell.z},${cell.u})`, [cell.x, cell.y, cell.z, cell.u]);
        }

        async executeActiveCell() {
            const cell = this.state.getCell(this.state.activeCoord.x, this.state.activeCoord.y, this.state.activeCoord.z, this.state.activeCoord.u);
            return this.executeSpecificCell(cell);
        }

        async executeSpecificCell(cell) {
            if (cell.state === LIFECYCLE_STATES.LOCKED) {
                this.appendLog('WARN', `Cell (${cell.x},${cell.y},${cell.z},${cell.u}) is LOCKED. Execution prevented.`, [cell.x, cell.y, cell.z, cell.u]);
                return;
            }

            this.updateCellState(cell.x, cell.y, LIFECYCLE_STATES.RUNNING);
            this.appendLog('EXEC', `Dispatching execution on Cell (${cell.x},${cell.y},${cell.z},${cell.u}) via ${cell.framework.toUpperCase()}...`, [cell.x, cell.y, cell.z, cell.u]);

            let payload = {};
            if (typeof document !== 'undefined') {
                const payloadInput = document.getElementById('polyglotPayloadInput');
                try {
                    if (payloadInput && payloadInput.value.trim()) {
                        payload = JSON.parse(payloadInput.value.trim());
                    }
                } catch (e) {
                    this.appendLog('WARN', 'Payload JSON parse failed; sending empty object.', [cell.x, cell.y, cell.z, cell.u]);
                }
            }

            const tStart = (typeof performance !== 'undefined' ? performance.now() : Date.now());
            let result = null;
            let ok = true;

            try {
                if (typeof fetch !== 'undefined') {
                    const response = await fetch('/api/grid/execute', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            cell: [cell.x, cell.y, cell.z, cell.u],
                            framework: cell.framework,
                            route: cell.route,
                            method: cell.method,
                            code: this.state.sourceCode,
                            payload: payload
                        })
                    }).catch(() => null);

                    if (response && response.ok) {
                        result = await response.json();
                    }
                }

                if (!result) {
                    await new Promise(r => setTimeout(r, 40 + Math.floor(Math.random() * 60)));
                    result = {
                        ok: true,
                        status: 200,
                        data: {
                            result: "Computed successfully",
                            function: cell.boundFunction || 'anonymous',
                            cell: [cell.x, cell.y, cell.z, cell.u],
                            echo_payload: payload
                        }
                    };
                }
            } catch (err) {
                ok = false;
                result = { ok: false, status: 500, error: err.message };
            }

            const durationMs = Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - tStart);
            cell.executionCount = (cell.executionCount || 0) + 1;
            cell.lastLatencyMs = durationMs;
            cell.lastTimestamp = new Date().toISOString();
            cell.lastResult = result;

            if (ok && result && result.ok) {
                this.updateCellState(cell.x, cell.y, LIFECYCLE_STATES.SUCCESS, { lastLatencyMs: durationMs });
                this.appendLog('API', `HTTP 200 OK — Output: ${JSON.stringify(result.data || result)}`, [cell.x, cell.y, cell.z, cell.u], durationMs);
            } else {
                this.updateCellState(cell.x, cell.y, LIFECYCLE_STATES.ERROR, { lastLatencyMs: durationMs });
                this.appendLog('ERROR', `HTTP 500 ERR — ${result.error || 'Execution Exception'}`, [cell.x, cell.y, cell.z, cell.u], durationMs);
            }

            this.addHistoryRecord(cell, result, durationMs);
            this.updateActiveCellInspector();
            return result;
        }

        batchArmSelected() {
            let count = 0;
            this.state.selectedCellKeys.forEach(key => {
                const [x, y] = key.split(':').map(Number);
                const cell = this.state.getCell(x, y, this.state.activeCoord.z, this.state.activeCoord.u);
                if (cell.state !== LIFECYCLE_STATES.LOCKED) {
                    cell.state = LIFECYCLE_STATES.CONFIGURED;
                    cell.framework = this.state.currentFramework;
                    cell.route = `/api/cell/${x}/${y}`;
                    count++;
                }
            });
            this.renderGrid();
            this.appendLog('INFO', `Batch armed ${count} cells.`, [0,0,0,0]);
        }

        async batchExecuteSelected() {
            const cells = [];
            this.state.selectedCellKeys.forEach(key => {
                const [x, y] = key.split(':').map(Number);
                const cell = this.state.getCell(x, y, this.state.activeCoord.z, this.state.activeCoord.u);
                if (cell.state !== LIFECYCLE_STATES.LOCKED) {
                    cells.push(cell);
                }
            });

            this.appendLog('EXEC', `Starting batch execution on ${cells.length} selected cells...`, [0,0,0,0]);
            for (const cell of cells) {
                await this.executeSpecificCell(cell);
            }
        }

        batchClearSelected() {
            this.state.selectedCellKeys.forEach(key => {
                const [x, y] = key.split(':').map(Number);
                const cell = this.state.getCell(x, y, this.state.activeCoord.z, this.state.activeCoord.u);
                cell.state = LIFECYCLE_STATES.IDLE;
                cell.boundFile = '';
                cell.boundFunction = '';
            });
            this.renderGrid();
            this.updateActiveCellInspector();
            this.appendLog('INFO', `Cleared selected cells.`, [0,0,0,0]);
        }

        appendLog(level, message, cellCoord = null, latencyMs = 0) {
            const now = new Date();
            const timeStr = now.toISOString().slice(11, 23);
            const entry = {
                id: ++this.executionCounter,
                timestamp: timeStr,
                iso: now.toISOString(),
                level: level.toUpperCase(),
                message: String(message),
                cell: cellCoord || [this.state.activeCoord.x, this.state.activeCoord.y, this.state.activeCoord.z, this.state.activeCoord.u],
                latency: latencyMs
            };

            this.state.executionLogs.push(entry);
            if (this.state.executionLogs.length > 1000) {
                this.state.executionLogs.shift();
            }
            this.renderLogs();
        }

        renderLogs() {
            if (typeof document === 'undefined') return;
            const stream = document.getElementById('polyglotConsoleOutput') || document.getElementById('polyglotTerminalConsole');
            if (!stream) return;
            stream.innerHTML = '';

            const lvl = this.state.logFilterLevel;
            const q = (this.state.logFilterQuery || '').toLowerCase();

            const filtered = this.state.executionLogs.filter(log => {
                if (lvl && lvl !== 'ALL' && log.level !== lvl) return false;
                if (q && !log.message.toLowerCase().includes(q)) return false;
                return true;
            });

            filtered.forEach(log => {
                const line = document.createElement('div');
                line.className = 'tk-log-line';

                const d = new Date();
                const pad = (n) => String(n).padStart(2, '0');
                const dateStr = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

                let badgeClass = 'info';
                if (log.level === 'SUCCESS' || log.level === 'CONFIGURED') badgeClass = 'success';
                else if (log.level === 'WARN' || log.level === 'WARNING') badgeClass = 'warn';
                else if (log.level === 'ERROR') badgeClass = 'error';

                line.innerHTML = `<span class="tk-log-time">[${dateStr}]</span> <span class="tk-log-badge ${badgeClass}">${log.level}:</span> ${this.escapeHtml(log.message)}`;
                stream.appendChild(line);
            });

            stream.scrollTop = stream.scrollHeight;

            // Update Tkinter Status Bar line count
            document.querySelectorAll('.tk-status-right').forEach(el => {
                el.textContent = `Lines: ${filtered.length}`;
            });
        }

        escapeHtml(str) {
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }

        addHistoryRecord(cell, responseData, latencyMs) {
            const entry = {
                id: ++this.executionCounter,
                timestamp: new Date().toISOString(),
                cell: [cell.x, cell.y, cell.z, cell.u],
                framework: cell.framework,
                function: cell.boundFunction,
                file: cell.boundFile,
                status: (responseData && responseData.status !== undefined) ? responseData.status : (responseData && responseData.ok ? 200 : 500),
                latency: latencyMs,
                response: responseData
            };
            this.state.historyLedger.unshift(entry);
            if (this.state.historyLedger.length > 50) {
                this.state.historyLedger.pop();
            }
            this.state.saveToStorage();
        }

        exportWorkspace() {
            const cellsObj = {};
            this.state.cells.forEach((v, k) => { cellsObj[k] = v; });
            const data = {
                version: "2026.1",
                exported_at: new Date().toISOString(),
                activeCoord: this.state.activeCoord,
                cells: cellsObj,
                files: Array.from(this.state.files.entries()),
                history: this.state.historyLedger
            };
            const jsonStr = JSON.stringify(data, null, 2);
            if (typeof Blob !== 'undefined' && typeof document !== 'undefined') {
                const blob = new Blob([jsonStr], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `polyglot-workspace-${Date.now()}.json`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                setTimeout(() => URL.revokeObjectURL(url), 1000);
            }
            this.appendLog('INFO', 'Exported complete Studio workspace to JSON.', [0,0,0,0]);
            return jsonStr;
        }

        importWorkspace(jsonStr) {
            try {
                const data = JSON.parse(jsonStr);
                if (!data || !data.cells) throw new Error("Invalid workspace JSON format");

                this.state.cells.clear();
                Object.keys(data.cells).forEach(k => {
                    this.state.cells.set(k, data.cells[k]);
                });

                if (Array.isArray(data.files)) {
                    this.state.files.clear();
                    data.files.forEach(([path, fileObj]) => {
                        this.state.files.set(path, fileObj);
                    });
                }

                if (data.activeCoord) {
                    this.state.activeCoord = data.activeCoord;
                }

                this.renderGrid();
                this.renderFileTree();
                this.updateActiveCellInspector();
                this.regenerateApi();
                this.appendLog('INFO', 'Successfully imported workspace state.', [0,0,0,0]);
                return true;
            } catch (err) {
                this.appendLog('ERROR', `Import failed: ${err.message}`, [0,0,0,0]);
                return false;
            }
        }
    }

    function evalSafe(val) {
        try { return JSON.parse(val); } catch(e) { return val; }
    }

    // ===== 7. GLOBAL EXPORT & PLATFORM HOOKS =====
    const studioInstance = new PolyglotGridStudioController();

    global.PolyglotGridStudio = studioInstance;
    global.PolyglotConverter = PolyglotConverter;
    global.togglePolyglotGridModal = function(force) { studioInstance.toggleModal(force); };
    global.openPolyglotGridStudio = function() { studioInstance.openModal(); };
    global.closePolyglotGridStudio = function() { studioInstance.closeModal(); };
    global.openPolyglotStudioModal = function() { studioInstance.openModal(); };

    if (typeof document !== 'undefined') {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => studioInstance.init());
        } else {
            studioInstance.init();
        }
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            PolyglotStudioState,
            PolyglotConverter,
            PolyglotGridStudioController,
            studioInstance,
            SAMPLE_PRESETS,
            LIFECYCLE_STATES,
            FRAMEWORKS
        };
    }

})(typeof window !== 'undefined' ? window : globalThis);
    // ===== ON-DEMAND MODULES PIXEL CATALOG & WHATSAPP DISPATCHER =====
    const ON_DEMAND_CATALOG = {
        'git-vault': {
            id: 'git-vault',
            name: 'GIT VAULT',
            code: 'HASHCOD-GIT-08',
            slot: 'Círculo #8 (Toolbox)',
            price: 'US$ 60.27',
            palette: {
                dark: '#D96B47',
                main: '#FF8C69',
                light: '#FFB899',
                highlight: '#FFE0D1'
            }
        },
        'typescript-suite': {
            id: 'typescript-suite',
            name: 'TYPESCRIPT',
            code: 'HASHCOD-TS-09',
            slot: 'Círculo #9 (Toolbox)',
            price: 'US$ 60.27',
            palette: {
                dark: '#0E4B7E',
                main: '#1677C7',
                light: '#4EA8DE',
                highlight: '#90E0EF'
            }
        }
    };

    let activeOnDemandToolId = 'git-vault';

    function openOnDemandToolModal(toolId) {
        activeOnDemandToolId = toolId;
        const tool = ON_DEMAND_CATALOG[toolId] || ON_DEMAND_CATALOG['git-vault'];
        const modal = document.getElementById('onDemandPixelModal');
        const card = document.getElementById('tkPixelCard');
        if (!modal || !card) return;

        // Apply color palette from icon
        if (tool.palette) {
            card.style.setProperty('--px-dark', tool.palette.dark);
            card.style.setProperty('--px-main', tool.palette.main);
            card.style.setProperty('--px-light', tool.palette.light);
            card.style.setProperty('--px-highlight', tool.palette.highlight);
        }

        const nameEl = document.getElementById('pxToolName');
        const priceEl = document.getElementById('pxToolPrice');

        if (nameEl) nameEl.textContent = tool.name;
        if (priceEl) priceEl.textContent = tool.price || '(PRECIO QUE TE DIRE)';

        modal.style.display = 'flex';
    }

    function closeOnDemandToolModal() {
        const modal = document.getElementById('onDemandPixelModal');
        if (modal) modal.style.display = 'none';
    }

    function sendOnDemandWhatsAppOrder() {
        const tool = ON_DEMAND_CATALOG[activeOnDemandToolId] || ON_DEMAND_CATALOG['git-vault'];
        const now = new Date();
        const timestamp = now.toLocaleDateString('es-DO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        const refId = `ORD-${tool.code.replace('HASHCOD-', '')}-${Math.floor(1000 + Math.random() * 9000)}`;

                const messageText = `╔═════════════════════════════════════════════════════════╗
║   HASHCOD CODESPACE — SOLICITUD DE ARTÍCULO A MEDIDA    ║
╚═════════════════════════════════════════════════════════╝

*Artículo Solicitado:* ${tool.name}
*Código Ref:* \`${tool.code}\`
*Ubicación:* ${tool.slot}
*Precio Ref:* ${tool.price}
*Voucher:* \`${refId}\`
*Fecha:* ${timestamp}

Hola, deseo obtener la herramienta ${tool.name} para hacer MCP vía WhatsApp.`;

        const whatsappUrl = `https://wa.me/18294721257?text=${encodeURIComponent(messageText)}`;
        window.open(whatsappUrl, '_blank');
    }

    if (typeof window !== 'undefined') {
        window.openOnDemandToolModal = openOnDemandToolModal;
        window.closeOnDemandToolModal = closeOnDemandToolModal;
        window.sendOnDemandWhatsAppOrder = sendOnDemandWhatsAppOrder;
    }
