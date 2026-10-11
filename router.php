<?php
// router.php — front controller PHP (HTML nativo, no Vite/React SPA)
require_once __DIR__ . '/security.php';
require_once __DIR__ . '/l8-html.php';
require_once __DIR__ . '/pqc-actions-lib.php';

// Public local-installer download. Route this before the generic security
// bootstrap because direct *.php paths are deliberately denied elsewhere.
// Support both a clean public URL and the legacy .php URL used by older clients.
$bootstrapRequestUri = (string)($_SERVER['REQUEST_URI'] ?? '/');
$bootstrapRawPath = parse_url($bootstrapRequestUri, PHP_URL_PATH);
$bootstrapRawPath = is_string($bootstrapRawPath) ? $bootstrapRawPath : '/';
$bootstrapSyncPath = preg_replace('#^/(?:l8|l8-codespace)(?=/|$)#i', '', $bootstrapRawPath);
// Only certificate verification/revocation listing are public read-only routes.
if (in_array($bootstrapSyncPath, ['/api/hashcod-review/verify', '/api/hashcod-review/revoked'], true)) {
    $_SERVER['HASHCOD_REVIEW_PUBLIC'] = basename($bootstrapSyncPath);
    $_SERVER['REQUEST_URI'] = '/api/admin-device/status';
    require __DIR__ . '/hashcod-review.php';
    exit;
}
if ($bootstrapSyncPath === '/api/platform-requests') {
    // Polled status view; it shares the non-interactive polling bucket and applies the period/consent guards itself.
    $_SERVER['REQUEST_URI'] = '/api/admin-device/status';
    require __DIR__ . '/platform-requests-api.php';
    exit;
}
if ($bootstrapSyncPath === '/api/policy-consent') {
    // Acceptance precedes every other feature; it uses the non-interactive polling bucket.
    $_SERVER['REQUEST_URI'] = '/api/admin-device/status';
    require __DIR__ . '/policy-consent-api.php';
    exit;
}
if ($bootstrapSyncPath === '/api/platform-period') {
    // Use the existing non-interactive polling bucket; keep IP/threat controls.
    $_SERVER['REQUEST_URI'] = '/api/admin-device/status';
    require __DIR__ . '/platform-period-api.php';
    exit;
}
if ($bootstrapSyncPath === '/api/platform-subscription') {
    $_SERVER['REQUEST_URI'] = '/api/admin-device/status';
    require __DIR__.'/platform-subscription-api.php';
    exit;
}
// Only entrance proofs and runtime security configuration may precede selection.
$periodBootstrapRoute = in_array($bootstrapSyncPath, ['/api/code-access', '/api/mldsa-access', '/api/pqc-actions', '/api/admin-device/status', '/api/cloudflare/turnstile/config'], true)
    // Public verification of printed constancias (QR / hcod verify) must work for anyone, without a platform period.
    || preg_match('~^/api/constancia/public/HC-\d{4}-\d{6}(?:\.cod)?$~', $bootstrapSyncPath) === 1;
if (!$periodBootstrapRoute && preg_match('~^/(?:api/|hashcod-(?:workspace|file-vault|sync\.php)|toolbox-secure\.php)~', $bootstrapSyncPath)) {
    require_once __DIR__ . '/platform-period-lib.php';
    platformPeriodGuard(!in_array($bootstrapSyncPath, ['/api/hashcod-tokenization', '/hashcod-tokenization.php', '/api/hashcod-review', '/api/hashcod-comments'], true));
}
// The policy is a public HTML page, including old .php bookmarks. Normalize
// only these exact aliases before the generic PHP-file denial. The full web
// security bootstrap still runs; private PHP files remain inaccessible.
$bootstrapPrivacyRoute = in_array($bootstrapSyncPath, [
    '/privacy', '/privacy/', '/privacy.php', '/politica', '/politica/',
    '/politica-de-privacidad', '/politica-de-privacidad/',
], true);
$bootstrapPrivacyQuery = parse_url($bootstrapRequestUri, PHP_URL_QUERY);
$bootstrapPrivacySuffix = is_string($bootstrapPrivacyQuery) && $bootstrapPrivacyQuery !== ''
    ? '?' . $bootstrapPrivacyQuery : '';
if ($bootstrapPrivacyRoute) {
    $_SERVER['REQUEST_URI'] = '/privacy' . $bootstrapPrivacySuffix;
}
if (in_array($bootstrapSyncPath, ['/download-local-version', '/download-local-version.php'], true)) {
    require __DIR__ . '/download-local-version.php';
    exit;
}

// Background controllers are deliberate public entrypoints. The generic security
// layer denies direct *.php paths and its normal API bucket may trigger an
// interactive Turnstile challenge for legitimate polling/verification requests.
// Normalize these isolated controllers to the existing high-frequency,
// non-interactive status bucket before their own security bootstrap runs. Hard IP
// threat blocks remain active, while write authorization stays inside each
// controller (Windows Hello / Dilithium-5 / authenticated account as applicable).
$bootstrapController = null;
if (str_starts_with($bootstrapSyncPath, '/api/skill-chat/')) {
    $_SERVER['HASHCOD_SKILL_CHAT_PATH'] = substr($bootstrapSyncPath, strlen('/api/skill-chat'));
    $bootstrapController = __DIR__ . '/hashcod-skill-chat.php';
} elseif ($bootstrapSyncPath === '/api/hashcod-review') {
    $bootstrapController = __DIR__ . '/hashcod-review.php';
} elseif (in_array($bootstrapSyncPath, ['/api/hashcod-tokenization', '/hashcod-tokenization.php'], true)) {
    $bootstrapController = __DIR__ . '/hashcod-tokenization.php';
} elseif (in_array($bootstrapSyncPath, ['/hashcod-sync.php', '/api/hashcod-sync'], true)) {
    $bootstrapController = __DIR__ . '/hashcod-sync.php';
} elseif (in_array($bootstrapSyncPath, ['/toolbox-secure.php', '/api/toolbox-secure'], true)) {
    $bootstrapController = __DIR__ . '/toolbox-secure.php';
} elseif (in_array($bootstrapSyncPath, ['/hashcod-file-vault.php', '/api/hashcod-file-vault'], true)) {
    $bootstrapController = __DIR__ . '/hashcod-file-vault.php';
} elseif (in_array($bootstrapSyncPath, ['/hashcod-file-vault-fast-upload.php', '/api/hashcod-file-vault-fast-upload'], true)) {
    $bootstrapController = __DIR__ . '/hashcod-file-vault-fast-upload.php';
} elseif (in_array($bootstrapSyncPath, ['/api/hashcod-shared-files', '/api/hashcod-shared-upload', '/api/hashcod-shared-state', '/api/hashcod-shared-text-editor'], true)) {
    $bootstrapController = __DIR__ . '/hashcod-shared-cloud.php';
}
if ($bootstrapController !== null) {
    if (is_string($bootstrapSyncPath) && str_starts_with($bootstrapSyncPath, '/api/hashcod-shared-')) {
        $_SERVER['HASHCOD_SHARED_ROUTE'] = $bootstrapSyncPath;
    }
    $bootstrapQuery = parse_url($bootstrapRequestUri, PHP_URL_QUERY);
    $_SERVER['REQUEST_URI'] = '/api/admin-device/status'
        . (is_string($bootstrapQuery) && $bootstrapQuery !== '' ? '?' . $bootstrapQuery : '');
    require $bootstrapController;
    exit;
}

// ML-DSA-87 challenge/signature endpoint must run before the generic web
// bootstrap. The unauthenticated gate needs this route to prove possession of
// the private key; rate limiting and signature validation remain in the API.
if ($bootstrapSyncPath === '/api/pqc-actions') {
    require __DIR__ . '/pqc-actions.php';
    exit;
}
if ($bootstrapSyncPath === '/api/code-access') {
    require __DIR__ . '/code-access-api.php';
    exit;
}

// Optional strict mode: when enabled, every state-changing same-origin request
// must carry a short-lived permit minted by an ML-DSA-87-signed action receipt.
pqaRequirePermitForMutation($bootstrapSyncPath);

if ($bootstrapSyncPath === '/api/mldsa-access') {
    require __DIR__ . '/mldsa-access-api.php';
    exit;
}
if ($bootstrapSyncPath === '/api/hashcod-coupon') {
    require __DIR__ . '/coupon-system.php';
    exit;
}
if ($bootstrapSyncPath === '/api/hashcod-text-editor') {
    require __DIR__ . '/hashcod-text-editor.php';
    exit;
}
// Saved comments is a background JSON controller. Route it before the generic
// web bootstrap so polling/saving cannot be replaced by an interactive security
// challenge. The controller keeps its own client validation and rate limiting.
if ($bootstrapSyncPath === '/api/hashcod-comments') {
    require __DIR__ . '/hashcod-comments.php';
    exit;
}
// Entry ProductCard editor verification must be reachable from the public
// pre-platform wizard. It performs its own same-origin checks and rate limiting.
if ($bootstrapSyncPath === '/api/entry-product-editor') {
    require __DIR__ . '/entry-product-editor.php';
    exit;
}
// Per-device usage metrics are needed by the public entry wizard and the
// platform tracker. The controller validates same-origin/XHR writes itself.
if ($bootstrapSyncPath === '/api/device-usage') {
    require __DIR__ . '/device-usage.php';
    exit;
}

// Old public landing bookmarks must reach the same rendered document in
// desktop/PHP as Railway. Normalize only these exact aliases; all other PHP
// files still pass through the generic denial and every security check.
if (in_array($bootstrapSyncPath, ['/index.php', '/index.html'], true)) {
    $landingQuery = parse_url($bootstrapRequestUri, PHP_URL_QUERY);
    $_SERVER['REQUEST_URI'] = '/'
        . (is_string($landingQuery) && $landingQuery !== '' ? '?' . $landingQuery : '');
}

securityBootstrap('web');

if ($bootstrapPrivacyRoute) {
    $privacyPrefix = substr($bootstrapRawPath, 0, strlen($bootstrapRawPath) - strlen($bootstrapSyncPath));
    $privacyCanonical = $privacyPrefix . '/privacy';
    if ($bootstrapRawPath !== $privacyCanonical) {
        header('Cache-Control: no-store');
        header('Location: ' . $privacyCanonical . $bootstrapPrivacySuffix, true, 308);
        exit;
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$rawUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$rawUri = is_string($rawUri) ? $rawUri : '/';
$uri = preg_replace('#^/(?:l8|l8-codespace)(?=/|$)#i', '', $rawUri);
if ($uri === '' || $uri === false) $uri = '/';

// Constancia verification page and issuer DID document: public by design (QR codes and did:web resolvers).
if ($uri === '/.well-known/did.json' || preg_match('~^/verify/HC-\d{4}-\d{6}$~', $uri) === 1) {
    require __DIR__ . '/constancia.php';
    constanciaServePublic($uri);
    exit;
}

require_once __DIR__ . '/admin-device.php';
adminDeviceApi($uri);
if (adminProtectedPath($uri)) adminRequire();

// Raíz / app principal — HTML completo en view-source (index.php)
if ($uri === '/' || $uri === '/index.php' || $uri === '/index.html' || $uri === '/404.html') {
    l8_require_html_page('index.php', true);
}

// Páginas HTML enrutadas (nunca servir el .php crudo por allowlist)
$routedPages = [
    '/admin-device-setup' => 'admin-device-setup.php',
    '/admin-device-setup.php' => 'admin-device-setup.php',
    '/gateway' => 'gateway.php',
    '/gateway.php' => 'gateway.php',
    '/ubuntu' => 'ubuntu-cli.php',
    '/ubuntu-cli' => 'ubuntu-cli.php',
    '/ubuntu-cli.php' => 'ubuntu-cli.php',
    '/claude' => 'claude-cli.php',
    '/claude-cli' => 'claude-cli.php',
    '/claude-code' => 'claude-cli.php',
    '/claude-cli.php' => 'claude-cli.php',
    '/zylon' => 'zylon-cli.php',
    '/zylon-cli' => 'zylon-cli.php',
    '/private-gpt' => 'zylon-cli.php',
    '/zylon-cli.php' => 'zylon-cli.php',
    '/prs-code' => 'prs-code.php',
    '/prs_code' => 'prs-code.php',
    '/prs' => 'prs-code.php',
    '/prs-code.php' => 'prs-code.php',
    '/macos' => 'macos-cli.php',
    '/macos-cli' => 'macos-cli.php',
    '/macos_inside' => 'macos-cli.php',
    '/macOS_inside' => 'macos-cli.php',
    '/macos-cli.php' => 'macos-cli.php',
    '/chromeos' => 'chromeos-cli.php',
    '/chromeos-cli' => 'chromeos-cli.php',
    '/chromeos_play' => 'chromeos-cli.php',
    '/chromeOS_play' => 'chromeos-cli.php',
    '/chromeos-cli.php' => 'chromeos-cli.php',
    '/libreoffice' => 'libreoffice-cli.php',
    '/libreoffice-cli' => 'libreoffice-cli.php',
    '/libreoffice-cli.php' => 'libreoffice-cli.php',
    '/tiptap' => 'tiptap-editor.php',
    '/tiptap-editor' => 'tiptap-editor.php',
    '/tiptap-editor.php' => 'tiptap-editor.php',
    '/word' => 'tiptap-editor.php',
    '/documento' => 'tiptap-editor.php',
    '/openclaw' => 'openclaw-ui.php',
    '/openclaw.php' => 'openclaw-ui.php',
    '/openclaw-ui' => 'openclaw-ui.php',
    '/claw' => 'openclaw-ui.php',
    '/claw-ui' => 'openclaw-ui.php',
    '/privacy' => 'privacy.php',
];
if (isset($routedPages[$uri])) {
    $page = $routedPages[$uri];
    if (!in_array($page, ['privacy.php', 'admin-device-setup.php'], true)) {
        require_once __DIR__.'/platform-period-lib.php'; platformPeriodGuard(true);
    }
    if (!is_file(__DIR__ . '/' . $page)) {
        require __DIR__ . '/not-found.php';
        exit;
    }
    l8_require_html_page($page, true);
}

// Chat IA de la pantalla de acceso. Se enruta antes del backend general para
// mantener la integración Groq aislada y la credencial únicamente en servidor.
if ($uri === '/api/groq-chat') {
    require __DIR__ . '/groq-chat.php';
    exit;
}

// Isolated background controllers. Both supported routes are normalized before
// bootstrap above, so these branches are also explicit for alternate frontends.
if ($uri === '/hashcod-sync.php' || $uri === '/api/hashcod-sync') {
    require __DIR__ . '/hashcod-sync.php';
    exit;
}
if ($uri === '/toolbox-secure.php' || $uri === '/api/toolbox-secure') {
    require __DIR__ . '/toolbox-secure.php';
    exit;
}
if ($uri === '/hashcod-file-vault.php' || $uri === '/api/hashcod-file-vault') {
    require __DIR__ . '/hashcod-file-vault.php';
    exit;
}
if (in_array($uri, ['/api/hashcod-shared-files', '/api/hashcod-shared-upload', '/api/hashcod-shared-state', '/api/hashcod-shared-text-editor'], true)) {
    $_SERVER['HASHCOD_SHARED_ROUTE'] = $uri;
    require __DIR__ . '/hashcod-shared-cloud.php';
    exit;
}

// API
if (strpos($uri, '/api/') === 0 || $uri === '/cmd' || $uri === '/json') {
    require __DIR__ . '/api.php';
    exit;
}

// Google Search Console — HTML file verification (raíz pública)
if (preg_match('#^/google[a-z0-9]+\.html$#i', $uri)) {
    $verifyPath = __DIR__ . '/' . basename($uri);
    if (is_file($verifyPath)) {
        header('Content-Type: text/html; charset=utf-8');
        header('Cache-Control: public, max-age=300');
        header('X-Robots-Tag: noindex');
        readfile($verifyPath);
        exit;
    }
}

// SEO: robots.txt + sitemap.xml (raíz pública; no pasan por allowlist de assets)
// En Docker/Caddy también se sirven estáticos; esto cubre PHP built-in / fallback.
if ($uri === '/robots.txt' || $uri === '/sitemap.xml') {
    $isRobots = ($uri === '/robots.txt');
    $path = __DIR__ . ($isRobots ? '/robots.txt' : '/sitemap.xml');
    if (is_file($path)) {
        // Cabeceras mínimas: GSC falla a menudo con CORP/ETag/304/gzip raro
        foreach ([
            'Cross-Origin-Resource-Policy',
            'Cross-Origin-Opener-Policy',
            'Content-Security-Policy',
            'X-Frame-Options',
            'ETag',
            'Last-Modified',
            'X-Robots-Tag',
        ] as $h) {
            header_remove($h);
        }
        header('Content-Type: ' . ($isRobots ? 'text/plain; charset=utf-8' : 'text/xml; charset=utf-8'));
        header('Cache-Control: no-store, max-age=0, must-revalidate');
        header('X-Content-Type-Options: nosniff');
        readfile($path);
        exit;
    }
}

// Denegado / probes
if (securityIsDeniedPath($uri) || securityIsProbePath($uri)) {
    securityNotFoundQuiet();
}

// Solo assets allowlist
$filePath = realpath(__DIR__ . $uri);
$rootReal = realpath(__DIR__);
if (
    $filePath !== false
    && $rootReal !== false
    && ($filePath === $rootReal || str_starts_with($filePath, $rootReal . DIRECTORY_SEPARATOR))
    && is_file($filePath)
    && securityIsAllowedStatic($uri)
) {
    l8_serve_static_asset($filePath, $uri);
}

/**
 * Sirve un asset estático con ETag determinista, validación 304 Not Modified,
 * Cache-Control jerárquico (1 año immutable vs 86400s stale-while-revalidate),
 * y streaming eficiente con zero-copy / buffer limpio.
 */
function l8_serve_static_asset(string $filePath, string $uri): void {
    require_once __DIR__ . '/entry-assets.php';
    $mtime = (int)@filemtime($filePath);
    $size = (int)@filesize($filePath);
    $ext = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));

    $mimes = [
        'js' => 'application/javascript; charset=utf-8',
        'mjs' => 'application/javascript; charset=utf-8',
        'css' => 'text/css; charset=utf-8',
        'wasm' => 'application/wasm',
        'svg' => 'image/svg+xml; charset=utf-8',
        'png' => 'image/png',
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'gif' => 'image/gif',
        'webp' => 'image/webp',
        'ico' => 'image/x-icon',
        'woff' => 'font/woff',
        'woff2' => 'font/woff2',
        'ttf' => 'font/ttf',
        'map' => 'application/json; charset=utf-8',
        'json' => 'application/json; charset=utf-8',
        'webmanifest' => 'application/manifest+json; charset=utf-8',
        'xml' => 'text/xml; charset=utf-8',
        'txt' => 'text/plain; charset=utf-8',
    ];

    $mime = $mimes[$ext] ?? 'application/octet-stream';
    // Entry bundles must refresh even when a client sends old validators.
    // Caddy applies the same rule in production; this covers desktop/PHP.
    if (entryAssetIsMutable($uri)) {
        http_response_code(200);
        header('Content-Type: ' . $mime);
        header('Content-Length: ' . $size);
        header('Cache-Control: no-store, max-age=0, must-revalidate');
        header('X-Content-Type-Options: nosniff');
        header_remove('ETag');
        header_remove('Last-Modified');
        while (ob_get_level()) ob_end_clean();
        if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'HEAD') readfile($filePath);
        exit;
    }
    $etag = 'W/"' . dechex($mtime) . '-' . dechex($size) . '"';
    $lastModified = gmdate('D, d M Y H:i:s', $mtime) . ' GMT';

    // Determinar si es un asset versionado / inmutable
    $queryString = $_SERVER['QUERY_STRING'] ?? '';
    $hasVersionQuery = (bool)preg_match('/(?:^|&)(?:v|ver|hash|t|id)=[a-zA-Z0-9_.-]+/i', $queryString);
    $hasHashedFilename = (bool)preg_match('/-[a-zA-Z0-9_-]{6,}\.(?:js|css|wasm|svg|png|woff2?)$/i', basename($filePath));

    $isImmutable = $hasVersionQuery || $hasHashedFilename;
    $cacheControl = $isImmutable
        ? 'public, max-age=31536000, immutable'
        : 'public, max-age=86400, stale-while-revalidate=604800';

    // Validación condicional HTTP (If-None-Match / If-Modified-Since)
    $ifNoneMatch = isset($_SERVER['HTTP_IF_NONE_MATCH']) ? trim($_SERVER['HTTP_IF_NONE_MATCH']) : '';
    $ifModifiedSince = isset($_SERVER['HTTP_IF_MODIFIED_SINCE']) ? trim($_SERVER['HTTP_IF_MODIFIED_SINCE']) : '';

    $matchEtag = false;
    if ($ifNoneMatch !== '') {
        $etags = array_map('trim', explode(',', $ifNoneMatch));
        foreach ($etags as $clientEtag) {
            $cClean = trim($clientEtag, '"');
            $sClean = trim($etag, '"');
            $sWeakClean = ltrim($sClean, 'W/');
            $cWeakClean = ltrim($cClean, 'W/');
            if ($clientEtag === '*' || $clientEtag === $etag || $cClean === $sClean || $cWeakClean === $sWeakClean) {
                $matchEtag = true;
                break;
            }
        }
    }

    $matchTime = false;
    if ($ifModifiedSince !== '') {
        $sinceTime = strtotime($ifModifiedSince);
        if ($sinceTime !== false && $mtime <= $sinceTime) {
            $matchTime = true;
        }
    }

    if ($matchEtag || ($ifNoneMatch === '' && $matchTime)) {
        http_response_code(304);
        header('ETag: ' . $etag);
        header('Last-Modified: ' . $lastModified);
        header('Cache-Control: ' . $cacheControl);
        header('Vary: Accept-Encoding');
        while (ob_get_level()) {
            ob_end_clean();
        }
        exit;
    }

    // Cabeceras de respuesta completa 200
    http_response_code(200);
    header('Content-Type: ' . $mime);
    header('Content-Length: ' . $size);
    header('Last-Modified: ' . $lastModified);
    header('ETag: ' . $etag);
    header('Cache-Control: ' . $cacheControl);
    header('Vary: Accept-Encoding');
    header('X-Content-Type-Options: nosniff');

    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'HEAD') {
        while (ob_get_level()) {
            ob_end_clean();
        }
        exit;
    }

    while (ob_get_level()) {
        ob_end_clean();
    }

    readfile($filePath);
    exit;
}

// Rutas desconocidas → 404 real, conservando APIs, assets y rutas protegidas anteriores.
require __DIR__ . '/not-found.php';
exit;
