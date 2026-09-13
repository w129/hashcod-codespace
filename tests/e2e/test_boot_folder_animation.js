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
assert(source.includes('findBrandRect'), 'folder keeps brand-aware placement support in the React integration');
assert(source.includes("pointerEvents: 'none'"), 'host must not block the rest of the startup screen');
assert(!source.includes('new MutationObserver'), 'folder mount must not use a broad MutationObserver');
assert(source.includes('attempts >= 40'), 'mount retries must remain bounded');

assert(pkg.includes('"motion": "^12.40.0"'), 'build must use the same Motion major/version family as Rare UI');
assert(pkg.includes('"react": "19.2.4"'), 'build must use Rare UI React version');
assert(pkg.includes('rare-folder-entry.bundle.js'), 'isolated build must emit the local browser bundle');

assert(docker.includes('cd /var/www/html/rare-folder-build'), 'Render image must build the Rare UI bundle');
assert(docker.includes('test -s /var/www/html/components/rare-folder-entry.bundle.js'), 'Docker build must fail if the folder bundle is missing');

assert(html.includes('hashcod-rare-folder-preboot'), 'obsolete intro must be suppressed before deferred scripts run');
assert(html.includes('rare-folder-entry.bundle.js?v=20260913-2'), 'production HTML must load the new cache-busted local Rare UI bundle');
assert(html.includes('hashcod-rare-folder-placement'), 'production HTML must include the visibility/placement override');
assert(html.includes('left:38vw!important'), 'desktop folder must occupy the requested left-side blank area');
assert(html.includes('top:50vh!important'), 'folder must be vertically centered with the Hashcod mark');
assert(html.includes('z-index:2147482500!important'), 'folder must render above the boot surface');
assert(html.includes('[data-slot="folder"]{pointer-events:auto!important'), 'the folder itself must remain interactive');
assert(!html.includes('boot-folder-animation.js?v=20260913-6'), 'old native folder fallback must no longer be loaded');
assert(!html.includes('boot-folder-animation.css?v=20260913-6'), 'old native folder CSS must no longer be loaded');

console.log('Rare UI React/Motion folder contract: OK');
