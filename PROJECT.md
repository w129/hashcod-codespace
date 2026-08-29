# Project: Hashcod Codespace 100M+ Scale High-Concurrency & Crash Resilience

## Architecture
The system is built on a 4-tier high-concurrency resilience model:
1. **Edge Caching & Fast-Path Short-Circuiting**: Caddy / Webserver + `router.php` line-rate static asset serving with deterministic ETags (`W/"<mtime>-<size>"`), HTTP 304 Not Modified, `Cache-Control: public, max-age=31536000, immutable`, and automatic payload compression.
2. **In-Memory & Sharded Cache Layer (`cache.php`)**: Ultra-fast APCu in-memory cache with fallback to sharded lock-free memory buffers. Provides atomic increments, session token fast-path lookup, candidate pepper caching, and PostgREST query deduplication.
3. **Adaptive DDoS Protection & Non-Blocking Rate Limiting (`security.php`)**: Atomic sliding-window rate limiter powered by APCu and 2-level IP shards (`shards/ab/cd/`). Automated Cloudflare Turnstile challenge mitigation with signed HMAC clearance tokens. Fast-path short-circuiting for banned IPs and scanner bots before database access.
4. **Zero-Crash Fault Tolerance & Database Circuit Breaker (`supabase.php`, `api.php`)**: 3-state Circuit Breaker (CLOSED / OPEN / HALF-OPEN) preventing connection pool exhaustion and thread starvation during Supabase downtime or rate limits. Graceful Local Fallback Mode for auth and data queries. Universal shutdown handler and error boundaries guaranteeing 0 unhandled 500/502/504 fatal crashes.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Deterministic ETag & 304 Engine | Calculate ETags (`W/"<mtime>-<size>"`) and short-circuit on `If-None-Match`/`If-Modified-Since` with 0-byte 304 response | M1 | R1 |
| 2 | Tiered Cache-Control Headers | `public, max-age=31536000, immutable` for fingerprinted assets; `public, max-age=86400, stale-while-revalidate=604800` for standard assets | M1 | R1 |
| 3 | Edge Static Offloading & Compression | Configure Caddy `file_server` / `.htaccess` with `encode zstd gzip` / `mod_deflate` and chunked stream handles | M1 | R1 |
| 4 | Unified In-Memory Cache Engine (`cache.php`) | APCu driver with atomic increments, TTL expiry, and lock-free sharded RAM fallback | M2 | R2 |
| 5 | Auth Session & Pepper In-Memory Cache | Cache session tokens and candidate peppers in APCu to eliminate 3x Supabase roundtrips per request | M2 | R2 |
| 6 | Supabase Query Deduplication & Read Cache | Wrap `supabaseDbSelect` with TTL caching; defer activity/command logs to prevent blocking HTTP storms | M2 | R2 |
| 7 | Fast-Path Short-Circuiting | Reject malformed requests, scanner UAs, and banned IPs in <1ms before touching DB or crypto | M2 | R2 |
| 8 | Atomic Sliding-Window Rate Limiter | Compute rate via current/previous window interpolation in APCu/2-level shards without blocking file locks | M3 | R3 |
| 9 | Cloudflare Turnstile Challenge Mitigation | Issue 429 challenge payload on suspicious bursts; validate Turnstile tokens and grant signed clearance | M3 | R3 |
| 10 | Anti-Spoofing Client IP Resolver | Validate trusted proxy CIDRs (Cloudflare/Docker) before accepting `X-Forwarded-For` / `CF-Connecting-IP` | M3 | R3 |
| 11 | Process Resource Ceilings & Memory Guards | Set 15s timeout and 128M/256M memory ceiling on standard APIs; isolate streaming endpoints | M4 | R4 |
| 12 | Universal Shutdown Handler & Error Boundary | Register global shutdown/error/exception handlers outputting clean JSON; redact secrets; zero fatal crashes | M4 | R4 |
| 13 | Supabase 3-State Circuit Breaker | CLOSED/OPEN/HALF-OPEN circuit breaker tripping after 3 consecutive failures to bypass remote cURL calls | M4 | R4 |
| 14 | Local Fallback Mode & Sync Queue | Fall back to local disk/APCu cache during Supabase outages and queue mutations in `data_storage/sync_queue/` | M4 | R4 |
| 15 | E2E Concurrency & Resilience Test Suite | Automated verification across Tiers 1-4 + Tier 5 adversarial stress testing (36 suites, 166 methods) | M5 | Acceptance Criteria |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Edge Caching & Payload Optimization | `router.php`, `Caddyfile`, `.htaccess`, `l8-html.php`, asset delivery engine, ETags, 304s, Cache-Control, compression | none | DONE |
| M2 | In-Memory Cache & Database Connection Armor | `cache.php`, `auth.php`, `supabase.php` session/pepper cache, query deduplication, deferred logging, fast-path | M1 | DONE |
| M3 | Adaptive DDoS Armor & Rate Limiting | `security.php`, `cloudflare-turnstile.php` sliding window, IP sharding, Turnstile mitigation, anti-spoofing | M2 | DONE |
| M4 | Zero-Crash Fault Tolerance & Circuit Breaker | `security.php`, `api.php`, `supabase.php` execution guards, shutdown handler, 3-state circuit breaker, local fallback | M3 | DONE |
| M5 | E2E Testing Suite & Concurrency Verification | Full E2E test suite (Tiers 1-4) + Tier 5 Adversarial Coverage Hardening (36 suites, 166 methods, 100% pass) | M1, M2, M3, M4 | DONE |

## Interface Contracts
### `cache.php` ↔ `auth.php`, `security.php`, `supabase.php`
- `l8CacheGet(string $key): mixed` (returns `null` on miss/expiration)
- `l8CacheSet(string $key, mixed $value, int $ttlSeconds = 300): bool`
- `l8CacheInc(string $key, int $step = 1, int $ttlSeconds = 60): int`
- `l8CacheDel(string $key): bool`
- `l8CacheFlush(): bool`

### `security.php` ↔ `router.php`, `api.php`
- `securityRateAllowSliding(string $bucket, int $limit, int $windowSec, ?string $ip = null): array` (returns `['allowed' => bool, 'count' => float, 'remaining' => int, 'retry_after' => int, 'challenge_required' => bool]`)
- `securityClientIp(): string` (returns sanitized, validated client IP)
- `securityBootstrap(string $context = 'web'): void` (registers global error/shutdown handlers and security headers)

### `supabase.php` ↔ `auth.php`, `api.php`
- `supabaseCircuitBreaker(): array` (returns `['state' => 'CLOSED'|'OPEN'|'HALF_OPEN', 'failures' => int, 'last_failure' => int, 'cooldown' => int]`)
- `supabaseDbSelectCached(string $table, string $query = '', int $ttl = 60, bool $forceFresh = false): array`
- `supabaseQueueSyncMutation(string $table, string $action, array $payload): bool`

## Code Layout
- `cache.php`: Core in-memory / sharded RAM cache abstraction
- `router.php`: Front controller with line-rate static asset ETag/304 engine and MIME dispatch
- `security.php`: Security bootstrap, sliding-window rate limiter, error boundaries, IP validation, memory guards
- `supabase.php`: Supabase PostgREST client, 3-state Circuit Breaker, query deduplication, local fallback mode
- `auth.php`: Authentication engine with in-memory session validation, candidate pepper caching, and fast-path short-circuit
- `cloudflare-turnstile.php`: Turnstile automated challenge mitigation and HMAC clearance tokens
- `Caddyfile`: Edge reverse proxy with static `file_server`, `encode zstd gzip`, and header policies
- `.htaccess`: Apache header caching, mod_deflate/mod_brotli rules
- `tests/e2e/`: E2E concurrency, rate-limiting, and fault tolerance test suite
