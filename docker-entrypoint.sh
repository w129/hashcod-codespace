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

if [ -x /opt/l8-py/bin/python ]; then
  echo "[l8] python = $(/opt/l8-py/bin/python --version 2>&1 || echo present)"
else
  echo "[l8] python = MISSING"
fi

if [ -x /opt/l8-py/bin/streamlit ]; then
  echo "[l8] streamlit = $(/opt/l8-py/bin/streamlit --version 2>&1 | head -n1 || echo present)"
else
  echo "[l8] streamlit = MISSING"
fi

if command -v caddy >/dev/null 2>&1; then
  echo "[l8] caddy = $(caddy version 2>/dev/null | head -n1 || echo present)"
else
  echo "[l8] caddy = MISSING"
fi

if command -v agent-browser >/dev/null 2>&1; then
  echo "[l8] agent-browser = $(agent-browser --version 2>/dev/null | head -n1 || echo present)"
else
  echo "[l8] agent-browser = MISSING"
fi

# Secret files de Render (si se usaron en vez de Environment Variables)
if [ -d /etc/secrets ]; then
  echo "[l8] /etc/secrets present:"
  ls -1 /etc/secrets 2>/dev/null | sed 's/^/[l8]   secretfile /' || true
fi

# Inicializar directorios de persistencia con propiedad adecuada
mkdir -p /var/www/html/data_storage /var/www/html/uploads /var/www/html/data_storage/security /var/www/html/data_storage/auth /home/l8user/.ssh
touch /tmp/l8-php.log /tmp/l8-registration-cleanup.log
chmod 666 /tmp/l8-php.log /tmp/l8-registration-cleanup.log || true

if [ "$(id -u)" = "0" ]; then
  chown -R l8user:l8group /var/www/html/data_storage /var/www/html/uploads /home/l8user
  chmod 700 /var/www/html/data_storage/security /var/www/html/data_storage/auth /home/l8user/.ssh || true
fi

# Render inyecta PORT; Caddy escucha ahí y PHP queda interno.
# No ejecutar trabajo de red antes del servidor público: Render necesita que
# el health check pueda responder cuanto antes.
export PORT="${PORT:-8000}"
echo "[l8] public PORT=${PORT}"

# Si el CMD es caddy (producción Docker), levantar PHP interno primero.
first="${1-}"
if [ "$first" = "caddy" ] || [ "$first" = "/usr/local/bin/caddy" ]; then
  echo "[l8] starting PHP router on 127.0.0.1:8001 (as l8user)"
  if [ "$(id -u)" = "0" ]; then
    gosu l8user php -S 127.0.0.1:8001 /var/www/html/router.php >/tmp/l8-php.log 2>&1 &
  else
    php -S 127.0.0.1:8001 /var/www/html/router.php >/tmp/l8-php.log 2>&1 &
  fi
  echo "[l8] php pid=$!"

  # Purga idempotente del antiguo flujo de solicitudes persistidas.
  # Es mantenimiento best-effort: se retrasa ligeramente, corre en segundo
  # plano y tiene un límite total para no bloquear ni degradar el arranque.
  if [ -f /var/www/html/cleanup-platform-registration.php ]; then
    echo "[l8] scheduling non-blocking registration cleanup"
    (
      sleep 2
      if command -v timeout >/dev/null 2>&1; then
        if [ "$(id -u)" = "0" ]; then
          timeout 25s gosu l8user php /var/www/html/cleanup-platform-registration.php
        else
          timeout 25s php /var/www/html/cleanup-platform-registration.php
        fi
      else
        if [ "$(id -u)" = "0" ]; then
          gosu l8user php /var/www/html/cleanup-platform-registration.php
        else
          php /var/www/html/cleanup-platform-registration.php
        fi
      fi
    ) >/tmp/l8-registration-cleanup.log 2>&1 &
    echo "[l8] registration cleanup pid=$!"
  fi
fi

if [ "$(id -u)" = "0" ]; then
  exec gosu l8user "$@"
else
  exec "$@"
fi
