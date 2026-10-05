# File Vault TOTP UI upstream

The File Vault TOTP window adapts the Animate UI Dialog motion pattern from:

- Repository: https://github.com/imskyleen/animate-ui
- Upstream commit used elsewhere in Hashcod Codespace: efeb96ffd7a3b7a4868667e4ac3c346620fb3044
- Component reference: apps/www/registry/primitives/base/dialog/index.tsx
- License: MIT

The Hashcod adaptation keeps the project's existing React 19 + motion/react
stack and exposes a promise-based TOTP setup/verification dialog to the File
Vault runtime.
