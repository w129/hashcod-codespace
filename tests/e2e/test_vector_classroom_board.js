const fs = require('fs');
const path = require('path');
const assert = require('assert');

const repoDir = path.resolve(__dirname, '../..');
const source = fs.readFileSync(path.join(repoDir, 'components/vector-classroom-board.js'), 'utf8');
const css = fs.readFileSync(path.join(repoDir, 'components/vector-classroom-board.css'), 'utf8');
const icon = fs.readFileSync(path.join(repoDir, 'components/classroom-board-icon.svg'), 'utf8');
const loader = fs.readFileSync(path.join(repoDir, 'components/admin-hello-button.js'), 'utf8');

assert(source.includes("const TOOL_ID = 'store-module'"), 'second tray tool identity missing');
assert(source.includes('const SLOT = 1'), 'classroom board must be attached to the second tray cube');
assert(source.includes("slot: SLOT"), 'classroom board registration missing');
assert(source.includes('onClick: openBoard'), 'second tray cube must open the classroom board');
assert(source.includes('hashcodClassroomBoardOverlay'), 'classroom board overlay missing');
assert(source.includes('hashcod-classroom-board-frame'), 'school-style board frame missing');
assert(source.includes('hashcod-classroom-board-surface'), 'board surface missing');
assert(source.includes('hashcod-classroom-board-emblem'), 'board top icon markup missing');
assert(source.includes("/components/classroom-board-icon.svg?v=20260911-1"), 'board icon asset path missing');
assert(source.includes('window.HashcodClassroomBoard'), 'board public API missing');

assert(css.includes('.hashcod-classroom-board-surface'), 'board surface style missing');
assert(css.includes('#e1e1e1'), 'board surface must use #e1e1e1');
assert(css.includes('.hashcod-classroom-board-frame'), 'board frame style missing');
assert(css.includes('#252424'), 'board frame must use #252424');
assert(css.includes('.hashcod-classroom-board-emblem'), 'board top icon style missing');
assert(css.includes('left: 50%'), 'board top icon must be horizontally aligned');
assert(css.includes('.hashcod-classroom-board-rail'), 'school-style lower rail missing');

assert(icon.includes('viewBox="0 0 135 135"'), 'replacement board SVG viewBox missing');
assert(icon.includes('<path d="M 67.5 5.3007812'), 'replacement board SVG path missing');

assert(loader.includes("vector-classroom-board.css?v=20260911-2"), 'classroom board stylesheet is not loaded with current version');
assert(loader.includes("vector-classroom-board.js?v=20260911-2"), 'classroom board script is not loaded with current version');

console.log('vector classroom board contract: OK');
