#!/bin/sh
set -eu

echo "[l8] starting container…"

# Diagnóstico seguro: solo indica si existen las vars (no imprime valores)
for key in SUPABASE_URL SUPABASE_PUBLISHABLE_KEY SUPABASE_SECRET_KEY SUPABASE_STORAGE_BUCKET GITHUB_TOKEN ORIGINKIT_API_KEY RAILWAY_ENVIRONMENT_ID RAILWAY_PUBLIC_DOMAIN RAILWAY_PRIVATE_DOMAIN; do
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

if [ -d /etc/secrets ]; then
  echo "[l8] /etc/secrets present:"
  ls -1 /etc/secrets 2>/dev/null | sed 's/^/[l8]   secretfile /' || true
fi

mkdir -p /var/www/html/data_storage /var/www/html/uploads /var/www/html/data_storage/security /var/www/html/data_storage/auth /home/l8user/.ssh
touch /tmp/l8-php.log /tmp/l8-registration-cleanup.log
chmod 666 /tmp/l8-php.log /tmp/l8-registration-cleanup.log || true

if [ "$(id -u)" = "0" ]; then
  chown -R l8user:l8group /var/www/html/data_storage /var/www/html/uploads /home/l8user
  chmod 700 /var/www/html/data_storage/security /var/www/html/data_storage/auth /home/l8user/.ssh || true
fi

# Railway normally injects PORT. If a custom port was selected but PORT is not
# present, default Caddy to 8080 so the service matches Railway public routing.
if [ -z "${PORT:-}" ] && [ -n "${RAILWAY_ENVIRONMENT_ID:-}" ]; then
  export PORT=8080
else
  export PORT="${PORT:-8000}"
fi
echo "[l8] public PORT=${PORT}"

# El backend PHP es obligatorio. Arráncalo siempre antes del proceso principal,
# independientemente de cómo el PaaS reemplace el CMD de una imagen preconstruida.
if [ "${HASHCOD_SKIP_PHP_ROUTER:-0}" != "1" ] && [ -f /var/www/html/router.php ]; then
  php_router=/var/www/html/router.php
  if [ -n "${RAILWAY_ENVIRONMENT_ID:-}" ] && [ -f /var/www/html/railway-router.php ]; then
    php_router=/var/www/html/railway-router.php
  fi

  echo "[l8] starting PHP router on 127.0.0.1:8001 via ${php_router} (as l8user)"
  if [ "$(id -u)" = "0" ]; then
    gosu l8user php -S 127.0.0.1:8001 "$php_router" >/tmp/l8-php.log 2>&1 &
  else
    php -S 127.0.0.1:8001 "$php_router" >/tmp/l8-php.log 2>&1 &
  fi
  php_pid=$!
  echo "[l8] php pid=$php_pid"

  # Do not block startup waiting for PHP. Caddy must bind the public PORT
  # immediately; /healthz below is proxied to PHP and becomes healthy only when
  # the backend is actually ready.
  echo "[l8] PHP router launched; readiness delegated to Caddy /healthz"

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
