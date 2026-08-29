# E2E Test Infra: Hashcod Codespace High Concurrency & Fault Tolerance

## Test Philosophy
- Opaque-box, requirement-driven. No dependency on implementation design.
- Methodology: Category-Partition + BVA + Pairwise + Workload Testing.

## Feature Inventory
| # | Feature | Source (requirement) | Tier 1 | Tier 2 | Tier 3 |
|---|---------|---------------------|:------:|:------:|:------:|
| 1 | Deterministic ETag & 304 Engine | R1 | 5 | 5 | ✓ |
| 2 | Tiered Cache-Control Headers | R1 | 5 | 5 | ✓ |
| 3 | Edge Static Offloading & Compression | R1 | 5 | 5 | ✓ |
| 4 | Unified In-Memory Cache Engine | R2 | 5 | 5 | ✓ |
| 5 | Auth Session & Pepper Cache | R2 | 5 | 5 | ✓ |
| 6 | Supabase Query Deduplication | R2 | 5 | 5 | ✓ |
| 7 | Fast-Path Short-Circuiting | R2 | 5 | 5 | ✓ |
| 8 | Atomic Sliding-Window Rate Limiter | R3 | 5 | 5 | ✓ |
| 9 | Cloudflare Turnstile Challenge Mitigation | R3 | 5 | 5 | ✓ |
| 10 | Anti-Spoofing Client IP Resolver | R3 | 5 | 5 | ✓ |
| 11 | Process Resource Ceilings & Memory Guards | R4 | 5 | 5 | ✓ |
| 12 | Universal Shutdown Handler & Error Boundary | R4 | 5 | 5 | ✓ |
| 13 | Supabase 3-State Circuit Breaker | R4 | 5 | 5 | ✓ |
| 14 | Local Fallback Mode & Sync Queue | R4 | 5 | 5 | ✓ |

## Test Architecture
- Test runner: `tests/e2e/runner.php`
- Test case format: Standalone runnable PHP and HTTP assertions with exit code 0 on success
- Directory layout:
  * `tests/e2e/` (runner and fixtures)
  * `tests/e2e/tier1/` (feature coverage)
  * `tests/e2e/tier2/` (boundary & corner cases)
  * `tests/e2e/tier3/` (cross-feature pairwise)
  * `tests/e2e/tier4/` (real-world workload scenarios)

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Features Exercised | Complexity |
|---|----------|--------------------|------------|
| 1 | High-Concurrency Static Burst & 304 Revalidation Storm | F1, F2, F3 | High |
| 2 | High-Concurrency Authenticated Traffic with In-Memory Caching | F4, F5, F6, F7 | High |
| 3 | Multi-IP DDoS Flood & Turnstile Mitigation | F8, F9, F10 | Extreme |
| 4 | Complete Supabase Outage with Circuit Breaker & Local Fallback | F11, F12, F13, F14 | Extreme |
| 5 | Combined Massive Traffic Spike with Partial Network Failure | F1-F14 | Extreme |

## Coverage Thresholds
- Tier 1: ≥5 per feature (70+ test cases)
- Tier 2: ≥5 per feature (70+ test cases)
- Tier 3: pairwise coverage of major feature interactions (15+ test cases)
- Tier 4: ≥5 realistic application scenarios
