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

$efrCssPath = __DIR__ . '/components/efr-code-editor.css';
$efrCss = is_file($efrCssPath) ? (string)file_get_contents($efrCssPath) : '';
$inlineEfrCss = $efrCss !== ''
    ? '<style id="hashcod-laragon-efr-code-editor-inline">' . $efrCss . '</style>'
    : '';

$headExtras = '<base href="' . $baseAttr . '">'
    . '<style id="hashcod-legacy-auth-prehide">#authOverlay,#authWrapper,#hashcodVectorTray,#hashcodAuthUtilityDock,#groqAuthChatPanel,#groqAuthChatLauncher,#hashcodEftCodeKeyGate,#hashcodEfrHotzone,#cryptoCardValidationLauncherBtn,#d5LauncherBtn,[data-hashcod-auth-utility-dock]{display:none!important;visibility:hidden!important;pointer-events:none!important;}</style>'
    . '<script id="hashcod-legacy-auth-retired-flag">window.__hashcodLegacyAuthRetired=true;document.documentElement.dataset.hashcodLegacyAuthRetired="true";</script>'
    . '<script id="hashcod-registration-gate-preboot">(function(){window.__hashcodPlatformEntryHoldReady=false;document.documentElement.dataset.hashcodEntryGateReady="false";var queued=false;document.addEventListener("click",function(e){var b=e.target&&e.target.closest?e.target.closest("#bootCliEnter"):null;if(!b)return;if(window.__hashcodPlatformEntryHoldReady===true)return;e.preventDefault();e.stopPropagation();if(typeof e.stopImmediatePropagation==="function")e.stopImmediatePropagation();if(queued)return;queued=true;var old=b.textContent;b.setAttribute("aria-busy","true");b.textContent="PREPARANDO ACCESO";window.addEventListener("hashcod:entry-gate-ready",function(){queued=false;b.removeAttribute("aria-busy");if(b.textContent==="PREPARANDO ACCESO")b.textContent=old;window.setTimeout(function(){b.click();},0);},{once:true});},true);})();</script>'
    . '<style id="hashcod-platform-registration-prehide">#hashcodPlatformRegistration{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important;}html[data-hashcod-final-entry-screen="true"] #hashcodPlatformRegistration{display:block!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important;}</style>'
    . '<link rel="stylesheet" href="' . $baseAttr . 'components/platform-registration-form.css?v=20260918-6" data-hashcod-platform-registration-style="true">'
    . '<link rel="stylesheet" href="' . $baseAttr . 'components/toolbox-secure-links.css?v=20260914-retired1" data-hashcod-toolbox-secure-style="true">'
    . '<link rel="stylesheet" href="' . $baseAttr . 'components/admin-hello-button.css?v=20260914-sequence15" data-hashcod-boot-icons-style="true">'
    . '<link rel="stylesheet" href="' . $baseAttr . 'components/platform-entry-motion.css?v=20260918-1" data-hashcod-platform-entry-motion-style="true">'
    . '<link rel="stylesheet" href="' . $baseAttr . 'components/platform-entry-hold.css?v=20260918-1" data-hashcod-platform-entry-hold-style="true">'
    . '<link rel="stylesheet" href="' . $baseAttr . 'components/platform-entry-slogan.css?v=20260910-1" data-hashcod-vector-tray-style="true">'
    . '<link rel="stylesheet" href="' . $baseAttr . 'components/duo-page-transition.css?v=20260913-2" data-hashcod-duo-transition-style="true">'
    . '<link rel="stylesheet" href="' . $baseAttr . 'components/platform-entry-capability-footer.css?v=20260913-3" data-hashcod-entry-capability-footer-style="true">'
    . '<link rel="stylesheet" href="' . $baseAttr . 'components/boot-brand-credit-relocate.css?v=20260917-10" data-hashcod-boot-brand-credit-relocate-style="true">'
    . '<link rel="stylesheet" href="' . $baseAttr . 'components/percent-feature-button.css?v=20260914-1" data-hashcod-percent-feature-style="true">'
    . $inlineEfrCss
    . '<link rel="stylesheet" href="' . $baseAttr . 'components/efr-code-editor.css?v=20260915-3" data-hashcod-efr-code-editor-style="true">'
    . '<style id="hashcod-laragon-rare-folder-placement">'
    . '#hashcodRareFolderHost{position:fixed!important;left:38vw!important;top:50vh!important;z-index:2147482500!important;display:block!important;visibility:visible!important;opacity:1!important;overflow:visible!important;pointer-events:none!important;transform:translate(-50%,-50%) scale(1.20)!important;transform-origin:center center!important;}'
    . '#hashcodRareFolderHost [data-slot="folder"]{pointer-events:auto!important;}'
    . '#bootCliHint{display:none!important;visibility:hidden!important;}'
    . '.boot-cli-hint-wrap{min-width:0!important;}'
    // Local should show only the Rare UI folder. The retired Originkit blackhole
    // is canvas-based and can still be present inside 404.html, so suppress it.
    . '#bootCliOverlay canvas{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important;}'
    . '#bootCliOverlay [id*="blackhole" i],#bootCliOverlay [class*="blackhole" i],[data-originkit-blackhole]{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important;}'
    . '@media(max-width:1180px){#hashcodRareFolderHost{left:35vw!important;top:48vh!important;transform:translate(-50%,-50%) scale(1.12)!important;}}'
    . '@media(max-width:900px){#hashcodRareFolderHost{left:50vw!important;top:39vh!important;transform:translate(-50%,-50%) scale(1)!important;}}'
    . '@media(max-width:620px){#hashcodRareFolderHost{left:50vw!important;top:36vh!important;transform:translate(-50%,-50%) scale(.90)!important;}}'
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

$efrJsPath = __DIR__ . '/components/efr-code-editor.js';
$efrJs = is_file($efrJsPath) ? (string)file_get_contents($efrJsPath) : '';
if ($efrJs !== '') {
    $efrJs = str_ireplace('</script', '<\\/script', $efrJs);
}
$inlineEfrJs = $efrJs !== ''
    ? '<script id="hashcod-laragon-efr-code-editor-inline">' . $efrJs . '</script>'
    : '';

$bodyExtras = '<script defer src="' . $baseAttr . 'components/legacy-auth-retirement.js?v=20260918-2" data-hashcod-legacy-auth-retirement="true"></script>'
    . '<script defer src="' . $baseAttr . 'components/platform-entry-motion.js?v=20260918-1" data-platform-entry-motion="true"></script>'
    . '<script defer src="' . $baseAttr . 'components/platform-entry-hold.js?v=20260918-7" data-platform-entry-hold="true"></script>'
    . '<script defer src="' . $baseAttr . 'components/platform-registration-form.js?v=20260918-7" data-hashcod-platform-registration="true"></script>'

    . '<script id="hashcod-laragon-blackhole-cleanup">(function(){function clean(){var h=document.getElementById("bootCliHint");if(h){h.textContent="";h.hidden=true;h.setAttribute("aria-hidden","true");}var overlay=document.getElementById("bootCliOverlay");if(!overlay)return;overlay.querySelectorAll("canvas,[id*=blackhole i],[class*=blackhole i],[data-originkit-blackhole]").forEach(function(node){if(node.id==="hashcodRareFolderHost"||node.closest&&node.closest("#hashcodRareFolderHost"))return;try{node.remove();}catch(e){node.style.display="none";}});}function watch(){clean();var overlay=document.getElementById("bootCliOverlay");if(!overlay)return;var observer=new MutationObserver(function(){clean();});observer.observe(overlay,{childList:true,subtree:true});window.addEventListener("hashcod:platform-entered",function(){observer.disconnect();},{once:true});}if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",watch,{once:true});}else{watch();}})();</script>'
    . $rareInline
    . '<script defer src="' . $baseAttr . 'components/platform-entry-slogan.js?v=20260911-2" data-platform-entry-slogan="true" data-hashcod-vector-tray="true"></script>'
    . $inlineEfrJs
    . '<script defer src="' . $baseAttr . 'components/rare-folder-entry.bundle.js?v=20260914-local2" data-hashcod-rare-folder="true"></script>'
    . '<script defer src="' . $baseAttr . 'components/vector-link-board-reconcile.js?v=20260913-6" data-hashcod-link-reconcile="true"></script>'
    . '<script defer src="' . $baseAttr . 'components/toolbox-secure-ui-rescue.js?v=20260914-retired1" data-hashcod-toolbox-ui-rescue="true"></script>'
    . '<script defer src="' . $baseAttr . 'components/toolbox-secure-links.js?v=20260914-retired1" data-hashcod-toolbox-secure="true"></script>'
    . '<script defer src="' . $baseAttr . 'components/toolbox-signature-copy.js?v=20260914-retired1" data-hashcod-toolbox-signature-copy="true"></script>'
    . '<script defer src="' . $baseAttr . 'components/topbar-windows-hello.js?v=20260913-1" data-hashcod-topbar-windows-hello="true"></script>'
    . '<script defer src="' . $baseAttr . 'components/duo-page-transition.js?v=20260913-2" data-hashcod-duo-transition="true"></script>'
    . '<script defer src="' . $baseAttr . 'components/platform-entry-capability-footer.js?v=20260913-3" data-hashcod-entry-capability-footer="true"></script>'
    . '<script defer src="' . $baseAttr . 'components/platform-entry-capability-footer-fix.js?v=20260917-restore2" data-hashcod-entry-capability-footer-fix="true"></script>'
    . '<script defer src="' . $baseAttr . 'components/auth-tabs-rescue.js?v=20260913-3" data-hashcod-auth-tabs-rescue="true"></script>'
    . '<script defer src="' . $baseAttr . 'components/admin-codekey-picker-rescue.js?v=20260915-1" data-hashcod-codekey-picker-rescue="true"></script>'
    . '<script defer src="' . $baseAttr . 'components/percent-feature-button.js?v=20260914-1" data-hashcod-percent-feature="true"></script>'
    . '<script defer src="' . $baseAttr . 'components/efr-code-editor.js?v=20260915-3" data-hashcod-efr-code-editor="true"></script>'
    . '<script defer src="' . $baseAttr . 'components/boot-brand-credit-relocate.js?v=20260917-10" data-hashcod-boot-brand-credit-relocate="true"></script>'
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