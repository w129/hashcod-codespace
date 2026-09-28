const fs=require('fs'),assert=require('assert');

const css=fs.readFileSync('components/platform-loading-skeleton.css','utf8');
const js=fs.readFileSync('components/platform-loading-skeleton.js','utf8');
const html=fs.readFileSync('l8-html.php','utf8');

assert(css.includes('#hashcodPlatformSkeleton'),'full-platform skeleton root styling missing');
assert(css.includes('@keyframes hashcodPlatformSkeletonShimmer'),'skeleton shimmer animation missing');
assert(css.includes('@media(prefers-reduced-motion:reduce)'),'reduced-motion skeleton fallback missing');
assert(css.includes('grid-template-columns:minmax(0,1.35fr) minmax(300px,.65fr)'),'desktop skeleton layout missing');
assert(css.includes('@media(max-width:860px)'),'responsive skeleton layout missing');

assert(js.includes('var SHOW_DELAY=550'),'delayed skeleton threshold missing');
assert(js.includes('var MAX_WAIT=12000'),'skeleton watchdog missing');
assert(js.includes("window.addEventListener('hashcod:platform-entered',finish"),'platform-entered hide hook missing');
assert(js.includes("window.addEventListener('hashcod:platform-entry-complete',finish"),'platform-entry-complete hide hook missing');
assert(js.includes("document.addEventListener('DOMContentLoaded',readySoon"),'DOM ready hide hook missing');
assert(js.includes("window.addEventListener('load',finish"),'window load hide hook missing');
assert(js.includes('window.HashcodPlatformLoadingSkeleton'),'manual skeleton controller missing');

assert(html.includes('platform-loading-skeleton.css'),'skeleton CSS injection missing');
assert(html.includes('platform-loading-skeleton.js'),'skeleton runtime injection missing');
assert(html.includes('id="hashcodPlatformSkeleton"'),'skeleton markup missing from platform response');
assert(html.includes('hashcod-platform-skeleton-workspace'),'workspace skeleton block missing');
assert(html.includes('hashcod-platform-skeleton-sidebar'),'sidebar skeleton block missing');
assert(html.includes('Cargando Hashcod Codespace…'),'accessible loading status missing');
assert(html.includes("preg_match('/<body\\\\b[^>]*>/i'"),'skeleton must be inserted immediately after body opens');

console.log('PASS: delayed responsive Hashcod platform loading skeleton contract verified');
