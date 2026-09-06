# TEST_READY: Post-Quantum Vector Crypto Signatures & Precision Scanner

**Status**: READY FOR IMPLEMENTATION (TDD Red Phase Established)  
**Test Suite**: `tests/e2e/test_vector_crypto_signatures_tdd.js`  
**Framework**: Pure Node.js Harness (`MockCanvas`, `MockCanvasContext2D`, Mock DOM, Mock MediaStream)  
**Target Platform**: Hashcod Codespace (Circle 10 — Vector Vision & JAB / QR Matrix Engine)  
**Security Standard**: NIST FIPS 204 (ML-DSA-87 / CRYSTALS-Dilithium Level 5) & ISO/IEC 23634 (JAB Code)  
**Date**: 2026-09-06T01:31:00Z  

---

## 1. Test Suite Overview & Execution

The automated E2E TDD test suite validates the end-to-end cryptographic steganography, matrix serialization, and precision optical scanner engine:

```bash
# Execute the Master TDD Test Suite:
node tests/e2e/test_vector_crypto_signatures_tdd.js

# Execute existing reference suite to verify non-regression:
node tests/e2e/test_jab_matrix_functional_tdd.js
```

### Exit Semantics
- **Exit Code 0**: 100% of tests passed (Green Phase complete).
- **Exit Code 1**: One or more assertions failed (Red Phase baseline during development).

---

## 2. Verification Suite Breakdown (10 Distinct Suites)

| Suite | Feature Area | Focus & Methodologies | Tiers Covered | Assertions |
|:---|:---|:---|:---:|:---:|
| **Suite 1** | **Vector Node & Vertex Extraction** | Parses SVG path commands (`M`, `L`, `C`, `Z`), polygons, polylines, architectural silhouettes; sequence index ordering; handles empty/malformed inputs and floats. | Tier 1, 2, 3 | ~57 |
| **Suite 2** | **Dilithium-5 (ML-DSA-87) PQC Signatures & Non-Linear Binding** | NIST FIPS 204 key generation, root silhouette signature $\Sigma_{\text{root}}$, non-linear 64-bit coordinate tag $S_i$; $\ge 10$ bit avalanche flips on $x+1$ or index shift; key revocation validation. | Tier 1, 2, 3 | ~42 |
| **Suite 3** | **Steganographic Watermarking Embedding** | Tier A DOM attributes (`data-d5-sig`, `data-v-idx`); Tier B sub-pixel fractional coordinates ($<0.001\text{ px}$ displacement); aesthetic invariance ($\Delta E < 0.5$, $\text{SSIM} > 0.999$); lossless recovery. | Tier 1, 2 | ~83 |
| **Suite 4** | **Polychrome JAB Code Matrix Serialization** | Binary header `0xD5`, VarInt counts, point tuples; 8-color 3-bit mapping; corner finders reservation (64 modules); dynamic grid expansion (grid 20 $\to$ 24 $\to$ 32+). | Tier 1, 2 | ~48 |
| **Suite 5** | **Standard QR Matrix Serialization** | Standard QR matrix generation on MockCanvas (`dataset.mode = 'qr'`); scalable SVG export; dynamic QR version selection (1..40); dual-encoding workflows. | Tier 1, 2, 4 | ~15 |
| **Suite 6** | **Parity Avalanche Word Protection** | Dual-checksum $\text{CRC32} \oplus \text{MurmurHash3\_32}$; mutating single coordinate, single tag bit, or swapping vertex order destroys parity; $\ge 8$ bit flips cascade. | Tier 1, 2, 3 | ~15 |
| **Suite 7** | **Advanced Optical Scanner Elements & Lifecycle** | DOM elements (`#vvCameraScannerModal`, `#vvCameraVideo`, `#vvCaptureCanvas`, `.scan-reticle`, `.scan-line`); `getUserMedia` environment 1280x720 constraints; complete track cleanup. | Tier 1, 2 | ~15 |
| **Suite 8** | **Real-Time Quadrant Auto-Calibration** | Q1–Q4 discrete Laplacian gradient sharpness $\text{Variance}(\nabla^2 I)$; exposure balance across quadrants; blur suppression; over/underexposure rejection; auto-capture trigger. | Tier 1, 2 | ~12 |
| **Suite 9** | **Dual Scan Mode (Live Camera & File Upload)** | Camera frame capture & dispatch; image file upload scanner (`scanFromImageFile`); dark border auto-cropping (`detectMatrixBoundingBox`); optical sensor noise tolerance; mode switching isolation. | Tier 1, 2, 3, 4 | ~14 |
| **Suite 10** | **Bidirectional 100% Match Verification vs Counterfeit Alerts** | Dual-stream mathematical reconciliation; `VALIDADO AL 100% ✓` (badge `#064E3B` / `#34D399`) on match; `ALERTA DE FALSIFICACIÓN ✕` (badge `#7F1D1D` / `#FCA5A5`) pinpointing altered node index; tag balance (`Diff: 0`) and JS syntax check. | Tier 1, 2, 4, 5 | ~32 |
| **TOTAL** | **10 Verification Suites** | **Comprehensive Full Platform Coverage** | **Tiers 1-5** | **> 330 Assertions** |

---

## 3. Real-World Application Scenarios (Tier 4) Checklist

- [x] **Scenario 1: Architectural Silhouette Ingestion, Signing & JAB Code Generation**
  - Path: `SAMPLE_ARCHITECTURAL_SVG` $\to$ Node extraction $\to$ Dilithium-5 signing $\to$ DOM watermarking $\to$ JAB Code matrix rendering $\to$ Lossless decode & 100% validation.
- [x] **Scenario 2: High-Density Contour Vector Watermark & QR Dual-Encoding**
  - Path: Contour vertices $\to$ Post-quantum signature $\to$ Scalable SVG watermarking $\to$ Standard QR matrix generation on canvas.
- [x] **Scenario 3: Live Webcam Optical Scan, Reticle Alignment & Auto-Calibration**
  - Path: Start camera with reticle $\to$ Analyze frame quadrants for Laplacian sharpness $\to$ Measure exposure $\to$ Safe track stop.
- [x] **Scenario 4: File Upload Optical Scan & Bidirectional 100% Verification**
  - Path: Ingest external/scanned matrix image $\to$ Extract serialized coordinates $\to$ Verify against drawing $\to$ Emit `VALIDADO AL 100% ✓`.
- [x] **Scenario 5: Adversarial Tampering Detection**
  - Path 5A: Mutate 1 coordinate in drawing ($x_0 + 1$) $\to$ Rejection with diagnostic pinpointing node index 0.
  - Path 5B: Swap sequence order of vertices ($V_4 \leftrightarrow V_5$) $\to$ Rejection with sequence violation alert.

---

## 4. Invariant Contracts for Implementing Agent

The implementing agent must satisfy the following public contracts in `components/vector-vision.js`:

### 4.1 Crypto Engine (`VectorVisionCryptoEngine` / `VectorVisionStudio`)
- `extractVectorNodes(svgOrPathStr)`: Returns `[{ x, y, index }, ...]`
- `generateVectorDilithiumKey(entropySeed)`: Returns `{ pk, sk, epoch }`
- `computeNonLinearCoordinateTag(x, y, index, seed)`: Returns 64-bit tag (BigInt or 16-hex char)
- `signVectorPath(points, options)`: Returns `{ rootSignature, digest, signedPoints: [{ x, y, index, tag }, ...] }`
- `verifyVectorSignature(points, rootSignature, options)`: Returns `{ valid: boolean, reason?: string }`
- `embedVectorWatermarkDOM(svgStr, signedPoints)`: Injects `data-d5-sig`, `data-v-idx`, `data-pqc-root`
- `extractVectorWatermarkDOM(svgStr)`: Returns `[{ index, x, y, tag, x, y }, ...]`
- `embedSubPixelWatermark(points, signedPoints)`: Modulates fractional mantissa ($<0.001\text{ px}$)

### 4.2 Matrix Engine (`VectorVisionMatrixEngine` / `VectorVisionStudio`)
- `serializeOrderedPoints(signedPoints, options)`: Binary `Uint8Array` starting with `[0xD5, 0x01]` and ending with CRC32 $\oplus$ MurmurHash3 parity word
- `deserializeOrderedPoints(payloadBytes)`: Returns `{ points, validParity, width, height, rootSignature }`
- `renderJabCodeWithCrypto(signedPoints, canvas)`: Renders 8-color matrix with 4 corner finders
- `decodeJabCodeWithCrypto(canvas)`: Decodes matrix and unpacks points losslessly
- `renderQrWithCrypto(signedPoints, canvas)`: Renders standard QR matrix (`dataset.mode = 'qr'`)
- `generateQrSvgWithCrypto(signedPoints)`: Returns scalable `<svg>` string
- `calculateAvalancheChecksum(buffer)`: Returns 32-bit unsigned parity word

### 4.3 Scanner Engine (`VectorVisionScannerEngine` / `VectorVisionStudio`)
- `startCamera(videoEl, containerEl)`: Initializes stream with `{ video: { facingMode: 'environment', width: 1280, height: 720 }, audio: false }`
- `stopCamera()`: Stops all stream tracks
- `analyzeFrameQuadrants(videoEl, canvas)`: Returns `{ q1Sharpness, q2Sharpness, q3Sharpness, q4Sharpness, overallSharpness, balanced, readyToCapture }`
- `scanFromImageFile(canvasOrFile)`: Returns `{ success: boolean, format: 'JAB_CODE'|'QR', points: [...] }`

### 4.4 Studio Reconciliation (`VectorVisionStudio`)
- `verifyBidirectionalIntegrity(drawingPoints, matrixData)`: Returns `{ match: boolean, score: 100, status: 'VALIDADO AL 100% ✓' | 'ALERTA DE FALSIFICACIÓN ✕', details: string }`

---

## 5. Non-Regression & Guardrails
- Reference suite `tests/e2e/test_jab_matrix_functional_tdd.js` must remain 100% passing (38/38).
- Static HTML tag balance across `index.php`, `index.html`, and `404.html` must remain strictly at `Diff: 0`.
- Zero AST / JavaScript syntax errors via `node -c components/vector-vision.js`.
