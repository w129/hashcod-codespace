<?php
/**
 * Hashcod Codespace — entrada local para Laragon.
 *
 * El repositorio conserva 404.html como el documento HTML completo de la
 * plataforma. En Render el front controller añade las capas dinámicas; esta
 * entrada hace lo mismo cuando Apache/Laragon sirve el proyecto localmente.
 */

function hashcodLaragonBasePath(): string {
    $script = str_replace('\\', '/', (string)($_SERVER['SCRIPT_NAME'] ?? ''));
    $dir = str_replace('\\', '/', dirname($script));
    $dir = trim($dir);
    if ($dir === '' || $dir === '.' || $dir === '/') {
        return '/';
    }

    $parts = array_values(array_filter(explode('/', trim($dir, '/')), static function ($part) {
        return $part !== '';
    }));
    if (!$parts) return '/';

    return '/' . implode('/', array_map('rawurlencode', $parts)) . '/';
}

$source = __DIR__ . '/404.html';
if (!is_file($source)) {
    http_response_code(500);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Hashcod Codespace local: falta 404.html, que contiene la interfaz completa.';
    return;
}

$html = (string)file_get_contents($source);
$baseRaw = hashcodLaragonBasePath();
$baseAttr = htmlspecialchars($baseRaw, ENT_QUOTES, 'UTF-8');
$baseJs = json_encode($baseRaw, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

// El HTML original usa / en Render. En Laragon puede vivir en
// /Hashcod%20Codespace/, por lo que fijamos su base al directorio real.
$html = str_replace("var base = '/';", 'var base = ' . $baseJs . ';', $html);
$html = str_replace(
    'components/admin-hello-button.js?v=20260912-1',
    'components/admin-hello-button.js?v=20260926-noregform1',
    $html
);

$efrCssPath = __DIR__ . '/components/efr-code-editor.css';
$efrCss = is_file($efrCssPath) ? (string)file_get_contents($efrCssPath) : '';
$inlineEfrCss = $efrCss !== ''
    ? '<style id="hashcod-laragon-efr-code-editor-inline">' . $efrCss . '</style>'
    : '<link rel="stylesheet" href="' . $baseAttr . 'components/efr-code-editor.css?v=20260919-perf1" data-hashcod-efr-code-editor-style="true">';

$headExtras = '<base href="' . $baseAttr . '">'
    . '<style id="hashcod-legacy-auth-prehide">#authOverlay,#authWrapper,#hashcodVectorTray,#hashcodAuthUtilityDock,#groqAuthChatPanel,#groqAuthChatLauncher,#hashcodEftCodeKeyGate,#hashcodEfrHotzone,#cryptoCardValidationLauncherBtn,#d5LauncherBtn,[data-hashcod-auth-utility-dock]{display:none!important;visibility:hidden!important;pointer-events:none!important;}</style>'
    . '<script id="hashcod-legacy-auth-retired-flag">window.__hashcodLegacyAuthRetired=true;document.documentElement.dataset.hashcodLegacyAuthRetired="true";</script>'
    . '<script id="hashcod-registration-gate-preboot">(function(){var root=document.documentElement;window.__hashcodPlatformEntryHoldReady=true;root.dataset.hashcodEntryGateReady="true";root.dataset.hashcodRegistrationRetired="true";var entered=false;var opening=false;function emit(name,detail){try{window.dispatchEvent(new CustomEvent(name,{detail:detail||{}}));}catch(_){}}function finalEnter(event){if(entered)return true;entered=true;if(event){event.preventDefault();event.stopPropagation();if(typeof event.stopImmediatePropagation==="function")event.stopImmediatePropagation();}try{if(document.getAnimations)document.getAnimations().forEach(function(a){try{a.cancel();}catch(_){}});}catch(_){}root.classList.remove("boot-locked","auth-locked","hashcod-duo-transitioning","hashcod-duo-arrival-pending");root.classList.add("hashcod-platform-entered");root.dataset.hashcodPlatformEntered="true";root.dataset.hashcodEntryGateReady="true";root.dataset.hashcodFinalEntryScreen="false";if(root.dataset)delete root.dataset.hashcodDuoBusy;var body=document.body;if(body){body.classList.remove("boot-locked","auth-locked");body.classList.add("hashcod-platform-entered");body.removeAttribute("data-auth-locked");body.removeAttribute("aria-busy");}["hashcodEntryTransition","hashcodDuoShade","hashcodDuoHinge"].forEach(function(id){var n=document.getElementById(id);if(n&&n.parentNode){try{n.parentNode.removeChild(n);}catch(_){}}});var boot=document.getElementById("bootCliOverlay");if(boot){boot.classList.add("hidden");boot.hidden=true;boot.setAttribute("aria-hidden","true");boot.style.setProperty("display","none","important");boot.style.setProperty("visibility","hidden","important");boot.style.setProperty("pointer-events","none","important");}try{sessionStorage.setItem("l8_boot_cli_done","1");}catch(_){}var notify=function(){emit("hashcod:platform-entered",{source:"second-entry-screen",direct:true,registration:false});emit("hashcod:platform-entry-complete",{source:"second-entry-screen",direct:true,registration:false});};if(typeof requestAnimationFrame==="function"){requestAnimationFrame(function(){setTimeout(notify,0);});}else{setTimeout(notify,0);}return true;}function openSecond(event){if(event){event.preventDefault();event.stopPropagation();if(typeof event.stopImmediatePropagation==="function")event.stopImmediatePropagation();}if(entered)return true;if(opening&&document.getElementById("hashcodEntryHold"))return true;opening=true;var tries=0;function attempt(){tries++;var hold=window.HashcodPlatformEntryHold;if(hold&&typeof hold.open==="function"){opening=false;return hold.open();}if(tries<40){return setTimeout(attempt,50);}opening=false;return finalEnter();}attempt();return true;}document.addEventListener("click",function(e){var b=e.target&&e.target.closest?e.target.closest("#bootCliEnter"):null;if(!b)return;openSecond(e);},true);document.addEventListener("keydown",function(e){if(e.key!=="Enter"&&e.key!=="Escape")return;var boot=document.getElementById("bootCliOverlay");if(!boot||boot.hidden||boot.classList.contains("hidden"))return;openSecond(e);},true);window.HashcodInlineDirectEntry={enter:finalEnter,openSecond:openSecond,version:"20260926-second-screen-restored1"};})();</script>'
    . '<style id="hashcod-platform-registration-prehide">#hashcodPlatformRegistration,#hashcodDirectRegistration,.hashcod-registration-shell,.hashcod-registration-overlay,.hc-reg-card{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important;}</style>'
    . '<script id="hashcod-registration-retirement-guard">(function(){window.__hashcodRegistrationDisabled=true;var blocked=["platform-registration-form","registration-flip","entry-registration-force","hashcod-registration-glass-theme","hashcod-registration-pixel-bg","hashcod-registration-heroui"];function blockedAsset(n){var u=((n&&n.getAttribute&&(n.getAttribute("src")||n.getAttribute("href")))||"").toLowerCase();return blocked.some(function(x){return u.indexOf(x)>=0;});}function clean(){document.documentElement.dataset.hashcodRegistrationRetired="true";document.documentElement.dataset.hashcodFinalEntryScreen="false";document.querySelectorAll("#hashcodPlatformRegistration,#hashcodDirectRegistration,.hashcod-registration-shell,.hashcod-registration-overlay,.hc-reg-card").forEach(function(n){try{n.remove();}catch(_){}});document.querySelectorAll("script[src],link[href]").forEach(function(n){if(blockedAsset(n)){try{n.remove();}catch(_){}}});}clean();if(document.head&&typeof MutationObserver==="function"){var o=new MutationObserver(function(records){records.forEach(function(r){Array.from(r.addedNodes||[]).forEach(function(n){if(!n||n.nodeType!==1)return;if(blockedAsset(n)){try{n.remove();}catch(_){}}});});});o.observe(document.head,{childList:true});setTimeout(function(){clean();o.disconnect();},10000);}})();</script>'
    . '<link rel="stylesheet" href="' . $baseAttr . 'components/toolbox-secure-links.css?v=20260914-retired1" data-hashcod-toolbox-secure-style="true">'
    . '<link rel="stylesheet" href="' . $baseAttr . 'components/admin-hello-button.css?v=20260914-sequence15" data-hashcod-boot-icons-style="true">'
    . '<link rel="stylesheet" href="' . $baseAttr . 'components/platform-entry-motion.css?v=20260918-1" data-hashcod-platform-entry-motion-style="true">'
    . '<link rel="stylesheet" href="' . $baseAttr . 'components/platform-entry-hold.css?v=20260926-second-screen1" data-hashcod-platform-entry-hold-style="true">'
    . '<link rel="stylesheet" href="' . $baseAttr . 'components/platform-entry-slogan.css?v=20260926-second-screen1" data-hashcod-vector-tray-style="true">'
    . '<link rel="stylesheet" href="' . $baseAttr . 'components/duo-page-transition.css?v=20260913-2" data-hashcod-duo-transition-style="true">'
    . '<link rel="stylesheet" href="' . $baseAttr . 'components/platform-entry-capability-footer.css?v=20260913-3" data-hashcod-entry-capability-footer-style="true">'
    . '<link rel="stylesheet" href="' . $baseAttr . 'components/boot-brand-credit-relocate.css?v=20260917-10" data-hashcod-boot-brand-credit-relocate-style="true">'
    . '<link rel="stylesheet" href="' . $baseAttr . 'components/percent-feature-button.css?v=20260914-1" data-hashcod-percent-feature-style="true">'
    . '<link rel="stylesheet" href="' . $baseAttr . 'components/platform-crm.css?v=20260927-platformcrm6" data-hashcod-platform-crm-style="true">'
    . '<script id="hashcod-deskcomm-crm-config">window.HASHCOD_DESKCOMM_CRM_URL="";</script>'
    . $inlineEfrCss
    . '<style id="hashcod-laragon-rare-folder-placement">'
    . '#hashcodRareFolderHost{position:fixed!important;left:27vw!important;top:50vh!important;z-index:2147482500!important;display:block!important;visibility:visible!important;opacity:1!important;overflow:visible!important;pointer-events:none!important;transform:translate(-50%,-50%) scale(1.18)!important;transform-origin:center center!important;}'
    . '#hashcodRareFolderHost [data-slot="folder"]{pointer-events:auto!important;}'
    . '#bootCliHint{display:none!important;visibility:hidden!important;}'
    . '.boot-cli-hint-wrap{min-width:0!important;}'
    // Local should show only the Rare UI folder. The retired Originkit blackhole
    // is canvas-based and can still be present inside 404.html, so suppress it.
    . '#bootBlackholeCanvas,#bootCliOverlay canvas[id*="blackhole" i],#bootCliOverlay canvas[class*="blackhole" i]{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important;}'
    . '#bootCliOverlay [id*="blackhole" i],#bootCliOverlay [class*="blackhole" i],[data-originkit-blackhole]{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important;}'
    . '@media(max-width:1180px){#hashcodRareFolderHost{left:28vw!important;top:50vh!important;transform:translate(-50%,-50%) scale(1.08)!important;}}'
    . '@media(max-width:900px){#hashcodRareFolderHost{left:50vw!important;top:30vh!important;transform:translate(-50%,-50%) scale(1.06)!important;}}'
    . '@media(max-width:620px){#hashcodRareFolderHost{left:50vw!important;top:27vh!important;transform:translate(-50%,-50%) scale(1.00)!important;}}'
    . '</style>'
    . '<script id="hashcod-laragon-preboot">try{sessionStorage.setItem("hashcod_platform_intro_seen_v1","1");}catch(e){}</script>';

$headPos = stripos($html, '</head>');
if ($headPos !== false) {
    $html = substr($html, 0, $headPos) . $headExtras . substr($html, $headPos);
} else {
    $html = $headExtras . $html;
}

// Cargar exactamente el bundle React/Motion de Rare UI usado en producción.
$rarePath = __DIR__ . '/components/rare-folder-entry.bundle.js';
$rareBundle = is_file($rarePath) ? (string)file_get_contents($rarePath) : '';
if ($rareBundle !== '') {
    $rareBundle = str_ireplace('</script', '<\\/script', $rareBundle);
}
$rareInline = $rareBundle !== ''
    ? '<script id="hashcod-laragon-rare-folder-inline" data-hashcod-rare-folder-inline="true">' . $rareBundle . '</script>'
    : '';
$rareExternal = $rareBundle === ''
    ? '<script defer src="' . $baseAttr . 'components/rare-folder-entry.bundle.js?v=20260919-perf1" data-hashcod-rare-folder="true"></script>'
    : '';

$registrationFlipTag = '';

$efrJsPath = __DIR__ . '/components/efr-code-editor.js';
$efrJs = is_file($efrJsPath) ? (string)file_get_contents($efrJsPath) : '';
if ($efrJs !== '') {
    $efrJs = str_ireplace('</script', '<\\/script', $efrJs);
}
$inlineEfrJs = $efrJs !== ''
    ? '<script id="hashcod-laragon-efr-code-editor-inline">' . $efrJs . '</script>'
    : '';
$efrExternalJs = $efrJs === ''
    ? '<script defer src="' . $baseAttr . 'components/efr-code-editor.js?v=20260919-perf2" data-hashcod-efr-code-editor="true"></script>'
    : '';

$bodyExtras = '<script defer src="' . $baseAttr . 'components/legacy-auth-retirement.js?v=20260918-2" data-hashcod-legacy-auth-retirement="true"></script>'
    . '<script defer src="' . $baseAttr . 'components/platform-entry-motion.js?v=20260926-nofreeze3" data-platform-entry-motion="true"></script>'
    . '<script defer src="' . $baseAttr . 'components/platform-entry-hold.js?v=20260926-second-screen1" data-platform-entry-hold="true"></script>'
    . '<script defer src="' . $baseAttr . 'components/platform-entry-freeze-fix.js?v=20260926-nofreeze4" data-hashcod-platform-entry-freeze-fix="true"></script>'
    . '<script id="hashcod-laragon-blackhole-cleanup">(function(){function clean(){var h=document.getElementById("bootCliHint");if(h){h.textContent="";h.hidden=true;h.setAttribute("aria-hidden","true");}var overlay=document.getElementById("bootCliOverlay");if(!overlay)return;overlay.querySelectorAll("[id*=blackhole i],[class*=blackhole i],[data-originkit-blackhole]").forEach(function(node){if(node.id==="hashcodRareFolderHost"||node.closest&&node.closest("#hashcodRareFolderHost"))return;try{node.remove();}catch(e){node.style.display="none";}});}function watch(){clean();var overlay=document.getElementById("bootCliOverlay");if(!overlay)return;var observer=new MutationObserver(function(){clean();});observer.observe(overlay,{childList:true,subtree:true});window.addEventListener("hashcod:platform-entered",function(){observer.disconnect();},{once:true});}if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",watch,{once:true});}else{watch();}})();</script>'
    . $rareInline
    . $rareExternal
    . '<script defer src="' . $baseAttr . 'components/platform-entry-slogan.js?v=20260919-perf1" data-platform-entry-slogan="true" data-hashcod-vector-tray="true"></script>'
    . $inlineEfrJs
    . $efrExternalJs
    . '<script defer src="' . $baseAttr . 'components/vector-link-board-reconcile.js?v=20260913-6" data-hashcod-link-reconcile="true"></script>'
    . '<script defer src="' . $baseAttr . 'components/toolbox-secure-ui-rescue.js?v=20260914-retired1" data-hashcod-toolbox-ui-rescue="true"></script>'
    . '<script defer src="' . $baseAttr . 'components/toolbox-secure-links.js?v=20260914-retired1" data-hashcod-toolbox-secure="true"></script>'
    . '<script defer src="' . $baseAttr . 'components/toolbox-signature-copy.js?v=20260914-retired1" data-hashcod-toolbox-signature-copy="true"></script>'
    . '<script defer src="' . $baseAttr . 'components/topbar-windows-hello.js?v=20260919-perf1" data-hashcod-topbar-windows-hello="true"></script>'
    . '<script defer src="' . $baseAttr . 'components/duo-page-transition.js?v=20260926-nofreeze3" data-hashcod-duo-transition="true"></script>'
    . '<script defer src="' . $baseAttr . 'components/platform-entry-capability-footer.js?v=20260919-perf1" data-hashcod-entry-capability-footer="true"></script>'
    . '<script defer src="' . $baseAttr . 'components/platform-entry-capability-footer-fix.js?v=20260926-noregform1" data-hashcod-entry-capability-footer-fix="true"></script>'
    . '<script defer src="' . $baseAttr . 'components/auth-tabs-rescue.js?v=20260919-perf1" data-hashcod-auth-tabs-rescue="true"></script>'
    . '<script defer src="' . $baseAttr . 'components/admin-codekey-picker-rescue.js?v=20260919-perf1" data-hashcod-codekey-picker-rescue="true"></script>'
    . '<script defer src="' . $baseAttr . 'components/percent-feature-button.js?v=20260914-1" data-hashcod-percent-feature="true"></script>'
    . '<script defer src="' . $baseAttr . 'components/platform-crm.js?v=20260927-platformcrm6" data-hashcod-platform-crm="true"></script>'

    . '<script defer src="' . $baseAttr . 'components/boot-brand-credit-relocate.js?v=20260919-perf1" data-hashcod-boot-brand-credit-relocate="true"></script>'
    . '<script defer src="' . $baseAttr . 'components/laragon-credit-align.js?v=20260914-local1" data-hashcod-laragon-credit-align="true"></script>';

$bodyPos = strripos($html, '</body>');
if ($bodyPos !== false) {
    $html = substr($html, 0, $bodyPos) . $bodyExtras . substr($html, $bodyPos);
} else {
    $html .= $bodyExtras;
}

header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate');
echo $html;