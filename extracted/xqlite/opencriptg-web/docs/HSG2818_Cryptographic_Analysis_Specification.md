# HSG2818 Cryptographic Analysis Specification

Version: HCAS-1.0

HSG2818 is not claiming that visual analysis proves cryptographic security. The platform uses established primitives for generation and uses the Pivot Kernel lab as an audit layer for pattern detection, reproducibility and review.

## Mathematical Base

HSG2818 analysis depends on:

- Modular arithmetic: residues, modular inverses, congruences and prime fields.
- Number theory: primes, factorization difficulty, discrete logarithms and elliptic-curve concepts.
- Linear algebra: byte matrices, vectors, kernels, transforms and directional gradients.
- Probability and statistics: entropy, uniformity, variance, correlation and randomness tests.
- Computational complexity: practical distinction between easy, hard, exponential and attack-resistant problems.

## Input Model

1. The selected code, file-derived payload or manual text is encoded as UTF-8 bytes.
2. Bytes are mixed with a deterministic digest-derived salt before matrix mapping.
3. Mixed bytes are mapped into an `N x N` matrix.
4. If the payload is shorter than `N^2`, bytes wrap cyclically.
5. Samples below 16 bytes are marked `INVALID SAMPLE`.

## Pivot Kernel Formulas

- Entropy:
  `H = -sum(p_i * log2(p_i))` for byte values `0..255`.
- Circle-square delta:
  `avg(abs(mean(circle_kernel) - mean(square_kernel)))`.
- Ring delta:
  `avg(abs(mean(ring_kernel) - mean(circle_kernel)))`.
- Diagonal symmetry:
  `max(0, 100 - abs(diagonal_A_mean - diagonal_B_mean) / 255 * 100)`.
- Cloud score:
  `round(100 * clamp(intensity_extremity * 0.10 + smoothness * 0.30 + low_variance_patch * 0.46 + neighbor_repeat * 0.14))`.
- Clear byte ratio:
  `count(cloud_score <= 38) / matrix_cells`.
- Radar balance:
  `ascending_gradient_total / descending_gradient_total`.
- Band concentration:
  `max(top_peak_row_concentration, top_peak_column_concentration)`. Horizontal and vertical bands are both penalized.
- Pivot risk:
  `clamp(round((peak_score / 128) * 46 + (8 - entropy) * 7 + symmetry_penalty + cloud_penalty + balance_penalty + band_penalty), 0, 100)`.
- Critical verdict:
  `entropy < 2.5 OR risk >= 92 OR (clearRatio < 0.18 AND entropy < 4.5) OR (clearRatio < 0.18 AND peak_score > 9.0)`.

## Verdict Scale

| Verdict | Meaning |
| --- | --- |
| CLEAR | No strong pattern detected. This is not a formal proof of security. |
| WATCHLIST | Moderate signals; review source, length, format and randomness. |
| STRUCTURED / REVIEW | Marked structure detected; compare against expected format and standards. |
| HIGH RISK | Strong repetitive or structured signal. |
| CRITICAL | Very low entropy, risk >= 92, or low clear ratio combined with low entropy or strong peak score. |
| INVALID SAMPLE | Insufficient or corrupt sample. |

## Benchmark Battery

The platform includes a 100-sample benchmark in the Pivot Kernel lab:

- 10 repetitive samples.
- 10 weak password samples.
- 10 normal text samples.
- 10 UUID-like samples.
- 10 JWT-like samples.
- 10 SHA-256-like hex samples.
- 10 API-key-like samples.
- 10 CSPRNG-like Base64 samples.
- 10 structured JSON samples.
- 10 ZIP-like binary-header samples.

The benchmark compares expected verdicts against HSG2818 verdicts and exports JSON or CSV.

## External Standards

HSG2818 should be compared against:

- NIST Statistical Test Suite.
- Dieharder.
- TestU01.
- PractRand.
- Avalanche test.
- Chi-square test.
- Autocorrelation test.
- Bit frequency test.
- Serial test.
- Runs test.

The visual radar and kernel layers are support tools, not replacements for these suites.

## Implementation Security

Production HSG2818 must keep:

- HTTPS/TLS only.
- Secure cookies and server-side sessions.
- Input validation.
- No secrets in logs.
- Encryption at rest for sensitive data.
- Permission checks.
- XSS, CSRF, SQL injection and RCE protections.
- Safe file upload handling.
- Rate limiting.
- NPM dependency audit.
- Signed reports and versioned analysis.

## Honest Limits

HSG2818 must not claim:

- That a custom visual map proves cryptographic strength.
- That a new private algorithm is secure without public review.
- That generated codes replace standards like AES, SHA-3, BLAKE3, Kyber, Dilithium, SPHINCS+ or Falcon.

HSG2818 can claim:

- Reproducible analysis.
- Stronger documentation.
- Better comparison against known weak and strong samples.
- Clear warnings when structure, low entropy or suspicious patterns are detected.
