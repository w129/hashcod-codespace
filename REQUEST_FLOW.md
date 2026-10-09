# Request flowchart (process of the visitor's requests)

`RequestFlowchart.tsx` (below the Toolbook) draws the visitor's tokenization requests as a flow: **Solicitud enviada → If/Else (which request, its state, certificate) → Resultado**. Cards drag, connectors follow, the request chip is a real dropdown, and the canvas adapts to the width and to light/dark.

## Data path

`GET /api/platform-requests` (`platform-requests-api.php`) → shared-cloud action `tokenization.mine` (`tokenization.ts`) → rows of `hashcod_shared.tokenization_requests` for the caller's signed period. Identity comes only from the signed `hashcod_platform_period_v1` cookie; the browser sends no id. The endpoint is read-only, same-origin, sits behind the platform-period and policy-consent guards, and answers with: request id, file name, status (`pending`, `in_progress`, `delayed`, `awaiting_payment`, `completed`), dates, certificate id and the monthly quota (limit fixed at 25). Contact data, file codes and admin fields never leave the server.

The UI (`my-requests.js`) refreshes every 20 s while the tab is visible, on focus, after policy acceptance and when a request is submitted (`hashcod:requests-changed`). Advisors change states in the private area; the visitor's chart follows on the next refresh.

## Deployment

No migration. Redeploy the edge function (new `mine` action): `npx supabase functions deploy hashcod-shared-cloud --project-ref azzzmfwoqcbvsfjvmqyz --no-verify-jwt`. Until then the card shows "No se pudo cargar tus solicitudes. Reintentando…" and nothing else is affected.
