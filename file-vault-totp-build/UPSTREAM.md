# File Vault TOTP UI upstream

The File Vault TOTP window adapts the Animate UI Dialog motion pattern from:

- Repository: https://github.com/imskyleen/animate-ui
- Upstream commit used elsewhere in Hashcod Codespace: efeb96ffd7a3b7a4868667e4ac3c346620fb3044
- Component reference: apps/www/registry/primitives/base/dialog/index.tsx
- License: MIT

The Hashcod adaptation keeps the project's existing React 19 + motion/react
stack and exposes a promise-based TOTP setup/verification dialog to the File
Vault runtime.

Downloads use the same animated dialog with a dedicated verification state,
the selected file name, the uploader's current authenticator code, keyboard
focus containment, Escape/cancel handling and an inert background. The user
who downloads cannot generate or replace the uploader's key in this state.

The root File Vault UI delegates every download to the verified POST endpoint,
including device copies. The server uses the selected row's encrypted TOTP key
and refuses GET downloads and legacy rows without that key. Such files must be
uploaded again with TOTP protection; a new key is never assigned during download.
The browser bundle is rebuilt in Docker, and both it and the File Vault shell
have new cache versions. The shared source is also packaged for desktop; a real
Windows installer download verification remains a release check.

Deletion also requires that stored uploader key, even for local or legacy rows.
The current shell awaits a confirmed server deletion before removing its device
copy and row. The animated dialog never creates a replacement key during
deletion; cancel, wrong codes and provider failures leave local data intact.
Legacy shell buttons cannot use a delete bypass. Both downloads and deletion
share an action lock and same-origin POST guards. Cache versions are refreshed
for the shell and TOTP runtime; desktop packaging uses the same source.
