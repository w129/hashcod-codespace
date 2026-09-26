# HSG2818 — servidor local

Este paquete deja el software listo para ejecutarse en un servidor local con Node.js.

## Ejecutar

1. Instala Node.js si no lo tienes.
2. Abre una terminal dentro de esta carpeta.
3. Ejecuta:

```bash
npm start
```

4. Abre en el navegador:

```text
http://127.0.0.1:2340
```

En Windows también puedes hacer doble clic en `INICIAR-WINDOWS.bat`.

## Cambiar puerto

PowerShell / CMD:

```bash
set PORT=5600 && npm start
```

Linux / macOS:

```bash
PORT=5600 npm start
```

## Correcciones incluidas

- Se añadió la carga de `app/security.js`, necesaria para el candado/vault del software.
- Se eliminó el bloqueo por hashes `integrity` en CDNs para evitar pantalla blanca si el CDN cambia la respuesta.
- Se agregó servidor local propio con Node.js, sin Express ni dependencias externas.
- Se agregó pantalla de carga/error para detectar fallos en vez de quedar en blanco.
- Se conservaron las carpetas `app/`, `data/`, el diseño original, el tour, el vault y el panel de ajustes.

## Nota importante

No abras `index.html` directamente con doble clic. Para que Web Crypto funcione correctamente, ejecútalo desde `localhost` con `npm start`.

## Menú superior funcional

El menú superior ahora funciona según cada nombre:

- File: nueva sesión, abrir sesión, guardar sesión, limpiar salida.
- Generate: generar valores, generar lotes de 10/100/500, copiar resultados.
- Export: exportar en Markdown, TXT, JSON y CSV.
- View: cambiar densidad, enfocar búsqueda, volver al resultado más nuevo, repetir tour.
- Help: abrir ayuda, atajos y explicación del sistema.

## SipHash + Mythos Gate v12 security update

This package includes the hardened HSG2818 entry layer:

- SipHash-2-4 64-bit access gate before the local vault flow.
- PBKDF2-SHA-512 with 1,250,000 iterations.
- Domain-separated KDF material for verifier and AES vault key.
- AES-256-GCM local vault sealing.
- 8-glyph Mythos pattern requirement.
- 8-digit TOTP-style HMAC-SHA-256 code.
- 6-digit nonce challenge before unlock.
- Progressive lockout after failed attempts.
- Temporary session seal stored in sessionStorage.
- Sanitized local audit log.

No entry system is mathematically impossible to break, but this version is hardened for local/offline use and avoids storing the master passphrase.
