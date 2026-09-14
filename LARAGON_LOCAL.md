# Hashcod Codespace — versión local en Laragon

Destino previsto:

```text
D:\laragon\www\Hashcod Codespace
```

## Instalación automática

El repositorio incluye:

- `laragon-install.bat` — lanzador de un clic.
- `laragon-install.ps1` — descarga/actualiza **todo el repositorio**, conserva `.env` y `data_storage`, prepara configuración local y verifica PHP.
- `ABRIR-HASHCOD-CODESPACE.bat` — se genera dentro de la instalación local.
- `SERVIDOR-PHP-8000.bat` — se genera dentro de la instalación local como alternativa al Apache de Laragon.

Ejecuta `laragon-install.bat` desde una copia del repositorio. El instalador sincroniza la rama `main` completa hacia `D:\laragon\www\Hashcod Codespace`.

Si Git está disponible, usa `git clone/fetch/reset`. Si no está disponible, descarga automáticamente el ZIP oficial de la rama `main` y lo extrae.

## Configuración local aplicada

El instalador crea/conserva `.env` y fuerza:

```env
L8_PUBLIC_BASE=/Hashcod%20Codespace
L8_TRUST_PROXY=0
L8_CORS_ORIGINS=
L8_REQUIRE_AUTH_MUTATIONS=1
```

También genera claves locales persistentes para:

```env
L8_AUTH_PEPPER=
L8_VAULT_MASTER_KEY=
L8_DATA_ENCRYPTION_KEY=
L8_TOKENS_UNLOCK_SEED=
```

Los secretos **no se suben a GitHub**.

## Supabase

Para tener la misma persistencia/sincronización que producción, configura en el `.env` local:

```env
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
SUPABASE_STORAGE_BUCKET=l8-storage
```

El instalador pregunta estas variables y las escribe únicamente en la PC local.

## Abrir la plataforma

Con Apache activo en Laragon:

```text
http://localhost/Hashcod%20Codespace/
```

Alternativa independiente de Apache:

```text
SERVIDOR-PHP-8000.bat
```

que abre:

```text
http://localhost:8000/
```

## Requisitos PHP

El proyecto está diseñado para PHP 8.1+. El instalador verifica las extensiones principales:

- `curl`
- `openssl`
- `mbstring`
- `fileinfo`
- `json`

Si alguna falta, actívala desde **Laragon → PHP → Extensions** y recarga Laragon.

## Actualizar la copia local

Vuelve a ejecutar `laragon-install.bat`. El script actualiza los archivos desde `main` y conserva `.env` y `data_storage` locales.
