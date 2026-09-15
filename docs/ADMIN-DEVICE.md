# Acceso administrativo con Hashcod CodeKey

El acceso administrativo ya no depende de Windows Hello. El servidor exige simultáneamente la red autorizada `38.196.115.0/24` y un notebook Jupyter `.ipynb` CodeKey registrado por el propietario.

El archivo CodeKey nunca se ejecuta. PHP lo recibe como JSON, valida su estructura, localiza exactamente una celda marcada con `metadata.hashcod_codekey=true`, normaliza las líneas y vuelve a calcular tres huellas: `CODEKEY1` para el código, `JUPYTER1` para la estructura Jupyter canónica y `HASHCOD1` para la combinación de ambas. También comprueba que las tres huellas almacenadas en la metadata del notebook coincidan con las calculadas y con los verificadores privados configurados en el servidor.

La sesión administrativa dura diez minutos, usa cookie HttpOnly/SameSite=Strict (Secure en la versión alojada) y se invalida si sale de la red autorizada, expira o cambia la CodeKey configurada. La versión de escritorio conserva el puente local de Electron como transporte confiable, pero también exige una sesión CodeKey válida antes de autorizar rutas administrativas.

## Secretos requeridos

No se guardan verificadores CodeKey en el repositorio. Deben configurarse como variables de entorno, Render Secret Files o mediante la bóveda de secretos existente:

- `HASHCOD_ADMIN_CODEKEY_FILENAME`
- `HASHCOD_ADMIN_CODEKEY_CODEKEY1`
- `HASHCOD_ADMIN_CODEKEY_JUPYTER1`
- `HASHCOD_ADMIN_CODEKEY_HASHCOD1`

Si falta cualquiera de estos valores o no tiene el formato esperado, `/api/admin-device/status` informa `configured=false` y el servidor no concede acceso administrativo.

## Formato esperado

El notebook debe usar `nbformat=4`, `nbformat_minor=5` y metadata Hashcod con:

```json
{
  "format": "HASHCOD-CODEKEY-IPYNB-1",
  "fingerprint_scheme": "HASHCOD-DUAL-FINGERPRINT-1",
  "access": "ADMIN",
  "scope": "PRIVATE",
  "version": "1",
  "codekey_fingerprint": "CODEKEY1:...",
  "jupyter_fingerprint": "JUPYTER1:...",
  "combined_fingerprint": "HASHCOD1:..."
}
```

`JUPYTER1` es una huella definida por Hashcod sobre una representación canónica compatible con Jupyter. No es una firma oficial emitida por Jupyter ni por Google Colab.

## Interfaz

El antiguo control visual de Windows Hello se mantiene en la misma ubicación para preservar el layout, pero ahora muestra el icono CodeKey y el texto `Increase the HVV`. Al pulsarlo se abre el selector de archivos `.ipynb`; el navegador valida únicamente formato/tamaño básico y el servidor realiza la verificación autoritativa.

La UI carga `components/admin-codekey-ui.js` como capa versionada para sustituir cualquier copia antigua del control que pueda seguir en caché. El motor de autorización continúa en `components/admin-device.js` y la verificación del servidor en `admin-device.php`.

## Alcance

Se comprueban en el servidor las rutas `/api/admin/*`, los cambios de clave activa Dilithium, listado/suspensión/reactivación/eliminación de cuentas y las demás rutas incluidas por `adminProtectedPath()`. La visibilidad de un botón nunca concede permisos por sí sola.

El endpoint WebAuthn `/api/admin-device/challenge` queda retirado y devuelve HTTP 410. `/api/admin-device/verify` acepta únicamente el nombre de archivo y la estructura JSON del notebook CodeKey; no ejecuta Python, JavaScript ni ninguna celda del archivo.

## Red y proxy

El servicio alojado sigue requiriendo `RENDER=true` y el flujo de IP confiable existente. Caddy sobrescribe `X-L8-Render-Cf-Ip` con la dirección del visitante recibida a través del ingreso Cloudflare/Render. PHP no usa `X-Forwarded-For` como fuente de autorización.

El propietario autorizó explícitamente el rango `38.196.115.0–38.196.115.255`. Una sesión CodeKey válida puede continuar dentro de ese rango durante sus diez minutos, pero salir del rango invalida la autorización.

## Pruebas

Ejecutar como mínimo:

```text
php -l admin-device.php
php tests/security/test-admin-device.php
node --check components/admin-device.js
node --check components/admin-codekey-ui.js
node tests/security/test-admin-device.cjs
node tests/e2e/test_crypto_card_validation_gate.js
```

Además debe hacerse una prueba real en producción: confirmar que el archivo CodeKey correcto abre Administración desde una IP autorizada, que un `.ipynb` alterado se rechaza y que una IP fuera del rango no obtiene acceso aunque presente el archivo correcto.

## Rotación

Para sustituir una CodeKey, generar un notebook nuevo y actualizar los cuatro secretos del servidor. No existe una ruta web para autorregistrar o sobrescribir la CodeKey. Cambiar los verificadores hace que las sesiones anteriores dejen de coincidir con la credencial administrativa configurada.
