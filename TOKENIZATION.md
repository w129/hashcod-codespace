# File tokenization requests

The first toolbar action opens a file table using the supplied Beautiful UI
DiffTable layout. Sending a request asks for phone, email and the original file
code. The private RecordsTable-style queue requires its administrator key.
Requests stay **pending**; this feature submits files for review and does not
mint blockchain tokens or send email/SMS.

## Boundaries and persistence

- `/api/hashcod-tokenization` (and its guarded PHP alias) requires an active
  platform period, same-origin AJAX POST and rate limits.
- `hashcod-tokenization.php` launches `tools/tokenization/backend.py` through
  an argument-array process, with bounded JSON on stdin/stdout and a 30-second
  deadline. The worker uses pinned **psf/requests**, verified HTTPS, timeouts,
  no redirects, no ambient `.netrc`/proxy credentials and an action allowlist.
- The shared Supabase Edge function independently verifies the period token,
  uploader file code, contacts, administrator session and rate limits. Request
  metadata comes from the canonical file ledger. Retries are idempotent for
  the same file and access period. The uploader code is never stored in the queue.
- Contacts live only in `hashcod_shared.tokenization_requests`, with RLS enabled
  and no public/anonymous/authenticated grants. The public files/state index
  never returns these records. Only authenticated administrator list actions do.
- Administrator sessions last 15 minutes, use signed HttpOnly/SameSite=Strict,
  host-bound cookies, and are also checked in the Edge function. Browser-supplied
  period tokens or administrative tickets are ignored by PHP. Rotating the
  private verifier's revision invalidates existing Edge tickets.
- The existing workspace is anonymous and shared. Possession of the original
  file code authorizes submission; the platform does not pretend to know an
  account-based uploader identity. Files saved only on one device are shown but
  require successful cloud storage before they can be submitted for review.
- Deleting a source file keeps the request's metadata/contact snapshot, and the
  private queue labels the source as unavailable. Existing code-protected file
  preview/download/delete paths are unchanged.

## Deployment and Windows

Apply `supabase/migrations/*_tokenization_requests.sql`, then deploy the existing
`hashcod-shared-cloud` Edge function with the new tokenization modules. Preserve
its existing custom-auth/`verify_jwt=false` configuration. Privately provision row
`id=1` in `hashcod_shared.tokenization_config` with a SHA-256 administrator-key
verifier. Never commit or log the key or its verifier. Rotate through an operator
secret workflow and update `revision` with `gen_random_uuid()`; no browser config
or hosting dashboard is required.

The hosted image installs `tools/tokenization/requirements.txt` into `/opt/l8-py`.
Windows packages the same worker as `tools/tokenization/hashcod-tokenization.exe`
using pinned PyInstaller, including Requests and its CA bundle. The desktop
workflow tests the packaged executable, PHP facade, cookie security and React
UI before refreshing `desktop-latest` from main. An explicitly configured
`HASHCOD_TOKENIZATION_PYTHON` path can select another server Python interpreter;
this configuration is never accepted from browser input.

`HASHCOD_SHARED_CLOUD_URL` must be an HTTPS Supabase Edge endpoint. Loopback HTTP
is permitted only for isolated tests with both `APP_ENV=test` and
`HASHCOD_TOKENIZATION_ALLOW_TEST_HTTP=1`.

## Verification

- `python tests/security/test_tokenization_worker.py`
- `php tests/security/test-tokenization.php`
- `node tests/e2e/test_tokenization_proxy.js`
- `node tests/e2e/test_tokenization_edge.js`
- `node tests/e2e/test_tokenization_ui.js`
- `node tests/e2e/test_tokenization_browser.js`

UI tests need the built center bundle and jsdom; browser tests need Playwright
Chromium. The facade tests use an isolated loopback upstream and never touch
production contacts or files. Existing platform-period regressions also run.
