# Hashcod Codespace — Virtual / Desktop Parity Policy

## Product invariant

The hosted Hashcod Codespace platform and the downloadable Windows desktop application are two distributions of the same product.

**Default rule:** when a feature, bug fix, UI improvement, route, API, translation, asset, security correction, storage change, or workflow improvement is added to the virtual platform, the downloadable local desktop build must ship the same behavior unless there is a documented technical reason that makes the feature intentionally cloud-only.

## Canonical source

The repository root is the canonical application source. The desktop shell under `local-app/desktop` packages the current application source; it is not a separate fork of the platform.

Avoid copying or reimplementing ordinary web features inside the Electron shell. Desktop-only code should be limited to responsibilities such as:

- starting and stopping the local runtime;
- desktop window behavior;
- installer/update packaging;
- local resource paths;
- desktop-specific security or OS integration;
- graceful handling of capabilities that only exist in the hosted environment.

## Automatic desktop freshness

`.github/workflows/desktop-release.yml` runs for pull requests and on every push to `main`.

On a successful push to `main`, the workflow must:

1. stage the current repository application source into the desktop payload;
2. verify that tracked application files in the payload match the source repository;
3. record the exact source commit in the packaged payload;
4. build and validate `Hashcod-Codespace-Setup.exe`;
5. publish/replace the stable `desktop-latest` installer asset.

This means a normal feature merged into `main` should not require a second manual copy operation to reach the downloadable edition.

## Required review for future changes

For every runtime/user-facing change, contributors must check:

- Does the change work in the hosted environment?
- Does the same source work through the desktop `127.0.0.1` runtime?
- Does it depend on Render, Cloudflare, a hosted-only secret, a remote filesystem, or another cloud-only capability?
- If environment variables changed, is `.env.example` and local handling updated?
- If the database/schema changed, can the desktop runtime use the required schema or fail safely?
- If browser assets changed, does cache/version handling keep both distributions current?
- If routes or APIs changed, does local routing still resolve them correctly?
- If authentication/security changed, are desktop-specific boundaries preserved?

## Cloud-only exceptions

A feature may remain cloud-only only when the exception is intentional and documented in the relevant pull request or maintenance documentation.

The exception must identify:

- why the feature cannot or should not run locally;
- what the desktop user sees instead;
- whether a later desktop implementation is planned;
- any security, privacy, storage, licensing, or provider constraint involved.

### Parity note: full-screen welcome (platform intro)

- `components/platform-intro.js|css`, `components/platform-intro-terrain.js` (Originkit Wire Terrain, WebGL) and `assets/intro/hashcod-logo.webp` are loaded by `mldsaGateHtml()` for every edition, so the Windows desktop shows the same welcome before the platform.
- The background is the Wire Terrain flight animation (white wireframe on black); the white logo sits top-left and the enter button bottom-right. It always animates, even with `prefers-reduced-motion`; without WebGL the plain black welcome remains.
- Automated browsers (`navigator.webdriver`) skip it so end-to-end suites keep exercising the platform; `?intro=1` forces it (see `tests/e2e/test_platform_intro_browser.js`).

### Parity note: Cuaderno de IA (Toolbook 1-1)

- Same source on both editions: `notebook-ai.php` calls the chosen provider (Anthropic, OpenAI or OpenRouter) over HTTPS with the user's own API key, so the desktop edition needs internet access but no extra runtime.
- The key is never stored on disk: it lives encrypted in an HttpOnly cookie for 30 minutes. On the desktop loopback runtime the cookie is non-Secure (http) and host-bound to `127.0.0.1:<port>`.
- Files are read in the browser after the usual file-code verification; only the extracted text of the sources the user selects is sent to the provider.

### Documented exception: PDF analyzer (OpenDataLoader PDF)

- **Why:** `pdf-extract.php` runs the OpenDataLoader PDF CLI jar, which needs a Java 11+ runtime. The hosted Docker image installs both; the Windows installer does not bundle a JRE.
- **Desktop user sees:** the same button and panel (same source). Analysis answers "El extractor de PDF no está disponible en este entorno." until a JRE is on `PATH` (or `JAVA_BIN`) and `OPENDATALOADER_JAR` points to `opendataloader-pdf-cli.jar` (see `.env.example`).
- **Later plan:** bundle a JRE and the jar in the desktop payload.
- **Privacy:** the PDF is processed in a private temp directory and removed before the response; nothing leaves the machine in the desktop edition.

An undocumented missing desktop feature is considered a parity regression.

## Release acceptance

A change that affects product behavior is considered complete only when one of these is true:

- hosted and desktop behavior are both verified; or
- the desktop behavior is covered by the shared implementation and CI packaging checks, with any remaining real-device/local verification explicitly called out; or
- a documented cloud-only exception has been approved by the repository owner.

The objective is simple: **a user downloading the latest Hashcod Codespace desktop installer should receive the current product behavior from `main`, not an older local edition.**

### Parity note: PSOT forms library
- `center-empty-state-build/{FormsTool,FormsIcon}.jsx`, `forms-data.js` (catalog), `forms-tool.css`, `forms-library.php` (`GET /api/forms-library/{ID}[?download=1]`, whitelisted by code, Pro period enforced by the `/api/` guard) and the 100 PDFs in `assets/forms/` are ordinary tracked runtime files, so the desktop edition gets them from the same source; no cloud-only dependency (the PDFs are static and need no external service).
- Tests: `php tests/test_forms_library.php`, `node tests/e2e/test_forms_tool_browser.js`. Adding a form = drop `<CODE>_<Name>.pdf` in `assets/forms/`, add its row in `forms-data.js`, bump the bundle `?v=`.

### Parity note: asset constancias (see `CONSTANCIA.md`)
- Same source for both editions: `constancia-lib.php`, `constancia.php` (`/api/constancia/*`, `/verify/*`, `/.well-known/did.json` routed in `router.php`), `scripts/constancia_render.py`, `components/{sha512-stream,constancia-verify}.{js,css}`, the `SealTool` React island and `assets/constancia/`.
- **Documented desktop exception:** the Windows package has no `openssl` CLI (RFC 3161 requests/verification) and no Python with `reportlab/pypdf/Pillow` (PDF rendering). `constanciaCapabilities()` detects this and the tool shows what is missing instead of failing; sealing is effectively hosted-only until those two are packaged (e.g. a PyInstaller renderer like the tokenization worker + `openssl.exe`). The desktop workflow now also enables `pdo_sqlite`/`sqlite3` so the registry code loads. Local `127.0.0.1` run of the tool: pending.
- The public verification surfaces and `hcod verify` only need PHP (`sodium`, `zip`, `curl`) plus `openssl` for the time-stamp check.
