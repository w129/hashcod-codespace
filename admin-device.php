<?php
declare(strict_types=1);

// Public credential explicitly enrolled by the owner. No enrollment API can replace it.
const ADMIN_DEVICE_RP = 'hashcod-codespace-1.onrender.com';
const ADMIN_DEVICE_ORIGIN = 'https://' . ADMIN_DEVICE_RP;
const ADMIN_DEVICE_NETWORK = '38.196.115.0/24';
const ADMIN_DEVICE_ID = '6NCenKRQlsDlMjqmJ-kX_UweDaHdj8XjlVEYCzFoX3k';
const ADMIN_DEVICE_SPKI = 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEgz_jckNI4CqWa-hsLab58p3DDRIreQH_42zwu0U-L39eBCaJMh-mzfQHToIy_3apeX0HmaZ2RYGTy7G2__jUVA';

function adminB64(string $bytes): string { return rtrim(strtr(base64_encode($bytes), '+/', '-_'), '='); }
function adminUnb64($value): string {
    if (!is_string($value) || $value === '' || strlen($value) > 16384 || !preg_match('/^[A-Za-z0-9_-]+$/D', $value)) throw new RuntimeException('Codificación inválida');
    $decoded = base64_decode(strtr($value, '-_', '+/'), true);
    if ($decoded === false || adminB64($decoded) !== $value) throw new RuntimeException('Codificación inválida');
    return $decoded;
}

function adminClientIp(array $server): string {
    // Render's public ingress is protected by Cloudflare. Caddy overwrites this
    // private upstream header with Cloudflare's single visitor address. XFF can
    // contain an attacker-controlled prefix and must never authorize a client.
    if (getenv('RENDER') !== 'true' || ($server['REMOTE_ADDR'] ?? '') !== '127.0.0.1') return '';
    $ip = trim((string)($server['HTTP_X_L8_RENDER_CF_IP'] ?? ''));
    return filter_var($ip, FILTER_VALIDATE_IP) ? $ip : '';
}

function adminIpAllowed(string $ip): bool {
    // Exact IPv4 /24 approved by the owner; no IPv6 or textual prefix matching.
    if (!filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) return false;
    return substr(inet_pton($ip), 0, 3) === substr(inet_pton(explode('/', ADMIN_DEVICE_NETWORK)[0]), 0, 3);
}

function adminSameOrigin(array $server): bool {
    if (($server['HTTP_HOST'] ?? '') !== ADMIN_DEVICE_RP) return false;
    if (isset($server['HTTP_ORIGIN'])) return $server['HTTP_ORIGIN'] === ADMIN_DEVICE_ORIGIN;
    return ($server['REQUEST_METHOD'] ?? '') === 'GET' && ($server['HTTP_SEC_FETCH_SITE'] ?? '') === 'same-origin';
}

function adminJson(int $status, array $body): never {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store, private');
    header('Vary: Cookie');
    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function adminSession(): void {
    if (session_status() === PHP_SESSION_ACTIVE) return;
    $dir = __DIR__ . '/data_storage/admin-sessions';
    if (!is_dir($dir) && !mkdir($dir, 0700, true) && !is_dir($dir)) adminJson(503, ['ok'=>false, 'error'=>'Almacenamiento administrativo no disponible']);
    ini_set('session.use_strict_mode', '1');
    ini_set('session.use_only_cookies', '1');
    ini_set('session.gc_maxlifetime', '900');
    session_save_path($dir);
    session_name('__Host-hashcod_admin');
    session_set_cookie_params(['lifetime'=>0, 'path'=>'/', 'secure'=>true, 'httponly'=>true, 'samesite'=>'Strict']);
    if (!session_start()) adminJson(503, ['ok'=>false, 'error'=>'Sesión administrativa no disponible']);
}

function adminAuthorized(): bool {
    if (!adminIpAllowed(adminClientIp($_SERVER)) || !adminSameOrigin($_SERVER)) return false;
    adminSession();
    return ($_SESSION['admin_until'] ?? 0) > time()
        && ($_SESSION['admin_network'] ?? '') === ADMIN_DEVICE_NETWORK
        && ($_SESSION['admin_credential'] ?? '') === hash('sha256', ADMIN_DEVICE_ID . ADMIN_DEVICE_SPKI);
}

function adminRequire(): void {
    if (!adminAuthorized()) adminJson(403, ['ok'=>false, 'error'=>'Acceso administrativo restringido: usa la laptop registrada, Windows Hello y la IP autorizada.']);
}

function adminProtectedPath(string $path): bool {
    return str_starts_with($path, '/api/admin/') || in_array($path, [
        '/api/auth/dilithium-active-key', '/api/auth/list-accounts',
        '/api/auth/suspend-account', '/api/auth/reactivate-account', '/api/auth/delete-account', '/api/auth/delete'
    ], true);
}

// Verify the WebAuthn assertion, including the signed authenticator flags.
function adminVerifyAssertion(array $input, string $challenge, string $id = ADMIN_DEVICE_ID, string $spki = ADMIN_DEVICE_SPKI): bool {
    try {
        if (($input['type'] ?? '') !== 'public-key' || !hash_equals($id, (string)($input['id'] ?? ''))) return false;
        $clientBytes = adminUnb64($input['clientDataJSON'] ?? null);
        $client = json_decode($clientBytes, true, 16, JSON_THROW_ON_ERROR);
        if (!is_array($client) || ($client['type'] ?? '') !== 'webauthn.get' || ($client['origin'] ?? '') !== ADMIN_DEVICE_ORIGIN
            || ($client['crossOrigin'] ?? false) !== false || isset($client['topOrigin'])
            || !hash_equals($challenge, (string)($client['challenge'] ?? ''))) return false;
        $auth = adminUnb64($input['authenticatorData'] ?? null);
        if (strlen($auth) < 37 || !hash_equals(hash('sha256', ADMIN_DEVICE_RP, true), substr($auth, 0, 32))) return false;
        $flags = ord($auth[32]);
        // Presence + verification; no backup eligibility/state or attested data.
        if (($flags & 5) !== 5 || ($flags & 0x58) !== 0) return false;
        if (($flags & 0x80) === 0 && strlen($auth) !== 37) return false;
        $pem = "-----BEGIN PUBLIC KEY-----\n" . chunk_split(base64_encode(adminUnb64($spki)), 64, "\n") . "-----END PUBLIC KEY-----\n";
        return openssl_verify($auth . hash('sha256', $clientBytes, true), adminUnb64($input['signature'] ?? null), $pem, OPENSSL_ALGO_SHA256) === 1;
    } catch (Throwable $e) { return false; }
}

function adminDeviceApi(string $path): void {
    if (!str_starts_with($path, '/api/admin-device/')) return;
    if (!adminSameOrigin($_SERVER)) adminJson(403, ['ok'=>false, 'error'=>'Origen no autorizado']);
    $allowed = adminIpAllowed(adminClientIp($_SERVER));
    if ($path === '/api/admin-device/status' && ($_SERVER['REQUEST_METHOD'] ?? '') === 'GET') {
        adminJson(200, ['ok'=>true, 'ipAllowed'=>$allowed, 'detectedIp'=>adminClientIp($_SERVER), 'authenticated'=>$allowed && adminAuthorized()]);
    }
    if (!$allowed) adminJson(403, ['ok'=>false, 'error'=>'Estas herramientas requieren la red ' . ADMIN_DEVICE_NETWORK . ' y Windows Hello de la laptop registrada.']);
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') adminJson(405, ['ok'=>false, 'error'=>'Método no permitido']);
    adminSession();
    if ($path === '/api/admin-device/challenge') {
        if (($_SESSION['last_challenge'] ?? 0) > time() - 2) adminJson(429, ['ok'=>false, 'error'=>'Espera un momento antes de reintentar.']);
        $_SESSION['last_challenge'] = time();
        $_SESSION['admin_challenge'] = adminB64(random_bytes(32));
        $_SESSION['challenge_until'] = time() + 120;
        adminJson(200, ['ok'=>true, 'challenge'=>$_SESSION['admin_challenge'], 'rpId'=>ADMIN_DEVICE_RP, 'credentialId'=>ADMIN_DEVICE_ID]);
    }
    if ($path === '/api/admin-device/verify') {
        $challenge = $_SESSION['admin_challenge'] ?? '';
        $expires = $_SESSION['challenge_until'] ?? 0;
        unset($_SESSION['admin_challenge'], $_SESSION['challenge_until'], $_SESSION['admin_until']);
        $raw = file_get_contents('php://input', false, null, 0, 32769);
        $input = strlen($raw) <= 32768 ? json_decode($raw, true) : null;
        if ($challenge === '' || $expires <= time() || !is_array($input) || !adminVerifyAssertion($input, $challenge)) {
            adminJson(403, ['ok'=>false, 'error'=>'No se pudo verificar la laptop. Vuelve a confirmar con Windows Hello.']);
        }
        session_regenerate_id(true);
        $_SESSION['admin_until'] = time() + 600;
        $_SESSION['admin_network'] = ADMIN_DEVICE_NETWORK;
        $_SESSION['admin_credential'] = hash('sha256', ADMIN_DEVICE_ID . ADMIN_DEVICE_SPKI);
        adminJson(200, ['ok'=>true, 'authenticated'=>true, 'expiresIn'=>600]);
    }
    if ($path === '/api/admin-device/authorize') { adminRequire(); adminJson(200, ['ok'=>true]); }
    if ($path === '/api/admin-device/logout') { $_SESSION = []; session_destroy(); adminJson(200, ['ok'=>true]); }
    adminJson(404, ['ok'=>false, 'error'=>'Ruta no encontrada']);
}
