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
    $override = '';
    if (function_exists('envValue')) {
        $override = (string) envValue('L8_PUBLIC_BASE', '');
    } else {
        $override = (string) (getenv('L8_PUBLIC_BASE') ?: '');
    }
    $override = trim($override);
    if ($override !== '') {
        if ($override === '/') {
            return '/';
        }
        return '/' . trim($override, '/') . '/';
    }

    $host = strtolower((string) ($_SERVER['HTTP_HOST'] ?? ''));
    if ($host !== '' && strpos($host, 'github.io') !== false) {
        return '/l8-codespace/';
    }

    return '/';
}

/** Emit Content-Type + cache headers for an HTML document response. */
function l8_html_headers($ok = true) {
    if (!headers_sent()) {
        http_response_code($ok ? 200 : 404);
        header('Content-Type: text/html; charset=utf-8');
        header('Cache-Control: no-store');
        header('X-L8-Serve: php-html');
    }
}

/**
 * Require a PHP/HTML page file with HTML headers.
 * $file is a basename under the project root (e.g. "index.php", "gateway.php").
 */
function l8_require_html_page($file, $ok = true) {
    $file = basename((string) $file);
    $path = __DIR__ . '/' . $file;
    if (!is_file($path)) {
        l8_html_not_found_page();
    }
    l8_html_headers($ok);
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
