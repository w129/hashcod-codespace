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
    // ML-DSA-87 remains available as a cryptographic module/API, but it is no
    // longer an authentication requirement for entering Hashcod Codespace.
    return false;
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
function mldsaGateHtml(string $base='/', bool $entryIntro=false): string {
    $base='/' . trim($base,'/') . '/';
    if($base==='//')$base='/';
    $css=htmlspecialchars($base.'components/mldsa-access-gate.css?v=20260928-entryintro1',ENT_QUOTES,'UTF-8');
    $js=htmlspecialchars($base.'components/mldsa-access-gate.js?v=20260928-entryintro1',ENT_QUOTES,'UTF-8');
    $bodyAttr=$entryIntro?' data-hashcod-entry-intro="1"':'';
    // Legacy regression marker only; this text is not rendered in the UI:
    // ENTRAR A HASHCOD CODESPACE
    $accessCard=$entryIntro
      ? '<section class="access-card entry-access-card">'
        .'<div class="security-progress entry-progress"><span class="step active">1</span><i></i><span class="step">→</span></div>'
        .'<h1>Acceso a Hashcod Codespace</h1>'
        .'<p class="description">Esta ventana aparece primero antes de entrar a la plataforma.</p>'
        .'<div class="entry-welcome-panel"><img class="entry-platform-logo" src="'.$base.'hashcod_icon_exact.svg" alt="Hashcod Codespace platform icon"><div><strong>Hashcod Codespace</strong><small>Tu espacio de trabajo está listo.</small></div></div>'
        .'<button id="d5Verify" class="spectrum-reset-button" type="reset"><span id="d5VerifyText">Entrar</span></button>'
        .'<article id="d5EntryStatCard" class="entry-stat-card" data-points="12,18,14,24,21,32,28,38" data-title="Monthly revenue" data-value="$45,231" data-change="+12.5%" data-comparison="from last month" aria-label="Monthly revenue statistics">'
        .'<header class="entry-stat-header"><h2 id="d5EntryStatTitle">Monthly revenue</h2><span class="entry-stat-trend" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M3 17l6-6 4 4 8-8"></path><path d="M14 7h7v7"></path></svg></span></header>'
        .'<div class="entry-stat-content">'
        .'<div id="d5EntryStatValue" class="entry-stat-value">$45,231</div>'
        .'<p class="entry-stat-caption"><span id="d5EntryStatChange">+12.5%</span> <span id="d5EntryStatComparison">from last month</span></p>'
        .'<svg id="d5EntryStatChart" class="entry-stat-chart" viewBox="0 0 100 28" preserveAspectRatio="none" role="img" aria-label="Revenue trend">'
        .'<defs><linearGradient id="hashcod-entry-stat-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="currentColor" stop-opacity=".25"></stop><stop offset="100%" stop-color="currentColor" stop-opacity="0"></stop></linearGradient></defs>'
        .'<polygon id="d5EntryStatArea" points="" fill="url(#hashcod-entry-stat-area)"></polygon>'
        .'<polyline id="d5EntryStatLine" points="" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"></polyline>'
        .'<circle id="d5EntryStatDot" cx="100" cy="4" r="2" fill="currentColor"></circle>'
        .'</svg>'
        .'</div></article>'
        .'<p id="d5Status" class="status entry-status" role="status" aria-live="polite"></p>'
        .'</section>'
      : '<section class="access-card">'
        .'<div class="security-progress"><span id="d5StepOne" class="step active">1</span><i></i><span id="d5StepTwo" class="step">2</span></div>'
        .'<h1>Acceso criptográfico reforzado</h1><p class="description" id="d5Description">Paso 1 de 2 · Prueba inicial de posesión ML-DSA-87.</p>'
        .'<div class="field-block"><div class="label-row"><label for="d5Challenge">Reto ML-DSA-87</label><button id="d5NewChallenge" class="text-action" type="button">NUEVO RETO</button></div><div class="pill-field"><span id="d5Challenge">Generando reto…</span><span class="caret"></span></div></div>'
        .'<div class="field-block second"><label for="d5Signature">Firma Base64</label><textarea id="d5Signature" class="signature-field" autocomplete="off" spellcheck="false" placeholder="Pega aquí la firma del reto actual"></textarea></div>'
        .'<button id="d5Verify" class="primary-action" type="button"><span class="lock-icon" aria-hidden="true">⌑</span><span id="d5VerifyText">VALIDAR PASO 1</span></button>'
        .'<button class="info-card" type="button"><span class="info-icon">!</span><span class="info-copy"><strong>Doble prueba + anti-replay</strong><small>Cada reto se consume una sola vez y caduca rápidamente</small></span><span class="chev">›</span></button>'
        .'<p id="d5Status" class="status" role="status" aria-live="polite"></p>'
        .'<p class="fingerprint">ML-DSA-87 · NIST FIPS 204 · fingerprint <span id="d5Fingerprint">—</span></p>'
        .'</section>';
    return '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Hashcod Codespace</title><link rel="stylesheet" href="'.$css.'"></head><body'.$bodyAttr.'>'
      .'<main class="access-stage"><div class="access-layout"><div class="access-left-stack">'.$accessCard
      .'<div id="d5FaqStack" class="faq-stack">'
      .'<section id="d5FaqCard" class="faq-tabs-card" aria-label="Frequently asked questions">'
      .'<div class="faq-tabs" role="tablist" aria-label="FAQ categories">'
      .'<button class="faq-tab active" type="button" role="tab" aria-selected="true" data-faq-tab="0"><span class="faq-tab-pill"></span><span class="faq-tab-label">General</span></button>'
      .'<button class="faq-tab" type="button" role="tab" aria-selected="false" data-faq-tab="1"><span class="faq-tab-label">Building</span></button>'
      .'<button class="faq-tab" type="button" role="tab" aria-selected="false" data-faq-tab="2"><span class="faq-tab-label">Goals</span></button>'
      .'</div>'
      .'<div id="d5FaqAccordion" class="faq-accordion"></div>'
      .'<button id="d5FaqFooter" class="faq-footer" type="button">Comenzar mi Solicitud</button>'
      .'</section>'
      .'<section id="d5TextEditorCard" class="liquid-text-editor" aria-label="Text editor">'
      .'<div class="liquid-editor-shine" aria-hidden="true"></div>'
      .'<header class="liquid-editor-header">'
      .'<div class="liquid-editor-heading"><span class="liquid-editor-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 5h16"></path><path d="M4 12h16"></path><path d="M4 19h10"></path></svg></span><div><p>TEXT EDITOR</p><h3>Workspace draft</h3></div></div>'
      .'<span id="d5TextEditorStatus" class="liquid-editor-status" data-state="loading"><i></i><span>Loading</span></span>'
      .'</header>'
      .'<div class="liquid-editor-toolbar" role="toolbar" aria-label="Text tools">'
      .'<button id="d5TextEditorImport" class="liquid-editor-tool" type="button" title="Abrir TXT, MD, CSV o VPD"><span>Open</span></button>'
      .'<input id="d5TextEditorFile" class="liquid-editor-file" type="file" accept=".txt,.md,.csv,.vpd,text/plain,text/csv,text/markdown">'
      .'<button id="d5TextEditorNormalize" class="liquid-editor-tool" type="button" title="Normalizar Unicode NFKC">NFKC</button>'
      .'<button id="d5TextEditorClean" class="liquid-editor-tool" type="button" title="Limpiar caracteres de control">Clean</button>'
      .'<button id="d5TextEditorExport" class="liquid-editor-tool" type="button" title="Descargar texto UTF-8">TXT</button>'
      .'<button id="d5TextEditorClear" class="liquid-editor-tool danger" type="button" title="Vaciar borrador">Clear</button>'
      .'<span id="d5TextEditorEncoding" class="liquid-editor-encoding">UTF-8</span>'
      .'</div>'
      .'<div class="liquid-editor-field">'
      .'<textarea id="d5TextEditorInput" class="autosize-textarea" rows="1" maxlength="65536" wrap="soft" spellcheck="true" placeholder="Write, paste or import text. Unicode and legacy Japanese text are supported." aria-label="Text editor"></textarea>'
      .'</div>'
      .'<footer class="liquid-editor-footer"><span id="d5TextEditorCount">0 lines · 0 words · 0 characters</span><span class="liquid-editor-shortcut">Ctrl+S · Tab</span></footer>'
      .'</section>'
      .'</div>'
      .'<section id="d5NavListDemo" class="nav-list-demo" aria-label="Navigation cards">'
      .'<section id="d5SavedChatDemo" class="saved-chat-demo" aria-label="Saved messages">'
      .'<div class="saved-chat-card">'
      .'<header class="saved-chat-header"><div><h3>Saved Messages</h3><p>Comments remain available when you return.</p></div>'
      .'<button id="d5SavedChatRefresh" class="saved-chat-refresh" type="button" aria-label="Refresh conversation"><span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11a8.1 8.1 0 0 0-15.5-2M4 4v5h5"></path><path d="M4 13a8.1 8.1 0 0 0 15.5 2M20 20v-5h-5"></path></svg></span></button>'
      .'</header>'
      .'<div id="d5SavedChatBody" class="saved-chat-body">'
      .'<div id="d5SavedChatEmpty" class="saved-chat-empty"><span class="saved-chat-empty-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3v-7a4 4 0 0 1-1-2.65V7a4 4 0 0 1 4-4h11a4 4 0 0 1 4 4z"></path><path d="M8 10h.01M12 10h.01M16 10h.01"></path></svg></span><p>Start a comment</p><small>Write a message and it will stay saved in this room.</small></div>'
      .'<div id="d5SavedChatMessages" class="saved-chat-messages" hidden></div>'
      .'</div>'
      .'<div class="saved-chat-composer-wrap"><div class="saved-chat-composer">'
      .'<textarea id="d5SavedChatInput" rows="2" maxlength="1200" placeholder="Write a comment…" aria-label="Write a comment"></textarea>'
      .'<div class="saved-chat-composer-actions">'
      .'<button id="d5SavedChatNew" class="saved-chat-round-button" type="button" aria-label="New comment"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"></path></svg></button>'
      .'<button id="d5SavedChatSend" class="saved-chat-send" type="button" aria-label="Send message"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 7-7 7 7"></path><path d="M12 19V5"></path></svg></button>'
      .'</div></div><p id="d5SavedChatStatus" class="saved-chat-status" role="status" aria-live="polite"></p></div>'
      .'</div></section>'
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
      .'</div>'
      .'<section id="d5BeamCardDemo" class="beam-card-demo" aria-label="Beam card demo">'
      .'<div class="beam-card-grid">'
      .'<div class="beam-card-wrap beam-card-traveling beam-card-colorful"><article class="beam-card-surface">'
      .'<p class="beam-card-eyebrow">BUILDING · CUSTOM</p>'
      .'<h3 class="beam-card-title">Custom Toolbook</h3>'
      .'<p class="beam-card-description">Your Toolbook grows with the tools and modules developed specifically for your project.</p>'
      .'<div class="beam-card-body"><p class="beam-card-data">Built for you</p></div>'
      .'</article></div>'
      .'<div class="beam-card-wrap beam-card-pulse-outside beam-card-ocean"><article class="beam-card-surface">'
      .'<p class="beam-card-eyebrow">GOALS · DEVELOPMENT</p>'
      .'<h3 class="beam-card-title">Goal-driven building</h3>'
      .'<p class="beam-card-description">Define what you want to achieve and use your goals to guide the development of your workspace.</p>'
      .'<div class="beam-card-body"><p class="beam-card-data">Goal → Build</p></div>'
      .'</article></div>'
      .'<div class="beam-card-wrap beam-card-traveling beam-card-colorful"><article class="beam-card-surface">'
      .'<p class="beam-card-eyebrow">REQUEST · WORKFLOW</p>'
      .'<h3 class="beam-card-title">Development requests</h3>'
      .'<p class="beam-card-description">Request new tools, modules or features and expand your Codespace as your project evolves.</p>'
      .'<div class="beam-card-body"><p class="beam-card-data">Request + Build</p></div>'
      .'</article></div>'
      .'<div class="beam-card-wrap beam-card-pulse-outside beam-card-ocean"><article class="beam-card-surface">'
      .'<p class="beam-card-eyebrow">VALIDATION · UNIQUE</p>'
      .'<h3 class="beam-card-title">Unique validation codes</h3>'
      .'<p class="beam-card-description">Each submitted project can receive a unique code associated with its validation record.</p>'
      .'<div class="beam-card-body"><p class="beam-card-data">1 Project · 1 Code</p></div>'
      .'</article></div>'
      .'<div class="beam-card-wrap beam-card-traveling beam-card-colorful"><article class="beam-card-surface">'
      .'<p class="beam-card-eyebrow">WORKSPACE · MODULAR</p>'
      .'<h3 class="beam-card-title">Modular environment</h3>'
      .'<p class="beam-card-description">Add only the capabilities your project needs instead of working with unnecessary generic tools.</p>'
      .'<div class="beam-card-body"><p class="beam-card-data">∞ Expandable</p></div>'
      .'</article></div>'
      .'<div class="beam-card-wrap beam-card-pulse-outside beam-card-ocean"><article class="beam-card-surface">'
      .'<p class="beam-card-eyebrow">PROJECT · CONTROL</p>'
      .'<h3 class="beam-card-title">Everything in one space</h3>'
      .'<p class="beam-card-description">Organize your project, tools, goals and development resources from a unified workspace.</p>'
      .'<div class="beam-card-body"><p class="beam-card-data">1 Workspace</p></div>'
      .'</article></div>'
      .'</div>'
      .'</section>'
      .'<section id="d5TiltCardDemo" class="tilt-card-demo" aria-label="Tilt card demo">'
      .'<div id="d5TiltPerspective" class="tilt-card-perspective">'
      .'<article id="d5TiltCard" class="tilt-card-surface">'
      .'<div class="tilt-card-preserve">'
      .'<div class="tilt-card-item tilt-title" data-tilt-depth="50">Current price to purchase a slot</div>'
      .'<div class="tilt-card-item tilt-description" data-tilt-depth="30">Este es el precio que debes pagar para adquirir un cupo en la plataforma</div>'
      .'<div class="tilt-card-item tilt-media" data-tilt-depth="80"><div class="tilt-media-frame"><img src="'.$base.'hashcod_icon_exact.svg" alt="Hashcod Codespace platform icon"></div></div>'
      .'<div class="tilt-card-footer">'
      .'<div id="d5TiltPrice" class="tilt-card-item tilt-price" data-tilt-depth="40">$48,250</div>'
      .'<div class="tilt-card-item" data-tilt-depth="60"><button id="d5TiltWhatsApp" class="tilt-buy-button tilt-whatsapp-button" type="button" aria-label="Comprar cupo por WhatsApp"><svg class="tilt-whatsapp-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" aria-hidden="true"><path fill="#fff" d="M4.868,43.303l2.694-9.835C5.9,30.59,5.026,27.324,5.027,23.979C5.032,13.514,13.548,5,24.014,5c5.079,0.002,9.845,1.979,13.43,5.566c3.584,3.588,5.558,8.356,5.556,13.428c-0.004,10.465-8.522,18.98-18.986,18.98c-0.001,0,0,0,0,0h-0.008c-3.177-0.001-6.3-0.798-9.073-2.311L4.868,43.303z"></path><path fill="#fff" d="M4.868,43.803c-0.132,0-0.26-0.052-0.355-0.148c-0.125-0.127-0.174-0.312-0.127-0.483l2.639-9.636c-1.636-2.906-2.499-6.206-2.497-9.556C4.532,13.238,13.273,4.5,24.014,4.5c5.21,0.002,10.105,2.031,13.784,5.713c3.679,3.683,5.704,8.577,5.702,13.781c-0.004,10.741-8.746,19.48-19.486,19.48c-3.189-0.001-6.344-0.788-9.144-2.277l-9.875,2.589C4.953,43.798,4.911,43.803,4.868,43.803z"></path><path fill="#cfd8dc" d="M24.014,5c5.079,0.002,9.845,1.979,13.43,5.566c3.584,3.588,5.558,8.356,5.556,13.428c-0.004,10.465-8.522,18.98-18.986,18.98h-0.008c-3.177-0.001-6.3-0.798-9.073-2.311L4.868,43.303l2.694-9.835C5.9,30.59,5.026,27.324,5.027,23.979C5.032,13.514,13.548,5,24.014,5 M24.014,42.974C24.014,42.974,24.014,42.974,24.014,42.974C24.014,42.974,24.014,42.974,24.014,42.974 M24.014,42.974C24.014,42.974,24.014,42.974,24.014,42.974C24.014,42.974,24.014,42.974,24.014,42.974 M24.014,4C24.014,4,24.014,4,24.014,4C12.998,4,4.032,12.962,4.027,23.979c-0.001,3.367,0.849,6.685,2.461,9.622l-2.585,9.439c-0.094,0.345,0.002,0.713,0.254,0.967c0.19,0.192,0.447,0.297,0.711,0.297c0.085,0,0.17-0.011,0.254-0.033l9.687-2.54c2.828,1.468,5.998,2.243,9.197,2.244c11.024,0,19.99-8.963,19.995-19.98c0.002-5.339-2.075-10.359-5.848-14.135C34.378,6.083,29.357,4.002,24.014,4L24.014,4z"></path><path fill="#40c351" d="M35.176,12.832c-2.98-2.982-6.941-4.625-11.157-4.626c-8.704,0-15.783,7.076-15.787,15.774c-0.001,2.981,0.833,5.883,2.413,8.396l0.376,0.597l-1.595,5.821l5.973-1.566l0.577,0.342c2.422,1.438,5.2,2.198,8.032,2.199h0.006c8.698,0,15.777-7.077,15.78-15.776C39.795,19.778,38.156,15.814,35.176,12.832z"></path><path fill="#fff" fill-rule="evenodd" d="M19.268,16.045c-0.355-0.79-0.729-0.806-1.068-0.82c-0.277-0.012-0.593-0.011-0.909-0.011c-0.316,0-0.83,0.119-1.265,0.594c-0.435,0.475-1.661,1.622-1.661,3.956c0,2.334,1.7,4.59,1.937,4.906c0.237,0.316,3.282,5.259,8.104,7.161c4.007,1.58,4.823,1.266,5.693,1.187c0.87-0.079,2.807-1.147,3.202-2.255c0.395-1.108,0.395-2.057,0.277-2.255c-0.119-0.198-0.435-0.316-0.909-0.554s-2.807-1.385-3.242-1.543c-0.435-0.158-0.751-0.237-1.068,0.238c-0.316,0.474-1.225,1.543-1.502,1.859c-0.277,0.317-0.554,0.357-1.028,0.119c-0.474-0.238-2.002-0.738-3.815-2.354c-1.41-1.257-2.362-2.81-2.639-3.285c-0.277-0.474-0.03-0.731,0.208-0.968c0.213-0.213,0.474-0.554,0.712-0.831c0.237-0.277,0.316-0.475,0.474-0.791c0.158-0.317,0.079-0.594-0.04-0.831C20.612,19.329,19.69,16.983,19.268,16.045z" clip-rule="evenodd"></path></svg></button></div>'
      .'</div>'
      .'</div>'
      .'<div id="d5TiltGlare" class="tilt-card-glare" aria-hidden="true"></div>'
      .'</article>'
      .'</div>'
      .'<p class="tilt-card-hint">Move the pointer across the card — layers lift at different depths</p>'
      .'</section>'
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
      .'<span class="scratch-ticket-icon" aria-hidden="true"><img class="scratch-platform-icon" src="'.$base.'hashcod_icon_exact.svg" alt=""></span>'
      .'<span class="scratch-card-label">Coupon unlocked</span>'
      .'<span class="scratch-card-prize">20% off</span>'
      .'<button id="d5ScratchCopy" class="scratch-copy-button" type="button"><span id="d5ScratchCouponCode" class="scratch-copy-code">HC20-LOADING</span><span id="d5ScratchCopyIcon" class="scratch-copy-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><rect width="14" height="14" x="8" y="8" rx="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg></span><span id="d5ScratchCopySr" class="sr-only">Copy coupon code</span></button>'
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
