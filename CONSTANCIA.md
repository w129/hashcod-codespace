# Constancias de integridad de activos de IA

Herramienta de la plataforma (botón de la fila bajo *Open Hatch*, junto a Formularios) que emite una **constancia verificable**
de un activo (modelo, pesos, dataset, prompt, agente, skill, código, output): credencial W3C firmada con Ed25519, sello de tiempo
RFC 3161, libro de solo-anexión, PDF con el paquete `.cod` incrustado, página pública de verificación y `hcod verify`.

## Qué hay que configurar (variables de Railway)

| Variable | Obligatoria | Para qué |
|---|---|---|
| `HASHCOD_SEAL_ED25519_SEED_B64` | sí | Semilla Ed25519 (32 bytes, base64) del emisor. Se genera con `php scripts/seal-keygen.php` y **solo** vive aquí. |
| `HASHCOD_SEAL_KEY_ID` | no (`key-2026-01`) | ID de la llave: `did:web:<dominio>#<id>`. Cámbialo al rotar. |
| `HASHCOD_SEAL_ACCESS_SIGNATURE_SHA256` | sí | SHA-256 (hex) de cada firma autorizada a entrar en la herramienta, separadas por coma. `php scripts/seal-signature-hash.php < firma.txt` |
| `HASHCOD_SEAL_DOMAIN` | no (`hashcodcodespace.dev`) | Dominio del DID (`did:web`), del QR y de `/.well-known/did.json`. |
| `HASHCOD_TSA_URL` / `HASHCOD_TSA2_URL` | no | TSA RFC 3161 principal (DigiCert) y segundo anclaje independiente (Sectigo, `off` lo desactiva). Solo se envía el SHA-512 de la credencial firmada. |
| `HASHCOD_TSA_CA_FILE` | no | CA para verificar la cadena del TSA (por defecto el bundle del sistema). |
| `HASHCOD_SEAL_DB` | no | Ruta del SQLite (por defecto `data_storage/constancia/constancias.sqlite`). |

**Persistencia (imprescindible):** la base de datos asigna los números (`HC-AAAA-NNNNNN`) y guarda la cadena del libro. Monta un
**Volume de Railway** en `/var/www/html/data_storage` (o apunta `HASHCOD_SEAL_DB` a un volumen). Sin volumen, un redeploy reinicia
la numeración y pierde el historial. La cédula/RNC se cifra con `L8_DATA_ENCRYPTION_KEY` (conserva esa clave: sin ella no se puede descifrar).

La herramienta se niega a emitir (con un aviso claro) mientras falte la llave, la firma autorizada, el TSA o algún componente del servidor.

## Entrar en la herramienta
Hay que pegar la firma o subirla en un `.txt`. El servidor normaliza el texto, calcula el SHA-256 de los bytes y lo compara (tiempo
constante) con `HASHCOD_SEAL_ACCESS_SIGNATURE_SHA256`; la firma nunca se guarda ni se registra. Si es correcta emite una cookie sellada
(HttpOnly, SameSite=Strict, 30 min). 8 fallos por IP en 10 minutos bloquean los intentos. Esto es una lista de firmas autorizadas, **no**
una verificación criptográfica de la firma (el servidor no conoce su llave pública ni el mensaje firmado).

## Qué hace al emitir (el orden importa)
1. Valida los campos (el archivo del activo **nunca se sube**: el navegador calcula SHA-512, o un árbol Merkle si hay varios archivos).
2. Un único `BEGIN IMMEDIATE` en SQLite cubre todo el proceso: si algo falla (p. ej. el TSA no responde) se revierte y **no se gasta número**.
3. Número atómico → credencial W3C VC v2 → JCS (RFC 8785) → firma `DataIntegrityProof` / `eddsa-jcs-2022` (Ed25519).
4. Huella = SHA-512 de la credencial firmada canonicalizada → se sella en el TSA (RFC 3161). La hora impresa es el `genTime` del token, nunca el reloj del servidor.
5. Segundo anclaje (otro TSA), asiento en el libro encadenado por hash (triggers + cadena: editar o borrar se nota), paquete `.cod` (zip: `credential.json`, `receipt.json`, `timestamp.tsr`, `anchors.json`, `anchor-2.tsr`, `manifest.json`).
6. PDF A4 de 2 páginas con QR (corrección Q, 4 módulos de zona blanca, sin guilloché detrás), sello visual determinista derivado de la huella y el `.cod` incrustado como adjunto (AFRelationship=Data).

Merkle: hoja = `SHA-512(ruta UTF-8 ‖ SHA-512(archivo))`, rutas ordenadas por bytes, nodo impar sube sin duplicarse. El servidor recalcula la raíz del manifiesto.

## Verificación
* `https://<dominio>/verify/HC-AAAA-NNNNNN?h=<32 hex>`: dominio visible, aviso si `h` no coincide, estado vigente/revocada, las comprobaciones, sello visual y arrastrar el archivo (SHA-512 en el navegador). Las constancias *privadas* solo muestran estado, sello y comprobaciones.
* `GET /api/constancia/public/{N}` (JSON) y `/{N}.cod` (solo públicas). `GET /.well-known/did.json`. Ninguna requiere periodo Pro.
* `php bin/hcod verify HC-AAAA-NNNNNN [--base URL] [--cod archivo] [--asset archivo] [--ca ca.pem]`: las cinco comprobaciones (firma, hash JCS, compromiso reproducible, sello de tiempo, separación de roles) + la del anclaje externo; código de salida 0 solo si todo pasa.

## Rotación de llaves
Genera otra con `seal-keygen.php <nuevo-id>`, cambia las dos variables y añade la llave **anterior** (id + `publicKeyMultibase`) a `config/seal-did-keys.json`
(`[{"id":"key-2026-01","publicKeyMultibase":"z6Mk…","active":false}]`) para que las constancias previas sigan verificando. Publica y sella el historial de `did.json` fuera del dominio.

## Pruebas
`php tests/test_constancia.php` (primitivas, TSA local real con `openssl ts`, manipulación, libro, PDF; `VERAPDF=…` valida PDF/A-3b),
`node tests/e2e/test_constancia_http.js`, `node tests/e2e/test_seal_tool_browser.js`, `node tests/test_sha512_stream.cjs`,
`CONSTANCIA_LIVE_TSA=1 php tests/test_constancia_live_tsa.php` (TSAs reales, necesita internet).

## Límites conocidos
* La llave de firma vive en el entorno del servidor, no en un HSM ni en una máquina aislada; si se quiere separar, el firmador debe moverse a otro proceso.
* No hay anclaje OpenTimestamps; el segundo anclaje es otro TSA RFC 3161.
* PDF/A-3b se validó con veraPDF 1.30.3 en desarrollo, no en CI.
* Escritorio (Windows): faltan el comando `openssl` y Python con reportlab; la herramienta lo detecta y avisa en vez de fallar. Pendiente empaquetarlos.
