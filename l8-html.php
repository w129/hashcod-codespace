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
        return '/l8-codespace/';
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
