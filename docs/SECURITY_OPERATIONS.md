# Operaciones de seguridad

Procedimientos para el operador. No incluyas valores de claves en commits, tickets ni logs.

## 1. Copia de seguridad de claves

Estas claves no se pueden recuperar si se pierden:

| Variable | Si se pierde |
|---|---|
| `L8_VAULT_MASTER_KEY` | Los datos de la bóveda cifrada (`vault.enc`) quedan ilegibles. |
| `L8_ACCESS_GATE_COOKIE_SECRET` | Se invalidan pruebas de acceso y periodos firmados. |
| `L8_COUPON_SIGNING_KEY` | Se invalidan los cupones emitidos. |
| `L8_AUTH_PEPPER`, `L8_DILITHIUM5_REGISTER_KEY` | Las cuentas existentes dejan de autenticar. |

1. Guarda cada valor en un gestor de secretos con acceso de al menos dos personas (no en el repositorio, chat ni correo).
2. Mantén una copia offline cifrada de `L8_VAULT_MASTER_KEY`.
3. Tras cada cambio de variables en Railway/Render, verifica que el servicio arranca (el entrypoint rechaza claves ausentes o menores de 32 caracteres).
4. Prueba la restauración al menos una vez por trimestre en un entorno aislado.

## 2. Copia de datos

- `data_storage/` no está en Git. Usa el almacenamiento persistente o Supabase como fuente de verdad.
- Activa copias de seguridad automáticas (PITR) del proyecto Supabase y exporta periódicamente `hashcod_shared`.
- Restauración: recupera la base, restaura las claves de la sección 1 y redespliega; comprueba `/healthz`.

## 3. Rotación de claves

Rotar invalida lo firmado con la clave anterior. Hazlo fuera de despliegues normales y avisa al equipo.

1. Genera un valor aleatorio de 64 caracteres hexadecimales: `openssl rand -hex 32`.
2. Guarda el valor nuevo en el gestor de secretos **antes** de aplicarlo.
3. Actualiza la variable en el servicio y redespliega.
4. `L8_VAULT_MASTER_KEY`: no basta con cambiarla; los datos cifrados con la anterior deben re-cifrarse antes de retirarla.
5. Registra fecha y motivo de la rotación (sin el valor).

## 4. Credenciales expuestas en el historial

Los commits antiguos contienen estado de runtime (`data_storage/catalyst_state.json`, logs de Catalyst e índices) que ya no está en el árbol actual. Trátalo como comprometido:

1. Regenera/revoca todo token o estado de Catalyst que haya estado en esos archivos y cualquier PAT de GitHub que se haya usado en el servidor.
2. Revisa el uso reciente de esas credenciales en el proveedor.
3. Limpieza opcional del historial (operación coordinada, requiere autorización del propietario): usar `git filter-repo --path data_storage --invert-paths` en un clon limpio, force-push coordinado, y que todos los colaboradores vuelvan a clonar. Las copias o forks existentes conservarán los datos, por eso la revocación del paso 1 es obligatoria aunque se limpie el historial.

## 5. Prevención

- `scripts/check_secrets.js` se ejecuta en CI (`security-hardening.yml`) y falla si se versiona `data_storage/`, `.env`, claves privadas o tokens reconocibles.
- Ejecútalo localmente antes de subir: `node scripts/check_secrets.js`.
- Activa *secret scanning* y *push protection* en la configuración del repositorio de GitHub.

## 6. Pendiente

- `style-src-attr 'unsafe-inline'` (ver `SECURITY.md`): requiere migrar los atributos `style` a clases; es un cambio amplio que debe hacerse por componentes con pruebas de interfaz.
