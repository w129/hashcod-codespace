'use strict';

const fs=require('node:fs');
const assert=require('node:assert/strict');

const pkg=fs.readFileSync('toolbook-branched-menu-build/package.json','utf8');
const component=fs.readFileSync('toolbook-branched-menu-build/BranchedMenu.jsx','utf8');
const css=fs.readFileSync('toolbook-branched-menu-build/BranchedMenu.css','utf8');
const entry=fs.readFileSync('toolbook-branched-menu-build/entry.jsx','utf8');
const shell=fs.readFileSync('components/toolbook-page-blank.js','utf8');
const hosted=fs.readFileSync('l8-html.php','utf8');
const local=fs.readFileSync('laragon-local-entry.php','utf8');
const docker=fs.readFileSync('Dockerfile','utf8');

assert(pkg.includes('"@hugeicons/react": "1.1.9"'),'@hugeicons/react dependency missing');
assert(pkg.includes('"@hugeicons/core-free-icons": "4.3.5"'),'@hugeicons/core-free-icons dependency missing');
assert(pkg.includes('"react": "19.2.4"')&&pkg.includes('"react-dom": "19.2.4"'),'React dependencies missing');
assert(pkg.includes('toolbook-branched-menu.bundle.js'),'build output must be the Toolbook React island');

for(const icon of ['CursorPointer01Icon','Download04Icon','Layers01Icon','Notification03Icon','PaintBoardIcon','Rocket01Icon','Settings02Icon','TextFontIcon']){
  assert(component.includes(icon),`component source missing ${icon}`);
}
assert(component.includes("import { HugeiconsIcon } from '@hugeicons/react'"),'HugeiconsIcon React renderer missing');
assert(component.includes("import './BranchedMenu.css'"),'component CSS import missing');
assert(component.includes('useLayoutEffect')&&component.includes('ResizeObserver'),'original active marker layout behavior missing');
assert(component.includes('strokeDashoffset'),'original SVG reach animation missing');

for(const token of [
  '.branched-menu::before',
  '.branched-menu__marker[data-on]',
  '.branched-menu__section[data-open] .branched-menu__body',
  '.branched-menu__reach',
  'grid-template-rows: 1fr',
  'stroke-linecap: round',
  'color-mix(in srgb, var(--bm-ink) 55%, transparent)'
]){
  assert(css.includes(token),`component CSS missing: ${token}`);
}

assert(entry.includes("defaultOpen={[0]}"),'usage example defaultOpen must be [0]');
assert(entry.includes('defaultActive="quick"'),'usage example defaultActive must be quick');
for(const value of ['install','quick','config','buttons','overlays']){
  assert(entry.includes(`value: '${value}'`),`usage example item missing: ${value}`);
}
for(const prop of [
  'color="#f5f5f5"','accentColor="#f5f5f5"','lineColor="#3f3f46"','width={240}',
  'rowHeight={36}','indent={40}','trunk={14}','radius={10}','lineWidth={1.5}',
  'fontSize={14}','drawDuration={400}','foldDuration={300}'
]){
  assert(entry.includes(prop),`usage prop missing: ${prop}`);
}

assert(shell.includes("id='hashcodToolbookBranchedMenuMount'"),'blank workspace must expose React mount point');
assert(!shell.includes('branched-menu__item'),'blank workspace must not implement BranchedMenu manually');
assert(hosted.includes('toolbook-branched-menu.bundle.css?v=20261003-react1'),'hosted CSS bundle load missing');
assert(hosted.includes('toolbook-branched-menu.bundle.js?v=20261003-react1'),'hosted JS bundle load missing');
assert(local.includes('toolbook-branched-menu.bundle.css?v=20261003-react1'),'Laragon CSS bundle load missing');
assert(local.includes('toolbook-branched-menu.bundle.js?v=20261003-react1'),'Laragon JS bundle load missing');
assert(docker.includes('cd /var/www/html/toolbook-branched-menu-build'),'Docker React BranchedMenu build missing');

console.log('✓ Exact React BranchedMenu source/build contract verified');
