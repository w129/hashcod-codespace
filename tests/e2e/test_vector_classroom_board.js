const fs = require('fs');
const path = require('path');
const assert = require('assert');

const repoDir = path.resolve(__dirname, '../..');
const source = fs.readFileSync(path.join(repoDir, 'components/vector-classroom-board.js'), 'utf8');
const css = fs.readFileSync(path.join(repoDir, 'components/vector-classroom-board.css'), 'utf8');
const icon = fs.readFileSync(path.join(repoDir, 'components/classroom-board-icon.svg'), 'utf8');
const rightIcon = fs.readFileSync(path.join(repoDir, 'components/classroom-board-icon-right.svg'), 'utf8');
const thirdIcon = fs.readFileSync(path.join(repoDir, 'components/classroom-board-icon-third.svg'), 'utf8');
const fourthIcon = fs.readFileSync(path.join(repoDir, 'components/classroom-board-icon-fourth.svg'), 'utf8');
const thirdTrayIcon = fs.readFileSync(path.join(repoDir, 'components/vector-tray-icon-third.svg'), 'utf8');
const loader = fs.readFileSync(path.join(repoDir, 'components/admin-hello-button.js'), 'utf8');

assert(source.includes("const TOOL_ID = 'store-module'"), 'second tray tool identity missing');
assert(source.includes('const SLOT = 1'), 'classroom board must be attached to the second tray cube');
assert(source.includes("slot: SLOT"), 'classroom board registration missing');
assert(source.includes('onClick: openBoard'), 'second tray cube must open the classroom board');
assert(source.includes('hashcodClassroomBoardOverlay'), 'classroom board overlay missing');
assert(source.includes('hashcod-classroom-board-frame'), 'school-style board frame missing');
assert(source.includes('hashcod-classroom-board-surface'), 'board surface missing');
assert(source.includes('<h2 id="hashcodClassroomBoardTitle">Mercado de precios</h2>'), 'Mercado de precios heading missing');
assert(source.includes("label: 'Mercado de precios'"), 'Mercado de precios tray label missing');
assert(source.includes('aria-label="Mercado de precios"'), 'Mercado de precios accessible label missing');
assert(source.includes('hashcod-classroom-board-emblems'), 'board icon row markup missing');
assert(source.includes('hashcod-classroom-board-emblem-right'), 'right board icon markup missing');
assert(source.includes('hashcod-classroom-board-emblem-third'), 'third board icon markup missing');
assert(source.includes('hashcod-classroom-board-emblem-fourth'), 'fourth board icon markup missing');
assert(source.includes("/components/classroom-board-icon.svg?v=20260911-1"), 'first board icon asset path missing');
assert(source.includes("/components/classroom-board-icon-right.svg?v=20260911-1"), 'second board icon asset path missing');
assert(source.includes("/components/classroom-board-icon-third.svg?v=20260911-1"), 'third board icon asset path missing');
assert(source.includes("/components/classroom-board-icon-fourth.svg?v=20260911-1"), 'fourth board icon asset path missing');
assert(source.includes('0.15 BTC'), 'first BTC value missing');
assert(source.includes('0.015 BTC'), 'second BTC value missing');
assert(source.includes('0.22 BTC'), 'third BTC value missing');
assert(source.includes('0.05 BTC'), 'fourth BTC value missing');
assert(source.includes('window.HashcodClassroomBoard'), 'board public API missing');

assert(source.includes("const THIRD_TRAY_ICON_SRC = '/components/vector-tray-icon-third.svg?v=20260911-1'"), 'third tray icon asset path missing');
assert(source.includes('slot: 2'), 'third tray cube registration missing');
assert(source.includes("id: 'grid-module'"), 'third tray tool identity missing');
assert(source.includes("label: 'Módulo de cuadrícula — función pendiente'"), 'third tray placeholder label missing');
assert(source.includes("iconSvg: '<img src=\"' + THIRD_TRAY_ICON_SRC"), 'third tray icon markup missing');
assert(!source.includes("id: 'grid-module',\n            label: 'Módulo de cuadrícula — función pendiente',\n            onClick:"), 'third tray tool must remain without behavior until requested');
assert(thirdTrayIcon.includes('viewBox="0 0 256 256"'), 'third tray SVG viewBox missing');
assert(thirdTrayIcon.includes('color-4_gPS47EOOeWUd_gr4'), 'third tray SVG gradients missing');
assert(thirdTrayIcon.includes('transform="scale(4,4)"'), 'third tray SVG geometry missing');

assert(css.includes('.hashcod-classroom-board-surface'), 'board surface style missing');
assert(css.includes('#e1e1e1'), 'board surface must use #e1e1e1');
assert(css.includes('.hashcod-classroom-board-frame'), 'board frame style missing');
assert(css.includes('#252424'), 'board frame must use #252424');
assert(css.includes('.hashcod-classroom-board-emblems'), 'board icon row style missing');
assert(css.includes('display: flex'), 'board top icons must share a horizontal row');
assert(css.includes('left: 50%'), 'board icon row must be horizontally aligned');
assert(css.includes('.hashcod-classroom-board-emblem-value'), 'BTC value style missing');
assert(css.includes('.hashcod-classroom-board-rail'), 'school-style lower rail missing');

assert(icon.includes('viewBox="0 0 135 135"'), 'first board SVG viewBox missing');
assert(icon.includes('<path d="M 67.5 5.3007812'), 'first board SVG path missing');
assert(rightIcon.includes('viewBox="0 0 135 135"'), 'second board SVG viewBox missing');
assert(rightIcon.includes('<path d="M 67.5 5.3007812'), 'second board SVG path missing');
assert(thirdIcon.includes('viewBox="0 0 135 135"'), 'third board SVG viewBox missing');
assert(thirdIcon.includes('<path d="M 67.5 5.1992188'), 'third board SVG path missing');
assert(fourthIcon.includes('viewBox="0 0 135 135"'), 'fourth board SVG viewBox missing');
assert(fourthIcon.includes('<path d="M 67.5 5.3007812'), 'fourth board SVG path missing');

assert(loader.includes("vector-classroom-board.css?v=20260911-2"), 'classroom board stylesheet is not loaded with current version');
assert(loader.includes("vector-classroom-board.js?v=20260911-2"), 'classroom board script is not loaded with current version');

console.log('vector classroom board contract: OK');
