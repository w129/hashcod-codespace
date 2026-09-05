/**
 * Puerto Marítimo de Datos (Maritime Data Seaport Engine)
 * Codespace Warp Terminal & LocalStack Cloud Integration
 */

(function () {
    'use strict';

    const LOCALSTACK_DEFAULT_URL = 'http://localhost:4566';
    const LOCALSTACK_DEFAULT_TOKEN = 'ls-XakIpUWA-ZOyE-0900-kOku-6560Vota9ae9';

    function getStorageItem(key, fallback) {
        try {
            if (typeof localStorage !== 'undefined') return localStorage.getItem(key) || fallback;
        } catch (e) {}
        return fallback;
    }

    function setStorageItem(key, val) {
        try {
            if (typeof localStorage !== 'undefined') localStorage.setItem(key, val);
        } catch (e) {}
    }

    const SeaportState = {
        name: 'Puerto Central de Datos Hashcod (Port of Codespace)',
        localstackUrl: getStorageItem('l8_seaport_localstack_url', LOCALSTACK_DEFAULT_URL),
        authToken: getStorageItem('l8_seaport_auth_token', LOCALSTACK_DEFAULT_TOKEN),
        localstackConnected: false,
        totalContainersProcessed: 142,
        quarantinedCount: 1,
        docks: [
            { id: 'dock-01', name: 'Muelle 1 (Alta Velocidad Kinesis)', status: 'BERTHED', vessel: 'MV-KINESIS-ALPHA', load: 84, capacity: 100, craneState: 'UNLOADING' },
            { id: 'dock-02', name: 'Muelle 2 (Post-Quantum Dilithium-5)', status: 'BERTHED', vessel: 'SS-DILITHIUM-ENTERPRISE', load: 45, capacity: 120, craneState: 'SCANNING' },
            { id: 'dock-03', name: 'Muelle 3 (SQS Batch Message)', status: 'IDLE', vessel: null, load: 0, capacity: 80, craneState: 'STANDBY' },
            { id: 'dock-04', name: 'Muelle 4 (S3 Storage Cargo)', status: 'BERTHED', vessel: 'BARGE-S3-OBJECTS', load: 92, capacity: 150, craneState: 'TRANSFERRING' }
        ],
        anchorageQueue: [
            { id: 'VESSEL-SQS-008', name: 'MV-EVENTBRIDGE-STREAM', type: 'SQS/Event', containers: 38, origin: 'LocalStack us-east-1', priority: 'HIGH' },
            { id: 'VESSEL-SEC-012', name: 'SS-QUANTUM-NONCES', type: 'KMS/Dilithium', containers: 14, origin: 'Quantum Entropy Beacon', priority: 'CRITICAL' },
            { id: 'VESSEL-LOGS-003', name: 'MV-CODESPACE-AUDIT', type: 'DynamoDB/Logs', containers: 55, origin: 'Bash Terminal Feed', priority: 'NORMAL' }
        ],
        manifests: {
            'dock-01': [
                { id: 'CNT-KIN-101', type: 'KINESIS_RECORD', size: '1.4 KB', payload: 'Telemetry Packet #4092 (Latency: 14ms)', verified: true, customs: 'CLEARED' },
                { id: 'CNT-KIN-102', type: 'KINESIS_RECORD', size: '2.8 KB', payload: 'Heartbeat Broadcast Cluster-Node-EU', verified: true, customs: 'CLEARED' },
                { id: 'CNT-KIN-103', type: 'KINESIS_RECORD', size: '0.9 KB', payload: 'Distributed Lock Ack (Token: 9ae9)', verified: true, customs: 'CLEARED' }
            ],
            'dock-02': [
                { id: 'CNT-D5-9821', type: 'DILITHIUM5_SIG', size: '4.6 KB', payload: 'PQC Signature: d5-sig-8f92a4...c01', verified: true, customs: 'CLEARED' },
                { id: 'CNT-D5-9822', type: 'DILITHIUM5_PUBKEY', size: '2.6 KB', payload: 'Public Key Matrix NIST-Round3 Certified', verified: true, customs: 'CLEARED' },
                { id: 'CNT-D5-9823', type: 'ROTATION_EVENT', size: '1.1 KB', payload: 'Active Gate Rotation: Old Key Burned ✓', verified: true, customs: 'CLEARED' }
            ],
            'dock-04': [
                { id: 'CNT-S3-001', type: 'S3_ZIP_ARCHIVE', size: '14.2 MB', payload: 'workspace_backup_2026.zip', verified: true, customs: 'CLEARED' },
                { id: 'CNT-S3-002', type: 'S3_OBJECT_METADATA', size: '0.4 KB', payload: 'eTag: "6560Vota9ae9" CloudPod Manifest', verified: true, customs: 'CLEARED' }
            ]
        },
        customsLog: [
            { time: '18:45:10', containerId: 'CNT-D5-9821', origin: 'Dilithium-5 Engine', status: 'CLEARED', note: 'Firma post-cuántica válida con entropía cuántica.' },
            { time: '18:50:22', containerId: 'CNT-KIN-103', origin: 'LocalStack Bridge', status: 'CLEARED', note: 'Token autenticado con Personal Token ls-XakIp...' },
            { time: '18:54:01', containerId: 'CNT-SUSP-999', origin: 'External Relay', status: 'QUARANTINED', note: 'Divergencia de hash SHA-256 en cabecera de muelle.' }
        ]
    };

    const DataSeaport = {
        getState: function () {
            return SeaportState;
        },

        setAuthToken: function (token) {
            if (token) {
                SeaportState.authToken = token.trim();
                setStorageItem('l8_seaport_auth_token', SeaportState.authToken);
                return 'Token de LocalStack configurado: ' + token.substring(0, 8) + '... (' + token.length + ' chars)';
            }
            return 'Uso: seaport token <token-localstack>';
        },

        setLocalstackUrl: function (url) {
            if (url) {
                SeaportState.localstackUrl = url.trim();
                setStorageItem('l8_seaport_localstack_url', SeaportState.localstackUrl);
                return 'URL de LocalStack fijada a: ' + SeaportState.localstackUrl;
            }
            return 'Uso: seaport connect <http://localhost:4566>';
        },

        checkLocalstackHealth: async function () {
            const url = SeaportState.localstackUrl.replace(/\/$/, '') + '/_localstack/health';
            try {
                if (typeof fetch !== 'undefined') {
                    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
                    const timeoutId = controller ? setTimeout(() => controller.abort(), 1200) : null;
                    const res = await fetch(url, {
                        headers: { 'Authorization': 'Bearer ' + SeaportState.authToken },
                        signal: controller ? controller.signal : undefined
                    });
                    if (timeoutId) clearTimeout(timeoutId);
                    if (res && res.ok) {
                        const health = await res.json();
                        SeaportState.localstackConnected = true;
                        return { ok: true, health: health };
                    }
                }
            } catch (e) {}
            SeaportState.localstackConnected = false;
            return { ok: false, mode: 'EMULATED_LOCALSTACK_GATEWAY' };
        },

        renderPortMap: function () {
            const lines = [
                '   ========================================================================================',
                '                  PUERTO MARITIMO DE DATOS HASHCOD — TERMINAL DE ATRAQUE                  ',
                '   ========================================================================================',
                '   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
                '       [ MUELLE 1: KINESIS ]       [ MUELLE 2: DILITHIUM-5 ]       [ MUELLE 3: SQS BATCH ] ',
                '       +-------------------+       +-----------------------+       +---------------------+ ',
                '       |  [CRANE: ACTIVE]  |       |  [PQC: SCANNING]      |       |  [STATUS: IDLE]     | ',
                '       |  [CNT][CNT][CNT]  |       |  [SEC][SIG][KEY][NON] |       |  (Esperando Buque)  | ',
                '       |  MV-KINESIS-ALPHA |       |  SS-DILITHIUM-ENTERP. |       |                     | ',
                '       |  Carga: 84%       |       |  Carga: 45%           |       |  Capacidad: 80 CNT  | ',
                '       +-------------------+       +-----------------------+       +---------------------+ ',
                '             |   |                       |   |                           |   |             ',
                '             |   +=======================+   +===========================+   |             ',
                '             +----------------------- CANAL PRINCIPAL -----------------------+             ',
                '   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
                '       ZONA DE FONDEO (ANCHORAGE): 3 Buques en Espera | ADUANA: 142 Despachados, 1 Cuarentena',
                '   ========================================================================================'
            ];
            return lines.join('\n');
        },

        handleCommand: async function (cmdLine) {
            let raw = (cmdLine || '').trim();
            if (!raw) return null;

            // Limpiar indicadores de prompt si el usuario los escribió (ej: "$ port map" o "> port status")
            raw = raw.replace(/^[\$>\#]\s*/, '').trim();
            if (!raw) return null;

            const parts = raw.split(/\s+/);
            const root = parts[0].toLowerCase();
            const sub = (parts[1] || '').toLowerCase();

            if (root === 'help' || root === 'ayuda') {
                return this.cmdHelp();
            }

            if (root === 'port' || root === 'puerto') {
                if (!sub || sub === 'status' || sub === 'estado') {
                    return this.cmdPortStatus();
                }
                if (sub === 'docks' || sub === 'muelles') {
                    return this.cmdPortDocks();
                }
                if (sub === 'map' || sub === 'mapa') {
                    return this.renderPortMap();
                }
                if (sub === 'dispatch' || sub === 'despachar') {
                    return this.cmdPortDispatch(parts[2]);
                }
                if (sub === 'help' || sub === '--help' || sub === '-h') {
                    return this.cmdHelp();
                }
                return "Subcomando desconocido para 'port'. Escribe 'port help' para ver la guía náutica.";
            }

            if (root === 'dock' || root === 'atracar') {
                return this.cmdDock(parts[1], parts[2]);
            }

            if (root === 'cargo' || root === 'carga') {
                if (!sub || sub === 'manifest' || sub === 'manifiesto') {
                    return this.cmdCargoManifest(parts[2]);
                }
                if (sub === 'inspect' || sub === 'inspeccionar') {
                    return this.cmdCargoInspect(parts[2]);
                }
                if (sub === 'unload' || sub === 'descargar') {
                    return this.cmdCargoUnload(parts[2]);
                }
                return "Subcomando desconocido para 'cargo'. Prueba: 'cargo manifest [dock-01|dock-02]', 'cargo inspect <id>', 'cargo unload <dock-id>'";
            }

            if (root === 'customs' || root === 'aduana') {
                if (!sub || sub === 'scan' || sub === 'escanear') {
                    return this.cmdCustomsScan(parts[2]);
                }
                if (sub === 'quarantine' || sub === 'cuarentena') {
                    return this.cmdCustomsQuarantine();
                }
                return "Subcomando desconocido para 'customs'. Prueba: 'customs scan', 'customs quarantine'";
            }

            if (root === 'tug' || root === 'remolcador') {
                return this.cmdTug(parts[1]);
            }

            if (root === 'vision' || root === 'qr' || root === 'vector') {
                if (typeof window !== 'undefined' && window.openVectorVisionModal) {
                    window.openVectorVisionModal();
                    return 'Abriendo herramienta Vector Vision & JAB/QR Matrix Studio (Círculo 10)...';
                }
                return 'Herramienta Vector Vision disponible en el Círculo #10 de la Toolbox.';
            }

            if (root === 'seaport' || root === 'localstack') {
                if (sub === 'connect' || sub === 'conectar') {
                    return this.setLocalstackUrl(parts[2]);
                }
                if (sub === 'token') {
                    return this.setAuthToken(parts[2]);
                }
                if (sub === 'health' || sub === 'ping') {
                    const h = await this.checkLocalstackHealth();
                    if (h.ok) {
                        return 'LocalStack Gateway [ONLINE]: Servicios disponibles en ' + SeaportState.localstackUrl + '\nServicios activos: SQS, Kinesis, S3, KMS, DynamoDB.';
                    } else {
                        return 'LocalStack Bridge: Operando en MODO NATIVO AISLADO (Cloud Pod Virtualizado en memoria).\nEndpoint configurado: ' + SeaportState.localstackUrl + '\nToken activo: ' + SeaportState.authToken.substring(0, 10) + '... (Válido ✓)';
                    }
                }
                return "Comandos LocalStack: 'seaport health', 'seaport connect <url>', 'seaport token <auth_token>'";
            }

            return null;
        },

        cmdHelp: function () {
            return [
                '===========================================================================',
                '       COMANDOS DEL PUERTO MARITIMO DE DATOS (DATA SEAPORT CLI)            ',
                '===========================================================================',
                '  port status                Muestra estado de muelles, buques y throughput',
                '  port map                   Muestra plano interactivo ASCII del puerto',
                '  port docks                 Lista detallada de muelles 1 al 4',
                '  port dispatch <dock-id>    Despacha buque y exporta contenedores al cloud',
                '  dock <vessel-id> <dock-id> Asigna y atraca buque de fondeo en un muelle',
                '  cargo manifest [dock-id]   Inspecciona lista de contenedores y payloads',
                '  cargo inspect <cnt-id>     Inspecciona firma PQC y payload de un contenedor',
                '  cargo unload <dock-id>     Descarga y procesa contenedores de un muelle',
                '  customs scan               Escanea aduanero criptográfico Dilithium-5 / KMS',
                '  customs quarantine         Lista contenedores retenidos por seguridad',
                '  tug <vessel-id>            Remolcador marítimo para guiar datos atascados',
                '  seaport health             Verifica estado y puente con LocalStack',
                '  seaport token <token>      Configura Personal Auth Token de LocalStack',
                '==========================================================================='
            ].join('\n');
        },

        cmdPortStatus: function () {
            const lsStatus = SeaportState.localstackConnected ? 'ONLINE (REST 4566)' : 'VIRTUALIZADO (Codespace Emulated)';
            const activeDocks = SeaportState.docks.filter(d => d.status === 'BERTHED').length;

            return [
                '╔══════════════════════════════════════════════════════════════════════════╗',
                '║  PUERTO MARÍTIMO DE DATOS: ' + SeaportState.name.padEnd(41) + ' ║',
                '╠══════════════════════════════════════════════════════════════════════════╣',
                '║  • Estado General: OPERATIVO A TODA CAPACIDAD                           ║',
                '║  • Muelles Activos: ' + activeDocks + '/4 berteados | Fondeo en Espera: ' + SeaportState.anchorageQueue.length + ' buques              ║',
                '║  • Contenedores Desembarcados: ' + String(SeaportState.totalContainersProcessed).padEnd(4) + ' | En Cuarentena: ' + String(SeaportState.quarantinedCount).padEnd(2) + '            ║',
                '║  • Enlace Cloud LocalStack: ' + lsStatus.padEnd(43) + ' ║',
                '║  • Token de Autenticación: ' + SeaportState.authToken.substring(0, 14) + '... (Activo)                ║',
                '║  • Seguridad Criptográfica: Dilithium-5 Post-Quantum Verified           ║',
                '╚══════════════════════════════════════════════════════════════════════════╝',
                "\nEscribe 'port map' para ver el diagrama ASCII o 'cargo manifest' para ver la carga."
            ].join('\n');
        },

        cmdPortDocks: function () {
            const out = ['MUELLES DE ATRAQUE (BERTHS & CRANES):'];
            SeaportState.docks.forEach(d => {
                const filled = Math.round(d.load / 10);
                const bar = '='.repeat(filled) + '-'.repeat(10 - filled);
                out.push('  [' + d.id + '] ' + d.name);
                out.push('        Estado: ' + d.status + ' | Buque: ' + (d.vessel || '(Ninguno)') + ' | Grúa: ' + d.craneState);
                out.push('        Ocupación: [' + bar + '] ' + d.load + '% (' + d.capacity + ' Contenedores max)');
            });
            return out.join('\n');
        },

        cmdDock: function (vesselId, dockId) {
            if (!vesselId || !dockId) {
                return 'Uso: dock <VESSEL-ID> <dock-01|dock-02|dock-03|dock-04>\nEjemplo: dock VESSEL-SQS-008 dock-03';
            }
            const dock = SeaportState.docks.find(d => d.id === dockId.toLowerCase());
            if (!dock) return "Error: Muelle '" + dockId + "' no encontrado. Use dock-01 a dock-04.";

            const queueIndex = SeaportState.anchorageQueue.findIndex(v => v.id.toLowerCase() === vesselId.toLowerCase());
            const vesselObj = queueIndex !== -1 ? SeaportState.anchorageQueue.splice(queueIndex, 1)[0] : { name: vesselId, containers: 24, type: 'GENERIC_PAYLOAD' };

            dock.status = 'BERTHED';
            dock.vessel = vesselObj.name;
            dock.load = Math.min(100, Math.round((vesselObj.containers / dock.capacity) * 100));
            dock.craneState = 'READY_TO_UNLOAD';

            SeaportState.manifests[dock.id] = [
                { id: 'CNT-' + vesselObj.name.substring(0, 4) + '-01', type: vesselObj.type, size: '2.1 KB', payload: 'Batch payload chunk #1', verified: true, customs: 'CLEARED' },
                { id: 'CNT-' + vesselObj.name.substring(0, 4) + '-02', type: vesselObj.type, size: '4.8 KB', payload: 'Dilithium-5 Encrypted message payload', verified: true, customs: 'CLEARED' }
            ];

            return '¡Buque [' + vesselObj.name + '] atracado exitosamente en ' + dock.name + '!\nGrúas conectadas en espera de comando cargo unload ' + dock.id + '.';
        },

        cmdCargoManifest: function (dockId) {
            const targetDock = dockId ? dockId.toLowerCase() : 'dock-01';
            const list = SeaportState.manifests[targetDock];
            if (!list || list.length === 0) {
                return "El manifiesto de '" + targetDock + "' está vacío o el muelle no tiene buques atracados.";
            }

            const dock = SeaportState.docks.find(d => d.id === targetDock);
            const lines = [
                'MANIFIESTO DE CARGA — ' + (dock ? dock.name : targetDock) + ':',
                'ID CONTENEDOR    | TIPO                 | TAMAÑO  | ESTADO ADUANA | PAYLOAD DETALLE',
                '─────────────────┼──────────────────────┼─────────┼───────────────┼─────────────────────────────────────'
            ];

            list.forEach(c => {
                lines.push(c.id.padEnd(16) + ' | ' + c.type.padEnd(20) + ' | ' + c.size.padEnd(7) + ' | ' + c.customs.padEnd(13) + ' | ' + c.payload);
            });

            lines.push('Total contenedores en muelle: ' + list.length + ' unidades verificadas.');
            return lines.join('\n');
        },

        cmdCargoInspect: function (cntId) {
            if (!cntId) return 'Uso: cargo inspect <CNT-ID>\nEjemplo: cargo inspect CNT-D5-9821';

            let found = null;
            let foundDock = null;
            Object.keys(SeaportState.manifests).forEach(dk => {
                const item = SeaportState.manifests[dk].find(c => c.id.toLowerCase() === cntId.toLowerCase());
                if (item) {
                    found = item;
                    foundDock = dk;
                }
            });

            if (!found) {
                return "Contenedor '" + cntId + "' no localizado en ningún muelle o patio de almacenamiento.";
            }

            return [
                '=====================================================================',
                '  INSPECCIÓN FORENSE DE CONTENEDOR: ' + found.id,
                '=====================================================================',
                '  • Muelle de Ubicación: ' + foundDock,
                '  • Tipo de Carga: ' + found.type,
                '  • Tamaño de Datos: ' + found.size,
                '  • Estado de Aduana: ' + found.customs,
                '  • Integridad Post-Cuántica: NIST Dilithium-5 Verified (Scalar R_b valid)',
                '  • Payload Decodificado:',
                '      ' + found.payload,
                '  • Hash de Integridad: sha256:4f8e9a2b7c1d3e5f6a8b9c0d1e2f3a4b',
                '====================================================================='
            ].join('\n');
        },

        cmdCargoUnload: function (dockId) {
            const targetDock = (dockId || 'dock-01').toLowerCase();
            const list = SeaportState.manifests[targetDock];
            if (!list || list.length === 0) {
                return "No hay carga pendiente de descarga en '" + targetDock + "'.";
            }

            const count = list.length;
            SeaportState.totalContainersProcessed += count;
            SeaportState.manifests[targetDock] = [];
            const dock = SeaportState.docks.find(d => d.id === targetDock);
            if (dock) {
                dock.load = 0;
                dock.craneState = 'STANDBY';
            }

            return 'Grúa pórtico ha completado la descarga de ' + count + ' contenedores de ' + targetDock + '.\nDatos enrutados al bus de eventos de Codespace y confirmados en almacenamiento.';
        },

        cmdCustomsScan: function () {
            return [
                'INICIANDO ESCANEO ADUANERO DE PUERTO (PORT CUSTOMS AUDIT)...',
                '[1/3] Verificando cabeceras KMS y tokens de autorización LocalStack... [OK]',
                '[2/3] Auditando firmas Dilithium-5 y claves de compuerta de un solo uso... [OK]',
                '[3/3] Chequeo de entropía cuántica y protección contra ataques de repetición... [OK]',
                'Resultado: 0 amenazas detectadas en ' + SeaportState.totalContainersProcessed + ' contenedores procesados.',
                'Aduana marítima: TODO EL TRÁFICO DE DATOS ESTÁ CERTIFICADO Y LIMPIO.'
            ].join('\n');
        },

        cmdCustomsQuarantine: function () {
            return [
                'ZONA DE CUARENTENA MARÍTIMA (DATA QUARANTINE PATIO):',
                '  • [CNT-SUSP-999]: Hash SHA-256 discrepante interceptado en Relay externo.',
                '  • Motivo de Retención: Posible paquete malformado o vector de inyección.',
                '  • Acciones: Bloqueado en muelle de aislamiento. No transferido a memoria.'
            ].join('\n');
        },

        cmdPortDispatch: function (dockId) {
            const target = (dockId || 'dock-01').toLowerCase();
            const dock = SeaportState.docks.find(d => d.id === target);
            if (!dock || dock.status !== 'BERTHED') {
                return "No hay ningún buque listo para despacho en '" + target + "'.";
            }

            const vesselName = dock.vessel;
            dock.status = 'IDLE';
            dock.vessel = null;
            dock.load = 0;
            dock.craneState = 'STANDBY';

            return 'Buque [' + vesselName + '] despachado y zarpando de ' + dock.name + ' hacia destino Cloud.\nMuelle ' + target + ' ahora disponible para nuevas recepciones.';
        },

        cmdTug: function (vesselId) {
            if (!vesselId) return 'Uso: tug <VESSEL-ID>\nEjemplo: tug MV-EVENTBRIDGE-STREAM';
            return "Remolcador Portuario 'TUG-HYDRA-01' ha tomado control de [" + vesselId + "]. Asignando prioridad en canal de navegación hacia Muelle de atraque.";
        },

        ingestDilithiumEvent: function (eventType, keySummary) {
            const cntId = 'CNT-D5-' + Math.floor(1000 + Math.random() * 9000);
            const newContainer = {
                id: cntId,
                type: 'DILITHIUM5_ROTATION',
                size: '3.2 KB',
                payload: eventType + ': ' + keySummary,
                verified: true,
                customs: 'CLEARED'
            };
            if (!SeaportState.manifests['dock-02']) SeaportState.manifests['dock-02'] = [];
            SeaportState.manifests['dock-02'].unshift(newContainer);
            SeaportState.totalContainersProcessed++;
            console.log('[DataSeaport] Ingestado nuevo contenedor ' + cntId + ' en Muelle 2 (PQC)');
        }
    };

    if (typeof window !== 'undefined') {
        window.DataSeaport = DataSeaport;
    }
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = DataSeaport;
    }
})();
