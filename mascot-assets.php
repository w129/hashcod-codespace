<?php
declare(strict_types=1);

$path = parse_url((string)($_SERVER['REQUEST_URI'] ?? ''), PHP_URL_PATH);
$path = is_string($path) ? preg_replace('#^/(?:l8|l8-codespace)(?=/|$)#i', '', $path) : '';

$assets = [
    '/mascots/panda-directions.webp' => [
        'url' => 'https://raw.githubusercontent.com/nilbuild/page-mascot/main/public/mascots/panda-directions.webp',
        'git_sha' => '6f3f42dcf066c2b1c01e85913d2ea8828215f474',
        'bytes' => 100590,
        'file' => 'panda-directions.webp',
    ],
    '/mascots/panda-reactions.webp' => [
        'url' => 'https://raw.githubusercontent.com/nilbuild/page-mascot/main/public/mascots/panda-reactions.webp',
        'git_sha' => 'aaecccbcc7aaeb646aeb2a10145d31701ada5e9e',
        'bytes' => 111338,
        'file' => 'panda-reactions.webp',
    ],
];

if (!isset($assets[$path])) {
    http_response_code(404);
    exit;
}
if (!in_array(strtoupper((string)($_SERVER['REQUEST_METHOD'] ?? 'GET')), ['GET', 'HEAD'], true)) {
    http_response_code(405);
    header('Allow: GET, HEAD');
    exit;
}

$asset = $assets[$path];
$cacheDir = __DIR__ . '/data/page-mascot';
if (!is_dir($cacheDir)) @mkdir($cacheDir, 0700, true);
$cacheFile = $cacheDir . '/' . $asset['file'];

$gitBlobSha = static function (string $bytes): string {
    return sha1('blob ' . strlen($bytes) . "\0" . $bytes);
};

$validCache = false;
if (is_file($cacheFile) && (int)@filesize($cacheFile) === (int)$asset['bytes']) {
    $cached = @file_get_contents($cacheFile);
    $validCache = is_string($cached) && hash_equals($asset['git_sha'], $gitBlobSha($cached));
}

if (!$validCache) {
    $bytes = false;
    if (function_exists('curl_init')) {
        $ch = curl_init($asset['url']);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_CONNECTTIMEOUT => 4,
            CURLOPT_TIMEOUT => 12,
            CURLOPT_MAXREDIRS => 3,
            CURLOPT_USERAGENT => 'HashcodCodespace/page-mascot',
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_HTTPHEADER => ['Accept: image/webp,*/*;q=0.8'],
        ]);
        $bytes = curl_exec($ch);
        $status = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
        curl_close($ch);
        if ($status !== 200) $bytes = false;
    } else {
        $ctx = stream_context_create(['http' => [
            'timeout' => 12,
            'header' => "User-Agent: HashcodCodespace/page-mascot\r\nAccept: image/webp,*/*;q=0.8\r\n",
        ]]);
        $bytes = @file_get_contents($asset['url'], false, $ctx);
    }

    if (!is_string($bytes)
        || strlen($bytes) !== (int)$asset['bytes']
        || !hash_equals($asset['git_sha'], $gitBlobSha($bytes))) {
        http_response_code(503);
        header('Content-Type: text/plain; charset=utf-8');
        header('Cache-Control: no-store');
        echo 'Mascot asset unavailable';
        exit;
    }

    $tmp = $cacheFile . '.tmp-' . bin2hex(random_bytes(5));
    if (@file_put_contents($tmp, $bytes, LOCK_EX) !== false) {
        @chmod($tmp, 0600);
        @rename($tmp, $cacheFile);
    }
}

$etag = '"' . $asset['git_sha'] . '"';
$ifNoneMatch = trim((string)($_SERVER['HTTP_IF_NONE_MATCH'] ?? ''));
if ($ifNoneMatch === $etag) {
    http_response_code(304);
    header('ETag: ' . $etag);
    header('Cache-Control: public, max-age=31536000, immutable');
    exit;
}

header('Content-Type: image/webp');
header('Content-Length: ' . (string)$asset['bytes']);
header('Cache-Control: public, max-age=31536000, immutable');
header('ETag: ' . $etag);
header('X-Content-Type-Options: nosniff');
header('Cross-Origin-Resource-Policy: same-origin');

if (strtoupper((string)($_SERVER['REQUEST_METHOD'] ?? 'GET')) !== 'HEAD') {
    readfile($cacheFile);
}
exit;
