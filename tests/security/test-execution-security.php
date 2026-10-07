<?php
require dirname(__DIR__, 2) . '/execution-security.php';
$checks = 0;
function executionCheck($condition, $message) {
    global $checks;
    if (!$condition) throw new RuntimeException($message);
    $checks++;
}
foreach (['pwd', 'ls -la', 'echo "hello world"', 'head -n 10 sample.txt'] as $command) {
    executionCheck(executionParseCommand($command) !== null, 'allowed command: ' . $command);
}
foreach (['bash -lc id', 'python -c "print(1)"', 'php -r "echo 1;"', 'curl https://example.com', 'ls; id', 'echo $(id)', 'echo `id`', 'ls | cat', 'env', 'cat /etc/passwd', 'cat ../secrets.php', 'ls --color=always', "ls\nwhoami", 'echo > out', 'echo "unclosed'] as $command) {
    executionCheck(executionParseCommand($command) === null, 'denied command: ' . $command);
}
$workspace = sys_get_temp_dir() . '/hashcod-exec-' . bin2hex(random_bytes(8));
mkdir($workspace, 0700);
file_put_contents($workspace . '/sample.txt', 'sample');
symlink(dirname(__DIR__, 2) . '/secrets.php', $workspace . '/escape');
executionCheck(executionValidatePaths(['cat', 'sample.txt'], $workspace), 'local path allowed');
executionCheck(!executionValidatePaths(['cat', 'escape'], $workspace), 'symlink escape denied');
$argv = executionSandboxArgv(['pwd'], $workspace);
executionCheck(in_array('--unshare-all', $argv, true), 'network and pid isolation');
executionCheck(in_array('--clearenv', $argv, true), 'no inherited secrets');
executionCheck(in_array('--cap-drop', $argv, true), 'no capabilities');
executionCheck(!in_array('/var/www/html', $argv, true) && !in_array('/home', $argv, true), 'no server or home mounts');
executionCheck(in_array('--as=134217728', $argv, true) && in_array('--cpu=2', $argv, true), 'memory and CPU limits');
unlink($workspace . '/escape'); unlink($workspace . '/sample.txt'); rmdir($workspace);
echo "execution security: $checks checks passed\n";
