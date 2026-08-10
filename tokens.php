<?php
/**
 * Cupo mensual de tokens l8 codespace (persistente).
 *
 * - Allowance: 10_000 tokens / mes (periodo YYYY-MM)
 * - Comando: -5
 * - Ventana externa: -25
 * - Clone de repositorio GitHub: -625
 * - Bloc de notas: -1000
 *
 * Persistencia (sobrevive redeploy / updates):
 * 1) data_storage/tokens/usage.json (local)
 * 2) Supabase Storage meta/tokens_usage.json
 * 3) Postgres l8_token_accounts + l8_token_ledger
 *
 * Los gastos de periodos anteriores se archivan en periods{} y el ledger
 * conserva cada cobro individual.
 */

require_once __DIR__ . '/supabase.php';
if (!function_exists('authValidateSession')) {
    @require_once __DIR__ . '/auth.php';
}

function tokensMonthlyAllowance() {
    return 10000;
}

function tokensCostCommand() {
    return 5;
}

function tokensCostExternal() {
    return 25;
}

function tokensCostClone() {
    return 625;
}

function tokensCostNotepad() {
    return 1000;
}

function tokensLedgerMax() {
    return 500; // por cuenta, en el JSON local/remoto
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
    return [
        'version' => 2,
        'accounts' => [],
        'updated_at' => date('c')
    ];
}

function tokensEmptyPeriodBucket($period = null) {
    return [
        'period' => $period ?: tokensCurrentPeriod(),
        'allowance' => tokensMonthlyAllowance(),
        'used' => 0,
        'commands' => 0,
        'externals' => 0,
        'clones' => 0,
        'notepads' => 0,
        'updated_at' => date('c')
    ];
}

function tokensEmptyAccount($accountKey) {
    $period = tokensCurrentPeriod();
    return [
        'account_key' => $accountKey,
        'period' => $period,
        'allowance' => tokensMonthlyAllowance(),
        'used' => 0,
        'commands' => 0,
        'externals' => 0,
        'clones' => 0,
        'notepads' => 0,
        'periods' => [],
        'ledger' => [],
        'updated_at' => date('c')
    ];
}

function tokensNormalizePeriodBucket($bucket, $period = null) {
    $period = $period ?: tokensCurrentPeriod();
    if (!is_array($bucket)) {
        return tokensEmptyPeriodBucket($period);
    }
    return [
        'period' => (string)($bucket['period'] ?? $period),
        'allowance' => tokensMonthlyAllowance(),
        'used' => max(0, (int)($bucket['used'] ?? 0)),
        'commands' => max(0, (int)($bucket['commands'] ?? 0)),
        'externals' => max(0, (int)($bucket['externals'] ?? 0)),
        'clones' => max(0, (int)($bucket['clones'] ?? 0)),
        'notepads' => max(0, (int)($bucket['notepads'] ?? 0)),
        'updated_at' => (string)($bucket['updated_at'] ?? date('c'))
    ];
}

function tokensSnapshotCurrent(array $acct) {
    return [
        'period' => (string)($acct['period'] ?? tokensCurrentPeriod()),
        'allowance' => tokensMonthlyAllowance(),
        'used' => max(0, (int)($acct['used'] ?? 0)),
        'commands' => max(0, (int)($acct['commands'] ?? 0)),
        'externals' => max(0, (int)($acct['externals'] ?? 0)),
        'clones' => max(0, (int)($acct['clones'] ?? 0)),
        'notepads' => max(0, (int)($acct['notepads'] ?? 0)),
        'updated_at' => (string)($acct['updated_at'] ?? date('c'))
    ];
}

function tokensMergePeriodBuckets($a, $b) {
    $a = tokensNormalizePeriodBucket(is_array($a) ? $a : null, is_array($a) ? ($a['period'] ?? null) : null);
    $b = tokensNormalizePeriodBucket(is_array($b) ? $b : null, is_array($b) ? ($b['period'] ?? null) : null);
    $period = $a['period'] !== '' ? $a['period'] : $b['period'];
    return [
        'period' => $period,
        'allowance' => tokensMonthlyAllowance(),
        'used' => max($a['used'], $b['used']),
        'commands' => max($a['commands'], $b['commands']),
        'externals' => max($a['externals'], $b['externals']),
        'clones' => max($a['clones'], $b['clones']),
        'notepads' => max($a['notepads'], $b['notepads']),
        'updated_at' => strcmp((string)$a['updated_at'], (string)$b['updated_at']) >= 0 ? $a['updated_at'] : $b['updated_at']
    ];
}

function tokensMergeLedgers($a, $b) {
    $map = [];
    foreach ([is_array($a) ? $a : [], is_array($b) ? $b : []] as $list) {
        foreach ($list as $row) {
            if (!is_array($row) || empty($row['id'])) continue;
            $id = (string)$row['id'];
            if (!isset($map[$id])) {
                $map[$id] = [
                    'id' => $id,
                    'account_key' => (string)($row['account_key'] ?? ''),
                    'period' => (string)($row['period'] ?? ''),
                    'kind' => (string)($row['kind'] ?? ''),
                    'cost' => max(0, (int)($row['cost'] ?? 0)),
                    'detail' => substr((string)($row['detail'] ?? ''), 0, 240),
                    'created_at' => (string)($row['created_at'] ?? date('c'))
                ];
            }
        }
    }
    $out = array_values($map);
    usort($out, function ($x, $y) {
        return strcmp((string)$y['created_at'], (string)$x['created_at']);
    });
    if (count($out) > tokensLedgerMax()) {
        $out = array_slice($out, 0, tokensLedgerMax());
    }
    return $out;
}

function tokensNormalizeAccount($accountKey, $acct) {
    $accountKey = (string)$accountKey;
    $currentPeriod = tokensCurrentPeriod();
    if (!is_array($acct)) {
        return tokensEmptyAccount($accountKey);
    }

    $periods = [];
    if (isset($acct['periods']) && is_array($acct['periods'])) {
        foreach ($acct['periods'] as $p => $bucket) {
            $p = (string)$p;
            if ($p === '') continue;
            $periods[$p] = tokensNormalizePeriodBucket($bucket, $p);
        }
    }

    // Compat v1: bucket plano en la raíz → periodo actual o archivo histórico
    $flatPeriod = (string)($acct['period'] ?? '');
    if ($flatPeriod !== '' && $flatPeriod !== $currentPeriod) {
        $flat = tokensSnapshotCurrent($acct);
        $flat['period'] = $flatPeriod;
        $periods[$flatPeriod] = isset($periods[$flatPeriod])
            ? tokensMergePeriodBuckets($periods[$flatPeriod], $flat)
            : $flat;
    }

    if ($flatPeriod === $currentPeriod || $flatPeriod === '') {
        $current = tokensNormalizePeriodBucket([
            'period' => $currentPeriod,
            'used' => $acct['used'] ?? ($periods[$currentPeriod]['used'] ?? 0),
            'commands' => $acct['commands'] ?? ($periods[$currentPeriod]['commands'] ?? 0),
            'externals' => $acct['externals'] ?? ($periods[$currentPeriod]['externals'] ?? 0),
            'clones' => $acct['clones'] ?? ($periods[$currentPeriod]['clones'] ?? 0),
            'notepads' => $acct['notepads'] ?? ($periods[$currentPeriod]['notepads'] ?? 0),
            'updated_at' => $acct['updated_at'] ?? date('c')
        ], $currentPeriod);
    } else {
        // Mes viejo archivado: el cupo actual solo viene de periods[current] (si existía)
        $current = isset($periods[$currentPeriod])
            ? tokensNormalizePeriodBucket($periods[$currentPeriod], $currentPeriod)
            : tokensEmptyPeriodBucket($currentPeriod);
    }

    if (isset($periods[$currentPeriod])) {
        $current = tokensMergePeriodBuckets($current, $periods[$currentPeriod]);
        unset($periods[$currentPeriod]); // current vive en la raíz
    }

    $ledger = tokensMergeLedgers($acct['ledger'] ?? [], []);

    return [
        'account_key' => $accountKey,
        'period' => $currentPeriod,
        'allowance' => tokensMonthlyAllowance(),
        'used' => $current['used'],
        'commands' => $current['commands'],
        'externals' => $current['externals'],
        'clones' => $current['clones'],
        'notepads' => $current['notepads'],
        'periods' => $periods,
        'ledger' => $ledger,
        'updated_at' => $current['updated_at']
    ];
}

function tokensMergeAccounts($a, $b) {
    $key = (string)(($a['account_key'] ?? '') ?: ($b['account_key'] ?? ''));
    $a = tokensNormalizeAccount($key, is_array($a) ? $a : null);
    $b = tokensNormalizeAccount($key, is_array($b) ? $b : null);

    $periods = [];
    foreach (array_unique(array_merge(array_keys($a['periods']), array_keys($b['periods']))) as $p) {
        $periods[$p] = tokensMergePeriodBuckets($a['periods'][$p] ?? null, $b['periods'][$p] ?? null);
    }

    // Si uno de los lados tenía el current en otro periodo, ya está en periods.
    $current = tokensMergePeriodBuckets(
        tokensSnapshotCurrent($a),
        tokensSnapshotCurrent($b)
    );

    // Si periods contiene el current period (por merge raro), combinar y quitar
    if (isset($periods[$current['period']])) {
        $current = tokensMergePeriodBuckets($current, $periods[$current['period']]);
        unset($periods[$current['period']]);
    }

    return [
        'account_key' => $key,
        'period' => $current['period'],
        'allowance' => tokensMonthlyAllowance(),
        'used' => $current['used'],
        'commands' => $current['commands'],
        'externals' => $current['externals'],
        'clones' => $current['clones'],
        'notepads' => $current['notepads'],
        'periods' => $periods,
        'ledger' => tokensMergeLedgers($a['ledger'], $b['ledger']),
        'updated_at' => strcmp((string)$a['updated_at'], (string)$b['updated_at']) >= 0 ? $a['updated_at'] : $b['updated_at']
    ];
}

function tokensMergeStores($local, $remote) {
    $out = tokensEmptyStore();
    $local = is_array($local) ? $local : tokensEmptyStore();
    $remote = is_array($remote) ? $remote : tokensEmptyStore();
    $keys = array_unique(array_merge(
        array_keys(is_array($local['accounts'] ?? null) ? $local['accounts'] : []),
        array_keys(is_array($remote['accounts'] ?? null) ? $remote['accounts'] : [])
    ));
    foreach ($keys as $key) {
        $key = (string)$key;
        if ($key === '') continue;
        $out['accounts'][$key] = tokensMergeAccounts(
            $local['accounts'][$key] ?? null,
            $remote['accounts'][$key] ?? null
        );
    }
    $out['updated_at'] = date('c');
    $out['version'] = 2;
    return $out;
}

function tokensPullStoreFromStorage() {
    if (!function_exists('supabaseConfig') || !function_exists('supabaseStorageDownloadJson')) {
        return ['ok' => false, 'store' => null];
    }
    $cfg = supabaseConfig();
    if (empty($cfg['configured'])) {
        return ['ok' => false, 'store' => null];
    }
    $res = supabaseStorageDownloadJson('meta/tokens_usage.json');
    if (empty($res['ok']) || !is_array($res['data'] ?? null)) {
        return ['ok' => false, 'store' => null, 'error' => $res['error'] ?? 'storage miss'];
    }
    $data = $res['data'];
    if (!isset($data['accounts']) || !is_array($data['accounts'])) {
        return ['ok' => false, 'store' => null, 'error' => 'invalid remote store'];
    }
    return ['ok' => true, 'store' => $data];
}

function tokensPullStoreFromDb() {
    if (!function_exists('supabaseDbSelect') || !function_exists('supabaseConfig')) {
        return ['ok' => false, 'store' => null];
    }
    $cfg = supabaseConfig();
    if (empty($cfg['configured'])) {
        return ['ok' => false, 'store' => null];
    }
    $accRes = supabaseDbSelect('l8_token_accounts', 'select=*');
    if (empty($accRes['ok'])) {
        return ['ok' => false, 'store' => null, 'error' => $accRes['error'] ?? 'no l8_token_accounts'];
    }
    $ledRes = supabaseDbSelect('l8_token_ledger', 'select=*&order=created_at.desc&limit=5000');
    $accounts = is_array($accRes['body'] ?? null) ? $accRes['body'] : [];
    $ledgerRows = (!empty($ledRes['ok']) && is_array($ledRes['body'] ?? null)) ? $ledRes['body'] : [];

    $store = tokensEmptyStore();
    foreach ($accounts as $row) {
        if (!is_array($row) || empty($row['account_key'])) continue;
        $key = (string)$row['account_key'];
        $periods = $row['periods'] ?? [];
        if (is_string($periods)) {
            $decoded = json_decode($periods, true);
            $periods = is_array($decoded) ? $decoded : [];
        }
        $store['accounts'][$key] = tokensNormalizeAccount($key, [
            'account_key' => $key,
            'period' => $row['current_period'] ?? tokensCurrentPeriod(),
            'allowance' => $row['allowance'] ?? tokensMonthlyAllowance(),
            'used' => $row['used'] ?? 0,
            'commands' => $row['commands'] ?? 0,
            'externals' => $row['externals'] ?? 0,
            'clones' => $row['clones'] ?? 0,
            'notepads' => $row['notepads'] ?? 0,
            'periods' => is_array($periods) ? $periods : [],
            'ledger' => [],
            'updated_at' => $row['updated_at'] ?? date('c')
        ]);
    }

    foreach ($ledgerRows as $row) {
        if (!is_array($row) || empty($row['id']) || empty($row['account_key'])) continue;
        $key = (string)$row['account_key'];
        if (!isset($store['accounts'][$key])) {
            $store['accounts'][$key] = tokensEmptyAccount($key);
        }
        $store['accounts'][$key]['ledger'][] = [
            'id' => (string)$row['id'],
            'account_key' => $key,
            'period' => (string)($row['period'] ?? ''),
            'kind' => (string)($row['kind'] ?? ''),
            'cost' => (int)($row['cost'] ?? 0),
            'detail' => (string)($row['detail'] ?? ''),
            'created_at' => (string)($row['created_at'] ?? date('c'))
        ];
    }
    foreach ($store['accounts'] as $key => $acct) {
        $store['accounts'][$key]['ledger'] = tokensMergeLedgers($acct['ledger'] ?? [], []);
    }
    return ['ok' => true, 'store' => $store, 'accounts' => count($store['accounts']), 'ledger' => count($ledgerRows)];
}

function tokensPushStoreToDb(array $store) {
    if (!function_exists('supabaseDbUpsert') || !function_exists('supabaseConfig')) {
        return ['ok' => false, 'error' => 'DB helper ausente'];
    }
    $cfg = supabaseConfig();
    if (empty($cfg['configured'])) {
        return ['ok' => false, 'error' => 'Supabase no configurado'];
    }

    $accountRows = [];
    $ledgerRows = [];
    $now = date('c');
    foreach ($store['accounts'] as $key => $acct) {
        $acct = tokensNormalizeAccount($key, $acct);
        $accountRows[] = [
            'account_key' => $acct['account_key'],
            'current_period' => $acct['period'],
            'allowance' => $acct['allowance'],
            'used' => $acct['used'],
            'commands' => $acct['commands'],
            'externals' => $acct['externals'],
            'clones' => $acct['clones'],
            'notepads' => $acct['notepads'],
            'periods' => $acct['periods'],
            'updated_at' => $now
        ];
        foreach ($acct['ledger'] as $row) {
            if (!is_array($row) || empty($row['id'])) continue;
            $ledgerRows[] = [
                'id' => (string)$row['id'],
                'account_key' => $acct['account_key'],
                'period' => (string)($row['period'] ?? $acct['period']),
                'kind' => (string)($row['kind'] ?? ''),
                'cost' => (int)($row['cost'] ?? 0),
                'detail' => substr((string)($row['detail'] ?? ''), 0, 240),
                'created_at' => (string)($row['created_at'] ?? $now)
            ];
        }
    }

    $accPush = supabaseDbUpsert('l8_token_accounts', $accountRows, 'account_key');
    // Compat: DBs sin columna notepads aún (schema antiguo)
    if (empty($accPush['ok'])) {
        $fallbackRows = [];
        foreach ($accountRows as $row) {
            unset($row['notepads']);
            $fallbackRows[] = $row;
        }
        $accPush = supabaseDbUpsert('l8_token_accounts', $fallbackRows, 'account_key');
        if (!empty($accPush['ok'])) {
            $accPush['notepads_column_missing'] = true;
        }
    }
    $ledPush = $ledgerRows ? supabaseDbUpsert('l8_token_ledger', $ledgerRows, 'id') : ['ok' => true, 'skipped' => true];
    return [
        'ok' => !empty($accPush['ok']) && !empty($ledPush['ok']),
        'accounts' => $accPush,
        'ledger' => $ledPush
    ];
}

function tokensLoadLocalStore() {
    $path = tokensStorePath();
    if (!is_readable($path)) {
        return tokensEmptyStore();
    }
    $raw = @file_get_contents($path);
    $data = json_decode($raw ?: '{}', true);
    if (!is_array($data) || !isset($data['accounts']) || !is_array($data['accounts'])) {
        return tokensEmptyStore();
    }
    $out = tokensEmptyStore();
    foreach ($data['accounts'] as $key => $acct) {
        $out['accounts'][(string)$key] = tokensNormalizeAccount((string)$key, $acct);
    }
    $out['updated_at'] = $data['updated_at'] ?? date('c');
    $out['version'] = 2;
    return $out;
}

function tokensStoreCache($action = 'get', $store = null) {
    static $cache = null;
    static $cacheAt = 0;
    if ($action === 'set') {
        $cache = is_array($store) ? $store : null;
        $cacheAt = is_array($store) ? time() : 0;
        return $cache;
    }
    if ($action === 'clear') {
        $cache = null;
        $cacheAt = 0;
        return null;
    }
    return [$cache, $cacheAt];
}

function tokensLoadStore($forceRemote = true) {
    list($cache, $cacheAt) = tokensStoreCache('get');
    if (!$forceRemote && is_array($cache) && (time() - (int)$cacheAt) < 2) {
        return $cache;
    }

    $store = tokensLoadLocalStore();

    if ($forceRemote) {
        $fromStorage = tokensPullStoreFromStorage();
        if (!empty($fromStorage['ok']) && is_array($fromStorage['store'])) {
            $store = tokensMergeStores($store, $fromStorage['store']);
        }
        $fromDb = tokensPullStoreFromDb();
        if (!empty($fromDb['ok']) && is_array($fromDb['store'])) {
            $store = tokensMergeStores($store, $fromDb['store']);
        }
        // Escribe el merge local para sobrevivir al siguiente boot aunque falle la red
        @file_put_contents(tokensStorePath(), json_encode($store, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    }

    tokensStoreCache('set', $store);
    return $store;
}

function tokensSaveStore(array $store) {
    $merged = tokensEmptyStore();
    foreach (($store['accounts'] ?? []) as $key => $acct) {
        $merged['accounts'][(string)$key] = tokensNormalizeAccount((string)$key, $acct);
    }
    $merged['updated_at'] = date('c');
    $merged['version'] = 2;

    @file_put_contents(tokensStorePath(), json_encode($merged, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    tokensStoreCache('set', $merged);

    if (function_exists('supabaseConfig') && function_exists('supabaseStorageUploadJson')) {
        $cfg = supabaseConfig();
        if (!empty($cfg['configured'])) {
            @supabaseStorageUploadJson('meta/tokens_usage.json', $merged);
        }
    }
    @tokensPushStoreToDb($merged);

    return true;
}

function tokensEnsureHydrated() {
    // Fuerza merge remoto → local al boot / primer uso
    tokensLoadStore(true);
    return true;
}

function tokensGuestCookieName() {
    return 'l8_tokens_guest';
}

function tokensEnsureGuestId() {
    $name = tokensGuestCookieName();
    $headerGuest = '';
    if (!empty($_SERVER['HTTP_X_L8_TOKENS_GUEST'])) {
        $headerGuest = preg_replace('/[^a-zA-Z0-9_-]/', '', (string)$_SERVER['HTTP_X_L8_TOKENS_GUEST']);
    }
    $existing = isset($_COOKIE[$name]) ? preg_replace('/[^a-zA-Z0-9_-]/', '', (string)$_COOKIE[$name]) : '';
    if ($headerGuest !== '' && strlen($headerGuest) >= 8) {
        $existing = $headerGuest;
    }
    if ($existing !== '' && strlen($existing) >= 8) {
        if (!isset($_COOKIE[$name]) || $_COOKIE[$name] !== $existing) {
            @setcookie($name, $existing, [
                'expires' => time() + 86400 * 400,
                'path' => '/',
                'secure' => (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off'),
                'httponly' => false,
                'samesite' => 'Lax'
            ]);
            $_COOKIE[$name] = $existing;
        }
        return $existing;
    }
    $id = 'guest_' . bin2hex(random_bytes(8));
    @setcookie($name, $id, [
        'expires' => time() + 86400 * 400,
        'path' => '/',
        'secure' => (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off'),
        'httponly' => false,
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

function tokensArchiveIfNeeded(array $acct) {
    $currentPeriod = tokensCurrentPeriod();
    $acct = tokensNormalizeAccount($acct['account_key'] ?? '', $acct);
    if (($acct['period'] ?? '') === $currentPeriod) {
        $acct['allowance'] = tokensMonthlyAllowance();
        return $acct;
    }

    // Archiva el periodo anterior antes de resetear el cupo actual
    $oldPeriod = (string)$acct['period'];
    if ($oldPeriod !== '') {
        $snap = tokensSnapshotCurrent($acct);
        if (!isset($acct['periods']) || !is_array($acct['periods'])) {
            $acct['periods'] = [];
        }
        $acct['periods'][$oldPeriod] = isset($acct['periods'][$oldPeriod])
            ? tokensMergePeriodBuckets($acct['periods'][$oldPeriod], $snap)
            : $snap;
    }
    $fresh = tokensEmptyPeriodBucket($currentPeriod);
    $acct['period'] = $fresh['period'];
    $acct['allowance'] = $fresh['allowance'];
    $acct['used'] = 0;
    $acct['commands'] = 0;
    $acct['externals'] = 0;
    $acct['clones'] = 0;
    $acct['notepads'] = 0;
    $acct['updated_at'] = date('c');
    return $acct;
}

function tokensStatusForKey($accountKey, $includeHistory = true) {
    $store = tokensLoadStore(false);
    if (!isset($store['accounts'][$accountKey])) {
        // intenta hidratar remoto una vez si la cuenta no existe localmente
        $store = tokensLoadStore(true);
    }
    $acct = tokensNormalizeAccount($accountKey, $store['accounts'][$accountKey] ?? null);
    $before = $acct;
    $acct = tokensArchiveIfNeeded($acct);
    if ($acct !== $before || !isset($store['accounts'][$accountKey])) {
        $store['accounts'][$accountKey] = $acct;
        tokensSaveStore($store);
    } else {
        $store['accounts'][$accountKey] = $acct;
    }

    $used = (int)$acct['used'];
    $allowance = (int)$acct['allowance'];
    $remaining = max(0, $allowance - $used);
    $pctUsed = $allowance > 0 ? min(100, round(($used / $allowance) * 100, 2)) : 0;

    $history = [];
    if ($includeHistory) {
        foreach ($acct['periods'] as $p => $bucket) {
            $history[] = [
                'period' => $p,
                'allowance' => (int)($bucket['allowance'] ?? tokensMonthlyAllowance()),
                'used' => (int)($bucket['used'] ?? 0),
                'commands' => (int)($bucket['commands'] ?? 0),
                'externals' => (int)($bucket['externals'] ?? 0),
                'clones' => (int)($bucket['clones'] ?? 0),
                'notepads' => (int)($bucket['notepads'] ?? 0),
                'updated_at' => $bucket['updated_at'] ?? null
            ];
        }
        usort($history, function ($a, $b) {
            return strcmp((string)$b['period'], (string)$a['period']);
        });
    }

    $ledger = array_slice(tokensMergeLedgers($acct['ledger'] ?? [], []), 0, 40);

    return [
        'ok' => true,
        'account_key' => $accountKey,
        'period' => $acct['period'],
        'allowance' => $allowance,
        'used' => $used,
        'remaining' => $remaining,
        'percent_used' => $pctUsed,
        'commands' => (int)$acct['commands'],
        'externals' => (int)$acct['externals'],
        'clones' => (int)$acct['clones'],
        'notepads' => (int)($acct['notepads'] ?? 0),
        'costs' => [
            'command' => tokensCostCommand(),
            'external' => tokensCostExternal(),
            'clone' => tokensCostClone(),
            'notepad' => tokensCostNotepad()
        ],
        'history' => $history,
        'ledger' => $ledger,
        'persistent' => true,
        'exhausted' => $remaining <= 0,
        'updated_at' => $acct['updated_at'] ?? date('c')
    ];
}

function tokensStatus() {
    return tokensStatusForKey(tokensResolveAccountKey(), true);
}

function tokensConsume($kind, $detail = '') {
    $kind = strtolower(trim((string)$kind));
    if ($kind === 'cmd' || $kind === 'command' || $kind === 'commands') {
        $kind = 'command';
        $cost = tokensCostCommand();
    } else if ($kind === 'external' || $kind === 'externals' || $kind === 'window' || $kind === 'platform') {
        $kind = 'external';
        $cost = tokensCostExternal();
    } else if ($kind === 'clone' || $kind === 'clones' || $kind === 'repo_clone' || $kind === 'github_clone') {
        $kind = 'clone';
        $cost = tokensCostClone();
    } else if ($kind === 'notepad' || $kind === 'notepads' || $kind === 'notes' || $kind === 'bloc') {
        $kind = 'notepad';
        $cost = tokensCostNotepad();
    } else {
        return ['ok' => false, 'error' => 'Unknown token kind. Use command|external|clone|notepad', 'code' => 'bad_kind'];
    }

    $accountKey = tokensResolveAccountKey();
    $store = tokensLoadStore(true); // merge remoto antes de cobrar
    $acct = tokensNormalizeAccount($accountKey, $store['accounts'][$accountKey] ?? null);
    $acct = tokensArchiveIfNeeded($acct);
    $remaining = max(0, (int)$acct['allowance'] - (int)$acct['used']);

    if ($remaining < $cost) {
        $store['accounts'][$accountKey] = $acct;
        tokensSaveStore($store);
        return [
            'ok' => false,
            'error' => 'Tokens insuficientes para este mes. Cupo: ' . number_format((int)$acct['allowance']) . ' · Restantes: ' . number_format($remaining) . ' · Necesarios: ' . $cost,
            'code' => 'insufficient_tokens',
            'needed' => $cost,
            'status' => tokensStatusForKey($accountKey)
        ];
    }

    $acct['used'] = (int)$acct['used'] + $cost;
    if ($kind === 'command') $acct['commands'] = (int)$acct['commands'] + 1;
    if ($kind === 'external') $acct['externals'] = (int)$acct['externals'] + 1;
    if ($kind === 'clone') $acct['clones'] = (int)$acct['clones'] + 1;
    if ($kind === 'notepad') $acct['notepads'] = (int)($acct['notepads'] ?? 0) + 1;
    $acct['updated_at'] = date('c');

    $entry = [
        'id' => 'tx_' . bin2hex(random_bytes(8)),
        'account_key' => $accountKey,
        'period' => $acct['period'],
        'kind' => $kind,
        'cost' => $cost,
        'detail' => substr((string)$detail, 0, 240),
        'created_at' => date('c')
    ];
    $acct['ledger'] = tokensMergeLedgers([$entry], $acct['ledger'] ?? []);

    $store['accounts'][$accountKey] = $acct;
    tokensSaveStore($store);

    return [
        'ok' => true,
        'charged' => $cost,
        'kind' => $kind,
        'entry' => $entry,
        'status' => tokensStatusForKey($accountKey)
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
        // status siempre intenta merge liviano (cache 2s) + force si ?sync=1
        $sync = isset($_GET['sync']) && $_GET['sync'] !== '0' && $_GET['sync'] !== 'false';
        if ($sync) tokensLoadStore(true);
        echo json_encode(tokensStatus(), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        return true;
    }

    if (($uri === '/api/tokens/history' || $uri === '/api/tokens/ledger') && $method === 'GET') {
        $status = tokensStatus();
        echo json_encode([
            'ok' => true,
            'account_key' => $status['account_key'],
            'period' => $status['period'],
            'history' => $status['history'],
            'ledger' => $status['ledger']
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        return true;
    }

    if (($uri === '/api/tokens/sync' || $uri === '/api/tokens/hydrate') && ($method === 'POST' || $method === 'GET')) {
        tokensEnsureHydrated();
        echo json_encode([
            'ok' => true,
            'status' => tokensStatus(),
            'message' => 'Tokens hidratados desde almacenamiento persistente'
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        return true;
    }

    if (($uri === '/api/tokens/consume' || $uri === '/api/tokens/charge') && $method === 'POST') {
        $raw = file_get_contents('php://input');
        $input = json_decode($raw, true) ?? [];
        $kind = $input['kind'] ?? $input['type'] ?? '';
        $detail = $input['detail'] ?? $input['command'] ?? $input['url'] ?? '';
        $result = tokensConsume($kind, $detail);
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
