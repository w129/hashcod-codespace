/* opencriptG — Technical Info panel (right side)
   Richer advisory panel: what the selected primitive is,
   where to use it, where not to use it, and operational notes. */

const PANEL_LANG = {
  en: {
    selectTitle: 'Select a primitive',
    selectDesc: 'Pick a cryptographic type from the left rail to see its specification, deployment advice, and recommended use.',
    outputFormat: 'Output format',
    bestFit: 'Best fit',
    posture: 'Security posture',
    commonHome: 'Common home',
    whereUse: 'Where you can use it',
    whereNot: "Where you should not use it",
    typicalPlaces: 'Typical environments',
    opNotes: 'Operational notes',
    engine: 'Engine',
    entropy: 'Entropy',
    searchSpace: 'Search space',
    standard: 'Standard',
    realPurpose: 'Real purpose',
    concreteProfile: 'Concrete profile',
    validation: 'Validation',
    lifecycle: 'Lifecycle',
    storageRule: 'Storage rule',
    criticalRisk: 'Critical risk',
    enterpriseUse: 'Enterprise use',
    id: 'id',
    category: 'category',
    modern: 'Modern / recommended',
    caution: 'Use with caution',
    legacy: 'Legacy / migrate away',
    future: 'Forward-looking / emerging',
    generalSymmetric: 'Protecting data with the same secret on both sides.',
    generalAsymmetric: 'Key pairs for exchange, signatures, or legacy PKI.',
    generalHashes: 'Integrity fingerprints and one-way digests.',
    generalPasswords: 'Human-typed secrets and recovery phrases.',
    generalKdf: 'Deriving or hardening secrets from weaker input.',
    generalMacs: 'Authenticating messages and detecting tampering.',
    generalIdentifiers: 'Opaque identifiers and sortable IDs.',
    generalTokens: 'Application auth, sessions, and API access.',
    generalPq: 'Post-quantum primitives for forward-looking deployments.',
  },
  es: {
    selectTitle: 'Selecciona una primitiva',
    selectDesc: 'Elige un tipo criptográfico en la barra izquierda para ver su especificación, recomendaciones de despliegue y usos recomendados.',
    outputFormat: 'Formato de salida',
    bestFit: 'Mejor encaje',
    posture: 'Postura de seguridad',
    commonHome: 'Hogar común',
    whereUse: 'Dónde puedes usarlo',
    whereNot: 'Dónde no deberías usarlo',
    typicalPlaces: 'Entornos típicos',
    opNotes: 'Notas operativas',
    engine: 'Motor',
    entropy: 'Entropía',
    searchSpace: 'Espacio de búsqueda',
    standard: 'Estándar',
    id: 'id',
    category: 'categoría',
    realPurpose: 'Proposito real',
    concreteProfile: 'Perfil concreto',
    validation: 'Validacion',
    lifecycle: 'Ciclo de vida',
    storageRule: 'Regla de almacenamiento',
    criticalRisk: 'Riesgo critico',
    enterpriseUse: 'Uso enterprise',
    modern: 'Moderno / recomendado',
    caution: 'Usar con cuidado',
    legacy: 'Heredado / conviene migrar',
    future: 'Orientado al futuro / emergente',
    generalSymmetric: 'Protección de datos usando el mismo secreto en ambos lados.',
    generalAsymmetric: 'Pares de claves para intercambio, firmas o PKI heredada.',
    generalHashes: 'Huellas de integridad y resúmenes de una sola vía.',
    generalPasswords: 'Secretos escritos por humanos y frases de recuperación.',
    generalKdf: 'Derivación o endurecimiento de secretos a partir de entradas débiles.',
    generalMacs: 'Autenticación de mensajes y detección de manipulación.',
    generalIdentifiers: 'Identificadores opacos e IDs ordenables.',
    generalTokens: 'Autenticación de aplicaciones, sesiones y acceso por API.',
    generalPq: 'Primitivas poscuánticas para despliegues orientados al futuro.',
  }
};

const TL = (language, key) => (PANEL_LANG[language] || PANEL_LANG.en)[key] || PANEL_LANG.en[key] || key;

const legacyIds = new Set(['md5', 'sha1', 'des3', 'rsa1024', 'blowfish', 'uuid1', 'uuid3', 'pin4', 'cbcmac']);
const cautionIds = new Set(['rsa2048', 'rsa3072', 'aes192', 'salsa20', 'bcrypt', 'pbkdf2', 'scrypt', 'uuid5', 'sm4']);
const futureIds = new Set(['kyber768', 'dilithium3']);

const CATEGORY_DEFAULTS = {
  en: {
    symmetric: {
      bestFit: 'Application and storage encryption',
      home: 'Backends, storage layers, secure channels',
      use: ['Encrypt data at rest or in transit when both parties can share the same secret.', 'Store the key in a KMS, HSM, or protected server-side secret store.', 'Pair the key with a correct mode of operation and a clear nonce/IV strategy.'],
      avoid: ['Do not hard-code the key in frontend code or mobile binaries.', 'Do not reuse nonces or IVs in modes that require uniqueness.', 'Do not choose a weaker legacy cipher when modern AES or ChaCha20 is available.'],
      where: ['Backend services that encrypt records or files.', 'Storage envelope encryption, secure archives, or API payload protection.', 'HSM-backed or KMS-backed infrastructure.'],
      notes: ['Your real security depends on key storage, rotation policy, and IV/nonce handling — not only on algorithm choice.', 'If interoperability matters across many platforms, prefer well-supported modern standards.', 'Document how the key is generated, rotated, and retired.'],
    },
    asymmetric: {
      bestFit: 'Key exchange, signatures, and PKI',
      home: 'TLS, SSH, certificates, code signing',
      use: ['Use it when you need a public/private key pair instead of a shared secret.', 'Prefer modern curves for new systems when compatibility allows.', 'Keep private keys offline or inside a secure enclave whenever possible.'],
      avoid: ['Do not expose private keys to browsers or client-side JavaScript.', 'Do not keep long-lived private keys unencrypted on disk.', 'Do not choose legacy RSA sizes below the current minimum floor.'],
      where: ['TLS certificates, SSH identities, document signing workflows.', 'Key agreement for secure sessions.', 'Hardware-backed signing or PKI environments.'],
      notes: ['Separate online keys from offline root keys.', 'Define key lifecycle rules: issuance, rollover, revocation, and archival.', 'Signature and agreement keys should not be reused casually across unrelated systems.'],
    },
    hashes: {
      bestFit: 'Integrity checks and deterministic fingerprints',
      home: 'Build pipelines, file verification, content addressing',
      use: ['Use it to fingerprint data, verify integrity, or feed other constructions like HMAC or KDFs.', 'Choose modern digest families for new workflows.', 'Document whether the hash is used for security or only for de-duplication.'],
      avoid: ['Do not use a plain hash as a password hash.', 'Do not confuse integrity checking with authenticity — hashes alone do not prove origin.', 'Do not use broken legacy digests for new security-sensitive designs.'],
      where: ['Artifact verification, checksums, cache keys, merkle or content-addressable systems.', 'Inputs to HMAC, HKDF, or signatures.', 'Pipeline integrity reporting.'],
      notes: ['If an attacker can modify both the file and the hash, the hash does not help — sign it or authenticate it.', 'Pick digest size according to collision tolerance and ecosystem support.', 'For password storage, jump to the KDF family instead.'],
    },
    passwords: {
      bestFit: 'Human-managed secrets',
      home: 'Login systems, vaults, recovery workflows',
      use: ['Use it when a human must type, remember, or recover the secret.', 'Prefer passphrases over short passwords when usability permits.', 'Pair it with MFA, rate limits, and a strong password hashing backend.'],
      avoid: ['Do not store plaintext passwords.', 'Do not send passwords over insecure transport.', 'Do not reuse the same human secret across unrelated systems.'],
      where: ['Account login, vault access, recovery flows, bootstrap credentials.', 'Disk or password-manager master secrets.', 'Recovery kits and seed-phrase processes.'],
      notes: ['The UI should guide users toward longer secrets instead of only “complex-looking” ones.', 'Human factors matter: copy, reset, recovery, and phishing resistance.', 'Always hash server-side with a modern KDF such as Argon2id.'],
    },
    kdf: {
      bestFit: 'Hardening passwords and deriving keys',
      home: 'Password storage, protocol internals, key schedules',
      use: ['Use it to derive strong keys from weaker input or to harden password storage.', 'Tune memory and iteration cost to your threat model and hardware.', 'Prefer modern, memory-hard KDFs for new password-storage systems.'],
      avoid: ['Do not use general hashes alone when a KDF is required.', 'Do not keep weak cost parameters forever without revisiting them.', 'Do not assume interoperability across systems with different parameter sets.'],
      where: ['Password databases, vault unlock flows, TLS or protocol key schedules.', 'Client-side encryption bootstrap with careful server-side verification.', 'Wallet or seed hardening workflows.'],
      notes: ['Parameter choices are part of the design: memory cost, time cost, and parallelism should be documented.', 'When regulation requires PBKDF2, compensate with strong salts and high iteration counts.', 'Plan periodic parameter upgrades over time.'],
    },
    macs: {
      bestFit: 'Tamper detection and authenticated requests',
      home: 'API signing, webhook verification, protocol integrity',
      use: ['Use it to prove that a message was created by someone who knows the shared secret.', 'Verify before processing sensitive payloads.', 'Rotate MAC secrets like any other server-side secret.'],
      avoid: ['Do not expose the MAC secret to untrusted clients.', 'Do not compare tags with naive string equality if timing side channels matter.', 'Do not use legacy MAC constructions with known design limitations.'],
      where: ['Webhook verification, signed requests, stateless session protection.', 'Protocol message integrity.', 'Service-to-service authentication.'],
      notes: ['MACs authenticate data but do not encrypt it.', 'Make sure both sides agree on canonicalization, encoding, and headers.', 'Replay protection often needs a timestamp, nonce, or sequence number around the MAC.'],
    },
    identifiers: {
      bestFit: 'Opaque IDs and ordering-friendly identifiers',
      home: 'Databases, events, URLs, tracing',
      use: ['Use it when you need uniqueness, sortability, or human-safe copy/paste identifiers.', 'Pick time-sortable IDs if your storage engine likes ordered inserts.', 'Use URL-safe formats when the ID will travel through routes and APIs.'],
      avoid: ['Do not treat an identifier as an authentication secret.', 'Do not assume “unguessable” equals “authorized”.', 'Do not pick deterministic IDs when privacy or unpredictability matters.'],
      where: ['Database primary keys, object IDs, event streams, tracing and idempotency keys.', 'User-facing links or short URLs when format matters.', 'Distributed systems that need orderable identifiers.'],
      notes: ['The right identifier depends on index behavior, ordering needs, and exposure level.', 'If users will read it aloud or copy it, alphabet choice matters.', 'For security tokens, move to the Tokens & Auth family.'],
    },
    tokens: {
      bestFit: 'Application sessions and programmatic auth',
      home: 'APIs, browsers, webhooks, MFA systems',
      use: ['Use it to authenticate requests, sessions, or delegated access.', 'Scope every token to the minimum required privileges.', 'Set clear lifetimes, rotation rules, and revocation strategy.'],
      avoid: ['Do not log raw bearer tokens or API keys.', 'Do not keep long-lived tokens in unsafe storage.', 'Do not confuse a signing secret with an encryption key.'],
      where: ['OAuth flows, service-to-service auth, webhook security, CSRF defense, MFA setup.', 'Developer portals and customer API access.', 'Temporary session management.'],
      notes: ['Storage location matters: cookies, secure enclaves, or secret managers can change risk drastically.', 'Short-lived access tokens plus refresh controls are easier to manage than one immortal secret.', 'Audit issuance, scope, and last use whenever possible.'],
    },
    pq: {
      bestFit: 'Forward-looking post-quantum migration',
      home: 'Hybrid TLS, future signing, pilot deployments',
      use: ['Use it to evaluate or pilot post-quantum readiness.', 'Prefer hybrid deployments when you still need strong classical interoperability.', 'Track standards progress and vendor library maturity.'],
      avoid: ['Do not assume every library or HSM supports it yet.', 'Do not deploy it blindly into ecosystems that require strict interoperability.', 'Do not ignore key-size and message-size overhead.'],
      where: ['Migration pilots, hybrid handshakes, new signing experiments, research-driven products.', 'Long-lived systems where quantum migration planning matters.', 'Labs, future-facing security programs, or vendor evaluations.'],
      notes: ['Post-quantum does not mean “drop-in replacement” everywhere.', 'Interoperability, performance, and certificate tooling are still moving targets.', 'Keep migration plans flexible and standards-aware.'],
    },
  },
  es: {
    symmetric: {
      bestFit: 'Cifrado de aplicaciones y almacenamiento',
      home: 'Backends, capas de almacenamiento y canales seguros',
      use: ['Úsalo para cifrar datos en reposo o en tránsito cuando ambas partes puedan compartir el mismo secreto.', 'Guarda la clave en un KMS, HSM o almacén de secretos del lado del servidor.', 'Acompaña la clave con un modo correcto de operación y una estrategia clara de nonce/IV.'],
      avoid: ['No incrustes la clave dentro del frontend ni en binarios móviles.', 'No reutilices nonces o IVs en modos que exigen unicidad.', 'No elijas un cifrador heredado más débil si tienes AES o ChaCha20 disponibles.'],
      where: ['Servicios backend que cifran registros o archivos.', 'Cifrado envolvente de almacenamiento, archivos seguros o protección de payloads de API.', 'Infraestructura respaldada por HSM o KMS.'],
      notes: ['La seguridad real depende del almacenamiento de claves, la rotación y el manejo de IV/nonce, no solo del algoritmo.', 'Si la interoperabilidad importa entre muchas plataformas, conviene preferir estándares modernos muy soportados.', 'Documenta cómo se genera, rota y retira la clave.'],
    },
    asymmetric: {
      bestFit: 'Intercambio de claves, firmas y PKI',
      home: 'TLS, SSH, certificados y firmado de código',
      use: ['Úsalo cuando necesitas un par pública/privada en vez de un secreto compartido.', 'Para sistemas nuevos, prefiere curvas modernas si la compatibilidad lo permite.', 'Mantén las claves privadas fuera de línea o dentro de hardware seguro siempre que puedas.'],
      avoid: ['No expongas claves privadas a navegadores ni a JavaScript del cliente.', 'No guardes claves privadas de larga vida sin cifrar en disco.', 'No elijas tamaños RSA heredados por debajo del mínimo de seguridad moderno.'],
      where: ['Certificados TLS, identidades SSH, firmado de documentos y software.', 'Acuerdos de claves para sesiones seguras.', 'Entornos PKI o de firma respaldados por hardware.'],
      notes: ['Separa claves en línea de raíces offline.', 'Define el ciclo de vida: emisión, rotación, revocación y archivado.', 'Las claves de firma y acuerdo no deberían reutilizarse alegremente entre sistemas no relacionados.'],
    },
    hashes: {
      bestFit: 'Verificación de integridad y huellas deterministas',
      home: 'Pipelines de build, verificación de archivos y content addressing',
      use: ['Úsalo para sacar huellas, verificar integridad o alimentar construcciones como HMAC y KDF.', 'Elige familias modernas de hash para flujos nuevos.', 'Aclara si el hash se usa para seguridad o solo para deduplicación.'],
      avoid: ['No uses un hash plano como hash de contraseñas.', 'No confundas integridad con autenticidad: un hash solo no prueba el origen.', 'No uses digests rotos o heredados para diseños nuevos sensibles.'],
      where: ['Verificación de artefactos, checksums, claves de caché y sistemas direccionados por contenido.', 'Entradas para HMAC, HKDF o firmas.', 'Informes de integridad en pipelines.'],
      notes: ['Si un atacante puede cambiar el archivo y también el hash, el hash no te ayuda: fírmalo o autentícalo.', 'El tamaño del digest se elige según tolerancia a colisiones y soporte del ecosistema.', 'Para almacenar contraseñas, salta a la familia de KDF.'],
    },
    passwords: {
      bestFit: 'Secretos administrados por humanos',
      home: 'Sistemas de acceso, bóvedas y recuperación',
      use: ['Úsalo cuando una persona debe escribir, recordar o recuperar el secreto.', 'Cuando se pueda, convienen más las frases largas que las contraseñas cortas.', 'Combínalo con MFA, límites de intentos y una buena capa de password hashing.'],
      avoid: ['No almacenes contraseñas en texto plano.', 'No las envíes por transporte inseguro.', 'No reutilices el mismo secreto humano entre sistemas distintos.'],
      where: ['Inicio de sesión, acceso a bóvedas, flujos de recuperación y credenciales iniciales.', 'Secretos maestros de discos o gestores de contraseñas.', 'Procesos de recovery y seed phrases.'],
      notes: ['La interfaz debe empujar a secretos más largos, no solo a secretos “complejos”.', 'Los factores humanos importan: restablecimiento, recuperación y resistencia al phishing.', 'En servidor, siempre hashea con un KDF moderno como Argon2id.'],
    },
    kdf: {
      bestFit: 'Derivación y endurecimiento de secretos',
      home: 'Almacenamiento de contraseñas, protocolos y key schedules',
      use: ['Úsalo para derivar claves fuertes desde entradas más débiles o endurecer contraseñas.', 'Ajusta memoria e iteraciones según el hardware y el modelo de amenaza.', 'Para sistemas nuevos de contraseñas, prefiere KDF modernos y memory-hard.'],
      avoid: ['No uses hashes generales cuando realmente necesitas un KDF.', 'No dejes costos demasiado débiles para siempre sin revisarlos.', 'No asumas interoperabilidad si los parámetros cambian entre sistemas.'],
      where: ['Bases de datos de contraseñas, desbloqueo de bóvedas y key schedules de protocolos.', 'Bootstrap de cifrado con verificación del lado del servidor.', 'Endurecimiento de wallets o semillas.'],
      notes: ['Los parámetros forman parte del diseño: costo de memoria, tiempo y paralelismo deben quedar documentados.', 'Si una regulación te obliga a PBKDF2, compénsalo con buena sal e iteraciones altas.', 'Planea subir los parámetros con el tiempo.'],
    },
    macs: {
      bestFit: 'Detección de alteraciones y autenticación de mensajes',
      home: 'Firmado de APIs, verificación de webhooks e integridad de protocolos',
      use: ['Úsalo para probar que un mensaje viene de alguien que conoce el secreto compartido.', 'Verifica la autenticidad antes de procesar payloads sensibles.', 'Rota los secretos MAC igual que cualquier secreto de servidor.'],
      avoid: ['No expongas el secreto MAC a clientes no confiables.', 'No compares etiquetas con igualdad ingenua si importan los side channels.', 'No uses MACs heredados con limitaciones conocidas de diseño.'],
      where: ['Verificación de webhooks, requests firmados y protección de sesiones stateless.', 'Integridad de mensajes de protocolo.', 'Autenticación entre servicios.'],
      notes: ['Un MAC autentica datos, pero no los cifra.', 'Ambas partes deben coincidir en canonicalización, codificación y headers.', 'Para frenar replay, normalmente necesitas timestamp, nonce o secuencia alrededor del MAC.'],
    },
    identifiers: {
      bestFit: 'IDs opacos y ordenables',
      home: 'Bases de datos, eventos, URLs y trazabilidad',
      use: ['Úsalo cuando necesitas unicidad, orden o IDs cómodos para copiar y pegar.', 'Si tu motor de almacenamiento prefiere inserciones ordenadas, conviene un ID time-sortable.', 'Elige formatos seguros para URL si viajarán por rutas y APIs.'],
      avoid: ['No trates un identificador como si fuera un secreto de autenticación.', 'No asumas que “difícil de adivinar” equivale a “autorizado”.', 'No elijas IDs deterministas si importan privacidad o imprevisibilidad.'],
      where: ['Primary keys, object IDs, flujos de eventos, tracing e idempotency keys.', 'Links visibles al usuario o short URLs cuando el formato importa.', 'Sistemas distribuidos que necesitan IDs ordenables.'],
      notes: ['El ID correcto depende del comportamiento del índice, la necesidad de orden y el nivel de exposición.', 'Si la gente lo va a leer o dictar, el alfabeto sí importa.', 'Para secretos de acceso, usa la familia Tokens & Auth.'],
    },
    tokens: {
      bestFit: 'Sesiones y autenticación programática',
      home: 'APIs, navegadores, webhooks y MFA',
      use: ['Úsalo para autenticar requests, sesiones o acceso delegado.', 'Reduce el scope al mínimo necesario.', 'Define expiración, rotación y revocación desde el diseño.'],
      avoid: ['No registres bearer tokens ni API keys crudos en logs.', 'No guardes tokens de larga vida en almacenamiento inseguro.', 'No confundas un secreto de firma con una clave de cifrado.'],
      where: ['Flujos OAuth, auth entre servicios, seguridad de webhooks, defensa CSRF y MFA.', 'Portales para desarrolladores y acceso por API para clientes.', 'Gestión temporal de sesiones.'],
      notes: ['Dónde se almacena importa mucho: cookies, enclaves seguros o gestores de secretos cambian el riesgo.', 'Un access token corto con refresh controlado suele ser más manejable que un secreto eterno.', 'Audita emisión, scope y último uso si te es posible.'],
    },
    pq: {
      bestFit: 'Migración poscuántica a futuro',
      home: 'TLS híbrido, nuevas firmas y pilotos',
      use: ['Úsalo para evaluar o pilotar preparación poscuántica.', 'Cuando aún necesitas compatibilidad clásica, prefiere despliegues híbridos.', 'Sigue de cerca la madurez de estándares y librerías.'],
      avoid: ['No asumas que todas las librerías u HSM lo soportan todavía.', 'No lo metas a ciegas en ecosistemas que exigen interoperabilidad estricta.', 'No ignores el costo de tamaño de claves y mensajes.'],
      where: ['Pilotos de migración, handshakes híbridos, experimentos de firma y productos de investigación.', 'Sistemas de vida larga donde planificar el riesgo cuántico sí importa.', 'Laboratorios, programas de seguridad futuros y evaluaciones de vendors.'],
      notes: ['Poscuántico no significa reemplazo automático en todos los entornos.', 'Interoperabilidad, rendimiento y tooling de certificados siguen moviéndose.', 'Mantén los planes de migración flexibles y atentos a estándares.'],
    },
  }
};

const GUIDE_OVERRIDES = {
  aes256: {
    en: {
      bestFit: 'Long-term symmetric protection',
      home: 'Disk, archives, database field encryption',
      use: ['Use it for high-value data at rest and long-lived archives.', 'Choose it when policy or customer requirements explicitly ask for 256-bit AES.', 'Combine it with a modern authenticated mode such as GCM when you also need tamper detection.'],
      avoid: ['Do not assume “AES-256” by itself gives authentication — the mode still matters.', 'Do not build custom IV formats unless your protocol defines them clearly.'],
    },
    es: {
      bestFit: 'Protección simétrica de largo plazo',
      home: 'Disco, archivos y cifrado de campos en base de datos',
      use: ['Úsalo para datos de alto valor en reposo y archivos de larga vida.', 'Elígelo cuando una política o un cliente pidan explícitamente AES de 256 bits.', 'Combínalo con un modo autenticado moderno como GCM si también necesitas detectar manipulación.'],
      avoid: ['No asumas que “AES-256” por sí solo autentica; el modo sigue siendo lo importante.', 'No inventes formatos de IV si tu protocolo no los define claramente.'],
    }
  },
  aesgcm: {
    en: {
      bestFit: 'Authenticated encryption for application payloads',
      home: 'APIs, tokens, modern application crypto',
      use: ['Use it when you need confidentiality and integrity in one construction.', 'It is a strong fit for API payloads, sealed blobs, and envelope encryption.', 'Keep a strict 96-bit nonce strategy and verify the tag every time.'],
      avoid: ['Never reuse a nonce with the same key.', 'Do not treat GCM as forgiving of implementation mistakes — nonce discipline is everything.'],
    },
    es: {
      bestFit: 'Cifrado autenticado para payloads de aplicación',
      home: 'APIs, tokens y criptografía moderna de aplicaciones',
      use: ['Úsalo cuando necesitas confidencialidad e integridad en una sola construcción.', 'Encaja muy bien en payloads de API, blobs sellados y envelope encryption.', 'Mantén una estrategia estricta de nonce de 96 bits y verifica siempre la etiqueta de autenticación.'],
      avoid: ['Nunca reutilices un nonce con la misma clave.', 'No trates GCM como si tolerara errores de implementación; la disciplina con los nonces lo es todo.'],
    }
  },
  chacha20: {
    es: {
      bestFit: 'Cifrado rápido en software puro',
      home: 'Móviles, dispositivos embebidos y túneles modernos',
      use: ['Úsalo cuando no puedes confiar en aceleración AES por hardware.', 'Es una opción excelente para stacks móviles, embebidos y protocolos como WireGuard.', 'Combínalo con Poly1305 cuando necesitas cifrado autenticado.'],
      avoid: ['No lo uses sin una estrategia clara de nonce.', 'No mezcles claves, nonces o contadores entre contextos distintos.'],
    }
  },
  sm4: {
    en: {
      bestFit: 'Chinese compliance-driven symmetric encryption',
      home: 'Chinese-regulated stacks, GM/T ecosystems, local compliance projects',
      use: ['Use it when your target environment explicitly requires Chinese commercial cryptography standards.', 'It is a practical fit for products integrating with GMSSL, WAPI, or suppliers that document GB/T 32907 support.', 'It can also be relevant in finance, government, or regional deployments where SM-series compatibility is a requirement.'],
      avoid: ['Do not choose it only because it looks different if your ecosystem already standardizes on AES.', 'Do not assume broad international interoperability outside Chinese compliance-driven stacks.', 'Do not forget mode-of-operation rules: the algorithm choice does not remove key, IV, or nonce responsibilities.'],
      where: ['Government or finance systems aligned to Chinese standards.', 'Appliances, SDKs, or HSMs that expose SM4/SM-series support.', 'Cross-border products that must interoperate with Chinese cryptographic specifications.'],
      notes: ['If your users are outside that ecosystem, AES-GCM is often easier to integrate and audit.', 'Talk to vendors about mode support, certification expectations, and hardware acceleration before committing.', 'SM4 is less about “stronger than AES” and more about matching a required standards family.'],
    },
    es: {
      bestFit: 'Cifrado simétrico orientado a cumplimiento chino',
      home: 'Stacks regulados en China, ecosistemas GM/T y proyectos con compliance regional',
      use: ['Úsalo cuando tu entorno objetivo exige explícitamente estándares chinos de criptografía comercial.', 'Es una buena opción para integraciones con GMSSL, WAPI o proveedores que documentan soporte para GB/T 32907.', 'También puede ser relevante en finanzas, gobierno o despliegues regionales donde la compatibilidad con la familia SM es un requisito.'],
      avoid: ['No lo elijas solo por “ser diferente” si tu ecosistema ya está estandarizado sobre AES.', 'No asumas interoperabilidad internacional amplia fuera de stacks guiados por compliance chino.', 'No olvides las reglas del modo de operación: elegir SM4 no elimina la responsabilidad sobre claves, IVs o nonces.'],
      where: ['Sistemas gubernamentales o financieros alineados con estándares chinos.', 'Appliances, SDKs o HSM que exponen soporte para SM4 o la familia SM.', 'Productos cross-border que deben interoperar con especificaciones criptográficas chinas.'],
      notes: ['Si tus usuarios están fuera de ese ecosistema, muchas veces AES-GCM será más fácil de integrar y auditar.', 'Conviene hablar con vendors sobre soporte de modos, expectativas de certificación y aceleración por hardware antes de comprometerte.', 'SM4 no se trata de “ser más fuerte que AES”, sino de encajar en una familia de estándares exigida por el entorno.'],
    }
  },
  ed25519: {
    es: {
      bestFit: 'Firmas modernas y compactas',
      home: 'SSH, firmado de software y autenticación moderna',
      use: ['Úsalo para firmar mensajes, artefactos o identidades de forma moderna y compacta.', 'Es una excelente opción en SSH, firmado de software y credenciales que usan EdDSA.', 'Suele ser más cómodo que RSA para sistemas nuevos por tamaño y simplicidad.'],
      avoid: ['No lo uses para intercambio de claves; para eso mira X25519.', 'No mezcles claves de firma con otros propósitos si puedes separarlas.'],
    }
  },
  x25519: {
    es: {
      bestFit: 'Acuerdo moderno de claves',
      home: 'TLS 1.3, WireGuard y mensajería segura',
      use: ['Úsalo para establecer secretos compartidos entre dos partes de forma moderna y eficiente.', 'Es ideal para handshakes de TLS 1.3, WireGuard y protocolos de mensajería segura.', 'Combínalo con un buen key schedule o KDF después del acuerdo.'],
      avoid: ['No lo uses como algoritmo de firma; su objetivo es acuerdo de claves.', 'No reutilices sin control el mismo material privado en demasiados contextos.'],
    }
  },
  rsa2048: {
    es: {
      bestFit: 'Compatibilidad heredada amplia',
      home: 'PKI heredada, certificados y tooling empresarial antiguo',
      use: ['Úsalo cuando la compatibilidad heredada todavía manda.', 'Sigue siendo común en certificados, tooling empresarial y PKI clásica.', 'Puede servir como punto de transición mientras migras a curvas modernas.'],
      avoid: ['No lo elijas por defecto si puedes usar Ed25519 o ECDSA en sistemas nuevos.', 'No lo uses para claves privadas mal protegidas, porque el valor operacional suele ser alto.'],
    }
  },
  argon2id: {
    es: {
      bestFit: 'Hash moderno de contraseñas',
      home: 'Backends de login, bóvedas y secretos humanos',
      use: ['Úsalo para almacenar contraseñas de usuario en aplicaciones nuevas.', 'Es la recomendación moderna cuando quieres buena resistencia frente a CPU, GPU y ASIC.', 'Ajusta memoria y tiempo según tu infraestructura y el perfil de tus usuarios.'],
      avoid: ['No lo conviertas en una simple cadena fija de parámetros para siempre.', 'No confundas hash de contraseñas con derivación genérica de claves para protocolos.'],
    }
  },
  pbkdf2: {
    es: {
      bestFit: 'Compatibilidad regulatoria o heredada',
      home: 'Sistemas FIPS, clientes antiguos y flujos interoperables',
      use: ['Úsalo cuando regulaciones, tooling legado o clientes antiguos te obliguen a ello.', 'Sigue siendo útil en entornos FIPS y escenarios donde la compatibilidad importa mucho.', 'Si lo usas, eleva iteraciones y combina con una sal fuerte y única.'],
      avoid: ['No lo prefieras por delante de Argon2id solo por costumbre.', 'No lo dejes con parámetros viejos o demasiado bajos.'],
    }
  },
  uuid7: {
    es: {
      bestFit: 'IDs ordenables para bases de datos',
      home: 'Tablas con índices B-tree, eventos y feeds ordenados por tiempo',
      use: ['Úsalo cuando quieres la comodidad de UUID pero con mejor comportamiento de inserción ordenada.', 'Encaja muy bien en tablas que sufren con UUID v4 puramente aleatorio.', 'También es útil para eventos o flujos que deben quedar naturalmente ordenados por tiempo.'],
      avoid: ['No lo trates como token secreto de acceso.', 'No esperes que sustituya políticas de autorización solo por ser “difícil de adivinar”.'],
    }
  },
  ulid: {
    es: {
      bestFit: 'IDs ordenables y amigables para URL',
      home: 'Rutas, logs y sistemas donde el formato visible importa',
      use: ['Úsalo cuando te importa que el ID sea ordenable y además legible o amigable para URL.', 'Es muy cómodo para logs, rutas, objetos expuestos a usuario y herramientas internas.', 'Suele ser más agradable para copiar y pegar que un UUID tradicional.'],
      avoid: ['No lo uses como si fuera un secreto de autenticación.', 'No lo elijas si tu sistema exige un formato RFC UUID estricto.'],
    }
  },
  jwt_secret: {
    es: {
      bestFit: 'Firma stateless de JWT',
      home: 'Backends web, APIs y sesiones firmadas',
      use: ['Úsalo para firmar JWT con algoritmos simétricos como HS256.', 'Guárdalo solo del lado del servidor y rota el secreto cuando haya sospechas o cambios operativos.', 'Es útil cuando quieres sesiones o tokens firmados sin mantener estado central.'],
      avoid: ['No lo publiques en frontend ni en repositorios.', 'No lo confundas con una clave para cifrar datos sensibles del token.'],
    }
  },
  apikey: {
    es: {
      bestFit: 'Acceso programático simple',
      home: 'Portales para desarrolladores y APIs de clientes',
      use: ['Úsalo para dar acceso programático simple a una API.', 'Asócialo a scopes, límites y observabilidad para saber quién lo usa y cómo.', 'Es bueno para integraciones de backend a backend o accesos de desarrolladores.'],
      avoid: ['No lo muestres completo una vez creado si no hace falta.', 'No lo uses como único control cuando el riesgo exige autenticación más fuerte.'],
    }
  },
  totp: {
    es: {
      bestFit: 'Segundo factor basado en tiempo',
      home: 'MFA con apps autenticadoras',
      use: ['Úsalo para enrolar MFA con Google Authenticator, Authy o apps similares.', 'Encaja bien como segundo factor en cuentas de usuario y paneles internos.', 'Combínalo con códigos de respaldo y verificación de reloj.'],
      avoid: ['No lo uses como único factor en sistemas muy sensibles.', 'No ignores la experiencia de recuperación si el usuario pierde el dispositivo.'],
    }
  },
  kyber768: {
    es: {
      bestFit: 'Pilotos de acuerdo de claves poscuántico',
      home: 'TLS híbrido, laboratorios y pruebas de migración',
      use: ['Úsalo para pilotos o despliegues híbridos que exploran preparación poscuántica.', 'Es especialmente interesante en handshakes híbridos junto con esquemas clásicos.', 'Sirve para equipos que ya están planificando riesgos de largo plazo.'],
      avoid: ['No lo metas sin revisar tamaño, performance y soporte de librerías.', 'No asumas compatibilidad universal con HSMs, proveedores o tooling existente.'],
    }
  },
};

function getGuideLocale(language) {
  return language === 'es' ? 'es' : 'en';
}

function mergeGuide(base, override) {
  return {
    bestFit: override?.bestFit || base.bestFit,
    home: override?.home || base.home,
    use: override?.use || base.use,
    avoid: override?.avoid || base.avoid,
    where: override?.where || base.where,
    notes: override?.notes || base.notes,
  };
}

function codeFamilyGuide(type, category, language) {
  const lang = getGuideLocale(language);
  const es = lang === 'es';
  const id = String(type?.id || '').toLowerCase();
  const label = String(type?.label || type?.id || 'code');
  const engine = String(type?.engine || '');
  const std = String(type?.std || '');
  const badge = String(type?.badge || '').toUpperCase();
  const hay = `${id} ${label} ${engine} ${std} ${badge}`.toLowerCase();
  const named = label.replace(/\s+/g, ' ').trim();
  const bits = String(type?.entropy || '').match(/\d+\s*bits?/i)?.[0] || String(type?.entropy || 'variable');
  const firstWord = named.split(' ')[0] || '';
  const stageMap = {
    genesis: es ? 'emision raiz' : 'root issuance',
    rotate: es ? 'rotacion controlada' : 'controlled rotation',
    recover: es ? 'recuperacion' : 'recovery',
    audit: es ? 'auditoria' : 'audit',
    escrow: es ? 'custodia dividida' : 'split custody',
    offline: es ? 'custodia offline' : 'offline custody',
    mobile: es ? 'autenticador movil' : 'mobile authenticator',
    server: es ? 'sidecar de servidor' : 'server sidecar',
    client: es ? 'prueba ligada a cliente' : 'client-bound proof',
    cold: es ? 'reserva en frio' : 'cold-storage reserve',
  };
  const stage = stageMap[firstWord.toLowerCase()] || (es ? 'uso operativo privado' : 'private operational use');
  const focusRules = [
    {
      test: /argon|opaque|password|passkey|fido/.test(hay),
      best: es ? 'Registro, login y binder de identidad' : 'Registration, login, and identity binder',
      useLine: es ? 'Prioriza alta entropia, sal unica y verificacion del usuario o dispositivo antes de emitir acceso.' : 'Prioritize high entropy, unique salt, and user or device verification before issuing access.',
      place: es ? 'Registro seguro, MFA, passkeys y bovedas de cuenta.' : 'Secure registration, MFA, passkeys, and account vaults.',
      risk: es ? 'credenciales humanas' : 'human credentials',
      note: es ? 'Define recuperacion de cuenta y rotacion del binder desde el primer dia.' : 'Define account recovery and binder rotation from day one.',
    },
    {
      test: /ml-kem|kyber|kem|pqk|post-quantum|capsule|exchange/.test(hay),
      best: es ? 'Capsula hibrida para intercambio de claves' : 'Hybrid capsule for key exchange',
      useLine: es ? 'Usalo para pilotos de intercambio hibrido donde el secreto debe sobrevivir ciclos largos.' : 'Use it for hybrid exchange pilots where the secret must survive long cycles.',
      place: es ? 'Handshakes internos, TLS hibrido y pruebas de migracion poscuantica.' : 'Internal handshakes, hybrid TLS, and post-quantum migration tests.',
      risk: es ? 'secretos de sesion' : 'session secrets',
      note: es ? 'Guarda version de algoritmo, proveedor y tamano exacto del paquete.' : 'Store algorithm version, provider, and exact package size.',
    },
    {
      test: /ml-dsa|dilithium|signature|signing|firma/.test(hay),
      best: es ? 'Ticket de firma y verificabilidad' : 'Signing ticket and verifiability',
      useLine: es ? 'Conecta el code con emisor, payload canonico y politica de verificacion.' : 'Bind the code to issuer, canonical payload, and verification policy.',
      place: es ? 'Certificados, tickets firmados y registros verificables.' : 'Certificates, signed tickets, and verifiable records.',
      risk: es ? 'evidencia de autoria' : 'authorship evidence',
      note: es ? 'La firma real debe validarse con clave publica y cadena de confianza.' : 'The real signature must be validated with a public key and trust chain.',
    },
    {
      test: /aead|aes|gcm|siv|seal|encrypted|encryption/.test(hay),
      best: es ? 'Envelope cifrado con integridad' : 'Encrypted envelope with integrity',
      useLine: es ? 'Ideal para payloads sellados con nonce, AAD, tag y version del formato.' : 'Ideal for sealed payloads with nonce, AAD, tag, and format version.',
      place: es ? 'Archivos, campos de base de datos, QR sellados y exportaciones privadas.' : 'Files, database fields, sealed QR, and private exports.',
      risk: es ? 'datos cifrados' : 'encrypted data',
      note: es ? 'Nonce unico y clave correcta importan mas que el nombre comercial del code.' : 'Unique nonce and correct key control matter more than the commercial code name.',
    },
    {
      test: /nonce|xch|chacha/.test(hay),
      best: es ? 'Cadena de nonces para alto volumen' : 'Nonce chain for high volume',
      useLine: es ? 'Usalo para evitar colisiones en paquetes masivos, colas y QR generados en lote.' : 'Use it to avoid collisions in massive packets, queues, and batch-generated QR.',
      place: es ? 'Generacion en lote, colas, mensajeria y sellos transportables.' : 'Batch generation, queues, messaging, and transportable seals.',
      risk: es ? 'flujos de cifrado' : 'encryption streams',
      note: es ? 'Un nonce repetido puede arruinar un cifrado aunque la clave sea fuerte.' : 'A repeated nonce can ruin encryption even when the key is strong.',
    },
    {
      test: /threshold|frost|share|split|escrow|recover|recovery/.test(hay),
      best: es ? 'Recuperacion multipartita y custodia dividida' : 'Multipart recovery and split custody',
      useLine: es ? 'Divide autoridad entre partes y registra quorum, version y custodios permitidos.' : 'Split authority across parties and record quorum, version, and allowed custodians.',
      place: es ? 'Bovedas, recuperacion de claves, escrow y continuidad operacional.' : 'Vaults, key recovery, escrow, and operational continuity.',
      risk: es ? 'material de recuperacion' : 'recovery material',
      note: es ? 'Una sola parte no debe poder reconstruir secretos criticos.' : 'One party alone should not reconstruct critical secrets.',
    },
    {
      test: /bbs|selective|credential|disclosure|did|identity|anchor/.test(hay),
      best: es ? 'Credencial, identidad o ancla verificable' : 'Credential, identity, or verifiable anchor',
      useLine: es ? 'Asocialo a sujeto, emisor, alcance, expiracion y prueba de posesion.' : 'Bind it to subject, issuer, scope, expiry, and proof of possession.',
      place: es ? 'Identidad descentralizada, certificados privados y credenciales con privacidad.' : 'Decentralized identity, private certificates, and privacy credentials.',
      risk: es ? 'identidad del usuario' : 'user identity',
      note: es ? 'No publiques atributos sensibles si solo necesitas probar una condicion.' : 'Do not publish sensitive attributes if you only need to prove a condition.',
    },
    {
      test: /dpop|macaroon|api|token|license|detokenization|commercial/.test(hay),
      best: es ? 'Token de autorizacion o licencia controlada' : 'Authorization token or controlled license',
      useLine: es ? 'Define scope, audiencia, expiracion, revocacion y huella almacenada.' : 'Define scope, audience, expiry, revocation, and stored fingerprint.',
      place: es ? 'APIs, licencias, portales de cliente, detokenizacion y tickets internos.' : 'APIs, licenses, customer portals, detokenization, and internal tickets.',
      risk: es ? 'permisos de acceso' : 'access permissions',
      note: es ? 'Loguea fingerprints; evita guardar tokens completos en texto claro.' : 'Log fingerprints; avoid storing full tokens in clear text.',
    },
    {
      test: /kms|hsm|rotation|unseal|slot|hardware/.test(hay),
      best: es ? 'Ciclo de vida de claves en KMS/HSM' : 'KMS/HSM key lifecycle',
      useLine: es ? 'Usalo para eventos de rotacion, unseal, emision de slot y atestacion operacional.' : 'Use it for rotation, unseal, slot issuance, and operational attestation events.',
      place: es ? 'KMS, HSM, TPM, auditoria de llaves y controles de produccion.' : 'KMS, HSM, TPM, key audit, and production controls.',
      risk: es ? 'claves raiz o de servicio' : 'root or service keys',
      note: es ? 'Debe existir revocacion y trazabilidad de quien aprobo el evento.' : 'Revocation and approval traceability must exist.',
    },
    {
      test: /tee|enclave|quote/.test(hay),
      best: es ? 'Binder de enclave y atestacion' : 'Enclave binder and attestation',
      useLine: es ? 'Liga el code a medida de enclave, version de software y politica del host.' : 'Bind the code to enclave measurement, software version, and host policy.',
      place: es ? 'TEE, enclaves, workloads confidenciales y verificacion de runtime.' : 'TEE, enclaves, confidential workloads, and runtime verification.',
      risk: es ? 'ejecucion confiable' : 'trusted execution',
      note: es ? 'Una quote solo ayuda si verificas cadena, freshness y politica esperada.' : 'A quote only helps if chain, freshness, and expected policy are verified.',
    },
    {
      test: /zkp|zero-knowledge|witness|proof|vrf|random|merkle|audit|checkpoint|qr/.test(hay),
      best: es ? 'Prueba, auditoria o integridad transportable' : 'Proof, audit, or transportable integrity',
      useLine: es ? 'Usalo para demostrar integridad, aleatoriedad verificable o checkpoint sin exponer todo el dato.' : 'Use it to prove integrity, verifiable randomness, or checkpoint state without exposing all data.',
      place: es ? 'Auditoria, Merkle logs, QR bundles, pruebas ZK y checkpoints.' : 'Audit, Merkle logs, QR bundles, ZK proofs, and checkpoints.',
      risk: es ? 'pruebas de integridad' : 'integrity proofs',
      note: es ? 'Publica raiz o digest; conserva evidencia y payload original bajo control.' : 'Publish root or digest; keep evidence and original payload under control.',
    },
  ];
  const focus = focusRules.find(rule => rule.test) || {
    best: es ? 'Paquete OCG especializado' : 'Specialized OCG packet',
    useLine: es ? 'Usalo cuando necesitas trazabilidad, checksum, metadata y familia visible para flujos internos.' : 'Use it when traceability, checksum, metadata, and visible family are needed for internal flows.',
    place: es ? 'Operaciones internas, QR, certificados privados y bitacoras.' : 'Internal operations, QR, private certificates, and logs.',
    risk: es ? 'activos sensibles' : 'sensitive assets',
    note: es ? 'Define contrato de formato antes de integrarlo con terceros.' : 'Define the format contract before integrating it with third parties.',
  };

  const customEnvelope = (family, useNoun, riskNoun) => ({
    bestFit: `${family}: ${focus.best}`,
    home: focus.place,
    use: es
      ? [
        `Usalo como ${useNoun} para ${stage}: incluye payload, sal, nonce, fecha, ruta y checksum.`,
        focus.useLine,
        `Es util para flujos privados de tokenizacion, QR, certificados, tickets y auditoria local.`,
      ]
      : [
        `Use it as a ${useNoun} for ${stage}: it includes payload, salt, nonce, timestamp, route, and checksum.`,
        focus.useLine,
        `It is useful for private tokenization, QR, certificates, tickets, and local audit flows.`,
      ],
    avoid: es
      ? [
        `No lo presentes como estandar publico auditado; ${named} es un formato propietario de OCG.`,
        `No lo uses para proteger ${riskNoun || focus.risk} si no va acompanado de cifrado real, control de claves y politicas de acceso.`,
        'No reemplaza firmas, HMAC o cifrado autenticado cuando el sistema necesita garantias criptograficas externas.',
      ]
      : [
        `Do not present it as a public audited standard; ${named} is an OCG proprietary format.`,
        `Do not use it to protect ${riskNoun || focus.risk} without real encryption, key control, and access policy.`,
        'It does not replace signatures, HMAC, or authenticated encryption when external cryptographic assurance is required.',
      ],
    where: es
      ? [focus.place, 'QR Vault y paquetes transportables.', 'Certificados privados, tickets, licencias y bitacoras locales.']
      : [focus.place, 'QR Vault and transportable packets.', 'Private certificates, tickets, licenses, and local logs.'],
    notes: es
      ? [
        `Familia visible: ${badge || family}. Entropia declarada: ${bits}. Motor: ${engine}.`,
        focus.note,
        'Para produccion enterprise, registra emisor, version, expiracion, revocacion y hash del payload original.',
      ]
      : [
        `Visible family: ${badge || family}. Declared entropy: ${bits}. Engine: ${engine}.`,
        focus.note,
        'For enterprise production, record issuer, version, expiry, revocation, and original payload hash.',
      ],
  });

  if (id.startsWith('apex_code_')) return customEnvelope('APEX', es ? 'code APEX enterprise de alta entropia' : 'high-entropy enterprise APEX code', es ? 'flujos criticos' : 'critical workflows');
  if (id.startsWith('neo_code_')) return customEnvelope('NEO', es ? 'code NEO de nueva generacion' : 'next-generation NEO code', es ? 'datos sensibles' : 'sensitive data');
  if (id.startsWith('xadv_code_')) return customEnvelope('OCG-X', es ? 'code avanzado extendido' : 'extended advanced code', es ? 'secretos reales' : 'real secrets');
  if (id.startsWith('adv_code_')) return customEnvelope('OCG-A', es ? 'code avanzado interno' : 'internal advanced code', es ? 'activos criticos' : 'critical assets');

  if (hay.includes('aes-gcm') || id.includes('gcm')) return {
    bestFit: es ? 'Cifrado autenticado con tag de integridad' : 'Authenticated encryption with integrity tag',
    home: es ? 'APIs, blobs sellados, storage envelope y payloads' : 'APIs, sealed blobs, storage envelopes, and payloads',
    use: es ? ['Usalo cuando necesitas confidencialidad e integridad juntas.', 'Excelente para sellar JSON, archivos pequenos, tokens internos o registros de base de datos.', 'Usa nonce unico por clave; 96 bits suele ser el camino interoperable.'] : ['Use it when confidentiality and integrity must travel together.', 'Excellent for sealing JSON, small files, internal tokens, or database records.', 'Use a unique nonce per key; 96 bits is usually the interoperable path.'],
    avoid: es ? ['Nunca reutilices nonce con la misma clave.', 'No separes ciphertext y tag sin documentar el formato.', 'No lo uses como hash de contrasenas.'] : ['Never reuse a nonce with the same key.', 'Do not split ciphertext and tag without documenting the format.', 'Do not use it as a password hash.'],
    where: es ? ['Servicios backend.', 'Cifrado de campos.', 'Paquetes locales OCG y archivos sellados.'] : ['Backend services.', 'Field encryption.', 'OCG local packets and sealed files.'],
    notes: es ? ['La clave puede ser fuerte, pero un nonce repetido rompe el modelo de seguridad.', 'Autentica AAD cuando tengas metadata externa.', 'Rota claves y registra version del formato.'] : ['The key may be strong, but nonce reuse breaks the security model.', 'Authenticate AAD when external metadata exists.', 'Rotate keys and record format version.'],
  };

  if (hay.includes('aes') && category.id === 'symmetric') return {
    bestFit: es ? 'Clave simetrica AES para proteccion general' : 'AES symmetric key for general protection',
    home: es ? 'KMS, HSM, almacenamiento, backups y servicios backend' : 'KMS, HSM, storage, backups, and backend services',
    use: es ? [`Usalo como material AES de ${bits} cuando ya tienes definido el modo de operacion.`, 'Encaja para cifrado de disco, campos de base de datos y envelope encryption.', 'Guardalo fuera del frontend y rota por version o politica.'] : [`Use it as ${bits} AES material after the mode of operation is defined.`, 'Fits disk encryption, database fields, and envelope encryption.', 'Keep it out of frontend code and rotate by version or policy.'],
    avoid: es ? ['AES por si solo no define nonce, padding, tag ni formato.', 'No lo pegues en codigo fuente, logs o variables expuestas al cliente.', 'No reutilices claves para propositos incompatibles.'] : ['AES alone does not define nonce, padding, tag, or format.', 'Do not paste it into source code, logs, or client-exposed variables.', 'Do not reuse keys for incompatible purposes.'],
    where: es ? ['Backends y bases de datos.', 'Contenedores cifrados.', 'Infraestructura con KMS/HSM.'] : ['Backends and databases.', 'Encrypted containers.', 'KMS/HSM-backed infrastructure.'],
    notes: es ? ['El modo recomendado para nuevos payloads suele ser AEAD como GCM.', 'Documenta key id, version y fecha de retiro.', 'Prueba restauracion antes de destruir claves antiguas.'] : ['The recommended mode for new payloads is usually an AEAD such as GCM.', 'Document key id, version, and retirement date.', 'Test restore before destroying old keys.'],
  };

  if (hay.includes('chacha') || hay.includes('xchacha')) return {
    bestFit: es ? 'Cifrado rapido sin depender de AES por hardware' : 'Fast encryption without relying on AES hardware',
    home: es ? 'Moviles, tuneles modernos, apps cliente y edge' : 'Mobile, modern tunnels, client apps, and edge',
    use: es ? ['Usalo donde AES-NI no esta garantizado o quieres rendimiento uniforme.', 'XChaCha es comodo cuando necesitas nonces grandes y aleatorios.', 'Combinalo con Poly1305 para autenticacion.'] : ['Use it where AES-NI is not guaranteed or uniform software speed matters.', 'XChaCha is convenient when large random nonces are needed.', 'Pair it with Poly1305 for authentication.'],
    avoid: es ? ['No lo despliegues sin MAC/tag si el payload puede ser manipulado.', 'No reutilices nonce con la misma clave.', 'No lo mezcles con contadores improvisados.'] : ['Do not deploy it without a MAC/tag if payloads can be modified.', 'Do not reuse nonce with the same key.', 'Do not mix it with improvised counters.'],
    where: es ? ['WireGuard-like tunnels.', 'Apps moviles.', 'Cifrado local de paquetes.'] : ['WireGuard-like tunnels.', 'Mobile apps.', 'Local packet encryption.'],
    notes: es ? ['ChaCha20-Poly1305 esta muy soportado en TLS moderno.', 'XChaCha mejora ergonomia de nonce pero revisa soporte de libreria.', 'Mantiene seguridad practica con implementaciones de tiempo constante.'] : ['ChaCha20-Poly1305 is well supported in modern TLS.', 'XChaCha improves nonce ergonomics but check library support.', 'It keeps practical security with constant-time implementations.'],
  };

  if (hay.includes('hmac') || category.id === 'macs') return {
    bestFit: es ? 'Autenticacion de mensajes con secreto compartido' : 'Message authentication with shared secret',
    home: es ? 'Webhooks, APIs firmadas, integridad de paquetes' : 'Webhooks, signed APIs, packet integrity',
    use: es ? ['Usalo para verificar que un payload viene de quien conoce el secreto.', 'Ideal para webhooks, callbacks, URLs firmadas y paquetes internos.', 'Incluye timestamp o nonce cuando existe riesgo de replay.'] : ['Use it to verify that a payload came from someone who knows the secret.', 'Ideal for webhooks, callbacks, signed URLs, and internal packets.', 'Include timestamp or nonce when replay is a risk.'],
    avoid: es ? ['No cifra datos; solo autentica e integra.', 'No expongas el secreto HMAC en clientes no confiables.', 'No firmes strings sin canonicalizacion clara.'] : ['It does not encrypt data; it authenticates integrity.', 'Do not expose the HMAC secret to untrusted clients.', 'Do not sign strings without clear canonicalization.'],
    where: es ? ['Pasarelas API.', 'Integracion de terceros.', 'Verificacion de logs o QR.'] : ['API gateways.', 'Third-party integration.', 'Log or QR verification.'],
    notes: es ? [`Algoritmo visible: ${std || engine}.`, 'Compara tags con funcion timing-safe.', 'Rota secretos y guarda key id junto al tag.'] : [`Visible algorithm: ${std || engine}.`, 'Compare tags with a timing-safe function.', 'Rotate secrets and store key id with the tag.'],
  };

  if (hay.includes('jwt') || hay.includes('bearer') || hay.includes('oauth') || hay.includes('csrf') || hay.includes('api key') || category.id === 'tokens') return {
    bestFit: es ? 'Credenciales de acceso y sesiones de aplicacion' : 'Access credentials and application sessions',
    home: es ? 'APIs, login, OAuth, paneles internos y servicios' : 'APIs, login, OAuth, internal panels, and services',
    use: es ? [`Usalo cuando ${named} representa permiso temporal o identificacion de cliente.`, 'Define scope, expiracion, rotacion y revocacion.', 'Guarda solo hashes/fingerprints en logs si necesitas auditoria.'] : [`Use it when ${named} represents temporary permission or client identity.`, 'Define scope, expiry, rotation, and revocation.', 'Store only hashes/fingerprints in logs when audit is needed.'],
    avoid: es ? ['No lo registres crudo en logs.', 'No lo guardes en localStorage si el riesgo XSS importa.', 'No lo confundas con una clave de cifrado.'] : ['Do not log it raw.', 'Do not store it in localStorage if XSS risk matters.', 'Do not confuse it with an encryption key.'],
    where: es ? ['Autenticacion API.', 'Portales para clientes.', 'Sesiones y automatizacion interna.'] : ['API authentication.', 'Customer portals.', 'Sessions and internal automation.'],
    notes: es ? ['Los tokens cortos con refresh controlado suelen ser mas seguros que secretos eternos.', 'Revoca por servidor, no solo por expiracion visual.', 'Asocia emisor, audiencia y permisos.'] : ['Short-lived tokens with controlled refresh are usually safer than immortal secrets.', 'Revoke server-side, not only by visible expiry.', 'Bind issuer, audience, and permissions.'],
  };

  if (hay.includes('totp') || hay.includes('otp')) return {
    bestFit: es ? 'MFA basado en tiempo' : 'Time-based MFA',
    home: es ? 'Apps autenticadoras y paneles de cuenta' : 'Authenticator apps and account panels',
    use: es ? ['Usalo para enrolar segundo factor con apps TOTP.', 'Manten codigos de respaldo y flujo de recuperacion.', 'Verifica tolerancia de reloj y ventana temporal.'] : ['Use it to enroll a second factor with TOTP apps.', 'Keep backup codes and recovery flow.', 'Verify clock tolerance and time window.'],
    avoid: es ? ['No lo uses como unico factor para activos sensibles.', 'No muestres el secreto despues del enrolamiento.', 'No ignores phishing: TOTP no es resistente por si solo.'] : ['Do not use it as the only factor for sensitive assets.', 'Do not show the secret after enrollment.', 'Do not ignore phishing: TOTP is not resistant by itself.'],
    where: es ? ['Login de usuarios.', 'Paneles admin.', 'Cuentas internas.'] : ['User login.', 'Admin panels.', 'Internal accounts.'],
    notes: es ? ['El secreto debe almacenarse cifrado.', 'Permite rotacion y recuperacion segura.', 'Para mayor seguridad considera WebAuthn/passkeys.'] : ['The secret should be stored encrypted.', 'Allow secure rotation and recovery.', 'For stronger security consider WebAuthn/passkeys.'],
  };

  if (hay.includes('uuid') || hay.includes('ulid') || hay.includes('nanoid') || category.id === 'identifiers') return {
    bestFit: es ? 'Identificador unico, no secreto' : 'Unique identifier, not a secret',
    home: es ? 'Bases de datos, URLs, eventos, trazabilidad' : 'Databases, URLs, events, tracing',
    use: es ? [`Usalo cuando ${named} debe identificar objetos, filas, eventos o recursos.`, 'Elige IDs ordenables para mejorar indices y feeds por fecha.', 'Elige alfabetos URL-safe para rutas y QR.'] : [`Use it when ${named} must identify objects, rows, events, or resources.`, 'Choose sortable IDs to improve indexes and time feeds.', 'Choose URL-safe alphabets for routes and QR.'],
    avoid: es ? ['No lo trates como permiso de acceso.', 'No expongas IDs secuenciales si revelan volumen o actividad.', 'No reemplaza autorizacion.'] : ['Do not treat it as access permission.', 'Do not expose sequential IDs if they reveal volume or activity.', 'It does not replace authorization.'],
    where: es ? ['Primary keys.', 'Correlation IDs.', 'Rutas publicas o internas.'] : ['Primary keys.', 'Correlation IDs.', 'Public or internal routes.'],
    notes: es ? [`Formato visible: ${badge || std}.`, 'La unicidad y la privacidad son requisitos distintos.', 'Indexacion, longitud y orden importan tanto como entropia.'] : [`Visible format: ${badge || std}.`, 'Uniqueness and privacy are different requirements.', 'Indexing, length, and ordering matter as much as entropy.'],
  };

  if (hay.includes('sha') || hay.includes('blake') || hay.includes('keccak') || hay.includes('hash') || category.id === 'hashes') return {
    bestFit: es ? 'Huella de integridad y direccionamiento de contenido' : 'Integrity fingerprint and content addressing',
    home: es ? 'Archivos, builds, Merkle trees, auditoria' : 'Files, builds, Merkle trees, audit',
    use: es ? [`Usalo para crear una huella ${std || badge} de datos o artefactos.`, 'Bueno para detectar cambios accidentales o alimentar firmas/HMAC.', 'Sirve para deduplicacion, cache keys y pruebas de integridad.'] : [`Use it to create a ${std || badge} fingerprint of data or artifacts.`, 'Good for detecting accidental changes or feeding signatures/HMAC.', 'Useful for deduplication, cache keys, and integrity proofs.'],
    avoid: es ? ['No prueba autoria si el atacante puede cambiar tambien el hash.', 'No lo uses para contrasenas sin KDF.', 'No uses MD5/SHA-1 para seguridad nueva.'] : ['It does not prove authorship if the attacker can also change the hash.', 'Do not use it for passwords without a KDF.', 'Do not use MD5/SHA-1 for new security.'],
    where: es ? ['Verificacion de descargas.', 'Pipelines CI/CD.', 'Registros y paquetes OCG.'] : ['Download verification.', 'CI/CD pipelines.', 'OCG records and packets.'],
    notes: es ? ['Firma o autentica el hash cuando necesitas origen confiable.', 'El tamano del digest define margen contra colisiones.', 'Distingue hash de seguridad vs hash de conveniencia.'] : ['Sign or authenticate the hash when trusted origin is needed.', 'Digest size defines collision margin.', 'Distinguish security hash from convenience hash.'],
  };

  if (hay.includes('argon') || hay.includes('scrypt') || hay.includes('bcrypt') || hay.includes('pbkdf') || category.id === 'kdf') return {
    bestFit: es ? 'Endurecimiento de contrasenas y derivacion de claves' : 'Password hardening and key derivation',
    home: es ? 'Login, bovedas, wallets, desbloqueo local' : 'Login, vaults, wallets, local unlock',
    use: es ? [`Usalo cuando ${named} debe convertir una entrada humana en material dificil de atacar.`, 'Ajusta parametros segun hardware y modelo de amenaza.', 'Guarda sal, parametros y version junto al resultado.'] : [`Use it when ${named} must turn human input into harder-to-attack material.`, 'Tune parameters to hardware and threat model.', 'Store salt, parameters, and version with the result.'],
    avoid: es ? ['No uses una sola configuracion para siempre.', 'No bajes costos solo para que las pruebas sean rapidas.', 'No lo sustituyas por SHA-256 plano.'] : ['Do not use one configuration forever.', 'Do not lower costs just to make tests fast.', 'Do not replace it with plain SHA-256.'],
    where: es ? ['Password databases.', 'Bovedas cifradas.', 'Derivacion de claves desde passphrases.'] : ['Password databases.', 'Encrypted vaults.', 'Key derivation from passphrases.'],
    notes: es ? [`Parametro visible: ${engine}.`, 'Argon2id suele ser preferible para nuevos sistemas si esta disponible.', 'PBKDF2 sigue siendo comun por compliance, no por resistencia moderna superior.'] : [`Visible parameter: ${engine}.`, 'Argon2id is usually preferable for new systems when available.', 'PBKDF2 remains common for compliance, not superior modern resistance.'],
  };

  if (hay.includes('rsa') || hay.includes('ed25519') || hay.includes('x25519') || hay.includes('ecdsa') || hay.includes('signature') || category.id === 'asymmetric') return {
    bestFit: es ? (hay.includes('x25519') ? 'Acuerdo de claves' : 'Firma, identidad o PKI') : (hay.includes('x25519') ? 'Key agreement' : 'Signature, identity, or PKI'),
    home: es ? 'TLS, SSH, certificados, firmado de artefactos' : 'TLS, SSH, certificates, artifact signing',
    use: es ? [`Usalo cuando ${named} requiere par publica/privada o identidad verificable.`, 'Separa claves de firma, intercambio y cifrado.', 'Protege privadas con HSM, enclave, passphrase o almacenamiento cifrado.'] : [`Use it when ${named} requires a public/private pair or verifiable identity.`, 'Separate signing, agreement, and encryption keys.', 'Protect private keys with HSM, enclave, passphrase, or encrypted storage.'],
    avoid: es ? ['No expongas privadas en navegador.', 'No reutilices una clave para demasiados dominios.', 'No elijas RSA pequeno o curvas obsoletas para sistemas nuevos.'] : ['Do not expose private keys in the browser.', 'Do not reuse one key across too many domains.', 'Do not choose small RSA or obsolete curves for new systems.'],
    where: es ? ['SSH y certificados.', 'Firmado de software.', 'Handshake y autenticacion de dispositivos.'] : ['SSH and certificates.', 'Software signing.', 'Handshake and device authentication.'],
    notes: es ? [`Estandar visible: ${std}.`, 'Ed25519 firma; X25519 acuerda claves: no son intercambiables.', 'RSA sigue existiendo por compatibilidad, pero curvas modernas suelen ser mas comodas.'] : [`Visible standard: ${std}.`, 'Ed25519 signs; X25519 agrees keys: they are not interchangeable.', 'RSA remains for compatibility, but modern curves are usually easier.'],
  };

  if (category.id === 'pq' || hay.includes('kyber') || hay.includes('dilithium') || hay.includes('ml-kem') || hay.includes('ml-dsa')) return {
    bestFit: es ? 'Piloto poscuantico o migracion hibrida' : 'Post-quantum pilot or hybrid migration',
    home: es ? 'Laboratorios, TLS hibrido, sistemas de vida larga' : 'Labs, hybrid TLS, long-lived systems',
    use: es ? [`Usalo para evaluar ${named} en pruebas controladas.`, 'Encaja en planes de migracion donde los datos deben sobrevivir anos.', 'Combinalo con criptografia clasica cuando la interoperabilidad aun importa.'] : [`Use it to evaluate ${named} in controlled tests.`, 'Fits migration plans where data must survive for years.', 'Combine it with classical cryptography when interoperability still matters.'],
    avoid: es ? ['No lo vendas como reemplazo magico sin revisar estandar, libreria y tamanos.', 'No ignores costos de ancho de banda y almacenamiento.', 'No fuerces produccion si tus proveedores aun no lo soportan.'] : ['Do not sell it as a magic replacement without checking standard, library, and sizes.', 'Do not ignore bandwidth and storage overhead.', 'Do not force production if your providers do not support it yet.'],
    where: es ? ['Pruebas de migracion.', 'Certificados y handshakes hibridos.', 'Programas de riesgo a largo plazo.'] : ['Migration tests.', 'Hybrid certificates and handshakes.', 'Long-term risk programs.'],
    notes: es ? [`Familia: ${std || badge}.`, 'El estado de estandares y tooling cambia rapido.', 'Documenta version de libreria y parametros exactos.'] : [`Family: ${std || badge}.`, 'Standards and tooling are changing quickly.', 'Document library version and exact parameters.'],
  };

  return null;
}

function buildGuide(type, category, language) {
  const lang = getGuideLocale(language);
  const defaults = CATEGORY_DEFAULTS[lang][category.id] || CATEGORY_DEFAULTS[lang].symmetric;
  const specific = codeFamilyGuide(type, category, language);
  const override = GUIDE_OVERRIDES[type.id]?.[lang] || GUIDE_OVERRIDES[type.id]?.en;
  return mergeGuide(mergeGuide(defaults, specific), override);
}

function securityPosture(type, category, language) {
  if (legacyIds.has(type.id)) return TL(language, 'legacy');
  if (futureIds.has(type.id) || category.id === 'pq') return TL(language, 'future');
  if (cautionIds.has(type.id)) return TL(language, 'caution');
  return TL(language, 'modern');
}

function categoryOneLine(category, language) {
  const lang = getGuideLocale(language);
  const table = PANEL_LANG[lang];
  return {
    symmetric: table.generalSymmetric,
    asymmetric: table.generalAsymmetric,
    hashes: table.generalHashes,
    passwords: table.generalPasswords,
    kdf: table.generalKdf,
    macs: table.generalMacs,
    identifiers: table.generalIdentifiers,
    tokens: table.generalTokens,
    pq: table.generalPq,
  }[category.id] || '';
}

function compactText(value, fallback = 'n/a') {
  return String(value || fallback).replace(/\s+/g, ' ').trim();
}

function buildConcreteProfile(type, category, language) {
  const es = getGuideLocale(language) === 'es';
  const id = String(type.id || '').toLowerCase();
  const hay = `${id} ${type.label || ''} ${type.engine || ''} ${type.std || ''} ${type.badge || ''}`.toLowerCase();
  const bits = compactText(type.entropy, 'unknown');
  const engine = compactText(type.engine);
  const std = compactText(type.std);
  const output = compactText(type.engine);

  let purpose = es ? 'Material criptografico especializado para la familia seleccionada.' : 'Specialized cryptographic material for the selected family.';
  let validation = es ? `Comprobar formato esperado, longitud, entropia declarada (${bits}) y que el valor no venga truncado.` : `Check expected format, length, declared entropy (${bits}), and that the value is not truncated.`;
  let lifecycle = es ? 'Versionar, rotar por politica y retirar valores comprometidos.' : 'Version it, rotate by policy, and retire compromised values.';
  let storage = es ? 'Guardar como secreto; no exponer en frontend, capturas, logs ni URL.' : 'Store as a secret; do not expose it in frontend code, screenshots, logs, or URLs.';
  let risk = es ? 'El mayor fallo suele ser mal uso operativo, no falta de bits.' : 'The main failure is usually operational misuse, not lack of bits.';
  let enterprise = es ? 'Registrar owner, ambiente, fecha de emision, version, expiracion y sistema consumidor.' : 'Record owner, environment, issuance date, version, expiry, and consuming system.';

  if (hay.includes('aes')) {
    purpose = es ? `Clave AES de ${bits} para cifrado simetrico; necesita modo AEAD o modo de almacenamiento definido.` : `${bits} AES key for symmetric encryption; it needs a defined AEAD or storage mode.`;
    validation = es ? 'Decodifica Base64 y verifica tamano exacto de clave: 16/24/32 bytes segun AES-128/192/256.' : 'Decode Base64 and verify exact key size: 16/24/32 bytes for AES-128/192/256.';
    lifecycle = es ? 'Rotar con key id; mantener claves antiguas solo para descifrar historico hasta completar migracion.' : 'Rotate with a key id; keep old keys only to decrypt historical data until migration finishes.';
    storage = es ? 'KMS/HSM o secret manager; nunca localStorage ni codigo cliente.' : 'KMS/HSM or secret manager; never localStorage or client code.';
    risk = es ? 'Nonce/IV repetido en GCM/CTR o clave pegada en logs rompe la seguridad practica.' : 'Repeated nonce/IV in GCM/CTR or logging the key breaks practical security.';
    enterprise = es ? 'Usar AES-GCM/KW/XTS segun caso; documentar AAD, nonce, key id y version de formato.' : 'Use AES-GCM/KW/XTS by case; document AAD, nonce, key id, and format version.';
  } else if (hay.includes('hmac') || category.id === 'macs') {
    purpose = es ? 'Secreto de firma para autenticar mensajes, webhooks o paquetes sin cifrar el contenido.' : 'Signing secret to authenticate messages, webhooks, or packets without encrypting content.';
    validation = es ? 'Verifica longitud minima, algoritmo exacto y canonicalizacion del payload antes de firmar.' : 'Verify minimum length, exact algorithm, and payload canonicalization before signing.';
    lifecycle = es ? 'Rotar con ventana doble: aceptar firma vieja y nueva durante la migracion.' : 'Rotate with a dual window: accept old and new signatures during migration.';
    risk = es ? 'Sin timestamp/nonce, una firma valida puede reutilizarse en replay.' : 'Without timestamp/nonce, a valid signature can be replayed.';
    enterprise = es ? 'Guardar key id, algoritmo, version de canonicalizacion y politica anti-replay.' : 'Store key id, algorithm, canonicalization version, and anti-replay policy.';
  } else if (category.id === 'tokens' || hay.includes('token') || hay.includes('jwt') || hay.includes('api key')) {
    purpose = es ? 'Credencial de acceso o delegacion; representa permiso, no cifrado de datos.' : 'Access or delegation credential; it represents permission, not data encryption.';
    validation = es ? 'Validar scope, audiencia, expiracion, emisor y fingerprint; no depender solo del formato.' : 'Validate scope, audience, expiry, issuer, and fingerprint; do not rely on format alone.';
    lifecycle = es ? 'Preferir expiracion corta, revocacion server-side y rotacion automatizada.' : 'Prefer short expiry, server-side revocation, and automated rotation.';
    storage = es ? 'Guardar hash/fingerprint para auditoria; entregar el valor crudo una sola vez.' : 'Store hash/fingerprint for audit; reveal the raw value only once.';
    risk = es ? 'Un bearer token filtrado equivale a acceso hasta que expire o se revoque.' : 'A leaked bearer token equals access until expiry or revocation.';
    enterprise = es ? 'Aplicar scopes minimos, rate limits, owner, ultimo uso y alerta por uso anomalo.' : 'Apply least scopes, rate limits, owner, last-used tracking, and anomaly alerts.';
  } else if (category.id === 'hashes' || hay.includes('hash') || hay.includes('sha') || hay.includes('blake')) {
    purpose = es ? 'Huella determinista para integridad, deduplicacion o direccionamiento de contenido.' : 'Deterministic fingerprint for integrity, deduplication, or content addressing.';
    validation = es ? 'Comparar longitud hexadecimal/base64 esperada y recalcular desde el artefacto original.' : 'Check expected hex/base64 length and recompute from the original artifact.';
    lifecycle = es ? 'No rota como secreto; se recalcula cuando cambia el payload o algoritmo.' : 'It does not rotate like a secret; recompute when payload or algorithm changes.';
    storage = es ? 'Puede almacenarse visible si no revela datos sensibles; firmarlo si prueba origen.' : 'It can be visible if it reveals no sensitive data; sign it when proving origin.';
    risk = es ? 'Hash solo no autentica: si el atacante cambia archivo y hash, no hay proteccion.' : 'A hash alone does not authenticate: if attacker changes file and hash, there is no protection.';
    enterprise = es ? 'Asociar artefacto, algoritmo, version, firma opcional y fuente de confianza.' : 'Bind artifact, algorithm, version, optional signature, and trust source.';
  } else if (category.id === 'kdf' || hay.includes('argon') || hay.includes('pbkdf') || hay.includes('scrypt') || hay.includes('bcrypt')) {
    purpose = es ? 'Endurece contrasenas o deriva claves desde material humano/debil.' : 'Hardens passwords or derives keys from human/weak input.';
    validation = es ? 'Guardar y verificar sal, parametros de costo, version y salida esperada.' : 'Store and verify salt, cost parameters, version, and expected output.';
    lifecycle = es ? 'Subir costos con el tiempo y rehash al siguiente login o desbloqueo.' : 'Increase costs over time and rehash on next login or unlock.';
    risk = es ? 'Parametros bajos convierten una buena KDF en una defensa debil.' : 'Low parameters turn a good KDF into weak defense.';
    enterprise = es ? 'Definir memoria, iteraciones, paralelismo, SLA de login y plan de upgrade.' : 'Define memory, iterations, parallelism, login SLA, and upgrade plan.';
  } else if (category.id === 'asymmetric' || hay.includes('rsa') || hay.includes('ed25519') || hay.includes('x25519')) {
    purpose = es ? 'Par de claves para identidad, firma o acuerdo; publica y privada tienen roles separados.' : 'Key pair for identity, signature, or agreement; public and private parts have separate roles.';
    validation = es ? 'Verificar curva/tamano, uso permitido, fingerprint publico y proteccion de privada.' : 'Verify curve/size, allowed usage, public fingerprint, and private-key protection.';
    lifecycle = es ? 'Emitir, rotar, revocar y archivar con cadena de confianza documentada.' : 'Issue, rotate, revoke, and archive with documented chain of trust.';
    storage = es ? 'Privada en HSM/enclave/archivo cifrado; publica puede distribuirse.' : 'Private key in HSM/enclave/encrypted file; public key can be distributed.';
    risk = es ? 'Reutilizar una privada para demasiados propositos aumenta impacto de compromiso.' : 'Reusing one private key for too many purposes increases compromise impact.';
    enterprise = es ? 'Separar claves de firma, TLS, SSH y cifrado; registrar certificado y revocacion.' : 'Separate signing, TLS, SSH, and encryption keys; record certificate and revocation.';
  } else if (category.id === 'identifiers') {
    purpose = es ? 'Identificador unico u ordenable; no debe tratarse como secreto de acceso.' : 'Unique or sortable identifier; it must not be treated as an access secret.';
    validation = es ? 'Validar alfabeto, longitud, unicidad y si filtra tiempo, region o volumen.' : 'Validate alphabet, length, uniqueness, and whether it leaks time, region, or volume.';
    lifecycle = es ? 'Normalmente no rota; se invalida o reemplaza si cambia el recurso.' : 'Usually does not rotate; invalidate or replace if the resource changes.';
    risk = es ? 'ID visible sin autorizacion real puede exponer recursos por enumeracion.' : 'Visible ID without real authorization can expose resources through enumeration.';
    enterprise = es ? 'Definir indice, cardinalidad, trazabilidad, privacidad y politica de retencion.' : 'Define index, cardinality, traceability, privacy, and retention policy.';
  } else if (category.id === 'pq' || hay.includes('kyber') || hay.includes('dilithium') || hay.includes('ml-')) {
    purpose = es ? 'Primitiva poscuantica para pilotos, migracion o despliegues hibridos.' : 'Post-quantum primitive for pilots, migration, or hybrid deployments.';
    validation = es ? 'Verificar version de libreria, parametros exactos, tamanos de clave/firma y compatibilidad.' : 'Verify library version, exact parameters, key/signature sizes, and compatibility.';
    lifecycle = es ? 'Mantener agility: poder cambiar parametros o algoritmo sin romper datos historicos.' : 'Keep agility: allow parameter or algorithm changes without breaking historical data.';
    risk = es ? 'Tooling e interoperabilidad aun pueden cambiar; no asumir soporte universal.' : 'Tooling and interoperability can still change; do not assume universal support.';
    enterprise = es ? 'Usar modo hibrido cuando haga falta compatibilidad clasica y auditar dependencia.' : 'Use hybrid mode when classical compatibility is needed and audit dependencies.';
  }

  return {
    headline: purpose,
    rows: [
      [es ? 'Salida exacta' : 'Exact output', output],
      [TL(language, 'validation'), validation],
      [TL(language, 'lifecycle'), lifecycle],
      [TL(language, 'storageRule'), storage],
      [TL(language, 'criticalRisk'), risk],
      [TL(language, 'enterpriseUse'), enterprise],
    ],
    tags: [`${compactText(type.badge)} / ${std}`, bits, engine, category.id],
  };
}

function TechInfo({ type, category, density, language = 'en', t = (k => k) }) {
  if (!type) {
    return (
      <div className="ti-empty">
        <div className="ti-empty-mark" dangerouslySetInnerHTML={{ __html: window.OCG_ICONS.brand(28) }} />
        <div className="ti-empty-t">{TL(language, 'selectTitle')}</div>
        <div className="ti-empty-d">{TL(language, 'selectDesc')}</div>
      </div>
    );
  }

  const guide = buildGuide(type, category, language);
  const concrete = buildConcreteProfile(type, category, language);
  const categoryLabel = window.getCategoryLabel ? window.getCategoryLabel(category, language) : category.label;
  const about = window.translateApprox ? window.translateApprox(language, type.about) : type.about;

  return (
    <div className={`ti ${density}`}>
      <div className="ti-head">
        <div className="ti-cat">{categoryLabel}</div>
        <h2 className="ti-title">{type.label}</h2>
        <div className="ti-badge-row">
          <span className="ti-pill">{type.badge}</span>
          <span className="ti-pill ti-pill-mono">{type.std}</span>
        </div>
      </div>

      <p className="ti-about">{about}</p>
      <p className="ti-subabout">{categoryOneLine(category, language)}</p>

      <div className="ti-quickgrid">
        <div className="ti-quickcard">
          <span>{TL(language, 'outputFormat')}</span>
          <b>{type.engine}</b>
        </div>
        <div className="ti-quickcard">
          <span>{TL(language, 'bestFit')}</span>
          <b>{guide.bestFit}</b>
        </div>
        <div className="ti-quickcard">
          <span>{TL(language, 'posture')}</span>
          <b>{securityPosture(type, category, language)}</b>
        </div>
        <div className="ti-quickcard">
          <span>{TL(language, 'commonHome')}</span>
          <b>{guide.home}</b>
        </div>
      </div>

      <div className="ti-spec">
        <div className="ti-spec-row"><span className="ti-k">{TL(language, 'engine')}</span><span className="ti-v">{type.engine}</span></div>
        <div className="ti-spec-row"><span className="ti-k">{TL(language, 'entropy')}</span><span className="ti-v">{type.entropy}</span></div>
        <div className="ti-spec-row"><span className="ti-k">{TL(language, 'searchSpace')}</span><span className="ti-v">{type.space}</span></div>
        <div className="ti-spec-row"><span className="ti-k">{TL(language, 'standard')}</span><span className="ti-v">{type.std}</span></div>
      </div>

      <div className="ti-concrete">
        <div className="ti-concrete-head">
          <span>{TL(language, 'concreteProfile')}</span>
          <b>{TL(language, 'realPurpose')}</b>
        </div>
        <p>{concrete.headline}</p>
        <div className="ti-tagline">{concrete.tags.map((tag, i) => <span key={`ctag-${i}`}>{tag}</span>)}</div>
        <div className="ti-concrete-rows">
          {concrete.rows.map(([key, value], i) => (
            <div className="ti-concrete-row" key={`concrete-${i}`}>
              <span>{key}</span>
              <b>{value}</b>
            </div>
          ))}
        </div>
      </div>

      <div className="ti-section">
        <h3 className="ti-h3">{TL(language, 'whereUse')}</h3>
        <ul className="ti-ul">{guide.use.map((row, i) => <li key={`use-${i}`}>{row}</li>)}</ul>
      </div>

      <div className="ti-section">
        <h3 className="ti-h3">{TL(language, 'whereNot')}</h3>
        <ul className="ti-ul ti-ul-warn">{guide.avoid.map((row, i) => <li key={`avoid-${i}`}>{row}</li>)}</ul>
      </div>

      <div className="ti-section">
        <h3 className="ti-h3">{TL(language, 'typicalPlaces')}</h3>
        <ul className="ti-ul ti-ul-soft">{guide.where.map((row, i) => <li key={`where-${i}`}>{row}</li>)}</ul>
      </div>

      <div className="ti-section">
        <h3 className="ti-h3">{TL(language, 'opNotes')}</h3>
        <ul className="ti-ul ti-ul-note">{guide.notes.map((row, i) => <li key={`note-${i}`}>{row}</li>)}</ul>
      </div>

      <div className="ti-foot">
        <div className="ti-foot-row"><span>{TL(language, 'id')}</span><b>{type.id}</b></div>
        <div className="ti-foot-row"><span>{TL(language, 'category')}</span><b>{category.id}</b></div>
      </div>
    </div>
  );
}

window.TechInfo = TechInfo;
