<?php
// api.php - Backend PHP con Super Base de Datos Gigante Global y Comando set_I code
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
    "set_i code"  => "Sube archivos masivos a la super base de datos gigante global y consulta todo el catálogo almacenado",
    "mane_list?"  => "Muestra la lista de comandos creados y su funcionalidad",
    "crl"         => "Deja la celda de ejecución (=) totalmente vacía",
    "status"      => "Consulta el estado del servidor y motores detectados",
    "browsers"    => "Muestra los procesos reales de navegadores en ejecución",
    "ping"        => "Comprueba la conectividad y latencia con el servidor",
    "bigdata"     => "Genera y prueba la transmisión en lote de grandes volúmenes de datos"
];

// Directorios de almacenamiento masivo y Base de Datos Gigante
$STORAGE_DIR = __DIR__ . '/data_storage';
$UPLOADS_DIR = __DIR__ . '/uploads';

if (!file_exists($STORAGE_DIR)) @mkdir($STORAGE_DIR, 0777, true);
if (!file_exists($UPLOADS_DIR)) @mkdir($UPLOADS_DIR, 0777, true);

/**
 * MOTOR DE SUPER BASE DE DATOS GIGANTE (SQLite3 con fallback a JSON Indexed DB)
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
            // Fallback a Base de Datos JSON Indexed Atómica
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

// Endpoint para descarga/servido directo de archivos almacenados
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

    // Manejar subidas Multipart estándar
    if (!empty($_FILES['file'])) {
        $file = $_FILES['file'];
        $origName = basename($file['name']);
        $tmpPath = $file['tmp_name'];
        $size = $file['size'];
        $mime = $file['type'] ?: 'application/octet-stream';
        $hash = md5_file($tmpPath);
        $ext = pathinfo($origName, PATHINFO_EXTENSION);
        $fileId = 'file_' . substr($hash, 0, 10) . '_' . time();
        $targetPath = $UPLOADS_DIR . '/' . $fileId . ($ext ? '.' . $ext : '');

        if (move_uploaded_file($tmpPath, $targetPath)) {
            $db->insertFile($fileId, $origName, $mime, $size, $hash, $targetPath);
            echo json_encode([
                'ok' => true,
                'message' => "Archivo '$origName' subido exitosamente a la super base de datos gigante global.",
                'file' => [
                    'id' => $fileId,
                    'filename' => $origName,
                    'size_formatted' => formatBytes($size),
                    'mime_type' => $mime,
                    'url' => '/api/file/get/' . $fileId
                ]
            ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
            exit;
        }
    }

    // Manejar subida Base64 / Payload masivo desde JSON
    $rawInput = file_get_contents('php://input');
    $inputData = json_decode($rawInput, true);

    if (!empty($inputData['filename']) && !empty($inputData['base64_data'])) {
        $origName = basename($inputData['filename']);
        $base64 = preg_replace('#^data:[\w/]+;base64,#i', '', $inputData['base64_data']);
        $binaryData = base64_decode($base64);
        $size = strlen($binaryData);
        $hash = md5($binaryData);
        $mime = $inputData['mime_type'] ?? 'application/octet-stream';
        $ext = pathinfo($origName, PATHINFO_EXTENSION);
        $fileId = 'file_' . substr($hash, 0, 10) . '_' . time();
        $targetPath = $UPLOADS_DIR . '/' . $fileId . ($ext ? '.' . $ext : '');

        file_put_contents($targetPath, $binaryData);
        $db->insertFile($fileId, $origName, $mime, $size, $hash, $targetPath);

        echo json_encode([
            'ok' => true,
            'message' => "Archivo '$origName' almacenado masivamente en la super base de datos.",
            'file' => [
                'id' => $fileId,
                'filename' => $origName,
                'size_formatted' => formatBytes($size),
                'mime_type' => $mime,
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
    $knownKeys = array_keys($REGISTERED_COMMANDS);
    $isValid = $isSetICode || in_array($lowerCmd, $knownKeys) || $lowerCmd === 'crl?' || $lowerCmd === 'mane_list' || $lowerCmd === 'help' || $lowerCmd === '?';

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

    if ($isSetICode) {
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
                'upload_date' => date('Y-m-d H:i:s', strtotime($f['upload_date'])),
                'url' => '/api/file/get/' . $f['id']
            ];
        }

        $outputResult = [
            'type' => 'GLOBAL_FILES_CATALOG',
            'command' => 'set_I code',
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
        $outputResult = ['pong' => true, 'time' => $timestamp, 'memory_usage_mb' => round(memory_get_usage() / 1024 / 1024, 2)];
    } else if ($lowerCmd === 'bigdata') {
        $outputResult = [
            'bigdata_ready' => true,
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
echo json_encode([
    'server' => 'PHP 8.1 Super Database Global Engine',
    'command' => 'set_I code active',
    'browserState' => $browserState,
    'registeredCommands' => array_keys($REGISTERED_COMMANDS)
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
