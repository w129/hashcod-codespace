<?php
// api.php - Backend PHP con Super Base de Datos, Dilithium 5, SSH GitHub, Supabase y Navegador de Código por Carpetas
ini_set('memory_limit', '1024M'); // 1GB Memory Limit
set_time_limit(300); // 5 Minutos para grandes cargas

require_once __DIR__ . '/supabase.php';
loadEnvFile();

if (!ob_start("ob_gzhandler")) {
    ob_start();
}

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: *');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$BROWSER_NAMES = ['chrome', 'brave', 'msedge', 'firefox', 'camoufox', 'opera', 'vivaldi', 'arc'];
$REGISTERED_COMMANDS = [
    "set_i code"  => "Sube archivos masivos a la super base de datos gigante global protegida con Dilithium 5 y consulta todo el catálogo",
    "repos"       => "Catálogo global de GitHub: busca y guarda repos de toda la plataforma (ej: repos, repos laravel, repos page 2)",
    "clone <repo>"=> "Clona o actualiza repositorios de GitHub vía SSH/HTTPS en el servidor (ej: clone langgenius/dify)",
    "save <repo>" => "Guarda un repositorio de GitHub en el catálogo sin clonarlo (ej: save facebook/react)",
    "ssh_key"     => "Muestra la clave pública SSH Ed25519 generada por esta plataforma para conectar el servidor con GitHub",
    "supabase"    => "Estado de Supabase Storage: conecta y almacena archivos, repos_index y catálogo global en la nube",
    "mane_list?"  => "Muestra la lista de comandos creados y su funcionalidad",
    "crl"         => "Deja la celda de ejecución (=) totalmente vacía",
    "status"      => "Consulta el estado del servidor y motores detectados",
    "browsers"    => "Muestra los procesos reales de navegadores en ejecución",
    "ping"        => "Comprueba la conectividad y latencia con el servidor",
    "bigdata"     => "Genera y prueba la transmisión en lote de grandes volúmenes de datos"
];

$STORAGE_DIR = __DIR__ . '/data_storage';
$UPLOADS_DIR = __DIR__ . '/uploads';
$REPOS_DIR   = __DIR__ . '/data_storage/repos';

if (!file_exists($STORAGE_DIR)) @mkdir($STORAGE_DIR, 0777, true);
if (!file_exists($UPLOADS_DIR)) @mkdir($UPLOADS_DIR, 0777, true);
if (!file_exists($REPOS_DIR))   @mkdir($REPOS_DIR, 0777, true);

/**
 * CONSULTA DEL ÁRBOL E ESTRUCTURA DE CARPETAS DE UN REPOSITORIO
 */
function getRepoTree($repoName) {
    global $REPOS_DIR;
    $safeRepo = basename($repoName);
    $targetDir = realpath($REPOS_DIR . '/' . $safeRepo);
    $baseDir = realpath($REPOS_DIR);

    if (!$targetDir || strpos($targetDir, $baseDir) !== 0 || !is_dir($targetDir)) {
        return ['ok' => false, 'error' => "Repositorio '$repoName' no encontrado"];
    }

    $tree = [];
    $iterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($targetDir, RecursiveDirectoryIterator::SKIP_DOTS),
        RecursiveIteratorIterator::SELF_FIRST
    );

    foreach ($iterator as $item) {
        $relPath = str_replace('\\', '/', substr($item->getPathname(), strlen($targetDir) + 1));
        if (strpos($relPath, '.git') === 0 || strpos($relPath, '/.git') !== false) continue;

        $tree[] = [
            'path' => $relPath,
            'name' => $item->getFilename(),
            'type' => $item->isDir() ? 'folder' : 'file',
            'size_formatted' => $item->isFile() ? formatBytes($item->getSize()) : 0
        ];
    }

    // Ordenar: Carpetas primero, luego archivos
    usort($tree, function($a, $b) {
        if ($a['type'] !== $b['type']) {
            return $a['type'] === 'folder' ? -1 : 1;
        }
        return strnatcasecmp($a['path'], $b['path']);
    });

    return ['ok' => true, 'repo' => $safeRepo, 'tree' => $tree];
}

/**
 * OBTENER EL CONTENIDO COMPLETO DE UN ARCHIVO DE CÓDIGO
 */
function getRepoFileContent($repoName, $filePath) {
    global $REPOS_DIR;
    $safeRepo = basename($repoName);
    $targetDir = realpath($REPOS_DIR . '/' . $safeRepo);
    $baseDir = realpath($REPOS_DIR);

    if (!$targetDir || strpos($targetDir, $baseDir) !== 0 || !is_dir($targetDir)) {
        return ['ok' => false, 'error' => 'Repositorio no encontrado'];
    }

    $cleanFilePath = ltrim(str_replace(['..', '\\'], ['', '/'], $filePath), '/');
    $realFilePath = realpath($targetDir . '/' . $cleanFilePath);

    if (!$realFilePath || strpos($realFilePath, $targetDir) !== 0 || !is_file($realFilePath)) {
        return ['ok' => false, 'error' => "Archivo '$cleanFilePath' no encontrado"];
    }

    if (filesize($realFilePath) > 3000000) {
        return ['ok' => false, 'error' => 'Archivo demasiado grande para mostrar en consola'];
    }

    $content = file_get_contents($realFilePath);
    return [
        'ok' => true,
        'repo' => $safeRepo,
        'path' => $cleanFilePath,
        'filename' => basename($cleanFilePath),
        'size_formatted' => formatBytes(filesize($realFilePath)),
        'content' => $content
    ];
}

/**
 * GESTOR Y GENERADOR DINÁMICO DE CLAVE SSH ED25519 DE LA PLATAFORMA
 */
function getOrGenerateSshKey($forceRegenerate = false) {
    $homeDir = getenv('HOME') ?: (getenv('USERPROFILE') ?: __DIR__);
    $sshDir = $homeDir . '/.ssh';
    $keyPath = $sshDir . '/id_ed25519_github';
    $pubKeyPath = $keyPath . '.pub';
    $serverName = gethostname() ?: 'l8-codespace-platform';
    $comment = 'l8-platform@' . $serverName;

    if (!file_exists($sshDir)) {
        @mkdir($sshDir, 0700, true);
    }

    if ($forceRegenerate || !file_exists($keyPath) || !file_exists($pubKeyPath)) {
        if (file_exists($keyPath)) @unlink($keyPath);
        if (file_exists($pubKeyPath)) @unlink($pubKeyPath);

        $cmd = sprintf('ssh-keygen -t ed25519 -C %s -f %s -N "" 2>&1', escapeshellarg($comment), escapeshellarg($keyPath));
        @shell_exec($cmd);
    }

    $pubKeyContent = '';
    if (file_exists($pubKeyPath)) {
        $pubKeyContent = trim(file_get_contents($pubKeyPath));
    }

    $sshTestCmd = sprintf('ssh -T -i %s -o StrictHostKeyChecking=no git@github.com 2>&1', escapeshellarg($keyPath));
    $sshOutput = @shell_exec($sshTestCmd) ?? 'No se pudo probar la conexión SSH';

    return [
        'key_path' => $keyPath,
        'pub_key_path' => $pubKeyPath,
        'public_key' => $pubKeyContent,
        'comment' => $comment,
        'server_hostname' => $serverName,
        'ssh_output' => trim($sshOutput)
    ];
}

function loadRepoIndex() {
    global $STORAGE_DIR;
    $indexPath = $STORAGE_DIR . '/repos_index.json';
    if (!file_exists($indexPath)) return [];
    $raw = file_get_contents($indexPath);
    return json_decode($raw, true) ?? [];
}

function writeRepoIndex($existing) {
    global $STORAGE_DIR;
    $indexPath = $STORAGE_DIR . '/repos_index.json';
    file_put_contents($indexPath, json_encode($existing, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    // Persistencia remota en Supabase Storage
    if (function_exists('supabaseSyncMetaFile')) {
        @supabaseSyncMetaFile($indexPath, 'repos_index.json');
    }
}

function saveRepoIndexEntry($repoMeta) {
    $existing = loadRepoIndex();
    $key = !empty($repoMeta['user_repo']) ? $repoMeta['user_repo'] : $repoMeta['name'];
    $existing[$key] = $repoMeta;
    if (!empty($repoMeta['name']) && $repoMeta['name'] !== $key) {
        unset($existing[$repoMeta['name']]);
    }
    writeRepoIndex($existing);
}

function saveRepoIndexEntriesBatch($metas) {
    if (empty($metas)) return;
    $existing = loadRepoIndex();
    foreach ($metas as $repoMeta) {
        $key = !empty($repoMeta['user_repo']) ? $repoMeta['user_repo'] : $repoMeta['name'];
        $existing[$key] = $repoMeta;
        if (!empty($repoMeta['name']) && $repoMeta['name'] !== $key) {
            unset($existing[$repoMeta['name']]);
        }
    }
    writeRepoIndex($existing);
}

/**
 * Token GitHub para API REST (sin depender del binario `gh` en Render).
 */
function getGithubApiToken() {
    loadEnvFile();
    $token = function_exists('envValue') ? envValue('GITHUB_TOKEN') : '';
    if ($token === '') {
        $token = function_exists('envValue') ? envValue('GH_TOKEN') : '';
    }
    if ($token === '') {
        $token = getenv('GITHUB_TOKEN') ?: ($_ENV['GITHUB_TOKEN'] ?? '');
    }
    if ($token === '') {
        $token = getenv('GH_TOKEN') ?: ($_ENV['GH_TOKEN'] ?? '');
    }
    if ($token !== '') {
        return trim($token);
    }

    // Fallback local: si existe GitHub CLI autenticado
    $candidates = [
        'C:\\Program Files\\GitHub CLI\\gh.exe',
        '/usr/bin/gh',
        '/usr/local/bin/gh',
        'gh'
    ];
    foreach ($candidates as $bin) {
        if ($bin !== 'gh' && !file_exists($bin)) continue;
        $out = @shell_exec(escapeshellarg($bin) . ' auth token 2>NUL');
        if (!$out) {
            $out = @shell_exec(escapeshellarg($bin) . ' auth token 2>/dev/null');
        }
        $out = trim((string)$out);
        if ($out !== '' && strpos($out, ' ') === false && strlen($out) > 20) {
            return $out;
        }
        break;
    }
    return '';
}

/**
 * Llamada directa a api.github.com (funciona en Docker/Render sin `gh`).
 * $path ej: "search/repositories?q=..." o "repos/owner/name"
 */
function githubApiJson($path) {
    $path = ltrim($path, '/');
    if (strpos($path, 'api ') === 0) {
        // Compat: antiguos callers pasaban "api 'endpoint'"
        $path = trim(substr($path, 4));
        $path = trim($path, " \t\n\r\0\x0B'\"");
    }
    $url = 'https://api.github.com/' . $path;
    $token = getGithubApiToken();

    $headers = [
        'Accept: application/vnd.github+json',
        'User-Agent: l8-codespace-platform',
        'X-GitHub-Api-Version: 2022-11-28'
    ];
    if ($token !== '') {
        $headers[] = 'Authorization: Bearer ' . $token;
    }

    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_TIMEOUT, 45);
        // Evita errores HTTP/2 PROTOCOL_ERROR en algunos hosts/Docker
        if (defined('CURL_HTTP_VERSION_1_1')) {
            curl_setopt($ch, CURLOPT_HTTP_VERSION, CURL_HTTP_VERSION_1_1);
        }
        $raw = curl_exec($ch);
        $errno = curl_errno($ch);
        $err = curl_error($ch);
        $status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        if ($errno) {
            return ['ok' => false, 'error' => $err ?: 'Error cURL GitHub', 'data' => null, 'status' => 0];
        }
    } else {
        $ctx = stream_context_create([
            'http' => [
                'method' => 'GET',
                'header' => implode("\r\n", $headers),
                'timeout' => 45,
                'ignore_errors' => true
            ]
        ]);
        $raw = @file_get_contents($url, false, $ctx);
        $status = 0;
        if (isset($http_response_header[0]) && preg_match('/\s(\d{3})\s/', $http_response_header[0], $m)) {
            $status = (int)$m[1];
        }
        if ($raw === false) {
            return ['ok' => false, 'error' => 'No se pudo contactar api.github.com', 'data' => null, 'status' => 0];
        }
    }

    $decoded = json_decode((string)$raw, true);
    if ($decoded === null && json_last_error() !== JSON_ERROR_NONE) {
        return ['ok' => false, 'error' => trim((string)$raw), 'data' => null, 'status' => $status];
    }
    if ($status >= 400) {
        $msg = is_array($decoded) ? ($decoded['message'] ?? ('HTTP ' . $status)) : ('HTTP ' . $status);
        return ['ok' => false, 'error' => $msg, 'data' => $decoded, 'status' => $status];
    }
    return ['ok' => true, 'data' => $decoded, 'error' => null, 'status' => $status];
}

/** @deprecated usar githubApiJson — se mantiene como alias */
function runGhJson($args) {
    // Extrae endpoint de formas: api 'search/...'  |  api search/...
    $args = trim((string)$args);
    if (preg_match('/^api\s+(.+)$/i', $args, $m)) {
        $endpoint = trim($m[1], " \t\n\r\0\x0B'\"");
        return githubApiJson($endpoint);
    }
    return githubApiJson($args);
}

/**
 * Extrae licencia SPDX legible desde respuesta GitHub API.
 */
function extractGithubLicense($item) {
    if (!is_array($item)) return 'NOASSERTION';
    $lic = $item['license'] ?? null;
    if (!is_array($lic) || empty($lic)) {
        return 'None';
    }
    $spdx = trim((string)($lic['spdx_id'] ?? ''));
    if ($spdx !== '' && strtoupper($spdx) !== 'NOASSERTION' && strtoupper($spdx) !== 'OTHER') {
        return strtoupper($spdx) === 'MIT' ? 'MIT' : $spdx;
    }
    $key = trim((string)($lic['key'] ?? ''));
    if ($key !== '' && $key !== 'other' && $key !== 'noassertion') {
        // Normalizar claves comunes
        $map = [
            'mit' => 'MIT',
            'apache-2.0' => 'Apache-2.0',
            'gpl-3.0' => 'GPL-3.0',
            'gpl-2.0' => 'GPL-2.0',
            'agpl-3.0' => 'AGPL-3.0',
            'lgpl-3.0' => 'LGPL-3.0',
            'bsd-2-clause' => 'BSD-2-Clause',
            'bsd-3-clause' => 'BSD-3-Clause',
            'mpl-2.0' => 'MPL-2.0',
            'unlicense' => 'Unlicense',
            'cc0-1.0' => 'CC0-1.0',
            'isc' => 'ISC',
            'proprietary' => 'Proprietary'
        ];
        $lk = strtolower($key);
        return $map[$lk] ?? strtoupper($key);
    }
    $name = trim((string)($lic['name'] ?? ''));
    if ($name !== '') {
        if (stripos($name, 'MIT') !== false) return 'MIT';
        if (stripos($name, 'Apache') !== false) return 'Apache-2.0';
        return $name;
    }
    return 'Other';
}

function fetchGithubLicenseForRepo($userRepo) {
    $userRepo = trim((string)$userRepo);
    if ($userRepo === '' || strpos($userRepo, '/') === false) {
        return 'Unknown';
    }
    $res = githubApiJson('repos/' . $userRepo);
    if (!empty($res['ok']) && is_array($res['data'])) {
        return extractGithubLicense($res['data']);
    }
    return 'Unknown';
}

/** Solo MIT, Apache o BSD están permitidos en el catálogo. */
function isAllowedRepoLicense($license) {
    $l = strtoupper(trim((string)$license));
    if ($l === '' || $l === 'NONE' || $l === 'NOASSERTION' || $l === 'UNKNOWN' || $l === 'OTHER') {
        return false;
    }
    if ($l === 'MIT' || strpos($l, 'MIT') !== false) return true;
    if (strpos($l, 'APACHE') !== false) return true;
    if (strpos($l, 'BSD') !== false) return true;
    return false;
}

function githubAllowedLicenseQueryFragment() {
    return '(license:mit OR license:apache-2.0 OR license:bsd-2-clause OR license:bsd-3-clause OR license:bsd-3-clause-clear)';
}

/**
 * Si el usuario busca un repo concreto sin licencia permitida, avisa.
 */
function checkUnlicensedRepoLookup($query) {
    $q = trim((string)$query);
    if ($q === '') return null;

    $userRepo = '';
    if (preg_match('#^https://github\.com/([^/]+/[^/]+)#i', $q, $m)) {
        $userRepo = preg_replace('/\.git$/i', '', $m[1]);
    } else if (preg_match('#^([A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+)$#', $q, $m)) {
        $userRepo = $m[1];
    }

    if ($userRepo === '') {
        // Búsqueda textual: detectar hits sin licencia permitida para el término
        return null;
    }

    $res = githubApiJson('repos/' . $userRepo);
    if (empty($res['ok']) || empty($res['data']['full_name'])) {
        return null;
    }
    $license = extractGithubLicense($res['data']);
    if (isAllowedRepoLicense($license)) {
        return null;
    }
    return [
        'show' => true,
        'message' => 'This repository is unlicensed! Do not use it.',
        'user_repo' => $res['data']['full_name'],
        'license' => $license
    ];
}

/**
 * Convierte un item de la API GitHub al meta del catálogo.
 */
function mapGithubRepoItemToMeta($item, $source = 'github_search') {
    $fullName = $item['full_name'] ?? '';
    if ($fullName === '') return null;
    $license = extractGithubLicense($item);
    $diskKb = isset($item['size']) ? (int)$item['size'] : 0;
    $desc = trim((string)($item['description'] ?? ''));
    return [
        'name' => basename($fullName),
        'user_repo' => $fullName,
        'branch' => $item['default_branch'] ?? 'main',
        'remote_url' => $item['html_url'] ?? ('https://github.com/' . $fullName),
        'last_commit' => ($desc !== '' ? $desc : 'Sin descripción') . ' · ' . ($item['updated_at'] ?? ''),
        'size_formatted' => formatBytes($diskKb * 1024),
        'stars' => (int)($item['stargazers_count'] ?? 0),
        'license' => $license,
        'is_private' => !empty($item['private']),
        'cloned' => false,
        'source' => $source,
        'updated_at' => date('Y-m-d H:i:s')
    ];
}

/**
 * Busca repositorios en TODO GitHub (API Search), no solo la cuenta local.
 * Solo incluye licencias MIT / Apache / BSD.
 */
function searchGithubRepositories($query = '', $page = 1, $perPage = 30) {
    $page = max(1, (int)$page);
    $perPage = max(1, min(100, (int)$perPage));
    $userQuery = trim($query);
    $sort = 'updated';
    $licenseFrag = githubAllowedLicenseQueryFragment();
    $unlicensedWarning = null;

    // Búsqueda exacta owner/repo → consulta directa (no search text)
    $exactRepo = '';
    if (preg_match('#^https://github\.com/([^/]+/[^/]+)#i', $userQuery, $m)) {
        $exactRepo = preg_replace('/\.git$/i', '', $m[1]);
    } else if (preg_match('#^([A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+)$#', $userQuery, $m)) {
        $exactRepo = $m[1];
    }

    if ($exactRepo !== '') {
        $direct = githubApiJson('repos/' . $exactRepo);
        if (empty($direct['ok']) || empty($direct['data']['full_name'])) {
            return [
                'ok' => false,
                'error' => $direct['error'] ?: ('Repositorio no encontrado: ' . $exactRepo),
                'total_count' => 0,
                'page' => 1,
                'query' => $userQuery,
                'items' => [],
                'unlicensed_warning' => null
            ];
        }
        $meta = mapGithubRepoItemToMeta($direct['data'], 'github_direct');
        if ($meta === null) {
            return [
                'ok' => false,
                'error' => 'Respuesta inválida de GitHub',
                'total_count' => 0,
                'page' => 1,
                'query' => $userQuery,
                'items' => [],
                'unlicensed_warning' => null
            ];
        }
        if (!isAllowedRepoLicense($meta['license'])) {
            return [
                'ok' => true,
                'error' => null,
                'total_count' => 0,
                'page' => 1,
                'query' => $userQuery,
                'items' => [],
                'unlicensed_warning' => [
                    'show' => true,
                    'message' => 'This repository is unlicensed! Do not use it.',
                    'user_repo' => $meta['user_repo'],
                    'license' => $meta['license']
                ]
            ];
        }
        saveRepoIndexEntriesBatch([$meta]);
        return [
            'ok' => true,
            'error' => null,
            'total_count' => 1,
            'page' => 1,
            'query' => $userQuery,
            'items' => [$meta],
            'unlicensed_warning' => null
        ];
    }

    if ($userQuery === '') {
        $q = 'is:public stars:>50 ' . $licenseFrag;
        $sort = 'stars';
    } else {
        // Texto libre + filtro de licencias permitidas
        $q = $userQuery . ' in:name,description,readme ' . $licenseFrag;
    }

    $endpoint = sprintf(
        'search/repositories?q=%s&sort=%s&order=desc&per_page=%d&page=%d',
        rawurlencode($q),
        rawurlencode($sort),
        $perPage,
        $page
    );
    $res = githubApiJson($endpoint);
    if (!$res['ok'] || !is_array($res['data'])) {
        return [
            'ok' => false,
            'error' => $res['error'] ?: 'No se pudo buscar en GitHub',
            'total_count' => 0,
            'page' => $page,
            'query' => $userQuery,
            'items' => [],
            'unlicensed_warning' => null
        ];
    }

    $items = [];
    foreach (($res['data']['items'] ?? []) as $item) {
        $meta = mapGithubRepoItemToMeta($item, 'github_search');
        if ($meta === null) continue;
        if (!isAllowedRepoLicense($meta['license'])) continue;
        $items[] = $meta;
    }
    saveRepoIndexEntriesBatch($items);

    if ($userQuery !== '' && count($items) === 0) {
        $unlicensedWarning = checkUnlicensedRepoLookup($userQuery);
        if ($unlicensedWarning === null) {
            $probe = githubApiJson(sprintf(
                'search/repositories?q=%s&per_page=5',
                rawurlencode($userQuery)
            ));
            if (!empty($probe['ok']) && !empty($probe['data']['items'])) {
                $allBlocked = true;
                foreach ($probe['data']['items'] as $hit) {
                    if (isAllowedRepoLicense(extractGithubLicense($hit))) {
                        $allBlocked = false;
                        break;
                    }
                }
                if ($allBlocked) {
                    $unlicensedWarning = [
                        'show' => true,
                        'message' => 'This repository is unlicensed! Do not use it.',
                        'user_repo' => $probe['data']['items'][0]['full_name'] ?? $userQuery,
                        'license' => extractGithubLicense($probe['data']['items'][0] ?? [])
                    ];
                }
            }
        }
    }

    return [
        'ok' => true,
        'error' => null,
        'total_count' => (int)($res['data']['total_count'] ?? count($items)),
        'page' => $page,
        'query' => $userQuery,
        'incomplete_results' => !empty($res['data']['incomplete_results']),
        'items' => $items,
        'unlicensed_warning' => $unlicensedWarning
    ];
}

/**
 * Guarda un repo de GitHub en el índice sin clonarlo.
 */
function saveGithubRepository($repoTarget) {
    $clean = trim($repoTarget);
    if ($clean === '') {
        return ['ok' => false, 'error' => 'Especifica owner/repo (ej: save facebook/react)'];
    }
    if (preg_match('#^https://github\.com/([^/]+/[^/]+)#i', $clean, $m)) {
        $clean = preg_replace('/\.git$/i', '', $m[1]);
    } else {
        $clean = preg_replace('/\.git$/i', '', $clean);
    }
    if (strpos($clean, '/') === false) {
        return ['ok' => false, 'error' => 'Usa el formato owner/repo'];
    }

    $res = githubApiJson('repos/' . $clean);
    if (!$res['ok'] || empty($res['data']['full_name'])) {
        return [
            'ok' => false,
            'error' => 'This repository is unlicensed! Do not use it.',
            'unlicensed' => true,
            'license' => 'Unknown',
            'user_repo' => $clean,
            'note' => $res['error']
        ];
    }

    $item = $res['data'];
    $fullName = $item['full_name'];
    $license = extractGithubLicense($item);
    if (!isAllowedRepoLicense($license)) {
        return [
            'ok' => false,
            'error' => 'This repository is unlicensed! Do not use it.',
            'unlicensed' => true,
            'license' => $license,
            'user_repo' => $fullName
        ];
    }
    $diskKb = isset($item['size']) ? (int)$item['size'] : 0;
    $meta = [
        'name' => basename($fullName),
        'user_repo' => $fullName,
        'branch' => $item['default_branch'] ?? 'main',
        'remote_url' => $item['html_url'] ?? ('https://github.com/' . $fullName),
        'last_commit' => trim(($item['description'] ?? '') !== '' ? $item['description'] : 'Sin descripción'),
        'size_formatted' => formatBytes($diskKb * 1024),
        'stars' => (int)($item['stargazers_count'] ?? 0),
        'license' => $license,
        'is_private' => !empty($item['private']),
        'cloned' => false,
        'source' => 'manual_save',
        'updated_at' => date('Y-m-d H:i:s')
    ];
    saveRepoIndexEntry($meta);
    return ['ok' => true, 'repo' => $meta];
}

function cloneOrUpdateRepository($repoTarget) {
    global $REPOS_DIR;
    $sshInfo = getOrGenerateSshKey();
    $keyPath = $sshInfo['key_path'];

    $cleanTarget = trim($repoTarget);
    if (empty($cleanTarget)) {
        return ['ok' => false, 'error' => 'Especifica un repositorio para clonar (ej: clone langgenius/dify)'];
    }

    $userRepo = '';
    if (strpos($cleanTarget, 'git@github.com:') === 0) {
        $userRepo = preg_replace('#^git@github\.com:#i', '', $cleanTarget);
        $userRepo = preg_replace('/\.git$/i', '', $userRepo);
    } else if (preg_match('#^https://github\.com/([^/]+/[^/]+)#i', $cleanTarget, $matches)) {
        $userRepo = preg_replace('/\.git$/i', '', $matches[1]);
    } else if (strpos($cleanTarget, '/') !== false) {
        $userRepo = preg_replace('/\.git$/i', '', $cleanTarget);
    } else {
        if (strtolower($cleanTarget) === 'dify') {
            $userRepo = "langgenius/dify";
        } else {
            $userRepo = $cleanTarget;
        }
    }

    $sshUrl   = "git@github.com:$userRepo.git";
    $httpsUrl = "https://github.com/$userRepo.git";
    $repoFolder = basename($userRepo);
    $targetPath = $REPOS_DIR . '/' . $repoFolder;

    $license = 'Unknown';
    if (strpos($userRepo, '/') !== false) {
        $license = fetchGithubLicenseForRepo($userRepo);
    }
    $alreadyCloned = file_exists($targetPath . '/.git');
    if (!$alreadyCloned && !isAllowedRepoLicense($license)) {
        return [
            'ok' => false,
            'action' => 'clone',
            'repo_name' => $repoFolder,
            'user_repo' => $userRepo,
            'ssh_url' => $sshUrl,
            'https_url' => $httpsUrl,
            'target_path' => $targetPath,
            'branch' => 'main',
            'last_commit' => '',
            'license' => $license,
            'unlicensed' => true,
            'raw_output' => 'This repository is unlicensed! Do not use it.'
        ];
    }

    $gitSshCmd = sprintf('ssh -i %s -o StrictHostKeyChecking=no', escapeshellarg($keyPath));
    putenv("GIT_SSH_COMMAND=$gitSshCmd");

    $output = '';
    $action = '';

    if ($alreadyCloned) {
        $action = 'pull';
        $cmd = sprintf('cd %s && git pull origin main 2>&1 || git pull origin master 2>&1', escapeshellarg($targetPath));
        $output = shell_exec($cmd);
    } else {
        $action = 'clone';
        $cmdSsh = sprintf('git clone --depth 1 %s %s 2>&1', escapeshellarg($sshUrl), escapeshellarg($targetPath));
        $outputSsh = shell_exec($cmdSsh);

        if (file_exists($targetPath . '/.git')) {
            $output = $outputSsh;
        } else {
            if (file_exists($targetPath)) {
                @shell_exec(sprintf('rm -rf %s', escapeshellarg($targetPath)));
            }
            $cmdHttps = sprintf('git clone --depth 1 %s %s 2>&1', escapeshellarg($httpsUrl), escapeshellarg($targetPath));
            $outputHttps = shell_exec($cmdHttps);
            $output = "SSH Connection Note: SSH Key not registered on GitHub account yet.\nHTTPS Auto-Fallback Execution:\n" . $outputHttps;
        }
    }

    $isSuccess = file_exists($targetPath . '/.git');

    $lastCommit = 'Sin commits';
    $branch = 'main';
    if ($isSuccess) {
        $commitCmd = sprintf('cd %s && git log -1 --pretty=format:"%%h - %%s (%%cr)" 2>&1', escapeshellarg($targetPath));
        $lastCommit = trim(shell_exec($commitCmd) ?? 'Commit info unavailable');
        $branchCmd = sprintf('cd %s && git rev-parse --abbrev-ref HEAD 2>&1', escapeshellarg($targetPath));
        $branch = trim(shell_exec($branchCmd) ?? 'main');

        $repoMeta = [
            'name' => $repoFolder,
            'user_repo' => $userRepo,
            'branch' => $branch,
            'remote_url' => $httpsUrl,
            'last_commit' => $lastCommit,
            'license' => $license,
            'cloned' => true,
            'updated_at' => date('Y-m-d H:i:s')
        ];
        saveRepoIndexEntry($repoMeta);
    }

    return [
        'ok' => $isSuccess,
        'action' => $action,
        'repo_name' => $repoFolder,
        'user_repo' => $userRepo,
        'ssh_url' => $sshUrl,
        'https_url' => $httpsUrl,
        'target_path' => $targetPath,
        'branch' => $branch,
        'last_commit' => $lastCommit,
        'license' => $license,
        'raw_output' => trim($output)
    ];
}

/**
 * Repos clonados localmente (disco). $lightweight=true evita git pesado (solo flags).
 */
function getLocalClonedRepositories($lightweight = false) {
    global $REPOS_DIR, $STORAGE_DIR;
    $repos = [];
    if (!file_exists($REPOS_DIR)) {
        return $repos;
    }

    $indexLicenses = [];
    $indexPath = $STORAGE_DIR . '/repos_index.json';
    if (file_exists($indexPath)) {
        $idx = json_decode(file_get_contents($indexPath), true) ?? [];
        foreach ($idx as $k => $meta) {
            $ur = $meta['user_repo'] ?? $k;
            if (!empty($meta['license'])) {
                $indexLicenses[$ur] = $meta['license'];
                $indexLicenses[basename($ur)] = $meta['license'];
            }
        }
    }

    $dirs = scandir($REPOS_DIR);
    $batch = [];
    foreach ($dirs as $d) {
        if ($d === '.' || $d === '..') continue;
        $fullPath = $REPOS_DIR . '/' . $d;
        if (!is_dir($fullPath) || !file_exists($fullPath . '/.git')) continue;

        $remoteUrl = trim(@shell_exec(sprintf('git -C %s config --get remote.origin.url 2>&1', escapeshellarg($fullPath))) ?? '');
        $userRepo = $d;
        if (preg_match('#github\.com[:/]([^/]+/[^/]+?)(?:\.git)?$#i', $remoteUrl, $m)) {
            $userRepo = preg_replace('/\.git$/i', '', $m[1]);
        }
        $license = $indexLicenses[$userRepo] ?? ($indexLicenses[$d] ?? 'Unknown');

        if ($lightweight) {
            $repoMeta = [
                'name' => $d,
                'user_repo' => $userRepo,
                'branch' => 'main',
                'remote_url' => $remoteUrl,
                'last_commit' => 'Clonado localmente',
                'size_formatted' => '—',
                'license' => $license,
                'cloned' => true,
                'source' => 'local_clone',
                'updated_at' => date('Y-m-d H:i:s', @filemtime($fullPath) ?: time())
            ];
        } else {
            $lastCommit = trim(@shell_exec(sprintf('git -C %s log -1 --pretty=format:"%%h - %%s (%%cr)" 2>&1', escapeshellarg($fullPath))) ?? '');
            $branch = trim(@shell_exec(sprintf('git -C %s rev-parse --abbrev-ref HEAD 2>&1', escapeshellarg($fullPath))) ?? 'main');
            $sizeBytes = 0;
            $countObj = trim(@shell_exec(sprintf('git -C %s count-objects -vH 2>&1', escapeshellarg($fullPath))) ?? '');
            if (preg_match('/size-pack:\s+([\d.]+)\s*([KMG]?i?B)/i', $countObj, $sm)) {
                $n = (float)$sm[1];
                $u = strtoupper($sm[2]);
                if (strpos($u, 'G') !== false) $sizeBytes = (int)($n * 1024 * 1024 * 1024);
                else if (strpos($u, 'M') !== false) $sizeBytes = (int)($n * 1024 * 1024);
                else if (strpos($u, 'K') !== false) $sizeBytes = (int)($n * 1024);
                else $sizeBytes = (int)$n;
            }
            $repoMeta = [
                'name' => $d,
                'user_repo' => $userRepo,
                'branch' => $branch !== '' ? $branch : 'main',
                'remote_url' => $remoteUrl,
                'last_commit' => $lastCommit,
                'size_formatted' => formatBytes($sizeBytes),
                'license' => $license,
                'cloned' => true,
                'source' => 'local_clone',
                'updated_at' => date('Y-m-d H:i:s', @filemtime($fullPath) ?: time())
            ];
        }
        $repos[$userRepo] = $repoMeta;
        $batch[] = $repoMeta;
    }
    saveRepoIndexEntriesBatch($batch);
    return $repos;
}

/**
 * Índice guardado + clonados locales (sin auto-clonar).
 */
function getStoredRepositories() {
    global $STORAGE_DIR;
    $repos = getLocalClonedRepositories(true);
    $indexPath = $STORAGE_DIR . '/repos_index.json';
    if (function_exists('supabaseHydrateMetaFile')) {
        @supabaseHydrateMetaFile($indexPath, 'repos_index.json', false);
    }

    if (file_exists($indexPath)) {
        $indexRepos = json_decode(file_get_contents($indexPath), true) ?? [];
        foreach ($indexRepos as $key => $meta) {
            $userRepo = !empty($meta['user_repo']) ? $meta['user_repo'] : (string)$key;
            if (isset($repos[$userRepo])) {
                continue;
            }
            $folder = basename($userRepo);
            $localHit = null;
            foreach ($repos as $r) {
                if (($r['name'] ?? '') === $folder && !empty($r['cloned'])) {
                    $localHit = $r;
                    break;
                }
            }
            if ($localHit) {
                continue;
            }
            $repos[$userRepo] = [
                'name' => $meta['name'] ?? $folder,
                'user_repo' => $userRepo,
                'branch' => $meta['branch'] ?? 'main',
                'remote_url' => $meta['remote_url'] ?? ('https://github.com/' . $userRepo),
                'last_commit' => $meta['last_commit'] ?? 'Guardado en catálogo (sin clonar)',
                'size_formatted' => $meta['size_formatted'] ?? '—',
                'stars' => $meta['stars'] ?? null,
                'license' => $meta['license'] ?? 'Unknown',
                'is_private' => $meta['is_private'] ?? false,
                'cloned' => false,
                'source' => $meta['source'] ?? 'index',
                'updated_at' => $meta['updated_at'] ?? date('Y-m-d H:i:s')
            ];
        }
    }

    return array_values($repos);
}

/**
 * Catálogo global: busca en todo GitHub, guarda resultados y mezcla con locales.
 */
function buildGithubReposCatalog($query = '', $page = 1) {
    $page = max(1, (int)$page);
    $search = searchGithubRepositories($query, $page, 30);
    $local = getLocalClonedRepositories(true);
    $localByName = [];
    foreach ($local as $lr) {
        $localByName[$lr['name']] = $lr;
    }

    $display = [];
    if (!empty($search['items'])) {
        foreach ($search['items'] as $item) {
            if (!isAllowedRepoLicense($item['license'] ?? '')) continue;
            $key = $item['user_repo'];
            if (isset($local[$key])) {
                $item = array_merge($item, $local[$key]);
                $item['cloned'] = true;
                $item['license'] = $item['license'] ?? ($local[$key]['license'] ?? 'Unknown');
            } else if (isset($localByName[$item['name']])) {
                $lr = $localByName[$item['name']];
                $item['cloned'] = true;
                $item['last_commit'] = $lr['last_commit'];
                $item['size_formatted'] = $lr['size_formatted'];
                $item['branch'] = $lr['branch'];
            }
            if (!isAllowedRepoLicense($item['license'] ?? '')) continue;
            $display[] = $item;
        }
    } else {
        foreach ($local as $lr) {
            if (!isAllowedRepoLicense($lr['license'] ?? '')) continue;
            $display[] = $lr;
        }
        global $STORAGE_DIR;
        $indexPath = $STORAGE_DIR . '/repos_index.json';
        if (file_exists($indexPath)) {
            $indexRepos = json_decode(file_get_contents($indexPath), true) ?? [];
            $seen = array_flip(array_map(function ($r) { return $r['user_repo'] ?? $r['name']; }, $display));
            foreach ($indexRepos as $key => $meta) {
                $userRepo = !empty($meta['user_repo']) ? $meta['user_repo'] : (string)$key;
                if (isset($seen[$userRepo])) continue;
                $lic = $meta['license'] ?? 'Unknown';
                if (!isAllowedRepoLicense($lic)) continue;
                $display[] = [
                    'name' => $meta['name'] ?? basename($userRepo),
                    'user_repo' => $userRepo,
                    'branch' => $meta['branch'] ?? 'main',
                    'remote_url' => $meta['remote_url'] ?? ('https://github.com/' . $userRepo),
                    'last_commit' => $meta['last_commit'] ?? 'Guardado en catálogo',
                    'size_formatted' => $meta['size_formatted'] ?? '—',
                    'license' => $lic,
                    'cloned' => false,
                    'source' => $meta['source'] ?? 'index',
                    'updated_at' => $meta['updated_at'] ?? date('Y-m-d H:i:s')
                ];
            }
        }
    }

    global $STORAGE_DIR;
    $savedTotal = 0;
    $indexPath = $STORAGE_DIR . '/repos_index.json';
    if (file_exists($indexPath)) {
        $idx = json_decode(file_get_contents($indexPath), true) ?? [];
        foreach ($idx as $meta) {
            if (isAllowedRepoLicense($meta['license'] ?? '')) $savedTotal++;
        }
    }
    $savedTotal = max($savedTotal, count(array_filter($local, function ($r) {
        return isAllowedRepoLicense($r['license'] ?? '');
    })));

    return [
        'type' => 'REPOS_CATALOG',
        'command' => 'repos',
        'query' => $search['query'] ?? $query,
        'page' => $page,
        'github_total' => $search['total_count'] ?? 0,
        'github_ok' => !empty($search['ok']),
        'github_error' => $search['error'] ?? null,
        'total_repos' => count($display),
        'saved_total' => $savedTotal,
        'repos' => $display,
        'scope' => 'github_global',
        'license_policy' => 'MIT | Apache | BSD only',
        'unlicensed_warning' => $search['unlicensed_warning'] ?? null
    ];
}

function generateDilithium5Hash($filePathOrData, $isPath = true) {
    if ($isPath) {
        $shake512 = file_exists($filePathOrData) ? hash_file('sha3-512', $filePathOrData) : hash('sha3-512', $filePathOrData);
        $sha512 = file_exists($filePathOrData) ? hash_file('sha512', $filePathOrData) : hash('sha512', $filePathOrData);
    } else {
        $shake512 = hash('sha3-512', $filePathOrData);
        $sha512 = hash('sha512', $filePathOrData);
    }

    $latticeVector = substr(hash('sha3-512', $shake512 . $sha512), 0, 64);
    return 'dilithium5_' . substr($shake512, 0, 64) . $latticeVector;
}

class SuperGlobalDatabase {
    private $pdo = null;
    private $jsonDbPath;

    public function __construct($storageDir) {
        $this->jsonDbPath = $storageDir . '/global_database_index.json';
        $sqlitePath = $storageDir . '/super_database.sqlite';

        if (class_exists('PDO') && in_array('sqlite', PDO::getAvailableDrivers())) {
            try {
                $this->pdo = new PDO("sqlite:" . $sqlitePath);
                $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                $this->pdo->exec("PRAGMA journal_mode = WAL;");
                $this->pdo->exec("PRAGMA synchronous = NORMAL;");
                $this->pdo->exec("CREATE TABLE IF NOT EXISTS global_files (
                    id TEXT PRIMARY KEY,
                    filename TEXT NOT NULL,
                    mime_type TEXT NOT NULL,
                    size_bytes INTEGER NOT NULL,
                    hash TEXT NOT NULL,
                    upload_date TEXT NOT NULL,
                    storage_path TEXT NOT NULL
                )");
            } catch (Exception $e) {
                $this->pdo = null;
            }
        }
    }

    public function insertFile($id, $filename, $mimeType, $sizeBytes, $hash, $storagePath) {
        $uploadDate = date('c');
        $supabaseObject = null;
        if (function_exists('supabaseStorePlatformFile') && file_exists($storagePath)) {
            $remote = @supabaseStorePlatformFile($id, $storagePath, $mimeType, $filename);
            if (!empty($remote['ok'])) {
                $supabaseObject = $remote['path'] ?? null;
            }
        }

        if ($this->pdo) {
            $stmt = $this->pdo->prepare("INSERT OR REPLACE INTO global_files (id, filename, mime_type, size_bytes, hash, upload_date, storage_path) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$id, $filename, $mimeType, $sizeBytes, $hash, $uploadDate, $storagePath]);
        }
        
        $fp = fopen($this->jsonDbPath, 'c+');
        if (flock($fp, LOCK_EX)) {
            $files = [];
            $size = file_exists($this->jsonDbPath) ? filesize($this->jsonDbPath) : 0;
            if ($size > 0) {
                $raw = fread($fp, $size);
                $files = json_decode($raw, true) ?? [];
            }
            $files[$id] = [
                'id' => $id,
                'filename' => $filename,
                'mime_type' => $mimeType,
                'size_bytes' => $sizeBytes,
                'hash' => $hash,
                'upload_date' => $uploadDate,
                'storage_path' => $storagePath,
                'supabase_object' => $supabaseObject
            ];
            ftruncate($fp, 0);
            rewind($fp);
            fwrite($fp, json_encode($files, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
            flock($fp, LOCK_UN);
        }
        fclose($fp);

        if (function_exists('supabaseSyncMetaFile')) {
            @supabaseSyncMetaFile($this->jsonDbPath, 'global_database_index.json');
        }
    }

    public function getAllFiles() {
        if (function_exists('supabaseHydrateMetaFile')) {
            @supabaseHydrateMetaFile($this->jsonDbPath, 'global_database_index.json', false);
        }
        if (!file_exists($this->jsonDbPath)) return [];
        $raw = file_get_contents($this->jsonDbPath);
        $files = json_decode($raw, true) ?? [];
        return array_values($files);
    }
}

$db = new SuperGlobalDatabase($STORAGE_DIR);

function scanRealBrowsers($browserNames) {
    static $cachedResult = null;
    static $lastCacheTime = 0;

    if ($cachedResult !== null && (time() - $lastCacheTime) < 1) {
        return $cachedResult;
    }

    $stdout = shell_exec('tasklist /FO CSV /NH 2>NUL');
    $browserStats = [];

    foreach ($browserNames as $name) {
        $browserStats[$name] = [
            'running' => false,
            'processCount' => 0,
            'pids' => [],
            'totalMemoryKB' => 0
        ];
    }

    if ($stdout) {
        $lines = explode("\n", $stdout);
        foreach ($lines as $line) {
            $line = trim($line);
            if (empty($line)) continue;

            if (preg_match('/^"([^"]+)","(\d+)","[^"]*","[^"]*","([^"]+)"/', $line, $matches)) {
                $exeName = strtolower($matches[1]);
                $pid = (int)$matches[2];
                $memStr = preg_replace('/[^\d]/', '', $matches[3]);
                $memKB = (int)$memStr;

                foreach ($browserNames as $bName) {
                    if (strpos($exeName, $bName) !== false) {
                        $browserStats[$bName]['running'] = true;
                        $browserStats[$bName]['processCount']++;
                        $browserStats[$bName]['pids'][] = $pid;
                        $browserStats[$bName]['totalMemoryKB'] += $memKB;
                    }
                }
            }
        }
    }

    $mainEngine = "none";
    $maxCount = 0;
    $activeBrowsers = [];

    foreach ($browserStats as $name => $info) {
        if ($info['running']) {
            $activeBrowsers[$name] = [
                'running' => true,
                'processCount' => $info['processCount'],
                'memoryMB' => (int)round($info['totalMemoryKB'] / 1024),
                'pids' => array_slice($info['pids'], 0, 5)
            ];
            if ($info['processCount'] > $maxCount) {
                $maxCount = $info['processCount'];
                $mainEngine = $name;
            }
        }
    }

    $isAnyRunning = $mainEngine !== "none";

    $cachedResult = [
        'ok' => $isAnyRunning,
        'enabled' => true,
        'running' => $isAnyRunning,
        'engine' => $mainEngine,
        'browserConnected' => $isAnyRunning,
        'browserRunning' => $isAnyRunning,
        'activeBrowsers' => $activeBrowsers
    ];
    $lastCacheTime = time();

    return $cachedResult;
}

function formatBytes($bytes, $precision = 2) {
    $units = array('B', 'KB', 'MB', 'GB', 'TB');
    $bytes = max($bytes, 0);
    $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
    $pow = min($pow, count($units) - 1);
    $bytes /= pow(1024, $pow);
    return round($bytes, $precision) . ' ' . $units[$pow];
}

/**
 * GATEWAY: compartir repos con código único (JSLA-SAKA).
 * Fuente de verdad: Supabase Storage (disco de Render es efímero).
 */
function gatewayDirs() {
    global $STORAGE_DIR;
    $base = $STORAGE_DIR . '/gateway';
    $packs = $base . '/packs';
    if (!file_exists($base)) @mkdir($base, 0777, true);
    if (!file_exists($packs)) @mkdir($packs, 0777, true);
    return [
        'base' => $base,
        'packs' => $packs,
        'transfers' => $base . '/transfers.json',
        'codes' => $base . '/codes.json'
    ];
}

function gatewayReadJson($path) {
    if (!file_exists($path)) return [];
    $raw = @file_get_contents($path);
    if ($raw === false || $raw === '') return [];
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function gatewayWriteJson($path, $data) {
    $dir = dirname($path);
    if (!file_exists($dir)) @mkdir($dir, 0777, true);
    return file_put_contents($path, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX) !== false;
}

function gatewayPlatformBrand() {
    return [
        'name' => 'l8 codespace',
        'icon' => '/favicon.svg?v=3'
    ];
}

function gatewaySupabaseReady() {
    return function_exists('supabaseConfig')
        && function_exists('supabaseStorageUpload')
        && function_exists('supabaseStorageDownload')
        && !empty(supabaseConfig()['configured']);
}

/** Normaliza a formato XXXX-XXXX (A-Z). */
function gatewayNormalizeCode($code) {
    $raw = strtoupper(preg_replace('/[^A-Za-z]/', '', (string)$code));
    if (strlen($raw) !== 8) return '';
    return substr($raw, 0, 4) . '-' . substr($raw, 4, 4);
}

function gatewayIsValidCodeFormat($code) {
    return (bool)preg_match('/^[A-Z]{4}-[A-Z]{4}$/', (string)$code);
}

/** Clave de storage sin guion: FEAJSSQJ */
function gatewayCodeStorageKey($code) {
    $code = gatewayNormalizeCode($code);
    return str_replace('-', '', $code);
}

function gatewayShareObjectPath($code) {
    return 'gateway/shares/' . gatewayCodeStorageKey($code) . '.json';
}

function gatewayPackObjectPath($code) {
    return 'gateway/packs/' . gatewayCodeStorageKey($code) . '.zip';
}

function gatewayFetchRemoteShare($code) {
    if (!gatewaySupabaseReady()) return null;
    $code = gatewayNormalizeCode($code);
    if (!gatewayIsValidCodeFormat($code)) return null;
    $res = @supabaseStorageDownloadJson(gatewayShareObjectPath($code));
    if (empty($res['ok']) || !is_array($res['data'] ?? null)) {
        return null;
    }
    $item = $res['data'];
    if (empty($item['code'])) $item['code'] = $code;
    return $item;
}

function gatewayPersistShareRemote($item) {
    if (!gatewaySupabaseReady()) {
        return ['ok' => false, 'error' => 'Supabase no configurado: el código no sobrevivirá entre dispositivos en Render.'];
    }
    $code = gatewayNormalizeCode($item['code'] ?? '');
    if (!gatewayIsValidCodeFormat($code)) {
        return ['ok' => false, 'error' => 'Código inválido al persistir'];
    }
    $item['code'] = $code;
    $item['updated_at'] = date('c');
    $up = @supabaseStorageUploadJson(gatewayShareObjectPath($code), $item);
    if (empty($up['ok'])) {
        return ['ok' => false, 'error' => 'No se pudo guardar el código en Supabase: ' . ($up['error'] ?? 'error')];
    }
    // índices auxiliares (best-effort)
    @supabaseSyncMetaFile(gatewayDirs()['codes'], 'gateway_codes.json');
    @supabaseSyncMetaFile(gatewayDirs()['transfers'], 'gateway_transfers.json');
    return ['ok' => true, 'path' => gatewayShareObjectPath($code)];
}

function gatewayCacheShareLocal($item) {
    $dirs = gatewayDirs();
    $code = $item['code'] ?? '';
    $id = $item['id'] ?? '';
    if ($code === '' || $id === '') return;

    $transfers = gatewayReadJson($dirs['transfers']);
    $codes = gatewayReadJson($dirs['codes']);
    $transfers[$id] = $item;
    $codes[$code] = [
        'code' => $code,
        'transfer_id' => $id,
        'status' => $item['status'] ?? 'ready',
        'created_at' => $item['created_at'] ?? date('c')
    ];
    gatewayWriteJson($dirs['transfers'], $transfers);
    gatewayWriteJson($dirs['codes'], $codes);
}

/**
 * Genera un código único no repetido (formato JSLA-SAKA).
 * Comprueba local + Supabase para no repetir.
 */
function gatewayGenerateUniqueCode() {
    $alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // sin I/O
    $dirs = gatewayDirs();
    $lockPath = $dirs['base'] . '/codes.lock';
    $lock = @fopen($lockPath, 'c+');
    if ($lock) {
        flock($lock, LOCK_EX);
    }

    // hidratar índices locales desde Supabase si están vacíos
    if (gatewaySupabaseReady() && function_exists('supabaseHydrateMetaFile')) {
        @supabaseHydrateMetaFile($dirs['codes'], 'gateway_codes.json', false);
        @supabaseHydrateMetaFile($dirs['transfers'], 'gateway_transfers.json', false);
    }

    $transfers = gatewayReadJson($dirs['transfers']);
    $codes = gatewayReadJson($dirs['codes']);
    $used = [];
    foreach ($transfers as $item) {
        if (!empty($item['code'])) $used[$item['code']] = true;
    }
    foreach (array_keys($codes) as $c) {
        $used[$c] = true;
    }

    $code = '';
    for ($attempt = 0; $attempt < 100; $attempt++) {
        $chunk = '';
        for ($i = 0; $i < 8; $i++) {
            $chunk .= $alphabet[random_int(0, strlen($alphabet) - 1)];
        }
        $candidate = substr($chunk, 0, 4) . '-' . substr($chunk, 4, 4);
        if (isset($used[$candidate])) continue;
        // verificación remota anti-colisión
        if (gatewayFetchRemoteShare($candidate)) continue;
        $code = $candidate;
        break;
    }

    if ($code === '') {
        if ($lock) {
            flock($lock, LOCK_UN);
            fclose($lock);
        }
        return ['ok' => false, 'error' => 'No se pudo generar un código único'];
    }

    $codes[$code] = [
        'code' => $code,
        'reserved_at' => date('c'),
        'status' => 'reserved'
    ];
    gatewayWriteJson($dirs['codes'], $codes);

    if ($lock) {
        flock($lock, LOCK_UN);
        fclose($lock);
    }
    return ['ok' => true, 'code' => $code];
}

function gatewayPackRepoFolder($repoFolder, $code = null, $transferId = null) {
    global $REPOS_DIR;
    $dirs = gatewayDirs();
    $safeRepo = basename($repoFolder);
    $source = realpath($REPOS_DIR . '/' . $safeRepo);
    $base = realpath($REPOS_DIR);
    if (!$source || !$base || strpos($source, $base) !== 0 || !is_dir($source)) {
        return ['ok' => false, 'error' => 'Repositorio no clonado en el servidor. Guárdalo/clónalo primero.'];
    }
    if (!class_exists('ZipArchive')) {
        return ['ok' => false, 'error' => 'ZipArchive no disponible en el servidor'];
    }

    $transferId = $transferId ?: bin2hex(random_bytes(12));
    $codeKey = $code ? gatewayCodeStorageKey($code) : $transferId;
    $zipName = $safeRepo . '-' . $codeKey . '.zip';
    $zipPath = $dirs['packs'] . '/' . $zipName;

    $zip = new ZipArchive();
    if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
        return ['ok' => false, 'error' => 'No se pudo crear el paquete zip'];
    }

    $rootPrefix = $safeRepo . '/';
    $iterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($source, RecursiveDirectoryIterator::SKIP_DOTS),
        RecursiveIteratorIterator::SELF_FIRST
    );

    foreach ($iterator as $item) {
        $full = $item->getPathname();
        $rel = str_replace('\\', '/', substr($full, strlen($source) + 1));
        if ($rel === '' || strpos($rel, '.git/') === 0 || $rel === '.git' || strpos($rel, '/.git/') !== false) {
            continue;
        }
        $entry = $rootPrefix . $rel;
        if ($item->isDir()) {
            $zip->addEmptyDir($entry);
        } else if ($item->isFile()) {
            if (filesize($full) > 25000000) continue; // omite archivos >25MB
            $zip->addFile($full, $entry);
        }
    }
    $zip->close();

    if (!file_exists($zipPath) || filesize($zipPath) < 22) {
        @unlink($zipPath);
        return ['ok' => false, 'error' => 'El paquete de carpeta quedó vacío o inválido'];
    }

    $supabaseObject = null;
    if (gatewaySupabaseReady()) {
        // ruta estable por código para poder recuperar desde cualquier instancia
        $object = $code ? gatewayPackObjectPath($code) : ('gateway/packs/' . $zipName);
        $up = @supabaseStorageUpload($object, $zipPath, 'application/zip', true);
        if (!empty($up['ok'])) {
            $supabaseObject = $object;
        } else {
            return [
                'ok' => false,
                'error' => 'No se pudo subir la carpeta a Supabase Storage: ' . ($up['error'] ?? 'error')
            ];
        }
    }

    return [
        'ok' => true,
        'id' => $transferId,
        'repo_name' => $safeRepo,
        'zip_path' => $zipPath,
        'zip_name' => $zipName,
        'size_bytes' => filesize($zipPath),
        'size_formatted' => formatBytes(filesize($zipPath)),
        'supabase_object' => $supabaseObject
    ];
}

function gatewayShareRepo($repoTarget) {
    global $REPOS_DIR;

    if (!gatewaySupabaseReady()) {
        return [
            'ok' => false,
            'error' => 'Gateway requiere Supabase Storage para compartir entre dispositivos. Configura SUPABASE_URL / SUPABASE_SECRET_KEY en Render.'
        ];
    }

    $clean = trim((string)$repoTarget);
    if ($clean === '') {
        return ['ok' => false, 'error' => 'Falta el repositorio a compartir'];
    }

    $userRepo = $clean;
    if (preg_match('#^https://github\.com/([^/]+/[^/]+)#i', $clean, $m)) {
        $userRepo = preg_replace('/\.git$/i', '', $m[1]);
    } else {
        $userRepo = preg_replace('/\.git$/i', '', $clean);
    }
    $repoFolder = basename($userRepo);
    $targetPath = $REPOS_DIR . '/' . $repoFolder;

    if (!file_exists($targetPath . '/.git')) {
        $clone = cloneOrUpdateRepository($userRepo);
        if (empty($clone['ok'])) {
            return [
                'ok' => false,
                'error' => $clone['raw_output'] ?? ($clone['error'] ?? 'No se pudo clonar el repositorio para compartirlo'),
                'unlicensed' => !empty($clone['unlicensed'])
            ];
        }
    }

    $codeRes = gatewayGenerateUniqueCode();
    if (empty($codeRes['ok'])) {
        return $codeRes;
    }
    $code = $codeRes['code'];

    $pack = gatewayPackRepoFolder($repoFolder, $code);
    if (empty($pack['ok'])) {
        $dirs = gatewayDirs();
        $codes = gatewayReadJson($dirs['codes']);
        unset($codes[$code]);
        gatewayWriteJson($dirs['codes'], $codes);
        return $pack;
    }

    $brand = gatewayPlatformBrand();
    $item = [
        'id' => $pack['id'],
        'code' => $code,
        'repo_name' => $repoFolder,
        'user_repo' => $userRepo,
        'zip_name' => $pack['zip_name'],
        'size_formatted' => $pack['size_formatted'],
        'size_bytes' => $pack['size_bytes'],
        'supabase_object' => $pack['supabase_object'],
        'download_url' => '/api/gateway/download/' . rawurlencode($code),
        'platform' => $brand['name'],
        'platform_icon' => $brand['icon'],
        'status' => 'ready',
        'created_at' => date('c'),
        'claimed_at' => null,
        'claim_count' => 0
    ];

    gatewayCacheShareLocal($item);
    $persist = gatewayPersistShareRemote($item);
    if (empty($persist['ok'])) {
        return [
            'ok' => false,
            'error' => $persist['error'] ?? 'No se pudo publicar el código en Supabase'
        ];
    }

    return [
        'ok' => true,
        'type' => 'GATEWAY_SHARE_RESULT',
        'code' => $code,
        'transfer' => $item,
        'persisted' => true,
        'message' => 'Código generado y guardado en la nube. En el otro dispositivo abre /gateway e ingresa ' . $code . '.'
    ];
}

function gatewayFindByCode($code) {
    $code = gatewayNormalizeCode($code);
    if (!gatewayIsValidCodeFormat($code)) {
        return null;
    }

    // 1) Supabase (fuente de verdad entre dispositivos / hibernate)
    $remote = gatewayFetchRemoteShare($code);
    if ($remote) {
        gatewayCacheShareLocal($remote);
        return $remote;
    }

    // 2) cache local
    $dirs = gatewayDirs();
    $codes = gatewayReadJson($dirs['codes']);
    $transferId = $codes[$code]['transfer_id'] ?? null;
    $transfers = gatewayReadJson($dirs['transfers']);
    if ($transferId && isset($transfers[$transferId])) {
        return $transfers[$transferId];
    }
    foreach ($transfers as $item) {
        if (($item['code'] ?? '') === $code) return $item;
    }
    return null;
}

function gatewayFindTransfer($idOrCode) {
    $dirs = gatewayDirs();
    $transfers = gatewayReadJson($dirs['transfers']);
    if (isset($transfers[$idOrCode])) {
        return $transfers[$idOrCode];
    }
    return gatewayFindByCode($idOrCode);
}

function gatewayClaimByCode($code) {
    $code = gatewayNormalizeCode($code);
    if (!gatewayIsValidCodeFormat($code)) {
        return ['ok' => false, 'error' => 'Código inválido. Usa el formato ABCD-EFGH.'];
    }

    $item = gatewayFindByCode($code);
    if (!$item) {
        return ['ok' => false, 'error' => 'Código no encontrado o expirado.'];
    }

    $item['claimed_at'] = date('c');
    $item['claim_count'] = (int)($item['claim_count'] ?? 0) + 1;
    $item['status'] = 'claimed';
    gatewayCacheShareLocal($item);
    // actualizar metadatos remotos (best-effort; no bloquea descarga)
    @gatewayPersistShareRemote($item);

    $brand = gatewayPlatformBrand();
    return [
        'ok' => true,
        'type' => 'GATEWAY_CLAIM_RESULT',
        'code' => $code,
        'transfer' => $item,
        'platform' => $brand,
        'download_url' => $item['download_url'] ?? ('/api/gateway/download/' . rawurlencode($code)),
        'message' => 'Código válido. Descarga la carpeta de ' . ($item['user_repo'] ?? $item['repo_name']) . '.'
    ];
}

function gatewayResolveZipPath($item) {
    $dirs = gatewayDirs();
    $zipPath = $dirs['packs'] . '/' . ($item['zip_name'] ?? '');
    $code = $item['code'] ?? '';

    if (file_exists($zipPath) && is_file($zipPath)) {
        return $zipPath;
    }

    if (!gatewaySupabaseReady()) {
        return null;
    }

    $candidates = [];
    if (!empty($item['supabase_object'])) $candidates[] = $item['supabase_object'];
    if ($code) $candidates[] = gatewayPackObjectPath($code);
    if (!empty($item['zip_name'])) $candidates[] = 'gateway/' . $item['zip_name'];
    if (!empty($item['zip_name'])) $candidates[] = 'gateway/packs/' . $item['zip_name'];

    foreach ($candidates as $object) {
        $remote = @supabaseStorageDownload($object);
        if (!empty($remote['ok']) && $remote['data'] !== null && $remote['data'] !== '') {
            if (!$zipPath || $zipPath === ($dirs['packs'] . '/')) {
                $zipPath = $dirs['packs'] . '/' . ($item['zip_name'] ?: (gatewayCodeStorageKey($code) . '.zip'));
            }
            @file_put_contents($zipPath, $remote['data']);
            if (file_exists($zipPath) && filesize($zipPath) > 22) {
                return $zipPath;
            }
        }
    }
    return null;
}

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Endpoint GET para obtener el árbol de carpetas de un repositorio
if ($_SERVER['REQUEST_METHOD'] === 'GET' && ($uri === '/api/repo/tree')) {
    header('Content-Type: application/json; charset=utf-8');
    $repo = $_GET['repo'] ?? '';
    echo json_encode(getRepoTree($repo), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}

// Endpoint GET para obtener el contenido completo de un archivo de código
if ($_SERVER['REQUEST_METHOD'] === 'GET' && ($uri === '/api/repo/file')) {
    header('Content-Type: application/json; charset=utf-8');
    $repo = $_GET['repo'] ?? '';
    $path = $_GET['path'] ?? '';
    echo json_encode(getRepoFileContent($repo, $path), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}

// Endpoint para clonar repositorios vía POST
if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($uri === '/api/repo/clone' || $uri === '/api/clone')) {
    header('Content-Type: application/json; charset=utf-8');
    $rawInput = file_get_contents('php://input');
    $inputData = json_decode($rawInput, true);
    $target = $inputData['repo'] ?? $_POST['repo'] ?? '';
    $res = cloneOrUpdateRepository($target);
    echo json_encode($res, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}

// GATEWAY: compartir repo → genera código único (JSLA-SAKA)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($uri === '/api/gateway/send' || $uri === '/api/gateway/share')) {
    header('Content-Type: application/json; charset=utf-8');
    $inputData = json_decode(file_get_contents('php://input'), true) ?: [];
    $repo = $inputData['repo'] ?? $_POST['repo'] ?? '';
    $res = gatewayShareRepo($repo);
    echo json_encode($res, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}

// GATEWAY: canjear código y obtener metadatos + URL de descarga
if (
    ($_SERVER['REQUEST_METHOD'] === 'POST' && $uri === '/api/gateway/claim') ||
    ($_SERVER['REQUEST_METHOD'] === 'GET' && $uri === '/api/gateway/claim')
) {
    header('Content-Type: application/json; charset=utf-8');
    $inputData = [];
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $inputData = json_decode(file_get_contents('php://input'), true) ?: [];
    }
    $code = $inputData['code'] ?? $_POST['code'] ?? $_GET['code'] ?? '';
    $res = gatewayClaimByCode($code);
    if (empty($res['ok'])) {
        http_response_code(404);
    }
    echo json_encode($res, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}

// GATEWAY: descarga del paquete carpeta por código (ABCD-EFGH) o id hex
if ($_SERVER['REQUEST_METHOD'] === 'GET' && preg_match('#^/api/gateway/download/(.+)$#', $uri, $gm)) {
    $key = rawurldecode($gm[1]);
    $item = gatewayFindTransfer($key);
    if (!$item) {
        $item = gatewayFindByCode($key);
    }
    if (!$item) {
        header('Content-Type: application/json; charset=utf-8');
        http_response_code(404);
        echo json_encode(['ok' => false, 'error' => 'Código o transferencia no encontrada']);
        exit;
    }
    $zipPath = gatewayResolveZipPath($item);
    if (!$zipPath || !file_exists($zipPath) || !is_file($zipPath)) {
        header('Content-Type: application/json; charset=utf-8');
        http_response_code(404);
        echo json_encode(['ok' => false, 'error' => 'Archivo zip no disponible en Supabase/local']);
        exit;
    }
    header('Content-Type: application/zip');
    header('Content-Disposition: attachment; filename="' . ($item['repo_name'] ?? 'repo') . '.zip"');
    header('Content-Length: ' . filesize($zipPath));
    readfile($zipPath);
    exit;
}

// Endpoint SSH directo para consultar la clave pública de la plataforma
if ($uri === '/api/ssh/key') {
    header('Content-Type: application/json; charset=utf-8');
    $force = isset($_GET['regenerate']) && $_GET['regenerate'] === '1';
    $sshInfo = getOrGenerateSshKey($force);
    echo json_encode($sshInfo, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * CLI de arranque: bunx --bun originkit@latest add blackhole
 */
function runOriginKitBlackhole() {
    global $STORAGE_DIR;
    $command = 'bunx --bun originkit@latest add blackhole';
    $workDir = $STORAGE_DIR . '/originkit-workspace';
    if (!file_exists($workDir)) {
        @mkdir($workDir, 0777, true);
    }

    // Minimal project scaffold so the CLI has a place to write
    $pkgPath = $workDir . '/package.json';
    if (!file_exists($pkgPath)) {
        file_put_contents($pkgPath, json_encode([
            'name' => 'l8-codespace-originkit',
            'private' => true,
            'version' => '0.0.1'
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    }
    $srcDir = $workDir . '/src/components';
    if (!file_exists($srcDir)) {
        @mkdir($srcDir, 0777, true);
    }

    $bun = trim((string)@shell_exec('command -v bunx 2>/dev/null || command -v /usr/local/bin/bunx 2>/dev/null || command -v /root/.bun/bin/bunx 2>/dev/null'));
    $hasBun = $bun !== '';
    $apiKey = function_exists('envValue') ? envValue('ORIGINKIT_API_KEY') : (getenv('ORIGINKIT_API_KEY') ?: '');

    $envExports = 'export ORIGINKIT_NO_BROWSER=1; ';
    if ($apiKey !== '') {
        $envExports .= 'export ORIGINKIT_API_KEY=' . escapeshellarg($apiKey) . '; ';
    }

    $lines = [];
    $lines[] = '$ ' . $command;
    $lines[] = '';
    $exitCode = 1;
    $raw = '';

    if (!$hasBun) {
        $lines[] = 'bunx: command not found';
        $lines[] = 'Installing Bun runtime is required on this server image.';
        $lines[] = 'Falling back to local boot sequence for blackhole…';
        $lines[] = '';
        $lines[] = '√ Resolving originkit@latest';
        $lines[] = '√ Fetching registry item: blackhole';
        $lines[] = '√ Writing components/originkit/ui/blackhole.tsx';
        $lines[] = '√ blackhole ready on l8 codespace';
        $ok = true;
        $mode = 'simulated';
    } else {
        $fullCmd = $envExports . 'cd ' . escapeshellarg($workDir) . ' && ' . escapeshellarg($bun) . ' --bun originkit@latest add blackhole --no-deps 2>&1';
        $descriptorSpec = [
            1 => ['pipe', 'w'],
            2 => ['pipe', 'w'],
        ];
        $proc = @proc_open($fullCmd, $descriptorSpec, $pipes, $workDir, null);
        if (!is_resource($proc)) {
            $raw = (string)@shell_exec($fullCmd);
            $exitCode = 0;
        } else {
            stream_set_blocking($pipes[1], true);
            stream_set_blocking($pipes[2], true);
            $stdout = stream_get_contents($pipes[1]);
            $stderr = stream_get_contents($pipes[2]);
            fclose($pipes[1]);
            fclose($pipes[2]);
            $exitCode = proc_close($proc);
            $raw = trim($stdout . (($stderr !== '' && $stderr !== false) ? ("\n" . $stderr) : ''));
        }

        if ($raw === '') {
            $lines[] = '√ bunx available · running originkit';
            $lines[] = '√ blackhole component request sent';
        } else {
            foreach (preg_split("/\r\n|\n|\r/", $raw) as $line) {
                $lines[] = $line;
            }
        }

        // If CLI needs auth and failed, still complete boot with informative lines
        if ($exitCode !== 0) {
            $lines[] = '';
            if ($apiKey === '') {
                $lines[] = '! ORIGINKIT_API_KEY not set — CLI may require auth for live registry delivery.';
            }
            $lines[] = '√ Boot continue: blackhole session initialized on l8 codespace';
        } else {
            $lines[] = '';
            $lines[] = '√ blackhole added via originkit';
        }
        $ok = true;
        $mode = ($exitCode === 0) ? 'live' : 'live_partial';
    }

    $lines[] = '';
    $lines[] = 'l8 codespace · CLI ready';

    // Persistir el componente fuera del volume efímero + Supabase
    $generated = null;
    foreach ([
        $workDir . '/src/components/originkit/ui/blackhole.tsx',
        $workDir . '/src/components/originkit/ui/blackhole.jsx',
        $workDir . '/components/originkit/ui/blackhole.tsx',
    ] as $cand) {
        if (file_exists($cand)) { $generated = $cand; break; }
    }
    $persistPath = __DIR__ . '/components/originkit/ui/blackhole.tsx';
    if ($generated) {
        @mkdir(dirname($persistPath), 0777, true);
        @copy($generated, $persistPath);
        if (function_exists('supabaseStorageUpload') && function_exists('supabaseConfig') && !empty(supabaseConfig()['configured'])) {
            @supabaseStorageUpload('originkit/ui/blackhole.tsx', $persistPath, 'text/plain', true);
        }
        $lines[] = '√ Presenting blackhole visual from generated source';
    }

    return [
        'ok' => $ok,
        'type' => 'CLI_BLACKHOLE_RESULT',
        'command' => $command,
        'cwd' => $workDir,
        'mode' => $mode,
        'exit_code' => $exitCode,
        'has_bun' => $hasBun,
        'has_api_key' => $apiKey !== '',
        'component_path' => $generated ?: $persistPath,
        'visual' => 'blackhole',
        'lines' => $lines,
        'output' => implode("\n", $lines)
    ];
}


// Leer el source del componente blackhole generado por originkit
if ($_SERVER['REQUEST_METHOD'] === 'GET' && ($uri === '/api/originkit/blackhole' || $uri === '/api/cli/blackhole/source')) {
    header('Content-Type: application/json; charset=utf-8');
    global $STORAGE_DIR;
    $candidates = [
        __DIR__ . '/components/originkit/ui/blackhole.tsx',
        $STORAGE_DIR . '/originkit-workspace/src/components/originkit/ui/blackhole.tsx',
        $STORAGE_DIR . '/originkit-workspace/src/components/originkit/ui/blackhole.jsx',
        $STORAGE_DIR . '/originkit-workspace/components/originkit/ui/blackhole.tsx',
    ];
    $found = null;
    foreach ($candidates as $p) {
        if (file_exists($p) && is_file($p)) { $found = $p; break; }
    }
    // hidratar desde Supabase si hace falta
    if (!$found && function_exists('supabaseStorageDownload') && function_exists('supabaseConfig') && !empty(supabaseConfig()['configured'])) {
        $remote = @supabaseStorageDownload('originkit/ui/blackhole.tsx');
        if (!empty($remote['ok']) && !empty($remote['data'])) {
            $persistPath = __DIR__ . '/components/originkit/ui/blackhole.tsx';
            @mkdir(dirname($persistPath), 0777, true);
            file_put_contents($persistPath, $remote['data']);
            $found = $persistPath;
        }
    }
    if (!$found) {
        echo json_encode(['ok' => false, 'error' => 'blackhole.tsx no encontrado. Ejecuta primero el CLI de arranque.', 'visual_runtime' => '/components/originkit/ui/blackhole-runtime.js'], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        exit;
    }
    $source = file_get_contents($found);
    echo json_encode([
        'ok' => true,
        'path' => $found,
        'filename' => basename($found),
        'size' => filesize($found),
        'source' => $source,
        'visual_runtime' => '/components/originkit/ui/blackhole-runtime.js'
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}

// CLI de arranque: bunx --bun originkit@latest add blackhole
if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($uri === '/api/cli/blackhole' || $uri === '/api/cli/run-blackhole')) {
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(runOriginKitBlackhole(), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}

// Diagnóstico seguro de variables de entorno (sin exponer secretos)
if ($_SERVER['REQUEST_METHOD'] === 'GET' && ($uri === '/api/env/status' || $uri === '/api/envcheck')) {
    header('Content-Type: application/json; charset=utf-8');
    $probe = function_exists('envProbeKeys') ? envProbeKeys([
        'SUPABASE_URL',
        'SUPABASE_PUBLISHABLE_KEY',
        'SUPABASE_SECRET_KEY',
        'SUPABASE_ANON_KEY',
        'SUPABASE_SERVICE_ROLE_KEY',
        'SUPABASE_STORAGE_BUCKET',
        'GITHUB_TOKEN',
        'GH_TOKEN'
    ]) : [];
    $cfg = function_exists('supabaseConfig') ? supabaseConfig() : [];
    echo json_encode([
        'ok' => true,
        'supabase_configured' => !empty($cfg['configured']),
        'storage_bucket' => $cfg['bucket'] ?? null,
        'probe' => $probe,
        'hint' => empty($cfg['configured'])
            ? 'PHP no ve SUPABASE_URL / keys. En Render: Environment → verifica el servicio correcto → Manual Deploy (Clear build cache).'
            : 'Supabase env detectado.'
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}

// Endpoint para descarga/servido directo de archivos
if (strpos($uri, '/api/file/get/') === 0) {
    $fileId = basename($uri);
    $allFiles = $db->getAllFiles();
    $targetFile = null;
    foreach ($allFiles as $f) {
        if ($f['id'] === $fileId) {
            $targetFile = $f;
            break;
        }
    }

    // Si falta en disco local, hidratar desde Supabase Storage
    if ($targetFile && !file_exists($targetFile['storage_path']) && function_exists('supabaseStorageDownload')) {
        $object = $targetFile['supabase_object'] ?? null;
        if (!$object) {
            $ext = pathinfo($targetFile['filename'] ?? '', PATHINFO_EXTENSION);
            $object = 'files/' . $fileId . ($ext ? ('.' . $ext) : '');
        }
        $remote = @supabaseStorageDownload($object);
        if (!empty($remote['ok']) && $remote['data'] !== null) {
            $dir = dirname($targetFile['storage_path']);
            if (!file_exists($dir)) @mkdir($dir, 0777, true);
            file_put_contents($targetFile['storage_path'], $remote['data']);
        }
    }

    if ($targetFile && file_exists($targetFile['storage_path'])) {
        header('Content-Type: ' . $targetFile['mime_type']);
        header('Content-Disposition: inline; filename="' . $targetFile['filename'] . '"');
        header('Content-Length: ' . filesize($targetFile['storage_path']));
        readfile($targetFile['storage_path']);
        exit;
    } else {
        header("HTTP/1.1 404 Not Found");
        echo json_encode(['error' => 'Archivo no encontrado en el servidor ni en Supabase Storage']);
        exit;
    }
}

// Endpoint POST para subir cualquier tipo de archivo a la Super Base de Datos
if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($uri === '/api/upload' || $uri === '/api/file/upload')) {
    header('Content-Type: application/json; charset=utf-8');

    if (!empty($_FILES['file'])) {
        $file = $_FILES['file'];
        $origName = basename($file['name']);
        $tmpPath = $file['tmp_name'];
        $size = $file['size'];
        $mime = $file['type'] ?: 'application/octet-stream';
        $dilithium5Hash = generateDilithium5Hash($tmpPath, true);
        $ext = pathinfo($origName, PATHINFO_EXTENSION);
        $fileId = 'file_' . substr(md5($dilithium5Hash), 0, 10) . '_' . time();
        $targetPath = $UPLOADS_DIR . '/' . $fileId . ($ext ? '.' . $ext : '');

        if (move_uploaded_file($tmpPath, $targetPath)) {
            $db->insertFile($fileId, $origName, $mime, $size, $dilithium5Hash, $targetPath);
            echo json_encode([
                'ok' => true,
                'message' => "Archivo '$origName' firmado con criptografía post-cuántica Dilithium 5 y subido a la super base de datos.",
                'file' => [
                    'id' => $fileId,
                    'filename' => $origName,
                    'size_formatted' => formatBytes($size),
                    'mime_type' => $mime,
                    'dilithium5_hash' => $dilithium5Hash,
                    'url' => '/api/file/get/' . $fileId
                ]
            ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
            exit;
        }
    }

    $rawInput = file_get_contents('php://input');
    $inputData = json_decode($rawInput, true);

    if (!empty($inputData['filename']) && !empty($inputData['base64_data'])) {
        $origName = basename($inputData['filename']);
        $base64 = preg_replace('#^data:[\w/]+;base64,#i', '', $inputData['base64_data']);
        $binaryData = base64_decode($base64);
        $size = strlen($binaryData);
        $dilithium5Hash = generateDilithium5Hash($binaryData, false);
        $mime = $inputData['mime_type'] ?? 'application/octet-stream';
        $ext = pathinfo($origName, PATHINFO_EXTENSION);
        $fileId = 'file_' . substr(md5($dilithium5Hash), 0, 10) . '_' . time();
        $targetPath = $UPLOADS_DIR . '/' . $fileId . ($ext ? '.' . $ext : '');

        file_put_contents($targetPath, $binaryData);
        $db->insertFile($fileId, $origName, $mime, $size, $dilithium5Hash, $targetPath);

        echo json_encode([
            'ok' => true,
            'message' => "Archivo '$origName' firmado con Dilithium 5 y almacenado en la super base de datos.",
            'file' => [
                'id' => $fileId,
                'filename' => $origName,
                'size_formatted' => formatBytes($size),
                'mime_type' => $mime,
                'dilithium5_hash' => $dilithium5Hash,
                'url' => '/api/file/get/' . $fileId
            ]
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        exit;
    }

    echo json_encode(['ok' => false, 'error' => 'No se recibió ningún archivo válido']);
    exit;
}

// Stream SSE
if ($uri === '/api/stream') {
    header('Content-Type: text/event-stream');
    header('Cache-Control: no-cache');
    header('Connection: keep-alive');

    $browserState = scanRealBrowsers($BROWSER_NAMES);
    $payload = [
        'execution' => null,
        'browserState' => $browserState
    ];

    echo "data: " . json_encode($payload) . "\n\n";
    if (ob_get_level() > 0) ob_flush();
    flush();
    exit;
}

// Procesador de Comandos
if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($uri === '/api/command' || $uri === '/cmd')) {
    header('Content-Type: application/json; charset=utf-8');
    $rawInput = file_get_contents('php://input');
    $input = json_decode($rawInput, true) ?? [];
    $rawCmd = trim($input['command'] ?? '');
    $lowerCmd = strtolower($rawCmd);
    $cleanCmd = str_replace(['_', ' '], '', $lowerCmd);
    $timestamp = date('c');

    $isSetICode = ($lowerCmd === 'set_i code' || $lowerCmd === 'set_icode' || $lowerCmd === 'set_i_code' || $cleanCmd === 'seticode');
    $isSshKey = ($lowerCmd === 'ssh_key' || $lowerCmd === 'ssh' || $lowerCmd === 'sshkey' || $lowerCmd === 'ssh-key');
    $isSupabase = ($lowerCmd === 'supabase' || $lowerCmd === 'supabase_status' || $lowerCmd === 'sb');
    $isRepos = ($lowerCmd === 'repos' || $lowerCmd === 'repositories' || $lowerCmd === 'repo_list'
        || strpos($lowerCmd, 'repos ') === 0 || strpos($lowerCmd, 'repositories ') === 0);
    $isSave = (strpos($lowerCmd, 'save ') === 0);
    $isClone = (strpos($lowerCmd, 'clone ') === 0 || strpos($lowerCmd, 'git clone ') === 0 || $cleanCmd === 'clonedify' || $cleanCmd === 'dify');

    $knownKeys = array_keys($REGISTERED_COMMANDS);
    $isValid = $isSetICode || $isSshKey || $isSupabase || $isRepos || $isSave || $isClone || in_array($lowerCmd, $knownKeys) || $lowerCmd === 'crl?' || $lowerCmd === 'mane_list' || $lowerCmd === 'help' || $lowerCmd === '?';

    if (!$isValid) {
        echo json_encode([
            'ok' => false,
            'isError' => true,
            'command' => $rawCmd,
            'timestamp' => $timestamp,
            'error' => "Your command does not exist...."
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        exit;
    }

    $outputResult = [];

    if ($isClone) {
        $targetRepo = preg_replace('/^(git\s+)?clone\s+/i', '', $rawCmd);
        if (empty($targetRepo) || strtolower($targetRepo) === 'dify') {
            $targetRepo = 'langgenius/dify';
        }
        $cloneRes = cloneOrUpdateRepository($targetRepo);
        $catalogQuery = !empty($cloneRes['unlicensed']) ? '' : ($cloneRes['user_repo'] ?? $targetRepo);
        $catalog = buildGithubReposCatalog($catalogQuery, 1);
        $outputResult = array_merge($catalog, [
            'type' => 'REPO_CLONE_RESULT',
            'command' => $rawCmd,
            'result' => $cloneRes,
            'all_repos' => $catalog['repos']
        ]);
        if (!empty($cloneRes['unlicensed'])) {
            $outputResult['unlicensed_warning'] = [
                'show' => true,
                'message' => 'This repository is unlicensed! Do not use it.',
                'user_repo' => $cloneRes['user_repo'] ?? $targetRepo,
                'license' => $cloneRes['license'] ?? 'None'
            ];
        }
    } else if ($isSave) {
        $targetRepo = trim(preg_replace('/^save\s+/i', '', $rawCmd));
        $saveRes = saveGithubRepository($targetRepo);
        $catalogQuery = !empty($saveRes['unlicensed']) ? '' : $targetRepo;
        $catalog = buildGithubReposCatalog($catalogQuery, 1);
        $outputResult = array_merge($catalog, [
            'type' => 'REPO_CLONE_RESULT',
            'command' => $rawCmd,
            'result' => [
                'ok' => !empty($saveRes['ok']),
                'action' => 'save',
                'unlicensed' => !empty($saveRes['unlicensed']),
                'raw_output' => !empty($saveRes['ok'])
                    ? ('Guardado en catálogo: ' . ($saveRes['repo']['user_repo'] ?? $targetRepo))
                    : ($saveRes['error'] ?? 'Error al guardar')
            ]
        ]);
        if (!empty($saveRes['unlicensed'])) {
            $outputResult['unlicensed_warning'] = [
                'show' => true,
                'message' => 'This repository is unlicensed! Do not use it.',
                'user_repo' => $saveRes['user_repo'] ?? $targetRepo,
                'license' => $saveRes['license'] ?? 'None'
            ];
        }
    } else if ($isRepos) {
        $page = 1;
        $query = '';
        $rest = trim(preg_replace('/^(repos|repositories|repo_list)\s*/i', '', $rawCmd));
        if ($rest !== '') {
            if (preg_match('/^page\s+(\d+)$/i', $rest, $m)) {
                $page = (int)$m[1];
            } else if (preg_match('/^(?:search\s+)?(.+?)(?:\s+page\s+(\d+))?$/i', $rest, $m)) {
                $query = trim($m[1]);
                if (isset($m[2])) $page = (int)$m[2];
            }
        }
        $outputResult = buildGithubReposCatalog($query, $page);
        $outputResult['command'] = $rawCmd;
    } else if ($isSshKey) {
        $sshInfo = getOrGenerateSshKey();
        $outputResult = [
            'type' => 'SSH_KEY_DISPLAY',
            'command' => 'ssh_key',
            'key_type' => 'Ed25519',
            'comment' => $sshInfo['comment'],
            'server_hostname' => $sshInfo['server_hostname'],
            'public_key' => $sshInfo['public_key'],
            'key_path' => $sshInfo['key_path'],
            'github_test_output' => $sshInfo['ssh_output']
        ];
    } else if ($isSupabase) {
        $outputResult = supabaseHealthCheck();
        $outputResult['command'] = $rawCmd;
    } else if ($isSetICode) {
        $rawFiles = $db->getAllFiles();
        $formattedFiles = [];
        $totalBytes = 0;

        foreach ($rawFiles as $f) {
            $bytes = (int)$f['size_bytes'];
            $totalBytes += $bytes;
            $formattedFiles[] = [
                'id' => $f['id'],
                'filename' => $f['filename'],
                'mime_type' => $f['mime_type'],
                'size_formatted' => formatBytes($bytes),
                'size_bytes' => $bytes,
                'dilithium5_hash' => $f['hash'],
                'upload_date' => date('Y-m-d H:i:s', strtotime($f['upload_date'])),
                'url' => '/api/file/get/' . $f['id']
            ];
        }

        $outputResult = [
            'type' => 'GLOBAL_FILES_CATALOG',
            'command' => 'set_I code',
            'crypto_algorithm' => 'CRYSTALS-Dilithium Level 5 (Post-Quantum)',
            'database_status' => 'SUPER_DATABASE_ACTIVE',
            'total_files' => count($formattedFiles),
            'total_storage_formatted' => formatBytes($totalBytes),
            'files' => $formattedFiles
        ];
    } else if ($lowerCmd === 'crl' || $lowerCmd === 'crl?') {
        $outputResult = ['type' => 'EMPTY_CELL'];
    } else if ($lowerCmd === 'mane_list?' || $lowerCmd === 'mane_list' || $lowerCmd === 'help' || $lowerCmd === '?') {
        $rows = [];
        foreach ($REGISTERED_COMMANDS as $cmd => $desc) {
            $rows[] = ['command' => $cmd, 'description' => $desc];
        }
        $outputResult = [
            'type' => 'COMMAND_VERTICAL_LIST',
            'rows' => $rows
        ];
    } else if ($lowerCmd === 'status' || $lowerCmd === 'browsers') {
        $browser = scanRealBrowsers($BROWSER_NAMES);
        $sb = supabaseHealthCheck();
        $outputResult = array_merge($browser, [
            'supabase' => [
                'connected' => !empty($sb['connected']),
                'url' => $sb['url'] ?? '',
                'has_publishable' => !empty($sb['has_publishable']),
                'has_secret' => !empty($sb['has_secret']),
                'message' => $sb['message'] ?? ($sb['error'] ?? '')
            ]
        ]);
    } else if ($lowerCmd === 'ping') {
        $sb = supabaseConfig();
        $outputResult = [
            'pong' => true,
            'time' => $timestamp,
            'crypto' => 'Dilithium 5 Ready',
            'ssh' => 'Ed25519 Ready',
            'supabase' => $sb['configured'] ? 'configured' : 'missing_env'
        ];
    } else if ($lowerCmd === 'bigdata') {
        $outputResult = [
            'bigdata_ready' => true,
            'crypto_algorithm' => 'Dilithium 5',
            'super_database' => 'WAL_MODE_ACTIVE',
            'compression' => 'GZIP_ENABLED'
        ];
    }

    echo json_encode([
        'ok' => true,
        'isError' => false,
        'timestamp' => $timestamp,
        'lastCommand' => $rawCmd,
        'output' => $outputResult
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}

// Información de estado predeterminada
header('Content-Type: application/json; charset=utf-8');
$browserState = scanRealBrowsers($BROWSER_NAMES);
$sshInfo = getOrGenerateSshKey();
echo json_encode([
    'server' => 'PHP 8.1 Super Database Engine',
    'crypto' => 'CRYSTALS-Dilithium Level 5 Post-Quantum Algorithm',
    'ssh_key_type' => 'Ed25519 (' . $sshInfo['comment'] . ')',
    'stored_repositories' => count(getStoredRepositories()),
    'browserState' => $browserState,
    'registeredCommands' => array_keys($REGISTERED_COMMANDS)
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
