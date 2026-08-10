<?php
/**
 * Cupo mensual de tokens l8 codespace.
 *
 * - Allowance: 200_000 tokens / mes (periodo YYYY-MM)
 * - Comando: -5
 * - Ventana externa: -25
 */

require_once __DIR__ . '/supabase.php';
if (!function_exists('authValidateSession')) {
    @require_once __DIR__ . '/auth.php';
}

function tokensMonthlyAllowance() {
    return 200000;
}

function tokensCostCommand() {
    return 5;
}

function tokensCostExternal() {
    return 25;
}

function tokensStorageDir() {
    $dir = __DIR__ . '/data_storage/tokens';
    if (!is_dir($dir)) {
        @mkdir($dir, 0777, true);
    }
    return $dir;
}

function tokensStorePath() {
    return tokensStorageDir() . '/usage.json';
}

function tokensCurrentPeriod() {
    return date('Y-m');
}

function tokensEmptyStore() {
    return ['accounts' => [], 'updated_at' => date('c')];
}

function tokensLoadStore() {
    $path = tokensStorePath();
    $store = tokensEmptyStore();

    if (is_readable($path)) {
        $raw = @file_get_contents($path);
        $data = json_decode($raw ?: '{}', true);
        if (is_array($data) && isset($data['accounts']) && is_array($data['accounts'])) {
            $store = $data;
        }
    }

    // Hidrata desde Supabase Storage si el local está vacío
    if (empty($store['accounts']) && function_exists('supabaseConfig') && function_exists('supabaseStorageDownload')) {
        $cfg = supabaseConfig();
        if (!empty($cfg['configured'])) {
            $remote = @supabaseStorageDownload('meta/tokens_usage.json');
            if (!empty($remote['ok']) && is_string($remote['data'])) {
                $parsed = json_decode($remote['data'], true);
                if (is_array($parsed) && isset($parsed['accounts']) && is_array($parsed['accounts'])) {
                    $store = $parsed;
                    @file_put_contents($path, json_encode($store, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
                }
            }
        }
    }

    return $store;
}

function tokensSaveStore(array $store) {
    $store['updated_at'] = date('c');
    $path = tokensStorePath();
    @file_put_contents($path, json_encode($store, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

    if (function_exists('supabaseConfig') && function_exists('supabaseStorageUpload')) {
        $cfg = supabaseConfig();
        if (!empty($cfg['configured'])) {
            @supabaseStorageUpload(
                'meta/tokens_usage.json',
                json_encode($store, JSON_UNESCAPED_UNICODE),
                'application/json',
                true
            );
        }
    }
    return true;
}

function tokensGuestCookieName() {
    return 'l8_tokens_guest';
}

function tokensEnsureGuestId() {
    $name = tokensGuestCookieName();
    $existing = isset($_COOKIE[$name]) ? preg_replace('/[^a-zA-Z0-9_-]/', '', (string)$_COOKIE[$name]) : '';
    if ($existing !== '' && strlen($existing) >= 8) {
        return $existing;
    }
    $id = 'guest_' . bin2hex(random_bytes(8));
    @setcookie($name, $id, [
        'expires' => time() + 86400 * 400,
        'path' => '/',
        'secure' => (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off'),
        'httponly' => true,
        'samesite' => 'Lax'
    ]);
    $_COOKIE[$name] = $id;
    return $id;
}

function tokensResolveAccountKey() {
    $token = '';
    if (function_exists('authBearerTokenFromRequest')) {
        $token = (string)authBearerTokenFromRequest();
    }
    if ($token === '' && !empty($_SERVER['HTTP_AUTHORIZATION']) && preg_match('/Bearer\s+(\S+)/i', $_SERVER['HTTP_AUTHORIZATION'], $m)) {
        $token = $m[1];
    }
    if ($token !== '' && function_exists('authValidateSession')) {
        $sess = authValidateSession($token);
        if (!empty($sess['ok']) && !empty($sess['account_id'])) {
            return 'acct_' . preg_replace('/[^a-zA-Z0-9_-]/', '', (string)$sess['account_id']);
        }
        if (!empty($sess['ok']) && !empty($sess['user_id'])) {
            return 'acct_' . preg_replace('/[^a-zA-Z0-9_-]/', '', (string)$sess['user_id']);
        }
    }
    return tokensEnsureGuestId();
}

function tokensNormalizeBucket(array $bucket = null) {
    $period = tokensCurrentPeriod();
    $allowance = tokensMonthlyAllowance();
    if (!is_array($bucket) || ($bucket['period'] ?? '') !== $period) {
        return [
            'period' => $period,
            'allowance' => $allowance,
            'used' => 0,
            'commands' => 0,
            'externals' => 0,
            'updated_at' => date('c')
        ];
    }
    $bucket['allowance'] = $allowance;
    $bucket['used'] = max(0, (int)($bucket['used'] ?? 0));
    $bucket['commands'] = max(0, (int)($bucket['commands'] ?? 0));
    $bucket['externals'] = max(0, (int)($bucket['externals'] ?? 0));
    return $bucket;
}

function tokensStatusForKey($accountKey) {
    $store = tokensLoadStore();
    $bucket = tokensNormalizeBucket($store['accounts'][$accountKey] ?? null);
    // Persist reset if period rolled
    if (!isset($store['accounts'][$accountKey]) || ($store['accounts'][$accountKey]['period'] ?? '') !== $bucket['period']) {
        $store['accounts'][$accountKey] = $bucket;
        tokensSaveStore($store);
    }
    $used = (int)$bucket['used'];
    $allowance = (int)$bucket['allowance'];
    $remaining = max(0, $allowance - $used);
    $pctUsed = $allowance > 0 ? min(100, round(($used / $allowance) * 100, 2)) : 0;
    return [
        'ok' => true,
        'account_key' => $accountKey,
        'period' => $bucket['period'],
        'allowance' => $allowance,
        'used' => $used,
        'remaining' => $remaining,
        'percent_used' => $pctUsed,
        'commands' => (int)$bucket['commands'],
        'externals' => (int)$bucket['externals'],
        'costs' => [
            'command' => tokensCostCommand(),
            'external' => tokensCostExternal()
        ],
        'exhausted' => $remaining <= 0,
        'updated_at' => $bucket['updated_at'] ?? date('c')
    ];
}

function tokensStatus() {
    return tokensStatusForKey(tokensResolveAccountKey());
}

function tokensConsume($kind) {
    $kind = strtolower(trim((string)$kind));
    if ($kind === 'cmd' || $kind === 'command' || $kind === 'commands') {
        $kind = 'command';
        $cost = tokensCostCommand();
    } else if ($kind === 'external' || $kind === 'externals' || $kind === 'window' || $kind === 'platform') {
        $kind = 'external';
        $cost = tokensCostExternal();
    } else {
        return ['ok' => false, 'error' => 'Unknown token kind. Use command|external', 'code' => 'bad_kind'];
    }

    $accountKey = tokensResolveAccountKey();
    $store = tokensLoadStore();
    $bucket = tokensNormalizeBucket($store['accounts'][$accountKey] ?? null);
    $remaining = max(0, (int)$bucket['allowance'] - (int)$bucket['used']);

    if ($remaining < $cost) {
        return [
            'ok' => false,
            'error' => 'Tokens insuficientes para este mes. Cupo: ' . number_format((int)$bucket['allowance']) . ' · Restantes: ' . number_format($remaining) . ' · Necesarios: ' . $cost,
            'code' => 'insufficient_tokens',
            'needed' => $cost,
            'status' => tokensStatusForKey($accountKey)
        ];
    }

    $bucket['used'] = (int)$bucket['used'] + $cost;
    if ($kind === 'command') {
        $bucket['commands'] = (int)$bucket['commands'] + 1;
    } else {
        $bucket['externals'] = (int)$bucket['externals'] + 1;
    }
    $bucket['updated_at'] = date('c');
    $store['accounts'][$accountKey] = $bucket;
    tokensSaveStore($store);

    $status = tokensStatusForKey($accountKey);
    return [
        'ok' => true,
        'charged' => $cost,
        'kind' => $kind,
        'status' => $status
    ];
}

/**
 * Maneja /api/tokens/* — retorna true si respondió.
 */
function tokensHandleApi($uri) {
    if (strpos($uri, '/api/tokens') !== 0) {
        return false;
    }

    header('Content-Type: application/json; charset=utf-8');
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

    if (($uri === '/api/tokens' || $uri === '/api/tokens/status') && $method === 'GET') {
        echo json_encode(tokensStatus(), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        return true;
    }

    if (($uri === '/api/tokens/consume' || $uri === '/api/tokens/charge') && $method === 'POST') {
        $raw = file_get_contents('php://input');
        $input = json_decode($raw, true) ?? [];
        $kind = $input['kind'] ?? $input['type'] ?? '';
        $result = tokensConsume($kind);
        if (empty($result['ok'])) {
            http_response_code(402);
        }
        echo json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        return true;
    }

    http_response_code(404);
    echo json_encode(['ok' => false, 'error' => 'Unknown tokens endpoint'], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    return true;
}
