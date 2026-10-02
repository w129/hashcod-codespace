'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = path.resolve(__dirname, '../..');
const source = fs.readFileSync(path.join(root, 'rare-folder-build/entry.jsx'), 'utf8');
const pkg = fs.readFileSync(path.join(root, 'rare-folder-build/package.json'), 'utf8');
const html = fs.readFileSync(path.join(root, 'l8-html.php'), 'utf8');
const docker = fs.readFileSync(path.join(root, 'Dockerfile'), 'utf8');

assert(source.includes('from "motion/react"'), 'Rare UI folder must use Motion React, matching the registry component');
assert(source.includes('createRoot'), 'folder must mount as a real isolated React root');
assert(source.includes("document.getElementById('bootCliOverlay')"), 'folder must mount inside the real boot overlay');
assert(source.includes('swamimalode07/rare-ui'), 'Rare UI source attribution must remain in the integration');
assert(source.includes('M0 25C0 11.1929 11.1929 0 25 0H136.084'), 'Rare UI flap geometry must be preserved');
assert(source.includes('stiffness: 120'), 'Rare UI spring stiffness must be preserved');
assert(source.includes('damping: 13'), 'Rare UI card spring damping must be preserved');
assert(source.includes('damping: 14'), 'Rare UI flap spring damping must be preserved');
assert(source.includes('y: isOpen ? -160 : isHovered ? -30 : -10'), 'card 1 Rare UI motion states must be preserved');
assert(source.includes('y: isOpen ? -180 : isHovered ? -35 : -20'), 'card 2 Rare UI motion states must be preserved');
assert(source.includes('y: isOpen ? -170 : isHovered ? -44 : -22'), 'card 3 Rare UI motion states must be preserved');
assert(source.includes('rotateX: isOpen ? -55 : isHovered ? -45 : -15'), 'Rare UI flap states must be preserved');
assert(source.includes('findBrandNode'), 'folder keeps brand-aware placement support in the React integration');
assert(source.includes('DESKTOP_COMPOSITION_MIN_WIDTH = 1181'), 'wide-screen composition breakpoint is missing');
assert(source.includes('const totalWidth = folderVisualW + gap + brandRect.width'), 'folder and brand must be treated as one centered composition');
assert(source.includes("host.style.setProperty('left'"), 'folder must override the stale fixed 38vw placement at runtime');
assert(source.includes("'important'"), 'runtime folder placement must beat the legacy important placement rule');
assert(source.includes('adjustHorizontalOffset(brand'), 'brand must be brought back toward the centered folder composition');
assert(source.includes(".boot-cli-footer .boot-card-icon"), 'integration icon strip must be centered with the viewport');
assert(source.includes('data-hashcod-composition-aligned'), 'desktop alignment state marker is missing');
assert(source.includes("pointerEvents: 'none'"), 'host must not block the rest of the startup screen');
assert(!source.includes('new MutationObserver'), 'folder mount must not use a broad MutationObserver');
assert(source.includes('attempts >= 40'), 'mount retries must remain bounded');

assert(pkg.includes('"motion": "^12.40.0"'), 'build must use the same Motion major/version family as Rare UI');
assert(pkg.includes('"react": "19.2.4"'), 'build must use Rare UI React version');
assert(pkg.includes('rare-folder-entry.bundle.js'), 'isolated build must emit the local browser bundle');
assert(pkg.includes("--define:process.env.NODE_ENV='\\\"production\\\"'"), 'esbuild NODE_ENV must be passed as a quoted string, not a bare production identifier');

assert(docker.includes('cd /var/www/html/rare-folder-build'), 'Render image must build the Rare UI bundle');
assert(docker.includes('test -s /var/www/html/components/rare-folder-entry.bundle.js'), 'Docker build must fail if the folder bundle is missing');

assert(html.includes('hashcod-rare-folder-preboot'), 'obsolete intro must be suppressed before folder bootstrap');
assert(html.includes("file_get_contents($rareFolderBundlePath)"), 'production PHP must inline the built Rare UI bundle');
assert(html.includes('hashcod-rare-folder-inline'), 'production HTML must emit an inline Rare UI bundle for guaranteed execution');
assert(html.includes("$rareFolderExternalTag = $rareFolderBundle === ''"), 'Rare UI external fallback must only load when the inline bundle is unavailable');
assert(html.includes('rare-folder-entry.bundle.js?v=20260919-perf1'), 'production Rare UI fallback cache version missing');
assert(html.includes('hashcod-rare-folder-placement'), 'production HTML must include the visibility/placement override');
assert(html.includes('left:38vw!important'), 'legacy desktop placement remains as a no-JS fallback');
assert(html.includes('top:50vh!important'), 'legacy folder fallback remains vertically centered');
assert(html.includes('z-index:2147482500!important'), 'folder must render above the boot surface');
assert(html.includes('[data-slot="folder"]{pointer-events:auto!important'), 'the folder itself must remain interactive');
assert(!html.includes('boot-folder-animation.js?v=20260913-6'), 'old native folder fallback must no longer be loaded');
assert(!html.includes('boot-folder-animation.css?v=20260913-6'), 'old native folder CSS must no longer be loaded');

const retiredBlackholeScript = /<script\b[^>]*\bsrc=["'][^"']*components\/originkit\/ui\/blackhole-runtime\.js[^"']*["'][^>]*>/i;
const retiredBlackholeCanvas = /\bid=["']bootBlackholeCanvas["']/i;
const productionIndex = fs.readFileSync(path.join(root, 'index.php'), 'utf8');
const staticIndex = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const static404 = fs.readFileSync(path.join(root, '404.html'), 'utf8');
for (const [label, page] of [['index.php', productionIndex], ['index.html', staticIndex], ['404.html', static404]]) {
    assert(!retiredBlackholeScript.test(page), label + ' must not load the retired blackhole runtime as an executable script');
    assert(!retiredBlackholeCanvas.test(page), label + ' must not include the retired blackhole canvas');
}

console.log('Rare UI React/Motion folder contract: OK');
