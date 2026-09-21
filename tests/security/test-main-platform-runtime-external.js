const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..','..');
const index=fs.readFileSync(path.join(root,'index.php'),'utf8');
const runtime=fs.readFileSync(path.join(root,'components','main-platform-runtime.js'),'utf8');
function assert(v,m){if(!v){console.error('FAIL:',m);process.exit(1);}}
assert(index.includes('components/main-platform-runtime.js?v=20260921-folderonly1'),'external main runtime tag missing');
assert(!index.includes('/* ===== SHARED DATA & COLUMNS CONFIGURATION ===== */'),'giant inline main runtime must not remain in index.php');
assert(runtime.includes('/* ===== SHARED DATA & COLUMNS CONFIGURATION ===== */'),'main runtime payload missing');
assert(runtime.includes('Hashes activos'),'account validation runtime missing');
assert(runtime.includes('BOOT: Rare UI folder only'),'folder-only boot runtime missing');
assert(!runtime.includes('<?php'),'external runtime must stay PHP-free');
console.log('Main platform runtime externalization contract passed.');

assert(!runtime.includes('presentBlackholeVisual()'), 'legacy blackhole runtime must stay retired');
assert(!runtime.includes('OriginkitBlackHole.create'), 'Originkit blackhole must not be initialized by the main runtime');
