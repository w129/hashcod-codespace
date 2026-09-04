# Project: Dilithium-5 Single-Use Key Rotation in Hashcod Codespace

## Architecture
The Dilithium-5 Post-Quantum Security Gate protects access to the cryptographic signature generator (`dilithiumGeneratorModal`) via a floating launcher button (`d5LauncherBtn`) and authentication modal (`dilithiumGateModal`).
This project upgrades the authentication model from a static passcode (`36276217`) to an autonomous, single-use key rotation engine with persistent state storage, immediate invalidation of burned keys, automatic scalar key generation on unlock, and clear visual presentation of the next active passcode ("La que toca") with one-click clipboard copying.

### Data Flow & State Lifecycle
1. **Initial Seed**: If `localStorage.getItem('l8_active_d5_gate_passcode')` is null, seed with base active key `'36276217'`.
2. **Gate Authentication**: User enters passcode in `#d5GatePasscodeInput` within `#dilithiumGateModal`.
3. **Validation & Burn**:
   - Check against consumed list (`l8_consumed_d5_gate_passcodes`). If consumed, reject with `"⚠️ Este código de seguridad ya fue consumido e invalidado. Acceso denegado."`.
   - Check against active key (`l8_active_d5_gate_passcode`). If mismatch, reject with `"⚠️ Código de seguridad incorrecto o expirado. Acceso denegado."`.
   - On match: immediately add key to `l8_consumed_d5_gate_passcodes` blacklist.
4. **Autonomous Key Generation**:
   - Derive next 8-digit passcode using post-quantum recurrence relation $R(b) = 7b^3 + 3b^2 - b + 1 \pmod{8380417}$ and cryptographic entropy.
   - Persist next active passcode to `localStorage` and `sessionStorage` under `l8_active_d5_gate_passcode`.
5. **Tool Unlocking & Visualizer Binding**:
   - Close `#dilithiumGateModal`, open `#dilithiumGeneratorModal`.
   - Update `#d5NextActivePasscodeVal` with the newly generated active key.
   - Display `#d5PasscodeConsumedBadge` ("Clave anterior consumida e invalidada ✓").
   - Automatically execute scalar multiplication for lattice signature rotation.
6. **Session Boundary**:
   - On closing `#dilithiumGeneratorModal`, reset `d5Unlocked = false`.
   - Subsequent access requires entering the newly generated active key.
7. **HTML Parity & Static Sync**:
   - In `index.php`, maintain exact `openDiv === closeDiv` (`Diff: 0`).
   - Run `scripts/sync_static_html.js` to synchronize `index.html` and `404.html`.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Single-Use Key Invalidation | Immediately burn entered passcode and reject on replay attempts | M2 | ORIGINAL_REQUEST §R1 |
| 2 | Autonomous Key Derivation | Auto-generate next 8-digit active Dilithium-5 key upon unlock | M2 | ORIGINAL_REQUEST §R1 |
| 3 | Single Valid Key Invariant | Only the newly generated key can unlock subsequent attempts | M2 | ORIGINAL_REQUEST §R1 |
| 4 | UI Visualizer Section | Display "Próxima Clave Dilithium-5 Activa (La que toca)" prominently | M2 | ORIGINAL_REQUEST §R2 |
| 5 | Active Key Display Field | Readonly monospace field `#d5NextActivePasscodeVal` showing active key | M2 | ORIGINAL_REQUEST §R2 |
| 6 | Copy Vector Button & Toast | Button `#btnCopyActiveD5Passcode` with toast confirmation | M2 | ORIGINAL_REQUEST §R2 |
| 7 | Consumed Status Badge | Badge `#d5PasscodeConsumedBadge` showing "Clave anterior consumida e invalidada ✓" | M2 | ORIGINAL_REQUEST §R2 |
| 8 | Persistent Storage Sync | Persist in `localStorage`/`sessionStorage` under `l8_active_d5_gate_passcode` | M2 | ORIGINAL_REQUEST §R3 |
| 9 | Default Key Initializer | Fallback to base active key `'36276217'` if storage is uninitialized | M2 | ORIGINAL_REQUEST §R3 |
| 10 | TDD Test Suite Creation | Pure Node.js test suite `tests/e2e/test_dilithium_key_rotation_tdd.js` covering 8 test suites | M1 | ORIGINAL_REQUEST §R4 |
| 11 | HTML DOM Tag Balance | Maintain strict `Diff: 0` (`openDiv === closeDiv`) across `index.php`, `index.html`, and `404.html` | M2, M3 | ORIGINAL_REQUEST §R4 |
| 12 | Syntax & Platform Regression | Zero errors in `node --check` and 100% pass on all existing platform test suites | M3 | ORIGINAL_REQUEST §R4 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | TDD Test Suite Creation | Create `tests/e2e/test_dilithium_key_rotation_tdd.js` implementing all 8 verification suites | none | DONE |
| M2 | Single-Use Rotation Engine & UI Visualizer | Implement key consumption, autonomous generation, persistence, UI visualizer in `index.php`, and sync to `index.html`/`404.html` | M1 | DONE |
| M3 | Full E2E Pass, Adversarial Verification & Audit | Execute all test suites, verify DOM tag balance (`Diff: 0`), adversarial stress test, and forensic audit | M2 | DONE |

## Interface Contracts
### Gate Authentication & Rotation
- `window.verifyDilithiumGateCode()`: Reads `#d5GatePasscodeInput`. Validates against `l8_active_d5_gate_passcode`. Burns used key to `l8_consumed_d5_gate_passcodes`. Generates new active key, updates `l8_active_d5_gate_passcode`. Unlocks `#dilithiumGeneratorModal`.
- `window.copyActiveDilithiumGatePasscode()`: Copies active passcode from `#d5NextActivePasscodeVal` to clipboard, triggers `window.showAdminToast()`.
- `window.updateActiveDilithiumPasscodeUI(passcode)`: Updates `#d5NextActivePasscodeVal` and displays `#d5PasscodeConsumedBadge`.
- `window.closeDilithiumGeneratorModal()`: Closes modal and resets `d5Unlocked = false`.

### Storage Keys
- `l8_active_d5_gate_passcode`: string (8 digits, defaults to `'36276217'`).
- `l8_consumed_d5_gate_passcodes`: JSON array of consumed string passcodes.

## Code Layout
- `index.php`: Main application template. Gate modal (lines 27702-27723), generator modal (lines 27552-27697), controller functions (lines 26154-26380).
- `index.html`: Synchronized static entry point.
- `404.html`: Synchronized static fallback.
- `scripts/sync_static_html.js`: Propagates changes from `index.php` to `index.html` and `404.html`.
- `scripts/verify_tag_balance.js`: Verifies `openDiv === closeDiv` (`Diff: 0`).
- `tests/e2e/test_dilithium_key_rotation_tdd.js`: Dedicated TDD unit and E2E test suite.
- `tests/e2e/run_all_verifications.js`: Master verification runner.

## Security & Hardening API Contracts
The platform implements resilient Public APIs and contracts:
- 	hreatIntelCheckIp: Threat reputation, Tor exit node, and bot IP check.
- ulnerabilityAuditManifest: Scans dependency manifests (npm/pip) against OSV and CVE feeds.
- quantumHarvestEntropy: Gathers quantum entropy from ANU and NIST Beacon for Dilithium-5 key generation and session nonces.
- tomicTimeGetDeterministicTimestamp: Deterministic timestamping for immutable deployment certificates.
- circuitBreakerExecute: Fault-tolerant circuit breaker proxy with SWR caching.

## Security & Hardening API Contracts
The platform implements resilient Public APIs and contracts:
- `threatIntelCheckIp`: Threat reputation, Tor exit node, and bot IP check.
- `vulnerabilityAuditManifest`: Scans dependency manifests (npm/pip) against OSV and CVE feeds.
- `quantumHarvestEntropy`: Gathers quantum entropy from ANU and NIST Beacon for Dilithium-5 key generation and session nonces.
- `atomicTimeGetDeterministicTimestamp`: Deterministic timestamping for immutable deployment certificates.
- `circuitBreakerExecute`: Fault-tolerant circuit breaker proxy with SWR caching.
