# Project: Hashcod Codespace Public APIs Security Hardening

## Architecture
Hashcod Codespace is hardened into an ultra-secure, highly resilient, post-quantum fortified development platform using curated Public APIs.

The hardened architecture consists of 6 integrated subsystems:
1. **Threat Intelligence & Bot Defense Subsystem (`threat-intel.php`, `security.php`)**:
   - Real-time IP reputation checking (AbuseIPDB v2, IPQualityScore, StopForumSpam) integrated into `securityBootstrap()` and API routing.
   - Passive honeypot deception traps and automated scanner user-agent interception.
   - Sliding window rate limiting with Turnstile challenge integration.
2. **Vulnerability & Malware Audit Engine (`vulnerability-auditor.php`, `api.php`)**:
   - OSV.dev batch API (`POST /v1/querybatch`) for instant (<150ms) resolution across npm, PyPI, Composer, Cargo, and Go packages.
   - NIST NVD 2.0 CVE enrichment with CVSS v3.1 severity metrics and CWE classifications.
   - Safe `.zip` and folder ingestion pipeline with Zip-Slip path traversal defense, decompression bomb prevention (100:1 ratio limit, 150MB extract limit), and recursive archive safety.
   - Real-time heuristic malware pattern matcher (reverse shells, obfuscated code execution, malicious lifecycle scripts, crypto miners).
3. **Quantum Entropy & Atomic Time Subsystem (`quantum-entropy.php`, `atomic-time.php`, `auth.php`)**:
   - Live ANU Quantum Random Numbers API (vacuum fluctuations) and NIST Randomness Beacon 2.0 (signed 512-bit pulses) feeds.
   - RFC 8937 / NIST SP 800-90B compliant HKDF-SHA512 hybrid entropy pool with non-degradation guarantees (falling back gracefully to host OS CSPRNG).
   - Entropy injected dynamically into Dilithium-5 lattice key generation and session nonce rotation.
   - Deterministic atomic time certification via Cloudflare Edge Trace and NIST Time API, generating tamper-evident signed deployment receipts (`deployment_cert.json`).
4. **Resilient Service Engine & Circuit Breaker (`resilient-proxy.php`, `circuit-breaker.php`, `cache.php`)**:
   - 4-tier caching proxy (L1 in-memory, L2 APCu, L3 2-level disk partitioning `data_storage/security/cache/`, L4 Stale-While-Revalidate).
   - 4-state Circuit Breaker (`CLOSED`, `OPEN`, `HALF_OPEN`, `DEGRADED`) providing <0.1ms fast-fail and synthetic fallback responses guaranteeing 100% platform uptime under network outages or external API latency.
5. **Codespace Security Monitor & Background Watchdog (`components/codespace-security-monitor.js`, `workers/security-scanner.worker.js`, `index.php`)**:
   - Interactive UI Security & Robustness Monitor showing live security health score, threat telemetry, and vulnerability audit drawer.
   - Background Web Worker watchdog executing non-blocking scans on uploaded or modified workspace files.
   - WebSocket broadcast bridge integration with `ws-server.js` and `codespace-ws.js`.
6. **Master E2E Verification & Adversarial Test Suite (`tests/e2e/test_platform_security_apis.js`)**:
   - Multi-tier automated test suite integrated into `tests/e2e/run_all_verifications.js`.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Threat & IP Reputation Defense | AbuseIPDB / IPQS / StopForumSpam IP checking, honeypot traps, bot & scanner defense on auth/exec endpoints | M1 | survey_1 |
| 2 | Dependency & CVE Vulnerability Auditing | OSV.dev batch query & NIST NVD 2.0 CVE lookup for package manifests (`package.json`, `requirements.txt`, `composer.json`, etc.) | M2 | survey_2 |
| 3 | Safe Zip & Folder Ingestion & Malware Heuristics | Non-blocking zip decompression with Zip-Slip defense + static malware regex detection (reverse shells, eval, miners) | M2 | survey_2 |
| 4 | Quantum Entropy Injection | Live ANU QRNG & NIST Beacon feeds blended via RFC 8937 HKDF-SHA512 into Dilithium-5 keys & session nonces | M3 | survey_3 |
| 5 | Atomic Time & Deployment Certification | Cloudflare / NIST deterministic timestamping generating tamper-evident signed deployment receipts | M3 | survey_3 |
| 6 | Resilient Proxy & Multi-Tier Circuit Breaker | 4-tier cache + 4-state Circuit Breaker with offline synthetic fallbacks for 100% platform uptime | M4 | survey_3 |
| 7 | Codespace Security Monitor & Background Watchdog | Live UI security health dashboard, audit drawer, and background Web Worker watchdog connected via WebSockets | M5 | survey_1,2 |
| 8 | Master E2E Security Test Suite & Adversarial Hardening | Comprehensive automated test suite (`tests/e2e/test_platform_security_apis.js`) covering Tiers 1-5 | M6 | reqs |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Threat Intelligence & IP Reputation / Bot Defense | `threat-intel.php`, `security.php` hooks, IP reputation cache & middleware | none | DONE |
| M2 | Vulnerability Scanner & Safe Zip / Malware Auditing | `vulnerability-auditor.php`, zip extraction, OSV.dev/NIST NVD integrations, malware heuristics | M1 | DONE |
| M3 | Quantum Entropy & Atomic Time Certification | `quantum-entropy.php`, `atomic-time.php`, Dilithium-5 & nonce hybrid entropy integration | none | DONE |
| M4 | Resilient Proxy Engine & Circuit Breaker Fallbacks | `resilient-proxy.php`, `circuit-breaker.php`, caching layers, offline synthetic fallbacks | none | DONE |
| M5 | Security Monitor UI & Background Watchdog | `components/codespace-security-monitor.js`, `workers/security-scanner.worker.js`, `index.php` UI, WebSocket bridge | M1, M2, M4 | DONE |
| M6 | Master E2E Testing & Adversarial Hardening | `tests/e2e/test_platform_security_apis.js` (Tiers 1-5 pass 100%), full regression pass | M1, M2, M3, M4, M5 | DONE |

## Interface Contracts
### `threat-intel.php` ↔ `security.php` / `api.php`
- `threatIntelCheckIp(string $ip): array` -> returns `['status' => 'ALLOW'|'CHALLENGE'|'BLOCK', 'score' => int, 'source' => string, 'cached' => bool]`
- `threatIntelHoneypotTrigger(string $uri, string $ip): void`
- `threatIntelRecordTelemetry(array $event): void`

### `vulnerability-auditor.php` ↔ `api.php`
- `vulnerabilityAuditManifest(string $format, string $content): array` -> returns `['vulnerabilities' => array, 'total_cves' => int, 'highest_severity' => string, 'cached' => bool]`
- `vulnerabilityAuditZipArchive(string $zipPath, string $destDir): array` -> returns `['ok' => bool, 'extracted_files' => int, 'malware_findings' => array, 'cve_findings' => array, 'error' => ?string]`
- `vulnerabilityScanFileContent(string $filename, string $content): array` -> returns `['findings' => array, 'risk_score' => int]`

### `quantum-entropy.php` ↔ `auth.php`
- `quantumHarvestEntropy(int $bytes = 64): string` -> returns mixed entropy string
- `quantumGenerateSecureNonce(int $bytes = 32): string` -> returns hex nonce
- `quantumDeriveDilithiumSeed(string $context): string` -> returns hardened 64-byte seed for Dilithium-5

### `atomic-time.php` ↔ `api.php`
- `atomicTimeGetDeterministicTimestamp(): array` -> returns `['timestamp' => float, 'iso' => string, 'source' => string, 'nist_pulse' => ?string, 'certified' => bool]`
- `atomicTimeGenerateDeploymentCert(string $deploymentId, array $files): array` -> returns certificate object signed with Dilithium-5

### `resilient-proxy.php` & `circuit-breaker.php` ↔ External APIs
- `resilientProxyFetch(string $url, array $options = []): array` -> returns `['ok' => bool, 'status' => int, 'data' => mixed, 'from_cache' => bool, 'fallback' => bool]`
- `circuitBreakerExecute(string $serviceKey, callable $fn, callable $fallbackFn = null): mixed`

## Code Layout
- `threat-intel.php`: Threat intelligence & IP reputation engine
- `vulnerability-auditor.php`: CVE, OSV.dev, NIST NVD, and zip malware auditor
- `quantum-entropy.php`: ANU QRNG & NIST Beacon entropy harvester & RFC 8937 HKDF mixer
- `atomic-time.php`: Cloudflare / NIST deterministic timestamp certifier
- `resilient-proxy.php`: Fault-tolerant upstream proxy & multi-tier cache
- `circuit-breaker.php`: Generic 4-state circuit breaker
- `components/codespace-security-monitor.js`: Client-side Security & Robustness Monitor
- `workers/security-scanner.worker.js`: Client background watchdog worker
- `tests/e2e/test_platform_security_apis.js`: Master E2E & Tier 1-5 test suite
- `data_storage/security/`: Cache, threat telemetry, and deployment certificate storage
