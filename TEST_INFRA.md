# E2E Test Infra: Hashcod Codespace Public APIs Hardening

## Test Philosophy
- Opaque-box, requirement-driven, verified from user and endpoint perspective.
- Methodology: Category-Partition + Boundary Value Analysis + Pairwise Combinatorial Testing + Real-World Workload Testing.

## Feature Inventory
| # | Feature | Source (requirement) | Tier 1 | Tier 2 | Tier 3 | Tier 4 |
|---|---------|---------------------|:------:|:------:|:------:|:------:|
| 1 | Threat & IP Reputation Defense | R1. Threat & Bot Defense | 5 | 5 | ✓ | ✓ |
| 2 | Dependency & CVE Vulnerability Auditing | R1. Malware & CVE Auditing | 5 | 5 | ✓ | ✓ |
| 3 | Safe Zip & Folder Ingestion & Malware Heuristics | R1 & R3. Zip Upload & Watchdog | 5 | 5 | ✓ | ✓ |
| 4 | Quantum Entropy Injection | R1. Quantum Entropy Feeds | 5 | 5 | ✓ | ✓ |
| 5 | Atomic Time & Deployment Certification | R2. Atomic Time Certification | 5 | 5 | ✓ | ✓ |
| 6 | Resilient Proxy & Multi-Tier Circuit Breaker | R2. Fault-Tolerant Proxy & Fallbacks | 5 | 5 | ✓ | ✓ |
| 7 | Codespace Security Monitor & Background Watchdog | R3. Security Dashboard & Watchdog | 5 | 5 | ✓ | ✓ |
| 8 | Master Test Automation & System Integration | Acceptance Criteria | 5 | 5 | ✓ | ✓ |

## Test Architecture
- Master Test Suite: `tests/e2e/test_platform_security_apis.js`
- Test Runner: Node.js standard runner invoked via `node tests/e2e/test_platform_security_apis.js` or integrated into `tests/e2e/run_all_verifications.js`.
- Pass/Fail Semantics: Process exits with code 0 on 100% pass, non-zero with assertion failure trace on any failure.
- Directory Layout:
  - `tests/e2e/test_platform_security_apis.js`
  - `tests/fixtures/security/` (sample manifests, benign zips, malicious zip-slip payloads, quantum seed samples)

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Features Exercised | Complexity |
|---|----------|--------------------|------------|
| 1 | End-to-End Zip Upload & CVE Audit | F2, F3, F7 | High |
| 2 | Quantum-Enriched Dilithium-5 Nonce & Signature Generation | F4, F5 | High |
| 3 | Upstream Network Outage & Circuit Breaker Offline Fallback | F1, F6 | High |
| 4 | Botnet / Malicious Scanner Interception & Honeypot Trap | F1, F7 | Medium |
| 5 | Atomic Timestamp Certification of Signed Deployment | F4, F5, F6 | High |

## Coverage Thresholds
- Tier 1: ≥5 tests per feature (40 total)
- Tier 2: ≥5 boundary/edge tests per feature (40 total)
- Tier 3: Pairwise cross-feature interactions (12 tests)
- Tier 4: Real-world end-to-end integration workflows (5 tests)
- Tier 5: Adversarial stress & integrity validation (10 tests)
- **Total Suite**: ≥100 automated test assertions
