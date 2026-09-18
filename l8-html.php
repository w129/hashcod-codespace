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
function l8_require_html_page($file, $ok = true, $cacheTtl = 0) {
    $file = basename((string) $file);
    $path = __DIR__ . '/' . $file;
    if (!is_file($path)) {
        l8_html_not_found_page();
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
            'components/admin-hello-button.js?v=20260918-registration3',
            $html
        );

        // Keep the normal stylesheet request, but also inline the same CSS as a
        // production-safe fallback. This prevents the secure Toolbox controls
        // from ever rendering as unstyled document flow if a stale CDN/static
        // asset response is served while the JS bundle has already updated.
        $secureCssPath = __DIR__ . '/components/toolbox-secure-links.css';
        $secureCss = is_file($secureCssPath) ? (string) @file_get_contents($secureCssPath) : '';
        $inlineCssTag = $secureCss !== ''
            ? '<style id="hashcod-toolbox-secure-inline">' . $secureCss . '</style>'
            : '';

        // EFR editor is also inlined so a stale immutable static asset can never
        // keep an older non-opening modal implementation alive after deploy.
        $efrCssPath = __DIR__ . '/components/efr-code-editor.css';
        $efrCss = is_file($efrCssPath) ? (string) @file_get_contents($efrCssPath) : '';
        $inlineEfrCssTag = $efrCss !== ''
            ? '<style id="hashcod-efr-code-editor-inline">' . $efrCss . '</style>'
            : '';

        // Inline the registration CSS as a fail-closed layer. If the versioned
        // stylesheet is unavailable or stale, Screen 3 must still cover Codespace.
        $registrationCssPath = __DIR__ . '/components/platform-registration-form.css';
        $registrationCss = is_file($registrationCssPath) ? (string) @file_get_contents($registrationCssPath) : '';
        $inlineRegistrationCssTag = $registrationCss !== ''
            ? '<style id="hashcod-platform-registration-inline">' . $registrationCss . '</style>'
            : '';

        $cssTag = $inlineCssTag
            . $inlineEfrCssTag
            . $inlineRegistrationCssTag
            . '<link rel="stylesheet" href="' . $base . 'components/toolbox-secure-links.css?v=20260913-3" data-hashcod-toolbox-secure-style="true">'
            . '<link rel="stylesheet" href="' . $base . 'components/admin-hello-button.css?v=20260914-sequence15" data-hashcod-boot-icons-style="true">'
            . '<link rel="stylesheet" href="' . $base . 'components/platform-entry-motion.css?v=20260918-1" data-hashcod-platform-entry-motion-style="true">'
            . '<link rel="stylesheet" href="' . $base . 'components/platform-entry-hold.css?v=20260918-1" data-hashcod-platform-entry-hold-style="true">'
            . '<link rel="stylesheet" href="' . $base . 'components/duo-page-transition.css?v=20260913-2" data-hashcod-duo-transition-style="true">'
            . '<link rel="stylesheet" href="' . $base . 'components/platform-entry-capability-footer.css?v=20260913-3" data-hashcod-entry-capability-footer-style="true">'
            . '<link rel="stylesheet" href="' . $base . 'components/boot-brand-credit-relocate.css?v=20260917-10" data-hashcod-boot-brand-credit-relocate-style="true">'
            . '<link rel="stylesheet" href="' . $base . 'components/percent-feature-button.css?v=20260914-1" data-hashcod-percent-feature-style="true">'
            . '<link rel="stylesheet" href="' . $base . 'components/efr-code-editor.css?v=20260915-3" data-hashcod-efr-code-editor-style="true">'
            . '<link rel="stylesheet" href="' . $base . 'components/platform-registration-form.css?v=20260918-7" data-hashcod-platform-registration-style="true">';

        // Retire the current authentication window before first paint. The
        // backend/session code remains available for the replacement entry system.
        $legacyAuthPrehideTag = '<style id="hashcod-legacy-auth-prehide">#authOverlay,#authWrapper,#hashcodVectorTray,#hashcodAuthUtilityDock,#groqAuthChatPanel,#groqAuthChatLauncher,#hashcodEftCodeKeyGate,#hashcodEfrHotzone,#cryptoCardValidationLauncherBtn,#d5LauncherBtn,[data-hashcod-auth-utility-dock]{display:none!important;visibility:hidden!important;pointer-events:none!important;}</style>'
            . '<script id="hashcod-legacy-auth-retired-flag">window.__hashcodLegacyAuthRetired=true;document.documentElement.dataset.hashcodLegacyAuthRetired="true";</script>';

        // Critical first-paint gate for the third-screen form. Keep this inline
        // so stale/cached external CSS can never expose the form on screens 1–2.
        $registrationPrehideTag = '<style id="hashcod-platform-registration-prehide">'
            . '#hashcodPlatformRegistration{display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important;}'
            . 'html[data-hashcod-final-entry-screen="true"] #hashcodPlatformRegistration{display:block!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important;}'
            . '</style>';

        $registrationGatePrebootTag = '<script id="hashcod-registration-gate-preboot">(function(){window.__hashcodPlatformEntryHoldReady=false;document.documentElement.dataset.hashcodEntryGateReady="false";var queued=false;document.addEventListener("click",function(e){var b=e.target&&e.target.closest?e.target.closest("#bootCliEnter"):null;if(!b)return;if(window.__hashcodPlatformEntryHoldReady===true)return;e.preventDefault();e.stopPropagation();if(typeof e.stopImmediatePropagation==="function")e.stopImmediatePropagation();if(queued)return;queued=true;var old=b.textContent;b.setAttribute("aria-busy","true");b.textContent="PREPARANDO ACCESO";window.addEventListener("hashcod:entry-gate-ready",function(){queued=false;b.removeAttribute("aria-busy");if(b.textContent==="PREPARANDO ACCESO")b.textContent=old;window.setTimeout(function(){b.click();},0);},{once:true});},true);})();</script>';

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
            . '.boot-cli-hint-wrap{min-width:0!important;}'
            . '@media(max-width:1180px){#hashcodRareFolderHost{left:35vw!important;top:48vh!important;transform:translate(-50%,-50%) scale(1.12)!important;}}'
            . '@media(max-width:900px){#hashcodRareFolderHost{left:50vw!important;top:39vh!important;transform:translate(-50%,-50%) scale(1.00)!important;}}'
            . '@media(max-width:620px){#hashcodRareFolderHost{left:50vw!important;top:36vh!important;transform:translate(-50%,-50%) scale(0.90)!important;}}'
            . '</style>';

        $headPos = strripos($html, '</head>');
        if ($headPos !== false) {
            $html = substr($html, 0, $headPos) . $cssTag . $legacyAuthPrehideTag . $registrationPrehideTag . $registrationGatePrebootTag . $duoPrebootTag . $rareFolderPrebootTag . $rareFolderPlacementTag . substr($html, $headPos);
        } else {
            $html = $cssTag . $legacyAuthPrehideTag . $registrationPrehideTag . $registrationGatePrebootTag . $duoPrebootTag . $rareFolderPrebootTag . $rareFolderPlacementTag . $html;
        }

        // Rescue layer is injected inline as well as loaded as a versioned asset.
        $rescueJsPath = __DIR__ . '/components/toolbox-secure-ui-rescue.js';
        $rescueJs = is_file($rescueJsPath) ? (string) @file_get_contents($rescueJsPath) : '';
        $inlineRescueTag = $rescueJs !== ''
            ? '<script id="hashcod-toolbox-ui-rescue-inline">' . $rescueJs . '</script>'
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

        // Inline Screen 3 as the primary registration runtime. The external
        // script remains as a cache-busted fallback and is idempotent.
        $registrationJsPath = __DIR__ . '/components/platform-registration-form.js';
        $registrationJs = is_file($registrationJsPath) ? (string) @file_get_contents($registrationJsPath) : '';
        if ($registrationJs !== '') {
            $registrationJs = str_ireplace('</script', '<\\/script', $registrationJs);
        }
        $inlineRegistrationJsTag = $registrationJs !== ''
            ? '<script id="hashcod-platform-registration-inline-js">' . $registrationJs . '</script>'
            : '';

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
        $rareFolderExternalTag = '<script defer src="' . $base . 'components/rare-folder-entry.bundle.js?v=20260913-3" data-hashcod-rare-folder="true"></script>';

        // Remove the stale blackhole status from the DOM as well as hiding it.
        // This prevents older boot scripts from leaving misleading loading text
        // visible to assistive technology while the Rare UI folder is authoritative.
        $legacyBlackholeCleanupTag = '<script id="hashcod-legacy-blackhole-cleanup">(function(){function cleanup(){var hint=document.getElementById("bootCliHint");if(!hint)return;hint.textContent="";hint.hidden=true;hint.setAttribute("aria-hidden","true");}if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",cleanup,{once:true});}else{cleanup();}})();</script>';

        $tag = $legacyBlackholeCleanupTag
            . $inlineRegistrationJsTag
            . '<script defer src="' . $base . 'components/legacy-auth-retirement.js?v=20260918-2" data-hashcod-legacy-auth-retirement="true"></script>'
            . '<script defer src="' . $base . 'components/platform-entry-motion.js?v=20260918-1" data-platform-entry-motion="true"></script>'
            . '<script defer src="' . $base . 'components/platform-entry-hold.js?v=20260918-8" data-platform-entry-hold="true"></script>'
            . '<script defer src="' . $base . 'components/platform-registration-form.js?v=20260918-8" data-hashcod-platform-registration="true"></script>'
            . $rareFolderInlineTag
            . $rareFolderExternalTag
            . $inlineRescueTag
            . $inlineEfrJsTag
            . '<script defer src="' . $base . 'components/vector-link-board-reconcile.js?v=20260913-6" data-hashcod-link-reconcile="true"></script>'
            . '<script defer src="' . $base . 'components/toolbox-secure-links.js?v=20260913-4" data-hashcod-toolbox-secure="true"></script>'
            . '<script defer src="' . $base . 'components/toolbox-signature-copy.js?v=20260913-2" data-hashcod-toolbox-signature-copy="true"></script>'
            . '<script defer src="' . $base . 'components/toolbox-secure-ui-rescue.js?v=20260913-1" data-hashcod-toolbox-ui-rescue="true"></script>'
            . '<script defer src="' . $base . 'components/topbar-windows-hello.js?v=20260913-1" data-hashcod-topbar-windows-hello="true"></script>'
            . '<script defer src="' . $base . 'components/duo-page-transition.js?v=20260913-2" data-hashcod-duo-transition="true"></script>'
            . '<script defer src="' . $base . 'components/platform-entry-capability-footer.js?v=20260913-3" data-hashcod-entry-capability-footer="true"></script>'
            . '<script defer src="' . $base . 'components/platform-entry-capability-footer-fix.js?v=20260917-restore2" data-hashcod-entry-capability-footer-fix="true"></script>'
            . '<script defer src="' . $base . 'components/auth-tabs-rescue.js?v=20260913-3" data-hashcod-auth-tabs-rescue="true"></script>'
            . '<script defer src="' . $base . 'components/admin-codekey-picker-rescue.js?v=20260915-1" data-hashcod-codekey-picker-rescue="true"></script>'
            . '<script defer src="' . $base . 'components/percent-feature-button.js?v=20260914-1" data-hashcod-percent-feature="true"></script>'
            . '<script defer src="' . $base . 'components/efr-code-editor.js?v=20260915-3" data-hashcod-efr-code-editor="true"></script>'
            . '<script defer src="' . $base . 'components/boot-brand-credit-relocate.js?v=20260917-10" data-hashcod-boot-brand-credit-relocate="true"></script>'
            . '<script defer src="' . $base . 'components/boot-local-download-layout-fix.js?v=20260917-3" data-hashcod-local-download-layout-fix="true"></script>';
        $bodyPos = strripos($html, '</body>');
        if ($bodyPos !== false) {
            $html = substr($html, 0, $bodyPos) . $tag . substr($html, $bodyPos);
        } else {
            $html .= $tag;
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