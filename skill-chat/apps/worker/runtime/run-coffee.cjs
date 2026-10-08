'use strict';
const fs = require('node:fs');
const manifest = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
Promise.resolve().then(() => {
  const tool = require(manifest.compiled);
  if (!tool || typeof tool.run !== 'function') throw new Error('Tool must export run(args)');
  return tool.run(manifest.args);
}).then(result => process.stdout.write(JSON.stringify(result === undefined ? null : result)))
  .catch(() => { process.stderr.write('Tool execution failed'); process.exitCode = 1; });
