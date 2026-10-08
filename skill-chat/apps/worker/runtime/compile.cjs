'use strict';
const fs = require('node:fs');
const path = require('node:path');
const CoffeeScript = require('/opt/runtime/coffeescript/lib/coffeescript');
const manifest = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const issues = [];
for (const file of manifest.files) {
  if (file.ext !== 'coffee') continue;
  try {
    const source = fs.readFileSync(path.join(manifest.input, file.path), 'utf8');
    const compiled = CoffeeScript.compile(source, {bare: true, filename: file.path});
    if (Buffer.byteLength(compiled) > 2 * 1024 * 1024) throw new Error('Compiled output exceeds limit');
    fs.writeFileSync(path.join(manifest.output, file.path + '.cjs'), compiled, {flag:'wx',mode:0o600});
  } catch (error) {
    issues.push({path:file.path,message:String(error.message).slice(0,2048)});
  }
}
process.stdout.write(JSON.stringify({issues}));
if (issues.length) process.exitCode = 1;
