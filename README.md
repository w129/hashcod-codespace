# l8 codespace — plataforma servidor HTML nativo (PHP)

Servidor web nativo con **PHP 8.1**, HTML/CSS/JS en página completa (view-source real) y enrutador PHP. **No es una app Vite/React SPA**: la primera respuesta de `/` es HTML generado/servido por PHP.

## Despliegue en Render

1. Cuenta en [render.com](https://render.com).
2. **New + → Web Service** y conecta este repo.
3. Usa el `Dockerfile` / `render.yaml` (CMD: `php -S 0.0.0.0:8000 router.php`).
4. Configura las variables de `.env.example` (Supabase, etc.).

> Si el servicio está suspendido en Render, reactívalo: sin PHP en vivo las rutas `/api/*` y páginas como `/gateway` no pueden funcionar solo con GitHub Pages.

## Persistencia con Supabase

El disco de Render es efímero. La plataforma usa **Supabase Storage** como fuente de verdad para repos, archivos, sesión de UI y gateway. Opcional: `supabase/schema.sql`.

## Ejecución local

```bash
php -S localhost:8000 router.php
```

Abre [http://localhost:8000](http://localhost:8000) — el view-source debe mostrar `<!DOCTYPE html>` completo, no un `#root` vacío.

En Windows (Laragon) también puedes usar `run.bat`.

## Rutas HTML

| Ruta | Página |
|------|--------|
| `/` | plataforma principal (`index.php`) |
| `/gateway` | Gateway |
| `/ubuntu`, `/claude`, `/zylon`, `/prs-code`, `/macos`, `/chromeos` | CLIs / herramientas |

Rutas desconocidas hacen **soft-landing** al HTML principal (sin página 404 vacía ni shell Vite).
