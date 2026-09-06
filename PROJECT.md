# Project: Post-Quantum Vector Crypto Signatures & Precision Scanner

## Architecture
The Vector Vision platform (`components/vector-vision.js`, `#vectorVisionModal`) integrates an end-to-end post-quantum cryptographic steganography and verification pipeline:
1. **Vector Node & Vertex Extractor**: Analyzes vector drawings, contours, and architectural silhouettes to extract sequential vertices $V_i = (x_i, y_i)$.
2. **Post-Quantum Cryptographic Signature Engine**: Binds NIST Level 5 Dilithium-5 (ML-DSA-87) root signatures and deterministic 64-bit non-linear pseudo-random tags $S_i = \text{Trunc}_{64}(\text{HMAC-SHA256}(\text{Seed}_{D5}, i \parallel x_i \parallel y_i \parallel f_{NL}(x_i, y_i, i)))$ to each coordinate.
3. **Steganographic Watermarking Engine**: Embeds coordinates and signatures directly into the vector drawing (SVG attributes, lossless sub-pixel mantissa displacement $<0.001\text{ px}$, and perimeter micro-markers) without defacing vector aesthetics.
4. **Sequential Matrix Serialization Engine**: Serializes node indices, coordinates, and signatures into polychrome JAB Code (ISO/IEC 23634) and standard QR (ISO/IEC 18004). Incorporates a dual-checksum avalanche parity word ($\text{CRC32} \oplus \text{MurmurHash3\_32}$) such that altering any coordinate or swapping adjacent sequence order invalidates matrix parity.
5. **Advanced Optical Scanner**: Adapted from `D:\improve-platform-accuracy.zip` (`CameraView.tsx`, `FaceScanApp.tsx`), featuring live camera streaming (`getUserMedia`), precision reticle (`.scan-reticle`), animated laser sweep line (`.scan-line`), real-time Q1–Q4 quadrant focus & exposure analysis, and auto-detection.
6. **Bidirectional Verification Engine**: Supports both webcam stream capture and file/photo upload. Reconstructs sequence from drawing vs code and asserts 100% mathematical match (`VALIDADO AL 100% ✓`) or emits counterfeit alerts.
7. **DOM & HTML Parity Guard**: Injected dynamically through `VectorVisionStudio` preserving exact tag balance (`Diff: 0`) in `index.php`, `index.html`, and `404.html`.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Vector Node & Vertex Extraction | Extract ordered coordinates $(x_i, y_i)$ from vector paths, contours, silhouettes | M1 | ORIGINAL_REQUEST §R1 |
| 2 | Dilithium-5 & Non-Linear PQC Signatures | Generate lattice-based coordinate signatures $S_i$ using Dilithium-5 parameters | M1 | ORIGINAL_REQUEST §R1 |
| 3 | Steganographic Visual & Math Embedding | Embed signatures into vector drawing preserving aesthetics ($\Delta E < 0.5$, $\text{SSIM} > 0.999$) | M1 | ORIGINAL_REQUEST §R1 |
| 4 | Polychrome JAB Code Serialization | Encode ordered coordinates, indices, and signatures into 8-color JAB matrix | M1 | ORIGINAL_REQUEST §R2 |
| 5 | Advanced QR Matrix Serialization | Encode ordered coordinates, indices, and signatures into standard QR matrix | M1 | ORIGINAL_REQUEST §R2 |
| 6 | Parity Avalanche Protection | Dual checksum ($\text{CRC32} \oplus \text{MurmurHash3\_32}$) invalidating matrix on 1-point mutation | M1 | ORIGINAL_REQUEST §R2 |
| 7 | Live Camera Stream & Lifecycle | `getUserMedia` integration with resolution constraints, mobile flip, and track cleanup | M1 | ORIGINAL_REQUEST §R3 |
| 8 | Precision Reticle & Sweep Line | Visual capture reticle (`.scan-reticle`), corner brackets, and sweep line (`.scan-line`) | M1 | ORIGINAL_REQUEST §R3 |
| 9 | Real-time Quadrant Auto-Calibration | Q1–Q4 discrete Laplacian gradient sharpness, exposure balance, auto-capture trigger | M1 | ORIGINAL_REQUEST §R3 |
| 10 | Dual Scan Mode (Live + File Upload) | Bidirectional scanner supporting direct webcam feed and image/photo upload | M1 | ORIGINAL_REQUEST §R4 |
| 11 | Bidirectional 100% Verification Engine | Extract vector points vs code, reconstruct sequence, calculate mathematical match | M1 | ORIGINAL_REQUEST §R4 |
| 12 | Verification Verdict & Counterfeit Alert | Output "VALIDADO AL 100% ✓" or alert pinpointing modified node index and delta | M1 | ORIGINAL_REQUEST §R4 |
| 13 | E2E TDD Test Suite Creation | Automated TDD suite in `tests/e2e/test_vector_crypto_signatures_tdd.js` | M_TEST | ORIGINAL_REQUEST §Guardrails |
| 14 | Syntax Validation (0 errors) | Zero syntax errors validated via `node -c components/vector-vision.js` | M2 | ORIGINAL_REQUEST §Guardrails |
| 15 | HTML Tag Balance (Diff: 0) | Strict preservation of tag balance in `index.php`, `index.html`, and `404.html` | M2 | ORIGINAL_REQUEST §Guardrails |
| 16 | Git Commit & Push to origin/main | Commit and push all deliverables to main branch | M2 | ORIGINAL_REQUEST §Guardrails |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M_TEST | E2E Testing Track | Write comprehensive TDD suite `tests/e2e/test_vector_crypto_signatures_tdd.js` (Tiers 1-4) and publish `TEST_READY.md` | none | DONE |
| M1 | PQC Crypto, Matrix & Precision Scanner Engine | Implement `VectorVisionCryptoEngine`, `VectorVisionMatrixEngine`, `VectorVisionScannerEngine`, and UI integration in `components/vector-vision.js` | M_TEST | DONE |
| M2 | Final Milestone: Full E2E Pass, Guardrails & Git Push | Pass 100% of TDD tests, Tier 5 adversarial hardening, verify HTML balance `Diff: 0`, node syntax check, git commit & push | M1 | IN_PROGRESS |

## Interface Contracts
### PQC Signature Engine
- `VectorVisionCryptoEngine.signVectorPath(points, options)`: Returns `{ rootSignature, points: [{ x, y, index, tag, signature }], digest }`.
- `VectorVisionCryptoEngine.verifyVectorSignature(points, rootSignature, options)`: Returns `{ valid: boolean, matchedPoints, mismatchedPoints }`.
- `VectorVisionCryptoEngine.embedSteganographicWatermark(svgElement, pointsWithSignatures)`: Attaches steganographic marks and returns modified SVG/DOM without aesthetic degradation.

### Matrix Serialization Engine
- `VectorVisionMatrixEngine.serializeOrderedPoints(pointsWithSignatures)`: Returns binary payload with magic `0xD5`, coordinate counts, VarInt encoded coordinates, tags, and avalanche parity word.
- `VectorVisionMatrixEngine.deserializeOrderedPoints(payloadBytes)`: Reconstructs `{ points, parityValid, rootSignature }`.
- `VectorVisionMatrixEngine.generateJABMatrix(payloadBytes, canvas)`: Renders 8-color polychrome matrix with 4 corner finders.
- `VectorVisionMatrixEngine.generateQRMatrix(payloadBytes, canvas)`: Renders standard QR matrix with embedded payload.

### Advanced Scanner Engine
- `VectorVisionScannerEngine.startCamera(videoElement, containerElement)`: Requests camera stream, attaches to video, mounts `.scan-reticle` and `.scan-line`.
- `VectorVisionScannerEngine.stopCamera()`: Stops all stream tracks, cancels RAF loop.
- `VectorVisionScannerEngine.analyzeFrameQuadrants(videoElement, offscreenCanvas)`: Returns `{ q1, q2, q3, q4, overallSharpness, balanced, readyToCapture }`.
- `VectorVisionScannerEngine.scanFromImageFile(fileOrCanvas)`: Analyzes uploaded image for JAB/QR or vector drawing.

### Bidirectional Verification UI
- `VectorVisionStudio.verifyBidirectionalIntegrity(drawingPoints, matrixData)`: Computes point-by-point cryptographic match, checks sequence order, returns `{ status: "VALIDADO AL 100% ✓" | "ALERTA DE FALSIFICACIÓN ✕", score: 100, details }`.

## Code Layout
- `components/vector-vision.js`: Main monolithic engine housing `VectorVisionCryptoEngine`, `VectorVisionMatrixEngine`, `VectorVisionScannerEngine`, `VectorVisionStudio`, and modal templates.
- `tests/e2e/test_vector_crypto_signatures_tdd.js`: Master TDD test suite validating point extraction, Dilithium-5 signatures, JAB/QR serialization, avalanche parity, and bidirectional 100% verification.
- `index.php`: Host PHP template containing launcher button and modal roots.
- `index.html`: Synchronized HTML entry point.
- `404.html`: Synchronized fallback page.
- `scripts/verify_tag_balance.js`: Static HTML tag balance validator (`Diff: 0`).
- `scripts/sync_static_html.js`: Static HTML synchronization tool.
