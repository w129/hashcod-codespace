<?php
if (!function_exists('secretGet')) require_once __DIR__ . '/secrets.php';

function mldsaNormalizePublicKeyB64(string $raw): string {
    $b64=(string)preg_replace('/\s+/', '', trim($raw));
    if ($b64==='' || strlen($b64)!==3456 || preg_match('/[^A-Za-z0-9+\/]/',$b64)) return '';
    $decoded=base64_decode($b64,true);
    return is_string($decoded)&&strlen($decoded)===2592?$b64:'';
}
function mldsaAccessPublicKeyB64(): string {
    $env=mldsaNormalizePublicKeyB64((string)secretGet('L8_ACCESS_MLDSA87_PUBLIC_KEY_B64',''));
    if ($env!=='') return $env;
    $p=__DIR__.'/config/mldsa87-access-public.b64';
    return is_readable($p)?mldsaNormalizePublicKeyB64((string)file_get_contents($p)):'';
}
function mldsaAccessPublicKeyBytes(): string {
    $b64=mldsaAccessPublicKeyB64();
    if ($b64==='') return '';
    $raw=base64_decode($b64,true);
    return is_string($raw)&&strlen($raw)===2592?$raw:'';
}
function mldsaAccessConfigured(): bool { return mldsaAccessPublicKeyBytes()!==''; }
function mldsaAccessRequired(): bool {
    $v=strtolower(trim((string)secretGet('L8_ACCESS_MLDSA87_REQUIRED','1')));
    return !in_array($v,['0','false','no','off'],true);
}
function mldsaB64u(string $v): string { return rtrim(strtr(base64_encode($v),'+/','-_'),'='); }
function mldsaB64ud(string $v): string {
    $v=strtr(trim($v),'-_','+/'); $p=strlen($v)%4; if($p)$v.=str_repeat('=',4-$p);
    $d=base64_decode($v,true); return is_string($d)?$d:'';
}
function mldsaAccessSecret(): string {
    static $s=null; if(is_string($s)&&$s!=='')return $s;
    foreach(['L8_ACCESS_GATE_COOKIE_SECRET','L8_AUTH_PEPPER','L8_VAULT_MASTER_KEY'] as $n){
        $v=trim((string)secretGet($n,'')); if(strlen($v)>=32){$s=hash('sha256','hc|mldsa87|'.$v,true);return $s;}
    }
    $v=function_exists('secretEnsure')?(string)secretEnsure('L8_ACCESS_GATE_COOKIE_SECRET',fn()=>bin2hex(random_bytes(32))):'';
    $s=hash('sha256','hc|mldsa87|'.($v!==''?$v:__FILE__),true); return $s;
}
function mldsaUa(): string { return substr(hash('sha256',(string)($_SERVER['HTTP_USER_AGENT']??'')),0,24); }
function mldsaSeal(array $d): string {
    $b=mldsaB64u((string)json_encode($d,JSON_UNESCAPED_SLASHES));
    return $b.'.'.mldsaB64u(hash_hmac('sha256',$b,mldsaAccessSecret(),true));
}
function mldsaOpen(string $t): ?array {
    $p=explode('.',trim($t),2); if(count($p)!==2)return null;
    $mac=mldsaB64ud($p[1]); $exp=hash_hmac('sha256',$p[0],mldsaAccessSecret(),true);
    if(strlen($mac)!==32||!hash_equals($exp,$mac))return null;
    $d=json_decode(mldsaB64ud($p[0]),true); return is_array($d)?$d:null;
}
function mldsaHttps(): bool {
    return function_exists('securityIsHttps')?securityIsHttps():((!empty($_SERVER['HTTPS'])&&$_SERVER['HTTPS']!=='off')||strtolower((string)($_SERVER['HTTP_X_FORWARDED_PROTO']??''))==='https');
}
function mldsaCookie(string $n,string $v,int $e): void {
    if(headers_sent())return;
    setcookie($n,$v,['expires'=>$e,'path'=>'/','secure'=>mldsaHttps(),'httponly'=>true,'samesite'=>'Strict']);
}
function mldsaChallengeName(): string { return 'l8_mldsa87_challenge'; }
function mldsaAccessName(): string { return 'l8_mldsa87_access'; }
function mldsaIssueChallenge(): array {
    $now=time(); $ttl=180;
    $payload=['v'=>1,'nonce'=>mldsaB64u(random_bytes(32)),'iat'=>$now,'exp'=>$now+$ttl,'ua'=>mldsaUa(),'host'=>strtolower((string)($_SERVER['HTTP_HOST']??''))];
    $challenge='HC-MLDSA87-V1.'.mldsaB64u((string)json_encode($payload,JSON_UNESCAPED_SLASHES));
    mldsaCookie(mldsaChallengeName(),mldsaSeal(['kind'=>'challenge','challenge'=>$challenge,'exp'=>$now+$ttl,'ua'=>mldsaUa()]),$now+$ttl);
    return ['challenge'=>$challenge,'expires_at'=>$now+$ttl,'ttl_seconds'=>$ttl];
}
function mldsaCurrentChallenge(): ?string {
    $d=mldsaOpen((string)($_COOKIE[mldsaChallengeName()]??'')); if(!is_array($d))return null;
    if(($d['kind']??'')!=='challenge'||(int)($d['exp']??0)<time()||!hash_equals((string)($d['ua']??''),mldsaUa()))return null;
    $c=(string)($d['challenge']??''); return ($c!==''&&strlen($c)<1024)?$c:null;
}
function mldsaAccessAuthorized(): bool {
    if(!mldsaAccessRequired())return true;
    $d=mldsaOpen((string)($_COOKIE[mldsaAccessName()]??'')); if(!is_array($d))return false;
    if(($d['kind']??'')!=='access'||(int)($d['exp']??0)<time()||!hash_equals((string)($d['ua']??''),mldsaUa()))return false;
    return hash_equals((string)($d['pkh']??''),hash('sha256',mldsaAccessPublicKeyBytes()));
}
function mldsaGrant(): void {
    $now=time(); $ttl=max(300,min(86400,(int)secretGet('L8_ACCESS_MLDSA87_TTL','28800')));
    mldsaCookie(mldsaAccessName(),mldsaSeal(['kind'=>'access','iat'=>$now,'exp'=>$now+$ttl,'ua'=>mldsaUa(),'pkh'=>hash('sha256',mldsaAccessPublicKeyBytes())]),$now+$ttl);
    mldsaCookie(mldsaChallengeName(),'',time()-3600);
}
function mldsaVerify(string $challenge,string $sigB64): bool {
    $sig=base64_decode(trim($sigB64),true); if(!is_string($sig)||strlen($sig)!==4627)return false;
    $python=is_executable('/opt/l8-py/bin/python')?'/opt/l8-py/bin/python':'python3';
    $cmd=[$python,__DIR__.'/scripts/mldsa87_access.py','verify-json'];
    $proc=@proc_open($cmd,[0=>['pipe','r'],1=>['pipe','w'],2=>['pipe','w']],$pipes,__DIR__);
    if(!is_resource($proc))return false;
    fwrite($pipes[0],(string)json_encode(['public_key_b64'=>mldsaAccessPublicKeyB64(),'challenge'=>$challenge,'signature_b64'=>$sigB64],JSON_UNESCAPED_SLASHES)); fclose($pipes[0]);
    $out=(string)stream_get_contents($pipes[1]); $err=(string)stream_get_contents($pipes[2]); fclose($pipes[1]); fclose($pipes[2]); @proc_close($proc);
    $d=json_decode(trim($out),true); return is_array($d)&&!empty($d['ok']);
}
function mldsaShouldGateHtml(string $file): bool {
    return mldsaAccessRequired()&&!mldsaAccessAuthorized()&&!in_array(basename($file),['privacy.php'],true);
}
function mldsaGateHtml(string $base='/'): string {
    $base='/' . trim($base,'/') . '/'; if($base==='//')$base='/';
    $css=htmlspecialchars($base.'components/mldsa-access-gate.css?v=20260927-spectrum1',ENT_QUOTES,'UTF-8');
    $js=htmlspecialchars($base.'components/mldsa-access-gate.js?v=20260927-spectrum1',ENT_QUOTES,'UTF-8');
    return '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Hashcod · ML-DSA-87</title><link rel="stylesheet" href="'.$css.'"></head><body>'
      .'<main class="access-stage"><section class="access-card">'
      .'<h1>Acceso criptográfico</h1><p class="description">Firma el reto para autenticarte en Hashcod Codespace.</p>'
      .'<div class="field-block"><div class="label-row"><label for="d5Challenge">Reto ML-DSA-87</label><button id="d5NewChallenge" class="text-action" type="button">NUEVO RETO</button></div><div class="pill-field"><span id="d5Challenge">Generando reto…</span><span id="d5Caret1" class="caret"></span></div></div>'
      .'<div class="field-block second"><label for="d5Signature">Firma Base64</label><textarea id="d5Signature" class="signature-field" autocomplete="off" spellcheck="false" placeholder="Pega aquí la firma del reto"></textarea></div>'
      .'<button id="d5Verify" class="primary-action" type="button"><span class="lock-icon" aria-hidden="true">⌑</span><span>VERIFICAR Y ENTRAR</span></button>'
      .'<button id="d5Info" class="info-card" type="button"><span class="info-icon">!</span><span class="info-copy"><strong>Clave privada protegida</strong><small>La clave privada nunca se envía al servidor</small></span><span class="chev">›</span></button>'
      .'<p id="d5Status" class="status" role="status" aria-live="polite"></p>'
      .'<p class="fingerprint">ML-DSA-87 · NIST FIPS 204 · fingerprint <span id="d5Fingerprint">—</span></p>'
      .'</section></main><script src="'.$js.'" defer></script></body></html>';
}
