<?php
require_once __DIR__.'/mldsa-access.php';
header('Content-Type: application/json; charset=utf-8'); header('Cache-Control: no-store');
if(!mldsaAccessRequired()){echo json_encode(['ok'=>true,'required'=>false,'authorized'=>true]);exit;}
if(!mldsaAccessConfigured()){http_response_code(503);echo json_encode(['ok'=>false,'required'=>true,'code'=>'mldsa_not_configured','error'=>'ML-DSA-87 public key is unavailable or invalid.']);exit;}
if(function_exists('securityRateAllowSliding')){
  $r=securityRateAllowSliding('mldsa_access',($_SERVER['REQUEST_METHOD']??'GET')==='POST'?8:30,60);
  if(empty($r['allowed'])) securityRateDenyJson((int)($r['retry_after']??60));
}
if(($_SERVER['REQUEST_METHOD']??'GET')==='GET'){
  if(mldsaAccessAuthorized()){echo json_encode(['ok'=>true,'authorized'=>true]);exit;}
  $c=mldsaIssueChallenge(); echo json_encode(['ok'=>true,'authorized'=>false,'algorithm'=>'ML-DSA-87','standard'=>'NIST FIPS 204','challenge'=>$c['challenge'],'expires_at'=>$c['expires_at'],'ttl_seconds'=>$c['ttl_seconds'],'public_key_fingerprint'=>hash('sha256',mldsaAccessPublicKeyBytes())],JSON_UNESCAPED_SLASHES); exit;
}
if(($_SERVER['REQUEST_METHOD']??'')!=='POST'){http_response_code(405);exit;}
$raw=(string)file_get_contents('php://input'); if(strlen($raw)>12000){http_response_code(413);echo json_encode(['ok'=>false,'error'=>'Payload too large']);exit;}
$b=json_decode($raw,true); $sig=is_array($b)?trim((string)($b['signature']??'')):'';
$c=mldsaCurrentChallenge(); if($c===null){http_response_code(409);echo json_encode(['ok'=>false,'code'=>'challenge_expired','error'=>'El reto expiró. Genera uno nuevo.']);exit;}
if($sig===''||!mldsaVerify($c,$sig)){if(function_exists('securityIpStrike'))securityIpStrike('mldsa_access_fail',10,600,900);http_response_code(401);echo json_encode(['ok'=>false,'code'=>'invalid_signature','error'=>'Firma ML-DSA-87 inválida para este reto.']);exit;}
mldsaGrant(); echo json_encode(['ok'=>true,'authorized'=>true,'redirect'=>'/']);
