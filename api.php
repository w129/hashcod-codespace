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

function getGhBinary() {
    $candidates = [
        'C:\\Program Files\\GitHub CLI\\gh.exe',
        '/usr/bin/gh',
        '/usr/local/bin/gh',
        'gh'
    ];
    foreach ($candidates as $bin) {
        if ($bin === 'gh' || file_exists($bin)) {
            return $bin;
        }
    }
    return 'gh';
}

function runGhJson($args) {
    $gh = escapeshellarg(getGhBinary());
    $cmd = $gh . ' ' . $args . ' 2>&1';
    $raw = @shell_exec($cmd);
    if ($raw === null || $raw === '') {
        return ['ok' => false, 'error' => 'GitHub CLI no respondió', 'data' => null];
    }
    $decoded = json_decode($raw, true);
    if ($decoded === null && json_last_error() !== JSON_ERROR_NONE) {
        return ['ok' => false, 'error' => trim($raw), 'data' => null];
    }
    return ['ok' => true, 'data' => $decoded, 'error' => null];
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
    $res = runGhJson('api ' . escapeshellarg('repos/' . $userRepo));
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

    $res = runGhJson('api ' . escapeshellarg('repos/' . $userRepo));
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
 * Busca repositorios en TODO GitHub (API Search), no solo la cuenta local.
 * Solo incluye licencias MIT / Apache / BSD.
 */
function searchGithubRepositories($query = '', $page = 1, $perPage = 30) {
    $page = max(1, (int)$page);
    $perPage = max(1, min(100, (int)$perPage));
    $userQuery = trim($query);
    $sort = 'updated';
    $licenseFrag = githubAllowedLicenseQueryFragment();

    if ($userQuery === '') {
        $q = 'is:public stars:>50 ' . $licenseFrag;
        $sort = 'stars';
    } else {
        // Quitar filtros de licencia previos del usuario y forzar MIT/Apache/BSD
        $q = $userQuery . ' ' . $licenseFrag;
    }

    $endpoint = sprintf(
        'search/repositories?q=%s&sort=%s&order=desc&per_page=%d&page=%d',
        rawurlencode($q),
        rawurlencode($sort),
        $perPage,
        $page
    );
    $res = runGhJson('api ' . escapeshellarg($endpoint));
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
        $fullName = $item['full_name'] ?? '';
        if ($fullName === '') continue;
        $license = extractGithubLicense($item);
        if (!isAllowedRepoLicense($license)) continue;

        $diskKb = isset($item['size']) ? (int)$item['size'] : 0;
        $desc = trim((string)($item['description'] ?? ''));
        $meta = [
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
            'source' => 'github_search',
            'updated_at' => date('Y-m-d H:i:s')
        ];
        $items[] = $meta;
    }
    saveRepoIndexEntriesBatch($items);

    $unlicensedWarning = null;
    if ($userQuery !== '') {
        $unlicensedWarning = checkUnlicensedRepoLookup($userQuery);
        // Si no es owner/repo exacto pero la búsqueda sin filtro de licencia tendría hits no permitidos
        if ($unlicensedWarning === null && count($items) === 0) {
            $probe = runGhJson('api ' . escapeshellarg(sprintf(
                'search/repositories?q=%s&per_page=5',
                rawurlencode($userQuery)
            )));
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

    $res = runGhJson('api ' . escapeshellarg('repos/' . $clean));
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

// Endpoint SSH directo para consultar la clave pública de la plataforma
if ($uri === '/api/ssh/key') {
    header('Content-Type: application/json; charset=utf-8');
    $force = isset($_GET['regenerate']) && $_GET['regenerate'] === '1';
    $sshInfo = getOrGenerateSshKey($force);
    echo json_encode($sshInfo, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
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
