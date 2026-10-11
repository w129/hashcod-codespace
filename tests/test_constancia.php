<?php
/** Constancias: crypto primitives, sealing against a local RFC 3161 TSA, verification, tamper detection, ledger, seal. */
$tmp = sys_get_temp_dir() . '/constancia_test_' . getmypid();
mkdir($tmp, 0700, true);
putenv('HASHCOD_SEAL_DB=' . $tmp . '/db.sqlite');
putenv('HASHCOD_SEAL_DOMAIN=hashcodcodespace.dev');
putenv('HASHCOD_TSA2_URL=off');
putenv('HASHCOD_SEAL_KEY_ID=key-2026-01');
putenv('HASHCOD_SEAL_ED25519_SEED_B64=' . base64_encode(random_bytes(32)));
require_once __DIR__ . '/../constancia-lib.php';

$failed = 0;
function check(bool $ok, string $name): void { global $failed; echo ($ok ? '  [PASS] ' : '  [FAIL] ') . $name . "\n"; if (!$ok) $failed++; }

// --- JCS (RFC 8785 examples) and base58btc
check(constanciaJcs(['b' => 1, 'a' => ['y' => true, 'x' => null], 'é' => "ü/\n"]) === '{"a":{"x":null,"y":true},"b":1,"é":"ü/\n"}', 'JCS sorts keys, drops whitespace, keeps / and unicode');
check(constanciaJcs(["\u{10000}" => 1, "\u{ffff}" => 2]) === "{\"\u{10000}\":1,\"\u{ffff}\":2}", 'JCS sorts by UTF-16 code units (surrogates before U+FFFF)');
check(constanciaBase58Encode("\0\0hello") === '11Cn8eVZg' && constanciaBase58Decode('11Cn8eVZg') === "\0\0hello", 'base58btc round trip with leading zeros');
check(constanciaBase58Decode('0OIl') === null, 'base58btc rejects ambiguous characters');

// --- Merkle manifest
$f = fn($c) => hash('sha512', $c);
$m = [['path' => 'b.bin', 'sha512' => $f('b')], ['path' => 'a.bin', 'sha512' => $f('a')], ['path' => 'c/d.bin', 'sha512' => $f('c')]];
$root = constanciaMerkleRoot($m);
check($root === constanciaMerkleRoot(array_reverse($m)), 'Merkle root does not depend on input order');
$l = fn($p, $c) => hash('sha512', $p . hash('sha512', $c, true), true);
$expected = bin2hex(hash('sha512', hash('sha512', $l('a.bin', 'a') . $l('b.bin', 'b'), true) . $l('c/d.bin', 'c'), true));
check($root === $expected, 'Merkle root follows leaf = SHA-512(path || SHA-512(file)), odd node carried up');
$m2 = $m; $m2[0]['sha512'] = $f('tampered');
check($root !== constanciaMerkleRoot($m2), 'changing one file changes the root');

// --- DID + signature
$did = constanciaDidDocument();
check(count($did['verificationMethod']) === 1 && str_starts_with($did['verificationMethod'][0]['publicKeyMultibase'], 'z6Mk'), 'did.json exposes the Ed25519 key as z6Mk… multikey');
$pair = constanciaIssuerKeypair();
$doc = ['@context' => ['https://www.w3.org/ns/credentials/v2'], 'id' => 'urn:uuid:' . constanciaUuid4(), 'type' => ['VerifiableCredential'], 'issuer' => constanciaIssuerDid(), 'credentialSubject' => ['x' => 'y']];
$signed = constanciaSignCredential($doc, $pair);
check(constanciaVerifySignature($signed, $did)[0] === true, 'eddsa-jcs-2022 proof verifies');
$bad = $signed; $bad['credentialSubject']['x'] = 'z';
check(constanciaVerifySignature($bad, $did)[0] === false, 'tampered credential fails verification');
$other = $signed; $other['proof']['verificationMethod'] = constanciaIssuerDid() . '#other';
check(constanciaVerifySignature($other, $did)[1] === 'key_not_in_did', 'unknown verification method is rejected');

// --- visual seal
$s1 = constanciaSealSvg(str_repeat('ab', 64)); $s2 = constanciaSealSvg(str_repeat('ab', 64)); $s3 = constanciaSealSvg(str_repeat('cd', 64));
check($s1 === $s2 && $s1 !== $s3, 'visual seal is deterministic and depends on the fingerprint');

// --- input validation
[$c, $e] = constanciaValidateInput([]);
check(isset($e['holderName'], $e['assetName'], $e['version'], $e['declaration'], $e['asset']), 'missing required fields are reported');
[$c, $e] = constanciaValidateInput(['holderType' => 'persona_fisica', 'holderName' => 'Ana', 'assetName' => 'M', 'assetType' => 'model', 'version' => '1', 'aiUse' => 'none', 'visibility' => 'public', 'declaration' => true, 'digest' => $f('x'), 'holderDid' => constanciaIssuerDid()]);
check(isset($e['holderDid']) && count($e) === 1, 'the holder cannot reuse the issuer DID');

// --- local TSA + full seal
$tsaDir = $tmp . '/tsa'; mkdir($tsaDir);
$sh = fn($cmd) => constanciaRun(['bash', '-c', $cmd])[0] === 0;
$ok = $sh("cd $tsaDir && openssl req -x509 -newkey rsa:2048 -nodes -keyout ca.key -out cacert.pem -subj '/CN=Test CA' -days 2 2>/dev/null"
    . " && openssl req -newkey rsa:2048 -nodes -keyout tsa.key -out tsa.csr -subj '/CN=Test TSA' 2>/dev/null"
    . " && printf 'extendedKeyUsage=critical,timeStamping\n' > ext.cnf && openssl x509 -req -in tsa.csr -CA cacert.pem -CAkey ca.key -CAcreateserial -out tsa.crt -days 2 -extfile ext.cnf 2>/dev/null && echo 01 > tsaserial");
file_put_contents("$tsaDir/tsa.cnf", "[ tsa ]\ndefault_tsa = t\n[ t ]\ndir = $tsaDir\nserial = \$dir/tsaserial\ncrypto_device = builtin\nsigner_cert = \$dir/tsa.crt\ncerts = \$dir/cacert.pem\nsigner_key = \$dir/tsa.key\nsigner_digest = sha256\ndefault_policy = 1.2.3.4.1\ndigests = sha256, sha512\naccuracy = secs:1\nordering = yes\ntsa_name = yes\ness_cert_id_alg = sha256\n");
$port = random_int(20000, 40000);
$srv = proc_open(['php', '-S', "127.0.0.1:$port", __DIR__ . '/fixtures/local-tsa.php'], [1 => ['file', '/dev/null', 'w'], 2 => ['file', '/dev/null', 'w']], $pp, null, ['TSA_DIR' => $tsaDir, 'PATH' => getenv('PATH')]);
usleep(700000);
check($ok, 'local test CA/TSA created');
putenv("HASHCOD_TSA_URL=http://127.0.0.1:$port/");

$valid = ['holderType' => 'persona_juridica', 'holderName' => 'Acme SRL', 'taxId' => '1-31-12345-6', 'holderDid' => 'did:web:acme.example', 'assetName' => 'Modelo X', 'assetType' => 'model', 'version' => '1.0.0',
    'description' => 'Pruebas', 'aiUse' => 'assisted', 'visibility' => 'public', 'license' => 'MIT', 'declaration' => true, 'digest' => $f('asset-bytes')];
$r1 = constanciaSeal($valid);
$r2 = constanciaSeal(['manifest' => $m, 'assetType' => 'dataset'] + $valid);
check(preg_match('/^HC-\d{4}-000001$/', $r1['number']) && preg_match('/^HC-\d{4}-000002$/', $r2['number']), 'numbers are consecutive');
try { constanciaSeal(['holderName' => ''] + $valid); check(false, 'invalid input is refused'); } catch (InvalidArgumentException) { check(true, 'invalid input is refused'); }
putenv('HASHCOD_TSA_URL=http://127.0.0.1:1/');
try { constanciaSeal($valid); check(false, 'TSA down aborts sealing'); } catch (RuntimeException $x) { check($x->getMessage() === 'tsa_unreachable', 'TSA down aborts sealing (no server-clock fallback)'); }
putenv("HASHCOD_TSA_URL=http://127.0.0.1:$port/");
$r3 = constanciaSeal($valid);
check(str_ends_with($r3['number'], '000003'), 'a failed attempt does not burn a number');

$pdo = constanciaDb();
$row = $pdo->query("SELECT * FROM constancias WHERE number='{$r1['number']}'")->fetch();
check($row['holder_tax_id_enc'] !== null && !str_contains((string)$row['credential_json'], '1-31-12345-6') && !str_contains((string)$row['holder_tax_id_enc'], '1-31-12345-6'), 'cédula/RNC is stored encrypted and never inside the credential');
check(gmdate('Y-m-d') === substr($row['tsa_gen_time'], 0, 10) && $row['tsa_gen_time'] === $r1['genTime'], 'printed time comes from the TSA token genTime');

$files = constanciaReadCod($row['cod']);
check(isset($files['credential.json'], $files['timestamp.tsr'], $files['receipt.json'], $files['anchors.json']) && !isset($files['manifest.json']), '.cod holds credential, receipt, token and anchors');
$ca = "$tsaDir/cacert.pem";
$v = constanciaVerifyPackage($files, constanciaDidDocument(), $ca, $f('asset-bytes'));
check($v['ok'] && $v['chain'], 'all five checks pass (TSA chain verified against the CA)');
check(!constanciaVerifyPackage($files, constanciaDidDocument(), $ca, $f('other-bytes'))['ok'], 'a different asset file fails the commitment check');
$noCa = constanciaVerifyPackage($files, constanciaDidDocument(), null);
check($noCa['ok'] && !$noCa['chain'], 'without a CA the time-stamp is reported as chain-unverified');

$row2 = $pdo->query("SELECT cod FROM constancias WHERE number='{$r2['number']}'")->fetch();
$files2 = constanciaReadCod($row2['cod']);
check(isset($files2['manifest.json']) && constanciaVerifyPackage($files2, constanciaDidDocument(), $ca, $f('b'))['ok'], 'Merkle constancia verifies and accepts a single file from the manifest');

$t = $files; $cred = json_decode($t['credential.json'], true); $cred['credentialSubject']['asset']['name'] = 'Otro'; $t['credential.json'] = constanciaJcs($cred);
$vt = constanciaVerifyPackage($t, constanciaDidDocument(), $ca);
check(!$vt['ok'] && !array_column($vt['checks'], 'ok', 'id')['signature'] && !array_column($vt['checks'], 'ok', 'id')['jcs_hash'], 'tampering breaks the signature and the fingerprint');
$t = $files; $t['timestamp.tsr'] = substr($files['timestamp.tsr'], 0, -5) . 'xxxxx';
check(!array_column(constanciaVerifyPackage($t, constanciaDidDocument(), $ca)['checks'], 'ok', 'id')['timestamp'], 'a corrupted time-stamp token fails');
$wrongRole = constanciaDidDocument(); $wrongRole['assertionMethod'] = [];
check(!array_column(constanciaVerifyPackage($files, $wrongRole, $ca)['checks'], 'ok', 'id')['roles'], 'role separation requires the key in assertionMethod');

// --- PDF (PDF/A-3b structure, embedded .cod, corrected layout)
$row['merkle_root'] = $row['merkle_root'] ?? null;
$pdf = constanciaRenderPdf($row);
check(str_starts_with($pdf, '%PDF-') && strlen($pdf) > 20000, 'PDF is rendered');
file_put_contents($tmp . '/c.pdf', $pdf);
[, $info] = constanciaRun(['pdfinfo', $tmp . '/c.pdf']);
check(str_contains($info, 'Pages:           2'), 'two pages');
[, $fonts] = constanciaRun(['pdffonts', $tmp . '/c.pdf']);
check(!preg_match('/\n(?!name|---)\S+\s+\S+\s+\S+\s+no\s/', $fonts), 'every font is embedded');
[, $txt] = constanciaRun(['pdftotext', '-layout', $tmp . '/c.pdf', '-']);
check(str_contains($txt, 'hace constar') && !str_contains($txt, 'acredita') && str_contains($txt, 'Estado vigente: consultar en la verificación en línea')
    && str_contains($txt, 'Hash del activo (SHA-512)') && str_contains($txt, 'Huella de la constancia') && str_contains($txt, 'Fuente del sello de tiempo (TSA)') && str_contains($txt, 'ID de la llave firmante'), 'texts: hace constar, estado, hash del activo, huella, TSA, llave');
check(!str_contains($txt, '1-31-12345-6'), 'cédula/RNC is not printed');
[, $att] = constanciaRun(['pdfdetach', '-list', $tmp . '/c.pdf']);
check(str_contains($att, $r1['number'] . '.cod'), 'the .cod is embedded in the PDF');
constanciaRun(['pdfdetach', '-saveall', '-o', $tmp . '/att', $tmp . '/c.pdf']);
@mkdir($tmp . '/att'); constanciaRun(['pdfdetach', '-savefile', $r1['number'] . '.cod', '-o', $tmp . '/out.cod', $tmp . '/c.pdf']);
check(is_file($tmp . '/out.cod') && hash_file('sha256', $tmp . '/out.cod') === hash('sha256', $row['cod']), 'the embedded .cod is byte-identical');

$vera = getenv('VERAPDF');
if ($vera && is_executable($vera)) { [$vc, $vo] = constanciaRun([$vera, '--flavour', '3b', '--format', 'text', $tmp . '/c.pdf']); check($vc === 0 && str_starts_with($vo, 'PASS'), 'veraPDF validates the PDF as PDF/A-3b'); }
else echo "  [SKIP] veraPDF (set VERAPDF=/path/to/verapdf)\n";

// --- ledger
check(constanciaLedgerCheck($pdo) === null && (int)$pdo->query('SELECT COUNT(*) FROM ledger')->fetchColumn() === 3, 'ledger chain is intact (3 entries)');
try { $pdo->exec("UPDATE ledger SET entry_json='{}' WHERE seq=1"); check(false, 'ledger rows cannot be edited'); } catch (PDOException) { check(true, 'ledger rows cannot be edited'); }
try { $pdo->exec('DELETE FROM ledger WHERE seq=1'); check(false, 'ledger rows cannot be deleted'); } catch (PDOException) { check(true, 'ledger rows cannot be deleted'); }
$pdo->exec('DROP TRIGGER ledger_no_update'); $pdo->exec("UPDATE ledger SET entry_json='{\"event\":\"x\"}' WHERE seq=1");
check(constanciaLedgerCheck($pdo) === 1, 'even if the triggers are bypassed, the hash chain exposes the edit');

proc_terminate($srv); proc_close($srv);
constanciaRun(['rm', '-rf', $tmp]);
echo $failed ? "\n$failed FAILED\n" : "\nAll passed\n";
exit($failed ? 1 : 0);
