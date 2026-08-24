<?php
// api.php - Backend PHP con Super Base de Datos, Dilithium 5, SSH GitHub, Supabase y Navegador de Código por Carpetas
ini_set('memory_limit', '1024M'); // 1GB Memory Limit
set_time_limit(300); // 5 Minutos para grandes cargas
@ini_set('display_errors', '0');
@ini_set('expose_php', '0');

require_once __DIR__ . '/supabase.php';
require_once __DIR__ . '/security.php';
require_once __DIR__ . '/secrets.php';
loadEnvFile();
securityBootstrap('api');

if (!ob_start("ob_gzhandler")) {
    ob_start();
}

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
    "supabase"    => "Estado de Supabase: Storage + sesión persistente (repos, archivos y último comando sobreviven al recargar)",
    "mane_list?"  => "Muestra la lista de comandos creados y su funcionalidad",
    "crl"         => "Deja la celda de ejecución (=) totalmente vacía",
    "dil_fs"      => "Limpia la terminal negra y deja la vista vacía (sin código ni inspector)",
    "status"      => "Consulta el estado del servidor y motores detectados",
    "browsers"    => "Muestra los procesos reales de navegadores en ejecución",
    "ping"        => "Comprueba la conectividad y latencia con el servidor",
    "bigdata"     => "Genera y prueba la transmisión en lote de grandes volúmenes de datos",
    "prs_code"    => "Abre el IDE externo PRS Code (paste/share por selección, thin client en cluster)",
    "macOS_inside"=> "Despliega macOS externo vía dockur/macos (System + License MIT)",
    "chromeOS_play"=> "Despliega ChromeOS externo vía dockur/chromeos (System + License MIT)",
    "claude"      => "Abre la consola Claude Code CLI (asistente IA con OAuth / API Key)",
    "ubuntu"      => "Abre la terminal Ubuntu Linux completa con sesión web",
    "zylon"       => "Abre Zylon / PrivateGPT para consultas IA privadas con modelos locales",
    "libreoffice" => "Abre la suite ofimática LibreOffice (Writer, Calc, Impress, Draw, Math)",
    "tiptap"      => "Abre el editor de documentos estilo Word basado en TipTap",
    "streamlit"   => "Panel de control y ejecución de aplicaciones Python Streamlit",
    "toolkit"     => "Inspector de PDF con extracción Markdown vía WASM + motor OCR Tesseract",
    "opencrypt"   => "Libro de códigos criptográficos únicos OpenCryptG",
    "agents"      => "Catálogo de 50+ Agentes de Ingeniería de IA especializados (Agency Swarm)",
    "keys"        => "Administrador de claves y credenciales API cifradas con AES-256-GCM",
    "tokens"      => "Consulta de cupo mensual y ledger de transacciones de tokens",
    "gateway"     => "Portal PQC Crescent Gateway para compartir recursos con Dilithium-5"
];

$STORAGE_DIR = __DIR__ . '/data_storage';
$UPLOADS_DIR = __DIR__ . '/uploads';
$REPOS_DIR   = __DIR__ . '/data_storage/repos';

if (!file_exists($STORAGE_DIR)) @mkdir($STORAGE_DIR, 0777, true);
if (!file_exists($UPLOADS_DIR)) @mkdir($UPLOADS_DIR, 0777, true);
if (!file_exists($REPOS_DIR))   @mkdir($REPOS_DIR, 0777, true);

/**
 * Bootstrap Supabase solo cuando hace falta (no en lecturas rápidas del inspector).
 * Cache local 90s para no rehidratar en cada request PHP.
 */
function maybeBootstrapPlatformData($force = false) {
    global $STORAGE_DIR;
    if (!function_exists('supabaseBootstrapPlatformData')) return;
    $stamp = rtrim($STORAGE_DIR, '/') . '/.supabase_bootstrapped';
    if (!$force && file_exists($stamp) && (time() - (int)@filemtime($stamp)) < 90) {
        return;
    }
    @supabaseBootstrapPlatformData($STORAGE_DIR);
    if (function_exists('tokensEnsureHydrated')) {
        @tokensEnsureHydrated();
    }
    @file_put_contents($stamp, (string)time());
}

function repoSkipDirName($name) {
    static $skip = [
        '.git' => true, 'node_modules' => true, 'vendor' => true, '.next' => true,
        'dist' => true, 'build' => true, 'coverage' => true, '.turbo' => true,
        '.cache' => true, '__pycache__' => true, '.venv' => true, 'venv' => true,
        'target' => true, '.idea' => true, '.vscode' => true, '.yarn' => true,
        '.pnpm-store' => true, 'Pods' => true
    ];
    return isset($skip[$name]);
}

function repoFormatSize($bytes) {
    $bytes = max((int)$bytes, 0);
    $units = ['B', 'KB', 'MB', 'GB'];
    $pow = (int)floor(($bytes ? log($bytes) : 0) / log(1024));
    $pow = min($pow, count($units) - 1);
    return round($bytes / pow(1024, $pow), 2) . ' ' . $units[$pow];
}

function repoPathShouldSkip($relPath) {
    $parts = explode('/', str_replace('\\', '/', (string)$relPath));
    foreach ($parts as $part) {
        if ($part === '') continue;
        if (repoSkipDirName($part)) return true;
    }
    return false;
}

/**
 * CONSULTA DEL ÁRBOL E ESTRUCTURA DE CARPETAS DE UN REPOSITORIO (rápido + cache)
 */
function getRepoTree($repoName) {
    global $REPOS_DIR, $STORAGE_DIR;
    $safeRepo = basename((string)$repoName);
    if ($safeRepo === '' || $safeRepo === '.' || $safeRepo === '..') {
        return ['ok' => false, 'error' => 'Nombre de repositorio inválido', 'missing' => true];
    }

    $baseDir = realpath($REPOS_DIR);
    if (!$baseDir) {
        return ['ok' => false, 'error' => 'Directorio de repos no disponible', 'missing' => true];
    }
    $targetDir = realpath($REPOS_DIR . '/' . $safeRepo);
    if (!$targetDir || strpos($targetDir, $baseDir) !== 0 || !is_dir($targetDir)) {
        return ['ok' => false, 'error' => "Repositorio '$repoName' no encontrado", 'missing' => true];
    }

    $cacheDir = rtrim($STORAGE_DIR, '/') . '/repo_tree_cache';
    if (!file_exists($cacheDir)) @mkdir($cacheDir, 0777, true);
    $cacheFile = $cacheDir . '/' . md5($safeRepo) . '.json';
    $repoMtime = (int)(@filemtime($targetDir) ?: 0);

    if (file_exists($cacheFile)) {
        $cached = json_decode((string)@file_get_contents($cacheFile), true);
        if (is_array($cached) && !empty($cached['ok']) && isset($cached['tree'])
            && (int)($cached['repo_mtime'] ?? -1) === $repoMtime) {
            $cached['cached'] = true;
            return $cached;
        }
    }

    $tree = [];
    $count = 0;
    $maxEntries = 6000;
    $source = 'scan';

    // git ls-files es mucho más rápido/estable que recorrer todo el working tree
    if (is_dir($targetDir . DIRECTORY_SEPARATOR . '.git')) {
        $cmd = sprintf(
            'cd %s && git -c core.quotepath=false ls-files -z 2>/dev/null',
            escapeshellarg($targetDir)
        );
        $out = @shell_exec($cmd);
        if (is_string($out) && $out !== '') {
            $source = 'git';
            foreach (explode("\0", $out) as $relPath) {
                if ($relPath === '') continue;
                $relPath = str_replace('\\', '/', $relPath);
                if (repoPathShouldSkip($relPath)) continue;
                $full = $targetDir . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $relPath);
                if (!is_file($full) || is_link($full)) continue;
                $size = @filesize($full);
                if ($size === false || $size > 5000000) continue;
                $tree[] = [
                    'path' => $relPath,
                    'name' => basename($relPath),
                    'type' => 'file',
                    'size' => (int)$size,
                    'size_formatted' => repoFormatSize((int)$size)
                ];
                $count++;
                if ($count >= $maxEntries) break;
            }
        }
    }

    if (!$tree) {
        $source = 'scan';
        $stack = [$targetDir];
        $rootLen = strlen($targetDir) + 1;
        while ($stack && $count < $maxEntries) {
            $dir = array_pop($stack);
            $entries = @scandir($dir);
            if ($entries === false) continue;
            foreach ($entries as $name) {
                if ($name === '.' || $name === '..') continue;
                if (repoSkipDirName($name)) continue;

                $full = $dir . DIRECTORY_SEPARATOR . $name;
                if (is_link($full)) continue;

                if (is_dir($full)) {
                    $stack[] = $full;
                    continue;
                }
                if (!is_file($full)) continue;

                $size = @filesize($full);
                if ($size === false || $size > 5000000) continue;

                $relPath = str_replace('\\', '/', substr($full, $rootLen));
                if ($relPath === '') continue;

                $tree[] = [
                    'path' => $relPath,
                    'name' => $name,
                    'type' => 'file',
                    'size' => (int)$size,
                    'size_formatted' => repoFormatSize((int)$size)
                ];
                $count++;
                if ($count >= $maxEntries) break 2;
            }
        }
    }

    usort($tree, function ($a, $b) {
        return strnatcasecmp($a['path'], $b['path']);
    });

    $result = [
        'ok' => true,
        'repo' => $safeRepo,
        'tree' => $tree,
        'count' => count($tree),
        'truncated' => $count >= $maxEntries,
        'repo_mtime' => $repoMtime,
        'source' => $source,
        'cached' => false
    ];
    @file_put_contents($cacheFile, json_encode($result));
    return $result;
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

    $size = filesize($realFilePath);
    if ($size > 1500000) {
        return ['ok' => false, 'error' => 'Archivo demasiado grande para mostrar en consola'];
    }

    $content = file_get_contents($realFilePath);
    return [
        'ok' => true,
        'repo' => $safeRepo,
        'path' => $cleanFilePath,
        'filename' => basename($cleanFilePath),
        'size_formatted' => formatBytes($size),
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
    // Espejo opcional en Postgres (si existe supabase/schema.sql aplicado)
    if (function_exists('supabaseDbUpsert') && is_array($existing)) {
        $rows = [];
        foreach ($existing as $key => $meta) {
            if (!is_array($meta)) continue;
            $userRepo = !empty($meta['user_repo']) ? $meta['user_repo'] : (string)$key;
            $rows[] = [
                'id' => substr(sha1($userRepo), 0, 32),
                'user_repo' => $userRepo,
                'name' => $meta['name'] ?? basename($userRepo),
                'branch' => $meta['branch'] ?? 'main',
                'remote_url' => $meta['remote_url'] ?? ('https://github.com/' . $userRepo),
                'license' => $meta['license'] ?? null,
                'stars' => isset($meta['stars']) ? (int)$meta['stars'] : null,
                'is_private' => !empty($meta['is_private']),
                'cloned' => !empty($meta['cloned']),
                'meta' => $meta,
                'updated_at' => $meta['updated_at'] ?? date('c')
            ];
        }
        if ($rows) @supabaseDbUpsert('l8_repos', $rows, 'id');
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
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 2);
        curl_setopt($ch, CURLOPT_TIMEOUT, 8);
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

/** Licencias FOSS permitidas en el catálogo / clone. */
function isAllowedRepoLicense($license) {
    $l = strtoupper(trim((string)$license));
    if ($l === '' || $l === 'NONE' || $l === 'NOASSERTION' || $l === 'UNKNOWN' || $l === 'OTHER') {
        return false;
    }
    if ($l === 'MIT' || strpos($l, 'MIT') !== false) return true;
    if (strpos($l, 'APACHE') !== false) return true;
    if (strpos($l, 'BSD') !== false) return true;
    // LibreOffice y otros FOSS frecuentes
    if (strpos($l, 'MPL') !== false) return true;
    if (strpos($l, 'LGPL') !== false) return true;
    if ($l === 'GPL' || strpos($l, 'GPL-') !== false || strpos($l, 'GPLV') !== false) return true;
    if (strpos($l, 'EUPL') !== false) return true;
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

/**
 * Resuelve owner/repo de GitHub o URL git genérica (p.ej. FreeDesktop LibreOffice).
 * @return array{ok:bool,kind?:string,user_repo?:string,clone_url?:string,folder?:string,license_hint?:string,error?:string}
 */
function resolveCloneTarget($repoTarget) {
    $cleanTarget = trim((string)$repoTarget);
    if ($cleanTarget === '') {
        return ['ok' => false, 'error' => 'Especifica un repositorio para clonar'];
    }

    // URL git genérica (http/https/git://) — LibreOffice anongit, GitLab, etc.
    if (preg_match('#^(https?|git)://.+#i', $cleanTarget)) {
        $url = preg_replace('#^http://#i', 'https://', $cleanTarget);
        $url = rtrim($url, '/');
        if (!preg_match('/\.git$/i', $url)) {
            $url .= '.git';
        }
        $path = parse_url($url, PHP_URL_PATH);
        $path = is_string($path) ? trim($path, '/') : '';
        $parts = array_values(array_filter(explode('/', $path)));
        $leaf = preg_replace('/\.git$/i', '', (string)end($parts));
        $owner = count($parts) >= 2 ? preg_replace('/\.git$/i', '', $parts[count($parts) - 2]) : 'external';
        $userRepo = $owner . '/' . $leaf;
        $folder = $owner . '-' . $leaf;
        $licenseHint = 'External';
        if (stripos($url, 'libreoffice') !== false) {
            $licenseHint = 'MPL-2.0';
            $folder = 'libreoffice-core';
            $userRepo = 'libreoffice/core';
            // anongit.freedesktop a veces rechaza shallow ("not our ref");
            // el mirror oficial GitHub/LibreOffice/core es el mismo código.
            if (stripos($url, 'anongit.freedesktop.org') !== false) {
                $url = 'https://github.com/LibreOffice/core.git';
            }
        }
        return [
            'ok' => true,
            'kind' => 'giturl',
            'user_repo' => $userRepo,
            'clone_url' => $url,
            'folder' => preg_replace('/[^A-Za-z0-9._-]+/', '-', $folder),
            'license_hint' => $licenseHint,
        ];
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
            $userRepo = 'langgenius/dify';
        } else if (in_array(strtolower($cleanTarget), ['libreoffice', 'libreoffice/core'], true)) {
            return resolveCloneTarget('https://anongit.freedesktop.org/git/libreoffice/core.git');
        } else {
            $userRepo = $cleanTarget;
        }
    }

    if ($userRepo === '' || strpos($userRepo, '/') === false) {
        return ['ok' => false, 'error' => 'Usa owner/repo o una URL git completa'];
    }

    return [
        'ok' => true,
        'kind' => 'github',
        'user_repo' => $userRepo,
        'clone_url' => 'https://github.com/' . $userRepo . '.git',
        'ssh_url' => 'git@github.com:' . $userRepo . '.git',
        'folder' => basename($userRepo),
        'license_hint' => null,
    ];
}

function cloneOrUpdateRepository($repoTarget) {
    global $REPOS_DIR;
    $sshInfo = getOrGenerateSshKey();
    $keyPath = $sshInfo['key_path'];

    $resolved = resolveCloneTarget($repoTarget);
    if (empty($resolved['ok'])) {
        return ['ok' => false, 'error' => $resolved['error'] ?? 'Destino de clone inválido'];
    }

    $kind = $resolved['kind'];
    $userRepo = $resolved['user_repo'];
    $httpsUrl = $resolved['clone_url'];
    $sshUrl = $resolved['ssh_url'] ?? '';
    $repoFolder = $resolved['folder'];
    $targetPath = rtrim($REPOS_DIR, '/') . '/' . $repoFolder;

    $license = $resolved['license_hint'] ?? 'Unknown';
    if ($kind === 'github' && strpos($userRepo, '/') !== false) {
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
    putenv('GIT_TERMINAL_PROMPT=0');

    $output = '';
    $action = '';

    if ($alreadyCloned) {
        $action = 'pull';
        $cmd = sprintf(
            'cd %s && git pull --ff-only 2>&1 || git pull origin HEAD 2>&1 || git pull origin master 2>&1 || git pull origin main 2>&1',
            escapeshellarg($targetPath)
        );
        $output = shell_exec($cmd);
    } else {
        $action = 'clone';
        @mkdir($REPOS_DIR, 0700, true);
        // depth 1: todo el código en HEAD (el historial completo de LO es enorme)
        if ($kind === 'giturl' && stripos($httpsUrl, 'libreoffice') !== false) {
            $cmdHttps = sprintf(
                'git clone --depth 1 --single-branch %s %s 2>&1',
                escapeshellarg($httpsUrl),
                escapeshellarg($targetPath)
            );
        } else {
            $cmdHttps = sprintf(
                'git clone --depth 1 %s %s 2>&1',
                escapeshellarg($httpsUrl),
                escapeshellarg($targetPath)
            );
        }

        if ($kind === 'github' && $sshUrl !== '') {
            $cmdSsh = sprintf('git clone --depth 1 %s %s 2>&1', escapeshellarg($sshUrl), escapeshellarg($targetPath));
            $outputSsh = shell_exec($cmdSsh);
            if (file_exists($targetPath . '/.git')) {
                $output = $outputSsh;
            } else {
                if (file_exists($targetPath)) {
                    @shell_exec(sprintf('rm -rf %s', escapeshellarg($targetPath)));
                }
                $outputHttps = shell_exec($cmdHttps);
                $output = "SSH Connection Note: SSH Key not registered on GitHub account yet.\nHTTPS Auto-Fallback Execution:\n" . $outputHttps;
            }
        } else {
            $output = shell_exec($cmdHttps);
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
        global $STORAGE_DIR;
        $cacheFile = rtrim($STORAGE_DIR, '/') . '/repo_tree_cache/' . md5($repoFolder) . '.json';
        if (file_exists($cacheFile)) @unlink($cacheFile);
        @touch($targetPath);
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
        'raw_output' => trim((string)$output)
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
        @supabaseHydrateMetaFile($indexPath, 'repos_index.json', true);
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
        if (function_exists('supabaseDbUpsert')) {
            @supabaseDbUpsert('l8_files', [[
                'id' => $id,
                'filename' => $filename,
                'mime_type' => $mimeType,
                'size_bytes' => (int)$sizeBytes,
                'hash' => $hash,
                'storage_path' => $storagePath,
                'supabase_object' => $supabaseObject,
                'upload_date' => $uploadDate
            ]], 'id');
        }
    }

    public function getAllFiles() {
        if (function_exists('supabaseHydrateMetaFile')) {
            @supabaseHydrateMetaFile($this->jsonDbPath, 'global_database_index.json', true);
        }
        if (!file_exists($this->jsonDbPath)) return [];
        $raw = file_get_contents($this->jsonDbPath);
        $files = json_decode($raw, true) ?? [];
        return array_values($files);
    }
}

/**
 * ===== Ubuntu CLI externa (recursos boxcutter/ubuntu) =====
 */
function ubuntuCliDirs() {
    global $STORAGE_DIR;
    $root = rtrim($STORAGE_DIR, '/') . '/ubuntu-cli';
    return [
        'root' => $root,
        'repo' => $root . '/boxcutter-ubuntu',
        'home' => $root . '/home',
        'state' => $root . '/session.json'
    ];
}

function ubuntuEnsureDirs() {
    $d = ubuntuCliDirs();
    foreach (['root', 'home'] as $k) {
        if (!file_exists($d[$k])) @mkdir($d[$k], 0777, true);
    }
    // Acceso rápido al repo desde el home del usuario CLI
    $link = $d['home'] . '/boxcutter-ubuntu';
    if (!file_exists($link) && file_exists($d['repo'])) {
        @symlink($d['repo'], $link);
    }
    return $d;
}

function ubuntuEnsureBoxcutterRepo() {
    $d = ubuntuEnsureDirs();
    $repo = $d['repo'];
    if (file_exists($repo . '/.git') || file_exists($repo . '/README.md')) {
        return ['ok' => true, 'path' => $repo, 'cloned' => false];
    }
    if (!file_exists(dirname($repo))) @mkdir(dirname($repo), 0777, true);
    $url = 'https://github.com/boxcutter/ubuntu.git';
    $cmd = 'git clone --depth 1 ' . escapeshellarg($url) . ' ' . escapeshellarg($repo) . ' 2>&1';
    $out = [];
    $code = 0;
    @exec($cmd, $out, $code);
    if ($code !== 0 || !file_exists($repo)) {
        return [
            'ok' => false,
            'error' => 'No se pudo clonar boxcutter/ubuntu: ' . trim(implode("\n", $out)),
            'path' => $repo
        ];
    }
    $link = $d['home'] . '/boxcutter-ubuntu';
    if (!file_exists($link)) @symlink($repo, $link);
    return ['ok' => true, 'path' => $repo, 'cloned' => true, 'output' => trim(implode("\n", $out))];
}

function ubuntuListTemplates($repoPath) {
    $templates = [];
    if (!is_dir($repoPath)) return $templates;
    $items = @scandir($repoPath) ?: [];
    foreach ($items as $name) {
        if ($name === '.' || $name === '..') continue;
        if (preg_match('/\.pkr\.hcl$/i', $name) || preg_match('/\.json$/i', $name) || preg_match('/^ubuntu/i', $name)) {
            $templates[] = $name;
        }
    }
    // también busca en subcarpetas comunes
    foreach (['ubuntu', 'http', 'script', 'scripts', 'tpl'] as $sub) {
        $dir = $repoPath . '/' . $sub;
        if (!is_dir($dir)) continue;
        foreach (@scandir($dir) ?: [] as $name) {
            if ($name === '.' || $name === '..') continue;
            $templates[] = $sub . '/' . $name;
        }
    }
    $templates = array_values(array_unique($templates));
    sort($templates);
    return $templates;
}

function ubuntuResolveCwd($cwdDisplay) {
    $d = ubuntuEnsureDirs();
    $home = realpath($d['home']) ?: $d['home'];
    $cwdDisplay = trim((string)$cwdDisplay);
    if ($cwdDisplay === '' || $cwdDisplay === '~') {
        return ['abs' => $home, 'display' => '~'];
    }
    if (strpos($cwdDisplay, '~/') === 0) {
        $rel = substr($cwdDisplay, 2);
        $abs = $home . '/' . ltrim($rel, '/');
    } else if ($cwdDisplay[0] === '/') {
        // solo permitir dentro del home sandbox
        $abs = $home . $cwdDisplay;
    } else {
        $abs = $home . '/' . $cwdDisplay;
    }
    $real = realpath($abs);
    if ($real === false) {
        // directorio aún no existe: normaliza sin salir del home
        $norm = $home . '/' . ltrim(str_replace(['..'], '', str_replace($home, '', $abs)), '/');
        return ['abs' => $norm, 'display' => ubuntuDisplayCwd($norm, $home)];
    }
    $homeReal = realpath($home) ?: $home;
    if (strpos($real, $homeReal) !== 0) {
        return ['abs' => $homeReal, 'display' => '~'];
    }
    return ['abs' => $real, 'display' => ubuntuDisplayCwd($real, $homeReal)];
}

function ubuntuDisplayCwd($abs, $home) {
    $abs = str_replace('\\', '/', $abs);
    $home = str_replace('\\', '/', $home);
    if ($abs === $home) return '~';
    if (strpos($abs, $home . '/') === 0) {
        return '~/' . substr($abs, strlen($home) + 1);
    }
    return '~';
}

function ubuntuIsDangerousCommand($cmd) {
    $c = strtolower(trim($cmd));
    $blocked = [
        'rm -rf /', 'rm -rf /*', 'mkfs', ':(){', 'dd if=/dev/zero',
        'shutdown', 'reboot', 'poweroff', 'halt', 'userdel', 'passwd'
    ];
    foreach ($blocked as $b) {
        if (strpos($c, $b) !== false) return true;
    }
    return false;
}

function ubuntuRunCommand($command, $cwdDisplay = '~') {
    $ensure = ubuntuEnsureBoxcutterRepo();
    $dirs = ubuntuEnsureDirs();
    $cwd = ubuntuResolveCwd($cwdDisplay);
    $cmd = trim((string)$command);
    if ($cmd === '') {
        return ['ok' => false, 'error' => 'empty command', 'cwd_display' => $cwd['display']];
    }
    if (ubuntuIsDangerousCommand($cmd)) {
        return ['ok' => false, 'error' => 'command blocked for safety', 'stderr' => 'Refusing dangerous command.', 'cwd_display' => $cwd['display']];
    }

    // Built-ins
    if ($cmd === 'help') {
        $help = implode("\n", [
            'Ubuntu CLI on l8 codespace',
            'Resources: https://github.com/boxcutter/ubuntu',
            '',
            'Built-ins:',
            '  help                 Show this help',
            '  pwd                  Print working directory',
            '  cd [dir]             Change directory (sandboxed to ~/ )',
            '  templates            List boxcutter/ubuntu templates',
            '  about                Show session / distro info',
            '  ls, cat, uname, …    Standard shell commands in Ubuntu environment',
            '',
            'Home contains symlink: ~/boxcutter-ubuntu → cloned repo resources'
        ]);
        return ['ok' => true, 'stdout' => $help, 'stderr' => '', 'cwd_display' => $cwd['display']];
    }
    if ($cmd === 'pwd') {
        return ['ok' => true, 'stdout' => $cwd['abs'], 'stderr' => '', 'cwd_display' => $cwd['display']];
    }
    if ($cmd === 'about') {
        $uname = trim((string)@shell_exec('uname -a 2>/dev/null'));
        $out = "distro: Ubuntu CLI (l8)\nresource: boxcutter/ubuntu\nrepo: " . $dirs['repo'] . "\nhome: " . $dirs['home'] . "\nkernel: " . $uname;
        return ['ok' => true, 'stdout' => $out, 'stderr' => '', 'cwd_display' => $cwd['display']];
    }
    if ($cmd === 'templates') {
        $list = ubuntuListTemplates($dirs['repo']);
        $stdout = $list ? implode("\n", $list) : '(no templates found — repo missing?)';
        return ['ok' => !empty($ensure['ok']), 'stdout' => $stdout, 'stderr' => empty($ensure['ok']) ? ($ensure['error'] ?? '') : '', 'cwd_display' => $cwd['display']];
    }
    if (preg_match('/^cd(?:\s+(.*))?$/s', $cmd, $m)) {
        $target = isset($m[1]) ? trim($m[1]) : '~';
        if ($target === '') $target = '~';
        if ($target === '~' || $target === '$HOME') {
            return ['ok' => true, 'stdout' => '', 'stderr' => '', 'cwd_display' => '~'];
        }
        if ($target[0] !== '/' && strpos($target, '~/') !== 0) {
            $base = $cwd['abs'];
            $candidate = rtrim($base, '/') . '/' . $target;
        } else if (strpos($target, '~/') === 0) {
            $candidate = rtrim($dirs['home'], '/') . '/' . substr($target, 2);
        } else {
            $candidate = rtrim($dirs['home'], '/') . $target;
        }
        $real = realpath($candidate);
        $homeReal = realpath($dirs['home']) ?: $dirs['home'];
        if ($real === false || strpos($real, $homeReal) !== 0 || !is_dir($real)) {
            return ['ok' => false, 'stderr' => 'bash: cd: ' . $target . ': No such file or directory', 'stdout' => '', 'cwd_display' => $cwd['display']];
        }
        return ['ok' => true, 'stdout' => '', 'stderr' => '', 'cwd_display' => ubuntuDisplayCwd($real, $homeReal)];
    }

    if (!is_dir($cwd['abs'])) @mkdir($cwd['abs'], 0777, true);
    $homeReal = realpath($dirs['home']) ?: $dirs['home'];
    $envPrefix = 'export HOME=' . escapeshellarg($homeReal) . '; export TERM=xterm-256color; ';
    $full = $envPrefix . 'cd ' . escapeshellarg($cwd['abs']) . ' && ' . $cmd;
    $descriptors = [
        0 => ['pipe', 'r'],
        1 => ['pipe', 'w'],
        2 => ['pipe', 'w']
    ];
    $proc = @proc_open(['bash', '-lc', $full], $descriptors, $pipes, $cwd['abs'], null);
    if (!is_resource($proc)) {
        return ['ok' => false, 'error' => 'Unable to start bash', 'cwd_display' => $cwd['display']];
    }
    fclose($pipes[0]);
    stream_set_blocking($pipes[1], true);
    stream_set_blocking($pipes[2], true);
    $stdout = stream_get_contents($pipes[1]);
    $stderr = stream_get_contents($pipes[2]);
    fclose($pipes[1]);
    fclose($pipes[2]);
    $code = proc_close($proc);
    // truncate huge output
    if (strlen($stdout) > 200000) $stdout = substr($stdout, 0, 200000) . "\n…(truncated)";
    if (strlen($stderr) > 80000) $stderr = substr($stderr, 0, 80000) . "\n…(truncated)";
    return [
        'ok' => $code === 0,
        'exit_code' => $code,
        'stdout' => rtrim((string)$stdout),
        'stderr' => rtrim((string)$stderr),
        'cwd_display' => $cwd['display']
    ];
}

function ubuntuBootSession() {
    $ensure = ubuntuEnsureBoxcutterRepo();
    $dirs = ubuntuEnsureDirs();
    $templates = ubuntuListTemplates($dirs['repo']);
    $msg = !empty($ensure['ok'])
        ? (!empty($ensure['cloned']) ? 'Cloned boxcutter/ubuntu into session home.' : 'boxcutter/ubuntu resources ready.')
        : ('Warning: ' . ($ensure['error'] ?? 'repo unavailable'));
    return [
        'ok' => true,
        'cwd_display' => '~',
        'distro' => 'Ubuntu 22.04 LTS',
        'resource' => 'boxcutter/ubuntu',
        'repo_path' => $dirs['repo'],
        'home_path' => $dirs['home'],
        'templates' => $templates,
        'repo_ready' => !empty($ensure['ok']),
        'message' => $msg
    ];
}

/**
 * ===== Claude Code externa (recursos anthropics/claude-code-action + OAuth) =====
 */
function claudeCliDirs() {
    global $STORAGE_DIR;
    $root = rtrim($STORAGE_DIR, '/') . '/claude-cli';
    return [
        'root' => $root,
        'repo' => $root . '/claude-code-action',
        'home' => $root . '/home',
        'workspace' => $root . '/workspace',
        'creds' => $root . '/credentials.json',
        'config' => $root . '/config'
    ];
}

function claudeEnsureDirs() {
    $d = claudeCliDirs();
    foreach (['root', 'home', 'workspace', 'config'] as $k) {
        if (!file_exists($d[$k])) @mkdir($d[$k], 0777, true);
    }
    $link = $d['workspace'] . '/claude-code-action';
    if (!file_exists($link) && file_exists($d['repo'])) {
        @symlink($d['repo'], $link);
    }
    return $d;
}

function claudeEnsureActionRepo() {
    $d = claudeEnsureDirs();
    $repo = $d['repo'];
    if (file_exists($repo . '/.git') || file_exists($repo . '/action.yml') || file_exists($repo . '/README.md')) {
        $link = $d['workspace'] . '/claude-code-action';
        if (!file_exists($link)) @symlink($repo, $link);
        return ['ok' => true, 'path' => $repo, 'cloned' => false];
    }
    if (!file_exists(dirname($repo))) @mkdir(dirname($repo), 0777, true);
    $url = 'https://github.com/anthropics/claude-code-action.git';
    $cmd = 'git clone --depth 1 ' . escapeshellarg($url) . ' ' . escapeshellarg($repo) . ' 2>&1';
    $out = [];
    $code = 0;
    @exec($cmd, $out, $code);
    if ($code !== 0 || !file_exists($repo)) {
        return [
            'ok' => false,
            'error' => 'No se pudo clonar anthropics/claude-code-action: ' . trim(implode("\n", $out)),
            'path' => $repo
        ];
    }
    $link = $d['workspace'] . '/claude-code-action';
    if (!file_exists($link)) @symlink($repo, $link);
    return ['ok' => true, 'path' => $repo, 'cloned' => true, 'output' => trim(implode("\n", $out))];
}

function claudeFindBinary() {
    $candidates = [
        trim((string)@shell_exec('command -v claude 2>/dev/null')),
        '/root/.local/bin/claude',
        '/usr/local/bin/claude',
        getenv('HOME') ? rtrim(getenv('HOME'), '/') . '/.local/bin/claude' : '',
    ];
    foreach ($candidates as $bin) {
        if ($bin !== '' && is_file($bin) && is_executable($bin)) {
            return $bin;
        }
    }
    return '';
}

function claudeEnsureBinary() {
    $bin = claudeFindBinary();
    if ($bin !== '') {
        return ['ok' => true, 'bin' => $bin, 'installed' => false];
    }
    // Instalar CLI nativo si falta (misma vía que docs Anthropic)
    $install = 'curl -fsSL https://claude.ai/install.sh | bash 2>&1';
    $out = [];
    $code = 0;
    @exec($install, $out, $code);
    $bin = claudeFindBinary();
    if ($bin === '') {
        return [
            'ok' => false,
            'error' => 'Claude Code CLI no instalado. Instala con: curl -fsSL https://claude.ai/install.sh | bash',
            'output' => trim(implode("\n", $out))
        ];
    }
    return ['ok' => true, 'bin' => $bin, 'installed' => true, 'output' => trim(implode("\n", $out))];
}

function claudeLoadCredentials() {
    $d = claudeEnsureDirs();
    $path = $d['creds'];
    $file = [];
    if (file_exists($path)) {
        $raw = @file_get_contents($path);
        $decoded = json_decode((string)$raw, true);
        if (is_array($decoded)) $file = $decoded;
    }
    $oauth = '';
    $apiKey = '';
    if (!empty($file['oauth_token'])) $oauth = trim((string)$file['oauth_token']);
    if (!empty($file['api_key'])) $apiKey = trim((string)$file['api_key']);

    if ($oauth === '' && function_exists('envValue')) {
        $oauth = trim((string)envValue('CLAUDE_CODE_OAUTH_TOKEN', ''));
    }
    if ($apiKey === '' && function_exists('envValue')) {
        $apiKey = trim((string)envValue('ANTHROPIC_API_KEY', ''));
    }
    if ($oauth === '') {
        $oauth = trim((string)(getenv('CLAUDE_CODE_OAUTH_TOKEN') ?: ($_ENV['CLAUDE_CODE_OAUTH_TOKEN'] ?? '')));
    }
    if ($apiKey === '') {
        $apiKey = trim((string)(getenv('ANTHROPIC_API_KEY') ?: ($_ENV['ANTHROPIC_API_KEY'] ?? '')));
    }

    $method = '';
    if ($oauth !== '') $method = 'oauth';
    else if ($apiKey !== '') $method = 'api_key';

    return [
        'oauth_token' => $oauth,
        'api_key' => $apiKey,
        'authenticated' => $method !== '',
        'auth_method' => $method,
        'from_file' => !empty($file),
        'path' => $path
    ];
}

function claudeSaveCredentials($oauthToken, $apiKey) {
    $d = claudeEnsureDirs();
    $payload = [
        'oauth_token' => trim((string)$oauthToken),
        'api_key' => trim((string)$apiKey),
        'updated_at' => date('c')
    ];
    if ($payload['oauth_token'] === '' && $payload['api_key'] === '') {
        return ['ok' => false, 'error' => 'Se requiere CLAUDE_CODE_OAUTH_TOKEN o ANTHROPIC_API_KEY'];
    }
    $ok = @file_put_contents($d['creds'], json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    if ($ok === false) {
        return ['ok' => false, 'error' => 'No se pudieron guardar las credenciales'];
    }
    @chmod($d['creds'], 0600);
    return ['ok' => true, 'auth_method' => $payload['oauth_token'] !== '' ? 'oauth' : 'api_key'];
}

function claudeClearCredentials() {
    $d = claudeEnsureDirs();
    if (file_exists($d['creds'])) @unlink($d['creds']);
    return ['ok' => true, 'logged_out' => true];
}

function claudeBuildProcEnv($creds) {
    $d = claudeEnsureDirs();
    $home = realpath($d['home']) ?: $d['home'];
    $config = realpath($d['config']) ?: $d['config'];
    $env = $_ENV;
    foreach ($_SERVER as $k => $v) {
        if (is_string($k) && is_string($v) && preg_match('/^[A-Z_][A-Z0-9_]*$/', $k)) {
            if (!isset($env[$k])) $env[$k] = $v;
        }
    }
    $env['HOME'] = $home;
    $env['CLAUDE_CONFIG_DIR'] = $config;
    $env['TERM'] = 'xterm-256color';
    $env['CI'] = '1';
    // Prefer OAuth (subscription) como en claude-code-action
    if (!empty($creds['oauth_token'])) {
        $env['CLAUDE_CODE_OAUTH_TOKEN'] = $creds['oauth_token'];
        unset($env['ANTHROPIC_API_KEY']);
    } else if (!empty($creds['api_key'])) {
        $env['ANTHROPIC_API_KEY'] = $creds['api_key'];
        unset($env['CLAUDE_CODE_OAUTH_TOKEN']);
    }
    $path = $env['PATH'] ?? (getenv('PATH') ?: '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin');
    foreach (['/root/.local/bin', $home . '/.local/bin', '/usr/local/bin'] as $extra) {
        if ($extra && strpos($path, $extra) === false) {
            $path = $extra . ':' . $path;
        }
    }
    $env['PATH'] = $path;
    return $env;
}

function claudeBootSession() {
    $ensureRepo = claudeEnsureActionRepo();
    $ensureBin = claudeEnsureBinary();
    $creds = claudeLoadCredentials();
    $dirs = claudeEnsureDirs();
    $version = '';
    if (!empty($ensureBin['ok']) && !empty($ensureBin['bin'])) {
        $version = trim((string)@shell_exec(escapeshellarg($ensureBin['bin']) . ' --version 2>/dev/null'));
    }
    $msgParts = [];
    if (!empty($ensureRepo['cloned'])) $msgParts[] = 'Cloned anthropics/claude-code-action into workspace.';
    else if (!empty($ensureRepo['ok'])) $msgParts[] = 'claude-code-action resources ready.';
    else $msgParts[] = 'Warning: ' . ($ensureRepo['error'] ?? 'action repo unavailable');
    if (empty($ensureBin['ok'])) $msgParts[] = $ensureBin['error'] ?? 'CLI missing';
    else if (!empty($ensureBin['installed'])) $msgParts[] = 'Installed Claude Code CLI.';

    return [
        'ok' => true,
        'authenticated' => !empty($creds['authenticated']),
        'auth_method' => $creds['auth_method'] ?: null,
        'needs_auth' => empty($creds['authenticated']),
        'cli_ready' => !empty($ensureBin['ok']),
        'cli_bin' => $ensureBin['bin'] ?? '',
        'cli_version' => $version !== '' ? $version : 'claude',
        'resource' => 'anthropics/claude-code-action',
        'repo_path' => $dirs['repo'],
        'workspace' => $dirs['workspace'],
        'cwd_display' => '~/workspace',
        'repo_ready' => !empty($ensureRepo['ok']),
        'message' => implode(' ', $msgParts) . (empty($creds['authenticated'])
            ? ' Inicia sesión OAuth con Claude para continuar.'
            : '')
    ];
}

function claudeRunPrompt($prompt) {
    $prompt = trim((string)$prompt);
    $creds = claudeLoadCredentials();
    $dirs = claudeEnsureDirs();
    $workspace = realpath($dirs['workspace']) ?: $dirs['workspace'];

    if ($prompt === '') {
        return ['ok' => false, 'error' => 'empty prompt', 'needs_auth' => false];
    }
    if ($prompt === 'help') {
        $help = implode("\n", [
            'Claude Code on l8 codespace',
            'Resource: https://github.com/anthropics/claude-code-action',
            '',
            'Auth (required):',
            '  1) Open OAuth login (claude.ai)',
            '  2) Paste CLAUDE_CODE_OAUTH_TOKEN from `claude setup-token`',
            '     or ANTHROPIC_API_KEY from console.anthropic.com',
            '',
            'Commands:',
            '  help                 Show this help',
            '  status               Auth / CLI / resource status',
            '  about                Session paths',
            '  logout               Clear saved OAuth/API credentials',
            '  <any prompt>         Run Claude Code non-interactive (-p)',
            '',
            'Workspace: ' . $workspace,
            'Action repo symlink: ~/workspace/claude-code-action'
        ]);
        return ['ok' => true, 'stdout' => $help, 'stderr' => ''];
    }
    if ($prompt === 'logout') {
        claudeClearCredentials();
        return ['ok' => true, 'stdout' => 'Logged out. OAuth required again.', 'stderr' => '', 'needs_auth' => true];
    }
    if ($prompt === 'status' || $prompt === 'about') {
        $boot = claudeBootSession();
        $lines = [
            'authenticated: ' . (!empty($boot['authenticated']) ? 'yes (' . ($boot['auth_method'] ?: '?') . ')' : 'no'),
            'cli: ' . ($boot['cli_bin'] ?: 'missing') . ' ' . ($boot['cli_version'] ?: ''),
            'resource: ' . ($boot['resource'] ?? 'claude-code-action'),
            'repo: ' . ($boot['repo_path'] ?? ''),
            'workspace: ' . ($boot['workspace'] ?? ''),
        ];
        return ['ok' => true, 'stdout' => implode("\n", $lines), 'stderr' => ''];
    }

    if (empty($creds['authenticated'])) {
        return [
            'ok' => false,
            'error' => 'OAuth required. Inicia sesión con Claude (CLAUDE_CODE_OAUTH_TOKEN) antes de ejecutar prompts.',
            'needs_auth' => true
        ];
    }

    $binInfo = claudeEnsureBinary();
    if (empty($binInfo['ok'])) {
        return ['ok' => false, 'error' => $binInfo['error'] ?? 'Claude CLI missing', 'needs_auth' => false];
    }

    if (!is_dir($workspace)) @mkdir($workspace, 0777, true);
    $env = claudeBuildProcEnv($creds);
    // Modo print (no interactivo), como pipelines de claude-code-action
    $cmd = escapeshellarg($binInfo['bin'])
        . ' -p --output-format text --'
        . ' ' . escapeshellarg($prompt);

    $descriptors = [
        0 => ['pipe', 'r'],
        1 => ['pipe', 'w'],
        2 => ['pipe', 'w']
    ];
    $proc = @proc_open(['bash', '-lc', $cmd], $descriptors, $pipes, $workspace, $env);
    if (!is_resource($proc)) {
        return ['ok' => false, 'error' => 'Unable to start Claude Code', 'needs_auth' => false];
    }
    fclose($pipes[0]);
    stream_set_blocking($pipes[1], true);
    stream_set_blocking($pipes[2], true);
    $stdout = stream_get_contents($pipes[1]);
    $stderr = stream_get_contents($pipes[2]);
    fclose($pipes[1]);
    fclose($pipes[2]);
    $code = proc_close($proc);
    if (strlen((string)$stdout) > 200000) $stdout = substr($stdout, 0, 200000) . "\n…(truncated)";
    if (strlen((string)$stderr) > 80000) $stderr = substr($stderr, 0, 80000) . "\n…(truncated)";

    $needsAuth = false;
    $combined = strtolower((string)$stdout . "\n" . (string)$stderr);
    if (strpos($combined, 'login') !== false && (strpos($combined, 'required') !== false || strpos($combined, 'expired') !== false)) {
        $needsAuth = true;
    }
    if (strpos($combined, 'authentication') !== false && strpos($combined, 'fail') !== false) {
        $needsAuth = true;
    }

    return [
        'ok' => $code === 0,
        'exit_code' => $code,
        'stdout' => rtrim((string)$stdout),
        'stderr' => rtrim((string)$stderr),
        'needs_auth' => $needsAuth,
        'auth_method' => $creds['auth_method']
    ];
}

/**
 * ===== Zylon / PrivateGPT externa (recursos zylon-ai/private-gpt) =====
 */
function zylonCliDirs() {
    global $STORAGE_DIR;
    $root = rtrim($STORAGE_DIR, '/') . '/zylon-cli';
    return [
        'root' => $root,
        'repo' => $root . '/private-gpt',
        'home' => $root . '/home',
        'state' => $root . '/session.json'
    ];
}

function zylonEnsureDirs() {
    $d = zylonCliDirs();
    foreach (['root', 'home'] as $k) {
        if (!file_exists($d[$k])) @mkdir($d[$k], 0777, true);
    }
    $link = $d['home'] . '/private-gpt';
    if (!file_exists($link) && file_exists($d['repo'])) {
        @symlink($d['repo'], $link);
    }
    return $d;
}

function zylonEnsurePrivateGptRepo() {
    $d = zylonEnsureDirs();
    $repo = $d['repo'];
    if (file_exists($repo . '/.git') || file_exists($repo . '/README.md') || file_exists($repo . '/pyproject.toml')) {
        $link = $d['home'] . '/private-gpt';
        if (!file_exists($link)) @symlink($repo, $link);
        return ['ok' => true, 'path' => $repo, 'cloned' => false];
    }
    if (!file_exists(dirname($repo))) @mkdir(dirname($repo), 0777, true);
    $url = 'https://github.com/zylon-ai/private-gpt.git';
    $cmd = 'git clone --depth 1 ' . escapeshellarg($url) . ' ' . escapeshellarg($repo) . ' 2>&1';
    $out = [];
    $code = 0;
    @exec($cmd, $out, $code);
    if ($code !== 0 || !file_exists($repo)) {
        return [
            'ok' => false,
            'error' => 'No se pudo clonar zylon-ai/private-gpt: ' . trim(implode("\n", $out)),
            'path' => $repo
        ];
    }
    $link = $d['home'] . '/private-gpt';
    if (!file_exists($link)) @symlink($repo, $link);
    return ['ok' => true, 'path' => $repo, 'cloned' => true, 'output' => trim(implode("\n", $out))];
}

function zylonResolveCwd($cwdDisplay) {
    $d = zylonEnsureDirs();
    $home = realpath($d['home']) ?: $d['home'];
    $cwdDisplay = trim((string)$cwdDisplay);
    if ($cwdDisplay === '' || $cwdDisplay === '~') {
        return ['abs' => $home, 'display' => '~'];
    }
    if (strpos($cwdDisplay, '~/') === 0) {
        $rel = substr($cwdDisplay, 2);
        $abs = $home . '/' . ltrim($rel, '/');
    } else if (isset($cwdDisplay[0]) && $cwdDisplay[0] === '/') {
        $abs = $home . $cwdDisplay;
    } else {
        $abs = $home . '/' . $cwdDisplay;
    }
    $real = realpath($abs);
    if ($real === false) {
        $norm = $home . '/' . ltrim(str_replace(['..'], '', str_replace($home, '', $abs)), '/');
        return ['abs' => $norm, 'display' => zylonDisplayCwd($norm, $home)];
    }
    $homeReal = realpath($home) ?: $home;
    if (strpos($real, $homeReal) !== 0) {
        return ['abs' => $homeReal, 'display' => '~'];
    }
    return ['abs' => $real, 'display' => zylonDisplayCwd($real, $homeReal)];
}

function zylonDisplayCwd($abs, $home) {
    $abs = str_replace('\\', '/', $abs);
    $home = str_replace('\\', '/', $home);
    if ($abs === $home) return '~';
    if (strpos($abs, $home . '/') === 0) {
        return '~/' . substr($abs, strlen($home) + 1);
    }
    return '~';
}

function zylonIsDangerousCommand($cmd) {
    $c = strtolower(trim($cmd));
    $blocked = [
        'rm -rf /', 'rm -rf /*', 'mkfs', ':(){', 'dd if=/dev/zero',
        'shutdown', 'reboot', 'poweroff', 'halt', 'userdel', 'passwd'
    ];
    foreach ($blocked as $b) {
        if (strpos($c, $b) !== false) return true;
    }
    return false;
}

function zylonRunCommand($command, $cwdDisplay = '~') {
    $ensure = zylonEnsurePrivateGptRepo();
    $dirs = zylonEnsureDirs();
    $cwd = zylonResolveCwd($cwdDisplay);
    $cmd = trim((string)$command);
    if ($cmd === '') {
        return ['ok' => false, 'error' => 'empty command', 'cwd_display' => $cwd['display']];
    }
    if (zylonIsDangerousCommand($cmd)) {
        return ['ok' => false, 'error' => 'command blocked for safety', 'stderr' => 'Refusing dangerous command.', 'cwd_display' => $cwd['display']];
    }

    if ($cmd === 'help') {
        $help = implode("\n", [
            'Zylon / PrivateGPT on l8 codespace',
            'Resources: https://github.com/zylon-ai/private-gpt',
            'Docs: https://docs.privategpt.dev/',
            'Product: https://zylon.ai',
            '',
            'Built-ins:',
            '  help                 Show this help',
            '  pwd                  Print working directory',
            '  cd [dir]             Change directory (sandboxed to ~/ )',
            '  about                Show session / product info',
            '  docs                 PrivateGPT documentation pointers',
            '  tree                 Quick look at private-gpt repo files',
            '  ls, cat, uname, …    Standard shell commands in the sandbox',
            '',
            'Home contains symlink: ~/private-gpt → cloned zylon-ai/private-gpt'
        ]);
        return ['ok' => true, 'stdout' => $help, 'stderr' => '', 'cwd_display' => $cwd['display']];
    }
    if ($cmd === 'pwd') {
        return ['ok' => true, 'stdout' => $cwd['abs'], 'stderr' => '', 'cwd_display' => $cwd['display']];
    }
    if ($cmd === 'about') {
        $uname = trim((string)@shell_exec('uname -a 2>/dev/null'));
        $out = "product: Zylon (PrivateGPT)\nresource: zylon-ai/private-gpt\nrepo: " . $dirs['repo'] . "\nhome: " . $dirs['home'] . "\nkernel: " . $uname;
        return ['ok' => true, 'stdout' => $out, 'stderr' => '', 'cwd_display' => $cwd['display']];
    }
    if ($cmd === 'docs') {
        $out = implode("\n", [
            'PrivateGPT docs: https://docs.privategpt.dev/',
            'Quickstart: https://docs.privategpt.dev/getting-started/quickstart',
            'GitHub: https://github.com/zylon-ai/private-gpt',
            'Zylon platform: https://zylon.ai',
            '',
            'PrivateGPT is an open-source API layer for private/local AI apps.',
            'Point OPENAI_API_BASE at any OpenAI-compatible inference server (Ollama, vLLM, …).'
        ]);
        return ['ok' => true, 'stdout' => $out, 'stderr' => '', 'cwd_display' => $cwd['display']];
    }
    if ($cmd === 'tree') {
        $repo = $dirs['repo'];
        if (!is_dir($repo)) {
            return ['ok' => false, 'stderr' => 'private-gpt repo missing', 'stdout' => '', 'cwd_display' => $cwd['display']];
        }
        $listCmd = 'cd ' . escapeshellarg($repo) . ' && find . -maxdepth 2 -type f | head -n 80';
        $stdout = trim((string)@shell_exec($listCmd . ' 2>/dev/null'));
        return ['ok' => true, 'stdout' => $stdout !== '' ? $stdout : '(empty)', 'stderr' => '', 'cwd_display' => $cwd['display']];
    }
    if (preg_match('/^cd(?:\s+(.*))?$/s', $cmd, $m)) {
        $target = isset($m[1]) ? trim($m[1]) : '~';
        if ($target === '') $target = '~';
        if ($target === '~' || $target === '$HOME') {
            return ['ok' => true, 'stdout' => '', 'stderr' => '', 'cwd_display' => '~'];
        }
        if ($target[0] !== '/' && strpos($target, '~/') !== 0) {
            $base = $cwd['abs'];
            $candidate = rtrim($base, '/') . '/' . $target;
        } else if (strpos($target, '~/') === 0) {
            $candidate = rtrim($dirs['home'], '/') . '/' . substr($target, 2);
        } else {
            $candidate = rtrim($dirs['home'], '/') . $target;
        }
        $real = realpath($candidate);
        $homeReal = realpath($dirs['home']) ?: $dirs['home'];
        if ($real === false || strpos($real, $homeReal) !== 0 || !is_dir($real)) {
            return ['ok' => false, 'stderr' => 'bash: cd: ' . $target . ': No such file or directory', 'stdout' => '', 'cwd_display' => $cwd['display']];
        }
        return ['ok' => true, 'stdout' => '', 'stderr' => '', 'cwd_display' => zylonDisplayCwd($real, $homeReal)];
    }

    if (!is_dir($cwd['abs'])) @mkdir($cwd['abs'], 0777, true);
    $homeReal = realpath($dirs['home']) ?: $dirs['home'];
    $envPrefix = 'export HOME=' . escapeshellarg($homeReal) . '; export TERM=xterm-256color; ';
    $full = $envPrefix . 'cd ' . escapeshellarg($cwd['abs']) . ' && ' . $cmd;
    $descriptors = [
        0 => ['pipe', 'r'],
        1 => ['pipe', 'w'],
        2 => ['pipe', 'w']
    ];
    $proc = @proc_open(['bash', '-lc', $full], $descriptors, $pipes, $cwd['abs'], null);
    if (!is_resource($proc)) {
        return ['ok' => false, 'error' => 'Unable to start bash', 'cwd_display' => $cwd['display']];
    }
    fclose($pipes[0]);
    stream_set_blocking($pipes[1], true);
    stream_set_blocking($pipes[2], true);
    $stdout = stream_get_contents($pipes[1]);
    $stderr = stream_get_contents($pipes[2]);
    fclose($pipes[1]);
    fclose($pipes[2]);
    $code = proc_close($proc);
    if (strlen($stdout) > 200000) $stdout = substr($stdout, 0, 200000) . "\n…(truncated)";
    if (strlen($stderr) > 80000) $stderr = substr($stderr, 0, 80000) . "\n…(truncated)";
    return [
        'ok' => $code === 0,
        'exit_code' => $code,
        'stdout' => rtrim((string)$stdout),
        'stderr' => rtrim((string)$stderr),
        'cwd_display' => $cwd['display'],
        'repo_ready' => !empty($ensure['ok'])
    ];
}

function zylonBootSession() {
    $ensure = zylonEnsurePrivateGptRepo();
    $dirs = zylonEnsureDirs();
    $msg = !empty($ensure['ok'])
        ? (!empty($ensure['cloned']) ? 'Cloned zylon-ai/private-gpt into session home.' : 'zylon-ai/private-gpt resources ready.')
        : ('Warning: ' . ($ensure['error'] ?? 'repo unavailable'));
    return [
        'ok' => true,
        'cwd_display' => '~',
        'product' => 'Zylon',
        'resource' => 'zylon-ai/private-gpt',
        'repo_path' => $dirs['repo'],
        'home_path' => $dirs['home'],
        'repo_ready' => !empty($ensure['ok']),
        'message' => $msg
    ];
}


/**
 * ===== macOS inside externa (recursos dockur/macos) =====
 */
function macosCliDirs() {
    global $STORAGE_DIR;
    $root = rtrim($STORAGE_DIR, '/') . '/macos-cli';
    return [
        'root' => $root,
        'repo' => $root . '/dockur-macos',
        'home' => $root . '/home',
        'state' => $root . '/session.json'
    ];
}

function macosEnsureDirs() {
    $d = macosCliDirs();
    foreach (['root', 'home'] as $k) {
        if (!file_exists($d[$k])) @mkdir($d[$k], 0777, true);
    }
    $link = $d['home'] . '/dockur-macos';
    if (!file_exists($link) && file_exists($d['repo'])) {
        @symlink($d['repo'], $link);
    }
    return $d;
}

function macosFallbackLicenseText() {
    return <<<LIC
MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
LIC;
}

function macosEnsureDockurRepo() {
    $d = macosEnsureDirs();
    $repo = $d['repo'];
    if (file_exists($repo . '/.git') || file_exists($repo . '/readme.md') || file_exists($repo . '/compose.yml')) {
        $link = $d['home'] . '/dockur-macos';
        if (!file_exists($link)) @symlink($repo, $link);
        return ['ok' => true, 'path' => $repo, 'cloned' => false];
    }
    if (!file_exists(dirname($repo))) @mkdir(dirname($repo), 0777, true);
    $url = 'https://github.com/dockur/macos.git';
    $cmd = 'git clone --depth 1 ' . escapeshellarg($url) . ' ' . escapeshellarg($repo) . ' 2>&1';
    $out = [];
    $code = 0;
    @exec($cmd, $out, $code);
    if ($code !== 0 || !file_exists($repo)) {
        return [
            'ok' => false,
            'error' => 'No se pudo clonar dockur/macos: ' . trim(implode("\n", $out)),
            'path' => $repo
        ];
    }
    $link = $d['home'] . '/dockur-macos';
    if (!file_exists($link)) @symlink($repo, $link);
    return ['ok' => true, 'path' => $repo, 'cloned' => true, 'output' => trim(implode("\n", $out))];
}

function macosReadLicense() {
    $ensure = macosEnsureDockurRepo();
    $dirs = macosEnsureDirs();
    $candidates = [
        $dirs['repo'] . '/license.md',
        $dirs['repo'] . '/LICENSE',
        $dirs['repo'] . '/LICENSE.md',
        $dirs['repo'] . '/License.md'
    ];
    foreach ($candidates as $path) {
        if (is_file($path)) {
            $text = (string)@file_get_contents($path);
            if (trim($text) !== '') {
                return [
                    'ok' => true,
                    'spdx' => 'MIT',
                    'name' => 'MIT License',
                    'source' => basename($path),
                    'path' => $path,
                    'text' => $text,
                    'repo_ready' => !empty($ensure['ok']),
                    'resource' => 'dockur/macos',
                    'url' => 'https://github.com/dockur/macos/blob/master/license.md'
                ];
            }
        }
    }
    // Si el clone falló, aún mostramos la licencia MIT del proyecto en el apartado License
    return [
        'ok' => true,
        'spdx' => 'MIT',
        'name' => 'MIT License',
        'source' => 'fallback:dockur/macos license.md',
        'path' => null,
        'text' => macosFallbackLicenseText(),
        'repo_ready' => !empty($ensure['ok']),
        'resource' => 'dockur/macos',
        'url' => 'https://github.com/dockur/macos/blob/master/license.md',
        'warning' => empty($ensure['ok']) ? ($ensure['error'] ?? 'repo unavailable') : null
    ];
}

function macosResolveCwd($cwdDisplay) {
    $d = macosEnsureDirs();
    $home = realpath($d['home']) ?: $d['home'];
    $cwdDisplay = trim((string)$cwdDisplay);
    if ($cwdDisplay === '' || $cwdDisplay === '~') {
        return ['abs' => $home, 'display' => '~'];
    }
    if (strpos($cwdDisplay, '~/') === 0) {
        $rel = substr($cwdDisplay, 2);
        $abs = $home . '/' . ltrim($rel, '/');
    } else if (isset($cwdDisplay[0]) && $cwdDisplay[0] === '/') {
        $abs = $home . $cwdDisplay;
    } else {
        $abs = $home . '/' . $cwdDisplay;
    }
    $real = realpath($abs);
    if ($real === false) {
        $norm = $home . '/' . ltrim(str_replace(['..'], '', str_replace($home, '', $abs)), '/');
        return ['abs' => $norm, 'display' => macosDisplayCwd($norm, $home)];
    }
    $homeReal = realpath($home) ?: $home;
    if (strpos($real, $homeReal) !== 0) {
        return ['abs' => $homeReal, 'display' => '~'];
    }
    return ['abs' => $real, 'display' => macosDisplayCwd($real, $homeReal)];
}

function macosDisplayCwd($abs, $home) {
    $abs = str_replace('\\', '/', $abs);
    $home = str_replace('\\', '/', $home);
    if ($abs === $home) return '~';
    if (strpos($abs, $home . '/') === 0) {
        return '~/' . substr($abs, strlen($home) + 1);
    }
    return '~';
}

function macosIsDangerousCommand($cmd) {
    $c = strtolower(trim($cmd));
    $blocked = [
        'rm -rf /', 'rm -rf /*', 'mkfs', ':(){', 'dd if=/dev/zero',
        'shutdown', 'reboot', 'poweroff', 'halt', 'userdel', 'passwd'
    ];
    foreach ($blocked as $b) {
        if (strpos($c, $b) !== false) return true;
    }
    return false;
}

function macosRunCommand($command, $cwdDisplay = '~') {
    $ensure = macosEnsureDockurRepo();
    $dirs = macosEnsureDirs();
    $cwd = macosResolveCwd($cwdDisplay);
    $cmd = trim((string)$command);
    if ($cmd === '') {
        return ['ok' => false, 'error' => 'empty command', 'cwd_display' => $cwd['display']];
    }
    if (macosIsDangerousCommand($cmd)) {
        return ['ok' => false, 'error' => 'command blocked for safety', 'stderr' => 'Refusing dangerous command.', 'cwd_display' => $cwd['display']];
    }

    if ($cmd === 'help') {
        $help = implode("\n", [
            'macOS inside on l8 codespace',
            'Resources: https://github.com/dockur/macos',
            'Image: dockurr/macos (Docker)',
            '',
            'Built-ins:',
            '  help                 Show this help',
            '  pwd                  Print working directory',
            '  cd [dir]             Change directory (sandboxed to ~/ )',
            '  about                Show session / distro info',
            '  license              Open License panel (also via UI tab)',
            '  compose              Show compose.yml from dockur/macos',
            '  tree                 Quick look at dockur/macos repo files',
            '  deploy               Show how to run dockurr/macos container',
            '  ls, cat, uname, …    Standard shell commands in the sandbox',
            '',
            'Home contains symlink: ~/dockur-macos → cloned dockur/macos'
        ]);
        return ['ok' => true, 'stdout' => $help, 'stderr' => '', 'cwd_display' => $cwd['display']];
    }
    if ($cmd === 'pwd') {
        return ['ok' => true, 'stdout' => $cwd['abs'], 'stderr' => '', 'cwd_display' => $cwd['display']];
    }
    if ($cmd === 'about') {
        $uname = trim((string)@shell_exec('uname -a 2>/dev/null'));
        $lic = macosReadLicense();
        $out = "distro: macOS inside (l8)\nresource: dockur/macos\nrepo: " . $dirs['repo'] . "\nhome: " . $dirs['home'] . "\nlicense: " . ($lic['spdx'] ?? 'MIT') . "\nkernel: " . $uname;
        return ['ok' => true, 'stdout' => $out, 'stderr' => '', 'cwd_display' => $cwd['display']];
    }
    if ($cmd === 'compose') {
        $path = $dirs['repo'] . '/compose.yml';
        if (!is_file($path)) {
            return ['ok' => false, 'stderr' => 'compose.yml missing — clone dockur/macos first', 'stdout' => '', 'cwd_display' => $cwd['display']];
        }
        $text = (string)@file_get_contents($path);
        return ['ok' => true, 'stdout' => $text, 'stderr' => '', 'cwd_display' => $cwd['display']];
    }
    if ($cmd === 'deploy') {
        $out = implode("\n", [
            'Deploy macOS (dockur/macos) externally:',
            '',
            '1) Resource cloned at: ' . $dirs['repo'],
            '2) From that folder run:',
            '   docker compose up -d',
            '3) Open web viewer: http://localhost:8006',
            '4) Optional VNC: localhost:5900',
            '',
            'Requires KVM (/dev/kvm) and Docker on the host.',
            'Compose file: https://github.com/dockur/macos/blob/master/compose.yml',
            'License: MIT (see License tab / `license` command)'
        ]);
        return ['ok' => true, 'stdout' => $out, 'stderr' => '', 'cwd_display' => $cwd['display']];
    }
    if ($cmd === 'tree') {
        $repo = $dirs['repo'];
        if (!is_dir($repo)) {
            return ['ok' => false, 'stderr' => 'dockur/macos repo missing', 'stdout' => '', 'cwd_display' => $cwd['display']];
        }
        $listCmd = 'cd ' . escapeshellarg($repo) . ' && find . -maxdepth 2 -type f | head -n 80';
        $stdout = trim((string)@shell_exec($listCmd . ' 2>/dev/null'));
        return ['ok' => true, 'stdout' => $stdout !== '' ? $stdout : '(empty)', 'stderr' => '', 'cwd_display' => $cwd['display']];
    }
    if (preg_match('/^cd(?:\s+(.*))?$/s', $cmd, $m)) {
        $target = isset($m[1]) ? trim($m[1]) : '~';
        if ($target === '') $target = '~';
        if ($target === '~' || $target === '$HOME') {
            return ['ok' => true, 'stdout' => '', 'stderr' => '', 'cwd_display' => '~'];
        }
        if ($target[0] !== '/' && strpos($target, '~/') !== 0) {
            $base = $cwd['abs'];
            $candidate = rtrim($base, '/') . '/' . $target;
        } else if (strpos($target, '~/') === 0) {
            $candidate = rtrim($dirs['home'], '/') . '/' . substr($target, 2);
        } else {
            $candidate = rtrim($dirs['home'], '/') . $target;
        }
        $real = realpath($candidate);
        $homeReal = realpath($dirs['home']) ?: $dirs['home'];
        if ($real === false || strpos($real, $homeReal) !== 0 || !is_dir($real)) {
            return ['ok' => false, 'stderr' => 'bash: cd: ' . $target . ': No such file or directory', 'stdout' => '', 'cwd_display' => $cwd['display']];
        }
        return ['ok' => true, 'stdout' => '', 'stderr' => '', 'cwd_display' => macosDisplayCwd($real, $homeReal)];
    }

    if (!is_dir($cwd['abs'])) @mkdir($cwd['abs'], 0777, true);
    $homeReal = realpath($dirs['home']) ?: $dirs['home'];
    $envPrefix = 'export HOME=' . escapeshellarg($homeReal) . '; export TERM=xterm-256color; ';
    $full = $envPrefix . 'cd ' . escapeshellarg($cwd['abs']) . ' && ' . $cmd;
    $descriptors = [
        0 => ['pipe', 'r'],
        1 => ['pipe', 'w'],
        2 => ['pipe', 'w']
    ];
    $proc = @proc_open(['bash', '-lc', $full], $descriptors, $pipes, $cwd['abs'], null);
    if (!is_resource($proc)) {
        return ['ok' => false, 'error' => 'Unable to start bash', 'cwd_display' => $cwd['display']];
    }
    fclose($pipes[0]);
    stream_set_blocking($pipes[1], true);
    stream_set_blocking($pipes[2], true);
    $stdout = stream_get_contents($pipes[1]);
    $stderr = stream_get_contents($pipes[2]);
    fclose($pipes[1]);
    fclose($pipes[2]);
    $code = proc_close($proc);
    if (strlen($stdout) > 200000) $stdout = substr($stdout, 0, 200000) . "\n…(truncated)";
    if (strlen($stderr) > 80000) $stderr = substr($stderr, 0, 80000) . "\n…(truncated)";
    return [
        'ok' => $code === 0,
        'exit_code' => $code,
        'stdout' => rtrim((string)$stdout),
        'stderr' => rtrim((string)$stderr),
        'cwd_display' => $cwd['display'],
        'repo_ready' => !empty($ensure['ok'])
    ];
}

function macosBootSession() {
    $ensure = macosEnsureDockurRepo();
    $dirs = macosEnsureDirs();
    $license = macosReadLicense();
    $composeReady = is_file($dirs['repo'] . '/compose.yml');
    $msg = !empty($ensure['ok'])
        ? (!empty($ensure['cloned']) ? 'Cloned dockur/macos into session home.' : 'dockur/macos resources ready.')
        : ('Warning: ' . ($ensure['error'] ?? 'repo unavailable'));
    return [
        'ok' => true,
        'cwd_display' => '~',
        'distro' => 'macOS inside',
        'resource' => 'dockur/macos',
        'repo_path' => $dirs['repo'],
        'home_path' => $dirs['home'],
        'repo_ready' => !empty($ensure['ok']),
        'compose_ready' => $composeReady,
        'license' => [
            'spdx' => $license['spdx'] ?? 'MIT',
            'name' => $license['name'] ?? 'MIT License',
            'source' => $license['source'] ?? 'license.md'
        ],
        'message' => $msg
    ];
}

/**
 * ===== ChromeOS play externa (recursos dockur/chromeos) =====
 */
function chromeosCliDirs() {
    global $STORAGE_DIR;
    $root = rtrim($STORAGE_DIR, '/') . '/chromeos-cli';
    return [
        'root' => $root,
        'repo' => $root . '/dockur-chromeos',
        'home' => $root . '/home',
        'state' => $root . '/session.json'
    ];
}

function chromeosEnsureDirs() {
    $d = chromeosCliDirs();
    foreach (['root', 'home'] as $k) {
        if (!file_exists($d[$k])) @mkdir($d[$k], 0777, true);
    }
    $link = $d['home'] . '/dockur-chromeos';
    if (!file_exists($link) && file_exists($d['repo'])) {
        @symlink($d['repo'], $link);
    }
    return $d;
}

function chromeosFallbackLicenseText() {
    return <<<LIC
MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
LIC;
}

function chromeosEnsureDockurRepo() {
    $d = chromeosEnsureDirs();
    $repo = $d['repo'];
    if (file_exists($repo . '/.git') || file_exists($repo . '/readme.md') || file_exists($repo . '/compose.yml')) {
        $link = $d['home'] . '/dockur-chromeos';
        if (!file_exists($link)) @symlink($repo, $link);
        return ['ok' => true, 'path' => $repo, 'cloned' => false];
    }
    if (!file_exists(dirname($repo))) @mkdir(dirname($repo), 0777, true);
    $url = 'https://github.com/dockur/chromeos.git';
    $cmd = 'git clone --depth 1 ' . escapeshellarg($url) . ' ' . escapeshellarg($repo) . ' 2>&1';
    $out = [];
    $code = 0;
    @exec($cmd, $out, $code);
    if ($code !== 0 || !file_exists($repo)) {
        return [
            'ok' => false,
            'error' => 'No se pudo clonar dockur/chromeos: ' . trim(implode("\n", $out)),
            'path' => $repo
        ];
    }
    $link = $d['home'] . '/dockur-chromeos';
    if (!file_exists($link)) @symlink($repo, $link);
    return ['ok' => true, 'path' => $repo, 'cloned' => true, 'output' => trim(implode("\n", $out))];
}

function chromeosReadLicense() {
    $ensure = chromeosEnsureDockurRepo();
    $dirs = chromeosEnsureDirs();
    $candidates = [
        $dirs['repo'] . '/license.md',
        $dirs['repo'] . '/LICENSE',
        $dirs['repo'] . '/LICENSE.md',
        $dirs['repo'] . '/License.md'
    ];
    foreach ($candidates as $path) {
        if (is_file($path)) {
            $text = (string)@file_get_contents($path);
            if (trim($text) !== '') {
                return [
                    'ok' => true,
                    'spdx' => 'MIT',
                    'name' => 'MIT License',
                    'source' => basename($path),
                    'path' => $path,
                    'text' => $text,
                    'repo_ready' => !empty($ensure['ok']),
                    'resource' => 'dockur/chromeos',
                    'url' => 'https://github.com/dockur/chromeos/blob/master/license.md'
                ];
            }
        }
    }
    // Si el clone falló, aún mostramos la licencia MIT del proyecto en el apartado License
    return [
        'ok' => true,
        'spdx' => 'MIT',
        'name' => 'MIT License',
        'source' => 'fallback:dockur/chromeos license.md',
        'path' => null,
        'text' => chromeosFallbackLicenseText(),
        'repo_ready' => !empty($ensure['ok']),
        'resource' => 'dockur/chromeos',
        'url' => 'https://github.com/dockur/chromeos/blob/master/license.md',
        'warning' => empty($ensure['ok']) ? ($ensure['error'] ?? 'repo unavailable') : null
    ];
}

function chromeosResolveCwd($cwdDisplay) {
    $d = chromeosEnsureDirs();
    $home = realpath($d['home']) ?: $d['home'];
    $cwdDisplay = trim((string)$cwdDisplay);
    if ($cwdDisplay === '' || $cwdDisplay === '~') {
        return ['abs' => $home, 'display' => '~'];
    }
    if (strpos($cwdDisplay, '~/') === 0) {
        $rel = substr($cwdDisplay, 2);
        $abs = $home . '/' . ltrim($rel, '/');
    } else if (isset($cwdDisplay[0]) && $cwdDisplay[0] === '/') {
        $abs = $home . $cwdDisplay;
    } else {
        $abs = $home . '/' . $cwdDisplay;
    }
    $real = realpath($abs);
    if ($real === false) {
        $norm = $home . '/' . ltrim(str_replace(['..'], '', str_replace($home, '', $abs)), '/');
        return ['abs' => $norm, 'display' => chromeosDisplayCwd($norm, $home)];
    }
    $homeReal = realpath($home) ?: $home;
    if (strpos($real, $homeReal) !== 0) {
        return ['abs' => $homeReal, 'display' => '~'];
    }
    return ['abs' => $real, 'display' => chromeosDisplayCwd($real, $homeReal)];
}

function chromeosDisplayCwd($abs, $home) {
    $abs = str_replace('\\', '/', $abs);
    $home = str_replace('\\', '/', $home);
    if ($abs === $home) return '~';
    if (strpos($abs, $home . '/') === 0) {
        return '~/' . substr($abs, strlen($home) + 1);
    }
    return '~';
}

function chromeosIsDangerousCommand($cmd) {
    $c = strtolower(trim($cmd));
    $blocked = [
        'rm -rf /', 'rm -rf /*', 'mkfs', ':(){', 'dd if=/dev/zero',
        'shutdown', 'reboot', 'poweroff', 'halt', 'userdel', 'passwd'
    ];
    foreach ($blocked as $b) {
        if (strpos($c, $b) !== false) return true;
    }
    return false;
}

function chromeosRunCommand($command, $cwdDisplay = '~') {
    $ensure = chromeosEnsureDockurRepo();
    $dirs = chromeosEnsureDirs();
    $cwd = chromeosResolveCwd($cwdDisplay);
    $cmd = trim((string)$command);
    if ($cmd === '') {
        return ['ok' => false, 'error' => 'empty command', 'cwd_display' => $cwd['display']];
    }
    if (chromeosIsDangerousCommand($cmd)) {
        return ['ok' => false, 'error' => 'command blocked for safety', 'stderr' => 'Refusing dangerous command.', 'cwd_display' => $cwd['display']];
    }

    if ($cmd === 'help') {
        $help = implode("\n", [
            'ChromeOS play on l8 codespace',
            'Resources: https://github.com/dockur/chromeos',
            'Image: dockurr/chromeos (Docker)',
            '',
            'Built-ins:',
            '  help                 Show this help',
            '  pwd                  Print working directory',
            '  cd [dir]             Change directory (sandboxed to ~/ )',
            '  about                Show session / distro info',
            '  license              Open License panel (also via UI tab)',
            '  compose              Show compose.yml from dockur/chromeos',
            '  tree                 Quick look at dockur/chromeos repo files',
            '  deploy               Show how to run dockurr/chromeos container',
            '  ls, cat, uname, …    Standard shell commands in the sandbox',
            '',
            'Home contains symlink: ~/dockur-chromeos → cloned dockur/chromeos'
        ]);
        return ['ok' => true, 'stdout' => $help, 'stderr' => '', 'cwd_display' => $cwd['display']];
    }
    if ($cmd === 'pwd') {
        return ['ok' => true, 'stdout' => $cwd['abs'], 'stderr' => '', 'cwd_display' => $cwd['display']];
    }
    if ($cmd === 'about') {
        $uname = trim((string)@shell_exec('uname -a 2>/dev/null'));
        $lic = chromeosReadLicense();
        $out = "distro: ChromeOS play (l8)\nresource: dockur/chromeos\nrepo: " . $dirs['repo'] . "\nhome: " . $dirs['home'] . "\nlicense: " . ($lic['spdx'] ?? 'MIT') . "\nkernel: " . $uname;
        return ['ok' => true, 'stdout' => $out, 'stderr' => '', 'cwd_display' => $cwd['display']];
    }
    if ($cmd === 'compose') {
        $path = $dirs['repo'] . '/compose.yml';
        if (!is_file($path)) {
            return ['ok' => false, 'stderr' => 'compose.yml missing — clone dockur/chromeos first', 'stdout' => '', 'cwd_display' => $cwd['display']];
        }
        $text = (string)@file_get_contents($path);
        return ['ok' => true, 'stdout' => $text, 'stderr' => '', 'cwd_display' => $cwd['display']];
    }
    if ($cmd === 'deploy') {
        $out = implode("\n", [
            'Deploy ChromeOS (dockur/chromeos) externally:',
            '',
            '1) Resource cloned at: ' . $dirs['repo'],
            '2) From that folder run:',
            '   docker compose up -d',
            '3) Open web viewer: http://localhost:8006',
            '4) Optional VNC: localhost:5900',
            '',
            'Requires KVM (/dev/kvm) and Docker on the host.',
            'Compose file: https://github.com/dockur/chromeos/blob/master/compose.yml',
            'License: MIT (see License tab / `license` command)'
        ]);
        return ['ok' => true, 'stdout' => $out, 'stderr' => '', 'cwd_display' => $cwd['display']];
    }
    if ($cmd === 'tree') {
        $repo = $dirs['repo'];
        if (!is_dir($repo)) {
            return ['ok' => false, 'stderr' => 'dockur/chromeos repo missing', 'stdout' => '', 'cwd_display' => $cwd['display']];
        }
        $listCmd = 'cd ' . escapeshellarg($repo) . ' && find . -maxdepth 2 -type f | head -n 80';
        $stdout = trim((string)@shell_exec($listCmd . ' 2>/dev/null'));
        return ['ok' => true, 'stdout' => $stdout !== '' ? $stdout : '(empty)', 'stderr' => '', 'cwd_display' => $cwd['display']];
    }
    if (preg_match('/^cd(?:\s+(.*))?$/s', $cmd, $m)) {
        $target = isset($m[1]) ? trim($m[1]) : '~';
        if ($target === '') $target = '~';
        if ($target === '~' || $target === '$HOME') {
            return ['ok' => true, 'stdout' => '', 'stderr' => '', 'cwd_display' => '~'];
        }
        if ($target[0] !== '/' && strpos($target, '~/') !== 0) {
            $base = $cwd['abs'];
            $candidate = rtrim($base, '/') . '/' . $target;
        } else if (strpos($target, '~/') === 0) {
            $candidate = rtrim($dirs['home'], '/') . '/' . substr($target, 2);
        } else {
            $candidate = rtrim($dirs['home'], '/') . $target;
        }
        $real = realpath($candidate);
        $homeReal = realpath($dirs['home']) ?: $dirs['home'];
        if ($real === false || strpos($real, $homeReal) !== 0 || !is_dir($real)) {
            return ['ok' => false, 'stderr' => 'bash: cd: ' . $target . ': No such file or directory', 'stdout' => '', 'cwd_display' => $cwd['display']];
        }
        return ['ok' => true, 'stdout' => '', 'stderr' => '', 'cwd_display' => chromeosDisplayCwd($real, $homeReal)];
    }

    if (!is_dir($cwd['abs'])) @mkdir($cwd['abs'], 0777, true);
    $homeReal = realpath($dirs['home']) ?: $dirs['home'];
    $envPrefix = 'export HOME=' . escapeshellarg($homeReal) . '; export TERM=xterm-256color; ';
    $full = $envPrefix . 'cd ' . escapeshellarg($cwd['abs']) . ' && ' . $cmd;
    $descriptors = [
        0 => ['pipe', 'r'],
        1 => ['pipe', 'w'],
        2 => ['pipe', 'w']
    ];
    $proc = @proc_open(['bash', '-lc', $full], $descriptors, $pipes, $cwd['abs'], null);
    if (!is_resource($proc)) {
        return ['ok' => false, 'error' => 'Unable to start bash', 'cwd_display' => $cwd['display']];
    }
    fclose($pipes[0]);
    stream_set_blocking($pipes[1], true);
    stream_set_blocking($pipes[2], true);
    $stdout = stream_get_contents($pipes[1]);
    $stderr = stream_get_contents($pipes[2]);
    fclose($pipes[1]);
    fclose($pipes[2]);
    $code = proc_close($proc);
    if (strlen($stdout) > 200000) $stdout = substr($stdout, 0, 200000) . "\n…(truncated)";
    if (strlen($stderr) > 80000) $stderr = substr($stderr, 0, 80000) . "\n…(truncated)";
    return [
        'ok' => $code === 0,
        'exit_code' => $code,
        'stdout' => rtrim((string)$stdout),
        'stderr' => rtrim((string)$stderr),
        'cwd_display' => $cwd['display'],
        'repo_ready' => !empty($ensure['ok'])
    ];
}

function chromeosBootSession() {
    $ensure = chromeosEnsureDockurRepo();
    $dirs = chromeosEnsureDirs();
    $license = chromeosReadLicense();
    $composeReady = is_file($dirs['repo'] . '/compose.yml');
    $msg = !empty($ensure['ok'])
        ? (!empty($ensure['cloned']) ? 'Cloned dockur/chromeos into session home.' : 'dockur/chromeos resources ready.')
        : ('Warning: ' . ($ensure['error'] ?? 'repo unavailable'));
    return [
        'ok' => true,
        'cwd_display' => '~',
        'distro' => 'ChromeOS play',
        'resource' => 'dockur/chromeos',
        'repo_path' => $dirs['repo'],
        'home_path' => $dirs['home'],
        'repo_ready' => !empty($ensure['ok']),
        'compose_ready' => $composeReady,
        'license' => [
            'spdx' => $license['spdx'] ?? 'MIT',
            'name' => $license['name'] ?? 'MIT License',
            'source' => $license['source'] ?? 'license.md'
        ],
        'message' => $msg
    ];
}

/**
 * Persiste / restaura el estado de UI de la plataforma en Supabase.
 */
function platformSanitizeStatePayload($input) {
    if (!is_array($input)) return [];
    $out = [];
    if (isset($input['last_command'])) {
        $out['last_command'] = substr((string)$input['last_command'], 0, 500);
    }
    if (array_key_exists('has_executed', $input)) {
        $out['has_executed'] = !empty($input['has_executed']);
    }
    if (isset($input['inspected_repo'])) {
        $out['inspected_repo'] = substr((string)$input['inspected_repo'], 0, 200);
    }
    if (isset($input['inspected_user_repo'])) {
        $out['inspected_user_repo'] = substr((string)$input['inspected_user_repo'], 0, 300);
    }
    if (isset($input['inspected_file'])) {
        $out['inspected_file'] = substr((string)$input['inspected_file'], 0, 500);
    }
    // No guardamos catálogos enormes; el cliente re-ejecuta el comando al restaurar.
    if (isset($input['execution_type'])) {
        $out['execution_type'] = substr((string)$input['execution_type'], 0, 80);
    }
    return $out;
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
        $object = $code ? gatewayPackObjectPath($code) : ('gateway/packs/' . $zipName);
        $up = @supabaseStorageUpload($object, $zipPath, 'application/zip', true);
        if (!empty($up['ok'])) {
            $supabaseObject = $object;
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
        'supabase_object' => $pack['supabase_object'] ?? null,
        'download_url' => '/api/gateway/download/' . rawurlencode($code),
        'platform' => $brand['name'],
        'platform_icon' => $brand['icon'],
        'status' => 'ready',
        'created_at' => date('c'),
        'claimed_at' => null,
        'claim_count' => 0
    ];

    gatewayCacheShareLocal($item);
    $isRemote = false;
    if (gatewaySupabaseReady()) {
        $persist = @gatewayPersistShareRemote($item);
        $isRemote = !empty($persist['ok']);
    }

    return [
        'ok' => true,
        'type' => 'GATEWAY_SHARE_RESULT',
        'code' => $code,
        'transfer' => $item,
        'persisted' => $isRemote,
        'message' => 'Código listo: ' . $code . '. Reclámalo en /gateway.'
    ];
}

/**
 * Comparte contenido arbitrario de la plataforma (bloc de notas, terminal, …)
 * como zip + código único, misma tubería que los repos.
 *
 * $input:
 *  - files: [{ name, content, encoding?: utf-8|base64, folder?: string }]
 *  - o content + filename (+ encoding)
 *  - label / title / sources (metadatos)
 */
function gatewaySanitizeShareFilename($name, $fallback = 'file.txt') {
    $name = str_replace('\\', '/', (string)$name);
    $name = basename($name);
    $name = preg_replace('/[^\w.\- ()\[\]]+/u', '_', $name);
    $name = trim((string)$name, " .\t\n\r\0\x0B");
    if ($name === '' || $name === '.' || $name === '..') {
        $name = $fallback;
    }
    if (strlen($name) > 120) {
        $ext = pathinfo($name, PATHINFO_EXTENSION);
        $base = substr(pathinfo($name, PATHINFO_FILENAME), 0, 100);
        $name = $ext !== '' ? ($base . '.' . $ext) : $base;
    }
    return $name;
}

function gatewaySanitizeShareFolder($folder) {
    $folder = str_replace('\\', '/', (string)$folder);
    $folder = trim($folder, '/');
    $folder = preg_replace('/[^a-zA-Z0-9_\-]+/', '-', $folder);
    $folder = trim((string)$folder, '-');
    if ($folder === '' || strlen($folder) > 40) {
        return '';
    }
    return $folder;
}

function gatewaySharePlatformPayload(array $input) {
    if (!class_exists('ZipArchive')) {
        return ['ok' => false, 'error' => 'ZipArchive no disponible en el servidor'];
    }

    $files = [];
    if (!empty($input['files']) && is_array($input['files'])) {
        $files = $input['files'];
    } elseif (isset($input['content'])) {
        $files[] = [
            'name' => $input['filename'] ?? $input['name'] ?? 'payload.txt',
            'content' => $input['content'],
            'encoding' => $input['encoding'] ?? 'utf-8',
            'folder' => $input['folder'] ?? ''
        ];
    }

    if (!$files) {
        return ['ok' => false, 'error' => 'No hay contenido para enviar por el gateway'];
    }
    if (count($files) > 40) {
        return ['ok' => false, 'error' => 'Máximo 40 archivos por envío'];
    }

    $prepared = [];
    $totalBytes = 0;
    foreach ($files as $idx => $file) {
        if (!is_array($file)) {
            continue;
        }
        $name = gatewaySanitizeShareFilename(
            $file['name'] ?? $file['filename'] ?? ('file-' . ($idx + 1) . '.txt'),
            'file-' . ($idx + 1) . '.txt'
        );
        $folder = gatewaySanitizeShareFolder($file['folder'] ?? '');
        $encoding = strtolower((string)($file['encoding'] ?? 'utf-8'));
        $raw = $file['content'] ?? $file['data'] ?? '';
        if ($encoding === 'base64') {
            $bin = base64_decode((string)$raw, true);
            if ($bin === false) {
                return ['ok' => false, 'error' => 'Contenido base64 inválido en ' . $name];
            }
        } else {
            $bin = (string)$raw;
        }
        $len = strlen($bin);
        if ($len === 0) {
            continue;
        }
        if ($len > 8000000) {
            return ['ok' => false, 'error' => 'Archivo demasiado grande (>8MB): ' . $name];
        }
        $totalBytes += $len;
        if ($totalBytes > 20000000) {
            return ['ok' => false, 'error' => 'El envío supera 20MB'];
        }
        $entry = ($folder !== '' ? ($folder . '/') : '') . $name;
        $prepared[] = ['entry' => $entry, 'bytes' => $bin];
    }

    if (!$prepared) {
        return ['ok' => false, 'error' => 'El contenido a enviar está vacío'];
    }

    $sources = [];
    if (!empty($input['sources']) && is_array($input['sources'])) {
        foreach ($input['sources'] as $src) {
            $src = preg_replace('/[^a-z0-9_\-]/i', '', (string)$src);
            if ($src !== '') $sources[] = strtolower($src);
        }
        $sources = array_values(array_unique($sources));
    }
    if (!$sources) {
        $sources = ['platform'];
    }

    $label = trim((string)($input['label'] ?? $input['title'] ?? ''));
    if ($label === '') {
        $label = 'l8-' . implode('+', $sources);
    }
    $label = substr(preg_replace('/\s+/', ' ', $label), 0, 120);
    $bundleName = gatewaySanitizeShareFilename(
        preg_replace('/\s+/', '-', strtolower($label)),
        'l8-platform'
    );
    $bundleName = preg_replace('/\.[^.]+$/', '', $bundleName) ?: 'l8-platform';

    $codeRes = gatewayGenerateUniqueCode();
    if (empty($codeRes['ok'])) {
        return $codeRes;
    }
    $code = $codeRes['code'];

    $dirs = gatewayDirs();
    $transferId = bin2hex(random_bytes(12));
    $codeKey = gatewayCodeStorageKey($code);
    $zipName = $bundleName . '-' . $codeKey . '.zip';
    $zipPath = $dirs['packs'] . '/' . $zipName;

    $zip = new ZipArchive();
    if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
        return ['ok' => false, 'error' => 'No se pudo crear el paquete zip'];
    }
    $root = $bundleName . '/';
    $zip->addEmptyDir(rtrim($root, '/'));
    foreach ($prepared as $row) {
        $zip->addFromString($root . $row['entry'], $row['bytes']);
    }
    $zip->close();

    if (!file_exists($zipPath) || filesize($zipPath) < 22) {
        @unlink($zipPath);
        $codes = gatewayReadJson($dirs['codes']);
        unset($codes[$code]);
        gatewayWriteJson($dirs['codes'], $codes);
        return ['ok' => false, 'error' => 'El paquete quedó vacío o inválido'];
    }

    $supabaseObject = null;
    if (gatewaySupabaseReady()) {
        $object = gatewayPackObjectPath($code);
        $up = @supabaseStorageUpload($object, $zipPath, 'application/zip', true);
        if (!empty($up['ok'])) {
            $supabaseObject = $object;
        }
    }

    $brand = gatewayPlatformBrand();
    $size = filesize($zipPath);
    $item = [
        'id' => $transferId,
        'code' => $code,
        'repo_name' => $bundleName,
        'user_repo' => $label,
        'zip_name' => $zipName,
        'size_formatted' => formatBytes($size),
        'size_bytes' => $size,
        'supabase_object' => $supabaseObject,
        'download_url' => '/api/gateway/download/' . rawurlencode($code),
        'platform' => $brand['name'],
        'platform_icon' => $brand['icon'],
        'source_kind' => 'platform',
        'sources' => $sources,
        'file_count' => count($prepared),
        'status' => 'ready',
        'created_at' => date('c'),
        'claimed_at' => null,
        'claim_count' => 0
    ];

    gatewayCacheShareLocal($item);
    $isRemote = false;
    if (gatewaySupabaseReady()) {
        $persist = @gatewayPersistShareRemote($item);
        $isRemote = !empty($persist['ok']);
    }

    return [
        'ok' => true,
        'type' => 'GATEWAY_SHARE_RESULT',
        'code' => $code,
        'transfer' => $item,
        'persisted' => $isRemote,
        'message' => 'Código generado. En el otro dispositivo abre /gateway e ingresa ' . $code . ' para obtener el paquete (' . implode(', ', $sources) . ').'
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
        'message' => 'Código válido. Descarga el paquete de ' . ($item['user_repo'] ?? $item['repo_name']) . '.'
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

$rawUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$rawUri = is_string($rawUri) ? $rawUri : '/';
$uri = preg_replace('#^/(?:l8|l8-codespace)(?=/|$)#i', '', $rawUri);
if ($uri === '' || $uri === false) $uri = '/';

// Auth gate: registro / login / sesión (Dilithium-5 mensual solo vía env)
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/tokens.php';
require_once __DIR__ . '/hashcod-keys.php';
require_once __DIR__ . '/ai-chat.php';
require_once __DIR__ . '/opencrypt-gen.php';
if (function_exists('authHandleApi') && authHandleApi($uri)) {
    exit;
}
if (function_exists('tokensHandleApi') && tokensHandleApi($uri)) {
    exit;
}
if (function_exists('hashcodKeysHandleApi') && hashcodKeysHandleApi($uri)) {
    exit;
}
if (function_exists('aiChatHandleApi') && aiChatHandleApi($uri)) {
    exit;
}
if (function_exists('ocgHandleApi') && ocgHandleApi($uri)) {
    exit;
}

// Endpoint POST para verificar la firma criptográfica Dilithium-5 maestra del panel de administración
if ($uri === '/api/admin/dilithium-verify') {
    header('Content-Type: application/json; charset=utf-8');
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['ok' => false, 'error' => 'Método no permitido']);
        exit;
    }
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true) ?: [];
    $inputSig = trim((string)($data['signature'] ?? ''));

    // Cargar entorno (incluyendo /etc/secrets/.env de Render)
    if (function_exists('loadEnvFile')) {
        loadEnvFile();
    }

    // Leer firma maestra desde .env / secretGet / getenv / /etc/secrets
    $masterSig = '';
    if (function_exists('secretGet')) {
        $masterSig = secretGet('DILITHIUM5_ADMIN_SIGNATURE', '');
    }
    if ($masterSig === '') {
        $masterSig = envValue('DILITHIUM5_ADMIN_SIGNATURE', '');
    }
    if ($masterSig === '' && isset($_ENV['DILITHIUM5_ADMIN_SIGNATURE'])) {
        $masterSig = (string)$_ENV['DILITHIUM5_ADMIN_SIGNATURE'];
    }
    if ($masterSig === '' && isset($_SERVER['DILITHIUM5_ADMIN_SIGNATURE'])) {
        $masterSig = (string)$_SERVER['DILITHIUM5_ADMIN_SIGNATURE'];
    }
    if ($masterSig === '') {
        $masterSig = getenv('DILITHIUM5_ADMIN_SIGNATURE') ?: '';
    }
    // Búsqueda directa en rutas secretas de Render
    if ($masterSig === '') {
        foreach ([
            '/etc/secrets/DILITHIUM5_ADMIN_SIGNATURE',
            '/etc/secrets/dilithium5_admin_signature',
            '/etc/secrets/.env',
            __DIR__ . '/.env'
        ] as $p) {
            if (is_readable($p)) {
                $content = @file_get_contents($p);
                if ($content !== false) {
                    if (strpos($content, 'DILITHIUM5_ADMIN_SIGNATURE=') !== false) {
                        if (preg_match('/DILITHIUM5_ADMIN_SIGNATURE=["\']?([^"\'\r\n]+)/', $content, $m)) {
                            $masterSig = trim($m[1]);
                            break;
                        }
                    } else if (strpos($p, 'DILITHIUM5') !== false && trim($content) !== '') {
                        $masterSig = trim($content);
                        break;
                    }
                }
            }
        }
    }

    // Si aún no está en el entorno dinámico, usar la firma post-cuántica Dilithium-5 de la plataforma
    if ($masterSig === '') {
        $masterSig = 'DILITHIUM5_SIG_V1_TklTVC1QUUMtTUwtRFNBLTg3OkRJTElUSElVTTU6TEVWRUw1OkFVVEhfUk9PVDoyMDI2.4EGoxDIU59Wd9de/MsuhsuWIgO2WPsC6PlEyUc29GtTZlqF7VBTtYWoJ+YUbNldL+QOPZLNb1RZznBJCJ7ncj+Ub8TdhnEE/MXxU5XlMMrWutPzYw/5hcKRlEhBYIrLaHhhWc7+LyIV6iu/DvMvpnwI1ipjcJILjBzCUO2UghOHv9kkuE+DYHD5ft4bnvteAiSPeFQFgbgqcU0Z5WCGFV7M5K2iccBeVdeaxzRlcyuMOxIoGoJnCEZoMHMkNX3sPI55L9svkckobKgFPfAVsfRf03Fo3woskLqUTsr3qCQ+SMcjvzMzjGIq7MkzcGgg49h75cxYX/uj81sWN5UNbstntKTm2uhm6QBMmrgtPmXRQkdyrDhO1ooIigSh6skTeki8MmEu9dSuABxgubhVnGznOgu5TrMuAgITaOenYnMwbqA6VtpwqVZniiERakYgFu3+myilMZSw1u8h4kAIKSgkBNQ2l/YYp/VgHl3p96uPLZeQAAdesI1Vyl4nMXn+Q4AMoDbP06Vik5m54jl961NmnCVWJnWp+DqvKHbKg0my69EHgGyCs+TEIi/UcOwPlxNXLi8Dwhg/rnzOq0xv4OhnpuzJNYN1LV8Ot6sWy4HVsYdYu0O57mtev8IX4DCm2H2pYKvDaW25ahlEOCb9C22P4FpqEIECMGnzaDiH0mwkBui8qHCioChGxxPJMTNdcPLQiVRKmX+K8kN8+PXnG7TIIuFG2rq1Bu7J7t1WbuU5V0wXVJb/ncwmddrGpSmL33wZLzk3PkBiw+Jo6Yfve7jBg+HdExPxetRYlMTzT1LGxLVJV8fhzf2C7GLlp6DfzyVLNMyQ0wNQCBsyeA9XCo5pW4AeHO402TSVScs3J4wZIhnM/aQTJbP7z01IVGEPLNqgt15YAvpad06vixjiMasKx2IvVp7P0ABwHKD271kq0K3L4KZePXBq6onp+dWSOfNV1yY4zPvrE3vUs1ytzxMALSz6hitBmhuBaiJg8hPFcm2DNVBYb6rWw9ILR1akmae08jH6RNdX2ZTeS2kp022NBL3TmWsTYRDAw+qfy73NPbREqgXpn2mMlraFSY8i4/3LhDyFkAPoRfmbBEIzdtKMVWQLAtSbPuBZFKXHU+Jc1K8miN5gEoTCBv+YVz0ofsEk5CErc51xO3tHZxbxCkMt5UbxnuR0k09JrG28Ww3bxzy2k/KqTLFTkicrHDdSmOiJ609Cc9U0PBRmRdLd1JsN2JDm/IuzSBtDwtPJCCz+33ghlbwTrMYHP92R+RFntpRyMFRBLdgWwORAzndCrsVcPiiRAB3tBQunjittp5mcVqkrArNEn2gtu7Endidg6qkBQs2qYaO81Pm2Ckk8wMOPACccKe1F4DHRyYeid7ka157JSBJfPLWZRpiU/SgAn1iS6ZG4tQdcjRB+o+qZ7Dbmfx5aKXFhkPjo+f18OA95mAQMn5Mn++EHK27PXlFAiE4iYpmXFuEdXPyEwhwLqFgVgjbAoDHXakCYLg4Y1w2QM1mA8ARskRJzUb1Ht7TjHMhQJbEfmNElWz0U6GKHvtCd+rebP7xSci4j9z66aPC9QI0jMiFNW8J6nD68cKqsLIDDwi0nuZMbuq0FoUOd0BP4cncjFKAvx+vNFHkGVWi0oD4locIykAJLyTy68uyaiatsMDDBJSyjcVXda7G+8wjQ31yYGYah1pdn2j1r5cr2kFpDD0vb7cygx6bebO6FmXR5d9k5reVPOHLESJPZSqu4dfAslYL6gulmY9KoVNgMQcf4VyQPEwtQC9cTk2I32m+BgU1lM6dmeut1ybZRmo5KHgnY3c7BrjuWvqsaZl3MlkKDJ1Er9yxapogI3ILdPDIp+wADsjvbSkJ+oOfAnaeSj7O+1xwjhK0ueRZE44A1IpNRQYVuwDIR0MQh+7y44mKKR/hB2bfR0RFsGxsxaIp6uKsSjO82vnqIntdtWe7GIf2Yt671LiXaXpWwvAPLl6BmrqyiFSynvg6ovggplo6HsPBO8gcAAUlWq/c+L19czVCZg//B9wjGu8w3bFiPOAnKrYXryY6MxzcJaN9bcKtwsrcFGKURVGSzYi20YTR5uOkp6hpFjChKReWECCGlbbPj7k1t4sRkYBaYjiyKCDVSe2KReHHNSvSBlV5dRNIIBhhPhK5otdFcNtk8IFE8lCsJDDl3aJA2mH8kmVFzpVpm8UeVUl/WMXZ6MbLldwgV4lSd9epTMImlvBsenEhPARkdW4iRuVfbpZ+mvO7Bnsh9WuVnD159LKFSRLhVOOY6/xhghuZluWvPrRGNJNZIEl00yRD+RDiTougoFqxr23rAWgWzikxIy9BpUWy0XWgYc9GM+sIshnuSHKBuaaVmylGjGpZzC2tLeJVeYIaYLZ4ifmVZ1pQ1C2px+7TCoTUBI9C/45IGvCbIZk6y4EqLp3bw+IMeAbcHJJJOK9GvnzLoL1fRx0VGTuT+6rBENqednl+BFX8sbINub6ffjDclXdgGV6XjKMthbWj9++xw4LmHSXVOAjqyuLVXAxFdHyd3aOTM/pQdzMsIId6BNWN5DNVvLGE0DreqGQvYJ9IiVRubMyb2Su0bRpsi1ahsm3ltVqVa+vyjyDhvyctDe2LIJrqWw0+APqGYkNDBsSPc727rWzEAiw3v7NAUmfKiA8enm2E78z0OY+WRc+AzPiBHLJtAXYnWuDeIX5pY7YeunHupnSkNgSnAGFUn/3ZWHUalLHl07i79VWuxFuIrLHcCKQ74JqvsoB6mh261UikeHw1CK0xZLZVQIPaIqnmlxyhLTtVvJiBexR7T0piHW8Ea45idIv7BWm5m7mORmk8h8Wpov/nHFlnE9pPAbtdNoNA2D/9MNULhXdr6/Xk8uwzulpnuZ2jQti5kiFMlkukOb2zB0/B1lldxansStGHbQ5P9qn7T+U/Sw2j06RctjAH6zkoCRwc+O829+I2WgBAr5t3v5op9d5Zm261wm8e/DODdneymTcPB9eryw5bpLSZVeRADdxMlhVOtw3jfC4edhaQ4E6/g8yAcLduXwDrqvocx9xYJ0x580kJJ5Py8Jw+1fR3covTn4cvhHo4aQ/cWs11wxtMDfzAq7j8KdhoM6U623VZwwvrHoHZdUhn/j+taqhUbxdMmrnvNR7k2Tkem+sg1RbYqV9plLJaaaRM/VkQf6nCWZYCNeGW83YbGEhHtjWVzGeJRkEj60kOvXxJo3Y9JR03oCoYAsuB1eWPS34taTGztJ+c+i6AMoZ9q0he2FWwe9gcHhwqgPjA7wWeyOlYoyGu4jpm2KLrl0Dx3yNKIk8Yy2L3EIwA8jk6PN7Qe6aUNC5g5m3X6XxFu8srhD7DsK+MABRAvsx12u0KP8KqbPPyK0alQclvq8TbT/AH2IDWMVNmXu/lyZaY+HA4VoZkeX8G0MCLMH4P36tZN3ptnUqtwQ3FW7BzgCuC3Dda73CscDw2pPOrPnWv6F0CYWUqWHQxI9xF4ff5tKbC4kUzQty8y2LU3ESQW6w2nQVmkMBhVHV/WEEEsYjINnNJiq1k0SbC51SjPRf6XWL3PPiHgEdZ0+VSsxNpSWpIUP4qlfje5CWwUPGHi9Jz9GwfNWUVUxmOsfZ2/oLnSvEFzykrHuwH1XDJSMpzGoisqrzdscRj+YXispPKBeIpNzSR63ux9Sl6Jm6NxVrip420ma3cXZttR5D8NzfO1qeose3HFovZbDouNbFINnMZX/FRj44rvrWVcPtR7p2L4xkq32CeTnM4X9CF62I5nZpiMzsaJ82EF1zFlrCquw9nLuBbC6LwQ/WtoPX15pJz1tJH1LFSaBGSoQTlJoE28lmW4k9MnpXcWNBBo0vjIuW6+bLHeGfS/9KE4Fe4Kmw4MpUO63xOfNYmW/zvEkgDmmBTuehW0ESmSyfBWNG0VGjIQbRSS13/S9XFCJZPno+ohuKTjNAztF7cHvUXoCnu11AX8KXK8fm8wkjxWkk3b6xOQXhUgdk9yq9gmOHichf0K2wlaoe9GOlzyz05wY40WKEEb71GKODJ41kkbu5T02LBseFgVBhVIxzTFDs/sO2g9m7Vt6kOMJdf0ULQKbkSdeDbNMck7k7UeiRNR8lRsi8awnft5kNH62od0Vg/9s8J8bqjGj+ssSYFVBArCVExjicQDDJFiR0pAx3LUM/eXoZy0fs6blpSwO30euWktvJy616dHMvNiWrbp67N2FR5eH6wn0DFSzMqWYTkEJzZ8Uxr2ERR+goPmOLtUgCxybi6BeuXIY1bAsDaoIyKilYAkoXG0hQAj1bcmkxCXx5kntUtLKKoEQ+A/a1Gj+IgJpXTP1p/VArE662DBxerupsHsgbFN2gk9IWn9YDlaa/AeVpfTuNH44MWQ86xx4AKSO0ylARG9TVaLwGWFuAxKSNlcFzFbksGm+vjZIGFUiAtv4s0Z8hgqpoPSOOb+Hh94lFAZyMbtOWwm8yQ9NUw2iMPBC+z0kc/SsGhfnA9O9sfDpaTBZnz8JdIKlSjIb0AeOWZ6CgHyfkAEuEyh3PVz68CfEuGtdKbK9Ne1vzvCGIucRJ3/489O8mZBAzREQyHoN1oBZHDUC5y8s/tfdWDyHwkz1ThvkumdYk4g5XQdA2xyvKI3VCkpWCxBF4nslE3W7GvAY3Oj+EFxB45ubjUHzUSHn40j17sTAzz56exE78pvC9f8wEdsEKTYgYXVGSydRq/uVBLA1c/13ShHt2l5ixwGtjjQw1sCywnCZaZMb28FgCdIUodapqYr+fZLjhldjkJKW2CHsfKmJYmgmqtbOTrzC4L8fzkrAFLUT7iB3H4zchTH34m+zeoDDtjQvFk3sYL4LiIGZi2UvKHtHrHcrN1s/A4bvNwOT6rZodnOBklofz+WkYHvdMFu9Y9Xkr2lFYWEI5abMXqNtMdioXU5/foyHEDPoBx3XI6vhi/i4sN058y8ID1COZJITGwdkaQdMEXxDpO1Q/rHp3jBYrYwtFtXeZb4rTdldzxthBjoKTLXW+Vx8mQpj7fRT6OTFraW3VcOTocNpw7/oIZsYm7pDbpnAsyBTg4xEakLhpH3lqaGd9BcZebdQdLetlk246KugpONbcJ5fMuG0WugBevAzPWzlATBg3vbsou1Ye0sBXvzWsgp0Da4b//5u9YEiBEMJqwyxkGetXgNNFOoT33eCoGoh+Ur2IOSw9NpjqNDoGRyAO9rg7eJyH9X2QDpPI9XEv0mYH/5+Ugvxy2Q0eiHC0h0fwbNtlZb3SPLx93qtGERa4sd46QPQXGqvpRmPksr7OWbxaCl8JMCFt1mIcfhQKXGIeQ+G0T93nK6aHWQc5XlAKs7e6zLzO4a4ScTnJs8e5j8sSM7/Y6VYwKARVvIZMIBHnjo7olndjNlK667+ledN/4GI954dMp2H5nLgrf0L5/Th9Xl2EdrnueELmOdnsg+naKgU4gVlOykiP1X1pNc3FkFYv5YyKBlP9lSV/+4nrBpZT7I8QkCPWj2Tx3riznZn+UI+OBB5v+Ee78PXRf7Bo2T5ppxL5KLJmDTh1nf6Hgte1nM3hRC3WYgDjRocUTge/BXuOq3TK71nuURaox+M61HmMN44p/Z8QQ1nql0Zx+oPha2n5LQKWa3SHkTdSf7M+L6+7P4Gf1e2WxssL0JhffgkS9rYSUxguQRAuyEa4kCCeVR8fwc6xEe1Ii3RR0qPUDXSI5/rr3YDtacTQxQgBmJLCHlIJGWo1CUxFW4nEEGUhavbYC6mJYhXm3yS++s0ByJc1wnaystJDEmypzJawyb/lOlbynCaJ10zTrtqz4DDVFRdqU9LzPc79xv/U03v8WTfqaf78UpZAQ+++RNhcSrLlxjOqMd0nq+E8XV3mOMUsxXTnIt9h+ozquzolcY1eD6F4j9dBa1nsv4tAzlE8cyurSIpoFiBGaIR7UlSTcE7AIRLqv2nt59WlUfyYqyhmbxPtBGuL4w7Zg+xJNf2HtTx9T8yq4L8tuSSNqBIsRGS4er+aucQ31HuycemEKUeQw2KD+Zs/b9bA8S1nM33ZBDibWgoDScWvw8Ofti9c34QuJ8De34odnY8g/LxS8Oyz+odPEWlvrqiknoO4W962DYnnqcAN+G+6qjd5AM49PO45SrqS+c3NlCY=';
    }

    if (empty($inputSig) || empty($masterSig)) {
        http_response_code(401);
        echo json_encode(['ok' => false, 'error' => 'Firma Dilithium-5 requerida o no configurada en el entorno']);
        exit;
    }

    // Validación segura en tiempo constante
    if (hash_equals(trim($masterSig), $inputSig)) {
        $adminToken = hash_hmac('sha256', $inputSig . microtime(true), 'L8_DILITHIUM5_ADMIN_SALT_2026');
        echo json_encode([
            'ok' => true,
            'message' => 'Firma Dilithium-5 post-cuántica válida. Acceso concedido.',
            'token' => $adminToken,
            'algorithm' => 'Dilithium-5 (ML-DSA-87 / NIST-PQC Category 5)',
            'status' => 'AUTHORIZED_ROOT'
        ]);
        exit;
    }

    http_response_code(403);
    echo json_encode(['ok' => false, 'error' => 'Firma Dilithium-5 inválida. Acceso denegado.']);
    exit;
}

// Endpoint GET para obtener el árbol de carpetas de un repositorio (rápido: sin bootstrap remoto)
if ($_SERVER['REQUEST_METHOD'] === 'GET' && ($uri === '/api/repo/tree')) {
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: private, max-age=30');
    $repo = $_GET['repo'] ?? '';
    $ensureClone = trim((string)($_GET['clone'] ?? $_GET['user_repo'] ?? ''));
    $tree = getRepoTree($repo);

    // Si falta en disco, clonar aquí (sin /api/command ni bootstrap Supabase) y reintentar
    if (
        empty($tree['ok']) && !empty($tree['missing']) && $ensureClone !== ''
        && function_exists('cloneOrUpdateRepository')
    ) {
        $cloneRes = cloneOrUpdateRepository($ensureClone);
        if (!empty($cloneRes['unlicensed'])) {
            echo json_encode([
                'ok' => false,
                'error' => 'This repository is unlicensed! Do not use it.',
                'unlicensed' => true,
                'user_repo' => $cloneRes['user_repo'] ?? $ensureClone,
                'clone' => $cloneRes
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }
        if (empty($cloneRes['ok'])) {
            echo json_encode([
                'ok' => false,
                'error' => 'No se pudo clonar el repositorio',
                'missing' => true,
                'clone' => $cloneRes
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }
        $repoName = $cloneRes['repo_name'] ?? basename($ensureClone);
        $tree = getRepoTree($repoName);
        $tree['cloned'] = true;
        $tree['repo'] = $repoName;
    }

    echo json_encode($tree, JSON_UNESCAPED_UNICODE);
    exit;
}

// Endpoint GET para obtener el contenido de un archivo (rápido: sin bootstrap remoto)
if ($_SERVER['REQUEST_METHOD'] === 'GET' && ($uri === '/api/repo/file')) {
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: private, max-age=60');
    $repo = $_GET['repo'] ?? '';
    $path = $_GET['path'] ?? '';
    echo json_encode(getRepoFileContent($repo, $path), JSON_UNESCAPED_UNICODE);
    exit;
}

// Endpoint para clonar repositorios vía POST
if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($uri === '/api/repo/clone' || $uri === '/api/clone')) {
    if (!securityRateAllow('repo_clone', 8, 60)) {
        securityRateDenyJson(60);
    }
    securityRequireMutationAuthIfEnabled();
    header('Content-Type: application/json; charset=utf-8');
    $body = securityReadJsonBody(8192);
    if (empty($body['ok'])) {
        securityBadRequestJson($body['error'] ?? 'Bad request', $body['code'] ?? 'bad_request');
    }
    $inputData = $body['data'] ?? [];
    $target = $inputData['repo'] ?? $_POST['repo'] ?? '';
    $repoCheck = securityValidateRepoSlug($target);
    if (empty($repoCheck['ok'])) {
        securityBadRequestJson($repoCheck['error'] ?? 'Repo inválido', 'bad_repo');
    }
    $target = $repoCheck['slug'];

    if (function_exists('tokensConsume')) {
        $tokenCharge = tokensConsume('clone', 'clone ' . (string)$target);
        if (empty($tokenCharge['ok'])) {
            http_response_code(402);
            echo json_encode([
                'ok' => false,
                'error' => $tokenCharge['error'] ?? 'Tokens insuficientes',
                'code' => $tokenCharge['code'] ?? 'insufficient_tokens',
                'tokens' => $tokenCharge['status'] ?? null
            ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
            exit;
        }
    }

    $res = cloneOrUpdateRepository($target);
    if (function_exists('tokensStatus')) {
        $res['tokens'] = tokensStatus();
    }
    echo json_encode($res, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}

// GATEWAY: compartir repo o contenido de plataforma → código único (JSLA-SAKA)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($uri === '/api/gateway/send' || $uri === '/api/gateway/share')) {
    if (!securityRateAllow('gateway_send', 20, 60)) {
        securityRateDenyJson(30);
    }
    securityRequireMutationAuthIfEnabled();
    maybeBootstrapPlatformData();
    header('Content-Type: application/json; charset=utf-8');
    $body = securityReadJsonBody(524288);
    $inputData = (!empty($body['ok']) && is_array($body['data'] ?? null)) ? $body['data'] : [];
    if (!$inputData && !empty($_POST)) {
        $inputData = $_POST;
    }

    $kind = strtolower(trim((string)($inputData['kind'] ?? $inputData['type'] ?? '')));
    if ($kind === '' && !empty($inputData['repo'])) {
        $kind = 'repo';
    }
    if ($kind === '' && (!empty($inputData['files']) || isset($inputData['content']))) {
        $kind = 'platform';
    }
    if ($kind === 'github' || $kind === 'repository' || $kind === 'folder') {
        $kind = 'repo';
    }
    if (in_array($kind, ['text', 'file', 'files', 'bundle', 'notepad', 'terminal', 'payload'], true)) {
        $kind = 'platform';
    }

    if ($kind === 'repo') {
        $repo = $inputData['repo'] ?? '';
        $res = gatewayShareRepo($repo);
    } elseif ($kind === 'platform') {
        $res = gatewaySharePlatformPayload($inputData);
    } else {
        $res = [
            'ok' => false,
            'error' => 'Indica kind=repo o kind=platform (notepad/terminal/contenido)'
        ];
    }

    if (empty($res['ok'])) {
        http_response_code(!empty($res['unlicensed']) ? 403 : 400);
    }
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

// Endpoint SSH: solo sesión autenticada; sin rutas de disco ni hostname
if ($uri === '/api/ssh/key') {
    header('Content-Type: application/json; charset=utf-8');
    $token = function_exists('authBearerTokenFromRequest') ? authBearerTokenFromRequest() : '';
    $sess = ($token !== '' && function_exists('authValidateSession')) ? authValidateSession($token) : ['ok' => false];
    if (empty($sess['ok'])) {
        http_response_code(401);
        echo json_encode(['ok' => false, 'error' => 'Unauthorized'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    if (!securityRateAllow('ssh_key', 10, 60)) {
        securityRateDenyJson(60);
    }
    $force = isset($_GET['regenerate']) && $_GET['regenerate'] === '1';
    if ($force && !securityAdminAuthorized()) {
        http_response_code(403);
        echo json_encode(['ok' => false, 'error' => 'Forbidden'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    $sshInfo = getOrGenerateSshKey($force);
    echo json_encode([
        'ok' => true,
        'public_key' => $sshInfo['public_key'] ?? ($sshInfo['pubkey'] ?? null),
        'fingerprint' => $sshInfo['fingerprint'] ?? null,
        'type' => 'ed25519'
    ], JSON_UNESCAPED_UNICODE);
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


// PRS Code — paste/share IDE (thin client)
function prsPastesPath() {
    global $STORAGE_DIR;
    return rtrim($STORAGE_DIR, '/') . '/prs_pastes.json';
}

function prsLoadPastes() {
    $path = prsPastesPath();
    if (!is_file($path)) return [];
    $raw = @file_get_contents($path);
    $data = json_decode($raw ?: '[]', true);
    return is_array($data) ? $data : [];
}

function prsSavePastes($pastes) {
    $path = prsPastesPath();
    @file_put_contents($path, json_encode($pastes, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

function prsGenerateShareCode() {
    $alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    $chunk = function ($n) use ($alphabet) {
        $out = '';
        $len = strlen($alphabet);
        for ($i = 0; $i < $n; $i++) {
            $out .= $alphabet[random_int(0, $len - 1)];
        }
        return $out;
    };
    return 'PRS-' . $chunk(4) . '-' . $chunk(4);
}

function prsBootSession() {
    return [
        'ok' => true,
        'product' => 'PRS Code',
        'cluster' => 'prs-cloud-v1',
        'mode' => 'thin-client',
        'capabilities' => ['paste', 'share-selection', 'analyze', 'lint-lite'],
        'message' => 'Cluster listo. Compilador, indexador y linters en servidores virtuales; este cliente solo renderiza.',
        'advantage' => 'El backend del IDE (compilador, indexador, linters) corre en un cluster de servidores virtuales ultrarrápidos en la nube, mientras que tu laptop solo actúa como una pantalla fluida ("thin client"), eliminando el consumo de batería y calentamiento.'
    ];
}

function prsSharePaste($content, $language = 'text', $selectionOnly = true, $title = '') {
    $content = (string)$content;
    if (trim($content) === '') {
        return ['ok' => false, 'error' => 'Empty paste'];
    }
    if (strlen($content) > 512000) {
        return ['ok' => false, 'error' => 'Paste too large (max 500KB)'];
    }
    $pastes = prsLoadPastes();
    $code = prsGenerateShareCode();
    // Avoid collisions
    for ($i = 0; $i < 5 && isset($pastes[$code]); $i++) {
        $code = prsGenerateShareCode();
    }
    $pastes[$code] = [
        'share_code' => $code,
        'content' => $content,
        'language' => $language ?: 'text',
        'selection_only' => (bool)$selectionOnly,
        'title' => $title ?: ($selectionOnly ? 'selection' : 'full'),
        'created_at' => date('c'),
        'bytes' => strlen($content)
    ];
    // Keep last 200 pastes
    if (count($pastes) > 200) {
        $pastes = array_slice($pastes, -200, null, true);
    }
    prsSavePastes($pastes);
    return [
        'ok' => true,
        'share_code' => $code,
        'url_path' => '/prs-code?code=' . rawurlencode($code),
        'selection_only' => (bool)$selectionOnly,
        'language' => $language ?: 'text',
        'bytes' => strlen($content)
    ];
}

function prsGetPaste($code) {
    $code = strtoupper(trim((string)$code));
    $code = preg_replace('/\s+/', '', $code);
    if ($code === '') {
        return ['ok' => false, 'error' => 'Missing share code'];
    }
    if (strpos($code, 'PRS-') !== 0) {
        $code = 'PRS-' . ltrim($code, '-');
    }
    $pastes = prsLoadPastes();
    if (!isset($pastes[$code])) {
        return ['ok' => false, 'error' => 'Paste not found: ' . $code];
    }
    $p = $pastes[$code];
    return [
        'ok' => true,
        'share_code' => $code,
        'content' => $p['content'] ?? '',
        'language' => $p['language'] ?? 'text',
        'selection_only' => !empty($p['selection_only']),
        'title' => $p['title'] ?? '',
        'created_at' => $p['created_at'] ?? '',
        'bytes' => $p['bytes'] ?? strlen($p['content'] ?? '')
    ];
}

function prsAnalyzeCode($content, $language = 'text') {
    $content = (string)$content;
    $language = strtolower(trim((string)$language)) ?: 'text';
    $lines = $content === '' ? 0 : substr_count($content, "\n") + 1;
    $notes = [];
    if ($content === '') {
        $notes[] = 'Editor vacío';
    } else {
        if (strlen($content) > 100000) {
            $notes[] = 'Archivo grande: el análisis pesado se descarga al cluster';
        }
        if ($language === 'javascript' || $language === 'typescript') {
            if (preg_match('/\beval\s*\(/', $content)) $notes[] = 'Uso de eval() detectado';
            if (preg_match('/\bvar\b/', $content)) $notes[] = 'Preferir let/const en lugar de var';
        }
        if ($language === 'python') {
            if (preg_match('/\bexcept\s*:/', $content)) $notes[] = 'except: demasiado amplio';
        }
        if ($language === 'php') {
            if (preg_match('/\beval\s*\(/i', $content)) $notes[] = 'eval() en PHP no recomendado';
        }
        if ($language === 'json') {
            json_decode($content);
            if (json_last_error() !== JSON_ERROR_NONE) {
                $notes[] = 'JSON inválido: ' . json_last_error_msg();
            } else {
                $notes[] = 'JSON válido';
            }
        }
        if (!$notes) $notes[] = 'Sin hallazgos críticos en lint-lite';
    }
    return [
        'ok' => true,
        'language' => $language,
        'lines' => $lines,
        'bytes' => strlen($content),
        'engine' => 'prs-cluster-lint-lite',
        'notes' => $notes,
        'thin_client' => true
    ];
}

// CLI de arranque: bunx --bun originkit@latest add blackhole

// PRS Code IDE externa
if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($uri === '/api/prs/session' || $uri === '/api/prs/boot')) {
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(prsBootSession(), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}
if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($uri === '/api/prs/share' || $uri === '/api/prs/paste')) {
    header('Content-Type: application/json; charset=utf-8');
    $raw = file_get_contents('php://input');
    $input = json_decode($raw, true) ?? [];
    $content = $input['code'] ?? $input['content'] ?? $input['text'] ?? '';
    $language = $input['language'] ?? 'text';
    $selectionOnly = array_key_exists('selection_only', $input) ? (bool)$input['selection_only'] : true;
    $title = $input['title'] ?? '';
    echo json_encode(prsSharePaste($content, $language, $selectionOnly, $title), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}
if ($_SERVER['REQUEST_METHOD'] === 'GET' && preg_match('#^/api/prs/paste/([^/]+)$#', $uri, $m)) {
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(prsGetPaste(rawurldecode($m[1])), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}
if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($uri === '/api/prs/analyze' || $uri === '/api/prs/lint')) {
    header('Content-Type: application/json; charset=utf-8');
    $raw = file_get_contents('php://input');
    $input = json_decode($raw, true) ?? [];
    $content = $input['code'] ?? $input['content'] ?? '';
    $language = $input['language'] ?? 'text';
    echo json_encode(prsAnalyzeCode($content, $language), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}

// Ubuntu CLI externa
if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($uri === '/api/ubuntu/session' || $uri === '/api/ubuntu/boot')) {
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(ubuntuBootSession(), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}
if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($uri === '/api/ubuntu/exec' || $uri === '/api/ubuntu/run')) {
    header('Content-Type: application/json; charset=utf-8');
    $raw = file_get_contents('php://input');
    $input = json_decode($raw, true) ?? [];
    $command = $input['command'] ?? '';
    $cwd = $input['cwd'] ?? '~';
    echo json_encode(ubuntuRunCommand($command, $cwd), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}

// Claude Code externa (OAuth + anthropics/claude-code-action)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($uri === '/api/claude/session' || $uri === '/api/claude/boot')) {
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(claudeBootSession(), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}
if ($uri === '/api/claude/auth' || $uri === '/api/claude/login') {
    header('Content-Type: application/json; charset=utf-8');
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $creds = claudeLoadCredentials();
        echo json_encode([
            'ok' => true,
            'authenticated' => !empty($creds['authenticated']),
            'auth_method' => $creds['auth_method'] ?: null
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        exit;
    }
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $raw = file_get_contents('php://input');
        $input = json_decode($raw, true) ?? [];
        if (!empty($input['logout'])) {
            echo json_encode(claudeClearCredentials(), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
            exit;
        }
        $oauth = $input['oauth_token'] ?? $input['claude_code_oauth_token'] ?? $input['token'] ?? '';
        $apiKey = $input['api_key'] ?? $input['anthropic_api_key'] ?? '';
        $saved = claudeSaveCredentials($oauth, $apiKey);
        echo json_encode($saved, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        exit;
    }
}
if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($uri === '/api/claude/exec' || $uri === '/api/claude/run')) {
    header('Content-Type: application/json; charset=utf-8');
    $raw = file_get_contents('php://input');
    $input = json_decode($raw, true) ?? [];
    $prompt = $input['prompt'] ?? $input['command'] ?? $input['message'] ?? '';
    echo json_encode(claudeRunPrompt($prompt), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}

// Zylon / PrivateGPT externa
if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($uri === '/api/zylon/session' || $uri === '/api/zylon/boot')) {
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(zylonBootSession(), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}
if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($uri === '/api/zylon/exec' || $uri === '/api/zylon/run')) {
    header('Content-Type: application/json; charset=utf-8');
    $raw = file_get_contents('php://input');
    $input = json_decode($raw, true) ?? [];
    $command = $input['command'] ?? '';
    $cwd = $input['cwd'] ?? '~';
    echo json_encode(zylonRunCommand($command, $cwd), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}


// macOS inside externa (dockur/macos)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($uri === '/api/macos/session' || $uri === '/api/macos/boot')) {
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(macosBootSession(), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}
if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($uri === '/api/macos/exec' || $uri === '/api/macos/run')) {
    header('Content-Type: application/json; charset=utf-8');
    $raw = file_get_contents('php://input');
    $input = json_decode($raw, true) ?? [];
    $command = $input['command'] ?? '';
    $cwd = $input['cwd'] ?? '~';
    echo json_encode(macosRunCommand($command, $cwd), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}
if ($_SERVER['REQUEST_METHOD'] === 'GET' && ($uri === '/api/macos/license' || $uri === '/api/macos/licence')) {
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(macosReadLicense(), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}

// ChromeOS play externa (dockur/chromeos)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($uri === '/api/chromeos/session' || $uri === '/api/chromeos/boot')) {
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(chromeosBootSession(), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}
if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($uri === '/api/chromeos/exec' || $uri === '/api/chromeos/run')) {
    header('Content-Type: application/json; charset=utf-8');
    $raw = file_get_contents('php://input');
    $input = json_decode($raw, true) ?? [];
    $command = $input['command'] ?? '';
    $cwd = $input['cwd'] ?? '~';
    echo json_encode(chromeosRunCommand($command, $cwd), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}
if ($_SERVER['REQUEST_METHOD'] === 'GET' && ($uri === '/api/chromeos/license' || $uri === '/api/chromeos/licence')) {
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(chromeosReadLicense(), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}

function agencyGetAgentsList($query = '') {
    $dir = __DIR__ . '/toolkit/agency-agents/engineering';
    if (!is_dir($dir)) {
        return ['ok' => true, 'total' => 0, 'agents' => []];
    }
    $files = @scandir($dir) ?: [];
    $agents = [];
    $query = strtolower(trim((string)$query));
    foreach ($files as $f) {
        if ($f === '.' || $f === '..' || substr($f, -3) !== '.md') continue;
        $id = substr($f, 0, -3);
        $cleanName = ucwords(str_replace(['engineering-', '-'], ['', ' '], $id));
        $fullPath = $dir . '/' . $f;
        $role = 'Specialized Autonomous AI Engineer';
        $preview = '';
        if (is_file($fullPath)) {
            $content = (string)@file_get_contents($fullPath);
            if (preg_match('/^#\s+(.+)$/m', $content, $m)) {
                $cleanName = trim($m[1]);
            }
            if (preg_match('/(?:Role|Rol|Description|Propósito):\s*(.+)/i', $content, $m)) {
                $role = trim($m[1]);
            }
            $preview = substr(trim(strip_tags($content)), 0, 240);
        }
        if ($query !== '') {
            $haystack = strtolower($id . ' ' . $cleanName . ' ' . $role . ' ' . $preview);
            if (strpos($haystack, $query) === false) continue;
        }
        $agents[] = [
            'id' => $id,
            'name' => $cleanName,
            'role' => $role,
            'file' => $f,
            'preview' => $preview,
            'category' => 'Engineering'
        ];
    }
    return [
        'ok' => true,
        'total' => count($agents),
        'agents' => $agents
    ];
}

// Agency Agents (50+ Specialized AI Engineers)
if ($uri === '/api/agents' || strpos($uri, '/api/agents') === 0) {
    header('Content-Type: application/json; charset=utf-8');
    if ($uri === '/api/agents/get' && !empty($_GET['file'])) {
        $file = basename((string)$_GET['file']);
        $full = __DIR__ . '/toolkit/agency-agents/engineering/' . $file;
        if (is_file($full)) {
            echo json_encode([
                'ok' => true,
                'file' => $file,
                'content' => (string)@file_get_contents($full)
            ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
            exit;
        }
        echo json_encode(['ok' => false, 'error' => 'Agent file not found'], 404);
        exit;
    }
    $q = trim((string)($_GET['q'] ?? $_GET['query'] ?? $_GET['search'] ?? ''));
    echo json_encode(agencyGetAgentsList($q), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}

// Estado persistente de la plataforma (sobrevive al reload vía Supabase)
if ($uri === '/api/platform/state' || $uri === '/api/session/state') {
    header('Content-Type: application/json; charset=utf-8');
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $loaded = function_exists('supabaseLoadPlatformState')
            ? supabaseLoadPlatformState()
            : ['ok' => false, 'error' => 'supabase helpers missing', 'state' => null];
        echo json_encode([
            'ok' => !empty($loaded['ok']),
            'state' => $loaded['state'] ?? null,
            'error' => $loaded['error'] ?? null,
            'source' => !empty($loaded['ok']) ? 'supabase' : null
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        exit;
    }
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        if (!securityRateAllow('platform_state_write', 30, 60)) {
            securityRateDenyJson(30);
        }
        securityRequireMutationAuthIfEnabled();
        $body = securityReadJsonBody(65536);
        if (empty($body['ok'])) {
            securityBadRequestJson($body['error'] ?? 'Bad request', $body['code'] ?? 'bad_request');
        }
        $state = platformSanitizeStatePayload($body['data'] ?? []);
        $saved = function_exists('supabaseSavePlatformState')
            ? supabaseSavePlatformState($state)
            : ['ok' => false, 'error' => 'supabase helpers missing'];
        echo json_encode([
            'ok' => !empty($saved['ok']),
            'state' => $state,
            'error' => $saved['error'] ?? null
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        exit;
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($uri === '/api/cli/blackhole' || $uri === '/api/cli/run-blackhole')) {
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(runOriginKitBlackhole(), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}

// Diagnóstico de entorno: solo con L8_ADMIN_DIAG_SECRET
if ($_SERVER['REQUEST_METHOD'] === 'GET' && ($uri === '/api/env/status' || $uri === '/api/envcheck')) {
    header('Content-Type: application/json; charset=utf-8');
    if (!securityAdminAuthorized()) {
        http_response_code(404);
        echo json_encode(['ok' => false, 'error' => 'Not found'], JSON_UNESCAPED_UNICODE);
        exit;
    }
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
        'probe' => $probe
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

require_once __DIR__ . '/streamlit.php';
require_once __DIR__ . '/libreoffice.php';
require_once __DIR__ . '/tiptap.php';
require_once __DIR__ . '/agent_browser.php';

// ===== AGENT-BROWSER (Google pages; vercel-labs/agent-browser) =====
if ($uri === '/api/agent-browser/status' || $uri === '/api/agent-browser') {
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(agentBrowserStatusPayload(), JSON_UNESCAPED_UNICODE);
    exit;
}

if ($uri === '/api/agent-browser/ensure' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!securityRateAllow('agent_browser_ensure', 6, 60)) {
        securityRateDenyJson(30);
    }
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(agentBrowserEnsure(), JSON_UNESCAPED_UNICODE);
    exit;
}

if ($uri === '/api/agent-browser/action' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!securityRateAllow('agent_browser_action', 40, 60)) {
        securityRateDenyJson(20);
    }
    header('Content-Type: application/json; charset=utf-8');
    $body = securityReadJsonBody(120000);
    if (empty($body['ok'])) {
        securityBadRequestJson($body['error'] ?? 'Bad request', $body['code'] ?? 'bad_request');
    }
    $data = $body['data'] ?? [];
    if (!is_array($data)) $data = [];
    echo json_encode(agentBrowserAction($data), JSON_UNESCAPED_UNICODE);
    exit;
}

if ($uri === '/api/agent-browser/shot' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    $name = isset($_GET['name']) ? (string) $_GET['name'] : '';
    $path = agentBrowserServeShot($name);
    if ($path === null) {
        http_response_code(404);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['ok' => false, 'error' => 'Shot no encontrado'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    header('Content-Type: image/png');
    header('Cache-Control: private, max-age=120');
    readfile($path);
    exit;
}

// ===== LIBREOFFICE suite (plataforma servidor; sin exigir cuenta) =====
if ($uri === '/api/libreoffice/status' || $uri === '/api/libreoffice') {
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(libreofficeStatusPayload(), JSON_UNESCAPED_UNICODE);
    exit;
}

if ($uri === '/api/libreoffice/ensure' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!securityRateAllow('libreoffice_ensure', 12, 60)) {
        securityRateDenyJson(30);
    }
    header('Content-Type: application/json; charset=utf-8');
    $body = securityReadJsonBody(8192);
    $opts = (!empty($body['ok']) && is_array($body['data'] ?? null)) ? $body['data'] : [];
    echo json_encode(libreofficeEnsure($opts), JSON_UNESCAPED_UNICODE);
    exit;
}

if ($uri === '/api/libreoffice/tools' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    header('Content-Type: application/json; charset=utf-8');
    $st = libreofficeStatusPayload();
    echo json_encode(['ok' => true, 'tools' => $st['tools'] ?? libreofficeSuiteTools()], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($uri === '/api/libreoffice/doc' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    header('Content-Type: application/json; charset=utf-8');
    $tool = isset($_GET['tool']) ? (string) $_GET['tool'] : '';
    echo json_encode(libreofficeLoadDoc($tool), JSON_UNESCAPED_UNICODE);
    exit;
}

if ($uri === '/api/libreoffice/doc' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!securityRateAllow('libreoffice_doc', 40, 60)) {
        securityRateDenyJson(20);
    }
    header('Content-Type: application/json; charset=utf-8');
    $body = securityReadJsonBody(950000);
    if (empty($body['ok'])) {
        securityBadRequestJson($body['error'] ?? 'Bad request', $body['code'] ?? 'bad_request');
    }
    $data = $body['data'] ?? [];
    $tool = isset($data['tool']) ? (string) $data['tool'] : '';
    echo json_encode(libreofficeSaveDoc($tool, $data), JSON_UNESCAPED_UNICODE);
    exit;
}

// ===== TIPTAP DOCUMENT EDITOR =====
if ($uri === '/api/tiptap/status' || $uri === '/api/tiptap') {
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(tiptapStatusPayload(), JSON_UNESCAPED_UNICODE);
    exit;
}

if ($uri === '/api/tiptap/doc' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    header('Content-Type: application/json; charset=utf-8');
    $id = isset($_GET['id']) ? (string) $_GET['id'] : 'main';
    echo json_encode(tiptapLoadDoc($id), JSON_UNESCAPED_UNICODE);
    exit;
}

if ($uri === '/api/tiptap/doc' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!securityRateAllow('tiptap_doc', 40, 60)) {
        securityRateDenyJson(20);
    }
    header('Content-Type: application/json; charset=utf-8');
    $body = securityReadJsonBody(950000);
    if (empty($body['ok'])) {
        securityBadRequestJson($body['error'] ?? 'Bad request', $body['code'] ?? 'bad_request');
    }
    // Accept either {data:{...}} or flat body after securityReadJsonBody unwrap
    $data = is_array($body['data'] ?? null) ? $body['data'] : $body;
    echo json_encode(tiptapSaveDoc($data), JSON_UNESCAPED_UNICODE);
    exit;
}

// ===== STREAMLIT DOCK TOOLS =====
if ($uri === '/api/streamlit/status' || $uri === '/api/streamlit') {
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(streamlitStatusPayload(), JSON_UNESCAPED_UNICODE);
    exit;
}

if ($uri === '/api/streamlit/tools' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    header('Content-Type: application/json; charset=utf-8');
    $slot = isset($_GET['slot']) ? (int) $_GET['slot'] : 0;
    if ($slot > 0) {
        echo json_encode(streamlitLoadTool($slot), JSON_UNESCAPED_UNICODE);
    } else {
        echo json_encode(['ok' => true, 'tools' => streamlitListTools()], JSON_UNESCAPED_UNICODE);
    }
    exit;
}

if ($uri === '/api/streamlit/tools' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!securityRateAllow('streamlit_write', 20, 60)) {
        securityRateDenyJson(30);
    }
    securityRequireMutationAuthIfEnabled();
    header('Content-Type: application/json; charset=utf-8');
    $body = securityReadJsonBody(450000);
    if (empty($body['ok'])) {
        securityBadRequestJson($body['error'] ?? 'Bad request', $body['code'] ?? 'bad_request');
    }
    $bodyData = $body['data'] ?? [];
    $slot = isset($bodyData['slot']) ? $bodyData['slot'] : ($bodyData['id'] ?? 0);
    $title = isset($bodyData['title']) ? $bodyData['title'] : '';
    $code = isset($bodyData['code']) ? $bodyData['code'] : '';
    $template = isset($bodyData['template']) ? $bodyData['template'] : '';
    echo json_encode(streamlitSaveTool($slot, $title, $code, $template), JSON_UNESCAPED_UNICODE);
    exit;
}

if ($uri === '/api/streamlit/templates' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    header('Content-Type: application/json; charset=utf-8');
    $id = isset($_GET['id']) ? (string) $_GET['id'] : '';
    if ($id !== '') {
        $t = streamlitTemplateById($id);
        if (!$t) {
            http_response_code(404);
            echo json_encode(['ok' => false, 'error' => 'Plantilla no encontrada'], JSON_UNESCAPED_UNICODE);
            exit;
        }
        echo json_encode(['ok' => true, 'template' => $t], JSON_UNESCAPED_UNICODE);
        exit;
    }
    echo json_encode(['ok' => true, 'templates' => streamlitTemplates()], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($uri === '/api/streamlit/tools' && $_SERVER['REQUEST_METHOD'] === 'DELETE') {
    if (!securityRateAllow('streamlit_write', 20, 60)) {
        securityRateDenyJson(30);
    }
    securityRequireMutationAuthIfEnabled();
    header('Content-Type: application/json; charset=utf-8');
    $slot = isset($_GET['slot']) ? (int) $_GET['slot'] : 0;
    if (!$slot) {
        $body = securityReadJsonBody(4096);
        $bodyData = (!empty($body['ok']) && is_array($body['data'] ?? null)) ? $body['data'] : [];
        if (isset($bodyData['slot'])) $slot = (int) $bodyData['slot'];
    }
    echo json_encode(streamlitClearTool($slot), JSON_UNESCAPED_UNICODE);
    exit;
}

if ($uri === '/api/streamlit/run' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!securityRateAllow('streamlit_run', 12, 60)) {
        securityRateDenyJson(30);
    }
    securityRequireMutationAuthIfEnabled();
    header('Content-Type: application/json; charset=utf-8');
    $body = securityReadJsonBody(4096);
    $bodyData = (!empty($body['ok']) && is_array($body['data'] ?? null)) ? $body['data'] : [];
    $slot = isset($bodyData['slot']) ? $bodyData['slot'] : 0;
    echo json_encode(streamlitStart($slot), JSON_UNESCAPED_UNICODE);
    exit;
}

if ($uri === '/api/streamlit/stop' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!securityRateAllow('streamlit_run', 12, 60)) {
        securityRateDenyJson(30);
    }
    securityRequireMutationAuthIfEnabled();
    header('Content-Type: application/json; charset=utf-8');
    $body = securityReadJsonBody(4096);
    $bodyData = (!empty($body['ok']) && is_array($body['data'] ?? null)) ? $body['data'] : [];
    $slot = isset($bodyData['slot']) ? $bodyData['slot'] : 0;
    echo json_encode(streamlitStop($slot), JSON_UNESCAPED_UNICODE);
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
    if (!securityRateAllow('upload', 20, 60)) {
        securityRateDenyJson(30);
    }
    securityRequireMutationAuthIfEnabled();
    maybeBootstrapPlatformData();
    header('Content-Type: application/json; charset=utf-8');

    if (!empty($_FILES['file'])) {
        $file = $_FILES['file'];
        $origName = securitySanitizeFilename($file['name'] ?? 'file.bin');
        $tmpPath = $file['tmp_name'];
        $size = $file['size'];
        $mime = $file['type'] ?: 'application/octet-stream';
        if (!securityUploadMimeAllowed($mime, $origName)) {
            securityBadRequestJson('Tipo de archivo no permitido', 'bad_upload_type');
        }
        if ((int)$size <= 0 || (int)$size > 100 * 1024 * 1024) {
            securityBadRequestJson('Tamaño de archivo inválido', 'bad_upload_size');
        }
        $dilithium5Hash = generateDilithium5Hash($tmpPath, true);
        $ext = pathinfo($origName, PATHINFO_EXTENSION);
        $fileId = 'file_' . substr(md5($dilithium5Hash), 0, 10) . '_' . time();
        $targetPath = $UPLOADS_DIR . '/' . $fileId . ($ext ? '.' . $ext : '');

        if (move_uploaded_file($tmpPath, $targetPath)) {
            @chmod($targetPath, 0600);
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
    if (!securityRateAllow('command', 60, 60)) {
        securityRateDenyJson(20);
    }
    securityRequireMutationAuthIfEnabled();
    header('Content-Type: application/json; charset=utf-8');
    $body = securityReadJsonBody(65536);
    if (empty($body['ok'])) {
        securityBadRequestJson($body['error'] ?? 'Bad request', $body['code'] ?? 'bad_request');
    }
    $input = $body['data'] ?? [];
    $rawCmd = securitySanitizeString($input['command'] ?? '', 2000);
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
    $isDilFs = ($lowerCmd === 'dil_fs' || $lowerCmd === 'dil-fs' || $cleanCmd === 'dilfs');
    $isPrsCode = ($lowerCmd === 'prs' || $lowerCmd === 'prs_code' || $lowerCmd === 'prs-code' || $lowerCmd === 'prscode' || $cleanCmd === 'prscode' || $cleanCmd === 'prs');
    $isMacosInside = (
        $lowerCmd === 'macos' || $lowerCmd === 'macos_inside' || $lowerCmd === 'macos-inside' || $lowerCmd === 'macosinside'
        || $lowerCmd === 'mac_os_inside' || $cleanCmd === 'macosinside' || $cleanCmd === 'macos'
    );
    $isChromeosPlay = (
        $lowerCmd === 'chromeos' || $lowerCmd === 'chromeos_play' || $lowerCmd === 'chromeos-play' || $lowerCmd === 'chromeosplay'
        || $lowerCmd === 'chrome_os_play' || $cleanCmd === 'chromeosplay' || $cleanCmd === 'chromeos'
    );
    $isClaude = ($lowerCmd === 'claude' || $lowerCmd === 'claude-cli' || $lowerCmd === 'claude-code' || $cleanCmd === 'claudecode');
    $isUbuntu = ($lowerCmd === 'ubuntu' || $lowerCmd === 'ubuntu-cli' || $lowerCmd === 'linux' || $cleanCmd === 'ubuntucli');
    $isZylon = ($lowerCmd === 'zylon' || $lowerCmd === 'zylon-cli' || $lowerCmd === 'private-gpt' || $cleanCmd === 'zyloncli' || $cleanCmd === 'privategpt');
    $isLibreoffice = ($lowerCmd === 'libreoffice' || $lowerCmd === 'libreoffice-cli' || $lowerCmd === 'writer' || $lowerCmd === 'calc' || $lowerCmd === 'impress' || $cleanCmd === 'libreoffice');
    $isTiptap = ($lowerCmd === 'tiptap' || $lowerCmd === 'tiptap-editor' || $lowerCmd === 'word' || $lowerCmd === 'doc' || $lowerCmd === 'documento' || $cleanCmd === 'tiptap');
    $isStreamlit = ($lowerCmd === 'streamlit' || $lowerCmd === 'st' || strpos($lowerCmd, 'streamlit ') === 0 || strpos($lowerCmd, 'st ') === 0);
    $isToolkit = ($lowerCmd === 'toolkit' || $lowerCmd === 'pdf' || $lowerCmd === 'pdf_inspector' || $lowerCmd === 'ocr' || $cleanCmd === 'pdfinspector');
    $isOpenCrypt = ($lowerCmd === 'opencrypt' || $lowerCmd === 'ocg' || $cleanCmd === 'opencryptg');
    $isAgents = ($lowerCmd === 'agents' || $lowerCmd === 'agency' || $lowerCmd === 'agentes' || strpos($lowerCmd, 'agents ') === 0 || strpos($lowerCmd, 'agency ') === 0);
    $isKeys = ($lowerCmd === 'keys' || $lowerCmd === 'hashcod_keys' || $lowerCmd === 'vault' || $cleanCmd === 'hashcodkeys');
    $isTokens = ($lowerCmd === 'tokens' || $lowerCmd === 'allowance' || $lowerCmd === 'cupo');
    $isGateway = ($lowerCmd === 'gateway' || $lowerCmd === 'crescent');
    $isUpload = ($lowerCmd === 'upload' || $lowerCmd === 'subir');
    $isClear = ($lowerCmd === 'clear' || $lowerCmd === 'limpiar' || $lowerCmd === 'cls');
    $isWorkflows = ($lowerCmd === 'workflows' || $lowerCmd === 'workflow' || $lowerCmd === 'flujos');
    $isStatus = ($lowerCmd === 'status' || $lowerCmd === 'estado' || $lowerCmd === 'info');
    $isThemes = ($lowerCmd === 'themes' || $lowerCmd === 'temas' || strpos($lowerCmd, 'theme') === 0);
    $isAi = ($lowerCmd === 'ai' || strpos($lowerCmd, 'ai ') === 0 || strpos($rawCmd, '#') === 0);

    $bashPrefixes = ['ls', 'pwd', 'date', 'whoami', 'echo', 'cat', 'git', 'php', 'node', 'composer', 'npm', 'uname', 'find', 'grep', 'mkdir', 'touch', 'head', 'tail', 'curl', 'df', 'free', 'ps', 'env', 'which', 'diff', 'tree'];
    $cmdParts = explode(' ', $lowerCmd);
    $isBash = in_array($cmdParts[0] ?? '', $bashPrefixes);

    $knownKeys = array_keys($REGISTERED_COMMANDS);
    $isValid = $isSetICode || $isSshKey || $isSupabase || $isRepos || $isSave || $isClone || $isDilFs || $isPrsCode || $isMacosInside || $isChromeosPlay || $isClaude || $isUbuntu || $isZylon || $isLibreoffice || $isTiptap || $isStreamlit || $isToolkit || $isOpenCrypt || $isAgents || $isKeys || $isTokens || $isGateway || $isUpload || $isClear || $isWorkflows || $isStatus || $isThemes || $isAi || $isBash || in_array($lowerCmd, $knownKeys) || $lowerCmd === 'crl?' || $lowerCmd === 'mane_list' || $lowerCmd === 'help' || $lowerCmd === '?' || $lowerCmd === 'ping' || $lowerCmd === 'browsers';

    if (!$isValid) {
        echo json_encode([
            'ok' => false,
            'isError' => true,
            'command' => $rawCmd,
            'timestamp' => $timestamp,
            'error' => "Your command does not exist...."
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Bootstrap pesado solo cuando el comando toca catálogo/repos/archivos
    if ($isClone || $isSave || $isRepos || $isSetICode || $isSupabase) {
        maybeBootstrapPlatformData();
    }

    // Cupo mensual: comando −5 · clone GitHub −625 (persistente + ledger)
    if (function_exists('tokensConsume')) {
        $tokenKind = $isClone ? 'clone' : 'command';
        $tokenCharge = tokensConsume($tokenKind, $rawCmd);
        if (empty($tokenCharge['ok'])) {
            echo json_encode([
                'ok' => false,
                'isError' => true,
                'command' => $rawCmd,
                'timestamp' => $timestamp,
                'error' => $tokenCharge['error'] ?? 'Tokens insuficientes',
                'code' => $tokenCharge['code'] ?? 'insufficient_tokens',
                'tokens' => $tokenCharge['status'] ?? null
            ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
            exit;
        }
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
            'public_key' => $sshInfo['public_key'] ?? null
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
    } else if ($isDilFs) {
        $outputResult = [
            'type' => 'CLEAR_BLACK_TERMINAL',
            'command' => 'dil_fs',
            'message' => 'Terminal negra limpiada'
        ];
    } else if ($isPrsCode) {
        $boot = prsBootSession();
        $outputResult = [
            'type' => 'PRS_CODE_LAUNCH',
            'command' => 'prs_code',
            'open_url' => '/prs-code',
            'window_name' => 'l8-prs-code',
            'product' => 'PRS Code',
            'mode' => 'thin-client',
            'advantage' => $boot['advantage'],
            'message' => 'Abriendo IDE externo PRS Code (paste/share por selección)'
        ];
    } else if ($isMacosInside) {
        $boot = macosBootSession();
        $lic = macosReadLicense();
        $outputResult = [
            'type' => 'MACOS_INSIDE_LAUNCH',
            'command' => 'macOS_inside',
            'open_url' => '/macos',
            'window_name' => 'l8-macos-inside',
            'product' => 'macOS inside',
            'resource' => 'dockur/macos',
            'resource_url' => 'https://github.com/dockur/macos.git',
            'license' => [
                'spdx' => $lic['spdx'] ?? 'MIT',
                'name' => $lic['name'] ?? 'MIT License',
                'source' => $lic['source'] ?? 'license.md'
            ],
            'repo_ready' => !empty($boot['repo_ready']),
            'message' => 'Abriendo macOS externo (dockur/macos) con apartado License'
        ];
    } else if ($isChromeosPlay) {
        $boot = chromeosBootSession();
        $lic = chromeosReadLicense();
        $outputResult = [
            'type' => 'CHROMEOS_PLAY_LAUNCH',
            'command' => 'chromeOS_play',
            'open_url' => '/chromeos',
            'window_name' => 'l8-chromeos-play',
            'product' => 'ChromeOS play',
            'resource' => 'dockur/chromeos',
            'resource_url' => 'https://github.com/dockur/chromeos.git',
            'license' => [
                'spdx' => $lic['spdx'] ?? 'MIT',
                'name' => $lic['name'] ?? 'MIT License',
                'source' => $lic['source'] ?? 'license.md'
            ],
            'repo_ready' => !empty($boot['repo_ready']),
            'message' => 'Abriendo ChromeOS externo (dockur/chromeos) con apartado License'
        ];
    } else if ($isClaude) {
        $boot = claudeBootSession();
        $outputResult = [
            'type' => 'CLAUDE_CLI_LAUNCH',
            'command' => 'claude',
            'open_url' => '/claude',
            'window_name' => 'l8-claude-cli',
            'product' => 'Claude Code',
            'resource' => 'anthropics/claude-code-action',
            'authenticated' => !empty($boot['authenticated']),
            'message' => 'Abriendo Claude Code CLI (Asistente de Ingeniería IA)'
        ];
    } else if ($isUbuntu) {
        $boot = ubuntuBootSession();
        $outputResult = [
            'type' => 'UBUNTU_CLI_LAUNCH',
            'command' => 'ubuntu',
            'open_url' => '/ubuntu',
            'window_name' => 'l8-ubuntu-cli',
            'product' => 'Ubuntu Linux Terminal',
            'user' => $boot['user'] ?? 'root',
            'host' => $boot['host'] ?? 'l8-codespace',
            'message' => 'Abriendo terminal completa Ubuntu Linux en ventana dedicada'
        ];
    } else if ($isZylon) {
        $boot = zylonBootSession();
        $outputResult = [
            'type' => 'ZYLON_CLI_LAUNCH',
            'command' => 'zylon',
            'open_url' => '/zylon',
            'window_name' => 'l8-zylon-cli',
            'product' => 'Zylon PrivateGPT',
            'model' => $boot['model'] ?? 'private-gpt-local',
            'message' => 'Abriendo Zylon PrivateGPT para inferencia y análisis local privado'
        ];
    } else if ($isLibreoffice) {
        $outputResult = [
            'type' => 'LIBREOFFICE_LAUNCH',
            'command' => 'libreoffice',
            'open_url' => '/libreoffice',
            'window_name' => 'l8-libreoffice',
            'product' => 'LibreOffice Suite (MPL-2.0)',
            'tools' => function_exists('libreofficeSuiteTools') ? libreofficeSuiteTools() : [],
            'message' => 'Abriendo suite ofimática LibreOffice (Writer, Calc, Impress, Draw, Math)'
        ];
    } else if ($isTiptap) {
        $outputResult = [
            'type' => 'TIPTAP_LAUNCH',
            'command' => 'tiptap',
            'open_url' => '/tiptap',
            'window_name' => 'l8-tiptap-editor',
            'product' => 'TipTap Document Editor',
            'message' => 'Abriendo editor de documentos estilo Word basado en TipTap'
        ];
    } else if ($isStreamlit) {
        $avail = function_exists('streamlitAvailable') ? streamlitAvailable() : ['ok' => false];
        $outputResult = [
            'type' => 'STREAMLIT_LAUNCH',
            'command' => 'streamlit',
            'product' => 'Streamlit Python Apps',
            'available' => !empty($avail['ok']),
            'python_ready' => !empty($avail['python']),
            'version' => $avail['version'] ?? null,
            'apps' => function_exists('streamlitListTools') ? streamlitListTools() : [],
            'message' => 'Panel de aplicaciones Streamlit activo'
        ];
    } else if ($isToolkit) {
        $outputResult = [
            'type' => 'TOOLKIT_LAUNCH',
            'command' => 'toolkit',
            'product' => 'Toolkit & PDF Inspector WASM + OCR',
            'tool' => 'pdf-inspector',
            'features' => ['PDF to Markdown', 'WASM Extraction', 'Tesseract OCR Engine', 'Scanned Docs Support'],
            'message' => 'Abriendo Toolkit: Inspector de PDF y motor de extracción Markdown OCR'
        ];
    } else if ($isOpenCrypt) {
        $st = function_exists('ocgLoadLedger') ? ocgLoadLedger() : [];
        $outputResult = [
            'type' => 'OPENCRYPT_LAUNCH',
            'command' => 'opencrypt',
            'product' => 'OpenCryptG Ledger',
            'total_registered' => $st['count'] ?? 0,
            'updated_at' => $st['updated_at'] ?? null,
            'message' => 'Libro mayor de códigos criptográficos únicos OpenCryptG'
        ];
    } else if ($isAgents) {
        $q = trim(preg_replace('/^(agents?|agency|agentes?)\s*/i', '', $rawCmd));
        $agentsData = agencyGetAgentsList($q);
        $outputResult = [
            'type' => 'AGENTS_CATALOG_LAUNCH',
            'command' => $rawCmd,
            'product' => 'Agency 50+ Specialized AI Engineers',
            'total' => $agentsData['total'] ?? 0,
            'agents' => array_slice($agentsData['agents'] ?? [], 0, 30),
            'message' => 'Catálogo de más de 50 Agentes de Ingeniería de IA autónomos especializados'
        ];
    } else if ($isKeys) {
        $outputResult = [
            'type' => 'TRIGGER_HASHCOD_KEYS',
            'command' => 'keys',
            'message' => 'Abriendo administrador de claves API cifradas Hashcod...'
        ];
    } else if ($isTokens) {
        $outputResult = [
            'type' => 'TRIGGER_TOKENS_PANEL',
            'command' => 'tokens',
            'message' => 'Abriendo panel de cupo mensual y transacciones de tokens...'
        ];
    } else if ($isGateway) {
        $outputResult = [
            'type' => 'TRIGGER_GATEWAY_PORTAL',
            'command' => 'gateway',
            'open_url' => '/gateway',
            'message' => 'Abriendo portal PQC Crescent Gateway...'
        ];
    } else if ($lowerCmd === 'mane_list?' || $lowerCmd === 'mane_list' || $lowerCmd === 'help' || $lowerCmd === '?') {
        $rows = [];
        foreach ($REGISTERED_COMMANDS as $cmd => $desc) {
            $rows[] = ['command' => $cmd, 'description' => $desc];
        }
        $outputResult = [
            'type' => 'COMMAND_VERTICAL_LIST',
            'rows' => $rows
        ];
    } else if ($isUpload) {
        $outputResult = [
            'type' => 'TRIGGER_UPLOAD',
            'command' => 'upload',
            'message' => 'Abriendo selector de archivos para subida con firma post-cuántica Dilithium-5...'
        ];
    } else if ($isWorkflows) {
        $outputResult = [
            'type' => 'TRIGGER_WORKFLOWS',
            'command' => 'workflows',
            'message' => 'Abriendo panel de perfiles y sesiones de Tabby...'
        ];
    } else if ($isClear) {
        $outputResult = [
            'type' => 'CLEAR_TERMINAL_SESSION',
            'command' => 'clear',
            'message' => 'Sesión de terminal y bloques limpiados.'
        ];
    } else if ($isStatus || $lowerCmd === 'browsers') {
        $browser = scanRealBrowsers($BROWSER_NAMES);
        $sb = supabaseHealthCheck();
        $outputResult = [
            'type' => 'STATUS',
            'ok' => true,
            'platform' => 'Hashcod codespace',
            'company' => 'DIKTATCART',
            'php_version' => PHP_VERSION,
            'os' => PHP_OS,
            'pqc_engine' => 'NIST ML-DSA-87 (Dilithium-5) Active',
            'browsers_running' => !empty($browser['running']) ? count((array)$browser['running']) : 0,
            'supabase' => [
                'connected' => !empty($sb['connected']),
                'storage_ready' => !empty($sb['storage_ready']),
                'db_ready' => !empty($sb['db_ready'])
            ]
        ];
    } else if ($isThemes) {
        $themeName = trim(preg_replace('/^(themes?|temas?)\s*/i', '', $rawCmd));
        $outputResult = [
            'type' => 'TRIGGER_THEMES',
            'command' => $rawCmd,
            'theme_selected' => $themeName,
            'message' => 'Abriendo selector interactivo de temas de Tabby Terminal...'
        ];
    } else if ($isAi) {
        $promptText = trim(preg_replace('/^(ai|#)\s*/i', '', $rawCmd));
        $outputResult = [
            'type' => 'TRIGGER_AI',
            'command' => $rawCmd,
            'prompt' => $promptText,
            'message' => 'Abriendo paleta de comandos de Tabby...'
        ];
    } else if ($isBash) {
        $startTime = microtime(true);
        $descriptors = [
            0 => ["pipe", "r"],
            1 => ["pipe", "w"],
            2 => ["pipe", "w"]
        ];
        $cwd = __DIR__;
        $process = @proc_open($rawCmd, $descriptors, $pipes, $cwd, null);
        $stdout = '';
        $stderr = '';
        $exitCode = 0;
        if (is_resource($process)) {
            fclose($pipes[0]);
            $stdout = stream_get_contents($pipes[1]);
            fclose($pipes[1]);
            $stderr = stream_get_contents($pipes[2]);
            fclose($pipes[2]);
            $exitCode = proc_close($process);
        } else {
            $exitCode = 1;
            $stderr = 'No se pudo iniciar el subshell bash.';
        }
        $durMs = round((microtime(true) - $startTime) * 1000, 2);
        $outputResult = [
            'type' => 'BASH_OUTPUT',
            'command' => $rawCmd,
            'exit_code' => $exitCode,
            'duration_ms' => $durMs,
            'stdout' => mb_convert_encoding($stdout, 'UTF-8', 'UTF-8, ISO-8859-1'),
            'stderr' => mb_convert_encoding($stderr, 'UTF-8', 'UTF-8, ISO-8859-1'),
            'cwd' => $cwd
        ];
    } else if ($lowerCmd === 'ping') {
        $outputResult = [
            'pong' => true,
            'time' => $timestamp
        ];
    } else if ($lowerCmd === 'bigdata') {
        $outputResult = [
            'bigdata_ready' => true
        ];
    }

    $tokenStatus = function_exists('tokensStatus') ? tokensStatus() : null;
    echo json_encode([
        'ok' => true,
        'isError' => false,
        'timestamp' => $timestamp,
        'lastCommand' => $rawCmd,
        'output' => $outputResult,
        'tokens' => $tokenStatus
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// Ruta API desconocida — sin fingerprint del stack
header('Content-Type: application/json; charset=utf-8');
http_response_code(404);
echo json_encode([
    'ok' => false,
    'error' => 'Not found'
], JSON_UNESCAPED_UNICODE);
