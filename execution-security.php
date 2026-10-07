<?php
/** User commands run only as argv inside a networkless, secretless sandbox. */
function executionFailure(string $code, string $message): array {
    return ['ok'=>false, 'code'=>$code, 'exit_code'=>126, 'stdout'=>'', 'stderr'=>$message, 'error'=>$message];
}

function executionUnavailable(): array {
    return executionFailure('isolation_required', 'Esta herramienta requiere un ejecutor aislado. No se ejecutará código en el servidor de la plataforma.');
}

/** A finite grammar: no shell, interpreters, substitutions, redirects or chains. */
function executionParseCommand(string $command): ?array {
    if ($command === '' || strlen($command) > 2000 || preg_match('/[\x00-\x1f\x7f;$`|&<>\\\\]/', $command)) return null;
    preg_match_all('/"([^"]*)"|\x27([^\x27]*)\x27|([^\s"\x27]+)/u', $command, $matches, PREG_SET_ORDER | PREG_OFFSET_CAPTURE);
    $argv = []; $cursor = 0;
    foreach ($matches as $match) {
        if (trim(substr($command, $cursor, $match[0][1] - $cursor)) !== '') return null;
        $argv[] = $match[1][1] >= 0 ? $match[1][0] : (($match[2][1] ?? -1) >= 0 ? $match[2][0] : $match[3][0]);
        $cursor = $match[0][1] + strlen($match[0][0]);
    }
    if (trim(substr($command, $cursor)) !== '' || count($argv) > 32) return null;
    $flags = [
        'pwd'=>['-L','-P'], 'whoami'=>[], 'date'=>['-u','--utc','--iso-8601'],
        'uname'=>['-a','-s','-r','-m'], 'ls'=>['-l','-a','-la','-al','-h','-lh','-lah','-1','-d'],
        'cat'=>['-n','-b'], 'head'=>['-n'], 'tail'=>['-n'], 'wc'=>['-l','-w','-c'],
        'stat'=>[], 'du'=>['-h','-s','-sh'], 'df'=>['-h'], 'echo'=>['-n'],
    ];
    $name = $argv[0] ?? '';
    if (!array_key_exists($name, $flags)) return null;
    foreach (array_slice($argv, 1) as $i=>$arg) {
        if (strlen($arg) > 512 || in_array('..', explode('/', $arg), true)) return null;
        if (str_starts_with($arg, '/') && $arg !== '/workspace' && !str_starts_with($arg, '/workspace/')) return null;
        if (str_starts_with($arg, '-') && !in_array($arg, $flags[$name], true)) return null;
        if (in_array($name, ['pwd','whoami','date','uname','df'], true) && !in_array($arg, $flags[$name], true)) return null;
        if (in_array($name, ['head','tail'], true) && ($argv[$i] ?? '') === '-n' && !preg_match('/^(?:[1-9][0-9]?|100)$/', $arg)) return null;
    }
    if (end($argv) === '-n' && in_array($name, ['head','tail'], true)) return null;
    return $argv;
}

function executionValidatePaths(array $argv, string $workspace): bool {
    if (in_array($argv[0], ['pwd','whoami','date','uname','df','echo'], true)) return true;
    $root = realpath($workspace);
    if ($root === false) return false;
    foreach (array_slice($argv, 1) as $i=>$arg) {
        if (str_starts_with($arg, '-') || (($argv[$i] ?? '') === '-n' && in_array($argv[0], ['head','tail'], true))) continue;
        $relative = preg_replace('#^/workspace(?:/|$)#', '', $arg);
        $path = realpath($root . '/' . $relative);
        if ($path === false || ($path !== $root && !str_starts_with($path, $root . DIRECTORY_SEPARATOR))) return false;
    }
    return true;
}

function executionSandboxArgv(array $argv, string $workspace): array {
    $command = ['/usr/bin/timeout','--signal=TERM','--kill-after=1s','5s',
        '/usr/bin/prlimit','--as=134217728','--cpu=2','--nproc=16','--fsize=1048576','--nofile=64','--',
        '/usr/bin/bwrap','--unshare-all','--die-with-parent','--new-session','--cap-drop','ALL',
        '--clearenv','--setenv','PATH','/usr/bin:/bin','--setenv','HOME','/tmp','--setenv','LANG','C',
        '--setenv','USER','workspace','--tmpfs','/tmp','--proc','/proc','--dev','/dev'];
    foreach (['/usr','/bin','/lib','/lib64'] as $path) {
        if (is_dir($path)) array_push($command, '--ro-bind', $path, $path);
    }
    if (is_file('/etc/ld.so.cache')) array_push($command, '--ro-bind','/etc/ld.so.cache','/etc/ld.so.cache');
    array_push($command, '--ro-bind',$workspace,'/workspace','--chdir','/workspace','--');
    $command[] = '/usr/bin/' . $argv[0];
    return array_merge($command, array_slice($argv, 1));
}

function executionRunCommand(string $command, ?string $cwd = null, array $extraEnv = []): array {
    require_once __DIR__ . '/admin-device.php';
    adminRequire();
    $argv = executionParseCommand($command);
    if ($argv === null || $extraEnv !== []) return executionFailure('command_not_allowed', 'Comando no permitido. Usa comandos de lectura sin operadores de shell ni variables de entorno.');
    $default = __DIR__ . '/data_storage/execution/workspace';
    if (!is_dir($default)) @mkdir($default, 0700, true);
    $workspace = realpath($cwd ?? $default);
    $allowed = false;
    foreach ([__DIR__ . '/workspace', __DIR__ . '/data_storage/execution'] as $base) {
        if (is_link($base)) continue;
        $root = realpath($base);
        if ($workspace !== false && $root !== false && ($workspace === $root || str_starts_with($workspace, $root . DIRECTORY_SEPARATOR))) $allowed = true;
    }
    if (!$allowed || !executionValidatePaths($argv, $workspace)) return executionFailure('workspace_denied', 'La ruta debe pertenecer al espacio de ejecución aislado.');
    if (PHP_OS_FAMILY !== 'Linux' || !function_exists('proc_open') || !function_exists('posix_geteuid') || posix_geteuid() === 0) return executionUnavailable();
    foreach (['/usr/bin/bwrap','/usr/bin/prlimit','/usr/bin/timeout','/usr/bin/' . $argv[0]] as $bin) {
        if (!is_executable($bin) || (fileperms($bin) & 06000)) return executionUnavailable();
    }
    $started = microtime(true);
    $process = @proc_open(executionSandboxArgv($argv, $workspace), [0=>['pipe','r'],1=>['pipe','w'],2=>['pipe','w']], $pipes,
        sys_get_temp_dir(), ['PATH'=>'/usr/bin:/bin','LANG'=>'C'], ['bypass_shell'=>true]);
    if (!is_resource($process)) return executionUnavailable();
    fclose($pipes[0]);
    stream_set_blocking($pipes[1], false); stream_set_blocking($pipes[2], false);
    $out = ''; $err = ''; $exit = -1; $bounded = false;
    while (true) {
        $out .= (string)fread($pipes[1], 4096); $err .= (string)fread($pipes[2], 4096);
        $status = proc_get_status($process);
        if (strlen($out) + strlen($err) > 65536 || microtime(true) - $started > 7) {
            $bounded = true; proc_terminate($process); break;
        }
        if (!$status['running']) { $exit = $status['exitcode']; break; }
        usleep(10000);
    }
    $out .= (string)stream_get_contents($pipes[1], max(0, 65536 - strlen($out)));
    $err .= (string)stream_get_contents($pipes[2], max(0, 65536 - strlen($err)));
    fclose($pipes[1]); fclose($pipes[2]); $closed = proc_close($process);
    if ($exit < 0) $exit = $closed;
    if ($bounded || in_array($exit, [124,137], true)) return executionFailure('execution_limit', 'La ejecución alcanzó su límite de tiempo o salida.');
    if (str_contains($err, 'bwrap:') || str_contains($err, 'prlimit:')) return executionUnavailable();
    return ['ok'=>$exit===0,'exit_code'=>$exit,'stdout'=>substr($out,0,65536),'stderr'=>substr($err,0,65536),
        'execution_time_ms'=>(int)round((microtime(true)-$started)*1000),'cwd'=>'/workspace','shell'=>'isolated-argv'];
}
