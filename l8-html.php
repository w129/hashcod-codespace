<?php
/**
 * HTML serving helpers for l8 codespace (native PHP pages, not a Vite/React SPA).
 */

if (!function_exists('envValue')) {
    @require_once __DIR__ . '/supabase.php';
}

/**
 * Public URL base path ending with "/".
 * Root PHP/Render → "/". GitHub Pages project site → "/l8-codespace/".
 * Override with L8_PUBLIC_BASE (e.g. "/app").
 */
function l8_public_base_path() {
    static $cachedBase = null;
    if ($cachedBase !== null) {
        return $cachedBase;
    }

    $override = '';
    if (function_exists('envValue')) {
        $override = (string) envValue('L8_PUBLIC_BASE', '');
    } else {
        $override = (string) (getenv('L8_PUBLIC_BASE') ?: '');
    }
    $override = trim($override);
    if ($override !== '') {
        if ($override === '/') {
            $cachedBase = '/';
            return '/';
        }
        $cachedBase = '/' . trim($override, '/') . '/';
        return $cachedBase;
    }

    $host = strtolower((string) ($_SERVER['HTTP_HOST'] ?? ''));
    if ($host !== '' && strpos($host, 'github.io') !== false) {
        $cachedBase = '/l8-codespace/';
        return $cachedBase;
    }

    $cachedBase = '/';
    return '/';
}

/** Inicializa compresión de salida ligera (gzip/deflate) de forma segura. */
function l8_init_compression(): bool {
    if (headers_sent() || ob_get_level() > 0) {
        return false;
    }
    if (extension_loaded('zlib') && !ini_get('zlib.output_compression')) {
        return @ob_start('ob_gzhandler');
    }
    return @ob_start();
}

/** Emit Content-Type + cache headers for an HTML document response with micro-caching & ETag support. */
function l8_html_headers($ok = true, $cacheTtl = 0, $etag = null) {
    if (!headers_sent()) {
        http_response_code($ok ? 200 : 404);
        header('Content-Type: text/html; charset=utf-8');
        if ($cacheTtl > 0) {
            header('Cache-Control: public, max-age=' . (int)$cacheTtl . ', stale-while-revalidate=300');
        } else {
            header('Cache-Control: no-store, no-cache, must-revalidate');
        }
        header('X-L8-Serve: php-html');

        if ($etag !== null && $etag !== '') {
            $etag = '"' . trim($etag, '"') . '"';
            header('ETag: ' . $etag);
            header('Vary: Accept-Encoding');

            $ifNoneMatch = isset($_SERVER['HTTP_IF_NONE_MATCH']) ? trim($_SERVER['HTTP_IF_NONE_MATCH']) : '';
            if ($ifNoneMatch !== '' && ($ifNoneMatch === $etag || trim($ifNoneMatch, '"') === trim($etag, '"') || $ifNoneMatch === '*')) {
                http_response_code(304);
                while (ob_get_level()) {
                    ob_end_clean();
                }
                exit;
            }
        }
    }
}

/**
 * Apply the per-request CSP nonce to every script tag emitted by native PHP
 * pages, including dynamically injected compatibility scripts.
 */
function l8_apply_csp_nonce(string $html): string {
    if (!function_exists('securityCspNonce')) return $html;

    $nonce = htmlspecialchars((string) securityCspNonce(), ENT_QUOTES, 'UTF-8');
    if ($nonce === '' || $html === '') return $html;

    $length = strlen($html);
    $cursor = 0;
    $output = '';

    // Scan real HTML script elements instead of regex-replacing the whole
    // document. A global regex also matches text such as
    // const snippet = "<script data-demo='x'>";
    // inside JavaScript and can inject nonce="..." into that JS string,
    // causing production-only syntax errors when CSP is enabled.
    $findTagEnd = static function (string $source, int $start, int $sourceLength): ?int {
        $quote = null;
        for ($i = $start; $i < $sourceLength; $i++) {
            $ch = $source[$i];
            if ($quote !== null) {
                if ($ch === $quote) $quote = null;
                continue;
            }
            if ($ch === '"' || $ch === "'") {
                $quote = $ch;
                continue;
            }
            if ($ch === '>') return $i;
        }
        return null;
    };

    while ($cursor < $length) {
        $start = stripos($html, '<script', $cursor);
        if ($start === false) {
            $output .= substr($html, $cursor);
            break;
        }

        $boundaryPos = $start + 7;
        $boundary = $boundaryPos < $length ? $html[$boundaryPos] : '';
        if ($boundary !== '' && !ctype_space($boundary) && $boundary !== '>' && $boundary !== '/') {
            $output .= substr($html, $cursor, $boundaryPos - $cursor);
            $cursor = $boundaryPos;
            continue;
        }

        $output .= substr($html, $cursor, $start - $cursor);
        $tagEnd = $findTagEnd($html, $start, $length);
        if ($tagEnd === null) {
            $output .= substr($html, $start);
            break;
        }

        $openingTag = substr($html, $start, $tagEnd - $start + 1);
        if (!preg_match('/\\bnonce\\s*=/i', $openingTag)) {
            // "<script" is seven bytes in every supported casing.
            $openingTag = substr($openingTag, 0, 7)
                . ' nonce="' . $nonce . '"'
                . substr($openingTag, 7);
        }
        $output .= $openingTag;

        // HTML treats everything up to the matching closing script tag as raw
        // text. Skip that entire region so "<script ...>" strings inside JS are
        // never interpreted as HTML tags by this nonce injector.
        $contentStart = $tagEnd + 1;
        $closeStart = stripos($html, '</script', $contentStart);
        if ($closeStart === false) {
            $output .= substr($html, $contentStart);
            break;
        }

        $closeEnd = $findTagEnd($html, $closeStart, $length);
        if ($closeEnd === null) {
            $output .= substr($html, $contentStart);
            break;
        }

        $output .= substr($html, $contentStart, $closeEnd - $contentStart + 1);
        $cursor = $closeEnd + 1;
    }

    return $output;
}

/**
 * Require a PHP/HTML page file with HTML headers.
 * $file is a basename under the project root (e.g. "index.php", "gateway.php").
 */
function l8_entry_intro_cookie_name(): string {
    return 'hashcod_codespace_entry';
}

function l8_entry_intro_seen(): bool {
    return (string)($_COOKIE[l8_entry_intro_cookie_name()] ?? '') === '1';
}

function l8_entry_intro_cookie_options(int $expires = 0): array {
    $path = l8_public_base_path();
    $secure = (!empty($_SERVER['HTTPS']) && strtolower((string)$_SERVER['HTTPS']) !== 'off')
        || strtolower((string)($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '')) === 'https';
    return [
        'expires' => $expires,
        'path' => $path,
        'secure' => $secure,
        'httponly' => true,
        'samesite' => 'Lax',
    ];
}

function l8_entry_intro_commit(): void {
    setcookie(l8_entry_intro_cookie_name(), '1', l8_entry_intro_cookie_options(0));
}

function l8_entry_intro_consume(): bool {
    if (!l8_entry_intro_seen()) {
        return false;
    }
    $name = l8_entry_intro_cookie_name();
    setcookie($name, '', l8_entry_intro_cookie_options(time() - 3600));
    unset($_COOKIE[$name]);
    return true;
}

function l8_require_html_page($file, $ok = true, $cacheTtl = 0) {
    $file = basename((string) $file);
    $path = __DIR__ . '/' . $file;
    if (!is_file($path)) {
        l8_html_not_found_page();
    }

    // Show the welcome screen on every fresh index load/reload. Clicking Entrar
    // grants exactly one redirected platform render; that pass is consumed
    // immediately, so the next browser reload returns to the first screen.
    if ($file === 'index.php') {
        $enter = (string)($_GET['hashcod_enter'] ?? '');
        if ($enter === '1') {
            l8_entry_intro_commit();
            $redirectPath = parse_url((string)($_SERVER['REQUEST_URI'] ?? '/'), PHP_URL_PATH);
            if (!is_string($redirectPath) || $redirectPath === '') {
                $redirectPath = l8_public_base_path();
            }
            header('Cache-Control: no-store, no-cache, must-revalidate');
            header('Location: ' . $redirectPath, true, 303);
            exit;
        }

        $entryPass = l8_entry_intro_consume();
        if (!$entryPass) {
            require_once __DIR__ . '/mldsa-access.php';
            l8_init_compression();
            l8_html_headers(true, 0);
            echo mldsaGateHtml(l8_public_base_path(), true);
            exit;
        }
    }

    l8_init_compression();
    l8_html_headers($ok, $cacheTtl);

    // Buffer every native HTML page so CSP nonces can be injected consistently.
    ob_start();
    require $path;
    $html = (string) ob_get_clean();

    // The main platform needs fresh integration layers even when older
    // versioned assets are still cached as immutable by the browser/CDN.
    // Buffer only index.php and inject cache-busted assets dynamically.
    if ($file === 'index.php') {
        $base = htmlspecialchars(l8_public_base_path(), ENT_QUOTES, 'UTF-8');

        // index.php still contains a historical immutable query for this loader.
        // Rewrite it at response time so browsers receive the registration-aware loader.
        $html = str_replace(
            'components/admin-hello-button.js?v=20260912-1',
            'components/admin-hello-button.js?v=20260926-noregform1',
            $html
        );

        // index.php also contains an old immutable main-runtime query. Rewrite it
        // per response so entry fixes cannot be defeated by browser/CDN cache.
        $html = str_replace(
            'components/main-platform-runtime.js?v=20260921-folderonly1',
            'components/main-platform-runtime.js?v=20260926-nofreeze4',
            $html
        );

        // Install the PQC action bus before deferred platform scripts execute so
        // modules cannot capture an unprotected fetch reference during startup.
        $pqcActionRuntimePath = __DIR__ . '/components/pqc-action-runtime.js';
        $pqcActionRuntimeJs = is_file($pqcActionRuntimePath) ? (string) @file_get_contents($pqcActionRuntimePath) : '';
        if ($pqcActionRuntimeJs !== '') {
            $pqcActionRuntimeJs = str_ireplace('</script', '<\\/script', $pqcActionRuntimeJs);
        }
        $pqcActionPrebootTag = $pqcActionRuntimeJs !== ''
            ? '<script id="hashcod-pqc-action-preboot">' . $pqcActionRuntimeJs . '</script>'
            : '<script src="' . htmlspecialchars(l8_public_base_path(), ENT_QUOTES, 'UTF-8') . 'components/pqc-action-runtime.js?v=20260928-pqcactions1" data-hashcod-pqc-action-runtime="true"></script>';

        // Keep the normal stylesheet request, but also inline the same CSS as a
        // production-safe fallback. This prevents the secure Toolbox controls
        // from ever rendering as unstyled document flow if a stale CDN/static
        // asset response is served while the JS bundle has already updated.
        $secureCssPath = __DIR__ . '/components/toolbox-secure-links.css';
        $secureCss = is_file($secureCssPath) ? (string) @file_get_contents($secureCssPath) : '';
        $inlineCssTag = $secureCss !== ''
            ? '<style id="hashcod-toolbox-secure-inline">' . $secureCss . '</style>'
            : '';
        $secureCssExternalTag = $secureCss === ''
            ? '<link rel="stylesheet" href="' . $base . 'components/toolbox-secure-links.css?v=20260919-perf1" data-hashcod-toolbox-secure-style="true">'
            : '';

        // EFR editor is also inlined so a stale immutable static asset can never
        // keep an older non-opening modal implementation alive after deploy.
        $efrCssPath = __DIR__ . '/components/efr-code-editor.css';
        $efrCss = is_file($efrCssPath) ? (string) @file_get_contents($efrCssPath) : '';
        $inlineEfrCssTag = $efrCss !== ''
            ? '<style id="hashcod-efr-code-editor-inline">' . $efrCss . '</style>'
            : '';
        $efrCssExternalTag = $efrCss === ''
            ? '<link rel="stylesheet" href="' . $base . 'components/efr-code-editor.css?v=20260919-perf1" data-hashcod-efr-code-editor-style="true">'
            : '';

        // Registration UI is retired from the startup path. Keep no form CSS in
        // the main document: even hidden full-screen registration styles add
        // unnecessary parsing/layout work and can conflict with stale markup.
        $inlineRegistrationCssTag = '';
        $registrationCssExternalTag = '';

        // Platform CRM is inlined because the topbar is rebuilt dynamically and
        // stale immutable CSS previously collapsed its button into a thin line.
        $platformCrmCssPath = __DIR__ . '/components/platform-crm.css';
        $platformCrmCss = is_file($platformCrmCssPath) ? (string) @file_get_contents($platformCrmCssPath) : '';
        $inlinePlatformCrmCssTag = $platformCrmCss !== ''
            ? '<style id="hashcod-platform-crm-inline">' . $platformCrmCss . '</style>'
            : '';
        $platformCrmCssExternalTag = $platformCrmCss === ''
            ? '<link rel="stylesheet" href="' . $base . 'components/platform-crm.css?v=20260927-platformcrm6" data-hashcod-platform-crm-style="true">'
            : '';

        // Full-page loading skeleton is inlined so it remains available even when
        // network conditions delay the normal component/style requests.
        $platformSkeletonCssPath = __DIR__ . '/components/platform-loading-skeleton.css';
        $platformSkeletonCss = is_file($platformSkeletonCssPath) ? (string) @file_get_contents($platformSkeletonCssPath) : '';
        $platformSkeletonStyleTag = $platformSkeletonCss !== ''
            ? '<style id="hashcod-platform-loading-skeleton-inline">' . $platformSkeletonCss . '</style>'
            : '<link rel="stylesheet" href="' . $base . 'components/platform-loading-skeleton.css?v=20260928-skeleton1" data-hashcod-platform-loading-skeleton-style="true">';

        $cssTag = $platformSkeletonStyleTag
            . $inlineCssTag
            . $inlineEfrCssTag
            . $inlineRegistrationCssTag
            . $secureCssExternalTag
            . '<link rel="stylesheet" href="' . $base . 'components/admin-hello-button.css?v=20260914-sequence15" data-hashcod-boot-icons-style="true">'
            . '<link rel="stylesheet" href="' . $base . 'components/platform-entry-motion.css?v=20260918-1" data-hashcod-platform-entry-motion-style="true">'
            . '<link rel="stylesheet" href="' . $base . 'components/platform-entry-hold.css?v=20260926-second-screen1" data-hashcod-platform-entry-hold-style="true">'
            . '<link rel="stylesheet" href="' . $base . 'components/platform-entry-slogan.css?v=20260926-second-screen1" data-hashcod-platform-entry-slogan-style="true">'
            . '<link rel="stylesheet" href="' . $base . 'components/duo-page-transition.css?v=20260913-2" data-hashcod-duo-transition-style="true">'
            . '<link rel="stylesheet" href="' . $base . 'components/platform-entry-capability-footer.css?v=20260913-3" data-hashcod-entry-capability-footer-style="true">'
            . '<link rel="stylesheet" href="' . $base . 'components/boot-brand-credit-relocate.css?v=20260917-10" data-hashcod-boot-brand-credit-relocate-style="true">'
            . '<link rel="stylesheet" href="' . $base . 'components/percent-feature-button.css?v=20260914-1" data-hashcod-percent-feature-style="true">'
            . '<link rel="stylesheet" href="' . $base . 'components/page-mascot-panda.css?v=20260929-panda2" data-hashcod-page-mascot-style="true">'
            . '<link rel="stylesheet" href="' . $base . 'components/platform-branched-menu.css?v=20261003-branched1" data-hashcod-branched-menu-style="true">'
            . $inlinePlatformCrmCssTag
            . $platformCrmCssExternalTag
            . $efrCssExternalTag
            . $registrationCssExternalTag
            ;

        // Retire the current authentication window before first paint. The
        // backend/session code remains available for the replacement entry system.
        $legacyAuthPrehideTag = '<style id="hashcod-legacy-auth-prehide">#authOverlay,#authWrapper,#hashcodVectorTray,#hashcodAuthUtilityDock,#groqAuthChatPanel,#groqAuthChatLauncher,#hashcodEftCodeKeyGate,#hashcodEfrHotzone,#cryptoCardValidationLauncherBtn,#d5LauncherBtn,[data-hashcod-auth-utility-dock]{display:none!important;visibility:hidden!important;pointer-events:none!important;}</style>'
            . '<script id="hashcod-legacy-auth-retired-flag">window.__hashcodLegacyAuthRetired=true;document.documentElement.dataset.hashcodLegacyAuthRetired="true";</script>';

        // Retire the visible top-bar Windows Hello button and Security/PQC badge.
        // Keep the underlying admin/security runtimes active, but fail closed at
        // first paint so stale cached JS cannot flash these controls back into UI.
        $retiredTopbarControlsStyleTag = '<style id="hashcod-retired-topbar-controls">'
            . '#secStatusBarBadge,#topBarWindowsHelloBtn,#hashcodPublicChatButton,#hashcodPublicChatPanel{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important;width:0!important;min-width:0!important;max-width:0!important;height:0!important;min-height:0!important;max-height:0!important;margin:0!important;padding:0!important;border:0!important;overflow:hidden!important;}'
            . '</style>';

        // Stale cached markup from the retired registration flow must stay inert.
        $registrationPrehideTag = '<style id="hashcod-platform-registration-prehide">'
            . '#hashcodPlatformRegistration,#hashcodDirectRegistration,.hashcod-registration-shell,.hashcod-registration-overlay,.hc-reg-card{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important;}'
            . '</style>';

        $registrationRetirementGuardTag = '<script id="hashcod-registration-retirement-guard">(function(){window.__hashcodRegistrationDisabled=true;var blocked=["platform-registration-form","registration-flip","entry-registration-force","hashcod-registration-glass-theme","hashcod-registration-pixel-bg","hashcod-registration-heroui"];function blockedAsset(n){var u=((n&&n.getAttribute&&(n.getAttribute("src")||n.getAttribute("href")))||"").toLowerCase();return blocked.some(function(x){return u.indexOf(x)>=0;});}function clean(){document.documentElement.dataset.hashcodRegistrationRetired="true";document.documentElement.dataset.hashcodFinalEntryScreen="false";document.querySelectorAll("#hashcodPlatformRegistration,#hashcodDirectRegistration,.hashcod-registration-shell,.hashcod-registration-overlay,.hc-reg-card").forEach(function(n){try{n.remove();}catch(_){}});document.querySelectorAll("script[src],link[href]").forEach(function(n){if(blockedAsset(n)){try{n.remove();}catch(_){}}});}clean();if(document.head&&typeof MutationObserver==="function"){var o=new MutationObserver(function(records){records.forEach(function(r){Array.from(r.addedNodes||[]).forEach(function(n){if(!n||n.nodeType!==1)return;if(blockedAsset(n)){try{n.remove();}catch(_){}}});});});o.observe(document.head,{childList:true});window.addEventListener("hashcod:platform-entered",function(){clean();setTimeout(function(){o.disconnect();},1500);},{once:true});setTimeout(function(){clean();o.disconnect();},10000);}})();</script>';

        $registrationGatePrebootTag = '<script id="hashcod-registration-gate-preboot">(function(){var root=document.documentElement;window.__hashcodPlatformEntryHoldReady=true;root.dataset.hashcodEntryGateReady="true";root.dataset.hashcodRegistrationRetired="true";var entered=false;var opening=false;function emit(name,detail){try{window.dispatchEvent(new CustomEvent(name,{detail:detail||{}}));}catch(_){}}function finalEnter(event){if(entered)return true;entered=true;if(event){event.preventDefault();event.stopPropagation();if(typeof event.stopImmediatePropagation==="function")event.stopImmediatePropagation();}try{if(document.getAnimations)document.getAnimations().forEach(function(a){try{a.cancel();}catch(_){}});}catch(_){}root.classList.remove("boot-locked","auth-locked","hashcod-duo-transitioning","hashcod-duo-arrival-pending");root.classList.add("hashcod-platform-entered");root.dataset.hashcodPlatformEntered="true";root.dataset.hashcodEntryGateReady="true";root.dataset.hashcodFinalEntryScreen="false";if(root.dataset)delete root.dataset.hashcodDuoBusy;var body=document.body;if(body){body.classList.remove("boot-locked","auth-locked");body.classList.add("hashcod-platform-entered");body.removeAttribute("data-auth-locked");body.removeAttribute("aria-busy");}["hashcodEntryTransition","hashcodDuoShade","hashcodDuoHinge"].forEach(function(id){var n=document.getElementById(id);if(n&&n.parentNode){try{n.parentNode.removeChild(n);}catch(_){}}});var boot=document.getElementById("bootCliOverlay");if(boot){boot.classList.add("hidden");boot.hidden=true;boot.setAttribute("aria-hidden","true");boot.style.setProperty("display","none","important");boot.style.setProperty("visibility","hidden","important");boot.style.setProperty("pointer-events","none","important");}try{sessionStorage.setItem("l8_boot_cli_done","1");}catch(_){}var notify=function(){emit("hashcod:platform-entered",{source:"second-entry-screen",direct:true,registration:false});emit("hashcod:platform-entry-complete",{source:"second-entry-screen",direct:true,registration:false});};if(typeof requestAnimationFrame==="function"){requestAnimationFrame(function(){setTimeout(notify,0);});}else{setTimeout(notify,0);}return true;}function openSecond(event){if(event){event.preventDefault();event.stopPropagation();if(typeof event.stopImmediatePropagation==="function")event.stopImmediatePropagation();}if(entered)return true;if(opening&&document.getElementById("hashcodEntryHold"))return true;opening=true;var tries=0;function attempt(){tries++;var hold=window.HashcodPlatformEntryHold;if(hold&&typeof hold.open==="function"){opening=false;return hold.open();}if(tries<40){return setTimeout(attempt,50);}opening=false;return finalEnter();}attempt();return true;}document.addEventListener("click",function(e){var b=e.target&&e.target.closest?e.target.closest("#bootCliEnter"):null;if(!b)return;openSecond(e);},true);document.addEventListener("keydown",function(e){if(e.key!=="Enter"&&e.key!=="Escape")return;var boot=document.getElementById("bootCliOverlay");if(!boot||boot.hidden||boot.classList.contains("hidden"))return;openSecond(e);},true);window.HashcodInlineDirectEntry={enter:finalEnter,openSecond:openSecond,version:"20260926-second-screen-restored1"};})();</script>';

        // The retired authentication slot is now occupied by the adult
        // platform-registration form. Its component stays hidden until the
        // authoritative third-screen marker is set by platform-entry-hold.js.

        // If the previous page closed with Duo, mark this page before first paint
        // so it can open from the closed state without flashing the normal page.
        $duoPrebootTag = '<script id="hashcod-duo-preboot">try{if(sessionStorage.getItem("hashcod_duo_open_pending_v1")==="1"){document.documentElement.classList.add("hashcod-duo-arrival-pending");}}catch(e){}</script>';

        // Prevent the obsolete full-screen startup animation from racing the
        // Rare UI folder. This runs before deferred entry scripts.
        $rareFolderPrebootTag = '<script id="hashcod-rare-folder-preboot">try{sessionStorage.setItem("hashcod_platform_intro_seen_v1","1");}catch(e){};</script>';

        // Production placement override for the real Rare UI React/Motion folder.
        // Keep it in the requested left-side blank area, vertically aligned with
        // the Hashcod mark, and above all existing boot surfaces. Scale it up on
        // desktop for better visual balance while keeping responsive reductions.
        // The old "Loading blackhole…" label belongs to the retired Originkit
        // startup visual, so hide it immediately while retaining the intentional
        // GitHub/DIKTATCART credit marks beside it.
        $rareFolderPlacementTag = '<style id="hashcod-rare-folder-placement">'
            . '#hashcodRareFolderHost{position:fixed!important;left:38vw!important;top:50vh!important;z-index:2147482500!important;display:block!important;visibility:visible!important;opacity:1!important;overflow:visible!important;pointer-events:none!important;transform:translate(-50%,-50%) scale(1.20)!important;transform-origin:center center!important;}'
            . '#hashcodRareFolderHost [data-slot="folder"]{pointer-events:auto!important;}'
            . '#bootCliHint{display:none!important;visibility:hidden!important;}'
            . '#bootBlackholeCanvas,#bootCliOverlay canvas{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important;}'
            . '#bootCliOverlay [id*="blackhole" i],#bootCliOverlay [class*="blackhole" i],[data-originkit-blackhole]{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important;}'
            . '.boot-cli-hint-wrap{min-width:0!important;}'
            . '@media(max-width:1180px){#hashcodRareFolderHost{left:35vw!important;top:48vh!important;transform:translate(-50%,-50%) scale(1.12)!important;}}'
            . '@media(max-width:900px){#hashcodRareFolderHost{left:50vw!important;top:39vh!important;transform:translate(-50%,-50%) scale(1.00)!important;}}'
            . '@media(max-width:620px){#hashcodRareFolderHost{left:50vw!important;top:36vh!important;transform:translate(-50%,-50%) scale(0.90)!important;}}'
            . '</style>';

        $headPos = strripos($html, '</head>');
        if ($headPos !== false) {
            $html = substr($html, 0, $headPos) . $cssTag . $pqcActionPrebootTag . $legacyAuthPrehideTag . $retiredTopbarControlsStyleTag . $registrationPrehideTag . $registrationRetirementGuardTag . $registrationGatePrebootTag . $duoPrebootTag . $rareFolderPrebootTag . $rareFolderPlacementTag . substr($html, $headPos);
        } else {
            $html = $cssTag . $pqcActionPrebootTag . $legacyAuthPrehideTag . $retiredTopbarControlsStyleTag . $registrationPrehideTag . $registrationGatePrebootTag . $duoPrebootTag . $rareFolderPrebootTag . $rareFolderPlacementTag . $html;
        }

        $platformSkeletonMarkup = '<div id="hashcodPlatformSkeleton" hidden aria-hidden="true">'
            . '<div class="hashcod-platform-skeleton-shell">'
            . '<div class="hashcod-platform-skeleton-topbar">'
            . '<span class="hashcod-platform-skeleton-logo hashcod-platform-skeleton-pulse"></span>'
            . '<span class="hashcod-platform-skeleton-brand hashcod-platform-skeleton-pulse"></span>'
            . '<div class="hashcod-platform-skeleton-top-actions">'
            . '<span class="hashcod-platform-skeleton-chip hashcod-platform-skeleton-pulse"></span>'
            . '<span class="hashcod-platform-skeleton-chip hashcod-platform-skeleton-pulse"></span>'
            . '<span class="hashcod-platform-skeleton-chip short hashcod-platform-skeleton-pulse"></span>'
            . '</div></div>'
            . '<div class="hashcod-platform-skeleton-main">'
            . '<section class="hashcod-platform-skeleton-workspace">'
            . '<div class="hashcod-platform-skeleton-workspace-head"><span class="hashcod-platform-skeleton-title hashcod-platform-skeleton-pulse"></span><span class="hashcod-platform-skeleton-small-line hashcod-platform-skeleton-pulse"></span></div>'
            . '<div class="hashcod-platform-skeleton-canvas hashcod-platform-skeleton-pulse"><span class="hashcod-platform-skeleton-folder hashcod-platform-skeleton-pulse"></span></div>'
            . '</section>'
            . '<aside class="hashcod-platform-skeleton-sidebar">'
            . '<div class="hashcod-platform-skeleton-panel"><div class="hashcod-platform-skeleton-panel-line hashcod-platform-skeleton-pulse"></div><div class="hashcod-platform-skeleton-panel-line hashcod-platform-skeleton-pulse"></div><div class="hashcod-platform-skeleton-panel-line hashcod-platform-skeleton-pulse"></div></div>'
            . '<div class="hashcod-platform-skeleton-panel"><div class="hashcod-platform-skeleton-panel-line hashcod-platform-skeleton-pulse"></div><div class="hashcod-platform-skeleton-tools">'
            . str_repeat('<span class="hashcod-platform-skeleton-tool hashcod-platform-skeleton-pulse"></span>', 8)
            . '</div></div></aside></div>'
            . '<div class="hashcod-platform-skeleton-bottom">'
            . str_repeat('<div class="hashcod-platform-skeleton-mini"><div class="hashcod-platform-skeleton-panel-line hashcod-platform-skeleton-pulse"></div><div class="hashcod-platform-skeleton-panel-line hashcod-platform-skeleton-pulse"></div></div>', 4)
            . '</div></div>'
            . '<span class="hashcod-platform-skeleton-status" role="status" aria-live="polite">Cargando Hashcod Codespace…</span>'
            . '</div>';

        if (preg_match('/<body\\b[^>]*>/i', $html, $bodyOpen, PREG_OFFSET_CAPTURE)) {
            $bodyOpenText = (string) $bodyOpen[0][0];
            $bodyOpenOffset = (int) $bodyOpen[0][1];
            $bodyInsertAt = $bodyOpenOffset + strlen($bodyOpenText);
            $html = substr($html, 0, $bodyInsertAt) . $platformSkeletonMarkup . substr($html, $bodyInsertAt);
        }

        // Rescue layer is injected inline as well as loaded as a versioned asset.
        $rescueJsPath = __DIR__ . '/components/toolbox-secure-ui-rescue.js';
        $rescueJs = is_file($rescueJsPath) ? (string) @file_get_contents($rescueJsPath) : '';
        $inlineRescueTag = $rescueJs !== ''
            ? '<script id="hashcod-toolbox-ui-rescue-inline">' . $rescueJs . '</script>'
            : '';
        $rescueExternalTag = $rescueJs === ''
            ? '<script defer src="' . $base . 'components/toolbox-secure-ui-rescue.js?v=20260919-perf1" data-hashcod-toolbox-ui-rescue="true"></script>'
            : '';

        // Toolbox 1 is intentionally empty. Keep the 4x4 circles and visual
        // geometry, but remove every tool icon, label and legacy click action.
        // Inline the cleanup so stale cached toolbox runtimes cannot restore
        // retired tools after this response is rendered.
        $toolboxOneEmptyJsPath = __DIR__ . '/components/toolbox-one-empty.js';
        $toolboxOneEmptyJs = is_file($toolboxOneEmptyJsPath) ? (string) @file_get_contents($toolboxOneEmptyJsPath) : '';
        if ($toolboxOneEmptyJs !== '') {
            $toolboxOneEmptyJs = str_ireplace('</script', '<\\/script', $toolboxOneEmptyJs);
        }
        $inlineToolboxOneEmptyTag = $toolboxOneEmptyJs !== ''
            ? '<script id="hashcod-toolbox-one-empty-inline">' . $toolboxOneEmptyJs . '</script>'
            : '';
        $toolboxOneEmptyExternalTag = $toolboxOneEmptyJs === ''
            ? '<script defer src="' . $base . 'components/toolbox-one-empty.js?v=20260920-empty1" data-hashcod-toolbox-one-empty="true"></script>'
            : '';

        // Inline the EFR editor too. Its global idempotency guard means the
        // external fallback can safely load afterward without mounting twice.
        $efrJsPath = __DIR__ . '/components/efr-code-editor.js';
        $efrJs = is_file($efrJsPath) ? (string) @file_get_contents($efrJsPath) : '';
        if ($efrJs !== '') {
            $efrJs = str_ireplace('</script', '<\\/script', $efrJs);
        }
        $inlineEfrJsTag = $efrJs !== ''
            ? '<script id="hashcod-efr-code-editor-inline">' . $efrJs . '</script>'
            : '';
        $efrExternalJsTag = $efrJs === ''
            ? '<script defer src="' . $base . 'components/efr-code-editor.js?v=20260919-perf2" data-hashcod-efr-code-editor="true"></script>'
            : '';

        // Registration runtime and its React/Motion submit island are retired.
        // Do not inline or request them during platform startup.
        $inlineRegistrationJsTag = '';
        $registrationExternalJsTag = '';
        $registrationFlipTag = '';

        // The Docker build generates this local bundle from the exact Rare UI
        // React/Motion implementation. Inline the built artifact so the folder
        // cannot disappear because of static-asset routing, CDN cache, or an
        // external-script request failure. Keep a versioned external fallback;
        // the bundle is idempotent and will not mount a second host.
        $rareFolderBundlePath = __DIR__ . '/components/rare-folder-entry.bundle.js';
        $rareFolderBundle = is_file($rareFolderBundlePath) ? (string) @file_get_contents($rareFolderBundlePath) : '';
        if ($rareFolderBundle !== '') {
            $rareFolderBundle = str_ireplace('</script', '<\\/script', $rareFolderBundle);
        }
        $rareFolderInlineTag = $rareFolderBundle !== ''
            ? '<script id="hashcod-rare-folder-inline" data-hashcod-rare-folder-inline="true">' . $rareFolderBundle . '</script>'
            : '';
        $rareFolderExternalTag = $rareFolderBundle === ''
            ? '<script defer src="' . $base . 'components/rare-folder-entry.bundle.js?v=20260919-perf1" data-hashcod-rare-folder="true"></script>'
            : '';

        // Remove retired top-bar controls even if an older immutable/static JS
        // asset was served from browser/CDN cache after the page started.
        $retiredTopbarControlsCleanupTag = '<script id="hashcod-retired-topbar-controls-cleanup">(function(){'
            . 'function clean(){["secStatusBarBadge","topBarWindowsHelloBtn","hashcodPublicChatButton","hashcodPublicChatPanel"].forEach(function(id){var n=document.getElementById(id);if(n&&n.parentNode)n.parentNode.removeChild(n);});document.querySelectorAll("script[data-hashcod-public-chat],link[data-hashcod-public-chat-style]").forEach(function(n){if(n&&n.parentNode)n.parentNode.removeChild(n);});}'
            . 'function boot(){clean();var root=document.querySelector(".top-bar-right")||document.body;if(!root||typeof MutationObserver!=="function")return;var o=new MutationObserver(clean);o.observe(root,{childList:true,subtree:true});window.setTimeout(function(){clean();o.disconnect();},15000);}'
            . 'if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",boot,{once:true});}else{boot();}'
            . 'window.addEventListener("hashcod:platform-entered",clean);'
            . '})();</script>';

        // Remove the stale blackhole status from the DOM as well as hiding it.
        // This prevents older boot scripts from leaving misleading loading text
        // visible to assistive technology while the Rare UI folder is authoritative.
        $legacyBlackholeCleanupTag = '<script id="hashcod-legacy-blackhole-cleanup">(function(){function cleanup(){var hint=document.getElementById("bootCliHint");if(hint){hint.textContent="";hint.hidden=true;hint.setAttribute("aria-hidden","true");}var canvas=document.getElementById("bootBlackholeCanvas");if(canvas){canvas.hidden=true;canvas.setAttribute("aria-hidden","true");canvas.style.display="none";try{canvas.width=1;canvas.height=1;}catch(e){}}}if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",cleanup,{once:true});}else{cleanup();}window.addEventListener("hashcod:platform-entered",cleanup);})();</script>';

        $deskcommCrmRaw = function_exists('secretGet')
            ? (string) secretGet('DESKCOMM_CRM_URL', '')
            : (function_exists('envValue') ? (string) envValue('DESKCOMM_CRM_URL', '') : '');
        $deskcommCrmUrl = '';
        if ($deskcommCrmRaw !== '') {
            $deskcommParts = @parse_url(trim($deskcommCrmRaw));
            $deskcommScheme = strtolower((string)($deskcommParts['scheme'] ?? ''));
            $deskcommHost = (string)($deskcommParts['host'] ?? '');
            if (in_array($deskcommScheme, ['http', 'https'], true) && $deskcommHost !== '') {
                $deskcommCrmUrl = trim($deskcommCrmRaw);
            }
        }
        $deskcommCrmConfigTag = '<script id="hashcod-deskcomm-crm-config">window.HASHCOD_DESKCOMM_CRM_URL='
            . json_encode($deskcommCrmUrl, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)
            . ';</script>';

        // Inline the CRM runtime too. This is the authoritative copy for the
        // topbar control; the external file is only a fallback if the source is
        // unexpectedly absent from the deployment image.
        $platformCrmJsPath = __DIR__ . '/components/platform-crm.js';
        $platformCrmJs = is_file($platformCrmJsPath) ? (string) @file_get_contents($platformCrmJsPath) : '';
        if ($platformCrmJs !== '') {
            $platformCrmJs = str_ireplace('</script', '<\/script', $platformCrmJs);
        }
        $inlinePlatformCrmJsTag = $platformCrmJs !== ''
            ? '<script id="hashcod-platform-crm-inline" data-hashcod-platform-crm-inline="true">' . $platformCrmJs . '</script>'
            : '';
        $platformCrmJsExternalTag = $platformCrmJs === ''
            ? '<script defer src="' . $base . 'components/platform-crm.js?v=20260927-platformcrm6" data-hashcod-platform-crm="true"></script>'
            : '';

        $platformSkeletonJsPath = __DIR__ . '/components/platform-loading-skeleton.js';
        $platformSkeletonJs = is_file($platformSkeletonJsPath) ? (string) @file_get_contents($platformSkeletonJsPath) : '';
        if ($platformSkeletonJs !== '') {
            $platformSkeletonJs = str_ireplace('</script', '<\\/script', $platformSkeletonJs);
        }
        $platformSkeletonRuntimeTag = $platformSkeletonJs !== ''
            ? '<script id="hashcod-platform-loading-skeleton-runtime">' . $platformSkeletonJs . '</script>'
            : '<script defer src="' . $base . 'components/platform-loading-skeleton.js?v=20260928-skeleton1" data-hashcod-platform-loading-skeleton="true"></script>';

        $tag = $platformSkeletonRuntimeTag
            . $retiredTopbarControlsCleanupTag
            . $legacyBlackholeCleanupTag
            . $deskcommCrmConfigTag
            . $inlinePlatformCrmJsTag
            . $platformCrmJsExternalTag
            . '<script defer src="' . $base . 'components/legacy-auth-retirement.js?v=20260918-2" data-hashcod-legacy-auth-retirement="true"></script>'
            . '<script defer src="' . $base . 'components/platform-entry-motion.js?v=20260926-nofreeze3" data-platform-entry-motion="true"></script>'
            . '<script defer src="' . $base . 'components/platform-entry-hold.js?v=20260926-second-screen1" data-platform-entry-hold="true"></script>'
            . '<script defer src="' . $base . 'components/platform-entry-freeze-fix.js?v=20260926-nofreeze4" data-hashcod-platform-entry-freeze-fix="true"></script>'
            . $rareFolderInlineTag
            . $rareFolderExternalTag
            . $inlineRescueTag
            . $inlineToolboxOneEmptyTag
            . $toolboxOneEmptyExternalTag
            . $inlineEfrJsTag
            . '<script defer src="' . $base . 'components/vector-link-board-reconcile.js?v=20260913-6" data-hashcod-link-reconcile="true"></script>'
            . '<script defer src="' . $base . 'components/toolbox-secure-links.js?v=20260913-4" data-hashcod-toolbox-secure="true"></script>'
            . '<script defer src="' . $base . 'components/toolbox-signature-copy.js?v=20260913-2" data-hashcod-toolbox-signature-copy="true"></script>'
            . $rescueExternalTag
            . '<script defer src="' . $base . 'components/topbar-windows-hello.js?v=20260919-perf1" data-hashcod-topbar-windows-hello="true"></script>'
            . '<script defer src="' . $base . 'components/duo-page-transition.js?v=20260926-nofreeze3" data-hashcod-duo-transition="true"></script>'
            . '<script defer src="' . $base . 'components/platform-entry-capability-footer.js?v=20260919-perf1" data-hashcod-entry-capability-footer="true"></script>'
            . '<script defer src="' . $base . 'components/platform-entry-capability-footer-fix.js?v=20260926-noregform1" data-hashcod-entry-capability-footer-fix="true"></script>'
            . '<script defer src="' . $base . 'components/device-usage-tracker.js?v=20260928-deviceusage1" data-hashcod-device-usage-tracker="true"></script>'
            . '<script defer src="' . $base . 'components/page-mascot-panda.js?v=20260929-panda2" data-hashcod-page-mascot="true"></script>'
            . '<script defer src="' . $base . 'components/platform-branched-menu.js?v=20261003-branched1" data-hashcod-branched-menu="true"></script>'
            . '<script defer src="' . $base . 'components/auth-tabs-rescue.js?v=20260919-perf1" data-hashcod-auth-tabs-rescue="true"></script>'
            . '<script defer src="' . $base . 'components/admin-codekey-picker-rescue.js?v=20260919-perf1" data-hashcod-codekey-picker-rescue="true"></script>'
            . '<script defer src="' . $base . 'components/percent-feature-button.js?v=20260914-1" data-hashcod-percent-feature="true"></script>'
            . $efrExternalJsTag
            . '<script defer src="' . $base . 'components/boot-brand-credit-relocate.js?v=20260919-perf1" data-hashcod-boot-brand-credit-relocate="true"></script>'
            . '<script defer src="' . $base . 'components/boot-local-download-layout-fix.js?v=20260919-perf1" data-hashcod-local-download-layout-fix="true"></script>'
            ;
        $bodyPos = strripos($html, '</body>');
        if ($bodyPos !== false) {
            $html = substr($html, 0, $bodyPos) . $tag . substr($html, $bodyPos);
        } else {
            $html .= $tag;
        }
    }

    if ($file !== 'index.php') {
        $pqcBase = htmlspecialchars(l8_public_base_path(), ENT_QUOTES, 'UTF-8');
        $pqcRuntimePath = __DIR__ . '/components/pqc-action-runtime.js';
        $pqcRuntimeJs = is_file($pqcRuntimePath) ? (string) @file_get_contents($pqcRuntimePath) : '';
        if ($pqcRuntimeJs !== '') $pqcRuntimeJs = str_ireplace('</script', '<\\/script', $pqcRuntimeJs);
        $pqcRuntimeTag = $pqcRuntimeJs !== ''
            ? '<script id="hashcod-pqc-action-preboot">' . $pqcRuntimeJs . '</script>'
            : '<script src="' . $pqcBase . 'components/pqc-action-runtime.js?v=20260928-pqcactions1" data-hashcod-pqc-action-runtime="true"></script>';
        $pqcHeadPos = strripos($html, '</head>');
        if ($pqcHeadPos !== false) {
            $html = substr($html, 0, $pqcHeadPos) . $pqcRuntimeTag . substr($html, $pqcHeadPos);
        } else {
            $html = $pqcRuntimeTag . $html;
        }
    }

    echo l8_apply_csp_nonce($html);
    exit;
}

/**
 * Friendly HTML document for unknown routes (never empty view-source, never Vite shell).
 * Used only when we intentionally return 404; preferred soft-landing is the main platform HTML.
 */
function l8_html_not_found_page() {
    l8_html_headers(false);
    $base = htmlspecialchars(l8_public_base_path(), ENT_QUOTES, 'UTF-8');
    echo '<!DOCTYPE html>' . "\n";
    echo '<html lang="es"><head><meta charset="UTF-8">' .
        '<meta name="viewport" content="width=device-width, initial-scale=1">' .
        '<title>l8 codespace</title>' .
        '<base href="' . $base . '">' .
        '<link rel="icon" href="favicon.svg?v=3" type="image/svg+xml">' .
        '<style>body{font-family:IBM Plex Sans,Segoe UI,sans-serif;margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#fff;color:#111}' .
        '.box{max-width:28rem;padding:2rem;text-align:center}h1{font-size:1.25rem;margin:0 0 .5rem}p{color:#666;margin:0 0 1.25rem;line-height:1.45}' .
        'a{color:#0b3d2e;font-weight:600;text-decoration:none}a:hover{text-decoration:underline}</style>' .
        '</head><body><div class="box">' .
        '<h1>l8 codespace</h1>' .
        '<p>Esta ruta no existe en la plataforma. Vuelve al inicio HTML nativo (PHP), no a un shell vacío de Vite/React.</p>' .
        '<p><a href="' . $base . '">Abrir plataforma</a></p>' .
        '</div></body></html>';
    exit;
}