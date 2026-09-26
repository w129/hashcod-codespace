# Q+7LkMK05 Private Deployment

Use this checklist before treating the deployed platform as private.

## 1. Make the GitHub repository private

Open the repository settings in GitHub:

`Settings > General > Danger Zone > Change repository visibility > Make private`

Repository URL:

`https://github.com/w129/hashcod/settings`

## 2. Configure the Render private-entry key

Open the Render web service:

`Environment > Add Environment Variable`

Add:

```text
HASHCOD_PRIVATE_MODE=1
HASHCOD_PRIVATE_ENTRY_KEY=<a unique secret with at least 24 characters>
```

Do not commit the value of `HASHCOD_PRIVATE_ENTRY_KEY`. Do not paste it into
frontend code, documentation, screenshots, or chat messages.

After saving the variables, deploy the latest commit.

## 3. Rotate production secrets

Set unique production values for every server-side secret used by the
deployment, including:

```text
HASHCOD_SECRET
HASHCOD_PLATFORM_GATE_TOKEN_HASH
HASHCOD_PLATFORM_GATE_KEY_HASH
HASHCOD_ADMIN_PANEL_KEY_HASH
HASHCOD_SECURITY_KING_KEY_HASH
HASHCOD_SECURITY_KING_NONCE_HASH
HASHCOD_GATEWAY_PAIRING_KEY_HASH
```

## 4. Verify the result

Open the deployed URL in a private browser window. The server must redirect to:

```text
/private-entry
```

Before the correct private-entry key is accepted:

- application HTML is withheld;
- JSX, JavaScript, and image assets are withheld;
- API endpoints respond with `private_entry_required`.

After server validation, the browser receives an `HttpOnly`, `Secure`,
`SameSite=Lax` cookie for a four-hour private-entry session.

## Limit

A browser-based product can be made private, but not literally invisible after
authorized access: a permitted browser must receive frontend code to render the
interface. Keep sensitive algorithms, credentials, signing keys, and decisive
validation logic on the server.

