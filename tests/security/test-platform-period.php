<?php
declare(strict_types=1);
putenv('L8_ACCESS_GATE_COOKIE_SECRET=' . bin2hex(random_bytes(32)));
$_SERVER['HTTP_HOST'] = '127.0.0.1:8000';
require dirname(__DIR__, 2) . '/platform-period-lib.php';
function periodCheck(bool $condition, string $message): void { if (!$condition) throw new RuntimeException($message); }
function periodCookie(array $override = []): void {
    $_COOKIE['hashcod_platform_period_v1'] = mldsaSeal(array_merge(['kind'=>'platform-period-v1','host'=>mldsaHost(),'token'=>'private-test-token','state'=>'active','days'=>10,'expiresAt'=>time()+864000], $override));
}
periodCheck(!platformPeriodActive(), 'Missing selection must be blocked');
putenv('L8_CODE_ACCESS_REQUIRED=1');
foreach (['/', '/l8/', '/l8-codespace/'] as $base) {
    $entry = mldsaGateHtml($base, true);
    periodCheck(!str_contains($entry, 'd5CodeAccessMount') && !str_contains($entry, 'code-access.bundle.'), 'Retired credential window still loads');
    periodCheck(str_contains($entry, 'data-hashcod-code-access-required="0"'), 'Legacy server configuration restored the retired window');
    periodCheck(str_contains($entry, 'd5CenterEmptyStateMount'), 'Current checkout must remain available');
}
periodCheck(str_contains(mldsaGateHtml('/',true), 'data-hashcod-period-required="1"'), 'Initial HTML must require selection');
periodCookie(['state'=>'choose','expiresAt'=>null]); periodCheck(!platformPeriodActive(), 'Unconfirmed choice allowed');
periodCookie(['days'=>11]); periodCheck(!platformPeriodActive(), 'Invalid duration allowed');
periodCookie(['expiresAt'=>(string)(time()+86400)]); periodCheck(!platformPeriodActive(), 'Malformed deadline allowed');
periodCookie(); periodCheck(platformPeriodActive(), 'Valid period rejected');
periodCheck(!platformProActive(), 'Free technical session granted Pro');
periodCookie(['proExpiresAt'=>time()+3600]); periodCheck(platformProActive(), 'Server-signed paid term rejected');
periodCookie(['proExpiresAt'=>time()-1]); periodCheck(!platformProActive(), 'Expired paid term allowed');
periodCookie(['proExpiresAt'=>(string)(time()+3600)]); periodCheck(!platformProActive(), 'Malformed paid term allowed');
periodCookie();
$html = mldsaGateHtml('/', true);
periodCheck(str_contains($html, 'data-hashcod-period-days="10"'), 'Reload must restore days');
periodCheck(!str_contains($html, 'private-test-token'), 'HttpOnly identity leaked into HTML');
periodCookie(['expiresAt'=>time()-1]); periodCheck(platformPeriodExpired(), 'Expired period allowed');
periodCheck(str_contains(mldsaGateHtml('/',true), 'data-hashcod-period-expired="1"'), 'Expired reload must restore modal');
periodCookie(['host'=>'another-host']); periodCheck(platformPeriodExpired(), 'Cookie reused across hosts');
periodCookie(); $_COOKIE['hashcod_platform_period_v1'] .= 'tampered'; periodCheck(platformPeriodExpired(), 'Tampered signature allowed');
periodCookie(['state'=>'expired','expiresAt'=>null]); periodCheck(platformPeriodExpired(), 'Expired state lost');
periodCookie(['expiresAt'=>time()-1]);
foreach (['hashcod-file-vault.php','hashcod-file-vault-fast-upload.php','hashcod-workspace-state.php','hashcod-workspace-blob.php','hashcod-workspace-image-vault.php','hashcod-sync.php'] as $controller) {
    foreach ([null, mldsaSeal(['kind'=>'platform-period-v1','host'=>mldsaHost(),'state'=>'choose']), $_COOKIE['hashcod_platform_period_v1']] as $cookie) {
    $expected = $cookie === $_COOKIE['hashcod_platform_period_v1'] ? 'platform_period_expired' : 'platform_period_required';
    $script = '$_SERVER["HTTP_HOST"]="127.0.0.1:8000";$_COOKIE["hashcod_platform_period_v1"]='.var_export($cookie,true).';require '.var_export(dirname(__DIR__,2).'/'.$controller,true).';';
    $process = proc_open([PHP_BINARY,'-r',$script],[1=>['pipe','w'],2=>['pipe','w']],$pipes);
    periodCheck(is_resource($process), 'Guard process did not start');
    $result = json_decode(stream_get_contents($pipes[1]),true);
    $errors = stream_get_contents($pipes[2]); fclose($pipes[1]); fclose($pipes[2]);
    periodCheck(proc_close($process) === 0 && ($result['code'] ?? '') === $expected, 'Direct API guard missing: '.$controller.' '.$errors);
    }
}
echo "Platform period: server deadline, reload, signature, host binding and private identity OK\n";
