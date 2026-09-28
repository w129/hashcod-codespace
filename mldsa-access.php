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
    $v=strtr(trim($v),'-_','+/');
    $p=strlen($v)%4;
    if($p)$v.=str_repeat('=',4-$p);
    $d=base64_decode($v,true);
    return is_string($d)?$d:'';
}

function mldsaAccessSecret(): string {
    static $s=null;
    if(is_string($s)&&$s!=='')return $s;
    foreach(['L8_ACCESS_GATE_COOKIE_SECRET','L8_AUTH_PEPPER','L8_VAULT_MASTER_KEY'] as $n){
        $v=trim((string)secretGet($n,''));
        if(strlen($v)>=32){
            $s=hash('sha256','hc|mldsa87|v2|'.$v,true);
            return $s;
        }
    }
    $v=function_exists('secretEnsure')
        ?(string)secretEnsure('L8_ACCESS_GATE_COOKIE_SECRET',fn()=>bin2hex(random_bytes(32)))
        :'';
    $s=hash('sha256','hc|mldsa87|v2|'.($v!==''?$v:__FILE__),true);
    return $s;
}

function mldsaUa(): string {
    return substr(hash('sha256',(string)($_SERVER['HTTP_USER_AGENT']??'')),0,32);
}
function mldsaHost(): string {
    return strtolower(trim((string)($_SERVER['HTTP_HOST']??'')));
}
function mldsaScheme(): string {
    return mldsaHttps()?'https':'http';
}
function mldsaPkHash(): string {
    return hash('sha256',mldsaAccessPublicKeyBytes());
}
function mldsaSeal(array $d): string {
    $b=mldsaB64u((string)json_encode($d,JSON_UNESCAPED_SLASHES));
    return $b.'.'.mldsaB64u(hash_hmac('sha256',$b,mldsaAccessSecret(),true));
}
function mldsaOpen(string $t): ?array {
    $p=explode('.',trim($t),2);
    if(count($p)!==2)return null;
    $mac=mldsaB64ud($p[1]);
    $exp=hash_hmac('sha256',$p[0],mldsaAccessSecret(),true);
    if(strlen($mac)!==32||!hash_equals($exp,$mac))return null;
    $d=json_decode(mldsaB64ud($p[0]),true);
    return is_array($d)?$d:null;
}
function mldsaHttps(): bool {
    return function_exists('securityIsHttps')
        ?securityIsHttps()
        :((!empty($_SERVER['HTTPS'])&&$_SERVER['HTTPS']!=='off')
          ||strtolower((string)($_SERVER['HTTP_X_FORWARDED_PROTO']??''))==='https');
}
function mldsaCookie(string $n,string $v,int $e): void {
    if(headers_sent())return;
    setcookie($n,$v,[
        'expires'=>$e,
        'path'=>'/',
        'secure'=>mldsaHttps(),
        'httponly'=>true,
        'samesite'=>'Strict'
    ]);
}
function mldsaChallengeName(): string { return 'l8_mldsa87_challenge_v2'; }
function mldsaAccessName(): string { return 'l8_mldsa87_access_v2'; }

function mldsaChallengeTtl(int $phase): int {
    $name=$phase===2?'L8_ACCESS_MLDSA87_PHASE2_TTL':'L8_ACCESS_MLDSA87_PHASE1_TTL';
    $fallback=$phase===2?60:90;
    $value=(int)secretGet($name,(string)$fallback);
    $min=$phase===2?30:45;
    $max=$phase===2?120:180;
    return max($min,min($max,$value));
}
function mldsaIssueChallenge(int $phase=1,string $binding='',string $parentJti=''): array {
    $phase=$phase===2?2:1;
    $now=time();
    $ttl=mldsaChallengeTtl($phase);
    $jti=bin2hex(random_bytes(16));
    $payload=[
        'v'=>2,
        'phase'=>$phase,
        'purpose'=>$phase===1?'hashcod-access-init':'hashcod-access-confirm',
        'jti'=>$jti,
        'nonce'=>mldsaB64u(random_bytes(32)),
        'iat'=>$now,
        'exp'=>$now+$ttl,
        'ua'=>mldsaUa(),
        'host'=>mldsaHost(),
        'scheme'=>mldsaScheme(),
        'pkh'=>mldsaPkHash()
    ];
    if($phase===2){
        $payload['parent_jti']=$parentJti;
        $payload['phase1_proof']=$binding;
    }
    $prefix=$phase===1?'HC-MLDSA87-V2.P1.':'HC-MLDSA87-V2.P2.';
    $challenge=$prefix.mldsaB64u((string)json_encode($payload,JSON_UNESCAPED_SLASHES));
    mldsaCookie(mldsaChallengeName(),mldsaSeal([
        'kind'=>'challenge-v2',
        'phase'=>$phase,
        'jti'=>$jti,
        'challenge'=>$challenge,
        'binding'=>$binding,
        'parent_jti'=>$parentJti,
        'iat'=>$now,
        'exp'=>$now+$ttl,
        'ua'=>mldsaUa(),
        'host'=>mldsaHost(),
        'scheme'=>mldsaScheme(),
        'pkh'=>mldsaPkHash()
    ]),$now+$ttl);
    return [
        'phase'=>$phase,
        'challenge'=>$challenge,
        'jti'=>$jti,
        'expires_at'=>$now+$ttl,
        'ttl_seconds'=>$ttl
    ];
}

function mldsaCurrentChallengeState(): ?array {
    $d=mldsaOpen((string)($_COOKIE[mldsaChallengeName()]??''));
    if(!is_array($d))return null;
    if(($d['kind']??'')!=='challenge-v2')return null;
    if(!in_array((int)($d['phase']??0),[1,2],true))return null;
    if((int)($d['exp']??0)<time())return null;
    if(!hash_equals((string)($d['ua']??''),mldsaUa()))return null;
    if(!hash_equals((string)($d['host']??''),mldsaHost()))return null;
    if(!hash_equals((string)($d['scheme']??''),mldsaScheme()))return null;
    if(!hash_equals((string)($d['pkh']??''),mldsaPkHash()))return null;
    $challenge=(string)($d['challenge']??'');
    $jti=(string)($d['jti']??'');
    if($challenge===''||strlen($challenge)>2048||!preg_match('/^[a-f0-9]{32}$/',$jti))return null;
    return $d;
}
function mldsaCurrentChallenge(): ?string {
    $d=mldsaCurrentChallengeState();
    return is_array($d)?(string)$d['challenge']:null;
}

function mldsaReplayDir(): string {
    $dir=__DIR__.'/data_storage/security/mldsa-replay';
    if(!is_dir($dir))@mkdir($dir,0700,true);
    @chmod($dir,0700);
    return $dir;
}
function mldsaReplayCleanup(): void {
    if(random_int(1,20)!==1)return;
    $now=time();
    foreach(glob(mldsaReplayDir().'/*.used')?:[] as $p){
        $exp=(int)@file_get_contents($p);
        if($exp>0&&$exp<$now-60)@unlink($p);
    }
}
function mldsaConsumeJti(string $jti,int $exp): bool {
    if(!preg_match('/^[a-f0-9]{32}$/',$jti))return false;
    mldsaReplayCleanup();
    $path=mldsaReplayDir().'/'.$jti.'.used';
    $fh=@fopen($path,'x');
    if(!is_resource($fh))return false;
    fwrite($fh,(string)$exp);
    fclose($fh);
    @chmod($path,0600);
    return true;
}

function mldsaOriginAllowed(): bool {
    $origin=trim((string)($_SERVER['HTTP_ORIGIN']??''));
    if($origin===''){
        $site=strtolower(trim((string)($_SERVER['HTTP_SEC_FETCH_SITE']??'')));
        return in_array($site,['same-origin','same-site'],true);
    }
    $parts=@parse_url($origin);
    if(!is_array($parts))return false;
    $scheme=strtolower((string)($parts['scheme']??''));
    $host=strtolower((string)($parts['host']??''));
    $port=isset($parts['port'])?':'.(int)$parts['port']:'';
    $expectedHost=mldsaHost();
    $expectedScheme=mldsaScheme();
    $expected=$expectedScheme.'://'.$expectedHost;
    $actual=$scheme.'://'.$host.$port;
    return hash_equals($expected,$actual);
}

function mldsaAccessAuthorized(): bool {
    if(!mldsaAccessRequired())return true;
    $d=mldsaOpen((string)($_COOKIE[mldsaAccessName()]??''));
    if(!is_array($d))return false;
    if(($d['kind']??'')!=='access-v2')return false;
    if((int)($d['exp']??0)<time())return false;
    if(!hash_equals((string)($d['ua']??''),mldsaUa()))return false;
    if(!hash_equals((string)($d['host']??''),mldsaHost()))return false;
    if(!hash_equals((string)($d['pkh']??''),mldsaPkHash()))return false;
    return true;
}
function mldsaGrant(string $proof=''): void {
    $now=time();
    $ttl=max(300,min(7200,(int)secretGet('L8_ACCESS_MLDSA87_TTL','1800')));
    mldsaCookie(mldsaAccessName(),mldsaSeal([
        'kind'=>'access-v2',
        'v'=>2,
        'sid'=>bin2hex(random_bytes(16)),
        'iat'=>$now,
        'exp'=>$now+$ttl,
        'ua'=>mldsaUa(),
        'host'=>mldsaHost(),
        'pkh'=>mldsaPkHash(),
        'proof'=>$proof
    ]),$now+$ttl);
    mldsaCookie(mldsaChallengeName(),'',time()-3600);
}
function mldsaVerify(string $challenge,string $sigB64): bool {
    $sig=base64_decode(trim($sigB64),true);
    if(!is_string($sig)||strlen($sig)!==4627)return false;
    $python=is_executable('/opt/l8-py/bin/python')?'/opt/l8-py/bin/python':'python3';
    $cmd=[$python,__DIR__.'/scripts/mldsa87_access.py','verify-json'];
    $proc=@proc_open($cmd,[0=>['pipe','r'],1=>['pipe','w'],2=>['pipe','w']],$pipes,__DIR__);
    if(!is_resource($proc))return false;
    fwrite($pipes[0],(string)json_encode([
        'public_key_b64'=>mldsaAccessPublicKeyB64(),
        'challenge'=>$challenge,
        'signature_b64'=>$sigB64
    ],JSON_UNESCAPED_SLASHES));
    fclose($pipes[0]);
    $out=(string)stream_get_contents($pipes[1]);
    stream_get_contents($pipes[2]);
    fclose($pipes[1]);
    fclose($pipes[2]);
    @proc_close($proc);
    $d=json_decode(trim($out),true);
    return is_array($d)&&!empty($d['ok']);
}
function mldsaSignatureProof(string $sigB64): string {
    $sig=base64_decode(trim($sigB64),true);
    return is_string($sig)?hash('sha256',$sig):'';
}

function mldsaShouldGateHtml(string $file): bool {
    return mldsaAccessRequired()&&!mldsaAccessAuthorized()&&!in_array(basename($file),['privacy.php'],true);
}
function mldsaGateHtml(string $base='/'): string {
    $base='/' . trim($base,'/') . '/';
    if($base==='//')$base='/';
    $css=htmlspecialchars($base.'components/mldsa-access-gate.css?v=20260928-tilt1',ENT_QUOTES,'UTF-8');
    $js=htmlspecialchars($base.'components/mldsa-access-gate.js?v=20260928-tilt1',ENT_QUOTES,'UTF-8');
    return '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Hashcod · ML-DSA-87</title><link rel="stylesheet" href="'.$css.'"></head><body>'
      .'<main class="access-stage"><div class="access-layout"><div class="access-left-stack"><section class="access-card">'
      .'<div class="security-progress"><span id="d5StepOne" class="step active">1</span><i></i><span id="d5StepTwo" class="step">2</span></div>'
      .'<h1>Acceso criptográfico reforzado</h1><p class="description" id="d5Description">Paso 1 de 2 · Prueba inicial de posesión ML-DSA-87.</p>'
      .'<div class="field-block"><div class="label-row"><label for="d5Challenge">Reto ML-DSA-87</label><button id="d5NewChallenge" class="text-action" type="button">NUEVO RETO</button></div><div class="pill-field"><span id="d5Challenge">Generando reto…</span><span class="caret"></span></div></div>'
      .'<div class="field-block second"><label for="d5Signature">Firma Base64</label><textarea id="d5Signature" class="signature-field" autocomplete="off" spellcheck="false" placeholder="Pega aquí la firma del reto actual"></textarea></div>'
      .'<button id="d5Verify" class="primary-action" type="button"><span class="lock-icon" aria-hidden="true">⌑</span><span id="d5VerifyText">VALIDAR PASO 1</span></button>'
      .'<button class="info-card" type="button"><span class="info-icon">!</span><span class="info-copy"><strong>Doble prueba + anti-replay</strong><small>Cada reto se consume una sola vez y caduca rápidamente</small></span><span class="chev">›</span></button>'
      .'<p id="d5Status" class="status" role="status" aria-live="polite"></p>'
      .'<p class="fingerprint">ML-DSA-87 · NIST FIPS 204 · fingerprint <span id="d5Fingerprint">—</span></p>'
      .'</section>'
      .'<section id="d5FaqCard" class="faq-tabs-card" aria-label="Frequently asked questions">'
      .'<div class="faq-tabs" role="tablist" aria-label="FAQ categories">'
      .'<button class="faq-tab active" type="button" role="tab" aria-selected="true" data-faq-tab="0"><span class="faq-tab-pill"></span><span class="faq-tab-label">General</span></button>'
      .'<button class="faq-tab" type="button" role="tab" aria-selected="false" data-faq-tab="1"><span class="faq-tab-label">Building</span></button>'
      .'<button class="faq-tab" type="button" role="tab" aria-selected="false" data-faq-tab="2"><span class="faq-tab-label">Goals</span></button>'
      .'</div>'
      .'<div id="d5FaqAccordion" class="faq-accordion"></div>'
      .'<button id="d5FaqFooter" class="faq-footer" type="button">Comenzar mi Solicitud</button>'
      .'</section>'
      .'<section id="d5NavListDemo" class="nav-list-demo" aria-label="Navigation cards">'
      .'<div class="nav-list-left-column">'
      .'<div class="nav-list-grid">'
      .'<article class="nav-list-card"><p class="nav-list-title">Credentials and verification</p><ul class="nav-list-items">'
      .'<li><button type="button" class="nav-list-row" data-nav-list-item="Documents"><span class="nav-list-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" x2="8" y1="13" y2="13"></line><line x1="16" x2="8" y1="17" y2="17"></line><line x1="10" x2="8" y1="9" y2="9"></line></svg></span><span class="nav-list-label">Documents</span></button></li>'
      .'<li><button type="button" class="nav-list-row" data-nav-list-item="Budget"><span class="nav-list-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><rect width="20" height="14" x="2" y="5" rx="2"></rect><line x1="2" x2="22" y1="10" y2="10"></line></svg></span><span class="nav-list-label">Budget</span></button></li>'
      .'<li><button type="button" class="nav-list-row" data-nav-list-item="Reports"><span class="nav-list-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3v18h18"></path><path d="M18 17V9"></path><path d="M13 17V5"></path><path d="M8 17v-3"></path></svg></span><span class="nav-list-label">Reports</span></button></li>'
      .'</ul></article>'
      .'<article class="nav-list-card"><p class="nav-list-title">Support</p><ul class="nav-list-items">'
      .'<li><button type="button" class="nav-list-row" data-nav-list-item="Help Center"><span class="nav-list-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 1 1 5.83 1c0 2-3 2-3 4"></path><path d="M12 17h.01"></path></svg></span><span class="nav-list-label">Help Center</span></button></li>'
      .'<li><button type="button" class="nav-list-row" data-nav-list-item="Docs"><span class="nav-list-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 4.5A2.5 2.5 0 0 1 4.5 2H10a2 2 0 0 1 2 2v16a2 2 0 0 0-2-2H4.5A2.5 2.5 0 0 0 2 20.5z"></path><path d="M22 4.5A2.5 2.5 0 0 0 19.5 2H14a2 2 0 0 0-2 2v16a2 2 0 0 1 2-2h5.5a2.5 2.5 0 0 1 2.5 2.5z"></path></svg></span><span class="nav-list-label">Docs</span></button></li>'
      .'<li><button type="button" class="nav-list-row" data-nav-list-item="Contact Us"><span class="nav-list-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3v-7a4 4 0 0 1-1-2.65V7a4 4 0 0 1 4-4h11a4 4 0 0 1 4 4z"></path><path d="M8 9h.01"></path><path d="M12 9h.01"></path><path d="M16 9h.01"></path></svg></span><span class="nav-list-label">Contact Us</span></button></li>'
      .'</ul></article>'
      .'</div>'
      .'<section id="d5TiltCardDemo" class="tilt-card-demo" aria-label="Tilt card demo">'
      .'<div id="d5TiltPerspective" class="tilt-card-perspective">'
      .'<article id="d5TiltCard" class="tilt-card-surface">'
      .'<div class="tilt-card-preserve">'
      .'<div class="tilt-card-item tilt-title" data-tilt-depth="50">Aurora Headphones</div>'
      .'<div class="tilt-card-item tilt-description" data-tilt-depth="30">Studio sound with adaptive noise cancellation.</div>'
      .'<div class="tilt-card-item tilt-media" data-tilt-depth="80"><div class="tilt-media-frame"><img src="'.$base.'hashcod_icon_exact.svg" alt="Hashcod Codespace platform icon"></div></div>'
      .'<div class="tilt-card-footer">'
      .'<div class="tilt-card-item tilt-price" data-tilt-depth="40">$249</div>'
      .'<div class="tilt-card-item" data-tilt-depth="60"><button class="tilt-buy-button" type="button">Buy now →</button></div>'
      .'</div>'
      .'</div>'
      .'<div id="d5TiltGlare" class="tilt-card-glare" aria-hidden="true"></div>'
      .'</article>'
      .'</div>'
      .'<p class="tilt-card-hint">Move the pointer across the card — layers lift at different depths</p>'
      .'</section>'
      .'</div>'
      .'<section id="d5NumberTickerDemo" class="number-ticker-demo" aria-label="Number ticker demo">'
      .'<div class="number-ticker-card">'
      .'<p class="number-ticker-kicker">How much does a spot in the square cost?</p>'
      .'<div class="number-ticker-value"><span id="d5NumberTicker" class="number-ticker" aria-live="polite" aria-label="$48,250"></span></div>'
      .'<p class="number-ticker-caption">Each digit rolls to its new value.</p>'
      .'</div>'
      .'<div class="number-ticker-controls">'
      .'<button id="d5TickerDecrease" class="number-ticker-button" type="button" aria-label="Decrease"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"></path></svg></button>'
      .'<button id="d5TickerRandomize" class="number-ticker-button" type="button" aria-label="Randomize"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 3h5v5"></path><path d="M4 20 21 3"></path><path d="M21 16v5h-5"></path><path d="m15 15 6 6"></path><path d="m4 4 5 5"></path></svg></button>'
      .'<button id="d5TickerIncrease" class="number-ticker-button" type="button" aria-label="Increase"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14"></path><path d="M5 12h14"></path></svg></button>'
      .'</div>'
      .'</section>'
      .'<section id="d5ScratchCardDemo" class="scratch-card-demo" aria-label="Scratch card demo">'
      .'<div id="d5ScratchCard" class="scratch-card-shell">'
      .'<div id="d5ScratchContent" class="scratch-card-content" inert>'
      .'<span class="scratch-ticket-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M2 9a3 3 0 0 0 0 6v4a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-4a3 3 0 0 0 0-6V5a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"></path><path d="M13 5v2"></path><path d="M13 17v2"></path><path d="M13 11v2"></path></svg></span>'
      .'<span class="scratch-card-label">Coupon unlocked</span>'
      .'<span class="scratch-card-prize">20% off</span>'
      .'<button id="d5ScratchCopy" class="scratch-copy-button" type="button"><span class="scratch-copy-code">SPECTRUM20</span><span id="d5ScratchCopyIcon" class="scratch-copy-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><rect width="14" height="14" x="8" y="8" rx="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg></span><span id="d5ScratchCopySr" class="sr-only">Copy coupon code</span></button>'
      .'</div>'
      .'<div id="d5ScratchFoil" class="scratch-foil">'
      .'<canvas id="d5ScratchCanvas" class="scratch-canvas" role="button" tabindex="0" aria-label="Scratch to reveal your coupon code. Press Enter to reveal."></canvas>'
      .'<canvas id="d5ScratchParticles" class="scratch-particles" aria-hidden="true"></canvas>'
      .'</div>'
      .'<span id="d5ScratchAnnouncement" class="sr-only" aria-live="polite"></span>'
      .'</div>'
      .'<p class="scratch-card-hint">Drag across the card to scratch off the foil</p>'
      .'<button id="d5ScratchReset" class="scratch-reset-button" type="button" hidden><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"></path><path d="M3 3v5h5"></path></svg><span>Scratch again</span></button>'
      .'</section>'
      .'</section></div>'
      .'<section id="d5ToolDeck" class="tool-deck" role="button" tabindex="0" aria-expanded="false" aria-label="Expandir o apilar tarjetas de herramientas">'
      .'<article class="tool-card card-0" data-card-index="0"><div class="tool-card-inner"><img class="tool-logo" src="'.$base.'components/mldsa-card-assets/spotlight-code.svg" alt="Spotlight Code logo"><div class="tool-copy"><h2>Spotlight Code</h2><p>Code focused on your custom enhancements, providing you with the necessary credentials to make fixes or changes.</p></div></div></article>'
      .'<article class="tool-card card-1" data-card-index="1"><div class="tool-card-inner"><img class="tool-logo" src="'.$base.'components/mldsa-card-assets/pit-barriers.svg" alt="Pit Barriers logo"><div class="tool-copy"><h2>Pit Barriers</h2><p>Barriers with intentional holes designed to lure your code into false traps.</p></div></div></article>'
      .'<article class="tool-card card-2" data-card-index="2"><div class="tool-card-inner"><img class="tool-logo" src="'.$base.'components/mldsa-card-assets/single-bed-base.svg" alt="Single bed base logo"><div class="tool-copy"><h2>Single bed base</h2><p>Rent out your unit through the CRM, and you can even sell or rent it to someone else.</p></div></div></article>'
      .'<article class="tool-card card-3" data-card-index="3"><div class="tool-card-inner"><img class="tool-logo" src="'.$base.'components/mldsa-card-assets/tokenized-certification.svg" alt="Tokenized certification logo"><div class="tool-copy"><h2>Tokenized certification</h2><p>Obtain your tokenized platform certification by integrating with our Codespace and contacting us.</p></div></div></article>'
      .'</section></div></main>'
      .'<section id="d5DocumentsModal" class="documents-modal" hidden aria-hidden="true" aria-label="Official documents viewer">'
      .'<div class="documents-backdrop" data-doc-action="close"></div>'
      .'<div class="documents-window" role="dialog" aria-modal="true" aria-labelledby="d5DocumentsTitle">'
      .'<header class="documents-header"><div class="documents-header-copy"><span class="documents-header-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><path d="M9 13h6M9 17h6"></path></svg></span><div><p class="documents-eyebrow">CREDENTIALS AND VERIFICATION</p><h2 id="d5DocumentsTitle">Official documents</h2><p class="documents-subtitle">Verified institutional records for Hashcod Codespace</p></div></div><button class="documents-close" type="button" data-doc-action="close" aria-label="Close">×</button></header>'
      .'<div class="documents-body">'
      .'<nav class="documents-nav" aria-label="Document list">'
      .'<button class="documents-nav-item active" type="button" data-doc-id="onapi"><span class="documents-nav-index">01</span><span><strong>HASHCOD</strong><small>ONAPI · Marca mixta</small></span></button>'
      .'<button class="documents-nav-item" type="button" data-doc-id="mercantil"><span class="documents-nav-index">02</span><span><strong>DIKTATCART</strong><small>Registro Mercantil</small></span></button>'
      .'<button class="documents-nav-item" type="button" data-doc-id="rnc"><span class="documents-nav-index">03</span><span><strong>RNC</strong><small>DGII · Certificación</small></span></button>'
      .'</nav>'
      .'<article class="documents-sheet" id="d5DocumentSheet"></article>'
      .'</div>'
      .'</div>'
      .'</section>'
      .'<script src="'.$js.'" defer></script></body></html>';
}
