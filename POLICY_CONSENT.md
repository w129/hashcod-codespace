# Use and Privacy Policy acceptance

Nothing on the platform works until the visitor ticks the checkbox in the footer.

## Behaviour

- `PolicyConsent.jsx` (Animate UI checkbox) is mounted in `#d5PolicyConsentMount`. While unaccepted, `policy-consent.js` marks every other `<body>` child `inert` and dims the page; only the footer stays usable.
- Ticking posts `{accept:true, version}` to `/api/policy-consent` (`policy-consent-api.php`). The server stores one row in `hashcod_shared.policy_consents` (through the `policy.consent` shared-cloud action) and only then sets the signed, HttpOnly, SameSite=Strict cookie `hashcod_policy_consent_v1` (400 days, the browser maximum). If the evidence cannot be stored there is no cookie: the platform stays locked (fail closed).
- Enforcement is server-side: `platformPeriodGuard()` (every guarded API) and the free/paid entry POST of `/api/platform-period` answer `403 policy_consent_required` without a valid cookie. The checkbox is one-way: once accepted it is disabled and there is no withdraw endpoint.
- Changing `POLICY_CONSENT_VERSION` in `policy-consent-lib.php` invalidates every cookie and asks everyone to accept again.

## Evidence and its limits

`hashcod_shared.policy_consents` is append-only (update/delete/truncate triggers raise an error; RLS on, no API role has access). It keeps the policy version, UTC timestamp, host, an HMAC of the client address and a hash of the user agent; no raw IP or user-agent text. A browser cookie can always be cleared by its owner, so the durable proof is the server record; a visitor without the cookie must accept again and a new row is appended. A database administrator with direct access can still bypass the triggers; protect that role accordingly.

## Deployment order (manual)

1. Apply `supabase/migrations/20261009130000_policy_consent_evidence.sql`.
2. Deploy the `hashcod-shared-cloud` edge function (new `consent.ts`, `policy.consent` route).
3. Deploy the PHP/Railway build. Deploying PHP first locks every visitor out until steps 1-2 are done.

Desktop edition: the loopback runtime uses the same PHP and reaches the same cloud action through `hashcodDesktopCloudOrigin()`; acceptance needs that cloud connection.
