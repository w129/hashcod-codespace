# Entry checkout and free technical session

The old mandatory day-selection/renewal-key dialog has been replaced by a full-page checkout based on the supplied Checkout HTML reference. First-time visitors see the checkout. Existing active browser sessions resume normally; **Ver planes de Hashcod Pro**, below the workspace card, opens it again. **Entrar Gratis**, the back button and Escape enter/resume the free platform without choosing a duration or entering a renewal key.

The checkout offers Hashcod Pro at US$20 monthly or US$192 yearly (20% annual discount), billing country, an 11-digit formatted Dominican cédula and fiscal-receipt preference. All selections update the price summary and the draft message at `https://wa.me/18294721257`. The user must send the message in WhatsApp. An RD order requires 11 digits as a format check, not an identity check. Other-country orders exclude the cédula, including a previously typed value. Country is self-declared.

The cédula and six-digit code exist only in mounted React state: no local/session storage, cookies, server request or logging contains them. Leaving the checkout clears them. WhatsApp receives the order only if the user follows its link; its subsequent processing is outside platform storage. The privacy link remains accessible before entry. The six-digit payment field and verification button are visible for the next implementation phase. They explicitly report that automatic verification is not enabled. No arbitrary code, WhatsApp click, displayed total or client flag grants paid access. There is no automated payment processor or paid-entitlement activation in this change.

## Free session backend

`POST /api/platform-period` with `{ "entry": "free" }` calls `period.free` in the existing shared-cloud Edge Function. The PHP facade supplies only the identity from the signed, host-bound HttpOnly cookie; any client token, date, days, price, cédula, OTP or paid flag is ignored. Same-origin/Sec-Fetch checks, body bounds, threat/IP protection and rate limiting remain in force. Tokens never appear in browser-readable responses.

A free session uses a fixed **10-day technical deadline**, controlled by database time. This is no longer a user-selected duration or a paid subscription. An active session is reused without extending its deadline. An expired session is refreshed under the same signed identity, preserving ownership of editor sessions and requests. The conditional SQL upsert and reread handle concurrent tabs; per-identity free entry is limited to six requests per minute, in addition to the shared request limit. An already-entered client refreshes an expired session transparently during polling/visibility refresh instead of showing the old renewal gate. New/free session creation needs a connection; restored active sessions can continue their existing local behavior offline. Errors do not fabricate a session.

The workspace card still displays the current technical session; its alternatives remain inspection-only during active access. API guards still deny missing, malformed, forged or expired session cookies until the backend restores a valid session. Owner checks, account/admin authentication, per-file codes, BYOK consent/budgets, private runtime isolation and signed certificates are unchanged. Free entry does not grant administrator rights or a paid plan.

Legacy `period.accept` supports previously issued duration/key workflows for compatibility, with its existing validation and renewal-key verifier; the checkout does not call it. No migration, new secret or key rotation is required. Deploy all canonical sources in `supabase/functions/hashcod-shared-cloud` before publishing the PHP/UI change. The existing Edge Function retains its existing custom-authentication/JWT setting. The hosted platform and Windows installer package the same PHP and frontend sources.

## Verification

- `tests/e2e/test_checkout_access.cjs`: fixed server duration, stable identity, active reuse, expiration and concurrent free renewal, no paid grant, token validation, legacy renewal-key boundary and rate-limit contract.
- `tests/e2e/test_shared_cloud_proxy.js`: real PHP same-origin boundary, signed HttpOnly identity, no client-controlled identity/duration or personal checkout data forwarded, preserved guarded file APIs and free entry.
- `tests/security/test-platform-period.php`: missing/choose/malformed/forged/expired cookie rejection and direct-controller protections.
- `tests/e2e/test_platform_period.js`: initial failure/retry, hosted/loopback free entry, transparent session refresh, offline behavior and checkout reopening.
- `tests/e2e/test_platform_period_browser.js`: 1280px desktop and 390/320px phones, full scrollable form, monthly/yearly totals, country/fiscal/cédula selection, exact WhatsApp recipient/message (intercepted fixture, no message sent), OTP not granting access, no personal-data persistence, free entry/reload/back/Escape.

The original ZIP is a reference mockup, not an application dependency; vendor runtimes, inline handlers and external font requests from the export are not embedded into the product.
