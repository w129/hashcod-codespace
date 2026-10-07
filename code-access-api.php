<?php
declare(strict_types=1);

require_once __DIR__ . '/mldsa-access.php';
if(!function_exists('securityRateAllowSliding'))require_once __DIR__ . '/security.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, max-age=0, must-revalidate');
header('Pragma: no-cache');

require_once __DIR__ . '/numeric-access-lib.php';

function numericAccessJson(array $payload,int $status=200): void {
    http_response_code($status);
    echo json_encode($payload,JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE);
    exit;
}
function numericAccessFail(string $code,string $message,int $status=400): void {
    numericAccessJson(['ok'=>false,'code'=>$code,'error'=>$message],$status);
}
if(!codeAccessRequired()){
    numericAccessJson(['ok'=>true,'required'=>false,'authorized'=>true]);
}

$method=strtoupper((string)($_SERVER['REQUEST_METHOD']??'GET'));
if(function_exists('securityRateAllowSliding')){
    $rate=securityRateAllowSliding('hashcod_numeric_access_v4_'.$method,$method==='POST'?6:40,60);
    if(empty($rate['allowed']))numericAccessFail('access_unavailable','Acceso no disponible.',429);
}

if($method==='GET'){
    numericAccessJson([
        'ok'=>true,
        'required'=>true,
        'authorized'=>numericAccessAuthorized(),
        'bound'=>numericAccessAuthorized(),
        'available'=>true,
        'protocol'=>'HASHCOD-NUMERIC-SERIES/1',
        'expected_rows'=>HASHCOD_NUMERIC_SERIES_ROWS,
        'columns_per_row'=>HASHCOD_NUMERIC_SERIES_COLUMNS
    ]);
}
if($method!=='POST'){
    header('Allow: GET, POST');
    numericAccessFail('method_not_allowed','Acceso no disponible.',405);
}

$fetchSite=strtolower(trim((string)($_SERVER['HTTP_SEC_FETCH_SITE']??'')));
if($fetchSite!==''&&!in_array($fetchSite,['same-origin','same-site'],true)){
    numericAccessFail('access_unavailable','Acceso no disponible.',403);
}

if(isset($_SERVER['HTTP_ORIGIN'])&&!mldsaOriginAllowed())numericAccessFail('access_unavailable','Solicitud no permitida.',403);
if((int)($_SERVER['CONTENT_LENGTH']??0)>380000)numericAccessFail('access_unavailable','Solicitud demasiado grande.',413);
$raw=(string)file_get_contents('php://input',false,null,0,380001);
if(strlen($raw)>380000)numericAccessFail('access_unavailable','Acceso no disponible.',413);
$body=json_decode($raw,true);
if(!is_array($body))numericAccessFail('access_unavailable','Acceso no disponible.',400);

if(!hash_equals('1',trim((string)($_SERVER['HTTP_X_HASHCOD_NUMERIC_SERIES']??'')))){
    numericAccessFail('access_unavailable','Acceso no disponible.',400);
}

$series=$body['series']??null;
if(!is_string($series)||trim($series)==='')numericAccessFail('access_denied','Credencial incorrecta.',400);
$normalized=numericAccessNormalize($series);
if(empty($normalized['ok'])||!hash_equals(numericAccessExpectedDigest(),(string)($normalized['sha256']??''))){
    numericAccessFail('access_denied','Credencial incorrecta.',401);
}

numericAccessGrant();
numericAccessJson([
    'ok'=>true,
    'required'=>true,
    'authorized'=>true,
    'bound'=>true,
    'protocol'=>'HASHCOD-NUMERIC-SERIES/1',
    'message'=>'Acceso confirmado.'
]);
