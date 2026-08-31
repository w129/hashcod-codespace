# l8 — Servidor Native PHP + React/TypeScript

Single-service native PHP app. The frontend (React 18 + TypeScript via in-browser Babel) lives in `index.php` / `index.html`; the backend command console + APIs live in `api.php`, with Supabase/GitHub/SQLite helpers in `supabase.php`. Routing is handled by `router.php` (root → `index.php`, `/api/*`, `/cmd`, `/json` → `api.php`, physical files served directly).

## Cursor Cloud specific instructions

- Runtime: PHP 8.3 CLI (repo requires `>=8.1`) with `curl`, `zip`, `sqlite3`/`pdo_sqlite`, `mbstring`, `zlib`, and `opcache`. These are installed in the environment; the update script only re-installs them if `php` is missing.
- There are **no Composer packages** to install — `composer.json` only declares a PHP version constraint (no `vendor/`, no lockfile). `composer` itself is not installed and is not needed.
- Run the dev server (matches the `Dockerfile` `CMD`), from the repo root:
  - `php -S 0.0.0.0:8000 router.php`
  - Then open `http://localhost:8000`. Do NOT use `run.bat` / `start_server.bat` (Windows/Laragon-specific, hardcoded `D:\laragon` path).
- `server.js` is a Node fallback for the same console UI, but it is **Windows-only** (uses `tasklist`) and is not the primary server. Prefer the PHP server on Linux.
- Lint: `php -l index.php` (repeat for `api.php`, `supabase.php`, `router.php`). There is no automated test suite in this repo.
- Core functionality = the command console. Send commands via `POST /api/command` (or `/cmd`) with JSON `{"command":"..."}`. Useful smoke commands: `ping`, `status`, `mane_list?`, `bigdata`. Full list comes from `mane_list?`.
- Supabase and GitHub are **optional**: without `SUPABASE_*` / `GITHUB_TOKEN` env vars (see `.env.example`), the app runs fine and reports `missing_env` / falls back to unauthenticated GitHub (low rate limit). Copy `.env.example` → `.env` only if you need those integrations.
- `data_storage/super_database.sqlite` (SQLite WAL) plus `uploads/` and `data_storage/repos/` are created at runtime and are gitignored. Deleting them is safe.
