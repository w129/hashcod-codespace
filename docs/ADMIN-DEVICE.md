# Acceso administrativo de la laptop

El servidor exige simultáneamente la credencial ES256 registrada por el propietario mediante Windows Hello y la IP 38.196.115.73. El registro público inicial no concede permisos ni permite reemplazar la clave fijada en admin-device.php.

La sesión dura diez minutos, usa cookie Secure/HttpOnly/SameSite=Strict y se invalida si cambia la IP o la credencial configurada. Los desafíos duran dos minutos y se consumen incluso cuando falla la verificación. Se comprueban origen, RP, firma, presencia, verificación del usuario y ausencia de flags de backup/sincronización. No se almacena PIN, huella ni clave privada.

## Alcance

Se comprueban en el servidor las rutas /api/admin/*, los cambios de clave activa Dilithium, listado/suspensión/reactivación/eliminación de cuentas y el POST verify_dilithium. Los lanzadores de validación de tarjetas y generación de firmas, y sus operaciones de interfaz, solicitan la sesión administrativa. La entrada de usuarios con tarjetas previamente validadas conserva su funcionamiento actual. Los registros de tarjeta siguen siendo datos del navegador; esta modificación no los convierte en certificaciones persistidas o firmadas por el servidor.

## Despliegue y recuperación

Este control está destinado al servicio Render indicado. Requiere RENDER=true y PHP detrás del Caddy local. Caddy sobrescribe X-L8-Render-Cf-Ip con CF-Connecting-IP recibido del ingreso Cloudflare de Render y elimina la antigua cabecera X-L8-Render-Xff. PHP solo acepta esa dirección individual desde 127.0.0.1 y con RENDER=true. No hay fallback a X-Forwarded-For: una prueba real confirmó que su prefijo puede venir del cliente. La prueba real también confirmó que intentar suministrar CF-Connecting-IP es rechazado en el borde. Referencias: https://developers.cloudflare.com/fundamentals/reference/http-headers/ y https://render.com/articles/how-render-handles-ddos-attacks.

Antes de considerar terminado el despliegue, probar con la laptop registrada y comprobar que otra IP no obtiene desafío ni accede a las rutas protegidas, incluso enviando cabeceras falsas. La verificación local no sustituye esa comprobación real de Windows Hello.

El almacenamiento efímero de Render puede cerrar sesiones al redesplegar; basta confirmar Windows Hello otra vez. Si cambia la IP o se pierde Windows Hello, el propietario debe actualizar explícitamente la configuración desde su acceso al repositorio. No existe una ruta web de autorregistro ni una clave de rescate que omita esta restricción.

## Pruebas

Ejecutar `php tests/security/test-admin-device.php`, `node tests/security/test-admin-device.cjs` y `node tests/e2e/test_crypto_card_validation_gate.js`. PHP requiere OpenSSL; en Windows puede necesitar OPENSSL_CONF apuntando al openssl.cnf de la distribución oficial.
