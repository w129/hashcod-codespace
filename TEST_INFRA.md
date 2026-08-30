# E2E Test Infra: Polyglot Grid API Launcher & Code Studio

## Test Philosophy
- Opaque-box, requirement-driven testing derived strictly from `ORIGINAL_REQUEST.md`.
- Zero dependency on internal implementation shortcuts; exercises user-facing APIs, DOM elements, and conversion outputs directly.
- Methodology: Category-Partition + Boundary Value Analysis + Pairwise Combinatorial Testing + Real-World Workload Testing.

## Feature Inventory & Test Coverage Goals
| # | Feature | Requirement Source | Tier 1 (Coverage) | Tier 2 (Boundaries) | Tier 3 (Pairwise) | Tier 4 (Real-World) |
|---|---------|-------------------|:-----------------:|:-------------------:|:-----------------:|:-------------------:|
| 1 | Circle 7 Dock Icon & Trigger | ORIGINAL_REQUEST § Circle 7 | 5 test cases | 5 test cases | ✓ | ✓ |
| 2 | Toolbox Slot 7 Matrix Binding | index.php § 10825 | 5 test cases | 5 test cases | ✓ | ✓ |
| 3 | Modal Container & Escape Hotkey | ORIGINAL_REQUEST § Circle 7 | 5 test cases | 5 test cases | ✓ | ✓ |
| 4 | Responsive Viewport Layout | Survey Explorer 1 | 5 test cases | 5 test cases | ✓ | ✓ |
| 5 | 8x7 Interactive Matrix Grid | ORIGINAL_REQUEST § 8x7 grid | 5 test cases | 5 test cases | ✓ | ✓ |
| 6 | 4D Coordinate System (x,y,z,u) | ORIGINAL_REQUEST § (x,y,z,u) | 5 test cases | 5 test cases | ✓ | ✓ |
| 7 | Cell Lifecycle States (6 states) | Survey Spec Miner 1 | 5 test cases | 5 test cases | ✓ | ✓ |
| 8 | Cell Metadata Inspector | Survey Spec Miner 1 | 5 test cases | 5 test cases | ✓ | ✓ |
| 9 | Multi-Cell Selection & Batch Ops | Survey Spec Miner 1 | 5 test cases | 5 test cases | ✓ | ✓ |
| 10 | Coordinate Clamp & Bounds Math | Survey Explorer 2 | 5 test cases | 5 test cases | ✓ | ✓ |
| 11 | Directory Upload Picker & DragDrop | ORIGINAL_REQUEST § Directory upload | 5 test cases | 5 test cases | ✓ | ✓ |
| 12 | Polyglot Tree Viewer (8 file types)| ORIGINAL_REQUEST § File explorer | 5 test cases | 5 test cases | ✓ | ✓ |
| 13 | File Search & Filter | Survey Spec Miner 1 | 5 test cases | 5 test cases | ✓ | ✓ |
| 14 | Code Previewer & Editor | Survey Spec Miner 1 | 5 test cases | 5 test cases | ✓ | ✓ |
| 15 | File-to-Cell Binding Engine | Survey Spec Miner 1 | 5 test cases | 5 test cases | ✓ | ✓ |
| 16 | Sample Preset Library | Survey Explorer 2 | 5 test cases | 5 test cases | ✓ | ✓ |
| 17 | AST/Regex Signature Extractor | ORIGINAL_REQUEST § Code-to-API | 5 test cases | 5 test cases | ✓ | ✓ |
| 18 | FastAPI (Python) Converter | ORIGINAL_REQUEST § FastAPI | 5 test cases | 5 test cases | ✓ | ✓ |
| 19 | Sanic (Python) Converter | ORIGINAL_REQUEST § Sanic | 5 test cases | 5 test cases | ✓ | ✓ |
| 20 | Express (Node.js) Converter | ORIGINAL_REQUEST § Express | 5 test cases | 5 test cases | ✓ | ✓ |
| 21 | Go (`net/http` & Gin) Converter | ORIGINAL_REQUEST § Go | 5 test cases | 5 test cases | ✓ | ✓ |
| 22 | C REST (`libmicrohttpd`) Converter | ORIGINAL_REQUEST § C | 5 test cases | 5 test cases | ✓ | ✓ |
| 23 | Java (Spring Boot) Converter | ORIGINAL_REQUEST § Java | 5 test cases | 5 test cases | ✓ | ✓ |
| 24 | Route Parameter Mapping | Survey Spec Miner 1 | 5 test cases | 5 test cases | ✓ | ✓ |
| 25 | Standardized JSON Envelope Wrap | Survey Spec Miner 1 | 5 test cases | 5 test cases | ✓ | ✓ |
| 26 | Curl & Fetch Snippet Generator | Survey Explorer 2 | 5 test cases | 5 test cases | ✓ | ✓ |
| 27 | Real-Time Stdout/Stderr Console | ORIGINAL_REQUEST § Real-time execution logs | 5 test cases | 5 test cases | ✓ | ✓ |
| 28 | Millisecond Timestamp & Metrics | Survey Spec Miner 1 | 5 test cases | 5 test cases | ✓ | ✓ |
| 29 | Log Filter & Full-Text Search | Survey Spec Miner 1 | 5 test cases | 5 test cases | ✓ | ✓ |
| 30 | Execution History Ledger & Replay | Survey Spec Miner 1 | 5 test cases | 5 test cases | ✓ | ✓ |
| 31 | Polyglot Runtime Sandbox | Survey Explorer 2 | 5 test cases | 5 test cases | ✓ | ✓ |
| 32 | Backend REST Endpoints | Survey Explorer 1 | 5 test cases | 5 test cases | ✓ | ✓ |
| 33 | Workspace JSON Import/Export | Survey Spec Miner 1 | 5 test cases | 5 test cases | ✓ | ✓ |

## Test Architecture
- **Runner**: Standalone Node.js test suites executable via `node tests/e2e/test_polyglot_e2e_suite.js`.
- **Pass/Fail Semantics**: Built-in strict assertions (`assert.strictEqual`, `assert.deepStrictEqual`, `assert.ok`, `assert.match`). Clean exit code `0` on 100% pass, non-zero on failure.
- **Directory Layout**:
  - `tests/e2e/test_polyglot_e2e_suite.js` (Tiers 1-4: Feature Coverage, Boundaries, Cross-Feature Pairwise, Real-World Workload Scenarios)
  - `tests/e2e/test_polyglot_adversarial_tier5.js` (Tier 5: Adversarial edge cases, stress testing, fuzzing, concurrency simulation)

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Features Exercised | Complexity |
|---|----------|--------------------|------------|
| 1 | Full Directory Ingestion -> 8x7 Grid Batch Binding -> Polyglot API Conversion -> Real-Time Execution | F5, F6, F11, F12, F15, F18-F23, F27, F28 | High |
| 2 | Python AI Service to Multi-Framework Microservice Transpilation (FastAPI + Sanic + Express + Go) | F17, F18, F19, F20, F21, F24, F25, F26 | High |
| 3 | High-Volume Batch Matrix Cell Execution with Rapid Log Streaming and History Persistence | F5, F7, F9, F27, F28, F29, F30, F31 | High |
| 4 | Low-Level Systems Code (C & Go) API Synthesis with Buffer Overflow Protection & Safe Envelopes | F16, F21, F22, F24, F25, F27, F31 | High |
| 5 | Complete Studio Workspace Export, Reset, Re-import, and Re-execution Verification | F5, F8, F15, F27, F30, F33 | Medium |

## Coverage Thresholds
- **Tier 1 (Feature Coverage)**: >= 165 test cases (>=5 per feature across 33 features)
- **Tier 2 (Boundary & Corner Cases)**: >= 165 test cases (>=5 per feature across 33 features)
- **Tier 3 (Cross-Feature Pairwise)**: >= 35 combinatorial test cases
- **Tier 4 (Real-World Application Scenarios)**: >= 5 comprehensive end-to-end workload pipelines
- **Total Minimum Test Cases**: >= 370 rigorous test assertions
