<?php
declare(strict_types=1);

require_once __DIR__ . '/desktop-runtime.php';
require_once __DIR__ . '/secrets.php';

const ADMIN_DEVICE_RP = 'hashcod-codespace-1.onrender.com';
const ADMIN_DEVICE_ORIGIN = 'https://' . ADMIN_DEVICE_RP;
const ADMIN_DEVICE_NETWORK = '38.196.115.0/24';

// Registered CodeKey notebook. The server never executes notebook code: it parses
// the JSON, canonicalizes the marked CodeKey cell and compares the three fingerprints.
const ADMIN_CODEKEY_FILENAME = 'OnIPFeJKssih4mbNLCYXnct6a1L_q84po-KVfKPZInHYbhNJ8OR2n3M2zFJ2zZeK9bqkcmilS1li-3DrTsaUIg.ipynb';
const ADMIN_CODEKEY_FORMAT = 'HASHCOD-CODEKEY-IPYNB-1';
const ADMIN_CODEKEY_SCHEME = 'HASHCOD-DUAL-FINGERPRINT-1';
const ADMIN_CODEKEY_FINGERPRINT = 'CODEKEY1:8ccbe307c4199695282e0de07a7a474537d99edf915e71bba5f4f88c6ecff94d';
const ADMIN_JUPYTER_FINGERPRINT = 'JUPYTER1:d185f92f42837d6a3dbea6dc3bf2a26a348e2df7aa8cdadeb9acf3b2a88c9c56';
const ADMIN_COMBINED_FINGERPRINT = 'HASHCOD1:d02c7f85eccb0e8eb63f26bda3bc82fb86a6f6e80b98c2b35ff982e07c215b5b';

function adminClientIp(array $server): string {
    if (hashcodDesktopBridgeValid()) return '127.0.0.1';
    if (getenv('RENDER') !== 'true' || ($server['REMOTE_ADDR'] ?? '') !== '127.0.0.1') return '';
    $ip = trim((string)($server['HTTP_X_L8_RENDER_CF_IP'] ?? ''));
    return filter_var($ip, FILTER_VALIDATE_IP) ? $ip : '';
}

function adminIpAllowed(string $ip): bool {
    if (hashcodDesktopBridgeValid()) return true;
    if (!filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) return false;
    return substr(inet_pton($ip), 0, 3) === substr(inet_pton(explode('/', ADMIN_DEVICE_NETWORK)[0]), 0, 3);
}

function adminSameOrigin(array $server): bool {
    if (hashcodDesktopBridgeValid()) return true;
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
    if (!is_dir($dir) && !mkdir($dir, 0700, true) && !is_dir($dir)) {
        adminJson(503, ['ok'=>false, 'error'=>'Almacenamiento administrativo no disponible']);
    }
    ini_set('session.use_strict_mode', '1');
    ini_set('session.use_only_cookies', '1');
    ini_set('session.gc_maxlifetime', '900');
    session_save_path($dir);

    $desktop = hashcodDesktopEnabled();
    session_name($desktop ? 'hashcod_desktop_admin' : '__Host-hashcod_admin');
    session_set_cookie_params([
        'lifetime'=>0,
        'path'=>'/',
        'secure'=>!$desktop,
        'httponly'=>true,
        'samesite'=>'Strict'
    ]);
    if (!session_start()) adminJson(503, ['ok'=>false, 'error'=>'Sesión administrativa no disponible']);
}

function adminCredentialDigest(): string {
    return hash('sha256', ADMIN_COMBINED_FINGERPRINT);
}

function adminBase64UrlEncode(string $raw): string {
    return rtrim(strtr(base64_encode($raw), '+/', '-_'), '=');
}

function adminBase64UrlDecode(string $encoded): string {
    $encoded = strtr($encoded, '-_', '+/');
    $pad = strlen($encoded) % 4;
    if ($pad !== 0) $encoded .= str_repeat('=', 4 - $pad);
    $decoded = base64_decode($encoded, true);
    return is_string($decoded) ? $decoded : '';
}

function adminTicketSigningKey(): string {
    foreach (['L8_AUTH_PEPPER', 'L8_VAULT_MASTER_KEY', 'SUPABASE_SECRET_KEY'] as $name) {
        $raw = trim((string)secretGet($name, ''));
        if ($raw !== '') {
            return hash_hmac('sha256', 'hashcod|admin-codekey-ticket|v1', $raw, true);
        }
    }
    return '';
}

function adminIssueTicket(string $ip, int $ttl = 600): string {
    $key = adminTicketSigningKey();
    if ($key === '' || $ip === '') return '';

    $payload = [
        'v'=>1,
        'ip'=>$ip,
        'net'=>ADMIN_DEVICE_NETWORK,
        'cred'=>adminCredentialDigest(),
        'exp'=>time() + max(60, min(900, $ttl)),
        'nonce'=>bin2hex(random_bytes(12)),
    ];
    $json = json_encode($payload, JSON_UNESCAPED_SLASHES);
    if (!is_string($json) || $json === '') return '';

    $encoded = adminBase64UrlEncode($json);
    $sig = hash_hmac('sha256', $encoded, $key);
    return $encoded . '.' . $sig;
}

function adminTicketValid(string $ticket, string $ip): bool {
    if ($ticket === '' || $ip === '' || strpos($ticket, '.') === false) return false;
    $key = adminTicketSigningKey();
    if ($key === '') return false;

    [$encoded, $sig] = explode('.', $ticket, 2);
    if ($encoded === '' || !preg_match('/^[a-f0-9]{64}$/', $sig)) return false;
    $expected = hash_hmac('sha256', $encoded, $key);
    if (!hash_equals($expected, $sig)) return false;

    $json = adminBase64UrlDecode($encoded);
    if ($json === '') return false;
    $payload = json_decode($json, true);
    if (!is_array($payload)) return false;

    return (int)($payload['v'] ?? 0) === 1
        && (int)($payload['exp'] ?? 0) > time()
        && hash_equals($ip, (string)($payload['ip'] ?? ''))
        && hash_equals(ADMIN_DEVICE_NETWORK, (string)($payload['net'] ?? ''))
        && hash_equals(adminCredentialDigest(), (string)($payload['cred'] ?? ''));
}

function adminSetTicketCookie(string $ticket, int $ttl = 600): void {
    if (headers_sent()) return;
    $name = hashcodDesktopEnabled() ? 'hashcod_desktop_admin_ticket' : '__Host-hashcod_admin_ticket';
    if ($ticket === '') {
        setcookie($name, '', [
            'expires'=>time() - 3600,
            'path'=>'/',
            'secure'=>!hashcodDesktopEnabled(),
            'httponly'=>true,
            'samesite'=>'Strict',
        ]);
        return;
    }
    setcookie($name, $ticket, [
        'expires'=>time() + max(60, min(900, $ttl)),
        'path'=>'/',
        'secure'=>!hashcodDesktopEnabled(),
        'httponly'=>true,
        'samesite'=>'Strict',
    ]);
}

function adminTicketFromRequest(): string {
    $name = hashcodDesktopEnabled() ? 'hashcod_desktop_admin_ticket' : '__Host-hashcod_admin_ticket';
    return trim((string)($_COOKIE[$name] ?? ''));
}

function adminAuthorized(): bool {
    if (hashcodDesktopBridgeValid()) return true;
    $ip = adminClientIp($_SERVER);
    if (!adminIpAllowed($ip) || !adminSameOrigin($_SERVER)) return false;

    $ticket = adminTicketFromRequest();
    if ($ticket !== '' && adminTicketValid($ticket, $ip)) return true;

    adminSession();
    return ($_SESSION['admin_until'] ?? 0) > time()
        && ($_SESSION['admin_network'] ?? '') === ADMIN_DEVICE_NETWORK
        && hash_equals(adminCredentialDigest(), (string)($_SESSION['admin_credential'] ?? ''));
}

function adminRequire(): void {
    if (!adminAuthorized()) {
        adminJson(403, ['ok'=>false, 'error'=>'Acceso administrativo restringido: usa la IP autorizada y la CodeKey Jupyter registrada.']);
    }
}

function adminProtectedPath(string $path): bool {
    return str_starts_with($path, '/api/admin/') || in_array($path, [
        '/api/auth/dilithium-active-key', '/api/auth/list-accounts',
        '/api/auth/suspend-account', '/api/auth/reactivate-account', '/api/auth/delete-account', '/api/auth/delete'
    ], true);
}

function adminNormalizeCode(string $code): string {
    return trim(str_replace(["\r\n", "\r"], "\n", $code));
}

function adminSortJson($value) {
    if (!is_array($value)) return $value;
    if (array_is_list($value)) {
        return array_map('adminSortJson', $value);
    }
    ksort($value, SORT_STRING);
    foreach ($value as $key => $item) $value[$key] = adminSortJson($item);
    return $value;
}

function adminCanonicalJson(array $value): string {
    $json = json_encode(adminSortJson($value), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if (!is_string($json)) throw new RuntimeException('No se pudo canonicalizar el notebook');
    return $json;
}

function adminCodeKeyFilenameAllowed(string $filename): bool {
    if (hash_equals(ADMIN_CODEKEY_FILENAME, $filename)) return true;
    $dot = strrpos(ADMIN_CODEKEY_FILENAME, '.ipynb');
    if ($dot === false) return false;
    $stem = substr(ADMIN_CODEKEY_FILENAME, 0, $dot);
    return preg_match('/^' . preg_quote($stem, '/') . '\\s*\\(\\d+\\)\\.ipynb$/', $filename) === 1;
}

function adminVerifyCodeKeyNotebook(string $filename, string $rawNotebook): bool {
    if (!adminCodeKeyFilenameAllowed($filename)) return false;
    if ($rawNotebook === '' || strlen($rawNotebook) > 131072) return false;

    try {
        $notebook = json_decode($rawNotebook, true, 64, JSON_THROW_ON_ERROR);
    } catch (Throwable $e) {
        return false;
    }
    if (!is_array($notebook) || ($notebook['nbformat'] ?? null) !== 4 || ($notebook['nbformat_minor'] ?? null) !== 5) return false;

    $meta = $notebook['metadata']['hashcod'] ?? null;
    if (!is_array($meta)
        || ($meta['format'] ?? '') !== ADMIN_CODEKEY_FORMAT
        || ($meta['fingerprint_scheme'] ?? '') !== ADMIN_CODEKEY_SCHEME
        || ($meta['access'] ?? '') !== 'ADMIN'
        || ($meta['scope'] ?? '') !== 'PRIVATE'
        || (string)($meta['version'] ?? '') !== '1'
        || !hash_equals(ADMIN_CODEKEY_FINGERPRINT, (string)($meta['codekey_fingerprint'] ?? ''))
        || !hash_equals(ADMIN_JUPYTER_FINGERPRINT, (string)($meta['jupyter_fingerprint'] ?? ''))
        || !hash_equals(ADMIN_COMBINED_FINGERPRINT, (string)($meta['combined_fingerprint'] ?? ''))) {
        return false;
    }

    $keyCells = [];
    foreach (($notebook['cells'] ?? []) as $cell) {
        if (!is_array($cell)) continue;
        if (($cell['cell_type'] ?? '') === 'code' && (($cell['metadata']['hashcod_codekey'] ?? false) === true)) {
            $keyCells[] = $cell;
        }
    }
    if (count($keyCells) !== 1) return false;

    $source = $keyCells[0]['source'] ?? null;
    if (!is_array($source) || count($source) === 0) return false;
    foreach ($source as $line) if (!is_string($line)) return false;

    $normalized = adminNormalizeCode(implode('', $source));
    $codekey = 'CODEKEY1:' . hash('sha256', $normalized);
    if (!hash_equals(ADMIN_CODEKEY_FINGERPRINT, $codekey)) return false;

    $canonicalSource = array_map(static fn(string $line): string => $line . "\n", explode("\n", $normalized));
    $canonical = [
        'nbformat'=>4,
        'nbformat_minor'=>5,
        'cells'=>[[
            'cell_type'=>'code',
            'metadata'=>['hashcod_codekey'=>true],
            'source'=>$canonicalSource
        ]]
    ];
    $jupyter = 'JUPYTER1:' . hash('sha256', adminCanonicalJson($canonical));
    if (!hash_equals(ADMIN_JUPYTER_FINGERPRINT, $jupyter)) return false;

    $combinedMaterial = ADMIN_CODEKEY_SCHEME . '|' . $codekey . '|' . $jupyter;
    $combined = 'HASHCOD1:' . hash('sha256', $combinedMaterial);
    return hash_equals(ADMIN_COMBINED_FINGERPRINT, $combined);
}

function adminDeviceApi(string $path): void {
    if (!str_starts_with($path, '/api/admin-device/')) return;
    if (!adminSameOrigin($_SERVER)) adminJson(403, ['ok'=>false, 'error'=>'Origen no autorizado']);

    $desktop = hashcodDesktopBridgeValid();
    $allowed = adminIpAllowed(adminClientIp($_SERVER));

    if ($path === '/api/admin-device/status' && ($_SERVER['REQUEST_METHOD'] ?? '') === 'GET') {
        adminJson(200, [
            'ok'=>true,
            'ipAllowed'=>$allowed,
            'detectedIp'=>adminClientIp($_SERVER),
            'authenticated'=>$desktop || ($allowed && adminAuthorized()),
            'desktop'=>$desktop,
            'authMode'=>$desktop ? 'desktop-loopback-bridge' : 'codekey-jupyter'
        ]);
    }

    if (!$allowed) {
        adminJson(403, ['ok'=>false, 'error'=>'Estas herramientas requieren la red ' . ADMIN_DEVICE_NETWORK . ' y la CodeKey Jupyter registrada.']);
    }
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') adminJson(405, ['ok'=>false, 'error'=>'Método no permitido']);

    if ($desktop && in_array($path, ['/api/admin-device/verify', '/api/admin-device/authorize'], true)) {
        adminJson(200, ['ok'=>true, 'authenticated'=>true, 'desktop'=>true, 'expiresIn'=>0]);
    }
    if ($desktop && $path === '/api/admin-device/logout') {
        adminJson(200, ['ok'=>true, 'authenticated'=>true, 'desktop'=>true]);
    }

    adminSession();

    if ($path === '/api/admin-device/challenge') {
        adminJson(410, ['ok'=>false, 'error'=>'Windows Hello fue reemplazado por la CodeKey Jupyter.']);
    }

    if ($path === '/api/admin-device/verify') {
        if (($_SESSION['last_codekey_verify'] ?? 0) > time() - 2) {
            adminJson(429, ['ok'=>false, 'error'=>'Espera un momento antes de reintentar.']);
        }
        $_SESSION['last_codekey_verify'] = time();
        unset($_SESSION['admin_until'], $_SESSION['admin_credential']);

        $raw = file_get_contents('php://input', false, null, 0, 196609);
        $input = is_string($raw) && strlen($raw) <= 196608 ? json_decode($raw, true) : null;
        $filename = is_array($input) ? (string)($input['filename'] ?? '') : '';
        $notebook = is_array($input) ? (string)($input['notebook'] ?? '') : '';

        if (!adminVerifyCodeKeyNotebook($filename, $notebook)) {
            adminJson(403, ['ok'=>false, 'error'=>'CodeKey rechazada: CODEKEY1, JUPYTER1 o HASHCOD1 no coincide con el archivo registrado.']);
        }

        session_regenerate_id(true);
        $_SESSION['admin_until'] = time() + 600;
        $_SESSION['admin_network'] = ADMIN_DEVICE_NETWORK;
        $_SESSION['admin_credential'] = adminCredentialDigest();

        // Also issue a signed HttpOnly authorization ticket. This is deliberately
        // stateless so CodeKey authorization survives Render worker/process
        // changes between /verify, /status and the protected table request.
        $ticket = adminIssueTicket(adminClientIp($_SERVER), 600);
        if ($ticket !== '') adminSetTicketCookie($ticket, 600);

        // Flush the filesystem session before the browser immediately performs
        // the status/table follow-up request.
        if (session_status() === PHP_SESSION_ACTIVE) session_write_close();

        adminJson(200, [
            'ok'=>true,
            'authenticated'=>true,
            'expiresIn'=>600,
            'authMode'=>$ticket !== '' ? 'codekey-jupyter-ticket' : 'codekey-jupyter-session'
        ]);
    }

    if ($path === '/api/admin-device/authorize') { adminRequire(); adminJson(200, ['ok'=>true]); }
    if ($path === '/api/admin-device/logout') {
        adminSetTicketCookie('', 0);
        $_SESSION = [];
        session_destroy();
        adminJson(200, ['ok'=>true]);
    }
    adminJson(404, ['ok'=>false, 'error'=>'Ruta no encontrada']);
}
