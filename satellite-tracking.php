<?php
/**
 * Hashcod satellite tracking data bridge.
 *
 * Provides a same-origin, cached subset of CelesTrak GP/OMM JSON data for the
 * in-platform God's Eye View orbital display. CelesTrak asks clients to avoid
 * downloading unchanged GP data more than once per update (normally 2 hours),
 * so this endpoint caches every query locally for two hours and can serve a
 * stale cache if the upstream service is temporarily unavailable.
 */

declare(strict_types=1);

const HASHCOD_SAT_CACHE_TTL = 7200;
const HASHCOD_SAT_MAX_ROWS = 500;
const HASHCOD_SAT_SOURCE = 'https://celestrak.org/NORAD/elements/gp.php';

function satelliteJson(int $status, array $body): never {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: public, max-age=60, stale-while-revalidate=300');
    header('X-Content-Type-Options: nosniff');
    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function satelliteAllowedGroups(): array {
    return [
        'stations' => 'STATIONS',
        'visual' => 'VISUAL',
        'weather' => 'WEATHER',
        'resource' => 'RESOURCE',
        'sarsat' => 'SARSAT',
        'gps-ops' => 'GPS-OPS',
        'galileo' => 'GALILEO',
        'beidou' => 'BEIDOU',
        'geo' => 'GEO',
        'starlink' => 'STARLINK',
        'oneweb' => 'ONEWEB',
        'amateur' => 'AMATEUR',
        'cubesat' => 'CUBESAT',
        'science' => 'SCIENCE',
    ];
}

function satelliteCachePath(string $cacheKey): string {
    $dir = __DIR__ . '/data_storage/satellite_cache';
    if (!is_dir($dir)) @mkdir($dir, 0775, true);
    return $dir . '/' . hash('sha256', $cacheKey) . '.json';
}

function satelliteReadCache(string $path): ?array {
    if (!is_file($path)) return null;
    $raw = @file_get_contents($path);
    if (!is_string($raw) || $raw === '') return null;
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : null;
}

function satelliteWriteCache(string $path, array $payload): void {
    $json = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if (!is_string($json)) return;
    $tmp = $path . '.tmp-' . bin2hex(random_bytes(4));
    if (@file_put_contents($tmp, $json, LOCK_EX) !== false) @rename($tmp, $path);
    else @unlink($tmp);
}

function satelliteFetchUpstream(string $url): array {
    $body = '';
    $status = 0;
    $error = '';

    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_CONNECTTIMEOUT => 8,
            CURLOPT_TIMEOUT => 18,
            CURLOPT_MAXREDIRS => 2,
            CURLOPT_HTTPHEADER => [
                'Accept: application/json',
                'User-Agent: Hashcod-Codespace/1.0 satellite-visualization',
            ],
        ]);
        $response = curl_exec($ch);
        $status = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
        if ($response === false) $error = (string)curl_error($ch);
        else $body = (string)$response;
        curl_close($ch);
    } else {
        $context = stream_context_create([
            'http' => [
                'method' => 'GET',
                'timeout' => 18,
                'header' => "Accept: application/json\r\nUser-Agent: Hashcod-Codespace/1.0 satellite-visualization\r\n",
                'ignore_errors' => true,
            ],
        ]);
        $response = @file_get_contents($url, false, $context);
        if (is_string($response)) $body = $response;
        if (isset($http_response_header) && is_array($http_response_header)) {
            foreach ($http_response_header as $header) {
                if (preg_match('#^HTTP/\S+\s+(\d{3})#i', $header, $m)) {
                    $status = (int)$m[1];
                    break;
                }
            }
        }
        if ($body === '') $error = 'upstream request failed';
    }

    if ($status < 200 || $status >= 300 || $body === '') {
        throw new RuntimeException('CelesTrak request failed' . ($status ? ' (HTTP ' . $status . ')' : '') . ($error !== '' ? ': ' . $error : ''));
    }

    $decoded = json_decode($body, true);
    if (!is_array($decoded)) throw new RuntimeException('CelesTrak returned invalid JSON');
    return $decoded;
}

function satelliteNumber(array $row, string $key): ?float {
    if (!array_key_exists($key, $row) || $row[$key] === '' || $row[$key] === null) return null;
    $value = (float)$row[$key];
    return is_finite($value) ? $value : null;
}

function satelliteNormalizeRow(array $row): ?array {
    $catalog = trim((string)($row['NORAD_CAT_ID'] ?? ''));
    $name = trim((string)($row['OBJECT_NAME'] ?? ''));
    $epoch = trim((string)($row['EPOCH'] ?? ''));
    $meanMotion = satelliteNumber($row, 'MEAN_MOTION');
    $eccentricity = satelliteNumber($row, 'ECCENTRICITY');
    $inclination = satelliteNumber($row, 'INCLINATION');
    $raan = satelliteNumber($row, 'RA_OF_ASC_NODE');
    $argPericenter = satelliteNumber($row, 'ARG_OF_PERICENTER');
    $meanAnomaly = satelliteNumber($row, 'MEAN_ANOMALY');

    if ($catalog === '' || $name === '' || $epoch === '' || $meanMotion === null || $meanMotion <= 0) return null;
    if ($eccentricity === null || $inclination === null || $raan === null || $argPericenter === null || $meanAnomaly === null) return null;

    return [
        'name' => $name,
        'norad_id' => $catalog,
        'international_designator' => trim((string)($row['OBJECT_ID'] ?? '')),
        'object_type' => trim((string)($row['OBJECT_TYPE'] ?? '')),
        'epoch' => $epoch,
        'mean_motion' => $meanMotion,
        'eccentricity' => $eccentricity,
        'inclination' => $inclination,
        'raan' => $raan,
        'arg_pericenter' => $argPericenter,
        'mean_anomaly' => $meanAnomaly,
        'bstar' => satelliteNumber($row, 'BSTAR'),
        'ephemeris_type' => trim((string)($row['EPHEMERIS_TYPE'] ?? '')),
        'element_set_no' => trim((string)($row['ELEMENT_SET_NO'] ?? '')),
        'rev_at_epoch' => trim((string)($row['REV_AT_EPOCH'] ?? '')),
    ];
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    header('Allow: GET');
    satelliteJson(405, ['ok' => false, 'error' => 'method_not_allowed']);
}

$groups = satelliteAllowedGroups();
$groupKey = strtolower(trim((string)($_GET['group'] ?? 'stations')));
$catalog = trim((string)($_GET['catnr'] ?? ''));

if ($catalog !== '' && !preg_match('/^[0-9]{1,7}$/', $catalog)) {
    satelliteJson(400, ['ok' => false, 'error' => 'invalid_catalog_number']);
}
if ($catalog === '' && !isset($groups[$groupKey])) {
    satelliteJson(400, [
        'ok' => false,
        'error' => 'invalid_group',
        'allowed_groups' => array_keys($groups),
    ]);
}

if ($catalog !== '') {
    $queryLabel = 'catnr:' . $catalog;
    $upstreamUrl = HASHCOD_SAT_SOURCE . '?CATNR=' . rawurlencode($catalog) . '&FORMAT=JSON';
} else {
    $celestrakGroup = $groups[$groupKey];
    $queryLabel = 'group:' . $groupKey;
    $upstreamUrl = HASHCOD_SAT_SOURCE . '?GROUP=' . rawurlencode($celestrakGroup) . '&FORMAT=JSON';
}

$cachePath = satelliteCachePath($queryLabel);
$cached = satelliteReadCache($cachePath);
$cacheMtime = is_file($cachePath) ? (int)@filemtime($cachePath) : 0;
$cacheAge = $cacheMtime > 0 ? max(0, time() - $cacheMtime) : null;

$rows = null;
$cacheState = 'miss';
$upstreamError = null;

if ($cached !== null && $cacheAge !== null && $cacheAge < HASHCOD_SAT_CACHE_TTL && isset($cached['rows']) && is_array($cached['rows'])) {
    $rows = $cached['rows'];
    $cacheState = 'fresh';
} else {
    try {
        $rawRows = satelliteFetchUpstream($upstreamUrl);
        $rows = array_values(array_filter(array_map(
            static fn($row) => is_array($row) ? satelliteNormalizeRow($row) : null,
            $rawRows
        )));
        satelliteWriteCache($cachePath, [
            'fetched_at' => gmdate('c'),
            'rows' => $rows,
        ]);
        $cacheAge = 0;
        $cacheState = 'refreshed';
    } catch (Throwable $error) {
        $upstreamError = $error->getMessage();
        if ($cached !== null && isset($cached['rows']) && is_array($cached['rows'])) {
            $rows = $cached['rows'];
            $cacheState = 'stale';
        }
    }
}

if (!is_array($rows)) {
    satelliteJson(503, [
        'ok' => false,
        'error' => 'satellite_data_unavailable',
        'detail' => $upstreamError,
        'source' => 'CelesTrak GP/OMM',
    ]);
}

if ($catalog === '' && count($rows) > HASHCOD_SAT_MAX_ROWS) {
    $rows = array_slice($rows, 0, HASHCOD_SAT_MAX_ROWS);
}

satelliteJson(200, [
    'ok' => true,
    'source' => 'CelesTrak GP/OMM',
    'source_url' => 'https://celestrak.org/',
    'propagation_note' => 'Orbital elements only. The Hashcod client derives display coordinates from the current GP mean elements.',
    'group' => $catalog === '' ? $groupKey : null,
    'catalog_number' => $catalog !== '' ? $catalog : null,
    'cache' => $cacheState,
    'cache_age_seconds' => $cacheAge,
    'count' => count($rows),
    'satellites' => $rows,
]);
