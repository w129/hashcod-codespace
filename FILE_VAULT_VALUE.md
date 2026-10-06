# File values in USD

Uploaders may assign an optional USD value in the existing file-code setup dialog. The coin button reveals the amount field. Blank is unassigned; zero is an explicit $0.00 value. Values use integer `priceUsdCents` (0–999999999) to preserve two decimal places. This metadata appears in File vault, Files, and the protected preview header.

The capture-phase Fast Upload route sends the value during prepare. Shared cloud stores it in `hashcod_shared.files.price_usd_cents`; retries must match the reserved value, and complete/list return it. Apply `supabase/migrations/20261006204512_file_usd_value.sql` before deploying the updated `hashcod-shared-cloud` Edge function. Existing records retain null and existing RLS/grants stay intact.

Legacy cloud paths bind the value into the signed upload ticket and `l8_files.meta.price_usd_cents`. Encrypted device fallback persists the value alongside file metadata, while the bytes remain encrypted and the uploader code is never stored in plaintext. The Windows package builds the same canonical source and uses these same routes.

This feature records and displays an uploader-assigned value. Preview, download, and deletion still require the uploader's exact file code.

Verification: amount/Edge tests, direct transfer, encrypted local protection, capture upload device flow, and Files explorer tests cover validation, reload/synchronization, both origin types and unchanged code enforcement.
