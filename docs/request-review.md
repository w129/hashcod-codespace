# Revisión privada de solicitudes

El segundo botón de Hatch abre el chat con el SVG proporcionado y la tarjeta de conversación de 288px. El usuario selecciona una solicitud de su sesión, acepta el procesamiento por Anthropic, fija un presupuesto y aporta su API key. La validación GET del modelo no genera una respuesta de IA. WhatsApp enlaza con DIKTATCART después de verificar un certificado válido.

## Autorización y persistencia

Este flujo utiliza los períodos de acceso firmados existentes. PHP toma el token exclusivamente de la cookie HttpOnly; el CSRF firmado vincula host, período y caducidad. El navegador no decide el propietario ni aporta tickets administrativos. El puente Edge verifica Ed25519, nonce y plazo; compara siempre período y solicitud/sesión. Otro navegador con un período distinto no recupera automáticamente estas solicitudes.

Las tablas privadas `hashcod_shared.review_*` y `certificates` tienen RLS, sin políticas cliente, y permisos revocados a `anon`, `authenticated` y `PUBLIC`. El cierre es intencional: solo el puente autenticado usa SQL parametrizado. Mensajes, comprobaciones sanitizadas, SHA-512, modelo y versión/fecha de consentimiento se guardan para seguimiento; claves API y contenido del archivo no se copian a esas tablas.

## Servicios en Railway

- `hashcod-review-backend`: `review-backend/Dockerfile`, UID 10001, 1GB/1CPU. HTTP a Anthropic, Supabase y el analizador privado; jamás ejecuta código subido. Variables `REVIEW_SIGNING_KEY` (semilla Ed25519 base64), `REVIEW_SANDBOX_PUBLIC_KEY`, `REVIEW_KEY_ENCRYPTION_KEY` (32 bytes base64), `REVIEW_EDGE_URL`, `REVIEW_SANDBOX_URL`, `PORT`.
- `hashcod-review-sandbox`: `sandbox-runner/Dockerfile`, UID dedicado 53217, 2GB/2CPU, sin dominio público. Solo `REVIEW_BACKEND_PUBLIC_KEY`, `REVIEW_ATTESTATION_KEY` (clave distinta de atestación) y `PORT`. Carece de credenciales de proveedor, base de datos y bóveda. Firmas de petición y resultado usan dominios separados y nonces vinculados al hash.
- Claves públicas en `review_keyring`; privadas fijas en Railway. No se distribuyen en PHP, JavaScript ni Windows. La rotación requiere nuevos identificadores del protocolo, despliegue coordinado y conservar públicas históricas para verificar certificados.

La clave del usuario se cifra con AES-256-GCM en memoria, derivada por sesión/propietario, con TTL de 30 minutos. Se elimina al terminar/cerrar y se limpian las entradas vencidas. Un reinicio pierde las claves temporales y exige otra revisión. Sonnet 5.5 y Opus 5.5 son los modelos permitidos; no se cambia automáticamente de proveedor. Antes de generar se reserva una estimación conservadora contra el presupuesto, incluso ante fallo de respuesta; no hay reintentos de pago automáticos.

## Aislamiento y alcance

Solo WebAssembly/WASI ejecuta código del usuario. Wasmtime usa la biblioteca C 49.0.2, verificada por SHA-256, con bindings Python 49.0.0 (ABI compatible de patch). CPython 3.14.7 y Javy 9.1.0 también tienen hashes fijados. La biblioteca estándar se precompila al construir con contenido upstream verificado; ese paso no recibe archivos del usuario.

VM: 256MiB, 2000M instrucciones, archivos de solo lectura, sin red o procesos host, salida descartada. Lanzador confiable: seccomp, CPU 20s, tiempo 30s, sin volcados, límites de archivos/fds/procesos y entorno limpio. Landlock añade protección cuando está disponible; WASI sigue siendo obligatorio en todos los kernels. Los analizadores reciben comandos/rutas fijos y no ejecutan el archivo fuera de WASI. El trabajador es no volcable para proteger su clave. El IPC anónimo de los analizadores está permitido; las conexiones de red se bloquean. Los runtimes nativos reservan grandes rangos virtuales, por eso tienen un límite de direcciones de 8GB, además del límite real del contenedor; la memoria del invitado permanece limitada a 256MiB.

Inicialmente: un archivo Python o JavaScript UTF-8, hasta 128KB de conversación (límite de snapshot 2MB). Bandit para Python, Semgrep local para JavaScript, gitleaks para secretos y lista de biblioteca estándar sin instalar paquetes. Python comprueba sintaxis y unittest incluidas en WASI. JavaScript comprueba sintaxis y arranque QuickJS/WASI. Paquetes externos y APIs de Node/navegador requieren revisión humana. Sin pruebas funcionales incluidas, el alcance se conserva en el certificado y no se declara una prueba funcional completa.

## Dictamen y certificados

Se exigen cinco comprobaciones completas y JSON de IA válido. Un crítico implica fallo; riesgo alto o cobertura incompleta requiere revisión humana. Sintaxis/pruebas fallidas impiden aprobar. La IA no puede emitir un certificado ni activar WhatsApp. Se vuelve a leer y comparar el archivo al finalizar y verificar. Un cambio, eliminación o revocación invalida el certificado.

Ed25519 firma JSON canónico: modelo, prompt, SHA-512, solicitud, sesión, nivel y comprobaciones. No contiene archivo ni contactos. Los endpoints públicos exactos son `/api/hashcod-review/verify?id=<uuid>` y `/api/hashcod-review/revoked`; las operaciones privadas mantienen autorización. El administrador consulta/revoca mediante su ticket existente; no puede seleccionar manualmente un estado certificado.

## Pruebas y despliegue

`python tests/security/test_reviews.py`, `php tests/security/test-review.php`, `node tests/e2e/test_review_edge.js`, `node tests/e2e/test_review_browser.cjs` y el contenedor ejecutando `tests/security/test_review_sandbox.py`. `Verify secure request review` prueba el trabajador sin red, sin capacidades y con límites. Las respuestas de proveedor se inyectan por constructor en pruebas; no existe un bypass de proveedor/autorización en producción.

Migraciones antes del módulo Edge; publicar trabajador y luego coordinador. El trabajador prueba las herramientas reales en Python/JavaScript antes de exponer salud; el coordinador exige que el trabajador privado esté disponible al arrancar. Los pools nativos y la afinidad de CPU están limitados. La configuración pública de OpenSSL y sus certificados raíz son de solo lectura; no se permite leer claves privadas SSL ni crear conexiones de red desde el analizador. PHP/frontend son los mismos en web y Windows. Las huellas de los assets evitan versiones anteriores. Publicar no realiza generaciones pagadas; una prueba con clave real y sus cargos se inicia por el usuario con consentimiento.
