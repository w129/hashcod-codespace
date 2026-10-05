<?php
declare(strict_types=1);

require_once __DIR__ . '/mldsa-access.php';

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
function numericAccessFail(string $code,string $message,int $status=400,array $extra=[]): void {
    numericAccessJson(array_merge(['ok'=>false,'code'=>$code,'error'=>$message],$extra),$status);
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
    if(strlen($source)>350000)return ['ok'=>false,'code'=>'series_too_large','error'=>'The numeric series is too large.'];
    $lines=preg_split('/\R/u',$source)?:[];
    $out=[];
    foreach($lines as $line){
        $line=trim((string)$line);
        if($line==='')continue;
        $parts=preg_split('/\s+/u',$line)?:[];
        if(count($parts)!==HASHCOD_NUMERIC_SERIES_COLUMNS){
            return ['ok'=>false,'code'=>'invalid_columns','error'=>'Each row must contain exactly 8 integers.'];
        }
        foreach($parts as $part){
            if(!preg_match('/^-?\d+$/D',(string)$part)){
                return ['ok'=>false,'code'=>'invalid_number','error'=>'The series contains a non-integer value.'];
            }
        }
        $out[]=implode(' ',$parts);
        if(count($out)>HASHCOD_NUMERIC_SERIES_ROWS){
            return ['ok'=>false,'code'=>'too_many_rows','error'=>'The numeric series contains too many rows.'];
        }
    }
    if(count($out)!==HASHCOD_NUMERIC_SERIES_ROWS){
        return ['ok'=>false,'code'=>'row_count_mismatch','error'=>'The numeric series must contain exactly '.HASHCOD_NUMERIC_SERIES_ROWS.' rows.','rows'=>count($out)];
    }
    $canonical=implode("\n",$out);
    return ['ok'=>true,'canonical'=>$canonical,'sha256'=>hash('sha256',$canonical),'rows'=>count($out)];
}

if(!codeAccessRequired()){
    numericAccessJson(['ok'=>true,'required'=>false,'authorized'=>true]);
}

$method=strtoupper((string)($_SERVER['REQUEST_METHOD']??'GET'));
if(function_exists('securityRateAllowSliding')){
    $rate=securityRateAllowSliding('hashcod_numeric_series_access_v1',$method==='POST'?6:40,60);
    if(empty($rate['allowed']))numericAccessFail('rate_limited','Too many attempts. Try again shortly.',429,['retry_after'=>(int)($rate['retry_after']??60)]);
}

if($method==='GET'){
    numericAccessJson([
        'ok'=>true,
        'required'=>true,
        'authorized'=>numericAccessAuthorized(),
        'protocol'=>'HASHCOD-NUMERIC-SERIES/1',
        'expected_rows'=>HASHCOD_NUMERIC_SERIES_ROWS,
        'columns_per_row'=>HASHCOD_NUMERIC_SERIES_COLUMNS
    ]);
}
if($method!=='POST'){
    header('Allow: GET, POST');
    numericAccessFail('method_not_allowed','Method not allowed.',405);
}

$fetchSite=strtolower(trim((string)($_SERVER['HTTP_SEC_FETCH_SITE']??'')));
if($fetchSite!==''&&!in_array($fetchSite,['same-origin','same-site'],true)){
    numericAccessFail('cross_site_denied','Cross-site access requests are not allowed.',403);
}
if(!hash_equals('1',trim((string)($_SERVER['HTTP_X_HASHCOD_NUMERIC_SERIES']??'')))){
    numericAccessFail('missing_series_header','Missing Hashcod numeric-series request marker.',400);
}

$raw=(string)file_get_contents('php://input');
if(strlen($raw)>380000)numericAccessFail('payload_too_large','Request is too large.',413);
$body=json_decode($raw,true);
if(!is_array($body))numericAccessFail('invalid_json','Invalid JSON request.',400);
$series=$body['series']??null;
if(!is_string($series)||trim($series)==='')numericAccessFail('series_required','Paste the complete numeric series before validating.',400);

$normalized=numericAccessNormalize($series);
if(empty($normalized['ok']))numericAccessFail((string)$normalized['code'],(string)$normalized['error'],400,array_filter(['rows'=>$normalized['rows']??null],fn($v)=>$v!==null));
if(!hash_equals(HASHCOD_NUMERIC_SERIES_SHA256,(string)$normalized['sha256'])){
    numericAccessFail('series_mismatch','The numeric series does not match the authorized access series.',401,['rows'=>(int)$normalized['rows']]);
}

numericAccessGrant();
numericAccessJson([
    'ok'=>true,
    'required'=>true,
    'authorized'=>true,
    'protocol'=>'HASHCOD-NUMERIC-SERIES/1',
    'rows'=>(int)$normalized['rows'],
    'message'=>'Numeric access series verified.'
]);
