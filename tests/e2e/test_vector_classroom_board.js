const fs = require('fs');
const path = require('path');
const assert = require('assert');

const repoDir = path.resolve(__dirname, '../..');
const source = fs.readFileSync(path.join(repoDir, 'components/vector-classroom-board.js'), 'utf8');
const css = fs.readFileSync(path.join(repoDir, 'components/vector-classroom-board.css'), 'utf8');
const loader = fs.readFileSync(path.join(repoDir, 'components/admin-hello-button.js'), 'utf8');

assert(source.includes("const TOOL_ID = 'store-module'"), 'second tray tool identity missing');
assert(source.includes('const SLOT = 1'), 'classroom board must be attached to the second tray cube');
assert(source.includes("slot: SLOT"), 'classroom board registration missing');
assert(source.includes('onClick: openBoard'), 'second tray cube must open the classroom board');
assert(source.includes('hashcodClassroomBoardOverlay'), 'classroom board overlay missing');
assert(source.includes('hashcod-classroom-board-frame'), 'school-style board frame missing');
assert(source.includes('hashcod-classroom-board-surface'), 'board surface missing');
assert(source.includes('window.HashcodClassroomBoard'), 'board public API missing');

assert(css.includes('.hashcod-classroom-board-surface'), 'board surface style missing');
assert(css.includes('#e1e1e1'), 'board surface must use #e1e1e1');
assert(css.includes('.hashcod-classroom-board-frame'), 'board frame style missing');
assert(css.includes('#252424'), 'board frame must use #252424');
assert(css.includes('.hashcod-classroom-board-rail'), 'school-style lower rail missing');

assert(loader.includes("vector-classroom-board.css?v=20260911-1"), 'classroom board stylesheet is not loaded');
assert(loader.includes("vector-classroom-board.js?v=20260911-1"), 'classroom board script is not loaded');

console.log('vector classroom board contract: OK');
