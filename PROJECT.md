# Project: Polyglot Grid API Launcher & Code Studio

## Architecture
- **Host Architecture**: Native PHP Server-Side Rendered (SSR) monolithic application with modular frontend components (HTML5, Vanilla CSS3, Vanilla ES6+ JS) and unified JSON REST API (`api.php`, `router.php`).
- **Toolbox Integration**: Circle 7 Dock button (`#hashcodDockGridBtn`) attached to `.hashcod-tools-dock` (`data-dock-slot="7"`) and Slot 7 (`slot-2-3`) in `#toolboxPanel` in `index.php`.
- **Polyglot Studio Core**:
  - `components/polyglot-grid.css`: Styles for 8x7 matrix grid (56 cells), dark glassmorphic modal, file tree, code studio, parameter mapping, terminal log stream, and status indicators.
  - `components/polyglot-grid.js`: Comprehensive client-side controller managing 4D coordinates `(x, y, z, u)`, cell lifecycle states, directory upload/tree parsing, polyglot AST/code-to-API conversion (FastAPI, Sanic, Express, Go, C, Java), real-time execution logger, and state persistence.
  - `api.php`: Backend API endpoints (`/api/grid/execute`, `/api/grid/convert`, `/api/grid/upload-dir`, `/api/grid/logs`, `/api/grid/state`, `/api/command`).

## Feature Inventory
| # | Feature | Description | Milestone | Source | Status |
|---|---------|-------------|-----------|--------|--------|
| 1 | Circle 7 Dock Button | Circle 7 button in `.hashcod-tools-dock` (`data-dock-slot="7"`) with neon glow and tooltip | M1 | ORIGINAL_REQUEST § Circle 7 | DONE |
| 2 | Toolbox Slot 7 Matrix Binding | Slot 2-3 in `#toolboxPanel` bound to Polyglot Studio launcher | M1 | index.php § 10825 | DONE |
| 3 | Modal Container & Shell | `#polyglotGridOverlay` dark glassmorphic modal shell with open/close/Escape hotkey | M1 | ORIGINAL_REQUEST § Circle 7 | DONE |
| 4 | Responsive Viewport Adaptation | 4-pane desktop layout and mobile tabbed mode (Grid, Explorer, Studio, Logs) | M1 | Survey Explorer 1 | DONE |
| 5 | 8x7 Interactive Coordinate Grid | 56-cell $(8 \times 7)$ matrix visualizer with coordinate headers ($X: 0..7$, $Y: 0..6$) | M2 | ORIGINAL_REQUEST § 8x7 grid | DONE |
| 6 | 4D Coordinate System $(x,y,z,u)$ | Parameterization of column $x$, row $y$, runtime layer $z$, and worker vector $u$ | M2 | ORIGINAL_REQUEST § (x,y,z,u) | DONE |
| 7 | Cell Lifecycle State Engine | 6 states: `IDLE`, `CONFIGURED`, `RUNNING`, `SUCCESS`, `ERROR`, `LOCKED` with color badges | M2 | Survey Spec Miner 1 | DONE |
| 8 | Cell Metadata Inspector | Inspector panel showing coordinates, bound file, target framework, method, and history | M2 | Survey Spec Miner 1 | DONE |
| 9 | Multi-Cell Selection & Batch Ops | Batch selection (Shift/Drag) for bulk arming, dispatching, or clearing | M2 | Survey Spec Miner 1 | DONE |
| 10 | Coordinate Mapping Formulas | Bijective mapping $(x,y,z,u) \leftrightarrow \text{Cell ID}$ with bounds clamping | M2 | Survey Explorer 2 | DONE |
| 11 | Directory Picker & Folder Drag-Drop | HTML5 `webkitdirectory` and drag-and-drop folder ingestion with recursion | M3 | ORIGINAL_REQUEST § Directory upload | DONE |
| 12 | Polyglot Tree Hierarchy Viewer | Collapsible file tree with file-type icons (.py, .js, .ts, .go, .c, .h, .java, .json, .yaml) | M3 | ORIGINAL_REQUEST § File explorer | DONE |
| 13 | File Search & Extension Filter | Real-time file filter by name, extension, or path substring | M3 | Survey Spec Miner 1 | DONE |
| 14 | In-Browser Code Previewer & Editor | Syntax-styled code editor with line numbers, file statistics, and quick edit | M3 | Survey Spec Miner 1 | DONE |
| 15 | File-to-Cell Binding Engine | Direct binding of uploaded files / functions to active grid cells | M3 | Survey Spec Miner 1 | DONE |
| 16 | Sample Preset Library | Built-in polyglot sample scripts (Python, JS, Go, C, Java) for zero-upload instant testing | M3 | Survey Explorer 2 | DONE |
| 17 | AST/Regex Signature Extractor | Multi-language function/class signature extractor (params, types, docstrings) | M4 | ORIGINAL_REQUEST § Code-to-API | DONE |
| 18 | FastAPI (Python) Route Synthesizer | Complete Python FastAPI module with Pydantic BaseModel schemas and async handlers | M4 | ORIGINAL_REQUEST § FastAPI | DONE |
| 19 | Sanic (Python) Route Synthesizer | Complete Python Sanic server module with async handlers and JSON responses | M4 | ORIGINAL_REQUEST § Sanic | DONE |
| 20 | Express (Node.js) Synthesizer | Complete Node.js Express router with typed routes, middleware, and CORS | M4 | ORIGINAL_REQUEST § Express | DONE |
| 21 | Go (`net/http` & Gin) Synthesizer | Complete Go server with struct unmarshalling, Gin/net/http handlers, and error types | M4 | ORIGINAL_REQUEST § Go | DONE |
| 22 | C REST (`libmicrohttpd`) Synthesizer | Standalone C REST server with cJSON parsing, buffer bounds, and memory safety | M4 | ORIGINAL_REQUEST § C | DONE |
| 23 | Java (Spring Boot) Synthesizer | Complete Java Spring Boot `@RestController` with DTOs and `@PostMapping` | M4 | ORIGINAL_REQUEST § Java | DONE |
| 24 | Route Parameter Mapping | Automatic mapping of params to URL path (`:id`), query (`?k=v`), and JSON Body | M4 | Survey Spec Miner 1 | DONE |
| 25 | Standardized JSON Envelope Wrapping | Uniform API response format `{"ok": true, "status": 200, "data": ..., "cell": [x,y,z,u]}` | M4 | Survey Spec Miner 1 | DONE |
| 26 | Client Request Snippet Generator | Instant `curl` and JavaScript `fetch` code generation for every synthesized endpoint | M4 | Survey Explorer 2 | DONE |
| 27 | Real-Time Stdout/Stderr Console | Dual-channel live stream terminal with ANSI/color-coded tags | M5 | ORIGINAL_REQUEST § Real-time execution logs | DONE |
| 28 | Millisecond Timestamping & Metrics | ISO/UTC timestamping, execution duration measurement (ms), and HTTP status codes | M5 | Survey Spec Miner 1 | DONE |
| 29 | Log Filtering & Full-Text Search | Multi-level log filtering (`ALL`, `INFO`, `EXEC`, `API`, `WARN`, `ERROR`) and cell filter | M5 | Survey Spec Miner 1 | DONE |
| 30 | Execution History Ledger & Replay | Persistent history ledger with rerun/replay and export (JSON, CSV, TXT) | M5 | Survey Spec Miner 1 | DONE |
| 31 | Polyglot Runtime Execution & Sandbox | Native execution (Node/Python) + high-fidelity sandbox runner for Go/C/Java | M5 | Survey Explorer 2 | DONE |
| 32 | Backend REST Endpoints | `/api/grid/execute`, `/api/grid/convert`, `/api/grid/upload-dir`, `/api/grid/logs` in `api.php` | M5 | Survey Explorer 1 | DONE |
| 33 | Studio Workspace Import/Export | Full JSON backup and restore for Studio matrix configuration and state | M5 | Survey Spec Miner 1 | DONE |
| 34 | Complete E2E Verification & Hardening | 100% pass of E2E test suite (Tiers 1-4) and Tier 5 Adversarial Coverage Hardening | M6 | Orchestrator Dual Track | DONE |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Circle 7 Integration & Studio Shell | Dock slot 7 button, Toolbox slot 2-3 binding, glassmorphic modal container, CSS styling, responsive layout | none | DONE |
| M2 | 8x7 Coordinate Matrix Grid & 4D Manager | 56-cell interactive matrix $(X: 0..7, Y: 0..6)$, 4D $(x,y,z,u)$ coordinates, 6 lifecycle states, cell metadata inspector, batch ops | M1 | DONE |
| M3 | Directory Upload & File Explorer | Folder picker (`webkitdirectory`), drag-and-drop tree parser, language icons/filters, code editor/previewer, file-to-cell binding, preset samples | M1, M2 | DONE |
| M4 | Code-to-API Polyglot Converter | AST/regex extractor, 6 framework synthesizers (FastAPI, Sanic, Express, Go, C, Java), parameter mapping, JSON envelopes, curl/fetch snippets | M2, M3 | DONE |
| M5 | Real-Time Execution Engine & Log Streamer | Dual-channel streaming console, timestamping, latency tracker, log search/filter, history ledger/export, sandbox runner, backend `/api/grid/*` routes | M1-M4 | DONE |
| M6 | E2E Integration & Verification (Tiers 1-5) | Pass 100% E2E test suite (Tiers 1-4) and Tier 5 Adversarial Coverage Hardening | M1-M5, E2E Test Suite | DONE |

## Code Layout
- `components/polyglot-grid.css`: UI and layout styles for Studio modal, 8x7 grid, file explorer, converter, and logs.
- `components/polyglot-grid.js`: Modular Polyglot Grid API Launcher & Code Studio controller.
- `index.php`: Circle 7 dock button, Toolbox slot 2-3 binding, modal shell markup, asset links.
- `api.php`: Backend `/api/grid/*` REST handlers and command router hooks.
- `tests/e2e/test_polyglot_e2e_suite.js`: Comprehensive E2E test suite covering Tiers 1-4.
- `tests/e2e/test_polyglot_adversarial_tier5.js`: Tier 5 Adversarial edge case & stress test harness.
- `tests/e2e/test_challenger_matrix_ast.js`: Challenger 1 empirical verification script.
- `tests/e2e/test_challenger_ingestion_api.js`: Challenger 2 empirical verification script.
