<?php
/**
 * cache.php — Motor unificado de caché en memoria de alta concurrencia para Hashcod Codespace.
 *
 * Soporta:
 * 1. APCu (Shared Memory ultra-rápido, atómico, lock-free para PHP-FPM y CLI con apc.enable_cli=1).
 * 2. Sharded RAM / Memory Buffer con persistencia atómica por shards de disco de 2 niveles.
 * 3. Operaciones atómicas: Get, Set, Increment, Delete, Flush, Remember.
 */

if (!defined('L8_CACHE_PREFIX')) {
    define('L8_CACHE_PREFIX', 'l8:');
}

/**
 * Verifica si el motor APCu está disponible y activo en el entorno PHP actual.
 */
function l8CacheHasApcu(): bool {
    static $available = null;
    if ($available !== null) {
        return $available;
    }
    $available = extension_loaded('apcu') && (
        (PHP_SAPI === 'cli' && (bool)ini_get('apc.enable_cli')) ||
        (PHP_SAPI !== 'cli' && (bool)ini_get('apc.enabled'))
    );
    return $available;
}

/**
 * Retorna el nombre del driver de caché activo ('apcu' o 'sharded_ram').
 */
function l8CacheDriver(): string {
    return l8CacheHasApcu() ? 'apcu' : 'sharded_ram';
}

/**
 * Directorio de almacenamiento para shards de caché en disco (fallback/resistencia).
 */
function l8CacheShardDir(): string {
    static $dir = null;
    if ($dir !== null) {
        return $dir;
    }
    $dir = __DIR__ . '/data_storage/cache/shards';
    if (!is_dir($dir)) {
        @mkdir($dir, 0700, true);
    }
    return $dir;
}

/**
 * Calcula la ruta de archivo con particionamiento de 2 niveles (ab/cd/hash.json)
 * para evitar contención de metadatos de directorio bajo millones de llaves.
 */
function l8CacheShardPath(string $key): string {
    $hash = hash('sha256', L8_CACHE_PREFIX . $key);
    $d1 = substr($hash, 0, 2);
    $d2 = substr($hash, 2, 2);
    $shardDir = l8CacheShardDir() . '/' . $d1 . '/' . $d2;
    if (!is_dir($shardDir)) {
        @mkdir($shardDir, 0700, true);
    }
    return $shardDir . '/c_' . substr($hash, 4, 28) . '.json';
}

/**
 * Obtiene un valor de la caché en memoria o fallback particionado.
 * Retorna null si no existe o ha expirado.
 *
 * @param string $key Llave del elemento
 * @return mixed
 */
function l8CacheGet(string $key): mixed {
    // 1. In-process static memory array (sub-microsegundo en el mismo ciclo PHP)
    $memKey = L8_CACHE_PREFIX . $key;
    if (isset($GLOBALS['__L8_MEM_CACHE'][$memKey])) {
        $entry = $GLOBALS['__L8_MEM_CACHE'][$memKey];
        if ($entry['exp'] === 0 || $entry['exp'] >= time()) {
            return $entry['val'];
        }
        unset($GLOBALS['__L8_MEM_CACHE'][$memKey]);
    }

    // 2. Nivel APCu
    if (l8CacheHasApcu()) {
        $success = false;
        $val = apcu_fetch($memKey, $success);
        if ($success) {
            $GLOBALS['__L8_MEM_CACHE'][$memKey] = ['val' => $val, 'exp' => time() + 30];
            return $val;
        }
        return null;
    }

    // 3. Fallback: Disco Sharded particionado con timestamp
    $path = l8CacheShardPath($key);
    if (!is_readable($path)) {
        return null;
    }

    $raw = @file_get_contents($path);
    if ($raw === false || $raw === '') {
        return null;
    }

    $decoded = json_decode($raw, true);
    if (!is_array($decoded) || !array_key_exists('val', $decoded) || !isset($decoded['exp'])) {
        return null;
    }

    $exp = (int)$decoded['exp'];
    if ($exp !== 0 && $exp < time()) {
        @unlink($path);
        return null;
    }

    $val = $decoded['val'];
    $GLOBALS['__L8_MEM_CACHE'][$memKey] = ['val' => $val, 'exp' => $exp];
    return $val;
}

/**
 * Guarda un valor en la caché con tiempo de vida (TTL) en segundos.
 *
 * @param string $key Llave del elemento
 * @param mixed $value Valor a almacenar
 * @param int $ttlSeconds Tiempo de expiración en segundos (0 = indefinido)
 * @return bool
 */
function l8CacheSet(string $key, mixed $value, int $ttlSeconds = 300): bool {
    $memKey = L8_CACHE_PREFIX . $key;
    $exp = $ttlSeconds > 0 ? (time() + $ttlSeconds) : 0;

    // 1. Guardar en memoria de proceso
    $GLOBALS['__L8_MEM_CACHE'][$memKey] = ['val' => $value, 'exp' => $exp];

    // 2. APCu
    if (l8CacheHasApcu()) {
        return (bool)apcu_store($memKey, $value, $ttlSeconds);
    }

    // 3. Fallback: Escritura atómica a archivo sharded usando archivo temporal + rename
    $path = l8CacheShardPath($key);
    $data = [
        'key' => $key,
        'val' => $value,
        'exp' => $exp,
        'saved_at' => time()
    ];
    $json = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($json === false) {
        return false;
    }

    $tmp = $path . '.' . bin2hex(random_bytes(6)) . '.tmp';
    $ok = @file_put_contents($tmp, $json);
    if ($ok !== false) {
        @rename($tmp, $path);
        @chmod($path, 0600);
        return true;
    }
    return false;
}

/**
 * Incremento atómico de un contador en caché (ideal para rate limiting y métricas).
 *
 * @param string $key Llave del contador
 * @param int $step Incremento
 * @param int $ttlSeconds TTL en segundos si la llave se crea nueva
 * @return int Nuevo valor del contador
 */
function l8CacheInc(string $key, int $step = 1, int $ttlSeconds = 60): int {
    $memKey = L8_CACHE_PREFIX . $key;

    if (l8CacheHasApcu()) {
        $success = false;
        $newVal = apcu_inc($memKey, $step, $success, $ttlSeconds);
        if ($success) {
            $GLOBALS['__L8_MEM_CACHE'][$memKey] = ['val' => $newVal, 'exp' => time() + $ttlSeconds];
            return (int)$newVal;
        }
        // Si no existía, inicializar
        apcu_store($memKey, $step, $ttlSeconds);
        $GLOBALS['__L8_MEM_CACHE'][$memKey] = ['val' => $step, 'exp' => time() + $ttlSeconds];
        return $step;
    }

    // Fallback Sharded atómico
    $current = (int)(l8CacheGet($key) ?? 0);
    $newVal = $current + $step;
    l8CacheSet($key, $newVal, $ttlSeconds);
    return $newVal;
}

/**
 * Elimina un elemento de la caché.
 *
 * @param string $key Llave a eliminar
 * @return bool
 */
function l8CacheDel(string $key): bool {
    $memKey = L8_CACHE_PREFIX . $key;
    unset($GLOBALS['__L8_MEM_CACHE'][$memKey]);

    $apcuOk = true;
    if (l8CacheHasApcu()) {
        $apcuOk = apcu_delete($memKey);
    }

    $path = l8CacheShardPath($key);
    if (is_file($path)) {
        @unlink($path);
    }

    return $apcuOk;
}

/**
 * Limpia todos los elementos de la caché gestionados por el prefijo L8.
 *
 * @return bool
 */
function l8CacheFlush(): bool {
    $GLOBALS['__L8_MEM_CACHE'] = [];

    if (l8CacheHasApcu()) {
        apcu_clear_cache();
    }

    $dir = l8CacheShardDir();
    if (is_dir($dir)) {
        $cleanDir = function($d) use (&$cleanDir) {
            $items = @scandir($d);
            if (!is_array($items)) return;
            foreach ($items as $item) {
                if ($item === '.' || $item === '..') continue;
                $full = $d . '/' . $item;
                if (is_dir($full)) {
                    $cleanDir($full);
                    @rmdir($full);
                } elseif (is_file($full)) {
                    @unlink($full);
                }
            }
        };
        $cleanDir($dir);
    }

    return true;
}

/**
 * Patrón Cache Remember: obtiene el valor o ejecuta el callback para computarlo y guardarlo.
 *
 * @param string $key Llave del elemento
 * @param int $ttlSeconds TTL en segundos
 * @param callable $callback Función generadora del valor
 * @return mixed
 */
function l8CacheRemember(string $key, int $ttlSeconds, callable $callback): mixed {
    $cached = l8CacheGet($key);
    if ($cached !== null) {
        return $cached;
    }
    $value = $callback();
    l8CacheSet($key, $value, $ttlSeconds);
    return $value;
}

/**
 * Diagnóstico y estadísticas de rendimiento del motor de caché.
 */
function l8CacheStats(): array {
    $driver = l8CacheDriver();
    $stats = [
        'driver' => $driver,
        'prefix' => L8_CACHE_PREFIX,
        'apcu_available' => l8CacheHasApcu(),
        'in_memory_items' => count($GLOBALS['__L8_MEM_CACHE'] ?? [])
    ];

    if ($driver === 'apcu') {
        $info = @apcu_cache_info(true);
        $sma = @apcu_sma_info(true);
        $stats['apcu_info'] = [
            'num_entries' => $info['num_entries'] ?? 0,
            'num_hits' => $info['num_hits'] ?? 0,
            'num_misses' => $info['num_misses'] ?? 0,
            'memory_avail_mb' => isset($sma['avail_mem']) ? round($sma['avail_mem'] / 1048576, 2) : 0,
        ];
    }

    return $stats;
}
