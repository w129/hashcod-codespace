const fs = require('node:fs');
const path = require('node:path');
const source = path.join(__dirname, 'node_modules/pdfjs-dist');
const destination = path.join(__dirname, '../components/file-vault-pdf');
fs.mkdirSync(destination, { recursive: true });
fs.copyFileSync(path.join(source, 'build/pdf.worker.min.mjs'), path.join(destination, 'worker.js'));
for (const name of ['wasm', 'standard_fonts', 'cmaps']) {
  fs.cpSync(path.join(source, name), path.join(destination, name), { recursive: true });
}
fs.copyFileSync(path.join(source, 'LICENSE'), path.join(destination, 'LICENSE'));
