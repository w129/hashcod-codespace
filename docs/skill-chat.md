# Editor de roles y skills — slot 3

El tercer botón abre un editor por comandos con árbol de archivos, conversación y vista editable. Usa el compositor del diseño suministrado, con menús de comandos y archivos reales. En móvil, las tres áreas se muestran mediante pestañas. El mismo componente y la misma fachada PHP se incluyen en la aplicación Windows.

## Datos y acceso

`center-empty-state-build/SkillChat.jsx` llama exclusivamente a `/api/skill-chat/*`. `hashcod-skill-chat.php` valida el período firmado, el origen y la protección CSRF; mantiene los JWT y tokens de renovación en cookies HttpOnly, SameSite Strict, ligadas al período y al host. Los clientes no reciben las credenciales de infraestructura.

La API Fastify, en `skill-chat/apps/api`, verifica el período con la función Supabase `editor.identity`, mediante una prueba Ed25519 separada de las firmas del chat de revisión. Las pruebas tienen fecha, nonce de un solo uso y firma del backend. La función consulta el registro de períodos vigente; nunca acepta un propietario enviado por el navegador. El JWT dura hasta 15 minutos, la renovación hasta 7 días y siempre queda limitada por el vencimiento del período. Se revalida el período durante el uso. Los proyectos pertenecen al identificador del período de acceso: no representan una cuenta personal verificada y no se transfieren automáticamente al seleccionar otro período.

PostgreSQL/Prisma guarda proyectos, archivos, mensajes, versiones y publicaciones. Redis mantiene sesiones, bloqueos, colas BullMQ y claves de IA cifradas temporales. La API comprueba propiedad y revisión antes de modificar un proyecto; una pestaña desactualizada recibe un conflicto en vez de sobrescribir cambios. El WebSocket utiliza una autorización de un solo uso ligada al propietario, sesión y origen. Hay consulta periódica como alternativa.

`/publish` prepara una copia congelada de **todos** los archivos del proyecto, y `/yes` la publica en el catálogo. Los cambios privados posteriores no la modifican. `/unpublish` retira las publicaciones del proyecto propio. Importar desde el catálogo crea una copia privada. Nunca publicar contenido personal, claves ni archivos cuyo uso no esté autorizado.

## Comandos y archivos

`skill-chat/packages/core` contiene el modelo tipado, parser, registro Zod de comandos, historial, validaciones, importación y generadores. `/help` enumera la sintaxis efectiva. Incluye creación y organización de archivos, metadatos de roles/skills, bloques de contenido, versiones, deshacer/rehacer, importación, exportación, publicación, compilación y pruebas.

Ejemplo de skill:

```text
/skill sumar-importes
/desc Suma dos importes numéricos.
/trigger sumar importes
/tool sumar
/param a:number!
/param b:number!
/code coffee
{total: args.a + args.b}
/build
/run sumar coffee {"a":2,"b":3}
/save
/export zip
```

El comando `/code` admite varias líneas: Enter añade una línea y Ctrl+Enter envía. Para los comandos simples, Enter envía. El botón `+` añade archivos UTF-8 sin reemplazar el proyecto. `/import <archivo>` interpreta expresamente un documento Markdown/YAML propio como paquete. El selector cambia el archivo activo y la vista permite guardar cambios con control de revisión.

Los generadores producen `SKILL.md`, `role.yaml` y herramientas en `scripts/*.coffee` o `scripts/*.dart`. Los nombres y metadatos se validan y escapan para cada formato. No se aceptan rutas absolutas, segmentos de recorrido, claves de prototipo ni importaciones desde URLs o rutas del servidor. Los archivos se limitan a 1 MiB UTF-8, 200 archivos y 16 MiB por proyecto. Los historiales y las cuotas de proyectos, sesiones y trabajos también están limitados.

## Ejecución aislada

La API no evalúa ni ejecuta el código del usuario. Envía trabajos firmados HMAC al servicio **privado** `hashcod-skill-worker.railway.internal:8080`. El worker comprueba firma, fecha, nonce, estructura y límites antes de crear un directorio temporal por trabajo.

`skill-chat/apps/worker` ejecuta compiladores reales de CoffeeScript/Node y Dart. El lanzador Linux exige UID dedicado sin privilegios, `no_new_privs`, Landlock ABI 3 o superior y seccomp. Impide red, acceso al backend y los secretos, ejecución de shell, inspección de memoria y señalización de otros procesos. Solo admite el mapa y los contadores de memoria del propio proceso que glibc y Dart necesitan; los demás datos de proc permanecen bloqueados. Antes de ejecutar código de usuario, un segundo filtro seccomp impide cualquier nuevo execve, incluso mediante el cargador ELF. Solo habilita los archivos del trabajo y los runtimes necesarios. La entrada es de lectura, la salida temporal está separada y se elimina al terminar.

El supervisor impone tiempo, procesos, salida y memoria residente agregada; mata el grupo completo si se supera un límite. V8 utiliza `--jitless` y un heap limitado. Los runtimes nativos necesitan reservas de espacio virtual mayores que su memoria residente: no confundir el límite de direcciones virtuales con el de RAM. Los límites y sus pruebas están en el código del worker. El servicio ejecuta pruebas reales de aislamiento al arrancar y **no está disponible** si el kernel no ofrece las garantías exigidas. No existe alternativa que ejecute código sin aislamiento.

## IA opcional y presupuesto

Solo `/test` utiliza Anthropic. El usuario configura su propia API key, un modelo permitido, consentimiento y presupuesto. La clave se valida con la consulta de modelo, se cifra con AES-256-GCM y caduca en Redis a los 30 minutos; se puede eliminar desde la configuración. No se añade a archivos, historial, trabajos ni prompts. Cada llamada reserva un límite conservador de gasto antes de enviarse; los bucles y las herramientas tienen límites. Las herramientas declaradas se ejecutan exclusivamente en el worker aislado. Los roles resuelven skills adjuntos mediante publicaciones congeladas, sin rutas externas.

Las pruebas automatizadas usan credenciales sintéticas y un proveedor simulado. No hacen llamadas pagadas con claves de usuarios. Las pruebas de compiladores y aislamiento sí ejecutan los runtimes reales.

## Configuración y despliegue

La infraestructura del editor se separa del backend del chat de revisión. PostgreSQL y Redis no necesitan dominios ni proxies TCP públicos. La API tiene un dominio HTTPS; el worker carece de dominio público. Configurar las variables antes de conectar la fuente:

| Variable de API | Contenido |
| --- | --- |
| `DATABASE_URL` | Referencia privada `${{Postgres.DATABASE_URL}}` |
| `REDIS_URL` | Referencia privada `${{Redis.REDIS_URL}}` |
| `SKILL_CHAT_JWT_SECRET` | Aleatoriedad estable, al menos 32 caracteres |
| `SKILL_CHAT_KEY_ENCRYPTION_KEY` | 32 bytes aleatorios en base64 |
| `SKILL_CHAT_BRIDGE_PRIVATE_KEY` | Clave Ed25519 PKCS8 DER en base64 |
| `SKILL_CHAT_WORKER_SECRET` | HMAC aleatorio estable, compartido únicamente con el worker |
| `SKILL_CHAT_EDGE_URL` | Función fija `hashcod-shared-cloud?action=editor.identity` |
| `SKILL_CHAT_WORKER_URL` | URL privada del worker `/v1/jobs` |
| `SKILL_CHAT_PUBLIC_URL` | `https://hashcod-skill-chat-production.up.railway.app` |
| `SKILL_CHAT_ALLOWED_ORIGINS` | Los dos orígenes HTTPS exactos de la plataforma |
| `PORT` | `8080` |

El worker recibe únicamente `SKILL_CHAT_WORKER_SECRET`, `PORT` y configuración no confidencial. Nunca recibe claves de IA, credenciales de base de datos ni la clave Ed25519. Registrar solo la clave Ed25519 **pública** de 32 bytes en `hashcod_shared.review_keyring`, con id `skill-chat-backend-v1`. Mantener claves estables entre despliegues y gestionar su rotación explícitamente. Los secretos no se incluyen en Git, instaladores, imágenes Docker ni documentación.

Orígenes de escritorio: solo HTTP loopback `127.0.0.1`, `localhost` o `[::1]`, con puerto 1024–65535; cada sesión queda ligada al origen concreto. No se utiliza CORS comodín. El navegador solo necesita en CSP el origen WSS exacto de la API.

Dockerfiles: `skill-chat/apps/api/Dockerfile` y `skill-chat/apps/worker/Dockerfile`, con contexto en la raíz del repositorio. La API aplica migraciones Prisma al iniciar. Publicar primero la función de identidad y el worker; exigir `/healthz` del worker antes de activar la API. La salud de la API comprueba PostgreSQL, Redis y el worker.

La configuración del editor no elimina datos al vencer un período. Para eliminación y recuperación se aplica el canal de privacidad y la política publicada. Los archivos exportados quedan bajo control del usuario. Los límites de historial no sustituyen una política operativa de copias de seguridad y conservación.

## Verificación

`.github/workflows/verify-skill-chat.yml` verifica tipos y comandos, API con PostgreSQL/Redis reales, imágenes de producción, runtimes e intentos de escape en Docker sin red y sin capacidades, interfaz móvil/escritorio, identidad firmada y CSRF PHP. El workflow de escritorio reconstruye el instalador desde los mismos archivos canónicos. No desplegar una API sin un worker que pase sus pruebas de inicio.
