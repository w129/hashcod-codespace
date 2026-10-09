<?php
if (!function_exists('secretGet')) require_once __DIR__ . '/secrets.php';
require_once __DIR__ . '/entry-assets.php';

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
    // Phase 1 is signed manually from the desktop Tkinter signer, so give the
    // user enough time to copy, sign and paste without weakening anti-replay.
    $fallback=$phase===2?90:300;
    $value=(int)secretGet($name,(string)$fallback);
    $min=$phase===2?45:120;
    $max=$phase===2?180:600;
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
function codeAccessRequired(): bool {
    $raw=strtolower(trim((string)secretGet('L8_CODE_ACCESS_REQUIRED','1')));
    return !in_array($raw,['0','false','off','no'],true);
}
function codeAccessName(): string { return 'l8_hashcod_code_access_v1'; }
function codeAccessAuthorized(): bool {
    if (!codeAccessRequired()) return true;
    require_once __DIR__ . '/numeric-access-lib.php';
    return numericAccessAuthorized();
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
    require_once __DIR__ . '/platform-period-lib.php';
    require_once __DIR__ . '/policy-consent-lib.php';
    $base='/' . trim($base,'/') . '/';
    if($base==='//')$base='/';
    $css=entryAssetUrl($base,'components/mldsa-access-gate.css?v=20261007-faq-scroll1');
    $js=entryAssetUrl($base,'components/mldsa-access-gate.js?v=20261007-entry-fixes1');
    $pqcJs=htmlspecialchars($base.'components/pqc-action-runtime.js?v=20260928-pqcactions1',ENT_QUOTES,'UTF-8');
    $uiSoundsJs=htmlspecialchars($base.'components/ui-interaction-sounds.js?v=20261006-ui-sounds1',ENT_QUOTES,'UTF-8');
    $mascotCss=htmlspecialchars($base.'components/page-mascot-panda.css?v=20260929-panda2',ENT_QUOTES,'UTF-8');
    $mascotJs=htmlspecialchars($base.'components/page-mascot-panda.js?v=20260929-panda2',ENT_QUOTES,'UTF-8');
    $promptStudioCss=htmlspecialchars($base.'components/text-editor-prompt-studio.css?v=20260930-promptstudio1',ENT_QUOTES,'UTF-8');
    $promptStudioJs=htmlspecialchars($base.'components/text-editor-prompt-studio.js?v=20260930-promptstudio1',ENT_QUOTES,'UTF-8');
    $rotatingTextCss=entryAssetUrl($base,'components/react-bits-rotating-text.css?v=20261007-entry-fixes1');
    $rotatingTextBrandIcon=htmlspecialchars($base.'hashcod_icon_exact.svg',ENT_QUOTES,'UTF-8');
    $rotatingTextJs=entryAssetUrl($base,'components/react-bits-rotating-text.js?v=20261007-entry-fixes1');
    $branchedMenuCss=entryAssetUrl($base,'components/first-screen-branched-menu.bundle.css?v=20261007-entry-fixes1');
    $branchedMenuJs=entryAssetUrl($base,'components/first-screen-branched-menu.bundle.js?v=20261007-entry-fixes1');
    $centerEmptyStateCss=entryAssetUrl($base,'components/center-empty-state.bundle.css?v=20261009-toolbook-progress1');
    $centerEmptyStateJs=entryAssetUrl($base,'components/center-empty-state.bundle.js?v=20261007-security1');
    $mobileCss=htmlspecialchars($base.'components/first-screen-mobile.css?v=20261006-no-horizontal-scroll1',ENT_QUOTES,'UTF-8');
    $entryBootstrapJs=entryAssetUrl($base,'components/mldsa-access-gate-loader.js?v=20261007-security1');
    // The retired numeric credential modal is never part of public entry.
    // Paid features remain authorized by the server-confirmed subscription.
    $bodyAttr=$entryIntro
      ? ' data-hashcod-entry-intro="1" data-hashcod-shared-workspace="1" data-hashcod-code-access-required="0" data-hashcod-code-access-authorized="1"'
      : '';
    if ($entryIntro) {
      if (policyConsentValid()) $bodyAttr .= ' data-hashcod-policy-consent="1"';
      $bodyAttr .= ' data-hashcod-policy-version="'.htmlspecialchars(POLICY_CONSENT_VERSION,ENT_QUOTES,'UTF-8').'"';
      $period = platformPeriodData();
      if (platformPeriodExpired()) $bodyAttr .= ' data-hashcod-period-expired="1"';
      elseif (platformPeriodActive()) {
        $bodyAttr .= ' data-hashcod-period-days="'.(int)$period['days'].'" data-hashcod-period-expires-at="'.(int)$period['expiresAt'].'" data-hashcod-period-now="'.time().'" data-hashcod-pro-expires-at="'.(platformProActive() ? (int)$period['proExpiresAt'] : 0).'"';
      } else $bodyAttr .= ' data-hashcod-period-required="1"';
    }
    // Legacy regression marker only; this text is not rendered in the UI:
    // ENTRAR A HASHCOD CODESPACE
    $accessCard=$entryIntro
      ? '<section id="d5FirstBranchedMenuStage" class="entry-branched-menu-stage" aria-label="Branched menu">'
        .'<div id="d5FirstBranchedMenuMount" class="entry-branched-menu-mount" data-react-bits-component="BranchedMenu"></div>'
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
    return '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,interactive-widget=resizes-content"><meta name="robots" content="noindex,nofollow"><title>Hashcod Codespace</title><link rel="stylesheet" href="'.$css.'"><link rel="stylesheet" href="'.$mascotCss.'"><link rel="stylesheet" href="'.$promptStudioCss.'"><link rel="stylesheet" href="'.$rotatingTextCss.'">'.($entryIntro?'<link rel="stylesheet" href="'.$branchedMenuCss.'"><link rel="stylesheet" href="'.$centerEmptyStateCss.'"><link rel="stylesheet" href="'.$mobileCss.'">':'').'</head><body'.$bodyAttr.'>'
      .'<main class="access-stage">'
      .($entryIntro?'<div id="d5RotatingTextHero" class="entry-rotating-text-hero" data-texts="código|desarrollo|programación|IA|aprendizaje profundo|estructuras de datos|algoritmos|esquemas|vectores|grafos|árboles|mapas hash" data-stagger-from="last" data-stagger-duration="25" data-rotation-interval="2000" data-transition-damping="30" data-transition-stiffness="400" aria-label="Crea con código"><span class="entry-rotating-text-brand"><img class="entry-rotating-text-brand-icon" src="'.$rotatingTextBrandIcon.'" width="38" height="38" alt="" aria-hidden="true"><span class="entry-rotating-text-prefix">Crea con </span></span><span class="entry-rotating-text-shell"><span id="d5RotatingTextLive" class="entry-rotating-text-sr-only" aria-live="polite">código</span><span id="d5RotatingTextViewport" class="entry-rotating-text-viewport" aria-hidden="true"></span></span></div>':'')
      .($entryIntro?'<section id="d5CenterEmptyStateStage" class="entry-empty-state-stage" aria-label="VC"><div id="d5CenterEmptyStateMount" class="entry-empty-state-mount" data-hashcod-component="EmptyState"></div></section>':'')
      .'<div class="access-layout"><div class="access-left-stack">'.$accessCard
      .'<div id="d5FaqStack" class="faq-stack">'
      .'<div id="d5FaqModalBackdrop" class="faq-modal-backdrop" hidden aria-hidden="true"></div>'
      .'<div id="d5WorkspaceModalBackdrop" class="workspace-modal-backdrop" hidden aria-hidden="true"></div>'
      .'<div id="d5TextCardBackdrop" class="text-card-modal-backdrop" hidden aria-hidden="true"></div>'
      .'<div id="d5DocumentsHubBackdrop" class="documents-hub-backdrop" hidden aria-hidden="true"></div>'
      .'<section id="d5DocumentsHubShell" class="documents-hub-shell" hidden role="dialog" aria-modal="true" aria-hidden="true" aria-label="Documents">'
      .'<button id="d5DocumentsHubClose" class="documents-hub-close" type="button" aria-label="Cerrar Documents">×</button>'
      .'<div id="d5DocumentsHubContent" class="documents-hub-content"></div>'
      .'</section>'
      .'<section id="d5FaqCard" class="faq-tabs-card" role="dialog" aria-modal="true" aria-hidden="true" aria-labelledby="d5FaqModalTitle">'
      .'<div class="faq-modal-header"><h2 id="d5FaqModalTitle">FAQ</h2><button id="d5FaqClose" class="faq-modal-close" type="button" aria-label="Cerrar FAQ">×</button></div>'
      .'<div class="faq-tabs" role="tablist" aria-label="Categorías de preguntas frecuentes">'
      .'<button class="faq-tab active" type="button" role="tab" aria-selected="true" data-faq-tab="0"><span class="faq-tab-pill"></span><span class="faq-tab-label">General</span></button>'
      .'<button class="faq-tab" type="button" role="tab" aria-selected="false" data-faq-tab="1"><span class="faq-tab-label">Desarrollo</span></button>'
      .'<button class="faq-tab" type="button" role="tab" aria-selected="false" data-faq-tab="2"><span class="faq-tab-label">Objetivos</span></button>'
      .'</div>'
      .'<div id="d5FaqAccordion" class="faq-accordion"></div>'
      .'<button id="d5FaqFooter" class="faq-footer" type="button">Comenzar mi Solicitud</button>'
      .'</section>'
      .'<section id="d5TextEditorCard" class="liquid-text-editor" role="dialog" aria-modal="true" aria-hidden="true" aria-label="Workspace" hidden>'
      .'<div class="liquid-editor-shine" aria-hidden="true"></div>'
      .'<header class="liquid-editor-header">'
      .'<div class="liquid-editor-heading"><span class="liquid-editor-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 5h16"></path><path d="M4 12h16"></path><path d="M4 19h10"></path></svg></span><div><p>TEXT EDITOR</p><h3>Workspace draft</h3></div></div>'
      .'<div class="liquid-editor-header-actions"><span id="d5TextEditorStatus" class="liquid-editor-status" data-state="loading"><i></i><span>Loading</span></span><button id="d5WorkspaceClose" class="workspace-modal-close" type="button" aria-label="Cerrar Workspace">×</button></div>'
      .'</header>'
      .'<div class="liquid-editor-toolbar" role="toolbar" aria-label="File and text tools">'
      .'<button id="d5TextEditorImport" class="liquid-editor-tool" type="button" title="Abrir TXT, MD, CSV o VPD"><span>Open</span></button>'
      .'<input id="d5TextEditorFile" class="liquid-editor-file" type="file" accept=".txt,.md,.csv,.vpd,text/plain,text/csv,text/markdown">'
      .'<button id="d5TextEditorNormalize" class="liquid-editor-tool" type="button" title="Normalizar Unicode NFKC">NFKC</button>'
      .'<button id="d5TextEditorClean" class="liquid-editor-tool" type="button" title="Limpiar caracteres de control">Clean</button>'
      .'<button id="d5TextEditorExport" class="liquid-editor-tool" type="button" title="Descargar texto UTF-8">TXT</button>'
      .'<button id="d5TextEditorClear" class="liquid-editor-tool danger" type="button" title="Vaciar borrador">Clear</button>'
      .'<span id="d5TextEditorEncoding" class="liquid-editor-encoding">UTF-8</span>'
      .'</div>'
      .'<div id="d5TextEditorFormatbar" class="liquid-editor-formatbar" role="toolbar" aria-label="Banger-inspired Markdown formatting">'
      .'<button class="liquid-editor-command" type="button" data-editor-command="undo" aria-label="Undo" title="Undo · Ctrl+Z">↶</button>'
      .'<button class="liquid-editor-command" type="button" data-editor-command="redo" aria-label="Redo" title="Redo · Ctrl+Y">↷</button>'
      .'<span class="liquid-editor-divider" aria-hidden="true"></span>'
      .'<button class="liquid-editor-command" type="button" data-editor-command="bold" aria-label="Bold" title="Bold · Ctrl+B"><strong>B</strong></button>'
      .'<button class="liquid-editor-command" type="button" data-editor-command="italic" aria-label="Italic" title="Italic · Ctrl+I"><em>I</em></button>'
      .'<button class="liquid-editor-command" type="button" data-editor-command="underline" aria-label="Underline" title="Underline · Ctrl+U"><u>U</u></button>'
      .'<button class="liquid-editor-command" type="button" data-editor-command="strike" aria-label="Strikethrough" title="Strikethrough · Ctrl+Shift+X"><s>S</s></button>'
      .'<span class="liquid-editor-divider" aria-hidden="true"></span>'
      .'<button class="liquid-editor-command wide" type="button" data-editor-command="h1" aria-label="Heading 1">H1</button>'
      .'<button class="liquid-editor-command wide" type="button" data-editor-command="h2" aria-label="Heading 2">H2</button>'
      .'<button class="liquid-editor-command wide" type="button" data-editor-command="h3" aria-label="Heading 3">H3</button>'
      .'<button class="liquid-editor-command wide" type="button" data-editor-command="quote" aria-label="Blockquote" title="Blockquote">❯</button>'
      .'<button class="liquid-editor-command wide" type="button" data-editor-command="code" aria-label="Inline code" title="Inline code">&lt;/&gt;</button>'
      .'<button class="liquid-editor-command wide" type="button" data-editor-command="codeblock" aria-label="Code block" title="Code block">{ }</button>'
      .'<button class="liquid-editor-command wide" type="button" data-editor-command="bullet" aria-label="Bullet list" title="Bullet list">• List</button>'
      .'<button class="liquid-editor-command wide" type="button" data-editor-command="ordered" aria-label="Numbered list" title="Numbered list">1. List</button>'
      .'<button class="liquid-editor-command wide" type="button" data-editor-command="link" aria-label="Insert link" title="Insert Markdown link">Link</button>'
      .'<button class="liquid-editor-command wide" type="button" data-editor-command="rule" aria-label="Horizontal rule" title="Horizontal rule">HR</button>'
      .'<button class="liquid-editor-command slash" type="button" data-editor-command="slash" aria-label="Open command menu" title="Command menu">/</button>'
      .'</div>'
      .'<div class="liquid-editor-field">'
      .'<textarea id="d5TextEditorInput" class="autosize-textarea" rows="1" maxlength="65536" wrap="soft" spellcheck="true" placeholder="Write Markdown, paste text, or type / for commands." aria-label="Text editor"></textarea>'
      .'<div id="d5TextEditorSlashMenu" class="liquid-editor-slash-menu" role="listbox" aria-label="Editor commands" hidden>'
      .'<button type="button" class="liquid-editor-slash-item" role="option" data-editor-slash="paragraph" data-editor-keywords="text paragraph plain"><strong>Text</strong><span>Plain paragraph</span></button>'
      .'<button type="button" class="liquid-editor-slash-item" role="option" data-editor-slash="h1" data-editor-keywords="heading title h1"><strong>Heading 1</strong><span># Large section</span></button>'
      .'<button type="button" class="liquid-editor-slash-item" role="option" data-editor-slash="h2" data-editor-keywords="heading subtitle h2"><strong>Heading 2</strong><span>## Medium section</span></button>'
      .'<button type="button" class="liquid-editor-slash-item" role="option" data-editor-slash="h3" data-editor-keywords="heading h3"><strong>Heading 3</strong><span>### Small section</span></button>'
      .'<button type="button" class="liquid-editor-slash-item" role="option" data-editor-slash="quote" data-editor-keywords="quote blockquote"><strong>Blockquote</strong><span>&gt; Quoted text</span></button>'
      .'<button type="button" class="liquid-editor-slash-item" role="option" data-editor-slash="bullet" data-editor-keywords="bullet unordered list"><strong>Bullet list</strong><span>- List item</span></button>'
      .'<button type="button" class="liquid-editor-slash-item" role="option" data-editor-slash="ordered" data-editor-keywords="number ordered list"><strong>Numbered list</strong><span>1. List item</span></button>'
      .'<button type="button" class="liquid-editor-slash-item" role="option" data-editor-slash="codeblock" data-editor-keywords="code block fence"><strong>Code block</strong><span>Fenced Markdown code</span></button>'
      .'<button type="button" class="liquid-editor-slash-item" role="option" data-editor-slash="rule" data-editor-keywords="divider horizontal rule"><strong>Divider</strong><span>Horizontal rule</span></button>'
      .'</div>'
      .'</div>'
      .'<footer class="liquid-editor-footer"><span id="d5TextEditorCount">0 lines · 0 words · 0 characters</span><span class="liquid-editor-shortcut">Ctrl+S · Ctrl+B/I/U · /</span></footer>'
      .'</section>'
      .'</div>'
      .'<section id="d5NavListDemo" class="nav-list-demo" aria-label="Tarjetas de navegación">'
      .'<div class="nav-list-left-column">'
      .'<div class="nav-list-grid">'
      .'<article class="nav-list-card"><p class="nav-list-title">Credenciales y verificación</p><ul class="nav-list-items">'
      .'<li><button type="button" class="nav-list-row" data-nav-list-item="Documents"><span class="nav-list-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" x2="8" y1="13" y2="13"></line><line x1="16" x2="8" y1="17" y2="17"></line><line x1="10" x2="8" y1="9" y2="9"></line></svg></span><span class="nav-list-label">Documents</span></button></li>'
      .'<li><button type="button" class="nav-list-row" data-nav-list-item="Budget"><span class="nav-list-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><rect width="20" height="14" x="2" y="5" rx="2"></rect><line x1="2" x2="22" y1="10" y2="10"></line></svg></span><span class="nav-list-label">Presupuesto</span></button></li>'
      .'<li><button type="button" class="nav-list-row" data-nav-list-item="Reports"><span class="nav-list-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3v18h18"></path><path d="M18 17V9"></path><path d="M13 17V5"></path><path d="M8 17v-3"></path></svg></span><span class="nav-list-label">Informes</span></button></li>'
      .'</ul></article>'
      .'<article class="nav-list-card"><p class="nav-list-title">Soporte</p><ul class="nav-list-items">'
      .'<li><button type="button" class="nav-list-row" data-nav-list-item="Help Center"><span class="nav-list-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 1 1 5.83 1c0 2-3 2-3 4"></path><path d="M12 17h.01"></path></svg></span><span class="nav-list-label">Centro de ayuda</span></button></li>'
      .'<li><button type="button" class="nav-list-row" data-nav-list-item="Docs"><span class="nav-list-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 4.5A2.5 2.5 0 0 1 4.5 2H10a2 2 0 0 1 2 2v16a2 2 0 0 0-2-2H4.5A2.5 2.5 0 0 0 2 20.5z"></path><path d="M22 4.5A2.5 2.5 0 0 0 19.5 2H14a2 2 0 0 0-2 2v16a2 2 0 0 1 2-2h5.5a2.5 2.5 0 0 1 2.5 2.5z"></path></svg></span><span class="nav-list-label">Documentación</span></button></li>'
      .'<li><button type="button" class="nav-list-row" data-nav-list-item="Contact Us"><span class="nav-list-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3v-7a4 4 0 0 1-1-2.65V7a4 4 0 0 1 4-4h11a4 4 0 0 1 4 4z"></path><path d="M8 9h.01"></path><path d="M12 9h.01"></path><path d="M16 9h.01"></path></svg></span><span class="nav-list-label">Contacto</span></button></li>'
      .'</ul></article>'
      .'</div>'
      .'</div>'
      .'<section id="d5BeamCardDemo" class="beam-card-demo" role="dialog" aria-modal="true" aria-hidden="true" aria-label="Text Card" hidden>'
      .'<button id="d5TextCardClose" class="text-card-modal-close" type="button" aria-label="Cerrar Text Card">×</button>'
      .'<div class="beam-card-grid">'
      .'<div class="beam-card-wrap beam-card-traveling beam-card-colorful"><article class="beam-card-surface">'
      .'<p class="beam-card-eyebrow">DESARROLLO · A MEDIDA</p>'
      .'<h3 class="beam-card-title">Toolbook a medida</h3>'
      .'<p class="beam-card-description">Tu Toolbook crece con las herramientas y los módulos desarrollados para tu proyecto.</p>'
      .'<div class="beam-card-body"><p class="beam-card-data">Creado para ti</p></div>'
      .'</article></div>'
      .'<div class="beam-card-wrap beam-card-pulse-outside beam-card-ocean"><article class="beam-card-surface">'
      .'<p class="beam-card-eyebrow">OBJETIVOS · DESARROLLO</p>'
      .'<h3 class="beam-card-title">Desarrollo por objetivos</h3>'
      .'<p class="beam-card-description">Define lo que quieres lograr y usa tus objetivos para orientar el desarrollo de tu espacio de trabajo.</p>'
      .'<div class="beam-card-body"><p class="beam-card-data">Objetivo → Desarrollo</p></div>'
      .'</article></div>'
      .'<div class="beam-card-wrap beam-card-traveling beam-card-colorful"><article class="beam-card-surface">'
      .'<p class="beam-card-eyebrow">SOLICITUD · PROCESO</p>'
      .'<h3 class="beam-card-title">Solicitudes de desarrollo</h3>'
      .'<p class="beam-card-description">Solicita nuevas herramientas, módulos o funciones y amplía tu Codespace a medida que evoluciona tu proyecto.</p>'
      .'<div class="beam-card-body"><p class="beam-card-data">Solicitud + Desarrollo</p></div>'
      .'</article></div>'
      .'<div class="beam-card-wrap beam-card-pulse-outside beam-card-ocean"><article class="beam-card-surface">'
      .'<p class="beam-card-eyebrow">VALIDACIÓN · REGISTRO</p>'
      .'<h3 class="beam-card-title">Códigos de validación únicos</h3>'
      .'<p class="beam-card-description">Cada proyecto presentado puede recibir un código único asociado a su registro de validación.</p>'
      .'<div class="beam-card-body"><p class="beam-card-data">1 proyecto · 1 código</p></div>'
      .'</article></div>'
      .'<div class="beam-card-wrap beam-card-traveling beam-card-colorful"><article class="beam-card-surface">'
      .'<p class="beam-card-eyebrow">ESPACIO · MODULAR</p>'
      .'<h3 class="beam-card-title">Entorno modular</h3>'
      .'<p class="beam-card-description">Añade las funciones que necesita tu proyecto y organiza las herramientas de tu espacio de trabajo.</p>'
      .'<div class="beam-card-body"><p class="beam-card-data">∞ Ampliable</p></div>'
      .'</article></div>'
      .'<div class="beam-card-wrap beam-card-pulse-outside beam-card-ocean"><article class="beam-card-surface">'
      .'<p class="beam-card-eyebrow">PROYECTO · CONTROL</p>'
      .'<h3 class="beam-card-title">Todo en un espacio</h3>'
      .'<p class="beam-card-description">Organiza tu proyecto, tus herramientas, tus objetivos y tus recursos de desarrollo desde un mismo espacio.</p>'
      .'<div class="beam-card-body"><p class="beam-card-data">1 espacio de trabajo</p></div>'
      .'</article></div>'
      .'</div>'
      .'</section>'
      .'<section id="d5NumberTickerDemo" class="number-ticker-demo" aria-label="Valor del espacio">'
      .'<div class="number-ticker-card">'
      .'<p class="number-ticker-kicker">¿Cuánto cuesta un espacio?</p>'
      .'<div class="number-ticker-value"><span id="d5NumberTicker" class="number-ticker" aria-live="polite" aria-label="$60.00"></span></div>'
      .'<p class="number-ticker-caption">Ajusta el valor con los controles.</p>'
      .'</div>'
      .'<div class="number-ticker-controls">'
      .'<button id="d5TickerDecrease" class="number-ticker-button" type="button" aria-label="Disminuir"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"></path></svg></button>'
      .'<button id="d5TickerRandomize" class="number-ticker-button" type="button" aria-label="Valor aleatorio"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 3h5v5"></path><path d="M4 20 21 3"></path><path d="M21 16v5h-5"></path><path d="m15 15 6 6"></path><path d="m4 4 5 5"></path></svg></button>'
      .'<button id="d5TickerIncrease" class="number-ticker-button" type="button" aria-label="Aumentar"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14"></path><path d="M5 12h14"></path></svg></button>'
      .'</div>'
      .'</section>'
      .'<section id="d5ScratchCardDemo" class="scratch-card-demo" aria-label="Cupón de descuento">'
      .'<div id="d5ScratchCard" class="scratch-card-shell">'
      .'<div id="d5ScratchContent" class="scratch-card-content" inert>'
      .'<span class="scratch-ticket-icon" aria-hidden="true"><img class="scratch-platform-icon" src="'.$base.'hashcod_icon_exact.svg" alt=""></span>'
      .'<span class="scratch-card-label">Cupón disponible</span>'
      .'<span class="scratch-card-prize">20% de descuento</span>'
      .'<button id="d5ScratchCopy" class="scratch-copy-button" type="button"><span id="d5ScratchCouponCode" class="scratch-copy-code">Cargando cupón…</span><span id="d5ScratchCopyIcon" class="scratch-copy-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><rect width="14" height="14" x="8" y="8" rx="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg></span><span id="d5ScratchCopySr" class="sr-only">Copiar código del cupón</span></button>'
      .'</div>'
      .'<div id="d5ScratchFoil" class="scratch-foil">'
      .'<canvas id="d5ScratchCanvas" class="scratch-canvas" role="button" tabindex="0" aria-label="Rasca para revelar tu cupón. Pulsa Enter para revelarlo."></canvas>'
      .'<canvas id="d5ScratchParticles" class="scratch-particles" aria-hidden="true"></canvas>'
      .'</div>'
      .'<span id="d5ScratchAnnouncement" class="sr-only" aria-live="polite"></span>'
      .'</div>'
      .'<p id="d5ScratchCouponStatus" class="scratch-card-hint" role="status"></p><button id="d5ScratchCouponRetry" class="scratch-reset-button" type="button" hidden>Reintentar cupón</button>'
      .'<p class="scratch-card-hint">Desliza sobre la tarjeta para revelar el cupón</p>'
      .'<button id="d5ScratchReset" class="scratch-reset-button" type="button" hidden><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"></path><path d="M3 3v5h5"></path></svg><span>Volver a rascar</span></button>'
      .'</section>'
      .'</section></div>'
      .'<section id="d5ToolDeck" class="tool-deck" data-card-source="true" hidden aria-hidden="true">'
      .'<article class="tool-card card-0" data-card-index="0"><div class="tool-card-inner"><img class="tool-logo" src="'.$base.'components/mldsa-card-assets/spotlight-code.svg" alt="Spotlight Code logo"><div class="tool-copy"><h2>Spotlight Code</h2><p>Code focused on your custom enhancements, providing you with the necessary credentials to make fixes or changes.</p></div></div></article>'
      .'<article class="tool-card card-1" data-card-index="1"><div class="tool-card-inner"><img class="tool-logo" src="'.$base.'components/mldsa-card-assets/pit-barriers.svg" alt="Pit Barriers logo"><div class="tool-copy"><h2>Pit Barriers</h2><p>Barriers with intentional holes designed to lure your code into false traps.</p></div></div></article>'
      .'<article class="tool-card card-2" data-card-index="2"><div class="tool-card-inner"><img class="tool-logo" src="'.$base.'components/mldsa-card-assets/single-bed-base.svg" alt="Single bed base logo"><div class="tool-copy"><h2>Single bed base</h2><p>Rent out your unit through the CRM, and you can even sell or rent it to someone else.</p></div></div></article>'
      .'<article class="tool-card card-3" data-card-index="3"><div class="tool-card-inner"><img class="tool-logo" src="'.$base.'components/mldsa-card-assets/tokenized-certification.svg" alt="Tokenized certification logo"><div class="tool-copy"><h2>Tokenized certification</h2><p>Obtain your tokenized platform certification by integrating with our Codespace and contacting us.</p></div></div></article>'
      .'</section>'
      .'<div id="d5CardModalBackdrop" class="card-modal-backdrop" hidden aria-hidden="true"></div>'
      .'<section id="d5CardModalShell" class="card-modal-shell" hidden role="dialog" aria-modal="true" aria-hidden="true" aria-label="Cards">'
      .'<button id="d5CardClose" class="card-modal-close" type="button" aria-label="Cerrar Card">×</button>'
      .'<div id="d5CardModalDeck" class="tool-deck card-modal-deck" role="button" tabindex="0" aria-expanded="false" aria-label="Expandir o apilar tarjetas de herramientas"></div>'
      .'</section>'
      .'</div></main>'
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
      .($entryIntro?'<footer id="d5PreviewPolicyFooter" class="preview-policy-footer" aria-label="Aceptación de la Use and Privacy Policy"><div id="d5PolicyConsentMount" class="policy-consent-mount" data-hashcod-component="PolicyConsent"></div></footer>':'')
      .'<script src="'.$uiSoundsJs.'" defer data-hashcod-ui-sounds="true"></script><script src="'.$pqcJs.'" defer></script><script src="'.$mascotJs.'" defer></script><script src="'.$js.'" defer></script><script src="'.$promptStudioJs.'" defer></script><script src="'.$rotatingTextJs.'" defer></script>'.($entryIntro?'<script src="'.$branchedMenuJs.'" defer></script><script src="'.$centerEmptyStateJs.'" defer></script><script src="'.$entryBootstrapJs.'" defer data-hashcod-entry-bootstrap="true"></script>':'').'</body></html>';
}
