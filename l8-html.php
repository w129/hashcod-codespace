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

/**
 * Inicializa compresión de salida ligera (gzip/deflate) de forma segura.
 */
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
            . '<link rel="stylesheet" href="' . $base . 'components/toolbox-secure-links.css?v=20260913-3" data-hashcod-toolbox-secure-style="true">';

        // The Rare UI folder is critical boot UI. Inline it for immediate paint,
        // and also load the same versioned stylesheet externally so restrictive
        // CSP/CDN behavior cannot leave the boot canvas blank.
        $folderCssPath = __DIR__ . '/components/boot-folder-animation.css';
        $folderCss = is_file($folderCssPath) ? (string) @file_get_contents($folderCssPath) : '';
        $folderCssTag = ($folderCss !== ''
            ? '<style id="hashcod-boot-folder-animation-critical">' . $folderCss . '</style>'
            : '')
            . '<link rel="stylesheet" href="' . $base . 'components/boot-folder-animation.css?v=20260913-6" data-hashcod-boot-folder-style="true">';

        $headPos = strripos($html, '</head>');
        if ($headPos !== false) {
            $html = substr($html, 0, $headPos) . $cssTag . $folderCssTag . substr($html, $headPos);
        } else {
            $html = $cssTag . $folderCssTag . $html;
        }

        // Rescue layer is injected inline as well as loaded as a versioned asset.
        // It applies !important UI rules and direct CSSOM visibility so the
        // Toolbox can never fall back to raw document-flow controls if a CSS
        // response is stale, missing or overridden in production.
        $rescueJsPath = __DIR__ . '/components/toolbox-secure-ui-rescue.js';
        $rescueJs = is_file($rescueJsPath) ? (string) @file_get_contents($rescueJsPath) : '';
        $inlineRescueTag = $rescueJs !== ''
            ? '<script id="hashcod-toolbox-ui-rescue-inline">' . $rescueJs . '</script>'
            : '';

        // Mount the folder inline for the fastest paint, then load a same-origin
        // external fallback. The JS is idempotent, so only one live instance is
        // created even when both paths are allowed by the browser.
        $folderJsPath = __DIR__ . '/components/boot-folder-animation.js';
        $folderJs = is_file($folderJsPath) ? (string) @file_get_contents($folderJsPath) : '';
        if ($folderJs !== '') {
            $folderJs = str_ireplace('</script', '<\\/script', $folderJs);
        }
        $inlineFolderTag = $folderJs !== ''
            ? '<script id="hashcod-boot-folder-animation-inline" data-hashcod-boot-folder-animation="true">' . $folderJs . '</script>'
            : '';
        $externalFolderTag = '<script defer src="' . $base . 'components/boot-folder-animation.js?v=20260913-6" data-hashcod-boot-folder-animation-fallback="true"></script>';

        $tag = $inlineFolderTag
            . $externalFolderTag
            . $inlineRescueTag
            . '<script defer src="' . $base . 'components/vector-link-board-reconcile.js?v=20260913-6" data-hashcod-link-reconcile="true"></script>'
            . '<script defer src="' . $base . 'components/toolbox-secure-links.js?v=20260913-4" data-hashcod-toolbox-secure="true"></script>'
            . '<script defer src="' . $base . 'components/toolbox-signature-copy.js?v=20260913-2" data-hashcod-toolbox-signature-copy="true"></script>'
            . '<script defer src="' . $base . 'components/toolbox-secure-ui-rescue.js?v=20260913-1" data-hashcod-toolbox-ui-rescue="true"></script>'
            . '<script defer src="' . $base . 'components/topbar-windows-hello.js?v=20260913-1" data-hashcod-topbar-windows-hello="true"></script>';
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
