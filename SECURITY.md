# Seguridad — l8 codespace (backend)

La plataforma endurece el servidor PHP (no el cliente Vite). Resumen de controles.

## Capas

| Área | Implementación |
|------|----------------|
| **Rate limit** | `securityRateAllow` por bucket+IP (`data_storage/security/`). Global API 120/min + burst 40/10s. Buckets en auth, unlock, clone, upload, command, streamlit, gateway. |
| **IP limiting** | Ban temporal (`securityIpBan`) tras strikes de login/register/recover fallidos. |
| **Env / bóveda** | `.env` + `/etc/secrets/<KEY>` + bóveda AES-256-GCM (`secrets.php` → `vault.enc`). **Nunca** pegar claves Supabase en el código. |
| **CORS** | Deny-by-default. Allowlist exacta `L8_CORS_ORIGINS`. Sin `*`. Credentials solo si match. |
| **Input sanity** | `securityReadJsonBody`, `securitySanitizeString/Filename`, `securityValidateRepoSlug`, MIME denylist en upload. |
| **Validación server-side** | Auth Dilithium/AES/L8ID; mutaciones sensibles con `securityRequireMutationAuthIfEnabled`. |
| **RLS** | `supabase/schema.sql`: RLS ON + policies `USING (false)` para `anon`/`authenticated`. Solo **service_role** (backend) escribe. |
| **Encryption** | Hashcod secrets/codes at-rest AES-256-GCM (`secretsEncrypt`). Auth keys solo como HMAC. |
| **Sesiones separadas** | Cuenta: Bearer + cookie HttpOnly `l8_auth_session` (kind=account). Guest tokens: cookie `l8_tokens_guest` (nunca autentica cuenta). CSRF si solo cookie. |
| **Shell / infraestructura** | `/api/bash/*`, `/api/catalyst/*`, `/api/storage/*` y `/api/django/*` son exclusivamente administrativos; el escritorio usa su bridge token efímero. |
| **WebSocket** | Loopback por defecto. El modo remoto exige `WS_ALLOW_REMOTE=1`, `WS_SECRET` >= 32 caracteres y `WS_ALLOWED_ORIGINS`; el bridge HTTP siempre exige secreto. |
| **SSH GitHub** | `StrictHostKeyChecking=yes`; `known_hosts` se obtiene desde `api.github.com/meta` sobre TLS verificado y se cachea localmente. |

## Variables críticas (Render)

Fija al menos:

- `SUPABASE_URL`, `SUPABASE_SECRET_KEY` (no uses la publishable en el servidor para DB)
- `L8_AUTH_PEPPER`
- `L8_DILITHIUM5_REGISTER_KEY`
- `L8_VAULT_MASTER_KEY` (recomendado; si no, se genera local y se pierde en redeploy efímero)
- `L8_CORS_ORIGINS=https://<tu-servicio>.onrender.com` si hay front en otro origen
- `L8_REQUIRE_AUTH_MUTATIONS=1` (default)

## Aplicar RLS

Ejecuta de nuevo `supabase/schema.sql` en el SQL Editor (idempotente: drop/create policies).

## Notas

- El disco de Render es efímero: pepper, vault master y unlock seed deben vivir en env/Secret Files o Supabase.
- `L8_TRUST_PROXY=1` en Render; en PHP embebido local sin proxy usa `0`.
- Diagnósticos admin: `L8_ADMIN_DIAG_SECRET` + header `X-L8-Admin`.
- La CSP no permite `unsafe-eval`; no reintroducir evaluación dinámica de strings en código de navegador.
- Los errores 500 públicos son genéricos y se correlacionan por `request_id`; el detalle queda en logs del servidor.

