# l8 codespace — plataforma servidor HTML nativo (PHP)

Servidor web nativo con **PHP 8.1**, HTML/CSS/JS en página completa (view-source real) y enrutador PHP. **No es una app Vite/React SPA**: la primera respuesta de `/` es HTML generado/servido por PHP.

## Despliegue en Render

1. Cuenta en [render.com](https://render.com).
2. **New + → Web Service** y conecta este repo.
3. Usa el `Dockerfile` / `render.yaml` (CMD: `php -S 0.0.0.0:8000 router.php`).
4. Configura las variables de `.env.example` (Supabase, etc.).

> Si el servicio está suspendido en Render, reactívalo: sin PHP en vivo las rutas `/api/*` y páginas como `/gateway` no pueden funcionar solo con GitHub Pages.

## Persistencia con Supabase

El disco de Render es efímero. La plataforma usa **Supabase Storage** como fuente de verdad para repos, archivos, sesión de UI y gateway. Opcional: `supabase/schema.sql` (incluye **RLS** deny-all para anon/authenticated; el backend usa service role).

## Seguridad (backend)

Rate limit + IP bans, CORS allowlist, validación de input, mutaciones con sesión de cuenta, bóveda de secretos (env + `/etc/secrets` + `vault.enc`), cifrado AES-GCM de Hashcod, cookies HttpOnly de sesión separadas del guest. Detalle: [SECURITY.md](SECURITY.md) y `.env.example`.

## Ejecución local

```bash
php -S localhost:8000 router.php
```

Abre [http://localhost:8000](http://localhost:8000) — el view-source debe mostrar `<!DOCTYPE html>` completo, no un `#root` vacío.

En Windows (Laragon) también puedes usar `run.bat`.

## Herramientas Streamlit (dock inferior)

Los círculos del dock inferior abren apps **Python Streamlit**. El **proyecto único** de la plataforma es **SoroOtbedit** (slot 1):

- Pestañas de documentos (inspirado en otbedit)
- Columnas de texto alineadas (inspirado en SoroEditor)
- Abrir / guardar proyecto `.cep.json`

En Docker/Render la imagen incluye Python + Streamlit + Caddy:

- API: `/api/streamlit/*` (status, tools, templates, run, stop)
- App en vivo: `/st/1/` (y slots 2–8 libres)
- Código: `streamlit_tools/soro_otbedit.py`

Flujo: tocar slot 1 → **Guardar y abrir** / vista previa → `/st/1/`.

## Clone de repos (incl. LibreOffice)

Además de `owner/repo` de GitHub, el comando `clone` acepta URLs git HTTP(S):

```text
clone http://anongit.freedesktop.org/git/libreoffice/core.git
```

LibreOffice (MPL-2.0) queda en `data_storage/repos/libreoffice-core`. El mirror anongit a veces rechaza shallow clone; la plataforma usa el mirror `https://github.com/LibreOffice/core.git` (mismo código) y registra también el remote FreeDesktop.

## Authors, Branding & Open Source Credits

* **Original Warp Terminal Base**: Copyright (C) 2020-2026 Denver Technologies, Inc. (Licensed under [GNU AGPL-3.0](https://github.com/warpdotdev/warp.git)).
* **Modifications, Block Terminal & Platform Extensions**: Copyright (C) 2026 DIKTATCART / Hashcod.
* **Platform Brand & Ownership**:
  - **Hashcod** (`Hashcod Codespace`) es la plataforma y marca registrada propietaria.
  - **DIKTATCART** es la empresa creadora y titular de la custodia técnica, arquitectura y seguridad post-cuántica (PQC).
* **Alcance de la Licencia**: La licencia de código abierto **GNU AGPL v3.0** aplica **estrictamente y de forma exclusiva al módulo de celdas/bloques de terminal de Warp** (`components/warp-blocks.js`, `components/warp-blocks.css` y su renderizado en `index.php`). El resto de la plataforma, el motor de seguridad post-cuántica Dilithium-5/SPHINCS+, la infraestructura de certificación y los activos de marca pertenecen a DIKTATCART / Hashcod.
* **Disponibilidad de Código en Red (AGPL-3.0 Section 13)**: Los usuarios pueden inspeccionar y descargar el código fuente del componente de bloques mediante el botón visible `⚡ Warp Blocks AGPLv3` presente en la interfaz de la terminal o en [LICENSE-WARP.md](LICENSE-WARP.md).

