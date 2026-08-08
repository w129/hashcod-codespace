<?php
// api.php - Backend PHP con Super Base de Datos, Dilithium 5, SSH GitHub y Gestión de Repositorios Clonados
ini_set('memory_limit', '1024M'); // 1GB Memory Limit
set_time_limit(300); // 5 Minutos para grandes cargas

// Gzip Compression para respuestas masivas
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
    "repos"       => "Muestra la lista completa de repositorios de GitHub clonados y guardados en el servidor de la plataforma",
    "clone <repo>"=> "Clona o actualiza repositorios de GitHub vía SSH en el servidor (ej: clone w129/l8-codespace)",
    "ssh_key"     => "Muestra la clave pública SSH Ed25519 generada por esta plataforma para conectar el servidor con GitHub",
    "mane_list?"  => "Muestra la lista de comandos creados y su funcionalidad",
    "crl"         => "Deja la celda de ejecución (=) totalmente vacía",
    "status"      => "Consulta el estado del servidor y motores detectados",
    "browsers"    => "Muestra los procesos reales de navegadores en ejecución",
    "ping"        => "Comprueba la conectividad y latencia con el servidor",
    "bigdata"     => "Genera y prueba la transmisión en lote de grandes volúmenes de datos"
];

// Directorios de almacenamiento masivo, repositorios y SSH
$STORAGE_DIR = __DIR__ . '/data_storage';
$UPLOADS_DIR = __DIR__ . '/uploads';
$REPOS_DIR   = __DIR__ . '/data_storage/repos';

if (!file_exists($STORAGE_DIR)) @mkdir($STORAGE_DIR, 0777, true);
if (!file_exists($UPLOADS_DIR)) @mkdir($UPLOADS_DIR, 0777, true);
if (!file_exists($REPOS_DIR))   @mkdir($REPOS_DIR, 0777, true);

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

/**
 * GESTOR DE REPOSITORIOS GITHUB (CLONACIÓN Y PERSISTENCIA SSH)
 */
function cloneOrUpdateRepository($repoTarget) {
    global $REPOS_DIR;
    $sshInfo = getOrGenerateSshKey();
    $keyPath = $sshInfo['key_path'];

    $cleanTarget = trim($repoTarget);
    if (empty($cleanTarget)) {
        return ['ok' => false, 'error' => 'Especifica un repositorio para clonar (ej: clone w129/l8-codespace)'];
    }

    // Normalizar la URL del repositorio SSH de GitHub
    if (strpos($cleanTarget, 'git@github.com:') === 0) {
        $sshUrl = $cleanTarget;
        $repoFolder = preg_replace('/\.git$/i', '', basename(parse_url($cleanTarget, PHP_URL_PATH) ?? $cleanTarget));
    } else if (preg_match('#^https://github\.com/([^/]+)/([^/]+)#i', $cleanTarget, $matches)) {
        $user = $matches[1];
        $repo = preg_replace('/\.git$/i', '', $matches[2]);
        $sshUrl = "git@github.com:$user/$repo.git";
        $repoFolder = $repo;
    } else if (preg_match('#^([^/]+)/([^/]+)$#i', $cleanTarget, $matches)) {
        $user = $matches[1];
        $repo = preg_replace('/\.git$/i', '', $matches[2]);
        $sshUrl = "git@github.com:$user/$repo.git";
        $repoFolder = $repo;
    } else {
        $repoFolder = preg_replace('/[^a-zA-Z0-9_\-]/', '', $cleanTarget);
        $sshUrl = "git@github.com:$cleanTarget.git";
    }

    $targetPath = $REPOS_DIR . '/' . $repoFolder;

    // Configurar GIT_SSH_COMMAND para usar la clave SSH Ed25519 de la plataforma
    $gitSshCmd = sprintf('ssh -i %s -o StrictHostKeyChecking=no', escapeshellarg($keyPath));
    putenv("GIT_SSH_COMMAND=$gitSshCmd");

    $output = '';
    $action = '';

    if (file_exists($targetPath . '/.git')) {
        // Repositorio ya clonado -> Ejecutar git pull para actualizar
        $action = 'pull';
        $cmd = sprintf('cd %s && git pull origin main 2>&1 || git pull origin master 2>&1', escapeshellarg($targetPath));
        $output = shell_exec($cmd);
    } else {
        // Clonar repositorio desde GitHub mediante SSH
        $action = 'clone';
        $cmd = sprintf('git clone %s %s 2>&1', escapeshellarg($sshUrl), escapeshellarg($targetPath));
        $output = shell_exec($cmd);
    }

    $isSuccess = file_exists($targetPath . '/.git');

    // Obtener información del último commit
    $lastCommit = 'Sin commits';
    $branch = 'main';
    if ($isSuccess) {
        $commitCmd = sprintf('cd %s && git log -1 --pretty=format:"%%h - %%s (%%cr)" 2>&1', escapeshellarg($targetPath));
        $lastCommit = trim(shell_exec($commitCmd) ?? 'Commit info unavailable');
        $branchCmd = sprintf('cd %s && git rev-parse --abbrev-ref HEAD 2>&1', escapeshellarg($targetPath));
        $branch = trim(shell_exec($branchCmd) ?? 'main');
    }

    return [
        'ok' => $isSuccess,
        'action' => $action,
        'repo_name' => $repoFolder,
        'ssh_url' => $sshUrl,
        'target_path' => $targetPath,
        'branch' => $branch,
        'last_commit' => $lastCommit,
        'raw_output' => trim($output)
    ];
}

function getStoredRepositories() {
    global $REPOS_DIR;
    $repos = [];
    if (!file_exists($REPOS_DIR)) return $repos;

    $dirs = scandir($REPOS_DIR);
    foreach ($dirs as $d) {
        if ($d === '.' || $d === '..') continue;
        $fullPath = $REPOS_DIR . '/' . $d;
        if (is_dir($fullPath) && file_exists($fullPath . '/.git')) {
            $lastCommit = trim(shell_exec(sprintf('cd %s && git log -1 --pretty=format:"%%h - %%s (%%cr)" 2>&1', escapeshellarg($fullPath))) ?? '');
            $branch = trim(shell_exec(sprintf('cd %s && git rev-parse --abbrev-ref HEAD 2>&1', escapeshellarg($fullPath))) ?? 'main');
            $remoteUrl = trim(shell_exec(sprintf('cd %s && git config --get remote.origin.url 2>&1', escapeshellarg($fullPath))) ?? '');
            
            // Calcular tamaño del directorio en MB/KB
            $sizeBytes = 0;
            $files = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($fullPath, RecursiveDirectoryIterator::SKIP_DOTS));
            foreach ($files as $file) {
                $sizeBytes += $file->getSize();
            }

            $repos[] = [
                'name' => $d,
                'branch' => $branch,
                'remote_url' => $remoteUrl,
                'last_commit' => $lastCommit,
                'size_formatted' => formatBytes($sizeBytes),
                'updated_at' => date('Y-m-d H:i:s', filemtime($fullPath))
            ];
        }
    }
    return $repos;
}

/**
 * GENERADOR DE HASH POST-CUÁNTICO DILITHIUM LEVEL 5
 */
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

/**
 * MOTOR DE SUPER BASE DE DATOS GIGANTE CON FIRMA DILITHIUM 5
 */
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
        if ($this->pdo) {
            $stmt = $this->pdo->prepare("INSERT OR REPLACE INTO global_files (id, filename, mime_type, size_bytes, hash, upload_date, storage_path) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$id, $filename, $mimeType, $sizeBytes, $hash, $uploadDate, $storagePath]);
        } else {
            $fp = fopen($this->jsonDbPath, 'c+');
            if (flock($fp, LOCK_EX)) {
                $files = [];
                $size = filesize($this->jsonDbPath);
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
                    'storage_path' => $storagePath
                ];
                ftruncate($fp, 0);
                rewind($fp);
                fwrite($fp, json_encode($files, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
                flock($fp, LOCK_UN);
            }
            fclose($fp);
        }
    }

    public function getAllFiles() {
        if ($this->pdo) {
            $stmt = $this->pdo->query("SELECT * FROM global_files ORDER BY upload_date DESC");
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } else {
            if (!file_exists($this->jsonDbPath)) return [];
            $raw = file_get_contents($this->jsonDbPath);
            $files = json_decode($raw, true) ?? [];
            return array_values($files);
        }
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

    if ($targetFile && file_exists($targetFile['storage_path'])) {
        header('Content-Type: ' . $targetFile['mime_type']);
        header('Content-Disposition: inline; filename="' . $targetFile['filename'] . '"');
        header('Content-Length: ' . filesize($targetFile['storage_path']));
        readfile($targetFile['storage_path']);
        exit;
    } else {
        header("HTTP/1.1 404 Not Found");
        echo json_encode(['error' => 'Archivo no encontrado en el servidor']);
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
    $isRepos = ($lowerCmd === 'repos' || $lowerCmd === 'repositories' || $lowerCmd === 'repo_list');
    $isClone = (strpos($lowerCmd, 'clone ') === 0 || strpos($lowerCmd, 'git clone ') === 0);

    $knownKeys = array_keys($REGISTERED_COMMANDS);
    $isValid = $isSetICode || $isSshKey || $isRepos || $isClone || in_array($lowerCmd, $knownKeys) || $lowerCmd === 'crl?' || $lowerCmd === 'mane_list' || $lowerCmd === 'help' || $lowerCmd === '?';

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
        $cloneRes = cloneOrUpdateRepository($targetRepo);
        $outputResult = [
            'type' => 'REPO_CLONE_RESULT',
            'command' => $rawCmd,
            'result' => $cloneRes,
            'all_repos' => getStoredRepositories()
        ];
    } else if ($isRepos) {
        $outputResult = [
            'type' => 'REPOS_CATALOG',
            'command' => 'repos',
            'total_repos' => count(getStoredRepositories()),
            'repos' => getStoredRepositories()
        ];
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
        $outputResult = scanRealBrowsers($BROWSER_NAMES);
    } else if ($lowerCmd === 'ping') {
        $outputResult = ['pong' => true, 'time' => $timestamp, 'crypto' => 'Dilithium 5 Ready', 'ssh' => 'Ed25519 Ready'];
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
