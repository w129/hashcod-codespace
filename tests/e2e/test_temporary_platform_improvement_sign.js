'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const repoDir = path.resolve(__dirname, '../..');
const svg = fs.readFileSync(path.join(repoDir, 'assets/plataforma-en-mejora.svg'), 'utf8');
const js = fs.readFileSync(path.join(repoDir, 'components/temporary-platform-improvement-sign.js'), 'utf8');
const css = fs.readFileSync(path.join(repoDir, 'components/temporary-platform-improvement-sign.css'), 'utf8');
const hosted = fs.readFileSync(path.join(repoDir, 'l8-html.php'), 'utf8');
const local = fs.readFileSync(path.join(repoDir, 'laragon-local-entry.php'), 'utf8');

assert(svg.includes('viewBox="0 0 1080 1080"'), 'uploaded improvement SVG viewBox changed');
assert(svg.includes('assetClipPath_j9OOX5od'), 'uploaded improvement SVG paths missing');
assert(js.includes("const SIGN_ID = 'hashcodPlatformImprovementSign'"), 'temporary sign host id missing');
assert(js.includes("assets/plataforma-en-mejora.svg?v=20260917-1"), 'temporary sign asset path missing');
assert(js.includes('persistentUntilExplicitRemoval: true'), 'temporary sign persistence contract missing');
assert(css.includes('left: 63vw !important'), 'desktop sign placement missing');
assert(css.includes('pointer-events: none !important'), 'temporary sign must not block the platform');
assert(css.includes('@media (max-width: 900px)'), 'temporary sign mobile placement missing');
assert(hosted.includes('temporary-platform-improvement-sign.css?v=20260917-1'), 'hosted sign CSS missing');
assert(hosted.includes('temporary-platform-improvement-sign.js?v=20260917-1'), 'hosted sign runtime missing');
assert(local.includes('temporary-platform-improvement-sign.css?v=20260917-1'), 'local sign CSS missing');
assert(local.includes('temporary-platform-improvement-sign.js?v=20260917-1'), 'local sign runtime missing');

console.log('PASS: temporary platform improvement sign is mounted responsively in hosted and local editions until explicit removal.');
