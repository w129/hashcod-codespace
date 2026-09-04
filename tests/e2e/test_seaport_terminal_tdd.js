/**
 * TDD Test Suite: Puerto Marítimo de Datos & Warp Bash Terminal
 * Metodología: SDD + TDD Invariant Enforcement
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passedTests = 0;
let totalTests = 0;

function test(name, fn) {
    totalTests++;
    try {
        fn();
        passedTests++;
        console.log(`  ✓ ${name}`);
    } catch (err) {
        console.error(`  ✗ ${name}`);
        console.error(`    Error: ${err.message}`);
        process.exitCode = 1;
    }
}

async function testAsync(name, fn) {
    totalTests++;
    try {
        await fn();
        passedTests++;
        console.log(`  ✓ ${name}`);
    } catch (err) {
        console.error(`  ✗ ${name}`);
        console.error(`    Error: ${err.message}`);
        process.exitCode = 1;
    }
}

async function runAllTests() {
    console.log('================================================================================');
    console.log('  HASHCOD CODESPACE — DATA SEAPORT (PUERTO MARITIMO) TDD TEST SUITE             ');
    console.log('================================================================================\n');

    // 1. Invariantes de Archivos y Scripts
    console.log('--- [SUITE 1] Invariantes Estructurales y Archivos Fuente ---');
    test('[SUITE 1] components/data-seaport.js existe y contiene el motor del puerto', () => {
        const p = path.join(__dirname, '../../components/data-seaport.js');
        assert.ok(fs.existsSync(p), 'components/data-seaport.js debe existir');
        const content = fs.readFileSync(p, 'utf8');
        assert.ok(content.includes('DataSeaport'), 'Debe definir DataSeaport');
        assert.ok(content.includes('dock-01'), 'Debe configurar los muelles iniciales');
    });

    test('[SUITE 1] warp-terminal.js tiene integrado DataSeaport y showSeaportWindow', () => {
        const p = path.join(__dirname, '../../components/warp-terminal.js');
        const content = fs.readFileSync(p, 'utf8');
        assert.ok(content.includes('window.DataSeaport.handleCommand'), 'executeCommand debe interceptar comandos de puerto');
        assert.ok(content.includes('showSeaportWindow'), 'Debe exponer la ventana interactiva del puerto');
        assert.ok(content.includes('seaport:'), 'TOOL_WINDOWS debe tener registrada la herramienta seaport');
    });

    test('[SUITE 1] index.php, index.html y 404.html incluyen data-seaport.js', () => {
        ['index.php', 'index.html', '404.html'].forEach(f => {
            const p = path.join(__dirname, '../../', f);
            const text = fs.readFileSync(p, 'utf8');
            assert.ok(text.includes('components/data-seaport.js'), `${f} debe incluir el script components/data-seaport.js`);
        });
    });

    test('[SUITE 1] Balance de etiquetas HTML es exactamente Diff: 0 en todos los templates', () => {
        ['index.php', 'index.html', '404.html'].forEach(f => {
            const p = path.join(__dirname, '../../', f);
            const text = fs.readFileSync(p, 'utf8');
            const openDiv = (text.match(/<div(\s|>)/gi) || []).length;
            const closeDiv = (text.match(/<\/div>/gi) || []).length;
            assert.strictEqual(openDiv, closeDiv, `${f} debe mantener balance DOM exacto de divs (open: ${openDiv}, close: ${closeDiv})`);
        });
    });

    // 2. Comandos CLI Marítimos
    console.log('\n--- [SUITE 2] Comandos CLI Marítimos (Grammar & Parsers) ---');
    const DataSeaport = require('../../components/data-seaport.js');

    await testAsync('[SUITE 2] Comando "port status" reporta estado general y enlace LocalStack', async () => {
        const res = await DataSeaport.handleCommand('port status');
        assert.ok(typeof res === 'string');
        assert.ok(res.includes('PUERTO MARÍTIMO DE DATOS'), 'Debe mostrar cabecera de puerto');
        assert.ok(res.includes('Muelles Activos'), 'Debe listar muelles activos');
        assert.ok(res.includes('LocalStack'), 'Debe referenciar estado de LocalStack');
    });

    await testAsync('[SUITE 2] Comando "port map" renderiza plano ASCII náutico con muelles y canal', async () => {
        const res = await DataSeaport.handleCommand('port map');
        assert.ok(typeof res === 'string');
        assert.ok(res.includes('TERMINAL DE ATRAQUE'), 'Debe contener título de mapa');
        assert.ok(res.includes('MUELLE 1: KINESIS'), 'Debe incluir Muelle 1');
        assert.ok(res.includes('MUELLE 2: DILITHIUM-5'), 'Debe incluir Muelle 2');
        assert.ok(res.includes('CANAL PRINCIPAL'), 'Debe ilustrar el canal principal');
    });

    await testAsync('[SUITE 2] Comando "cargo manifest dock-01" lista contenedores y payloads', async () => {
        const res = await DataSeaport.handleCommand('cargo manifest dock-01');
        assert.ok(typeof res === 'string');
        assert.ok(res.includes('CNT-KIN-101'), 'Debe mostrar contenedor Kinesis 101');
        assert.ok(res.includes('KINESIS_RECORD'), 'Debe mostrar tipo de carga');
        assert.ok(res.includes('CLEARED'), 'Debe confirmar aduana liberada');
    });

    await testAsync('[SUITE 2] Comando "cargo inspect CNT-D5-9821" realiza inspección post-cuántica', async () => {
        const res = await DataSeaport.handleCommand('cargo inspect CNT-D5-9821');
        assert.ok(typeof res === 'string');
        assert.ok(res.includes('INSPECCIÓN FORENSE DE CONTENEDOR: CNT-D5-9821'), 'Debe contener cabecera forense');
        assert.ok(res.includes('Dilithium-5 Verified'), 'Debe certificar firma PQC');
    });

    await testAsync('[SUITE 2] Comando "cargo unload dock-01" descarga contenedores y libera grúa', async () => {
        const res = await DataSeaport.handleCommand('cargo unload dock-01');
        assert.ok(typeof res === 'string');
        assert.ok(res.includes('ha completado la descarga'), 'Debe confirmar descarga de grúa');
        const dock = DataSeaport.getState().docks.find(d => d.id === 'dock-01');
        assert.strictEqual(dock.load, 0, 'Carga de muelle 1 debe quedar en 0');
    });

    await testAsync('[SUITE 2] Comando "dock VESSEL-SQS-008 dock-03" atraca buque de fondeo en muelle libre', async () => {
        const res = await DataSeaport.handleCommand('dock VESSEL-SQS-008 dock-03');
        assert.ok(typeof res === 'string');
        assert.ok(res.includes('atracado exitosamente'), 'Debe confirmar atraque');
        const dock = DataSeaport.getState().docks.find(d => d.id === 'dock-03');
        assert.strictEqual(dock.status, 'BERTHED', 'Muelle 3 debe pasar a estado BERTHED');
    });

    await testAsync('[SUITE 2] Comando "customs scan" audita firmas Dilithium-5 y KMS sin errores', async () => {
        const res = await DataSeaport.handleCommand('customs scan');
        assert.ok(typeof res === 'string');
        assert.ok(res.includes('INICIANDO ESCANEO ADUANERO'), 'Debe iniciar auditoría');
        assert.ok(res.includes('0 amenazas detectadas'), 'Debe certificar 0 amenazas');
    });

    await testAsync('[SUITE 2] Comando "port dispatch dock-03" despacha buque zarpando a la nube', async () => {
        const res = await DataSeaport.handleCommand('port dispatch dock-03');
        assert.ok(typeof res === 'string');
        assert.ok(res.includes('despachado y zarpando'), 'Debe confirmar zarpado');
        const dock = DataSeaport.getState().docks.find(d => d.id === 'dock-03');
        assert.strictEqual(dock.status, 'IDLE', 'Muelle 3 debe volver a IDLE');
    });

    // 3. Integración LocalStack & Auth Token
    console.log('\n--- [SUITE 3] LocalStack Integration & Auth Token Bridge ---');
    await testAsync('[SUITE 3] Token Personal del usuario se almacena y se expone en estado', async () => {
        const userToken = 'ls-XakIpUWA-ZOyE-0900-kOku-6560Vota9ae9';
        DataSeaport.setAuthToken(userToken);
        const state = DataSeaport.getState();
        assert.strictEqual(state.authToken, userToken, 'Token en estado debe coincidir con el token del usuario');
    });

    await testAsync('[SUITE 3] Comando "seaport health" responde con fallback emulado transparente', async () => {
        const res = await DataSeaport.handleCommand('seaport health');
        assert.ok(typeof res === 'string');
        assert.ok(res.includes('LocalStack'), 'Debe responder con diagnóstico LocalStack');
    });

    // 4. Ingesta Dinámica de Eventos Dilithium-5
    console.log('\n--- [SUITE 4] Ingesta Dinámica de Eventos de Codespace ---');
    test('[SUITE 4] ingestDilithiumEvent crea nuevo contenedor en Muelle 2 y audita en manifiesto', () => {
        const initialProcessed = DataSeaport.getState().totalContainersProcessed;
        DataSeaport.ingestDilithiumEvent('ROTACION_PRUEBA_TDD', 'sig-test-vector-001');
        const manifest = DataSeaport.getState().manifests['dock-02'];
        assert.ok(manifest && manifest.length > 0, 'Manifiesto de Muelle 2 debe contener elementos');
        assert.strictEqual(manifest[0].type, 'DILITHIUM5_ROTATION', 'El tipo de carga debe ser DILITHIUM5_ROTATION');
        assert.strictEqual(DataSeaport.getState().totalContainersProcessed, initialProcessed + 1, 'Contador de contenedores procesados debe incrementar');
    });

    console.log('\n================================================================================');
    console.log(`  RESULTS: ${passedTests} PASSED | ${totalTests - passedTests} FAILED`);
    console.log('================================================================================\n');
    if (totalTests === passedTests) {
        console.log('  >>> TODOS LOS TESTS DEL PUERTO MARITIMO PASARON AL 100%!');
    }
}

runAllTests().catch(e => {
    console.error('Test runner exception:', e);
    process.exit(1);
});
