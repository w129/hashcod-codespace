'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const repoDir = path.resolve(__dirname, '../..');
const svg = fs.readFileSync(path.join(repoDir, 'assets/plataforma-en-mejora.svg'), 'utf8');
const hosted = fs.readFileSync(path.join(repoDir, 'l8-html.php'), 'utf8');
const local = fs.readFileSync(path.join(repoDir, 'laragon-local-entry.php'), 'utf8');

assert(svg.includes('viewBox="0 0 1080 1080"'), 'uploaded improvement SVG viewBox changed');
assert(svg.includes('assetClipPath_j9OOX5od'), 'uploaded improvement SVG paths missing');
assert(hosted.includes("$temporaryImprovementSvgPath = __DIR__ . '/assets/plataforma-en-mejora.svg'"), 'hosted entry must inline the exact uploaded SVG');
assert(hosted.includes('hashcod-platform-improvement-inline-style'), 'hosted inline sign style missing');
assert(hosted.includes('data-hashcod-auth-slot-replacement="true"'), 'hosted sign must explicitly replace the retired auth slot');
assert(hosted.includes('left:63vw!important'), 'hosted desktop auth-slot placement missing');
assert(hosted.includes('z-index:2147483590!important'), 'hosted sign must render above the entry-hold surface');
assert(hosted.includes('display:none!important'), 'hosted sign must stay hidden during the first two screens');
assert(hosted.includes('data-hashcod-final-entry-screen="true"] #hashcodPlatformImprovementSign{display:flex!important'), 'hosted sign must reveal only on the final screen');
assert(hosted.includes('pointer-events:none!important'), 'hosted sign must not block the platform');
assert(hosted.includes('$temporaryImprovementSignTag'), 'hosted server-rendered sign markup missing');

assert(local.includes("$temporaryImprovementSvgPath = __DIR__ . '/assets/plataforma-en-mejora.svg'"), 'local entry must inline the exact uploaded SVG');
assert(local.includes('hashcod-platform-improvement-inline-style'), 'local inline sign style missing');
assert(local.includes('display:none!important'), 'local sign must stay hidden during the first two screens');
assert(local.includes('data-hashcod-final-entry-screen="true"] #hashcodPlatformImprovementSign{display:flex!important'), 'local sign must reveal only on the final screen');
assert(local.includes('data-hashcod-auth-slot-replacement="true"'), 'local sign must explicitly replace the retired auth slot');
assert(local.includes('$temporaryImprovementSignTag'), 'local server-rendered sign markup missing');

assert(!hosted.includes('components/temporary-platform-improvement-sign.js?v='), 'hosted sign must not depend on deferred runtime');
assert(!local.includes('components/temporary-platform-improvement-sign.js?v='), 'local sign must not depend on deferred runtime');

console.log('PASS: exact temporary improvement SVG is server-rendered directly into the retired authentication slot in hosted and local editions.');
