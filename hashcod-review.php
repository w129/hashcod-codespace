<?php
declare(strict_types=1);
define('HCS_LIBRARY_ONLY', true);
require_once __DIR__ . '/hashcod-shared-cloud.php';
require_once __DIR__ . '/tokenization-lib.php';

function reviewBackend(array $body): array {
    // Shared by Railway and Windows. No server secret is bundled with the app.
    $url = 'https://hashcod-review-backend-production.up.railway.app/v1/review';
    if (!function_exists('curl_init')) hcsJson(['ok'=>false,'error'=>'La revisión no está disponible.'],503);
    $handle = curl_init($url); $raw = ''; $tooLarge = false;
    curl_setopt_array($handle, [CURLOPT_POST=>true,CURLOPT_FOLLOWLOCATION=>false,CURLOPT_CONNECTTIMEOUT=>8,CURLOPT_TIMEOUT=>140,
        CURLOPT_HTTPHEADER=>['Content-Type: application/json','Accept: application/json'],
        CURLOPT_POSTFIELDS=>json_encode($body,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES),
        CURLOPT_WRITEFUNCTION=>static function($ch,string $chunk) use (&$raw,&$tooLarge): int {
            if (strlen($raw)+strlen($chunk)>262144) { $tooLarge=true; return 0; } $raw.=$chunk; return strlen($chunk);
        }]);
    $success=curl_exec($handle); $status=(int)curl_getinfo($handle,CURLINFO_RESPONSE_CODE); curl_close($handle);
    $data=json_decode($raw,true);
    if ($success===false||$tooLarge||$status<200||$status>=600||!is_array($data)) hcsJson(['ok'=>false,'error'=>'No se pudo conectar con el servicio de revisión.'],503);
    // Internal identifiers and authentication proofs never reach the client.
    unset($data['owner']);
    return ['data'=>$data,'status'=>$status];
}
function reviewCsrf(string $token): string {
    return mldsaSeal(['kind'=>'review-csrf-v1','host'=>mldsaHost(),'period'=>hash('sha256',$token),'expiresAt'=>time()+1800]);
}
function reviewCheckCsrf(string $token): void {
    $raw=(string)($_SERVER['HTTP_X_HASHCOD_REVIEW_CSRF']??'');
    $proof=strlen($raw)<=4096?mldsaOpen($raw):null;
    if (!is_array($proof)||($proof['kind']??'')!=='review-csrf-v1'||($proof['expiresAt']??0)<time()
        ||!hash_equals(mldsaHost(),(string)($proof['host']??''))||!hash_equals(hash('sha256',$token),(string)($proof['period']??''))) hcsJson(['ok'=>false,'error'=>'Actualiza el chat para renovar la sesión.'],403);
}
if (defined('HCR_LIBRARY_ONLY') && HCR_LIBRARY_ONLY) return;
$public=(string)($_SERVER['HASHCOD_REVIEW_PUBLIC']??'');
if ($public!=='') {
    if (($_SERVER['REQUEST_METHOD']??'')!=='GET'||!in_array($public,['verify','revoked'],true)) hcsJson(['ok'=>false,'error'=>'Method not allowed.'],405);
    securityBootstrap('api');
    $result=reviewBackend(['action'=>$public,'id'=>is_string($_GET['id']??null)?$_GET['id']:'']);
    hcsJson($result['data'],$result['status']);
}
platformPeriodGuard(true);
securityBootstrap('api');
$token=(string)(platformPeriodData()['token']??'');
if (($_SERVER['REQUEST_METHOD']??'')==='GET') {
    $result=reviewBackend(['action'=>'list','token'=>$token]);
    if (!empty($result['data']['ok'])) $result['data']['csrf']=reviewCsrf($token);
    hcsJson($result['data'],$result['status']);
}
if (($_SERVER['REQUEST_METHOD']??'')!=='POST') hcsJson(['ok'=>false,'error'=>'Method not allowed.'],405);
if (!mldsaOriginAllowed()||in_array($_SERVER['HTTP_SEC_FETCH_SITE']??'',['cross-site','same-site'],true)
    ||strcasecmp((string)($_SERVER['HTTP_X_REQUESTED_WITH']??''),'XMLHttpRequest')!==0) hcsJson(['ok'=>false,'error'=>'Se requiere una solicitud del mismo origen.'],403);
reviewCheckCsrf($token);
if ((int)($_SERVER['CONTENT_LENGTH']??0)>16384) hcsJson(['ok'=>false,'error'=>'Solicitud demasiado grande.'],413);
$raw=file_get_contents('php://input',false,null,0,16385); $body=is_string($raw)?json_decode($raw,true):null;
if (!is_array($body)||strlen((string)$raw)>16384) hcsJson(['ok'=>false,'error'=>'Solicitud incorrecta.'],400);
$action=$body['action']??'';
$fields=['start'=>['id','api_key','model','consent','budget_micros'],'message'=>['session_id','text'],
    'finalize'=>['session_id'],'history'=>['session_id'],'close'=>['session_id'],'revoke'=>['id','reason']];
if (!is_string($action)||!isset($fields[$action])) hcsJson(['ok'=>false,'error'=>'Acción incorrecta.'],400);
$limit=securityRateAllowSliding('review_'.$action,$action==='start'?6:30,60);
if (empty($limit['allowed'])) hcsJson(['ok'=>false,'error'=>'Espera un minuto antes de continuar.'],429);
$forward=['action'=>$action,'token'=>$token];
foreach($fields[$action] as $field) $forward[$field]=$body[$field]??null;
if ($action==='revoke') {
    $forward['adminTicket']=tokenizationAdminTicket();
    if ($forward['adminTicket']==='') hcsJson(['ok'=>false,'error'=>'Se requiere acceso administrativo.'],403);
}
$result=reviewBackend($forward); unset($forward['api_key'],$body['api_key']);
hcsJson($result['data'],$result['status']);
