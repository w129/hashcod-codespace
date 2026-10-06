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

Railway terminates HTTPS before Caddy's HTTP listener. Caddy replaces the private
`X-L8-Railway-Proto` header with the edge's `X-Forwarded-Proto`; PHP accepts it
only on loopback in a Railway environment (`RAILWAY_ENVIRONMENT_ID`). This keeps
the exact scheme/host origin checks working for upload, download and deletion,
while the desktop HTTP runtime continues to use its local origin. The production
image smoke test runs the actual Caddy configuration against PHP and covers
cross-origin rejection and forged private headers without touching stored files.

The Railway visitor IP uses Caddy's replacing `header_up` operation without a
second delete for the same field. Combining set and delete erases that field,
collapsing all visitors onto PHP loopback and sharing rate limits and bans. The
proxy test seeds bans for loopback and one visitor and verifies that unrelated
visitors still work while real visitor bans and private-header spoof checks hold.

Setup now checks the current authenticator code through the same-origin POST
`hashcod-file-vault-fast-upload.php?action=verify-totp` before closing the dialog.
An invalid code or network error leaves the exact setup key in place for retry;
cancel ignores a pending response. This check does not transfer bytes, sign an
upload URL or write metadata. Prepare independently verifies the code again.
The verifier still uses SHA-1, six digits, a 30-second period and one-period skew;
users must add the displayed key to their authenticator and enable automatic time.
Missing verification infrastructure returns 503 rather than claiming a bad code.

Windows packaging builds the same dialog and a native Go verifier, placed under
`tools/file-vault-totp/hashcod-file-vault-totp.exe` in the canonical payload.
Both controllers use that local binary on Windows and the existing Linux binary
in production. CI exercises the real helper and HTTP setup endpoint, wrong/expired
codes, guards and the rendered dialog on both distributions. Cloud persistence
still requires the existing server-side Supabase configuration; a valid setup
code does not imply that provider configuration or a complete upload succeeded.
