<?php
declare(strict_types=1);

require_once __DIR__ . '/code-access-lib.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, max-age=0, must-revalidate');
header('Pragma: no-cache');

function meshAccessJson(array $payload,int $status=200): void {
    http_response_code($status);
    echo json_encode($payload,JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE);
    exit;
}

function meshAccessFail(string $code,string $message,int $status=400,array $extra=[]): void {
    meshAccessJson(array_merge([
        'ok'=>false,
        'code'=>$code,
        'error'=>$message
    ],$extra),$status);
}

if(!codeAccessRequired()){
    meshAccessJson([
        'ok'=>true,
        'required'=>false,
        'authorized'=>true,
        'bound'=>false,
        'schema'=>meshAccessSchema(),
        'fields'=>meshAccessFieldNames()
    ]);
}

$method=strtoupper((string)($_SERVER['REQUEST_METHOD']??'GET'));

if(function_exists('securityRateAllowSliding')){
    $rate=securityRateAllowSliding(
        'hashcod_mesh_access_v1',
        $method==='POST'?12:40,
        60
    );
    if(empty($rate['allowed'])){
        meshAccessFail(
            'rate_limited',
            'Too many requests. Wait briefly before trying again.',
            429,
            ['retry_after'=>(int)($rate['retry_after']??60)]
        );
    }
}

if($method==='GET'){
    $binding=meshAccessReadBinding();
    meshAccessJson([
        'ok'=>true,
        'required'=>true,
        'authorized'=>false,
        'bound'=>is_array($binding),
        'schema'=>meshAccessSchema(),
        'fields'=>meshAccessFieldNames(),
        'template'=>meshAccessTemplate()
    ]);
}

if($method!=='POST'){
    header('Allow: GET, POST');
    meshAccessFail('method_not_allowed','Method not allowed.',405);
}

$fetchSite=strtolower(trim((string)($_SERVER['HTTP_SEC_FETCH_SITE']??'')));
if($fetchSite!==''&&!in_array($fetchSite,['same-origin','same-site'],true)){
    meshAccessFail('cross_site_denied','Cross-site mesh binding requests are not allowed.',403);
}

if(!hash_equals('1',trim((string)($_SERVER['HTTP_X_HASHCOD_MESH']??'')))){
    meshAccessFail('missing_mesh_header','Missing Hashcod mesh request marker.',400);
}

$raw=(string)file_get_contents('php://input');
if(strlen($raw)>12000){
    meshAccessFail('payload_too_large','Mesh credential payload is too large.',413);
}

$body=json_decode($raw,true);
if(!is_array($body)){
    meshAccessFail('invalid_json','Invalid JSON request.',400);
}

$fields=$body['fields']??null;
if(!is_array($fields)){
    meshAccessFail('invalid_fields','Mesh credential fields are required.',400);
}

$normalized=meshAccessNormalizeFields($fields);
if(!is_array($normalized)){
    meshAccessFail(
        'invalid_fields',
        'Fill every mesh credential field with a non-empty value.',
        400
    );
}

$digest=meshAccessDigest($normalized);
$binding=meshAccessReadBinding();

if(!is_array($binding)){
    meshAccessWriteBinding($digest);
    meshAccessJson([
        'ok'=>true,
        'required'=>true,
        'authorized'=>true,
        'bound'=>true,
        'enrolled'=>true,
        'schema'=>meshAccessSchema(),
        'message'=>'This mesh credential is now bound to this browser.'
    ]);
}

$stored=(string)$binding['digest'];
if(!hash_equals($stored,$digest)){
    meshAccessFail(
        'binding_mismatch',
        'This browser is already bound to a different mesh credential. Enter the exact values used during the first enrollment.',
        409,
        ['bound'=>true]
    );
}

meshAccessJson([
    'ok'=>true,
    'required'=>true,
    'authorized'=>true,
    'bound'=>true,
    'enrolled'=>false,
    'schema'=>meshAccessSchema(),
    'message'=>'Mesh credential matched the stored binding.'
]);
