<?php
/** Optional, needs internet: seals against the default public TSAs (DigiCert + Sectigo) and verifies the chains with the system CA bundle. */
if (!getenv('CONSTANCIA_LIVE_TSA')) { echo "  [SKIP] set CONSTANCIA_LIVE_TSA=1 to run against the real TSAs\n"; exit(0); }
$tmp = sys_get_temp_dir() . '/constancia_live_' . getmypid(); mkdir($tmp, 0700, true);
putenv('HASHCOD_SEAL_DB=' . $tmp . '/db.sqlite');
putenv('HASHCOD_SEAL_ED25519_SEED_B64=' . base64_encode(random_bytes(32)));
require_once __DIR__ . '/../constancia-lib.php';
$r = constanciaSeal(['holderType' => 'persona_fisica', 'holderName' => 'Prueba', 'assetName' => 'X', 'assetType' => 'code', 'version' => '1', 'aiUse' => 'none', 'visibility' => 'public', 'declaration' => true, 'digest' => hash('sha512', 'live')]);
$row = constanciaDb()->query('SELECT * FROM constancias')->fetch();
$v = constanciaVerifyPackage(constanciaReadCod($row['cod']), constanciaDidDocument(), constanciaCaFile());
$ids = array_column($v['checks'], 'ok', 'id');
echo ($v['ok'] && $v['chain'] && ($ids['anchor'] ?? false) ? '  [PASS]' : '  [FAIL]') . " live TSAs: sealed {$r['number']} at {$r['genTime']}, chains verified, external anchor ok\n";
foreach ($v['checks'] as $c) echo '     ' . ($c['ok'] ? 'ok ' : 'NO ') . $c['label'] . ' — ' . $c['detail'] . "\n";
constanciaRun(['rm', '-rf', $tmp]);
exit($v['ok'] ? 0 : 1);
