const fs = require('fs');
const path = require('path');
const assert = require('assert');

const repoDir = path.resolve(__dirname, '../..');
const css = fs.readFileSync(path.join(repoDir, 'components/mobile-platform-polish.css'), 'utf8');
const loader = fs.readFileSync(path.join(repoDir, 'components/vector-classroom-board.js'), 'utf8');

assert(css.includes('@media (max-width: 760px), (hover: none) and (pointer: coarse) and (max-width: 900px)'), 'phone media query missing');
assert(css.includes('env(safe-area-inset-bottom)'), 'safe-area handling missing');
assert(css.includes('font-size: 16px !important'), 'mobile input anti-zoom rule missing');

assert(css.includes('html body.mobile-mode #authOverlay #hashcodVectorTray'), 'mobile tray override missing');
assert(css.includes('display: block !important'), 'mobile tray must remain visible');
assert(css.includes('grid-template-columns: repeat(6, minmax(0, 1fr))'), 'six-slot phone dock layout missing');
assert(css.includes('min-height: 48px !important'), 'touch-size tray buttons missing');

assert(css.includes('#groqAuthChatPanel'), 'mobile AI chat layout missing');
assert(css.includes('#hashcodImageVaultOverlay'), 'Collection gallery mobile layout missing');
assert(css.includes('#hashcodClassroomBoardOverlay'), 'Mercado de precios mobile layout missing');
assert(css.includes('#hashcodLinkBoardOverlay'), 'link board mobile layout missing');
assert(css.includes('grid-template-columns: repeat(5, minmax(48px, 1fr))'), 'phone link board grid missing');
assert(css.includes('.hashcod-link-board-dialog'), 'phone link editor sheet missing');
assert(css.includes('.hashcod-image-vault-code-dialog'), 'phone gallery code sheet missing');
assert(css.includes('body:has(.privacy-container)'), 'privacy mobile layout missing');
assert(css.includes('@media (max-height: 500px) and (orientation: landscape)'), 'landscape phone adjustments missing');

assert(loader.includes("mobile.id = 'mobilePlatformPolishStylesheet'"), 'mobile stylesheet loader id missing');
assert(loader.includes("mobile.href = '/components/mobile-platform-polish.css?v=20260911-1'"), 'mobile stylesheet loader path missing');

console.log('mobile platform polish contract: OK');
