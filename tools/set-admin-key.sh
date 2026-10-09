#!/usr/bin/env bash
# Prints the SQL that registers the private-area admin key (SHA-256 hash only).
# The key is read from a hidden prompt (or generated) and is never written to disk or printed back.
# Usage: tools/set-admin-key.sh [--generate]
set -euo pipefail

if [ "${1:-}" = "--generate" ]; then
  KEY="$(openssl rand -base64 48)"
  echo "Nueva clave (guárdala ahora en tu gestor de contraseñas; no se vuelve a mostrar):" >&2
  printf '%s\n' "$KEY" >&2
else
  read -rsp "Clave del área privada: " KEY; echo >&2
  [ -n "$KEY" ] || { echo "La clave no puede estar vacía." >&2; exit 1; }
fi
# The server trims surrounding whitespace before hashing, so do the same here.
TRIMMED="$(printf '%s' "$KEY" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')"
HASH="$(printf '%s' "$TRIMMED" | sha256sum | cut -d' ' -f1)"
unset KEY TRIMMED
cat <<SQL
-- Ejecuta esto en el editor SQL de Supabase (cierra también las sesiones admin abiertas):
update hashcod_shared.tokenization_config
set admin_hash = '$HASH', revision = gen_random_uuid()
where id = 1;
SQL
