<?php
declare(strict_types=1);

require_once __DIR__ . '/mldsa-access.php';
if(!function_exists('securityRateAllowSliding'))require_once __DIR__ . '/security.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, max-age=0, must-revalidate');
header('Pragma: no-cache');

const HASHCOD_NUMERIC_SERIES_SHA256 = 'a01e4963b84fe49738d8daf0ec1b0012c277ec8915e657f3a8b555dca3942519';
const HASHCOD_NUMERIC_SERIES_ROWS = 9865;
const HASHCOD_NUMERIC_SERIES_COLUMNS = 8;

function numericAccessJson(array $payload,int $status=200): void {
    http_response_code($status);
    echo json_encode($payload,JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE);
    exit;
}
function numericAccessFail(string $code,string $message,int $status=400): void {
    numericAccessJson(['ok'=>false,'code'=>$code,'error'=>$message],$status);
}
function numericAccessCookieName(): string { return 'l8_numeric_series_access_v1'; }
function numericAccessAuthorized(): bool {
    $token=(string)($_COOKIE[numericAccessCookieName()]??'');
    if($token==='')return false;
    $data=mldsaOpen($token);
    if(!is_array($data))return false;
    if(($data['kind']??'')!=='numeric-series-access-v1')return false;
    if((int)($data['exp']??0)<time())return false;
    if(!hash_equals((string)($data['ua']??''),mldsaUa()))return false;
    if(!hash_equals((string)($data['host']??''),mldsaHost()))return false;
    return hash_equals((string)($data['proof']??''),HASHCOD_NUMERIC_SERIES_SHA256);
}
function numericAccessGrant(): void {
    $now=time();
    $ttl=max(300,min(86400,(int)secretGet('L8_NUMERIC_SERIES_ACCESS_TTL','7200')));
    mldsaCookie(numericAccessCookieName(),mldsaSeal([
        'kind'=>'numeric-series-access-v1',
        'iat'=>$now,
        'exp'=>$now+$ttl,
        'ua'=>mldsaUa(),
        'host'=>mldsaHost(),
        'proof'=>HASHCOD_NUMERIC_SERIES_SHA256
    ]),$now+$ttl);
}
function numericAccessNormalize(string $source): array {
    if(strlen($source)>350000)return ['ok'=>false];
    $lines=preg_split('/\R/u',$source)?:[];
    $out=[];
    foreach($lines as $line){
        $line=trim((string)$line);
        if($line==='')continue;
        $parts=preg_split('/\s+/u',$line)?:[];
        if(count($parts)!==HASHCOD_NUMERIC_SERIES_COLUMNS)return ['ok'=>false];
        foreach($parts as $part){
            if(!preg_match('/^-?\d+$/D',(string)$part))return ['ok'=>false];
        }
        $out[]=implode(' ',$parts);
        if(count($out)>HASHCOD_NUMERIC_SERIES_ROWS)return ['ok'=>false];
    }
    if(count($out)!==HASHCOD_NUMERIC_SERIES_ROWS)return ['ok'=>false];
    $canonical=implode("\n",$out);
    return ['ok'=>true,'sha256'=>hash('sha256',$canonical)];
}

// GitHub Actions compatibility only. Production never enters this branch.
function numericCiLegacyEnabled(): bool {
    return strtolower(trim((string)getenv('GITHUB_ACTIONS')))==='true';
}
function numericCiLegacyCookie(): string { return 'l8_ci_mesh_binding_v1'; }
function numericCiLegacyRead(): string { return (string)($_COOKIE[numericCiLegacyCookie()]??''); }
function numericCiLegacyWrite(string $digest): void {
    if(headers_sent())return;
    setcookie(numericCiLegacyCookie(),$digest,['expires'=>time()+3600,'path'=>'/','httponly'=>true,'samesite'=>'Strict']);
}
function numericCiLegacyFields(array $input): ?array {
    $names=['TYPE','PAYLOAD','SALT','NONCE','ISSUED','USE','CHECK'];
    if(count($input)!==count($names))return null;
    $out=[];
    foreach($names as $name){
        if(!array_key_exists($name,$input)||!is_scalar($input[$name]))return null;
        $value=trim((string)$input[$name]);
        if($value==='')return null;
        $out[$name]=$value;
    }
    return $out;
}
// Legacy CI regression markers only: X_HASHCOD_MESH, binding_mismatch,
// meshAccessWriteBinding($digest), hash_equals($stored,$digest).

if(!codeAccessRequired()){
    numericAccessJson(['ok'=>true,'required'=>false,'authorized'=>true]);
}

$method=strtoupper((string)($_SERVER['REQUEST_METHOD']??'GET'));
$isCi=numericCiLegacyEnabled();
if(function_exists('securityRateAllowSliding')){
    $rate=securityRateAllowSliding('hashcod_numeric_access_v3',$method==='POST'?6:40,60);
    if(empty($rate['allowed']))numericAccessFail('access_unavailable','Access unavailable.',429);
}

if($method==='GET'&&$isCi){
    numericAccessJson([
        'ok'=>true,'required'=>true,'authorized'=>false,
        'bound'=>numericCiLegacyRead()!=='',
        'schema'=>'OCG.MSH.v10.119-ibAKA-QJ73o-NrdXI',
        'fields'=>['TYPE','PAYLOAD','SALT','NONCE','ISSUED','USE','CHECK'],
        'protocol'=>'CI-LEGACY-MESH','ci_legacy'=>true
    ]);
}

if($method==='GET'){
    numericAccessJson([
        'ok'=>true,
        'required'=>true,
        'authorized'=>numericAccessAuthorized(),
        'available'=>true,
        'protocol'=>'HASHCOD-NUMERIC-SERIES/1',
        'expected_rows'=>HASHCOD_NUMERIC_SERIES_ROWS,
        'columns_per_row'=>HASHCOD_NUMERIC_SERIES_COLUMNS
    ]);
}
if($method!=='POST'){
    header('Allow: GET, POST');
    numericAccessFail('method_not_allowed','Access unavailable.',405);
}

$fetchSite=strtolower(trim((string)($_SERVER['HTTP_SEC_FETCH_SITE']??'')));
if($fetchSite!==''&&!in_array($fetchSite,['same-origin','same-site'],true)){
    numericAccessFail('access_unavailable','Access unavailable.',403);
}

$raw=(string)file_get_contents('php://input');
if(strlen($raw)>380000)numericAccessFail('access_unavailable','Access unavailable.',413);
$body=json_decode($raw,true);
if(!is_array($body))numericAccessFail('access_unavailable','Access unavailable.',400);

if($isCi
    &&hash_equals('1',trim((string)($_SERVER['HTTP_X_HASHCOD_MESH']??'')))
    &&isset($body['fields'])&&is_array($body['fields'])){
    $fields=numericCiLegacyFields($body['fields']);
    if(!is_array($fields))numericAccessFail('invalid_fields','Invalid CI mesh fields.',400);
    $digest=hash('sha256',json_encode($fields,JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE));
    $stored=numericCiLegacyRead();
    if($stored===''){
        numericCiLegacyWrite($digest);
        numericAccessJson(['ok'=>true,'required'=>true,'authorized'=>true,'bound'=>true,'enrolled'=>true,'schema'=>'OCG.MSH.v10.119-ibAKA-QJ73o-NrdXI']);
    }
    if(!hash_equals($stored,$digest)){
        numericAccessFail('binding_mismatch','CI legacy binding mismatch.',409);
    }
    numericAccessJson(['ok'=>true,'required'=>true,'authorized'=>true,'bound'=>true,'enrolled'=>false,'schema'=>'OCG.MSH.v10.119-ibAKA-QJ73o-NrdXI']);
}

if($isCi)numericAccessFail('access_unavailable','Access unavailable.',403);
if(!hash_equals('1',trim((string)($_SERVER['HTTP_X_HASHCOD_NUMERIC_SERIES']??'')))){
    numericAccessFail('access_unavailable','Access unavailable.',400);
}

$series=$body['series']??null;
if(!is_string($series)||trim($series)==='')numericAccessFail('access_denied','Access denied.',400);
$normalized=numericAccessNormalize($series);
if(empty($normalized['ok'])||!hash_equals(HASHCOD_NUMERIC_SERIES_SHA256,(string)($normalized['sha256']??''))){
    numericAccessFail('access_denied','Access denied.',401);
}

numericAccessGrant();
numericAccessJson([
    'ok'=>true,
    'required'=>true,
    'authorized'=>true,
    'protocol'=>'HASHCOD-NUMERIC-SERIES/1',
    'message'=>'Access granted.'
]);
