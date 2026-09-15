const fs = require('fs');
const path = require('path');
const Babel = require('../vendor/babel.min.js');

const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'app', 'build');
const entries = [
  ['tweaks-panel.jsx', 'tweaks-panel.js'],
  ['app/tech-info.jsx', 'tech-info.js'],
  ['app/vault.jsx', 'vault.js'],
  ['app/tour.jsx', 'tour.js'],
  ['app/app.jsx', 'app.js'],
  ['app/root.jsx', 'root.js'],
];

fs.mkdirSync(outDir, { recursive: true });

for (const [input, output] of entries) {
  const source = fs.readFileSync(path.join(root, input), 'utf8');
  const compiled = Babel.transform(source, {
    presets: ['react'],
    sourceType: 'script',
    comments: false,
    compact: false,
  }).code;
  // Classic browser scripts share one lexical scope. Keep each compiled entry
  // isolated and expose only the explicit window exports defined by the source.
  fs.writeFileSync(path.join(outDir, output), `(function () {\n${compiled}\n})();\n`);
  console.log(`built ${input} -> app/build/${output}`);
}
