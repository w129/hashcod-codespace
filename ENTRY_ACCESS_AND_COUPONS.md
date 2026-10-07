# Entry access and coupons

The entry page never renders PHP examples or a first-use Mesh credential editor.
When `L8_CODE_ACCESS_REQUIRED=0`, entry remains open and no binding is claimed.
When enabled, the access island uses `HASHCOD-NUMERIC-SERIES/1`: the server
normalizes the established 9,865-row, 8-column credential, verifies its digest,
and issues a signed HttpOnly cookie scoped to its host and user agent. Both
server rendering and GET `/api/code-access` validate that proof. The client
confirms the cookie with GET after POST; reloads reuse the valid proof.
There is no separate GitHub Actions authentication path.

`L8_NUMERIC_SERIES_SHA256` optionally configures the private server-side verifier.
It must contain a lowercase SHA-256 digest. Without it, the existing verifier
is unchanged. Tests use an isolated runtime and a synthetic server configuration;
they do not change production credentials or introduce a browser bypass.

Coupons are issued and verified by `/api/hashcod-coupon` after the existing
platform-period check. Codes contain a CSPRNG nonce, a 30-day expiry and an HMAC.
The key stays on the server. `L8_COUPON_SIGNING_KEY` can provide a dedicated key;
otherwise existing configured secrets retain priority, with a domain-separated
derivation from the private persistent vault as a final fallback. A key which
cannot be persisted fails closed. Keep `data_storage/security` durable for a
local runtime; production may use a stable environment key. Changing signing
keys invalidates previously issued coupons.

The browser loads a coupon when Documents opens, verifies it before enabling
copy, displays its expiry, and offers retry after a failure. Issuance reuses a
valid coupon in the current server session. This is a service discount code;
redemption/payment processing is not implemented by this component.

Validation: `tests/e2e/test_entry_binding_coupon_browser.js` runs the actual PHP
controller under production security rules, including CSP, on phone and desktop.
It covers wrong credentials, persisted authorization, refusal of the retired
Mesh request, every FAQ answer, coupon issuance/reuse/expiry/tampering/copy,
retry, cross-origin denial and forged binding cookies. The mobile layout suite
also covers 320px, 390px, 430px, landscape, and desktop scrolling.

Canonical root sources are shared by Railway and the Windows desktop staging
process. Generated bundles remain build outputs. The desktop release workflow
must rebuild and refresh `desktop-latest` from the same merged source.

Caddy serves the actual UI at `/components/mldsa-access-gate.js`; it must not
rewrite that path to the bootstrap. The entry HTML explicitly loads the UI and
bootstrap as separate scripts for web/desktop parity. An enabled credential
gate owns authorization; the bootstrap waits for its verified-access event.
