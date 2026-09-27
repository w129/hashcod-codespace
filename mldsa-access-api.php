<?php
require_once __DIR__.'/mldsa-access.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, max-age=0, must-revalidate');
header('Pragma: no-cache');

function mldsaApiJson(array $payload,int $status=200): void {
    http_response_code($status);
    echo json_encode($payload,JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE);
    exit;
}
function mldsaApiFail(string $code,string $message,int $status=400,array $extra=[]): void {
    mldsaApiJson(array_merge(['ok'=>false,'code'=>$code,'error'=>$message],$extra),$status);
}

if(!mldsaAccessRequired()){
    mldsaApiJson(['ok'=>true,'required'=>false,'authorized'=>true]);
}
if(!mldsaAccessConfigured()){
    mldsaApiFail('mldsa_not_configured','ML-DSA-87 public key is unavailable or invalid.',503);
}
if(function_exists('securityIpIsBanned')&&securityIpIsBanned()){
    mldsaApiFail('ip_temporarily_blocked','Demasiados intentos fallidos. Inténtalo más tarde.',429);
}

$method=strtoupper((string)($_SERVER['REQUEST_METHOD']??'GET'));

if(function_exists('securityRateAllowSliding')){
    $limit=$method==='POST'?6:20;
    $rate=securityRateAllowSliding('mldsa_access_v2',$limit,60);
    if(empty($rate['allowed'])){
        mldsaApiFail('rate_limited','Demasiadas solicitudes. Espera antes de volver a intentarlo.',429,[
            'retry_after'=>(int)($rate['retry_after']??60)
        ]);
    }
}

if($method==='GET'){
    if(mldsaAccessAuthorized()){
        mldsaApiJson(['ok'=>true,'authorized'=>true,'protocol'=>'ML-DSA-87-2PHASE']);
    }
    $c=mldsaIssueChallenge(1);
    mldsaApiJson([
        'ok'=>true,
        'authorized'=>false,
        'protocol'=>'ML-DSA-87-2PHASE',
        'algorithm'=>'ML-DSA-87',
        'standard'=>'NIST FIPS 204',
        'phase'=>1,
        'total_phases'=>2,
        'challenge'=>$c['challenge'],
        'expires_at'=>$c['expires_at'],
        'ttl_seconds'=>$c['ttl_seconds'],
        'public_key_fingerprint'=>mldsaPkHash()
    ]);
}

if($method!=='POST'){
    header('Allow: GET, POST');
    mldsaApiFail('method_not_allowed','Método no permitido.',405);
}
if(!mldsaOriginAllowed()){
    if(function_exists('securityIpStrike'))securityIpStrike('mldsa_origin_fail',3,600,900);
    mldsaApiFail('origin_mismatch','La solicitud no coincide con el origen autorizado de Hashcod.',403);
}

$raw=(string)file_get_contents('php://input');
if(strlen($raw)>12000){
    mldsaApiFail('payload_too_large','Payload demasiado grande.',413);
}
$body=json_decode($raw,true);
if(!is_array($body)){
    mldsaApiFail('invalid_json','Solicitud JSON inválida.',400);
}

$signature=trim((string)($body['signature']??''));
$clientPhase=(int)($body['phase']??0);
$state=mldsaCurrentChallengeState();

if(!is_array($state)){
    mldsaApiFail('challenge_expired','El reto caducó o ya no coincide con esta sesión. Genera uno nuevo.',409);
}
$serverPhase=(int)$state['phase'];
if($clientPhase!==$serverPhase){
    if(function_exists('securityIpStrike'))securityIpStrike('mldsa_phase_fail',3,600,900);
    mldsaApiFail('phase_mismatch','La fase enviada no coincide con el reto activo.',409,[
        'expected_phase'=>$serverPhase
    ]);
}
if($signature===''){
    mldsaApiFail('signature_required','Debes proporcionar la firma Base64.',400);
}

$challenge=(string)$state['challenge'];
if(!mldsaVerify($challenge,$signature)){
    if(function_exists('securityIpStrike'))securityIpStrike('mldsa_access_fail',3,600,900);
    mldsaApiFail('invalid_signature','Firma ML-DSA-87 inválida para el reto actual.',401);
}

if(!mldsaConsumeJti((string)$state['jti'],(int)$state['exp'])){
    if(function_exists('securityIpStrike'))securityIpStrike('mldsa_replay_fail',2,600,1800);
    mldsaApiFail('replay_detected','Este reto ya fue consumido. Genera uno nuevo.',409);
}

$proof=mldsaSignatureProof($signature);
mldsaCookie(mldsaChallengeName(),'',time()-3600);

if($serverPhase===1){
    $next=mldsaIssueChallenge(2,$proof,(string)$state['jti']);
    mldsaApiJson([
        'ok'=>true,
        'authorized'=>false,
        'protocol'=>'ML-DSA-87-2PHASE',
        'phase'=>2,
        'total_phases'=>2,
        'next_phase'=>2,
        'challenge'=>$next['challenge'],
        'expires_at'=>$next['expires_at'],
        'ttl_seconds'=>$next['ttl_seconds'],
        'message'=>'Paso 1 validado. Firma el segundo reto para confirmar el acceso.'
    ]);
}

$binding=(string)($state['binding']??'');
$parent=(string)($state['parent_jti']??'');
if($binding===''||strlen($binding)!==64||!preg_match('/^[a-f0-9]{32}$/',$parent)){
    mldsaApiFail('phase2_binding_invalid','El segundo reto perdió su vínculo criptográfico con el primer paso.',409);
}

mldsaGrant(hash('sha256',$binding.'|'.$proof.'|'.$parent));
mldsaApiJson([
    'ok'=>true,
    'authorized'=>true,
    'protocol'=>'ML-DSA-87-2PHASE',
    'phase'=>2,
    'completed_phases'=>2,
    'redirect'=>'/'
]);
