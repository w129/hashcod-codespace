<?php
/**
 * Registro de Claves Hashcod — persistencia por cuenta (local + Supabase).
 * Requiere sesión autenticada (Bearer). No usa guest.
 */

require_once __DIR__ . '/supabase.php';
if (!function_exists('authBearerTokenFromRequest')) {
    require_once __DIR__ . '/auth.php';
}

function hashcodKeysJson($payload, $code = 200) {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
}

function hashcodKeysDir() {
    $dir = __DIR__ . '/data_storage/hashcod_keys';
    if (!is_dir($dir)) {
        @mkdir($dir, 0777, true);
    }
    return $dir;
}

function hashcodKeysSafeAccountKey($accountKey) {
    $k = preg_replace('/[^a-zA-Z0-9_-]/', '', (string)$accountKey);
    return $k !== '' ? $k : '';
}

function hashcodKeysLocalPath($accountKey) {
    $safe = hashcodKeysSafeAccountKey($accountKey);
    return hashcodKeysDir() . '/' . $safe . '.json';
}

function hashcodKeysStorageObject($accountKey) {
    $safe = hashcodKeysSafeAccountKey($accountKey);
    return 'hashcod_keys/' . $safe . '.json';
}

/**
 * Resuelve cuenta autenticada. null = no autenticado.
 */
function hashcodKeysResolveAccount() {
    $token = '';
    if (function_exists('authBearerTokenFromRequest')) {
        $token = (string)authBearerTokenFromRequest();
    }
    if ($token === '' && !empty($_SERVER['HTTP_AUTHORIZATION']) && preg_match('/Bearer\s+(\S+)/i', $_SERVER['HTTP_AUTHORIZATION'], $m)) {
        $token = $m[1];
    }
    if ($token === '' || !function_exists('authValidateSession')) {
        return null;
    }
    $sess = authValidateSession($token);
    if (empty($sess['ok'])) {
        return null;
    }
    $accountId = '';
    if (!empty($sess['account_id'])) {
        $accountId = (string)$sess['account_id'];
    } elseif (!empty($sess['user_id'])) {
        $accountId = (string)$sess['user_id'];
    }
    $accountId = preg_replace('/[^a-zA-Z0-9_-]/', '', $accountId);
    if ($accountId === '') {
        return null;
    }
    // Misma convención que tokens.php
    $accountKey = (strpos($accountId, 'acct_') === 0) ? $accountId : ('acct_' . $accountId);
    return [
        'account_id' => $accountId,
        'account_key' => $accountKey
    ];
}

function hashcodKeysEmptyBundle($accountKey) {
    return [
        'version' => 1,
        'account_key' => $accountKey,
        'updated_at' => date('c'),
        'entries' => []
    ];
}

function hashcodKeysNormalizeEntry($row, $accountKey) {
    if (!is_array($row)) return null;
    $id = preg_replace('/[^a-zA-Z0-9_-]/', '', (string)($row['id'] ?? ''));
    if ($id === '') return null;
    $name = trim((string)($row['name'] ?? ''));
    $secret = (string)($row['secret'] ?? '');
    $code = trim((string)($row['code'] ?? ''));
    if ($name === '') $name = 'Sin nombre';
    return [
        'id' => substr($id, 0, 80),
        'account_key' => $accountKey,
        'name' => substr($name, 0, 120),
        'secret' => substr($secret, 0, 4000),
        'code' => substr($code, 0, 4000),
        'created_at' => (string)($row['created_at'] ?? date('c')),
        'updated_at' => (string)($row['updated_at'] ?? date('c'))
    ];
}

function hashcodKeysNormalizeBundle($accountKey, $data) {
    $bundle = hashcodKeysEmptyBundle($accountKey);
    if (!is_array($data)) return $bundle;
    $entries = [];
    $raw = isset($data['entries']) && is_array($data['entries']) ? $data['entries'] : [];
    foreach ($raw as $row) {
        $n = hashcodKeysNormalizeEntry($row, $accountKey);
        if ($n) $entries[$n['id']] = $n;
    }
    // newest first
    usort($entries, function ($a, $b) {
        return strcmp((string)($b['created_at'] ?? ''), (string)($a['created_at'] ?? ''));
    });
    $bundle['entries'] = array_values(array_slice($entries, 0, 200));
    $bundle['updated_at'] = (string)($data['updated_at'] ?? date('c'));
    return $bundle;
}

function hashcodKeysReadLocal($accountKey) {
    $path = hashcodKeysLocalPath($accountKey);
    if (!is_readable($path)) {
        return hashcodKeysEmptyBundle($accountKey);
    }
    $raw = @file_get_contents($path);
    $data = json_decode((string)$raw, true);
    return hashcodKeysNormalizeBundle($accountKey, is_array($data) ? $data : []);
}

function hashcodKeysWriteLocal($accountKey, array $bundle) {
    $bundle = hashcodKeysNormalizeBundle($accountKey, $bundle);
    $bundle['updated_at'] = date('c');
    $path = hashcodKeysLocalPath($accountKey);
    $ok = @file_put_contents(
        $path,
        json_encode($bundle, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE),
        LOCK_EX
    );
    return $ok !== false ? $bundle : null;
}

function hashcodKeysPullStorage($accountKey) {
    if (!function_exists('supabaseStorageDownloadJson') || !function_exists('supabaseConfig')) {
        return null;
    }
    $cfg = supabaseConfig();
    if (empty($cfg['configured'])) return null;
    $res = supabaseStorageDownloadJson('meta/' . hashcodKeysStorageObject($accountKey));
    if (empty($res['ok']) || !is_array($res['data'])) return null;
    return hashcodKeysNormalizeBundle($accountKey, $res['data']);
}

function hashcodKeysPushStorage($accountKey, array $bundle) {
    if (!function_exists('supabaseStorageUploadJson') || !function_exists('supabaseConfig')) {
        return ['ok' => false, 'error' => 'Storage helper ausente'];
    }
    $cfg = supabaseConfig();
    if (empty($cfg['configured'])) {
        return ['ok' => false, 'error' => 'Supabase no configurado'];
    }
    $bundle = hashcodKeysNormalizeBundle($accountKey, $bundle);
    return supabaseStorageUploadJson('meta/' . hashcodKeysStorageObject($accountKey), $bundle);
}

function hashcodKeysPullDb($accountKey) {
    if (!function_exists('supabaseDbSelect') || !function_exists('supabaseConfig')) {
        return null;
    }
    $cfg = supabaseConfig();
    if (empty($cfg['configured'])) return null;
    $q = 'select=id,account_key,name,secret,code,created_at,updated_at'
        . '&account_key=eq.' . rawurlencode($accountKey)
        . '&order=created_at.desc'
        . '&limit=200';
    $res = supabaseDbSelect('l8_hashcod_keys', $q);
    if (empty($res['ok'])) return null;
    $rows = is_array($res['body'] ?? null) ? $res['body'] : [];
    if ($rows !== [] && array_keys($rows) !== range(0, count($rows) - 1) && isset($rows['id'])) {
        $rows = [$rows];
    }
    return hashcodKeysNormalizeBundle($accountKey, ['entries' => $rows, 'updated_at' => date('c')]);
}

function hashcodKeysPushDb($accountKey, array $bundle) {
    if (!function_exists('supabaseDbUpsert') || !function_exists('supabaseConfig')) {
        return ['ok' => false, 'error' => 'DB helper ausente'];
    }
    $cfg = supabaseConfig();
    if (empty($cfg['configured'])) {
        return ['ok' => false, 'error' => 'Supabase no configurado'];
    }
    $bundle = hashcodKeysNormalizeBundle($accountKey, $bundle);
    $rows = [];
    foreach ($bundle['entries'] as $entry) {
        $n = hashcodKeysNormalizeEntry($entry, $accountKey);
        if (!$n) continue;
        $rows[] = [
            'id' => $n['id'],
            'account_key' => $accountKey,
            'name' => $n['name'],
            'secret' => $n['secret'],
            'code' => $n['code'],
            'created_at' => $n['created_at'],
            'updated_at' => date('c')
        ];
    }
    if ($rows === []) {
        // nothing to upsert; deletes are handled separately
        return ['ok' => true, 'skipped' => true];
    }
    return supabaseDbUpsert('l8_hashcod_keys', $rows, 'id');
}

function hashcodKeysMergeBundles($accountKey, array $bundles) {
    $map = [];
    foreach ($bundles as $bundle) {
        if (!is_array($bundle) || empty($bundle['entries']) || !is_array($bundle['entries'])) continue;
        foreach ($bundle['entries'] as $row) {
            $n = hashcodKeysNormalizeEntry($row, $accountKey);
            if (!$n) continue;
            $prev = $map[$n['id']] ?? null;
            if (!$prev) {
                $map[$n['id']] = $n;
                continue;
            }
            // keep newest updated_at / created_at
            $a = (string)($n['updated_at'] ?? $n['created_at'] ?? '');
            $b = (string)($prev['updated_at'] ?? $prev['created_at'] ?? '');
            if ($a >= $b) $map[$n['id']] = $n;
        }
    }
    return hashcodKeysNormalizeBundle($accountKey, [
        'entries' => array_values($map),
        'updated_at' => date('c')
    ]);
}

function hashcodKeysLoadForAccount($accountKey) {
    $local = hashcodKeysReadLocal($accountKey);
    $storage = hashcodKeysPullStorage($accountKey);
    $db = hashcodKeysPullDb($accountKey);
    $merged = hashcodKeysMergeBundles($accountKey, array_filter([$local, $storage, $db]));
    // persist merged locally so next read is fast
    hashcodKeysWriteLocal($accountKey, $merged);
    return $merged;
}

function hashcodKeysPersist($accountKey, array $bundle) {
    $bundle = hashcodKeysNormalizeBundle($accountKey, $bundle);
    $written = hashcodKeysWriteLocal($accountKey, $bundle);
    if (!$written) {
        return ['ok' => false, 'error' => 'No se pudo guardar localmente'];
    }
    $storage = hashcodKeysPushStorage($accountKey, $written);
    $db = hashcodKeysPushDb($accountKey, $written);
    return [
        'ok' => true,
        'bundle' => $written,
        'supabase' => [
            'storage' => !empty($storage['ok']),
            'storage_error' => $storage['error'] ?? null,
            'db' => !empty($db['ok']),
            'db_error' => $db['error'] ?? null
        ]
    ];
}

function hashcodKeysPublicEntries(array $bundle) {
    $out = [];
    foreach (($bundle['entries'] ?? []) as $row) {
        if (!is_array($row)) continue;
        $out[] = [
            'id' => (string)($row['id'] ?? ''),
            'name' => (string)($row['name'] ?? ''),
            'secret' => (string)($row['secret'] ?? ''),
            'code' => (string)($row['code'] ?? ''),
            'created_at' => (string)($row['created_at'] ?? ''),
            'updated_at' => (string)($row['updated_at'] ?? '')
        ];
    }
    return $out;
}

function hashcodKeysHandleApi($uri) {
    $uri = (string)$uri;
    if (strpos($uri, '/api/hashcod/keys') !== 0) {
        return false;
    }

    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    $acct = hashcodKeysResolveAccount();
    if (!$acct) {
        hashcodKeysJson([
            'ok' => false,
            'error' => 'Debes iniciar sesión para guardar claves en tu cuenta.',
            'code' => 'not_authenticated'
        ], 401);
        return true;
    }
    $accountKey = $acct['account_key'];

    if ($uri === '/api/hashcod/keys' && $method === 'GET') {
        $bundle = hashcodKeysLoadForAccount($accountKey);
        hashcodKeysJson([
            'ok' => true,
            'account_key' => $accountKey,
            'entries' => hashcodKeysPublicEntries($bundle),
            'updated_at' => $bundle['updated_at'] ?? null
        ]);
        return true;
    }

    if ($uri === '/api/hashcod/keys' && $method === 'POST') {
        $input = json_decode((string)file_get_contents('php://input'), true);
        if (!is_array($input)) $input = [];

        // Bulk migrate: { entries: [...] }
        if (isset($input['entries']) && is_array($input['entries'])) {
            $bundle = hashcodKeysLoadForAccount($accountKey);
            $map = [];
            foreach ($bundle['entries'] as $row) {
                $map[$row['id']] = $row;
            }
            $added = 0;
            foreach ($input['entries'] as $row) {
                if (!is_array($row)) continue;
                $id = preg_replace('/[^a-zA-Z0-9_-]/', '', (string)($row['id'] ?? ''));
                if ($id === '') {
                    $id = 'k_' . bin2hex(random_bytes(8));
                }
                $row['id'] = $id;
                $n = hashcodKeysNormalizeEntry($row, $accountKey);
                if (!$n) continue;
                if (!isset($map[$n['id']])) $added++;
                $map[$n['id']] = $n;
            }
            $bundle['entries'] = array_values($map);
            $res = hashcodKeysPersist($accountKey, $bundle);
            if (empty($res['ok'])) {
                hashcodKeysJson(['ok' => false, 'error' => $res['error'] ?? 'No se pudo guardar'], 500);
                return true;
            }
            hashcodKeysJson([
                'ok' => true,
                'migrated' => $added,
                'account_key' => $accountKey,
                'entries' => hashcodKeysPublicEntries($res['bundle']),
                'supabase' => $res['supabase'] ?? null
            ]);
            return true;
        }

        $name = trim((string)($input['name'] ?? ''));
        $secret = (string)($input['secret'] ?? '');
        $code = trim((string)($input['code'] ?? ''));
        if ($name === '') {
            hashcodKeysJson(['ok' => false, 'error' => 'Escribe un nombre para la clave.'], 400);
            return true;
        }
        if ($secret === '' && $code === '') {
            hashcodKeysJson(['ok' => false, 'error' => 'Introduce una contraseña/clave o un código criptográfico.'], 400);
            return true;
        }
        $id = preg_replace('/[^a-zA-Z0-9_-]/', '', (string)($input['id'] ?? ''));
        if ($id === '') {
            $id = 'k_' . bin2hex(random_bytes(8));
        }
        $bundle = hashcodKeysLoadForAccount($accountKey);
        $entry = hashcodKeysNormalizeEntry([
            'id' => $id,
            'name' => $name,
            'secret' => $secret,
            'code' => $code,
            'created_at' => date('c'),
            'updated_at' => date('c')
        ], $accountKey);
        $map = [];
        foreach ($bundle['entries'] as $row) {
            $map[$row['id']] = $row;
        }
        $map[$entry['id']] = $entry;
        $bundle['entries'] = array_values($map);
        $res = hashcodKeysPersist($accountKey, $bundle);
        if (empty($res['ok'])) {
            hashcodKeysJson(['ok' => false, 'error' => $res['error'] ?? 'No se pudo guardar'], 500);
            return true;
        }
        hashcodKeysJson([
            'ok' => true,
            'entry' => $entry,
            'account_key' => $accountKey,
            'entries' => hashcodKeysPublicEntries($res['bundle']),
            'supabase' => $res['supabase'] ?? null
        ]);
        return true;
    }

    if (($uri === '/api/hashcod/keys' || preg_match('#^/api/hashcod/keys/#', $uri)) && $method === 'DELETE') {
        $id = '';
        if (preg_match('#^/api/hashcod/keys/([^/?]+)#', $uri, $m)) {
            $id = rawurldecode($m[1]);
        }
        if ($id === '' && isset($_GET['id'])) {
            $id = (string)$_GET['id'];
        }
        $input = json_decode((string)file_get_contents('php://input'), true);
        if ($id === '' && is_array($input) && !empty($input['id'])) {
            $id = (string)$input['id'];
        }
        $id = preg_replace('/[^a-zA-Z0-9_-]/', '', $id);
        if ($id === '') {
            hashcodKeysJson(['ok' => false, 'error' => 'Falta id de la clave.'], 400);
            return true;
        }
        $bundle = hashcodKeysLoadForAccount($accountKey);
        $bundle['entries'] = array_values(array_filter($bundle['entries'], function ($row) use ($id) {
            return (string)($row['id'] ?? '') !== $id;
        }));
        $res = hashcodKeysPersist($accountKey, $bundle);
        if (empty($res['ok'])) {
            hashcodKeysJson(['ok' => false, 'error' => $res['error'] ?? 'No se pudo eliminar'], 500);
            return true;
        }
        // Also delete DB row if table exists
        if (function_exists('supabaseDbDelete') && function_exists('supabaseConfig')) {
            $cfg = supabaseConfig();
            if (!empty($cfg['configured'])) {
                @supabaseDbDelete(
                    'l8_hashcod_keys',
                    'id=eq.' . rawurlencode($id) . '&account_key=eq.' . rawurlencode($accountKey)
                );
            }
        }
        hashcodKeysJson([
            'ok' => true,
            'deleted' => $id,
            'account_key' => $accountKey,
            'entries' => hashcodKeysPublicEntries($res['bundle']),
            'supabase' => $res['supabase'] ?? null
        ]);
        return true;
    }

    hashcodKeysJson(['ok' => false, 'error' => 'Método no soportado'], 405);
    return true;
}
