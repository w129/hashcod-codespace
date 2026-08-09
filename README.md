# Servidor Native PHP + React TypeScript (l8)

Servidor web nativo desarrollado con **PHP 8.1**, **React 18**, **TypeScript**, **HTML5** y un enrutador PHP nativo.

## 🚀 Despliegue en Render (render.com)

Para desplegar este proyecto en **Render**:

1. Crea una cuenta gratuita en [render.com](https://render.com).
2. Haz clic en **New +** -> **Web Service**.
3. Conecta tu repositorio de GitHub `l8`.
4. Render detectará automáticamente el archivo `Dockerfile` y `render.yaml`.
5. Haz clic en **Create Web Service**. ¡Listo! Tu servidor estará en vivo en pocos segundos.

## Persistencia con Supabase

El disco de Render es efímero. La plataforma usa **Supabase Storage** como fuente de verdad para:

- catálogo de repos (`meta/repos_index.json`)
- archivos globales (`meta/global_database_index.json` + `files/…`)
- sesión de UI (`meta/platform_session.json` — último comando / inspector)
- gateway (códigos y zips)

Configura en Render las variables de `.env.example`. Opcional: ejecuta `supabase/schema.sql` en el SQL Editor para espejo en Postgres.

## 💻 Ejecución Local

Doble clic en el archivo `run.bat` o desde la consola:

```bash
"D:\laragon\bin\php\php-8.1.10-Win32-vs16-x64\php.exe" -S localhost:8000 router.php
```

Abre [http://localhost:8000](http://localhost:8000) en tu navegador.
