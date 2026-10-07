# Seguridad — Hashcod Codespace

El sitio de producción se despliega en **Railway** desde `main`. El backend PHP aplica los controles; ocultar botones en el navegador no autoriza solicitudes.

## Variables de producción

Configura en el servicio de Railway y conserva entre despliegues:

- `L8_VAULT_MASTER_KEY`: clave aleatoria de al menos 32 bytes, preferentemente 64 caracteres hexadecimales. Protege la bóveda AES-256-GCM de `secrets.php`.
- `L8_ACCESS_GATE_COOKIE_SECRET`: firma las pruebas de acceso.
- `L8_COUPON_SIGNING_KEY`: firma los cupones emitidos por el servidor.
- Las variables existentes de autenticación (`L8_AUTH_PEPPER`, `L8_DILITHIUM5_REGISTER_KEY`) deben permanecer estables cuando se utiliza ese sistema.
- `SUPABASE_URL` y `SUPABASE_SECRET_KEY` para las integraciones configuradas. Las claves de servidor nunca se entregan al navegador.
- `L8_REQUIRE_AUTH_MUTATIONS=1`; `L8_CORS_ORIGINS` contiene únicamente orígenes exactos autorizados cuando existe un cliente en otro origen.

El entrypoint de Railway rechaza el arranque si falta cualquiera de las tres claves de bóveda/acceso/cupones o tiene menos de 32 caracteres. La bóveda también rechaza generar una clave efímera en Railway. La instalación local conserva su archivo privado de clave. Guarda una copia segura de la clave maestra: una clave nueva no recupera datos cifrados con una clave anterior perdida. No rotes claves de firma durante un despliegue normal; la rotación invalida las pruebas y cupones existentes.

## Datos de runtime

`data_storage/` está excluido de Git y de la imagen Docker. Índices, logs, sesiones, bóveda y configuración local se generan en ejecución. Usa almacenamiento persistente o el servicio de datos configurado para el estado que deba sobrevivir a un redeploy.

La revisión de los seis archivos anteriormente versionados encontró rutas locales, metadatos de 110 repositorios (sin registros marcados privados), identificadores KEY y cuatro tokens de estado Catalyst. No se detectaron claves privadas ni formatos reconocidos de tokens de proveedor en esos archivos. Esto no certifica todos los secretos del historial. Su retirada del índice **no elimina los commits antiguos**: trata los tokens de runtime expuestos como comprometidos y regenera el estado que los use. Cualquier limpieza del historial requiere una operación coordinada; no se hace force-push automáticamente.

## Ejecución de comandos

Las familias Bash, Catalyst, storage, Django, Ubuntu, Claude, Zylon, macOS, ChromeOS, Streamlit, agent-browser, LibreOffice, SSH, CLI y OriginKit requieren autorización administrativa tanto en su ruta base como en sus subrutas. Los alias de comandos que acceden al host y las rutas de clonación también están protegidos. `/api/command` exige primero una sesión de cuenta real; una cookie de invitado o un header AJAX no autentican una cuenta.

`execution-security.php` reemplaza la ejecución libre mediante `bash -lc` y los fallbacks de shell. Acepta una gramática finita de comandos de lectura: `pwd`, `whoami`, `date`, `uname`, `ls`, `cat`, `head`, `tail`, `wc`, `stat`, `du`, `df`, `echo`, con opciones explícitas. Rechaza intérpretes, operadores de shell, variables, cadenas, rutas fuera del workspace y enlaces simbólicos que salgan de él.

En Linux sin privilegios usa argv sin shell, Bubblewrap con todos los namespaces separados, sin red ni capacidades, entorno limpio y workspace de solo lectura. No monta el código del servidor, la bóveda ni el directorio de usuario. Limita tiempo a 5 segundos, CPU a 2 segundos, memoria a 128 MiB, procesos a 16 y salida a 64 KiB. Si el kernel o el host no permiten el aislamiento, devuelve `isolation_required` y no ejecuta en el host. Windows tiene esa misma respuesta segura hasta disponer de un ejecutor dedicado.

Streamlit (código Python subido), agent-browser, prompts del CLI Claude y descarga/ejecución de OriginKit quedan bloqueados con `isolation_required` hasta conectarlos a un worker aislado. No se instala código remoto desde una petición web. Los helpers fijos de criptografía y los metadatos Git no son un shell de usuario y mantienen sus validaciones y controles de acceso.

## CSP y navegador

- La ruta pública especial de Railway y la entrada local aplican los headers de seguridad antes de renderizar. La excepción de reputación de la portada no omite la CSP.
- `script-src-attr 'none'`: los controles nativos y sus plantillas dinámicas usan `addEventListener`. Los argumentos son JSON, nunca código evaluado.
- Los scripts y estilos embebidos reciben un nonce por respuesta. Los estilos creados por los componentes heredan ese nonce.
- `connect-src` contiene `'self'`, los proveedores específicos utilizados (Turnstile, jsDelivr, GitHub y las APIs del mapa) y únicamente los orígenes HTTPS/WSS de Supabase configurados y el dominio de almacenamiento de ese proyecto. No incluye comodines `https:` ni `wss:`.
- Las imágenes externas están restringidas a los orígenes explícitos de avatares GitHub, Unsplash, Icons8 y el proyecto Supabase configurado.
- **Excepción pendiente:** `style-src-attr 'unsafe-inline'` permite las numerosas propiedades de layout y animación existentes. Los bloques `<style>` ya no tienen esa excepción. Eliminarla por completo requiere migrar los atributos de estilo y las librerías de animación a clases/hojas de estilos.

## Otros controles

CORS rechaza orígenes no autorizados; mutaciones con cookie requieren CSRF después de validar la cuenta. Hay límites de tasa e IP, lectura JSON acotada, validación de nombres/rutas/MIME y cifrado de datos sensibles. Supabase mantiene RLS en `supabase/schema.sql`; este cambio no modifica el esquema ni las políticas. WebSocket exige secreto estable y orígenes exactos; retransmite eventos y no ejecuta comandos.

## Verificación

CI comprueba sintaxis, límites del ejecutor, escapes de rutas, origen CSP, nonce HTML y autorización administrativa. Chromium verifica listeners estáticos/dinámicos y bloqueo de atributos inline inyectados. Las pruebas de entrada móvil/escritorio comprueban rechazo de rutas host sin autorización, binding real, FAQ y cupones firmados. El despliegue debe comprobar los headers públicos y la presencia de los assets del último commit antes de declararse actualizado.
