<?php
/**
 * Auth gate l8 codespace — registro / login.
 *
 * La clave Dilithium-5 mensual de registro SOLO vive en entorno:
 *   L8_DILITHIUM5_REGISTER_KEY
 * Nunca se escribe en el repo ni se expone por API.
 */

require_once __DIR__ . '/supabase.php';

function authStorageDir() {
    $dir = __DIR__ . '/data_storage/auth';
    if (!is_dir($dir)) {
        @mkdir($dir, 0777, true);
    }
    return $dir;
}

function authUsersPath() {
    return authStorageDir() . '/users.json';
}

function authPepper() {
    $pepper = envValue('L8_AUTH_PEPPER', '');
    if ($pepper !== '') {
        return $pepper;
    }
    $pepperFile = authStorageDir() . '/.pepper';
    if (is_readable($pepperFile)) {
        $existing = trim((string)@file_get_contents($pepperFile));
        if ($existing !== '') {
            return $existing;
        }
    }
    $generated = bin2hex(random_bytes(32));
    @file_put_contents($pepperFile, $generated);
    @chmod($pepperFile, 0600);
    return $generated;
}

function authHashKey($plaintext) {
    return hash_hmac('sha256', (string)$plaintext, authPepper());
}

function authTimingSafeEqual($a, $b) {
    $a = (string)$a;
    $b = (string)$b;
    if (function_exists('hash_equals')) {
        return hash_equals($a, $b);
    }
    if (strlen($a) !== strlen($b)) {
        return false;
    }
    $res = 0;
    for ($i = 0; $i < strlen($a); $i++) {
        $res |= ord($a[$i]) ^ ord($b[$i]);
    }
    return $res === 0;
}

function authDilithiumRegisterKey() {
    // Única fuente: entorno / secret file. Jamás hardcode.
    return envValue('L8_DILITHIUM5_REGISTER_KEY', '');
}

function authDilithiumConfigured() {
    return authDilithiumRegisterKey() !== '';
}

function authVerifyDilithium($provided) {
    $expected = authDilithiumRegisterKey();
    if ($expected === '') {
        return ['ok' => false, 'error' => 'Registro no disponible: falta L8_DILITHIUM5_REGISTER_KEY en el servidor'];
    }
    $provided = trim((string)$provided);
    if ($provided === '') {
        return ['ok' => false, 'error' => 'Introduce la Dilithium-5 de registro'];
    }
    if (!authTimingSafeEqual($provided, $expected)) {
        return ['ok' => false, 'error' => 'Dilithium-5 incorrecta'];
    }
    return ['ok' => true];
}

function authLoadStore() {
    $path = authUsersPath();
    if (function_exists('supabaseHydrateMetaFile')) {
        @supabaseHydrateMetaFile($path, 'auth_users.json', true);
    }
    if (!is_readable($path)) {
        return [
            'version' => 1,
            'users' => [],
            'key_hashes' => [],
            'sessions' => []
        ];
    }
    $data = json_decode((string)@file_get_contents($path), true);
    if (!is_array($data)) {
        return [
            'version' => 1,
            'users' => [],
            'key_hashes' => [],
            'sessions' => []
        ];
    }
    $data['users'] = is_array($data['users'] ?? null) ? $data['users'] : [];
    $data['key_hashes'] = is_array($data['key_hashes'] ?? null) ? $data['key_hashes'] : [];
    $data['sessions'] = is_array($data['sessions'] ?? null) ? $data['sessions'] : [];
    return $data;
}

function authSaveStore(array $store) {
    $path = authUsersPath();
    $store['version'] = 1;
    $store['updated_at'] = date('c');
    $ok = @file_put_contents(
        $path,
        json_encode($store, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        LOCK_EX
    );
    if ($ok === false) {
        return ['ok' => false, 'error' => 'No se pudo guardar el registro de cuentas'];
    }
    if (function_exists('supabaseSyncMetaFile')) {
        @supabaseSyncMetaFile($path, 'auth_users.json');
    }
    return ['ok' => true];
}

function authGenerateAes256Key() {
    // 32 bytes → hex (representación AES-256)
    return strtoupper(bin2hex(random_bytes(32)));
}

function authGenerateIdentityKey() {
    // Identificador de plataforma distinto a Dilithium-5 y a AES-256
    // Formato: L8ID-<base64url 48 bytes>
    $raw = random_bytes(48);
    $b64 = rtrim(strtr(base64_encode($raw), '+/', '-_'), '=');
    return 'L8ID-' . $b64;
}

function authGenerateUniqueKeyPair(array &$store) {
    for ($attempt = 0; $attempt < 12; $attempt++) {
        $aes = authGenerateAes256Key();
        $identity = authGenerateIdentityKey();
        if ($aes === $identity) {
            continue;
        }
        $aesHash = authHashKey($aes);
        $idHash = authHashKey($identity);
        if ($aesHash === $idHash) {
            continue;
        }
        if (isset($store['key_hashes'][$aesHash]) || isset($store['key_hashes'][$idHash])) {
            continue;
        }
        // También asegurar que no coincidan con la Dilithium-5 de registro
        $dil = authDilithiumRegisterKey();
        if ($dil !== '' && (authTimingSafeEqual($aes, $dil) || authTimingSafeEqual($identity, $dil))) {
            continue;
        }
        return [
            'ok' => true,
            'aes256' => $aes,
            'identity' => $identity,
            'aes256_hash' => $aesHash,
            'identity_hash' => $idHash
        ];
    }
    return ['ok' => false, 'error' => 'No se pudieron generar claves únicas; reintenta'];
}

function authNewAccountId() {
    return 'acct_' . bin2hex(random_bytes(8));
}

function authCreateSession(array &$store, $userId) {
    $token = bin2hex(random_bytes(32));
    $tokenHash = authHashKey($token);
    // limpia sesiones vencidas
    $now = time();
    foreach ($store['sessions'] as $h => $sess) {
        if (!is_array($sess) || (int)($sess['expires_at'] ?? 0) < $now) {
            unset($store['sessions'][$h]);
        }
    }
    $store['sessions'][$tokenHash] = [
        'user_id' => $userId,
        'created_at' => date('c'),
        'expires_at' => $now + (60 * 60 * 24 * 30) // 30 días
    ];
    return $token;
}

function authRegister($dilithium5) {
    $check = authVerifyDilithium($dilithium5);
    if (empty($check['ok'])) {
        return $check;
    }

    $store = authLoadStore();
    $pair = authGenerateUniqueKeyPair($store);
    if (empty($pair['ok'])) {
        return $pair;
    }

    $userId = authNewAccountId();
    while (isset($store['users'][$userId])) {
        $userId = authNewAccountId();
    }

    $store['users'][$userId] = [
        'id' => $userId,
        'created_at' => date('c'),
        'aes256_hash' => $pair['aes256_hash'],
        'identity_hash' => $pair['identity_hash']
    ];
    $store['key_hashes'][$pair['aes256_hash']] = $userId;
    $store['key_hashes'][$pair['identity_hash']] = $userId;

    $token = authCreateSession($store, $userId);
    $saved = authSaveStore($store);
    if (empty($saved['ok'])) {
        return $saved;
    }

    return [
        'ok' => true,
        'account_id' => $userId,
        'session_token' => $token,
        'keys' => [
            'aes256' => $pair['aes256'],
            'identity' => $pair['identity']
        ],
        'warning' => 'Guarda estas 2 claves ahora. No se volverán a mostrar. Las necesitas para iniciar sesión.'
    ];
}

function authLogin($aes256, $identity) {
    $aes256 = trim((string)$aes256);
    $identity = trim((string)$identity);
    if ($aes256 === '' || $identity === '') {
        return ['ok' => false, 'error' => 'Debes introducir las 2 claves de acceso'];
    }
    if (authTimingSafeEqual($aes256, $identity)) {
        return ['ok' => false, 'error' => 'Las dos claves deben ser distintas'];
    }

    $store = authLoadStore();
    $aesHash = authHashKey($aes256);
    $idHash = authHashKey($identity);

    $userFromAes = $store['key_hashes'][$aesHash] ?? null;
    $userFromId = $store['key_hashes'][$idHash] ?? null;

    if (!$userFromAes || !$userFromId || $userFromAes !== $userFromId) {
        return ['ok' => false, 'error' => 'Claves incorrectas. Acceso denegado.'];
    }

    $user = $store['users'][$userFromAes] ?? null;
    if (!is_array($user)) {
        return ['ok' => false, 'error' => 'Cuenta no encontrada'];
    }

    // Verificar que cada hash corresponde al campo correcto
    if (
        !authTimingSafeEqual($user['aes256_hash'] ?? '', $aesHash) ||
        !authTimingSafeEqual($user['identity_hash'] ?? '', $idHash)
    ) {
        return ['ok' => false, 'error' => 'Claves incorrectas. Acceso denegado.'];
    }

    $token = authCreateSession($store, $user['id']);
    $saved = authSaveStore($store);
    if (empty($saved['ok'])) {
        return $saved;
    }

    return [
        'ok' => true,
        'account_id' => $user['id'],
        'session_token' => $token
    ];
}

function authValidateSession($token) {
    $token = trim((string)$token);
    if ($token === '') {
        return ['ok' => false, 'authenticated' => false, 'error' => 'Sin sesión'];
    }
    $store = authLoadStore();
    $tokenHash = authHashKey($token);
    $sess = $store['sessions'][$tokenHash] ?? null;
    if (!is_array($sess)) {
        return ['ok' => false, 'authenticated' => false, 'error' => 'Sesión inválida'];
    }
    if ((int)($sess['expires_at'] ?? 0) < time()) {
        unset($store['sessions'][$tokenHash]);
        authSaveStore($store);
        return ['ok' => false, 'authenticated' => false, 'error' => 'Sesión expirada'];
    }
    $userId = $sess['user_id'] ?? '';
    if ($userId === '' || !isset($store['users'][$userId])) {
        return ['ok' => false, 'authenticated' => false, 'error' => 'Cuenta inválida'];
    }
    return [
        'ok' => true,
        'authenticated' => true,
        'account_id' => $userId
    ];
}

function authLogout($token) {
    $token = trim((string)$token);
    if ($token === '') {
        return ['ok' => true];
    }
    $store = authLoadStore();
    $tokenHash = authHashKey($token);
    unset($store['sessions'][$tokenHash]);
    authSaveStore($store);
    return ['ok' => true];
}

function authStatusPublic() {
    $store = authLoadStore();
    return [
        'ok' => true,
        'register_gate_configured' => authDilithiumConfigured(),
        'accounts' => count($store['users']),
        'period_hint' => envValue('L8_DILITHIUM5_REGISTER_PERIOD', date('Y-m'))
    ];
}

function authBearerTokenFromRequest() {
    $hdr = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
    if (preg_match('/Bearer\s+(\S+)/i', $hdr, $m)) {
        return $m[1];
    }
    $input = json_decode((string)file_get_contents('php://input'), true);
    if (is_array($input) && !empty($input['session_token'])) {
        return (string)$input['session_token'];
    }
    if (!empty($_GET['token'])) {
        return (string)$_GET['token'];
    }
    return '';
}

/**
 * Maneja rutas /api/auth/* — retorna true si respondió.
 */
function authHandleApi($uri) {
    $uri = (string)$uri;
    if (strpos($uri, '/api/auth') !== 0) {
        return false;
    }

    header('Content-Type: application/json; charset=utf-8');
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

    if ($uri === '/api/auth/status' && $method === 'GET') {
        echo json_encode(authStatusPublic(), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        return true;
    }

    if ($uri === '/api/auth/session' && $method === 'GET') {
        $token = authBearerTokenFromRequest();
        echo json_encode(authValidateSession($token), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        return true;
    }

    if ($uri === '/api/auth/register' && $method === 'POST') {
        $input = json_decode((string)file_get_contents('php://input'), true) ?? [];
        $dil = $input['dilithium5'] ?? $input['dilithium_5'] ?? $input['d5'] ?? '';
        $res = authRegister($dil);
        if (empty($res['ok'])) {
            http_response_code(401);
        }
        echo json_encode($res, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        return true;
    }

    if ($uri === '/api/auth/login' && $method === 'POST') {
        $input = json_decode((string)file_get_contents('php://input'), true) ?? [];
        $aes = $input['aes256'] ?? $input['aes_256'] ?? $input['key_aes'] ?? '';
        $identity = $input['identity'] ?? $input['identity_key'] ?? $input['key_identity'] ?? '';
        $res = authLogin($aes, $identity);
        if (empty($res['ok'])) {
            http_response_code(401);
        }
        echo json_encode($res, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        return true;
    }

    if ($uri === '/api/auth/logout' && $method === 'POST') {
        $token = authBearerTokenFromRequest();
        echo json_encode(authLogout($token), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        return true;
    }

    http_response_code(404);
    echo json_encode(['ok' => false, 'error' => 'Ruta auth desconocida'], JSON_UNESCAPED_UNICODE);
    return true;
}
