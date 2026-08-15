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

Los círculos del dock inferior abren un editor para apps **Python Streamlit** (alternativa usable a Tkinter en el navegador).
En Docker/Render la imagen incluye Python + Streamlit + pandas/numpy + Caddy:

- API: `/api/streamlit/*` (status, tools, templates, run, stop)
- Apps en vivo: `/st/{1-8}/` (reverse proxy con websockets)
- Plantillas: `streamlit_tools/` (calculadora, charts, notas)

Flujo: tocar slot → plantilla o código propio → **Guardar y abrir** / vista previa → ventana externa o iframe.
