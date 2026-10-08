<?php
declare(strict_types=1);
define('HCS_LIBRARY_ONLY', true);
require_once __DIR__ . '/hashcod-shared-cloud.php';
require_once __DIR__ . '/platform-period-lib.php';

/** The same facade is packaged for Windows; credentials remain in the cloud. */
function skillChatOrigin(): string {
    $origin = mldsaScheme().'://'.mldsaHost();
    $allowed = ['https://hashcodcodespace.dev', 'https://hashcod-codespace-1-production.up.railway.app'];
    if (in_array($origin, $allowed, true)) return $origin;
    if (preg_match('~^http://(?:127\.0\.0\.1|localhost|\[::1\]):([0-9]{4,5})$~', $origin, $matches)
        && (int)$matches[1] >= 1024 && (int)$matches[1] <= 65535) return $origin;
    hcsJson(['ok'=>false,'error'=>'Origen del editor no autorizado.'],403);
}
function skillChatRoute(string $path, string $method): ?array {
    $uuid = '[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}';
    $fixed = ['GET'=>['/bootstrap','/commands','/projects','/registry'], 'POST'=>['/sessions']];
    if (in_array($path, $fixed[$method] ?? [], true)) return ['path'=>$path, 'fields'=>$path==='/sessions'?['projectId']:[]];
    if ($method==='GET' && preg_match('~^/sessions/'.$uuid.'/(?:state|events-token)$~D', $path)) return ['path'=>$path,'fields'=>[]];
    if ($method==='GET' && preg_match('~^/projects/'.$uuid.'/(?:versions|export)$~D', $path)) return ['path'=>$path,'fields'=>[]];
    if (preg_match('~^/sessions/'.$uuid.'/(exec|file|import|registry|ai)$~D', $path, $matches)) {
        $fields = ['exec'=>['input','revision'], 'file'=>['path','content','revision'], 'import'=>['name','content','revision'], 'registry'=>['id','revision'], 'ai'=>['apiKey','model','budgetMicros','consent']];
        if ($method==='POST' || ($method==='DELETE' && $matches[1]==='ai')) return ['path'=>$path,'fields'=>$method==='DELETE'?[]:$fields[$matches[1]]];
    }
    return null;
}
function skillChatCsrf(string $period): string {
    return mldsaSeal(['kind'=>'skill-chat-csrf-v1','host'=>mldsaHost(),'period'=>hash('sha256',$period),'expiresAt'=>time()+1800]);
}
function skillChatCheckCsrf(string $period): void {
    $raw = (string)($_SERVER['HTTP_X_HASHCOD_SKILL_CSRF']??'');
    $proof = strlen($raw)<=4096 ? mldsaOpen($raw) : null;
    if (!is_array($proof) || ($proof['kind']??'')!=='skill-chat-csrf-v1' || !is_int($proof['expiresAt']??null) || $proof['expiresAt']<time()
        || !hash_equals(mldsaHost(),(string)($proof['host']??'')) || !hash_equals(hash('sha256',$period),(string)($proof['period']??'')))
        hcsJson(['ok'=>false,'error'=>'Actualiza el editor para renovar la sesión.'],403);
}
function skillChatBackend(string $path, string $method, ?array $body, string $origin, string $access=''): array {
    $handle = function_exists('curl_init') ? curl_init('https://hashcod-skill-chat-production.up.railway.app'.$path) : false;
    if ($handle===false) hcsJson(['ok'=>false,'error'=>'El editor no está disponible.'],503);
    $raw=''; $tooLarge=false;
    $headers = ['Accept: application/json','Content-Type: application/json','X-Hashcod-Origin: '.$origin];
    if ($access!=='') $headers[]='Authorization: Bearer '.$access;
    curl_setopt_array($handle,[CURLOPT_CUSTOMREQUEST=>$method,CURLOPT_FOLLOWLOCATION=>false,CURLOPT_CONNECTTIMEOUT=>8,CURLOPT_TIMEOUT=>45,
        CURLOPT_HTTPHEADER=>$headers, CURLOPT_WRITEFUNCTION=>static function($ch,string $chunk) use (&$raw,&$tooLarge): int {
            if (strlen($raw)+strlen($chunk)>25165824) { $tooLarge=true; return 0; } $raw.=$chunk; return strlen($chunk);
        }]);
    if ($body!==null) curl_setopt($handle,CURLOPT_POSTFIELDS,json_encode($body,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES));
    $success=curl_exec($handle); $status=(int)curl_getinfo($handle,CURLINFO_RESPONSE_CODE); $type=(string)curl_getinfo($handle,CURLINFO_CONTENT_TYPE); curl_close($handle);
    if ($success===false || $tooLarge || $status<200 || $status>=600) hcsJson(['ok'=>false,'error'=>'No se pudo conectar con el editor. Intenta de nuevo.'],503);
    return ['status'=>$status,'raw'=>$raw,'type'=>$type,'data'=>json_decode($raw,true)];
}
function skillChatCookieValue(string $name, string $period): string {
    $raw = (string)($_COOKIE[$name]??''); $proof = strlen($raw)<=8192?mldsaOpen($raw):null;
    if (!is_array($proof) || ($proof['kind']??'')!==$name || ($proof['expiresAt']??0)<=time()
        || !hash_equals(mldsaHost(),(string)($proof['host']??'')) || !hash_equals(hash('sha256',$period),(string)($proof['period']??''))) return '';
    $token=$proof['token']??'';
    return is_string($token) && strlen($token)<=4096 && preg_match('~^[A-Za-z0-9._-]+$~D',$token) ? $token : '';
}
function skillChatSetAuth(array $data, string $period): string {
    foreach (['hashcod_skill_access_v1'=>['accessToken',900], 'hashcod_skill_refresh_v1'=>['refreshToken',604800]] as $name=>$settings) {
        $value=$data[$settings[0]]??'';
        if (!is_string($value) || strlen($value)>4096 || !preg_match('~^[A-Za-z0-9._-]+$~D',$value)) hcsJson(['ok'=>false,'error'=>'Sesión del editor incorrecta.'],503);
        $expires=time()+$settings[1];
        $cookie=mldsaSeal(['kind'=>$name,'host'=>mldsaHost(),'period'=>hash('sha256',$period),'expiresAt'=>$expires,'token'=>$value]);
        mldsaCookie($name,$cookie,$expires); $_COOKIE[$name]=$cookie;
    }
    return $data['accessToken'];
}
function skillChatAuthenticate(string $period,string $origin,bool $refresh=false): string {
    if (!$refresh && ($access=skillChatCookieValue('hashcod_skill_access_v1',$period))!=='') return $access;
    $refreshToken=skillChatCookieValue('hashcod_skill_refresh_v1',$period);
    $body=['token'=>$period,'origin'=>$origin];
    $path='/auth/platform';
    if ($refreshToken!=='') { $path='/auth/refresh'; $body['refreshToken']=$refreshToken; }
    $result=skillChatBackend($path,'POST',$body,$origin);
    if ($result['status']!==200 || !is_array($result['data']) || empty($result['data']['ok'])) {
        if ($refreshToken!=='' && $result['status']===401) {
            $result=skillChatBackend('/auth/platform','POST',['token'=>$period,'origin'=>$origin],$origin);
        }
        if ($result['status']!==200 || !is_array($result['data']) || empty($result['data']['ok'])) skillChatReply($result);
    }
    return skillChatSetAuth($result['data'],$period);
}
function skillChatReply(array $result): void {
    if (!is_array($result['data'])) hcsJson(['ok'=>false,'error'=>'Respuesta del editor incorrecta.'],503);
    $data=$result['data'];
    unset($data['owner'],$data['accessToken'],$data['refreshToken']);
    hcsJson($data,$result['status']);
}
if (defined('HSC_EDITOR_LIBRARY_ONLY') && HSC_EDITOR_LIBRARY_ONLY) return;
platformPeriodGuard(); securityBootstrap('api');
$method=(string)($_SERVER['REQUEST_METHOD']??'GET');
$path=(string)($_SERVER['HASHCOD_SKILL_CHAT_PATH']??'');
$route=skillChatRoute($path,$method);
if ($route===null) hcsJson(['ok'=>false,'error'=>'Ruta del editor incorrecta.'],404);
if (in_array($_SERVER['HTTP_SEC_FETCH_SITE']??'',['cross-site','same-site'],true)) hcsJson(['ok'=>false,'error'=>'Se requiere el mismo origen.'],403);
$period=(string)(platformPeriodData()['token']??''); $origin=skillChatOrigin(); $body=null;
if ($method!=='GET') {
    if (!mldsaOriginAllowed() || strcasecmp((string)($_SERVER['HTTP_X_REQUESTED_WITH']??''),'XMLHttpRequest')!==0) hcsJson(['ok'=>false,'error'=>'Se requiere una solicitud del mismo origen.'],403);
    skillChatCheckCsrf($period);
    if ((int)($_SERVER['CONTENT_LENGTH']??0)>2097152) hcsJson(['ok'=>false,'error'=>'Solicitud demasiado grande.'],413);
    $raw=file_get_contents('php://input',false,null,0,2097153);
    $body=is_string($raw)&&$raw!==''?json_decode($raw,true):[];
    if (!is_array($body) || strlen((string)$raw)>2097152 || array_diff(array_keys($body),$route['fields'])) hcsJson(['ok'=>false,'error'=>'Solicitud incorrecta.'],400);
}
$limit=securityRateAllowSliding('skill_chat_'.($method==='GET'?'read':'write'),$method==='GET'?120:60,60);
if (empty($limit['allowed'])) hcsJson(['ok'=>false,'error'=>'Espera un minuto antes de continuar.'],429);
if (str_ends_with($path,'/export')) {
    $format=$_GET['format']??'zip';
    if (!is_string($format) || !in_array($format,['zip','md','yaml','coffee','dart'],true) || array_diff(array_keys($_GET),['format'])) hcsJson(['ok'=>false,'error'=>'Formato incorrecto.'],400);
    $path.='?format='.$format;
}
$access=skillChatAuthenticate($period,$origin);
$result=skillChatBackend($path,$method,$body,$origin,$access);
if ($result['status']===401) {
    $access=skillChatAuthenticate($period,$origin,true);
    // An authentication rejection happens before any mutation in the API.
    $result=skillChatBackend($path,$method,$body,$origin,$access);
}
unset($body['apiKey']);
if ($route['path']==='/bootstrap' && is_array($result['data']) && !empty($result['data']['ok'])) $result['data']['csrf']=skillChatCsrf($period);
if (str_contains($route['path'],'/export') && $result['status']===200) {
    header('Content-Type: '.($format==='zip'?'application/zip':'text/plain; charset=utf-8'));
    header('Content-Disposition: attachment; filename="hashcod-package.'.$format.'"');
    header('Cache-Control: no-store'); echo $result['raw']; exit;
}
skillChatReply($result);
