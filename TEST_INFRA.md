# E2E Test Infra: Post-Quantum Vector Crypto Signatures & Precision Scanner

## Test Philosophy
- Opaque-box, requirement-driven, verified from API and UI scanner perspective.
- Strict TDD methodology: tests verify point extraction, Dilithium-5 lattice signatures, non-linear coordinate binding, steganography, JAB & QR serialization, avalanche parity, camera viewer / reticle patterns, and bidirectional 100% verification.
- Methodology: Category-Partition + Boundary Value Analysis + Pairwise Combinatorial Testing + Real-World Workload Testing.

## Feature Inventory
| # | Feature | Source (requirement) | Tier 1 | Tier 2 | Tier 3 | Tier 4 |
|---|---------|---------------------|:------:|:------:|:------:|:------:|
| 1 | Vector Node & Vertex Extractor | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ | ✓ |
| 2 | Dilithium-5 Coordinate Signatures | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ | ✓ |
| 3 | Steganographic Visual Watermarking | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ | ✓ |
| 4 | Polychrome JAB Code Serialization | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ | ✓ |
| 5 | Advanced QR Matrix Serialization | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ | ✓ |
| 6 | Avalanche Parity Word Protection | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ | ✓ |
| 7 | Live Camera Stream & Reticle Elements | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ | ✓ |
| 8 | Real-Time Quadrant Auto-Calibration | ORIGINAL_REQUEST §R3 | 5 | 5 | ✓ | ✓ |
| 9 | Dual Scan Mode & Sequence Reconstruction | ORIGINAL_REQUEST §R4 | 5 | 5 | ✓ | ✓ |
| 10 | Bidirectional 100% Match Verification | ORIGINAL_REQUEST §R4 | 5 | 5 | ✓ | ✓ |

## Test Architecture
- Master TDD Suite: `tests/e2e/test_vector_crypto_signatures_tdd.js`
- Test Runner: Node.js standard runner invoked via `node tests/e2e/test_vector_crypto_signatures_tdd.js`.
- Pass/Fail Semantics: Process exits with code 0 on 100% pass, non-zero with assertion failure trace on any failure.
- In-memory mock DOM and Canvas harnesses matching `MockCanvas` from `tests/e2e/test_jab_matrix_functional_tdd.js`.

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Features Exercised | Complexity |
|---|----------|--------------------|------------|
| 1 | Architectural Silhouette Ingestion, Signing & JAB Code Generation | F1, F2, F3, F4, F6 | High |
| 2 | High-Density Contour Vector Watermark & QR Dual-Encoding | F1, F2, F3, F5, F6 | High |
| 3 | Live Webcam Optical Scan, Reticle Alignment & Auto-Calibration | F7, F8, F9, F10 | High |
| 4 | File Upload Optical Scan & Bidirectional 100% Verification ("VALIDADO AL 100% ✓") | F1, F2, F4, F9, F10 | High |
| 5 | Adversarial Tampering (1-Point Coordinate Alteration & Sequence Swap Detection) | F2, F6, F9, F10 | High |

## Coverage Thresholds
- Tier 1: ≥5 tests per feature (50 total)
- Tier 2: ≥5 boundary/edge tests per feature (50 total)
- Tier 3: Pairwise cross-feature interactions (15 tests)
- Tier 4: Real-world end-to-end integration workflows (5 tests)
- Tier 5: Adversarial stress & integrity validation (10 tests)
- **Total Suite**: ≥100 automated test assertions

