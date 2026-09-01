# Project: Publications and Preview Blog Tool Audit, Repair, and Polish

## Architecture
The platform is an interactive web workspace driven primarily by `index.php` (which contains server-rendered HTML, embedded CSS styles, and client-side JavaScript tool engines), synchronized to static replicas `index.html` and `404.html` via `scripts/sync_static_html.js`.
The Publications and Preview Blog tool (Toolbox Slot 1-1) consists of:
1. `#excelBlogOverlay` / `.excel-blog-overlay`: Main preview table displaying a 16-column dataset with filtering, selection, and indicators.
2. `#excelReaderModal` / `.reader-modal-overlay`: Reader modal showing article details, category badge, metadata bento box, code snippet pre-block, and like counter.
3. `#platformCodeModal`: Code sandbox viewer and executor with runner console, copy-to-clipboard, and download actions.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Dynamic Column Widths & Viewport Responsiveness | 16-column table headers and cells adapt gracefully without text clipping or truncated borders across desktop (1366px–1920px); smooth horizontal scroll with visible edge indicators in `.data-table-wrap` | M1 | ORIGINAL_REQUEST R1 |
| 2 | Search Filter & Row Selection Synchronization | Real-time `filterExcelBlog()`, index synchronization to active filtered row set, `openSelectedBlogArticle()` opens exact matched row, dedicated search clear 'X' button distinct from modal close | M1 | ORIGINAL_REQUEST R2 |
| 3 | Visual Indicators & Active Row States | CORS checkboxes (Y/N), HASNA 371 color squares (#E63333, #33B34D, #3366E6, #FFFFFF), and `.active-row` styling across 16 columns | M1 | ORIGINAL_REQUEST R4 |
| 4 | Reader Modal DOM IDs & Data Binding Fixes | Align DOM IDs (`readLikesCount`/`readLikeCount`, `readManagerVal`/`readMgrVal`, `readFilename`/`readCodeFileName`, `readCodePre`/`readCodeSnippet`); dynamic `#readCat` binding to `r.icai_page`; metadata fallbacks | M2 | ORIGINAL_REQUEST R3 |
| 5 | Likes Counter & Event Handler Aliases | Fix `toggleLike()` and `likeCurrentPost()` synchronization and counter updates | M2 | ORIGINAL_REQUEST R3 |
| 6 | Code Sandbox Runner & Viewer Stabilization | `openBlogCodeViewer()`, `runSandboxTest()` line breaks, console reset before runs, `copyPlatformCode`/`copyReaderCode` visual confirmation ("¡Copiado! ✓"), `downloadCurrentPlatformCode()` blob download | M3 | ORIGINAL_REQUEST R5 |
| 7 | Static HTML Sync & DOM Tag Balance Invariant | Maintain strict HTML tag balance (`openDivs === closeDivs` / Δ = 0) and sync `index.html`/`404.html` via `scripts/sync_static_html.js` | M4 | Survey Invariant |
| 8 | 4 Platform Test Suites & Master Verification Pass | 100% pass rate across `test_polyglot_e2e_suite.js`, `test_challenger_ingestion_api.js`, `test_challenger_matrix_ast.js`, `test_polyglot_adversarial_tier5.js` via `run_all_verifications.js` | M4 | ORIGINAL_REQUEST Acceptance |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Table Architecture, Responsiveness & Search Filtering | Column widths, CSS word-wrap, horizontal scrollbar, search filter indexing, search clear button, CORS & HASNA indicators | none | PLANNED |
| 2 | Reader Modal DOM IDs, Data Binding & Likes Synchronization | Modal DOM ID harmonization, `#readCat` binding, metadata fallbacks, like counter updates, event aliases | M1 | PLANNED |
| 3 | Sandbox Runner, Code Viewer & Platform Actions | Code preview formatting, sandbox console reset/runner, copy badge ("¡Copiado! ✓"), blob download | M2 | PLANNED |
| 4 | Static Sync, Verification Harness & Full Test Suite Pass | Run `sync_static_html.js`, DOM tag balance audit, and all 4 platform test suites | M3 | PLANNED |

## Interface Contracts
### Excel Blog Engine ↔ Table DOM
- `L8_SYSTEM_COLUMNS`: Array of 16 column definitions with responsive `minWidth` allocations.
- `renderExcelTable()`: Renders filtered records, updates `.data-table-wrap`, maintains `filteredBlogRows` array and syncs `selectedBlogRowIndex`.
- `filterExcelBlog()`: Reads `#excelBlogSearchInput`, updates table, auto-selects first filtered row index.
- `resetExcelBlogFilter()`: Clears input and restores all rows.

### Reader Modal ↔ Publication Data Record
- `openBlogArticleDetails(identifierCode)`: Reads record `r` from `getSharedPublicationRows()`.
  - Sets `#readCat` = `r.icai_page || 'ICAI-v4'`
  - Sets `#readLikeCount` / `#readLikesCount` = `r.likes || 14`
  - Sets `#readFilename` / `#readCodeFileName` = `r.code_file || 'module.py'`
  - Sets `#readCodePre` / `#readCodeSnippet` = formatted code snippet
  - Sets `#readManagerVal` / `#readMgrVal` = `Manager ID: ${r.mgr || 'MGR-01'}`
  - Populates metadata fields with safe fallbacks.
- Event Handlers:
  - `window.likeCurrentPost = window.toggleLike`
  - `window.copyReaderCode = window.copyPlatformCode`
  - `window.runReaderSandbox = window.runSandboxTest`

### Code Sandbox & Viewer ↔ DOM
- `runSandboxTest()`: Clears `#readConsoleOutput` / `#sandboxOutputBox`, executes sandbox simulation, formats output with timestamp.
- `copyPlatformCode()` / `copyReaderCode()`: Copies text to clipboard, shows "¡Copiado! ✓" badge.
- `downloadCurrentPlatformCode()`: Creates and triggers download of code blob.

## Code Layout
- `index.php`: Master application file (HTML templates lines ~19156–19372, CSS styles lines ~4421–4824, JS engine lines ~20195–20486).
- `index.html` & `404.html`: Synchronized static builds generated via `scripts/sync_static_html.js`.
- `scripts/sync_static_html.js`: Synchronization script.
- `tests/e2e/run_all_verifications.js`: Master verification runner.
- `tests/e2e/test_polyglot_e2e_suite.js`: Suite 1.
- `tests/e2e/test_challenger_ingestion_api.js`: Suite 2.
- `tests/e2e/test_challenger_matrix_ast.js`: Suite 3.
- `tests/e2e/test_polyglot_adversarial_tier5.js`: Suite 4.
