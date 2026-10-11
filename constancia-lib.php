<?php
/**
 * Hashcod asset constancias (W3C Verifiable Credentials, eddsa-jcs-2022, RFC 3161 time stamps).
 *
 * Pure helpers (no HTTP): canonicalization (JCS, RFC 8785), base58btc, Merkle manifests, credential
 * building/signing/verification, RFC 3161 client (openssl ts), the hash-chained ledger and the deterministic
 * visual seal. constancia.php wraps these in the API; bin/hcod uses constanciaVerifyPackage().
 *
 * Configuration (env / secrets, see CONSTANCIA.md):
 *   HASHCOD_SEAL_DOMAIN             default hashcodcodespace.dev  (did:web:<domain>, verification URLs)
 *   HASHCOD_SEAL_KEY_ID             default key-2026-01
 *   HASHCOD_SEAL_ED25519_SEED_B64   32-byte Ed25519 seed (base64). The signing key never leaves the server process.
 *   HASHCOD_TSA_URL                 RFC 3161 endpoint, default http://timestamp.digicert.com ("off" is not allowed: sealing needs a TSA)
 *   HASHCOD_TSA2_URL                second, independent anchor, default http://timestamp.sectigo.com ("off" disables it)
 *                                   Only the SHA-512 of the signed credential is sent to a TSA, never the asset or personal data.
 *   HASHCOD_TSA_CA_FILE             PEM bundle used to verify TSA chains, default the system bundle /etc/ssl/certs/ca-certificates.crt
 *   HASHCOD_SEAL_ACCESS_SIGNATURE_SHA256   SHA-256 (hex) of each signature allowed to open the tool
 *   HASHCOD_SEAL_DB                 override for the SQLite path (tests)
 */

if (!function_exists('secretGet')) require_once __DIR__ . '/secrets.php';

const CONSTANCIA_TEMPLATE_VERSION = 'psot-constancia-v4';
const CONSTANCIA_DECLARATION = 'Declaro que soy el autor o titular legítimo del activo descrito, que la información aportada es veraz y que entiendo que esta constancia prueba la existencia, integridad y autoría declarada del activo, sin sustituir registros ante ONAPI u ONDA.';
const CONSTANCIA_ASSET_TYPES = ['model' => 'Modelo', 'weights' => 'Pesos', 'dataset' => 'Dataset', 'prompt' => 'Prompt', 'prompt_pack' => 'Paquete de prompts', 'agent' => 'Agente', 'skill' => 'Skill', 'code' => 'Código', 'output' => 'Output'];
const CONSTANCIA_AI_USE = ['none' => 'Ninguno', 'assisted' => 'Asistido', 'generated' => 'Generado'];
const CONSTANCIA_BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

/* ---------- configuration ---------- */

function constanciaEnv(string $name, string $default = ''): string {
    if (function_exists('secretGet')) {
        $v = (string)secretGet($name, '');
        if ($v !== '') return trim($v);
    }
    $v = getenv($name);
    return is_string($v) && $v !== '' ? trim($v) : $default;
}

function constanciaDomain(): string {
    $d = strtolower(constanciaEnv('HASHCOD_SEAL_DOMAIN', 'hashcodcodespace.dev'));
    return preg_match('/^[a-z0-9.-]{3,120}$/', $d) ? $d : 'hashcodcodespace.dev';
}
function constanciaIssuerDid(): string { return 'did:web:' . constanciaDomain(); }
function constanciaKeyId(): string {
    $k = constanciaEnv('HASHCOD_SEAL_KEY_ID', 'key-2026-01');
    return preg_match('/^[A-Za-z0-9._-]{3,60}$/', $k) ? $k : 'key-2026-01';
}
function constanciaTsaUrl(): string {
    $u = constanciaEnv('HASHCOD_TSA_URL', 'http://timestamp.digicert.com');
    return preg_match('#^https?://#i', $u) ? $u : '';
}
function constanciaTsa2Url(): string {
    $u = constanciaEnv('HASHCOD_TSA2_URL', 'http://timestamp.sectigo.com');
    return preg_match('#^https?://#i', $u) ? $u : '';
}
function constanciaCaFile(): ?string {
    foreach ([constanciaEnv('HASHCOD_TSA_CA_FILE'), '/etc/ssl/certs/ca-certificates.crt'] as $f) if ($f !== '' && is_readable($f)) return $f;
    return null;
}
function constanciaDataDir(): string {
    $dir = __DIR__ . '/data_storage/constancia';
    if (!is_dir($dir)) @mkdir($dir, 0700, true);
    return $dir;
}

/* ---------- JCS (RFC 8785), base58btc, hex helpers ---------- */

function constanciaJcs($value): string {
    if (is_array($value)) {
        if (array_is_list($value)) return '[' . implode(',', array_map('constanciaJcs', $value)) . ']';
        $keys = array_keys($value);
        usort($keys, fn($a, $b) => strcmp(mb_convert_encoding((string)$a, 'UTF-16BE', 'UTF-8'), mb_convert_encoding((string)$b, 'UTF-16BE', 'UTF-8')));
        $parts = [];
        foreach ($keys as $k) $parts[] = constanciaJcs((string)$k) . ':' . constanciaJcs($value[$k]);
        return '{' . implode(',', $parts) . '}';
    }
    if (is_string($value)) return json_encode($value, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_LINE_TERMINATORS | JSON_THROW_ON_ERROR);
    if (is_bool($value) || $value === null || is_int($value)) return json_encode($value);
    throw new InvalidArgumentException('JCS: unsupported value type');
}

function constanciaBase58Encode(string $bytes): string {
    $digits = array_values(unpack('C*', $bytes) ?: []);
    $zeros = 0;
    while ($zeros < count($digits) && $digits[$zeros] === 0) $zeros++;
    $out = '';
    $num = $digits;
    while ($num) {
        $rem = 0; $next = [];
        foreach ($num as $d) {
            $acc = $rem * 256 + $d;
            $q = intdiv($acc, 58);
            $rem = $acc % 58;
            if ($next || $q) $next[] = $q;
        }
        $out = CONSTANCIA_BASE58[$rem] . $out;
        $num = $next;
    }
    return str_repeat('1', $zeros) . $out;
}

function constanciaBase58Decode(string $text): ?string {
    $num = [];
    $zeros = 0;
    while ($zeros < strlen($text) && $text[$zeros] === '1') $zeros++;
    for ($i = 0, $n = strlen($text); $i < $n; $i++) {
        $val = strpos(CONSTANCIA_BASE58, $text[$i]);
        if ($val === false) return null;
        $carry = $val;
        for ($j = count($num) - 1; $j >= 0; $j--) {
            $carry += $num[$j] * 58;
            $num[$j] = $carry & 0xff;
            $carry >>= 8;
        }
        while ($carry) { array_unshift($num, $carry & 0xff); $carry >>= 8; }
    }
    return str_repeat("\0", $zeros) . ($num ? pack('C*', ...$num) : '');
}

function constanciaIsHex(string $v, int $len): bool { return strlen($v) === $len && ctype_xdigit($v); }

/* ---------- Merkle manifest ---------- */

/** Leaf = SHA-512(utf8 path || raw SHA-512 of the file); paths sorted bytewise; odd node is carried up unchanged. */
function constanciaMerkleRoot(array $manifest): string {
    $files = [];
    foreach ($manifest as $row) {
        $path = (string)($row['path'] ?? '');
        $sha = strtolower((string)($row['sha512'] ?? ''));
        if ($path === '' || strlen($path) > 300 || !constanciaIsHex($sha, 128) || isset($files[$path])) throw new InvalidArgumentException('manifest');
        $files[$path] = $sha;
    }
    if (count($files) < 2) throw new InvalidArgumentException('manifest');
    ksort($files, SORT_STRING);
    $level = [];
    foreach ($files as $path => $sha) $level[] = hash('sha512', $path . hex2bin($sha), true);
    while (count($level) > 1) {
        $next = [];
        for ($i = 0; $i < count($level); $i += 2) {
            $next[] = isset($level[$i + 1]) ? hash('sha512', $level[$i] . $level[$i + 1], true) : $level[$i];
        }
        $level = $next;
    }
    return bin2hex($level[0]);
}

/* ---------- issuer key & DID ---------- */

function constanciaIssuerKeypair(): ?string {
    $seed = base64_decode(constanciaEnv('HASHCOD_SEAL_ED25519_SEED_B64'), true);
    if (!is_string($seed) || strlen($seed) !== SODIUM_CRYPTO_SIGN_SEEDBYTES) return null;
    return sodium_crypto_sign_seed_keypair($seed);
}

function constanciaMultikey(string $publicKey): string { return 'z' . constanciaBase58Encode("\xed\x01" . $publicKey); }

function constanciaPublicKeyFromMultikey(string $multibase): ?string {
    if ($multibase === '' || $multibase[0] !== 'z') return null;
    $raw = constanciaBase58Decode(substr($multibase, 1));
    return is_string($raw) && strlen($raw) === 34 && str_starts_with($raw, "\xed\x01") ? substr($raw, 2) : null;
}

/** did.json: the current key (from the secret) plus every retired key listed in config/seal-did-keys.json. */
function constanciaDidDocument(): array {
    $did = constanciaIssuerDid();
    $methods = []; $active = [];
    $pair = constanciaIssuerKeypair();
    if ($pair !== null) {
        $id = $did . '#' . constanciaKeyId();
        $methods[$id] = ['id' => $id, 'type' => 'Multikey', 'controller' => $did, 'publicKeyMultibase' => constanciaMultikey(sodium_crypto_sign_publickey($pair))];
        $active[] = $id;
    }
    $history = __DIR__ . '/config/seal-did-keys.json';
    $rows = is_readable($history) ? json_decode((string)file_get_contents($history), true) : [];
    foreach (is_array($rows) ? $rows : [] as $row) {
        $kid = (string)($row['id'] ?? '');
        $mb = (string)($row['publicKeyMultibase'] ?? '');
        if (!preg_match('/^[A-Za-z0-9._-]{3,60}$/', $kid) || constanciaPublicKeyFromMultikey($mb) === null) continue;
        $id = $did . '#' . $kid;
        if (!isset($methods[$id])) $methods[$id] = ['id' => $id, 'type' => 'Multikey', 'controller' => $did, 'publicKeyMultibase' => $mb];
        if (!empty($row['active']) && !in_array($id, $active, true)) $active[] = $id;
    }
    return ['@context' => ['https://www.w3.org/ns/did/v1', 'https://w3id.org/security/multikey/v1'], 'id' => $did,
        'verificationMethod' => array_values($methods), 'assertionMethod' => $active];
}

/* ---------- credential ---------- */

function constanciaUuid4(): string {
    $b = random_bytes(16);
    $b[6] = chr((ord($b[6]) & 0x0f) | 0x40);
    $b[8] = chr((ord($b[8]) & 0x3f) | 0x80);
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($b), 4));
}

/** eddsa-jcs-2022: sign SHA-256(JCS(proofConfig)) || SHA-256(JCS(document)). */
function constanciaProofHashData(array $document, array $proofConfig): string {
    return hash('sha256', constanciaJcs($proofConfig), true) . hash('sha256', constanciaJcs($document), true);
}

function constanciaProofConfig(array $document, string $verificationMethod, string $created): array {
    return ['@context' => $document['@context'], 'type' => 'DataIntegrityProof', 'cryptosuite' => 'eddsa-jcs-2022',
        'created' => $created, 'verificationMethod' => $verificationMethod, 'proofPurpose' => 'assertionMethod'];
}

function constanciaSignCredential(array $document, string $keypair): array {
    $vm = constanciaIssuerDid() . '#' . constanciaKeyId();
    $created = gmdate('Y-m-d\TH:i:s\Z');
    $config = constanciaProofConfig($document, $vm, $created);
    $sig = sodium_crypto_sign_detached(constanciaProofHashData($document, $config), sodium_crypto_sign_secretkey($keypair));
    unset($config['@context']);
    $config['proofValue'] = 'z' . constanciaBase58Encode($sig);
    return $document + ['proof' => $config];
}

/** Returns [bool ok, string reason]. $didDoc supplies the verification method (public key). */
function constanciaVerifySignature(array $signed, array $didDoc): array {
    $proof = $signed['proof'] ?? null;
    if (!is_array($proof) || ($proof['type'] ?? '') !== 'DataIntegrityProof' || ($proof['cryptosuite'] ?? '') !== 'eddsa-jcs-2022') return [false, 'proof'];
    $vm = (string)($proof['verificationMethod'] ?? '');
    $publicKey = null;
    foreach ($didDoc['verificationMethod'] ?? [] as $method) {
        if (($method['id'] ?? '') === $vm) $publicKey = constanciaPublicKeyFromMultikey((string)($method['publicKeyMultibase'] ?? ''));
    }
    if ($publicKey === null) return [false, 'key_not_in_did'];
    $sig = constanciaBase58Decode(substr((string)($proof['proofValue'] ?? ''), 1));
    if (!is_string($sig) || strlen($sig) !== 64 || ($proof['proofValue'][0] ?? '') !== 'z') return [false, 'bad_signature_encoding'];
    $document = $signed; unset($document['proof']);
    $config = constanciaProofConfig($document, $vm, (string)($proof['created'] ?? ''));
    return sodium_crypto_sign_verify_detached($sig, constanciaProofHashData($document, $config), $publicKey) ? [true, 'ok'] : [false, 'signature_mismatch'];
}

function constanciaFingerprint(array $signed): string { return hash('sha512', constanciaJcs($signed)); }

/* ---------- RFC 3161 (openssl ts) ---------- */

function constanciaRun(array $cmd, ?string $stdin = null): array {
    $proc = @proc_open($cmd, [0 => ['pipe', 'r'], 1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $pipes);
    if (!is_resource($proc)) return [-1, '', ''];
    if ($stdin !== null) fwrite($pipes[0], $stdin);
    fclose($pipes[0]);
    $out = stream_get_contents($pipes[1]); $err = stream_get_contents($pipes[2]);
    fclose($pipes[1]); fclose($pipes[2]);
    return [proc_close($proc), (string)$out, (string)$err];
}

function constanciaTmp(string $content = ''): string {
    $p = tempnam(sys_get_temp_dir(), 'cst');
    chmod($p, 0600);
    if ($content !== '') file_put_contents($p, $content);
    return $p;
}

/** Parses `openssl ts -reply -text`: [status granted?, imprint hex, genTime ISO, tsa name]. */
function constanciaTsaInspect(string $reply): array {
    $f = constanciaTmp($reply);
    [$code, $out] = constanciaRun(['openssl', 'ts', '-reply', '-in', $f, '-text']);
    @unlink($f);
    if ($code !== 0) return [false, '', '', ''];
    $granted = (bool)preg_match('/^Status: Granted/m', $out);
    $hex = '';
    if (preg_match('/Message data:\n((?:\s+[0-9a-f]{4} - .*\n)+)/i', $out, $m)) {
        foreach (explode("\n", $m[1]) as $line) {
            if (preg_match('/^\s+[0-9a-f]{4} - ([0-9a-f -]{1,47})/i', $line, $bytes)) $hex .= preg_replace('/[^0-9a-f]/i', '', $bytes[1]);
        }
    }
    $time = '';
    if (preg_match('/^Time stamp: (.+)$/m', $out, $m) && ($ts = strtotime($m[1])) !== false) $time = gmdate('Y-m-d\TH:i:s\Z', $ts);
    $tsa = preg_match('/^TSA: (.+)$/m', $out, $m) ? trim($m[1]) : '';
    return [$granted, strtolower($hex), $time, $tsa];
}

/** Asks a TSA to time-stamp a SHA-512 digest. Returns the parsed token or throws RuntimeException. */
function constanciaTsaStamp(string $url, string $digestHex): array {
    if (!preg_match('#^https?://#i', $url)) throw new RuntimeException('tsa_not_configured');
    $q = constanciaTmp();
    [$code] = constanciaRun(['openssl', 'ts', '-query', '-digest', $digestHex, '-sha512', '-cert', '-out', $q]);
    $request = (string)file_get_contents($q); @unlink($q);
    if ($code !== 0 || $request === '') throw new RuntimeException('tsa_query');
    $ch = curl_init($url);
    curl_setopt_array($ch, [CURLOPT_POST => true, CURLOPT_POSTFIELDS => $request, CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => ['Content-Type: application/timestamp-query'], CURLOPT_CONNECTTIMEOUT => 6, CURLOPT_TIMEOUT => 20,
        CURLOPT_PROTOCOLS => CURLPROTO_HTTP | CURLPROTO_HTTPS, CURLOPT_FOLLOWLOCATION => false]);
    $reply = curl_exec($ch);
    $status = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    curl_close($ch);
    if (!is_string($reply) || $status !== 200 || $reply === '') throw new RuntimeException('tsa_unreachable');
    [$granted, $imprint, $time, $tsa] = constanciaTsaInspect($reply);
    if (!$granted) throw new RuntimeException('tsa_rejected');
    if (!hash_equals(strtolower($digestHex), $imprint)) throw new RuntimeException('tsa_imprint_mismatch');
    if ($time === '') throw new RuntimeException('tsa_no_time');
    return ['reply' => $reply, 'genTime' => $time, 'tsa' => $tsa, 'url' => $url, 'alg' => 'sha512'];
}

/** Full chain verification needs the TSA CA bundle; without it only the structure/imprint is checked. */
function constanciaTsaVerify(string $reply, string $digestHex, ?string $caFile): array {
    [$granted, $imprint, $time] = constanciaTsaInspect($reply);
    if (!$granted || !hash_equals(strtolower($digestHex), $imprint) || $time === '') return ['ok' => false, 'chain' => false, 'genTime' => $time, 'note' => 'imprint_or_status'];
    if ($caFile === null || !is_readable($caFile)) return ['ok' => true, 'chain' => false, 'genTime' => $time, 'note' => 'ca_not_configured'];
    $f = constanciaTmp($reply);
    [$code, $out, $err] = constanciaRun(['openssl', 'ts', '-verify', '-in', $f, '-digest', $digestHex, '-sha512', '-CAfile', $caFile]);
    @unlink($f);
    return ['ok' => $code === 0, 'chain' => $code === 0, 'genTime' => $time, 'note' => $code === 0 ? 'verified' : trim(substr($err . $out, 0, 200))];
}

/* ---------- ledger (append-only, hash chained) ---------- */

function constanciaLedgerHash(string $prev, array $entry): string { return hash('sha256', $prev . constanciaJcs($entry)); }

function constanciaLedgerAppend(PDO $pdo, array $entry): string {
    $prev = (string)$pdo->query('SELECT entry_hash FROM ledger ORDER BY seq DESC LIMIT 1')->fetchColumn();
    if ($prev === '') $prev = str_repeat('0', 64);
    $hash = constanciaLedgerHash($prev, $entry);
    $pdo->prepare('INSERT INTO ledger (entry_json, prev_hash, entry_hash, created_at) VALUES (?,?,?,?)')->execute([constanciaJcs($entry), $prev, $hash, time()]);
    return $hash;
}

/** Returns the first broken sequence number, or null when the chain is intact. */
function constanciaLedgerCheck(PDO $pdo): ?int {
    $prev = str_repeat('0', 64);
    foreach ($pdo->query('SELECT seq, entry_json, prev_hash, entry_hash FROM ledger ORDER BY seq') as $row) {
        $entry = json_decode($row['entry_json'], true);
        if (!is_array($entry) || $row['prev_hash'] !== $prev || !hash_equals(constanciaLedgerHash($prev, $entry), $row['entry_hash'])) return (int)$row['seq'];
        $prev = $row['entry_hash'];
    }
    return null;
}

function constanciaDb(): PDO {
    $path = constanciaEnv('HASHCOD_SEAL_DB', '') ?: constanciaDataDir() . '/constancias.sqlite';
    $pdo = new PDO('sqlite:' . $path, null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]);
    $pdo->exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=30000; PRAGMA synchronous=FULL;');
    $pdo->exec('CREATE TABLE IF NOT EXISTS counters (year INTEGER PRIMARY KEY, last INTEGER NOT NULL);
        CREATE TABLE IF NOT EXISTS constancias (number TEXT PRIMARY KEY, year INTEGER NOT NULL, seq INTEGER NOT NULL, credential_id TEXT NOT NULL,
            holder_type TEXT NOT NULL, holder_name TEXT NOT NULL, holder_tax_id_enc TEXT, holder_did TEXT,
            asset_name TEXT NOT NULL, asset_type TEXT NOT NULL, version TEXT NOT NULL, description TEXT, license TEXT, ai_use TEXT NOT NULL,
            visibility TEXT NOT NULL, digest TEXT NOT NULL, merkle_root TEXT, manifest_json TEXT, credential_json TEXT NOT NULL,
            fingerprint TEXT NOT NULL, tsa_reply BLOB NOT NULL, tsa_gen_time TEXT NOT NULL, tsa_name TEXT, tsa_url TEXT, anchors_json TEXT NOT NULL,
            seal_seed TEXT NOT NULL, template_version TEXT NOT NULL, ledger_hash TEXT NOT NULL, cod BLOB NOT NULL,
            status TEXT NOT NULL DEFAULT "vigente", revoked_at TEXT, revoke_reason TEXT, created_at INTEGER NOT NULL, UNIQUE(year, seq));
        CREATE TABLE IF NOT EXISTS ledger (seq INTEGER PRIMARY KEY AUTOINCREMENT, entry_json TEXT NOT NULL, prev_hash TEXT NOT NULL, entry_hash TEXT NOT NULL, created_at INTEGER NOT NULL);
        CREATE TABLE IF NOT EXISTS unlock_attempts (ip_hash TEXT NOT NULL, at INTEGER NOT NULL);');
    // Append-only: rows of the ledger can never be changed or removed.
    $pdo->exec('CREATE TRIGGER IF NOT EXISTS ledger_no_update BEFORE UPDATE ON ledger BEGIN SELECT RAISE(ABORT, "ledger is append-only"); END;
        CREATE TRIGGER IF NOT EXISTS ledger_no_delete BEFORE DELETE ON ledger BEGIN SELECT RAISE(ABORT, "ledger is append-only"); END;');
    return $pdo;
}

/* ---------- visual seal (deterministic from the fingerprint) ---------- */

/** Drawing ops on a 200x200 canvas: ['c',cx,cy,r,sw] ['l',x1,y1,x2,y2,sw] ['p',[[x,y]..],sw] ['r',x,y,w,h]. */
function constanciaSealOps(string $fingerprint): array {
    $b = array_values(unpack('C*', hash('sha512', 'hashcod-seal-v1|' . $fingerprint, true)));
    $ops = [['c', 100, 100, 97, 1.4], ['c', 100, 100, 93, .5], ['c', 100, 100, 60, .8], ['c', 100, 100, 57, .4]];
    for ($i = 0; $i < 90; $i++) {
        $a = deg2rad($i * 4);
        $len = 10 + $b[$i % 64] % 22;
        $ops[] = ['l', round(100 + 62 * cos($a), 2), round(100 + 62 * sin($a), 2), round(100 + (62 + $len) * cos($a), 2), round(100 + (62 + $len) * sin($a), 2), $b[($i + 7) % 64] & 1 ? 1.0 : .5];
    }
    $n = 7 + $b[0] % 7; $inner = 26 + $b[1] % 14; $pts = [];
    for ($i = 0; $i < $n * 2; $i++) {
        $a = deg2rad(-90 + $i * 180 / $n);
        $r = $i % 2 ? $inner : 54;
        $pts[] = [round(100 + $r * cos($a), 2), round(100 + $r * sin($a), 2)];
    }
    $ops[] = ['p', $pts, .7];
    $cell = 5; $grid = 7; $origin = 100 - $cell * $grid / 2;
    for ($y = 0; $y < $grid; $y++) for ($x = 0; $x < 4; $x++) {
        if (!($b[8 + $y * 4 + $x] & 1)) continue;
        foreach ([$x, $grid - 1 - $x] as $cx) $ops[] = ['r', $origin + $cx * $cell, $origin + $y * $cell, $cell, $cell];
    }
    return $ops;
}

function constanciaSealSvg(string $fingerprint, int $size = 200): string {
    $svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="' . $size . '" height="' . $size . '" role="img" aria-label="Sello visual derivado de la huella" fill="none" stroke="#111" stroke-linecap="round">';
    foreach (constanciaSealOps($fingerprint) as $op) {
        $svg .= match ($op[0]) {
            'c' => sprintf('<circle cx="%s" cy="%s" r="%s" stroke-width="%s"/>', $op[1], $op[2], $op[3], $op[4]),
            'l' => sprintf('<line x1="%s" y1="%s" x2="%s" y2="%s" stroke-width="%s"/>', $op[1], $op[2], $op[3], $op[4], $op[5]),
            'p' => sprintf('<polygon points="%s" stroke-width="%s"/>', implode(' ', array_map(fn($p) => $p[0] . ',' . $p[1], $op[1])), $op[2]),
            'r' => sprintf('<rect x="%s" y="%s" width="%s" height="%s" fill="#111" stroke="none"/>', $op[1], $op[2], $op[3], $op[4]),
        };
    }
    return $svg . '</svg>';
}

/* ---------- package (.cod) and verification ---------- */

function constanciaBuildCod(array $parts): string {
    $path = constanciaTmp();
    $zip = new ZipArchive();
    $zip->open($path, ZipArchive::OVERWRITE);
    foreach ($parts as $name => $content) {
        $zip->addFromString($name, $content);
        $zip->setMtimeName($name, 946684800); // fixed time so the same content gives the same bytes
    }
    $zip->close();
    $bytes = (string)file_get_contents($path); @unlink($path);
    return $bytes;
}

function constanciaReadCod(string $bytes): ?array {
    if (strlen($bytes) > 5242880) return null;
    $path = constanciaTmp($bytes);
    $zip = new ZipArchive();
    $files = null;
    if ($zip->open($path) === true && $zip->numFiles <= 16) {
        $files = [];
        for ($i = 0; $i < $zip->numFiles; $i++) {
            $name = (string)$zip->getNameIndex($i);
            if (!preg_match('/^[a-z0-9._-]+$/', $name) || ($zip->statIndex($i)['size'] ?? 0) > 2097152) { $files = null; break; }
            $files[$name] = (string)$zip->getFromIndex($i);
        }
        $zip->close();
    }
    @unlink($path);
    return $files;
}

/**
 * The five checks `hcod verify` and the verification page run. $files = contents of the .cod,
 * $didDoc = resolved did.json, $assetSha512 = optional SHA-512 of a file the user wants to compare.
 */
function constanciaVerifyPackage(array $files, array $didDoc, ?string $caFile = null, ?string $assetSha512 = null): array {
    $signed = json_decode($files['credential.json'] ?? '', true);
    $receipt = json_decode($files['receipt.json'] ?? '', true);
    $checks = [];
    $add = function (string $id, string $label, bool $ok, string $detail = '') use (&$checks) { $checks[] = ['id' => $id, 'label' => $label, 'ok' => $ok, 'detail' => $detail]; };
    if (!is_array($signed) || !is_array($receipt)) {
        $add('package', 'Paquete .cod legible', false, 'Faltan credential.json o receipt.json');
        return ['ok' => false, 'checks' => $checks];
    }
    [$sigOk, $sigWhy] = constanciaVerifySignature($signed, $didDoc);
    $add('signature', 'Firma Ed25519 (eddsa-jcs-2022) válida contra el DID', $sigOk, $sigOk ? (string)($signed['proof']['verificationMethod'] ?? '') : $sigWhy);

    $fingerprint = constanciaFingerprint($signed);
    $add('jcs_hash', 'Huella = SHA-512 de la credencial canonicalizada (JCS)', hash_equals($fingerprint, (string)($receipt['fingerprint'] ?? '')), substr($fingerprint, 0, 32) . '…');

    $asset = $signed['credentialSubject']['asset'] ?? [];
    $digest = (string)($asset['digest']['value'] ?? '');
    $commit = constanciaIsHex($digest, 128);
    $detail = 'SHA-512 del activo';
    if (isset($files['manifest.json'])) {
        $manifest = json_decode($files['manifest.json'], true);
        try { $commit = $commit && is_array($manifest) && hash_equals(constanciaMerkleRoot($manifest), $digest) && ($asset['merkleRoot'] ?? null) === $digest; $detail = 'Raíz Merkle recalculada del manifiesto'; }
        catch (Throwable) { $commit = false; $detail = 'Manifiesto inválido'; }
    } elseif (($asset['merkleRoot'] ?? null) !== null) { $commit = false; $detail = 'Falta el manifiesto'; }
    if ($assetSha512 !== null) {
        $match = hash_equals($digest, strtolower($assetSha512));
        if (!$match && isset($manifest) && is_array($manifest)) foreach ($manifest as $row) $match = $match || hash_equals(strtolower((string)($row['sha512'] ?? '')), strtolower($assetSha512));
        $commit = $commit && $match; $detail .= $match ? ' · el archivo coincide' : ' · el archivo NO coincide';
    }
    $add('commitment', 'Compromiso reproducible (hash / raíz Merkle del activo)', $commit, $detail);

    $tsa = constanciaTsaVerify($files['timestamp.tsr'] ?? '', $fingerprint, $caFile);
    $tsaDetail = ($tsa['genTime'] ?: '—') . ($tsa['chain'] ? ' · cadena verificada' : ' · cadena sin verificar (' . $tsa['note'] . ')');
    $add('timestamp', 'Sello de tiempo RFC 3161 sobre la huella', $tsa['ok'], $tsaDetail);

    if (isset($files['anchor-2.tsr'])) {
        $anchor = constanciaTsaVerify($files['anchor-2.tsr'], $fingerprint, $caFile);
        $add('anchor', 'Anclaje externo: segunda TSA independiente', $anchor['ok'], ($anchor['genTime'] ?: '—') . ($anchor['chain'] ? ' · cadena verificada' : ' · cadena sin verificar'));
    }
    $issuer = (string)($signed['issuer'] ?? ''); $holderId = (string)($signed['credentialSubject']['holder']['id'] ?? '');
    $vm = (string)($signed['proof']['verificationMethod'] ?? '');
    $controller = '';
    foreach ($didDoc['verificationMethod'] ?? [] as $m) if (($m['id'] ?? '') === $vm) $controller = (string)($m['controller'] ?? '');
    $roles = $issuer !== '' && $issuer === ($didDoc['id'] ?? '') && $controller === $issuer && $holderId !== $issuer && in_array($vm, $didDoc['assertionMethod'] ?? [], true);
    $add('roles', 'Separación de roles (emisor ≠ titular; llave controlada por el emisor)', $roles, $issuer);

    return ['ok' => !in_array(false, array_column($checks, 'ok'), true), 'checks' => $checks, 'fingerprint' => $fingerprint, 'genTime' => $tsa['genTime'], 'chain' => $tsa['chain']];
}

/* ---------- time helpers ---------- */

function constanciaAstTime(string $isoUtc): string {
    $dt = new DateTimeImmutable($isoUtc, new DateTimeZone('UTC'));
    return $dt->setTimezone(new DateTimeZone('America/Santo_Domingo'))->format('Y-m-d h:i:s A') . ' AST';
}

/* ---------- input validation and sealing ---------- */

/** Returns [clean fields, errors keyed by field]. Nothing here trusts the browser: the hash/manifest only comes as hex. */
function constanciaValidateInput(array $in): array {
    $e = []; $c = [];
    $text = function (string $key, int $min, int $max) use ($in, &$e): string {
        $v = trim((string)($in[$key] ?? ''));
        $v = preg_replace('/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/u', '', $v) ?? '';
        if (mb_strlen($v) < $min || mb_strlen($v) > $max) $e[$key] = $min > 0 ? 'required' : 'too_long';
        return $v;
    };
    $c['holderType'] = (string)($in['holderType'] ?? '');
    if (!in_array($c['holderType'], ['persona_fisica', 'persona_juridica'], true)) $e['holderType'] = 'invalid';
    $c['holderName'] = $text('holderName', 2, 200);
    $c['taxId'] = trim((string)($in['taxId'] ?? ''));
    if ($c['taxId'] !== '' && !preg_match('/^[0-9A-Za-z-]{5,20}$/', $c['taxId'])) $e['taxId'] = 'invalid';
    $c['holderDid'] = trim((string)($in['holderDid'] ?? ''));
    if ($c['holderDid'] !== '' && (!preg_match('/^did:(web|key):[A-Za-z0-9._:%-]{3,200}$/', $c['holderDid']) || $c['holderDid'] === constanciaIssuerDid())) $e['holderDid'] = 'invalid';
    $c['assetName'] = $text('assetName', 1, 200);
    $c['assetType'] = (string)($in['assetType'] ?? '');
    if (!isset(CONSTANCIA_ASSET_TYPES[$c['assetType']])) $e['assetType'] = 'invalid';
    $c['version'] = $text('version', 1, 60);
    $c['description'] = $text('description', 0, 500);
    $c['license'] = $text('license', 0, 80);
    $c['aiUse'] = (string)($in['aiUse'] ?? '');
    if (!isset(CONSTANCIA_AI_USE[$c['aiUse']])) $e['aiUse'] = 'invalid';
    $c['visibility'] = (string)($in['visibility'] ?? '');
    if (!in_array($c['visibility'], ['public', 'private'], true)) $e['visibility'] = 'invalid';
    if (($in['declaration'] ?? false) !== true) $e['declaration'] = 'required';

    $c['manifest'] = null; $c['digest'] = ''; $c['merkleRoot'] = null;
    $manifest = $in['manifest'] ?? null;
    if (is_array($manifest) && count($manifest) > 1) {
        if (count($manifest) > 5000) $e['asset'] = 'too_many_files';
        else try {
            $clean = array_map(fn($r) => ['path' => (string)($r['path'] ?? ''), 'sha512' => strtolower((string)($r['sha512'] ?? ''))], $manifest);
            $c['merkleRoot'] = $c['digest'] = constanciaMerkleRoot($clean);
            usort($clean, fn($a, $b) => strcmp($a['path'], $b['path']));
            $c['manifest'] = $clean;
        } catch (Throwable) { $e['asset'] = 'invalid_manifest'; }
    } else {
        $digest = strtolower((string)($in['digest'] ?? (is_array($manifest) && count($manifest) === 1 ? ($manifest[0]['sha512'] ?? '') : '')));
        if (!constanciaIsHex($digest, 128)) $e['asset'] = 'invalid_digest'; else $c['digest'] = $digest;
    }
    return [$c, $e];
}

/** Seals one asset. Everything happens inside one write transaction, so a failure never burns a number. */
function constanciaSeal(array $in): array {
    [$c, $errors] = constanciaValidateInput($in);
    if ($errors) throw new InvalidArgumentException(json_encode($errors));
    $pair = constanciaIssuerKeypair();
    if ($pair === null) throw new RuntimeException('issuer_not_configured');
    $tsaUrl = constanciaTsaUrl();
    if ($tsaUrl === '') throw new RuntimeException('tsa_not_configured');

    $pdo = constanciaDb();
    $pdo->exec('BEGIN IMMEDIATE');
    try {
        $year = (int)gmdate('Y');
        $seq = (int)$pdo->query('SELECT last FROM counters WHERE year=' . $year)->fetchColumn() + 1;
        $pdo->prepare('INSERT INTO counters (year, last) VALUES (?,?) ON CONFLICT(year) DO UPDATE SET last=excluded.last')->execute([$year, $seq]);
        $number = sprintf('HC-%04d-%06d', $year, $seq);

        $holder = ['type' => $c['holderType'], 'name' => $c['holderName']];
        if ($c['holderDid'] !== '') $holder['id'] = $c['holderDid'];
        $asset = ['name' => $c['assetName'], 'type' => $c['assetType'], 'version' => $c['version'],
            'digest' => ['alg' => 'SHA-512', 'value' => $c['digest']], 'merkleRoot' => $c['merkleRoot']];
        if ($c['description'] !== '') $asset['description'] = $c['description'];
        $subject = ['constancia' => $number, 'holder' => $holder, 'asset' => $asset,
            'declaration' => ['authorship' => true, 'aiUse' => $c['aiUse'], 'text' => CONSTANCIA_DECLARATION], 'visibility' => $c['visibility']];
        if ($c['license'] !== '') $subject['license'] = $c['license'];
        $document = ['@context' => ['https://www.w3.org/ns/credentials/v2'], 'id' => 'urn:uuid:' . constanciaUuid4(),
            'type' => ['VerifiableCredential', 'HashcodAssetCredential'], 'issuer' => constanciaIssuerDid(),
            'validFrom' => gmdate('Y-m-d\TH:i:s\Z'), 'credentialSubject' => $subject];

        $signed = constanciaSignCredential($document, $pair);
        $fingerprint = constanciaFingerprint($signed);

        $stamp = constanciaTsaStamp($tsaUrl, $fingerprint);
        $anchors = [['role' => 'primary', 'protocol' => 'rfc3161', 'url' => $stamp['url'], 'tsa' => $stamp['tsa'], 'genTime' => $stamp['genTime'], 'status' => 'ok']];
        $tsa2 = constanciaTsa2Url();
        $second = null;
        if ($tsa2 !== '') {
            try { $second = constanciaTsaStamp($tsa2, $fingerprint); $anchors[] = ['role' => 'external', 'protocol' => 'rfc3161', 'url' => $second['url'], 'tsa' => $second['tsa'], 'genTime' => $second['genTime'], 'status' => 'ok']; }
            catch (Throwable $err) { $anchors[] = ['role' => 'external', 'protocol' => 'rfc3161', 'url' => $tsa2, 'status' => 'failed', 'reason' => $err->getMessage()]; }
        }

        $ledgerHash = constanciaLedgerAppend($pdo, ['event' => 'issued', 'number' => $number, 'fingerprint' => $fingerprint, 'genTime' => $stamp['genTime'], 'credential' => $document['id']]);
        $receipt = ['number' => $number, 'fingerprint' => $fingerprint, 'genTime' => $stamp['genTime'], 'keyId' => constanciaKeyId(),
            'template' => CONSTANCIA_TEMPLATE_VERSION, 'ledgerHash' => $ledgerHash, 'sealSeed' => $fingerprint];
        $parts = ['credential.json' => constanciaJcs($signed), 'receipt.json' => constanciaJcs($receipt), 'timestamp.tsr' => $stamp['reply'], 'anchors.json' => constanciaJcs($anchors)];
        if ($second) $parts['anchor-2.tsr'] = $second['reply'];
        if ($c['manifest']) $parts['manifest.json'] = constanciaJcs($c['manifest']);
        $cod = constanciaBuildCod($parts);

        $taxEnc = $c['taxId'] !== '' && function_exists('secretsEncrypt') ? secretsEncrypt($c['taxId']) : null;
        $pdo->prepare('INSERT INTO constancias (number, year, seq, credential_id, holder_type, holder_name, holder_tax_id_enc, holder_did, asset_name, asset_type, version,
            description, license, ai_use, visibility, digest, merkle_root, manifest_json, credential_json, fingerprint, tsa_reply, tsa_gen_time, tsa_name, tsa_url,
            anchors_json, seal_seed, template_version, ledger_hash, cod, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
            ->execute([$number, $year, $seq, $document['id'], $c['holderType'], $c['holderName'], $taxEnc, $c['holderDid'] ?: null, $c['assetName'], $c['assetType'], $c['version'],
                $c['description'] ?: null, $c['license'] ?: null, $c['aiUse'], $c['visibility'], $c['digest'], $c['merkleRoot'], $c['manifest'] ? constanciaJcs($c['manifest']) : null,
                constanciaJcs($signed), $fingerprint, $stamp['reply'], $stamp['genTime'], $stamp['tsa'], $stamp['url'], constanciaJcs($anchors), $fingerprint, CONSTANCIA_TEMPLATE_VERSION,
                $ledgerHash, $cod, time()]);
        $pdo->exec('COMMIT');
    } catch (Throwable $err) {
        $pdo->exec('ROLLBACK');
        throw $err;
    }
    return ['number' => $number, 'fingerprint' => $fingerprint, 'genTime' => $stamp['genTime'], 'digest' => $c['digest'], 'merkleRoot' => $c['merkleRoot']];
}

function constanciaVerifyUrl(string $number, ?string $fingerprint = null): string {
    return 'https://' . constanciaDomain() . '/verify/' . $number . ($fingerprint ? '?h=' . substr($fingerprint, 0, 32) : '');
}

/** What this runtime can do: the hosted image has all of it; the Windows desktop build lacks the openssl CLI and Python renderer. */
function constanciaCapabilities(): array {
    static $caps = null;
    if ($caps !== null) return $caps;
    return $caps = [
        'storage' => extension_loaded('pdo_sqlite') && extension_loaded('zip'),
        'crypto' => function_exists('sodium_crypto_sign_detached'),
        'openssl' => constanciaRun(['openssl', 'version'])[0] === 0,
        'render' => constanciaRun([constanciaPython(), '-c', 'import reportlab, pypdf, PIL'])[0] === 0,
    ];
}

/* ---------- PDF ---------- */

function constanciaPython(): string { return is_executable('/opt/l8-py/bin/python') ? '/opt/l8-py/bin/python' : 'python3'; }

/** Renders the constancia PDF (with the .cod embedded) for a constancias row. Throws RuntimeException on failure. */
function constanciaRenderPdf(array $row): string {
    $signed = json_decode($row['credential_json'], true);
    $asset = $signed['credentialSubject']['asset'] ?? [];
    $isMerkle = !empty($row['merkle_root']);
    $genTime = (string)$row['tsa_gen_time'];
    $tsaName = trim((string)$row['tsa_name']);
    $request = [
        'number' => $row['number'], 'issuerDid' => $signed['issuer'], 'keyId' => substr((string)strrchr((string)$signed['proof']['verificationMethod'], '#'), 1),
        'keyVm' => $signed['proof']['verificationMethod'], 'credentialId' => $signed['id'],
        'holderName' => $row['holder_name'], 'assetName' => $row['asset_name'], 'assetTypeLabel' => CONSTANCIA_ASSET_TYPES[$row['asset_type']] ?? $row['asset_type'],
        'version' => $row['version'], 'description' => (string)$row['description'], 'license' => (string)$row['license'],
        'aiUseLabel' => CONSTANCIA_AI_USE[$row['ai_use']] ?? $row['ai_use'], 'declaration' => CONSTANCIA_DECLARATION,
        'genTimeUtc' => gmdate('Y-m-d H:i:s', strtotime($genTime)) . ' UTC', 'genTimeAst' => constanciaAstTime($genTime),
        'tsaSource' => $tsaName !== '' ? $tsaName : (parse_url((string)$row['tsa_url'], PHP_URL_HOST) ?: 'TSA'), 'tsaUrl' => (string)$row['tsa_url'],
        'digestLabel' => $isMerkle ? 'Raíz Merkle del activo (SHA-512)' : 'Hash del activo (SHA-512)', 'digest' => $row['digest'],
        'fingerprint' => $row['fingerprint'], 'verifyUrl' => constanciaVerifyUrl($row['number']), 'qrUrl' => constanciaVerifyUrl($row['number'], $row['fingerprint']),
        'sealOps' => constanciaSealOps($row['seal_seed']), 'codB64' => base64_encode($row['cod']),
    ];
    $script = __DIR__ . '/scripts/constancia_render.py';
    $proc = @proc_open([constanciaPython(), $script], [0 => ['pipe', 'r'], 1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $pipes, __DIR__);
    if (!is_resource($proc)) throw new RuntimeException('render_unavailable');
    fwrite($pipes[0], json_encode($request, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    fclose($pipes[0]);
    $pdf = stream_get_contents($pipes[1]); $err = stream_get_contents($pipes[2]);
    fclose($pipes[1]); fclose($pipes[2]);
    if (proc_close($proc) !== 0 || !is_string($pdf) || strncmp($pdf, '%PDF-', 5) !== 0) {
        error_log('constancia render failed: ' . substr((string)$err, 0, 500));
        throw new RuntimeException('render_failed');
    }
    return $pdf;
}

/* ---------- tool access (signature gate) ---------- */

/** Accepts a signature pasted or read from a .txt file: strips whitespace, quotes and parentheses; returns raw bytes or null. */
function constanciaNormalizeSignature(string $text): ?string {
    $b64 = preg_replace('/\s+/', '', trim($text, " \t\r\n()\"'`"));
    if (!is_string($b64) || strlen($b64) < 64 || strlen($b64) > 20000 || !preg_match('/^[A-Za-z0-9+\/]+={0,2}$/', $b64)) return null;
    $raw = base64_decode($b64, true);
    return is_string($raw) && $raw !== '' ? $raw : null;
}

/** SHA-256 hex digests (comma/space separated) of the signatures allowed to open the tool. Never the signature itself. */
function constanciaAllowedSignatureHashes(): array {
    $list = preg_split('/[\s,;]+/', strtolower(constanciaEnv('HASHCOD_SEAL_ACCESS_SIGNATURE_SHA256')), -1, PREG_SPLIT_NO_EMPTY) ?: [];
    return array_values(array_filter($list, fn($h) => constanciaIsHex($h, 64)));
}

function constanciaSignatureAllowed(string $text): bool {
    $raw = constanciaNormalizeSignature($text);
    $allowed = constanciaAllowedSignatureHashes();
    if ($raw === null || !$allowed) return false;
    $hash = hash('sha256', $raw);
    $ok = false;
    foreach ($allowed as $candidate) $ok = hash_equals($candidate, $hash) || $ok; // no early exit
    return $ok;
}
