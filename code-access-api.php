<?php
declare(strict_types=1);

require_once __DIR__ . '/code-access-lib.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, max-age=0, must-revalidate');
header('Pragma: no-cache');

function codeAccessJson(array $payload,int $status=200): void {
    http_response_code($status);
    echo json_encode($payload,JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE);
    exit;
}
function codeAccessFail(string $code,string $message,int $status=400,array $extra=[]): void {
    codeAccessJson(array_merge(['ok'=>false,'code'=>$code,'error'=>$message],$extra),$status);
}

if(!codeAccessRequired()){
    codeAccessJson(['ok'=>true,'required'=>false,'authorized'=>true,'protocol'=>codeAccessProtocol()]);
}
if(!mldsaAccessConfigured()){
    codeAccessFail('code_access_not_configured','ML-DSA-87 public key is unavailable or invalid.',503);
}
$method=strtoupper((string)($_SERVER['REQUEST_METHOD']??'GET'));
if(function_exists('securityRateAllowSliding')){
    $rate=securityRateAllowSliding('hashcod_code_access_v1',$method==='POST'?8:30,60);
    if(empty($rate['allowed'])){
        codeAccessFail('rate_limited','Too many requests. Wait before trying again.',429,[
            'retry_after'=>(int)($rate['retry_after']??60)
        ]);
    }
}

if($method==='GET'){
    if(codeAccessAuthorized()){
        codeAccessJson(['ok'=>true,'required'=>true,'authorized'=>true,'protocol'=>codeAccessProtocol()]);
    }
    $challenge=mldsaIssueChallenge(1);
    codeAccessJson([
        'ok'=>true,
        'required'=>true,
        'authorized'=>false,
        'protocol'=>codeAccessProtocol(),
        'algorithm'=>'ML-DSA-87',
        'standard'=>'NIST FIPS 204',
        'challenge'=>$challenge['challenge'],
        'expires_at'=>$challenge['expires_at'],
        'ttl_seconds'=>$challenge['ttl_seconds'],
        'public_key_fingerprint'=>mldsaPkHash(),
        'template'=>codeAccessTemplate($challenge['challenge'])
    ]);
}

if($method!=='POST'){
    header('Allow: GET, POST');
    codeAccessFail('method_not_allowed','Method not allowed.',405);
}
if(!mldsaOriginAllowed()){
    if(function_exists('securityIpStrike'))securityIpStrike('code_access_origin_fail',3,600,900);
    codeAccessFail('origin_mismatch','The request does not match the Hashcod origin.',403);
}

$raw=(string)file_get_contents('php://input');
if(strlen($raw)>15000)codeAccessFail('payload_too_large','Access manifest is too large.',413);
$body=json_decode($raw,true);
if(!is_array($body))codeAccessFail('invalid_json','Invalid JSON request.',400);

$source=(string)($body['source']??'');
$manifest=codeAccessParseManifest($source);
if(!is_array($manifest)){
    codeAccessFail('invalid_manifest','Only the signed HASHCOD-ACCESS/1 PHP manifest is accepted. PHP is never executed.',400);
}

$state=mldsaCurrentChallengeState();
if(!is_array($state)){
    codeAccessFail('challenge_expired','The access challenge expired. Refresh the manifest.',409);
}
$expectedChallenge=(string)$state['challenge'];
if(!hash_equals($expectedChallenge,(string)$manifest['challenge'])){
    codeAccessFail('challenge_mismatch','The manifest does not contain the active challenge. Click Refresh, sign the new challenge, and paste the new manifest.',409);
}

$signature=(string)$manifest['signature'];
if(!mldsaVerify($expectedChallenge,$signature)){
    codeAccessFail('invalid_signature','The ML-DSA-87 signature is invalid for the configured public key. Confirm that hashcod-public.key matches the public key configured in Hashcod Codespace.',401);
}
if(!mldsaConsumeJti((string)$state['jti'],(int)$state['exp'])){
    codeAccessFail('replay_detected','This access manifest challenge has already been consumed. Click Refresh and sign the new challenge.',409);
}

$proof=mldsaSignatureProof($signature);
codeAccessGrant($proof);
codeAccessJson([
    'ok'=>true,
    'required'=>true,
    'authorized'=>true,
    'protocol'=>codeAccessProtocol(),
    'algorithm'=>'ML-DSA-87',
    'redirect'=>'/'
]);
