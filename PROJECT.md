# Project: Hashcod Codespace Enterprise Security Architecture Hardening

## Architecture
- **Host Architecture**: Native PHP Server-Side Rendered (SSR) monolithic application with modular frontend components (HTML5, CSS3, ES6+ JS) and unified JSON REST API (`api.php`, `auth.php`, `security.php`, `supabase.php`, `bash-engine.php`, `cloudflare-turnstile.php`, `openclaw-bridge.php`, `secrets.php`).
- **Security Perimeter & Defense-in-Depth**:
  - **Secret Vault & Key Decoupling**: Dynamic secret resolution (`secretGet()`), zero fallback secrets in source code, strict separation between public client access and server-side service keys (`SUPABASE_SECRET_KEY`).
  - **Database Persistence & RLS**: PostgreSQL Row-Level Security on all 18 tables with explicit deny-all policies for untrusted roles (`anon`, `authenticated`), and scoped multi-tenant filtering (`account_key`) via backend proxy.
  - **Field-Level Cryptography**: Authenticated AES-256-GCM field encryption (`l8e1:iv:tag:ct`), master vault sealing (`l8v1:iv:tag:ct`), and NIST ML-DSA-87 (Dilithium-5) post-quantum signature verification.
  - **Authentication & Session Armor**: Mandatory server-side auth guards on all execution/privileged endpoints, `PASSWORD_ARGON2ID` password hashing with HMAC pepper pre-hashing, and session cookies with `HttpOnly; Secure; SameSite=Strict`, 2-hour idle timeout, and dynamic token rotation.
  - **Adaptive Traffic & Bot Armor**: Sliding-window rate limiting (120 req/min global, 40 req/10s burst), strike-based IP lockout, Cloudflare Turnstile bot verification with signed HMAC clearance cookies.
  - **Input Validation & XSS Neutralization**: Schema validation, bound JSON parser, contextual entity escaping (`htmlspecialchars` with `ENT_QUOTES | UTF-8`), and parameter tamper proofing on roles, account IDs, and pricing ($60.27/mo).
  - **Sandboxed Uploads**: Binary magic byte verification, executable extension blacklist, `0600` sandboxed directory (`uploads/`), and response pagination limits.
  - **Enterprise HTTP Headers**: HSTS (`max-age=31536000; includeSubDomains; preload`), CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`.

## Feature Inventory
| # | Feature | Description | Milestone | Source | Status |
|---|---------|-------------|-----------|--------|--------|
| 1 | Hardcoded Secret Purging | Purge fallback Dilithium-5 signatures, Turnstile secrets, SSH keys from `auth.php`, `api.php`, `cloudflare-turnstile.php`, `security.php`, `bash-engine.php` | M1 | ORIGINAL_REQUEST § R1 | DONE |
| 2 | Secret Vault & Dynamic Resolution | Resolve secrets strictly via `secretGet()` -> `.env.local` / AES-256 vault without leaking keys in code or repo | M1 | ORIGINAL_REQUEST § R1 | DONE |
| 3 | Database Key Decoupling | Client accesses DB only via scoped public key or server API proxy; `SUPABASE_SECRET_KEY` isolated server-side | M1 | ORIGINAL_REQUEST § R1 | DONE |
| 4 | PostgreSQL Row-Level Security (RLS) | Enforce RLS on all 18 PostgreSQL tables (`l8_auth_accounts`, `l8_auth_identities`, `system_logs`, etc.) with deny-all on untrusted roles | M2 | ORIGINAL_REQUEST § R2 | DONE |
| 5 | Field-Level AES-256-GCM / PQC Encryption | Encrypt sensitive user fields and keys prior to storage using `l8e1:iv:tag:ct` and NIST ML-DSA-87 Dilithium-5 signatures | M2 | ORIGINAL_REQUEST § R2 | DONE |
| 6 | Real-Time Query Telemetry & Circuit Breaker | 3-state circuit breaker (`CLOSED`, `OPEN`, `HALF_OPEN`), fast-fail (<0.1ms), memory TTL caching, and secret-redacted logging | M2 | ORIGINAL_REQUEST § R2 | DONE |
| 7 | Server-Side Auth on Privileged Routes | Mandatory `securityRequireAccountSession()` on `/api/bash/exec`, `/api/catalyst/execute`, `/api/grid/execute`, `/api/openclaw/*`, `/api/command` | M3 | ORIGINAL_REQUEST § R3 | DONE |
| 8 | Argon2id Password Hashing & Pepper | Upgrade password hashing to Argon2id with high-cost parameters, salt generation, HMAC pepper, and transparent login upgrade | M3 | ORIGINAL_REQUEST § R3 | DONE |
| 9 | Session Cookie Armor & Expiration | Set cookies with `HttpOnly; Secure; SameSite=Strict`, 2-hour idle timeout, 24-hour absolute lifespan, and dynamic token rotation | M3 | ORIGINAL_REQUEST § R3 | DONE |
| 10 | System Log & Audit Protection | Restrict direct access to log files, audit registries, and debug endpoints to authorized admin contexts only | M3 | ORIGINAL_REQUEST § R3 | DONE |
| 11 | Sliding-Window Adaptive Rate Limiting | Sliding-window rate limiters per IP and per account on auth routes and execution endpoints | M4 | ORIGINAL_REQUEST § R4 | DONE |
| 12 | Exponential Backoff & Account Lockout | Strike-based IP lockout and exponential delay after consecutive failed login attempts | M4 | ORIGINAL_REQUEST § R4 | DONE |
| 13 | Cloudflare Turnstile Bot Defense | Validate Turnstile tokens, issue signed HMAC clearance cookies with 5x rate limit elevation, challenge unverified traffic | M4 | ORIGINAL_REQUEST § R4 | DONE |
| 14 | Universal Input Validation & Schema Checking | Enforce server-side schema checking, type validation, and bounded JSON body parser (`securityReadJsonBody`) | M5 | ORIGINAL_REQUEST § R5 | DONE |
| 15 | Contextual Output Escaping (XSS Defense) | Contextually escape HTML entities (`ENT_QUOTES | UTF-8`), JS context variables, and strip ANSI codes to prevent XSS | M5 | ORIGINAL_REQUEST § R5 | DONE |
| 16 | Parameter Tamper Proofing | Immutable server-side role assignment, session account ID binding, and fixed pricing ($60.27/mo) tamper protection | M5 | ORIGINAL_REQUEST § R5 | DONE |
| 17 | Sandboxed File Upload Security | Validate binary magic bytes, block executable extensions, isolate uploads to `0600` sandboxed directory (`uploads/`) | M5 | ORIGINAL_REQUEST § R6 | DONE |
| 18 | API Response Pagination & Truncation | Enforce response pagination and memory caps (6,000 files repo tree, 1,000 log ring buffer, 50 history ledger) | M5 | ORIGINAL_REQUEST § R6 | DONE |
| 19 | Enterprise HTTP Security Headers | Enforce CSP, HSTS (`max-age=31536000; includeSubDomains; preload`), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Permissions-Policy` | M6 | ORIGINAL_REQUEST § R7 | DONE |
| 20 | Strict HTTPS Enforcement & Secret Redaction | Enforce HTTPS redirection and redact secrets (`securityRedactSecrets`) from all error logs and exception handlers | M6 | ORIGINAL_REQUEST § R7 | DONE |
| 21 | Dependency Vulnerability Audit | Verify lockfile integrity (`package-lock.json`), audit production dependencies for 0 critical vulnerabilities | M6 | ORIGINAL_REQUEST § R7 | DONE |
| 22 | 100% E2E Test Suite & Security Verification | Ensure 100% pass across all test suites (`test_polyglot_e2e_suite.js`, `test_challenger_ingestion_api.js`, `test_challenger_matrix_ast.js`, `test_polyglot_adversarial_tier5.js`, etc.) | M7 | Acceptance Criteria | DONE |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Secret Purging, Vaulting & DB Decoupling | Purge hardcoded fallback secrets in `auth.php`, `api.php`, `cloudflare-turnstile.php`, `security.php`, `bash-engine.php`; enforce dynamic vaulting and DB key decoupling | none | DONE |
| M2 | Database RLS, AES-256/PQC & Telemetry | PostgreSQL RLS deny-all policies in `schema.sql`, field-level AES-256-GCM (`l8e1:`) encryption, PQC signature verification, 3-state query circuit breaker | M1 | DONE |
| M3 | Server-Side Auth, Argon2id & Session Armor | Mandatory session checks on execution routes (`/api/bash/exec`, `/api/catalyst/execute`, `/api/grid/execute`, `/api/openclaw/*`), Argon2id hashing, `SameSite=Strict; HttpOnly; Secure` cookies, idle expiration | M1, M2 | DONE |
| M4 | Adaptive Rate Limiting & Bot Challenge | Sliding-window limiters, strike IP lockout, Cloudflare Turnstile bot verification & HMAC clearance tokens | M3 | DONE |
| M5 | Input Validation, XSS & Upload Sandbox | Schema validation, contextual escaping (`ENT_QUOTES`), anti-tamper protections, upload magic byte check, `0600` sandbox, pagination limits | M3, M4 | DONE |
| M6 | Security Headers, HTTPS & Dependency Audit | HSTS preload, CSP, X-Frame-Options, Permissions-Policy, HTTPS enforcement, exception secret redaction, lockfile audit | M1-M5 | DONE |
| M7 | E2E Security Verification & Hardening | Pass 100% E2E test suites (Tiers 1-5), Reviewer/Challenger/Auditor validation | M1-M6 | DONE |

## Interface Contracts
### Auth & Session Contract
- `securityRequireAccountSession()` -> `array{'ok': bool, 'session'?: array, 'error'?: string, 'status'?: int}`
- `authHashPassword(string $plaintext)` -> `string` (Argon2id hash `$argon2id$v=19$m=65536,t=4,p=1$...`)
- `authVerifyPassword(string $plaintext, string $storedHash)` -> `bool`

### Encryption & Vault Contract
- `secretsEncrypt(string $plaintext, ?string $key)` -> `string` (`l8e1:<iv>:<tag>:<ct>`)
- `secretsDecrypt(string $payload, ?string $key)` -> `string|null`

### Rate Limiting & Bot Defense Contract
- `securityRateAllowSliding(string $bucket, int $limit, int $windowSec, ?string $ip)` -> `bool`
- `cfValidateClearanceToken(?string $token, ?string $ip)` -> `bool`

## Code Layout
- `auth.php`: Core authentication, password hashing (Argon2id), session management, Dilithium-5 verification.
- `security.php`: Security headers, sliding-window rate limiting, IP bans, input sanitization, secret redaction, auth enforcement.
- `secrets.php`: AES-256-GCM Master Vault, field-level encryption, environment key resolution.
- `supabase.php`: Database client, 3-state circuit breaker, query cache, offline sync queue.
- `cloudflare-turnstile.php`: Cloudflare Turnstile token validation, HMAC clearance tokens.
- `bash-engine.php`: Sandboxed shell execution, Python catalyst execution with auth checks.
- `openclaw-bridge.php`: OpenClaw AI gateway bridge with auth checks.
- `api.php`: REST API endpoints, upload handler with magic-byte validation, route routers.
- `supabase/schema.sql`: PostgreSQL schema and RLS policy definitions.
- `tests/e2e/test_polyglot_e2e_suite.js`: Comprehensive E2E test suite covering Tiers 1-4.
- `tests/e2e/test_challenger_ingestion_api.js`: Challenger 2 empirical verification suite.
- `tests/e2e/test_challenger_matrix_ast.js`: Challenger 1 empirical verification suite.
- `tests/e2e/test_polyglot_adversarial_tier5.js`: Tier 5 Adversarial & boundary stress harness.
