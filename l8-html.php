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

    // The main platform needs fresh integration layers even when older
    // versioned assets are still cached as immutable by the browser/CDN.
    // Buffer only index.php and inject cache-busted assets dynamically.
    if ($file === 'index.php') {
        ob_start();
        require $path;
        $html = (string) ob_get_clean();
        $base = htmlspecialchars(l8_public_base_path(), ENT_QUOTES, 'UTF-8');

        // Keep the normal stylesheet request, but also inline the same CSS as a
        // production-safe fallback. This prevents the secure Toolbox controls
        // from ever rendering as unstyled document flow if a stale CDN/static
        // asset response is served while the JS bundle has already updated.
        $secureCssPath = __DIR__ . '/components/toolbox-secure-links.css';
        $secureCss = is_file($secureCssPath) ? (string) @file_get_contents($secureCssPath) : '';
        $inlineCssTag = $secureCss !== ''
            ? '<style id="hashcod-toolbox-secure-inline">' . $secureCss . '</style>'
            : '';
        $cssTag = $inlineCssTag
            . '<link rel="stylesheet" href="' . $base . 'components/toolbox-secure-links.css?v=20260913-3" data-hashcod-toolbox-secure-style="true">'
            . '<link rel="stylesheet" href="' . $base . 'components/admin-hello-button.css?v=20260913-sequence11" data-hashcod-boot-icons-style="true">'
            . '<link rel="stylesheet" href="' . $base . 'components/duo-page-transition.css?v=20260913-2" data-hashcod-duo-transition-style="true">'
            . '<link rel="stylesheet" href="' . $base . 'components/platform-entry-capability-footer.css?v=20260913-3" data-hashcod-entry-capability-footer-style="true">'
            . '<link rel="stylesheet" href="' . $base . 'components/boot-brand-credit-relocate.css?v=20260913-1" data-hashcod-boot-brand-credit-relocate-style="true">';

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
            $html = substr($html, 0, $headPos) . $cssTag . $duoPrebootTag . $rareFolderPrebootTag . $rareFolderPlacementTag . substr($html, $headPos);
        } else {
            $html = $cssTag . $duoPrebootTag . $rareFolderPrebootTag . $rareFolderPlacementTag . $html;
        }

        // Rescue layer is injected inline as well as loaded as a versioned asset.
        $rescueJsPath = __DIR__ . '/components/toolbox-secure-ui-rescue.js';
        $rescueJs = is_file($rescueJsPath) ? (string) @file_get_contents($rescueJsPath) : '';
        $inlineRescueTag = $rescueJs !== ''
            ? '<script id="hashcod-toolbox-ui-rescue-inline">' . $rescueJs . '</script>'
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
            . $rareFolderInlineTag
            . $rareFolderExternalTag
            . $inlineRescueTag
            . '<script defer src="' . $base . 'components/vector-link-board-reconcile.js?v=20260913-6" data-hashcod-link-reconcile="true"></script>'
            . '<script defer src="' . $base . 'components/toolbox-secure-links.js?v=20260913-4" data-hashcod-toolbox-secure="true"></script>'
            . '<script defer src="' . $base . 'components/toolbox-signature-copy.js?v=20260913-2" data-hashcod-toolbox-signature-copy="true"></script>'
            . '<script defer src="' . $base . 'components/toolbox-secure-ui-rescue.js?v=20260913-1" data-hashcod-toolbox-ui-rescue="true"></script>'
            . '<script defer src="' . $base . 'components/topbar-windows-hello.js?v=20260913-1" data-hashcod-topbar-windows-hello="true"></script>'
            . '<script defer src="' . $base . 'components/duo-page-transition.js?v=20260913-2" data-hashcod-duo-transition="true"></script>'
            . '<script defer src="' . $base . 'components/platform-entry-capability-footer.js?v=20260913-3" data-hashcod-entry-capability-footer="true"></script>'
            . '<script defer src="' . $base . 'components/platform-entry-capability-footer-fix.js?v=20260913-1" data-hashcod-entry-capability-footer-fix="true"></script>'
            . '<script defer src="' . $base . 'components/boot-brand-credit-relocate.js?v=20260913-1" data-hashcod-boot-brand-credit-relocate="true"></script>';
        $bodyPos = strripos($html, '</body>');
        if ($bodyPos !== false) {
            $html = substr($html, 0, $bodyPos) . $tag . substr($html, $bodyPos);
        } else {
            $html .= $tag;
        }
        echo $html;
        exit;
    }

    require $path;
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
