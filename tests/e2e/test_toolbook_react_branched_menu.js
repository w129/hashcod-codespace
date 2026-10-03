'use strict';

const fs=require('node:fs');
const assert=require('node:assert/strict');

const pkg=fs.readFileSync('toolbook-branched-menu-build/package.json','utf8');
const component=fs.readFileSync('toolbook-branched-menu-build/BranchedMenu.jsx','utf8');
const componentCss=fs.readFileSync('toolbook-branched-menu-build/BranchedMenu.css','utf8');
const entry=fs.readFileSync('toolbook-branched-menu-build/entry.jsx','utf8');
const fallbackCss=fs.readFileSync('components/toolbook-page-blank.css','utf8');
const blankJs=fs.readFileSync('components/toolbook-page-blank.js','utf8');
const hosted=fs.readFileSync('l8-html.php','utf8');
const local=fs.readFileSync('laragon-local-entry.php','utf8');
const docker=fs.readFileSync('Dockerfile','utf8');

assert(pkg.includes('"@hugeicons/react": "1.1.9"'),'@hugeicons/react dependency missing');
assert(pkg.includes('"@hugeicons/core-free-icons": "4.3.5"'),'@hugeicons/core-free-icons dependency missing');
assert(pkg.includes('"react": "19.2.4"')&&pkg.includes('"react-dom": "19.2.4"'),'React dependencies missing');
assert(pkg.includes('--jsx=automatic'),'automatic JSX runtime is required');

assert(component.includes("import { HugeiconsIcon } from '@hugeicons/react'"),'Hugeicons React renderer missing');
assert(component.includes("import './BranchedMenu.css'"),'BranchedMenu.css import missing');
assert(component.includes('useLayoutEffect')&&component.includes('ResizeObserver'),'source marker/layout behavior missing');
assert(component.includes('strokeDashoffset'),'source SVG animation behavior missing');

for(const selector of [
  '.branched-menu::before',
  '.branched-menu__marker[data-on]',
  '.branched-menu__section[data-open] .branched-menu__body',
  '.branched-menu__reach',
  '.branched-menu__item[data-active]'
]){
  assert(componentCss.includes(selector),`component CSS missing ${selector}`);
  assert(fallbackCss.includes(selector),`always-loaded fallback CSS missing ${selector}`);
}

for(const prop of [
  'defaultOpen={[0]}','defaultActive="quick"','color="#f5f5f5"','accentColor="#f5f5f5"',
  'lineColor="#3f3f46"','width={240}','rowHeight={36}','indent={40}','trunk={14}',
  'radius={10}','lineWidth={1.5}','fontSize={14}','drawDuration={400}','foldDuration={300}'
]){
  assert(entry.includes(prop),`usage example prop missing ${prop}`);
}

assert(blankJs.includes("id='hashcodToolbookBranchedMenuMount'"),'Toolbook screen must create the React mount point');
assert(blankJs.includes("bodyObserver.observe(document.body,{childList:true})"),'Toolbook guard must not observe/remove React subtree children');
assert(hosted.includes('toolbook-branched-menu.bundle.js?v=20261003-react2'),'hosted React bundle fallback missing');
assert(local.includes('toolbook-branched-menu.bundle.js?v=20261003-react2'),'Laragon React bundle fallback missing');
assert(hosted.includes('toolbook-page-blank.css?v=20261003-react2'),'hosted fallback CSS cache-bust missing');
assert(local.includes('toolbook-page-blank.css?v=20261003-react2'),'Laragon fallback CSS cache-bust missing');
assert(docker.includes('cd /var/www/html/toolbook-branched-menu-build'),'production Docker build missing');

console.log('✓ React BranchedMenu source, mount and fail-safe styling contract verified');
