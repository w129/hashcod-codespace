<?php
declare(strict_types=1);

require_once __DIR__ . '/desktop-runtime.php';
if (!function_exists('secretGet')) {
    require_once __DIR__ . '/secrets.php';
}

const ADMIN_DEVICE_RP = 'hashcod-codespace-1.onrender.com';
const ADMIN_DEVICE_ORIGIN = 'https://' . ADMIN_DEVICE_RP;
const ADMIN_DEVICE_NETWORK = '38.196.115.0/24';
const ADMIN_CODEKEY_FORMAT = 'HASHCOD-CODEKEY-IPYNB-1';
const ADMIN_CODEKEY_SCHEME = 'HASHCOD-DUAL-FINGERPRINT-1';

function adminCodeKeySecret(string $name): string {
    $value = function_exists('secretGet') ? secretGet($name, '') : (string)(getenv($name) ?: '');
    return trim((string)$value);
}

function adminCodeKeyConfig(): ?array {
    $filename = adminCodeKeySecret('HASHCOD_ADMIN_CODEKEY_FILENAME');
    $codekey1 = adminCodeKeySecret('HASHCOD_ADMIN_CODEKEY_CODEKEY1');
    $jupyter1 = adminCodeKeySecret('HASHCOD_ADMIN_CODEKEY_JUPYTER1');
    $hashcod1 = adminCodeKeySecret('HASHCOD_ADMIN_CODEKEY_HASHCOD1');
    if ($filename === '' || strlen($filename) > 180 || !str_ends_with(strtolower($filename), '.ipynb')) return null;
    if (!preg_match('/^CODEKEY1:[a-f0-9]{64}$/D', $codekey1)) return null;
    if (!preg_match('/^JUPYTER1:[a-f0-9]{64}$/D', $jupyter1)) return null;
    if (!preg_match('/^HASHCOD1:[a-f0-9]{64}$/D', $hashcod1)) return null;
    return compact('filename', 'codekey1', 'jupyter1', 'hashcod1');
}

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

function adminCredentialFingerprint(): string {
    $config = adminCodeKeyConfig();
    return $config ? hash('sha256', $config['hashcod1']) : '';
}

function adminAuthorized(): bool {
    if (!adminIpAllowed(adminClientIp($_SERVER)) || !adminSameOrigin($_SERVER)) return false;
    $credential = adminCredentialFingerprint();
    if ($credential === '') return false;
    adminSession();
    return ($_SESSION['admin_until'] ?? 0) > time()
        && ($_SESSION['admin_network'] ?? '') === ADMIN_DEVICE_NETWORK
        && hash_equals($credential, (string)($_SESSION['admin_credential'] ?? ''));
}

function adminRequire(): void {
    if (!adminAuthorized()) {
        adminJson(403, ['ok'=>false, 'error'=>'Acceso administrativo restringido: carga la CodeKey Jupyter autorizada desde la red permitida.']);
    }
}

function adminProtectedPath(string $path): bool {
    return str_starts_with($path, '/api/admin/') || in_array($path, [
        '/api/auth/dilithium-active-key', '/api/auth/list-accounts',
        '/api/auth/suspend-account', '/api/auth/reactivate-account', '/api/auth/delete-account', '/api/auth/delete'
    ], true);
}

function adminArrayIsList(array $value): bool {
    if ($value === []) return true;
    return array_keys($value) === range(0, count($value) - 1);
}

function adminCanonicalSort($value) {
    if (!is_array($value)) return $value;
    if (adminArrayIsList($value)) return array_map('adminCanonicalSort', $value);
    ksort($value, SORT_STRING);
    foreach ($value as $key => $item) $value[$key] = adminCanonicalSort($item);
    return $value;
}

function adminCanonicalJson($value): string {
    return json_encode(
        adminCanonicalSort($value),
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR
    );
}

function adminNormalizeCode(string $code): string {
    return trim(str_replace(["\r\n", "\r"], "\n", $code));
}

function adminNotebookFingerprints(array $notebook): array {
    if (($notebook['nbformat'] ?? null) !== 4 || ($notebook['nbformat_minor'] ?? null) !== 5) {
        throw new RuntimeException('Formato Jupyter no autorizado');
    }

    $metadata = $notebook['metadata']['hashcod'] ?? null;
    if (!is_array($metadata)
        || ($metadata['format'] ?? '') !== ADMIN_CODEKEY_FORMAT
        || ($metadata['fingerprint_scheme'] ?? '') !== ADMIN_CODEKEY_SCHEME
        || ($metadata['access'] ?? '') !== 'ADMIN'
        || ($metadata['scope'] ?? '') !== 'PRIVATE'
        || (string)($metadata['version'] ?? '') !== '1') {
        throw new RuntimeException('Metadata CodeKey no autorizada');
    }

    $cells = $notebook['cells'] ?? null;
    if (!is_array($cells)) throw new RuntimeException('Notebook sin celdas');

    $code = null;
    $markedCells = 0;
    foreach ($cells as $cell) {
        if (!is_array($cell) || ($cell['cell_type'] ?? '') !== 'code') continue;
        $cellMetadata = $cell['metadata'] ?? [];
        if (!is_array($cellMetadata) || ($cellMetadata['hashcod_codekey'] ?? false) !== true) continue;
        $markedCells++;
        $source = $cell['source'] ?? '';
        if (is_array($source)) {
            foreach ($source as $line) if (!is_string($line)) throw new RuntimeException('Source inválido');
            $source = implode('', $source);
        }
        if (!is_string($source)) throw new RuntimeException('Source inválido');
        $code = adminNormalizeCode($source);
    }

    if ($markedCells !== 1 || $code === null || $code === '') {
        throw new RuntimeException('CodeKey ausente o ambigua');
    }

    $codekey1 = 'CODEKEY1:' . hash('sha256', $code);
    $sourceLines = array_map(static fn(string $line): string => $line . "\n", explode("\n", $code));
    $canonicalJupyter = [
        'nbformat'=>4,
        'nbformat_minor'=>5,
        'cells'=>[[
            'cell_type'=>'code',
            'metadata'=>['hashcod_codekey'=>true],
            'source'=>$sourceLines
        ]]
    ];
    $jupyter1 = 'JUPYTER1:' . hash('sha256', adminCanonicalJson($canonicalJupyter));
    $hashcod1 = 'HASHCOD1:' . hash('sha256', ADMIN_CODEKEY_SCHEME . '|' . $codekey1 . '|' . $jupyter1);

    return [
        'codekey1'=>$codekey1,
        'jupyter1'=>$jupyter1,
        'hashcod1'=>$hashcod1,
        'metadata'=>$metadata
    ];
}

function adminVerifyCodeKeyNotebook(string $filename, array $notebook): bool {
    $config = adminCodeKeyConfig();
    if (!$config || !hash_equals($config['filename'], $filename)) return false;
    try {
        $fp = adminNotebookFingerprints($notebook);
        $metadata = $fp['metadata'];
        return hash_equals($config['codekey1'], $fp['codekey1'])
            && hash_equals($config['jupyter1'], $fp['jupyter1'])
            && hash_equals($config['hashcod1'], $fp['hashcod1'])
            && hash_equals($config['codekey1'], (string)($metadata['codekey_fingerprint'] ?? ''))
            && hash_equals($config['jupyter1'], (string)($metadata['jupyter_fingerprint'] ?? ''))
            && hash_equals($config['hashcod1'], (string)($metadata['combined_fingerprint'] ?? ''));
    } catch (Throwable $e) {
        return false;
    }
}

function adminDeviceApi(string $path): void {
    if (!str_starts_with($path, '/api/admin-device/')) return;
    if (!adminSameOrigin($_SERVER)) adminJson(403, ['ok'=>false, 'error'=>'Origen no autorizado']);

    $desktop = hashcodDesktopBridgeValid();
    $allowed = adminIpAllowed(adminClientIp($_SERVER));
    $configured = adminCodeKeyConfig() !== null;

    if ($path === '/api/admin-device/status' && ($_SERVER['REQUEST_METHOD'] ?? '') === 'GET') {
        adminJson(200, [
            'ok'=>true,
            'ipAllowed'=>$allowed,
            'detectedIp'=>adminClientIp($_SERVER),
            'authenticated'=>$configured && $allowed && adminAuthorized(),
            'configured'=>$configured,
            'desktop'=>$desktop,
            'authMode'=>'codekey-ipynb'
        ]);
    }

    if (!$configured) adminJson(503, ['ok'=>false, 'error'=>'La CodeKey administrativa no está configurada en el servidor.']);
    if (!$allowed) {
        adminJson(403, ['ok'=>false, 'error'=>'Estas herramientas requieren la red ' . ADMIN_DEVICE_NETWORK . ' y la CodeKey Jupyter autorizada.']);
    }
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') adminJson(405, ['ok'=>false, 'error'=>'Método no permitido']);

    adminSession();

    if ($path === '/api/admin-device/verify') {
        unset($_SESSION['admin_until'], $_SESSION['admin_credential']);
        $raw = file_get_contents('php://input', false, null, 0, 262145);
        if (!is_string($raw) || strlen($raw) > 262144) {
            adminJson(413, ['ok'=>false, 'error'=>'El archivo CodeKey supera el tamaño permitido.']);
        }
        try {
            $input = json_decode($raw, true, 64, JSON_THROW_ON_ERROR);
        } catch (Throwable $e) {
            $input = null;
        }
        $filename = is_array($input) ? (string)($input['filename'] ?? '') : '';
        $notebook = is_array($input) ? ($input['notebook'] ?? null) : null;
        if ($filename === '' || strlen($filename) > 180 || !is_array($notebook) || !adminVerifyCodeKeyNotebook($filename, $notebook)) {
            adminJson(403, ['ok'=>false, 'error'=>'CodeKey Jupyter no autorizada.']);
        }

        session_regenerate_id(true);
        $_SESSION['admin_until'] = time() + 600;
        $_SESSION['admin_network'] = ADMIN_DEVICE_NETWORK;
        $_SESSION['admin_credential'] = adminCredentialFingerprint();
        adminJson(200, ['ok'=>true, 'authenticated'=>true, 'expiresIn'=>600, 'authMode'=>'codekey-ipynb']);
    }

    if ($path === '/api/admin-device/challenge') {
        adminJson(410, ['ok'=>false, 'error'=>'Windows Hello fue reemplazado por la CodeKey Jupyter.']);
    }
    if ($path === '/api/admin-device/authorize') { adminRequire(); adminJson(200, ['ok'=>true]); }
    if ($path === '/api/admin-device/logout') { $_SESSION = []; session_destroy(); adminJson(200, ['ok'=>true]); }
    adminJson(404, ['ok'=>false, 'error'=>'Ruta no encontrada']);
}
