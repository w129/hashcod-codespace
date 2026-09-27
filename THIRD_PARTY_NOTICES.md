# Third-Party Notices

## Mac Duo

Hashcod Codespace includes a browser-based page transition inspired by the visual model of **Mac Duo**.

- Project: Mac Duo
- Source: https://github.com/sumimakito/Mac-Duo
- Copyright: 2026 Makito
- Notice: Originally developed by Makito.
- License: Apache License 2.0

The Hashcod browser adaptation uses the same high-level visual principles described by Mac Duo—bottom-edge hinge perspective, recession, blur progression, and dimming progression—translated to standard web animation. It does not include the original macOS lid-angle sensor, ScreenCaptureKit, Metal renderer, or native application code.

## Spectrum UI

The ML-DSA-87 access card adapts the interaction and visual structure of Spectrum UI's `AccountAccessCard` component for Hashcod's post-quantum challenge/signature workflow.

- Project: Spectrum UI
- Source: https://github.com/arihantcodes/spectrum-ui
- Components: `AccountAccessCard`, `AnimatedCard`, and `AnimatedCardDemo`
- License: Apache License 2.0
- Modifications: the account card fields were replaced by ML-DSA-87 challenge/signature controls; the AnimatedCard stack was translated from React/Framer Motion into native HTML/CSS/JavaScript, with Tailwind CSS replaced by the user-provided Spotlight Code SVG/title/description, Next.js replaced by the user-provided Pit Barriers SVG/title/description, and the original Shadcn UI and Aceternity UI assets retained.

## pqcrypto

Hashcod uses pqcrypto as the server-side verifier for NIST FIPS 204 ML-DSA-87 signatures.

- Project: pqcrypto
- Source: https://github.com/backbone-hq/pqcrypto
- Version: 1.0.0
- License: Apache License 2.0

