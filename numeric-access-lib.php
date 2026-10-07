<?php
declare(strict_types=1);
require_once __DIR__ . '/mldsa-access.php';

const HASHCOD_NUMERIC_SERIES_SHA256 = 'a01e4963b84fe49738d8daf0ec1b0012c277ec8915e657f3a8b555dca3942519';
const HASHCOD_NUMERIC_SERIES_ROWS = 9865;
const HASHCOD_NUMERIC_SERIES_COLUMNS = 8;

// Server configuration only; the established verifier remains the default.
function numericAccessExpectedDigest(): string {
    $configured = trim((string)secretGet('L8_NUMERIC_SERIES_SHA256', ''));
    return preg_match('/^[a-f0-9]{64}$/D', $configured) ? $configured : HASHCOD_NUMERIC_SERIES_SHA256;
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
    return hash_equals((string)($data['proof']??''),numericAccessExpectedDigest());
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
        'proof'=>numericAccessExpectedDigest()
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

