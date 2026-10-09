<?php
declare(strict_types=1);
putenv('L8_ACCESS_GATE_COOKIE_SECRET=' . bin2hex(random_bytes(32)));
$_SERVER['HTTP_HOST'] = '127.0.0.1:8000';
require dirname(__DIR__, 2) . '/tokenization-lib.php';
function checkToken(bool $value, string $message): void { if (!$value) throw new RuntimeException($message); }
checkToken(tokenizationAdminTicket() === '', 'Missing cookie must be rejected');
function adminCookie(array $changes = []): void {
    $_COOKIE['hashcod_tokenization_admin_v1'] = mldsaSeal(array_merge(['kind'=>'tokenization-admin-v1','host'=>mldsaHost(),'ticket'=>'private-test-ticket','expiresAt'=>time()+900], $changes));
}
adminCookie(); checkToken(tokenizationAdminTicket() === 'private-test-ticket', 'Valid admin cookie rejected');
adminCookie(['host'=>'another-host']); checkToken(tokenizationAdminTicket() === '', 'Cookie reused across hosts');
adminCookie(['expiresAt'=>time()-1]); checkToken(tokenizationAdminTicket() === '', 'Expired session accepted');
adminCookie(['kind'=>'platform-period-v1']); checkToken(tokenizationAdminTicket() === '', 'Wrong cookie kind accepted');
adminCookie(); $_COOKIE['hashcod_tokenization_admin_v1'] .= 'tampered'; checkToken(tokenizationAdminTicket() === '', 'Tampered signature accepted');
foreach ([null, mldsaSeal(['kind'=>'platform-period-v1','host'=>mldsaHost(),'state'=>'choose']), mldsaSeal(['kind'=>'platform-period-v1','host'=>mldsaHost(),'state'=>'active','days'=>10,'token'=>'test','expiresAt'=>time()-1])] as $cookie) {
    $script = '$_SERVER["HTTP_HOST"]="127.0.0.1:8000";$_COOKIE["hashcod_platform_period_v1"]='.var_export($cookie,true).';require '.var_export(dirname(__DIR__,2).'/policy-consent-lib.php',true).';$_COOKIE["hashcod_policy_consent_v1"]=mldsaSeal(["kind"=>"policy-consent-v1","host"=>mldsaHost(),"version"=>POLICY_CONSENT_VERSION,"receipt"=>"0b9c1f3e-1a2b-4c3d-8e4f-5a6b7c8d9e0f","acceptedAt"=>time()]);require '.var_export(dirname(__DIR__,2).'/hashcod-tokenization.php',true).';';
    $process = proc_open([PHP_BINARY,'-r',$script],[1=>['pipe','w'],2=>['pipe','w']],$pipes);
    $result = json_decode(stream_get_contents($pipes[1]),true); $errors=stream_get_contents($pipes[2]); fclose($pipes[1]);fclose($pipes[2]);
    checkToken(proc_close($process) === 0 && str_starts_with($result['code'] ?? '', 'platform_period_'), 'Direct controller lacks period guard: '.$errors);
}
echo "Tokenization: signed HttpOnly session, expiry, host binding and direct period guard OK\n";
