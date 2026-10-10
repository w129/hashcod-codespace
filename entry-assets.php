<?php
// Shared by the hosted and local PHP entry. These filenames are mutable;
// their historical ?v labels are not content hashes.
function entryAssetIsMutable(string $path): bool {
    return in_array($path, [
        '/components/mldsa-access-gate.js',
        '/components/mldsa-access-gate.css',
        '/components/mldsa-access-gate-loader.js',
        '/components/code-access.bundle.js',
        '/components/code-access.bundle.css',
        '/components/monaco-editor.worker.js',
        '/components/center-empty-state.bundle.js',
        '/components/center-empty-state.bundle.css',
        '/components/first-screen-branched-menu.bundle.js',
        '/components/first-screen-branched-menu.bundle.css',
        '/components/react-bits-rotating-text.js',
        '/components/react-bits-rotating-text.css',
        '/components/page-mascot-walker.js',
        '/components/page-mascot-walker.css',
        '/components/platform-intro.js',
        '/components/platform-intro.css',
    ], true);
}

function entryAssetUrl(string $base, string $asset): string {
    $path = '/' . explode('?', $asset, 2)[0];
    $url = $base . $asset;
    if (entryAssetIsMutable($path)) {
        $file = __DIR__ . $path;
        $digest = is_file($file) ? hash_file('sha256', $file) : false;
        if (is_string($digest)) {
            $url .= (str_contains($asset, '?') ? '&' : '?') . 'hash=' . $digest;
        }
    }
    return htmlspecialchars($url, ENT_QUOTES, 'UTF-8');
}
