# Hashcod Codespace — Native Local Architecture

## Objective

The local edition of Hashcod Codespace is moving from an Electron + bundled PHP runtime to native clients implemented in Kotlin and Swift.

The hosted web application remains available and is not removed by this migration.

## Platform split

### Kotlin / Compose Multiplatform

Primary local client for:

- Windows 10/11 x64 and arm64
- Linux x64 and arm64
- Android

Toolchain baseline:

- Kotlin 2.4.20
- Compose Multiplatform 1.12.0
- JDK 21

Source root: `local-app/native-kotlin`

### Swift / SwiftUI

Primary Apple local client for:

- macOS
- iPhone
- iPad

Toolchain baseline:

- Swift 6 language mode
- CI validated with Swift 6.3.3 / Xcode 26.6
- Ready to move to Swift 6.4 / Xcode 27 when the GitHub macOS runner provides that toolchain
- SwiftUI
- Foundation / CryptoKit

Source root: `local-app/native-swift`

## Security invariants

The migration must not weaken the existing administrative controls.

1. CodeKey notebooks are data, not executable input. Native clients parse the `.ipynb` JSON and never execute its Python or notebook code.
2. EFT remains locked until the registered CodeKey is verified.
3. Native verification reproduces the current `CODEKEY1`, `JUPYTER1`, and `HASHCOD1` fingerprint scheme.
4. A successful local CodeKey unlock expires after 600 seconds.
5. Losing or expiring CodeKey authorization immediately removes access to EFT.
6. Hosted administrative APIs keep their server-side IP and session controls; local verification is not a replacement for hosted authorization.

## Native module map

The native navigation contract includes:

- Codes
- QR Vault
- Text Lab
- Disk Lab
- Markdown
- EFT
- p-andora
- Desk
- OSDG-rest
- Sync
- CodeKey

Each module must move its state, validation, file operations, and UI into Kotlin/Swift before the corresponding Electron implementation can be retired.

## Migration rule

`local-app/desktop` is a compatibility runtime during the migration. It must not receive new local-only product logic unless needed for a production regression fix. New local functionality should be implemented in `native-kotlin` and `native-swift` first.

Electron/PHP can be removed only after the native clients have equivalent authentication, persistence, sync, import/export, file handling, and editor behavior.

## Native parity contract

A module is considered native-parity complete only when both native implementations provide:

- the same user-visible operation,
- equivalent persisted state,
- equivalent validation and error handling,
- equivalent sync semantics where applicable,
- equivalent CodeKey restrictions for protected operations,
- import/export compatibility with existing Hashcod formats.

## Current native foundation

Implemented in this migration foundation:

- native application window and navigation,
- native module registry,
- native CodeKey file selection,
- native Jupyter JSON validation,
- native SHA-256 verification of CODEKEY1/JUPYTER1/HASHCOD1,
- ten-minute CodeKey session state,
- EFT lock/unlock behavior,
- native EFT editor surface,
- Windows/Linux packaging configuration for Kotlin,
- macOS Swift Package build,
- CI compilation for both native codebases.

The remaining product modules are represented in the native navigation and are migrated incrementally under the parity contract above.
