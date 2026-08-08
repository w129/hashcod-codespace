#!/bin/sh
set -eu

echo "[l8] starting container…"

# Diagnóstico seguro: solo indica si existen las vars (no imprime valores)
for key in SUPABASE_URL SUPABASE_PUBLISHABLE_KEY SUPABASE_SECRET_KEY SUPABASE_STORAGE_BUCKET GITHUB_TOKEN ORIGINKIT_API_KEY; do
  # shellcheck disable=SC2372
  eval "val=\${$key-}"
  if [ -n "$val" ]; then
    echo "[l8] env $key = SET (len=${#val})"
  else
    echo "[l8] env $key = MISSING"
  fi
done

if command -v bun >/dev/null 2>&1; then
  echo "[l8] bun = $(bun --version 2>/dev/null || echo present)"
else
  echo "[l8] bun = MISSING"
fi

# Secret files de Render (si se usaron en vez de Environment Variables)
if [ -d /etc/secrets ]; then
  echo "[l8] /etc/secrets present:"
  ls -1 /etc/secrets 2>/dev/null | sed 's/^/[l8]   secretfile /' || true
fi

exec "$@"
