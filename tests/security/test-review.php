<?php
declare(strict_types=1);
define('HCR_LIBRARY_ONLY',true);
putenv('L8_ACCESS_GATE_COOKIE_SECRET='.bin2hex(random_bytes(32)));
$_SERVER['HTTP_HOST']='127.0.0.1:8000';
require dirname(__DIR__,2).'/hashcod-review.php';
function checkReview(bool $ok,string $message): void { if(!$ok) throw new RuntimeException($message); }
$token='synthetic-owned-period';$csrf=reviewCsrf($token);$data=mldsaOpen($csrf);
checkReview($data['kind']==='review-csrf-v1' && $data['period']===hash('sha256',$token),'CSRF must bind the signed period');
checkReview(!str_contains($csrf,$token),'CSRF reveals session token');
$_SERVER['HTTP_X_HASHCOD_REVIEW_CSRF']=$csrf;reviewCheckCsrf($token);
checkReview(securityIsDeniedPath('/review-backend/server.py'),'Backend source is public');
checkReview(securityIsDeniedPath('/sandbox-runner/wasm.py'),'Sandbox source is public');
checkReview(securityIsDeniedPath('/tools/review/protocol.py'),'Protocol source is public');
foreach(['', $csrf.'tampered',mldsaSeal(array_merge($data,['period'=>hash('sha256','foreign')])),mldsaSeal(array_merge($data,['host'=>'foreign.test'])),mldsaSeal(array_merge($data,['expiresAt'=>time()-1]))] as $invalid) {
    $script='define("HCR_LIBRARY_ONLY",true);putenv("L8_ACCESS_GATE_COOKIE_SECRET=".'.var_export(getenv('L8_ACCESS_GATE_COOKIE_SECRET'),true).');$_SERVER["HTTP_HOST"]="127.0.0.1:8000";$_SERVER["HTTP_X_HASHCOD_REVIEW_CSRF"]='.var_export($invalid,true).';require '.var_export(dirname(__DIR__,2).'/hashcod-review.php',true).';reviewCheckCsrf('.var_export($token,true).');';
    $p=proc_open([PHP_BINARY,'-r',$script],[1=>['pipe','w'],2=>['pipe','w']],$pipes);$output=json_decode(stream_get_contents($pipes[1]),true);fclose($pipes[1]);fclose($pipes[2]);proc_close($p);
    checkReview(($output['ok']??true)===false,'Invalid CSRF accepted');
}
echo "Review PHP: CSRF, host/period binding, expiry, tampering and private sources OK\n";
