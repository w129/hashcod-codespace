<?php
declare(strict_types=1);
require_once __DIR__ . '/platform-period-lib.php';

function tokenizationAdminTicket(): string {
    $data = mldsaOpen((string)($_COOKIE['hashcod_tokenization_admin_v1'] ?? ''));
    if (!is_array($data) || ($data['kind'] ?? '') !== 'tokenization-admin-v1'
        || !hash_equals((string)($data['host'] ?? ''), mldsaHost())
        || (int)($data['expiresAt'] ?? 0) <= time()) return '';
    return is_string($data['ticket'] ?? null) ? $data['ticket'] : '';
}
function tokenizationWorker(string $action, array $body): array {
    $fallback = ['status' => 503, 'data' => ['ok' => false, 'error' => 'No se pudo conectar con las solicitudes. Intenta de nuevo.']];
    if (!function_exists('proc_open')) return $fallback;
    if (PHP_OS_FAMILY === 'Windows') {
        $command = [__DIR__ . '/tools/tokenization/hashcod-tokenization.exe'];
    } else {
        $python = getenv('HASHCOD_TOKENIZATION_PYTHON') ?: '/opt/l8-py/bin/python';
        if (!is_file($python)) $python = '/usr/bin/python3';
        $command = [$python, __DIR__ . '/tools/tokenization/backend.py'];
    }
    $input = json_encode(['action' => $action, 'body' => $body], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if (!is_string($input) || strlen($input) > 16384) return $fallback;
    // Argument array avoids a shell. All executable paths are fixed server paths.
    $pipes = [];
    $process = @proc_open($command, [0 => ['pipe', 'r'], 1 => ['pipe', 'w'], 2 => ['file', PHP_OS_FAMILY === 'Windows' ? 'NUL' : '/dev/null', 'a']], $pipes, __DIR__, null, ['bypass_shell' => true]);
    if (!is_resource($process)) return $fallback;
    fwrite($pipes[0], $input); fclose($pipes[0]);
    stream_set_blocking($pipes[1], false);
    $output = ''; $deadline = microtime(true) + 30; $valid = true;
    do {
        $chunk = fread($pipes[1], 8192);
        if ($chunk !== false) $output .= $chunk;
        if (strlen($output) > 1048576 || microtime(true) > $deadline) { $valid = false; proc_terminate($process); break; }
        $status = proc_get_status($process);
        if (!$status['running'] && feof($pipes[1])) break;
        usleep(10000);
    } while (true);
    fclose($pipes[1]); proc_close($process);
    $result = $valid ? json_decode($output, true) : null;
    if (!is_array($result) || !in_array($result['status'] ?? 0, [200, 400, 403, 405, 409, 413, 429, 503], true)
        || !is_array($result['data'] ?? null) || !is_bool($result['data']['ok'] ?? null)) return $fallback;
    return $result;
}
