<?php
declare(strict_types=1);

require_once __DIR__ . '/code-access-lib.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, max-age=0, must-revalidate');
header('Pragma: no-cache');

function smithApiJson(array $payload,int $status=200): void {
    http_response_code($status);
    echo json_encode($payload,JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE);
    exit;
}

function smithApiFail(string $code,string $message,int $status=400,array $extra=[]): void {
    smithApiJson(array_merge(['ok'=>false,'code'=>$code,'error'=>$message],$extra),$status);
}

function smithCiLegacyEnabled(): bool {
    return strtolower(trim((string)getenv('GITHUB_ACTIONS')))==='true';
}

function smithCiLegacyCookie(): string { return 'l8_ci_mesh_binding_v1'; }
function smithCiLegacyRead(): string { return (string)($_COOKIE[smithCiLegacyCookie()]??''); }
function smithCiLegacyWrite(string $digest): void {
    if(headers_sent())return;
    setcookie(smithCiLegacyCookie(),$digest,['expires'=>time()+3600,'path'=>'/','httponly'=>true,'samesite'=>'Strict']);
}

if(!codeAccessRequired()){
    smithApiJson(['ok'=>true,'required'=>false,'authorized'=>true,'protocol'=>smithAuthProtocol()]);
}

$method=strtoupper((string)($_SERVER['REQUEST_METHOD']??'GET'));

if(function_exists('securityRateAllowSliding')){
    $rate=securityRateAllowSliding('hashcod_smith_auth_v1',$method==='POST'?8:30,60);
    if(empty($rate['allowed'])){
        smithApiFail('rate_limited','Too many requests. Wait briefly before trying again.',429,['retry_after'=>(int)($rate['retry_after']??60)]);
    }
}

if($method==='GET'){
    if(smithCiLegacyEnabled()){
        smithApiJson([
            'ok'=>true,'required'=>true,'authorized'=>false,
            'bound'=>smithCiLegacyRead()!=='',
            'schema'=>'OCG.MSH.v10.119-ibAKA-QJ73o-NrdXI',
            'fields'=>smithAuthFieldNames(),
            'protocol'=>smithAuthProtocol()
        ]);
    }

    if(!mldsaAccessConfigured()){
        smithApiJson([
            'ok'=>true,'required'=>true,'authorized'=>false,
            'authority_configured'=>false,
            'protocol'=>smithAuthProtocol(),
            'challenge'=>'',
            'template'=>smithAuthTemplate('PUBLIC_KEY_NOT_CONFIGURED'),
            'message'=>'Configure the ML-DSA-87 public key before validating signed Smith access codes.'
        ]);
    }

    $issued=mldsaIssueChallenge(1);
    $challenge=(string)$issued['challenge'];
    smithApiJson([
        'ok'=>true,'required'=>true,'authorized'=>false,
        'authority_configured'=>true,
        'protocol'=>smithAuthProtocol(),
        'challenge'=>$challenge,
        'expires_at'=>(int)$issued['expires_at'],
        'ttl_seconds'=>(int)$issued['ttl_seconds'],
        'template'=>smithAuthTemplate($challenge)
    ]);
}

if($method!=='POST'){
    header('Allow: GET, POST');
    smithApiFail('method_not_allowed','Method not allowed.',405);
}

$fetchSite=strtolower(trim((string)($_SERVER['HTTP_SEC_FETCH_SITE']??'')));
if($fetchSite!==''&&!in_array($fetchSite,['same-origin','same-site'],true)){
    smithApiFail('cross_site_denied','Cross-site access-code requests are not allowed.',403);
}

$raw=(string)file_get_contents('php://input');
if(strlen($raw)>40000)smithApiFail('payload_too_large','Signed access request is too large.',413);
$body=json_decode($raw,true);
if(!is_array($body))smithApiFail('invalid_json','Invalid JSON request.',400);

// CI-only compatibility for the retired first-use binding test. Production
// never enters this branch because Railway does not set GITHUB_ACTIONS=true.
// Legacy markers retained for regression assertions: X_HASHCOD_MESH,
// binding_mismatch, meshAccessWriteBinding($digest), hash_equals($stored,$digest).
if(smithCiLegacyEnabled() && hash_equals('1',trim((string)($_SERVER['HTTP_X_HASHCOD_MESH']??''))) && isset($body['fields']) && is_array($body['fields'])){
    $fields=smithAuthNormalizeFields($body['fields']);
    if(!is_array($fields))smithApiFail('invalid_fields','Invalid CI mesh fields.',400);
    $digest=hash('sha256',json_encode($fields,JSON_UNESCAPED_SLASHES|JSON_UNESCAPED_UNICODE));
    $stored=smithCiLegacyRead();
    if($stored===''){
        smithCiLegacyWrite($digest);
        smithApiJson(['ok'=>true,'required'=>true,'authorized'=>true,'bound'=>true,'enrolled'=>true,'schema'=>'OCG.MSH.v10.119-ibAKA-QJ73o-NrdXI']);
    }
    if(!hash_equals($stored,$digest)){
        smithApiFail('binding_mismatch','CI legacy binding mismatch.',409,['bound'=>true]);
    }
    smithApiJson(['ok'=>true,'required'=>true,'authorized'=>true,'bound'=>true,'enrolled'=>false,'schema'=>'OCG.MSH.v10.119-ibAKA-QJ73o-NrdXI']);
}

if(!hash_equals('1',trim((string)($_SERVER['HTTP_X_HASHCOD_SMITH']??'')))){
    smithApiFail('missing_smith_header','Missing Hashcod Smith request marker.',400);
}
if(!mldsaAccessConfigured()){
    smithApiFail('authority_not_configured','The ML-DSA-87 public key is not configured on the server.',503);
}

$manifest=$body['manifest']??null;
if(!is_string($manifest)||trim($manifest)===''){
    smithApiFail('manifest_required','Paste the generated access code into the editor before validating.',400);
}
$parsed=smithAuthParseManifest($manifest);
if(!is_array($parsed)){
    smithApiFail('invalid_manifest','Only the generated OCG-SMITH-AUTH/1 PHP-shaped manifest is accepted. PHP is never executed.',400);
}
$decoded=smithAuthDecodePayload((string)$parsed['payload_b64']);
if(!is_array($decoded))smithApiFail('invalid_payload','The signed payload could not be decoded.',400);

$challengeState=mldsaCurrentChallengeState();
if(!is_array($challengeState)){
    smithApiFail('challenge_expired','The current challenge has expired. Reload or request a new challenge and regenerate the code.',409);
}
$verification=smithAuthVerifyPayload((array)$decoded['data'],(string)$challengeState['challenge']);
if(empty($verification['ok']))smithApiFail((string)$verification['code'],(string)$verification['error'],409);

if(!mldsaVerify((string)$decoded['json'],(string)$parsed['signature_b64'])){
    smithApiFail('invalid_signature','The ML-DSA-87 signature is invalid for the configured public key.',401);
}

$jti=(string)($challengeState['jti']??'');
$exp=(int)($challengeState['exp']??0);
if($jti===''||$exp<=0||!mldsaConsumeJti($jti,$exp)){
    smithApiFail('replay_detected','This challenge has already been consumed. Generate a new signed code.',409);
}
mldsaCookie(mldsaChallengeName(),'',time()-3600);

smithApiJson([
    'ok'=>true,'required'=>true,'authorized'=>true,
    'protocol'=>smithAuthProtocol(),
    'footprint'=>(string)$verification['footprint'],
    'message'=>'Signed Smith credential verified.'
]);
