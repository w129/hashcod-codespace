# File Vault access-code UI upstream

The File Vault access-code window adapts the Animate UI Dialog motion pattern from:

- Repository: https://github.com/imskyleen/animate-ui
- Upstream commit used elsewhere in Hashcod Codespace: efeb96ffd7a3b7a4868667e4ac3c346620fb3044
- Component reference: apps/www/registry/primitives/base/dialog/index.tsx
- License: MIT

The Hashcod adaptation keeps the project's existing React 19 + motion/react
stack and exposes a promise-based setup/verification dialog to the File Vault
runtime. New files use a fixed uploader-chosen code; legacy files can still use
their stored TOTP key.

Downloads use the same animated dialog with a dedicated verification state, the
selected file name, keyboard focus containment, Escape/cancel handling and an
inert background. The user who downloads cannot generate or replace the
uploader's code in this state.

The root File Vault UI delegates every download to the verified POST endpoint,
including device copies of cloud files. The server uses the selected row's
hashed fixed code (or encrypted legacy TOTP key) and refuses GET downloads and
unprotected rows. Such files must be uploaded again with code protection; a new
code is never assigned during download.
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

New uploads ask the uploader to choose the file's access code directly in the
animated dialog. The code is accepted locally and sent with the upload; it is
never generated, replaced or sent back by the server. Download and deletion use
the same exact-code dialog and verify it server-side before touching the file.
Older records that still contain an authenticator key retain the legacy TOTP
verification path described below.

Windows packaging still includes the native Go verifier for legacy TOTP records,
placed under `tools/file-vault-totp/hashcod-file-vault-totp.exe` in the canonical
payload. CI exercises the fixed-code helper, legacy TOTP behavior, request
guards and the rendered dialog on both distributions. Cloud persistence still
requires the existing server-side Supabase configuration; a valid access code
does not imply that provider configuration or a complete upload succeeded.

The current File Vault setup uses a fixed uploader-chosen access code. The code
may contain letters, numbers, spaces or symbols and stays the same for that
file. The server stores only a per-file salted bcrypt hash of an HMAC digest;
the raw code is never returned in the file list. Download and deletion submit
the code through same-origin POST requests and verify it against the selected
file before reading or removing cloud data. Old records that contain the
previous authenticator key continue using their six-digit TOTP flow until they
are replaced by a new upload.

When the direct cloud transfer is unavailable, new uploads use the existing
device IndexedDB vault instead of discarding the selected file. The device
copy is AES-256-GCM encrypted using a key derived from the exact chosen code
with PBKDF2-SHA256 (310,000 iterations), a random salt, a random IV and the file
ID as authenticated context. The code, derived key and plaintext Blob are never
persisted. Metadata and ciphertext commit together in one transaction; quota
or transaction failures do not report success. Download decrypts with the code;
deletion verifies it before atomically removing both records. Older unprotected
local records continue to fail closed and must be uploaded again.

Fallback is limited to offline/transport failures and HTTP 408/502/503/504;
validation, authorization, size and rate-limit denials remain errors. The UI
labels fallback files as Device and states that cloud synchronization is
unavailable. Device copies live in this browser profile and are not available
on another device. Clearing site data removes them. Once cloud configuration
is present, new uploads retain the signed-direct route and server code guards.
