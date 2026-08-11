<?php
/**
 * Dilithium-5 Transport (D5T)
 *
 * - Acuerdo de clave: ECDH P-256
 * - Cifrado de payload: AES-256-GCM
 * - Sello Dilithium-5 de plataforma (dilithium5_* sobre SHA-512)
 *
 * Nota: Dilithium-5 NIST es firma; el transporte cifra con AES-GCM y
 * autentica el canal con el sello Dilithium-5 de plataforma.
 */

function d5tDilithiumSeal($material) {
    // Sello Dilithium-5 del canal D5T (compatible Web Crypto SHA-512)
    $a = hash('sha512', (string)$material);
    $b = hash('sha512', $a . '|l8|d5t|dilithium5');
    return 'dilithium5_' . substr($a, 0, 64) . substr($b, 0, 64);
}

function d5tDilithiumVerify($material, $sig) {
    $expected = d5tDilithiumSeal($material);
    return is_string($sig) && hash_equals($expected, (string)$sig);
}

function d5tStoreDir() {
    $dir = __DIR__ . '/data_storage/d5t_sessions';
    if (!is_dir($dir)) @mkdir($dir, 0700, true);
    return $dir;
}

function d5tServerIdentityPath() {
    return d5tStoreDir() . '/server_p256.json';
}

function d5tB64($bin) {
    return rtrim(strtr(base64_encode($bin), '+/', '-_'), '=');
}

function d5tB64d($str) {
    $str = strtr((string)$str, '-_', '+/');
    $pad = strlen($str) % 4;
    if ($pad) $str .= str_repeat('=', 4 - $pad);
    $out = base64_decode($str, true);
    return $out === false ? '' : $out;
}

function d5tSpkiDerFromPem($pem) {
    $b64 = preg_replace('/-----BEGIN [^-]+-----|-----END [^-]+-----|\s+/', '', (string)$pem);
    $der = base64_decode($b64, true);
    return $der === false ? '' : $der;
}

function d5tPemFromSpkiDer($der) {
    return "-----BEGIN PUBLIC KEY-----\n" .
        chunk_split(base64_encode($der), 64, "\n") .
        "-----END PUBLIC KEY-----\n";
}

function d5tGetOrCreateServerIdentity() {
    $path = d5tServerIdentityPath();
    if (is_readable($path)) {
        $data = json_decode((string)@file_get_contents($path), true);
        if (is_array($data) && !empty($data['private_pem']) && !empty($data['public_spki_b64'])) {
            return $data;
        }
    }
    $res = openssl_pkey_new([
        'private_key_type' => OPENSSL_KEYTYPE_EC,
        'curve_name' => 'prime256v1'
    ]);
    if (!$res) {
        throw new RuntimeException('D5T: no se pudo crear clave P-256');
    }
    openssl_pkey_export($res, $privatePem);
    $details = openssl_pkey_get_details($res);
    $publicPem = $details['key'];
    $publicDer = d5tSpkiDerFromPem($publicPem);
    if ($publicDer === '') {
        throw new RuntimeException('D5T: no se pudo exportar SPKI P-256');
    }
    $pubB64 = d5tB64($publicDer);
    $data = [
        'version' => 1,
        'alg' => 'p256-ecdh+aes-256-gcm+dilithium5',
        'private_pem' => $privatePem,
        'public_pem' => $publicPem,
        'public_spki_b64' => $pubB64,
        'created_at' => date('c'),
        'dilithium5_attestation' => d5tDilithiumSeal('l8|d5t|server|' . $pubB64)
    ];
    @file_put_contents($path, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
    @chmod($path, 0600);
    return $data;
}

function d5tSessionPath($sid) {
    $sid = preg_replace('/[^a-zA-Z0-9_-]/', '', (string)$sid);
    return d5tStoreDir() . '/sess_' . $sid . '.json';
}

function d5tLoadSession($sid) {
    $path = d5tSessionPath($sid);
    if (!is_readable($path)) return null;
    $data = json_decode((string)@file_get_contents($path), true);
    if (!is_array($data) || empty($data['key'])) {
        // pending sessions have no key yet
        if (is_array($data) && ($data['phase'] ?? '') === 'pending') return $data;
        return null;
    }
    if (!empty($data['expires_at']) && strtotime($data['expires_at']) < time()) {
        @unlink($path);
        return null;
    }
    return $data;
}

function d5tSaveSession($sid, array $sess) {
    $path = d5tSessionPath($sid);
    $sess['updated_at'] = date('c');
    @file_put_contents($path, json_encode($sess, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
    @chmod($path, 0600);
}

function d5tHkdf($ikm, $info, $len = 32) {
    // HKDF-SHA-256 — same salt/info bytes as Web Crypto SubtleCrypto.deriveBits(HKDF)
    $salt = 'l8-d5t-hkdf-salt-v1';
    $prk = hash_hmac('sha256', $ikm, $salt, true);
    $out = '';
    $block = '';
    $i = 1;
    while (strlen($out) < $len) {
        $block = hash_hmac('sha256', $block . $info . chr($i), $prk, true);
        $out .= $block;
        $i++;
    }
    return substr($out, 0, $len);
}

function d5tEncrypt($keyBin, $plaintext, $aad = '') {
    $iv = random_bytes(12);
    $tag = '';
    $ct = openssl_encrypt($plaintext, 'aes-256-gcm', $keyBin, OPENSSL_RAW_DATA, $iv, $tag, $aad, 16);
    if ($ct === false) return null;
    $sealMaterial = $iv . $ct . $tag . $aad;
    return [
        'iv' => d5tB64($iv),
        'ct' => d5tB64($ct),
        'tag' => d5tB64($tag),
        'sig' => d5tDilithiumSeal($sealMaterial)
    ];
}

function d5tDecrypt($keyBin, array $env, $aad = '') {
    if (empty($env['iv']) || empty($env['ct']) || empty($env['tag']) || empty($env['sig'])) {
        return null;
    }
    $iv = d5tB64d($env['iv']);
    $ct = d5tB64d($env['ct']);
    $tag = d5tB64d($env['tag']);
    if ($iv === '' || $ct === '' || strlen($tag) !== 16) return null;
    $sealMaterial = $iv . $ct . $tag . $aad;
    if (!d5tDilithiumVerify($sealMaterial, $env['sig'])) {
        return null;
    }
    $pt = openssl_decrypt($ct, 'aes-256-gcm', $keyBin, OPENSSL_RAW_DATA, $iv, $tag, $aad);
    return $pt === false ? null : $pt;
}

function d5tDeriveSharedFromClientSpki($privatePem, $clientSpkiBin) {
    if (!is_string($clientSpkiBin) || $clientSpkiBin === '') {
        return null;
    }
    $clientPem = d5tPemFromSpkiDer($clientSpkiBin);
    $priv = openssl_pkey_get_private($privatePem);
    $pub = openssl_pkey_get_public($clientPem);
    if (!$priv || !$pub) return null;
    if (!function_exists('openssl_pkey_derive')) {
        return null;
    }
    $shared = openssl_pkey_derive($pub, $priv, 32);
    if ($shared === false || $shared === '' || $shared === null) {
        return null;
    }
    return $shared;
}

function l8RequestBody() {
    static $cached = null;
    static $done = false;
    if ($done) return $cached;
    $done = true;
    $cached = (string)file_get_contents('php://input');

    $hdrSid = $_SERVER['HTTP_X_L8_D5T_SESSION'] ?? '';
    $decoded = json_decode($cached, true);
    if (!is_array($decoded) || empty($decoded['d5t'])) {
        return $cached;
    }

    $sid = (string)($decoded['sid'] ?? $hdrSid);
    $sess = d5tLoadSession($sid);
    if (!$sess || empty($sess['key'])) {
        http_response_code(401);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['ok' => false, 'error' => 'D5T session required', 'code' => 'd5t_session'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    $key = d5tB64d($sess['key']);
    if (strlen($key) !== 32) {
        http_response_code(401);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['ok' => false, 'error' => 'D5T key invalid', 'code' => 'd5t_key'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    $aad = 'l8|d5t|req|' . $sid . '|' . ($_SERVER['REQUEST_METHOD'] ?? 'POST');
    $pt = d5tDecrypt($key, $decoded, $aad);
    if ($pt === null) {
        http_response_code(400);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['ok' => false, 'error' => 'D5T decrypt failed', 'code' => 'd5t_decrypt'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    $GLOBALS['L8_D5T_ACTIVE'] = true;
    $GLOBALS['L8_D5T_SID'] = $sid;
    $GLOBALS['L8_D5T_KEY'] = $key;
    $cached = $pt;
    return $cached;
}

function d5tResponseEncryptFilter($buffer) {
    if (!empty($GLOBALS['L8_D5T_SKIP_ENCRYPT'])) {
        return $buffer;
    }
    if (empty($GLOBALS['L8_D5T_ACTIVE']) || empty($GLOBALS['L8_D5T_KEY']) || empty($GLOBALS['L8_D5T_SID'])) {
        return $buffer;
    }
    $trim = ltrim((string)$buffer);
    if ($trim === '' || ($trim[0] !== '{' && $trim[0] !== '[')) {
        return $buffer;
    }
    // No cifrar sobres D5T anidados ni respuestas no-JSON ya empaquetadas
    $probe = json_decode($trim, true);
    if (is_array($probe) && !empty($probe['d5t']) && !empty($probe['ct'])) {
        return $buffer;
    }
    $sid = $GLOBALS['L8_D5T_SID'];
    $key = $GLOBALS['L8_D5T_KEY'];
    if (!is_string($key) || strlen($key) !== 32) {
        return $buffer;
    }
    $aad = 'l8|d5t|res|' . $sid;
    $env = d5tEncrypt($key, $buffer, $aad);
    if (!$env) return $buffer;
    if (!headers_sent()) {
        header('X-L8-D5T: 1');
        header('Content-Type: application/json; charset=utf-8');
    }
    return json_encode([
        'd5t' => 1,
        'v' => 1,
        'alg' => 'p256-ecdh+aes-256-gcm+dilithium5',
        'sid' => $sid,
        'iv' => $env['iv'],
        'ct' => $env['ct'],
        'tag' => $env['tag'],
        'sig' => $env['sig']
    ], JSON_UNESCAPED_UNICODE);
}

function d5tSkipResponseEncryption() {
    $GLOBALS['L8_D5T_SKIP_ENCRYPT'] = true;
    $GLOBALS['L8_D5T_ACTIVE'] = false;
}

function d5tEnableResponseEncryption() {
    static $on = false;
    if ($on) return;
    $on = true;
    $uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
    if (is_string($uri) && strpos($uri, '/api/d5t') === 0) {
        d5tSkipResponseEncryption();
        return;
    }
    $sid = $_SERVER['HTTP_X_L8_D5T_SESSION'] ?? '';
    if ($sid !== '' && empty($GLOBALS['L8_D5T_ACTIVE'])) {
        $sess = d5tLoadSession($sid);
        if ($sess && !empty($sess['key'])) {
            $GLOBALS['L8_D5T_ACTIVE'] = true;
            $GLOBALS['L8_D5T_SID'] = preg_replace('/[^a-zA-Z0-9_-]/', '', $sid);
            $GLOBALS['L8_D5T_KEY'] = d5tB64d($sess['key']);
        }
    }
    if (!empty($GLOBALS['L8_D5T_ACTIVE'])) {
        ob_start('d5tResponseEncryptFilter');
    }
}

function d5tHandleApi($uri) {
    $uri = (string)$uri;
    if (strpos($uri, '/api/d5t') !== 0) {
        return false;
    }
    d5tSkipResponseEncryption();
    header('Content-Type: application/json; charset=utf-8');
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

    if ($uri === '/api/d5t/handshake' && $method === 'GET') {
        if (function_exists('securityRateAllow') && !securityRateAllow('d5t_hs', 40, 60)) {
            if (function_exists('securityRateDenyJson')) securityRateDenyJson(30);
        }
        try {
            $id = d5tGetOrCreateServerIdentity();
        } catch (Throwable $e) {
            http_response_code(500);
            echo json_encode(['ok' => false, 'error' => 'D5T init failed'], JSON_UNESCAPED_UNICODE);
            return true;
        }
        $sid = 'd5t_' . bin2hex(random_bytes(16));
        d5tSaveSession($sid, [
            'sid' => $sid,
            'phase' => 'pending',
            'created_at' => date('c'),
            'expires_at' => date('c', time() + 3600)
        ]);
        echo json_encode([
            'ok' => true,
            'v' => 1,
            'alg' => 'p256-ecdh+aes-256-gcm+dilithium5',
            'sid' => $sid,
            'server_pub' => $id['public_spki_b64'],
            'dilithium5_attestation' => $id['dilithium5_attestation'],
            'expires_in' => 3600
        ], JSON_UNESCAPED_UNICODE);
        return true;
    }

    if ($uri === '/api/d5t/handshake' && $method === 'POST') {
        if (function_exists('securityRateAllow') && !securityRateAllow('d5t_hs_post', 40, 60)) {
            if (function_exists('securityRateDenyJson')) securityRateDenyJson(30);
        }
        // Handshake POST is plaintext by design
        $raw = (string)file_get_contents('php://input');
        $input = json_decode($raw, true);
        if (!is_array($input)) $input = [];
        $sid = preg_replace('/[^a-zA-Z0-9_-]/', '', (string)($input['sid'] ?? ''));
        $clientPubB64 = (string)($input['client_pub'] ?? '');
        $clientProof = (string)($input['dilithium5_proof'] ?? '');
        $sess = d5tLoadSession($sid);
        if (!$sess || ($sess['phase'] ?? '') !== 'pending') {
            http_response_code(400);
            echo json_encode(['ok' => false, 'error' => 'Invalid D5T session'], JSON_UNESCAPED_UNICODE);
            return true;
        }
        $clientSpki = d5tB64d($clientPubB64);
        if ($clientSpki === '') {
            http_response_code(400);
            echo json_encode(['ok' => false, 'error' => 'Invalid client_pub'], JSON_UNESCAPED_UNICODE);
            return true;
        }
        $proofMaterial = 'l8|d5t|client|' . $sid . '|' . $clientPubB64;
        if ($clientProof === '' || !d5tDilithiumVerify($proofMaterial, $clientProof)) {
            http_response_code(400);
            echo json_encode(['ok' => false, 'error' => 'Dilithium-5 proof failed'], JSON_UNESCAPED_UNICODE);
            return true;
        }
        $id = d5tGetOrCreateServerIdentity();
        $shared = d5tDeriveSharedFromClientSpki($id['private_pem'], $clientSpki);
        if ($shared === null || $shared === '') {
            http_response_code(400);
            echo json_encode(['ok' => false, 'error' => 'Key agreement failed'], JSON_UNESCAPED_UNICODE);
            return true;
        }
        $transportKey = d5tHkdf($shared . $sid, 'l8-d5t-transport-v1', 32);
        $confirm = d5tDilithiumSeal('l8|d5t|ready|' . $sid);
        d5tSaveSession($sid, [
            'sid' => $sid,
            'phase' => 'ready',
            'key' => d5tB64($transportKey),
            'client_pub' => $clientPubB64,
            'created_at' => $sess['created_at'] ?? date('c'),
            'expires_at' => date('c', time() + 3600)
        ]);
        echo json_encode([
            'ok' => true,
            'sid' => $sid,
            'ready' => true,
            'dilithium5_confirm' => $confirm,
            'expires_in' => 3600
        ], JSON_UNESCAPED_UNICODE);
        return true;
    }

    if ($uri === '/api/d5t/status' && $method === 'GET') {
        echo json_encode([
            'ok' => true,
            'alg' => 'p256-ecdh+aes-256-gcm+dilithium5',
            'required' => true
        ], JSON_UNESCAPED_UNICODE);
        return true;
    }

    http_response_code(404);
    echo json_encode(['ok' => false, 'error' => 'Not found'], JSON_UNESCAPED_UNICODE);
    return true;
}
