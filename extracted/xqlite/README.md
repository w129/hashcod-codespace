# XQLite / OpenCriptG — código extraído

Extracción del ecosistema detrás de `D:\XQLite-Windows\XQLite`.

## Qué hay aquí

| Carpeta | Origen | Contenido |
|---------|--------|-----------|
| `opencriptg-web/` | `github.com/w129/hashcod` | Código fuente completo OpenCriptG/Hashcod (Node + React JSX): UI, vault, generators, catalog, server |
| `hashcod-did-web/` | `github.com/w129/hashcod-did-web` | Publicación did:web / `.cod` receipts |
| `windows-vendor/` | `D:\XQLite-Windows\XQLite\vendor\` | **Pendiente:** corre el script PowerShell abajo y pega/sube el zip |

## Equivalencia Windows ↔ Web

| XQLite Windows (`vendor/`) | Web (`opencriptg-web/`) |
|----------------------------|-------------------------|
| `opencriptg_ui.py` | `app/app.jsx`, `app/root.jsx`, `app/tour.jsx` |
| `opencriptg_vault.py` | `app/vault.jsx`, `app/security.js` |
| `opencriptg_security.py` | `app/security.js`, `app/enterprise.js` |
| `opencriptg_generators.py` | `data/generators.js` |
| `opencriptg_catalog.json` | `data/catalog.js` |
| `hashcod_form_builder.py` | formularios / CMD 619 en `app/` + `LEEME_FORMULARIO_*` |
| `xqlite.db` | almacenamiento local web (vault / DB interna) |
| `XQLite.exe` + `_internal/` | runtime PyInstaller (no es fuente) |

## Cómo completar el código Windows

En PowerShell (tu PC):

```powershell
powershell -ExecutionPolicy Bypass -File extract-xqlite-windows.ps1
```

Eso crea `D:\XQLite-Windows-SOURCE.zip` con:

- todos los `.py` de `vendor/`
- `assets/`
- `.env` **sin** secretos (solo keys redactadas) — o omítelo
- esquema SQLite de `xqlite.db`
- lista de archivos del paquete

Luego sube ese zip aquí o pega el contenido de los `.py`.

## Ejecutar la versión web (ya extraída)

```bash
cd opencriptg-web
npm start
# http://127.0.0.1:2340
```

## Nota

`XQLite.exe` está congelado con PyInstaller. El código de negocio legible en Windows está en `vendor/*.py`; el resto de `_internal/` es runtime (Python 3.14, Tk, crypto DLLs).
