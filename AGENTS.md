# Hashcod Codespace — Agent Development Instructions

This file defines the default engineering workflow for AI coding agents working in this repository.

## ECC reference

Use **Everything Claude Code (ECC)** as the default external engineering reference for substantial development work:

- Upstream repository: `https://github.com/affaan-m/ECC`
- Current reference reviewed when this file was created: ECC 2.2.x
- ECC is a process and quality reference for this repository; do not blindly copy its files or assume every ECC integration is installed locally.
- When network/repository access is available, consult the relevant ECC `AGENTS.md`, rules, skills, and Codex guidance before complex, security-sensitive, architectural, or multi-file work.
- If ECC guidance conflicts with explicit user requirements, this repository's own architecture, or a higher-priority instruction, follow the higher-priority requirement while preserving the strongest safe engineering practice possible.

The default development loop is:

`understand -> plan -> test -> implement -> review -> verify -> document -> commit`

## 1. Understand before editing

Before changing code:

1. Inspect the existing implementation and nearby files.
2. Identify the real execution path instead of patching only the visible symptom.
3. Reuse existing components, security helpers, routing conventions, and styles whenever possible.
4. Determine whether the change affects authentication, authorization, secrets, APIs, storage, networking, rate limits, cryptography, or deployment behavior.
5. Avoid unrelated refactors unless they are necessary to make the requested change safe and maintainable.

For brownfield areas, treat the current behavior and repository documentation as part of the specification.

## 2. Plan complex work

For changes spanning multiple files or subsystems, make a short implementation plan before writing code. The plan should identify:

- affected files and request paths;
- security and compatibility risks;
- expected user-visible behavior;
- tests or checks needed to prove the change works;
- rollback or backward-compatibility needs when relevant.

Prefer small, independently verifiable changes over large rewrites.

## 3. Test-driven and verification-oriented development

For new behavior and bug fixes, prefer a RED -> GREEN -> REFACTOR workflow:

1. Add or identify a test that demonstrates the expected behavior or regression.
2. Make the smallest implementation that satisfies it.
3. Refactor only after the behavior is verified.

This repository already contains security, E2E, stress, and PHP tests under `tests/`. Use the closest existing test style before inventing a new test harness.

For changed files, run the strongest checks available for the affected area. At minimum:

- PHP: syntax-check changed PHP files with `php -l <file>` when PHP is available.
- JavaScript: syntax-check changed JS with `node --check <file>` when Node is available.
- Security-sensitive admin-device work: include the existing admin-device security/E2E tests when relevant, such as `php tests/security/test-admin-device.php`, `node tests/security/test-admin-device.cjs`, and `node tests/e2e/test_crypto_card_validation_gate.js`.
- Run narrower relevant tests first, then broader regression tests when the change crosses subsystem boundaries.

When coverage tooling exists for the affected code, target at least 80% coverage for new testable logic. Do not fabricate coverage claims if the repository has no applicable coverage measurement.

Never report a test as passing unless it was actually run and passed.

## 4. Security is a release requirement

Security-sensitive changes require explicit review before completion.

Never hardcode or commit:

- API keys;
- passwords;
- bearer tokens;
- private keys;
- session secrets;
- database service-role credentials;
- recovery secrets or authentication material.

Use Render/environment variables, secret files, or the repository's existing server-side secret helpers. Browser JavaScript must never receive provider secrets merely to call a third-party API.

If a secret has been pasted into chat, logs, source code, screenshots, commits, or another exposed location, treat it as compromised and recommend rotation. Do not reproduce exposed secret values in commits, documentation, logs, or responses.

At system boundaries:

- validate and bound all user-controlled input;
- enforce authentication and authorization server-side;
- protect state-changing operations from CSRF/cross-origin abuse as appropriate;
- preserve rate limiting for public and sensitive endpoints;
- prevent SQL/command injection;
- prevent XSS when rendering untrusted text;
- avoid returning stack traces, raw upstream responses, internal paths, secret values, or sensitive diagnostics to the UI.

Do not weaken an existing security control just to make a failing feature appear to work. Fix the incompatibility at the correct layer.

## 5. Hashcod architecture rules

Respect the repository's existing architecture and deployment environment.

- `router.php` is a front-controller boundary. Route order matters; avoid accidental fall-through into the general API or static-file handler.
- Keep provider/API integrations on the server side when credentials are required.
- Preserve same-origin, proxy, and Render/Cloudflare behavior when changing request validation.
- Preserve existing Windows Hello/WebAuthn and admin authorization boundaries. UI visibility is not authorization.
- Keep public UI errors concise and understandable; keep detailed diagnostics server-side when logging is available.
- Prefer feature-scoped components over adding more unrelated logic to very large files.
- Maintain backward compatibility for existing routes only when it is intentional and documented; compatibility shims must not create a second, weaker security path.

## 6. Code quality

Prefer high-cohesion, low-coupling changes.

- Keep functions focused and reasonably small.
- Avoid unnecessary global state.
- Avoid deep nesting when early returns or extracted helpers are clearer.
- Use descriptive names that match the domain.
- Handle failure paths explicitly.
- Do not silently swallow exceptions or API errors.
- Do not duplicate logic that already has a repository helper.
- Avoid broad rewrites of stable code for cosmetic reasons.

For new modules, prefer focused files over expanding an already oversized file.

## 7. API and external-provider changes

When integrating an AI/API provider:

- verify the current provider endpoint and model identifier before coding when fresh documentation is available;
- keep the API key server-side;
- set connection and request timeouts;
- validate upstream response structure;
- map upstream failures to stable, user-friendly application errors;
- rate-limit public endpoints;
- avoid exposing provider account-management URLs, raw billing messages, request IDs, or secret-related diagnostics unless explicitly needed for an administrator;
- make model/provider selection configurable through environment variables when practical;
- do not silently switch providers in a way that changes billing, privacy, or expected behavior without explicit design intent.

## 8. Review before commit

Before finishing a code change, perform a fresh-context review of the diff and ask:

- Does it satisfy the user's exact requested behavior?
- Did it introduce a security bypass?
- Are secrets absent from source and output?
- Are error paths handled?
- Is there an unnecessary unrelated change?
- Are route names, selectors, environment variables, and model/provider identifiers consistent across frontend and backend?
- Does cache/versioning need to be updated for changed browser assets?
- Were the relevant tests/checks actually run?

Fix CRITICAL and HIGH severity findings before considering the task complete.

## 9. Documentation and commits

Document architectural decisions, environment-variable changes, security constraints, and operational steps in the existing appropriate documentation location when the change needs future maintenance context.

Prefer conventional commit messages:

`<type>: <short description>`

Common types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`.

A completion summary should state what changed, where it changed, what was verified, and any deployment/configuration step still required. Do not claim deployment success unless it was actually observed.

## 10. Using ECC without coupling Hashcod to it

ECC should improve the development process without making Hashcod Codespace depend on ECC at runtime.

- Consult ECC for planning, testing, code review, security review, debugging, architecture, and workflow patterns.
- Reuse ideas and procedures selectively based on this repository's stack and constraints.
- Do not introduce ECC runtime dependencies merely because ECC is the reference workflow.
- Before importing source code from ECC or another external repository, verify license compatibility and preserve required notices/attribution.
- Prefer the current upstream ECC guidance when it has materially changed, but keep this repository's local instructions authoritative for Hashcod-specific architecture.

The objective is not to imitate ECC mechanically. The objective is to consistently apply disciplined planning, testing, security review, verification, and maintainable implementation to every meaningful change in Hashcod Codespace.

## 11. Virtual ↔ local desktop parity is mandatory

Hashcod Codespace's hosted/virtual platform and downloadable Windows desktop application are two distributions of the same product. By default, user-facing improvements, bug fixes, components, routes, APIs, translations, assets, and security corrections added to the virtual platform must also be present in the local desktop package.

Rules for every future development:

1. Treat the repository root runtime source as canonical. Do not maintain a separate manual copy of platform features inside `local-app/desktop` unless the behavior is genuinely desktop-specific.
2. When a feature or fix changes the virtual platform, verify that the same source is compatible with the local loopback runtime packaged by `local-app/desktop`.
3. A change may be intentionally cloud-only only when the technical reason is explicit and documented. The desktop build must still fail gracefully or provide an appropriate local alternative instead of silently breaking.
4. Database/schema, environment-variable, cache/version, storage, route, and provider changes must include any local-runtime handling needed by the desktop edition.
5. Do not merge a user-facing runtime change while knowingly leaving the downloadable desktop build on older behavior.
6. The Windows desktop workflow must continue to rebuild from the current `main` source and refresh the `desktop-latest` installer after successful pushes to `main`.
7. Preserve the desktop packaging parity verification in `.github/workflows/desktop-release.yml`; it exists to detect tracked web/runtime files that were omitted or changed while staging the local installer.
8. For relevant changes, test both the hosted execution path and the local `127.0.0.1`/Electron path, or explicitly state which local test is still pending.

See `WEB_DESKTOP_PARITY.md` for the repository-wide release policy and acceptance checklist. This parity rule is a standing requirement for human contributors and AI coding agents unless the repository owner explicitly authorizes a documented exception.
