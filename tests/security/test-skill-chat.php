<?php
declare(strict_types=1);
define('HSC_EDITOR_LIBRARY_ONLY',true);
putenv('L8_ACCESS_GATE_COOKIE_SECRET='.bin2hex(random_bytes(32)));
$_SERVER['HTTP_HOST']='127.0.0.1:8000';
require dirname(__DIR__,2).'/hashcod-skill-chat.php';
function editorAssert(bool $ok,string $message): void {if(!$ok)throw new RuntimeException($message);}
$token='synthetic-period';$csrf=skillChatCsrf($token);$proof=mldsaOpen($csrf);
editorAssert($proof['kind']==='skill-chat-csrf-v1'&&$proof['period']===hash('sha256',$token),'Wrong CSRF binding');
$_SERVER['HTTP_X_HASHCOD_SKILL_CSRF']=$csrf;skillChatCheckCsrf($token);
editorAssert(skillChatOrigin()==='http://127.0.0.1:8000','Windows origin rejected');
editorAssert(securityIsDeniedPath('/skill-chat/apps/api/src/server.ts'),'API source public');
editorAssert(securityIsDeniedPath('/skill-chat/apps/worker/src/server.ts'),'Worker source public');
$id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
foreach(['/bootstrap','/commands','/projects','/registry','/sessions/'.$id.'/state','/sessions/'.$id.'/events-token','/projects/'.$id.'/export'] as $path) editorAssert(skillChatRoute($path,'GET')!==null,'Valid GET rejected');
foreach(['/sessions/'.$id.'/exec','/sessions/'.$id.'/file','/sessions/'.$id.'/import','/sessions/'.$id.'/registry','/sessions/'.$id.'/ai'] as $path) editorAssert(skillChatRoute($path,'POST')!==null,'Valid POST rejected');
foreach(['/auth/platform','/healthz','/sessions/../../auth/platform','/sessions/'.$id.'/state?owner=other','https://foreign.test/','//foreign.test','/sessions/'.$id.'/exec/'] as $path) editorAssert(skillChatRoute($path,'GET')===null&&skillChatRoute($path,'POST')===null,'Unsafe route accepted');
$name='hashcod_skill_access_v1';$_COOKIE[$name]=mldsaSeal(['kind'=>$name,'host'=>mldsaHost(),'period'=>hash('sha256',$token),'expiresAt'=>time()+60,'token'=>'synthetic.jwt.token']);
editorAssert(skillChatCookieValue($name,$token)==='synthetic.jwt.token','Bound cookie rejected');
editorAssert(skillChatCookieValue($name,'other')==='','Cookie accepted for another period');
$_SERVER['HTTP_HOST']='foreign.test';editorAssert(skillChatCookieValue($name,$token)==='','Cookie accepted for another host');$_SERVER['HTTP_HOST']='127.0.0.1:8000';
foreach(['',$csrf.'tampered',mldsaSeal(array_merge($proof,['expiresAt'=>time()-1])),mldsaSeal(array_merge($proof,['host'=>'other.test'])),mldsaSeal(array_merge($proof,['period'=>hash('sha256','other')]))] as $bad){
 $code='define("HSC_EDITOR_LIBRARY_ONLY",true);putenv("L8_ACCESS_GATE_COOKIE_SECRET=".'.var_export(getenv('L8_ACCESS_GATE_COOKIE_SECRET'),true).');$_SERVER["HTTP_HOST"]="127.0.0.1:8000";require '.var_export(dirname(__DIR__,2).'/hashcod-skill-chat.php',true).';$_SERVER["HTTP_X_HASHCOD_SKILL_CSRF"]='.var_export($bad,true).';skillChatCheckCsrf('.var_export($token,true).');';
 $p=proc_open([PHP_BINARY,'-r',$code],[1=>['pipe','w'],2=>['pipe','w']],$pipes);$result=json_decode(stream_get_contents($pipes[1]),true);fclose($pipes[1]);fclose($pipes[2]);proc_close($p);editorAssert(($result['ok']??true)===false,'Invalid CSRF accepted');
}
echo "Skill editor PHP: routes, CSRF, host/period cookies, Windows origin and private sources OK\n";
